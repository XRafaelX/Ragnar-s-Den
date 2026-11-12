/* ---------------- Replicate Magic Item (2024 artificer) ----------------
   Eberron: Forge of the Artificer, checked against 5etools' data
   (source EFA) on 2026-11-12. The artificer knows magic item plans
   (js/data/artificer-plans.js) and, after a long rest, makes magic items
   from them, each from a different plan, up to the Magic Items column at
   once (the oldest vanishes to make room). Changing a plan makes its item
   vanish. Magic Item Tinker (6) charges, drains or transmutes a made item;
   Soul of Artifice (20) can disintegrate them to cheat death.

   c.plans = {
     known: [{id, name (the plan), item (the magic item it makes)}],
     made:  [{id, knownId, itemId}]   oldest first; the item is an
                                      inventory row with `replica: true`
     drained, transmuted              used since the last long rest
   }
   The panel builds a made item with the Armory's makeCatalogMagicItem, so
   it works like any magic item (attunement, charges, bonuses). */
import { MAGIC_ITEM_DATA } from "../data/magic-items.js";
import { PLAN_TABLES, planByName, plansKnownAt, planItemsAt } from "../data/artificer-plans.js";
import { attuneProblem, itemCharges, spendCharges } from "./magic-items.js";
import { uid, spellSlotsLeft, spendSpellSlot, classLevelOf } from "./helpers.js";

export function artificer2024Level(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Artificer" && x.edition==="2024"; });
  return cl ? (Number(cl.level)||1) : 0;
}
export function planState(c){
  if(!c.plans) c.plans = {known: [], made: []};
  if(!c.plans.known) c.plans.known = [];
  if(!c.plans.made) c.plans.made = [];
  return c.plans;
}

/* ---- Limits ----
   Plans Known and Magic Items by level, and the 2024 Armorer's Improved
   Armorer (9): one more plan and one more item, both armor. */
export function armorExtra(c){ return classLevelOf(c, "Artificer", "Armorer (2024)") >= 9 ? 1 : 0; }
export function planLimits(c){
  var lv = artificer2024Level(c), extra = armorExtra(c);
  return {plans: plansKnownAt(lv) + extra, items: planItemsAt(lv) + extra, basePlans: plansKnownAt(lv), baseItems: planItemsAt(lv), extra: extra};
}
/* Whether an item (by data name) is armor: what Improved Armorer's extra
   plan and item must be. */
export function isArmorItem(name){ var d = MAGIC_ITEM_DATA[name]; return !!(d && /^Armor/.test(d.kind || "")); }
function isArmorPlan(p){ return !p.pick && isArmorItem(p.item || p.name); }

/* ---- What can be learned ---- */
function cursed(d){ return /\bcurse/i.test(d.text || ""); }
/* The magic items a "pick" plan can be: names from the item data. */
export function pickOptions(kind){
  return Object.keys(MAGIC_ITEM_DATA).filter(function(n){
    var d = MAGIC_ITEM_DATA[n];
    if(cursed(d)) return false;
    if(kind==="common") return d.rarity==="Common" && !/^Potion|Spell Scroll/i.test(n) && !/potion|scroll/i.test(d.kind);
    var wondrous = /^Wondrous item/i.test(d.kind);
    if(kind==="uncommonWondrous") return wondrous && d.rarity==="Uncommon";
    if(kind==="rareWondrous") return wondrous && d.rarity==="Rare";
    return false;
  }).sort();
}
/* Every plan with the reason it can't be learned now ("" when it can):
   [{name, level, label, pick, reason}]. */
export function learnablePlans(c){
  var lv = artificer2024Level(c), known = planState(c).known, lim = planLimits(c);
  // (With Improved Armorer, once the plain plans are full only armor is left.)
  var plainFull = lim.extra && known.filter(function(k){ return !isArmorItem(k.item); }).length >= lim.basePlans;
  var out = [];
  PLAN_TABLES.forEach(function(t){
    t.plans.forEach(function(p){
      var reason = lv < t.level ? "artificer " + t.level : (!p.pick && known.some(function(k){ return k.name===p.name; })) ? "known"
        : plainFull && !isArmorPlan(p) ? "your extra plan must be armor" : "";
      out.push({name: p.name, level: t.level, label: p.label || "", pick: p.pick || "", reason: reason});
    });
  });
  return out;
}
/* The magic item a known plan makes, by its data name. */
export function planItem(k){ return k.item; }
export function planItemDef(k){ return MAGIC_ITEM_DATA[k.item] || null; }

