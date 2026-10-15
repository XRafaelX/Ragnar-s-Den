/* ---------------- Magic items ----------------
   What a carried magic item does, worked out when shown. An inventory row
   is a magic item when its `magicItem` names an entry in
   js/data/magic-items.js; one that needs attunement works only while
   `attuned` is set (the Attune switch on its card).
   A Heavy Holster keeps its knife count on the row (`knives`): each knife
   in it adds damage to your attacks, and an empty one adds speed. */
import { MAGIC_ITEM_DATA } from "../data/magic-items.js";
import { classFeatureList } from "./class-features.js";

export function magicItemDef(item){
  return item && item.magicItem ? MAGIC_ITEM_DATA[item.magicItem] || null : null;
}

/* Its magic is on: carried, and attuned if it needs to be. */
export function magicItemActive(item){
  var d = magicItemDef(item);
  return !!d && (!d.attunement || !!item.attuned);
}

/* ---- Attunement ----
   Three items at once, more with a feature tagged `attuneLimit` (an
   artificer's Magic Item Adept, Savant and Master), and never two copies
   of the same item. */
export function attunementLimit(c){
  var best = 3;
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){ if(f.attuneLimit) best = Math.max(best, f.attuneLimit); });
  });
  return best;
}
export function attunedItems(c){
  return (c.inventory||[]).filter(function(i){ var d = magicItemDef(i); return d && d.attunement && i.attuned; });
}
/* Why this item can't be attuned to now, or null if it can (or already is). */
export function attuneProblem(c, item){
  if(item.attuned) return null;
  var attuned = attunedItems(c);
  if(attuned.some(function(i){ return i.magicItem===item.magicItem; })) return "You're already attuned to a " + item.magicItem + ". You can't attune to two copies of the same item.";
  var limit = attunementLimit(c);
  if(attuned.length >= limit) return "You're attuned to " + limit + " of " + limit + " items, your limit. End the attunement to one of them first.";
  return null;
}

/* ---- Heavy Holster ---- */
export function holsterKnives(item){
  var d = magicItemDef(item);
  if(!d || !d.holster) return 0;
  var n = Number(item.knives);
  return Math.max(0, Math.min(d.holster.capacity, isNaN(n) ? d.holster.capacity : n));
}

/* The working holster: the first attuned one (a creature can't attune to
   more than one copy of an item), or null. */
function activeHolster(c){
  return (c.inventory||[]).find(function(i){ return magicItemActive(i) && magicItemDef(i).holster; }) || null;
}

/* Extra damage on every attack: the knives in the attuned holster. */
export function holsterDamageBonus(c){
  var h = activeHolster(c);
  return h ? holsterKnives(h) * magicItemDef(h).holster.damagePerKnife : 0;
}

/* Speed parts for computeSpeed: an attuned holster with no knives in it. */
export function holsterSpeedParts(c){
  var h = activeHolster(c);
  return h && holsterKnives(h)===0 ? [{name: h.name || h.magicItem, value: magicItemDef(h).holster.emptySpeed, why: "holster empty"}] : [];
}
