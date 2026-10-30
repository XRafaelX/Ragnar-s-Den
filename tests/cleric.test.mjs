/* Class automation Phase 7, the Cleric (2026-10-30): every feature checked
   against the books on 5etools' data (the Fate Domain isn't in it and keeps
   its text), and what the sheet now does with the ones that were text
   only: Divine Strike, the Channel Divinity list, Divine Intervention,
   Blessing of the Forge, the domains' effects and the notes on healing
   spells. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { healingNote } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 14, dex: 10, con: 14, int: 10, wis: 18, cha: 12 };
function cleric(sub, lv, extra = {}, entry = {}){
  const c = newCharacter("C");
  c.classes = [Object.assign({ name: "Cleric", subclass: sub, level: lv }, entry)];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  const out = ensureShape(c);
  const slots = H.computeSpellSlots(out.classes).slots;
  for(let i = 1; i <= 9; i++) out.spellcasting.slots[i].max = slots[i] || 0;
  return out;
}
const action = (c, id) => H.clericChannels(c).find((a) => a.id === id);
const names = (c) => H.clericChannels(c).filter((a) => !a.group).map((a) => a.name);
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const resource = (c, key) => H.characterResources(c).find((r) => r.key === key);
const channel = (c) => H.resourceLeft(c, "Cleric:channel_divinity");
const SWORD = (extra = {}) => Object.assign({ id: "s", name: "Mace", type: "weapon", equipped: true, ability: "str", proficient: true, magicBonus: 0, damageDice: "1d6", damageType: "Bludgeoning" }, extra);
const PLATE = { id: "a", name: "Plate", type: "armor", category: "heavy", equipped: true, baseAC: 18, magicBonus: 0 };

test("the DC, and it's on the Channel Divinity row and feature", () => {
  assert.equal(H.clericDc(cleric("Life Domain", 5)), 15);
  assert.equal(resource(cleric("Life Domain", 5), "Cleric:channel_divinity").hint, "Your Channel Divinity save DC is 15.");
  assert.equal(feature(cleric("Life Domain", 5), "Channel Divinity").dcs[0].chip, "WIS DC 15");
  assert.equal(feature(cleric("Life Domain", 6), "Channel Divinity").dcs[0].chip, "WIS DC 15");
});

test("Destroy Undead's challenge rating by level", () => {
  assert.deepEqual([4, 5, 8, 11, 14, 17].map(H.destroyUndeadCr), ["", "1/2", "1", "2", "3", "4"]);
  assert.equal(feature(cleric("Life Domain", 11), "Destroy Undead").dcs[0].chip, "CR 2 or lower");
  assert.match(action(cleric("Life Domain", 8), "Turn Undead").detail, /CR 1 or lower are destroyed/);
  assert.doesNotMatch(action(cleric("Life Domain", 2), "Turn Undead").detail, /destroyed/);
});

test("every domain lists Turn Undead and its own option from 2nd level", () => {
  assert.deepEqual(H.clericChannels(cleric("Life Domain", 1)), []);
  const own = {"Life Domain": "Preserve Life", "Light Domain": "Radiance of the Dawn", "War Domain": "Guided Strike", "Tempest Domain": "Destructive Wrath", "Trickery Domain": "Invoke Duplicity",
    "Nature Domain": "Charm Animals and Plants", "Twilight Domain": "Twilight Sanctuary", "Forge Domain": "Artisan's Blessing", "Order Domain": "Order's Demand", "Peace Domain": "Balm of Peace",
    "Death Domain": "Touch of Death", "Arcana Domain": "Arcane Abjuration", "Grave Domain": "Path to the Grave", "Fate Domain": "Strands of Fate"};
  for(const [sub, name] of Object.entries(own)) assert.deepEqual(names(cleric(sub, 2)), ["Turn Undead", name], sub);
});

test("second options at 6th, and the numbers", () => {
  assert.deepEqual(names(cleric("War Domain", 6)), ["Turn Undead", "Guided Strike", "War God's Blessing"]);
  assert.ok(names(cleric("Trickery Domain", 6)).includes("Cloak of Shadows"));
  assert.ok(names(cleric("Knowledge Domain", 6)).includes("Read Thoughts"));
  const dawn = action(cleric("Light Domain", 5), "Radiance of the Dawn").roll;
  assert.deepEqual([dawn.qty, dawn.die, dawn.bonus], [2, 10, 5]);
  const balm = action(cleric("Peace Domain", 5), "Balm of Peace").roll;
  assert.deepEqual([balm.qty, balm.die, balm.bonus], [2, 6, 4]);
  assert.match(action(cleric("Death Domain", 5), "Touch of Death").detail, /15 extra necrotic/);
  assert.match(action(cleric("Life Domain", 5), "Preserve Life").detail, /up to 25 hit points/);
  assert.match(action(cleric("Arcana Domain", 8), "Arcane Abjuration").detail, /CR 1 or lower, it's banished/);
});

test("using one spends a use, and a second at 6th", () => {
  const c = cleric("Life Domain", 6);
  assert.equal(channel(c), 2);
  assert.ok(H.useChannelAction(c, action(c, "Turn Undead")));
  assert.equal(channel(c), 1);
  H.useChannelAction(c, action(c, "Preserve Life"));
  assert.equal(H.channelProblem(c, action(c, "Turn Undead")), "Used until a rest");
});

test("Knowledge of the Ages: a skill you don't have, proficient while it's on", () => {
  const c = cleric("Knowledge Domain", 5, { skillProfs: { Arcana: { prof: true, expertise: false } } });
  assert.ok(!H.clericChannels(c).some((a) => a.ages === "Arcana"), "not one you already have");
  const was = H.skillCheck(c, "Stealth").value;
  assert.ok(H.useChannelAction(c, action(c, "ages-Stealth")));
  assert.equal(H.skillCheck(c, "Stealth").value, was + 3);
  H.endAllEffects(c);
  assert.equal(H.skillCheck(c, "Stealth").value, was);
});

test("Cloak of Shadows: invisible, and an attack ends it", () => {
  const c = cleric("Trickery Domain", 6, { inventory: [SWORD()] });
  H.useChannelAction(c, action(c, "Cloak of Shadows"));
  assert.equal(H.attackRollMode(c, c.inventory[0]).mode, "adv");
  assert.equal(H.attackEndsEffects(c, true), true);
  assert.ok(!H.effectOn(c, "trickery_cloak"));
});

test("Guided Strike: War's own pool, and a Conquest paladin's still works", () => {
  const c = cleric("War Domain", 2);
  assert.equal(H.guidedStrikePool(c), "Cleric:channel_divinity");
  assert.equal(H.channelProblem(c, action(c, "Guided Strike")), "Offered after an attack roll");
  H.spendChannel(c, H.guidedStrikePool(c));
  assert.equal(H.guidedStrikePool(c), "");
  assert.equal(H.guidedStrikePool(cleric("Life Domain", 2)), "");
});

test("Divine Strike: by domain, doubled at 14, replaced by Blessed Strikes", () => {
  const strike = (sub, lv, entry) => H.clericHitDice(cleric(sub, lv, {}, entry));
  assert.deepEqual(strike("Life Domain", 7), []);
  assert.deepEqual(strike("Light Domain", 8), [], "Potent Spellcasting instead");
  assert.equal(strike("Life Domain", 8)[0].text, "Divine Strike +1d8");
  assert.equal(strike("Life Domain", 14)[0].text, "Divine Strike +2d8");
  assert.equal(strike("Life Domain", 8)[0].label, "Divine Strike (Radiant)");
  assert.equal(strike("Tempest Domain", 8)[0].label, "Divine Strike (Thunder)");
  assert.equal(strike("Death Domain", 8)[0].label, "Divine Strike (Necrotic)");
  assert.equal(strike("War Domain", 8)[0].label, "Divine Strike");
  assert.match(strike("Nature Domain", 8)[0].title, /cold, fire or lightning/);
  assert.deepEqual(strike("Life Domain", 8, { variants: { "Divine Strike": "Blessed Strikes" } }), []);
});

test("the Forge: fire resistance, then immunity, and armor's resistance only in heavy armor", () => {
  assert.ok(H.featureResistances(cleric("Forge Domain", 6)).some((r) => r.type === "fire"));
  assert.ok(H.raceWards(cleric("Forge Domain", 17)).immune.some((r) => r.type === "fire"));
  assert.deepEqual(H.saintResistance(cleric("Forge Domain", 17)), []);
  assert.equal(H.saintResistance(cleric("Forge Domain", 17, { inventory: [PLATE] })).length, 1);
  assert.deepEqual(H.saintResistance(cleric("Forge Domain", 16, { inventory: [PLATE] })), []);
});

test("Blessing of the Forge: +1 until the next long rest, nonmagical items only", () => {
  const mace = SWORD(), c = cleric("Forge Domain", 1, { inventory: [mace, SWORD({ id: "m", name: "Flame Tongue", magic: true })] });
  assert.deepEqual(H.forgeItems(c).map((i) => i.id), ["s"]);
  assert.deepEqual(H.forgeItems(cleric("Life Domain", 1, { inventory: [mace] })), []);
  const at = H.weaponAttackBonus(c, mace), dmg = H.weaponDamageBonus(c, mace);
  H.blessItem(c, mace);
  assert.deepEqual([H.weaponAttackBonus(c, mace), H.weaponDamageBonus(c, mace)], [at + 1, dmg + 1]);
  assert.ok(H.isMagicWeapon(c, mace));
  H.forgeOnLongRest(c);
  assert.equal(H.weaponAttackBonus(c, mace), at);
  assert.equal(c.forgeBlessed, undefined);
});

test("Divine Intervention: a failure comes back with a long rest, a success doesn't", () => {
  const c = cleric("Life Domain", 10);
  c.resourcesUsed["Cleric:divine_intervention"] = 1;
  H.interventionOnLongRest(c);
  assert.equal(c.resourcesUsed["Cleric:divine_intervention"], 1, "it worked: 7 days");
  c.interventionFailed = true;
  H.interventionOnLongRest(c);
  assert.equal(c.resourcesUsed["Cleric:divine_intervention"], 0);
  assert.equal(c.interventionFailed, undefined);
});

test("Wrath of the Storm rolls 2d8, and Eyes of Night can be paid with a slot", () => {
  const r = resource(cleric("Tempest Domain", 1), "Cleric:wrath_of_the_storm");
  assert.deepEqual([r.roll.qty, r.roll.die], [2, 8]);
  assert.match(r.hint, /DEX save DC 14/);
  assert.equal(feature(cleric("Tempest Domain", 1), "Wrath of the Storm").dcs[0].chip, "DEX DC 14");
  assert.equal(resource(cleric("Twilight Domain", 1), "Cleric:eyes_of_night").slotMin, 1);
});

test("Vigilant Blessing: advantage on the next initiative", () => {
  const c = cleric("Twilight Domain", 1);
  assert.equal(H.initiativeRollMode(c).mode, "none");
  H.startEffect(c, "vigilant_blessing");
  assert.equal(H.initiativeRollMode(c).mode, "adv");
});

test("Emboldening Bond and Steps of Night spend their uses", () => {
  const p = cleric("Peace Domain", 5);
  assert.ok(H.startEffect(p, "emboldening_bond"));
  assert.equal(H.resourceLeft(p, "Cleric:emboldening_bond"), 2);
  const t = cleric("Twilight Domain", 6);
  assert.ok(H.startEffect(t, "steps_of_night"));
  assert.equal(H.resourceLeft(t, "Cleric:steps_of_night"), 2);
});

test("resistances on the card", () => {
  assert.ok(H.featureResistances(cleric("War Domain", 17)).some((r) => /nonmagical/.test(r.type)));
});

test("healing spells show what the domain adds", () => {
  assert.equal(healingNote(cleric("Light Domain", 5), "Cure Wounds"), "");
  assert.equal(healingNote(cleric("Life Domain", 5), "Fireball"), "");
  assert.equal(healingNote(cleric("Life Domain", 1), "Cure Wounds"), "Disciple of Life: plus 3 hit points to each creature, and 1 more per slot level above 1st.");
  assert.match(healingNote(cleric("Life Domain", 6), "Cure Wounds"), /Blessed Healer/);
  assert.match(healingNote(cleric("Life Domain", 17), "Cure Wounds"), /Supreme Healing/);
  assert.doesNotMatch(healingNote(cleric("Life Domain", 17), "Heal"), /Supreme Healing/, "no dice to maximise");
  assert.match(healingNote(cleric("Grave Domain", 1), "Healing Word"), /Circle of Mortality/);
});

test("book corrections", () => {
  assert.match(feature(cleric("Grave Domain", 17), "Keeper of Souls").text, /until the start of your next turn/);
  assert.match(feature(cleric("Nature Domain", 1), "Acolyte of Nature").text, /doesn't count against/);
  assert.match(feature(cleric("War Domain", 17), "Avatar of Battle").text, /nonmagical attacks/);
});
