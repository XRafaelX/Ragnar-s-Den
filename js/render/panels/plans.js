import { save } from "../../core/state.js";
import { escapeHtml, fmtMod, spellSlotsLeft, ordinal } from "../../core/helpers.js";
import { MAGIC_ITEM_DATA } from "../../data/magic-items.js";
import { planByName, PLANS_SUGGESTED } from "../../data/artificer-plans.js";
import { artificer2024Level, planState, learnablePlans, pickOptions, planItemDef, learnPlan, forgetPlan, madeFrom, replicaItem,
  replicasToVanish, makeReplica, vanishReplica, dropOrphanReplicas, hasItemTinker, chargeReplica, drainLevel, drainReplica,
  tinkerProblem, transmuteReplica, plansKnownAt, planItemsAt } from "../../core/replicate.js";
import { itemCharges } from "../../core/magic-items.js";
import { makeCatalogMagicItem, magicItemBases } from "../armory.js";
import { magicItemText } from "./inventory.js";
import { makeCard, renderAll } from "../sheet.js";
import { sectionTitle, hint } from "../../ui/card-parts.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { sheetTop, lead, sheetButton } from "./paladin.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { logRoll } from "../../dice/dice.js";
import { playAdd, playDelete } from "../../ui/sound.js";

/* ---- Magic item plans (Features tab, 2024 artificer 2+) ----
   Replicate Magic Item: the items made now (a tile each, a tap opens it
   with Magic Item Tinker's options from level 6), the plans known (a row
   each with Make), and learning a plan. The rules are in
   js/core/replicate.js. Reuses the infusions card's styles. */

// Form state survives the redraw each pick triggers.
var learnPick = "", learnItem = "", makingId = "", makeBase = "";

function countTitle(text, count, max){
  var p = sectionTitle(text);
  p.classList.add("inf-count-title");
  var n = document.createElement("span");
  n.className = "inf-count" + (count > max ? " over" : "");
  n.innerHTML = "<b>" + count + "</b> of " + max + (count > max ? " · more than your level allows" : "");
  p.appendChild(n);
  return p;
}
/* What a known plan is called: the book's plan name ("+1 Weapon"), or for
   a plan of a kind the item chosen ("Broom of Flying"). */
function itemLabel(k){
  var found = planByName(k.name);
  return found && found.plan.pick ? k.item : k.name;
}
function isPickPlan(k){ var f = planByName(k.name); return !!(f && f.plan.pick); }
/* A weapon or armor of a kind needs its base picked before it's made. */
function needsBase(d){ return !!(d && (d.weaponAny || d.armorAny)); }
/* The inventory row for a known plan's item (`base` for one of a kind). */
function buildItem(c, k, base){
  var d = MAGIC_ITEM_DATA[k.item];
  if(d) return makeCatalogMagicItem(c, k.item, d, base);
  // A common item typed in by name (not in the app's lists).
  return {name: k.item, type: "gear", qty: 1, equipped: false, notes: "Common magic item: see its description in the Dungeon Master's Guide"};
}

export function renderPlansCard(c){
  var lv = artificer2024Level(c);
  if(lv < 2) return null;
  var st = planState(c);
  dropOrphanReplicas(c);
  var card = makeCard("Magic item plans");
  card.classList.add("inf-card", "plan-card");
  card.appendChild(hint("After a long rest, with tinker's tools in hand, make magic items from your plans."));

  card.appendChild(countTitle("Magic items", st.made.length, planItemsAt(lv)));
  card.appendChild(madeTiles(c, planItemsAt(lv)));

  card.appendChild(countTitle("Your plans", st.known.length, plansKnownAt(lv)));
  if(!st.known.length) card.appendChild(hint("You don't know any plans yet. Learn one below. " + PLANS_SUGGESTED.join(", ").replace(/, ([^,]*)$/, " and $1") + " are the book's suggestions."));
  var rows = document.createElement("div");
  rows.className = "inf-rows";
  st.known.forEach(function(k){ rows.appendChild(planRow(c, k)); });
  if(st.known.length) card.appendChild(rows);

  if(st.known.length < plansKnownAt(lv)){
    card.appendChild(sectionTitle("Learn a plan"));
    card.appendChild(learnForm(c));
  } else {
    card.appendChild(hint("All learned. When you gain an artificer level you can swap one: open it, Forget, then learn another."));
  }
  return card;
}

