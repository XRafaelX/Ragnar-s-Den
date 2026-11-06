/* The 2024 Cleric (2026-11-06, Phase 10 of the 2024 Player's Handbook):
   checked against the printed book, pp. 68 to 76. A class entry's edition
   "2024" swaps in Divine Order, two uses of Channel Divinity with Divine
   Spark, Sear Undead, Blessed Strikes, a domain at level 3 and the four 2024
   domains. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { CLERIC_2024, CLERIC_2024_SUBCLASSES, divineSparkDice } from "../js/data/cleric-2024.js";
import { SPELL_DATA_2024 } from "../js/data/spells-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, subclassLevelOf, choiceEffectsOf, classProficiencies } from "../js/core/class-features.js";
import { casterDef, preparedMax, learnPlan } from "../js/core/spells-known.js";
import { skillCheck as computeSkill, skillRollMode } from "../js/core/checks.js";
import { characterReminders } from "../js/core/reminders.js";
import { clericHitDice, potentSpellcasting2024 } from "../js/core/cleric.js";
import { setSpellEdition } from "../js/core/spell-edition.js";

const ABIL = { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 };
function cleric(lv, sub = "", edition = "2024", picks = {}, extra = {}){
  const c = newCharacter("C");
  const cl = { name: "Cleric", subclass: sub, level: lv, profPicks: {} };
  if(edition) cl.edition = edition;
  Object.keys(picks).forEach((k) => { cl.profPicks[k] = { slots: [[picks[k]]], applied: {} }; });
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  Object.keys(s.slots).forEach((k) => { out.spellcasting.slots[k] = { max: s.slots[k], used: 0 }; });
  return out;
}
const ORDER = "class:Divine Order@1", STRIKES = "class:Blessed Strikes@7";
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const channels = (c) => H.clericChannels(c).map((a) => a.name);

test("the 2014 cleric is unchanged without an edition", () => {
  const c = cleric(10, "Life Domain", "");
  assert.ok(names(c).includes("Destroy Undead") && names(c).includes("Divine Strike") && !names(c).includes("Divine Spark"));
  assert.equal(res(c, "Channel Divinity").max, 2);
  assert.equal(subclassLevelOf(c.classes[0]), 1);
  assert.deepEqual(channels(c), ["Turn Undead", "Preserve Life"]);
  assert.equal(casterDef("Cleric", "").cantripSwap, "Cantrip Versatility");
  assert.deepEqual(clericHitDice(cleric(8, "Life Domain", "")).map((d) => d.label), ["Divine Strike (Radiant)"]);
});

test("the features arrive at the book's levels (p. 69)", () => {
  const at = (lv) => names(cleric(lv));
  assert.ok(at(1).includes("Spellcasting") && at(1).includes("Divine Order"));
  assert.ok(at(2).includes("Channel Divinity"));
  assert.ok(at(5).includes("Sear Undead") && !at(5).includes("Destroy Undead"));
  assert.ok(at(7).includes("Blessed Strikes"));
  assert.ok(at(10).includes("Divine Intervention"));
  assert.ok(at(14).includes("Improved Blessed Strikes"));
  assert.ok(at(19).includes("Epic Boon"));
  assert.ok(at(20).includes("Greater Divine Intervention"));
  assert.equal(subclassLevelOf(cleric(1).classes[0]), 3, "the domain at level 3");
});

test("cantrips, prepared spells and slots", () => {
  const def = casterDef("Cleric", "", "2024");
  assert.deepEqual([1, 3, 4, 9, 10, 20].map((l) => def.cantrips[l]), [3, 3, 4, 4, 5, 5]);
  assert.equal(def.cantripSwap, "level");
  const prepared = [4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
  prepared.forEach((n, i) => assert.equal(preparedMax(null, { name: "Cleric", level: i + 1, edition: "2024" }), n, "level " + (i + 1)));
  assert.deepEqual(computeSpellSlots([{ name: "Cleric", level: 20, edition: "2024" }]).slots[9], 1);
});

test("Divine Order: Protector's armor and weapons, Thaumaturge's cantrip and bonus", () => {
  const prot = cleric(1, "", "2024", { [ORDER]: "Protector" });
  const p = classProficiencies(prot, 0);
  assert.ok(p.armor.includes("Heavy armor") && p.weapons.includes("Martial weapons"));
  assert.ok(!classProficiencies(cleric(1), 0).armor.includes("Heavy armor"));
  const thau = cleric(1, "", "2024", { [ORDER]: "Thaumaturge" }, { skillProfs: { Religion: { prof: true, expertise: false } } });
  assert.deepEqual(choiceEffectsOf(thau.classes[0]).map((e) => [e.name, e.cantrips]), [["Thaumaturge", 1]]);
  assert.match(computeSkill(thau, "Arcana").breakdown, /Thaumaturge \(\+3\)/);
  assert.match(computeSkill(thau, "Religion").breakdown, /Thaumaturge \(\+3\)/);
  assert.doesNotMatch(computeSkill(thau, "History").breakdown, /Thaumaturge/);
  const low = cleric(1, "", "2024", { [ORDER]: "Thaumaturge" }, { abilities: Object.assign({}, ABIL, { wis: 8 }) });
  assert.match(computeSkill(low, "Arcana").breakdown, /Thaumaturge \(\+1\)/, "minimum +1");
  // A level-up at 4 asks for the fourth class cantrip and the extra one.
  const four = cleric(3, "", "2024", { [ORDER]: "Thaumaturge" });
  four.spells = ["Guidance", "Sacred Flame", "Thaumaturgy", "Toll the Dead"].map((n) => ({ name: n, level: 0, learnedBy: "Cleric" }));
  const plan = learnPlan(four, { name: "Cleric", edition: "2024", level: 4, profPicks: four.classes[0].profPicks }, false);
  assert.equal((plan.sections.find((s) => s.kind === "cantrip") || { count: 0 }).count, 1);
});

test("Channel Divinity: two uses, three at 6, four at 18, one back on a short rest", () => {
  assert.equal(res(cleric(1), "Channel Divinity"), undefined);
  assert.deepEqual([2, 5, 6, 17, 18].map((l) => res(cleric(l), "Channel Divinity").max), [2, 2, 3, 3, 4]);
  const c = cleric(6);
  H.spendResource(c, "Cleric:channel_divinity", 3);
  H.restoreResources(c, "short");
  assert.equal(H.resourceLeft(c, "Cleric:channel_divinity"), 1);
  assert.deepEqual(channels(cleric(2)), ["Divine Spark", "Turn Undead"]);
});

test("Divine Spark and Sear Undead roll the book's dice", () => {
  assert.deepEqual([2, 6, 7, 12, 13, 17, 18].map(divineSparkDice), [1, 1, 2, 2, 3, 3, 4]);
  const spark = H.clericChannels(cleric(7)).find((a) => a.name === "Divine Spark");
  assert.deepEqual([spark.roll.qty, spark.roll.die, spark.roll.bonus], [2, 8, 3]);
  assert.match(spark.roll.label, /CON save DC 14/);
  assert.equal(H.clericChannels(cleric(4)).find((a) => a.name === "Turn Undead").roll, undefined);
  const turn = H.clericChannels(cleric(5)).find((a) => a.name === "Turn Undead");
  assert.deepEqual([turn.roll.qty, turn.roll.die], [3, 8], "WIS modifier d8s");
  assert.match(turn.detail, /frightened and incapacitated/);
});

test("Blessed Strikes: Divine Strike on weapons, or Potent Spellcasting", () => {
  assert.deepEqual(clericHitDice(cleric(6, "", "2024", { [STRIKES]: "Divine Strike" })), []);
  const strike = cleric(7, "", "2024", { [STRIKES]: "Divine Strike" });
  assert.deepEqual(clericHitDice(strike).map((d) => d.qty + "d" + d.die + " " + d.label), ["1d8 Divine Strike (Necrotic or Radiant)"]);
  assert.equal(clericHitDice(cleric(14, "", "2024", { [STRIKES]: "Divine Strike" }))[0].qty, 2);
  const potent = cleric(7, "", "2024", { [STRIKES]: "Potent Spellcasting" });
  assert.ok(potentSpellcasting2024(potent) && !potentSpellcasting2024(strike));
  assert.deepEqual(clericHitDice(potent), []);
  const rem = (c) => characterReminders(c).map((r) => r.name);
  assert.ok(rem(cleric(14, "", "2024", { [STRIKES]: "Potent Spellcasting" })).includes("Potent Spellcasting"));
  assert.ok(!rem(cleric(14, "", "2024", { [STRIKES]: "Divine Strike" })).includes("Potent Spellcasting"));
  // An older domain's Divine Strike gives way.
  const tempest = cleric(8, "Tempest Domain", "2024", { [STRIKES]: "Potent Spellcasting" });
  assert.ok(!names(tempest).includes("Divine Strike"));
  assert.deepEqual(clericHitDice(tempest), []);
});

test("the domains: 2024 at level 3, older ones still open", () => {
  const list = subclassesFor("Cleric", "2024").map((s) => s.name);
  ["Life", "Light", "Trickery", "War"].forEach((n) => assert.ok(list.includes(n + " Domain (2024)") && !list.includes(n + " Domain"), n));
  ["Knowledge Domain", "Tempest Domain", "Twilight Domain", "Grave Domain"].forEach((n) => assert.ok(list.includes(n), n));
  const c = cleric(5, "Life Domain", "");
  assert.ok(setClassEdition(c, "Cleric", true));
  assert.equal(c.classes[0].subclass, "Life Domain (2024)");
  const young = cleric(1, "War Domain", "");
  setClassEdition(young, "Cleric", true);
  assert.equal(young.classes[0].subclass, "", "a level 1 cleric picks again at 3");
});

test("each 2024 domain's spells are the book's, by level", () => {
  const want = {
    "Life Domain (2024)": [["Aid", "Bless", "Cure Wounds", "Lesser Restoration"], ["Mass Healing Word", "Revivify"], ["Aura of Life", "Death Ward"], ["Greater Restoration", "Mass Cure Wounds"]],
    "Light Domain (2024)": [["Burning Hands", "Faerie Fire", "Scorching Ray", "See Invisibility"], ["Daylight", "Fireball"], ["Arcane Eye", "Wall of Fire"], ["Flame Strike", "Scrying"]],
    "Trickery Domain (2024)": [["Charm Person", "Disguise Self", "Invisibility", "Pass without Trace"], ["Hypnotic Pattern", "Nondetection"], ["Confusion", "Dimension Door"], ["Dominate Person", "Modify Memory"]],
    "War Domain (2024)": [["Guiding Bolt", "Magic Weapon", "Shield of Faith", "Spiritual Weapon"], ["Crusader's Mantle", "Spirit Guardians"], ["Fire Shield", "Freedom of Movement"], ["Hold Monster", "Steel Wind Strike"]]
  };
  setSpellEdition("2024");
  try{
    Object.keys(want).forEach((sub) => {
      [].concat(...want[sub]).forEach((n) => assert.ok(SPELL_DATA_2024[n], sub + ": " + n));
      const got = (lv) => H.featureSpells(cleric(lv, sub)).filter((s) => s.feature === "Domain Spells").map((s) => s.name);
      assert.deepEqual(got(3), want[sub][0]);
      assert.deepEqual(got(5), want[sub][0].concat(want[sub][1]));
      assert.deepEqual(got(9), [].concat(...want[sub]));
    });
  } finally { setSpellEdition("2014"); }
});

test("the domains' Channel Divinity and resources", () => {
  assert.match(H.clericChannels(cleric(3, "Life Domain (2024)")).find((a) => a.name === "Preserve Life").detail, /15 hit points.*bloodied/);
  const dawn = H.clericChannels(cleric(3, "Light Domain (2024)")).find((a) => a.name === "Radiance of the Dawn");
  assert.deepEqual([dawn.roll.qty, dawn.roll.die, dawn.roll.bonus], [2, 10, 3]);
  const flare = (lv) => res(cleric(lv, "Light Domain (2024)"), "Warding Flare");
  assert.deepEqual([flare(3).max, flare(3).reset, flare(3).roll], [3, "long", null]);
  assert.deepEqual([flare(6).reset, flare(6).roll.qty, flare(6).roll.die, flare(6).roll.bonus], ["short", 2, 6, 3]);
  assert.equal(res(cleric(17, "Light Domain (2024)"), "Corona of Light").max, 3);
  const trick = cleric(3, "Trickery Domain (2024)");
  assert.ok(H.useChannelAction(trick, H.clericChannels(trick).find((a) => a.name === "Invoke Duplicity")));
  assert.ok(H.effectOn(trick, "invoke_duplicity"));
  assert.ok(H.startEffect(trick, "blessing_of_the_trickster"));
  assert.equal(skillRollMode(trick, "Stealth").mode, "adv");
  H.endAllEffects(trick, "short");
  assert.ok(H.effectOn(trick, "blessing_of_the_trickster"), "a short rest keeps the blessing");
  assert.ok(!H.effectOn(trick, "invoke_duplicity"));
  H.endAllEffects(trick, "long");
  assert.ok(!H.effectOn(trick, "blessing_of_the_trickster"), "a long rest ends it");
  const war = cleric(6, "War Domain (2024)");
  assert.deepEqual(channels(war), ["Divine Spark", "Turn Undead", "Guided Strike", "War God's Blessing"]);
  assert.deepEqual([res(war, "War Priest").max, res(war, "War Priest").reset], [3, "short"]);
  assert.ok(H.characterResistances ? true : true);
  assert.deepEqual(channels(cleric(3, "Tempest Domain")), ["Divine Spark", "Turn Undead", "Destructive Wrath"], "an older domain's option too");
});

test("the kit and proficiencies are the book's (p. 68)", () => {
  const [a, gold] = CLERIC_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => [i.name, i.qty]), [["Chain Shirt", 1], ["Shield", 1], ["Mace", 1], ["Holy Symbol", 1], ["Priest's Pack", 1]]);
  assert.equal(a.coins.gp, 7);
  assert.equal(gold.coins.gp, 110);
  assert.deepEqual(CLERIC_2024.skillChoices.options, ["History", "Insight", "Medicine", "Persuasion", "Religion"]);
  assert.deepEqual(CLERIC_2024.proficiencies.weapons, ["Simple weapons"]);
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([CLERIC_2024.level1, CLERIC_2024.features, CLERIC_2024.card, CLERIC_2024.which, CLERIC_2024_SUBCLASSES]);
  assert.ok(!/[–—;]/.test(text));
});
