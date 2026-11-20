/* The Active effects card's line under an effect's name (effectSummary in
   js/render/panels/effects.js). A rule that differs between the 2014 and
   2024 books must reach its own line: the 2024 one is tested first. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { renderEffectsCard } from "../js/render/panels/effects.js";
import { withFakeDom } from "./fake-dom.mjs";

function sorcerer(edition, subclass){
  const c = newCharacter("S");
  const cl = { name: "Sorcerer", subclass, level: 14 };
  if(edition) cl.edition = edition;
  Object.assign(c, { classes: [cl], speed: 30 });
  ensureShape(c);
  c.effects = { dragon_wings: true };
  return c;
}
/* The words the card shows for the effects that are on. */
function summaries(t, c){
  let lines = [];
  withFakeDom(t, (byId, made) => {
    renderEffectsCard(c);
    lines = made.filter((el) => el.className === "fx-now").map((el) => el.textContent);
  });
  return lines;
}

test("Dragon Wings: the 2024 sorcerer flies 60 ft (PHB 2024 p. 147)", (t) => {
  assert.ok(summaries(t, sorcerer("2024", "Draconic Sorcery")).includes("Fly 60 ft"));
});

test("Dragon Wings: the 2014 sorcerer flies at their speed", (t) => {
  assert.ok(summaries(t, sorcerer("", "Draconic Bloodline")).includes("Fly 30 ft"));
});
