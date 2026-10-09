/* How many spells and cantrips each class knows, by class level (index =
   class level, 0 unused), for the level-up's New spells step and the
   Spells tab's counts. 2014 Player's Handbook and Xanathar's tables.

   Each caster entry:
     list         the class list its spells come from
     cantrips     cantrips known by class level (every caster)
     spells       spells known by class level: classes that know a fixed
                  set (bard, ranger, sorcerer, warlock, the third casters)
     spellbook    spells added to a wizard's spellbook: {1: 6, else: 2}
     maxLevel     highest spell level it can learn at a class level
     swap         may replace one known spell each level in the class
     schools      third casters: most picks must come from these schools
     anySchoolAt  third casters: levels whose new spell may be any school
     autoCantrips cantrips the class learns for free (Mage Hand)
   Clerics, druids, paladins and artificers prepare from their whole list,
   so only their cantrips are learned here. */

function byLevel(steps){
  // steps: {fromLevel: value}; fills levels 1-20 with the latest value.
  var out = [0], cur = 0;
  for(var lv = 1; lv <= 20; lv++){
    if(steps[lv] != null) cur = steps[lv];
    out.push(cur);
  }
  return out;
}
function fullMax(lv){ return Math.min(9, Math.ceil(lv / 2)); }
function halfMax(lv){ return lv < 2 ? 0 : Math.min(5, Math.ceil(Math.ceil(lv / 2) / 2)); }
function thirdMax(lv){ return lv < 3 ? 0 : Math.min(4, Math.ceil(Math.ceil(lv / 3) / 2)); }
function pactMax(lv){ return Math.min(5, Math.ceil(lv / 2)); }

export var KNOWN_CASTERS = {
  "Bard": {list: "Bard", cantrips: byLevel({1: 2, 4: 3, 10: 4}), maxLevel: fullMax, swap: true,
    spells: [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22]},
  "Sorcerer": {list: "Sorcerer", cantrips: byLevel({1: 4, 4: 5, 10: 6}), maxLevel: fullMax, swap: true,
    spells: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]},
  "Warlock": {list: "Warlock", cantrips: byLevel({1: 2, 4: 3, 10: 4}), maxLevel: pactMax, swap: true,
    spells: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]},
  "Ranger": {list: "Ranger", cantrips: byLevel({}), maxLevel: halfMax, swap: true,
    spells: [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11]},
  "Wizard": {list: "Wizard", cantrips: byLevel({1: 3, 4: 4, 10: 5}), maxLevel: fullMax, spellbook: {1: 6, else: 2}},
  "Cleric": {list: "Cleric", cantrips: byLevel({1: 3, 4: 4, 10: 5})},
  "Druid": {list: "Druid", cantrips: byLevel({1: 2, 4: 3, 10: 4})},
  "Artificer": {list: "Artificer", cantrips: byLevel({1: 2, 10: 3, 14: 4})},
  "Paladin": {list: "Paladin", cantrips: byLevel({})}
};

var THIRD_SPELLS = [0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
/* Subclasses that cast (keyed "Class:Subclass"); they use the class level. */
export var SUBCLASS_CASTERS = {
  "Fighter:Eldritch Knight": {list: "Wizard", cantrips: byLevel({3: 2, 10: 3}), spells: THIRD_SPELLS, maxLevel: thirdMax, swap: true,
    schools: ["Abjuration", "Evocation"], anySchoolAt: [3, 8, 14, 20]},
  "Rogue:Arcane Trickster": {list: "Wizard", cantrips: byLevel({3: 3, 10: 4}), spells: THIRD_SPELLS, maxLevel: thirdMax, swap: true,
    schools: ["Enchantment", "Illusion"], anySchoolAt: [3, 8, 14, 20], autoCantrips: ["Mage Hand"]}
};

/* Bard: Magical Secrets at 10, 14 and 18 (the two new spells come from
   any class), and the College of Lore's Additional Magical Secrets at 6
   (two more from any class that don't count against spells known). */
export var MAGICAL_SECRETS_LEVELS = [10, 14, 18];
export var LORE_SECRETS = {subclass: "College of Lore", level: 6, count: 2};

/* Warlock: Mystic Arcanum, one spell of each level from 6th to 9th. */
export var MYSTIC_ARCANUM = {11: 6, 13: 7, 15: 8, 17: 9};

/* Preparing casters: how many spells they prepare each day,
   ability modifier + class level (or half it, rounded down), minimum 1. */
export var PREPARED_CASTERS = {
  "Cleric": {ability: "wis", half: false},
  "Druid": {ability: "wis", half: false},
  "Wizard": {ability: "int", half: false},
  "Paladin": {ability: "cha", half: true, from: 2},
  "Artificer": {ability: "int", half: true}
};
