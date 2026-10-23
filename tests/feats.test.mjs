/* Feats from outside the first catalog: Linguist, Tasha's, Xanathar's
   racial feats and the setting books'. The data is checked for shape
   (every spell, option set, feat and race it names exists), then what the
   new kinds of pick do on the sheet: languages, tools, spells with their
   free casts, uses, speed, AC, darkvision, a fighting style, an
   invocation, Metamagic, and who can take what. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as FP from "../js/core/feat-picks.js";
import * as FS from "../js/core/fighting-styles.js";
import * as CO from "../js/core/class-options.js";
import { FEATS_CATALOG, CAMPAIGN_FEATS } from "../js/data/feats.js";
import { FEAT_RESOURCES } from "../js/data/resources.js";
import { SPELL_DATA } from "../js/data/spells.js";
import { RACE_DATA } from "../js/data/race-data.js";
import { BACKGROUND_INFO } from "../js/data/backgrounds.js";
import { optionSetDef } from "../js/data/class-options.js";
import { FEAT_CATEGORIES } from "../js/core/custom-features.js";

const LONG_DASH = /[–—]/;
const AB = { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 10 };
function char(classes, extra = {}){
  return { abilities: { ...AB, ...(extra.abilities || {}) }, saveProfs: {}, skillProfs: extra.skillProfs || {}, classes,
    inventory: extra.inventory || [], feats: [], features: [], spells: [], languages: ["Common"], resourcesUsed: extra.resourcesUsed || {},
    race: extra.race || "Human", initiativeMisc: 0, acMisc: 0, speed: 30 };
}
/* Give a character a feat with picks, the way the level-up does. */
function take(c, name, picks = {}){
  const def = FP.featDef(name);
  const feat = { id: "f" + c.feats.length, name };
  c.feats.push(feat);
  if(FP.featHasPicks(def)) FP.applyFeatPicks(c, feat, { ...FP.emptyPicks(def), ...picks });
  return feat;
}
/* A character's uses that come from feats (not its class's). */
const featUses = (c) => H.characterResources(c).filter((r) => r.key.startsWith("feat:"));
const ctxOf = (c) => ({ abilities: c.abilities, skillProfs: c.skillProfs, languages: c.languages, pb: H.profBonus(c) });
const problem = (name, picks, ctx = {}) => FP.featPicksProblem(FP.featDef(name), { ...FP.emptyPicks(FP.featDef(name)), ...picks }, ctx);

test("feat catalog: 106 feats, well formed, naming only things that exist", () => {
  assert.equal(FEATS_CATALOG.length, 106);
  assert.equal(new Set(FEATS_CATALOG.map((f) => f.name)).size, 106);
  const bySource = {};
  for(const f of FEATS_CATALOG){
    assert.ok(f.source, f.name + ": source book");
    bySource[f.source] = (bySource[f.source] || 0) + 1;
    assert.ok(f.summary && f.description && f.prerequisite, f.name + ": summary, description, prerequisite");
    assert.ok(FEAT_CATEGORIES.includes(f.category), f.name + ": category " + f.category);
    assert.ok(!LONG_DASH.test(JSON.stringify(f)), f.name + ": long dash");
    // Spells it teaches or offers are all in the spell catalog.
    for(const g of (f.grantsSpells || []).concat(...Object.values(f.grantsByOption || {}))) assert.ok(SPELL_DATA[g.name || g], f.name + ": spell " + (g.name || g));
    for(const opt of (f.option ? f.option.options : [""])){
      for(const g of FP.featSpellGroups(f, { option: opt }, { pb: 6 })){
        if(f.option && !g.options.length) assert.ok([].concat(f.spellPick).some((x) => !x.byOption), f.name + " " + opt + ": no spells to pick");
        assert.ok(g.options.length >= g.count || !opt && f.option, f.name + ": " + g.label + " has too few spells");
        assert.ok(g.options.every((n) => SPELL_DATA[n] && SPELL_DATA[n].level === g.level), f.name + ": " + g.label + " spell levels");
      }
    }
    if(f.option && f.option.details) assert.deepEqual(Object.keys(f.option.details), f.option.options, f.name + ": a detail per option");
    if(f.grantsByOption) assert.deepEqual(Object.keys(f.grantsByOption), f.option.options, f.name + ": spells per option");
    if(f.optionPicks) assert.ok(optionSetDef(f.optionPicks.set), f.name + ": option set");
    if(f.toolPicks && f.toolPicks.group) assert.ok(FP.TOOL_GROUPS[f.toolPicks.group], f.name + ": tool group");
    // Who can take it: real races, a real feat and one of its options.
    const r = f.requires;
    if(r){
      for(const race of r.races || []) assert.ok(RACE_DATA[race], f.name + ": race " + race);
      if(r.races) assert.ok(r.raceLabel, f.name + ": race label");
      const other = r.feat && FP.featDef(r.feat);
      if(r.feat) assert.ok(other, f.name + ": needs " + r.feat);
      if(r.option) assert.ok(other.option.options.includes(r.option), f.name + ": option " + r.option);
    }
    if(f.castAbility && f.castAbility.feat) assert.ok(FP.featDef(f.castAbility.feat), f.name + ": cast ability from " + f.castAbility.feat);
  }
  assert.deepEqual(bySource, { PHB: 42, TCE: 15, XGE: 15, MTF: 1, ERLW: 2, FTD: 3, SCC: 2, BMT: 1, GUN: 1, DSotDQ: 9, BGG: 8, PAitM: 7 });
  for(const name of Object.keys(FEAT_RESOURCES)) assert.ok(FP.featDef(name), "resource for a feat that isn't there: " + name);
});

