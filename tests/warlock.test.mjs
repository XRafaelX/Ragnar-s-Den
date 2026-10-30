/* Class automation Phase 11, the Warlock (2026-10-30): every feature checked
   against the books on 5etools' data, and what the sheet now does with the
   ones that were text only: the pact weapon and its invocations, Hexblade's
   Curse, the Fathomless tentacle, Form of Dread, the Genie's gifts, and the
   rest hooks. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { circleSpellNote } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { COMPANIONS } from "../js/data/companions.js";

const ABIL = { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 };
const SWORD = { id: "s", name: "Longsword", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, magicBonus: 0, damageDice: "1d8", damageType: "Slashing", category: "martial", props: [] };
function lock(sub, lv, extra = {}, entry = {}){
  const c = newCharacter("W");
  c.classes = [Object.assign({ name: "Warlock", subclass: sub, level: lv }, entry)];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra);
  const out = ensureShape(c);
  const r = H.computeSpellSlots(out.classes);
  if(r.pact) out.spellcasting.pact = { max: r.pact.max, slotLevel: r.pact.slotLevel, used: 0 };
  return out;
}
const blade = (...inv) => ({ pactBoon: "Pact of the Blade", invocations: inv.map((n) => ({ id: n, name: n })) });
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const res = (c, key) => H.characterResources(c).find((x) => x.key === key);
const dice = (c, item) => H.warlockHitDice(c, item).map((d) => d.id);

test("only a marked weapon of a Pact of the Blade warlock is a pact weapon", () => {
  const c = lock("The Fiend", 5, {}, blade());
  const item = Object.assign({}, SWORD);
  assert.equal(H.isPactWeapon(c, item), false);
  item.pactWeapon = true;
  assert.equal(H.isPactWeapon(c, item), true);
  assert.equal(H.isMagicWeapon(c, item), true);
  assert.equal(H.isPactWeapon(lock("The Fiend", 5), item), false);
});

test("Improved Pact Weapon: +1, unless it already has a bonus", () => {
  const c = lock("The Fiend", 5, {}, blade("Improved Pact Weapon"));
  const item = Object.assign({}, SWORD, { pactWeapon: true });
  assert.equal(H.pactWeaponBonus(c, item), 1);
  const plain = H.weaponDamageBonus(c, Object.assign({}, SWORD));
  assert.equal(H.weaponDamageBonus(c, item), plain + 1);
  assert.equal(H.pactWeaponBonus(c, Object.assign({}, item, { magicBonus: 1 })), 0);
});

test("Lifedrinker, Eldritch Smite and Thirsting Blade", () => {
  const c = lock("The Fiend", 12, {}, blade("Lifedrinker", "Eldritch Smite", "Thirsting Blade"));
  const item = Object.assign({}, SWORD, { pactWeapon: true });
  const list = H.warlockHitDice(c, item);
  assert.equal(list.find((d) => d.id === "lifedrinker").flat, 4);
  const smite = list.find((d) => d.id === "eldritch_smite");
  assert.equal(smite.qty, 1 + c.spellcasting.pact.slotLevel);
  assert.equal(smite.paySlot.pact, true);
  assert.deepEqual(dice(c, Object.assign({}, SWORD)), []);
  c.spellcasting.pact.used = c.spellcasting.pact.max;
  assert.ok(!dice(c, item).includes("eldritch_smite"));
  assert.equal(H.attacksPerAction(c), 2);
  assert.equal(H.attacksPerAction(lock("The Fiend", 12, {}, blade())), 1);
});

test("Hex Warrior reaches the pact weapon", () => {
  const c = lock("The Hexblade", 5, {}, blade());
  const item = Object.assign({}, SWORD, { pactWeapon: true });
  assert.equal(H.weaponAbility(c, item).mod, 4);
  assert.equal(H.weaponAbility(c, Object.assign({}, SWORD)).mod, -1);
});

test("Hexblade's Curse: damage and a wider critical range, while it's on", () => {
  const c = lock("The Hexblade", 5);
  const before = H.weaponDamageBonus(c, SWORD);
  assert.equal(H.critRange(c, SWORD), 20);
  assert.equal(H.startEffect(c, "hexblades_curse"), true);
  assert.equal(H.weaponDamageBonus(c, SWORD), before + 3);
  assert.equal(H.critRange(c, SWORD), 19);
  assert.equal(H.hexCurseHealing(c), 9);
});

test("the Fiend: Blessing's temporary hit points and a chosen resistance", () => {
  const c = lock("The Fiend", 10);
  assert.equal(H.darkOnesBlessing(c), 14);
  assert.equal(res(c, "Warlock:dark_ones_blessing").max, Infinity);
  c.fiendishResist = "Fire";
  assert.match(H.warlockResistances(c)[0].type, /^fire/);
  assert.deepEqual(H.warlockResistances(lock("The Fiend", 9, { fiendishResist: "Fire" })), []);
});

test("Misty Escape and Entropic Ward give advantage, and an attack uses them up", () => {
  const c = lock("The Archfey", 6);
  H.startEffect(c, "misty_escape");
  assert.equal(H.plainAttackRollMode(c).mode, "adv");
  assert.equal(H.attackEndsEffects(c, true), true);
  assert.equal(H.effectOn(c, "misty_escape"), false);
  const goo = lock("The Great Old One", 6);
  H.startEffect(goo, "entropic_ward");
  assert.equal(H.plainAttackRollMode(goo).mode, "adv");
});

test("features that show their numbers", () => {
  assert.equal(feature(lock("The Archfey", 1), "Fey Presence").dcs[0].chip, "WIS DC 14");
  assert.equal(feature(lock("The Archfey", 14), "Dark Delirium").dcs[0].chip, "WIS DC 17");
  assert.ok(H.raceWards(lock("The Archfey", 10)).conditionImmune.some((w) => w.type === "charmed"));
  assert.match(H.getCharacterSenses(lock("The Great Old One", 1)), /Telepathy 30 ft/);
  assert.ok(H.featureResistances(lock("The Great Old One", 10)).some((r) => r.type === "psychic"));
  assert.ok(H.featureResistances(lock("The Celestial", 6)).some((r) => r.type === "radiant"));
  assert.ok(H.featureResistances(lock("The Fathomless", 6)).some((r) => r.type === "cold"));
  assert.ok(H.advantagesFor(lock("The Undying", 1)).some((a) => a.name === "Among the Dead" && a.when));
  assert.equal(feature(lock("The Genie", 5, {}, { spellChoices: { genieKind: "Efreeti" } }), "Genie's Vessel").dcs[0].chip, "Vessel AC 15, 8 HP");
});

test("Celestial Resilience's temporary hit points at the end of a rest", () => {
  const c = lock("The Celestial", 10);
  assert.deepEqual(H.celestialResilience(c), { self: 14, others: 9 });
  H.resilienceOnRest(c);
  assert.equal(c.hp.temp, 14);
  assert.equal(H.resilienceOnRest(lock("The Celestial", 9)), null);
  assert.match(circleSpellNote(lock("The Celestial", 6), "Fire Bolt"), /Radiant Soul: add 4/);
  assert.equal(circleSpellNote(lock("The Celestial", 5), "Fire Bolt"), "");
});

test("the Fathomless tentacle: 1d8, 2d8 from level 10", () => {
  assert.equal(H.tentacleDice(lock("The Fathomless", 9)), 1);
  assert.equal(H.tentacleDice(lock("The Fathomless", 10)), 2);
  const c = lock("The Fathomless", 1);
  assert.equal(H.startEffect(c, "tentacle_of_the_deeps"), true);
  assert.equal(res(c, "Warlock:tentacle_of_the_deeps").used, 1);
});

test("the Genie: Wrath, resistance, flight and the vessel", () => {
  const c = lock("The Genie", 10, {}, { spellChoices: { genieKind: "Marid" } });
  assert.equal(H.genieDamage(c), "cold");
  const wrath = H.warlockHitDice(c, null).find((d) => d.id === "genies_wrath");
  assert.equal(wrath.flat, 4);
  assert.equal(H.warlockResistances(c)[0].type, "cold");
  assert.ok(H.computeSpeed(c).others.find((o) => o.type === "fly").when);
  H.startEffect(c, "elemental_flight");
  assert.equal(H.computeSpeed(c).others.find((o) => o.type === "fly").when, "");
  assert.equal(H.hitDieHealing(c, 3), 5);
  H.startEffect(c, "bottled_respite");
  assert.equal(H.hitDieHealing(c, 3), 9);
});

test("Limited Wish comes back after 1d4 long rests by itself", () => {
  const c = lock("The Genie", 14);
  const key = "Warlock:limited_wish";
  const n = H.spendForRests(c, key);
  assert.ok(n >= 1 && n <= 4);
  assert.equal(res(c, key).used, 1);
  assert.equal(H.spendForRests(c, key), 0);
  for(let i = 0; i < n - 1; i++) H.restWaitOnLongRest(c);
  assert.equal(res(c, key).used, 1);
  H.restWaitOnLongRest(c);
  assert.equal(res(c, key).used, 0);
});

test("Form of Dread: temporary hit points, frightened and necrotic immunity", () => {
  const c = lock("The Undead", 10, { inventory: [Object.assign({}, SWORD)] });
  assert.equal(H.startEffect(c, "form_of_dread"), true);
  assert.ok(c.hp.temp >= 11 && c.hp.temp <= 20);
  const wards = H.raceWards(c);
  assert.ok(wards.conditionImmune.some((w) => w.type === "frightened"));
  assert.ok(wards.immune.some((w) => w.type === "necrotic"));
  assert.ok(dice(c, SWORD).includes("grave_touched"));
  assert.equal(H.necroticHuskReady(c), true);
  H.endEffect(c, "form_of_dread");
  assert.ok(!dice(c, SWORD).includes("grave_touched"));
});

test("Spirit Projection's resistance and flight", () => {
  const c = lock("The Undead", 14);
  H.startEffect(c, "spirit_projection");
  assert.equal(H.warlockResistances(c)[0].source, "Spirit Projection");
  assert.equal(H.computeSpeed(c).others.find((o) => o.type === "fly").value, 30);
});

test("the rolls that heal, and Tomb of Levistus's row", () => {
  const u = lock("The Undying", 14);
  assert.deepEqual([res(u, "Warlock:defy_death").roll.bonus, res(u, "Warlock:defy_death").roll.heal], [2, true]);
  assert.equal(res(u, "Warlock:indestructible_life").roll.bonus, 14);
  assert.equal(res(lock("The Fiend", 14), "Warlock:hurl_through_hell").roll.qty, 10);
});

test("the Accursed Specter adds your Charisma to its attack", () => {
  const def = COMPANIONS.find((x) => x.id === "accursed_specter");
  const s = def.stats({ lv: 7, mods: { cha: 4 } });
  assert.equal(s.attacks[0].toHit, 8);
  assert.match(s.traits[0].text, /3 temporary hit points/);
});
