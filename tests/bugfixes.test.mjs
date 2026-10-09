/* Regression tests for the bugs found and fixed in the audit. Each
   test is named after the behavior it protects, prefixed by the area of
   the app, so a failure points straight at what broke. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { TOGGLE_EFFECTS } from "../js/data/effects.js";
import { RACE_DATA } from "../js/data/race-data.js";
import { CLASSES_INFO } from "../js/data/classes.js";
import { revertFeatPicks } from "../js/core/feat-picks.js";
import { newCharacter } from "../js/core/character.js";
import { undoLastLevelUp } from "../js/levelup/levelup.js";
import { renderVitalsPanel } from "../js/render/panels/vitals.js";
import { renderJournalPanel } from "../js/render/panels/journal.js";
import { state } from "../js/core/state.js";
import { ensureShape } from "../js/core/character.js";
import * as W from "../js/wizard/wizard-core.js";
import { importCustomSpells, getCustomSpells } from "../js/core/custom-spells.js";
import { applySpellSlots } from "../js/levelup/levelup.js";
import { syncInfusions, infusionBonus } from "../js/core/artificer.js";
import { featDef, featPicksProblem, featPicksSummary, applyFeatPicks } from "../js/core/feat-picks.js";
import { featPicksContext } from "../js/ui/feat-picks.js";
import { sink, withFakeDom } from "./fake-dom.mjs";

/* ---------- shared helpers ---------------------------------------- */
const AB = { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 10 };
function char(classes, extra = {}){
  return {
    abilities: { ...AB, ...(extra.abilities || {}) },
    saveProfs: extra.saveProfs || {},
    classes,
    inventory: extra.inventory || [],
    feats: extra.feats || [],
    features: extra.features || [],
    resourcesUsed: extra.resourcesUsed || {},
    effects: extra.effects || {},
    race: extra.race || "Human",
    initiativeMisc: 0,
    acMisc: 0,
    speed: extra.speed ?? 30
  };
}

/* ================================================================
   Active effects: starting one whose class resource is missing
   ================================================================
   An effect whose class resource is missing gets resource:undefined
   from characterEffects. startEffect must refuse it cleanly, without
   touching the character. */
test("active effects: one whose class resource is missing can't be started", () => {
  // No real effect lacks its resource, so add one for this test.
  const def = { id: "test_missing_resource", name: "Test", className: "Fighter", subclass: "Champion", level: 1,
    cost: { resource: "no_such_resource", amount: 1 } };
  TOGGLE_EFFECTS.push(def);
  try {
    const fighter = char([{ name: "Fighter", level: 5, subclass: "Champion" }]);
    const e = H.characterEffects(fighter).find(x => x.def.id === def.id);
    assert.ok(e, "the test effect should be listed for a Champion");
    assert.equal(e.resource, undefined);
    assert.match(e.why, /no_such_resource/);

    assert.doesNotThrow(() => H.startEffect(fighter, def.id));
    assert.equal(H.startEffect(fighter, def.id), false);
    assert.equal(H.effectOn(fighter, def.id), false);
    assert.deepEqual(fighter.resourcesUsed, {}, "nothing should be spent");
  } finally {
    TOGGLE_EFFECTS.splice(TOGGLE_EFFECTS.indexOf(def), 1);
  }
});

test("active effects: a character without an effect can't start it", () => {
  const fighter = char([{ name: "Fighter", level: 5 }]);
  TOGGLE_EFFECTS.forEach(function(def){
    assert.equal(H.startEffect(fighter, def.id), false, def.id);
  });
});

test("active effects: starting Bladesong spends one use", () => {
  const wizard = char([{ name: "Wizard", level: 2, subclass: "Bladesinging" }]);
  assert.equal(H.startEffect(wizard, "bladesong"), true);
  assert.equal(H.effectOn(wizard, "bladesong"), true);
  assert.equal(wizard.resourcesUsed["Wizard:bladesong"], 1, "one Bladesong use should be spent");
});

/* ================================================================
   Level-up undo: a feat deleted by hand
   ================================================================
   Deleting a feat on the Features tab reverts its picks there. Undoing
   the level-up that gave it must still work, and must not take the
   feat's ability increase back off a second time. */
function fighterWithFeatLevelUp(){
  const c = newCharacter("Undo test");
  c.classes = [{ name: "Fighter", level: 4, subclass: "Champion" }];
  c.abilities.dex = 15; // 14 + the feat's +1
  c.hp = { max: 40, current: 40, temp: 0 };
  c.feats.push({ id: "ft1", name: "Athlete", applied: { abilities: { dex: 1 } } });
  c.levelHistory = [{
    className: "Fighter", isNewClass: false, prevSubclass: "Champion",
    hpGain: 6, toughGain: 0, speedGain: 0, asi: null, featId: "ft1", unlockIds: [],
    prevSpellcasting: { ability: c.spellcasting.ability, slots: {}, pact: null }
  }];
  return c;
}
function undo(t, c){
  withFakeDom(t, (byId) => {
    undoLastLevelUp(c);
    byId["confirm-ok"].click();
  });
}

