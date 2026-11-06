/* The 2024 Wizard (2026-11-06, Phase 15 of the 2024 Player's Handbook):
   checked against the printed book, pp. 164 to 175. A class entry's edition
   "2024" swaps in Ritual Adept, a cantrip swap after each long rest,
   Scholar's Expertise at 2, Memorize Spell at 5, a subclass at level 3 and
   the four 2024 subclasses with their new names and Savant spells. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { WIZARD_2024, WIZARD_2024_SUBCLASSES, SAVANT_LEVELS } from "../js/data/wizard-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, subclassLevelOf, classLevelOf } from "../js/core/class-features.js";
import { learnPlan, applyLearn, cantripFormulas } from "../js/core/spells-known.js";
import { entryGrants, slotOptions, classPickContext } from "../js/core/class-picks.js";
import { circleSpellNote } from "../js/core/spell-scaling.js";
import { getCharacterSenses } from "../js/core/vitals.js";
import { SPELL_DATA } from "../js/data/spells.js";

const ABIL = { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 };
function wiz(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("Z");
  const cl = Object.assign({ name: "Wizard", subclass: sub, level: lv }, extra.cl || {});
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 6 * lv, current: 6 * lv, temp: 0 };
  c.speed = 30;
  c.spells = [{ name: "Fire Bolt", level: 0, learnedBy: "Wizard" }, { name: "Light", level: 0, learnedBy: "Wizard" }, { name: "Mage Hand", level: 0, learnedBy: "Wizard" }];
  Object.assign(c, extra.c || {});
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  Object.keys(s.slots).forEach((k) => { out.spellcasting.slots[k] = { max: s.slots[k], used: 0 }; });
  return out;
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
// The New spells step for the level the entry is at.
const plan = (c, lv, sub) => learnPlan(c, Object.assign({}, c.classes[0], { level: lv, subclass: sub != null ? sub : c.classes[0].subclass }), false);

test("the 2014 wizard is unchanged without an edition", () => {
  const c = wiz(3, "School of Evocation", "");
  assert.equal(subclassLevelOf(c.classes[0]), 2);
  assert.ok(!plan(c, 3).sections.some((s) => s.id === "savant"));
  assert.equal(cantripFormulas(c), null, "no swap without Tasha's");
  assert.match(circleSpellNote(c, "Fireball"), /Sculpt Spells/);
});

test("the features arrive at the book's levels (p. 166)", () => {
  const at = (lv) => names(wiz(lv));
  assert.ok(at(1).includes("Spellcasting") && at(1).includes("Ritual Adept") && at(1).includes("Arcane Recovery"));
  assert.ok(at(2).includes("Scholar") && at(5).includes("Memorize Spell"));
  assert.ok(at(18).includes("Spell Mastery") && at(19).includes("Epic Boon") && at(20).includes("Signature Spells"));
  assert.equal(subclassLevelOf(wiz(1).classes[0]), 3);
  assert.ok(res(wiz(1), "Arcane Recovery") && res(wiz(20), "Signature Spells"));
});

test("a cantrip swap after every long rest, from level 1", () => {
  const cf = cantripFormulas(wiz(1));
  assert.deepEqual(cf.known, ["Fire Bolt", "Light", "Mage Hand"]);
  assert.ok(cf.options.includes("Ray of Frost") && !cf.options.includes("Fire Bolt"));
});

test("Scholar: Expertise in one of six skills you're proficient in", () => {
  const c = wiz(2, "", "2024", { c: { skillProfs: { Arcana: { prof: true }, History: { prof: true }, Insight: { prof: true }, Stealth: { prof: true } } } });
  const g = entryGrants(c.classes[0]).find((x) => x.name === "Scholar");
  const opts = slotOptions(g.def, [[]], 0, classPickContext(c, c.classes[0], g.key)).map((o) => o.value);
  assert.deepEqual(opts, ["Arcana", "History"]);
});

test("Savant: two school spells at 3, one more at each new slot level", () => {
  const c = wiz(2);
  const three = plan(c, 3, "Evoker").sections.find((s) => s.id === "savant");
  assert.equal(three.count, 2);
  assert.ok(three.names.length && three.names.every((n) => SPELL_DATA[n].school === "Evocation" && SPELL_DATA[n].level <= 2));
  assert.ok(three.names.includes("Magic Missile") && three.names.includes("Scorching Ray"));
  const rec = applyLearn(c, "Wizard", plan(c, 3, "Evoker"), [three], { savant: ["Magic Missile", "Scorching Ray"] });
  assert.deepEqual(rec.added, ["Magic Missile", "Scorching Ray"]);
  assert.ok(c.spells.filter((s) => s.name === "Magic Missile" || s.name === "Scorching Ray").every((s) => s.prepared === false && s.learnedBy === "Wizard"), "spellbook spells, not prepared");
  const four = wiz(4, "Diviner");
  assert.ok(!plan(four, 4).sections.some((s) => s.id === "savant"));
  const five = plan(wiz(5, "Diviner"), 5).sections.find((s) => s.id === "savant");
  assert.equal(five.count, 1);
  assert.ok(five.names.includes("Clairvoyance") && five.names.every((n) => SPELL_DATA[n].school === "Divination" && SPELL_DATA[n].level <= 3));
  assert.deepEqual(SAVANT_LEVELS, [5, 7, 9, 11, 13, 15, 17]);
});

test("the subclasses: new names, level 3, the shared automation", () => {
  const subs = subclassesFor("Wizard", "2024").map((s) => s.name);
  assert.deepEqual(subs.slice(0, 4), ["Abjurer", "Diviner", "Evoker", "Illusionist"]);
  assert.ok(!subs.includes("School of Evocation") && subs.includes("Bladesinging"));
  // Abjurer: the ward from 3, Spell Breaker's spells at 10, Spell Resistance.
  const ab = wiz(10, "Abjurer");
  assert.equal(classLevelOf(ab, "Wizard", "School of Abjuration"), 10);
  assert.equal(res(ab, "Arcane Ward HP").max, 24);
  ab.arcaneWard = { hp: 24 };
  assert.ok(H.wardUp(ab));
  assert.ok(H.featureSpells(ab).some((s) => s.name === "Counterspell") && H.featureSpells(ab).some((s) => s.name === "Dispel Magic"));
  assert.match(circleSpellNote(ab, "Dispel Magic"), /bonus action, adding 4/);
  // Diviner: two, then three dice, the Third Eye's darkvision 120.
  assert.equal(res(wiz(3, "Diviner"), "Portent Dice").max, 2);
  assert.equal(res(wiz(14, "Diviner"), "Portent Dice").max, 3);
  assert.equal(H.portentCount(wiz(14, "Diviner")), 3);
  const eye = wiz(10, "Diviner", "2024", { c: { effects: { third_eye: "Darkvision" }, activeEffects: { third_eye: true } } });
  const fx = H.characterEffects(eye).find((e) => e.def.id === "third_eye");
  assert.deepEqual(fx.def.choose.options, ["Darkvision", "Greater Comprehension", "See Invisibility"]);
  assert.equal(H.characterEffects(wiz(10, "School of Divination", "")).find((e) => e.def.id === "third_eye").def.choose.options.length, 4, "the 2014 one keeps its four");
  assert.match(getCharacterSenses(eye), /Darkvision 120/);
  // Evoker: Sculpt Spells from 6 (not 3), Overchannel at 14.
  assert.doesNotMatch(circleSpellNote(wiz(3, "Evoker"), "Fireball"), /Sculpt Spells/);
  assert.match(circleSpellNote(wiz(6, "Evoker"), "Fireball"), /Sculpt Spells/);
  assert.ok(res(wiz(14, "Evoker"), "Overchannel (Free Use)"));
  // Illusionist: Minor Illusion at 3, free summons at 6, Illusory Self at 10.
  assert.ok(H.featureSpells(wiz(3, "Illusionist")).some((s) => s.name === "Minor Illusion"));
  const ill = wiz(10, "Illusionist");
  assert.ok(res(ill, "Phantasmal Creatures (Free Summon Beast)") && res(ill, "Phantasmal Creatures (Free Summon Fey)"));
  assert.equal(res(ill, "Illusory Self").slotMin, 2);
});

test("switching edition carries the school across", () => {
  const c = wiz(6, "School of Evocation", "");
  setClassEdition(c, "Wizard", true);
  assert.equal(c.classes[0].subclass, "Evoker");
  setClassEdition(c, "Wizard", false);
  assert.equal(c.classes[0].subclass, "School of Evocation");
  // A 2014 school picked at 2 goes for a 2024 wizard 2 (the subclass comes at 3).
  const two = wiz(2, "School of Abjuration", "");
  setClassEdition(two, "Wizard", true);
  assert.equal(two.classes[0].subclass, "");
});

test("the kit and proficiencies are the book's (p. 165)", () => {
  const [a, gold] = WIZARD_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => [i.name, i.qty]), [["Dagger", 2], ["Quarterstaff", 1], ["Robe", 1], ["Spellbook", 1], ["Scholar's Pack", 1]]);
  assert.deepEqual([a.coins.gp, gold.coins.gp], [5, 55]);
  assert.deepEqual(WIZARD_2024.proficiencies.savingThrows, ["int", "wis"]);
  assert.ok(WIZARD_2024.skillChoices.options.includes("Nature"));
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([WIZARD_2024.level1, WIZARD_2024.features, WIZARD_2024.card, WIZARD_2024.which, WIZARD_2024.spellcasting, WIZARD_2024_SUBCLASSES]);
  assert.ok(!/[–—;]/.test(text));
});
