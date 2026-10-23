/* Race trait texts (rewritten against the books' wording 2026-10-22): full
   sentences for every trait, the Darkvision card made from a race's range,
   the traits renamed to the book's names (saved picks move with them), and
   the corrections the rewrite made. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import { RACE_DATA, RACE_TRAIT_RENAMES } from "../js/data/race-data.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

function makeChar(race, level = 1){
  const c = newCharacter("Test");
  Object.assign(c, { race, classes: [{ name: "Fighter", subclass: "", level }] });
  return ensureShape(c);
}
const cards = (c) => H.getAllCharacterFeatures(c).filter((f) => f.category === "race");
const text = (race, name) => RACE_DATA[race].traits.find((t) => t.name === name).text;

test("every trait reads as full sentences addressed to the player", () => {
  for(const [race, d] of Object.entries(RACE_DATA)){
    for(const t of d.traits || []){
      const where = race + ": " + t.name;
      assert.ok(/\b(you|your)\b/i.test(t.text), where + " speaks to the player");
      assert.ok(/[.)]$/.test(t.text), where + " ends a sentence");
      assert.ok(!/^(Proficiency|Advantage|Resistance|Bonus action|Reaction|Action:|Immunity)\b/.test(t.text), where + " isn't a clipped note");
      assert.ok(!/[–—]/.test(t.text), where + " has no long dashes");
    }
  }
});

test("Darkvision gets its own card from the race's range, unless a trait already covers it", () => {
  const dwarf = cards(makeChar("Hill Dwarf"));
  assert.equal(dwarf[0].name, "Darkvision");
  assert.match(dwarf[0].text, /^You can see in dim light within 60 feet of you as if it were bright light/);
  assert.ok(!cards(makeChar("Goliath")).some((f) => f.name === "Darkvision"), "none without darkvision");
  const drow = cards(makeChar("Dark Elf (Drow)"));
  assert.ok(!drow.some((f) => f.name === "Darkvision") && drow.some((f) => f.name === "Superior Darkvision"), "a drow's Superior Darkvision stands alone");
  assert.ok(!cards(makeChar("Custom Lineage")).some((f) => f.name === "Darkvision"), "Custom Lineage's Variable Trait covers it");
});

test("traits renamed to the book's names keep a character's saved picks", () => {
  assert.deepEqual(RACE_TRAIT_RENAMES, { "Cat's Talent": "Cat's Talents", "Artisan's Gift": "Maker's Gift", "Kender Aptitude": "Kender Curiosity" });
  const c = makeChar("Kender");
  c.racePicks = { profPicks: { "race:Kender Aptitude:pick": { slots: [["Stealth"]], applied: { skills: ["Stealth"], expertise: [], languages: [], weaponItems: [] } } } };
  c.skillProfs = Object.assign({}, c.skillProfs, { Stealth: { prof: true, expertise: false } });
  CP.syncClassPicks(c);
  assert.deepEqual(Object.keys(c.racePicks.profPicks), ["race:Kender Curiosity:pick"]);
  assert.equal(c.skillProfs.Stealth.prof, true, "the skill stays");
  assert.ok(!CP.pendingClassPicks(c).some((g) => g.name === "Kender Curiosity"), "not asked again");
  // A tabaxi's given skills move too (no pick to lose, but no stale key either).
  const cat = makeChar("Tabaxi");
  cat.racePicks = { profPicks: { "race:Cat's Talent": { slots: [], applied: { skills: ["Perception", "Stealth"], expertise: [], languages: [], weaponItems: [] } } } };
  CP.syncClassPicks(cat);
  assert.deepEqual(Object.keys(cat.racePicks.profPicks), ["race:Cat's Talents"]);
});

test("the rewrite's corrections from the books", () => {
  assert.equal(text("Triton", "Guardians of the Depths"), "You have resistance to cold damage.", "no made-up deep water rule");
  assert.match(text("Firbolg", "Hidden Step"), /make a damage roll or force someone to make a saving throw/);
  assert.match(text("Bugbear", "Surprise Attack"), /only once per combat/);
  assert.match(text("Hobgoblin", "Saving Face"), /within 30 feet of you/);
  assert.match(text("Kobold", "Pack Tactics"), /that ally isn't incapacitated/);
  assert.match(text("Warforged", "Constructed Resilience"), /against being poisoned.*Magic can't put you to sleep/);
  assert.match(text("Thri-kreen", "Thri-kreen Telepathy"), /willing creatures.*doesn't need to share a language/);
  assert.match(text("Aarakocra", "Talons"), /1d4 \+ your Strength modifier/);
  assert.match(text("Human (Mark of Handling)", "Primal Connection"), /these two spells can target a beast or a monstrosity with an Intelligence of 3 or lower/);
  assert.match(text("Half-Elf (Mark of Detection)", "Deductive Intuition"), /^When you make an Intelligence \(Investigation\) or Wisdom \(Insight\) check, you can roll a d4/);
  assert.match(text("Eladrin", "Fey Step"), /Autumn:.*Winter:.*Spring:.*Summer:/s);
  assert.match(text("Aasimar", "Celestial Revelation"), /Protector \(Radiant Soul\).*Scourge \(Radiant Consumption\).*Fallen \(Necrotic Shroud\)/s);
});

test("Duergar Magic is cast like the other race spells", () => {
  const names = (lv) => H.featureSpells(makeChar("Duergar", lv)).filter((fs) => fs.source === "Duergar").map((fs) => fs.name);
  assert.deepEqual(names(2), []);
  assert.deepEqual(names(5), ["Enlarge/Reduce", "Invisibility"]);
  const enlarge = H.featureSpells(makeChar("Duergar", 3)).find((fs) => fs.name === "Enlarge/Reduce");
  assert.match(enlarge.note, /Once per long rest without a spell slot\. No material components needed\. Enlarge only, on yourself\. Not in direct sunlight\. Uses Intelligence/);
});
