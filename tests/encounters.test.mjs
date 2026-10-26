/* Encounters: the DM's turn order and monster hit points, saved by name
   so a fight can be run again. The turn follows the entry, not its place
   in the line, downed monsters are skipped, and passing the bottom of the
   line starts the next round. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadEncounters, getEncounters, getEncounter, createEncounter, saveEncounter, deleteEncounter, duplicateEncounter,
  importEncounters, encounterNameProblem, knownPlayerNames, addMonster, getMonster, moveMonster, removeMonster, changeHp,
  isDead, orderEntryFor, unplacedMonsters, addPlayer, placeMonster, moveInOrder, removeFromOrder, currentEntry,
  nextTurn, previousTurn, resetEncounter, encounterStarted,
  setMonsterColor, groupName, renameGroup, colorGroups,
  addMonsterCondition, removeMonsterCondition, monsterConditions, hasMonsterCondition, monsterAc, monsterSpeed
} from "../js/core/encounters.js";
import { SPELL_CONDITIONS } from "../js/data/conditions.js";

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

test("monster boxes are sorted by hand without touching the turn line", () => {
  fresh();
  const e = createEncounter("Boxes");
  const g = addMonster(e, "Goblin", GOBLIN);
  const o = addMonster(e, "Ogre", OGRE);
  const w = addMonster(e, "Wolf", GOBLIN);
  placeMonster(e, g.id);
  placeMonster(e, o.id);
  const boxes = () => e.monsters.map((m) => m.name);
  moveMonster(e, w.id, 0);
  assert.deepEqual(boxes(), ["Wolf", "Goblin", "Ogre"]);
  moveMonster(e, w.id, 2);
  assert.deepEqual(boxes(), ["Goblin", "Ogre", "Wolf"]);
  moveMonster(e, g.id, 99);
  assert.deepEqual(boxes(), ["Ogre", "Wolf", "Goblin"], "past the end lands last");
  assert.deepEqual(names(e), ["Goblin", "Ogre"], "the turn order stays as it was");
});

test("monsters are grouped by color, and a group can be named", () => {
  fresh();
  const e = createEncounter("Colors");
  const g = addMonster(e, "Goblin", GOBLIN);
  const g2 = addMonster(e, "Goblin", GOBLIN);
  const o = addMonster(e, "Ogre", OGRE);
  assert.equal(g.color, "", "a new monster has no color");
  setMonsterColor(e, g.id, "blue");
  setMonsterColor(e, g2.id, "blue");
  setMonsterColor(e, o.id, "green");
  assert.deepEqual(colorGroups(e), [{ color: "blue", name: "Blue", count: 2 }, { color: "green", name: "Green", count: 1 }]);
  setMonsterColor(e, o.id, "purple");
  assert.equal(o.color, "", "an unknown color is no color");
  renameGroup(e, "blue", "  Archers on the ridge ");
  assert.equal(groupName(e, "blue"), "Archers on the ridge");
  renameGroup(e, "blue", "");
  assert.equal(groupName(e, "blue"), "Blue", "an empty name goes back to the color's");
  renameGroup(e, "blue", "Archers");
  saveEncounter(e);
  loadEncounters();
  const back = getEncounter(e.id);
  assert.deepEqual(back.monsters.map((m) => m.color), ["blue", "blue", ""], "colors survive a reload");
  assert.equal(groupName(back, "blue"), "Archers", "and so do group names");
  const copy = duplicateEncounter(e.id);
  assert.equal(groupName(copy, "blue"), "Archers", "a duplicate keeps them");
  assert.equal(copy.monsters[0].color, "blue");
  importEncounters([{ name: "Odd", monsters: [{ id: "x", name: "Bat", hp: 1, color: "plaid" }], groupNames: { plaid: "Nope", teal: 5 } }]);
  const odd = getEncounters().find((x) => x.name === "Odd");
  assert.equal(odd.monsters[0].color, "", "an imported unknown color is dropped");
  assert.deepEqual(odd.groupNames, { teal: "5" });
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

/* ---- Conditions on monsters ---- */
const conds = (m) => monsterConditions(m).map((x) => x.def.id + (x.pick ? ":" + x.pick.id : ""));