test("level-up undo: works after the level's feat was deleted by hand", (t) => {
  const c = fighterWithFeatLevelUp();
  // What the Features tab's delete does.
  revertFeatPicks(c, c.feats[0]);
  c.feats = c.feats.filter(f => f.id !== "ft1");
  assert.equal(c.abilities.dex, 14);

  assert.doesNotThrow(() => undo(t, c));
  assert.equal(c.classes[0].level, 3, "the class level should be removed");
  assert.equal(c.levelHistory.length, 0);
  assert.equal(c.abilities.dex, 14, "the feat's +1 must not be taken off twice");
  assert.equal(c.hp.max, 34);
});

test("level-up undo: reverts and removes the level's feat", (t) => {
  const c = fighterWithFeatLevelUp();
  undo(t, c);
  assert.equal(c.classes[0].level, 3);
  assert.equal(c.feats.length, 0);
  assert.equal(c.abilities.dex, 14, "the feat's +1 should be reverted");
});

/* ================================================================
   Armor class: Monk Unarmored Defense with a 0 AC shield
   ================================================================
   Before the fix, Monk Unarmored Defense used !shieldBonus which
   is true for a baseAC:0 shield. It must check whether a shield is
   actually equipped, not whether its bonus is non-zero. */
test("armor class: any equipped shield turns off Monk Unarmored Defense", () => {
  const zeroShield = { type: "armor", equipped: true, name: "Broken Shield", category: "shield", baseAC: 0 };
  const normalShield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };

  // No shield: Unarmored Defense active, 10 + DEX 2 + WIS 3 = 15
  const noShield = char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 } });
  assert.equal(H.computeArmorClass(noShield).value, 15);
  assert.match(H.computeArmorClass(noShield).short, /WIS/);

  // Normal shield: Unarmored Defense off, 10 + DEX 2 + shield 2 = 14
  const withShield = char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 }, inventory: [normalShield] });
  assert.equal(H.computeArmorClass(withShield).value, 14);
  assert.doesNotMatch(H.computeArmorClass(withShield).short, /WIS/);

  // 0-AC shield: Unarmored Defense must also be off (the bug)
  const withZeroShield = char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 }, inventory: [zeroShield] });
  assert.equal(H.computeArmorClass(withZeroShield).value, 12, "0-AC shield should block Unarmored Defense");
  assert.doesNotMatch(H.computeArmorClass(withZeroShield).short, /WIS/,
    "WIS must not appear in AC formula when a 0-AC shield is equipped");
});

/* ================================================================
   Spellcasting: Cleric and Druid prepared spells without abilities
   ================================================================
   spellPickCount passes {abilities: finalAbilities()} into the
   function. finalAbilities() always returns a full set, but we test
   the guard directly for robustness. */
test("spellcasting: Cleric and Druid prepared spell count with no abilities", () => {
  const clericSC = CLASSES_INFO["Cleric"].spellcasting;
  assert.equal(typeof clericSC.spells, "function",
    "Cleric's spells property should be a function (wisModPlusOne)");

  assert.doesNotThrow(
    () => clericSC.spells({}),
    "wisModPlusOne must not throw when abilities is undefined"
  );
  assert.ok(clericSC.spells({}) >= 1,
    "wisModPlusOne should return >= 1 when abilities is missing");

  // With real WIS 16 (mod +3): 1 + 3 = 4.
  assert.equal(clericSC.spells({ abilities: { wis: 16 } }), 4);
  // With WIS 8 (mod -1): clamped to 1.
  assert.equal(clericSC.spells({ abilities: { wis: 8 } }), 1);
  // Same guard applies to Druid.
  const druidSC = CLASSES_INFO["Druid"].spellcasting;
  assert.doesNotThrow(() => druidSC.spells({}), "Druid wisModPlusOne must not throw either");
});

/* ================================================================
   Armor class: the Defense fighting style needs worn armor
   ================================================================
   "While you are wearing armor, you gain a +1 bonus to AC." A shield
   alone doesn't count: the 2024 text says "Light, Medium, or Heavy
   armor", and Barbarian Unarmored Defense ("wearing no armor ... you
   can still use a shield") treats a shield as separate from armor. */
test("armor class: Defense style applies with worn armor, not a shield alone", () => {
  const shield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };
  const chainmail = { type: "armor", equipped: true, name: "Chain Mail", category: "heavy", baseAC: 16 };

  function defenseChar(inventory){
    const c = char([{ name: "Fighter", level: 1 }], { inventory });
    c.features = [{ id: "f1", name: "Defense", fightingStyle: "Defense" }];
    return c;
  }

  // Shield only: 10 + DEX 2 + shield 2 = 14, no Defense
  const shieldOnly = defenseChar([shield]);
  assert.equal(H.computeArmorClass(shieldOnly).value, 14,
    "Defense style must not apply with only a shield");
  assert.doesNotMatch(H.computeArmorClass(shieldOnly).short, /Defense/);

  // Body armor only: 16 + Defense 1 = 17
  const armorOnly = defenseChar([chainmail]);
  assert.equal(H.computeArmorClass(armorOnly).value, 17);
  assert.match(H.computeArmorClass(armorOnly).short, /Defense/);

  // Body armor + shield: 16 + shield 2 + Defense 1 = 19
  const armorAndShield = defenseChar([chainmail, shield]);
  assert.equal(H.computeArmorClass(armorAndShield).value, 19);

  // Nothing equipped: 10 + DEX 2 = 12, no Defense
  const noArmor = defenseChar([]);
  assert.equal(H.computeArmorClass(noArmor).value, 12);
  assert.doesNotMatch(H.computeArmorClass(noArmor).short, /Defense/);
});

