/* Phase E1 of the 2026-10-14 review: what Thrown Weapon Fighting, Unarmed
   Fighting and Two-Weapon Fighting do to the numbers (Tasha's and the
   Player's Handbook, checked 2026-10-16), and the Basic Rules' two-weapon
   fighting for everyone: the off-hand attack adds no ability modifier to
   its damage unless it's negative. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { makeStyleFeature } from "../js/core/fighting-styles.js";
import { newCharacter } from "../js/core/character.js";
import { WEAPON_DATA } from "../js/data/weapons.js";

function weapon(name, extra = {}){
  const d = WEAPON_DATA[name];
  return { id: name + Math.random(), name, type: "weapon", damageDice: d.damageDice, damageType: d.damageType,
    ability: d.finesse ? "finesse" : d.ranged ? "dex" : "str", proficient: true, equipped: true, ...extra };
}
function fighter(styles, inventory, extra = {}){
  const c = newCharacter("Test");
  c.classes = [{ name: "Fighter", level: 3 }];
  c.abilities = { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 };
  c.features = styles.map((s) => makeStyleFeature(s));
  c.inventory = inventory;
  Object.assign(c, extra);
  return c;
}

test("Thrown Weapon Fighting: +2 damage on a thrown weapon's ranged attack, never on its melee one", () => {
  const axe = weapon("Handaxe");
  const c = fighter(["Thrown Weapon Fighting"], [axe]);
  assert.equal(H.weaponDamageBonus(c, axe), 3, "melee: STR only");
  const t = H.thrownAttack(c, axe);
  assert.equal(t.damage, 5);
  assert.equal(t.attack, H.weaponAttackBonus(c, axe), "no Archery: same to hit");
  // A dart is a ranged weapon: every attack with it is thrown.
  const dart = weapon("Dart");
  const d = fighter(["Thrown Weapon Fighting"], [dart]);
  assert.equal(H.weaponDamageBonus(d, dart), 3 + 2, "finesse: STR 16, plus the style");
  assert.equal(H.thrownAttack(d, dart), null, "a dart shows its thrown numbers already");
  // Not thrown: nothing.
  const sword = weapon("Longsword");
  assert.equal(H.thrownAttack(fighter(["Thrown Weapon Fighting"], [sword]), sword), null);
  // No style, nothing different: no thrown line.
  assert.equal(H.thrownAttack(fighter([], [axe]), axe), null);
});

test("throwing is a ranged attack: Archery's +2 to hit, no rage damage", () => {
  const jav = weapon("Javelin");
  const archer = fighter(["Archery"], [jav]);
  assert.equal(H.thrownAttack(archer, jav).attack, H.weaponAttackBonus(archer, jav) + 2);
  assert.equal(H.thrownAttack(archer, jav).damage, H.weaponDamageBonus(archer, jav));
  const barb = fighter([], [jav], { classes: [{ name: "Barbarian", level: 3 }], rage: { active: true, used: 1 } });
  assert.equal(H.weaponDamageBonus(barb, jav), 3 + 2, "melee: rage counts");
  assert.equal(H.thrownAttack(barb, jav).damage, 3, "thrown: it doesn't");
});

test("Unarmed Fighting: 1d6, 1d8 with nothing in hand, the grapple's 1d4; the card shows for anyone with it", () => {
  const c = fighter(["Unarmed Fighting"], []);
  let u = H.unarmedStrike(c);
  assert.deepEqual([u.die, u.bonus, u.type, u.ability, u.grappleDie], [8, 3, "Bludgeoning", "STR", 4]);
  c.inventory = [weapon("Longsword")];
  assert.equal(H.unarmedStrike(c).die, 6, "a weapon in hand: d6");
  c.inventory = [{ id: "s", name: "Shield", type: "armor", category: "shield", baseAC: 2, equipped: true }];
  assert.equal(H.unarmedStrike(c).die, 6, "a shield too");
  c.inventory[0].equipped = false;
  assert.equal(H.unarmedStrike(c).die, 8, "stowed: d8 again");
  assert.equal(H.unarmedStrike(fighter([], [])), null, "no style, no unarmed card");
  // A tabaxi's d4 claws give way to the style's bludgeoning d8.
  const tab = fighter(["Unarmed Fighting"], [], { race: "Tabaxi" });
  u = H.unarmedStrike(tab);
  assert.deepEqual([u.name, u.die, u.type], ["Unarmed strike", 8, "Bludgeoning"]);
  // A monk 17's Martial Arts d10 is bigger still, with DEX if better.
  const monk = fighter(["Unarmed Fighting"], [], { classes: [{ name: "Monk", level: 17 }], abilities: { str: 10, dex: 18, con: 14, int: 10, wis: 16, cha: 8 } });
  u = H.unarmedStrike(monk);
  assert.deepEqual([u.die, u.ability, u.bonus], [10, "DEX", 4]);
});

test("two-weapon fighting: the off-hand's damage leaves out the modifier unless the style adds it", () => {
  const a = weapon("Shortsword"), b = weapon("Handaxe");
  const c = fighter([], [a, b]);
  assert.equal(H.weaponDamageBonus(c, a), 3, "the main attack: STR 16");
  assert.equal(H.offHandAttack(c, a), null, "the shortsword (d6) is the main hand");
  assert.deepEqual(H.offHandAttack(c, b), { damage: 0, style: false }, "the handaxe (d6) the off-hand: the first listed keeps the main hand on a tie");
  const twf = fighter(["Two-Weapon Fighting"], [a, b]);
  assert.deepEqual(H.offHandAttack(twf, b), { damage: 3, style: true });
  // A negative modifier still counts.
  const weak = fighter([], [a, b], { abilities: { str: 8, dex: 8, con: 14, int: 10, wis: 10, cha: 8 } });
  assert.equal(H.offHandAttack(weak, b).damage, -1);
  // A magic bonus stays.
  const magic = weapon("Shortsword", { magicBonus: 1 });
  const mc = fighter([], [b, magic]);
  H.swapHands(mc);
  assert.equal(H.offHandAttack(mc, magic).damage, 1);
});

test("two-weapon fighting: the bigger weapon is the main hand until the player swaps", () => {
  const dagger = weapon("Dagger"), sword = weapon("Shortsword");
  const c = fighter([], [dagger, sword]);
  let hands = H.dualWieldHands(c);
  assert.deepEqual([hands.main.name, hands.off.name], ["Shortsword", "Dagger"], "a d6 over a d4");
  H.swapHands(c);
  hands = H.dualWieldHands(c);
  assert.deepEqual([hands.main.name, hands.off.name], ["Dagger", "Shortsword"]);
  assert.equal(H.offHandAttack(c, dagger), null, "one damage roll per card");
  assert.ok(H.offHandAttack(c, sword));
  H.swapHands(c);
  assert.equal(H.dualWieldHands(c).off.name, "Dagger", "and back");
  sword.equipped = false;
  assert.equal(H.dualWieldHands(c), null, "one weapon: no hands to pick");
});

test("two-weapon fighting needs two light melee weapons in hand (Dual Wielder: any one-handed)", () => {
  const a = weapon("Shortsword"), long = weapon("Longsword");
  assert.equal(H.offHandAttack(fighter([], [a]), a), null, "one weapon");
  assert.equal(H.offHandAttack(fighter([], [a, weapon("Handaxe", { equipped: false })]), a), null, "the other is stowed");
  const stack = weapon("Dagger", { qty: 2 });
  assert.equal(H.offHandAttack(fighter([], [stack]), stack), null, "a stack is one weapon in hand");
  assert.equal(H.offHandAttack(fighter([], [a, long]), a), null, "a longsword isn't light");
  assert.equal(H.offHandAttack(fighter([], [a, weapon("Hand Crossbow")]), a), null, "a ranged weapon doesn't count");
  const dw = fighter([], [a, long], { feats: [{ id: "dw", name: "Dual Wielder" }] });
  assert.deepEqual(H.offHandAttack(dw, a), { damage: 0, style: false }, "Dual Wielder: the longsword in the main hand");
  const great = weapon("Greatsword");
  assert.equal(H.offHandAttack(fighter([], [great, a], { feats: [{ id: "dw", name: "Dual Wielder" }] }), great), null, "never a two-handed one");
});
