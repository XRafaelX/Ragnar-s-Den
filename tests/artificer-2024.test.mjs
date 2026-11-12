/* The 2024 artificer (Eberron: Forge of the Artificer; artificer fix
   Phase 3, 2026-11-12), checked against 5etools' class-artificer.json
   (source EFA): the base class next to the Tasha's one. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as A from "../js/core/artificer.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { attunementLimit } from "../js/core/magic-items.js";
import { entryGrants } from "../js/core/class-picks.js";
import { cantripFormulas, swapCantripFormula, casterDef } from "../js/core/spells-known.js";
import { ARTIFICER_2024, TINKER_ITEMS } from "../js/data/artificer-2024.js";

const ABIL = { str: 10, dex: 14, con: 14, int: 18, wis: 12, cha: 8 };
function art(lv, edition = "2024", extra = {}){
  const c = newCharacter("A");
  c.classes = [{ name: "Artificer", subclass: lv >= 3 ? "Artillerist" : "", level: lv }];
  if(edition) c.classes[0].edition = edition;
  c.abilities = Object.assign({}, ABIL);
  c.hp = { max: 8 * lv, current: 8 * lv, temp: 0 };
  Object.assign(c, extra);
  return ensureShape(c);
}
const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
const res = (c, id) => H.characterResources(c).find((r) => r.key === "Artificer:" + id);

test("the 2024 artificer is a choice, with its own features", () => {
  assert.equal(H.classHasEdition("Artificer", "2024"), true);
  const f = names(art(20));
  ["Spellcasting", "Tinker's Magic", "Replicate Magic Item", "Magic Item Tinker", "Flash of Genius", "Magic Item Adept",
    "Spell-Storing Item", "Advanced Artifice", "Magic Item Master", "Epic Boon", "Soul of Artifice"].forEach((n) => assert.ok(f.includes(n), n));
  ["Infuse Item", "The Right Tool for the Job", "Tool Expertise", "Magical Tinkering"].forEach((n) => assert.ok(!f.includes(n), n + " is Tasha's only"));
  assert.ok(names(art(20, "")).includes("Tool Expertise"), "the Tasha's one keeps it");
  assert.equal(TINKER_ITEMS.length, 31);
  assert.equal(ARTIFICER_2024.series, "Eberron: Forge of the Artificer");
});

test("attunement 4, 5, 6; no Tool Expertise or old Soul of Artifice", () => {
  assert.deepEqual([9, 10, 14, 18].map((lv) => attunementLimit(art(lv))), [3, 4, 5, 6]);
  assert.equal(A.hasToolExpertise(art(6)), false);
  assert.equal(A.hasToolExpertise(art(6, "")), true);
  const c = art(20, "2024", { inventory: [{ id: "r", name: "Ring", attuned: true }] });
  assert.equal(A.soulOfArtificeBonus(c), 0, "the 2014 save bonus isn't the 2024 feature");
});

test("Flash of Genius: one back on a short rest from 14, all at 20 while attuned", () => {
  assert.equal(res(art(7), "flash_of_genius").reset, "long");
  const c14 = art(14);
  assert.equal(res(c14, "flash_of_genius").reset, "short");
  c14.resourcesUsed = { "Artificer:flash_of_genius": 3 };
  H.restoreResources(c14, "short");
  assert.equal(c14.resourcesUsed["Artificer:flash_of_genius"], 2, "Refreshed Genius: one back");
  const c20 = art(20, "2024", { inventory: [{ id: "r", name: "Ring", attuned: true }] });
  c20.resourcesUsed = { "Artificer:flash_of_genius": 3 };
  H.restoreResources(c20, "short");
  assert.equal(c20.resourcesUsed["Artificer:flash_of_genius"], undefined, "Magical Guidance: all back");
  const tasha = art(14, "");
  tasha.resourcesUsed = { "Artificer:flash_of_genius": 3 };
  H.restoreResources(tasha, "short");
  assert.equal(tasha.resourcesUsed["Artificer:flash_of_genius"], 3, "the Tasha's one waits for a long rest");
});

test("Tinker's Magic: INT uses, an item that vanishes on a long rest", () => {
  const c = art(1);
  assert.equal(res(c, "tinkers_magic").max, 4);
  assert.equal(res(art(1, ""), "tinkers_magic"), undefined, "2024 only");
  const rope = A.makeTinkerItem(c, "Rope");
  assert.equal(rope.name, "Rope, Hempen (50 feet)");
  assert.equal(rope.tinkered, true);
  assert.equal(res(c, "tinkers_magic").used, 1);
  A.makeTinkerItem(c, "Net");
  assert.ok(c.inventory.some((i) => i.name === "Net" && /restrained/.test(i.notes)));
  c.resourcesUsed["Artificer:tinkers_magic"] = 4;
  assert.equal(A.makeTinkerItem(c, "Torch"), null, "no uses left");
  c.inventory.push({ id: "own", name: "Torch", qty: 1 });
  assert.deepEqual(A.tinkerItemsOnLongRest(c).sort(), ["Net", "Rope, Hempen (50 feet)"]);
  assert.deepEqual(c.inventory.map((i) => i.name), ["Torch"], "your own torch stays");
});

test("Mending from Tinker's Magic, a cantrip swap after a long rest", () => {
  const c = art(3);
  assert.ok(H.featureSpells(c).some((s) => s.name === "Mending"), "Mending is granted");
  c.spells = [{ name: "Acid Splash", level: 0, learnedBy: "Artificer", prepared: true }, { name: "Guidance", level: 0, learnedBy: "Artificer", prepared: true }];
  const cf = cantripFormulas(c);
  assert.equal(cf.className, "Artificer");
  assert.deepEqual(cf.known, ["Acid Splash", "Guidance"]);
  assert.ok(cf.options.includes("Fire Bolt") && !cf.options.includes("Mending"), "Mending is already known");
  assert.equal(swapCantripFormula(c, "Guidance", "Fire Bolt"), true);
  assert.deepEqual(c.spells.map((s) => s.name), ["Acid Splash", "Fire Bolt"]);
  assert.equal(cantripFormulas(art(3, "")), null, "the Tasha's artificer swaps at a level-up");
  assert.equal(casterDef("Artificer", "", "2024").cantripSwap, undefined);
  assert.equal(casterDef("Artificer", "", "").cantripSwap, "level");
});

test("a 2024 artificer has no infusions; a multiclass picks a skill", () => {
  const c = art(6, "2024", { inventory: [{ id: "w", name: "Club", type: "weapon", magicBonus: 1 }] });
  c.infusions = { known: [{ id: "k", name: "Enhanced Weapon" }], active: [{ id: "a", knownId: "k", name: "Enhanced Weapon", itemId: "w", itemName: "Club", bonus: 1, wornSet: true }] };
  assert.equal(A.syncInfusions(c), true);
  assert.deepEqual(c.infusions.active, []);
  assert.equal(c.inventory[0].magicBonus, 0, "its +1 went with it");
  const mc = entryGrants({ name: "Artificer", level: 1, edition: "2024" }, true).find((g) => g.key === "multiclass");
  assert.ok(mc && mc.def.pick[0].kind === "skill" && mc.def.pick[0].options.includes("Sleight of Hand"));
  assert.equal(entryGrants({ name: "Artificer", level: 1 }, true).some((g) => g.key === "multiclass"), false, "Tasha's: no skill");
});

test("the artificer's hit die is a d8 (Tasha's and 2024)", async () => {
  const { HIT_DICE_BY_CLASS } = await import("../js/data/abilities-skills.js");
  assert.equal(HIT_DICE_BY_CLASS.Artificer, 8);
});
