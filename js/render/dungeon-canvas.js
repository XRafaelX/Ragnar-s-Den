import { ROCK, inMap, cellAt, isOpen, isRevealed, passageAxis, contentBounds, revealedBounds } from "../core/dungeons.js";

/* ---------------- Drawing a dungeon map ----------------
   Paints a dungeon (js/core/dungeons.js) onto a 2D canvas in the style
   of an old paper map: pale flagstone floors on a grid, thick walls
   wherever floor meets rock, and hatching on the rock just outside the
   walls. The DM's screen, the tool bar's swatches and the saved list's
   thumbnails all draw through here, and so will the players' tab, so
   every view of a map looks the same.

   The map keeps its own colors whatever the app's theme: it is meant to
   read like a map on a TV across the table. Only the space around the
   map (`outside`) follows the theme. Each map's `style` (see STYLES)
   picks a palette and three traits: how the rock beside the walls is
   textured, what detail the floor gets, and whether walls run straight
   or rough.

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
  rubbleEdge: "#5b5243",
  fog: "#0d0b12"
};

/* rock: "hatch" | "stipple" | "leaves" | "solid"
   floor: "" | "flecks" | "planks" | "cracks" | "embers" | "tufts"
   walls: "straight" | "rough" */
var STYLES = {
  stone: { colors: MAP_COLORS, rock: "hatch", floor: "", walls: "straight" },
  cave: {
    rock: "stipple", floor: "flecks", walls: "rough",
    colors: Object.assign({}, MAP_COLORS, {
      rock: "#2a231f", hatch: "#55483d", rockGrid: "rgba(255,235,210,0.06)",
      floor: "#cdbb9c", floorGrid: "rgba(70,50,28,0.16)", floorDetail: "rgba(90,66,40,0.35)",
      wall: "#1d1713", stairs: "#4d3f30", rubble: "#7d6c57", rubbleEdge: "#4f4234"
    })
  },
  // White floors, a blue grid and solid blue rock, like old printed modules.
  classic: {
    rock: "solid", floor: "", walls: "straight",
    colors: Object.assign({}, MAP_COLORS, {
      rock: "#6f9fd8", rockGrid: "rgba(255,255,255,0.2)",
      floor: "#f7f9fc", floorGrid: "rgba(70,120,200,0.55)",
      wall: "#1f4e9a", door: "#ffffff", doorEdge: "#1f4e9a", stairs: "#1f4e9a",
      water: "#a8c8ee", waterLine: "rgba(31,78,154,0.7)",
      pit: "#c9daf2", pitEdge: "#1f4e9a", rubble: "#c9daf2", rubbleEdge: "#1f4e9a"
    })
  },
  wood: {
    rock: "solid", floor: "planks", walls: "straight",
    colors: Object.assign({}, MAP_COLORS, {
      rock: "#1e1712", rockGrid: "rgba(255,230,200,0.06)",
      floor: "#b98a55", floorGrid: "rgba(60,35,15,0.3)", floorDetail: "rgba(70,40,15,0.45)",
      wall: "#2a1a0d", door: "#6b4421", doorEdge: "#1c1006", stairs: "#3b2412",
      pit: "#120c08", pitEdge: "#3a2614", rubble: "#7b5a38", rubbleEdge: "#3d2a17"
    })
  },
  ice: {
    rock: "hatch", floor: "cracks", walls: "rough",
    colors: Object.assign({}, MAP_COLORS, {
      rock: "#1b2733", hatch: "#3d5468", rockGrid: "rgba(220,240,255,0.07)",
      floor: "#e3f1f7", floorGrid: "rgba(70,120,150,0.25)", floorDetail: "rgba(100,150,185,0.6)",
      wall: "#102030", stairs: "#3d5a70", water: "#3f78a6",
      pit: "#0d1822", pitEdge: "#35506a", rubble: "#a9c4d4", rubbleEdge: "#6d8ea3"
    })
  },
  volcanic: {
    rock: "stipple", floor: "embers", walls: "rough",
    colors: Object.assign({}, MAP_COLORS, {
      rock: "#160f0d", hatch: "#a8401b", rockGrid: "rgba(255,160,120,0.07)",
      floor: "#5a4d47", floorGrid: "rgba(0,0,0,0.35)", floorDetail: "#ff7a2a",
      wall: "#0b0706", door: "#5e3a20", doorEdge: "#150b05", stairs: "#1b1311", water: "#3d6a8a",
      pit: "#0a0605", pitEdge: "#ff6a1f", rubble: "#3a302c", rubbleEdge: "#181210"
    })
  },
  overgrown: {
    rock: "leaves", floor: "tufts", walls: "straight",
    colors: Object.assign({}, MAP_COLORS, {
      rock: "#18231a", hatch: "#3f6338", rockGrid: "rgba(220,255,210,0.06)",
      floor: "#c3c79f", floorGrid: "rgba(50,70,30,0.25)", floorDetail: "#5f8a3c",
      wall: "#152013", stairs: "#3f4a2c", rubble: "#7d8064", rubbleEdge: "#45482f"
    })
  }
};
var C = MAP_COLORS;     // the palette of the map being drawn
var T = STYLES.stone;   // and its traits

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
  T = STYLES[d.style] || STYLES.stone;
  C = T.colors;
  var s = view.scale;
  ctx.save();
  ctx.fillStyle = opts.outside || "#120f1a";
  ctx.fillRect(0, 0, view.width, view.height);

  var r = onScreen(d, view);
  if(!r){ ctx.restore(); return; }
  var x0 = r.x0, y0 = r.y0, x1 = r.x1, y1 = r.y1;
  function ex(x){ return Math.round(view.ox + x * s); }
  function ey(y){ return Math.round(view.oy + y * s); }

  // Rock under the whole map.
  ctx.fillStyle = C.rock;
  ctx.fillRect(ex(0), ey(0), ex(d.w) - ex(0), ey(d.h) - ey(0));

  if(opts.grid && s >= 8){
    ctx.beginPath();
    for(var gx = x0; gx <= x1 + 1; gx++){ ctx.moveTo(ex(gx) + 0.5, ey(y0)); ctx.lineTo(ex(gx) + 0.5, ey(y1 + 1)); }
    for(var gy = y0; gy <= y1 + 1; gy++){ ctx.moveTo(ex(x0), ey(gy) + 0.5); ctx.lineTo(ex(x1 + 1), ey(gy) + 0.5); }
    ctx.strokeStyle = C.rockGrid;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  var x, y;
  if(s >= 10){
    for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
      if(isOpen(d, x, y) || !nearOpen(d, x, y)) continue;
      if(T.rock === "hatch") hatch(ctx, x, y, ex(x), ey(y), ex(x + 1) - ex(x));
      else if(T.rock === "stipple") stipple(ctx, x, y, ex(x), ey(y), ex(x + 1) - ex(x));
      else if(T.rock === "leaves") leaves(ctx, x, y, ex(x), ey(y), ex(x + 1) - ex(x));
    }
  }

  // Floor, a row of open squares at a time.
  ctx.fillStyle = C.floor;
  for(y = y0; y <= y1; y++){
    var run = -1;
    for(x = x0; x <= x1 + 1; x++){
      var open = x <= x1 && isOpen(d, x, y);
      if(open && run < 0) run = x;
      if(!open && run >= 0){ ctx.fillRect(ex(run), ey(y), ex(x) - ex(run), ey(y + 1) - ey(y)); run = -1; }
    }
  }

  // Water fills its squares before the grid goes over it.
  ctx.fillStyle = C.water;
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
    ctx.strokeStyle = C.floorGrid;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // The style's floor detail, on plain floor squares.
  if(T.floor && s >= 14){
    for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
      if(cellAt(d, x, y) === ".") floorDetail(ctx, x, y, ex(x), ey(y), ex(x + 1) - ex(x));
    }
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
  // Rough walls bulge in and out a little along each side; the corners
  // stay put, so neighbouring sides always meet.
  var rough = T.walls === "rough";
  function wall(ax, ay, bx, by){
    ctx.moveTo(ex(ax), ey(ay));
    if(!rough){ ctx.lineTo(ex(bx), ey(by)); return; }
    var bulge = (hash(ax + bx, ay + by, 80) - 0.5) * s * 0.3;
    var mx = (ex(ax) + ex(bx)) / 2 + (ay === by ? 0 : bulge), my = (ey(ay) + ey(by)) / 2 + (ay === by ? bulge : 0);
    ctx.quadraticCurveTo(mx, my, ex(bx), ey(by));
  }
  ctx.beginPath();
  for(y = y0; y <= y1; y++) for(x = x0; x <= x1; x++){
    if(!isOpen(d, x, y)) continue;
    if(!isOpen(d, x, y - 1)) wall(x, y, x + 1, y);
    if(!isOpen(d, x, y + 1)) wall(x, y + 1, x + 1, y + 1);
    if(!isOpen(d, x - 1, y)) wall(x, y, x, y + 1);
    if(!isOpen(d, x + 1, y)) wall(x + 1, y, x + 1, y + 1);
  }
  ctx.strokeStyle = C.wall;
  ctx.lineWidth = Math.max(2, s * (rough ? 0.17 : 0.14));
  ctx.lineCap = rough ? "round" : "square";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.restore();
}

