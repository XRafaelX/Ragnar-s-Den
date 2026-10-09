/* Spells a class learns on a level-up (js/core/spells-known.js): the
   spells-known tables, what the New spells step asks for (patron spells,
   Magical Secrets, third casters' schools, Mystic Arcanum, a wizard's
   spellbook, multiclassing), applying and undoing it, and the Spells
   tab's counts and Prepared switch. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as SK from "../js/core/spells-known.js";
import { KNOWN_CASTERS, SUBCLASS_CASTERS } from "../js/data/spells-known.js";
import { SPELL_DATA } from "../js/data/spells.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { spellFromCatalog } from "../js/render/panels/spell-picker.js";
import * as W from "../js/wizard/wizard-core.js";
import * as H from "../js/core/helpers.js";
import { state } from "../js/core/state.js";
import { withFakeDom } from "./fake-dom.mjs";

function makeChar(classes, spells = [], abilities = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  Object.assign(c.abilities, { str: 10, dex: 14, con: 14, int: 10, wis: 12, cha: 16 }, abilities);
  c.spells = spells.map((s) => {
    const [name, by] = Array.isArray(s) ? s : [s];
    const sp = spellFromCatalog(name, SPELL_DATA[name]);
    if(by) sp.learnedBy = by;
    return sp;
  });
  return c;
}
/* The plan for levelling the character's class `name` by one. */
function planFor(c, name, extra = {}){
  const cl = c.classes.find((x) => x.name === name);
  const entry = { name, subclass: (cl && cl.subclass) || extra.subclass || "", level: cl ? cl.level + 1 : 1, spellChoices: cl && cl.spellChoices };
  return SK.learnPlan(c, entry, !cl);
}
const section = (plan, id) => plan.sections.find((s) => s.id === id);
const levelOf = (n) => SPELL_DATA[n].level;

test("spells-known tables match the class tables", () => {
  assert.equal(KNOWN_CASTERS.Warlock.spells[20], 15);
  assert.equal(KNOWN_CASTERS.Warlock.spells[5], 6);
  assert.equal(KNOWN_CASTERS.Bard.spells[10], 14);
  assert.equal(KNOWN_CASTERS.Sorcerer.cantrips[10], 6);
  assert.equal(KNOWN_CASTERS.Ranger.spells[1], 0);
  assert.equal(KNOWN_CASTERS.Ranger.spells[2], 2);
  assert.equal(KNOWN_CASTERS.Warlock.maxLevel(5), 3);
  assert.equal(KNOWN_CASTERS.Warlock.maxLevel(20), 5);
  assert.equal(KNOWN_CASTERS.Ranger.maxLevel(5), 2);
  assert.equal(KNOWN_CASTERS.Ranger.maxLevel(4), 1);
  assert.equal(SUBCLASS_CASTERS["Fighter:Eldritch Knight"].maxLevel(7), 2);
  assert.equal(SUBCLASS_CASTERS["Fighter:Eldritch Knight"].maxLevel(19), 4);
  assert.equal(SUBCLASS_CASTERS["Rogue:Arcane Trickster"].cantrips[3], 3);
  assert.equal(SK.casterDef("Fighter", "Champion"), null);
  assert.ok(SK.knowsSpells("Warlock") && !SK.knowsSpells("Cleric") && !SK.knowsSpells("Wizard"));
});

test("warlock 4 to 5: one new spell up to 3rd level, patron spells tagged, known ones left out", () => {
  const c = makeChar([{ name: "Warlock", subclass: "The Undead", level: 4 }],
    ["Eldritch Blast", "Chill Touch", "Mage Hand", "Armor of Agathys", "Hex", "Bane", "Misty Step", "Hellish Rebuke"]);
  const plan = planFor(c, "Warlock");
  const spells = section(plan, "spells");
  assert.equal(spells.count, 1);
  assert.equal(section(plan, "cantrips"), undefined, "a 5th-level warlock knows 3 cantrips already");
  assert.ok(spells.names.every((n) => levelOf(n) >= 1 && levelOf(n) <= 3));
  assert.ok(spells.names.includes("Speak with Dead") && spells.tags["Speak with Dead"].includes("Patron spell"));
  assert.ok(!spells.names.includes("Bane") && !spells.names.includes("Hex"), "spells already known aren't offered");
  assert.ok(!spells.names.includes("Fireball"), "not on the warlock or Undead list");
  assert.deepEqual(plan.swap.known, ["Armor of Agathys", "Bane", "Hellish Rebuke", "Hex", "Misty Step"]);
  assert.match(plan.summary, /5th-level warlock knows 6 spells and 3 cantrips/);
});

