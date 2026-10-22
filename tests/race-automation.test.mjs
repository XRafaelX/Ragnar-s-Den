/* Race traits the sheet applies (2026-10-22): race effects on the Active
   effects card (Shell Defense, Chromatic Warding, the Raven Queen's
   resistance, Sunlight Sensitivity), Kefnet's Blessing, a Simic Hybrid's
   enhancements (picked at 1st and 5th level), an aasimar's subrace and a
   kender's Taunt ability, and the save DCs worked out on trait cards. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import { characterResources } from "../js/core/character-resources.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

function makeChar(race, level = 1, picks = {}, extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { race, classes: [{ name: "Fighter", subclass: "", level }],
    abilities: { str: 14, dex: 12, con: 16, int: 10, wis: 12, cha: 16 } }, extra);
  const out = ensureShape(c);
  Object.keys(picks).forEach((k) => { out.racePicks.profPicks[k] = { slots: picks[k], applied: {} }; });
  return out;
}
const effectIds = (c) => H.characterEffects(c).map((e) => e.def.id);
const card = (c, name) => H.getAllCharacterFeatures(c).find((f) => f.category === "race" && f.name === name);

test("a tortle's Shell Defense: free, +4 AC, speed 0, STR and CON saves with advantage, DEX with disadvantage", () => {
  const c = makeChar("Tortle");
  assert.deepEqual(effectIds(c), ["shell_defense"]);
  const ac = H.computeArmorClass(c).value;
  assert.equal(H.characterEffects(c)[0].why, "", "nothing to pay");
  assert.ok(H.startEffect(c, "shell_defense"));
  assert.equal(H.computeArmorClass(c).value, ac + 4);
  assert.match(H.computeArmorClass(c).breakdown, /Shell Defense \(\+4\)/);
  assert.equal(H.computeSpeed(c).value, 0);
  assert.equal(H.saveRollMode(c, "str").mode, "adv");
  assert.equal(H.saveRollMode(c, "con").mode, "adv");
  assert.equal(H.saveRollMode(c, "dex").mode, "dis");
  H.endEffect(c, "shell_defense");
  assert.equal(H.computeArmorClass(c).value, ac);
  assert.equal(H.computeSpeed(c).value, 30);
  assert.deepEqual(effectIds(makeChar("Human")), [], "no card for a human fighter");
});

test("Chromatic Warding from 5th level: spends its use, immune to the ancestry's type", () => {
  const black = { "race:Chromatic Ancestry:pick": [["Black dragon"]] };
  assert.deepEqual(effectIds(makeChar("Dragonborn (Chromatic)", 4, black)), []);
  const c = makeChar("Dragonborn (Chromatic)", 5, black);
  assert.ok(H.startEffect(c, "chromatic_warding"));
  assert.equal(c.resourcesUsed["race:chromatic_warding"], 1);
  assert.deepEqual(H.raceWards(c).immune, [{ type: "acid", source: "Chromatic Warding" }]);
  H.endEffect(c, "chromatic_warding");
  assert.match(H.characterEffects(c)[0].why, /Not enough Chromatic Warding left/);
});

test("the Raven Queen's resistance to all damage from 3rd level", () => {
  assert.deepEqual(effectIds(makeChar("Shadar-kai", 2)), []);
  const c = makeChar("Shadar-kai", 3);
  assert.ok(H.startEffect(c, "raven_queen_resistance"));
  assert.ok(H.raceWards(c).resist.some((r) => r.type === "all damage" && r.source === "Blessing of the Raven Queen"));
});

test("Sunlight Sensitivity: disadvantage on attacks and Perception while in sunlight", () => {
  for(const race of ["Dark Elf (Drow)", "Duergar", "Kobold"]) assert.ok(effectIds(makeChar(race)).includes("sunlight"), race);
  const c = makeChar("Kobold");
  assert.equal(H.plainAttackRollMode(c).mode, "none");
  H.startEffect(c, "sunlight");
  assert.equal(H.plainAttackRollMode(c).mode, "dis");
  assert.equal(H.plainAttackRollMode(c).reason, "Sunlight Sensitivity");
  assert.equal(H.skillCheck(c, "Perception").roll.mode, "dis");
  assert.equal(H.skillCheck(c, "Stealth").roll.mode, "none", "other checks don't change");
  const monk = makeChar("Dark Elf (Drow)", 1, {}, { classes: [{ name: "Monk", subclass: "", level: 1 }] });
  H.startEffect(monk, "sunlight");
  assert.equal(H.unarmedStrike(monk).roll.mode, "dis", "unarmed strikes too");
});

test("Kefnet's Blessing: half proficiency on Intelligence checks without it", () => {
  const c = makeChar("Aven (Ibis-Headed)", 5);
  assert.deepEqual(H.halfProficiency(c, "int"), { value: 1, name: "Kefnet's Blessing" });
  assert.equal(H.halfProficiency(c, "wis"), null);
  assert.match(H.skillCheck(c, "Arcana").breakdown, /Kefnet's Blessing \(\+1\)/);
});

test("a Simic Hybrid's enhancements: one at 1st level, a second at 5th, and what each does", () => {
  const first = "race:Animal Enhancement:pick", second = "race:Animal Enhancement (5th Level):pick";
  const young = makeChar("Simic Hybrid", 1);
  assert.deepEqual(CP.pendingClassPicks(young).map((g) => g.key), [first], "only the 1st-level pick before 5th");
  const c = makeChar("Simic Hybrid", 5, { [first]: [["Nimble Climber"]] });
  assert.ok(H.computeSpeed(c).others.some((o) => o.type === "climb" && o.value === 30), "climb equal to walking speed");
  const g = CP.raceGrants(c).find((x) => x.key === second);
  const opts = CP.slotOptions(g.def, [], 0, CP.classPickContext(c, CP.raceEntry(c), second));
  assert.equal(opts.find((o) => o.value === "Nimble Climber").reason, "chosen", "the 1st-level one is greyed");
  assert.equal(opts.length, 6);
  // Carapace: +1 AC, not in heavy armor.
  const shell = makeChar("Simic Hybrid", 5, { [first]: [["Underwater Adaptation"]], [second]: [["Carapace"]] });
  assert.ok(H.computeSpeed(shell).others.some((o) => o.type === "swim" && o.value === 30));
  assert.match(H.computeArmorClass(shell).breakdown, /Carapace \(\+1\)/);
  shell.inventory.push({ type: "armor", name: "Plate", category: "heavy", baseAC: 18, equipped: true });
  assert.doesNotMatch(H.computeArmorClass(shell).breakdown, /Carapace/);
  // Acid Spit: uses equal to CON (+3), and its DC on the card.
  const spit = makeChar("Simic Hybrid", 5, { [first]: [["Manta Glide"]], [second]: [["Acid Spit"]] });
  const r = characterResources(spit).find((x) => x.key === "race:acid_spit");
  assert.deepEqual([r.max, r.reset], [3, "long"]);
  assert.equal(characterResources(shell).find((x) => x.key === "race:acid_spit"), undefined, "none without it");
  const text = card(spit, "Animal Enhancement (5th Level)").text;
  assert.match(text, /^Acid Spit: As an action, spray acid/);
  assert.doesNotMatch(text, /• Carapace/, "only the picked option's line");
  assert.match(text, /Acid Spit save DC 14 \(8 \+ proficiency \+3 \+ Constitution \+3\)\./);
  // A 1st-level option taken at 5th shows its own line.
  const both = makeChar("Simic Hybrid", 5, { [first]: [["Manta Glide"]], [second]: [["Nimble Climber"]] });
  assert.match(card(both, "Animal Enhancement (5th Level)").text, /^Nimble Climber: You have a climbing speed equal to your walking speed\./);
});

test("an aasimar's subrace, a shifter's type and a kender's Taunt ability", () => {
  const fallen = makeChar("Aasimar", 3, { "race:Celestial Revelation:pick": [["Fallen"]] });
  const text = card(fallen, "Celestial Revelation").text;
  assert.match(text, /• Fallen \(Necrotic Shroud\)/);
  assert.doesNotMatch(text, /Your picks/, "the card shows the choice itself");
  assert.doesNotMatch(text, /Protector|Scourge/);
  assert.match(text, /Necrotic Shroud save DC 13 \(8 \+ proficiency \+2 \+ Charisma \+3\)\./);
  assert.doesNotMatch(card(makeChar("Aasimar", 3, { "race:Celestial Revelation:pick": [["Protector"]] }), "Celestial Revelation").text, /save DC/);
  assert.ok(CP.pendingClassPicks(makeChar("Aasimar")).some((g) => g.name === "Celestial Revelation"), "an older aasimar is asked");
  const beast = makeChar("Shifter", 1, { "race:Shifter Type:pick": [["Beasthide"], ["Athletics"]] });
  assert.match(card(beast, "Shifter Type").text, /• Beasthide:/);
  assert.doesNotMatch(card(beast, "Shifter Type").text, /Longtooth/);
  const kender = makeChar("Kender", 1);
  assert.doesNotMatch(card(kender, "Taunt").text, /save DC \d/, "no DC before the ability is picked");
  const picked = makeChar("Kender", 1, { "race:Taunt:pick": [["Charisma"]] });
  assert.match(card(picked, "Taunt").text, /Taunt save DC 13 \(8 \+ proficiency \+2 \+ Charisma \+3\)\./);
  assert.match(card(makeChar("Leonin"), "Daunting Roar").text, /Daunting Roar save DC 13 \(8 \+ proficiency \+2 \+ Constitution \+3\)\./);
});
