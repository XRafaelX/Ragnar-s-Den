/* ---------------- Feats: Bigby Presents: Glory of the Giants ----------------
   Bigby Presents: Glory of the Giants. Strike of the Giants picks a
   strike; each level 4 feat needs the matching one.
   The fields are explained at the top of ../feats.js. */
export var GIANTS_FEATS = [
  {
    name: "Strike of the Giants",
    source: "BGG",
    option:{label:"Strike", options:["Cloud Strike","Fire Strike","Frost Strike","Hill Strike","Stone Strike","Storm Strike"], details:{
      "Cloud Strike":"The target takes an extra 1d4 thunder damage. If the target is a creature, it must succeed on a Wisdom saving throw, or you become invisible to it until the start of your next turn or until immediately after you make an attack roll or cast a spell.",
      "Fire Strike":"The target takes an extra 1d10 fire damage.",
      "Frost Strike":"The target takes an extra 1d6 cold damage. If the target is a creature, it must succeed on a Constitution saving throw, or its speed is reduced to 0 until the start of your next turn.",
      "Hill Strike":"The target takes an extra 1d6 damage of the weapon's type. If the target is a creature, it must succeed on a Strength saving throw or have the prone condition.",
      "Stone Strike":"The target takes an extra 1d6 force damage. If the target is a creature, it must succeed on a Strength saving throw or be pushed 10 feet from you in a straight line.",
      "Storm Strike":"The target takes an extra 1d6 lightning damage. If the target is a creature, it must succeed on a Constitution saving throw, or it has disadvantage on attack rolls until the start of your next turn."}},
    prerequisite: "Martial weapon proficiency or Giant Foundling background",
    category: "Combat",
    summary: "Choose a giant's strike. Once per turn when you hit with a melee or thrown weapon, you can add its extra damage and effect. You can do this a number of times equal to your proficiency bonus per long rest.",
    description: "You have absorbed primeval magic that gives you an echo of the might of giants. When you gain this feat, choose one of the benefits listed below. Once per turn, when you hit a target with a melee weapon attack or a ranged weapon attack using a thrown weapon, you can imbue the attack with an additional effect depending on the benefit you chose. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.\nIf a benefit requires a saving throw, the DC equals 8 + your proficiency bonus + your Strength or Constitution modifier (your choice).\n• Cloud Strike: an extra 1d4 thunder damage. A creature must succeed on a Wisdom save or you become invisible to it until the start of your next turn or until immediately after you make an attack roll or cast a spell.\n• Fire Strike: an extra 1d10 fire damage.\n• Frost Strike: an extra 1d6 cold damage. A creature must succeed on a Constitution save or its speed is reduced to 0 until the start of your next turn.\n• Hill Strike: an extra 1d6 damage of the weapon's type. A creature must succeed on a Strength save or fall prone.\n• Stone Strike: an extra 1d6 force damage. A creature must succeed on a Strength save or be pushed 10 feet from you in a straight line.\n• Storm Strike: an extra 1d6 lightning damage. A creature must succeed on a Constitution save or have disadvantage on attack rolls until the start of your next turn."
  },
  {
    name: "Rune Shaper",
    source: "BGG",
    castAbility:["int","wis","cha"],
    grantsSpells:["Comprehend Languages"],
    spellPick:{count:"halfPb", level:1, label:"rune", plural:"runes", tags:{
      "Fog Cloud":"Cloud rune", "Inflict Wounds":"Death rune", "Chromatic Orb":"Dragon rune", "Disguise Self":"Enemy rune",
      "Burning Hands":"Fire rune", "Speak with Animals":"Friend rune", "Armor of Agathys":"Frost rune", "Goodberry":"Hill rune",
      "Longstrider":"Journey rune", "Command":"King rune", "Entangle":"Mountain rune", "Sanctuary":"Stone rune", "Thunderwave":"Storm rune"},
      names:["Fog Cloud","Inflict Wounds","Chromatic Orb","Disguise Self","Burning Hands","Speak with Animals","Armor of Agathys","Goodberry","Longstrider","Command","Entangle","Sanctuary","Thunderwave"]},
    prerequisite: "Spellcasting feature or Rune Carver background",
    category: "Magic",
    summary: "You can cast Comprehend Languages once per long rest without a spell slot. You know a number of runes equal to half your proficiency bonus, and each rune lets you cast a 1st-level spell once per long rest.",
    description: "You've studied the magic of giant runes:\n• You learn the comprehend languages spell. You can cast it without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using any spell slots you have.\n• Rune Magic. You know a number of runes equal to half your proficiency bonus (rounded down), chosen from the Rune Spells list. Whenever you gain a level, you can replace one rune you know with a different one. When you finish a long rest, you can inscribe each rune you know onto a nonmagical weapon, armor, piece of clothing, or other object you touch. You temporarily learn the 1st-level spell that corresponds to each rune you inscribed, and you know that spell until you finish a long rest, when the rune fades.\n• While you are wearing or carrying any rune-marked object, you can cast the spells associated with its runes using any spell slots you have. You can also invoke a rune to cast its spell without a spell slot and without material components. Once you do, you can't invoke that rune again until you finish a long rest.\n• Your spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat).\nRune Spells: Cloud (fog cloud), Death (inflict wounds), Dragon (chromatic orb), Enemy (disguise self), Fire (burning hands), Friend (speak with animals), Frost (armor of Agathys), Hill (goodberry), Journey (longstrider), King (command), Mountain (entangle), Stone (sanctuary), Storm (thunderwave)."
  },
  {
    name: "Ember of the Fire Giant",
    source: "BGG",
    ability:["str","con","wis"],
    requires:{level:4, feat:"Strike of the Giants", option:"Fire Strike"},
    prerequisite: "4th level, Strike of the Giants (Fire Strike) feat",
    category: "Combat",
    summary: "Raise Strength, Constitution or Wisdom by 1. You have resistance to fire damage. You can replace one attack with a burst of flame that burns and blinds creatures within 15 feet.",
    description: "You've manifested the fiery combat emblematic of fire giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Born of Flame. You have resistance to fire damage.\n• Searing Ignition. When you take the Attack action on your turn, you can replace a single attack with a magical burst of flame. Each creature of your choice in a 15-foot-radius sphere centered on you must make a Dexterity saving throw (DC 8 + your proficiency bonus + the modifier of the ability increased by this feat). On a failed save, a creature takes fire damage equal to 1d8 + your proficiency bonus and is blinded until the start of your next turn. On a successful save, a creature takes half as much damage only. You can use Searing Ignition a number of times equal to your proficiency bonus (but no more than once per turn), and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Fury of the Frost Giant",
    source: "BGG",
    ability:["str","con","wis"],
    requires:{level:4, feat:"Strike of the Giants", option:"Frost Strike"},
    prerequisite: "4th level, Strike of the Giants (Frost Strike) feat",
    category: "Defense",
    summary: "Raise Strength, Constitution or Wisdom by 1. You have resistance to cold damage. When a creature hits you, you can use your reaction to blast it with cold and reduce its speed to 0.",
    description: "You've manifested the icy might emblematic of frost giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Born of Ice. You have resistance to cold damage.\n• Frigid Retaliation. Immediately after a creature you can see within 30 feet of you hits you with an attack roll and deals damage, you can use your reaction to retaliate with a conjured blast of ice. The creature must make a Constitution saving throw (DC 8 + your proficiency bonus + the modifier of the ability increased by this feat). On a failed save, the creature takes cold damage equal to 1d8 + your proficiency bonus, and its speed is reduced to 0 until the end of its next turn. You can use Frigid Retaliation a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Guile of the Cloud Giant",
    source: "BGG",
    ability:["str","con","cha"],
    requires:{level:4, feat:"Strike of the Giants", option:"Cloud Strike"},
    prerequisite: "4th level, Strike of the Giants (Cloud Strike) feat",
    category: "Defense",
    summary: "Raise Strength, Constitution or Charisma by 1. When a creature hits you, you can use your reaction to gain resistance to that damage and teleport up to 30 feet.",
    description: "You've manifested the confounding magic emblematic of cloud giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Charisma score by 1, to a maximum of 20.\n• Cloudy Escape. When a creature you can see hits you with an attack roll, you can use your reaction to give yourself resistance to that attack's damage. You then teleport to an unoccupied space that you can see within 30 feet of yourself. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Keenness of the Stone Giant",
    source: "BGG",
    ability:["str","con","wis"], darkvision:{range:60, add:60},
    requires:{level:4, feat:"Strike of the Giants", option:"Stone Strike"},
    prerequisite: "4th level, Strike of the Giants (Stone Strike) feat",
    category: "Combat",
    summary: "Raise Strength, Constitution or Wisdom by 1. You gain darkvision out to 60 feet, or 60 feet more if you already have it. As a bonus action you can hurl a rock that deals 1d10 force damage and can knock the target prone.",
    description: "You've manifested the physical talents emblematic of stone giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Cavernous Sight. You gain darkvision with a range of 60 feet. If you already have darkvision, its range increases by 60 feet.\n• Stone Throw. As a bonus action, you can take a rock and make a magical attack with it. The attack is a ranged spell attack with a range of 60 feet that uses the ability score you increased with this feat as the spellcasting ability. On a hit, the rock deals 1d10 force damage, and the target must succeed on a Strength saving throw (DC 8 + your proficiency bonus + the spellcasting ability modifier) or be knocked prone. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Soul of the Storm Giant",
    source: "BGG",
    ability:["str","wis","cha"],
    requires:{level:4, feat:"Strike of the Giants", option:"Storm Strike"},
    prerequisite: "4th level, Strike of the Giants (Storm Strike) feat",
    category: "Defense",
    summary: "Raise Strength, Wisdom or Charisma by 1. As a bonus action you can surround yourself with a storm aura. Until your next turn you resist lightning and thunder damage and attacks against you have disadvantage.",
    description: "You've manifested the tempestuous might emblematic of storm giants, granting you the following benefits:\n• Increase your Strength, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Maelstrom Aura. As a bonus action, you surround yourself with an aura of magical wind and lightning that extends 10 feet from you in every direction but not through total cover. The aura lasts until the start of your next turn or until you are incapacitated. While the aura is active, you have resistance to lightning and thunder damage, and attack rolls against you have disadvantage. Whenever another creature starts its turn within the aura, you can force it to make a Strength saving throw (DC 8 + your proficiency bonus + the modifier of the ability increased by this feat). On a failed save, the creature's speed is halved until the start of its next turn. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Vigor of the Hill Giant",
    source: "BGG",
    ability:["str","con","wis"],
    requires:{level:4, feat:"Strike of the Giants", option:"Hill Strike"},
    prerequisite: "4th level, Strike of the Giants (Hill Strike) feat",
    category: "Defense",
    summary: "Raise Strength, Constitution or Wisdom by 1. You can use your reaction to avoid being moved or knocked prone, and you regain extra hit points when you eat and spend Hit Dice on a short rest.",
    description: "You've manifested the resilience emblematic of hill giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Bulwark. When you are subjected to an effect that would move you at least 5 feet or knock you prone, you can use your reaction to steady yourself. You are neither moved nor knocked prone.\n• Iron Stomach. Whenever you eat food as part of a short rest and spend one or more Hit Dice to regain hit points, you regain additional hit points equal to your Constitution modifier + your proficiency bonus."
  }
];
