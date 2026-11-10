import {
  getDungeons, getDungeon, createDungeon, saveDungeon, deleteDungeon, duplicateDungeon, dungeonNameProblem,
  paintCells, fillRect, lineCells, clearDungeon, resizeDungeon, resizeLoses, createHistory, contentBounds, isBlank,
  DUNGEON_SIZES, MIN_SIDE, MAX_SIDE, FLOOR, ROCK
} from "../core/dungeons.js";
import { drawMap, drawSwatch, drawThumbnail, prepareCanvas, fitView } from "./dungeon-canvas.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { showActionToast } from "../ui/toast.js";
import { openBottomSheet } from "../ui/bottom-sheet.js";
import { playAdd, playDelete } from "../ui/sound.js";
import { makeKebabSvg, makeUndoSvg } from "../ui/svg-icons.js";

/* ---------------- Dungeons ----------------
   The DM's dungeon maps: terrain only, painted on a grid of 5 ft
   squares (js/core/dungeons.js). Two views in one full-page overlay,
   like Encounters: the saved list, and one map's board.

   On the board the DM picks a tool and drags on the map. Room drags out
   a box of floor, the brushes paint square by square (a quick stroke
   leaves an unbroken corridor), and walls appear by themselves where
   floor meets rock. Every finished drag is one undo step and is saved
   straight away.

   Getting around: the Move tool, a right or middle mouse drag, or
   holding Space drags the map; the wheel, a pinch or the zoom buttons
   zoom. A second finger on the map turns a stroke just begun into a
   pinch and takes the stroke back. Pointer events, so a finger and a
   mouse work the same. */

var SCALE_MIN = 6;      // CSS pixels per square
var SCALE_MAX = 96;
var FIT_MAX = 40;       // fitting never zooms in further than this

var ICON = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  room: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>'
};

/* The tool bar, in groups. A tool with `code` paints that terrain; Room
   fills a box with floor; Move only drags the map. */
var TOOLS = [
  [
    { id: "move", label: "Move", icon: "hand", help: "Drag to move around the map" }
  ],
  [
    { id: "room", label: "Room", icon: "room", help: "Drag a box to make a room" },
    { id: "floor", label: "Floor", code: FLOOR, help: "Paint floor square by square, for corridors and odd shapes" },
    { id: "erase", label: "Erase", icon: "eraser", code: ROCK, help: "Turn squares back into solid rock" }
  ],
  [
    { id: "door", label: "Door", code: "+", help: "Put a door in a corridor or a gap in a wall" },
    { id: "secret", label: "Secret", code: "s", help: "Secret door. Players will see a wall until you reveal it" },
    { id: "stairs", label: "Stairs", code: ">", help: "Stairs up or down" }
  ],
  [
    { id: "water", label: "Water", code: "~", help: "Water: a pool, a stream or a flooded floor" },
    { id: "pit", label: "Pit", code: "o", help: "A pit or a hole in the floor" },
    { id: "rubble", label: "Rubble", code: ":", help: "Rubble or broken ground (difficult terrain)" }
  ]
];
function toolById(id){
  for(var g = 0; g < TOOLS.length; g++) for(var i = 0; i < TOOLS[g].length; i++) if(TOOLS[g][i].id === id) return TOOLS[g][i];
  return TOOLS[1][0];
}

var overlay = null;
var openId = null;       // the map on the board, null = the list
var newSize = "medium";  // the size picked for a new map
var tool = "room";       // the tool picked, kept between maps
var b = null;            // the open board, see renderBoard()

function ce(tag, cls, text){
  var el = document.createElement(tag);
  if(cls) el.className = cls;
  if(text !== undefined) el.textContent = text;
  return el;
}

function button(cls, text, onClick, title){
  var btn = ce("button", cls, text);
  btn.type = "button";
  if(title){ btn.title = title; btn.setAttribute("aria-label", title); }
  btn.addEventListener("click", onClick);
  return btn;
}

function icon(name, cls){
  var span = ce("span", "dg-icon" + (cls ? " " + cls : ""));
  span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>';
  return span;
}

