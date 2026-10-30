/* ---------------- Gunslinger class rounds (Michael's homebrew) ----------------
   Which rounds a class firearm (firearmSet "gunslinger") fires, the one
   loaded (item.round = {kind, heavy, element, spell}) and spending one per
   shot. Heavy rounds add 3 damage and a die on a critical hit. Master of
   the Barrel (gunslinger 20): rounds have no types, so any kind can be
   loaded and any stack of the right weight pays for the shot (spell
   rounds aside). */
import { ROUND_KINDS, HEAVY_ROUND_DAMAGE } from "../data/gunslinger-rounds.js";
import { weaponDataOf } from "../data/weapons.js";
import { classLevelOf } from "./class-features.js";

export function isClassFirearm(item){
  return !!(item && item.type==="weapon" && item.firearmSet==="gunslinger" && weaponDataOf(item));
}
/* The Handcannon and Long Gun fire heavy rounds. */
export function takesHeavyRounds(item){
  return isClassFirearm(item) && /heavy ammunition/i.test(weaponDataOf(item).properties || "");
}
export function roundsHaveNoType(c){
  return classLevelOf(c, "Gunslinger") >= 20;
}
/* The rounds the character carries that fit this gun. */
export function roundStacks(c, item){
  var heavy = takesHeavyRounds(item);
  return (c.inventory||[]).filter(function(i){ return i.round && ROUND_KINDS[i.round] && !!i.heavy===heavy && (Number(i.qty)||0) > 0; });
}
function sameRound(stack, r){
  return stack.round===r.kind && (r.kind!=="spell" || stack.spell===r.spell) && (r.kind!=="elemental" || !stack.element || stack.element===r.element);
}
/* The stack the loaded round comes from: its own kind, or with Master of
   the Barrel any non-spell stack. null when none is left. */
export function loadedStack(c, item){
  var r = item && item.round;
  if(!r) return null;
  var stacks = roundStacks(c, item);
  return stacks.find(function(s){ return sameRound(s, r); })
    || (roundsHaveNoType(c) && r.kind!=="spell" ? stacks.find(function(s){ return s.round!=="spell"; }) : null) || null;
}
/* What the loaded round does: {kind, def, heavy, element, spell,
   damageType, noDamage, note}, or null (no round chosen: the gun's own
   piercing shot). */
export function loadedRound(c, item){
  if(!isClassFirearm(item) || !item.round || !ROUND_KINDS[item.round.kind]) return null;
  var r = item.round, def = ROUND_KINDS[r.kind];
  return {kind: r.kind, def: def, heavy: takesHeavyRounds(item), element: r.element || "", spell: r.spell || "",
    damageType: def.elemental ? (r.element || "") : def.damageType || "", noDamage: !!def.noDamage, note: def.note || ""};
}
/* +3 damage while a heavy round is loaded (and it deals damage). */
export function heavyRoundBonus(c, item){
  var r = loadedRound(c, item);
  return r && r.heavy && !r.noDamage && !r.spell ? HEAVY_ROUND_DAMAGE : 0;
}
/* A shot: one round from the stack. The last one of a kind unloads it
   (a spell round always does). True if a round was spent. */
export function spendRound(c, item){
  var r = loadedRound(c, item), stack = r && loadedStack(c, item);
  if(!stack) return false;
  stack.qty = (Number(stack.qty)||0) - 1;
  if(stack.qty <= 0) c.inventory.splice(c.inventory.indexOf(stack), 1);
  if(r.kind==="spell" || !loadedStack(c, item)) delete item.round;
  return true;
}

/* ---- Marksman (the subclass's firearm features) ---- */
function isFirearmItem(item){
  var d = weaponDataOf(item);
  return !!(item && item.type==="weapon" && d && d.category==="firearm");
}
/* Improved Critical (3) and Deadly Critical (18): a firearm's critical
   range, 20 without them. */
export function marksmanCritMin(c, item){
  var lv = isFirearmItem(item) ? classLevelOf(c, "Gunslinger", "Marksman") : 0;
  return lv >= 18 ? 18 : lv >= 3 ? 19 : 20;
}
/* Deadly Critical (18): one more of the firearm's dice on a critical hit. */
export function deadlyCriticalDice(c, item){
  return isFirearmItem(item) && classLevelOf(c, "Gunslinger", "Marksman") >= 18 ? 1 : 0;
}
/* The extra dice a hit with this firearm adds, shaped like rangerHitDice:
   Vital Points (7), 1d6 and 2d6 from 18. */
export function gunslingerHitDice(c, item){
  var lv = isFirearmItem(item) ? classLevelOf(c, "Gunslinger", "Marksman") : 0;
  if(lv < 7) return [];
  var qty = lv >= 18 ? 2 : 1;
  return [{id: "vital", name: "Vital Points", text: "Vital Points +" + qty + "d6", qty: qty, die: 6, label: "Vital Points",
    title: "Once on each of your turns, against a creature that is missing any hit points"}];
}

/* ---- Outlaw ---- */
function outlawLevel(c){ return classLevelOf(c, "Gunslinger", "Outlaw"); }
/* A firearm in hand (Outlaw's Grit's Intimidation bonus). */
export function holdsFirearm(c){
  return (c.inventory||[]).some(function(i){ return i.equipped && isFirearmItem(i); });
}
/* Outlaw's Grit (1): +2 damage with a firearm when no other weapon is in
   hand, judged like Dueling. Two-handed guns count: the rule only asks
   for a single firearm. */
export function outlawGritBonus(c, item){
  if(!outlawLevel(c) || !isFirearmItem(item)) return 0;
  var other = (c.inventory||[]).some(function(i){ return i!==item && i.equipped && i.type==="weapon"; });
  return other ? 0 : 2;
}
/* Outlaw's Grit: a light, one-handed firearm can be dual-wielded. */
export function outlawDualFirearm(c, item){
  if(!outlawLevel(c) || !isFirearmItem(item)) return false;
  var props = weaponDataOf(item).properties || "";
  return /\blight\b/i.test(props) && !/two-handed/i.test(props);
}
/* Playing Dirty (14): the next shot is a blinding flash. item.rigged is
   the player's pick on the gun's card. */
export var RIGGED_ROUND_NOTE = "Rigged: range 10 feet and no damage. The target must succeed on a DC 14 Wisdom saving throw or be blinded until the start of your next turn.";
export function canRigRound(c){
  return outlawLevel(c) >= 14;
}
export function roundRigged(c, item){
  return canRigRound(c) && !!(item && item.rigged);
}