/* Learn a plan (`item` for a pick plan: the item chosen). Returns the
   known entry, or null when it can't be learned. */
export function learnPlan(c, name, item){
  var found = planByName(name), st = planState(c);
  if(!found) return null;
  var row = learnablePlans(c).find(function(p){ return p.name===name; });
  if(!row || row.reason) return null;
  var p = found.plan, makes = p.pick ? item : (p.item || p.name);
  if(!makes) return null;
  // (A pick plan's item: one of its kind, or for a common item one typed in.)
  if(p.pick && pickOptions(p.pick).indexOf(makes)===-1 && !(p.pick==="common" && !MAGIC_ITEM_DATA[makes])) return null;
  if(st.known.some(function(k){ return k.item===makes; })) return null;
  var k = {id: uid(), name: name, item: makes};
  st.known.push(k);
  return k;
}
/* Forget a plan: its item vanishes. */
export function forgetPlan(c, knownId){
  var st = planState(c);
  st.made.filter(function(m){ return m.knownId===knownId; }).forEach(function(m){ vanishReplica(c, m); });
  st.known = st.known.filter(function(k){ return k.id!==knownId; });
}

/* ---- Making items ---- */
export function madeFrom(c, knownId){ return planState(c).made.find(function(m){ return m.knownId===knownId; }) || null; }
export function replicaItem(c, made){ return (c.inventory||[]).find(function(i){ return i.id===made.itemId; }) || null; }
/* The made items that vanish to make room for one more (`armor`: it's
   armor, so it can take Improved Armorer's extra place), oldest first. */
export function replicasToVanish(c, armor){
  var st = planState(c), lim = planLimits(c), out = [];
  var left = st.made.slice();
  var plain = function(){ return left.filter(function(m){ var i = replicaItem(c, m); return !(i && isArmorItem(i.magicItem)); }); };
  while(left.length){
    var victim = !armor && plain().length >= lim.baseItems ? plain()[0] : left.length >= lim.items ? left[0] : null;
    if(!victim) break;
    out.push(victim);
    left.splice(left.indexOf(victim), 1);
  }
  return out;
}
/* Add an item made from a known plan (`item`: the inventory row, built
   by the panel). One item per plan at a time. Over the limit the oldest
   vanishes. Attuned at once when it needs it and there's room. Returns
   the made entry, or null. */
export function makeReplica(c, knownId, item){
  var st = planState(c);
  var k = st.known.find(function(x){ return x.id===knownId; });
  if(!k || madeFrom(c, knownId) || !artificer2024Level(c)) return null;
  replicasToVanish(c, isArmorItem(item.magicItem)).forEach(function(m){ vanishReplica(c, m); });
  if(!item.id) item.id = uid();
  item.replica = true;
  if(!c.inventory) c.inventory = [];
  c.inventory.push(item);
  var d = MAGIC_ITEM_DATA[item.magicItem];
  if(d && d.attunement) item.attuned = !attuneProblem(c, Object.assign({}, item, {attuned: false}));
  var m = {id: uid(), knownId: knownId, itemId: item.id};
  st.made.push(m);
  return m;
}
/* A made item vanishes (anything inside it lands around it). */
export function vanishReplica(c, made){
  var st = planState(c);
  c.inventory = (c.inventory||[]).filter(function(i){ return i.id!==made.itemId; });
  st.made = st.made.filter(function(m){ return m.id!==made.id; });
}
/* Made items removed from the inventory by hand have vanished. True if any. */
export function dropOrphanReplicas(c){
  if(!c.plans || !(c.plans.made||[]).length) return false;
  var ids = (c.inventory||[]).map(function(i){ return i.id; }), before = c.plans.made.length;
  c.plans.made = c.plans.made.filter(function(m){ return ids.indexOf(m.itemId)!==-1; });
  return c.plans.made.length !== before;
}
/* Not a 2024 artificer of level 2+ (an undone level, the switch back to
   the Tasha's rules): the made items vanish. The plans stay known. */
