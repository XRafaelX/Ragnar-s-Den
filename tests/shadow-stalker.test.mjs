/* Spikael's Shadow Stalker rogue subclass, Reaper feat and Scythe
   (2026-11-02, PRIVATE: js/data/shadow-stalker.js): the page's rules as
   the sheet applies them, and hiding them with the rest of his content. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as FP from "../js/core/feat-picks.js";
import { SUBCLASSES } from "../js/data/progression.js";
import { FEATS_CATALOG } from "../js/data/feats.js";
import { WEAPON_DATA, WEAPON_GROUPS } from "../js/data/weapons.js";
import { SHADOW_STALKER, REAPER_FEAT, SCYTHE } from "../js/data/shadow-stalker.js";
import { TOGGLE_EFFECTS } from "../js/data/effects.js";
import { usesPrivateContent, applyPrivateContent } from "../js/core/private-content.js";
import { CREDITS } from "../js/data/credits.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const LONG_DASH = /[–—]/;
function rogue(lv, extra = {}){
  const c = newCharacter("S");
  c.classes = [{ name: "Rogue", subclass: "Shadow Stalker", level: lv }];
  c.abilities = { str: 10, dex: 18, con: 14, int: 12, wis: 14, cha: 10 };
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
function scythe(extra = {}){
  return Object.assign({ name: "Scythe", type: "weapon", damageDice: "1d8", damageType: "Slashing", ability: "str", proficient: true, equipped: true }, extra);
}
const resource = (c, id) => H.characterResources(c).find((r) => r.key === "Rogue:" + id);

test("Shadow Stalker: a rogue subclass with the page's features, plain text", () => {
  assert.ok(SUBCLASSES.Rogue.includes(SHADOW_STALKER));
  const at = (l) => SHADOW_STALKER.features[l].map((f) => f.name);
  assert.deepEqual(at(3), ["Shadow Clones", "Shadow Walk"]);
  assert.deepEqual([9, 13, 17].map((l) => at(l)[0]), ["Encroaching Shadows", "Dark Deceiver", "Living Shadows"]);
  const text = JSON.stringify([SHADOW_STALKER, REAPER_FEAT, SCYTHE]);
  assert.ok(!LONG_DASH.test(text), "no long dashes");
  assert.ok(!/;/.test(text), "no semicolons");
  assert.ok(CREDITS.some((e) => e.label === "Shadow Stalker" && e.private && /Spikael/.test(e.text)));
});

test("Shadow Walk: once per long rest, +10 ft speed, advantage, Sneak Attack rerolls 1s and 2s", () => {
  const c = rogue(3);
  assert.deepEqual([resource(c, "shadow_walk").max, resource(c, "shadow_walk").reset], [1, "long"]);
  assert.equal(H.shadowWalkReroll(c), null, "not a shadow yet");
  const base = H.computeSpeed(c).value;
  assert.ok(TOGGLE_EFFECTS.some((e) => e.id === "shadow_walk"));
  H.startEffect(c, "shadow_walk");
  assert.ok(H.effectOn(c, "shadow_walk"));
  assert.equal(resource(c, "shadow_walk").used, 1, "the use is spent");
  assert.equal(H.computeSpeed(c).value, base + 10);
  assert.ok(H.effectRolls(c, "attack").some((r) => r.mode === "adv" && /Shadow Walk/.test(r.reason)));
  // Each die of 1 or 2 is rolled again (Math.random stubbed to roll 6s).
  const random = Math.random;
  Math.random = () => 0.99;
  try{
    const got = H.shadowWalkReroll(c)({ total: 1 + 2 + 5, values: [1, 2, 5] });
    assert.equal(got.total, 6 + 6 + 5);
    assert.match(got.note, /Shadow Walk: 1 to 6, 2 to 6/);
    assert.equal(H.shadowWalkReroll(c)({ total: 9, values: [4, 5] }), null, "nothing to reroll");
  }finally{ Math.random = random; }
  // Another subclass's rogue has none of it.
  const thief = ensureShape(Object.assign(newCharacter("T"), { classes: [{ name: "Rogue", subclass: "Thief", level: 3 }] }));
  assert.equal(resource(thief, "shadow_walk"), undefined);
});

test("Encroaching Shadows: Inside a wound needs Shadow Walk and ends with it", () => {
  const c = rogue(9);
  assert.equal(H.insideWound(c), false);
  assert.equal(H.startEffect(c, "inside_wound"), false, "only while you are a shadow");
  assert.match(H.characterEffects(c).find((e) => e.def.id === "inside_wound").why, /Shadow Walk/);
  H.startEffect(c, "shadow_walk");
  H.startEffect(c, "inside_wound");
  assert.equal(H.insideWound(c), true);
  H.endEffect(c, "shadow_walk");
  assert.equal(H.insideWound(c), false, "returning from the shadow ends it");
  assert.ok(!H.characterEffects(rogue(8)).some((e) => e.id === "inside_wound"), "from level 9");
});

test("Living Shadows: half the WIS modifier (rounded down, at least 1) per long rest, from level 17", () => {
  assert.equal(H.livingShadows(rogue(16)), null);
  const uses = (wis) => resource(rogue(17, { abilities: { str: 10, dex: 18, con: 14, int: 12, wis, cha: 10 } }), "living_shadows").max;
  assert.deepEqual([8, 12, 14, 18, 20].map(uses), [1, 1, 1, 2, 2]);
  const c = rogue(17);
  assert.equal(H.livingShadows(c), null, "only while a clone is out");
  assert.equal(H.cloneOut(c), false);
  H.startEffect(c, "shadow_clone");
  assert.equal(H.cloneOut(c), true);
  assert.deepEqual(H.livingShadows(c), { key: "Rogue:living_shadows", left: 1 });
  H.endEffect(c, "shadow_clone");
  assert.equal(H.livingShadows(c), null, "destroyed");
  assert.equal(resource(c, "living_shadows").reset, "long");
});

test("Reaper: needs Sneak Attack, gives scythe proficiency, DEX for 1d6, and Sneak Attack", () => {
  assert.ok(FEATS_CATALOG.includes(REAPER_FEAT));
  const reason = (classes) => FP.featRequiresReason(REAPER_FEAT, { race: "Human", level: 4, feats: [], classes });
  assert.match(reason(["Fighter"]), /Sneak Attack/);
  assert.equal(reason(["Fighter", "Rogue"]), "");
  const c = rogue(4);
  assert.equal(H.isProficientWithWeapon(c, "Scythe", "martial"), false, "rogues aren't proficient with martial weapons");
  assert.equal(H.sneakAttackWeapon(scythe(), c), false);
  assert.equal(H.weaponDamageDice(c, scythe()).die, 8);
  assert.deepEqual(H.weaponAbility(c, scythe()).keys, ["str"]);
  c.feats = [{ name: "Reaper" }];
  assert.equal(H.isProficientWithWeapon(c, "Scythe", "martial"), true);
  assert.equal(H.sneakAttackWeapon(scythe(), c), true);
  assert.deepEqual(H.weaponAbility(c, scythe()).keys, ["dex"], "DEX 18 over STR 10");
  assert.equal(H.reaperDex(c, scythe()), true);
  assert.deepEqual(H.weaponDamageDice(c, scythe()), { qty: 1, die: 6, martialArts: false, reaper: true });
  // A magic scythe is still a scythe.
  assert.equal(H.reaperDex(c, scythe({ name: "Scythe, +1", baseWeapon: "Scythe" })), true);
  // With Strength as good or better, the d8 stays.
  c.abilities.str = 18;
  assert.equal(H.reaperDex(c, scythe()), false);
  assert.equal(H.weaponDamageDice(c, scythe()).die, 8);
  // Other weapons are untouched.
  assert.equal(H.sneakAttackWeapon({ type: "weapon", name: "Greatsword", ability: "str" }, c), false);
});

test("Scythe: a 6 lb two-handed martial melee weapon, 1d8 slashing, with its cleave", () => {
  assert.equal(WEAPON_DATA.Scythe, SCYTHE);
  assert.ok(WEAPON_GROUPS["Martial Melee"].includes("Scythe"));
  assert.deepEqual([SCYTHE.damageDice, SCYTHE.damageType, SCYTHE.weight, SCYTHE.category], ["1d8", "Slashing", 6, "martial"]);
  assert.match(SCYTHE.properties, /two-handed/i);
  assert.match(SCYTHE.special, /3 connected 5-foot squares/);
});

test("private: hidden with Spikael's other content, characters using it set aside, all back in place", () => {
  const ch = (extra) => Object.assign(newCharacter("X"), extra);
  assert.equal(usesPrivateContent(ch({ classes: [{ name: "Rogue", subclass: "Shadow Stalker", level: 3 }] })), true);
  assert.equal(usesPrivateContent(ch({ classes: [{ name: "Rogue", subclass: "Thief", level: 3 }] })), false);
  assert.equal(usesPrivateContent(ch({ feats: [{ name: "Reaper" }] })), true);
  assert.equal(usesPrivateContent(ch({ inventory: [scythe()] })), true);
  assert.equal(usesPrivateContent(ch({ inventory: [scythe({ name: "Vorpal Scythe", baseWeapon: "Scythe" })] })), true);
  const before = { subs: SUBCLASSES.Rogue.slice(), feats: FEATS_CATALOG.slice(), melee: WEAPON_GROUPS["Martial Melee"].slice() };
  applyPrivateContent(false);
  assert.ok(!SUBCLASSES.Rogue.includes(SHADOW_STALKER) && SUBCLASSES.Rogue.length === before.subs.length - 1);
  assert.ok(!FEATS_CATALOG.includes(REAPER_FEAT) && FEATS_CATALOG.length === before.feats.length - 1);
  assert.ok(!WEAPON_DATA.Scythe && !WEAPON_GROUPS["Martial Melee"].includes("Scythe"));
  assert.ok(!CREDITS.some((e) => e.label === "Shadow Stalker"));
  applyPrivateContent(false);
  assert.equal(FEATS_CATALOG.length, before.feats.length - 1, "hiding twice changes nothing");
  applyPrivateContent(true);
  assert.deepEqual(SUBCLASSES.Rogue, before.subs);
  assert.deepEqual(FEATS_CATALOG, before.feats);
  assert.deepEqual(WEAPON_GROUPS["Martial Melee"], before.melee);
  assert.equal(WEAPON_DATA.Scythe, SCYTHE);
});
