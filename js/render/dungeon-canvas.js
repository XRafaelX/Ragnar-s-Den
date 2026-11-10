import { ROCK, cellAt, isOpen, passageAxis, contentBounds } from "../core/dungeons.js";

/* ---------------- Drawing a dungeon map ----------------
   Paints a dungeon (js/core/dungeons.js) onto a 2D canvas in the style
   of an old paper map: pale flagstone floors on a grid, thick walls
   wherever floor meets rock, and hatching on the rock just outside the
   walls. The DM's screen, the tool bar's swatches and the saved list's
   thumbnails all draw through here, and so will the players' tab, so
   every view of a map looks the same.

   The map keeps its own colors whatever the app's theme: it is meant to
   read like a map on a TV across the table. Only the space around the
   map (`outside`) follows the theme.

   `view` places the map on the canvas, in the canvas's own pixels:
     { scale: pixels per square, ox, oy: where square (0, 0)'s top left
       corner lands, width, height: the canvas size }
   Square edges are rounded to whole pixels so neighbouring squares meet
   with no hairline gaps at any zoom. */

export var MAP_COLORS = {
  rock: "#2b2732",
  hatch: "#4a4453",
  rockGrid: "rgba(255,255,255,0.06)",
  floor: "#dcd2bd",
  floorGrid: "rgba(70,52,30,0.22)",
  wall: "#1c1921",
  door: "#9a6a37",
  doorEdge: "#3b2614",
  secret: "#b23b4b",
  stairs: "#4f4536",
  water: "#5b8db0",
  waterLine: "rgba(235,246,252,0.75)",
  pitEdge: "#3a3340",
  pit: "#17141b",
  rubble: "#8a7f6c",
  rubbleEdge: "#5b5243"
};

/* A steady "random" number per square, so hatching and rubble look hand
   drawn but don't jump about between redraws. */
function hash(x, y, salt){
  var h = (x * 374761393 + y * 668265263 + (salt || 0) * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* opts: { outside: color around the map, grid: show the grid on rock
   too (for building), dm: show secret doors as the DM sees them } */
export function drawMap(ctx, d, view, opts){
  opts = opts || {};
  var s = view.scale;
  ctx.save();
  ctx.fillStyle = opts.outside || "#120f1a";
  ctx.fillRect(0, 0, view.width, view.height);

  // Only the squares on screen, plus one around them for the walls.
  var x0 = Math.max(0, Math.floor(-view.ox / s) - 1);
  var y0 = Math.max(0, Math.floor(-view.oy / s) - 1);
  var x1 = Math.min(d.w - 1, Math.ceil((view.width - view.ox) / s));
  var y1 = Math.min(d.h - 1, Math.ceil((view.height - view.oy) / s));
  if(x1 < x0 || y1 < y0){ ctx.restore(); return; }

  function ex(x){ return Math.round(view.ox + x * s); }
  function ey(y){ return Math.round(view.oy + y * s); }

  // Rock under the whole map.
  ctx.fillStyle = MAP_COLORS.rock;
  ctx.fillRect(ex(0), ey(0), ex(d.w) - ex(0), ey(d.h) - ey(0));

  if(opts.grid && s >= 8){
    ctx.beginPath();
    for(var gx = x0; gx <= x1 + 1; gx++){ ctx.moveTo(ex(gx) + 0.5, ey(y0)); ctx.lineTo(ex(gx) + 0.5, ey(y1 + 1)); }
    for(var gy = y0; gy <= y1 + 1; gy++){ ctx.moveTo(ex(x0), ey(gy) + 0.5); ctx.lineTo(ex(x1 + 1), ey(gy) + 0.5); }
    ctx.strokeStyle = MAP_COLORS.rockGrid;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  var x, y;
  if(s >= 10){
    for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
      if(!isOpen(d, x, y) && nearOpen(d, x, y)) hatch(ctx, x, y, ex(x), ey(y), ex(x + 1) - ex(x));
    }
  }

  // Floor, a row of open squares at a time.
  ctx.fillStyle = MAP_COLORS.floor;
  for(y = y0; y <= y1; y++){
    var run = -1;
    for(x = x0; x <= x1 + 1; x++){
      var open = x <= x1 && isOpen(d, x, y);
      if(open && run < 0) run = x;
      if(!open && run >= 0){ ctx.fillRect(ex(run), ey(y), ex(x) - ex(run), ey(y + 1) - ey(y)); run = -1; }
    }
  }

  // Water fills its squares before the grid goes over it.
  ctx.fillStyle = MAP_COLORS.water;
  for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
    if(cellAt(d, x, y) === "~") ctx.fillRect(ex(x), ey(y), ex(x + 1) - ex(x), ey(y + 1) - ey(y));
  }

  // The floor's grid: every edge of every open square, in one stroke so
  // shared edges aren't drawn darker.
  if(s >= 6){
    ctx.beginPath();
    for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
      if(!isOpen(d, x, y)) continue;
      ctx.rect(ex(x) + 0.5, ey(y) + 0.5, ex(x + 1) - ex(x), ey(y + 1) - ey(y));
    }
    ctx.strokeStyle = MAP_COLORS.floorGrid;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // What's on the floor.
  for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
    var code = cellAt(d, x, y);
    if(code === ROCK || code === ".") continue;
    var box = { x: ex(x), y: ey(y), s: ex(x + 1) - ex(x) };
    if(code === "+") drawDoor(ctx, box, passageAxis(d, x, y));
    else if(code === "s"){ if(opts.dm) drawSecret(ctx, box, passageAxis(d, x, y)); }
    else if(code === ">") drawStairs(ctx, box, passageAxis(d, x, y));
    else if(code === "~") drawWater(ctx, box, x, y);
    else if(code === "o") drawPit(ctx, box);
    else if(code === ":") drawRubble(ctx, box, x, y);
  }

  // Walls: a thick line on every side where open ground meets rock.
  ctx.beginPath();
  for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
    if(!isOpen(d, x, y)) continue;
    if(!isOpen(d, x, y - 1)){ ctx.moveTo(ex(x), ey(y)); ctx.lineTo(ex(x + 1), ey(y)); }
    if(!isOpen(d, x, y + 1)){ ctx.moveTo(ex(x), ey(y + 1)); ctx.lineTo(ex(x + 1), ey(y + 1)); }
    if(!isOpen(d, x - 1, y)){ ctx.moveTo(ex(x), ey(y)); ctx.lineTo(ex(x), ey(y + 1)); }
    if(!isOpen(d, x + 1, y)){ ctx.moveTo(ex(x + 1), ey(y)); ctx.lineTo(ex(x + 1), ey(y + 1)); }
  }
  ctx.strokeStyle = MAP_COLORS.wall;
  ctx.lineWidth = Math.max(2, s * 0.14);
  ctx.lineCap = "square";
  ctx.stroke();

  ctx.restore();
}

