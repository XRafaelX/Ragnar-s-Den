/* Damage, healing and hit dice in core (js/core/hit-points.js, moved out
   of the Vitals tab's HP card 2026-11-19). These call the rules directly,
   with no page; rest-and-damage.test.mjs drives the same rules through
   the real buttons. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

function char(classes, hp, extra = {}){
  const c = newCharacter("T");
  c.classes = classes;
  c.abilities = { str: 14, dex: 14, con: 14, int: 18, wis: 14, cha: 14 };
  Object.assign(c, extra);
  ensureShape(c);
  c.hp = Object.assign({ temp: 0 }, hp);
  return c;
}
const fighter = (hp, extra) => char([{ name: "Fighter", level: 5 }], hp, extra);
const abjurer = (hp) => char([{ name: "Wizard", subclass: "School of Abjuration", level: 6 }], hp, { arcaneWard: true });
const moonDruid = (hp) => { const c = char([{ name: "Druid", subclass: "Circle of the Moon", level: 4 }], hp); assert.ok(H.startWildShape(c, "Wolf")); return c; };
const copy = (c) => JSON.parse(JSON.stringify(c));

/* ---- takeDamage ---- */

test("takeDamage: no damage changes nothing", () => {
  const c = fighter({ max: 44, current: 30, temp: 2 });
  const before = copy(c);
  assert.deepEqual(H.takeDamage(c, 0), { reached: "you", turnedBack: false, carried: 0, wentDown: false });
  H.takeDamage(c, -5);
  assert.deepEqual(c, before);
});

test("takeDamage: temporary hit points first, then you", () => {
  const c = fighter({ max: 44, current: 30, temp: 5 });
  assert.deepEqual(H.takeDamage(c, 3), { reached: "you", turnedBack: false, carried: 0, wentDown: false });
  assert.deepEqual([c.hp.temp, c.hp.current], [2, 30], "the temp HP take all of it");
  H.takeDamage(c, 10);
  assert.deepEqual([c.hp.temp, c.hp.current], [0, 22]);
});

test("takeDamage: the Arcane Ward, then temporary hit points, then you", () => {
  const c = abjurer({ max: 38, current: 38, temp: 2 });
  assert.equal(H.wardLeft(c), 16);
  assert.equal(H.takeDamage(c, 10).reached, "ward", "the ward soaks all of it");
  assert.deepEqual([H.wardLeft(c), c.hp.temp, c.hp.current], [6, 2, 38]);
  assert.equal(H.takeDamage(c, 10).reached, "you");
  assert.deepEqual([H.wardLeft(c), c.hp.temp, c.hp.current], [0, 0, 36], "6 to the ward, 2 to temp HP, 2 to you");
});

test("takeDamage: a Wild Shape form takes it while it holds", () => {
  const c = moonDruid({ max: 30, current: 24 });
  assert.deepEqual(H.takeDamage(c, 5), { reached: "form", turnedBack: false, carried: 0, wentDown: false });
  assert.deepEqual([c.hp.current, c.wildShape.normal], [6, 24], "the wolf's 11 less 5, your own 24 wait");
});

test("takeDamage: what's left after the form drops to 0 carries over to you", () => {
  const c = moonDruid({ max: 30, current: 24 });
  assert.deepEqual(H.takeDamage(c, 15), { reached: "you", turnedBack: true, carried: 4, wentDown: false });
  assert.equal(c.wildShape, undefined);
  assert.equal(c.hp.current, 20, "the wolf's 11, then 4 off your own 24");
  const exact = moonDruid({ max: 30, current: 24 });
  assert.deepEqual(H.takeDamage(exact, 11), { reached: "you", turnedBack: true, carried: 0, wentDown: false });
  assert.equal(exact.hp.current, 24);
});