test("a warlock who already knows the table's spells learns none, with a note", () => {
  const known = ["Armor of Agathys", "Bane", "False Life", "Blindness/Deafness", "Phantasmal Force", "Phantom Steed", "Speak with Dead"];
  const c = makeChar([{ name: "Warlock", subclass: "The Undead", level: 5 }], ["Eldritch Blast", "Blade Ward", "Mage Hand"].concat(known));
  const plan = planFor(c, "Warlock");
  assert.equal(section(plan, "spells"), undefined);
  assert.match(plan.note, /already know all 7 warlock spells/);
  assert.ok(plan.swap, "the swap is still offered");
  const ahead = makeChar([{ name: "Warlock", subclass: "The Undead", level: 4 }], known);
  assert.match(planFor(ahead, "Warlock").note, /1 more than the table gives/);
});

test("a player behind the table catches up; two casting classes fall back to the level's gain", () => {
  const behind = makeChar([{ name: "Sorcerer", subclass: "Draconic Bloodline", level: 4 }], ["Fire Bolt", "Shield"]);
  assert.equal(section(planFor(behind, "Sorcerer"), "spells").count, 5, "6 at level 5, knows 1");
  assert.equal(section(planFor(behind, "Sorcerer"), "cantrips").count, 4, "5 at level 5, knows 1");
  const multi = makeChar([{ name: "Sorcerer", subclass: "Draconic Bloodline", level: 3 }, { name: "Warlock", subclass: "The Fiend", level: 2 }], ["Shield"]);
  assert.equal(section(planFor(multi, "Sorcerer"), "spells").count, 1, "untagged spells can't be split: just the gain");
  const tagged = makeChar([{ name: "Sorcerer", subclass: "Draconic Bloodline", level: 3 }, { name: "Warlock", subclass: "The Fiend", level: 2 }],
    [["Shield", "Sorcerer"], ["Hex", "Warlock"]]);
  assert.equal(section(planFor(tagged, "Sorcerer"), "spells").count, 5 - 1, "tagged: 5 at sorcerer 4, knows 1");
});

test("multiclassing into a caster learns its level-1 spells and cantrips", () => {
  const c = makeChar([{ name: "Fighter", subclass: "Champion", level: 5 }], []);
  const plan = planFor(c, "Sorcerer");
  assert.equal(section(plan, "cantrips").count, 4);
  assert.equal(section(plan, "spells").count, 2);
  assert.ok(section(plan, "spells").names.every((n) => levelOf(n) === 1));
  assert.equal(plan.swap, null);
  const wiz = planFor(c, "Wizard");
  assert.equal(section(wiz, "spellbook").count, 6);
  assert.equal(section(wiz, "cantrips").count, 3);
});

test("bard 10: Magical Secrets from any class; Lore 6: two more that don't count", () => {
  const c = makeChar([{ name: "Bard", subclass: "College of Valor", level: 9 }],
    ["Vicious Mockery", "Minor Illusion", "Mage Hand"].concat(["Healing Word", "Charm Person", "Faerie Fire", "Sleep", "Heat Metal", "Shatter", "Suggestion", "Hypnotic Pattern", "Fear", "Dimension Door", "Polymorph", "Greater Restoration"].map((n) => [n, "Bard"])));
  const plan = planFor(c, "Bard");
  assert.equal(section(plan, "secrets").count, 2);
  assert.equal(section(plan, "spells"), undefined, "the level's 2 new spells are the secrets");
  assert.equal(section(plan, "cantrips").count, 1);
  assert.ok(section(plan, "secrets").names.includes("Fireball"));
  assert.match(section(plan, "secrets").tags["Fireball"][0], /Sorcerer|Wizard/);
  const lore = makeChar([{ name: "Bard", subclass: "College of Lore", level: 5 }], []);
  const lp = planFor(lore, "Bard");
  assert.equal(section(lp, "loreSecrets").count, 2);
  assert.equal(section(lp, "loreSecrets").kind, "bonus");
});

