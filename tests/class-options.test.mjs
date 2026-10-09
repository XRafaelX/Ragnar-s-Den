/* Class option sets (Metamagic, Battle Master maneuvers) and the Martial
   Adept feat's maneuvers: the data, what a level-up asks for under each
   swap rule (with and without Tasha's optional features), learning,
   swapping and undoing, and the Features tab cards. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as FP from "../js/core/feat-picks.js";
import * as CO from "../js/core/class-options.js";
import { OPTION_SETS, OPTION_SOURCES, optionSetDef, optionDef, optionsKnownAt, optionSetStart } from "../js/data/class-options.js";
import { CLASS_PROGRESSION, SUBCLASSES } from "../js/data/progression.js";
import { newCharacter } from "../js/core/character.js";
import { undoLastLevelUp } from "../js/levelup/levelup.js";
import { renderOptionSetCards } from "../js/render/panels/class-options.js";
import { featPicksContext } from "../js/ui/feat-picks.js";
import { withFakeDom } from "./fake-dom.mjs";

const LONG_DASH = /[–—]/;
function makeChar(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  Object.assign(c.abilities, { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, extra.abilities || {});
  Object.keys(extra).forEach((k) => { if(k !== "abilities") c[k] = extra[k]; });
  return c;
}
const sorc = (level, extra) => makeChar([{ name: "Sorcerer", subclass: "Wild Magic", level }], extra);
const bm = (level, extra) => makeChar([{ name: "Fighter", subclass: "Battle Master", level }], extra);
const names = (cl, set) => CO.knownOptions(cl, set).map((e) => e.name);
const plansFor = (c, level, subclass) => CO.levelUpOptionPlans(c, c.classes[0], c.classes[0].name, subclass ?? c.classes[0].subclass, level)
  .map((p) => ({ set: p.set.id, fresh: p.fresh, canSwap: p.canSwap, total: p.total, why: p.why }));

/* ================================================================
   Data
   ================================================================ */
test("option sets: well formed, real classes and subclasses, no long dashes", () => {
  const ids = new Set();
  for(const set of OPTION_SETS){
    assert.ok(!ids.has(set.id), "duplicate set " + set.id);
    ids.add(set.id);
    assert.ok(CLASS_PROGRESSION[set.className], set.id + ": class");
    if(set.subclass) assert.ok(SUBCLASSES[set.className].some((s) => s.name === set.subclass), set.id + ": subclass " + set.subclass);
    assert.ok(["learn", "level", "never", "rest"].includes(set.swap), set.id + ": swap");
    if(set.costUnit) assert.ok(set.costUnit.length === 2 && set.options.every((o) => o.cost), set.id + ": costUnit and every option's cost");
    (set.always || []).forEach((o) => assert.ok(o.name && o.text.length > 20 && !set.options.some((x) => x.name === o.name), set.id + ": always " + o.name));
    if(set.card){
      const mates = OPTION_SETS.filter((x) => x.card === set.card);
      assert.ok(mates.every((x) => x.cardLabel === set.cardLabel && x.className === set.className && x.subclass === set.subclass), set.id + ": card mates agree");
    }
    assert.ok(set.label && set.noun && set.help.length > 20 && !LONG_DASH.test(set.help), set.id + ": text");
    const levels = Object.keys(set.known).map(Number);
    levels.forEach((l, i) => { if(i) assert.ok(set.known[l] > set.known[levels[i - 1]], set.id + ": known grows"); });
    const opt = new Set();
    for(const o of set.options){
      assert.ok(!opt.has(o.name), set.id + ": duplicate " + o.name);
      opt.add(o.name);
      assert.ok(OPTION_SOURCES[o.source], o.name + ": source");
      assert.ok(o.text.length > 20 && !LONG_DASH.test(o.name + o.text), o.name + ": text");
      if(o.save) assert.ok(["str", "dex", "con", "int", "wis", "cha"].includes(o.save), o.name + ": save");
      if(o.level) assert.ok(o.level >= optionSetStart(set) && o.level <= 20, o.name + ": level");
    }
  }
});

test("Metamagic: the PHB's eight and Tasha's two, at 3, 10 and 17", () => {
  const set = optionSetDef("metamagic");
  assert.deepEqual([2, 3, 9, 10, 16, 17, 20].map((l) => optionsKnownAt(set, l)), [0, 2, 2, 3, 3, 4, 4]);
  assert.equal(set.options.filter((o) => o.source === "PHB").length, 8);
  assert.deepEqual(set.options.filter((o) => o.source === "TCE").map((o) => o.name), ["Seeking Spell", "Transmuted Spell"]);
  assert.deepEqual(set.options.map((o) => o.cost), ["1", "1", "1", "1", "3", "2", "1", "spell level (1 for a cantrip)", "2", "1"]);
  assert.equal(set.swap, "never");
  assert.equal(optionSetStart(set), 3);
});