function cssVar(name, fallback){
  var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/* A ⋯ button with a small menu of [{label, danger, onClick}]. */
function menu(items, title){
  var wrap = ce("div", "dg-menu");
  var dropdown = ce("div", "catalog-row-dropdown");
  var btn = button("catalog-row-menu-btn", "", function(e){
    e.stopPropagation();
    var open = dropdown.classList.contains("open");
    closeMenus();
    if(!open) dropdown.classList.add("open");
  }, title || "More options");
  btn.innerHTML = makeKebabSvg();
  items.forEach(function(it){
    dropdown.appendChild(button("catalog-dropdown-item" + (it.danger ? " danger" : ""), it.label, function(e){
      e.stopPropagation();
      closeMenus();
      it.onClick();
    }));
  });
  wrap.appendChild(btn);
  wrap.appendChild(dropdown);
  return wrap;
}
function closeMenus(){
  if(overlay) overlay.querySelectorAll(".catalog-row-dropdown.open").forEach(function(d){ d.classList.remove("open"); });
}

/* ---- Shell ---- */
function ensureOverlay(){
  if(overlay) return;
  overlay = document.getElementById("dungeon-overlay");
  overlay.addEventListener("click", closeMenus);
}

export function openDungeons(){
  ensureOverlay();
  openId = null;
  overlay.classList.add("open");
  render();
}

function close(){
  leaveBoard();
  overlay.classList.remove("open");
  overlay.innerHTML = "";
  openId = null;
}

function render(){
  var d = openId ? getDungeon(openId) : null;
  if(!d) openId = null;
  leaveBoard();
  overlay.innerHTML = "";
  if(d) renderBoard(d); else renderList();
}

function header(onBack, backLabel){
  var head = ce("div", "dg-header");
  head.appendChild(button("dg-back", "←", onBack, backLabel));
  overlay.appendChild(head);
  return head;
}

/* ---- The saved list ---- */
function renderList(){
  var head = header(close, "Back");
  var badge = ce("span", "dg-badge");
  badge.appendChild(icon("map"));
  head.appendChild(badge);
  head.appendChild(ce("h2", "dg-title", "Dungeons"));

  var scroller = ce("div", "dg-scroll");
  var wrap = ce("div", "dg-wrap");
  scroller.appendChild(wrap);
  overlay.appendChild(scroller);

  // New dungeon
  var panel = ce("section", "dg-create");
  var top = ce("div", "dg-create-top");
  top.appendChild(icon("plus", "dg-create-icon"));
  var words = ce("div", "dg-create-words");
  words.appendChild(ce("h3", "dg-create-title", "New dungeon"));
  words.appendChild(ce("p", "dg-create-help", "Draw the rooms, corridors, doors and water of a dungeon on a grid of 5 foot squares. Walls appear by themselves. It saves as you go."));
  top.appendChild(words);
  panel.appendChild(top);

  var form = ce("form", "dg-new");
  var input = ce("input", "dg-input");
  input.type = "text";
  input.placeholder = "Name it, e.g. Sunken crypt";
  input.setAttribute("aria-label", "New dungeon name");
  input.maxLength = 60;
  form.appendChild(input);

  var sizes = ce("div", "dg-sizes");
  sizes.setAttribute("role", "radiogroup");
  sizes.setAttribute("aria-label", "Map size");
  DUNGEON_SIZES.forEach(function(s){
    var chip = button("dg-size" + (s.id === newSize ? " on" : ""), "", function(){
      newSize = s.id;
      sizes.querySelectorAll(".dg-size").forEach(function(c){
        var on = c.dataset.size === s.id;
        c.classList.toggle("on", on);
        c.setAttribute("aria-checked", on ? "true" : "false");
      });
    });
    chip.dataset.size = s.id;
    chip.setAttribute("role", "radio");
    chip.setAttribute("aria-checked", s.id === newSize ? "true" : "false");
    chip.appendChild(ce("span", "dg-size-name", s.label));
    chip.appendChild(ce("span", "dg-size-dims", s.w + " × " + s.h));
    sizes.appendChild(chip);
  });
  form.appendChild(sizes);

  var create = ce("button", "btn primary", "Create");
  create.type = "submit";
  form.appendChild(create);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var problem = dungeonNameProblem(input.value, null);
    if(problem){ showActionToast(problem, true); input.focus(); return; }
    var d = createDungeon(input.value.trim(), newSize);
    playAdd();
    tool = "room";
    openId = d.id;
    render();
  });
  panel.appendChild(form);
  wrap.appendChild(panel);

  var all = getDungeons();
  if(!all.length){
    var empty = ce("div", "dg-empty");
    var big = ce("span", "dg-badge big");
    big.appendChild(icon("map"));
    empty.appendChild(big);
    empty.appendChild(ce("div", "dg-empty-title", "No dungeons yet"));
    empty.appendChild(ce("div", "dg-empty-text", "Name your first one above and start drawing."));
    wrap.appendChild(empty);
    return;
  }

  var label = ce("div", "dg-section-label");
  label.appendChild(ce("span", "", "Your dungeons"));
  label.appendChild(ce("span", "dg-count", String(all.length)));
  wrap.appendChild(label);

  var grid = ce("div", "dg-saved-list");
  var thumbs = [];
  all.forEach(function(d){
    var card = savedCard(d);
    grid.appendChild(card);
    thumbs.push({ canvas: card.querySelector(".dg-thumb"), d: d });
  });
  wrap.appendChild(grid);
  // Drawn once the cards have their width.
  requestAnimationFrame(function(){
    var outside = cssVar("--field-bg", "#171225");
    thumbs.forEach(function(t){
      if(t.canvas.isConnected) drawThumbnail(t.canvas, t.d, t.canvas.clientWidth, t.canvas.clientHeight, outside);
    });
  });
}

