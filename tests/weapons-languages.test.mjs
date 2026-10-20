/* Weapons and languages the app's feats, races and backgrounds name.
   Checked on 2026-10-19: the Dungeon Master's Guide's Renaissance firearms
   (pistol 1d10 piercing, 3 lb, ammunition, loading; musket 1d12 piercing,
   10 lb, ammunition, loading, two-handed; bullets 3 gp for 10, 2 lb), for
   Gunner; Eberron's double-bladed scimitar (martial, 2d4 slashing, 6 lb,
   special, two-handed: a bonus action attack with the other blade deals
   1d4 in place of 2d4), for Revenant Blade (+1 AC holding it with two
   hands, finesse when you wield it); the Player's Handbook's Primordial
   dialects (Auran, Aquan, Ignan, Terran). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { WEAPON_DATA, WEAPON_GROUPS } from "../js/data/weapons.js";
import { GEAR_DATA } from "../js/data/gear.js";
import { LANGUAGES, LANGUAGE_LIST, ANY_LANGUAGES, languagePickerGroups } from "../js/data/languages.js";
import { RACE_LANGUAGES } from "../js/data/races.js";
import { BACKGROUND_LANGUAGE_RULES } from "../js/data/backgrounds.js";
import { INFUSIONS } from "../js/data/infusions.js";
import { infusionTargets } from "../js/core/artificer.js";
import { newCharacter } from "../js/core/character.js";

function char(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  c.abilities = Object.assign({ str: 12, dex: 16, con: 12, int: 10, wis: 10, cha: 8 }, extra.abilities || {});
  Object.keys(extra).forEach((k) => { if(k !== "abilities") c[k] = extra[k]; });
  return c;
}
const scimitar = (equipped = true) => ({ id: "dbs", name: "Double-Bladed Scimitar", type: "weapon", damageDice: "2d4", damageType: "Slashing", ability: "str", proficient: true, equipped });
const pistol = () => ({ id: "p", name: "Pistol", type: "weapon", damageDice: "1d10", damageType: "Piercing", ability: "dex", proficient: false });

test("firearms: the DMG's pistol and musket, their own category, with bullets in the gear list", () => {
  assert.deepEqual(WEAPON_GROUPS.Firearms, ["Pistol", "Musket"]);
  assert.deepEqual([WEAPON_DATA.Pistol.damageDice, WEAPON_DATA.Pistol.weight, WEAPON_DATA.Pistol.category], ["1d10", 3, "firearm"]);
  assert.deepEqual([WEAPON_DATA.Musket.damageDice, WEAPON_DATA.Musket.weight], ["1d12", 10]);
  assert.match(WEAPON_DATA.Musket.properties, /two-handed/i);
  assert.ok(WEAPON_DATA.Pistol.ranged && /loading/i.test(WEAPON_DATA.Pistol.properties));
  assert.deepEqual(GEAR_DATA["Firearm Bullets"], { cost: "3 gp", weight: 2, qty: 10, notes: "ammunition" });
});

test("firearms proficiency comes from Gunner, not from martial weapons", () => {
  const fighter = char([{ name: "Fighter", level: 4 }]);
  assert.ok(H.isProficientWithWeapon(fighter, "Longbow", "martial"));
  assert.ok(!H.isProficientWithWeapon(fighter, "Pistol", "firearm"), "martial weapons don't cover firearms");
  fighter.feats = [{ name: "Gunner" }];
  assert.ok(H.isProficientWithWeapon(fighter, "Pistol", "firearm") && H.isProficientWithWeapon(fighter, "Musket", "firearm"));
  assert.ok(!H.isProficientWithWeapon(char([{ name: "Wizard", level: 4 }], { feats: [] }), "Pistol", "firearm"));
});

test("infusions go on simple and martial weapons only, not firearms", () => {
  const def = (name) => INFUSIONS.find((i) => i.name === name);
  const c = char([{ name: "Artificer", level: 6 }], { inventory: [pistol(), { id: "lc", name: "Light Crossbow", type: "weapon" }, { id: "hb", name: "My Bow", type: "weapon" }] });
  const ids = (name) => infusionTargets(c, def(name)).map((t) => t.item.id);
  assert.deepEqual(ids("Enhanced Weapon"), ["lc", "hb"], "a weapon typed in by hand is let through");
  assert.deepEqual(ids("Repeating Shot"), ["lc"]);
});

test("double-bladed scimitar: a martial two-handed weapon whose other blade attacks for 1d4", () => {
  const d = WEAPON_DATA["Double-Bladed Scimitar"];
  assert.deepEqual([d.damageDice, d.damageType, d.weight, d.category], ["2d4", "Slashing", 6, "martial"]);
  assert.ok(WEAPON_GROUPS["Martial Melee"].includes("Double-Bladed Scimitar"));
  assert.equal(H.itemHands(scimitar()), 2);
  const c = char([{ name: "Fighter", level: 1 }], { inventory: [scimitar()] });
  assert.deepEqual(H.otherBladeAttack(c, c.inventory[0]), { dice: "1d4", damage: 1 }, "STR +1, as on the main attack");
  assert.equal(H.offHandAttack(c, c.inventory[0]), null, "not two-weapon fighting");
  c.inventory[0].equipped = false;
  assert.equal(H.otherBladeAttack(c, c.inventory[0]), null, "only while it's in hand");
});

test("Revenant Blade: finesse with a double-bladed scimitar, and +1 AC while holding it", () => {
  const c = char([{ name: "Fighter", level: 4 }], { race: "High Elf", inventory: [scimitar()] });
  const blade = c.inventory[0];
  assert.deepEqual(H.weaponAbility(c, blade).keys, ["str"]);
  const before = H.computeArmorClass(c).value;
  c.feats = [{ name: "Revenant Blade" }];
  assert.deepEqual(H.weaponAbility(c, blade).keys, ["dex"], "DEX 16 beats STR 12 once it's finesse");
  assert.equal(H.otherBladeAttack(c, blade).damage, 3, "the other blade uses DEX too");
  const ac = H.computeArmorClass(c);
  assert.equal(ac.value, before + 1);
  assert.match(ac.short, /Revenant Blade/);
  blade.equipped = false;
  assert.equal(H.computeArmorClass(c).value, before, "not holding it: no bonus");
  const sword = { id: "s", name: "Scimitar", type: "weapon", ability: "finesse", equipped: true };
  c.inventory = [sword];
  assert.equal(H.computeArmorClass(c).value, before, "a plain scimitar doesn't count");
});

test("languages: every one a race or background teaches is in the list, and pickers offer them", () => {
  const named = new Set();
  const walk = (o) => {
    if(typeof o === "string"){ if(/^[A-Z][\w' -]+$/.test(o) && o.length < 20) named.add(o); }
    else if(o && typeof o === "object") Object.values(o).forEach(walk);
  };
  Object.values(RACE_LANGUAGES).forEach(walk);
  Object.values(BACKGROUND_LANGUAGE_RULES).forEach(walk);
  const missing = [...named].filter((n) => !LANGUAGE_LIST.includes(n));
  assert.deepEqual(missing, [], "taught but not listed");
  assert.deepEqual(LANGUAGES["Primordial dialects"], ["Aquan", "Auran", "Ignan", "Terran"]);
  assert.equal(new Set(LANGUAGE_LIST).size, LANGUAGE_LIST.length, "no language in two groups");
  const any = languagePickerGroups(false), exotic = languagePickerGroups(true);
  assert.ok(Object.values(any).flat().includes("Common") && Object.values(any).flat().includes("Gith"));
  assert.ok(!Object.values(exotic).flat().includes("Common") && Object.values(exotic).flat().includes("Auran"));
  assert.ok(!ANY_LANGUAGES.includes("Druidic") && !ANY_LANGUAGES.includes("Thieves' Cant"), "secret languages aren't a free pick");
});
