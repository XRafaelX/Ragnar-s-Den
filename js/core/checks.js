/* ---------------- Checks ----------------
   Ability checks, skills and passive scores, and whether a roll has
   advantage or disadvantage. */
import { SKILLS } from "../data/abilities-skills.js";
import { ARMOR_DATA } from "../data/armor.js";
import { RACE_DATA, TRAIT_ADVANTAGES, TRAIT_HALF_PROFICIENCY } from "../data/race-data.js";
import { mod, fmtMod, profBonus, combineRolls } from "./basics.js";
import { barbarianClassEntry } from "./character-resources.js";
import { classFeatureList } from "./class-features.js";
import { effectOn, effectRolls } from "./effects.js";
import { weaponAbility, armorPenalty } from "./equipment.js";
import { hasFeat } from "./vitals.js";
import { nextCheckAdvantage } from "./magic-items.js";
import { infusionInitiative } from "./infusion-effects.js";
import { abilityScore, abilityScores } from "./ability-scores.js";
import { conditionRolls } from "./conditions.js";

/* ---------------- Ability checks and skills ---------------- */
var SKILL_ABILITY = {};
SKILLS.forEach(function(s){ SKILL_ABILITY[s[0]] = s[1]; });
/* Half the proficiency bonus on checks of this ability that don't use it
   already: Jack of All Trades (any check, rounded down) or Remarkable
   Athlete (STR, DEX, CON, rounded up), or a race trait's (an ibis-headed
   aven's Kefnet's Blessing: INT, rounded down). They don't stack; the
   larger counts. {value, name} or null. */
export function halfProficiency(c, ability){
  var best = null, pb = profBonus(c);
  ((RACE_DATA[c.race] && RACE_DATA[c.race].traits) || []).forEach(function(t){
    var h = TRAIT_HALF_PROFICIENCY[t.name];
    if(h && h.indexOf(ability)!==-1) best = {value: Math.floor(pb/2), name: t.name};
  });
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
export function skillCheck(c, skill, passive){
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
  return {value: value, label: ab.label, breakdown: breakdown, roll: skillRollMode(c, skill, passive)};
}
/* 10 + everything the check adds, +5 with advantage or -5 with
   disadvantage on it, and Observant's +5 to Perception and Investigation. */
function passiveScore(c, skill){
  var check = skillCheck(c, skill, true);
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
  var m = mod(abilityScore(c, key));
  if(key==="str" && effectOn(c, "astral_arms")){
    var wis = mod(abilityScore(c, "wis"));
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
   aren't proficient with and from conditions (Poisoned, exhaustion).
   {mode: "none"|"dis"|"adv", reason}. */
export function skillRollMode(c, skill, passive){
  var list = [armorPenalty(c, SKILL_ABILITY[skill])].concat(alwaysAdvantage(c, "check", SKILL_ABILITY[skill]), skillAdvantage(c, skill), conditionRolls(c, "check"));
  // A boon for the next roll (Duality) isn't part of a passive score.
  if(!passive) list.push(nextCheckAdvantage(c));
  if(skill==="Stealth") list.push(stealthCheck(c));
  if(skill==="Acrobatics" && effectOn(c, "bladesong")) list.push({mode: "adv", reason: "Bladesong"});
  if((skill==="Insight" || skill==="Intimidation") && effectOn(c, "astral_visage")) list.push({mode: "adv", reason: "Wisdom of the Spirit (Visage of the Astral Self)"});
  if(skill==="Perception") list = list.concat(effectRolls(c, "perception"));
  return combineRolls(list);
}
/* ---- Advantage from features and traits ----
   [{on: "save" | "check" | "initiative" | "skill", abilities: "all" | [keys],
   skills (for "skill"), when, name}] for this character: race traits (their
   own `advantage`, else TRAIT_ADVANTAGES by name; false for none), class
   features tagged `advantage` (Feral Instinct, Danger Sense) and Rage
   ("advantage on Strength checks and Strength saving throws" while raging
   and not in heavy armor). One without `when` always applies. */
export function advantagesFor(c){
  var out = [];
  ((RACE_DATA[c.race] && RACE_DATA[c.race].traits) || []).forEach(function(t){
    var a = t.advantage!==undefined ? t.advantage : TRAIT_ADVANTAGES[t.name];
    if(!a || out.some(function(x){ return x.name===t.name; })) return;
    [].concat(a).forEach(function(one){ out.push(Object.assign({name: t.name}, one)); });
  });
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){ if(f.advantage) out.push(Object.assign({name: f.name}, f.advantage)); });
  });
  var heavy = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; });
  if(c.rage && c.rage.active && barbarianClassEntry(c) && !heavy){
    out.push({name: "Rage", on: "save", abilities: ["str"]}, {name: "Rage", on: "check", abilities: ["str"]});
  }
  return out;
}
function covers(a, on, key){ return a.on===on && (on==="initiative" || a.abilities==="all" || a.abilities.indexOf(key)!==-1); }
/* Advantage on checks with one skill (a Pallid Elf's Investigation and Insight). */
function skillAdvantage(c, skill){
  return advantagesFor(c).filter(function(a){ return a.on==="skill" && !a.when && (a.skills||[]).indexOf(skill)!==-1; })
    .map(function(a){ return {mode: "adv", reason: a.name}; });
}
/* The ones that always apply to this roll, as roll modes. */
function alwaysAdvantage(c, on, key){
  return advantagesFor(c).filter(function(a){ return !a.when && covers(a, on, key); }).map(function(a){ return {mode: "adv", reason: a.name}; });
}
/* Situational ones for a save, for reminders: [{name, when}]. */
export function situationalSaveAdvantages(c, key){
  return advantagesFor(c).filter(function(a){ return a.when && covers(a, "save", key); }).map(function(a){ return {name: a.name, when: a.when}; });
}
/* A plain ability check or a saving throw with this ability. */
export function checkRollMode(c, key){ return combineRolls([armorPenalty(c, key), nextCheckAdvantage(c)].concat(alwaysAdvantage(c, "check", key), conditionRolls(c, "check"))); }
export function saveRollMode(c, key){ return combineRolls([armorPenalty(c, key)].concat(alwaysAdvantage(c, "save", key), conditionRolls(c, "save", key), effectRolls(c, "save", key))); }
/* Initiative is a DEX check: Feral Instinct's or a Helm of Awareness's
   advantage, Duality's next ability check, and armor worn without
   proficiency's and conditions' disadvantage. */
export function initiativeRollMode(c){ return combineRolls([armorPenalty(c, "dex"), nextCheckAdvantage(c), infusionInitiative(c)].concat(alwaysAdvantage(c, "initiative"), conditionRolls(c, "check"))); }
/* A weapon attack: disadvantage in armor you aren't proficient with when
   it uses STR or DEX (not INT from Battle Ready or CHA from Hex Warrior),
   and what conditions do to attack rolls. */
export function attackRollMode(c, item){
  // Only when every best choice is STR or DEX (on a tie with INT from
  // Battle Ready, the player attacks with INT and avoids it).
  var physical = weaponAbility(c, item).keys.every(function(k){ return k==="str" || k==="dex"; });
  return combineRolls([physical ? armorPenalty(c, "str") : null].concat(conditionRolls(c, "attack"), effectRolls(c, "attack")));
}
/* An attack with no weapon card (a spell attack, the astral arms): only
   conditions change it (Poisoned, Invisible, exhaustion). */
export function plainAttackRollMode(c){ return combineRolls(conditionRolls(c, "attack").concat(effectRolls(c, "attack"))); }
