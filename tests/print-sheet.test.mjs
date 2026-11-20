/* The printed sheet's contents (js/core/print-sheet.js): every number is
   the sheet's own (same functions), written the way the classic sheet
   wants it, and the spell, feature, story and journal parts are there. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { applySpellSlots } from "../js/levelup/apply.js";
import { printSheetData, MAX_USE_BOXES } from "../js/core/print-sheet.js";
import { spellcastingStats } from "../js/core/sheet-numbers.js";

const SWORD = { id: "w1", type: "weapon", name: "Longsword", qty: 1, equipped: true, proficient: true, magicBonus: 0, ability: "str", damageDice: "1d8", damageType: "Slashing", category: "martial" };
function char(classes, extra = {}){
  const c = newCharacter("Print");
  c.classes = classes;
  c.abilities = { str: 16, dex: 16, con: 14, int: 16, wis: 12, cha: 10 };
  Object.assign(c, extra);
  ensureShape(c);
  applySpellSlots(c);
  return c;
}

test("page 1 numbers are the sheet's own", () => {
  const c = char([{ name: "Fighter", subclass: "Champion", level: 5 }], { inventory: [Object.assign({}, SWORD)] });
  const d = printSheetData(c);
  assert.equal(d.header.classLevel, "Fighter (Champion) 5");
  assert.equal(d.ac, H.computeArmorClass(c).value);
  assert.equal(d.initiative, H.fmtMod(H.computeInitiative(c).value));
  assert.equal(d.speed.walk, H.computeSpeed(c).value);
  assert.equal(d.hpMax, H.maxHp(c));
  assert.equal(d.profBonus, "+3");
  assert.deepEqual(d.abilities.map((a) => [a.name, a.score, a.mod]).slice(0, 2), [["Strength", 16, "+3"], ["Dexterity", 16, "+3"]]);
  assert.equal(d.saves.length, 6);
  d.saves.forEach((s, i) => assert.equal(s.value, H.fmtMod(H.computeSave(c, ["str", "dex", "con", "int", "wis", "cha"][i]).value)));
  assert.equal(d.skills.length, 18);
  assert.equal(d.skills.find((s) => s.name === "Animal Handling").ability, "Wis", "as the sheet prints it: Animal Handling (Wis)");
  assert.equal(d.passivePerception, H.passivePerception(c));
  assert.equal(d.hitDice, "5d10");
  assert.deepEqual(d.attacks, [{ name: "Longsword", bonus: "+6", damage: "1d8 + 3 slashing" }]);
  assert.equal(d.spellcasting, null, "no spellcasting page for a fighter");
  assert.deepEqual(d.senses, [], "a human: no senses, not 'No darkvision'");
  const elf = printSheetData(char([{ name: "Wizard", level: 1 }], { race: "High Elf" }));
  assert.ok(Array.isArray(elf.senses) && elf.senses.some((x) => /^Darkvision 60 ft/.test(x)), JSON.stringify(elf.senses));
});

test("hit dice per die size, and pencil boxes only for small use counts", () => {
  const c = char([{ name: "Paladin", subclass: "Oath of Devotion", level: 5 }, { name: "Warlock", subclass: "The Fiend", level: 2 }], { abilities: { str: 16, dex: 10, con: 14, int: 8, wis: 12, cha: 16 } });
  const d = printSheetData(c);
  assert.equal(d.hitDice, "5d10 + 2d8");
  const lay = d.uses.find((u) => u.name === "Lay on Hands");
  assert.ok(lay && lay.max === 25 && lay.boxes === false, "a pool of 25 gets a line, not boxes");
  const cd = d.uses.find((u) => u.name === "Channel Divinity");
  assert.ok(cd && cd.boxes && cd.reset === "short rest");
  assert.ok(d.uses.every((u) => u.boxes === (u.max <= MAX_USE_BOXES)));
  assert.equal(d.spellcasting.pact.max, 2, "the warlock's pact slots");
  assert.equal(d.spellcasting.levels[1].slotsTotal, 4, "paladin 5 slots: four 1st-level");
});

test("a wizard's spellcasting page: stats, slots, spells by level, full text in its own edition", () => {
  const c = char([{ name: "Wizard", level: 5, edition: "2024" }]);
  c.spellcasting.ability = "int";
  c.spells = [{ name: "Fire Bolt", level: 0 }, { name: "Fireball", level: 3, prepared: true }, { name: "Shield", level: 1, prepared: false }];
  const d = printSheetData(c);
  const st = spellcastingStats(c);
  assert.deepEqual(d.spellcasting.rows.map((r) => [r.ability, r.dc, r.attack]), [["INT", st.dc, H.fmtMod(st.attack)]]);
  assert.equal(d.spellcasting.levels[3].slotsTotal, 2);
  assert.deepEqual(d.spellcasting.levels[0].spells.map((s) => s.name), ["Fire Bolt"]);
  assert.deepEqual(d.spellcasting.levels[1].spells.map((s) => [s.name, s.prepared]), [["Shield", false]]);
  const fb = d.spellTexts.find((s) => s.name === "Fireball");
  assert.equal(fb.line, "3rd-level evocation");
  assert.ok(fb.meta.includes("Range: 150 feet"));
  assert.ok(fb.meta.some((m) => /a ball of bat guano and sulfur/.test(m)), "the 2024 wording: " + fb.meta.join(" | "));
  assert.match(fb.text, /20-foot radius/);
  assert.ok(d.spellTexts.find((s) => s.name === "Fire Bolt").line.endsWith("cantrip"));
});

test("a monk's unarmed strike gets an attack row", () => {
  const c = char([{ name: "Monk", level: 5 }]);
  const d = printSheetData(c);
  const u = d.attacks.find((a) => /Unarmed strike/.test(a.name));
  assert.ok(u, JSON.stringify(d.attacks));
  assert.equal(u.damage, "1d6 + 3 bludgeoning");
  assert.equal(u.bonus, "+6");
});

test("expertise, story, appearance, journal and footer", () => {
  const c = char([{ name: "Rogue", level: 3 }], { background: "Haunted One" });
  c.skillProfs.Stealth = { prof: true, expertise: true };
  c.story = { traits: ["I count everything.", ""], ideal: "Free will.", bond: "", flaw: "", faith: "", tables: { "Harrowing Event": "A ghost follows me." } };
  c.appearance = { age: "32", eyes: "green" };
  c.notes = [{ title: "Session 1", text: "Met the baron." }, { title: "", text: "  " }];
  const d = printSheetData(c, { playerName: "Sam", printedAt: new Date(2026, 10, 20) });
  const st = d.skills.find((s) => s.name === "Stealth");
  assert.ok(st.prof && st.expertise);
  assert.equal(d.header.playerName, "Sam");
  assert.deepEqual(d.personality.traits, ["I count everything."]);
  assert.deepEqual(d.backstory, [{ label: "Harrowing Event", text: "A ghost follows me." }]);
  assert.deepEqual(d.details.filter((x) => x.value).map((x) => [x.label, x.value]), [["Age", "32"], ["Eyes", "green"]]);
  assert.equal(d.details.length, 6);
  assert.deepEqual(d.journal, [{ title: "Session 1", text: "Met the baron." }]);
  assert.equal(d.footer.level, 3);
  assert.ok(d.featureTexts.some((f) => f.name === "Sneak Attack" && f.text.length > 20));
  assert.equal(d.features.length, d.featureTexts.length);
});

test("appearance details: absent until filled in, a broken value is dropped", () => {
  const fresh = newCharacter("New");
  assert.equal(fresh.appearance, undefined, "a new character has none (older saves need nothing)");
  assert.equal(printSheetData(ensureShape(fresh)).details.every((d) => d.value === ""), true, "and prints pencil lines");
  const kept = ensureShape(Object.assign(newCharacter("A"), { appearance: { hair: "Red" } }));
  assert.deepEqual(kept.appearance, { hair: "Red" });
  for(const bad of [null, "tall", ["x"]]){
    const c = ensureShape(Object.assign(newCharacter("B"), { appearance: bad }));
    assert.equal(c.appearance, undefined, "dropped: " + JSON.stringify(bad));
  }
});
