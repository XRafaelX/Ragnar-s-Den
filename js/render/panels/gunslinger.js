/* ---------------- Gunslinger class (Spikael's homebrew) on the sheet ----------------
   Vitals: the buttons under two of its rows on the Class resources card:
   Quick Patch (level 9): heal yourself 1d8 + WIS while you have less than
   half your hit points (spends your own use), or roll it for an ally
   (once per ally per long rest, which the sheet can't see).
   Honed Instinct (level 15): a Perception check with your Wisdom score
   in place of the d20, once per long rest.
   Inventory: the round loaded in a class firearm (its card), and the
   Bulletsmith card that crafts rounds (Novice, Handy, Elemental and
   Occult Bulletsmith). */
import { save } from "../../core/state.js";
import { clamp, mod, fmtMod, maxHp, skillCheck, profBonus, classLevelOf, roundStacks, loadedRound, takesHeavyRounds, roundsHaveNoType, canRigRound, roundRigged, RIGGED_ROUND_NOTE, hasApplyingPressure, enchantmentOf, setEnchantment } from "../../core/helpers.js";
import { ROUND_KINDS, ROUND_ELEMENTS, HEAVY_ROUND_DAMAGE, FIREARM_ENCHANTMENTS, roundBatchSize, roundStackName } from "../../data/gunslinger-rounds.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { SPELL_DATA } from "../../data/spells.js";
import { spendCoins } from "../../core/coins.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { abilityScore } from "../../core/ability-scores.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeDiceSvg, makeStatArrowSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { rollCheck } from "./sheet-rolls.js";

function rowOf(){
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  return row;
}
function button(row, text, title, disabled, onClick, dice){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn";
  if(dice) b.innerHTML = makeDiceSvg();
  b.appendChild(document.createTextNode(text));
  b.title = title;
  b.disabled = !!disabled;
  b.addEventListener("click", onClick);
  row.appendChild(b);
  return b;
}

/* The row's buttons, or null for any other resource. r is the resource
   (characterResources), its key "Gunslinger:...". */
export function gunslingerResourceRow(c, r){
  if(r.key==="Gunslinger:quick_patch") return quickPatchRow(c, r);
  if(r.key==="Gunslinger:honed_instinct") return honedInstinctRow(c, r);
  if(r.key==="Gunslinger:bullet_ward") return bulletWardRow(c, r);
  return null;
}

function quickPatchRow(c, r){
  var wis = mod(abilityScore(c, "wis")), dice = "1d8" + fmtMod(wis), row = rowOf();
  var hp = Number(c.hp.current)||0, max = maxHp(c), left = r.max - r.used;
  var low = hp > 0 && hp < max / 2;
  button(row, "Patch yourself " + dice,
    left <= 0 ? "Used on yourself until a long rest" : !low ? "Only while you have less than half your hit points" : "Bonus action: regain " + dice + " hit points",
    left <= 0 || !low, function(){
      c.resourcesUsed[r.key] = r.used + 1;
      performRoll(8, 1, wis, "none", "Quick Patch (yourself)", {onResult: function(x){
        var healed = Math.max(0, x.total);
        c.hp.current = clamp((Number(c.hp.current)||0) + healed, 0, maxHp(c));
        save(); renderAll();
      }});
      save(); renderAll();
    }, true);
  button(row, "Patch an ally " + dice, "Bonus action: an ally with less than half its hit points regains " + dice + ". Once per ally per long rest.", false, function(){
    performRoll(8, 1, wis, "none", "Quick Patch (an ally)");
  }, true);
  return row;
}

function honedInstinctRow(c, r){
  var wis = abilityScore(c, "wis"), check = skillCheck(c, "Perception").value, total = wis + check, row = rowOf();
  var left = r.max - r.used;
  button(row, "Perception " + total, left <= 0 ? "Used until a long rest" : "Skip the roll: your Wisdom score (" + wis + ") " + fmtMod(check) + " for Perception", left <= 0, function(){
    c.resourcesUsed[r.key] = r.used + 1;
    logRoll("Perception (Honed Instinct)", "Wisdom score " + wis + " " + fmtMod(check) + " = " + total + ", no roll.");
    save(); renderAll();
  });
  return row;
}

