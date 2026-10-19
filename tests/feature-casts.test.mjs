/* Phase E4 of the 2026-10-14 review: features that cast a named spell
   without a slot (or for ki or Jinx Points) put that spell on the Spells
   tab with a short tag (its rule in the tag's tooltip), and Signature
   Spells get one counter per spell. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { newCharacter } from "../js/core/character.js";
import { renderSpellsPanel } from "../js/render/panels/spells.js";
import { withFakeDom } from "./fake-dom.mjs";

function char(classes, extra = {}){
  const c = newCharacter("Test");
  Object.assign(c, { classes, abilities: { str: 10, dex: 16, con: 14, int: 12, wis: 16, cha: 14 } }, extra);
  return c;
}
const granted = (c, name) => H.featureSpells(c).find((fs) => fs.name === name);

test("at will and free casts: the spell, its kind and tag", () => {
  const moon = char([{ name: "Druid", subclass: "Circle of the Moon", level: 14 }]);
  assert.deepEqual([granted(moon, "Alter Self").kind, granted(moon, "Alter Self").kindLabel], ["atwill", undefined], "Thousand Forms: the At will tag");
  assert.equal(granted(char([{ name: "Druid", subclass: "Circle of the Moon", level: 13 }]), "Alter Self"), undefined, "not before 14");
  const fate = char([{ name: "Cleric", subclass: "Fate Domain", level: 17 }]);
  assert.equal(granted(fate, "Foresight").kindLabel, "Free 1/long rest");
  assert.match(granted(fate, "Foresight").tip, /^Visions of the Future: /);
  const dreams = char([{ name: "Druid", subclass: "Circle of Dreams", level: 14 }]);
  assert.deepEqual(["Dream", "Scrying", "Teleportation Circle"].map((n) => granted(dreams, n).kind), ["free", "free", "free"]);
  // A barbarian isn't a caster, but Consult the Spirits' spells are listed.
  const guardian = char([{ name: "Barbarian", subclass: "Path of the Ancestral Guardian", level: 10 }]);
  assert.deepEqual(["Augury", "Clairvoyance"].map((n) => granted(guardian, n).kindLabel), ["Free 1/short rest", "Free 1/short rest"]);
});

test("ki and Jinx Point casts carry their cost and save DC", () => {
  const sun = char([{ name: "Monk", subclass: "Way of the Sun Soul", level: 6 }]);
  const bh = granted(sun, "Burning Hands");
  assert.equal(bh.kindLabel, "2 ki");
  assert.match(bh.note, /^Uses Wisdom: save DC 14, spell attack \+6\.$/, "monk 6: 8 + 3 + 3");
  const shadow = char([{ name: "Monk", subclass: "Way of Shadow", level: 3 }]);
  assert.deepEqual(["Darkness", "Darkvision", "Pass without Trace", "Silence"].map((n) => granted(shadow, n).kindLabel), ["2 ki", "2 ki", "2 ki", "2 ki"]);
  assert.equal(granted(shadow, "Minor Illusion").level, 0, "the cantrip stays a cantrip");
  const monk18 = char([{ name: "Monk", level: 18 }]);
  assert.equal(granted(monk18, "Astral Projection").kindLabel, "8 ki");
  const jinx = char([{ name: "Rogue", subclass: "Misfortune Bringer", level: 13 }]);
  assert.match(granted(jinx, "Bestow Curse").note, /Uses Charisma/);
});

test("a spell an earlier feature gives takes the later one's tag", () => {
  const fey = char([{ name: "Ranger", subclass: "Fey Wanderer", level: 15 }]);
  const ms = granted(fey, "Misty Step");
  assert.deepEqual([ms.kind, ms.kindLabel], ["known", "Free WIS mod/long rest"], "still known; Misty Wanderer's free casts on the tag");
  assert.match(ms.tip, /^Misty Wanderer: /);
  assert.equal(granted(char([{ name: "Ranger", subclass: "Fey Wanderer", level: 14 }]), "Misty Step").kindLabel, undefined, "before 15: just known");
});

test("Signature Spells: one counter per spell once they're picked", () => {
  const wiz = char([{ name: "Wizard", subclass: "School of Evocation", level: 20 }]);
  let sig = H.characterResources(wiz).filter((r) => /Signature/.test(r.name));
  assert.deepEqual(sig.map((r) => [r.name, r.max]), [["Signature Spells", 2]], "not picked yet: the shared counter");
  wiz.classes[0].profPicks = { "class:Signature Spells@20": { slots: [["Fireball", "Counterspell"]], applied: { skills: [], expertise: [], languages: [], weaponItems: [] } } };
  sig = H.characterResources(wiz).filter((r) => /Signature/.test(r.name));
  assert.deepEqual(sig.map((r) => [r.name, r.max, r.reset]), [["Fireball (Signature Spell)", 1, "short"], ["Counterspell (Signature Spell)", 1, "short"]]);
  wiz.resourcesUsed = { [sig[0].key]: 1 };
  assert.deepEqual(H.characterResources(wiz).filter((r) => /Signature/.test(r.name)).map((r) => r.used), [1, 0], "each tracked on its own");
});

test("the Spells tab draws the tags", (t) => {
  withFakeDom(t, () => {
    assert.ok(renderSpellsPanel(char([{ name: "Monk", subclass: "Way of Shadow", level: 3 }])));
    assert.ok(renderSpellsPanel(char([{ name: "Barbarian", subclass: "Path of the Ancestral Guardian", level: 10 }])));
  });
});
