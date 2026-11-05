/* The 2024 Player's Handbook's ten species (pp. 186-197, checked against
   books/Players_Handbook_2024 on 2026-11-05): their data, what their
   choices do on the sheet (lineages, legacies, ancestries, boons), their
   uses and Active effects, and that picking one turns the 2024 character
   rules on (scores from the background, Common plus two languages, an
   Origin feat). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import * as W from "../js/wizard/wizard-core.js";
import { RACES, RACE_TRAITS, RACE_LANGUAGES, RACE_CHOICES } from "../js/data/races.js";
import { RACE_DATA, raceAsiText, raceAsiShort } from "../js/data/race-data.js";
import { characterResources } from "../js/core/character-resources.js";
import { computeSpeed, computeDarkvision, getCharacterSenses, maxHp } from "../js/core/vitals.js";
import { draconicBreath, raceWards, raceTraitFeatures } from "../js/core/class-features.js";
import { usesRules2024, originFeatMissing } from "../js/core/feat-picks.js";
import { resourcefulOnLongRest } from "../js/core/species-2024.js";
import { rules2024Lock } from "../js/ui/dlc-shelf.js";
import { saveRollMode, checkRollMode } from "../js/core/checks.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { withFakeDom } from "./fake-dom.mjs";

const GROUP = "Player's Handbook (2024)";
// name: [size, speed, darkvision, traits]
const BOOK = {
  "Aasimar": ["Small or Medium", 30, 60, ["Size", "Celestial Resistance", "Healing Hands", "Light Bearer", "Celestial Revelation"]],
  "Dragonborn": ["Medium", 30, 60, ["Draconic Ancestry", "Breath Weapon", "Damage Resistance", "Draconic Flight"]],
  "Dwarf": ["Medium", 30, 120, ["Dwarven Resilience", "Dwarven Toughness", "Stonecunning"]],
  "Elf": ["Medium", 30, 60, ["Elven Lineage", "Fey Ancestry", "Keen Senses", "Trance"]],
  "Gnome": ["Small", 30, 60, ["Gnomish Cunning", "Gnomish Lineage"]],
  "Goliath": ["Medium", 35, 0, ["Giant Ancestry", "Large Form", "Powerful Build"]],
  "Halfling": ["Small", 30, 0, ["Brave", "Halfling Nimbleness", "Luck", "Naturally Stealthy"]],
  "Human": ["Small or Medium", 30, 0, ["Size", "Resourceful", "Skillful", "Versatile"]],
  "Orc": ["Medium", 30, 120, ["Adrenaline Rush", "Relentless Endurance"]],
  "Tiefling": ["Small or Medium", 30, 60, ["Size", "Fiendish Legacy", "Otherworldly Presence"]]
};

/* A level `level` fighter of this species, with these trait picks
   ({trait: [[slot 0], [slot 1], ...]}). */
function makeChar(race, level = 1, picks = {}, extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { race, speed: (RACE_DATA[race] || {}).speed ? RACE_DATA[race].speed.walk : 30, classes: [{ name: "Fighter", subclass: "", level }],
    abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 13, cha: 15 } }, extra);
  const out = ensureShape(c);
  Object.keys(picks).forEach((t) => { out.racePicks.profPicks["race:" + t + ":pick"] = { slots: picks[t], applied: {} }; });
  return out;
}
const spells = (c) => H.featureSpells(c).filter((fs) => fs.source === c.race);
const res = (c, key) => characterResources(c).find((r) => r.key === key);

test("2024 species: all ten listed, with the book's size, speed, darkvision and traits, and no increases or extra languages", () => {
  assert.deepEqual(RACES[GROUP], Object.keys(BOOK).map((n) => n + " (2024)"));
  for(const [base, [size, speed, dark, traits]] of Object.entries(BOOK)){
    const name = base + " (2024)", d = RACE_DATA[name];
    assert.equal(d.edition, "2024", name);
    assert.equal(d.size, size, name + ": size");
    assert.deepEqual(d.speed, { walk: speed }, name + ": speed");
    assert.equal(d.darkvision, dark, name + ": darkvision");
    assert.deepEqual(d.traits.map((t) => t.name), traits, name + ": traits");
    assert.equal(d.asi, undefined, name + ": no increases");
    assert.deepEqual(RACE_LANGUAGES[name], { fixed: ["Common"] }, name + ": Common (the 2024 rules add two)");
    assert.equal(d.source, "Player's Handbook (2024)");
    for(const t of d.traits) assert.ok(!/[–—;]/.test(t.text), name + ": " + t.name + " is plain text");
    // Small or Medium: the size is asked, with the 2024 heavy weapon rule, not the 2014 one.
    if(size === "Small or Medium") assert.match(d.traits.find((t) => t.name === "Size").text, /need Strength 13/);
  }
  assert.equal(raceAsiText(RACE_DATA["Elf (2024)"]), "Ability scores come from your background");
  assert.equal(raceAsiShort(RACE_DATA["Elf (2024)"]), "Background");
  assert.equal(RACE_TRAITS["Orc (2024)"], "Darkvision 120ft. Adrenaline Rush, Relentless Endurance.");
  assert.equal(RACE_TRAITS["Halfling (2024)"], "Brave, Halfling Nimbleness, Luck, Naturally Stealthy.");
});

