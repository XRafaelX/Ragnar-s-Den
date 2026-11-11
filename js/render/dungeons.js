import {
  getDungeons, getDungeon, createDungeon, saveDungeon, deleteDungeon, duplicateDungeon, dungeonNameProblem,
  paintCells, fillRect, lineCells, clearDungeon, resizeDungeon, resizeLoses, createHistory, contentBounds, isBlank,
  isRevealed, setRevealed, revealAll, anyRevealed, areaAt, toggleArea, playerView, setDungeonStyle,
  placeParty, walkParty, removeParty, addMap, removeMap, moveMap, placeMap, renameMap, setSight, toggleDoor, isDoor,
  noteAt, addNote, setNoteText, moveNote, removeNote, notesInOrder, cellAt, linkAt, linkStairs, arrivalSquare,
  revealedBounds, mapTitle, isLit, setLit, toggleLitArea, isLocked, lockedAhead, generateMap, createRandomDungeon,
  SIGHT_OPTIONS, SIGHT_MAX,
  DUNGEON_SIZES, DUNGEON_STYLES, MIN_SIDE, MAX_SIDE, FLOOR, ROCK
} from "../core/dungeons.js";
import { drawMap, drawFog, drawSwatch, drawThumbnail, prepareCanvas, fitView, drawPlayersScreen, playersFit, drawParty, drawPing, PING_MS, MAP_COLORS, rockColor } from "./dungeon-canvas.js";
import { presentDungeon, publishDungeon, presentedId, stopPresenting, pointAt, isPaused, setPaused } from "../core/dungeon-sync.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { showActionToast } from "../ui/toast.js";
import { openBottomSheet } from "../ui/bottom-sheet.js";
import { playAdd, playDelete } from "../ui/sound.js";
import { makeKebabSvg, makeUndoSvg, makeDiceSvg } from "../ui/svg-icons.js";

/* ---------------- Dungeons ----------------
   The DM's dungeon maps: terrain only, painted on a grid of 5 ft
   squares (js/core/dungeons.js). Two views in one full-page overlay,
   like Encounters: the saved list, and one map's board.

   The board has two modes, switched at the start of the tool bar.
   Build is for drawing the map. Play is for running it: everything the
   players haven't been shown is under fog (dimmed for the DM), a tap
   on a room or corridor shows it or hides it again (core areaAt), and
   a drag shows or hides square by square, depending on whether the
   first square was hidden. The Party tool puts the party's marker on a
   square, and dragging it walks them there square by square, showing
   what they see on the way (core sightFrom). The tool bar keeps its size and place in
   both modes; only the tools in it change, fading in place.

   Player view opens the players' screen (dungeon-view.html) in a new
   tab with this map on it, and every change is sent there as it
   happens (js/core/dungeon-sync.js). While it does, Play mode shows a
   small box in the corner with exactly what the players see.

   In Build the DM picks a tool and drags on the map. Room drags out
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
var FOG_DM = 0.62;      // how thick the fog looks to the DM

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
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',
  note: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  point: '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
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
    { id: "locked", label: "Locked", code: "l", help: "A locked door. The party can't walk through it until you unlock it in Play with the Doors tool. Players see an ordinary door" },
    { id: "secret", label: "Secret", code: "s", help: "Secret door. Players will see a wall until you reveal it" },
    { id: "stairs", label: "Stairs", code: ">", help: "Stairs up or down. Tap stairs you have drawn to choose which map of the dungeon they lead to" }
  ],
  [
    { id: "water", label: "Water", code: "~", help: "Water: a pool, a stream or a flooded floor" },
    { id: "pit", label: "Pit", code: "o", help: "A pit or a hole in the floor" },
    { id: "rubble", label: "Rubble", code: ":", help: "Rubble or broken ground (difficult terrain)" }
  ],
  [
    { id: "light", label: "Light", icon: "sun", help: "Tap a room to light it, or drag to light square by square. The party sees lit ground from any distance. Tap a lit room again to darken it" },
    { id: "note", label: "Note", icon: "note", help: "Tap a square to add a numbered note only you can see. Tap a number to read or change it, drag it to move it" }
  ]
];
function toolById(id){
  for(var g = 0; g < TOOLS.length; g++) for(var i = 0; i < TOOLS[g].length; i++) if(TOOLS[g][i].id === id) return TOOLS[g][i];
  return TOOLS[1][0];
}

/* Play mode's tools. Show all and Hide all are buttons, not tools. */
var PLAY_TOOLS = [
  { id: "move", label: "Move", icon: "hand", help: "Drag to move around the map" },
  { id: "reveal", label: "Reveal", icon: "eye", help: "Tap a room or corridor to show it to the players, and tap again to hide it. Drag to show or hide square by square" },
  { id: "party", label: "Party", icon: "users", help: "Tap a square to put the party there. Drag the marker to walk them, and the fog clears as far as they can see. Set how far in the menu, under Party sight" },
  { id: "doors", label: "Doors", icon: "door", help: "Tap a door to open or close it. The party sees through open doors, and opens a closed door they walk onto. A secret door opens as a found door" },
  { id: "point", label: "Point", icon: "point", help: "Tap a spot to point at it on the players' screen. Drag to point like a laser pointer" }
];

var overlay = null;
var openId = null;       // the dungeon on the board, null = the list
var lastMap = {};        // dungeon id -> the map last open in it
var newSize = "medium";  // the size picked for a new map
var rollRooms = "some";  // how many rooms Random map asks for
var tool = "room";       // the Build tool picked, kept between maps
var playTool = "reveal"; // the Play tool picked
var mode = "build";      // "build" or "play", kept between maps
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
    mode = "build";
    openId = d.id;
    render();
  });
  panel.appendChild(form);

  // A whole random dungeon, to start from or to try things on.
  var roll = button("btn ghost dg-roll", "", function(){
    var dg = createRandomDungeon(newSize);
    playAdd();
    tool = "room";
    mode = "build";
    openId = dg.id;
    render();
    showActionToast("Rolled " + dg.name + ": two levels joined by stairs, with doors, light and a few notes.");
  }, "Roll a random dungeon at the size picked");
  roll.innerHTML = makeDiceSvg();
  roll.appendChild(document.createTextNode("Roll a random dungeon"));
  panel.appendChild(roll);
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
    thumbs.push({ canvas: card.querySelector(".dg-thumb"), d: d.maps[0] });
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
      confirmDialog("Delete " + d.name + "?", (d.maps.length > 1 ? "This dungeon and its " + d.maps.length + " maps will be removed." : "This dungeon and its map will be removed.") + " This cannot be undone.", function(){
        deleteDungeon(d.id);
        stopPresenting(d.maps.map(function(m){ return m.id; }));
        playDelete();
        render();
        showActionToast("Deleted " + d.name + ".");
      });
    } }
  ], "Options for " + d.name));
  card.appendChild(top);

  var foot = ce("div", "dg-saved-foot");
  foot.appendChild(stat("grid", d.maps.length === 1 ? "1 map" : d.maps.length + " maps"));
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

/* ---- One dungeon's board ----
   The board shows one of the dungeon's maps at a time. The arrows at the
   bottom (or the Left and Right keys) step to the map before or after,
   like slides, and the players' screen follows if it shows this dungeon.
   `b` holds the open board:
     dungeon: the dungeon, d: the map shown, history: that map's undo
       steps (histories and views keep each map's, so stepping away and
       back keeps undo and where the DM was looking),
     view: { scale, ox, oy } in CSS pixels (see dungeon-canvas.js),
     pointers: the fingers or mouse down on the map, by pointer id,
     gesture: the drag in progress ({type: "paint" | "room" | "pan" |
       "pinch" | "done", ...}), hover: the square under the mouse. */
