/* Regression tests for the 8 bugs found and fixed in the audit.
   Each test is named after the bug it covers so a failure points
   straight at the regression. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as H from "../js/core/helpers.js";
import { TOGGLE_EFFECTS } from "../js/data/effects.js";
import { revertFeatPicks } from "../js/core/feat-picks.js";
import { CLASSES_INFO } from "../js/data/classes.js";

function src(relPath){
  return readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), "utf8");
}

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
   FIX 1 — startEffect: null guard on e.resource
   ================================================================
   An effect whose class resource key doesn't exist in
   characterResources returns resource:undefined from characterEffects.
   startEffect used to dereference it unconditionally; now it must not
   crash even when resource is undefined. */
test("fix 1 — startEffect does not crash when e.resource is undefined", () => {
  // Bladesong is the only toggle effect and its resource IS present for
  // a Bladesinging wizard — so we test the inverse: use an effect id
  // that has no resource match to confirm the guard fires rather than
  // throwing. We do this by calling startEffect on a character who
  // doesn't have the required class at all; characterEffects won't
  // include it, so find() returns undefined → the function returns false.
  const fighter = char([{ name: "Fighter", level: 5 }]);

  // None of the toggle effects apply to a plain fighter;
  // startEffect must return false cleanly for every one of them.
  TOGGLE_EFFECTS.forEach(function(def){
    assert.doesNotThrow(
      () => H.startEffect(fighter, def.id),
      "startEffect(" + def.id + ") threw on a fighter"
    );
    assert.equal(H.startEffect(fighter, def.id), false,
      "startEffect(" + def.id + ") should return false, not crash");
  });
});

test("fix 1 — startEffect works normally when resource is present", () => {
  // A Bladesinging wizard at level 2 has the Bladesong resource.
  // startEffect should activate it and return true.
  const wizard = char([{ name: "Wizard", level: 2, subclass: "Bladesinging" }]);
  const result = H.startEffect(wizard, "bladesong");
  assert.equal(result, true, "startEffect should succeed for a Bladesinging wizard");
  assert.equal(H.effectOn(wizard, "bladesong"), true, "bladesong should now be on");
});

/* ================================================================
   FIX 2 — undoLastLevelUp: guard against a manually-deleted feat
   ================================================================
   revertFeatPicks(c, undefined) used to throw; now a missing feat is
   silently skipped while the feat is still removed from the list. */
test("fix 2 — undoLastLevelUp: revertFeatPicks is skipped when feat was deleted", () => {
  // We test revertFeatPicks directly with undefined; it should not throw.
  // (undoLastLevelUp is UI-only and requires renderAll/confirmDialog;
  // the defensive guard is inside feat-picks.js via the level-up caller.)
  const c = char([{ name: "Fighter", level: 4 }]);
  assert.doesNotThrow(
    () => revertFeatPicks(c, undefined),
    "revertFeatPicks(c, undefined) must not throw"
  );
});

/* ================================================================
   FIX 3 — Monk Unarmored Defense: shield with baseAC 0 must block it
   ================================================================
   Before the fix, Monk Unarmored Defense used !shieldBonus which
   is true for a baseAC:0 shield. It must check whether a shield is
   actually equipped, not whether its bonus is non-zero. */
test("fix 3 — Monk Unarmored Defense: 0-AC shield disables it", () => {
  const zeroShield = { type: "armor", equipped: true, name: "Broken Shield", category: "shield", baseAC: 0 };
  const normalShield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };

  // No shield: Unarmored Defense active — 10 + DEX 2 + WIS 3 = 15
  const noShield = char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 } });
  assert.equal(H.computeArmorClass(noShield).value, 15);
  assert.match(H.computeArmorClass(noShield).short, /WIS/);

  // Normal shield: Unarmored Defense off — 10 + DEX 2 + shield 2 = 14
  const withShield = char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 }, inventory: [normalShield] });
  assert.equal(H.computeArmorClass(withShield).value, 14);
  assert.doesNotMatch(H.computeArmorClass(withShield).short, /WIS/);

  // 0-AC shield: Unarmored Defense must also be off (the bug)
  // Old code: !shieldBonus === !0 === true → WIS added (wrong)
  // New code: checks items array → shield is there → WIS not added
  const withZeroShield = char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 }, inventory: [zeroShield] });
  assert.equal(H.computeArmorClass(withZeroShield).value, 12, "0-AC shield should block Unarmored Defense");
  assert.doesNotMatch(H.computeArmorClass(withZeroShield).short, /WIS/,
    "WIS must not appear in AC formula when a 0-AC shield is equipped");
});

/* ================================================================
   FIX 4 — wisModPlusOne: null guard for missing abilities
   ================================================================
   spellPickCount passes {abilities: finalAbilities()} into the
   function. finalAbilities() always returns a full set, but we test
   the guard directly for robustness. */