function savedCard(d){
  var card = ce("div", "dg-saved");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "Open " + d.name);

  var thumb = ce("canvas", "dg-thumb");
  thumb.setAttribute("aria-hidden", "true");
  card.appendChild(thumb);

  var top = ce("div", "dg-saved-top");
  top.appendChild(ce("div", "dg-saved-name", d.name));
  top.appendChild(menu([
    { label: "Duplicate", onClick: function(){
      var copy = duplicateDungeon(d.id);
      playAdd();
      showActionToast("Made " + copy.name + ".");
      render();
    } },
    { label: "Delete", danger: true, onClick: function(){
      confirmDialog("Delete " + d.name + "?", "This map will be removed. This cannot be undone.", function(){
        deleteDungeon(d.id);
        playDelete();
        render();
        showActionToast("Deleted " + d.name + ".");
      });
    } }
  ], "Options for " + d.name));
  card.appendChild(top);

  var foot = ce("div", "dg-saved-foot");
  foot.appendChild(stat("grid", d.w + " × " + d.h + " squares"));
  foot.appendChild(stat("clock", timeAgo(d.updated), "dg-when"));
  foot.appendChild(icon("chevron", "dg-go"));
  card.appendChild(foot);

  function open(){ openId = d.id; render(); }
  card.addEventListener("click", function(e){ if(!e.target.closest(".dg-menu")) open(); });
  card.addEventListener("keydown", function(e){ if((e.key === "Enter" || e.key === " ") && e.target === card){ e.preventDefault(); open(); } });
  return card;
}

function stat(iconName, text, cls){
  var s = ce("span", "dg-stat" + (cls ? " " + cls : ""));
  s.appendChild(icon(iconName));
  s.appendChild(document.createTextNode(text));
  return s;
}

