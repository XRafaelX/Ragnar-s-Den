/* Smoke: every class and subclass at every level runs through every sheet
   calculation without throwing, and the results stay in sane ranges. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL } from "../js/data/progression.js";
import * as H from "../js/core/helpers.js";

const AB = { str: 16, dex: 14, con: 14, int: 14, wis: 14, cha: 14 };
const KEYS = ["str", "dex", "con", "int", "wis", "cha"];

for(const [cls, subs] of Object.entries(SUBCLASSES)){
  test(cls + ": every subclass, levels 1 to " + MAX_LEVEL, () => {
    for(const sub of [""].concat(subs.map((s) => s.name))){
      for(let lv = 1; lv <= MAX_LEVEL; lv++){
        const where = cls + " " + lv + (sub ? " (" + sub + ")" : "");
        const entry = { name: cls, level: lv, subclass: lv >= CLASS_PROGRESSION[cls].subclassLevel ? sub : "" };
        const c = { abilities: AB, saveProfs: {}, classes: [entry], inventory: [], feats: [], resourcesUsed: {}, race: "Human" };
        const features = H.classFeatureList(entry);
        assert.ok(features.every((f) => f.level <= lv), where + ": feature above current level");
        assert.equal(new Set(features.map((f) => f.id)).size, features.length, where + ": duplicate feature ids");
        for(const r of H.characterResources(c)) assert.ok(Number.isFinite(r.max) && r.max >= 0, where + ": " + r.name + " max " + r.max);
        const slots = H.computeSpellSlots(c.classes);
        assert.ok(Object.values(slots.slots).every((n) => n >= 0), where + ": negative slots");
        assert.ok(H.computeArmorClass(c).value >= 10, where + ": AC");
        assert.ok(Number.isFinite(H.computeInitiative(c).value), where + ": initiative");
        KEYS.forEach((k) => assert.ok(Number.isFinite(H.computeSave(c, k).value), where + ": " + k + " save"));
        assert.ok(H.classProficiencies(c, 0), where + ": proficiencies");
      }
    }
  });
}

test("multiclass characters up to total level 20", () => {
  const combos = [
    [["Fighter", 11, "Champion"], ["Rogue", 9, "Thief"]],
    [["Paladin", 6, "Oath of Devotion"], ["Sorcerer", 14, "Divine Soul"]],
    [["Warlock", 3, "The Hexblade"], ["Paladin", 17, "Oath of Vengeance"]],
    [["Wizard", 10, "Bladesinging"], ["Cleric", 10, "Knowledge Domain"]]
  ];
  for(const combo of combos){
    const c = { abilities: AB, saveProfs: {}, classes: combo.map(([name, level, subclass]) => ({ name, level, subclass })), inventory: [], feats: [], resourcesUsed: {} };
    assert.equal(H.totalLevel(c), 20);
    assert.ok(H.characterResources(c).length > 0);
    KEYS.forEach((k) => assert.ok(Number.isFinite(H.computeSave(c, k).value)));
    c.classes.forEach((_, i) => assert.ok(H.classProficiencies(c, i)));
  }
});
