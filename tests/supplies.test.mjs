/* "Track supplies and tools" in the creation wizard (js/core/supplies.js).
   Off by default: no packs, background gear or tool items, and no tool
   pickers (their picks are filled with the first option). Weapons,
   armor, ammunition, a spellcasting focus and coins always come along. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import * as W from "../js/wizard/wizard-core.js";
import { labelWithout, keptWithoutSupplies, loadTrackSupplies, saveTrackSupplies, toolOnlyPicks } from "../js/core/supplies.js";
import { CLASSES_INFO } from "../js/data/classes.js";
import { state } from "../js/core/state.js";
import { withFakeDom } from "./fake-dom.mjs";

function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], preset: "", profPicks: {}, feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Supplies test", classId: "Fighter", race: "Human", background: "Criminal", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Athletics", "Perception"],
    classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain", 1: "weapon_shield", 2: "crossbow", 3: "explorer" }, languageChoices: ["Elvish"]
  }, choices, { raceChoices: rc });
}
const inWizard = (t, choices, fn) => { let out; withFakeDom(t, () => { startWizard(choices); out = fn(); }); return out; };
const create = (t, choices) => inWizard(t, choices, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
const names = (c) => c.inventory.map((i) => i.name);

test("supplies: off by default, and the last choice is remembered", (t) => {
  localStorage.removeItem("ragnarsDen.trackSupplies.v1");
  assert.equal(inWizard(t, {}, () => W.wizardState.trackSupplies), false);
  saveTrackSupplies(true);
  assert.equal(loadTrackSupplies(), true);
  assert.equal(inWizard(t, {}, () => W.wizardState.trackSupplies), true);
  saveTrackSupplies(false);
  assert.equal(loadTrackSupplies(), false);
});

test("supplies: what stays without them", () => {
  assert.ok(keptWithoutSupplies({ name: "Longsword", type: "weapon" }));
  assert.ok(keptWithoutSupplies({ name: "Chain Mail", type: "armor" }));
  assert.ok(keptWithoutSupplies({ name: "Arrows", notes: "ammunition" }));
  assert.ok(keptWithoutSupplies({ name: "Holy Symbol" }) && keptWithoutSupplies({ name: "Arcane Focus (crystal)" }) && keptWithoutSupplies({ name: "Spellbook" }));
  assert.ok(keptWithoutSupplies({ name: "Component Pouch" }) && keptWithoutSupplies({ name: "Druidic Focus" }));
  assert.ok(!keptWithoutSupplies({ name: "Explorer's Pack" }) && !keptWithoutSupplies({ name: "Clothes, Common" }) && !keptWithoutSupplies({ name: "Herbalism Kit" }));
  assert.ok(!keptWithoutSupplies({ name: "Thieves' Tools" }, "Rogue"), "a rogue's tools are a supply");
  assert.ok(keptWithoutSupplies({ name: "Thieves' Tools" }, "Artificer"), "an artificer casts through them");
  assert.ok(keptWithoutSupplies({ name: "Lute" }, "Bard") && keptWithoutSupplies({ name: "Musical Instrument" }, "Bard"), "a bard's focus");
});

test("supplies: an option's label drops what isn't given", () => {
  assert.equal(labelWithout("Chain mail, greatsword, flail, 8 javelins, Dungeoneer's Pack and 4 gp", ["Dungeoneer's Pack"]),
    "Chain mail, greatsword, flail, 8 javelins and 4 gp");
  assert.equal(labelWithout("Studded leather, scimitar, shortsword, longbow, 20 arrows, quiver, Dungeoneer's Pack and 11 gp", ["Dungeoneer's Pack"]),
    "Studded leather, scimitar, shortsword, longbow, 20 arrows and 11 gp", "the quiver goes with it");
  assert.equal(labelWithout("Leather armor, sickle, 2 daggers, arcane focus (orb), book (occult lore), Scholar's Pack and 15 gp", ["Book (occult lore)", "Scholar's Pack"]),
    "Leather armor, sickle, 2 daggers, arcane focus (orb) and 15 gp");
  assert.equal(labelWithout("Spear, 5 daggers, your tool, Explorer's Pack and 11 gp", ["Explorer's Pack", "your tool"]), "Spear, 5 daggers and 11 gp");
  assert.equal(labelWithout("Greataxe", []), "Greataxe");
});

test("supplies off: a fighter's pack choice isn't asked or given, the rest is", (t) => {
  const groups = CLASSES_INFO.Fighter.equipment.choiceGroups;
  assert.deepEqual(inWizard(t, {}, () => groups.map((g) => W.wizardShowsGearGroup(g))), [true, true, true, false]);
  assert.equal(inWizard(t, { equipment: { 0: "chain", 1: "weapon_shield", 2: "crossbow" } }, () => W.validateStep("equipment")), null, "no pack to pick");
  const c = create(t, {});
  assert.ok(!names(c).includes("Explorer's Pack"));
  assert.ok(["Chain Mail", "Longsword", "Shield", "Light Crossbow", "Crossbow Bolts"].every((n) => names(c).includes(n)), names(c).join(", "));
  const on = create(t, { trackSupplies: true });
  assert.ok(names(on).includes("Explorer's Pack"));
  assert.equal(inWizard(t, { trackSupplies: true, equipment: { 0: "chain", 1: "weapon_shield", 2: "crossbow" } }, () => W.validateStep("equipment")),
    "Make a choice for each equipment option.");
});

test("supplies off: a 2024 fighter keeps the gear and coins of option A without the pack", (t) => {
  const c = create(t, { class2024: true, classChoices: {}, equipment: { 0: "a" } });
  assert.ok(!names(c).includes("Dungeoneer's Pack"));
  assert.ok(["Chain Mail", "Greatsword", "Flail", "Javelin"].every((n) => names(c).includes(n)), names(c).join(", "));
});

test("supplies off: a Criminal keeps the coins, gets a gaming set without being asked, and no crowbar", (t) => {
  assert.equal(inWizard(t, {}, () => W.validateStep("skills")), null, "the gaming set isn't asked");
  const c = create(t, {});
  const tools = CP.backgroundProficiencies(c).tools;
  assert.equal(tools[0], "Thieves' tools");
  assert.equal(tools.length, 2, "and a gaming set, picked for them");
  assert.ok(!CP.pendingClassPicks(c).length, "nothing left to pick");
  assert.ok(!names(c).includes("Crowbar") && !names(c).some((n) => /clothes/i.test(n)));
  assert.equal(c.currency.gp, 15);
  const on = create(t, { trackSupplies: true, bgPicks: { "bg:Criminal:pick": [["Dice set"]] } });
  assert.ok(names(on).includes("Crowbar"));
  assert.equal(on.currency.gp, 15);
});

test("supplies off: a background's weapon and holy symbol still come along", (t) => {
  const sailor = create(t, { background: "Sailor" });
  assert.ok(names(sailor).includes("Club"), "the belaying pin");
  assert.ok(!names(sailor).some((n) => /rope/i.test(n)));
  const acolyte = create(t, { background: "Acolyte" });
  assert.ok(names(acolyte).some((n) => /^Holy Symbol/.test(n)));
  assert.ok(!names(acolyte).includes("Vestments"));
});

test("supplies off: a hill dwarf's tool is picked without the Race Traits step", (t) => {
  assert.equal(inWizard(t, { race: "Hill Dwarf" }, () => W.isStepApplicable("raceChoices")), false);
  assert.equal(inWizard(t, { race: "Hill Dwarf", trackSupplies: true }, () => W.isStepApplicable("raceChoices")), true);
  const c = create(t, { race: "Hill Dwarf" });
  assert.deepEqual(CP.raceProficiencies(c).tools, ["Smith's tools"]);
});

test("supplies off: a warforged is still asked its skill, not its tool", (t) => {
  const grant = inWizard(t, { race: "Warforged" }, () => W.wizardRacePickGrants().find((g) => g.name === "Specialized Design"));
  assert.ok(!toolOnlyPicks(grant.def));
  const choices = { race: "Warforged", raceChoices: { abilities: ["str"], profPicks: { "race:Specialized Design:pick": [["Arcana"]] } } };
  assert.equal(inWizard(t, choices, () => W.validateStep("raceChoices")), null);
  const c = create(t, choices);
  assert.equal(c.skillProfs.Arcana.prof, true);
  assert.equal(CP.raceProficiencies(c).tools.length, 1);
});

test("supplies off: a bard's three instruments are picked, and the lute stays as the focus", (t) => {
  const bard = { classId: "Bard", classChoices: {}, skillChoices: ["Acrobatics", "Arcana", "History"], equipment: { 0: "rapier", 1: "diplomat", 2: "lute" } };
  assert.equal(inWizard(t, bard, () => W.isStepApplicable("choices")), false);
  const c = create(t, bard);
  assert.equal(H.classProficiencies(c, 0).tools.length, 3);
  assert.ok(names(c).includes("Lute"));
  assert.ok(!names(c).includes("Diplomat's Pack"));
});

test("supplies off: a rogue keeps the thieves' tools proficiency, not the item; an artificer keeps the item", (t) => {
  const rogue = create(t, { classId: "Rogue", classChoices: {}, skillChoices: ["Stealth", "Acrobatics", "Perception", "Insight"], equipment: {} });
  assert.ok(!names(rogue).includes("Thieves' Tools"));
  assert.ok(H.classProficiencies(rogue, 0).tools.includes("Thieves' tools"));
  const artificer = create(t, { classId: "Artificer", classChoices: {}, skillChoices: ["Arcana", "History"], equipment: {} });
  assert.ok(names(artificer).includes("Thieves' Tools"));
  assert.ok(!names(artificer).includes("Dungeoneer's Pack"));
});