/* "Edited just now", "5 min ago", "3 h ago", "yesterday", "Oct 3". */
function timeAgo(t){
  var mins = Math.floor((Date.now() - t) / 60000);
  if(mins < 1) return "Edited just now";
  if(mins < 60) return "Edited " + mins + " min ago";
  var hours = Math.floor(mins / 60);
  if(hours < 24) return "Edited " + hours + " h ago";
  if(hours < 48) return "Edited yesterday";
  return "Edited " + new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---- One map's board ----
   `b` holds the open board:
     d: the dungeon, history: its undo steps,
     view: { scale, ox, oy } in CSS pixels (see dungeon-canvas.js),
     pointers: the fingers or mouse down on the map, by pointer id,
     gesture: the drag in progress ({type: "paint" | "room" | "pan" |
       "pinch" | "done", ...}), hover: the square under the mouse. */
function renderBoard(d){
  b = {
    d: d, history: createHistory(), view: null, pointers: new Map(), gesture: null,
    hover: null, space: false, frame: 0, fitted: false
  };

  var head = header(function(){ openId = null; render(); }, "Back to dungeons");
  var name = ce("input", "dg-name-input");
  name.type = "text";
  name.value = d.name;
  name.maxLength = 60;
  name.setAttribute("aria-label", "Dungeon name");
  name.addEventListener("keydown", function(e){ if(e.key === "Enter") name.blur(); });
  name.addEventListener("change", function(){
    var problem = dungeonNameProblem(name.value, d.id);
    if(problem){ showActionToast(problem, true); name.value = d.name; return; }
    d.name = name.value.trim();
    saveDungeon(d);
  });
  head.appendChild(name);

  b.undoBtn = button("dg-head-btn", "", undo, "Undo");
  b.undoBtn.innerHTML = makeUndoSvg();
  b.redoBtn = button("dg-head-btn dg-redo", "", redo, "Redo");
  b.redoBtn.innerHTML = makeUndoSvg();
  head.appendChild(b.undoBtn);
  head.appendChild(b.redoBtn);
  head.appendChild(menu([
    { label: "Map size", onClick: openSizeSheet },
    { label: "Clear map", danger: true, onClick: function(){
      if(isBlank(d)){ showActionToast("The map is already empty."); return; }
      confirmDialog("Clear the whole map?", "Every square goes back to solid rock. You can undo this.", function(){
        change(function(){ return clearDungeon(d); });
      });
    } }
  ], "Map options"));

  overlay.appendChild(toolBar());

  var stage = ce("div", "dg-stage");
  var canvas = ce("canvas", "dg-canvas");
  canvas.setAttribute("aria-label", "Dungeon map");
  stage.appendChild(canvas);
  b.hint = ce("div", "dg-hint", "Pick Room, then drag on the grid to draw your first room.");
  stage.appendChild(b.hint);

  var zoom = ce("div", "dg-zoom");
  var zin = button("dg-zoom-btn", "", function(){ zoomBy(1.25); }, "Zoom in");
  zin.appendChild(icon("plus"));
  var zfit = button("dg-zoom-btn", "", function(){ fit(); draw(); }, "Fit the map to the screen");
  zfit.appendChild(icon("fit"));
  var zout = button("dg-zoom-btn", "", function(){ zoomBy(0.8); }, "Zoom out");
  zout.appendChild(icon("minus"));
  zoom.appendChild(zin);
  zoom.appendChild(zfit);
  zoom.appendChild(zout);
  stage.appendChild(zoom);
  overlay.appendChild(stage);

  b.stage = stage;
  b.canvas = canvas;
  setupInput(canvas);
  b.resize = new ResizeObserver(function(){
    if(!b.fitted && stage.clientWidth){ fit(); b.fitted = true; }
    draw();
  });
  b.resize.observe(stage);
  b.onKey = onKey;
  b.onKeyUp = onKeyUp;
  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", onKeyUp);
  refreshChrome();
}

/* Undoes what renderBoard() set up, when the board is left or closed. */
function leaveBoard(){
  if(!b) return;
  if(b.resize) b.resize.disconnect();
  if(b.frame) cancelAnimationFrame(b.frame);
  document.removeEventListener("keydown", b.onKey);
  document.removeEventListener("keyup", b.onKeyUp);
  b = null;
}

function toolBar(){
  var bar = ce("div", "dg-tools");
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Map tools");
  var outside = cssVar("--parchment", "#241d33");
  TOOLS.forEach(function(group, gi){
    if(gi) bar.appendChild(ce("span", "dg-tool-gap"));
    group.forEach(function(t){
      var btn = button("dg-tool" + (t.id === tool ? " on" : ""), "", function(){ pickTool(t.id); }, t.label + ": " + t.help);
      btn.dataset.tool = t.id;
      btn.setAttribute("aria-pressed", t.id === tool ? "true" : "false");
      if(t.icon) btn.appendChild(icon(t.icon, "dg-tool-pic"));
      else {
        var sw = ce("canvas", "dg-tool-pic dg-swatch");
        sw.setAttribute("aria-hidden", "true");
        btn.appendChild(sw);
        drawSwatch(sw, t.code, 26, outside);
      }
      btn.appendChild(ce("span", "dg-tool-label", t.label));
      bar.appendChild(btn);
    });
  });
  return bar;
}

function pickTool(id){
  tool = id;
  overlay.querySelectorAll(".dg-tool").forEach(function(btn){
    var on = btn.dataset.tool === id;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  b.hover = null;
  refreshChrome();
  draw();
}

/* Undo and redo buttons, the hint on a blank map, the map's cursor. */
function refreshChrome(){
  if(!b) return;
  b.undoBtn.disabled = !b.history.canUndo();
  b.redoBtn.disabled = !b.history.canRedo();
  b.hint.hidden = !isBlank(b.d);
  var panning = b.gesture && b.gesture.type === "pan";
  b.canvas.style.cursor = panning ? "grabbing" : (tool === "move" || b.space ? "grab" : "crosshair");
}

/* Runs `fn`, which changes the map and returns true if it did. A real
   change becomes one undo step and is saved. */
function change(fn){
  var before = b.history.snapshot(b.d);
  if(!fn()) return false;
  b.history.record(before);
  saveDungeon(b.d);
  refreshChrome();
  draw();
  return true;
}

/* Ends a brush stroke that already changed the map as it went. */
function finishStroke(before){
  if(before.cells === b.d.cells) return;
  b.history.record(before);
  saveDungeon(b.d);
  refreshChrome();
}

function undo(){
  if(!b || !b.history.undo(b.d)) return;
  saveDungeon(b.d);
  refreshChrome();
  draw();
}
function redo(){
  if(!b || !b.history.redo(b.d)) return;
  saveDungeon(b.d);
  refreshChrome();
  draw();
}

/* ---- View: zoom and fit ---- */
function stageSize(){ return { w: b.stage.clientWidth, h: b.stage.clientHeight }; }

/* The painted part with two squares of rock around it, or the whole map
   while it is blank. */
function fit(){
  var size = stageSize();
  if(!size.w || !size.h) return;
  var c = contentBounds(b.d);
  var box = c ? { x: c.x - 2, y: c.y - 2, w: c.w + 4, h: c.h + 4 } : { x: 0, y: 0, w: b.d.w, h: b.d.h };
  var v = fitView(box, size.w, size.h, 16);
  var scale = Math.max(SCALE_MIN, Math.min(FIT_MAX, v.scale));
  b.view = {
    scale: scale,
    ox: size.w / 2 - (box.x + box.w / 2) * scale,
    oy: size.h / 2 - (box.y + box.h / 2) * scale
  };
}

/* Zooms by `factor` keeping the point (px, py) on screen where it is. */
function zoomAt(px, py, factor){
  var v = b.view;
  var scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, v.scale * factor));
  var k = scale / v.scale;
  v.ox = px - (px - v.ox) * k;
  v.oy = py - (py - v.oy) * k;
  v.scale = scale;
}
function zoomBy(factor){
  var size = stageSize();
  zoomAt(size.w / 2, size.h / 2, factor);
  draw();
}

/* ---- Drawing ---- */
function draw(){
  if(!b || b.frame) return;
  b.frame = requestAnimationFrame(function(){
    if(!b) return;
    b.frame = 0;
    paint();
  });
}

function paint(){
  var size = stageSize();
  if(!size.w || !size.h || !b.view) return;
  var c = prepareCanvas(b.canvas, size.w, size.h);
  var dpr = c.dpr, v = b.view;
  var view = { scale: v.scale * dpr, ox: v.ox * dpr, oy: v.oy * dpr, width: c.width, height: c.height };
  drawMap(c.ctx, b.d, view, { outside: cssVar("--ink-deep", "#120f1a"), grid: true, dm: true });

  var accent = cssVar("--brass", "#8b5cf6");
  var ctx = c.ctx;
  function sx(x){ return Math.round(view.ox + x * view.scale); }
  function sy(y){ return Math.round(view.oy + y * view.scale); }

  // The box a Room drag will fill, with its size in feet.
  var g = b.gesture;
  if(g && g.type === "room"){
    var x0 = Math.max(0, Math.min(g.a[0], g.b[0])), x1 = Math.min(b.d.w - 1, Math.max(g.a[0], g.b[0]));
    var y0 = Math.max(0, Math.min(g.a[1], g.b[1])), y1 = Math.min(b.d.h - 1, Math.max(g.a[1], g.b[1]));
    if(x1 >= x0 && y1 >= y0){
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.28;
      ctx.fillRect(sx(x0), sy(y0), sx(x1 + 1) - sx(x0), sy(y1 + 1) - sy(y0));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(sx(x0), sy(y0), sx(x1 + 1) - sx(x0), sy(y1 + 1) - sy(y0));
      var label = (x1 - x0 + 1) * 5 + " × " + (y1 - y0 + 1) * 5 + " ft";
      ctx.font = "600 " + Math.round(12 * dpr) + "px -apple-system, 'Segoe UI', Roboto, sans-serif";
      var tw = ctx.measureText(label).width + 12 * dpr, th = 20 * dpr;
      var lx = sx(x0), ly = sy(y0) - th - 4 * dpr;
      if(ly < 0) ly = sy(y1 + 1) + 4 * dpr;
      ctx.fillStyle = "rgba(15,12,20,0.85)";
      ctx.fillRect(lx, ly, tw, th);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(label, lx + 6 * dpr, ly + th / 2);
      ctx.restore();
    }
  }

  // The square a brush would paint, under the mouse.
  if(b.hover && !g && toolById(tool).code !== undefined && !b.space){
    var h = b.hover;
    if(h[0] >= 0 && h[1] >= 0 && h[0] < b.d.w && h[1] < b.d.h){
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(sx(h[0]) + dpr, sy(h[1]) + dpr, sx(h[0] + 1) - sx(h[0]) - 2 * dpr, sy(h[1] + 1) - sy(h[1]) - 2 * dpr);
      ctx.restore();
    }
  }
}

/* ---- Input ---- */
function point(e){
  var r = b.canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function squareAt(p){
  return [Math.floor((p.x - b.view.ox) / b.view.scale), Math.floor((p.y - b.view.oy) / b.view.scale)];
}
function sameSquare(a, c){ return a && c && a[0] === c[0] && a[1] === c[1]; }

function setupInput(canvas){
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", function(e){
    if(e.pointerType === "mouse" && b && b.hover){ b.hover = null; draw(); }
  });
  canvas.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  canvas.addEventListener("wheel", function(e){
    if(!b || !b.view) return;
    e.preventDefault();
    var p = point(e);
    var step = e.deltaMode === 1 ? 0.05 : 0.0015;
    zoomAt(p.x, p.y, Math.exp(-e.deltaY * step));
    draw();
  }, { passive: false });
}

