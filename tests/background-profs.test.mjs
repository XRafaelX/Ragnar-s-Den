/* Background proficiencies (Phase A2 of the 2026-10-14 review): the
   background data checked against the published pages on 2026-10-15
   (.claude/research/races-backgrounds.md), the tools each background gives
   or lets the player choose (BACKGROUND_PROFS, run by
   js/core/class-picks.js), the languages a background names or limits,
   the offer to correct older sheets' background skills, and a shifter's
   type skill. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as CP from "../js/core/class-picks.js";
import * as W from "../js/wizard/wizard-core.js";
import { TOOL_GROUPS } from "../js/core/feat-picks.js";
import { BACKGROUND_INFO, BACKGROUND_TOOLS, BACKGROUND_LANGUAGES, BACKGROUND_PROFS, BACKGROUND_LANGUAGE_RULES, BACKGROUND_SKILL_FIXES } from "../js/data/backgrounds.js";
import { SKILLS } from "../js/data/abilities-skills.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { renderClassPicksCard } from "../js/render/panels/class-picks.js";
import { withFakeDom } from "./fake-dom.mjs";

const SKILL_NAMES = SKILLS.map((s) => s[0]);
const ALL_TOOLS = Object.values(TOOL_GROUPS).flat();

function makeChar(background, extra = {}){
  const c = newCharacter("Test");
  c.background = background;
  c.classes = [{ name: "Wizard", subclass: "", level: 1 }];
  Object.assign(c, extra);
  return c;
}
const bgGrant = (c) => {
  const g = CP.backgroundGrants(c).find((x) => /:pick$/.test(x.key));
  assert.ok(g, "no background pick for " + c.background);
  g.cl = CP.backgroundEntry(c);
  return g;
};
const ctxOf = (c, g) => CP.classPickContext(c, g.cl, g.key);
const open = (c, g, i, slots = []) => CP.slotOptions(g.def, slots, i, ctxOf(c, g)).filter((o) => !o.reason).map((o) => o.value);

/* ================================================================
   Data, against the published pages
   ================================================================ */
test("background data: every tool is a real tool, every kind a group or tool, every background covered", () => {
  const names = Object.keys(BACKGROUND_TOOLS);
  assert.equal(names.length, 67);
  for(const name of names){
    const p = BACKGROUND_PROFS[name];
    if(!p){ assert.equal(BACKGROUND_TOOLS[name], "None", name + ": no tools in the data, so none in the text"); continue; }
    assert.notEqual(BACKGROUND_TOOLS[name], "None", name + ": tools in the data, so some in the text");
    (p.tools || []).forEach((t) => assert.ok(ALL_TOOLS.includes(t), name + ": tool " + t));
    for(const slot of p.pick || []){
      assert.ok(["tool", "toolOrLanguage", "choice"].includes(slot.kind), name + ": kind " + slot.kind);
      if(slot.group) assert.ok(TOOL_GROUPS[slot.group], name + ": group " + slot.group);
      (slot.options || []).forEach((t) => assert.ok(slot.kind === "choice" || ALL_TOOLS.includes(t), name + ": option " + t));
      (slot.kinds || []).forEach((k) => assert.ok(TOOL_GROUPS[k] || ALL_TOOLS.includes(k), name + ": kind " + k));
      if(slot.byChoice) Object.values(slot.byChoice.groups).forEach((g) => assert.ok(TOOL_GROUPS[g], name + ": house group " + g));
    }
    if(p.toolsByChoice) Object.values(p.toolsByChoice.tools).flat().forEach((t) => assert.ok(ALL_TOOLS.includes(t), name + ": house tool " + t));
  }
  for(const [name, rules] of Object.entries(BACKGROUND_LANGUAGE_RULES)){
    assert.ok(BACKGROUND_TOOLS[name], name + " is a background");
    if(rules.options) assert.ok(BACKGROUND_LANGUAGES[name] >= 1 && rules.options.length >= 2, name + ": a short list needs a pick to use it");
  }
});

