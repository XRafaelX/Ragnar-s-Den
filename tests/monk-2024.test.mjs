/* The 2024 Monk as a choice per character (2026-11-03, Phase 1): the class
   entry's edition "2024" swaps in the 2024 features, Focus Points, the
   Martial Arts dice, monk weapons, proficiencies and subclasses, checked
   against 5etools' class-monk.json (the XPHB entries). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { CLASS_PROGRESSION } from "../js/data/progression.js";
import { MONK_2024, MONK_2024_SUBCLASSES } from "../js/data/monk-2024.js";

const ABIL = { str: 10, dex: 18, con: 14, int: 10, wis: 16, cha: 8 };
function monk(lv, extra = {}, sub = ""){
  const c = newCharacter("M");
  c.classes = [Object.assign({ name: "Monk", subclass: sub, level: lv }, extra)];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  return ensureShape(c);
}
const m24 = (lv, sub) => monk(lv, { edition: "2024" }, sub);
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const feature = (c, name) => H.classFeatureList(c.classes[0]).find((f) => f.name === name);
const weapon = (name, data) => Object.assign({ id: name, name, type: "weapon", equipped: true, proficient: true, magicBonus: 0 }, data);

test("the 2014 monk is unchanged without an edition", () => {
  const c = monk(20);
  assert.ok(names(c).includes("Ki") && names(c).includes("Diamond Soul") && names(c).includes("Perfect Self"));
  assert.equal(H.martialArtsDie(monk(1)), 4);
  assert.equal(H.characterResources(c).find((r) => r.key === "Monk:ki").name, "Ki Points");
});

test("the 2024 features, level by level", () => {
  assert.deepEqual(names(m24(1)), ["Unarmored Defense", "Martial Arts"]);
  assert.deepEqual(names(m24(2)).slice(2), ["Monk's Focus", "Unarmored Movement", "Uncanny Metabolism"]);
  const all = names(m24(20));
  ["Deflect Attacks", "Slow Fall", "Stunning Strike", "Empowered Strikes", "Evasion", "Acrobatic Movement", "Heightened Focus", "Self-Restoration",
    "Deflect Energy", "Disciplined Survivor", "Perfect Focus", "Superior Defense", "Body and Mind"].forEach((n) => assert.ok(all.includes(n), n));
  ["Ki", "Deflect Missiles", "Ki-Empowered Strikes", "Stillness of Mind", "Purity of Body", "Tongue of the Sun and Moon", "Diamond Soul", "Timeless Body", "Empty Body", "Perfect Self"]
    .forEach((n) => assert.ok(!all.includes(n), n + " is 2014 only"));
  assert.equal(all.filter((n) => n === "Martial Arts").length, 1, "one Martial Arts, upgraded in place");
  assert.match(feature(m24(17), "Martial Arts").text, /1d12/);
  assert.match(feature(m24(18), "Unarmored Movement").text, /30 feet/);
});

test("Martial Arts die d6 to d12, Focus Points from level 2", () => {
  assert.deepEqual([1, 4, 5, 10, 11, 16, 17, 20].map((lv) => H.martialArtsDie(m24(lv))), [6, 6, 8, 8, 10, 10, 12, 12]);
  assert.equal(H.characterResources(m24(1)).find((r) => r.key === "Monk:ki"), undefined);
  const focus = H.characterResources(m24(7)).find((r) => r.key === "Monk:ki");
  assert.equal(focus.name, "Focus Points");
  assert.equal(focus.max, 7);
  assert.equal(focus.initiativeRegain, 0, "Perfect Self's ki on initiative is 2014 only");
  assert.equal(H.characterResources(m24(20)).filter((r) => r.key === "Monk:ki").length, 1, "one pool, not both");
});

test("monk weapons and proficiencies: simple melee and light martial melee", () => {
  const c = m24(1);
  const scimitar = weapon("Scimitar", { damageDice: "1d6", damageType: "Slashing", ability: "str" });
  const spear = weapon("Spear", { damageDice: "1d6", damageType: "Piercing", ability: "str" });
  const longsword = weapon("Longsword", { damageDice: "1d8", damageType: "Slashing", ability: "str" });
  assert.ok(H.isMonkWeaponFor(c, scimitar) && H.isMonkWeaponFor(c, spear) && !H.isMonkWeaponFor(c, longsword));
  assert.ok(!H.isMonkWeaponFor(monk(1), scimitar), "a 2014 monk: no scimitars");
  assert.ok(H.isProficientWithWeapon(c, "Scimitar", "martial") && !H.isProficientWithWeapon(c, "Longsword", "martial"));
  assert.ok(!H.isProficientWithWeapon(monk(1), "Scimitar", "martial"));
  assert.deepEqual(H.weaponDamageDice(c, scimitar), { qty: 1, die: 6, martialArts: false }, "a d6 already, no bigger die");
  assert.equal(H.weaponDamageDice(m24(5), scimitar).die, 8);
  assert.deepEqual(H.classProficiencies(c, 0).weapons, ["Simple weapons", "Martial weapons with the Light property"]);
});

test("multiclassing into the 2024 monk gives no proficiencies", () => {
  const c = newCharacter("X");
  c.classes = [{ name: "Fighter", subclass: "", level: 3 }, { name: "Monk", subclass: "", level: 1, edition: "2024" }];
  assert.deepEqual(H.classProficiencies(ensureShape(c), 1).weapons, []);
});

test("the 2024 subclasses for a 2024 monk, the 2014 ones for a 2014 monk", () => {
  const for24 = H.subclassesFor("Monk", "2024").map((s) => s.name);
  const for14 = H.subclassesFor("Monk").map((s) => s.name);
  assert.deepEqual(for24.slice(0, 4), ["Warrior of the Open Hand", "Warrior of Shadow", "Warrior of the Elements", "Warrior of Mercy"]);
  ["Way of the Kensei", "Way of the Drunken Master", "Way of the Sun Soul", "Way of Long Death", "Way of the Astral Self", "Way of the Ascendant Dragon"]
    .forEach((n) => assert.ok(for24.includes(n) && for14.includes(n), n + " suits both"));
  ["Way of the Open Hand", "Way of Shadow", "Way of the Four Elements", "Way of Mercy"].forEach((n) => assert.ok(!for24.includes(n) && for14.includes(n), n));
  MONK_2024_SUBCLASSES.forEach((s) => assert.ok(!for14.includes(s.name), s.name));
  assert.equal(for24.length, 10);
});

test("an older subclass on a 2024 monk says Focus for ki", () => {
  const c = m24(11, "Way of the Kensei");
  const text = H.classFeatureList(c.classes[0]).filter((f) => f.subclass).map((f) => f.text).join(" ");
  assert.ok(!/\bki\b/i.test(text), text);
  assert.match(text, /Focus/);
});

test("no Tasha's monk extras for a 2024 monk", () => {
  const c = m24(5);
  c.tashaOptional = true;
  H.syncTashaAdditions(c);
  assert.ok(!names(c).includes("Dedicated Weapon") && !names(c).includes("Focused Aim"));
  assert.ok(!H.quickenedHealing(c));
  assert.deepEqual(H.classVariants("Monk", c.classes[0]), []);
  assert.equal(H.classVariants("Monk").length, 4, "a 2014 monk keeps them");
});

test("the Focus list follows the 2024 rules", () => {
  const ids = (c) => H.kiActions(c).map((a) => a.id);
  const act = (c, id) => H.kiActions(c).find((a) => a.id === id);
  assert.match(act(m24(2), "patient").detail, /Disengage and Dodge/);
  assert.match(act(m24(2), "step").detail, /Disengage and Dash/);
  assert.match(act(m24(10), "flurry").detail, /^Three unarmed strikes/);
  assert.match(act(m24(5), "stun").detail, /start of your next turn/);
  assert.ok(!ids(m24(20)).includes("astral"), "no Empty Body");
  assert.equal(H.kiWord(m24(2)), "Focus");
  assert.equal(H.kiActionProblem(m24(2), { cost: 99 }), "Needs 99 Focus");
});

test("Disciplined Survivor: every save, Body and Mind: +4 DEX and WIS up to 25", () => {
  assert.deepEqual(feature(m24(14), "Disciplined Survivor").grants.savingThrows, ["str", "dex", "con", "int", "wis", "cha"]);
  const bm = feature(m24(20), "Body and Mind");
  assert.deepEqual([bm.abilityBonus, bm.abilityMax], [{ dex: 4, wis: 4 }, 25]);
});

test("switching rules on the Information tab carries the subclass over and back", () => {
  const c = monk(20, {}, "Way of the Open Hand");
  c.abilities.dex = 20;
  assert.ok(H.setMonkEdition(c, true));
  assert.equal(c.classes[0].edition, "2024");
  assert.equal(c.classes[0].subclass, "Warrior of the Open Hand");
  assert.deepEqual([c.abilities.dex, c.abilities.wis], [24, 20], "Body and Mind at 20");
  assert.ok(!H.setMonkEdition(c, true), "already 2024");
  assert.ok(H.setMonkEdition(c, false));
  assert.equal(c.classes[0].edition, undefined);
  assert.equal(c.classes[0].subclass, "Way of the Open Hand");
  assert.deepEqual([c.abilities.dex, c.abilities.wis], [20, 16]);
  const k = monk(5, {}, "Way of the Kensei");
  H.setMonkEdition(k, true);
  assert.equal(k.classes[0].subclass, "Way of the Kensei", "an older subclass with no 2024 version stays");
});

test("2024 data: plain text, no long dashes or semicolons, a starting kit", () => {
  const texts = [].concat(MONK_2024.level1, ...Object.values(MONK_2024.features), ...MONK_2024_SUBCLASSES.flatMap((s) => Object.values(s.features).flat()))
    .map((f) => f.text);
  texts.forEach((t) => assert.ok(!/[;–—]/.test(t), t));
  assert.equal(CLASS_PROGRESSION.Monk.editions["2024"], MONK_2024);
  const kit = MONK_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(kit.map((o) => o.coins.gp), [11, 50]);
});

/* Phase 2 (2026-11-03): the 2024 class features at work. */
test("Uncanny Metabolism: once per long rest, only when it gives something", () => {
  const c = m24(6);
  assert.equal(H.uncannyMetabolism(c), null, "full Focus and full HP: not offered");
  c.resourcesUsed = { "Monk:ki": 5 };
  c.hp.current = 20;
  assert.deepEqual(H.uncannyMetabolism(c), { die: 8, bonus: 6 });
  assert.equal(H.useUncannyMetabolism(c, 3), 9, "a 3 on the d8 + 6");
  assert.equal(c.hp.current, 29);
  assert.equal(H.resourceLeft(c, "Monk:ki"), 6, "all Focus back");
  c.resourcesUsed["Monk:ki"] = 2;
  assert.equal(H.uncannyMetabolism(c), null, "used until a long rest");
  H.restoreResources(c, "long");
  c.resourcesUsed = { "Monk:ki": 2 };
  assert.ok(H.uncannyMetabolism(c), "back after a long rest");
  assert.equal(H.uncannyMetabolism(monk(6, {}, "")), null, "not for a 2014 monk");
  const um = H.characterResources(c).find((r) => r.key === "Monk:uncanny_metabolism");
  assert.equal(um.max, 1);
  assert.equal(um.reset, "long");
});

