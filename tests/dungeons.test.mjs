/* Dungeons: the DM's terrain maps. A map is a grid of terrain codes
   saved by name; rooms and corridors are painted as floor and the walls
   follow from where floor meets rock. Painting reports whether anything
   changed, resizing keeps the map centred, and undo brings back any
   earlier state, a resize included. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadDungeons, getDungeons, getDungeon, createDungeon, saveDungeon, deleteDungeon, duplicateDungeon, importDungeons,
  findMap, dungeonOfMap, addMap, removeMap, moveMap, placeMap, renameMap, mapTitle,
  dungeonNameProblem, cellAt, isOpen, isBlank, contentBounds, passageAxis, paintCells, fillRect, lineCells,
  clearDungeon, resizeDungeon, resizeLoses, createHistory, DUNGEON_SIZES, MIN_SIDE, MAX_SIDE, TERRAIN, ROCK, FLOOR,
  isRevealed, setRevealed, revealAll, anyRevealed, areaAt, toggleArea, playerView, revealedBounds, FOG_EDGE,
  setDungeonStyle, DUNGEON_STYLES, placeParty, walkParty, removeParty, sightFrom, SIGHT, setSight, SIGHT_OPTIONS, SIGHT_MAX,
  toggleDoor, isDoor, noteAt, addNote, setNoteText, moveNote, removeNote, notesInOrder,
  linkAt, stairsOf, linkStairs, arrivalSquare, isLit, setLit, toggleLitArea, isLocked, lockedAhead,
  makeRng, generateMap, createRandomDungeon, randomDungeonName, cutAt, ovalCells, fillOval, diagonalCells, carveDiagonal,
  setMapImage, placeMapImage, imageFit, fitMapToImage, removeMapImage, imagesInUse, fitLoses
} from "../js/core/dungeons.js";

function fresh(){
  localStorage.clear();
  loadDungeons();
}
/* A new dungeon's one map. */
const newMap = (name, size) => createDungeon(name, size).maps[0];

/* Makes `d` a blank w by h map in place. */
function blankMap(d, w, h){
  d.w = w; d.h = h; d.cells = ROCK.repeat(w * h); d.revealed = "0".repeat(w * h); d.lit = "0".repeat(w * h); d.cuts = "0".repeat(w * h);
}
/* A map drawn from rows of text, e.g. [" ..+.."]: any character that is
   a terrain code is that terrain, anything else is rock. */
function drawn(rowsIn){
  fresh();
  const d = newMap("Test", "small");
  blankMap(d, rowsIn[0].length, rowsIn.length);
  rowsIn.forEach((row, y) => [...row].forEach((c, x) => { if(TERRAIN[c] && c !== ROCK) paintCells(d, [[x, y]], c); }));
  return d;
}
/* The fog as rows of text: "#" shown, "." hidden. */
const fog = (d) => Array.from({ length: d.h }, (_, y) => Array.from({ length: d.w }, (_, x) => isRevealed(d, x, y) ? "#" : ".").join(""));

/* The map as rows of text, for comparing small maps at a glance. */
const rows = (d) => Array.from({ length: d.h }, (_, y) => d.cells.slice(y * d.w, (y + 1) * d.w));

test("a new dungeon has one all-rock map at the size picked, medium if none", () => {
  fresh();
  const dg = createDungeon("Crypt", "small");
  assert.equal(dg.maps.length, 1);
  const d = dg.maps[0];
  assert.equal(d.name, "Map 1");
  assert.equal(d.w, 24);
  assert.equal(d.h, 16);
  assert.equal(d.cells.length, 24 * 16);
  assert.ok(isBlank(d));
  assert.equal(contentBounds(d), null);
  const m = newMap("Mine", "nonsense");
  assert.equal(m.w, DUNGEON_SIZES[1].w);
  assert.equal(m.h, DUNGEON_SIZES[1].h);
});

test("names must be given and not repeat, ignoring case", () => {
  fresh();
  const d = createDungeon("Crypt", "small");
  assert.equal(dungeonNameProblem("  ", null), "Give the dungeon a name.");
  assert.equal(dungeonNameProblem("crypt", null), "You already have a dungeon called crypt.");
  assert.equal(dungeonNameProblem("Crypt", d.id), "");
  assert.equal(dungeonNameProblem("Tomb", null), "");
});

test("saved dungeons survive a reload, newest first, and a map saves its dungeon", async () => {
  fresh();
  const a = createDungeon("Crypt", "small");
  await new Promise((r) => setTimeout(r, 5));
  createDungeon("Mine", "small");
  fillRect(a.maps[0], 1, 1, 3, 2, FLOOR);
  await new Promise((r) => setTimeout(r, 5));
  saveDungeon(a.maps[0]);
  loadDungeons();
  assert.deepEqual(getDungeons().map((d) => d.name), ["Crypt", "Mine"]);
  assert.equal(cellAt(getDungeon(a.id).maps[0], 2, 2), FLOOR);
  assert.equal(dungeonOfMap(a.maps[0].id).id, a.id);
  assert.equal(findMap("nope"), null);
});

test("broken saved data is cleaned: size held to the limits, unknown squares made rock", () => {
  fresh();
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([
    { id: "a", name: "Huge", maps: [{ id: "m", w: 500, h: 2, cells: "..?" }, null, "x"] },
    { id: "b", name: "Empty", maps: [] },
    null, [1, 2], "text"
  ]));
  loadDungeons();
  assert.equal(getDungeons().length, 2);
  const d = findMap("m");
  assert.equal(d.w, MAX_SIDE);
  assert.equal(d.h, MIN_SIDE);
  assert.equal(d.cells.length, MAX_SIDE * MIN_SIDE);
  assert.equal(d.cells.slice(0, 4), ".." + ROCK + ROCK);
  assert.equal(getDungeon("a").maps.length, 1);
  assert.equal(getDungeon("b").maps.length, 1, "a dungeon always has a map");
});

test("a map saved before dungeons held several maps becomes a one-map dungeon, keeping its id", () => {
  fresh();
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([
    { id: "old", name: "Sunken crypt", w: 10, h: 10, cells: "..", revealed: "1", style: "cave", party: { x: 0, y: 0 }, updated: 5 }
  ]));
  loadDungeons();
  const [dg] = getDungeons();
  assert.equal(dg.name, "Sunken crypt");
  assert.equal(dg.updated, 5);
  assert.equal(dg.maps.length, 1);
  const m = dg.maps[0];
  assert.equal(m.id, "old", "a players' tab showing it still finds it");
  assert.equal(m.name, "Map 1");
  assert.equal(m.cells.slice(0, 2), "..");
  assert.equal(m.revealed.slice(0, 2), "10");
  assert.equal(m.style, "cave");
  assert.deepEqual(m.party, { x: 0, y: 0 });
  assert.notEqual(dg.id, m.id);
});

test("delete, duplicate under a free name with new map ids, and import renaming clashes", () => {
  fresh();
  const d = createDungeon("Crypt", "small");
  fillRect(d.maps[0], 0, 0, 2, 2, FLOOR);
  saveDungeon(d);
  const c1 = duplicateDungeon(d.id);
  const c2 = duplicateDungeon(d.id);
  assert.equal(c1.name, "Crypt (copy)");
  assert.equal(c2.name, "Crypt (copy 2)");
  assert.equal(c1.maps[0].cells, d.maps[0].cells);
  assert.notEqual(c1.id, d.id);
  assert.notEqual(c1.maps[0].id, d.maps[0].id);
  assert.equal(importDungeons([{ name: "Crypt", w: 10, h: 10, cells: "" }, null, "x"]), 1, "an old single map file imports too");
  assert.ok(getDungeons().some((x) => x.name === "Crypt (imported)"));
  deleteDungeon(d.id);
  assert.equal(getDungeon(d.id), null);
  assert.equal(getDungeons().length, 3);
});

