/* The 2024 Player's Handbook's spells (chapter 7, pp. 238-343, checked
   against books/Players_Handbook_2024 spell by spell, 2026-11-05): the
   generated data, the edition switch that shows them to a character on the
   2024 rules or with a 2024 class, and their scaling. */
import { test } from "node:test";
import assert from "node:assert/strict";
import "../js/core/helpers.js"; // (first, as the app loads it)
import { SPELL_DATA } from "../js/data/spells.js";
import { SPELL_DATA_2024 } from "../js/data/spells-2024.js";
import { SPELL_SCALING, SPELL_SCALING_2024 } from "../js/data/spell-scaling.js";
import { setSpellEdition, spellEdition, characterSpellEdition, useSpellsOf } from "../js/core/spell-edition.js";
import { spellScalingLine } from "../js/core/spell-scaling.js";

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const CLASSES = ["Artificer", "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];
const char = (level, extra) => Object.assign({ classes: [{ name: "Cleric", subclass: "", level }], abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 16, cha: 10 }, feats: [], features: [], inventory: [], race: "Human" }, extra || {});

test("the generated 2024 spells: well formed, plain summaries, the book's class lists", () => {
  const names = Object.keys(SPELL_DATA_2024);
  assert.equal(names.length, 391, "every spell in the book");
  for(const n of names){
    const d = SPELL_DATA_2024[n];
    assert.ok(d.level >= 0 && d.level <= 9 && SCHOOLS.includes(d.school), n);
    assert.ok(d.castingTime && d.range && d.components && d.duration, n + ": header");
    assert.equal(d.source, "XPHB", n);
    assert.ok(d.classes.length && d.classes.every((c) => CLASSES.includes(c)), n + ": classes " + d.classes);
    assert.match(d.summary, /^[A-Z].*\.$/, n + ": a sentence");
    assert.ok(!/[;–—]/.test(d.summary), n + ": plain text");
    assert.ok(!/\b(STR|DEX|CON|INT|WIS|CHA|HP|ft|lb|vs)\b/.test(d.summary), n + ": no shorthand");
    if(/^Concentration/.test(d.duration)) assert.equal(d.concentration, true, n);
  }
  // Spot checks against the book.
  const d = (n) => SPELL_DATA_2024[n];
  assert.deepEqual([d("Chill Touch").range, d("Chill Touch").duration], ["Touch", "Instantaneous"]);
  assert.equal(d("Shillelagh").castingTime, "1 bonus action");
  assert.equal(d("Produce Flame").castingTime, "1 bonus action");
  assert.equal(d("Cure Wounds").school, "Abjuration");
  assert.deepEqual(d("Starry Wisp").classes, ["Bard", "Druid"]);
  assert.deepEqual(d("Sorcerous Burst").classes, ["Sorcerer"]);
  assert.equal(d("Blade Ward").duration, "Concentration, up to 1 minute");
  assert.equal(d("Divine Smite").level, 1);
  assert.ok(d("Divine Smite").classes.includes("Paladin"));
  assert.ok(d("Guidance").classes.includes("Artificer"), "the artificer keeps its 2014 list");
  // Across the levels.
  assert.equal(d("Barkskin").castingTime, "1 bonus action");
  assert.equal(d("Barkskin").concentration, false);
  assert.match(d("Barkskin").summary, /AC of 17/);
  assert.equal(d("Flaming Sphere").school, "Conjuration", "the printed book");
  assert.match(d("Acid Arrow").summary, /4d4/);
  assert.equal(d("Counterspell").level, 3);
  assert.match(d("Counterspell").summary, /Constitution save/);
  assert.match(d("Staggering Smite").summary, /stunned/);
  assert.match(d("Circle of Death").summary, /8d8/);
  assert.match(d("Power Word Kill").summary, /12d12/);
  assert.equal(d("Power Word Fortify").level, 7);
  assert.deepEqual(d("Befuddlement").classes, ["Bard", "Druid", "Warlock", "Wizard"]);
  assert.match(d("Shocking Grasp").summary, /can't make opportunity attacks/);
  assert.doesNotMatch(d("Shocking Grasp").summary, /metal armor/, "no advantage against metal armor in 2024");
});

test("the edition switch: 2024 spells for a 2024 character, and back", () => {
  setSpellEdition("2014");
  assert.equal(SPELL_DATA["Divine Smite"], undefined, "a 2024-only spell isn't there for 2014");
  assert.match(SPELL_DATA["Cure Wounds"].summary, /1d8/);
  const c = char(3);
  assert.equal(spellScalingLine(c, "Cure Wounds", 1), "Higher slots: +1d8 healing per slot level above 1st.");
  assert.ok(SPELL_SCALING["Sleep"]);
  setSpellEdition("2024");
  assert.equal(spellEdition(), "2024");
  assert.equal(SPELL_DATA["Divine Smite"], SPELL_DATA_2024["Divine Smite"]);
  assert.match(SPELL_DATA["Cure Wounds"].summary, /2d8/);
  assert.equal(spellScalingLine(c, "Cure Wounds", 1), "Higher slots: +2d8 healing per slot level above 1st.");
  assert.equal(SPELL_SCALING["Sleep"], undefined, "Sleep doesn't grow in 2024");
  assert.equal(spellScalingLine(char(11), "Chill Touch", 0), "At level 11: 3d10 necrotic damage. More at level 17.");
  assert.equal(spellScalingLine(c, "Flame Blade", 2), "Higher slots: +1d6 fire damage per slot level above 2nd.");
  assert.equal(spellScalingLine(c, "Counterspell", 3), "", "it doesn't grow in 2024");
  assert.equal(SPELL_SCALING_2024["Circle of Death"].at(1), "10d8 necrotic damage");
  // A spell the 2024 book doesn't have stays the 2014 one either way.
  const branding = SPELL_DATA["Branding Smite"];
  assert.ok(branding);
  setSpellEdition("2014");
  assert.equal(SPELL_DATA["Branding Smite"], branding);
  assert.equal(SPELL_DATA["Divine Smite"], undefined);
  assert.match(SPELL_DATA["Cure Wounds"].summary, /1d8/);
  assert.ok(SPELL_SCALING["Sleep"], "restored");
  // Twice in a row changes nothing.
  setSpellEdition("2024"); setSpellEdition("2024"); setSpellEdition("2014"); setSpellEdition("2014");
  assert.match(SPELL_DATA["Cure Wounds"].summary, /1d8/);
  for(const n of Object.keys(SPELL_SCALING_2024)) assert.ok(SPELL_DATA_2024[n], n + ": a 2024 scaling for a 2024 spell");
});

test("who reads the 2024 spells: the 2024 rules, a 2024 species or background, a 2024 class", () => {
  assert.equal(characterSpellEdition(char(1)), "2014");
  assert.equal(characterSpellEdition(char(1, { rules2024: true })), "2024");
  assert.equal(characterSpellEdition(char(1, { race: "Elf (2024)" })), "2024");
  assert.equal(characterSpellEdition(char(1, { background: "Sage (2024)" })), "2024");
  assert.equal(characterSpellEdition(char(1, { classes: [{ name: "Monk", level: 3, edition: "2024" }] })), "2024");
  assert.equal(characterSpellEdition(null), "2014");
  useSpellsOf(char(1, { rules2024: true }));
  assert.equal(spellEdition(), "2024");
  useSpellsOf(char(1));
  assert.equal(spellEdition(), "2014");
});

test("the 2024 Shillelagh's die grows with level on the weapon card", async () => {
  const { shillelaghDie } = await import("../js/core/equipment.js");
  const druid = (level, extra) => char(level, Object.assign({ classes: [{ name: "Druid", subclass: "", level }] }, extra));
  assert.deepEqual(shillelaghDie(druid(17)), { qty: 1, die: 8 }, "the 2014 spell: a d8");
  assert.deepEqual([1, 5, 11, 17].map((lv) => shillelaghDie(druid(lv, { rules2024: true }))),
    [{ qty: 1, die: 8 }, { qty: 1, die: 10 }, { qty: 1, die: 12 }, { qty: 2, die: 6 }]);
});

test("a saved spell follows the edition, except for what the player edited", () => {
  setSpellEdition("2014");
  const copy = (n) => { const d = SPELL_DATA[n]; return { name: n, level: d.level, school: d.school, castingTime: d.castingTime, range: d.range, components: d.components, material: d.material, duration: d.duration, concentration: d.concentration, ritual: d.ritual, summary: d.summary }; };
  const edited = copy("Healing Word");
  edited.summary = "My own note.";
  const c = char(1, { spells: [copy("Cure Wounds"), edited, copy("Chill Touch"), copy("Fireball")] });
  useSpellsOf(c);
  assert.match(c.spells[0].summary, /1d8/, "2014 stays");
  c.rules2024 = true;
  useSpellsOf(c);
  assert.match(c.spells[0].summary, /2d8/);
  assert.equal(c.spells[0].school, "Abjuration");
  assert.equal(c.spells[1].summary, "My own note.", "an edit stays");
  assert.equal(c.spells[1].school, "Abjuration", "its other fields still follow");
  assert.equal(c.spells[2].range, "Touch");
  assert.equal(c.spells[3].range, "150 feet", "the same in both");
  delete c.rules2024;
  useSpellsOf(c);
  assert.match(c.spells[0].summary, /1d8/, "and back");
  assert.equal(c.spells[2].range, "120 feet");
  assert.equal(c.spells[1].summary, "My own note.");
});