function onDown(e){
  if(!b || !b.view) return;
  if(e.pointerType === "mouse" && e.button > 2) return;
  b.canvas.setPointerCapture(e.pointerId);
  var p = point(e);
  b.pointers.set(e.pointerId, p);

  if(b.pointers.size === 2){
    // A second finger: whatever the first began becomes a pinch.
    var g = b.gesture;
    if(g && g.type === "paint" && g.before.cells !== b.d.cells){ b.d.cells = g.before.cells; }
    startPinch();
    draw();
    return;
  }
  if(b.pointers.size > 2) return;

  var mouseDrag = e.pointerType === "mouse" && (e.button === 1 || e.button === 2);
  var t = toolById(tool);
  if(mouseDrag || t.id === "move" || b.space){
    b.gesture = { type: "pan", last: p };
  } else if(t.id === "room"){
    var sq = squareAt(p);
    b.gesture = { type: "room", a: sq, b: sq };
  } else {
    var start = squareAt(p);
    b.gesture = { type: "paint", code: t.code, last: start, before: b.history.snapshot(b.d) };
    paintCells(b.d, [start], t.code);
  }
  refreshChrome();
  draw();
}

function startPinch(){
  var pts = Array.from(b.pointers.values());
  b.gesture = { type: "pinch", mid: midpoint(pts), dist: distance(pts) };
}
function midpoint(pts){ return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }; }
function distance(pts){ return Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)); }