test("a dungeon's maps: added after the one open, like it, reordered, renamed, removed but never the last", () => {
  fresh();
  const dg = createDungeon("Crypt", "small");
  const first = dg.maps[0];
  first.style = "cave";
  const m2 = addMap(dg, first.id);
  assert.equal(m2.name, "Map 2");
  assert.equal(m2.w, 24);
  assert.equal(m2.style, "cave", "same size and style as the map it follows");
  const m3 = addMap(dg, first.id);
  assert.deepEqual(dg.maps.map((m) => m.name), ["Map 1", "Map 3", "Map 2"], "right after the one open");
  assert.equal(moveMap(dg, m3.id, 1), true);
  assert.deepEqual(dg.maps.map((m) => m.name), ["Map 1", "Map 2", "Map 3"]);
  assert.equal(moveMap(dg, m3.id, 1), false, "already last");
  assert.equal(renameMap(dg, m2.id, "  Level 1 "), true);
  assert.equal(renameMap(dg, m2.id, ""), false);
  assert.equal(m2.name, "Level 1");
  assert.equal(mapTitle(dg, m2), "Crypt · Level 1");
  assert.equal(removeMap(dg, first.id), true);
  assert.equal(removeMap(dg, m2.id), true);
  assert.equal(removeMap(dg, m3.id), false, "the last map stays");
  assert.equal(mapTitle(dg, m3), "Crypt", "one map: just the dungeon's name");
  for(let i = 0; i < 40; i++) addMap(dg, m3.id);
  assert.equal(dg.maps.length, 30, "up to 30 maps");
  assert.equal(addMap(dg, m3.id), null);
});

test("painting reports a change only when a square changes, and ignores squares off the map", () => {
  fresh();
  const d = newMap("Crypt", "small");
  assert.equal(paintCells(d, [[0, 0], [1, 0]], FLOOR), true);
  assert.equal(paintCells(d, [[0, 0], [1, 0]], FLOOR), false);
  assert.equal(paintCells(d, [[-1, 0], [99, 99]], FLOOR), false);
  assert.equal(paintCells(d, [[2, 0]], "?"), false);
  assert.equal(cellAt(d, 0, 0), FLOOR);
  assert.equal(cellAt(d, 2, 0), ROCK);
  assert.equal(cellAt(d, -5, 0), ROCK);
  assert.ok(isOpen(d, 1, 0));
  assert.ok(!isOpen(d, 1, 1));
});

test("a room fills the box between two corners dragged in any direction, clipped to the map", () => {
  fresh();
  const d = newMap("Crypt", "small");
  blankMap(d, 8, 8);
  assert.equal(fillRect(d, 3, 2, 1, 1, FLOOR), true);
  assert.deepEqual(rows(d).slice(0, 4), ["        ", " ...    ", " ...    ", "        "]);
  fillRect(d, 6, 6, 20, 20, "~");
  assert.deepEqual(rows(d).slice(6), ["      ~~", "      ~~"]);
  assert.deepEqual(contentBounds(d), { x: 1, y: 1, w: 7, h: 7 });
});

test("a brush line steps square by square with no diagonal gaps", () => {
  assert.deepEqual(lineCells(2, 2, 2, 2), [[2, 2]]);
  assert.deepEqual(lineCells(0, 0, 3, 0), [[0, 0], [1, 0], [2, 0], [3, 0]]);
  assert.deepEqual(lineCells(0, 3, 0, 0), [[0, 3], [0, 2], [0, 1], [0, 0]]);
  for(const [ax, ay, bx, by] of [[0, 0, 5, 3], [5, 3, 0, 0], [0, 0, -4, 7], [3, 1, 3, -6], [0, 0, 6, 6]]){
    const line = lineCells(ax, ay, bx, by);
    assert.deepEqual(line[0], [ax, ay]);
    assert.deepEqual(line[line.length - 1], [bx, by]);
    assert.equal(line.length, Math.abs(bx - ax) + Math.abs(by - ay) + 1);
    for(let i = 1; i < line.length; i++){
      const step = Math.abs(line[i][0] - line[i - 1][0]) + Math.abs(line[i][1] - line[i - 1][1]);
      assert.equal(step, 1, "squares touch by a side");
    }
  }
});

test("a door runs the way of its corridor", () => {
  fresh();
  const d = newMap("Crypt", "small");
  // A corridor running left to right, a door in it.
  paintCells(d, [[1, 1], [2, 1], [3, 1]], FLOOR);
  paintCells(d, [[2, 1]], "+");
  assert.equal(passageAxis(d, 2, 1), "h");
  // A corridor running top to bottom.
  paintCells(d, [[6, 1], [6, 2], [6, 3]], FLOOR);
  assert.equal(passageAxis(d, 6, 2), "v");
});

test("resizing keeps the map centred, warns before cutting off floor, and stays in the limits", () => {
  fresh();
  const d = newMap("Crypt", "small");
  blankMap(d, 8, 8);
  fillRect(d, 3, 3, 4, 4, FLOOR);
  assert.equal(resizeLoses(d, 12, 12), false);
  assert.equal(resizeDungeon(d, 12, 12), true);
  assert.deepEqual(contentBounds(d), { x: 5, y: 5, w: 2, h: 2 });
  assert.equal(resizeLoses(d, 8, 8), false);
  assert.equal(resizeLoses(d, 9, 9), false);
  fillRect(d, 0, 0, 0, 0, FLOOR);
  assert.equal(resizeLoses(d, 10, 10), true);
  assert.equal(resizeDungeon(d, 12, 12), false);
  resizeDungeon(d, 2, 999);
  assert.equal(d.w, MIN_SIDE);
  assert.equal(d.h, MAX_SIDE);
  assert.equal(d.cells.length, MIN_SIDE * MAX_SIDE);
});

test("clearing turns the whole map back to rock", () => {
  fresh();
  const d = newMap("Crypt", "small");
  assert.equal(clearDungeon(d), false);
  fillRect(d, 0, 0, 5, 5, FLOOR);
  assert.equal(clearDungeon(d), true);
  assert.ok(isBlank(d));
});

test("undo and redo walk back and forth through changes, a resize included", () => {
  fresh();
  const d = newMap("Crypt", "small");
  const h = createHistory();
  assert.equal(h.canUndo(), false);
  const start = d.cells;

  let before = h.snapshot(d);
  fillRect(d, 0, 0, 2, 2, FLOOR);
  h.record(before);
  const room = d.cells;

  before = h.snapshot(d);
  resizeDungeon(d, 30, 20);
  h.record(before);

  assert.equal(h.undo(d), true);
  assert.equal(d.w, 24);
  assert.equal(d.cells, room);
  assert.equal(h.undo(d), true);
  assert.equal(d.cells, start);
  assert.equal(h.undo(d), false);
  assert.equal(h.redo(d), true);
  assert.equal(d.cells, room);

  // A new change drops what could be redone.
  before = h.snapshot(d);
  paintCells(d, [[10, 10]], "~");
  h.record(before);
  assert.equal(h.canRedo(), false);
});

test("undo keeps only the most recent steps", () => {
  fresh();
  const d = newMap("Crypt", "small");
  const h = createHistory(3);
  for(let i = 0; i < 5; i++){
    const before = h.snapshot(d);
    paintCells(d, [[i, 0]], FLOOR);
    h.record(before);
  }
  let n = 0;
  while(h.undo(d)) n++;
  assert.equal(n, 3);
  assert.equal(cellAt(d, 1, 0), FLOOR);
  assert.equal(cellAt(d, 2, 0), ROCK);
});

test("every terrain but rock is open ground", () => {
  Object.entries(TERRAIN).forEach(([code, t]) => assert.equal(t.open, code !== ROCK, t.id));
});

/* ---- fog of war ---- */

/* Two rooms joined by a corridor with a door in it, a secret door off
   the right room, and a side passage off the left room. */
