/* ---------------- Shadow Stalker and Reaper (Spikael's homebrew, PRIVATE) ----------------
   The rules ../data/shadow-stalker.js describes, as the sheet applies them.
   Remove this file and its uses (equipment.js, helpers.js, the weapon
   card and the dice tray) with that data file before publishing.
   - Reaper: a scythe can attack with Dexterity, for 1d6 damage, and it can
     deal Sneak Attack damage.
   - Shadow Walk (Shadow Stalker 3): while it's on, Sneak Attack dice of 1
     or 2 are rolled again and the new roll stands.
   - Living Shadows (Shadow Stalker 17): the clone's attack, a use each
     time.
   - Inside a wound (Encroaching Shadows, Shadow Stalker 9): the next
     attack hits without a roll and deals Sneak Attack damage. */
import { baseWeaponName } from "../data/weapons.js";
import { classLevelOf } from "./class-features.js";
import { hasFeat } from "./vitals.js";
import { effectOn, resourceLeft } from "./effects.js";

/* A scythe in the hands of someone with the Reaper feat. */
export function reaperScythe(c, item){
  return !!(item && item.type==="weapon" && baseWeaponName(item)==="Scythe" && hasFeat(c, "Reaper"));
}

export function shadowStalkerLevel(c){ return classLevelOf(c, "Rogue", "Shadow Stalker"); }

/* Shadow Walk's reroll for a Sneak Attack roll: an `adjust` for
   performRoll, or null while the character isn't a shadow. */
export function shadowWalkReroll(c){
  if(shadowStalkerLevel(c) < 3 || !effectOn(c, "shadow_walk")) return null;
  return function(r){
    var gain = 0, changed = [];
    (r.values||[]).forEach(function(v){
      if(v > 2) return;
      var again = Math.floor(Math.random() * 6) + 1;
      gain += again - v;
      changed.push(v + " to " + again);
    });
    return changed.length ? {total: r.total + gain, note: "Shadow Walk: " + changed.join(", ")} : null;
  };
}

/* Inside a creature's wound: the next attack hits on its own. */
export function insideWound(c){
  return shadowStalkerLevel(c) >= 9 && effectOn(c, "inside_wound");
}

/* A shadow clone is out (Shadow Clones, tracked on Active effects). */
export function cloneOut(c){
  return shadowStalkerLevel(c) >= 3 && effectOn(c, "shadow_clone");
}

/* Living Shadows: {key, left} at Shadow Stalker 17 while the clone is
   out, or null. */
export function livingShadows(c){
  if(shadowStalkerLevel(c) < 17 || !cloneOut(c)) return null;
  var key = "Rogue:living_shadows";
  return {key: key, left: Math.max(0, resourceLeft(c, key))};
}
