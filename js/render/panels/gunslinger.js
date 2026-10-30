/* ---------------- Gunslinger class (Michael's homebrew) on the sheet ----------------
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
import { clamp, mod, fmtMod, maxHp, skillCheck, profBonus, classLevelOf, roundStacks, loadedRound, loadedStack, takesHeavyRounds, roundsHaveNoType } from "../../core/helpers.js";
import { ROUND_KINDS, ROUND_ELEMENTS, roundBatchSize, roundStackName } from "../../data/gunslinger-rounds.js";
import { SPELL_DATA } from "../../data/spells.js";
import { spendCoins } from "../../core/coins.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { abilityScore } from "../../core/ability-scores.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";

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

/* ---- The loaded round, on a class firearm's card ---- */
function roundValue(r){ return r ? [r.kind, r.element || "", r.spell || ""].join("|") : ""; }
function stackValue(s){ return [s.round, s.element || "", s.spell || ""].join("|"); }

/* The Round picker (the carried stacks that fit the gun, or with Master
   of the Barrel any kind), the elemental type picker and a line on what
   the round does. null for any other weapon. */
export function gunRoundRow(c, item, redraw){
  if(item.firearmSet!=="gunslinger") return null;
  var free = roundsHaveNoType(c), stacks = roundStacks(c, item), heavy = takesHeavyRounds(item);
  var items = [{value: "", label: "Plain shot (no round)", muted: true}];
  if(free){
    var any = stacks.filter(function(s){ return s.round!=="spell"; }).reduce(function(n, s){ return n + (Number(s.qty)||0); }, 0);
    Object.keys(ROUND_KINDS).forEach(function(k){
      if(k!=="spell") items.push({value: k + "||", label: (heavy ? "Heavy " : "") + ROUND_KINDS[k].name + " round (" + any + " left)"});
    });
    stacks.filter(function(s){ return s.round==="spell"; }).forEach(function(s){ items.push({value: stackValue(s), label: s.name + " (" + s.qty + ")"}); });
  } else {
    var seen = {};
    stacks.forEach(function(s){
      var v = stackValue(s);
      if(seen[v]) return;
      seen[v] = true;
      items.push({value: v, label: s.name + " (" + s.qty + ")"});
    });
  }
  var round = loadedRound(c, item), current = roundValue(item.round);
  var wrap = document.createElement("div");
  wrap.className = "gun-round";
  var row = document.createElement("div");
  row.className = "gun-round-pickers";
  var field = document.createElement("div");
  field.className = "field gun-round-field";
  field.appendChild(themedPicker({
    key: "gunRound:" + (item.id || item.name), groups: {"": items}, value: items.some(function(i){ return i.value===current; }) ? current : "",
    placeholder: "Round", ariaLabel: "Round loaded in the " + (item.name || "firearm"), search: false, sheet: true,
    onPick: function(v){
      if(!v) delete item.round;
      else { var p = v.split("|"); item.round = {kind: p[0]}; if(p[1]) item.round.element = p[1]; if(p[2]) item.round.spell = p[2]; }
      redraw();
    }
  }));
  row.appendChild(field);
  // An elemental round takes its damage type when it's loaded.
  if(round && round.def.elemental){
    var stack = loadedStack(c, item);
    if(!(stack && stack.element)){
      var el = document.createElement("div");
      el.className = "field gun-round-field";
      el.appendChild(themedPicker({
        key: "gunElement:" + (item.id || item.name), groups: {"": ROUND_ELEMENTS}, value: round.element || "", placeholder: "Damage type",
        ariaLabel: "The elemental round's damage type", search: false, sheet: true,
        onPick: function(v){ item.round.element = v; redraw(); }
      }));
      row.appendChild(el);
    }
  }
  wrap.appendChild(row);
  var note = roundNote(c, round);
  if(note){
    var p = document.createElement("p");
    p.className = "inv-armor-note gun-round-note";
    p.textContent = note;
    wrap.appendChild(p);
  }
  return wrap;
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
