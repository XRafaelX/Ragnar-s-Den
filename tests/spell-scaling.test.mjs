/* How spells grow (js/data/spell-scaling.js, js/core/spell-scaling.js):
   cantrips by character level, a warlock's spells at its pact slot level,
   other casters' "Higher slots" rule, and spells cast at their own level. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spellScalingLine } from "../js/core/spell-scaling.js";
import { SPELL_SCALING } from "../js/data/spell-scaling.js";
import { SPELL_DATA } from "../js/data/spells.js";
import { newCharacter } from "../js/core/character.js";
import * as H from "../js/core/helpers.js";
import { WARLOCK_SUBCLASSES } from "../js/data/subclasses/warlock.js";
import { INVOCATIONS, PACT_BOONS } from "../js/data/invocations.js";

function char(classes, cha = 16){
  const c = newCharacter("Test");
  c.classes = classes;
  c.abilities.cha = cha;
  return c;
}
const lock = (level, extra = {}) => char([{ name: "Warlock", subclass: "The Fiend", level, ...extra }]);
const line = (c, name, how) => spellScalingLine(c, name, SPELL_DATA[name].level, how);

test("every scaling entry is a catalog spell with the right shape", () => {
  for(const [name, e] of Object.entries(SPELL_SCALING)){
    const d = SPELL_DATA[name];
    assert.ok(d, name + " is in the spell catalog");
    assert.equal(typeof e.at, "function", name);
    if(d.level) assert.ok(e.per || e.rule, name + " says how it grows");
    // Every slot from the spell's own level to 9th reads cleanly.
    for(let slot = Math.max(1, d.level); slot <= 9; slot++){
      const text = d.level ? e.at(slot - d.level, slot) : e.at(Math.min(4, slot));
      assert.ok(text && !/undefined|NaN/.test(text), name + " at " + slot + ": " + text);
    }
  }
});

test("damage cantrips all scale; utility ones don't", () => {
  const damaging = Object.entries(SPELL_DATA).filter(([, d]) => d.level===0 && /\d+d\d+ \w+ damage/.test(d.summary)).map(([n]) => n);
  for(const name of damaging) if(name!=="Shillelagh") assert.ok(SPELL_SCALING[name], name + " scales");
  assert.ok(!SPELL_SCALING["Shillelagh"] && !SPELL_SCALING["Mage Hand"] && !SPELL_SCALING["Guidance"]);
});

test("every warlock spell that grows at higher levels has an entry", () => {
  const names = new Set(Object.entries(SPELL_DATA).filter(([, d]) => d.classes.includes("Warlock")).map(([n]) => n));
  JSON.stringify(WARLOCK_SUBCLASSES, (k, v) => {
    if(k==="spells" || k==="options") JSON.stringify(v, (k2, v2) => { if(typeof v2==="string" && SPELL_DATA[v2]) names.add(v2); return v2; });
    return v;
  });
  INVOCATIONS.concat(PACT_BOONS).forEach((i) => (i.spells||[]).forEach((s) => names.add(s.name)));
  const grows = ["Armor of Agathys", "Arms of Hadar", "Burning Hands", "Charm Person", "Command", "Hellish Rebuke", "Hex", "Witch Bolt",
    "Sleep", "Dissonant Whispers", "Cure Wounds", "Guiding Bolt", "Thunderwave", "Fog Cloud", "Bane", "False Life", "Ray of Sickness",
    "Cloud of Daggers", "Hold Person", "Invisibility", "Shatter", "Blindness/Deafness", "Scorching Ray", "Branding Smite", "Flaming Sphere",
    "Counterspell", "Dispel Magic", "Fly", "Magic Circle", "Vampiric Touch", "Summon Fey", "Fireball", "Elemental Weapon", "Lightning Bolt",
    "Bestow Curse", "Animate Dead", "Banishment", "Blight", "Summon Aberration", "Summon Elemental", "Wall of Fire", "Dominate Beast",
    "Phantasmal Killer", "Confusion", "Hold Monster", "Flame Strike", "Dominate Person", "Cone of Cold", "Bigby's Hand", "Cloudkill",
    "Creation", "Conjure Elemental", "Circle of Death", "Conjure Fey", "Create Undead", "Mass Suggestion", "Dominate Monster", "Major Image",
    "Create or Destroy Water", "Chill Touch", "Eldritch Blast", "Poison Spray", "Toll the Dead", "Mind Sliver",
    // Xanathar's and Tasha's
    "Create Bonfire", "Frostbite", "Infestation", "Thunderclap", "Booming Blade", "Green-Flame Blade", "Lightning Lure", "Sword Burst",
    "Cause Fear", "Mind Spike", "Shadow Blade", "Intellect Fortress", "Spirit Shroud", "Summon Lesser Demons", "Summon Shadowspawn",
    "Summon Undead", "Thunder Step", "Charm Monster", "Elemental Bane", "Summon Greater Demon", "Danse Macabre", "Enervation",
    "Infernal Calling", "Wall of Light", "Summon Fiend", "Crown of Stars"];
  for(const name of grows){
    assert.ok(names.has(name) || SPELL_DATA[name].level===0, name + " is a warlock spell");
    assert.ok(SPELL_SCALING[name], name + " has a scaling entry");
  }
});

test("the other casters' spells that grow have an entry too", () => {
  const grows = ["Magic Missile", "Bless", "Healing Word", "Inflict Wounds", "Chromatic Orb", "Hunter's Mark", "Absorb Elements", "Aid",
    "Spiritual Weapon", "Moonbeam", "Heat Metal", "Magic Weapon", "Acid Arrow", "Call Lightning", "Spirit Guardians", "Conjure Animals",
    "Glyph of Warding", "Mass Healing Word", "Ice Storm", "Summon Construct", "Animate Objects", "Mass Cure Wounds", "Planar Binding",
    "Summon Celestial", "Chain Lightning", "Disintegrate", "Heal", "Globe of Invulnerability", "Delayed Blast Fireball", "Etherealness",
    "Primal Savagery", "Word of Radiance"];
  for(const name of grows) assert.ok(SPELL_DATA[name] && SPELL_SCALING[name], name + " has a scaling entry");
  // Spells with no higher-level effect stay out.
  for(const name of ["Shield", "Misty Step", "Haste", "Polymorph", "Wish", "Far Step", "Magic Stone"]) assert.ok(!SPELL_SCALING[name], name);
  const wiz = char([{ name: "Wizard", level: 5 }]);
  assert.equal(line(wiz, "Magic Missile"), "Higher slots: one more dart per slot level above 1st.");
  assert.equal(line(wiz, "Spiritual Weapon"), "Higher slots: +1d8 force damage for every two slot levels above 2nd.");
  assert.equal(line(wiz, "Magic Weapon"), "Higher slots: +2 with a 4th- or 5th-level slot, +3 with 6th or higher.");
  assert.equal(line(wiz, "Etherealness"), "Higher slots: up to three willing creatures (you included) per slot level above 7th.");
  assert.equal(SPELL_SCALING["Spiritual Weapon"].at(4, 6), "3d8 + your spellcasting modifier force damage");
  assert.equal(SPELL_SCALING["Hail of Thorns"].at(8, 9), "6d10 piercing damage");
  assert.equal(SPELL_SCALING["Globe of Invulnerability"].at(2, 8), "blocks spells of 7th level or lower");
  assert.equal(SPELL_SCALING["Disintegrate"].at(1, 7), "13d6 + 40 force damage");
  assert.equal(SPELL_SCALING["Etherealness"].at(2, 9), "up to 6 willing creatures, you included");
});

test("cantrips: dice by character level, the next step named", () => {
  assert.equal(line(lock(1), "Booming Blade"), "At level 1: 1d8 thunder damage if the target willingly moves. More at level 5.");
  assert.equal(line(lock(5), "Booming Blade"), "At level 5: +1d8 thunder damage on the hit, and 2d8 thunder damage if the target willingly moves. More at level 11.");
  assert.equal(line(lock(1), "Green-Flame Blade"), "At level 1: your spellcasting modifier in fire damage to the second creature. More at level 5.");
  assert.equal(line(lock(11), "Green-Flame Blade"), "At level 11: +2d8 fire damage on the hit, and 2d8 + your spellcasting modifier in fire damage to the second creature. More at level 17.");
  assert.equal(line(lock(17), "Frostbite"), "At level 17: 4d6 cold damage.");
  assert.equal(spellScalingLine(lock(5), "Magic Stone", 0), "");
  assert.equal(line(lock(1), "Toll the Dead"), "At level 1: 1d8 necrotic damage, or 1d12 if the target is missing any hit points. More at level 5.");
  assert.equal(line(lock(5), "Chill Touch"), "At level 5: 2d8 necrotic damage. More at level 11.");
  assert.equal(line(lock(11), "Poison Spray"), "At level 11: 3d12 poison damage. More at level 17.");
  assert.equal(line(lock(17), "Mind Sliver"), "At level 17: 4d6 psychic damage.");
  // Character level, not class level: a Fighter 4 / Warlock 1 is level 5.
  const multi = char([{ name: "Fighter", level: 4 }, { name: "Warlock", subclass: "The Fiend", level: 1 }]);
  assert.match(line(multi, "Toll the Dead"), /^At level 5: 2d8/);
  assert.equal(spellScalingLine(lock(5), "Mage Hand", 0), "");
});

test("Eldritch Blast: beams by level, with the warlock's invocations", () => {
  const c = lock(5, { invocations: [{ name: "Agonizing Blast" }, { name: "Eldritch Spear" }] });
  c.spells = [{ name: "Eldritch Blast", level: 0 }];
  assert.equal(line(c, "Eldritch Blast"), "At level 5: 2 beams, 1d10 + 3 force damage each, 300 ft. More at level 11.");
  // Without the invocations (or the cantrip on a non-warlock): the plain table.
  assert.equal(line(char([{ name: "Sorcerer", level: 11 }]), "Eldritch Blast"), "At level 11: 3 beams, 1d10 force damage each. More at level 17.");
});

test("a warlock's spells grow with its pact slots", () => {
  const pact = { pact: true };
  assert.equal(line(lock(5), "Hellish Rebuke", pact), "With your 3rd-level pact slots: 4d10 fire damage.");
  assert.equal(line(lock(9), "Hellish Rebuke", pact), "With your 5th-level pact slots: 6d10 fire damage.");
  assert.equal(line(lock(5), "Armor of Agathys", pact), "With your 3rd-level pact slots: 15 temporary hit points, and 15 cold damage to a creature that hits you in melee.");
  assert.equal(line(lock(3), "Hex", pact), "With your 2nd-level pact slots: lasts up to 1 hour.");
  assert.equal(line(lock(5), "Hex", pact), "With your 3rd-level pact slots: lasts up to 8 hours.");
  assert.equal(line(lock(9), "Hex", pact), "With your 5th-level pact slots: lasts up to 24 hours.");
  assert.equal(line(lock(7), "Hold Person", pact), "With your 4th-level pact slots: 3 humanoids.");
  assert.equal(line(lock(9), "Counterspell", pact), "With your 5th-level pact slots: automatically stops spells of 5th level or lower.");
  assert.equal(line(lock(9), "Scorching Ray", pact), "With your 5th-level pact slots: 6 rays, 2d6 fire damage each.");
  assert.equal(line(lock(9), "Summon Fey", pact), "With your 5th-level pact slots: spirit with AC 17, 50 hit points, 2 attacks a turn (shortsword 1d6 + 8 piercing + 1d6 force).");
  assert.equal(line(lock(9), "Summon Undead", pact), "With your 5th-level pact slots: spirit with AC 16, 50 hit points (40 if skeletal), 2 attacks a turn (each its die + 8).");
  assert.equal(line(lock(5), "Summon Shadowspawn", pact), "Higher slots: a stronger spirit per slot level above 3rd.");
  assert.equal(line(lock(9), "Shadow Blade", pact), "With your 5th-level pact slots: 4d8 psychic damage.");
  assert.equal(line(lock(9), "Spirit Shroud", pact), "With your 5th-level pact slots: 2d8 extra damage.");
  assert.equal(line(lock(9), "Summon Greater Demon", pact), "With your 5th-level pact slots: a demon of challenge rating 6 or lower.");
  // At the spell's own level: the rule, so the player knows it will grow.
  assert.equal(line(lock(1), "Hellish Rebuke", pact), "Higher slots: +1d10 fire damage per slot level above 1st.");
  // A Mystic Arcanum level above the pact slots: no line.
  assert.equal(line(lock(11), "Circle of Death", pact), "");
});

test("other casters see the Higher slots rule; fixed-level casts see nothing", () => {
  const wiz = char([{ name: "Wizard", level: 5 }]);
  assert.equal(line(wiz, "Fireball"), "Higher slots: +1d6 fire damage per slot level above 3rd.");
  assert.equal(line(wiz, "Hex"), "Higher slots: lasts up to 8 hours with a 3rd- or 4th-level slot, 24 hours with 5th or higher.");
  assert.equal(line(lock(9), "False Life", { fixed: true }), "");
  assert.equal(line(lock(9), "Misty Step", { pact: true }), "");
});