/* ================================================================
   Armor proficiency: a shield proficiency found anywhere in the
   string, not only at its start
   ================================================================ */
test("armor proficiency: shield proficiency matches anywhere in the name", () => {
  const shield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };

  // "Shields" and "Shields (non-metal)" from the class data.
  assert.equal(H.isProficientWithArmor(char([{ name: "Fighter", level: 1 }]), shield), true, "Fighter");
  assert.equal(H.isProficientWithArmor(char([{ name: "Druid", level: 1 }]), shield), true, "Druid");
  // A Wizard has no shield proficiency at all.
  assert.equal(H.isProficientWithArmor(char([{ name: "Wizard", level: 1 }]), shield), false, "Wizard");

  // A proficiency that doesn't start with "shield" (no real data has one
  // yet, so add a race for this test). The old prefix check missed it.
  RACE_DATA["Test Race"] = { armorProfs: ["Tower shields"] };
  try {
    const wizard = char([{ name: "Wizard", level: 1 }], { race: "Test Race" });
    assert.equal(H.isProficientWithArmor(wizard, shield), true, "'tower shields' should count");
  } finally {
    delete RACE_DATA["Test Race"];
  }
});

/* ================================================================
   Ordinals: one shared ordinal() that handles 11th to 13th
   ================================================================ */
test("ordinals: 1st, 2nd, 3rd, 11th to 13th, 21st", () => {
  assert.equal(H.ordinal(1), "1st");
  assert.equal(H.ordinal(2), "2nd");
  assert.equal(H.ordinal(3), "3rd");
  assert.equal(H.ordinal(4), "4th");
  assert.equal(H.ordinal(11), "11th");
  assert.equal(H.ordinal(12), "12th");
  assert.equal(H.ordinal(13), "13th");
  assert.equal(H.ordinal(21), "21st");
  assert.equal(H.ordinal(22), "22nd");
  assert.equal(H.ordinal(23), "23rd");
  assert.equal(H.ordinal(111), "111th");
});

/* ================================================================
   Armor class: c.ac is not written during render
   ================================================================
   The Vitals panel used to write c.ac = computeArmorClass(c).value
   while rendering, without saving. AC is always computed. */
test("armor class: rendering Vitals leaves the saved c.ac alone", (t) => {
  const c = newCharacter("Render test");
  c.classes = [{ name: "Fighter", level: 1 }];
  c.inventory = [{ type: "armor", equipped: true, name: "Chain Mail", category: "heavy", baseAC: 16 }];
  c.ac = 10;
  withFakeDom(t, () => { renderVitalsPanel(c); });
  assert.equal(c.ac, 10, "render must not overwrite c.ac (the AC is 16)");
});

test("armor class: computed from equipment, never from the saved c.ac", () => {
  const plate = { type: "armor", equipped: true, name: "Plate", category: "heavy", baseAC: 18, magicBonus: 0 };
  const c = char([{ name: "Fighter", level: 1 }], { inventory: [plate] });
  c.ac = 99;
  assert.equal(H.computeArmorClass(c).value, 18);
});

/* ================================================================
   Phase 1 of the full review
   ================================================================ */

/* Runs the creation wizard's real finish with these choices on top of a
   plain point-buy Fighter, and returns the new character. */
const BASE_SCORES = { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 };
function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], preset: "", skills: [], tools: [], feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Wizard test", classId: "Fighter", race: "Human", background: "Soldier", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { ...BASE_SCORES }, skillChoices: ["Athletics", "Perception"],
    classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }
  }, choices, { raceChoices: rc });
}
function createThroughWizard(t, choices){
  let made;
  withFakeDom(t, () => {
    startWizard(choices);
    W.finishWizard();
    made = state.characters[state.characters.length - 1];
  });
  return made;
}
function raceTraitsError(t, choices){
  let err;
  withFakeDom(t, () => { startWizard(choices); err = W.validateStep("raceChoices"); });
  return err;
}

/* ---------- 1. Race ability increases at creation ---------- */
test("creation: a race's fixed increases are added (Hill Dwarf +2 CON, +1 WIS)", (t) => {
  const c = createThroughWizard(t, { race: "Hill Dwarf" });
  assert.deepEqual(c.abilities, { str: 15, dex: 14, con: 15, int: 8, wis: 13, cha: 10 });
});

test("creation: Human gets +1 to every score", (t) => {
  const c = createThroughWizard(t, { race: "Human" });
  assert.deepEqual(c.abilities, { str: 16, dex: 15, con: 14, int: 9, wis: 13, cha: 11 });
});

