/* Race spells: the innate spells a race's traits give (`spells` on traits
   in RACE_DATA, raceSpellEntries in js/core/spell-grants.js). On the
   Spells tab by character level, their free casts on Vitals, the ones a
   class may still learn, and the picks (a high elf's cantrip, a fairy's
   ability, a Half-Elf (Variant)'s or Tiefling (Variant)'s choice). */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as CP from "../js/core/class-picks.js";
import { RACE_DATA } from "../js/data/race-data.js";
import { SPELL_DATA, catalogSpellName } from "../js/data/spells.js";
import { characterResources } from "../js/core/character-resources.js";
import { spellScalingLine } from "../js/core/spell-scaling.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

function makeChar(race, level = 1, picks = {}, cls = "Fighter"){
  const c = newCharacter("Test");
  Object.assign(c, { race, classes: [{ name: cls, subclass: "", level }],
    abilities: { str: 10, dex: 10, con: 14, int: 16, wis: 12, cha: 16 } });
  const out = ensureShape(c);
  Object.keys(picks).forEach((k) => { out.racePicks.profPicks[k] = { slots: picks[k], applied: {} }; });
  return out;
}
const raceSpells = (c) => H.featureSpells(c).filter((fs) => fs.source === c.race);
const byName = (c, n) => raceSpells(c).find((fs) => fs.name === n);
const raceUses = (c) => characterResources(c).filter((r) => /^race:spell:/.test(r.key));

test("race spell data: every spell is in the catalog, levels and uses make sense", () => {
  let n = 0;
  const check = (where, spec) => {
    assert.ok(["int", "wis", "cha", "con", "dex", "pick", ""].includes(spec.ability), where + ": ability " + spec.ability);
    for(const x of spec.list){
      const e = typeof x === "string" ? { name: x } : x;
      assert.ok(SPELL_DATA[catalogSpellName(e.name)], where + ": " + e.name);
      assert.ok(!e.use || ["known", "long", "short", "atwill"].includes(e.use), where + ": use " + e.use);
      assert.ok(!e.from || [3, 5].includes(e.from), where + ": from " + e.from);
      if(e.at) assert.ok(e.at > SPELL_DATA[catalogSpellName(e.name)].level, where + ": " + e.name + " at " + e.at);
    }
  };
  for(const [race, d] of Object.entries(RACE_DATA)){
    for(const t of d.traits || []) if(t.spells){ n++; check(race + ": " + t.name, t.spells); }
    for(const fx of Object.values(d.choiceEffects || {})) for(const [k, e] of Object.entries(fx)) if(e.spells) check(race + ": " + k, e.spells);
  }
  assert.ok(n >= 46, n + " traits");
});

test("a tiefling's Infernal Legacy: the cantrip at 1, Hellish Rebuke at 3 as a 2nd-level spell, Darkness at 5", () => {
  assert.deepEqual(raceSpells(makeChar("Tiefling", 1)).map((fs) => fs.name), ["Thaumaturgy"]);
  const c = makeChar("Tiefling", 5);
  assert.deepEqual(raceSpells(c).map((fs) => fs.name), ["Thaumaturgy", "Hellish Rebuke", "Darkness"]);
  const thaum = byName(c, "Thaumaturgy");
  assert.equal(thaum.kind, "known");
  assert.match(thaum.note, /^A cantrip you always know from Infernal Legacy\. Uses Charisma: save DC 14, spell attack \+6\.$/);
  const rebuke = byName(c, "Hellish Rebuke");
  assert.equal(rebuke.kind, "free");
  assert.equal(rebuke.kindLabel, "Free 1/long rest");
  assert.equal(rebuke.limited, true, "no spell slots");
  assert.equal(rebuke.castAt, 2);
  assert.match(rebuke.note, /^Once per long rest without a spell slot\. Cast as a 2nd-level spell\. Uses Charisma/);
  assert.equal(spellScalingLine(c, "Hellish Rebuke", 1, { fixed: true, castAt: 2 }), "As a 2nd-level spell: 3d10 fire damage.");
  assert.equal(spellScalingLine(c, "Darkness", 2, { fixed: true }), "");
  // A free cast of each on Vitals, back after a long rest.
  assert.deepEqual(raceUses(c).map((r) => [r.key, r.name, r.max, r.reset]),
    [["race:spell:hellish_rebuke", "Hellish Rebuke (Infernal Legacy)", 1, "long"], ["race:spell:darkness", "Darkness (Infernal Legacy)", 1, "long"]]);
  assert.equal(raceUses(makeChar("Tiefling", 2)).length, 0, "nothing before level 3");
});

