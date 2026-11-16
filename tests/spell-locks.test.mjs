/* Spells a character already has, in the creation wizard's feat pickers
   (2026-11-16). A race's feat and a background's or Origin feat know the
   species' spells and the other feat's picks: a cantrip already had is
   refused, a level 1+ spell is allowed (the feat adds a free cast). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as W from "../js/wizard/wizard-core.js";
import { featPicksProblem, featDef } from "../js/core/feat-picks.js";
import { withFakeDom } from "./fake-dom.mjs";

function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], alt: false, preset: "", profPicks: {}, feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Locks", classId: "Fighter", race: "Tiefling", background: "Acolyte (2024)", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Athletics", "Perception"],
    classChoices: { fightingStyle: "Defense" }, equipment: {}
  }, choices, { raceChoices: rc });
}
const inWizard = (t, choices, fn) => { let out; withFakeDom(t, () => { startWizard(choices); out = fn(); }); return out; };
const mi = (spells, castAbility = "wis") => ({ background: "Acolyte (2024)", name: "Magic Initiate (2024)", picks: { option: "Cleric", castAbility, spells } });

test("a background's Magic Initiate knows the species' cantrip: a tiefling's Thaumaturgy is refused", (t) => {
  const ctx = inWizard(t, {}, () => W.wizardFeatContext({ forBackgroundFeat: true }));
  assert.match(ctx.spellHeld("Thaumaturgy"), /^from /, "the tiefling's Infernal Legacy");
  assert.equal(ctx.spellHeld("Guidance"), "");
  const err = inWizard(t, { bgFeat: mi(["Thaumaturgy", "Guidance", "Bless"]) }, () => W.validateStep("bgFeat"));
  assert.match(err, /^You already have Thaumaturgy \(from .+\)\. Pick another cantrip for Magic Initiate \(2024\)\.$/);
  assert.equal(inWizard(t, { bgFeat: mi(["Light", "Guidance", "Bless"]) }, () => W.validateStep("bgFeat")), null);
  // A human doesn't have it.
  assert.equal(inWizard(t, { race: "Human", bgFeat: mi(["Thaumaturgy", "Guidance", "Bless"]) }, () => W.validateStep("bgFeat")), null);
});

test("a race's feat and a background's feat see each other's spells", (t) => {
  const vh = { race: "Variant Human", raceChoices: { abilities: ["str", "con"], feat: "Magic Initiate", featPicks: { option: "Wizard", spells: ["Light", "Fire Bolt", "Shield"] } } };
  // The background's feat can't take Light again...
  const err = inWizard(t, { ...vh, bgFeat: mi(["Light", "Guidance", "Bless"]) }, () => W.validateStep("bgFeat"));
  assert.match(err, /You already have Light \(from Magic Initiate\)/);
  // ...and the race's feat sees the background's picks too.
  const ctx = inWizard(t, { ...vh, bgFeat: mi(["Sacred Flame", "Guidance", "Bless"]) }, () => W.wizardFeatContext());
  assert.match(ctx.spellHeld("Sacred Flame"), /^from Magic Initiate \(2024\)$/);
  assert.equal(ctx.spellHeld("Light"), "", "its own picks aren't held elsewhere");
});

test("a level 1 spell already had stays allowed: the feat adds a free cast", (t) => {
  const vh = { race: "Variant Human", raceChoices: { abilities: ["str", "con"], feat: "Magic Initiate", featPicks: { option: "Cleric", spells: ["Light", "Guidance", "Bless"] } } };
  const ctx = inWizard(t, { ...vh, bgFeat: mi(["Sacred Flame", "Spare the Dying", "Bless"]) }, () => W.wizardFeatContext({ forBackgroundFeat: true }));
  assert.match(ctx.spellHeld("Bless"), /^from Magic Initiate$/, "held from the race's feat");
  assert.equal(inWizard(t, { ...vh, bgFeat: mi(["Sacred Flame", "Spare the Dying", "Bless"]) }, () => W.validateStep("bgFeat")), null, "but Bless twice is allowed");
});

test("the same feat on the sheet doesn't count its own spells", () => {
  const def = featDef("Magic Initiate (2024)");
  const ctx = { spellHeld: (n) => (n === "Light" ? "from Magic Initiate (2024)" : n === "Guidance" ? "known" : "") };
  assert.equal(featPicksProblem(def, { option: "Cleric", castAbility: "wis", spells: ["Light", "Sacred Flame", "Bless"] }, ctx), "");
  assert.equal(featPicksProblem(def, { option: "Cleric", castAbility: "wis", spells: ["Guidance", "Sacred Flame", "Bless"] }, ctx),
    "You already have Guidance (known). Pick another cantrip for Magic Initiate (2024).");
});

test("a subclass picked after the feats that gives a feat's cantrip: noted, not blocked", (t) => {
  const vh = { race: "Variant Human", classId: "Cleric", raceChoices: { abilities: ["wis", "con"], feat: "Magic Initiate", featPicks: { option: "Wizard", spells: ["Light", "Fire Bolt", "Shield"] } },
    skillChoices: ["History", "Medicine"], classChoices: { subclass: "Light Domain" } };
  assert.deepEqual(inWizard(t, vh, () => W.wizardFeatCantripOverlap()).map((o) => [o.name, o.feat]), [["Light", "Magic Initiate"]]);
  assert.deepEqual(inWizard(t, { ...vh, classChoices: { subclass: "Life Domain" } }, () => W.wizardFeatCantripOverlap()), [], "Life Domain gives no cantrip");
});
