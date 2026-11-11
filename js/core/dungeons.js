import { uid } from "./basics.js";

/* ---------------- Dungeons ----------------
   A DM's dungeons, saved in this browser apart from any character. A
   dungeon is a named set of maps in order (an entrance, a first level, a
   second level...), and the DM steps through them like slides. A map is
   terrain only: where the floor is and what kind of ground it is. What
   lives in the dungeon stays in the DM's notes.

   Dungeon shape:
     { id, name, maps: [map, ...], updated }
   Map shape:
     { id, name, w, h, cells, revealed, style, party, sight, notes, links, lit }

   The map is a grid of 5 ft squares, `w` wide and `h` tall. `cells` is a
   string of w*h terrain codes (see TERRAIN), row by row from the top
   left, so square (x, y) is cells[y*w + x]. A string keeps a big map
   small in storage and makes undo a plain copy.

   Walls are not painted. Every square that isn't solid rock is open
   ground, and a wall is drawn wherever open ground meets rock, so the
   DM only paints rooms and corridors and the walls follow.

   `revealed` is the fog of war: a string as long as `cells`, "1" for a
   square the players have been shown and "0" for one still in fog. Only
   open ground is ever shown, so a square erased back to rock goes back
   into fog, and floor painted later starts hidden.

   `party` is the square the players' party stands on, {x, y}, or null.
   It is always on open ground: erasing its square takes it off the map.
   `sight` is how many squares the party sees on this map (its light, or
   their darkvision), or 0 for no limit (daylight).
   `notes` are the DM's numbered notes, [{ id, n, x, y, text }], one per
   square at most: what is in room 3, a trap in a corridor. They are the
   DM's only and never reach the players' screen.
   `lit` is like `revealed`: "1" for a lit square (a torch-lit hall, a
   sunlit courtyard), which the party sees from any distance, "0" for
   one in the dark. Only open ground is lit.
   `links` say where stairs lead: [{ x, y, to }], a stairs square and the
   id of another map of the same dungeon.

   Undo steps hold a map's terrain, fog, party, sight and notes. The
   functions further down that take `d` work on one map. */

export var SHOWN = "1";
export var FOGGED = "0";

export var ROCK = " ";
export var FLOOR = ".";

/* Every terrain, in the order the tool bar shows them. `open` is false
   only for rock. */
export var TERRAIN = {
  " ": { id: "rock", label: "Rock", open: false },
  ".": { id: "floor", label: "Floor", open: true },
  "+": { id: "door", label: "Door", open: true },
  "s": { id: "secret", label: "Secret door", open: true },
  "/": { id: "open-door", label: "Open door", open: true },
  "l": { id: "locked-door", label: "Locked door", open: true },
  ">": { id: "stairs", label: "Stairs", open: true },
  "~": { id: "water", label: "Water", open: true },
  "o": { id: "pit", label: "Pit", open: true },
  ":": { id: "rubble", label: "Rubble", open: true }
};

/* How the map is drawn (see js/render/dungeon-canvas.js). */
export var DUNGEON_STYLES = [
  { id: "stone", label: "Stone", help: "Dressed stone and straight walls, like a crypt or a keep" },
  { id: "cave", label: "Cave", help: "Rough rock walls and earthen floors, like a cavern or a mine" },
  { id: "classic", label: "Classic", help: "White floors on a blue grid, like the maps in old printed adventures" },
  { id: "wood", label: "Wood", help: "Plank floors and timber walls, like a tavern, a ship or a manor" },
  { id: "ice", label: "Ice", help: "Frosted floors and rough frozen walls, like a glacier cave" },
  { id: "volcanic", label: "Volcanic", help: "Dark basalt with glowing cracks, like a fire temple or a forge" },
  { id: "overgrown", label: "Overgrown", help: "Mossy stones and creeping leaves, like a ruin lost in a forest" }
];

/* Map sizes offered when a dungeon is made, in squares. */
export var DUNGEON_SIZES = [
  { id: "small", label: "Small", w: 24, h: 16 },
  { id: "medium", label: "Medium", w: 36, h: 24 },
  { id: "large", label: "Large", w: 50, h: 34 }
];
export var MIN_SIDE = 8;
export var MAX_SIDE = 80;

var STORAGE_KEY = "ragnarsDen.dungeons.v1";
var MAX_MAPS = 30;

var list = [];

/* ---- persistence ---- */
function read(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    var data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter(function(d){ return d && typeof d==="object" && !Array.isArray(d); }).map(clean) : [];
  }catch(e){ return []; }
}
function write(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  catch(e){ alert("Could not save. Your browser storage may be full or restricted."); }
}

function side(v, fallback){
  var n = parseInt(v, 10);
  if(isNaN(n)) n = fallback;
  return Math.max(MIN_SIDE, Math.min(MAX_SIDE, n));
}

/* Shapes a stored or imported dungeon. Before dungeons held several maps
   (November 2026) each saved entry was one map: such an entry becomes a
   dungeon of that one map, which keeps the entry's id so a players' tab
   showing it still finds it. */