test("creation: increases stay within 1 to 20", (t) => {
  const high = createThroughWizard(t, { race: "Mountain Dwarf", abilityMethod: "manual", abilities: { ...BASE_SCORES, str: 20 } });
  assert.equal(high.abilities.str, 20, "20 + 2 is capped at 20");
  const low = createThroughWizard(t, { race: "Kobold", abilityMethod: "manual", abilities: { ...BASE_SCORES, str: 2 } });
  assert.equal(low.abilities.str, 1, "Kobold's -2 STR can't go below 1");
});

test("creation: Half-Elf adds +2 CHA and +1 to two other picked scores", (t) => {
  assert.match(raceTraitsError(t, { race: "Half-Elf", raceChoices: { abilities: ["str"] } }), /2 different abilities/);
  assert.match(raceTraitsError(t, { race: "Half-Elf", raceChoices: { abilities: ["str", "cha"] } }), /not Charisma/);
  assert.equal(raceTraitsError(t, { race: "Half-Elf", raceChoices: { abilities: ["str", "con"], skills: ["Stealth", "History"] } }), null);
  const c = createThroughWizard(t, { race: "Half-Elf", raceChoices: { abilities: ["str", "con"], skills: ["Stealth", "History"] } });
  assert.deepEqual(c.abilities, { str: 16, dex: 14, con: 14, int: 8, wis: 12, cha: 12 });
});

test("creation: a Fairy picks +2 for one score and +1 for another", (t) => {
  assert.match(raceTraitsError(t, { race: "Fairy", raceChoices: { abilities: ["dex", "dex"] } }), /2 different abilities/);
  const c = createThroughWizard(t, { race: "Fairy", raceChoices: { abilities: ["dex", "wis"] } });
  assert.equal(c.abilities.dex, 16);
  assert.equal(c.abilities.wis, 13);
  assert.equal(c.abilities.str, 15, "unpicked scores don't change");
});

test("creation: a Shifter's type sets its increases", (t) => {
  assert.match(raceTraitsError(t, { race: "Shifter" }), /shifter type/);
  const c = createThroughWizard(t, { race: "Shifter", raceChoices: { preset: "Beasthide" } });
  assert.equal(c.abilities.con, 15);
  assert.equal(c.abilities.str, 16);
});

test("creation: Variant Human still picks two +1s", (t) => {
  assert.match(raceTraitsError(t, { race: "Variant Human", raceChoices: { abilities: ["str"] } }), /2 different abilities/);
  const c = createThroughWizard(t, { race: "Variant Human",
    raceChoices: { abilities: ["str", "con"], skills: ["Stealth"], feat: "Alert", featPicks: { ability: "", skills: [], expertise: [], weapons: [] } } });
  assert.equal(c.abilities.str, 16);
  assert.equal(c.abilities.con, 14);
  assert.equal(c.abilities.dex, 14);
});

/* ---------- 2. Dwarven Toughness ---------- */
test("hit points: a new Hill Dwarf includes Dwarven Toughness", (t) => {
  const c = createThroughWizard(t, { race: "Hill Dwarf" });
  // d10 + CON 15 (+2) + Dwarven Toughness 1
  assert.equal(H.maxHp(c), 13);
  assert.equal(c.hp.current, 13);
});

test("hit points: Dwarven Toughness adds 1 per level, with Tough on top", () => {
  const c = char([{ name: "Fighter", level: 5 }], { race: "Hill Dwarf" });
  c.hp = { max: 44, current: 44, temp: 0 };
  assert.equal(H.maxHp(c), 49);
  c.feats = [{ id: "f", name: "Tough" }];
  assert.equal(H.maxHp(c), 59);
  assert.deepEqual(H.hpBonuses(c).map(b => b.name), ["Tough", "Dwarven Toughness"]);
  c.race = "Mountain Dwarf";
  assert.equal(H.maxHp(c), 54, "only Hill Dwarves have it");
});

/* ---------- 3. Hit dice by size ---------- */
test("hit dice: a multiclass character spends its largest dice first", () => {
  const c = char([{ name: "Wizard", level: 2 }, { name: "Barbarian", level: 3 }]);
  assert.deepEqual(H.hitDicePools(c).map(p => [p.die, p.total, p.used]), [[12, 3, 0], [6, 2, 0]]);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(() => H.spendHitDie(c)), [12, 12, 12, 6, 6, 0]);
  assert.equal(c.hitDiceUsed, 5);
  assert.deepEqual(c.hitDiceSpent, { 12: 3, 6: 2 });
});

test("hit dice: a long rest gives back half, largest first", () => {
  const c = char([{ name: "Wizard", level: 2 }, { name: "Barbarian", level: 3 }]);
  c.hitDiceSpent = { 12: 3, 6: 2 }; c.hitDiceUsed = 5;
  assert.equal(H.recoverHitDice(c), 2);
  assert.deepEqual(c.hitDiceSpent, { 12: 1, 6: 2 });
  assert.equal(c.hitDiceUsed, 3);
});

test("hit dice: an older save's total counts from the largest die down", () => {
  const c = char([{ name: "Wizard", level: 2 }, { name: "Barbarian", level: 3 }]);
  c.hitDiceUsed = 4;
  assert.deepEqual(H.hitDicePools(c).map(p => p.used), [3, 1]);
});

