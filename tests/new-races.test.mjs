/* The races added 2026-10-20, checked against their dnd5e.wikidot.com
   pages that day: Tasha's Custom Lineage, Van Richten's lineages (Dhampir,
   Hexblood, Reborn), Eberron's Kalashtar and dragonmarks, Spelljammer's
   Astral Elf, Autognome, Giff, Hadozee and Plasmoid, Leonin, Owlin, Kender,
   Locathah, Grung, Pallid, Ghostwise and Lotusden subraces, Mordenkainen's
   tiefling bloodlines and the Sword Coast variant tieflings. Also the
   "+1 to three scores" option of the newer races, and natural armor. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as W from "../js/wizard/wizard-core.js";
import { featDef, featRequiresReason } from "../js/core/feat-picks.js";
import { RACE_DATA } from "../js/data/race-data.js";
import { RACE_RESOURCES } from "../js/data/resources.js";
import { RACE_CHOICES, RACES, RACE_LANGUAGES } from "../js/data/races.js";
import { LANGUAGE_LIST } from "../js/data/languages.js";
import { characterResources } from "../js/core/character-resources.js";
import * as CP from "../js/core/class-picks.js";
import { newCharacter } from "../js/core/character.js";
import { withFakeDom } from "./fake-dom.mjs";

function makeChar(race, extra = {}){
  const c = newCharacter("Test");
  c.race = race;
  c.classes = [{ name: "Fighter", subclass: "", level: 4 }];
  c.abilities = { str: 14, dex: 14, con: 14, int: 10, wis: 12, cha: 10 };
  Object.assign(c, extra);
  return c;
}
const mode = (r) => r.mode;

test("every listed race has its data, and every race's choices, resources and languages point at real things", () => {
  const listed = Object.values(RACES).flat();
  assert.equal(new Set(listed).size, listed.length, "no race listed twice");
  listed.forEach((r) => assert.ok(RACE_DATA[r], "no data for " + r));
  Object.keys(RACE_CHOICES).concat(Object.keys(RACE_RESOURCES)).forEach((r) => assert.ok(RACE_DATA[r], "unknown race " + r));
  for(const r of listed){
    (RACE_LANGUAGES[r].fixed || []).forEach((l) => assert.ok(LANGUAGE_LIST.includes(l), r + ": language " + l));
    assert.ok(RACE_DATA[r].source && RACE_DATA[r].traits.length, r + ": source and traits");
  }
  assert.equal(listed.length, 115);
  assert.equal(RACES["Plane Shift (Magic: The Gathering)"].length, 14);
  assert.deepEqual(RACES.Lineages, ["Custom Lineage", "Dhampir", "Hexblood", "Reborn"]);
  assert.equal(RACES["Dragonmarks (Eberron)"].length, 13);
});

test("the published numbers: scores, speeds, senses and languages", () => {
  const d = (r) => RACE_DATA[r];
  assert.deepEqual([d("Kalashtar").asi, d("Kalashtar").languages], [{ wis: 2, cha: 1 }, { fixed: ["Common", "Quori"], choose: 1 }]);
  assert.deepEqual([d("Leonin").asi, d("Leonin").speed.walk, d("Leonin").darkvision], [{ con: 2, str: 1 }, 35, 60]);
  assert.deepEqual([d("Owlin").speed, d("Owlin").darkvision], [{ walk: 30, fly: 30 }, 120]);
  assert.deepEqual([d("Dhampir").speed, d("Hexblood").darkvision, d("Reborn").darkvision], [{ walk: 35, climb: 35 }, 60, 0]);
  assert.deepEqual([d("Grung").asi, d("Grung").speed, d("Grung").languages.fixed], [{ dex: 2, con: 1 }, { walk: 25, climb: 25 }, ["Grung"]]);
  assert.deepEqual([d("Locathah").asi, d("Locathah").speed], [{ str: 2, dex: 1 }, { walk: 30, swim: 30 }]);
  assert.deepEqual([d("Giff").speed, d("Hadozee").speed], [{ walk: 30, swim: 30 }, { walk: 30, climb: 30 }]);
  assert.deepEqual(d("Human (Mark of Finding)").asi, { wis: 2, con: 1 });
  assert.deepEqual([d("Human (Mark of Passage)").speed.walk, d("Human (Mark of Sentinel)").asi], [35, { con: 2, wis: 1 }]);
  assert.deepEqual([d("Dwarf (Mark of Warding)").asi, d("Dwarf (Mark of Warding)").speed.walk], [{ con: 2, int: 1 }, 25]);
  assert.deepEqual([d("Tiefling (Zariel)").asi, d("Tiefling (Glasya)").asi], [{ cha: 2, str: 1 }, { cha: 2, dex: 1 }]);
  assert.deepEqual(d("Tiefling (Winged)").speed, { walk: 30, fly: 30 });
  assert.deepEqual(RACE_CHOICES["Tiefling (Variant)"].abilityPreset.options, { Standard: { cha: 2, int: 1 }, Feral: { dex: 2, int: 1 } });
  assert.deepEqual(RACE_CHOICES["Custom Lineage"], { abilityBonus: { amounts: [2] }, feat: true });
  for(const r of ["Astral Elf", "Autognome", "Giff", "Hadozee", "Kender", "Owlin", "Plasmoid", "Dhampir", "Hexblood", "Reborn", "Fairy", "Harengon", "Thri-kreen"]){
    assert.deepEqual(RACE_CHOICES[r].abilityBonus, { amounts: [2, 1], alt: [1, 1, 1] }, r);
  }
});

test("natural armor: a race's own unarmored AC, kept only while it's the best", () => {
  const ac = (race, extra) => H.computeArmorClass(makeChar(race, extra)).value;
  assert.equal(ac("Lizardfolk"), 15, "13 + DEX 2");
  assert.equal(ac("Loxodon"), 14, "12 + CON 2");
  assert.equal(ac("Tortle"), 17, "17 flat");
  assert.equal(ac("Autognome"), 15, "Armored Casing: 13 + DEX");
  assert.equal(ac("Locathah"), 14, "12 + DEX");
  assert.equal(ac("Human"), 12, "10 + DEX");
  assert.match(H.computeArmorClass(makeChar("Lizardfolk")).breakdown, /Natural Armor: 13 \+ DEX/);
  const chain = { id: "a", type: "armor", name: "Chain Mail", category: "heavy", baseAC: 16, equipped: true };
  assert.equal(ac("Lizardfolk", { inventory: [chain] }), 16, "armor replaces it");
});

test("trait advantage: a trait's own entry, not another race's trait of the same name", () => {
  const kal = makeChar("Kalashtar");
  assert.deepEqual([mode(H.saveRollMode(kal, "wis")), H.saveRollMode(kal, "wis").reason], ["adv", "Dual Mind"]);
  assert.deepEqual(H.situationalSaveAdvantages(kal, "cha"), [], "Mental Discipline here is psychic resistance, not the githzerai's");
  assert.ok(H.situationalSaveAdvantages(makeChar("Gith (Githzerai)"), "wis").some((a) => a.name === "Mental Discipline"));
  const giff = makeChar("Giff");
  assert.deepEqual([mode(H.saveRollMode(giff, "str")), mode(H.checkRollMode(giff, "str")), mode(H.saveRollMode(giff, "dex"))], ["adv", "adv", "none"]);
  const pallid = makeChar("Pallid Elf");
  assert.deepEqual(["Insight", "Investigation", "Perception"].map((s) => mode(H.skillRollMode(pallid, s))), ["adv", "adv", "none"]);
  assert.ok(H.situationalSaveAdvantages(makeChar("Locathah"), "con").some((a) => a.name === "Leviathan Will"));
  assert.ok(H.situationalSaveAdvantages(makeChar("Kender"), "wis").some((a) => a.name === "Fearless"));
});

test("Custom Lineage: darkvision, unless the Variable Trait takes a skill instead", () => {
  const c = makeChar("Custom Lineage");
  assert.equal(H.computeDarkvision(c).range, 60);
  c.racePicks = { profPicks: { "race:Variable Trait:pick": { slots: [["Arcana"]] } } };
  assert.equal(H.computeDarkvision(c).range, 0, "a skill in place of darkvision");
});

test("a giff is proficient with firearms; a dhampir's bite uses CON", () => {
  assert.ok(H.isProficientWithWeapon(makeChar("Giff", { classes: [{ name: "Wizard", level: 1 }] }), "Pistol", "firearm"));
  assert.ok(!H.isProficientWithWeapon(makeChar("Human", { classes: [{ name: "Wizard", level: 1 }] }), "Pistol", "firearm"));
  const bite = H.unarmedStrike(makeChar("Dhampir", { abilities: { str: 8, dex: 10, con: 16, int: 10, wis: 10, cha: 10 } }));
  assert.deepEqual([bite.name, bite.die, bite.ability, bite.bonus], ["Vampiric Bite (unarmed strike)", 4, "CON", 3]);
});

test("racial feats: a subrace or mark keeps its family's feats", () => {
  const why = (feat, race) => featRequiresReason(featDef(feat), { race, level: 4, feats: [] });
  assert.equal(why("Prodigy", "Human (Mark of Finding)"), "");
  assert.equal(why("Prodigy", "Half-Elf (Mark of Storm)"), "");
  assert.equal(why("Flames of Phlegethos", "Tiefling (Zariel)"), "");
  assert.equal(why("Elven Accuracy", "Pallid Elf"), "");
  assert.equal(why("Elven Accuracy", "Astral Elf"), "", "an astral elf counts as an elf");
  assert.equal(why("Bountiful Luck", "Ghostwise Halfling"), "");
  assert.equal(why("Dwarven Fortitude", "Dwarf (Mark of Warding)"), "");
  assert.equal(why("Squat Nimbleness", "Kender"), "", "a Small race");
  assert.notEqual(why("Prodigy", "Kalashtar"), "");
  assert.notEqual(why("Orcish Fury", "Human (Mark of Finding)"), "");
});

test("race resources: the new traits with uses", () => {
  const ids = (race) => characterResources(makeChar(race)).map((r) => r.key.replace(/^race:/, ""));
  assert.ok(ids("Astral Elf").includes("starlight_step"));
  assert.ok(ids("Kender").includes("fearless") && ids("Kender").includes("taunt"));
  assert.ok(ids("Leonin").includes("daunting_roar"));
  assert.ok(ids("Reborn").includes("knowledge_past_life"));
  const taunt = characterResources(makeChar("Kender")).find((r) => r.key === "race:taunt");
  assert.equal(taunt.max, 2, "proficiency bonus uses at level 4");
});

test("wizard: +2 and +1, or +1 to three different scores", (t) => {
  withFakeDom(t, () => {
    W.openWizard();
    Object.assign(W.wizardState, { race: "Owlin", abilities: { str: 10, dex: 14, con: 12, int: 10, wis: 15, cha: 8 } });
    const rc = W.wizardState.raceChoices;
    rc.abilities = ["dex", "wis"];
    assert.deepEqual(W.raceAbilityIncreases(), { dex: 2, wis: 1 });
    assert.equal(W.validateStep("raceChoices"), null);
    rc.alt = true;
    assert.deepEqual(W.raceAbilityAmounts(), [1, 1, 1]);
    assert.match(W.validateStep("raceChoices") || "", /3 different abilities/, "a third pick is needed");
    rc.abilities = ["dex", "wis", "con"];
    assert.deepEqual(W.raceAbilityIncreases(), { dex: 1, wis: 1, con: 1 });
    assert.equal(W.validateStep("raceChoices"), null);
    W.wizardState.race = "Hill Dwarf";
    assert.deepEqual(W.raceAbilityAmounts(), [], "a race without flexible increases");
  });
});

test("Half-Elf (Variant): one heritage trait in place of Skill Versatility, applied on the sheet", () => {
  const c = makeChar("Half-Elf (Variant)", { speed: 30, classes: [{ name: "Wizard", subclass: "", level: 1 }] });
  const pick = (trait, skills = []) => { c.racePicks = { profPicks: { "race:Half-Elf Versatility:pick": { slots: [[trait], skills] } } }; };
  assert.equal(H.computeSpeed(c).value, 30);
  pick("Fleet of Foot");
  assert.equal(H.computeSpeed(c).value, 35, "Fleet of Foot: 35 feet");
  assert.ok(H.computeSpeed(c).parts.some((p) => p.name === "Fleet of Foot" && p.value === 5));
  pick("Swim Speed");
  assert.ok(H.computeSpeed(c).others.some((o) => o.type === "swim" && o.value === 30), "a swimming speed of 30 feet");
  assert.ok(!H.isProficientWithWeapon(c, "Longsword", "martial"));
  pick("Elf Weapon Training");
  assert.ok(H.isProficientWithWeapon(c, "Longsword", "martial") && H.isProficientWithWeapon(c, "Longbow", "martial"), "elf weapon training");
  pick("Skill Versatility", ["Arcana", "Stealth"]);
  const g = CP.raceGrants(c).find((x) => x.name === "Half-Elf Versatility");
  assert.equal(CP.slotOptions(g.def, [["Skill Versatility"]], 1, CP.classPickContext(c, null, g.key)).length, 18, "any two skills");
  assert.equal(CP.slotOptions(g.def, [["Cantrip"]], 1, CP.classPickContext(c, null, g.key)).length, 0, "no skills with another trait");
  assert.deepEqual(CP.raceProficiencies(c).skills.sort(), ["Arcana", "Stealth"]);
  assert.deepEqual(RACE_CHOICES["Half-Elf (Variant)"], { abilityBonus: { amounts: [1, 1], exclude: ["cha"] } });
});

