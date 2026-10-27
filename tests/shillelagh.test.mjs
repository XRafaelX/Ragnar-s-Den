/* Shillelagh (PHB): a club or quarterstaff you hold becomes magical, uses
   your spellcasting ability for its attack and damage rolls and has a d8
   damage die, for a minute. The weapon card has the switch; letting go of
   the weapon, a rest or dropping to 0 hit points ends it. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter } from "../js/core/character.js";
import { endAllEffects } from "../js/core/effects.js";

function druid(abilities = {}, extra = {}){
  const c = newCharacter("Test");
  c.classes = [{ name: "Druid", subclass: "Circle of the Land", level: 5 }];
  c.abilities = Object.assign({ str: 8, dex: 12, con: 14, int: 10, wis: 18, cha: 10 }, abilities);
  c.spells = [{ id: "s1", name: "Shillelagh", level: 0, prepared: true, learnedBy: "Druid" }];
  c.inventory = [{ id: "q", name: "Quarterstaff", type: "weapon", damageDice: "1d6", damageType: "Bludgeoning", ability: "str", proficient: true, equipped: true }];
  Object.assign(c, extra);
  return c;
}
const staff = (c) => c.inventory[0];

test("Shillelagh: WIS and a d8 on a quarterstaff, only while it's switched on", () => {
  const c = druid();
  assert.ok(H.canShillelagh(c, staff(c)), "a druid who knows it can cast it on a quarterstaff");
  // Off: Strength 8 (-1), d6, not magic.
  assert.equal(H.weaponAttackBonus(c, staff(c)), -1 + 3);
  assert.deepEqual(H.weaponDamageDice(c, staff(c)), { qty: 1, die: 6, martialArts: false });
  assert.equal(H.isMagicWeapon(c, staff(c)), false);
  H.setShillelagh(c, staff(c), true);
  assert.equal(H.shillelaghOn(c, staff(c)), true);
  // On: WIS +4, proficiency +3, d8, magical.
  assert.equal(H.weaponAttackBonus(c, staff(c)), 4 + 3);
  assert.equal(H.weaponDamageBonus(c, staff(c)), 4);
  assert.deepEqual(H.weaponDamageDice(c, staff(c)), { qty: 1, die: 8, martialArts: false });
  assert.equal(H.isMagicWeapon(c, staff(c)), true);
  H.setShillelagh(c, staff(c), false);
  assert.equal(H.weaponAttackBonus(c, staff(c)), -1 + 3);
});

test("Shillelagh: Strength still counts when it's better, and the die never shrinks", () => {
  const c = druid({ str: 20, wis: 12 });
  H.setShillelagh(c, staff(c), true);
  assert.equal(H.weaponAttackBonus(c, staff(c)), 5 + 3, "STR +5 beats WIS +1");
  c.inventory[0].damageDice = "1d10";
  assert.deepEqual(H.weaponDamageDice(c, staff(c)), { qty: 1, die: 10, martialArts: false }, "a die above d8 stays");
  c.inventory[0].damageDice = "2d4";
  assert.equal(H.weaponDamageDice(c, staff(c)).die, 4, "more than one die is left alone");
});

test("Shillelagh: only a club or quarterstaff, only while it's in hand, only for someone who knows it", () => {
  const c = druid();
  c.inventory.push({ id: "d", name: "Dagger", type: "weapon", damageDice: "1d4", ability: "finesse", proficient: true, equipped: false });
  c.inventory.push({ id: "k", name: "Club", type: "weapon", damageDice: "1d4", ability: "str", proficient: true, equipped: false });
  assert.equal(H.canShillelagh(c, c.inventory[1]), false, "not a dagger");
  assert.equal(H.canShillelagh(c, c.inventory[2]), true, "a club counts, even before it's equipped");
  // Switched on, then let go of: it ends.
  H.setShillelagh(c, staff(c), true);
  staff(c).equipped = false;
  assert.equal(H.shillelaghOn(c, staff(c)), false);
  assert.equal(staff(c).shillelagh, undefined, "and the flag is gone");
  staff(c).equipped = true;
  assert.equal(H.shillelaghOn(c, staff(c)), false, "picking it up again doesn't bring it back");
  // A character who doesn't know the cantrip can't.
  const fighter = newCharacter("F"); fighter.classes = [{ name: "Fighter", level: 3 }];
  fighter.inventory = [{ id: "q", name: "Quarterstaff", type: "weapon", damageDice: "1d6", ability: "str", proficient: true, equipped: true }];
  assert.equal(H.canShillelagh(fighter, fighter.inventory[0]), false);
  H.setShillelagh(fighter, fighter.inventory[0], true);
  assert.equal(fighter.inventory[0].shillelagh, undefined);
});

test("Shillelagh: it lasts on one weapon, and a rest or dropping to 0 hit points ends it", () => {
  const c = druid();
  c.inventory.push({ id: "k", name: "Club", type: "weapon", damageDice: "1d4", ability: "str", proficient: true, equipped: true });
  H.setShillelagh(c, c.inventory[0], true);
  H.setShillelagh(c, c.inventory[1], true);
  assert.equal(H.shillelaghOn(c, c.inventory[0]), false, "casting it on the club ends it on the staff");
  assert.equal(H.shillelaghOn(c, c.inventory[1]), true);
  assert.deepEqual(endAllEffects(c), ["Shillelagh"]);
  assert.equal(H.shillelaghOn(c, c.inventory[1]), false);
});

test("Shillelagh: a feat's cantrip uses the feat's ability, and a sheet cantrip uses its class's", () => {
  // Magic Initiate (Druid) on a fighter: Wisdom.
  const f = newCharacter("F"); f.classes = [{ name: "Fighter", level: 4 }];
  f.abilities = Object.assign({}, f.abilities, { str: 10, wis: 16 });
  f.feats = [{ id: "mi", name: "Magic Initiate", picks: { option: "Druid", spells: ["Shillelagh", "Druidcraft", "Goodberry"] } }];
  f.inventory = [{ id: "c", name: "Club", type: "weapon", damageDice: "1d4", ability: "str", proficient: true, equipped: true }];
  assert.deepEqual(H.shillelaghAbilities(f), ["wis"]);
  H.setShillelagh(f, f.inventory[0], true);
  assert.equal(H.weaponAttackBonus(f, f.inventory[0]), 3 + 2, "WIS +3 and proficiency +2");
  // A cleric 1 / druid 1 whose Shillelagh was learned as a druid: Wisdom for both here, but the owner decides.
  const m = druid();
  m.classes = [{ name: "Wizard", level: 3 }, { name: "Druid", level: 2 }];
  m.spells[0].learnedBy = "Druid";
  assert.deepEqual(H.shillelaghAbilities(m), ["wis"]);
});