test("background data: the corrections from the published pages", () => {
  const skills = (n) => BACKGROUND_INFO[n].skills;
  assert.deepEqual(skills("Lorehold Student"), ["History", "Religion"]);
  assert.deepEqual(skills("Prismari Student"), ["Acrobatics", "Performance"]);
  assert.deepEqual(skills("Silverquill Student"), ["Intimidation", "Persuasion"]);
  assert.deepEqual(skills("Witherbloom Student"), ["Nature", "Survival"]);
  assert.deepEqual(skills("Golgari Agent"), ["Nature", "Survival"]);
  assert.deepEqual(skills("Orzhov Representative"), ["Intimidation", "Religion"]);
  assert.deepEqual(skills("Knight of Solamnia"), ["Athletics", "Survival"]);
  // The app's Investigator is the City Watch variant: it stays as it was.
  assert.deepEqual(skills("Investigator"), ["Insight", "Investigation"]);
  assert.equal(BACKGROUND_LANGUAGES["Investigator"], 2);
  assert.equal(BACKGROUND_INFO["Planar Philosopher"].skillPick.options.length, SKILL_NAMES.length - 1, "any skill but Arcana");
  const langs = { "Lorehold Student": 2, "Silverquill Student": 2, "Knight of Solamnia": 2, "Mage of High Sorcery": 2, "Gambler": 1, "Plaintiff": 1,
    "Failed Merchant": 1, "Witchlight Hand": 1, "Dimir Operative": 1, "Boros Legionnaire": 1, "Gruul Anarch": 1, "Izzet Engineer": 1,
    "Rakdos Cultist": 1, "Selesnya Initiate": 1, "Rune Carver": 0, "Giant Foundling": 1, "Clan Crafter": 0, "Haunted One": 2 };
  for(const [n, count] of Object.entries(langs)) assert.equal(BACKGROUND_LANGUAGES[n], count, n + " languages");
  const tools = (n) => CP.backgroundGrantsFor(n).map((g) => g.def.tools || g.def.pick);
  assert.deepEqual(BACKGROUND_PROFS["Marine"].tools, ["Vehicles (land)", "Vehicles (water)"]);
  assert.equal(BACKGROUND_PROFS["Fisher"], undefined, "no tool");
  assert.equal(BACKGROUND_PROFS["Lorehold Student"], undefined, "no tool");
  assert.deepEqual(BACKGROUND_PROFS["Dimir Operative"].tools, ["Disguise kit"]);
  assert.deepEqual(BACKGROUND_PROFS["Witherbloom Student"].tools, ["Herbalism kit"]);
  assert.deepEqual(BACKGROUND_PROFS["Selesnya Initiate"].pick[0].kinds, ["Artisan's tools", "Musical instruments"]);
  assert.equal(BACKGROUND_PROFS["Boros Legionnaire"].pick[0].group, "Gaming sets");
  assert.equal(tools("Acolyte").length, 0);
});

/* ================================================================
   The sheet
   ================================================================ */
test("given tools: an Urchin's, read from the data, with no picks to make", () => {
  const c = ensureShape(makeChar("Urchin"));
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Disguise kit", "Thieves' tools"]);
  assert.ok(!CP.pendingClassPicks(c).length);
});

test("a Criminal's gaming set: pending until picked, then a proficiency; picking again replaces it", () => {
  const c = ensureShape(makeChar("Criminal"));
  const g = bgGrant(c);
  assert.equal(g.source, "Background · Criminal");
  assert.ok(CP.pendingClassPicks(c).some((x) => x.key === g.key), "waits on the Feature choices card");
  assert.deepEqual(open(c, g, 0), TOOL_GROUPS["Gaming sets"]);
  assert.equal(CP.slotLabel(g.def, [], 0, ctxOf(c, g)), "Gain proficiency with one gaming set of your choice");
  CP.applyClassPicks(c, g.cl, g, [["Dice set"]]);
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Thieves' tools", "Dice set"]);
  assert.equal(CP.backgroundPicksText(c), "Dice set");
  CP.applyClassPicks(c, g.cl, g, [["Playing card set"]]);
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Thieves' tools", "Playing card set"]);
});

test("one of each kind: a Selesnya's artisan's tools or instrument, an Urban Bounty Hunter's two different kinds", (t) => {
  const sel = ensureShape(makeChar("Selesnya Initiate"));
  const sg = bgGrant(sel);
  assert.equal(open(sel, sg, 0).length, TOOL_GROUPS["Artisan's tools"].length + TOOL_GROUPS["Musical instruments"].length);
  assert.equal(CP.slotLabel(sg.def, [], 0, ctxOf(sel, sg)), "Gain proficiency with one type of artisan's tools or one musical instrument");
  const ubh = ensureShape(makeChar("Urban Bounty Hunter"));
  const ug = bgGrant(ubh);
  assert.ok(open(ubh, ug, 0).includes("Thieves' tools"));
  assert.match(CP.classPicksProblem(ug, [["Lute", "Flute"]], ctxOf(ubh, ug)), /^Choose tools of different kinds for Urban Bounty Hunter\.$/);
  assert.equal(CP.classPicksProblem(ug, [["Lute", "Thieves' tools"]], ctxOf(ubh, ug)), "");
  // A rogue already has thieves' tools: still two kinds to pick from the other two.
  const rogue = ensureShape(makeChar("Urban Bounty Hunter", { classes: [{ name: "Rogue", subclass: "", level: 1 }] }));
  assert.ok(!open(rogue, bgGrant(rogue), 0).includes("Thieves' tools"), "already proficient");
});

