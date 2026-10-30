/* Class automation Phase 4, the Monk (2026-10-30): every feature checked
   against the books on 5etools' data, and what the sheet now does with the
   ones that were text only: the ki list on the Ki row, Diamond Soul, the
   effects, Deflect Missiles, Sun Bolts, Kensei weapons and Mastery of Death. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 10, dex: 18, con: 14, int: 10, wis: 16, cha: 8 };
function monk(sub, lv, extra = {}){
  const c = newCharacter("M");
  c.classes = [{ name: "Monk", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const action = (c, id) => H.kiActions(c).find((a) => a.id === id);
const ids = (c) => H.kiActions(c).map((a) => a.id);
const dcOf = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name).dcs[0].chip;
const ki = (c) => H.resourceLeft(c, "Monk:ki");
function known(c, names){
  c.classes[0].options = { disciplines: names.map((name, i) => ({ id: "d" + i, name })) };
  return c;
}
/* A Kensei with a longsword and a longbow chosen. */
function kensei(lv, inventory){
  const c = monk("Way of the Kensei", lv, { inventory });
  const g = CP.entryGrants(c.classes[0], false).find((x) => x.name === "Path of the Kensei");
  g.cl = c.classes[0];
  CP.applyClassPicks(c, g.cl, g, [["Longsword"], ["Longbow"]]);
  return c;
}
const SWORD = (extra = {}) => Object.assign({ id: "s", name: "Longsword", type: "weapon", equipped: true, ability: "str", proficient: true, magicBonus: 0, damageDice: "1d8", damageType: "Slashing" }, extra);
const BOW = { id: "b", name: "Longbow", type: "weapon", equipped: true, ability: "dex", proficient: true, magicBonus: 0, damageDice: "1d8", damageType: "Piercing" };

test("ki save DC: 8 + proficiency + WIS, on the feature cards too", () => {
  assert.equal(H.kiSaveDc(monk("Way of the Open Hand", 5)), 14);
  assert.equal(H.kiSaveDc(monk("Way of the Open Hand", 17)), 17);
  assert.equal(dcOf(monk("Way of the Open Hand", 5), "Stunning Strike"), "CON DC 14");
});

test("the ki list: nothing before 2nd level, then by level", () => {
  assert.deepEqual(H.kiActions(monk("", 1)), []);
  assert.deepEqual(ids(monk("", 2)), ["flurry", "patient", "step"]);
  assert.ok(ids(monk("", 5)).includes("stun"));
  assert.ok(!ids(monk("", 17)).includes("astral") && ids(monk("", 18)).includes("astral"), "Astral Projection at 18");
  assert.equal(action(monk("", 18), "astral").cost, 8);
});

test("Flurry of Blows names what the tradition adds", () => {
  assert.match(action(monk("Way of the Open Hand", 3), "flurry").detail, /DEX save \(DC 13\) or prone/);
  assert.match(action(monk("Way of the Drunken Master", 3), "flurry").detail, /Disengage action and \+10 feet/);
  assert.match(action(monk("Way of the Drunken Master", 17), "flurry").detail, /Up to five attacks/);
  assert.match(action(monk("Way of Mercy", 3), "flurry").detail, /One strike can be Hand of Healing for free/);
  assert.match(action(monk("Way of Mercy", 11), "flurry").detail, /Each strike can be Hand of Healing for free/);
});

test("Shadow Arts: four spells for 2 ki. Searing Arc Strike: up to half the monk level in ki", () => {
  const sh = H.kiActions(monk("Way of Shadow", 3)).filter((a) => a.group === "Shadow Arts");
  assert.deepEqual(sh.map((a) => [a.name, a.cost]), [["Darkness", 2], ["Darkvision", 2], ["Pass without Trace", 2], ["Silence", 2]]);
  const arc = (lv) => H.kiActions(monk("Way of the Sun Soul", lv)).filter((a) => a.group === "Searing Arc Strike");
  assert.deepEqual(arc(5), []);
  assert.deepEqual(arc(6).map((a) => [a.name, a.cost]), [["3d6 fire", 2], ["4d6 fire", 3]]);
  assert.equal(arc(20).at(-1).cost, 10);
  assert.equal(arc(20).at(-1).name, "11d6 fire");
});

test("Searing Sunburst: 0 to 3 ki. Touch of the Long Death: 2d10 per ki, 1 to 10", () => {
  const b = H.kiActions(monk("Way of the Sun Soul", 11)).filter((a) => a.group === "Searing Sunburst");
  assert.deepEqual(b.map((a) => [a.name, a.cost]), [["2d6 radiant", 0], ["4d6 radiant", 1], ["6d6 radiant", 2], ["8d6 radiant", 3]]);
  const l = H.kiActions(monk("Way of Long Death", 17)).filter((a) => a.group === "Touch of the Long Death");
  assert.equal(l.length, 10);
  assert.deepEqual([l[0].roll.qty, l[9].roll.qty, l[9].cost], [2, 20, 10]);
});