test("maneuvers: sixteen PHB, seven Tasha's, at 3, 7, 10 and 15; saves where the book has them", () => {
  const set = optionSetDef("maneuvers");
  assert.deepEqual([2, 3, 6, 7, 9, 10, 14, 15, 20].map((l) => optionsKnownAt(set, l)), [0, 3, 3, 5, 5, 7, 7, 9, 9]);
  assert.equal(set.options.filter((o) => o.source === "PHB").length, 16);
  assert.deepEqual(set.options.filter((o) => o.source === "TCE").map((o) => o.name),
    ["Ambush", "Bait and Switch", "Brace", "Commanding Presence", "Grappling Strike", "Quick Toss", "Tactical Assessment"]);
  assert.deepEqual(set.options.filter((o) => o.save).map((o) => o.name + ":" + o.save),
    ["Disarming Attack:str", "Goading Attack:wis", "Menacing Attack:wis", "Pushing Attack:str", "Trip Attack:str"]);
  assert.equal(set.swap, "learn");
  assert.equal(optionDef("maneuvers", "Parry").source, "PHB");
  assert.equal(optionDef("maneuvers", "Nope"), null);
  assert.equal(optionSetDef("nope"), null);
});

test("feature texts point to the cards and state the book's swap rule", () => {
  const cs = SUBCLASSES.Fighter.find((s) => s.name === "Battle Master").features[3].find((f) => f.name === "Combat Superiority");
  assert.match(cs.text, /each time you learn new ones you can also swap one/);
  assert.doesNotMatch(cs.text, /when you gain a fighter level/);
  for(const lv of [3, 10, 17]) assert.match(CLASS_PROGRESSION.Sorcerer.features[lv].find((f) => f.name === "Metamagic").text, /Metamagic card on the Features & Feats tab/);
});

/* ================================================================
   Which sets a class entry has
   ================================================================ */
test("entrySets: by class, subclass and level", () => {
  const ids = (cl, lv) => CO.entrySets(cl, lv).map((s) => s.id);
  assert.deepEqual(ids({ name: "Sorcerer", level: 2 }), []);
  assert.deepEqual(ids({ name: "Sorcerer", level: 3 }), ["metamagic"]);
  assert.deepEqual(ids({ name: "Fighter", subclass: "Battle Master", level: 3 }), ["maneuvers"]);
  assert.deepEqual(ids({ name: "Fighter", subclass: "Champion", level: 10 }), []);
  assert.deepEqual(ids({ name: "Fighter", subclass: "Battle Master", level: 10 }, 2), [], "an explicit level wins");
  assert.deepEqual(CO.entrySets(null), []);
  assert.deepEqual(CO.knownOptions(null, "maneuvers"), []);
  assert.deepEqual(CO.knownOptions({ options: { maneuvers: "junk" } }, "maneuvers"), []);
});

/* ================================================================
   Level-up plans: new picks and swaps
   ================================================================ */
test("Metamagic: new ones at 3, 10, 17; never a swap without Tasha's", () => {
  const c = sorc(2);
  assert.deepEqual(plansFor(c, 2), [], "nothing before 3");
  assert.deepEqual(plansFor(c, 3), [{ set: "metamagic", fresh: 2, canSwap: false, total: 2, why: "" }]);
  CO.learnOption(c.classes[0], "metamagic", "Quickened Spell");
  CO.learnOption(c.classes[0], "metamagic", "Twinned Spell");
  assert.deepEqual(plansFor(c, 4), [], "level 4: nothing, no Tasha's");
  assert.deepEqual(plansFor(c, 10), [{ set: "metamagic", fresh: 1, canSwap: false, total: 3, why: "" }], "new one, no swap");
  c.tashaOptional = true;
  // With 2 known, levels past 10 and 17 also bring the ones still to learn.
  for(const lv of [4, 8, 12, 16, 19]){
    const total = optionsKnownAt(optionSetDef("metamagic"), lv);
    assert.deepEqual(plansFor(c, lv), [{ set: "metamagic", fresh: total - 2, canSwap: true, total, why: "versatility" }], "Sorcerous Versatility at " + lv);
  }
  assert.deepEqual(plansFor(c, 5), [], "not an ASI level");
  assert.equal(CO.tashaOn(c), true);
  assert.equal(CO.tashaOn(null), false);
});