test("Linguist: +1 INT and three languages, taken back with the feat", () => {
  const c = char([{ name: "Wizard", level: 4 }], { abilities: { int: 15 } });
  assert.match(problem("Linguist", { languages: ["Elvish", "Giant"] }, ctxOf(c)), /3 different languages/);
  assert.match(problem("Linguist", { languages: ["Elvish", "Giant", "Common"] }, ctxOf(c)), /already know Common/);
  const feat = take(c, "Linguist", { languages: ["Elvish", "Giant", "Sylvan"] });
  assert.equal(c.abilities.int, 16);
  assert.deepEqual(c.languages, ["Common", "Elvish", "Giant", "Sylvan"]);
  assert.equal(FP.featPicksSummary(FP.featDef("Linguist"), feat.picks), "Intelligence +1, Elvish, Giant, Sylvan");
  assert.equal(FP.featPicksPending(feat, c), false);
  FP.revertFeatPicks(c, feat);
  assert.equal(c.abilities.int, 15);
  assert.deepEqual(c.languages, ["Common"]);
});

test("Prodigy, Chef, Gunner and Artificer Initiate: skills, tools, languages and weapons", () => {
  const c = char([{ name: "Rogue", level: 4 }], { skillProfs: { Stealth: { prof: true, expertise: false } } });
  assert.match(problem("Prodigy", { skills: ["Arcana"], languages: ["Elvish"], expertise: ["Stealth"] }, ctxOf(c)), /Pick a tool/);
  take(c, "Prodigy", { skills: ["Arcana"], tools: ["Thieves' tools"], languages: ["Elvish"], expertise: ["Stealth"] });
  assert.equal(c.skillProfs.Arcana.prof, true);
  assert.equal(c.skillProfs.Stealth.expertise, true);
  assert.ok(c.languages.includes("Elvish"));
  take(c, "Chef", { ability: "wis" });
  take(c, "Gunner");
  assert.equal(c.abilities.dex, 15, "Gunner's fixed +1 DEX");
  const profs = FP.featProficiencies(c);
  assert.deepEqual(profs.tools.map((t) => t.name), ["Thieves' tools", "Cook's utensils"]);
  assert.deepEqual(profs.weapons.map((w) => w.name), ["Firearms"]);
  // Artificer Initiate: an artisan's tool, a cantrip and a 1st-level spell cast with INT.
  assert.ok(!FP.featToolChoices(FP.featDef("Artificer Initiate")).includes("Thieves' tools"));
  assert.match(problem("Artificer Initiate", { tools: ["Tinker's tools"], spells: ["Mending", "Fireball"] }), /1st-level artificer spell/);
  take(c, "Artificer Initiate", { tools: ["Tinker's tools"], spells: ["Mending", "Cure Wounds"] });
  const spells = H.featureSpells(c).filter((s) => s.source === "Artificer Initiate");
  assert.deepEqual(spells.map((s) => [s.name, s.kind]), [["Mending", "known"], ["Cure Wounds", "free"]]);
  assert.match(spells[1].note, /Uses Intelligence: save DC 10/);
  const uses = H.characterResources(c).filter((r) => r.source === "Artificer Initiate");
  assert.deepEqual(uses.map((r) => [r.key, r.max, r.reset]), [["feat:artificer_initiate:cure_wounds", 1, "long"]]);
});

