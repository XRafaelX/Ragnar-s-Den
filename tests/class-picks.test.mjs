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
import { OPTION_SETS } from "../js/data/class-options.js";
import { SKILLS } from "../js/data/abilities-skills.js";
import { LANGUAGE_LIST } from "../js/data/languages.js";
import { WEAPON_DATA } from "../js/data/weapons.js";
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
      assert.ok(["skill", "expertise", "tool", "language", "save", "weapon", "skillOrLanguage"].includes(slot.kind), where + ": kind " + slot.kind);
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
  assert.deepEqual(picks("Cleric", "Nature Domain", 1, "Acolyte of Nature").pick[0].options, ["Animal Handling", "Nature", "Survival"]);
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
  assert.deepEqual(keys({ name: "Bard", subclass: "College of Lore", level: 10 }),
    ["class:Expertise@3", "class:Expertise@10", "sub:College of Lore:Bonus Proficiencies@3"]);
  assert.deepEqual(keys({ name: "Bard", subclass: "College of Lore", level: 2 }), []);
  // Valor's Bonus Proficiencies (armor and weapons only) isn't one.
  assert.deepEqual(keys({ name: "Bard", subclass: "College of Valor", level: 3 }), ["class:Expertise@3"]);
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

  // A character who has every option gets nothing to pick, and no complaint.
  const all = makeChar([{ name: "Cleric", subclass: "Order Domain", level: 1 }], { skills: ["Intimidation", "Persuasion"] });
  const order = grant(all, "Bonus Proficiencies");
  assert.deepEqual(CP.fillSlots(order.def, [], ctxOf(all, order)), [[]]);
  assert.equal(CP.classPicksProblem(order, [[]], ctxOf(all, order)), "");

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
  assert.deepEqual(CP.fillSlots(grant(giant, "Giant's Power").def, [], ctxOf(giant, grant(giant, "Giant's Power"))), [["Giant"]]);
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
  assert.deepEqual(CP.pendingClassPicks(c).map((x) => x.name), ["Expertise"]);
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
    assert.equal(renderClassPicksCard(ensureShape(makeChar([{ name: "Monk", subclass: "Way of Mercy", level: 3 }]))), null, "gifts with no choice need no card");
    const c = makeChar([{ name: "Rogue", subclass: "Mastermind", level: 6 }, { name: "Bard", level: 3 }], { skills: ["Stealth", "Perception"] });
    assert.ok(renderClassPicksCard(c), "all pending");
    pick(c, grant(c, "Expertise"), [["Stealth", "Perception"]]);
    CP.markClassPicksManual(c.classes[0], grant(c, "Master of Intrigue").key);
    assert.ok(renderClassPicksCard(c), "picked, marked by hand and pending together");
    assert.deepEqual(CP.pendingClassPicks(c).map((g) => g.name), ["Bard training", "Expertise"]);
  });
});