test("disciplines: what's known, with the DC, and the spell limit by monk level", () => {
  const list = (c, g) => H.kiActions(c).filter((a) => a.group === g);
  assert.deepEqual(ids(monk("Way of the Four Elements", 3)).filter((i) => /^disc/.test(i)), [], "Elemental Attunement costs no ki");
  // Below 5th the base cost only.
  const low = known(monk("Way of the Four Elements", 3), ["Sweeping Cinder Strike"]);
  assert.equal(H.kiActions(low).find((a) => /Sweeping/.test(a.id)).name, "Sweeping Cinder Strike");
  // 5th: up to 3 ki. 9th: 4. 13th: 5. 17th: 6.
  const top = (lv) => list(known(monk("Way of the Four Elements", lv), ["Sweeping Cinder Strike"]), "Sweeping Cinder Strike").at(-1);
  assert.deepEqual([5, 9, 13, 17].map((lv) => top(lv).cost), [3, 4, 5, 6]);
  assert.deepEqual([top(5).name, top(17).name], ["4d6 fire", "7d6 fire"]);
  // Not a spell: more dice for as much ki as is left.
  const whip = list(known(monk("Way of the Four Elements", 5), ["Water Whip"]), "Water Whip");
  assert.deepEqual(whip.map((a) => a.name), ["3d10 bludgeoning", "4d10 bludgeoning", "5d10 bludgeoning", "6d10 bludgeoning"]);
  assert.match(whip[0].detail, /^DEX save DC 14\./);
  // No dice, no raised spell: one entry.
  const fly = H.kiActions(known(monk("Way of the Four Elements", 11), ["Ride the Wind"])).find((a) => /Ride/.test(a.id));
  assert.deepEqual([fly.name, fly.cost, fly.group, fly.roll], ["Ride the Wind", 4, undefined, undefined]);
  // Clench of the North Wind: another target for each ki.
  assert.deepEqual(list(known(monk("Way of the Four Elements", 9), ["Clench of the North Wind"]), "Clench of the North Wind").map((a) => a.name), ["1 target", "2 targets"]);
  // Fangs of the Fire Snake: 1 ki, and 1 more on a hit for 1d10.
  const fangs = H.kiActions(known(monk("Way of the Four Elements", 3), ["Fangs of the Fire Snake"])).filter((a) => /Fangs/.test(a.id));
  assert.deepEqual(fangs.map((a) => a.cost), [1, 1]);
  assert.deepEqual([fangs[1].roll.qty, fangs[1].roll.die], [1, 10]);
});

test("paying: ki goes down, and what you can't afford says so", () => {
  const c = monk("Way of the Open Hand", 5);
  const stun = action(c, "stun");
  assert.ok(H.payKiAction(c, stun));
  assert.equal(ki(c), 4);
  c.resourcesUsed["Monk:ki"] = 5;
  assert.equal(H.kiActionProblem(c, action(c, "stun")), "Needs 1 ki");
  assert.equal(H.payKiAction(c, action(c, "stun")), false);
  assert.equal(ki(c), 0);
});

test("Breath of the Dragon: its own uses first, then 2 ki. Damage by level", () => {
  const c = monk("Way of the Ascendant Dragon", 5);
  const uses = H.resourceLeft(c, "Monk:breath_of_the_dragon");
  assert.equal(uses, 3);
  assert.equal(action(c, "breath").roll.qty, 2);
  assert.equal(action(monk("Way of the Ascendant Dragon", 11), "breath").roll.qty, 3);
  H.payKiAction(c, action(c, "breath"));
  assert.deepEqual([H.resourceLeft(c, "Monk:breath_of_the_dragon"), ki(c)], [2, 5], "a use, not ki");
  c.resourcesUsed["Monk:breath_of_the_dragon"] = 3;
  H.payKiAction(c, action(c, "breath"));
  assert.equal(ki(c), 3, "no uses left: 2 ki");
});

test("Hand of Ultimate Mercy: 5 ki and its use", () => {
  const c = monk("Way of Mercy", 17);
  H.payKiAction(c, action(c, "ultimate"));
  assert.deepEqual([ki(c), H.resourceLeft(c, "Monk:hand_of_ultimate_mercy")], [12, 0]);
  assert.equal(H.kiActionProblem(c, action(c, "ultimate")), "Used until a long rest");
});

test("Touch of Death: temporary HP don't stack", () => {
  const c = monk("Way of Long Death", 5);
  const a = action(c, "touch");
  assert.equal(a.temp, 8);
  H.payKiAction(c, a);
  assert.equal(c.hp.temp, 8);
  c.hp.temp = 20;
  H.payKiAction(c, a);
  assert.equal(c.hp.temp, 20);
});

