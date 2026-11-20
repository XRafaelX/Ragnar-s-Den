/* The home screen's Spellbook adds a spell in the chosen character's own
   edition (2026-11-20): it used to add the 2014 version to a 2024
   character, and couldn't find the 2024-only spells at all. */
import { test } from "node:test";
import assert from "node:assert/strict";
import "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { setSpellEdition, spellEdition } from "../js/core/spell-edition.js";
import { addFromSpellbook } from "../js/render/spellbook.js";
import { withFakeDom } from "./fake-dom.mjs";

function paladin(edition){
  const c = newCharacter("P");
  const cl = { name: "Paladin", level: 5 };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  return ensureShape(c);
}
const spell = (c, name) => c.spells.find((s) => s.name === name);

test("a 2024 character gets the 2024 version, whatever the Spellbook shows", (t) => {
  const c = paladin("2024");
  setSpellEdition("2014");            // the home screen: no character open
  withFakeDom(t, () => assert.equal(addFromSpellbook(c, "Cure Wounds"), "added"));
  assert.match(spell(c, "Cure Wounds").summary, /2d8/, "the 2024 healing");
  assert.equal(spellEdition(), "2014", "the Spellbook's edition is put back");
});

test("a 2024-only spell can be added to a 2024 character", (t) => {
  const c = newCharacter("D");
  c.classes = [{ name: "Druid", level: 3, edition: "2024" }];
  ensureShape(c);
  setSpellEdition("2014");
  withFakeDom(t, () => assert.equal(addFromSpellbook(c, "Starry Wisp"), "added"));
  assert.ok(spell(c, "Starry Wisp"));
});

test("a 2024 paladin already has Divine Smite from its Smite feature", (t) => {
  const c = paladin("2024");
  withFakeDom(t, () => assert.equal(addFromSpellbook(c, "Divine Smite"), "known"));
});

test("a 2014 character doesn't get a spell its rules don't have", (t) => {
  const c = paladin("");
  withFakeDom(t, () => assert.equal(addFromSpellbook(c, "Divine Smite"), "missing"));
  assert.equal(spell(c, "Divine Smite"), undefined);
});

test("a 2014 character keeps the 2014 version", (t) => {
  const c = paladin("");
  withFakeDom(t, () => assert.equal(addFromSpellbook(c, "Cure Wounds"), "added"));
  assert.match(spell(c, "Cure Wounds").summary, /1d8/);
});

test("a spell already on the sheet isn't added twice", (t) => {
  const c = paladin("2024");
  withFakeDom(t, () => {
    assert.equal(addFromSpellbook(c, "Bless"), "added");
    assert.equal(addFromSpellbook(c, "Bless"), "known");
  });
  assert.equal(c.spells.filter((s) => s.name === "Bless").length, 1);
});