test("House Agent: the house sets the tools; some houses add a gaming set or instrument", () => {
  const c = ensureShape(makeChar("House Agent"));
  const g = bgGrant(c);
  assert.equal(CP.classPicksProblem(g, [], ctxOf(c, g)), "Choose a house for House Agent.");
  assert.deepEqual(open(c, g, 1, [["Cannith"]]), [], "Cannith: nothing more to pick");
  CP.applyClassPicks(c, g.cl, g, [["Cannith"], []]);
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Alchemist's supplies", "Tinker's tools"]);
  assert.deepEqual(open(c, g, 1, [["Deneith"]]), TOOL_GROUPS["Gaming sets"]);
  assert.equal(CP.slotLabel(g.def, [["Deneith"]], 1, ctxOf(c, g)), "Your house also gives one gaming set of your choice");
  assert.equal(CP.classPicksProblem(g, [["Deneith"], []], ctxOf(c, g)), "Choose a gaming set for House Agent.");
  CP.applyClassPicks(c, g.cl, g, [["Deneith"], ["Dragonchess set"]]);
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Vehicles (land)", "Dragonchess set"]);
  CP.applyClassPicks(c, g.cl, g, [["Lyrandar"], []]);
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Navigator's tools", "Vehicles (air)", "Vehicles (water)"]);
});

test("Guild Merchant: navigator's tools, or one more language that goes on the sheet", () => {
  const c = ensureShape(makeChar("Guild Merchant"));
  const g = bgGrant(c);
  const opts = open(c, g, 0);
  assert.ok(opts.includes("Navigator's tools") && opts.includes("Dwarvish"));
  assert.equal(CP.slotLabel(g.def, [], 0, ctxOf(c, g)), "Gain proficiency with navigator's tools, or learn a language");
  CP.applyClassPicks(c, g.cl, g, [["Dwarvish"]]);
  assert.ok(c.languages.includes("Dwarvish"));
  assert.deepEqual(CP.backgroundProficiencies(c).tools, []);
  CP.applyClassPicks(c, g.cl, g, [["Navigator's tools"]]);
  assert.ok(!c.languages.includes("Dwarvish"), "the language goes when the pick changes");
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Navigator's tools"]);
});

test("older sheets: a Lorehold Student's Arcana swapped for Religion when the player says so", (t) => {
  const old = () => {
    const c = makeChar("Lorehold Student");
    c.skillProfs.History = { prof: true, expertise: false };
    c.skillProfs.Arcana = { prof: true, expertise: true };
    return ensureShape(c);
  };
  const c = old();
  assert.deepEqual(CP.backgroundSkillFix(c), { background: "Lorehold Student", now: ["Religion"], was: ["Arcana"] });
  let card;
  withFakeDom(t, () => { card = renderClassPicksCard(c); });
  assert.ok(card, "the card offers the swap even with nothing else to choose");
  CP.resolveBackgroundSkillFix(c, true);
  assert.equal(c.skillProfs.Religion.prof, true);
  assert.equal(c.skillProfs.Religion.expertise, true, "expertise moves with it");
  assert.equal(c.skillProfs.Arcana.prof, false);
  assert.equal(CP.backgroundSkillFix(c), null);
  const kept = old();
  CP.resolveBackgroundSkillFix(kept, false);
  assert.equal(kept.skillProfs.Arcana.prof, true, "kept as it is");
  assert.equal(CP.backgroundSkillFix(kept), null, "and not offered again");
  // A sheet that has the book's skills already is never asked.
  const fine = makeChar("Lorehold Student");
  fine.skillProfs.History = { prof: true, expertise: false };
  fine.skillProfs.Religion = { prof: true, expertise: false };
  assert.equal(CP.backgroundSkillFix(ensureShape(fine)), null);
  assert.ok(Object.keys(BACKGROUND_SKILL_FIXES).every((n) => BACKGROUND_SKILL_FIXES[n].now.every((sk) => BACKGROUND_INFO[n].skills.includes(sk))), "fixes point at the corrected skills");
});

