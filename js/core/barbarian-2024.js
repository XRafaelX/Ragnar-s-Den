/* ---------------- The 2024 barbarian on the sheet ----------------
   What the 2024 class and its paths do beyond the 2014 rules that are
   shared with them (Player's Handbook 2024, pp. 51 to 56). The features'
   words are in js/data/barbarian-2024.js. The Rage card, weapon cards and
   dice tray offer these. */
import { isBarbarian2024 } from "./class-features.js";
import { barbarianClassEntry, barbarianRageDamage, barbarianRageMax } from "./character-resources.js";
import { characterChoices } from "./class-picks.js";
import { abilityScore } from "./ability-scores.js";
import { mod, profBonus } from "./basics.js";
import { SKILLS } from "../data/abilities-skills.js";
import { effectOn } from "./effects.js";
import { isHeavyWeapon, isRangedWeapon } from "./equipment.js";
import { weaponDataOf } from "../data/weapons.js";

function raging(c){ return !!(c.rage && c.rage.active); }
function level2024(c, subclass){
  var cl = isBarbarian2024(c) && barbarianClassEntry(c);
  return cl && (!subclass || cl.subclass===subclass) ? Number(cl.level)||1 : 0;
}
/* The Rage Damage bonus at this barbarian's level. */
export function rageBonusOf(c){
  var cl = barbarianClassEntry(c);
  return cl ? barbarianRageDamage(Number(cl.level)||1) : 0;
}
/* ---- Rage's uses ---- */
export function ragesLeft(c){
  var cl = barbarianClassEntry(c);
  if(!cl) return 0;
  var max = barbarianRageMax(Number(cl.level)||1, cl);
  return max===Infinity ? Infinity : Math.max(0, max - (Number(c.rage && c.rage.used)||0));
}
/* Spend a use of Rage on something other than entering one. True if it could. */
export function spendRage(c){
  if(ragesLeft(c) <= 0) return false;
  if(ragesLeft(c)!==Infinity) c.rage.used = (Number(c.rage.used)||0) + 1;
  return true;
}
/* A short rest gives one use back. True if it did. */
export function rageOnShortRest(c){
  if(!isBarbarian2024(c) || !c.rage || !(Number(c.rage.used) > 0)) return false;
  c.rage.used = Number(c.rage.used) - 1;
  return true;
}
/* Persistent Rage (15): all the uses back when you roll initiative, once
   per long rest. Offered only when a use is spent. */
export function persistentRageReady(c){
  return level2024(c) >= 15 && !c.rage.persistentUsed && Number(c.rage.used) > 0;
}
export function usePersistentRage(c){
  if(!persistentRageReady(c)) return false;
  c.rage.used = 0;
  c.rage.persistentUsed = true;
  return true;
}
/* Whether this condition ends the Rage: being incapacitated does, and only
   falling unconscious from Persistent Rage (15) on. */
export function conditionEndsRage(c, def){
  if(!raging(c) || !level2024(c) || !def || !def.incapacitated) return false;
  return level2024(c) < 15 || def.id==="unconscious" || def.id==="asleep";
}

/* ---- Primal Knowledge (3) ----
   While raging, these skills can be Strength checks. The sheet makes them
   so when Strength is at least as good as the skill's own ability. (A
   passive score isn't a check you make.) */
export var PRIMAL_SKILLS = ["Acrobatics", "Intimidation", "Perception", "Stealth", "Survival"];
export function primalStrength(c, skill, passive){
  if(passive || !raging(c) || level2024(c) < 3 || PRIMAL_SKILLS.indexOf(skill)===-1) return false;
  var row = SKILLS.find(function(s){ return s[0]===skill; });
  return mod(abilityScore(c, "str")) >= mod(abilityScore(c, row[1]));
}

/* ---- Brutal Strike (9) ----
   Reckless Attack on: {dice, picks, effects} for one Strength attack that
   gives up its advantage, or null. */
var BRUTAL_EFFECTS = [
  {name: "Forceful Blow", level: 9, short: "Push it 15 feet, then move half your speed toward it",
    line: "Forceful Blow: the target is pushed 15 feet straight away from you. You can then move up to half your speed straight toward it with no opportunity attacks."},
  {name: "Hamstring Blow", level: 9, short: "Its speed drops by 15 feet",
    line: "Hamstring Blow: the target's speed drops by 15 feet until the start of your next turn."},
  {name: "Staggering Blow", level: 13, short: "Disadvantage on its next save, and no opportunity attacks",
    line: "Staggering Blow: the target has disadvantage on its next saving throw and can't make opportunity attacks until the start of your next turn."},
  {name: "Sundering Blow", level: 13, short: "The next attack by someone else against it gains +5",
    line: "Sundering Blow: before the start of your next turn, the next attack roll another creature makes against the target gains +5."}
];
export function brutalStrike(c){
  var lv = level2024(c);
  if(lv < 9 || !effectOn(c, "reckless_attack")) return null;
  return {dice: lv >= 17 ? 2 : 1, picks: lv >= 17 ? 2 : 1, effects: BRUTAL_EFFECTS.filter(function(e){ return lv >= e.level; })};
}
/* Frenzy (Berserker 3): raging and reckless, the dice on the first Strength
   hit of your turn. 0 without them. */