/* Bullet Ward (Eldritch Gunman): temporary hit points don't stack, so
   you keep the higher. An ally's use just rolls. */
function bulletWardRow(c, r){
  var int = mod(abilityScore(c, "int")), dice = "1d8" + fmtMod(int), row = rowOf(), left = r.max - r.used;
  button(row, "Ward yourself " + dice, left <= 0 ? "None left until a short or long rest" : "Spend one and gain " + dice + " temporary hit points", left <= 0, function(){
    c.resourcesUsed[r.key] = r.used + 1;
    performRoll(8, 1, int, "none", "Bullet Ward (yourself)", {onResult: function(x){
      if(x.total > (Number(c.hp.temp)||0)) c.hp.temp = x.total;
      save(); renderAll();
    }});
    save(); renderAll();
  }, true);
  button(row, "Ward an ally " + dice, left <= 0 ? "None left until a short or long rest" : "Spend one: an ally gains " + dice + " temporary hit points", left <= 0, function(){
    c.resourcesUsed[r.key] = r.used + 1;
    performRoll(8, 1, int, "none", "Bullet Ward (an ally)");
    save(); renderAll();
  }, true);
  return row;
}

/* ---- Firearm Enchantment: picked in a bottom sheet ---- */
export function openEnchantSheet(c, item, done){
  openBottomSheet(function(body, refresh, close){
    var h = document.createElement("h3");
    h.className = "enchant-title";
    h.textContent = "Enchant " + (item.name || "this firearm");
    body.appendChild(h);
    var lead = document.createElement("p");
    lead.className = "bs-lead";
    lead.textContent = "A 1-hour ritual, which can be a short rest. Only one firearm holds an enchantment, so this moves it from any other.";
    body.appendChild(lead);
    var list = document.createElement("div");
    list.className = "enchant-list";
    var current = enchantmentOf(c, item);
    FIREARM_ENCHANTMENTS.forEach(function(e){
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "enchant-tile" + (current && current.id===e.id ? " selected" : "");
      tile.setAttribute("aria-pressed", String(!!current && current.id===e.id));
      var name = document.createElement("strong");
      name.textContent = e.name;
      var text = document.createElement("span");
      text.textContent = e.text;
      tile.appendChild(name); tile.appendChild(text);
      tile.addEventListener("click", function(){
        setEnchantment(c, item, e.id);
        logRoll("Firearm Enchantment", (item.name || "The firearm") + " now holds " + e.name + ".");
        close(); save(); done();
      });
      list.appendChild(tile);
    });
    body.appendChild(list);
    if(current){
      var end = document.createElement("div");
      end.className = "inv-roll-actions";
      button(end, "Remove the enchantment", "It becomes an ordinary firearm again", false, function(){
        setEnchantment(c, item, "");
        close(); save(); done();
      });
      body.appendChild(end);
    }
  });
}

/* ---- The loaded round, on a class firearm's card ---- */
function stackValue(s){ return [s.round, s.element || "", s.spell || ""].join("|"); }

/* What a class firearm can load: a plain shot, then the carried stacks that
   fit it, or with Master of the Barrel any kind from one shared count (spell
   rounds stay their own). */
function roundChoices(c, item){
  var stacks = roundStacks(c, item), heavy = takesHeavyRounds(item);
  var out = [{name: "Plain shot"}];
  function fromStack(s){ return {kind: s.round, element: s.element || "", spell: s.spell || "", name: s.name, left: Number(s.qty)||0}; }
  if(roundsHaveNoType(c)){
    var any = stacks.filter(function(s){ return s.round!=="spell"; }).reduce(function(n, s){ return n + (Number(s.qty)||0); }, 0);
    Object.keys(ROUND_KINDS).forEach(function(k){
      if(k!=="spell") out.push({kind: k, name: roundStackName(k, heavy), left: any});
    });
    stacks.filter(function(s){ return s.round==="spell"; }).forEach(function(s){ out.push(fromStack(s)); });
    return out;
  }
  var seen = {};
  stacks.forEach(function(s){
    var v = stackValue(s);
    if(seen[v]) return;
    seen[v] = true;
    out.push(fromStack(s));
  });
  return out;
}
/* Is this the choice the gun holds? An elemental stack without a type of
   its own matches the round whatever type it was loaded as. */