const CRYPT = [
  "               ",
  " ...     ....  ",
  " ...+..  .... s",
  " ...  ....... .",
  "  .      ....  ",
  "  .            "
];

test("a new map is all fog, and only open ground can be shown", () => {
  const d = drawn(CRYPT);
  assert.equal(anyRevealed(d), false);
  assert.equal(setRevealed(d, [[0, 0]], true), false, "rock stays in fog");
  assert.equal(setRevealed(d, [[1, 1]], true), true);
  assert.equal(setRevealed(d, [[1, 1]], true), false, "no change the second time");
  assert.ok(isRevealed(d, 1, 1));
  assert.ok(anyRevealed(d));
  assert.equal(setRevealed(d, [[1, 1]], false), true);
  assert.equal(anyRevealed(d), false);
});

test("tapping a room shows the room, its doors and the first square of each corridor out", () => {
  const d = drawn(CRYPT);
  assert.equal(toggleArea(d, 2, 2), true);
  assert.deepEqual(fog(d), [
    "...............",
    ".###...........",
    ".####..........",
    ".###...........",
    "..#............",
    "..............."
  ]);
});

test("tapping a corridor shows it up to the rooms and doors at its ends, and those doors", () => {
  const d = drawn(CRYPT);
  toggleArea(d, 5, 2);
  // From the door at (4,2) along to the right room, which stays hidden.
  assert.deepEqual(fog(d).slice(1, 4), [
    "...............",
    "....###........",
    "......###......"
  ]);
  const side = drawn(CRYPT);
  toggleArea(side, 2, 5);
  assert.deepEqual(fog(side).slice(3), ["...............", "..#............", "..#............"], "the side passage stops at the room");
});

test("secret doors stay hidden until tapped themselves", () => {
  const d = drawn(CRYPT);
  toggleArea(d, 11, 2);
  assert.equal(isRevealed(d, 14, 2), false, "the room doesn't give the secret door away");
  assert.equal(isRevealed(d, 14, 3), false, "nor what is behind it");
  assert.deepEqual(areaAt(d, 14, 2), [[14, 2]]);
  toggleArea(d, 14, 2);
  assert.ok(isRevealed(d, 14, 2));
  assert.deepEqual(areaAt(d, 0, 0), [], "rock is no area");
});

test("tapping an area the players can already see hides it again", () => {
  const d = drawn(CRYPT);
  toggleArea(d, 2, 2);
  const shown = d.revealed;
  assert.equal(toggleArea(d, 2, 1), true);
  assert.equal(anyRevealed(d), false);
  // Partly shown: a tap shows the rest rather than hiding.
  setRevealed(d, [[1, 1]], true);
  toggleArea(d, 2, 2);
  assert.equal(d.revealed, shown);
});

test("show all reveals only open ground, hide all puts everything back in fog", () => {
  const d = drawn(CRYPT);
  assert.equal(revealAll(d, true), true);
  assert.equal(revealAll(d, true), false);
  assert.ok(isRevealed(d, 14, 2));
  assert.ok(!isRevealed(d, 0, 0));
  assert.equal(revealAll(d, false), true);
  assert.equal(anyRevealed(d), false);
});

test("erasing a shown square puts it back in fog, and floor painted later starts hidden", () => {
  const d = drawn(CRYPT);
  revealAll(d, true);
  paintCells(d, [[1, 1]], ROCK);
  assert.equal(isRevealed(d, 1, 1), false);
  paintCells(d, [[1, 1]], FLOOR);
  assert.equal(isRevealed(d, 1, 1), false);
  paintCells(d, [[2, 1]], "~");
  assert.equal(isRevealed(d, 2, 1), true, "repainting shown ground keeps it shown");
  clearDungeon(d);
  assert.equal(anyRevealed(d), false);
});

test("fog moves with the map when it is resized, and undo brings fog back", () => {
  const d = drawn(CRYPT);
  const h = createHistory();
  let before = h.snapshot(d);
  toggleArea(d, 2, 2);
  h.record(before);
  const shown = fog(d);
  before = h.snapshot(d);
  resizeDungeon(d, 19, 9);
  h.record(before);
  assert.ok(isRevealed(d, 2 + 2, 2 + 1), "shifted with the map");
  assert.equal(d.revealed.length, 19 * 9);
  assert.equal(h.undo(d), true);
  assert.deepEqual(fog(d), shown);
  assert.equal(h.same(d, h.snapshot(d)), true);
  assert.equal(h.undo(d), true);
  assert.equal(anyRevealed(d), false);
});

test("saved fog is cleaned: the right length, and never on rock", () => {
  fresh();
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([
    { id: "a", name: "Old", w: 8, h: 8, cells: "..  ", revealed: "1111x" },
    { id: "b", name: "Older", w: 8, h: 8, cells: "." }
  ]));
  loadDungeons();
  const a = findMap("a"), b = findMap("b");
  assert.equal(a.revealed.length, 64);
  assert.equal(a.revealed.slice(0, 5), "11000");
  assert.equal(b.revealed, "0".repeat(64));
});

/* ---- the players' view ---- */

test("the players' map holds only what they were shown", () => {
  const d = drawn(CRYPT);
  toggleArea(d, 2, 2);
  const p = playerView(d);
  assert.equal(p.w, d.w);
  assert.equal(p.h, d.h);
  assert.equal(p.revealed, d.revealed);
  assert.deepEqual(rows(p), [
    "               ",
    " ...           ",
    " ...+?         ",
    " ...           ",
    "  .            ",
    "  ?            "
  ].map((r) => r.replace(/\?/g, FOG_EDGE)));
  // The door in the room's wall is shown, the corridor behind it is open fog.
});

test("a hidden secret door stays rock to the players, a shown one is a plain door", () => {
  const d = drawn(CRYPT);
  toggleArea(d, 11, 2);
  assert.equal(playerView(d).cells.charAt(2 * d.w + 14), ROCK);
  toggleArea(d, 14, 2);
  const p = playerView(d);
  assert.equal(p.cells.charAt(2 * d.w + 14), "+");
  assert.equal(p.cells.charAt(3 * d.w + 14), FOG_EDGE, "the passage behind it is open but fogged");
  assert.ok(!p.cells.includes("s"));
});

test("nothing shown means nothing but rock for the players", () => {
  const d = drawn(CRYPT);
  const p = playerView(d);
  assert.equal(p.cells, ROCK.repeat(d.w * d.h));
  assert.equal(revealedBounds(d), null);
  toggleArea(d, 5, 2);
  assert.deepEqual(revealedBounds(d), { x: 4, y: 2, w: 5, h: 2 });
});

test("a map is drawn in stone unless the DM picks cave, and the players get the same style", () => {
  fresh();
  const d = newMap("Mine", "small");
  assert.equal(d.style, "stone");
  assert.equal(setDungeonStyle(d, "cave"), true);
  assert.equal(setDungeonStyle(d, "cave"), false);
  assert.equal(setDungeonStyle(d, "lava"), false);
  assert.equal(playerView(d).style, "cave");
  saveDungeon(d);
  loadDungeons();
  assert.equal(findMap(d.id).style, "cave");
  assert.deepEqual(DUNGEON_STYLES.map((st) => st.id), ["stone", "cave", "classic", "wood", "ice", "volcanic", "overgrown"]);
  assert.equal(setDungeonStyle(d, "volcanic"), true);
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([{ id: "x", name: "Odd", style: "lava" }]));
  loadDungeons();
  assert.equal(findMap("x").style, "stone");
});

/* ---- the party ---- */

test("the party goes only on open ground and sees its room, the doors in its walls and nothing behind them", () => {
  const d = drawn(CRYPT);
  assert.equal(placeParty(d, 0, 0), false, "not on rock");
  assert.equal(d.party, null);
  assert.equal(placeParty(d, 2, 2), true);
  assert.deepEqual(d.party, { x: 2, y: 2 });
  assert.deepEqual(fog(d), [
    "...............",
    ".###...........",
    ".####..........",
    ".###...........",
    "..#............",
    "..#............"
  ]);
});

