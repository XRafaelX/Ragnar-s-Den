/* The Gunslinger class (Michael's homebrew, books/Gunslinger.pdf and the
   gun_1 to gun_4 images): the class itself, its four subclasses, its own
   firearms (what a Gunslinger class character sees in place of the
   Firearms), the optional misfire rule and the Eldritch Gunman's spells. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../js/data/classes.js";
import { CLASS_PROGRESSION, SUBCLASSES } from "../js/data/progression.js";
import { HIT_DICE_BY_CLASS } from "../js/data/abilities-skills.js";
import { WEAPON_DATA, GUNSLINGER_FIREARMS, weaponCatalogFor, weaponDataOf, hasHeavyProperty } from "../js/data/weapons.js";
import { SPELL_DATA } from "../js/data/spells.js";
import { SUBCLASS_CASTERS } from "../js/data/spells-known.js";
import { casterDef } from "../js/core/spells-known.js";
import { classCasterType } from "../js/core/class-features.js";
import { newCharacter } from "../js/core/character.js";

const LONG_DASH = /[–—]/;
function slinger(level, subclass = "", extra = {}){
  const c = newCharacter("Test");
  c.classes = [{ name: "Gunslinger", subclass, level }];
  Object.assign(c.abilities, { str: 10, dex: 16, con: 14, int: 14, wis: 14, cha: 10 });
  Object.assign(c, extra);
  return c;
}
function gun(name, extra = {}){
  const d = GUNSLINGER_FIREARMS[name];
  return Object.assign({ name, type: "weapon", firearmSet: "gunslinger", damageDice: d.damageDice, damageType: d.damageType, proficient: true }, extra);
}

test("Gunslinger class: hit die, saves, skills, proficiencies and starting gear as the PDF lists them", () => {
  const info = CLASSES_INFO.Gunslinger;
  assert.equal(HIT_DICE_BY_CLASS.Gunslinger, 8);
  assert.ok(info.available);
  assert.deepEqual(info.savingThrows, ["dex", "cha"]);
  assert.equal(info.skillChoices.count, 3);
  assert.deepEqual(info.skillChoices.options, ["Deception", "History", "Insight", "Investigation", "Perception", "Sleight of Hand", "Stealth", "Survival"]);
  assert.deepEqual(CLASS_PROFICIENCIES.Gunslinger.weapons, ["Simple weapons", "Firearms"]);
  assert.deepEqual(CLASS_PROFICIENCIES.Gunslinger.armor, ["Light armor"]);
  assert.deepEqual(info.features.map((f) => f.name), ["Gunslinger Subclass", "Novice Bulletsmith"]);
  const fixed = info.equipment.fixed.map((i) => i.name);
  assert.deepEqual(fixed, ["Pistol", "Dagger", "Tinker's Tools"]);
  assert.deepEqual(info.equipment.fixed[0].pick, { category: "firearm", set: "gunslinger" });
  assert.ok(!LONG_DASH.test(JSON.stringify(info) + JSON.stringify(CLASS_PROGRESSION.Gunslinger) + JSON.stringify(SUBCLASSES.Gunslinger)), "no long dashes");
});

test("Gunslinger class: subclass at 1, DEX 13 to multiclass, the class table's features", () => {
  const p = CLASS_PROGRESSION.Gunslinger;
  assert.equal(p.subclassLevel, 1);
  assert.deepEqual(p.prereq, [["dex"]]);
  assert.deepEqual(p.asiLevels, [4, 8, 12, 16, 19]);
  const at = (l) => p.features[l].map((f) => f.name);
  assert.deepEqual([2, 3, 5, 6, 9, 11, 13, 15, 17, 20].map((l) => at(l)[0]),
    ["Master of Arms", "Take Aim", "Extra Attack", "Handy Bulletsmith", "Quick Patch", "Elemental Bulletsmith", "Willpower", "Honed Instinct", "Occult Bulletsmith", "Master of the Barrel"]);
  assert.equal(H.attacksPerAction(slinger(5)), 2);
  // Skills, tools and saves from the class.
  const c = slinger(1);
  assert.ok(H.classProficiencies(c, 0).weapons.includes("Firearms"));
});

test("Gunslinger class: four subclasses with the PDF's features by level", () => {
  const subs = SUBCLASSES.Gunslinger;
  assert.deepEqual(subs.map((s) => s.name), ["Marksman", "Outlaw", "Marshal", "Eldritch Gunman"]);
  const names = (s) => Object.fromEntries(Object.entries(subs.find((x) => x.name === s).features).map(([l, fs]) => [l, fs.map((f) => f.name)]));
  assert.deepEqual(names("Marksman"), { 1: ["Expert Sniper"], 3: ["Improved Critical"], 7: ["Vital Points"], 14: ["Predicted Critical"], 18: ["Deadly Critical", "Vital Points"] });
  assert.deepEqual(names("Outlaw"), { 1: ["Outlaw's Grit"], 3: ["Drawn and Quartered"], 7: ["Luck of the Draw"], 14: ["Playing Dirty"], 18: ["Duel"] });
  assert.deepEqual(names("Marshal"), { 1: ["Calibrated Sights"], 3: ["Applying Pressure"], 7: ["Know Your Enemy", "Sharp Read"], 14: ["Pinpoint Control"], 18: ["Intuition"] });
  assert.deepEqual(names("Eldritch Gunman"), { 1: ["Arcane Apprentice"], 3: ["Spellcasting", "Gunman Spells", "Firearm Enchantment"], 7: ["War Magic"], 14: ["Eldritch Shot"], 18: ["Improved War Magic"] });
  // Deadly Critical takes Improved Critical's place, and Vital Points grows to 2d6.
  const list = H.classFeatureList({ name: "Gunslinger", subclass: "Marksman", level: 18 }).map((f) => f.name);
  assert.ok(list.includes("Deadly Critical") && !list.includes("Improved Critical"));
  assert.match(H.classFeatureList({ name: "Gunslinger", subclass: "Marksman", level: 18 }).find((f) => f.name === "Vital Points").text, /2d6/);
});

test("Eldritch Gunman: a one-third caster on the wizard list like the Eldritch Knight, with three spells always known", () => {
  assert.equal(classCasterType({ name: "Gunslinger", subclass: "Eldritch Gunman", level: 3 }), "third");
  const def = SUBCLASS_CASTERS["Gunslinger:Eldritch Gunman"];
  assert.equal(casterDef("Gunslinger", "Eldritch Gunman"), def);
  assert.deepEqual(def.schools, ["Abjuration", "Evocation"]);
  assert.deepEqual(def.spells, SUBCLASS_CASTERS["Fighter:Eldritch Knight"].spells);
  assert.equal(def.cantrips[3], 2);
  assert.equal(def.cantrips[10], 3);
  const always = SUBCLASSES.Gunslinger.find((s) => s.name === "Eldritch Gunman").features[3].find((f) => f.name === "Gunman Spells");
  assert.deepEqual(always.spells, ["Ready Arms!", "Misty Step", "Switcheroo"]);
  assert.equal(always.spellKind, "known");
  // Michael's two spells: on no class list, a cantrip and a 2nd-level conjuration.
  assert.deepEqual([SPELL_DATA["Ready Arms!"].level, SPELL_DATA["Ready Arms!"].school, SPELL_DATA["Ready Arms!"].concentration], [0, "Conjuration", true]);
  assert.deepEqual([SPELL_DATA.Switcheroo.level, SPELL_DATA.Switcheroo.school, SPELL_DATA.Switcheroo.material], [2, "Conjuration", "a firearm"]);
  assert.deepEqual(SPELL_DATA["Ready Arms!"].classes, []);
  assert.ok(!SPELL_DATA["Misty Shot"], "Misty Shot was removed");
});

test("Gunslinger firearms: Michael's four, only in a Gunslinger class character's catalog", () => {
  assert.deepEqual(Object.keys(GUNSLINGER_FIREARMS), ["Pistol", "Handcannon", "Long Gun", "Spread Shot"]);
  assert.deepEqual(["Pistol", "Handcannon", "Long Gun", "Spread Shot"].map((n) => GUNSLINGER_FIREARMS[n].damageDice), ["2d4", "1d10", "1d12", "1d6"]);
  assert.match(GUNSLINGER_FIREARMS["Long Gun"].properties, /range 300\/1000/);
  assert.match(GUNSLINGER_FIREARMS["Spread Shot"].special, /10-foot cone/);
  // Everyone else keeps the current firearms (one Pistol each, never two).
  const fighter = newCharacter("F");
  assert.equal(weaponCatalogFor(fighter).data.Pistol, WEAPON_DATA.Pistol);
  const mine = weaponCatalogFor(slinger(1));
  assert.deepEqual(mine.groups.Firearms, ["Pistol", "Handcannon", "Long Gun", "Spread Shot"]);
  assert.equal(mine.data.Pistol, GUNSLINGER_FIREARMS.Pistol);
  assert.ok(!WEAPON_DATA.Handcannon, "kept out of the shared catalog");
  // An item knows which Pistol it is.
  assert.equal(weaponDataOf(gun("Pistol")).damageDice, "2d4");
  assert.equal(weaponDataOf({ name: "Pistol", type: "weapon" }).damageDice, "1d10");
  // "Heavy ammunition" isn't the heavy property.
  assert.ok(!hasHeavyProperty(GUNSLINGER_FIREARMS.Handcannon.properties));
  assert.ok(hasHeavyProperty(WEAPON_DATA.Greatsword.properties));
  assert.ok(!H.isHeavyWeapon(gun("Long Gun")));
  // Proficient through the class's Firearms.
  assert.ok(H.isProficientWithWeapon(slinger(1), "Handcannon", "firearm"));
});

test("Gunslinger firearms: misfire is an optional rule, on a 1, gone with Master of Arms", () => {
  const off = slinger(1);
  assert.equal(H.firearmStats(gun("Handcannon"), off).misfire, 0, "off by default");
  const on = slinger(1, "", { gunMisfire: true });
  assert.deepEqual(H.firearmStats(gun("Handcannon"), on), { misfire: 1, reload: 1, set: "gunslinger" });
  assert.equal(H.firearmStats(gun("Handcannon", { proficient: false }), on).misfire, 2, "+1 without proficiency");
  assert.equal(H.firearmStats(gun("Pistol"), on).misfire, 0, "the Pistol has no misfire property");
  assert.equal(H.firearmStats(gun("Pistol"), on).reload, 0, "and no loading");
  assert.equal(H.firearmStats(gun("Long Gun"), slinger(2, "", { gunMisfire: true })).misfire, 0, "Master of Arms");
  // Clearing a misfire is not a tinker's tools check: the old guns' rules stay as they were.
  assert.equal(H.firearmStats({ name: "Musket", type: "weapon", proficient: true }).misfire, 2);
});

test("Gunslinger class: scale mail is offered as the PDF lists it, but locked without medium armor", () => {
  const scale = CLASSES_INFO.Gunslinger.equipment.choiceGroups[0].options.find((o) => o.key === "scale");
  assert.equal(scale.requires, "medium");
  assert.ok(!CLASS_PROFICIENCIES.Gunslinger.armor.includes("Medium armor"));
  assert.match(CLASS_PROGRESSION.Gunslinger.features[15][0].text, /Wisdom score in its place/);
});
