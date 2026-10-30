/* Class automation Phase 9, the Bard (2026-10-30): every feature checked
   against the books on 5etools' data, and what the sheet now does with the
   ones that were text only: what Bardic Inspiration pays for, Tales from
   Beyond, Spirit Session, Blade Flourish, Psychic Blades, Silver Tongue,
   Peerless Skill, Song of Rest, Countercharm and the Majesties. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { circleSpellNote } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { SPIRIT_TALES } from "../js/data/spirit-tales.js";
import { SUBCLASSES } from "../js/data/progression.js";
import { COMPANIONS } from "../js/data/companions.js";

const ABIL = { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 18 };
function bard(sub, lv, extra = {}){
  const c = newCharacter("B");
  c.classes = [{ name: "Bard", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra);
  const out = ensureShape(c);
  const slots = H.computeSpellSlots(out.classes).slots;
  for(let i = 1; i <= 9; i++) out.spellcasting.slots[i].max = slots[i] || 0;
  return out;
}
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const res = (c, key) => H.characterResources(c).find((x) => x.key === key);
const ids = (c) => H.bardicActions(c).map((a) => a.id);

test("the Bardic Inspiration die and Song of Rest's, by level", () => {
  [[1, 6], [5, 8], [10, 10], [15, 12]].forEach(([lv, die]) => assert.equal(H.bardicDie(bard("College of Lore", lv)), die));
  [[1, 0], [2, 6], [9, 8], [13, 10], [17, 12]].forEach(([lv, die]) => assert.equal(H.songOfRestDie(bard("College of Lore", lv)), die));
  assert.match(res(bard("College of Lore", 5), "Bard:bardic_inspiration").hint, /a d8/);
});

test("Font of Inspiration and Superior Inspiration", () => {
  assert.equal(res(bard("College of Lore", 4), "Bard:bardic_inspiration").reset, "long");
  assert.equal(res(bard("College of Lore", 5), "Bard:bardic_inspiration").reset, "short");
  const c = bard("College of Lore", 20);
  c.resourcesUsed = { "Bard:bardic_inspiration": 4 };
  assert.equal(res(c, "Bard:bardic_inspiration").initiativeRegain, 1);
  H.regainOnInitiative(c);
  assert.equal(c.resourcesUsed["Bard:bardic_inspiration"], 3);
  assert.equal(res(bard("College of Lore", 19), "Bard:bardic_inspiration").initiativeRegain, 0);
});

test("each college's list of what Bardic Inspiration pays for", () => {
  assert.deepEqual(ids(bard("College of Valor", 3)), ["inspire"]);
  assert.ok(ids(bard("College of Lore", 3)).includes("cutting_words"));
  assert.ok(ids(bard("College of Eloquence", 3)).includes("unsettling_words"));
  assert.ok(ids(bard("College of Spirits", 3)).includes("tales_from_beyond"));
  assert.deepEqual(ids(bard("", 2)), ["inspire"]);
  const glamour = H.bardicActions(bard("College of Glamour", 10)).find((a) => a.id === "mantle_of_inspiration");
  assert.match(glamour.detail, /up to 4 creatures.*11 temporary hit points/);
  assert.deepEqual([3, 5, 10, 15].map(H.mantleTempHp), [5, 8, 11, 14]);
  assert.match(H.bardicActions(bard("College of Creation", 3))[0].detail, /mote of potential/);
});

test("Silver Tongue covers Persuasion and Deception only", () => {
  const c = bard("College of Eloquence", 3);
  assert.equal(H.silverTongue(c, "Persuasion"), true);
  assert.equal(H.silverTongue(c, "Deception"), true);
  assert.equal(H.silverTongue(c, "Intimidation"), false);
  assert.equal(H.silverTongue(bard("College of Lore", 3), "Persuasion"), false);
});

test("Peerless Skill needs a use left", () => {
  const c = bard("College of Lore", 14);
  assert.equal(H.hasPeerlessSkill(c), true);
  assert.equal(H.hasPeerlessSkill(bard("College of Lore", 13)), false);
  c.resourcesUsed = { "Bard:bardic_inspiration": 4 };
  assert.equal(H.hasPeerlessSkill(c), false);
});

test("Blade Flourish: Master's Flourish needs no use, and Defensive Flourish goes on AC", () => {
  const c = bard("College of Swords", 3);
  assert.deepEqual(H.bladeFlourish(c), { die: 6, left: true, master: false });
  c.resourcesUsed = { "Bard:bardic_inspiration": 4 };
  assert.equal(H.bladeFlourish(c), null);
  const m = bard("College of Swords", 14, { resourcesUsed: { "Bard:bardic_inspiration": 4 } });
  assert.deepEqual(H.bladeFlourish(m), { die: 10, left: false, master: true });
  assert.equal(H.bladeFlourish(bard("College of Lore", 14)), null);
  const ac = H.computeArmorClass(c).value;
  c.effects = { defensive_flourish: 4 };
  assert.equal(H.computeArmorClass(c).value, ac + 4);
});

test("Psychic Blades: dice by level, and only with a use left", () => {
  [[3, 2], [5, 3], [10, 5], [15, 8]].forEach(([lv, qty]) => assert.equal(H.bardHitDice(bard("College of Whispers", lv))[0].qty, qty));
  const c = bard("College of Whispers", 3, { resourcesUsed: { "Bard:bardic_inspiration": 4 } });
  assert.deepEqual(H.bardHitDice(c), []);
  assert.deepEqual(H.bardHitDice(bard("College of Lore", 3)), []);
});

test("the Spirit Tales table: twelve tales, with their numbers worked in", () => {
  assert.equal(SPIRIT_TALES.length, 12);
  const c = bard("College of Spirits", 5);
  assert.match(H.spiritTale(c, 2).text, /2d8 \+ 4 force/);
  assert.match(H.spiritTale(c, 7).text, /WIS save DC 15/);
  assert.match(H.spiritTale(c, 9).text, /3d8 thunder/);
  assert.match(H.spiritTale(c, 10).text, /4d8 fire/);
  assert.match(H.spiritTale(c, 12).text, /INT save DC 15/);
  assert.deepEqual(H.taleRoll(c, H.spiritTale(c, 6)), { die: 8, qty: 1, bonus: 5, label: "Tale of the Traveler (temporary HP)" });
  assert.equal(H.taleRoll(c, H.spiritTale(c, 1)), null);
  assert.equal(H.spiritTale(c), null);
  c.spiritTale = 3;
  assert.equal(H.spiritTale(c).name, "Tale of the Beloved Friends");
  H.talesOnRest(c);
  assert.equal(H.spiritTale(c), null);
  assert.equal(H.hasMysticalConnection(bard("College of Spirits", 14)), true);
});

test("Spirit Session: divination or necromancy, within the people and your slots", () => {
  const c = bard("College of Spirits", 6);
  const list = H.sessionSpells(c);
  assert.ok(list.includes("Detect Magic"));
  assert.ok(!list.includes("Fireball"));
  assert.ok(list.includes("Clairvoyance"), "3rd level: a proficiency bonus of 3 and 3rd-level slots");
  assert.ok(!list.includes("Divination"), "4th level is past both");
  c.sessionSpell = "Detect Magic";
  const got = H.featureSpells(c).find((s) => s.name === "Detect Magic");
  assert.equal(got.kindLabel, "Spirit Session");
  assert.equal(H.featureSpells(bard("College of Lore", 6, { sessionSpell: "Detect Magic" })).some((s) => s.name === "Detect Magic"), false);
});

test("features that show their numbers", () => {
  assert.equal(feature(bard("College of Glamour", 5), "Enthralling Performance").dcs[0].chip, "WIS DC 15");
  assert.equal(feature(bard("College of Glamour", 14), "Unbreakable Majesty").dcs[0].chip, "CHA DC 17");
  assert.equal(feature(bard("College of Whispers", 3), "Words of Terror").dcs[0].chip, "WIS DC 14");
  assert.equal(feature(bard("College of Whispers", 14), "Shadow Lore").dcs[0].chip, "WIS DC 17");
  assert.equal(feature(bard("College of Creation", 3), "Mote of Potential").dcs[0].chip, "CON DC 14");
  assert.match(res(bard("College of Creation", 5), "Bard:performance_of_creation").hint, /Medium or smaller, worth up to 100 gp.*3 hours/);
  assert.match(res(bard("College of Creation", 6), "Bard:performance_of_creation").hint, /Large/);
  assert.match(res(bard("College of Creation", 14), "Bard:performance_of_creation").hint, /up to 4 nonmagical items/);
  assert.equal(res(bard("College of Creation", 3), "Bard:performance_of_creation").slotMin, 2);
  assert.equal(res(bard("College of Creation", 6), "Bard:animating_performance").slotMin, 3);
  assert.equal(res(bard("College of Eloquence", 6), "Bard:universal_speech").slotMin, 1);
});

test("Countercharm, Mantle of Majesty, Unbreakable Majesty, the stolen shadow", () => {
  const c = bard("College of Lore", 6);
  assert.equal(H.startEffect(c, "countercharm"), true);
  assert.ok(H.advantagesFor(c).some((a) => a.name === "Countercharm" && a.when));
  const g = bard("College of Glamour", 14);
  assert.equal(H.startEffect(g, "mantle_of_majesty"), true);
  assert.equal(H.startEffect(g, "unbreakable_majesty"), true);
  assert.equal(res(g, "Bard:mantle_of_majesty").used, 1);
  const w = bard("College of Whispers", 6);
  const dec = H.skillCheck(w, "Deception").value;
  H.startEffect(w, "shadow_disguise");
  assert.equal(H.skillCheck(w, "Deception").value, dec + 5);
});

test("Spiritual Focus on a bard spell's card, from level 6", () => {
  assert.match(circleSpellNote(bard("College of Spirits", 6), "Dissonant Whispers"), /Spiritual Focus/);
  assert.match(circleSpellNote(bard("College of Spirits", 6), "Cure Wounds"), /Spiritual Focus/);
  assert.equal(circleSpellNote(bard("College of Spirits", 5), "Dissonant Whispers"), "");
  assert.equal(circleSpellNote(bard("College of Spirits", 6), "Charm Person"), "");
  assert.equal(circleSpellNote(bard("College of Lore", 6), "Dissonant Whispers"), "");
});

test("the books' wording: Spirit Session, Shadow Lore, Blade Flourish", () => {
  const sub = (name) => SUBCLASSES.Bard.find((s) => s.name === name);
  assert.match(sub("College of Spirits").features[6][0].text, /until you start a long rest/);
  assert.match(sub("College of Whispers").features[14][0].text, /force it to make a saving throw/);
  assert.match(sub("College of Swords").features[3].find((f) => f.name === "Blade Flourish").text, /within 5 feet of it/);
});

test("the Dancing Item", () => {
  const def = COMPANIONS.find((x) => x.id === "dancing_item");
  const s = def.stats({ lv: 6, pb: 3, spellAttack: 7, mods: {} });
  assert.equal(s.hp, 40);
  assert.equal(s.ac, 16);
  assert.equal(s.attacks[0].bonus, 3);
  assert.equal(def.level, 6);
});
