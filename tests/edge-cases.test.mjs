/* Phase D of the 2026-10-14 review: small edge cases.
   D1 the level-up's ability step when fewer than two points can be placed
      ("You can't increase an ability score above 20 using this feature");
   D2 which ability a weapon attack uses, so armor's STR/DEX penalty and
      rage damage follow the player's choice on a tie (Battle Ready);
   D4 a subclass picked or changed on the sheet adds its speed and HP
      extras (and takes the old one's back);
   D3 a warlock's Eldritch Blast from a feat meets an invocation's
      prerequisite (the user's ruling, 2026-10-16; a non-warlock still
      can't take one through Eldritch Adept);
   D5 undoing a level-up keeps spell slots added by hand since. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import * as LU from "../js/levelup/session.js";
import { finish, undoLastLevelUp } from "../js/levelup/apply.js";
import { applySpellSlots } from "../js/levelup/levelup.js";
import { subclassExtras, quickXpAmounts } from "../js/levelup/level-row.js";
import { XP_THRESHOLDS } from "../js/data/progression.js";
import { newCharacter } from "../js/core/character.js";
import { withFakeDom } from "./fake-dom.mjs";
import * as INV from "../js/core/invocations.js";
import * as FP from "../js/core/feat-picks.js";
import { INVOCATIONS } from "../js/data/invocations.js";
import { featPicksContext } from "../js/ui/feat-picks.js";

function char(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  Object.keys(extra).forEach((k) => { c[k] = extra[k]; });
  return c;
}

/* ---- D1 ---- */
test("D1: the ability step asks for only the points that can be placed", (t) => {
  const at = (abilities) => {
    const c = char([{ name: "Fighter", level: 3 }], { abilities, xp: 355000, hp: { max: 30, current: 30, temp: 0 } });
    let n;
    withFakeDom(t, () => { LU.openLevelUp(c); n = LU.asiPointsAvailable(); LU.close(); });
    return n;
  };
  assert.equal(at({ str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 }), 2);
  assert.equal(at({ str: 20, dex: 20, con: 20, int: 20, wis: 20, cha: 19 }), 1, "one score at 19: one point");
  assert.equal(at({ str: 20, dex: 20, con: 20, int: 20, wis: 20, cha: 20 }), 0, "all at 20: none, take a feat");
  // The real level-up goes through with the one point.
  const c = char([{ name: "Fighter", level: 3 }], { abilities: { str: 20, dex: 20, con: 20, int: 20, wis: 20, cha: 19 }, xp: 355000, hp: { max: 30, current: 30, temp: 0 } });
  withFakeDom(t, () => {
    LU.openLevelUp(c);
    LU.lu.asi.cha = 1; LU.lu.hpMethod = "avg";
    finish();
  });
  assert.equal(c.abilities.cha, 20);
  assert.equal(c.classes[0].level, 4);
});

/* ---- D2 ---- */
test("D2: on a tie between STR and INT (Battle Ready), armor's STR penalty is avoided and rage still counts", () => {
  const PLATE = { id: "p", name: "Plate", type: "armor", category: "heavy", baseAC: 18, equipped: true };
  const axe = { id: "a", name: "Battleaxe", type: "weapon", damageDice: "1d8", ability: "str", proficient: true, magic: true, equipped: true };
  // A Battle Smith 3 (Battle Ready: INT with magic weapons), STR 16 and INT 16, in plate it can't wear.
  const c = char([{ name: "Artificer", subclass: "Battle Smith", level: 3 }], { abilities: { str: 16, dex: 10, con: 14, int: 16, wis: 10, cha: 8 }, inventory: [PLATE, axe] });
  assert.deepEqual(H.weaponAbility(c, axe), { mod: 3, keys: ["str", "int"] });
  assert.equal(H.attackRollMode(c, axe).mode, "none", "INT reaches the same modifier: no STR penalty");
  // INT lower: the attack is STR's and takes the penalty.
  c.abilities.int = 12;
  assert.equal(H.attackRollMode(c, axe).mode, "dis");
  // A barbarian with a finesse weapon, STR and DEX tied: rage applies (STR is among the best).
  const rapier = { id: "r", name: "Rapier", type: "weapon", damageDice: "1d8", ability: "finesse", proficient: true, equipped: true };
  const barb = char([{ name: "Barbarian", level: 3 }], { abilities: { str: 14, dex: 14, con: 14, int: 8, wis: 10, cha: 8 }, rage: { active: true, used: 1 }, inventory: [rapier] });
  assert.equal(H.rageDamageBonus(barb, rapier), 2);
  barb.abilities.dex = 16;
  assert.equal(H.rageDamageBonus(barb, rapier), 0, "DEX better: the attack isn't a STR one");
});