test("third casters: Eldritch Knight's schools and any-school pick, Arcane Trickster's Mage Hand", () => {
  const ek = makeChar([{ name: "Fighter", subclass: "", level: 2 }], []);
  const plan = planFor(ek, "Fighter", { subclass: "Eldritch Knight" });
  assert.equal(section(plan, "cantrips").count, 2);
  assert.equal(section(plan, "spells").count, 2);
  assert.ok(section(plan, "spells").names.every((n) => ["Abjuration", "Evocation"].includes(SPELL_DATA[n].school)));
  assert.equal(section(plan, "anySchool").count, 1);
  assert.ok(section(plan, "anySchool").names.includes("Find Familiar"));
  const at = makeChar([{ name: "Rogue", subclass: "", level: 2 }], []);
  const atPlan = planFor(at, "Rogue", { subclass: "Arcane Trickster" });
  assert.deepEqual(atPlan.auto, ["Mage Hand"]);
  assert.equal(section(atPlan, "cantrips").count, 2);
  // EK 7 -> 8: the new spell may be any school.
  const ek7 = makeChar([{ name: "Fighter", subclass: "Eldritch Knight", level: 7 }],
    [["Fire Bolt", "Fighter"], ["Shocking Grasp", "Fighter"], ["Shield", "Fighter"], ["Magic Missile", "Fighter"], ["Thunderwave", "Fighter"], ["Find Familiar", "Fighter"], ["Scorching Ray", "Fighter"]]);
  const p8 = planFor(ek7, "Fighter");
  assert.equal(section(p8, "anySchool").count, 1);
  assert.equal(section(p8, "spells"), undefined);
  // Swapping out the any-school spell may take any school; others keep to the schools.
  const free = SK.swapSection(ek7, { name: "Fighter", subclass: "Eldritch Knight", level: 8 }, p8, "Find Familiar");
  assert.ok(free.names.includes("Invisibility"));
  const kept = SK.swapSection(ek7, { name: "Fighter", subclass: "Eldritch Knight", level: 8 }, p8, "Shield");
  assert.ok(!kept.names.includes("Invisibility") && kept.names.includes("Shatter"));
});

test("warlock 11: Mystic Arcanum offers 6th-level warlock spells", () => {
  const c = makeChar([{ name: "Warlock", subclass: "The Fiend", level: 10 }], []);
  const arc = section(planFor(c, "Warlock"), "arcanum");
  assert.equal(arc.count, 1);
  assert.equal(arc.kind, "arcanum");
  assert.ok(arc.names.length && arc.names.every((n) => levelOf(n) === 6));
});

test("apply and undo: picks added with their class, a swap put back where it was", () => {
  const c = makeChar([{ name: "Warlock", subclass: "The Undead", level: 4 }],
    ["Eldritch Blast", "Chill Touch", "Mage Hand", "Armor of Agathys", "Hex", "Bane", "Misty Step", "Hellish Rebuke"]);
  const before = c.spells.map((s) => s.name);
  const plan = planFor(c, "Warlock");
  const entry = { name: "Warlock", subclass: "The Undead", level: 5 };
  const sections = plan.sections.concat([SK.swapSection(c, entry, plan, "Hex")]);
  const picks = { spells: ["Speak with Dead"], swapIn: ["Counterspell"] };
  assert.equal(SK.learnProblem(sections, {}), "Pick 1 more for New warlock spells.");
  assert.match(SK.learnProblem(sections, { spells: ["Counterspell"], swapIn: ["Counterspell"] }), /picked twice/);
  assert.equal(SK.learnProblem(sections, picks), null);
  const rec = SK.applyLearn(c, "Warlock", plan, sections, picks, "Hex");
  const names = c.spells.map((s) => s.name);
  assert.ok(names.includes("Speak with Dead") && names.includes("Counterspell") && !names.includes("Hex"));
  assert.equal(c.spells.find((s) => s.name === "Speak with Dead").learnedBy, "Warlock");
  assert.equal(c.spells.find((s) => s.name === "Speak with Dead").prepared, true);
  SK.undoLearn(c, rec);
  assert.deepEqual(c.spells.map((s) => s.name), before);
});

