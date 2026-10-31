/* Class automation Phase 2, the Fighter (2026-10-30): every feature
   checked against the books on 5etools' data (and the Gunslinger PDF), and
   what the sheet now does with the ones that were text only. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as COMP from "../js/core/companions.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 16, dex: 14, con: 14, int: 12, wis: 16, cha: 10 };
function fighter(sub, lv, extra = {}){
  const c = newCharacter("F");
  c.classes = [{ name: "Fighter", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 10 * lv, current: 10 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const sword = { id: "ls", name: "Longsword", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, damageDice: "1d8", damageType: "Slashing", notes: "" };
const revolver = { id: "rv", name: "Revolver", type: "weapon", qty: 1, equipped: true, ability: "dex", proficient: true, damageDice: "1d10", damageType: "Piercing", notes: "" };

test("critical range: Improved and Superior Critical, Vicious Intent with firearms", () => {
  assert.equal(H.critRange(fighter("Battle Master", 15), sword), 20);
  assert.equal(H.critRange(fighter("Champion", 3), sword), 19);
  assert.equal(H.critRange(fighter("Champion", 15), sword), 18);
  assert.equal(H.critRange(fighter("Gunslinger", 18), revolver), 19);
  assert.equal(H.critRange(fighter("Gunslinger", 18), sword), 20, "only with a firearm");
});

test("regained on initiative: Relentless, Tireless Spirit, Ever-Ready Shot, Legion of One", () => {
  const bm = fighter("Battle Master", 15, { resourcesUsed: { "Fighter:superiority_dice": 6 } });
  assert.deepEqual(H.regainOnInitiative(bm), ["Superiority Dice"]);
  assert.equal(bm.resourcesUsed["Fighter:superiority_dice"], 5);
  assert.deepEqual(H.regainOnInitiative(bm), [], "only when none are left");
  assert.deepEqual(H.regainOnInitiative(fighter("Battle Master", 14, { resourcesUsed: { "Fighter:superiority_dice": 5 } })), [], "from fighter 15");
  assert.deepEqual(H.regainOnInitiative(fighter("Samurai", 10, { resourcesUsed: { "Fighter:fighting_spirit": 3 } })), ["Fighting Spirit"]);
  assert.deepEqual(H.regainOnInitiative(fighter("Arcane Archer", 15, { resourcesUsed: { "Fighter:arcane_shot": 2 } })), ["Arcane Shot"]);
  assert.deepEqual(H.regainOnInitiative(fighter("Echo Knight", 18, { resourcesUsed: { "Fighter:unleash_incarnation": 2 } })), ["Unleash Incarnation"]);
});

test("superiority dice roll the die for the level; Protective Field adds INT", () => {
  assert.deepEqual([3, 10, 18].map((lv) => res(fighter("Battle Master", lv), "Superiority Dice").roll.die), [8, 10, 12]);
  const pf = res(fighter("Psi Warrior", 11), "Psionic Energy Dice").roll;
  assert.deepEqual([pf.die, pf.bonus, pf.button], [10, 1, "Protective Field"]);
});

test("Persuasion: Elegant Courtier's WIS, Royal Envoy's doubled proficiency", () => {
  const s = fighter("Samurai", 7);
  assert.equal(H.skillCheck(s, "Persuasion").value, 3, "CHA +0, WIS +3, not proficient");
  const b = fighter("Banneret (Purple Dragon Knight)", 7);
  b.skillProfs.Persuasion = { prof: true, expertise: false };
  assert.equal(H.skillCheck(b, "Persuasion").value, 6, "CHA +0, proficiency +3 doubled");
  assert.match(H.skillCheck(b, "Persuasion").breakdown, /doubled by Royal Envoy/);
});

test("Extra Attack: attacks per Attack action", () => {
  assert.deepEqual([4, 5, 11, 20].map((lv) => H.attacksPerAction(fighter("Champion", lv))), [1, 2, 3, 4]);
});

test("bonus-action attacks for the Attacks box: off-hand, Martial Arts, Polearm Master, Crossbow Expert, Frenzy", () => {
  const gear = (name, extra = {}) => Object.assign({ id: name, name, type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, notes: "" }, extra);
  assert.deepEqual(H.bonusActionAttacks(fighter("Champion", 5, { inventory: [sword] })), [], "one weapon, no feats: none");
  const dual = H.bonusActionAttacks(fighter("Champion", 1, { inventory: [gear("Shortsword"), gear("Handaxe")] }));
  assert.deepEqual(dual, ["Off-hand attack with your Handaxe"]);
  const pam = fighter("Champion", 4, { inventory: [gear("Glaive")], feats: [{ id: "p", name: "Polearm Master" }] });
  assert.match(H.bonusActionAttacks(pam)[0], /Polearm Master/);
  pam.inventory[0].equipped = false;
  assert.deepEqual(H.bonusActionAttacks(pam), [], "only with the polearm in hand");
  const cbe = fighter("Champion", 4, { inventory: [gear("Hand Crossbow", { ability: "dex" })], feats: [{ id: "x", name: "Crossbow Expert" }] });
  assert.match(H.bonusActionAttacks(cbe)[0], /Crossbow Expert/);
  const monk = (lv) => fighter("", lv, { classes: [{ name: "Monk", level: lv }] });
  assert.deepEqual(H.bonusActionAttacks(monk(1)), ["An unarmed strike (Martial Arts)"]);
  assert.match(H.bonusActionAttacks(monk(2))[0], /Flurry of Blows/);
  const berserk = fighter("", 3, { classes: [{ name: "Barbarian", subclass: "Path of the Berserker", level: 3 }], rage: { active: true, frenzy: true } });
  assert.deepEqual(H.bonusActionAttacks(berserk), ["A melee weapon attack (Frenzy)"]);
});

test("firearms: misfire and reload, the repair check", () => {
  assert.deepEqual(H.firearmStats(revolver), { misfire: 1, reload: 4 });
  assert.deepEqual(H.firearmStats(Object.assign({}, revolver, { proficient: false })), { misfire: 2, reload: 4 }, "+1 misfire without proficiency");
  assert.equal(H.firearmStats(sword), null);
  const g = fighter("Gunslinger", 10);
  const fix = H.firearmRepair(g, revolver);
  assert.deepEqual([fix.dc, fix.proficient, fix.bonus], [9, true, 6], "DEX +2 beats INT +1, tinker's tools from Gunsmith +4");
});

test("Second Wind, Rallying Cry, Survivor, and what Action Surge brings", () => {
  assert.deepEqual(H.secondWind(fighter("Champion", 5)), { die: 10, bonus: 5, rally: 0 });
  assert.deepEqual(H.secondWind(fighter("Banneret (Purple Dragon Knight)", 5)), { die: 10, bonus: 5, rally: 5 });
  const ch = fighter("Champion", 18);
  assert.deepEqual(H.survivorHeal(ch), { heal: 7, due: false });
  ch.hp.current = 80;
  assert.equal(H.survivorHeal(ch).due, true);
  assert.match(res(fighter("Eldritch Knight", 15), "Action Surge").hint, /Arcane Charge/);
  assert.match(res(fighter("Banneret (Purple Dragon Knight)", 18), "Action Surge").hint, /Inspiring Surge: two allies/);
});

test("Giant's Might and Fighting Spirit as Active effects", () => {
  const rk = fighter("Rune Knight", 10, { inventory: [sword] });
  assert.equal(H.giantsMightDie(rk), 0);
  assert.ok(H.startEffect(rk, "giants_might"));
  assert.equal(H.giantsMightDie(rk), 8, "1d8 from fighter 10");
  assert.equal(H.checkRollMode(rk, "str").mode, "adv");
  const sam = fighter("Samurai", 15, { inventory: [sword] });
  assert.ok(H.startEffect(sam, "fighting_spirit"));
  assert.equal(sam.hp.temp, 15);
  assert.deepEqual([H.attackRollMode(sam, sword).mode, H.attackRollMode(sam, sword).reason], ["adv", "Fighting Spirit"]);
});

test("Psi Warrior: Psionic Strike, Telekinetic Thrust's DC, Guarded Mind", () => {
  const p = fighter("Psi Warrior", 11);
  assert.deepEqual([H.psionicStrike(p).die, H.psionicStrike(p).bonus, H.psionicStrike(p).left, H.psionicStrike(p).thrustDc], [10, 1, 8, 13]);
  assert.deepEqual(H.featureResistances(p), [{ type: "psychic", source: "Guarded Mind" }]);
  const dc = H.getAllCharacterFeatures(p).find((f) => f.name === "Telekinetic Adept").dcs[0];
  assert.equal(dc.chip, "STR DC 13");
});

test("Echo Knight's echo, Arcane Archer's Magic Arrow", () => {
  const e = COMP.characterCompanions(fighter("Echo Knight", 18)).find((x) => x.def.id === "echo");
  assert.deepEqual([e.stats.ac, e.stats.hp, e.stats.count], [20, 1, 2]);
  assert.ok(e.stats.traits.some((t) => t.name === "Echo Avatar") && e.stats.traits.some((t) => t.name === "Legion of One"));
  assert.equal(COMP.characterCompanions(fighter("Echo Knight", 3)).find((x) => x.def.id === "echo").stats.count, 1);
  const bow = { id: "lb", name: "Longbow", type: "weapon" };
  assert.equal(H.magicArrows(fighter("Arcane Archer", 7), bow), true);
  assert.equal(H.magicArrows(fighter("Arcane Archer", 6), bow), false);
});
