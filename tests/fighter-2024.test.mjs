/* The 2024 Fighter (2026-11-05, Phase 5 of the 2024 Player's Handbook):
   checked against the printed book, pp. 90 to 99. A class entry's edition
   "2024" swaps in the features, kit, Fighting Style feats, Weapon Mastery
   picks, Second Wind's uses and the four 2024 subclasses. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { FIGHTER_2024, FIGHTER_2024_SUBCLASSES } from "../js/data/fighter-2024.js";
import { WEAPON_MASTERY } from "../js/data/weapon-mastery.js";
import { optionSetDef, optionsKnownAt, OPTION_SETS } from "../js/data/class-options.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { versatilityStyleSwap } from "../js/core/fighting-styles.js";
import { masteryKinds, weaponMastery } from "../js/core/weapon-mastery.js";
import { classEdition, classHasEdition, subclassesFor, computeSpellSlots } from "../js/core/class-features.js";
import { initiativeRollMode } from "../js/core/checks.js";
import { SUBCLASS_CASTERS } from "../js/data/spells-known.js";

const ABIL = { str: 16, dex: 14, con: 14, int: 14, wis: 12, cha: 10 };
function fighter(lv, sub = "", edition = "2024"){
  const c = newCharacter("F");
  const cl = { name: "Fighter", subclass: sub, level: lv };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 10 * lv, current: 10 * lv, temp: 0 };
  return ensureShape(c);
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const feature = (c, name) => H.classFeatureList(c.classes[0]).find((f) => f.name === name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const sword = { id: "ls", name: "Longsword", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, damageDice: "1d8", damageType: "Slashing", notes: "" };

test("the 2014 fighter is unchanged without an edition", () => {
  const c = fighter(20, "Champion", "");
  assert.ok(names(c).includes("Second Wind") && names(c).includes("Indomitable"));
  assert.ok(!names(c).includes("Tactical Mind") && !names(c).includes("Weapon Mastery"));
  assert.equal(res(c, "Second Wind").max, 1);
  assert.deepEqual(masteryKinds(c), []);
});

test("the features arrive at the book's levels", () => {
  const at = (lv) => H.classFeatureList(fighter(lv).classes[0]).map((f) => f.name);
  assert.ok(["Fighting Style", "Second Wind", "Weapon Mastery"].every((n) => at(1).includes(n)));
  assert.ok(["Action Surge", "Tactical Mind"].every((n) => at(2).includes(n)) && !at(1).includes("Action Surge"));
  assert.ok(["Extra Attack", "Tactical Shift"].every((n) => at(5).includes(n)) && !at(4).includes("Tactical Shift"));
  assert.ok(["Indomitable", "Tactical Master"].every((n) => at(9).includes(n)) && !at(8).includes("Tactical Master"));
  assert.ok(at(13).includes("Studied Attacks") && !at(12).includes("Studied Attacks"));
  assert.ok(at(19).includes("Epic Boon") && !at(18).includes("Epic Boon"));
  assert.deepEqual([4, 5, 11, 20].map((lv) => H.attacksPerAction(fighter(lv))), [1, 2, 3, 4]);
});

test("each replaced feature shows once", () => {
  const list = names(fighter(20));
  for(const n of ["Weapon Mastery", "Extra Attack", "Action Surge"]) assert.equal(list.filter((x) => x === n).length, 1, n);
  assert.match(feature(fighter(20), "Extra Attack").text, /four times/);
  assert.match(feature(fighter(16), "Weapon Mastery").text, /six kinds/);
});

test("Second Wind: 2, 3 and 4 uses, one back on a short rest, all on a long rest", () => {
  assert.deepEqual([1, 3, 4, 9, 10, 20].map((lv) => res(fighter(lv), "Second Wind").max), [2, 2, 3, 3, 4, 4]);
  const c = fighter(10);
  const key = res(c, "Second Wind").key;
  c.resourcesUsed[key] = 3;
  H.restoreResources(c, "short");
  assert.equal(c.resourcesUsed[key], 2, "one back");
  H.restoreResources(c, "long");
  assert.equal(c.resourcesUsed[key] || 0, 0, "all back");
});

test("Indomitable and Action Surge keep their uses, Action Surge says no Magic action", () => {
  assert.deepEqual([9, 13, 17].map((lv) => res(fighter(lv), "Indomitable").max), [1, 2, 3]);
  assert.match(res(fighter(9), "Indomitable").hint, /\+9/);
  assert.deepEqual([2, 17].map((lv) => res(fighter(lv), "Action Surge").max), [1, 2]);
  assert.match(res(fighter(2), "Action Surge").hint, /except the Magic action/);
  assert.doesNotMatch(res(fighter(2, "", ""), "Action Surge").hint, /Magic/);
});

test("Weapon Mastery: 3, then one more kind at levels 4, 10 and 16", () => {
  const ed = classEdition({ name: "Fighter", edition: "2024" });
  assert.equal(ed.level1.find((f) => f.name === "Weapon Mastery").profs.pick[0].count, 3);
  for(const lv of [4, 10, 16]) assert.equal(ed.features[lv][0].profs.pick[0].count, 1, "level " + lv);
  assert.deepEqual(ed.level1.find((f) => f.name === "Weapon Mastery").profs.pick[0].options, Object.keys(WEAPON_MASTERY).sort());
  const c = fighter(1);
  c.classes[0].profPicks = { "class:Weapon Mastery@1": { slots: [["Longsword", "Longbow", "Greatsword"]], applied: {} } };
  assert.deepEqual(masteryKinds(c).map((x) => x.kind).sort(), ["Greatsword", "Longbow", "Longsword"]);
  assert.equal(weaponMastery(c, sword).name, "Sap");
});

test("the Fighting Style feats: the 2024 list, swapped at any level", () => {
  assert.deepEqual(FIGHTER_2024.fightingStyle.options.slice().sort(), ["Archery", "Blind Fighting", "Defense", "Dueling", "Great Weapon Fighting", "Interception", "Protection", "Thrown Weapon Fighting", "Two-Weapon Fighting", "Unarmed Fighting"]);
  const c = fighter(2);
  c.features = [{ id: "s", name: "Fighting Style: Defense", fightingStyle: "Defense", source: "Fighter 1", text: "" }];
  assert.equal(versatilityStyleSwap(c, "Fighter", 3), true);
  const old = fighter(2, "", "");
  old.features = c.features;
  assert.equal(versatilityStyleSwap(old, "Fighter", 3), false, "2014: only with Tasha's, at an ASI level");
});

test("skills and kit are the book's", () => {
  assert.equal(FIGHTER_2024.skillChoices.count, 2);
  assert.ok(FIGHTER_2024.skillChoices.options.includes("Persuasion"), "new to the 2024 list");
  const [a, b, gold] = FIGHTER_2024.equipment.choiceGroups[0].options;
  assert.deepEqual([a.coins.gp, b.coins.gp, gold.coins.gp], [4, 11, 155]);
  assert.ok(["Chain Mail", "Greatsword", "Flail", "Javelin", "Dungeoneer's Pack"].every((n) => a.items.some((i) => i.name === n)));
  assert.equal(a.items.find((i) => i.name === "Javelin").qty, 8);
  assert.ok(["Studded Leather", "Scimitar", "Shortsword", "Longbow", "Arrows", "Dungeoneer's Pack"].every((n) => b.items.some((i) => i.name === n)));
  assert.equal(b.items.find((i) => i.name === "Arrows").qty, 20);
});

test("the subclass lists: four 2024 ones first, the older ones without a 2024 version after", () => {
  const new24 = subclassesFor("Fighter", "2024").map((s) => s.name);
  const old = subclassesFor("Fighter", "2014").map((s) => s.name);
  for(const s of FIGHTER_2024_SUBCLASSES){ assert.ok(new24.includes(s.name)); assert.ok(!old.includes(s.name)); }
  assert.ok(old.includes("Champion") && !new24.includes("Champion"));
  assert.ok(new24.includes("Samurai") && old.includes("Samurai"), "an older subclass stays open");
  assert.ok(classHasEdition("Fighter", "2024"));
});

test("switching: the subclass and the maneuvers follow, and back", () => {
  const c = fighter(5, "Battle Master", "");
  c.classes[0].options = { maneuvers: [{ id: "x", name: "Riposte", level: 3 }] };
  assert.equal(setClassEdition(c, "Fighter", true), true);
  assert.equal(c.classes[0].edition, "2024");
  assert.equal(c.classes[0].subclass, "Battle Master (2024)");
  assert.equal(c.classes[0].options.maneuvers2024[0].name, "Riposte");
  assert.equal(setClassEdition(c, "Fighter", false), true);
  assert.equal(c.classes[0].edition, undefined);
  assert.equal(c.classes[0].subclass, "Battle Master");
  assert.equal(c.classes[0].options.maneuvers[0].name, "Riposte");
  const s = fighter(5, "Samurai", "");
  setClassEdition(s, "Fighter", true);
  assert.equal(s.classes[0].subclass, "Samurai", "no 2024 version: it stays");
});

test("Champion: 19 then 18 crits, advantage on initiative and Athletics, Heroic Warrior at 10, Survivor at 18", () => {
  assert.deepEqual([3, 15].map((lv) => H.critRange(fighter(lv, "Champion (2024)"), sword)), [19, 18]);
  const c = fighter(3, "Champion (2024)");
  assert.equal(H.skillCheck(c, "Athletics").roll.mode, "adv");
  assert.equal(H.skillCheck(c, "Athletics").roll.reason, "Remarkable Athlete");
  assert.equal(H.skillCheck(c, "Stealth").roll.mode, "none");
  assert.equal(initiativeRollMode(c).mode, "adv");
  assert.equal(initiativeRollMode(fighter(3, "Battle Master (2024)")).mode, "none");
  assert.ok(names(c).includes("Remarkable Athlete"));
  assert.ok(!names(fighter(6, "Champion (2024)")).includes("Additional Fighting Style"));
  assert.ok(names(fighter(7, "Champion (2024)")).includes("Additional Fighting Style"));
  assert.ok(names(fighter(10, "Champion (2024)")).includes("Heroic Warrior"));
  const s = fighter(18, "Champion (2024)");
  s.hp.current = 90;
  assert.equal(H.survivorHeal(s).heal, 7, "5 + CON");
});

test("Battle Master: dice, 20 maneuvers from the book, Relentless no longer regains a die", () => {
  assert.deepEqual([3, 7, 15].map((lv) => res(fighter(lv, "Battle Master (2024)"), "Superiority Dice").max), [4, 5, 6]);
  assert.deepEqual([3, 10, 18].map((lv) => res(fighter(lv, "Battle Master (2024)"), "Superiority Dice").roll.die), [8, 10, 12]);
  const set = optionSetDef("maneuvers2024");
  assert.equal(set.options.length, 20);
  assert.deepEqual([3, 7, 10, 15].map((lv) => optionsKnownAt(set, lv)), [3, 5, 7, 9]);
  assert.ok(set.options.every((o) => !o.optional));
  assert.deepEqual(set.options.filter((o) => o.save).map((o) => o.name).sort(), ["Disarming Attack", "Goading Attack", "Menacing Attack", "Pushing Attack", "Trip Attack"]);
  const bm = fighter(15, "Battle Master (2024)");
  bm.resourcesUsed[res(bm, "Superiority Dice").key] = 6;
  assert.deepEqual(H.regainOnInitiative(bm), [], "the 2024 Relentless rolls a d8 instead");
  assert.equal(res(fighter(7, "Battle Master (2024)"), "Know Your Enemy").max, 1);
});

test("Eldritch Knight: third caster slots, 2 cantrips (3 at level 10), Int, any school", () => {
  const c = fighter(7, "Eldritch Knight (2024)");
  const slots = computeSpellSlots(c.classes).slots;
  assert.deepEqual([slots[1], slots[2], slots[3]], [4, 2, 0], "the book's level 7 row");
  assert.equal(computeSpellSlots(fighter(3, "Eldritch Knight (2024)").classes).slots[1], 2, "level 3: two level 1 slots");
  assert.ok(names(c).includes("War Bond") && names(c).includes("War Magic"));
  assert.ok(feature(c, "Spellcasting"));
  assert.equal(SUBCLASS_CASTERS["Fighter:Eldritch Knight (2024)"].schools, undefined, "any school");
  assert.deepEqual([3, 9, 10].map((lv) => SUBCLASS_CASTERS["Fighter:Eldritch Knight (2024)"].cantrips[lv]), [2, 2, 3]);
  assert.match(feature(fighter(18, "Eldritch Knight (2024)"), "War Magic").text, /level 1 or level 2/);
});

test("Psi Warrior: the book's dice table, one back on a short rest", () => {
  const table = { 3: [4, 6], 5: [6, 8], 9: [8, 8], 11: [8, 10], 13: [10, 10], 17: [12, 12] };
  for(const [lv, [count, die]] of Object.entries(table)){
    const r = res(fighter(Number(lv), "Psi Warrior (2024)"), "Psionic Energy Dice");
    assert.deepEqual([r.max, r.roll.die], [count, die], "level " + lv);
    const strike = H.psionicStrike(fighter(Number(lv), "Psi Warrior (2024)"));
    assert.deepEqual([strike.die, strike.left], [die, count], "strike at " + lv);
  }
  const c = fighter(9, "Psi Warrior (2024)");
  const key = res(c, "Psionic Energy Dice").key;
  c.resourcesUsed[key] = 8;
  H.restoreResources(c, "short");
  assert.equal(c.resourcesUsed[key], 7);
  assert.ok(feature(fighter(10, "Psi Warrior (2024)"), "Guarded Mind").resist.includes("psychic"));
});

test("wording: no long dashes or semicolons, reminders fit", () => {
  const LONG = /[\u2013\u2014]/;
  const check = (f) => {
    assert.ok(!LONG.test(f.name + f.text) && !f.text.includes(";"), f.name);
    if(f.remind) assert.ok(f.remind.line.length <= 84 && !f.remind.line.includes(";"), f.name + " reminder: " + f.remind.line.length);
  };
  FIGHTER_2024.level1.forEach(check);
  Object.values(FIGHTER_2024.features).flat().forEach(check);
  FIGHTER_2024_SUBCLASSES.forEach((s) => Object.values(s.features).flat().forEach(check));
  OPTION_SETS.find((s) => s.id === "maneuvers2024").options.forEach((o) => assert.ok(!LONG.test(o.text) && !o.text.includes(";"), o.name));
});