test("Spells tab: counts per class, Prepared only for preparing classes", () => {
  const lock = makeChar([{ name: "Warlock", subclass: "The Fiend", level: 5 }], ["Eldritch Blast", "Hex", "Armor of Agathys"]);
  assert.deepEqual(SK.spellCounts(lock), [{ className: "Warlock", spells: { have: 2, max: 6 }, cantrips: { have: 1, max: 3 }, prepared: null }]);
  assert.equal(SK.spellNeedsPreparing(lock, lock.spells[1]), false, "warlock spells are always ready");
  const cleric = makeChar([{ name: "Cleric", subclass: "Life Domain", level: 5 }], ["Sacred Flame", "Guiding Bolt", "Hold Person"], { wis: 16 });
  cleric.spells[1].prepared = true;
  assert.equal(SK.preparedMax(cleric, cleric.classes[0]), 8);
  assert.deepEqual(SK.spellCounts(cleric)[0].prepared, { have: 1, max: 8 });
  assert.equal(SK.spellNeedsPreparing(cleric, cleric.spells[1]), true);
  assert.equal(SK.spellNeedsPreparing(cleric, cleric.spells[0]), false, "cantrips are always ready");
  const pal = makeChar([{ name: "Paladin", subclass: "", level: 1 }], [], { cha: 16 });
  assert.equal(SK.preparedMax(pal, pal.classes[0]), 0, "paladins cast from level 2");
  pal.classes[0].level = 5;
  assert.equal(SK.preparedMax(pal, pal.classes[0]), 5, "CHA +3 + half of 5");
  // A warlock/wizard: a warlock-learned spell has no switch, a wizard one does.
  const mixed = makeChar([{ name: "Warlock", subclass: "The Fiend", level: 2 }, { name: "Wizard", subclass: "", level: 1 }], [["Hex", "Warlock"], ["Sleep", "Wizard"]]);
  assert.equal(SK.spellNeedsPreparing(mixed, mixed.spells[0]), false);
  assert.equal(SK.spellNeedsPreparing(mixed, mixed.spells[1]), true);
});

test("prepared limit: a cleric can't tick past WIS + level; unticking is always fine", () => {
  const c = makeChar([{ name: "Cleric", subclass: "Life Domain", level: 1 }], ["Sacred Flame", "Bane", "Command", "Guiding Bolt"], { wis: 12 });
  assert.equal(SK.preparingClassFor(c, c.spells[1]), "Cleric");
  assert.equal(SK.preparingClassFor(c, c.spells[0]), "", "cantrips need no preparing");
  assert.deepEqual(SK.preparedState(c, "Cleric"), { have: 0, max: 2 });
  c.spells[1].prepared = true; c.spells[2].prepared = true;
  assert.equal(SK.prepareProblem(c, c.spells[3]), "You can prepare 2 cleric spells today. Untick one first.");
  assert.equal(SK.prepareProblem(c, c.spells[1]), null, "unticking a prepared one");
  c.spells[2].prepared = false;
  assert.equal(SK.prepareProblem(c, c.spells[3]), null);
  // A warlock's spells have no limit to hit.
  const lock = makeChar([{ name: "Warlock", subclass: "The Fiend", level: 1 }], ["Hex"]);
  assert.equal(SK.prepareProblem(lock, lock.spells[0]), null);
  assert.equal(SK.preparedState(lock, "Warlock"), null);
});

