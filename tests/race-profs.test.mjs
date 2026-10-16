/* Race proficiencies: the skills, weapons, tools and armor a race's traits
   give or let the player choose (`profs` on traits in RACE_DATA, run by
   js/core/class-picks.js). The data, what the sheet applies on its own,
   older characters, each kind of choice, the Feature choices card and the
   creation wizard's Race Traits step. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import * as W from "../js/wizard/wizard-core.js";
import { TOOL_GROUPS } from "../js/core/feat-picks.js";
import { RACE_DATA, DRACONIC_ANCESTRIES } from "../js/data/race-data.js";
import { draconicBreathText, draconicBreath } from "../js/core/class-features.js";
import { characterResources, restoreResources } from "../js/core/character-resources.js";
import { RACE_CHOICES } from "../js/data/races.js";
import { SKILLS } from "../js/data/abilities-skills.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { renderClassPicksCard } from "../js/render/panels/class-picks.js";
import { withFakeDom } from "./fake-dom.mjs";

const SKILL_NAMES = SKILLS.map((s) => s[0]);
const ALL_TOOLS = Object.values(TOOL_GROUPS).flat();

function makeChar(race, classes = [{ name: "Wizard", subclass: "", level: 1 }], extra = {}){
  const c = newCharacter("Test");
  c.race = race;
  c.classes = classes;
  Object.assign(c, extra);
  return c;
}
/* An older save: no c.racePicks yet, so loading it migrates. */
function oldSave(race, classes, extra = {}){
  const c = makeChar(race, classes, extra);
  delete c.racePicks;
  return ensureShape(JSON.parse(JSON.stringify(c)));
}
const raceGrant = (c, name, pick = true) => {
  const g = CP.raceGrants(c).find((x) => x.name === name && /:pick$/.test(x.key) === pick);
  assert.ok(g, "no race grant " + name);
  g.cl = CP.raceEntry(c);
  return g;
};
const open = (c, g, i, slots = []) => CP.slotOptions(g.def, slots, i, CP.classPickContext(c, g.cl, g.key)).filter((o) => !o.reason).map((o) => o.value);

/* ================================================================
   Data
   ================================================================ */
test("race profs data: real skills, weapons and tools; known pick kinds", () => {
  let traits = 0;
  for(const [race, d] of Object.entries(RACE_DATA)){
    for(const t of d.traits || []){
      if(!t.profs) continue;
      traits++;
      const where = race + ": " + t.name;
      for(const k of Object.keys(t.profs)) assert.ok(["skills", "weapons", "tools", "pick", "presetChoice"].includes(k), where + ": unknown field " + k);
      (t.profs.skills || []).forEach((s) => assert.ok(SKILL_NAMES.includes(s), where + ": skill " + s));
      (t.profs.weapons || []).forEach((w) => assert.ok(WEAPON_DATA[w], where + ": weapon " + w));
      (t.profs.tools || []).forEach((v) => assert.ok(ALL_TOOLS.includes(v), where + ": tool " + v));
      for(const slot of t.profs.pick || []){
        assert.ok(["skill", "tool", "weapon", "skillOrTool", "choice"].includes(slot.kind), where + ": kind " + slot.kind);
        if(slot.kind === "choice"){ assert.ok(slot.id && slot.noun && slot.options.length >= 2, where + ": choice"); continue; }
        if(slot.byChoice){
          const choice = t.profs.pick[slot.byChoice.slot];
          assert.equal(choice.kind, "choice", where + ": byChoice points at a choice");
          Object.keys(slot.byChoice.options).forEach((k) => assert.ok(choice.options.includes(k), where + ": " + k));
          Object.values(slot.byChoice.options).flat().forEach((v) => assert.ok(SKILL_NAMES.includes(v), where + ": skill " + v));
          continue;
        }
        if(slot.kind === "skill") (slot.options || []).forEach((s) => assert.ok(SKILL_NAMES.includes(s), where + ": skill " + s));
        if(slot.kind === "tool"){
          (slot.options || []).forEach((v) => assert.ok(ALL_TOOLS.includes(v), where + ": tool " + v));
          if(slot.group) assert.ok(TOOL_GROUPS[slot.group], where + ": group " + slot.group);
        }
        if(slot.kind === "weapon") assert.equal(slot.filter, "martial", where);
        if(slot.count != null) assert.ok(slot.count > 1 && (!slot.options || slot.options.length > slot.count), where + ": count");
      }
    }
  }
  assert.ok(traits >= 30, "about thirty traits give proficiencies, got " + traits);
  // Choices that moved onto the traits are gone from RACE_CHOICES.
  for(const [race, def] of Object.entries(RACE_CHOICES)) assert.ok(!def.skills && !def.tools && !def.skillOptions, race + ": skills/tools now live on its traits");
});

