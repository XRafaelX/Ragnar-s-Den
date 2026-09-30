import { COMPANIONS } from "../data/companions.js";
import { mod, profBonus, classSpellAbility, clamp } from "./helpers.js";

/* ---------------- Companions ----------------
   The companions the character has now (see js/data/companions.js), with
   their stat blocks worked out, and what's saved for each in
   c.companions[id] = {hp: [one number per copy], choice (a drake's
   essence), beast (a Beast Master's stat block)}. A companion whose
   beast isn't entered yet comes back with stats null. */

export function characterCompanions(c){
  var out = [];
  COMPANIONS.forEach(function(def){
    var cl = (c.classes||[]).find(function(x){ return x.name===def.cls && x.subclass===def.subclass && (Number(x.level)||1) >= def.level; });
    if(!cl) return;
    var mods = {};
    ["str","dex","con","int","wis","cha"].forEach(function(k){ mods[k] = mod(c.abilities && c.abilities[k]); });
    var pb = profBonus(c);
    var castMod = mods[classSpellAbility(cl) || "int"] || 0;
    var saved = companionState(c, def.id);
    var stats = def.stats({lv: Number(cl.level)||1, pb: pb, mods: mods, spellAttack: pb + castMod, spellDC: 8 + pb + castMod,
      choice: saved.choice || "", beast: saved.beast || null});
    out.push({def: def, stats: stats, choice: saved.choice || "", hasBeast: !!saved.beast, hp: stats ? companionHp(c, def.id, stats) : []});
  });
  return out;
}
function companionState(c, id){
  if(!c.companions) c.companions = {};
  return c.companions[id] = c.companions[id] || {hp: []};
}
/* Current HP per copy, filled in at full and kept within 0..max. */
function companionHp(c, id, stats){
  var st = companionState(c, id);
  var count = stats.count || 1;
  for(var i = 0; i < count; i++) st.hp[i] = st.hp[i]==null ? stats.hp : clamp(st.hp[i], 0, stats.hp);
  st.hp.length = count;
  return st.hp;
}
export function setCompanionHp(c, id, index, value, max){
  var st = c.companions && c.companions[id];
  if(st) st.hp[index] = clamp(value, 0, max);
}
/* A different kind or essence is a new creature: it starts at full HP. */
export function setCompanionChoice(c, id, value){
  var st = companionState(c, id);
  if(st.choice!==value) st.hp = [];
  st.choice = value;
}
/* A Beast Master's beast, as entered (before the ranger's bonuses). A new
   beast starts at full HP. */
export function setCompanionBeast(c, id, beast){
  var st = companionState(c, id);
  st.beast = beast;
  st.hp = [];
}
/* A long rest: companions are back at full (a new defender or cannon). */
export function restoreCompanions(c){
  if(c.companions) Object.keys(c.companions).forEach(function(id){ c.companions[id].hp = []; });
}