function clean(d){
  var updated = parseInt(d.updated, 10);
  var old = !Array.isArray(d.maps);
  var maps = old
    ? [cleanMap(Object.assign({}, d, { name: "Map 1" }))]
    : d.maps.filter(function(m){ return m && typeof m === "object" && !Array.isArray(m); }).slice(0, MAX_MAPS).map(cleanMap);
  if(!maps.length) maps.push(cleanMap({ name: "Map 1" }));
  // Every map id once, across the dungeon.
  var ids = {};
  maps.forEach(function(m){ if(ids[m.id]) m.id = uid(); ids[m.id] = true; });
  var dg = {
    id: old ? String(d.id || uid()) + "-dungeon" : String(d.id || uid()),
    name: String(d.name || "").trim().slice(0, 60) || "Dungeon",
    maps: maps,
    updated: isNaN(updated) ? Date.now() : updated
  };
  pruneLinks(dg);
  return dg;
}

/* Shapes one map: a size within the limits and a cells string of exactly
   that size, with anything unknown made rock. */
function cleanMap(m){
  var w = side(m.w, DUNGEON_SIZES[1].w);
  var h = side(m.h, DUNGEON_SIZES[1].h);
  var src = typeof m.cells === "string" ? m.cells : "";
  var seen = typeof m.revealed === "string" ? m.revealed : "";
  var cells = "", revealed = "";
  for(var i = 0; i < w * h; i++){
    var c = src.charAt(i);
    if(!TERRAIN[c]) c = ROCK;
    cells += c;
    revealed += c !== ROCK && seen.charAt(i) === SHOWN ? SHOWN : FOGGED;
  }
  return {
    id: String(m.id || uid()),
    name: String(m.name || "").trim().slice(0, 40) || "Map",
    w: w,
    h: h,
    cells: cells,
    revealed: revealed,
    style: DUNGEON_STYLES.some(function(st){ return st.id === m.style; }) ? m.style : "stone",
    party: cleanParty(m.party, w, h, cells),
    sight: cleanSight(m.sight),
    notes: cleanNotes(m.notes, w, h),
    links: cleanLinks(m.links, w, h, cells),
    lit: cleanLit(m.lit, cells)
  };
}

/* "1" or "0" for each square, lit only on open ground. */
function cleanLit(raw, cells){
  var src = typeof raw === "string" ? raw : "", out = "";
  for(var i = 0; i < cells.length; i++) out += cells.charAt(i) !== ROCK && src.charAt(i) === SHOWN ? SHOWN : FOGGED;
  return out;
}

/* Links on stairs squares of this map, one per square. Whether the map
   they lead to exists is checked by the dungeon (pruneLinks). */
function cleanLinks(raw, w, h, cells){
  var taken = {}, out = [];
  (Array.isArray(raw) ? raw : []).forEach(function(l){
    if(!l || typeof l !== "object" || !l.to) return;
    var x = parseInt(l.x, 10), y = parseInt(l.y, 10);
    if(isNaN(x) || isNaN(y) || x < 0 || y < 0 || x >= w || y >= h || cells.charAt(y * w + x) !== ">" || taken[x + "," + y]) return;
    taken[x + "," + y] = true;
    out.push({ x: x, y: y, to: String(l.to) });
  });
  return out;
}

/* Drops links to maps the dungeon doesn't have, or to their own map. */
function pruneLinks(dg){
  var ids = {};
  dg.maps.forEach(function(m){ ids[m.id] = true; });
  dg.maps.forEach(function(m){
    m.links = m.links.filter(function(l){ return ids[l.to] && l.to !== m.id; });
  });
}

/* After a dungeon's maps get new ids (a copy, an import), its links
   follow them. `oldIds` are the ids the maps had, in order. */
function relink(dg, oldIds){
  var map = {};
  dg.maps.forEach(function(m, i){ map[oldIds[i]] = m.id; });
  dg.maps.forEach(function(m){
    m.links.forEach(function(l){ l.to = map[l.to] || l.to; });
  });
  pruneLinks(dg);
}

/* Notes on squares of this map, one per square, each with its own
   number; anything broken is dropped. */
var MAX_NOTES = 99;
var NOTE_LENGTH = 1000;
function cleanNotes(raw, w, h){
  var taken = {}, used = {}, out = [];
  (Array.isArray(raw) ? raw : []).forEach(function(n){
    if(!n || typeof n !== "object" || out.length >= MAX_NOTES) return;
    var x = parseInt(n.x, 10), y = parseInt(n.y, 10), num = parseInt(n.n, 10);
    if(isNaN(x) || isNaN(y) || x < 0 || y < 0 || x >= w || y >= h || taken[x + "," + y]) return;
    taken[x + "," + y] = true;
    out.push({ id: String(n.id || uid()), n: isNaN(num) || num < 1 || used[num] ? 0 : num, x: x, y: y, text: String(n.text || "").slice(0, NOTE_LENGTH) });
    if(out[out.length - 1].n) used[out[out.length - 1].n] = true;
  });
  // Notes with a missing or repeated number get the first ones free.
  out.forEach(function(n){ if(!n.n){ n.n = lowestFree(used); used[n.n] = true; } });
  return out;
}
function lowestFree(used){
  var k = 1;
  while(used[k]) k++;
  return k;
}

/* Whole squares from 1 to SIGHT_MAX, or 0 (no limit). Missing is the
   default, 60 feet. */
function cleanSight(v){
  var n = parseInt(v, 10);
  if(isNaN(n) || n < 0) return SIGHT;
  return Math.min(SIGHT_MAX, n);
}

/* {x, y} on an open square of this map, or null. */
function cleanParty(p, w, h, cells){
  if(!p || typeof p !== "object") return null;
  var x = parseInt(p.x, 10), y = parseInt(p.y, 10);
  if(isNaN(x) || isNaN(y) || x < 0 || y < 0 || x >= w || y >= h || cells.charAt(y * w + x) === ROCK) return null;
  return { x: x, y: y };
}