test("spell feats: Shadow Touched, Telekinetic, Drow High Magic, Fey Teleportation, Aberrant Dragonmark", () => {
  const c = char([{ name: "Fighter", level: 4 }], { abilities: { cha: 16 }, race: "Dark Elf (Drow)" });
  assert.match(problem("Shadow Touched", { ability: "wis", spells: ["Bless"] }), /1st-level illusion or necromancy spell/);
  take(c, "Shadow Touched", { ability: "wis", spells: ["False Life"] });
  take(c, "Telekinetic", { ability: "int" });
  take(c, "Drow High Magic");
  const byName = Object.fromEntries(H.featureSpells(c).map((s) => [s.name, s]));
  assert.equal(byName["Invisibility"].kind, "free");
  assert.equal(byName["False Life"].kind, "free");
  assert.equal(byName["Mage Hand"].kind, "known");
  assert.equal(byName["Detect Magic"].kind, "atwill");
  assert.match(byName["Detect Magic"].note, /At will.*Uses Charisma: save DC 13/);
  assert.equal(byName["Levitate"].kind, "free");
  const keys = H.characterResources(c).map((r) => r.key).filter((k) => k.startsWith("feat:"));
  assert.deepEqual(keys, ["feat:shadow_touched:invisibility", "feat:shadow_touched:false_life", "feat:drow_high_magic:levitate", "feat:drow_high_magic:dispel_magic"]);
  // Fey Teleportation: Sylvan, and Misty Step back on a short rest, cast with INT whichever score went up.
  const elf = char([{ name: "Wizard", level: 4 }], { race: "High Elf" });
  const ft = take(elf, "Fey Teleportation", { ability: "cha" });
  assert.ok(elf.languages.includes("Sylvan"));
  const step = H.featureSpells(elf).find((s) => s.name === "Misty Step");
  assert.equal(step.kindLabel, "Free 1/short rest");
  assert.match(step.note, /Uses Intelligence/);
  assert.equal(H.characterResources(elf).find((r) => r.key === "feat:fey_teleportation:misty_step").reset, "short");
  FP.revertFeatPicks(elf, ft);
  assert.ok(!elf.languages.includes("Sylvan"));
  // Aberrant Dragonmark: Constitution, and only the 1st-level spell has a use.
  const marked = char([{ name: "Rogue", level: 4 }]);
  take(marked, "Aberrant Dragonmark", { spells: ["Fire Bolt", "Shield"] });
  assert.equal(marked.abilities.con, 15);
  assert.deepEqual(featUses(marked).map((r) => [r.name, r.reset]), [["Shield (Aberrant Dragonmark)", "short"]]);
  // Fey Touched keeps the uses it has always had, and only those.
  const fey = char([{ name: "Rogue", level: 4 }]);
  take(fey, "Fey Touched", { ability: "wis", spells: ["Hex"] });
  assert.deepEqual(featUses(fey).map((r) => r.key), ["feat:fey_touched_misty_step", "feat:fey_touched_spell"]);
});

