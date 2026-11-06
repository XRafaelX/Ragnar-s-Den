/* Older versions (2014) (2026-11-06): on the 2024 rules the race list shows
   the 2024 species first under their plain names and the older races they
   replace last as "(2014)"; the two 2014 spells the 2024 book renamed
   (Feeblemind, Branding Smite) go last in the spell lists, tagged. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { RACES, raceGroupsFor, SPECIES_OLDER_2014 } from "../js/data/races.js";
import { RACE_DATA } from "../js/data/race-data.js";
import { setSpellEdition, newerSpellOf } from "../js/core/spell-edition.js";

test("the 2014 rules: the race list as it was", () => {
  assert.equal(raceGroupsFor(false), RACES);
});

test("the 2024 rules: 2024 species first, the older races last", () => {
  const g = raceGroupsFor(true);
  const keys = Object.keys(g);
  assert.equal(keys[0], "Player's Handbook (2024)");
  assert.equal(keys[keys.length - 1], "Older versions (2014)");
  assert.deepEqual(g["Player's Handbook (2024)"].map((x) => x.label).slice(0, 3), ["Aasimar", "Dragonborn", "Dwarf"]);
  assert.equal(g["Player's Handbook (2024)"][2].value, "Dwarf (2024)");
  const older = g["Older versions (2014)"];
  assert.ok(older.some((x) => x.value === "Hill Dwarf" && x.label === "Hill Dwarf (2014)"));
  assert.ok(older.some((x) => x.value === "Dark Elf (Drow)"));
  // Each race once, none lost.
  const all = [].concat(...keys.map((k) => g[k].map((x) => x.value || x)));
  const before = [].concat(...Object.values(RACES));
  assert.equal(all.length, before.length);
  assert.deepEqual(all.slice().sort(), before.slice().sort());
  assert.ok(!g["Standard (SRD)"].includes("Human") && g["Standard (SRD)"].includes("Half-Elf"), "Half-Elf has no 2024 version");
  // Every name is a real race.
  Object.keys(SPECIES_OLDER_2014).forEach((k) => { assert.ok(RACE_DATA[k], k); SPECIES_OLDER_2014[k].forEach((n) => assert.ok(RACE_DATA[n], n)); });
});

test("the two renamed spells: only on the 2024 rules", () => {
  setSpellEdition("2014");
  assert.equal(newerSpellOf("Feeblemind"), "");
  setSpellEdition("2024");
  assert.equal(newerSpellOf("Feeblemind"), "Befuddlement");
  assert.equal(newerSpellOf("Branding Smite"), "Shining Smite");
  assert.equal(newerSpellOf("Fireball"), "");
  setSpellEdition("2014");
});
