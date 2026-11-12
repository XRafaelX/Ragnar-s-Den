/* The Cartographer (Eberron: Forge of the Artificer) and the Reanimator
   (Ravenloft: The Horrors Within) for the 2024 artificer (artificer fix
   Phase 6, 2026-11-12), checked against 5etools' data (EFA, RHW). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { characterCompanions, toggleCompanionPick, companionPicks } from "../js/core/companions.js";
import { SUBCLASSES } from "../js/data/progression.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 8 };
function art(sub, lv, extra = {}){
  const c = newCharacter("A");
  c.classes = [{ name: "Artificer", subclass: sub, level: lv, edition: "2024" }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const res = (c, id) => H.characterResources(c).find((r) => r.key === "Artificer:" + id);
const spells = (c) => H.featureSpells(c).map((s) => s.name);

test("both are 2024 artificer subclasses from their own books", () => {
  const find = (n) => SUBCLASSES.Artificer.find((s) => s.name === n);
  assert.deepEqual([find("Cartographer").edition, find("Cartographer").source], ["2024", "Eberron: Forge of the Artificer"]);
  assert.deepEqual([find("Reanimator").edition, find("Reanimator").source], ["2024", "Ravenloft: The Horrors Within"]);
  assert.ok(!H.subclassesFor("Artificer", "2014").some((s) => s.name === "Cartographer"), "not for the Tasha's artificer");
});

test("Cartographer: spells, free Faerie Fire and Find the Path, tools", () => {
  const c = art("Cartographer", 17);
  ["Faerie Fire", "Guiding Bolt", "Healing Word", "Mind Spike", "Call Lightning", "Locate Creature", "Scrying", "Teleportation Circle", "Find the Path"].forEach((n) => assert.ok(spells(c).includes(n), n));
  assert.equal(res(c, "illuminated_cartography").max, 4);
  assert.equal(res(c, "unerring_path").max, 1);
  assert.equal(res(art("Cartographer", 14), "unerring_path"), undefined);
  const tools = H.characterToolProfs(c).map((t) => t.toLowerCase());
  assert.ok(tools.includes("calligrapher's supplies") && tools.includes("cartographer's tools"));
});

test("Reanimator: Jolt to Life's dice, the companion and its modifications", () => {
  assert.deepEqual([3, 11, 17].map((lv) => res(art("Reanimator", lv), "jolt_to_life").roll.qty), [2, 3, 4]);
  assert.equal(res(art("Reanimator", 3), "jolt_to_life").max, 4);
  assert.ok(spells(art("Reanimator", 17)).includes("Antilife Shell") && spells(art("Reanimator", 17)).includes("Witch Bolt"));
  const c = art("Reanimator", 3);
  let comp = characterCompanions(c).find((x) => x.def.id === "reanimated_companion");
  assert.deepEqual([comp.stats.ac, comp.stats.hp, comp.stats.attacks[0].dice, comp.stats.attacks[0].bonus, comp.choiceMax], [14, 20, "1d4", 4, 0]);
  assert.deepEqual([comp.stats.actions[0].dice, comp.stats.actions[0].save], ["2d4", "DEX 14"]);
  const c9 = art("Reanimator", 9);
  comp = characterCompanions(c9).find((x) => x.def.id === "reanimated_companion");
  assert.equal(comp.choiceMax, 2);
  assert.deepEqual(comp.options, ["Arcane Conduit", "Ferocity", "Bloated", "Gaunt", "Moist"]);
  toggleCompanionPick(c9, "reanimated_companion", "Ferocity", 2);
  toggleCompanionPick(c9, "reanimated_companion", "Gaunt", 2);
  toggleCompanionPick(c9, "reanimated_companion", "Bloated", 2);
  assert.deepEqual(companionPicks(c9.companions.reanimated_companion.choice), ["Gaunt", "Bloated"], "past two, the first picked goes");
  toggleCompanionPick(c9, "reanimated_companion", "Bloated", 2);
  assert.deepEqual(companionPicks(c9.companions.reanimated_companion.choice), ["Gaunt"], "a second tap takes it away");
  toggleCompanionPick(c9, "reanimated_companion", "Ferocity", 2);
  comp = characterCompanions(c9).find((x) => x.def.id === "reanimated_companion");
  assert.deepEqual(companionPicks(comp.choice), ["Gaunt", "Ferocity"]);
  assert.equal(comp.stats.attacks[0].dice, "1d6", "Ferocity");
  assert.equal(comp.stats.speed, "45 ft, climb 45 ft", "Gaunt");
  assert.deepEqual([comp.stats.actions[0].dice, comp.stats.actions[0].bonus], ["4d4", 0], "Improved Reanimation's Death Burst");
  assert.equal(characterCompanions(art("Reanimator", 5)).find((x) => x.def.id === "reanimated_companion").options.length, 2, "two to pick from before 9");
});

test("spell card notes: Guided Precision, Jolt to Life, Arcane Conduit", async () => {
  const { circleSpellNote } = await import("../js/core/spell-scaling.js");
  assert.match(circleSpellNote(art("Cartographer", 5), "Guiding Bolt"), /Guided Precision: add 4/);
  assert.doesNotMatch(circleSpellNote(art("Cartographer", 3), "Guiding Bolt"), /Guided Precision/, "from level 5");
  assert.match(circleSpellNote(art("Reanimator", 11), "Spare the Dying"), /Jolt to Life: it can revive the target with 11 hit points.*3d4/);
  const c = art("Reanimator", 5, { companions: { reanimated_companion: { hp: [], choice: "Arcane Conduit" } } });
  assert.match(circleSpellNote(c, "Fire Bolt"), /Arcane Conduit: with your companion within 120 ft, add 4/);
  assert.doesNotMatch(circleSpellNote(art("Reanimator", 5), "Fire Bolt"), /Arcane Conduit/, "only with the modification");
});