test("Uncanny Metabolism doesn't heal past the maximum", () => {
  const c = m24(2);
  c.hp.current = c.hp.max - 1;
  assert.equal(H.useUncannyMetabolism(c, 6), 1);
  assert.equal(c.hp.current, c.hp.max);
});

test("Perfect Focus: back up to 4 at monk 15, only with 3 or fewer", () => {
  const c = m24(15);
  c.resourcesUsed = { "Monk:ki": 14 };
  assert.equal(H.perfectFocusGain(c), 3);
  assert.equal(H.usePerfectFocus(c), 3);
  assert.equal(H.resourceLeft(c, "Monk:ki"), 4);
  assert.equal(H.perfectFocusGain(c), 0, "4 left: nothing");
  const low = m24(14);
  low.resourcesUsed = { "Monk:ki": 14 };
  assert.equal(H.perfectFocusGain(low), 0, "not before 15");
});

test("Heightened Focus: Patient Defense rolls two Martial Arts dice of temporary HP", () => {
  const act = (c) => H.kiActions(c).find((a) => a.id === "patient");
  assert.equal(act(m24(9)).roll, null);
  assert.deepEqual(act(m24(11)).roll, { qty: 2, die: 10, bonus: 0, label: "Patient Defense: temporary hit points", temp: true });
});