/* ---- D4 ---- */
test("D4: a subclass's speed and HP extras, by level", () => {
  assert.deepEqual(subclassExtras({ name: "Rogue", level: 9 }, "Scout"), { speed: 10, hp: 0 }, "Superior Mobility");
  assert.deepEqual(subclassExtras({ name: "Rogue", level: 8 }, "Scout"), { speed: 0, hp: 0 }, "not yet");
  assert.deepEqual(subclassExtras({ name: "Paladin", level: 7 }, "Oath of Glory"), { speed: 10, hp: 0 }, "Aura of Alacrity");
  assert.deepEqual(subclassExtras({ name: "Sorcerer", level: 5 }, "Draconic Bloodline"), { speed: 0, hp: 5 }, "Draconic Resilience");
  assert.deepEqual(subclassExtras({ name: "Rogue", level: 9 }, "Thief"), { speed: 0, hp: 0 });
  assert.deepEqual(subclassExtras({ name: "Rogue", level: 9 }, "My Homebrew"), { speed: 0, hp: 0 });
});

/* ---- D5 ---- */
test("D5: undoing a level-up keeps a spell slot added by hand after it", (t) => {
  const c = char([{ name: "Wizard", level: 3 }], { abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, xp: 355000, hp: { max: 20, current: 20, temp: 0 } });
  applySpellSlots(c);
  withFakeDom(t, () => { LU.openLevelUp(c); LU.lu.asi.int = 2; LU.lu.hpMethod = "avg"; finish(); });
  assert.equal(c.spellcasting.slots[2].max, 3, "wizard 4: three 2nd-level slots");
  // An extra 1st-level slot added on the Spells tab (a magic item, say).
  c.spellcasting.slots[1].extra = 1;
  applySpellSlots(c);
  assert.equal(c.spellcasting.slots[1].max, 5);
  withFakeDom(t, (byId) => { undoLastLevelUp(c); byId["confirm-ok"].click(); });
  assert.equal(c.classes[0].level, 3);
  assert.equal(c.spellcasting.slots[1].max, 4 + 1, "wizard 3's four, plus the one added by hand");
  assert.equal(c.spellcasting.slots[2].max, 2);
  // Undoing a multiclass that was the only caster restores the old numbers.
  const f = char([{ name: "Fighter", level: 2 }], { abilities: { str: 15, dex: 12, con: 14, int: 13, wis: 10, cha: 8 }, xp: 355000, hp: { max: 20, current: 20, temp: 0 } });
  withFakeDom(t, () => { LU.openLevelUp(f); LU.resetChoicesFor("Wizard"); LU.lu.hpMethod = "avg"; LU.lu.learnPicks = {}; finish(); });
  assert.ok(f.spellcasting.slots[1].max > 0, "the wizard level brings slots");
  withFakeDom(t, (byId) => { undoLastLevelUp(f); byId["confirm-ok"].click(); });
  assert.equal(f.spellcasting.slots[1].max, 0, "back to none");
});

/* ---- D3 ---- */
test("D3: a warlock's Eldritch Blast from a feat meets an invocation's prerequisite; a non-warlock still can't take one", () => {
  const agonizing = INVOCATIONS.find((i) => i.name === "Agonizing Blast");
  const warlock = char([{ name: "Warlock", subclass: "The Fiend", level: 2 }], { abilities: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 } });
  const reason = (c) => INV.invocationReason(agonizing, INV.invocationContext(c, INV.warlockEntry(c)));
  assert.equal(reason(warlock), "needs Eldritch Blast", "no Eldritch Blast at all");
  const feat = { id: "mi", name: "Magic Initiate" };
  warlock.feats.push(feat);
  FP.applyFeatPicks(warlock, feat, { ...FP.emptyPicks(FP.featDef("Magic Initiate")), option: "Warlock", spells: ["Eldritch Blast", "Minor Illusion", "Hex"] });
  assert.equal(reason(warlock), "", "known through Magic Initiate: it counts (user's ruling, 2026-10-16)");
  // A fighter with the same feat: Eldritch Adept still offers only invocations without a prerequisite.
  const fighter = char([{ name: "Fighter", level: 4 }], { abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 14 } });
  const f2 = { id: "mi2", name: "Magic Initiate" };
  fighter.feats.push(f2);
  FP.applyFeatPicks(fighter, f2, { ...FP.emptyPicks(FP.featDef("Magic Initiate")), option: "Warlock", spells: ["Eldritch Blast", "Minor Illusion", "Hex"] });
  assert.ok(!featPicksContext(fighter).invocationChoices().includes("Agonizing Blast"), "Eldritch Adept: a warlock who meets it, nobody else");
});

test("quick XP buttons scale with the level", () => {
  const gap = l => XP_THRESHOLDS[l+1] - XP_THRESHOLDS[l];
  assert.deepEqual(quickXpAmounts(gap(1)), [10, 25, 50, 100]);
  assert.deepEqual(quickXpAmounts(gap(3)), [50, 100, 250, 500]);
  assert.deepEqual(quickXpAmounts(gap(10)), [1000, 2500, 5000, 10000]);
  assert.deepEqual(quickXpAmounts(gap(19)), [2500, 5000, 10000, 25000]);
  for(let l = 1; l < 20; l++){
    const amounts = quickXpAmounts(gap(l));
    assert.equal(amounts.length, 4);
    assert.ok(amounts[3] <= gap(l), "level "+l+": the largest award fits in one level");
  }
});
