/* Channel Divinity's card on Vitals (2026-11-16, js/render/panels/channel-divinity.js):
   every option of every domain and oath, in both editions, gets a tag saying
   when it's used and the book feature its sheet shows in full. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { SUBCLASSES } from "../js/data/progression.js";
import { subclassesFor } from "../js/core/class-features.js";
import { optionsOf, whenOf, featureFor, channelResourceKey } from "../js/render/panels/channel-divinity.js";

const ABIL = { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 16 };
function hero(cls, sub, edition){
  const c = newCharacter("C");
  const cl = { name: cls, subclass: sub, level: 20, profPicks: {} };
  if(edition) cl.edition = edition;
  c.classes = [cl];
  c.abilities = Object.assign({}, ABIL);
  // A melee weapon in hand, so Sacred Weapon has something to imbue.
  c.inventory = [{ id: "s", name: "Longsword", type: "weapon", equipped: true, damageDice: "1d8" }];
  return ensureShape(c);
}
// Options used with no action of their own: on a hit, a roll or another's turn.
const FREE = ["Guided Strike", "Destructive Wrath", "Touch of Death", "Inspiring Smite"];

for(const cls of ["Cleric", "Paladin"]){
  for(const edition of ["", "2024"]){
    test(cls + (edition ? " 2024" : " 2014") + ": every option has a tag and its feature", () => {
      const subs = edition ? subclassesFor(cls, "2024").map((s) => s.name) : SUBCLASSES[cls].filter((s) => !s.edition).map((s) => s.name);
      assert.ok(subs.length > 3);
      for(const sub of subs){
        const c = hero(cls, sub, edition);
        const opts = optionsOf(c, cls);
        assert.ok(opts.length >= 1, sub);
        for(const o of opts){
          const when = whenOf(o);
          assert.ok(when !== "No action" || FREE.includes(o.name), sub + ": " + o.name + " has no tag");
          assert.ok(featureFor(c, o), sub + ": " + o.name + " has no feature");
          assert.ok(!/[–—;]/.test(o.detail || ""), sub + ": " + o.name + " plain words");
        }
      }
    });
  }
}

test("a group is one option with its picker: Knowledge of the Ages, Sacred Weapon", () => {
  const know = optionsOf(hero("Cleric", "Knowledge Domain", ""), "Cleric").find((o) => o.name === "Knowledge of the Ages");
  assert.ok(know.items.length > 5 && know.pick === "Choose a skill or tool..." && /choose one skill or tool/.test(know.detail));
  const sacred = optionsOf(hero("Paladin", "Oath of Devotion", ""), "Paladin").find((o) => o.name === "Sacred Weapon");
  assert.deepEqual(sacred.items.map((a) => a.name), ["Longsword"]);
  assert.equal(sacred.pick, "Choose a weapon...");
});

test("the tags read from the words, or `when` where they don't say", () => {
  const war = optionsOf(hero("Cleric", "War Domain (2024)", "2024"), "Cleric");
  assert.equal(whenOf(war.find((o) => o.name === "Divine Spark")), "Magic action");
  assert.equal(whenOf(war.find((o) => o.name === "War God's Blessing")), "Bonus action");
  assert.equal(whenOf(optionsOf(hero("Paladin", "Oath of Glory", ""), "Paladin").find((o) => o.name === "Inspiring Smite")), "Bonus action");
  assert.equal(whenOf(optionsOf(hero("Paladin", "Oath of Vengeance (2024)", "2024"), "Paladin").find((o) => o.name === "Vow of Enmity")), "Attack action");
  assert.equal(whenOf(optionsOf(hero("Paladin", "Oath of Redemption", ""), "Paladin").find((o) => o.name === "Rebuke the Violent")), "Reaction");
});

test("the card takes Channel Divinity and Harness Divine Power off Class resources", () => {
  assert.ok(channelResourceKey("Cleric:channel_divinity") && channelResourceKey("Paladin:harness_divine_power"));
  assert.ok(!channelResourceKey("Cleric:divine_intervention") && !channelResourceKey("Paladin:lay_on_hands"));
});
