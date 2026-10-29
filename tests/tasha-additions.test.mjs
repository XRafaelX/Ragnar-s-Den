/* Tasha's optional class features added 2026-10-29: a ranger's Primal
   Awareness (in place of Primeval Awareness, chosen at ranger 3) and a
   rogue's Steady Aim (a new feature every rogue 3 using Tasha's gets,
   switched on from the Active effects card), then Phase 1: a barbarian's
   Primal Knowledge and Instinctive Pounce and a ranger's Nature's Veil. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import * as LU from "../js/levelup/session.js";
import * as W from "../js/wizard/wizard-core.js";
import { finish, undoLastLevelUp } from "../js/levelup/apply.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import * as COMP from "../js/core/companions.js";
import { withFakeDom } from "./fake-dom.mjs";

function makeChar(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  c.abilities = { str: 8, dex: 18, con: 14, int: 10, wis: 16, cha: 8 };
  Object.assign(c, extra);
  return c;
}
function levelUp(t, c, setup){
  c.xp = 355000;
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    setup(LU.lu);
    LU.lu.hpMethod = "avg";
    finish();
  });
}
const names = (cl) => H.classFeatureList(cl).map((f) => f.name);
const bow = { id: "b", name: "Longbow", type: "weapon", damageDice: "1d8", damageType: "Piercing", ability: "dex", proficient: true, equipped: true, notes: "ammunition, heavy, two-handed" };

test("Primal Awareness: offered at ranger 3 only, in place of Primeval Awareness", (t) => {
  const v = H.classVariants("Ranger").find((x) => x.name === "Primal Awareness");
  assert.deepEqual([v.replaces, v.level], ["Primeval Awareness", 3]);
  assert.deepEqual(H.classVariantSwaps("Ranger", 1).map((x) => x.name), ["Favored Foe", "Deft Explorer"]);
  assert.deepEqual(H.classVariantSwaps("Ranger", 3).map((x) => x.name), ["Primal Awareness"]);
  // The creation wizard (level 1) doesn't offer it.
  withFakeDom(t, () => {
    W.openWizard();
    Object.assign(W.wizardState, { classId: "Ranger", tashaOptional: true });
    assert.deepEqual(W.wizardVariantOffers().map((x) => x.name), ["Favored Foe", "Deft Explorer"]);
  });

  // A ranger 2 levelling to 3 with Tasha's picks it on the Feature choices step.
  const c = makeChar([{ name: "Ranger", subclass: "", level: 2 }], { tashaOptional: true, hp: { max: 20, current: 20, temp: 0 } });
  let offers, label, gains;
  levelUp(t, c, (lu) => {
    lu.subclass = "Gloom Stalker";
    offers = LU.variantOffers().map((x) => x.name);
    label = LU.profStepLabel();
    lu.variants = { "Primeval Awareness": "Primal Awareness" };
    gains = LU.gainLabels("Ranger", "", 3);
  });
  assert.deepEqual([offers, label], [["Primal Awareness"], "Feature choices"]);
  assert.ok(gains.includes("Primal Awareness") && !gains.includes("Primeval Awareness"), gains.join());
  assert.deepEqual(c.classes[0].variants, { "Primeval Awareness": "Primal Awareness" });
  assert.ok(names(c.classes[0]).includes("Primal Awareness") && !names(c.classes[0]).includes("Primeval Awareness"));
  // Undo puts the ranger back as it was.
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.equal(c.classes[0].level, 2);
  assert.equal(c.classes[0].variants, undefined);

  // Without Tasha's: no offer.
  const plain = makeChar([{ name: "Ranger", subclass: "", level: 2 }], { hp: { max: 20, current: 20, temp: 0 } });
  levelUp(t, plain, (lu) => { lu.subclass = "Hunter"; offers = LU.variantOffers().length; });
  assert.equal(offers, 0);
  assert.ok(names(plain.classes[0]).includes("Primeval Awareness"));
});

test("Primal Awareness: always-known spells with a free cast each per long rest", () => {
  const at = (lv) => makeChar([{ name: "Ranger", subclass: "Hunter", level: lv, variants: { "Primeval Awareness": "Primal Awareness" } }], { tashaOptional: true });
  const spells = (c) => H.featureSpells(c).filter((s) => s.feature === "Primal Awareness");
  assert.deepEqual(spells(at(3)).map((s) => s.name), ["Speak with Animals"]);
  assert.deepEqual(spells(at(5)).map((s) => s.name), ["Speak with Animals", "Beast Sense"]);
  assert.deepEqual(spells(at(17)).map((s) => s.name), ["Speak with Animals", "Beast Sense", "Speak with Plants", "Locate Creature", "Commune with Nature"]);
  const sw = spells(at(5))[0];
  assert.deepEqual([sw.kind, sw.kindLabel, sw.source], ["known", "Free 1/long rest", "Ranger"]);
  assert.equal(H.spellHeldBy(at(3), "Speak with Animals"), "from Ranger", "the spell pickers grey it out");
  // A counter for each spell it has learned, back on a long rest.
  const casts = (c) => H.characterResources(c).filter((r) => /\(Primal Awareness\)$/.test(r.name));
  assert.deepEqual(casts(at(5)).map((r) => [r.name, r.max, r.reset]), [["Speak with Animals (Primal Awareness)", 1, "long"], ["Beast Sense (Primal Awareness)", 1, "long"]]);
  assert.equal(casts(at(9)).length, 3);
  assert.equal(casts(makeChar([{ name: "Ranger", subclass: "Hunter", level: 9 }])).length, 0, "none with Primeval Awareness");
  // Every version's text is plain: no semicolons or long dashes.
  const v = H.classVariants("Ranger").find((x) => x.name === "Primal Awareness");
  Object.values(v.features).flat().forEach((f) => assert.ok(!/[;–—]/.test(f.text), f.text));
});

test("Steady Aim: every rogue 3 using Tasha's gets it, and it follows the switch", () => {
  const rogue = (lv, extra) => makeChar([{ name: "Rogue", subclass: lv >= 3 ? "Assassin" : "", level: lv }], extra);
  const c = ensureShape(rogue(3, { tashaOptional: true }));
  assert.deepEqual(c.classes[0].variants, { "Steady Aim": "Steady Aim" });
  assert.ok(names(c.classes[0]).includes("Steady Aim"));
  assert.ok(!names(ensureShape(rogue(3)).classes[0]).includes("Steady Aim"), "not without Tasha's");
  assert.ok(!names(ensureShape(rogue(2, { tashaOptional: true })).classes[0]).includes("Steady Aim"), "not before rogue 3");
  // A ranger 5 / rogue 3 too.
  const multi = ensureShape(makeChar([{ name: "Ranger", subclass: "Gloom Stalker", level: 5 }, { name: "Rogue", subclass: "Assassin", level: 3 }], { tashaOptional: true }));
  assert.ok(names(multi.classes[1]).includes("Steady Aim"));
  // Switching Tasha's off takes it away (and its effect), on gives it back.
  c.tashaOptional = false;
  assert.equal(H.syncTashaAdditions(c), true);
  assert.ok(!names(c.classes[0]).includes("Steady Aim"));
  assert.ok(!H.characterEffects(c).some((e) => e.def.id === "steady_aim"));
  c.tashaOptional = true;
  H.syncTashaAdditions(c);
  assert.equal(H.syncTashaAdditions(c), false, "nothing to change the second time");
  assert.ok(H.characterEffects(c).some((e) => e.def.id === "steady_aim"));
  // Only swaps show as choices: Steady Aim isn't one.
  assert.deepEqual(H.classVariantSwaps("Rogue"), []);
});

test("Steady Aim: the level-up to rogue 3 gives it, undo takes it back", (t) => {
  const c = makeChar([{ name: "Rogue", subclass: "", level: 2 }], { tashaOptional: true, hp: { max: 15, current: 15, temp: 0 } });
  let gains, offers;
  levelUp(t, c, (lu) => {
    lu.subclass = "Thief";
    offers = LU.variantOffers().length;
    gains = LU.gainLabels("Rogue", "", 3);
  });
  assert.equal(offers, 0, "nothing to choose");
  assert.ok(gains.includes("Steady Aim"), gains.join());
  assert.ok(names(c.classes[0]).includes("Steady Aim"));
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.ok(!names(c.classes[0]).includes("Steady Aim"));
});

test("Steady Aim: advantage on the next attack roll, speed 0 until the turn ends", () => {
  const c = ensureShape(makeChar([{ name: "Rogue", subclass: "Assassin", level: 3 }], { tashaOptional: true, inventory: [bow] }));
  const e = H.characterEffects(c).find((x) => x.def.id === "steady_aim");
  assert.deepEqual([e.on, e.why, e.def.startLabel, e.def.endLabel], [false, "", "Take aim", "End turn"]);
  assert.equal(H.attackRollMode(c, bow).mode, "none");
  assert.equal(H.computeSpeed(c).value, 30);
  assert.ok(H.startEffect(c, "steady_aim"));
  assert.deepEqual([H.attackRollMode(c, bow).mode, H.attackRollMode(c, bow).reason], ["adv", "Steady Aim"]);
  assert.equal(H.plainAttackRollMode(c).mode, "adv", "a spell attack too");
  assert.deepEqual([H.computeSpeed(c).value, H.computeSpeed(c).hindered.zero], [0, "Steady Aim"]);
  // Rolling an attack uses the advantage up; the speed stays 0.
  assert.equal(H.useSteadyAim(c), true);
  assert.equal(H.useSteadyAim(c), false);
  assert.equal(H.attackRollMode(c, bow).mode, "none");
  assert.equal(H.computeSpeed(c).value, 0);
  // End turn: back to normal. A rest ends it too.
  H.endEffect(c, "steady_aim");
  assert.equal(H.computeSpeed(c).value, 30);
  H.startEffect(c, "steady_aim");
  assert.deepEqual(H.endAllEffects(c), ["Steady Aim"]);
  // Disadvantage from elsewhere cancels it out (Poisoned).
  H.startEffect(c, "steady_aim");
  H.addCondition(c, "poisoned");
  assert.equal(H.attackRollMode(c, bow).mode, "none");
});

/* ---- Phase 1 (2026-10-29): Primal Knowledge, Instinctive Pounce, Nature's Veil ---- */
const BARB_SKILLS = ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"];

