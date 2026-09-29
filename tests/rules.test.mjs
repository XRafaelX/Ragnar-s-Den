/* Rules: the sheet's calculations against numbers worked out by hand from
   the 2014 rules. Each test builds the smallest character that shows the
   rule, so a failure points straight at the calculation that broke. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { CLASS_PROFICIENCIES } from "../js/data/classes.js";

const AB = { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 10 };
function char(classes, extra = {}){
  return { abilities: { ...AB, ...(extra.abilities || {}) }, saveProfs: extra.saveProfs || {}, classes,
    inventory: extra.inventory || [], feats: extra.feats || [], resourcesUsed: extra.resourcesUsed || {},
    race: extra.race || "Human", initiativeMisc: 0, acMisc: 0 };
}
const feature = (cls, sub, level, name) => H.classFeatureList({ name: cls, subclass: sub, level }).find((f) => f.name === name);
const speedGained = (cls, sub, upto) => {
  let total = 0;
  for(let l = 1; l <= upto; l++) total += H.classFeaturesGainedAt({ name: cls, subclass: sub, level: l }, l).reduce((a, f) => a + (f.speed || 0), 0);
  return total;
};

test("proficiency bonus by total level", () => {
  const pb = (l) => H.profBonus({ classes: [{ name: "Fighter", level: l }] });
  assert.deepEqual([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(pb), [2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
});

test("replacing features grow at the right levels", () => {
  const sneak = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19].map((l) => feature("Rogue", "", l, "Sneak Attack").text.match(/(\d+)d6/)[1]);
  assert.deepEqual(sneak.map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.match(feature("Monk", "", 4, "Martial Arts").text, /1d4/);
  assert.match(feature("Monk", "", 10, "Martial Arts").text, /1d6/);
  assert.match(feature("Monk", "", 11, "Martial Arts").text, /1d8/);
  assert.match(feature("Monk", "", 20, "Martial Arts").text, /1d10/);
  assert.match(feature("Barbarian", "", 8, "Rage").text, /\+2 damage/);
  assert.match(feature("Barbarian", "", 9, "Rage").text, /\+3 damage/);
  assert.match(feature("Barbarian", "", 16, "Rage").text, /\+4 damage/);
  assert.match(feature("Fighter", "", 20, "Extra Attack").text, /four times/);
  // Domain spells: only the current list is shown, and it reaches level 9 spells.
  const life = H.classFeatureList({ name: "Cleric", subclass: "Life Domain", level: 9 }).filter((f) => f.name === "Domain Spells");
  assert.equal(life.length, 1);
  assert.match(life[0].text, /Raise Dead/);
});

test("speed bonuses from features add up", () => {
  assert.equal(speedGained("Monk", "", 20), 30);
  assert.equal(speedGained("Monk", "", 9), 15);
  assert.equal(speedGained("Barbarian", "Path of the Berserker", 20), 10);
  assert.equal(speedGained("Rogue", "Scout", 9), 10);
  assert.equal(speedGained("Paladin", "Oath of Glory", 7), 10);
  assert.equal(speedGained("Fighter", "Champion", 20), 0);
});

test("rage damage and rages per day", () => {
  assert.deepEqual([1, 8, 9, 15, 16, 20].map(H.barbarianRageDamage), [2, 2, 3, 3, 4, 4]);
  assert.deepEqual([1, 3, 6, 12, 17].map(H.barbarianRageMax), [2, 3, 4, 5, 6]);
  assert.equal(H.barbarianRageMax(20), Infinity);
});

test("initiative: DEX plus feature, feat and race bonuses", () => {
  assert.equal(H.computeInitiative(char([{ name: "Fighter", level: 5 }])).value, 2);
  assert.equal(H.computeInitiative(char([{ name: "Ranger", level: 3, subclass: "Gloom Stalker" }], { abilities: { wis: 16 } })).value, 5);
  assert.equal(H.computeInitiative(char([{ name: "Wizard", level: 1, subclass: "Chronurgy Magic" }], { abilities: { int: 18 } })).value, 2);
  assert.equal(H.computeInitiative(char([{ name: "Wizard", level: 2, subclass: "Chronurgy Magic" }], { abilities: { int: 18 } })).value, 6);
  assert.equal(H.computeInitiative(char([{ name: "Fighter", level: 1 }], { feats: [{ name: "Alert" }] })).value, 7);
  assert.equal(H.computeInitiative(char([{ name: "Fighter", level: 5 }], { race: "Harengon" })).value, 5);
  assert.equal(H.computeInitiative(char([{ name: "Paladin", level: 7, subclass: "Oath of the Watchers" }])).value, 5);
});

test("armor class: armor, unarmored defense and feature bonuses", () => {
  const plate = { type: "armor", equipped: true, name: "Plate", category: "heavy", baseAC: 18, magicBonus: 0 };
  const shield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };
  assert.equal(H.computeArmorClass(char([{ name: "Barbarian", level: 1 }], { abilities: { con: 16 } })).value, 15);
  assert.equal(H.computeArmorClass(char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 } })).value, 15);
  assert.equal(H.computeArmorClass(char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 }, inventory: [shield] })).value, 14);
  assert.equal(H.computeArmorClass(char([{ name: "Sorcerer", level: 1, subclass: "Draconic Bloodline" }])).value, 15);
  assert.equal(H.computeArmorClass(char([{ name: "Cleric", level: 5, subclass: "Forge Domain" }], { inventory: [plate] })).value, 18);
  assert.equal(H.computeArmorClass(char([{ name: "Cleric", level: 6, subclass: "Forge Domain" }], { inventory: [plate, shield] })).value, 21);
  assert.equal(H.computeArmorClass(char([{ name: "Cleric", level: 6, subclass: "Life Domain" }], { inventory: [plate] })).value, 18);
});

test("saving throws: proficiency, Aura of Protection, granted saves", () => {
  const ab = { str: 14, dex: 16, con: 12, int: 10, wis: 16, cha: 16 };
  const pal6 = char([{ name: "Paladin", level: 6 }], { abilities: ab, saveProfs: { wis: true, cha: true } });
  assert.equal(H.computeSave(pal6, "wis").value, 9);   // 3 + prof 3 + aura 3
  assert.equal(H.computeSave(pal6, "str").value, 5);   // 2 + aura 3
  const lowCha = char([{ name: "Paladin", level: 6 }], { abilities: { ...ab, cha: 8 } });
  assert.equal(H.computeSave(lowCha, "cha").value, 0); // -1 + aura minimum +1
  assert.equal(H.computeSave(char([{ name: "Paladin", level: 5 }], { abilities: ab }), "str").value, 2);
  const monk = (l) => char([{ name: "Monk", level: l }], { abilities: ab, saveProfs: { str: true, dex: true } });
  assert.equal(H.computeSave(monk(13), "int").grantedBy, null);
  assert.equal(H.computeSave(monk(14), "int").grantedBy, "Diamond Soul");
  assert.equal(H.computeSave(monk(14), "int").value, 5);
  assert.equal(H.computeSave(char([{ name: "Rogue", level: 15 }], { abilities: ab }), "wis").grantedBy, "Slippery Mind");
});

test("weapon attacks: Battle Ready and Hex Warrior", () => {
  const sword = { name: "Longsword", ability: "str", proficient: true, magicBonus: 0 };
  const bs = char([{ name: "Artificer", level: 3, subclass: "Battle Smith" }], { abilities: { str: 10, int: 18 } });
  assert.equal(H.weaponAttackBonus(bs, sword), 2);
  assert.equal(H.weaponAttackBonus(bs, { ...sword, magicBonus: 1 }), 7);
  assert.equal(H.weaponDamageBonus(bs, { ...sword, magicBonus: 1 }), 5);
  const hex = char([{ name: "Warlock", level: 1, subclass: "The Hexblade" }], { abilities: { str: 10, cha: 18 } });
  assert.equal(H.weaponAttackBonus(hex, sword), 2);
  assert.equal(H.weaponAttackBonus(hex, { ...sword, chosenWeapon: true }), 6);
  assert.equal(H.chosenWeaponFeature(hex).name, "Hex Warrior");
  const fiend = char([{ name: "Warlock", level: 1, subclass: "The Fiend" }], { abilities: { str: 10, cha: 18 } });
  assert.equal(H.weaponAttackBonus(fiend, { ...sword, chosenWeapon: true }), 2);
});

test("subclass proficiency grants, without touching shared class data", () => {
  const before = JSON.stringify(CLASS_PROFICIENCIES);
  const valor = H.classProficiencies(char([{ name: "Bard", level: 3, subclass: "College of Valor" }]), 0);
  assert.ok(valor.weapons.includes("Martial weapons") && valor.armor.includes("Shields"));
  assert.ok(!H.classProficiencies(char([{ name: "Bard", level: 2, subclass: "College of Valor" }]), 0).weapons.includes("Martial weapons"));
  assert.ok(H.classProficiencies(char([{ name: "Cleric", level: 1, subclass: "Forge Domain" }]), 0).tools.includes("Smith's tools"));
  assert.ok(H.isProficientWithWeapon(char([{ name: "Artificer", level: 3, subclass: "Battle Smith" }]), "Longsword", "martial"));
  assert.equal(JSON.stringify(CLASS_PROFICIENCIES), before);
});

test("resources: counts scale and rests restore the right ones", () => {
  const res = (c) => Object.fromEntries(H.characterResources(c).map((r) => [r.name, r.max]));
  assert.equal(res(char([{ name: "Fighter", level: 17 }]))["Indomitable"], 3);
  assert.equal(res(char([{ name: "Fighter", level: 17 }]))["Action Surge"], 2);
  assert.equal(res(char([{ name: "Cleric", level: 18 }]))["Channel Divinity"], 3);
  assert.equal(res(char([{ name: "Rogue", level: 13, subclass: "Misfortune Bringer" }]))["Jinx Points"], 6);

  const c = char([{ name: "Warlock", level: 14, subclass: "The Genie" }], { resourcesUsed: {} });
  c.resourcesUsed = { "Warlock:limited_wish": 1, "Warlock:bottled_respite": 1, "Warlock:mystic_arcanum_6": 1 };
  H.restoreResources(c, "short");
  assert.deepEqual(Object.keys(c.resourcesUsed).sort(), ["Warlock:bottled_respite", "Warlock:limited_wish", "Warlock:mystic_arcanum_6"]);
  H.restoreResources(c, "long");
  assert.deepEqual(Object.keys(c.resourcesUsed), ["Warlock:limited_wish"]); // manual reset survives a long rest
});

test("spell slots: single class, half casters, multiclass, pact magic", () => {
  const slots = (classes) => H.computeSpellSlots(classes);
  assert.deepEqual(Object.values(slots([{ name: "Wizard", level: 20 }]).slots), [4, 3, 3, 3, 3, 2, 2, 1, 1]);
  assert.deepEqual(Object.values(slots([{ name: "Paladin", level: 5 }]).slots).slice(0, 3), [4, 2, 0]);
  assert.deepEqual(Object.values(slots([{ name: "Paladin", level: 10 }, { name: "Sorcerer", level: 10 }]).slots), [4, 3, 3, 3, 2, 1, 1, 1, 0]);
  assert.equal(slots([{ name: "Fighter", level: 3, subclass: "Eldritch Knight" }]).slots[1], 2);
  assert.deepEqual(slots([{ name: "Warlock", level: 11 }]).pact, { max: 3, slotLevel: 5 });
});
