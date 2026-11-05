/* Weapon mastery (Player's Handbook 2024, pp. 213-215, checked against
   books/Players_Handbook_2024 on 2026-11-05): each weapon's property, who
   can use it (Weapon Master (2024), a 2024 class's c.weaponMasteries), Nick
   on the off-hand attack, Topple's DC, and the 2024 Heavy rule. */
import { test } from "node:test";
import assert from "node:assert/strict";
import "../js/core/helpers.js"; // (first, as the app loads it)
import * as FP from "../js/core/feat-picks.js";
import { WEAPON_MASTERY, MASTERY_PROPERTIES } from "../js/data/weapon-mastery.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
import { masteryKind, masteryKinds, weaponMastery, toppleDc, weaponMasterSwitch } from "../js/core/weapon-mastery.js";
import { offHandAttack, bonusActionAttacks } from "../js/core/equipment.js";
import { heavyWeaponPenalty } from "../js/core/checks.js";

function char(extra = {}){
  return Object.assign({ abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }, saveProfs: {}, skillProfs: {},
    classes: [{ name: "Fighter", subclass: "", level: 4 }], inventory: [], feats: [], features: [], spells: [], languages: ["Common"],
    resourcesUsed: {}, race: "Human", speed: 30 }, extra);
}
function master(c, kind){
  const def = FP.featDef("Weapon Master (2024)");
  const feat = { id: "wm", name: def.name };
  c.feats.push(feat);
  FP.applyFeatPicks(c, feat, { ...FP.emptyPicks(def), ability: "str", option: kind });
  return feat;
}
const weapon = (name, extra = {}) => Object.assign({ id: name, type: "weapon", name, proficient: true, equipped: true }, extra);

test("every weapon in the book's table has its mastery, and every property its rule", () => {
  assert.equal(Object.keys(WEAPON_MASTERY).length, 38);
  for(const [name, prop] of Object.entries(WEAPON_MASTERY)){
    assert.ok(WEAPON_DATA[name], name + " is a weapon");
    assert.ok(MASTERY_PROPERTIES[prop], name + ": " + prop);
  }
  assert.deepEqual(Object.keys(MASTERY_PROPERTIES), ["Cleave", "Graze", "Nick", "Push", "Sap", "Slow", "Topple", "Vex"]);
  // Spot checks against p. 215.
  const m = (n) => WEAPON_MASTERY[n];
  assert.deepEqual(["Dagger", "Greatsword", "Greataxe", "Longsword", "Rapier", "Quarterstaff", "Longbow", "Heavy Crossbow", "Whip", "Scimitar"].map(m),
    ["Nick", "Graze", "Cleave", "Sap", "Vex", "Topple", "Slow", "Push", "Slow", "Nick"]);
  assert.equal(WEAPON_MASTERY.Net, undefined, "a net has none");
  // Weapon Master (2024) chooses among exactly these.
  assert.deepEqual(FP.featDef("Weapon Master (2024)").option.options, Object.keys(WEAPON_MASTERY).sort());
});

test("Weapon Master (2024): one kind's mastery, only while proficient, changed from the weapon card", () => {
  const c = char();
  assert.equal(weaponMastery(c, weapon("Longsword")), null, "no feature, no mastery");
  const feat = master(c, "Longsword");
  assert.deepEqual(masteryKinds(c), [{ kind: "Longsword", source: "Weapon Master (2024)" }]);
  const m = weaponMastery(c, weapon("Longsword"));
  assert.equal(m.name, "Sap");
  assert.equal(weaponMastery(c, weapon("Longsword", { proficient: false })), null);
  assert.equal(weaponMastery(c, weapon("Greatsword")), null, "another kind");
  // A khopesh counts as a longsword.
  assert.equal(masteryKind(weapon("Khopesh")), "Longsword");
  assert.equal(weaponMastery(c, weapon("Khopesh")).name, "Sap");
  // Switching: offered on a weapon of another kind, not the one already mastered.
  assert.equal(weaponMasterSwitch(c, weapon("Longsword")), null);
  assert.equal(weaponMasterSwitch(c, weapon("Greatsword")), feat);
  assert.equal(weaponMasterSwitch(c, weapon("Net")), null, "no mastery to use");
  // A 2024 class's Weapon Mastery picks count too.
  c.weaponMasteries = ["Greatsword", "Dagger"];
  assert.deepEqual(masteryKinds(c).map((x) => x.kind), ["Longsword", "Greatsword", "Dagger"]);
});

test("Topple's DC, and Nick making the off-hand attack part of the Attack action", () => {
  const c = char();
  assert.equal(toppleDc(c, 3), 8 + 3 + 2);
  const main = weapon("Shortsword"), off = weapon("Dagger");
  c.inventory = [main, off];
  assert.equal((offHandAttack(c, off) || {}).nick, undefined);
  assert.ok(bonusActionAttacks(c).some((l) => /Off-hand attack/.test(l)));
  master(c, "Dagger");
  assert.equal(offHandAttack(c, off).nick, true);
  assert.ok(!bonusActionAttacks(c).some((l) => /Off-hand attack/.test(l)), "not a bonus action any more");
});

test("Heavy: the 2014 rules' Small creatures, the 2024 rules' Strength or Dexterity 13", () => {
  const gs = weapon("Greatsword"), bow = weapon("Longbow");
  const halfling = char({ race: "Lightfoot Halfling" });
  assert.equal(heavyWeaponPenalty(halfling, gs).reason, "Heavy weapon: you're Small");
  // The 2024 rules: size doesn't matter, the score does.
  const strong = char({ race: "Halfling (2024)" });
  assert.equal(heavyWeaponPenalty(strong, gs), null, "a STR 16 halfling");
  const weak = char({ race: "Human", rules2024: true, abilities: { str: 12, dex: 12, con: 10, int: 10, wis: 10, cha: 10 } });
  assert.equal(heavyWeaponPenalty(weak, gs).reason, "Heavy weapon: Strength under 13");
  assert.equal(heavyWeaponPenalty(weak, bow).reason, "Heavy weapon: Dexterity under 13");
  assert.equal(heavyWeaponPenalty(weak, weapon("Longsword")), null, "not heavy");
});