test("race profs data: who gets what (the table checked with the user)", () => {
  const fixed = (race) => CP.raceProficiencies(makeChar(race));
  for(const race of ["High Elf", "Wood Elf", "Dark Elf (Drow)", "Eladrin", "Sea Elf", "Shadar-kai", "Shifter", "Harengon"]) assert.ok(fixed(race).skills.includes("Perception"), race + " Perception");
  assert.deepEqual(fixed("Half-Orc").skills, ["Intimidation"]);
  assert.deepEqual(fixed("Tabaxi").skills, ["Perception", "Stealth"]);
  assert.deepEqual(fixed("Satyr").skills, ["Performance", "Persuasion"]);
  for(const race of ["Hill Dwarf", "Mountain Dwarf", "Duergar"]) assert.deepEqual(fixed(race).weapons, ["Battleaxe", "Handaxe", "Light Hammer", "Warhammer"], race);
  assert.deepEqual(fixed("Dark Elf (Drow)").weapons, ["Rapier", "Shortsword", "Hand Crossbow"]);
  assert.deepEqual(fixed("Gith (Githyanki)").weapons, ["Shortsword", "Longsword", "Greatsword"]);
  assert.deepEqual(fixed("Gith (Githyanki)").armor, ["Light armor", "Medium armor"]);
  assert.deepEqual(fixed("Rock Gnome").tools, ["Tinker's tools"]);
  // A duergar is a dwarf: the dwarf's own traits, and still Unslowed.
  const duergar = RACE_DATA["Duergar"].traits.map((t) => t.name);
  ["Dwarven Combat Training", "Tool Proficiency", "Stonecunning", "Unslowed", "Duergar Magic"].forEach((n) => assert.ok(duergar.includes(n), "Duergar " + n));
  // Races with nothing of the kind give nothing.
  for(const race of ["Human", "Dragonborn", "Tiefling", "Goblin"]) assert.deepEqual(fixed(race), { skills: [], weapons: [], tools: [], armor: [] }, race);
});

/* ================================================================
   What the sheet applies on its own
   ================================================================ */
