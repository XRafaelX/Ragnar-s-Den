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
      for(const k of Object.keys(d)) assert.ok(["kind", "rarity", "attunement", "text", "holster"].includes(k), name + ": unknown field " + k);
      assert.ok(!/[–—]/.test(name + d.kind + d.text), name + ": long dash");
      assert.ok(!GEAR_DATA[name] && !WEAPON_DATA[name] && !ARMOR_DATA[name], name + ": already other gear");
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
