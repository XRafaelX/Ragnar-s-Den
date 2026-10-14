import { uid } from "./basics.js";
import { clampMonsterStat } from "./custom-monsters.js";

/* ---------------- Encounters ----------------
   A DM's named fights, saved in this browser apart from any character so
   one can be run again later (Reset puts every monster back to full).

   Encounter shape:
     { id, name, round, current, updated,
       monsters: [{ id, name, kind, ac, speed, maxHp, hp, log }],
       order:    [{ id, type:"player", name } | { id, type:"monster", monsterId }] }

   A monster keeps its own copy of the stats it was added with, so the
   encounter still works if a homebrew monster is later edited or deleted.
   Those are held to the homebrew limits (MONSTER_LIMITS) like the catalog.
   `log` is its hit point trail, oldest first, like the numbers a DM
   writes down a monster's box on paper (32, 20, 10, 4).
   `order` is the turn line, top goes first. Players only exist there (just
   a name); a monster can sit in the encounter before it is placed in it.
   `current` is the id of the order entry whose turn it is, not an index,
   so dragging entries around never moves the turn to someone else. */

var STORAGE_KEY = "ragnarsDen.encounters.v1";

var list = [];

/* ---- persistence ---- */
function read(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    var data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter(function(e){ return e && typeof e==="object"; }).map(clean) : [];
  }catch(e){ return []; }
}
function write(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  catch(e){ alert("Could not save. Your browser storage may be full or restricted."); }
}

function int(v, fallback){
  var n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

/* Shapes a stored or imported encounter, dropping anything broken. */
function clean(e){
  var monsters = (Array.isArray(e.monsters) ? e.monsters : []).filter(function(m){ return m && m.id; }).map(function(m){
    var maxHp = clampMonsterStat("hp", m.maxHp, 1);
    var hp = Math.max(0, Math.min(maxHp, int(m.hp, maxHp)));
    var log = (Array.isArray(m.log) ? m.log : []).map(function(v){ return int(v, null); }).filter(function(v){ return v !== null; })
      .map(function(v){ return Math.max(0, Math.min(maxHp, v)); });
    return {
      id: String(m.id),
      name: String(m.name || m.kind || "Monster"),
      kind: String(m.kind || ""),
      ac: clampMonsterStat("ac", m.ac, 10),
      speed: clampMonsterStat("speed", m.speed, 30),
      maxHp: maxHp,
      hp: hp,
      log: log.length ? log : [hp]
    };
  });
  var ids = {};
  monsters.forEach(function(m){ ids[m.id] = true; });
  var placed = {};
  var order = (Array.isArray(e.order) ? e.order : []).filter(function(o){
    if(!o || !o.id) return false;
    if(o.type === "player") return !!String(o.name || "").trim();
    // A monster sits in the line once, and only while it is in the encounter.
    if(o.type !== "monster" || !ids[o.monsterId] || placed[o.monsterId]) return false;
    placed[o.monsterId] = true;
    return true;
  }).map(function(o){
    return o.type === "player"
      ? { id: String(o.id), type: "player", name: String(o.name).trim() }
      : { id: String(o.id), type: "monster", monsterId: String(o.monsterId) };
  });
  var current = order.some(function(o){ return o.id === e.current; }) ? e.current : (order[0] ? order[0].id : null);
  return {
    id: String(e.id || uid()),
    name: String(e.name || "").trim() || "Encounter",
    round: Math.max(1, int(e.round, 1)),
    current: current,
    updated: int(e.updated, Date.now()),
    monsters: monsters,
    order: order
  };
}

/* ---- public API: the saved list ---- */
export function loadEncounters(){ list = read(); }

/* Newest first. */
export function getEncounters(){
  return list.slice().sort(function(a, b){ return b.updated - a.updated; });
}

export function getEncounter(id){
  return list.find(function(e){ return e.id === id; }) || null;
}

/* Returns "" if the name can be used, or why not. */
export function encounterNameProblem(name, ownId){
  var lower = String(name || "").trim().toLowerCase();
  if(!lower) return "Give the encounter a name.";
  var clash = list.some(function(e){ return e.name.toLowerCase() === lower && e.id !== ownId; });
  return clash ? "You already have an encounter called " + String(name).trim() + "." : "";
}

export function createEncounter(name){
  var e = clean({ id: uid(), name: name, monsters: [], order: [] });
  list.push(e);
  write();
  return e;
}

/* Saves an encounter after it was changed in place. */
export function saveEncounter(e){
  e.updated = Date.now();
  if(list.indexOf(e) === -1) list.push(e);
  write();
}

export function deleteEncounter(id){
  list = list.filter(function(e){ return e.id !== id; });
  write();
}

/* A copy under a free name ("Goblin ambush (copy)", "(copy 2)"). */
export function duplicateEncounter(id){
  var src = getEncounter(id);
  if(!src) return null;
  var copy = clean(JSON.parse(JSON.stringify(src)));
  copy.id = uid();
  copy.name = freeName(src.name + " (copy)");
  copy.updated = Date.now();
  list.push(copy);
  write();
  return copy;
}

function freeName(base){
  var name = base, n = 2;
  while(encounterNameProblem(name, null)) name = base.replace(/\)$/, " " + (n++) + ")");
  return name;
}

