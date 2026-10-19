/* Class picks: the skills, expertise, tools, languages, saving throws and
   weapons class and subclass features give or let the player choose
   (js/core/class-picks.js). The data, what each slot offers, applying and
   taking back, what the sheet reads from the picks, the level-up and its
   undo, the creation wizard, and the Features tab card. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import * as CO from "../js/core/class-options.js";
import * as W from "../js/wizard/wizard-core.js";
import * as LU from "../js/levelup/session.js";
import { finish, undoLastLevelUp } from "../js/levelup/apply.js";
import { TOOL_GROUPS } from "../js/core/feat-picks.js";
import { CLASS_PROGRESSION, SUBCLASSES } from "../js/data/progression.js";
import { CLASSES_INFO } from "../js/data/classes.js";
import { FAVORED_ENEMIES, FAVORED_TERRAINS, DRAGON_ANCESTORS } from "../js/data/feature-picks.js";
import { OPTION_SETS } from "../js/data/class-options.js";
import { SKILLS } from "../js/data/abilities-skills.js";
import { LANGUAGE_LIST } from "../js/data/languages.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
import { SPELL_DATA } from "../js/data/spells.js";
import * as SK from "../js/core/spells-known.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { renderClassPicksCard } from "../js/render/panels/class-picks.js";
import { withFakeDom } from "./fake-dom.mjs";

const SKILL_NAMES = SKILLS.map((s) => s[0]);
const ALL_TOOLS = Object.values(TOOL_GROUPS).flat();
const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

function makeChar(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  (extra.skills || []).forEach((sk) => { c.skillProfs[sk] = { prof: true, expertise: false }; });
  Object.keys(extra).forEach((k) => { if(k !== "skills") c[k] = extra[k]; });
  return c;
}
const grant = (c, name, idx = 0) => {
  const g = CP.entryGrants(c.classes[idx], idx > 0).find((x) => x.name === name);
  assert.ok(g, "no grant named " + name);
  g.cl = c.classes[idx];
  return g;
};
const ctxOf = (c, g) => CP.classPickContext(c, g.cl, g.key);
const open = (c, g, i, slots = []) => CP.slotOptions(g.def, slots, i, ctxOf(c, g)).filter((o) => !o.reason).map((o) => o.value);
const pick = (c, g, slots) => CP.applyClassPicks(c, g.cl, g, slots);

/* ================================================================
   Data
   ================================================================ */
function everyProfs(){
  const out = [];
  for(const cls of Object.keys(CLASS_PROGRESSION)){
    const prog = CLASS_PROGRESSION[cls];
    if(prog.multiclassProfs.profs) out.push([cls + " multiclass", prog.multiclassProfs.profs, null]);
    (CLASSES_INFO[cls].features || []).forEach((f) => { if(f.profs) out.push([cls + " 1 " + f.name, f.profs, f]); });
    for(const v of prog.variants || []) for(const lv of Object.keys(v.features)) v.features[lv].forEach((f) => { if(f.profs) out.push([v.name + " " + lv, f.profs, f]); });
    for(const lv of Object.keys(prog.features)) prog.features[lv].forEach((f) => { if(f.profs) out.push([cls + " " + lv + " " + f.name, f.profs, f]); });
    for(const sub of SUBCLASSES[cls]) for(const lv of Object.keys(sub.features || {})) sub.features[lv].forEach((f) => {
      if(f.profs) out.push([sub.name + " " + lv + " " + f.name, f.profs, f]);
    });
  }
  for(const set of OPTION_SETS) set.options.forEach((o) => { if(o.profs) out.push([set.id + " " + o.name, o.profs, o]); });
  return out;
}

test("profs data: real skills, tools, languages, abilities and weapon filters", () => {
  const all = everyProfs();
  assert.ok(all.length >= 30, "about thirty features give or ask for proficiencies, got " + all.length);
  for(const [where, def] of all){
    for(const k of Object.keys(def)) assert.ok(["skills", "expertise", "languages", "help", "pick"].includes(k), where + ": unknown field " + k);
    (def.skills || []).concat(def.expertise || []).forEach((s) => assert.ok(SKILL_NAMES.includes(s), where + ": skill " + s));
    (def.languages || []).forEach((l) => assert.ok(LANGUAGE_LIST.includes(l), where + ": language " + l));
    assert.ok((def.skills || def.expertise || def.languages || def.pick || []).length, where + ": gives nothing");
    for(const slot of def.pick || []){
      assert.ok(["skill", "expertise", "tool", "language", "save", "weapon", "skillOrLanguage", "spell", "choice"].includes(slot.kind), where + ": kind " + slot.kind);
      if(slot.kind === "choice"){
        const names = slot.groups ? Object.values(slot.groups).flat() : slot.options;
        assert.ok(slot.id && slot.noun && names.length >= 2 && new Set(names).size === names.length, where + ": choice needs an id, a noun and distinct options");
        Object.keys(slot.details || {}).forEach((n) => assert.ok(names.includes(n), where + ": detail for " + n));
        continue;
      }
      if(slot.kind === "spell"){
        assert.ok(Number.isInteger(slot.level) && slot.level >= 0 && slot.level <= 9, where + ": spell level");
        assert.ok(["known", "prepared", "mastery"].includes(slot.grant || "known"), where + ": grant " + slot.grant);
        assert.ok(slot.level === 0 || slot.grant, where + ": a levelled spell says how it is had");
        if(slot.options) slot.options.forEach((n) => assert.ok(SPELL_DATA[n] && SPELL_DATA[n].level === slot.level, where + ": spell " + n));
        else if(slot.from) assert.equal(slot.from, "spellbook", where + ": from");
        else assert.ok(Object.values(SPELL_DATA).some((d) => d.level === slot.level && (!slot.list || d.classes.includes(slot.list)) && (!slot.schools || slot.schools.includes(d.school))), where + ": no spell fits");
        if(slot.list) assert.ok(CLASS_PROGRESSION[slot.list], where + ": list " + slot.list);
        if(slot.ability) assert.ok(ABILITIES.includes(slot.ability), where + ": ability");
        continue;
      }
      if(slot.count != null) assert.ok(Number.isInteger(slot.count) && slot.count > 1, where + ": count");
      const values = (slot.options || []).concat(Array.isArray(slot.fallback) ? slot.fallback : []);
      if(slot.kind === "skill" || slot.kind === "skillOrLanguage") values.forEach((v) => assert.ok(SKILL_NAMES.includes(v), where + ": skill " + v));
      if(slot.kind === "tool"){
        assert.ok(slot.options || TOOL_GROUPS[slot.group], where + ": tool options or group");
        values.forEach((v) => assert.ok(ALL_TOOLS.includes(v), where + ": tool " + v));
      }
      if(slot.kind === "language") values.forEach((v) => assert.ok(LANGUAGE_LIST.includes(v), where + ": language " + v));
      if(slot.kind === "save") assert.ok(values.length && values.every((v) => ABILITIES.includes(v)), where + ": save abilities");
      if(slot.kind === "skillOrLanguage") assert.ok(slot.options && slot.options.length, where + ": skillOrLanguage needs skills");
      if(slot.kind === "weapon") assert.ok(["oneHandedMelee", "kenseiMelee", "kenseiRanged", "kensei"].includes(slot.filter), where + ": weapon filter");
      (slot.tools || []).forEach((v) => assert.ok(ALL_TOOLS.includes(v), where + ": expertise tool " + v));
      if(slot.label) assert.ok(!/[–—]/.test(slot.label), where + ": long dash in label");
    }
  }
});

test("no feature tells the player to tick a skill or names a placeholder tool", () => {
  const texts = [], tools = [];
  for(const cls of Object.keys(CLASS_PROGRESSION)){
    const prog = CLASS_PROGRESSION[cls];
    texts.push([cls + " multiclass note", prog.multiclassProfs.note || ""]);
    prog.multiclassProfs.tools.forEach((t) => tools.push([cls + " multiclass tool", t]));
    for(const lv of Object.keys(prog.features)) prog.features[lv].forEach((f) => texts.push([cls + " " + f.name, f.text]));
    for(const sub of SUBCLASSES[cls]) for(const lv of Object.keys(sub.features || {})) sub.features[lv].forEach((f) => {
      texts.push([sub.name + " " + f.name, f.text]);
      ((f.grants || {}).tools || []).forEach((t) => tools.push([sub.name + " " + f.name + " tool", t]));
    });
  }
  // (A Hexblade still ticks its Hex weapon in the inventory: that's a sheet control, not a proficiency.)
  for(const [where, text] of texts) assert.ok(!/\btick\b[^.]*Abilities & Skills/i.test(text), where + ": still says to tick a skill");
  for(const [where, tool] of tools) assert.ok(!/^One | or /.test(tool), where + ": placeholder tool " + tool);
});

test("the published lists: who gets what", () => {
  const picks = (cls, sub, lv, name) => {
    const f = (sub ? SUBCLASSES[cls].find((s) => s.name === sub).features[lv] : CLASS_PROGRESSION[cls].features[lv]).find((x) => x.name === name);
    return f.profs;
  };
  assert.deepEqual(picks("Bard", null, 3, "Expertise").pick, [{ kind: "expertise", count: 2 }]);
  assert.deepEqual(picks("Bard", null, 10, "Expertise").pick, [{ kind: "expertise", count: 2 }]);
  assert.deepEqual(picks("Rogue", null, 6, "Expertise").pick, [{ kind: "expertise", count: 2, tools: ["Thieves' tools"] }]);
  assert.deepEqual(picks("Bard", "College of Lore", 3, "Bonus Proficiencies").pick, [{ kind: "skill", count: 3 }]);
  assert.deepEqual(picks("Rogue", "Scout", 3, "Survivalist"), { skills: ["Nature", "Survival"], expertise: ["Nature", "Survival"] });
  assert.deepEqual(picks("Monk", "Way of Mercy", 3, "Implements of Mercy"), { skills: ["Insight", "Medicine"] });
  assert.deepEqual(picks("Cleric", "Order Domain", 1, "Bonus Proficiencies").pick[0].options, ["Intimidation", "Persuasion"]);
  assert.deepEqual(picks("Cleric", "Peace Domain", 1, "Implement of Peace").pick[0].options, ["Insight", "Performance", "Persuasion"]);
  assert.deepEqual(picks("Cleric", "Nature Domain", 1, "Acolyte of Nature").pick, [{ kind: "spell", level: 0, list: "Druid" }, { kind: "skill", options: ["Animal Handling", "Nature", "Survival"] }]);
  // Spells: who chooses what, from which list.
  assert.deepEqual(picks("Cleric", "Arcana Domain", 1, "Arcane Initiate"), { skills: ["Arcana"], pick: [{ kind: "spell", count: 2, level: 0, list: "Wizard" }] });
  assert.deepEqual(picks("Cleric", "Arcana Domain", 17, "Arcane Mastery").pick.map((s) => [s.level, s.list, s.grant]), [[6, "Wizard", "prepared"], [7, "Wizard", "prepared"], [8, "Wizard", "prepared"], [9, "Wizard", "prepared"]]);
  assert.deepEqual(picks("Cleric", "Death Domain", 1, "Reaper").pick.map((s) => [s.level, s.list, s.schools]), [[0, undefined, ["Necromancy"]]]);
  assert.deepEqual(picks("Druid", "Circle of the Land", 2, "Bonus Cantrip").pick.map((s) => [s.level, s.list]), [[0, "Druid"]]);
  assert.deepEqual(picks("Fighter", "Arcane Archer", 3, "Arcane Archer Lore").pick[1], { kind: "spell", level: 0, options: ["Prestidigitation", "Druidcraft"] });
  assert.deepEqual(picks("Barbarian", "Path of the Giant", 3, "Giant's Power").pick[1], { kind: "spell", level: 0, options: ["Druidcraft", "Thaumaturgy"], ability: "wis" });
  assert.deepEqual(picks("Wizard", null, 18, "Spell Mastery").pick.map((s) => [s.from, s.level, s.grant]), [["spellbook", 1, "mastery"], ["spellbook", 2, "mastery"]]);
  assert.deepEqual(picks("Wizard", null, 20, "Signature Spells").pick.map((s) => [s.from, s.level, s.count, s.grant]), [["spellbook", 3, 2, "prepared"]]);
  assert.deepEqual(picks("Fighter", "Cavalier", 3, "Bonus Proficiency").pick[0].options, ["Animal Handling", "History", "Insight", "Performance", "Persuasion"]);
  assert.deepEqual(picks("Fighter", "Samurai", 3, "Bonus Proficiency").pick[0].options, ["History", "Insight", "Performance", "Persuasion"]);
  assert.deepEqual(picks("Fighter", "Samurai", 7, "Elegant Courtier").pick[0], { kind: "save", options: ["wis"], fallback: ["int", "cha"] });
  assert.deepEqual(picks("Ranger", "Gloom Stalker", 7, "Iron Mind").pick[0], { kind: "save", options: ["wis"], fallback: ["int", "cha"] });
  assert.deepEqual(picks("Ranger", "Fey Wanderer", 3, "Otherworldly Glamour").pick[0].options, ["Deception", "Performance", "Persuasion"]);
  assert.deepEqual(picks("Rogue", "Mastermind", 3, "Master of Intrigue").pick.map((s) => [s.kind, s.count || 1]), [["tool", 1], ["language", 2]]);
  assert.deepEqual(picks("Fighter", "Rune Knight", 3, "Bonus Proficiencies"), { languages: ["Giant"] });
  assert.deepEqual(picks("Sorcerer", "Storm Sorcery", 1, "Wind Speaker"), { languages: ["Primordial"] });
  assert.deepEqual(picks("Druid", "Circle of the Shepherd", 2, "Speech of the Woods"), { languages: ["Sylvan"] });
  // Kensei: a melee and a ranged weapon at 3, one more at 6, 11 and 17.
  const kensei = SUBCLASSES.Monk.find((s) => s.name === "Way of the Kensei");
  const weaponSlots = (lv) => kensei.features[lv].flatMap((f) => ((f.profs || {}).pick || []).filter((s) => s.kind === "weapon").map((s) => s.filter));
  assert.deepEqual([3, 6, 11, 17].map(weaponSlots), [["kenseiMelee", "kenseiRanged"], ["kensei"], ["kensei"], ["kensei"]]);
  // The classes whose multiclass training comes with a choice.
  assert.deepEqual(Object.keys(CLASS_PROGRESSION).filter((c) => CLASS_PROGRESSION[c].multiclassProfs.profs), ["Bard", "Ranger", "Rogue"]);
  const tiger = OPTION_SETS.find((s) => s.id === "totemAspect").options.find((o) => o.name === "Tiger");
  assert.deepEqual(tiger.profs.pick, [{ kind: "skill", count: 2, options: ["Athletics", "Acrobatics", "Stealth", "Survival"] }]);
});

