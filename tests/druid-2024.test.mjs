/* The 2024 Druid (2026-11-06, Phase 11 of the 2024 Player's Handbook):
   checked against the printed book, pp. 78 to 88. A class entry's edition
   "2024" swaps in Primal Order, the new Wild Shape (your own hit points, with
   temporary ones), Wild Resurgence, Elemental Fury, Archdruid, a circle at
   level 3 and the four 2024 circles, the Circle of the Sea among them. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { DRUID_2024, DRUID_2024_SUBCLASSES, wildShapeUses2024 } from "../js/data/druid-2024.js";
import { SPELL_DATA_2024 } from "../js/data/spells-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, subclassLevelOf, classProficiencies, classLevelOf } from "../js/core/class-features.js";
import { casterDef } from "../js/core/spells-known.js";
import { skillCheck } from "../js/core/checks.js";
import { computeSave, computeSpeed, maxHp, computeArmorClass } from "../js/core/vitals.js";
import { wildCompanionHours } from "../js/core/companions.js";
import { setSpellEdition } from "../js/core/spell-edition.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 12, wis: 16, cha: 10 };
function druid(lv, sub = "", edition = "2024", picks = {}, extra = {}){
  const c = newCharacter("D");
  const cl = { name: "Druid", subclass: sub, level: lv, profPicks: {} };
  if(edition) cl.edition = edition;
  Object.keys(picks).forEach((k) => { cl.profPicks[k] = { slots: [[picks[k]]], applied: {} }; });
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra);
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  Object.keys(s.slots).forEach((k) => { out.spellcasting.slots[k] = { max: s.slots[k], used: 0 }; });
  return out;
}
const ORDER = "class:Primal Order@1", FURY = "class:Elemental Fury@7";
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);

test("the 2014 druid is unchanged without an edition", () => {
  const c = druid(4, "Circle of the Moon", "");
  assert.equal(subclassLevelOf(c.classes[0]), 2);
  assert.equal(res(c, "Wild Shape").max, 2);
  assert.ok(H.startWildShape(c, "Wolf"));
  assert.equal(c.hp.current, 11, "the 2014 form's own hit points");
  assert.equal(maxHp(c), 11);
  H.endWildShape(c);
  assert.equal(c.hp.current, 32);
  assert.equal(res(druid(20, "", ""), "Wild Shape").max, Infinity);
  assert.ok(H.hasCombatWildShape(c));
});

test("the features arrive at the book's levels (p. 80)", () => {
  const at = (lv) => names(druid(lv));
  assert.ok(["Spellcasting", "Druidic", "Primal Order"].every((n) => at(1).includes(n)));
  assert.ok(at(2).includes("Wild Shape") && at(2).includes("Wild Companion"));
  assert.ok(at(5).includes("Wild Resurgence"));
  assert.ok(at(7).includes("Elemental Fury"));
  assert.ok(at(15).includes("Improved Elemental Fury"));
  assert.ok(at(18).includes("Beast Spells") && !at(18).includes("Timeless Body"));
  assert.ok(at(19).includes("Epic Boon") && at(20).includes("Archdruid"));
  assert.equal(subclassLevelOf(druid(1).classes[0]), 3);
  assert.ok(H.featureSpells(druid(1)).some((s) => s.name === "Speak with Animals" && s.kind === "prepared"));
  const def = casterDef("Druid", "", "2024");
  assert.deepEqual([1, 4, 10].map((l) => def.cantrips[l]), [2, 3, 4]);
  assert.equal(def.cantripSwap, "level");
});

test("Wild Shape: two uses, three at 6, four at 17, one back on a short rest", () => {
  assert.deepEqual([2, 5, 6, 16, 17, 20].map(wildShapeUses2024), [2, 2, 3, 3, 4, 4]);
  assert.equal(res(druid(1), "Wild Shape"), undefined);
  const c = druid(6);
  assert.equal(res(c, "Wild Shape").max, 3);
  H.spendResource(c, "Druid:wild_shape", 3);
  H.restoreResources(c, "short");
  assert.equal(H.resourceLeft(c, "Druid:wild_shape"), 1);
  assert.equal(res(druid(19), "Wild Shape").initiativeRegain, 0);
  assert.equal(res(druid(20), "Wild Shape").initiativeRegain, 1, "Evergreen Wild Shape");
  assert.equal(res(druid(20), "Wild Shape").max, 4, "not unlimited any more");
});

test("the Beast Shapes table: CR, flying, swimming at any level", () => {
  assert.deepEqual(H.wildShapeLimit(druid(2)), { cr: 1/4, fly: false, swim: true, elemental: false, hours: 1 });
  assert.equal(H.wildShapeLimit(druid(4)).cr, 1/2);
  assert.deepEqual([H.wildShapeLimit(druid(8)).cr, H.wildShapeLimit(druid(8)).fly], [1, true]);
  assert.deepEqual([3, 6, 9, 12].map((l) => H.wildShapeLimit(druid(l, "Circle of the Moon (2024)")).cr), [1, 2, 3, 4]);
  assert.ok(!H.wildShapeOptions(druid(20, "Circle of the Moon (2024)")).some((f) => /Elemental/.test(f.name)), "no elementals in 2024");
  assert.ok(H.wildShapeOptions(druid(2)).some((f) => f.speed.swim), "a swimmer at level 2");
});

test("a 2024 form keeps your hit points and adds temporary ones", () => {
  const c = druid(5);
  c.hp.current = 30;
  assert.ok(H.startWildShape(c, "Wolf"));
  assert.deepEqual([c.hp.current, c.hp.temp, maxHp(c)], [30, 5, 40]);
  assert.equal(H.wildShapeDamage(c, 7), 7, "damage reaches you, after the temporary hit points");
  H.endWildShape(c);
  assert.equal(c.hp.current, 30);
  assert.equal(c.wildShape, undefined);
  const moon = druid(6, "Circle of the Moon (2024)");
  moon.hp.temp = 4;
  H.startWildShape(moon, "Brown Bear");
  assert.equal(moon.hp.temp, 18, "three times the level for the Moon");
  assert.equal(computeArmorClass(moon).value, 16, "13 + WIS beats the bear's 11");
  assert.match(computeSave(moon, "con").breakdown, /Improved Circle Forms \(\+3\)/);
  H.endWildShape(moon);
  assert.doesNotMatch(computeSave(moon, "con").breakdown, /Improved Circle Forms/);
  assert.ok(!H.hasCombatWildShape(moon) && !H.hasPrimalStrike(moon), "the 2014 Moon's features");
});

test("Primal Order: Magician's cantrip and bonus, Warden's armor and weapons", () => {
  const mage = druid(1, "", "2024", { [ORDER]: "Magician" }, { skillProfs: { Nature: { prof: true, expertise: false } } });
  assert.match(skillCheck(mage, "Nature").breakdown, /Magician \(\+3\)/);
  assert.match(skillCheck(mage, "Arcana").breakdown, /Magician \(\+3\)/);
  assert.deepEqual(H.choiceEffectsOf(mage.classes[0]).map((e) => e.cantrips), [1]);
  const warden = druid(1, "", "2024", { [ORDER]: "Warden" });
  const p = classProficiencies(warden, 0);
  assert.ok(p.armor.includes("Medium armor") && p.weapons.includes("Martial weapons") && p.tools.includes("Herbalism kit"));
});

test("Elemental Fury: Primal Strike on weapons and forms, or Potent Spellcasting", () => {
  const strike = druid(7, "", "2024", { [FURY]: "Primal Strike" });
  assert.deepEqual(H.druidHitDice(strike, false).map((d) => d.qty + "d" + d.die), ["1d8"]);
  assert.deepEqual(H.formHitDice(strike).map((d) => d.name), ["Primal Strike"]);
  assert.equal(H.druidHitDice(druid(15, "", "2024", { [FURY]: "Primal Strike" }), true)[0].qty, 2);
  const potent = druid(7, "", "2024", { [FURY]: "Potent Spellcasting" });
  assert.ok(H.druidPotentSpellcasting(potent) && !H.druidPotentSpellcasting(strike));
  assert.deepEqual(H.druidHitDice(potent, true), []);
  assert.deepEqual(H.formHitDice(druid(14, "Circle of the Moon (2024)")).map((d) => d.text), ["Lunar Form +2d10"]);
});

test("Wild Companion lasts until a long rest", () => {
  assert.equal(wildCompanionHours(druid(2)), "long");
  assert.equal(wildCompanionHours(druid(1)), 0);
});

test("the circles: 2024 at level 3, the Sea new, older ones open", () => {
  const list = subclassesFor("Druid", "2024").map((s) => s.name);
  ["Circle of the Land (2024)", "Circle of the Moon (2024)", "Circle of the Sea", "Circle of the Stars (2024)"].forEach((n) => assert.ok(list.includes(n), n));
  ["Circle of the Land", "Circle of the Moon", "Circle of Stars"].forEach((n) => assert.ok(!list.includes(n), n));
  ["Circle of Spores", "Circle of Wildfire", "Circle of Dreams"].forEach((n) => assert.ok(list.includes(n), n));
  assert.ok(!subclassesFor("Druid", "2014").some((s) => s.name === "Circle of the Sea"));
  const c = druid(5, "Circle of Stars", "");
  setClassEdition(c, "Druid", true);
  assert.equal(c.classes[0].subclass, "Circle of the Stars (2024)");
  assert.equal(classLevelOf(c, "Druid", "Circle of Stars"), 5, "the 2014 name finds the 2024 circle");
  const young = druid(2, "Circle of the Moon", "");
  setClassEdition(young, "Druid", true);
  assert.equal(young.classes[0].subclass, "");
});

test("each circle's spells are the book's", () => {
  setSpellEdition("2024");
  try{
    const want = {
      "Circle of the Moon (2024)": ["Cure Wounds", "Moonbeam", "Starry Wisp", "Conjure Animals", "Fount of Moonlight", "Mass Cure Wounds"],
      "Circle of the Sea": ["Fog Cloud", "Gust of Wind", "Ray of Frost", "Shatter", "Thunderwave", "Lightning Bolt", "Water Breathing", "Control Water", "Ice Storm", "Conjure Elemental", "Hold Monster"]
    };
    Object.keys(want).forEach((sub) => {
      want[sub].forEach((n) => assert.ok(SPELL_DATA_2024[n] || H.catalogSpellName, sub + ": " + n));
      assert.deepEqual(H.featureSpells(druid(9, sub)).filter((s) => / Spells$/.test(s.feature)).map((s) => s.name), want[sub]);
    });
    const land = druid(9, "Circle of the Land (2024)");
    land.classes[0].spellChoices = { land: "Polar" };
    assert.deepEqual(H.featureSpells(land).filter((s) => s.feature === "Circle Spells").map((s) => s.name), ["Fog Cloud", "Hold Person", "Ray of Frost", "Sleet Storm", "Ice Storm", "Cone of Cold"]);
    const stars = druid(3, "Circle of the Stars (2024)");
    assert.deepEqual(H.featureSpells(stars).filter((s) => s.feature === "Star Map").map((s) => s.name), ["Guidance", "Guiding Bolt"]);
  } finally { setSpellEdition("2014"); }
});

test("Land: Land's Aid's dice, Nature's Ward by land, Natural Recovery", () => {
  assert.deepEqual([3, 9, 10, 14].map((l) => H.landsAidDice(druid(l, "Circle of the Land (2024)"))), [2, 2, 3, 4]);
  assert.equal(H.landsAidDice(druid(3, "Circle of the Land", "")), 0);
  const c = druid(10, "Circle of the Land (2024)");
  c.classes[0].spellChoices = { land: "Arid" };
  assert.deepEqual(H.druidResistances(c), [{ type: "fire", source: "Nature's Ward" }]);
  c.classes[0].spellChoices = { land: "Tropical" };
  assert.equal(H.landWard(c), "poison");
  assert.ok(names(c).includes("Nature's Ward"));
  assert.equal(res(druid(6, "Circle of the Land (2024)"), "Natural Recovery").max, 1);
  assert.ok(res(druid(6, "Circle of the Land (2024)"), "Natural Recovery (free Circle Spell)"));
});

test("Sea: Wrath of the Sea, Aquatic Affinity, Stormborn", () => {
  const c = druid(10, "Circle of the Sea");
  assert.equal(H.wrathDice(c), 3);
  assert.ok(H.startEffect(c, "wrath_of_the_sea"));
  assert.equal(H.resourceLeft(c, "Druid:wild_shape"), 2);
  const speeds = computeSpeed(c).others.map((o) => o.type + " " + o.value);
  assert.ok(speeds.includes("swim 30") && speeds.includes("fly 30"), speeds.join());
  assert.deepEqual(H.druidResistances(c).map((r) => r.type), ["cold", "lightning", "thunder"]);
  H.endEffect(c, "wrath_of_the_sea");
  assert.deepEqual(H.druidResistances(c), []);
});

test("Stars and Moon: resources by Wisdom", () => {
  const stars = druid(6, "Circle of the Stars (2024)");
  assert.equal(res(stars, "Star Map: Free Guiding Bolt").max, 3);
  assert.equal(res(stars, "Cosmic Omen").max, 3);
  assert.ok(H.startEffect(stars, "starry_form", "Archer"));
  assert.equal(H.starryConstellation(stars), "Archer");
  assert.equal(H.starryDice(druid(10, "Circle of the Stars (2024)")), 2);
  const moon = res(druid(10, "Circle of the Moon (2024)"), "Moonlight Step");
  assert.deepEqual([moon.max, moon.slotMin], [3, 2]);
});

test("the kit and proficiencies are the book's (p. 79)", () => {
  const [a, gold] = DRUID_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => i.name), ["Leather", "Shield", "Sickle", "Quarterstaff", "Explorer's Pack", "Herbalism Kit"]);
  assert.equal(a.coins.gp, 9);
  assert.equal(gold.coins.gp, 50);
  assert.equal(DRUID_2024.skillChoices.options.length, 8);
  assert.deepEqual(DRUID_2024.proficiencies.savingThrows, ["int", "wis"]);
  assert.deepEqual(DRUID_2024.multiclassProfs.armor, ["Light armor", "Shields"]);
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([DRUID_2024.level1, DRUID_2024.features, DRUID_2024.card, DRUID_2024.which, DRUID_2024_SUBCLASSES]);
  assert.ok(!/[–—;]/.test(text));
});
