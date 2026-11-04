/* The 2024 Player's Handbook's 16 backgrounds (2026-11-04, from 5etools'
   XPHB data): their data against the book, the kit-or-50-gp choice, the
   wizard's rule that their ability increases replace the race's, and the
   ten 2024 Origin feats they give, on the sheet. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as FP from "../js/core/feat-picks.js";
import * as W from "../js/wizard/wizard-core.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_PROFS } from "../js/data/backgrounds.js";
import { BACKGROUND_EQUIPMENT } from "../js/data/background-equipment.js";
import { kitItems, kitSlots } from "../js/core/background-gear.js";
import { storyTables } from "../js/core/background-story.js";
import { computeInitiative, maxHp } from "../js/core/vitals.js";
import { unarmedStrike } from "../js/core/equipment.js";
import { state } from "../js/core/state.js";
import { withFakeDom } from "./fake-dom.mjs";
import * as LU from "../js/levelup/session.js";
import { finish as finishLevelUp, undoLastLevelUp } from "../js/levelup/apply.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { STANDARD_LANGUAGES_2024 } from "../js/data/languages.js";

const GROUP = "Player's Handbook (2024)";
const BOOK = {
  // name: [abilities, feat, option, skills]
  "Acolyte": [["int","wis","cha"], "Magic Initiate (2024)", "Cleric", ["Insight","Religion"]],
  "Artisan": [["str","dex","int"], "Crafter", "", ["Investigation","Persuasion"]],
  "Charlatan": [["dex","con","cha"], "Skilled (2024)", "", ["Deception","Sleight of Hand"]],
  "Criminal": [["dex","con","int"], "Alert (2024)", "", ["Sleight of Hand","Stealth"]],
  "Entertainer": [["str","dex","cha"], "Musician", "", ["Acrobatics","Performance"]],
  "Farmer": [["str","con","wis"], "Tough (2024)", "", ["Animal Handling","Nature"]],
  "Guard": [["str","int","wis"], "Alert (2024)", "", ["Athletics","Perception"]],
  "Guide": [["dex","con","wis"], "Magic Initiate (2024)", "Druid", ["Stealth","Survival"]],
  "Hermit": [["con","wis","cha"], "Healer (2024)", "", ["Medicine","Religion"]],
  "Merchant": [["con","int","cha"], "Lucky (2024)", "", ["Animal Handling","Persuasion"]],
  "Noble": [["str","int","cha"], "Skilled (2024)", "", ["History","Persuasion"]],
  "Sage": [["con","int","wis"], "Magic Initiate (2024)", "Wizard", ["Arcana","History"]],
  "Sailor": [["str","dex","wis"], "Tavern Brawler (2024)", "", ["Acrobatics","Perception"]],
  "Scribe": [["dex","int","wis"], "Skilled (2024)", "", ["Investigation","Perception"]],
  "Soldier": [["str","dex","con"], "Savage Attacker (2024)", "", ["Athletics","Intimidation"]],
  "Wayfarer": [["dex","wis","cha"], "Lucky (2024)", "", ["Insight","Stealth"]]
};

test("2024 backgrounds: all 16 listed, with the book's scores, feat, skills, a tool, a kit and tables", () => {
  assert.deepEqual(BACKGROUNDS[GROUP], Object.keys(BOOK).map((n) => n + " (2024)"));
  for(const [base, [abilities, feat, option, skills]] of Object.entries(BOOK)){
    const name = base + " (2024)", info = BACKGROUND_INFO[name];
    assert.equal(info.edition, "2024", name);
    assert.deepEqual(info.abilities, abilities, name + ": abilities");
    assert.deepEqual(info.feat, option ? { name: feat, option } : { name: feat }, name + ": feat");
    const def = FP.featDef(feat);
    assert.ok(def, name + ": the feat exists");
    if(option) assert.ok(def.option.options.includes(option), name + ": option");
    assert.deepEqual(info.skills, skills, name + ": skills");
    const profs = BACKGROUND_PROFS[name];
    assert.equal((profs.tools || []).length + (profs.pick || []).length, 1, name + ": one tool");
    assert.equal(BACKGROUND_EQUIPMENT[name].orGold, 50, name + ": or 50 gp");
    assert.ok(storyTables(name).traits, name + ": personality tables to roll on");
    assert.ok(!/[–—;]/.test(info.blurb), name + ": plain text");
  }
  // Namesakes share their 2014 twin's story tables, too.
  assert.deepEqual(storyTables("Charlatan (2024)").story.map((t) => t.label), ["Scam"]);
  assert.equal(storyTables("Wayfarer (2024)").from, "Urchin");
});

test("2024 kits: the book's equipment and coins, or 50 gp and nothing else", () => {
  const text = (b, picks) => kitItems(b, picks || {}, { toolPicks: [] }, () => 0).items.map((i) => (i.qty > 1 ? i.qty + "x " : "") + i.name).join(", ");
  assert.equal(text("Scribe (2024)"), "Calligrapher's Supplies, Clothes, Fine, Lamp, 3x Oil (flask), 12x Parchment");
  assert.equal(text("Criminal (2024)"), "Dagger, Dagger, Thieves' Tools, Crowbar, 2x Pouch, Clothes, Traveler's");
  assert.equal(text("Hermit (2024)"), "Quarterstaff, Herbalism Kit, Bedroll, Book (philosophy), Lamp, 3x Oil (flask), Clothes, Traveler's");
  assert.deepEqual(kitItems("Scribe (2024)", {}).coins, { gp: 23 });
  // The first choice is the kit or the gold; gold asks nothing more.
  assert.deepEqual(kitSlots("Guard (2024)", {}).map((s) => s.key), ["gold", "3"]);
  assert.deepEqual(kitSlots("Guard (2024)", { gold: "gold" }).map((s) => s.key), ["gold"]);
  assert.deepEqual(kitItems("Guard (2024)", { gold: "gold" }), { items: [], coins: { gp: 50 }, notes: [] });
  // An older background has no such choice.
  assert.equal(kitSlots("Soldier", {})[0].key !== "gold", true);
});

test("2024 feats: the background's feat label reads naturally", () => {
  assert.equal(FP.backgroundFeatLabel("Acolyte (2024)"), "Magic Initiate (2024, Cleric)");
  assert.equal(FP.backgroundFeatLabel("Farmer (2024)"), "Tough (2024)");
  assert.equal(FP.backgroundFeatLabel("Artisan (2024)"), "Crafter");
  assert.deepEqual(FP.featToolChoices(FP.featDef("Crafter")).length, 8);
  assert.ok(FP.featToolChoices(FP.featDef("Musician")).includes("Lute"));
});

/* ---- The creation wizard ---- */
function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], alt: false, preset: "", profPicks: {}, feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Bg 2024", classId: "Fighter", race: "Hill Dwarf", background: "Soldier (2024)", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Acrobatics", "Insight"],
    classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }, bgPicks: { "bg:Soldier (2024):pick": [["Dice set"]] }
  }, choices, { raceChoices: rc });
}
const inWizard = (t, choices, fn) => { let out; withFakeDom(t, () => { startWizard(choices); out = fn(); }); return out; };