test("Primal Knowledge: a barbarian skill at 3 in the level-up, another at 10, gone with Tasha's off", (t) => {
  const c = makeChar([{ name: "Barbarian", subclass: "", level: 2 }], { tashaOptional: true, hp: { max: 25, current: 25, temp: 0 } });
  c.skillProfs.Athletics = { prof: true, expertise: false };
  let asked, options, label;
  levelUp(t, c, (lu) => {
    lu.subclass = "Path of the Berserker";
    asked = LU.profGrantsToChoose().map((g) => g.key);
    const g = LU.profGrants().find((x) => x.key === "class:Primal Knowledge@3");
    options = CP.slotOptions(g.def, [], 0, LU.profCtx(g)).map((o) => o.value + (o.reason ? "*" : ""));
    label = LU.profStepLabel();
    lu.profPicks["class:Primal Knowledge@3"] = [["Nature"]];
  });
  assert.deepEqual(asked, ["class:Primal Knowledge@3"]);
  assert.deepEqual(options, BARB_SKILLS.map((s) => s === "Athletics" ? s + "*" : s), "only the barbarian's skills, Athletics greyed");
  assert.equal(label, "Proficiencies");
  assert.ok(c.skillProfs.Nature.prof && names(c.classes[0]).includes("Primal Knowledge"));
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.ok(!c.skillProfs.Nature?.prof && !names(c.classes[0]).includes("Primal Knowledge"), "undo takes the skill and the feature back");

  // An older barbarian 10 gets both picks waiting on the Feature choices card.
  const old = ensureShape(makeChar([{ name: "Barbarian", subclass: "Path of the Berserker", level: 10 }], { tashaOptional: true }));
  assert.deepEqual(CP.pendingClassPicks(old).map((g) => g.key), ["class:Primal Knowledge@3", "class:Primal Knowledge@10"]);
  CP.applyClassPicks(old, old.classes[0], CP.entryGrants(old.classes[0]).find((g) => g.key === "class:Primal Knowledge@3"), [["Survival"]]);
  assert.ok(old.skillProfs.Survival.prof);
  // Switching Tasha's off takes the feature and its skill away.
  old.tashaOptional = false;
  H.syncTashaAdditions(old); CP.syncClassPicks(old);
  assert.ok(!old.skillProfs.Survival.prof && !names(old.classes[0]).includes("Primal Knowledge"));
});

