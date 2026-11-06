/* The 2024 Sorcerer (2026-11-06, Phase 13 of the 2024 Player's Handbook):
   checked against the printed book, pp. 137 to 150. A class entry's edition
   "2024" swaps in Innate Sorcery, Metamagic at 2 with the 2024 options, Font
   of Magic's level limits, Sorcerous Restoration at 5, Sorcery Incarnate, an
   origin at level 3 and the four 2024 origins with their new names. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { SORCERER_2024, SORCERER_2024_SUBCLASSES, WILD_SURGE_2024 } from "../js/data/sorcerer-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, subclassLevelOf, classLevelOf } from "../js/core/class-features.js";
import { casterDef } from "../js/core/spells-known.js";
import { computeArmorClass, computeSpeed } from "../js/core/vitals.js";
import { entrySets } from "../js/core/class-options.js";
import { optionSetDef } from "../js/data/class-options.js";

const ABIL = { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 18 };
function sorc(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("S");
  const cl = Object.assign({ name: "Sorcerer", subclass: sub, level: lv }, extra.cl || {});
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 6 * lv, current: 6 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra.c || {});
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  Object.keys(s.slots).forEach((k) => { out.spellcasting.slots[k] = { max: s.slots[k], used: 0 }; });
  return out;
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const action = (c, id) => H.sorceryActions(c, "Sorcerer:sorcery_points").find((a) => a.id === id);

test("the 2014 sorcerer is unchanged without an edition", () => {
  const c = sorc(20, "Draconic Bloodline", "");
  assert.equal(subclassLevelOf(c.classes[0]), 1);
  assert.deepEqual(entrySets(c.classes[0]).map((s) => s.id), ["metamagic"]);
  c.resourcesUsed = { "Sorcerer:sorcery_points": 10 };
  assert.equal(H.sorcerousRestoration(c), 4);
  assert.equal(computeArmorClass(c).value, 15, "13 + DEX");
  assert.equal(H.surgeCheckNumber(sorc(5, "Wild Magic", "")), 1);
});

test("the features arrive at the book's levels (p. 139)", () => {
  const at = (lv) => names(sorc(lv));
  assert.ok(at(1).includes("Spellcasting") && at(1).includes("Innate Sorcery"));
  assert.ok(at(2).includes("Font of Magic") && at(2).includes("Metamagic"));
  assert.ok(at(5).includes("Sorcerous Restoration") && at(7).includes("Sorcery Incarnate"));
  assert.ok(at(19).includes("Epic Boon") && at(20).includes("Arcane Apotheosis"));
  assert.equal(subclassLevelOf(sorc(1).classes[0]), 3);
  const def = casterDef("Sorcerer", "", "2024");
  assert.deepEqual(def.spells.slice(1), [2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22]);
  assert.deepEqual([1, 4, 10].map((l) => def.cantrips[l]), [4, 5, 6]);
});

test("Metamagic: the 2024 list, two at 2, four at 10, six at 17", () => {
  assert.deepEqual(entrySets(sorc(1).classes[0]).map((s) => s.id), []);
  assert.deepEqual(entrySets(sorc(2).classes[0]).map((s) => s.id), ["metamagic2024"]);
  const set = optionSetDef("metamagic2024");
  assert.deepEqual(set.known, { 2: 2, 10: 4, 17: 6 });
  assert.deepEqual(set.options.map((o) => o.name + " " + o.cost), ["Careful Spell 1", "Distant Spell 1", "Empowered Spell 1", "Extended Spell 1", "Heightened Spell 2", "Quickened Spell 2", "Seeking Spell 1", "Subtle Spell 1", "Transmuted Spell 1", "Twinned Spell 1"]);
  const c = sorc(5, "", "2024", { cl: { options: { metamagic2024: [{ id: "a", name: "Twinned Spell" }, { id: "b", name: "Heightened Spell" }] } } });
  assert.equal(action(c, "Twinned Spell").cost, 1, "one point, not per level");
  assert.equal(action(c, "Heightened Spell").cost, 2);
  const old = sorc(5, "Draconic Bloodline", "", { cl: { options: { metamagic: [{ id: "a", name: "Quickened Spell" }] } } });
  setClassEdition(old, "Sorcerer", true);
  assert.deepEqual(old.classes[0].options.metamagic2024.map((o) => o.name), ["Quickened Spell"], "the picks carry over");
  assert.equal(old.classes[0].subclass, "Draconic Sorcery");
});

test("Font of Magic: slots only from the book's levels", () => {
  const c = sorc(4);
  assert.equal(H.sorceryProblem(c, action(c, "make2"), "Sorcerer:sorcery_points"), "");
  assert.equal(H.sorceryProblem(c, action(c, "make3"), "Sorcerer:sorcery_points"), "Not enough points");
  const nine = sorc(8);
  assert.equal(H.sorceryProblem(nine, action(nine, "make5"), "Sorcerer:sorcery_points"), "From sorcerer level 9");
  assert.equal(H.sorceryProblem(nine, action(nine, "make4"), "Sorcerer:sorcery_points"), "");
});

test("Innate Sorcery: two uses, then 2 points from level 7", () => {
  const c = sorc(6);
  assert.equal(res(c, "Innate Sorcery").max, 2);
  assert.ok(H.startEffect(c, "innate_sorcery"));
  assert.ok(H.innateSorceryOn(c));
  H.endEffect(c, "innate_sorcery");
  H.startEffect(c, "innate_sorcery"); H.endEffect(c, "innate_sorcery");
  assert.match(H.characterEffects(c).find((e) => e.def.id === "innate_sorcery").why, /Not enough/, "no points before 7");
  const seven = sorc(7);
  seven.resourcesUsed = { "Sorcerer:innate_sorcery": 2 };
  const e = H.characterEffects(seven).find((x) => x.def.id === "innate_sorcery");
  assert.equal(e.points, 2);
  assert.ok(H.startEffect(seven, "innate_sorcery"));
  assert.equal(H.resourceLeft(seven, "Sorcerer:sorcery_points"), 5);
});

test("Sorcerous Restoration: half the level on a short rest, once", () => {
  const c = sorc(9);
  c.resourcesUsed = { "Sorcerer:sorcery_points": 7 };
  assert.equal(H.sorcerousRestoration(c), 4);
  assert.equal(H.resourceLeft(c, "Sorcerer:sorcery_points"), 6);
  assert.equal(H.sorcerousRestoration(c), 0, "once per long rest");
  assert.equal(H.sorcerousRestoration(sorc(4, "", "2024", { c: { resourcesUsed: { "Sorcerer:sorcery_points": 3 } } })), 0);
});

test("the origins: new names, older ones open, the 2014 names reach them", () => {
  const list = subclassesFor("Sorcerer", "2024").map((s) => s.name);
  ["Aberrant Sorcery", "Clockwork Sorcery", "Draconic Sorcery", "Wild Magic Sorcery"].forEach((n) => assert.ok(list.includes(n), n));
  ["Aberrant Mind", "Clockwork Soul", "Draconic Bloodline", "Wild Magic"].forEach((n) => assert.ok(!list.includes(n), n));
  ["Divine Soul", "Shadow Magic", "Storm Sorcery"].forEach((n) => assert.ok(list.includes(n), n));
  assert.equal(classLevelOf(sorc(6, "Clockwork Sorcery"), "Sorcerer", "Clockwork Soul"), 6);
  const young = sorc(2, "Wild Magic", "");
  setClassEdition(young, "Sorcerer", true);
  assert.equal(young.classes[0].subclass, "");
});

test("each origin's spells are the book's", () => {
  const want = {
    "Aberrant Sorcery": ["Arms of Hadar", "Calm Emotions", "Detect Thoughts", "Dissonant Whispers", "Mind Sliver", "Hunger of Hadar", "Sending", "Evard's Black Tentacles", "Summon Aberration", "Rary's Telepathic Bond", "Telekinesis"],
    "Clockwork Sorcery": ["Aid", "Alarm", "Lesser Restoration", "Protection from Evil and Good", "Dispel Magic", "Protection from Energy", "Freedom of Movement", "Summon Construct", "Greater Restoration", "Wall of Force"],
    "Draconic Sorcery": ["Alter Self", "Chromatic Orb", "Command", "Dragon's Breath", "Fear", "Fly", "Arcane Eye", "Charm Monster", "Legend Lore", "Summon Dragon"]
  };
  Object.keys(want).forEach((sub) => {
    assert.deepEqual(H.featureSpells(sorc(9, sub)).filter((s) => / Spells$/.test(s.feature)).map((s) => s.name), want[sub], sub);
  });
});

test("Draconic Sorcery: AC, Elemental Affinity, Dragon Wings", () => {
  assert.equal(computeArmorClass(sorc(3, "Draconic Sorcery")).value, 16, "10 + DEX 2 + CHA 4");
  const c = sorc(14, "Draconic Sorcery", "2024", { cl: { profPicks: { "sub:Draconic Sorcery:Elemental Affinity@6": { slots: [["Fire"]], applied: {} } } } });
  assert.equal(H.dragonType(c), "fire");
  assert.ok(H.effectResistances(c).some((r) => r.type === "fire" && r.source === "Elemental Affinity"));
  c.inventory = [{ id: "a", name: "Leather", type: "armor", category: "light", baseAC: 11, equipped: true }];
  assert.ok(H.startEffect(c, "dragon_wings"));
  assert.equal(H.effectBlocked(c, "dragon_wings"), "", "armor doesn't stop the 2024 wings");
  assert.ok(computeSpeed(c).others.some((o) => o.type === "fly" && o.value === 60));
  H.endEffect(c, "dragon_wings");
  assert.equal(H.characterEffects(c).find((e) => e.def.id === "dragon_wings").points, 3);
});

test("Wild Magic Sorcery: a 20, the 2024 table, Bend Luck for 1 point", () => {
  const c = sorc(6, "Wild Magic Sorcery");
  assert.equal(H.surgeCheckNumber(c), 20);
  assert.equal(WILD_SURGE_2024.length, 25);
  assert.match(H.surgeEntry(1, c).text, /start of each of your turns/);
  assert.match(H.surgeEntry(100, c).text, /Roll 1d6/);
  assert.equal(H.surgeEntry(100, c).applies.length, 3);
  assert.match(H.surgeEntry(33, c).text, /resistance to all damage/);
  assert.equal(action(c, "bend_luck").cost, 1);
  assert.ok(H.characterEffects(c).some((e) => e.def.id === "tides_of_chaos"));
  assert.ok(res(sorc(18, "Wild Magic Sorcery"), "Tamed Surge"));
});

test("Clockwork and Aberrant: uses by Charisma, the shared effects", () => {
  assert.equal(res(sorc(3, "Clockwork Sorcery"), "Restore Balance").max, 4);
  assert.ok(H.characterEffects(sorc(14, "Clockwork Sorcery")).some((e) => e.def.id === "trance_of_order"));
  assert.ok(action(sorc(6, "Clockwork Sorcery"), "bastion3"));
  const ab = sorc(6, "Aberrant Sorcery");
  assert.ok(H.sorceryActions(ab, "Sorcerer:sorcery_points").some((a) => a.id === "psionic:Calm Emotions" && a.cost === 2));
  assert.ok(names(ab).includes("Psychic Defenses"));
  assert.ok(res(sorc(18, "Aberrant Sorcery"), "Warping Implosion"));
});

test("the kit and proficiencies are the book's (p. 138)", () => {
  const [a, gold] = SORCERER_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => [i.name, i.qty]), [["Spear", 1], ["Dagger", 2], ["Arcane Focus (crystal)", 1], ["Dungeoneer's Pack", 1]]);
  assert.deepEqual([a.coins.gp, gold.coins.gp], [28, 50]);
  assert.deepEqual(SORCERER_2024.proficiencies.savingThrows, ["con", "cha"]);
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([SORCERER_2024.level1, SORCERER_2024.features, SORCERER_2024.card, SORCERER_2024.which, SORCERER_2024_SUBCLASSES, WILD_SURGE_2024]);
  assert.ok(!/[–—;]/.test(text));
});
