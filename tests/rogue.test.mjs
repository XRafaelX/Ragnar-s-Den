/* Class automation Phase 3, the Rogue (2026-10-30): every feature checked
   against the books on 5etools' data (Misfortune Bringer from Grim Hollow,
   already built from that book), and what the sheet now does with the ones
   that were text only. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 10, dex: 18, con: 14, int: 14, wis: 12, cha: 14 };
function rogue(sub, lv, extra = {}){
  const c = newCharacter("R");
  c.classes = [{ name: "Rogue", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const dcOf = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name).dcs[0].chip;

test("Sneak Attack: dice by level, finesse or ranged weapons, Eye for Weakness", () => {
  assert.deepEqual([1, 5, 11, 20].map((lv) => H.sneakAttack(rogue("Thief", lv)).dice), [1, 3, 6, 10]);
  assert.equal(H.sneakAttack(newCharacter("N")), null);
  assert.equal(H.sneakAttackWeapon({ type: "weapon", name: "Rapier", ability: "finesse" }), true);
  assert.equal(H.sneakAttackWeapon({ type: "weapon", name: "Longbow", ability: "dex" }), true);
  assert.equal(H.sneakAttackWeapon({ type: "weapon", name: "Greatsword", ability: "str" }), false);
  const inq = rogue("Inquisitive", 17);
  assert.equal(H.sneakAttack(inq).dice, 9);
  H.startEffect(inq, "insightful_fighting");
  assert.deepEqual(H.sneakAttack(inq), { dice: 12, eye: 3 }, "+3d6 while Insightful Fighting is on");
});

test("Reliable Talent, Ambush Master, Blindsense, Evasion, Second-Story Work, Supreme Sneak", () => {
  assert.equal(H.reliableTalent(rogue("Thief", 10)), false);
  assert.equal(H.reliableTalent(rogue("Thief", 11)), true);
  assert.equal(H.initiativeRollMode(rogue("Scout", 13)).mode, "adv");
  assert.match(H.getCharacterSenses(rogue("Thief", 14)), /Blindsense 10 ft/);
  assert.deepEqual(H.saveNotes(rogue("Thief", 7)).map((n) => n.name + ":" + n.abilities), ["Evasion:dex"]);
  const monk = ensureShape(Object.assign(newCharacter("M"), { classes: [{ name: "Monk", subclass: "Way of the Open Hand", level: 7 }] }));
  assert.deepEqual(H.saveNotes(monk).map((n) => n.name), ["Evasion"], "a monk's Evasion too");
  assert.ok(H.computeSpeed(rogue("Thief", 3)).others.some((o) => o.type === "climb" && o.value === 30));
  assert.deepEqual(H.situationalSkillAdvantages(rogue("Thief", 9)).map((s) => s.name + ":" + s.skills.join("/")), ["Supreme Sneak:Stealth"]);
  assert.deepEqual(H.situationalSkillAdvantages(rogue("Inquisitive", 9)).map((s) => s.name + ":" + s.skills.join("/")), ["Steady Eye:Perception/Investigation"]);
});

test("save DCs: Death Strike, Spell Thief, Rend Mind, Evil Eye", () => {
  assert.equal(dcOf(rogue("Assassin", 17), "Death Strike"), "CON DC 18");
  assert.equal(dcOf(rogue("Arcane Trickster", 17), "Spell Thief"), "DC 16");
  assert.equal(dcOf(rogue("Soulknife", 17), "Rend Mind"), "WIS DC 18");
  assert.equal(dcOf(rogue("Misfortune Bringer", 3), "Evil Eye"), "CHA DC 12");
});

test("Assassinate, Versatile Trickster, Elegant Maneuver and Ghost Walk as Active effects", () => {
  const dagger = { id: "d", name: "Dagger", type: "weapon", equipped: true, ability: "finesse", proficient: true, damageDice: "1d4", damageType: "Piercing", notes: "" };
  const a = rogue("Assassin", 3, { inventory: [dagger] });
  assert.equal(H.attackRollMode(a, dagger).mode, "none");
  H.startEffect(a, "assassinate");
  assert.deepEqual([H.attackRollMode(a, dagger).mode, H.attackRollMode(a, dagger).reason], ["adv", "Assassinate"]);
  const at = rogue("Arcane Trickster", 13, { inventory: [dagger] });
  H.startEffect(at, "versatile_trickster");
  assert.equal(H.attackRollMode(at, dagger).reason, "Versatile Trickster");
  const sw = rogue("Swashbuckler", 13);
  assert.equal(H.skillCheck(sw, "Acrobatics").roll.mode, "none");
  H.startEffect(sw, "elegant_maneuver");
  assert.equal(H.skillCheck(sw, "Acrobatics").roll.mode, "adv");
  assert.equal(H.skillCheck(sw, "Stealth").roll.mode, "none");
  const ph = rogue("Phantom", 13);
  assert.ok(H.startEffect(ph, "ghost_walk"));
  assert.equal(ph.resourcesUsed["Rogue:ghost_walk"], 1);
});

test("Soulknife: psychic blades and the Psionic Energy die", () => {
  const s = rogue("Soulknife", 11);
  const b = H.psychicBlades(s)[0];
  assert.deepEqual([b.name, b.attack, b.die, b.bonus, b.type, b.ability], ["Psychic blade", 8, 6, 4, "Psychic", "DEX"]);
  assert.deepEqual([H.soulknifeDie(s).die, H.soulknifeDie(s).left], [10, 8]);
  assert.deepEqual(H.psychicBlades(rogue("Thief", 11)), []);
});

test("Phantom: soul trinkets, Wails from the Grave, Whispers of the Dead", () => {
  const p = rogue("Phantom", 9);
  assert.deepEqual(H.soulTrinkets(p), { held: 0, max: 4 });
  assert.equal(H.saveRollMode(p, "con").mode, "none");
  p.soulTrinkets = 2;
  assert.equal(H.saveRollMode(p, "con").mode, "adv", "a soul trinket gives advantage on CON saves");
  const w = H.wailsFromTheGrave(p);
  assert.deepEqual([w.dice, w.both, w.usesLeft, w.trinkets], [3, false, 4, 2], "half of 5d6, rounded up");
  assert.equal(H.wailsFromTheGrave(rogue("Phantom", 17)).both, true, "Death's Friend: both creatures");
  const g = CP.entryGrants(p.classes[0]).find((x) => x.name === "Whispers of the Dead");
  assert.equal(g.def.pick[0].kind, "skillOrTool");
});