/* ================================================================
   Which grants a class entry has
   ================================================================ */
test("grants: by level, subclass, multiclass and known options", () => {
  const keys = (cl, multi, lv) => CP.entryGrants(cl, multi, lv).map((g) => g.key);
  // Both of a bard's Expertise features count, though the later one replaces the earlier on the Features list.
  // A first class also has its starting tool choices (a bard's instruments).
  assert.deepEqual(keys({ name: "Bard", subclass: "College of Lore", level: 10 }),
    ["starting", "class:Expertise@3", "class:Expertise@10", "sub:College of Lore:Bonus Proficiencies@3"]);
  assert.deepEqual(keys({ name: "Bard", subclass: "College of Lore", level: 2 }), ["starting"]);
  assert.deepEqual(keys({ name: "Bard", subclass: "College of Lore", level: 2 }, true), ["multiclass"], "not for a second class");
  // Valor's Bonus Proficiencies (armor and weapons only) isn't one.
  assert.deepEqual(keys({ name: "Bard", subclass: "College of Valor", level: 3 }), ["starting", "class:Expertise@3"]);
  // A second class adds its multiclass training; a first class doesn't.
  assert.deepEqual(keys({ name: "Rogue", level: 1 }, true), ["multiclass"]);
  assert.deepEqual(keys({ name: "Rogue", level: 1 }, false), []);
  assert.deepEqual(keys({ name: "Fighter", level: 1 }, true), []);
  // An option with picks of its own: only once it's known and its level reached.
  const totem = { name: "Barbarian", subclass: "Path of the Totem Warrior", level: 6, options: { totemAspect: [{ id: "a", name: "Tiger" }] } };
  assert.deepEqual(keys(totem), ["opt:totemAspect:Tiger"]);
  assert.deepEqual(keys(Object.assign({}, totem, { options: { totemAspect: [{ id: "a", name: "Bear" }] } })), []);
  assert.deepEqual(keys(totem, false, 5), []);
  // What a level-up brings: the difference.
  const before = { name: "Rogue", subclass: "", level: 5 };
  assert.deepEqual(CP.levelUpGrants(before, { name: "Rogue", subclass: "", level: 6 }, false).map((g) => g.key), ["class:Expertise@6"]);
  assert.deepEqual(CP.levelUpGrants({ name: "Rogue", level: 2 }, { name: "Rogue", subclass: "Scout", level: 3 }, false).map((g) => g.key), ["sub:Scout:Survivalist@3"]);
  assert.deepEqual(CP.levelUpGrants(null, { name: "Bard", subclass: "", level: 1 }, true).map((g) => g.key), ["multiclass"]);
  assert.deepEqual(CP.levelUpGrants({ name: "Rogue", level: 6 }, { name: "Rogue", level: 7 }, false), []);
});

/* ================================================================
   What each slot offers
   ================================================================ */
test("skill slots: known ones greyed, a fallback once every option is had", () => {
  const lore = makeChar([{ name: "Bard", subclass: "College of Lore", level: 3 }], { skills: ["Arcana", "Stealth"] });
  const g = grant(lore, "Bonus Proficiencies");
  const opts = CP.slotOptions(g.def, [], 0, ctxOf(lore, g));
  assert.equal(opts.length, 18);
  assert.deepEqual(opts.filter((o) => o.reason).map((o) => [o.value, o.reason]), [["Arcana", "known"], ["Stealth", "known"]]);
  assert.match(CP.classPicksProblem(g, [[]], ctxOf(lore, g)), /Choose 3 different skills for Bonus Proficiencies/);
  assert.match(CP.classPicksProblem(g, [["History", "History", "Nature"]], ctxOf(lore, g)), /Choose 3 different skills/);
  assert.match(CP.classPicksProblem(g, [["History", "Arcana", "Nature"]], ctxOf(lore, g)), /Choose 3 different skills/, "a known skill doesn't count");
  assert.equal(CP.classPicksProblem(g, [["History", "Nature", "Insight"]], ctxOf(lore, g)), "");

  // Royal Envoy: Persuasion, or one of four once you have it; expertise in Persuasion either way.
  const fresh = makeChar([{ name: "Fighter", subclass: "Banneret (Purple Dragon Knight)", level: 7 }]);
  const envoy = grant(fresh, "Royal Envoy");
  assert.deepEqual(open(fresh, envoy, 0), ["Persuasion"]);
  assert.deepEqual(CP.fillSlots(envoy.def, [], ctxOf(fresh, envoy)), [["Persuasion"]], "nothing to choose: filled in");
  assert.ok(CP.slotIsFixed(envoy.def, [["Persuasion"]], 0, ctxOf(fresh, envoy)));
  assert.equal(CP.classPicksProblem(envoy, [["Persuasion"]], ctxOf(fresh, envoy)), "");
  const smooth = makeChar([{ name: "Fighter", subclass: "Banneret (Purple Dragon Knight)", level: 7 }], { skills: ["Persuasion", "Insight"] });
  const envoy2 = grant(smooth, "Royal Envoy");
  assert.deepEqual(open(smooth, envoy2, 0), ["Animal Handling", "Intimidation", "Performance"]);
  assert.ok(!CP.slotIsFixed(envoy2.def, [[]], 0, ctxOf(smooth, envoy2)));
  assert.match(CP.classPicksProblem(envoy2, [[]], ctxOf(smooth, envoy2)), /Choose a skill for Royal Envoy/);
  pick(smooth, envoy2, [["Intimidation"]]);
  assert.deepEqual(smooth.skillProfs.Persuasion, { prof: true, expertise: true });
  assert.deepEqual(smooth.skillProfs.Intimidation, { prof: true, expertise: false });

  // A character who has every option picks any other skill instead (the
  // Basic Rules' swap for a proficiency gained twice), with the label saying why.
  const all = makeChar([{ name: "Cleric", subclass: "Order Domain", level: 1 }], { skills: ["Intimidation", "Persuasion"] });
  const order = grant(all, "Bonus Proficiencies");
  assert.deepEqual(CP.fillSlots(order.def, [], ctxOf(all, order)), [[]]);
  assert.equal(CP.classPicksProblem(order, [[]], ctxOf(all, order)), "Choose a skill for Bonus Proficiencies.");
  assert.equal(open(all, order, 0).length, 16, "any skill but the two it has");
  assert.match(CP.slotLabel(order.def, [], 0, ctxOf(all, order)), /\(you have some of these already, so any other skill can take their place\)$/);
  assert.equal(CP.classPicksProblem(order, [["Arcana"]], ctxOf(all, order)), "");

  // Blessings of Knowledge: a skill already proficient can still be picked (it gains the doubling).
  const sage = makeChar([{ name: "Cleric", subclass: "Knowledge Domain", level: 1 }], { skills: ["Arcana", "History"] });
  const bless = grant(sage, "Blessings of Knowledge");
  assert.deepEqual(open(sage, bless, 0), ["Arcana", "History", "Nature", "Religion"]);
  pick(sage, bless, [["Arcana", "Nature"], ["Elvish", "Draconic"]]);
  assert.deepEqual([sage.skillProfs.Arcana, sage.skillProfs.Nature, sage.skillProfs.History],
    [{ prof: true, expertise: true }, { prof: true, expertise: true }, { prof: true, expertise: false }]);
  assert.deepEqual(sage.classes[0].profPicks[bless.key].applied, { skills: ["Nature"], expertise: ["Arcana", "Nature"], languages: ["Elvish", "Draconic"], weaponItems: [] });
  assert.deepEqual(sage.languages, ["Common", "Elvish", "Draconic"]);
});

test("expertise slots: proficient skills, a skill picked above, and thieves' tools", () => {
  const rogue = makeChar([{ name: "Rogue", level: 6 }], { skills: ["Stealth", "Perception", "Deception", "Acrobatics"] });
  rogue.skillProfs.Stealth.expertise = true;
  const g = grant(rogue, "Expertise");
  const opts = CP.slotOptions(g.def, [], 0, ctxOf(rogue, g));
  assert.deepEqual(opts.map((o) => [o.value, o.group, o.reason]), [["Acrobatics", "Skills", ""], ["Deception", "Skills", ""],
    ["Perception", "Skills", ""], ["Stealth", "Skills", "expertise"], ["Thieves' tools", "Tools", ""]]);
  assert.match(CP.classPicksProblem(g, [["Perception"]], ctxOf(rogue, g)), /Choose 2 different skills for your expertise \(Expertise\)/);
  pick(rogue, g, [["Perception", "Thieves' tools"]]);
  assert.ok(rogue.skillProfs.Perception.expertise);
  assert.deepEqual(CP.characterPickedProfs(rogue).toolExpertise, ["Thieves' tools"]);
  assert.equal(CP.classPicksSummary(g, CP.grantEntry(g.cl, g.key)), "expertise in Perception, expertise in Thieves' tools");
  // Picking again starts clean: its own expertise isn't "already expert".
  assert.deepEqual(open(rogue, g, 0), ["Acrobatics", "Deception", "Perception", "Thieves' tools"]);
  assert.ok(ctxOf(rogue, g).toolExpert("Thieves' tools") === false);

  // A bard has no tool option, and no "Skills" heading for it.
  const bard = makeChar([{ name: "Bard", level: 3 }], { skills: ["Performance", "Persuasion", "Insight"] });
  assert.deepEqual(CP.slotOptions(grant(bard, "Expertise").def, [], 0, ctxOf(bard, grant(bard, "Expertise"))).map((o) => [o.value, o.group]),
    [["Insight", ""], ["Performance", ""], ["Persuasion", ""]]);

  // Multiclassing into rogue: the new skill can take the expertise picked under it.
  const multi = makeChar([{ name: "Fighter", level: 3 }, { name: "Rogue", level: 1 }], { skills: ["Athletics"] });
  const train = grant(multi, "Rogue training", 1);
  assert.deepEqual(open(multi, train, 1), ["Athletics", "Thieves' tools"]);
  assert.deepEqual(open(multi, train, 1, [["Stealth"], []]), ["Athletics", "Stealth", "Thieves' tools"]);
  assert.ok(!open(multi, train, 0).includes("Athletics") && !open(multi, train, 0).includes("Arcana"), "the rogue's list, less what's known");
  pick(multi, train, [["Stealth"], ["Stealth", "Athletics"]]);
  assert.deepEqual([multi.skillProfs.Stealth, multi.skillProfs.Athletics], [{ prof: true, expertise: true }, { prof: true, expertise: true }]);
  // Only two proficient skills and no tool: nothing to choose, both are filled in.
  const few = makeChar([{ name: "Bard", level: 3 }], { skills: ["Performance", "Insight"] });
  const ex = grant(few, "Expertise");
  assert.deepEqual(CP.fillSlots(ex.def, [], ctxOf(few, ex)), [["Insight", "Performance"]]);
});

