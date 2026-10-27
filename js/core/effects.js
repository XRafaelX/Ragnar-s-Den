/* ---------------- Active effects ----------------
   Effects switched on from the Vitals tab (Bladesong, the Astral Self,
   Symbiotic Entity) and the numbers they change. */
import { TOGGLE_EFFECTS } from "../data/effects.js";
import { mod, profBonus, totalLevel } from "./basics.js";
import { characterResources } from "./character-resources.js";
import { classLevelOf } from "./class-features.js";
import { isRangedWeapon } from "./equipment.js";
import { abilityScore, abilityScores } from "./ability-scores.js";

/* ---------------- Temporary effects ----------------
   Bladesong, the Astral Self and Symbiotic Entity (js/data/effects.js).
   c.effects holds the ids switched on. One only counts while the
   character still has the feature and nothing has cut it short: Bladesong
   in medium or heavy armor or with a shield, Symbiotic Entity with its
   temporary HP gone, Awakened Astral Self without the arms and visage. */
function effectDef(id){
  return TOGGLE_EFFECTS.find(function(d){ return d.id===id; });
}
/* Who has it: the class entry, or for a race's effect the race (from
   the character level it starts at). */
function effectClass(c, def){
  if(def.race) return def.race.indexOf(c.race)!==-1 && totalLevel(c) >= def.level;
  return (c.classes||[]).find(function(cl){
    return cl.name===def.className && cl.subclass===def.subclass && (Number(cl.level)||1) >= def.level;
  });
}
/* Why an effect that's switched on gives nothing right now, or "". */
export function effectBlocked(c, id){
  if(id==="bladesong"){
    var worn = (c.inventory||[]).find(function(i){
      return i.type==="armor" && i.equipped && (i.category==="medium" || i.category==="heavy" || i.category==="shield");
    });
    if(worn) return "Not working while you wear " + (worn.name || "medium or heavy armor or a shield") + ".";
  }
  return "";
}
export function effectOn(c, id){
  var def = effectDef(id);
  if(!def || !(c.effects && c.effects[id]) || !effectClass(c, def)) return false;
  if((def.requires||[]).some(function(r){ return !effectOn(c, r); })) return false;
  if(id==="symbiotic_entity" && !((Number(c.hp && c.hp.temp)||0) > 0)) return false;
  return !effectBlocked(c, id);
}
/* The effects this character has, for the card: {def, on, blocked,
   resource (the class resource it spends), why (it can't start, or "")}. */
export function characterEffects(c){
  var resources = characterResources(c);
  var flags = c.effects || {};
  return TOGGLE_EFFECTS.filter(function(def){ return effectClass(c, def); }).map(function(def){
    var res = def.cost && resources.find(function(r){ return r.key===(def.race ? "race" : def.className)+":"+def.cost.resource; });
    var on = !!flags[def.id];
    var why = "";
    if(!on){
      var missing = (def.requires||[]).filter(function(r){ return !flags[r]; });
      if(missing.length) why = "Needs " + missing.map(function(r){ return effectDef(r).name; }).join(" and ") + " first.";
      else if(def.cost && (!res || res.max - res.used < def.cost.amount)) why = "Not enough " + (res ? res.name : def.cost.resource) + " left.";
    }
    return {def: def, on: on, blocked: on ? effectBlocked(c, def.id) : "", resource: res, why: why};
  });
}
/* Switch an effect on: pay its cost and, for Symbiotic Entity, gain its
   temporary HP (they don't stack: keep the higher). False if it can't. */
export function startEffect(c, id){
  var e = characterEffects(c).find(function(x){ return x.def.id===id; });
  if(!e || e.on || e.why) return false;
  if(e.resource && e.resource.max!==Infinity){
    if(!c.resourcesUsed) c.resourcesUsed = {};
    c.resourcesUsed[e.resource.key] = e.resource.used + e.def.cost.amount;
  }
  if(!c.effects) c.effects = {};
  c.effects[id] = true;
  if(id==="symbiotic_entity"){
    if(!c.hp) c.hp = {max:0, current:0, temp:0};
    c.hp.temp = Math.max(Number(c.hp.temp)||0, symbioticTempHp(c));
  }
  return true;
}
/* Switch an effect off, and anything that needs it. */
export function endEffect(c, id){
  if(!c.effects) return;
  delete c.effects[id];
  TOGGLE_EFFECTS.forEach(function(d){ if((d.requires||[]).indexOf(id)!==-1) endEffect(c, d.id); });
}
/* A rest or dropping to 0 HP ends every effect, and a Barbarian's Rage.
   Returns the names that were on. */
