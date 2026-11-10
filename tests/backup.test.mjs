/* Export characters: the file holds only the chosen characters and the
   homebrew they use, so it opens fully elsewhere without the rest. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { homebrewForCharacters } from "../js/core/backup.js";
import { backupFileName } from "../js/core/basics.js";

const lib = {
  customSubclasses: [
    {id:"s1", className:"Fighter", name:"Blade Dancer"},
    {id:"s2", className:"Wizard", name:"Blade Dancer"},
    {id:"s3", className:"Rogue", name:"Shadow Fox"}
  ],
  customRaces: [{id:"r1", name:"Moonkin"}, {id:"r2", name:"Stoneborn"}],
  customBackgrounds: [{id:"b1", name:"Ferryman"}, {id:"b2", name:"Scribe"}],
  customFeats: [{id:"f1", name:"Iron Will"}, {id:"f2", name:"Quick Hands"}],
  customFeatures: [{id:"x1", name:"Lucky Charm"}, {id:"x2", name:"Odd Trick"}],
  customWeapons: [{id:"w1", name:"Hook Blade"}, {id:"w2", name:"Glass Spear"}],
  customArmor: [{id:"a1", name:"Bark Mail"}, {id:"a2", name:"Silk Coat"}],
  customSpells: [{id:"p1", name:"Ember Whisper"}, {id:"p2", name:"Frost Kiss"}]
};

const hero = {
  classes:[{name:"Fighter", subclass:"Blade Dancer", level:3}],
  race:"Moonkin", background:"Ferryman",
  feats:[{name:"Iron Will", homebrewId:"f1"}, {name:"Alert"}],
  features:[{name:"Lucky Charm", homebrewId:"x1"}],
  inventory:[{name:"Hook Blade", type:"weapon", homebrewId:"w1"}, {name:"Bark Mail", type:"armor", homebrewId:"a1"}],
  spells:[{name:"Ember Whisper", homebrewId:"p1"}]
};
const plain = {classes:[{name:"Rogue", subclass:"Thief", level:2}], race:"Elf", background:"Sage", feats:[], features:[], inventory:[], spells:[]};

test("only the homebrew the chosen characters use is exported", () => {
  const out = homebrewForCharacters([hero], lib);
  assert.deepEqual(out.customSubclasses.map(e => e.id), ["s1"]); // not the Wizard one of the same name
  assert.deepEqual(out.customRaces.map(e => e.id), ["r1"]);
  assert.deepEqual(out.customBackgrounds.map(e => e.id), ["b1"]);
  assert.deepEqual(out.customFeats.map(e => e.id), ["f1"]);
  assert.deepEqual(out.customFeatures.map(e => e.id), ["x1"]);
  assert.deepEqual(out.customWeapons.map(e => e.id), ["w1"]);
  assert.deepEqual(out.customArmor.map(e => e.id), ["a1"]);
  assert.deepEqual(out.customSpells.map(e => e.id), ["p1"]);
  assert.equal(out.customMonsters, undefined);
  assert.equal(out.encounters, undefined);
  assert.equal(out.dungeons, undefined);
});

test("a character with no homebrew exports none", () => {
  const out = homebrewForCharacters([plain], lib);
  Object.values(out).forEach(list => assert.deepEqual(list, []));
});

test("character export file name", () => {
  assert.equal(backupFileName(new Date(2026, 10, 2, 9, 5), "2.0.0", "characters"), "ragnars-den-characters_2026-11-02_0905_v2.0.0.json");
});
