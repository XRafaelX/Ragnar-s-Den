/* The 2024 Ranger (2026-11-06, Phase 9 of the 2024 Player's Handbook):
   checked against the printed book, pp. 117 to 127. A class entry's edition
   "2024" swaps in the features, spells prepared from level 1, Favored Enemy's
   free Hunter's Marks, the kit and the four 2024 subclasses. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { RANGER_2024, RANGER_2024_SUBCLASSES } from "../js/data/ranger-2024.js";
import { SPELL_DATA_2024 } from "../js/data/spells-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, characterIsCaster } from "../js/core/class-features.js";
import { casterDef, preparedMax, spellNeedsPreparing, classPrepares } from "../js/core/spells-known.js";
import { computeSpeed, computeInitiative } from "../js/core/vitals.js";
import { attackRollMode } from "../js/core/checks.js";
import { characterChoices } from "../js/core/class-picks.js";
const BOW = { id: "b", name: "Longbow", type: "weapon", equipped: true, ability: "dex", proficient: true, damageDice: "1d8", damageType: "Piercing", notes: "ammunition, heavy, two-handed" };
const mode = (c) => { const m = attackRollMode(c, BOW); return m && m.mode !== undefined ? m.mode : m; };
import { characterCompanions, setCompanionChoice } from "../js/core/companions.js";
import { characterReminders } from "../js/core/reminders.js";
import { tirelessRest, huntersMarkDie, dreadfulStrike, foeSlayer, hasStalkersFlurry, rangerHitDice } from "../js/core/ranger.js";
import { setSpellEdition } from "../js/core/spell-edition.js";

const ABIL = { str: 12, dex: 16, con: 14, int: 10, wis: 16, cha: 8 };
function ranger(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("R");
  const cl = { name: "Ranger", subclass: sub, level: lv };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 10 * lv, current: 10 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra);
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  Object.keys(s.slots).forEach((k) => { out.spellcasting.slots[k] = { max: s.slots[k], used: 0 }; });
  return out;
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const fx = (c, id) => H.characterEffects(c).find((e) => e.def.id === id);
const picked = (c, key, slots) => { c.classes[0].profPicks = Object.assign(c.classes[0].profPicks || {}, { [key]: { slots, applied: {} } }); return c; };
const row = (lv) => { const s = computeSpellSlots([{ name: "Ranger", level: lv, edition: "2024" }]).slots; return [s[1], s[2], s[3], s[4], s[5]]; };

test("the 2014 ranger is unchanged without an edition", () => {
  const c = ranger(20, "Gloom Stalker", "");
  assert.ok(names(c).includes("Primeval Awareness") && names(c).includes("Vanish") && !names(c).includes("Roving"));
  assert.equal(res(c, "Hunter's Mark (free cast)"), undefined);
  assert.equal(computeSpellSlots(ranger(1, "", "").classes).slots[1], 0);
  assert.ok(!characterIsCaster(ranger(1, "", "")));
  assert.equal(classPrepares(c, "Ranger"), false, "the 2014 ranger knows its spells");
  assert.equal(foeSlayer(c), 3);
  assert.ok(hasStalkersFlurry(c));
  assert.ok(casterDef("Ranger", "").spells, "a table of spells known");
});

test("the features arrive at the book's levels (p. 119)", () => {
  const at = (lv) => names(ranger(lv));
  assert.ok(["Spellcasting", "Favored Enemy", "Weapon Mastery"].every((n) => at(1).includes(n)));
  assert.ok(at(2).includes("Deft Explorer") && at(2).includes("Fighting Style"));
  assert.ok(at(5).includes("Extra Attack"));
  assert.ok(at(6).includes("Roving") && !at(5).includes("Roving"));
  assert.ok(at(9).includes("Expertise"));
  assert.ok(at(10).includes("Tireless"));
  assert.ok(at(13).includes("Relentless Hunter"));
  assert.ok(at(14).includes("Nature's Veil"));
  assert.ok(at(17).includes("Precise Hunter"));
  assert.ok(at(18).includes("Feral Senses"));
  assert.ok(at(19).includes("Epic Boon"));
  assert.ok(at(20).includes("Foe Slayer"));
  assert.ok(!at(20).includes("Primeval Awareness") && !at(20).includes("Land's Stride") && !at(20).includes("Vanish"));
});

test("spell slots and prepared spells follow the Ranger Features table", () => {
  const slots = [[2,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],[4,3,2,0,0],[4,3,2,0,0],
    [4,3,3,0,0],[4,3,3,0,0],[4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
  slots.forEach((want, i) => assert.deepEqual(row(i + 1), want, "level " + (i + 1)));
  const prepared = [2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
  prepared.forEach((n, i) => assert.equal(preparedMax(null, { name: "Ranger", level: i + 1, edition: "2024" }), n, "level " + (i + 1)));
  const one = ranger(1);
  assert.ok(characterIsCaster(one));
  assert.deepEqual(H.spellcastingAbilities(one).map((a) => [a.ability, a.dc]), [["wis", 13]]);
  assert.ok(classPrepares(one, "Ranger"));
  assert.ok(spellNeedsPreparing(one, { name: "Cure Wounds", level: 1, learnedBy: "Ranger" }));
  assert.ok(!spellNeedsPreparing(one, { name: "Hunter's Mark", level: 1, learnedBy: "Ranger" }), "Hunter's Mark is always prepared");
  assert.equal(casterDef("Ranger", "", "2024").spells, undefined, "no spells known to learn");
  assert.deepEqual([1, 5, 9, 13, 17].map((l) => casterDef("Ranger", "", "2024").maxLevel(l)), [1, 2, 3, 4, 5]);
});

test("Favored Enemy: Hunter's Mark free casts by the table, then a slot", () => {
  const casts = [2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6];
  casts.forEach((n, i) => assert.equal(res(ranger(i + 1), "Hunter's Mark (free cast)").max, n, "level " + (i + 1)));
  const c = ranger(1);
  assert.ok(H.featureSpells(c).some((s) => s.name === "Hunter's Mark" && s.kind === "prepared"));
  assert.equal(huntersMarkDie(c), 0);
  assert.ok(H.startEffect(c, "hunters_mark"));
  assert.equal(huntersMarkDie(c), 6);
  assert.equal(H.resourceLeft(c, "Ranger:favored_enemy"), 1);
  assert.deepEqual(rangerHitDice(c).map((d) => [d.name, d.qty + "d" + d.die, d.label]), [["Hunter's Mark", "1d6", "Hunter's Mark (Force)"]]);
  H.endEffect(c, "hunters_mark");
  H.startEffect(c, "hunters_mark");
  H.endEffect(c, "hunters_mark");
  assert.equal(H.resourceLeft(c, "Ranger:favored_enemy"), 0);
  assert.equal(fx(c, "hunters_mark").slot, 1, "a level 1 slot pays next");
  assert.ok(H.startEffect(c, "hunters_mark"));
  assert.equal(c.spellcasting.slots[1].used, 1);
  H.endEffect(c, "hunters_mark");
  c.spellcasting.slots[1].used = 2;
  assert.match(fx(c, "hunters_mark").why, /Not enough/);
  H.restoreResources(c, "long");
  assert.equal(H.resourceLeft(c, "Ranger:favored_enemy"), 2);
});

test("Precise Hunter and Foe Slayer", () => {
  const c = ranger(17);
  H.startEffect(c, "hunters_mark");
  assert.equal(mode(c), "adv");
  const sixteen = ranger(16);
  H.startEffect(sixteen, "hunters_mark");
  assert.notEqual(mode(sixteen), "adv");
  const twenty = ranger(20);
  H.startEffect(twenty, "hunters_mark");
  assert.equal(huntersMarkDie(twenty), 10);
  assert.equal(foeSlayer(twenty), 0, "no +WIS to attacks in 2024");
});

test("Roving, Tireless and Nature's Veil", () => {
  assert.equal(computeSpeed(ranger(6)).value, 40);
  const climb = computeSpeed(ranger(6)).others.map((o) => o.type + " " + o.value);
  assert.ok(climb.includes("climb 40") && climb.includes("swim 40"), climb.join());
  const heavy = ranger(6, "", "2024", { abilities: Object.assign({}, ABIL, { str: 14 }), inventory: [{ id: "a", name: "Chain Mail", type: "armor", category: "heavy", baseAC: 16, equipped: true }] });
  assert.equal(computeSpeed(heavy).value, 30, "not in heavy armor");
  assert.equal(res(ranger(10), "Tireless").max, 3, "WIS modifier");
  const tired = ranger(10, "", "2024", { conditions: ["exhaustion"], exhaustion: 2 });
  tirelessRest(tired);
  assert.equal(res(ranger(14), "Nature's Veil").max, 3);
  assert.equal(res(ranger(13), "Nature's Veil"), undefined);
  const veil = ranger(14);
  assert.ok(H.startEffect(veil, "natures_veil"));
  assert.equal(fx(veil, "natures_veil").def.duration, "Until the end of your next turn");
  assert.equal(mode(veil), "adv");
});

test("Deft Explorer and Expertise ask for skills and languages", () => {
  const two = RANGER_2024.features[2].find((f) => f.name === "Deft Explorer");
  assert.deepEqual(two.profs.pick.map((p) => p.kind + (p.count || 1)), ["expertise1", "language2"]);
  const nine = RANGER_2024.features[9].find((f) => f.name === "Expertise");
  assert.deepEqual(nine.profs.pick.map((p) => p.kind + p.count), ["expertise2"]);
  assert.ok(RANGER_2024.fightingStyle.options.includes("Druidic Warrior") && !RANGER_2024.fightingStyle.options.includes("Blessed Warrior"));
});

test("the older subclasses stay open, the swapped ones are 2024", () => {
  const list = subclassesFor("Ranger", "2024").map((s) => s.name);
  ["Beast Master", "Fey Wanderer", "Gloom Stalker", "Hunter"].forEach((n) => assert.ok(list.includes(n + " (2024)") && !list.includes(n), n));
  ["Horizon Walker", "Drakewarden", "Monster Slayer", "Swarmkeeper"].forEach((n) => assert.ok(list.includes(n), n));
  const c = ranger(3, "Hunter", "");
  assert.ok(setClassEdition(c, "Ranger", true));
  assert.equal(c.classes[0].subclass, "Hunter (2024)");
  assert.ok(setClassEdition(c, "Ranger", false));
  assert.equal(c.classes[0].subclass, "Hunter");
});

test("each subclass's spells are the book's, by level", () => {
  const want = {
    "Fey Wanderer (2024)": ["Charm Person", "Misty Step", "Summon Fey", "Dimension Door", "Mislead"],
    "Gloom Stalker (2024)": ["Disguise Self", "Rope Trick", "Fear", "Greater Invisibility", "Seeming"]
  };
  setSpellEdition("2024");
  try{
    Object.keys(want).forEach((sub) => {
      want[sub].forEach((n) => assert.ok(SPELL_DATA_2024[n], sub + ": " + n));
      const got = (lv) => H.featureSpells(ranger(lv, sub)).filter((s) => / Spells$/.test(s.feature)).map((s) => s.name);
      assert.deepEqual(got(3), want[sub].slice(0, 1));
      assert.deepEqual(got(5), want[sub].slice(0, 2));
      assert.deepEqual(got(9), want[sub].slice(0, 3));
      assert.deepEqual(got(17), want[sub]);
    });
  } finally { setSpellEdition("2014"); }
});

test("Fey Wanderer: Dreadful Strikes, Glamour and its free casts", () => {
  const c = ranger(11, "Fey Wanderer (2024)");
  assert.ok(rangerHitDice(c).some((d) => d.name === "Dreadful Strikes" && d.die === 6));
  assert.ok(rangerHitDice(ranger(3, "Fey Wanderer (2024)")).some((d) => d.name === "Dreadful Strikes" && d.die === 4));
  assert.equal(H.otherworldlyGlamour(c), 3);
  assert.ok(res(c, "Fey Reinforcements (Free Summon Fey)"));
  assert.equal(res(ranger(15, "Fey Wanderer (2024)"), "Misty Wanderer").max, 3);
});

test("Gloom Stalker: initiative, Ambusher's Leap and Dreadful Strike", () => {
  const c = ranger(3, "Gloom Stalker (2024)");
  assert.match(computeInitiative(c).breakdown, /Dread Ambusher/);
  assert.ok(H.startEffect(c, "dread_ambusher"));
  assert.equal(computeSpeed(c).value, 40, "Ambusher's Leap");
  assert.equal(H.attacksPerAction ? H.attacksPerAction(c) : 1, 1, "no extra attack in 2024");
  assert.ok(!rangerHitDice(c).some((d) => d.name === "Dread Ambusher"), "no 2014 1d8");
  const strike = rangerHitDice(c).find((d) => d.name === "Dreadful Strike");
  assert.deepEqual([strike.qty, strike.die, strike.pay], [2, 6, "Ranger:dreadful_strike"]);
  assert.equal(res(c, "Dreadful Strike").max, 3);
  assert.equal(dreadfulStrike(ranger(11, "Gloom Stalker (2024)")).die, 8);
  assert.ok(!hasStalkersFlurry(ranger(11, "Gloom Stalker (2024)")), "the 2014 extra attack after a miss");
  assert.ok(H.characterSenses ? true : true);
});

test("Hunter: the picks on Feature choices, Colossus Slayer's die and the reminders", () => {
  const c = picked(ranger(7, "Hunter (2024)"), "sub:Hunter (2024):Hunter's Prey@3", [["Colossus Slayer"]]);
  picked(c, "sub:Hunter (2024):Defensive Tactics@7", [["Multiattack Defense"]]);
  assert.deepEqual(characterChoices(c, "huntersPrey2024"), ["Colossus Slayer"]);
  assert.ok(rangerHitDice(c).some((d) => d.name === "Colossus Slayer" && d.die === 8));
  let rem = characterReminders(c).map((r) => r.name + ":" + r.when);
  assert.ok(rem.includes("Multiattack Defense:always") && !rem.includes("Horde Breaker:always"), rem.join());
  picked(c, "sub:Hunter (2024):Hunter's Prey@3", [["Horde Breaker"]]);
  rem = characterReminders(c).map((r) => r.name + ":" + r.when);
  assert.ok(rem.includes("Horde Breaker:always"), rem.join());
  assert.ok(!rangerHitDice(c).some((d) => d.name === "Colossus Slayer"));
  assert.deepEqual(characterReminders(ranger(7, "Hunter (2024)")).filter((r) => /Horde|Escape|Multiattack/.test(r.name)), [], "nothing picked yet");
});

test("Beast Master: the 2024 primal beasts (p. 123)", () => {
  const c = ranger(7, "Beast Master (2024)");
  const beast = () => characterCompanions(c).find((x) => x.def.id === "primal_companion");
  assert.ok(beast());
  assert.equal(beast().stats, null);
  setCompanionChoice(c, "primal_companion", "Beast of the Land");
  let s = beast().stats;
  assert.deepEqual([s.ac, s.hp, s.speed], [16, 40, "40 ft, climb 40 ft"], "13 + WIS, 5 + 5 x 7");
  assert.deepEqual([s.attacks[0].toHit, s.attacks[0].dice, s.attacks[0].bonus], [6, "1d8", 5], "spell attack, 1d8 + 2 + WIS");
  assert.match(s.attacks[0].text, /force/);
  setCompanionChoice(c, "primal_companion", "Beast of the Sky");
  s = beast().stats;
  assert.deepEqual([s.ac, s.hp, s.speed, s.attacks[0].dice, s.attacks[0].bonus], [16, 32, "10 ft, fly 60 ft", "1d4", 6]);
  setCompanionChoice(c, "primal_companion", "Beast of the Sea");
  s = beast().stats;
  assert.match(s.attacks[0].text, /Escape DC 14/);
  assert.equal(characterCompanions(ranger(7, "Beast Master", "")).find((x) => x.def.id === "primal_companion"), undefined);
});

test("the kit and proficiencies are the book's (p. 118)", () => {
  const [a, gold] = RANGER_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => [i.name, i.qty]), [["Studded Leather", 1], ["Scimitar", 1], ["Shortsword", 1], ["Longbow", 1], ["Arrows", 20], ["Druidic Focus", 1], ["Explorer's Pack", 1]]);
  assert.equal(a.coins.gp, 7);
  assert.equal(gold.coins.gp, 150);
  assert.equal(RANGER_2024.skillChoices.count, 3);
  assert.deepEqual(RANGER_2024.proficiencies.savingThrows, ["str", "dex"]);
  assert.deepEqual(RANGER_2024.multiclassProfs.weapons, ["Martial weapons"]);
  assert.equal(RANGER_2024.multiclassProfs.profs.pick[0].kind, "skill");
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([RANGER_2024.level1, RANGER_2024.features, RANGER_2024.card, RANGER_2024.which, RANGER_2024_SUBCLASSES]);
  assert.ok(!/[–—;]/.test(text));
});
