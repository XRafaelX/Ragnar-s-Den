/* ---------------- Feats: Dragonlance: Shadow of the Dragon Queen ----------------
   Dragonlance: Shadow of the Dragon Queen. Squire of Solamnia and
   Initiate of High Sorcery come first; the Knight and Adept feats need
   them and character level 4.
   The fields are explained at the top of ../feats.js. */
export var DRAGONLANCE_FEATS = [
  {
    name: "Squire of Solamnia",
    source: "DSotDQ",
    prerequisite: "Dragonlance campaign, and the fighter or paladin class or the Knight of Solamnia background",
    category: "Combat",
    summary: "Mounting or dismounting costs you only 5 feet of movement. Once per turn you can give a weapon attack advantage, and it deals an extra 1d8 damage if it hits.",
    description: "Your training in the ways of the Knights of Solamnia grants you these benefits:\n• Mount Up. Mounting or dismounting costs you only 5 feet of movement.\n• Precise Strike. Once per turn, when you make a weapon attack roll against a creature, you can cause the attack roll to have advantage. If the attack hits, you roll a d8 and add the number rolled as a bonus to the attack's damage roll. You can use this benefit a number of times equal to your proficiency bonus, but a use is expended only if the attack hits. You regain all expended uses when you finish a long rest."
  },
  {
    name: "Knight of the Crown",
    source: "DSotDQ",
    ability:["str","dex","con"],
    requires:{level:4, feat:"Squire of Solamnia"},
    prerequisite: "4th level, Squire of Solamnia feat",
    category: "Support",
    summary: "Raise Strength, Dexterity or Constitution by 1. As a bonus action you can order an ally within 30 feet to attack with its reaction, dealing an extra 1d8 damage on a hit.",
    description: "You are a Knight of Solamnia aligned with the Order of the Crown, a group that extols the virtues of cooperation, loyalty, and obedience. You gain these benefits:\n• Increase your Strength, Dexterity, or Constitution score by 1, to a maximum of 20.\n• Commanding Rally. As a bonus action, you can command one ally within 30 feet of yourself to attack. If that ally can see or hear you, they can immediately make one weapon attack as a reaction. If the attack hits, the ally can roll a d8 and add the number rolled as a bonus to the attack's damage roll. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Knight of the Sword",
    source: "DSotDQ",
    ability:["int","wis","cha"],
    requires:{level:4, feat:"Squire of Solamnia"},
    prerequisite: "4th level, Squire of Solamnia feat",
    category: "Combat",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. Once per turn when you hit with a weapon, the target must succeed on a Wisdom save or be frightened of you.",
    description: "You are a Knight of Solamnia aligned with the Order of the Sword, a group devoted to heroism and courage. You gain these benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Demoralizing Strike. Once per turn, when you hit a creature with a weapon attack roll, you can attempt to frighten that target. The target must make a Wisdom saving throw (DC 8 + your proficiency bonus + the modifier of the ability score increased by this feat). On a failed save, the target is frightened of you until the end of your next turn. On a successful save, the target has disadvantage on the next attack roll it makes before the end of its next turn. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Knight of the Rose",
    source: "DSotDQ",
    ability:["con","wis","cha"],
    requires:{level:4, feat:"Squire of Solamnia"},
    prerequisite: "4th level, Squire of Solamnia feat",
    category: "Support",
    summary: "Raise Constitution, Wisdom or Charisma by 1. As a bonus action you can give a creature within 30 feet temporary hit points equal to 1d8 + your proficiency bonus + the ability modifier you raised.",
    description: "You are a Knight of Solamnia aligned with the Order of the Rose, a group known for leadership, justice, and wisdom. You gain these benefits:\n• Increase your Constitution, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Bolstering Rally. As a bonus action, you can encourage one creature you can see within 30 feet of yourself (you can choose yourself). If the target can see or hear you, the target gains temporary hit points equal to 1d8 + your proficiency bonus + the ability modifier of the ability score increased by this feat. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Initiate of High Sorcery",
    source: "DSotDQ",
    option:{label:"Moon", options:["Nuitari","Lunitari","Solinari"], details:{
      "Nuitari":"The black moon. Spells: dissonant whispers, false life, hex, ray of sickness.",
      "Lunitari":"The red moon. Spells: color spray, disguise self, feather fall, longstrider.",
      "Solinari":"The white moon. Spells: comprehend languages, detect evil and good, protection from evil and good, shield."}},
    castAbility:["int","wis","cha"],
    spellPick:[
      {count:1, level:0, list:"Wizard", label:"wizard cantrip"},
      {count:2, level:1, label:"1st-level spell from your moon's list", plural:"1st-level spells from your moon's list", byOption:{
        "Nuitari":{names:["Dissonant Whispers","False Life","Hex","Ray of Sickness"]},
        "Lunitari":{names:["Color Spray","Disguise Self","Feather Fall","Longstrider"]},
        "Solinari":{names:["Comprehend Languages","Detect Evil and Good","Protection from Evil and Good","Shield"]}}}
    ],
    prerequisite: "Dragonlance campaign, and the sorcerer or wizard class or the Mage of High Sorcery background",
    category: "Magic",
    summary: "Choose one of Krynn's three moons. You learn one wizard cantrip and two of that moon's 1st-level spells, and you can cast each of those once per long rest without a spell slot.",
    description: "You've received training from magic-users affiliated with the Mages of High Sorcery. Choose one of the three moons of Krynn to influence your magic: the black moon Nuitari, the red moon Lunitari or the white moon Solinari. You learn one cantrip of your choice from the wizard spell list and two 1st-level spells based on the moon you choose:\n• Nuitari: choose two from dissonant whispers, false life, hex, and ray of sickness.\n• Lunitari: choose two from color spray, disguise self, feather fall, and longstrider.\n• Solinari: choose two from comprehend languages, detect evil and good, protection from evil and good, and shield.\nYou can cast each of the chosen 1st-level spells without a spell slot, and you must finish a long rest before you can cast them in this way again. You can also cast the spells using any spell slots you have.\nYour spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat)."
  },
  {
    name: "Adept of the Black Robes",
    source: "DSotDQ",
    castAbility:{feat:"Initiate of High Sorcery"},
    spellPick:{count:1, level:2, schools:["Enchantment","Necromancy"], label:"2nd-level enchantment or necromancy spell"},
    requires:{level:4, feat:"Initiate of High Sorcery", option:"Nuitari"},
    prerequisite: "4th level, Initiate of High Sorcery (Nuitari) feat",
    category: "Magic",
    summary: "You learn one 2nd-level enchantment or necromancy spell, which you can cast once per long rest without a spell slot. You can spend Hit Dice to add damage to a spell that a creature failed to save against.",
    description: "You chose the moon Nuitari to influence your magic, and your ambition and loyalty to the Order of the Black Robes has been recognized, granting you these benefits:\n• Ambitious Magic. You learn one 2nd-level spell of your choice. The spell must be from the enchantment or necromancy school of magic. You can cast this spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using spell slots you have of the appropriate level. The spell's spellcasting ability is the one chosen when you gained the Initiate of High Sorcery feat.\n• Life Channel. You can channel your life force into the power of your magic. When a creature you can see within 60 feet of you fails a saving throw against a spell that deals damage that you cast, you can expend a number of Hit Dice equal to the level of the spell. Roll the expended Hit Dice and add them together. The damage that the creature takes increases by an amount equal to that total."
  },
  {
    name: "Adept of the Red Robes",
    source: "DSotDQ",
    castAbility:{feat:"Initiate of High Sorcery"},
    spellPick:{count:1, level:2, schools:["Illusion","Transmutation"], label:"2nd-level illusion or transmutation spell"},
    requires:{level:4, feat:"Initiate of High Sorcery", option:"Lunitari"},
    prerequisite: "4th level, Initiate of High Sorcery (Lunitari) feat",
    category: "Magic",
    summary: "You learn one 2nd-level illusion or transmutation spell, which you can cast once per long rest without a spell slot. You can treat a d20 roll of 9 or lower on an attack or ability check as a 10.",
    description: "You chose the moon Lunitari to influence your magic, and your dedication to maintaining the balance between all things has been recognized by the Order of the Red Robes, granting you these benefits:\n• Insightful Magic. You learn one 2nd-level spell of your choice. The spell must be from the illusion or transmutation school of magic. You can cast this spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using spell slots you have of the appropriate level. The spell's spellcasting ability is the one chosen when you gained the Initiate of High Sorcery feat.\n• Magical Balance. When you make an attack roll or an ability check, you can treat a roll of 9 or lower on the d20 as a 10. You can balance fate in this way a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Adept of the White Robes",
    source: "DSotDQ",
    castAbility:{feat:"Initiate of High Sorcery"},
    spellPick:{count:1, level:2, schools:["Abjuration","Divination"], label:"2nd-level abjuration or divination spell"},
    requires:{level:4, feat:"Initiate of High Sorcery", option:"Solinari"},
    prerequisite: "4th level, Initiate of High Sorcery (Solinari) feat",
    category: "Magic",
    summary: "You learn one 2nd-level abjuration or divination spell, which you can cast once per long rest without a spell slot. You can use your reaction and a spell slot to reduce damage to you or a creature within 30 feet.",
    description: "You chose the moon Solinari to influence your magic, and your oath to use magic to make the world a better place has been recognized by the Order of the White Robes, granting you these benefits:\n• Protective Magic. You learn one 2nd-level spell of your choice. The spell must be from the abjuration or divination school of magic. You can cast this spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using spell slots you have of the appropriate level. The spell's spellcasting ability is the one chosen when you gained the Initiate of High Sorcery feat.\n• Protective Ward. When you or a creature you can see within 30 feet of you takes damage, you can use your reaction to expend a spell slot and weave protective magic around the target. Roll a number of d6s equal to the level of the spell slot expended and reduce the damage the target takes by the total rolled on those dice + your spellcasting ability modifier."
  },
  {
    name: "Divinely Favored",
    source: "DSotDQ",
    option:{label:"Alignment", options:["Good","Neutral","Evil"], details:{
      "Good":"Your 1st-level spell comes from the cleric spell list.",
      "Neutral":"Your 1st-level spell comes from the druid spell list.",
      "Evil":"Your 1st-level spell comes from the warlock spell list."}},
    castAbility:["int","wis","cha"],
    grantsSpells:["Augury"],
    spellPick:[
      {count:1, level:0, list:"Cleric", label:"cleric cantrip"},
      {count:1, level:1, label:"1st-level spell for your alignment", byOption:{
        "Good":{list:"Cleric"}, "Neutral":{list:"Druid"}, "Evil":{list:"Warlock"}}}
    ],
    requires:{level:4},
    prerequisite: "4th level, Dragonlance campaign",
    category: "Magic",
    summary: "You learn one cleric cantrip, the Augury spell and one 1st-level spell from a list set by your alignment. You can cast each of the two spells once per long rest without a spell slot.",
    description: "A god chose you to carry a spark of their power:\n• You learn one cantrip of your choice from the cleric spell list and one 1st-level spell based on the alignment of your character: a warlock spell if you are evil, a cleric spell if you are good, or a druid spell if you are neutral.\n• You also learn the augury spell.\n• You can cast the chosen 1st-level spell and the augury spell without a spell slot, and you must finish a long rest before you can cast either of these spells in this way again. You can also cast these spells using spell slots you have of the appropriate level.\n• Your spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat).\n• You can use a holy symbol as a spellcasting focus for any spell you cast that uses the spellcasting ability you choose when you select this feat."
  }
];