function isLoadedChoice(choice, r){
  if(!choice.kind || !r) return !choice.kind && !r;
  return choice.kind===r.kind && (choice.spell || "")===(r.spell || "") && (!choice.element || choice.element===r.element);
}

/* The Round line: what's loaded and how many are left, opening the sheet
   that changes it, with Rig it beside it and a line on what the round does.
   null for any other weapon, or with nothing to load. */
export function gunRoundRow(c, item, redraw){
  if(item.firearmSet!=="gunslinger") return null;
  var choices = roundChoices(c, item), round = loadedRound(c, item), canRig = canRigRound(c);
  if(choices.length < 2 && !round && !canRig) return null;
  var wrap = document.createElement("div");
  wrap.className = "gun-round";
  var row = document.createElement("div");
  row.className = "gun-round-pickers";
  if(choices.length > 1 || round){
    var r = round && item.round, held = choices.find(function(ch){ return isLoadedChoice(ch, r); });
    var name = round ? (round.element ? roundStackName(round.kind, round.heavy, round.element) : held ? held.name : roundStackName(round.kind, round.heavy, "", round.spell)) : held.name;
    var left = round ? (held ? held.left + " left" : "None left") : "";
    var pick = document.createElement("button");
    pick.type = "button";
    pick.className = "gun-round-pick";
    pick.setAttribute("aria-label", "Round loaded in the " + (item.name || "firearm") + ": " + name + (left ? ", " + left : "") + ". Change it");
    pick.title = "Choose what this gun fires";
    var nameEl = document.createElement("span");
    nameEl.className = "gun-round-name";
    nameEl.textContent = name;
    pick.appendChild(nameEl);
    if(left){
      var leftEl = document.createElement("span");
      leftEl.className = "gun-round-left";
      leftEl.textContent = left;
      pick.appendChild(leftEl);
    }
    pick.insertAdjacentHTML("beforeend", makeStatArrowSvg("down"));
    pick.addEventListener("click", function(){ openRoundSheet(c, item, redraw); });
    row.appendChild(pick);
  }
  // Playing Dirty (Outlaw 14): rig the next shot.
  if(canRig){
    var rig = document.createElement("div");
    rig.className = "inv-roll-actions gun-rig";
    button(rig, roundRigged(c, item) ? "Don't rig it" : "Rig it", "Once per turn: the next shot is a blinding flash", false, function(){
      if(item.rigged) delete item.rigged; else item.rigged = true;
      redraw();
    });
    row.appendChild(rig);
  }
  wrap.appendChild(row);
  var note = roundRigged(c, item) ? RIGGED_ROUND_NOTE : roundNote(c, round);
  if(note){
    var p = document.createElement("p");
    p.className = "inv-armor-note gun-round-note";
    p.textContent = note;
    wrap.appendChild(p);
  }
  return wrap;
}

/* What a choice does, for its tile in the sheet. */
function roundEffect(c, item, choice){
  if(!choice.kind) return "The gun's own " + (item.damageType || "Piercing").toLowerCase() + " shot.";
  var def = ROUND_KINDS[choice.kind];
  if(def.spell) return roundNote(c, {def: def, spell: choice.spell});
  var text = def.elemental
    ? (choice.element ? "Deals " + choice.element.toLowerCase() + " damage." : "Pick its damage type when you load it: " + ROUND_ELEMENTS.join(", ").toLowerCase() + ".")
    : def.note || "Deals " + def.damageType.toLowerCase() + " damage.";
  return text + (takesHeavyRounds(item) && !def.noDamage ? " Heavy: +" + HEAVY_ROUND_DAMAGE + " damage, and a die more on a critical hit." : "");
}