test("tools, languages, saves and weapons", () => {
  // Student of War: any artisan's tool not already had.
  const bm = makeChar([{ name: "Fighter", subclass: "Battle Master", level: 3 }]);
  const war = grant(bm, "Student of War");
  assert.equal(open(bm, war, 0).length, TOOL_GROUPS["Artisan's tools"].length);
  assert.ok(!H.classProficiencies(bm, 0).tools.some((t) => /^One type/.test(t)), "no placeholder tool");
  pick(bm, war, [["Smith's tools"]]);
  assert.ok(H.classProficiencies(bm, 0).tools.includes("Smith's tools"));
  assert.ok(!H.classProficiencies(makeChar([{ name: "Fighter", subclass: "Battle Master", level: 3 }]), 0).tools.includes("Smith's tools"), "the shared class data isn't changed");
  // A Rune Knight / Battle Master can't take smith's tools twice.
  assert.equal(CP.slotOptions(war.def, [], 0, CP.classPickContext(makeChar([{ name: "Fighter", subclass: "Rune Knight", level: 3 }]), null, ""))
    .find((o) => o.value === "Smith's tools").reason, "known");

  // Mastermind: a gaming set and two languages.
  const mm = makeChar([{ name: "Rogue", subclass: "Mastermind", level: 3 }], { languages: ["Common", "Elvish"] });
  const intrigue = grant(mm, "Master of Intrigue");
  assert.deepEqual(open(mm, intrigue, 0), ["Dice set", "Playing card set", "Dragonchess set", "Three-Dragon Ante set"]);
  assert.ok(!open(mm, intrigue, 1).includes("Elvish") && !open(mm, intrigue, 1).includes("Common") && open(mm, intrigue, 1).includes("Infernal"));
  assert.ok(!open(mm, intrigue, 1).includes("Thieves' Cant"), "secret languages aren't offered");
  assert.match(CP.classPicksProblem(intrigue, [["Dice set"], ["Giant"]], ctxOf(mm, intrigue)), /Choose 2 different languages for Master of Intrigue/);
  pick(mm, intrigue, [["Dice set"], ["Giant", "Infernal"]]);
  assert.deepEqual(mm.languages, ["Common", "Elvish", "Giant", "Infernal"]);
  assert.deepEqual(H.classProficiencies(mm, 0).tools.slice(-3), ["Disguise kit", "Forgery kit", "Dice set"]);

  // Path of the Giant: Giant, or any language once Giant is known.
  const giant = makeChar([{ name: "Barbarian", subclass: "Path of the Giant", level: 3 }]);
  assert.deepEqual(CP.fillSlots(grant(giant, "Giant's Power").def, [], ctxOf(giant, grant(giant, "Giant's Power"))), [["Giant"], []]);
  const speaks = makeChar([{ name: "Barbarian", subclass: "Path of the Giant", level: 3 }], { languages: ["Common", "Giant"] });
  const gp = grant(speaks, "Giant's Power");
  assert.equal(open(speaks, gp, 0).length, 14, "the sixteen standard and exotic languages, less Common and Giant");
  // A Drakewarden may take Draconic or any other.
  const drake = makeChar([{ name: "Ranger", subclass: "Drakewarden", level: 3 }]);
  assert.ok(open(drake, grant(drake, "Draconic Gift"), 0).includes("Draconic") && open(drake, grant(drake, "Draconic Gift"), 0).includes("Dwarvish"));

  // Iron Mind: Wisdom, or Intelligence or Charisma for someone who has Wisdom saves.
  const stalker = makeChar([{ name: "Ranger", subclass: "Gloom Stalker", level: 7 }]);
  const iron = grant(stalker, "Iron Mind");
  assert.deepEqual(CP.fillSlots(iron.def, [], ctxOf(stalker, iron)), [["wis"]]);
  pick(stalker, iron, [["wis"]]);
  assert.deepEqual([H.computeSave(stalker, "wis").prof, H.computeSave(stalker, "wis").grantedBy, H.computeSave(stalker, "int").prof], [true, "Iron Mind", false]);
  assert.ok(H.classProficiencies(stalker, 0).savingThrows.includes("wis"));
  assert.equal(CP.classPicksSummary(iron, CP.grantEntry(iron.cl, iron.key)), "Wisdom saving throws");
  const wise = makeChar([{ name: "Ranger", subclass: "Gloom Stalker", level: 7 }], { saveProfs: { str: true, dex: true, wis: true } });
  assert.deepEqual(open(wise, grant(wise, "Iron Mind"), 0), ["int", "cha"]);
  // A cleric (Wisdom saves from the class) who multiclasses into Samurai.
  const cleric = makeChar([{ name: "Cleric", subclass: "Life Domain", level: 1 }, { name: "Fighter", subclass: "Samurai", level: 7 }]);
  assert.deepEqual(open(cleric, grant(cleric, "Elegant Courtier", 1), 0), ["int"], "a cleric has Wisdom and Charisma saves already");

  // Cavalier: a skill from its list or any language.
  const cav = makeChar([{ name: "Fighter", subclass: "Cavalier", level: 3 }], { skills: ["History"] });
  const bonus = grant(cav, "Bonus Proficiency");
  const offered = CP.slotOptions(bonus.def, [], 0, ctxOf(cav, bonus));
  assert.deepEqual(offered.filter((o) => o.group === "Skills").map((o) => [o.value, o.reason]),
    [["Animal Handling", ""], ["History", "known"], ["Insight", ""], ["Performance", ""], ["Persuasion", ""]]);
  assert.equal(offered.filter((o) => o.group !== "Skills").length, 16);
  pick(cav, bonus, [["Sylvan"]]);
  assert.ok(cav.languages.includes("Sylvan") && !cav.skillProfs.Sylvan);
  pick(cav, bonus, [["Insight"]]);
  assert.ok(!cav.languages.includes("Sylvan") && cav.skillProfs.Insight.prof, "picking again takes the first pick back");

  // Bladesinging: Performance, and one one-handed melee weapon.
  const singer = makeChar([{ name: "Wizard", subclass: "Bladesinging", level: 2 }],
    { inventory: [{ id: "r1", name: "Rapier", type: "weapon", proficient: false }, { id: "g1", name: "Greatsword", type: "weapon", proficient: false }] });
  const song = grant(singer, "Training in War and Song");
  const blades = open(singer, song, 0);
  assert.ok(blades.includes("Rapier") && blades.includes("Longsword") && blades.includes("Quarterstaff"));
  assert.ok(!blades.includes("Greatsword") && !blades.includes("Longbow") && !blades.includes("Glaive"));
  assert.ok(!H.isProficientWithWeapon(singer, "Rapier", "martial"));
  pick(singer, song, [["Rapier"]]);
  assert.ok(singer.skillProfs.Performance.prof && H.isProficientWithWeapon(singer, "Rapier", "martial") && !H.isProficientWithWeapon(singer, "Scimitar", "martial"));
  assert.deepEqual(singer.inventory.map((i) => i.proficient), [true, false], "a rapier already carried is ticked");
  CP.revertClassPicks(singer, singer.classes[0], song.key);
  assert.deepEqual([singer.inventory[0].proficient, singer.skillProfs.Performance.prof, H.isProficientWithWeapon(singer, "Rapier", "martial")], [false, false, false]);
});

test("Kensei weapons: no heavy or special ones, a longbow allowed, and they count as monk weapons", () => {
  const monk = makeChar([{ name: "Monk", subclass: "Way of the Kensei", level: 6 }]);
  const path = grant(monk, "Path of the Kensei");
  const melee = open(monk, path, 0), ranged = open(monk, path, 1);
  assert.ok(melee.includes("Longsword") && melee.includes("Rapier") && !melee.includes("Greatsword") && !melee.includes("Lance") && !melee.includes("Longbow"));
  assert.deepEqual(ranged.slice().sort(), ["Blowgun", "Dart", "Hand Crossbow", "Light Crossbow", "Longbow", "Shortbow", "Sling"]);
  assert.ok(ranged.every((n) => WEAPON_DATA[n].ranged) && !ranged.includes("Net") && !ranged.includes("Heavy Crossbow"));
  const sword = { id: "w", name: "Longsword", type: "weapon", ability: "str", proficient: true };
  assert.ok(!H.martialArtsApplies(monk, sword), "a longsword isn't a monk weapon");
  pick(monk, path, [["Longsword"], ["Longbow"]]);
  assert.ok(H.martialArtsApplies(monk, sword), "until the Kensei chooses it");
  assert.ok(H.isProficientWithWeapon(monk, "Longbow", "martial") && !H.isProficientWithWeapon(monk, "Rapier", "martial"));
  // The one more at level 6: either kind, but not one already chosen.
  const more = grant(monk, "One with the Blade");
  const again = CP.slotOptions(more.def, [], 0, ctxOf(monk, more));
  assert.deepEqual(again.filter((o) => o.reason).map((o) => o.value).sort(), ["Longbow", "Longsword"]);
  assert.ok(again.some((o) => o.value === "Rapier" && !o.reason) && again.some((o) => o.value === "Shortbow" && !o.reason));
  pick(monk, more, [["Rapier"]]);
  assert.deepEqual(CP.characterPickedProfs(monk).monkWeapons, ["Longsword", "Longbow", "Rapier"]);
  // In armor Martial Arts doesn't apply, chosen weapon or not.
  monk.inventory.push({ id: "a", name: "Leather", type: "armor", category: "light", equipped: true });
  assert.ok(!H.martialArtsApplies(monk, sword));
});

/* ================================================================
   Applying, taking back, keeping in step
   ================================================================ */
test("apply records only what changed, and taking it back restores exactly that", () => {
  const c = makeChar([{ name: "Bard", subclass: "College of Lore", level: 3 }], { skills: ["Arcana"] });
  const g = grant(c, "Bonus Proficiencies");
  pick(c, g, [["History", "Nature", "Insight"]]);
  assert.deepEqual(c.classes[0].profPicks[g.key], { slots: [["History", "Nature", "Insight"]], applied: { skills: ["History", "Nature", "Insight"], expertise: [], languages: [], weaponItems: [] } });
  assert.equal(H.getAllCharacterFeatures(c).find((f) => f.name === "Bonus Proficiencies").text.split("\n\n")[1], "Your picks: History, Nature, Insight.");
  // Picking again swaps them without leaving the old ones behind.
  pick(c, g, [["History", "Religion", "Medicine"]]);
  assert.deepEqual(["Arcana", "History", "Nature", "Insight", "Religion", "Medicine"].map((s) => c.skillProfs[s].prof), [true, true, false, false, true, true]);
  CP.revertClassPicks(c, c.classes[0], g.key);
  assert.deepEqual(SKILL_NAMES.filter((s) => c.skillProfs[s].prof), ["Arcana"]);
  assert.deepEqual(c.classes[0].profPicks, {});
  // "I've already added it": done, with nothing changed and nothing read from it.
  CP.markClassPicksManual(c.classes[0], g.key);
  assert.deepEqual(CP.pendingClassPicks(c).map((x) => x.name), ["Bard tools", "Expertise"]);
  assert.equal(CP.classPicksSummary(g, CP.grantEntry(c.classes[0], g.key)), "");
});

test("sync: outright gifts go on, a lost feature's picks come off, choices wait", () => {
  // An older sheet: a Mercy monk and a Rune Knight who never ticked anything.
  const c = makeChar([{ name: "Monk", subclass: "Way of Mercy", level: 3 }, { name: "Fighter", subclass: "Rune Knight", level: 3 }], { skills: ["Insight"] });
  assert.ok(CP.syncClassPicks(c));
  assert.deepEqual([c.skillProfs.Insight.prof, c.skillProfs.Medicine.prof, c.languages], [true, true, ["Common", "Giant"]]);
  assert.deepEqual(c.classes[0].profPicks["sub:Way of Mercy:Implements of Mercy@3"].applied.skills, ["Medicine"], "Insight was already theirs");
  assert.ok(!CP.syncClassPicks(c), "nothing more to do the second time");
  // ensureShape runs it for every saved character.
  const scout = ensureShape(makeChar([{ name: "Rogue", subclass: "Scout", level: 3 }]));
  assert.deepEqual([scout.skillProfs.Nature, scout.skillProfs.Survival], [{ prof: true, expertise: true }, { prof: true, expertise: true }]);
  // A feature with a choice is left for the player, never guessed.
  const rogue = ensureShape(makeChar([{ name: "Rogue", level: 6 }], { skills: ["Stealth", "Perception"] }));
  assert.ok(!rogue.skillProfs.Stealth.expertise && !rogue.classes[0].profPicks);
  assert.deepEqual(CP.pendingClassPicks(rogue).map((g) => g.key), ["class:Expertise@6"]);
  // The subclass changes: the old one's gifts go, the new one's come.
  c.classes[0].subclass = "Way of the Drunken Master";
  assert.ok(CP.syncClassPicks(c));
  assert.deepEqual([c.skillProfs.Insight.prof, c.skillProfs.Medicine.prof, c.skillProfs.Performance.prof], [true, false, true]);
  // A class entry that leaves takes everything it gave with it.
  CP.revertEntryPicks(c, c.classes[1]);
  assert.deepEqual(c.languages, ["Common"]);
  // A Tiger totem's skills go when the totem is removed.
  const barb = makeChar([{ name: "Barbarian", subclass: "Path of the Totem Warrior", level: 6 }]);
  const tiger = CO.learnOption(barb.classes[0], "totemAspect", "Tiger");
  pick(barb, grant(barb, "Aspect of the Beast: Tiger"), [["Stealth", "Survival"]]);
  assert.ok(barb.skillProfs.Stealth.prof && barb.skillProfs.Survival.prof);
  CO.forgetOption(barb.classes[0], "totemAspect", tiger.id);
  CP.syncClassPicks(barb);
  assert.ok(!barb.skillProfs.Stealth.prof && !barb.skillProfs.Survival.prof);
});