/* A tile per made item (name, plan, attunement), then dashed free ones. */
function madeTiles(c, max){
  var st = planState(c);
  var grid = document.createElement("div");
  grid.className = "inf-slots";
  st.made.forEach(function(m){
    var k = st.known.find(function(x){ return x.id===m.knownId; }) || {};
    var item = replicaItem(c, m) || {};
    var d = MAGIC_ITEM_DATA[item.magicItem];
    var tile = document.createElement("button");
    tile.type = "button";
    tile.className = "inf-slot plan-slot";
    tile.setAttribute("aria-label", (item.name || k.item) + ": options");
    tile.innerHTML = "<div class='inf-slot-top'><span class='inf-slot-item'></span></div><div class='inf-slot-what'></div>";
    tile.querySelector(".inf-slot-item").textContent = item.name || k.item;
    tile.querySelector(".inf-slot-what").textContent = (d ? d.rarity : "Common") + (d && d.attunement ? (item.attuned ? " · attuned" : " · not attuned") : "");
    tile.addEventListener("click", function(){ openMadeSheet(c, m); });
    grid.appendChild(tile);
  });
  for(var i = st.made.length; i < max; i++){
    var free = document.createElement("div");
    free.className = "inf-slot inf-slot-free";
    free.textContent = "Free slot";
    grid.appendChild(free);
  }
  return grid;
}

/* A known plan: its name (tap: the item's rules), what it makes, and Make
   or "Made". Make folds open a weapon or armor picker when it needs one. */
function planRow(c, k){
  var made = madeFrom(c, k.id), d = planItemDef(k);
  var row = document.createElement("div");
  row.className = "inf-row" + (made ? " is-on" : "") + (makingId===k.id ? " is-infusing" : "");
  var main = document.createElement("div");
  main.className = "inf-row-main";
  var info = document.createElement("button");
  info.type = "button";
  info.className = "inf-row-info";
  info.setAttribute("aria-label", itemLabel(k) + ": what it does");
  info.innerHTML = "<span class='inf-row-name'>" + escapeHtml(itemLabel(k)) + "<span class='inf-row-more' aria-hidden='true'>›</span></span>" +
    "<span class='inf-row-goes'>" + escapeHtml((d ? d.rarity : "Common") + (d && d.attunement ? " · needs attunement" : "") + (isPickPlan(k) ? " · " + k.name.toLowerCase() + " plan" : "")) + "</span>";
  info.addEventListener("click", function(){ openPlanSheet(c, k); });
  main.appendChild(info);
  if(made){
    var chip = document.createElement("span");
    chip.className = "inf-tag inf-row-chip";
    chip.textContent = "Made";
    main.appendChild(chip);
  } else if(makingId!==k.id){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small inf-act";
    btn.textContent = "Make";
    btn.setAttribute("aria-label", "Make " + itemLabel(k));
    btn.addEventListener("click", function(){ startMaking(c, k); });
    main.appendChild(btn);
  }
  row.appendChild(main);
  if(makingId===k.id && !made) row.appendChild(makeForm(c, k));
  return row;
}
function startMaking(c, k){
  var d = planItemDef(k);
  if(needsBase(d)){ makingId = k.id; makeBase = ""; renderAll(); return; }
  finishMaking(c, k, "");
}
/* Make it: the oldest item vanishes first when at the limit. */
function finishMaking(c, k, base){
  var going = replicasToVanish(c).map(function(m){ var i = replicaItem(c, m); return i ? i.name : ""; }).filter(Boolean);
  var m = makeReplica(c, k.id, buildItem(c, k, base));
  if(!m) return;
  makingId = ""; makeBase = "";
  var item = replicaItem(c, m);
  logRoll("Replicate Magic Item", "Made " + item.name + "." + (going.length ? " " + going.join(", ") + " vanished." : ""));
  save(); renderAll(); playAdd();
  var d = MAGIC_ITEM_DATA[item.magicItem];
  showActionToast(item.name + " is in your inventory" + (d && d.attunement ? (item.attuned ? " and attuned." : ", but you're at your attunement limit: end one, then attune to it.") : ".") +
    (going.length ? " " + going.join(", ") + " vanished." : ""));
}
function makeForm(c, k){
  var d = planItemDef(k);
  var wrap = document.createElement("div");
  wrap.className = "inf-form inf-infuse";
  var bases = magicItemBases(d);
  if(bases.indexOf(makeBase)===-1) makeBase = "";
  wrap.appendChild(field(themedPicker({
    key: "plan:base", ariaLabel: "Which " + (d.weaponAny ? "weapon" : "armor"), placeholder: d.weaponAny ? "Which weapon?" : "Which armor?",
    groups: {"": bases}, value: makeBase, search: bases.length > 12, sheet: true,
    onPick: function(v){ makeBase = v; }
  })));
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Make it";
  btn.addEventListener("click", function(){
    if(!makeBase){ showActionToast("Pick which " + (d.weaponAny ? "weapon" : "armor") + " it is.", true); return; }
    finishMaking(c, k, makeBase);
  });
  wrap.appendChild(btn);
  var cancel = document.createElement("button");
  cancel.className = "btn small ghost";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", function(){ makingId = ""; renderAll(); });
  wrap.appendChild(cancel);
  var going = replicasToVanish(c);
  if(going.length){
    var oldest = replicaItem(c, going[0]);
    var note = hint("You're at your limit, so this makes " + (oldest ? oldest.name : "your oldest item") + " vanish.");
    note.classList.add("inf-note");
    wrap.appendChild(note);
  }
  return wrap;
}