/* ---- public API: the saved list ---- */
export function loadDungeons(){ list = read(); }

/* Newest first. */
export function getDungeons(){
  return list.slice().sort(function(a, b){ return b.updated - a.updated; });
}

export function getDungeon(id){
  return list.find(function(d){ return d.id === id; }) || null;
}

/* The map with this id, in any dungeon, or null. */
export function findMap(mapId){
  for(var i = 0; i < list.length; i++){
    var m = list[i].maps.find(function(x){ return x.id === mapId; });
    if(m) return m;
  }
  return null;
}

/* The dungeon a map belongs to, or null. */
export function dungeonOfMap(mapId){
  return list.find(function(d){ return d.maps.some(function(m){ return m.id === mapId; }); }) || null;
}

/* Returns "" if the name can be used, or why not. */
export function dungeonNameProblem(name, ownId){
  var lower = String(name || "").trim().toLowerCase();
  if(!lower) return "Give the dungeon a name.";
  var clash = list.some(function(d){ return d.name.toLowerCase() === lower && d.id !== ownId; });
  return clash ? "You already have a dungeon called " + String(name).trim() + "." : "";
}

function sizeById(sizeId){
  return DUNGEON_SIZES.find(function(s){ return s.id === sizeId; }) || DUNGEON_SIZES[1];
}

/* A new dungeon with one all-rock map. `sizeId` is one of DUNGEON_SIZES
   (medium if not). */
export function createDungeon(name, sizeId){
  var size = sizeById(sizeId);
  var d = clean({ id: uid(), name: name, maps: [{ id: uid(), name: "Map 1", w: size.w, h: size.h }] });
  list.push(d);
  write();
  return d;
}

/* Saves a dungeon after it, or one of its maps, was changed in place. */
export function saveDungeon(dOrMap){
  var d = Array.isArray(dOrMap.maps) ? dOrMap : dungeonOfMap(dOrMap.id);
  if(!d) return;
  d.updated = Date.now();
  if(list.indexOf(d) === -1) list.push(d);
  write();
}

export function deleteDungeon(id){
  list = list.filter(function(d){ return d.id !== id; });
  write();
}

/* A copy under a free name ("Crypt (copy)", "Crypt (copy 2)"), its maps
   copied too, with new ids. */
export function duplicateDungeon(id){
  var src = getDungeon(id);
  if(!src) return null;
  var copy = clean(JSON.parse(JSON.stringify(src)));
  copy.id = uid();
  var oldIds = copy.maps.map(function(m){ return m.id; });
  copy.maps.forEach(function(m){ m.id = uid(); });
  relink(copy, oldIds);
  copy.name = freeName(src.name + " (copy)");
  copy.updated = Date.now();
  list.push(copy);
  write();
  return copy;
}

function freeName(base){
  var name = base, n = 2;
  while(dungeonNameProblem(name, null)) name = base.replace(/\)$/, " " + (n++) + ")");
  return name;
}

/* Backup import: every entry is added, renamed if its name is taken. */
export function importDungeons(entries){
  var added = 0;
  (entries || []).forEach(function(raw){
    if(!raw || typeof raw!=="object" || Array.isArray(raw)) return;
    var d = clean(raw);
    d.id = uid();
    var oldIds = d.maps.map(function(m){ return m.id; });
    d.maps.forEach(function(m){ m.id = uid(); });
    relink(d, oldIds);
    if(dungeonNameProblem(d.name, null)) d.name = freeName(d.name + " (imported)");
    list.push(d);
    added++;
  });
  if(added) write();
  return added;
}

/* ---- public API: a dungeon's maps ----
   These change the dungeon in place and don't save. */

/* "Map 3", the first number no map of the dungeon uses. */
function freeMapName(d){
  var taken = {};
  d.maps.forEach(function(m){ taken[m.name.toLowerCase()] = true; });
  var n = d.maps.length + 1;
  while(taken[("Map " + n).toLowerCase()]) n++;
  return "Map " + n;
}

/* Adds a blank map right after `afterId` (at the end if not found), the
   same size and style as that map. Returns it, or null at MAX_MAPS. */
export function addMap(d, afterId){
  if(d.maps.length >= MAX_MAPS) return null;
  var i = d.maps.findIndex(function(m){ return m.id === afterId; });
  var like = d.maps[i] || d.maps[d.maps.length - 1];
  var m = cleanMap({ id: uid(), name: freeMapName(d), w: like.w, h: like.h, style: like.style, sight: like.sight });
  d.maps.splice(i === -1 ? d.maps.length : i + 1, 0, m);
  return m;
}

/* Takes a map out. A dungeon keeps at least one. */
export function removeMap(d, mapId){
  if(d.maps.length < 2) return false;
  var before = d.maps.length;
  d.maps = d.maps.filter(function(m){ return m.id !== mapId; });
  pruneLinks(d);
  return d.maps.length !== before;
}

/* Moves a map one place earlier (-1) or later (+1). */
export function moveMap(d, mapId, step){
  var i = d.maps.findIndex(function(m){ return m.id === mapId; });
  var j = i + step;
  if(i === -1 || j < 0 || j >= d.maps.length) return false;
  var m = d.maps[i];
  d.maps[i] = d.maps[j];
  d.maps[j] = m;
  return true;
}