test("wizard: a 2024 background's +2/+1 or +1/+1/+1 replaces the race's increases", (t) => {
  // A hill dwarf with an older background: +2 CON, +1 WIS.
  assert.deepEqual(inWizard(t, { background: "Soldier" }, () => W.finalAbilities()), { str: 15, dex: 14, con: 15, int: 8, wis: 13, cha: 10 });
  // With the 2024 Soldier: nothing from the race, the background's picks instead.
  assert.deepEqual(inWizard(t, {}, () => W.finalAbilities()), { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 });
  assert.deepEqual(inWizard(t, { bgAbilities: { background: "Soldier (2024)", inc: { str: 2, con: 1 } } }, () => W.finalAbilities()),
    { str: 17, dex: 14, con: 14, int: 8, wis: 12, cha: 10 });
  assert.deepEqual(inWizard(t, { bgAbilities: { background: "Soldier (2024)", inc: { str: 1, dex: 1, con: 1 } } }, () => W.finalAbilities()),
    { str: 16, dex: 15, con: 14, int: 8, wis: 12, cha: 10 });
  // Picks for another background (it was changed since) don't count.
  assert.deepEqual(inWizard(t, { bgAbilities: { background: "Sage (2024)", inc: { str: 2, con: 1 } } }, () => W.backgroundAbilityIncreases()), {});
  // A score can't go past 20.
  assert.equal(inWizard(t, { abilityMethod: "manual", abilities: { str: 19, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    bgAbilities: { background: "Soldier (2024)", inc: { str: 2, dex: 1 } } }, () => W.finalAbilities().str), 20);
});

test("wizard: the Ability Scores step asks for the background's picks, not the race's", (t) => {
  assert.match(inWizard(t, {}, () => W.validateStep("abilities")), /^Your Soldier \(2024\) background has 3 more points to give: tap a score for \+1, tap it again for \+2\.$/);
  assert.match(inWizard(t, { bgAbilities: { background: "Soldier (2024)", inc: { str: 2 } } }, () => W.validateStep("abilities")), /has 1 more point to give/);
  assert.equal(inWizard(t, { bgAbilities: { background: "Soldier (2024)", inc: { str: 2, dex: 1 } } }, () => W.validateStep("abilities")), null);
  assert.equal(inWizard(t, { bgAbilities: { background: "Soldier (2024)", inc: { str: 1, dex: 1, con: 1 } } }, () => W.validateStep("abilities")), null);
  assert.equal(inWizard(t, { background: "Soldier" }, () => W.validateStep("abilities")), null, "an older background asks nothing here");
  // A race's score picks are skipped: Race Traits only for a trait's choice (a half-elf's
  // two skills) or a feat (a variant human's).
  for(const race of ["Fairy", "Giff", "Plasmoid", "Changeling"]){
    assert.equal(inWizard(t, { race }, () => W.isStepApplicable("raceChoices") === W.wizardRacePickGrants().length > 0), true, race);
    assert.equal(inWizard(t, { race, background: "Soldier" }, () => W.isStepApplicable("raceChoices")), true, race + " (older background)");
  }
  assert.equal(inWizard(t, { race: "Half-Elf" }, () => W.isStepApplicable("raceChoices")), true);
  assert.equal(inWizard(t, { race: "Half-Elf" }, () => W.raceAbilityPicksNeeded()), 0);
  assert.equal(inWizard(t, { race: "Variant Human" }, () => W.isStepApplicable("raceChoices")), true);
  assert.doesNotMatch(inWizard(t, { race: "Variant Human", raceChoices: { feat: "Alert" } }, () => W.validateStep("raceChoices")), /abilit/, "no score picks asked");
  assert.match(inWizard(t, { race: "Variant Human", background: "Soldier", raceChoices: { feat: "Alert" } }, () => W.validateStep("raceChoices")), /abilities to increase/);
});

test("wizard: a 2024 Farmer fighter ends with the background's scores, feat, skills, tool and kit", (t) => {
  const c = inWizard(t, { background: "Farmer (2024)", bgPicks: {}, bgAbilities: { background: "Farmer (2024)", inc: { con: 2, str: 1 } } },
    () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.deepEqual(c.abilities, { str: 16, dex: 14, con: 15, int: 8, wis: 12, cha: 10 }, "no dwarf +2 CON / +1 WIS");
  assert.ok(c.feats.some((f) => f.name === "Tough (2024)" && f.from === "Farmer (2024)"));
  assert.equal(c.hp.max, 10 + 2, "d10 + CON");
  assert.equal(maxHp(c), 10 + 2 + 2 + 1, "+ Tough's 2 and the hill dwarf's 1 per level");
  assert.ok(c.skillProfs["Animal Handling"].prof && c.skillProfs.Nature.prof);
  assert.ok(c.inventory.some((i) => i.name === "Carpenter's Tools") && c.inventory.some((i) => i.name === "Sickle"));
  assert.equal(c.currency.gp >= 30, true);
});

/* ---- The 2024 feats on the sheet ---- */
function char(level, feats){
  return { abilities: { str: 14, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }, saveProfs: {}, skillProfs: {}, classes: [{ name: "Fighter", level }],
    inventory: [], feats: feats.map((name, i) => ({ id: "f" + i, name })), features: [], spells: [], languages: ["Common"], resourcesUsed: {},
    race: "Human", initiativeMisc: 0, acMisc: 0, speed: 30, hp: { max: 10, current: 10, temp: 0 } };
}

test("2024 feats: Alert adds the proficiency bonus, Lucky has that many points, Tough and Tavern Brawler count", () => {
  assert.equal(computeInitiative(char(5, ["Alert (2024)"])).value, 2 + 3);
  assert.equal(computeInitiative(char(5, ["Alert"])).value, 2 + 5, "the 2014 feat is still +5");
  const luck = H.characterResources(char(9, ["Lucky (2024)"])).find((r) => r.name === "Luck Points");
  assert.equal(luck.max, 4);
  assert.equal(luck.reset, "long");
  assert.equal(maxHp(char(3, ["Tough (2024)"])), 10 + 6);
  assert.equal(unarmedStrike(char(1, ["Tavern Brawler (2024)"])).die, 4);
});

test("2024 feats: Magic Initiate's list is set by the background, with a casting ability to pick", () => {
  const def = FP.featDef("Magic Initiate (2024)");
  const picks = FP.backgroundFeatPicks("Guide (2024)", def.name);
  assert.equal(picks.option, "Druid");
  const groups = FP.featSpellGroups(def, picks, { pb: 2 });
  assert.deepEqual(groups.map((g) => [g.level, g.count]), [[0, 2], [1, 1]]);
  assert.ok(groups[1].options.includes("Goodberry"));
  assert.match(FP.featPicksProblem(def, picks, { pb: 2, skillProfs: {}, abilities: {} }), /spellcasting ability/);
});

/* ---- The 2024 character rules switch (older races and backgrounds, p. 38) ---- */
test("wizard: under the 2024 rules an older background raises any scores, the race's are left out", (t) => {
  const on = { background: "Soldier", bgPicks: { "bg:Soldier:pick": [["Dice set"]] }, rules2024: true };
  assert.deepEqual(inWizard(t, on, () => W.wizardBgScoreRule()), { abilities: ["str", "dex", "con", "int", "wis", "cha"], any: true });
  assert.deepEqual(inWizard(t, { ...on, bgAbilities: { background: "Soldier", inc: { wis: 2, str: 1 } } }, () => W.finalAbilities()),
    { str: 16, dex: 14, con: 13, int: 8, wis: 14, cha: 10 }, "WIS +2, STR +1, no dwarf +2 CON / +1 WIS");
  assert.match(inWizard(t, { ...on, bgAbilities: { background: "Soldier", inc: { str: 1, dex: 1 } } }, () => W.validateStep("abilities")), /1 more point/);
  assert.deepEqual(inWizard(t, { ...on, bgAbilities: { background: "Soldier", inc: { str: 1, dex: 1, cha: 1 } } }, () => W.backgroundAbilityIncreases()), { str: 1, dex: 1, cha: 1 });
  // Taps: 0, +1, +2, back to 0; never past 3 points or 20.
  const taps = (start, keys) => inWizard(t, { ...on, bgAbilities: { background: "Soldier", inc: start } }, () => { keys.forEach((k) => W.tapBgIncrease(k)); return W.backgroundAbilityIncreases(); });
  assert.deepEqual(taps({}, ["str"]), { str: 1 });
  assert.deepEqual(taps({}, ["str", "str"]), { str: 2 });
  assert.deepEqual(taps({}, ["str", "str", "str"]), {});
  assert.deepEqual(taps({}, ["str", "str", "con"]), { str: 2, con: 1 });
  assert.deepEqual(taps({ str: 2, con: 1 }, ["wis"]), { str: 2, con: 1 }, "no points left: nothing");
  assert.deepEqual(taps({ str: 2, con: 1 }, ["con"]), { str: 2 }, "a +1 can't become a second +2: back to 0");
  assert.deepEqual(taps({ str: 1, dex: 1, con: 1 }, ["str"]), { dex: 1, con: 1 }, "three +1s: a tap takes one back");
  assert.deepEqual(taps({ str: 1, dex: 1 }, ["str"]), { str: 2, dex: 1 }, "two +1s: one becomes +2");
  // Off: the 2014 rules, the dwarf's increases.
  assert.equal(inWizard(t, { background: "Soldier" }, () => W.wizardBgScoreRule()), null);
});

test("wizard: under the 2024 rules a background without a feat gives an Origin feat, before a campaign's", (t) => {
  const on = { background: "Soldier", bgPicks: { "bg:Soldier:pick": [["Dice set"]] }, rules2024: true, campaign: "Dragonlance" };
  const g = inWizard(t, on, () => W.wizardBackgroundFeat());
  assert.equal(g.origin, true);
  assert.equal(g.choices.length, 10);
  assert.ok(g.choices.includes("Tough (2024)") && g.choices.includes("Crafter") && !g.choices.includes("Tough"));
  assert.equal(inWizard(t, on, () => W.wizardStepTitle("bgFeat")), "Origin Feat");
  assert.equal(inWizard(t, on, () => W.validateStep("bgFeat")), "Pick an Origin feat.");
  // A background with its own feat keeps it.
  assert.equal(inWizard(t, { ...on, background: "Wildspacer" }, () => W.wizardBackgroundFeat().def.name), "Tough");
  const c = inWizard(t, { ...on, originFeat: "Tough (2024)", bgAbilities: { background: "Soldier", inc: { str: 2, con: 1 } } },
    () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.equal(c.rules2024, true);
  assert.ok(c.feats.some((f) => f.name === "Tough (2024)" && f.origin2024 && f.from === "Soldier"));
  assert.ok(!c.feats.some((f) => f.campaign), "no Dragonlance feat as well");
  assert.equal(FP.campaignFeatMissing(c), null);
  assert.equal(FP.originFeatMissing(c), null);
  // A sheet switched to the 2024 rules later is offered the feat.
  const old = { background: "Soldier", feats: [], rules2024: true };
  assert.equal(FP.originFeatMissing(old).choices.length, 10);
  assert.equal(FP.originFeatMissing({ ...old, originFeatSkipped: "Soldier" }), null);
  assert.equal(FP.originFeatMissing({ ...old, background: "Wildspacer" }), null);
});

test("wizard: under the 2024 rules a character knows at least three languages", (t) => {
  const slots = (choices) => inWizard(t, choices, () => W.languagePlan().slots.filter((s) => s.source === "the 2024 rules"));
  // A hill dwarf knows Common and Dwarvish: one more, from the 2024 Standard Languages table.
  const dwarf = slots({});
  assert.equal(dwarf.length, 1);
  assert.deepEqual(dwarf[0].options, STANDARD_LANGUAGES_2024);
  assert.ok(STANDARD_LANGUAGES_2024.includes("Draconic") && STANDARD_LANGUAGES_2024.includes("Common Sign Language"));
  assert.equal(slots({ race: "Half-Elf" }).length, 0, "Common, Elvish and one of choice already");
  assert.equal(slots({ background: "Soldier" }).length, 0, "2014 rules: nothing added");
  assert.equal(slots({ background: "Soldier", bgPicks: { "bg:Soldier:pick": [["Dice set"]] }, rules2024: true }).length, 1);
  assert.match(inWizard(t, { languageChoices: ["Abyssal"] }, () => W.validateStep("languages")), /Standard Languages table/);
  assert.equal(inWizard(t, { languageChoices: ["Elvish"] }, () => W.validateStep("languages")), null);
});

/* ---- Magic Initiate (2024)'s Spell Change at level-up ---- */
test("level-up: Magic Initiate (2024) swaps one spell for another of the same level, undone with the level", (t) => {
  const c = ensureShape(Object.assign(newCharacter("Sage"), { classes: [{ name: "Fighter", level: 2 }], xp: 355000,
    hp: { max: 20, current: 20, temp: 0 }, abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 } }));
  c.feats = [{ id: "mi", name: "Magic Initiate (2024)", picks: { option: "Wizard", castAbility: "int", spells: ["Fire Bolt", "Light", "Shield"] } }];
  let applicable, offered, blocked;
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    applicable = LU.stepApplicable("featSpells");
    offered = LU.spellChangeOptions(c.feats[0], 2);
    LU.lu.featSwaps = { mi: { index: "2", to: "" } };
    blocked = LU.validate("featSpells");
    LU.lu.featSwaps.mi.to = "Magic Missile";
    LU.lu.hpMethod = "avg";
    finishLevelUp();
  });
  assert.equal(applicable, true);
  assert.ok(offered.includes("Magic Missile") && !offered.includes("Shield") && !offered.includes("Fire Bolt"), "level 1 wizard spells, not ones it has");
  assert.match(blocked, /replaces Shield/);
  assert.deepEqual(c.feats[0].picks.spells, ["Fire Bolt", "Light", "Magic Missile"]);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual(c.feats[0].picks.spells, ["Fire Bolt", "Light", "Shield"]);
  // No step for a 2014 Magic Initiate.
  c.feats = [{ id: "mi14", name: "Magic Initiate", picks: { option: "Wizard", spells: ["Fire Bolt", "Light", "Shield"] } }];
  withFakeDom(t, () => { LU.openLevelUp(c); applicable = LU.stepApplicable("featSpells"); LU.close(); });
  assert.equal(applicable, false);
});
