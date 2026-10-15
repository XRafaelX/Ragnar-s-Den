/* Proficiencies gained twice (Phase A3 of the 2026-10-14 review). The
   Basic Rules (2014): "If a character would gain the same proficiency from
   two different sources, he or she can choose a different proficiency of
   the same kind (skill or tool) instead." Checked on D&D Beyond's Basic
   Rules and roll20 on 2026-10-15. Two halves: a pick list that runs short
   widens to any skill or tool, and a skill or tool two sources give
   outright earns a replacement pick (overlapGrants). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as CP from "../js/core/class-picks.js";
import * as W from "../js/wizard/wizard-core.js";
import { TOOL_GROUPS } from "../js/core/feat-picks.js";
import { SKILLS } from "../js/data/abilities-skills.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { renderClassPicksCard } from "../js/render/panels/class-picks.js";
import { withFakeDom } from "./fake-dom.mjs";

const ALL_TOOLS = Object.values(TOOL_GROUPS).flat();

function makeChar(race, background, classes = [{ name: "Wizard", subclass: "", level: 1 }], skills = []){
  const c = newCharacter("Test");
  Object.assign(c, { race, background, classes });
  skills.forEach((sk) => { c.skillProfs[sk] = { prof: true, expertise: false }; });
  return c;
}
const raceGrant = (c, name) => { const g = CP.raceGrants(c).find((x) => x.name === name && /:pick$/.test(x.key)); g.cl = CP.raceEntry(c); return g; };
const twice = (c, kind) => { const g = CP.overlapGrants(c).find((x) => x.key === "overlap:" + kind); if(g) g.cl = CP.overlapEntry(c); return g; };
const ctxOf = (c, g) => CP.classPickContext(c, g.cl, g.key);
const open = (c, g, i, slots = []) => CP.slotOptions(g.def, slots, i, ctxOf(c, g)).filter((o) => !o.reason).map((o) => o.value);

/* ---- A list that runs short ---- */
test("a kenku with Acrobatics from its class and Stealth and Sleight of Hand from its background still picks two: Deception and any other skill", () => {
  const c = ensureShape(makeChar("Kenku", "Urchin", undefined, ["Acrobatics", "Sleight of Hand", "Stealth"]));
  const g = raceGrant(c, "Kenku Training");
  const opts = CP.slotOptions(g.def, [], 0, ctxOf(c, g));
  assert.ok(opts.filter((o) => !o.swap && !o.reason).map((o) => o.value).includes("Deception"));
  assert.ok(opts.some((o) => o.swap && o.value === "History" && o.group === "Any other skill"), "the rest of the skills join, marked as swaps");
  assert.ok(!CP.slotIsFixed(g.def, [], 0, ctxOf(c, g)), "a real choice now");
  assert.match(CP.classPicksProblem(g, [["Deception"]], ctxOf(c, g)), /^Choose 2 different skills for Kenku Training\.$/);
  assert.equal(CP.classPicksProblem(g, [["Deception", "History"]], ctxOf(c, g)), "");
  assert.equal(CP.slotLabel(g.def, [], 0, ctxOf(c, g)),
    "Gain proficiency in 2 of Acrobatics, Deception, Stealth and Sleight of Hand (you have some of these already, so any other skill can take their place)");
  // A list with room left doesn't grow.
  const fresh = ensureShape(makeChar("Kenku", "Sage"));
  assert.ok(!CP.slotOptions(fresh.racePicks && raceGrant(fresh, "Kenku Training").def, [], 0, ctxOf(fresh, raceGrant(fresh, "Kenku Training"))).some((o) => o.swap));
});

test("a dwarf who already has all three of its tools picks any other tool", () => {
  const c = ensureShape(makeChar("Hill Dwarf", "Acolyte"));
  c.feats = [{ id: "f", name: "Skilled", picks: { skills: [], tools: ["Smith's tools", "Brewer's supplies", "Mason's tools"] } }];
  const g = raceGrant(c, "Tool Proficiency");
  const opts = open(c, g, 0);
  assert.ok(!opts.includes("Smith's tools") && opts.includes("Tinker's tools"));
  assert.equal(opts.length, ALL_TOOLS.length - 3);
});

test("expertise, optional and weapon slots are left as they are", () => {
  const c = ensureShape(makeChar("Hobgoblin", "Acolyte", [{ name: "Fighter", subclass: "", level: 1 }]));
  const g = raceGrant(c, "Martial Training");
  assert.deepEqual(open(c, g, 0), [], "the rule covers skills and tools, not weapons");
});