/* The squares on screen, plus one around them for the walls, as
   {x0, y0, x1, y1}, or null if none of the map is. */
function onScreen(d, view){
  var s = view.scale;
  var r = {
    x0: Math.max(0, Math.floor(-view.ox / s) - 1),
    y0: Math.max(0, Math.floor(-view.oy / s) - 1),
    x1: Math.min(d.w - 1, Math.ceil((view.width - view.ox) / s)),
    y1: Math.min(d.h - 1, Math.ceil((view.height - view.oy) / s))
  };
  return r.x1 < r.x0 || r.y1 < r.y0 ? null : r;
}

/* Fog over every square the players can't see, `alpha` thick (1 hides
   it completely). Players see the squares shown to them and the rock
   right beside those (the walls and hatching around a shown room). */
export function drawFog(ctx, d, view, alpha){
  var r = onScreen(d, view);
  if(!r) return;
  var s = view.scale;
  function ex(x){ return Math.round(view.ox + x * s); }
  function ey(y){ return Math.round(view.oy + y * s); }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = MAP_COLORS.fog;
  ctx.beginPath();
  for(var y = r.y0; y <= r.y1; y++){
    var run = -1;
    for(var x = r.x0; x <= r.x1 + 1; x++){
      var fogged = x <= r.x1 && !isSeen(d, x, y);
      if(fogged && run < 0) run = x;
      if(!fogged && run >= 0){ ctx.rect(ex(run), ey(y), ex(x) - ex(run), ey(y + 1) - ey(y)); run = -1; }
    }
  }
  // One fill, so the runs don't overlap into darker seams.
  ctx.fill();
  ctx.restore();
}