test("hit dice: undoing a class level keeps the spent count within the dice left", () => {
  const c = char([{ name: "Barbarian", level: 2 }]);
  c.hitDiceSpent = { 12: 3 }; c.hitDiceUsed = 3;
  H.syncHitDice(c);
  assert.equal(c.hitDiceUsed, 2);
});

/* ---------- 4. Rage ends with the other effects ---------- */
test("rage: dropping to 0 HP or resting ends it", () => {
  const c = char([{ name: "Barbarian", level: 3 }]);
  c.rage = { active: true, used: 1 };
  assert.deepEqual(H.endAllEffects(c), ["Rage"]);
  assert.equal(c.rage.active, false);
  assert.equal(c.rage.used, 1, "the rage stays spent");
  assert.deepEqual(H.endAllEffects(c), [], "nothing left to end");
});

/* ---------- 5. Import ---------- */
test("import: custom spells map old ids to new ones so characters relink", () => {
  const map = importCustomSpells([{ id: "old1", name: "Phase One Bolt", level: 1, school: "Evocation" }]);
  const saved = getCustomSpells().find(x => x.name === "Phase One Bolt");
  assert.ok(saved, "the spell is imported");
  assert.equal(map.old1, saved.id);
  // Importing it again maps onto the one already there.
  const again = importCustomSpells([{ id: "old2", name: "Phase One Bolt", level: 1 }]);
  assert.equal(again.old2, saved.id);
});

test("import: a character with broken lists is repaired, not left half-shaped", () => {
  const c = ensureShape({ name: "Broken", classes: "Fighter", spells: { a: 1 }, feats: [null, "Alert"],
    features: {}, inventory: [null, { name: "Rope" }], notes: "x", rollLog: 5 });
  assert.equal(c.classes[0].name, "Fighter");
  assert.deepEqual(c.spells, []);
  assert.deepEqual(c.feats.map(f => f.name), ["Alert"]);
  assert.deepEqual(c.features, []);
  assert.deepEqual(c.inventory.map(i => i.name), ["Rope"]);
  assert.deepEqual(c.notes, []);
  assert.deepEqual(c.rollLog, []);
});

/* ---------- 6. Journal ---------- */
function journalDelete(t, text){
  const c = char([{ name: "Fighter", level: 1 }]);
  c.notes = [{ ts: "today", text }];
  let asked = false;
  withFakeDom(t, (byId, made) => {
    renderJournalPanel(c);
    made.find(el => el.className === "rm-btn").click();
    asked = !!byId["confirm-ok"];
  });
  return { c, asked };
}

test("journal: an entry with writing asks before it's deleted", (t) => {
  const r = journalDelete(t, "The dragon's lair is under the mill.");
  assert.equal(r.asked, true, "the confirm dialog opens");
  assert.equal(r.c.notes.length, 1, "nothing is deleted until confirmed");
});

test("journal: an empty entry is deleted at once", (t) => {
  const r = journalDelete(t, "  ");
  assert.equal(r.asked, false);
  assert.equal(r.c.notes.length, 0);
});

/* ---------- 7. Cosmetic ---------- */
test("initiative: the breakdown leaves out a zero misc modifier", () => {
  const c = char([{ name: "Fighter", level: 1 }]);
  assert.doesNotMatch(H.computeInitiative(c).breakdown, /misc/);
  c.initiativeMisc = 2;
  assert.match(H.computeInitiative(c).breakdown, /misc \(\+2\)/);
  assert.equal(H.computeInitiative(c).value, 4);
});

/* ================================================================
   Phase 2 of the full review
   ================================================================ */
const SHIELD = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };
const LEATHER = { type: "armor", equipped: true, name: "Leather", category: "light", baseAC: 11 };
const BREASTPLATE = { type: "armor", equipped: true, name: "Breastplate", category: "medium", baseAC: 14 };
const CHAIN = { type: "armor", equipped: true, name: "Chain Mail", category: "heavy", baseAC: 16 };
const PLATE = { type: "armor", equipped: true, name: "Plate", category: "heavy", baseAC: 18 };

/* ---------- 8. Speed that needs no armor ---------- */
test("speed: Unarmored Movement only counts with no armor and no shield", () => {
  // Monk 6: +15 ft, already in the saved 45.
  const monk = (inventory) => char([{ name: "Monk", level: 6 }], { inventory, speed: 45 });
  assert.equal(H.computeSpeed(monk([])).value, 45);
  assert.equal(H.computeSpeed(monk([LEATHER])).value, 30);
  const shield = H.computeSpeed(monk([SHIELD]));
  assert.equal(shield.value, 30);
  assert.deepEqual(shield.parts, [{ name: "Unarmored Movement", value: -15, why: "with a shield" }]);
});

test("speed: Fast Movement only counts out of heavy armor", () => {
  const barb = (inventory) => char([{ name: "Barbarian", level: 5 }], { inventory, speed: 40, abilities: { str: 16 } });
  assert.equal(H.computeSpeed(barb([BREASTPLATE, SHIELD])).value, 40);
  assert.equal(H.computeSpeed(barb([CHAIN])).value, 30);
});