/* Loading a round: a tile per choice in a bottom sheet. An elemental round
   with no type of its own asks for one before it's loaded. */
function openRoundSheet(c, item, done){
  var asking = null;
  openBottomSheet(function(body, refresh, close){
    function load(choice, element){
      if(!choice.kind) delete item.round;
      else {
        item.round = {kind: choice.kind};
        if(element) item.round.element = element;
        if(choice.spell) item.round.spell = choice.spell;
      }
      close(); save(); done();
    }
    var h = document.createElement("h3");
    h.className = "enchant-title";
    body.appendChild(h);
    if(asking){
      var chosen = asking;
      h.textContent = "Pick the damage type";
      var grid = document.createElement("div");
      grid.className = "round-element-grid";
      ROUND_ELEMENTS.forEach(function(el){
        var on = !!item.round && item.round.kind===chosen.kind && item.round.element===el;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "enchant-tile round-element" + (on ? " selected" : "");
        b.setAttribute("aria-pressed", String(on));
        b.textContent = el;
        b.addEventListener("click", function(){ load(chosen, el); });
        grid.appendChild(b);
      });
      body.appendChild(grid);
      var back = document.createElement("div");
      back.className = "inv-roll-actions";
      button(back, "Back", "Choose a different round", false, function(){ asking = null; refresh(); });
      body.appendChild(back);
      return;
    }
    h.textContent = "Load the " + (item.name || "firearm");
    var list = document.createElement("div");
    list.className = "enchant-list";
    var r = loadedRound(c, item) && item.round;
    roundChoices(c, item).forEach(function(choice){
      var on = isLoadedChoice(choice, r);
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "enchant-tile" + (on ? " selected" : "");
      tile.setAttribute("aria-pressed", String(on));
      var head = document.createElement("span");
      head.className = "round-tile-head";
      var name = document.createElement("strong");
      name.textContent = choice.name;
      head.appendChild(name);
      if(choice.kind){
        var left = document.createElement("span");
        left.className = "round-tile-left";
        left.textContent = choice.left + " left";
        head.appendChild(left);
      }
      var text = document.createElement("span");
      text.textContent = roundEffect(c, item, choice);
      tile.appendChild(head); tile.appendChild(text);
      tile.addEventListener("click", function(){
        if(choice.kind && ROUND_KINDS[choice.kind].elemental && !choice.element){ asking = choice; refresh(); return; }
        load(choice, choice.element);
      });
      list.appendChild(tile);
    });
    body.appendChild(list);
  });
}
function roundNote(c, round){
  if(!round) return "";
  if(round.def.spell){
    var dex = mod(abilityScore(c, "dex")), pb = profBonus(c);
    return "Firing it casts " + round.spell + " with Dexterity: spell save DC " + (8 + pb + dex) + ", spell attack " + fmtMod(pb + dex) + ".";
  }
  if(round.def.elemental && !round.element) return "Pick its damage type before you fire.";
  return round.note;
}

/* Applying Pressure (Marshal 3): on a firearm's card, the Insight check
   against the target's Deception. null for anyone else. */
export function pressureButton(c, item){
  if(!hasApplyingPressure(c, item)) return null;
  var check = skillCheck(c, "Insight"), entry = (c.skillProfs || {}).Insight || {};
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn inv-fury-btn";
  b.innerHTML = makeDiceSvg();
  b.appendChild(document.createTextNode("Pressure " + fmtMod(check.value)));
  b.title = "A bonus action after a firearm hit: your Insight against the target's Deception. If you win, the next attack against it has advantage.";
  b.addEventListener("click", function(){
    rollCheck(c, check.value, check.roll.mode, "Applying Pressure (Insight)", "wis", {proficient: !!entry.prof, skill: "Insight"});
  });
  return b;
}

