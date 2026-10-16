/* Phase E2 of the 2026-10-14 review: cantrip swaps, checked 2026-10-16.
   - The artificer: "When you gain a level in this class, you can replace
     one of the artificer cantrips you know with another cantrip from the
     artificer spell list."
   - Tasha's Versatility features (only with the character's Tasha switch):
     at a level that grants Ability Score Improvement, replace one cantrip
     learned from the class's Spellcasting with another from its list
     (Cantrip Versatility for clerics and druids; the cantrip half of
     Bardic, Sorcerous and Eldritch Versatility, which change one thing a
     level: a sorcerer's Metamagic option or a cantrip).
   - Blessed / Druidic Warrior: "Whenever you gain a level in this class,
     you can replace one of these cantrips with another" from its list. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as LU from "../js/levelup/session.js";
import { finish, undoLastLevelUp } from "../js/levelup/apply.js";
import { makeStyleFeature } from "../js/core/fighting-styles.js";
import { newCharacter } from "../js/core/character.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(classes, spells, extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { classes, xp: 355000, hp: { max: 30, current: 30, temp: 0 },
    abilities: { str: 10, dex: 14, con: 14, int: 16, wis: 16, cha: 16 } }, extra);
  c.spells = spells.map((name, i) => ({ id: "s" + i, name, level: 0, prepared: true, learnedBy: classes[0].name }));
  return c;
}
const names = (c) => c.spells.map((s) => s.name);
function plan(t, c){
  let p;
  withFakeDom(t, () => { LU.openLevelUp(c); p = LU.currentLearnPlan(); LU.close(); });
  return p.cantripSwap;
}

test("the artificer may swap a cantrip at every level; undo puts it back", (t) => {
  const c = char([{ name: "Artificer", level: 2 }], ["Guidance", "Mending"]);
  assert.deepEqual(plan(t, c), { known: ["Guidance", "Mending"], from: "level", arcanum: [] });
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    LU.lu.subclass = "Alchemist"; LU.lu.hpMethod = "avg";
    LU.lu.versatilityPick = "cantrip:Guidance";
    const s = LU.learnSections().find((x) => x.id === "cantripIn");
    assert.ok(s.names.includes("Fire Bolt") && !s.names.includes("Mending") && !s.names.includes("Sacred Flame"), "artificer cantrips not known");
    LU.lu.learnPicks.cantripIn = ["Fire Bolt"];
    finish();
  });
  assert.deepEqual(names(c).sort(), ["Fire Bolt", "Mending"]);
  assert.equal(c.spells.find((s) => s.name === "Fire Bolt").learnedBy, "Artificer");
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual(names(c), ["Guidance", "Mending"], "back where it was");
});

test("a pick is needed once a cantrip is marked for replacing", (t) => {
  const c = char([{ name: "Artificer", subclass: "Alchemist", level: 3 }], ["Guidance", "Mending"]);
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    LU.lu.versatilityPick = "cantrip:Mending";
    assert.equal(LU.learnSections().find((x) => x.id === "cantripIn").count, 1);
    assert.equal(LU.validate("learn"), "Pick the cantrip that replaces the one you're swapping out.");
    LU.lu.learnPicks.cantripIn = ["Light"];
    assert.equal(LU.validate("learn"), null);
    LU.close();
  });
});

test("Tasha's Cantrip Versatility: clerics and druids at Ability Score Improvement levels, with the switch on", (t) => {
  const cleric = () => char([{ name: "Cleric", subclass: "Life Domain", level: 3 }], ["Guidance", "Light", "Sacred Flame"]);
  assert.equal(plan(t, cleric()), null, "Tasha's off: no swap");
  assert.deepEqual(plan(t, Object.assign(cleric(), { tashaOptional: true })), { known: ["Guidance", "Light", "Sacred Flame"], from: "Cantrip Versatility", arcanum: [] });
  const at5 = char([{ name: "Cleric", subclass: "Life Domain", level: 4 }], ["Guidance", "Light", "Sacred Flame", "Thaumaturgy"], { tashaOptional: true });
  assert.equal(plan(t, at5), null, "level 5 isn't an ASI level");
  const druid = char([{ name: "Druid", subclass: "Circle of the Land", level: 7 }], ["Druidcraft", "Shillelagh", "Produce Flame"], { tashaOptional: true });
  assert.equal(plan(t, druid).from, "Cantrip Versatility");
  const wiz = char([{ name: "Wizard", subclass: "School of Evocation", level: 3 }], ["Fire Bolt", "Light", "Mage Hand"], { tashaOptional: true });
  assert.equal(plan(t, wiz), null, "a wizard has none at level-up (Cantrip Formulas is after a long rest)");
});

test("Sorcerous Versatility changes one thing: a Metamagic option or a cantrip", (t) => {
  const c = char([{ name: "Sorcerer", subclass: "Draconic Bloodline", level: 3, options: { metamagic: [{ id: "m1", name: "Quickened Spell" }, { id: "m2", name: "Twinned Spell" }] } }],
    ["Fire Bolt", "Light", "Mage Hand", "Prestidigitation"], { tashaOptional: true });
  assert.equal(plan(t, c).from, "Sorcerous Versatility");
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    LU.lu.versatilityPick = "cantrip:Light";
    assert.equal(LU.cantripSwapOut(), "Light");
    LU.lu.optChoices.metamagic = { picks: [], swapOut: "m1" };
    assert.equal(LU.cantripSwapBlocked(), "a Metamagic option");
    assert.equal(LU.cantripSwapOut(), "", "the Metamagic change wins; no cantrip swap");
    assert.ok(!LU.learnSections().some((x) => x.id === "cantripIn"));
    LU.close();
  });
  const warlock = char([{ name: "Warlock", subclass: "The Fiend", level: 3, pactBoon: "Pact of the Blade" }], ["Eldritch Blast", "Minor Illusion"], { tashaOptional: true });
  assert.equal(plan(t, warlock).from, "Eldritch Versatility");
});

test("Blessed Warrior: a paladin level may swap one of its cantrips; undo swaps it back", (t) => {
  const style = makeStyleFeature("Blessed Warrior", { spells: ["Guidance", "Sacred Flame"] });
  const c = char([{ name: "Paladin", subclass: "Oath of Devotion", level: 3 }], [], { features: [style], tashaOptional: true });
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    assert.ok(LU.stepApplicable("style"), "the Style step shows for it");
    assert.equal(LU.styleCantripOffer().feature, style);
    LU.lu.asi.cha = 2; LU.lu.hpMethod = "avg";
    LU.lu.styleCantripOut = "Guidance";
    assert.equal(LU.validate("style"), "Pick the cleric cantrip that replaces Guidance.");
    LU.lu.styleCantripIn = "Sacred Flame";
    assert.match(LU.validate("style"), /You already have Sacred Flame/);
    LU.lu.styleCantripIn = "Thaumaturgy";
    finish();
  });
  assert.deepEqual(c.features.find((f) => f.id === style.id).picks.spells, ["Thaumaturgy", "Sacred Flame"]);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual(c.features.find((f) => f.id === style.id).picks.spells, ["Guidance", "Sacred Flame"]);
  // A ranger level doesn't change a paladin's Blessed Warrior.
  const multi = char([{ name: "Paladin", subclass: "Oath of Devotion", level: 3 }, { name: "Ranger", level: 2 }], [], { features: [makeStyleFeature("Blessed Warrior", { spells: ["Guidance", "Light"] })] });
  withFakeDom(t, () => { LU.openLevelUp(multi); LU.resetChoicesFor("Ranger"); assert.equal(LU.styleCantripOffer(), null); LU.close(); });
  // Druidic Warrior on a ranger level.
  const ranger = char([{ name: "Ranger", subclass: "Hunter", level: 4 }], [], { features: [makeStyleFeature("Druidic Warrior", { spells: ["Druidcraft", "Shillelagh"] })] });
  withFakeDom(t, () => { LU.openLevelUp(ranger); assert.equal(LU.styleCantripOffer().feature.fightingStyle, "Druidic Warrior"); LU.close(); });
});

/* ---- Bardic and Eldritch Versatility: one thing a level ---- */
test("Bardic Versatility: an Expertise skill moves to another proficient skill; undo moves it back", (t) => {
  const c = char([{ name: "Bard", subclass: "College of Lore", level: 7,
    profPicks: { "class:Expertise@3": { slots: [["Persuasion", "Deception"]], applied: { skills: [], expertise: ["Persuasion", "Deception"], languages: [], weaponItems: [] } } } }],
    ["Vicious Mockery", "Minor Illusion", "Light"], { tashaOptional: true,
      skillProfs: { Persuasion: { prof: true, expertise: true }, Deception: { prof: true, expertise: true }, Performance: { prof: true, expertise: false }, Insight: { prof: true, expertise: false } } });
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    const v = LU.versatilityChoices();
    assert.equal(v.from, "Bardic Versatility");
    assert.deepEqual(v.expertise, ["Persuasion", "Deception"]);
    LU.lu.versatilityPick = "expertise:Persuasion";
    assert.deepEqual(LU.expertiseTargets().sort(), ["Insight", "Performance"], "proficient, no expertise yet");
    assert.equal(LU.validate("learn"), "Pick the skill that gets expertise in place of Persuasion.");
    LU.lu.versatilitySkill = "Performance";
    assert.equal(LU.cantripSwapOut(), "", "no cantrip swap as well");
    LU.lu.asi.cha = 2; LU.lu.hpMethod = "avg"; LU.lu.learnPicks = {};
    finish();
  });
  assert.deepEqual([c.skillProfs.Persuasion, c.skillProfs.Performance], [{ prof: true, expertise: false }, { prof: true, expertise: true }]);
  assert.deepEqual(c.classes[0].profPicks["class:Expertise@3"].slots, [["Performance", "Deception"]]);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual([c.skillProfs.Persuasion.expertise, c.skillProfs.Performance.expertise], [true, false]);
  assert.deepEqual(c.classes[0].profPicks["class:Expertise@3"].slots, [["Persuasion", "Deception"]]);
});