/* True if the players can see square (x, y): it was shown to them, or it
   is rock right beside a shown square. */
export function isSeen(d, x, y){
  if(isRevealed(d, x, y)) return true;
  if(isOpen(d, x, y)) return false;
  for(var dy = -1; dy <= 1; dy++) for(var dx = -1; dx <= 1; dx++) if(isRevealed(d, x + dx, y + dy)) return true;
  return false;
}

/* Fog with soft edges, for the players: `amountAt(x, y)` is how thick it
   is on each square, 0 clear to 1 solid. The amounts go into a tiny
   picture, one pixel a square with a solid border, which is stretched
   over the map with smoothing, so the fog thins out across a square
   instead of stopping at a hard edge. Off the map it is solid. */
var fogPicture = null;
export function drawSoftFog(ctx, d, view, amountAt){
  var w = d.w + 2, h = d.h + 2, s = view.scale;
  if(!fogPicture) fogPicture = document.createElement("canvas");
  if(fogPicture.width !== w) fogPicture.width = w;
  if(fogPicture.height !== h) fogPicture.height = h;
  var fctx = fogPicture.getContext("2d");
  var img = fctx.createImageData(w, h), px = img.data;
  for(var y = -1; y <= d.h; y++){
    for(var x = -1; x <= d.w; x++){
      var i = ((y + 1) * w + (x + 1)) * 4;
      var a = inMap(d, x, y) ? amountAt(x, y) : 1;
      px[i] = 13; px[i + 1] = 11; px[i + 2] = 18;   // MAP_COLORS.fog
      px[i + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
    }
  }
  fctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fogPicture, view.ox - s, view.oy - s, w * s, h * s);
  ctx.restore();
}

/* ---- The players' screen ----
   Drawn the same on the players' tab and in the DM's preview box. The
   view fits what has been shown, with a little fog around it, and never
   zooms closer than PLAYERS_MIN_SQUARES squares across. Once so much is
   shown that fitting it all would take more than PLAYERS_MAX_SQUARES
   squares across, the view follows the party instead (if there is one). */