test("maneuvers: three at 3 (with the subclass picked on that level-up), swap only when learning", () => {
  const c = makeChar([{ name: "Fighter", subclass: "", level: 2 }]);
  assert.deepEqual(plansFor(c, 3, "Champion"), []);
  assert.deepEqual(plansFor(c, 3, "Battle Master"), [{ set: "maneuvers", fresh: 3, canSwap: false, total: 3, why: "" }], "nothing known yet, so no swap");
  const f = bm(3);
  ["Riposte", "Parry", "Trip Attack"].forEach((n) => CO.learnOption(f.classes[0], "maneuvers", n));
  for(const lv of [4, 5, 6]) assert.deepEqual(plansFor(f, lv), [], "no swap at " + lv);
  assert.deepEqual(plansFor(f, 7), [{ set: "maneuvers", fresh: 2, canSwap: true, total: 5, why: "" }]);
  // Fighters' extra ASI levels count for Martial Versatility.
  f.tashaOptional = true;
  assert.deepEqual(plansFor(f, 6).map((p) => [p.fresh, p.canSwap, p.why]), [[0, true, "versatility"]]);
  const f13 = bm(13, { tashaOptional: true });
  ["Riposte", "Parry", "Trip Attack", "Brace", "Rally", "Ambush", "Quick Toss"].forEach((n) => CO.learnOption(f13.classes[0], "maneuvers", n));
  assert.deepEqual(plansFor(f13, 14).map((p) => [p.fresh, p.canSwap, p.why]), [[0, true, "versatility"]], "fighter 14 is an ASI level");
  assert.deepEqual(plansFor(f, 5), []);
  // An older sheet with none catches up, and may swap since it's learning.
  const old = bm(8);
  assert.deepEqual(plansFor(old, 9), [{ set: "maneuvers", fresh: 5, canSwap: false, total: 5, why: "" }]);
});

test("slots, context and problems", () => {
  const f = bm(6, { tashaOptional: true, feats: [{ id: "ma", name: "Martial Adept", picks: { options: ["Rally", "Ambush"] } }] });
  const cl = f.classes[0];
  const riposte = CO.learnOption(cl, "maneuvers", "Riposte");
  CO.learnOption(cl, "maneuvers", "Parry");
  CO.learnOption(cl, "maneuvers", "Trip Attack");
  const plan = CO.levelUpOptionPlans(f, cl, "Fighter", "Battle Master", 7)[0];
  assert.equal(CO.planSlots(plan, cl, {}), 2);
  assert.equal(CO.planSlots(plan, cl, { swapOut: riposte.id }), 3);
  assert.equal(CO.planSlots(plan, cl, { swapOut: "zzz" }), 2, "an unknown id adds nothing");
  const ctx = CO.planContext(f, cl, plan, { swapOut: riposte.id }, 7);
  assert.deepEqual(ctx.known.sort(), ["Ambush", "Parry", "Rally", "Trip Attack"], "the swapped one is free again; Martial Adept's count");
  const why = (choice) => CO.planProblem(f, cl, plan, choice, 7);
  assert.equal(why({ picks: [] }), "Choose 2 different maneuvers.");
  assert.equal(why({ picks: ["Brace", "Brace"] }), "Choose 2 different maneuvers.");
  assert.equal(why({ picks: ["Brace", "Rally"] }), "Rally can't be learned now (known). Pick another.", "Martial Adept already gave it");
  assert.equal(why({ picks: ["Brace", "Made Up"] }), "Made Up can't be learned now (unknown). Pick another.");
  assert.equal(why({ picks: ["Brace", "Quick Toss"] }), null);
  assert.equal(why({ picks: ["Brace", "Quick Toss"], swapOut: riposte.id }), "Choose 3 different maneuvers.");
  assert.equal(why({ picks: ["Brace", "Quick Toss", "Riposte"], swapOut: riposte.id }), null, "taking back the one given up is allowed");
  // Without Tasha's optional features, Tasha's maneuvers can't be learned.
  f.tashaOptional = false;
  assert.equal(why({ picks: ["Brace", "Precision Attack"] }), "Brace can't be learned now (Tasha's optional). Pick another.");
  assert.equal(why({ picks: ["Precision Attack", "Sweeping Attack"] }), null);
  const two = { name: "Sorcerer", options: { metamagic: [{ id: "a", name: "Subtle Spell" }, { id: "b", name: "Twinned Spell" }] } };
  const one = CO.levelUpOptionPlans(sorc(9), two, "Sorcerer", "", 10)[0];
  assert.equal(CO.planProblem(sorc(9), two, one, { picks: [] }, 10), "Choose your new Metamagic option.");
});

test("Tasha's additions are optional: offered only with the switch on", () => {
  for(const id of ["metamagic", "maneuvers"]){
    const set = optionSetDef(id);
    assert.ok(set.options.every((o) => (o.source === "TCE") === !!o.optional), id + ": exactly Tasha's are optional");
  }
  const mm = optionSetDef("metamagic"), man = optionSetDef("maneuvers");
  const off = { level: 20, known: [], tasha: false }, on = { level: 20, known: [], tasha: true };
  assert.equal(CO.optionReason(optionDef("metamagic", "Seeking Spell"), off), "Tasha's optional");
  assert.equal(CO.optionReason(optionDef("metamagic", "Seeking Spell"), on), "");
  assert.equal(CO.optionReason(optionDef("metamagic", "Seeking Spell"), { ...off, known: ["Seeking Spell"] }), "known", "known comes first");
  assert.equal(CO.availableOptions(mm, off).length, 8);
  assert.equal(CO.availableOptions(mm, on).length, 10);
  assert.equal(CO.availableOptions(man, off).length, 16);
  assert.equal(CO.tashaOnlyCount(man, off), 7);
  assert.equal(CO.tashaOnlyCount(man, { ...off, known: ["Brace"] }), 6, "a known one isn't counted");
  assert.equal(CO.tashaOnlyCount(man, on), 0);
  // The level-up's context follows the character's switch.
  const c = sorc(9);
  const plan = CO.levelUpOptionPlans(c, c.classes[0], "Sorcerer", "", 10)[0];
  assert.equal(CO.planContext(c, c.classes[0], plan, {}, 10).tasha, false);
  c.tashaOptional = true;
  assert.equal(CO.planContext(c, c.classes[0], plan, {}, 10).tasha, true);
});

