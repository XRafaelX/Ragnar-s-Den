/* Encounters: the DM's turn order and monster hit points, saved by name
   so a fight can be run again. The turn follows the entry, not its place
   in the line, downed monsters are skipped, and passing the bottom of the
   line starts the next round. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadEncounters, getEncounters, getEncounter, createEncounter, saveEncounter, deleteEncounter, duplicateEncounter,
  importEncounters, encounterNameProblem, knownPlayerNames, addMonster, getMonster, removeMonster, changeHp,
  isDead, orderEntryFor, unplacedMonsters, addPlayer, placeMonster, moveInOrder, removeFromOrder, currentEntry,
  nextTurn, previousTurn, resetEncounter, encounterStarted
} from "../js/core/encounters.js";

const GOBLIN = { hp: 7, ac: 15, speed: 30 };
const OGRE = { hp: 59, ac: 11, speed: 40 };

function fresh(){
  localStorage.clear();
  loadEncounters();
}
const names = (e) => e.order.map((o) => o.type === "player" ? o.name : getMonster(e, o.monsterId).name);
const turnName = (e) => {
  const o = currentEntry(e);
  return o.type === "player" ? o.name : getMonster(e, o.monsterId).name;
};

test("a monster is added at full hit points with its stats, and repeats are numbered", () => {
  fresh();
  const e = createEncounter("Goblin ambush");
  const a = addMonster(e, "Goblin", GOBLIN);
  const b = addMonster(e, "Goblin", GOBLIN);
  const c = addMonster(e, "Goblin", GOBLIN);
  assert.deepEqual([a.name, b.name, c.name], ["Goblin", "Goblin 2", "Goblin 3"]);
  assert.equal(a.kind, "Goblin");
  assert.deepEqual([a.ac, a.speed, a.maxHp, a.hp], [15, 30, 7, 7]);
  assert.deepEqual(a.log, [7]);
  assert.equal(unplacedMonsters(e).length, 3, "added monsters wait to be placed in the turn order");
});

test("damage and healing stay between 0 and max and leave a trail like the paper", () => {
  fresh();
  const e = createEncounter("Trail");
  const m = addMonster(e, "Ogre", { hp: 32, ac: 11, speed: 30 });
  changeHp(e, m.id, -12);
  changeHp(e, m.id, -10);
  changeHp(e, m.id, -6);
  changeHp(e, m.id, -2);
  assert.deepEqual(m.log, [32, 20, 10, 4, 2]);
  changeHp(e, m.id, -50);
  assert.equal(m.hp, 0);
  assert.ok(isDead(m));
  changeHp(e, m.id, -5);
  assert.deepEqual(m.log, [32, 20, 10, 4, 2, 0], "no change, nothing logged");
  changeHp(e, m.id, 100);
  assert.equal(m.hp, 32, "healing stops at max");
  assert.ok(!isDead(m));
});

test("monsters are dragged into the line between players, and moved within it", () => {
  fresh();
  const e = createEncounter("Line");
  ["Leonidas", "Adonis", "Athos"].forEach((n) => addPlayer(e, n));
  const g = addMonster(e, "Goblin", GOBLIN);
  const o = addMonster(e, "Ogre", OGRE);
  placeMonster(e, g.id, 1);
  placeMonster(e, o.id);
  assert.deepEqual(names(e), ["Leonidas", "Goblin", "Adonis", "Athos", "Ogre"]);
  // Dragging a placed monster's box moves it instead of adding it twice.
  placeMonster(e, g.id, 3);
  assert.deepEqual(names(e), ["Leonidas", "Adonis", "Athos", "Goblin", "Ogre"]);
  moveInOrder(e, e.order[4].id, 0);
  assert.deepEqual(names(e), ["Ogre", "Leonidas", "Adonis", "Athos", "Goblin"]);
  assert.equal(unplacedMonsters(e).length, 0);
});

test("the turn stays with its entry when the line is rearranged", () => {
  fresh();
  const e = createEncounter("Follow");
  ["A", "B", "C"].forEach((n) => addPlayer(e, n));
  assert.equal(turnName(e), "A", "the first entry starts");
  nextTurn(e);
  assert.equal(turnName(e), "B");
  moveInOrder(e, currentEntry(e).id, 2);
  assert.deepEqual(names(e), ["A", "C", "B"]);
  addPlayer(e, "D", 0);
  moveInOrder(e, e.order[0].id, 3);
  assert.deepEqual(names(e), ["A", "C", "B", "D"]);
  assert.equal(turnName(e), "B", "past the first turn, adding or moving others leaves it alone");
  nextTurn(e);
  assert.equal(turnName(e), "D");
  nextTurn(e);
  assert.equal(turnName(e), "A");
  assert.equal(e.round, 2, "passing the bottom starts the next round");
});

test("downed monsters are skipped, rounds go back too, and never below 1", () => {
  fresh();
  const e = createEncounter("Skip");
  addPlayer(e, "A");
  const g = addMonster(e, "Goblin", GOBLIN);
  placeMonster(e, g.id);
  addPlayer(e, "B");
  changeHp(e, g.id, -7);
  nextTurn(e);
  assert.equal(turnName(e), "B", "the downed goblin is skipped");
  nextTurn(e);
  assert.equal(turnName(e), "A");
  assert.equal(e.round, 2);
  previousTurn(e);
  assert.equal(turnName(e), "B");
  assert.equal(e.round, 1);
  previousTurn(e);
  previousTurn(e);
  assert.equal(turnName(e), "A");
  assert.equal(e.round, 1, "going back from the very first turn stays on it");
});

test("removing whoever's turn it is passes the turn on; a removed monster can be placed again", () => {
  fresh();
  const e = createEncounter("Remove");
  addPlayer(e, "A");
  const g = addMonster(e, "Goblin", GOBLIN);
  placeMonster(e, g.id);
  addPlayer(e, "B");
  nextTurn(e);
  removeFromOrder(e, orderEntryFor(e, g.id).id);
  assert.equal(turnName(e), "B");
  assert.deepEqual(unplacedMonsters(e).map((m) => m.id), [g.id], "still in the encounter");
  removeMonster(e, g.id);
  assert.equal(e.monsters.length, 0);
  removeFromOrder(e, currentEntry(e).id);
  assert.equal(turnName(e), "A", "the last entry wraps to the top");
});

test("reset puts everyone back to full and starts again, keeping the setup", () => {
  fresh();
  const e = createEncounter("Again");
  addPlayer(e, "A");
  const g = addMonster(e, "Goblin", GOBLIN);
  placeMonster(e, g.id);
  assert.ok(!encounterStarted(e));
  changeHp(e, g.id, -7);
  nextTurn(e);
  nextTurn(e);
  assert.ok(encounterStarted(e));
  resetEncounter(e);
  assert.deepEqual([g.hp, g.log, e.round, turnName(e)], [7, [7], 1, "A"]);
  assert.deepEqual(names(e), ["A", "Goblin"]);
  assert.ok(!encounterStarted(e));
});

test("encounters are saved by name, survive a reload, and can be duplicated or deleted", () => {
  fresh();
  const e = createEncounter("Goblin ambush");
  addPlayer(e, "Leonidas");
  const g = addMonster(e, "Goblin", GOBLIN);
  placeMonster(e, g.id, 0);
  changeHp(e, g.id, -3);
  saveEncounter(e);
  assert.match(encounterNameProblem("goblin AMBUSH", null), /already have/);
  assert.equal(encounterNameProblem("Goblin ambush", e.id), "", "its own name is fine");
  assert.match(encounterNameProblem("  ", null), /name/);

  loadEncounters();
  const back = getEncounter(e.id);
  assert.deepEqual(names(back), ["Goblin", "Leonidas"]);
  assert.equal(back.monsters[0].hp, 4);
  assert.equal(turnName(back), "Goblin", "before the fight starts, the top of the line goes first");

  const copy = duplicateEncounter(e.id);
  assert.equal(copy.name, "Goblin ambush (copy)");
  assert.equal(duplicateEncounter(e.id).name, "Goblin ambush (copy 2)");
  assert.notEqual(copy.monsters[0].id, undefined);
  changeHp(copy, copy.monsters[0].id, -4);
  assert.equal(getEncounter(e.id).monsters[0].hp, 4, "the copy is separate");

  deleteEncounter(copy.id);
  assert.equal(getEncounters().length, 2);
  assert.deepEqual(knownPlayerNames(), ["Leonidas"]);
});

test("backup import adds encounters, renames clashes and drops broken entries", () => {
  fresh();
  createEncounter("Crypt");
  const added = importEncounters([
    { name: "Crypt", monsters: [{ id: "m1", name: "Zombie", kind: "Zombie", ac: 8, speed: 20, maxHp: 22, hp: 99 }],
      order: [{ id: "o1", type: "monster", monsterId: "m1" }, { id: "o2", type: "monster", monsterId: "gone" }, { id: "o3", type: "player", name: "  " }],
      current: "o2" },
    null,
    "nonsense"
  ]);
  assert.equal(added, 1);
  const imported = getEncounters().find((e) => e.name !== "Crypt");
  assert.equal(imported.name, "Crypt (imported)");
  assert.equal(imported.monsters[0].hp, 22, "hit points kept within max");
  assert.equal(imported.order.length, 1, "entries pointing at missing monsters or blank players are dropped");
  assert.equal(imported.current, "o1");
});