test("Sharpen the Blade: +1 to +3 for attack and damage, not on a magic weapon, gone with a rest", () => {
  const sword = SWORD();
  const c = kensei(11, [sword]);
  const at = H.weaponAttackBonus(c, sword), dmg = H.weaponDamageBonus(c, sword);
  H.payKiAction(c, action(c, "sharpen2"));
  assert.deepEqual([H.weaponAttackBonus(c, sword), H.weaponDamageBonus(c, sword)], [at + 2, dmg + 2]);
  assert.equal(ki(c), 9);
  assert.ok(H.endAllEffects(c).includes("Sharpen the Blade"));
  assert.equal(H.weaponAttackBonus(c, sword), at);
  // No plain kensei weapon in hand.
  const magic = kensei(11, [SWORD({ magicBonus: 1 })]);
  assert.equal(H.kiActionProblem(magic, action(magic, "sharpen1")), "Hold a kensei weapon first");
  assert.equal(H.sharpenBonus(Object.assign(magic, { sharpen: { item: "s", bonus: 3 } }), magic.inventory[0]), 0);
});

test("Kensei weapons are what was picked, and count as monk weapons", () => {
  const c = kensei(3, [SWORD(), BOW]);
  assert.ok(H.isKenseiWeapon(c, c.inventory[0]) && H.isKenseiWeapon(c, c.inventory[1]));
  assert.ok(!H.isKenseiWeapon(c, { name: "Rapier", type: "weapon" }));
  assert.ok(H.isMonkWeaponFor(c, c.inventory[0]));
  assert.ok(!H.isKenseiWeapon(monk("Way of Shadow", 3, { inventory: [SWORD()] }), SWORD()));
});

test("Empty Body: invisible, resistance to all but force", () => {
  const c = monk("Way of the Open Hand", 18);
  assert.deepEqual(H.emptyBodyResistance(c), []);
  assert.ok(H.startEffect(c, "empty_body"));
  assert.equal(ki(c), 14);
  assert.equal(H.emptyBodyResistance(c)[0].type, "all damage but force");
  assert.ok(H.effectRolls(c, "attack").some((r) => r.mode === "adv" && /Empty Body/.test(r.reason)));
});

test("Shadow Step: the first melee attack only. Cloak of Shadows: any attack ends it", () => {
  const c = monk("Way of Shadow", 11);
  H.startEffect(c, "shadow_step");
  const dagger = { id: "d", name: "Dagger", type: "weapon", ability: "finesse", proficient: true };
  assert.equal(H.attackRollMode(c, dagger).mode, "adv");
  assert.equal(H.attackRollMode(c, BOW).mode, "none");
  assert.equal(H.unarmedStrike(c).roll.mode, "adv");
  assert.equal(H.attackEndsEffects(c, false), false, "a ranged attack doesn't use it");
  assert.equal(H.attackEndsEffects(c, true), true);
  assert.ok(!H.effectOn(c, "shadow_step"));
  H.startEffect(c, "cloak_of_shadows");
  assert.equal(H.attackRollMode(c, BOW).mode, "adv");
  assert.equal(H.attackEndsEffects(c, false), true);
  assert.ok(!H.effectOn(c, "cloak_of_shadows"));
});

test("Agile Parry: +2 AC", () => {
  const c = kensei(3, [SWORD()]);
  const ac = H.computeArmorClass(c).value;
  H.startEffect(c, "agile_parry");
  const on = H.computeArmorClass(c);
  assert.equal(on.value, ac + 2);
  assert.match(on.breakdown, /Agile Parry/);
});

test("Radiant Sun Bolt: DEX + proficiency, the Martial Arts die, ranged", () => {
  assert.deepEqual(H.sunBolts(monk("Way of Shadow", 3)), []);
  const b = H.sunBolts(monk("Way of the Sun Soul", 5))[0];
  assert.deepEqual([b.attack, b.die, b.bonus, b.type, b.ranged], [7, 6, 4, "Radiant", true]);
  assert.equal(H.sunBolts(monk("Way of the Sun Soul", 17))[0].die, 10);
});

test("Ki-Empowered Strikes: magic from 6th", () => {
  assert.ok(!H.unarmedStrike(monk("", 5)).parts.includes("Magic"));
  assert.ok(H.unarmedStrike(monk("", 6)).parts.includes("Magic"));
});

test("resources: Wholeness of Body heals 3 x level, Perfect Self gives 4 ki back on initiative", () => {
  const r = (c, k) => H.characterResources(c).find((x) => x.key === k);
  assert.equal(r(monk("Way of the Open Hand", 6), "Monk:wholeness_of_body").heal, 18);
  assert.equal(r(monk("", 19), "Monk:ki").initiativeRegain, 0);
  const c = monk("", 20);
  assert.equal(r(c, "Monk:ki").initiativeRegain, 4);
  c.resourcesUsed["Monk:ki"] = 20;
  H.regainOnInitiative(c);
  assert.equal(ki(c), 4);
});

test("the Ki row shows the save DC", () => {
  const hint = H.characterResources(monk("", 5)).find((x) => x.key === "Monk:ki").hint;
  assert.equal(hint, "Your ki save DC is 14.");
});

test("Purity of Body: immune to poison and the poisoned condition", () => {
  const w = H.raceWards(monk("", 10));
  assert.ok(w.immune.some((r) => r.type === "poison"));
  assert.ok(w.conditionImmune.some((r) => r.type === "poisoned"));
});
