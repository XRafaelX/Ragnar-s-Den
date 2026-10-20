/* The SRD 5.1's magic items (added 2026-10-20, from dnd5eapi.co checked
   against Open5e's transcription): magic weapons and armor of a kind
   ("any sword") become a weapon or armor row of the one picked, with
   their bonus (only while attuned when they need it); items that add to
   AC and saves (Ring of Protection, Bracers of Defense) while they work;
   Mithral Armor without its armor's Strength or Stealth penalty. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { MAGIC_ITEM_GROUPS, MAGIC_ITEM_DATA } from "../js/data/magic-items.js";
import { addCatalogMagicItem, magicItemBases } from "../js/render/armory.js";
import { newCharacter } from "../js/core/character.js";
import * as MI from "../js/core/magic-items.js";
import { abilityScore, abilityScoreDetail } from "../js/core/ability-scores.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(classes = [{ name: "Fighter", level: 5 }]){
  const c = newCharacter("Test");
  c.classes = classes;
  c.abilities = { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 };
  c.inventory = [];
  return c;
}
const add = (t, c, name, base) => { let item; withFakeDom(t, () => { item = addCatalogMagicItem(c, name, MAGIC_ITEM_DATA[name], base); }); return item; };

test("the SRD's items: 340 by rarity after our DM's three, as printed", () => {
  const counts = Object.fromEntries(Object.entries(MAGIC_ITEM_GROUPS).map(([g, l]) => [g, l.length]));
  assert.deepEqual(counts, { "Panais Magic Items": 3, Common: 3, Uncommon: 91, Rare: 117, "Very rare": 86, Legendary: 42, Artifact: 1 });
  const d = (n) => MAGIC_ITEM_DATA[n];
  assert.deepEqual([d("Holy Avenger").rarity, d("Holy Avenger").attuneBy, d("Holy Avenger").weaponAny, d("Holy Avenger").bonus], ["Legendary", "a paladin", "sword", 3]);
  assert.deepEqual([d("Weapon, +2").rarity, d("Weapon, +2").bonus, d("Armor, +3").rarity, d("Armor, +3").bonus], ["Rare", 2, "Legendary", 3]);
  assert.deepEqual([d("Potion of Greater Healing").rarity, d("Belt of Hill Giant Strength").rarity, d("Spell Scroll (9th)").rarity], ["Uncommon", "Rare", "Legendary"]);
  assert.equal(d("Arrow-Catching Shield").bonus, undefined, "its +2 is only against ranged attacks");
  assert.ok(!MAGIC_ITEM_DATA["Potion of Healing"], "Potion of Healing stays in the gear list");
  assert.deepEqual(magicItemBases(d("Vorpal Sword")), ["Double-Bladed Scimitar", "Greatsword", "Longsword", "Scimitar"], "swords that deal slashing damage");
  assert.deepEqual(magicItemBases(d("Berserker Axe")), ["Battleaxe", "Greataxe", "Handaxe"]);
  assert.ok(!magicItemBases(d("Adamantine Armor")).includes("Hide") && magicItemBases(d("Mithral Armor")).includes("Hide"));
  assert.ok(magicItemBases(d("Weapon, +1")).includes("Longbow") && !magicItemBases(d("Weapon, +1")).includes("Pistol"));
});

test("a magic weapon of a kind: a row of the weapon picked, its bonus on attack and damage", (t) => {
  const c = char();
  const bow = add(t, c, "Weapon, +1", "Longbow");
  assert.deepEqual([bow.name, bow.type, bow.baseWeapon, bow.magicBonus, bow.damageDice, bow.ability], ["Longbow, +1", "weapon", "Longbow", 1, "1d8", "dex"]);
  assert.ok(H.isRangedWeapon(bow), "the rules see a longbow");
  assert.equal(H.weaponAttackBonus(c, bow), 2 + 3 + 1, "DEX +2, proficiency +3, +1");
  const flame = add(t, c, "Flame Tongue", "Longsword");
  assert.deepEqual([flame.name, flame.magicItem, flame.attuned], ["Flame Tongue (Longsword)", "Flame Tongue", false]);
});

test("a bonus that needs attunement works only while attuned", (t) => {
  const c = char([{ name: "Paladin", level: 9 }]);
  const sword = add(t, c, "Holy Avenger", "Longsword");
  assert.equal(H.weaponDamageBonus(c, sword), 3, "STR +3, no +3 yet");
  sword.attuned = true;
  assert.equal(H.weaponDamageBonus(c, sword), 6);
  const dagger = add(t, c, "Dagger of Venom");
  assert.deepEqual([dagger.name, dagger.baseWeapon, dagger.magicBonus], ["Dagger of Venom", "Dagger", 1]);
});

test("magic armor: the armor picked, its AC bonus; Mithral without the Strength or Stealth penalty", (t) => {
  const c = char();
  const plate = add(t, c, "Armor, +1", "Plate");
  assert.deepEqual([plate.name, plate.type, plate.category, plate.baseAC, plate.magicBonus, plate.strReq], ["Plate, +1", "armor", "heavy", 18, 1, 15]);
  plate.equipped = true;
  assert.equal(H.computeArmorClass(c).value, 19);
  c.inventory = [];
  const mithral = add(t, c, "Mithral Armor", "Plate");
  mithral.equipped = true;
  c.abilities.str = 10;
  assert.deepEqual([mithral.strReq, mithral.stealthDisadvantage], [0, false]);
  assert.equal(H.armorStrengthShortfall(c, mithral), 0, "no Strength needed");
  assert.equal(H.stealthCheck(c).mode, "none", "no Stealth disadvantage");
  const elven = add(t, c, "Elven Chain");
  assert.deepEqual([elven.name, elven.baseAC, elven.category, elven.magicBonus], ["Elven Chain", 13, "medium", 1]);
});

test("Ring of Protection and Bracers of Defense: AC and saves while they work", (t) => {
  const c = char();
  const ac = () => H.computeArmorClass(c).value;
  const before = ac(), save = H.computeSave(c, "wis").value;
  const ring = add(t, c, "Ring of Protection");
  assert.equal(ac(), before, "not attuned yet");
  ring.attuned = true;
  assert.equal(ac(), before + 1);
  assert.equal(H.computeSave(c, "wis").value, save + 1);
  assert.match(H.computeArmorClass(c).breakdown, /Ring of Protection \(\+1\)/);
  const bracers = add(t, c, "Bracers of Defense");
  bracers.attuned = true;
  assert.equal(ac(), before + 3, "no armor or shield: +2 more");
  c.inventory.push({ id: "s", type: "armor", name: "Shield", category: "shield", baseAC: 2, equipped: true });
  assert.equal(ac(), before + 1 + 2, "with a shield: the bracers stop, the shield adds 2");
});

test("items that set or raise a score: worn and attuned, the scores everything else uses", (t) => {
  const c = char();
  c.abilities.str = 14; c.abilities.con = 12; c.abilities.dex = 19;
  const gauntlets = add(t, c, "Gauntlets of Ogre Power");
  assert.equal(abilityScore(c, "str"), 14, "not attuned yet");
  gauntlets.attuned = true;
  assert.deepEqual(abilityScoreDetail(c, "str"), { score: 19, base: 14, sources: ["Gauntlets of Ogre Power"] });
  assert.equal(c.abilities.str, 14, "the character's own score is untouched");
  const sword = { id: "w", name: "Longsword", type: "weapon", ability: "str", proficient: true, equipped: true, damageDice: "1d8" };
  c.inventory.push(sword);
  assert.equal(H.weaponDamageBonus(c, sword), 4, "attacks use STR 19");
  const belt = add(t, c, "Belt of Hill Giant Strength");
  belt.attuned = true;
  assert.equal(abilityScore(c, "str"), 21, "the belt's 21 beats the gauntlets' 19");
  const stone = add(t, c, "Ioun Stone of Agility");
  stone.attuned = true;
  assert.equal(abilityScore(c, "dex"), 20, "+2, to a maximum of 20");
  // Amulet of Health: CON 19 and the hit point maximum follows.
  const before = H.maxHp(c);
  const amulet = add(t, c, "Amulet of Health");
  amulet.attuned = true;
  assert.equal(abilityScore(c, "con"), 19);
  assert.equal(H.maxHp(c), before + (4 - 1) * 5, "CON +1 to +4 over 5 levels");
  assert.ok(H.hpBonuses(c).some((b) => b.name === "Amulet of Health" && b.value === 15));
  assert.equal(H.computeSave(c, "con").value, 4, "the CON save uses 19 (+4)");
});

test("charges: spent while it works, regained by its dice at dawn", (t) => {
  const c = char([{ name: "Wizard", level: 9 }]);
  const wand = add(t, c, "Wand of Fireballs");
  assert.deepEqual(MI.itemCharges(wand), { max: 7, left: 7, used: 0, regain: "1d6+1" });
  MI.spendCharges(wand, 5);
  assert.equal(MI.itemCharges(wand).left, 2);
  MI.spendCharges(wand, 9);
  assert.equal(MI.itemCharges(wand).left, 0, "never below none");
  const rest = MI.magicItemsOnLongRest(c, () => 3);
  assert.equal(MI.itemCharges(wand).left, 4, "1d6 + 1 rolled as 3 + 1");
  assert.ok(rest.recharged.some((r) => /Wand of Fireballs \(\+4 charges\)/.test(r)));
  const gem = add(t, c, "Gem of Brightness");
  assert.deepEqual([MI.itemCharges(gem).max, MI.itemCharges(gem).regain], [50, ""], "no regain: it only counts down");
  assert.equal(MI.itemCharges(add(t, c, "Bronze Griffon Figurine of Wondrous Power")), null, "figurines left out");
});

test("potions of healing: Drink rolls the healing and uses one up", (t) => {
  const c = char();
  c.hp = { max: 40, current: 10, temp: 0 };
  c.inventory.push({ id: "p", name: "Potion of Healing", type: "gear", qty: 2 });
  assert.equal(MI.potionHealing(c.inventory[0]), "2d4+2", "the gear list's potion");
  const r = MI.drinkPotion(c, c.inventory[0], 40, () => 4);
  assert.deepEqual([r.total, c.hp.current, c.inventory[0].qty], [10, 20, 1]);
  const supreme = add(t, c, "Potion of Supreme Healing");
  assert.equal(MI.potionHealing(supreme), "10d4+20");
  MI.drinkPotion(c, supreme, 40, () => 4);
  assert.equal(c.hp.current, 40, "never past the maximum");
  assert.ok(!c.inventory.includes(supreme), "the last one is used up");
});

