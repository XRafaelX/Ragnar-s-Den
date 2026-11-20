/* The line under a weapon's name on the Inventory tab (js/core/weapon-summary.js,
   moved out of the weapon card 2026-11-19): the damage, the ability, then
   proficiency, magic and what adds to the damage, in that order. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { weaponSummary } from "../js/core/weapon-summary.js";

const weapon = (o) => Object.assign({ id: "w", type: "weapon", qty: 1, equipped: true, proficient: true, magicBonus: 0 }, o);
function char(classes, items, extra = {}){
  const c = newCharacter("W");
  c.classes = classes;
  c.abilities = { str: 16, dex: 16, con: 14, int: 10, wis: 16, cha: 10 };
  Object.assign(c, { inventory: items }, extra);
  return ensureShape(c);
}
const SWORD = { name: "Longsword", ability: "str", damageDice: "1d8", damageType: "Slashing", category: "martial" };
const STAFF = { name: "Quarterstaff", ability: "str", damageDice: "1d6", damageType: "Bludgeoning", category: "simple", notes: "versatile (1d8)" };

test("a plain weapon: its dice and type, the ability, proficient", () => {
  const sword = weapon(SWORD);
  assert.deepEqual(weaponSummary(char([{ name: "Fighter", level: 5 }], [sword]), sword),
    { damageType: "Slashing", parts: ["1d8 Slashing", "STR", "Proficient"] });
});

test("not proficient, and a magic bonus", () => {
  const sword = weapon(Object.assign({}, SWORD, { magicBonus: 1, proficient: false }));
  assert.deepEqual(weaponSummary(char([{ name: "Wizard", level: 5 }], [sword]), sword).parts, ["1d8 Slashing", "STR", "Not proficient", "+1 magic"]);
});

test("a finesse weapon says Finesse", () => {
  const rapier = weapon({ name: "Rapier", ability: "finesse", damageDice: "1d8", damageType: "Piercing", category: "martial" });
  assert.equal(weaponSummary(char([{ name: "Rogue", level: 5 }], [rapier]), rapier).parts[1], "Finesse");
});

test("raging: the Rage damage bonus is listed", () => {
  const axe = weapon({ name: "Greataxe", ability: "str", damageDice: "1d12", damageType: "Slashing", category: "martial", notes: "heavy, two-handed" });
  const c = char([{ name: "Barbarian", level: 5 }], [axe]);
  assert.ok(!weaponSummary(c, axe).parts.includes("Rage +2 damage"), "not before the rage");
  H.startRage(c);
  assert.deepEqual(weaponSummary(c, axe).parts, ["1d12 Slashing", "STR", "Proficient", "Rage +2 damage"]);
});

test("a monk weapon: Martial Arts, and its die once it's bigger than the weapon's", () => {
  const staff = weapon(STAFF);
  assert.equal(weaponSummary(char([{ name: "Monk", level: 5 }], [staff]), staff).parts[1], "Martial Arts (STR or DEX)", "a d6 is no bigger than the staff's");
  assert.equal(weaponSummary(char([{ name: "Monk", level: 11 }], [staff]), staff).parts[1], "Martial Arts (STR or DEX) · Martial Arts d8");
});

test("Shillelagh: a d8, the spellcasting ability, and magical", () => {
  const staff = weapon(STAFF);
  const c = char([{ name: "Druid", level: 3 }], [staff], { spells: [{ id: "s1", name: "Shillelagh", level: 0, prepared: true, learnedBy: "Druid" }] });
  assert.deepEqual(weaponSummary(c, staff).parts, ["1d6 Bludgeoning", "STR", "Proficient"], "not switched on yet");
  H.setShillelagh(c, staff, true);
  assert.deepEqual(weaponSummary(c, staff).parts, ["1d8 Bludgeoning", "Shillelagh (STR or WIS)", "Proficient", "Magic"]);
});

test("nothing is changed on the weapon or the character", () => {
  const sword = weapon(SWORD), c = char([{ name: "Fighter", level: 5 }], [sword]);
  const before = JSON.stringify(c);
  weaponSummary(c, sword);
  assert.equal(JSON.stringify(c), before);
});