/* Backup import: every entry is added, renamed if its name is taken. */
export function importEncounters(entries){
  var added = 0;
  (entries || []).forEach(function(raw){
    if(!raw || typeof raw!=="object" || Array.isArray(raw)) return;
    var e = clean(raw);
    e.id = uid();
    if(encounterNameProblem(e.name, null)) e.name = freeName(e.name + " (imported)");
    list.push(e);
    added++;
  });
  if(added) write();
  return added;
}

/* Player names used in any saved encounter, for adding the party again. */
export function knownPlayerNames(){
  var seen = {}, names = [];
  getEncounters().forEach(function(e){
    e.order.forEach(function(o){
      if(o.type !== "player") return;
      var key = o.name.toLowerCase();
      if(seen[key]) return;
      seen[key] = true;
      names.push(o.name);
    });
  });
  return names;
}

/* ---- public API: changing one encounter ----
   These change the encounter in place and don't save; the screen saves
   once after each action. */

/* "Goblin", then "Goblin 2", "Goblin 3". */
function freeMonsterName(e, base){
  var taken = {};
  e.monsters.forEach(function(m){ taken[m.name.toLowerCase()] = true; });
  if(!taken[base.toLowerCase()]) return base;
  var n = 2;
  while(taken[(base + " " + n).toLowerCase()]) n++;
  return base + " " + n;
}

/* Adds a monster from the catalog (name and its stat block). */
export function addMonster(e, kind, data){
  var maxHp = clampMonsterStat("hp", data && data.hp, 1);
  var m = {
    id: uid(),
    name: freeMonsterName(e, kind),
    kind: kind,
    ac: clampMonsterStat("ac", data && data.ac, 10),
    speed: clampMonsterStat("speed", data && data.speed, 30),
    maxHp: maxHp,
    hp: maxHp,
    log: [maxHp]
  };
  e.monsters.push(m);
  return m;
}

export function getMonster(e, monsterId){
  return e.monsters.find(function(m){ return m.id === monsterId; }) || null;
}

export function renameMonster(e, monsterId, name){
  var m = getMonster(e, monsterId);
  var n = String(name || "").trim();
  if(m && n) m.name = n;
}

/* Takes the monster out of the encounter and the turn line. */
export function removeMonster(e, monsterId){
  var entry = orderEntryFor(e, monsterId);
  if(entry) removeFromOrder(e, entry.id);
  e.monsters = e.monsters.filter(function(m){ return m.id !== monsterId; });
}

/* Damage (negative) or healing (positive), kept between 0 and max. */
export function changeHp(e, monsterId, delta){
  var m = getMonster(e, monsterId);
  if(!m || !delta) return;
  var hp = Math.max(0, Math.min(m.maxHp, m.hp + delta));
  if(hp === m.hp) return;
  m.hp = hp;
  m.log.push(hp);
}

export function isDead(m){ return !!m && m.hp <= 0; }

export function orderEntryFor(e, monsterId){
  return e.order.find(function(o){ return o.type === "monster" && o.monsterId === monsterId; }) || null;
}

/* Monsters not yet in the turn line. */
export function unplacedMonsters(e){
  return e.monsters.filter(function(m){ return !orderEntryFor(e, m.id); });
}

