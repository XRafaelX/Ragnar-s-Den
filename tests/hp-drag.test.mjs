/* Changing hit points by dragging the HP bar or holding an arrow
   (2026-10-31): the whole bar is the maximum, the change stops at 0 (after
   the Arcane Ward and temp HP) or at full, and the preview counts what
   soaks the damage the way applyDamage does. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { renderVitalsPanel } from "../js/render/panels/vitals.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(hp, extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { classes: [{ name: "Fighter", level: 3 }], hp }, extra);
  return c;
}

test("the whole bar is the hit point maximum", () => {
  const c = char({ max: 40, current: 30, temp: 0 });
  assert.equal(H.hpDragChange(c, -100, 200), -20, "half the bar left: half the maximum");
  assert.equal(H.hpDragChange(c, -116, 200), -23);
  assert.equal(H.hpDragChange(c, 20, 200), 4);
  assert.equal(H.hpDragChange(c, 0, 200), 0);
  assert.equal(H.hpDragChange(c, 50, 0), 0, "no width, no change");
});

test("a drag stops at 0 and at full", () => {
  const c = char({ max: 40, current: 30, temp: 0 });
  assert.equal(H.hpDragChange(c, -400, 200), -30);
  assert.equal(H.hpDragChange(c, 400, 200), 10);
  assert.deepEqual(H.hpChangeLimits(c), { down: 30, up: 10 });
  const full = char({ max: 40, current: 40, temp: 0 });
  assert.equal(H.hpDragChange(full, 100, 200), 0, "nothing to heal at full");
});

test("temp HP soak the damage first, in the limit and the preview", () => {
  const c = char({ max: 40, current: 30, temp: 5 });
  assert.deepEqual(H.hpChangeLimits(c), { down: 35, up: 10 });
  assert.equal(H.hpAfterDamage(c, 3), 30, "the temp HP take all of it");
  assert.equal(H.hpAfterDamage(c, 12), 23);
  assert.equal(H.hpAfterDamage(c, 99), 0);
  assert.equal(c.hp.temp, 5, "the preview takes nothing");
});

test("the Arcane Ward soaks before temp HP, once it is up", () => {
  const c = char({ max: 36, current: 36, temp: 2 }, { classes: [{ name: "Wizard", subclass: "School of Abjuration", level: 6 }],
    abilities: { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 } });
  ensureShape(c);
  assert.equal(H.wardLeft(c), 0, "no ward until it's created");
  c.arcaneWard = true;
  assert.equal(H.wardLeft(c), 16);
  assert.equal(H.hpAfterDamage(c, 20), 34, "16 to the ward, 2 to temp HP, 2 to you");
  assert.equal(H.hpChangeLimits(c).down, 54);
});

test("Wild Shape: the bar is the form's", () => {
  const c = char({ max: 30, current: 12, temp: 0 }, { wildShape: { form: "Wolf", max: 11 } });
  assert.equal(H.hpDragChange(c, -100, 100), -11, "the whole bar is the wolf's 11");
});

test("the HP card still draws, with the number as a slider", (t) => {
  withFakeDom(t, () => {
    assert.ok(renderVitalsPanel(char({ max: 40, current: 23, temp: 4 })));
    assert.ok(renderVitalsPanel(char({ max: 40, current: 0, temp: 0 })), "at 0 HP");
  });
});
