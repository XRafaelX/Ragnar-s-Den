/* Class automation Phase 8, the Druid (2026-10-30): every feature checked
   against the books on 5etools' data (Tal'Dorei Reborn's scan for the Circle
   of the Blighted), and what the sheet now does with the ones that were
   text only: Wild Shape as a real form, Starry Form, the wildfire spirit,
   Spirit Totem, Defile Ground, Natural Recovery, Cosmic Omen and the notes
   on spell cards. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { healingNote, circleSpellNote } from "../js/core/spell-scaling.js";
import { abilityScore } from "../js/core/ability-scores.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { WILD_SHAPE_FORMS, WILD_SHAPE_ELEMENTALS, wildShapeForm } from "../js/data/wild-shapes.js";
import { SUBCLASSES } from "../js/data/progression.js";
import { COMPANIONS } from "../js/data/companions.js";

const ABIL = { str: 8, dex: 14, con: 12, int: 10, wis: 18, cha: 10 };
function druid(sub, lv, extra = {}){
  const c = newCharacter("D");
  c.classes = [{ name: "Druid", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  c.speed = 30;
  Object.assign(c, extra);
  const out = ensureShape(c);
  const slots = H.computeSpellSlots(out.classes).slots;
  for(let i = 1; i <= 9; i++) out.spellcasting.slots[i].max = slots[i] || 0;
  return out;
}
const forms = (c) => H.wildShapeOptions(c).map((f) => f.name);
const feature = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.name === name);
const left = (c, key) => { const r = H.characterResources(c).find((x) => x.key === key); return r.max - r.used; };

test("Wild Shape forms: every beast's block is whole, and the misprints follow the Monster Manual", () => {
  assert.equal(WILD_SHAPE_FORMS.length, 90);
  WILD_SHAPE_FORMS.forEach((f) => {
    assert.ok(f.ac > 0 && f.hp > 0 && f.str && f.dex && f.con, f.name);
    f.attacks.forEach((a) => assert.ok(a.toHit != null && a.damageType && a.text, f.name + " " + a.name));
  });
  assert.ok(!wildShapeForm("Swarm of Rats"), "a swarm isn't a beast");
  assert.equal(wildShapeForm("Crocodile").speed.swim, 30);
  assert.equal(wildShapeForm("Giant Wasp").speed.swim, undefined);
  assert.equal(wildShapeForm("Brown Bear").attacks[0].toHit, 6);
  assert.equal(wildShapeForm("Black Bear").attacks[0].toHit, 4);
  WILD_SHAPE_ELEMENTALS.forEach((n) => assert.equal(wildShapeForm(n).cr, "5"));
});

test("Beast Shapes table: challenge rating, flying and swimming by druid level", () => {
  const two = forms(druid("Circle of the Land", 2));
  assert.ok(two.includes("Wolf"));
  ["Crocodile", "Giant Eagle", "Brown Bear", "Eagle"].forEach((n) => assert.ok(!two.includes(n), n));
  const four = forms(druid("Circle of the Land", 4));
  assert.ok(four.includes("Crocodile"));
  assert.ok(!four.includes("Giant Eagle") && !four.includes("Brown Bear"));
  const eight = forms(druid("Circle of the Land", 8));
  assert.ok(eight.includes("Giant Eagle"));
  assert.ok(eight.includes("Dire Wolf"));
  assert.ok(!eight.includes("Giant Elk"));
});

test("Circle Forms: CR 1 at once, then a third of the level, and two uses for an elemental", () => {
  const moon2 = forms(druid("Circle of the Moon", 2));
  assert.ok(moon2.includes("Brown Bear"));
  assert.ok(!moon2.includes("Giant Octopus") && !moon2.includes("Giant Eagle"));
  assert.equal(H.wildShapeLimit(druid("Circle of the Moon", 6)).cr, 2);
  assert.equal(H.wildShapeLimit(druid("Circle of the Moon", 9)).cr, 3);
  assert.equal(H.wildShapeLimit(druid("Circle of the Moon", 18)).cr, 6);
  assert.ok(!forms(druid("Circle of the Moon", 9)).includes("Fire Elemental"));
  const c = druid("Circle of the Moon", 10);
  assert.ok(forms(c).includes("Fire Elemental"));
  assert.ok(!forms(druid("Circle of the Land", 18)).includes("Fire Elemental"));
  assert.equal(H.startWildShape(c, "Fire Elemental"), true);
  assert.equal(left(c, "Druid:wild_shape"), 0);
  c.resourcesUsed["Druid:wild_shape"] = 1;
  H.endWildShape(c);
  assert.match(H.wildShapeProblem(c, "Fire Elemental"), /Not enough/);
  assert.equal(H.startWildShape(c, "Fire Elemental"), false);
});

test("in a form: its body, your mind, your saves' proficiency, its senses", () => {
  const c = druid("Circle of the Land", 2, { skillProfs: { Perception: { prof: true } } });
  const hp = c.hp.current, wisSave = H.computeSave(c, "wis").value;
  assert.equal(H.startWildShape(c, "Wolf"), true);
  assert.equal(left(c, "Druid:wild_shape"), 1);
  assert.equal(c.hp.current, 11);
  assert.equal(H.maxHp(c), 11);
  assert.equal(abilityScore(c, "str"), 12);
  assert.equal(abilityScore(c, "dex"), 15);
  assert.equal(abilityScore(c, "wis"), 18);
  assert.equal(H.computeArmorClass(c).value, 13);
  assert.equal(H.computeSpeed(c).value, 40);
  assert.equal(H.computeSave(c, "dex").value, 2);
  assert.equal(H.computeSave(c, "wis").value, wisSave); // WIS and your proficiency stay
  assert.equal(H.getCharacterSenses(c), "No special senses");
  // Its Stealth +4: you gain the proficiency, and the higher bonus counts.
  assert.equal(H.skillCheck(c, "Stealth").value, 4);
  // Your own Perception (+4 WIS, +2) beats the wolf's +3.
  assert.equal(H.skillCheck(c, "Perception").value, 6);
  H.endWildShape(c);
  assert.equal(c.hp.current, hp);
  assert.equal(abilityScore(c, "str"), 8);
  assert.ok(H.computeSpeed(c).value === 30);
});

test("the book's example: 10 damage with 1 hit point left, you revert and take 9", () => {
  const c = druid("Circle of the Land", 4);
  const own = c.hp.current;
  H.startWildShape(c, "Wolf");
  c.hp.current = 1;
  assert.equal(H.wildShapeDamage(c, 10), 9);
  assert.equal(c.wildShape, undefined);
  assert.equal(c.hp.current, own);
  H.startWildShape(c, "Wolf");
  assert.equal(H.wildShapeDamage(c, 3), -1);
  assert.equal(c.hp.current, 8);
  assert.ok(c.wildShape);
});

test("exhaustion 4 halves a form's hit point maximum too", () => {
  const c = druid("Circle of the Moon", 4, { exhaustion: 4 });
  H.startWildShape(c, "Black Bear");
  assert.equal(H.maxHp(c), 9);
});

test("changing form keeps your own hit points, and falling unconscious ends it", () => {
  const c = druid("Circle of the Moon", 4);
  c.hp.current = 20;
  H.startWildShape(c, "Wolf");
  H.startWildShape(c, "Black Bear");
  assert.equal(c.wildShape.normal, 20);
  assert.equal(c.hp.current, 19);
  H.addCondition(c, "unconscious");
  assert.equal(c.wildShape, undefined);
  assert.equal(c.hp.current, 20);
});

test("Archdruid: no use spent, however many forms", () => {
  const c = druid("Circle of the Land", 20);
  assert.equal(H.startWildShape(c, "Wolf"), true);
  assert.equal((c.resourcesUsed || {})["Druid:wild_shape"] || 0, 0);
});

test("using Wild Shape ends Symbiotic Entity, whatever it's used for", () => {
  const c = druid("Circle of Spores", 2);
  H.startEffect(c, "symbiotic_entity");
  assert.equal(H.effectOn(c, "symbiotic_entity"), true);
  H.startWildShape(c, "Wolf");
  assert.equal(H.effectOn(c, "symbiotic_entity"), false);
});

test("Blighted Shape: +2 AC and darkvision in a form; Incarnation of Corruption adds 2 more", () => {
  const c = druid("Circle of the Blighted", 2);
  H.startWildShape(c, "Wolf");
  assert.equal(H.computeArmorClass(c).value, 15);
  assert.equal(H.getCharacterSenses(c), "Darkvision 60 ft");
  const late = druid("Circle of the Blighted", 14);
  const plain = H.computeArmorClass(druid("Circle of the Land", 14)).value;
  assert.equal(H.computeArmorClass(late).value, plain + 2);
  H.startWildShape(late, "Wolf");
  assert.equal(H.computeArmorClass(late).value, 17);
  assert.ok(H.featureResistances(late).some((r) => r.type === "necrotic"));
  const bat = druid("Circle of the Blighted", 8);
  H.startWildShape(bat, "Giant Spider");
  assert.equal(H.getCharacterSenses(bat), "Blindsight 10 ft, darkvision 120 ft");
  assert.deepEqual(H.defileGround(druid("Circle of the Blighted", 2)), { die: 4, radius: 10 });
  assert.deepEqual(H.defileGround(druid("Circle of the Blighted", 10)), { die: 6, radius: 20 });
  assert.deepEqual(H.defileGround(late), { die: 8, radius: 20 });
});

test("Tal'Dorei's Defile Ground: an attack or spell, and flyers are unaffected", () => {
  const sub = SUBCLASSES.Druid.find((s) => s.name === "Circle of the Blighted");
  [2, 10, 14].forEach((lv) => {
    const f = sub.features[lv].find((x) => x.name === "Defile Ground");
    assert.match(f.text, /from an attack or spell/);
    assert.match(f.text, /Flying creatures are unaffected/);
  });
});

test("Starry Form: the constellation is the choice, and each one does its part", () => {
  const c = druid("Circle of Stars", 2);
  assert.equal(H.startEffect(c, "starry_form", "Archer"), true);
  assert.equal(H.starryConstellation(c), "Archer");
  assert.equal(left(c, "Druid:wild_shape"), 1);
  assert.equal(H.starryDice(c), 1);
  assert.equal(H.starryDragon(c), false);
  c.effects.starry_form = "Dragon";
  assert.equal(H.starryDragon(c), true);
  // No flying until Twinkling Constellations, and then only as the Dragon.
  assert.ok(!H.computeSpeed(c).others.some((o) => o.type === "fly"));
  const ten = druid("Circle of Stars", 10);
  assert.equal(H.starryDice(ten), 2);
  assert.ok(H.computeSpeed(ten).others.find((o) => o.type === "fly").when);
  H.startEffect(ten, "starry_form", "Chalice");
  assert.ok(H.computeSpeed(ten).others.find((o) => o.type === "fly").when);
  ten.effects.starry_form = "Dragon";
  assert.equal(H.computeSpeed(ten).others.find((o) => o.type === "fly").when, "");
  assert.ok(!H.effectResistances(ten).length);
  const top = druid("Circle of Stars", 14);
  H.startEffect(top, "starry_form", "Dragon");
  assert.equal(H.effectResistances(top)[0].source, "Full of Stars");
});

test("Cosmic Omen: even is Weal, odd is Woe, and a long rest rolls it again", () => {
  const c = druid("Circle of Stars", 6);
  assert.equal(H.setCosmicOmen(c, 4), "Weal");
  assert.equal(H.setCosmicOmen(c, 3), "Woe");
  assert.match(H.omenOnLongRest(c), /Weal|Woe/);
  assert.equal(H.omenOnLongRest(druid("Circle of Stars", 5)), "");
});

test("Natural Recovery: the book's example, and nothing of 6th level or higher", () => {
  const c = druid("Circle of the Land", 4);
  assert.equal(H.naturalRecoveryBudget(c), 2);
  c.spellcasting.slots[1].used = 2;
  c.spellcasting.slots[2].used = 1;
  assert.equal(H.recoverSlots(c, { 1: 1, 2: 1 }, 2), false);
  assert.equal(H.recoverSlots(c, { 2: 1 }, 2), true);
  assert.equal(c.spellcasting.slots[2].used, 0);
  const high = druid("Circle of the Land", 13);
  assert.equal(H.naturalRecoveryBudget(high), 7);
  high.spellcasting.slots[6].used = 1;
  high.spellcasting.slots[5].used = 1;
  assert.deepEqual(H.recoverableSlots(high), [{ level: 5, spent: 1 }]);
});

test("the wildfire spirit outlasts your fall, and Blazing Revival spends it", () => {
  const c = druid("Circle of Wildfire", 14);
  assert.equal(H.startEffect(c, "wildfire_spirit"), true);
  c.hp.current = 0;
  H.endAllEffects(c, true);
  assert.equal(H.effectOn(c, "wildfire_spirit"), true);
  assert.equal(H.blazingRevivalReady(c), true);
  assert.equal(H.useBlazingRevival(c, 112), true);
  assert.equal(c.hp.current, 56);
  assert.equal(H.effectOn(c, "wildfire_spirit"), false);
  assert.equal(H.blazingRevivalReady(c), false);
  // A rest still ends it.
  const r = druid("Circle of Wildfire", 2);
  H.startEffect(r, "wildfire_spirit");
  H.endAllEffects(r);
  assert.equal(H.effectOn(r, "wildfire_spirit"), false);
});

test("Spirit Totem: the Bear's temporary hit points, and the auras as reminders", () => {
  const c = druid("Circle of the Shepherd", 4);
  assert.equal(H.startEffect(c, "spirit_totem", "Bear"), true);
  assert.equal(c.hp.temp, 9);
  assert.equal(H.totemSpirit(c), "Bear");
  assert.ok(H.advantagesFor(c).some((a) => a.name === "Bear Spirit" && a.on === "save" && a.when));
  const hawk = druid("Circle of the Shepherd", 4);
  H.startEffect(hawk, "spirit_totem", "Hawk");
  assert.equal(hawk.hp.temp, 0);
  assert.ok(H.advantagesFor(hawk).some((a) => a.on === "skill" && a.skills.includes("Perception") && a.when));
});

test("spell cards: Chalice, Unicorn, Enhanced Bond, Mighty Summoner and Foul Conjuration", () => {
  const stars = druid("Circle of Stars", 2);
  assert.doesNotMatch(healingNote(stars, "Cure Wounds"), /Chalice/);
  H.startEffect(stars, "starry_form", "Chalice");
  assert.match(healingNote(stars, "Cure Wounds"), /Chalice: with a spell slot.*1d8\+4/);
  const unicorn = druid("Circle of the Shepherd", 5);
  H.startEffect(unicorn, "spirit_totem", "Unicorn");
  assert.match(healingNote(unicorn, "Healing Word"), /regains 5 hit points/);
  const fire = druid("Circle of Wildfire", 6);
  assert.equal(circleSpellNote(fire, "Burning Hands"), "");
  H.startEffect(fire, "wildfire_spirit");
  assert.match(circleSpellNote(fire, "Burning Hands"), /Enhanced Bond/);
  assert.match(circleSpellNote(fire, "Flame Strike"), /Enhanced Bond/);
  assert.equal(circleSpellNote(fire, "Thunderwave"), "");
  assert.match(healingNote(fire, "Cure Wounds"), /Enhanced Bond/);
  assert.match(circleSpellNote(druid("Circle of the Shepherd", 6), "Conjure Animals"), /Mighty Summoner/);
  assert.match(circleSpellNote(druid("Circle of the Blighted", 10), "Conjure Animals"), /Foul Conjuration.*DC 16/);
  assert.equal(circleSpellNote(druid("Circle of the Land", 10), "Conjure Animals"), "");
});

test("features that show their numbers", () => {
  const land = druid("Circle of the Land", 14);
  assert.equal(feature(land, "Nature's Sanctuary").dcs[0].chip, "WIS DC 17");
  assert.ok(H.raceWards(land).immune.some((w) => w.type === "poison"));
  assert.ok(H.raceWards(land).conditionImmune.some((w) => w.type === "poisoned"));
  assert.ok(H.advantagesFor(land).some((a) => a.name === "Land's Stride" && a.when));
  const spores = druid("Circle of Spores", 6);
  assert.equal(feature(spores, "Halo of Spores").roll.die, 6);
  assert.equal(feature(spores, "Halo of Spores").dcs[0].chip, "CON DC 15");
  const late = druid("Circle of Spores", 14);
  assert.equal(feature(late, "Halo of Spores").roll.die, 10);
  assert.ok(H.raceWards(late).conditionImmune.some((w) => w.type === "blinded"));
});

test("Symbiotic Entity's die is necrotic, on melee hits only, and Spreading Spores needs it", () => {
  const c = druid("Circle of Spores", 10);
  assert.deepEqual(H.druidHitDice(c, true), []);
  H.startEffect(c, "symbiotic_entity");
  assert.equal(H.druidHitDice(c, true)[0].text, "+1d6 necrotic");
  assert.deepEqual(H.druidHitDice(c, false), []);
  assert.equal(H.startEffect(c, "spreading_spores"), true);
  H.endEffect(c, "symbiotic_entity");
  assert.equal(H.effectOn(c, "spreading_spores"), false);
  const sub = SUBCLASSES.Druid.find((s) => s.name === "Circle of Spores");
  assert.match(sub.features[2].find((x) => x.name === "Symbiotic Entity").text, /1d6 necrotic/);
});

test("Hearth of Moonlight and Shadow: +5 to Stealth and Perception while it's on", () => {
  const c = druid("Circle of Dreams", 6);
  const stealth = H.skillCheck(c, "Stealth").value;
  H.startEffect(c, "hearth_of_moonlight");
  assert.equal(H.skillCheck(c, "Stealth").value, stealth + 5);
  assert.equal(H.balmDiceLimit(c), 3);
  assert.equal(H.balmDiceLimit(druid("Circle of Dreams", 2)), 1);
});

test("Fungal Infestation's zombie is on the Companions list, at 1 hit point", () => {
  const def = COMPANIONS.find((x) => x.id === "fungal_zombie");
  assert.equal(def.stats({}).hp, 1);
  assert.equal(def.level, 6);
});

test("the Spells tab's note while transformed", () => {
  const c = druid("Circle of the Moon", 4);
  assert.equal(H.wildShapeSpellNote(c), "");
  H.startWildShape(c, "Wolf");
  assert.match(H.wildShapeSpellNote(c), /can't cast spells/);
  const old = druid("Circle of the Moon", 18);
  H.startWildShape(old, "Wolf");
  assert.match(H.wildShapeSpellNote(old), /Beast Spells/);
  assert.equal(H.hasPrimalStrike(old), true);
  assert.equal(H.hasPrimalStrike(druid("Circle of the Moon", 5)), false);
});
