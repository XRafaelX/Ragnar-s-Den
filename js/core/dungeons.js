import { uid } from "./basics.js";

/* ---------------- Dungeons ----------------
   A DM's dungeon maps, saved in this browser apart from any character.
   A map is terrain only: where the floor is and what kind of ground it
   is. What lives in the dungeon stays in the DM's notes.

   Dungeon shape:
     { id, name, w, h, cells, updated }

   The map is a grid of 5 ft squares, `w` wide and `h` tall. `cells` is a
   string of w*h terrain codes (see TERRAIN), row by row from the top
   left, so square (x, y) is cells[y*w + x]. A string keeps a big map
   small in storage and makes undo a plain copy.

   Walls are not painted. Every square that isn't solid rock is open
   ground, and a wall is drawn wherever open ground meets rock, so the
   DM only paints rooms and corridors and the walls follow. */

export var ROCK = " ";
export var FLOOR = ".";

/* Every terrain, in the order the tool bar shows them. `open` is false
   only for rock. */
export var TERRAIN = {
  " ": { id: "rock", label: "Rock", open: false },
  ".": { id: "floor", label: "Floor", open: true },
  "+": { id: "door", label: "Door", open: true },
  "s": { id: "secret", label: "Secret door", open: true },
  ">": { id: "stairs", label: "Stairs", open: true },
  "~": { id: "water", label: "Water", open: true },
  "o": { id: "pit", label: "Pit", open: true },
  ":": { id: "rubble", label: "Rubble", open: true }
};

/* Map sizes offered when a dungeon is made, in squares. */
export var DUNGEON_SIZES = [
  { id: "small", label: "Small", w: 24, h: 16 },
  { id: "medium", label: "Medium", w: 36, h: 24 },
  { id: "large", label: "Large", w: 50, h: 34 }
];
export var MIN_SIDE = 8;
export var MAX_SIDE = 80;

var STORAGE_KEY = "ragnarsDen.dungeons.v1";

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

/* Shapes a stored or imported dungeon: a size within the limits and a
   cells string of exactly that size, with anything unknown made rock. */
function clean(d){
  var w = side(d.w, DUNGEON_SIZES[1].w);
  var h = side(d.h, DUNGEON_SIZES[1].h);
  var src = typeof d.cells === "string" ? d.cells : "";
  var cells = "";
  for(var i = 0; i < w * h; i++){
    var c = src.charAt(i);
    cells += TERRAIN[c] ? c : ROCK;
  }
  var updated = parseInt(d.updated, 10);
  return {
    id: String(d.id || uid()),
    name: String(d.name || "").trim().slice(0, 60) || "Dungeon",
    w: w,
    h: h,
    cells: cells,
    updated: isNaN(updated) ? Date.now() : updated
  };
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

/* Returns "" if the name can be used, or why not. */
export function dungeonNameProblem(name, ownId){
  var lower = String(name || "").trim().toLowerCase();
  if(!lower) return "Give the dungeon a name.";
  var clash = list.some(function(d){ return d.name.toLowerCase() === lower && d.id !== ownId; });
  return clash ? "You already have a dungeon called " + String(name).trim() + "." : "";
}

/* A new all-rock map. `sizeId` is one of DUNGEON_SIZES (medium if not). */
export function createDungeon(name, sizeId){
  var size = DUNGEON_SIZES.find(function(s){ return s.id === sizeId; }) || DUNGEON_SIZES[1];
  var d = clean({ id: uid(), name: name, w: size.w, h: size.h, cells: "" });
  list.push(d);
  write();
  return d;
}

/* Saves a dungeon after it was changed in place. */
export function saveDungeon(d){
  d.updated = Date.now();
  if(list.indexOf(d) === -1) list.push(d);
  write();
}

export function deleteDungeon(id){
  list = list.filter(function(d){ return d.id !== id; });
  write();
}

/* A copy under a free name ("Crypt (copy)", "Crypt (copy 2)"). */
export function duplicateDungeon(id){
  var src = getDungeon(id);
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
    if(dungeonNameProblem(d.name, null)) d.name = freeName(d.name + " (imported)");
    list.push(d);
    added++;
  });
  if(added) write();
  return added;
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

function setAt(d, x, y, code, out){
  if(!inMap(d, x, y)) return;
  var i = y * d.w + x;
  if(out[i] === code) return;
  out[i] = code;
  out.changed = true;
}

/* Paints `code` on every [x, y] in `points`. */
export function paintCells(d, points, code){
  if(!TERRAIN[code]) return false;
  var arr = d.cells.split("");
  (points || []).forEach(function(p){ setAt(d, p[0], p[1], code, arr); });
  if(!arr.changed) return false;
  d.cells = arr.join("");
  return true;
}

/* Fills the box between two corner squares (in any order) with `code`. */
export function fillRect(d, ax, ay, bx, by, code){
  if(!TERRAIN[code]) return false;
  var x0 = Math.max(0, Math.min(ax, bx)), x1 = Math.min(d.w - 1, Math.max(ax, bx));
  var y0 = Math.max(0, Math.min(ay, by)), y1 = Math.min(d.h - 1, Math.max(ay, by));
  var arr = d.cells.split("");
  for(var y = y0; y <= y1; y++) for(var x = x0; x <= x1; x++) setAt(d, x, y, code, arr);
  if(!arr.changed) return false;
  d.cells = arr.join("");
  return true;
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

export function clearDungeon(d){
  var blank = new Array(d.w * d.h + 1).join(ROCK);
  if(d.cells === blank) return false;
  d.cells = blank;
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
  var cells = "";
  for(var y = 0; y < h; y++){
    for(var x = 0; x < w; x++) cells += cellAt(d, x - off.x, y - off.y);
  }
  d.w = w;
  d.h = h;
  d.cells = cells;
  return true;
}

/* ---- undo ----
   A step is the map as it was before a change ({w, h, cells}), so undo
   also brings back a resize or a cleared map. Kept for the screen's
   session only, not saved. */
export function createHistory(limit){
  var max = limit || 100;
  var undoSteps = [], redoSteps = [];
  function snap(d){ return { w: d.w, h: d.h, cells: d.cells }; }
  function apply(d, s){ d.w = s.w; d.h = s.h; d.cells = s.cells; }
  return {
    /* Call with the map as it was before the change just made. */
    record: function(before){
      undoSteps.push(snap(before));
      if(undoSteps.length > max) undoSteps.shift();
      redoSteps = [];
    },
    snapshot: snap,
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