test("Eldritch Versatility: a new Pact Boon, once nothing needs the old one; undo restores it", (t) => {
  const c = char([{ name: "Warlock", subclass: "The Fiend", level: 7, pactBoon: "Pact of the Blade",
    invocations: [{ id: "i1", name: "Thirsting Blade" }, { id: "i2", name: "Devil's Sight" }, { id: "i3", name: "Mask of Many Faces" }, { id: "i4", name: "Armor of Shadows" }] }],
    ["Eldritch Blast", "Minor Illusion", "Prestidigitation"], { tashaOptional: true });
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    assert.equal(LU.versatilityChoices().pact, "Pact of the Blade");
    assert.equal(LU.pactDue(), false);
    LU.lu.versatilityPick = "pact";
    assert.equal(LU.pactDue(), true, "the Pact Boon is picked again");
    assert.equal(LU.validate("invocations"), "Choose the Pact Boon that replaces your Pact of the Blade.");
    LU.lu.pactBoon = "Pact of the Chain";
    assert.equal(LU.validate("invocations"), "Thirsting Blade needs your Pact of the Blade. Swap it out below, or keep your Pact Boon.");
    LU.lu.swapOut = "i1"; LU.lu.invPicks = ["Voice of the Chain Master"];
    assert.equal(LU.validate("invocations"), null);
    LU.lu.asi.cha = 2; LU.lu.hpMethod = "avg"; LU.lu.learnPicks = {};
    finish();
  });
  const cl = c.classes[0];
  assert.equal(cl.pactBoon, "Pact of the Chain");
  assert.ok(cl.invocations.some((e) => e.name === "Voice of the Chain Master") && !cl.invocations.some((e) => e.name === "Thirsting Blade"));
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.equal(cl.pactBoon, "Pact of the Blade");
  assert.ok(cl.invocations.some((e) => e.name === "Thirsting Blade") && !cl.invocations.some((e) => e.name === "Voice of the Chain Master"));
  // Two invocations tied to the pact: only one swap a level, so no change.
  const c2 = char([{ name: "Warlock", level: 15, pactBoon: "Pact of the Blade",
    invocations: [{ id: "a", name: "Thirsting Blade" }, { id: "b", name: "Lifedrinker" }] }], ["Eldritch Blast"], { tashaOptional: true });
  withFakeDom(t, () => {
    LU.openLevelUp(c2);
    LU.lu.versatilityPick = "pact"; LU.lu.pactBoon = "Pact of the Chain";
    assert.match(LU.validate("invocations"), /Thirsting Blade and Lifedrinker need your Pact of the Blade\. Keep your Pact Boon/);
    LU.close();
  });
});

