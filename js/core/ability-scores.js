/* ---------------- Ability scores in effect ----------------
   c.abilities holds the character's own scores (what the creation wizard,
   level-ups, feats and the Abilities tab's arrows change). Magic items
   that work (carried, attuned if they need it) change the scores used for
   everything else: `setScore` makes a score that number unless it's
   already higher (Gauntlets of Ogre Power: STR 19, a Belt of Giant
   Strength), `raiseScore` adds to it, to a maximum of 20 (an Ioun Stone
   of Agility's +2 DEX). Reads only data, so any module can use it. */
import { MAGIC_ITEM_DATA } from "../data/magic-items.js";

var KEYS = ["str", "dex", "con", "int", "wis", "cha"];

export function baseScore(c, key){
  return Number(c && c.abilities && c.abilities[key]) || 10;
}
/* The carried items that change scores, as {name, def}. */
function scoreItems(c){
  return ((c && c.inventory) || []).map(function(i){
    var d = i.magicItem && MAGIC_ITEM_DATA[i.magicItem];
    if(!d || !(d.setScore || d.raiseScore) || (d.attunement && !i.attuned)) return null;
    return {name: i.magicItem, def: d};
  }).filter(Boolean);
}
/* One score in effect, and which items made it so: {score, base, sources}. */
export function abilityScoreDetail(c, key){
  var base = baseScore(c, key), score = base, sources = [];
  scoreItems(c).forEach(function(x){
    var add = x.def.raiseScore && x.def.raiseScore[key];
    if(add && score < 20){ score = Math.min(20, score + add); sources.push(x.name); }
  });
  scoreItems(c).forEach(function(x){
    var set = x.def.setScore && x.def.setScore[key];
    if(set && set > score){ score = set; sources = [x.name]; }
  });
  return {score: score, base: base, sources: sources};
}
export function abilityScore(c, key){ return abilityScoreDetail(c, key).score; }
/* All six, {str: n, ...}. */
export function abilityScores(c){
  var out = {};
  KEYS.forEach(function(k){ out[k] = abilityScore(c, k); });
  return out;
}