/* A plan's rules in a bottom sheet: the item's text, Make and Forget. */
function openPlanSheet(c, k){
  var d = planItemDef(k), made = madeFrom(c, k.id);
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, itemLabel(k), close);
    lead(body, "Magic item plan · " + (d ? d.kind + " · " + d.rarity + (d.attunement ? " · needs attunement" : "") : "Common magic item"));
    if(d) body.appendChild(magicItemText(d.text));
    else body.appendChild(hint("A common magic item you chose. See its description in the Dungeon Master's Guide."));
    var actions = document.createElement("div");
    actions.className = "ff-sheet-actions";
    if(!made) actions.appendChild(sheetButton("Make it", function(){ close(); startMaking(c, k); }));
    var forget = sheetButton("Forget", function(){
      close();
      confirmDialog("Forget the " + itemLabel(k) + " plan?", made ? "The " + (replicaItem(c, made) || {}).name + " you made from it vanishes." : "You can learn another plan in its place.", function(){
        forgetPlan(c, k.id); save(); renderAll(); playDelete();
      });
    });
    forget.classList.add("ff-sheet-danger");
    actions.appendChild(forget);
    body.appendChild(actions);
  });
}

/* A made item: what it is, and Magic Item Tinker's options (6+): Charge
   (a spell slot for charges), Drain (into a spell slot) and Transmute
   (into another plan's item), then Let it vanish. */
var transmuteTo = "", transmuteBase = "";
function openMadeSheet(c, m){
  transmuteTo = ""; transmuteBase = "";
  openBottomSheet(function(body, refresh, close){
    var st = planState(c), item = replicaItem(c, m);
    if(!item){ close(); return; }
    var d = MAGIC_ITEM_DATA[item.magicItem];
    sheetTop(body, item.name, close);
    lead(body, "Made with Replicate Magic Item · " + (d ? d.rarity : "Common") + (d && d.attunement ? (item.attuned ? " · attuned" : " · not attuned") : ""));
    if(d) body.appendChild(magicItemText(d.text));
    var done = function(msg, entry){ logRoll("Magic Item Tinker", msg); showActionToast(msg); save(); renderAll(); if(entry) refresh(); else close(); };
    if(hasItemTinker(c)){
      body.appendChild(sectionTitle("Magic Item Tinker"));
      // Charge Magic Item: a slot's level in charges.
      var ch = itemCharges(item);
      var slots = spellSlotsLeft(c).filter(function(s){ return !s.pact; });
      if(ch && (!ch.used || !slots.length)) body.appendChild(hint("Charge Magic Item: " + (!ch.used ? "it has all its charges." : "you have no spell slot left to spend.")));
      else if(ch){
        var cw = document.createElement("div");
        cw.className = "field inf-field";
        cw.appendChild(themedPicker({
          key: "plan:charge", ariaLabel: "Charge Magic Item: spell slot to spend", placeholder: "Charge it (bonus action): spend a slot…",
          groups: {"": slots.map(function(s){ return {value: String(s.level), label: "A " + ordinal(s.level) + "-level slot: " + Math.min(ch.used, s.level) + " charge" + (Math.min(ch.used, s.level)===1 ? "" : "s") + " back"}; })},
          value: "",
          onPick: function(v){
            var slot = slots.find(function(s){ return String(s.level)===v; });
            var got = chargeReplica(c, m, slot);
            if(got) done(item.name + " regained " + got + " charge" + (got===1 ? "" : "s") + " (a " + ordinal(slot.level) + "-level slot).", true);
          }
        }));
        body.appendChild(cw);
      }
      var row = document.createElement("div");
      row.className = "ff-sheet-actions";
      var lvl = drainLevel(c, m), dp = tinkerProblem(c, "drain");
      row.appendChild(sheetButton(lvl ? "Drain into a " + ordinal(lvl) + "-level slot" : "Drain (common, uncommon or rare only)", function(){
        var got = drainReplica(c, m);
        if(got) done(item.name + " vanished into a " + ordinal(got) + "-level spell slot, until your next long rest.");
      }, !!dp || !lvl, dp || "Bonus action: it vanishes and becomes a spell slot until your next long rest. Once per long rest."));
      body.appendChild(row);
      // Transmute Magic Item: into another known plan's item.
      var tp = tinkerProblem(c, "transmute");
      var others = st.known.filter(function(k){ return !madeFrom(c, k.id); });
      var tw = document.createElement("div");
      tw.className = "field inf-field";
      if(tp || !others.length) body.appendChild(hint("Transmute Magic Item: " + (tp ? tp.toLowerCase() + "." : "every other plan's item is made already.")));
      else tw.appendChild(themedPicker({
        key: "plan:transmute", ariaLabel: "Transmute Magic Item: what it becomes", placeholder: "Transmute it (Magic action) into…",
        groups: {"": others.map(function(k){ return {value: k.id, label: itemLabel(k)}; })}, value: transmuteTo,
        onPick: function(v){
          transmuteTo = v;
          var k = st.known.find(function(x){ return x.id===v; });
          if(needsBase(planItemDef(k))) refresh();
          else transmute(k, "");
        }
      }));
      if(tw.childNodes.length) body.appendChild(tw);
      var target = st.known.find(function(x){ return x.id===transmuteTo; });
      if(target && needsBase(planItemDef(target))){
        var bd = planItemDef(target), bw = document.createElement("div");
        bw.className = "field inf-field";
        bw.appendChild(themedPicker({key: "plan:transmute-base", ariaLabel: "Which " + (bd.weaponAny ? "weapon" : "armor"),
          placeholder: bd.weaponAny ? "Which weapon?" : "Which armor?", groups: {"": magicItemBases(bd)}, value: "", search: true,
          onPick: function(v){ transmute(target, v); }}));
        body.appendChild(bw);
      }
    }
    function transmute(k, base){
      var was = item.name;
      var n = transmuteReplica(c, m, k.id, buildItem(c, k, base));
      if(n) done(was + " became " + (replicaItem(c, n) || {}).name + ".");
    }
    var actions = document.createElement("div");
    actions.className = "ff-sheet-actions";
    var gone = sheetButton("Let it vanish", function(){
      close();
      confirmDialog("Let " + item.name + " vanish?", "It leaves your inventory. Anything inside it lands around it.", function(){
        vanishReplica(c, m); save(); renderAll(); playDelete();
      });
    });
    gone.classList.add("ff-sheet-danger");
    actions.appendChild(gone);
    body.appendChild(actions);
  });
}

