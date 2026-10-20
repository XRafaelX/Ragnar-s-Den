/* Phase B of the 2026-10-14 review: monk combat and starting weapons.
   Checked against the published pages on 2026-10-15: Martial Arts ("You
   can roll a d4 in place of the normal damage of your unarmed strike or
   monk weapon", while unarmored and without a shield), the Basic Rules'
   unarmed strike (proficient, 1 + STR bludgeoning), the races' natural
   weapons, Tavern Brawler (a d4), and the "any ... weapon" starting
   equipment, now a weapon picker in the creation wizard. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as W from "../js/wizard/wizard-core.js";
import { buildEquipmentList } from "../js/wizard/steps-choices.js";
import { CLASSES_INFO } from "../js/data/classes.js";
import { RACE_DATA } from "../js/data/race-data.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
import { newCharacter } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  c.abilities = Object.assign({ str: 10, dex: 16, con: 12, int: 10, wis: 14, cha: 8 }, extra.abilities || {});
  Object.keys(extra).forEach((k) => { if(k !== "abilities") c[k] = extra[k]; });
  return c;
}
const staff = () => ({ id: "q", name: "Quarterstaff", type: "weapon", damageDice: "1d6", damageType: "Bludgeoning", ability: "str", proficient: true, equipped: true });
const LEATHER = { id: "l", name: "Leather", type: "armor", category: "light", baseAC: 11, equipped: true };
const SHIELD = { id: "s", name: "Shield", type: "armor", category: "shield", baseAC: 2, equipped: true };

/* ---- Martial Arts dice on monk weapons ---- */
test("monk weapons roll the Martial Arts die once it's bigger, never in armor or with a shield", () => {
  const dice = (lv, inv = [staff()], cls = "Monk") => H.weaponDamageDice(char([{ name: cls, level: lv }], { inventory: inv }), inv[0]);
  assert.deepEqual(dice(1), { qty: 1, die: 6, martialArts: false }, "d4 is smaller than a quarterstaff's d6");
  assert.deepEqual(dice(5), { qty: 1, die: 6, martialArts: false }, "a tie keeps the weapon's own");
  assert.deepEqual(dice(11), { qty: 1, die: 8, martialArts: true });
  assert.deepEqual(dice(17), { qty: 1, die: 10, martialArts: true });
  assert.deepEqual(dice(11, [staff(), LEATHER]), { qty: 1, die: 6, martialArts: false }, "in armor: no Martial Arts");
  assert.deepEqual(dice(11, [staff(), SHIELD]), { qty: 1, die: 6, martialArts: false }, "with a shield: none either");
  assert.deepEqual(dice(11, [staff()], "Fighter"), { qty: 1, die: 6, martialArts: false }, "not a monk");
  const greatsword = { name: "Greatsword", type: "weapon", damageDice: "2d6", equipped: true };
  assert.deepEqual(dice(17, [greatsword]), { qty: 2, die: 6, martialArts: false }, "not a monk weapon");
  assert.equal(H.weaponDamageDice(char([{ name: "Monk", level: 1 }]), { name: "Odd", damageDice: "" }), null);
});

/* ---- Unarmed strikes ---- */
test("unarmed strike: none for most characters; a monk's uses the Martial Arts die and DEX", () => {
  assert.equal(H.unarmedStrike(char([{ name: "Fighter", level: 5 }])), null, "a human fighter: nothing worth a card");
  const m1 = H.unarmedStrike(char([{ name: "Monk", level: 1 }]));
  assert.deepEqual([m1.name, m1.die, m1.ability, m1.attack, m1.bonus, m1.type], ["Unarmed strike", 4, "DEX", 3 + 2, 3, "Bludgeoning"]);
  assert.equal(H.unarmedStrike(char([{ name: "Monk", level: 11 }])).die, 8);
  // Strong monk: STR when it's better.
  assert.equal(H.unarmedStrike(char([{ name: "Monk", level: 1 }], { abilities: { str: 18, dex: 12 } })).ability, "STR");
  // In armor: no Martial Arts, so a plain 1 + STR.
  const armored = H.unarmedStrike(char([{ name: "Monk", level: 5 }], { inventory: [LEATHER] }));
  assert.deepEqual([armored.die, armored.ability, armored.bonus], [0, "STR", 0]);
});

