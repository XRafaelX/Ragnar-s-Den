/* The Haunted One background, the Fey Touched feat and the warlock's
   eldritch invocations and Pact Boon: every rule and branch the sheet,
   the creation wizard and the level-up apply for them. The wizard and the
   level-up undo run for real on the stand-in DOM from fake-dom.mjs. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as FP from "../js/core/feat-picks.js";
import * as INV from "../js/core/invocations.js";
import * as W from "../js/wizard/wizard-core.js";
import { newCharacter } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { undoLastLevelUp } from "../js/levelup/levelup.js";
import { renderInvocationsCard } from "../js/render/panels/invocations.js";
import { BACKGROUND_INFO, BACKGROUND_LANGUAGES } from "../js/data/backgrounds.js";
import { SPELL_DATA, spellsMatching } from "../js/data/spells.js";
import { INVOCATIONS, invocationDef, pactBoonDef, invocationsKnownAt } from "../js/data/invocations.js";
import { withFakeDom } from "./fake-dom.mjs";

/* A full character from the app's own factory. */
function makeChar(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  Object.assign(c.abilities, { str: 10, dex: 14, con: 14, int: 10, wis: 12, cha: 16 }, extra.abilities || {});
  Object.keys(extra).forEach((k) => { if(k !== "abilities") c[k] = extra[k]; });
  return c;
}
const warlock = (level, extra = {}, entry = {}) => makeChar([{ name: "Warlock", subclass: "The Fiend", level, ...entry }], extra);
const names = (cl) => INV.knownInvocations(cl).map((e) => e.name);
const reason = (c, cl, name, over) => INV.invocationReason(invocationDef(name), INV.invocationContext(c, cl, over));

/* ================================================================
   Haunted One and background skill picks (creation wizard)
   ================================================================ */
function startWizard(choices){
  W.openWizard();
  Object.assign(W.wizardState, {
    name: "Wizard test", classId: "Warlock", race: "Human", background: "Haunted One", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    skillChoices: ["Deception", "Intimidation"], bgSkillChoices: ["Arcana", "Religion"],
    languageChoices: ["Dwarvish", "Abyssal", "Elvish"], classChoices: { subclass: "The Fiend" }, equipment: {}
  }, choices);
}
function inWizard(t, choices, fn){
  let out;
  withFakeDom(t, () => { startWizard(choices); out = fn(); });
  return out;
}

test("background skills: fixed ones plus the picks, dropping picks that don't fit", (t) => {
  assert.deepEqual(inWizard(t, {}, () => W.wizardBackgroundSkills()), ["Arcana", "Religion"]);
  // Only the background's own options count, and only up to its count.
  assert.deepEqual(inWizard(t, { bgSkillChoices: ["Stealth", "Survival", "Arcana", "Religion"] }, () => W.wizardBackgroundSkills()), ["Survival", "Arcana"]);
  // A background with fixed skills and one pick (Cloistered Scholar: History + one).
  assert.deepEqual(inWizard(t, { background: "Cloistered Scholar", bgSkillChoices: ["Nature"] }, () => W.wizardBackgroundSkills()), ["History", "Nature"]);
  // Without a skillPick, leftover picks are ignored.
  assert.deepEqual(inWizard(t, { background: "Acolyte", bgSkillChoices: ["Arcana"] }, () => W.wizardBackgroundSkills()), ["Insight", "Religion"]);
  // And they reach the skill list feats and race traits check against.
  const profs = inWizard(t, {}, () => W.wizardSkillProfs());
  assert.ok(profs.Arcana.prof && profs.Religion.prof && profs.Deception.prof && !profs.Survival);
});

test("background skills: the Skills step needs them, and not the same as the class picks", (t) => {
  const err = (choices) => inWizard(t, choices, () => W.validateStep("skills"));
  assert.equal(err({}), null);
  assert.match(err({ skillChoices: ["Deception"] }), /Choose 2 skills from your class list/);
  assert.match(err({ bgSkillChoices: [] }), /Choose 2 skills from your Haunted One background/);
  assert.match(err({ bgSkillChoices: ["Arcana"] }), /Choose 2 skills/);
  assert.match(err({ background: "Inheritor", bgSkillChoices: [] }), /Choose a skill from your Inheritor background/);
  assert.match(err({ skillChoices: ["Arcana", "Deception"] }), /different skills for your class and your background/);
  assert.equal(err({ background: "Acolyte", bgSkillChoices: [] }), null, "a background without picks asks nothing");
});

test("Haunted One languages: one exotic slot, then one of any kind", (t) => {
  const plan = inWizard(t, {}, () => W.languagePlan());
  // A Human's own pick first, then the background's two.
  assert.deepEqual(plan.slots.map((s) => [s.source, s.exotic]), [["Human", false], ["Haunted One", true], ["Haunted One", false]]);
  assert.match(plan.slots[1].help, /first must be an exotic language/);
  const err = (languageChoices) => inWizard(t, { languageChoices }, () => W.validateStep("languages"));
  assert.equal(err(["Dwarvish", "Abyssal", "Elvish"]), null);
  assert.equal(err(["Dwarvish", "Abyssal", "Infernal"]), null, "both may be exotic");
  assert.match(err(["Dwarvish", "Elvish", "Abyssal"]), /needs an exotic language/);
  assert.match(err(["Dwarvish", "elvish", "Abyssal"]), /needs an exotic language/, "case doesn't matter");
  assert.equal(err(["Dwarvish", "Tongue of Ravenloft", "Elvish"]), null, "a homebrew language isn't a standard one");
  assert.match(err(["Dwarvish", "Abyssal", "Abyssal"]), /different language/);
  // Other backgrounds have no exotic slot.
  assert.ok(inWizard(t, { background: "Acolyte" }, () => W.languagePlan()).slots.every((s) => !s.exotic));
});

test("a background whose languages are all exotic says so", (t) => {
  BACKGROUND_INFO["Test Exotic"] = { skills: [], blurb: "Test.", exoticLanguages: 2 };
  BACKGROUND_LANGUAGES["Test Exotic"] = 2;
  try {
    const plan = inWizard(t, { background: "Test Exotic" }, () => W.languagePlan());
    assert.deepEqual(plan.slots.slice(1).map((s) => s.exotic), [true, true]);
    assert.equal(plan.slots[1].help, "These must be exotic languages.");
  } finally { delete BACKGROUND_INFO["Test Exotic"]; delete BACKGROUND_LANGUAGES["Test Exotic"]; }
});

