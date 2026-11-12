/* The 2024 artificer's Replicate Magic Item, Magic Item Tinker and Cheat
   Death (Eberron: Forge of the Artificer; artificer fix Phase 4,
   2026-11-12), checked against 5etools' data (source EFA), and what the
   new plan items do on the sheet. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as R from "../js/core/replicate.js";
import * as M from "../js/core/magic-items.js";
import { initiativeRollMode, skillCheck } from "../js/core/checks.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { makeCatalogMagicItem } from "../js/render/armory.js";
import { MAGIC_ITEM_DATA } from "../js/data/magic-items.js";
import { PLAN_TABLES, plansKnownAt, planItemsAt } from "../js/data/artificer-plans.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 8 };
const HALF = { 2: [2], 6: [4, 2], 10: [4, 3, 2], 20: [4, 3, 3, 3, 2] };
function art(lv, extra = {}){
  const c = newCharacter("A");
  c.classes = [{ name: "Artificer", subclass: lv >= 3 ? "Artillerist" : "", level: lv, edition: "2024" }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  c.spellcasting = { ability: "int", slots: {}, pact: null };
  for(let i = 1; i <= 9; i++) c.spellcasting.slots[i] = { max: (HALF[lv] || [2])[i - 1] || 0, used: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const make = (c, k, base) => R.makeReplica(c, k.id, makeCatalogMagicItem(c, k.item, MAGIC_ITEM_DATA[k.item], base));

test("the plan tables: every plan makes a real item, the counts by level", () => {
  assert.deepEqual(PLAN_TABLES.map((t) => [t.level, t.plans.length]), [[2, 16], [6, 22], [10, 11], [14, 7]]);
  PLAN_TABLES.forEach((t) => t.plans.forEach((p) => { if(!p.pick) assert.ok(MAGIC_ITEM_DATA[p.item || p.name], p.name); }));
  assert.deepEqual([1, 2, 5, 6, 10, 14, 18].map(plansKnownAt), [0, 4, 4, 5, 6, 7, 8]);
  assert.deepEqual([1, 2, 5, 6, 10, 14, 18].map(planItemsAt), [0, 2, 2, 3, 4, 5, 6]);
  // The tables' Attunement column.
  [["Manifold Tool", true], ["Repeating Shot", true], ["Returning Weapon", false], ["Helm of Awareness", false], ["Repulsion Shield", false],
    ["Dazzling Weapon", true], ["Mind Sharpener", true], ["Spell-Refueling Ring", true], ["Weapon of Warning", true], ["Shield, +1", false]]
    .forEach(([n, a]) => assert.equal(!!MAGIC_ITEM_DATA[n].attunement, a, n));
});

test("learning plans: by level, once each, a pick plan once per item", () => {
  const c = art(2);
  const opts = R.learnablePlans(c);
  assert.equal(opts.find((p) => p.name === "Bag of Holding").reason, "");
  assert.equal(opts.find((p) => p.name === "+1 Armor").reason, "artificer 6");
  assert.ok(R.learnPlan(c, "Bag of Holding"));
  assert.equal(R.learnPlan(c, "Bag of Holding"), null, "already known");
  assert.equal(R.learnPlan(c, "Flame Tongue"), null, "artificer 14");
  const jug = R.learnPlan(c, "Common magic item", "Clockwork Amulet");
  assert.equal(jug.item, "Clockwork Amulet", "a common item typed in");
  const c10 = art(10);
  assert.ok(R.pickOptions("uncommonWondrous").includes("Bag of Holding") && !R.pickOptions("uncommonWondrous").includes("Weapon, +1"));
  assert.ok(R.pickOptions("rareWondrous").every((n) => MAGIC_ITEM_DATA[n].rarity === "Rare" && !/curse/i.test(MAGIC_ITEM_DATA[n].text)));
  assert.ok(R.learnPlan(c10, "Uncommon wondrous item", "Boots of Striding and Springing"));
  assert.ok(R.learnPlan(c10, "Uncommon wondrous item", "Broom of Flying"), "learned again for another item");
  assert.equal(R.learnPlan(c10, "Uncommon wondrous item", "Broom of Flying"), null, "not the same item twice");
  assert.equal(R.learnPlan(c10, "Uncommon wondrous item", "Weapon, +1"), null, "not a wondrous item");
});

test("making items: a different plan each, the oldest vanishes past the limit, attuned at once", () => {
  const c = art(2);
  const bag = R.learnPlan(c, "Bag of Holding"), wand = R.learnPlan(c, "+1 Wand of the War Mage"), sword = R.learnPlan(c, "+1 Weapon");
  assert.ok(make(c, bag));
  assert.equal(make(c, bag), null, "one item per plan");
  const w = make(c, wand);
  assert.equal(R.replicaItem(c, w).attuned, true, "attuned the instant it's made");
  assert.equal(R.replicasToVanish(c).length, 1, "the next one makes the bag vanish");
  const s = make(c, sword, "Longsword");
  const blade = R.replicaItem(c, s);
  assert.deepEqual([blade.name, blade.type, blade.magicBonus, blade.replica], ["Longsword, +1", "weapon", 1, true]);
  assert.deepEqual(c.plans.made.map((m) => R.replicaItem(c, m).name), ["Wand of the War Mage, +1", "Longsword, +1"]);
  assert.ok(!c.inventory.some((i) => i.name === "Bag of Holding"), "the bag vanished");
  R.forgetPlan(c, wand.id);
  assert.ok(!c.inventory.some((i) => i.magicItem === "Wand of the War Mage, +1"), "forgetting a plan makes its item vanish");
  c.inventory = c.inventory.filter((i) => i.name !== "Longsword, +1");
  assert.equal(R.dropOrphanReplicas(c), true, "removed by hand: gone from the made list");
  assert.deepEqual(c.plans.made, []);
});

test("Magic Item Tinker: charge with a slot, drain into a slot once per long rest, transmute", () => {
  const c = art(6);
  const mm = R.learnPlan(c, "Wand of Magic Missiles"), helm = R.learnPlan(c, "Helm of Awareness"), jug = R.learnPlan(c, "Alchemy Jug");
  const m = make(c, mm), wand = R.replicaItem(c, m);
  wand.chargesUsed = 5;
  assert.equal(R.chargeReplica(c, m, { level: 2, pact: false }), 2);
  assert.deepEqual([wand.chargesUsed, c.spellcasting.slots[2].used], [3, 1]);
  assert.equal(R.drainLevel(c, m), 2, "uncommon: a 2nd-level slot");
  assert.equal(R.drainReplica(c, m), 2);
  assert.deepEqual([c.spellcasting.slots[2].max, c.spellcasting.slots[2].drained], [3, 1]);
  assert.ok(!c.inventory.some((i) => i.id === wand.id), "drained: it vanished");
  const h = make(c, helm);
  assert.equal(R.drainReplica(c, h), 0, "once per long rest");
  assert.equal(R.tinkerProblem(c, "drain"), "Used: again after a long rest");
  const t = R.transmuteReplica(c, h, jug.id, makeCatalogMagicItem(c, "Alchemy Jug", MAGIC_ITEM_DATA["Alchemy Jug"]));
  assert.equal(R.replicaItem(c, t).name, "Alchemy Jug");
  assert.ok(!c.inventory.some((i) => i.magicItem === "Helm of Awareness"));
  R.plansOnLongRest(c);
  assert.deepEqual([c.spellcasting.slots[2].max, c.spellcasting.slots[2].drained], [2, undefined], "the drained slot goes");
  assert.equal(R.tinkerProblem(c, "drain") + R.tinkerProblem(c, "transmute"), "");
  assert.equal(R.tinkerProblem(art(5), "drain"), "From artificer level 6");
  const big = art(14);
  const armor = R.learnPlan(big, "+2 Armor");
  assert.equal(R.drainLevel(big, make(big, armor, "Plate")), 0, "very rare: no slot");
});

test("Cheat Death at 20: uncommon or rare items, 20 hit points each", () => {
  const c = art(20);
  const a = R.learnPlan(c, "Bag of Holding"), b = R.learnPlan(c, "Flame Tongue"), m = R.learnPlan(c, "Manifold Tool");
  const ma = make(c, a), mb = make(c, b, "Longsword");
  make(c, m);
  assert.deepEqual(R.cheatDeathItems(c).map((x) => x.id), [ma.id, mb.id], "the common Manifold Tool doesn't count");
  c.hp.current = 0;
  assert.equal(R.cheatDeath(c, [ma.id, mb.id], 160), 40);
  assert.equal(c.plans.made.length, 1);
  assert.deepEqual(R.cheatDeathItems(art(19)), []);
});

test("the made items vanish when the character is no longer a 2024 artificer", () => {
  const c = art(6);
  make(c, R.learnPlan(c, "Bag of Holding"));
  delete c.classes[0].edition;
  assert.equal(R.syncPlans(c), true);
  assert.deepEqual([c.plans.made.length, c.inventory.length, c.plans.known.length], [0, 0, 1], "the plan stays known");
});

test("plan items on the sheet: initiative, skills, spell attack, unarmed strikes, the ring", () => {
  const c = art(10);
  const add = (n, base) => { const i = makeCatalogMagicItem(c, n, MAGIC_ITEM_DATA[n], base); c.inventory.push(i); return i; };
  assert.equal(initiativeRollMode(c).mode, "none");
  add("Helm of Awareness");
  assert.equal(initiativeRollMode(c).mode, "adv");
  c.inventory = [];
  const shield = add("Sentinel Shield");
  assert.equal(initiativeRollMode(c).mode, "none", "a shield in the pack does nothing");
  shield.equipped = true;
  assert.equal(initiativeRollMode(c).mode, "adv");
  assert.equal(skillCheck(c, "Perception").roll.mode, "adv");
  const before = skillCheck(c, "Sleight of Hand").value;
  add("Gloves of Thievery");
  assert.equal(skillCheck(c, "Sleight of Hand").value, before + 5);
  const wand = add("Wand of the War Mage, +2");
  assert.equal(M.magicItemSpellAttack(c), null, "not attuned yet");
  wand.attuned = true;
  assert.deepEqual(M.magicItemSpellAttack(c), { value: 2, name: "Wand of the War Mage, +2" });
  assert.equal(H.unarmedStrike(c), null);
  add("Wraps of Unarmed Power, +1");
  const u = H.unarmedStrike(c);
  assert.deepEqual([u.attack, u.bonus], [0 + 4 + 1, 0 + 1], "STR +0, proficiency +4, wraps +1");
  const ring = add("Spell-Refueling Ring");
  c.spellcasting.slots[2].used = 1;
  assert.deepEqual(M.ringRefuelLevels(c, ring), [], "attune first");
  ring.attuned = true;
  assert.deepEqual(M.ringRefuelLevels(c, ring), [2]);
  assert.equal(M.ringRefuel(c, ring, 2), true);
  assert.deepEqual(M.ringRefuelLevels(c, ring), [], "once until dawn");
  M.magicItemsOnLongRest(c);
  assert.equal(ring.refuelUsed, undefined);
});
