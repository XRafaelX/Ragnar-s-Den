/* The gear list behind the Inventory tab's "+ Add item": the data against
   the Player's Handbook tables, and adding from it (stacking, bundles,
   pack contents). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { GEAR_GROUPS, GEAR_DATA } from "../js/data/gear.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
import { ARMOR_DATA } from "../js/data/armor.js";
import { addCatalogGear } from "../js/render/armory.js";
import { newCharacter } from "../js/core/character.js";
import { withFakeDom } from "./fake-dom.mjs";

test("gear data: every listed item has a price, well formed, in one group only", () => {
  const listed = Object.values(GEAR_GROUPS).flat();
  assert.deepEqual(Object.keys(GEAR_GROUPS), ["Equipment packs", "Adventuring gear", "Ammunition", "Spellcasting focuses", "Artisan's tools", "Musical instruments", "Gaming sets", "Kits and tools"]);
  assert.equal(new Set(listed).size, listed.length, "no item is listed twice");
  assert.deepEqual(listed.slice().sort(), Object.keys(GEAR_DATA).sort(), "the groups and the data name the same items");
  assert.ok(listed.length >= 140, "about 140 items, got " + listed.length);
  for(const name of listed){
    const d = GEAR_DATA[name];
    assert.match(d.cost, /^[\d,]+ (cp|sp|gp)$/, name + ": cost " + d.cost);
    for(const k of Object.keys(d)) assert.ok(["cost", "weight", "qty", "notes"].includes(k), name + ": unknown field " + k);
    if(d.weight != null) assert.ok(d.weight > 0, name + ": weight");
    if(d.qty != null) assert.ok(Number.isInteger(d.qty) && d.qty > 1, name + ": qty");
    assert.ok(!/[–—]/.test(name + (d.notes || "")), name + ": long dash");
    assert.ok(!WEAPON_DATA[name] && !ARMOR_DATA[name], name + ": already a weapon or armor");
  }
  for(const g of Object.keys(GEAR_GROUPS)) assert.deepEqual(GEAR_GROUPS[g], GEAR_GROUPS[g].slice().sort(), g + ": alphabetical");
});

test("gear data: the Player's Handbook's prices, weights and bundles", () => {
  const row = (name) => [GEAR_DATA[name].cost, GEAR_DATA[name].weight || 0, GEAR_DATA[name].qty || 1];
  // Checked against the SRD 5.1 equipment table and dnd5e.wikidot.com.
  assert.deepEqual(row("Rope, Hempen (50 feet)"), ["1 gp", 10, 1]);
  assert.deepEqual(row("Rope, Silk (50 feet)"), ["10 gp", 5, 1]);
  assert.deepEqual(row("Backpack"), ["2 gp", 5, 1]);
  assert.deepEqual(row("Torch"), ["1 cp", 1, 1]);
  assert.deepEqual(row("Rations (1 day)"), ["5 sp", 2, 1]);
  assert.deepEqual(row("Spyglass"), ["1,000 gp", 1, 1]);
  assert.deepEqual(row("Healer's Kit"), ["5 gp", 3, 1]);
  assert.deepEqual(row("Potion of Healing"), ["50 gp", 0.5, 1]);
  assert.deepEqual(row("Caltrops (bag of 20)"), ["1 gp", 2, 1]);
  assert.deepEqual(row("Spikes, Iron (10)"), ["1 gp", 5, 1]);
  assert.deepEqual(row("Candle"), ["1 cp", 0, 1], "a weightless item has no weight");
  assert.deepEqual([row("Arrows"), row("Crossbow Bolts"), row("Sling Bullets"), row("Blowgun Needles")],
    [["1 gp", 1, 20], ["1 gp", 1.5, 20], ["4 cp", 1.5, 20], ["1 gp", 1, 50]]);
  assert.deepEqual(GEAR_GROUPS["Equipment packs"].map((n) => n + " " + GEAR_DATA[n].cost),
    ["Burglar's Pack 16 gp", "Diplomat's Pack 39 gp", "Dungeoneer's Pack 12 gp", "Entertainer's Pack 40 gp", "Explorer's Pack 10 gp", "Priest's Pack 19 gp", "Scholar's Pack 40 gp"]);
  assert.equal(GEAR_DATA["Explorer's Pack"].notes, "backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope");
  assert.deepEqual([GEAR_GROUPS["Artisan's tools"].length, GEAR_GROUPS["Musical instruments"].length, GEAR_GROUPS["Gaming sets"].length], [17, 10, 4]);
  assert.deepEqual([row("Thieves' Tools"), row("Smith's Tools"), row("Lute"), row("Dice Set")], [["25 gp", 1, 1], ["20 gp", 8, 1], ["35 gp", 2, 1], ["1 sp", 0, 1]]);
  assert.deepEqual(GEAR_GROUPS["Spellcasting focuses"].filter((n) => /^Arcane/.test(n)).map((n) => GEAR_DATA[n].cost), ["10 gp", "20 gp", "10 gp", "5 gp", "10 gp"]);
});

test("adding gear: a new row, a bundle's quantity, and stacking on what is already carried", (t) => {
  const c = newCharacter("Pack Mule");
  c.inventory = [{ name: "Arrows", type: "gear", qty: 20, notes: "ammunition, in a quiver" }, { name: "Dagger", type: "weapon", qty: 1 }];
  withFakeDom(t, () => {
    addCatalogGear(c, "Arrows", GEAR_DATA.Arrows);
    addCatalogGear(c, "Torch", GEAR_DATA.Torch);
    addCatalogGear(c, "Torch", GEAR_DATA.Torch);
    addCatalogGear(c, "Explorer's Pack", GEAR_DATA["Explorer's Pack"]);
    addCatalogGear(c, "Crossbow Bolts", GEAR_DATA["Crossbow Bolts"]);
  });
  const gear = c.inventory.filter((i) => i.type === "gear").map((i) => [i.name, i.qty, i.notes]);
  assert.deepEqual(gear, [["Arrows", 40, "ammunition, in a quiver"], ["Torch", 2, ""],
    ["Explorer's Pack", 1, "backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"], ["Crossbow Bolts", 20, "ammunition"]]);
  assert.equal(c.inventory.find((i) => i.name === "Crossbow Bolts").weight, 0.075, "a bundle's weight is kept per piece");
  assert.equal(c.inventory.length, 5, "the dagger is untouched and nothing is doubled");
});
