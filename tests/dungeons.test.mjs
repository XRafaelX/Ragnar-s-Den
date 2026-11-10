/* Dungeons: the DM's terrain maps. A map is a grid of terrain codes
   saved by name; rooms and corridors are painted as floor and the walls
   follow from where floor meets rock. Painting reports whether anything
   changed, resizing keeps the map centred, and undo brings back any
   earlier state, a resize included. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadDungeons, getDungeons, getDungeon, createDungeon, saveDungeon, deleteDungeon, duplicateDungeon, importDungeons,
  dungeonNameProblem, cellAt, isOpen, isBlank, contentBounds, passageAxis, paintCells, fillRect, lineCells,
  clearDungeon, resizeDungeon, resizeLoses, createHistory, DUNGEON_SIZES, MIN_SIDE, MAX_SIDE, TERRAIN, ROCK, FLOOR
} from "../js/core/dungeons.js";

function fresh(){
  localStorage.clear();
  loadDungeons();
}
/* The map as rows of text, for comparing small maps at a glance. */
const rows = (d) => Array.from({ length: d.h }, (_, y) => d.cells.slice(y * d.w, (y + 1) * d.w));

test("a new dungeon is all rock at the size picked, medium if none", () => {
  fresh();
  const d = createDungeon("Crypt", "small");
  assert.equal(d.w, 24);
  assert.equal(d.h, 16);
  assert.equal(d.cells.length, 24 * 16);
  assert.ok(isBlank(d));
  assert.equal(contentBounds(d), null);
  const m = createDungeon("Mine", "nonsense");
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

test("saved dungeons survive a reload, newest first", async () => {
  fresh();
  const a = createDungeon("Crypt", "small");
  await new Promise((r) => setTimeout(r, 5));
  createDungeon("Mine", "small");
  fillRect(a, 1, 1, 3, 2, FLOOR);
  await new Promise((r) => setTimeout(r, 5));
  saveDungeon(a);
  loadDungeons();
  assert.deepEqual(getDungeons().map((d) => d.name), ["Crypt", "Mine"]);
  assert.equal(cellAt(getDungeon(a.id), 2, 2), FLOOR);
});

test("broken saved data is cleaned: size held to the limits, unknown squares made rock", () => {
  fresh();
  localStorage.setItem("ragnarsDen.dungeons.v1", JSON.stringify([
    { id: "a", name: "Huge", w: 500, h: 2, cells: "..?" },
    null, [1, 2], "text"
  ]));
  loadDungeons();
  const all = getDungeons();
  assert.equal(all.length, 1);
  const d = all[0];
  assert.equal(d.w, MAX_SIDE);
  assert.equal(d.h, MIN_SIDE);
  assert.equal(d.cells.length, MAX_SIDE * MIN_SIDE);
  assert.equal(d.cells.slice(0, 4), ".." + ROCK + ROCK);
});

test("delete, duplicate under a free name, and import renaming clashes", () => {
  fresh();
  const d = createDungeon("Crypt", "small");
  fillRect(d, 0, 0, 2, 2, FLOOR);
  saveDungeon(d);
  const c1 = duplicateDungeon(d.id);
  const c2 = duplicateDungeon(d.id);
  assert.equal(c1.name, "Crypt (copy)");
  assert.equal(c2.name, "Crypt (copy 2)");
  assert.equal(c1.cells, d.cells);
  assert.notEqual(c1.id, d.id);
  assert.equal(importDungeons([{ name: "Crypt", w: 10, h: 10, cells: "" }, null, "x"]), 1);
  assert.ok(getDungeons().some((x) => x.name === "Crypt (imported)"));
  deleteDungeon(d.id);
  assert.equal(getDungeon(d.id), null);
  assert.equal(getDungeons().length, 3);
});

test("painting reports a change only when a square changes, and ignores squares off the map", () => {
  fresh();
  const d = createDungeon("Crypt", "small");
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
  const d = createDungeon("Crypt", "small");
  d.w = 8; d.h = 8; d.cells = ROCK.repeat(64);
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
  const d = createDungeon("Crypt", "small");
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
  const d = createDungeon("Crypt", "small");
  d.w = 8; d.h = 8; d.cells = ROCK.repeat(64);
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
  const d = createDungeon("Crypt", "small");
  assert.equal(clearDungeon(d), false);
  fillRect(d, 0, 0, 5, 5, FLOOR);
  assert.equal(clearDungeon(d), true);
  assert.ok(isBlank(d));
});

test("undo and redo walk back and forth through changes, a resize included", () => {
  fresh();
  const d = createDungeon("Crypt", "small");
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
  const d = createDungeon("Crypt", "small");
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
