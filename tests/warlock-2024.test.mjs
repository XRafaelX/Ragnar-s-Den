/* The 2024 Warlock (2026-11-06, Phase 14 of the 2024 Player's Handbook):
   checked against the printed book, pp. 153 to 163. A class entry's edition
   "2024" swaps in an invocation from level 1, the pacts as invocations, the
   2024 invocation list, Magical Cunning, Contact Patron, a patron at level 3
   and the four 2024 patrons with their new names. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as INV from "../js/core/invocations.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { WARLOCK_2024, WARLOCK_2024_SUBCLASSES, INVOCATIONS_2024 } from "../js/data/warlock-2024.js";
import { INVOCATIONS, invocationDef, invocationLabel, invocationsKnownAt } from "../js/data/invocations.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { subclassesFor, computeSpellSlots, subclassLevelOf, classLevelOf } from "../js/core/class-features.js";
import { casterDef } from "../js/core/spells-known.js";
import { attacksPerAction, weaponAbility } from "../js/core/equipment.js";
import { characterCompanions } from "../js/core/companions.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 10, wis: 12, cha: 18 };
function wl(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("W");
  const cl = Object.assign({ name: "Warlock", subclass: sub, level: lv }, extra.cl || {});
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra.c || {});
  const out = ensureShape(c);
  const s = computeSpellSlots(out.classes);
  out.spellcasting.pact = { max: s.pact.max, slotLevel: s.pact.slotLevel, used: 0 };
  return out;
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const ctxOf = (c) => INV.invocationContext(c, c.classes[0]);
const why = (c, name) => INV.invocationReason(invocationDef(name), ctxOf(c));
const learn = (c, name, spells) => INV.learnInvocation(c, c.classes[0], name, spells);
const blast = { name: "Eldritch Blast", level: 0, learnedBy: "Warlock" };

test("the 2014 warlock is unchanged without an edition", () => {
  const c = wl(3, "The Fiend", "");
  assert.equal(subclassLevelOf(c.classes[0]), 1);
  assert.equal(invocationsKnownAt(2), 2);
  assert.ok(INV.levelUpPlan(c.classes[0], 3).pactDue, "the Pact Boon at 3");
  assert.equal(why(c, "Armor of Shadows"), "");
  assert.equal(why(c, "Armor of Shadows (2024)"), "2024 rules");
  assert.ok(res(wl(20, "", ""), "Eldritch Master") && !res(wl(20, "", ""), "Magical Cunning"));
});

test("the features arrive at the book's levels (p. 154)", () => {
  const at = (lv) => names(wl(lv));
  assert.ok(at(1).includes("Eldritch Invocations") && at(1).includes("Pact Magic"));
  assert.ok(at(2).includes("Magical Cunning") && at(9).includes("Contact Patron"));
  assert.ok(at(11).includes("Mystic Arcanum") && at(19).includes("Epic Boon") && at(20).includes("Eldritch Master"));
  assert.equal(subclassLevelOf(wl(1).classes[0]), 3);
  assert.deepEqual([1, 2, 5, 7, 9, 12, 15, 18].map((l) => invocationsKnownAt(l, "2024")), [1, 3, 5, 6, 7, 8, 9, 10]);
  const def = casterDef("Warlock", "", "2024");
  assert.deepEqual(def.spells.slice(1), [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15]);
  assert.deepEqual([1, 4, 10].map((l) => def.cantrips[l]), [2, 3, 4]);
  assert.equal(def.cantripSwap, "level");
  assert.deepEqual([1, 2, 11, 17].map((l) => computeSpellSlots(wl(l).classes).pact), [{max: 1, slotLevel: 1}, {max: 2, slotLevel: 1}, {max: 3, slotLevel: 5}, {max: 4, slotLevel: 5}]);
});

test("the 28 invocations: only for a 2024 warlock, with the book's prerequisites", () => {
  assert.equal(INVOCATIONS_2024.length, 28);
  const c = wl(1);
  const first = INV.availableInvocations(ctxOf(c)).map((i) => invocationLabel(i.name));
  assert.deepEqual(first, ["Armor of Shadows", "Eldritch Mind", "Pact of the Blade", "Pact of the Chain", "Pact of the Tome"]);
  assert.equal(why(c, "Agonizing Blast"), "2014 rules");
  assert.equal(why(c, "Devil's Sight (2024)"), "warlock 2");
  assert.equal(why(wl(5), "Thirsting Blade (2024)"), "needs Blade pact");
  assert.equal(why(wl(12), "Devouring Blade"), "needs Thirsting Blade", "its only prerequisite besides the level");
  const blade = wl(12);
  learn(blade, "Pact of the Blade");
  assert.equal(why(blade, "Devouring Blade"), "needs Thirsting Blade");
  learn(blade, "Thirsting Blade (2024)");
  assert.equal(why(blade, "Devouring Blade"), "");
  assert.equal(why(blade, "Pact of the Blade"), "known");
  assert.equal(INV.invocationPrereqText(invocationDef("Devouring Blade")), "Warlock 12, Thirsting Blade invocation");
  assert.deepEqual(INV.hiddenInvocationNotes(ctxOf(wl(1))), ["More unlock at higher warlock levels."]);
});

test("Agonizing Blast names a damage cantrip, and can be taken again for another", () => {
  const c = wl(5, "", "2024", { c: { spells: [] } });
  assert.equal(why(c, "Agonizing Blast (2024)"), "needs a damage cantrip");
  assert.equal(why(c, "Repelling Blast (2024)"), "needs an attack cantrip");
  c.spells = [blast, { name: "Mind Sliver", level: 0, learnedBy: "Warlock" }, { name: "Mage Hand", level: 0, learnedBy: "Warlock" }];
  const pick = INV.resolveSpellPick(invocationDef("Agonizing Blast (2024)").spellPick, ctxOf(c), "Agonizing Blast (2024)");
  assert.deepEqual(pick.names, ["Eldritch Blast", "Mind Sliver"], "damage cantrips only");
  assert.deepEqual(INV.resolveSpellPick(invocationDef("Repelling Blast (2024)").spellPick, ctxOf(c), "Repelling Blast (2024)").names, ["Eldritch Blast"]);
  learn(c, "Agonizing Blast (2024)", ["Mind Sliver"]);
  assert.equal(INV.eldritchBlastSummary(c).bonus, 0, "not on Eldritch Blast");
  assert.equal(why(c, "Agonizing Blast (2024)"), "", "again, for Eldritch Blast");
  learn(c, "Agonizing Blast (2024)", ["Eldritch Blast"]);
  assert.equal(INV.eldritchBlastSummary(c).bonus, 4);
  assert.equal(why(c, "Agonizing Blast (2024)"), "known", "no cantrip left for it");
  assert.equal(INV.invocationBroken(c, c.classes[0], c.classes[0].invocations[1]), "");
  learn(c, "Eldritch Spear (2024)", ["Eldritch Blast"]);
  assert.equal(INV.eldritchBlastSummary(c).range, 120 + 30 * 5);
  // The named cantrip isn't a new spell on the Spells tab.
  assert.ok(!INV.invocationSpells(c).some((s) => s.name === "Mind Sliver"));
});

test("the level-up: one at level 1, no Pact Boon, swaps keep what another needs", () => {
  const plan = INV.levelUpPlan(null, 1, "", false, "2024");
  assert.deepEqual([plan.applies, plan.pactDue, plan.fresh], [true, false, 1]);
  const c = wl(4);
  learn(c, "Pact of the Blade"); learn(c, "Armor of Shadows (2024)"); learn(c, "Eldritch Mind (2024)");
  const cl = c.classes[0];
  const five = INV.levelUpPlan(cl, 5);
  assert.deepEqual([five.applies, five.pactDue, five.fresh], [true, false, 2]);
  const ok = { picks: ["Thirsting Blade (2024)", "Devil's Sight (2024)"], pickSpells: {}, swapOut: "" };
  assert.equal(INV.levelUpProblem(c, cl, 5, ok), null);
  learn(c, "Thirsting Blade (2024)");
  const pactOut = cl.invocations.find((e) => e.name === "Pact of the Blade").id;
  assert.match(INV.levelUpProblem(c, cl, 6, { picks: ["Devil's Sight (2024)"], pickSpells: {}, swapOut: pactOut }), /Pact of the Blade is needed by your Thirsting Blade/);
  // A cantrip pick has to be made with it.
  c.spells = [blast];
  // (Level 6: one new invocation, and the swap's replacement last.)
  const agon = { picks: ["Devil's Sight (2024)", "Agonizing Blast (2024)"], pickSpells: {}, swapOut: cl.invocations[1].id };
  assert.equal(INV.levelUpProblem(c, cl, 6, agon), "Choose the cantrip for Agonizing Blast.");
  agon.pickSpells = { "Agonizing Blast (2024)": ["Eldritch Blast"] };
  assert.equal(INV.levelUpProblem(c, cl, 6, agon), null);
  const rec = INV.applyLevelUpChoices(c, cl, 6, agon);
  assert.deepEqual(rec.gained.map((g) => g.name), ["Devil's Sight", "Agonizing Blast"]);
  assert.equal(rec.invSwappedOut.name, "Armor of Shadows (2024)");
  assert.deepEqual(cl.invocations.find((e) => e.name === "Agonizing Blast (2024)").spells, ["Eldritch Blast"]);
});

test("Pact of the Blade: Charisma, two attacks, then three, and the 2024 Lifedrinker", () => {
  const c = wl(12, "", "2024", { c: { abilities: Object.assign({}, ABIL, { str: 12 }) } });
  const sword = { name: "Longsword", type: "weapon", damageDice: "1d8", damageType: "Slashing", ability: "str", proficient: true, pactWeapon: true };
  c.inventory = [sword];
  assert.ok(!H.hasPactOfTheBlade(c));
  learn(c, "Pact of the Blade");
  assert.ok(H.hasPactOfTheBlade(c) && H.isPactWeapon(c, sword));
  assert.deepEqual(weaponAbility(c, sword).keys, ["cha"]);
  assert.equal(attacksPerAction(c), 1);
  learn(c, "Thirsting Blade (2024)");
  assert.equal(attacksPerAction(c), 2);
  learn(c, "Devouring Blade");
  assert.equal(attacksPerAction(c), 3);
  learn(c, "Lifedrinker (2024)"); learn(c, "Eldritch Smite (2024)");
  const hits = H.warlockHitDice(c, sword);
  assert.deepEqual(hits.find((h) => h.id === "lifedrinker").die, 6);
  assert.equal(hits.find((h) => h.id === "eldritch_smite").qty, 6, "1d8 + 5d8 with a level 5 slot");
  // The 2014 pact weapon keeps Strength.
  const old = wl(5, "", "", { cl: { pactBoon: "Pact of the Blade" } });
  assert.ok(!weaponAbility(old, sword).keys.includes("cha"));
});

test("Pact of the Chain and the Tome", () => {
  const chain = wl(1);
  learn(chain, "Pact of the Chain");
  assert.ok(INV.invocationSpells(chain).some((s) => s.name === "Find Familiar" && s.kind === "atwill"));
  assert.ok(characterCompanions(chain).some((x) => x.def.id === "familiar"));
  const tome = wl(1);
  const pick = invocationDef("Pact of the Tome").spellPick;
  assert.ok(INV.pickOptions(pick, 0).includes("Guidance") && !INV.pickOptions(pick, 0).includes("Sleep"));
  assert.ok(INV.pickOptions(pick, 3).includes("Find Familiar") && INV.pickOptions(pick, 3).every((n) => n !== "Shield"));
  assert.ok(!INV.spellPickComplete(pick, ["Guidance", "Light", "Thaumaturgy", "Find Familiar", "Guidance"]));
  assert.ok(INV.spellPickComplete(pick, ["Guidance", "Light", "Thaumaturgy", "Find Familiar", "Detect Magic"]));
  learn(tome, "Pact of the Tome", ["Guidance", "Light", "Thaumaturgy", "Find Familiar", "Detect Magic"]);
  const got = INV.invocationSpells(tome).filter((s) => s.feature === "Pact of the Tome");
  assert.equal(got.length, 5);
  assert.ok(got.every((s) => s.kind === "known" && /Book of Shadows/.test(s.note)));
  // Its cantrips count as warlock cantrips for Agonizing Blast.
  const two = wl(2);
  learn(two, "Pact of the Tome", ["Toll the Dead", "Light", "Thaumaturgy", "Find Familiar", "Detect Magic"]);
  assert.equal(why(two, "Agonizing Blast (2024)"), "");
});

test("invocations' spells, senses, speeds and uses", () => {
  const c = wl(15);
  ["Armor of Shadows (2024)", "Devil's Sight (2024)", "Witch Sight (2024)", "Gift of the Depths (2024)", "Fiendish Vigor (2024)"].forEach((n) => learn(c, n));
  assert.ok(INV.invocationSenses(c).includes("Devil's Sight 120 ft") && INV.invocationSenses(c).includes("Truesight 30 ft"));
  assert.ok(INV.invocationSpeedSources(c).some((s) => s.name === "Gift of the Depths (2024)"));
  const spells = INV.invocationSpells(c);
  assert.ok(spells.some((s) => s.name === "Mage Armor" && s.kind === "atwill" && s.feature === "Armor of Shadows"));
  assert.ok(INV.invocationResources(c, { pb: 5 }).some((r) => r.name === "Water Breathing (Gift of the Depths)"));
  learn(c, "Eldritch Mind (2024)");
  assert.ok(H.hasInvocation(c, "Eldritch Mind"), "the shared checks find the 2024 one");
});

test("Magical Cunning, Contact Patron and Eldritch Master", () => {
  const c = wl(5);
  assert.ok(res(c, "Magical Cunning") && !res(c, "Eldritch Master"));
  assert.equal(H.magicalCunningSlots(c), 1, "half of 2, rounded up");
  assert.equal(H.magicalCunningSlots(wl(11)), 2, "half of 3, rounded up");
  assert.equal(H.magicalCunningSlots(wl(20)), 4, "all of them at 20");
  assert.ok(!res(wl(8), "Contact Patron (Free Contact Other Plane)") && res(wl(9), "Contact Patron (Free Contact Other Plane)"));
  assert.ok(H.featureSpells(wl(9)).some((s) => s.name === "Contact Other Plane"));
});

test("the patrons: new names, level 3, the shared automation", () => {
  const subs = subclassesFor("Warlock", "2024").map((s) => s.name);
  assert.deepEqual(subs.slice(0, 4), ["Archfey Patron", "Celestial Patron", "Fiend Patron", "Great Old One Patron"]);
  assert.ok(!subs.includes("The Fiend") && subs.includes("The Hexblade"));
  assert.ok(!subclassesFor("Warlock", "2014").some((s) => s.name === "Fiend Patron"));
  // Fiend: Dark One's Blessing, Own Luck by CHA, resistance without the old clause, Hurl 8d10.
  const fiend = wl(14, "Fiend Patron", "2024", { c: { fiendishResist: "Fire" } });
  assert.equal(classLevelOf(fiend, "Warlock", "The Fiend"), 14);
  assert.equal(H.darkOnesBlessing(fiend), 18);
  assert.equal(res(fiend, "Dark One's Own Luck").max, 4);
  assert.deepEqual(H.warlockResistances(fiend), [{ type: "fire", source: "Fiendish Resilience" }]);
  assert.equal(res(fiend, "Hurl Through Hell").roll.qty, 8);
  assert.ok(H.featureSpells(fiend).some((s) => s.name === "Insect Plague"));
  // Celestial: the pool, resilience, Searing Vengeance.
  const cel = wl(10, "Celestial Patron");
  assert.equal(res(cel, "Healing Light").max, 11);
  assert.deepEqual(H.celestialResilience(cel), { self: 14, others: 9 });
  assert.ok(H.featureResistances(cel).some((r) => /radiant/.test(r.type || r)));
  // Archfey: Steps of the Fey by CHA, immune to charmed at 10.
  const fey = wl(10, "Archfey Patron");
  assert.equal(res(fey, "Steps of the Fey (Free Misty Step)").max, 4);
  assert.ok(H.classFeatureList(fey.classes[0]).some((f) => f.name === "Beguiling Defenses" && f.conditionImmune.includes("charmed")));
  assert.ok(!res(fey, "Misty Escape"), "no uses in 2024");
  // Great Old One: Hex always prepared at 10, psychic resistance.
  const goo = wl(10, "Great Old One Patron");
  assert.ok(H.featureSpells(goo).some((s) => s.name === "Hex"));
  assert.ok(res(goo, "Clairvoyant Combatant") && !res(goo, "Entropic Ward"));
});

test("switching edition carries the invocations and the pact across", () => {
  const c = wl(5, "The Fiend", "", { c: { spells: [blast] }, cl: { pactBoon: "Pact of the Blade" } });
  learn(c, "Agonizing Blast"); learn(c, "Thirsting Blade"); learn(c, "Beast Speech");
  setClassEdition(c, "Warlock", true);
  const cl = c.classes[0];
  assert.equal(cl.subclass, "Fiend Patron");
  assert.deepEqual(cl.invocations.map((e) => e.name), ["Pact of the Blade", "Agonizing Blast (2024)", "Thirsting Blade (2024)", "Beast Speech"]);
  assert.deepEqual(cl.invocations[1].spells, ["Eldritch Blast"]);
  assert.ok(!cl.pactBoon && H.hasPactOfTheBlade(c));
  assert.match(INV.invocationBroken(c, cl, cl.invocations[3]), /2014 rules/);
  setClassEdition(c, "Warlock", false);
  assert.equal(cl.pactBoon, "Pact of the Blade");
  assert.deepEqual(cl.invocations.map((e) => e.name), ["Agonizing Blast", "Thirsting Blade", "Beast Speech"]);
});

test("Lessons of the First Ones gives an Origin feat, and takes it back", () => {
  const c = wl(2);
  const e = learn(c, "Lessons of the First Ones");
  assert.ok(INV.lessonsFeatChoices(c, c.classes[0]).includes("Alert (2024)"));
  INV.addLessonsFeat(c, e, "Alert (2024)");
  assert.equal(INV.lessonsFeat(c, e).name, "Alert (2024)");
  assert.ok(!INV.lessonsFeatChoices(c, c.classes[0]).includes("Alert (2024)"), "a different one next time");
  assert.equal(why(c, "Lessons of the First Ones"), "", "repeatable");
  INV.forgetInvocation(c, c.classes[0], e.id);
  assert.ok(!c.feats.some((f) => f.name === "Alert (2024)"));
});

test("Eldritch Adept (a 2014 feat) keeps the 2014 invocations", async () => {
  const FP = await import("../js/core/feat-picks.js");
  assert.ok(FP.featInvocationChoices().every((n) => !invocationDef(n).edition));
});

test("the kit and proficiencies are the book's (p. 153)", () => {
  const [a, gold] = WARLOCK_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(a.items.map((i) => [i.name, i.qty]), [["Leather", 1], ["Sickle", 1], ["Dagger", 2], ["Arcane Focus (orb)", 1], ["Book (occult lore)", 1], ["Scholar's Pack", 1]]);
  assert.deepEqual([a.coins.gp, gold.coins.gp], [15, 100]);
  assert.deepEqual(WARLOCK_2024.proficiencies.savingThrows, ["wis", "cha"]);
  assert.deepEqual(WARLOCK_2024.multiclassProfs.armor, ["Light armor"]);
  assert.deepEqual(WARLOCK_2024.multiclassProfs.weapons, []);
});

test("the words stay friendly: no long dashes or semicolons", () => {
  const text = JSON.stringify([WARLOCK_2024.level1, WARLOCK_2024.features, WARLOCK_2024.card, WARLOCK_2024.which, WARLOCK_2024.choices, WARLOCK_2024_SUBCLASSES, INVOCATIONS_2024]);
  assert.ok(!/[–—;]/.test(text));
  assert.equal(INVOCATIONS.filter((i) => i.edition === "2024").length, 28);
});
