/* ---------------- Choices shared by class features ----------------
   The lists behind a ranger's Favored Enemy and Natural Explorer (asked
   at ranger levels 1, 6 and 14, and 1, 6 and 10) and a Draconic
   sorcerer's Dragon Ancestor, as `profs` (see js/core/class-picks.js).
   Player's Handbook (2014). */

export var FAVORED_ENEMIES = {
  "Creature types":["Aberrations","Beasts","Celestials","Constructs","Dragons","Elementals","Fey","Fiends","Giants","Monstrosities","Oozes","Plants","Undead"],
  "Humanoids (two races)":["Humanoids: gnolls and orcs","Humanoids: goblins and hobgoblins","Humanoids: humans and elves","Humanoids: dwarves and gnomes","Humanoids: kobolds and lizardfolk","Humanoids: bandits and cultists (humans and half-orcs)"]
};
export var FAVORED_TERRAINS = ["Arctic","Coast","Desert","Forest","Grassland","Mountain","Swamp","Underdark"];

/* One favored enemy (a creature type, or two humanoid races, which can be
   typed in) and a language it speaks, "if they speak one at all". */
export function favoredEnemyProfs(label){
  return {help:"The kind of creature you've studied and hunted: you have advantage on Wisdom (Survival) checks to track them and on Intelligence checks to recall what you know about them.", pick:[
    {kind:"choice", id:"favoredEnemy", noun:"favored enemy", groups:FAVORED_ENEMIES, custom:true, label:label || "Choose a favored enemy"},
    {kind:"language", optional:true, none:"None (they speak no language)", label:"Learn a language your favored enemies speak, if they speak one"}
  ]};
}
export function favoredTerrainProfs(label){
  return {help:"The land you know best. Travelling there, difficult terrain doesn't slow your group, you can't get lost except by magic, you stay alert, and you forage and track twice as well.",
    pick:[{kind:"choice", id:"favoredTerrain", noun:"favored terrain", options:FAVORED_TERRAINS, label:label || "Choose a favored terrain"}]};
}

/* Dragon Ancestor: the dragon sets the damage type of later Draconic
   Bloodline features. */
export var DRAGON_ANCESTORS = [
  ["Black","Acid"],["Blue","Lightning"],["Brass","Fire"],["Bronze","Lightning"],["Copper","Acid"],
  ["Gold","Fire"],["Green","Poison"],["Red","Fire"],["Silver","Cold"],["White","Cold"]
].map(function(d){ return {name:d[0]+" dragon", text:d[1]+" damage. Your Elemental Affinity (sorcerer level 6) boosts spells of this type."}; });
export function dragonAncestorProfs(){
  var details = {};
  DRAGON_ANCESTORS.forEach(function(d){ details[d.name] = d.text; });
  return {languages:["Draconic"], help:"The kind of dragon in your bloodline. It sets the damage type your later Draconic Bloodline features use.", pick:[{kind:"choice", id:"dragonAncestor", noun:"dragon ancestor", label:"Choose the dragon in your bloodline",
    options:DRAGON_ANCESTORS.map(function(d){ return d.name; }), details:details}]};
}