/* ---- Given twice ---- */
test("an elf with the Far Traveler background gets Perception twice: another skill instead", (t) => {
  const c = ensureShape(makeChar("High Elf", "Far Traveler"));
  assert.deepEqual(CP.proficiencySources(c).skills.Perception, ["High Elf", "Far Traveler"]);
  const g = twice(c, "skills");
  assert.equal(g.name, "Perception given twice");
  assert.match(g.def.help, /^You get Perception \(High Elf and Far Traveler\) twice\. The rules let you choose a different skill in place of each one you get twice\.$/);
  assert.ok(CP.pendingClassPicks(c).some((x) => x.key === g.key), "waits on the Feature choices card");
  let card;
  withFakeDom(t, () => { card = renderClassPicksCard(c); });
  assert.ok(card);
  assert.equal(CP.classPicksProblem(g, [], ctxOf(c, g)), "Choose a skill for Perception given twice.");
  assert.ok(!open(c, g, 0).includes("Perception"));
  CP.applyClassPicks(c, g.cl, g, [["Arcana"]]);
  assert.equal(c.skillProfs.Arcana.prof, true);
  assert.ok(!CP.pendingClassPicks(c).some((x) => x.key === g.key), "made (the Far Traveler's instrument still waits)");
  // No longer given twice (another background): the replacement comes off.
  c.background = "Acolyte";
  CP.syncClassPicks(c);
  assert.equal(c.skillProfs.Arcana.prof, false);
  assert.equal(twice(c, "skills"), undefined);
});

test("a rogue with the Criminal or Urchin background has thieves' tools twice: another tool instead", () => {
  const c = ensureShape(makeChar("Human", "Urchin", [{ name: "Rogue", subclass: "", level: 1 }]));
  const g = twice(c, "tools");
  assert.equal(g.name, "Thieves' tools given twice");
  assert.deepEqual(CP.proficiencySources(c).tools["Thieves' tools"], ["Rogue", "Urchin"]);
  assert.ok(!open(c, g, 0).includes("Thieves' tools") && !open(c, g, 0).includes("Disguise kit"), "ones already had are greyed");
  CP.applyClassPicks(c, g.cl, g, [["Navigator's tools"]]);
  assert.deepEqual(CP.grantEntry(g.cl, g.key).slots, [["Navigator's tools"]]);
  assert.deepEqual(CP.overlapTools(c), ["Navigator's tools"], "listed with the character's tools");
  const again = twice(c, "tools");
  assert.ok(!open(c, again, 0, []).includes("Disguise kit"), "pickers still see what's had");
  // "Three musical instruments of your choice" is a choice, never counted as a tool.
  assert.equal(twice(ensureShape(makeChar("Human", "Entertainer", [{ name: "Bard", subclass: "", level: 1 }])), "tools"), undefined);
});

test("several given twice: one pick each, and nothing given twice means no grant", () => {
  // A tabaxi rogue with the Urchin background: Stealth twice (Tabaxi, Urchin) and thieves' tools twice.
  const c = ensureShape(makeChar("Tabaxi", "Urchin", [{ name: "Rogue", subclass: "", level: 1 }]));
  assert.equal(twice(c, "skills").def.pick[0].count, 1);
  assert.equal(twice(c, "tools").def.pick[0].count, 1);
  assert.deepEqual(CP.overlapGrants(ensureShape(makeChar("Human", "Sage"))), []);
});

/* ---- Creation wizard ---- */
function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], preset: "", profPicks: {}, feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Twice test", classId: "Fighter", race: "High Elf", background: "Far Traveler", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Athletics", "Survival"],
    classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }, languageChoices: ["Dwarvish", "Giant"],
    bgPicks: { "bg:Far Traveler:pick": [["Lute"]] }
  }, choices, { raceChoices: rc });
}
const inWizard = (t, choices, fn) => { let out; withFakeDom(t, () => { startWizard(choices); out = fn(); }); return out; };

test("wizard: the Skills step asks for a skill in place of Perception; the new sheet has it", (t) => {
  assert.deepEqual(inWizard(t, {}, () => W.wizardOverlapGrants().map((g) => g.name)), ["Perception given twice"]);
  assert.equal(inWizard(t, {}, () => W.validateStep("skills")), "Choose a skill for Perception given twice.");
  const choices = { overlapPicks: { "overlap:skills": [["History"]] } };
  assert.equal(inWizard(t, choices, () => W.validateStep("skills")), null);
  assert.ok(inWizard(t, choices, () => W.wizardSkillProfs()).History, "later steps see it as known");
  const c = inWizard(t, choices, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.equal(c.skillProfs.History.prof, true);
  assert.deepEqual(c.overlapPicks.profPicks["overlap:skills"].slots, [["History"]]);
  assert.ok(!CP.pendingClassPicks(c).length);
});
