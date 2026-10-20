/* Background story tables (2026-10-20): personality traits, ideals,
   bonds and flaws and each background's own story tables, from the
   published pages, on the Information tab's Personality card. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { BACKGROUND_INFO } from "../js/data/backgrounds.js";
import { BACKGROUND_STORIES, BACKGROUND_STORIES_FROM } from "../js/data/background-stories.js";
import { storyTables, rollStory, entryRoll, storyShape } from "../js/core/background-story.js";
import { renderPersonalityCard } from "../js/render/panels/personality.js";
import { newCharacter } from "../js/core/character.js";
import { withFakeDom } from "./fake-dom.mjs";

const fixed = (x) => () => x;

test("data: every background resolves; tables are complete; no long dashes", () => {
  for(const bg of Object.keys(BACKGROUND_INFO)){
    assert.ok(BACKGROUND_STORIES[bg] || BACKGROUND_STORIES_FROM[bg] || bg === "Investigator (Ravenloft)", bg + " has tables or borrows some");
    const t = storyTables(bg);
    for(const k of ["traits", "ideal", "bond", "flaw"]) if(t[k]) assert.ok(t[k].entries.length >= 4 && t[k].entries.length <= t[k].die, bg + " " + k);
  }
  for(const [bg, s] of Object.entries(BACKGROUND_STORIES)) for(const st of s.story || []){
    assert.ok(st.label && st.entries.length, bg + " story table");
    if(st.rolls) assert.equal(st.rolls.length, st.entries.length, bg + " " + st.label + " rolls");
  }
  for(const to of Object.values(BACKGROUND_STORIES_FROM)) assert.ok(BACKGROUND_STORIES[to], to + " exists");
  assert.ok(!/[—–]/.test(JSON.stringify(BACKGROUND_STORIES)), "no long dashes");
});

test("who borrows what: variants take everything, Sword Coast pages only the traits and motivations", () => {
  assert.equal(storyTables("Haunted One").story[0].label, "Harrowing Event");
  assert.equal(storyTables("Haunted One").traits.die, 8);
  assert.deepEqual(storyTables("Spy").story.map((s) => s.label), ["Specialty"], "the Criminal's");
  assert.equal(storyTables("City Watch").from, "Soldier");
  assert.equal(storyTables("City Watch").ideal, BACKGROUND_STORIES.Soldier.ideal);
  assert.deepEqual(storyTables("City Watch").story, [], "not the Soldier's Specialty");
  assert.deepEqual(storyTables("Inheritor").story.map((s) => s.label), ["Inheritance"], "its own table, with the Folk Hero's traits");
  assert.equal(storyTables("Inheritor").traits, BACKGROUND_STORIES["Folk Hero"].traits);
  const none = storyTables("Investigator (Ravenloft)");
  assert.deepEqual([none.traits, none.story.length], [null, 0]);
});

test("rolls: the die read as the entry, ranges, and a second trait differs", () => {
  const t = BACKGROUND_STORIES["Haunted One"].traits;
  assert.equal(rollStory(t, fixed(0)), t.entries[0]);
  assert.equal(rollStory(t, fixed(0.999)), t.entries[7]);
  assert.notEqual(rollStory(t, fixed(0), t.entries[0]), t.entries[0], "avoids the other trait");
  const inh = storyTables("Inheritor").story[0];
  assert.equal(entryRoll(inh, 1), "2-3");
  assert.equal(rollStory(inh, fixed(0.25)), inh.entries[1], "a 3 is the 2-3 entry");
});

test("the card draws for any background, and an older sheet gets an empty story", (t) => {
  const c = newCharacter("Test");
  delete c.story;
  assert.deepEqual(storyShape(c), { traits: ["", ""], ideal: "", bond: "", flaw: "", tables: {} });
  withFakeDom(t, () => {
    for(const bg of ["Haunted One", "City Watch", "Investigator (Ravenloft)", "Feylost"]){ c.background = bg; assert.ok(renderPersonalityCard(c), bg); }
  });
});
