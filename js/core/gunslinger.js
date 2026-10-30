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