test("an option gated by level is left out until then", () => {
  const opt = { name: "Late", level: 7 };
  assert.equal(CO.optionReason(opt, { level: 5, known: [] }), "level 7");
  assert.equal(CO.optionReason(opt, { level: 7, known: [] }), "");
  assert.equal(CO.optionReason(opt, { level: 9, known: ["Late"] }), "known");
  const set = { options: [opt, { name: "Early" }] };
  assert.deepEqual(CO.availableOptions(set, { level: 5, known: [] }).map((o) => o.name), ["Early"]);
});

test("apply and undo: new picks and a swap come and go exactly", () => {
  const f = bm(6);
  const cl = f.classes[0];
  const riposte = CO.learnOption(cl, "maneuvers", "Riposte");
  CO.learnOption(cl, "maneuvers", "Parry");
  CO.learnOption(cl, "maneuvers", "Trip Attack");
  const plan = CO.levelUpOptionPlans(f, cl, "Fighter", "Battle Master", 7)[0];
  const rec = CO.applyPlan(f, cl, plan, { picks: ["Brace", "Quick Toss", "Precision Attack", "Extra"], swapOut: riposte.id });
  assert.deepEqual(names(cl, "maneuvers"), ["Parry", "Trip Attack", "Brace", "Quick Toss", "Precision Attack"]);
  assert.equal(rec.removed.name, "Riposte");
  assert.equal(rec.added.length, 3, "only as many as the slots");
  CO.undoPlan(cl, rec);
  assert.deepEqual(names(cl, "maneuvers").sort(), ["Parry", "Riposte", "Trip Attack"]);
  // Learning on an entry without options starts the list; forgetting an unknown id does nothing.
  const fresh = { name: "Sorcerer", level: 3 };
  CO.learnOption(fresh, "metamagic", "Subtle Spell");
  assert.deepEqual(names(fresh, "metamagic"), ["Subtle Spell"]);
  assert.equal(CO.forgetOption(fresh, "metamagic", "nope"), null);
  // Undoing a swap on an entry whose list is gone puts it back.
  const bare = { name: "Fighter" };
  CO.undoPlan(bare, { set: "maneuvers", added: [], removed: { id: "x", name: "Parry" } });
  assert.deepEqual(names(bare, "maneuvers"), ["Parry"]);
});

test("allKnownOptions: class picks and Martial Adept's, tagged by where they come from", () => {
  const f = bm(3, { feats: [{ id: "ma", name: "Martial Adept", picks: { options: ["Rally", "Ambush"] } }, { id: "x", name: "Alert" }] });
  CO.learnOption(f.classes[0], "maneuvers", "Riposte");
  assert.deepEqual(CO.allKnownOptions(f, "maneuvers").map((o) => [o.name, o.from]),
    [["Riposte", "Battle Master"], ["Rally", "Martial Adept"], ["Ambush", "Martial Adept"]]);
  assert.deepEqual(CO.allKnownOptions(f, "metamagic"), []);
  // Metamagic is a class feature: labelled Sorcerer, not the subclass.
  const s = sorc(3);
  CO.learnOption(s.classes[0], "metamagic", "Subtle Spell");
  assert.deepEqual(CO.allKnownOptions(s, "metamagic").map((o) => o.from), ["Sorcerer"]);
  // A Martial Adept without picks yet adds nothing.
  assert.deepEqual(CO.allKnownOptions(makeChar([{ name: "Rogue", level: 4 }], { feats: [{ id: "ma", name: "Martial Adept" }] }), "maneuvers"), []);
});

/* ================================================================
   Martial Adept
   ================================================================ */
