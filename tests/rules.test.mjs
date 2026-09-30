/* Rules: the sheet's calculations against numbers worked out by hand from
   the 2014 rules. Each test builds the smallest character that shows the
   rule, so a failure points straight at the calculation that broke. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { CLASS_PROFICIENCIES } from "../js/data/classes.js";
import * as FP from "../js/core/feat-picks.js";

const AB = { str: 10, dex: 14, con: 14, int: 10, wis: 10, cha: 10 };
function char(classes, extra = {}){
  return { abilities: { ...AB, ...(extra.abilities || {}) }, saveProfs: extra.saveProfs || {}, classes,
    inventory: extra.inventory || [], feats: extra.feats || [], resourcesUsed: extra.resourcesUsed || {},
    race: extra.race || "Human", initiativeMisc: 0, acMisc: 0 };
}
const feature = (cls, sub, level, name) => H.classFeatureList({ name: cls, subclass: sub, level }).find((f) => f.name === name);
const speedGained = (cls, sub, upto) => {
  let total = 0;
  for(let l = 1; l <= upto; l++) total += H.classFeaturesGainedAt({ name: cls, subclass: sub, level: l }, l).reduce((a, f) => a + (f.speed || 0), 0);
  return total;
};

test("proficiency bonus by total level", () => {
  const pb = (l) => H.profBonus({ classes: [{ name: "Fighter", level: l }] });
  assert.deepEqual([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(pb), [2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
});

test("replacing features grow at the right levels", () => {
  const sneak = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19].map((l) => feature("Rogue", "", l, "Sneak Attack").text.match(/(\d+)d6/)[1]);
  assert.deepEqual(sneak.map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.match(feature("Monk", "", 4, "Martial Arts").text, /1d4/);
  assert.match(feature("Monk", "", 10, "Martial Arts").text, /1d6/);
  assert.match(feature("Monk", "", 11, "Martial Arts").text, /1d8/);
  assert.match(feature("Monk", "", 20, "Martial Arts").text, /1d10/);
  assert.match(feature("Barbarian", "", 8, "Rage").text, /\+2 damage/);
  assert.match(feature("Barbarian", "", 9, "Rage").text, /\+3 damage/);
  assert.match(feature("Barbarian", "", 16, "Rage").text, /\+4 damage/);
  assert.match(feature("Fighter", "", 20, "Extra Attack").text, /four times/);
  // Domain spells: only the current list is shown, and it reaches level 9 spells.
  const life = H.classFeatureList({ name: "Cleric", subclass: "Life Domain", level: 9 }).filter((f) => f.name === "Domain Spells");
  assert.equal(life.length, 1);
  assert.match(life[0].text, /Raise Dead/);
});

test("speed bonuses from features add up", () => {
  assert.equal(speedGained("Monk", "", 20), 30);
  assert.equal(speedGained("Monk", "", 9), 15);
  assert.equal(speedGained("Barbarian", "Path of the Berserker", 20), 10);
  assert.equal(speedGained("Rogue", "Scout", 9), 10);
  assert.equal(speedGained("Paladin", "Oath of Glory", 7), 10);
  assert.equal(speedGained("Fighter", "Champion", 20), 0);
});

test("rage damage and rages per day", () => {
  assert.deepEqual([1, 8, 9, 15, 16, 20].map(H.barbarianRageDamage), [2, 2, 3, 3, 4, 4]);
  assert.deepEqual([1, 3, 6, 12, 17].map(H.barbarianRageMax), [2, 3, 4, 5, 6]);
  assert.equal(H.barbarianRageMax(20), Infinity);
});

test("initiative: DEX plus feature, feat and race bonuses", () => {
  assert.equal(H.computeInitiative(char([{ name: "Fighter", level: 5 }])).value, 2);
  assert.equal(H.computeInitiative(char([{ name: "Ranger", level: 3, subclass: "Gloom Stalker" }], { abilities: { wis: 16 } })).value, 5);
  assert.equal(H.computeInitiative(char([{ name: "Wizard", level: 1, subclass: "Chronurgy Magic" }], { abilities: { int: 18 } })).value, 2);
  assert.equal(H.computeInitiative(char([{ name: "Wizard", level: 2, subclass: "Chronurgy Magic" }], { abilities: { int: 18 } })).value, 6);
  assert.equal(H.computeInitiative(char([{ name: "Fighter", level: 1 }], { feats: [{ name: "Alert" }] })).value, 7);
  assert.equal(H.computeInitiative(char([{ name: "Fighter", level: 5 }], { race: "Harengon" })).value, 5);
  assert.equal(H.computeInitiative(char([{ name: "Paladin", level: 7, subclass: "Oath of the Watchers" }])).value, 5);
});

test("armor class: armor, unarmored defense and feature bonuses", () => {
  const plate = { type: "armor", equipped: true, name: "Plate", category: "heavy", baseAC: 18, magicBonus: 0 };
  const shield = { type: "armor", equipped: true, name: "Shield", category: "shield", baseAC: 2 };
  assert.equal(H.computeArmorClass(char([{ name: "Barbarian", level: 1 }], { abilities: { con: 16 } })).value, 15);
  assert.equal(H.computeArmorClass(char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 } })).value, 15);
  assert.equal(H.computeArmorClass(char([{ name: "Monk", level: 1 }], { abilities: { wis: 16 }, inventory: [shield] })).value, 14);
  assert.equal(H.computeArmorClass(char([{ name: "Sorcerer", level: 1, subclass: "Draconic Bloodline" }])).value, 15);
  assert.equal(H.computeArmorClass(char([{ name: "Cleric", level: 5, subclass: "Forge Domain" }], { inventory: [plate] })).value, 18);
  assert.equal(H.computeArmorClass(char([{ name: "Cleric", level: 6, subclass: "Forge Domain" }], { inventory: [plate, shield] })).value, 21);
  assert.equal(H.computeArmorClass(char([{ name: "Cleric", level: 6, subclass: "Life Domain" }], { inventory: [plate] })).value, 18);
});

test("armor class: Dual Wielder needs a melee weapon in each hand", () => {
  const weapon = (name) => ({ type: "weapon", equipped: true, name });
  const dw = { feats: [{ name: "Dual Wielder" }] };
  const ac = (inventory, extra = dw) => H.computeArmorClass(char([{ name: "Fighter", level: 4 }], { ...extra, inventory })).value;
  assert.equal(ac([weapon("Longsword"), weapon("Rapier")]), 13);          // 10 + DEX 2 + 1
  assert.equal(ac([weapon("Longsword"), weapon("Rapier")], {}), 12);      // no feat
  assert.equal(ac([weapon("Longsword")]), 12);                           // one weapon
  assert.equal(ac([weapon("Longsword"), { ...weapon("Dagger"), equipped: false }]), 12);
  assert.equal(ac([weapon("Longsword"), weapon("Hand Crossbow")]), 12);  // ranged doesn't count
});

test("saving throws: proficiency, Aura of Protection, granted saves", () => {
  const ab = { str: 14, dex: 16, con: 12, int: 10, wis: 16, cha: 16 };
  const pal6 = char([{ name: "Paladin", level: 6 }], { abilities: ab, saveProfs: { wis: true, cha: true } });
  assert.equal(H.computeSave(pal6, "wis").value, 9);   // 3 + prof 3 + aura 3
  assert.equal(H.computeSave(pal6, "str").value, 5);   // 2 + aura 3
  const lowCha = char([{ name: "Paladin", level: 6 }], { abilities: { ...ab, cha: 8 } });
  assert.equal(H.computeSave(lowCha, "cha").value, 0); // -1 + aura minimum +1
  assert.equal(H.computeSave(char([{ name: "Paladin", level: 5 }], { abilities: ab }), "str").value, 2);
  const monk = (l) => char([{ name: "Monk", level: l }], { abilities: ab, saveProfs: { str: true, dex: true } });
  assert.equal(H.computeSave(monk(13), "int").grantedBy, null);
  assert.equal(H.computeSave(monk(14), "int").grantedBy, "Diamond Soul");
  assert.equal(H.computeSave(monk(14), "int").value, 5);
  assert.equal(H.computeSave(char([{ name: "Rogue", level: 15 }], { abilities: ab }), "wis").grantedBy, "Slippery Mind");
});

test("weapon attacks: Battle Ready and Hex Warrior", () => {
  const sword = { name: "Longsword", ability: "str", proficient: true, magicBonus: 0 };
  const bs = char([{ name: "Artificer", level: 3, subclass: "Battle Smith" }], { abilities: { str: 10, int: 18 } });
  assert.equal(H.weaponAttackBonus(bs, sword), 2);
  assert.equal(H.weaponAttackBonus(bs, { ...sword, magicBonus: 1 }), 7);
  assert.equal(H.weaponDamageBonus(bs, { ...sword, magicBonus: 1 }), 5);
  const hex = char([{ name: "Warlock", level: 1, subclass: "The Hexblade" }], { abilities: { str: 10, cha: 18 } });
  assert.equal(H.weaponAttackBonus(hex, sword), 2);
  assert.equal(H.weaponAttackBonus(hex, { ...sword, chosenWeapon: true }), 6);
  assert.equal(H.chosenWeaponFeature(hex).name, "Hex Warrior");
  const fiend = char([{ name: "Warlock", level: 1, subclass: "The Fiend" }], { abilities: { str: 10, cha: 18 } });
  assert.equal(H.weaponAttackBonus(fiend, { ...sword, chosenWeapon: true }), 2);
});

test("subclass proficiency grants, without touching shared class data", () => {
  const before = JSON.stringify(CLASS_PROFICIENCIES);
  const valor = H.classProficiencies(char([{ name: "Bard", level: 3, subclass: "College of Valor" }]), 0);
  assert.ok(valor.weapons.includes("Martial weapons") && valor.armor.includes("Shields"));
  assert.ok(!H.classProficiencies(char([{ name: "Bard", level: 2, subclass: "College of Valor" }]), 0).weapons.includes("Martial weapons"));
  assert.ok(H.classProficiencies(char([{ name: "Cleric", level: 1, subclass: "Forge Domain" }]), 0).tools.includes("Smith's tools"));
  assert.ok(H.isProficientWithWeapon(char([{ name: "Artificer", level: 3, subclass: "Battle Smith" }]), "Longsword", "martial"));
  assert.equal(JSON.stringify(CLASS_PROFICIENCIES), before);
});

test("resources: counts scale and rests restore the right ones", () => {
  const res = (c) => Object.fromEntries(H.characterResources(c).map((r) => [r.name, r.max]));
  assert.equal(res(char([{ name: "Fighter", level: 17 }]))["Indomitable"], 3);
  assert.equal(res(char([{ name: "Fighter", level: 17 }]))["Action Surge"], 2);
  assert.equal(res(char([{ name: "Cleric", level: 18 }]))["Channel Divinity"], 3);
  assert.equal(res(char([{ name: "Rogue", level: 13, subclass: "Misfortune Bringer" }]))["Jinx Points"], 6);

  const c = char([{ name: "Warlock", level: 14, subclass: "The Genie" }], { resourcesUsed: {} });
  c.resourcesUsed = { "Warlock:limited_wish": 1, "Warlock:bottled_respite": 1, "Warlock:mystic_arcanum_6": 1 };
  H.restoreResources(c, "short");
  assert.deepEqual(Object.keys(c.resourcesUsed).sort(), ["Warlock:bottled_respite", "Warlock:limited_wish", "Warlock:mystic_arcanum_6"]);
  H.restoreResources(c, "long");
  assert.deepEqual(Object.keys(c.resourcesUsed), ["Warlock:limited_wish"]); // manual reset survives a long rest
});

test("spells granted by features: levels, kinds, sources and the Spells tab", () => {
  const names = (classes) => H.featureSpells(char(classes)).map((s) => s.name);
  assert.deepEqual(names([{ name: "Cleric", level: 1, subclass: "Life Domain" }]), ["Bless", "Cure Wounds"]);
  assert.deepEqual(names([{ name: "Cleric", level: 5, subclass: "Life Domain" }]), ["Bless", "Cure Wounds", "Lesser Restoration", "Spiritual Weapon", "Beacon of Hope", "Revivify"]);
  assert.equal(names([{ name: "Sorcerer", level: 1, subclass: "Clockwork Soul" }]).length, 2);
  assert.ok(names([{ name: "Sorcerer", level: 7, subclass: "Clockwork Soul" }]).includes("Summon Construct"));
  assert.ok(!names([{ name: "Sorcerer", level: 2, subclass: "Shadow Magic" }]).includes("Darkness"));
  assert.ok(names([{ name: "Sorcerer", level: 3, subclass: "Shadow Magic" }]).includes("Darkness"));
  const totem = H.featureSpells(char([{ name: "Barbarian", level: 3, subclass: "Path of the Totem Warrior" }]));
  assert.deepEqual(totem.map((s) => s.kind), ["ritual", "ritual"]);
  assert.equal(totem[0].source, "Path of the Totem Warrior");
  // Book names resolve to the catalog entry (Melf's Acid Arrow is SRD Acid Arrow).
  const alch = H.featureSpells(char([{ name: "Artificer", level: 5, subclass: "Alchemist" }]));
  assert.equal(alch.find((s) => s.name === "Melf's Acid Arrow").data.level, 2);
  // Granted once even when two features grant it.
  const dup = H.featureSpells(char([{ name: "Cleric", level: 1, subclass: "Light Domain" }, { name: "Warlock", level: 1, subclass: "The Celestial" }]));
  assert.equal(dup.filter((s) => s.name === "Light").length, 1);
  // The Spells tab: casters always, non-casters only with a granted spell.
  assert.ok(!H.hasSpellsTab(char([{ name: "Monk", level: 3, subclass: "Way of the Open Hand" }])));
  assert.ok(H.hasSpellsTab(char([{ name: "Monk", level: 3, subclass: "Way of Shadow" }])));
  assert.ok(!H.hasSpellsTab(char([{ name: "Barbarian", level: 2 }])));
  assert.ok(H.hasSpellsTab(char([{ name: "Barbarian", level: 3, subclass: "Path of the Totem Warrior" }])));
});

test("spell slots: single class, half casters, multiclass, pact magic", () => {
  const slots = (classes) => H.computeSpellSlots(classes);
  assert.deepEqual(Object.values(slots([{ name: "Wizard", level: 20 }]).slots), [4, 3, 3, 3, 3, 2, 2, 1, 1]);
  assert.deepEqual(Object.values(slots([{ name: "Paladin", level: 5 }]).slots).slice(0, 3), [4, 2, 0]);
  assert.deepEqual(Object.values(slots([{ name: "Paladin", level: 10 }, { name: "Sorcerer", level: 10 }]).slots), [4, 3, 3, 3, 2, 1, 1, 1, 0]);
  assert.equal(slots([{ name: "Fighter", level: 3, subclass: "Eldritch Knight" }]).slots[1], 2);
  assert.deepEqual(slots([{ name: "Warlock", level: 11 }]).pact, { max: 3, slotLevel: 5 });
});

test("feats: Medium Armor Master, Tough, Mobile and Durable", () => {
  const breastplate = { type: "armor", equipped: true, name: "Breastplate", category: "medium", baseAC: 14 };
  const dex18 = { abilities: { dex: 18 }, inventory: [breastplate] };
  assert.equal(H.computeArmorClass(char([{ name: "Fighter", level: 4 }], dex18)).value, 16);   // DEX capped at +2
  assert.equal(H.computeArmorClass(char([{ name: "Fighter", level: 4 }], { ...dex18, feats: [{ name: "Medium Armor Master" }] })).value, 17);
  assert.equal(H.computeArmorClass(char([{ name: "Fighter", level: 4 }], { abilities: { dex: 14 }, inventory: [breastplate], feats: [{ name: "Medium Armor Master" }] })).value, 16);

  const hp = (feats, classes = [{ name: "Fighter", level: 3 }, { name: "Wizard", level: 2 }]) => H.maxHp({ ...char(classes, { feats }), hp: { max: 40 } });
  assert.equal(hp([]), 40);
  assert.equal(hp([{ name: "Tough" }]), 50);                                     // 2 per character level (5)

  const speed = (feats) => H.computeSpeed({ ...char([{ name: "Rogue", level: 1 }], { feats }), speed: 30 });
  assert.deepEqual([speed([]).value, speed([]).bonus], [30, 0]);
  assert.deepEqual([speed([{ name: "Mobile" }]).value, speed([{ name: "Mobile" }]).bonus], [40, 10]);

  const heal = (con, feats, roll) => H.hitDieHealing(char([{ name: "Fighter", level: 1 }], { abilities: { con }, feats }), roll);
  assert.equal(heal(16, [], 1), 4);                          // 1 + 3
  assert.equal(heal(16, [{ name: "Durable" }], 1), 6);       // floor is 2 x CON mod
  assert.equal(heal(16, [{ name: "Durable" }], 5), 8);       // a good roll still counts
  assert.equal(heal(8, [{ name: "Durable" }], 1), 2);        // floor is at least 2
  assert.equal(heal(8, [], 1), 1);
});

test("feat resources: Lucky, Magic Initiate, Martial Adept", () => {
  const res = (classes, feats, used = {}) => H.characterResources(char(classes, { feats, resourcesUsed: used }));
  const lucky = res([{ name: "Rogue", level: 1 }], [{ name: "Lucky" }]).find((r) => r.name === "Luck Points");
  assert.equal(lucky.max, 3);
  assert.equal(lucky.reset, "long");
  const mi = res([{ name: "Rogue", level: 1 }], [{ name: "Magic Initiate" }]).find((r) => r.source === "Magic Initiate");
  assert.equal(mi.max, 1);
  assert.equal(mi.reset, "long");
  // Martial Adept alone: its own d6, back on a short rest.
  const adept = res([{ name: "Rogue", level: 4 }], [{ name: "Martial Adept" }]).find((r) => r.source === "Martial Adept");
  assert.equal(adept.max, 1);
  assert.equal(adept.reset, "short");
  // With Battle Master dice it joins that pool instead.
  const bm = res([{ name: "Fighter", level: 7, subclass: "Battle Master" }], [{ name: "Martial Adept" }], { "Fighter:superiority_dice": 6 });
  assert.equal(bm.filter((r) => /Superiority/.test(r.name)).length, 1);
  const pool = bm.find((r) => r.key === "Fighter:superiority_dice");
  assert.equal(pool.max, 6);
  assert.equal(pool.used, 6);
  assert.equal(res([{ name: "Rogue", level: 1 }], []).length, 0);
  // A rest restores feat uses like class ones.
  const c = char([{ name: "Rogue", level: 1 }], { feats: [{ name: "Lucky" }], resourcesUsed: { "feat:luck_points": 2 } });
  assert.deepEqual(H.restoreResources(c, "long"), ["Luck Points"]);
  assert.equal(c.resourcesUsed["feat:luck_points"], undefined);
});

test("feat picks: half-feat +1, Resilient save, Skilled and Skill Expert", () => {
  const skills = () => ({ Stealth: { prof: true, expertise: false }, Arcana: { prof: false, expertise: false } });
  const take = (name, picks, extra = {}) => {
    const c = { ...char([{ name: "Rogue", level: 4 }], extra), skillProfs: skills() };
    const feat = { id: "f1", name };
    c.feats.push(feat);
    const def = FP.featDef(name);
    assert.equal(FP.featPicksProblem(def, picks, c), "", name + " picks are complete");
    FP.applyFeatPicks(c, feat, picks);
    return { c, feat };
  };

  // Athlete: +1 to the chosen ability, taken back on removal.
  const ath = take("Athlete", { ability: "dex", skills: [], expertise: [] });
  assert.equal(ath.c.abilities.dex, 15);
  assert.equal(FP.featAppliedSummary(ath.feat), "Dexterity +1");
  FP.revertFeatPicks(ath.c, ath.feat);
  assert.equal(ath.c.abilities.dex, 14);
  // A score already at 20 doesn't move, so removal doesn't lower it either.
  const capped = take("Athlete", { ability: "dex", skills: [], expertise: [] }, { abilities: { dex: 20 } });
  assert.equal(capped.c.abilities.dex, 20);
  FP.revertFeatPicks(capped.c, capped.feat);
  assert.equal(capped.c.abilities.dex, 20);
  // Only the listed abilities, and one must be picked.
  assert.match(FP.featPicksProblem(FP.featDef("Athlete"), { ability: "int", skills: [], expertise: [] }, {}), /Pick the ability/);
  assert.deepEqual(FP.emptyPicks(FP.featDef("Actor")).ability, "cha");            // fixed: nothing to choose
  assert.equal(FP.featNeedsChoice(FP.featDef("Actor")), false);

  // Resilient: +1 and the save, read from the picks.
  const res = take("Resilient", { ability: "wis", skills: [], expertise: [] });
  const save = H.computeSave(res.c, "wis");
  assert.equal(save.grantedBy, "Resilient");
  assert.equal(save.value, 0 + 2);                                          // WIS 11 (+0) + proficiency 2
  assert.equal(H.computeSave(res.c, "int").prof, false);

  // Skilled: skills go on the sheet, tools are listed as proficiencies.
  const sk = take("Skilled", { ability: "", skills: ["Arcana", "History", "Thieves' tools"], expertise: [] });
  assert.equal(sk.c.skillProfs.Arcana.prof, true);
  assert.equal(sk.c.skillProfs.History.prof, true);
  assert.deepEqual(FP.featProficiencies(sk.c).tools, [{ name: "Thieves' tools", feat: "Skilled" }]);
  FP.revertFeatPicks(sk.c, sk.feat);
  assert.equal(sk.c.skillProfs.Arcana.prof, false);
  assert.equal(sk.c.skillProfs.Stealth.prof, true);                        // untouched
  assert.match(FP.featPicksProblem(FP.featDef("Skilled"), { skills: ["Stealth", "Arcana", "History"] }, { skillProfs: skills() }), /not already proficient/);
  assert.match(FP.featPicksProblem(FP.featDef("Skilled"), { skills: ["Arcana", "Arcana", "History"] }, { skillProfs: skills() }), /3 different/);

  // Skill Expert: a new skill, and expertise in a proficient one (or the new one).
  const se = take("Skill Expert", { ability: "int", skills: ["Arcana"], expertise: ["Stealth"] });
  assert.equal(se.c.abilities.int, 11);
  assert.equal(se.c.skillProfs.Arcana.prof, true);
  assert.equal(se.c.skillProfs.Stealth.expertise, true);
  FP.revertFeatPicks(se.c, se.feat);
  assert.equal(se.c.skillProfs.Stealth.expertise, false);
  assert.equal(se.c.skillProfs.Stealth.prof, true);
  assert.equal(FP.featPicksProblem(FP.featDef("Skill Expert"), { ability: "int", skills: ["Arcana"], expertise: ["Arcana"] }, { skillProfs: skills() }), "");
  assert.match(FP.featPicksProblem(FP.featDef("Skill Expert"), { ability: "int", skills: ["Arcana"], expertise: ["History"] }, { skillProfs: skills() }), /proficient in/);

  // Armor feats list their proficiency; feats from before picks existed are flagged.
  assert.deepEqual(FP.featProficiencies({ feats: [{ name: "Moderately Armored" }] }).armor.map((a) => a.name), ["Medium armor", "Shields"]);
  assert.equal(FP.featPicksPending({ name: "Athlete" }), true);
  assert.equal(FP.featPicksPending({ name: "Athlete", picks: { ability: "" } }), false);
  assert.equal(FP.featPicksPending({ name: "Alert" }), false);
});

test("spell choices: Circle of the Land, the Genie, Divine Soul, patron lists", () => {
  const spells = (classes) => H.featureSpells(char(classes));
  const names = (list, kind) => list.filter((s) => !kind || s.kind === kind).map((s) => s.name).sort();

  // No land picked yet: no land spells, and the pick is pending from druid 3.
  const land = (level, spellChoices) => [{ name: "Druid", subclass: "Circle of the Land", level, spellChoices }];
  assert.deepEqual(names(spells(land(5))), []);
  assert.equal(H.pendingSpellChoices(char(land(2))).length, 0);           // Circle Spells comes at 3
  assert.equal(H.pendingSpellChoices(char(land(3)))[0].choice.id, "land");
  // Arctic at druid 5: the level 3 and 5 spells, always prepared.
  assert.deepEqual(names(spells(land(5, { land: "Arctic" })), "prepared"), ["Hold Person", "Sleet Storm", "Slow", "Spike Growth"]);
  assert.equal(H.pendingSpellChoices(char(land(5, { land: "Arctic" }))).length, 0);

  // The Genie at warlock 5: shared list plus the kind's, as spells you can learn.
  const genie = spells([{ name: "Warlock", subclass: "The Genie", level: 5, spellChoices: { genieKind: "Efreeti" } }]);
  assert.deepEqual(names(genie, "expanded"), ["Burning Hands", "Create Food and Water", "Detect Evil and Good", "Fireball", "Phantasmal Force", "Scorching Ray"]);
  assert.ok(genie.every((s) => s.className === "Warlock"));
  // Wish only from warlock 17.
  assert.ok(!names(spells([{ name: "Warlock", subclass: "The Genie", level: 16, spellChoices: { genieKind: "Dao" } }])).includes("Wish"));
  assert.ok(names(spells([{ name: "Warlock", subclass: "The Genie", level: 17, spellChoices: { genieKind: "Dao" } }])).includes("Wish"));

  // Divine Soul: the affinity's spell is always known.
  assert.deepEqual(names(spells([{ name: "Sorcerer", subclass: "Divine Soul", level: 1, spellChoices: { affinity: "Chaos" } }]), "known"), ["Bane"]);

  // A fixed patron list, gated by warlock level; Summon Elemental is in the catalog.
  const fathomless = spells([{ name: "Warlock", subclass: "The Fathomless", level: 7 }]);
  assert.deepEqual(names(fathomless.filter((s) => s.level === 4), "expanded"), ["Control Water", "Summon Elemental"]);
  assert.ok(fathomless.every((s) => s.data), "every patron spell has catalog data");
  assert.equal(names(spells([{ name: "Warlock", subclass: "The Fiend", level: 1 }]), "expanded").length, 2);

  // Option text for the pickers.
  assert.equal(H.spellOptionText(["Bless"]), "Bless");
  assert.equal(H.spellOptionText({ 3: ["Hold Person", "Spike Growth"], 5: ["Sleet Storm", "Slow"] }, "Druid"), "Hold Person, Spike Growth (Druid 3); Sleet Storm, Slow (5)");
});

test("speeds: race fly/swim/climb, feature speeds, conditions, Superior Mobility", () => {
  const sp = (classes, extra = {}) => H.computeSpeed({ ...char(classes, extra), speed: extra.speed ?? 30 });
  const show = (r) => r.others.map((o) => o.type + " " + o.value + (o.when ? " (" + o.when + ")" : ""));

  assert.deepEqual(show(sp([{ name: "Fighter", level: 1 }])), []);
  assert.deepEqual(show(sp([{ name: "Fighter", level: 1 }], { race: "Aarakocra", speed: 25 })), ["fly 50 (not in medium or heavy armor)"]);
  assert.deepEqual(show(sp([{ name: "Rogue", level: 1 }], { race: "Tabaxi" })), ["climb 20"]);
  // "Equal to walking speed" follows walking speed, Mobile included.
  assert.deepEqual(show(sp([{ name: "Barbarian", subclass: "Path of the Totem Warrior", level: 14 }], { feats: [{ name: "Mobile" }] })), ["fly 40 (while raging (Eagle))"]);
  assert.deepEqual(show(sp([{ name: "Barbarian", subclass: "Path of the Totem Warrior", level: 13 }])), []);
  // Always-on: only the best of a type; a Triton warlock keeps the 40 ft swim.
  assert.deepEqual(show(sp([{ name: "Warlock", subclass: "The Fathomless", level: 1 }], { race: "Triton" })), ["swim 40"]);
  // A conditional speed no better than an always-on one is left out.
  assert.deepEqual(show(sp([{ name: "Sorcerer", subclass: "Storm Sorcery", level: 18 }], { race: "Aarakocra", speed: 25 })), ["fly 60"]);
  // Superior Mobility adds 10 to climbing and swimming speeds you already have.
  assert.deepEqual(show(sp([{ name: "Rogue", subclass: "Scout", level: 9 }], { race: "Tabaxi" })), ["climb 30"]);
  assert.deepEqual(show(sp([{ name: "Rogue", subclass: "Scout", level: 9 }])), []);
  // Revelation in Flesh: fly equal to walking, swim twice walking.
  assert.deepEqual(show(sp([{ name: "Sorcerer", subclass: "Aberrant Mind", level: 14 }])).map((x) => x.split(" (")[0]), ["fly 30", "swim 60"]);
});