test("unarmed strike: natural weapons, Tavern Brawler, a monk's die over its claws, rage", () => {
  const tabaxi = H.unarmedStrike(char([{ name: "Fighter", level: 1 }], { race: "Tabaxi", abilities: { str: 14 } }));
  assert.deepEqual([tabaxi.name, tabaxi.die, tabaxi.type, tabaxi.ability, tabaxi.bonus], ["Claws (unarmed strike)", 4, "Slashing", "STR", 2]);
  const bite = H.unarmedStrike(char([{ name: "Druid", level: 1 }], { race: "Lizardfolk" }));
  assert.deepEqual([bite.die, bite.type], [6, "Piercing"]);
  const brawler = H.unarmedStrike(char([{ name: "Fighter", level: 4 }], { feats: [{ id: "f", name: "Tavern Brawler" }] }));
  assert.deepEqual([brawler.die, brawler.type], [4, "Bludgeoning"]);
  // A minotaur monk 11: the Martial Arts d8 beats the horns' d6; still piercing.
  const horns = H.unarmedStrike(char([{ name: "Monk", level: 11 }], { race: "Minotaur" }));
  assert.deepEqual([horns.die, horns.type, horns.name], [8, "Piercing", "Horns (unarmed strike)"]);
  // A raging minotaur barbarian 9: +3 rage damage with STR.
  const rager = H.unarmedStrike(char([{ name: "Barbarian", level: 9 }], { race: "Minotaur", abilities: { str: 18 }, rage: { active: true, used: 1 } }));
  assert.equal(rager.bonus, 4 + 3);
  // Every race with natural weapons in the data, as published.
  const nat = Object.fromEntries(Object.entries(RACE_DATA).filter(([, d]) => d.unarmed).map(([n, d]) => [n, d.unarmed.name + " " + d.unarmed.die + " " + d.unarmed.type]));
  assert.deepEqual(nat, { Aarakocra: "Talons 4 Slashing", Centaur: "Hooves 4 Bludgeoning", Lizardfolk: "Bite 6 Piercing", Minotaur: "Horns 6 Piercing",
    Satyr: "Ram 4 Bludgeoning", Tabaxi: "Claws 4 Slashing", Tortle: "Claws 4 Slashing", Leonin: "Claws 4 Slashing", Dhampir: "Vampiric Bite 4 Piercing", Naga: "Bite 4 Piercing" });
  // A dhampir's bite uses Constitution.
  const fang = H.unarmedStrike(char([{ name: "Fighter", level: 1 }], { race: "Dhampir", abilities: { str: 10, con: 16 } }));
  assert.deepEqual([fang.ability, fang.bonus, fang.attack], ["CON", 3, 5]);
});

/* ---- Starting weapons ---- */
test("starting equipment: every 'any ... weapon' item is a real weapon that fits its pick", () => {
  let picks = 0;
  for(const [cls, info] of Object.entries(CLASSES_INFO)){
    if(!info.equipment) continue;
    const items = info.equipment.choiceGroups.flatMap((g) => g.options.flatMap((o) => o.items)).concat(info.equipment.fixed);
    items.forEach((it) => {
      if(it.type === "weapon") assert.ok(it.damageDice, cls + ": " + it.name + " has damage dice");
      if(!it.pick) return;
      picks++;
      const d = WEAPON_DATA[it.name];
      assert.ok(d && d.category === it.pick.category && (!it.pick.melee || !d.ranged), cls + ": " + it.name + " fits its own pick");
    });
    JSON.stringify(info.equipment).split("swap it on the sheet").length === 1 || assert.fail(cls + " still says swap it on the sheet");
  }
  assert.ok(picks >= 14, "about fifteen pickable starting weapons, got " + picks);
});