/* ================================================================
   The level-up dialog
   ================================================================ */
function levelUp(t, c, setup){
  c.xp = 355000;
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    setup(LU.lu);
    LU.lu.hpMethod = "avg";
    finish();
  });
}
test("level-up: a rogue's Expertise at 6, then undone", (t) => {
  const c = makeChar([{ name: "Rogue", subclass: "Thief", level: 5 }], { skills: ["Stealth", "Perception", "Deception"], hp: { max: 30, current: 30, temp: 0 } });
  let asked, blocked, steps;
  levelUp(t, c, (lu) => {
    steps = ["options", "profs", "asi"].map((id) => LU.stepApplicable(id));
    asked = LU.profGrantsToChoose().map((g) => g.name);
    blocked = CP.classPicksProblem(LU.profGrants()[0], LU.profSlots("class:Expertise@6"), LU.profCtx(LU.profGrants()[0]));
    lu.profPicks["class:Expertise@6"] = [["Stealth", "Thieves' tools"]];
  });
  assert.deepEqual(steps, [false, true, false]);
  assert.deepEqual(asked, ["Expertise"]);
  assert.match(blocked, /Choose 2 different skills for your expertise/);
  assert.equal(c.classes[0].level, 6);
  assert.deepEqual([c.skillProfs.Stealth.expertise, c.skillProfs.Perception.expertise], [true, false]);
  assert.deepEqual(CP.characterPickedProfs(c).toolExpertise, ["Thieves' tools"]);
  assert.deepEqual(CP.pendingClassPicks(c), []);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual([c.classes[0].level, c.skillProfs.Stealth, c.classes[0].profPicks], [5, { prof: true, expertise: false }, {}]);
  assert.deepEqual(CP.characterPickedProfs(c).toolExpertise, []);
});

test("level-up: a subclass picked now brings its gifts and choices; a level with neither has no step", (t) => {
  // Bard 2 to 3 choosing Lore: Expertise and three skills, on one step.
  const bard = makeChar([{ name: "Bard", level: 2 }], { skills: ["Performance", "Persuasion", "Insight"] });
  let asked, greyed;
  levelUp(t, bard, (lu) => {
    assert.deepEqual(LU.profGrantsToChoose().map((g) => g.key), ["class:Expertise@3"], "before the college is chosen: Expertise alone");
    lu.subclass = "College of Lore";
    asked = LU.profGrantsToChoose().map((g) => g.key);
    lu.profPicks["sub:College of Lore:Bonus Proficiencies@3"] = [["Arcana", "History", "Stealth"]];
    // A skill the college adds this level can take the expertise at once.
    const ex = LU.profGrants().find((g) => g.name === "Expertise");
    greyed = CP.slotOptions(ex.def, LU.profSlots(ex.key), 0, LU.profCtx(ex)).map((o) => o.value + (o.reason ? " (" + o.reason + ")" : ""));
    lu.profPicks["class:Expertise@3"] = [["Performance", "Stealth"]];
    // And a skill one feature picks is spoken for in the other.
    const lore = LU.profGrants().find((g) => g.name === "Bonus Proficiencies");
    assert.equal(CP.slotOptions(lore.def, [[]], 0, LU.profCtx(lore)).find((o) => o.value === "Stealth").reason, "");
  });
  assert.deepEqual(asked, ["class:Expertise@3", "sub:College of Lore:Bonus Proficiencies@3"]);
  assert.deepEqual(greyed, ["Arcana", "History", "Insight", "Performance", "Persuasion", "Stealth"]);
  assert.deepEqual(["Arcana", "History", "Stealth"].map((s) => bard.skillProfs[s].prof), [true, true, true]);
  assert.deepEqual(["Performance", "Stealth", "Insight"].map((s) => bard.skillProfs[s].expertise), [true, true, false]);
  withFakeDom(t, (byId) => { undoLastLevelUp(bard); byId["confirm-ok"].click(); });
  assert.deepEqual(SKILL_NAMES.filter((s) => bard.skillProfs[s].prof), ["Insight", "Performance", "Persuasion"]);
  assert.ok(!bard.skillProfs.Performance.expertise && bard.classes[0].subclass === "");

  // Monk 2 to 3 choosing Mercy: nothing to choose, so no step, but the skills are given and undone.
  const monk = makeChar([{ name: "Monk", level: 2 }]);
  let step;
  levelUp(t, monk, (lu) => { lu.subclass = "Way of Mercy"; step = LU.stepApplicable("profs"); });
  assert.equal(step, false);
  assert.ok(monk.skillProfs.Insight.prof && monk.skillProfs.Medicine.prof);
  withFakeDom(t, (byId) => { undoLastLevelUp(monk); byId["confirm-ok"].click(); });
  assert.ok(!monk.skillProfs.Insight.prof && !monk.skillProfs.Medicine.prof);

  // Fighter 4 to 5: no grants at all.
  const fighter = makeChar([{ name: "Fighter", subclass: "Champion", level: 4 }]);
  levelUp(t, fighter, () => { step = LU.stepApplicable("profs") || LU.profGrants().length; });
  assert.equal(step, 0);
});

test("level-up: multiclassing into rogue or bard asks for the skill, the tool and the expertise", (t) => {
  const c = makeChar([{ name: "Fighter", subclass: "Champion", level: 3 }], { skills: ["Athletics", "Perception"], abilities: { str: 15, dex: 14, con: 13, int: 10, wis: 10, cha: 13 } });
  let offered;
  levelUp(t, c, (lu) => {
    LU.resetChoicesFor("Rogue");
    const g = LU.profGrants()[0];
    assert.equal(g.key, "multiclass");
    lu.profPicks.multiclass = [["Stealth"], []];
    // Thieves' tools come with the new class, so they can take expertise at once.
    offered = CP.slotOptions(g.def, LU.profSlots("multiclass"), 1, LU.profCtx(g)).filter((o) => !o.reason).map((o) => o.value);
    lu.profPicks.multiclass = [["Stealth"], ["Stealth", "Thieves' tools"]];
  });
  assert.deepEqual(offered, ["Athletics", "Perception", "Stealth", "Thieves' tools"]);
  assert.deepEqual([c.classes.length, c.skillProfs.Stealth], [2, { prof: true, expertise: true }]);
  assert.deepEqual(CP.characterPickedProfs(c).toolExpertise, ["Thieves' tools"]);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual([c.classes.length, c.skillProfs.Stealth], [1, { prof: false, expertise: false }]);

  const b = makeChar([{ name: "Fighter", subclass: "Champion", level: 3 }], { abilities: { str: 15, dex: 14, con: 13, int: 10, wis: 10, cha: 13 } });
  levelUp(t, b, (lu) => {
    LU.resetChoicesFor("Bard");
    lu.profPicks.multiclass = [["Persuasion"], ["Lute"]];
  });
  assert.ok(b.skillProfs.Persuasion.prof);
  assert.deepEqual(H.classProficiencies(b, 1).tools, ["Lute"]);
});

test("level-up: a Tiger totem picked on the Options step brings its two skills", (t) => {
  const c = makeChar([{ name: "Barbarian", subclass: "Path of the Totem Warrior", level: 5 }], { skills: ["Athletics"] });
  CO.learnOption(c.classes[0], "totemSpirit", "Bear");
  let before, after, open3;
  levelUp(t, c, (lu) => {
    before = LU.stepApplicable("profs");
    LU.optChoice("totemAspect").picks = ["Tiger"];
    after = LU.profGrantsToChoose().map((g) => g.key);
    const g = LU.profGrants()[0];
    open3 = CP.slotOptions(g.def, [], 0, LU.profCtx(g)).filter((o) => !o.reason).map((o) => o.value);
    lu.profPicks["opt:totemAspect:Tiger"] = [["Stealth", "Survival"]];
  });
  assert.deepEqual([before, after, open3], [false, ["opt:totemAspect:Tiger"], ["Acrobatics", "Stealth", "Survival"]]);
  assert.ok(c.skillProfs.Stealth.prof && c.skillProfs.Survival.prof);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.ok(!c.skillProfs.Stealth.prof && !c.skillProfs.Survival.prof && c.skillProfs.Athletics.prof);
});

test("level-up: a feat taken the same level and the class pick don't both take one skill", (t) => {
  const c = makeChar([{ name: "Rogue", subclass: "Scout", level: 3 }], { skills: ["Stealth"] });
  ensureShape(c);
  // Fighter 3 to 4 (an ASI level) multiclass isn't needed: a Cavalier's level 3 has no ASI, so use the feat context directly.
  withFakeDom(t, () => {
    c.xp = 355000;
    LU.openLevelUp(c);
    LU.resetChoicesFor("Bard");
    LU.lu.profPicks.multiclass = [["Arcana"], ["Flute"]];
    assert.ok(LU.featCtx().skillProfs.Arcana.prof, "the feat's pickers see the class pick as known");
    assert.ok(!LU.featCtx().skillProfs.History || !LU.featCtx().skillProfs.History.prof);
    assert.ok(!c.skillProfs.Arcana.prof, "without touching the character");
  });
});

/* ================================================================
   The creation wizard
   ================================================================ */
function startWizard(choices){
  W.openWizard();
  Object.assign(W.wizardState, {
    name: "Wizard test", classId: "Cleric", race: "Human", background: "Acolyte", alignment: "Neutral",
    abilityMethod: "pointbuy", abilities: { str: 14, dex: 10, con: 13, int: 10, wis: 15, cha: 12 },
    skillChoices: ["History", "Medicine"], languageChoices: ["Dwarvish", "Elvish", "Giant"],
    classChoices: { subclass: "Life Domain" }, equipment: { 0: "mace", 1: "scale", 2: "crossbow", 3: "priest", 4: "amulet" },
    spellChoices: { cantrips: ["Guidance", "Light", "Sacred Flame"], spells: ["Bless", "Command", "Guiding Bolt", "Healing Word"] }
  }, choices);
}
function create(t, choices){
  let made;
  withFakeDom(t, () => {
    startWizard(choices);
    W.finishWizard();
    made = state.characters[state.characters.length - 1];
  });
  return made;
}
test("wizard: a domain's skill is asked for on Class Features and lands on the sheet", (t) => {
  let err, grants, greyed;
  withFakeDom(t, () => {
    startWizard({ classChoices: { subclass: "Order Domain" }, skillChoices: ["History", "Persuasion"] });
    grants = W.wizardClassGrants().map((g) => g.name);
    err = W.validateStep("choices");
    const g = W.wizardClassGrants()[0];
    greyed = CP.slotOptions(g.def, [], 0, W.wizardPickContext(g)).map((o) => [o.value, o.reason]);
  });
  assert.deepEqual(grants, ["Bonus Proficiencies"]);
  assert.equal(err, null, "Persuasion is a class skill already, so Intimidation is the only one left and is filled in");
  assert.deepEqual(greyed, [["Intimidation", ""], ["Persuasion", "known"]]);
  withFakeDom(t, () => {
    startWizard({ classChoices: { subclass: "Peace Domain" } });
    err = W.validateStep("choices");
  });
  assert.match(err, /Choose a skill for Implement of Peace/);
  const peace = create(t, { classChoices: { subclass: "Peace Domain", profPicks: { "sub:Peace Domain:Implement of Peace@1": [["Performance"]] } } });
  assert.ok(peace.skillProfs.Performance.prof && !peace.skillProfs.Persuasion.prof);
  assert.deepEqual(CP.pendingClassPicks(peace), []);
  assert.deepEqual(peace.classes[0].profPicks["sub:Peace Domain:Implement of Peace@1"].applied.skills, ["Performance"]);
  // A domain with nothing to choose: Arcana just gets its skill.
  const arcana = create(t, { classChoices: { subclass: "Arcana Domain" } });
  assert.ok(arcana.skillProfs.Arcana.prof);
});