test("takeDamage: carried-over damage can drop you to 0", () => {
  const c = moonDruid({ max: 30, current: 3 });
  const hit = H.takeDamage(c, 20);
  assert.deepEqual(hit, { reached: "you", turnedBack: true, carried: 9, wentDown: true });
  assert.equal(c.hp.current, 0);
  assert.ok(c.conditions.includes("prone"));
});

test("takeDamage: the 2024 Wild Shape keeps your own hit points, temporary ones on top", () => {
  const c = char([{ name: "Druid", subclass: "Circle of the Land (2024)", level: 4, edition: "2024" }], { max: 30, current: 24 });
  assert.ok(H.startWildShape(c, "Wolf"));
  assert.equal(c.wildShape.own, true);
  const temp = c.hp.temp;
  assert.equal(temp, 4, "the druid level");
  assert.deepEqual(H.takeDamage(c, 6), { reached: "you", turnedBack: false, carried: 0, wentDown: false });
  assert.deepEqual([c.hp.temp, c.hp.current], [0, 22]);
  assert.ok(c.wildShape, "the form doesn't end");
});

test("takeDamage: dropping to 0 resets the death saves, ends the effects and knocks you prone", () => {
  const c = fighter({ max: 44, current: 5 }, { extraTurn: true, sharpen: { bonus: 1 } });
  c.deathSaves = { success: 2, fail: 1 };
  assert.equal(H.takeDamage(c, 50).wentDown, true);
  assert.equal(c.hp.current, 0, "never below 0");
  assert.deepEqual(c.deathSaves, { success: 0, fail: 0 });
  assert.equal(c.extraTurn, undefined);
  assert.equal(c.sharpen, undefined);
  assert.deepEqual(c.conditions, ["prone"]);
});

test("takeDamage: already at 0, more damage isn't a new fall", () => {
  const c = fighter({ max: 44, current: 0 });
  c.deathSaves = { success: 1, fail: 1 };
  assert.equal(H.takeDamage(c, 5).wentDown, false);
  assert.deepEqual(c.deathSaves, { success: 1, fail: 1 }, "the saves go on as they were");
  assert.deepEqual(c.conditions, []);
});

test("takeDamage: Relentless Rage holds the rage at 0", () => {
  const c = char([{ name: "Barbarian", subclass: "Path of the Berserker", level: 11 }], { max: 121, current: 4 });
  H.startRage(c);
  assert.equal(H.takeDamage(c, 4).wentDown, true);
  assert.deepEqual([c.rage.active, c.rage.relentless], [true, true]);
  assert.deepEqual(c.conditions, [], "the effects don't end, so no prone either");
});

/* ---- The drag bar's preview matches the real thing ---- */

test("hpAfterDamage and hpChangeLimits show what takeDamage then does", () => {
  const states = [
    () => fighter({ max: 44, current: 30 }),
    () => fighter({ max: 44, current: 30, temp: 7 }),
    () => abjurer({ max: 38, current: 20, temp: 3 }),
    () => abjurer({ max: 38, current: 38 })
  ];
  states.forEach((make, i) => {
    const down = H.hpChangeLimits(make()).down;
    for(let n = 1; n <= down + 3; n++){
      const c = make(), shown = H.hpAfterDamage(c, n);
      H.takeDamage(c, n);
      assert.equal(c.hp.current, shown, "state " + i + ", " + n + " damage");
      if(n === down) assert.equal(c.hp.current, 0, "state " + i + ": the limit is exactly what drops you to 0");
    }
  });
});

/* ---- healHp ---- */

test("healHp: up to the maximum, never past it", () => {
  const c = fighter({ max: 44, current: 30 });
  H.healHp(c, 10);
  assert.equal(c.hp.current, 40);
  H.healHp(c, 10);
  assert.equal(c.hp.current, 44);
  H.healHp(c, 0); H.healHp(c, -3);
  assert.equal(c.hp.current, 44, "nothing to heal does nothing");
});

