/* Regression tests for the 8 bugs found and fixed in the audit.
   Each test is named after the bug it covers so a failure points
   straight at the regression. */
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
function withFakeDom(t, fn){
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const saved = { getElementById: document.getElementById, createElement: document.createElement,
    documentElement: document.documentElement, body: document.body };
  const byId = {};
  document.getElementById = (id) => {
    if(!byId[id]){
      const el = sink(); const handlers = {};
      el.addEventListener = (type, f) => { handlers[type] = f; };
      el.click = () => handlers.click && handlers.click();
      byId[id] = el;
    }
    return byId[id];
  };
  document.createElement = () => sink();
  document.documentElement = sink();
  document.body = sink();
  try { fn(byId); }
  finally { Object.assign(document, saved); }
}

/* ================================================================
   FIX 1: startEffect: null guard on e.resource
   ================================================================
   An effect whose class resource is missing gets resource:undefined
   from characterEffects. startEffect must refuse it cleanly, without
   touching the character. */
test("fix 1: startEffect refuses an effect whose class resource is missing", () => {
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

test("fix 1: startEffect returns false for effects the character doesn't have", () => {
  const fighter = char([{ name: "Fighter", level: 5 }]);
  TOGGLE_EFFECTS.forEach(function(def){
    assert.equal(H.startEffect(fighter, def.id), false, def.id);
  });
});

test("fix 1: startEffect still spends the resource when it is present", () => {
  const wizard = char([{ name: "Wizard", level: 2, subclass: "Bladesinging" }]);
  assert.equal(H.startEffect(wizard, "bladesong"), true);
  assert.equal(H.effectOn(wizard, "bladesong"), true);
  assert.equal(wizard.resourcesUsed["Wizard:bladesong"], 1, "one Bladesong use should be spent");
});

/* ================================================================
   FIX 2: undoLastLevelUp with a feat deleted by hand
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

test("fix 2: undo after the level-up's feat was deleted by hand", (t) => {
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

test("fix 2: undo with the feat still there reverts and removes it", (t) => {
  const c = fighterWithFeatLevelUp();
  undo(t, c);
  assert.equal(c.classes[0].level, 3);
  assert.equal(c.feats.length, 0);
  assert.equal(c.abilities.dex, 14, "the feat's +1 should be reverted");
});

/* ================================================================
   FIX 3: Monk Unarmored Defense: shield with baseAC 0 must block it
   ================================================================
   Before the fix, Monk Unarmored Defense used !shieldBonus which
   is true for a baseAC:0 shield. It must check whether a shield is
   actually equipped, not whether its bonus is non-zero. */
test("fix 3: Monk Unarmored Defense: 0-AC shield disables it", () => {
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
   FIX 4: wisModPlusOne: null guard for missing abilities
   ================================================================
   spellPickCount passes {abilities: finalAbilities()} into the
   function. finalAbilities() always returns a full set, but we test
   the guard directly for robustness. */
test("fix 4: wisModPlusOne: does not crash when abilities is missing", () => {
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
   FIX 5: Defense fighting style needs worn armor
   ================================================================
   "While you are wearing armor, you gain a +1 bonus to AC." A shield
   alone doesn't count: the 2024 text says "Light, Medium, or Heavy
   armor", and Barbarian Unarmored Defense ("wearing no armor ... you
   can still use a shield") treats a shield as separate from armor. */
test("fix 5: Defense fighting style applies with worn armor, not a shield alone", () => {
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
   FIX 6: isProficientWithArmor: shield proficiency found anywhere
            in the string, not only at its start
   ================================================================ */
test("fix 6: isProficientWithArmor: shield proficiency strings", () => {
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
   FIX 7: ordinal() is shared from helpers.js and handles 11th to 13th
   ================================================================ */
test("fix 7: ordinal suffixes", () => {
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
   FIX 8: c.ac is not written during render
   ================================================================
   The Vitals panel used to write c.ac = computeArmorClass(c).value
   while rendering, without saving. AC is always computed. */
test("fix 8: rendering the Vitals panel leaves c.ac alone", (t) => {
  const c = newCharacter("Render test");
  c.classes = [{ name: "Fighter", level: 1 }];
  c.inventory = [{ type: "armor", equipped: true, name: "Chain Mail", category: "heavy", baseAC: 16 }];
  c.ac = 10;
  withFakeDom(t, () => { renderVitalsPanel(c); });
  assert.equal(c.ac, 10, "render must not overwrite c.ac (the AC is 16)");
});

test("fix 8: computeArmorClass does not depend on c.ac", () => {
  const plate = { type: "armor", equipped: true, name: "Plate", category: "heavy", baseAC: 18, magicBonus: 0 };
  const c = char([{ name: "Fighter", level: 1 }], { inventory: [plate] });
  c.ac = 99;
  assert.equal(H.computeArmorClass(c).value, 18);
});
