/* The 2024 Player's Handbook's General, Fighting Style and Epic Boon
   feats (chapter 5, pp. 202-211, checked against books/Players_Handbook_2024
   on 2026-11-05): the catalog against the book's feat list, who is offered
   them and who qualifies, and what they do on the sheet. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as FP from "../js/core/feat-picks.js";
import { FEATS_CATALOG } from "../js/data/feats.js";
import { PHB_2024_GENERAL_FEATS, PHB_2024_STYLE_FEATS, PHB_2024_BOONS } from "../js/data/feats/phb2024-general.js";
import { featOffered, featDeathSaveAdvantage } from "../js/core/feats-2024.js";
import { computeSpeed, getCharacterSenses, maxHp, computeArmorClass, heavyArmorMasterActive, heavyArmorMasterAmount } from "../js/core/vitals.js";
import { raceWards } from "../js/core/class-features.js";
import { characterReminders } from "../js/core/reminders.js";
import { spellRangeText } from "../js/core/spell-scaling.js";
import { isProficientWithWeapon, weaponDamageBonus, bonusActionAttacks, polearm2024 } from "../js/core/equipment.js";

const AB = { str: 16, dex: 16, con: 14, int: 14, wis: 12, cha: 10 };
function char(classes, extra = {}){
  return Object.assign({ abilities: { ...AB, ...(extra.abilities || {}) }, saveProfs: {}, skillProfs: extra.skillProfs || {}, classes,
    inventory: extra.inventory || [], feats: [], features: [], spells: [], languages: ["Common"], resourcesUsed: {},
    race: extra.race || "Human", initiativeMisc: 0, acMisc: 0, speed: 30, hp: { max: 40, current: 40, temp: 0 } }, extra.more || {});
}
function take(c, name, picks = {}){
  const def = FP.featDef(name);
  const feat = { id: "f" + c.feats.length, name };
  c.feats.push(feat);
  if(FP.featHasPicks(def)) FP.applyFeatPicks(c, feat, { ...FP.emptyPicks(def), ...picks });
  return feat;
}
const fighter = (level, extra) => char([{ name: "Fighter", subclass: "", level }], extra);

// The book's Feat List (p. 199), by category, less the Origin feats.
const GENERAL = ["Actor", "Athlete", "Charger", "Chef", "Crossbow Expert", "Crusher", "Defensive Duelist", "Dual Wielder", "Durable",
  "Elemental Adept", "Fey Touched", "Grappler", "Great Weapon Master", "Heavily Armored", "Heavy Armor Master", "Inspiring Leader",
  "Keen Mind", "Lightly Armored", "Mage Slayer", "Martial Weapon Training", "Medium Armor Master", "Moderately Armored",
  "Mounted Combatant", "Observant", "Piercer", "Poisoner", "Polearm Master", "Resilient", "Ritual Caster", "Sentinel",
  "Shadow Touched", "Sharpshooter", "Shield Master", "Skill Expert", "Skulker", "Slasher", "Speedy", "Spell Sniper",
  "Telekinetic", "Telepathic", "War Caster", "Weapon Master"];
const STYLES = ["Archery", "Blind Fighting", "Defense", "Dueling", "Great Weapon Fighting", "Interception", "Protection",
  "Thrown Weapon Fighting", "Two-Weapon Fighting", "Unarmed Fighting"];
const BOONS = ["Combat Prowess", "Dimensional Travel", "Energy Resistance", "Fate", "Fortitude", "Irresistible Offense", "Recovery",
  "Skill", "Speed", "Spell Recall", "the Night Spirit", "Truesight"].map((n) => "Boon of " + n);

test("the book's 42 General (Ability Score Improvement is the level-up's own), 10 Fighting Style and 12 Epic Boon feats", () => {
  const bare = (n) => n.replace(/ \(2024\)$/, "");
  assert.deepEqual(PHB_2024_GENERAL_FEATS.map((f) => bare(f.name)), GENERAL);
  assert.deepEqual(PHB_2024_STYLE_FEATS.map((f) => f.name), STYLES);
  assert.deepEqual(PHB_2024_BOONS.map((f) => f.name), BOONS);
  for(const f of PHB_2024_GENERAL_FEATS.concat(PHB_2024_STYLE_FEATS, PHB_2024_BOONS)){
    assert.equal(f.source, "XPHB", f.name);
    assert.ok(FEATS_CATALOG.includes(f), f.name + " in the catalog");
    // A name an older feat has carries (2024).
    const older = FEATS_CATALOG.some((x) => x !== f && x.name === bare(f.name));
    assert.equal(/ \(2024\)$/.test(f.name), older, f.name + ": (2024) only when needed");
    assert.match(f.description, /\S/);
  }
  for(const f of PHB_2024_GENERAL_FEATS) assert.equal(f.requires.level, 4, f.name + ": level 4");
  for(const f of PHB_2024_BOONS){ assert.equal(f.requires.level, 19, f.name); assert.equal(f.abilityMax, 30, f.name); }
  for(const f of PHB_2024_STYLE_FEATS) assert.equal(f.requires.style, true, f.name);
  // Spot checks against the book's text.
  const d = (n) => FP.featDef(n);
  assert.deepEqual(d("Heavily Armored (2024)").ability, ["con", "str"]);
  assert.deepEqual(d("Lightly Armored (2024)").armor, ["Light armor", "Shields"]);
  assert.deepEqual(d("Moderately Armored (2024)").armor, ["Medium armor"]);
  assert.deepEqual(d("Keen Mind (2024)").skillOptions, ["Arcana", "History", "Investigation", "Nature", "Religion"]);
  assert.deepEqual(d("Observant (2024)").skillOptions, ["Insight", "Investigation", "Perception"]);
  assert.deepEqual(d("Boon of Irresistible Offense").ability, ["str", "dex"]);
  assert.deepEqual(d("Boon of Energy Resistance").damagePicks.options, ["Acid", "Cold", "Fire", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"]);
});

test("offered only on the 2024 rules, and the prerequisites say why", () => {
  const gwm = FP.featDef("Great Weapon Master (2024)");
  assert.equal(featOffered(gwm, false), false);
  assert.equal(featOffered(gwm, true), true);
  assert.equal(featOffered(FP.featDef("Great Weapon Master"), false), true, "the 2014 feat for everyone");
  const why = (name, who) => FP.featRequiresReason(FP.featDef(name), Object.assign({ level: 4, scores: AB, armor: ["light", "medium", "heavy", "shield"], spellcasting: true, styles: [], hasStyleFeature: true }, who));
  assert.equal(why("Great Weapon Master (2024)", { level: 3 }), "needs level 4");
  assert.equal(why("Great Weapon Master (2024)", { scores: { ...AB, str: 12 } }), "needs STR 13");
  assert.equal(why("Polearm Master (2024)", { scores: { ...AB, str: 8, dex: 13 } }), "");
  assert.equal(why("War Caster (2024)", { spellcasting: false }), "needs the Spellcasting or Pact Magic feature");
  assert.equal(why("Heavy Armor Master (2024)", { armor: ["light", "medium"] }), "needs heavy armor training");
  assert.equal(why("Shield Master (2024)", { armor: ["light"] }), "needs shield training");
  assert.equal(why("Archery", { hasStyleFeature: false }), "needs the Fighting Style feature");
  assert.equal(why("Archery", { styles: ["Archery"] }), "you have this style");
  assert.equal(why("Boon of Truesight", { level: 18 }), "needs level 19");
  assert.equal(why("Boon of Truesight", { level: 19 }), "");
  // The wizard and older callers pass no scores: nothing is ruled out on them.
  assert.equal(FP.featRequiresReason(FP.featDef("Great Weapon Master (2024)"), { level: 4 }), "");
  // The 2024 species count as their family for the racial feats.
  assert.equal(FP.featRequiresReason(FP.featDef("Squat Nimbleness"), { race: "Dwarf (2024)", level: 4, feats: [] }), "");
  assert.equal(FP.featRequiresReason(FP.featDef("Elven Accuracy"), { race: "Elf (2024)", level: 4, feats: [] }), "");
});

test("Keen Mind and Observant: proficiency, or expertise in a skill you know", () => {
  const c = fighter(4, { skillProfs: { Perception: { prof: true, expertise: false } } });
  const keen = take(c, "Keen Mind (2024)", { skills: ["History"] });
  assert.equal(c.abilities.int, 15);
  assert.deepEqual(c.skillProfs.History, { prof: true, expertise: false });
  take(c, "Observant (2024)", { ability: "wis", skills: ["Perception"] });
  assert.deepEqual(c.skillProfs.Perception, { prof: true, expertise: true }, "already proficient: expertise");
  assert.equal(FP.featPicksProblem(FP.featDef("Observant (2024)"), { ...FP.emptyPicks(FP.featDef("Observant (2024)")), ability: "wis", skills: ["Insight"] }, { skillProfs: c.skillProfs }), "");
  FP.revertFeatPicks(c, keen);
  assert.equal(c.skillProfs.History.prof, false, "taken back");
});

test("Epic Boons: a +1 up to 30, every skill, chosen resistances, 40 hit points, truesight, speed", () => {
  const c = fighter(19, { abilities: { str: 20 } });
  take(c, "Boon of Combat Prowess", { ability: "str" });
  assert.equal(c.abilities.str, 21, "past 20");
  take(c, "Boon of Skill", { ability: "dex", expertise: ["Stealth"] });
  assert.ok(Object.values(c.skillProfs).every((e) => e.prof) && Object.keys(c.skillProfs).length === 18, "all 18 skills");
  assert.equal(c.skillProfs.Stealth.expertise, true);
  assert.equal(FP.expertiseReason({ skillProfs: {} }, {}, "Arcana", FP.featDef("Boon of Skill")), "", "any skill can take its expertise");
  take(c, "Boon of Energy Resistance", { ability: "con", options: ["Fire", "Psychic"] });
  assert.deepEqual(raceWards(c).resist.filter((w) => w.source === "Boon of Energy Resistance").map((w) => w.type), ["fire", "psychic"]);
  assert.match(FP.featPicksProblem(FP.featDef("Boon of Energy Resistance"), { ...FP.emptyPicks(FP.featDef("Boon of Energy Resistance")), ability: "con", options: ["Fire", "Fire"] }, {}), /2 different damage types/);
  const hp = maxHp(c);
  take(c, "Boon of Fortitude", { ability: "wis" });
  assert.equal(maxHp(c), hp + 40);
  assert.ok(H.hpBonuses(c).some((b) => b.name === "Boon of Fortitude" && b.value === 40));
  take(c, "Boon of Truesight", { ability: "int" });
  assert.match(getCharacterSenses(c), /Truesight 60 ft/);
  take(c, "Boon of Speed", { ability: "cha" });
  assert.equal(computeSpeed(c).value, 60);
});

test("Boon of Fate and Boon of Recovery: rows with their rolls", () => {
  const c = fighter(19);
  take(c, "Boon of Fate", { ability: "str" });
  take(c, "Boon of Recovery", { ability: "con" });
  const uses = H.characterResources(c).filter((r) => r.key.startsWith("feat:"));
  const fate = uses.find((r) => r.name === "Improve Fate"), vitality = uses.find((r) => r.name === "Recover Vitality");
  assert.deepEqual([fate.max, fate.reset, fate.roll.qty, fate.roll.die, fate.initiativeRegain], [1, "short", 2, 4, 1]);
  assert.deepEqual([vitality.max, vitality.pool, vitality.roll.die, vitality.roll.heal], [10, true, 10, true]);
  assert.ok(uses.find((r) => r.name === "Last Stand"));
});

test("Fighting Style feats: the style on the sheet in its 2024 words", () => {
  const c = fighter(4);
  take(c, "Great Weapon Fighting");
  const f = c.features.find((x) => x.fightingStyle === "Great Weapon Fighting");
  assert.ok(f && /treat any 1 or 2 on a damage die as a 3/.test(f.text));
  const rem = characterReminders(c).find((r) => r.name === "Great Weapon Fighting");
  assert.equal(rem.line, "A 1 or 2 on the damage dice of a melee weapon held in two hands counts as a 3");
  take(c, "Defense");
  const ac = computeArmorClass(Object.assign(c, { inventory: [{ id: "a", type: "armor", name: "Chain Mail", category: "heavy", baseAC: 16, equipped: true, proficient: true }] }));
  assert.equal(ac.value, 17, "Defense +1");
  FP.revertFeatPicks(c, c.feats[1]);
  assert.ok(!c.features.some((x) => x.fightingStyle === "Defense"), "taken back with the feat");
});

test("General feats on the sheet: speeds, senses, armor, weapons, damage and spells", () => {
  const c = fighter(8);
  take(c, "Athlete (2024)", { ability: "str" });
  assert.ok(computeSpeed(c).others.some((o) => o.type === "climb" && o.value === 30 && o.source === "Athlete (2024)"));
  take(c, "Speedy", { ability: "dex" });
  assert.equal(computeSpeed(c).value, 40);
  take(c, "Skulker (2024)");
  assert.match(getCharacterSenses(c), /Blindsight 10 ft/);
  take(c, "Durable (2024)");
  assert.equal(featDeathSaveAdvantage(c), true);
  // Heavy Armor Master: the proficiency bonus off, in heavy armor.
  const ham = fighter(8, { inventory: [{ type: "armor", category: "heavy", equipped: true, name: "Plate" }] });
  take(ham, "Heavy Armor Master (2024)", { ability: "con" });
  assert.equal(heavyArmorMasterActive(ham), true);
  assert.equal(heavyArmorMasterAmount(ham), 3, "proficiency bonus 3 at level 8");
  assert.equal(heavyArmorMasterAmount(fighter(13, { inventory: ham.inventory, more: { feats: [{ name: "Heavy Armor Master (2024)" }] } })), 5);
  // Great Weapon Master: the proficiency bonus on a heavy weapon's damage.
  const gs = { type: "weapon", name: "Greatsword", equipped: true, proficient: true };
  const gwm = fighter(8);
  const before = weaponDamageBonus(gwm, gs);
  take(gwm, "Great Weapon Master (2024)");
  assert.equal(weaponDamageBonus(gwm, gs), before + 3, "STR 17 (still +3), and the proficiency bonus");
  assert.equal(weaponDamageBonus(gwm, { type: "weapon", name: "Longsword", equipped: true, proficient: true }), 3, "not a heavy weapon");
  // Polearm Master: a spear, a quarterstaff, a heavy reach weapon.
  assert.deepEqual(["Spear", "Quarterstaff", "Pike", "Glaive", "Greatsword", "Whip"].map((n) => polearm2024({ type: "weapon", name: n })), [true, true, true, true, false, false]);
  const pm = fighter(4, { inventory: [{ type: "weapon", name: "Pike", equipped: true }] });
  take(pm, "Polearm Master (2024)", { ability: "str" });
  assert.ok(bonusActionAttacks(pm).some((x) => /Polearm Master/.test(x)));
  // Martial Weapon Training.
  const wiz = char([{ name: "Wizard", subclass: "", level: 4 }]);
  assert.equal(isProficientWithWeapon(wiz, "Longsword", "martial"), false);
  take(wiz, "Martial Weapon Training", { ability: "dex" });
  assert.equal(isProficientWithWeapon(wiz, "Longsword", "martial"), true);
  // Spell Sniper: 60 feet more.
  take(wiz, "Spell Sniper (2024)", { ability: "int" });
  assert.equal(spellRangeText(wiz, "Fire Bolt", "120 feet"), "180 feet (60 more from Spell Sniper)");
  // Ritual Caster: as many level 1 rituals as the proficiency bonus, always prepared.
  const rc = FP.featSpellGroups(FP.featDef("Ritual Caster (2024)"), {}, { pb: 3 });
  assert.equal(rc[0].count, 3);
  assert.ok(rc[0].options.includes("Find Familiar") && rc[0].options.every((n) => !/^Fireball$/.test(n)));
  take(wiz, "Ritual Caster (2024)", { ability: "int", spells: ["Find Familiar", "Detect Magic"] });
  const fam = H.featureSpells(wiz).find((s) => s.name === "Find Familiar");
  assert.equal(fam.kind, "prepared");
});