/* ---------- 9. Heavy armor's Strength ---------- */
test("speed: heavy armor without its Strength costs 10 ft", () => {
  const fighter = (str, inventory, race = "Human") => char([{ name: "Fighter", level: 1 }], { inventory, race, speed: 30, abilities: { str } });
  const slow = H.computeSpeed(fighter(12, [CHAIN]));
  assert.equal(slow.value, 20);
  assert.deepEqual(slow.parts, [{ name: "Chain Mail", value: -10, why: "needs STR 13" }]);
  assert.equal(H.computeSpeed(fighter(13, [CHAIN])).value, 30, "STR 13 is enough for chain mail");
  assert.equal(H.computeSpeed(fighter(14, [PLATE])).value, 20, "plate needs 15");
  assert.equal(H.computeSpeed(fighter(8, [BREASTPLATE])).value, 30, "medium armor has no requirement");
  assert.equal(H.armorStrengthShortfall(fighter(14, [PLATE]), PLATE), 15);
});

test("speed: dwarves and an Armorer's Arcane Armor ignore the Strength requirement", () => {
  const dwarf = char([{ name: "Fighter", level: 1 }], { inventory: [PLATE], race: "Hill Dwarf", speed: 25, abilities: { str: 8 } });
  assert.equal(H.computeSpeed(dwarf).value, 25);
  const armorer = char([{ name: "Artificer", subclass: "Armorer", level: 3, armorModel: "Guardian" }], { inventory: [PLATE], speed: 30, abilities: { str: 8 } });
  assert.equal(H.computeSpeed(armorer).value, 30);
});

/* ---------- 10. Monk weapons ---------- */
test("weapons: a monk uses DEX with monk weapons while unarmored", () => {
  const staff = { type: "weapon", name: "Quarterstaff", ability: "str", proficient: true };
  const monk = (inventory = []) => char([{ name: "Monk", level: 1 }], { inventory, abilities: { str: 10, dex: 16 } });
  assert.equal(H.weaponAttackBonus(monk(), staff), 5, "DEX +3 + PB 2");
  assert.equal(H.weaponDamageBonus(monk(), staff), 3);
  assert.equal(H.weaponAttackBonus(monk([SHIELD]), staff), 2, "a shield turns Martial Arts off");
  assert.equal(H.weaponAttackBonus(monk(), { ...staff, name: "Shortsword" }), 5);
  assert.equal(H.weaponAttackBonus(monk(), { ...staff, name: "Greatclub" }), 2, "two-handed isn't a monk weapon");
  assert.equal(H.weaponAttackBonus(monk(), { ...staff, name: "Longsword" }), 2, "martial isn't a monk weapon");
  const fighter = char([{ name: "Fighter", level: 1 }], { abilities: { str: 10, dex: 16 } });
  assert.equal(H.weaponAttackBonus(fighter, staff), 2, "only monks get Martial Arts");
});

/* ---------- 11. Spell slots edited by hand ---------- */
test("spell slots: slots added by hand survive a recalculation", () => {
  const wiz = newCharacter("Slots");
  wiz.classes = [{ name: "Wizard", level: 3 }];
  applySpellSlots(wiz);
  assert.equal(wiz.spellcasting.slots[1].max, 4);
  wiz.spellcasting.slots[1].max = 5; wiz.spellcasting.slots[1].extra = 1;   // what Edit's + does
  wiz.spellcasting.slots[2].max = 1; wiz.spellcasting.slots[2].extra = -1;  // and its -
  wiz.classes[0].level = 4;
  applySpellSlots(wiz);
  assert.equal(wiz.spellcasting.slots[1].max, 5, "4 + 1 by hand");
  assert.equal(wiz.spellcasting.slots[2].max, 2, "3 - 1 by hand");
});

/* ---------- 12. Infusions follow the artificer's level ---------- */
function artificerWithInfusions(level){
  const sword = { id: "w1", type: "weapon", name: "Longsword", magicBonus: 1 };
  const bow = { id: "w2", type: "weapon", name: "Light Crossbow", magicBonus: 1 };
  const c = char([{ name: "Artificer", level }], { inventory: [sword, bow] });
  c.infusions = { known: [{ id: "k1", name: "Enhanced Weapon" }, { id: "k2", name: "Repeating Shot" }],
    active: [{ id: "a1", knownId: "k1", name: "Enhanced Weapon", itemId: "w1", bonus: 1 },
             { id: "a2", knownId: "k2", name: "Repeating Shot", itemId: "w2", bonus: 1 }] };
  return { c, sword, bow };
}

test("infusions: Enhanced Weapon becomes +2 at artificer 10, Repeating Shot stays +1", () => {
  const { c, sword, bow } = artificerWithInfusions(10);
  assert.equal(infusionBonus(c, "Enhanced Weapon"), 2);
  assert.equal(infusionBonus(c, "Repeating Shot"), 1);
  assert.equal(syncInfusions(c), true);
  assert.equal(sword.magicBonus, 2);
  assert.equal(bow.magicBonus, 1);
  c.classes[0].level = 9;   // the level-up undone
  syncInfusions(c);
  assert.equal(sword.magicBonus, 1);
});

test("infusions: below artificer 2 they all end and their bonuses come off", () => {
  const { c, sword, bow } = artificerWithInfusions(1);
  syncInfusions(c);
  assert.equal(c.infusions.active.length, 0);
  assert.equal(sword.magicBonus, 0);
  assert.equal(bow.magicBonus, 0);
});

