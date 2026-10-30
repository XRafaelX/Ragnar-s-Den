/* Class automation Phase 12, the Wizard (2026-10-30): every feature checked
   against the books on 5etools' data, and what the sheet now does with the
   ones that were text only: Arcane Recovery's sheet, Overchannel, the Arcane
   Ward, Portent, Grim Harvest, War Magic, the transmuter's stone, Chronal
   Shift, the Graviturgy effects and the notes on spell cards. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { circleSpellNote } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 8, dex: 14, con: 14, int: 18, wis: 12, cha: 10 };
function wiz(sub, lv, extra = {}){
  const c = newCharacter("Z");
  c.classes = [{ name: "Wizard", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 6 * lv, current: 6 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra);
  const out = ensureShape(c);
  const slots = H.computeSpellSlots(out.classes).slots;
  for(let i = 1; i <= 9; i++) out.spellcasting.slots[i].max = slots[i] || 0;
  return out;
}
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const res = (c, key) => H.characterResources(c).find((x) => x.key === key);

test("Arcane Recovery: the book's budget, half the wizard level rounded up", () => {
  assert.equal(H.arcaneRecoveryBudget(wiz("School of Evocation", 4)), 2);
  assert.equal(H.arcaneRecoveryBudget(wiz("School of Evocation", 5)), 3);
  const c = wiz("School of Evocation", 4);
  c.spellcasting.slots[1].used = 2;
  assert.equal(H.recoverSlots(c, { 1: 2 }, H.arcaneRecoveryBudget(c)), true);
  assert.equal(c.spellcasting.slots[1].used, 0);
});

test("Overchannel: free once, then 2d12, 3d12... per spell level", () => {
  const c = wiz("School of Evocation", 14);
  assert.equal(H.overchannelDice(c, 3), 0);
  c.overchannels = 1;
  assert.equal(H.overchannelDice(c, 3), 6);
  c.overchannels = 2;
  assert.equal(H.overchannelDice(c, 3), 9);
  assert.match(circleSpellNote(c, "Fireball"), /Sculpt Spells: up to 4 creatures/);
});

test("the Arcane Ward takes damage first and refills from abjuration spells", () => {
  const c = wiz("School of Abjuration", 6);
  const ward = res(c, "Wizard:arcane_ward");
  assert.equal(ward.max, 16);
  assert.equal(H.wardAbsorb(c, 10), 10, "no ward until it's created");
  c.arcaneWard = true;
  assert.equal(H.wardAbsorb(c, 10), 0);
  assert.equal(H.wardAbsorb(c, 10), 4);
  H.restoreWard(c, 3);
  assert.equal(res(c, "Wizard:arcane_ward").used, 10);
  assert.match(circleSpellNote(c, "Shield"), /Arcane Ward: casting it gives your ward 2/);
  assert.match(circleSpellNote(wiz("School of Abjuration", 10), "Counterspell"), /Improved Abjuration: add 4/);
});

test("Spell Resistance and Inured to Undeath", () => {
  const abj = wiz("School of Abjuration", 14);
  assert.ok(H.featureResistances(abj).some((r) => /spells/.test(r.type)));
  assert.ok(H.advantagesFor(abj).some((a) => a.name === "Spell Resistance" && a.when));
  assert.ok(H.featureResistances(wiz("School of Necromancy", 10)).some((r) => r.type === "necrotic"));
});

test("Portent: two dice, three from 14, each used once", () => {
  const c = wiz("School of Divination", 2);
  assert.equal(H.rollPortent(c).length, 2);
  assert.equal(H.rollPortent(wiz("School of Divination", 14)).length, 3);
  const first = c.portent[0];
  assert.equal(H.usePortent(c, 0), first);
  assert.equal(c.portent.length, 1);
  assert.equal(res(c, "Wizard:portent").used, 1);
  assert.equal(H.rollPortent(wiz("School of Evocation", 2)), null);
});

test("The Third Eye's sights", () => {
  const c = wiz("School of Divination", 10);
  H.startEffect(c, "third_eye", "Darkvision");
  assert.match(H.getCharacterSenses(c), /Darkvision 60 ft/);
  const e = wiz("School of Divination", 10);
  H.startEffect(e, "third_eye", "See Invisibility");
  assert.match(H.getCharacterSenses(e), /See invisibility 10 ft/);
  assert.match(circleSpellNote(c, "Augury"), /Expert Divination/);
  assert.equal(circleSpellNote(c, "Detect Magic"), "");
});

test("Grim Harvest: twice the level, three times for necromancy", () => {
  assert.equal(H.grimHarvest(3, false), 6);
  assert.equal(H.grimHarvest(3, true), 9);
  assert.match(circleSpellNote(wiz("School of Necromancy", 6), "Animate Dead"), /\+6 hit points and \+3/);
});

test("War Magic: Durable Magic's +2, Arcane Deflection's +2 AC, surges on rests", () => {
  const c = wiz("War Magic", 10);
  const ac = H.computeArmorClass(c).value, save = H.computeSave(c, "dex").value;
  H.startEffect(c, "durable_magic");
  assert.equal(H.computeArmorClass(c).value, ac + 2);
  assert.equal(H.computeSave(c, "dex").value, save + 2);
  H.startEffect(c, "arcane_deflection");
  assert.equal(H.computeArmorClass(c).value, ac + 4);
  assert.equal(H.powerSurgeDamage(c), 5);
  assert.equal(H.deflectingShroud(wiz("War Magic", 14)), 7);
  H.surgesOnRest(c, "long", 4);
  assert.equal(res(c, "Wizard:power_surges").used, 3);
  c.resourcesUsed["Wizard:power_surges"] = 4;
  H.surgesOnRest(c, "short", 4);
  assert.equal(res(c, "Wizard:power_surges").used, 3);
  c.resourcesUsed["Wizard:power_surges"] = 2;
  H.surgesOnRest(c, "short", 4);
  assert.equal(res(c, "Wizard:power_surges").used, 2, "a short rest only helps with none left");
});

test("the transmuter's stone: each benefit where it applies", () => {
  const c = wiz("School of Transmutation", 6, { stoneBenefit: "CON saves" });
  assert.equal(H.computeSave(c, "con").prof, true);
  c.stoneBenefit = "Speed";
  assert.equal(H.computeSpeed(c).value, 40);
  c.stoneBenefit = "Fire";
  assert.ok(H.effectResistances(c).some((r) => r.type === "fire"));
  c.stoneBenefit = "Darkvision";
  assert.match(H.getCharacterSenses(c), /Darkvision 60 ft/);
  H.consumeStone(c);
  assert.equal(H.stoneBenefit(c), "");
  assert.equal(H.stoneBenefit(wiz("School of Transmutation", 5, { stoneBenefit: "Fire" })), "");
});

test("features that show their numbers", () => {
  assert.equal(feature(wiz("School of Enchantment", 2), "Hypnotic Gaze").dcs[0].chip, "WIS DC 14");
  assert.equal(feature(wiz("School of Necromancy", 14), "Command Undead").dcs[0].chip, "CHA DC 17");
  assert.equal(feature(wiz("Chronurgy Magic", 6), "Momentary Stasis").dcs[0].chip, "CON DC 15");
  assert.equal(feature(wiz("Graviturgy Magic", 14), "Event Horizon").dcs[0].chip, "STR DC 17");
  assert.ok(H.advantagesFor(wiz("Order of Scribes", 14)).some((a) => a.name === "One with the Word"));
  assert.match(circleSpellNote(wiz("School of Enchantment", 10), "Charm Person"), /Split Enchantment/);
  assert.match(circleSpellNote(wiz("School of Conjuration", 14), "Conjure Animals"), /30 temporary hit points/);
});

test("Event Horizon: a 3rd-level or higher slot pays once the use is gone", () => {
  const c = wiz("Graviturgy Magic", 14);
  c.resourcesUsed = { "Wizard:event_horizon": 1 };
  c.spellcasting.slots[3].used = c.spellcasting.slots[3].max;
  assert.equal(H.startEffect(c, "event_horizon"), true);
  assert.equal(c.spellcasting.slots[4].used, 1);
});

test("Chronal Shift has two uses", () => {
  assert.equal(H.chronalShiftLeft(wiz("Chronurgy Magic", 2)), 2);
  assert.equal(H.chronalShiftLeft(wiz("School of Evocation", 2)), 0);
});
