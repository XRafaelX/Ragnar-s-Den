/* Conditions and exhaustion (the Vitals tab's Conditions card), checked
   against the Player's Handbook's appendix A on 2026-10-20: what each one
   does to rolls, speed, saves and the hit point maximum, and that the
   sheet works it out by itself. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { CONDITIONS, EXHAUSTION_LEVELS } from "../js/data/conditions.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { renderVitalsPanel } from "../js/render/panels/vitals.js";
import { renderAbilitiesPanel } from "../js/render/panels/abilities.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { classes: [{ name: "Fighter", level: 3 }], hp: { max: 30, current: 30, temp: 0 } }, extra);
  return c;
}
const SWORD = { id: "w", name: "Longsword", type: "weapon", damage: "1d8", equipped: true };

test("data: the fourteen conditions of the book, and six levels of exhaustion", () => {
  assert.deepEqual(CONDITIONS.map((d) => d.name), ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible",
    "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"]);
  assert.deepEqual(EXHAUSTION_LEVELS.map((l) => l.level), [1, 2, 3, 4, 5, 6]);
  for(const d of CONDITIONS){
    assert.ok(d.rules.length && d.short && /^#[0-9a-f]{6}$/.test(d.hue), d.name);
    assert.ok(!/[–—]/.test(d.rules.join(" ") + d.short), d.name + " has no long dashes");
  }
});

test("older saves get no conditions and no exhaustion", () => {
  const c = char();
  delete c.conditions; delete c.exhaustion;
  ensureShape(c);
  assert.deepEqual(c.conditions, []);
  assert.equal(c.exhaustion, 0);
  assert.deepEqual(H.activeConditions(c), []);
});

test("poisoned: disadvantage on attacks and ability checks, not saves", () => {
  const c = char({ conditions: ["poisoned"], inventory: [SWORD] });
  assert.equal(H.attackRollMode(c, SWORD).mode, "dis");
  assert.equal(H.attackRollMode(c, SWORD).reason, "Poisoned");
  assert.equal(H.skillCheck(c, "Athletics").roll.mode, "dis");
  assert.equal(H.checkRollMode(c, "wis").mode, "dis");
  assert.equal(H.initiativeRollMode(c).mode, "dis");
  assert.equal(H.saveRollMode(c, "con").mode, "none");
  assert.equal(H.plainAttackRollMode(c).mode, "dis", "spell attacks too");
});

test("invisible: advantage on attacks; with prone they cancel out", () => {
  const c = char({ conditions: ["invisible"], inventory: [SWORD] });
  assert.equal(H.attackRollMode(c, SWORD).mode, "adv");
  c.conditions.push("prone");
  assert.equal(H.attackRollMode(c, SWORD).mode, "none");
});

test("restrained: speed 0, disadvantage on attacks and DEX saves", () => {
  const c = char({ conditions: ["restrained"], feats: [{ name: "Mobile" }] });
  assert.equal(H.computeSpeed(c).value, 0, "no bonus to speed either");
  assert.equal(H.computeSpeed(c).hindered.zero, "Restrained");
  assert.equal(H.saveRollMode(c, "dex").mode, "dis");
  assert.equal(H.saveRollMode(c, "str").mode, "none");
  assert.equal(H.plainAttackRollMode(c).mode, "dis");
});

test("grappled: speed 0, rolls untouched", () => {
  const c = char({ conditions: ["grappled"] });
  assert.equal(H.computeSpeed(c).value, 0);
  assert.equal(H.plainAttackRollMode(c).mode, "none");
});

test("paralyzed, petrified, stunned, unconscious: STR and DEX saves fail", () => {
  for(const id of ["paralyzed", "petrified", "stunned", "unconscious"]){
    const c = char({ conditions: [id] });
    assert.ok(H.saveAutoFail(c, "str") && H.saveAutoFail(c, "dex"), id);
    assert.equal(H.saveAutoFail(c, "con"), "", id);
    assert.equal(H.computeSpeed(c).value, 0, id + " can't move");
  }
  assert.equal(H.resistsAllDamage(char({ conditions: ["petrified"] })), "Petrified");
  assert.equal(H.resistsAllDamage(char({ conditions: ["stunned"] })), "");
});

test("unconscious knocks you prone; at 0 HP you're unconscious without it being stored", () => {
  const c = char();
  assert.deepEqual(H.addCondition(c, "unconscious"), ["unconscious", "prone"]);
  assert.deepEqual(H.addCondition(c, "unconscious"), [], "a condition doesn't stack");
  const down = char({ hp: { max: 30, current: 0, temp: 0 } });
  assert.deepEqual(H.activeConditions(down).map((x) => [x.def.id, x.auto]), [["unconscious", true]]);
  assert.ok(H.saveAutoFail(down, "dex"));
  down.deathSaves = { success: 0, fail: 3 };
  assert.deepEqual(H.activeConditions(down), [], "not once dead");
});

test("exhaustion: each level adds to the ones below", () => {
  const c = char({ inventory: [SWORD] });
  c.exhaustion = 1;
  assert.equal(H.checkRollMode(c, "str").mode, "dis");
  assert.equal(H.saveRollMode(c, "str").mode, "none");
  assert.equal(H.computeSpeed(c).value, 30);
  c.exhaustion = 2;
  assert.equal(H.computeSpeed(c).value, 15);
  c.exhaustion = 3;
  assert.equal(H.saveRollMode(c, "wis").mode, "dis");
  assert.equal(H.attackRollMode(c, SWORD).mode, "dis");
  assert.equal(H.maxHp(c), 30);
  c.exhaustion = 4;
  assert.equal(H.maxHp(c), 15, "hit point maximum halved");
  assert.equal(H.fullMaxHp(c), 30);
  c.exhaustion = 5;
  assert.equal(H.computeSpeed(c).value, 0);
  assert.equal(H.exhaustionSummary(2), "Disadvantage on checks \u00b7 speed halved");
  assert.equal(H.exhaustionSummary(5), "Disadvantage on checks, attacks and saves \u00b7 speed 0 \u00b7 HP maximum halved");
  assert.equal(H.exhaustionSummary(0), "");
});

test("exhaustion lowers passive scores by 5 (disadvantage on the check)", () => {
  const c = char();
  const before = H.passivePerception(c);
  c.exhaustion = 1;
  assert.equal(H.passivePerception(c), before - 5);
});

test("a long rest takes one level of exhaustion off, never from death", () => {
  const c = char({ exhaustion: 4 });
  assert.equal(H.longRestExhaustion(c), 3);
  assert.equal(H.maxHp(c), 30);
  c.exhaustion = 0;
  assert.equal(H.longRestExhaustion(c), null);
  c.exhaustion = 6;
  assert.equal(H.longRestExhaustion(c), null);
});

test("the Vitals and Abilities panels draw with conditions on", (t) => {
  withFakeDom(t, () => {
    const c = char({ conditions: ["paralyzed", "charmed"], exhaustion: 4 });
    assert.ok(renderVitalsPanel(c));
    assert.ok(renderAbilitiesPanel(c));
    assert.ok(renderVitalsPanel(char({ hp: { max: 30, current: 0, temp: 0 } })), "at 0 HP");
  });
});