var PLAYERS_PAD = 1.5;
var PLAYERS_MIN_SQUARES = 10;
var PLAYERS_MAX_SQUARES = 24;

/* Where to look on a width by height screen: { x, y } the middle in
   squares and { scale } pixels a square, or null if nothing is shown. */
export function playersFit(pmap, width, height){
  var b = pmap && revealedBounds(pmap);
  if(!b) return null;
  var bw = b.w + PLAYERS_PAD * 2, bh = b.h + PLAYERS_PAD * 2;
  var fit = {
    x: b.x + b.w / 2,
    y: b.y + b.h / 2,
    scale: Math.min(width / bw, height / bh, Math.min(width, height) / PLAYERS_MIN_SQUARES)
  };
  var close = Math.min(width, height) / PLAYERS_MAX_SQUARES;
  if(pmap.party && fit.scale < close) return { x: pmap.party.x + 0.5, y: pmap.party.y + 0.5, scale: close };
  return fit;
}

/* Draws the players' map (core playerView) looking at `cam` (in this
   canvas's pixels). `amountAt` can thicken the fog on squares that are
   fading in; by default seen squares are clear and the rest solid. */
export function drawPlayersScreen(ctx, pmap, cam, width, height, amountAt){
  var view = { scale: cam.scale, ox: width / 2 - cam.x * cam.scale, oy: height / 2 - cam.y * cam.scale, width: width, height: height };
  // Around the map and over all that is hidden is the same solid fog, so
  // the map's own edges never show.
  drawMap(ctx, pmap, view, { outside: MAP_COLORS.fog });
  drawSoftFog(ctx, pmap, view, amountAt || function(x, y){ return isSeen(pmap, x, y) ? 0 : 1; });
  if(pmap.party) drawParty(ctx, view, pmap.party);
}

/* The party's marker: a glowing gold token with a figure on it. */
export function drawParty(ctx, view, party){
  var s = view.scale;
  var cx = view.ox + (party.x + 0.5) * s, cy = view.oy + (party.y + 0.5) * s, r = Math.max(5, s * 0.38);
  ctx.save();
  ctx.shadowColor = "rgba(255,196,80,0.75)";
  ctx.shadowBlur = Math.max(6, s * 0.45);
  var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, "#ffe08a");
  g.addColorStop(1, "#c4851a");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#3a2406";
  ctx.lineWidth = Math.max(1.5, s * 0.06);
  ctx.stroke();
  if(r >= 8){
    // Head and shoulders, the shoulders cut off by the token's rim.
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#3a2406";
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.22, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.62, r * 0.5, r * 0.42, 0, Math.PI, 0);
    ctx.fill();
  }
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
  ctx.strokeStyle = C.hatch;
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.stroke();
  ctx.restore();
}

