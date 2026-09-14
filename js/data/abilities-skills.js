/* ---------------- Abilities & Skills data ---------------- */
export var ABILITIES = [["str","Strength"],["dex","Dexterity"],["con","Constitution"],["int","Intelligence"],["wis","Wisdom"],["cha","Charisma"]];
export var SKILLS = [
  ["Acrobatics","dex"],["Animal Handling","wis"],["Arcana","int"],["Athletics","str"],
  ["Deception","cha"],["History","int"],["Insight","wis"],["Intimidation","cha"],
  ["Investigation","int"],["Medicine","wis"],["Nature","int"],["Perception","wis"],
  ["Performance","cha"],["Persuasion","cha"],["Religion","int"],["Sleight of Hand","dex"],
  ["Stealth","dex"],["Survival","wis"]
];
export var HIT_DICE_BY_CLASS = {
  "Artificer":10,"Barbarian":12,"Bard":8,"Cleric":8,"Druid":8,"Fighter":10,"Monk":8,
  "Paladin":10,"Ranger":10,"Rogue":8,"Sorcerer":6,"Warlock":8,"Wizard":6
};
export var CLASS_LIST = Object.keys(HIT_DICE_BY_CLASS);