test("once-a-day race spells don't stop a class from learning them; the cantrips do", () => {
  const c = makeChar("Dark Elf (Drow)", 5, {}, "Sorcerer");
  assert.equal(H.spellHeldBy(c, "Darkness"), "", "Darkness can still be learned");
  assert.equal(H.spellHeldBy(c, "Dancing Lights"), "from Dark Elf (Drow)");
  // A fairy's can also use slots, like a feat's: had in full.
  const f = makeChar("Fairy", 5, { "race:Fairy Magic:pick": [["Wisdom"]] }, "Sorcerer");
  assert.equal(byName(f, "Faerie Fire").limited, undefined);
  assert.match(byName(f, "Faerie Fire").note, /^Free once per long rest, or cast it with a spell slot\. Uses Wisdom: save DC 12/);
  assert.equal(H.spellHeldBy(f, "Faerie Fire"), "from Fairy");
  assert.match(raceUses(f)[0].hint, /Casting it with a slot you have doesn't use this\./);
});

test("rests, components, notes and abilities follow the books", () => {
  const firbolg = makeChar("Firbolg", 1);
  assert.deepEqual(raceUses(firbolg).map((r) => r.reset), ["short", "short"]);
  assert.equal(byName(firbolg, "Disguise Self").kindLabel, "Free 1/short rest");
  assert.match(byName(firbolg, "Disguise Self").note, /You can seem up to 3 feet shorter\. Uses Wisdom/);
  assert.match(byName(makeChar("Gith (Githyanki)", 5), "Misty Step").note, /No components needed\. Uses Intelligence/);
  assert.match(byName(makeChar("Genasi (Air)", 1), "Levitate").note, /No material components needed\. Uses Constitution/);
  const yuanti = makeChar("Yuan-ti Pureblood", 1);
  assert.equal(byName(yuanti, "Animal Friendship").kind, "atwill");
  assert.match(byName(yuanti, "Animal Friendship").note, /Only on snakes\./);
  // Corrected 2026-10-22: Wisdom for Magical Detection, Comprehend Languages and Tenser's Floating Disk after a short rest.
  assert.match(byName(makeChar("Half-Elf (Mark of Detection)", 1), "Detect Magic").note, /Uses Wisdom/);
  assert.equal(byName(makeChar("Gnome (Mark of Scribing)", 1), "Comprehend Languages").kindLabel, "Free 1/short rest");
  const mammon = makeChar("Tiefling (Mammon)", 5);
  assert.equal(byName(mammon, "Tenser's Floating Disk").kindLabel, "Free 1/short rest");
  assert.equal(byName(mammon, "Tenser's Floating Disk").castAt, undefined, "at its own level");
  assert.equal(byName(makeChar("Tiefling (Zariel)", 5), "Branding Smite").castAt, undefined);
  assert.equal(byName(makeChar("Tiefling (Zariel)", 5), "Searing Smite").castAt, 2);
  // A siren's Friends has no ability: no DC.
  assert.equal(byName(makeChar("Siren", 1), "Friends").note, "A cantrip you always know from Siren's Song. No material components needed.");
  assert.equal(H.hasSpellsTab(makeChar("Siren", 1)), true, "a fighter gets a Spells tab for it");
});

test("picks: a high elf's cantrip, an astral elf's and a fairy's ability", () => {
  const elf = makeChar("High Elf", 1);
  assert.ok(CP.pendingClassPicks(elf).some((g) => g.name === "Cantrip"), "the Feature choices card asks");
  assert.equal(raceSpells(elf).length, 0);
  const picked = makeChar("High Elf", 1, { "race:Cantrip:pick": [["Fire Bolt"]] });
  assert.match(byName(picked, "Fire Bolt").note, /^A cantrip you always know from Cantrip\. Uses Intelligence: save DC 13, spell attack \+5\.$/);
  // Picked here, it isn't "had already": the picker keeps it.
  const g0 = CP.raceGrants(picked).find((x) => x.key === "race:Cantrip:pick");
  const fb = CP.slotOptions(g0.def, [["Fire Bolt"]], 0, CP.classPickContext(picked, CP.raceEntry(picked), g0.key)).find((o) => o.value === "Fire Bolt");
  assert.equal(fb.reason, "");
  // Fairy before its ability is chosen: says where to choose it.
  assert.match(byName(makeChar("Fairy", 1), "Druidcraft").note, /Choose its spellcasting ability on the Features & Feats tab/);
  const astral = makeChar("Astral Elf", 1, { "race:Astral Fire:pick": [["Sacred Flame"], ["Wisdom"]] });
  assert.match(byName(astral, "Sacred Flame").note, /Uses Wisdom: save DC 11, spell attack \+3\./);
  const g = CP.raceGrants(astral).find((x) => x.key === "race:Astral Fire:pick");
  assert.deepEqual(CP.slotOptions(g.def, [], 0, CP.classPickContext(astral, CP.raceEntry(astral), g.key)).map((o) => o.value), ["Dancing Lights", "Light", "Sacred Flame"]);
});

test("a Half-Elf (Variant)'s Cantrip or Drow Magic, and a Tiefling (Variant)'s gift", () => {
  const key = "race:Half-Elf Versatility:pick";
  const drow = makeChar("Half-Elf (Variant)", 3, { [key]: [["Drow Magic"], [], []] });
  assert.deepEqual(raceSpells(drow).map((fs) => fs.name), ["Dancing Lights", "Faerie Fire"]);
  // The wizard cantrip is only asked for with Cantrip picked.
  const g = CP.raceGrants(drow).find((x) => x.key === key), ctx = CP.classPickContext(drow, CP.raceEntry(drow), key);
  assert.equal(CP.slotOptions(g.def, [["Drow Magic"]], 2, ctx).length, 0);
  assert.ok(CP.slotOptions(g.def, [["Cantrip"]], 2, ctx).some((o) => o.value === "Fire Bolt"));
  assert.equal(CP.classPicksProblem(g, [["Drow Magic"], [], []], ctx), "");
  assert.match(CP.classPicksProblem(g, [["Cantrip"], [], []], ctx), /Choose a cantrip/);
  const sun = makeChar("Half-Elf (Variant)", 1, { [key]: [["Cantrip"], [], ["Mage Hand"]] });
  assert.match(byName(sun, "Mage Hand").note, /Uses Intelligence/);
  const hellfire = makeChar("Tiefling (Variant)", 3, { "race:Infernal Gift:pick": [["Hellfire"]] });
  assert.deepEqual(raceSpells(hellfire).map((fs) => [fs.name, fs.castAt || 0]), [["Thaumaturgy", 0], ["Burning Hands", 2]]);
  assert.equal(raceSpells(makeChar("Tiefling (Variant)", 3)).length, 0, "nothing until the gift is chosen");
});
