/* Short and long rests in core (js/core/rest.js, moved out of the Vitals
   tab's Hit dice & rest card 2026-11-19). These call the rules directly,
   with no page; rest-and-damage.test.mjs drives the same rules through
   the real buttons. The long rest's order matters, so most of these
   check that one step comes before another. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

function char(classes, hp, extra = {}){
  const c = newCharacter("R");
  c.classes = classes;
  c.abilities = { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 18 };
  Object.assign(c, extra);
  ensureShape(c);
  c.hp = Object.assign({ temp: 0 }, hp);
  const r = H.computeSpellSlots(c.classes);
  Object.keys(r.slots).forEach((l) => { c.spellcasting.slots[l].max = r.slots[l]; });
  if(r.pact) c.spellcasting.pact = { max: r.pact.max, slotLevel: r.pact.slotLevel, used: 0 };
  return c;
}
const fighter = (hp, extra) => char([{ name: "Fighter", level: 5 }], hp, extra);

/* ---- Short rest ---- */

test("shortRest: nothing spent, nothing to say", () => {
  const c = fighter({ max: 44, current: 44 });
  const r = H.shortRest(c);
  assert.deepEqual(r, { pactRestored: false, restored: [], ended: [], resilience: null, sorceryPoints: 0, tireless: null });
  assert.equal(H.shortRestNote(r), "Spend hit dice as needed to heal.");
});

test("shortRest: no healing and no hit dice back", () => {
  const c = fighter({ max: 44, current: 20 });
  H.spendHitDie(c, 10);
  H.shortRest(c);
  assert.equal(c.hp.current, 20);
  assert.equal(H.hitDicePools(c)[0].used, 1);
});

test("shortRest: a 2024 barbarian with no rage spent gets none back", () => {
  const c = char([{ name: "Barbarian", level: 5, edition: "2024" }], { max: 55, current: 55 });
  c.rage.used = 0;
  assert.ok(!H.shortRest(c).restored.includes("one use of Rage"));
  assert.equal(c.rage.used, 0);
});

test("shortRestNote: every part, in order", () => {
  assert.equal(H.shortRestNote({ pactRestored: true, restored: ["Second Wind", "Action Surge"], resilience: { self: 14, others: 9 },
    sorceryPoints: 4, ended: ["Bladesong"], tireless: 1 }),
  "Spend hit dice as needed to heal. Pact slots restored. Restored: Second Wind, Action Surge. Celestial Resilience: 14 temporary HP, 9 for up to five creatures." +
    " Sorcerous Restoration: 4 sorcery points. Ended: Bladesong. Tireless: exhaustion down to level 1.");
  assert.equal(H.shortRestNote({ pactRestored: false, restored: [], resilience: null, sorceryPoints: 0, ended: [], tireless: 0 }),
    "Spend hit dice as needed to heal. Tireless: exhaustion down to level 0.", "level 0 is still news");
});

/* ---- Long rest ---- */

test("longRest: what a plain rest gives", () => {
  const c = fighter({ max: 44, current: 10, temp: 5 });
  for(let i = 0; i < 5; i++) H.spendHitDie(c, 10);
  const r = H.longRest(c);
  assert.deepEqual(c.hp, { max: 44, current: 44, temp: 0 });
  assert.equal(r.healed, 34);
  assert.equal(r.recovered, 2, "half of 5");
  assert.deepEqual([r.exhaustion, r.conditionsEnded, r.elixirs, r.tinkered, r.items], [null, [], [], [], { recharged: [], ended: [] }]);
  assert.equal(H.longRestNote(r), "HP and spell slots restored. 2 hit dice recovered.");
});

test("longRest: a level 1 character still gets one hit die back", () => {
  const c = char([{ name: "Fighter", level: 1 }], { max: 12, current: 12 });
  H.spendHitDie(c, 10);
  assert.equal(H.longRest(c).recovered, 1);
});