function nearOpen(d, x, y){
  for(var dy = -1; dy <= 1; dy++) for(var dx = -1; dx <= 1; dx++){
    if((dx || dy) && isOpen(d, x + dx, y + dy)) return true;
  }
  return false;
}

/* A few parallel strokes at a slant that changes square to square. */
function hatch(ctx, x, y, px, py, s){
  var angle = hash(x, y, 1) * Math.PI;
  var cos = Math.cos(angle), sin = Math.sin(angle);
  var cx = px + s / 2, cy = py + s / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, s, s);
  ctx.clip();
  ctx.beginPath();
  for(var i = -2; i <= 2; i++){
    var off = i * s * 0.22;
    var mx = cx - sin * off, my = cy + cos * off;
    ctx.moveTo(mx - cos * s * 0.6, my - sin * s * 0.6);
    ctx.lineTo(mx + cos * s * 0.6, my + sin * s * 0.6);
  }
  ctx.strokeStyle = MAP_COLORS.hatch;
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.stroke();
  ctx.restore();
}

/* A door is a plank across the way through: upright for a corridor
   running left to right ("h"), flat for one running up and down. */
function drawDoor(ctx, b, axis){
  var long = b.s * 0.78, thick = Math.max(3, b.s * 0.26);
  var w = axis === "h" ? thick : long, h = axis === "h" ? long : thick;
  var x = b.x + (b.s - w) / 2, y = b.y + (b.s - h) / 2;
  ctx.fillStyle = MAP_COLORS.door;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = MAP_COLORS.doorEdge;
  ctx.lineWidth = Math.max(1, b.s * 0.05);
  ctx.strokeRect(x, y, w, h);
}

/* Only the DM sees a secret door: a dashed line and an S. */
function drawSecret(ctx, b, axis){
  var cx = b.x + b.s / 2, cy = b.y + b.s / 2, half = b.s * 0.4;
  ctx.save();
  ctx.strokeStyle = MAP_COLORS.secret;
  ctx.lineWidth = Math.max(1.5, b.s * 0.08);
  ctx.setLineDash([Math.max(2, b.s * 0.12), Math.max(2, b.s * 0.08)]);
  ctx.beginPath();
  if(axis === "h"){ ctx.moveTo(cx, cy - half); ctx.lineTo(cx, cy + half); }
  else { ctx.moveTo(cx - half, cy); ctx.lineTo(cx + half, cy); }
  ctx.stroke();
  ctx.setLineDash([]);
  if(b.s >= 14){
    ctx.fillStyle = MAP_COLORS.secret;
    ctx.font = "bold " + Math.round(b.s * 0.42) + "px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var tx = axis === "h" ? cx + b.s * 0.24 : cx, ty = axis === "h" ? cy : cy - b.s * 0.22;
    ctx.fillText("S", tx, ty);
  }
  ctx.restore();
}

/* Steps across the way through, each one a little shorter, so the
   stairs seem to go down. */
function drawStairs(ctx, b, axis){
  ctx.strokeStyle = MAP_COLORS.stairs;
  ctx.lineWidth = Math.max(1, b.s * 0.06);
  ctx.beginPath();
  var n = 5;
  for(var i = 0; i < n; i++){
    var t = b.s * (0.14 + i * 0.18);
    var half = b.s * (0.42 - i * 0.045);
    var mid = b.s / 2;
    if(axis === "h"){ ctx.moveTo(b.x + t, b.y + mid - half); ctx.lineTo(b.x + t, b.y + mid + half); }
    else { ctx.moveTo(b.x + mid - half, b.y + t); ctx.lineTo(b.x + mid + half, b.y + t); }
  }
  ctx.stroke();
}

