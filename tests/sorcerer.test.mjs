/* Class automation Phase 10, the Sorcerer (2026-10-30): every feature checked
   against the books on 5etools' data, and what the sheet now does with the
   ones that were text only: sorcery points' list, Font of Magic, Metamagic,
   the Wild Magic table, Tides of Chaos, Trance of Order, Bastion of Law,
   Revelation in Flesh, the Lunar phases and the origins' effects. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { circleSpellNote, healingNote } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { WILD_SURGE } from "../js/data/wild-surge.js";
import { SUBCLASSES } from "../js/data/progression.js";
import { COMPANIONS } from "../js/data/companions.js";

const ABIL = { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 18 };
const POINTS = "Sorcerer:sorcery_points";
function sorc(sub, lv, extra = {}, entry = {}){
  const c = newCharacter("S");
  c.classes = [Object.assign({ name: "Sorcerer", subclass: sub, level: lv }, entry)];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 6 * lv, current: 6 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra);
  const out = ensureShape(c);
  const slots = H.computeSpellSlots(out.classes).slots;
  for(let i = 1; i <= 9; i++) out.spellcasting.slots[i].max = slots[i] || 0;
  return out;
}
const meta = (...names) => ({ options: { metamagic: names.map((n) => ({ id: n, name: n })) } });
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const res = (c, key) => H.characterResources(c).find((x) => x.key === key);
const act = (c, id, key = POINTS) => H.sorceryActions(c, key).find((a) => a.id === id);

test("Font of Magic: the book's slot costs, up to 5th level", () => {
  const c = sorc("Wild Magic", 9);
  assert.deepEqual([1, 2, 3, 4, 5].map((l) => act(c, "make" + l).cost), [2, 3, 5, 6, 7]);
  assert.equal(act(c, "make6"), undefined);
  assert.equal(H.payForSorcery(c, act(c, "make2"), POINTS), true);
  assert.equal(res(c, POINTS).used, 3);
  assert.equal(c.spellcasting.slots[2].max, 4);
  assert.equal(c.spellcasting.slots[2].font, 1);
  H.fontOnLongRest(c);
  assert.equal(c.spellcasting.slots[2].max, 3);
  assert.equal(c.spellcasting.slots[2].font, undefined);
});

test("a slot turns into points equal to its level, never past the maximum", () => {
  const c = sorc("Wild Magic", 5);
  assert.equal(H.sorceryProblem(c, act(c, "burn2"), POINTS), "Already full");
  c.resourcesUsed = { [POINTS]: 4 };
  assert.equal(H.payForSorcery(c, act(c, "burn2"), POINTS), true);
  assert.equal(res(c, POINTS).used, 2);
  assert.equal(c.spellcasting.slots[2].used, 1);
});

test("too few points stops the spend", () => {
  const c = sorc("Wild Magic", 2);
  assert.equal(H.sorceryProblem(c, act(c, "make2"), POINTS), "Not enough points");
  assert.equal(H.payForSorcery(c, act(c, "make2"), POINTS), false);
  assert.equal(res(c, POINTS).used, 0);
});

test("Sorcerous Restoration gives 4 back at level 20", () => {
  const c = sorc("Wild Magic", 20);
  c.resourcesUsed = { [POINTS]: 6 };
  assert.equal(H.sorcerousRestoration(c), 4);
  assert.equal(res(c, POINTS).used, 2);
  assert.equal(H.sorcerousRestoration(c), 2);
  const low = sorc("Wild Magic", 19);
  low.resourcesUsed = { [POINTS]: 6 };
  assert.equal(H.sorcerousRestoration(low), 0);
});

test("the Metamagic you know is on the list, Twinned by the spell's level", () => {
  const c = sorc("Wild Magic", 5, {}, meta("Quickened Spell", "Twinned Spell"));
  assert.equal(act(c, "Quickened Spell").cost, 2);
  assert.equal(act(c, "Subtle Spell"), undefined);
  assert.equal(act(c, "twin0").cost, 1);
  assert.equal(act(c, "twin3").cost, 3);
  assert.equal(act(c, "twin4"), undefined);
});

test("Lunar Boons takes 1 point off the next Metamagic", () => {
  const c = sorc("Lunar Sorcery", 6, { lunarPhase: "Full Moon" }, meta("Quickened Spell"));
  assert.equal(H.payForSorcery(c, act(c, "lunar_boon"), POINTS), true);
  assert.equal(res(c, "Sorcerer:lunar_boons").used, 1);
  assert.equal(act(c, "Quickened Spell").cost, 1);
  assert.equal(H.payForSorcery(c, act(c, "Quickened Spell"), POINTS), true);
  assert.equal(c.lunarDiscount, undefined);
  assert.equal(act(c, "Quickened Spell").cost, 2);
});

test("each origin's own ways to spend", () => {
  assert.equal(act(sorc("Wild Magic", 6), "bend_luck").cost, 2);
  assert.equal(act(sorc("Wild Magic", 5), "bend_luck"), undefined);
  assert.equal(act(sorc("Clockwork Soul", 6), "bastion5").cost, 5);
  assert.equal(act(sorc("Divine Soul", 6), "empowered_healing").cost, 1);
  assert.equal(act(sorc("Shadow Magic", 3), "darkness").cost, 2);
  assert.equal(act(sorc("Shadow Magic", 6), "hound").cost, 3);
  const mind = sorc("Aberrant Mind", 6);
  assert.equal(act(mind, "psionic:Calm Emotions").cost, 2);
  assert.equal(act(mind, "psionic:Mind Sliver"), undefined, "a cantrip isn't a spell of 1st level or higher");
});

test("Metamagic Adept's points only pay for Metamagic", () => {
  const list = H.sorceryActions(sorc("Wild Magic", 5, {}, meta("Subtle Spell")), "feat:sorcery_points");
  assert.deepEqual(list.map((a) => a.group), ["Metamagic"]);
});

test("the Wild Magic table: fifty entries, two numbers each", () => {
  assert.equal(WILD_SURGE.length, 50);
  assert.equal(H.surgeEntry(1), WILD_SURGE[0]);
  assert.equal(H.surgeEntry(2), WILD_SURGE[0]);
  assert.equal(H.surgeEntry(3), WILD_SURGE[1]);
  assert.equal(H.surgeEntry(100).apply, "points");
  assert.equal(H.surgeEntry(39).apply, "heal");
  assert.equal(H.surgeEntry(59).apply, "slot");
});

test("Tides of Chaos: advantage on the next d20, and the table gives it back", () => {
  const c = sorc("Wild Magic", 1);
  assert.equal(H.startEffect(c, "tides_of_chaos"), true);
  assert.equal(H.plainAttackRollMode(c).mode, "adv");
  assert.equal(H.skillCheck(c, "Arcana").roll.mode, "adv");
  assert.equal(H.saveRollMode(c, "dex").mode, "adv");
  assert.equal(H.useTides(c), true);
  assert.equal(H.plainAttackRollMode(c).mode, "none");
  assert.equal(res(c, "Sorcerer:tides_of_chaos").used, 1);
  H.regainTides(c);
  assert.equal(res(c, "Sorcerer:tides_of_chaos").used, 0);
  assert.equal(H.regainLowestSlot(c), 0);
});

test("Trance of Order pays with a use, then 5 points", () => {
  const c = sorc("Clockwork Soul", 14);
  assert.equal(H.startEffect(c, "trance_of_order"), true);
  assert.equal(H.tranceOn(c), true);
  H.endEffect(c, "trance_of_order");
  assert.equal(H.startEffect(c, "trance_of_order"), true);
  assert.equal(res(c, POINTS).used, 5);
});

test("Bastion of Law keeps its dice through a short rest and a fall", () => {
  const c = sorc("Clockwork Soul", 6);
  H.payForSorcery(c, act(c, "bastion4"), POINTS);
  assert.equal(H.bastionDice(c), 4);
  H.endAllEffects(c, "short");
  assert.equal(H.bastionDice(c), 4);
  H.endAllEffects(c, true);
  assert.equal(H.bastionDice(c), 4);
  H.endAllEffects(c);
  assert.equal(H.bastionDice(c), 0);
});

test("wings and transformations turn their speeds on", () => {
  const dragon = sorc("Draconic Bloodline", 14);
  assert.ok(H.computeSpeed(dragon).others.find((o) => o.type === "fly").when);
  H.startEffect(dragon, "dragon_wings");
  assert.equal(H.computeSpeed(dragon).others.find((o) => o.type === "fly").when, "");
  dragon.inventory = [{ id: "a", type: "armor", category: "light", equipped: true, name: "Leather" }];
  assert.match(H.effectBlocked(dragon, "dragon_wings"), /Leather/);
  const mind = sorc("Aberrant Mind", 14);
  assert.equal(H.startEffect(mind, "revelation_in_flesh", ["Flight", "Sight"]), true);
  assert.equal(H.computeSpeed(mind).others.find((o) => o.type === "fly").when, "");
  assert.ok(H.computeSpeed(mind).others.find((o) => o.type === "swim").when);
  assert.match(H.getCharacterSenses(mind), /invisible/);
  const divine = sorc("Divine Soul", 14);
  H.startEffect(divine, "otherworldly_wings");
  assert.equal(H.computeSpeed(divine).others.find((o) => o.type === "fly").value, 30);
  const storm = sorc("Storm Sorcery", 18);
  assert.equal(H.computeSpeed(storm).others.find((o) => o.type === "fly").value, 60);
  H.startEffect(storm, "wind_soul_shared");
  assert.equal(H.computeSpeed(storm).others.find((o) => o.type === "fly").value, 30);
  assert.ok(H.raceWards(storm).immune.some((w) => w.type === "lightning"));
});

test("Dragon Ancestor sets Elemental Affinity's type", () => {
  const c = sorc("Draconic Bloodline", 6, {}, { profPicks: { "sub:Draconic Bloodline:Dragon Ancestor@1": { slots: [["Red dragon"]] } } });
  assert.equal(H.dragonType(c), "fire");
  assert.match(circleSpellNote(c, "Burning Hands"), /Elemental Affinity: add 4/);
  assert.equal(circleSpellNote(c, "Ray of Frost"), "");
  H.startEffect(c, "elemental_affinity");
  assert.equal(res(c, POINTS).used, 1);
  assert.equal(H.effectResistances(c)[0].type, "fire");
});

test("Divine Soul: Favored by the Gods, Unearthly Recovery, Empowered Healing", () => {
  const c = sorc("Divine Soul", 18);
  assert.equal(H.favoredByTheGods(c), true);
  assert.equal(H.unearthlyRecovery(c, 108), 0);
  c.hp.current = 53;
  assert.equal(H.unearthlyRecovery(c, 108), 54);
  assert.match(healingNote(c, "Cure Wounds"), /Empowered Healing/);
});

test("the Lunar phases: the free spell, Phenomenon and Empowerment", () => {
  const c = sorc("Lunar Sorcery", 18);
  c.lunarPhase = "Full Moon";
  assert.equal(res(c, "Sorcerer:lunar_embodiment").max, 3);
  assert.equal(res(sorc("Lunar Sorcery", 5), "Sorcerer:lunar_embodiment").max, 1);
  assert.equal(H.useLunarFree(c), true);
  assert.equal(H.useLunarFree(c), false);
  H.setLunarPhase(c, "New Moon");
  assert.equal(H.useLunarFree(c), true);
  assert.equal(H.usePhenomenon(c), true);
  assert.equal(res(c, POINTS).used, 0);
  assert.equal(H.usePhenomenon(c), true);
  assert.equal(res(c, POINTS).used, 5);
  assert.equal(H.skillCheck(c, "Stealth").roll.mode, "adv");
  H.setLunarPhase(c, "Crescent Moon");
  assert.equal(H.effectResistances(c).length, 2);
  H.lunarOnLongRest(c);
  assert.equal(c.lunarChoose, true);
  assert.equal(c.lunarFree, undefined);
});

test("features that show their numbers, and the wording that changed", () => {
  assert.equal(feature(sorc("Storm Sorcery", 14), "Storm's Fury").dcs[0].chip, "STR DC 17");
  assert.ok(feature(sorc("Storm Sorcery", 14), "Storm's Fury").dcs.some((d) => d.chip === "14 lightning"));
  assert.equal(feature(sorc("Draconic Bloodline", 18), "Draconic Presence").dcs[0].chip, "WIS DC 18");
  assert.equal(feature(sorc("Aberrant Mind", 18), "Warping Implosion").dcs[0].chip, "STR DC 18");
  assert.equal(res(sorc("Aberrant Mind", 18), "Sorcerer:warping_implosion").againPoints, 5);
  assert.equal(res(sorc("Clockwork Soul", 18), "Sorcerer:clockwork_cavalcade").againPoints, 7);
  const aberrant = sorc("Aberrant Mind", 6);
  assert.ok(H.featureResistances(aberrant).some((r) => r.type === "psychic"));
  assert.ok(H.advantagesFor(aberrant).some((a) => a.name === "Psychic Defenses" && a.when));
  assert.equal(H.heartOfTheStorm(sorc("Storm Sorcery", 7)), 3);
  assert.match(circleSpellNote(sorc("Storm Sorcery", 7), "Thunderwave"), /take 3 lightning or thunder/);
  assert.match(circleSpellNote(aberrant, "Calm Emotions"), /2 sorcery points/);
  const lunar = SUBCLASSES.Sorcerer.find((s) => s.name === "Lunar Sorcery").features;
  assert.match(lunar[6].find((f) => f.name === "Waxing and Waning").text, /each phase/);
  assert.match(lunar[18][0].text, /each phase's power once/);
});

test("the Hound of Ill Omen", () => {
  const def = COMPANIONS.find((x) => x.id === "hound_of_ill_omen");
  const s = def.stats({ lv: 7 });
  assert.equal(s.type, "Medium monstrosity");
  assert.match(s.traits[0].text, /3 temporary hit points/);
});