test("loading drops the wizard's copies of domain spells, keeps edited ones and other spells", () => {
  const c = makeChar([{ name: "Cleric", subclass: "Life Domain", level: 1 }], ["Guidance", "Bless", "Cure Wounds", "Bane"]);
  const note = "Domain spell: always prepared, doesn't count against your prepared spells.";
  c.spells[1].notes = note;
  c.spells[2].notes = note + " I use this a lot.";
  c.spells[3].notes = note;   // Bane isn't a Life Domain spell, so it stays
  delete c.grantedSpellsChecked;
  ensureShape(c);
  assert.deepEqual(c.spells.map((s) => s.name), ["Guidance", "Cure Wounds", "Bane"]);
  assert.equal(c.grantedSpellsChecked, true);
  const light = makeChar([{ name: "Cleric", subclass: "Light Domain", level: 1 }], ["Light"]);
  light.spells[0].notes = "Bonus cantrip from your Light Domain.";
  delete light.grantedSpellsChecked;
  ensureShape(light);
  assert.equal(light.spells.length, 0, "Light Domain's bonus Light cantrip copy goes too");
});

test("creation wizard: a Life cleric's domain spells stay out of the spell list; picks carry their class", (t) => {
  let c;
  withFakeDom(t, () => {
    W.openWizard();
    Object.assign(W.wizardState, { name: "Wiz Cleric", classId: "Cleric", race: "Human", background: "Acolyte", alignment: "Neutral",
      abilityMethod: "pointbuy", abilities: { str: 10, dex: 12, con: 14, int: 8, wis: 15, cha: 10 }, skillChoices: ["Insight", "Medicine"],
      bgSkillChoices: [], languageChoices: [], equipment: {}, classChoices: { subclass: "Life Domain" },
      spellChoices: { cantrips: ["Guidance", "Sacred Flame", "Thaumaturgy"], spells: ["Bane", "Command"] } });
    W.finishWizard();
    c = state.characters[state.characters.length - 1];
  });
  const names = c.spells.map((s) => s.name);
  assert.ok(!names.includes("Bless") && !names.includes("Cure Wounds"), names.join(", "));
  assert.ok(c.spells.every((s) => s.learnedBy === "Cleric"));
  assert.ok(H.featureSpells(c).some((fs) => fs.name === "Bless" && fs.kind === "prepared"), "still shown as a feature spell");
});

test("preparing: a domain spell on the list is always prepared; spells above the class's slots wait", () => {
  const c = makeChar([{ name: "Cleric", subclass: "Life Domain", level: 1 }], ["Cure Wounds", "Detect Evil and Good", "Lesser Restoration", "Hold Person"], { wis: 10 });
  assert.ok(SK.alwaysPrepared(c, c.spells[0]), "Cure Wounds is a Life Domain spell");
  assert.equal(SK.spellNeedsPreparing(c, c.spells[0]), false, "so it has no Prepared switch");
  assert.equal(SK.preparingClassFor(c, c.spells[0]), "");
  assert.equal(SK.prepareLevelProblem(c, c.spells[1]), null);
  assert.equal(SK.prepareLevelProblem(c, c.spells[2]), "Lesser Restoration is a 2nd-level spell: clerics prepare those from cleric level 3.");
  assert.match(SK.prepareProblem(c, c.spells[3]), /Hold Person is a 2nd-level spell/);
  c.classes[0].level = 3;
  assert.equal(SK.prepareLevelProblem(c, c.spells[3]), null, "a 3rd-level cleric prepares 2nd-level spells");
  assert.ok(SK.alwaysPrepared(c, c.spells[2]), "Lesser Restoration joins the domain list at cleric 3");
  const pal = makeChar([{ name: "Paladin", subclass: "", level: 4 }], ["Find Steed"]);
  assert.match(SK.prepareLevelProblem(pal, pal.spells[0]), /from paladin level 5/);
});
