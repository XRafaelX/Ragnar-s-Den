/* Background starting equipment (F2, 2026-10-20): each background's kit,
   checked against the published pages (see
   .claude/research/background-equipment.md), its choices, trinket rolls
   and what lands on the sheet. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as K from "../js/core/background-gear.js";
import { BACKGROUND_INFO } from "../js/data/backgrounds.js";
import { BACKGROUND_EQUIPMENT } from "../js/data/background-equipment.js";
import { GEAR_DATA, GEAR_GROUPS } from "../js/data/gear.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
import { TRINKET_TABLES } from "../js/data/trinkets.js";
import { newCharacter } from "../js/core/character.js";
import { weaponDataOf } from "../js/data/weapons.js";

const names = (r) => r.items.map((i) => (i.qty > 1 ? i.qty + "x " : "") + i.name);
const fixed = (x) => () => x;

test("data: every background has a kit, every catalog item and weapon exists, and every kit has coins", () => {
  for(const bg of Object.keys(BACKGROUND_INFO)){
    assert.ok(K.backgroundKit(bg), bg + " has a kit");
    const r = K.kitItems(bg, {}, {}, fixed(0.5));
    assert.ok(r.items.length && r.items.every((i) => i.name), bg + ": named items");
    assert.ok(K.coinsText(r.coins), bg + ": coins");
  }
  const walk = (e, bg) => {
    if(typeof e === "string") return assert.ok(GEAR_DATA[e], bg + ": " + e + " is in the gear catalog");
    if(Array.isArray(e)) return e.forEach((x) => walk(x, bg));
    if(e.pick) return e.options.forEach((x) => walk(x, bg));
    if(e.gear) assert.ok(GEAR_DATA[e.gear], bg + ": " + e.gear);
    if(e.weapon) assert.ok(WEAPON_DATA[e.weapon], bg + ": weapon " + e.weapon);
    if(e.group) e.group.forEach((gName) => assert.ok(GEAR_GROUPS[gName], bg + ": group " + gName));
    if(e.trinket) assert.ok(TRINKET_TABLES[e.trinket], bg + ": table " + e.trinket);
  };
  for(const [bg, kit] of Object.entries(BACKGROUND_EQUIPMENT)) kit.items.forEach((e) => walk(e, bg));
  assert.deepEqual(Object.fromEntries(Object.entries(TRINKET_TABLES).map(([k, t]) => [k, t.entries.length * t.per])),
    { phb: 100, gothic: 100, horror: 100, feywild: 100 }, "every table covers a d100");
});

test("kits as published: the Player's Handbook, variants and coins", () => {
  assert.deepEqual(names(K.kitItems("Acolyte", {}, {})), ["Holy Symbol (amulet)", "Prayer book", "5x Stick of incense", "Vestments", "Clothes, Common"]);
  assert.deepEqual(K.kitItems("Acolyte", {}, {}).coins, { gp: 15 });
  assert.deepEqual(K.kitItems("Hermit", {}, {}).coins, { gp: 5 });
  assert.deepEqual(K.kitItems("Haunted One", {}, {}, fixed(0)).coins, { sp: 1 });
  assert.deepEqual(K.kitItems("Orzhov Representative", {}, {}).coins, { pp: 1 });
  // Variants with the same kit; ones that change it.
  assert.deepEqual(names(K.kitItems("Spy", {}, {})), names(K.kitItems("Criminal", {}, {})));
  assert.deepEqual(names(K.kitItems("Investigator", {}, {})), ["Uniform of your unit, showing your rank", "Horn to summon help", "Manacles"]);
  assert.deepEqual(names(K.kitItems("Guild Merchant", { 0: "1" }, {})), ["Mule", "Cart", "Letter of introduction from your guild", "Clothes, Traveler's"]);
  assert.equal(K.kitItems("Gladiator", { 0: "1" }, {}).items[0].name, "Trident");
});

test("choices: a pick's option, a group starting on the background's tool, an option that asks something itself", () => {
  assert.deepEqual(K.kitSlots("Soldier", {}).map((s) => [s.key, s.kind]), [["1", "pick"], ["2", "pick"]]);
  assert.equal(K.kitItems("Soldier", { 1: "0", 2: "1" }, {}).items[1].name, "Dagger", "the trophy dagger is a weapon");
  // A Folk Hero who took smith's tools gets smith's tools.
  assert.equal(K.kitItems("Folk Hero", {}, { toolPicks: ["Smith's tools"] }).items[0].name, "Smith's Tools");
  assert.equal(K.kitItems("Folk Hero", {}, { toolPicks: [] }).items[0].name, "Alchemist's Supplies", "else the first");
  // Guild Merchant's tools option asks which tools.
  assert.deepEqual(K.kitSlots("Guild Merchant", { 0: "0" }).map((s) => s.key), ["0", "0.0"]);
  assert.deepEqual(K.kitSlots("Guild Merchant", { 0: "1" }).map((s) => s.key), ["0"]);
  // Uthgardt tattoos: nothing to carry.
  assert.deepEqual(names(K.kitItems("Uthgardt Tribe Member", { 1: "1" }, {})), ["Hunting Trap", "Clothes, Traveler's"]);
  // A Dimir Operative's secondary guild kit (and its coins).
  const dimir = K.kitItems("Dimir Operative", { guild: "Simic Scientist" }, {});
  assert.ok(names(dimir).includes("3x Small knife") && names(dimir).includes("Simic insignia") && names(dimir).includes("Vial of seaweed"));
  assert.deepEqual(dimir.coins, { gp: 10 });
  assert.deepEqual(K.kitSlots("Dimir Operative", { guild: "Izzet Engineer" }).map((s) => s.key), ["guild", "guild/1"], "Izzet asks for its tools");
});

test("trinkets: a d100 read as the entry, a table of pairs, three rolls each kept", () => {
  assert.equal(K.rollTrinket("phb", fixed(0)), 1);
  assert.equal(K.rollTrinket("phb", fixed(0.999)), 100);
  assert.equal(K.rollTrinket("gothic", fixed(0.02)), 2, "a 3 is the 3-4 entry");
  assert.equal(K.trinketRollLabel("gothic", 2), "3-4");
  assert.equal(K.trinketText("feywild", 97), "Glass slipper, missing its mate");
  assert.equal(K.trinketText("phb", 1), "A mummified goblin hand");
  assert.deepEqual(K.kitSlots("Feylost", {}).filter((s) => s.kind === "trinket").map((s) => s.key), ["2#1", "2#2", "2#3"]);
  const fey = K.kitItems("Feylost", { "2#1": "1", "2#2": "2", "2#3": "100" }, {});
  assert.deepEqual(fey.items.slice(2).map((i) => i.name), ["Cookie cutter shaped like a unicorn", "Two yew rings linked together", "Music box that plays a sprightly tune you remember from your childhood"]);
  assert.equal(fey.items[2].notes, "Feywild trinket (Feywild Trinkets, 1)", "the note says where it came from");
  // The Haunted One rolls on Gothic Trinkets; the Ravenloft Investigator on Horror Trinkets.
  assert.equal(K.kitSlots("Haunted One", {})[0].table, "gothic");
  assert.equal(K.kitSlots("Investigator (Ravenloft)", {})[0].table, "horror");
});

test("adding a kit: items stack with gear of the same name, coins go in the purse, recorded once", () => {
  const c = newCharacter("Test");
  c.background = "Acolyte";
  c.inventory = [{ name: "Clothes, Common", type: "gear", qty: 1, equipped: false, notes: "", weight: 3 }];
  assert.ok(K.backgroundKitOffered(c));
  K.addBackgroundKit(c, "Acolyte", { 1: "1" }, {});
  assert.equal(c.inventory.find((i) => i.name === "Clothes, Common").qty, 2);
  assert.ok(c.inventory.some((i) => i.name === "Prayer wheel"));
  assert.equal(c.currency.gp, 15);
  assert.deepEqual(c.backgroundGear, { background: "Acolyte", added: true });
  assert.equal(K.backgroundKitOffered(c), false);
  // A weapon arrives marked for its proficiency check.
  const s = newCharacter("Sailor");
  K.addBackgroundKit(s, "Sailor", {}, {});
  const club = s.inventory.find((i) => i.name === "Club");
  assert.deepEqual([club.type, club.damageDice, club.equipped, club.picked], ["weapon", "1d4", false, true]);
});

test("an older sheet: the offer shows until the kit is added or turned down", async (t) => {
  const { renderBackgroundKitCard } = await import("../js/render/panels/background-kit.js");
  const { withFakeDom } = await import("./fake-dom.mjs");
  const c = newCharacter("Old");
  c.background = "Sage";
  withFakeDom(t, () => { assert.ok(renderBackgroundKitCard(c), "offered"); });
  c.backgroundGear = { background: "Sage", dismissed: true };
  assert.equal(K.backgroundKitOffered(c), false, "No thanks: not again");
  withFakeDom(t, () => { assert.equal(renderBackgroundKitCard(c), null); });
  const none = newCharacter("No background");
  none.background = "";
  assert.equal(K.backgroundKitOffered(none), false, "no background, nothing to offer");
});

test("Tal'Dorei kits, as the book prints them", () => {
  assert.deepEqual(names(K.kitItems("Lyceum Scholar", {}, {})), ["Clothes, Fine", "Student uniform", "Writing kit"]);
  assert.deepEqual(K.kitItems("Lyceum Scholar", {}, {}).coins, { gp: 10 });
  assert.deepEqual(names(K.kitItems("Reformed Cultist", {}, {})), ["Vestments of your previous cult", "Holy Symbol (amulet)", "Clothes, Common"]);
  assert.deepEqual(K.kitItems("Reformed Cultist", {}, {}).coins, { gp: 15 });
  assert.deepEqual(K.kitItems("Clasp Member", {}, {}).coins, { gp: 10 });
  assert.deepEqual(K.kitItems("Whitestone Rifle Corps", {}, {}).coins, { gp: 10 });
  // The Clasp's "set of tools with which you're proficient" is one of three, and starts on the pick.
  const slot = K.kitSlots("Clasp Member", {}).find((s) => s.kind === "group");
  assert.deepEqual(slot.options.map((o) => o.value), ["Disguise Kit", "Forgery Kit", "Thieves' Tools"]);
  assert.deepEqual(names(K.kitItems("Clasp Member", {}, { toolPicks: ["Thieves' tools"] })), ["Inconspicuous common clothes", "Thieves' Tools"]);
  // Musket or pistol.
  const gun = K.kitSlots("Whitestone Rifle Corps", {})[0];
  assert.deepEqual(gun.options.map((o) => o.label), ["Musket", "Pistol"]);
  assert.deepEqual(names(K.kitItems("Whitestone Rifle Corps", { [gun.key]: "1" }, {})), ["Pistol", "Clothes, Common"]);
});

test("a Gunslinger class character's Rifle Corps gun is one of the class's own", () => {
  const gunslinger = (pick) => {
    const c = newCharacter("Gun");
    c.classes = [{ name: "Gunslinger", subclass: "", level: 1 }];
    K.addBackgroundKit(c, "Whitestone Rifle Corps", { 0: pick }, {});
    return c.inventory.find((i) => i.type === "weapon");
  };
  const long = gunslinger("0"), pistol = gunslinger("1");
  assert.deepEqual([long.name, long.firearmSet, long.damageDice, weaponDataOf(long).category], ["Long Gun", "gunslinger", "1d12", "firearm"]);
  assert.deepEqual([pistol.name, pistol.firearmSet, pistol.damageDice], ["Pistol", "gunslinger", "2d4"]);
  const other = newCharacter("Scout");
  K.addBackgroundKit(other, "Whitestone Rifle Corps", { 0: "0" }, {});
  const musket = other.inventory.find((i) => i.type === "weapon");
  assert.deepEqual([musket.name, musket.firearmSet, musket.damageDice], ["Musket", undefined, "1d12"]);
});