test("healHp: exhaustion 4's halved maximum is the cap", () => {
  const c = fighter({ max: 44, current: 10 }, { exhaustion: 4 });
  H.healHp(c, 30);
  assert.equal(c.hp.current, 22);
});

/* ---- spendHitDieToHeal ---- */

test("spendHitDieToHeal: the roll plus CON, one die spent", () => {
  const c = fighter({ max: 44, current: 20 });
  const h = H.spendHitDieToHeal(c, 10, () => 6);
  assert.deepEqual(h, { die: 10, roll: 6, conMod: 2, healed: 8, vessel: 0, durable: false });
  assert.equal(c.hp.current, 28);
  assert.equal(H.hitDicePools(c)[0].used, 1);
});

test("spendHitDieToHeal: at least 1 hit point, and never past the maximum", () => {
  const weak = fighter({ max: 44, current: 20 }, { abilities: { con: 6 } });
  assert.equal(H.spendHitDieToHeal(weak, 10, () => 1).healed, 1, "1 - 2 still heals 1");
  const nearly = fighter({ max: 44, current: 40 });
  H.spendHitDieToHeal(nearly, 10, () => 10);
  assert.equal(nearly.hp.current, 44);
});

test("spendHitDieToHeal: Durable raises a low roll to its minimum", () => {
  const c = fighter({ max: 44, current: 20 }, { feats: [{ name: "Durable" }] });
  assert.deepEqual(H.spendHitDieToHeal(c, 10, () => 1), { die: 10, roll: 1, conMod: 2, healed: 4, vessel: 0, durable: true }, "twice the CON modifier");
  assert.equal(H.spendHitDieToHeal(c, 10, () => 9).durable, false, "a good roll needs no help");
});

test("spendHitDieToHeal: Sanctuary Vessel adds the proficiency bonus once a stay, not once a die", () => {
  // Tasha's, Genie 10: "anyone can add your proficiency bonus to the number
  // of hit points they regain ... if they spend any Hit Dice" there.
  const c = char([{ name: "Warlock", subclass: "The Genie", level: 10 }], { max: 63, current: 10 });
  assert.equal(H.spendHitDieToHeal(c, 8, () => 3).vessel, 0, "not in the vessel: nothing");
  assert.ok(H.startEffect(c, "bottled_respite"));
  assert.deepEqual(H.spendHitDieToHeal(c, 8, () => 3), { die: 8, roll: 3, conMod: 2, healed: 9, vessel: 4, durable: false }, "3 + 2 + 4");
  assert.deepEqual(H.spendHitDieToHeal(c, 8, () => 3), { die: 8, roll: 3, conMod: 2, healed: 5, vessel: 0, durable: false }, "the next die: just 3 + 2");
  assert.ok(H.effectOn(c, "bottled_respite"), "still in the vessel");
  H.longRest(c);
  assert.ok(H.startEffect(c, "bottled_respite"), "a new stay after a long rest");
  assert.equal(H.spendHitDieToHeal(c, 8, () => 3).vessel, 4, "the bonus again");
});

test("spendHitDieToHeal: none of that size left, nothing happens", () => {
  const c = fighter({ max: 44, current: 20 });
  for(let i = 0; i < 5; i++) assert.ok(H.spendHitDieToHeal(c, 10, () => 1));
  assert.equal(H.spendHitDieToHeal(c, 10, () => 1), null);
  assert.equal(H.spendHitDieToHeal(c, 6, () => 1), null, "a fighter has no d6s");
});

test("spendHitDieToHeal: a multiclass character picks the size", () => {
  const c = char([{ name: "Fighter", level: 3 }, { name: "Wizard", level: 2 }], { max: 40, current: 10 });
  assert.equal(H.spendHitDieToHeal(c, 6, () => 4).die, 6);
  const pools = H.hitDicePools(c);
  assert.deepEqual(pools.map((p) => [p.die, p.used]), [[10, 0], [6, 1]]);
});
