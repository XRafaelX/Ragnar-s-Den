/* Class automation Phase 13, the Artificer (2026-10-30): every feature
   checked against Tasha's Cauldron on 5etools' data. Most were automated by
   the infusions and elixirs work; this phase adds Flash of Genius, Tool
   Expertise, Soul of Artifice, Arcane Jolt, the steel defender's Repair,
   Defensive Field's button, Chemical Mastery's wards and the spell-card
   notes. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as A from "../js/core/artificer.js";
import { infusionInitiative } from "../js/core/infusion-effects.js";
import { circleSpellNote } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 8 };
const HAMMER = { id: "h", name: "Warhammer", type: "weapon", qty: 1, equipped: true, ability: "str", proficient: true, magicBonus: 1, damageDice: "1d8", damageType: "Bludgeoning", category: "martial", props: [] };
function art(sub, lv, extra = {}){
  const c = newCharacter("A");
  c.classes = [{ name: "Artificer", subclass: sub, level: lv }];
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const res = (c, key) => H.characterResources(c).find((x) => x.key === key);

test("Flash of Genius: the INT modifier while a use is left", () => {
  const c = art("Alchemist", 7);
  assert.equal(A.flashOfGenius(c), 4);
  c.resourcesUsed = { "Artificer:flash_of_genius": 4 };
  assert.equal(A.flashOfGenius(c), 0);
  assert.equal(A.flashOfGenius(art("Alchemist", 6)), 0);
});

test("Tool Expertise from level 6", () => {
  assert.equal(A.hasToolExpertise(art("Alchemist", 5)), false);
  assert.equal(A.hasToolExpertise(art("Alchemist", 6)), true);
});

test("Soul of Artifice: +1 to every save per attuned item", () => {
  const c = art("Armorer", 20, { inventory: [{ id: "a", name: "Ring", attuned: true }, { id: "b", name: "Cloak", attuned: true }, { id: "x", name: "Rope" }] });
  const plain = art("Armorer", 19, { inventory: c.inventory });
  assert.equal(A.soulOfArtificeBonus(c), 2);
  assert.equal(H.computeSave(c, "wis").value, H.computeSave(plain, "wis").value + 2 + 0);
  assert.equal(A.soulOfArtificeReady(c), false, "needs an infusion to end");
  c.infusions = { known: [], active: [{ id: "i", name: "Enhanced Defense" }] };
  assert.equal(A.soulOfArtificeReady(c), true);
});

test("Arcane Jolt: magic weapons only, 2d6 then 4d6, paid with a use", () => {
  const c = art("Battle Smith", 9);
  assert.equal(A.artificerHitDice(c, HAMMER)[0].qty, 2);
  assert.equal(A.artificerHitDice(c, HAMMER)[0].pay, "Artificer:arcane_jolt");
  assert.deepEqual(A.artificerHitDice(c, Object.assign({}, HAMMER, { magicBonus: 0 })), []);
  assert.equal(A.artificerHitDice(art("Battle Smith", 15), HAMMER)[0].qty, 4);
  assert.deepEqual(A.artificerHitDice(art("Battle Smith", 8), HAMMER), []);
  c.resourcesUsed = { "Artificer:arcane_jolt": 4 };
  assert.deepEqual(A.artificerHitDice(c, HAMMER), []);
});

test("Repair rolls 2d8 + PB, a cannon after the free one takes a slot", () => {
  assert.deepEqual([res(art("Battle Smith", 5), "Artificer:steel_defender_repair").roll.qty, res(art("Battle Smith", 5), "Artificer:steel_defender_repair").roll.bonus], [2, 3]);
  assert.equal(res(art("Artillerist", 3), "Artificer:eldritch_cannon").slotMin, 1);
});

test("Chemical Mastery's resistances and immunity", () => {
  const c = art("Alchemist", 15);
  assert.ok(H.featureResistances(c).some((r) => r.type === "acid"));
  assert.ok(H.raceWards(c).conditionImmune.some((w) => w.type === "poisoned"));
});

test("spell cards: Alchemical Savant and Arcane Firearm", () => {
  assert.match(circleSpellNote(art("Alchemist", 5), "Cure Wounds"), /Alchemical Savant: .* add 4/);
  assert.match(circleSpellNote(art("Alchemist", 5), "Fire Bolt"), /Alchemical Savant/);
  assert.equal(circleSpellNote(art("Alchemist", 5), "Catapult"), "", "bludgeoning isn't one of its types");
  assert.match(circleSpellNote(art("Artillerist", 5), "Catapult"), /Arcane Firearm/);
  assert.equal(circleSpellNote(art("Artillerist", 4), "Catapult"), "");
  assert.equal(circleSpellNote(art("Artillerist", 5), "Thunderwave"), "", "not an artificer spell");
});

/* Armor Modifications (Armorer 9, Tasha's; artificer fix Phase 1,
   2026-11-12): the Arcane Armor's chest piece, boots, helmet and special
   weapon each take an infusion, and two more items can be infused, but
   only armor parts. */
