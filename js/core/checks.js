/* ---------------- Checks ----------------
   Ability checks, skills and passive scores, and whether a roll has
   advantage or disadvantage. */
import { SKILLS } from "../data/abilities-skills.js";
import { ARMOR_DATA } from "../data/armor.js";
import { mod, fmtMod, profBonus, combineRolls } from "./basics.js";
import { classFeatureList } from "./class-features.js";
import { effectOn } from "./effects.js";
import { weaponAbilityMod, armorPenalty } from "./equipment.js";
import { hasFeat } from "./vitals.js";

/* ---------------- Ability checks and skills ---------------- */
var SKILL_ABILITY = {};
SKILLS.forEach(function(s){ SKILL_ABILITY[s[0]] = s[1]; });
/* Half the proficiency bonus on checks of this ability that don't use it
   already: Jack of All Trades (any check, rounded down) or Remarkable
   Athlete (STR, DEX, CON, rounded up). They don't stack; the larger
   counts. {value, name} or null. */
export function halfProficiency(c, ability){
  var best = null, pb = profBonus(c);
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      var h = f.halfProficiency;
      if(!h || (h.abilities!=="all" && h.abilities.indexOf(ability)===-1)) return;
      var v = h.round==="up" ? Math.ceil(pb/2) : Math.floor(pb/2);
      if(!best || v > best.value) best = {value: v, name: f.name};
    });
  });
  return best;
}
/* A plain ability check (no skill): the ability (WIS for STR with the
   astral arms) plus half proficiency. {value, label, breakdown, roll}. */
export function abilityCheck(c, key){
  var ab = checkAbility(c, key);
  var value = ab.mod, breakdown = ab.label + " (" + fmtMod(ab.mod) + ")";
  var half = halfProficiency(c, key);
  if(half){ value += half.value; breakdown += " + " + half.name + " (" + fmtMod(half.value) + ")"; }
  return {value: value, label: ab.label, breakdown: breakdown, roll: checkRollMode(c, key)};
}
/* A skill check: its ability, then proficiency (doubled with expertise)
   or, without proficiency, half proficiency. {value, label, breakdown, roll}. */
export function skillCheck(c, skill){
  var key = SKILL_ABILITY[skill] || "str";
  var ab = checkAbility(c, key);
  var entry = c.skillProfs && c.skillProfs[skill] || {};
  var pb = profBonus(c);
  var value = ab.mod, breakdown = ab.label + " (" + fmtMod(ab.mod) + ")";
  if(entry.prof){
    var p = entry.expertise ? 2*pb : pb;
    value += p; breakdown += " + " + (entry.expertise ? "expertise" : "proficiency") + " (" + fmtMod(p) + ")";
  } else {
    var half = halfProficiency(c, key);
    if(half){ value += half.value; breakdown += " + " + half.name + " (" + fmtMod(half.value) + ")"; }
  }
  return {value: value, label: ab.label, breakdown: breakdown, roll: skillRollMode(c, skill)};
}
/* 10 + everything the check adds, +5 with advantage or -5 with
   disadvantage on it, and Observant's +5 to Perception and Investigation. */
function passiveScore(c, skill){
  var check = skillCheck(c, skill);
  var score = 10 + check.value + (check.roll.mode==="adv" ? 5 : check.roll.mode==="dis" ? -5 : 0);
  if((skill==="Perception" || skill==="Investigation") && hasFeat(c, "Observant")) score += 5;
  return score;
}
export function passivePerception(c){ return passiveScore(c, "Perception"); }
export function passiveInvestigation(c){ return passiveScore(c, "Investigation"); }
export function passiveInsight(c){ return passiveScore(c, "Insight"); }
/* The ability a check or save uses: Arms of the Astral Self lets WIS
   stand in for STR when it's higher. {mod, label}. */
export function checkAbility(c, key){
  var m = mod(c.abilities && c.abilities[key]);
  if(key==="str" && effectOn(c, "astral_arms")){
    var wis = mod(c.abilities && c.abilities.wis);
    if(wis > m) return {mod: wis, label: "WIS (Arms of the Astral Self)"};
  }
  return {mod: m, label: key.toUpperCase()};
}
/* How Stealth checks roll: disadvantage from worn armor (Scale Mail,
   Plate...) unless Medium Armor Master covers medium armor; an
   Infiltrator Armorer's Dampening Field gives advantage instead.
   {mode: "none"|"dis"|"adv", reason}. */
export function stealthCheck(c){
  var armor = (c.inventory||[]).find(function(i){ return i.type==="armor" && i.equipped && i.category!=="shield"; });
  var armorer = (c.classes||[]).find(function(cl){ return cl.name==="Artificer" && cl.subclass==="Armorer" && (Number(cl.level)||1) >= 3; });
  if(armor && armorer && armorer.armorModel==="Infiltrator") return {mode: "adv", reason: "Dampening Field (Infiltrator)"};
  var d = armor && ARMOR_DATA[armor.name];
  var noisy = armor && (armor.stealthDisadvantage || (d && d.stealthDisadvantage));
  if(!noisy) return {mode: "none", reason: ""};
  if(armor.category==="medium" && hasFeat(c, "Medium Armor Master")) return {mode: "none", reason: ""};
  return {mode: "dis", reason: (armor.name || "Your armor") + " gives disadvantage on Stealth checks"};
}
/* How a skill check rolls: Stealth as stealthCheck says, advantage on
   Acrobatics during Bladesong and on Insight and Intimidation with the
   astral visage out, disadvantage on STR and DEX skills in armor you
   aren't proficient with. {mode: "none"|"dis"|"adv", reason}. */
export function skillRollMode(c, skill){
  var list = [armorPenalty(c, SKILL_ABILITY[skill])];
  if(skill==="Stealth") list.push(stealthCheck(c));
  if(skill==="Acrobatics" && effectOn(c, "bladesong")) list.push({mode: "adv", reason: "Bladesong"});
  if((skill==="Insight" || skill==="Intimidation") && effectOn(c, "astral_visage")) list.push({mode: "adv", reason: "Wisdom of the Spirit (Visage of the Astral Self)"});
  return combineRolls(list);
}
/* A plain ability check or a saving throw with this ability. */
export function checkRollMode(c, key){ return combineRolls([armorPenalty(c, key)]); }
export function saveRollMode(c, key){ return combineRolls([armorPenalty(c, key)]); }
/* A weapon attack: disadvantage in armor you aren't proficient with when
   it uses STR or DEX (not INT from Battle Ready or CHA from Hex Warrior). */
export function attackRollMode(c, item){
  var used = weaponAbilityMod(c, item);
  var ab = c.abilities || {};
  var physical = used===mod(ab.str) || used===mod(ab.dex);
  return combineRolls([physical ? armorPenalty(c, "str") : null]);
}