test("a 2024 species turns the 2024 character rules on, and the Optional rules card says so", () => {
  assert.equal(usesRules2024(makeChar("Elf (2024)")), true);
  assert.equal(usesRules2024(makeChar("High Elf")), false);
  assert.equal(rules2024Lock("2024", ""), "On for your 2024 species");
  assert.equal(rules2024Lock("", "2024"), "On for your 2024 background");
  assert.equal(rules2024Lock(undefined, undefined), "");
  // An older background then gives an Origin feat.
  assert.ok(originFeatMissing(makeChar("Orc (2024)", 1, {}, { background: "Soldier" })));
});

test("Dwarf (2024): darkvision 120, +1 HP a level, poison resistance and Stonecunning's tremorsense", () => {
  const c = makeChar("Dwarf (2024)", 3);
  assert.equal(computeDarkvision(c).range, 120);
  assert.equal(maxHp(c), maxHp(makeChar("Human (2024)", 3)) + 3, "Dwarven Toughness");
  assert.deepEqual(raceWards(c).resist.map((w) => w.type), ["poison"]);
  assert.equal(res(c, "race:stonecunning").max, 2, "proficiency bonus");
  assert.equal(computeSpeed(c).value, 30, "no 2014 dwarf's 25 ft");
  assert.doesNotMatch(getCharacterSenses(c), /Tremorsense/);
  c.effects = { stonecunning: true };
  assert.match(getCharacterSenses(c), /Tremorsense 60 ft/);
});

test("Elf (2024): the lineage sets darkvision, speed and spells, cast with the ability picked", () => {
  const drow = makeChar("Elf (2024)", 5, { "Elven Lineage": [["Drow"], ["Wisdom"]] });
  assert.equal(computeDarkvision(drow).range, 120);
  assert.deepEqual(spells(drow).map((s) => s.name), ["Dancing Lights", "Faerie Fire", "Darkness"]);
  assert.equal(spells(drow).find((s) => s.name === "Faerie Fire").feature, "Elven Lineage");
  assert.match(spells(drow).find((s) => s.name === "Darkness").note, /Free once per long rest, or cast it with a spell slot\. Uses Wisdom/);
  assert.deepEqual(spells(makeChar("Elf (2024)", 2, { "Elven Lineage": [["Drow"], ["Wisdom"]] })).map((s) => s.name), ["Dancing Lights"], "level 3 and 5 spells wait");
  const wood = makeChar("Elf (2024)", 3, { "Elven Lineage": [["Wood Elf"], ["Charisma"]] });
  assert.equal(computeSpeed(wood).value, 35);
  assert.equal(computeDarkvision(wood).range, 60);
  assert.deepEqual(spells(wood).map((s) => s.name), ["Druidcraft", "Longstrider"]);
  assert.ok(res(wood, "race:spell:longstrider"), "a free cast on Vitals");
  // High Elf: the wizard cantrip starts on Prestidigitation and can be changed.
  const g = CP.raceGrants(makeChar("Elf (2024)")).find((x) => x.name === "Elven Lineage");
  const slots = CP.fillSlots(g.def, [["High Elf"], ["Intelligence"]], {});
  assert.deepEqual(slots[2], ["Prestidigitation"]);
  assert.deepEqual(CP.fillSlots(g.def, [["High Elf"], ["Intelligence"], ["Fire Bolt"]], {})[2], ["Fire Bolt"]);
  assert.equal(CP.fillSlots(g.def, [["Drow"], ["Intelligence"]], {})[2], null, "only a high elf has the pick");
  const high = makeChar("Elf (2024)", 5, { "Elven Lineage": [["High Elf"], ["Intelligence"], ["Fire Bolt"]] });
  assert.deepEqual(spells(high).map((s) => s.name), ["Fire Bolt", "Detect Magic", "Misty Step"]);
  // Keen Senses: one of three skills. Fey Ancestry: charmed only.
  const keen = RACE_DATA["Elf (2024)"].traits.find((t) => t.name === "Keen Senses");
  assert.deepEqual(keen.profs.pick[0].options, ["Insight", "Perception", "Survival"]);
  assert.equal(H.advantagesFor(wood).find((a) => a.name === "Fey Ancestry").when, "to avoid or end being charmed");
});

