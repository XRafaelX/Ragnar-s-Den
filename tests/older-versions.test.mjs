/* Older versions (2014) (2026-11-06): on the 2024 rules the race list shows
   the 2024 species first under their plain names and the older races they
   replace last as "(2014)"; the two 2014 spells the 2024 book renamed
   (Feeblemind, Branding Smite) go last in the spell lists, tagged. */
import { test } from "node:test";
import assert from "node:assert/strict";
import "../js/core/helpers.js"; // (loads the core modules in their usual order first)
import { RACES, raceGroupsFor, SPECIES_OLDER_2014 } from "../js/data/races.js";
import { RACE_DATA } from "../js/data/race-data.js";
import { setSpellEdition, newerSpellOf } from "../js/core/spell-edition.js";
import { BACKGROUNDS, backgroundGroupsFor, olderBackgrounds } from "../js/data/backgrounds.js";
import { backgroundFeatLabel } from "../js/core/feat-picks.js";

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

test("backgrounds: the nine the 2024 book rewrote under the same name go last on the 2024 rules", () => {
  assert.equal(backgroundGroupsFor(false), BACKGROUNDS);
  assert.deepEqual(olderBackgrounds().slice().sort(), ["Acolyte", "Charlatan", "Criminal", "Entertainer", "Hermit", "Noble", "Sage", "Sailor", "Soldier"]);
  const g = backgroundGroupsFor(true), keys = Object.keys(g);
  assert.equal(keys[0], "Player's Handbook (2024)");
  assert.equal(keys[keys.length - 1], "Older versions (2014)");
  assert.ok(g["Player's Handbook (2024)"].some((x) => x.value === "Soldier (2024)" && x.label === "Soldier"));
  assert.ok(g["Older versions (2014)"].some((x) => x.value === "Soldier" && x.label === "Soldier (2014)"));
  assert.ok(!g["Player's Handbook"].includes("Soldier") && g["Player's Handbook"].includes("Folk Hero"), "Folk Hero has no 2024 version");
  const all = [].concat(...keys.map((k) => g[k].map((x) => x.value || x)));
  assert.deepEqual(all.slice().sort(), [].concat(...Object.values(BACKGROUNDS)).sort());
  // A 2024 background's feat without "(2024)" when asked.
  assert.equal(backgroundFeatLabel("Sage (2024)"), "Magic Initiate (2024, Wizard)");
  assert.equal(backgroundFeatLabel("Sage (2024)", true), "Magic Initiate (Wizard)");
});
