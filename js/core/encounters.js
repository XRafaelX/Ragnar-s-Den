import { uid } from "./basics.js";
import { clampMonsterStat } from "./custom-monsters.js";
import { CONDITIONS, SPELL_CONDITIONS } from "../data/conditions.js";

/* ---------------- Encounters ----------------
   A DM's named fights, saved in this browser apart from any character so
   one can be run again later (Reset puts every monster back to full).

   Encounter shape:
     { id, name, round, current, updated,
       monsters: [{ id, name, kind, ac, speed, maxHp, hp, log, color, conditions }],
       order:    [{ id, type:"player", name } | { id, type:"monster", monsterId }],
       groupNames: { blue: "Archers", ... } }

   A monster keeps its own copy of the stats it was added with, so the
   encounter still works if a homebrew monster is later edited or deleted.
   Those are held to the homebrew limits (MONSTER_LIMITS) like the catalog.
   `log` is its hit point trail, oldest first, like the numbers a DM
   writes down a monster's box on paper (32, 20, 10, 4).
   `order` is the turn line, top goes first. Players only exist there (just
   a name); a monster can sit in the encounter before it is placed in it.
   `current` is the id of the order entry whose turn it is, not an index,
   so dragging entries around never moves the turn to someone else.
   `color` groups monsters the DM's own way: one of MONSTER_COLORS, or ""
   for none. A color's group is called by its name ("Blue") unless the DM
   renamed it in `groupNames`.
   `conditions` are what's on the monster: [{ id, pick }], ids from the
   book's conditions or the spells tracked like them (SPELL_CONDITIONS),
   `pick` what the caster chose for Hex or Bestow Curse ("" if nothing). */

export var MONSTER_COLORS = ["blue", "green", "yellow", "orange", "teal", "pink", "silver"];
var COLOR_NAMES = { blue: "Blue", green: "Green", yellow: "Yellow", orange: "Orange", teal: "Teal", pink: "Pink", silver: "Silver" };

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
      log: log.length ? log : [hp],
      color: MONSTER_COLORS.indexOf(m.color) === -1 ? "" : m.color,
      conditions: hp > 0 ? cleanConditions(m.conditions) : []
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
  var groupNames = {};
  var names = e.groupNames && typeof e.groupNames === "object" ? e.groupNames : {};
  MONSTER_COLORS.forEach(function(c){
    var n = String(names[c] || "").trim().slice(0, 30);
    if(n) groupNames[c] = n;
  });
  return {
    id: String(e.id || uid()),
    name: String(e.name || "").trim() || "Encounter",
    round: Math.max(1, int(e.round, 1)),
    current: current,
    updated: int(e.updated, Date.now()),
    monsters: monsters,
    order: order,
    groupNames: groupNames
  };
}