const PLATE = () => ({ id: "p", name: "Plate", type: "armor", category: "heavy", baseAC: 18, equipped: true });
function armorer(lv, extra = []){
  const c = art("Armorer", lv, { inventory: [PLATE(), ...extra] });
  c.classes[0].armorModel = "Guardian";
  c.infusions = { known: [], active: [] };
  const learn = (name) => { const k = { id: "k" + c.infusions.known.length, name, note: "" }; c.infusions.known.push(k); return k; };
  return { c, learn };
}

test("Armor Modifications: the parts are offered from Armorer 9, only while the armor is worn", () => {
  const winding = { target: "boots" }, helm = { target: "helmet" }, weapon = { target: "weapon" }, shield = { target: "shield" };
  assert.deepEqual(A.armorPartOptions(armorer(8).c, winding), [], "not before level 9");
  const { c } = armorer(9);
  assert.deepEqual(A.armorPartOptions(c, winding).map((o) => o.label), ["Arcane Armor boots"]);
  assert.deepEqual(A.armorPartOptions(c, helm).map((o) => o.label), ["Arcane Armor helmet"]);
  assert.deepEqual(A.armorPartOptions(c, weapon).map((o) => o.label), ["Arcane Armor weapon"]);
  assert.deepEqual(A.armorPartOptions(c, shield), []);
  c.inventory[0].equipped = false;
  assert.deepEqual(A.armorPartOptions(c, winding), [], "no worn armor, no parts");
  assert.deepEqual(A.infusionLimits(armorer(9).c), { total: 5, parts: 2, general: 3 });
  assert.deepEqual(A.infusionLimits(armorer(8).c), { total: 3, parts: 0, general: 3 });
});

test("Armor Modifications: a part is an item while infused, one infusion each, gone when it ends", () => {
  const { c, learn } = armorer(10);
  const boots = A.infuseItem(c, learn("Boots of the Winding Path"), { part: "boots" }, 6);
  assert.equal(boots.part, "boots");
  const item = c.inventory.find((i) => i.id === boots.itemId);
  assert.equal(item.name, "Arcane Armor boots");
  assert.equal(item.partOf, "p");
  assert.equal(item.attuned, true, "attuned on infusing (it requires attunement)");
  assert.equal(A.armorPartOptions(c, { target: "boots" })[0].reason, "has Boots of the Winding Path");
  assert.equal(A.infuseItem(c, learn("Boots of the Winding Path"), { part: "boots" }, 6), null, "one infusion per part");
  assert.equal(A.infusionTargets(c, { target: "boots" }).length, 0, "the part isn't listed again as a plain item");
  A.endInfusion(c, boots);
  assert.ok(!c.inventory.some((i) => i.armorPart), "ending it removes the part item");
  // The chest piece is the worn armor itself.
  const chest = A.infuseItem(c, learn("Enhanced Defense"), { itemId: "p" }, 6);
  assert.equal(chest.part, "chest");
});