test("given outright: an elf's Perception and weapons, on a new and an older sheet", () => {
  const c = ensureShape(makeChar("High Elf"));
  assert.equal(c.skillProfs.Perception.prof, true, "Keen Senses");
  assert.ok(H.isProficientWithWeapon(c, "Longbow", "martial"), "Elf Weapon Training");
  assert.ok(H.isProficientWithWeapon(c, "Longsword", "martial"));
  assert.ok(!H.isProficientWithWeapon(c, "Greataxe", "martial"));
  // An older elf: the bow already carried is marked proficient too.
  const bow = { id: "b1", type: "weapon", name: "Longbow", proficient: false, equipped: true };
  const old = oldSave("Wood Elf", [{ name: "Wizard", subclass: "", level: 3 }], { inventory: [bow] });
  assert.equal(old.skillProfs.Perception.prof, true);
  assert.equal(old.inventory[0].proficient, true);
  // Loading again changes nothing more.
  const again = ensureShape(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(again.racePicks, old.racePicks);
});

test("given outright: a skill already ticked stays, and nothing is taken back that wasn't given", () => {
  const c = makeChar("Half-Orc");
  c.skillProfs.Intimidation = { prof: true, expertise: true };
  ensureShape(c);
  assert.deepEqual(c.racePicks.profPicks["race:Menacing"].applied.skills, [], "already proficient: nothing recorded");
  assert.equal(c.skillProfs.Intimidation.expertise, true);
});

test("weapon proficiency: armor and the Information tab's lists see the race", () => {
  const dwarf = ensureShape(makeChar("Mountain Dwarf"));
  assert.ok(H.isProficientWithArmor(dwarf, { category: "medium" }), "Dwarven Armor Training");
  assert.ok(H.isProficientWithWeapon(dwarf, "Warhammer", "martial"));
  const sea = ensureShape(makeChar("Sea Elf"));
  assert.ok(H.isProficientWithWeapon(sea, "Trident", "martial"));
  assert.ok(H.isProficientWithWeapon(sea, "Net", "martial"));
});

/* ================================================================
   Choices
   ================================================================ */
test("a dwarf's tool: three to pick from, one already had greyed, applied and taken back", () => {
  const c = ensureShape(makeChar("Hill Dwarf"));
  const g = raceGrant(c, "Tool Proficiency");
  assert.deepEqual(open(c, g, 0), ["Smith's tools", "Brewer's supplies", "Mason's tools"]);
  assert.equal(CP.slotLabel(g.def, [], 0, CP.classPickContext(c, g.cl, g.key)), "Gain proficiency with smith's tools, brewer's supplies or mason's tools");
  assert.ok(CP.pendingClassPicks(c).some((x) => x.key === g.key), "waits on the Feature choices card");
  CP.applyClassPicks(c, g.cl, g, [["Mason's tools"]]);
  assert.ok(CP.raceProficiencies(c).tools.includes("Mason's tools"));
  assert.match(H.getAllCharacterFeatures(c).find((f) => f.id === "race_Hill Dwarf").text, /Your picks: Tool Proficiency: Mason's tools\./);
  assert.ok(!CP.pendingClassPicks(c).some((x) => x.key === g.key));
  CP.revertClassPicks(c, g.cl, g.key);
  assert.ok(!CP.raceProficiencies(c).tools.includes("Mason's tools"));
});

test("a kenku's two skills: from its list, a skill already had greyed out", () => {
  const c = ensureShape(makeChar("Kenku", undefined, {}));
  c.skillProfs.Stealth = { prof: true, expertise: false };
  const g = raceGrant(c, "Kenku Training");
  assert.deepEqual(open(c, g, 0), ["Acrobatics", "Deception", "Sleight of Hand"]);
  assert.match(CP.classPicksProblem(g, [["Acrobatics"]], CP.classPickContext(c, g.cl, g.key)), /^Choose 2 different skills for Kenku Training\.$/);
  CP.applyClassPicks(c, g.cl, g, [["Acrobatics", "Deception"]]);
  assert.equal(c.skillProfs.Acrobatics.prof, true);
  assert.equal(c.skillProfs.Deception.prof, true);
});

test("a hobgoblin's two martial weapons: only martial ones, none for a fighter who has them all", () => {
  const wiz = ensureShape(makeChar("Hobgoblin"));
  const g = raceGrant(wiz, "Martial Training");
  const opts = open(wiz, g, 0);
  assert.ok(opts.includes("Longsword") && opts.includes("Longbow"));
  assert.ok(!opts.includes("Dagger"), "simple weapons aren't offered");
  assert.equal(CP.slotLabel(g.def, [], 0, CP.classPickContext(wiz, g.cl, g.key)), "Gain proficiency with 2 martial weapons of your choice");
  const sword = { id: "s1", type: "weapon", name: "Longsword", proficient: false };
  wiz.inventory = [sword];
  CP.applyClassPicks(wiz, g.cl, g, [["Longsword", "Longbow"]]);
  assert.equal(sword.proficient, true, "a carried weapon becomes proficient");
  assert.ok(H.isProficientWithWeapon(wiz, "Longbow", "martial"));
  const fighter = ensureShape(makeChar("Hobgoblin", [{ name: "Fighter", subclass: "", level: 1 }]));
  const fg = raceGrant(fighter, "Martial Training");
  assert.deepEqual(open(fighter, fg, 0), [], "a fighter already uses every martial weapon");
  assert.equal(CP.classPicksProblem(fg, [], CP.classPickContext(fighter, fg.cl, fg.key)), "", "nothing to choose");
});

test("a githyanki's skill or tool, a satyr's instrument, a warforged's skill and any tool", () => {
  const gith = ensureShape(makeChar("Gith (Githyanki)"));
  const g = raceGrant(gith, "Decadent Mastery");
  const opts = open(gith, g, 0);
  assert.ok(opts.includes("Arcana") && opts.includes("Thieves' tools"), "skills and tools together");
  CP.applyClassPicks(gith, g.cl, g, [["Thieves' tools"]]);
  assert.ok(CP.raceProficiencies(gith).tools.includes("Thieves' tools"));
  CP.applyClassPicks(gith, g.cl, g, [["Arcana"]]);
  assert.equal(gith.skillProfs.Arcana.prof, true);
  assert.ok(!CP.raceProficiencies(gith).tools.includes("Thieves' tools"), "picking again replaces the first pick");

  const satyr = ensureShape(makeChar("Satyr"));
  assert.equal(satyr.skillProfs.Performance.prof, true, "Reveler's skills don't wait for the instrument");
  const sg = raceGrant(satyr, "Reveler");
  assert.deepEqual(open(satyr, sg, 0), TOOL_GROUPS["Musical instruments"]);

  const wf = ensureShape(makeChar("Warforged"));
  const wg = raceGrant(wf, "Specialized Design");
  assert.equal(open(wf, wg, 1).length, ALL_TOOLS.length, "any tool");
  assert.equal(CP.slotLabel(wg.def, [], 1, CP.classPickContext(wf, wg.cl, wg.key)), "Gain proficiency with a tool of your choice");
});

/* ================================================================
   Older characters
   ================================================================ */
test("older characters: a Warforged's tool feature moves onto the trait; earlier wizard picks count as made", () => {
  const wf = oldSave("Warforged", undefined, { features: [{ id: "t", name: "Tool proficiency: Smith's tools", source: "Race", text: "x" }] });
  assert.deepEqual(wf.racePicks.profPicks["race:Specialized Design:pick"].slots, [[], ["Smith's tools"]]);
  assert.ok(!wf.features.some((f) => /^Tool proficiency/.test(f.name)), "the custom feature goes");
  assert.ok(CP.raceProficiencies(wf).tools.includes("Smith's tools"));
  const vh = oldSave("Variant Human");
  assert.deepEqual(vh.racePicks.profPicks["race:Skills:pick"], { manual: true }, "the old wizard already asked for the skill");
  assert.ok(!CP.pendingClassPicks(vh).length);
  const kenku = oldSave("Kenku");
  assert.ok(CP.pendingClassPicks(kenku).some((g) => g.name === "Kenku Training"), "never asked before: waits on the card");
});

test("Feature choices card: a race's choice with Choose, from the race", (t) => {
  const c = ensureShape(makeChar("Hill Dwarf"));
  let card;
  withFakeDom(t, () => { card = renderClassPicksCard(c); });
  assert.ok(card, "a card for a dwarf's tool (its wording is checked in the app)");
  assert.equal(CP.characterGrants(c).find((g) => g.name === "Tool Proficiency").source, "Race · Hill Dwarf");
  const human = ensureShape(makeChar("Human"));
  withFakeDom(t, () => { assert.equal(renderClassPicksCard(human), null, "nothing to choose: no card"); });
});

/* ================================================================
   Creation wizard
   ================================================================ */
function startWizard(choices){
  W.openWizard();
  const rc = Object.assign({ abilities: [], preset: "", profPicks: {}, feat: "", featPicks: null }, choices.raceChoices);
  Object.assign(W.wizardState, {
    name: "Race test", classId: "Fighter", race: "Human", background: "Soldier", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 12, cha: 10 }, skillChoices: ["Acrobatics", "Insight"],
    classChoices: { fightingStyle: "Defense" }, equipment: { 0: "chain" }, bgPicks: { "bg:Soldier:pick": [["Dice set"]] }
  }, choices, { raceChoices: rc });
}
const inWizard = (t, choices, fn) => { let out; withFakeDom(t, () => { startWizard(choices); out = fn(); }); return out; };

test("wizard: Race Traits only for a race with something to choose", (t) => {
  const has = (race) => inWizard(t, { race }, () => W.isStepApplicable("raceChoices"));
  assert.equal(has("Kenku"), true);
  assert.equal(has("Hill Dwarf"), true, "the dwarf's tool");
  assert.equal(has("High Elf"), false, "an elf's traits are all given");
  assert.equal(has("Human"), false);
});

test("wizard: the Skills step won't spend a class pick on a skill the race gives", (t) => {
  assert.match(inWizard(t, { race: "High Elf", skillChoices: ["Perception", "Athletics"] }, () => W.validateStep("skills")),
    /^Your High Elf race already gives you Perception\. Pick a different class skill\.$/);
  assert.equal(inWizard(t, { race: "High Elf", skillChoices: ["Survival", "Athletics"] }, () => W.validateStep("skills")), null);
});

test("wizard: a kenku's picks are checked, then land on the new sheet with the race's own", (t) => {
  const kenku = (slots) => ({ race: "Kenku", raceChoices: { profPicks: { "race:Kenku Training:pick": slots } } });
  assert.match(inWizard(t, kenku([]), () => W.validateStep("raceChoices")), /^Choose 2 different skills for Kenku Training\.$/);
  // Acrobatics is already a class pick: not allowed again.
  assert.match(inWizard(t, kenku([["Acrobatics", "Stealth"]]), () => W.validateStep("raceChoices")), /Choose 2 different skills/);
  assert.equal(inWizard(t, kenku([["Deception", "Stealth"]]), () => W.validateStep("raceChoices")), null);
  const c = inWizard(t, kenku([["Deception", "Stealth"]]), () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.equal(c.skillProfs.Deception.prof, true);
  assert.equal(c.skillProfs.Stealth.prof, true);
  assert.deepEqual(c.racePicks.profPicks["race:Kenku Training:pick"].slots, [["Deception", "Stealth"]]);
});

test("wizard: a hill dwarf fighter gets the dwarf's weapons and the picked tool", (t) => {
  const choices = { race: "Hill Dwarf", raceChoices: { profPicks: { "race:Tool Proficiency:pick": [["Brewer's supplies"]] } } };
  assert.deepEqual(inWizard(t, choices, () => W.wizardRaceGrants().map((g) => g.name)), ["Dwarven Combat Training", "Tool Proficiency"],
    "the weapons, and the tool's choice (the review lists both)");
  const c = inWizard(t, choices, () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  const r = CP.raceProficiencies(c);
  assert.ok(r.tools.includes("Brewer's supplies"));
  assert.ok(r.weapons.includes("Warhammer"));
  assert.ok(!CP.pendingClassPicks(c).length, "nothing left to choose");
});

test("wizard: a dragonborn picks a draconic ancestry, and the sheet works out the breath weapon", (t) => {
  const db = (slots) => ({ race: "Dragonborn", abilities: { str: 15, dex: 10, con: 14, int: 8, wis: 12, cha: 13 },
    raceChoices: { profPicks: { "race:Draconic Ancestry:pick": slots } } });
  assert.equal(inWizard(t, db([]), () => W.isStepApplicable("raceChoices")), true);
  assert.match(inWizard(t, db([]), () => W.validateStep("raceChoices")), /Draconic Ancestry/);
  assert.equal(inWizard(t, db([["Green dragon"]]), () => W.validateStep("raceChoices")), null);
  const c = inWizard(t, db([["Green dragon"]]), () => { W.finishWizard(); return state.characters[state.characters.length - 1]; });
  assert.deepEqual(c.racePicks.profPicks["race:Draconic Ancestry:pick"].slots, [["Green dragon"]]);
  assert.deepEqual(CP.raceProficiencies(c), { skills: [], weapons: [], tools: [], armor: [] }, "the choice gives no proficiency");
  assert.ok(!CP.pendingClassPicks(c).length, "nothing left to choose");
  assert.match(CP.racePicksText(c), /^Draconic Ancestry: Green dragon$/);
  // CON 16 (14 + nothing from the race), level 1: DC 8 + 3 + 2.
  c.abilities.con = 16;
  assert.equal(draconicBreathText(c), "Breath Weapon (Green dragon): 15 ft cone, CON save DC 13, 2d6 poison damage (half on a success). Once per short or long rest.\nDamage Resistance: poison.");
  assert.deepEqual(draconicBreath(c), { dragon: "Green dragon", damage: "Poison", area: "15 ft cone", save: "CON", dc: 13, dice: 2 });
  // The race's Features entry: the breath line names the dragon, so no "Your picks" line repeats it.
  const entry = H.getAllCharacterFeatures(c).find((f) => f.id === "race_Dragonborn").text;
  assert.ok(!/Your picks/.test(entry), entry);
  assert.match(entry, /\n\nBreath Weapon \(Green dragon\): 15 ft cone/);
  // The Feature choices card's details line.
  const g = raceGrant(c, "Draconic Ancestry");
  assert.deepEqual(CP.classPicksDetails(g, g.cl.profPicks[g.key]), ["Poison: 15 ft cone breath, CON save, and resistance to poison damage"]);
  c.classes[0].level = 11;
  assert.match(draconicBreathText(c), /CON save DC 15, 4d6 poison/);
  // Not picked yet (an older dragonborn): nothing to show, and the Feature choices card asks.
  const old = ensureShape(makeChar("Dragonborn"));
  assert.equal(draconicBreathText(old), "");
  assert.ok(!characterResources(old).some((r) => r.key === "race:breath_weapon"), "no use to track before a dragon is picked");
  assert.ok(CP.pendingClassPicks(old).some((g) => g.name === "Draconic Ancestry"));
});

test("draconic ancestry: the ten dragons, each line or cone matching its save", () => {
  assert.deepEqual(Object.keys(DRACONIC_ANCESTRIES).map((n) => n.split(" ")[0]),
    ["Black", "Blue", "Brass", "Bronze", "Copper", "Gold", "Green", "Red", "Silver", "White"]);
  for(const [n, a] of Object.entries(DRACONIC_ANCESTRIES)){
    assert.ok(["Acid", "Cold", "Fire", "Lightning", "Poison"].includes(a.damage), n);
    assert.equal(a.save, a.damage === "Poison" || a.damage === "Cold" ? "CON" : "DEX", n);
  }
});

test("breath weapon use: once per short rest, kept off the Vitals resources card", () => {
  const c = ensureShape(makeChar("Dragonborn"));
  CP.raceEntry(c).profPicks["race:Draconic Ancestry:pick"] = { slots: [["Red dragon"]], applied: {} };
  const res = () => characterResources(c).find((r) => r.key === "race:breath_weapon");
  assert.deepEqual([res().max, res().used, res().reset, res().place], [1, 0, "short", "inventory"]);
  c.resourcesUsed["race:breath_weapon"] = 1;
  assert.equal(res().used, 1);
  assert.deepEqual(restoreResources(c, "short"), ["Breath Weapon"], "a short rest gives it back");
  assert.equal(res().used, 0);
  // Another race keeps no breath weapon, even with an old pick left over.
  c.race = "Human";
  assert.equal(res(), undefined);
});