/* Cave rock: loose dots instead of hatching. */
function stipple(ctx, x, y, px, py, s){
  ctx.fillStyle = C.hatch;
  for(var i = 0; i < 7; i++){
    var r = Math.max(0.8, s * (0.025 + hash(x, y, 90 + i) * 0.035));
    ctx.beginPath();
    ctx.arc(px + s * hash(x, y, 100 + i), py + s * hash(x, y, 110 + i), r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* Leafy rock: small leaves at odd angles. */
function leaves(ctx, x, y, px, py, s){
  ctx.fillStyle = C.hatch;
  for(var i = 0; i < 5; i++){
    ctx.beginPath();
    ctx.ellipse(px + s * hash(x, y, 120 + i), py + s * hash(x, y, 130 + i), s * 0.11, s * 0.05, hash(x, y, 140 + i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* The floor detail of one plain floor square, by the style's `floor`. */
function floorDetail(ctx, x, y, px, py, s){
  var k;
  if(T.floor === "flecks"){
    // Earthen floors: a few flecks of dirt.
    ctx.fillStyle = C.floorDetail;
    for(k = 0; k < 3; k++){
      ctx.beginPath();
      ctx.arc(px + s * (0.15 + hash(x, y, 60 + k) * 0.7), py + s * (0.15 + hash(x, y, 70 + k) * 0.7), Math.max(0.8, s * 0.025), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if(T.floor === "planks"){
    // Three boards a square, each with a joint somewhere along it.
    ctx.strokeStyle = C.floorDetail;
    ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.beginPath();
    for(k = 1; k < 3; k++){ ctx.moveTo(px, py + s * k / 3); ctx.lineTo(px + s, py + s * k / 3); }
    for(k = 0; k < 3; k++){
      if(hash(x, y, 150 + k) < 0.45) continue;
      var jx = px + s * (0.15 + hash(x, y, 160 + k) * 0.7);
      ctx.moveTo(jx, py + s * k / 3);
      ctx.lineTo(jx, py + s * (k + 1) / 3);
    }
    ctx.stroke();
  } else if(T.floor === "cracks" || T.floor === "embers"){
    // A jagged crack across some squares: frost, or glowing embers.
    if(hash(x, y, 170) < (T.floor === "embers" ? 0.45 : 0.55)) return;
    var cx = px + s * (0.1 + hash(x, y, 171) * 0.3), cy = py + s * (0.2 + hash(x, y, 172) * 0.6);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for(k = 0; k < 3; k++){
      cx += s * (0.15 + hash(x, y, 180 + k) * 0.15);
      cy += s * (hash(x, y, 190 + k) - 0.5) * 0.35;
      ctx.lineTo(cx, Math.max(py + 2, Math.min(py + s - 2, cy)));
    }
    if(T.floor === "embers"){
      ctx.strokeStyle = "rgba(255,110,40,0.35)";
      ctx.lineWidth = Math.max(2, s * 0.09);
      ctx.stroke();
    }
    ctx.strokeStyle = C.floorDetail;
    ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.stroke();
  } else if(T.floor === "tufts"){
    // Grass and moss pushing up between the stones.
    ctx.strokeStyle = C.floorDetail;
    ctx.lineWidth = Math.max(1, s * 0.035);
    ctx.lineCap = "round";
    for(k = 0; k < 2; k++){
      if(hash(x, y, 200 + k) < 0.4) continue;
      var tx = px + s * (0.2 + hash(x, y, 210 + k) * 0.6), ty = py + s * (0.35 + hash(x, y, 220 + k) * 0.5);
      ctx.beginPath();
      for(var b = -1; b <= 1; b++){ ctx.moveTo(tx, ty); ctx.lineTo(tx + b * s * 0.07, ty - s * (0.13 + (b === 0 ? 0.05 : 0))); }
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  }
}

/* A door is a plank across the way through: upright for a corridor
   running left to right ("h"), flat for one running up and down. */
function drawDoor(ctx, b, axis){
  var long = b.s * 0.78, thick = Math.max(3, b.s * 0.26);
  var w = axis === "h" ? thick : long, h = axis === "h" ? long : thick;
  var x = b.x + (b.s - w) / 2, y = b.y + (b.s - h) / 2;
  ctx.fillStyle = C.door;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.doorEdge;
  ctx.lineWidth = Math.max(1, b.s * 0.05);
  ctx.strokeRect(x, y, w, h);
}

/* Only the DM sees a secret door: a dashed line and an S. */
function drawSecret(ctx, b, axis){
  var cx = b.x + b.s / 2, cy = b.y + b.s / 2, half = b.s * 0.4;
  ctx.save();
  ctx.strokeStyle = C.secret;
  ctx.lineWidth = Math.max(1.5, b.s * 0.08);
  ctx.setLineDash([Math.max(2, b.s * 0.12), Math.max(2, b.s * 0.08)]);
  ctx.beginPath();
  if(axis === "h"){ ctx.moveTo(cx, cy - half); ctx.lineTo(cx, cy + half); }
  else { ctx.moveTo(cx - half, cy); ctx.lineTo(cx + half, cy); }
  ctx.stroke();
  ctx.setLineDash([]);
  if(b.s >= 14){
    ctx.fillStyle = C.secret;
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
  ctx.strokeStyle = C.stairs;
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
  ctx.strokeStyle = C.waterLine;
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
  ctx.fillStyle = C.pit;
  ctx.fillRect(x, y, w, w);
  ctx.strokeStyle = C.pitEdge;
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
  ctx.fillStyle = C.rubble;
  ctx.strokeStyle = C.rubbleEdge;
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
export function drawSwatch(canvas, code, cssSize, outside, style){
  var c = prepareCanvas(canvas, cssSize, cssSize);
  var mini;
  if(code === "+" || code === "s" || code === ">") mini = { w: 3, h: 3, cells: "   ." + code + ".   " };
  else mini = { w: 3, h: 3, cells: "    " + code + "    " };
  mini.style = style;
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
