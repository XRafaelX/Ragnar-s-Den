/* Class automation Phase 1, the Barbarian (2026-10-29): every feature
   checked against the books on 5etools' data, and what the sheet now does
   with the ones that were text only. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { WILD_SURGES } from "../js/data/effects.js";

const ABIL = { str: 18, dex: 14, con: 16, int: 8, wis: 12, cha: 10 };
function barb(sub, lv, extra = {}){
  const c = newCharacter("B");
  c.classes = [{ name: "Barbarian", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 10 * lv, current: 10 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const axe = { id: "ga", name: "Greataxe", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, magicBonus: 0, damageDice: "1d12", damageType: "Slashing", notes: "heavy, two-handed" };
const seq = (...v) => { let i = 0; return () => v[i++]; };

test("save DCs on feature cards: Intimidating Presence, Mighty Impel, Infectious Fury", () => {
  const dcOf = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name).dcs[0];
  const b = barb("Path of the Berserker", 10);
  assert.deepEqual([dcOf(b, "Intimidating Presence").chip, dcOf(b, "Intimidating Presence").line], ["WIS DC 12", "Wisdom save DC 12 (8 + proficiency +4 + Charisma +0)."]);
  assert.match(H.getAllCharacterFeatures(b).find((f) => f.name === "Intimidating Presence").text, /Wisdom save DC 12/);
  assert.equal(dcOf(barb("Path of the Giant", 10), "Mighty Impel").chip, "STR DC 16");
  assert.equal(dcOf(barb("Path of the Beast", 10), "Infectious Fury").chip, "WIS DC 15");
  assert.equal(dcOf(barb("Path of Wild Magic", 3), "Wild Surge").chip, "DC 13", "its effects ask for different saves");
});

test("Reckless Attack: advantage on Strength melee weapon attacks, and Reckless Abandon's temporary HP", () => {
  const c = barb("Path of the Battlerager", 6, { inventory: [axe] });
  assert.equal(H.attackRollMode(c, axe).mode, "none");
  assert.ok(H.startEffect(c, "reckless_attack"));
  assert.deepEqual([H.attackRollMode(c, axe).mode, H.attackRollMode(c, axe).reason], ["adv", "Reckless Attack"]);
  assert.equal(c.hp.temp, 0, "Reckless Abandon only while raging");
  H.endEffect(c, "reckless_attack");
  H.startRage(c);
  H.startEffect(c, "reckless_attack");
  assert.equal(c.hp.temp, 3, "CON modifier");
  H.endRage(c);
  assert.equal(c.hp.temp, 0, "they vanish with the rage");
  const bow = { id: "lb", name: "Longbow", type: "weapon", equipped: true, ability: "dex", proficient: true, damageDice: "1d8", damageType: "Piercing", notes: "" };
  H.startEffect(c, "reckless_attack");
  assert.equal(H.attackRollMode(c, bow).mode, "none", "not a ranged attack");
});

test("Brutal Critical and critical hits; Indomitable Might", () => {
  assert.deepEqual([8, 9, 13, 17].map((lv) => H.brutalCriticalDice(barb("Path of the Berserker", lv))), [0, 1, 2, 3]);
  const c = barb("Path of the Berserker", 13);
  assert.deepEqual(H.criticalDamage(c, { qty: 1, die: 12, bonus: 4, melee: true }), { qty: 4, die: 12, bonus: 4, brutal: 2 });
  assert.deepEqual(H.criticalDamage(c, { qty: 1, die: 8, bonus: 4, melee: false }), { qty: 2, die: 8, bonus: 4, brutal: 0 }, "ranged: no Brutal Critical");
  assert.equal(H.indomitableMight(barb("Path of the Berserker", 17)), 0);
  assert.equal(H.indomitableMight(barb("Path of the Berserker", 18)), 18);
});

test("Relentless Rage: the CON save at 0 HP, DC 10 then 15, back to 10 after a rest", () => {
  const c = barb("Path of the Berserker", 11);
  assert.equal(H.rageAtZero(c), false, "not raging: nothing");
  H.startRage(c);
  c.hp.current = 0;
  assert.equal(H.rageAtZero(c), true);
  assert.equal(H.relentlessRageDc(c), 10);
  assert.equal(H.activeConditions(c).some((x) => x.def.id === "unconscious"), false, "not unconscious while the save waits");
  assert.equal(H.resolveRelentlessRage(c, 12), "up");
  assert.deepEqual([c.hp.current, c.rage.active, H.relentlessRageDc(c)], [1, true, 15]);
  c.hp.current = 0; H.rageAtZero(c);
  assert.equal(H.resolveRelentlessRage(c, 12), "down");
  assert.equal(H.relentlessRageDc(c), 20);
  assert.equal(H.relentlessRageDc(barb("Path of the Berserker", 10)), 0, "from barbarian 11");
});

test("Frenzy, Mindless Rage and Fanatical Focus", () => {
  const b = barb("Path of the Berserker", 6);
  assert.equal(H.canFrenzy(b), false);
  H.startRage(b);
  assert.equal(H.canFrenzy(b), true);
  b.rage.frenzy = true;
  assert.ok(H.ragePerks(b).some((p) => /Frenzy/.test(p)) && H.ragePerks(b).includes("Can't be charmed or frightened"));
  H.addCondition(b, "frightened");
  assert.equal(H.rageSuspends(b, "frightened"), "Mindless Rage");
  assert.ok(!H.hasCondition(b, "frightened"), "suspended while raging");
  assert.deepEqual(H.endRage(b), ["Frenzy: 1 level of exhaustion"]);
  assert.equal(b.exhaustion, 1);
  assert.ok(H.hasCondition(b, "frightened"), "back once the rage ends");
  const z = barb("Path of the Zealot", 6);
  assert.equal(H.fanaticalFocusReady(z), false);
  H.startRage(z);
  assert.equal(H.fanaticalFocusReady(z), true);
  z.rage.fanatical = true;
  assert.equal(H.fanaticalFocusReady(z), false, "once per rage");
  H.endRage(z); H.startRage(z);
  assert.equal(H.fanaticalFocusReady(z), true, "a new rage, a new reroll");
});

test("Rage Beyond Death: conscious at 0 HP while raging", () => {
  const z = barb("Path of the Zealot", 14);
  H.startRage(z);
  z.hp.current = 0;
  assert.equal(H.rageAtZero(z), true);
  delete z.rage.relentless;
  assert.equal(H.rageBeyondDeath(z), true);
  assert.ok(!H.activeConditions(z).some((x) => x.def.id === "unconscious"));
  H.endRage(z);
  assert.ok(H.activeConditions(z).some((x) => x.def.id === "unconscious"), "unconscious once the rage ends");
});

test("Wild Surge: a d8 when the rage starts, Controlled Surge's choice, Protective lights' AC", () => {
  const w = barb("Path of Wild Magic", 3);
  const ac = H.computeArmorClass(w).value ?? H.computeArmorClass(w);
  assert.deepEqual(H.startRage(w, seq(1, 7)), ["Wild Surge 1: Shadowy tendrils, 7 temporary HP"]);
  assert.equal(w.hp.temp, 7);
  assert.equal(H.wildSurgeNow(w).name, "Shadowy tendrils");
  assert.equal(H.wildSurgeDc(w), 13);
  H.endRage(w);
  H.startRage(w, seq(6));
  const ac2 = H.computeArmorClass(w).value ?? H.computeArmorClass(w);
  assert.equal(ac2, ac + 1, "Protective lights: +1 AC");
  H.endRage(w);
  assert.equal(H.wildSurgeNow(w), null);
  const w14 = barb("Path of Wild Magic", 14);
  H.startRage(w14, seq(3, 8));
  assert.deepEqual(w14.rage.surgeChoice, [3, 8]);
  assert.equal(H.chooseWildSurge(w14, 8), "Wild Surge 8: Bolt of light");
  H.endRage(w14); H.startRage(w14, seq(4, 4));
  assert.equal(w14.rage.surgeChoice.length, 8, "the same number twice: any effect");
  assert.equal(WILD_SURGES.length, 8);
  WILD_SURGES.forEach((s) => assert.ok(!/[;–—]/.test(s.text), s.name));
});

test("Form of the Beast, Infectious Fury's uses, Call the Hunt", () => {
  const b = barb("Path of the Beast", 14);
  assert.deepEqual(H.barbarianNaturalWeapons(b), []);
  H.startRage(b);
  assert.equal(H.beastFormDue(b), true);
  H.chooseBeastForm(b, "Claws");
  const w = H.barbarianNaturalWeapons(b)[0];
  assert.deepEqual([w.name, w.die, w.type, w.attack, w.bonus, w.parts.includes("magical")], ["Claws", 6, "Slashing", 9, 7, true], "STR +4, proficiency +5, rage +3");
  assert.equal(H.callTheHuntMax(b), 3);
});

test("Elemental Cleaver, Crushing Throw, Storm Aura and Storm Soul, armor spikes", () => {
  const g = barb("Path of the Giant", 14, { inventory: [axe] });
  assert.equal(H.elementalCleaver(g), null, "only while raging");
  H.startRage(g);
  H.setElementalCleaver(g, "ga", "Fire");
  assert.deepEqual(H.elementalCleaver(g, axe), { item: "ga", type: "Fire", dice: 2 });
  assert.ok(H.ragePerks(g).includes("Large or Huge, reach +10 ft"));
  const hand = { id: "ha", name: "Handaxe", type: "weapon", equipped: true, ability: "str", proficient: true, damageDice: "1d6", damageType: "Slashing", notes: "light, thrown (20/60)" };
  g.inventory.push(hand);
  assert.equal(H.thrownAttack(g, hand), null, "Crushing Throw: the thrown attack keeps rage damage, so it's the same as in melee");
  const s = barb("Path of the Storm Herald", 14);
  s.classes[0].options = { stormEnvironment: [{ name: "Desert" }] };
  assert.deepEqual(H.stormSoulResistances(s), [{ type: "fire", source: "Storm Soul" }]);
  assert.equal(H.stormAura(s), null, "only while raging");
  H.startRage(s);
  assert.deepEqual([H.stormAura(s).env, H.stormAura(s).step, H.stormAura(s).dc, H.stormAura(s).ragingStorm], ["Desert", 4, 16, 7]);
  const br = barb("Path of the Battlerager", 3, { inventory: [{ id: "sa", name: "Spiked Armor", type: "armor", category: "medium", baseAC: 14, equipped: true }] });
  H.startRage(br);
  assert.deepEqual(H.barbarianNaturalWeapons(br).map((x) => x.name + " 1d" + x.die), ["Armor spikes 1d4"]);
});