test("Instinctive Pounce: a barbarian 7 using Tasha's gets it", () => {
  const at = (lv, tasha) => ensureShape(makeChar([{ name: "Barbarian", subclass: "Path of the Berserker", level: lv }], { tashaOptional: tasha }));
  assert.ok(names(at(7, true).classes[0]).includes("Instinctive Pounce"));
  assert.ok(!names(at(6, true).classes[0]).includes("Instinctive Pounce"));
  assert.ok(!names(at(7, false).classes[0]).includes("Instinctive Pounce"));
});

test("Nature's Veil: ranger 10's swap for Hide in Plain Sight, invisible until your next turn", () => {
  assert.deepEqual(H.classVariantSwaps("Ranger", 10).map((v) => v.name), ["Nature's Veil"]);
  const c = makeChar([{ name: "Ranger", subclass: "Hunter", level: 10, variants: { "Hide in Plain Sight": "Nature's Veil" } }], { tashaOptional: true, inventory: [bow] });
  assert.ok(names(c.classes[0]).includes("Nature's Veil") && !names(c.classes[0]).includes("Hide in Plain Sight"));
  const uses = H.characterResources(c).find((r) => r.name === "Nature's Veil");
  assert.deepEqual([uses.max, uses.reset], [4, "long"], "proficiency bonus uses, back on a long rest");
  assert.equal(H.attackRollMode(c, bow).mode, "none");
  assert.ok(H.startEffect(c, "natures_veil"));
  assert.equal(c.resourcesUsed["Ranger:natures_veil"], 1);
  assert.deepEqual([H.attackRollMode(c, bow).mode, H.attackRollMode(c, bow).reason], ["adv", "Nature's Veil: you're invisible"]);
  H.endEffect(c, "natures_veil");
  c.resourcesUsed["Ranger:natures_veil"] = 4;
  assert.match(H.characterEffects(c).find((e) => e.def.id === "natures_veil").why, /Not enough Nature's Veil left/);
  // Without the swap it isn't there.
  const plain = makeChar([{ name: "Ranger", subclass: "Hunter", level: 10 }]);
  assert.ok(!H.characterEffects(plain).some((e) => e.def.id === "natures_veil") && names(plain.classes[0]).includes("Hide in Plain Sight"));
});

/* ---- Phase 2 (2026-10-29): Dedicated Weapon, Ki-Fueled Attack, Quickened Healing, Focused Aim ---- */
const monk = (lv, extra = {}) => ensureShape(makeChar([{ name: "Monk", subclass: lv >= 3 ? "Way of the Open Hand" : "", level: lv }], Object.assign({ tashaOptional: true }, extra)));
const weapon = (name, extra = {}) => Object.assign({ id: name, name, type: "weapon", qty: 1, ability: "str", proficient: true, magicBonus: 0, equipped: true, damageDice: "1d8", damageType: "Slashing", notes: "" }, extra);

test("the monk's Tasha's features arrive at levels 2 to 5", () => {
  assert.deepEqual(["Dedicated Weapon", "Ki-Fueled Attack", "Quickened Healing", "Focused Aim"].map((n) => [2, 3, 4, 5].find((lv) => names(monk(lv).classes[0]).includes(n))), [2, 3, 4, 5]);
  assert.ok(!names(monk(5, { tashaOptional: false }).classes[0]).some((n) => /Dedicated|Ki-Fueled|Quickened|Focused/.test(n)));
});

test("Dedicated Weapon: one proficient simple or martial weapon without heavy or special counts as a monk weapon", () => {
  const sword = weapon("Longsword");
  const c = monk(5, { inventory: [sword, weapon("Greatsword", { damageDice: "2d6" }), weapon("Lance", { damageDice: "1d12" }), weapon("Rapier", { proficient: false })] });
  assert.equal(H.dedicateProblem(sword), "");
  assert.equal(H.dedicateProblem(c.inventory[1]), "It can't have the heavy property.");
  assert.equal(H.dedicateProblem(c.inventory[2]), "It can't have the special property.");
  assert.equal(H.dedicateProblem(c.inventory[3]), "You must be proficient with it.");
  assert.equal(H.martialArtsApplies(c, sword), false);
  H.setDedicatedWeapon(c, sword, true);
  assert.equal(H.martialArtsApplies(c, sword), true, "a dedicated longsword uses Martial Arts");
  assert.ok(H.weaponAttackBonus(c, sword) > 0 && H.weaponAbility(c, sword).keys.includes("dex"), "with DEX");
  // Only one at a time; stopping takes it back.
  const rapier = c.inventory[3];
  rapier.proficient = true;
  H.setDedicatedWeapon(c, rapier, true);
  assert.deepEqual([sword.dedicated, rapier.dedicated], [undefined, true]);
  H.setDedicatedWeapon(c, rapier, false);
  assert.equal(rapier.dedicated, undefined);
  // Without Tasha's the flag does nothing.
  H.setDedicatedWeapon(c, sword, true);
  c.tashaOptional = false; H.syncTashaAdditions(c);
  assert.equal(H.martialArtsApplies(c, sword), false);
});

test("Quickened Healing and Focused Aim spend ki", () => {
  const c = monk(5);
  assert.deepEqual(H.quickenedHealing(c), { cost: 2, die: 6, bonus: 3 });
  assert.equal(H.quickenedHealing(monk(3)), null, "from monk 4");
  assert.equal(H.hasFocusedAim(c), true);
  assert.equal(H.hasFocusedAim(monk(4)), false, "from monk 5");
  assert.equal(H.kiLeft(c), 5);
  assert.ok(H.spendKi(c, 3));
  assert.equal(H.kiLeft(c), 2);
  assert.equal(H.spendKi(c, 3), false, "not enough left");
  assert.equal(H.kiLeft(makeChar([{ name: "Fighter", subclass: "", level: 5 }])), -1);
});

/* ---- Phase 3 (2026-10-29): Harness Divine Power, Magical Guidance, Magical Inspiration ---- */
const caster = (name, sub, lv, extra = {}) => ensureShape(makeChar([{ name, subclass: sub, level: lv }], Object.assign({ tashaOptional: true }, extra)));

test("Harness Divine Power: a Channel Divinity for a spent slot up to half the proficiency bonus", () => {
  const c = caster("Cleric", "Life Domain", 5);
  c.spellcasting.slots = { 1: { max: 4, used: 1 }, 2: { max: 3, used: 1 }, 3: { max: 2, used: 2 } };
  const h = H.harnessDivinePower(c, "Cleric");
  assert.deepEqual([h.top, h.levels, h.usesLeft, h.channelLeft], [2, [1, 2], 1, 1], "proficiency +3: up to 2nd level, the 3rd-level slots aren't offered");
  assert.equal(H.useHarnessDivinePower(c, "Cleric", 3), false);
  assert.ok(H.useHarnessDivinePower(c, "Cleric", 2));
  assert.deepEqual([c.spellcasting.slots[2].used, c.resourcesUsed["Cleric:channel_divinity"], c.resourcesUsed["Cleric:harness_divine_power"]], [0, 1, 1]);
  assert.equal(H.useHarnessDivinePower(c, "Cleric", 1), false, "once a long rest at cleric 5");
  // Uses by level: cleric 1/2/3 at 2/6/18, paladin 1/2/3 at 3/7/15.
  const uses = (cls, sub, lv) => H.characterResources(caster(cls, sub, lv)).find((r) => r.name === "Harness Divine Power")?.max;
  assert.deepEqual([uses("Cleric", "Life Domain", 2), uses("Cleric", "Life Domain", 6), uses("Cleric", "Life Domain", 18)], [1, 2, 3]);
  assert.deepEqual([uses("Paladin", "", 2), uses("Paladin", "Oath of Devotion", 3), uses("Paladin", "Oath of Devotion", 7), uses("Paladin", "Oath of Devotion", 15)], [undefined, 1, 2, 3]);
  const pal = caster("Paladin", "Oath of Devotion", 3);
  pal.spellcasting.slots = { 1: { max: 3, used: 2 } };
  assert.deepEqual(H.harnessDivinePower(pal, "Paladin").levels, [1], "proficiency +2: 1st level only");
  assert.equal(H.harnessDivinePower(caster("Cleric", "Life Domain", 5, { tashaOptional: false }), "Cleric"), null);
});

test("Magical Guidance and Magical Inspiration arrive with Tasha's", () => {
  assert.equal(H.hasMagicalGuidance(caster("Sorcerer", "Draconic Bloodline", 5)), true);
  assert.equal(H.hasMagicalGuidance(caster("Sorcerer", "Draconic Bloodline", 4)), false, "from sorcerer 5");
  assert.equal(H.hasMagicalGuidance(caster("Sorcerer", "Draconic Bloodline", 5, { tashaOptional: false })), false);
  const s = caster("Sorcerer", "Draconic Bloodline", 5);
  assert.ok(H.spendResource(s, "Sorcerer:sorcery_points", 1));
  assert.equal(H.resourceLeft(s, "Sorcerer:sorcery_points"), 4);
  assert.ok(names(caster("Bard", "", 2).classes[0]).includes("Magical Inspiration"));
  assert.ok(!names(caster("Bard", "", 2, { tashaOptional: false }).classes[0]).includes("Magical Inspiration"));
});

/* ---- Phase 4 (2026-10-29): Wild Companion ---- */
test("Wild Companion: a Wild Shape use casts Find Familiar, a fey that lasts half the druid level in hours", () => {
  const druid = (lv, extra) => caster("Druid", lv >= 2 ? "Circle of the Land" : "", lv, extra);
  const c = druid(2);
  const ff = H.featureSpells(c).find((s) => s.name === "Find Familiar");
  assert.deepEqual([ff.kind, ff.kindLabel, ff.feature], ["free", "1 Wild Shape", "Wild Companion"]);
  const fam = () => COMP.characterCompanions(c).find((x) => x.def.id === "familiar");
  assert.equal(fam().source, "Wild Companion");
  COMP.setCompanionChoice(c, "familiar", "Owl");
  assert.equal(fam().stats.type, "Tiny fey: owl");
  assert.ok(fam().stats.traits.some((t) => t.name === "Wild Companion" && /disappears after 1 hour\./.test(t.text)));
  assert.equal(COMP.wildCompanionHours(druid(6)), 3);
  assert.equal(COMP.wildCompanionHours(druid(2, { tashaOptional: false })), 0);
  assert.ok(!COMP.characterCompanions(druid(2, { tashaOptional: false })).some((x) => x.def.id === "familiar"), "no familiar without it");
  // A new summoning is a new familiar at full hit points.
  c.companions.familiar.hp = [0];
  COMP.summonWildCompanion(c);
  assert.deepEqual(fam().hp, [fam().stats.hp]);
  // A druid who knows the spell too: the familiar may be any of the three.
  const both = druid(4, { spells: [{ name: "Find Familiar", level: 1 }] });
  COMP.setCompanionChoice(both, "familiar", "Owl");
  const f2 = COMP.characterCompanions(both).find((x) => x.def.id === "familiar");
  assert.deepEqual([f2.source, f2.stats.type], ["Find Familiar", "Tiny celestial, fey or fiend: owl"]);
  assert.ok(f2.stats.traits.some((t) => t.name === "Wild Companion" && /2 hours/.test(t.text)));
});
