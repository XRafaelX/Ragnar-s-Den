/* The Remember card on Vitals (2026-11-02): features a new player forgets
   mid-fight, tagged `remind: {when, line}`. Only what the sheet doesn't
   already apply or show elsewhere, written as one plain sentence. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { CLASSES_INFO } from "../js/data/classes.js";
import { CLASS_PROGRESSION, SUBCLASSES } from "../js/data/progression.js";
import { CLASS_RESOURCES, SUBCLASS_RESOURCES } from "../js/data/resources.js";
import { TOGGLE_EFFECTS } from "../js/data/effects.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

// Every feature in the class and subclass data, with where it comes from.
function allFeatures(){
  const out = [];
  for(const [cls, info] of Object.entries(CLASSES_INFO)) for(const f of info.features || []) out.push({ where: cls + " 1", f });
  for(const [cls, p] of Object.entries(CLASS_PROGRESSION)){
    for(const [lv, list] of Object.entries(p.features || {})) for(const f of list) out.push({ where: cls + " " + lv, f });
    for(const v of p.variants || []) for(const [lv, list] of Object.entries(v.features || {})) for(const f of list) out.push({ where: cls + " " + v.name + " " + lv, f });
  }
  for(const [cls, subs] of Object.entries(SUBCLASSES)) for(const s of subs) for(const [lv, list] of Object.entries(s.features || {})) for(const f of list) out.push({ where: s.name + " " + lv, f });
  return out;
}
const resourceNames = new Set([].concat(
  ...Object.values(CLASS_RESOURCES).map((list) => list.map((r) => r.name)),
  ...Object.values(SUBCLASS_RESOURCES).map((bySub) => [].concat(...Object.values(bySub)).map((r) => r.name))));
const effectNames = new Set(TOGGLE_EFFECTS.map((e) => e.name));

test("every reminder is one short, plain sentence with a known group", () => {
  const tagged = allFeatures().filter((x) => x.f.remind);
  assert.ok(tagged.length >= 17, "the rogue's are tagged");
  for(const { where, f } of tagged){
    const { when, line } = f.remind;
    assert.ok(["bonus", "reaction", "always"].includes(when), where + " " + f.name + ": when " + when);
    assert.ok(line && line.length <= 110, where + " " + f.name + ": a short line (" + (line || "").length + ")");
    assert.ok(!/[;·–—]/.test(line), where + " " + f.name + ": no semicolons, dots or long dashes");
    assert.ok(!/\.$/.test(line) && /^[A-Z]/.test(line), where + " " + f.name + ": starts with a capital, no full stop");
  }
});

test("a reminder never repeats what the sheet already shows", () => {
  for(const { where, f } of allFeatures().filter((x) => x.f.remind)){
    for(const k of ["saveNote", "advantage", "skillBonus", "sense", "rollButton"]) assert.ok(!f[k], where + " " + f.name + ": already shown through " + k);
    assert.ok(!resourceNames.has(f.name), where + " " + f.name + ": already a row on Class resources");
    assert.ok(!effectNames.has(f.name), where + " " + f.name + ": already on Active effects");
  }
});

function rogue(sub, lv){
  const c = newCharacter("R");
  c.classes = [{ name: "Rogue", subclass: sub, level: lv }];
  return ensureShape(c);
}
test("a Thief 18's reminders, grouped by when they're used", () => {
  const r = H.characterReminders(rogue("Thief", 18));
  const by = (when) => r.filter((x) => x.when === when).map((x) => x.name);
  assert.deepEqual(by("bonus"), ["Cunning Action", "Fast Hands"]);
  assert.deepEqual(by("reaction"), ["Uncanny Dodge"]);
  assert.deepEqual(by("always"), ["Second-Story Work", "Use Magic Device", "Thief's Reflexes", "Elusive"]);
  assert.match(r.find((x) => x.name === "Uncanny Dodge").source, /Class · Rogue · Lv 5/);
  assert.match(r.find((x) => x.name === "Fast Hands").source, /^Thief · Lv 3/);
  assert.deepEqual(H.characterReminders(rogue("Thief", 1)), [], "nothing to remember at level 1");
  assert.deepEqual(H.REMIND_GROUPS.map((g) => g.when), ["bonus", "reaction", "always"]);
});

test("a multiclass lists each class's reminders once", () => {
  const c = newCharacter("M");
  c.classes = [{ name: "Rogue", subclass: "Mastermind", level: 13 }, { name: "Fighter", subclass: "Champion", level: 2 }];
  const names = H.characterReminders(ensureShape(c)).map((x) => x.name);
  assert.deepEqual(names, ["Cunning Action", "Master of Tactics", "Uncanny Dodge", "Misdirection"], "by level");
});
