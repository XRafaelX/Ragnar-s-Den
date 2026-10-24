/* The combat tracker's jokes: plain sentences with only the fill-ins the
   tracker knows, so a line never shows a raw {placeholder}. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENCOUNTER_QUIPS } from "../js/data/encounter-quips.js";

const FILL_INS = {
  dead: ["name", "kind"], slain: ["name", "kind"], oneShot: ["name", "kind"], low: ["name", "kind"],
  fullHeal: ["name", "kind"], victory: [], round5: [], round10: [], round20: [], back: [],
  many10: [], many20: [], many50: [], roundLong: ["round"], reset: ["enc"], deleted: ["enc"],
  overkill: ["name", "kind", "dmg", "left", "over", "hp"], exact: ["name", "kind", "dmg", "left", "over", "hp"],
  big: ["name", "kind", "dmg", "left", "over", "hp"], revive: ["name", "kind", "dmg", "left", "over", "hp"],
  heal: ["name", "kind", "dmg", "left", "over", "hp"]
};

test("every moment has lines, and only the fill-ins it is given", () => {
  assert.deepEqual(Object.keys(ENCOUNTER_QUIPS).sort(), Object.keys(FILL_INS).sort());
  for(const [moment, lines] of Object.entries(ENCOUNTER_QUIPS)){
    assert.ok(lines.length >= 2 || moment === "deleted", moment + " has a choice of lines");
    for(const line of lines){
      for(const [, key] of line.matchAll(/\{(\w+)\}/g)) assert.ok(FILL_INS[moment].includes(key), `${moment}: {${key}} in "${line}"`);
      assert.ok(!/[;–—]/.test(line), `no semicolons or long dashes: "${line}"`);
      assert.match(line, /[.!?]$/, `ends a sentence: "${line}"`);
    }
  }
});

test("a joke about a kill still says the monster is down", () => {
  for(const moment of ["slain", "oneShot", "exact"]){
    for(const line of ENCOUNTER_QUIPS[moment]){
      assert.match(line, /down|floor|defeated|drops|hit\b|blow|see it coming|hit points/i, `${moment}: "${line}"`);
    }
  }
  for(const line of ENCOUNTER_QUIPS.victory) assert.ok(line.startsWith("Victory!"), line);
  for(const line of ENCOUNTER_QUIPS.fullHeal) assert.match(line, /full/i, line);
});
