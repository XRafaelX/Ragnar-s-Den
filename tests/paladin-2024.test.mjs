/* The 2024 Paladin (2026-11-05, Phase 8 of the 2024 Player's Handbook):
   checked against the printed book, pp. 108 to 116 and 272. A class entry's
   edition "2024" swaps in the features, spells from level 1, Divine Smite as a
   spell, Channel Divinity's two uses, the kit and the four 2024 oaths. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { PALADIN_2024, PALADIN_2024_SUBCLASSES } from "../js/data/paladin-2024.js";
import { SPELL_DATA_2024 } from "../js/data/spells-2024.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, characterIsCaster } from "../js/core/class-features.js";
import { casterDef, preparedMax } from "../js/core/spells-known.js";
import { preparedAt } from "../js/data/spells-known.js";
import { computeSave } from "../js/core/vitals.js";
import { versatilityStyleSwap } from "../js/core/fighting-styles.js";
import { characterCompanions, setCompanionChoice } from "../js/core/companions.js";
import { setSpellEdition } from "../js/core/spell-edition.js";
import { advantagesFor } from "../js/core/checks.js";

const ABIL = { str: 16, dex: 10, con: 14, int: 10, wis: 12, cha: 16 };
function paladin(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("P");
  const cl = { name: "Paladin", subclass: sub, level: lv };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 10 * lv, current: 10 * lv, temp: 0 };
  Object.assign(c, extra);
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  Object.keys(s.slots).forEach((k) => { out.spellcasting.slots[k] = { max: s.slots[k], used: 0 }; });
  return out;
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const channels = (c) => H.channelActions(c).map((a) => a.name);
const row = (lv) => { const s = computeSpellSlots([{ name: "Paladin", level: lv, edition: "2024" }]).slots; return [s[1], s[2], s[3], s[4], s[5]]; };

test("the 2014 paladin is unchanged without an edition", () => {
  const c = paladin(14, "Oath of Devotion", "");
  assert.ok(names(c).includes("Divine Health") && names(c).includes("Cleansing Touch") && !names(c).includes("Radiant Strikes"));
  assert.ok(res(c, "Divine Sense") && res(c, "Cleansing Touch"));
  assert.equal(res(c, "Channel Divinity").max, 1);
  assert.equal(res(c, "Divine Smite (free cast)"), undefined);
  const one = paladin(1, "", "");
  assert.deepEqual(computeSpellSlots(one.classes).slots[1], 0);
  assert.ok(!characterIsCaster(one) && H.spellcastingAbilities(one).length === 0);
  assert.equal(preparedAt("Paladin", 1), 0);
  assert.equal(H.smiteKnown(one), false);
  assert.deepEqual([1, 5].map((l) => H.smiteDice(l)), [2, 5], "the 2014 cap");
  assert.ok(casterDef("Paladin", "").maxLevel(1) === 0);
});

test("the features arrive at the book's levels (p. 109)", () => {
  const at = (lv) => names(paladin(lv));
  assert.ok(["Lay On Hands", "Spellcasting", "Weapon Mastery"].every((n) => at(1).includes(n)));
  assert.ok(!at(1).includes("Divine Sense") && !at(20).includes("Divine Health") && !at(20).includes("Improved Divine Smite"));
  assert.ok(at(2).includes("Paladin's Smite") && at(2).includes("Fighting Style") && !at(1).includes("Paladin's Smite"));
  assert.ok(at(3).includes("Channel Divinity"));
  assert.ok(at(5).includes("Extra Attack") && at(5).includes("Faithful Steed") && !at(4).includes("Faithful Steed"));
  assert.ok(at(6).includes("Aura of Protection"));
  assert.ok(at(9).includes("Abjure Foes"));
  assert.ok(at(10).includes("Aura of Courage"));
  assert.ok(at(11).includes("Radiant Strikes"));
  assert.ok(at(14).includes("Restoring Touch"));
  assert.ok(at(18).includes("Aura Expansion"));
  assert.ok(at(19).includes("Epic Boon"));
});

test("spell slots follow the Paladin Features table, from level 1", () => {
  const table = [[2,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],[4,3,2,0,0],[4,3,2,0,0],
    [4,3,3,0,0],[4,3,3,0,0],[4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
  table.forEach((want, i) => assert.deepEqual(row(i + 1), want, "level " + (i + 1)));
  const one = paladin(1);
  assert.ok(characterIsCaster(one));
  assert.deepEqual(H.spellcastingAbilities(one).map((a) => [a.ability, a.dc]), [["cha", 13]]);
});

test("the Prepared Spells column, and the spell levels it can reach", () => {
  const table = [2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
  table.forEach((n, i) => assert.equal(preparedMax(null, { name: "Paladin", level: i + 1, edition: "2024" }), n, "level " + (i + 1)));
  const def = casterDef("Paladin", "", "2024");
  assert.deepEqual([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map((l) => def.maxLevel(l)), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
});

test("a multiclass counts half the paladin levels, rounded up (p. 45)", () => {
  const two = (edition) => computeSpellSlots([{ name: "Paladin", level: 3, edition }, { name: "Wizard", level: 3 }]).slots;
  assert.equal(two("2024")[3], 2, "2 + 3 = caster level 5");
  assert.equal(two(undefined)[3], 0, "the 2014 rule: 1 + 3 = caster level 4");
  assert.deepEqual(PALADIN_2024.multiclassProfs.weapons, ["Martial weapons"]);
  assert.deepEqual(PALADIN_2024.multiclassProfs.armor, ["Light armor", "Medium armor", "Shields"]);
});

test("Divine Smite is a spell: no cap, a free cast, and level 1 if prepared", () => {
  assert.deepEqual([1, 2, 5, 9].map((l) => H.smiteDice(l, false, false, true)), [2, 3, 6, 10]);
  assert.equal(H.smiteDice(5, true, false, true), 7);
  assert.equal(H.smiteDice(1, true, true, true), 6, "a critical hit doubles it");
  const one = paladin(1);
  assert.equal(H.smiteKnown(one), false);
  one.spells = [{ name: "Divine Smite", level: 1, prepared: true }];
  assert.equal(H.smiteKnown(one), true);
  assert.equal(H.freeSmiteLeft(one), 0, "the free cast starts at level 2");
  const c = paladin(2);
  assert.equal(H.freeSmiteLeft(c), 1);
  assert.ok(H.featureSpells(c).some((s) => s.name === "Divine Smite" && s.kind === "prepared"));
  c.spellcasting.slots[1].used = 2;
  assert.equal(H.smiteSlots(c).length, 0);
  assert.ok(H.smiteReady(c), "the free cast still pays");
  H.spendResource(c, "Paladin:paladins_smite", 1);
  assert.ok(!H.smiteReady(c));
  H.restoreResources(c, "short");
  assert.equal(H.freeSmiteLeft(c), 0, "a short rest doesn't bring it back");
  H.restoreResources(c, "long");
  assert.equal(H.freeSmiteLeft(c), 1);
});

test("Radiant Strikes names itself by edition", () => {
  assert.equal(H.radiantStrikesName(paladin(11)), "Radiant Strikes");
  assert.equal(H.radiantStrikesName(paladin(11, "", "")), "Improved Divine Smite");
  assert.ok(!H.hasImprovedSmite(paladin(10)) && H.hasImprovedSmite(paladin(11)));
});

test("Channel Divinity: two uses, three at 11, one back on a short rest", () => {
  assert.equal(res(paladin(2), "Channel Divinity"), undefined);
  assert.equal(res(paladin(3), "Channel Divinity").max, 2);
  assert.equal(res(paladin(10), "Channel Divinity").max, 2);
  const c = paladin(11);
  assert.equal(res(c, "Channel Divinity").max, 3);
  H.spendResource(c, "Paladin:channel_divinity", 3);
  H.restoreResources(c, "short");
  assert.equal(H.resourceLeft(c, "Paladin:channel_divinity"), 1);
  H.restoreResources(c, "long");
  assert.equal(H.resourceLeft(c, "Paladin:channel_divinity"), 3);
  assert.equal(res(c, "Divine Sense"), undefined, "it's a Channel Divinity now");
  assert.deepEqual(channels(paladin(3)), ["Divine Sense"]);
  assert.deepEqual(channels(paladin(9)), ["Divine Sense", "Abjure Foes"]);
  assert.match(H.channelActions(paladin(9)).find((a) => a.name === "Abjure Foes").detail, /up to 3 creatures.*DC 15/);
});

test("the older oaths stay open, with the 2024 class's own Channel Divinity", () => {
  const list = subclassesFor("Paladin", "2024").map((s) => s.name);
  ["Oath of Devotion", "Oath of Glory", "Oath of the Ancients", "Oath of Vengeance"].forEach((n) => {
    assert.ok(list.includes(n + " (2024)"), n);
    assert.ok(!list.includes(n), "no 2014 " + n);
  });
  ["Oath of Conquest", "Oathbreaker", "Oath of Redemption", "Oath of the Crown", "Oath of the Watchers"].forEach((n) => assert.ok(list.includes(n), n));
  assert.deepEqual(channels(paladin(3, "Oath of Conquest")), ["Divine Sense", "Conquering Presence", "Guided Strike"]);
  const old = subclassesFor("Paladin", "2014").map((s) => s.name);
  assert.ok(old.includes("Oath of Devotion") && !old.includes("Oath of Devotion (2024)"));
});

test("each oath's spells are the book's, by level, on the 2024 catalog", () => {
  const want = {
    "Oath of Devotion (2024)": ["Protection from Evil and Good", "Shield of Faith", "Aid", "Zone of Truth", "Beacon of Hope", "Dispel Magic", "Freedom of Movement", "Guardian of Faith", "Commune", "Flame Strike"],
    "Oath of Glory (2024)": ["Guiding Bolt", "Heroism", "Enhance Ability", "Magic Weapon", "Haste", "Protection from Energy", "Compulsion", "Freedom of Movement", "Legend Lore", "Yolande's Regal Presence"],
    "Oath of the Ancients (2024)": ["Ensnaring Strike", "Speak with Animals", "Misty Step", "Moonbeam", "Plant Growth", "Protection from Energy", "Ice Storm", "Stoneskin", "Commune with Nature", "Tree Stride"],
    "Oath of Vengeance (2024)": ["Bane", "Hunter's Mark", "Hold Person", "Misty Step", "Haste", "Protection from Energy", "Banishment", "Dimension Door", "Hold Monster", "Scrying"]
  };
  setSpellEdition("2024");
  try{
    Object.keys(want).forEach((sub) => {
      want[sub].forEach((n) => assert.ok(SPELL_DATA_2024[H.catalogSpellName ? H.catalogSpellName(n) : n] , sub + ": " + n));
      const oath = (lv) => H.featureSpells(paladin(lv, sub)).filter((s) => s.feature === "Oath Spells").map((s) => s.name);
      assert.deepEqual(oath(3), want[sub].slice(0, 2));
      assert.deepEqual(oath(4), want[sub].slice(0, 2));
      assert.deepEqual(oath(5), want[sub].slice(0, 4));
      assert.deepEqual(oath(9), want[sub].slice(0, 6));
      assert.deepEqual(oath(13), want[sub].slice(0, 8));
      assert.deepEqual(oath(17), want[sub]);
    });
  } finally { setSpellEdition("2014"); }
  assert.deepEqual(PALADIN_2024_SUBCLASSES.map((s) => s.name), Object.keys(want));
});

test("Aura of Protection stops while incapacitated, in 2024", () => {
  const c = paladin(6);
  assert.match(computeSave(c, "wis").breakdown, /Aura of Protection \(\+3\)/);
  H.addCondition(c, "stunned");
  assert.doesNotMatch(computeSave(c, "wis").breakdown, /Aura of Protection/);
  const old = paladin(6, "", "");
  H.addCondition(old, "stunned");
  assert.match(computeSave(old, "wis").breakdown, /Aura of Protection/, "the 2014 aura only needs you conscious");
});

test("the oaths' Channel Divinity and effects", () => {
  const sword = { id: "s", name: "Longsword", type: "weapon", equipped: true, ability: "str", proficient: true, damageDice: "1d8", damageType: "Slashing", notes: "versatile 1d10" };
  const dev = paladin(3, "Oath of Devotion (2024)", "2024", { inventory: [sword] });
  const sacred = H.channelActions(dev).find((a) => a.effect === "sacred_weapon");
  assert.match(sacred.detail, /10 minutes/);
  assert.ok(H.useChannelAction(dev, sacred));
  assert.ok(H.effectOn(dev, "sacred_weapon"));
  assert.equal(H.sacredWeaponBonus(dev, sword), 3);
  assert.equal(H.resourceLeft(dev, "Paladin:channel_divinity"), 1);
  assert.equal(H.characterEffects(dev).find((e) => e.def.id === "sacred_weapon").def.duration, "10 minutes");
  const old = paladin(3, "Oath of Devotion", "", { inventory: [sword] });
  assert.equal(H.characterEffects(old).find((e) => e.def.id === "sacred_weapon").def.duration, "1 minute", "each edition keeps its own");

  const glory = paladin(3, "Oath of Glory (2024)");
  assert.ok(H.inspiringSmite(glory));
  H.useChannelAction(glory, H.channelActions(glory).find((a) => a.name === "Peerless Athlete"));
  assert.ok(H.effectOn(glory, "peerless_athlete"));
  assert.equal(H.characterEffects(glory).find((e) => e.def.id === "peerless_athlete").def.duration, "1 hour");
  assert.equal(H.classFeatureList(paladin(7, "Oath of Glory (2024)").classes[0]).find((f) => f.name === "Aura of Alacrity").speed, 10, "added at the level-up, like the 2014 one");

  const vow = paladin(3, "Oath of Vengeance (2024)");
  H.useChannelAction(vow, H.channelActions(vow).find((a) => a.name === "Vow of Enmity"));
  assert.ok(H.effectOn(vow, "vow_of_enmity"));

  assert.deepEqual(channels(paladin(3, "Oath of the Ancients (2024)")), ["Divine Sense", "Nature's Wrath"]);
  assert.match(H.channelActions(paladin(3, "Oath of the Ancients (2024)")).find((a) => a.name === "Nature's Wrath").detail, /15 feet.*STR save \(DC 13\)/);
});

test("the capstones come back with a level 5 slot", () => {
  [["Oath of Devotion (2024)", "holy_nimbus", "10 minutes"], ["Oath of Glory (2024)", "living_legend", "10 minutes"], ["Oath of the Ancients (2024)", "elder_champion", "1 minute"], ["Oath of Vengeance (2024)", "avenging_angel", "10 minutes"]].forEach(([sub, id, duration]) => {
    const c = paladin(20, sub);
    const e = () => H.characterEffects(c).find((x) => x.def.id === id);
    assert.equal(e().def.duration, duration, sub);
    assert.ok(H.startEffect(c, id), sub + " starts");
    H.endEffect(c, id);
    assert.equal(e().slot, 5, sub + ": a level 5 slot pays");
    const before = c.spellcasting.slots[5].used;
    assert.ok(H.startEffect(c, id));
    assert.equal(c.spellcasting.slots[5].used, before + 1);
    H.endEffect(c, id);
    c.spellcasting.slots[5].used = c.spellcasting.slots[5].max;
    assert.match(e().why, /Not enough/, sub + ": no slot, no use");
  });
  const nimbus = paladin(20, "Oath of Devotion (2024)");
  H.startEffect(nimbus, "holy_nimbus");
  assert.ok(advantagesFor(nimbus).some((a) => a.name === "Holy Ward" && a.on === "save"));
  assert.ok(H.livingLegendOn(Object.assign(paladin(20, "Oath of Glory (2024)"), { effects: { living_legend: true } })));
});

test("Tasha's extras are the 2014 paladin's", () => {
  const c = paladin(5, "", "2024", { tashaOptional: true });
  assert.equal(res(c, "Harness Divine Power"), undefined);
  assert.ok(!names(c).includes("Harness Divine Power"));
  const old = paladin(5, "", "", { tashaOptional: true });
  old.classes[0].variants = { "Harness Divine Power": "Harness Divine Power" };
  assert.ok(res(old, "Harness Divine Power"));
});

test("a 2024 paladin keeps its Fighting Style, and a 2024 fighter can swap", () => {
  const c = paladin(4);
  c.features = [{ id: "f", name: "Fighting Style: Defense", fightingStyle: "Defense", source: "Class" }];
  assert.equal(versatilityStyleSwap(c, "Paladin", 5), false);
  c.tashaOptional = true;
  assert.equal(versatilityStyleSwap(c, "Paladin", 4), false, "Tasha's swap isn't for a 2024 class");
  const old = paladin(4, "", "", { tashaOptional: true, features: c.features });
  assert.equal(versatilityStyleSwap(old, "Paladin", 4), true);
  const f = newCharacter("F");
  f.classes = [{ name: "Fighter", level: 4, subclass: "", edition: "2024" }];
  f.features = c.features;
  assert.equal(versatilityStyleSwap(ensureShape(f), "Fighter", 5), true);
  assert.ok(PALADIN_2024.fightingStyle.options.includes("Blessed Warrior") && PALADIN_2024.fightingStyle.options.includes("Archery"));
});

test("switching edition swaps the oath, and Oath of Devotion comes back", () => {
  const c = paladin(5, "Oath of Devotion", "");
  assert.ok(setClassEdition(c, "Paladin", true));
  assert.equal(c.classes[0].subclass, "Oath of Devotion (2024)");
  assert.ok(setClassEdition(c, "Paladin", false));
  assert.equal(c.classes[0].subclass, "Oath of Devotion");
  assert.equal(c.classes[0].edition, undefined);
});

test("the steed's stat block grows with the spell's level (p. 272)", () => {
  setSpellEdition("2024");
  try{
    assert.equal(characterCompanions(paladin(4)).find((x) => x.def.id === "steed"), undefined);
    const c = paladin(9);
    let steed = () => characterCompanions(c).find((x) => x.def.id === "steed");
    assert.ok(steed(), "Faithful Steed brings it");
    assert.equal(steed().stats, null, "until a kind is chosen");
    assert.ok(steed().options.includes("Fey, level 3") && !steed().options.includes("Fey, level 4"), "only levels with slots");
    setCompanionChoice(c, "steed", "Celestial, level 2");
    let s = steed().stats;
    assert.deepEqual([s.ac, s.hp, s.speed], [12, 25, "60 ft"]);
    assert.deepEqual([s.attacks[0].toHit, s.attacks[0].bonus, s.attacks[0].damageType], [7, 2, "radiant"], "PB 4 + CHA 3");
    assert.equal(s.actions[0].name, "Healing Touch");
    c.classes[0].level = 13;
    c.spellcasting.slots[4].max = 1;
    setCompanionChoice(c, "steed", "Fiend, level 4");
    s = steed().stats;
    assert.deepEqual([s.ac, s.hp, s.speed, s.attacks[0].damageType], [14, 45, "60 ft, fly 60 ft", "necrotic"]);
    assert.equal(s.actions[0].name, "Fell Glare");
    assert.equal(s.actions[0].save, "WIS 16");
  } finally { setSpellEdition("2014"); }
  assert.equal(characterCompanions(paladin(9, "", "")).find((x) => x.def.id === "steed"), undefined, "the 2014 spell has its own rules");
});

test("the kit and proficiencies are the book's (p. 108)", () => {
  const [a, gold] = PALADIN_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => [i.name, i.qty]), [["Chain Mail", 1], ["Shield", 1], ["Longsword", 1], ["Javelin", 6], ["Holy Symbol", 1], ["Priest's Pack", 1]]);
  assert.equal(a.coins.gp, 9);
  assert.equal(gold.coins.gp, 150);
  assert.deepEqual(PALADIN_2024.skillChoices.options, ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"]);
  assert.deepEqual(PALADIN_2024.proficiencies.savingThrows, ["wis", "cha"]);
  assert.deepEqual([PALADIN_2024.spellcasting.cantrips, PALADIN_2024.spellcasting.spells, PALADIN_2024.spellcasting.ability], [0, 2, "cha"]);
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([PALADIN_2024.level1, PALADIN_2024.features, PALADIN_2024.card, PALADIN_2024.which, PALADIN_2024_SUBCLASSES]);
  assert.ok(!/[–—;]/.test(text));
});