test("walking the party shows what they see at every step, and a secret door stays hidden", () => {
  const d = drawn(CRYPT);
  placeParty(d, 2, 2);
  assert.equal(walkParty(d, 6, 2), true);
  assert.deepEqual(d.party, { x: 6, y: 2 }, "through the door to the corridor's end");
  assert.ok(isRevealed(d, 5, 2) && isRevealed(d, 6, 3), "the corridor");
  assert.equal(isRevealed(d, 10, 3), false, "the right room is round the bend, out of sight");
  walkParty(d, 6, 3);
  walkParty(d, 9, 3);
  assert.deepEqual(d.party, { x: 9, y: 3 });
  assert.ok(isRevealed(d, 10, 3) && isRevealed(d, 12, 1), "round the bend, the right room");
  assert.equal(isRevealed(d, 14, 2), false, "but never the secret door");
  assert.equal(isRevealed(d, 14, 3), false, "nor what is behind it");
});

test("a walk stops at rock", () => {
  const d = drawn(CRYPT);
  placeParty(d, 2, 2);
  walkParty(d, 2, 0);
  assert.deepEqual(d.party, { x: 2, y: 1 });
  walkParty(d, 8, 1);
  assert.deepEqual(d.party, { x: 3, y: 1 }, "stopped at the room's wall");
});

test("sight reaches 60 feet and is blocked by walls", () => {
  fresh();
  const d = newMap("Hall", "small");
  blankMap(d, 30, 3);
  fillRect(d, 0, 1, 29, 1, FLOOR);
  const seen = sightFrom(d, 0, 1).map(([x]) => x);
  assert.equal(Math.max(...seen), SIGHT, "12 squares down a straight hall");
  paintCells(d, [[5, 1]], ROCK);
  assert.equal(Math.max(...sightFrom(d, 0, 1).map(([x]) => x)), 4, "not past a wall");
});

test("the party moves with the map, leaves it when its square is erased, and undo brings it back", () => {
  const d = drawn(CRYPT);
  const h = createHistory();
  let before = h.snapshot(d);
  placeParty(d, 2, 2);
  h.record(before);
  resizeDungeon(d, 19, 10);
  assert.deepEqual(d.party, { x: 4, y: 4 });
  before = h.snapshot(d);
  paintCells(d, [[4, 4]], ROCK);
  h.record(before);
  assert.equal(d.party, null);
  h.undo(d);
  assert.deepEqual(d.party, { x: 4, y: 4 });
  assert.equal(h.same(d, h.snapshot(d)), true);
  assert.equal(removeParty(d), true);
  assert.equal(removeParty(d), false);
  clearDungeon(d);
  assert.equal(d.party, null);
});

test("the players see the party once its square is shown, and saved parties are cleaned", () => {
  const d = drawn(CRYPT);
  placeParty(d, 2, 2);
  assert.deepEqual(playerView(d).party, { x: 2, y: 2 });
  revealAll(d, false);
  assert.equal(playerView(d).party, null, "hidden square, hidden party");
  fresh();
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([
    { id: "a", w: 8, h: 8, cells: "..", party: { x: 1, y: 0 } },
    { id: "b", w: 8, h: 8, cells: "..", party: { x: 5, y: 5 } },
    { id: "c", w: 8, h: 8, cells: "..", party: "here" }
  ]));
  loadDungeons();
  assert.deepEqual(findMap("a").party, { x: 1, y: 0 });
  assert.equal(findMap("b").party, null, "not on rock");
  assert.equal(findMap("c").party, null);
});

test("the players' screen fits what is shown, and follows the party once that gets too big", async () => {
  const { playersFit } = await import("../js/render/dungeon-canvas.js");
  fresh();
  const d = newMap("Halls", "large");
  fillRect(d, 1, 1, 48, 3, FLOOR);
  setRevealed(d, [[2, 2], [3, 2], [4, 2]], true);
  let cam = playersFit(playerView(d), 1000, 600);
  assert.equal(cam.x, 3.5, "a little shown: fitted, centred on it");
  assert.equal(cam.scale, 60, "never closer than 10 squares across");
  revealAll(d, true);
  placeParty(d, 40, 2);
  cam = playersFit(playerView(d), 1000, 600);
  assert.equal(cam.x, 40.5, "a long hall shown: the view follows the party");
  assert.equal(cam.scale, 25, "24 squares across the short side");
  removeParty(d);
  cam = playersFit(playerView(d), 1000, 600);
  assert.ok(cam.scale < 25 && cam.x === 25, "no party: the whole hall is fitted");
  assert.equal(playersFit(playerView(newMap("Empty", "small")), 1000, 600), null);
});

test("in a room only partly shown, hidden floor touching what's shown at a corner stays open fog, never a wall", () => {
  fresh();
  const d = newMap("Hall", "small");
  blankMap(d, 8, 8);
  fillRect(d, 1, 1, 6, 6, FLOOR);
  setRevealed(d, [[2, 2], [3, 2], [2, 3]], true);
  const p = playerView(d);
  const at = (x, y) => p.cells.charAt(y * p.w + x);
  assert.equal(at(3, 3), FOG_EDGE, "a corner neighbour");
  assert.equal(at(4, 4), ROCK, "two squares away: rock, under the fog");
});

test("a map dragged to a new place: the others close up around it", () => {
  fresh();
  const dg = createDungeon("Crypt", "small");
  for(let i = 0; i < 4; i++) addMap(dg, dg.maps[dg.maps.length - 1].id);
  const names = () => dg.maps.map((m) => m.name).join(",");
  assert.equal(names(), "Map 1,Map 2,Map 3,Map 4,Map 5");
  assert.equal(placeMap(dg, dg.maps[3].id, 0), true);
  assert.equal(names(), "Map 4,Map 1,Map 2,Map 3,Map 5", "dragged to the top");
  assert.equal(placeMap(dg, dg.maps[0].id, 9), true);
  assert.equal(names(), "Map 1,Map 2,Map 3,Map 5,Map 4", "past the end: last");
  assert.equal(placeMap(dg, dg.maps[2].id, 2), false, "dropped where it was");
  assert.equal(placeMap(dg, "nope", 0), false);
});

test("each map sets how far the party sees: 60 ft unless changed, any range up to 300 ft, or no limit", () => {
  fresh();
  const d = newMap("Hall", "small");
  assert.equal(d.sight, SIGHT, "60 feet to start");
  blankMap(d, 70, 3);
  fillRect(d, 0, 1, 69, 1, FLOOR);
  const far = () => Math.max(...sightFrom(d, 0, 1).map(([x]) => x));
  assert.equal(far(), 12);
  assert.equal(setSight(d, 8), true);
  assert.equal(far(), 8, "torchlight: 40 feet");
  assert.equal(setSight(d, 8), false);
  setSight(d, 0);
  assert.equal(far(), 69, "daylight: no limit");
  setSight(d, 999);
  assert.equal(d.sight, SIGHT_MAX);
  assert.deepEqual(SIGHT_OPTIONS.map((o) => o.squares), [2, 8, 12, 24, 0]);
});

test("more sight shows more around a party already on the map, as one undo step", () => {
  fresh();
  const d = newMap("Hall", "small");
  blankMap(d, 40, 3);
  fillRect(d, 0, 1, 39, 1, FLOOR);
  setSight(d, 2);
  placeParty(d, 0, 1);
  assert.ok(isRevealed(d, 2, 1) && !isRevealed(d, 3, 1), "candlelight: 10 feet");
  const h = createHistory();
  const before = h.snapshot(d);
  setSight(d, 8);
  h.record(before);
  assert.ok(isRevealed(d, 8, 1) && !isRevealed(d, 9, 1), "torchlight shows 40 feet straight away");
  h.undo(d);
  assert.equal(d.sight, 2);
  assert.ok(!isRevealed(d, 3, 1), "undo takes back the light and what it showed");
  setSight(d, 0);
  assert.ok(isRevealed(d, 39, 1));
  setSight(d, 2);
  assert.ok(isRevealed(d, 39, 1), "less light doesn't hide what was seen");
});