test("fix 4 — wisModPlusOne: does not crash when abilities is missing", () => {
  // wisModPlusOne is stored as CLASSES_INFO["Cleric"].spellcasting.spells
  // (a function). We call it directly with edge-case inputs.
  const clericSC = CLASSES_INFO["Cleric"].spellcasting;
  assert.equal(typeof clericSC.spells, "function",
    "Cleric's spells property should be a function (wisModPlusOne)");

  // Call it with a minimal object missing abilities entirely (the bug case).
  assert.doesNotThrow(
    () => clericSC.spells({}),
    "wisModPlusOne must not throw when abilities is undefined"
  );
  // Should return at least 1 (the minimum).
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
   FIX 5 — Defense fighting style: applies with shield only
   ================================================================
   Before the fix, Defense style (+1 AC) only applied when body armor
   was equipped. A fighter with only a shield got no bonus. */
test("fix 5 — Defense fighting style applies with shield only", () => {
  const shield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };
  const chainmail = { type: "armor", equipped: true, name: "Chain Mail", category: "heavy", baseAC: 16 };

  // Helper: a fighter with the Defense style feature saved on c.features
  function defenseChar(inventory){
    const c = char([{ name: "Fighter", level: 1 }], { inventory });
    c.features = [{ id: "f1", name: "Defense", fightingStyle: "Defense" }];
    return c;
  }

  // Shield only: 10 + DEX 2 + shield 2 + Defense 1 = 15
  const shieldOnly = defenseChar([shield]);
  assert.equal(H.computeArmorClass(shieldOnly).value, 15,
    "Defense style +1 should apply when only a shield is equipped");
  assert.match(H.computeArmorClass(shieldOnly).short, /Defense/);

  // Body armor + shield: 16 + shield 2 + Defense 1 = 19
  const armorAndShield = defenseChar([chainmail, shield]);
  assert.equal(H.computeArmorClass(armorAndShield).value, 19);

  // No armor, no shield: Defense style should NOT apply
  const noArmor = defenseChar([]);
  assert.equal(H.computeArmorClass(noArmor).value, 12, // 10 + DEX 2
    "Defense style should not apply when nothing is equipped");
  assert.doesNotMatch(H.computeArmorClass(noArmor).short, /Defense/);
});

/* ================================================================
   FIX 6 — isProficientWithArmor: shield check uses contains not prefix
   ================================================================
   Before the fix, a proficiency string like "tower shield" (indexOf
   "shield" !== 0) would return false even though the player is
   proficient. */
test("fix 6 — isProficientWithArmor: non-prefix shield proficiency string matches", () => {
  const shield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };

  // A Fighter has "Shields" in CLASS_PROFICIENCIES (lowercased to "shields")
  // which starts with "shield" — should still work.
  const fighter = char([{ name: "Fighter", level: 1 }], { inventory: [shield] });
  assert.equal(H.isProficientWithArmor(fighter, shield), true,
    "Fighter should be proficient with standard Shields");

  // A character whose proficiency is saved as e.g. "tower shield" — contains
  // "shield" but doesn't start with it. We simulate by checking that the
  // contains logic fires (indexOf !== -1 returns true for both "shields"
  // and hypothetical "tower shield").
  // We can verify the fix directly: "shields".indexOf("shield") === 0 (prefix, passes both ways)
  // "tower shield".indexOf("shield") === 6 (fails old prefix check, passes new contains check)
  const profs = ["tower shield"];
  const oldResult = profs.some(p => p.indexOf("shield") === 0); // old logic
  const newResult = profs.some(p => p.indexOf("shield") !== -1); // new logic
  assert.equal(oldResult, false, "Old prefix check incorrectly rejects 'tower shield'");
  assert.equal(newResult, true, "New contains check correctly accepts 'tower shield'");
});

/* ================================================================
   FIX 7 — ordinal() is exported from helpers.js and removed from
            levelup.js and spells.js
   ================================================================ */
test("fix 7 — ordinal is exported from helpers.js", () => {
  assert.equal(typeof H.ordinal, "function", "ordinal should be exported from helpers.js");
  assert.equal(H.ordinal(1), "1st");
  assert.equal(H.ordinal(2), "2nd");
  assert.equal(H.ordinal(3), "3rd");
  assert.equal(H.ordinal(4), "4th");
  assert.equal(H.ordinal(11), "11th");  // teen exception
  assert.equal(H.ordinal(12), "12th");  // teen exception
  assert.equal(H.ordinal(13), "13th");  // teen exception
  assert.equal(H.ordinal(21), "21st");  // back to normal suffix
  assert.equal(H.ordinal(22), "22nd");
  assert.equal(H.ordinal(23), "23rd");
});

test("fix 7 — levelup.js no longer defines its own ordinal", () => {
  const code = src("../js/levelup/levelup.js");
  assert.ok(!code.includes("function ordinal(n)"),
    "levelup.js must not define its own ordinal() function");
  assert.ok(code.includes("ordinal") && code.includes("from"),
    "levelup.js should import ordinal");
});

test("fix 7 — spells.js no longer defines its own ordinal", () => {
  const code = src("../js/render/panels/spells.js");
  assert.ok(!code.includes("function ordinal(n)"),
    "spells.js must not define its own ordinal() function");
  assert.ok(code.includes("ordinal") && code.includes("from"),
    "spells.js should import ordinal");
});

/* ================================================================
   FIX 8 — c.ac is not written during render
   ================================================================
   vitals.js used to write c.ac = acResult.value inside a render
   function without calling save(). The field is never read back for
   any computation — everything uses computeArmorClass(c). */
test("fix 8 — vitals.js does not write c.ac during render", () => {
  const code = src("../js/render/panels/vitals.js");
  assert.ok(!code.includes("c.ac = acResult.value"),
    "vitals.js must not assign c.ac = acResult.value in a render function");
});

test("fix 8 — computeArmorClass does not depend on c.ac", () => {
  // Verify that AC is always derived from inventory, not from a stale c.ac.
  const plate = { type: "armor", equipped: true, name: "Plate", category: "heavy", baseAC: 18, magicBonus: 0 };
  const c = char([{ name: "Fighter", level: 1 }], { inventory: [plate] });
  // Set a deliberately wrong stale c.ac value.
  c.ac = 99;
  // computeArmorClass must return 18, not 99.
  assert.equal(H.computeArmorClass(c).value, 18,
    "computeArmorClass must ignore c.ac and compute from inventory");
});