/* Moves a map to place `to` (0 first), the others closing up around it,
   as when it is dragged there. */
export function placeMap(d, mapId, to){
  var i = d.maps.findIndex(function(m){ return m.id === mapId; });
  to = Math.max(0, Math.min(d.maps.length - 1, to));
  if(i === -1 || i === to) return false;
  var m = d.maps.splice(i, 1)[0];
  d.maps.splice(to, 0, m);
  return true;
}

export function renameMap(d, mapId, name){
  var m = d.maps.find(function(x){ return x.id === mapId; });
  var clean = String(name || "").trim().slice(0, 40);
  if(!m || !clean || clean === m.name) return false;
  m.name = clean;
  return true;
}

/* What the players' screen calls a map: the dungeon's name, and the map's
   too when the dungeon has more than one. */
export function mapTitle(d, m){
  return d && d.maps.length > 1 ? d.name + " · " + m.name : (d ? d.name : m.name);
}

/* ---- public API: reading a map ---- */
export function inMap(d, x, y){ return x >= 0 && y >= 0 && x < d.w && y < d.h; }

/* The terrain code at (x, y). Off the map is rock. */
export function cellAt(d, x, y){
  return inMap(d, x, y) ? d.cells.charAt(y * d.w + x) : ROCK;
}

export function isOpen(d, x, y){ return cellAt(d, x, y) !== ROCK; }

/* True for a map that is all rock. */
export function isBlank(d){ return !/[^ ]/.test(d.cells); }

/* The smallest box around every open square, {x, y, w, h}, or null for
   a map that is all rock. */