test("a new map gets the sight of the map it follows, and saved sight is cleaned", () => {
  fresh();
  const dg = createDungeon("Crypt", "small");
  setSight(dg.maps[0], 8);
  assert.equal(addMap(dg, dg.maps[0].id).sight, 8);
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([{ id: "a", name: "A", maps: [
    { id: "m1", sight: 0 }, { id: "m2", sight: -3 }, { id: "m3", sight: "lots" }, { id: "m4", sight: 500 }
  ] }]));
  loadDungeons();
  assert.deepEqual(["m1", "m2", "m3", "m4"].map((id) => findMap(id).sight), [0, SIGHT, SIGHT, SIGHT_MAX]);
});

/* ---- doors ---- */

/* A hall with a door in it: the party at the left end. */
function hallWithDoor(){
  fresh();
  const d = newMap("Hall", "small");
  blankMap(d, 20, 3);
  fillRect(d, 0, 1, 19, 1, FLOOR);
  paintCells(d, [[5, 1]], "+");
  return d;
}

test("a closed door blocks the party's sight, an open one doesn't", () => {
  const d = hallWithDoor();
  placeParty(d, 0, 1);
  assert.ok(isRevealed(d, 5, 1) && !isRevealed(d, 6, 1), "they see the door, not past it");
  assert.equal(toggleDoor(d, 5, 1), true);
  assert.equal(cellAt(d, 5, 1), "/");
  assert.ok(isRevealed(d, 12, 1), "opening it shows what lies beyond, straight away");
  assert.equal(toggleDoor(d, 5, 1), true);
  assert.equal(cellAt(d, 5, 1), "+", "and it closes again");
  assert.ok(isRevealed(d, 12, 1), "closing doesn't hide what was seen");
  assert.equal(toggleDoor(d, 3, 1), false, "floor is no door");
  assert.ok(isDoor(d, 5, 1) && !isDoor(d, 4, 1));
});

test("the party opens a closed door they walk onto, and it stays open behind them", () => {
  const d = hallWithDoor();
  placeParty(d, 0, 1);
  walkParty(d, 8, 1);
  assert.deepEqual(d.party, { x: 8, y: 1 });
  assert.equal(cellAt(d, 5, 1), "/");
  walkParty(d, 0, 1);
  assert.equal(cellAt(d, 5, 1), "/", "still open");
});

test("a secret door opens as a found, open door, shown to the players", () => {
  const d = hallWithDoor();
  paintCells(d, [[5, 1]], "s");
  placeParty(d, 0, 1);
  assert.equal(isRevealed(d, 5, 1), false, "unfound, it stays hidden");
  toggleDoor(d, 5, 1);
  assert.equal(cellAt(d, 5, 1), "/");
  assert.ok(isRevealed(d, 5, 1) && isRevealed(d, 10, 1));
  assert.equal(playerView(d).cells.charAt(1 * d.w + 5), "/", "the players see it open");
});

test("open doors still split areas for a tap, and a room tap shows them", () => {
  const d = drawn(CRYPT);
  toggleDoor(d, 4, 2);
  revealAll(d, false);
  toggleArea(d, 2, 2);
  assert.ok(isRevealed(d, 4, 2), "the open door in the room's wall is shown");
  assert.equal(isRevealed(d, 5, 2), false, "but not the corridor past it");
  assert.deepEqual(areaAt(d, 4, 2), [[4, 2]], "an open door is only itself");
});

/* ---- the DM's notes ---- */

test("notes are numbered from 1, one per square, filling gaps left by deleted ones", () => {
  fresh();
  const d = newMap("Crypt", "small");
  const a = addNote(d, 2, 2), b = addNote(d, 5, 5), c = addNote(d, 8, 1);
  assert.deepEqual([a.n, b.n, c.n], [1, 2, 3]);
  assert.equal(addNote(d, 2, 2), null, "one note a square");
  assert.equal(addNote(d, -1, 0), null, "on the map only");
  assert.equal(removeNote(d, b.id), true);
  assert.equal(addNote(d, 9, 9).n, 2, "the free number 2 is used again");
  assert.deepEqual(notesInOrder(d).map((n) => n.n), [1, 2, 3]);
  assert.equal(noteAt(d, 8, 1), c);
  assert.equal(noteAt(d, 0, 0), null);
});

test("a note's text is kept and held to its length, and notes move only to free squares", () => {
  fresh();
  const d = newMap("Crypt", "small");
  const a = addNote(d, 2, 2), b = addNote(d, 4, 4);
  assert.equal(setNoteText(d, a.id, "Goblin guards. Chest under the bed."), true);
  assert.equal(setNoteText(d, a.id, "Goblin guards. Chest under the bed."), false);
  setNoteText(d, b.id, "x".repeat(5000));
  assert.equal(b.text.length, 1000);
  assert.equal(moveNote(d, a.id, 4, 4), false, "not onto another note");
  assert.equal(moveNote(d, a.id, 3, 3), true);
  assert.equal(noteAt(d, 3, 3).text, "Goblin guards. Chest under the bed.");
});

test("notes stay the DM's: saved and cleaned, moved with a resize, gone with a cleared map, never in the players' view", () => {
  fresh();
  const dg = createDungeon("Crypt", "small");
  const d = dg.maps[0];
  const h = createHistory();
  let before = h.snapshot(d);
  addNote(d, 2, 2);
  h.record(before);
  setNoteText(d, d.notes[0].id, "Secret: the floor is false");
  saveDungeon(d);
  loadDungeons();
  const again = findMap(d.id);
  assert.equal(again.notes[0].text, "Secret: the floor is false");
  assert.ok(!JSON.stringify(playerView(again)).includes("Secret"), "the players' map holds no notes");
  resizeDungeon(again, 30, 20);
  assert.deepEqual([again.notes[0].x, again.notes[0].y], [5, 4]);
  clearDungeon(again);
  assert.equal(again.notes.length, 0);
  assert.equal(h.undo(d), true);
  assert.equal(d.notes.length, 0, "undo takes back an added note");
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([{ id: "a", name: "A", maps: [{ id: "m", w: 10, h: 10, notes: [
    { x: 1, y: 1, n: 4, text: "kept" }, { x: 1, y: 1, n: 5 }, { x: 50, y: 1, n: 6 }, { x: 2, y: 2, n: 4 }, null, { x: 3, y: 3, n: "x" }
  ] }] }]));
  loadDungeons();
  assert.deepEqual(findMap("m").notes.map((n) => [n.x, n.y, n.n]), [[1, 1, 4], [2, 2, 1], [3, 3, 2]], "repeats and broken numbers renumbered");
});

/* ---- stairs between maps ---- */

/* A dungeon of three maps: stairs at (2,2) on the first, one staircase
   at (5,5) on the second, two on the third. */
function levels(){
  fresh();
  const dg = createDungeon("Tower", "small");
  const [a] = dg.maps;
  const b = addMap(dg, a.id), c = addMap(dg, b.id);
  fillRect(a, 1, 1, 4, 4, FLOOR); paintCells(a, [[2, 2]], ">");
  fillRect(b, 4, 4, 7, 7, FLOOR); paintCells(b, [[5, 5]], ">");
  fillRect(c, 1, 1, 9, 3, FLOOR); paintCells(c, [[2, 2], [8, 2]], ">");
  return { dg, a, b, c };
}

