/* The 2024 artificer subclasses (Eberron: Forge of the Artificer;
   artificer fix Phase 5, 2026-11-12), checked against 5etools' data
   (source EFA): Alchemist, Armorer, Artillerist and Battle Smith. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as A from "../js/core/artificer.js";
import * as R from "../js/core/replicate.js";
import { stealthCheck } from "../js/core/checks.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { COMPANIONS } from "../js/data/companions.js";
import { makeCatalogMagicItem } from "../js/render/armory.js";
import { MAGIC_ITEM_DATA } from "../js/data/magic-items.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 8 };
function art(sub, lv, extra = {}){
  const c = newCharacter("A");
  c.classes = [{ name: "Artificer", subclass: sub, level: lv, edition: "2024" }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  c.spellcasting = { ability: "int", slots: { 1: { max: 4, used: 0 }, 2: { max: 3, used: 0 } }, pact: null };
  Object.assign(c, extra);
  return ensureShape(c);
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, id) => H.characterResources(c).find((r) => r.key === "Artificer:" + id);

test("a 2024 artificer picks the 2024 subclasses; the switch swaps them", () => {
  const subs = H.subclassesFor("Artificer", "2024").map((s) => s.name);
  assert.deepEqual(subs, ["Alchemist (2024)", "Armorer (2024)", "Artillerist (2024)", "Battle Smith (2024)", "Cartographer", "Reanimator"]);
  assert.deepEqual(H.subclassesFor("Artificer", "2014").map((s) => s.name), ["Alchemist", "Artillerist", "Battle Smith", "Armorer"]);
  const c = newCharacter("S");
  c.classes = [{ name: "Artificer", subclass: "Battle Smith", level: 6 }];
  setClassEdition(c, "Artificer", true);
  assert.deepEqual([c.classes[0].edition, c.classes[0].subclass], ["2024", "Battle Smith (2024)"]);
});

test("subclass spells: Vitriolic Sphere for the Alchemist, Shining Smite for the Battle Smith", () => {
  const spells = (c) => H.featureSpells(c).map((s) => s.name);
  assert.ok(spells(art("Alchemist (2024)", 13)).includes("Vitriolic Sphere") && !spells(art("Alchemist (2024)", 13)).includes("Blight"));
  assert.ok(spells(art("Battle Smith (2024)", 5)).includes("Shining Smite") && !spells(art("Battle Smith (2024)", 5)).includes("Branding Smite"));
});

test("2024 Alchemist: 2 to 5 elixirs, the table grows, a 6 is a choice, no temp HP", () => {
  assert.deepEqual([3, 5, 9, 15].map((lv) => A.freeElixirCount(lv, "2024")), [2, 3, 4, 5]);
  const c = art("Alchemist (2024)", 9);
  const rolls = [6, 1, 2, 3];
  A.rollFreeElixirs(c, () => rolls.shift());
  const list = c.elixirs.list;
  assert.deepEqual(list.map((e) => e.name), ["Your choice", "Healing", "Swiftness", "Resilience"]);
  assert.equal(A.chooseElixir(c, list[0].id, "Flight"), true);
  assert.match(A.elixirEffect("Flight", c).text, /20 feet/);
  assert.deepEqual(A.elixirRolls(c, "Healing").map((r) => [r.label, r.diceText, r.bonus]), [["Heal", "3d8", 4]], "3d8 at 9, no Restorative Reagents temp HP");
  assert.deepEqual(A.elixirRolls(art("Alchemist", 9, { classes: [{ name: "Artificer", subclass: "Alchemist", level: 9 }] }), "Healing").map((r) => r.label), ["Heal", "Temp HP"], "Tasha's keeps them");
  assert.equal(res(art("Alchemist (2024)", 15), "conjured_cauldron").max, 1);
  const r = H.featureResistances ? H.featureResistances(art("Alchemist (2024)", 15)) : null;
  if(r) assert.ok(JSON.stringify(r).includes("acid"));
});

test("2024 Armorer: three models, bigger dice at 15, Improved Arsenal at 9", () => {
  const c = art("Armorer (2024)", 3, { inventory: [{ id: "p", name: "Plate", type: "armor", category: "heavy", baseAC: 18, equipped: true }] });
  assert.deepEqual(Object.keys(A.armorModelsFor(c.classes[0])), ["Dreadnaught", "Guardian", "Infiltrator"]);
  A.setArmorModel(c, "Dreadnaught");
  let w = A.armorModelWeapon(c);
  assert.deepEqual([w.name, w.diceText, w.type, w.ability, w.magic], ["Force Demolisher", "1d10", "force", "int", 0]);
  assert.ok(res(c, "giant_stature"), "Giant Stature's uses");
  c.classes[0].level = 9;
  w = A.armorModelWeapon(c);
  assert.equal(w.magic, 1, "Improved Arsenal +1");
  c.classes[0].level = 15;
  assert.equal(A.armorModelWeapon(c).diceText, "2d6");
  A.setArmorModel(c, "Infiltrator");
  assert.equal(A.armorModelWeapon(c).diceText, "2d6");
  assert.equal(stealthCheck(c).mode, "adv", "Dampening Field");
  assert.ok(H.computeSpeed(c).parts.some((p) => p.name === "Powered Steps"));
  assert.equal(res(c, "infiltrator_flight").max, 4);
  A.setArmorModel(c, "Guardian");
  assert.equal(A.armorModelWeapon(c).diceText, "1d10");
  assert.equal(A.armorModelDef(c).bloodiedField, true);
  assert.equal(res(c, "defensive_field"), undefined, "the 2024 Defensive Field has no uses (only while bloodied)");
  assert.equal(H.armorStrengthShortfall(c, Object.assign({}, c.inventory[0], { strReq: 15 })), 0, "Arcane Armor: no Strength requirement");
  assert.ok(!names(c).includes("Armor Modifications") && A.hasArmorModifications(c) === false);
});

test("Improved Armorer: one more plan and one more item, both armor", () => {
  const c = art("Armorer (2024)", 9);
  assert.deepEqual(R.planLimits(c), { plans: 6, items: 4, basePlans: 5, baseItems: 3, extra: 1 });
  ["Bag of Holding", "Sending Stones", "Rope of Climbing", "Goggles of Night", "Wand of Secrets"].forEach((n) => assert.ok(R.learnPlan(c, n), n));
  const opts = R.learnablePlans(c);
  assert.equal(opts.find((p) => p.name === "Wand of Magic Detection").reason, "your extra plan must be armor");
  assert.equal(opts.find((p) => p.name === "+1 Armor").reason, "");
  assert.ok(R.learnPlan(c, "+1 Armor"));
  const make = (n, base) => { const k = c.plans.known.find((x) => x.name === n); return R.makeReplica(c, k.id, makeCatalogMagicItem(c, k.item, MAGIC_ITEM_DATA[k.item], base)); };
  ["Bag of Holding", "Sending Stones", "Rope of Climbing"].forEach((n) => make(n));
  assert.deepEqual(R.replicasToVanish(c, true), [], "the armor fits the extra place");
  assert.equal(R.replicasToVanish(c, false).length, 1, "a fourth plain item doesn't");
  make("+1 Armor", "Plate");
  assert.equal(c.plans.made.length, 4);
});

test("2024 Artillerist and Battle Smith: their cards and resources", () => {
  const x = (lv) => ({ lv, pb: 4, mods: { int: 4 }, spellAttack: 8, spellDC: 16 });
  const def = COMPANIONS.find((d) => d.id === "steel_defender_2024");
  const s = def.stats(x(15));
  assert.deepEqual([s.ac, s.hp, s.attacks[0].bonus, s.actions[0].bonus], [16, 80, 6, 4], "AC 12 + INT, HP 5 + 5 per level, Rend 1d8 + 2 + INT, Repair 2d8 + INT");
  assert.match(s.reactions[0].text, /1d4 \+ 4 force/);
  const cannon = COMPANIONS.find((d) => d.id === "eldritch_cannon_2024").stats(x(9));
  assert.deepEqual([cannon.attacks[0].dice, cannon.actions[1].dice, cannon.reactions[0].dice], ["3d8", "2d8", "3d10"], "Firepower and Detonate");
  const bs = art("Battle Smith (2024)", 3);
  assert.deepEqual([res(bs, "steel_defender_repair").roll.bonus, res(bs, "steel_defender_repair").max], [4, 3]);
  assert.equal(H.isProficientWithWeapon(bs, "Longsword", "martial"), true, "Battle Ready: martial weapons");
  const ar = art("Artillerist (2024)", 3);
  assert.equal(H.isProficientWithWeapon(ar, "Longbow", "martial"), true, "martial ranged weapons");
  assert.equal(H.isProficientWithWeapon(ar, "Longsword", "martial"), false, "not martial melee");
  assert.ok(res(ar, "eldritch_cannon"));
});
