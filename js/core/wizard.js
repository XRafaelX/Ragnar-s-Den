/* ---------------- Wizard ----------------
   The schools' moving parts (checked against the Player's Handbook,
   Xanathar's Guide, Tasha's Cauldron and Explorer's Guide to Wildemount on
   5etools' data 2026-10-30). */
import { mod, profBonus } from "./basics.js";
import { classLevelOf } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { resourceLeft, spendResource, effectOn } from "./effects.js";

function wizardLevel(c){ return classLevelOf(c, "Wizard"); }
function school(c, name){ return classLevelOf(c, "Wizard", name); }

export function wizardDc(c){ return 8 + profBonus(c) + mod(abilityScore(c, "int")); }
/* Arcane Recovery: half the wizard level, rounded up, in slot levels. */
export function arcaneRecoveryBudget(c){
  return Math.ceil(wizardLevel(c) / 2);
}

/* ---- Evocation ---- */
/* Overchannel: the first is free. After that, d12s per spell level: 2, 3, 4... */
export function overchannelDice(c, level){
  var n = Number(c.overchannels)||0;
  return n ? (n + 1) * level : 0;
}

/* ---- Abjuration ---- */
var WARD = "Wizard:arcane_ward";
export function wardUp(c){
  return !!c.arcaneWard && school(c, "School of Abjuration") >= 2;
}
/* Hit points the ward has left to soak (0 when it isn't up). */
export function wardLeft(c){
  return wardUp(c) ? resourceLeft(c, WARD) : 0;
}
/* The ward takes damage before you. What's left for you. */
export function wardAbsorb(c, n){
  if(!wardUp(c)) return n;
  var left = resourceLeft(c, WARD), took = Math.min(left, n);
  if(took) spendResource(c, WARD, took);
  return n - took;
}
/* An abjuration spell gives it twice the spell's level. */
export function restoreWard(c, level){
  if(!c.resourcesUsed) c.resourcesUsed = {};
  c.resourcesUsed[WARD] = Math.max(0, (Number(c.resourcesUsed[WARD])||0) - 2 * level);
}

/* ---- Divination ---- */
export function portentCount(c){
  return school(c, "School of Divination") >= 14 ? 3 : 2;
}
export function rollPortent(c){
  if(!school(c, "School of Divination")) return null;
  c.portent = [];
  for(var i = 0; i < portentCount(c); i++) c.portent.push(Math.floor(Math.random() * 20) + 1);
  return c.portent;
}
export function usePortent(c, index){
  if(!c.portent || c.portent[index]==null) return 0;
  var n = c.portent.splice(index, 1)[0];
  spendResource(c, "Wizard:portent", 1);
  return n;
}

/* ---- Necromancy ---- */
export function grimHarvest(level, necromancy){
  return level * (necromancy ? 3 : 2);
}

/* ---- War Magic ---- */
export function hasArcaneDeflection(c){
  return school(c, "War Magic") >= 2;
}
export function deflectingShroud(c){
  var lv = school(c, "War Magic");
  return lv >= 14 ? Math.floor(lv / 2) : 0;
}
export function powerSurgeDamage(c){
  return Math.floor(wizardLevel(c) / 2);
}
/* Surges: exactly one after a long rest, and one after a short rest with none. */
export function surgesOnRest(c, kind, max){
  var key = "Wizard:power_surges";
  if(!school(c, "War Magic") || wizardLevel(c) < 6) return;
  if(!c.resourcesUsed) c.resourcesUsed = {};
  if(kind==="long" || (Number(c.resourcesUsed[key])||0) >= max) c.resourcesUsed[key] = Math.max(0, max - 1);
}

/* ---- Transmutation ---- */
export var STONE_BENEFITS = ["Darkvision", "Speed", "CON saves", "Acid", "Cold", "Fire", "Lightning", "Thunder"];
/* The benefit of the stone you carry, or "". */
export function stoneBenefit(c){
  return school(c, "School of Transmutation") >= 6 ? c.stoneBenefit || "" : "";
}
export function consumeStone(c){
  delete c.stoneBenefit;
  c.stoneGone = true;
}

/* ---- Chronurgy ---- */
export function chronalShiftLeft(c){
  return Math.max(0, resourceLeft(c, "Wizard:chronal_shift"));
}