test("infusions: an older save at artificer 10 is brought up to +2 on load", () => {
  const { c, sword } = artificerWithInfusions(12);
  ensureShape(c);
  assert.equal(sword.magicBonus, 2);
});

/* ================================================================
   Phase 3 of the full review: rules the user chose to model
   ================================================================ */

/* ---------- Rage damage on weapons ---------- */
test("rage: melee STR weapons add rage damage while raging", () => {
  const axe = { type: "weapon", name: "Greataxe", ability: "str", proficient: true };
  const bow = { type: "weapon", name: "Longbow", ability: "dex", proficient: true };
  const barb = (extra = {}) => char([{ name: "Barbarian", level: 9 }], { abilities: { str: 16, dex: 14 }, ...extra });
  const raging = barb(); raging.rage = { active: true, used: 1 };
  assert.equal(H.weaponDamageBonus(raging, axe), 3 + 3, "STR +3, rage +3 at level 9");
  assert.equal(H.weaponDamageBonus(raging, bow), 2, "ranged attacks don't get it");
  const calm = barb(); calm.rage = { active: false, used: 0 };
  assert.equal(H.weaponDamageBonus(calm, axe), 3);
  const heavy = barb({ inventory: [PLATE] }); heavy.rage = { active: true, used: 1 };
  assert.equal(H.rageDamageBonus(heavy, axe), 0, "no rage benefits in heavy armor");
  const finesse = barb({ abilities: { str: 10, dex: 18 } }); finesse.rage = { active: true, used: 1 };
  assert.equal(H.rageDamageBonus(finesse, { type: "weapon", name: "Rapier", ability: "finesse" }), 0, "a DEX attack doesn't get it");
});

/* ---------- Armor without proficiency ---------- */
test("armor: wearing armor you aren't proficient with gives disadvantage on STR and DEX rolls", () => {
  const wiz = char([{ name: "Wizard", level: 1 }], { inventory: [CHAIN] });
  assert.equal(H.unproficientArmor(wiz).name, "Chain Mail");
  assert.equal(H.skillRollMode(wiz, "Athletics").mode, "dis");
  assert.equal(H.skillRollMode(wiz, "Arcana").mode, "none", "INT skills are fine");
  assert.equal(H.saveRollMode(wiz, "dex").mode, "dis");
  assert.equal(H.saveRollMode(wiz, "wis").mode, "none");
  assert.equal(H.checkRollMode(wiz, "str").mode, "dis");
  assert.equal(H.attackRollMode(wiz, { type: "weapon", name: "Dagger", ability: "finesse" }).mode, "dis");
  const fighter = char([{ name: "Fighter", level: 1 }], { inventory: [CHAIN] });
  assert.equal(H.skillRollMode(fighter, "Athletics").mode, "none", "a proficient wearer is fine");
});

test("rolls: advantage and disadvantage cancel out; reasons of one kind add up", () => {
  const r = H.combineRolls([{ mode: "adv", reason: "Bladesong" }, { mode: "dis", reason: "Not proficient with Plate" }]);
  assert.equal(r.mode, "none");
  assert.match(r.reason, /cancel/);
  // A wizard in chain mail: Stealth has the armor's disadvantage twice over.
  const wiz = char([{ name: "Wizard", level: 1 }], { inventory: [CHAIN] });
  const stealth = H.skillRollMode(wiz, "Stealth");
  assert.equal(stealth.mode, "dis");
  assert.match(stealth.reason, /Not proficient with Chain Mail; Chain Mail gives disadvantage/);
});

/* ---------- Warforged ---------- */
test("armor class: Warforged add Integrated Protection's +1", () => {
  const c = char([{ name: "Fighter", level: 1 }], { race: "Warforged", inventory: [CHAIN] });
  const ac = H.computeArmorClass(c);
  assert.equal(ac.value, 17);
  assert.match(ac.breakdown, /Integrated Protection \(\+1\)/);
  assert.equal(H.computeArmorClass(char([{ name: "Fighter", level: 1 }], { inventory: [CHAIN] })).value, 16);
});

/* ---------- Race skill and tool picks ---------- */
test("creation: Changeling skills come from its list, Warforged picks a skill and a tool", (t) => {
  assert.match(raceTraitsError(t, { race: "Changeling", raceChoices: { abilities: ["dex"], skills: ["Stealth", "Insight"] } }), /from Deception, Insight, Intimidation, Persuasion/);
  assert.equal(raceTraitsError(t, { race: "Changeling", raceChoices: { abilities: ["dex"], skills: ["Deception", "Insight"] } }), null);
  assert.match(raceTraitsError(t, { race: "Warforged", raceChoices: { abilities: ["str"], skills: ["Stealth"] } }), /Pick a tool/);
  const c = createThroughWizard(t, { race: "Warforged", raceChoices: { abilities: ["str"], skills: ["Stealth"], tools: ["Smith's tools"] } });
  assert.equal(c.skillProfs.Stealth.prof, true);
  assert.ok(c.features.some(f => f.name === "Tool proficiency: Smith's tools" && f.source === "Race"));
});

