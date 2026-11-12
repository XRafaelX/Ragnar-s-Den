/* The secret tier list (2026-11-12): every class rated S to D in each
   band of levels, for the 2014 and the 2024 rules, behind its own switch
   (holding the home screen's centre die). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLASS_TIERS, TIER_LETTERS, TIER_BANDS, classTier } from "../js/data/tier-list.js";
import { tierListOn, setTierList } from "../js/core/tier-list-switch.js";
import { CLASS_LIST } from "../js/data/abilities-skills.js";
import { classHasEdition } from "../js/core/helpers.js";
import { PRIVATE_CLASSES } from "../js/core/private-content.js";

const PUBLIC = CLASS_LIST.filter((n) => PRIVATE_CLASSES.indexOf(n) === -1);

test("every published class is rated under the 2014 rules, and every 2024 class under the 2024 rules", () => {
  assert.deepEqual(PUBLIC.filter((n) => !CLASS_TIERS["2014"][n]), []);
  assert.deepEqual(PUBLIC.filter((n) => classHasEdition(n, "2024") && !CLASS_TIERS["2024"][n]), []);
  // No rating for a class the app doesn't have (the private Gunslinger may be out of CLASS_LIST).
  for(const ed of ["2014", "2024"]) assert.deepEqual(Object.keys(CLASS_TIERS[ed]).filter((n) => CLASS_LIST.indexOf(n) === -1 && PRIVATE_CLASSES.indexOf(n) === -1), []);
  // Spikael's Gunslinger in both.
  assert.deepEqual(CLASS_TIERS["2014"].Gunslinger.tiers, ["B","B","C","C"]);
  assert.deepEqual(CLASS_TIERS["2024"].Gunslinger.tiers, ["B","B","C","C"]);
});

test("each rating has one tier letter per band and a plain reason", () => {
  for(const ed of ["2014", "2024"]){
    for(const [name, e] of Object.entries(CLASS_TIERS[ed])){
      assert.equal(e.tiers.length, TIER_BANDS.length, ed + " " + name);
      assert.ok(e.tiers.every((t) => TIER_LETTERS.indexOf(t) !== -1), ed + " " + name);
      assert.ok(e.why && !/[;–—]/.test(e.why), ed + " " + name + ": no semicolons or long dashes");
    }
  }
});

test("classTier reads one band", () => {
  assert.equal(classTier("2014", "Wizard", "1-4"), "B");
  assert.equal(classTier("2014", "Wizard", "17-20"), "S");
  assert.equal(classTier("2024", "Monk", "5-10"), "B");
  assert.equal(classTier("2014", "Nobody", "1-4"), "");
});

test("the switch starts off and is remembered", () => {
  assert.equal(tierListOn(), false);
  assert.equal(setTierList(true), true);
  assert.equal(tierListOn(), true);
  setTierList(false);
  assert.equal(tierListOn(), false);
});
