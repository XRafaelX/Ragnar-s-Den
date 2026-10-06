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

/* An element that accepts anything: every property is another such
   element, every call returns one, and writes are kept. Enough for the
   render code to run in Node without drawing anything. */
function sink(){
  const kept = {};
  const p = new Proxy(function(){}, {
    get(t, k){
      if(k in kept) return kept[k];
      if(k === Symbol.toPrimitive) return () => "";
      if(k === "length") return 0;
      if(k === "then") return undefined;
      return p;
    },
    set(t, k, v){ kept[k] = v; return true; },
    apply(){ return p; }
  });
  return p;
}
/* Runs fn with a stand-in DOM; returns the elements handed out by id so
   a test can click the confirm dialog's buttons. Timers are mocked so the
   toast doesn't hold the test open. */
function clickable(){
  const el = sink(); const handlers = {};
  el.addEventListener = (type, f) => { handlers[type] = f; };
  el.click = () => handlers.click && handlers.click();
  return el;
}
const timersOn = new WeakSet();
function withFakeDom(t, fn){
  if(!timersOn.has(t)){ t.mock.timers.enable({ apis: ["setTimeout"] }); timersOn.add(t); }
  const saved = { document: globalThis.document, raf: globalThis.requestAnimationFrame };
  const byId = {}, made = [];
  const doc = sink();
  doc.getElementById = (id) => byId[id] || (byId[id] = clickable());
  doc.createElement = () => { const el = clickable(); made.push(el); return el; };
  globalThis.document = doc;
  globalThis.requestAnimationFrame = () => 0;
  try { fn(byId, made); }
  finally { globalThis.document = saved.document; globalThis.requestAnimationFrame = saved.raf; }
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
  const rc = Object.assign({ abilities: [], preset: "", skills: [], feat: "", featPicks: null }, choices.raceChoices);
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
  assert.equal(raceTraitsError(t, { race: "Half-Elf", raceChoices: { abilities: ["str", "con"] } }), null);
  const c = createThroughWizard(t, { race: "Half-Elf", raceChoices: { abilities: ["str", "con"] } });
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