test("longRest: at full hit points it heals nothing", () => {
  assert.equal(H.longRest(fighter({ max: 44, current: 44 })).healed, 0);
});

test("longRest: exhaustion comes off before the hit points, so a halved maximum is whole again", () => {
  const c = fighter({ max: 44, current: 10 }, { exhaustion: 4 });
  assert.equal(H.maxHp(c), 22);
  const r = H.longRest(c);
  assert.equal(r.exhaustion, 3);
  assert.equal(c.hp.current, 44);
  assert.equal(r.healed, 34);
});

test("longRest: a frenzied rage's exhaustion comes first, then the rest takes a level off", () => {
  const c = char([{ name: "Barbarian", subclass: "Path of the Berserker", level: 3 }], { max: 35, current: 20 }, { exhaustion: 1 });
  H.startRage(c);
  c.rage.frenzy = true;
  const r = H.longRest(c);
  assert.equal(c.rage.active, false);
  assert.equal(r.exhaustion, 1, "1, then 2 from Frenzy, then 1 after the rest");
});

test("longRest: a Wild Shape form ends first, so the healing counts from your own hit points", () => {
  const c = char([{ name: "Druid", subclass: "Circle of the Moon", level: 4 }], { max: 30, current: 12 });
  assert.ok(H.startWildShape(c, "Wolf"));
  assert.equal(c.hp.current, 11, "the wolf's");
  const r = H.longRest(c);
  assert.equal(c.wildShape, undefined);
  assert.equal(r.healed, 18, "12 to 30, not the wolf's 11");
});

test("longRest: only the conditions the player chose to end go", () => {
  const c = fighter({ max: 44, current: 44 });
  H.addCondition(c, "poisoned"); H.addCondition(c, "frightened"); H.addCondition(c, "charmed");
  const r = H.longRest(c, { endConditions: ["poisoned", "charmed"] });
  assert.deepEqual(c.conditions, ["frightened"]);
  assert.deepEqual(r.conditionsEnded, ["Poisoned", "Charmed"]);
  const kept = fighter({ max: 44, current: 44 });
  H.addCondition(kept, "poisoned");
  assert.deepEqual(H.longRest(kept).conditionsEnded, [], "none chosen: none end");
  assert.deepEqual(kept.conditions, ["poisoned"]);
});

test("longRest: Celestial Resilience comes after the temporary hit points clear", () => {
  const c = char([{ name: "Warlock", subclass: "The Celestial", level: 10 }], { max: 63, current: 63, temp: 30 });
  H.longRest(c);
  assert.equal(c.hp.temp, 14, "the old 30 go, then 10 + CHA");
});

test("longRest: Portent's dice are rolled and named", (t) => {
  const c = char([{ name: "Wizard", subclass: "School of Divination", level: 2 }], { max: 14, current: 14 });
  let n = 0; // (after the character: its id is made with Math.random)
  t.mock.method(Math, "random", () => [0.5, 0.95][n++ % 2]);
  const r = H.longRest(c);
  assert.deepEqual(r.foretold, [11, 20]);
  assert.match(H.longRestNote(r), / Portent: 11, 20\.$/);
});

test("longRestNote: every part, in order", () => {
  const r = { recovered: 3, elixirs: ["Healing"], tinkered: ["Rope"], items: { recharged: ["Wand of Fireballs (+4 charges)"], ended: ["Duality (+1 AC)"] },
    omen: "Weal", inspired: true, foretold: [4, 17], exhaustion: 2, conditionsEnded: ["Poisoned"] };
  assert.equal(H.longRestNote(r), "HP and spell slots restored. 3 hit dice recovered. New elixirs: Healing. Tinker's Magic items vanished: Rope." +
    " Recharged: Wand of Fireballs (+4 charges). Ended: Duality (+1 AC). Cosmic Omen: Weal. Resourceful: you have Heroic Inspiration." +
    " Portent: 4, 17. Exhaustion down to level 2 (with food and drink). Conditions ended: Poisoned.");
});