export function syncPlans(c){
  if(!c.plans || !(c.plans.made||[]).length) return false;
  if(artificer2024Level(c) >= 2) return dropOrphanReplicas(c);
  c.plans.made.slice().forEach(function(m){ vanishReplica(c, m); });
  return true;
}

/* ---- Magic Item Tinker (6) ---- */
export function hasItemTinker(c){ return artificer2024Level(c) >= 6; }
function rarityOf(c, made){
  var item = replicaItem(c, made), d = item && MAGIC_ITEM_DATA[item.magicItem];
  return d ? d.rarity : "Common";
}
/* Charge Magic Item: spend a spell slot (`slot` from spellSlotsLeft); the
   item regains charges equal to its level. The charges regained, or 0. */
export function chargeReplica(c, made, slot){
  var item = replicaItem(c, made), ch = item && itemCharges(item);
  if(!hasItemTinker(c) || !ch || !ch.used || !slot) return 0;
  var got = Math.min(ch.used, slot.level);
  spendSpellSlot(c, slot);
  spendCharges(item, -got);
  return got;
}
/* The slot level Drain Magic Item would give: 1 for a common item, 2 for
   an uncommon or rare one, 0 for a very rare or legendary one. */
export function drainLevel(c, made){
  var r = rarityOf(c, made);
  return r==="Common" ? 1 : (r==="Uncommon" || r==="Rare") ? 2 : 0;
}
/* Why Drain or Transmute can't be used now ("" when it can). */
export function tinkerProblem(c, which){
  if(!hasItemTinker(c)) return "From artificer level 6";
  var st = planState(c);
  if(which==="drain" && st.drained) return "Used: again after a long rest";
  if(which==="transmute" && st.transmuted) return "Used: again after a long rest";
  return "";
}
/* Drain Magic Item: the item vanishes and becomes a spell slot that
   lasts until the next long rest. The slot's level, or 0. */
export function drainReplica(c, made){
  var lvl = drainLevel(c, made);
  if(tinkerProblem(c, "drain") || !lvl) return 0;
  vanishReplica(c, made);
  var s = c.spellcasting.slots[lvl] || (c.spellcasting.slots[lvl] = {max: 0, used: 0});
  s.max = (Number(s.max)||0) + 1;
  s.extra = (Number(s.extra)||0) + 1;
  s.drained = (Number(s.drained)||0) + 1;
  planState(c).drained = true;
  return lvl;
}
/* Transmute Magic Item: the item becomes another one from a known plan
   (`item` built by the panel for `knownId`). The new made entry, or null. */
export function transmuteReplica(c, made, knownId, item){
  if(tinkerProblem(c, "transmute") || madeFrom(c, knownId)) return null;
  vanishReplica(c, made);
  var m = makeReplica(c, knownId, item);
  if(m) planState(c).transmuted = true;
  return m;
}
/* A long rest: the drained slots go, and Drain and Transmute are back. */
export function plansOnLongRest(c){
  var slots = (c.spellcasting && c.spellcasting.slots) || {};
  Object.keys(slots).forEach(function(l){
    var s = slots[l], n = Number(s.drained)||0;
    if(!n) return;
    s.max = Math.max(0, (Number(s.max)||0) - n);
    s.extra = Math.max(0, (Number(s.extra)||0) - n);
    s.used = Math.min(Number(s.used)||0, s.max);
    delete s.drained;
  });
  if(c.plans){ delete c.plans.drained; delete c.plans.transmuted; }
}

/* ---- Soul of Artifice: Cheat Death (20) ---- */
/* The made items that can be disintegrated: uncommon or rare ones. */
export function cheatDeathItems(c){
  if(artificer2024Level(c) < 20) return [];
  return planState(c).made.filter(function(m){ var r = rarityOf(c, m); return r==="Uncommon" || r==="Rare"; });
}
/* Disintegrate those made entries: hit points become 20 per item (up to
   the maximum, `max`). The new hit points, or 0. */
export function cheatDeath(c, madeIds, max){
  var list = cheatDeathItems(c).filter(function(m){ return madeIds.indexOf(m.id)!==-1; });
  if(!list.length) return 0;
  list.forEach(function(m){ vanishReplica(c, m); });
  c.hp.current = Math.min(max || Infinity, 20 * list.length);
  return c.hp.current;
}
export { plansKnownAt, planItemsAt };