test("Armor Modifications: the two extra items must be armor parts", () => {
  const extra = ["a", "b", "c", "d"].map((id) => ({ id, name: "Club " + id, type: "weapon", qty: 1 }));
  const { c, learn } = armorer(9, extra);
  // Artificer 9: 3 items, plus 2 for armor parts = 5.
  ["a", "b", "c"].forEach((id) => A.infuseItem(c, learn("Enhanced Weapon"), { itemId: id }, 5));
  A.infuseItem(c, learn("Boots of the Winding Path"), { part: "boots" }, 5);
  A.infuseItem(c, learn("Enhanced Weapon"), { part: "weapon" }, 5);
  assert.equal(c.infusions.active.length, 5, "three items and two parts");
  // A fourth plain item ends the oldest plain one, not a part.
  assert.deepEqual(A.infusionsToEnd(c, false, 5).map((a) => a.itemName), ["Club a"]);
  A.infuseItem(c, learn("Enhanced Weapon"), { itemId: "d" }, 5);
  assert.deepEqual(c.infusions.active.map((a) => a.itemName), ["Club b", "Club c", "Arcane Armor boots", "Arcane Armor weapon", "Club d"]);
  // Full: another part ends the oldest infusion of any kind.
  assert.deepEqual(A.infusionsToEnd(c, true, 5).map((a) => a.itemName), ["Club b"]);
  A.infuseItem(c, learn("Helm of Awareness"), { part: "helmet" }, 5);
  assert.equal(c.infusions.active.length, 5);
  assert.ok(!c.inventory.find((i) => i.id === "b").magicBonus, "Club b lost its +1");
});

test("Armor Modifications: an infused weapon adds to the armor's weapon, and stays when the model changes", () => {
  const { c, learn } = armorer(10);
  const before = A.armorModelWeapon(c);
  A.infuseItem(c, learn("Enhanced Weapon"), { part: "weapon" }, 6);
  const gauntlets = A.armorModelWeapon(c);
  assert.equal(gauntlets.toHit, before.toHit + 2, "+2 from artificer level 10");
  assert.equal(gauntlets.damageBonus, before.damageBonus + 2);
  assert.equal(gauntlets.infusion, "Enhanced Weapon");
  A.setArmorModel(c, "Infiltrator");
  const launcher = A.armorModelWeapon(c);
  assert.equal(launcher.name, "Lightning Launcher");
  assert.equal(launcher.magic, 2, "the infusion carries over to the new model's weapon");
});

test("Armor Modifications: parts go with the armor, and end below Armorer 9", () => {
  const { c, learn } = armorer(9);
  A.infuseItem(c, learn("Enhanced Defense"), { itemId: "p" }, 5);
  A.infuseItem(c, learn("Helm of Awareness"), { part: "helmet" }, 5);
  c.classes[0].level = 8;
  A.syncInfusions(c);
  assert.deepEqual(c.infusions.active.map((a) => [a.itemName, a.part || ""]), [["Plate", ""]], "the helmet's infusion ends, the chest piece stays as plain armor");
  assert.ok(!c.inventory.some((i) => i.armorPart));
  c.classes[0].level = 9;
  A.infuseItem(c, learn("Helm of Awareness"), { part: "helmet" }, 5);
  c.inventory = c.inventory.filter((i) => i.id !== "p");
  assert.equal(A.dropOrphanInfusions(c), true);
  assert.deepEqual(c.inventory, [], "the helmet went with the armor");
  assert.deepEqual(c.infusions.active, []);
});

test("Armor Modifications: a helmet part works only while its armor is worn", () => {
  const { c, learn } = armorer(10);
  A.infuseItem(c, learn("Helm of Awareness"), { part: "helmet" }, 6);
  assert.equal(infusionInitiative(c).mode, "adv");
  c.inventory[0].equipped = false;
  assert.equal(infusionInitiative(c), null, "armor off: no advantage");
});

