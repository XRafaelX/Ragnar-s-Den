/* ---------------- Feats: Xanathar's Guide to Everything ----------------
   Xanathar's Guide to Everything: the 15 racial feats. `requires.races`
   keeps each to its race in the pickers.
   The fields are explained at the top of ../feats.js. */
import { HALFLINGS, DWARVES, GNOMES, ELVES, HALF_ELVES, HALF_ORCS, HUMANS, TIEFLINGS, DRAGONBORN_RACES } from "./races.js";

export var XANATHAR_FEATS = [
  {
    name: "Bountiful Luck",
    source: "XGE",
    requires:{races:HALFLINGS, raceLabel:"a halfling"},
    prerequisite: "Halfling",
    category: "Support",
    summary: "When an ally within 30 feet rolls a 1 on an attack roll, ability check or saving throw, you can use your reaction to let it reroll.",
    description: "Your people have extraordinary luck, which you have learned to lend to your companions. When an ally you can see within 30 feet of you rolls a 1 on the d20 for an attack roll, an ability check, or a saving throw, you can use your reaction to let the ally reroll the die. The ally must use the new roll.\nWhen you use this ability, you can't use your Lucky racial trait before the end of your next turn."
  },
  {
    name: "Dragon Fear",
    source: "XGE",
    ability:["str","con","cha"],
    requires:{races:DRAGONBORN_RACES, raceLabel:"a dragonborn"},
    prerequisite: "Dragonborn",
    category: "Combat",
    summary: "Raise Strength, Constitution or Charisma by 1. You can spend a use of your Breath Weapon to roar instead, frightening creatures of your choice within 30 feet.",
    description: "When angered, you radiate menace. You gain the following benefits:\n• Increase your Strength, Constitution, or Charisma score by 1, to a maximum of 20.\n• Instead of exhaling destructive energy, you can expend a use of your Breath Weapon trait to roar, forcing each creature of your choice within 30 feet of you to make a Wisdom saving throw (DC 8 + your proficiency bonus + your Charisma modifier). A target automatically succeeds if it can't hear or see you. On a failed save, a target becomes frightened of you for 1 minute. If the frightened target takes any damage, it can repeat the saving throw, ending the effect on itself on a success."
  },
  {
    name: "Dragon Hide",
    source: "XGE",
    ability:["str","con","cha"], unarmoredAc:13,
    requires:{races:DRAGONBORN_RACES, raceLabel:"a dragonborn"},
    prerequisite: "Dragonborn",
    category: "Defense",
    summary: "Raise Strength, Constitution or Charisma by 1. Without armor, your AC is 13 + your Dexterity modifier. You grow claws that deal 1d4 + your Strength modifier slashing damage.",
    description: "You manifest scales and claws reminiscent of your draconic ancestors. You gain the following benefits:\n• Increase your Strength, Constitution, or Charisma score by 1, to a maximum of 20.\n• Your scales harden. While you aren't wearing armor, you can calculate your AC as 13 + your Dexterity modifier. You can use a shield and still gain this benefit.\n• You grow retractable claws from the tips of your fingers. Extending or retracting the claws requires no action. The claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the normal bludgeoning damage for an unarmed strike."
  },
  {
    name: "Drow High Magic",
    source: "XGE",
    castAbility:"cha",
    grantsSpells:[{name:"Detect Magic", use:"atwill"}, "Levitate", "Dispel Magic"],
    requires:{races:["Dark Elf (Drow)"], raceLabel:"a drow"},
    prerequisite: "Elf (drow)",
    category: "Magic",
    summary: "You can cast Detect Magic at will, and Levitate and Dispel Magic once each per long rest. Charisma is your spellcasting ability for them.",
    description: "You learn more of the magic typical of dark elves. You learn the detect magic spell and can cast it at will, without expending a spell slot. You also learn levitate and dispel magic, each of which you can cast once without expending a spell slot. You regain the ability to cast those two spells in this way when you finish a long rest. Charisma is your spellcasting ability for all three spells."
  },
  {
    name: "Dwarven Fortitude",
    source: "XGE",
    ability:["con"],
    requires:{races:DWARVES, raceLabel:"a dwarf"},
    prerequisite: "Dwarf",
    category: "Defense",
    summary: "Raise Constitution by 1. When you take the Dodge action, you can spend one Hit Die to heal yourself.",
    description: "You have the blood of dwarf heroes flowing through your veins. You gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• Whenever you take the Dodge action in combat, you can spend one Hit Die to heal yourself. Roll the die, add your Constitution modifier, and regain a number of hit points equal to the total (minimum of 1)."
  },
  {
    name: "Elven Accuracy",
    source: "XGE",
    ability:["dex","int","wis","cha"],
    requires:{races:ELVES.concat(HALF_ELVES), raceLabel:"an elf or half-elf"},
    prerequisite: "Elf or half-elf",
    category: "Combat",
    summary: "Raise Dexterity, Intelligence, Wisdom or Charisma by 1. When you attack with advantage using one of those abilities, you can reroll one of the dice.",
    description: "The accuracy of elves is legendary. You gain the following benefits:\n• Increase your Dexterity, Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Whenever you have advantage on an attack roll using Dexterity, Intelligence, Wisdom, or Charisma, you can reroll one of the dice once."
  },
  {
    name: "Fade Away",
    source: "XGE",
    ability:["dex","int"],
    requires:{races:GNOMES, raceLabel:"a gnome"},
    prerequisite: "Gnome",
    category: "Defense",
    summary: "Raise Dexterity or Intelligence by 1. When you take damage, you can use your reaction to turn invisible until the end of your next turn, once per short or long rest.",
    description: "Your people are clever, with a knack for illusion magic. You have learned a magical trick for fading away when you suffer harm. You gain the following benefits:\n• Increase your Dexterity or Intelligence score by 1, to a maximum of 20.\n• Immediately after you take damage, you can use a reaction to magically become invisible until the end of your next turn or until you attack, deal damage, or force someone to make a saving throw. Once you use this ability, you can't do so again until you finish a short or long rest."
  },
  {
    name: "Fey Teleportation",
    source: "XGE",
    ability:["int","cha"], castAbility:"int",
    languages:["Sylvan"],
    grantsSpells:[{name:"Misty Step", use:"short"}],
    requires:{races:["High Elf"], raceLabel:"a high elf"},
    prerequisite: "Elf (high)",
    category: "Magic",
    summary: "Raise Intelligence or Charisma by 1. You learn Sylvan, and you can cast Misty Step once per short or long rest without a spell slot.",
    description: "Your study of high elven lore has unlocked fey power that few other elves possess, except your eladrin cousins. You gain the following benefits:\n• Increase your Intelligence or Charisma score by 1, to a maximum of 20.\n• You learn to speak, read, and write Sylvan.\n• You learn the misty step spell and can cast it once without expending a spell slot. You regain the ability to cast it in this way when you finish a short or long rest. Intelligence is your spellcasting ability for this spell."
  },
  {
    name: "Flames of Phlegethos",
    source: "XGE",
    ability:["int","cha"],
    requires:{races:TIEFLINGS, raceLabel:"a tiefling"},
    prerequisite: "Tiefling",
    category: "Magic",
    summary: "Raise Intelligence or Charisma by 1. You reroll any 1 on the fire damage dice of your spells. When you cast a fire spell, flames can wreathe you and burn creatures that hit you in melee for 1d4.",
    description: "You learn to call on hellfire to serve your commands. You gain the following benefits:\n• Increase your Intelligence or Charisma score by 1, to a maximum of 20.\n• When you roll fire damage for a spell you cast, you can reroll any roll of 1 on the fire damage dice, but you must use the new roll, even if it is another 1.\n• Whenever you cast a spell that deals fire damage, you can cause flames to wreathe you until the end of your next turn. The flames don't harm you or your possessions, and they shed bright light out to 30 feet and dim light for an additional 30 feet. While the flames are present, any creature within 5 feet of you that hits you with a melee attack takes 1d4 fire damage."
  },
  {
    name: "Infernal Constitution",
    source: "XGE",
    ability:["con"],
    requires:{races:TIEFLINGS, raceLabel:"a tiefling"},
    prerequisite: "Tiefling",
    category: "Defense",
    summary: "Raise Constitution by 1. You have resistance to cold and poison damage and advantage on saves against being poisoned.",
    description: "Fiendish blood runs strong in you, unlocking a resilience akin to that possessed by some fiends. You gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• You have resistance to cold damage and poison damage.\n• You have advantage on saving throws against being poisoned."
  },
  {
    name: "Orcish Fury",
    source: "XGE",
    ability:["str","con"],
    requires:{races:HALF_ORCS, raceLabel:"a half-orc"},
    prerequisite: "Half-orc",
    category: "Combat",
    summary: "Raise Strength or Constitution by 1. Once per short or long rest, a weapon hit deals one extra damage die. After you use Relentless Endurance, you can use your reaction to make a weapon attack.",
    description: "Your inner fury burns tirelessly. You gain the following benefits:\n• Increase your Strength or Constitution score by 1, to a maximum of 20.\n• When you hit with an attack using a simple or martial weapon, you can roll one of the weapon's damage dice an additional time and add it as extra damage of the weapon's damage type. Once you use this ability, you can't use it again until you finish a short or long rest.\n• Immediately after you use your Relentless Endurance trait, you can use your reaction to make one weapon attack."
  },
  {
    name: "Prodigy",
    source: "XGE",
    skills:1, toolPicks:{count:1}, languagePicks:1, expertise:1,
    requires:{races:HALF_ELVES.concat(HALF_ORCS, HUMANS), raceLabel:"a half-elf, half-orc or human"},
    prerequisite: "Half-elf, half-orc, or human",
    category: "Utility",
    summary: "You gain proficiency in one skill and one tool, learn one language, and gain expertise in one skill you are proficient in.",
    description: "You have a knack for learning new things. You gain the following benefits:\n• You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.\n• Choose one skill in which you have proficiency. You gain expertise with that skill, which means your proficiency bonus is doubled for any ability check you make with it. The skill you choose must be one that isn't already benefiting from a feature, such as Expertise, that doubles your proficiency bonus."
  },
  {
    name: "Second Chance",
    source: "XGE",
    ability:["dex","con","cha"],
    requires:{races:HALFLINGS, raceLabel:"a halfling"},
    prerequisite: "Halfling",
    category: "Defense",
    summary: "Raise Dexterity, Constitution or Charisma by 1. When a creature hits you, you can use your reaction to make it reroll the attack, once per fight or rest.",
    description: "Fortune favors you when someone tries to strike you. You gain the following benefits:\n• Increase your Dexterity, Constitution, or Charisma score by 1, to a maximum of 20.\n• When a creature you can see hits you with an attack roll, you can use your reaction to force that creature to reroll. Once you use this ability, you can't use it again until you roll initiative at the start of combat or until you finish a short or long rest."
  },
  {
    name: "Squat Nimbleness",
    source: "XGE",
    ability:["str","dex"], speed:5, skills:1, skillOptions:["Acrobatics","Athletics"],
    requires:{races:DWARVES, size:"Small", raceLabel:"a dwarf or a Small race"},
    prerequisite: "Dwarf or a Small race",
    category: "Movement",
    summary: "Raise Strength or Dexterity by 1. Your walking speed increases by 5 feet, you gain proficiency in Acrobatics or Athletics, and you have advantage on checks to escape a grapple.",
    description: "You are uncommonly nimble for your race. You gain the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Increase your walking speed by 5 feet.\n• You gain proficiency in the Acrobatics or Athletics skill (your choice).\n• You have advantage on any Strength (Athletics) or Dexterity (Acrobatics) check you make to escape from being grappled."
  },
  {
    name: "Wood Elf Magic",
    source: "XGE",
    castAbility:"wis",
    spellPick:{count:1, level:0, list:"Druid", label:"druid cantrip"},
    grantsSpells:["Longstrider", "Pass without Trace"],
    requires:{races:["Wood Elf"], raceLabel:"a wood elf"},
    prerequisite: "Elf (wood)",
    category: "Magic",
    summary: "You learn one druid cantrip, and you can cast Longstrider and Pass without Trace once each per long rest. Wisdom is your spellcasting ability for them.",
    description: "You learn the magic of the primeval woods, which are revered and protected by your people. You learn one druid cantrip of your choice. You also learn the longstrider and pass without trace spells, each of which you can cast once without expending a spell slot. You regain the ability to cast these two spells in this way when you finish a long rest. Wisdom is your spellcasting ability for all three spells."
  }
];
