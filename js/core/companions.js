import { COMPANIONS } from "../data/companions.js";
import { mod, profBonus, classSpellAbility, clamp, totalLevel, featureSpells } from "./helpers.js";
import { abilityScore, abilityScores } from "./ability-scores.js";

/* ---------------- Companions ----------------
   The companions the character has now (see js/data/companions.js), with
   their stat blocks worked out, and what's saved for each in
   c.companions[id] = {hp: [one number per copy], choice (a drake's
   essence), beast (a Beast Master's stat block)}. A companion whose
   beast isn't entered yet comes back with stats null. */

export function characterCompanions(c){
  var out = [];
  COMPANIONS.forEach(function(def){
    var req = def.requires && companionRequirement(c, def.requires);
    var cl = req ? null : (c.classes||[]).find(function(x){ return x.name===def.cls && (!def.subclass || x.subclass===def.subclass) && (Number(x.level)||1) >= def.level; });
    if(!cl && !req) return;
    if(def.infusion && !infusionActive(c, def.infusion)) return;
    var mods = {};
    ["str","dex","con","int","wis","cha"].forEach(function(k){ mods[k] = mod(abilityScore(c, k)); });
    var pb = profBonus(c);
    var castMod = mods[(cl && classSpellAbility(cl)) || "int"] || 0;
    var saved = companionState(c, def.id);
    var stats = def.stats({lv: cl ? Number(cl.level)||1 : totalLevel(c), pb: pb, mods: mods, spellAttack: pb + castMod, spellDC: 8 + pb + castMod,
      choice: saved.choice || "", beast: saved.beast || null, chain: !!(req && req.chain)});
    out.push({def: def, stats: stats, choice: saved.choice || "", hasBeast: !!saved.beast, hp: stats ? companionHp(c, def.id, stats) : [],
      source: req ? req.source : "", options: companionOptions(def, req)});
  });
  return out;
}
/* A companion that comes from a spell or a Pact Boon (a familiar):
   {source, chain} when the character has either, else null. */
function companionRequirement(c, r){
  var chain = !!r.pactBoon && (c.classes||[]).some(function(cl){ return cl.name==="Warlock" && cl.pactBoon===r.pactBoon; });
  if(chain) return {source: r.pactBoon, chain: true};
  var knows = !!r.spell && ((c.spells||[]).some(function(s){ return s.name===r.spell; }) ||
    featureSpells(c).some(function(s){ return s.name===r.spell; }));
  return knows ? {source: r.spell, chain: false} : null;
}
/* The choice's options for this character: a familiar's chain-only forms
   need Pact of the Chain. */
function companionOptions(def, req){
  if(!def.choice) return [];
  var only = def.choice.chainOnly || [];
  return def.choice.options.filter(function(o){ return !(only.indexOf(o)!==-1 && !(req && req.chain)); });
}
/* An artificer infusion of this name is on an item now. */
function infusionActive(c, name){
  return ((c.infusions && c.infusions.active) || []).some(function(a){ return String(a.name||"").replace(/:.*$/, "")===name; });
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
/* Companions the player hasn't looked at on the Companions tab yet (ids
   not in c.seenCompanions); the tab carries a NEW dot meanwhile. */
export function unseenCompanions(c){
  var seen = c.seenCompanions||[];
  return characterCompanions(c).filter(function(x){ return seen.indexOf(x.def.id)===-1; });
}
/* The Companions tab is open: every companion on it counts as seen.
   True when that changed anything, so the caller saves. */
export function markCompanionsSeen(c){
  var fresh = unseenCompanions(c);
  if(!fresh.length) return false;
  c.seenCompanions = (c.seenCompanions||[]).concat(fresh.map(function(x){ return x.def.id; }));
  return true;
}
/* "New companion: Drake. It's on the Companions tab, set it up on its
   card." for a toast or the level-up popup. */
export function newCompanionsText(list){
  var one = list.length===1;
  var names = list.map(function(x){ return x.def.name; });
  var named = names.length > 1 ? names.slice(0, -1).join(", ")+" and "+names[names.length-1] : names[0];
  var setup = list.some(function(x){ return x.def.choice && !x.choice; });
  return "New companion"+(one ? "" : "s")+": "+named+". "+(one ? "It's" : "They're")+" on the Companions tab"+
    (setup ? ", set "+(one ? "it up on its card" : "them up on their cards") : "")+".";
}
