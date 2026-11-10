/* Five gaps closed (2026-11-10): the 2024 patrons' "spend a Pact Magic
   slot to use it again" takes only a pact slot; Lifedrinker (2024) can heal
   with a Hit Point Die; Vex remembers its advantage for the next attack
   roll; the 2024 druid's Known Forms (4, 6, 8) limit Wild Shape. Steps of the
   Fey's effect buttons are in the browser check (class-gaps.mjs). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { knownForms, knownFormsMax, learnForm, forgetForm, wildShapeOptions, wildShapeEligible } from "../js/core/druid.js";

function char(classes, extra = {}){
  const c = newCharacter("G");
  c.classes = classes;
  c.abilities = { str: 10, dex: 14, con: 14, int: 10, wis: 16, cha: 16 };
  c.hp = { max: 40, current: 40, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);

test("the 2024 patrons' reuse takes only a pact slot", () => {
  const fiend = char([{ name: "Warlock", subclass: "Fiend Patron", level: 14, edition: "2024" }]);
  assert.equal(res(fiend, "Hurl Through Hell").pactSlot, true);
  assert.equal(res(char([{ name: "Warlock", subclass: "Archfey Patron", level: 10, edition: "2024" }]), "Beguiling Defenses (Halve Damage)").pactSlot, true);
  assert.equal(res(char([{ name: "Warlock", subclass: "Great Old One Patron", level: 6, edition: "2024" }]), "Clairvoyant Combatant").pactSlot, true);
  // Others keep any slot (Eldritch Cannon).
  assert.ok(!res(char([{ name: "Artificer", subclass: "Artillerist", level: 3 }]), "Eldritch Cannon").pactSlot);
});

test("Lifedrinker (2024) offers its Hit Point Die heal", () => {
  const c = char([{ name: "Warlock", subclass: "", level: 9, edition: "2024", invocations: [{ id: "p", name: "Pact of the Blade", spells: [] }, { id: "l", name: "Lifedrinker (2024)", spells: [] }] }]);
  const sword = { name: "Longsword", type: "weapon", damageDice: "1d8", proficient: true, pactWeapon: true };
  const drink = H.warlockHitDice(c, sword).find((d) => d.id === "lifedrinker");
  assert.ok(drink.hitDieHeal && drink.die === 6);
  // The 2014 Lifedrinker is a flat bonus, no heal.
  const old = char([{ name: "Warlock", subclass: "", level: 12, pactBoon: "Pact of the Blade", invocations: [{ id: "l", name: "Lifedrinker", spells: [] }] }]);
  const flat = H.warlockHitDice(old, sword).find((d) => d.id === "lifedrinker");
  assert.ok(flat.flat && !flat.hitDieHeal);
});

test("Vex: advantage on the next attack roll, then it's used", () => {
  const c = char([{ name: "Fighter", subclass: "", level: 3, edition: "2024" }]);
  assert.ok(!H.characterEffects(c).some((e) => e.def.id === "vex"), "not on the card until a hit readies it");
  H.readyVex(c);
  assert.ok(H.characterEffects(c).some((e) => e.def.id === "vex" && e.on));
  assert.deepEqual(H.effectRolls(c, "attack").map((r) => r.reason), ["Vex"]);
  assert.equal(H.effectRolls(c, "save", "dex").length, 0);
  assert.equal(H.useVex(c), true);
  assert.equal(H.useVex(c), false);
  assert.equal(H.effectRolls(c, "attack").length, 0);
});

test("the 2024 druid's Known Forms: 4, 6, 8, and only those once chosen", () => {
  const d = (lv, sub = "") => char([{ name: "Druid", subclass: sub, level: lv, edition: "2024" }]);
  assert.deepEqual([1, 2, 4, 8, 20].map((lv) => knownFormsMax(d(lv))), [0, 4, 6, 8, 8]);
  const c = d(4);
  assert.deepEqual(knownForms(c), []);
  assert.equal(wildShapeOptions(c).length, wildShapeEligible(c).length, "none chosen: every eligible form");
  assert.ok(learnForm(c, "Wolf") && learnForm(c, "Rat"));
  assert.ok(!learnForm(c, "Wolf"), "not twice");
  assert.ok(!learnForm(c, "Giant Eagle"), "not one the level doesn't allow (flying, CR 1)");
  assert.deepEqual(wildShapeOptions(c).map((f) => f.name).sort(), ["Rat", "Wolf"]);
  ["Spider", "Riding Horse", "Cat", "Frog"].forEach((n) => learnForm(c, n));
  assert.equal(knownForms(c).length, 6);
  assert.ok(!learnForm(c, "Jackal"), "six at level 4");
  forgetForm(c, "Frog");
  assert.ok(learnForm(c, "Jackal"), "a swap");
  assert.equal(H.wildShapeProblem(c, "Mastiff"), "Not one of your forms yet.");
  // A 2014 druid keeps every eligible form.
  const old = char([{ name: "Druid", subclass: "", level: 4 }]);
  assert.equal(knownFormsMax(old), 0);
  assert.ok(!learnForm(old, "Wolf"));
  assert.equal(wildShapeOptions(old).length, wildShapeEligible(old).length);
});
