/* ---------------- Feats: other books ----------------
   Books with only a few feats each: Mordenkainen's Tome of Foes, Eberron:
   Rising from the Last War, Fizban's Treasury of Dragons, Strixhaven: A
   Curriculum of Chaos, The Book of Many Things and the Gunslinger fan content.
   The fields are explained at the top of ../feats.js. */
import { ELVES } from "./races.js";

export var OTHER_BOOK_FEATS = [
  /* ---- Mordenkainen's Tome of Foes ---- */
  {
    name: "Svirfneblin Magic",
    source: "MTF",
    castAbility:"int",
    grantsSpells:[{name:"Nondetection", use:"atwill"}, "Blindness/Deafness", "Blur", "Disguise Self"],
    requires:{races:["Deep Gnome (Svirfneblin)"], raceLabel:"a deep gnome"},
    prerequisite: "Gnome (deep gnome)",
    category: "Magic",
    summary: "You can cast Nondetection on yourself at will, and Blindness/Deafness, Blur and Disguise Self once each per long rest. Intelligence is your spellcasting ability for them.",
    description: "You have inherited the innate spellcasting ability of your ancestors. This ability allows you to cast nondetection on yourself at will, without needing a material component. You can also cast each of the following spells once with this ability: blindness/deafness, blur, and disguise self. You regain the ability to cast these spells when you finish a long rest. Intelligence is your spellcasting ability for these spells."
  },
  /* ---- Eberron: Rising from the Last War ---- */
  {
    name: "Aberrant Dragonmark",
    source: "ERLW",
    ability:["con"], castAbility:"con",
    spellPick:[
      {count:1, level:0, list:"Sorcerer", label:"sorcerer cantrip"},
      {count:1, level:1, list:"Sorcerer", label:"1st-level sorcerer spell", use:"short"}
    ],
    prerequisite: "No other dragonmark",
    category: "Magic",
    summary: "Raise Constitution by 1. You learn one sorcerer cantrip and one 1st-level sorcerer spell, which you can cast once per short or long rest. When you cast it, you can spend a Hit Die for a surge of magic.",
    description: "You have manifested an aberrant dragonmark. Determine its appearance and the flaw associated with it. You gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• You learn a cantrip of your choice from the sorcerer spell list. In addition, choose a 1st-level spell from the sorcerer spell list. You learn that spell and can cast it through your mark. Once you cast it, you must finish a short or long rest before you can cast it again through the mark. Constitution is your spellcasting ability for these spells.\n• When you cast the 1st-level spell through your mark, you can expend one of your Hit Dice and roll it. If you roll an even number, you gain a number of temporary hit points equal to the number rolled. If you roll an odd number, one random creature within 30 feet of you (not including you) takes force damage equal to the number rolled. If no other creatures are in range, you take the damage.\nYou also develop a random flaw from the Aberrant Dragonmark Flaws table. At your DM's option, the mark may grow in power from 10th level on."
  },
  {
    name: "Revenant Blade",
    source: "ERLW",
    ability:["dex","str"],
    requires:{races:ELVES, raceLabel:"an elf"},
    prerequisite: "Elf",
    category: "Combat",
    summary: "Raise Dexterity or Strength by 1. While you hold a double-bladed scimitar in two hands you gain +1 to AC, and the weapon counts as finesse for you.",
    description: "You are descended from a master of the double-bladed scimitar, and some of that mastery has passed on to you. You gain the following benefits:\n• Increase your Dexterity or Strength score by 1, to a maximum of 20.\n• While you are holding a double-bladed scimitar with two hands, you gain a +1 bonus to Armor Class.\n• A double-bladed scimitar has the finesse property when you wield it."
  },
  /* ---- Fizban's Treasury of Dragons ---- */
  {
    name: "Gift of the Chromatic Dragon",
    source: "FTD",
    prerequisite: "None",
    category: "Combat",
    summary: "Once per long rest you can infuse a weapon so that it deals an extra 1d4 acid, cold, fire, lightning or poison damage for 1 minute. You can also use your reaction to resist one instance of such damage.",
    description: "You've manifested some of the power of chromatic dragons, granting you the following benefits:\n• Chromatic Infusion. As a bonus action, you can touch a simple or martial weapon and infuse it with one of the following damage types: acid, cold, fire, lightning, or poison. For the next minute, the weapon deals an extra 1d4 damage of the chosen type when it hits. After you use this bonus action, you can't do so again until you finish a long rest.\n• Reactive Resistance. When you take acid, cold, fire, lightning, or poison damage, you can use your reaction to give yourself resistance to that instance of damage. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Gift of the Gem Dragon",
    source: "FTD",
    ability:["int","wis","cha"],
    prerequisite: "None",
    category: "Defense",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. When a creature within 10 feet damages you, you can use your reaction to deal 2d8 force damage to it and push it 10 feet. A Strength save halves the damage.",
    description: "You've manifested some of the power of gem dragons, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Telekinetic Reprisal. When you take damage from a creature that is within 10 feet of you, you can use your reaction to emanate telekinetic energy. The creature that dealt damage to you must make a Strength saving throw (DC 8 + your proficiency bonus + the ability modifier of the score increased by this feat). On a failed save, the creature takes 2d8 force damage and is pushed up to 10 feet away from you. On a successful save, the creature takes half as much damage and isn't pushed. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Gift of the Metallic Dragon",
    source: "FTD",
    castAbility:["int","wis","cha"],
    grantsSpells:["Cure Wounds"],
    prerequisite: "None",
    category: "Support",
    summary: "You can cast Cure Wounds once per long rest without a spell slot. You can also use your reaction to add your proficiency bonus to the AC of yourself or a creature within 5 feet against one attack.",
    description: "You've manifested some of the power of metallic dragons, granting you the following benefits:\n• Draconic Healing. You learn the cure wounds spell. You can cast this spell without expending a spell slot. Once you cast it in this way, you can't do so again until you finish a long rest. You can also cast it using spell slots you have. The spell's spellcasting ability is Intelligence, Wisdom, or Charisma when you cast it with this feat (choose when you gain the feat).\n• Protective Wings. You can manifest protective wings that can shield you or others. When you or another creature you can see within 5 feet of you is hit by an attack roll, you can use your reaction to manifest spectral wings from your back for a moment. You grant a bonus to the target's AC equal to your proficiency bonus against that attack roll, potentially causing it to miss. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  /* ---- Strixhaven: A Curriculum of Chaos ---- */
  {
    name: "Strixhaven Initiate",
    source: "SCC",
    option:{label:"College", options:["Lorehold","Prismari","Quandrix","Silverquill","Witherbloom"]},
    castAbility:["int","wis","cha"],
    spellPick:[
      {count:2, level:0, label:"cantrip from your college's list", plural:"cantrips from your college's list", byOption:{
        "Lorehold":{names:["Light","Sacred Flame","Thaumaturgy"]},
        "Prismari":{names:["Fire Bolt","Prestidigitation","Ray of Frost"]},
        "Quandrix":{names:["Druidcraft","Guidance","Mage Hand"]},
        "Silverquill":{names:["Sacred Flame","Thaumaturgy","Vicious Mockery"]},
        "Witherbloom":{names:["Chill Touch","Druidcraft","Spare the Dying"]}}},
      {count:1, level:1, label:"1st-level spell from your college's lists", byOption:{
        "Lorehold":{list:["Cleric","Wizard"]},
        "Prismari":{list:["Bard","Sorcerer"]},
        "Quandrix":{list:["Druid","Wizard"]},
        "Silverquill":{list:["Bard","Cleric"]},
        "Witherbloom":{list:["Druid","Wizard"]}}}
    ],
    prerequisite: "None",
    category: "Magic",
    summary: "Choose a Strixhaven college. You learn two of its cantrips and one 1st-level spell, which you can cast once per long rest without a spell slot.",
    description: "You have studied some magical theory and have learned a few spells associated with Strixhaven University. Choose one of Strixhaven's colleges: Lorehold, Prismari, Quandrix, Silverquill, or Witherbloom. You learn two cantrips and one 1st-level spell based on the college you choose:\n• Lorehold: two of light, sacred flame and thaumaturgy, and a 1st-level cleric or wizard spell.\n• Prismari: two of fire bolt, prestidigitation and ray of frost, and a 1st-level bard or sorcerer spell.\n• Quandrix: two of druidcraft, guidance and mage hand, and a 1st-level druid or wizard spell.\n• Silverquill: two of sacred flame, thaumaturgy and vicious mockery, and a 1st-level bard or cleric spell.\n• Witherbloom: two of chill touch, druidcraft and spare the dying, and a 1st-level druid or wizard spell.\nYou can cast the chosen 1st-level spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast the spell using any spell slots you have.\nYour spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat)."
  },
  {
    name: "Strixhaven Mascot",
    source: "SCC",
    grantsSpells:[{name:"Find Familiar", use:"ritual"}],
    requires:{level:4, feat:"Strixhaven Initiate"},
    prerequisite: "4th level, Strixhaven Initiate feat",
    category: "Magic",
    summary: "You can cast Find Familiar as a ritual to summon your college's mascot. It can attack in place of one of your attacks, and you can swap places with it.",
    description: "You have learned how to summon a Strixhaven mascot to assist you, granting you these benefits:\n• You can cast the find familiar spell as a ritual. Your familiar can take the form of the mascot associated with the college you chose for the Strixhaven Initiate feat: a spirit statue (Lorehold), an art elemental (Prismari), a fractal (Quandrix), an inkling (Silverquill), or a pest (Witherbloom).\n• When you take the Attack action on your turn, you can forgo one attack to allow your mascot familiar to make one attack of its own with its reaction.\n• If your mascot familiar is within 60 feet of you, you can teleport as an action, swapping places with the familiar. If your destination space is too small for you to occupy, the teleportation fails and is wasted. Once you teleport in this way, you can't do so again until you finish a long rest, unless you expend a spell slot of 2nd level or higher to do it again."
  },
  /* ---- The Book of Many Things ---- */
  {
    name: "Cartomancer",
    source: "BMT",
    grantsSpells:["Prestidigitation"],
    requires:{level:4},
    prerequisite: "4th level, Spellcasting feature",
    category: "Magic",
    summary: "You learn Prestidigitation and can use it for card tricks. After a long rest you can store a spell in a card and cast it later as a bonus action.",
    description: "You have learned to channel your magic through a deck of cards, which you can use as a spellcasting focus. You gain the following benefits:\n• Card Tricks. You learn the prestidigitation cantrip and can use it to create illusions that duplicate the effects of stage magic. When you use a card deck as your focus, you can conceal the verbal and somatic components of the cantrip in ordinary conversation and card handling.\n• Hidden Ace. When you finish a long rest, you can choose one spell from your class's spell list and imbue that spell into a card. The spell must have a casting time of 1 action, and it must be of a level for which you have spell slots. The card stays imbued for 8 hours. While you hold it, you can use a bonus action to flourish the card and cast the spell within. The card then loses its magic."
  },
  /* ---- Gunslinger (fan content) ---- */
  {
    name: "Sidearm Mastery",
    source: "GUN",
    ability:["dex"],
    prerequisite: "Proficiency in firearms",
    category: "Combat",
    summary: "Raise Dexterity by 1. You gain +2 to damage rolls with a firearm held in one hand while you wield no other weapon.",
    description: "You have mastered the use of small firearms and gain the following benefits:\n• Increase your Dexterity score by 1, to a maximum of 20.\n• When you are wielding a firearm in one hand and no other weapons, you gain a +2 bonus to damage rolls with that firearm. (Already added to your damage on the Inventory tab.)"
  }
];
