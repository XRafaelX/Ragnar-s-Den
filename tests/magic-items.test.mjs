/* Magic items: the Armory's list, adding one to a character, and what a
   Heavy Holster does on the sheet (damage per knife held, speed while
   empty, only while attuned). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as MI from "../js/core/magic-items.js";
import { MAGIC_ITEM_GROUPS, MAGIC_ITEM_DATA } from "../js/data/magic-items.js";
import { GEAR_DATA } from "../js/data/gear.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
import { ARMOR_DATA } from "../js/data/armor.js";
import { addCatalogMagicItem } from "../js/render/armory.js";
import { newCharacter } from "../js/core/character.js";
import { withFakeDom } from "./fake-dom.mjs";

const RARITIES = ["Common", "Uncommon", "Rare", "Very rare", "Legendary", "Artifact"];

test("magic item data: well formed, grouped by rarity, one group each", () => {
  const listed = Object.values(MAGIC_ITEM_GROUPS).flat();
  assert.equal(new Set(listed).size, listed.length, "no item is listed twice");
  assert.deepEqual(listed.slice().sort(), Object.keys(MAGIC_ITEM_DATA).sort(), "the groups and the data name the same items");
  for(const [group, names] of Object.entries(MAGIC_ITEM_GROUPS)){
    assert.ok(RARITIES.includes(group), group + ": a rarity");
    assert.deepEqual(names, names.slice().sort(), group + ": alphabetical");
    for(const name of names){
      const d = MAGIC_ITEM_DATA[name];
      assert.equal(d.rarity, group, name + ": listed under its rarity");
      assert.ok(d.kind && d.text, name + ": kind and text");
      for(const k of Object.keys(d)) assert.ok(["kind", "rarity", "attunement", "text", "holster", "weapon", "returning", "coin"].includes(k), name + ": unknown field " + k);
      assert.ok(!/[–—]/.test(name + d.kind + d.text), name + ": long dash");
      assert.ok(!GEAR_DATA[name] && !WEAPON_DATA[name] && !ARMOR_DATA[name], name + ": already other gear");
      if(d.weapon) assert.ok(WEAPON_DATA[d.weapon], name + ": a real weapon");
    }
  }
});

test("Heavy Holster: the item as printed", () => {
  const d = MAGIC_ITEM_DATA["Heavy Holster"];
  assert.deepEqual([d.kind, d.rarity, d.attunement], ["Wondrous item (knife holster)", "Uncommon", true]);
  assert.deepEqual(d.holster, { capacity: 3, damagePerKnife: 1, emptySpeed: 20 });
  assert.match(d.text, /up to 3 throwing knives/);
  assert.match(d.text, /bonus action to summon back one knife or an action to summon all/);
});

test("adding a Heavy Holster: its own row, not attuned, full of knives", (t) => {
  const c = newCharacter("Knife Thrower");
  withFakeDom(t, () => {
    addCatalogMagicItem(c, "Heavy Holster", MAGIC_ITEM_DATA["Heavy Holster"]);
    addCatalogMagicItem(c, "Heavy Holster", MAGIC_ITEM_DATA["Heavy Holster"]);
  });
  const rows = c.inventory.filter((i) => i.magicItem === "Heavy Holster");
  assert.equal(rows.length, 2, "magic items never stack");
  assert.deepEqual([rows[0].type, rows[0].qty, rows[0].attuned, rows[0].knives], ["gear", 1, false, 3]);
});

test("Heavy Holster: +1 damage per knife held and +20 ft while empty, only when attuned", () => {
  const dagger = { name: "Dagger", type: "weapon", ability: "finesse", proficient: true, magicBonus: 0, damageDice: "1d4" };
  const holster = { name: "Heavy Holster", type: "gear", magicItem: "Heavy Holster", qty: 1, attuned: false, knives: 3 };
  const c = { abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 10, cha: 10 }, saveProfs: {}, classes: [{ name: "Rogue", level: 1 }],
    inventory: [dagger, holster], feats: [], resourcesUsed: {}, race: "Human", speed: 30 };
  const dmg = () => H.weaponDamageBonus(c, dagger);
  const speed = () => H.computeSpeed(c).value;

  assert.deepEqual([dmg(), speed()], [3, 30], "not attuned: nothing");
  holster.attuned = true;
  assert.deepEqual([dmg(), speed()], [6, 30], "3 knives: DEX +3, holster +3");
  holster.knives = 1;
  assert.deepEqual([dmg(), speed()], [4, 30], "1 knife: +1");
  holster.knives = 0;
  assert.deepEqual([dmg(), speed()], [3, 50], "empty: no damage, +20 ft");
  assert.deepEqual(H.computeSpeed(c).parts, [{ name: "Heavy Holster", value: 20, why: "holster empty" }]);

  // A creature can't attune to two copies of an item: only the first counts.
  c.inventory.push({ ...holster, knives: 3 });
  assert.deepEqual([dmg(), speed()], [3, 50], "a second attuned holster adds nothing");
  assert.equal(MI.holsterKnives({ magicItem: "Heavy Holster", knives: 7 }), 3, "never more than it holds");
});

test("attunement: 3 items, 4 to 6 for an artificer, never two copies", () => {
  // Two stand-in items, so three different ones can be attuned.
  MAGIC_ITEM_DATA["Test Ring"] = { kind: "Ring", rarity: "Rare", attunement: true, text: "x" };
  MAGIC_ITEM_DATA["Test Cloak"] = { kind: "Wondrous item", rarity: "Rare", attunement: true, text: "x" };
  try{
    const item = (name, attuned) => ({ name, type: "gear", magicItem: name, qty: 1, attuned });
    const c = { classes: [{ name: "Rogue", level: 10 }], inventory: [item("Heavy Holster", true), item("Test Ring", true)] };
    const limit = (cls, level) => MI.attunementLimit({ classes: [{ name: cls, level }] });
    assert.deepEqual([limit("Rogue", 20), limit("Artificer", 9), limit("Artificer", 10), limit("Artificer", 14), limit("Artificer", 18)], [3, 3, 4, 5, 6]);
    assert.equal(MI.attunementLimit({ classes: [{ name: "Fighter", level: 5 }, { name: "Artificer", level: 10 }] }), 4, "a multiclass artificer 10");

    const cloak = item("Test Cloak", false), holster2 = item("Heavy Holster", false);
    c.inventory.push(cloak, holster2);
    assert.match(MI.attuneProblem(c, holster2), /already attuned to a Heavy Holster/, "a second copy");
    assert.equal(MI.attuneProblem(c, cloak), null, "a third item is fine");
    cloak.attuned = true;
    const fourth = item("Test Ring", false);
    fourth.magicItem = "Test Ring 2"; MAGIC_ITEM_DATA["Test Ring 2"] = MAGIC_ITEM_DATA["Test Ring"];
    c.inventory.push(fourth);
    assert.match(MI.attuneProblem(c, fourth), /attuned to 3 of 3 items/, "a fourth is over the limit");
    assert.equal(MI.attuneProblem(c, cloak), null, "ending an attunement is always allowed");
    c.classes = [{ name: "Artificer", level: 10 }];
    assert.equal(MI.attuneProblem(c, fourth), null, "an artificer 10 can take a fourth");
    assert.equal(MI.attunedItems(c).length, 3);
  } finally {
    delete MAGIC_ITEM_DATA["Test Ring"]; delete MAGIC_ITEM_DATA["Test Cloak"]; delete MAGIC_ITEM_DATA["Test Ring 2"];
  }
});

test("Trident of Returning: added under Weapons as a magic trident, readied, not attuned", (t) => {
  const d = MAGIC_ITEM_DATA["Trident of Returning"];
  assert.deepEqual([d.kind, d.rarity, d.attunement, d.weapon, d.returning], ["Wondrous weapon (trident)", "Uncommon", true, "Trident", true]);
  assert.match(d.text, /use an action to call it back to your hand/);
  assert.match(d.text, /contested Strength check/);
  assert.match(d.text, /moved 5 feet in a straight line toward you/);

  const fighter = newCharacter("Sea Reaver");
  fighter.classes = [{ name: "Fighter", subclass: "", level: 1 }];
  fighter.abilities = { str: 16, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const wizard = newCharacter("Bookworm");
  wizard.classes = [{ name: "Wizard", subclass: "", level: 1 }];
  withFakeDom(t, () => {
    addCatalogMagicItem(fighter, "Trident of Returning", d);
    addCatalogMagicItem(wizard, "Trident of Returning", d);
  });
  const tr = fighter.inventory.find((i) => i.magicItem === "Trident of Returning");
  assert.deepEqual([tr.name, tr.type, tr.damageDice, tr.damageType, tr.ability, tr.notes, tr.magic, tr.attuned, tr.proficient, tr.equipped],
    ["Trident of Returning", "weapon", "1d6", "Piercing", "str", "Thrown (20/60), versatile (1d8)", true, false, true, true]);
  assert.equal(H.itemHands(tr), 1, "one-handed (versatile, not two-handed)");
  assert.equal(H.isMagicWeapon(fighter, tr), true, "magic even before attuning");
  assert.deepEqual([H.weaponAttackBonus(fighter, tr), H.weaponDamageBonus(fighter, tr)], [5, 3], "STR +3, proficiency +2, no bonus");
  assert.equal(wizard.inventory.find((i) => i.magicItem).proficient, false, "a wizard isn't proficient with a trident");
});

test("Duality: 2 charges, a flip spends one, then one boon from that side", () => {
  const d = MAGIC_ITEM_DATA.Duality;
  assert.deepEqual([d.kind, d.rarity, d.attunement, d.coin.charges], ["Wondrous item (coin)", "Rare", false, 2]);
  assert.deepEqual(Object.keys(d.coin.sides), ["angel", "demon"]);
  assert.deepEqual(d.coin.sides.angel.boons.map((b) => b.id), ["angel_check", "angel_ac", "angel_radiant"]);
  assert.deepEqual(d.coin.sides.demon.boons.map((b) => b.id), ["demon_attack", "demon_damage", "demon_resist"]);
  assert.match(d.text, /recharge at the end of a long rest/);
  assert.match(d.text, /2d8 fire or necrotic damage/);

  const coin = { name: "Duality", type: "gear", magicItem: "Duality", qty: 1 };
  const c = { classes: [{ name: "Fighter", level: 1 }], inventory: [coin] };
  assert.equal(MI.coinCharges(coin), 2);
  assert.equal(MI.flipCoin(coin, () => 0.2), "angel", "below 0.5 is angel");
  assert.equal(MI.coinCharges(coin), 1);
  assert.equal(MI.flipCoin(coin, () => 0.9), null, "no second flip while a boon is still to be chosen");
  assert.match(MI.boonProblem(c, coin, "demon_attack"), /Not on the side/);
  assert.equal(MI.chooseBoon(c, coin, "angel_ac"), true);
  assert.equal(coin.coin.flip, "", "chosen: the flip is done");

  assert.equal(MI.flipCoin(coin, () => 0.3), "angel");
  assert.equal(MI.coinCharges(coin), 0);
  assert.match(MI.boonProblem(c, coin, "angel_ac"), /Already in play/, "the same boon can't be in play twice");
  assert.equal(MI.chooseBoon(c, coin, "angel_radiant"), true);
  assert.equal(MI.flipCoin(coin, () => 0.1), null, "out of charges");
  assert.deepEqual(MI.activeBoons(c).map((b) => b.def.id), ["angel_ac", "angel_radiant"]);
  assert.deepEqual(MI.nextAttackDamage(c).map((n) => [n.qty, n.die, n.type]), [[2, 8, "Radiant"]]);

  // A long rest brings the charges back; a rest ends the 10-minute boons
  // and keeps the one waiting for the next attack.
  assert.deepEqual(MI.magicItemsOnLongRest(c), ["Duality"]);
  assert.equal(MI.coinCharges(coin), 2);
  assert.deepEqual(MI.endTimedBoons(c), ["Duality (+1 AC)"]);
  assert.deepEqual(MI.activeBoons(c).map((b) => b.def.id), ["angel_radiant"]);
});

test("Duality: the boons on the sheet (AC, attack rolls, next ability check, extra damage, resistance)", () => {
  const coin = { name: "Duality", type: "gear", magicItem: "Duality", qty: 1, coin: { used: 0, flip: "", boons: [] } };
  const sword = { name: "Longsword", type: "weapon", ability: "str", proficient: true, magicBonus: 0, damageDice: "1d8" };
  const c = { abilities: { str: 16, dex: 14, con: 10, int: 10, wis: 10, cha: 10 }, saveProfs: {}, skillProfs: {}, classes: [{ name: "Fighter", level: 1 }],
    inventory: [sword, coin], feats: [], resourcesUsed: {}, race: "Human", acMisc: 0, initiativeMisc: 0, spellcasting: { ability: "int" } };
  const ac = () => H.computeArmorClass(c).value;
  assert.deepEqual([ac(), H.weaponAttackBonus(c, sword), H.checkRollMode(c, "wis").mode], [12, 5, "none"]);

  coin.coin.boons = [{ id: "angel_ac" }];
  assert.equal(ac(), 13, "+1 AC");
  assert.match(H.computeArmorClass(c).breakdown, /Duality \(\+1\)/);

  coin.coin.boons = [{ id: "demon_attack" }];
  assert.equal(H.weaponAttackBonus(c, sword), 6, "+1 to attack rolls");
  assert.equal(H.spellcastingAbilities({ ...c, classes: [{ name: "Wizard", level: 1 }] })[0].attack, 2 + 0 + 1, "spell attacks too");

  coin.coin.boons = [{ id: "angel_check" }];
  assert.deepEqual([H.checkRollMode(c, "wis").mode, H.skillRollMode(c, "Perception").mode, H.initiativeRollMode(c).mode], ["adv", "adv", "adv"]);
  assert.equal(H.passivePerception(c), 10, "not in a passive score");
  assert.equal(MI.useNextCheck(c), true, "rolling a check uses it");
  assert.equal(H.checkRollMode(c, "wis").mode, "none");
  assert.equal(MI.useNextCheck(c), false);

  coin.coin.flip = "demon";
  assert.equal(MI.chooseBoon(c, coin, "demon_resist"), false, "resistance needs a damage type");
  assert.equal(MI.chooseBoon(c, coin, "demon_resist", "Fire"), true);
  assert.deepEqual(MI.coinResistances(c), ["Fire"]);
  coin.coin.flip = "demon";
  assert.equal(MI.chooseBoon(c, coin, "demon_damage", "Necrotic"), true);
  assert.deepEqual(MI.nextAttackDamage(c).map((n) => n.type), ["Necrotic"]);
  assert.deepEqual(MI.activeBoons(c).map((b) => MI.boonLabel(b)), ["resistance to fire", "next attack +2d8 necrotic"]);
});
