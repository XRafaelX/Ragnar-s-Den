import { SPELL_DATA, SPELL_GROUPS, spellLevelLabel } from "../data/spells.js";
import { state, save } from "./state.js";
import { uid } from "./helpers.js";

/* ---------------- Custom (homebrew) spells ----------------
   Made in the Spellbook or from a sheet's Add Spell and saved in this
   browser, apart from any one character. Merged into SPELL_DATA and
   SPELL_GROUPS["Homebrew"] so the catalog picker shows them alongside
   built-ins.

   Spell entry shape:
     { id, name, level, school, castingTime, range, components, material,
       duration, concentration, ritual, classes:[], summary }

   A character's spells array stores a copy linked back via homebrewId:
   editing the entry updates the spell's stats on every character that
   has it (but not their prepared state or player notes), and deleting it
   leaves the copies as orphaned standalone spells.                        */

export var SPELL_HOMEBREW_GROUP = "Homebrew";
var STORAGE_KEY = "ragnarsDen.customSpells.v1";

var list   = [];    // persisted custom entries
var merged = [];    // names currently injected into SPELL_DATA

/* ---- persistence ---- */
function read(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    var data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  }catch(e){ return []; }
}
function write(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  catch(e){ alert("Could not save. Your browser storage may be full or restricted."); }
}

/* ---- merge into shared tables ---- */
function merge(){
  // Remove previously merged entries from SPELL_DATA
  merged.forEach(function(name){ delete SPELL_DATA[name]; });
  merged = [];
  delete SPELL_GROUPS[SPELL_HOMEBREW_GROUP];

  if(!list.length) return;

  SPELL_GROUPS[SPELL_HOMEBREW_GROUP] = [];
  list.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(e){
    SPELL_DATA[e.name] = toData(e);
    SPELL_GROUPS[SPELL_HOMEBREW_GROUP].push(e.name);
    merged.push(e.name);
  });
}

function toData(e){
  return {
    level:       Number(e.level) || 0,
    school:      e.school      || "",
    castingTime: e.castingTime || "1 action",
    range:       e.range       || "",
    components:  e.components  || "",
    material:    e.material    || "",
    duration:    e.duration    || "Instantaneous",
    concentration: !!e.concentration,
    ritual:      !!e.ritual,
    classes:     Array.isArray(e.classes) ? e.classes : [],
    summary:     e.summary     || "",
    custom:      true,
    id:          e.id
  };
}

function clean(e){
  return {
    name:        String(e.name        || "").trim(),
    level:       Math.max(0, Math.min(9, parseInt(e.level, 10) || 0)),
    school:      String(e.school      || ""),
    castingTime: String(e.castingTime || "1 action").trim(),
    range:       String(e.range       || "").trim(),
    components:  String(e.components  || "").trim(),
    material:    String(e.material    || "").trim(),
    duration:    String(e.duration    || "Instantaneous").trim(),
    concentration: !!e.concentration,
    ritual:      !!e.ritual,
    classes:     Array.isArray(e.classes) ? e.classes.filter(Boolean) : [],
    summary:     String(e.summary     || "").trim()
  };
}

/* ---- public API ---- */
export function loadCustomSpells(){
  list = read();
  merge();
}

export function getCustomSpells(){ return list.slice(); }

export function getCustomSpell(id){
  return list.find(function(e){ return e.id === id; }) || null;
}

/* Returns "" if the name is available, or an error string if not. */
export function spellNameProblem(name, ownId){
  var lower = name.trim().toLowerCase();
  // Clash with a built-in entry (exclude the Homebrew group)
  var builtinClash = Object.keys(SPELL_GROUPS).some(function(g){
    if(g === SPELL_HOMEBREW_GROUP) return false;
    return (SPELL_GROUPS[g] || []).some(function(n){ return n.toLowerCase() === lower; });
  }) || (SPELL_DATA[name.trim()] && !SPELL_DATA[name.trim()].custom);
  if(builtinClash) return "There's already a spell called " + name.trim() + ".";
  var clash = list.some(function(e){ return e.name.toLowerCase() === lower && e.id !== ownId; });
  return clash ? "You already made a spell called " + name.trim() + "." : "";
}

/* Returns all characters whose spells include a copy linked to this entry. */
function copiesOf(entry){
  var out = [];
  state.characters.forEach(function(c){
    (c.spells || []).forEach(function(sp){
      if(sp.homebrewId === entry.id) out.push({ c: c, spell: sp });
    });
  });
  return out;
}

export function charactersWithSpell(entry){
  var seen = [];
  copiesOf(entry).forEach(function(x){ if(seen.indexOf(x.c) === -1) seen.push(x.c); });
  return seen;
}

/* Propagate catalog-level fields from the updated entry to a character copy.
   Preserves prepared, notes (player's own text). */
function applyToCharacterCopy(spell, entry){
  spell.level       = entry.level;
  spell.school      = entry.school;
  spell.castingTime = entry.castingTime;
  spell.range       = entry.range;
  spell.components  = entry.components;
  spell.material    = entry.material;
  spell.duration    = entry.duration;
  spell.concentration = entry.concentration;
  spell.ritual      = entry.ritual;
  spell.summary     = entry.summary;
  // Follow a rename
  spell.name        = entry.name;
}

/* Add or update (matching id). Returns the saved entry. */
export function saveCustomSpell(entry){
  var c = clean(entry);
  c.id = entry.id || uid();
  var old = getCustomSpell(c.id);
  if(old){
    list[list.indexOf(old)] = c;
    // Propagate changes to linked character copies
    var copies = copiesOf(c);
    copies.forEach(function(x){ applyToCharacterCopy(x.spell, c); });
    if(copies.length) save();
  } else {
    list.push(c);
  }
  write();
  merge();
  return c;
}

export function deleteCustomSpell(id){
  list = list.filter(function(e){ return e.id !== id; });
  write();
  merge();
  // Orphaned copies on characters keep their data; homebrewId becomes stale.
}

/* Backup import: skips entries whose names are already taken. Returns
   {oldId: newId} (a taken name maps onto your spell of that name) so
   imported characters' copies can be relinked. */
export function importCustomSpells(entries){
  var idMap = {}, added = 0;
  (entries || []).forEach(function(e){
    if(!e || !e.name) return;
    var lower = String(e.name).trim().toLowerCase();
    var same = list.find(function(x){ return x.name.toLowerCase() === lower; });
    if(same){ if(e.id) idMap[e.id] = same.id; return; } // already have it
    if(spellNameProblem(String(e.name), null)) return; // name taken by built-in
    var copy = clean(Object.assign({}, e, { name: String(e.name) }));
    copy.id = uid();
    if(e.id) idMap[e.id] = copy.id;
    list.push(copy);
    added++;
  });
  if(added){ write(); merge(); }
  return idMap;
}
