/* The 2024 Player's Handbook's weapon changes (2026-11-06), checked against
   the Weapons table on p. 215 and the Net on p. 227: a character on the
   2024 rules or with a 2024 class uses the 2024 Lance, Trident, War Pick
   and Warhammer, and finds the Net with the adventuring gear. Carried
   weapons follow, except what the player edited. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { useSpellsOf } from "../js/core/spell-edition.js";
import { weaponEdition } from "../js/core/weapon-edition.js";
import { WEAPON_DATA, WEAPON_GROUPS, weaponDataOf } from "../js/data/weapons.js";
import { GEAR_DATA, GEAR_GROUPS } from "../js/data/gear.js";
import { isHeavyWeapon } from "../js/core/equipment.js";

function char(rules2024, inventory){
  const c = newCharacter("W");
  c.classes = [{ name: "Fighter", subclass: "", level: 3 }];
  c.rules2024 = rules2024;
  c.inventory = inventory || [];
  return ensureShape(c);
}
const trident = () => ({ name: "Trident", type: "weapon", qty: 1, damageDice: "1d6", damageType: "Piercing", weight: 4, notes: "Thrown (20/60), versatile (1d8)", ability: "str", proficient: true });

test("a 2014 character keeps the 2014 weapons", () => {
  useSpellsOf(char(false));
  assert.equal(weaponEdition(), "2014");
  assert.equal(WEAPON_DATA["Trident"].damageDice, "1d6");
  assert.equal(WEAPON_DATA["Lance"].damageDice, "1d12");
  assert.ok(WEAPON_GROUPS["Martial Ranged"].includes("Net") && WEAPON_DATA["Net"] && !GEAR_DATA["Net"]);
});

test("the 2024 rules: the book's Lance, Trident, War Pick and Warhammer", () => {
  useSpellsOf(char(true));
  assert.equal(weaponEdition(), "2024");
  assert.deepEqual([WEAPON_DATA["Lance"].damageDice, WEAPON_DATA["Trident"].damageDice], ["1d10", "1d8"]);
  assert.match(WEAPON_DATA["Trident"].properties, /versatile \(1d10\)/);
  assert.match(WEAPON_DATA["War Pick"].properties, /Versatile \(1d10\)/);
  assert.equal(WEAPON_DATA["Warhammer"].weight, 5);
  // The Lance is heavy, two hands only when not mounted (its special rule).
  const lance = { name: "Lance", type: "weapon" };
  assert.ok(isHeavyWeapon(lance));
  assert.match(weaponDataOf(lance).special, /unless you're mounted/);
  // The Net is gear now.
  assert.ok(!WEAPON_GROUPS["Martial Ranged"].includes("Net") && !WEAPON_DATA["Net"]);
  assert.ok(GEAR_GROUPS["Adventuring gear"].includes("Net") && GEAR_DATA["Net"].weight === 3 && /DEX save/.test(GEAR_DATA["Net"].notes));
  // And back.
  useSpellsOf(char(false));
  assert.equal(WEAPON_DATA["Trident"].damageDice, "1d6");
  assert.ok(WEAPON_GROUPS["Martial Ranged"].includes("Net") && !GEAR_GROUPS["Adventuring gear"].includes("Net"));
});

test("a 2024 class counts as the 2024 rules too", () => {
  const c = char(false);
  c.classes[0].edition = "2024";
  useSpellsOf(c);
  assert.equal(WEAPON_DATA["Trident"].damageDice, "1d8");
  useSpellsOf(char(false));
});

test("carried weapons follow, except what the player edited", () => {
  const edited = Object.assign(trident(), { damageDice: "1d6+1", notes: "my lucky trident" });
  const c = char(true, [trident(), edited, { name: "Warhammer", type: "weapon", damageDice: "1d8", weight: 2, notes: "Versatile (1d10)" }]);
  useSpellsOf(c);
  assert.deepEqual([c.inventory[0].damageDice, c.inventory[0].notes], ["1d8", "Thrown (20/60), versatile (1d10)"]);
  assert.deepEqual([c.inventory[1].damageDice, c.inventory[1].notes], ["1d6+1", "my lucky trident"]);
  assert.equal(c.inventory[2].weight, 5);
  // Off the 2024 rules again: back to the 2014 numbers.
  c.rules2024 = false;
  useSpellsOf(c);
  assert.deepEqual([c.inventory[0].damageDice, c.inventory[0].notes, c.inventory[2].weight], ["1d6", "Thrown (20/60), versatile (1d8)", 2]);
});
