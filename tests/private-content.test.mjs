/* Michael's private content (2026-11-02): the Gunslinger class, its
   spells and the Drecland gods, hidden until the secret switch (ten taps
   on the home screen's centre die) shows them; characters that use them are set
   aside while hidden and saved untouched. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { usesPrivateContent, applyPrivateContent, setPrivateContent, privateContentOn } from "../js/core/private-content.js";
import { state, allCharacters, splitCharacters, save, load, STORAGE_KEY } from "../js/core/state.js";
import { CLASS_LIST } from "../js/data/abilities-skills.js";
import { SPELL_DATA } from "../js/data/spells.js";
import { DEITY_GROUPS } from "../js/data/deities.js";
import { CREDITS } from "../js/data/credits.js";
import { faithTabs, searchGods } from "../js/core/faith.js";
import { newCharacter } from "../js/core/character.js";

function char(name, extra){ return Object.assign(newCharacter(name), { id: name }, extra || {}); }

test("which characters use private content", () => {
  assert.equal(usesPrivateContent(char("Fighter", { classes: [{ name: "Fighter", subclass: "Gunslinger", level: 3 }] })), false, "the fighter's Gunslinger is published: not private");
  assert.equal(usesPrivateContent(char("Slinger", { classes: [{ name: "Gunslinger", subclass: "Outlaw", level: 3 }] })), true);
  assert.equal(usesPrivateContent(char("Multi", { classes: [{ name: "Rogue", level: 3 }, { name: "Gunslinger", level: 1 }] })), true);
  const pious = char("Pious");
  pious.story = { faith: "Lunares, goddess of the moon" };
  assert.equal(usesPrivateContent(pious), true, "a Drecland god as faith");
  pious.story.faith = "Pelor, the Dawn Father (healing, sun)";
  assert.equal(usesPrivateContent(pious), false);
  assert.equal(usesPrivateContent(char("Gun", { inventory: [{ type: "weapon", name: "Long Gun", firearmSet: "gunslinger" }] })), true, "one of the class's guns");
  assert.equal(usesPrivateContent(char("Caster", { spells: [{ name: "Switcheroo" }] })), true, "one of its spells");
  assert.equal(usesPrivateContent(char("Plain")), false);
});

test("setting characters aside keeps their places, and saves them untouched", () => {
  const a = char("A"), g1 = char("G1", { classes: [{ name: "Gunslinger", level: 1 }] }), b = char("B"), g2 = char("G2", { classes: [{ name: "Gunslinger", level: 2 }] });
  state.characters = [g1, a, b, g2]; state.hiddenCharacters = []; state.activeId = "G2";
  splitCharacters(usesPrivateContent);
  assert.deepEqual(state.characters.map((c) => c.id), ["A", "B"]);
  assert.deepEqual(state.hiddenCharacters.map((c) => c.id), ["G1", "G2"]);
  assert.equal(state.activeId, null, "an open hidden character closes");
  assert.deepEqual(allCharacters().map((c) => c.id), ["G1", "A", "B", "G2"], "back in their places");
  // The visible ones reordered, one deleted, one added: hidden ones follow their neighbours.
  const n = char("N");
  state.characters = [b, n];
  assert.deepEqual(allCharacters().map((c) => c.id), ["G1", "B", "G2", "N"], "G2 after B (A is gone, so G1 stays first)");
  save();
  assert.deepEqual(JSON.parse(localStorage.getItem(STORAGE_KEY)).map((c) => c.id), ["G1", "B", "G2", "N"], "save writes everyone");
  splitCharacters(null);
  assert.deepEqual(state.characters.map((c) => c.id), ["G1", "B", "G2", "N"]);
  assert.equal(state.hiddenCharacters.length, 0);
  load();
  assert.deepEqual(state.characters.map((c) => c.id), ["G1", "B", "G2", "N"]);
});

test("hiding takes the class, its spells, the Drecland gods and the credits out, and showing puts them back in place", () => {
  const before = { classes: CLASS_LIST.slice(), spells: Object.keys(SPELL_DATA).length, groups: DEITY_GROUPS.slice(), credits: CREDITS.slice() };
  state.characters = [char("A"), char("G", { classes: [{ name: "Gunslinger", level: 5 }] })]; state.hiddenCharacters = [];
  assert.equal(privateContentOn(), false, "hidden on a new device");
  applyPrivateContent();
  assert.ok(!CLASS_LIST.includes("Gunslinger") && CLASS_LIST.length === before.classes.length - 1);
  assert.ok(!SPELL_DATA["Ready Arms!"] && !SPELL_DATA["Switcheroo"] && SPELL_DATA["Fire Bolt"]);
  assert.ok(!DEITY_GROUPS.some((g) => g.label.startsWith("Drecland")) && DEITY_GROUPS.length === before.groups.length - 6);
  assert.ok(!faithTabs().some((t) => t.label === "Drecland") && searchGods("Lunares").length === 0, "the Faith sheet and its search");
  assert.ok(!CREDITS.some((e) => e.private) && CREDITS.some((e) => e.label === "God icons"));
  assert.deepEqual(state.characters.map((c) => c.id), ["A"]);
  applyPrivateContent(false);
  assert.equal(CLASS_LIST.length, before.classes.length - 1, "hiding twice changes nothing");
  // The switch: stored, everything back exactly as it was.
  assert.equal(setPrivateContent(true), true);
  assert.equal(privateContentOn(), true);
  assert.deepEqual(CLASS_LIST, before.classes);
  assert.equal(Object.keys(SPELL_DATA).length, before.spells);
  assert.deepEqual(DEITY_GROUPS, before.groups);
  assert.deepEqual(CREDITS, before.credits);
  assert.deepEqual(state.characters.map((c) => c.id), ["A", "G"]);
  setPrivateContent(false);
  assert.equal(privateContentOn(), false);
  assert.deepEqual(state.characters.map((c) => c.id), ["A"]);
  setPrivateContent(true);
  localStorage.removeItem("ragnarsDen.privateContent");
});
