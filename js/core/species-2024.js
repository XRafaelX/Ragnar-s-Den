/* ---------------- The 2024 species on the sheet ----------------
   What the Player's Handbook (2024) species do that a rest or a roll
   changes (pp. 186-197). The rest of their traits are data
   (js/data/race-data.js), resources (js/data/resources.js) and Active
   effects (js/data/effects.js). */
import { RACE_DATA } from "../data/race-data.js";

/* Whether the race has a trait of this name. */
export function hasRaceTrait(c, name){
  return ((RACE_DATA[c && c.race] || {}).traits || []).some(function(t){ return t.name===name; });
}
/* Resourceful (a 2024 human): Heroic Inspiration after a long rest. You
   can't hold more than one from it, so a character with none gets one.
   True when it was given. */
export function resourcefulOnLongRest(c){
  if(!hasRaceTrait(c, "Resourceful") || (Number(c.inspiration)||0) > 0) return false;
  c.inspiration = 1;
  return true;
}