test("Eldritch Versatility from warlock 12: a Mystic Arcanum spell for another of its level", (t) => {
  const c = char([{ name: "Warlock", subclass: "The Fiend", level: 11, pactBoon: "Pact of the Blade" }], ["Eldritch Blast"], { tashaOptional: true });
  c.spells.push({ id: "arc", name: "Circle of Death", level: 6, arcanum: true, learnedBy: "Warlock" });
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    assert.deepEqual(LU.versatilityChoices().arcanum, ["Circle of Death"]);
    LU.lu.versatilityPick = "arcanum:Circle of Death";
    const s = LU.learnSections().find((x) => x.id === "arcanumIn");
    assert.ok(s && s.kind === "arcanum" && s.names.includes("Eyebite") && !s.names.includes("Circle of Death") && !s.names.some((n) => n === "Eldritch Blast"), "6th-level warlock spells");
    assert.equal(LU.validate("learn") !== null, true);
    LU.close();
  });
  const at11 = char([{ name: "Warlock", level: 7, pactBoon: "Pact of the Blade" }], ["Eldritch Blast"], { tashaOptional: true });
  withFakeDom(t, () => { LU.openLevelUp(at11); assert.deepEqual(LU.versatilityChoices().arcanum, [], "not before 12"); LU.close(); });
});