function drawWater(ctx, b, x, y){
  if(b.s < 10) return;
  ctx.strokeStyle = MAP_COLORS.waterLine;
  ctx.lineWidth = Math.max(1, b.s * 0.05);
  ctx.beginPath();
  var shift = hash(x, y, 2) * 0.3;
  [0.32, 0.68].forEach(function(row, i){
    var yy = b.y + b.s * row;
    var left = b.x + b.s * (0.15 + (i ? 0.25 - shift : shift));
    var w = b.s * 0.45;
    ctx.moveTo(left, yy);
    ctx.quadraticCurveTo(left + w * 0.25, yy - b.s * 0.08, left + w * 0.5, yy);
    ctx.quadraticCurveTo(left + w * 0.75, yy + b.s * 0.08, left + w, yy);
  });
  ctx.stroke();
}

/* A dark hole with a rim, crossed like a pit on a paper map. */
function drawPit(ctx, b){
  var inset = b.s * 0.12, x = b.x + inset, y = b.y + inset, w = b.s - inset * 2;
  ctx.fillStyle = MAP_COLORS.pit;
  ctx.fillRect(x, y, w, w);
  ctx.strokeStyle = MAP_COLORS.pitEdge;
  ctx.lineWidth = Math.max(1, b.s * 0.06);
  ctx.strokeRect(x, y, w, w);
  if(b.s < 10) return;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + w);
  ctx.moveTo(x + w, y); ctx.lineTo(x, y + w);
  ctx.stroke();
}

/* Loose stones scattered over the square. */
function drawRubble(ctx, b, x, y){
  var n = b.s < 10 ? 2 : 5;
  ctx.fillStyle = MAP_COLORS.rubble;
  ctx.strokeStyle = MAP_COLORS.rubbleEdge;
  ctx.lineWidth = Math.max(0.75, b.s * 0.03);
  for(var i = 0; i < n; i++){
    var cx = b.x + b.s * (0.18 + hash(x, y, 10 + i) * 0.64);
    var cy = b.y + b.s * (0.18 + hash(x, y, 20 + i) * 0.64);
    var r = b.s * (0.06 + hash(x, y, 30 + i) * 0.07);
    ctx.beginPath();
    for(var k = 0; k < 5; k++){
      var a = k / 5 * Math.PI * 2 + hash(x, y, 40 + i);
      var rr = r * (0.75 + hash(x + k, y, 50 + i) * 0.5);
      if(k) ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      else ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/* ---- Small pictures ---- */

/* Sizes a canvas to its box on screen in device pixels and returns its
   2D context with nothing scaled, plus that size. */
export function prepareCanvas(canvas, cssW, cssH){
  var dpr = window.devicePixelRatio || 1;
  var w = Math.max(1, Math.round(cssW * dpr)), h = Math.max(1, Math.round(cssH * dpr));
  if(canvas.width !== w) canvas.width = w;
  if(canvas.height !== h) canvas.height = h;
  var ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return { ctx: ctx, width: w, height: h, dpr: dpr };
}

/* A view that fits the box (x, y, w, h in squares) into a canvas of
   width by height pixels, centred, with `pad` pixels spare on each side. */
export function fitView(box, width, height, pad){
  var scale = Math.min((width - pad * 2) / box.w, (height - pad * 2) / box.h);
  return {
    scale: scale,
    ox: (width - box.w * scale) / 2 - box.x * scale,
    oy: (height - box.h * scale) / 2 - box.y * scale,
    width: width,
    height: height
  };
}

/* A tool's swatch: one square of `code` in a small patch of map, the
   way it looks when painted (a door in a short corridor, floor in a
   little room). */
export function drawSwatch(canvas, code, cssSize, outside){
  var c = prepareCanvas(canvas, cssSize, cssSize);
  var mini;
  if(code === "+" || code === "s" || code === ">") mini = { w: 3, h: 3, cells: "   ." + code + ".   " };
  else mini = { w: 3, h: 3, cells: "    " + code + "    " };
  var view = fitView({ x: 0.55, y: 0.55, w: 1.9, h: 1.9 }, c.width, c.height, 0);
  drawMap(c.ctx, mini, view, { outside: outside, dm: true });
}

/* The whole map shrunk into a canvas, for the saved list. Fits the
   painted part with a little rock around it, or the whole map if it is
   still blank. */
export function drawThumbnail(canvas, d, cssW, cssH, outside){
  var c = prepareCanvas(canvas, cssW, cssH);
  var b = contentBounds(d);
  var box = b ? { x: b.x - 1, y: b.y - 1, w: b.w + 2, h: b.h + 2 } : { x: 0, y: 0, w: d.w, h: d.h };
  drawMap(c.ctx, d, fitView(box, c.width, c.height, 6 * c.dpr), { outside: outside, dm: true });
}
