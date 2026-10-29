import { COMPANIONS } from "../data/companions.js";
import { mod, profBonus, classSpellAbility, clamp, totalLevel, featureSpells, usesVariant } from "./helpers.js";
import { abilityScore, abilityScores } from "./ability-scores.js";

/* ---------------- Companions ----------------
   The companions the character has now (see js/data/companions.js), with
   their stat blocks worked out, and what's saved for each in
   c.companions[id] = {hp: [one number per copy], choice (a drake's
   essence), beast (a Beast Master's stat block), and the player's own
   name, title and image (a data URL)}. A companion whose
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
      choice: saved.choice || "", beast: saved.beast || null, chain: !!(req && req.chain), wild: (req && req.wild) || 0, wildOnly: !!(req && req.wildOnly)});
    out.push({def: def, stats: stats, choice: saved.choice || "", hasBeast: !!saved.beast, hp: stats ? companionHp(c, def.id, stats) : [],
      source: req ? req.source : "", options: companionOptions(def, req),
      name: saved.name || "", title: saved.title || "", image: saved.image || ""});
  });
  return out;
}
/* A companion that comes from a spell or a Pact Boon (a familiar):
   {source, chain, wild} when the character has either, else null. A
   druid's Wild Companion casts Find Familiar too: `wild` is how many
   hours that familiar lasts, and the source names the feature when the
   druid doesn't know the spell otherwise. */
function companionRequirement(c, r){
  var chain = !!r.pactBoon && (c.classes||[]).some(function(cl){ return cl.name==="Warlock" && cl.pactBoon===r.pactBoon; });
  if(chain) return {source: r.pactBoon, chain: true};
  var wild = r.spell==="Find Familiar" ? wildCompanionHours(c) : 0;
  var knows = !!r.spell && ((c.spells||[]).some(function(s){ return s.name===r.spell; }) ||
    featureSpells(c).some(function(s){ return s.name===r.spell && s.feature!=="Wild Companion"; }));
  return knows || wild ? {source: knows ? r.spell : "Wild Companion", chain: false, wild: wild, wildOnly: !knows} : null;
}
/* Wild Companion (Tasha's, druid 2): the hours its familiar lasts (half
   the druid level), or 0 without it. */
export function wildCompanionHours(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Druid" && usesVariant(x, "Wild Companion"); });
  return cl ? Math.max(1, Math.floor((Number(cl.level)||1) / 2)) : 0;
}
/* The druid summons it: a new familiar, at full hit points. */
export function summonWildCompanion(c){
  companionState(c, "familiar").hp = [];
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
/* The player's own touches, kept through a change of form: {name, title,
   image}; an empty value clears that one. */
export var COMPANION_NAME_MAX = 40, COMPANION_TITLE_MAX = 48;
export function setCompanionLook(c, id, look){
  var st = companionState(c, id);
  Object.keys(look).forEach(function(k){
    var v = typeof look[k]==="string" ? look[k].trim() : "";
    if(k==="name") v = v.slice(0, COMPANION_NAME_MAX);
    if(k==="title") v = v.slice(0, COMPANION_TITLE_MAX);
    if(v) st[k] = v; else delete st[k];
  });
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
