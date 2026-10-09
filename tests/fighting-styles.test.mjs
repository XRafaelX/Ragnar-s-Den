/* Fighting styles: the PHB's and Tasha's (optional, behind the
   character's switch), when a style is due (a class's Fighting Style
   level, Champion 10, College of Swords 3), Martial Versatility swaps,
   a style's own picks (Superior Technique's maneuver, Blessed and Druidic
   Warrior's cantrips), what styles do on the sheet, the real level-up
   undo of a swap, and the creation wizard's level 1 style. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as FS from "../js/core/fighting-styles.js";
import * as CO from "../js/core/class-options.js";
import * as W from "../js/wizard/wizard-core.js";
import { FIGHTING_STYLES, CLASSES_INFO } from "../js/data/classes.js";
import { CLASS_PROGRESSION } from "../js/data/progression.js";
import { SPELL_DATA } from "../js/data/spells.js";
import { newCharacter } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { undoLastLevelUp } from "../js/levelup/levelup.js";
import { withFakeDom } from "./fake-dom.mjs";

const LONG_DASH = /[–—]/;
const TASHA = ["Blind Fighting", "Interception", "Superior Technique", "Thrown Weapon Fighting", "Unarmed Fighting", "Blessed Warrior", "Druidic Warrior"];
function makeChar(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  Object.assign(c.abilities, { str: 16, dex: 14, con: 14, int: 10, wis: 14, cha: 16 }, extra.abilities || {});
  Object.keys(extra).forEach((k) => { if(k !== "abilities") c[k] = extra[k]; });
  return c;
}
const withStyle = (c, name, picks) => { c.features.push(FS.makeStyleFeature(name, picks)); return c; };

test("style data: every listed style exists, Tasha's are optional, no long dashes", () => {
  for(const [name, def] of Object.entries(FIGHTING_STYLES)){
    assert.ok(def.text.length > 30 && !LONG_DASH.test(def.text), name + ": text");
    assert.equal(!!def.optional, TASHA.includes(name), name + ": optional exactly for Tasha's");
  }
  assert.deepEqual(TASHA.filter((n) => !FIGHTING_STYLES[n]), []);
  for(const cls of ["Fighter", "Paladin", "Ranger"]) CLASS_PROGRESSION[cls].fightingStyle.options.forEach((n) => assert.ok(FIGHTING_STYLES[n], cls + ": " + n));
  assert.deepEqual(CLASS_PROGRESSION.Paladin.fightingStyle.options.filter((n) => TASHA.includes(n)), ["Blessed Warrior", "Blind Fighting", "Interception"]);
  assert.deepEqual(CLASS_PROGRESSION.Ranger.fightingStyle.options.filter((n) => TASHA.includes(n)), ["Blind Fighting", "Druidic Warrior", "Thrown Weapon Fighting"]);
  assert.deepEqual(CLASS_PROGRESSION.Fighter.fightingStyle.options.filter((n) => TASHA.includes(n)), ["Blind Fighting", "Interception", "Superior Technique", "Thrown Weapon Fighting", "Unarmed Fighting"]);
  // The wizard's level 1 Fighter list matches the progression's.
  assert.deepEqual(CLASSES_INFO.Fighter.choices.find((c) => c.kind === "fightingStyle").options, CLASS_PROGRESSION.Fighter.fightingStyle.options);
});

test("when a style is due: class levels, Champion 10, College of Swords 3", () => {
  const due = (cls, sub, lv) => { const d = FS.styleDueAt(cls, sub, lv); return d && [d.from, d.options.length]; };
  assert.deepEqual(due("Fighter", "", 1), ["Fighting Style", 11]);
  assert.deepEqual(due("Paladin", "", 2), ["Fighting Style", 7]);
  assert.deepEqual(due("Ranger", "", 2), ["Fighting Style", 7]);
  assert.equal(due("Fighter", "Champion", 9), null);
  assert.deepEqual(due("Fighter", "Champion", 10), ["Additional Fighting Style", 11], "the fighter's whole list");
  assert.equal(due("Fighter", "Battle Master", 10), null);
  assert.deepEqual(FS.styleDueAt("Bard", "College of Swords", 3).options, ["Dueling", "Two-Weapon Fighting"]);
  assert.equal(due("Bard", "College of Lore", 3), null);
  assert.equal(due("Wizard", "", 1), null);
  assert.deepEqual(FS.classStyleList("Wizard"), []);
});

test("what can be picked: known ones and, without the switch, Tasha's are out", () => {
  const c = withStyle(makeChar([{ name: "Fighter", level: 1 }]), "Defense");
  assert.equal(FS.styleReason(c, "Defense", true), "known");
  assert.equal(FS.styleReason(c, "Interception", false), "Tasha's optional");
  assert.equal(FS.styleReason(c, "Interception", true), "");
  assert.equal(FS.styleReason(c, "No Such Style", false), "");
  const list = FS.classStyleList("Fighter");
  assert.deepEqual(FS.availableStyleNames(c, list, false), ["Archery", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"]);
  assert.equal(FS.availableStyleNames(c, list, true).length, 10);
  assert.equal(FS.tashaOnlyStyles(c, list, false), 5);
  assert.equal(FS.tashaOnlyStyles(c, list, true), 0);
  assert.equal(FS.hasStyle(c, "Defense"), true);
  assert.equal(H.hasFightingStyle(c, "Defense"), true, "the sheet's own check agrees");
});

test("Martial Versatility: Tasha's on, an ASI level of a class with styles, a style to swap", () => {
  const f = withStyle(makeChar([{ name: "Fighter", level: 3 }]), "Archery");
  assert.equal(FS.versatilityStyleSwap(f, "Fighter", 4), false, "switch off");
  f.tashaOptional = true;
  assert.deepEqual([4, 5, 6, 8, 14, 19].map((l) => FS.versatilityStyleSwap(f, "Fighter", l)), [true, false, true, true, true, true]);
  assert.equal(FS.versatilityStyleSwap(f, "Bard", 4), false, "no Fighting Style feature");
  assert.equal(FS.versatilityStyleSwap(makeChar([{ name: "Paladin", level: 3 }], { tashaOptional: true }), "Paladin", 4), false, "no style to swap");
  assert.equal(FS.versatilityStyleSwap(withStyle(makeChar([{ name: "Ranger", level: 7 }], { tashaOptional: true }), "Defense"), "Ranger", 8), true);
});

test("a style's own picks: Superior Technique's maneuver, Blessed and Druidic Warrior's cantrips", () => {
  assert.equal(FS.styleNeedsPicks("Superior Technique"), true);
  assert.equal(FS.styleNeedsPicks("Defense"), false);
  assert.equal(FS.stylePickChoices("Superior Technique", false).length, 16, "PHB maneuvers only without Tasha's");
  assert.equal(FS.stylePickChoices("Superior Technique", true).length, 23);
  const cleric = FS.stylePickChoices("Blessed Warrior", true);
  assert.ok(cleric.includes("Sacred Flame") && cleric.includes("Guidance") && !cleric.includes("Fire Bolt"));
  assert.ok(cleric.every((n) => SPELL_DATA[n].level === 0 && SPELL_DATA[n].classes.includes("Cleric")));
  const druid = FS.stylePickChoices("Druidic Warrior", true);
  assert.ok(druid.includes("Shillelagh") && druid.includes("Produce Flame") && !druid.includes("Sacred Flame"));
  assert.deepEqual(FS.stylePickChoices("Defense", true), []);
  const why = (name, picks, tasha = true, known = []) => FS.stylePicksProblem(name, picks, tasha, known);
  assert.equal(why("Superior Technique", {}), "Choose a maneuver for Superior Technique.");
  assert.equal(why("Superior Technique", { options: ["Brace"] }, false), "Choose a maneuver for Superior Technique.", "Tasha's maneuver without the switch");
  assert.equal(why("Superior Technique", { options: ["Riposte"] }, true, ["Riposte"]), "You already know Riposte. Pick another maneuver for Superior Technique.");
  assert.equal(why("Superior Technique", { options: ["Riposte"] }), "");
  assert.equal(why("Blessed Warrior", { spells: ["Guidance"] }), "Choose 2 different cleric cantrips for Blessed Warrior.");
  assert.equal(why("Blessed Warrior", { spells: ["Guidance", "Guidance"] }), "Choose 2 different cleric cantrips for Blessed Warrior.");
  assert.equal(why("Blessed Warrior", { spells: ["Guidance", "Fire Bolt"] }), "Choose 2 different cleric cantrips for Blessed Warrior.");
  assert.equal(why("Blessed Warrior", { spells: ["Guidance", "Sacred Flame"] }), "");
  assert.equal(why("Defense", null), "");
  assert.equal(why("Nope", {}), "");
  // The feature keeps the picks; a style without picks has none.
  assert.deepEqual(FS.makeStyleFeature("Blessed Warrior", { spells: ["Guidance", "", "Sacred Flame"] }).picks, { options: [], spells: ["Guidance", "Sacred Flame"] });
  const plain = FS.makeStyleFeature("Defense");
  assert.equal(plain.picks, undefined);
  assert.equal(plain.name, "Fighting Style: Defense");
  assert.equal(plain.fightingStyle, "Defense");
});

test("what styles do on the sheet", () => {
  // Blessed Warrior: cleric cantrips with CHA (8 + PB 2 + CHA 3 = 13).
  const p = withStyle(makeChar([{ name: "Paladin", level: 2 }]), "Blessed Warrior", { spells: ["Guidance", "Sacred Flame"] });
  const spells = H.featureSpells(p).filter((s) => s.source === "Fighting Style");
  assert.deepEqual(spells.map((s) => [s.name, s.kind, s.feature]), [["Guidance", "known", "Blessed Warrior"], ["Sacred Flame", "known", "Blessed Warrior"]]);
  assert.match(spells[1].note, /Uses Charisma: save DC 13, spell attack \+5/);
  assert.equal(H.hasSpellsTab(withStyle(makeChar([{ name: "Fighter", level: 1 }]), "Blessed Warrior", { spells: ["Guidance", "Light"] })), true);
  // Druidic Warrior: WIS.
  const r = withStyle(makeChar([{ name: "Ranger", level: 2 }]), "Druidic Warrior", { spells: ["Shillelagh", "Guidance"] });
  assert.match(H.featureSpells(r).find((s) => s.name === "Shillelagh").note, /Uses Wisdom/);
  // Blind Fighting: blindsight 10 ft in senses.
  const b = withStyle(makeChar([{ name: "Fighter", level: 1 }], { race: "Human" }), "Blind Fighting");
  assert.equal(H.getCharacterSenses(b), "Blindsight 10 ft");
  b.race = "Hill Dwarf";
  assert.match(H.getCharacterSenses(b), /^Darkvision 60 ft, Blindsight 10 ft$/);
  assert.deepEqual(FS.styleSenses(makeChar([{ name: "Fighter", level: 1 }])), []);
  // Superior Technique: its maneuver on the Maneuvers list; its d6 joins a pool or stands alone.
  const st = withStyle(makeChar([{ name: "Fighter", level: 1 }]), "Superior Technique", { options: ["Riposte"] });
  assert.deepEqual(CO.allKnownOptions(st, "maneuvers").map((o) => [o.name, o.from]), [["Riposte", "Superior Technique"]]);
  const alone = H.characterResources(st).find((x) => x.key === "style:superiority_dice");
  assert.ok(alone && alone.max === 1 && alone.reset === "short");
  const bm = withStyle(makeChar([{ name: "Fighter", subclass: "Battle Master", level: 3 }]), "Superior Technique", { options: ["Riposte"] });
  assert.equal(H.characterResources(bm).find((x) => x.key === "Fighter:superiority_dice").max, 5, "4 + Superior Technique's");
  assert.ok(!H.characterResources(bm).some((x) => x.key === "style:superiority_dice"));
  // A Battle Master can't learn the maneuver Superior Technique already gave.
  const plan = CO.levelUpOptionPlans(bm, bm.classes[0], "Fighter", "Battle Master", 3)[0];
  assert.ok(CO.planContext(bm, bm.classes[0], plan, {}, 3).known.includes("Riposte"));
});

test("Undo last level-up puts a swapped-out style back", (t) => {
  const f = makeChar([{ name: "Fighter", subclass: "Champion", level: 4 }], { tashaOptional: true, hp: { max: 40, current: 40, temp: 0 } });
  const archery = FS.makeStyleFeature("Archery");
  const added = FS.makeStyleFeature("Interception");
  f.features.push(added);
  f.levelHistory = [{ className: "Fighter", isNewClass: false, prevSubclass: "Champion", hpGain: 6, toughGain: 0, speedGain: 0, asi: null, featId: null,
    unlockIds: [], prevSpellcasting: { ability: "int", slots: {}, pact: null }, featureId: added.id, styleSwappedOut: archery }];
  withFakeDom(t, (byId) => { undoLastLevelUp(f); byId["confirm-ok"].click(); });
  assert.deepEqual(FS.styleFeatures(f).map((x) => x.fightingStyle), ["Archery"]);
  assert.equal(f.classes[0].level, 3);
});

test("wizard: a level 1 Fighter's style, Tasha's switch and Superior Technique's maneuver", (t) => {
  const run = (choices, fn) => { let out; withFakeDom(t, () => {
    W.openWizard();
    Object.assign(W.wizardState, { name: "Wiz Fighter", classId: "Fighter", race: "Human", background: "Soldier", alignment: "Neutral",
      abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Athletics", "Perception"],
      bgSkillChoices: [], languageChoices: ["Elvish"], equipment: { 0: "chain" } }, choices);
    out = fn();
  }); return out; };
  assert.equal(run({ classChoices: {} }, () => W.validateStep("choices")), "Choose a Fighting Style.");
  assert.equal(run({ classChoices: { fightingStyle: "Defense" } }, () => W.validateStep("choices")), null);
  assert.equal(run({ tashaOptional: true, classChoices: { fightingStyle: "Superior Technique" } }, () => W.validateStep("choices")), "Choose a maneuver for Superior Technique.");
  const ok = { tashaOptional: true, classChoices: { fightingStyle: "Superior Technique", fightingStylePicks: { options: ["Precision Attack"], spells: [] } } };
  assert.equal(run(ok, () => W.validateStep("choices")), null);
  const c = run(ok, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.equal(c.tashaOptional, true, "the switch carries over");
  assert.deepEqual(FS.styleFeatures(c).map((f) => [f.fightingStyle, f.picks.options]), [["Superior Technique", ["Precision Attack"]]]);
  assert.ok(H.characterResources(c).some((x) => x.key === "style:superiority_dice"));
  const plain = run({ classChoices: { fightingStyle: "Defense" } }, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.equal(plain.tashaOptional, undefined, "off unless turned on");
  assert.deepEqual(FS.styleFeatures(plain).map((f) => f.fightingStyle), ["Defense"]);
});