test("Cantrip Formulas: a wizard 3 using Tasha's swaps one wizard cantrip after a long rest", async () => {
  const SK = await import("../js/core/spells-known.js");
  const c = char([{ name: "Wizard", subclass: "School of Evocation", level: 3 }], ["Fire Bolt", "Light", "Mage Hand"]);
  assert.equal(SK.cantripFormulas(c), null, "Tasha's off");
  c.tashaOptional = true;
  const cf = SK.cantripFormulas(c);
  assert.deepEqual(cf.known, ["Fire Bolt", "Light", "Mage Hand"]);
  assert.ok(cf.options.includes("Ray of Frost") && !cf.options.includes("Light") && !cf.options.includes("Guidance"), "wizard cantrips not known");
  assert.equal(SK.swapCantripFormula(c, "Light", "Guidance"), false, "not a wizard cantrip");
  assert.ok(SK.swapCantripFormula(c, "Light", "Ray of Frost"));
  assert.deepEqual(names(c), ["Fire Bolt", "Ray of Frost", "Mage Hand"], "in Light's place");
  assert.equal(c.spells[1].learnedBy, "Wizard");
  const low = char([{ name: "Wizard", level: 2 }], ["Fire Bolt"], { tashaOptional: true });
  assert.equal(SK.cantripFormulas(low), null, "not before level 3");
});