/* ---------- Expertise needs proficiency ---------- */
test("skills: expertise only counts with proficiency; old saves are fixed on load", () => {
  const c = char([{ name: "Rogue", level: 1 }], { abilities: { dex: 16 } });
  c.skillProfs = { Stealth: { prof: false, expertise: true } };
  assert.equal(H.skillCheck(c, "Stealth").value, 3, "expertise alone adds nothing");
  ensureShape(c);
  assert.equal(c.skillProfs.Stealth.prof, true, "loading ticks the proficiency it implies");
  assert.equal(H.skillCheck(c, "Stealth").value, 3 + 4);
});

/* ---------- Passive scores with advantage or disadvantage ---------- */
test("passives: +5 with advantage on the check, -5 with disadvantage", () => {
  const monk = char([{ name: "Monk", level: 6, subclass: "Way of the Astral Self" }], { abilities: { wis: 14 } });
  assert.equal(H.passiveInsight(monk), 12);
  monk.effects = { astral_visage: true };
  assert.equal(H.passiveInsight(monk), 17, "the visage's advantage on Insight");
  const wiz = char([{ name: "Wizard", level: 1 }], { inventory: [CHAIN], abilities: { wis: 10 } });
  assert.equal(H.passivePerception(wiz), 10, "WIS isn't affected by armor");
});

/* ---------- Jack of All Trades and Remarkable Athlete ---------- */
test("skills: Jack of All Trades adds half proficiency to checks without it", () => {
  const bard = char([{ name: "Bard", level: 5 }], { abilities: { dex: 14, wis: 12 } });   // PB 3
  bard.skillProfs = { Performance: { prof: true, expertise: false } };
  assert.equal(H.skillCheck(bard, "Athletics").value, 0 + 1, "half of 3, rounded down");
  assert.equal(H.skillCheck(bard, "Performance").value, 0 + 3, "proficient skills don't get it too");
  assert.equal(H.computeInitiative(bard).value, 2 + 1);
  assert.equal(H.passivePerception(bard), 10 + 1 + 1);
  assert.equal(H.abilityCheck(bard, "int").value, 1);
  assert.equal(H.skillCheck(char([{ name: "Bard", level: 1 }]), "Athletics").value, 0, "only from bard level 2");
});

test("skills: Remarkable Athlete adds half proficiency, rounded up, to STR, DEX and CON", () => {
  const champ = char([{ name: "Fighter", level: 7, subclass: "Champion" }], { abilities: { str: 16, dex: 14, int: 10 } });   // PB 3
  assert.equal(H.skillCheck(champ, "Athletics").value, 3 + 2);
  assert.equal(H.skillCheck(champ, "Arcana").value, 0, "not INT");
  assert.equal(H.computeInitiative(champ).value, 2 + 2);
  assert.match(H.computeInitiative(champ).breakdown, /Remarkable Athlete \(\+2\)/);
});

/* ---------- Per-class spellcasting ---------- */
test("spellcasting: each casting ability gets its own save DC and attack", () => {
  const c = char([{ name: "Cleric", level: 3 }, { name: "Wizard", level: 2 }], { abilities: { int: 16, wis: 14 } });   // PB 3
  const list = H.spellcastingAbilities(c);
  assert.deepEqual(list.map(x => [x.ability, x.classes.join("/"), x.dc, x.attack]), [["wis", "Cleric", 13, 5], ["int", "Wizard", 14, 6]]);
  const pal = char([{ name: "Paladin", level: 1 }, { name: "Sorcerer", level: 1 }]);
  assert.deepEqual(H.spellcastingAbilities(pal).map(x => x.classes.join("/")), ["Sorcerer"], "a level 1 paladin doesn't cast yet");
  const same = char([{ name: "Sorcerer", level: 2 }, { name: "Warlock", level: 2 }]);
  assert.deepEqual(H.spellcastingAbilities(same).map(x => x.classes.join("/")), ["Sorcerer/Warlock"], "same ability, one entry");
});

/* ---------- Elemental Adept ---------- */
test("feats: Elemental Adept picks a damage type and can be taken again for another", () => {
  const def = featDef("Elemental Adept");
  const c = char([{ name: "Sorcerer", level: 8 }]);
  const ctx = featPicksContext(c);
  assert.match(featPicksProblem(def, { option: "" }, ctx), /Pick a damage type/);
  const first = { id: "e1", name: "Elemental Adept" };
  c.feats.push(first);
  applyFeatPicks(c, first, { option: "Fire" });
  assert.equal(featPicksSummary(def, first.picks), "Fire");
  assert.match(featPicksProblem(def, { option: "Fire" }, featPicksContext(c)), /already have Elemental Adept \(Fire\)/);
  assert.equal(featPicksProblem(def, { option: "Cold" }, featPicksContext(c)), "");
  assert.equal(def.repeatable, true);
});

/* ---------- Duergar ---------- */
test("speed: Duergar ignore heavy armor's Strength like other dwarves", () => {
  const c = char([{ name: "Fighter", level: 1 }], { race: "Duergar", inventory: [PLATE], speed: 25, abilities: { str: 10 } });
  assert.equal(H.computeSpeed(c).value, 25);
});
