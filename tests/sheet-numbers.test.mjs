/* The numbers the sheet and the printout share (js/core/sheet-numbers.js):
   the Spellcasting card's save DC and spell attack, and the Proficiencies
   card's lists. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { spellcastingStats, characterProficiencies } from "../js/core/sheet-numbers.js";

function char(classes, extra = {}){
  const c = newCharacter("N");
  c.classes = classes;
  c.abilities = { str: 10, dex: 14, con: 12, int: 16, wis: 14, cha: 18 };
  Object.assign(c, extra);
  return ensureShape(c);
}

test("one casting ability: 8 + proficiency + modifier, attack proficiency + modifier", () => {
  const c = char([{ name: "Wizard", level: 5 }]);
  c.spellcasting.ability = "int";
  const s = spellcastingStats(c);
  assert.equal(s.multi, false);
  assert.equal(s.ability, "int");
  assert.equal(s.mod, 3);
  assert.equal(s.dc, 14, "8 + 3 + 3");
  assert.equal(s.attack, 6);
  assert.equal(s.dcHint, "8 + prof + mod");
  assert.deepEqual(s.extras, []);
});

test("two casting abilities: a row each", () => {
  const c = char([{ name: "Cleric", level: 3 }, { name: "Wizard", level: 2 }]);
  const s = spellcastingStats(c);
  assert.equal(s.multi, true);
  assert.deepEqual(s.rows.map((r) => r.label), ["Cleric · WIS", "Wizard · INT"]);
  assert.deepEqual(s.rows.map((r) => [r.dc, r.attack]), [[13, 5], [14, 6]], "level 5: proficiency +3");
});

test("proficiencies from class, race and feats, with tool expertise", () => {
  const c = char([{ name: "Rogue", level: 1 }], { race: "Elf", subrace: "High Elf" });
  const p = characterProficiencies(c);
  assert.ok(p.armor.includes("Light armor") || p.armor.some((a) => /light/i.test(a)), p.armor.join(", "));
  assert.ok(p.weapons.some((w) => /rapier/i.test(w)), "the rogue's rapier: " + p.weapons.join(", "));
  assert.ok(p.weapons.some((w) => /longsword/i.test(w)), "the high elf's longsword: " + p.weapons.join(", "));
  assert.deepEqual(p.saves, ["Dexterity", "Intelligence"]);
  assert.ok(p.tools.some((t) => /thieves/i.test(t)), p.tools.join(", "));
  assert.equal(new Set(p.weapons).size, p.weapons.length, "no repeats");
});

test("an artificer's tools all carry expertise from Tool Expertise", () => {
  const c = char([{ name: "Artificer", level: 6 }]);
  const p = characterProficiencies(c);
  assert.ok(p.tools.length > 0 && p.tools.every((t) => / \(expertise\)$/.test(t)), p.tools.join(", "));
});
