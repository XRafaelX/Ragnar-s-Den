/* ---------------- Ranger ----------------
   The extra damage a ranger's hits can deal, and what the archetypes
   change (all checked against the Player's Handbook, Xanathar's Guide,
   Tasha's Cauldron and Fizban's Treasury on 5etools' data 2026-10-30). */
import { mod } from "./basics.js";
import { classLevelOf, usesVariant, isRanger2024 } from "./class-features.js";
import { characterChoices } from "./class-picks.js";
import { resourceLeft } from "./effects.js";
import { abilityScore } from "./ability-scores.js";
import { allKnownOptions } from "./class-options.js";
import { effectOn } from "./effects.js";
import { longRestExhaustion } from "./conditions.js";
import { characterCompanions } from "./companions.js";

function ranger(c){
  return (c.classes||[]).find(function(cl){ return cl.name==="Ranger"; }) || null;
}
function knows(c, setId, name){
  return allKnownOptions(c, setId).some(function(o){ return o.name===name; });
}
/* Favored Foe (Tasha's, ranger 1): 1d4, 1d6 from 6, 1d8 from 14. 0 without it. */
export function favoredFoeDie(c){
  var cl = ranger(c);
  if(!cl || !usesVariant(cl, "Favored Foe")) return 0;
  var lv = Number(cl.level)||1;
  return lv >= 14 ? 8 : lv >= 6 ? 6 : 4;
}
/* The extra dice on a hit, for a weapon's card: [{id, text, qty, die, label,
   title, unarmed (an unarmed strike can deal it too)}]. */
export function rangerHitDice(c){
  var out = [], walker = classLevelOf(c, "Ranger", "Horizon Walker");
  function add(id, name, qty, die, type, title, unarmed){
    out.push({id: id, name: name, text: name + " +" + qty + "d" + die, qty: qty, die: die, label: name + (type ? " (" + type + ")" : ""), title: title, unarmed: !!unarmed});
  }
  var foe = favoredFoeDie(c);
  if(foe && effectOn(c, "favored_foe")) add("foe", "Favored Foe", 1, foe, "", "The first time on each of your turns that you hit the marked creature", true);
  // Hunter's Mark (2024 ranger): every hit with an attack roll on the marked creature.
  var mark = huntersMarkDie(c);
  if(mark) add("mark", "Hunter's Mark", 1, mark, "Force", "Each time you hit the marked creature with an attack roll", true);
  if(knows(c, "huntersPrey", "Colossus Slayer") || characterChoices(c, "huntersPrey2024").indexOf("Colossus Slayer")!==-1) add("colossus", "Colossus Slayer", 1, 8, "", "Once per turn, if the creature is missing any of its hit points", !isRanger2024(c));
  var fey = classLevelOf(c, "Ranger", "Fey Wanderer");
  if(fey >= 3) add("dreadful", "Dreadful Strikes", 1, fey >= 11 ? 6 : 4, "Psychic", "A creature can take this only once per turn");
  if(walker >= 3) add("planar", "Planar Warrior", walker >= 11 ? 2 : 1, 8, "Force", "A bonus action marks the creature. The next time you hit it this turn, all the attack's damage becomes force");
  if(effectOn(c, "slayers_prey")) add("prey", "Slayer's Prey", 1, 6, "", "The first time each turn you hit your prey with a weapon attack", false);
  var swarm = classLevelOf(c, "Ranger", "Swarmkeeper");
  if(swarm >= 3) add("swarm", "Gathered Swarm", 1, swarm >= 11 ? 8 : 6, "Piercing", "Once on each of your turns, right after a hit. Or move the target or yourself instead (Gathered Swarm on the Features tab)", true);
  if(effectOn(c, "dread_ambusher") && !isRanger2024(c)) add("ambush", "Dread Ambusher", 1, 8, "", "The additional attack on your first turn deals this on a hit");
  // Dreadful Strike (2024 Gloom Stalker 3): spends a use, once per turn.
  var dread = dreadfulStrike(c);
  if(dread){
    add("dreadful_strike", "Dreadful Strike", 2, dread.die, "Psychic", "Once per turn: spends a use (" + dread.left + " left)" + (classLevelOf(c, "Ranger", "Gloom Stalker") >= 11 ? ". Stalker's Flurry adds Sudden Strike or Mass Fear" : ""), false);
    out[out.length - 1].pay = "Ranger:dreadful_strike";
  }
  return out;
}
/* Hunter's Mark's die while it's on (2024 ranger): d6, d10 from Foe Slayer
   (20). 0 when it's off. */
export function huntersMarkDie(c){
  if(!isRanger2024(c) || !effectOn(c, "hunters_mark")) return 0;
  return classLevelOf(c, "Ranger") >= 20 ? 10 : 6;
}
/* Favored Enemy (2024 ranger 1): free casts of Hunter's Mark left. */
export function favoredEnemyLeft(c){
  return isRanger2024(c) ? Math.max(0, resourceLeft(c, "Ranger:favored_enemy")) : 0;
}
/* Dreadful Strike (2024 Gloom Stalker 3): {die (6, 8 from 11), left}, or null. */
export function dreadfulStrike(c){
  if(!isRanger2024(c)) return null;
  var lv = classLevelOf(c, "Ranger", "Gloom Stalker");
  if(lv < 3) return null;
  return {die: lv >= 11 ? 8 : 6, left: Math.max(0, resourceLeft(c, "Ranger:dreadful_strike"))};
}
/* Precise Hunter (2024 ranger 17): advantage against the marked creature. */
export function preciseHunter(c){
  return isRanger2024(c) && classLevelOf(c, "Ranger") >= 17 && effectOn(c, "hunters_mark");
}
/* Foe Slayer (2014 ranger 20): +WIS to an attack roll against a favored enemy. */
export function foeSlayer(c){
  return classLevelOf(c, "Ranger") >= 20 && !isRanger2024(c) ? mod(abilityScore(c, "wis")) : 0;
}
/* Stalker's Flurry (2014 Gloom Stalker 11): another attack after a miss. */
export function hasStalkersFlurry(c){
  return classLevelOf(c, "Ranger", "Gloom Stalker") >= 11 && !isRanger2024(c);
}
/* Supernatural Defense (Monster Slayer 7): +1d6 against your prey. */
export function hasSupernaturalDefense(c){
  return classLevelOf(c, "Ranger", "Monster Slayer") >= 7 && effectOn(c, "slayers_prey");
}
/* Otherworldly Glamour (Fey Wanderer 3): +WIS (minimum +1) to CHA checks. */
export function otherworldlyGlamour(c){
  return classLevelOf(c, "Ranger", "Fey Wanderer") >= 3 ? Math.max(1, mod(abilityScore(c, "wis"))) : 0;
}
/* Tireless (Deft Explorer, ranger 10): a short rest lowers exhaustion by 1.
   The new level, or null if nothing changed. */
export function tirelessRest(c){
  var cl = ranger(c);
  if(!cl || (Number(cl.level)||1) < 10 || !(usesVariant(cl, "Deft Explorer") || cl.edition==="2024")) return null;
  return longRestExhaustion(c);
}
/* Bond of Fang and Scale (Drakewarden 7): resistance to the drake's essence
   while it's summoned (it's gone at 0 hit points). */
export function drakeResistance(c){
  if(classLevelOf(c, "Ranger", "Drakewarden") < 7) return [];
  var drake = characterCompanions(c).find(function(x){ return x.def.id==="drake"; });
  return drake && drake.choice && Number(drake.hp[0]) > 0 ? [{type: drake.choice.toLowerCase(), source: "Bond of Fang and Scale"}] : [];
}