test("a shifter's type gives its skill: on an older sheet the card asks for the type", () => {
  const c = ensureShape(makeChar("Acolyte", { race: "Shifter" }));
  const g = CP.raceGrants(c).find((x) => x.name === "Shifter Type");
  g.cl = CP.raceEntry(c);
  assert.ok(CP.pendingClassPicks(c).some((x) => x.key === g.key));
  assert.deepEqual(open(c, g, 1, [["Longtooth"]]), ["Intimidation"]);
  CP.applyClassPicks(c, g.cl, g, CP.fillSlots(g.def, [["Longtooth"]], ctxOf(c, g)));
  assert.equal(c.skillProfs.Intimidation.prof, true);
});

/* ================================================================
   Creation wizard
   ================================================================ */
function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], preset: "", profPicks: {}, feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Background test", classId: "Fighter", race: "Human", background: "Criminal", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Athletics", "Perception"],
    classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }, languageChoices: ["Elvish"]
  }, choices, { raceChoices: rc });
}
const inWizard = (t, choices, fn) => { let out; withFakeDom(t, () => { startWizard(choices); out = fn(); }); return out; };
const create = (t, choices) => inWizard(t, choices, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });

test("wizard: the Skills step asks for a Criminal's gaming set; the new sheet has both tools", (t) => {
  assert.match(inWizard(t, {}, () => W.validateStep("skills")), /^Choose a gaming set for Criminal\.$/);
  const choices = { bgPicks: { "bg:Criminal:pick": [["Three-Dragon Ante set"]] } };
  assert.equal(inWizard(t, choices, () => W.validateStep("skills")), null);
  const c = create(t, choices);
  assert.deepEqual(CP.backgroundProficiencies(c).tools, ["Thieves' tools", "Three-Dragon Ante set"]);
  assert.ok(!CP.pendingClassPicks(c).length);
  // Skipping the pick (no validation) leaves it pending rather than empty.
  const skipped = create(t, {});
  assert.ok(CP.pendingClassPicks(skipped).some((g) => g.name === "Criminal"));
});

test("wizard: a guild's language comes from its list; a background's own language is fixed or freed", (t) => {
  const boros = (languageChoices) => ({ background: "Boros Legionnaire", languageChoices, bgPicks: { "bg:Boros Legionnaire:pick": [["Dice set"]] } });
  const plan = inWizard(t, boros([]), () => W.languagePlan());
  assert.deepEqual(plan.slots.map((s) => s.source), ["Human", "Boros Legionnaire"]);
  assert.deepEqual(plan.slots[1].options, ["Celestial", "Draconic", "Goblin", "Minotaur"]);
  assert.match(inWizard(t, boros(["Elvish", "Dwarvish"]), () => W.validateStep("languages")), /^Your Boros Legionnaire background's language is one of Celestial, Draconic, Goblin, Minotaur\.$/);
  assert.equal(inWizard(t, boros(["Elvish", "Minotaur"]), () => W.validateStep("languages")), null);
  // Rune Carver names Giant; a goliath speaks it already, so it's a free pick instead.
  const human = inWizard(t, { background: "Rune Carver" }, () => W.languagePlan());
  assert.ok(human.fixed.includes("Giant"));
  assert.ok(!human.slots.some((s) => s.source === "Rune Carver"));
  const goliath = inWizard(t, { background: "Rune Carver", race: "Goliath" }, () => W.languagePlan());
  assert.equal(goliath.slots.filter((s) => s.source === "Rune Carver").length, 1);
});

test("wizard: a shifter's type picked for its abilities also gives the skill, without a second picker", (t) => {
  const choices = { race: "Shifter", raceChoices: { preset: "Swiftstride" } };
  assert.ok(!inWizard(t, choices, () => W.wizardRacePickGrants()).some((g) => g.name === "Shifter Type"), "not asked again");
  assert.ok(inWizard(t, choices, () => W.wizardRaceSkills()).includes("Acrobatics"));
  const c = create(t, Object.assign({ bgPicks: { "bg:Criminal:pick": [["Dice set"]] } }, choices));
  assert.equal(c.skillProfs.Acrobatics.prof, true);
  assert.deepEqual(c.racePicks.profPicks["race:Shifter Type:pick"].slots, [["Swiftstride"], ["Acrobatics"]]);
});
