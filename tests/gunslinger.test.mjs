/* The Gunslinger fighter archetype (fan content): its features, trick
   shots and grit points, the firearms and fire lance it brings, the
   proficiencies it grants, Quickdraw's initiative and Sidearm Mastery. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CO from "../js/core/class-options.js";
import { OPTION_SOURCES, optionSetDef, optionsKnownAt, optionSetStart } from "../js/data/class-options.js";
import { optionMeta } from "../js/ui/option-picks.js";
import { SUBCLASSES } from "../js/data/progression.js";
import { WEAPON_DATA, WEAPON_GROUPS } from "../js/data/weapons.js";
import { FEATS_CATALOG } from "../js/data/feats.js";
import { newCharacter } from "../js/core/character.js";

const LONG_DASH = /[–—]/;
function gunslinger(level, extra = {}){
  const c = newCharacter("Test");
  c.classes = [{ name: "Fighter", subclass: "Gunslinger", level, options: extra.options || {} }];
  Object.assign(c.abilities, { str: 10, dex: 16, con: 14, int: 10, wis: 16, cha: 10 }, extra.abilities || {});
  Object.keys(extra).forEach((k) => { if(k !== "abilities" && k !== "options") c[k] = extra[k]; });
  return c;
}
const sub = SUBCLASSES.Fighter.find((s) => s.name === "Gunslinger");

test("Gunslinger: features at 3, 7, 10, 15 and 18 as the archetype lists them", () => {
  assert.ok(sub, "a fighter subclass");
  assert.deepEqual(Object.keys(sub.features).map(Number), [3, 7, 10, 15, 18]);
  const at = (l) => sub.features[l].map((f) => f.name);
  assert.deepEqual(at(3), ["Firearm Proficiency", "Gunsmith", "Adept Marksman"]);
  assert.deepEqual([at(7), at(10), at(15)], [["Quickdraw"], ["Rapid Repair"], ["Lightning Reload"]]);
  assert.deepEqual(at(18), ["Vicious Intent", "Hemorrhaging Critical"]);
  assert.ok(!LONG_DASH.test(JSON.stringify(sub)), "no long dashes");
});

test("Gunslinger: firearm and tinker's tools proficiency come with the archetype", () => {
  const prof = (level) => H.classProficiencies(gunslinger(level), 0);
  assert.ok(!prof(2).weapons.includes("Firearms"), "not before level 3 (no subclass features yet)");
  assert.ok(prof(3).weapons.includes("Firearms"));
  assert.ok(prof(3).tools.includes("Tinker's tools"));
  const c = gunslinger(3);
  assert.ok(H.isProficientWithWeapon(c, "Revolver", "firearm"));
  assert.ok(H.isProficientWithWeapon(c, "Pistol", "firearm"), "the DMG's firearms too");
  assert.ok(!H.isProficientWithWeapon(newCharacter("Plain"), "Revolver", "firearm"));
});

test("Gunslinger: trick shots, two at 3 and one more at 7, 10, 15 and 18, swapped only when learning", () => {
  const set = optionSetDef("trickShots");
  assert.deepEqual([2, 3, 6, 7, 10, 15, 18].map((l) => optionsKnownAt(set, l)), [0, 2, 2, 3, 4, 5, 6]);
  assert.equal(optionSetStart(set), 3);
  assert.equal(set.swap, "learn");
  assert.deepEqual([set.className, set.subclass], ["Fighter", "Gunslinger"]);
  assert.deepEqual(set.options.map((o) => o.name), ["Bullying Shot", "Dazing Shot", "Deadeye Shot", "Disarming Shot", "Forceful Shot", "Piercing Shot", "Violent Shot", "Winging Shot"]);
  assert.ok(set.options.every((o) => OPTION_SOURCES[o.source] && o.cost));
  assert.deepEqual(set.options.filter((o) => o.save).map((o) => [o.name, o.save]), [["Dazing Shot", "con"], ["Disarming Shot", "str"], ["Forceful Shot", "str"], ["Winging Shot", "str"]]);
  assert.equal(optionMeta(set.options.find((o) => o.name === "Violent Shot"), set), "1 or more grit points");
  assert.equal(optionMeta(set.options.find((o) => o.name === "Deadeye Shot"), set), "1 grit point");
  const c = gunslinger(3);
  const plans = (lv) => CO.levelUpOptionPlans(c, c.classes[0], "Fighter", "Gunslinger", lv).map((p) => [p.set.id, p.fresh, p.canSwap]);
  assert.deepEqual(plans(3), [["trickShots", 2, false]]);
  c.classes[0].options = { trickShots: [{ id: "a", name: "Deadeye Shot" }, { id: "b", name: "Winging Shot" }] };
  assert.deepEqual(plans(4), [], "nothing new at 4");
  assert.deepEqual(plans(7), [["trickShots", 1, true]], "a swap with the new one");
});

test("Gunslinger: grit points equal the WIS modifier (minimum 1), back on a short rest", () => {
  const grit = (level, wis) => H.characterResources(gunslinger(level, { abilities: { wis } })).find((r) => r.key === "Fighter:grit_points");
  assert.equal(grit(2, 16), undefined, "from level 3");
  assert.equal(grit(3, 16).max, 3);
  assert.equal(grit(3, 8).max, 1, "at least one");
  assert.equal(grit(3, 16).reset, "short");
  assert.equal(H.characterResources(newCharacter("Plain")).some((r) => r.key === "Fighter:grit_points"), false);
});

test("Gunslinger: Quickdraw adds the proficiency bonus to initiative from level 7", () => {
  const init = (level) => H.computeInitiative(gunslinger(level)).value;
  assert.equal(init(6), 3);
  assert.equal(init(7), 3 + 3, "DEX +3, proficiency +3");
  assert.match(H.computeInitiative(gunslinger(7)).breakdown, /Quickdraw/);
});

test("firearms: one pistol, revolver, pepperbox and musket with Reload and Misfire, and the fire lance", () => {
  const stats = (n) => [WEAPON_DATA[n].damageDice, WEAPON_DATA[n].weight, WEAPON_DATA[n].category];
  assert.deepEqual(stats("Pistol"), ["1d10", 1, "firearm"]);
  assert.deepEqual(stats("Revolver"), ["1d10", 3, "firearm"]);
  assert.deepEqual(stats("Pepperbox"), ["1d10", 5, "firearm"]);
  assert.deepEqual(stats("Musket"), ["1d12", 10, "firearm"]);
  assert.equal(WEAPON_DATA["Pistol"].properties, "Light, reload 1 (range 40/160), misfire 1");
  assert.equal(WEAPON_DATA.Revolver.properties, "Light, reload 4 (range 40/160), misfire 1");
  assert.equal(WEAPON_DATA.Pepperbox.properties, "Reload 6 (range 40/160), misfire 2");
  assert.equal(WEAPON_DATA["Musket"].properties, "Reload 1 (range 120/480), misfire 2, two-handed");
  assert.ok(["Pistol", "Revolver", "Pepperbox", "Musket"].every((n) => WEAPON_DATA[n].ranged && WEAPON_GROUPS.Firearms.includes(n)));
  assert.deepEqual(stats("Fire Lance"), ["1d10", 18, "martial"]);
  assert.ok(WEAPON_GROUPS["Martial Melee"].includes("Fire Lance"));
  assert.equal(WEAPON_DATA["Fire Lance"].properties, "Heavy, reach, special, two-handed");
  assert.deepEqual(WEAPON_GROUPS.Firearms, ["Pistol", "Revolver", "Pepperbox", "Musket"], "no duplicate pistol or musket");
});

test("Sidearm Mastery: +1 DEX and +2 damage with a one-handed firearm and no other weapon", () => {
  const feat = FEATS_CATALOG.find((f) => f.name === "Sidearm Mastery");
  assert.deepEqual([feat.ability, feat.prerequisite, feat.category, feat.source], [["dex"], "Proficiency in firearms", "Combat", "GUN"]);
  assert.ok(!LONG_DASH.test(JSON.stringify(feat)));
  const w = (name, extra = {}) => ({ id: name, name, type: "weapon", qty: 1, equipped: true, ability: "dex", proficient: true, magicBonus: 0, damageDice: "1d10", ...extra });
  const pistol = w("Pistol");
  const musket = w("Musket", { damageDice: "1d12", equipped: false });
  const c = gunslinger(3, { inventory: [pistol, musket] });
  assert.equal(H.weaponDamageBonus(c, pistol), 3, "without the feat: DEX only");
  c.feats = [{ name: "Sidearm Mastery" }];
  assert.equal(H.weaponDamageBonus(c, pistol), 3 + 2);
  assert.equal(H.weaponAttackBonus(c, pistol), 3 + 2, "attacks are unchanged");
  assert.equal(H.sidearmMasteryBonus(c, musket), 0, "two-handed");
  const sword = w("Longsword", { damageDice: "1d8", ability: "str" });
  c.inventory.push(sword);
  assert.equal(H.sidearmMasteryBonus(c, pistol), 0, "another weapon in hand");
  sword.equipped = false;
  assert.equal(H.sidearmMasteryBonus(c, pistol), 2);
  assert.equal(H.sidearmMasteryBonus(c, sword), 0, "not a firearm");
});
