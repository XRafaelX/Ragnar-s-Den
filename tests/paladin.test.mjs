/* Class automation Phase 5, the Paladin (2026-10-30): every feature checked
   against the books on 5etools' data, and what the sheet now does with the
   ones that were text only: Divine Smite, Lay on Hands, the Channel
   Divinity list, the auras, and each oath's capstone as an effect. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 18, dex: 10, con: 14, int: 8, wis: 12, cha: 16 };
function paladin(sub, lv, extra = {}){
  const c = newCharacter("P");
  c.classes = [{ name: "Paladin", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 10 * lv, current: 10 * lv, temp: 0 };
  Object.assign(c, extra);
  const out = ensureShape(c);
  const slots = H.computeSpellSlots(out.classes).slots;
  for(let i = 1; i <= 9; i++) out.spellcasting.slots[i].max = slots[i] || 0;
  return out;
}
const SWORD = (extra = {}) => Object.assign({ id: "s", name: "Longsword", type: "weapon", equipped: true, ability: "str", proficient: true, magicBonus: 0, damageDice: "1d8", damageType: "Slashing" }, extra);
const BOW = { id: "b", name: "Longbow", type: "weapon", equipped: true, ability: "dex", proficient: true, magicBonus: 0, damageDice: "1d8", damageType: "Piercing" };
const action = (c, id) => H.channelActions(c).find((a) => a.id === id);
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const channel = (c) => H.resourceLeft(c, "Paladin:channel_divinity");

test("Divine Smite dice: 2d8, +1d8 a level to 5d8, +1d8 for undead to 6d8, doubled on a crit", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((l) => H.smiteDice(l)), [2, 3, 4, 5, 5]);
  assert.deepEqual([1, 4, 5].map((l) => H.smiteDice(l, true)), [3, 6, 6]);
  assert.equal(H.smiteDice(1, false, true), 4);
  assert.equal(H.smiteDice(4, true, true), 12);
});

test("Divine Smite slots: what's left, lowest first, nothing before 2nd level, pact slots count", () => {
  assert.deepEqual(H.smiteSlots(paladin("", 1)), []);
  const c = paladin("Oath of Devotion", 5);
  assert.deepEqual(H.smiteSlots(c).map((s) => [s.level, s.left]), [[1, 4], [2, 2]]);
  H.spendSpellSlot(c, H.smiteSlots(c)[1]);
  assert.equal(c.spellcasting.slots[2].used, 1);
  c.spellcasting.slots[1].used = 4;
  assert.deepEqual(H.smiteSlots(c).map((s) => [s.level, s.left]), [[2, 1]]);
  const multi = paladin("Oath of Devotion", 2);
  multi.classes.push({ name: "Warlock", subclass: "The Fiend", level: 3 });
  multi.spellcasting.pact = { max: 2, used: 0 };
  const pact = H.smiteSlots(multi).find((s) => s.pact);
  assert.deepEqual([pact.level, pact.left], [2, 2]);
  H.spendSpellSlot(multi, pact);
  assert.equal(multi.spellcasting.pact.used, 1);
});

test("Improved Divine Smite from 11th", () => {
  assert.ok(!H.hasImprovedSmite(paladin("", 10)));
  assert.ok(H.hasImprovedSmite(paladin("", 11)));
});

test("Lay on Hands: spends from the pool, never past it", () => {
  const c = paladin("", 3);
  assert.equal(H.resourceLeft(c, "Paladin:lay_on_hands"), 15);
  assert.ok(H.spendLayOnHands(c, 10));
  assert.equal(H.spendLayOnHands(c, 6), false);
  assert.equal(H.resourceLeft(c, "Paladin:lay_on_hands"), 5);
});

test("Channel Divinity: two options per oath, with the DC, for 3rd level and up", () => {
  assert.deepEqual(H.channelActions(paladin("", 2)), []);
  const oaths = ["Oath of Devotion", "Oath of the Ancients", "Oath of Vengeance", "Oath of Conquest", "Oathbreaker", "Oath of Redemption", "Oath of Glory", "Oath of the Crown", "Oath of the Watchers"];
  for(const o of oaths){
    const c = paladin(o, 3, { inventory: [SWORD()] });
    assert.equal(H.channelActions(c).length, 2, o);
  }
  assert.equal(H.paladinDc(paladin("", 5)), 14);
  assert.match(action(paladin("Oath of Devotion", 5), "Turn the Unholy").detail, /WIS save \(DC 14\)/);
  assert.match(action(paladin("Oath of the Ancients", 5), "Nature's Wrath").detail, /STR or DEX save \(its choice, DC 14\)/);
  assert.match(action(paladin("Oathbreaker", 7), "Control Undead").detail, /challenge rating 7 or higher/);
});

test("the Channel Divinity feature shows the DC, except the oath with no save", () => {
  assert.equal(feature(paladin("Oath of Vengeance", 5), "Channel Divinity").dcs[0].chip, "DC 14");
  assert.deepEqual(feature(paladin("Oath of Glory", 5), "Channel Divinity").dcs, []);
  const hint = (c) => H.characterResources(c).find((r) => r.key === "Paladin:channel_divinity").hint;
  assert.equal(hint(paladin("", 5)), "Your Channel Divinity save DC is 14.");
  assert.equal(hint(paladin("Oath of Glory", 5)), "Use one of your Sacred Oath's Channel Divinity options.");
});

test("using it: spent once, then it says why not, back after a rest's reset", () => {
  const c = paladin("Oath of the Crown", 3);
  assert.ok(H.useChannelAction(c, action(c, "Champion Challenge")));
  assert.equal(channel(c), 0);
  assert.equal(H.channelProblem(c, action(c, "Turn the Tide")), "Used until a rest");
  assert.equal(H.useChannelAction(c, action(c, "Turn the Tide")), false);
});

test("Turn the Tide rolls 1d6 + CHA, and Guided Strike and Inspiring Smite wait for their moment", () => {
  const roll = action(paladin("Oath of the Crown", 3), "Turn the Tide").roll;
  assert.deepEqual([roll.qty, roll.die, roll.bonus], [1, 6, 3]);
  const conquest = paladin("Oath of Conquest", 3);
  assert.equal(H.channelProblem(conquest, action(conquest, "Guided Strike")), "Offered after an attack roll");
  assert.ok(H.guidedStrikePool(conquest));
  conquest.resourcesUsed["Paladin:channel_divinity"] = 1;
  assert.ok(!H.guidedStrikePool(conquest));
  const glory = paladin("Oath of Glory", 5);
  assert.equal(H.channelProblem(glory, action(glory, "Inspiring Smite")), "Offered after a Divine Smite");
  assert.equal(H.inspiringSmite(glory).bonus, 5);
});

test("Sacred Weapon: pick a held weapon, +CHA to hit on that one, magical, gone with a rest", () => {
  assert.equal(H.channelProblem(paladin("Oath of Devotion", 3), action(paladin("Oath of Devotion", 3), "sacred")), "Hold a weapon first");
  const sword = SWORD(), bow = BOW;
  const c = paladin("Oath of Devotion", 3, { inventory: [sword, bow] });
  const at = H.weaponAttackBonus(c, sword), dmg = H.weaponDamageBonus(c, sword), other = H.weaponAttackBonus(c, bow);
  assert.ok(!H.isMagicWeapon(c, sword));
  assert.ok(H.useChannelAction(c, action(c, "sacred-s")));
  assert.equal(channel(c), 0);
  assert.equal(H.weaponAttackBonus(c, sword), at + 3);
  assert.equal(H.weaponDamageBonus(c, sword), dmg, "attack rolls only");
  assert.equal(H.weaponAttackBonus(c, bow), other, "only that weapon");
  assert.ok(H.isMagicWeapon(c, sword));
  H.endAllEffects(c);
  assert.equal(H.weaponAttackBonus(c, sword), at);
});

test("Vow of Enmity: advantage on attacks", () => {
  const c = paladin("Oath of Vengeance", 3, { inventory: [SWORD()] });
  H.useChannelAction(c, action(c, "Vow of Enmity"));
  assert.equal(H.attackRollMode(c, c.inventory[0]).mode, "adv");
});

test("Emissary of Peace: +5 Persuasion. Peerless Athlete: advantage on Athletics and Acrobatics", () => {
  const c = paladin("Oath of Redemption", 3);
  const was = H.skillCheck(c, "Persuasion").value;
  H.useChannelAction(c, action(c, "Emissary of Peace"));
  assert.equal(H.skillCheck(c, "Persuasion").value, was + 5);
  const g = paladin("Oath of Glory", 3);
  H.useChannelAction(g, action(g, "Peerless Athlete"));
  assert.equal(H.skillRollMode(g, "Athletics").mode, "adv");
  assert.equal(H.skillRollMode(g, "Acrobatics").mode, "adv");
  assert.equal(H.skillRollMode(g, "Stealth").mode, "none");
});

test("Watcher's Will: advantage on INT, WIS and CHA saves", () => {
  const c = paladin("Oath of the Watchers", 3);
  H.useChannelAction(c, action(c, "Watcher's Will"));
  assert.deepEqual(["int", "wis", "cha", "str"].map((k) => H.saveRollMode(c, k).mode), ["adv", "adv", "adv", "none"]);
});

test("auras: Aura of Protection needs you conscious and shows its range", () => {
  const c = paladin("", 6);
  const up = H.computeSave(c, "dex").value;
  assert.equal(feature(c, "Aura of Protection").dcs[0].chip, "+3 within 10 ft");
  assert.equal(feature(paladin("", 18), "Aura of Protection").dcs[0].chip, "+3 within 30 ft");
  c.hp.current = 0;
  assert.equal(H.computeSave(c, "dex").value, up - 3);
});

test("immunities and resistances land on the HP card's lists", () => {
  assert.ok(H.raceWards(paladin("", 3)).immune.some((r) => r.type === "disease"));
  assert.ok(H.raceWards(paladin("", 10)).conditionImmune.some((r) => r.type === "frightened"));
  assert.ok(H.raceWards(paladin("Oath of Devotion", 7)).conditionImmune.some((r) => r.type === "charmed"));
  assert.ok(H.featureResistances(paladin("Oath of the Ancients", 7)).some((r) => r.type === "damage from spells"));
  assert.ok(H.featureResistances(paladin("Oathbreaker", 15)).some((r) => /nonmagical bludgeoning/.test(r.type)));
  assert.ok(H.featureResistances(paladin("Oath of Redemption", 20)).some((r) => r.type === "damage from other creatures"));
});

test("Aura of Hate: +CHA to melee weapon damage, on weapons and unarmed strikes, not ranged", () => {
  const sword = SWORD();
  const plain = paladin("Oath of Devotion", 7, { inventory: [sword, BOW] });
  const c = paladin("Oathbreaker", 7, { inventory: [sword, BOW] });
  assert.equal(H.weaponDamageBonus(c, sword), H.weaponDamageBonus(plain, sword) + 3);
  assert.equal(H.weaponDamageBonus(c, BOW), H.weaponDamageBonus(plain, BOW));
});

test("chips: the numbers of Aura of Conquest and Scornful Rebuke", () => {
  assert.equal(feature(paladin("Oath of Conquest", 7), "Aura of Conquest").dcs[0].chip, "3 psychic within 10 ft");
  assert.equal(feature(paladin("Oath of Conquest", 18), "Aura of Conquest").dcs[0].chip, "9 psychic within 30 ft");
  assert.equal(feature(paladin("Oath of Conquest", 15), "Scornful Rebuke").dcs[0].chip, "3 psychic");
});

test("Vigilant Rebuke has a roll on its card", () => {
  assert.deepEqual(feature(paladin("Oath of the Watchers", 15), "Vigilant Rebuke").roll, { qty: 2, die: 8, bonus: 3, label: "Vigilant Rebuke (Force)" });
});

test("Protective Spirit: only below half your hit points, 1d6 + half the level", () => {
  const c = paladin("Oath of Redemption", 15);
  assert.equal(H.protectiveSpirit(c, 150), null);
  c.hp.current = 75;
  assert.equal(H.protectiveSpirit(c, 150), null, "exactly half isn't fewer than half");
  c.hp.current = 74;
  assert.equal(H.protectiveSpirit(c, 150).bonus, 7);
  c.hp.current = 0;
  assert.equal(H.protectiveSpirit(c, 150), null);
  assert.equal(H.protectiveSpirit(paladin("Oath of Devotion", 15, { hp: { max: 150, current: 10, temp: 0 } }), 150), null);
});

test("Invincible Conqueror: one more attack, melee crits on 19, resistance to all damage", () => {
  const c = paladin("Oath of Conquest", 20, { inventory: [SWORD(), BOW] });
  assert.deepEqual([H.attacksPerAction(c), H.critRange(c, c.inventory[0])], [2, 20]);
  assert.ok(H.startEffect(c, "invincible_conqueror"));
  assert.equal(H.resourceLeft(c, "Paladin:invincible_conqueror"), 0);
  assert.deepEqual([H.attacksPerAction(c), H.critRange(c, c.inventory[0]), H.critRange(c, c.inventory[1])], [3, 19, 20]);
  assert.ok(H.effectResistances(c).some((r) => r.type === "all damage"));
});

test("Exalted Champion and Mortal Bulwark", () => {
  const c = paladin("Oath of the Crown", 20);
  H.startEffect(c, "exalted_champion");
  assert.equal(H.saveRollMode(c, "wis").mode, "adv");
  assert.ok(H.effectResistances(c).some((r) => /nonmagical/.test(r.type)));
  const w = paladin("Oath of the Watchers", 20);
  assert.ok(!/Truesight/.test(H.getCharacterSenses(w)));
  H.startEffect(w, "mortal_bulwark");
  assert.match(H.getCharacterSenses(w), /Truesight 120 ft/);
});

test("Living Legend: its use, then a 5th-level slot", () => {
  const c = paladin("Oath of Glory", 20);
  assert.ok(H.startEffect(c, "living_legend"));
  assert.ok(H.livingLegendOn(c));
  assert.equal(H.skillRollMode(c, "Persuasion").mode, "adv");
  H.endEffect(c, "living_legend");
  assert.equal(c.spellcasting.slots[5].used, 0);
  assert.ok(H.startEffect(c, "living_legend"), "again, with a slot");
  assert.equal(c.spellcasting.slots[5].used, 1);
  H.endEffect(c, "living_legend");
  c.spellcasting.slots[5].used = c.spellcasting.slots[5].max;
  assert.equal(H.startEffect(c, "living_legend"), false);
});

test("the channel effects stay off the list until they're on", () => {
  const c = paladin("Oath of Vengeance", 3);
  const def = H.characterEffects(c).find((e) => e.def.id === "vow_of_enmity");
  assert.ok(def.def.channel && !def.on);
});