test("wizard: Knowledge Domain's two skills and two languages, kept off the Languages step", (t) => {
  const key = "sub:Knowledge Domain:Blessings of Knowledge@1";
  let plan, err;
  withFakeDom(t, () => {
    startWizard({ classChoices: { subclass: "Knowledge Domain", profPicks: { [key]: [["Arcana", "History"], ["Draconic"]] } } });
    err = W.validateStep("choices");
    W.wizardState.classChoices.profPicks[key] = [["Arcana", "History"], ["Draconic", "Sylvan"]];
    plan = W.languagePlan();
  });
  assert.match(err, /Choose 2 different languages for Blessings of Knowledge/);
  assert.deepEqual(plan.fromClass, ["Draconic", "Sylvan"]);
  assert.ok(plan.fixed.includes("Draconic") && plan.fixed.includes("Sylvan"), "the Languages step greys them out as known");
  assert.equal(plan.slots.length, 3, "a human's one and an acolyte's two: the domain's aren't asked again there");
  const c = create(t, { classChoices: { subclass: "Knowledge Domain", profPicks: { [key]: [["Arcana", "History"], ["Draconic", "Sylvan"]] } } });
  assert.deepEqual([c.skillProfs.Arcana, c.skillProfs.History], [{ prof: true, expertise: true }, { prof: true, expertise: true }]);
  assert.deepEqual(c.languages.slice().sort(), ["Common", "Draconic", "Dwarvish", "Elvish", "Giant", "Sylvan"]);
  assert.deepEqual(c.classes[0].profPicks[key].applied, { skills: ["Arcana"], expertise: ["Arcana", "History"], languages: ["Draconic", "Sylvan"], weaponItems: [] });
  // A Storm sorcerer simply knows Primordial.
  const storm = create(t, { classId: "Sorcerer", classChoices: { subclass: "Storm Sorcery" }, skillChoices: ["Arcana", "Insight"],
    equipment: { 0: "crossbow", 1: "component", 2: "dungeoneer" }, spellChoices: { cantrips: ["Fire Bolt", "Light", "Mage Hand", "Prestidigitation"], spells: ["Magic Missile", "Shield"] } });
  assert.ok(storm.languages.includes("Primordial"));
  assert.deepEqual(storm.classes[0].profPicks["sub:Storm Sorcery:Wind Speaker@1"].applied.languages, ["Primordial"]);
});

/* ================================================================
   The Features tab card
   ================================================================ */
test("card: only for characters with a choice, and every state draws", (t) => {
  withFakeDom(t, () => {
    assert.equal(renderClassPicksCard(makeChar([{ name: "Fighter", subclass: "Champion", level: 20 }])), null);
    // (A Sage: an Acolyte's Insight would be given twice, which asks for another skill.)
    // Mercy's skills are gifts with no choice: once the monk's starting
    // tool is chosen, nothing waits (the card stays, to change the tool).
    const mercy = ensureShape(makeChar([{ name: "Monk", subclass: "Way of Mercy", level: 3 }], { background: "Sage" }));
    assert.deepEqual(CP.pendingClassPicks(mercy).map((g) => g.name), ["Monk tools"]);
    CP.markClassPicksManual(mercy.classes[0], "starting");
    assert.deepEqual(CP.pendingClassPicks(mercy), [], "gifts with no choice wait for nothing");
    const c = makeChar([{ name: "Rogue", subclass: "Mastermind", level: 6 }, { name: "Bard", level: 3 }], { skills: ["Stealth", "Perception"] });
    assert.ok(renderClassPicksCard(c), "all pending");
    pick(c, grant(c, "Expertise"), [["Stealth", "Perception"]]);
    CP.markClassPicksManual(c.classes[0], grant(c, "Master of Intrigue").key);
    assert.ok(renderClassPicksCard(c), "picked, marked by hand and pending together");
    assert.deepEqual(CP.pendingClassPicks(c).map((g) => g.name), ["Bard training", "Expertise"]);
  });
});

/* ================================================================
   Spells a feature lets you choose
   ================================================================ */
const fsOf = (c, feature) => H.featureSpells(c).filter((f) => f.feature === feature);
const book = (...spells) => spells.map(([name, level, prepared]) => ({ name, level, learnedBy: "Wizard", prepared: !!prepared }));

test("spell picks: an Arcana cleric's wizard cantrips and Arcane Mastery", () => {
  const c = makeChar([{ name: "Cleric", subclass: "Arcana Domain", level: 17 }],
    { spells: [{ name: "Light", level: 0, learnedBy: "Cleric" }, { name: "True Seeing", level: 6, learnedBy: "Cleric", prepared: false }] });
  CP.syncClassPicks(c);
  assert.deepEqual(CP.pendingClassPicks(c).map((g) => g.name), ["Arcane Initiate", "Arcane Mastery"], "the spells wait for the player; nothing is guessed");
  assert.ok(!c.skillProfs.Arcana.prof, "and so does the feature's skill, which is applied with them");
  const init = grant(c, "Arcane Initiate");
  const offered = CP.slotOptions(init.def, [], 0, ctxOf(c, init));
  const wizardCantrips = Object.keys(SPELL_DATA).filter((n) => SPELL_DATA[n].level === 0 && SPELL_DATA[n].classes.includes("Wizard")).sort();
  assert.deepEqual(offered.map((o) => o.value), wizardCantrips);
  assert.ok(offered.length >= 15 && !offered.some((o) => o.value === "Sacred Flame"), "wizard cantrips only");
  assert.deepEqual(offered.filter((o) => o.reason).map((o) => [o.value, o.reason]), [["Light", "known"]], "a cantrip already on the sheet is greyed out");
  assert.equal(CP.slotLabel(init.def, [], 0, ctxOf(c, init)), "Choose 2 wizard cantrips");
  assert.match(CP.classPicksProblem(init, [["Fire Bolt"]], ctxOf(c, init)), /Choose 2 different cantrips for Arcane Initiate/);
  pick(c, init, [["Fire Bolt", "Mage Hand"]]);
  assert.ok(c.skillProfs.Arcana.prof);
  assert.deepEqual(fsOf(c, "Arcane Initiate").map((f) => [f.name, f.level, f.kind, f.source, f.className]),
    [["Fire Bolt", 0, "known", "Arcana Domain", "Cleric"], ["Mage Hand", 0, "known", "Arcana Domain", "Cleric"]]);
  assert.equal(H.spellHeldBy(c, "Fire Bolt"), "from Arcana Domain");
  assert.equal(SK.classKnownSpells(c, "Cleric").cantrips.length, 1, "they don't count against the cleric's cantrips known");
  assert.equal(CP.classPicksSummary(init, CP.grantEntry(init.cl, init.key)), "Fire Bolt, Mage Hand");
  // Changing the picks: its own spells aren't "already had".
  assert.deepEqual(CP.slotOptions(init.def, [], 0, ctxOf(c, init)).filter((o) => o.reason).map((o) => o.value), ["Light"]);
  // Tasha's Additional Spells widen the wizard list only with the switch on.
  const tashaOnly = Object.keys(SPELL_DATA).filter((n) => SPELL_DATA[n].level === 0 && SPELL_DATA[n].tashaClasses.includes("Wizard"));
  c.tashaOptional = true;
  assert.equal(CP.slotOptions(init.def, [], 0, ctxOf(c, init)).length, wizardCantrips.length + tashaOnly.length);
  c.tashaOptional = false;

  // Arcane Mastery: one wizard spell of each level from 6th to 9th, always prepared.
  const mastery = grant(c, "Arcane Mastery");
  assert.deepEqual([0, 1, 2, 3].map((i) => CP.slotLabel(mastery.def, [], i, ctxOf(c, mastery))),
    ["Choose a 6th-level wizard spell", "Choose a 7th-level wizard spell", "Choose an 8th-level wizard spell", "Choose a 9th-level wizard spell"]);
  [6, 7, 8, 9].forEach((lv, i) => {
    const opts = CP.slotOptions(mastery.def, [], i, ctxOf(c, mastery));
    assert.ok(opts.length >= 5 && opts.every((o) => SPELL_DATA[o.value].level === lv && SPELL_DATA[o.value].classes.includes("Wizard")), lv + "th-level wizard spells");
  });
  assert.equal(CP.slotOptions(mastery.def, [], 0, ctxOf(c, mastery)).find((o) => o.value === "True Seeing").reason, "", "a spell on the cleric's own list can still be made always prepared");
  assert.match(CP.classPicksProblem(mastery, [["True Seeing"], [], [], []], ctxOf(c, mastery)), /Choose a spell for Arcane Mastery/);
  pick(c, mastery, [["True Seeing"], ["Teleport"], ["Maze"], ["Wish"]]);
  assert.deepEqual(fsOf(c, "Arcane Mastery").map((f) => [f.name, f.level, f.kind]), [["True Seeing", 6, "prepared"], ["Teleport", 7, "prepared"], ["Maze", 8, "prepared"], ["Wish", 9, "prepared"]]);
  const sheetCopy = c.spells.find((sp) => sp.name === "True Seeing");
  assert.ok(SK.alwaysPrepared(c, sheetCopy) && !SK.spellNeedsPreparing(c, sheetCopy), "the sheet's copy is now always prepared");
  // A level lost takes the spells with it.
  c.classes[0].level = 16;
  CP.syncClassPicks(c);
  assert.deepEqual(fsOf(c, "Arcane Mastery"), []);
  assert.equal(fsOf(c, "Arcane Initiate").length, 2);
});

