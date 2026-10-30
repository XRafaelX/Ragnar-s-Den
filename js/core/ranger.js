/* ---------------- Ranger ----------------
   The extra damage a ranger's hits can deal, and what the archetypes
   change (all checked against the Player's Handbook, Xanathar's Guide,
   Tasha's Cauldron and Fizban's Treasury on 5etools' data 2026-10-30). */
import { mod } from "./basics.js";
import { classLevelOf, usesVariant } from "./class-features.js";
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
  if(knows(c, "huntersPrey", "Colossus Slayer")) add("colossus", "Colossus Slayer", 1, 8, "", "Once per turn, if the creature is below its hit point maximum", true);
  var fey = classLevelOf(c, "Ranger", "Fey Wanderer");
  if(fey >= 3) add("dreadful", "Dreadful Strikes", 1, fey >= 11 ? 6 : 4, "Psychic", "A creature can take this only once per turn");
  if(walker >= 3) add("planar", "Planar Warrior", walker >= 11 ? 2 : 1, 8, "Force", "A bonus action marks the creature. The next time you hit it this turn, all the attack's damage becomes force");
  if(effectOn(c, "slayers_prey")) add("prey", "Slayer's Prey", 1, 6, "", "The first time each turn you hit your prey with a weapon attack", false);
  var swarm = classLevelOf(c, "Ranger", "Swarmkeeper");
  if(swarm >= 3) add("swarm", "Gathered Swarm", 1, swarm >= 11 ? 8 : 6, "Piercing", "Once on each of your turns, right after a hit. Or move the target or yourself instead (Gathered Swarm on the Features tab)", true);
  if(effectOn(c, "dread_ambusher")) add("ambush", "Dread Ambusher", 1, 8, "", "The additional attack on your first turn deals this on a hit");
  return out;
}
/* Foe Slayer (ranger 20): +WIS to an attack roll against a favored enemy. */
export function foeSlayer(c){
  return classLevelOf(c, "Ranger") >= 20 ? mod(abilityScore(c, "wis")) : 0;
}
/* Stalker's Flurry (Gloom Stalker 11): another attack after a miss. */
export function hasStalkersFlurry(c){
  return classLevelOf(c, "Ranger", "Gloom Stalker") >= 11;
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
  if(!cl || (Number(cl.level)||1) < 10 || !usesVariant(cl, "Deft Explorer")) return null;
  return longRestExhaustion(c);
}
/* Bond of Fang and Scale (Drakewarden 7): resistance to the drake's essence
   while it's summoned (it's gone at 0 hit points). */
export function drakeResistance(c){
  if(classLevelOf(c, "Ranger", "Drakewarden") < 7) return [];
  var drake = characterCompanions(c).find(function(x){ return x.def.id==="drake"; });
  return drake && drake.choice && Number(drake.hp[0]) > 0 ? [{type: drake.choice.toLowerCase(), source: "Bond of Fang and Scale"}] : [];
}