function onMove(e){
  if(!b || !b.view) return;
  var p = point(e);
  if(!b.pointers.has(e.pointerId)){
    // A mouse moving with no button down: show the square under it.
    if(e.pointerType === "mouse"){
      var sq = squareAt(p);
      if(!sameSquare(sq, b.hover)){ b.hover = sq; draw(); }
    }
    return;
  }
  b.pointers.set(e.pointerId, p);
  var g = b.gesture;
  if(!g) return;

  if(g.type === "pinch" && b.pointers.size >= 2){
    var pts = Array.from(b.pointers.values()).slice(0, 2);
    var mid = midpoint(pts), dist = distance(pts);
    b.view.ox += mid.x - g.mid.x;
    b.view.oy += mid.y - g.mid.y;
    zoomAt(mid.x, mid.y, dist / g.dist);
    g.mid = mid;
    g.dist = dist;
    draw();
  } else if(g.type === "pan"){
    b.view.ox += p.x - g.last.x;
    b.view.oy += p.y - g.last.y;
    g.last = p;
    draw();
  } else if(g.type === "paint"){
    var to = squareAt(p);
    if(sameSquare(to, g.last)) return;
    paintCells(b.d, lineCells(g.last[0], g.last[1], to[0], to[1]), g.code);
    g.last = to;
    b.hover = to;
    refreshChrome();
    draw();
  } else if(g.type === "room"){
    var c = squareAt(p);
    if(sameSquare(c, g.b)) return;
    g.b = c;
    draw();
  }
}