test("Gnome (2024): advantage on INT, WIS and CHA saves, and a lineage's spells", () => {
  const c = makeChar("Gnome (2024)", 1, { "Gnomish Lineage": [["Forest Gnome"], ["Intelligence"]] });
  assert.equal(saveRollMode(c, "wis").mode, "adv");
  assert.equal(saveRollMode(c, "str").mode, "none");
  assert.deepEqual(spells(c).map((s) => s.name), ["Minor Illusion", "Speak with Animals"]);
  const animals = spells(c).find((s) => s.name === "Speak with Animals");
  assert.equal(animals.kindLabel, "Free (PB)/long rest");
  assert.match(animals.note, /^Free a number of times equal to your proficiency bonus per long rest, or cast it with a spell slot\./);
  assert.equal(res(c, "race:spell:speak_with_animals").max, 2);
  const rock = makeChar("Gnome (2024)", 1, { "Gnomish Lineage": [["Rock Gnome"], ["Wisdom"]] });
  assert.deepEqual(spells(rock).map((s) => s.name), ["Mending", "Prestidigitation"]);
  assert.match(spells(rock)[0].note, /Uses Wisdom/);
});

test("Tiefling (2024): the legacy's resistance and spells, and Thaumaturgy with the same ability", () => {
  const c = makeChar("Tiefling (2024)", 5, { "Fiendish Legacy": [["Chthonic"], ["Charisma"]] });
  assert.deepEqual(raceWards(c).resist, [{ type: "necrotic", source: "Fiendish Legacy" }]);
  assert.deepEqual(spells(c).map((s) => s.name).sort(), ["Chill Touch", "False Life", "Ray of Enfeeblement", "Thaumaturgy"]);
  assert.match(spells(c).find((s) => s.name === "Thaumaturgy").note, /Uses Charisma/);
  const infernal = makeChar("Tiefling (2024)", 3, { "Fiendish Legacy": [["Infernal"], ["Intelligence"]] });
  assert.deepEqual(raceWards(infernal).resist.map((w) => w.type), ["fire"]);
  assert.match(spells(infernal).find((s) => s.name === "Thaumaturgy").note, /Uses Intelligence/);
  assert.equal(spells(infernal).find((s) => s.name === "Hellish Rebuke").castAt, undefined, "cast at its own level");
});

test("Dragonborn (2024): every dragon, 1d10 breath a proficiency bonus of times, a cone or a line, and Draconic Flight from 5", () => {
  const c = makeChar("Dragonborn (2024)", 5, { "Draconic Ancestry": [["Silver dragon"]] });
  const b = draconicBreath(c);
  assert.deepEqual([b.damage, b.area, b.save, b.die, b.dice, b.uses, b.reset, b.attack], ["Cold", "15 ft cone or 30 ft line", "DEX", 10, 2, 3, "long", true]);
  assert.deepEqual(raceWards(c).resist.map((w) => w.type), ["cold"]);
  assert.equal(Object.keys(RACE_DATA["Dragonborn (2024)"].traits[0].profs.pick[0].details).length, 10);
  assert.ok(res(c, "race:draconic_flight"));
  assert.ok(!res(makeChar("Dragonborn (2024)", 4), "race:draconic_flight"), "from level 5");
  c.effects = { draconic_flight: true };
  assert.ok(computeSpeed(c).others.some((o) => o.type === "fly" && o.value === 30 && o.source === "Draconic Flight"));
});

test("Goliath (2024): the giant boon picked, with its roll, and Large Form from 5", () => {
  const c = makeChar("Goliath (2024)", 5, { "Giant Ancestry": [["Stone's Endurance"]] });
  const boons = characterResources(c).filter((r) => /^race:giant_/.test(r.key));
  assert.deepEqual(boons.map((r) => r.key), ["race:giant_stones_endurance"], "only the boon picked");
  assert.deepEqual([boons[0].max, boons[0].reset, boons[0].roll.die, boons[0].roll.bonus], [3, "long", 12, 2], "PB uses, 1d12 + CON");
  const fire = res(makeChar("Goliath (2024)", 1, { "Giant Ancestry": [["Fire's Burn"]] }), "race:giant_fires_burn");
  assert.equal(fire.roll.die, 10);
  assert.ok(res(c, "race:large_form"));
  assert.equal(computeSpeed(c).value, 35);
  c.effects = { large_form: true };
  assert.equal(computeSpeed(c).value, 45);
  assert.equal(checkRollMode(c, "str").mode, "adv");
  assert.equal(H.advantagesFor(c).find((a) => a.name === "Powerful Build").when, "to end being grappled");
});