test("stairs link to another map of the dungeon, and a lone staircase there links back", () => {
  const { dg, a, b, c } = levels();
  assert.deepEqual(stairsOf(c), [[2, 2], [8, 2]]);
  assert.equal(linkStairs(dg, a, 3, 3, b.id), false, "only stairs can lead somewhere");
  assert.equal(linkStairs(dg, a, 2, 2, a.id), false, "not to their own map");
  assert.equal(linkStairs(dg, a, 2, 2, b.id), true);
  assert.deepEqual(linkAt(a, 2, 2), { x: 2, y: 2, to: b.id });
  assert.deepEqual(linkAt(b, 5, 5), { x: 5, y: 5, to: a.id }, "linked back by itself");
  assert.equal(linkStairs(dg, a, 2, 2, b.id), false, "already so");
  assert.equal(linkStairs(dg, b, 5, 5, c.id), true);
  assert.equal(c.links.length, 0, "two staircases there: no guessing which one leads back");
  assert.equal(linkStairs(dg, b, 5, 5, null), true, "and they can lead nowhere again");
  assert.equal(linkAt(b, 5, 5), null);
});

test("the party comes out on the stairs leading back, or else the first staircase", () => {
  const { dg, a, b, c } = levels();
  linkStairs(dg, a, 2, 2, b.id);
  assert.deepEqual(arrivalSquare(b, a.id), [5, 5]);
  linkStairs(dg, c, 8, 2, b.id);
  assert.deepEqual(arrivalSquare(c, b.id), [8, 2], "the one that leads back");
  assert.deepEqual(arrivalSquare(c, a.id), [2, 2], "none leads back: the first");
  const blank = addMap(dg, c.id);
  assert.equal(arrivalSquare(blank, a.id), null);
});

test("links go when their stairs or their map do, follow a resize, and survive copies and imports", () => {
  const { dg, a, b, c } = levels();
  linkStairs(dg, a, 2, 2, b.id);
  linkStairs(dg, c, 8, 2, b.id);
  paintCells(c, [[8, 2]], FLOOR);
  assert.equal(c.links.length, 0, "stairs painted over: link gone");
  resizeDungeon(a, 30, 20);
  assert.deepEqual(linkAt(a, 5, 4), { x: 5, y: 4, to: b.id }, "moved with the map");
  saveDungeon(dg);
  const copy = duplicateDungeon(dg.id);
  const [ca, cb] = copy.maps;
  assert.equal(linkAt(ca, 5, 4).to, cb.id, "a copy's stairs lead to the copy's maps");
  importDungeons([JSON.parse(JSON.stringify(dg))]);
  const imported = getDungeons().find((x) => x.name === "Tower (imported)");
  assert.equal(linkAt(imported.maps[0], 5, 4).to, imported.maps[1].id, "and an import's to its own");
  removeMap(dg, b.id);
  assert.equal(a.links.length, 0, "the map they led to deleted: link gone");
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([{ id: "t", name: "T", maps: [
    { id: "m1", w: 8, h: 8, cells: ">", links: [{ x: 0, y: 0, to: "m2" }, { x: 1, y: 0, to: "m2" }] },
    { id: "m2", w: 8, h: 8, links: [{ x: 0, y: 0, to: "nowhere" }] }
  ] }]));
  loadDungeons();
  assert.deepEqual(findMap("m1").links, [{ x: 0, y: 0, to: "m2" }], "only on stairs");
  assert.deepEqual(findMap("m2").links, [], "only to maps that exist");
});

test("undo brings back a link along with the stairs", () => {
  const { dg, a, b } = levels();
  linkStairs(dg, a, 2, 2, b.id);
  const h = createHistory();
  const before = h.snapshot(a);
  paintCells(a, [[2, 2]], FLOOR);
  h.record(before);
  assert.equal(a.links.length, 0);
  h.undo(a);
  assert.deepEqual(linkAt(a, 2, 2).to, b.id);
});

/* ---- light ---- */

/* A long hall: the party at the left end sees 60 feet. */
function longHall(){
  fresh();
  const d = newMap("Hall", "large");
  blankMap(d, 50, 3);
  fillRect(d, 0, 1, 49, 1, FLOOR);
  return d;
}

test("lit ground is seen from any distance in line of sight, dark ground only within sight", () => {
  const d = longHall();
  setLit(d, [[40, 1], [41, 1]], true);
  const seen = sightFrom(d, 0, 1).map(([x]) => x);
  assert.ok(seen.includes(12) && !seen.includes(13), "dark: 60 feet");
  assert.ok(seen.includes(40) && seen.includes(41), "lit: 200 feet away");
  paintCells(d, [[30, 1]], "+");
  assert.ok(!sightFrom(d, 0, 1).some(([x]) => x === 40), "but not through a closed door");
});

test("only open ground is lit, rock painted over a lit square puts it out, and lighting shows the party more at once", () => {
  const d = longHall();
  assert.equal(setLit(d, [[5, 0]], true), false, "rock stays dark");
  placeParty(d, 0, 1);
  assert.equal(isRevealed(d, 30, 1), false);
  assert.equal(setLit(d, [[30, 1]], true), true);
  assert.ok(isLit(d, 30, 1));
  assert.ok(isRevealed(d, 30, 1), "lighting it shows it to the party straight away");
  paintCells(d, [[30, 1]], ROCK);
  assert.equal(isLit(d, 30, 1), false);
  setLit(d, [[20, 1]], true);
  clearDungeon(d);
  assert.equal(d.lit.includes("1"), false);
});

test("a tap with the Light tool lights a whole room, and a second tap darkens it", () => {
  const d = drawn(CRYPT);
  assert.equal(toggleLitArea(d, 2, 2), true);
  assert.ok(isLit(d, 1, 1) && isLit(d, 3, 3) && isLit(d, 4, 2), "the room and its door");
  toggleLitArea(d, 2, 2);
  assert.equal(d.lit.includes("1"), false);
});

test("light moves with a resize, comes back with undo, and is cleaned when loaded", () => {
  const d = longHall();
  const h = createHistory();
  const before = h.snapshot(d);
  setLit(d, [[3, 1]], true);
  h.record(before);
  resizeDungeon(d, 54, 7);
  assert.ok(isLit(d, 5, 3));
  h.undo(d);
  assert.equal(d.lit.includes("1"), false);
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([{ id: "a", name: "A", maps: [{ id: "m", w: 8, h: 8, cells: "..", lit: "1111" }, { id: "n", w: 8, h: 8 }] }]));
  loadDungeons();
  assert.equal(findMap("m").lit.slice(0, 4), "1100", "never on rock");
  assert.equal(findMap("n").lit, "0".repeat(64));
});

/* ---- locked doors ---- */

test("a locked door stops the party's walk and their sight, and they can't stand on it", () => {
  const d = hallWithDoor();
  paintCells(d, [[5, 1]], "l");
  assert.ok(isLocked(d, 5, 1) && isDoor(d, 5, 1));
  placeParty(d, 0, 1);
  assert.ok(isRevealed(d, 5, 1) && !isRevealed(d, 6, 1), "they see the door, not past it");
  assert.equal(lockedAhead(d, 9, 1), true);
  walkParty(d, 9, 1);
  assert.deepEqual(d.party, { x: 4, y: 1 }, "the walk stops in front of it");
  assert.equal(cellAt(d, 5, 1), "l", "and doesn't open it");
  assert.equal(placeParty(d, 5, 1), false, "not onto it");
  assert.equal(lockedAhead(d, 4, 0), false, "a wall ahead isn't a lock");
});

test("unlocking opens the door; the players only ever see a closed door until then", () => {
  const d = hallWithDoor();
  paintCells(d, [[5, 1]], "l");
  placeParty(d, 0, 1);
  assert.equal(playerView(d).cells.charAt(d.w + 5), "+", "to the players it's just a door");
  assert.equal(toggleDoor(d, 5, 1), true);
  assert.equal(cellAt(d, 5, 1), "/", "unlocked and open");
  assert.ok(isRevealed(d, 10, 1), "and the party sees through");
  walkParty(d, 9, 1);
  assert.deepEqual(d.party, { x: 9, y: 1 });
});

