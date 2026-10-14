import { MONSTER_GROUPS, MONSTER_DATA } from "../data/monsters.js";
import { uid } from "./helpers.js";

/* ---------------- Custom (homebrew) monsters ----------------
   Made in the Monster Catalog and saved in this browser, apart from any
   one character. Merged into MONSTER_GROUPS / MONSTER_DATA as a "Homebrew"
   group (custom:true, id) so the catalog treats them like built-ins.
   Homebrew rows carry Edit / Delete buttons.

   Monster entry shape:
     { id, name, type, cr, size, alignment,
       hp, ac, speed,
       str, dex, con, int, wis, cha,
       notes }                                                          */

export var MONSTER_HOMEBREW_GROUP = "Homebrew";

var STORAGE_KEY = "ragnarsDen.customMonsters.v1";

/* Hit points, AC and speed stay in the range a stat block can use (the
   Tarrasque has 676 HP and AC 25); a typo like AC 129999 would otherwise
   overflow every box that shows it. */
export var MONSTER_LIMITS = { hp: [1, 9999], ac: [0, 30], speed: [0, 300] };
export function clampMonsterStat(key, value, fallback){
  var n = parseInt(value, 10);
  if(isNaN(n)) n = fallback;
  return Math.max(MONSTER_LIMITS[key][0], Math.min(MONSTER_LIMITS[key][1], n));
}

var list  = [];      // raw entries
var merged = [];     // names currently injected into MONSTER_DATA/MONSTER_GROUPS

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
  // Remove previously merged entries
  merged.forEach(function(name){
    delete MONSTER_DATA[name];
  });
  merged = [];
  delete MONSTER_GROUPS[MONSTER_HOMEBREW_GROUP];

  if(!list.length) return;

  MONSTER_GROUPS[MONSTER_HOMEBREW_GROUP] = [];
  list.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(e){
    MONSTER_DATA[e.name] = toData(e);
    MONSTER_GROUPS[MONSTER_HOMEBREW_GROUP].push(e.name);
    merged.push(e.name);
  });
}

function toData(e){
  return {
    type:      e.type      || "Humanoid",
    cr:        e.cr        || "0",
    size:      e.size      || "Medium",
    alignment: e.alignment || "Unaligned",
    hp:        clampMonsterStat("hp", e.hp, 1),
    ac:        clampMonsterStat("ac", e.ac, 10),
    speed:     clampMonsterStat("speed", e.speed, 30),
    str:       Number(e.str) || 10,
    dex:       Number(e.dex) || 10,
    con:       Number(e.con) || 10,
    int:       Number(e.int) || 10,
    wis:       Number(e.wis) || 10,
    cha:       Number(e.cha) || 10,
    notes:     e.notes || "",
    custom: true,
    id: e.id
  };
}

function clean(e){
  return {
    name:      String(e.name || "").trim(),
    type:      String(e.type || "Humanoid"),
    cr:        String(e.cr   || "0"),
    size:      String(e.size || "Medium"),
    alignment: String(e.alignment || "Unaligned"),
    hp:        clampMonsterStat("hp", e.hp, 1),
    ac:        clampMonsterStat("ac", e.ac, 10),
    speed:     clampMonsterStat("speed", e.speed, 30),
    str:       Math.max(1, Math.min(30, parseInt(e.str, 10) || 10)),
    dex:       Math.max(1, Math.min(30, parseInt(e.dex, 10) || 10)),
    con:       Math.max(1, Math.min(30, parseInt(e.con, 10) || 10)),
    int:       Math.max(1, Math.min(30, parseInt(e.int, 10) || 10)),
    wis:       Math.max(1, Math.min(30, parseInt(e.wis, 10) || 10)),
    cha:       Math.max(1, Math.min(30, parseInt(e.cha, 10) || 10)),
    notes:     String(e.notes || "").trim()
  };
}

/* ---- public API ---- */
export function loadCustomMonsters(){
  list = read();
  merge();
}

export function getCustomMonsters(){ return list.slice(); }

export function getCustomMonster(id){
  return list.find(function(e){ return e.id === id; }) || null;
}

/* Returns "" if the name is available, or an error string if not. */
export function monsterNameProblem(name, ownId){
  var lower = name.trim().toLowerCase();
  // Clash with a built-in entry
  var builtinClash = Object.keys(MONSTER_GROUPS).some(function(g){
    if(g === MONSTER_HOMEBREW_GROUP) return false;
    return MONSTER_GROUPS[g].some(function(n){ return n.toLowerCase() === lower; });
  });
  if(builtinClash) return "There's already a monster called " + name.trim() + ".";
  // Clash with another custom entry
  var clash = list.some(function(e){ return e.name.toLowerCase() === lower && e.id !== ownId; });
  return clash ? "You already made a monster called " + name.trim() + "." : "";
}

/* Add or update (matching id). Returns the saved entry. */
export function saveCustomMonster(entry){
  var c = clean(entry);
  c.id = entry.id || uid();
  var old = getCustomMonster(c.id);
  if(old){
    list[list.indexOf(old)] = c;
  } else {
    list.push(c);
  }
  write();
  merge();
  return c;
}

export function deleteCustomMonster(id){
  list = list.filter(function(e){ return e.id !== id; });
  write();
  merge();
}

/* Backup import: skips entries whose names are already taken. */
export function importCustomMonsters(entries){
  var added = 0;
  (entries || []).forEach(function(e){
    if(!e || !e.name) return;
    var lower = String(e.name).trim().toLowerCase();
    var same = list.find(function(x){ return x.name.toLowerCase() === lower; });
    if(same) return;
    if(monsterNameProblem(String(e.name), null)) return;
    var copy = clean(Object.assign({}, e, {name: String(e.name)}));
    copy.id = uid();
    list.push(copy);
    added++;
  });
  if(added){ write(); merge(); }
  return added;
}
