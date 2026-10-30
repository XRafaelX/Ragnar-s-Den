/* ---------------- Conditions and exhaustion ----------------
   c.conditions holds the ids switched on from the Vitals tab's
   Conditions card (js/data/conditions.js), c.exhaustion the level (0 to
   6). What they do is worked out where it applies, like the Active
   effects: roll modes (checks.js), speed and hit point maximum
   (vitals.js), the saves card's automatic failures. A character at 0 HP
   is unconscious without it being stored, so healing wakes them. */
import { CONDITIONS } from "../data/conditions.js";

export function conditionDef(id){
  return CONDITIONS.find(function(d){ return d.id===id; });
}
export function exhaustionLevel(c){
  return Math.max(0, Math.min(6, Math.floor(Number(c.exhaustion)||0)));
}
/* Dying or stable at 0 HP, not dead (and not holding on with Rage
   Beyond Death or a Relentless Rage save still to make). */
function downAtZero(c){
  var hp = c.hp || {};
  if(c.rage && c.rage.active && (c.rage.relentless || rageLevel(c, "Path of the Zealot") >= 14)) return false;
  // Strength Before Death (Samurai 18): conscious through the extra turn.
  if(c.extraTurn) return false;
  return (Number(hp.current)||0) <= 0 && (Number(hp.max)||0) > 0 && !((Number(c.deathSaves && c.deathSaves.fail)||0) >= 3);
}
function rageLevel(c, subclass){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Barbarian" && x.subclass===subclass; });
  return cl ? Number(cl.level)||1 : 0;
}
/* Mindless Rage (Path of the Berserker, barbarian 6): while raging,
   charmed and frightened are suspended. The feature's name, or "". */
export function rageSuspends(c, id){
  return (id==="charmed" || id==="frightened") && c.rage && c.rage.active && rageLevel(c, "Path of the Berserker") >= 6 ? "Mindless Rage" : "";
}
/* The conditions on now, in the book's order: [{def, auto}], with
   `auto` true for Unconscious from being at 0 HP. */
export function activeConditions(c){
  var on = Array.isArray(c.conditions) ? c.conditions : [];
  var out = CONDITIONS.filter(function(d){ return on.indexOf(d.id)!==-1 && !rageSuspends(c, d.id); }).map(function(d){ return {def: d, auto: false}; });
  if(downAtZero(c) && on.indexOf("unconscious")===-1){
    var unc = conditionDef("unconscious");
    var at = out.findIndex(function(x){ return CONDITIONS.indexOf(x.def) > CONDITIONS.indexOf(unc); });
    out.splice(at===-1 ? out.length : at, 0, {def: unc, auto: true});
  }
  return out;
}
export function hasCondition(c, id){
  return activeConditions(c).some(function(x){ return x.def.id===id; });
}
/* Switch a condition on. Unconscious also knocks the character prone.
   Returns the ids that were added. */
export function addCondition(c, id){
  if(!conditionDef(id)) return [];
  if(!Array.isArray(c.conditions)) c.conditions = [];
  var added = [];
  [id].concat(id==="unconscious" ? ["prone"] : []).forEach(function(x){
    if(c.conditions.indexOf(x)===-1){ c.conditions.push(x); added.push(x); }
  });
  return added;
}
export function removeCondition(c, id){
  if(Array.isArray(c.conditions)) c.conditions = c.conditions.filter(function(x){ return x!==id; });
}
/* Where a condition or exhaustion changes a d20 roll, as roll modes for
   combineRolls. kind: "attack", "check" (skills and initiative too) or
   "save" (with its ability). */
export function conditionRolls(c, kind, ability){
  var out = [];
  activeConditions(c).forEach(function(x){
    var d = x.def;
    var mode = kind==="attack" ? d.attack : kind==="check" ? d.checks : (d.saves || {})[ability];
    if(mode) out.push({mode: mode, reason: d.name});
  });
  var ex = exhaustionLevel(c);
  if((kind==="check" && ex >= 1) || (kind!=="check" && ex >= 3)) out.push({mode: "dis", reason: "Exhaustion (level " + ex + ")"});
  return out;
}
/* The condition that makes this saving throw fail on its own, or "". */
export function saveAutoFail(c, ability){
  var x = activeConditions(c).find(function(x){ return (x.def.autoFail || []).indexOf(ability)!==-1; });
  return x ? x.def.name : "";
}
/* How conditions change speed: {zero: reason} for speed 0, {half: reason}
   for halved, or null. */
export function conditionSpeed(c){
  var stuck = activeConditions(c).find(function(x){ return x.def.noMove; });
  var ex = exhaustionLevel(c);
  if(stuck) return {zero: stuck.def.name};
  if(ex >= 5) return {zero: "Exhaustion (level " + ex + ")"};
  if(ex >= 2) return {half: "Exhaustion (level " + ex + ")"};
  return null;
}
export function hpMaxHalved(c){ return exhaustionLevel(c) >= 4; }
export function resistsAllDamage(c){
  var x = activeConditions(c).find(function(x){ return x.def.resistAll; });
  return x ? x.def.name : "";
}
/* What the current exhaustion level does, in the card's words:
   "Disadvantage on checks · speed halved" ... or "". */
export function exhaustionSummary(level){
  if(level >= 6) return "Dead";
  var lines = [];
  if(level >= 3) lines.push("disadvantage on checks, attacks and saves");
  else if(level >= 1) lines.push("disadvantage on checks");
  if(level >= 5) lines.push("speed 0");
  else if(level >= 2) lines.push("speed halved");
  if(level >= 4) lines.push("HP maximum halved");
  var text = lines.join(" \u00b7 ");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}
/* A long rest takes one level off (with food and drink). Returns the new
   level, or null when there was none. */
export function longRestExhaustion(c){
  var ex = exhaustionLevel(c);
  if(!ex || ex >= 6) return null;
  c.exhaustion = ex - 1;
  return c.exhaustion;
}