/* ---- The Bulletsmith card (Inventory tab) ---- */
var plan = {};   // character id -> {heavy, counts: {kind: n}, scroll, spell}
function planFor(c){
  return plan[c.id] || (plan[c.id] = {heavy: false, counts: {}, scroll: "", spell: ""});
}
function addRounds(c, kind, heavy, n, spell){
  var have = (c.inventory||[]).find(function(i){ return i.round===kind && !!i.heavy===heavy && !i.element && (i.spell||"")===(spell||""); });
  if(have) have.qty = (Number(have.qty)||0) + n;
  else {
    var stack = {name: roundStackName(kind, heavy, "", spell), type: "gear", qty: n, equipped: false, weight: 0, round: kind,
      notes: kind==="elemental" ? "Pick its damage type when you load it." : ""};
    if(heavy) stack.heavy = true;
    if(spell) stack.spell = spell;
    c.inventory.push(stack);
  }
}
function payGold(c, gp){
  var res = spendCoins(c.currency || {}, "gp", gp);
  if(!res.ok){ showActionToast("Not enough coin: crafting costs " + gp + " gp.", true); return false; }
  c.currency = res.purse;
  return true;
}

export function bulletsmithCard(c, refresh){
  var lv = classLevelOf(c, "Gunslinger");
  if(!lv) return null;
  var st = planFor(c), batch = roundBatchSize(lv), cost = st.heavy ? 4 : 2, hours = st.heavy ? 4 : 2;
  var card = makeCard("Bulletsmith");
  card.classList.add("bulletsmith-card");
  var lead = document.createElement("p");
  lead.className = "bs-lead";
  lead.textContent = "With your tinker's tools, craft up to " + batch + " rounds at a time in any mix: " + hours + " hours and " + cost + " gp.";
  card.appendChild(lead);
  // Plain or heavy (twice as long, twice the gold).
  var kinds = document.createElement("div");
  kinds.className = "bs-weight";
  [["Plain rounds", false], ["Heavy rounds", true]].forEach(function(o){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small" + (st.heavy===o[1] ? " primary" : "");
    b.textContent = o[0];
    b.setAttribute("aria-pressed", String(st.heavy===o[1]));
    b.title = o[1] ? "For the Handcannon and Long Gun. +3 damage, and a die more on a critical hit" : "For the Pistol and Spread Shot";
    b.addEventListener("click", function(){ st.heavy = o[1]; refresh(); });
    kinds.appendChild(b);
  });
  card.appendChild(kinds);
  var total = Object.keys(st.counts).reduce(function(n, k){ return n + (st.counts[k]||0); }, 0);
  var list = document.createElement("div");
  list.className = "bs-list";
  Object.keys(ROUND_KINDS).forEach(function(k){
    var def = ROUND_KINDS[k];
    if(def.spell || def.level > lv) return;
    var n = st.counts[k] || 0;
    var row = document.createElement("div");
    row.className = "bs-row";
    var name = document.createElement("span");
    name.className = "bs-name";
    name.textContent = (st.heavy ? "Heavy " : "") + def.name;
    if(def.elemental) name.title = "Pick the damage type when you load it: " + ROUND_ELEMENTS.join(", ").toLowerCase() + ".";
    else if(def.note) name.title = def.note;
    row.appendChild(name);
    var minus = stepButton("−", "One fewer " + def.name.toLowerCase() + " round", n <= 0, function(){ st.counts[k] = n - 1; refresh(); });
    var count = document.createElement("span");
    count.className = "bs-count";
    count.textContent = n;
    var plus = stepButton("+", "One more " + def.name.toLowerCase() + " round", total >= batch, function(){ st.counts[k] = n + 1; refresh(); });
    row.appendChild(minus); row.appendChild(count); row.appendChild(plus);
    list.appendChild(row);
  });
  card.appendChild(list);
  var go = document.createElement("div");
  go.className = "inv-roll-actions";
  button(go, "Craft " + total + " of " + batch + " · " + cost + " gp", total ? "Spend " + hours + " hours and " + cost + " gp" : "Add some rounds first", !total, function(){
    if(!payGold(c, cost)) return;
    Object.keys(st.counts).forEach(function(k){ if(st.counts[k]) addRounds(c, k, st.heavy, st.counts[k]); });
    logRoll("Bulletsmith", "Crafted " + Object.keys(st.counts).filter(function(k){ return st.counts[k]; }).map(function(k){ return st.counts[k] + " " + roundStackName(k, st.heavy).toLowerCase(); }).join(", ") + " (" + hours + " hours, " + cost + " gp).");
    st.counts = {};
    save(); refresh();
  });
  card.appendChild(go);
  if(lv >= 17) card.appendChild(spellRoundBlock(c, st, cost, hours, refresh));
  return card;
}
function stepButton(text, label, disabled, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small bs-step";
  b.textContent = text;
  b.setAttribute("aria-label", label);
  b.disabled = !!disabled;
  b.addEventListener("click", onClick);
  return b;
}
/* Occult Bulletsmith (17): a spell scroll becomes one spell round. */
var SCROLL_LEVEL = {"Cantrip": 0, "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6, "7th": 7, "8th": 8, "9th": 9};
function scrollLevel(item){
  var m = /^Spell Scroll \((Cantrip|\dst|\dnd|\drd|\dth)\)/.exec(item.name || "");
  return m ? SCROLL_LEVEL[m[1]] : null;
}
function spellRoundBlock(c, st, cost, hours, refresh){
  var box = document.createElement("div");
  box.className = "bs-spell";
  var h = document.createElement("h4");
  h.textContent = "Spell round";
  box.appendChild(h);
  var scrolls = (c.inventory||[]).filter(function(i){ return scrollLevel(i)!=null && (Number(i.qty)||1) > 0; });
  if(!scrolls.length){
    var none = document.createElement("p");
    none.className = "bs-lead";
    none.textContent = "Carry a spell scroll to turn it into a spell round (the scroll is used up).";
    box.appendChild(none);
    return box;
  }
  var names = scrolls.map(function(i){ return i.name; }).filter(function(n, i, a){ return a.indexOf(n)===i; });
  if(names.indexOf(st.scroll)===-1){ st.scroll = names[0]; st.spell = ""; }
  var pickers = document.createElement("div");
  pickers.className = "gun-round-pickers";
  var f1 = document.createElement("div");
  f1.className = "field gun-round-field";
  f1.appendChild(themedPicker({key: "bsScroll", groups: {"": names}, value: st.scroll, ariaLabel: "Spell scroll", search: false, sheet: true,
    onPick: function(v){ st.scroll = v; st.spell = ""; refresh(); }}));
  pickers.appendChild(f1);
  var level = scrollLevel({name: st.scroll});
  var spells = Object.keys(SPELL_DATA).filter(function(n){ return SPELL_DATA[n].level===level; }).sort();
  var f2 = document.createElement("div");
  f2.className = "field gun-round-field";
  f2.appendChild(themedPicker({key: "bsSpell", groups: {"": spells}, value: st.spell, placeholder: "The scroll's spell", ariaLabel: "The scroll's spell", search: true, sheet: true,
    onPick: function(v){ st.spell = v; refresh(); }}));
  pickers.appendChild(f2);
  box.appendChild(pickers);
  var go = document.createElement("div");
  go.className = "inv-roll-actions";
  button(go, "Craft a " + (st.heavy ? "heavy " : "") + "spell round · " + cost + " gp", st.spell ? "Uses up the scroll. " + hours + " hours and " + cost + " gp, and no other rounds this time." : "Pick the scroll's spell", !st.spell, function(){
    var scroll = scrolls.find(function(i){ return i.name===st.scroll; });
    if(!scroll || !payGold(c, cost)) return;
    scroll.qty = (Number(scroll.qty)||1) - 1;
    if(scroll.qty <= 0) c.inventory.splice(c.inventory.indexOf(scroll), 1);
    addRounds(c, "spell", st.heavy, 1, st.spell);
    logRoll("Occult Bulletsmith", "Turned a " + st.scroll.toLowerCase() + " of " + st.spell + " into a spell round (" + hours + " hours, " + cost + " gp).");
    st.spell = "";
    save(); refresh();
  });
  box.appendChild(go);
  return box;
}