/* Known ids once each, with a pick the condition offers or "". */
function cleanConditions(raw){
  var seen = {};
  return (Array.isArray(raw) ? raw : []).filter(function(x){
    var def = x && monsterConditionDef(x.id);
    if(!def || seen[def.id]) return false;
    seen[def.id] = true;
    return true;
  }).map(function(x){
    var def = monsterConditionDef(x.id);
    var pick = def.picks && def.picks.some(function(p){ return p.id === x.pick; }) ? x.pick : "";
    return { id: def.id, pick: pick };
  });
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
    log: [maxHp],
    color: "",
    conditions: []
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

/* Moves a monster's box so it ends up at `index` among the other boxes.
   The DM's own arrangement, separate from the turn line. */
export function moveMonster(e, monsterId, index){
  var at = e.monsters.findIndex(function(m){ return m.id === monsterId; });
  if(at === -1) return;
  var m = e.monsters.splice(at, 1)[0];
  var to = typeof index === "number" ? Math.max(0, Math.min(e.monsters.length, index)) : e.monsters.length;
  e.monsters.splice(to, 0, m);
}

/* Puts a monster in a color's group, or none with "". */
export function setMonsterColor(e, monsterId, color){
  var m = getMonster(e, monsterId);
  if(m) m.color = MONSTER_COLORS.indexOf(color) === -1 ? "" : color;
}

/* "Blue", or the name the DM gave the blue group. */
export function groupName(e, color){
  return (e.groupNames && e.groupNames[color]) || COLOR_NAMES[color] || "";
}

/* An empty name, or the color's own, goes back to the color's name. */
export function renameGroup(e, color, name){
  if(MONSTER_COLORS.indexOf(color) === -1) return;
  var n = String(name || "").trim().slice(0, 30);
  if(!e.groupNames) e.groupNames = {};
  if(n && n !== COLOR_NAMES[color]) e.groupNames[color] = n;
  else delete e.groupNames[color];
}

/* The groups in use, in palette order: [{ color, name, count }]. */
export function colorGroups(e){
  return MONSTER_COLORS.map(function(c){
    var count = e.monsters.filter(function(m){ return m.color === c; }).length;
    return { color: c, name: groupName(e, c), count: count };
  }).filter(function(g){ return g.count; });
}

/* Takes the monster out of the encounter and the turn line. */
export function removeMonster(e, monsterId){
  var entry = orderEntryFor(e, monsterId);
  if(entry) removeFromOrder(e, entry.id);
  e.monsters = e.monsters.filter(function(m){ return m.id !== monsterId; });
}

/* Damage (negative) or healing (positive), kept between 0 and max.
   Going down clears the monster's conditions. Damage wakes a sleeper:
   returns the names of the conditions that ended that way. */
export function changeHp(e, monsterId, delta){
  var m = getMonster(e, monsterId);
  if(!m || !delta) return [];
  var hp = Math.max(0, Math.min(m.maxHp, m.hp + delta));
  if(hp === m.hp) return [];
  m.hp = hp;
  m.log.push(hp);
  if(!hp){ m.conditions = []; return []; }
  if(delta > 0) return [];
  var woke = monsterConditions(m).filter(function(x){ return x.def.wakes; });
  woke.forEach(function(x){ removeMonsterCondition(e, monsterId, x.def.id); });
  return woke.map(function(x){ return x.def.name; });
}

export function isDead(m){ return !!m && m.hp <= 0; }

/* ---- Conditions on a monster ---- */
export function monsterConditionDef(id){
  return SPELL_CONDITIONS.find(function(d){ return d.id === id; }) ||
    CONDITIONS.find(function(d){ return d.id === id; }) || null;
}

/* What's on, spells first and then the book's order: [{def, pick}],
   `pick` the caster's choice from the condition's picks, or null. */
export function monsterConditions(m){
  var on = m && Array.isArray(m.conditions) ? m.conditions : [];
  return SPELL_CONDITIONS.concat(CONDITIONS).map(function(d){
    var x = on.find(function(c){ return c.id === d.id; });
    if(!x) return null;
    var pick = d.picks ? d.picks.find(function(p){ return p.id === x.pick; }) || null : null;
    return { def: d, pick: pick };
  }).filter(Boolean);
}

export function hasMonsterCondition(m, id){
  return !!m && Array.isArray(m.conditions) && m.conditions.some(function(x){ return x.id === id; });
}

/* Puts a condition on (or changes its pick). Unconscious and Asleep also
   knock the monster prone. Returns the ids newly added. */
export function addMonsterCondition(e, monsterId, id, pick){
  var m = getMonster(e, monsterId);
  var def = monsterConditionDef(id);
  if(!m || !def || isDead(m)) return [];
  var p = def.picks && def.picks.some(function(x){ return x.id === pick; }) ? pick : "";
  var added = [];
  [id].concat(id === "unconscious" || id === "asleep" ? ["prone"] : []).forEach(function(x){
    var have = m.conditions.find(function(c){ return c.id === x; });
    if(have){ if(x === id) have.pick = p; return; }
    m.conditions.push({ id: x, pick: x === id ? p : "" });
    added.push(x);
  });
  return added;
}

export function removeMonsterCondition(e, monsterId, id){
  var m = getMonster(e, monsterId);
  if(m) m.conditions = m.conditions.filter(function(x){ return x.id !== id; });
}

/* The AC to show, with what changed it: { value, reasons: ["Slowed -2"] }. */
export function monsterAc(m){
  var value = m.ac, reasons = [];
  monsterConditions(m).forEach(function(x){
    if(!x.def.ac) return;
    value += x.def.ac;
    reasons.push(x.def.name + " " + (x.def.ac > 0 ? "+" : "") + x.def.ac);
  });
  return { value: Math.max(0, value), reasons: reasons };
}

/* The speed to show: 0 for a condition that stops movement, halved by
   Slow, with the names of what changed it. */
export function monsterSpeed(m){
  var list = monsterConditions(m);
  var stop = list.filter(function(x){ return x.def.noMove; });
  if(stop.length) return { value: 0, reasons: stop.map(function(x){ return x.def.name; }) };
  var half = list.filter(function(x){ return x.def.halfSpeed; });
  if(half.length) return { value: Math.floor(m.speed / 2), reasons: half.map(function(x){ return x.def.name; }) };
  return { value: m.speed, reasons: [] };
}

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

/* Ready to run again: every monster at full hit points with no
   conditions, round 1, the top of the turn line goes first. The
   monsters, players and order stay. */
export function resetEncounter(e){
  e.monsters.forEach(function(m){
    m.hp = m.maxHp;
    m.log = [m.maxHp];
    m.conditions = [];
  });
  e.round = 1;
  e.current = e.order[0] ? e.order[0].id : null;
}

/* Has anything happened since the encounter was set up or reset? */
export function encounterStarted(e){
  return e.round > 1 || (e.order[0] && e.current !== e.order[0].id) ||
    e.monsters.some(function(m){ return m.log.length > 1 || m.conditions.length; });
}
