/* The 2024 Bard (2026-11-06, Phase 12 of the 2024 Player's Handbook):
   checked against the printed book, pp. 58 to 66. A class entry's edition
   "2024" swaps in Expertise at 2, a spell list learned to the Prepared Spells
   column, Magical Secrets from three more lists, Superior Inspiration, Words
   of Creation and the 2024 colleges with the new College of Dance. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { BARD_2024, BARD_2024_SUBCLASSES } from "../js/data/bard-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, classProficiencies } from "../js/core/class-features.js";
import { casterDef, learnPlan } from "../js/core/spells-known.js";
import { computeArmorClass } from "../js/core/vitals.js";
import { regainOnInitiative } from "../js/core/character-resources.js";
import { characterReminders } from "../js/core/reminders.js";
import { danceFootwork } from "../js/core/bard.js";

const ABIL = { str: 10, dex: 16, con: 12, int: 10, wis: 12, cha: 16 };
function bard(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("B");
  const cl = { name: "Bard", subclass: sub, level: lv };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  Object.keys(s.slots).forEach((k) => { out.spellcasting.slots[k] = { max: s.slots[k], used: 0 }; });
  return out;
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const plan = (c, lv, sub) => learnPlan(c, { name: "Bard", edition: c.classes[0].edition, subclass: sub || c.classes[0].subclass, level: lv }, false);

test("the 2014 bard is unchanged without an edition", () => {
  const c = bard(10, "College of Lore", "");
  assert.ok(names(c).includes("Song of Rest") && names(c).includes("Countercharm"));
  assert.deepEqual(casterDef("Bard", "").spells.slice(1, 4), [4, 5, 6]);
  assert.ok(H.characterEffects(c).some((e) => e.def.id === "countercharm"));
  assert.ok(plan(bard(9, "", ""), 10).sections.some((s) => s.id === "secrets"), "the 2014 Magical Secrets at 10");
});

test("the features arrive at the book's levels (p. 60)", () => {
  const at = (lv) => names(bard(lv));
  assert.ok(at(1).includes("Bardic Inspiration") && at(1).includes("Spellcasting"));
  assert.ok(at(2).includes("Expertise") && at(2).includes("Jack of All Trades") && !at(20).includes("Song of Rest"));
  assert.ok(at(5).includes("Font of Inspiration"));
  assert.ok(at(7).includes("Countercharm") && !at(6).includes("Countercharm"));
  assert.ok(at(10).includes("Magical Secrets") && at(18).includes("Superior Inspiration"));
  assert.ok(at(19).includes("Epic Boon") && at(20).includes("Words of Creation"));
  assert.ok(!H.characterEffects(bard(10)).some((e) => e.def.id === "countercharm"), "a reaction now, not the 2014 performance");
  assert.ok(characterReminders(bard(7)).some((r) => r.name === "Countercharm" && r.when === "reaction"));
});

test("spells follow the Prepared Spells column, swapped one a level", () => {
  const def = casterDef("Bard", "", "2024");
  assert.deepEqual(def.spells.slice(1), [4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22]);
  assert.deepEqual([1, 4, 10].map((l) => def.cantrips[l]), [2, 3, 4]);
  assert.ok(def.swap && def.cantripSwap === "level");
  assert.ok(H.featureSpells(bard(20)).some((s) => s.name === "Power Word Heal") && H.featureSpells(bard(20)).some((s) => s.name === "Power Word Kill"));
});

test("Magical Secrets: the Cleric, Druid and Wizard lists from 10", () => {
  assert.deepEqual(H.classExtraSpellLists(bard(9).classes[0]), []);
  assert.deepEqual(H.classExtraSpellLists(bard(10).classes[0]), ["Cleric", "Druid", "Wizard"]);
  const c = bard(10);
  c.spells = [];
  const p = plan(c, 11);
  assert.ok(!p.sections.some((s) => s.id === "secrets"), "no 2014 secrets section");
  const spells = p.sections.find((s) => s.id === "spells");
  assert.ok(spells && spells.names.includes("Fireball") && spells.names.includes("Cure Wounds") && spells.names.includes("Call Lightning"), "wizard, cleric and druid spells offered");
  assert.ok(!plan(bard(8), 9).sections.find((s) => s.id === "spells").names.includes("Fireball"), "not before 10");
});

test("Bardic Inspiration: Font of Inspiration and Superior Inspiration", () => {
  assert.equal(res(bard(4), "Bardic Inspiration").reset, "long");
  assert.equal(res(bard(5), "Bardic Inspiration").reset, "short");
  const c = bard(18);
  c.resourcesUsed = { "Bard:bardic_inspiration": 3 };
  regainOnInitiative(c);
  assert.equal(H.resourceLeft(c, "Bard:bardic_inspiration"), 2, "back up to two");
  c.resourcesUsed = { "Bard:bardic_inspiration": 1 };
  regainOnInitiative(c);
  assert.equal(H.resourceLeft(c, "Bard:bardic_inspiration"), 2, "two left: nothing changes");
  const low = bard(17);
  low.resourcesUsed = { "Bard:bardic_inspiration": 3 };
  regainOnInitiative(low);
  assert.equal(H.resourceLeft(low, "Bard:bardic_inspiration"), 0, "not before 18");
});

test("proficiencies, kit and multiclass are the book's (p. 59)", () => {
  const p = classProficiencies(bard(1), 0);
  assert.deepEqual(p.weapons, ["Simple weapons"]);
  assert.deepEqual(BARD_2024.proficiencies.savingThrows, ["dex", "cha"]);
  const [a, gold] = BARD_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => [i.name, i.qty]), [["Leather", 1], ["Dagger", 2], ["Lute", 1], ["Entertainer's Pack", 1]]);
  assert.deepEqual([a.coins.gp, gold.coins.gp], [19, 90]);
});

test("the colleges: 2024 ones, the new Dance, older ones open", () => {
  const list = subclassesFor("Bard", "2024").map((s) => s.name);
  ["College of Dance", "College of Glamour (2024)", "College of Lore (2024)", "College of Valor (2024)"].forEach((n) => assert.ok(list.includes(n), n));
  ["College of Glamour", "College of Lore", "College of Valor"].forEach((n) => assert.ok(!list.includes(n), n));
  ["College of Swords", "College of Whispers", "College of Eloquence"].forEach((n) => assert.ok(list.includes(n), n));
  const c = bard(5, "College of Lore", "");
  setClassEdition(c, "Bard", true);
  assert.equal(c.classes[0].subclass, "College of Lore (2024)");
});

test("Dance: Dazzling Footwork's AC and unarmed strike, Tandem Footwork", () => {
  const c = bard(5, "College of Dance");
  assert.equal(danceFootwork(c), 8);
  assert.equal(computeArmorClass(c).value, 16, "10 + DEX 3 + CHA 3");
  const u = H.unarmedStrike(c);
  assert.deepEqual([u.die, u.ability], [8, "DEX"]);
  c.inventory = [{ id: "a", name: "Leather", type: "armor", category: "light", baseAC: 11, equipped: true }];
  assert.equal(danceFootwork(c), 0);
  assert.equal(H.unarmedStrike(c), null);
  assert.ok(H.bardicActions(bard(6, "College of Dance")).some((a) => a.id === "tandem_footwork"));
  assert.ok(!H.bardicActions(bard(5, "College of Dance")).some((a) => a.id === "tandem_footwork"));
});

test("Glamour, Lore and Valor", () => {
  const glam = H.bardicActions(bard(3, "College of Glamour (2024)")).find((a) => a.id === "mantle_of_inspiration");
  assert.deepEqual([glam.roll.die, glam.roll.qty], [6, 1]);
  assert.ok(H.featureSpells(bard(6, "College of Glamour (2024)")).filter((s) => ["Charm Person", "Mirror Image", "Command"].includes(s.name)).length === 3);
  assert.equal(res(bard(3, "College of Glamour (2024)"), "Beguiling Magic").diceRestore.key, "Bard:bardic_inspiration");
  const g = bard(20, "College of Glamour (2024)");
  assert.ok(H.startEffect(g, "mantle_of_majesty"));
  H.endEffect(g, "mantle_of_majesty");
  assert.equal(H.characterEffects(g).find((e) => e.def.id === "mantle_of_majesty").slot, 3, "a level 3 slot pays next");
  assert.ok(H.bardicActions(bard(3, "College of Lore (2024)")).some((a) => a.id === "cutting_words"));
  const lore = bard(5, "College of Lore (2024)");
  lore.spells = [];
  const disc = plan(lore, 6).sections.find((s) => s.id === "loreDiscoveries");
  assert.ok(disc && disc.count === 2 && disc.names.includes("Fireball") && disc.names.includes("Guidance") && disc.names.includes("Produce Flame"), "cantrips too");
  assert.ok(!plan(bard(5, "College of Lore", ""), 6).sections.some((s) => s.id === "loreDiscoveries"));
  const valor = classProficiencies(bard(3, "College of Valor (2024)"), 0);
  assert.ok(valor.weapons.includes("Martial weapons") && valor.armor.includes("Medium armor") && valor.armor.includes("Shields"));
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([BARD_2024.level1, BARD_2024.features, BARD_2024.card, BARD_2024.which, BARD_2024_SUBCLASSES]);
  assert.ok(!/[–—;]/.test(text));
});