/* ---- random dungeons ---- */

/* Every open square reachable from the first one, walking through any
   door: true if the map is all one piece. */
function allJoined(d){
  const open = [];
  for(let y = 0; y < d.h; y++) for(let x = 0; x < d.w; x++) if(isOpen(d, x, y)) open.push(x + "," + y);
  if(!open.length) return false;
  const seen = new Set([open[0]]), queue = [open[0]];
  while(queue.length){
    const [x, y] = queue.shift().split(",").map(Number);
    for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const k = (x + dx) + "," + (y + dy);
      if(!seen.has(k) && isOpen(d, x + dx, y + dy)){ seen.add(k); queue.push(k); }
    }
  }
  return seen.size === open.length;
}

test("a random map: rooms that don't touch, all joined by corridors, with doors and things in them", () => {
  for(const seed of [1, 2, 3, 42, 99, 2026]){
    fresh();
    const d = newMap("Test", "medium");
    const rooms = generateMap(d, { rng: makeRng(seed), notes: true });
    assert.ok(rooms.length >= 3, "seed " + seed + ": at least three rooms");
    assert.ok(allJoined(d), "seed " + seed + ": every room can be reached");
    assert.ok(/[+ls]/.test(d.cells), "seed " + seed + ": some doors");
    assert.ok(d.cells.includes(">"), "seed " + seed + ": stairs");
    assert.ok(d.lit.includes("1"), "seed " + seed + ": a lit room");
    assert.equal(d.notes.length, Math.min(3, rooms.length), "seed " + seed + ": notes in the first rooms");
    assert.ok(d.notes.every((n) => n.text.length > 10));
    for(let i = 0; i < rooms.length; i++) for(let j = i + 1; j < rooms.length; j++){
      const a = rooms[i], b = rooms[j];
      const apart = a.x + a.w + 1 <= b.x || b.x + b.w + 1 <= a.x || a.y + a.h + 1 <= b.y || b.y + b.h + 1 <= a.y;
      assert.ok(apart, "seed " + seed + ": rooms keep rock between them");
    }
    assert.ok(rooms.every((o) => o.x >= 1 && o.y >= 1 && o.x + o.w < d.w && o.y + o.h < d.h), "inside the map, with an edge of rock");
  }
});

test("the same seed rolls the same map, and more rooms are asked for with 'many' than 'few'", () => {
  fresh();
  const a = newMap("A", "large"), b = newMap("B", "large");
  generateMap(a, { rng: makeRng(7) });
  generateMap(b, { rng: makeRng(7) });
  assert.equal(a.cells, b.cells);
  const few = generateMap(newMap("C", "large"), { rooms: "few", rng: makeRng(5) }).length;
  const many = generateMap(newMap("D", "large"), { rooms: "many", rng: makeRng(5) }).length;
  assert.ok(many > few, few + " < " + many);
});

test("a random map replaces what was there: fog, party, notes and links start fresh", () => {
  const d = drawn(CRYPT);
  revealAll(d, true);
  placeParty(d, 2, 2);
  addNote(d, 1, 1);
  generateMap(d, { rng: makeRng(3) });
  assert.equal(d.revealed.includes("1"), false);
  assert.equal(d.party, null);
  assert.equal(d.notes.length, 0, "no notes unless asked");
});

test("a random dungeon: a free name, one style, two levels whose stairs lead to each other", () => {
  fresh();
  const dg = createRandomDungeon("medium", { rng: makeRng(11) });
  assert.match(dg.name, /^The \w+ \w+/);
  assert.deepEqual(dg.maps.map((m) => m.name), ["Level 1", "Level 2"]);
  assert.equal(dg.maps[0].style, dg.maps[1].style);
  const [one, two] = dg.maps;
  assert.equal(one.links.length, 1);
  assert.equal(one.links[0].to, two.id);
  assert.equal(two.links.length, 1);
  assert.equal(two.links[0].to, one.id);
  assert.deepEqual(arrivalSquare(two, one.id), [two.links[0].x, two.links[0].y], "going down, they arrive on the stairs back up");
  assert.ok(dg.maps.every(allJoined));
  const again = createRandomDungeon("small", { rng: makeRng(11), levels: 3 });
  assert.notEqual(again.name, dg.name, "names never repeat");
  assert.equal(again.maps.length, 3);
  assert.equal(again.maps[1].links.length, 2, "the middle level leads up and down");
  assert.ok(randomDungeonName(makeRng(1)).startsWith("The "));
  loadDungeons();
  assert.equal(getDungeons().length, 2, "both saved");
});

/* ---- pausing the players' screen ---- */
test("pausing the players' screen is saved until resumed", async () => {
  // The channel is opened on first use, and a real BroadcastChannel would
  // keep the test run open, so it stays out of reach for the whole test
  // (there's no players' tab to talk to here anyway).
  const channel = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = undefined;
  try{
    const { isPaused, setPaused } = await import("../js/core/dungeon-sync.js");
    localStorage.clear();
    assert.equal(isPaused(), false);
    setPaused(true);
    assert.equal(isPaused(), true);
    setPaused(false);
    assert.equal(isPaused(), false);
  }finally{
    globalThis.BroadcastChannel = channel;
  }
});

/* ---- round rooms and diagonal corridors ---- */

/* The map as rows: rock " ", whole floor ".", cut squares by corner. */
const shape = (d, x0, y0, x1, y1) => Array.from({ length: y1 - y0 + 1 }, (_, j) =>
  Array.from({ length: x1 - x0 + 1 }, (_, i) => {
    const x = x0 + i, y = y0 + j, c = cutAt(d, x, y);
    return c !== "0" ? c : cellAt(d, x, y);
  }).join(""));

test("a round room fills the oval in the box and cuts its stepped edge into slopes", () => {
  fresh();
  const d = newMap("Tower", "small");
  assert.equal(fillOval(d, 2, 2, 8, 8), true);
  assert.deepEqual(shape(d, 2, 2, 8, 8), [
    "  1.2  ",
    " 1...2 ",
    "1.....2",
    ".......",
    "4.....3",
    " 4...3 ",
    "  4.3  "
  ]);
  assert.equal(fillOval(d, 2, 2, 8, 8), false, "nothing new the second time");
  assert.equal(ovalCells(0, 0, 6, 2).length, 17, "a wide box makes an oval: its four corners left out");
});

test("a plain room's corners are never cut", () => {
  fresh();
  const d = newMap("Hall", "small");
  fillRect(d, 2, 2, 6, 5, FLOOR);
  assert.equal(d.cuts.replace(/0/g, ""), "");
});

test("a diagonal corridor runs at 45 degrees as far as the drag goes both ways, then straight on", () => {
  const c = diagonalCells(2, 2, 5, 8);
  assert.deepEqual(c.slant, [[2, 2], [3, 2], [3, 3], [4, 3], [4, 4], [5, 4], [5, 5]]);
  assert.deepEqual(c.all.slice(c.slant.length), [[5, 6], [5, 7], [5, 8]], "then straight down");
  assert.deepEqual(diagonalCells(5, 5, 2, 2).slant.at(-1), [2, 2], "any direction");
  fresh();
  const d = newMap("Mine", "small");
  assert.equal(carveDiagonal(d, 2, 2, 6, 6), true);
  assert.deepEqual(shape(d, 2, 2, 6, 6), [
    ".2   ",
    " 42  ",
    "  42 ",
    "   42",
    "    ."
  ]);
  // Every step of the stair is cut into a slope, so the corridor has two
  // straight walls: the outer corners (top right) and inner ones (bottom left).
  assert.equal(cutAt(d, 3, 2), "2");
  assert.equal(cutAt(d, 3, 3), "4");
  assert.equal(cutAt(d, 4, 3), "2");
  assert.equal(cutAt(d, 4, 4), "4");
  assert.equal(cutAt(d, 2, 2), "0", "the ends stay whole");
});