test("the five spells tracked like conditions have the book's effects, in plain text", () => {
  assert.deepEqual(SPELL_CONDITIONS.map((d) => [d.name, d.spell]),
    [["Hexed", "Hex"], ["Cursed", "Bestow Curse"], ["Slowed", "Slow"], ["Asleep", "Sleep"], ["Blessed", "Bless"]]);
  for(const d of SPELL_CONDITIONS){
    const text = [d.short].concat(d.rules, (d.picks || []).map((p) => p.text));
    for(const t of text) assert.ok(!/[;\u2013\u2014]/.test(t), d.name + ": no semicolons or long dashes in " + t);
  }
  const hex = SPELL_CONDITIONS.find((d) => d.id === "hexed");
  assert.deepEqual(hex.picks.map((p) => p.label), ["STR", "DEX", "CON", "INT", "WIS", "CHA"]);
  assert.equal(SPELL_CONDITIONS.find((d) => d.id === "cursed").picks.length, 10, "six abilities and four other curses");
});

test("conditions go on a monster once, spells first, with what the caster chose", () => {
  fresh();
  const e = createEncounter("Crypt");
  const m = addMonster(e, "Ogre", OGRE);
  assert.deepEqual(addMonsterCondition(e, m.id, "poisoned"), ["poisoned"]);
  assert.deepEqual(addMonsterCondition(e, m.id, "hexed", "wis"), ["hexed"]);
  assert.deepEqual(addMonsterCondition(e, m.id, "blessed", "nonsense"), ["blessed"]);
  assert.deepEqual(conds(m), ["hexed:wis", "blessed", "poisoned"]);
  assert.deepEqual(addMonsterCondition(e, m.id, "hexed", "str"), [], "already on: only the pick changes");
  assert.deepEqual(conds(m), ["hexed:str", "blessed", "poisoned"]);
  assert.deepEqual(addMonsterCondition(e, m.id, "made-up"), []);
  removeMonsterCondition(e, m.id, "blessed");
  assert.ok(!hasMonsterCondition(m, "blessed"));
});

test("unconscious and asleep knock a monster prone, and damage wakes a sleeper", () => {
  fresh();
  const e = createEncounter("Crypt");
  const m = addMonster(e, "Ogre", OGRE);
  assert.deepEqual(addMonsterCondition(e, m.id, "asleep"), ["asleep", "prone"]);
  assert.deepEqual(changeHp(e, m.id, 5), [], "healing doesn't wake it (it's at full anyway)");
  assert.deepEqual(changeHp(e, m.id, -3), ["Asleep"]);
  assert.deepEqual(conds(m), ["prone"], "awake but still lying down");
  assert.deepEqual(addMonsterCondition(e, m.id, "unconscious"), ["unconscious"], "already prone");
  assert.deepEqual(changeHp(e, m.id, -3), [], "damage doesn't end Unconscious");
});

test("Slow lowers the AC and halves the speed, and conditions that stop movement make it 0", () => {
  fresh();
  const e = createEncounter("Crypt");
  const m = addMonster(e, "Ogre", OGRE);
  assert.deepEqual(monsterAc(m), { value: 11, reasons: [] });
  addMonsterCondition(e, m.id, "slowed");
  assert.deepEqual(monsterAc(m), { value: 9, reasons: ["Slowed -2"] });
  assert.deepEqual(monsterSpeed(m), { value: 20, reasons: ["Slowed"] });
  addMonsterCondition(e, m.id, "grappled");
  assert.deepEqual(monsterSpeed(m), { value: 0, reasons: ["Grappled"] });
  assert.equal(m.ac, 11, "the box's own AC is kept");
});

test("going down, a reset and a broken save all clear conditions the right way", () => {
  fresh();
  const e = createEncounter("Crypt");
  const m = addMonster(e, "Goblin", GOBLIN);
  const ogre = addMonster(e, "Ogre", OGRE);
  addMonsterCondition(e, m.id, "blessed");
  addMonsterCondition(e, ogre.id, "cursed", "attacks");
  assert.ok(encounterStarted(e), "a condition counts as the fight having started");
  changeHp(e, m.id, -7);
  assert.deepEqual(m.conditions, [], "a downed monster loses its conditions");
  assert.deepEqual(addMonsterCondition(e, m.id, "prone"), [], "and gets none while down");
  saveEncounter(e);
  loadEncounters();
  const back = getEncounter(e.id);
  assert.deepEqual(conds(back.monsters[1]), ["cursed:attacks"], "conditions are saved");
  resetEncounter(back);
  assert.deepEqual(back.monsters[1].conditions, []);

  importEncounters([{ name: "Odd", monsters: [{ id: "m1", name: "Zombie", maxHp: 22, hp: 22,
    conditions: [{ id: "hexed", pick: "luck" }, { id: "hexed", pick: "wis" }, { id: "fake" }, "prone", { id: "prone" }] }] }]);
  const odd = getEncounters().find((x) => x.name === "Odd");
  assert.deepEqual(odd.monsters[0].conditions, [{ id: "hexed", pick: "" }, { id: "prone", pick: "" }],
    "unknown ids and picks dropped, each condition once");
});
