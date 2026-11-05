/* The 2024 Barbarian (2026-11-05, Phase 6 of the 2024 Player's Handbook):
   checked against the printed book, pp. 51 to 56. A class entry's edition
   "2024" swaps in the features, kit, Weapon Mastery picks, the Rage's rules,
   Brutal Strike and the four 2024 paths. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { BARBARIAN_2024, BARBARIAN_2024_SUBCLASSES } from "../js/data/barbarian-2024.js";
import { WEAPON_MASTERY } from "../js/data/weapon-mastery.js";
import { setClassEdition } from "../js/core/class-edition.js";
import { masteryKinds } from "../js/core/weapon-mastery.js";
import { classEdition, classHasEdition, subclassesFor } from "../js/core/class-features.js";
import { initiativeRollMode, saveRollMode, attackRollMode, skillCheck, passivePerception } from "../js/core/checks.js";
import { computeSpeed } from "../js/core/vitals.js";

const ABIL = { str: 18, dex: 14, con: 16, int: 8, wis: 12, cha: 10 };
function barb(lv, sub = "", edition = "2024", extra = {}){
  const c = newCharacter("B");
  const cl = { name: "Barbarian", subclass: sub, level: lv };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 12 * lv, current: 12 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const feature = (c, name) => H.classFeatureList(c.classes[0]).find((f) => f.name === name);
const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
const rage = (c) => { H.startRage(c); return c; };
const reckless = (c) => { c.effects = Object.assign({}, c.effects, { reckless_attack: true }); return c; };
const axe = { id: "a", name: "Greataxe", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, damageDice: "1d12", damageType: "Slashing", notes: "heavy, two-handed" };
const handaxe = { id: "h", name: "Handaxe", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, damageDice: "1d6", damageType: "Slashing", notes: "light, thrown 20/60" };
const plate = { id: "p", name: "Plate", type: "armor", category: "heavy", baseAC: 18, equipped: false, qty: 1 };

test("the 2014 barbarian is unchanged without an edition", () => {
  const c = barb(20, "Path of the Berserker", "");
  assert.ok(names(c).includes("Brutal Critical") && !names(c).includes("Brutal Strike") && !names(c).includes("Weapon Mastery"));
  assert.equal(H.barbarianRageMax(20, c.classes[0]), Infinity);
  assert.equal(H.brutalCriticalDice(c), 3);
  assert.deepEqual(masteryKinds(c), []);
  rage(c);
  assert.ok(H.canFrenzy(c), "the 2014 frenzy");
  assert.equal(H.frenzyDice(reckless(c)), 0);
  assert.equal(H.rageDamageBonus(c, { name: "Longbow", type: "weapon", ability: "dex" }), 0);
  const z = rage(barb(14, "Path of the Zealot", ""));
  assert.ok(H.rageBeyondDeath(z), "Rage Beyond Death stays on the 2014 Zealot");
  const r = barb(11, "", "");
  rage(r);
  r.rage.relentless = true;
  r.hp.current = 0;
  assert.equal(H.resolveRelentlessRage(r, 20), "up");
  assert.equal(r.hp.current, 1);
});

test("the features arrive at the book's levels", () => {
  const at = (lv) => names(barb(lv));
  assert.ok(["Rage", "Unarmored Defense", "Weapon Mastery"].every((n) => at(1).includes(n)));
  assert.ok(["Danger Sense", "Reckless Attack"].every((n) => at(2).includes(n)) && !at(1).includes("Danger Sense"));
  assert.ok(at(3).includes("Primal Knowledge") && !at(2).includes("Primal Knowledge"));
  assert.ok(["Extra Attack", "Fast Movement"].every((n) => at(5).includes(n)) && !at(4).includes("Fast Movement"));
  assert.ok(["Feral Instinct", "Instinctive Pounce"].every((n) => at(7).includes(n)) && !at(6).includes("Feral Instinct"));
  assert.ok(at(9).includes("Brutal Strike") && !at(8).includes("Brutal Strike") && !at(20).includes("Brutal Critical"));
  assert.ok(at(11).includes("Relentless Rage") && !at(10).includes("Relentless Rage"));
  assert.ok(at(15).includes("Persistent Rage") && !at(14).includes("Persistent Rage"));
  assert.ok(at(18).includes("Indomitable Might") && !at(17).includes("Indomitable Might"));
  assert.ok(at(19).includes("Epic Boon") && !at(18).includes("Epic Boon"));
  assert.ok(at(20).includes("Primal Champion") && !at(19).includes("Primal Champion"));
  for(const n of ["Weapon Mastery", "Brutal Strike", "Rage"]) assert.equal(at(20).filter((x) => x === n).length, 1, n);
  assert.equal(feature(barb(20), "Primal Champion").abilityMax, 25);
  assert.match(feature(barb(17), "Brutal Strike").text, /2d10/);
  assert.match(feature(barb(13), "Brutal Strike").text, /Sundering Blow/);
  assert.doesNotMatch(feature(barb(9), "Brutal Strike").text, /Sundering Blow/);
});

test("the Rages column: 2, 3, 4, 5, 6, and 6 at level 20 (p. 52)", () => {
  const cl = { name: "Barbarian", edition: "2024" };
  assert.deepEqual([1, 2, 3, 5, 6, 11, 12, 16, 17, 20].map((lv) => H.barbarianRageMax(lv, cl)), [2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  assert.deepEqual([1, 8, 9, 15, 16, 20].map((lv) => H.barbarianRageDamage(lv)), [2, 2, 3, 3, 4, 4]);
});

test("one rage back on a short rest", () => {
  const c = barb(5);
  c.rage.used = 2;
  assert.equal(H.rageOnShortRest(c), true);
  assert.equal(c.rage.used, 1);
  c.rage.used = 0;
  assert.equal(H.rageOnShortRest(c), false);
  const old = barb(5, "", "");
  old.rage.used = 2;
  assert.equal(H.rageOnShortRest(old), false);
  assert.equal(old.rage.used, 2);
});

test("Weapon Mastery: 2 melee kinds, then one more at levels 4 and 10", () => {
  const ed = classEdition({ name: "Barbarian", edition: "2024" });
  const pick = ed.level1.find((f) => f.name === "Weapon Mastery").profs.pick[0];
  assert.equal(pick.count, 2);
  assert.ok(pick.options.includes("Greataxe") && pick.options.includes("Handaxe") && pick.options.includes("Javelin"));
  for(const k of ["Longbow", "Shortbow", "Sling", "Dart", "Pistol", "Musket", "Heavy Crossbow", "Blowgun"]) assert.ok(!pick.options.includes(k), k);
  assert.equal(pick.options.length, Object.keys(WEAPON_MASTERY).length - 10);
  assert.deepEqual([4, 10].map((lv) => ed.features[lv].find((f) => f.name === "Weapon Mastery").profs.pick[0].count), [1, 1]);
  assert.ok(![16].some((lv) => (ed.features[lv] || []).some((f) => f.name === "Weapon Mastery")), "no more at 16");
});

test("a Strength attack, thrown too, gets Rage and Reckless; a 2014 throw doesn't", () => {
  const c = rage(reckless(barb(5, "", "2024", { inventory: [handaxe] })));
  reckless(c);
  assert.equal(H.rageDamageBonus(c, handaxe), 2);
  assert.equal(H.thrownAttack(c, handaxe), null, "the throw's numbers match the melee ones");
  const old = rage(barb(5, "", "", { inventory: [handaxe] }));
  assert.equal(H.thrownAttack(old, handaxe).damage, H.weaponDamageBonus(old, handaxe) - 2);
  assert.equal(attackRollMode(c, handaxe).mode, "adv");
});

test("Danger Sense and Feral Instinct always apply, not while incapacitated", () => {
  const c = barb(7);
  assert.equal(saveRollMode(c, "dex").mode, "adv");
  assert.equal(initiativeRollMode(c).mode, "adv");
  H.addCondition(c, "incapacitated");
  assert.notEqual(saveRollMode(c, "dex").mode, "adv");
  const old = barb(7, "", "");
  assert.equal(saveRollMode(old, "dex").mode, "none", "the 2014 one depends on the situation");
});

test("Primal Knowledge: five skills as Strength checks, with Rage's advantage, while raging", () => {
  const c = barb(3);
  assert.equal(skillCheck(c, "Perception").ability, "wis");
  rage(c);
  const p = skillCheck(c, "Perception");
  assert.equal(p.ability, "str");
  assert.equal(p.value, 4);
  assert.equal(p.roll.mode, "adv");
  assert.equal(skillCheck(c, "Insight").ability, "wis", "not on the list");
  assert.equal(passivePerception(c), 11, "a passive score isn't a check");
  c.abilities.str = 10;
  assert.equal(skillCheck(c, "Stealth").ability, "dex", "only when Strength is at least as good");
  const low = rage(barb(2));
  assert.equal(skillCheck(low, "Perception").ability, "wis", "from level 3");
  const old = rage(barb(3, "", ""));
  assert.equal(skillCheck(old, "Perception").ability, "wis");
});

test("the Rage ends when incapacitated, from 15 only unconscious, and with heavy armor", () => {
  const stunned = H.conditionDef("stunned"), out = H.conditionDef("unconscious");
  const c = rage(barb(5));
  assert.ok(H.conditionEndsRage(c, stunned));
  assert.ok(!H.conditionEndsRage(c, H.conditionDef("prone")));
  const pr = rage(barb(15));
  assert.ok(!H.conditionEndsRage(pr, stunned) && H.conditionEndsRage(pr, out));
  assert.ok(!H.conditionEndsRage(rage(barb(5, "", "")), stunned), "not the 2014 Rage");
  const a = rage(barb(5, "", "2024", { inventory: [plate] }));
  const res1 = H.tryEquip(a, a.inventory[0]);
  assert.ok(res1.ok && !a.rage.active);
  assert.match(res1.message, /Rage ends/);
});

test("Brutal Strike: from level 9, while reckless, 1d10 then 2d10 and two effects; no Brutal Critical", () => {
  assert.equal(H.brutalStrike(barb(8)), null);
  assert.equal(H.brutalStrike(barb(9)), null, "needs Reckless Attack");
  const at = (lv) => H.brutalStrike(reckless(barb(lv)));
  assert.deepEqual(at(9).effects.map((e) => e.name), ["Forceful Blow", "Hamstring Blow"]);
  assert.deepEqual(at(13).effects.map((e) => e.name), ["Forceful Blow", "Hamstring Blow", "Staggering Blow", "Sundering Blow"]);
  assert.deepEqual([at(9).dice, at(9).picks, at(17).dice, at(17).picks], [1, 1, 2, 2]);
  assert.equal(H.brutalCriticalDice(barb(20)), 0);
  assert.equal(H.brutalStrike(reckless(barb(9, "", ""))), null);
});

test("Relentless Rage brings you back on twice your level; Persistent Rage once per long rest", () => {
  const c = rage(barb(11));
  c.rage.relentless = true;
  c.hp.current = 0;
  assert.equal(H.relentlessRageDc(c), 10);
  assert.equal(H.resolveRelentlessRage(c, 12), "up");
  assert.equal(c.hp.current, 22);
  assert.equal(H.relentlessRageDc(c), 15);
  const p = barb(15);
  assert.ok(!H.persistentRageReady(p), "nothing to regain");
  p.rage.used = 3;
  assert.ok(H.persistentRageReady(p) && H.usePersistentRage(p));
  assert.equal(p.rage.used, 0);
  p.rage.used = 1;
  assert.ok(!H.persistentRageReady(p) && !H.usePersistentRage(p));
  const young = barb(14);
  young.rage.used = 1;
  assert.ok(!H.persistentRageReady(young));
});

test("the paths: the two with 2014 versions swap, the new ones are 2024 only", () => {
  assert.ok(classHasEdition("Barbarian", "2024"));
  const now = subclassesFor("Barbarian", "2024").map((s) => s.name);
  const old = subclassesFor("Barbarian", "2014").map((s) => s.name);
  for(const s of BARBARIAN_2024_SUBCLASSES) assert.ok(now.includes(s.name) && !old.includes(s.name), s.name);
  assert.ok(old.includes("Path of the Berserker") && !now.includes("Path of the Berserker"));
  assert.ok(now.includes("Path of the Totem Warrior") && old.includes("Path of the Totem Warrior"), "an older path stays open");
  assert.equal(now[0], BARBARIAN_2024_SUBCLASSES[0].name, "the edition's own first");
  const c = barb(5, "Path of the Zealot", "");
  setClassEdition(c, "Barbarian", true);
  assert.equal(c.classes[0].subclass, "Path of the Zealot (2024)");
  setClassEdition(c, "Barbarian", false);
  assert.equal(c.classes[0].subclass, "Path of the Zealot");
  const t = barb(5, "Path of the World Tree");
  setClassEdition(t, "Barbarian", false);
  assert.equal(t.classes[0].subclass, "", "no 2014 version: the sheet asks again");
  const w = barb(5, "Path of the Totem Warrior", "");
  setClassEdition(w, "Barbarian", true);
  assert.equal(w.classes[0].subclass, "Path of the Totem Warrior");
});

test("Berserker: Frenzy's dice, no exhaustion, Mindless Rage, Intimidating Presence's DC", () => {
  const S = "Path of the Berserker (2024)";
  const c = rage(barb(9, S));
  assert.ok(!H.canFrenzy(c), "no 2014 frenzy");
  assert.equal(H.frenzyDice(c), 0, "needs Reckless Attack");
  assert.equal(H.frenzyDice(reckless(c)), 3, "the Rage Damage bonus in d6s");
  assert.deepEqual(H.endRage(c), [], "no exhaustion");
  assert.equal(c.exhaustion || 0, 0);
  const m = barb(6, S);
  m.conditions = ["charmed", "frightened", "prone"];
  const notes = H.startRage(m);
  assert.deepEqual(m.conditions, ["prone"], "they end");
  assert.match(notes.join(), /Mindless Rage/);
  assert.equal(H.rageSuspends(m, "charmed"), "Mindless Rage");
  const r = res(barb(14, S), "Intimidating Presence");
  assert.equal(r.max, 1);
  assert.ok(r.rageRestore);
  assert.match(r.hint, /DC 17/, "8 + 4 STR + 5 proficiency");
  assert.ok(!res(barb(13, S), "Intimidating Presence"));
});

test("Wild Heart: rituals, choices each Rage, the aspect's speeds and darkvision", () => {
  const S = "Path of the Wild Heart";
  const c = barb(3, S);
  const f = feature(c, "Animal Speaker");
  assert.deepEqual(f.spells, ["Beast Sense", "Speak with Animals"]);
  assert.equal(f.spellKind, "ritual");
  assert.equal(f.spellAbility, "wis");
  assert.ok(!H.wildsChoiceDue(c, "wilds"), "not until raging");
  rage(c);
  assert.ok(H.wildsChoiceDue(c, "wilds") && !H.wildsChoiceDue(c, "power"));
  c.rage.wilds = "Bear";
  assert.ok(!H.wildsChoiceDue(c, "wilds"));
  assert.match(H.ragePerks(c)[0], /except force, necrotic, psychic & radiant/);
  H.endRage(c);
  assert.equal(c.rage.wilds, undefined, "asked again next Rage");
  const aspect = (name) => { const a = barb(6, S); a.classes[0].profPicks = { "sub:Path of the Wild Heart:Aspect of the Wilds@6": { slots: [[name]], applied: {} } }; return a; };
  assert.equal(H.wildAspect(aspect("Panther")), "Panther");
  assert.equal(computeSpeed(aspect("Panther")).others.find((o) => o.type === "climb").value, 30);
  assert.equal(computeSpeed(aspect("Salmon")).others.find((o) => o.type === "swim").value, 30);
  assert.equal(H.computeDarkvision(aspect("Owl")).range, 60);
  const seen = aspect("Owl"); seen.race = "Hill Dwarf";
  assert.equal(H.computeDarkvision(seen).range, 120, "60 feet more");
  const top = rage(barb(14, S));
  assert.ok(H.wildsChoiceDue(top, "power"));
  top.rage.wildsPower = "Falcon";
  assert.equal(computeSpeed(top).others.find((o) => o.type === "fly").value, computeSpeed(top).value);
  top.inventory = [{ id: "l", name: "Leather", type: "armor", category: "light", baseAC: 11, equipped: true, qty: 1 }];
  assert.ok(!computeSpeed(top).others.some((o) => o.type === "fly"), "not in armor");
});

test("World Tree: Vitality Surge, Life-Giving dice, the DC, Battering Roots, once-per-Rage teleport", () => {
  const S = "Path of the World Tree";
  const c = barb(9, S);
  const notes = H.startRage(c);
  assert.equal(c.hp.temp, 9);
  assert.match(notes.join(), /Vitality Surge: 9/);
  assert.equal(H.lifeGivingDice(c), 3);
  assert.equal(H.branchesDc(c), 8 + 4 + 4);
  const keep = barb(3, S);
  keep.hp.temp = 20;
  H.startRage(keep);
  assert.equal(keep.hp.temp, 20, "the higher stays");
  assert.ok(!H.batteringRoots(barb(9, S), axe));
  assert.ok(H.batteringRoots(barb(10, S), axe), "heavy");
  assert.ok(H.batteringRoots(barb(10, S), { name: "Longsword", type: "weapon" }), "versatile");
  assert.ok(!H.batteringRoots(barb(10, S), handaxe));
  assert.ok(!H.batteringRoots(barb(10, S), { name: "Heavy Crossbow", type: "weapon" }), "melee only");
  const t = rage(barb(14, S));
  assert.ok(H.longTravelReady(t));
  t.rage.longTravel = true;
  assert.ok(!H.longTravelReady(t));
});

test("Zealot: Divine Fury's type each time, the pool, Fanatical's bonus, the form, no Rage Beyond Death", () => {
  const S = "Path of the Zealot (2024)";
  const c = rage(barb(9, S));
  assert.deepEqual(H.divineFury(c), { bonus: 4, type: "", either: true });
  assert.equal(H.fanaticalBonus(c), 0 + 3);
  assert.deepEqual([3, 5, 6, 11, 12, 16, 17].map((lv) => res(barb(lv, S), "Warrior of the Gods").max), [4, 4, 5, 5, 6, 6, 7]);
  const pool = res(barb(3, S), "Warrior of the Gods");
  assert.ok(pool.pool && pool.roll.heal && pool.roll.die === 12);
  assert.equal(pool.reset, "long");
  assert.ok(res(barb(10, S), "Zealous Presence").rageRestore);
  const f = rage(barb(14, S));
  assert.ok(!H.rageBeyondDeath(f), "the 2014 feature");
  assert.ok(H.hasRageOfGods(f) && !H.divineFormOn(f));
  f.rage.gods = true;
  assert.ok(H.divineFormOn(f));
  assert.equal(computeSpeed(f).others.find((o) => o.type === "fly").source, "Rage of the Gods");
  assert.equal(H.revivificationHp(f), 14);
  assert.ok(H.ragePerks(f).some((p) => /necrotic, psychic & radiant/.test(p)));
  assert.ok(!H.ragePerks(f).some((p) => /Rage Beyond Death/.test(p)));
  H.rageAtZero(f);
  assert.ok(!H.divineFormOn(f), "0 HP ends the form");
});

test("spending a Rage on a feature", () => {
  const c = barb(1);
  c.rage.used = 1;
  assert.equal(H.ragesLeft(c), 1);
  assert.ok(H.spendRage(c));
  assert.equal(H.ragesLeft(c), 0);
  assert.ok(!H.spendRage(c));
});

test("the kit, the skills and a multiclass's proficiencies (p. 51)", () => {
  const g = BARBARIAN_2024.equipment.choiceGroups[0].options;
  assert.deepEqual(g.map((o) => o.coins.gp), [15, 75]);
  assert.deepEqual(g[0].items.map((i) => [i.name, i.qty]), [["Greataxe", 1], ["Handaxe", 4], ["Explorer's Pack", 1]]);
  assert.deepEqual(BARBARIAN_2024.skillChoices, { count: 2, options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] });
  assert.deepEqual(BARBARIAN_2024.multiclassProfs.weapons, ["Martial weapons"]);
  assert.deepEqual(BARBARIAN_2024.multiclassProfs.armor, ["Shields"]);
});

test("plain text: no long dashes or semicolons, Remember lines fit", () => {
  const all = [...BARBARIAN_2024.level1, ...Object.values(BARBARIAN_2024.features).flat(),
    ...BARBARIAN_2024_SUBCLASSES.flatMap((s) => Object.values(s.features).flat())];
  for(const f of all){
    assert.doesNotMatch(f.text, /[–—;]/, f.name);
    if(f.remind) assert.ok(f.remind.line.length <= 84, f.name);
  }
});
