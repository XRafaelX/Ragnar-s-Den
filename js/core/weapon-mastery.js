/* ---------------- Weapon mastery on the sheet ----------------
   Which weapons' mastery properties the character can use (the kinds the
   Weapon Master (2024) feat picked, and a 2024 class's Weapon Mastery
   picks, the choice "weaponMastery"), and what a weapon's mastery is. The dice
   tray offers each property after an attack with the weapon
   (js/render/panels/sheet-rolls.js), and Nick turns the off-hand attack
   into part of the Attack action. Data: js/data/weapon-mastery.js. */
import { WEAPON_MASTERY, MASTERY_PROPERTIES } from "../data/weapon-mastery.js";
import { WEAPON_DATA, baseWeaponName } from "../data/weapons.js";
import { featDef } from "./feat-picks.js";
import { profBonus } from "./basics.js";
import { characterChoices } from "./class-picks.js";

/* The kind of weapon an item is for mastery: its base weapon, or the one
   the book says to treat it as (a khopesh: a longsword). "" if none. */
export function masteryKind(item){
  var name = baseWeaponName(item) || (item && item.name) || "";
  if(WEAPON_MASTERY[name]) return name;
  var alike = (WEAPON_DATA[name] || {}).treatAs;
  return alike && WEAPON_MASTERY[alike] ? alike : "";
}
/* Every weapon kind whose mastery the character can use, each once:
   [{kind, source}]. */
export function masteryKinds(c){
  var out = [];
  function add(kind, source){ if(kind && WEAPON_MASTERY[kind] && !out.some(function(x){ return x.kind===kind; })) out.push({kind: kind, source: source}); }
  (c.feats||[]).forEach(function(f){
    var d = featDef(f.name);
    if(d && d.masteryPick && f.picks) add(f.picks.option, d.name);
  });
  characterChoices(c, "weaponMastery").forEach(function(k){ add(k, "Weapon Mastery"); });
  return out;
}
/* The mastery this weapon gives the character now: {name, when, short,
   text, source}, or null (none, not unlocked, or not proficient). */
export function weaponMastery(c, item){
  if(!item || item.type!=="weapon" || !item.proficient) return null;
  var kind = masteryKind(item), got = kind && masteryKinds(c).find(function(x){ return x.kind===kind; });
  if(!got) return null;
  var name = WEAPON_MASTERY[kind];
  return Object.assign({name: name, kind: kind, source: got.source}, MASTERY_PROPERTIES[name]);
}
/* Topple's save DC: 8 + the attack's ability modifier + proficiency bonus. */
export function toppleDc(c, abilityMod){
  return 8 + (Number(abilityMod)||0) + profBonus(c);
}
/* Weapon Master (2024): the feat copy whose kind can be changed to this
   weapon's (after a long rest), or null: the character has the feat, the
   weapon has a mastery, and it isn't already the one. */
export function weaponMasterSwitch(c, item){
  var kind = masteryKind(item);
  if(!kind || !item.proficient) return null;
  var feat = (c.feats||[]).find(function(f){ var d = featDef(f.name); return d && d.masteryPick; });
  if(!feat || masteryKinds(c).some(function(x){ return x.kind===kind; })) return null;
  return feat;
}