test("a new Haunted One gets its picked skills and languages", (t) => {
  const c = inWizard(t, {}, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.equal(c.background, "Haunted One");
  for(const sk of ["Arcana", "Religion", "Deception", "Intimidation"]) assert.equal(c.skillProfs[sk].prof, true, sk);
  for(const sk of ["Investigation", "Survival"]) assert.equal(c.skillProfs[sk].prof, false, sk);
  assert.deepEqual(c.languages, ["Common", "Dwarvish", "Abyssal", "Elvish"]);
});

test("Heart of Darkness is in the background's entry on the Features tab", () => {
  const entry = (bg) => H.getAllCharacterFeatures(makeChar([{ name: "Fighter", level: 1 }], { background: bg })).find((f) => f.category === "background");
  assert.match(entry("Haunted One").text, /\n\nHeart of Darkness: Those who look into your eyes/);
  assert.equal(entry("Acolyte").text, BACKGROUND_INFO.Acolyte.blurb, "a background without a feature is unchanged");
});

/* ================================================================
   Fey Touched
   ================================================================ */
const FEY = FP.featDef("Fey Touched");
const CTX = { abilities: { int: 10, wis: 15, cha: 8 }, skillProfs: {} };

test("Fey Touched: it asks for a choice, and its picks start empty", () => {
  assert.equal(FP.featHasPicks(FEY), true);
  assert.equal(FP.featNeedsChoice(FEY), true);
  assert.deepEqual(FP.emptyPicks(FEY), { ability: "", skills: [], expertise: [], weapons: [], option: "", spells: [] });
  // Starting from a feat's own picks copies its spells, not shares them.
  const feat = { name: "Fey Touched", picks: { ability: "cha", skills: [], expertise: [], weapons: [], spells: ["Command"] } };
  const start = FP.startingPicks(FEY, feat);
  assert.deepEqual(start.spells, ["Command"]);
  start.spells.push("Hex");
  assert.deepEqual(feat.picks.spells, ["Command"]);
  // A feat marked done by hand starts over empty.
  assert.deepEqual(FP.startingPicks(FEY, { picks: { manual: true, spells: ["Hex"] } }).spells, []);
});

test("Fey Touched: only 1st-level divination and enchantment spells", () => {
  const options = FP.featSpellOptions(FEY);
  assert.ok(options.length > 5);
  for(const n of options){
    assert.equal(SPELL_DATA[n].level, 1, n);
    assert.ok(["Divination", "Enchantment"].includes(SPELL_DATA[n].school), n);
  }
  for(const n of ["Hex", "Command", "Charm Person", "Detect Magic", "Identify", "Dissonant Whispers"]) assert.ok(options.includes(n), n);
  for(const n of ["Magic Missile", "Shield", "Misty Step", "Suggestion"]) assert.ok(!options.includes(n), n);
  assert.deepEqual(options, options.slice().sort(), "sorted");
  assert.deepEqual(FP.featSpellOptions(FP.featDef("Alert")), [], "a feat without spells offers none");
});

test("spellsMatching: by level, school and ritual", () => {
  const rituals = spellsMatching({ level: 1, ritual: true });
  assert.ok(rituals.includes("Find Familiar") && rituals.includes("Detect Magic") && !rituals.includes("Hex"));
  assert.ok(rituals.every((n) => SPELL_DATA[n].ritual && SPELL_DATA[n].level === 1));
  const cantrips = spellsMatching({ level: 0 });
  assert.ok(cantrips.includes("Eldritch Blast") && cantrips.includes("Guidance") && cantrips.every((n) => SPELL_DATA[n].level === 0));
  assert.deepEqual(spellsMatching({ level: 1, schools: ["Divination"] }).filter((n) => SPELL_DATA[n].school !== "Divination"), []);
});

test("Fey Touched: what's missing or wrong", () => {
  const problem = (picks) => FP.featPicksProblem(FEY, { ...FP.emptyPicks(FEY), ...picks }, CTX);
  assert.match(problem({ spells: ["Hex"] }), /Pick the ability Fey Touched raises/);
  assert.match(problem({ ability: "str", spells: ["Hex"] }), /Pick the ability/, "STR isn't one of its choices");
  assert.match(problem({ ability: "wis" }), /Pick a 1st-level divination or enchantment spell for Fey Touched/);
  assert.match(problem({ ability: "wis", spells: [""] }), /Pick a 1st-level/);
  assert.match(problem({ ability: "wis", spells: ["Magic Missile"] }), /Pick a 1st-level/);
  assert.match(problem({ ability: "wis", spells: ["Misty Step"] }), /Pick a 1st-level/, "Misty Step comes free; it's not the pick");
  assert.match(problem({ ability: "wis", spells: ["Not A Spell"] }), /Pick a 1st-level/);
  assert.equal(problem({ ability: "wis", spells: ["Hex"] }), "");
  assert.equal(problem({ ability: "int", spells: ["Identify"] }), "");
});

test("Fey Touched: summary, apply, pending and revert", () => {
  assert.equal(FP.featPicksSummary(FEY, { ability: "cha", spells: [] }), "Charisma +1, Misty Step");
  assert.equal(FP.featPicksSummary(FEY, { ability: "cha", spells: ["Command"] }), "Charisma +1, Misty Step, Command");

  const c = makeChar([{ name: "Rogue", level: 4 }], { abilities: { cha: 19 } });
  const feat = { id: "f", name: "Fey Touched" };
  c.feats.push(feat);
  assert.equal(FP.featPicksPending(feat), true, "no picks yet");
  FP.applyFeatPicks(c, feat, { ability: "cha", spells: ["Command", ""] });
  assert.deepEqual(feat.picks.spells, ["Command"], "blank picks are dropped");
  assert.equal(c.abilities.cha, 20);
  assert.deepEqual(feat.applied.abilities, { cha: 1 });
  assert.equal(FP.featPicksPending(feat), false);
  FP.revertFeatPicks(c, feat);
  assert.equal(c.abilities.cha, 19);

  // At 20 already: nothing to add or take back.
  c.abilities.cha = 20;
  FP.applyFeatPicks(c, feat, { ability: "cha", spells: ["Command"] });
  assert.equal(c.abilities.cha, 20);
  assert.deepEqual(feat.applied.abilities, {});
  FP.revertFeatPicks(c, feat);
  assert.equal(c.abilities.cha, 20);

  // Picks saved without a spell (or marked done by hand) behave as expected.
  assert.equal(FP.featPicksPending({ name: "Fey Touched", picks: { ability: "cha", spells: [] } }), true);
  assert.equal(FP.featPicksPending({ name: "Fey Touched", picks: { ability: "cha" } }), true);
  assert.equal(FP.featPicksPending({ name: "Fey Touched", picks: { manual: true } }), false);
});

test("Fey Touched: spells on the Spells tab with the right DC", () => {
  const c = makeChar([{ name: "Fighter", level: 8 }], { abilities: { int: 17 } });
  const feat = { id: "f", name: "Fey Touched" };
  c.feats.push(feat);
  // Before its picks: Misty Step only, with a pointer to finish them.
  let spells = H.featureSpells(c);
  assert.deepEqual(spells.map((s) => s.name), ["Misty Step"]);
  assert.match(spells[0].note, /Choose the feat's ability on the Features & Feats tab/);
  assert.equal(H.hasSpellsTab(c), true);
  FP.applyFeatPicks(c, feat, { ability: "int", spells: ["Identify"] });
  spells = H.featureSpells(c);
  assert.deepEqual(spells.map((s) => [s.name, s.level, s.kind, s.source, s.feature]),
    [["Misty Step", 2, "free", "Fey Touched", "Fey Touched"], ["Identify", 1, "free", "Fey Touched", "Fey Touched"]]);
  // INT 18 (+4), PB +3 at level 8: DC 15, attack +7.
  assert.equal(spells[1].note, "Free once per long rest, or cast it with a spell slot. Uses Intelligence: save DC 15, spell attack +7.");
  // Without the feat: no Spells tab for a Fighter.
  assert.equal(H.hasSpellsTab(makeChar([{ name: "Fighter", level: 8 }])), false);
});

test("spellAbilityNote: with and without an ability", () => {
  const c = makeChar([{ name: "Wizard", level: 1 }], { abilities: { wis: 8 } });
  assert.equal(H.spellAbilityNote(c, "wis", "Lead."), "Lead. Uses Wisdom: save DC 9, spell attack +1.");
  assert.match(H.spellAbilityNote(c, "", "Lead."), /^Lead\. Choose the feat's ability/);
});

test("Fey Touched: two free casts that come back on a long rest only", () => {
  const c = makeChar([{ name: "Fighter", level: 4 }]);
  const feat = { id: "f", name: "Fey Touched" };
  c.feats.push(feat);
  const fey = () => H.characterResources(c).filter((r) => r.source === "Fey Touched");
  assert.deepEqual(fey().map((r) => r.name), ["Misty Step (Fey Touched)", "1st-level spell (Fey Touched)"], "named generically before the pick");
  FP.applyFeatPicks(c, feat, { ability: "wis", spells: ["Command"] });
  assert.deepEqual(fey().map((r) => [r.name, r.max, r.reset]), [["Misty Step (Fey Touched)", 1, "long"], ["Command (Fey Touched)", 1, "long"]]);
  c.resourcesUsed = { "feat:fey_touched_misty_step": 1, "feat:fey_touched_spell": 5 };
  assert.deepEqual(fey().map((r) => r.used), [1, 1], "used is clamped to the max");
  assert.deepEqual(H.restoreResources(c, "short"), [], "a short rest doesn't bring them back");
  assert.deepEqual(H.restoreResources(c, "long"), ["Misty Step (Fey Touched)", "Command (Fey Touched)"]);
  assert.deepEqual(c.resourcesUsed, {});
});

test("Fey Touched through a Variant Human in the creation wizard", (t) => {
  const vh = (featPicks) => ({ classId: "Fighter", background: "Soldier", skillChoices: ["Athletics", "Perception"], bgSkillChoices: [],
    languageChoices: ["Elvish"], classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }, race: "Variant Human",
    raceChoices: { abilities: ["str", "con"], preset: "", skills: ["Stealth"], tools: [], feat: "Fey Touched", featPicks } });
  assert.match(inWizard(t, vh({ ...FP.emptyPicks(FEY), ability: "wis" }), () => W.validateStep("featPicks")), /1st-level divination or enchantment spell/);
  const picks = { ...FP.emptyPicks(FEY), ability: "wis", spells: ["Hex"] };
  assert.equal(inWizard(t, vh(picks), () => W.validateStep("featPicks")), null);
  const c = inWizard(t, vh(picks), () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  const feat = c.feats.find((f) => f.name === "Fey Touched");
  assert.deepEqual(feat.picks.spells, ["Hex"]);
  assert.equal(c.abilities.wis, 13, "point-buy 12 + the feat's 1");
  assert.deepEqual(H.featureSpells(c).map((s) => s.name), ["Misty Step", "Hex"]);
});

/* ================================================================
   A race's feat has its own wizard steps
   ================================================================ */
const vhuman = (raceChoices, extra = {}) => ({ classId: "Fighter", background: "Soldier", skillChoices: ["Athletics", "Perception"], bgSkillChoices: [],
  languageChoices: ["Elvish"], classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }, race: "Variant Human",
  raceChoices: { abilities: ["str", "con"], preset: "", skills: ["Stealth"], tools: [], feat: "", featPicks: null, ...raceChoices }, ...extra });

test("wizard: the Feat step only for a race with a feat, Feat Choices only for a feat with picks", (t) => {
  const steps = (choices) => inWizard(t, choices, () => W.WIZARD_STEP_IDS.filter(W.isStepApplicable));
  const around = (list) => list.slice(list.indexOf("raceChoices"), list.indexOf("raceChoices") + 3);
  assert.deepEqual(around(steps(vhuman({}))), ["raceChoices", "feat", "choices"], "no feat yet: no Feat Choices");
  assert.deepEqual(around(steps(vhuman({ feat: "Fey Touched" }))), ["raceChoices", "feat", "featPicks"]);
  for(const [feat, has] of [["Alert", false], ["Tough", false], ["Actor", false], ["Athlete", true], ["Skilled", true], ["Weapon Master", true], ["Elemental Adept", true]]){
    assert.equal(steps(vhuman({ feat })).includes("featPicks"), has, feat);
  }
  assert.equal(steps(vhuman({ feat: "No Such Feat" })).includes("featPicks"), false, "an unknown name adds nothing");
  // Other races: neither step.
  for(const race of ["Human", "Half-Elf", "Hill Dwarf"]){
    const list = steps({ race, classId: "Fighter" });
    assert.ok(!list.includes("feat") && !list.includes("featPicks"), race);
  }
  assert.equal(inWizard(t, vhuman({ feat: "Alert" }), () => W.wizardFeat()).name, "Alert");
  assert.equal(inWizard(t, vhuman({}), () => W.wizardFeat()), null);
  assert.equal(inWizard(t, vhuman({}), () => W.wizardStepTitle("feat")), "Choose a Feat");
  assert.equal(inWizard(t, vhuman({}), () => W.wizardStepTitle("featPicks")), "Feat Choices");
});

test("wizard: Race Traits no longer asks for the feat; the Feat steps do", (t) => {
  const err = (step, rc) => inWizard(t, vhuman(rc), () => W.validateStep(step));
  assert.equal(err("raceChoices", {}), null, "Race Traits is done without a feat");
  assert.match(err("raceChoices", { abilities: ["str"] }), /2 different abilities/, "its own picks are still checked");
  assert.equal(err("feat", {}), "Pick a feat.");
  assert.equal(err("feat", { feat: "No Such Feat" }), "Pick a feat.");
  assert.equal(err("feat", { feat: "Alert" }), null);
  // Point-buy STR 8 (+1 from the race's pick goes to CON and DEX here): Grappler needs STR 13.
  assert.match(inWizard(t, vhuman({ abilities: ["dex", "con"], feat: "Grappler" }, { abilityMethod: "pointbuy", abilities: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 } }),
    () => W.validateStep("feat")), /^Grappler needs STR 13\. Pick another feat or change your scores\.$/);
  assert.match(err("feat", { feat: "Elemental Adept" }), /needs spellcasting/, "a Fighter has no Spellcasting feature");
  // Feat Choices checks the feat's own picks.
  assert.match(err("featPicks", { feat: "Athlete", featPicks: null }), /Pick the ability Athlete raises/);
  assert.match(err("featPicks", { feat: "Skilled", featPicks: { ...FP.emptyPicks(FP.featDef("Skilled")), skills: ["Arcana"] } }), /Pick 3 different skills or tools/);
  assert.equal(err("featPicks", { feat: "Athlete", featPicks: { ...FP.emptyPicks(FP.featDef("Athlete")), ability: "dex" } }), null);
});

test("wizard: a Variant Human's feat and picks still reach the new character", (t) => {
  const make = (rc) => inWizard(t, vhuman(rc), () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  const athlete = make({ feat: "Athlete", featPicks: { ...FP.emptyPicks(FP.featDef("Athlete")), ability: "dex" } });
  assert.deepEqual(athlete.feats.map((f) => [f.name, f.picks.ability]), [["Athlete", "dex"]]);
  assert.equal(athlete.abilities.dex, 15, "point-buy 14 + the feat's 1 (the race's +1s went to STR and CON)");
  const alert = make({ feat: "Alert", featPicks: FP.emptyPicks(FP.featDef("Alert")) });
  assert.deepEqual(alert.feats.map((f) => f.name), ["Alert"]);
});

/* ================================================================
   Invocations: prerequisites
   ================================================================ */
test("invocations known by warlock level, all twenty levels", () => {
  assert.deepEqual(Array.from({ length: 21 }, (_, l) => invocationsKnownAt(l)), [0, 0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8]);
  assert.equal(invocationsKnownAt(25), 8);
  assert.equal(invocationsKnownAt(-1), 0);
  assert.equal(invocationsKnownAt("x"), 0);
  assert.equal(INV.invocationsDue(null), 0);
  assert.equal(INV.invocationsDue({ name: "Warlock", level: 9 }), 5);
  assert.equal(INV.invocationsDue({ name: "Warlock" }), 0, "a level 1 entry without a level");
});

test("warlockEntry and knownInvocations", () => {
  const c = makeChar([{ name: "Fighter", level: 2 }, { name: "Warlock", level: 3 }]);
  assert.equal(INV.warlockEntry(c), c.classes[1]);
  assert.equal(INV.warlockEntry(makeChar([{ name: "Fighter", level: 2 }])), null);
  assert.deepEqual(INV.knownInvocations(null), []);
  assert.deepEqual(INV.knownInvocations({ invocations: "junk" }), []);
});

test("every invocation's prerequisite, one by one", () => {
  // A warlock 20 with every pact and Eldritch Blast meets them all...
  for(const inv of INVOCATIONS){
    const c = warlock(20, { spells: [{ name: "Eldritch Blast" }, { name: "Hex" }] }, { pactBoon: inv.pact || "Pact of the Blade" });
    assert.equal(reason(c, c.classes[0], inv.name), "", inv.name);
  }
  // ...and each requirement shows when it's missing.
  for(const inv of INVOCATIONS){
    const c = warlock(2, { spells: [] }, { pactBoon: "" });
    const why = reason(c, c.classes[0], inv.name);
    if(inv.level) assert.equal(why, "warlock " + inv.level, inv.name);
    else if(inv.pact) assert.equal(why, "needs " + inv.pact.replace("Pact of the ", "") + " pact", inv.name);
    else if(inv.needs === "eldritchBlast") assert.equal(why, "needs Eldritch Blast", inv.name);
    else if(inv.needs === "hex") assert.equal(why, "needs Hex", inv.name);
    else assert.equal(why, "", inv.name);
  }
});

test("prerequisites: level comes first, then pact, then spells; known ones are known", () => {
  const c = warlock(2, { spells: [] });
  const cl = c.classes[0];
  assert.equal(reason(c, cl, "Lifedrinker"), "warlock 12", "level before pact");
  assert.equal(reason(c, cl, "Lifedrinker", { level: 12 }), "needs Blade pact");
  assert.equal(reason(c, cl, "Lifedrinker", { level: 12, pactBoon: "Pact of the Tome" }), "needs Blade pact");
  assert.equal(reason(c, cl, "Lifedrinker", { level: 12, pactBoon: "Pact of the Blade" }), "");
  assert.equal(reason(c, cl, "Maddening Hex"), "warlock 5");
  assert.equal(reason(c, cl, "Maddening Hex", { level: 5 }), "needs Hex");
  assert.equal(reason(c, cl, "Agonizing Blast", { known: ["Agonizing Blast"] }), "known");
  // The class entry's own pact and known list are used by default.
  cl.pactBoon = "Pact of the Chain";
  cl.invocations = [{ id: "a", name: "Voice of the Chain Master" }];
  assert.equal(reason(c, cl, "Gift of the Ever-Living Ones"), "");
  assert.equal(reason(c, cl, "Voice of the Chain Master"), "known");
  // Spell names are matched after trimming.
  c.spells = [{ name: " Eldritch Blast " }];
  assert.equal(reason(c, cl, "Repelling Blast"), "");
});

test("prerequisites: what counts as a curse", () => {
  const c = warlock(7, { spells: [] });
  const cl = c.classes[0];
  assert.equal(reason(c, cl, "Relentless Hex"), "needs Hex");
  assert.equal(reason(c, cl, "Relentless Hex", { known: ["Sign of Ill Omen"] }), "", "Sign of Ill Omen curses");
  c.spells = [{ name: "Hex" }];
  assert.equal(reason(c, cl, "Relentless Hex"), "", "the Hex spell");
  c.spells = [];
  cl.subclass = "The Hexblade";
  assert.equal(reason(c, cl, "Relentless Hex"), "", "Hexblade's Curse");
  // No class entry at all (a context for a brand-new warlock).
  const ctx = INV.invocationContext(c, null, {});
  assert.deepEqual([ctx.level, ctx.pactBoon, ctx.known, ctx.curses], [0, "", [], false]);
});

test("prerequisite text and a prerequisite that's gone", () => {
  assert.equal(INV.invocationPrereqText(invocationDef("Devil's Sight")), "");
  assert.equal(INV.invocationPrereqText(invocationDef("Lifedrinker")), "Warlock 12, Pact of the Blade");
  assert.equal(INV.invocationPrereqText(invocationDef("Agonizing Blast")), "Eldritch Blast cantrip");
  assert.equal(INV.invocationPrereqText(invocationDef("Maddening Hex")), "Warlock 5, Hex spell or a warlock feature that curses");

  const c = warlock(5, { spells: [{ name: "Eldritch Blast" }] }, { pactBoon: "Pact of the Blade" });
  const cl = c.classes[0];
  const blast = INV.learnInvocation(c, cl, "Agonizing Blast", []);
  const blade = INV.learnInvocation(c, cl, "Thirsting Blade", []);
  assert.equal(INV.invocationBroken(c, cl, blast), "", "still met (it doesn't count itself as known)");
  c.spells = [];
  assert.equal(INV.invocationBroken(c, cl, blast), "Prerequisite not met: Eldritch Blast");
  cl.pactBoon = "Pact of the Tome";
  assert.equal(INV.invocationBroken(c, cl, blade), "Prerequisite not met: Blade pact");
  assert.equal(INV.invocationBroken(c, cl, { name: "Homebrew Thing" }), "", "an unknown name isn't flagged");
});

/* ================================================================
   Invocations: learning, forgetting, picks
   ================================================================ */
test("learning and forgetting; Beguiling Influence's skills come and go exactly", () => {
  const c = warlock(5, { skillProfs: { Deception: { prof: true, expertise: true } } });
  const cl = c.classes[0];
  assert.equal(cl.invocations, undefined);
  const e = INV.learnInvocation(c, cl, "Beguiling Influence", undefined);
  assert.ok(e.id && Array.isArray(cl.invocations));
  assert.deepEqual(e.spells, []);
  assert.deepEqual(e.applied.skills, ["Persuasion"], "Deception was already there");
  assert.equal(c.skillProfs.Persuasion.prof, true);
  assert.equal(INV.forgetInvocation(c, cl, "nope"), null);
  const gone = INV.forgetInvocation(c, cl, e.id);
  assert.equal(gone, e);
  assert.equal(gone.applied, undefined);
  assert.equal(c.skillProfs.Persuasion.prof, false);
  assert.deepEqual(c.skillProfs.Deception, { prof: true, expertise: true }, "untouched, expertise too");
  // Putting it back (undoing a swap) applies it again.
  INV.restoreInvocation(c, cl, gone);
  assert.equal(c.skillProfs.Persuasion.prof, true);
  assert.deepEqual(names(cl), ["Beguiling Influence"]);
  // On a sheet without skillProfs yet.
  const bare = warlock(2);
  delete bare.skillProfs;
  INV.learnInvocation(bare, bare.classes[0], "Beguiling Influence", []);
  assert.equal(bare.skillProfs.Deception.prof && bare.skillProfs.Persuasion.prof, true);
  // An invocation with no skills applies nothing.
  assert.deepEqual(INV.learnInvocation(c, cl, "Devil's Sight", []).applied, { skills: [] });
  // Restoring onto an entry without a list starts one.
  const fresh = { name: "Warlock", level: 2 };
  INV.restoreInvocation(c, fresh, { id: "x", name: "Devil's Sight", spells: [] });
  assert.deepEqual(names(fresh), ["Devil's Sight"]);
});

test("picks still to make: the Tome's cantrips and Book of Ancient Secrets' rituals", () => {
  const c = warlock(3, {}, { pactBoon: "Pact of the Tome", pactSpells: ["Guidance"] });
  const cl = c.classes[0];
  const book = INV.learnInvocation(c, cl, "Book of Ancient Secrets", ["Alarm"]);
  let pending = INV.pendingInvocationPicks(cl);
  assert.deepEqual(pending.map((p) => [p.kind, p.def.name]), [["pact", "Pact of the Tome"], ["invocation", "Book of Ancient Secrets"]]);
  assert.equal(pending[1].entry, book);
  cl.pactSpells = ["Guidance", "Light", "Eldritch Blast"];
  book.spells = ["Alarm", "Find Familiar"];
  assert.deepEqual(INV.pendingInvocationPicks(cl), []);
  assert.deepEqual(INV.pendingInvocationPicks(null), []);
  assert.deepEqual(INV.pendingInvocationPicks({ pactBoon: "Pact of the Blade" }), [], "Blade picks nothing");
  assert.deepEqual(INV.pickOptions(null), []);
  assert.ok(INV.pickOptions(pactBoonDef("Pact of the Tome").spellPick).every((n) => SPELL_DATA[n].level === 0));
  assert.ok(INV.pickOptions(invocationDef("Book of Ancient Secrets").spellPick).every((n) => SPELL_DATA[n].ritual && SPELL_DATA[n].level === 1));
});

test("older sheets: invocations added as custom features move onto the card", () => {
  const c = warlock(5);
  const cl = c.classes[0];
  INV.learnInvocation(c, cl, "Devil's Sight", []);
  c.features = [
    { id: "1", name: "Invocation - Mask of Many Faces" },
    { id: "2", name: "eldritch invocations: beast speech" },
    { id: "3", name: "  Devil's Sight " },
    { id: "4", name: "Agonizing Blast extra" },
    { id: "5", name: "Fighting Style: Defense" },
    { id: "6" }
  ];
  assert.deepEqual(INV.customInvocationFeatures(c).map((f) => f.id), ["1", "2", "3"]);
  assert.deepEqual(INV.adoptCustomInvocations(c, cl), ["Mask of Many Faces", "Beast Speech"], "Devil's Sight is already known");
  assert.deepEqual(c.features.map((f) => f.id), ["4", "5", "6"], "the duplicate is removed too");
  assert.deepEqual(names(cl), ["Devil's Sight", "Mask of Many Faces", "Beast Speech"]);
  assert.deepEqual(INV.customInvocationFeatures(makeChar([{ name: "Warlock", level: 2 }], { features: undefined })), []);
});

/* ================================================================
   Invocations: what the sheet does with them
   ================================================================ */
test("spells from the Pact Boon and invocations, with their kind and note", () => {
  const c = warlock(9, {}, { pactBoon: "Pact of the Chain" });
  const cl = c.classes[0];
  INV.learnInvocation(c, cl, "Armor of Shadows", []);
  INV.learnInvocation(c, cl, "Thief of Five Fates", []);
  INV.learnInvocation(c, cl, "Undying Servitude", []);
  INV.learnInvocation(c, cl, "Devil's Sight", []);
  const spells = INV.invocationSpells(c);
  assert.deepEqual(spells.map((s) => [s.name, s.kind, s.source, s.feature]), [
    ["Find Familiar", "known", "Pact Boon", "Pact of the Chain"],
    ["Mage Armor", "atwill", "Invocation", "Armor of Shadows"],
    ["Bane", "slot", "Invocation", "Thief of Five Fates"],
    ["Animate Dead", "free", "Invocation", "Undying Servitude"]
  ]);
  assert.match(spells[0].note, /cast it as a ritual/);
  assert.equal(spells[1].note, "Armor of Shadows: " + invocationDef("Armor of Shadows").text);
  assert.ok(spells.every((s) => s.data === SPELL_DATA[s.name] && s.level === SPELL_DATA[s.name].level && s.className === "Warlock"));
  // They reach the Spells tab, after the class's own (the Fiend's list).
  const fromSheet = H.featureSpells(c).filter((s) => s.source === "Invocation" || s.source === "Pact Boon");
  assert.deepEqual(fromSheet.map((s) => s.name), spells.map((s) => s.name));
});

test("Pact Boon spells only from warlock 3; the Tome's cantrips and the Book's rituals", () => {
  // A Pact Boon left on a level 2 entry (undo, hand edits) gives nothing.
  assert.deepEqual(INV.invocationSpells(warlock(2, {}, { pactBoon: "Pact of the Chain" })), []);
  const c = warlock(3, {}, { pactBoon: "Pact of the Tome", pactSpells: ["Guidance", "Mage Hand", "Guidance"] });
  INV.learnInvocation(c, c.classes[0], "Book of Ancient Secrets", ["Find Familiar", "Alarm"]);
  const spells = INV.invocationSpells(c);
  assert.deepEqual(spells.map((s) => [s.name, s.kind]), [["Guidance", "known"], ["Mage Hand", "known"], ["Find Familiar", "ritual"], ["Alarm", "ritual"]],
    "a name already listed isn't listed twice");
  assert.match(spells[0].note, /Book of Shadows/);
  assert.match(spells[2].note, /only as a ritual/);
  // An unknown name keeps its entry, without catalog data.
  const odd = warlock(3, {}, { pactBoon: "Pact of the Tome", pactSpells: ["Homebrew Zap"] });
  assert.deepEqual(INV.invocationSpells(odd).map((s) => [s.name, s.data, s.level]), [["Homebrew Zap", null, 0]]);
  // Not a warlock: nothing, even with leftover data.
  assert.deepEqual(INV.invocationSpells(makeChar([{ name: "Wizard", level: 5, invocations: [{ id: "a", name: "Armor of Shadows" }] }])), []);
  // An invocation name that isn't in the list is skipped.
  assert.deepEqual(INV.invocationSpells(warlock(5, {}, { invocations: [{ id: "a", name: "Old Homebrew" }] })), []);
});

test("uses on Vitals: once-a-day spells, short-rest invocations and the talisman's", () => {
  const c = warlock(12, {}, { pactBoon: "Pact of the Talisman" });
  const cl = c.classes[0];
  for(const n of ["Sign of Ill Omen", "Gift of the Depths", "Tomb of Levistus", "Cloak of Flies", "Protection of the Talisman", "Bond of the Talisman", "Armor of Shadows"]){
    INV.learnInvocation(c, cl, n, []);
  }
  const res = () => H.characterResources(c).filter((r) => r.source === "Invocation" || r.source === "Pact Boon");
  // Proficiency bonus +4 at level 12.
  assert.deepEqual(res().map((r) => [r.key, r.name, r.max, r.reset, r.source]), [
    ["inv:Pact of the Talisman", "Talisman d4", 4, "long", "Pact Boon"],
    ["inv:Sign of Ill Omen:Bestow Curse", "Bestow Curse (Sign of Ill Omen)", 1, "long", "Invocation"],
    ["inv:Gift of the Depths:Water Breathing", "Water Breathing (Gift of the Depths)", 1, "long", "Invocation"],
    ["inv:Tomb of Levistus", "Tomb of Levistus", 1, "short", "Invocation"],
    ["inv:Cloak of Flies", "Cloak of Flies", 1, "short", "Invocation"],
    ["inv:Protection of the Talisman", "Talisman save d4", 4, "long", "Invocation"],
    ["inv:Bond of the Talisman", "Talisman teleports", 4, "long", "Invocation"]
  ]);
  const hints = Object.fromEntries(res().map((r) => [r.name, r.hint]));
  assert.match(hints["Bestow Curse (Sign of Ill Omen)"], /with a warlock spell slot/);
  assert.match(hints["Water Breathing (Gift of the Depths)"], /without a spell slot/);
  assert.equal(hints["Tomb of Levistus"], "As a reaction when you take damage, you can entomb yourself in ice, which melts away at the end of your next turn.");
  // Spending and resting.
  c.resourcesUsed = { "inv:Tomb of Levistus": 1, "inv:Sign of Ill Omen:Bestow Curse": 1, "inv:Pact of the Talisman": 9 };
  assert.equal(res()[0].used, 4, "clamped to the max");
  assert.deepEqual(H.restoreResources(c, "short"), ["Tomb of Levistus"]);
  assert.deepEqual(Object.keys(c.resourcesUsed).sort(), ["inv:Pact of the Talisman", "inv:Sign of Ill Omen:Bestow Curse"]);
  assert.deepEqual(H.restoreResources(c, "long").sort(), ["Bestow Curse (Sign of Ill Omen)", "Talisman d4"]);
  // The talisman's uses follow the proficiency bonus.
  cl.level = 4;
  assert.equal(res()[0].max, 2);
  // Below warlock 3 the Pact Boon gives no uses.
  cl.level = 2;
  assert.ok(!res().some((r) => r.source === "Pact Boon"));
});

test("Gift of the Depths: a swim speed equal to walking speed", () => {
  const c = warlock(5, { speed: 30 });
  INV.learnInvocation(c, c.classes[0], "Gift of the Depths", []);
  assert.deepEqual(INV.invocationSpeedSources(c), [{ name: "Gift of the Depths", speeds: [{ type: "swim", value: "walk" }] }]);
  assert.deepEqual(H.computeSpeed(c).others, [{ type: "swim", value: 30, when: "", source: "Gift of the Depths" }]);
  // It follows the walking speed (a dwarf's 25)...
  c.speed = 25;
  assert.equal(H.computeSpeed(c).others[0].value, 25);
  // ...and a Fathomless warlock's 40-foot swim speed is the better one.
  c.classes[0].subclass = "The Fathomless";
  assert.deepEqual(H.computeSpeed(c).others.map((o) => [o.type, o.value, o.source]), [["swim", 40, "Gift of the Sea"]]);
  assert.deepEqual(INV.invocationSpeedSources(warlock(5)), []);
});

test("senses: Devil's Sight and Witch Sight, with or without darkvision", () => {
  const c = warlock(15, { race: "Human" });
  assert.equal(H.getCharacterSenses(c), "No darkvision");
  INV.learnInvocation(c, c.classes[0], "Devil's Sight", []);
  assert.equal(H.getCharacterSenses(c), "Devil's Sight 120 ft");
  INV.learnInvocation(c, c.classes[0], "Witch Sight", []);
  assert.equal(H.getCharacterSenses(c), "Devil's Sight 120 ft, Witch Sight 30 ft");
  c.race = "Tiefling";
  assert.equal(H.getCharacterSenses(c), "Darkvision 60 ft, Devil's Sight 120 ft, Witch Sight 30 ft");
  assert.deepEqual(INV.invocationSenses(warlock(15)), []);
});

test("Eldritch Blast summary: beams, CHA, range and riders", () => {
  assert.equal(INV.eldritchBlastSummary(makeChar([{ name: "Wizard", level: 5 }])), null, "not a warlock");
  assert.equal(INV.eldritchBlastSummary(warlock(5, { spells: [] })), null, "doesn't know the cantrip");
  const beams = (level) => INV.eldritchBlastSummary(warlock(level, { spells: [{ name: "Eldritch Blast" }] })).beams;
  assert.deepEqual([1, 4, 5, 10, 11, 16, 17, 20].map(beams), [1, 1, 2, 2, 3, 3, 4, 4]);
  // Beams follow character level, not warlock level.
  const mc = makeChar([{ name: "Fighter", level: 4 }, { name: "Warlock", level: 1 }], { spells: [{ name: "Eldritch Blast" }] });
  assert.equal(INV.eldritchBlastSummary(mc).beams, 2);
  // Plain: no invocations change it.
  const c = warlock(2, { spells: [{ name: "Eldritch Blast" }] });
  assert.deepEqual(INV.eldritchBlastSummary(c), { beams: 1, dice: "1d10", bonus: 0, range: 120, riders: [], by: [] });
  for(const n of ["Agonizing Blast", "Eldritch Spear", "Repelling Blast", "Grasp of Hadar", "Lance of Lethargy", "Devil's Sight"]) INV.learnInvocation(c, c.classes[0], n, []);
  const s = INV.eldritchBlastSummary(c);
  assert.equal(s.bonus, 3, "CHA 16");
  assert.equal(s.range, 300);
  assert.deepEqual(s.riders, ["push 10 ft", "pull 10 ft (once per turn)", "-10 ft speed (once per turn)"]);
  assert.deepEqual(s.by, ["Agonizing Blast", "Eldritch Spear", "Repelling Blast", "Grasp of Hadar", "Lance of Lethargy"]);
  c.abilities.cha = 8;
  assert.equal(INV.eldritchBlastSummary(c).bonus, -1, "a negative CHA is shown as it is");
  // The Tome's Eldritch Blast counts as knowing it.
  assert.ok(INV.eldritchBlastSummary(warlock(3, { spells: [] }, { pactBoon: "Pact of the Tome", pactSpells: ["Eldritch Blast"] })));
});

/* ================================================================
   Invocations in a level-up
   ================================================================ */
test("level-up plan: what each warlock level asks for", () => {
  const plan = (level, entry, swap) => INV.levelUpPlan(entry, level, swap);
  assert.deepEqual(plan(1, null), { applies: false, pactDue: false, fresh: 0, slots: 0 }, "a new multiclass warlock");
  assert.deepEqual(plan(2, { level: 1 }), { applies: true, pactDue: false, fresh: 2, slots: 2 });
  assert.deepEqual(plan(3, { level: 2, invocations: [{ id: "a" }, { id: "b" }] }), { applies: true, pactDue: true, fresh: 0, slots: 0 });
  assert.equal(plan(4, { level: 3, pactBoon: "Pact of the Blade" }).pactDue, false, "already chosen");
  assert.equal(plan(5, { level: 4, invocations: [{ id: "a" }, { id: "b" }] }).fresh, 1);
  assert.equal(plan(5, { level: 4 }).fresh, 3, "an older sheet with none catches up");
  assert.equal(plan(6, { level: 5, invocations: [1, 2, 3, 4].map((i) => ({ id: "x" + i })) }).fresh, 0, "more than due: nothing new");
  const two = { level: 3, invocations: [{ id: "a" }, { id: "b" }] };
  assert.equal(plan(4, two, "a").slots, 1, "a swap adds one pick");
  assert.equal(plan(4, two, "zzz").slots, 0, "an unknown swap id adds nothing");
});

test("level-up context: the swapped-out one isn't known; the new pact counts", () => {
  const c = warlock(2, { spells: [] });
  const cl = c.classes[0];
  const sign = INV.learnInvocation(c, cl, "Devil's Sight", []);
  let ctx = INV.levelUpContext(c, cl, 3, { swapOut: sign.id, pactBoon: "Pact of the Tome", pactSpells: ["Eldritch Blast", ""] });
  assert.deepEqual([ctx.level, ctx.pactBoon, ctx.known], [3, "Pact of the Tome", []]);
  assert.equal(ctx.knowsSpell("Eldritch Blast"), true, "the Tome's new cantrips count");
  // Once a pact is chosen, the level-up's own pick is ignored.
  cl.pactBoon = "Pact of the Blade";
  ctx = INV.levelUpContext(c, cl, 4, { pactBoon: "Pact of the Tome", pactSpells: ["Eldritch Blast"] });
  assert.equal(ctx.pactBoon, "Pact of the Blade");
  assert.equal(ctx.knowsSpell("Eldritch Blast"), false);
  assert.deepEqual(ctx.known, ["Devil's Sight"]);
});

test("level-up problems, in the order the dialog shows them", () => {
  const c = warlock(2, { spells: [{ name: "Eldritch Blast" }] });
  const cl = c.classes[0];
  const problem = (level, choice) => INV.levelUpProblem(c, cl, level, { picks: [], ...choice });
  assert.equal(INV.levelUpProblem(c, null, 1, {}), null, "nothing at warlock 1");
  // Warlock 2: two new ones.
  cl.level = 1;
  assert.equal(problem(2, {}), "Choose 2 different invocations.");
  assert.equal(problem(2, { picks: ["Devil's Sight"] }), "Choose 2 different invocations.");
  assert.equal(problem(2, { picks: ["Devil's Sight", "Devil's Sight"] }), "Choose 2 different invocations.");
  assert.equal(problem(2, { picks: ["Devil's Sight", "Lifedrinker"] }), "Lifedrinker can't be learned now (warlock 12). Pick another.");
  assert.equal(problem(2, { picks: ["Devil's Sight", "Made Up"] }), "Made Up can't be learned now (unknown). Pick another.");
  assert.equal(problem(2, { picks: ["Devil's Sight", "Agonizing Blast"] }), null);
  assert.equal(problem(2, { picks: ["Devil's Sight", "Agonizing Blast", "Extra"] }), null, "picks past the slots are ignored");
  // Warlock 3: the Pact Boon first.
  cl.level = 2;
  INV.learnInvocation(c, cl, "Devil's Sight", []);
  INV.learnInvocation(c, cl, "Agonizing Blast", []);
  assert.equal(problem(3, {}), "Choose your Pact Boon.");
  assert.equal(problem(3, { pactBoon: "Pact of Nothing" }), "Choose your Pact Boon.");
  assert.equal(problem(3, { pactBoon: "Pact of the Blade" }), null);
  assert.equal(problem(3, { pactBoon: "Pact of the Tome" }), "Choose 3 cantrips from any class for your Pact of the Tome.");
  assert.equal(problem(3, { pactBoon: "Pact of the Tome", pactSpells: ["Guidance", "Guidance", "Light"] }), "Choose 3 cantrips from any class for your Pact of the Tome.");
  assert.equal(problem(3, { pactBoon: "Pact of the Tome", pactSpells: ["Guidance", "Light", "Bless"] }), "Choose 3 cantrips from any class for your Pact of the Tome.", "Bless isn't a cantrip");
  assert.equal(problem(3, { pactBoon: "Pact of the Tome", pactSpells: ["Guidance", "Light", "Mage Hand"] }), null);
  // A swap needs its replacement, which may use the pact picked now.
  const tome = { pactBoon: "Pact of the Tome", pactSpells: ["Guidance", "Light", "Mage Hand"] };
  const swapOut = INV.knownInvocations(cl)[0].id;
  assert.equal(problem(3, { ...tome, swapOut }), "Choose your new invocation.");
  assert.equal(problem(3, { ...tome, swapOut, picks: ["Agonizing Blast"] }), "Agonizing Blast can't be learned now (known). Pick another.");
  assert.equal(problem(3, { ...tome, swapOut, picks: ["Devil's Sight"] }), null, "taking back the one given up is allowed");
  assert.equal(problem(3, { ...tome, swapOut, picks: ["Book of Ancient Secrets"] }), "Choose 2 1st-level ritual spells from any class for Book of Ancient Secrets.");
  assert.equal(problem(3, { ...tome, swapOut, picks: ["Book of Ancient Secrets"], pickSpells: { "Book of Ancient Secrets": ["Alarm", "Hex"] } }),
    "Choose 2 1st-level ritual spells from any class for Book of Ancient Secrets.", "Hex isn't a ritual");
  assert.equal(problem(3, { ...tome, swapOut, picks: ["Book of Ancient Secrets"], pickSpells: { "Book of Ancient Secrets": ["Alarm", "Find Familiar"] } }), null);
  assert.equal(problem(3, { pactBoon: "Pact of the Blade", swapOut, picks: ["Book of Ancient Secrets"] }),
    "Book of Ancient Secrets can't be learned now (needs Tome pact). Pick another.");
});

test("level-up apply and undo: pact, new invocations and a swap", () => {
  const c = warlock(2, { spells: [{ name: "Eldritch Blast" }], skillProfs: {} });
  const cl = c.classes[0];
  const shadows = INV.learnInvocation(c, cl, "Armor of Shadows", []);
  INV.learnInvocation(c, cl, "Agonizing Blast", []);
  const choice = { pactBoon: "Pact of the Tome", pactSpells: ["Guidance", "", "Light", "Mage Hand"], picks: ["Beguiling Influence", "Ignored"], swapOut: shadows.id };
  assert.equal(INV.levelUpProblem(c, cl, 3, { ...choice, pactSpells: ["Guidance", "Light", "Mage Hand"] }), null);
  const rec = INV.applyLevelUpChoices(c, cl, 3, choice);
  assert.equal(cl.pactBoon, "Pact of the Tome");
  assert.deepEqual(cl.pactSpells, ["Guidance", "Light", "Mage Hand"], "blanks are dropped");
  assert.equal(rec.pactBoonSet, true);
  assert.equal(rec.invSwappedOut.name, "Armor of Shadows");
  assert.equal(rec.invAdded.length, 1, "only as many as the slots");
  assert.deepEqual(names(cl), ["Agonizing Blast", "Beguiling Influence"]);
  assert.equal(c.skillProfs.Persuasion.prof, true);
  assert.deepEqual(rec.gained.map((g) => [g.name, g.tag]), [["Pact of the Tome", "Pact Boon"], ["Beguiling Influence", "Invocation"]]);
  assert.equal(rec.gained[0].text, pactBoonDef("Pact of the Tome").summary);
  // Undo puts everything back.
  INV.undoLevelUpChoices(c, cl, rec);
  assert.deepEqual(names(cl).sort(), ["Agonizing Blast", "Armor of Shadows"]);
  assert.equal(c.skillProfs.Persuasion.prof, false);
  assert.equal(cl.pactBoon, undefined);
  assert.equal(cl.pactSpells, undefined);
  // An empty record (an old save, a non-warlock level) undoes nothing.
  INV.undoLevelUpChoices(c, cl, {});
  assert.equal(INV.knownInvocations(cl).length, 2);
  // Nothing happens at warlock 1, and an unknown pact isn't saved.
  assert.deepEqual(INV.applyLevelUpChoices(c, cl, 1, { picks: ["Devil's Sight"] }), { pactBoonSet: false, invAdded: [], invSwappedOut: null, gained: [] });
  const bad = INV.applyLevelUpChoices(c, { name: "Warlock", level: 2, invocations: [{ id: "a", name: "Devil's Sight" }, { id: "b", name: "Beast Speech" }] }, 3, { pactBoon: "Pact of Nothing" });
  assert.equal(bad.pactBoonSet, false);
  // A book picked on the level-up keeps its rituals.
  const tomeLock = warlock(3, {}, { pactBoon: "Pact of the Tome", invocations: [{ id: "a", name: "Devil's Sight" }, { id: "b", name: "Beast Speech" }] });
  const r2 = INV.applyLevelUpChoices(tomeLock, tomeLock.classes[0], 4, { swapOut: "b", picks: ["Book of Ancient Secrets"], pickSpells: { "Book of Ancient Secrets": ["Alarm", "Find Familiar"] } });
  assert.deepEqual(INV.knownInvocations(tomeLock.classes[0]).map((e) => [e.name, e.spells]), [["Devil's Sight", undefined], ["Book of Ancient Secrets", ["Alarm", "Find Familiar"]]]);
  assert.equal(r2.pactBoonSet, false);
});

test("Undo last level-up takes back the level's invocations and Pact Boon", (t) => {
  const c = warlock(2, { spells: [{ name: "Eldritch Blast" }], skillProfs: {}, hp: { max: 20, current: 20, temp: 0 } });
  const cl = c.classes[0];
  const shadows = INV.learnInvocation(c, cl, "Armor of Shadows", []);
  INV.learnInvocation(c, cl, "Agonizing Blast", []);
  // What the dialog's finish() does for warlock 3.
  const applied = INV.applyLevelUpChoices(c, cl, 3, { pactBoon: "Pact of the Chain", picks: ["Beguiling Influence"], swapOut: shadows.id });
  cl.level = 3;
  c.hp.max += 7; c.hp.current += 7;
  c.levelHistory = [{ className: "Warlock", isNewClass: false, prevSubclass: "The Fiend", hpGain: 7, toughGain: 0, speedGain: 0,
    asi: null, featId: null, unlockIds: [], prevSpellcasting: { ability: "cha", slots: {}, pact: null },
    pactBoonSet: applied.pactBoonSet, invAdded: applied.invAdded, invSwappedOut: applied.invSwappedOut }];
  assert.ok(H.featureSpells(c).some((s) => s.name === "Find Familiar"));
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.equal(cl.level, 2);
  assert.equal(cl.pactBoon, undefined);
  assert.deepEqual(names(cl).sort(), ["Agonizing Blast", "Armor of Shadows"]);
  assert.equal(c.skillProfs.Persuasion.prof, false);
  assert.ok(!H.featureSpells(c).some((s) => s.name === "Find Familiar"));
  assert.equal(c.levelHistory.length, 0);
});

/* ================================================================
   The Eldritch invocations card renders in every state
   ================================================================ */
test("the invocations card: none for non-warlocks, and every state draws", (t) => {
  withFakeDom(t, () => {
    assert.equal(renderInvocationsCard(makeChar([{ name: "Fighter", level: 5 }])), null);
    assert.ok(renderInvocationsCard(warlock(1)), "level 1: the note about level 2");
    assert.ok(renderInvocationsCard(warlock(2)), "level 2 with nothing learned");
    assert.ok(renderInvocationsCard(warlock(3)), "level 3 without a Pact Boon");
    // Pending picks, a broken prerequisite, an older custom feature, more than due.
    const busy = warlock(5, { spells: [], features: [{ id: "f", name: "Devil's Sight" }] },
      { pactBoon: "Pact of the Tome", pactSpells: [] });
    const cl = busy.classes[0];
    for(const n of ["Book of Ancient Secrets", "Agonizing Blast", "Beguiling Influence", "Armor of Shadows", "Tomb of Levistus"]) INV.learnInvocation(busy, cl, n, []);
    assert.doesNotThrow(() => renderInvocationsCard(busy));
    cl.pactSpells = ["Eldritch Blast", "Light", "Guidance"];
    assert.doesNotThrow(() => renderInvocationsCard(busy), "with the Eldritch Blast box");
  });
});