test("a diagonal corridor is dug through rock only, never over doors or water", () => {
  fresh();
  const d = newMap("Mine", "small");
  paintCells(d, [[3, 2]], "+");
  carveDiagonal(d, 2, 2, 6, 6);
  assert.equal(cellAt(d, 3, 2), "+");
});

test("painting over a cut square, or the rock beside its cut, makes it whole again", () => {
  fresh();
  const d = newMap("Mine", "small");
  carveDiagonal(d, 2, 2, 6, 6);
  assert.equal(cutAt(d, 3, 2), "2");
  paintCells(d, [[4, 2]], FLOOR);
  assert.equal(cutAt(d, 3, 2), "0", "its rock side became floor");
  assert.equal(cutAt(d, 3, 3), "4");
  paintCells(d, [[3, 3]], FLOOR);
  assert.equal(cutAt(d, 3, 3), "0", "painted over with floor: a whole square");
  paintCells(d, [[4, 4]], ROCK);
  assert.equal(cutAt(d, 4, 4), "0", "erased");
});

test("the players get the cuts of what they were shown, and cuts are saved, resized and undone", () => {
  fresh();
  const dg = createDungeon("Tower", "small");
  const d = dg.maps[0];
  const h = createHistory();
  const before = h.snapshot(d);
  fillOval(d, 2, 2, 8, 8);
  h.record(before);
  setRevealed(d, [[2, 4], [5, 5]], true);
  const p = playerView(d);
  assert.equal(p.cuts.charAt(4 * d.w + 2), "1", "a shown cut square");
  assert.equal(p.cuts.replace(/0/g, ""), "1", "and nothing else");
  saveDungeon(d);
  loadDungeons();
  const again = findMap(d.id);
  assert.equal(again.cuts, d.cuts);
  resizeDungeon(again, 28, 20);
  assert.equal(cutAt(again, 4, 6), "1", "moved with the map");
  h.undo(d);
  assert.equal(d.cuts.replace(/0/g, ""), "");
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([{ id: "a", name: "A", maps: [{ id: "m", w: 8, h: 8, cells: "  .. ...", cuts: "0011x2" }] }]));
  loadDungeons();
  assert.equal(findMap("m").cuts.slice(0, 8), "00100000", "only on floor, only where its rock side is rock");
});

/* ---- map pictures ---- */

test("a picture on a blank map makes the map its size; on a traced map it leaves the size alone", () => {
  fresh();
  const d = newMap("Module map", "small");
  setMapImage(d, "img1", 30.5, 0.7);
  assert.deepEqual(d.image, { id: "img1", ox: 0, oy: 0, across: 30.5, ratio: 0.7 });
  assert.deepEqual([d.w, d.h], [31, 22], "31 by 22 squares holds a picture 30.5 squares wide");
  const t = newMap("Traced", "small");
  fillRect(t, 2, 2, 5, 5, FLOOR);
  setMapImage(t, "img2", 40, 1);
  assert.deepEqual([t.w, t.h], [24, 16]);
  assert.deepEqual(imageFit(t), [40, 40]);
});

test("the picture is moved and sized, within limits, and moves with a resize", () => {
  fresh();
  const d = newMap("Module map", "small");
  fillRect(d, 2, 2, 5, 5, FLOOR);
  setMapImage(d, "img1", 20, 0.5);
  assert.equal(placeMapImage(d, { ox: 0.25, oy: -0.5 }), true);
  assert.equal(placeMapImage(d, { ox: 0.25 }), false, "no change");
  placeMapImage(d, { across: 0 });
  assert.equal(d.image.across, 1, "at least a square wide");
  placeMapImage(d, { across: 22 });
  resizeDungeon(d, 28, 20);
  assert.deepEqual([d.image.ox, d.image.oy], [2.25, 1.5], "moved with the map");
  assert.equal(cellAt(d, 4, 4), FLOOR, "and with the tracing");
});

test("on a picture fog clears on any square, traced or not, and erasing tracing doesn't hide it", () => {
  fresh();
  const d = newMap("Module map", "small");
  setMapImage(d, "img1", 24, 16 / 24);
  assert.equal(setRevealed(d, [[3, 3]], true), true, "untraced picture square");
  assert.equal(revealAll(d, true), true);
  assert.equal(d.revealed.includes("0"), false, "Show all shows the whole picture");
  fillRect(d, 2, 2, 4, 4, FLOOR);
  paintCells(d, [[3, 3]], ROCK);
  assert.ok(isRevealed(d, 3, 3), "erasing tracing leaves it shown");
  assert.equal(removeMapImage(d), true);
  assert.ok(!isRevealed(d, 10, 10) && isRevealed(d, 2, 2), "without the picture, only ground stays shown");
});

test("the players' map carries the picture's placement; pictures in use are listed and saved", () => {
  fresh();
  const dg = createDungeon("Module", "small");
  setMapImage(dg.maps[0], "img9", 24, 0.5);
  assert.deepEqual(playerView(dg.maps[0]).image, dg.maps[0].image);
  assert.notEqual(playerView(dg.maps[0]).image, dg.maps[0].image, "a copy, not the map's own");
  saveDungeon(dg);
  createDungeon("Plain", "small");
  loadDungeons();
  assert.deepEqual(imagesInUse(), ["img9"]);
  assert.deepEqual(findMap(dg.maps[0].id).image.id, "img9");
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([{ id: "a", name: "A", maps: [{ id: "m", w: 10, h: 10, image: { id: "x", across: "lots" }, revealed: "1" }, { id: "n", image: {} }] }]));
  loadDungeons();
  assert.equal(findMap("m").image.across, 20, "broken numbers get sensible ones");
  assert.equal(findMap("m").revealed.charAt(0), "1", "fog on a picture's rock square is kept");
  assert.equal(findMap("n").image, null, "no id, no picture");
  assert.equal(fitMapToImage(findMap("n")), false);
});

test("fitting a drawn map to a small picture crops to where the picture is, keeping the tracing on it, and says first if drawing is cut off", () => {
  fresh();
  const d = newMap("Big", "large");
  fillRect(d, 21, 13, 23, 15, FLOOR);   // a room in the middle
  fillRect(d, 2, 2, 3, 3, FLOOR);       // and one in the corner, under the picture
  setMapImage(d, "img", 8, 1);          // a picture 8 squares wide in the top left corner
  assert.deepEqual([d.w, d.h], [50, 34], "a drawn map keeps its size when a picture goes on");
  assert.equal(fitLoses(d), true, "the middle room is outside the picture");
  assert.equal(fitMapToImage(d), true);
  assert.deepEqual([d.w, d.h], [8, 8]);
  assert.deepEqual([d.image.ox, d.image.oy], [0, 0], "the picture is still on the map, at its corner");
  assert.equal(cellAt(d, 2, 2), FLOOR, "the room under the picture stayed under it");
  assert.equal(d.cells.replace(/ /g, "").length, 4, "the middle room was cut off");
  const e = newMap("Moved", "large");
  fillRect(e, 30, 20, 31, 21, FLOOR);
  setMapImage(e, "img2", 10, 0.8);
  placeMapImage(e, { ox: 28, oy: 18 });
  assert.equal(fitLoses(e), false, "everything drawn is on the picture");
  fitMapToImage(e);
  assert.deepEqual([e.w, e.h], [10, 8]);
  assert.equal(cellAt(e, 2, 2), FLOOR, "the room moved with the picture to the map's corner");
  assert.deepEqual([e.image.ox, e.image.oy], [0, 0]);
});
