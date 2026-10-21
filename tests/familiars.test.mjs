/* Familiars and the Beast Master's beasts (2026-10-20), from the SRD 5.1
   stat blocks (js/data/beast-blocks.js). Find Familiar: a bat, cat, crab,
   frog, hawk, lizard, octopus, owl, poisonous snake, quipper, rat, raven,
   sea horse, spider or weasel that can't attack; Pact of the Chain adds an
   imp, pseudodragon, quasit or sprite, and lets the familiar attack.
   A PHB Beast Master's beast: no larger than Medium, CR 1/4 or lower. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as COMP from "../js/core/companions.js";
import { BEAST_PRESETS } from "../js/data/companions.js";
import { SRD_STAT_BLOCKS, FAMILIAR_FORMS, CHAIN_FAMILIARS, BEAST_MASTER_BEASTS } from "../js/data/beast-blocks.js";
import { MONSTER_DATA } from "../js/data/monsters.js";
import { newCharacter, ensureShape } from "../js/core/character.js";

function char(classes, extra = {}){
  const c = newCharacter("Test");
  c.classes = classes;
  Object.assign(c, extra);
  return c;
}
const familiar = (c) => COMP.characterCompanions(c).find((x) => x.def.id === "familiar");

test("stat blocks: every form and beast, matching the bestiary", () => {
  assert.equal(FAMILIAR_FORMS.length, 15);
  assert.deepEqual(CHAIN_FAMILIARS, ["Imp", "Pseudodragon", "Quasit", "Sprite"]);
  assert.equal(BEAST_MASTER_BEASTS.length, 43);
  for(const n of FAMILIAR_FORMS.concat(CHAIN_FAMILIARS, BEAST_MASTER_BEASTS)){
    const b = SRD_STAT_BLOCKS[n], m = MONSTER_DATA[n];
    assert.ok(b && m, n);
    assert.deepEqual([b.ac, b.hp, b.abilities.str, b.abilities.dex], [m.ac, m.hp, m.str, m.dex], n + " matches the bestiary");
    for(const a of b.attacks) assert.ok(a.name && a.toHit != null && a.damageType && a.dice, n + ": " + a.name);
  }
  for(const n of BEAST_MASTER_BEASTS){
    const b = SRD_STAT_BLOCKS[n];
    assert.ok(b.type === "beast" && b.cr <= 0.25 && ["Tiny", "Small", "Medium"].includes(b.size), n + ": a beast a Beast Master can take");
  }
  assert.deepEqual(Object.keys(BEAST_PRESETS), BEAST_MASTER_BEASTS);
  assert.match(SRD_STAT_BLOCKS["Poisonous Snake"].attacks[0].text, /DC 10 Constitution saving throw, taking 5 \(2d4\) poison damage/);
});

test("a familiar: Find Familiar known, a form picked, no attacks", () => {
  const wiz = char([{ name: "Wizard", subclass: "", level: 3 }], { spells: [] });
  assert.equal(familiar(wiz), undefined, "no familiar without the spell");
  wiz.spells = [{ name: "Find Familiar", level: 1 }];
  const f = familiar(wiz);
  assert.ok(f && f.stats === null, "listed, waiting for a form");
  assert.equal(f.source, "Find Familiar");
  assert.ok(f.options.includes("Owl") && !f.options.includes("Imp"), "an imp needs Pact of the Chain");
  COMP.setCompanionChoice(wiz, "familiar", "Owl");
  const owl = familiar(wiz).stats;
  assert.deepEqual([owl.ac, owl.hp, owl.attacks.length], [11, 1, 0]);
  assert.match(owl.type, /Tiny celestial, fey or fiend: owl/);
  assert.ok(owl.traits.some((t) => /can't attack/.test(t.text)));
  assert.equal(familiar(wiz).hp[0], 1);
});

test("Pact of the Chain: an imp, which can attack", () => {
  const lock = char([{ name: "Warlock", subclass: "The Fiend", level: 3, pactBoon: "Pact of the Chain" }]);
  const f = familiar(lock);
  assert.equal(f.source, "Pact of the Chain");
  assert.ok(f.options.includes("Imp") && f.options.includes("Owl"));
  COMP.setCompanionChoice(lock, "familiar", "Imp");
  const imp = familiar(lock).stats;
  assert.deepEqual([imp.ac, imp.hp, imp.attacks[0].name, imp.attacks[0].toHit], [13, 10, "Sting (Bite in Beast Form)", 5]);
  assert.match(imp.type, /^Tiny fiend: imp/);
  assert.ok(imp.traits.some((t) => t.name === "Pact of the Chain"));
  // Without the pact (and without Find Familiar), no familiar.
  lock.classes[0].pactBoon = "Pact of the Blade";
  assert.equal(familiar(lock), undefined);
});

test("a new companion is unseen (the tab's NEW dot) until the Companions tab is opened", () => {
  const wiz = char([{ name: "Wizard", subclass: "", level: 3 }], { spells: [] });
  assert.deepEqual(COMP.unseenCompanions(wiz), []);
  wiz.spells = [{ name: "Find Familiar", level: 1 }];
  assert.deepEqual(COMP.unseenCompanions(wiz).map((x) => x.def.id), ["familiar"]);
  assert.equal(COMP.newCompanionsText(COMP.unseenCompanions(wiz)),
    "New companion: Familiar. It's on the Companions tab, set it up on its card.");
  assert.equal(COMP.markCompanionsSeen(wiz), true);
  assert.equal(COMP.markCompanionsSeen(wiz), false, "nothing new the second time");
  assert.deepEqual(COMP.unseenCompanions(wiz), []);
  COMP.setCompanionChoice(wiz, "familiar", "Owl");
  assert.equal(COMP.newCompanionsText(COMP.characterCompanions(wiz)), "New companion: Familiar. It's on the Companions tab.");
});

test("an older save's companions count as seen; one gained later doesn't", () => {
  const old = char([{ name: "Artificer", subclass: "Battle Smith", level: 3 }]);
  delete old.seenCompanions;
  ensureShape(old);
  assert.deepEqual(old.seenCompanions, ["steel_defender"]);
  old.spells = [{ name: "Find Familiar", level: 1 }];
  assert.deepEqual(COMP.unseenCompanions(old).map((x) => x.def.id), ["familiar"]);
});