/* Adds a player at `index` (the end when left out). */
export function addPlayer(e, name, index){
  var n = String(name || "").trim();
  if(!n) return null;
  var entry = { id: uid(), type: "player", name: n };
  insertAt(e, entry, index);
  return entry;
}

export function hasPlayer(e, name){
  var lower = String(name || "").trim().toLowerCase();
  return e.order.some(function(o){ return o.type === "player" && o.name.toLowerCase() === lower; });
}

/* Puts a monster into the turn line at `index`, or moves it there if it
   already has a place. */
export function placeMonster(e, monsterId, index){
  if(!getMonster(e, monsterId)) return null;
  var entry = orderEntryFor(e, monsterId);
  if(entry){
    moveInOrder(e, entry.id, index);
    return entry;
  }
  entry = { id: uid(), type: "monster", monsterId: monsterId };
  insertAt(e, entry, index);
  return entry;
}

/* Moves an entry so it ends up at `index` among the other entries. */
export function moveInOrder(e, entryId, index){
  var at = e.order.findIndex(function(o){ return o.id === entryId; });
  if(at === -1) return;
  var start = atFirstTurn(e);
  var entry = e.order.splice(at, 1)[0];
  e.order.splice(clampIndex(e, index), 0, entry);
  if(start) e.current = e.order[0].id;
}

/* Takes an entry out of the turn line. A player is gone; a monster stays
   in the encounter, waiting to be placed again. If it was that entry's
   turn, the turn passes to whoever came next. */
export function removeFromOrder(e, entryId){
  var at = e.order.findIndex(function(o){ return o.id === entryId; });
  if(at === -1) return;
  if(e.current === entryId){
    var next = e.order[at + 1] || e.order[0];
    e.current = next && next.id !== entryId ? next.id : null;
  }
  e.order.splice(at, 1);
}

function clampIndex(e, index){
  return typeof index === "number" ? Math.max(0, Math.min(e.order.length, index)) : e.order.length;
}

function insertAt(e, entry, index){
  var start = atFirstTurn(e);
  e.order.splice(clampIndex(e, index), 0, entry);
  if(start || !e.current) e.current = e.order[0].id;
}

/* Still on the very first turn (the line being set up): the turn stays
   with whoever is on top while entries are added or dragged around. */
function atFirstTurn(e){
  return e.round === 1 && (!e.current || !e.order.length || e.current === e.order[0].id);
}

/* Dead monsters are skipped when the turn moves on. */
function takesTurns(e, o){
  return o.type === "player" || !isDead(getMonster(e, o.monsterId));
}

export function currentEntry(e){
  return e.order.find(function(o){ return o.id === e.current; }) || null;
}

/* Moves to the next living entry; passing the bottom of the line starts
   the next round. */
export function nextTurn(e){
  stepTurn(e, 1);
}

export function previousTurn(e){
  stepTurn(e, -1);
}

function stepTurn(e, dir){
  var n = e.order.length;
  if(!n) return;
  var at = e.order.findIndex(function(o){ return o.id === e.current; });
  if(at === -1){
    e.current = e.order[0].id;
    return;
  }
  for(var step = 1; step <= n; step++){
    var raw = at + dir * step;
    var i = ((raw % n) + n) % n;
    if(!takesTurns(e, e.order[i])) continue;
    // Wrapping past the end (or back past the start) changes the round.
    // Going back from the very first turn stays on it.
    if(raw >= n) e.round++;
    if(raw < 0){
      if(e.round <= 1) return;
      e.round--;
    }
    e.current = e.order[i].id;
    return;
  }
}

/* Ready to run again: every monster at full hit points, round 1, the top
   of the turn line goes first. The monsters, players and order stay. */
export function resetEncounter(e){
  e.monsters.forEach(function(m){
    m.hp = m.maxHp;
    m.log = [m.maxHp];
  });
  e.round = 1;
  e.current = e.order[0] ? e.order[0].id : null;
}

/* Has anything happened since the encounter was set up or reset? */
export function encounterStarted(e){
  return e.round > 1 || (e.order[0] && e.current !== e.order[0].id) ||
    e.monsters.some(function(m){ return m.log.length > 1; });
}