function renderBoard(dungeon){
  var first = dungeon.maps.find(function(m){ return m.id === lastMap[dungeon.id]; }) || dungeon.maps[0];
  b = {
    dungeon: dungeon, d: first, histories: {}, views: {}, history: null, view: null, pointers: new Map(), gesture: null,
    hover: null, hoverArea: null, space: false, frame: 0, fitted: false
  };
  b.history = b.histories[first.id] = createHistory();
  lastMap[dungeon.id] = first.id;

  var head = header(function(){ openId = null; render(); }, "Back to dungeons");
  var name = ce("input", "dg-name-input");
  name.type = "text";
  name.value = dungeon.name;
  name.maxLength = 60;
  name.setAttribute("aria-label", "Dungeon name");
  name.addEventListener("keydown", function(e){ if(e.key === "Enter") name.blur(); });
  name.addEventListener("change", function(){
    var problem = dungeonNameProblem(name.value, dungeon.id);
    if(problem){ showActionToast(problem, true); name.value = dungeon.name; return; }
    dungeon.name = name.value.trim();
    saveDungeon(dungeon);
    publish();
  });
  head.appendChild(name);

  b.playersBtn = button("dg-players", "", openPlayerView, null);
  b.playersBtn.appendChild(icon("monitor"));
  b.playersBtn.appendChild(ce("span", "dg-players-label", "Player view"));
  head.appendChild(b.playersBtn);

  // Pause covers the players' screen; there from the start (off until
  // Player view is open), so the header never shifts.
  b.pauseBtn = button("dg-pause", "", togglePause, null);
  b.pauseIcon = ce("span", "dg-icon");
  b.pauseLabel = ce("span", "dg-players-label");
  b.pauseBtn.appendChild(b.pauseIcon);
  b.pauseBtn.appendChild(b.pauseLabel);
  head.appendChild(b.pauseBtn);

  b.undoBtn = button("dg-head-btn", "", undo, "Undo");
  b.undoBtn.innerHTML = makeUndoSvg();
  b.redoBtn = button("dg-head-btn dg-redo", "", redo, "Redo");
  b.redoBtn.innerHTML = makeUndoSvg();
  head.appendChild(b.undoBtn);
  head.appendChild(b.redoBtn);
  head.appendChild(menu([
    { label: "Maps in this dungeon", onClick: openMapsSheet },
    { label: "Random map", onClick: openRandomSheet },
    { label: "Map size", onClick: openSizeSheet },
    { label: "Map style", onClick: openStyleSheet },
    { label: "Save as picture", onClick: openPictureSheet },
    { label: "Room notes", onClick: openNotesList },
    { label: "Party sight", onClick: openSightSheet },
    { label: "Remove party marker", onClick: function(){
      if(!change(function(){ return removeParty(b.d); })) showActionToast("There is no party marker on this map.");
    } },
    { label: "Clear map", danger: true, onClick: function(){
      if(isBlank(b.d) && !b.d.notes.length){ showActionToast("The map is already empty."); return; }
      var m = b.d;
      confirmDialog("Clear the whole map?", "Every square of " + m.name + " goes back to solid rock. You can undo this.", function(){
        if(b && b.d === m) change(function(){ return clearDungeon(m); });
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

  // What the players see, while their tab shows this map in Play.
  b.preview = ce("div", "dg-preview");
  b.preview.setAttribute("aria-hidden", "true");
  b.previewCanvas = ce("canvas", "dg-preview-canvas");
  b.preview.appendChild(b.previewCanvas);
  b.preview.appendChild(ce("span", "dg-preview-label", "Players see"));
  stage.appendChild(b.preview);

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

  // The dungeon's maps, one after another like slides.
  var pager = ce("div", "dg-pager");
  b.prevBtn = button("dg-page-btn", "", function(){ stepMap(-1); }, "Previous map");
  b.prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  b.pageLabel = button("dg-page-label", "", openMapsSheet, "Maps in this dungeon");
  b.pageName = ce("span", "dg-page-name");
  b.pageCount = ce("span", "dg-page-count");
  b.pageLabel.appendChild(b.pageName);
  b.pageLabel.appendChild(b.pageCount);
  b.nextBtn = button("dg-page-btn", "", function(){ stepMap(1); }, "Next map");
  pager.appendChild(b.prevBtn);
  pager.appendChild(b.pageLabel);
  pager.appendChild(b.nextBtn);
  stage.appendChild(pager);
  overlay.appendChild(stage);

  b.stage = stage;
  b.canvas = canvas;
  setupInput(canvas);
  // When the board changes size (a window resized, a phone turned), the
  // middle of the view stays in the middle.
  var size = { w: 0, h: 0 };
  b.resize = new ResizeObserver(function(){
    if(!b) return;
    var w = stage.clientWidth, h = stage.clientHeight;
    if(!b.fitted && w){ fit(); b.fitted = true; }
    else if(b.view && size.w && w){
      b.view.ox += (w - size.w) / 2;
      b.view.oy += (h - size.h) / 2;
    }
    size = { w: w, h: h };
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

/* The Build / Play switch, then the tools of the mode picked. Both
   modes' tools sit in the same spot, one faded out, so switching never
   moves anything else on the screen. */
function toolBar(){
  var bar = ce("div", "dg-tools");
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Map tools");

  var modes = ce("div", "dg-mode");
  modes.setAttribute("role", "radiogroup");
  modes.setAttribute("aria-label", "Mode");
  [
    { id: "build", label: "Build", help: "Build: draw the map" },
    { id: "play", label: "Play", help: "Play: show the map to your players bit by bit" }
  ].forEach(function(m){
    var btn = button("dg-mode-btn" + (m.id === mode ? " on" : ""), m.label, function(){ setMode(m.id); });
    btn.title = m.help;
    btn.dataset.mode = m.id;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", m.id === mode ? "true" : "false");
    modes.appendChild(btn);
  });
  bar.appendChild(modes);
  bar.appendChild(ce("span", "dg-tool-gap"));

  var sets = ce("div", "dg-sets");
  var build = ce("div", "dg-set" + (mode === "build" ? " on" : ""));
  build.dataset.set = "build";
  var outside = cssVar("--parchment", "#241d33");
  TOOLS.forEach(function(group, gi){
    if(gi) build.appendChild(ce("span", "dg-tool-gap"));
    group.forEach(function(t){ build.appendChild(toolButton(t, "build", outside)); });
  });
  sets.appendChild(build);

  var play = ce("div", "dg-set" + (mode === "play" ? " on" : ""));
  play.dataset.set = "play";
  PLAY_TOOLS.forEach(function(t){ play.appendChild(toolButton(t, "play")); });
  play.appendChild(ce("span", "dg-tool-gap"));
  play.appendChild(actionButton("Show all", "sun", "Show the whole map to the players", function(){
    if(!change(function(){ return revealAll(b.d, true); })) showActionToast(isBlank(b.d) ? "There is nothing on the map to show yet." : "The players can already see everything.");
  }));
  play.appendChild(actionButton("Hide all", "cloud", "Cover the whole map in fog again", function(){
    if(!change(function(){ return revealAll(b.d, false); })) showActionToast("Everything is already hidden.");
  }));
  sets.appendChild(play);
  bar.appendChild(sets);
  setInert();
  return bar;

  // The faded out set can't be tabbed to or read out.
  function setInert(){
    build.inert = mode !== "build";
    play.inert = mode !== "play";
  }
}

function toolButton(t, set, outside){
  var picked = set === "build" ? tool : playTool;
  var btn = button("dg-tool" + (t.id === picked ? " on" : ""), "", function(){ pickTool(set, t.id); }, t.label + ": " + t.help);
  btn.dataset.tool = t.id;
  btn.setAttribute("aria-pressed", t.id === picked ? "true" : "false");
  if(t.icon) btn.appendChild(icon(t.icon, "dg-tool-pic"));
  else {
    var sw = ce("canvas", "dg-tool-pic dg-swatch");
    sw.setAttribute("aria-hidden", "true");
    btn.appendChild(sw);
    sw.dataset.code = t.code;
    drawSwatch(sw, t.code, 26, outside, b && b.d.style);
  }
  btn.appendChild(ce("span", "dg-tool-label", t.label));
  return btn;
}

function actionButton(label, iconName, help, onClick){
  var btn = button("dg-tool dg-action", "", onClick, label + ": " + help);
  btn.appendChild(icon(iconName, "dg-tool-pic"));
  btn.appendChild(ce("span", "dg-tool-label", label));
  return btn;
}

function pickTool(set, id){
  if(set === "build") tool = id; else playTool = id;
  overlay.querySelectorAll('.dg-set[data-set="' + set + '"] .dg-tool[data-tool]').forEach(function(btn){
    var on = btn.dataset.tool === id;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  b.hover = null;
  b.hoverArea = null;
  refreshChrome();
  draw();
}

function setMode(m){
  if(!b || m === mode) return;
  mode = m;
  overlay.querySelectorAll(".dg-mode-btn").forEach(function(btn){
    var on = btn.dataset.mode === m;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-checked", on ? "true" : "false");
  });
  overlay.querySelectorAll(".dg-set").forEach(function(set){
    var on = set.dataset.set === m;
    set.classList.toggle("on", on);
    set.inert = !on;
  });
  b.hover = null;
  b.hoverArea = null;
  refreshChrome();
  draw();
}

/* The tool in use: Build's or Play's. */
function activeTool(){
  return mode === "build" ? toolById(tool) : PLAY_TOOLS.find(function(t){ return t.id === playTool; });
}

/* Undo and redo buttons, the hint on a blank map, the map's cursor. */
function refreshChrome(){
  if(!b) return;
  b.undoBtn.disabled = !b.history.canUndo();
  b.redoBtn.disabled = !b.history.canRedo();
  var hint = "";
  var dungeonShown = b.dungeon.maps.some(function(m){ return m.id === presentedId(); });
  var paused = dungeonShown && isPaused();
  if(paused) hint = "The players' screen is paused. Press Resume (or B) when you're ready.";
  else if(isBlank(b.d)) hint = mode === "build" ? "Pick Room, then drag on the grid to draw your first room." : "Switch to Build and draw your map first.";
  else if(mode === "play" && playTool === "party" && !b.d.party) hint = "Tap a square to put the party there.";
  else if(mode === "play" && !anyRevealed(b.d)) hint = "Tap a room or corridor to show it to your players.";
  b.hint.textContent = hint;
  b.hint.hidden = !hint;
  var onScreen = presentedId() === b.d.id;
  b.playersBtn.classList.toggle("on", onScreen);
  b.playersBtn.title = onScreen
    ? "The players' tab shows this map. Click to bring it back if you closed it."
    : "Open the players' view in a new tab. Drag that tab to the TV and make it full screen.";
  b.playersBtn.setAttribute("aria-label", onScreen ? "Player view, showing this map" : "Player view");
  b.preview.classList.toggle("on", mode === "play" && onScreen);
  b.preview.classList.toggle("paused", paused);
  b.playersBtn.classList.toggle("paused", paused);
  b.pauseBtn.disabled = !dungeonShown;
  b.pauseBtn.classList.toggle("on", paused);
  b.pauseIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[paused ? "play" : "pause"] + '</svg>';
  b.pauseLabel.textContent = paused ? "Resume" : "Pause";
  var pauseHelp = !dungeonShown ? "Pause the players' screen. Open Player view first."
    : paused ? "Resume: show the map on the players' screen again (B)"
    : "Pause: cover the players' screen while you get things ready (B)";
  b.pauseBtn.title = pauseHelp;
  b.pauseBtn.setAttribute("aria-label", pauseHelp);
  refreshPager();
  // The tool bar's swatches look like the open map's style.
  if(b.swatchStyle !== b.d.style){
    b.swatchStyle = b.d.style;
    var outside = cssVar("--parchment", "#241d33");
    overlay.querySelectorAll(".dg-swatch").forEach(function(sw){ drawSwatch(sw, sw.dataset.code, 26, outside, b.d.style); });
  }
  publish();
  var panning = b.gesture && b.gesture.type === "pan";
  b.canvas.style.cursor = panning ? "grabbing" : (activeTool().id === "move" || b.space ? "grab" : (mode === "play" ? "pointer" : "crosshair"));
}

/* ---- Stepping between the dungeon's maps ---- */
var CHEVRON_RIGHT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
var PLUS_SMALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';

/* The map's name and place, the arrows. On the last map in Build the
   right arrow becomes "+", which adds the next map. */
function refreshPager(){
  var maps = b.dungeon.maps, i = maps.indexOf(b.d);
  b.pageName.textContent = b.d.name;
  b.pageCount.textContent = (i + 1) + " of " + maps.length;
  b.prevBtn.disabled = i <= 0;
  var adds = i === maps.length - 1;
  b.nextBtn.disabled = adds && mode === "play";
  b.nextBtn.innerHTML = adds && mode === "build" ? PLUS_SMALL : CHEVRON_RIGHT;
  var label = adds && mode === "build" ? "Add a map after this one" : "Next map";
  b.nextBtn.title = label;
  b.nextBtn.setAttribute("aria-label", label);
  b.nextBtn.classList.toggle("adds", adds && mode === "build");
}

/* One map back (-1) or on (+1). Past the last map in Build, adds one. */
function stepMap(step){
  if(!b) return;
  var maps = b.dungeon.maps, i = maps.indexOf(b.d);
  if(step > 0 && i === maps.length - 1){
    if(mode === "build") addMapAfter();
    return;
  }
  var next = maps[i + step];
  if(next) goToMap(next);
}

function addMapAfter(){
  var m = addMap(b.dungeon, b.d.id);
  if(!m){ showActionToast("A dungeon can hold up to 30 maps.", true); return; }
  saveDungeon(b.dungeon);
  playAdd();
  goToMap(m);
  showActionToast("Added " + m.name + ". Draw it, then use the arrows to move between maps.");
}

/* Shows another of the dungeon's maps. If the players' tab shows this
   dungeon, it moves to the new map too. */
function goToMap(m){
  if(!b || m === b.d) return;
  if(b.d) b.views[b.d.id] = b.view;   // null when the open map was just deleted
  b.gesture = null;
  b.pointers.clear();
  b.hover = null;
  b.hoverArea = null;
  b.previewKey = null;
  b.d = m;
  b.pings = [];
  b.history = b.histories[m.id] || (b.histories[m.id] = createHistory());
  b.view = b.views[m.id] || null;
  if(!b.view) fit();
  lastMap[b.dungeon.id] = m.id;
  var shown = presentedId();
  if(shown && shown !== m.id && b.dungeon.maps.some(function(x){ return x.id === shown; })) presentDungeon(m);
  refreshChrome();
  draw();
}

/* The dungeon's maps in a sheet: go to one, rename, reorder (drag a row
   by its handle, or the Up and Down keys on the handle), delete, add. */
function openMapsSheet(){
  var dungeon = b.dungeon;
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Maps in " + dungeon.name));
    body.appendChild(ce("p", "dg-sheet-help", "Drag a map by its handle to change the order. The arrows under the map move between them, like slides, and the players' screen follows."));
    var rows = ce("div", "dg-map-rows");
    dungeon.maps.forEach(function(m, i){
      var here = b && b.d === m;
      var row = ce("div", "dg-map-row" + (here ? " here" : ""));
      row.dataset.id = m.id;
      var grip = button("dg-map-grip", "", function(){}, "Drag to move " + m.name + ". The Up and Down keys move it too.");
      grip.innerHTML = GRIP_SVG;
      grip.disabled = dungeon.maps.length < 2;
      grip.addEventListener("pointerdown", function(e){ dragRow(e, row, grip, m); });
      grip.addEventListener("keydown", function(e){
        if(e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        e.stopPropagation();
        if(!moveMap(dungeon, m.id, e.key === "ArrowUp" ? -1 : 1)) return;
        reordered();
        var again = body.querySelector('.dg-map-row[data-id="' + m.id + '"] .dg-map-grip');
        if(again) again.focus();
      });
      row.appendChild(grip);
      row.appendChild(ce("span", "dg-map-num", String(i + 1)));
      var name = ce("input", "dg-map-name");
      name.type = "text";
      name.value = m.name;
      name.maxLength = 40;
      name.setAttribute("aria-label", "Name of map " + (i + 1));
      name.addEventListener("keydown", function(e){ if(e.key === "Enter") name.blur(); });
      name.addEventListener("change", function(){
        if(!renameMap(dungeon, m.id, name.value)){ name.value = m.name; return; }
        saveDungeon(dungeon);
        if(b) refreshChrome();
      });
      row.appendChild(name);
      var go = button("btn small" + (here ? " ghost" : ""), here ? "Open now" : "Go", function(){
        closeSheet();
        if(b && b.dungeon === dungeon) goToMap(m);
      }, here ? "This map is open" : "Go to " + m.name);
      go.disabled = here;
      row.appendChild(go);
      row.appendChild(iconButton("trash", "Delete " + m.name, dungeon.maps.length < 2, function(){
        closeSheet();
        confirmDialog("Delete " + m.name + "?", "This map of " + dungeon.name + " will be removed. This cannot be undone.", function(){
          var i0 = dungeon.maps.indexOf(m);
          if(!removeMap(dungeon, m.id)) return;
          saveDungeon(dungeon);
          stopPresenting(m.id);
          playDelete();
          if(b && b.dungeon === dungeon){
            if(b.d === m){ b.d = null; goToMap(dungeon.maps[Math.max(0, i0 - 1)]); }
            else refreshChrome();
          }
          showActionToast("Deleted " + m.name + ".");
        });
      }));
      rows.appendChild(row);
    });
    body.appendChild(rows);

    function reordered(){
      saveDungeon(dungeon);
      if(b) refreshChrome();
      refresh();
    }

    /* Drags a row up or down by its handle. The row follows the pointer,
       the rows it passes slide out of its way, and letting go puts the
       map there. Near the sheet's top or bottom edge the sheet scrolls. */
    function dragRow(e, row, grip, m){
      if(grip.disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      var list = Array.prototype.slice.call(rows.children);
      var from = list.indexOf(row), to = from;
      var step = list[1].getBoundingClientRect().top - list[0].getBoundingClientRect().top;
      var sheet = document.getElementById("bottom-sheet");
      var startY = e.clientY, startScroll = sheet.scrollTop;
      grip.setPointerCapture(e.pointerId);
      row.classList.add("dragging");
      rows.classList.add("sorting");
      function move(ev){
        var edge = sheet.getBoundingClientRect();
        if(ev.clientY < edge.top + 48) sheet.scrollTop -= 12;
        else if(ev.clientY > edge.bottom - 48) sheet.scrollTop += 12;
        var dy = ev.clientY - startY + (sheet.scrollTop - startScroll);
        dy = Math.max(-from * step, Math.min((list.length - 1 - from) * step, dy));
        row.style.transform = "translateY(" + dy + "px)";
        to = from + Math.round(dy / step);
        list.forEach(function(other, i){
          if(other === row) return;
          var shift = from < to && i > from && i <= to ? -step : (to < from && i >= to && i < from ? step : 0);
          other.style.transform = shift ? "translateY(" + shift + "px)" : "";
        });
      }
      function end(ev){
        grip.removeEventListener("pointermove", move);
        grip.removeEventListener("pointerup", end);
        grip.removeEventListener("pointercancel", end);
        row.classList.remove("dragging");
        rows.classList.remove("sorting");
        if(ev.type === "pointerup" && placeMap(dungeon, m.id, to)) reordered();
        else list.forEach(function(other){ other.style.transform = ""; });
      }
      grip.addEventListener("pointermove", move);
      grip.addEventListener("pointerup", end);
      grip.addEventListener("pointercancel", end);
    }

    var actions = ce("div", "dg-sheet-actions");
    var add = button("btn primary", "Add a map", function(){
      closeSheet();
      if(b && b.dungeon === dungeon) addMapAfter();
    });
    actions.appendChild(add);
    body.appendChild(actions);
  });
}

var GRIP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';

var SMALL_ICONS = {
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
};
function iconButton(name, label, disabled, onClick){
  var btn = button("dg-step dg-map-act" + (name === "trash" ? " danger" : ""), "", onClick, label);
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + SMALL_ICONS[name] + '</svg>';
  btn.disabled = disabled;
  return btn;
}

/* Pauses or resumes the players' screen, if it shows this dungeon. */
function togglePause(){
  if(!b || !b.dungeon.maps.some(function(m){ return m.id === presentedId(); })) return;
  var on = !isPaused();
  setPaused(on);
  showActionToast(on ? "The players' screen is paused. Get things ready, then press Resume." : "The players' screen is back.");
  refreshChrome();
  draw();
}

/* Sends the players' tab the map as it is now, once per frame at most,
   if this is the map it shows. */
function publish(){
  if(!b || b.publishing) return;
  var board = b;
  board.publishing = requestAnimationFrame(function(){
    board.publishing = 0;
    publishDungeon(board.d);
  });
}

/* Puts this map on the players' screen and opens their tab, or brings
   it back if it is already open (the same tab name reuses it). */
function openPlayerView(){
  presentDungeon(b.d);
  var tab = window.open("dungeon-view.html", "ragnars-den-players");
  if(!tab) showActionToast("Your browser blocked the new tab. Allow pop-ups for this site, then press Player view again.", true);
  else showActionToast("The players' view is open in a new tab. Drag it to the TV and make it full screen.");
  refreshChrome();
  draw();
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
  if(b.history.same(b.d, before)) return;
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
  drawMap(c.ctx, b.d, view, { outside: cssVar("--ink-deep", "#120f1a"), grid: mode === "build", dm: true });
  drawLitGlow(c.ctx, b.d, view);
  if(mode === "play") drawFog(c.ctx, b.d, view, FOG_DM);
  if(b.d.party) drawParty(c.ctx, view, b.d.party);
  b.d.notes.forEach(function(n){ drawNoteBadge(c.ctx, view, n, dpr); });
  b.d.links.forEach(function(l){ drawLinkBadge(c.ctx, view, l, dpr); });
  if(b.pings && b.pings.length){
    var pnow = performance.now();
    b.pings = b.pings.filter(function(pg){ return pnow - pg.start < PING_MS; });
    b.pings.forEach(function(pg){ drawPing(c.ctx, view.ox + pg.x * view.scale, view.oy + pg.y * view.scale, view.scale, (pnow - pg.start) / PING_MS); });
    if(b.pings.length) draw();
  }
  if(b.preview.classList.contains("on")) paintPreview();

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

  // While the party is dragged, how far they see: a dashed ring. Only
  // then, so it doesn't sit over the map the rest of the time.
  if(g && g.type === "party" && b.d.party && b.d.sight > 0){
    var pr = (b.d.sight + 0.5) * view.scale;
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2 * dpr;
    ctx.setLineDash([8 * dpr, 6 * dpr]);
    ctx.beginPath();
    ctx.arc(view.ox + (b.d.party.x + 0.5) * view.scale, view.oy + (b.d.party.y + 0.5) * view.scale, pr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // In Play, the area a tap would show or hide, under the mouse.
  if(mode === "play" && b.hoverArea && !g && !b.space){
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    b.hoverArea.forEach(function(p){ ctx.rect(sx(p[0]), sy(p[1]), sx(p[0] + 1) - sx(p[0]), sy(p[1] + 1) - sy(p[1])); });
    ctx.fill();
    ctx.restore();
  }

  // The square a brush would paint, under the mouse.
  if(mode === "build" && b.hover && !g && toolById(tool).code !== undefined && !b.space){
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

/* The players' screen in miniature, redrawn only when the map changed. */
function paintPreview(){
  var d = b.d, w = b.previewCanvas.clientWidth, h = b.previewCanvas.clientHeight;
  var key = [w, h, d.w, d.h, d.style, d.cells, d.revealed, d.party ? d.party.x + "," + d.party.y : ""].join("|");
  if(key === b.previewKey || !w || !h) return;
  b.previewKey = key;
  var c = prepareCanvas(b.previewCanvas, w, h);
  var pmap = playerView(d);
  var cam = playersFit(pmap, w, h);
  if(!cam){
    c.ctx.fillStyle = MAP_COLORS.fog;
    c.ctx.fillRect(0, 0, c.width, c.height);
    return;
  }
  drawPlayersScreen(c.ctx, pmap, { x: cam.x, y: cam.y, scale: cam.scale * c.dpr }, c.width, c.height);
}

/* Puts the map back as it was in an undo snapshot (a stroke taken back
   when a second finger turns it into a pinch). */
function restore(s){
  b.d.cells = s.cells;
  b.d.revealed = s.revealed;
  b.d.party = s.party ? { x: s.party.x, y: s.party.y } : null;
  b.d.sight = s.sight;
  b.d.notes = s.notes.map(function(n){ return Object.assign({}, n); });
  b.d.links = s.links.map(function(l){ return Object.assign({}, l); });
  b.d.lit = s.lit;
}

/* ---- The DM's notes ----
   A note shows as its number in a red badge in the top left corner of
   its square, so it never hides a door, the party or what's on the floor.
   They are drawn on the DM's board only. */
function badgeOf(n, scale, ox, oy, dpr){
  var r = Math.max(9 * dpr, scale * 0.2);
  return { x: ox + (n.x + 0.06) * scale + r, y: oy + (n.y + 0.06) * scale + r, r: r };
}

function drawNoteBadge(ctx, view, n, dpr){
  var bdg = badgeOf(n, view.scale, view.ox, view.oy, dpr);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 4 * dpr;
  ctx.fillStyle = "#8b1e30";
  ctx.beginPath();
  ctx.arc(bdg.x, bdg.y, bdg.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1.5 * dpr, bdg.r * 0.14);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "700 " + Math.round(bdg.r * (n.n > 9 ? 0.95 : 1.15)) + "px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n.n), bdg.x, bdg.y + bdg.r * 0.06);
  ctx.restore();
}

/* The note whose badge is under point p (CSS pixels), or null. */
function noteHit(p){
  var v = b.view, best = null, bestDist = Infinity;
  b.d.notes.forEach(function(n){
    var bdg = badgeOf(n, v.scale, v.ox, v.oy, 1);
    var dist = Math.hypot(p.x - bdg.x, p.y - bdg.y);
    if(dist <= Math.max(bdg.r + 6, 14) && dist < bestDist){ best = n; bestDist = dist; }
  });
  return best;
}

/* One note: its number, its text (saved as it is typed), Delete. */
function openNoteSheet(note, isNew){
  var d = b.d;
  openBottomSheet(function(body, refresh, closeSheet){
    var head = ce("div", "dg-note-head");
    var num = ce("span", "dg-note-num", String(note.n));
    head.appendChild(num);
    head.appendChild(ce("h3", "dg-sheet-title", "Note " + note.n));
    body.appendChild(head);
    body.appendChild(ce("p", "dg-sheet-help", "Only you see this. It is never shown on the players' screen."));
    var text = ce("textarea", "dg-note-text");
    text.value = note.text;
    text.maxLength = 1000;
    text.rows = 6;
    text.placeholder = "What's here? Monsters, treasure, traps, what the room looks like...";
    text.setAttribute("aria-label", "Note " + note.n);
    text.addEventListener("input", function(){
      if(setNoteText(d, note.id, text.value)) saveDungeon(d);
    });
    body.appendChild(text);
    var actions = ce("div", "dg-sheet-actions");
    var del = button("btn ghost dg-danger-text", "Delete note", function(){
      closeSheet();
      if(!b || b.d !== d) return;
      change(function(){ return removeNote(d, note.id); });
      showActionToast("Deleted note " + note.n + ".");
    });
    actions.appendChild(del);
    actions.appendChild(button("btn primary", "Done", function(){ closeSheet(); if(b) draw(); }));
    body.appendChild(actions);
    if(isNew) requestAnimationFrame(function(){ text.focus(); });
  });
}

/* Every note on this map, in number order. */
function openNotesList(){
  var d = b.d;
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Room notes"));
    var notes = notesInOrder(d);
    if(!notes.length){
      body.appendChild(ce("p", "dg-sheet-help", "No notes on " + d.name + " yet. In Build, pick Note and tap a square to add one. Only you will see them."));
      return;
    }
    body.appendChild(ce("p", "dg-sheet-help", "Only you see these. Tap one to read it or change it."));
    var list = ce("div", "dg-note-list");
    notes.forEach(function(n){
      var row = button("dg-note-row", "", function(){ openNoteSheet(n, false); }, null);
      row.appendChild(ce("span", "dg-note-num", String(n.n)));
      var first = n.text.split("\n")[0].trim();
      row.appendChild(ce("span", "dg-note-line" + (first ? "" : " empty"), first || "Nothing written yet"));
      list.appendChild(row);
    });
    body.appendChild(list);
  });
}

/* ---- Pointing ----
   The Point tool's pings, shown on the board and sent to the players'
   tab. A drag sends one every POINT_GAP ms, so it trails the finger like
   a laser pointer without flooding the channel. */
var POINT_GAP = 140;

function pointHere(p, g){
  var now = performance.now();
  if(now - g.last < POINT_GAP) return;
  g.last = now;
  var x = (p.x - b.view.ox) / b.view.scale, y = (p.y - b.view.oy) / b.view.scale;
  if(!b.pings) b.pings = [];
  b.pings.push({ x: x, y: y, start: now });
  if(b.pings.length > 12) b.pings.shift();
  if(!pointAt(b.d, x, y) && !b.pointWarned){
    b.pointWarned = true;
    showActionToast("Open Player view to point at things on the players' screen.");
  }
  draw();
}

/* ---- Stairs between maps ----
   Linked stairs show a small blue badge in their bottom right corner,
   with an arrow and the number of the map they lead to. */
function drawLinkBadge(ctx, view, l, dpr){
  var i = b.dungeon.maps.findIndex(function(m){ return m.id === l.to; });
  if(i === -1) return;
  var h = Math.max(14 * dpr, view.scale * 0.34), w = h * 1.5;
  var x = view.ox + (l.x + 0.94) * view.scale - w, y = view.oy + (l.y + 0.94) * view.scale - h;
  ctx.save();
  ctx.fillStyle = "#1f5fa8";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1.2 * dpr, h * 0.09);
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "700 " + Math.round(h * 0.62) + "px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("→" + (i + 1), x + w / 2, y + h / 2 + h * 0.04);
  ctx.restore();
}

/* Where the stairs on (x, y) lead: one of the dungeon's other maps, or
   nowhere. A dungeon of one map offers to add the next one. */
function openStairsSheet(x, y){
  var d = b.d, dungeon = b.dungeon;
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Where do these stairs go?"));
    var others = dungeon.maps.filter(function(m){ return m !== d; });
    if(!others.length){
      body.appendChild(ce("p", "dg-sheet-help", "This dungeon has only one map. Add the next one and these stairs will lead to it. When the party walks onto them in Play, they go there."));
      var actions0 = ce("div", "dg-sheet-actions");
      actions0.appendChild(button("btn primary", "Add a map and lead there", function(){
        closeSheet();
        if(!b || b.d !== d) return;
        var m = addMap(dungeon, d.id);
        if(!m){ showActionToast("A dungeon can hold up to 30 maps.", true); return; }
        change(function(){ return linkStairs(dungeon, d, x, y, m.id); });
        saveDungeon(dungeon);
        playAdd();
        showActionToast("Added " + m.name + ". These stairs lead there.");
      }));
      body.appendChild(actions0);
      return;
    }
    body.appendChild(ce("p", "dg-sheet-help", "When the party walks onto these stairs in Play, they go to that map, and the players' screen goes with them."));
    var current = linkAt(d, x, y);
    var list = ce("div", "dg-sight-list");
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-label", "Where the stairs lead");
    dungeon.maps.forEach(function(m, i){
      if(m === d) return;
      list.appendChild(choice(m.name, "Map " + (i + 1), current && current.to === m.id, function(){ pick(m.id, m.name); }));
    });
    list.appendChild(choice("Nowhere", "", !current, function(){ pick(null, ""); }));
    body.appendChild(list);

    function choice(label, place, on, onPick){
      var row = button("dg-sight" + (on ? " on" : ""), "", onPick, null);
      row.setAttribute("role", "radio");
      row.setAttribute("aria-checked", on ? "true" : "false");
      var words = ce("span", "dg-sight-words");
      words.appendChild(ce("span", "dg-sight-name", label));
      row.appendChild(words);
      if(place) row.appendChild(ce("span", "dg-sight-feet", place));
      return row;
    }
    function pick(toId, name){
      closeSheet();
      if(!b || b.d !== d) return;
      if(change(function(){ return linkStairs(dungeon, d, x, y, toId); })){
        saveDungeon(dungeon);
        showActionToast(toId ? "These stairs lead to " + name + "." : "These stairs lead nowhere now.");
      }
    }
  });
}

/* If the party's move (they were at `from` before it) ended on stairs
   leading to another map, they take them: they leave this map, the
   board and the players' screen go to that one, and they come out on
   its stairs back (or its first staircase). Each map's change is its
   own undo step there. Standing still on stairs takes nobody anywhere. */
function takeStairs(from){
  var p = b.d.party;
  if(!p || (from && from.x === p.x && from.y === p.y)) return;
  var link = linkAt(b.d, p.x, p.y);
  var target = link && b.dungeon.maps.find(function(m){ return m.id === link.to; });
  if(!target) return;
  var left = b.d;
  change(function(){ return removeParty(left); });
  goToMap(target);
  var at = arrivalSquare(target, left.id);
  if(at) change(function(){ return placeParty(target, at[0], at[1]); });
  showActionToast("The party takes the stairs to " + target.name + ".");
}

/* ---- Saving a map as a picture ----
   A PNG of this map, drawn fresh at a good size (PICTURE_SQUARE pixels a
   square, smaller for a big map so it stays within PICTURE_MAX), with a
   strip along the bottom naming the dungeon and the map:
   - "whole": every room, as on the DM's board, with the note numbers
     and stairs badges, and secret doors marked. For the DM.
   - "players": what the players have been shown, the rest in fog, and
     the party. A handout. */
var PICTURE_SQUARE = 64;
var PICTURE_MAX = 4096;

function openPictureSheet(){
  var d = b.d;
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Save as picture"));
    body.appendChild(ce("p", "dg-sheet-help", "Saves " + d.name + " as a picture file you can print or share."));
    var list = ce("div", "dg-sight-list");
    list.appendChild(option("Whole map", "Every room and corridor, with your note numbers and secret doors. For you, or for printing.", function(){
      closeSheet();
      savePicture(d, "whole");
    }, isBlank(d)));
    list.appendChild(option("What the players have seen", "Only what you have shown them, the rest in fog. A handout for the players.", function(){
      closeSheet();
      savePicture(d, "players");
    }, !anyRevealed(d)));
    body.appendChild(list);
    function option(label, help, onPick, off){
      var row = button("dg-sight", "", onPick, null);
      row.disabled = off;
      var words = ce("span", "dg-sight-words");
      words.appendChild(ce("span", "dg-sight-name", label));
      words.appendChild(ce("span", "dg-sight-help", off ? (label === "Whole map" ? "Draw something on the map first." : "Show the players something in Play first.") : help));
      row.appendChild(words);
      return row;
    }
  });
}

/* Draws the picture and hands it to the browser to save. Returns the
   canvas (for checks). */
function savePicture(d, kind){
  var players = kind === "players";
  var pmap = players ? playerView(d) : null;
  var area = players ? revealedBounds(pmap) : contentBounds(d);
  if(!area){ showActionToast(players ? "The players haven't been shown anything on this map yet." : "This map is empty.", true); return null; }
  var pad = players ? 2 : 1;
  var box = { x: area.x - pad, y: area.y - pad, w: area.w + pad * 2, h: area.h + pad * 2 };
  var scale = Math.max(8, Math.min(PICTURE_SQUARE, Math.floor(PICTURE_MAX / Math.max(box.w, box.h))));
  var width = box.w * scale, height = box.h * scale;
  var strip = Math.round(Math.max(36, scale * 0.8));
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height + strip;
  var ctx = canvas.getContext("2d");
  if(players){
    drawPlayersScreen(ctx, pmap, { x: box.x + box.w / 2, y: box.y + box.h / 2, scale: scale }, width, height);
  } else {
    var view = { scale: scale, ox: -box.x * scale, oy: -box.y * scale, width: width, height: height };
    drawMap(ctx, d, view, { outside: rockColor(d.style), dm: true });
    d.notes.forEach(function(n){ drawNoteBadge(ctx, view, n, scale / 40); });
    d.links.forEach(function(l){ drawLinkBadge(ctx, view, l, scale / 40); });
  }
  // The caption strip.
  ctx.fillStyle = "#14111b";
  ctx.fillRect(0, height, width, strip);
  ctx.fillStyle = "#e8dcc0";
  ctx.font = Math.round(strip * 0.46) + "px Georgia, 'Palatino Linotype', serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(mapTitle(b.dungeon, d), Math.round(strip * 0.4), height + strip / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = "#8f86a3";
  ctx.font = Math.round(strip * 0.34) + "px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("1 square = 5 ft", width - Math.round(strip * 0.4), height + strip / 2);

  var name = (mapTitle(b.dungeon, d) + (players ? " (players)" : "")).replace(/[\\/:*?"<>|·]+/g, " ").replace(/\s+/g, " ").trim() + ".png";
  canvas.toBlob(function(blob){
    if(!blob){ showActionToast("Could not make the picture. The map may be too big for this browser.", true); return; }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    showActionToast("Saved " + name + ".");
  }, "image/png");
  return canvas;
}

/* Lit squares glow a warm yellow on the DM's board (the players just
   see the ground once it is in view). */
function drawLitGlow(ctx, d, view){
  if(!d.lit || d.lit.indexOf("1") === -1) return;
  var s = view.scale;
  function ex(x){ return Math.round(view.ox + x * s); }
  function ey(y){ return Math.round(view.oy + y * s); }
  ctx.save();
  ctx.fillStyle = "rgba(255,190,70,0.22)";
  ctx.beginPath();
  for(var y = 0; y < d.h; y++){
    var run = -1;
    for(var x = 0; x <= d.w; x++){
      var on = x < d.w && isLit(d, x, y);
      if(on && run < 0) run = x;
      if(!on && run >= 0){ ctx.rect(ex(run), ey(y), ex(x) - ex(run), ey(y + 1) - ey(y)); run = -1; }
    }
  }
  ctx.fill();
  ctx.restore();
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
    if(e.pointerType === "mouse" && b && b.hover){ b.hover = null; b.hoverArea = null; draw(); }
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
  // Capture can fail for a pointer the browser no longer knows; carry on.
  try{ b.canvas.setPointerCapture(e.pointerId); }catch(err){}
  var p = point(e);
  b.pointers.set(e.pointerId, p);

  if(b.pointers.size === 2){
    // A second finger: whatever the first began becomes a pinch.
    var g = b.gesture;
    if(g && g.before){ restore(g.before); publish(); }
    startPinch();
    draw();
    return;
  }
  if(b.pointers.size > 2) return;

  var mouseDrag = e.pointerType === "mouse" && (e.button === 1 || e.button === 2);
  var t = activeTool();
  var hit = !mouseDrag && !b.space && t.id !== "move" ? noteHit(p) : null;
  if(mouseDrag || t.id === "move" || b.space){
    b.gesture = { type: "pan", last: p };
  } else if(t.id === "note"){
    // On a note: a tap opens it, a drag moves it. Anywhere else: a tap adds one.
    var nsq = squareAt(p);
    var note = hit || noteAt(b.d, nsq[0], nsq[1]);
    b.gesture = { type: "note", note: note, start: nsq, moved: false, before: b.history.snapshot(b.d) };
  } else if(mode === "play" && hit){
    // In Play a tap on a note's number opens it, whatever the tool.
    b.gesture = { type: "note-read", note: hit, start: p };
  } else if(t.id === "point"){
    b.gesture = { type: "point", last: 0 };
    pointHere(p, b.gesture);
  } else if(t.id === "light"){
    // A tap or a drag, like Reveal: which one is only known once it moves on.
    var la = squareAt(p);
    b.gesture = { type: "light", start: la, last: la, moved: false, on: !isLit(b.d, la[0], la[1]), before: b.history.snapshot(b.d) };
  } else if(t.id === "doors"){
    // A tap opens or closes the door under it. A locked door asks for a
    // second tap within a few seconds, so none is unlocked by accident.
    var at0 = squareAt(p);
    b.gesture = { type: "done" };
    if(!isDoor(b.d, at0[0], at0[1])) showActionToast("Tap a door to open or close it.");
    else if(isLocked(b.d, at0[0], at0[1]) && !(b.unlock && sameSquare(b.unlock.at, at0) && performance.now() - b.unlock.time < 4000)){
      b.unlock = { at: at0, time: performance.now() };
      showActionToast("This door is locked. Tap it again to unlock and open it.");
    }
    else {
      b.unlock = null;
      change(function(){ return toggleDoor(b.d, at0[0], at0[1]); });
    }
  } else if(t.id === "party"){
    // Puts the party there (on the marker itself: they look around
    // again), then a drag walks them.
    var to = squareAt(p), was = b.history.snapshot(b.d);
    placeParty(b.d, to[0], to[1]);
    b.gesture = { type: "party", last: to, before: was };
  } else if(t.id === "reveal"){
    // A tap or a drag: which one is only known once it moves on.
    var at = squareAt(p);
    b.gesture = { type: "reveal", start: at, last: at, moved: false, on: !isRevealed(b.d, at[0], at[1]), before: b.history.snapshot(b.d) };
  } else if(t.id === "room"){
    var sq = squareAt(p);
    b.gesture = { type: "room", a: sq, b: sq };
  } else {
    var start = squareAt(p);
    b.gesture = { type: "paint", code: t.code, start: start, startCode: cellAt(b.d, start[0], start[1]), last: start, moved: false, before: b.history.snapshot(b.d) };
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
      if(!sameSquare(sq, b.hover)){
        b.hover = sq;
        b.hoverArea = mode !== "play" ? null
          : playTool === "reveal" ? areaAt(b.d, sq[0], sq[1])
          : playTool === "doors" && isDoor(b.d, sq[0], sq[1]) ? [sq] : null;
        draw();
      }
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
    g.moved = true;
    b.hover = to;
    refreshChrome();
    draw();
  } else if(g.type === "room"){
    var c = squareAt(p);
    if(sameSquare(c, g.b)) return;
    g.b = c;
    draw();
  } else if(g.type === "note"){
    var nto = squareAt(p);
    if(!g.note || sameSquare(nto, g.start) && !g.moved) return;
    if(moveNote(b.d, g.note.id, nto[0], nto[1])) g.moved = true;
    draw();
  } else if(g.type === "point"){
    pointHere(p, g);
  } else if(g.type === "note-read"){
    if(Math.hypot(p.x - g.start.x, p.y - g.start.y) > 8) b.gesture = { type: "done" };
  } else if(g.type === "light"){
    var ln = squareAt(p);
    if(sameSquare(ln, g.last)) return;
    g.moved = true;
    setLit(b.d, lineCells(g.last[0], g.last[1], ln[0], ln[1]), g.on);
    g.last = ln;
    refreshChrome();
    draw();
  } else if(g.type === "party"){
    var step = squareAt(p);
    if(sameSquare(step, g.last) || !b.d.party) return;
    g.last = step;
    if(!g.lockSaid && lockedAhead(b.d, step[0], step[1])){
      g.lockSaid = true;
      showActionToast("That door is locked. Unlock it with the Doors tool.");
    }
    walkParty(b.d, step[0], step[1]);
    refreshChrome();
    draw();
  } else if(g.type === "reveal"){
    var next = squareAt(p);
    if(sameSquare(next, g.last)) return;
    g.moved = true;
    setRevealed(b.d, lineCells(g.last[0], g.last[1], next[0], next[1]), g.on);
    g.last = next;
    refreshChrome();
    draw();
  }
}

function onUp(e){
  if(!b || !b.pointers.has(e.pointerId)) return;
  b.pointers.delete(e.pointerId);
  var g = b.gesture;
  var up = e.type === "pointerup";
  // A stroke that changed the map as it went: one undo step. Then a tap
  // on stairs already drawn (Stairs tool) asks where they lead, and a
  // party move ending on stairs that lead somewhere takes them there.
  // Otherwise it was a tap, handled by its tool below.
  if(g && (g.type === "paint" || g.type === "party" || ((g.type === "reveal" || g.type === "light") && g.moved) || (g.type === "note" && g.moved))){
    finishStroke(g.before);
    if(g.type === "paint" && up && !g.moved && g.code === ">" && g.startCode === ">"){
      var st = g.start;
      b.gesture = null;
      openStairsSheet(st[0], st[1]);
    }
    else if(g.type === "party" && up) takeStairs(g.before.party);
  }
  else if(g && g.type === "note" && up){
    var tapped = g.note, at = g.start;
    b.gesture = null;
    if(!tapped){
      var made = null;
      if(!change(function(){ made = addNote(b.d, at[0], at[1]); return !!made; })){
        showActionToast("A map can hold up to 99 notes.", true);
      } else tapped = made;
    }
    if(tapped) openNoteSheet(tapped, !g.note);
  }
  else if(g && g.type === "note-read" && up){
    b.gesture = null;
    openNoteSheet(g.note, false);
  }
  else if(g && g.type === "light" && up){
    var lt = g.start;
    b.gesture = null;
    change(function(){ return toggleLitArea(b.d, lt[0], lt[1]); });
  }
  else if(g && g.type === "reveal" && up){
    var tap = g.start;
    b.gesture = null;
    change(function(){ return toggleArea(b.d, tap[0], tap[1]); });
    b.hoverArea = b.hover ? areaAt(b.d, b.hover[0], b.hover[1]) : null;
  }
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

/* Ctrl+Z undoes, Ctrl+Shift+Z or Ctrl+Y redoes, holding Space drags,
   Left and Right step between the dungeon's maps, B pauses or resumes
   the players' screen (as B blanks the screen in a slide show). */
function onKey(e){
  if(!b) return;
  var typing = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
  if(typing || document.querySelector("#bottom-sheet.open, #confirm-modal.open")) return;
  var key = e.key.toLowerCase();
  if((e.ctrlKey || e.metaKey) && key === "z"){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); }
  else if((e.ctrlKey || e.metaKey) && key === "y"){ e.preventDefault(); redo(); }
  else if(e.key === " " && !b.space){ e.preventDefault(); b.space = true; refreshChrome(); draw(); }
  else if(key === "b" && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); togglePause(); }
  else if(e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); stepMap(-1); }
  else if(e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey && !e.altKey){ e.preventDefault(); stepMap(1); }
}
function onKeyUp(e){
  if(b && e.key === " "){ b.space = false; refreshChrome(); draw(); }
}

/* ---- Party sight ----
   How far the party sees on this map: a common case picked from the
   list, or an exact distance in 5 foot steps. A change applies at once
   (and shows more around the party if they now see further) and can
   be undone. */
function feet(squares){ return squares === 0 ? "No limit" : squares * 5 + " ft"; }

function openSightSheet(){
  var d = b.d;
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Party sight"));
    body.appendChild(ce("p", "dg-sheet-help", "How far the party can see on " + d.name + " when you move them. Walls and closed doors always block the view."));
    var list = ce("div", "dg-sight-list");
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-label", "Party sight");
    SIGHT_OPTIONS.forEach(function(o){
      var on = d.sight === o.squares;
      var row = button("dg-sight" + (on ? " on" : ""), "", function(){ pick(o.squares); }, null);
      row.setAttribute("role", "radio");
      row.setAttribute("aria-checked", on ? "true" : "false");
      var words = ce("span", "dg-sight-words");
      words.appendChild(ce("span", "dg-sight-name", o.label));
      words.appendChild(ce("span", "dg-sight-help", o.help));
      row.appendChild(words);
      row.appendChild(ce("span", "dg-sight-feet", feet(o.squares)));
      list.appendChild(row);
    });
    body.appendChild(list);

    var exact = ce("div", "dg-side-row dg-sight-exact");
    exact.appendChild(ce("span", "dg-side-label", "Exactly"));
    var less = button("dg-step", "", function(){ pick(d.sight === 0 ? SIGHT_MAX : Math.max(1, d.sight - 1)); }, "5 feet less");
    less.appendChild(icon("minus"));
    var more = button("dg-step", "", function(){ pick(d.sight === 0 ? 0 : (d.sight >= SIGHT_MAX ? 0 : d.sight + 1)); }, "5 feet more");
    more.appendChild(icon("plus"));
    exact.appendChild(less);
    exact.appendChild(ce("span", "dg-sight-value", feet(d.sight)));
    exact.appendChild(more);
    body.appendChild(exact);

    var actions = ce("div", "dg-sheet-actions");
    actions.appendChild(button("btn primary", "Done", closeSheet));
    body.appendChild(actions);

    function pick(squares){
      if(!b || b.d !== d) return;
      change(function(){ return setSight(d, squares); });
      refresh();
    }
  });
}

/* ---- Random map ----
   Replaces this map with a random layout (core generateMap). One undo
   step, so the DM can roll again and again and go back. */
function openRandomSheet(){
  var d = b.d;
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Random map"));
    body.appendChild(ce("p", "dg-sheet-help", "Replaces " + d.name + " with random rooms, corridors, doors, water and more. You can undo it, so roll as often as you like."));
    var sizes = ce("div", "dg-sizes dg-roll-sizes");
    sizes.setAttribute("role", "radiogroup");
    sizes.setAttribute("aria-label", "How many rooms");
    [["few", "Few rooms"], ["some", "Some rooms"], ["many", "Many rooms"]].forEach(function(o){
      var on = rollRooms === o[0];
      var chip = button("dg-size" + (on ? " on" : ""), "", function(){ rollRooms = o[0]; refresh(); });
      chip.dataset.rooms = o[0];
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", on ? "true" : "false");
      chip.appendChild(ce("span", "dg-size-name", o[1]));
      sizes.appendChild(chip);
    });
    body.appendChild(sizes);
    var actions = ce("div", "dg-sheet-actions");
    actions.appendChild(button("btn ghost", "Cancel", closeSheet));
    actions.appendChild(button("btn primary", "Roll", function(){
      closeSheet();
      if(!b || b.d !== d) return;
      change(function(){ generateMap(d, { rooms: rollRooms }); return true; });
      fit();
      draw();
      showActionToast("Rolled a new layout. Undo brings back the old one.");
    }));
    body.appendChild(actions);
  });
}

/* ---- Map style ---- */
/* A little sample dungeon to show each style on. */
var STYLE_SAMPLE = [
  "          ",
  " ....     ",
  " ....+... ",
  " ~~..   . ",
  " ....   > ",
  "          "
];

function openStyleSheet(){
  var d = b.d;
  openBottomSheet(function(body, refresh, closeSheet){
    body.appendChild(ce("h3", "dg-sheet-title", "Map style"));
    var tiles = ce("div", "dg-styles");
    var pics = [];
    DUNGEON_STYLES.forEach(function(st){
      var on = d.style === st.id;
      var tile = button("dg-style" + (on ? " on" : ""), "", function(){
        closeSheet();
        if(!b || b.d !== d || !setDungeonStyle(d, st.id)) return;
        saveDungeon(d);
        refreshChrome();
        draw();
      }, st.label + ": " + st.help);
      tile.setAttribute("aria-pressed", on ? "true" : "false");
      var pic = ce("canvas", "dg-style-pic");
      pic.setAttribute("aria-hidden", "true");
      tile.appendChild(pic);
      tile.appendChild(ce("span", "dg-style-name", st.label));
      tile.appendChild(ce("span", "dg-style-help", st.help));
      tiles.appendChild(tile);
      pics.push({ canvas: pic, style: st.id });
    });
    body.appendChild(tiles);
    // Drawn once the sheet has laid the tiles out.
    requestAnimationFrame(function(){
      pics.forEach(function(p){
        var sample = { w: STYLE_SAMPLE[0].length, h: STYLE_SAMPLE.length, cells: STYLE_SAMPLE.join(""), style: p.style };
        drawThumbnail(p.canvas, sample, p.canvas.clientWidth, p.canvas.clientHeight, MAP_COLORS.rock);
      });
    });
  });
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