export function contentBounds(d){
  var x0 = d.w, y0 = d.h, x1 = -1, y1 = -1;
  for(var y = 0; y < d.h; y++){
    for(var x = 0; x < d.w; x++){
      if(d.cells.charAt(y * d.w + x) === ROCK) continue;
      if(x < x0) x0 = x;
      if(x > x1) x1 = x;
      if(y < y0) y0 = y;
      if(y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/* Which way a door or stairs square runs: "h" when the way through goes
   left to right (open ground beside it on the left or right and not
   above and below), else "v". */
export function passageAxis(d, x, y){
  var across = isOpen(d, x - 1, y) || isOpen(d, x + 1, y);
  var along = isOpen(d, x, y - 1) || isOpen(d, x, y + 1);
  if(across && !along) return "h";
  if(along && !across) return "v";
  // Both or neither: a door is set into whichever side has walls.
  var wallsLeftRight = !isOpen(d, x - 1, y) && !isOpen(d, x + 1, y);
  return wallsLeftRight ? "v" : "h";
}

/* ---- public API: changing a map ----
   These change the dungeon in place and don't save. Each returns true
   if any square actually changed, so the screen saves and records an
   undo step only for real changes. */

/* Changes squares through `fn(set)`, where set(x, y, code) paints one.
   A square turned to rock goes back into fog. */
function editCells(d, fn){
  var cells = d.cells.split(""), seen = d.revealed.split(""), lit = d.lit.split(""), changed = false;
  fn(function(x, y, code){
    if(!inMap(d, x, y)) return;
    var i = y * d.w + x;
    if(cells[i] === code) return;
    cells[i] = code;
    if(code === ROCK){ seen[i] = FOGGED; lit[i] = FOGGED; }
    changed = true;
  });
  if(!changed) return false;
  d.cells = cells.join("");
  d.revealed = seen.join("");
  d.lit = lit.join("");
  if(d.party && !isOpen(d, d.party.x, d.party.y)) d.party = null;
  d.links = d.links.filter(function(l){ return cellAt(d, l.x, l.y) === ">"; });
  return true;
}

/* Paints `code` on every [x, y] in `points`. */
export function paintCells(d, points, code){
  if(!TERRAIN[code]) return false;
  return editCells(d, function(set){
    (points || []).forEach(function(p){ set(p[0], p[1], code); });
  });
}

/* Fills the box between two corner squares (in any order) with `code`. */
export function fillRect(d, ax, ay, bx, by, code){
  if(!TERRAIN[code]) return false;
  var x0 = Math.max(0, Math.min(ax, bx)), x1 = Math.min(d.w - 1, Math.max(ax, bx));
  var y0 = Math.max(0, Math.min(ay, by)), y1 = Math.min(d.h - 1, Math.max(ay, by));
  return editCells(d, function(set){
    for(var y = y0; y <= y1; y++) for(var x = x0; x <= x1; x++) set(x, y, code);
  });
}

/* Every square on the straight line between two squares, ends
   included, with no diagonal gaps, so a quick brush stroke paints a
   corridor a person could walk along. */
export function lineCells(ax, ay, bx, by){
  var out = [[ax, ay]];
  var x = ax, y = ay;
  var dx = Math.abs(bx - ax), dy = Math.abs(by - ay);
  var sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
  // One step at a time along x or y, never both, so the squares touch by
  // a side. Step along x while the line crosses the next column edge
  // before the next row edge.
  for(var ix = 0, iy = 0; ix < dx || iy < dy;){
    if((1 + 2 * ix) * dy < (1 + 2 * iy) * dx){ x += sx; ix++; }
    else { y += sy; iy++; }
    out.push([x, y]);
  }
  return out;
}

/* Returns true if the style changed. */
export function setDungeonStyle(d, id){
  if(id === d.style || !DUNGEON_STYLES.some(function(st){ return st.id === id; })) return false;
  d.style = id;
  return true;
}

export function clearDungeon(d){
  var blank = new Array(d.w * d.h + 1).join(ROCK);
  if(d.cells === blank && !d.notes.length && !d.party) return false;
  d.cells = blank;
  d.revealed = new Array(d.w * d.h + 1).join(FOGGED);
  d.party = null;
  d.notes = [];
  d.links = [];
  d.lit = new Array(d.w * d.h + 1).join(FOGGED);
  return true;
}

/* Where the old map sits on a map resized to w by h: centred, so growing
   adds room on every side and shrinking trims every side evenly. */
function resizeOffset(d, w, h){
  return { x: Math.floor((w - d.w) / 2), y: Math.floor((h - d.h) / 2) };
}

/* True if resizing to w by h would cut off open ground. */
export function resizeLoses(d, w, h){
  w = side(w, d.w);
  h = side(h, d.h);
  var off = resizeOffset(d, w, h);
  for(var y = 0; y < d.h; y++){
    for(var x = 0; x < d.w; x++){
      if(d.cells.charAt(y * d.w + x) === ROCK) continue;
      var nx = x + off.x, ny = y + off.y;
      if(nx < 0 || ny < 0 || nx >= w || ny >= h) return true;
    }
  }
  return false;
}

export function resizeDungeon(d, w, h){
  w = side(w, d.w);
  h = side(h, d.h);
  if(w === d.w && h === d.h) return false;
  var off = resizeOffset(d, w, h);
  var cells = "", revealed = "", lit = "";
  for(var y = 0; y < h; y++){
    for(var x = 0; x < w; x++){
      cells += cellAt(d, x - off.x, y - off.y);
      revealed += isRevealed(d, x - off.x, y - off.y) ? SHOWN : FOGGED;
      lit += isLit(d, x - off.x, y - off.y) ? SHOWN : FOGGED;
    }
  }
  var party = d.party ? { x: d.party.x + off.x, y: d.party.y + off.y } : null;
  d.w = w;
  d.h = h;
  d.cells = cells;
  d.revealed = revealed;
  d.lit = lit;
  d.party = party && isOpen(d, party.x, party.y) ? party : null;
  d.notes = d.notes.map(function(n){ return Object.assign({}, n, { x: n.x + off.x, y: n.y + off.y }); })
    .filter(function(n){ return inMap(d, n.x, n.y); });
  d.links = d.links.map(function(l){ return { x: l.x + off.x, y: l.y + off.y, to: l.to }; })
    .filter(function(l){ return cellAt(d, l.x, l.y) === ">"; });
  return true;
}

/* ---- undo ----
   A step is the map as it was before a change ({w, h, cells, revealed,
   party}), so undo also brings back a resize, a cleared map, fog or
   where the party stood. Kept for the screen's
   session only, not saved. */
export function createHistory(limit){
  var max = limit || 100;
  var undoSteps = [], redoSteps = [];
  function copyNotes(list){ return list.map(function(n){ return Object.assign({}, n); }); }
  function snap(d){ return { w: d.w, h: d.h, cells: d.cells, revealed: d.revealed, party: d.party ? { x: d.party.x, y: d.party.y } : null, sight: d.sight, notes: copyNotes(d.notes), links: copyNotes(d.links), lit: d.lit }; }
  function apply(d, s){ d.w = s.w; d.h = s.h; d.cells = s.cells; d.revealed = s.revealed; d.party = s.party ? { x: s.party.x, y: s.party.y } : null; d.sight = s.sight; d.notes = copyNotes(s.notes); d.links = copyNotes(s.links); d.lit = s.lit; }
  function samePlace(a, b){ return a === b || (!!a && !!b && a.x === b.x && a.y === b.y); }
  return {
    /* Call with the map as it was before the change just made. */
    record: function(before){
      undoSteps.push(snap(before));
      if(undoSteps.length > max) undoSteps.shift();
      redoSteps = [];
    },
    snapshot: snap,
    /* True if the map is still as it was in `s`. */
    same: function(d, s){ return d.w === s.w && d.h === s.h && d.cells === s.cells && d.revealed === s.revealed && samePlace(d.party, s.party) && d.sight === s.sight && JSON.stringify(d.notes) === JSON.stringify(s.notes) && JSON.stringify(d.links) === JSON.stringify(s.links) && d.lit === s.lit; },
    canUndo: function(){ return undoSteps.length > 0; },
    canRedo: function(){ return redoSteps.length > 0; },
    undo: function(d){
      if(!undoSteps.length) return false;
      redoSteps.push(snap(d));
      apply(d, undoSteps.pop());
      return true;
    },
    redo: function(d){
      if(!redoSteps.length) return false;
      undoSteps.push(snap(d));
      apply(d, redoSteps.pop());
      return true;
    }
  };
}

/* ---- fog of war ---- */
export function isRevealed(d, x, y){
  return inMap(d, x, y) && d.revealed.charAt(y * d.w + x) === SHOWN;
}

/* Shows (`on` true) or hides every [x, y] in `points`. Rock is never
   shown. */
export function setRevealed(d, points, on){
  var seen = d.revealed.split(""), changed = false;
  (points || []).forEach(function(p){
    var x = p[0], y = p[1];
    if(!inMap(d, x, y) || (on && !isOpen(d, x, y))) return;
    var i = y * d.w + x, v = on ? SHOWN : FOGGED;
    if(seen[i] === v) return;
    seen[i] = v;
    changed = true;
  });
  if(!changed) return false;
  d.revealed = seen.join("");
  return true;
}

/* Shows all open ground, or hides everything. */
export function revealAll(d, on){
  var seen = "";
  for(var i = 0; i < d.cells.length; i++) seen += on && d.cells.charAt(i) !== ROCK ? SHOWN : FOGGED;
  if(seen === d.revealed) return false;
  d.revealed = seen;
  return true;
}

/* True once any square is shown to the players. */
export function anyRevealed(d){ return d.revealed.indexOf(SHOWN) !== -1; }

/* Doors: closed ("+"), secret ("s") and open ("/"). */
function isDoorCode(c){ return c === "+" || c === "s" || c === "/" || c === "l"; }

/* Ground a person walks through: open, and not a door. Doors, open or
   closed, split the map into areas. */
function walkable(d, x, y){
  var c = cellAt(d, x, y);
  return c !== ROCK && !isDoorCode(c);
}

/* Ground the party can see across: anything open but a closed or
   secret door. */
function seeThrough(d, x, y){
  var c = cellAt(d, x, y);
  return c !== ROCK && c !== "+" && c !== "s" && c !== "l";
}

/* Room ground is any walkable square in a 2 by 2 block of walkable
   squares. The rest is corridor: ground one square wide. */
function roomGround(d, x, y){
  for(var oy = -1; oy <= 0; oy++) for(var ox = -1; ox <= 0; ox++){
    var ax = x + ox, ay = y + oy;
    if(walkable(d, ax, ay) && walkable(d, ax + 1, ay) && walkable(d, ax, ay + 1) && walkable(d, ax + 1, ay + 1)) return true;
  }
  return false;
}

/* The squares one tap in Play mode shows: the room or corridor around
   (x, y), as [[x, y], ...].
   A room is its room ground, joined side by side, plus the doors in its
   walls and the first square of each corridor leading out, so the
   players see the ways on. A corridor runs until it reaches a room or a
   door, plus those doors. Secret doors are left out: they stay walls to
   the players until the DM taps one itself. A door or secret door is
   only itself, and rock is nothing. */
export function areaAt(d, x, y){
  if(!isOpen(d, x, y)) return [];
  if(!walkable(d, x, y)) return [[x, y]];
  var room = roomGround(d, x, y);
  var inArea = {}, out = [], queue = [[x, y]];
  inArea[x + "," + y] = true;
  while(queue.length){
    var p = queue.shift();
    out.push(p);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(s){
      var nx = p[0] + s[0], ny = p[1] + s[1], key = nx + "," + ny;
      if(inArea[key] || !walkable(d, nx, ny) || roomGround(d, nx, ny) !== room) return;
      inArea[key] = true;
      queue.push([nx, ny]);
    });
  }
  var edge = [];
  out.forEach(function(p){
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(s){
      var nx = p[0] + s[0], ny = p[1] + s[1], key = nx + "," + ny;
      if(inArea[key]) return;
      var doorway = cellAt(d, nx, ny) === "+" || cellAt(d, nx, ny) === "/" || cellAt(d, nx, ny) === "l";
      var corridorMouth = room && walkable(d, nx, ny) && !roomGround(d, nx, ny);
      if(!doorway && !corridorMouth) return;
      inArea[key] = true;
      edge.push([nx, ny]);
    });
  });
  return out.concat(edge);
}

/* What a tap in Play mode does: shows the area around (x, y), or hides
   it again if the players can already see all of it. */
export function toggleArea(d, x, y){
  var area = areaAt(d, x, y);
  if(!area.length) return false;
  var allShown = area.every(function(p){ return isRevealed(d, p[0], p[1]); });
  return setRevealed(d, area, !allShown);
}

/* ---- what the players see ----
   The map as the players' tab gets it: the same shape of dungeon, but
   holding only what has been shown to them, so nothing hidden ever
   reaches their screen. Shown squares keep their terrain, except a shown
   secret door, which is just a door to them. A hidden open square
   touching a shown one (side or corner) becomes FOG_EDGE: open (no wall
   is drawn between them, so a corridor running on into the dark, or a
   room only partly in sight, doesn't look walled off) but always under
   fog. Everything else is rock, far enough from what is shown that its
   walls stay under the fog. */
export var FOG_EDGE = "?";

export function playerView(d, title){
  var cells = "", revealed = "";
  for(var y = 0; y < d.h; y++){
    for(var x = 0; x < d.w; x++){
      var c = cellAt(d, x, y);
      if(isRevealed(d, x, y)){
        cells += c === "s" || c === "l" ? "+" : c;
        revealed += SHOWN;
        continue;
      }
      revealed += FOGGED;
      var edge = false;
      if(c !== ROCK && c !== "s"){
        for(var oy = -1; oy <= 1 && !edge; oy++) for(var ox = -1; ox <= 1; ox++) if(isRevealed(d, x + ox, y + oy)){ edge = true; break; }
      }
      cells += edge ? FOG_EDGE : ROCK;
    }
  }
  var party = d.party && isRevealed(d, d.party.x, d.party.y) ? { x: d.party.x, y: d.party.y } : null;
  return { id: d.id, name: title || d.name, w: d.w, h: d.h, cells: cells, revealed: revealed, style: d.style, party: party };
}

/* The box around every shown square, {x, y, w, h}, or null if nothing
   is shown. */
export function revealedBounds(d){
  var x0 = d.w, y0 = d.h, x1 = -1, y1 = -1;
  for(var i = 0; i < d.revealed.length; i++){
    if(d.revealed.charAt(i) !== SHOWN) continue;
    var x = i % d.w, y = Math.floor(i / d.w);
    if(x < x0) x0 = x;
    if(x > x1) x1 = x;
    if(y < y0) y0 = y;
    if(y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/* ---- the party ----
   The DM's marker for where the players' characters are. Walking it
   through the dungeon shows what they can see as they go. */
export var SIGHT = 12;      // squares the party sees unless the map says otherwise, 60 feet
export var SIGHT_MAX = 60;  // the most a map can set short of no limit, 300 feet

/* How far the party sees, the usual cases, in squares (0: no limit).
   Candles and torches light as far again in dim light as in bright,
   which the party can still see by. */
export var SIGHT_OPTIONS = [
  { squares: 2, label: "Candlelight", help: "A candle, or a faint glow" },
  { squares: 8, label: "Torchlight", help: "A torch or the Light cantrip" },
  { squares: 12, label: "Lantern or darkvision", help: "A hooded lantern, or most darkvision" },
  { squares: 24, label: "Superior darkvision", help: "Drow, deep gnomes and some others" },
  { squares: 0, label: "Daylight", help: "Bright light everywhere. Only walls and doors block the view" }
];

/* Sets how far the party sees on this map. If the party is on it and
   now sees further, that is shown straight away. Returns true if
   anything changed. */
export function setSight(d, squares){
  var n = cleanSight(squares);
  var changed = n !== d.sight;
  d.sight = n;
  if(d.party && setRevealed(d, sightFrom(d, d.party.x, d.party.y), true)) changed = true;
  return changed;
}

/* The open squares the party sees from (x, y): within the map's sight
   and with nothing in the way, or lit at any distance. Rock, closed,
   locked and secret doors block
   the view (a closed door itself is seen, not what is behind it), open
   doors don't, and a secret door is never seen this way: the DM shows
   those by tapping them. */
export function sightFrom(d, x, y){
  var out = [];
  var reach = d.sight === 0 ? Math.max(d.w, d.h) : (d.sight || SIGHT);
  // Lit ground is seen from any distance, so look across the whole map
  // when any of it is lit.
  var far = d.lit && d.lit.indexOf(SHOWN) !== -1 ? Math.max(d.w, d.h) : reach;
  for(var ty = y - far; ty <= y + far; ty++){
    for(var tx = x - far; tx <= x + far; tx++){
      var dx = tx - x, dy = ty - y;
      if(dx * dx + dy * dy > (reach + 0.5) * (reach + 0.5) && !isLit(d, tx, ty)) continue;
      var c = cellAt(d, tx, ty);
      if(c === ROCK || c === "s") continue;
      if(clearLine(d, x, y, tx, ty)) out.push([tx, ty]);
    }
  }
  return out;
}

/* True if nothing between two squares (not counting the squares
   themselves) blocks the view. */
function clearLine(d, ax, ay, bx, by){
  var line = lineCells(ax, ay, bx, by);
  for(var i = 1; i < line.length - 1; i++){
    if(!seeThrough(d, line[i][0], line[i][1])) return false;
  }
  return true;
}

/* Puts the party on (x, y) and shows what they see there. Only open
   ground. A closed door they step onto opens: they have to open it to
   get through, and it stays open behind them. Returns true if anything
   changed. */
export function placeParty(d, x, y){
  if(!isOpen(d, x, y) || cellAt(d, x, y) === "l") return false;
  var moved = !d.party || d.party.x !== x || d.party.y !== y;
  if(cellAt(d, x, y) === "+" && paintCells(d, [[x, y]], "/")) moved = true;
  d.party = { x: x, y: y };
  var shown = setRevealed(d, sightFrom(d, x, y), true);
  return moved || shown;
}

/* Walks the party in a straight line toward (x, y), a square at a time,
   showing what they see at every step. They stop at rock and at a locked
   door (see lockedAhead). Returns true if anything changed. */
export function walkParty(d, x, y){
  if(!d.party) return placeParty(d, x, y);
  var line = lineCells(d.party.x, d.party.y, x, y), changed = false;
  for(var i = 1; i < line.length; i++){
    if(!isOpen(d, line[i][0], line[i][1]) || cellAt(d, line[i][0], line[i][1]) === "l") break;
    if(placeParty(d, line[i][0], line[i][1])) changed = true;
  }
  return changed;
}

export function removeParty(d){
  if(!d.party) return false;
  d.party = null;
  return true;
}

/* True if the party's straight walk toward (x, y) stops at a locked
   door: the first square it can't enter on the way is one. */
export function lockedAhead(d, x, y){
  if(!d.party) return false;
  var line = lineCells(d.party.x, d.party.y, x, y);
  for(var i = 1; i < line.length; i++){
    var c = cellAt(d, line[i][0], line[i][1]);
    if(c === "l") return true;
    if(c === ROCK) return false;
  }
  return false;
}

/* ---- doors ----
   Opens a closed door or closes an open one. A secret door opens as a
   found, open door, and a locked one is unlocked and opened. The door itself is shown to the players, and if the
   party is on the map they see what the opened door lets them see.
   Returns true if (x, y) was a door. */
export function toggleDoor(d, x, y){
  var c = cellAt(d, x, y);
  if(!isDoorCode(c)) return false;
  paintCells(d, [[x, y]], c === "/" ? "+" : "/");
  setRevealed(d, [[x, y]], true);
  if(d.party) setRevealed(d, sightFrom(d, d.party.x, d.party.y), true);
  return true;
}

export function isDoor(d, x, y){ return isDoorCode(cellAt(d, x, y)); }

export function isLocked(d, x, y){ return cellAt(d, x, y) === "l"; }

/* ---- light ---- */
export function isLit(d, x, y){
  return inMap(d, x, y) && !!d.lit && d.lit.charAt(y * d.w + x) === SHOWN;
}

/* Lights (`on` true) or darkens every [x, y] in `points`. Rock is never
   lit. If the party is on the map, they see any newly lit ground in
   their line of sight. Returns true if anything changed. */
export function setLit(d, points, on){
  var lit = d.lit.split(""), changed = false;
  (points || []).forEach(function(p){
    var x = p[0], y = p[1];
    if(!inMap(d, x, y) || (on && !isOpen(d, x, y))) return;
    var i = y * d.w + x, v = on ? SHOWN : FOGGED;
    if(lit[i] === v) return;
    lit[i] = v;
    changed = true;
  });
  if(!changed) return false;
  d.lit = lit.join("");
  if(d.party) setRevealed(d, sightFrom(d, d.party.x, d.party.y), true);
  return true;
}

/* What a tap with the Light tool does: lights the room or corridor
   around (x, y), or darkens it if all of it is lit already. */
export function toggleLitArea(d, x, y){
  var area = areaAt(d, x, y);
  if(!area.length) return false;
  var allLit = area.every(function(p){ return isLit(d, p[0], p[1]); });
  return setLit(d, area, !allLit);
}

/* ---- the DM's notes ---- */

/* The note on square (x, y), or null. */
export function noteAt(d, x, y){
  return d.notes.find(function(n){ return n.x === x && n.y === y; }) || null;
}

/* Adds a note on (x, y) with the lowest number not in use. Returns it,
   or null if the square has one already, is off the map, or the map is
   full of notes. */
export function addNote(d, x, y){
  if(!inMap(d, x, y) || noteAt(d, x, y) || d.notes.length >= MAX_NOTES) return null;
  var used = {};
  d.notes.forEach(function(n){ used[n.n] = true; });
  var note = { id: uid(), n: lowestFree(used), x: x, y: y, text: "" };
  d.notes.push(note);
  return note;
}

export function setNoteText(d, id, text){
  var note = d.notes.find(function(n){ return n.id === id; });
  var clean = String(text || "").slice(0, NOTE_LENGTH);
  if(!note || note.text === clean) return false;
  note.text = clean;
  return true;
}

/* Moves a note to another free square. */
export function moveNote(d, id, x, y){
  var note = d.notes.find(function(n){ return n.id === id; });
  if(!note || !inMap(d, x, y) || (note.x === x && note.y === y) || noteAt(d, x, y)) return false;
  note.x = x;
  note.y = y;
  return true;
}

export function removeNote(d, id){
  var before = d.notes.length;
  d.notes = d.notes.filter(function(n){ return n.id !== id; });
  return d.notes.length !== before;
}

/* The notes in number order. */
export function notesInOrder(d){
  return d.notes.slice().sort(function(a, b){ return a.n - b.n; });
}

/* ---- stairs between maps ---- */

/* The link on stairs square (x, y), or null. */
export function linkAt(d, x, y){
  return d.links.find(function(l){ return l.x === x && l.y === y; }) || null;
}

/* All the stairs squares of a map, [[x, y], ...], top row first. */
export function stairsOf(d){
  var out = [];
  for(var i = 0; i < d.cells.length; i++) if(d.cells.charAt(i) === ">") out.push([i % d.w, Math.floor(i / d.w)]);
  return out;
}

/* Says where the stairs on (x, y) of map `m` lead: another map of the
   dungeon `dg` by id, or nowhere (null). Linking stairs to a map whose
   stairs don't lead anywhere yet, when it has exactly one staircase,
   links that one back, so going down and coming up again both work.
   Returns true if anything changed. */
export function linkStairs(dg, m, x, y, toId){
  if(cellAt(m, x, y) !== ">") return false;
  var target = toId ? dg.maps.find(function(t){ return t.id === toId && t !== m; }) : null;
  if(toId && !target) return false;
  var old = linkAt(m, x, y);
  if(!target){
    if(!old) return false;
    m.links = m.links.filter(function(l){ return l !== old; });
    return true;
  }
  if(old && old.to === target.id) return false;
  if(old) old.to = target.id;
  else m.links.push({ x: x, y: y, to: target.id });
  var back = target.links.some(function(l){ return l.to === m.id; });
  var free = stairsOf(target).filter(function(s){ return !linkAt(target, s[0], s[1]); });
  if(!back && free.length === 1 && stairsOf(target).length === 1) target.links.push({ x: free[0][0], y: free[0][1], to: m.id });
  return true;
}

/* Where the party comes out on map `to` after taking stairs from map
   `fromId`: the staircase there that leads back, or else its first
   staircase, or null if it has none. */
export function arrivalSquare(to, fromId){
  var back = to.links.find(function(l){ return l.to === fromId; });
  if(back) return [back.x, back.y];
  var first = stairsOf(to)[0];
  return first || null;
}