function onUp(e){
  if(!b || !b.pointers.has(e.pointerId)) return;
  b.pointers.delete(e.pointerId);
  var g = b.gesture;
  if(g && g.type === "paint") finishStroke(g.before);
  else if(g && g.type === "room"){
    var a = g.a, c = g.b;
    b.gesture = null;
    change(function(){ return fillRect(b.d, a[0], a[1], c[0], c[1], FLOOR); });
  }
  // After a pinch the finger still down does nothing until it lifts.
  b.gesture = b.pointers.size ? { type: "done" } : null;
  refreshChrome();
  draw();
}

/* Ctrl+Z undoes, Ctrl+Shift+Z or Ctrl+Y redoes, holding Space drags. */
function onKey(e){
  if(!b) return;
  var typing = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
  if(typing || document.querySelector("#bottom-sheet.open, #confirm-modal.open")) return;
  var key = e.key.toLowerCase();
  if((e.ctrlKey || e.metaKey) && key === "z"){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); }
  else if((e.ctrlKey || e.metaKey) && key === "y"){ e.preventDefault(); redo(); }
  else if(e.key === " " && !b.space){ e.preventDefault(); b.space = true; refreshChrome(); draw(); }
}
function onKeyUp(e){
  if(b && e.key === " "){ b.space = false; refreshChrome(); draw(); }
}

/* ---- Map size ---- */
function openSizeSheet(){
  var d = b.d;
  var want = { w: d.w, h: d.h };
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Map size"));
    body.appendChild(ce("p", "dg-sheet-help", "Each square is 5 feet. Growing the map adds rock on every side, so what you drew stays in the middle."));

    var presets = ce("div", "dg-sizes");
    DUNGEON_SIZES.forEach(function(s){
      var on = s.w === want.w && s.h === want.h;
      var chip = button("dg-size" + (on ? " on" : ""), "", function(){ want.w = s.w; want.h = s.h; refresh(); });
      chip.appendChild(ce("span", "dg-size-name", s.label));
      chip.appendChild(ce("span", "dg-size-dims", s.w + " × " + s.h));
      presets.appendChild(chip);
    });
    body.appendChild(presets);

    body.appendChild(sideRow("Width", "w"));
    body.appendChild(sideRow("Height", "h"));

    var actions = ce("div", "dg-sheet-actions");
    actions.appendChild(button("btn ghost", "Cancel", closeSheet));
    var apply = button("btn primary", "Apply", function(){
      closeSheet();
      if(want.w === d.w && want.h === d.h) return;
      function go(){
        if(!b || b.d !== d) return;
        change(function(){ return resizeDungeon(d, want.w, want.h); });
        fit();
        draw();
      }
      if(resizeLoses(d, want.w, want.h)){
        confirmDialog("Cut off part of the map?", "Some of what you drew is outside the new size and will be removed. You can undo this.", go);
      } else go();
    });
    actions.appendChild(apply);
    body.appendChild(actions);

    function sideRow(label, key){
      var row = ce("div", "dg-side-row");
      row.appendChild(ce("span", "dg-side-label", label));
      var minus = button("dg-step", "", function(){ set(want[key] - 1); }, "Smaller");
      minus.appendChild(icon("minus"));
      var input = ce("input", "dg-side-input");
      input.type = "number";
      input.inputMode = "numeric";
      input.min = String(MIN_SIDE);
      input.max = String(MAX_SIDE);
      input.value = String(want[key]);
      input.setAttribute("aria-label", label + " in squares");
      input.addEventListener("change", function(){ set(parseInt(input.value, 10)); });
      var plus = button("dg-step", "", function(){ set(want[key] + 1); }, "Bigger");
      plus.appendChild(icon("plus"));
      row.appendChild(minus);
      row.appendChild(input);
      row.appendChild(plus);
      row.appendChild(ce("span", "dg-side-feet", want[key] * 5 + " ft"));
      function set(n){
        if(isNaN(n)) n = want[key];
        want[key] = Math.max(MIN_SIDE, Math.min(MAX_SIDE, n));
        refresh();
      }
      return row;
    }
  });
}