function wizardWith(t, choices, fn){
  let out;
  withFakeDom(t, () => {
    W.openWizard();
    Object.assign(W.wizardState, { name: "Gear", race: "Human", background: "Acolyte", alignment: "Neutral", abilityMethod: "pointbuy",
      abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 } }, choices);
    out = fn();
  });
  return out;
}
const groupWith = (cls, key) => CLASSES_INFO[cls].equipment.choiceGroups.findIndex((g) => g.options.some((o) => o.key === key));

test("wizard: a barbarian's 'any martial melee weapon' starts as a battleaxe and can be a glaive", (t) => {
  const gi = groupWith("Barbarian", "martial"), si = groupWith("Barbarian", "simple");
  const base = { classId: "Barbarian", equipment: { [gi]: "martial", [si]: "simple" } };
  const items = wizardWith(t, base, () => buildEquipmentList(CLASSES_INFO.Barbarian, W.wizardState.equipment));
  assert.ok(items.some((i) => i.name === "Battleaxe" && i.damageDice === "1d8") && items.some((i) => i.name === "Spear"), "no placeholders: real weapons by default");
  const picked = wizardWith(t, Object.assign({ equipmentPicks: { [gi + ":0"]: "Glaive", [si + ":0"]: "Javelin" } }, base),
    () => buildEquipmentList(CLASSES_INFO.Barbarian, W.wizardState.equipment));
  const glaive = picked.find((i) => i.name === "Glaive");
  assert.deepEqual([glaive.damageDice, glaive.damageType, glaive.ability], ["1d10", "Slashing", "str"]);
  assert.ok(picked.some((i) => i.name === "Javelin"));
  // A pick that doesn't fit (a longbow isn't a melee weapon) falls back to the default.
  const wrong = wizardWith(t, Object.assign({ equipmentPicks: { [gi + ":0"]: "Longbow" } }, base), () => buildEquipmentList(CLASSES_INFO.Barbarian, W.wizardState.equipment));
  assert.ok(wrong.some((i) => i.name === "Battleaxe"));
});

test("wizard: a druid's 'any simple weapon' may be one it can't use, and the sheet says so", (t) => {
  const gi = CLASSES_INFO.Druid.equipment.choiceGroups.findIndex((g) => g.options.some((o) => o.items.some((it) => it.pick && !it.pick.melee)));
  const opt = CLASSES_INFO.Druid.equipment.choiceGroups[gi].options.find((o) => o.items.some((it) => it.pick && !it.pick.melee));
  const c = wizardWith(t, { classId: "Druid", skillChoices: ["Arcana", "Nature"], equipment: { [gi]: opt.key }, equipmentPicks: { [gi + ":0"]: "Light Crossbow" },
    languageChoices: ["Elvish", "Dwarvish", "Giant"], spellChoices: { cantrips: [], spells: [] } }, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  const xbow = c.inventory.find((i) => i.name === "Light Crossbow");
  assert.ok(xbow, "the picked weapon is in the inventory");
  assert.equal(xbow.proficient, false, "druids aren't proficient with light crossbows");
  assert.equal(xbow.picked, undefined, "the wizard's marker is gone");
});

test("wizard: a ranger's two simple melee weapons are two separate picks", (t) => {
  const gi = groupWith("Ranger", "simple_melee");
  const items = wizardWith(t, { classId: "Ranger", equipment: { [gi]: "simple_melee" }, equipmentPicks: { [gi + ":1"]: "Mace" } },
    () => buildEquipmentList(CLASSES_INFO.Ranger, W.wizardState.equipment));
  assert.ok(items.some((i) => i.name === "Handaxe") && items.some((i) => i.name === "Mace"), "a handaxe and a mace");
});
