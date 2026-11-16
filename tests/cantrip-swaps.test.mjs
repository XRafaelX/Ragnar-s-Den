/* Cantrip swaps, checked 2026-10-16; changed 2026-11-16.
   - The artificer ("When you gain a level in this class, you can replace
     one of the artificer cantrips you know with another cantrip from the
     artificer spell list"), Tasha's Versatility features (at a level that
     grants Ability Score Improvement) and the 2024 classes (each level)
     are no longer asked in the level-up: most players skip them, so the
     features say to make the swap on the Spells tab, any time.
   - Blessed / Druidic Warrior: "Whenever you gain a level in this class,
     you can replace one of these cantrips with another" from its list. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as LU from "../js/levelup/session.js";
import { finish, undoLastLevelUp } from "../js/levelup/apply.js";
import { makeStyleFeature } from "../js/core/fighting-styles.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { undoLearn } from "../js/core/spells-known.js";
import { getAllCharacterFeatures } from "../js/core/class-features.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(classes, spells, extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { classes, xp: 355000, hp: { max: 30, current: 30, temp: 0 },
    abilities: { str: 10, dex: 14, con: 14, int: 16, wis: 16, cha: 16 } }, extra);
  c.spells = spells.map((name, i) => ({ id: "s" + i, name, level: 0, prepared: true, learnedBy: classes[0].name }));
  return c;
}
const names = (c) => c.spells.map((s) => s.name);

test("the level-up asks for no cantrip swap: the artificer, Tasha's Versatility, the 2024 cleric", (t) => {
  const artificer = char([{ name: "Artificer", subclass: "Alchemist", level: 3 }], ["Guidance", "Mending"]);
  const cleric = char([{ name: "Cleric", subclass: "Life Domain", level: 7 }], ["Light", "Sacred Flame", "Thaumaturgy", "Guidance"], { tashaOptional: true });
  const cleric2024 = char([{ name: "Cleric", subclass: "Life Domain", level: 4, edition: "2024" }], ["Light", "Sacred Flame", "Thaumaturgy", "Guidance"]);
  for(const c of [artificer, cleric, cleric2024]){
    withFakeDom(t, () => {
      LU.openLevelUp(c);
      assert.equal(LU.currentLearnPlan().cantripSwap, undefined, c.classes[0].name);
      assert.ok(!LU.learnSections().some((s) => s.id === "cantripIn" || s.id === "arcanumIn"));
      assert.equal(LU.stepApplicable("cantrips"), false, "no Cantrips step just for a swap");
      LU.close();
    });
  }
});

test("Tasha's Versatility features say when and where to make the change", () => {
  const feats = (cls, lv, tasha) => {
    const c = ensureShape(char([{ name: cls, subclass: "", level: lv }], [], { tashaOptional: tasha }));
    return getAllCharacterFeatures(c).filter((f) => /Versatility$/.test(f.name));
  };
  for(const [cls, name] of [["Bard", "Bardic Versatility"], ["Cleric", "Cantrip Versatility"], ["Druid", "Cantrip Versatility"], ["Sorcerer", "Sorcerous Versatility"], ["Warlock", "Eldritch Versatility"]]){
    const got = feats(cls, 4, true);
    assert.deepEqual(got.map((f) => f.name), [name], cls);
    assert.match(got[0].text, /Ability Score Improvement \(4, 8, 12, 16 and 19\)/);
    assert.match(got[0].text, /on the Spells tab/);
    assert.equal(feats(cls, 4, false).length, 0, cls + " without Tasha's");
    assert.equal(feats(cls, 3, true).length, 0, cls + " before level 4");
  }
  assert.match(feats("Warlock", 4, true)[0].text, /Pact Boon or an invocation on the Eldritch Invocations card/);
  assert.match(feats("Bard", 4, true)[0].text, /Expertise on the Feature choices card/);
});

test("a cantrip swapped by a level-up before the change still comes back on undo", () => {
  const c = char([{ name: "Artificer", level: 3 }], ["Mending", "Fire Bolt"]);
  const guidance = { id: "g", name: "Guidance", level: 0, prepared: true, learnedBy: "Artificer" };
  undoLearn(c, { className: "Artificer", added: ["Fire Bolt"], prepared: [], swappedOut: null, cantripOut: { spell: guidance, index: 0 } });
  assert.deepEqual(names(c), ["Guidance", "Mending"]);
});

test("Blessed Warrior: a paladin level may swap one of its cantrips; undo swaps it back", (t) => {
  const style = makeStyleFeature("Blessed Warrior", { spells: ["Guidance", "Sacred Flame"] });
  const c = char([{ name: "Paladin", subclass: "Oath of Devotion", level: 3 }], [], { features: [style], tashaOptional: true });
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    assert.ok(LU.stepApplicable("style"), "the Style step shows for it");
    assert.equal(LU.styleCantripOffer().feature, style);
    LU.lu.asi.cha = 2; LU.lu.hpMethod = "avg";
    LU.lu.styleCantripOut = "Guidance";
    assert.equal(LU.validate("style"), "Pick the cleric cantrip that replaces Guidance.");
    LU.lu.styleCantripIn = "Sacred Flame";
    assert.match(LU.validate("style"), /You already have Sacred Flame/);
    LU.lu.styleCantripIn = "Thaumaturgy";
    finish();
  });
  assert.deepEqual(c.features.find((f) => f.id === style.id).picks.spells, ["Thaumaturgy", "Sacred Flame"]);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual(c.features.find((f) => f.id === style.id).picks.spells, ["Guidance", "Sacred Flame"]);
  // A ranger level doesn't change a paladin's Blessed Warrior.
  const multi = char([{ name: "Paladin", subclass: "Oath of Devotion", level: 3 }, { name: "Ranger", level: 2 }], [], { features: [makeStyleFeature("Blessed Warrior", { spells: ["Guidance", "Light"] })] });
  withFakeDom(t, () => { LU.openLevelUp(multi); LU.resetChoicesFor("Ranger"); assert.equal(LU.styleCantripOffer(), null); LU.close(); });
  // Druidic Warrior on a ranger level.
  const ranger = char([{ name: "Ranger", subclass: "Hunter", level: 4 }], [], { features: [makeStyleFeature("Druidic Warrior", { spells: ["Druidcraft", "Shillelagh"] })] });
  withFakeDom(t, () => { LU.openLevelUp(ranger); assert.equal(LU.styleCantripOffer().feature.fightingStyle, "Druidic Warrior"); LU.close(); });
});

/* ---- Bardic and Eldritch Versatility: one thing a level ---- */
test("Cantrip Formulas: a wizard 3 using Tasha's swaps one wizard cantrip after a long rest", async () => {
  const SK = await import("../js/core/spells-known.js");
  const c = char([{ name: "Wizard", subclass: "School of Evocation", level: 3 }], ["Fire Bolt", "Light", "Mage Hand"]);
  assert.equal(SK.cantripFormulas(c), null, "Tasha's off");
  c.tashaOptional = true;
  const cf = SK.cantripFormulas(c);
  assert.deepEqual(cf.known, ["Fire Bolt", "Light", "Mage Hand"]);
  assert.ok(cf.options.includes("Ray of Frost") && !cf.options.includes("Light") && !cf.options.includes("Guidance"), "wizard cantrips not known");
  assert.equal(SK.swapCantripFormula(c, "Light", "Guidance"), false, "not a wizard cantrip");
  assert.ok(SK.swapCantripFormula(c, "Light", "Ray of Frost"));
  assert.deepEqual(names(c), ["Fire Bolt", "Ray of Frost", "Mage Hand"], "in Light's place");
  assert.equal(c.spells[1].learnedBy, "Wizard");
  const low = char([{ name: "Wizard", level: 2 }], ["Fire Bolt"], { tashaOptional: true });
  assert.equal(SK.cantripFormulas(low), null, "not before level 3");
});
