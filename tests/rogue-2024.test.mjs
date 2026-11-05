/* The 2024 Rogue (2026-11-05, Phase 7 of the 2024 Player's Handbook):
   checked against the printed book, pp. 128 to 136. A class entry's edition
   "2024" swaps in the features, kit, proficiencies, Weapon Mastery picks,
   Cunning Strike and the four 2024 subclasses. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { ROGUE_2024, ROGUE_2024_SUBCLASSES } from "../js/data/rogue-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { classEdition, subclassesFor, computeSpellSlots } from "../js/core/class-features.js";
import { initiativeRollMode, attackRollMode, reliableTalent } from "../js/core/checks.js";
import { computeSpeed, computeSave } from "../js/core/vitals.js";
import { attunementLimit } from "../js/core/magic-items.js";
import { SUBCLASS_CASTERS } from "../js/data/spells-known.js";

const ABIL = { str: 10, dex: 18, con: 14, int: 14, wis: 12, cha: 10 };
function rogue(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("R");
  const cl = { name: "Rogue", subclass: sub, level: lv };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const feature = (c, name) => H.classFeatureList(c.classes[0]).find((f) => f.name === name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const kit = { id: "k", name: "Poisoner's Kit", qty: 1 };
const effectNames = (c) => H.cunningStrike(c).options.map((o) => o.name);

test("the 2014 rogue is unchanged without an edition", () => {
  const c = rogue(20, "Thief", "");
  assert.ok(names(c).includes("Blindsense") && !names(c).includes("Cunning Strike") && !names(c).includes("Weapon Mastery"));
  assert.equal(H.cunningStrike(c), null);
  assert.ok(!reliableTalent(rogue(10, "", "")) && reliableTalent(rogue(11, "", "")));
  assert.equal(H.soulknifeDie(rogue(5, "Soulknife", "")).left, 6, "twice the proficiency bonus");
  const off = rogue(3, "", "");
  H.startEffect(off, "steady_aim");
  assert.ok(!H.effectOn(off, "steady_aim") , "Steady Aim is a Tasha's option there");
  assert.equal(H.isProficientWithWeapon(off, "Scimitar", "martial"), false);
});

test("the features arrive at the book's levels (p. 129)", () => {
  const at = (lv) => names(rogue(lv));
  assert.ok(["Expertise", "Sneak Attack", "Thieves' Cant", "Weapon Mastery"].every((n) => at(1).includes(n)));
  assert.ok(at(2).includes("Cunning Action") && !at(1).includes("Cunning Action"));
  assert.ok(at(3).includes("Steady Aim") && !at(2).includes("Steady Aim"));
  assert.ok(["Cunning Strike", "Uncanny Dodge"].every((n) => at(5).includes(n)) && !at(4).includes("Cunning Strike"));
  assert.ok(["Evasion", "Reliable Talent"].every((n) => at(7).includes(n)) && !at(6).includes("Evasion"));
  assert.ok(at(11).includes("Improved Cunning Strike") && !at(10).includes("Improved Cunning Strike"));
  assert.ok(at(14).includes("Devious Strikes") && !at(13).includes("Devious Strikes"));
  assert.ok(at(15).includes("Slippery Mind") && !at(14).includes("Slippery Mind"));
  assert.ok(at(18).includes("Elusive") && !at(17).includes("Elusive"));
  assert.ok(at(19).includes("Epic Boon") && at(20).includes("Stroke of Luck") && !at(19).includes("Stroke of Luck"));
  assert.ok(!at(20).includes("Blindsense"), "gone in 2024");
  for(const n of ["Expertise", "Sneak Attack"]) assert.equal(at(20).filter((x) => x === n).length, 1, n);
});

test("the Sneak Attack column (p. 129)", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9, 11, 13, 15, 17, 19, 20].map((lv) => H.sneakAttack(rogue(lv)).dice), [1, 1, 2, 2, 3, 5, 6, 7, 8, 9, 10, 10]);
});

test("proficiencies: martial weapons with Finesse or Light, and the skills", () => {
  const c = rogue(1);
  for(const w of ["Rapier", "Scimitar", "Shortsword", "Whip", "Hand Crossbow"]) assert.ok(H.isProficientWithWeapon(c, w, "martial"), w);
  for(const w of ["Longsword", "Greatsword", "Longbow"]) assert.ok(!H.isProficientWithWeapon(c, w, "martial"), w);
  assert.ok(H.isProficientWithWeapon(c, "Dagger", "simple"));
  assert.ok(!ROGUE_2024.skillChoices.options.includes("Performance"), "not on the 2024 list");
  assert.equal(ROGUE_2024.skillChoices.options.length, 10);
  assert.equal(ROGUE_2024.skillChoices.count, 4);
});

test("Weapon Mastery: two kinds it's proficient with", () => {
  const pick = classEdition({ name: "Rogue", edition: "2024" }).level1.find((f) => f.name === "Weapon Mastery").profs.pick[0];
  assert.equal(pick.count, 2);
  const c = rogue(1);
  const cat = (k) => (["Rapier", "Scimitar", "Shortsword", "Whip", "Hand Crossbow"].includes(k) ? "martial" : "simple");
  for(const k of pick.options) assert.ok(H.isProficientWithWeapon(c, k, cat(k)), k);
  for(const k of ["Dagger", "Shortbow", "Rapier"]) assert.ok(pick.options.includes(k), k);
  assert.ok(!pick.options.includes("Longsword"));
});

test("Expertise: two skills at 1 and 6, no thieves' tools", () => {
  const ed = classEdition({ name: "Rogue", edition: "2024" });
  assert.equal(ed.choices[0].count, 2);
  assert.ok(!ed.choices[0].tools);
  assert.equal(ed.features[6][0].profs.pick[0].count, 2);
  assert.ok(!ed.features[6][0].profs.pick[0].tools);
});

test("Cunning Strike: the book's effects, costs and DC", () => {
  assert.equal(H.cunningStrike(rogue(4)), null);
  const c = rogue(5);
  assert.deepEqual(effectNames(c), ["Poison", "Trip", "Withdraw"]);
  const cs = H.cunningStrike(c);
  assert.equal(cs.picks, 1);
  assert.equal(cs.dc, 8 + 4 + 3);
  assert.deepEqual(cs.options.map((o) => o.cost), [1, 1, 1]);
  assert.match(cs.options[0].line, /DC 15 Constitution/);
  assert.match(cs.options[1].line, /DC 15 Dexterity/);
  assert.equal(H.cunningStrike(rogue(11)).picks, 2);
  assert.equal(H.cunningStrike(rogue(10)).picks, 1);
  const top = H.cunningStrike(rogue(14)).options;
  assert.deepEqual(top.map((o) => [o.name, o.cost]), [["Poison", 1], ["Trip", 1], ["Withdraw", 1], ["Daze", 2], ["Obscure", 3], ["Knock Out", 6]]);
  assert.ok(!effectNames(rogue(13)).includes("Daze"));
});

test("Poison needs a Poisoner's Kit, which an Assassin has", () => {
  const poison = (c) => H.cunningStrike(c).options.find((o) => o.name === "Poison");
  assert.match(poison(rogue(5)).blocked, /Poisoner's Kit/);
  assert.equal(poison(rogue(5, "", "2024", { inventory: [kit] })).blocked, "");
  assert.equal(poison(rogue(5, "Assassin (2024)")).blocked, "");
  assert.ok(poison(rogue(13, "Assassin (2024)")).envenom);
  assert.ok(!poison(rogue(12, "Assassin (2024)")).envenom);
  assert.match(poison(rogue(13, "Assassin (2024)")).line, /2d6 poison/);
});

test("Reliable Talent at 7, Slippery Mind's two saves, Stroke of Luck's hint", () => {
  assert.ok(!reliableTalent(rogue(6)) && reliableTalent(rogue(7)));
  assert.equal(computeSave(rogue(14), "wis").prof, false);
  const c = rogue(15);
  assert.ok(computeSave(c, "wis").prof && computeSave(c, "cha").prof);
  assert.match(res(rogue(20), "Stroke of Luck").hint, /d20 test/);
  assert.doesNotMatch(res(rogue(20, "", ""), "Stroke of Luck").hint, /d20 test/);
});

test("Steady Aim is everyone's, and its speed 0 goes with Roving Aim", () => {
  const c = rogue(3);
  H.startEffect(c, "steady_aim");
  assert.ok(H.effectOn(c, "steady_aim"));
  assert.equal(computeSpeed(c).value, 0);
  const a = rogue(9, "Assassin (2024)");
  H.startEffect(a, "steady_aim");
  assert.equal(computeSpeed(a).value, 30);
  const before = rogue(8, "Assassin (2024)");
  H.startEffect(before, "steady_aim");
  assert.equal(computeSpeed(before).value, 0);
});

test("the subclasses swap, and older ones stay open", () => {
  const now = subclassesFor("Rogue", "2024").map((s) => s.name);
  const old = subclassesFor("Rogue", "2014").map((s) => s.name);
  for(const s of ROGUE_2024_SUBCLASSES) assert.ok(now.includes(s.name) && !old.includes(s.name), s.name);
  for(const [a, b] of Object.entries(ROGUE_2024.swaps)){
    assert.ok(old.includes(a) && !now.includes(a), a);
    const c = rogue(5, a, "");
    setClassEdition(c, "Rogue", true);
    assert.equal(c.classes[0].subclass, b);
    setClassEdition(c, "Rogue", false);
    assert.equal(c.classes[0].subclass, a);
  }
  assert.ok(now.includes("Swashbuckler") && now.includes("Phantom"));
});

test("Assassin: initiative, first round's advantage and damage, Death Strike", () => {
  const S = "Assassin (2024)";
  const c = rogue(5, S);
  assert.equal(initiativeRollMode(c).mode, "adv");
  const blade = { id: "d", name: "Dagger", type: "weapon", qty: 1, equipped: true, ability: "finesse", proficient: true, damageDice: "1d4", damageType: "Piercing", notes: "finesse, light" };
  assert.equal(attackRollMode(c, blade).mode, "none");
  assert.equal(H.surprisingStrikes(c), 0);
  H.startEffect(c, "assassinate_2024");
  assert.equal(attackRollMode(c, blade).mode, "adv");
  assert.equal(H.surprisingStrikes(c), 5);
  assert.equal(H.deathStrikeDc(c), 0);
  const top = rogue(17, S);
  assert.equal(H.deathStrikeDc(top), 0, "only in the first round");
  H.startEffect(top, "assassinate_2024");
  assert.equal(H.deathStrikeDc(top), 8 + 4 + 6);
  assert.ok(classProfs(c).tools.includes("Poisoner's kit") && classProfs(c).tools.includes("Disguise kit"));
});
function classProfs(c){ return H.classProficiencies(c, 0); }

test("Arcane Trickster: third caster, any school, Mage Hand kept, Spell Thief", () => {
  const S = "Arcane Trickster (2024)";
  const def = SUBCLASS_CASTERS["Rogue:" + S];
  assert.ok(def && def.swap && !def.schools);
  assert.deepEqual(def.autoCantrips, ["Mage Hand"]);
  assert.deepEqual([3, 9, 10].map((lv) => def.cantrips[lv]), [3, 3, 4]);
  assert.deepEqual([3, 4, 7, 8, 10, 11, 13, 14, 16, 19, 20].map((lv) => def.spells[lv]), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], "the Prepared Spells column");
  assert.equal(computeSpellSlots(rogue(3, S).classes).slots[1], 2);
  assert.deepEqual([1, 2].map((n) => computeSpellSlots(rogue(7, S).classes).slots[n]), [4, 2], "the Spell Slots column at level 7");
  assert.ok(res(rogue(17, S), "Spell Thief"));
  assert.match(H.cunningStrike(rogue(13, S)).options.find((o) => o.name === "Trip").line, /spectral hand/);
  assert.doesNotMatch(H.cunningStrike(rogue(12, S)).options.find((o) => o.name === "Trip").line, /spectral hand/);
});

test("Soulknife: the dice table (p. 134), blades with Vex, Veil and Rend Mind's costs", () => {
  const S = "Soulknife (2024)";
  const table = [[3, 6, 4], [5, 8, 6], [9, 8, 8], [11, 10, 8], [13, 10, 10], [17, 12, 12]];
  for(const [lv, die, n] of table){
    const d = H.soulknifeDie(rogue(lv, S));
    assert.deepEqual([d.die, d.left], [die, n], "level " + lv);
    assert.equal(res(rogue(lv, S), "Psionic Energy Dice").max, n);
  }
  const c = rogue(9, S);
  const key = res(c, "Psionic Energy Dice").key;
  c.resourcesUsed[key] = 5;
  H.restoreResources(c, "short");
  assert.equal(c.resourcesUsed[key], 4, "one back on a short rest");
  H.restoreResources(c, "long");
  assert.equal(c.resourcesUsed[key] || 0, 0);
  assert.ok(H.psychicBlades(c)[0].parts.includes("Mastery: Vex"));
  assert.ok(!H.psychicBlades(rogue(9, "Soulknife", "")).length ? false : !H.psychicBlades(rogue(9, "Soulknife", ""))[0].parts.includes("Mastery: Vex"));
  assert.equal(res(rogue(13, S), "Psychic Veil").diceRestore.count, 1);
  assert.equal(res(rogue(17, S), "Rend Mind").diceRestore.count, 3);
  assert.match(res(rogue(17, S), "Rend Mind").hint, /DC 18/);
});

test("Thief: climb speed, Stealth Attack, four attunements", () => {
  const S = "Thief (2024)";
  assert.equal(computeSpeed(rogue(3, S)).others.find((o) => o.type === "climb").value, 30);
  assert.ok(effectNames(rogue(9, S)).includes("Stealth Attack") && !effectNames(rogue(8, S)).includes("Stealth Attack"));
  assert.equal(attunementLimit(rogue(13, S)), 4);
  assert.equal(attunementLimit(rogue(12, S)), 3);
  assert.equal(attunementLimit(rogue(13, "Thief", "")), 3);
});

test("the kit (p. 128) and a multiclass's picks", () => {
  const g = ROGUE_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(g.map((o) => o.coins.gp), [8, 100]);
  assert.deepEqual(g[0].items.map((i) => [i.name, i.qty]), [["Leather", 1], ["Dagger", 2], ["Shortsword", 1], ["Shortbow", 1], ["Arrows", 20], ["Thieves' Tools", 1], ["Burglar's Pack", 1]]);
  assert.deepEqual(ROGUE_2024.multiclassProfs.profs.pick.map((p) => p.kind), ["skill", "expertise"], "a multiclass gets the level 1 features, Expertise too");
  assert.equal(ROGUE_2024.multiclassProfs.profs.pick[1].count, 2);
  assert.ok(!ROGUE_2024.multiclassProfs.profs.pick[1].tools);
  assert.deepEqual(ROGUE_2024.multiclassProfs.armor, ["Light armor"]);
});

test("plain text: no long dashes or semicolons, Remember lines fit", () => {
  const all = [...ROGUE_2024.level1, ...Object.values(ROGUE_2024.features).flat(), ...ROGUE_2024_SUBCLASSES.flatMap((s) => Object.values(s.features).flat())];
  for(const f of all){
    assert.doesNotMatch(f.text, /[–—;]/, f.name);
    if(f.remind) assert.ok(f.remind.line.length <= 84, f.name);
  }
});
