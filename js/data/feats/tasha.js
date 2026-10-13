/* ---------------- Feats: Tasha's Cauldron of Everything ----------------
   Tasha's Cauldron of Everything: 15 feats.
   The fields are explained at the top of ../feats.js. */
export var TASHA_FEATS = [
  {
    name: "Fey Touched",
    source: "TCE",
    ability:["int","wis","cha"],
    grantsSpells:["Misty Step"],
    spellPick:{count:1, level:1, schools:["Divination","Enchantment"], label:"1st-level divination or enchantment spell"},
    prerequisite: "None",
    category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You learn Misty Step and one 1st-level divination or enchantment spell, and you can cast each once per long rest without a spell slot.",
    description: "Your exposure to the Feywild's magic has changed you, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You learn the misty step spell and one 1st-level spell of your choice. The 1st-level spell must be from the divination or enchantment school of magic. You can cast each of these spells without expending a spell slot. Once you cast either of these spells in this way, you can't cast that spell in this way again until you finish a long rest. You can also cast these spells using spell slots you have of the appropriate level. The spells' spellcasting ability is the ability increased by this feat."
  },
  {
    name: "Skill Expert",
    source: "TCE",
    ability:["str","dex","con","int","wis","cha"], skills:1, expertise:1,
    prerequisite: "None",
    category: "Utility",
    summary: "Raise one ability score by 1. You gain proficiency in one skill and expertise in one skill you are proficient in.",
    description: "You have honed your proficiency with particular skills:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• You gain proficiency in one skill of your choice.\n• Choose one skill in which you have proficiency. You gain expertise with that skill, which means your proficiency bonus is doubled for any ability check you make with it. The skill you choose must be one that isn't already benefiting from a feature, such as Expertise, that doubles your proficiency bonus."
  },
  {
    name: "Artificer Initiate",
    source: "TCE",
    castAbility:"int",
    spellPick:[
      {count:1, level:0, list:"Artificer", label:"artificer cantrip"},
      {count:1, level:1, list:"Artificer", label:"1st-level artificer spell"}
    ],
    toolPicks:{count:1, group:"Artisan's tools"},
    prerequisite: "None",
    category: "Magic",
    summary: "You learn one artificer cantrip and one 1st-level artificer spell, which you can cast once per long rest without a spell slot. You also gain proficiency with one type of artisan's tools.",
    description: "You've learned some of an artificer's inventiveness:\n• You learn one cantrip of your choice from the artificer spell list, and one 1st-level spell of your choice from that list. Intelligence is your spellcasting ability for these spells.\n• You can cast this feat's 1st-level spell without a spell slot, and you must finish a long rest before you can cast it this way again. You can also cast it using any spell slots you have.\n• You gain proficiency with one type of artisan's tools of your choice, and you can use that type of tool as a spellcasting focus for any spell you cast that uses Intelligence as its spellcasting ability."
  },
  {
    name: "Chef",
    source: "TCE",
    ability:["con","wis"], tools:["Cook's utensils"],
    prerequisite: "None",
    category: "Support",
    summary: "Raise Constitution or Wisdom by 1. You gain proficiency with cook's utensils. Your cooking heals an extra 1d8 hit points on a short rest, and you can make treats that give temporary hit points.",
    description: "Time spent mastering the culinary arts has paid off:\n• Increase your Constitution or Wisdom score by 1, to a maximum of 20.\n• You gain proficiency with cook's utensils if you don't already have it.\n• As part of a short rest, you can cook special food if you have ingredients and cook's utensils on hand. You can prepare enough for a number of creatures equal to 4 + your proficiency bonus. At the end of the short rest, any creature who eats the food and spends one or more Hit Dice to regain hit points regains an extra 1d8 hit points.\n• With one hour of work or when you finish a long rest, you can cook a number of treats equal to your proficiency bonus. They last 8 hours. A creature can use a bonus action to eat one and gain temporary hit points equal to your proficiency bonus."
  },
  {
    name: "Crusher",
    source: "TCE",
    ability:["str","con"],
    prerequisite: "None",
    category: "Combat",
    summary: "Raise Strength or Constitution by 1. Once per turn when you deal bludgeoning damage, you can move the target 5 feet. On a critical hit, attacks against it have advantage until your next turn.",
    description: "You are practiced in the art of crushing your enemies:\n• Increase your Strength or Constitution by 1, to a maximum of 20.\n• Once per turn, when you hit a creature with an attack that deals bludgeoning damage, you can move it 5 feet to an unoccupied space, provided the target is no more than one size larger than you.\n• When you score a critical hit that deals bludgeoning damage to a creature, attack rolls against that creature are made with advantage until the start of your next turn."
  },
  {
    name: "Eldritch Adept",
    source: "TCE",
    invocationPick:true,
    prerequisite: "Spellcasting or Pact Magic feature",
    category: "Magic",
    summary: "You learn one Eldritch Invocation from the warlock class.",
    description: "Studying occult lore, you have unlocked eldritch power within yourself: you learn one Eldritch Invocation option of your choice from the warlock class. If the invocation has a prerequisite of any kind, you can choose it only if you're a warlock who meets the prerequisite.\nWhenever you gain a level, you can replace the invocation with another one from the warlock class."
  },
  {
    name: "Fighting Initiate",
    source: "TCE",
    stylePick:true,
    prerequisite: "Proficiency with a martial weapon",
    category: "Combat",
    summary: "You learn one Fighting Style from the fighter class.",
    description: "Your martial training has helped you develop a particular style of fighting. You learn one Fighting Style option of your choice from the fighter class. If you already have a style, the one you choose must be different.\nWhenever you reach a level that grants the Ability Score Improvement feature, you can replace this feat's fighting style with another one from the fighter class that you don't have."
  },
  {
    name: "Gunner",
    source: "TCE",
    ability:["dex"], weaponProfs:["Firearms"],
    prerequisite: "None",
    category: "Combat",
    summary: "Raise Dexterity by 1. You gain proficiency with firearms, ignore their loading property, and have no disadvantage on ranged attacks next to an enemy.",
    description: "You have a quick hand and keen eye when employing firearms, granting you the following benefits:\n• Increase your Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with firearms.\n• You ignore the loading property of firearms.\n• Being within 5 feet of a hostile creature doesn't impose disadvantage on your ranged attack rolls."
  },
  {
    name: "Metamagic Adept",
    source: "TCE",
    optionPicks:{set:"metamagic", count:2},
    prerequisite: "Spellcasting or Pact Magic feature",
    category: "Magic",
    summary: "You learn two Metamagic options from the sorcerer class and gain 2 sorcery points per long rest to spend on them.",
    description: "You've learned how to exert your will on your spells to alter how they function:\n• You learn two Metamagic options of your choice from the sorcerer class. You can use only one Metamagic option on a spell when you cast it, unless the option says otherwise. Whenever you reach a level that grants the Ability Score Improvement feature, you can replace one of these options with another one from the sorcerer class.\n• You gain 2 sorcery points to spend on Metamagic (added to any sorcery points you have from another source, but usable only on Metamagic). You regain all spent sorcery points when you finish a long rest."
  },
  {
    name: "Piercer",
    source: "TCE",
    ability:["str","dex"],
    prerequisite: "None",
    category: "Combat",
    summary: "Raise Strength or Dexterity by 1. Once per turn you can reroll one damage die of a piercing attack. On a critical hit with piercing damage you roll one extra damage die.",
    description: "You have achieved a penetrating precision in combat:\n• Increase your Strength or Dexterity by 1, to a maximum of 20.\n• Once per turn, when you hit a creature with an attack that deals piercing damage, you can reroll one of the attack's damage dice, and you must use the new roll.\n• When you score a critical hit that deals piercing damage to a creature, you can roll one additional damage die when determining the extra piercing damage the target takes."
  },
  {
    name: "Poisoner",
    source: "TCE",
    tools:["Poisoner's kit"],
    prerequisite: "None",
    category: "Combat",
    summary: "You ignore resistance to poison damage, can coat a weapon with poison as a bonus action, and gain proficiency with the poisoner's kit. You can brew a potent poison that deals 2d8 poison damage and poisons the target.",
    description: "You can prepare and deliver deadly poisons:\n• When you make a damage roll, you ignore resistance to poison damage.\n• You can coat a weapon in poison as a bonus action, instead of an action.\n• You gain proficiency with the poisoner's kit if you don't already have it. With one hour of work using a poisoner's kit and expending 50 gp worth of materials, you can create a number of doses of potent poison equal to your proficiency bonus. Once applied to a weapon or piece of ammunition, the poison retains its potency for 1 minute or until you hit with the weapon or ammunition. When a creature takes damage from the coated weapon or ammunition, it must succeed on a DC 14 Constitution saving throw or take 2d8 poison damage and become poisoned until the end of your next turn."
  },
  {
    name: "Shadow Touched",
    source: "TCE",
    ability:["int","wis","cha"],
    grantsSpells:["Invisibility"],
    spellPick:{count:1, level:1, schools:["Illusion","Necromancy"], label:"1st-level illusion or necromancy spell"},
    prerequisite: "None",
    category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You learn Invisibility and one 1st-level illusion or necromancy spell, and you can cast each once per long rest without a spell slot.",
    description: "Your exposure to the Shadowfell's magic has changed you, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You learn the invisibility spell and one 1st-level spell of your choice. The 1st-level spell must be from the illusion or necromancy school of magic. You can cast each of these spells without expending a spell slot. Once you cast either of these spells in this way, you can't cast that spell in this way again until you finish a long rest. You can also cast these spells using spell slots you have of the appropriate level. The spells' spellcasting ability is the ability increased by this feat."
  },
  {
    name: "Slasher",
    source: "TCE",
    ability:["str","dex"],
    prerequisite: "None",
    category: "Combat",
    summary: "Raise Strength or Dexterity by 1. Once per turn when you deal slashing damage, you can reduce the target's speed by 10 feet. On a critical hit it has disadvantage on attacks until your next turn.",
    description: "You've learned where to cut to have the greatest results:\n• Increase your Strength or Dexterity by 1, to a maximum of 20.\n• Once per turn when you hit a creature with an attack that deals slashing damage, you can reduce the speed of the target by 10 feet until the start of your next turn.\n• When you score a critical hit that deals slashing damage to a creature, you grievously wound it. Until the start of your next turn, the target has disadvantage on all attack rolls."
  },
  {
    name: "Telekinetic",
    source: "TCE",
    ability:["int","wis","cha"],
    grantsSpells:["Mage Hand"],
    prerequisite: "None",
    category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You learn Mage Hand, which you cast without components and can make invisible. As a bonus action you can shove a creature within 30 feet 5 feet with your mind.",
    description: "You learn to move things with your mind, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You learn the mage hand cantrip. You can cast it without verbal or somatic components, and you can make the spectral hand invisible. If you already know this spell, its range increases by 30 feet when you cast it. Its spellcasting ability is the ability increased by this feat.\n• As a bonus action, you can try to telekinetically shove one creature you can see within 30 feet of you. When you do so, the target must succeed on a Strength saving throw (DC 8 + your proficiency bonus + the ability modifier of the score increased by this feat) or be moved 5 feet toward you or away from you. A creature can willingly fail this save."
  },
  {
    name: "Telepathic",
    source: "TCE",
    ability:["int","wis","cha"],
    grantsSpells:["Detect Thoughts"],
    prerequisite: "None",
    category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You can speak telepathically to a creature within 60 feet, and you can cast Detect Thoughts once per long rest without a spell slot.",
    description: "You awaken the ability to mentally connect with others, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You can speak telepathically to any creature you can see within 60 feet of you. Your telepathic utterances are in a language you know, and the creature understands you only if it knows that language. Your communication doesn't give the creature the ability to respond to you telepathically.\n• You can cast the detect thoughts spell, requiring no spell slot or components, and you must finish a long rest before you can cast it this way again. Your spellcasting ability for the spell is the ability increased by this feat. If you have spell slots of 2nd level or higher, you can cast this spell with them."
  }
];