export function frenzyDice(c){
  return raging(c) && level2024(c, "Path of the Berserker (2024)") >= 3 && effectOn(c, "reckless_attack") ? rageBonusOf(c) : 0;
}
/* Fanatical Focus (Zealot 6): the 2024 reroll's bonus. 0 on the 2014 one. */
export function fanaticalBonus(c){ return isBarbarian2024(c) ? rageBonusOf(c) : 0; }

/* ---- Path of the Wild Heart ---- */
var HEART = "Path of the Wild Heart";
export var WILDS_OPTIONS = {
  "Bear": "Resistance to every damage type except force, necrotic, psychic and radiant.",
  "Eagle": "Disengage and Dash as part of entering your Rage. While it's active, a bonus action does both.",
  "Wolf": "Your allies have advantage on attack rolls against any enemy of yours within 5 feet of you."
};
export var POWER_OPTIONS = {
  "Falcon": "A fly speed equal to your speed if you aren't wearing any armor.",
  "Lion": "Enemies within 5 feet of you have disadvantage on attack rolls against anyone but you or another barbarian with this option.",
  "Ram": "When you hit a Large or smaller creature with a melee attack, you can knock it prone."
};
/* Which choice this Rage still asks for: "wilds", "power" or "". */
export function wildsChoiceDue(c, which){
  if(!raging(c)) return false;
  if(which==="wilds") return level2024(c, HEART) >= 3 && !c.rage.wilds;
  return level2024(c, HEART) >= 14 && !c.rage.wildsPower;
}
/* The Owl, Panther or Salmon picked on the Feature choices card, or "". */
export function wildAspect(c){
  return level2024(c, HEART) >= 6 ? characterChoices(c, "wildAspect")[0] || "" : "";
}

/* ---- Path of the World Tree ---- */
var TREE = "Path of the World Tree";
/* Vitality Surge's temporary hit points when a Rage starts. */
export function vitalitySurge(c){ return level2024(c, TREE) >= 3 ? level2024(c, TREE) : 0; }
export function lifeGivingDice(c){ return raging(c) && level2024(c, TREE) >= 3 ? rageBonusOf(c) : 0; }
/* Branches of the Tree's save DC while raging, or 0. */
export function branchesDc(c){
  return raging(c) && level2024(c, TREE) >= 6 ? 8 + mod(abilityScore(c, "str")) + profBonus(c) : 0;
}
/* Battering Roots (10): a melee weapon with the Heavy or Versatile property. */
export function batteringRoots(c, item){
  if(level2024(c, TREE) < 10 || !item || item.type!=="weapon" || isRangedWeapon(item)) return false;
  var props = ((weaponDataOf(item) || {}).properties || "") + " " + (item.notes || "");
  return isHeavyWeapon(item) || /versatile/i.test(props);
}
/* Travel Along the Tree (14): the long teleport, once per Rage. */
export function longTravelReady(c){ return raging(c) && level2024(c, TREE) >= 14 && !c.rage.longTravel; }
export function hasTreeTravel(c){ return raging(c) && level2024(c, TREE) >= 14; }

/* ---- Path of the Zealot ---- */
var ZEALOT = "Path of the Zealot (2024)";
/* Rage of the Gods (14): the form is on while this Rage is, until 0 HP. */
export function hasRageOfGods(c){ return level2024(c, ZEALOT) >= 14; }
export function divineFormOn(c){ return raging(c) && !!c.rage.gods && hasRageOfGods(c); }
/* Revivification sets a creature's hit points to this. */
export function revivificationHp(c){ return level2024(c, ZEALOT); }

/* The fly speed this Rage gives, for computeSpeed: the source's name, or "". */
export function rageFlySource(c, wearsArmor){
  if(!raging(c)) return "";
  if(divineFormOn(c)) return "Rage of the Gods";
  return c.rage.wildsPower==="Falcon" && !wearsArmor && level2024(c, HEART) >= 14 ? "Power of the Wilds (Falcon)" : "";
}