test("spell picks: Reaper, Acolyte of Nature, Circle of the Land, Arcane Archer and Path of the Giant", () => {
  // Death Domain: a necromancy cantrip from any class's list.
  const death = makeChar([{ name: "Cleric", subclass: "Death Domain", level: 1 }]);
  const reaper = grant(death, "Reaper");
  const necro = CP.slotOptions(reaper.def, [], 0, ctxOf(death, reaper)).map((o) => o.value);
  assert.ok(necro.includes("Chill Touch") && necro.includes("Toll the Dead") && necro.includes("Spare the Dying") && !necro.includes("Sacred Flame"));
  assert.ok(necro.every((n) => SPELL_DATA[n].level === 0 && SPELL_DATA[n].school === "Necromancy"));
  assert.ok(!SPELL_DATA["Chill Touch"].classes.includes("Cleric"), "Chill Touch isn't a cleric cantrip: any list means any list");
  pick(death, reaper, [["Chill Touch"]]);
  assert.deepEqual(fsOf(death, "Reaper").map((f) => [f.name, f.kind, f.className]), [["Chill Touch", "known", "Cleric"]]);

  // Nature Domain: a druid cantrip and a skill, on one feature.
  const nature = makeChar([{ name: "Cleric", subclass: "Nature Domain", level: 1 }]);
  const acolyte = grant(nature, "Acolyte of Nature");
  assert.ok(CP.slotOptions(acolyte.def, [], 0, ctxOf(nature, acolyte)).every((o) => SPELL_DATA[o.value].classes.includes("Druid")));
  assert.equal(CP.slotLabel(acolyte.def, [], 0, ctxOf(nature, acolyte)), "Choose a druid cantrip");
  pick(nature, acolyte, [["Shillelagh"], ["Survival"]]);
  assert.ok(nature.skillProfs.Survival.prof && fsOf(nature, "Acolyte of Nature")[0].name === "Shillelagh");
  assert.equal(CP.classPicksSummary(acolyte, CP.grantEntry(acolyte.cl, acolyte.key)), "Shillelagh, Survival");

  // Circle of the Land: one more druid cantrip, never counted, never offered again.
  const land = makeChar([{ name: "Druid", subclass: "Circle of the Land", level: 3 }],
    { spells: [{ name: "Guidance", level: 0, learnedBy: "Druid" }, { name: "Druidcraft", level: 0, learnedBy: "Druid" }] });
  const bonus = grant(land, "Bonus Cantrip");
  assert.deepEqual(CP.slotOptions(bonus.def, [], 0, ctxOf(land, bonus)).filter((o) => o.reason).map((o) => o.value), ["Druidcraft", "Guidance"]);
  pick(land, bonus, [["Produce Flame"]]);
  assert.equal(SK.classKnownSpells(land, "Druid").cantrips.length, 2);
  const at4 = SK.learnPlan(land, { name: "Druid", subclass: "Circle of the Land", level: 4 }, false);
  assert.deepEqual(at4.sections.map((s) => [s.id, s.count]), [["cantrips", 1]]);
  assert.ok(!at4.sections[0].names.includes("Produce Flame") && at4.sections[0].names.includes("Thorn Whip"));

  // Arcane Archer: a skill, and Prestidigitation or Druidcraft. A fighter gets a Spells tab for it.
  const archer = makeChar([{ name: "Fighter", subclass: "Arcane Archer", level: 3 }]);
  const lore = grant(archer, "Arcane Archer Lore");
  assert.equal(CP.slotLabel(lore.def, [], 1, ctxOf(archer, lore)), "Learn Prestidigitation or Druidcraft");
  assert.deepEqual(open(archer, lore, 1), ["Prestidigitation", "Druidcraft"]);
  assert.ok(!H.hasSpellsTab(archer));
  pick(archer, lore, [["Arcana"], ["Prestidigitation"]]);
  assert.ok(H.hasSpellsTab(archer) && archer.skillProfs.Arcana.prof);
  assert.deepEqual(fsOf(archer, "Arcane Archer Lore").map((f) => [f.name, f.kind, f.source]), [["Prestidigitation", "known", "Arcane Archer"]]);

  // Path of the Giant: Druidcraft or Thaumaturgy, cast with Wisdom.
  const giant = makeChar([{ name: "Barbarian", subclass: "Path of the Giant", level: 3 }], { abilities: { str: 16, dex: 14, con: 14, int: 8, wis: 14, cha: 10 } });
  const power = grant(giant, "Giant's Power");
  assert.match(CP.classPicksProblem(power, CP.fillSlots(power.def, [], ctxOf(giant, power)), ctxOf(giant, power)), /Choose a cantrip for Giant's Power/);
  pick(giant, power, [["Giant"], ["Thaumaturgy"]]);
  const cantrip = fsOf(giant, "Giant's Power")[0];
  assert.deepEqual([cantrip.name, cantrip.kind, cantrip.note], ["Thaumaturgy", "known", "A cantrip you always know from Giant's Power. Uses Wisdom: save DC 12, spell attack +4."]);
  assert.ok(giant.languages.includes("Giant"));

  // Lunar Sorcery's Moon Fire simply teaches Sacred Flame.
  const lunar = makeChar([{ name: "Sorcerer", subclass: "Lunar Sorcery", level: 1 }]);
  assert.ok(H.featureSpells(lunar).some((f) => f.name === "Sacred Flame" && f.kind === "known" && f.feature === "Moon Fire"));
});

test("spell picks: a wizard's Spell Mastery and Signature Spells come from the spellbook", () => {
  const w = makeChar([{ name: "Wizard", subclass: "School of Evocation", level: 20 }], { spells: book(["Shield", 1, true], ["Magic Missile", 1], ["Misty Step", 2, true],
    ["Fireball", 3, true], ["Counterspell", 3], ["Haste", 3], ["Fire Bolt", 0]) });
  assert.deepEqual(CP.pendingClassPicks(w).map((g) => g.key), ["class:Spell Mastery@18", "class:Signature Spells@20"]);
  const mastery = grant(w, "Spell Mastery"), sig = grant(w, "Signature Spells");
  assert.deepEqual([open(w, mastery, 0), open(w, mastery, 1), open(w, sig, 0)], [["Magic Missile", "Shield"], ["Misty Step"], ["Counterspell", "Fireball", "Haste"]]);
  assert.deepEqual(CP.fillSlots(mastery.def, [], ctxOf(w, mastery)), [[], ["Misty Step"]], "the only 2nd-level spell in the book is filled in");
  assert.match(CP.classPicksProblem(sig, [["Fireball"]], ctxOf(w, sig)), /Choose 2 different spells for Signature Spells/);
  const before = SK.preparedState(w, "Wizard");
  assert.deepEqual(before, { have: 3, max: 25 });
  pick(w, mastery, [["Shield"], ["Misty Step"]]);
  pick(w, sig, [["Fireball", "Counterspell"]]);
  // Mastered spells are still ordinary spellbook spells: counted, and prepared as usual.
  assert.deepEqual(fsOf(w, "Spell Mastery").map((f) => [f.name, f.kind, f.kindLabel]), [["Shield", "mastery", "Spell Mastery"], ["Misty Step", "mastery", "Spell Mastery"]]);
  const shield = w.spells.find((sp) => sp.name === "Shield"), fireball = w.spells.find((sp) => sp.name === "Fireball"), counter = w.spells.find((sp) => sp.name === "Counterspell");
  assert.ok(SK.spellNeedsPreparing(w, shield) && !SK.alwaysPrepared(w, shield));
  // Signature spells are always prepared and stop counting against the daily limit.
  assert.ok(!SK.spellNeedsPreparing(w, fireball) && SK.alwaysPrepared(w, counter).feature === "Signature Spells");
  assert.deepEqual(SK.preparedState(w, "Wizard"), { have: 2, max: 25 }, "Fireball no longer counts; Shield and Misty Step still do");
  assert.equal(SK.classKnownSpells(w, "Wizard").spells.length, 4);
  // A spell taken out of the spellbook is no longer a signature spell.
  w.spells = w.spells.filter((sp) => sp.name !== "Counterspell");
  assert.deepEqual(fsOf(w, "Signature Spells").map((f) => f.name), ["Fireball"]);
  // A wizard with no 2nd-level spells on the sheet has nothing to choose there, and no complaint.
  const bare = makeChar([{ name: "Wizard", level: 18 }], { spells: book(["Shield", 1]) });
  const m2 = grant(bare, "Spell Mastery");
  assert.deepEqual(CP.fillSlots(m2.def, [], ctxOf(bare, m2)), [["Shield"], []]);
  assert.equal(CP.classPicksProblem(m2, [["Shield"], []], ctxOf(bare, m2)), "");
  // Another class's spells aren't in the wizard's spellbook.
  const multi = makeChar([{ name: "Wizard", level: 18 }, { name: "Cleric", subclass: "Life Domain", level: 2 }],
    { spells: book(["Shield", 1]).concat([{ name: "Bless", level: 1, learnedBy: "Cleric" }, { name: "Sleep", level: 1 }]) });
  assert.deepEqual(open(multi, grant(multi, "Spell Mastery"), 0), ["Shield"], "an untagged spell can't be told apart with two casting classes");
});

test("level-up: Circle of the Land's cantrip, a new Nature cleric's cantrip, a wizard's Spell Mastery", (t) => {
  // Druid 1 to 2, choosing the Land: the step is named for more than proficiencies.
  const druid = makeChar([{ name: "Druid", level: 1 }], { spells: [{ name: "Guidance", level: 0, learnedBy: "Druid" }, { name: "Druidcraft", level: 0, learnedBy: "Druid" }] });
  let label, asked;
  levelUp(t, druid, (lu) => {
    lu.subclass = "Circle of the Land";
    asked = LU.profGrantsToChoose().map((g) => g.name);
    label = LU.profStepLabel();
    lu.profPicks["sub:Circle of the Land:Bonus Cantrip@2"] = [["Thorn Whip"]];
  });
  assert.deepEqual([asked, label], [["Bonus Cantrip"], "Feature choices"]);
  assert.deepEqual(fsOf(druid, "Bonus Cantrip").map((f) => f.name), ["Thorn Whip"]);
  assert.equal(druid.spells.length, 2, "nothing is copied onto the spell list");
  withFakeDom(t, (byId) => { undoLastLevelUp(druid); byId["confirm-ok"].click(); });
  assert.deepEqual([druid.classes[0].level, fsOf(druid, "Bonus Cantrip")], [1, []]);

  // Multiclassing into a Nature cleric: a cantrip picked on New spells isn't offered again.
  const c = makeChar([{ name: "Fighter", subclass: "Champion", level: 3 }], { abilities: { str: 15, dex: 10, con: 13, int: 10, wis: 14, cha: 10 } });
  let greyed;
  levelUp(t, c, (lu) => {
    LU.resetChoicesFor("Cleric");
    lu.subclass = "Nature Domain";
    lu.learnPicks.cantrips = ["Guidance", "Light", "Sacred Flame"];
    const g = LU.profGrants().find((x) => x.name === "Acolyte of Nature");
    greyed = CP.slotOptions(g.def, [], 0, LU.profCtx(g)).filter((o) => o.reason).map((o) => o.value + ": " + o.reason);
    lu.profPicks[g.key] = [["Shillelagh"], ["Nature"]];
  });
  assert.deepEqual(greyed, ["Guidance: new this level"]);
  assert.deepEqual([fsOf(c, "Acolyte of Nature").map((f) => f.name), c.skillProfs.Nature.prof, c.spells.map((sp) => sp.name)], [["Shillelagh"], true, ["Guidance", "Light", "Sacred Flame"]]);
  assert.equal(SK.classKnownSpells(c, "Cleric").cantrips.length, 3);

  // Wizard 17 to 18: Spell Mastery, a proficiency-free level otherwise.
  const w = makeChar([{ name: "Wizard", subclass: "School of Evocation", level: 17 }], { spells: book(["Shield", 1, true], ["Magic Missile", 1], ["Misty Step", 2], ["Web", 2]) });
  let offered;
  levelUp(t, w, (lu) => {
    const g = LU.profGrants()[0];
    offered = [0, 1].map((i) => CP.slotOptions(g.def, [], i, LU.profCtx(g)).map((o) => o.value));
    label = LU.profStepLabel();
    lu.learnPicks.spellbook = ["Thunderwave", "Hold Person"];
    lu.profPicks["class:Spell Mastery@18"] = [["Shield"], ["Web"]];
  });
  assert.deepEqual([offered, label], [[["Magic Missile", "Shield"], ["Misty Step", "Web"]], "Feature choices"]);
  assert.deepEqual(fsOf(w, "Spell Mastery").map((f) => f.name), ["Shield", "Web"]);
  assert.equal(CP.classPicksSummary(grant(w, "Spell Mastery"), CP.grantEntry(w.classes[0], "class:Spell Mastery@18")), "Shield, Web");
  withFakeDom(t, (byId) => { undoLastLevelUp(w); byId["confirm-ok"].click(); });
  assert.deepEqual([w.classes[0].level, fsOf(w, "Spell Mastery"), w.spells.length], [17, [], 4]);
});

test("wizard: an Arcana cleric's two wizard cantrips, left out of the Cantrips step", (t) => {
  const key = "sub:Arcana Domain:Arcane Initiate@1";
  let err, granted, offered;
  withFakeDom(t, () => {
    startWizard({ classChoices: { subclass: "Arcana Domain" } });
    err = W.validateStep("choices");
    W.wizardState.classChoices.profPicks = { [key]: [["Light", "Mage Hand"]] };
    granted = W.wizardGrantedSpells().map((g) => g.name + " (" + g.source + ")");
    const g = W.wizardClassGrants()[0];
    offered = CP.slotOptions(g.def, W.wizardPickSlots(key), 0, W.wizardPickContext(g)).filter((o) => o.reason).map((o) => o.value);
    W.dropGrantedSpellPicks();
  });
  assert.match(err, /Choose 2 different cantrips for Arcane Initiate/);
  assert.ok(granted.includes("Light (Arcana Domain)") && granted.includes("Mage Hand (Arcana Domain)"));
  assert.deepEqual(offered, [], "its own picks aren't greyed out");
  // Light was also one of the three cleric cantrips: the Cantrips step asks for another.
  let cantrips;
  withFakeDom(t, () => {
    startWizard({ classChoices: { subclass: "Arcana Domain", profPicks: { [key]: [["Light", "Mage Hand"]] } } });
    W.dropGrantedSpellPicks();
    cantrips = W.wizardState.spellChoices.cantrips.slice();
  });
  assert.deepEqual(cantrips, ["Guidance", "Sacred Flame"]);
  const c = create(t, { classChoices: { subclass: "Arcana Domain", profPicks: { [key]: [["Fire Bolt", "Mage Hand"]] } } });
  assert.ok(c.skillProfs.Arcana.prof);
  assert.deepEqual(fsOf(c, "Arcane Initiate").map((f) => f.name), ["Fire Bolt", "Mage Hand"]);
  assert.deepEqual(c.spells.filter((sp) => !sp.level).map((sp) => sp.name), ["Guidance", "Light", "Sacred Flame"]);
  assert.deepEqual(CP.pendingClassPicks(c), []);
});

/* ================================================================
   A ranger's favored enemies and terrains, Tasha's replacements,
   a Draconic sorcerer's dragon
   ================================================================ */
const ranger = (level, extra) => makeChar([{ name: "Ranger", subclass: level >= 3 ? "Hunter" : "", level }], extra);

test("ranger data: the Player's Handbook lists, asked at 1, 6 and 14 and at 1, 6 and 10", () => {
  assert.deepEqual(FAVORED_ENEMIES["Creature types"], ["Aberrations", "Beasts", "Celestials", "Constructs", "Dragons", "Elementals", "Fey", "Fiends", "Giants", "Monstrosities", "Oozes", "Plants", "Undead"]);
  assert.deepEqual(FAVORED_TERRAINS, ["Arctic", "Coast", "Desert", "Forest", "Grassland", "Mountain", "Swamp", "Underdark"]);
  assert.deepEqual(DRAGON_ANCESTORS.map((d) => d.name + ": " + d.text.split(" ")[0]), ["Black dragon: Acid", "Blue dragon: Lightning", "Brass dragon: Fire", "Bronze dragon: Lightning",
    "Copper dragon: Acid", "Gold dragon: Fire", "Green dragon: Poison", "Red dragon: Fire", "Silver dragon: Cold", "White dragon: Cold"]);
  const keys = (level) => CP.entryGrants({ name: "Ranger", level }, false).map((g) => g.key);
  assert.deepEqual(keys(1), ["class:Favored Enemy@1", "class:Natural Explorer@1"]);
  assert.deepEqual(keys(5), keys(1));
  assert.deepEqual(keys(20), ["class:Favored Enemy@1", "class:Natural Explorer@1", "class:Favored Enemy@6", "class:Natural Explorer@6", "class:Natural Explorer@10", "class:Favored Enemy@14"]);
  // The Features list still shows each feature once, at its latest level.
  const list = H.classFeatureList({ name: "Ranger", level: 14 }).filter((f) => /Favored Enemy|Natural Explorer/.test(f.name));
  assert.deepEqual(list.map((f) => [f.name, f.level, f.id]), [["Favored Enemy", 14, "class_Ranger_Favored Enemy"], ["Natural Explorer", 10, "class_Ranger_Natural Explorer"]]);
  // A second class gets the level-1 features too, with its multiclass skill.
  assert.deepEqual(CP.entryGrants({ name: "Ranger", level: 1 }, true).map((g) => g.key), ["multiclass", "class:Favored Enemy@1", "class:Natural Explorer@1"]);
});

test("favored enemies and terrains: one of each per level, never the same twice, a language only if they speak one", () => {
  const c = ranger(6, { languages: ["Common", "Elvish"] });
  assert.deepEqual(CP.pendingClassPicks(c).map((g) => g.key), ["class:Favored Enemy@1", "class:Natural Explorer@1", "class:Favored Enemy@6", "class:Natural Explorer@6"]);
  const first = grant(c, "Favored Enemy");
  const offered = CP.slotOptions(first.def, [], 0, ctxOf(c, first));
  assert.equal(offered.filter((o) => o.group === "Creature types").length, 13);
  assert.ok(offered.some((o) => o.group === "Humanoids (two races)" && o.value === "Humanoids: gnolls and orcs"));
  assert.match(CP.classPicksProblem(first, [[], []], ctxOf(c, first)), /Choose a favored enemy for Favored Enemy/);
  assert.equal(CP.classPicksProblem(first, [["Beasts"], []], ctxOf(c, first)), "", "beasts speak no language: the language may be left empty");
  assert.ok(!CP.slotIsFixed(first.def, [["Beasts"], []], 1, ctxOf(c, first)));
  // Two humanoid races of the player's own, typed in.
  assert.equal(CP.classPicksProblem(first, [["Humanoids: drow and duergar"], ["Undercommon"]], ctxOf(c, first)), "");
  assert.deepEqual(CP.fillSlots(first.def, [["Humanoids: drow and duergar"], ["Undercommon"]], ctxOf(c, first)), [["Humanoids: drow and duergar"], ["Undercommon"]], "a typed enemy survives the tidy-up");
  pick(c, first, [["Humanoids: drow and duergar"], ["Undercommon"]]);
  assert.deepEqual(c.languages, ["Common", "Elvish", "Undercommon"]);
  // The second, at level 6: the first is spoken for, and so is its language.
  const second = CP.entryGrants(c.classes[0], false).find((g) => g.key === "class:Favored Enemy@6");
  second.cl = c.classes[0];
  assert.equal(CP.slotLabel(second.def, [], 0, ctxOf(c, second)), "Choose a second favored enemy");
  // (A typed enemy isn't on the list to grey out, but typing it again is refused.)
  assert.match(CP.classPicksProblem(second, CP.fillSlots(second.def, [["Humanoids: drow and duergar"], []], ctxOf(c, second)), ctxOf(c, second)), /Choose a favored enemy/);
  assert.equal(CP.slotOptions(second.def, [], 1, ctxOf(c, second)).find((o) => o.value === "Undercommon").reason, "known");
  pick(c, second, [["Undead"], []]);
  assert.equal(H.getAllCharacterFeatures(c).find((f) => f.name === "Favored Enemy").text.split("\n\n")[1], "Your picks: Humanoids: drow and duergar, Undercommon, Undead.");
  // Terrains the same way.
  const land = grant(c, "Natural Explorer");
  assert.deepEqual(open(c, land, 0), FAVORED_TERRAINS);
  pick(c, land, [["Forest"]]);
  const land6 = CP.entryGrants(c.classes[0], false).find((g) => g.key === "class:Natural Explorer@6");
  land6.cl = c.classes[0];
  assert.deepEqual(open(c, land6, 0), FAVORED_TERRAINS.filter((t) => t !== "Forest"));
  // Changing the first pick doesn't see itself as taken.
  assert.deepEqual(open(c, land, 0), FAVORED_TERRAINS);
});

test("older sheets: the wizard's custom features become the feature's own picks", () => {
  const c = makeChar([{ name: "Ranger", level: 2 }], { languages: ["Common", "Giant"], features: [
    { id: "a", name: "Favored Enemy: Giants", source: "Class", text: "Advantage on...", isPassive: true },
    { id: "b", name: "Favored Terrain: Mountain", source: "Class", text: "In mountain terrain...", isPassive: true },
    { id: "c", name: "Favored Enemy: my homebrew note", source: "Custom", text: "A player's own feature is left alone." }] });
  ensureShape(c);
  assert.deepEqual(c.features.map((f) => f.id), ["c"]);
  assert.deepEqual(c.classes[0].profPicks["class:Favored Enemy@1"].slots, [["Giants"], []]);
  assert.deepEqual(c.classes[0].profPicks["class:Natural Explorer@1"].slots, [["Mountain"]]);
  assert.deepEqual([CP.pendingClassPicks(c), c.languages], [[], ["Common", "Giant"]], "nothing is pending and the language stays");
  assert.match(H.getAllCharacterFeatures(c).find((f) => f.name === "Favored Enemy").text, /Your picks: Giants\./);
  ensureShape(c);
  assert.equal(c.features.length, 1, "running it again changes nothing");
  // A Draconic sorcerer's dragon.
  const s = makeChar([{ name: "Sorcerer", subclass: "Draconic Bloodline", level: 3 }], { languages: ["Common", "Draconic"],
    features: [{ id: "d", name: "Dragon Ancestor: Red dragon", source: "Class", text: "Fire damage.", isPassive: true }] });
  ensureShape(s);
  assert.deepEqual([s.features, s.classes[0].profPicks["sub:Draconic Bloodline:Dragon Ancestor@1"].slots, CP.pendingClassPicks(s)], [[], [["Red dragon"]], []]);
});

test("Dragon Ancestor: a new Draconic sorcerer picks the dragon and learns Draconic", (t) => {
  const c = makeChar([{ name: "Fighter", subclass: "Champion", level: 3 }], { abilities: { str: 15, dex: 10, con: 13, int: 10, wis: 10, cha: 14 } });
  let asked, options;
  levelUp(t, c, (lu) => {
    LU.resetChoicesFor("Sorcerer");
    lu.subclass = "Draconic Bloodline";
    lu.learnPicks = { cantrips: ["Fire Bolt", "Light", "Mage Hand", "Prestidigitation"], spells: ["Magic Missile", "Shield"] };
    const g = LU.profGrants()[0];
    asked = [g.name, LU.profStepLabel()];
    options = CP.slotOptions(g.def, [], 0, LU.profCtx(g)).map((o) => o.value);
    lu.profPicks[g.key] = [["Gold dragon"]];
  });
  assert.deepEqual(asked, ["Dragon Ancestor", "Proficiencies"]);
  assert.deepEqual(options, DRAGON_ANCESTORS.map((d) => d.name));
  assert.ok(c.languages.includes("Draconic"));
  assert.equal(CP.classPicksSummary(grant(c, "Dragon Ancestor", 1), CP.grantEntry(c.classes[1], "sub:Draconic Bloodline:Dragon Ancestor@1")), "Gold dragon");
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual([c.classes.length, c.languages], [1, ["Common"]]);
});

test("Tasha's Favored Foe and Deft Explorer: only for a ranger using them", () => {
  const variants = H.classVariants("Ranger");
  assert.deepEqual(variants.map((v) => [v.name, v.replaces, Object.keys(v.features).map(Number)]), [["Favored Foe", "Favored Enemy", [1, 6, 14]], ["Deft Explorer", "Natural Explorer", [1, 6, 10]]]);
  assert.deepEqual(H.classVariants("Fighter"), []);
  for(const v of variants) for(const lv of Object.keys(v.features)) v.features[lv].forEach((f) => {
    assert.ok(f.name === v.name && f.text.length > 40 && !/[–—]/.test(f.text), v.name + " " + lv);
    assert.equal(!!f.replaces, lv !== "1", v.name + " " + lv + ": later versions replace the first");
  });
  const names = (c) => H.classFeatureList(c.classes[0]).map((f) => f.name);
  const plain = ranger(10);
  assert.ok(names(plain).includes("Favored Enemy") && names(plain).includes("Natural Explorer") && !names(plain).includes("Favored Foe"));
  assert.deepEqual(H.characterResources(plain).filter((r) => /Favored Foe|Tireless/.test(r.name)), []);
  assert.equal(H.computeSpeed(plain).value, 30);

  const tasha = ranger(10, { tashaOptional: true, speed: 30, skills: ["Stealth", "Perception"] });
  tasha.classes[0].variants = { "Favored Enemy": "Favored Foe", "Natural Explorer": "Deft Explorer" };
  assert.ok(H.usesVariant(tasha.classes[0], "Favored Foe") && !H.usesVariant(plain.classes[0], "Favored Foe"));
  assert.ok(names(tasha).includes("Favored Foe") && names(tasha).includes("Deft Explorer") && !names(tasha).includes("Favored Enemy") && !names(tasha).includes("Natural Explorer"));
  // Favored Foe: uses equal to the proficiency bonus, and the die grows.
  const foe = (lv) => H.classFeatureList({ name: "Ranger", level: lv, variants: tasha.classes[0].variants }).find((f) => f.name === "Favored Foe").text.match(/extra (1d\d) damage/)[1];
  assert.deepEqual([1, 5, 6, 13, 14, 20].map(foe), ["1d4", "1d4", "1d6", "1d6", "1d8", "1d8"]);
  const res = (c, name) => H.characterResources(c).find((r) => r.name === name);
  assert.deepEqual([res(tasha, "Favored Foe").max, res(tasha, "Favored Foe").reset, res(tasha, "Tireless").max], [4, "long", 4]);
  assert.ok(!res(ranger(9, { classes: [{ name: "Ranger", level: 9, variants: tasha.classes[0].variants }] }), "Tireless"), "Tireless from ranger 10");
  // Deft Explorer: Canny's expertise and two languages; Roving's speeds at 6.
  assert.deepEqual(CP.entryGrants(tasha.classes[0], false).map((g) => g.key), ["class:Deft Explorer@1"]);
  const canny = grant(tasha, "Deft Explorer");
  assert.deepEqual([canny.def.pick.map((s) => [s.kind, s.count || 1]), open(tasha, canny, 0)], [[["expertise", 1], ["language", 2]], ["Perception", "Stealth"]]);
  pick(tasha, canny, [["Stealth"], ["Elvish", "Sylvan"]]);
  assert.ok(tasha.skillProfs.Stealth.expertise && tasha.languages.includes("Sylvan"));
  const speed = H.computeSpeed(tasha);
  assert.equal(speed.value, 35);
  assert.deepEqual(speed.others.map((o) => [o.type, o.value]).sort(), [["climb", 35], ["swim", 35]]);
  assert.equal(H.computeSpeed(ranger(5, { classes: [{ name: "Ranger", level: 5, variants: tasha.classes[0].variants }] })).value, 30, "Roving from ranger 6");

  // Switching on the sheet: the old feature's picks go, the new one asks for its own.
  const swap = ranger(6, { tashaOptional: true, languages: ["Common"] });
  pick(swap, grant(swap, "Favored Enemy"), [["Dragons"], ["Draconic"]]);
  pick(swap, grant(swap, "Natural Explorer"), [["Forest"]]);
  CP.setClassVariant(swap, swap.classes[0], variants[0], true);
  assert.deepEqual([swap.languages, Object.keys(swap.classes[0].profPicks)], [["Common"], ["class:Natural Explorer@1"]], "the favored enemy and its language are gone");
  assert.deepEqual(CP.pendingClassPicks(swap).map((g) => g.key), ["class:Natural Explorer@6"]);
  CP.setClassVariant(swap, swap.classes[0], variants[1], true);
  assert.deepEqual(CP.pendingClassPicks(swap).map((g) => g.key), ["class:Deft Explorer@1"]);
  CP.setClassVariant(swap, swap.classes[0], variants[0], false);
  assert.deepEqual(CP.pendingClassPicks(swap).map((g) => g.key), ["class:Favored Enemy@1", "class:Deft Explorer@1", "class:Favored Enemy@6"]);
});

test("level-up: multiclassing into ranger asks for the enemy, the terrain and, with Tasha's on, which features to use", (t) => {
  const scores = { str: 10, dex: 15, con: 13, int: 10, wis: 14, cha: 10 };
  const c = makeChar([{ name: "Fighter", subclass: "Champion", level: 3 }], { abilities: scores, skills: ["Athletics"] });
  let offers, asked, label;
  levelUp(t, c, (lu) => {
    LU.resetChoicesFor("Ranger");
    offers = LU.variantOffers().length;
    asked = LU.profGrantsToChoose().map((g) => g.key);
    label = LU.profStepLabel();
    lu.profPicks = { multiclass: [["Stealth"]], "class:Favored Enemy@1": [["Giants"], ["Giant"]], "class:Natural Explorer@1": [["Mountain"]] };
  });
  assert.deepEqual([offers, asked, label], [0, ["multiclass", "class:Favored Enemy@1", "class:Natural Explorer@1"], "Proficiencies"]);
  assert.ok(c.skillProfs.Stealth.prof && c.languages.includes("Giant") && !c.classes[1].variants);
  assert.deepEqual(c.classes[1].profPicks["class:Natural Explorer@1"].slots, [["Mountain"]]);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual([c.classes.length, c.languages, c.skillProfs.Stealth.prof], [1, ["Common"], false]);

  // With Tasha's optional features: Favored Foe instead of Favored Enemy.
  const d = makeChar([{ name: "Fighter", subclass: "Champion", level: 3 }], { abilities: scores, skills: ["Athletics"], tashaOptional: true });
  let gains;
  levelUp(t, d, (lu) => {
    LU.resetChoicesFor("Ranger");
    offers = LU.variantOffers().map((v) => v.name);
    lu.variants = { "Favored Enemy": "Favored Foe" };
    asked = LU.profGrantsToChoose().map((g) => g.key);
    label = LU.profStepLabel();
    gains = LU.gainLabels("Ranger", "", 1);
    lu.profPicks = { multiclass: [["Stealth"]], "class:Natural Explorer@1": [["Forest"]] };
  });
  assert.deepEqual([offers, asked, label], [["Favored Foe", "Deft Explorer"], ["multiclass", "class:Natural Explorer@1"], "Feature choices"]);
  assert.deepEqual(gains, ["Natural Explorer", "Favored Foe"]);
  assert.deepEqual(d.classes[1].variants, { "Favored Enemy": "Favored Foe" });
  assert.ok(H.characterResources(d).some((r) => r.name === "Favored Foe" && r.max === 2));
  assert.ok(H.getAllCharacterFeatures(d).some((f) => f.name === "Favored Foe") && !H.getAllCharacterFeatures(d).some((f) => f.name === "Favored Enemy"));
});

test("level-up: a ranger's second enemy and terrain at 6, the third terrain at 10", (t) => {
  const c = ranger(5, { languages: ["Common"], hp: { max: 40, current: 40, temp: 0 } });
  pick(c, grant(c, "Favored Enemy"), [["Beasts"], []]);
  pick(c, grant(c, "Natural Explorer"), [["Forest"]]);
  let asked, greyed;
  levelUp(t, c, (lu) => {
    asked = LU.profGrantsToChoose().map((g) => g.key);
    const g = LU.profGrants().find((x) => x.key === "class:Favored Enemy@6");
    greyed = CP.slotOptions(g.def, [], 0, LU.profCtx(g)).filter((o) => o.reason).map((o) => o.value);
    lu.profPicks = { "class:Favored Enemy@6": [["Fey"], ["Sylvan"]], "class:Natural Explorer@6": [["Swamp"]] };
  });
  assert.deepEqual([asked, greyed], [["class:Favored Enemy@6", "class:Natural Explorer@6"], ["Beasts"]]);
  assert.deepEqual([c.classes[0].level, c.languages], [6, ["Common", "Sylvan"]]);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.deepEqual([c.classes[0].level, c.languages, Object.keys(c.classes[0].profPicks)], [5, ["Common"], ["class:Favored Enemy@1", "class:Natural Explorer@1"]]);
});

test("wizard: a ranger's favored enemy, its language and terrain on Class Features; Tasha's features behind the switch", (t) => {
  const base = { classId: "Ranger", background: "Outlander", skillChoices: ["Stealth", "Perception", "Survival"], languageChoices: ["Elvish", "Dwarvish"], classChoices: {},
    bgPicks: { "bg:Outlander:pick": [["Lute"]] },
    abilities: { str: 10, dex: 15, con: 13, int: 10, wis: 14, cha: 10 }, equipment: { 0: "leather", 1: "shortswords", 2: "explorer" }, spellChoices: { cantrips: [], spells: [] } };
  let applicable, err, plan, offers;
  withFakeDom(t, () => {
    startWizard(base);
    applicable = W.isStepApplicable("choices");
    err = W.validateStep("choices");
    offers = W.wizardVariantOffers().map((v) => v.name);
    W.wizardState.classChoices.profPicks = { "class:Favored Enemy@1": [["Giants"], ["Giant"]], "class:Natural Explorer@1": [["Mountain"]] };
    plan = W.languagePlan();
  });
  assert.ok(applicable, "the step shows though the ranger has no listPick choices any more");
  assert.match(err, /Choose a favored enemy for Favored Enemy/);
  assert.deepEqual(offers, ["Favored Foe", "Deft Explorer"]);
  assert.deepEqual(plan.fromClass, ["Giant"]);
  assert.equal(plan.slots.length, 2, "a human's language and an outlander's: the favored enemy's is asked with the enemy");
  const c = create(t, Object.assign({}, base, { classChoices: { profPicks: { "class:Favored Enemy@1": [["Giants"], ["Giant"]], "class:Natural Explorer@1": [["Mountain"]] } } }));
  assert.deepEqual(c.classes[0].profPicks["class:Favored Enemy@1"], { slots: [["Giants"], ["Giant"]], applied: { skills: [], expertise: [], languages: ["Giant"], weaponItems: [] } });
  assert.ok(c.languages.includes("Giant") && !c.features.some((f) => /^Favored/.test(f.name)) && !c.classes[0].variants);
  assert.deepEqual(CP.pendingClassPicks(c), []);
  // With Tasha's switch on and both replacements taken.
  const picks = { variants: { "Favored Enemy": "Favored Foe", "Natural Explorer": "Deft Explorer" }, profPicks: { "class:Deft Explorer@1": [["Stealth"], ["Giant", "Sylvan"]] } };
  let level1, grants;
  withFakeDom(t, () => {
    startWizard(Object.assign({}, base, { tashaOptional: true, classChoices: JSON.parse(JSON.stringify(picks)) }));
    level1 = W.wizardLevel1Features().map((f) => f.name);
    grants = W.wizardClassGrants().map((g) => g.key);
    W.wizardState.tashaOptional = false;
    assert.deepEqual(W.wizardLevel1Features().map((f) => f.name), ["Favored Enemy", "Natural Explorer"], "switch off: the picks no longer apply");
  });
  assert.deepEqual([level1, grants], [["Favored Foe", "Deft Explorer"], ["class:Deft Explorer@1"]]);
  const tasha = create(t, Object.assign({}, base, { tashaOptional: true, classChoices: picks }));
  assert.deepEqual(tasha.classes[0].variants, picks.variants);
  assert.ok(tasha.skillProfs.Stealth.expertise && tasha.languages.includes("Sylvan") && tasha.tashaOptional);
  assert.ok(H.characterResources(tasha).some((r) => r.name === "Favored Foe"));
  // A Draconic sorcerer in the wizard: the dragon, and Draconic.
  const key = "sub:Draconic Bloodline:Dragon Ancestor@1";
  const sorc = create(t, { classId: "Sorcerer", classChoices: { subclass: "Draconic Bloodline", profPicks: { [key]: [["Red dragon"]] } }, skillChoices: ["Arcana", "Insight"],
    equipment: { 0: "crossbow", 1: "component", 2: "dungeoneer" }, spellChoices: { cantrips: ["Fire Bolt", "Light", "Mage Hand", "Prestidigitation"], spells: ["Magic Missile", "Shield"] } });
  assert.deepEqual([sorc.classes[0].profPicks[key].slots, sorc.languages.includes("Draconic"), sorc.features.filter((f) => /Dragon/.test(f.name))], [[["Red dragon"]], true, []]);
});

test("card: Tasha's replacement features are listed only with the switch on, or when one is in use", (t) => {
  withFakeDom(t, () => {
    const r = ranger(1);
    assert.ok(renderClassPicksCard(r), "a ranger always has choices");
    const f = makeChar([{ name: "Fighter", subclass: "Champion", level: 5 }], { tashaOptional: true });
    assert.equal(renderClassPicksCard(f), null, "a class with no replacement features gets no card from the switch alone");
    r.tashaOptional = true;
    assert.ok(renderClassPicksCard(r), "with the switch on: its two replacement features are listed too");
    r.classes[0].variants = { "Favored Enemy": "Favored Foe", "Natural Explorer": "Deft Explorer" };
    r.tashaOptional = false;
    CP.syncClassPicks(r);
    assert.ok(renderClassPicksCard(r), "one in use stays listed after the switch goes off, so it can be switched back");
  });
});

/* ---- Starting tool choices (Phase E3, 2026-10-19) ----
   A first artificer picks one artisan's tools, a bard three musical
   instruments, a monk artisan's tools or an instrument; a second class
   gets its multiclass list instead. */
test("starting tools: asked on Class Features, applied on the engine, listed in place of the placeholder", (t) => {
  let grants, err, monkOpts;
  withFakeDom(t, () => {
    startWizard({ classId: "Bard", classChoices: {} });
    grants = W.wizardClassGrants().map((g) => [g.key, g.name]);
    err = W.validateStep("choices");
    startWizard({ classId: "Monk", classChoices: {} });
    const g = W.wizardClassGrants().find((x) => x.key === "starting");
    monkOpts = CP.slotOptions(g.def, [], 0, W.wizardPickContext(g)).map((o) => o.value);
  });
  assert.deepEqual(grants, [["starting", "Bard tools"]]);
  assert.match(err, /Bard tools/);
  assert.equal(monkOpts.length, TOOL_GROUPS["Artisan's tools"].length + TOOL_GROUPS["Musical instruments"].length, "artisan's tools or an instrument");
  // On the sheet: picked tools replace the "of your choice" line.
  const bard = makeChar([{ name: "Bard", level: 1 }]);
  assert.deepEqual(H.classProficiencies(bard, 0).tools, ["Three musical instruments of your choice"], "not chosen yet: the reminder");
  CP.applyClassPicks(bard, bard.classes[0], grant(bard, "Bard tools"), [["Lute", "Flute", "Drum"]]);
  assert.deepEqual(H.classProficiencies(bard, 0).tools, ["Lute", "Flute", "Drum"]);
  const art = makeChar([{ name: "Artificer", level: 1 }]);
  CP.applyClassPicks(art, art.classes[0], grant(art, "Artificer tools"), [["Smith's tools"]]);
  assert.deepEqual(H.classProficiencies(art, 0).tools, ["Thieves' tools", "Tinker's tools", "Smith's tools"]);
  assert.ok(!open(art, grant(art, "Artificer tools"), 0).includes("Tinker's tools"), "tinker's tools: known already");
  // A second class: no starting choice (a bard's multiclass instrument instead).
  const multi = makeChar([{ name: "Fighter", level: 1 }, { name: "Monk", level: 1 }]);
  assert.ok(!CP.entryGrants(multi.classes[1], true).some((g) => g.key === "starting"));
});

test("starting tools: an older sheet's custom feature moves onto the pick", () => {
  const bard = makeChar([{ name: "Bard", level: 2 }], { features: [{ id: "f", name: "Musical instruments: Lute, Flute, Drum", source: "Class", text: "x" }] });
  assert.ok(CP.migrateClassPicks(bard));
  assert.deepEqual(bard.classes[0].profPicks.starting.slots, [["Lute", "Flute", "Drum"]]);
  assert.ok(!bard.features.length, "the custom feature goes");
  assert.deepEqual(CP.pendingClassPicks(bard), []);
  const monk = makeChar([{ name: "Monk", level: 1 }], { features: [{ id: "f", name: "Tool proficiency: Brewer's supplies", source: "Class", text: "x" }] });
  CP.migrateClassPicks(monk);
  assert.deepEqual(monk.classes[0].profPicks.starting.slots, [["Brewer's supplies"]]);
  const art = makeChar([{ name: "Artificer", level: 3 }], { features: [{ id: "f", name: "Artisan's tools: Smith's tools", source: "Class", text: "x" }] });
  CP.migrateClassPicks(art);
  assert.deepEqual(art.classes[0].profPicks.starting.slots, [["Smith's tools"]]);
  // A monk as second class keeps whatever it had (not its first class).
  const second = makeChar([{ name: "Fighter", level: 1 }, { name: "Monk", level: 1 }], { features: [{ id: "f", name: "Tool proficiency: Lute", source: "Class", text: "x" }] });
  assert.equal(CP.migrateClassPicks(second), false);
});

test("Divine Fury: a Zealot picks radiant or necrotic at 3; the extra damage shows only while raging", (t) => {
  const c = makeChar([{ name: "Barbarian", level: 2 }], { abilities: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10 } });
  let asked, options;
  levelUp(t, c, (lu) => {
    lu.subclass = "Path of the Zealot";
    const g = LU.profGrants()[0];
    asked = g.name;
    options = CP.slotOptions(g.def, [], 0, LU.profCtx(g)).map((o) => o.value);
    lu.profPicks[g.key] = [["Necrotic"]];
  });
  assert.deepEqual([asked, options], ["Divine Fury", ["Radiant", "Necrotic"]]);
  assert.deepEqual(CP.characterChoices(c, "divineFury"), ["Necrotic"]);
  assert.equal(H.divineFury(c), null, "not raging");
  c.rage = { active: true, used: 1 };
  assert.deepEqual(H.divineFury(c), { bonus: 1, type: "Necrotic" });
  c.classes[0].level = 11;
  assert.equal(H.divineFury(c).bonus, 5, "half the barbarian level, rounded down");
  c.classes[0].subclass = "Path of the Berserker";
  assert.equal(H.divineFury(c), null, "another path");
  // An older Zealot that never picked: the damage still shows, untyped.
  const old = makeChar([{ name: "Barbarian", subclass: "Path of the Zealot", level: 4 }], { rage: { active: true, used: 1 } });
  assert.deepEqual(H.divineFury(old), { bonus: 2, type: "" });
  assert.deepEqual(CP.pendingClassPicks(old).map((g) => g.name), ["Divine Fury"]);
});
