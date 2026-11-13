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

/* Phase 2: subclasses, rated against the others of their class. */
import { SUBCLASS_TIERS, subclassRating } from "../js/data/tier-list-subclasses.js";
import { SUBCLASSES } from "../js/data/progression.js";
import { SHADOW_STALKER } from "../js/data/shadow-stalker.js";

test("every built-in subclass is rated, and every rating is a subclass", () => {
  const missing = [], extra = [];
  for(const [cls, list] of Object.entries(SUBCLASSES)){
    for(const s of list) if(!s.custom && !subclassRating(cls, s.name)) missing.push(cls + ": " + s.name);
  }
  // Spikael's Shadow Stalker counts whether or not the private content has it in the table.
  for(const [cls, rated] of Object.entries(SUBCLASS_TIERS)){
    for(const name of Object.keys(rated)){
      if(!(SUBCLASSES[cls] || []).some((s) => s.name === name) && name !== SHADOW_STALKER.name) extra.push(cls + ": " + name);
    }
  }
  assert.deepEqual(missing, []);
  assert.deepEqual(extra, []);
  assert.ok(subclassRating("Rogue", SHADOW_STALKER.name));
});

test("each subclass rating has one letter per band and a plain reason", () => {
  for(const [cls, rated] of Object.entries(SUBCLASS_TIERS)){
    for(const [name, e] of Object.entries(rated)){
      assert.equal(e.tiers.length, TIER_BANDS.length, cls + ": " + name);
      assert.ok(e.tiers.every((t) => TIER_LETTERS.indexOf(t) !== -1), cls + ": " + name);
      assert.ok(e.why && !/[;–—]/.test(e.why), cls + ": " + name + ": no semicolons or long dashes");
    }
  }
});

test("a 2014 and a 2024 version are rated apart, and custom ones not at all", () => {
  assert.deepEqual(subclassRating("Druid", "Circle of the Moon").tiers, ["S","A","B","A"]);
  assert.deepEqual(subclassRating("Druid", "Circle of the Moon (2024)").tiers, ["A","A","B","B"]);
  assert.equal(subclassRating("Wizard", "School of Made-up Things"), null);
});

/* Role profiles (2026-11-12): what each subclass adds, 0 to 3 per role. */
import { SUBCLASS_ROLES, SUBCLASS_ROLE_KEYS, subclassRoles } from "../js/data/tier-list-subclasses.js";

test("every rated subclass has a role profile, five digits 0 to 3", () => {
  assert.deepEqual(Object.keys(SUBCLASS_TIERS).filter((c) => !SUBCLASS_ROLES[c]), [], "every class profiled");
  for(const [cls, roles] of Object.entries(SUBCLASS_ROLES)){
    assert.deepEqual(Object.keys(SUBCLASS_TIERS[cls]).filter((n) => !roles[n]), [], cls + ": every subclass profiled");
    assert.deepEqual(Object.keys(roles).filter((n) => !SUBCLASS_TIERS[cls][n]), [], cls + ": no profile without a rating");
    for(const [name, digits] of Object.entries(roles)){
      assert.match(digits, new RegExp("^[0-3]{" + SUBCLASS_ROLE_KEYS.length + "}$"), cls + ": " + name);
      assert.ok(/[1-3]/.test(digits), cls + ": " + name + " adds something");
    }
  }
  assert.deepEqual(subclassRoles("Barbarian", "Path of the Ancestral Guardian"), {damage: 1, defense: 1, control: 2, support: 3, utility: 1});
  assert.equal(subclassRoles("Wizard", "School of Made-up Things"), null);
});

/* "Shines when" lines (2026-11-13): only for rated subclasses, plain text. */
import { SUBCLASS_SHINES, subclassShines } from "../js/data/tier-list-subclasses.js";

test("every shines-when line belongs to a rated subclass and reads plainly", () => {
  for(const [cls, lines] of Object.entries(SUBCLASS_SHINES)){
    for(const [name, text] of Object.entries(lines)){
      assert.ok(SUBCLASS_TIERS[cls] && SUBCLASS_TIERS[cls][name], cls + ": " + name + " is rated");
      assert.ok(text.length <= 115 && !/[;\u2013\u2014]/.test(text), cls + ": " + name + ": short, no semicolons or long dashes");
    }
  }
  assert.match(subclassShines("Ranger", "Gloom Stalker"), /darkvision/);
  assert.equal(subclassShines("Wizard", "School of Divination"), "");
});