/* Artificer fix Phase 2 (2026-11-12): worn or held infusions, Tasha's
   firearm proficiency. */
import { infusionSpellAttack, infusionWornProblem } from "../js/core/infusion-effects.js";
function infuser(lv, inventory){
  const c = art("Artillerist", lv, { inventory });
  c.infusions = { known: [], active: [] };
  const learn = (name) => { const k = { id: "k" + c.infusions.known.length, name, note: "" }; c.infusions.known.push(k); return k; };
  return { c, learn };
}

test("Helm of Awareness: put on when infused, advantage only while worn", () => {
  const { c, learn } = infuser(10, []);
  const a = A.infuseItem(c, learn("Helm of Awareness"), { newItem: "Helmet" }, 4);
  const helm = c.inventory.find((i) => i.id === a.itemId);
  assert.equal(helm.equipped, true, "the new helmet is put on");
  assert.equal(infusionInitiative(c).mode, "adv");
  helm.equipped = false;
  assert.equal(infusionInitiative(c), null, "taken off: no advantage");
  assert.equal(infusionWornProblem(c, helm, a), "Wear it (Equip) to use its magic");
});

test("Enhanced Arcane Focus: held in a free hand, the bonus only while held", () => {
  const { c, learn } = infuser(10, [{ id: "g", name: "Greatsword", type: "weapon", notes: "heavy, two-handed", equipped: true, qty: 1 }]);
  const a = A.infuseItem(c, learn("Enhanced Arcane Focus"), { newItem: "Arcane Focus (wand)" }, 4);
  const wand = c.inventory.find((i) => i.id === a.itemId);
  assert.equal(wand.equipped, false, "both hands are full: not picked up");
  assert.equal(infusionSpellAttack(c), null);
  assert.equal(infusionWornProblem(c, wand, a), "Hold it (Equip) to use its magic");
  c.inventory[0].equipped = false;
  assert.equal(H.tryEquip(c, wand).ok, true);
  assert.equal(H.itemHands(wand), 1, "a held wand takes a hand");
  assert.deepEqual(infusionSpellAttack(c), { value: 2, name: "Enhanced Arcane Focus" });
  assert.equal(H.tryEquip(c, c.inventory[0]).ok, false, "no room left for a two-handed sword");
});

test("worn or held: an older save's carried helmet is put on once", () => {
  const { c } = infuser(10, [{ id: "h", name: "Helmet", type: "gear", qty: 1 }]);
  c.infusions.known.push({ id: "k0", name: "Helm of Awareness", note: "" });
  c.infusions.active.push({ id: "a", knownId: "k0", name: "Helm of Awareness", itemId: "h", itemName: "Helmet", bonus: 0, attunement: true });
  c.inventory[0].attuned = true;
  assert.equal(A.syncInfusions(c), true);
  assert.equal(c.inventory[0].equipped, true);
  assert.equal(c.infusions.active[0].wornSet, true);
  c.inventory[0].equipped = false;
  A.syncInfusions(c);
  assert.equal(c.inventory[0].equipped, false, "only once: taking it off later sticks");
});

test("Tasha's firearm proficiency: artificers only, with the switch", () => {
  const c = art("Artillerist", 3);
  assert.equal(H.isProficientWithWeapon(c, "Pistol", "firearm"), false);
  c.artificerFirearms = true;
  assert.equal(H.isProficientWithWeapon(c, "Pistol", "firearm"), true);
  assert.equal(H.isProficientWithWeapon(c, "Longsword", "martial"), false, "only firearms");
  const f = newCharacter("F");
  f.classes = [{ name: "Fighter", subclass: "", level: 3 }];
  f.artificerFirearms = true;
  assert.equal(H.isProficientWithWeapon(ensureShape(f), "Pistol", "firearm"), false, "not without artificer levels");
});