/* Learn a plan: the tables by artificer level (higher ones greyed), and
   for a "pick" plan the item it makes. */
function learnForm(c){
  var wrap = document.createElement("div");
  wrap.className = "inf-form inf-learn";
  var rows = learnablePlans(c);
  var groups = {}, reasons = {};
  rows.forEach(function(p){
    var g = "Artificer " + p.level + "+";
    (groups[g] = groups[g] || []).push({value: p.name, label: p.label || p.name});
    reasons[p.name] = p.reason;
  });
  if(learnPick && reasons[learnPick]) learnPick = "";
  wrap.appendChild(field(themedPicker({
    key: "plan:learn", ariaLabel: "Plan to learn", placeholder: "Pick a plan to learn…", groups: groups, value: learnPick, search: true, sheet: true,
    reasonFor: function(v){ return reasons[v] || ""; },
    onPick: function(v){ learnPick = v; learnItem = ""; renderAll(); }
  })));
  var found = learnPick && planByName(learnPick), plan = found && found.plan;
  if(plan && plan.pick){
    var known = planState(c).known.map(function(k){ return k.item; });
    wrap.appendChild(field(themedPicker({
      key: "plan:item", ariaLabel: "Magic item for this plan", placeholder: "Which item?", groups: {"": pickOptions(plan.pick)}, value: learnItem,
      search: true, sheet: true, homebrew: plan.pick==="common" ? {noun: "common magic item (not a potion, scroll or cursed)"} : null,
      reasonFor: function(v){ return known.indexOf(v)!==-1 ? "known" : ""; },
      onPick: function(v, meta){ learnItem = v; if(!meta || !meta.typing) renderAll(); }
    })));
  }
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Learn";
  btn.disabled = !plan;
  btn.addEventListener("click", function(){
    if(!plan) return;
    if(plan.pick && !(learnItem||"").trim()){ showActionToast("Pick the magic item for this plan.", true); return; }
    var k = learnPlan(c, learnPick, plan.pick ? learnItem.trim() : "");
    if(!k){ showActionToast("You can't learn that plan.", true); return; }
    learnPick = ""; learnItem = "";
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  var itemName = plan && (plan.pick ? learnItem : (plan.item || plan.name));
  var d = itemName && MAGIC_ITEM_DATA[itemName];
  if(d){
    var preview = document.createElement("div");
    preview.className = "inf-preview";
    preview.innerHTML = "<div class='inf-goes'><span>" + escapeHtml(d.kind) + "</span> " + escapeHtml(d.rarity + (d.attunement ? ", needs attunement" : "")) + "</div><div class='inf-text'>" + escapeHtml(d.text) + "</div>";
    wrap.appendChild(preview);
  }
  return wrap;
}

function field(el){
  var f = document.createElement("div");
  f.className = "field inf-field";
  f.appendChild(el);
  return f;
}
