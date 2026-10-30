/* Class automation Phase 13, the Artificer (2026-10-30): every feature
   checked against Tasha's Cauldron on 5etools' data. Most were automated by
   the infusions and elixirs work; this phase adds Flash of Genius, Tool
   Expertise, Soul of Artifice, Arcane Jolt, the steel defender's Repair,
   Defensive Field's button, Chemical Mastery's wards and the spell-card
   notes. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as A from "../js/core/artificer.js";
import { circleSpellNote } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 8 };
const HAMMER = { id: "h", name: "Warhammer", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, magicBonus: 1, damageDice: "1d8", damageType: "Bludgeoning", category: "martial", props: [] };
function art(sub, lv, extra = {}){
  const c = newCharacter("A");
  c.classes = [{ name: "Artificer", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const res = (c, key) => H.characterResources(c).find((x) => x.key === key);

test("Flash of Genius: the INT modifier while a use is left", () => {
  const c = art("Alchemist", 7);
  assert.equal(A.flashOfGenius(c), 4);
  c.resourcesUsed = { "Artificer:flash_of_genius": 4 };
  assert.equal(A.flashOfGenius(c), 0);
  assert.equal(A.flashOfGenius(art("Alchemist", 6)), 0);
});

test("Tool Expertise from level 6", () => {
  assert.equal(A.hasToolExpertise(art("Alchemist", 5)), false);
  assert.equal(A.hasToolExpertise(art("Alchemist", 6)), true);
});

test("Soul of Artifice: +1 to every save per attuned item", () => {
  const c = art("Armorer", 20, { inventory: [{ id: "a", name: "Ring", attuned: true }, { id: "b", name: "Cloak", attuned: true }, { id: "x", name: "Rope" }] });
  const plain = art("Armorer", 19, { inventory: c.inventory });
  assert.equal(A.soulOfArtificeBonus(c), 2);
  assert.equal(H.computeSave(c, "wis").value, H.computeSave(plain, "wis").value + 2 + 0);
  assert.equal(A.soulOfArtificeReady(c), false, "needs an infusion to end");
  c.infusions = { known: [], active: [{ id: "i", name: "Enhanced Defense" }] };
  assert.equal(A.soulOfArtificeReady(c), true);
});

test("Arcane Jolt: magic weapons only, 2d6 then 4d6, paid with a use", () => {
  const c = art("Battle Smith", 9);
  assert.equal(A.artificerHitDice(c, HAMMER)[0].qty, 2);
  assert.equal(A.artificerHitDice(c, HAMMER)[0].pay, "Artificer:arcane_jolt");
  assert.deepEqual(A.artificerHitDice(c, Object.assign({}, HAMMER, { magicBonus: 0 })), []);
  assert.equal(A.artificerHitDice(art("Battle Smith", 15), HAMMER)[0].qty, 4);
  assert.deepEqual(A.artificerHitDice(art("Battle Smith", 8), HAMMER), []);
  c.resourcesUsed = { "Artificer:arcane_jolt": 4 };
  assert.deepEqual(A.artificerHitDice(c, HAMMER), []);
});

test("Repair rolls 2d8 + PB, a cannon after the free one takes a slot", () => {
  assert.deepEqual([res(art("Battle Smith", 5), "Artificer:steel_defender_repair").roll.qty, res(art("Battle Smith", 5), "Artificer:steel_defender_repair").roll.bonus], [2, 3]);
  assert.equal(res(art("Artillerist", 3), "Artificer:eldritch_cannon").slotMin, 1);
});

test("Chemical Mastery's resistances and immunity", () => {
  const c = art("Alchemist", 15);
  assert.ok(H.featureResistances(c).some((r) => r.type === "acid"));
  assert.ok(H.raceWards(c).conditionImmune.some((w) => w.type === "poisoned"));
});

test("spell cards: Alchemical Savant and Arcane Firearm", () => {
  assert.match(circleSpellNote(art("Alchemist", 5), "Cure Wounds"), /Alchemical Savant: .* add 4/);
  assert.match(circleSpellNote(art("Alchemist", 5), "Fire Bolt"), /Alchemical Savant/);
  assert.equal(circleSpellNote(art("Alchemist", 5), "Catapult"), "", "bludgeoning isn't one of its types");
  assert.match(circleSpellNote(art("Artillerist", 5), "Catapult"), /Arcane Firearm/);
  assert.equal(circleSpellNote(art("Artillerist", 4), "Catapult"), "");
  assert.equal(circleSpellNote(art("Artillerist", 5), "Thunderwave"), "", "not an artificer spell");
});