test("Aasimar, Orc, Halfling and Human (2024): their uses, DCs and reminders", () => {
  const a = makeChar("Aasimar (2024)", 5);
  const hands = res(a, "race:healing_hands_2024");
  assert.deepEqual([hands.roll.qty, hands.roll.die, hands.max], [3, 4, 1], "proficiency bonus d4s");
  assert.match(res(a, "race:celestial_revelation_2024").hint, /3 extra damage/);
  assert.deepEqual(raceWards(a).resist.map((w) => w.type), ["necrotic", "radiant"]);
  const card = raceTraitFeatures(a).find((f) => f.name === "Celestial Revelation");
  assert.match(card.text, /Necrotic Shroud save DC 13 \(8 \+ 3 \(proficiency\) \+ 2 \(Charisma\)\)\./);
  assert.ok(!res(makeChar("Aasimar (2024)", 2), "race:celestial_revelation_2024"), "from level 3");
  const orc = makeChar("Orc (2024)", 1);
  assert.equal(res(orc, "race:adrenaline_rush").max, 2);
  assert.equal(res(orc, "race:adrenaline_rush").reset, "short");
  assert.equal(res(orc, "race:adrenaline_rush").hint, "Bonus action: Dash, and gain 2 temporary hit points.");
  assert.equal(res(orc, "race:adrenaline_rush").source, "Orc");
  assert.ok(res(orc, "race:relentless_endurance_2024"));
  assert.equal(computeDarkvision(orc).range, 120);
  assert.equal(H.advantagesFor(makeChar("Halfling (2024)")).find((a) => a.name === "Brave").when, "to avoid or end being frightened");
  // Resourceful: Heroic Inspiration after a long rest, never more than one from it.
  const human = makeChar("Human (2024)");
  human.inspiration = 0;
  assert.equal(resourcefulOnLongRest(human), true);
  assert.equal(human.inspiration, 1);
  assert.equal(resourcefulOnLongRest(human), false);
  const other = makeChar("Human");
  other.inspiration = 0;
  assert.equal(resourcefulOnLongRest(other), false);
  assert.deepEqual(RACE_CHOICES["Human (2024)"], { feat: { origin: true } });
});

/* ---- The creation wizard ---- */
function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], alt: false, preset: "", profPicks: {}, feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Species 2024", classId: "Fighter", race: "Orc (2024)", background: "Soldier", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Acrobatics", "Insight"],
    classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }
  }, choices, { raceChoices: rc });
}
const inWizard = (t, choices, fn) => { let out; withFakeDom(t, () => { startWizard(choices); out = fn(); }); return out; };

test("wizard: a 2024 species with an older background follows the 2024 rules", (t) => {
  assert.equal(inWizard(t, {}, () => W.wizardRules2024()), true);
  assert.equal(inWizard(t, { race: "Half-Orc" }, () => W.wizardRules2024()), false);
  // The background raises any scores: +2/+1 or three +1s.
  assert.deepEqual(inWizard(t, {}, () => W.wizardBgScoreRule()), { abilities: ["str", "dex", "con", "int", "wis", "cha"], any: true });
  assert.deepEqual(inWizard(t, { bgAbilities: { background: "Soldier", inc: { str: 2, con: 1 } } }, () => W.finalAbilities()),
    { str: 17, dex: 14, con: 14, int: 8, wis: 12, cha: 10 });
  // Common and two more languages.
  const plan = inWizard(t, {}, () => W.languagePlan());
  assert.deepEqual(plan.fixed, ["Common"]);
  assert.equal(plan.slots.filter((s) => s.source === "the 2024 rules").length, 2);
  // An Origin feat for a background without one.
  assert.ok(inWizard(t, {}, () => W.wizardBackgroundFeat()).origin);
});

test("wizard: a 2024 human picks an Origin feat (Versatile), a skill and a size", (t) => {
  assert.equal(inWizard(t, { race: "Human (2024)" }, () => W.isStepApplicable("feat")), true);
  assert.equal(inWizard(t, { race: "Human (2024)" }, () => W.isStepApplicable("raceChoices")), true);
  const c = inWizard(t, { race: "Human (2024)", background: "Farmer (2024)", bgAbilities: { background: "Farmer (2024)", inc: { str: 2, con: 1 } },
    raceChoices: { feat: "Skilled (2024)", featPicks: { skills: ["Arcana", "History", "Nature"] },
      profPicks: { "race:Size:pick": [["Small"]], "race:Skillful:pick": [["Perception"]] } } }, () => {
    W.finishWizard(); return state.characters[state.characters.length - 1];
  });
  assert.ok(c.feats.some((f) => f.name === "Skilled (2024)"));
  assert.ok(c.feats.some((f) => f.name === "Tough (2024)"), "and the background's");
  assert.equal(CP.raceSize(c), "Small");
  assert.ok(CP.raceProficiencies(c).skills.includes("Perception"), "Skillful");
  assert.equal(usesRules2024(c), true);
});