export function endAllEffects(c){
  var ended = TOGGLE_EFFECTS.filter(function(d){ return c.effects && c.effects[d.id]; }).map(function(d){ return d.name; });
  c.effects = {};
  if(c.rage && c.rage.active){ c.rage.active = false; ended.push("Rage"); }
  // Shillelagh lasts a minute: a rest or dropping to 0 hit points ends it.
  var lit = (c.inventory||[]).filter(function(i){ return i.shillelagh; });
  if(lit.length){ lit.forEach(function(i){ delete i.shillelagh; }); ended.push("Shillelagh"); }
  return ended;
}
/* Drop flags that can't come back on their own: the feature is gone
   (level undone) or Symbiotic Entity's temporary HP ran out. True if any went. */
export function pruneEffects(c){
  var changed = false;
  Object.keys(c.effects||{}).forEach(function(id){
    var def = effectDef(id);
    var gone = !def || !effectClass(c, def) || (id==="symbiotic_entity" && !((Number(c.hp && c.hp.temp)||0) > 0));
    if(gone){ endEffect(c, id); changed = true; }
  });
  return changed;
}
/* How the race effects change rolls: Shell Defense's saves (advantage
   on STR and CON, disadvantage on DEX) and Sunlight Sensitivity's
   attacks and Perception, as roll modes. kind: "save" (with its
   ability), "attack" or "perception". */
export function raceEffectRolls(c, kind, ability){
  var out = [];
  if(kind==="save" && effectOn(c, "shell_defense")){
    if(ability==="str" || ability==="con") out.push({mode: "adv", reason: "Shell Defense"});
    if(ability==="dex") out.push({mode: "dis", reason: "Shell Defense"});
  }
  if((kind==="attack" || kind==="perception") && effectOn(c, "sunlight")) out.push({mode: "dis", reason: "Sunlight Sensitivity"});
  return out;
}
/* Bladesong's bonus to AC and concentration saves (and Song of Victory's damage). */
export function bladesongBonus(c){
  return Math.max(1, mod(abilityScore(c, "int")));
}
export function symbioticTempHp(c){
  return 4 * classLevelOf(c, "Druid", "Circle of Spores");
}
/* Halo of Spores' die by druid level (d4, d6 from 6, d8 from 10, d10 from 14). */
export function haloOfSporesDie(c){
  var lv = classLevelOf(c, "Druid", "Circle of Spores");
  return lv>=14 ? 10 : lv>=10 ? 8 : lv>=6 ? 6 : 4;
}
/* The Martial Arts die by monk level (d4, d6 from 5, d8 from 11, d10 from 17). */
export function martialArtsDie(c){
  var lv = classLevelOf(c, "Monk");
  return lv>=17 ? 10 : lv>=11 ? 8 : lv>=5 ? 6 : 4;
}
/* An unarmed strike with the astral arms: the best of STR, DEX and WIS,
   plus proficiency, Martial Arts die of force damage; Empowered Arms
   (monk 11) adds one more die once per turn. */
export function astralArmsAttack(c){
  var ab = abilityScores(c);
  var best = Math.max(mod(ab.str), mod(ab.dex), mod(ab.wis));
  return {attack: best + profBonus(c), damage: best, die: martialArtsDie(c),
    empowered: classLevelOf(c, "Monk", "Way of the Astral Self") >= 11};
}
/* Song of Victory: + Bladesong's bonus to melee weapon damage while
   Bladesong is on (wizard 14). */
export function songOfVictoryBonus(c, item){
  if(isRangedWeapon(item) || !effectOn(c, "bladesong")) return 0;
  return classLevelOf(c, "Wizard", "Bladesinging") >= 14 ? bladesongBonus(c) : 0;
}