test("Strixhaven Initiate: the college decides the spells; its own casting ability", () => {
  const def = FP.featDef("Strixhaven Initiate");
  assert.match(problem(def.name, {}), /Pick a college/);
  assert.match(problem(def.name, { option: "Prismari" }), /spellcasting ability/);
  const base = { option: "Prismari", castAbility: "cha" };
  assert.match(problem(def.name, { ...base, spells: ["Fire Bolt", "Light"] }), /2 different cantrips from your college's list/);
  assert.match(problem(def.name, { ...base, spells: ["Fire Bolt", "Ray of Frost", "Bless"] }), /1st-level spell from your college's list/);
  assert.equal(problem(def.name, { ...base, spells: ["Fire Bolt", "Ray of Frost", "Sleep"] }), "");
  const groups = FP.featSpellGroups(def, { option: "Lorehold" });
  assert.deepEqual(groups.map((g) => [g.offset, g.count]), [[0, 2], [2, 1]]);
  assert.deepEqual(groups[0].options, ["Light", "Sacred Flame", "Thaumaturgy"]);
  assert.ok(groups[1].options.includes("Bless") && groups[1].options.includes("Magic Missile") && !groups[1].options.includes("Hex"));
  assert.deepEqual(FP.featSpellGroups(def, {}).map((g) => g.options.length), [0, 0], "nothing to pick before the college");
  const c = char([{ name: "Fighter", level: 4 }], { abilities: { cha: 14 } });
  const feat = take(c, def.name, { ...base, spells: ["Fire Bolt", "Ray of Frost", "Sleep"] });
  assert.equal(FP.featPicksSummary(def, feat.picks), "Prismari, Fire Bolt, Ray of Frost, Sleep, spells cast with Charisma");
  const spells = H.featureSpells(c);
  assert.deepEqual(spells.map((s) => s.kind), ["known", "known", "free"]);
  assert.match(spells[2].note, /Uses Charisma: save DC 12/);
  assert.deepEqual(featUses(c).map((r) => r.name), ["Sleep (Strixhaven Initiate)"]);
  // Strixhaven Mascot: Find Familiar as a ritual, and the swap.
  take(c, "Strixhaven Mascot");
  assert.equal(H.featureSpells(c).find((s) => s.name === "Find Familiar").kind, "ritual");
  assert.ok(H.characterResources(c).some((r) => r.name === "Mascot Swap"));
});

test("Dragonlance: the Initiate's moon and ability carry over to its Adept", () => {
  const c = char([{ name: "Wizard", level: 4 }], { abilities: { int: 16 } });
  assert.match(problem("Initiate of High Sorcery", { option: "Nuitari", castAbility: "int", spells: ["Light", "Hex", "Shield"] }), /2 different 1st-level spells from your moon's list/);
  take(c, "Initiate of High Sorcery", { option: "Nuitari", castAbility: "int", spells: ["Light", "Hex", "False Life"] });
  take(c, "Adept of the Black Robes", { spells: ["Hold Person"] });
  const hold = H.featureSpells(c).find((s) => s.name === "Hold Person");
  assert.match(hold.note, /Uses Intelligence: save DC 13/);
  assert.deepEqual(featUses(c).map((r) => r.name), ["Hex (Initiate of High Sorcery)", "False Life (Initiate of High Sorcery)", "Hold Person (Adept of the Black Robes)"]);
  // Who can take which Adept: level 4, and the matching moon.
  const who = (level) => ({ race: "Human", level, feats: c.feats });
  assert.equal(FP.featRequiresReason(FP.featDef("Adept of the Black Robes"), who(4)), "");
  assert.equal(FP.featRequiresReason(FP.featDef("Adept of the Black Robes"), who(3)), "needs level 4");
  assert.equal(FP.featRequiresReason(FP.featDef("Adept of the Red Robes"), who(8)), "needs Initiate of High Sorcery (Lunitari)");
  assert.equal(FP.featRequiresReason(FP.featDef("Knight of the Rose"), who(8)), "needs Squire of Solamnia");
  // Divinely Favored: the alignment picks the list.
  assert.match(problem("Divinely Favored", { option: "Evil", castAbility: "wis", spells: ["Guidance", "Bless"] }), /1st-level spell for your alignment/);
  assert.equal(problem("Divinely Favored", { option: "Evil", castAbility: "wis", spells: ["Guidance", "Hex"] }), "");
});

test("racial feats: only for their races, never ruling out a homebrew race", () => {
  const reason = (name, race) => FP.featRequiresReason(FP.featDef(name), { race, level: 4, feats: [] });
  assert.equal(reason("Bountiful Luck", "Stout Halfling"), "");
  assert.equal(reason("Bountiful Luck", "Human"), "only for a halfling");
  assert.equal(reason("Elven Accuracy", "Half-Elf"), "");
  assert.equal(reason("Revenant Blade", "Half-Elf"), "only for an elf");
  assert.equal(reason("Prodigy", "Variant Human"), "");
  assert.equal(reason("Squat Nimbleness", "Duergar"), "");
  assert.equal(reason("Squat Nimbleness", "Goblin"), "");
  assert.equal(reason("Squat Nimbleness", "Goliath"), "only for a dwarf or a Small race");
  assert.equal(reason("Svirfneblin Magic", "Rock Gnome"), "only for a deep gnome");
  assert.equal(reason("Dragon Hide", "A race nobody wrote down"), "");
  RACE_DATA["Test Homebrew"] = { custom: true };
  assert.equal(reason("Dragon Hide", "Test Homebrew"), "");
  delete RACE_DATA["Test Homebrew"];
  assert.equal(reason("Alert", "Human"), "", "feats without `requires` are open to all");
});

test("sheet numbers: Squat Nimbleness speed, Dragon Hide AC, Keenness darkvision", () => {
  const dwarf = char([{ name: "Fighter", level: 4 }], { race: "Hill Dwarf", skillProfs: { Athletics: { prof: true, expertise: false } } });
  assert.match(problem("Squat Nimbleness", { ability: "str", skills: ["Athletics"] }, ctxOf(dwarf)), /already proficient in Athletics\. Pick Acrobatics/);
  assert.match(problem("Squat Nimbleness", { ability: "str", skills: ["Stealth"] }, ctxOf(dwarf)), /Pick Acrobatics or Athletics/);
  const before = H.computeSpeed(dwarf).value;
  take(dwarf, "Squat Nimbleness", { ability: "str", skills: ["Acrobatics"] });
  assert.equal(H.computeSpeed(dwarf).value, before + 5);
  assert.equal(dwarf.skillProfs.Acrobatics.prof, true);
  // Dragon Hide: 13 + DEX unarmored; armor still wins when it's better.
  const born = char([{ name: "Fighter", level: 4 }], { race: "Dragonborn" });
  assert.equal(H.computeArmorClass(born).value, 12);
  take(born, "Dragon Hide", { ability: "str" });
  assert.equal(H.computeArmorClass(born).value, 15);
  assert.match(H.computeArmorClass(born).breakdown, /Dragon Hide: 13 \+ DEX/);
  // Keenness of the Stone Giant: 60 ft, or 60 more than the race's.
  const human = char([{ name: "Fighter", level: 4 }]);
  take(human, "Keenness of the Stone Giant", { ability: "con" });
  assert.equal(H.computeDarkvision(human).range, 60);
  take(dwarf, "Keenness of the Stone Giant", { ability: "con" });
  assert.equal(H.computeDarkvision(dwarf).range, 120);
});

test("uses that follow the proficiency bonus; Strike of the Giants is named for its strike", () => {
  const c = char([{ name: "Fighter", level: 9 }]);
  assert.match(problem("Strike of the Giants", {}), /Pick a strike/);
  const strike = take(c, "Strike of the Giants", { option: "Fire Strike" });
  take(c, "Ember of the Fire Giant", { ability: "str" });
  take(c, "Gift of the Chromatic Dragon");
  const res = Object.fromEntries(H.characterResources(c).map((r) => [r.name, r]));
  assert.equal(res["Fire Strike"].max, 4);
  assert.equal(res["Searing Ignition"].max, 4);
  assert.equal(res["Reactive Resistance"].max, 4);
  assert.equal(res["Chromatic Infusion"].max, 1);
  assert.match(FP.featPickDetail(FP.featDef("Strike of the Giants"), strike.picks), /^Fire Strike: .*1d10 fire/);
  const who = { race: "Human", level: 10, feats: c.feats };
  assert.equal(FP.featRequiresReason(FP.featDef("Ember of the Fire Giant"), who), "");
  assert.equal(FP.featRequiresReason(FP.featDef("Fury of the Frost Giant"), who), "needs Strike of the Giants (Frost Strike)");
  // Scion of the Outer Planes: the plane gives the cantrip; Outlands Envoy casts with its ability.
  const planar = char([{ name: "Cleric", level: 4 }], { abilities: { wis: 16 } });
  take(planar, "Scion of the Outer Planes", { option: "The Outlands", castAbility: "wis" });
  take(planar, "Outlands Envoy", { ability: "wis" });
  const spells = Object.fromEntries(H.featureSpells(planar).map((s) => [s.name, s]));
  assert.equal(spells["Mage Hand"].kind, "known");
  assert.match(spells["Tongues"].note, /Uses Wisdom: save DC 13/); // 8 + 2 + 3 (WIS 17 after its +1)
});

test("Rune Shaper: runes follow the proficiency bonus, and the sheet asks for the next one", () => {
  const def = FP.featDef("Rune Shaper");
  const c = char([{ name: "Wizard", level: 8 }]);
  assert.equal(FP.featSpellGroups(def, {}, ctxOf(c))[0].count, 1);
  const feat = take(c, "Rune Shaper", { castAbility: "int", spells: ["Thunderwave"] });
  assert.equal(FP.featPicksPending(feat, c), false);
  assert.deepEqual(featUses(c).map((r) => r.name), ["Comprehend Languages (Rune Shaper)", "Thunderwave (Rune Shaper)"]);
  c.classes[0].level = 9; // proficiency bonus 4: a second rune
  assert.equal(FP.featPicksPending(feat, c), true);
  assert.match(FP.featPicksProblem(def, FP.startingPicks(def, feat), ctxOf(c)), /2 different runes/);
  FP.applyFeatPicks(c, feat, { ...FP.startingPicks(def, feat), spells: ["Thunderwave", "Command"] });
  assert.equal(FP.featPicksPending(feat, c), false);
  assert.ok(H.featureSpells(c).some((s) => s.name === "Command" && s.kind === "free"));
});

test("Fighting Initiate: the style is a style feature, gone with the feat", () => {
  const c = char([{ name: "Rogue", level: 4 }]);
  const ctx = { ...ctxOf(c), tasha: false, styleReason: (n) => FS.styleReason(c, n, false), optionsKnown: () => [] };
  assert.match(problem("Fighting Initiate", {}, ctx), /Pick a fighting style/);
  assert.match(problem("Fighting Initiate", { option: "Blessed Warrior" }, ctx), /Pick a fighting style/, "not a fighter style");
  assert.match(problem("Fighting Initiate", { option: "Blind Fighting" }, ctx), /Tasha's optional/);
  assert.match(problem("Fighting Initiate", { option: "Superior Technique" }, { ...ctx, tasha: true, styleReason: () => "" }), /maneuver/);
  const feat = take(c, "Fighting Initiate", { option: "Archery" });
  assert.equal(FS.hasStyle(c, "Archery"), true);
  assert.equal(FS.styleFeatures(c)[0].source, "Feat · Fighting Initiate");
  assert.match(problem("Fighting Initiate", { option: "Archery" }, ctx), /already have the Archery style/);
  assert.match(FP.featAppliedSummary(feat), /fighting style/);
  FP.revertFeatPicks(c, feat);
  assert.equal(FS.hasStyle(c, "Archery"), false);
  // Superior Technique's maneuver counts as a maneuver known.
  const d = char([{ name: "Rogue", level: 4 }]);
  take(d, "Fighting Initiate", { option: "Superior Technique", options: ["Riposte"] });
  assert.deepEqual(CO.allKnownOptions(d, "maneuvers").map((o) => o.name), ["Riposte"]);
});

test("Eldritch Adept: the invocation's spells, senses and skills, without warlock levels", () => {
  const choices = FP.featInvocationChoices({});
  assert.ok(choices.includes("Devil's Sight") && choices.includes("Armor of Shadows"));
  assert.ok(!choices.includes("Agonizing Blast") && !choices.includes("Thirsting Blade") && !choices.includes("Book of Ancient Secrets"));
  assert.match(problem("Eldritch Adept", { option: "Agonizing Blast" }), /Pick an eldritch invocation/);
  const c = char([{ name: "Wizard", level: 4 }]);
  take(c, "Eldritch Adept", { option: "Devil's Sight" });
  assert.match(H.getCharacterSenses(c), /Devil's Sight/);
  const d = char([{ name: "Wizard", level: 4 }]);
  take(d, "Eldritch Adept", { option: "Armor of Shadows" });
  assert.equal(H.featureSpells(d).find((s) => s.name === "Mage Armor").kind, "atwill");
  const e = char([{ name: "Bard", level: 4 }], { skillProfs: { Deception: { prof: true, expertise: false } } });
  const feat = take(e, "Eldritch Adept", { option: "Beguiling Influence" });
  assert.equal(e.skillProfs.Persuasion.prof, true);
  assert.match(FP.featPickDetail(FP.featDef("Eldritch Adept"), feat.picks), /^Beguiling Influence: /);
  FP.revertFeatPicks(e, feat);
  assert.equal(e.skillProfs.Persuasion.prof, false);
  assert.equal(e.skillProfs.Deception.prof, true, "a skill they already had stays");
});

test("Metamagic Adept: two options and 2 sorcery points, added to a sorcerer's", () => {
  const c = char([{ name: "Wizard", level: 4 }]);
  assert.match(problem("Metamagic Adept", { options: ["Subtle Spell"] }, { tasha: true }), /2 different Metamagic options/);
  take(c, "Metamagic Adept", { options: ["Subtle Spell", "Quickened Spell"] });
  assert.deepEqual(CO.allKnownOptions(c, "metamagic").map((o) => [o.name, o.from]), [["Subtle Spell", "Metamagic Adept"], ["Quickened Spell", "Metamagic Adept"]]);
  const own = H.characterResources(c).find((r) => r.key === "feat:sorcery_points");
  assert.equal(own.max, 2);
  assert.equal(own.reset, "long");
  const sorc = char([{ name: "Sorcerer", level: 5 }]);
  take(sorc, "Metamagic Adept", { options: ["Subtle Spell", "Quickened Spell"] });
  const res = H.characterResources(sorc);
  assert.equal(res.find((r) => r.key === "Sorcerer:sorcery_points").max, 7);
  assert.ok(!res.some((r) => r.key === "feat:sorcery_points"));
});

test("Magic Initiate: a class, two of its cantrips and a 1st-level spell cast with that class's ability", () => {
  const def = FP.featDef("Magic Initiate");
  assert.match(problem("Magic Initiate", {}), /Pick a class/);
  assert.match(problem("Magic Initiate", { option: "Cleric", spells: ["Guidance", "Fire Bolt"] }), /2 different cantrips from that class's list/);
  assert.match(problem("Magic Initiate", { option: "Cleric", spells: ["Guidance", "Light", "Sleep"] }), /1st-level spell from that class's list/);
  assert.equal(problem("Magic Initiate", { option: "Cleric", spells: ["Guidance", "Light", "Bless"] }), "");
  const c = char([{ name: "Fighter", level: 4 }], { abilities: { wis: 16 } });
  // Before its picks (an older sheet): the use it always had, and a Choose prompt.
  const feat = { id: "mi", name: "Magic Initiate" };
  c.feats.push(feat);
  assert.deepEqual(featUses(c).map((r) => [r.key, r.name]), [["feat:magic_initiate", "Magic Initiate Spell"]]);
  assert.equal(FP.featPicksPending(feat, c), true);
  FP.applyFeatPicks(c, feat, { ...FP.emptyPicks(def), option: "Cleric", spells: ["Guidance", "Light", "Bless"] });
  assert.equal(FP.featPicksPending(feat, c), false);
  assert.deepEqual(featUses(c).map((r) => [r.key, r.name]), [["feat:magic_initiate", "Bless (Magic Initiate)"]]);
  const spells = H.featureSpells(c);
  assert.deepEqual(spells.map((s) => [s.name, s.kind]), [["Guidance", "known"], ["Light", "known"], ["Bless", "free"]]);
  assert.match(spells[2].note, /Once per long rest at its lowest level.*Uses Wisdom: save DC 13/);
  assert.equal(FP.featCastAbility(c, def, { option: "Wizard" }), "int");
});

test("backgrounds that give a feat: which one, the book's choice for it, and the sheet's offer", () => {
  const grant = (bg) => { const g = FP.backgroundFeatGrant(bg); return g ? g.def.name + (g.option ? " (" + g.option + ")" : "") : null; };
  assert.deepEqual(["Lorehold Student", "Witherbloom Student", "Astral Drifter", "Wildspacer", "Knight of Solamnia", "Mage of High Sorcery",
    "Gate Warden", "Planar Philosopher", "Giant Foundling", "Rune Carver", "Acolyte", "Haunted One", "No such background"].map(grant),
    ["Strixhaven Initiate (Lorehold)", "Strixhaven Initiate (Witherbloom)", "Magic Initiate (Cleric)", "Tough", "Squire of Solamnia", "Initiate of High Sorcery",
      "Scion of the Outer Planes", "Scion of the Outer Planes", "Strike of the Giants", "Rune Shaper", null, null, null]);
  // Every grant names a real feat, and an option it really has.
  let count = 0;
  for(const [name, info] of Object.entries(BACKGROUND_INFO)){
    if(!info.feat) continue;
    count++;
    if(info.feat.choices){ info.feat.choices.forEach((f) => assert.ok(FP.featDef(f), name + ": feat " + f)); continue; }
    const def = FP.featDef(info.feat.name);
    assert.ok(def, name + ": feat " + info.feat.name);
    if(info.feat.option) assert.ok(def.option.options.includes(info.feat.option), name + ": option " + info.feat.option);
  }
  assert.equal(count, 15);
  // The copy remembers where it came from and keeps the book's choice.
  const copy = FP.backgroundFeatCopy("Astral Drifter");
  assert.equal(copy.from, "Astral Drifter");
  assert.equal(copy.lockedOption, "Cleric");
  assert.equal(FP.startingPicks(FP.featDef("Magic Initiate"), copy).option, "Cleric");
  assert.equal(FP.backgroundFeatPicks("Lorehold Student").option, "Lorehold");
  assert.equal(FP.backgroundFeatCopy("Acolyte"), null);
  // An older Wildspacer is offered Tough until it has it or says no.
  const c = char([{ name: "Fighter", level: 3 }]);
  c.background = "Wildspacer";
  assert.equal(FP.backgroundFeatMissing(c).def.name, "Tough");
  c.feats.push(FP.backgroundFeatCopy(c.background));
  assert.equal(FP.backgroundFeatMissing(c), null);
  assert.match(H.getAllCharacterFeatures(c).find((f) => f.isFeat).text, /^\(From your Wildspacer background\)/);
  c.feats = [];
  c.backgroundFeatSkipped = "Wildspacer";
  assert.equal(FP.backgroundFeatMissing(c), null);
  c.background = "Rune Carver"; // a new background is a new offer
  assert.equal(FP.backgroundFeatMissing(c).def.name, "Rune Shaper");
});

test("backgrounds with a choice of feat: Rewarded and Ruined (The Book of Many Things)", () => {
  assert.equal(FP.backgroundFeatLabel("Rewarded"), "Lucky, Magic Initiate or Skilled");
  assert.equal(FP.backgroundFeatLabel("Ruined"), "Alert, Skilled or Tough");
  assert.equal(FP.backgroundFeatLabel("Lorehold Student"), "Strixhaven Initiate (Lorehold)");
  assert.equal(FP.backgroundFeatLabel("Acolyte"), "");
  // Nothing picked yet: the choices and no feat; a pick that isn't one of them counts as none.
  assert.deepEqual(FP.backgroundFeatGrant("Rewarded"), { def: null, option: "", choices: ["Lucky", "Magic Initiate", "Skilled"] });
  assert.equal(FP.backgroundFeatGrant("Rewarded", "Tough").def, null);
  assert.equal(FP.backgroundFeatGrant("Rewarded", "Lucky").def.name, "Lucky");
  assert.equal(FP.backgroundFeatCopy("Ruined"), null);
  const copy = FP.backgroundFeatCopy("Ruined", "Tough");
  assert.deepEqual([copy.name, copy.from, copy.lockedOption], ["Tough", "Ruined", undefined]);
  assert.equal(FP.backgroundFeatPicks("Rewarded", "Magic Initiate").option, "", "the player picks Magic Initiate's class");
  // A campaign adds nothing: the background has a feat of its own.
  assert.deepEqual(FP.campaignLevel1Feats("Dragonlance", "Ruined"), []);
  // The sheet's offer: until one of the feats comes from the background, or the player says no.
  const c = char([{ name: "Fighter", level: 3 }]);
  c.background = "Ruined";
  assert.deepEqual(FP.backgroundFeatMissing(c).choices, ["Alert", "Skilled", "Tough"]);
  c.feats.push({ id: "t", name: "Tough" }); // Tough taken another way: still owed
  assert.ok(FP.backgroundFeatMissing(c));
  c.feats.push(FP.backgroundFeatCopy("Ruined", "Alert"));
  assert.equal(FP.backgroundFeatMissing(c), null);
  c.feats = [];
  c.backgroundFeatSkipped = "Ruined";
  assert.equal(FP.backgroundFeatMissing(c), null);
});

test("campaign bonus feats: Skilled or Tough at level 1 without a background feat, Dragonlance's list at level 4", () => {
  assert.deepEqual(Object.keys(CAMPAIGN_FEATS), ["Dragonlance", "Glory of the Giants"]);
  for(const [name, camp] of Object.entries(CAMPAIGN_FEATS)){
    for(const f of camp.level1.concat(camp.level4 || [])) assert.ok(FP.featDef(f), name + ": " + f);
  }
  assert.equal(CAMPAIGN_FEATS["Dragonlance"].level4.length, 11);
  assert.equal(CAMPAIGN_FEATS["Glory of the Giants"].level4, undefined);
  // Level 1: only when the background has no feat of its own.
  assert.deepEqual(FP.campaignLevel1Feats("Dragonlance", "Acolyte"), ["Skilled", "Tough"]);
  assert.deepEqual(FP.campaignLevel1Feats("Dragonlance", "Knight of Solamnia"), []);
  assert.deepEqual(FP.campaignLevel1Feats("Glory of the Giants", "Rune Carver"), []);
  assert.deepEqual(FP.campaignLevel1Feats("", "Acolyte"), []);
  assert.deepEqual(FP.campaignLevel1Feats("Planescape", "Acolyte"), [], "no rule on record for it");
  // The sheet's offer: until taken or declined, leaving out a feat the character has anyway.
  const c = char([{ name: "Fighter", level: 3 }]);
  c.background = "Acolyte";
  assert.equal(FP.campaignFeatMissing(c), null, "no campaign set");
  c.campaign = "Dragonlance";
  assert.deepEqual(FP.campaignFeatMissing(c), { campaign: "Dragonlance", choices: ["Skilled", "Tough"] });
  c.feats.push({ id: "t", name: "Tough" });
  assert.deepEqual(FP.campaignFeatMissing(c).choices, ["Skilled"], "Tough taken another way");
  const copy = FP.campaignFeatCopy(FP.featDef("Skilled"), "Dragonlance", 1);
  assert.deepEqual([copy.campaign, copy.campaignLevel], ["Dragonlance", 1]);
  c.feats.push(copy);
  assert.equal(FP.campaignFeatMissing(c), null);
  assert.match(H.getAllCharacterFeatures(c).find((f) => f.name === "Skilled").text, /^\(Bonus feat from your Dragonlance campaign\)/);
  c.feats = [];
  c.campaignFeatSkipped = "Dragonlance";
  assert.equal(FP.campaignFeatMissing(c), null);
  c.background = "Mage of High Sorcery";
  delete c.campaignFeatSkipped;
  assert.equal(FP.campaignFeatMissing(c), null, "the background's own feat is the one owed");
  assert.equal(FP.backgroundFeatMissing(c).def.name, "Initiate of High Sorcery");
  // Level 4: Dragonlance only, once.
  assert.equal(FP.campaignFeatsAt(c, 4).length, 11);
  assert.deepEqual(FP.campaignFeatsAt(c, 3), []);
  assert.deepEqual(FP.campaignFeatsAt(c, 5), []);
  c.feats.push(FP.campaignFeatCopy(FP.featDef("Alert"), "Dragonlance", 4));
  assert.deepEqual(FP.campaignFeatsAt(c, 4), []);
  c.feats = [];
  c.campaign = "Glory of the Giants";
  assert.deepEqual(FP.campaignFeatsAt(c, 4), []);
});

test("feat and spell wording: plain sentences, no semicolons, dashes or shorthand", () => {
  const banned = /[;–—−]/;
  // Shorthand the summaries used to lean on: STR/DEX, HP, ft, lb, vs.
  const shorthand = /\b(STR|DEX|CON|INT|WIS|CHA|HP|ft|lb|vs)\b/;
  for(const f of FEATS_CATALOG){
    const text = [f.summary, f.description, f.prerequisite].concat(f.option && f.option.details ? Object.values(f.option.details) : []).join(" ");
    assert.ok(!banned.test(text), f.name + ": semicolon or dash");
    assert.ok(!shorthand.test(f.summary), f.name + ": shorthand in the summary");
    assert.match(f.summary, /^[A-Z].*\.$/, f.name + ": summary is a sentence");
  }
  for(const [name, d] of Object.entries(SPELL_DATA)){
    assert.ok(!banned.test(d.summary + d.material), name + ": semicolon or dash");
    assert.ok(!shorthand.test(d.summary), name + ": shorthand in the summary");
    assert.match(d.summary, /^[A-Z].*\.$/, name + ": summary is a sentence");
  }
  for(const [name, uses] of Object.entries(FEAT_RESOURCES)){
    for(const u of uses) assert.ok(!banned.test(u.hint) && !/\bft\b/.test(u.hint), name + ": use hint");
  }
});

test("Spell Sniper: one attack-roll cantrip from a list that has one, cast with that list's ability", () => {
  const def = FP.featDef("Spell Sniper");
  assert.deepEqual(def.option.options, ["Druid", "Sorcerer", "Warlock", "Wizard"], "bard and cleric have no attack-roll cantrip");
  const offered = (option) => FP.featSpellGroups(def, { option })[0].options;
  assert.deepEqual(FP.featSpellGroups(def, {}).map((g) => g.options.length), [0], "nothing to pick before the list");
  assert.deepEqual(offered("Wizard"), ["Booming Blade", "Chill Touch", "Fire Bolt", "Green-Flame Blade", "Ray of Frost", "Shocking Grasp"]);
  assert.deepEqual(offered("Druid"), ["Magic Stone", "Primal Savagery", "Produce Flame", "Thorn Whip"]);
  assert.ok(offered("Warlock").includes("Eldritch Blast") && !offered("Wizard").includes("Eldritch Blast"));
  for(const o of def.option.options){
    assert.ok(offered(o).length > 0, o + " has something to pick");
    for(const n of offered(o)) assert.equal(SPELL_DATA[n].level, 0, n + " is a cantrip");
  }
  // Only cantrips that need an attack roll: never a save or utility one.
  for(const n of ["Mage Hand", "Frostbite", "Sacred Flame", "Guidance", "Vicious Mockery"]) assert.ok(!offered("Wizard").concat(offered("Druid"), offered("Warlock"), offered("Sorcerer")).includes(n), n);
  assert.deepEqual(FP.featSpellEntries(def, { option: "Wizard", spells: ["Fire Bolt"] }), [{ name: "Fire Bolt", use: "known" }]);
  assert.equal(FP.featCastAbility({}, def, { option: "Wizard" }), "int");
  assert.equal(FP.featCastAbility({}, def, { option: "Sorcerer" }), "cha");
  assert.equal(FP.featCastAbility({}, def, { option: "Druid" }), "wis");
});
