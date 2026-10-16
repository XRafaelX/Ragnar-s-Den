/* Phase C of the 2026-10-14 review: features and traits that give
   advantage, checked against the published pages on 2026-10-15. Ones that
   always apply roll that way (Feral Instinct on initiative, Rage on STR
   checks and saves, Vedalken Dispassion, Telepathic Insight); ones that
   depend on the situation are reminders under the saves (Dwarven
   Resilience against poison, Danger Sense against effects you can see). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { RACE_DATA, TRAIT_ADVANTAGES } from "../js/data/race-data.js";
import { newCharacter } from "../js/core/character.js";
import { renderAbilitiesPanel } from "../js/render/panels/abilities.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(race, classes = [{ name: "Wizard", level: 1 }], extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { race, classes }, extra);
  return c;
}
const mode = (r) => r.mode;
const HEAVY = { id: "p", name: "Plate", type: "armor", category: "heavy", baseAC: 18, equipped: true };

test("data: every trait advantage names a real trait, with real abilities", () => {
  const traitNames = new Set(Object.values(RACE_DATA).flatMap((d) => (d.traits || []).map((t) => t.name)));
  for(const [name, a] of Object.entries(TRAIT_ADVANTAGES)){
    assert.ok(traitNames.has(name), name + " is a race trait");
    assert.equal(a.on, "save");
    assert.ok(a.abilities === "all" || a.abilities.every((k) => ["str", "dex", "con", "int", "wis", "cha"].includes(k)), name);
  }
});

test("always: a vedalken's INT, WIS and CHA saves, a verdan's WIS and CHA", () => {
  const v = char("Vedalken");
  assert.deepEqual(["str", "dex", "con", "int", "wis", "cha"].map((k) => mode(H.saveRollMode(v, k))), ["none", "none", "none", "adv", "adv", "adv"]);
  assert.equal(H.saveRollMode(v, "wis").reason, "Vedalken Dispassion");
  const vd = char("Verdan");
  assert.deepEqual(["int", "wis", "cha"].map((k) => mode(H.saveRollMode(vd, k))), ["none", "adv", "adv"]);
});

test("situational: reminders, never an automatic roll", () => {
  const dwarf = char("Hill Dwarf");
  assert.equal(mode(H.saveRollMode(dwarf, "con")), "none");
  assert.deepEqual(H.situationalSaveAdvantages(dwarf, "con"), [{ name: "Dwarven Resilience", when: "against poison" }]);
  const gnome = char("Rock Gnome");
  assert.deepEqual(H.situationalSaveAdvantages(gnome, "str"), []);
  assert.deepEqual(H.situationalSaveAdvantages(gnome, "wis"), [{ name: "Gnome Cunning", when: "against magic" }]);
  assert.deepEqual(H.situationalSaveAdvantages(char("Duergar"), "wis").map((s) => s.name), ["Dwarven Resilience", "Duergar Resilience"]);
  assert.deepEqual(H.situationalSaveAdvantages(char("High Elf"), "wis").map((s) => s.name), ["Fey Ancestry"]);
  assert.deepEqual(H.situationalSaveAdvantages(char("Human"), "wis"), []);
  // Danger Sense from barbarian 2, DEX saves only.
  const barb = char("Human", [{ name: "Barbarian", level: 2 }]);
  assert.deepEqual(H.situationalSaveAdvantages(barb, "dex").map((s) => s.name), ["Danger Sense"]);
  assert.deepEqual(H.situationalSaveAdvantages(barb, "con"), []);
  assert.deepEqual(H.situationalSaveAdvantages(char("Human", [{ name: "Barbarian", level: 1 }]), "dex"), [], "not before level 2");
});

test("initiative: Feral Instinct's advantage from barbarian 7; armor without proficiency's disadvantage", () => {
  assert.equal(mode(H.initiativeRollMode(char("Human", [{ name: "Barbarian", level: 6 }]))), "none");
  const feral = H.initiativeRollMode(char("Human", [{ name: "Barbarian", level: 7 }]));
  assert.deepEqual([feral.mode, feral.reason], ["adv", "Feral Instinct"]);
  const wizardInPlate = char("Human", [{ name: "Wizard", level: 3 }], { inventory: [HEAVY] });
  assert.equal(mode(H.initiativeRollMode(wizardInPlate)), "dis", "initiative is a DEX check");
  const both = char("Human", [{ name: "Barbarian", level: 7 }, { name: "Wizard", level: 1 }], { inventory: [HEAVY] });
  // (A barbarian is proficient with medium armor, not heavy: they cancel out.)
  assert.equal(mode(H.initiativeRollMode(both)), "none");
});

test("rage: advantage on STR checks, Athletics and STR saves while raging, not in heavy armor", () => {
  const calm = char("Human", [{ name: "Barbarian", level: 3 }]);
  assert.equal(mode(H.saveRollMode(calm, "str")), "none");
  const raging = char("Human", [{ name: "Barbarian", level: 3 }], { rage: { active: true, used: 1 } });
  assert.deepEqual([H.saveRollMode(raging, "str").mode, H.saveRollMode(raging, "str").reason], ["adv", "Rage"]);
  assert.equal(mode(H.checkRollMode(raging, "str")), "adv");
  assert.equal(mode(H.skillRollMode(raging, "Athletics")), "adv");
  assert.equal(mode(H.skillRollMode(raging, "Acrobatics")), "none");
  assert.equal(mode(H.saveRollMode(raging, "dex")), "none");
  const plated = char("Human", [{ name: "Barbarian", level: 3 }], { rage: { active: true, used: 1 }, inventory: [HEAVY] });
  assert.notEqual(H.saveRollMode(plated, "str").reason, "Rage", "no rage benefits in heavy armor");
});

test("the Abilities panel draws with situational notes (their wording is checked in the app)", (t) => {
  withFakeDom(t, () => {
    const panel = renderAbilitiesPanel(char("Hill Dwarf", [{ name: "Barbarian", level: 2 }]));
    assert.ok(panel, "the panel draws with the notes");
  });
});