test("Martial Adept: two different maneuvers, not ones already known", () => {
  const def = FP.featDef("Martial Adept");
  assert.equal(FP.featHasPicks(def), true);
  assert.equal(FP.featNeedsChoice(def), true);
  assert.equal(FP.featOptionChoices(def).length, 23);
  assert.deepEqual(FP.featOptionChoices(FP.featDef("Alert")), []);
  const problem = (options, known = [], tasha = true) => FP.featPicksProblem(def, { ...FP.emptyPicks(def), options }, { optionsKnown: () => known, tasha });
  assert.equal(problem([]), "Pick 2 different maneuvers for Martial Adept.");
  assert.equal(problem(["Rally", "Rally"]), "Pick 2 different maneuvers for Martial Adept.");
  assert.equal(problem(["Rally", "Not One"]), "Pick 2 different maneuvers for Martial Adept.");
  assert.equal(problem(["Rally", "Brace"], ["Brace"]), "You already know Brace. Pick another maneuver.");
  assert.equal(problem(["Rally", "Brace"]), "");
  assert.equal(problem(["Rally", "Brace"], [], false), "Brace is one of Tasha's optional maneuvers, which this character doesn't use. Pick another.");
  assert.equal(problem(["Rally", "Parry"], [], false), "");
  assert.equal(FP.featPicksProblem(def, { ...FP.emptyPicks(def), options: ["Rally", "Parry"] }, null), "", "no context: nothing known");
  assert.match(FP.featPicksProblem(def, { ...FP.emptyPicks(def), options: ["Rally", "Brace"] }, null), /Tasha's optional/, "no context: Tasha's off");
  assert.equal(FP.featPicksSummary(def, { options: ["Rally", "Brace"] }), "Rally, Brace");
  // The Battle Master's own maneuvers count as known in the sheet's context.
  const f = bm(3);
  CO.learnOption(f.classes[0], "maneuvers", "Brace");
  assert.deepEqual(featPicksContext(f).optionsKnown("maneuvers"), ["Brace"]);
  assert.equal(featPicksContext(f).tasha, false);
  f.tashaOptional = true;
  assert.equal(featPicksContext(f).tasha, true);
});

test("Martial Adept: apply keeps the picks, pending until made, the die joins a Battle Master's", () => {
  const def = FP.featDef("Martial Adept");
  const c = makeChar([{ name: "Rogue", level: 4 }]);
  const feat = { id: "ma", name: "Martial Adept" };
  c.feats.push(feat);
  assert.equal(FP.featPicksPending(feat), true);
  FP.applyFeatPicks(c, feat, { ...FP.emptyPicks(def), options: ["Rally", "", "Brace"] });
  assert.deepEqual(feat.picks.options, ["Rally", "Brace"]);
  assert.equal(FP.featPicksPending(feat), false);
  assert.equal(FP.featPicksPending({ name: "Martial Adept", picks: { options: ["Rally"] } }), true);
  assert.equal(FP.featPicksPending({ name: "Martial Adept", picks: { manual: true } }), false);
  assert.deepEqual(FP.startingPicks(def, feat).options, ["Rally", "Brace"]);
  assert.deepEqual(CO.allKnownOptions(c, "maneuvers").map((o) => o.name), ["Rally", "Brace"]);
  const die = H.characterResources(c).find((r) => r.key === "feat:superiority_dice");
  assert.ok(die && die.max === 1);
});

/* ================================================================
   Undo through the real dialog, and the cards
   ================================================================ */
test("Undo last level-up takes back the level's maneuvers and swap", (t) => {
  const f = bm(6, { hp: { max: 50, current: 50, temp: 0 } });
  const cl = f.classes[0];
  const riposte = CO.learnOption(cl, "maneuvers", "Riposte");
  CO.learnOption(cl, "maneuvers", "Parry");
  CO.learnOption(cl, "maneuvers", "Trip Attack");
  const plan = CO.levelUpOptionPlans(f, cl, "Fighter", "Battle Master", 7)[0];
  const rec = CO.applyPlan(f, cl, plan, { picks: ["Brace", "Quick Toss", "Ambush"], swapOut: riposte.id });
  cl.level = 7;
  f.levelHistory = [{ className: "Fighter", isNewClass: false, prevSubclass: "Battle Master", hpGain: 6, toughGain: 0, speedGain: 0,
    asi: null, featId: null, unlockIds: [], prevSpellcasting: { ability: "int", slots: {}, pact: null }, optionRecs: [rec] }];
  withFakeDom(t, (byId) => { undoLastLevelUp(f); byId["confirm-ok"].click(); });
  assert.equal(cl.level, 6);
  assert.deepEqual(names(cl, "maneuvers").sort(), ["Parry", "Riposte", "Trip Attack"]);
  assert.equal(f.levelHistory.length, 0);
});

test("cards: one per set the character has, every state draws", (t) => {
  withFakeDom(t, () => {
    assert.deepEqual(renderOptionSetCards(makeChar([{ name: "Fighter", subclass: "Champion", level: 10 }])), []);
    assert.equal(renderOptionSetCards(sorc(2)).length, 0, "no Metamagic before 3");
    assert.equal(renderOptionSetCards(sorc(3)).length, 1, "sorcerer 3 with none learned");
    const busy = bm(18, { tashaOptional: true, feats: [{ id: "ma", name: "Martial Adept", picks: { options: ["Rally", "Ambush"] } }] });
    CO.learnOption(busy.classes[0], "maneuvers", "Riposte");
    assert.equal(renderOptionSetCards(busy).length, 1, "Battle Master with Martial Adept: one Maneuvers card");
    // Martial Adept alone (a Rogue): the card shows, without a learn form.
    const rogue = makeChar([{ name: "Rogue", level: 4 }], { feats: [{ id: "ma", name: "Martial Adept", picks: { options: ["Rally", "Ambush"] } }] });
    assert.equal(renderOptionSetCards(rogue).length, 1);
    // A multiclass sorcerer / Battle Master: two cards.
    const both = makeChar([{ name: "Sorcerer", level: 3 }, { name: "Fighter", subclass: "Battle Master", level: 3 }]);
    assert.equal(renderOptionSetCards(both).length, 2);
  });
});

/* ================================================================
   Phase 2a sets: runes, Arcane Shots, disciplines, Hunter, Totem,
   Storm Herald, misfortunes
   ================================================================ */
import { optionMeta } from "../js/ui/option-picks.js";
const ent = (cls, sub, level, opts = {}) => ({ name: cls, subclass: sub, level, options: opts });
const known = (set, names) => names.map((n, i) => ({ id: set + i, name: n }));
const plan = (c, cl, lv) => CO.levelUpOptionPlans(c, cl, cl.name, cl.subclass, lv).map((p) => [p.set.id, p.fresh, p.canSwap]);

test("Phase 2a data: counts, gates and sources match the books", () => {
  const n = (id, lv) => optionsKnownAt(optionSetDef(id), lv);
  assert.deepEqual([3, 7, 10, 15].map((l) => n("runes", l)), [2, 3, 4, 5]);
  assert.deepEqual(optionSetDef("runes").options.filter((o) => o.level === 7).map((o) => o.name), ["Hill Rune", "Storm Rune"]);
  assert.deepEqual([3, 7, 10, 15, 18].map((l) => n("arcaneShots", l)), [2, 3, 4, 5, 6]);
  assert.deepEqual([3, 6, 11, 17].map((l) => n("disciplines", l)), [1, 2, 3, 4], "plus Elemental Attunement, always known");
  const d = optionSetDef("disciplines");
  assert.deepEqual(d.always.map((o) => o.name), ["Elemental Attunement"]);
  assert.deepEqual([6, 11, 17].map((l) => d.options.filter((o) => o.level === l).length), [2, 4, 3]);
  assert.equal(d.options.length, 16);
  assert.deepEqual([3, 9, 13, 17].map((l) => n("misfortunes", l)), [2, 3, 4, 5]);
  assert.equal(optionSetDef("misfortunes").options.length, 13);
  assert.deepEqual(["huntersPrey", "defensiveTactics", "hunterMultiattack", "superiorHuntersDefense"].map((id) => optionSetStart(optionSetDef(id))), [3, 7, 11, 15]);
  assert.deepEqual(["totemSpirit", "totemAspect", "totemAttunement"].map((id) => optionSetStart(optionSetDef(id))), [3, 6, 14]);
  assert.deepEqual(["runes", "arcaneShots", "disciplines", "stormEnvironment", "misfortunes", "totemSpirit"].map((id) => optionSetDef(id).swap), ["level", "learn", "learn", "level", "rest", "never"]);
  // None of these subclass options are Tasha's optional class features.
  for(const id of ["runes", "arcaneShots", "disciplines", "huntersPrey", "totemSpirit", "stormEnvironment", "misfortunes"]) assert.ok(optionSetDef(id).options.every((o) => !o.optional), id);
});

test("runes: swap at every fighter level; Hill and Storm from 7", () => {
  const c = makeChar([ent("Fighter", "Rune Knight", 3, { runes: known("r", ["Cloud Rune", "Fire Rune"]) })]);
  const cl = c.classes[0];
  assert.deepEqual(plan(c, cl, 4), [["runes", 0, true]], "a swap at 4 with nothing new");
  assert.deepEqual(plan(c, cl, 7), [["runes", 1, true]]);
  const ctx = (lv) => CO.planContext(c, cl, CO.levelUpOptionPlans(c, cl, "Fighter", "Rune Knight", lv)[0], {}, lv);
  assert.deepEqual(CO.availableOptions(optionSetDef("runes"), ctx(4)).map((o) => o.name), ["Frost Rune", "Stone Rune"]);
  assert.deepEqual(CO.availableOptions(optionSetDef("runes"), ctx(7)).map((o) => o.name), ["Frost Rune", "Stone Rune", "Hill Rune", "Storm Rune"]);
});

test("Arcane Shots and disciplines: swap only when learning; disciplines gated by monk level", () => {
  const a = makeChar([ent("Fighter", "Arcane Archer", 3, { arcaneShots: known("a", ["Bursting Arrow", "Seeking Arrow"]) })]);
  assert.deepEqual(plan(a, a.classes[0], 4), []);
  assert.deepEqual(plan(a, a.classes[0], 18), [["arcaneShots", 4, true]], "an older sheet catching up at 18");
  const m = makeChar([ent("Monk", "Way of the Four Elements", 5, { disciplines: known("d", ["Water Whip"]) })]);
  assert.deepEqual(plan(m, m.classes[0], 5), []);
  assert.deepEqual(plan(m, m.classes[0], 6), [["disciplines", 1, true]]);
  const avail = (lv) => CO.availableOptions(optionSetDef("disciplines"), { level: lv, known: ["Water Whip"], tasha: false }).map((o) => o.name);
  assert.ok(!avail(5).includes("Gong of the Summit") && avail(6).includes("Gong of the Summit") && !avail(10).includes("Fireball"));
  assert.ok(avail(11).includes("Flames of the Phoenix") && !avail(16).includes("Breath of Winter") && avail(17).includes("Breath of Winter"));
  assert.ok(!avail(20).includes("Elemental Attunement"), "Elemental Attunement is never offered: it's always known");
});

test("Hunter and Totem: one choice per tier, never swapped; grouped on one card", (t) => {
  const h = makeChar([ent("Ranger", "Hunter", 2)]);
  assert.deepEqual(plan(h, h.classes[0], 3), [["huntersPrey", 1, false]]);
  h.classes[0].options = { huntersPrey: known("h", ["Colossus Slayer"]) };
  for(const lv of [4, 5, 6]) assert.deepEqual(plan(h, h.classes[0], lv), [], "nothing at " + lv);
  assert.deepEqual(plan(h, h.classes[0], 8), [["defensiveTactics", 1, false]], "missed at 7: still due at 8");
  assert.deepEqual(plan(h, h.classes[0], 7), [["defensiveTactics", 1, false]]);
  // An older Hunter 14 with nothing chosen catches up on all four at 15.
  const old = makeChar([ent("Ranger", "Hunter", 14)]);
  assert.deepEqual(plan(old, old.classes[0], 15).map((p) => p[0]), ["huntersPrey", "defensiveTactics", "hunterMultiattack", "superiorHuntersDefense"]);
  const tw = makeChar([ent("Barbarian", "Path of the Totem Warrior", 5, { totemSpirit: known("t", ["Bear"]) })]);
  assert.deepEqual(plan(tw, tw.classes[0], 6), [["totemAspect", 1, false]]);
  // The same animal can be picked again at a later tier (separate sets).
  const ctx = CO.planContext(tw, tw.classes[0], CO.levelUpOptionPlans(tw, tw.classes[0], "Barbarian", "Path of the Totem Warrior", 6)[0], {}, 6);
  assert.ok(CO.availableOptions(optionSetDef("totemAspect"), ctx).some((o) => o.name === "Bear"));
  withFakeDom(t, () => {
    const full = makeChar([ent("Ranger", "Hunter", 15, { huntersPrey: known("a", ["Colossus Slayer"]), defensiveTactics: known("b", ["Steel Will"]),
      hunterMultiattack: known("c", ["Volley"]), superiorHuntersDefense: known("d", ["Evasion"]) })]);
    assert.equal(renderOptionSetCards(full).length, 1, "four tiers, one card");
    assert.equal(renderOptionSetCards(makeChar([ent("Ranger", "Hunter", 2)])).length, 0, "nothing before 3");
    assert.equal(renderOptionSetCards(makeChar([ent("Barbarian", "Path of the Totem Warrior", 14)])).length, 1);
  });
});

test("Storm Herald: change the environment at every barbarian level; misfortunes swap on the sheet", () => {
  const s = makeChar([ent("Barbarian", "Path of the Storm Herald", 2)]);
  assert.deepEqual(plan(s, s.classes[0], 3), [["stormEnvironment", 1, false]]);
  s.classes[0].options = { stormEnvironment: known("s", ["Desert"]) };
  for(const lv of [4, 5, 10, 20]) assert.deepEqual(plan(s, s.classes[0], lv), [["stormEnvironment", 0, true]], "change at " + lv);
  const r = makeChar([ent("Rogue", "Misfortune Bringer", 3, { misfortunes: known("m", ["Doomed", "Inept"]) })]);
  for(const lv of [4, 8]) assert.deepEqual(plan(r, r.classes[0], lv), [], "no level-up swap at " + lv);
  assert.deepEqual(plan(r, r.classes[0], 9), [["misfortunes", 1, false]]);
});

test("costs name their points", () => {
  assert.equal(optionMeta(optionDef("disciplines", "Flames of the Phoenix"), optionSetDef("disciplines")), "4 ki points");
  assert.equal(optionMeta(optionDef("disciplines", "Fangs of the Fire Snake"), optionSetDef("disciplines")), "1 ki point");
  assert.equal(optionMeta(optionDef("disciplines", "Water Whip"), optionSetDef("disciplines")), "2 ki points · Dexterity save");
  assert.equal(optionMeta(optionDef("misfortunes", "Doomed"), optionSetDef("misfortunes")), "1 Jinx Point");
  assert.equal(optionMeta(optionDef("misfortunes", "Clumsy"), optionSetDef("misfortunes")), "3 Jinx Points");
  assert.equal(optionMeta(optionDef("metamagic", "Twinned Spell"), optionSetDef("metamagic")), "sorcery points equal to the spell level (1 for a cantrip)");
  assert.equal(optionMeta(optionDef("metamagic", "Subtle Spell")), "1 sorcery point", "sorcery points without a set");
  assert.equal(optionMeta(optionDef("arcaneShots", "Banishing Arrow"), optionSetDef("arcaneShots")), "Charisma save");
  assert.equal(optionMeta(optionDef("huntersPrey", "Colossus Slayer"), optionSetDef("huntersPrey")), "");
});

test("what known options do on the sheet: darkvision, speeds, rage speed, rune uses", () => {
  // Stone rune: darkvision 120 for a human.
  const rk = makeChar([ent("Fighter", "Rune Knight", 3, { runes: known("r", ["Stone Rune", "Fire Rune"]) })], { race: "Human" });
  assert.deepEqual(H.computeDarkvision(rk), { range: 120, sources: ["Stone Rune (Runes)"] });
  assert.equal(H.getCharacterSenses(rk), "Darkvision 120 ft");
  // Rune invocations follow the runes known: 2 at 3, doubled from 15.
  const runes = (c) => H.characterResources(c).find((r) => r.key === "Fighter:rune_invocations").max;
  assert.equal(runes(rk), 2);
  rk.classes[0].level = 15;
  rk.classes[0].options.runes = known("r", ["Stone Rune", "Fire Rune", "Hill Rune"]);
  assert.equal(runes(rk), 6);
  assert.equal(runes(makeChar([ent("Fighter", "Rune Knight", 7)])), 3, "no picks yet: the level's count");
  // Elk: +15 ft while raging, not in heavy armor.
  const elk = makeChar([ent("Barbarian", "Path of the Totem Warrior", 3, { totemSpirit: known("t", ["Elk"]) })], { speed: 30, rage: { active: false, used: 0 } });
  assert.equal(H.computeSpeed(elk).value, 30);
  elk.rage.active = true;
  assert.equal(H.computeSpeed(elk).value, 45);
  elk.inventory = [{ id: "pl", type: "armor", category: "heavy", equipped: true, name: "Plate", baseAC: 18 }];
  elk.abilities.str = 15;
  assert.ok(!H.computeSpeed(elk).parts.some((p) => /Elk/.test(p.name)), "not in heavy armor");
  // Eagle at 14: fly = walk while raging.
  const eagle = makeChar([ent("Barbarian", "Path of the Totem Warrior", 14, { totemAttunement: known("e", ["Eagle"]) })], { speed: 40 });
  assert.deepEqual(H.computeSpeed(eagle).others, [{ type: "fly", value: 40, when: "while raging", source: "Eagle (Totemic Attunement)" }]);
  // Sea: swim 30 from barbarian 6 (Storm Soul), not before.
  const sea = makeChar([ent("Barbarian", "Path of the Storm Herald", 5, { stormEnvironment: known("s", ["Sea"]) })], { speed: 40 });
  assert.deepEqual(H.computeSpeed(sea).others, []);
  sea.classes[0].level = 6;
  assert.deepEqual(H.computeSpeed(sea).others.map((o) => [o.type, o.value]), [["swim", 30]]);
  assert.deepEqual(CO.optionEffects(makeChar([ent("Wizard", "", 5)])), []);
});

test("cards for the new sets draw, with always-known options and facts", (t) => {
  withFakeDom(t, () => {
    const monk = makeChar([ent("Monk", "Way of the Four Elements", 6, { disciplines: known("d", ["Water Whip"]) })]);
    assert.equal(renderOptionSetCards(monk).length, 1);
    for(const c of [
      makeChar([ent("Fighter", "Rune Knight", 7, { runes: known("r", ["Cloud Rune"]) })]),
      makeChar([ent("Fighter", "Arcane Archer", 18)]),
      makeChar([ent("Barbarian", "Path of the Storm Herald", 20, { stormEnvironment: known("s", ["Sea"]) })]),
      makeChar([ent("Barbarian", "Path of the Storm Herald", 3, { stormEnvironment: known("s", ["Tundra"]) })]),
      makeChar([ent("Barbarian", "Path of the Storm Herald", 10, { stormEnvironment: known("s", ["Desert"]) })]),
      makeChar([ent("Rogue", "Misfortune Bringer", 13, { misfortunes: known("m", ["Doomed"]) })])
    ]) assert.equal(renderOptionSetCards(c).length, 1, c.classes[0].subclass);
  });
});
