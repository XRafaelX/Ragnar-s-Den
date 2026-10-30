/* Class automation Phase 6, the Ranger (2026-10-30): every feature checked
   against the books on 5etools' data, and what the sheet now does with the
   ones that were text only: the extra dice on a hit, the new effects, the
   rolls after an attack or a save, and uses paid with a spell slot. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 10, dex: 18, con: 14, int: 10, wis: 16, cha: 12 };
function ranger(sub, lv, extra = {}, entry = {}){
  const c = newCharacter("R");
  c.classes = [Object.assign({ name: "Ranger", subclass: sub, level: lv }, entry)];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 10 * lv, current: 10 * lv, temp: 0 };
  Object.assign(c, extra);
  const out = ensureShape(c);
  const slots = H.computeSpellSlots(out.classes).slots;
  for(let i = 1; i <= 9; i++) out.spellcasting.slots[i].max = slots[i] || 0;
  return out;
}
const VARIANTS = (...names) => {
  const replaces = { "Favored Foe": "Favored Enemy", "Deft Explorer": "Natural Explorer", "Primal Awareness": "Primeval Awareness", "Nature's Veil": "Hide in Plain Sight" };
  const variants = {};
  names.forEach((n) => { variants[replaces[n]] = n; });
  return { variants };
};
const dice = (c) => H.rangerHitDice(c).map((d) => d.text);
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const resource = (c, key) => H.characterResources(c).find((r) => r.key === key);
const option = (set, name) => ({ options: { [set]: [{ id: "o", name }] } });

test("no ranger, or a plain one: no extra dice", () => {
  assert.deepEqual(H.rangerHitDice(newCharacter("N")), []);
  assert.deepEqual(dice(ranger("Gloom Stalker", 3)), []);
});

test("Hunter: Colossus Slayer's die only with that pick, on unarmed strikes too", () => {
  assert.deepEqual(dice(ranger("Hunter", 3)), []);
  const c = ranger("Hunter", 3, {}, option("huntersPrey", "Colossus Slayer"));
  assert.deepEqual(dice(c), ["Colossus Slayer +1d8"]);
  assert.ok(H.rangerHitDice(c)[0].unarmed);
});

test("dice that grow: Dreadful Strikes, Planar Warrior, Gathered Swarm", () => {
  assert.deepEqual(dice(ranger("Fey Wanderer", 3)), ["Dreadful Strikes +1d4"]);
  assert.deepEqual(dice(ranger("Fey Wanderer", 11)), ["Dreadful Strikes +1d6"]);
  assert.deepEqual(dice(ranger("Horizon Walker", 3)), ["Planar Warrior +1d8"]);
  assert.deepEqual(dice(ranger("Horizon Walker", 11)), ["Planar Warrior +2d8"]);
  assert.deepEqual(dice(ranger("Swarmkeeper", 3)), ["Gathered Swarm +1d6"]);
  assert.deepEqual(dice(ranger("Swarmkeeper", 11)), ["Gathered Swarm +1d8"]);
  assert.ok(!H.rangerHitDice(ranger("Fey Wanderer", 3))[0].unarmed, "a weapon only");
});

test("Slayer's Prey: while it's on, gone with a rest", () => {
  const c = ranger("Monster Slayer", 3);
  assert.deepEqual(dice(c), []);
  assert.ok(H.startEffect(c, "slayers_prey"));
  assert.deepEqual(dice(c), ["Slayer's Prey +1d6"]);
  H.endAllEffects(c);
  assert.deepEqual(dice(c), []);
});

test("Dread Ambusher: speed, an attack and a die on the first turn only", () => {
  const c = ranger("Gloom Stalker", 5);
  const speed = H.computeSpeed(c).value, attacks = H.attacksPerAction(c);
  H.startEffect(c, "dread_ambusher");
  assert.equal(H.computeSpeed(c).value, speed + 10);
  assert.equal(H.attacksPerAction(c), attacks + 1);
  assert.deepEqual(dice(c), ["Dread Ambusher +1d8"]);
  H.endEffect(c, "dread_ambusher");
  assert.equal(H.attacksPerAction(c), attacks);
});

test("Favored Foe: a use to mark, the die by level, only with the Tasha's feature", () => {
  assert.equal(H.favoredFoeDie(ranger("", 1)), 0);
  const foe = (lv) => ranger("", lv, {}, VARIANTS("Favored Foe"));
  assert.deepEqual([1, 6, 14].map((lv) => H.favoredFoeDie(foe(lv))), [4, 6, 8]);
  const c = foe(6);
  assert.deepEqual(dice(c), [], "nothing until a creature is marked");
  assert.ok(H.startEffect(c, "favored_foe"));
  assert.equal(H.resourceLeft(c, "Ranger:favored_foe"), 2);
  assert.deepEqual(dice(c), ["Favored Foe +1d6"]);
});

test("replaced features: the PHB ones go with the Tasha's ones", () => {
  const has = (c, id) => H.characterEffects(c).some((e) => e.def.id === id);
  assert.ok(has(ranger("", 3), "primeval_awareness"));
  assert.ok(!has(ranger("", 3, {}, VARIANTS("Primal Awareness")), "primeval_awareness"));
  assert.ok(has(ranger("", 10), "hide_in_plain_sight"));
  assert.ok(!has(ranger("", 10, {}, VARIANTS("Nature's Veil")), "hide_in_plain_sight"));
});

test("Primeval Awareness: the slot picked pays, a minute per level", () => {
  const c = ranger("", 5);
  assert.ok(H.startEffect(c, "primeval_awareness", 2));
  assert.equal(c.spellcasting.slots[2].used, 1);
  assert.equal(c.effects.primeval_awareness, 2);
  H.endAllEffects(c);
  c.spellcasting.slots[1].used = c.spellcasting.slots[1].max;
  c.spellcasting.slots[2].used = c.spellcasting.slots[2].max;
  assert.equal(H.characterEffects(c).find((e) => e.def.id === "primeval_awareness").why, "No spell slots left.");
});

test("Hide in Plain Sight: +10 Stealth while it's on", () => {
  const c = ranger("", 10);
  const was = H.skillCheck(c, "Stealth").value;
  H.startEffect(c, "hide_in_plain_sight");
  assert.equal(H.skillCheck(c, "Stealth").value, was + 10);
  assert.equal(H.skillCheck(c, "Perception").value, H.skillCheck(ranger("", 10), "Perception").value);
});

test("Multiattack Defense: only with that pick, +4 AC", () => {
  assert.ok(!H.characterEffects(ranger("Hunter", 7)).some((e) => e.def.id === "multiattack_defense"));
  const c = ranger("Hunter", 7, {}, option("defensiveTactics", "Multiattack Defense"));
  const ac = H.computeArmorClass(c).value;
  assert.ok(H.startEffect(c, "multiattack_defense"));
  assert.equal(H.computeArmorClass(c).value, ac + 4);
});

test("Hunter's picks remind you on the saves card", () => {
  const notes = (c) => H.saveNotes(c).map((n) => n.name);
  assert.ok(notes(ranger("Hunter", 7, {}, option("defensiveTactics", "Steel Will"))).includes("Steel Will"));
  assert.ok(notes(ranger("Hunter", 15, {}, option("superiorHuntersDefense", "Evasion"))).includes("Evasion"));
  assert.ok(!notes(ranger("Hunter", 7)).includes("Steel Will"));
});

test("Otherworldly Glamour: +WIS to Charisma checks and skills, nothing else", () => {
  const plain = ranger("Hunter", 3), fey = ranger("Fey Wanderer", 3);
  assert.equal(H.otherworldlyGlamour(fey), 3);
  assert.equal(H.abilityCheck(fey, "cha").value, H.abilityCheck(plain, "cha").value + 3);
  assert.equal(H.skillCheck(fey, "Deception").value, H.skillCheck(plain, "Deception").value + 3);
  assert.equal(H.abilityCheck(fey, "dex").value, H.abilityCheck(plain, "dex").value);
});

test("DCs on the feature cards use the spell save DC", () => {
  assert.equal(feature(ranger("Swarmkeeper", 5), "Gathered Swarm").dcs[0].chip, "STR DC 14");
  assert.equal(feature(ranger("Fey Wanderer", 7), "Beguiling Twist").dcs[0].chip, "WIS DC 14");
  assert.equal(feature(ranger("Monster Slayer", 11), "Magic-User's Nemesis").dcs[0].chip, "WIS DC 15");
  assert.equal(feature(ranger("Drakewarden", 11), "Drake's Breath").dcs[0].chip, "DEX DC 15");
});

test("Tireless: temporary HP as a roll, and a short rest lowers exhaustion", () => {
  const c = ranger("", 10, {}, VARIANTS("Deft Explorer"));
  const r = resource(c, "Ranger:tireless");
  assert.deepEqual([r.roll.die, r.roll.bonus, r.roll.temp], [8, 3, true]);
  c.exhaustion = 2;
  assert.equal(H.tirelessRest(c), 1);
  assert.equal(c.exhaustion, 1);
  const six = ranger("", 10, { exhaustion: 6 }, VARIANTS("Deft Explorer"));
  assert.equal(H.tirelessRest(six), null, "no way back from level 6");
  const plain = ranger("", 10, { exhaustion: 2 });
  assert.equal(H.tirelessRest(plain), null);
});

test("Drake's Breath: 8d6, 10d6 from 15, and a slot pays once it's used", () => {
  assert.equal(resource(ranger("Drakewarden", 11), "Ranger:drakes_breath").roll.qty, 8);
  assert.equal(resource(ranger("Drakewarden", 15), "Ranger:drakes_breath").roll.qty, 10);
  const r = resource(ranger("Drakewarden", 11), "Ranger:drakes_breath");
  assert.equal(r.slotMin, 3);
  assert.equal(resource(ranger("Drakewarden", 3), "Ranger:summon_drake").slotMin, 1);
});

test("spell slots left and spending one, the shared helpers", () => {
  const c = ranger("", 5);
  assert.deepEqual(H.spellSlotsLeft(c).map((s) => [s.level, s.left]), [[1, 4], [2, 2]]);
  H.spendSpellSlot(c, H.spellSlotsLeft(c)[1]);
  assert.equal(c.spellcasting.slots[2].used, 1);
});

test("Drake's resistance: from 7, with an essence chosen, while it has hit points", () => {
  const c = ranger("Drakewarden", 7, { companions: { drake: { choice: "Fire", hp: [40] } } });
  assert.deepEqual(H.drakeResistance(c).map((r) => r.type), ["fire"]);
  assert.deepEqual(H.drakeResistance(ranger("Drakewarden", 5, { companions: { drake: { choice: "Fire", hp: [40] } } })), []);
  assert.deepEqual(H.drakeResistance(ranger("Drakewarden", 7, { companions: { drake: { choice: "Fire", hp: [0] } } })), []);
});

test("Feral Senses: blinded no longer means disadvantage on attacks", () => {
  const c = ranger("", 18, { conditions: ["blinded"] });
  assert.ok(!H.conditionRolls(c, "attack").some((r) => r.reason === "Blinded"));
  assert.ok(H.conditionRolls(ranger("", 17, { conditions: ["blinded"] }), "attack").some((r) => r.reason === "Blinded"));
  assert.match(H.getCharacterSenses(c), /Feral Senses 30 ft/);
});

test("the small ones: Foe Slayer, Stalker's Flurry, Supernatural Defense", () => {
  assert.equal(H.foeSlayer(ranger("", 19)), 0);
  assert.equal(H.foeSlayer(ranger("", 20)), 3);
  assert.ok(!H.hasStalkersFlurry(ranger("Gloom Stalker", 10)));
  assert.ok(H.hasStalkersFlurry(ranger("Gloom Stalker", 11)));
  const m = ranger("Monster Slayer", 7);
  assert.ok(!H.hasSupernaturalDefense(m), "needs a prey marked");
  H.startEffect(m, "slayers_prey");
  assert.ok(H.hasSupernaturalDefense(m));
});

test("Favored Enemy's advantage is a reminder on the skills, not always on", () => {
  const list = H.situationalSkillAdvantages(ranger("", 1));
  assert.ok(list.some((a) => a.name === "Favored Enemy" && a.skills.includes("Survival")));
  assert.equal(H.skillRollMode(ranger("", 1), "Survival").mode, "none");
});

test("book corrections: Beast Master's commands and Bestial Fury", () => {
  const text = (lv, name) => feature(ranger("Beast Master", lv), name).text;
  assert.doesNotMatch(text(3, "Ranger's Companion"), /Disengage, Dodge or Help/);
  assert.doesNotMatch(text(7, "Exceptional Training"), /Dodge/);
  assert.match(text(11, "Bestial Fury"), /Multiattack/);
});