test("Superior Defense: 3 Focus, resistance to all but force, ends when incapacitated", () => {
  const c = m24(18);
  c.effects = { superior_defense: true };
  assert.ok(H.effectResistances(c).some((r) => r.source === "Superior Defense" && r.type === "all damage but force"));
  assert.deepEqual(H.endIncapacitatedEffects(c), ["Superior Defense"]);

});

test("the Active effects card: Superior Defense for a 2024 monk 18, Empty Body for a 2014 one", () => {
  const ids = (c) => H.characterEffects(c).map((e) => e.def.id);
  assert.ok(ids(m24(18)).includes("superior_defense") && !ids(m24(18)).includes("empty_body"));
  assert.ok(!ids(m24(17)).includes("superior_defense"));
  assert.ok(ids(monk(18)).includes("empty_body") && !ids(monk(18)).includes("superior_defense"));
  const c = m24(18);
  assert.ok(H.startEffect(c, "superior_defense"));
  assert.equal(H.resourceLeft(c, "Monk:ki"), 15, "3 Focus paid");
});

/* Phase 3 (2026-11-03): the four 2024 subclasses at work. */
const acts = (c) => H.kiActions(c);
const act = (c, id) => acts(c).find((a) => a.id === id);

test("Warrior of the Open Hand: technique, Wholeness of Body, Fleet Step, Quivering Palm", () => {
  assert.match(act(m24(3, "Warrior of the Open Hand"), "flurry").detail, /Addle.*Push \(STR save DC 13.*Topple \(DEX save DC 13/);
  const res = (c) => H.characterResources(c).find((r) => r.key === "Monk:wholeness_of_body");
  assert.equal(res(m24(5, "Warrior of the Open Hand")), undefined);
  const w = res(m24(6, "Warrior of the Open Hand"));
  assert.deepEqual([w.max, w.reset, w.roll.die, w.roll.bonus, w.roll.heal, w.roll.min], [3, "long", 8, 3, true, 1], "WIS 16: 3 uses of 1d8 + 3");
  assert.equal(res(m24(17, "Warrior of the Open Hand")).roll.die, 12);
  assert.equal(H.characterResources(monk(6, {}, "Way of the Open Hand")).find((r) => r.key === "Monk:wholeness_of_body").heal, 18, "the 2014 one is untouched");
  assert.match(act(m24(11, "Warrior of the Open Hand"), "step").detail, /Fleet Step/);
  const c = m24(17, "Warrior of the Open Hand");
  assert.equal(act(c, "quiver24").cost, 4);
  assert.deepEqual(act(c, "quiver24-end").roll.qty + "d" + act(c, "quiver24-end").roll.die, "10d12");
  assert.ok(!act(c, "quiver"), "not the 2014 version");
});

test("Warrior of Shadow: Darkness for 1 Focus, Minor Illusion, darkvision, Shadow Step, Cloak of Shadows", () => {
  const c = m24(3, "Warrior of Shadow");
  assert.equal(act(c, "shadow24-darkness").cost, 1);
  assert.ok(!acts(c).some((a) => a.group === "Shadow Arts"), "not the 2014 four spells for 2 ki");
  const names = H.featureSpells(c).map((s) => s.name);
  assert.ok(names.includes("Minor Illusion") && names.includes("Darkness"), names.join(", "));
  assert.match(String(H.getCharacterSenses(c)), /Darkvision 60 ft/);
  c.race = "Hill Dwarf";
  assert.match(String(H.getCharacterSenses(c)), /Darkvision 120 ft/, "60 more for a race with darkvision");
  const ids = (x) => H.characterEffects(x).map((e) => e.def.id);
  assert.ok(ids(m24(6, "Warrior of Shadow")).includes("shadow_step"));
  assert.ok(act(m24(11, "Warrior of Shadow"), "improved-step"));
  const k = m24(17, "Warrior of Shadow");
  assert.ok(ids(k).includes("shadow_cloak") && !ids(k).includes("cloak_of_shadows"));
  assert.ok(H.startEffect(k, "shadow_cloak"));
  assert.equal(H.resourceLeft(k, "Monk:ki"), 14, "3 Focus");
  assert.equal(act(k, "flurry").cost, 0, "Flurry free while shrouded");
  assert.ok(H.effectRolls(k, "attack").some((r) => /Cloak of Shadows/.test(r.reason)));
  assert.deepEqual(H.endIncapacitatedEffects(k), ["Cloak of Shadows"]);
});

test("Warrior of the Elements: attunement, Elementalism, Elemental Burst, Stride, Epitome", () => {
  const c = m24(11, "Warrior of the Elements", {});
  assert.ok(H.featureSpells(c).some((s) => s.name === "Elementalism"));
  assert.ok(H.startEffect(c, "elemental_attunement"));
  assert.equal(H.resourceLeft(c, "Monk:ki"), 10, "1 Focus");
  const u = H.unarmedStrike(c);
  assert.match(u.type, /force/);
  assert.match(u.type, /thunder/);
  assert.ok(u.parts.some((p) => /Reach 15 ft/.test(p)));
  const sp = H.computeSpeed(c).others;
  assert.ok(sp.some((o) => o.type === "fly" && !o.when) && sp.some((o) => o.type === "swim" && !o.when), JSON.stringify(sp));
  const b = act(c, "burst");
  assert.deepEqual([b.cost, b.roll.qty, b.roll.die], [2, 3, 10]);
  const e = m24(17, "Warrior of the Elements");
  assert.ok(!H.startEffect(e, "elemental_epitome", "Fire") || !H.effectOn(e, "elemental_epitome"), "needs the attunement first");
  H.startEffect(e, "elemental_attunement");
  e.effects.elemental_epitome = "Fire";
  assert.ok(H.effectResistances(e).some((r) => r.type === "fire" && r.source === "Elemental Epitome"));
  assert.match(act(e, "step").detail, /Elemental Epitome: \+20 feet/);
});

test("Warrior of Mercy: Hand of Harm and Healing, flurry uses, Ultimate Mercy", () => {
  const c = m24(6, "Warrior of Mercy");
  assert.deepEqual([act(c, "harm24").cost, act(c, "harm24").roll.die, act(c, "harm24").roll.bonus], [1, 8, 3]);
  assert.match(act(c, "harm24").detail, /poison/);
  assert.match(act(c, "heal24").detail, /blinded, deafened, paralyzed, poisoned or stunned/);
  assert.equal(act(c, "heal24-flurry").cost, 0);
  assert.ok(!act(c, "harm24-flurry"), "the free Hand of Harm comes at 11");
  const k = m24(11, "Warrior of Mercy");
  assert.equal(H.characterResources(k).find((r) => r.key === "Monk:flurry_of_healing_and_harm").max, 3);
  const free = act(k, "harm24-flurry");
  assert.ok(H.payKiAction(k, free));
  assert.equal(H.resourceLeft(k, "Monk:ki"), 11, "no Focus");
  assert.equal(H.resourceLeft(k, "Monk:flurry_of_healing_and_harm"), 2, "a use");
  k.resourcesUsed["Monk:flurry_of_healing_and_harm"] = 3;
  assert.equal(H.kiActionProblem(k, act(k, "harm24-flurry")), "Used up until a long rest");
  const u = m24(17, "Warrior of Mercy");
  assert.equal(act(u, "ultimate24").cost, 5);
  assert.equal(act(u, "ultimate24").roll.qty, 4);
  assert.ok(H.classProficiencies(u, 0).tools.includes("Herbalism kit"));
});

test("older subclasses on a 2024 monk say Focus on the Spells tab and Vitals", () => {
  const c = m24(6, "Way of the Sun Soul");
  const arc = H.classFeatureList(c.classes[0]).find((f) => f.name === "Searing Arc Strike");
  assert.ok(!/\bki\b/.test(arc.spellLabel + " " + arc.spellTip + " " + arc.text), arc.spellLabel);
  assert.equal(H.kiWord(c), "Focus");
});

test("the monk's strikes on the unarmed strike card (2026-11-04, checked on 5etools' XPHB data)", () => {
  // Flurry of Blows: two strikes, three from 2024 monk 10 (Heightened Focus); always two for 2014.
  assert.deepEqual([H.flurryStrikes(m24(2)), H.flurryStrikes(m24(9)), H.flurryStrikes(m24(10)), H.flurryStrikes(monk(20))], [2, 2, 3, 2]);
  assert.equal(H.kiAction(m24(2), "flurry").cost, 1);
  assert.equal(H.kiAction(m24(1), "flurry"), null, "no Focus before level 2");
  // Stunning Strike from 5: 2024 a monk weapon or an unarmed strike, 2014 any melee weapon.
  assert.equal(H.canStunWith(m24(4), null), false);
  assert.equal(H.canStunWith(m24(5), null), true);
  assert.equal(H.canStunWith(m24(5), {}, true, false), true, "2024: a monk weapon");
  assert.equal(H.canStunWith(m24(5), {}, false, false), false, "2024: not a greatsword");
  assert.equal(H.canStunWith(monk(5), {}, false, false), true, "2014: any melee weapon");
  assert.equal(H.canStunWith(monk(5), {}, false, true), false, "2014: not a bow");
  // Grapple / Shove: 8 + STR or (Dexterous Attacks) DEX + proficiency, 2024 only.
  assert.equal(H.grappleShoveDc(monk(5)), null, "2014: contested Athletics, no DC");
  assert.deepEqual(H.grappleShoveDc(m24(5)), { dc: 15, ability: "DEX" }, "8 + DEX 4 + proficiency 3");
  const armored = m24(5);
  armored.inventory = [{ id: "a", name: "Leather", type: "armor", category: "light", equipped: true }];
  assert.deepEqual(H.grappleShoveDc(armored), { dc: 11, ability: "STR" }, "in armor: STR");
  const strong = m24(1);
  strong.abilities.str = 18; strong.abilities.dex = 12;
  assert.deepEqual(H.grappleShoveDc(strong), { dc: 14, ability: "STR" }, "the higher of the two");
});

test("Deflect Attacks' redirect in the Spend Focus list (2024 monk 3, DEX save against the Focus DC)", () => {
  const a = H.kiAction(m24(3), "deflect-redirect");
  assert.equal(a.cost, 1);
  assert.match(a.detail, /DEX save, DC 13/);
  assert.match(a.detail, /bludgeoning, piercing or slashing/);
  assert.deepEqual([a.roll.qty, a.roll.die, a.roll.bonus], [2, 6, 4], "two Martial Arts dice + DEX");
  assert.ok(!/bludgeoning, piercing/.test(H.kiAction(m24(13), "deflect-redirect").detail), "any damage type from 13 (Deflect Energy)");
  assert.equal(H.kiAction(m24(2), "deflect-redirect"), null, "not before 3");
  assert.equal(H.kiAction(monk(5), "deflect-redirect"), null, "not for the 2014 monk");
});

test("hit-time monk options: Open Hand Technique, Elemental Attunement's push, Hand of Harm, Deflect Missiles' throw back", () => {
  // Open Hand Technique (2024: Topple, Push, Addle; 2014: prone, push, no reactions), DC 8 + 3 + 3.
  assert.deepEqual(H.openHandTechniques(m24(5, "Warrior of the Open Hand")).map((t) => t.name), ["Topple (DEX DC 14)", "Push (STR DC 14)", "Addle"]);
  assert.deepEqual(H.openHandTechniques(monk(5, {}, "Way of the Open Hand")).map((t) => t.name), ["Prone (DEX DC 14)", "Push (STR DC 14)", "No reactions"]);
  assert.deepEqual(H.openHandTechniques(m24(5, "Warrior of Shadow")), []);
  // Elemental Attunement's push only while it's on.
  const el = m24(5, "Warrior of the Elements");
  assert.equal(H.elementalPushDc(el), 0);
  el.effects = { elemental_attunement: true };
  assert.equal(H.elementalPushDc(el), 14);
  // Hand of Harm: 1 Focus, Martial Arts die + WIS necrotic.
  const harm = H.kiAction(m24(3, "Warrior of Mercy"), "harm24");
  assert.deepEqual([harm.cost, harm.roll.qty, harm.roll.die, harm.roll.bonus], [1, 1, 6, 3]);
  // Deflect Missiles' throw back (2014 monk 3): 1 ki, DEX + proficiency to hit, Martial Arts die + DEX.
  const thr = H.kiAction(monk(3), "deflect-throw");
  assert.deepEqual([thr.cost, thr.attack.bonus, thr.attack.hit.die, thr.attack.hit.bonus], [1, 6, 4, 4]);
  assert.equal(H.kiAction(monk(2), "deflect-throw"), null);
  assert.equal(H.kiAction(m24(5), "deflect-throw"), null, "the 2024 monk redirects instead");
});
