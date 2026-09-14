(function(){
"use strict";

/* ---------------- Data & constants ---------------- */
var STORAGE_KEY = "ragnarsDen.characters.v1";
var ABILITIES = [["str","Strength"],["dex","Dexterity"],["con","Constitution"],["int","Intelligence"],["wis","Wisdom"],["cha","Charisma"]];
var SKILLS = [
  ["Acrobatics","dex"],["Animal Handling","wis"],["Arcana","int"],["Athletics","str"],
  ["Deception","cha"],["History","int"],["Insight","wis"],["Intimidation","cha"],
  ["Investigation","int"],["Medicine","wis"],["Nature","int"],["Perception","wis"],
  ["Performance","cha"],["Persuasion","cha"],["Religion","int"],["Sleight of Hand","dex"],
  ["Stealth","dex"],["Survival","wis"]
];
var HIT_DICE_BY_CLASS = {
  "Artificer":10,"Barbarian":12,"Bard":8,"Cleric":8,"Druid":8,"Fighter":10,"Monk":8,
  "Paladin":10,"Ranger":10,"Rogue":8,"Sorcerer":6,"Warlock":8,"Wizard":6
};
var CLASS_LIST = Object.keys(HIT_DICE_BY_CLASS);

var RACES = {
  "Standard (SRD)": [
    "Human","Hill Dwarf","Mountain Dwarf","High Elf","Wood Elf","Dark Elf (Drow)",
    "Lightfoot Halfling","Stout Halfling","Dragonborn","Rock Gnome","Forest Gnome",
    "Half-Elf","Half-Orc","Tiefling"
  ],
  "Expanded": [
    "Aarakocra","Aasimar","Bugbear","Centaur","Changeling","Deep Gnome (Svirfneblin)",
    "Duergar","Eladrin","Fairy","Firbolg","Genasi (Air)","Genasi (Earth)","Genasi (Fire)",
    "Genasi (Water)","Gith (Githyanki)","Gith (Githzerai)","Goblin","Goliath","Harengon",
    "Hobgoblin","Kenku","Kobold","Lizardfolk","Loxodon","Minotaur","Orc","Satyr",
    "Sea Elf","Shadar-kai","Shifter","Simic Hybrid","Tabaxi","Thri-kreen","Tortle",
    "Triton","Vedalken","Verdan","Warforged","Yuan-ti Pureblood"
  ]
};

var BACKGROUNDS = {
  "Standard (SRD)": ["Acolyte"],
  "Expanded": [
    "Charlatan","Criminal","Entertainer","Folk Hero","Guild Artisan","Guild Merchant",
    "Hermit","Noble","Outlander","Sage","Sailor","Soldier","Urchin","Anthropologist",
    "Archaeologist","City Watch","Clan Crafter","Cloistered Scholar","Courtier",
    "Faction Agent","Far Traveler","Inheritor","Knight of the Order","Mercenary Veteran",
    "Urban Bounty Hunter","Uthgardt Tribe Member","Waterdhavian Noble"
  ]
};

var ALIGNMENTS = {
  "Alignment": [
    "Lawful Good","Neutral Good","Chaotic Good",
    "Lawful Neutral","True Neutral","Chaotic Neutral",
    "Lawful Evil","Neutral Evil","Chaotic Evil"
  ]
};

/* ---------------- Character Creation Wizard data ----------------
   Only Barbarian has a fully guided creation experience right now.
   The other classes appear (with a one-line blurb) so the class list
   reads as complete, but are marked unavailable until they're built
   out the same way. */
var CLASS_BLURBS = {
  "Artificer":"Half-caster inventor who infuses magic into gadgets and tools.",
  "Barbarian":"A fierce melee fighter who channels primal rage for huge damage and toughness.",
  "Bard":"A versatile spellcaster and skill-monkey who inspires allies with music and magic.",
  "Cleric":"A divine spellcaster channeling a deity's power to heal and smite.",
  "Druid":"A nature spellcaster who can shapeshift into animals and command the elements.",
  "Fighter":"A master of weapons and armor with the most versatile combat options.",
  "Monk":"A martial artist who fights unarmed with supernatural speed and ki.",
  "Paladin":"A holy warrior blending heavy armor combat with divine spells and oaths.",
  "Ranger":"A wilderness warrior blending archery or melee with nature magic.",
  "Rogue":"A stealthy skill expert who deals massive damage with Sneak Attack.",
  "Sorcerer":"An innate spellcaster whose magic comes from a magical bloodline.",
  "Warlock":"A spellcaster who's struck a bargain with a powerful otherworldly patron.",
  "Wizard":"A studious spellcaster with the largest spell list, learned from a spellbook."
};

var SPELLCASTER_CLASSES = ["Artificer","Bard","Cleric","Druid","Paladin","Ranger","Sorcerer","Warlock","Wizard"];

var CLASSES_INFO = {};
CLASS_LIST.forEach(function(name){
  CLASSES_INFO[name] = { available:false, blurb: CLASS_BLURBS[name] || "", spellcaster: SPELLCASTER_CLASSES.indexOf(name)!==-1, features:[] };
});

CLASSES_INFO["Barbarian"] = {
  available:true,
  blurb: CLASS_BLURBS["Barbarian"],
  primaryAbility:"str",
  savingThrows:["str","con"],
  spellcaster:false,
  skillChoices:{count:2, options:["Animal Handling","Athletics","Intimidation","Nature","Perception","Survival"]},
  features:[
    {name:"Rage", text:"Bonus action to enter a rage for 1 minute: +2 damage on Strength melee attacks, resistance to bludgeoning/piercing/slashing damage, advantage on Strength checks and saves. Regained on a long rest."},
    {name:"Unarmored Defense", text:"While wearing no armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can still use a shield and gain this benefit."}
  ],
  equipment:{
    choiceGroups:[
      {options:[
        {key:"greataxe", label:"Greataxe", detail:"1d12 slashing damage, heavy, two-handed", items:[{name:"Greataxe",qty:1,weight:7,notes:"1d12 slashing, heavy, two-handed"}]},
        {key:"martial", label:"Any other martial melee weapon", detail:"Pick the specific weapon once you're on the sheet", items:[{name:"Martial melee weapon",qty:1,weight:6,notes:"choose specific weapon"}]}
      ]},
      {options:[
        {key:"handaxes", label:"Two handaxes", detail:"1d6 slashing, light, thrown (range 20/60 ft)", items:[{name:"Handaxe",qty:2,weight:2,notes:"1d6 slashing, light, thrown 20/60"}]},
        {key:"simple", label:"Any simple weapon", detail:"Pick the specific weapon once you're on the sheet", items:[{name:"Simple weapon",qty:1,weight:4,notes:"choose specific weapon"}]}
      ]}
    ],
    fixed:[
      {name:"Explorer's Pack", qty:1, weight:59, notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"},
      {name:"Javelin", qty:4, weight:2}
    ]
  }
};

CLASSES_INFO["Fighter"].features = [
  {name:"Fighting Style", text:"Adopt a particular style of fighting as your specialty (e.g. Archery, Defense, Dueling, Great Weapon Fighting, Protection, Two-Weapon Fighting)."},
  {name:"Second Wind", text:"Bonus action to regain hit points equal to 1d10 + your fighter level (once per short or long rest)."}
];

CLASSES_INFO["Rogue"].features = [
  {name:"Expertise", text:"Double your proficiency bonus for two of your skill proficiencies (or one skill and thieves' tools)."},
  {name:"Sneak Attack", text:"Deal extra 1d6 damage once per turn to a creature you hit if you have advantage or an ally is within 5 feet of the target."},
  {name:"Thieves' Cant", text:"A secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation."}
];

CLASSES_INFO["Wizard"].features = [
  {name:"Spellcasting", text:"Prepare and cast spells from your spellbook using Intelligence. Can cast ritual spells from your spellbook."},
  {name:"Arcane Recovery", text:"Once per day during a short rest, recover expended spell slots with combined level up to half your wizard level."}
];

CLASSES_INFO["Cleric"].features = [
  {name:"Spellcasting", text:"Cast divine spells channeled from your deity using Wisdom as your spellcasting ability."},
  {name:"Divine Domain", text:"Chosen religious domain granting domain spells and bonus domain features."}
];

CLASSES_INFO["Paladin"].features = [
  {name:"Divine Sense", text:"Action to detect the location of any celestial, fiend, or undead within 60 feet, as well as consecrated/desecrated places."},
  {name:"Lay on Hands", text:"Pool of healing power equal to Paladin level x 5. Touch a creature to restore HP or spend 5 HP to cure disease/poison."}
];

CLASSES_INFO["Bard"].features = [
  {name:"Spellcasting", text:"Cast spells fueled by the music of creation using Charisma."},
  {name:"Bardic Inspiration", text:"Bonus action to grant a d6 inspiration die to an ally within 60 feet for checks, attacks, or saves."}
];

CLASSES_INFO["Druid"].features = [
  {name:"Druidic", text:"You know Druidic, the secret language of druids, and can leave hidden messages."},
  {name:"Spellcasting", text:"Cast nature spells fueled by the primal power of nature using Wisdom."}
];

CLASSES_INFO["Monk"].features = [
  {name:"Unarmored Defense", text:"While wearing no armor and no shield, AC equals 10 + DEX modifier + WIS modifier."},
  {name:"Martial Arts", text:"Use DEX for unarmed strikes and monk weapons (1d4 damage). Bonus action unarmed strike after Attack action."}
];

CLASSES_INFO["Ranger"].features = [
  {name:"Favored Enemy", text:"Advantage on Survival checks to track favored enemies, and Intelligence checks to recall information about them."},
  {name:"Natural Explorer", text:"Benefits when traveling, tracking, and foraging in your chosen favored terrain."}
];

CLASSES_INFO["Sorcerer"].features = [
  {name:"Spellcasting", text:"Cast innate magic using Charisma as your spellcasting ability."},
  {name:"Sorcerous Origin", text:"Innate magical bloodline or source that shapes your powers and grants origin traits."}
];

CLASSES_INFO["Warlock"].features = [
  {name:"Otherworldly Patron", text:"Pact struck with an otherworldly entity granting unique patron spells and features."},
  {name:"Pact Magic", text:"Cast warlock spells using Charisma. All spell slots are of the highest available level and recharge on a short rest."}
];

CLASSES_INFO["Artificer"].features = [
  {name:"Magical Tinkering", text:"Invest a spark of magic into mundane tiny objects (light, recorded sound, odor, or visual effect)."},
  {name:"Spellcasting", text:"Cast spells by using tools as focuses, with Intelligence as your spellcasting ability."}
];

/* ---------------- Feats Catalog (Standard 5e SRD) ---------------- */
var FEATS_CATALOG = [
  {
    name: "Alert",
    prerequisite: "None",
    category: "Combat",
    summary: "+5 initiative, cannot be surprised while conscious, enemies gain no advantage from being unseen.",
    description: "Always on the lookout for danger, you gain the following benefits:\n• You gain a +5 bonus to initiative.\n• You can't be surprised while you are conscious.\n• Other creatures don’t gain advantage on attack rolls against you as a result of being unseen by you."
  },
  {
    name: "Athlete",
    prerequisite: "None",
    category: "Physical",
    summary: "+1 STR/DEX, stand up with 5ft movement, climbing uses no extra movement, running jumps need only 5ft.",
    description: "You have undergone extensive physical training to gain the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• When you are prone, standing up uses only 5 feet of your movement.\n• Climbing doesn't cost you extra movement.\n• You can make a running long jump or a running high jump after moving only 5 feet on foot."
  },
  {
    name: "Actor",
    prerequisite: "None",
    category: "Social",
    summary: "+1 CHA, advantage on Deception/Performance when impersonating, mimic speech and sounds.",
    description: "Skilled at mimicry and dramatics, you gain the following benefits:\n• Increase your Charisma score by 1, to a maximum of 20.\n• You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person.\n• You can mimic the speech of another person or the sounds made by other creatures that you have heard for at least 1 minute."
  },
  {
    name: "Charger",
    prerequisite: "None",
    category: "Combat",
    summary: "Bonus action melee attack or shove after Dashing, with +5 damage or 10ft push.",
    description: "When you use your action to Dash, you can use a bonus action to make one melee weapon attack or to shove a creature.\nIf you move at least 10 feet in a straight line immediately before taking this bonus action, you either gain a +5 bonus to the attack's damage roll (if you hit with a melee attack) or push the target up to 10 feet away from you (if you succeed on the shove)."
  },
  {
    name: "Crossbow Expert",
    prerequisite: "None",
    category: "Combat",
    summary: "Ignore loading quality, no disadvantage on ranged attacks in close combat, bonus action hand crossbow attack.",
    description: "Thanks to extensive practice with crossbows, you gain the following benefits:\n• You ignore the loading quality of crossbows with which you are proficient.\n• Being within 5 feet of a hostile creature doesn’t impose disadvantage on your ranged attack rolls.\n• When you use the Attack action and attack with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding."
  },
  {
    name: "Defensive Duelist",
    prerequisite: "Dexterity 13 or higher",
    category: "Defense",
    summary: "Use reaction to add proficiency bonus to AC against a melee attack while wielding a finesse weapon.",
    description: "When you are wielding a finesse weapon with which you are proficient and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing the attack to miss you."
  },
  {
    name: "Dual Wielder",
    prerequisite: "None",
    category: "Combat",
    summary: "+1 AC while dual wielding, use non-light weapons for two-weapon fighting, draw/stow two weapons.",
    description: "You master fighting with two weapons, gaining the following benefits:\n• You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand.\n• You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren’t light.\n• You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one."
  },
  {
    name: "Dungeon Delver",
    prerequisite: "None",
    category: "Utility",
    summary: "Advantage to find secret doors, advantage vs traps, resistance to trap damage, search at normal pace.",
    description: "Alert to the hidden traps and secret doors found in dungeons, you gain the following benefits:\n• You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks made to detect the presence of secret doors.\n• You have advantage on saving throws made to avoid or resist traps.\n• You have resistance to the damage dealt by traps.\n• Traveling at a fast pace doesn't impose the normal -5 penalty on your passive Wisdom (Perception) score."
  },
  {
    name: "Durable",
    prerequisite: "None",
    category: "Defense",
    summary: "+1 CON, minimum HP regained from rolling a Hit Die is 2x your CON modifier (minimum 2).",
    description: "Hardy and resilient, you gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• When you roll a Hit Die to regain hit points, the minimum number of hit points you regain from the roll equals twice your Constitution modifier (minimum of 2)."
  },
  {
    name: "Elemental Adept",
    prerequisite: "Spellcasting feature",
    category: "Magic",
    summary: "Spells ignore resistance to a chosen element; treat 1s on damage dice as 2s.",
    description: "When you gain this feat, choose one damage type: acid, cold, fire, lightning, or thunder.\n• Spells you cast ignore resistance to damage of the chosen type.\n• In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2."
  },
  {
    name: "Grappler",
    prerequisite: "Strength 13 or higher",
    category: "Combat",
    summary: "Advantage on attack rolls against creatures you grapple, can attempt to pin grappled creatures.",
    description: "You’ve developed the skills necessary to hold your own in close-quarters grappling:\n• You have advantage on attack rolls against a creature you are grappling.\n• You can use your action to try to pin a creature grappled by you. To do so, make another grapple check. If you succeed, you and the creature are both restrained until the grapple ends."
  },
  {
    name: "Great Weapon Master",
    prerequisite: "None",
    category: "Combat",
    summary: "Bonus action attack on crit/kill, take -5 to hit with heavy weapon for +10 damage.",
    description: "You’ve learned to put the weight of a weapon to your advantage:\n• On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action.\n• Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack’s damage."
  },
  {
    name: "Healer",
    prerequisite: "None",
    category: "Support",
    summary: "Use healer's kit to stabilize at 1 HP, or restore 1d6 + 4 + max Hit Dice HP once per rest per creature.",
    description: "You are an able physician, allowing you to mend wounds quickly and get your allies back in the fight:\n• When you use a healer’s kit to stabilize a dying creature, that creature also regains 1 hit point.\n• As an action, you can spend one use of a healer’s kit to tend to a creature and restore 1d6 + 4 hit points to it, plus additional hit points equal to the creature’s maximum number of Hit Dice. The creature can’t regain hit points from this feat again until it finishes a short or long rest."
  },
  {
    name: "Heavily Armored",
    prerequisite: "Proficiency with medium armor",
    category: "Defense",
    summary: "+1 STR, gain proficiency with heavy armor.",
    description: "You have trained to master the use of heavy armor, gaining the following benefits:\n• Increase your Strength score by 1, to a maximum of 20.\n• You gain proficiency with heavy armor."
  },
  {
    name: "Heavy Armor Master",
    prerequisite: "Proficiency with heavy armor",
    category: "Defense",
    summary: "+1 STR, reduce nonmagical bludgeoning, piercing, and slashing damage by 3 while wearing heavy armor.",
    description: "You can use your armor to deflect strikes that would kill others:\n• Increase your Strength score by 1, to a maximum of 20.\n• While you are wearing heavy armor, bludgeoning, piercing, and slashing damage that you take from nonmagical attacks is reduced by 3."
  },
  {
    name: "Inspiring Leader",
    prerequisite: "Charisma 13 or higher",
    category: "Support",
    summary: "Spend 10 minutes inspiring up to 6 allies to grant temporary HP equal to level + CHA mod.",
    description: "You can spend 10 minutes inspiring your companions, shoring up their resolve to fight. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you who can see or hear you and who can understand you. Each creature gains temporary hit points equal to your level + your Charisma modifier (once per rest per creature)."
  },
  {
    name: "Keen Mind",
    prerequisite: "None",
    category: "Utility",
    summary: "+1 INT, always know north and time until sunrise/sunset, perfectly recall past month.",
    description: "You have a mind that can track time, direction, and detail with uncanny precision:\n• Increase your Intelligence score by 1, to a maximum of 20.\n• You always know which way is north.\n• You always know the number of hours left before the next sunrise or sunset.\n• You can accurately recall anything you have seen or heard within the past month."
  },
  {
    name: "Lightly Armored",
    prerequisite: "None",
    category: "Defense",
    summary: "+1 STR or DEX, gain proficiency with light armor.",
    description: "You have trained to master the use of light armor, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with light armor."
  },
  {
    name: "Lucky",
    prerequisite: "None",
    category: "General",
    summary: "3 luck points per long rest to roll an extra d20 on attacks, checks, saves, or enemy attacks against you.",
    description: "You have inexplicable luck that seems to kick in at just the right moment:\n• You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20 and choose which d20 to use.\n• You can also spend one luck point when an attack roll is made against you to roll a d20 and choose whether the attack uses the attacker’s roll or yours.\n• You regain your expended luck points when you finish a long rest."
  },
  {
    name: "Mage Slayer",
    prerequisite: "None",
    category: "Combat",
    summary: "Reaction attack against adjacent spellcaster, disadvantage on enemy concentration saves, advantage vs nearby spells.",
    description: "You have practiced techniques useful in melee combat against spellcasters:\n• When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee weapon attack against that creature.\n• When you damage a creature that is concentrating on a spell, that creature has disadvantage on the saving throw it makes to maintain its concentration.\n• You have advantage on saving throws against spells cast by creatures within 5 feet of you."
  },
  {
    name: "Magic Initiate",
    prerequisite: "None",
    category: "Magic",
    summary: "Learn 2 cantrips and one 1st-level spell from a chosen spellcaster class; cast 1st-level spell 1/day.",
    description: "Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard.\n• You learn two cantrips of your choice from that class’s spell list.\n• In addition, choose one 1st-level spell to learn from that same list. You can cast this spell once at its lowest level without expending a spell slot, regaining the ability on a long rest."
  },
  {
    name: "Martial Adept",
    prerequisite: "None",
    category: "Combat",
    summary: "Learn two Battle Master maneuvers and gain one superiority die (d6) per short or long rest.",
    description: "You have martial training that allows you to perform special combat maneuvers:\n• You learn two maneuvers of your choice from among those available to the Battle Master archetype in the fighter class.\n• You gain one superiority die, which is a d6 (used to fuel your maneuvers). You regain your expended superiority die when you finish a short or long rest.\n• Saving throw DC equals 8 + proficiency bonus + STR or DEX modifier (your choice)."
  },
  {
    name: "Medium Armor Master",
    prerequisite: "Proficiency with medium armor",
    category: "Defense",
    summary: "Medium armor imposes no Stealth disadvantage, max DEX bonus to AC increases from +2 to +3.",
    description: "You have practiced moving in medium armor to gain the following benefits:\n• Wearing medium armor doesn’t impose disadvantage on your Dexterity (Stealth) checks.\n• When you wear medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity of 16 or higher."
  },
  {
    name: "Mobile",
    prerequisite: "None",
    category: "Movement",
    summary: "+10ft speed, Dash ignores difficult terrain, melee attacking a creature prevents opportunity attacks from it.",
    description: "You are exceptionally speedy and agile:\n• Your speed increases by 10 feet.\n• When you use the Dash action, difficult terrain doesn’t cost you extra movement on that turn.\n• When you make a melee attack against a creature, you don’t provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not."
  },
  {
    name: "Moderately Armored",
    prerequisite: "Proficiency with light armor",
    category: "Defense",
    summary: "+1 STR or DEX, gain proficiency with medium armor and shields.",
    description: "You have trained to master the use of medium armor and shields, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with medium armor and shields."
  },
  {
    name: "Mounted Combatant",
    prerequisite: "None",
    category: "Combat",
    summary: "Advantage on melee attacks vs smaller unmounted foes, redirect attacks to mount to yourself, mount DEX save evasion.",
    description: "You are a dangerous foe to face while mounted:\n• You have advantage on melee attack rolls against any unmounted creature that is smaller than your mount.\n• You can force an attack targeted at your mount to target you instead.\n• If your mount is subjected to an effect that allows it to make a DEX saving throw to take only half damage, it takes no damage on success and half damage on failure."
  },
  {
    name: "Observant",
    prerequisite: "None",
    category: "Utility",
    summary: "+1 INT or WIS, read lips, +5 bonus to passive Perception and passive Investigation.",
    description: "Quick to notice details of your environment, you gain the following benefits:\n• Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n• If you can see a creature’s mouth while it speaks a language you understand, you can interpret what it’s saying by reading its lips.\n• You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores."
  },
  {
    name: "Polearm Master",
    prerequisite: "None",
    category: "Combat",
    summary: "Bonus action attack with opposite end of polearms (1d4), opportunity attack when enemies enter your reach.",
    description: "You can keep your enemies at bay with reach weapons:\n• When you take the Attack action and attack with only a glaive, halberd, pike, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon (deals 1d4 bludgeoning damage).\n• While you are wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter the reach you have with that weapon."
  },
  {
    name: "Resilient",
    prerequisite: "None",
    category: "Defense",
    summary: "+1 to any ability score, gain saving throw proficiency in that chosen ability.",
    description: "Choose one ability score. You gain the following benefits:\n• Increase the chosen ability score by 1, to a maximum of 20.\n• You gain proficiency in saving throws using the chosen ability."
  },
  {
    name: "Ritual Caster",
    prerequisite: "Intelligence or Wisdom 13 or higher",
    category: "Magic",
    summary: "Gain ritual book with two 1st-level ritual spells from a chosen class, scribe more ritual spells you find.",
    description: "You have learned a number of spells that you can cast as rituals. Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard.\n• You acquire a ritual book holding two 1st-level spells of your choice that have the ritual tag from that class’s spell list.\n• You can cast these spells as rituals. If you come across a spell in written form, you might be able to add it to your ritual book."
  },
  {
    name: "Savage Attacker",
    prerequisite: "None",
    category: "Combat",
    summary: "Once per turn when rolling melee weapon damage, roll again and use either total.",
    description: "Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon’s damage dice and use either total."
  },
  {
    name: "Sentinel",
    prerequisite: "None",
    category: "Combat",
    summary: "Opportunity attacks reduce enemy speed to 0, enemies provoke even when Disengaging, reaction attack when enemy attacks nearby ally.",
    description: "You have mastered techniques to take advantage of every drop in any enemy's guard:\n• When you hit a creature with an opportunity attack, the creature’s speed becomes 0 for the rest of the turn.\n• Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach.\n• When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn’t have this feat), you can use your reaction to make a melee weapon attack against the attacking creature."
  },
  {
    name: "Sharpshooter",
    prerequisite: "None",
    category: "Combat",
    summary: "Attacking at long range has no disadvantage, ignore half and 3/4 cover, take -5 to hit for +10 damage with ranged weapon.",
    description: "You have mastered ranged weapons and can make shots that others find impossible:\n• Attacking at long range doesn't impose disadvantage on your ranged weapon attack rolls.\n• Your ranged weapon attacks ignore half cover and three-quarters cover.\n• Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack’s damage."
  },
  {
    name: "Shield Master",
    prerequisite: "None",
    category: "Defense",
    summary: "Bonus action shield shove, add shield AC to DEX saves targeting only you, reaction to take 0 damage on successful DEX save.",
    description: "You use shields not just for protection but also for offense:\n• If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet of you with your shield.\n• If you aren’t incapacitated, you can add your shield’s AC bonus to any Dexterity saving throw you make against a spell or other harmful effect that targets only you.\n• If you are subjected to an effect that allows you to make a DEX saving throw for half damage, you can use your reaction to take no damage on a success."
  },
  {
    name: "Skill Expert",
    prerequisite: "None",
    category: "Utility",
    summary: "+1 to any ability score, gain proficiency in one skill, and gain expertise in one proficient skill.",
    description: "You have honed your proficiency with particular skills:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• You gain proficiency in one skill of your choice.\n• Choose one skill in which you have proficiency. You gain expertise with that skill (your proficiency bonus is doubled for checks made with it)."
  },
  {
    name: "Skilled",
    prerequisite: "None",
    category: "Utility",
    summary: "Gain proficiency in any combination of three skills or tools of your choice.",
    description: "You have exceptionally broad training:\n• You gain proficiency in any combination of three skills or tools of your choice."
  },
  {
    name: "Skulker",
    prerequisite: "Dexterity 13 or higher",
    category: "Utility",
    summary: "Hide when lightly obscured, missing a ranged attack while hidden does not reveal you, dim light imposes no disadvantage.",
    description: "You are expert at slinking through shadows:\n• You can try to hide when you are lightly obscured from the creature from which you are hiding.\n• When you are hidden from a creature and miss it with a ranged weapon attack, making the attack doesn't reveal your position.\n• Dim light doesn’t impose disadvantage on your Wisdom (Perception) checks relying on sight."
  },
  {
    name: "Spell Sniper",
    prerequisite: "Spellcasting feature",
    category: "Magic",
    summary: "Double range of attack spells, ignore half and 3/4 cover with spells, learn one attack cantrip.",
    description: "You have mastered spells that require attack rolls:\n• When you cast a spell that requires you to make an attack roll, the spell’s range is doubled.\n• Your ranged spell attacks ignore half cover and three-quarters cover.\n• You learn one cantrip that requires an attack roll from the bard, cleric, druid, sorcerer, warlock, or wizard spell list (using that class's casting ability)."
  },
  {
    name: "Tavern Brawler",
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or CON, proficient with improvised weapons, 1d4 unarmed strikes, bonus action grapple on unarmed/improvised hit.",
    description: "Accustomed to rough-and-tumble fighting using whatever is at hand:\n• Increase your Strength or Constitution score by 1, to a maximum of 20.\n• You are proficient with improvised weapons.\n• Your unarmed strike uses a d4 for damage.\n• When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target."
  },
  {
    name: "Tough",
    prerequisite: "None",
    category: "Defense",
    summary: "HP maximum increases by 2 per level (current and future).",
    description: "Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points."
  },
  {
    name: "War Caster",
    prerequisite: "Spellcasting feature",
    category: "Magic",
    summary: "Advantage on concentration saves, perform somatic components with weapons/shield in hand, cast spell as opportunity attack.",
    description: "You have practiced casting spells in the midst of combat:\n• You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage.\n• You can perform the somatic components of spells even when you have weapons or a shield in one or both hands.\n• When a hostile creature’s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack."
  },
  {
    name: "Weapon Master",
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or DEX, gain proficiency with four weapons of your choice.",
    description: "You have practiced extensively with a variety of weapons, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with four weapons of your choice."
  }
];

var RACE_TRAITS = {
  "Human": "+1 to every ability score. No other special traits — flexible and simple to play.",
  "Hill Dwarf": "+2 CON, +1 WIS. Darkvision 60ft, resistance to poison damage, advantage on saves vs. poison, +1 HP per level.",
  "Mountain Dwarf": "+2 CON, +2 STR. Darkvision 60ft, poison resistance, proficiency with light and medium armor.",
  "High Elf": "+2 DEX, +1 INT. Darkvision 60ft, advantage vs. being charmed, can't be magically put to sleep, know one wizard cantrip.",
  "Wood Elf": "+2 DEX, +1 WIS. Darkvision, fey ancestry, +5ft speed, can try to hide even when only lightly obscured.",
  "Dark Elf (Drow)": "+2 DEX, +1 CHA. Superior darkvision 120ft, sunlight sensitivity (disadvantage in bright sunlight), a few innate spells at higher levels.",
  "Lightfoot Halfling": "+2 DEX, +1 CHA. Lucky (reroll 1s on d20), brave (advantage vs. frightened), can hide behind bigger creatures.",
  "Stout Halfling": "+2 DEX, +1 CON. Lucky, brave, resistance to poison damage and advantage vs. poison.",
  "Dragonborn": "+2 STR, +1 CHA. Breath weapon (elemental damage in a line or cone) and resistance to your draconic ancestry's damage type.",
  "Rock Gnome": "+2 INT, +1 CON. Darkvision, advantage on INT/WIS/CHA saves vs. magic, can tinker with tiny clockwork devices.",
  "Forest Gnome": "+2 INT, +1 DEX. Darkvision, advantage vs. magic saves, know the minor illusion cantrip, can speak with small animals.",
  "Half-Elf": "+2 CHA, +1 to two other abilities of your choice. Darkvision, advantage vs. charm, two extra skill proficiencies.",
  "Half-Orc": "+2 STR, +1 CON. Darkvision, menacing (Intimidation proficiency), relentless endurance (drop to 1 HP instead of 0, once per long rest).",
  "Tiefling": "+2 CHA, +1 INT. Darkvision, resistance to fire damage, know the thaumaturgy cantrip and more spells at higher levels."
};
var RACE_TRAIT_FALLBACK = "This is an expanded (non-SRD) race — check your table's sourcebook for its exact ability score bonuses and traits. Everything else here still works fine once you've picked it.";

var BACKGROUND_INFO = {
  "Acolyte": {skills:["Insight","Religion"], blurb:"Grants Insight and Religion, plus a holy symbol and prayer book. You served in a temple."},
  "Charlatan": {skills:["Deception","Sleight of Hand"], blurb:"Grants Deception and Sleight of Hand. You're a practiced con artist and forger."},
  "Criminal": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth, plus a criminal contact. You have a history of breaking the law."},
  "Entertainer": {skills:["Acrobatics","Performance"], blurb:"Grants Acrobatics and Performance, plus a musical instrument. You lived to entertain audiences."},
  "Folk Hero": {skills:["Animal Handling","Survival"], blurb:"Grants Animal Handling and Survival. You're a champion of the common people back home."},
  "Guild Artisan": {skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion, plus membership in a trade guild and its tools."},
  "Hermit": {skills:["Medicine","Religion"], blurb:"Grants Medicine and Religion. You lived in seclusion, seeking spiritual insight."},
  "Noble": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion, plus a signet ring and standing in society."},
  "Outlander": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You grew up in the wilds, far from civilization — a natural fit for a Barbarian."},
  "Sage": {skills:["Arcana","History"], blurb:"Grants Arcana and History. You spent years learning the lore of the multiverse."},
  "Sailor": {skills:["Athletics","Perception"], blurb:"Grants Athletics and Perception, plus rope and a vehicle proficiency. You sailed the seas."},
  "Soldier": {skills:["Athletics","Intimidation"], blurb:"Grants Athletics and Intimidation, plus rank and military gear. You served in an army."},
  "Urchin": {skills:["Sleight of Hand","Stealth"], blurb:"Grants Sleight of Hand and Stealth. You grew up on the streets, alone and poor."}
};
var BACKGROUND_INFO_FALLBACK = "Grants two skill proficiencies of your choice (and usually a tool or language) — pick whatever fits your character's story; you can add them on the sheet's Skills tab afterward.";

var ALIGNMENT_INFO = {
  "Lawful Good": "Acts with compassion, honor, and a strict sense of duty. Believes order and rules protect everyone.",
  "Neutral Good": "Devoted to helping others according to their needs, doing what is right without bias toward order or chaos.",
  "Chaotic Good": "Follows their conscience and values personal freedom, acting with kindness regardless of laws or traditions.",
  "Lawful Neutral": "Acts in accordance with law, tradition, or a personal code above all else. Reliable, orderly, and disciplined.",
  "True Neutral": "Prefers balance over extremes, acting naturally without strong dedication to good, evil, order, or chaos.",
  "Chaotic Neutral": "Values individual freedom above all else, following their own whims and avoiding restrictions or traditions.",
  "Lawful Evil": "Methodically takes what they want within the limits of a code of tradition, loyalty, or order.",
  "Neutral Evil": "Does whatever they can get away with for purely selfish gain, without compassion or remorse.",
  "Chaotic Evil": "Acts with arbitrary violence, driven by greed, hatred, or a lust for destruction."
};
var ALIGNMENT_INFO_FALLBACK = "Pick an alignment that reflects your character's moral compass and personal philosophy.";

var POINT_BUY_COSTS = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};

/* A few Barbarian-flavored name ideas, shown as tappable suggestions on the
   Review step so a blank name field isn't a dead end. */
var NAME_IDEAS = [
  "Ragnar", "Ulfgar Ironhide", "Korgath Bloodaxe", "Brenna Skullcrusher",
  "Thrain Stonefist", "Vex Wildmane", "Dagna Frostborn", "Grom Ashfang",
  "Sela Stormheart", "Kael Grimtusk", "Rurik Oakshoulder", "Yrsa Wolfsbane"
];
function pickNameIdeas(n){
  var pool = NAME_IDEAS.slice();
  var picks = [];
  while(picks.length<n && pool.length){
    picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  }
  return picks;
}

var state = {
  characters: [],
  activeId: null,
  activeTab: "vitals"
};

/* ---------------- Persistence ---------------- */
function load(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    state.characters = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error("Failed to load vault data", e);
    state.characters = [];
  }
}
function save(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
  }catch(e){
    alert("Could not save — your browser storage may be full or restricted.");
    console.error(e);
  }
}

/* ---------------- Helpers ---------------- */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function mod(score){ return Math.floor((Number(score||10)-10)/2); }
function fmtMod(n){ return (n>=0?"+":"")+n; }
function totalLevel(c){ return (c.classes||[]).reduce(function(a,cl){return a+(Number(cl.level)||0);},0) || 1; }
function profBonus(c){ return Math.floor((totalLevel(c)-1)/4)+2; }
function primaryHitDie(c){
  var cl = (c.classes||[])[0];
  if(!cl) return 8;
  return HIT_DICE_BY_CLASS[cl.name] || 8;
}
function characterIsCaster(c){
  return (c.classes||[]).some(function(cl){
    var info = CLASSES_INFO[cl.name];
    return info ? !!info.spellcaster : true; // unknown class name: don't hide existing spell data
  });
}
function barbarianClassEntry(c){
  return (c.classes||[]).find(function(cl){ return cl.name==="Barbarian"; });
}
function barbarianRageMax(level){
  if(level>=20) return Infinity;
  if(level>=17) return 6;
  if(level>=12) return 5;
  if(level>=6) return 4;
  if(level>=3) return 3;
  return 2;
}
function passivePerception(c){
  var wisMod = mod(c.abilities && c.abilities.wis != null ? c.abilities.wis : 10);
  var entry = c.skillProfs && c.skillProfs["Perception"];
  var pb = profBonus(c);
  var bonus = wisMod + (entry && entry.expertise ? pb*2 : (entry && entry.prof ? pb : 0));
  var featBonus = (c.feats||[]).some(function(f){ return ((f.name||"") + "").toLowerCase()==="observant"; }) ? 5 : 0;
  return 10 + bonus + featBonus;
}
function passiveInvestigation(c){
  var intMod = mod(c.abilities && c.abilities.int != null ? c.abilities.int : 10);
  var entry = c.skillProfs && c.skillProfs["Investigation"];
  var pb = profBonus(c);
  var bonus = intMod + (entry && entry.expertise ? pb*2 : (entry && entry.prof ? pb : 0));
  var featBonus = (c.feats||[]).some(function(f){ return ((f.name||"") + "").toLowerCase()==="observant"; }) ? 5 : 0;
  return 10 + bonus + featBonus;
}
function passiveInsight(c){
  var wisMod = mod(c.abilities && c.abilities.wis != null ? c.abilities.wis : 10);
  var entry = c.skillProfs && c.skillProfs["Insight"];
  var pb = profBonus(c);
  var bonus = wisMod + (entry && entry.expertise ? pb*2 : (entry && entry.prof ? pb : 0));
  return 10 + bonus;
}
function getCharacterSenses(c){
  var race = (c.race||"").toLowerCase();
  if(race.indexOf("drow")!==-1) return "Superior Darkvision 120 ft";
  if(race.indexOf("dwarf")!==-1 || race.indexOf("elf")!==-1 || race.indexOf("gnome")!==-1 ||
     race.indexOf("half-elf")!==-1 || race.indexOf("half-orc")!==-1 || race.indexOf("tiefling")!==-1 ||
     race.indexOf("orc")!==-1 || race.indexOf("goblin")!==-1 || race.indexOf("kobold")!==-1 ||
     race.indexOf("bugbear")!==-1 || race.indexOf("aasimar")!==-1 || race.indexOf("tabaxi")!==-1) {
    return "Darkvision 60 ft";
  }
  return "Normal (60 ft)";
}
function getAllCharacterFeatures(c){
  var list = [];
  (c.classes||[]).forEach(function(cl){
    var info = CLASSES_INFO[cl.name];
    if(info && info.features && info.features.length){
      info.features.forEach(function(f){
        list.push({
          id: "class_"+cl.name+"_"+f.name,
          name: f.name,
          source: "Class · " + cl.name,
          text: f.text,
          category: "class",
          isDerived: true
        });
      });
    }
  });
  if(c.race){
    var traitText = RACE_TRAITS[c.race] || RACE_TRAIT_FALLBACK;
    list.push({
      id: "race_"+c.race,
      name: c.race + " Traits",
      source: "Race · " + c.race,
      text: traitText,
      category: "race",
      isDerived: true
    });
  }
  if(c.background){
    var bg = BACKGROUND_INFO[c.background];
    list.push({
      id: "bg_"+c.background,
      name: c.background + " Lore & Features",
      source: "Background · " + c.background,
      text: bg ? bg.blurb : BACKGROUND_INFO_FALLBACK,
      category: "background",
      isDerived: true
    });
  }
  (c.feats||[]).forEach(function(feat){
    var descText = (feat.prerequisite && feat.prerequisite !== "None" ? "(Prerequisite: " + feat.prerequisite + ")\n" : "") + (feat.description || feat.summary || "");
    list.push({
      id: "feat_"+(feat.id || feat.name),
      name: feat.name,
      source: "Feat" + (feat.category ? " · " + feat.category : ""),
      text: descText,
      category: "feat",
      isFeat: true,
      featObj: feat
    });
  });
  (c.features||[]).forEach(function(f){
    list.push({
      id: f.id || uid(),
      name: f.name || "Custom Feature",
      source: f.source || "Custom",
      text: f.text || "",
      category: (f.source || "custom").toLowerCase(),
      isCustom: true,
      featureObj: f
    });
  });
  return list;
}
function clamp(n,lo,hi){ return Math.max(lo,Math.min(hi,n)); }
function ce(tag, cls){ var e = document.createElement(tag); if(cls) e.className = cls; return e; }
function escapeHtml(s){
  return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function nowStamp(){
  var d = new Date();
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})+" · "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}

/* ---------------- Default character ---------------- */
function newCharacter(name){
  var abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  var skillProfs = {};
  SKILLS.forEach(function(s){ skillProfs[s[0]] = {prof:false, expertise:false}; });
  var saveProfs = {str:false,dex:false,con:false,int:false,wis:false,cha:false};
  var slots = {};
  for(var i=1;i<=9;i++) slots[i] = {max:0, used:0};
  return {
    id: uid(),
    name: name || "New Character",
    race: "Human",
    background: "Acolyte",
    alignment: "Neutral Good",
    classes: [{name:"Fighter", subclass:"", level:1}],
    abilities: abilities,
    saveProfs: saveProfs,
    skillProfs: skillProfs,
    hp: {max:10, current:10, temp:0},
    ac: 10,
    initiativeMisc: 0,
    speed: 30,
    hitDiceUsed: 0,
    deathSaves: {success:0, fail:0},
    rage: {active:false, used:0},
    spellcasting: {ability:"int", slots: slots},
    spells: [],
    feats: [],
    features: [],
    inventory: [],
    currency: {cp:0, sp:0, ep:0, gp:0, pp:0},
    notes: [],
    rollLog: []
  };
}

/* ---------------- Migration safety (older saves) ---------------- */
function ensureShape(c){
  if(!c.classes) c.classes = [{name:"Fighter", subclass:"", level: c.level||1}];
  if(!c.race) c.race = "Human";
  if(!c.background) c.background = "Acolyte";
  if(!c.alignment) c.alignment = "Neutral Good";
  if(!c.abilities) c.abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  if(!c.skillProfs){
    c.skillProfs = {};
    SKILLS.forEach(function(s){ c.skillProfs[s[0]] = {prof:false, expertise:false}; });
  }
  if(!c.saveProfs) c.saveProfs = {str:false,dex:false,con:false,int:false,wis:false,cha:false};
  if(!c.hp) c.hp = {max:10, current:10, temp:0};
  if(c.ac==null) c.ac = 10;
  if(c.initiativeMisc==null) c.initiativeMisc = 0;
  if(c.speed==null) c.speed = 30;
  if(c.hitDiceUsed==null) c.hitDiceUsed = 0;
  if(!c.deathSaves) c.deathSaves = {success:0, fail:0};
  if(!c.rage) c.rage = {active:false, used:0};
  if(!c.spellcasting) c.spellcasting = {ability:"int", slots:{}};
  if(!c.spellcasting.slots) c.spellcasting.slots = {};
  for(var i=1;i<=9;i++){ if(!c.spellcasting.slots[i]) c.spellcasting.slots[i] = {max:0,used:0}; }
  if(!c.spells) c.spells = [];
  if(!c.feats) c.feats = [];
  else {
    c.feats = c.feats.map(function(item){
      if(typeof item === "string"){
        var found = FEATS_CATALOG.find(function(f){ return f.name.toLowerCase()===item.toLowerCase(); });
        return {
          id: uid(),
          name: item,
          prerequisite: found ? found.prerequisite : "None",
          category: found ? found.category : "General",
          summary: found ? found.summary : "",
          description: found ? found.description : item,
          source: found ? "SRD" : "Custom"
        };
      }
      if(!item.id) item.id = uid();
      return item;
    });
  }
  if(!c.features) c.features = [];
  else {
    c.features = c.features.map(function(item){
      if(typeof item === "string"){
        var parts = item.split(":");
        var name = parts[0].trim();
        var text = parts.slice(1).join(":").trim();
        if(!text){ text = name; name = "Custom Feature"; }
        return {
          id: uid(),
          name: name,
          source: "Custom",
          text: text,
          isPassive: true
        };
      }
      if(!item.id) item.id = uid();
      return item;
    });
  }
  if(!c.inventory) c.inventory = [];
  if(!c.currency) c.currency = {cp:0,sp:0,ep:0,gp:0,pp:0};
  if(!c.notes) c.notes = [];
  if(!c.rollLog) c.rollLog = [];
  return c;
}

function getActive(){
  return state.characters.find(function(c){ return c.id===state.activeId; });
}

/* ---------------- Rendering: sidebar ---------------- */
function renderSidebar(){
  var list = document.getElementById("char-list");
  list.innerHTML = "";
  state.characters.forEach(function(c){
    var li = document.createElement("li");
    li.className = c.id===state.activeId ? "active" : "";
    var pct = c.hp.max>0 ? clamp(Math.round((c.hp.current/c.hp.max)*100),0,100) : 0;
    var clsText = (c.classes||[]).map(function(cl){return (cl.name||"?")+" "+(cl.level||1);}).join(" / ");
    li.innerHTML =
      '<span class="cname">'+escapeHtml(c.name||"Unnamed")+'</span>'+
      '<span class="cmeta">'+escapeHtml(c.race||"—")+' · '+escapeHtml(clsText)+'</span>'+
      '<div class="hp-bar"><div class="hp-fill" style="width:'+pct+'%"></div></div>';
    li.addEventListener("click", function(){
      state.activeId = c.id;
      state.activeTab = "vitals";
      renderAll();
      closeSidebarMobile();
    });
    list.appendChild(li);
  });
  var titleEl = document.getElementById("tb-title");
  var active = getActive();
  titleEl.textContent = active ? active.name : "Ragnar's Den";
}

/* ---------------- Rendering: sheet ---------------- */
var TABS = [
  ["vitals","Vitals"],
  ["abilities","Abilities & Skills"],
  ["features","Features & Feats"],
  ["spells","Spells"],
  ["inventory","Inventory"],
  ["journal","Journal"]
];
function visibleTabs(c){
  return TABS.filter(function(t){ return t[0]!=="spells" || characterIsCaster(c); });
}

function renderAll(){
  renderSidebar();
  var c = getActive();
  var empty = document.getElementById("empty-state");
  var sheet = document.getElementById("sheet");
  if(!c){
    empty.style.display = "flex";
    sheet.style.display = "none";
    renderRollLog();
    return;
  }
  if(state.activeTab==="spells" && !characterIsCaster(c)) state.activeTab = "vitals";
  empty.style.display = "none";
  sheet.style.display = "block";
  sheet.innerHTML = "";
  sheet.appendChild(renderIdentity(c));

  var tabsBar = document.createElement("div");
  tabsBar.id = "tabs";
  visibleTabs(c).forEach(function(t){
    var b = document.createElement("button");
    b.textContent = t[1];
    if(state.activeTab===t[0]) b.className = "active";
    b.addEventListener("click", function(){ state.activeTab = t[0]; renderAll(); });
    tabsBar.appendChild(b);
  });
  sheet.appendChild(tabsBar);

  var panelMap = {
    vitals: renderVitalsPanel,
    abilities: renderAbilitiesPanel,
    features: renderFeaturesPanel,
    spells: renderSpellsPanel,
    inventory: renderInventoryPanel,
    journal: renderJournalPanel
  };
  visibleTabs(c).forEach(function(t){
    var panel = panelMap[t[0]](c);
    panel.className = "panel" + (state.activeTab===t[0] ? " active" : "");
    sheet.appendChild(panel);
  });

  renderRollLog();
}

function field(el, tag, cls, txt){}

/* Generic dropdown field with grouped standard/expanded options plus a
   "Custom / homebrew" fallback that reveals a free-text input. Used for
   race, background, alignment — anywhere we want guided choices without
   ever blocking something not on the list. */
function dropdownField(labelTxt, key, groups, c, onChangeExtra){
  var f = document.createElement("div");
  f.className = "field";
  var l = document.createElement("label"); l.textContent = labelTxt;
  f.appendChild(l);

  var allValues = [];
  Object.keys(groups).forEach(function(g){ allValues = allValues.concat(groups[g]); });

  var select = document.createElement("select");
  var blankOpt = document.createElement("option");
  blankOpt.value = ""; blankOpt.textContent = "Select "+labelTxt.toLowerCase();
  blankOpt.disabled = true;
  blankOpt.hidden = true;
  select.appendChild(blankOpt);
  Object.keys(groups).forEach(function(groupLabel){
    var og = document.createElement("optgroup");
    og.label = groupLabel;
    groups[groupLabel].forEach(function(opt){
      var o = document.createElement("option");
      o.value = opt; o.textContent = opt;
      og.appendChild(o);
    });
    select.appendChild(og);
  });
  var customOpt = document.createElement("option");
  customOpt.value = "__custom__"; customOpt.textContent = "Custom / homebrew…";
  select.appendChild(customOpt);

  var customInput = document.createElement("input");
  customInput.type = "text";
  customInput.placeholder = "Enter custom "+labelTxt.toLowerCase();
  customInput.style.display = "none";
  customInput.style.marginTop = "3px";

  function updatePlaceholderStyle(){
    select.classList.toggle("placeholder", select.value==="");
  }

  var currentVal = c[key]||"";
  if(currentVal && allValues.indexOf(currentVal)===-1){
    select.value = "__custom__";
    customInput.value = currentVal;
    customInput.style.display = "block";
  } else {
    select.value = currentVal;
  }
  updatePlaceholderStyle();

  select.addEventListener("change", function(){
    if(select.value==="__custom__"){
      customInput.style.display = "block";
      customInput.focus();
      c[key] = customInput.value;
    } else {
      customInput.style.display = "none";
      c[key] = select.value;
    }
    updatePlaceholderStyle();
    save();
    if(onChangeExtra) onChangeExtra();
  });
  customInput.addEventListener("input", function(){
    c[key] = customInput.value;
    save();
    if(onChangeExtra) onChangeExtra();
  });

  f.appendChild(select);
  f.appendChild(customInput);
  return f;
}

function renderIdentity(c){
  var wrap = document.createElement("div");
  wrap.className = "identity";

  var nameRow = document.createElement("div");
  nameRow.className = "name-row";
  var nameInput = document.createElement("input");
  nameInput.className = "charname";
  nameInput.value = c.name;
  nameInput.placeholder = "Character name";
  nameInput.addEventListener("input", function(){ c.name = nameInput.value; save(); renderSidebar(); });
  nameRow.appendChild(nameInput);
  wrap.appendChild(nameRow);

  var subRow = document.createElement("div");
  subRow.className = "sub-row";

  subRow.appendChild(dropdownField("Race", "race", RACES, c, function(){ renderSidebar(); }));
  subRow.appendChild(dropdownField("Background", "background", BACKGROUNDS, c));
  subRow.appendChild(dropdownField("Alignment", "alignment", ALIGNMENTS, c));

  var pbField = document.createElement("div");
  pbField.className = "field";
  pbField.innerHTML = '<label>Proficiency</label>';
  var pbVal = document.createElement("input");
  pbVal.value = fmtMod(profBonus(c));
  pbVal.disabled = true;
  pbVal.style.color = "var(--text-on-parch-dim)";
  pbField.appendChild(pbVal);
  subRow.appendChild(pbField);

  wrap.appendChild(subRow);

  var classesRow = document.createElement("div");
  classesRow.className = "classes-row";
  (c.classes||[]).forEach(function(cl, idx){
    var chip = document.createElement("div");
    chip.className = "class-chip";
    var sel = document.createElement("select");
    sel.style.background = "transparent";
    sel.style.border = "none";
    sel.style.fontSize = "12.5px";
    sel.style.color = "var(--text-on-parch)";
    var freeOpt = document.createElement("option");
    var opts = CLASS_LIST.slice();
    if(cl.name && opts.indexOf(cl.name)===-1) opts.unshift(cl.name);
    opts.forEach(function(name){
      var o = document.createElement("option");
      o.value = name; o.textContent = name;
      if(cl.name===name) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function(){ cl.name = sel.value; save(); renderAll(); });
    var subInput = document.createElement("input");
    subInput.placeholder = "subclass";
    subInput.value = cl.subclass||"";
    subInput.addEventListener("input", function(){ cl.subclass = subInput.value; save(); });
    var lvlInput = document.createElement("input");
    lvlInput.className = "lvl";
    lvlInput.type = "number"; lvlInput.min="1"; lvlInput.max="20";
    lvlInput.value = cl.level||1;
    lvlInput.addEventListener("input", function(){ cl.level = clamp(Number(lvlInput.value)||1,1,20); save(); renderAll(); });
    chip.appendChild(sel);
    chip.appendChild(subInput);
    chip.appendChild(document.createTextNode("Lv"));
    chip.appendChild(lvlInput);
    if((c.classes||[]).length>1){
      var x = document.createElement("span");
      x.className = "x"; x.textContent = "×";
      x.addEventListener("click", function(){ c.classes.splice(idx,1); save(); renderAll(); });
      chip.appendChild(x);
    }
    classesRow.appendChild(chip);
  });
  var addClassBtn = document.createElement("button");
  addClassBtn.className = "btn small";
  addClassBtn.textContent = "+ Multiclass";
  addClassBtn.style.color = "var(--text-on-parch)";
  addClassBtn.style.borderColor = "var(--rule)";
  addClassBtn.addEventListener("click", function(){
    c.classes.push({name:"Fighter", subclass:"", level:1});
    save(); renderAll();
  });
  classesRow.appendChild(addClassBtn);
  var totalSpan = document.createElement("span");
  totalSpan.className = "total-level";
  totalSpan.textContent = "Total level "+totalLevel(c);
  classesRow.appendChild(totalSpan);

  var deleteBtn = makeDeleteButton(c);
  deleteBtn.style.marginLeft = "auto";
  classesRow.appendChild(deleteBtn);

  wrap.appendChild(classesRow);

  return wrap;
}

function makeCard(titleText, hint){
  var card = document.createElement("div");
  card.className = "card";
  var h = document.createElement("h3");
  var span = document.createElement("span");
  span.textContent = titleText;
  h.appendChild(span);
  if(hint){
    var hh = document.createElement("span");
    hh.className = "hint"; hh.textContent = hint;
    h.appendChild(hh);
  }
  card.appendChild(h);
  return card;
}

/* ---- Vitals panel ---- */
function renderVitalsPanel(c){
  var panel = document.createElement("div");

  var card = makeCard("Hit points & defense");
  var grid = document.createElement("div");
  grid.className = "vitals-grid";

  // HP box
  var hpBox = document.createElement("div");
  hpBox.className = "vital-box hp-vital-box";
  hpBox.innerHTML = '<div class="lbl">Hit Points</div>';

  var heroDisplay = document.createElement("div");
  heroDisplay.className = "hp-hero-display";

  var curSpan = document.createElement("span");
  curSpan.className = "hp-cur-num";
  curSpan.textContent = c.hp.current;

  var slashSpan = document.createElement("span");
  slashSpan.className = "hp-slash";
  slashSpan.textContent = "/";

  var maxSpan = document.createElement("span");
  maxSpan.className = "hp-max-num";
  maxSpan.textContent = c.hp.max;

  heroDisplay.appendChild(curSpan);
  heroDisplay.appendChild(slashSpan);
  heroDisplay.appendChild(maxSpan);

  if((Number(c.hp.temp)||0) > 0){
    var tempBadge = document.createElement("span");
    tempBadge.className = "hp-temp-badge";
    tempBadge.textContent = "+" + c.hp.temp + " temp";
    heroDisplay.appendChild(tempBadge);
  }
  hpBox.appendChild(heroDisplay);

  function applyQuickDamage(n){
    if(n <= 0) return;
    var temp = Number(c.hp.temp) || 0;
    if(temp > 0){
      var absorbed = Math.min(temp, n);
      c.hp.temp = temp - absorbed;
      n -= absorbed;
    }
    c.hp.current = Math.max(0, (Number(c.hp.current)||0) - n);
    save(); renderSidebar(); renderAll();
  }

  function applyQuickHeal(n){
    if(n <= 0) return;
    c.hp.current = clamp((Number(c.hp.current)||0) + n, 0, c.hp.max);
    save(); renderSidebar(); renderAll();
  }

  // Quick HP controls
  var hpControlsRow = document.createElement("div");
  hpControlsRow.className = "hp-actions-row";

  var dmg5Btn = document.createElement("button");
  dmg5Btn.type = "button";
  dmg5Btn.className = "btn small danger quick-adj-btn";
  dmg5Btn.textContent = "-5";
  dmg5Btn.title = "Take 5 damage";
  dmg5Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickDamage(5);
  });
  hpControlsRow.appendChild(dmg5Btn);

  var dmg1Btn = document.createElement("button");
  dmg1Btn.type = "button";
  dmg1Btn.className = "btn small danger quick-adj-btn";
  dmg1Btn.textContent = "-1";
  dmg1Btn.title = "Take 1 damage";
  dmg1Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickDamage(1);
  });
  hpControlsRow.appendChild(dmg1Btn);

  var heal1Btn = document.createElement("button");
  heal1Btn.type = "button";
  heal1Btn.className = "btn small quick-adj-btn quick-heal-btn";
  heal1Btn.textContent = "+1";
  heal1Btn.title = "Heal 1 HP";
  heal1Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickHeal(1);
  });
  hpControlsRow.appendChild(heal1Btn);

  var heal5Btn = document.createElement("button");
  heal5Btn.type = "button";
  heal5Btn.className = "btn small quick-adj-btn quick-heal-btn";
  heal5Btn.textContent = "+5";
  heal5Btn.title = "Heal 5 HP";
  heal5Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickHeal(5);
  });
  hpControlsRow.appendChild(heal5Btn);

  var fullBtn = document.createElement("button");
  fullBtn.type = "button";
  fullBtn.className = "btn small quick-adj-btn quick-heal-btn";
  fullBtn.textContent = "Full";
  fullBtn.title = "Restore to full HP";
  fullBtn.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.current = c.hp.max;
    save(); renderSidebar(); renderAll();
  });
  hpControlsRow.appendChild(fullBtn);

  hpBox.appendChild(hpControlsRow);

  // Sub row for Max & Temp HP
  var subRow = document.createElement("div");
  subRow.className = "hp-sub-row";

  // Max HP
  var maxGroup = document.createElement("div");
  maxGroup.className = "hp-sub-group";
  var maxLbl = document.createElement("span");
  maxLbl.className = "hp-sub-lbl";
  maxLbl.textContent = "Max:";
  maxGroup.appendChild(maxLbl);

  var maxStepper = document.createElement("div");
  maxStepper.className = "stat-stepper hp-sub-stepper";

  var maxDown = document.createElement("button");
  maxDown.type = "button";
  maxDown.className = "stat-arrow-btn stat-arrow-down";
  maxDown.title = "Decrease max HP";
  maxDown.setAttribute("aria-label", "Decrease max HP");
  maxDown.innerHTML = makeStatArrowSvg("down");
  maxDown.disabled = (Number(c.hp.max)||1) <= 1;
  maxDown.addEventListener("click", function(e){
    e.stopPropagation();
    var curMax = Number(c.hp.max) || 1;
    if(curMax > 1){
      c.hp.max = curMax - 1;
      if(c.hp.current > c.hp.max) c.hp.current = c.hp.max;
      save(); renderSidebar(); renderAll();
    }
  });

  var maxValSpan = document.createElement("span");
  maxValSpan.className = "stat-score-val";
  maxValSpan.textContent = c.hp.max;

  var maxUp = document.createElement("button");
  maxUp.type = "button";
  maxUp.className = "stat-arrow-btn stat-arrow-up";
  maxUp.title = "Increase max HP";
  maxUp.setAttribute("aria-label", "Increase max HP");
  maxUp.innerHTML = makeStatArrowSvg("up");
  maxUp.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.max = (Number(c.hp.max)||1) + 1;
    save(); renderSidebar(); renderAll();
  });

  maxStepper.appendChild(maxDown);
  maxStepper.appendChild(maxValSpan);
  maxStepper.appendChild(maxUp);
  maxGroup.appendChild(maxStepper);
  subRow.appendChild(maxGroup);

  // Temp HP
  var tempGroup = document.createElement("div");
  tempGroup.className = "hp-sub-group";
  var tempLbl = document.createElement("span");
  tempLbl.className = "hp-sub-lbl";
  tempLbl.textContent = "Temp:";
  tempGroup.appendChild(tempLbl);

  var tempStepper = document.createElement("div");
  tempStepper.className = "stat-stepper hp-sub-stepper";

  var tempDown = document.createElement("button");
  tempDown.type = "button";
  tempDown.className = "stat-arrow-btn stat-arrow-down";
  tempDown.title = "Decrease temp HP";
  tempDown.setAttribute("aria-label", "Decrease temp HP");
  tempDown.innerHTML = makeStatArrowSvg("down");
  tempDown.disabled = (Number(c.hp.temp)||0) <= 0;
  tempDown.addEventListener("click", function(e){
    e.stopPropagation();
    var t = Number(c.hp.temp) || 0;
    if(t > 0){
      c.hp.temp = t - 1;
      save(); renderAll();
    }
  });

  var tempValSpan = document.createElement("span");
  tempValSpan.className = "stat-score-val";
  tempValSpan.textContent = c.hp.temp || 0;

  var tempUp = document.createElement("button");
  tempUp.type = "button";
  tempUp.className = "stat-arrow-btn stat-arrow-up";
  tempUp.title = "Increase temp HP";
  tempUp.setAttribute("aria-label", "Increase temp HP");
  tempUp.innerHTML = makeStatArrowSvg("up");
  tempUp.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.temp = (Number(c.hp.temp)||0) + 1;
    save(); renderAll();
  });

  tempStepper.appendChild(tempDown);
  tempStepper.appendChild(tempValSpan);
  tempStepper.appendChild(tempUp);
  tempGroup.appendChild(tempStepper);
  subRow.appendChild(tempGroup);

  hpBox.appendChild(subRow);

  if(c.hp.current<=0){
    var ds = document.createElement("div");
    ds.className = "death-saves";
    ["success","fail"].forEach(function(kind){
      var grp = document.createElement("div"); grp.className="grp";
      var lbl = document.createElement("div"); lbl.textContent = kind==="success"?"Successes":"Failures";
      var boxes = document.createElement("div"); boxes.className="boxes";
      for(var i=0;i<3;i++){
        var cb = document.createElement("input"); cb.type="checkbox";
        cb.checked = i < (c.deathSaves[kind]||0);
        (function(i){
          cb.addEventListener("change", function(){
            c.deathSaves[kind] = cb.checked ? i+1 : i;
            save(); renderAll();
          });
        })(i);
        boxes.appendChild(cb);
      }
      grp.appendChild(lbl); grp.appendChild(boxes);
      ds.appendChild(grp);
    });
    hpBox.appendChild(ds);
  }
  grid.appendChild(hpBox);

  function smallVital(label, key, isNested, hint, step, suffix){
    step = step || 1;
    suffix = suffix || "";
    var box = document.createElement("div");
    box.className = "vital-box";
    box.innerHTML = '<div class="lbl">'+label+'</div>';

    var val = isNested ? c[isNested][key] : c[key];
    val = Number(val) || 0;

    var stepper = document.createElement("div");
    stepper.className = "stat-stepper vital-stepper";

    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "stat-arrow-btn stat-arrow-down";
    downBtn.title = "Decrease " + label;
    downBtn.setAttribute("aria-label", "Decrease " + label);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = val <= 0;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = isNested ? c[isNested][key] : c[key];
      var nextVal = Math.max(0, (Number(cur) || 0) - step);
      if(isNested) c[isNested][key] = nextVal; else c[key] = nextVal;
      save(); renderAll();
    });

    var valSpan = document.createElement("span");
    valSpan.className = "stat-score-val vital-val";
    valSpan.textContent = val + suffix;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "stat-arrow-btn stat-arrow-up";
    upBtn.title = "Increase " + label;
    upBtn.setAttribute("aria-label", "Increase " + label);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = isNested ? c[isNested][key] : c[key];
      var nextVal = (Number(cur) || 0) + step;
      if(isNested) c[isNested][key] = nextVal; else c[key] = nextVal;
      save(); renderAll();
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(valSpan);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    if(hint){
      var hintEl = document.createElement("div");
      hintEl.className = "vital-hint";
      hintEl.textContent = hint;
      box.appendChild(hintEl);
    }
    return box;
  }
  grid.appendChild(smallVital("Armor Class","ac",null,"Base & armor"));

  var initBox = document.createElement("div");
  initBox.className = "vital-box init-vital-box";
  var dexMod = mod(c.abilities.dex);
  var initTotal = dexMod + (Number(c.initiativeMisc)||0);

  var initHeader = document.createElement("div");
  initHeader.className = "lbl";
  initHeader.textContent = "Initiative";
  initBox.appendChild(initHeader);

  var initValDiv = document.createElement("div");
  initValDiv.className = "init-hero-val";
  initValDiv.textContent = fmtMod(initTotal);
  initValDiv.title = "Click to roll initiative (1d20" + fmtMod(initTotal) + ")";
  initBox.appendChild(initValDiv);

  var initHint = document.createElement("div");
  initHint.className = "vital-hint";
  initHint.textContent = "DEX (" + fmtMod(dexMod) + ") + misc";
  initBox.appendChild(initHint);

  var miscStepperRow = document.createElement("div");
  miscStepperRow.className = "init-misc-row";
  var miscLbl = document.createElement("span");
  miscLbl.textContent = "Misc:";
  miscStepperRow.appendChild(miscLbl);

  var miscStepper = document.createElement("div");
  miscStepper.className = "stat-stepper";
  miscStepper.style.maxWidth = "84px";

  var miscDown = document.createElement("button");
  miscDown.type = "button";
  miscDown.className = "stat-arrow-btn stat-arrow-down";
  miscDown.title = "Decrease misc modifier";
  miscDown.setAttribute("aria-label", "Decrease misc modifier");
  miscDown.innerHTML = makeStatArrowSvg("down");
  miscDown.addEventListener("click", function(e){
    e.stopPropagation();
    c.initiativeMisc = (Number(c.initiativeMisc)||0) - 1;
    save(); renderAll();
  });

  var miscVal = document.createElement("span");
  miscVal.className = "stat-score-val";
  miscVal.textContent = fmtMod(c.initiativeMisc||0);

  var miscUp = document.createElement("button");
  miscUp.type = "button";
  miscUp.className = "stat-arrow-btn stat-arrow-up";
  miscUp.title = "Increase misc modifier";
  miscUp.setAttribute("aria-label", "Increase misc modifier");
  miscUp.innerHTML = makeStatArrowSvg("up");
  miscUp.addEventListener("click", function(e){
    e.stopPropagation();
    c.initiativeMisc = (Number(c.initiativeMisc)||0) + 1;
    save(); renderAll();
  });

  miscStepper.appendChild(miscDown);
  miscStepper.appendChild(miscVal);
  miscStepper.appendChild(miscUp);
  miscStepperRow.appendChild(miscStepper);
  initBox.appendChild(miscStepperRow);

  initBox.style.cursor="pointer";
  initBox.title = "Click to roll initiative (1d20" + fmtMod(initTotal) + ")";
  initBox.addEventListener("click", function(e){
    if(e.target.closest(".stat-stepper") || e.target.closest("button")) return;
    performRoll(20,1,initTotal,"none","Initiative");
  });
  grid.appendChild(initBox);

  grid.appendChild(smallVital("Speed","speed",null,"ft per turn",5," ft"));

  card.appendChild(grid);
  panel.appendChild(card);

  // Hit dice + rest
  var restCard = makeCard("Hit dice & rest");
  var hd = totalLevel(c);
  var hdUsed = clamp(c.hitDiceUsed||0,0,hd);
  var hdRemaining = hd-hdUsed;
  var hdP = document.createElement("p");
  hdP.style.fontSize="13px"; hdP.style.margin="0 0 8px";
  hdP.textContent = "Hit dice remaining: "+hdRemaining+" / "+hd+"  (d"+primaryHitDie(c)+")";
  restCard.appendChild(hdP);

  var restRow = document.createElement("div");
  restRow.className = "rest-row";

  var spendBtn = document.createElement("button");
  spendBtn.className = "btn small"; spendBtn.textContent = "Spend 1 hit die";
  spendBtn.addEventListener("click", function(){
    if(hdRemaining<=0){ return; }
    var die = primaryHitDie(c);
    var conMod = mod(c.abilities.con);
    var roll = Math.floor(Math.random()*die)+1;
    var healed = Math.max(1, roll+conMod);
    c.hitDiceUsed = hdUsed+1;
    c.hp.current = clamp(c.hp.current+healed, 0, c.hp.max);
    logRoll("Hit die (d"+die+"+"+conMod+")", roll+" "+fmtMod(conMod)+" = "+healed+" HP healed");
    save(); renderAll();
  });
  restRow.appendChild(spendBtn);

  var shortRestBtn = document.createElement("button");
  shortRestBtn.className = "btn small"; shortRestBtn.textContent = "Short rest";
  shortRestBtn.title = "Reminder to spend hit dice; does not auto-heal";
  shortRestBtn.addEventListener("click", function(){
    logRoll("Short rest taken", "Spend hit dice as needed to heal.");
    save(); renderAll();
  });
  restRow.appendChild(shortRestBtn);

  var longRestBtn = document.createElement("button");
  longRestBtn.className = "btn small primary"; longRestBtn.textContent = "Long rest";
  longRestBtn.addEventListener("click", function(){
    c.hp.current = c.hp.max;
    c.hp.temp = 0;
    c.deathSaves = {success:0, fail:0};
    var recovered = Math.max(1, Math.floor(hd/2));
    c.hitDiceUsed = clamp(hdUsed-recovered, 0, hd);
    Object.keys(c.spellcasting.slots).forEach(function(lvl){
      c.spellcasting.slots[lvl].used = 0;
    });
    c.rage.used = 0;
    c.rage.active = false;
    logRoll("Long rest taken", "HP and spell slots restored; "+recovered+" hit dice recovered.");
    save(); renderAll();
  });
  restRow.appendChild(longRestBtn);

  restCard.appendChild(restRow);
  panel.appendChild(restCard);

  var barbClass = barbarianClassEntry(c);
  if(barbClass){
    var rageCard = makeCard("Rage");
    var rageMax = barbarianRageMax(barbClass.level||1);
    var rageMaxLabel = rageMax===Infinity ? "∞" : rageMax;
    var rageUsed = clamp(c.rage.used||0, 0, rageMax===Infinity ? c.rage.used||0 : rageMax);
    var rageRemaining = rageMax===Infinity ? "∞" : Math.max(0, rageMax-rageUsed);

    var rageP = document.createElement("p");
    rageP.style.fontSize="13px"; rageP.style.margin="0 0 10px";
    rageP.textContent = "Rages remaining: "+rageRemaining+" / "+rageMaxLabel;
    rageCard.appendChild(rageP);

    var rageBtn = document.createElement("button");
    rageBtn.className = "btn small"+(c.rage.active ? "" : " primary");
    rageBtn.textContent = c.rage.active ? "End Rage" : "Enter Rage";
    var atCap = rageMax!==Infinity && rageUsed>=rageMax;
    rageBtn.disabled = !c.rage.active && atCap;
    rageBtn.addEventListener("click", function(){
      if(c.rage.active){
        c.rage.active = false;
      } else {
        if(rageMax!==Infinity && (c.rage.used||0)>=rageMax) return;
        c.rage.active = true;
        c.rage.used = (c.rage.used||0)+1;
      }
      save(); renderAll();
    });
    rageCard.appendChild(rageBtn);

    if(c.rage.active) rageCard.classList.add("raging");

    var rageFeature = CLASSES_INFO["Barbarian"].features.find(function(f){ return f.name==="Rage"; });
    if(rageFeature){
      var rageHint = document.createElement("p");
      rageHint.style.cssText = "font-size:12px;color:var(--text-on-parch-dim);margin:10px 0 0;line-height:1.5;";
      rageHint.textContent = rageFeature.text;
      rageCard.appendChild(rageHint);
    }

    panel.appendChild(rageCard);
  }

  return panel;
}

/* SVG Helper for Stat Arrow Keys */
function makeStatArrowSvg(dir){
  var d = dir === "up" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6";
  return '<svg viewBox="0 0 24 24" class="stat-arrow-svg" aria-hidden="true"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/* ---- Abilities & Skills panel ---- */
function renderAbilitiesPanel(c){
  var panel = document.createElement("div");

  var abCard = makeCard("Ability scores", "tap score to roll check · arrows up/down to change stats");
  var grid = document.createElement("div");
  grid.className = "abilities-grid";
  ABILITIES.forEach(function(a){
    var key = a[0];
    var score = Number(c.abilities[key]) || 10;
    var m = mod(score);
    var box = document.createElement("div");
    box.className = "ability-box";

    var rollArea = document.createElement("div");
    rollArea.className = "ability-roll-area";
    rollArea.title = "Roll " + a[1] + " check (1d20" + fmtMod(m) + ")";
    rollArea.setAttribute("role", "button");
    rollArea.setAttribute("tabindex", "0");
    rollArea.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(m)+'</div>';
    rollArea.addEventListener("click", function(e){
      e.stopPropagation();
      performRoll(20,1,mod(c.abilities[key]),"none", a[1]+" check");
    });
    rollArea.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        performRoll(20,1,mod(c.abilities[key]),"none", a[1]+" check");
      }
    });
    box.appendChild(rollArea);

    var stepper = document.createElement("div");
    stepper.className = "stat-stepper";

    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "stat-arrow-btn stat-arrow-down";
    downBtn.title = "Decrease " + a[1] + " (Down arrow)";
    downBtn.setAttribute("aria-label", "Decrease " + a[1]);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = score <= 1;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = Number(c.abilities[key]) || 10;
      if(cur > 1){
        c.abilities[key] = cur - 1;
        save();
        renderAll();
      }
    });

    var val = document.createElement("span");
    val.className = "stat-score-val";
    val.textContent = score;
    val.setAttribute("aria-label", a[1] + " score");
    val.title = a[1] + " score: " + score;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "stat-arrow-btn stat-arrow-up";
    upBtn.title = "Increase " + a[1] + " (Up arrow)";
    upBtn.setAttribute("aria-label", "Increase " + a[1]);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.disabled = score >= 30;
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = Number(c.abilities[key]) || 10;
      if(cur < 30){
        c.abilities[key] = cur + 1;
        save();
        renderAll();
      }
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(val);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    grid.appendChild(box);
  });
  abCard.appendChild(grid);
  panel.appendChild(abCard);

  var saveCard = makeCard("Saving throws", "tap a save to roll it");
  var saveRows = document.createElement("div");
  saveRows.className = "list-rows";
  ABILITIES.forEach(function(a){
    var key = a[0];
    var pb = c.saveProfs[key] ? profBonus(c) : 0;
    var total = mod(c.abilities[key]) + pb;
    var row = document.createElement("div");
    row.className = "list-row";
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk"; cb.checked = !!c.saveProfs[key];
    cb.addEventListener("change", function(){ c.saveProfs[key]=cb.checked; save(); renderAll(); });
    var name = document.createElement("span");
    name.className = "row-name"; name.textContent = a[1];
    name.addEventListener("click", function(){ performRoll(20,1,total,"none", a[1]+" save"); });
    var modSpan = document.createElement("span");
    modSpan.className = "row-mod"; modSpan.textContent = fmtMod(total);
    row.appendChild(cb); row.appendChild(name); row.appendChild(modSpan);
    saveRows.appendChild(row);
  });
  saveCard.appendChild(saveRows);
  panel.appendChild(saveCard);

  var skillCard = makeCard("Skills", "tap a skill to roll it · P = proficient, E = expertise");
  var skillRows = document.createElement("div");
  skillRows.className = "list-rows";
  var header = document.createElement("div");
  header.className = "list-row";
  header.style.borderBottom = "1px solid var(--rule)";
  header.innerHTML = '<span style="width:15px;font-size:10px;color:var(--text-on-parch-dim);">P</span>'+
    '<span style="width:15px;font-size:10px;color:var(--text-on-parch-dim);">E</span>'+
    '<span class="row-name" style="font-size:10px;color:var(--text-on-parch-dim);text-transform:uppercase;">Skill</span>'+
    '<span class="abbr"></span><span class="row-mod"></span>';
  skillRows.appendChild(header);
  SKILLS.forEach(function(s){
    var name = s[0], ab = s[1];
    var entry = c.skillProfs[name] || {prof:false, expertise:false};
    var pb = profBonus(c);
    var bonus = mod(c.abilities[ab]) + (entry.expertise ? pb*2 : (entry.prof ? pb : 0));
    var row = document.createElement("div");
    row.className = "list-row";
    var profCb = document.createElement("input");
    profCb.type="checkbox"; profCb.className="chk";
    profCb.checked = !!entry.prof;
    profCb.addEventListener("change", function(){ entry.prof = profCb.checked; c.skillProfs[name]=entry; save(); renderAll(); });
    var expCb = document.createElement("input");
    expCb.type="checkbox"; expCb.className="exp-chk";
    expCb.checked = !!entry.expertise;
    expCb.addEventListener("change", function(){ entry.expertise = expCb.checked; c.skillProfs[name]=entry; save(); renderAll(); });
    var nameSpan = document.createElement("span");
    nameSpan.className = "row-name"; nameSpan.textContent = name;
    nameSpan.addEventListener("click", function(){ performRoll(20,1,bonus,"none", name); });
    var abbr = document.createElement("span");
    abbr.className = "abbr"; abbr.textContent = ab.toUpperCase();
    var modSpan = document.createElement("span");
    modSpan.className = "row-mod"; modSpan.textContent = fmtMod(bonus);
    row.appendChild(profCb); row.appendChild(expCb); row.appendChild(nameSpan); row.appendChild(abbr); row.appendChild(modSpan);
    skillRows.appendChild(row);
  });
  skillCard.appendChild(skillRows);
  panel.appendChild(skillCard);

  var passCard = makeCard("Passive senses");
  var passGrid = document.createElement("div");
  passGrid.className = "passives-grid";
  var pPerc = passivePerception(c);
  var pInv = passiveInvestigation(c);
  var pIns = passiveInsight(c);
  var senses = getCharacterSenses(c);

  [
    { label: "Passive Perception", val: pPerc, sub: "WIS ("+fmtMod(mod(c.abilities.wis))+")" },
    { label: "Passive Investigation", val: pInv, sub: "INT ("+fmtMod(mod(c.abilities.int))+")" },
    { label: "Passive Insight", val: pIns, sub: "WIS ("+fmtMod(mod(c.abilities.wis))+")" },
    { label: "Senses", val: senses, sub: (c.race || "Base race") }
  ].forEach(function(st){
    var box = document.createElement("div");
    box.className = "passive-box";
    var valStyle = typeof st.val === "string" && st.val.length > 8 ? "font-size:15px;line-height:1.3;margin-top:2px;" : "";
    box.innerHTML = '<div class="lbl">' + escapeHtml(st.label) + '</div>' +
      '<div class="val" style="' + valStyle + '">' + escapeHtml(String(st.val)) + '</div>' +
      '<div class="sub">' + escapeHtml(st.sub) + '</div>';
    passGrid.appendChild(box);
  });
  passCard.appendChild(passGrid);
  panel.appendChild(passCard);

  var summaryCard = makeCard("Features & feats summary");
  var allFeats = c.feats || [];
  var allFeatsAndFeatures = getAllCharacterFeatures(c);
  var sumP = document.createElement("p");
  sumP.style.cssText = "font-size:13px;color:var(--text-on-parch);margin:0 0 10px;";
  sumP.innerHTML = "<strong>" + allFeats.length + "</strong> feats and <strong>" + allFeatsAndFeatures.length + "</strong> total features & traits active on this character.";
  summaryCard.appendChild(sumP);

  var goBtn = document.createElement("button");
  goBtn.className = "btn small primary";
  goBtn.textContent = "Manage Feats & Features →";
  goBtn.addEventListener("click", function(){
    state.activeTab = "features";
    renderAll();
  });
  summaryCard.appendChild(goBtn);
  panel.appendChild(summaryCard);

  return panel;
}

/* ---- Features & Feats panel ---- */
var featureCategoryFilter = "all";
var featureSearchQuery = "";
var featSearchQuery = "";

function renderFeaturesPanel(c){
  var panel = document.createElement("div");

  // 1. Passive Senses & Core Defenses Card
  var passCard = makeCard("Passive senses & core stats", "calculated automatically from abilities, proficiencies, and feats");
  var passGrid = document.createElement("div");
  passGrid.className = "passives-grid";

  var pPerc = passivePerception(c);
  var pInv = passiveInvestigation(c);
  var pIns = passiveInsight(c);
  var senses = getCharacterSenses(c);
  var pb = profBonus(c);

  var stats = [
    { label: "Passive Perception", val: pPerc, sub: "10 + WIS (" + fmtMod(mod(c.abilities.wis)) + ") " + (c.skillProfs.Perception && c.skillProfs.Perception.prof ? "+ Prof" : "") },
    { label: "Passive Investigation", val: pInv, sub: "10 + INT (" + fmtMod(mod(c.abilities.int)) + ") " + (c.skillProfs.Investigation && c.skillProfs.Investigation.prof ? "+ Prof" : "") },
    { label: "Passive Insight", val: pIns, sub: "10 + WIS (" + fmtMod(mod(c.abilities.wis)) + ") " + (c.skillProfs.Insight && c.skillProfs.Insight.prof ? "+ Prof" : "") },
    { label: "Senses", val: senses, sub: (c.race || "Base race") },
    { label: "Proficiency Bonus", val: fmtMod(pb), sub: "Level " + totalLevel(c) },
    { label: "Speed", val: (c.speed || 30) + " ft", sub: "Base walk speed" }
  ];

  stats.forEach(function(st){
    var box = document.createElement("div");
    box.className = "passive-box";
    var valStyle = typeof st.val === "string" && st.val.length > 8 ? "font-size:15px;line-height:1.3;margin-top:2px;" : "";
    box.innerHTML = '<div class="lbl">' + escapeHtml(st.label) + '</div>' +
      '<div class="val" style="' + valStyle + '">' + escapeHtml(String(st.val)) + '</div>' +
      '<div class="sub">' + escapeHtml(st.sub) + '</div>';
    passGrid.appendChild(box);
  });
  passCard.appendChild(passGrid);
  panel.appendChild(passCard);

  // 2. Feats Card
  var feats = c.feats || [];
  var featCard = makeCard("Feats (" + feats.length + ")", "special perks and feats chosen for your character");
  
  var featHeader = document.createElement("div");
  featHeader.className = "ff-section-header";
  featHeader.innerHTML = '<span style="font-size:12px;color:var(--text-on-parch-dim);">' +
    (feats.length === 1 ? '1 feat active' : feats.length + ' feats active') + '</span>';
  
  var addFeatBtn = document.createElement("button");
  addFeatBtn.className = "btn small primary";
  addFeatBtn.textContent = "+ Add Feat";
  addFeatBtn.addEventListener("click", function(){
    openFeatPickerModal(c);
  });
  featHeader.appendChild(addFeatBtn);
  featCard.appendChild(featHeader);

  if(feats.length === 0){
    var emptyFeats = document.createElement("div");
    emptyFeats.style.cssText = "text-align:center;padding:24px 12px;background:rgba(255,255,255,0.02);border:1px dashed var(--rule);border-radius:6px;";
    emptyFeats.innerHTML = '<p style="margin:0 0 10px;font-size:13.5px;color:var(--text-on-parch-dim);">No feats added yet.</p>';
    var addFirstFeatBtn = document.createElement("button");
    addFirstFeatBtn.className = "btn small";
    addFirstFeatBtn.textContent = "+ Browse & Add Feats";
    addFirstFeatBtn.addEventListener("click", function(){ openFeatPickerModal(c); });
    emptyFeats.appendChild(addFirstFirstBtnFallback(addFirstFeatBtn));
    featCard.appendChild(emptyFeats);
  } else {
    var featList = document.createElement("div");
    featList.className = "ff-items-list";
    feats.forEach(function(feat, idx){
      var itemCard = document.createElement("div");
      itemCard.className = "ff-item-card";

      var top = document.createElement("div");
      top.className = "ff-item-top";

      var titleGrp = document.createElement("div");
      titleGrp.className = "ff-item-title-group";

      var titleSpan = document.createElement("span");
      titleSpan.className = "ff-item-title";
      titleSpan.textContent = feat.name;
      titleGrp.appendChild(titleSpan);

      var tagSpan = document.createElement("span");
      tagSpan.className = "ff-tag source-feat";
      tagSpan.textContent = feat.source || "Feat";
      titleGrp.appendChild(tagSpan);

      if(feat.category){
        var catSpan = document.createElement("span");
        catSpan.className = "ff-tag";
        catSpan.textContent = feat.category;
        titleGrp.appendChild(catSpan);
      }
      top.appendChild(titleGrp);

      var actions = document.createElement("div");
      actions.className = "ff-actions";

      var editBtn = document.createElement("button");
      editBtn.className = "ff-action-btn";
      editBtn.textContent = "Edit";
      editBtn.title = "Edit feat details";
      editBtn.addEventListener("click", function(){
        openFeatPickerModal(c, feat, idx);
      });
      actions.appendChild(editBtn);

      var delBtn = document.createElement("button");
      delBtn.className = "ff-action-btn danger";
      delBtn.textContent = "Remove";
      delBtn.title = "Remove feat";
      delBtn.addEventListener("click", function(){
        confirmDialog("Remove feat " + feat.name + "?", "Are you sure you want to remove this feat from " + (c.name || "this character") + "?", function(){
          c.feats.splice(idx, 1);
          save();
          renderAll();
        });
      });
      actions.appendChild(delBtn);
      top.appendChild(actions);
      itemCard.appendChild(top);

      if(feat.prerequisite && feat.prerequisite !== "None"){
        var prereq = document.createElement("div");
        prereq.className = "ff-prereq";
        prereq.textContent = "Prerequisite: " + feat.prerequisite;
        itemCard.appendChild(prereq);
      }

      if(feat.description){
        var desc = document.createElement("div");
        desc.className = "ff-desc";
        desc.textContent = feat.description;
        itemCard.appendChild(desc);
      } else if(feat.summary){
        var sum = document.createElement("div");
        sum.className = "ff-desc";
        sum.textContent = feat.summary;
        itemCard.appendChild(sum);
      }

      featList.appendChild(itemCard);
    });
    featCard.appendChild(featList);
  }
  panel.appendChild(featCard);

  // 3. All Features, Traits & Passives Directory Card
  var allFeatures = getAllCharacterFeatures(c);
  var featDirCard = makeCard("Features, traits & passives (" + allFeatures.length + ")", "comprehensive directory of all race, class, background, and custom abilities");

  var dirHeader = document.createElement("div");
  dirHeader.className = "ff-section-header";
  dirHeader.innerHTML = '<span style="font-size:12px;color:var(--text-on-parch-dim);">All active powers & traits</span>';

  var addCustomFeatureBtn = document.createElement("button");
  addCustomFeatureBtn.className = "btn small ghost";
  addCustomFeatureBtn.textContent = "+ Add Custom Feature";
  addCustomFeatureBtn.addEventListener("click", function(){
    openFeatureModal(c);
  });
  dirHeader.appendChild(addCustomFeatureBtn);
  featDirCard.appendChild(dirHeader);

  // Search & Filter controls
  var searchBar = document.createElement("div");
  searchBar.className = "ff-search-bar";
  var searchInput = document.createElement("input");
  searchInput.className = "ff-search-input";
  searchInput.type = "text";
  searchInput.placeholder = "Search all abilities, traits & passives…";
  searchInput.value = featureSearchQuery;
  searchInput.addEventListener("input", function(){
    featureSearchQuery = searchInput.value;
    updateFeatureList();
  });
  searchBar.appendChild(searchInput);
  featDirCard.appendChild(searchBar);

  // Filter pills
  var pillRow = document.createElement("div");
  pillRow.className = "ff-pill-row";
  var categories = [
    { key: "all", label: "All (" + allFeatures.length + ")" },
    { key: "class", label: "Class (" + allFeatures.filter(function(f){ return f.category==="class"; }).length + ")" },
    { key: "race", label: "Racial (" + allFeatures.filter(function(f){ return f.category==="race"; }).length + ")" },
    { key: "background", label: "Background (" + allFeatures.filter(function(f){ return f.category==="background"; }).length + ")" },
    { key: "feat", label: "Feats (" + allFeatures.filter(function(f){ return f.category==="feat"; }).length + ")" },
    { key: "custom", label: "Custom / Passives (" + allFeatures.filter(function(f){ return f.category==="custom" || f.category==="passive"; }).length + ")" }
  ];

  categories.forEach(function(cat){
    var pill = document.createElement("button");
    pill.className = "ff-pill" + (featureCategoryFilter === cat.key ? " active" : "");
    pill.textContent = cat.label;
    pill.addEventListener("click", function(){
      featureCategoryFilter = cat.key;
      var pills = pillRow.querySelectorAll(".ff-pill");
      pills.forEach(function(p){ p.classList.remove("active"); });
      pill.classList.add("active");
      updateFeatureList();
    });
    pillRow.appendChild(pill);
  });
  featDirCard.appendChild(pillRow);

  var featListContainer = document.createElement("div");
  featListContainer.className = "ff-items-list";
  featDirCard.appendChild(featListContainer);

  function updateFeatureList(){
    featListContainer.innerHTML = "";
    var q = (featureSearchQuery || "").toLowerCase().trim();
    var filtered = allFeatures.filter(function(item){
      // Category filter
      if(featureCategoryFilter !== "all"){
        if(featureCategoryFilter === "custom"){
          if(item.category !== "custom" && item.category !== "passive") return false;
        } else if(item.category !== featureCategoryFilter) {
          return false;
        }
      }
      // Search filter
      if(q){
        var matchName = (item.name || "").toLowerCase().indexOf(q) !== -1;
        var matchText = (item.text || "").toLowerCase().indexOf(q) !== -1;
        var matchSource = (item.source || "").toLowerCase().indexOf(q) !== -1;
        if(!matchName && !matchText && !matchSource) return false;
      }
      return true;
    });

    if(filtered.length === 0){
      var emptyDiv = document.createElement("div");
      emptyDiv.style.cssText = "text-align:center;padding:20px;color:var(--text-on-parch-dim);font-size:13px;background:rgba(255,255,255,0.02);border-radius:6px;";
      emptyDiv.textContent = q ? "No features or traits match \"" + q + "\"." : "No features found in this category.";
      featListContainer.appendChild(emptyDiv);
      return;
    }

    filtered.forEach(function(item){
      var card = document.createElement("div");
      card.className = "ff-item-card";

      var top = document.createElement("div");
      top.className = "ff-item-top";

      var titleGrp = document.createElement("div");
      titleGrp.className = "ff-item-title-group";

      var titleSpan = document.createElement("span");
      titleSpan.className = "ff-item-title";
      titleSpan.textContent = item.name;
      titleGrp.appendChild(titleSpan);

      var tagSpan = document.createElement("span");
      var sourceClass = "source-passive";
      if(item.category === "class") sourceClass = "source-class";
      else if(item.category === "race") sourceClass = "source-race";
      else if(item.category === "background") sourceClass = "source-bg";
      else if(item.category === "feat") sourceClass = "source-feat";

      tagSpan.className = "ff-tag " + sourceClass;
      tagSpan.textContent = item.source || "Feature";
      titleGrp.appendChild(tagSpan);

      top.appendChild(titleGrp);

      if(item.isCustom && item.featureObj){
        var actions = document.createElement("div");
        actions.className = "ff-actions";

        var editBtn = document.createElement("button");
        editBtn.className = "ff-action-btn";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function(){
          openFeatureModal(c, item.featureObj);
        });
        actions.appendChild(editBtn);

        var delBtn = document.createElement("button");
        delBtn.className = "ff-action-btn danger";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", function(){
          confirmDialog("Delete " + item.name + "?", "Delete this custom feature?", function(){
            c.features = c.features.filter(function(f){ return f.id !== item.featureObj.id; });
            save();
            renderAll();
          });
        });
        actions.appendChild(delBtn);
        top.appendChild(actions);
      } else if(item.isFeat && item.featObj){
        var actions = document.createElement("div");
        actions.className = "ff-actions";
        var viewFeatBtn = document.createElement("button");
        viewFeatBtn.className = "ff-action-btn";
        viewFeatBtn.textContent = "Edit Feat";
        viewFeatBtn.addEventListener("click", function(){
          var idx = (c.feats||[]).indexOf(item.featObj);
          openFeatPickerModal(c, item.featObj, idx);
        });
        actions.appendChild(viewFeatBtn);
        top.appendChild(actions);
      }

      card.appendChild(top);

      if(item.text){
        var desc = document.createElement("div");
        desc.className = "ff-desc";
        desc.textContent = item.text;
        card.appendChild(desc);
      }

      featListContainer.appendChild(card);
    });
  }

  updateFeatureList();
  panel.appendChild(featDirCard);

  return panel;
}

function addFirstFirstBtnFallback(btn){
  return btn;
}

function openFeatPickerModal(c, featToEdit, featIdx){
  var modal = document.getElementById("feat-modal");
  var body = document.getElementById("feat-modal-body");
  var title = document.getElementById("feat-modal-title");
  title.textContent = featToEdit ? "Edit Feat" : "Add Feat to " + (c.name || "Character");
  body.innerHTML = "";

  var activeModalTab = featToEdit ? "custom" : "browse";
  var selectedCatalogFeat = FEATS_CATALOG[0];
  var catalogSearch = "";

  var tabsBar = document.createElement("div");
  tabsBar.className = "feat-modal-tabs";

  var browseTabBtn = document.createElement("button");
  browseTabBtn.className = "feat-modal-tab-btn" + (activeModalTab === "browse" ? " active" : "");
  browseTabBtn.textContent = "Browse Standard Feats";

  var customTabBtn = document.createElement("button");
  customTabBtn.className = "feat-modal-tab-btn" + (activeModalTab === "custom" ? " active" : "");
  customTabBtn.textContent = featToEdit ? "Edit Feat Details" : "Create Custom Feat";

  tabsBar.appendChild(browseTabBtn);
  tabsBar.appendChild(customTabBtn);
  body.appendChild(tabsBar);

  var contentArea = document.createElement("div");
  body.appendChild(contentArea);

  browseTabBtn.addEventListener("click", function(){
    activeModalTab = "browse";
    browseTabBtn.classList.add("active");
    customTabBtn.classList.remove("active");
    renderBrowseTab();
  });

  customTabBtn.addEventListener("click", function(){
    activeModalTab = "custom";
    customTabBtn.classList.add("active");
    browseTabBtn.classList.remove("active");
    renderCustomTab();
  });

  function renderBrowseTab(){
    contentArea.innerHTML = "";

    var searchRow = document.createElement("div");
    searchRow.className = "ff-search-bar";
    var sInput = document.createElement("input");
    sInput.className = "ff-search-input";
    sInput.type = "text";
    sInput.placeholder = "Filter standard feats by name, benefit, prerequisite…";
    sInput.value = catalogSearch;
    searchRow.appendChild(sInput);
    contentArea.appendChild(searchRow);

    var split = document.createElement("div");
    split.className = "feat-catalog-split";

    var listCol = document.createElement("div");
    listCol.className = "feat-catalog-list";

    var previewCol = document.createElement("div");
    previewCol.className = "feat-catalog-preview";

    split.appendChild(listCol);
    split.appendChild(previewCol);
    contentArea.appendChild(split);

    function updatePreview(feat){
      selectedCatalogFeat = feat;
      previewCol.innerHTML = "";
      if(!feat){
        previewCol.innerHTML = '<div style="color:var(--text-on-parch-dim);font-size:13px;text-align:center;margin:auto;">Select a feat to view details.</div>';
        return;
      }
      var isAdded = (c.feats || []).some(function(f){ return f.name.toLowerCase() === feat.name.toLowerCase(); });

      var topPart = document.createElement("div");
      var h5 = document.createElement("h4");
      h5.style.cssText = "margin:0 0 6px;font-family:var(--serif);color:var(--brass-bright);font-size:18px;";
      h5.textContent = feat.name;
      topPart.appendChild(h5);

      var metaDiv = document.createElement("div");
      metaDiv.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px;";
      if(feat.category){
        var catSpan = document.createElement("span");
        catSpan.className = "ff-tag";
        catSpan.textContent = feat.category;
        metaDiv.appendChild(catSpan);
      }
      if(feat.prerequisite && feat.prerequisite !== "None"){
        var prereqSpan = document.createElement("span");
        prereqSpan.style.cssText = "font-size:11px;color:var(--text-on-parch-dim);font-style:italic;";
        prereqSpan.textContent = "Requires: " + feat.prerequisite;
        metaDiv.appendChild(prereqSpan);
      }
      topPart.appendChild(metaDiv);

      var descP = document.createElement("div");
      descP.style.cssText = "font-size:12.5px;line-height:1.45;color:var(--text-on-parch);white-space:pre-line;margin-bottom:12px;max-height:220px;overflow-y:auto;";
      descP.textContent = feat.description || feat.summary;
      topPart.appendChild(descP);
      previewCol.appendChild(topPart);

      var btnPart = document.createElement("div");
      btnPart.style.cssText = "margin-top:10px;padding-top:10px;border-top:1px solid var(--rule);display:flex;align-items:center;justify-content:space-between;gap:8px;";
      
      var statusSpan = document.createElement("span");
      statusSpan.style.cssText = "font-size:11.5px;color:var(--text-on-parch-dim);";
      statusSpan.textContent = isAdded ? "✓ Currently on character" : "";
      btnPart.appendChild(statusSpan);

      var addBtn = document.createElement("button");
      addBtn.className = "btn primary";
      addBtn.textContent = isAdded ? "+ Add Again" : "+ Add Feat";
      addBtn.addEventListener("click", function(){
        if(!c.feats) c.feats = [];
        c.feats.push({
          id: uid(),
          name: feat.name,
          prerequisite: feat.prerequisite || "None",
          category: feat.category || "General",
          summary: feat.summary || "",
          description: feat.description || "",
          source: "SRD"
        });
        save();
        renderAll();
        modal.classList.remove("open");
      });
      btnPart.appendChild(addBtn);
      previewCol.appendChild(btnPart);
    }

    function updateCatalogList(){
      listCol.innerHTML = "";
      var q = (catalogSearch || "").toLowerCase().trim();
      var filtered = FEATS_CATALOG.filter(function(f){
        if(q){
          var mName = f.name.toLowerCase().indexOf(q) !== -1;
          var mSumm = (f.summary || "").toLowerCase().indexOf(q) !== -1;
          var mDesc = (f.description || "").toLowerCase().indexOf(q) !== -1;
          var mPre = (f.prerequisite || "").toLowerCase().indexOf(q) !== -1;
          var mCat = (f.category || "").toLowerCase().indexOf(q) !== -1;
          if(!mName && !mSumm && !mDesc && !mPre && !mCat) return false;
        }
        return true;
      });

      if(filtered.length === 0){
        listCol.innerHTML = '<div style="padding:16px;text-align:center;font-size:12.5px;color:var(--text-on-parch-dim);">No standard feats match.</div>';
        updatePreview(null);
        return;
      }

      filtered.forEach(function(feat){
        var item = document.createElement("div");
        item.className = "feat-catalog-item" + (selectedCatalogFeat && selectedCatalogFeat.name === feat.name ? " selected" : "");
        
        var isAdded = (c.feats || []).some(function(f){ return f.name.toLowerCase() === feat.name.toLowerCase(); });
        
        item.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span class="feat-catalog-name">' + escapeHtml(feat.name) + '</span>' +
          (isAdded ? '<span class="ff-tag" style="background:rgba(90,164,105,0.2);color:#86efac;border-color:rgba(90,164,105,0.4);">Added</span>' : '') +
          '</div>' +
          '<div class="feat-catalog-summary">' + escapeHtml(feat.summary || feat.prerequisite || "") + '</div>';
        
        item.addEventListener("click", function(){
          var items = listCol.querySelectorAll(".feat-catalog-item");
          items.forEach(function(it){ it.classList.remove("selected"); });
          item.classList.add("selected");
          updatePreview(feat);
        });
        listCol.appendChild(item);
      });

      if(selectedCatalogFeat && filtered.some(function(f){ return f.name === selectedCatalogFeat.name; })){
        updatePreview(selectedCatalogFeat);
      } else if(filtered.length > 0){
        updatePreview(filtered[0]);
      } else {
        updatePreview(null);
      }
    }

    sInput.addEventListener("input", function(){
      catalogSearch = sInput.value;
      updateCatalogList();
    });

    updateCatalogList();
  }

  function renderCustomTab(){
    contentArea.innerHTML = "";
    var form = document.createElement("div");
    form.style.cssText = "display:flex;flex-direction:column;gap:12px;padding:4px 0;";

    var nameField = document.createElement("div");
    nameField.className = "field";
    nameField.innerHTML = '<label>Feat Name *</label>';
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "e.g. Shield Slam, Fey-Touched, Shadow Walker…";
    nameInput.value = featToEdit ? featToEdit.name : "";
    nameField.appendChild(nameInput);
    form.appendChild(nameField);

    var row = document.createElement("div");
    row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";

    var prereqField = document.createElement("div");
    prereqField.className = "field";
    prereqField.innerHTML = '<label>Prerequisite (optional)</label>';
    var prereqInput = document.createElement("input");
    prereqInput.type = "text";
    prereqInput.placeholder = "e.g. Strength 13+, Spellcasting, None";
    prereqInput.value = featToEdit ? (featToEdit.prerequisite || "") : "";
    prereqField.appendChild(prereqInput);
    row.appendChild(prereqField);

    var catField = document.createElement("div");
    catField.className = "field";
    catField.innerHTML = '<label>Category</label>';
    var catSelect = document.createElement("select");
    ["Combat","Defense","Magic","Utility","Support","Movement","Social","General"].forEach(function(cat){
      var opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      if(featToEdit && featToEdit.category === cat) opt.selected = true;
      catSelect.appendChild(opt);
    });
    catField.appendChild(catSelect);
    row.appendChild(catField);
    form.appendChild(row);

    var descField = document.createElement("div");
    descField.className = "field";
    descField.innerHTML = '<label>Description / Benefits *</label>';
    var descTextarea = document.createElement("textarea");
    descTextarea.className = "freeform";
    descTextarea.style.minHeight = "120px";
    descTextarea.placeholder = "Describe the perks, mechanics, stat bonuses, or actions granted by this feat…";
    descTextarea.value = featToEdit ? (featToEdit.description || featToEdit.summary || "") : "";
    descField.appendChild(descTextarea);
    form.appendChild(descField);

    var actionsRow = document.createElement("div");
    actionsRow.className = "actions";
    actionsRow.style.marginTop = "10px";

    var cancelBtn = document.createElement("button");
    cancelBtn.className = "btn ghost";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", function(){ modal.classList.remove("open"); });

    var saveBtn = document.createElement("button");
    saveBtn.className = "btn primary";
    saveBtn.textContent = featToEdit ? "Save Changes" : "Add Feat to Character";
    saveBtn.addEventListener("click", function(){
      var nameVal = (nameInput.value || "").trim();
      if(!nameVal){
        alert("Please enter a feat name.");
        nameInput.focus();
        return;
      }
      if(!c.feats) c.feats = [];
      if(featToEdit && featIdx != null && c.feats[featIdx]){
        c.feats[featIdx].name = nameVal;
        c.feats[featIdx].prerequisite = (prereqInput.value || "").trim() || "None";
        c.feats[featIdx].category = catSelect.value;
        c.feats[featIdx].description = descTextarea.value;
      } else {
        c.feats.push({
          id: uid(),
          name: nameVal,
          prerequisite: (prereqInput.value || "").trim() || "None",
          category: catSelect.value,
          description: descTextarea.value,
          source: "Custom"
        });
      }
      save();
      renderAll();
      modal.classList.remove("open");
    });

    actionsRow.appendChild(cancelBtn);
    actionsRow.appendChild(saveBtn);
    form.appendChild(actionsRow);
    contentArea.appendChild(form);
  }

  if(activeModalTab === "browse") renderBrowseTab();
  else renderCustomTab();

  modal.classList.add("open");

  var closeBtn = document.getElementById("feat-modal-close");
  function onClose(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", onClose);
  }
  closeBtn.addEventListener("click", onClose);
}

function openFeatureModal(c, featureToEdit){
  var modal = document.getElementById("feature-modal");
  var body = document.getElementById("feature-modal-body");
  var title = document.getElementById("feature-modal-title");
  title.textContent = featureToEdit ? "Edit Feature / Passive" : "Add Custom Feature / Passive";
  body.innerHTML = "";

  var form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;padding:4px 0;";

  var nameField = document.createElement("div");
  nameField.className = "field";
  nameField.innerHTML = '<label>Feature Name *</label>';
  var nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "e.g. Relentless Rage, Darkvision, Fey Gift, Shield of Faith passive…";
  nameInput.value = featureToEdit ? featureToEdit.name : "";
  nameField.appendChild(nameInput);
  form.appendChild(nameField);

  var row = document.createElement("div");
  row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";

  var srcField = document.createElement("div");
  srcField.className = "field";
  srcField.innerHTML = '<label>Source / Category</label>';
  var srcSelect = document.createElement("select");
  ["Class","Race","Background","Passive","Feat","Magic Item","Other"].forEach(function(src){
    var opt = document.createElement("option");
    opt.value = src;
    opt.textContent = src;
    if(featureToEdit && featureToEdit.source === src) opt.selected = true;
    srcSelect.appendChild(opt);
  });
  srcField.appendChild(srcSelect);
  row.appendChild(srcField);

  var passField = document.createElement("div");
  passField.className = "field";
  passField.style.display = "flex";
  passField.style.flexDirection = "column";
  passField.style.justifyContent = "center";
  passField.innerHTML = '<label>Type</label>';
  var passLabel = document.createElement("label");
  passLabel.style.cssText = "display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-top:4px;";
  var passCb = document.createElement("input");
  passCb.type = "checkbox";
  passCb.className = "chk";
  passCb.checked = featureToEdit ? !!featureToEdit.isPassive : true;
  passLabel.appendChild(passCb);
  passLabel.appendChild(document.createTextNode("Passive ability / constant trait"));
  passField.appendChild(passLabel);
  row.appendChild(passField);

  form.appendChild(row);

  var descField = document.createElement("div");
  descField.className = "field";
  descField.innerHTML = '<label>Description / Mechanics *</label>';
  var descTextarea = document.createElement("textarea");
  descTextarea.className = "freeform";
  descTextarea.style.minHeight = "120px";
  descTextarea.placeholder = "Describe the feature, rules, passive bonuses, or activation details…";
  descTextarea.value = featureToEdit ? (featureToEdit.text || "") : "";
  descField.appendChild(descTextarea);
  form.appendChild(descField);

  var actionsRow = document.createElement("div");
  actionsRow.className = "actions";
  actionsRow.style.marginTop = "10px";

  var cancelBtn = document.createElement("button");
  cancelBtn.className = "btn ghost";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", function(){ modal.classList.remove("open"); });

  var saveBtn = document.createElement("button");
  saveBtn.className = "btn primary";
  saveBtn.textContent = featureToEdit ? "Save Changes" : "Add Feature";
  saveBtn.addEventListener("click", function(){
    var nameVal = (nameInput.value || "").trim();
    if(!nameVal){
      alert("Please enter a feature name.");
      nameInput.focus();
      return;
    }
    if(!c.features) c.features = [];
    if(featureToEdit){
      featureToEdit.name = nameVal;
      featureToEdit.source = srcSelect.value;
      featureToEdit.isPassive = passCb.checked;
      featureToEdit.text = descTextarea.value;
    } else {
      c.features.push({
        id: uid(),
        name: nameVal,
        source: srcSelect.value,
        isPassive: passCb.checked,
        text: descTextarea.value
      });
    }
    save();
    renderAll();
    modal.classList.remove("open");
  });

  actionsRow.appendChild(cancelBtn);
  actionsRow.appendChild(saveBtn);
  form.appendChild(actionsRow);

  body.appendChild(form);
  modal.classList.add("open");

  var closeBtn = document.getElementById("feature-modal-close");
  function onClose(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", onClose);
  }
  closeBtn.addEventListener("click", onClose);
}

/* ---- Spells panel ---- */
function renderSpellsPanel(c){
  var panel = document.createElement("div");

  var scCard = makeCard("Spellcasting");
  var row = document.createElement("div");
  row.className = "grid-row";
  var abField = document.createElement("div");
  var pb = profBonus(c);
  var scMod = mod(c.abilities[c.spellcasting.ability]);
  abField.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Spellcasting ability</label><br>';
  var sel = document.createElement("select");
  ["int","wis","cha"].forEach(function(a){
    var o = document.createElement("option"); o.value=a; o.textContent = a.toUpperCase();
    if(c.spellcasting.ability===a) o.selected = true;
    sel.appendChild(o);
  });
  sel.style.padding="4px"; sel.style.border="1px solid var(--rule)"; sel.style.borderRadius="4px"; sel.style.background="var(--field-bg)"; sel.style.color="var(--text-on-parch)";
  sel.addEventListener("change", function(){ c.spellcasting.ability = sel.value; save(); renderAll(); });
  abField.appendChild(sel);
  row.appendChild(abField);

  var dcBox = document.createElement("div");
  dcBox.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Save DC</label><br>'+
    '<span style="font-family:var(--serif);font-size:20px;">'+(8+pb+scMod)+'</span>';
  row.appendChild(dcBox);

  var atkBox = document.createElement("div");
  atkBox.style.cursor="pointer";
  atkBox.title = "Click to roll a spell attack";
  atkBox.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Attack bonus</label><br>'+
    '<span style="font-family:var(--serif);font-size:20px;">'+fmtMod(pb+scMod)+'</span>';
  atkBox.addEventListener("click", function(){ performRoll(20,1,pb+scMod,"none","Spell attack"); });
  row.appendChild(atkBox);
  scCard.appendChild(row);
  panel.appendChild(scCard);

  var slotCard = makeCard("Spell slots", "click a filled dot to mark used, an empty one to restore");
  var slotGrid = document.createElement("div");
  slotGrid.className = "slot-grid";
  for(var lvl=1;lvl<=9;lvl++){
    (function(lvl){
      var s = c.spellcasting.slots[lvl];
      var box = document.createElement("div");
      box.className = "slot-box";
      box.innerHTML = '<div class="lbl">Level '+lvl+'</div>';
      var frac = document.createElement("div");
      frac.className = "fraction";
      var usedInput = document.createElement("input");
      usedInput.type="number"; usedInput.value = s.used; usedInput.min="0";
      usedInput.addEventListener("input", function(){ s.used = clamp(Number(usedInput.value)||0,0,s.max); save(); });
      var slash = document.createElement("span"); slash.textContent="/";
      var maxInput = document.createElement("input");
      maxInput.type="number"; maxInput.value = s.max; maxInput.min="0";
      maxInput.addEventListener("input", function(){ s.max = Math.max(0,Number(maxInput.value)||0); s.used = clamp(s.used,0,s.max); save(); renderAll(); });
      frac.appendChild(usedInput); frac.appendChild(slash); frac.appendChild(maxInput);
      box.appendChild(frac);
      var useBtn = document.createElement("button");
      useBtn.className = "btn small"; useBtn.style.marginTop="4px"; useBtn.style.width="100%";
      useBtn.textContent = "Use slot";
      useBtn.disabled = s.used>=s.max;
      useBtn.addEventListener("click", function(){ if(s.used<s.max){ s.used++; save(); renderAll(); } });
      box.appendChild(useBtn);
      slotGrid.appendChild(box);
    })(lvl);
  }
  slotCard.appendChild(slotGrid);
  panel.appendChild(slotCard);

  var spellCard = makeCard("Known / prepared spells");
  var table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = '<thead><tr><th class="col-tight">Lv</th><th>Name</th><th class="col-tight">Prep?</th><th>Notes</th><th></th></tr></thead>';
  var tbody = document.createElement("tbody");
  (c.spells||[]).forEach(function(sp, idx){
    var tr = document.createElement("tr");
    var lvlTd = document.createElement("td");
    var lvlInput = document.createElement("input"); lvlInput.type="number"; lvlInput.min="0"; lvlInput.max="9"; lvlInput.value = sp.level||0;
    lvlInput.addEventListener("input", function(){ sp.level = Number(lvlInput.value)||0; save(); });
    lvlTd.appendChild(lvlInput);
    var nameTd = document.createElement("td");
    var nameInput = document.createElement("input"); nameInput.type="text"; nameInput.value = sp.name||""; nameInput.placeholder="Spell name";
    nameInput.addEventListener("input", function(){ sp.name = nameInput.value; save(); });
    nameTd.appendChild(nameInput);
    var prepTd = document.createElement("td");
    var prepCb = document.createElement("input"); prepCb.type="checkbox"; prepCb.className="chk"; prepCb.checked = !!sp.prepared;
    prepCb.addEventListener("change", function(){ sp.prepared = prepCb.checked; save(); });
    prepTd.appendChild(prepCb);
    var notesTd = document.createElement("td");
    var notesInput = document.createElement("input"); notesInput.type="text"; notesInput.value = sp.notes||""; notesInput.placeholder="range, duration, effect…";
    notesInput.addEventListener("input", function(){ sp.notes = notesInput.value; save(); });
    notesTd.appendChild(notesInput);
    var rmTd = document.createElement("td");
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.addEventListener("click", function(){ c.spells.splice(idx,1); save(); renderAll(); });
    rmTd.appendChild(rmBtn);
    tr.appendChild(lvlTd); tr.appendChild(nameTd); tr.appendChild(prepTd); tr.appendChild(notesTd); tr.appendChild(rmTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  spellCard.appendChild(table);
  var addSpellBtn = document.createElement("button");
  addSpellBtn.className = "btn small"; addSpellBtn.style.marginTop="10px";
  addSpellBtn.style.color="var(--text-on-parch)"; addSpellBtn.style.borderColor="var(--rule)";
  addSpellBtn.textContent = "+ Add spell";
  addSpellBtn.addEventListener("click", function(){
    c.spells.push({level:0, name:"", prepared:false, notes:""});
    save(); renderAll();
  });
  spellCard.appendChild(addSpellBtn);
  panel.appendChild(spellCard);

  return panel;
}

/* ---- Inventory panel ---- */
function renderInventoryPanel(c){
  var panel = document.createElement("div");

  var curCard = makeCard("Currency");
  var curGrid = document.createElement("div");
  curGrid.className = "currency-grid";

  var coins = [
    { key: "cp", name: "Copper", abbr: "CP" },
    { key: "sp", name: "Silver", abbr: "SP" },
    { key: "ep", name: "Electrum", abbr: "EP" },
    { key: "gp", name: "Gold", abbr: "GP" },
    { key: "pp", name: "Platinum", abbr: "PP" }
  ];

  if(!c.currency) c.currency = {cp:0, sp:0, ep:0, gp:0, pp:0};

  coins.forEach(function(coin){
    var box = document.createElement("div");
    box.className = "currency-box currency-" + coin.key;

    var header = document.createElement("div");
    header.className = "currency-header";
    header.innerHTML = '<span class="currency-abbr">'+coin.abbr+'</span><span class="currency-name">'+coin.name+'</span>';
    box.appendChild(header);

    var curVal = Number(c.currency[coin.key]) || 0;

    var stepper = document.createElement("div");
    stepper.className = "stat-stepper currency-stepper";

    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "stat-arrow-btn stat-arrow-down";
    downBtn.title = "Decrease " + coin.name;
    downBtn.setAttribute("aria-label", "Decrease " + coin.name);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = curVal <= 0;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var v = Number(c.currency[coin.key]) || 0;
      c.currency[coin.key] = Math.max(0, v - 1);
      save(); renderAll();
    });

    var valSpan = document.createElement("span");
    valSpan.className = "stat-score-val currency-val";
    valSpan.textContent = curVal;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "stat-arrow-btn stat-arrow-up";
    upBtn.title = "Increase " + coin.name;
    upBtn.setAttribute("aria-label", "Increase " + coin.name);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var v = Number(c.currency[coin.key]) || 0;
      c.currency[coin.key] = v + 1;
      save(); renderAll();
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(valSpan);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    curGrid.appendChild(box);
  });
  curCard.appendChild(curGrid);

  var totalGold = ((Number(c.currency.cp)||0)*0.01) +
                  ((Number(c.currency.sp)||0)*0.1) +
                  ((Number(c.currency.ep)||0)*0.5) +
                  ((Number(c.currency.gp)||0)*1.0) +
                  ((Number(c.currency.pp)||0)*10.0);

  var totalCoins = (Number(c.currency.cp)||0) +
                   (Number(c.currency.sp)||0) +
                   (Number(c.currency.ep)||0) +
                   (Number(c.currency.gp)||0) +
                   (Number(c.currency.pp)||0);
  var coinWeight = (totalCoins / 50).toFixed(1);

  var curSummary = document.createElement("div");
  curSummary.className = "currency-summary";
  curSummary.innerHTML = '<span>Total Wealth: <strong>' + totalGold.toFixed(2) + ' GP</strong></span>' +
                         '<span class="currency-weight-hint">Purse weight: ~' + coinWeight + ' lb (' + totalCoins + ' coins)</span>';
  curCard.appendChild(curSummary);

  panel.appendChild(curCard);

  var invCard = makeCard("Items & equipment");
  var table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = '<thead><tr><th>Item</th><th class="col-tight">Qty</th><th class="col-tight">Wt</th><th class="col-tight">On?</th><th>Notes</th><th></th></tr></thead>';
  var tbody = document.createElement("tbody");
  (c.inventory||[]).forEach(function(item, idx){
    var tr = document.createElement("tr");
    var nameTd = document.createElement("td");
    var nameInput = document.createElement("input"); nameInput.type="text"; nameInput.value = item.name||""; nameInput.placeholder="Item name";
    nameInput.addEventListener("input", function(){ item.name = nameInput.value; save(); });
    nameTd.appendChild(nameInput);
    var qtyTd = document.createElement("td");
    var qtyInput = document.createElement("input"); qtyInput.type="number"; qtyInput.value = item.qty!=null?item.qty:1; qtyInput.min="0";
    qtyInput.addEventListener("input", function(){ item.qty = Number(qtyInput.value)||0; save(); renderAll(); });
    qtyTd.appendChild(qtyInput);
    var wtTd = document.createElement("td");
    var wtInput = document.createElement("input"); wtInput.type="number"; wtInput.value = item.weight||0; wtInput.min="0"; wtInput.step="0.1";
    wtInput.addEventListener("input", function(){ item.weight = Number(wtInput.value)||0; save(); renderAll(); });
    wtTd.appendChild(wtInput);
    var eqTd = document.createElement("td");
    var eqCb = document.createElement("input"); eqCb.type="checkbox"; eqCb.className="chk"; eqCb.checked = !!item.equipped;
    eqCb.addEventListener("change", function(){ item.equipped = eqCb.checked; save(); });
    eqTd.appendChild(eqCb);
    var notesTd = document.createElement("td");
    var notesInput = document.createElement("input"); notesInput.type="text"; notesInput.value = item.notes||""; notesInput.placeholder="attack bonus, damage, etc.";
    notesInput.addEventListener("input", function(){ item.notes = notesInput.value; save(); });
    notesTd.appendChild(notesInput);
    var rmTd = document.createElement("td");
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.addEventListener("click", function(){ c.inventory.splice(idx,1); save(); renderAll(); });
    rmTd.appendChild(rmBtn);
    tr.appendChild(nameTd); tr.appendChild(qtyTd); tr.appendChild(wtTd); tr.appendChild(eqTd); tr.appendChild(notesTd); tr.appendChild(rmTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  invCard.appendChild(table);

  var totalWeight = (c.inventory||[]).reduce(function(a,i){ return a + (Number(i.weight)||0)*(Number(i.qty)||0); },0);
  var capacity = (Number(c.abilities.str)||10) * 15;
  var wtP = document.createElement("p");
  wtP.style.fontSize="12px"; wtP.style.color="var(--text-on-parch-dim)"; wtP.style.marginTop="10px";
  wtP.textContent = "Total weight: "+totalWeight.toFixed(1)+" lb  ·  Carry capacity (STR×15): "+capacity+" lb";
  invCard.appendChild(wtP);

  var addItemBtn = document.createElement("button");
  addItemBtn.className = "btn small"; addItemBtn.style.marginTop="10px";
  addItemBtn.style.color="var(--text-on-parch)"; addItemBtn.style.borderColor="var(--rule)";
  addItemBtn.textContent = "+ Add item";
  addItemBtn.addEventListener("click", function(){
    c.inventory.push({name:"", qty:1, weight:0, equipped:false, notes:""});
    save(); renderAll();
  });
  invCard.appendChild(addItemBtn);
  panel.appendChild(invCard);

  return panel;
}

/* ---- Journal panel ---- */
function renderJournalPanel(c){
  var panel = document.createElement("div");
  var card = makeCard("Journal", "notes, session recaps, plans — kept only on this device");

  var addBtn = document.createElement("button");
  addBtn.className = "btn small primary"; addBtn.style.marginBottom="12px";
  addBtn.textContent = "+ New entry";
  addBtn.addEventListener("click", function(){
    c.notes.unshift({ts: nowStamp(), text:""});
    save(); renderAll();
  });
  card.appendChild(addBtn);

  (c.notes||[]).forEach(function(entry, idx){
    var e = document.createElement("div");
    e.className = "journal-entry";
    var tsRow = document.createElement("div");
    tsRow.style.display="flex"; tsRow.style.justifyContent="space-between"; tsRow.style.alignItems="center";
    var ts = document.createElement("span"); ts.className="ts"; ts.textContent = entry.ts;
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.addEventListener("click", function(){ c.notes.splice(idx,1); save(); renderAll(); });
    tsRow.appendChild(ts); tsRow.appendChild(rmBtn);
    e.appendChild(tsRow);
    var ta = document.createElement("textarea");
    ta.value = entry.text||"";
    ta.placeholder = "Write here…";
    ta.addEventListener("input", function(){ entry.text = ta.value; save(); });
    e.appendChild(ta);
    card.appendChild(e);
  });
  if((c.notes||[]).length===0){
    var p = document.createElement("p");
    p.style.fontSize="13px"; p.style.color="var(--text-on-parch-dim)";
    p.textContent = "No entries yet.";
    card.appendChild(p);
  }
  panel.appendChild(card);
  return panel;
}

/* ---------------- Character Creation Wizard ---------------- */
var WIZARD_STEP_IDS = ["class","race","background","alignment","abilities","skills","equipment","spells","review"];
var wizardState = null;

function currentClassInfo(){ return wizardState && CLASSES_INFO[wizardState.classId]; }

function isStepApplicable(id){
  if(id==="spells"){
    var info = currentClassInfo();
    return !!(info && info.spellcaster);
  }
  return true;
}

function wizardStepTitle(id){
  return {
    class:"Choose a Class", race:"Choose a Race", background:"Choose a Background",
    alignment:"Choose an Alignment",
    abilities:"Ability Scores", skills:"Skills & Proficiencies", equipment:"Starting Equipment",
    spells:"Spells", review:"Review & Finish"
  }[id];
}

function abilityFullName(key){
  var found = ABILITIES.find(function(a){ return a[0]===key; });
  return found ? found[1] : key;
}

function wizardStepIndex(){ return WIZARD_STEP_IDS.indexOf(wizardState.step); }

function goStep(delta){
  var idx = wizardStepIndex();
  var next = idx;
  do{
    next += delta;
  } while(next>=0 && next<WIZARD_STEP_IDS.length && !isStepApplicable(WIZARD_STEP_IDS[next]));
  if(next<0 || next>=WIZARD_STEP_IDS.length) return;
  wizardState.step = WIZARD_STEP_IDS[next];
  renderWizard();
}

function validateStep(id){
  var info = currentClassInfo();
  if(id==="class") return (wizardState.classId && info && info.available) ? null : "Pick an available class to continue.";
  if(id==="race") return wizardState.race ? null : "Pick a race to continue.";
  if(id==="background") return wizardState.background ? null : "Pick a background to continue.";
  if(id==="alignment") return wizardState.alignment ? null : "Pick an alignment to continue.";
  if(id==="abilities"){
    if(!wizardState.abilityMethod) return "Pick a method for generating ability scores.";
    if(wizardState.abilityMethod!=="pointbuy"){
      var allAssigned = ABILITIES.every(function(a){ return wizardState.assignIdx[a[0]]!=null; });
      if(!allAssigned) return "Assign a score to every ability.";
    }
    return null;
  }
  if(id==="skills"){
    return wizardState.skillChoices.length===info.skillChoices.count ? null : "Choose "+info.skillChoices.count+" skills.";
  }
  if(id==="equipment"){
    var ok = info.equipment.choiceGroups.every(function(g,gi){ return wizardState.equipment[gi]!=null; });
    return ok ? null : "Make a choice for each equipment option.";
  }
  if(id==="review"){
    return (wizardState.name && wizardState.name.trim()) ? null : "Give your character a name before creating them.";
  }
  return null;
}

function openWizard(){
  wizardState = {
    step:"class", name:"", classId:null, race:"", background:"", alignment:"",
    abilityMethod:null,
    abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    assignIdx:{str:null,dex:null,con:null,int:null,wis:null,cha:null},
    pointBuy:{str:8,dex:8,con:8,int:8,wis:8,cha:8},
    rolledPool:null,
    skillChoices:[],
    equipment:{}
  };
  closeSidebarMobile();
  document.getElementById("wizard-overlay").classList.add("open");
  renderWizard();
}

function requestCloseWizard(){
  if(!wizardState || !wizardState.classId){
    document.getElementById("wizard-overlay").classList.remove("open");
    return;
  }
  confirmDialog("Discard this character?", "Your in-progress choices will be lost.", function(){
    document.getElementById("wizard-overlay").classList.remove("open");
  });
}

function setAbilityMethod(method){
  wizardState.abilityMethod = method;
  wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
  wizardState.pointBuy = {str:8,dex:8,con:8,int:8,wis:8,cha:8};
  wizardState.rolledPool = null;
  wizardState.abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  renderWizard();
}

function rollAbilityScore(){
  var rolls = [];
  for(var i=0;i<4;i++) rolls.push(1+Math.floor(Math.random()*6));
  rolls.sort(function(a,b){ return b-a; });
  return rolls[0]+rolls[1]+rolls[2];
}
function rollSixAbilityScores(){
  var arr = [];
  for(var i=0;i<6;i++) arr.push(rollAbilityScore());
  return arr;
}

function syncAbilitiesFromAssignment(pool){
  ABILITIES.forEach(function(a){
    var idx = wizardState.assignIdx[a[0]];
    wizardState.abilities[a[0]] = idx!=null ? pool[idx] : 10;
  });
}

function wizardAssignAbilities(container, pool){
  var grid = ce("div","abilities-grid");
  ABILITIES.forEach(function(a){
    var key = a[0];
    var usedIdx = wizardState.assignIdx[key];
    var box = ce("div","ability-box");
    box.style.cursor = "default";
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div>';
    var sel = document.createElement("select");
    sel.style.cssText = "border:1px solid var(--rule);border-radius:4px;background:var(--field-bg);color:var(--text-on-parch);padding:2px;font-size:12.5px;";
    var blank = document.createElement("option"); blank.value=""; blank.textContent="—";
    sel.appendChild(blank);
    pool.forEach(function(val, pi){
      var takenBy = Object.keys(wizardState.assignIdx).find(function(k2){ return wizardState.assignIdx[k2]===pi; });
      if(takenBy && takenBy!==key) return;
      var o = document.createElement("option");
      o.value = pi; o.textContent = val;
      if(usedIdx===pi) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function(){
      wizardState.assignIdx[key] = sel.value==="" ? null : Number(sel.value);
      syncAbilitiesFromAssignment(pool);
      renderWizard();
    });
    box.appendChild(sel);
    var modDiv = document.createElement("div"); modDiv.className="mod";
    modDiv.textContent = usedIdx!=null ? fmtMod(mod(pool[usedIdx])) : "—";
    box.appendChild(modDiv);
    grid.appendChild(box);
  });
  container.appendChild(grid);
}

function wizardPointBuyUI(container){
  var totalPoints = 27;
  var spent = ABILITIES.reduce(function(sum,a){ return sum + POINT_BUY_COSTS[wizardState.pointBuy[a[0]]]; },0);
  var remaining = totalPoints - spent;
  var remainP = document.createElement("p");
  remainP.style.cssText = "font-size:13px;margin-bottom:10px;color:var(--text-on-parch-dim);";
  remainP.innerHTML = "Points remaining: <strong style='color:var(--text-on-parch)'>"+remaining+"</strong> / "+totalPoints;
  container.appendChild(remainP);

  var grid = ce("div","abilities-grid");
  ABILITIES.forEach(function(a){
    var key = a[0];
    var score = wizardState.pointBuy[key];
    var box = ce("div","ability-box");
    box.style.cursor = "default";
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(mod(score))+'</div>';

    var stepper = ce("div", "stat-stepper");

    var downBtn = ce("button", "stat-arrow-btn stat-arrow-down");
    downBtn.type = "button";
    downBtn.title = "Decrease " + a[1] + " (Down arrow)";
    downBtn.setAttribute("aria-label", "Decrease " + a[1]);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = score <= 8;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      wizardState.pointBuy[key] = score - 1;
      wizardState.abilities[key] = score - 1;
      renderWizard();
    });

    var val = ce("span", "stat-score-val");
    val.textContent = score;

    var upBtn = ce("button", "stat-arrow-btn stat-arrow-up");
    upBtn.type = "button";
    upBtn.title = "Increase " + a[1] + " (Up arrow)";
    upBtn.setAttribute("aria-label", "Increase " + a[1]);
    upBtn.innerHTML = makeStatArrowSvg("up");
    var nextCost = POINT_BUY_COSTS[score + 1];
    upBtn.disabled = score >= 15 || nextCost === undefined || (nextCost - POINT_BUY_COSTS[score]) > remaining;
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      wizardState.pointBuy[key] = score + 1;
      wizardState.abilities[key] = score + 1;
      renderWizard();
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(val);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    grid.appendChild(box);
  });
  container.appendChild(grid);
}

function raceExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Race affects your ability score bonuses and grants special traits like darkvision or resistances. Pick one to see what it does.";
  return "<b>"+escapeHtml(name)+":</b> "+(RACE_TRAITS[name] || RACE_TRAIT_FALLBACK);
}

function backgroundExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Your background grants two skill proficiencies (and usually a tool or language) that reflect your life before adventuring.";
  var info = BACKGROUND_INFO[name];
  return "<b>"+escapeHtml(name)+":</b> "+(info ? info.blurb : BACKGROUND_INFO_FALLBACK);
}

function alignmentExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Alignment describes your character's moral compass and attitude toward society, order, and other creatures.";
  var info = ALIGNMENT_INFO[name];
  return "<b>"+escapeHtml(name)+":</b> "+escapeHtml(info || ALIGNMENT_INFO_FALLBACK);
}

function wizardStepClass(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Class</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class is the biggest driver of how your character plays — it sets your main ability score, hit points, and what you're good at in and out of combat.";
  card.appendChild(explain);

  var grid = ce("div","class-pick-grid");
  CLASS_LIST.forEach(function(name){
    var info = CLASSES_INFO[name];
    var box = ce("div","class-pick-card"+(info.available?"":" disabled"));
    if(wizardState.classId===name) box.classList.add("selected");
    box.innerHTML = "<h4>"+escapeHtml(name)+"</h4><p>"+escapeHtml(info.blurb)+"</p>"+(info.available?"":"<span class='soon'>Coming soon</span>");
    if(info.available){
      box.addEventListener("click", function(){ wizardState.classId = name; renderWizard(); });
    }
    grid.appendChild(box);
  });
  card.appendChild(grid);
  container.appendChild(card);
}

function wizardStepRace(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Race</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = raceExplainHtml(wizardState.race);
  card.appendChild(explain);

  var dd = dropdownField("Race", "race", RACES, wizardState, function(){
    explain.innerHTML = raceExplainHtml(wizardState.race);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

function wizardStepBackground(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Background</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = backgroundExplainHtml(wizardState.background);
  card.appendChild(explain);

  var dd = dropdownField("Background", "background", BACKGROUNDS, wizardState, function(){
    explain.innerHTML = backgroundExplainHtml(wizardState.background);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

function wizardStepAlignment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose an Alignment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = alignmentExplainHtml(wizardState.alignment);
  card.appendChild(explain);

  var dd = dropdownField("Alignment", "alignment", ALIGNMENTS, wizardState, function(){
    explain.innerHTML = alignmentExplainHtml(wizardState.alignment);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

function wizardStepAbilities(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Ability Scores</span></h3>";
  var info = currentClassInfo();
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> These six scores drive almost everything you roll. As a "+escapeHtml(wizardState.classId)+", <b>"+abilityFullName(info.primaryAbility)+"</b> matters most — prioritize it if you can.";
  card.appendChild(explain);

  var methodRow = ce("div","wiz-method-row");
  [
    ["array","Standard Array","Fixed set: 15, 14, 13, 12, 10, 8 — simplest, balanced."],
    ["pointbuy","Point Buy","Spend 27 points to customize scores from 8–15 — most flexible."],
    ["roll","Roll","Roll 4d6 (drop lowest) six times — random, can be stronger or weaker."]
  ].forEach(function(m){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn wiz-method-btn"+(wizardState.abilityMethod===m[0]?" primary":"");
    btn.innerHTML = "<strong>"+m[1]+"</strong><br><span style='font-size:11px;opacity:.8;'>"+m[2]+"</span>";
    btn.addEventListener("click", function(){ setAbilityMethod(m[0]); });
    methodRow.appendChild(btn);
  });
  card.appendChild(methodRow);

  if(wizardState.abilityMethod==="array"){
    wizardAssignAbilities(card, [15,14,13,12,10,8]);
  } else if(wizardState.abilityMethod==="roll"){
    if(!wizardState.rolledPool){
      var rollBtn = document.createElement("button");
      rollBtn.type="button"; rollBtn.className="btn primary small"; rollBtn.textContent="🎲 Roll 6 scores";
      rollBtn.addEventListener("click", function(){
        wizardState.rolledPool = rollSixAbilityScores();
        wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
        renderWizard();
      });
      card.appendChild(rollBtn);
    } else {
      var poolP = document.createElement("p");
      poolP.style.cssText = "font-size:13px;margin:10px 0;";
      poolP.textContent = "Rolled: "+wizardState.rolledPool.join(", ");
      card.appendChild(poolP);
      wizardAssignAbilities(card, wizardState.rolledPool);
      var reroll = document.createElement("button");
      reroll.type="button"; reroll.className="btn small ghost"; reroll.style.marginTop="10px"; reroll.textContent="Reroll";
      reroll.addEventListener("click", function(){
        wizardState.rolledPool = rollSixAbilityScores();
        wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
        renderWizard();
      });
      card.appendChild(reroll);
    }
  } else if(wizardState.abilityMethod==="pointbuy"){
    wizardPointBuyUI(card);
  }

  container.appendChild(card);
}

function wizardStepSkills(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Skills & Proficiencies</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Skills add your proficiency bonus to certain checks. Your class and background each grant some — you don't pick from all 18, just the ones you're allowed.";
  card.appendChild(explain);

  var bgInfo = BACKGROUND_INFO[wizardState.background];
  if(bgInfo && bgInfo.skills && bgInfo.skills.length){
    var bgP = document.createElement("p");
    bgP.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);margin-bottom:12px;";
    bgP.innerHTML = "From your <b>"+escapeHtml(wizardState.background)+"</b> background: "+bgInfo.skills.join(", ")+" (automatic).";
    card.appendChild(bgP);
  }

  var info = currentClassInfo();
  var label = document.createElement("p");
  label.style.cssText = "font-size:13px;margin-bottom:8px;";
  label.textContent = "Choose "+info.skillChoices.count+" from your class list:";
  card.appendChild(label);

  var rows = ce("div","list-rows");
  info.skillChoices.options.forEach(function(sk){
    var row = ce("div","list-row wiz-pick-row");
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk";
    var checked = wizardState.skillChoices.indexOf(sk)!==-1;
    cb.checked = checked;
    var full = !checked && wizardState.skillChoices.length>=info.skillChoices.count;
    cb.disabled = full;
    if(full) row.classList.add("disabled");
    var name = document.createElement("span"); name.className="row-name"; name.textContent = sk;
    row.appendChild(cb); row.appendChild(name);
    rows.appendChild(row);

    // The whole row is the tap target, not just the small checkbox — matters
    // most on touchscreens. Clicking the checkbox itself already toggles it
    // (native behavior fires first), so only toggle manually when the click
    // landed elsewhere on the row.
    row.addEventListener("click", function(e){
      if(cb.disabled) return;
      if(e.target!==cb) cb.checked = !cb.checked;
      if(cb.checked){
        if(wizardState.skillChoices.length>=info.skillChoices.count){ cb.checked=false; return; }
        wizardState.skillChoices.push(sk);
      } else {
        wizardState.skillChoices = wizardState.skillChoices.filter(function(x){ return x!==sk; });
      }
      renderWizard();
    });
  });
  card.appendChild(rows);
  container.appendChild(card);
}

function wizardStepEquipment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Starting Equipment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class gives you a choice of starting gear instead of buying everything piece by piece — pick what fits how you want to fight.";
  card.appendChild(explain);

  var info = currentClassInfo();
  info.equipment.choiceGroups.forEach(function(group, gi){
    var groupTitle = document.createElement("p");
    groupTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    groupTitle.textContent = "Choice "+String.fromCharCode(65+gi);
    card.appendChild(groupTitle);
    group.options.forEach(function(opt){
      var row = ce("div","wiz-equip-option");
      if(wizardState.equipment[gi]===opt.key) row.classList.add("selected");
      row.innerHTML = "<div><strong>"+escapeHtml(opt.label)+"</strong><br><span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(opt.detail||"")+"</span></div>";
      row.addEventListener("click", function(){
        wizardState.equipment[gi] = opt.key;
        renderWizard();
      });
      card.appendChild(row);
    });
  });

  if(info.equipment.fixed.length){
    var fixedTitle = document.createElement("p");
    fixedTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    fixedTitle.textContent = "Always included";
    card.appendChild(fixedTitle);
    var fixedP = document.createElement("p");
    fixedP.style.fontSize = "13px";
    fixedP.textContent = info.equipment.fixed.map(function(i){ return i.qty>1 ? i.qty+"× "+i.name : i.name; }).join(", ");
    card.appendChild(fixedP);
  }

  container.appendChild(card);
}

function wizardStepSpells(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Spells</span></h3><p style='font-size:13px;color:var(--text-on-parch-dim);'>Spellcasting setup for this class hasn't been built yet.</p>";
  container.appendChild(card);
}

function wizardStepReview(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Review & Finish</span></h3>";

  var nameWrap = document.createElement("div");
  nameWrap.style.cssText = "margin-bottom:16px;";
  nameWrap.innerHTML = "<label style='font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-on-parch-dim);display:block;margin-bottom:3px;'>Character name <span style='color:var(--oxblood);'>*</span> required</label>";
  var nameInput = document.createElement("input");
  nameInput.id = "wiz-name-input";
  nameInput.value = wizardState.name; nameInput.placeholder = "e.g. Ragnar";
  nameInput.style.cssText = "width:100%;max-width:320px;background:transparent;border:none;border-bottom:1px solid var(--rule);color:var(--text-on-parch);font-family:var(--serif);font-size:20px;padding:4px 0;";
  nameInput.addEventListener("input", function(){
    wizardState.name = nameInput.value;
    nameInput.classList.remove("wiz-invalid");
    var errBox = document.getElementById("wizard-error");
    if(errBox) errBox.classList.remove("show");
  });
  nameWrap.appendChild(nameInput);

  var ideaWrap = ce("div","wiz-name-ideas");
  var ideaLabel = document.createElement("span");
  ideaLabel.textContent = "Need ideas? ";
  ideaWrap.appendChild(ideaLabel);
  function renderIdeaChips(){
    ideaWrap.querySelectorAll(".wiz-name-chip").forEach(function(el){ el.remove(); });
    pickNameIdeas(4).forEach(function(idea){
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "btn small ghost wiz-name-chip";
      chip.textContent = idea;
      chip.addEventListener("click", function(){
        wizardState.name = idea;
        nameInput.value = idea;
        nameInput.classList.remove("wiz-invalid");
        var errBox = document.getElementById("wizard-error");
        if(errBox) errBox.classList.remove("show");
      });
      ideaWrap.appendChild(chip);
    });
    var shuffleBtn = document.createElement("button");
    shuffleBtn.type = "button";
    shuffleBtn.className = "btn small ghost wiz-name-chip";
    shuffleBtn.textContent = "🎲 More ideas";
    shuffleBtn.addEventListener("click", renderIdeaChips);
    ideaWrap.appendChild(shuffleBtn);
  }
  renderIdeaChips();
  nameWrap.appendChild(ideaWrap);

  card.appendChild(nameWrap);

  var info = currentClassInfo();
  var conMod = mod(wizardState.abilities.con), dexMod = mod(wizardState.abilities.dex);
  var hp = HIT_DICE_BY_CLASS[wizardState.classId] + conMod;
  var ac = 10 + dexMod + conMod;

  var rows = ce("div","list-rows");
  function row(label, val){
    var r = ce("div","list-row");
    var l = document.createElement("span"); l.className="row-name"; l.textContent = label;
    var v = document.createElement("span"); v.style.fontWeight="600"; v.textContent = val;
    r.appendChild(l); r.appendChild(v);
    rows.appendChild(r);
  }
  row("Class", wizardState.classId+" (level 1)");
  row("Race", wizardState.race);
  row("Background", wizardState.background);
  row("Alignment", wizardState.alignment || "—");
  row("Ability scores", ABILITIES.map(function(a){ return a[1].slice(0,3).toUpperCase()+" "+wizardState.abilities[a[0]]; }).join("  "));
  row("Hit points", hp+" (d"+HIT_DICE_BY_CLASS[wizardState.classId]+" + CON "+fmtMod(conMod)+")");
  row("Armor Class", ac+" (Unarmored Defense: 10 + DEX + CON)");
  row("Saving throws", info.savingThrows.map(function(k){ return k.toUpperCase(); }).join(", "));
  row("Skills", wizardState.skillChoices.concat((BACKGROUND_INFO[wizardState.background]||{}).skills||[]).join(", ") || "—");
  card.appendChild(rows);

  var featTitle = document.createElement("p");
  featTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
  featTitle.textContent = "Level 1 features";
  card.appendChild(featTitle);
  info.features.forEach(function(f){
    var p = document.createElement("p");
    p.style.cssText = "font-size:13px;margin:0 0 8px;";
    p.innerHTML = "<strong>"+escapeHtml(f.name)+":</strong> "+escapeHtml(f.text);
    card.appendChild(p);
  });

  container.appendChild(card);
}

function buildEquipmentList(info, chosenKeys){
  var items = [];
  info.equipment.choiceGroups.forEach(function(group, gi){
    var opt = group.options.find(function(o){ return o.key===chosenKeys[gi]; });
    if(opt){
      opt.items.forEach(function(it){
        items.push({name:it.name, qty:it.qty, weight:it.weight, equipped:true, notes:it.notes||""});
      });
    }
  });
  info.equipment.fixed.forEach(function(it){
    items.push({name:it.name, qty:it.qty, weight:it.weight, equipped:false, notes:it.notes||""});
  });
  return items;
}

function finishWizard(){
  var w = wizardState;
  var info = CLASSES_INFO[w.classId];
  var c = newCharacter((w.name||"").trim());
  c.race = w.race;
  c.background = w.background;
  c.alignment = w.alignment;
  c.classes = [{name:w.classId, subclass:"", level:1}];
  c.abilities = {str:w.abilities.str, dex:w.abilities.dex, con:w.abilities.con, int:w.abilities.int, wis:w.abilities.wis, cha:w.abilities.cha};
  info.savingThrows.forEach(function(k){ c.saveProfs[k] = true; });
  w.skillChoices.forEach(function(sk){ c.skillProfs[sk] = {prof:true, expertise:false}; });
  var bgInfo = BACKGROUND_INFO[w.background];
  if(bgInfo && bgInfo.skills){
    bgInfo.skills.forEach(function(sk){
      var entry = c.skillProfs[sk] || {prof:false, expertise:false};
      entry.prof = true;
      c.skillProfs[sk] = entry;
    });
  }
  c.features = [];
  c.feats = [];
  var conMod = mod(c.abilities.con), dexMod = mod(c.abilities.dex);
  c.hp.max = HIT_DICE_BY_CLASS[w.classId] + conMod;
  c.hp.current = c.hp.max;
  c.ac = 10 + dexMod + conMod;
  c.inventory = buildEquipmentList(info, w.equipment);

  state.characters.push(c);
  state.activeId = c.id;
  state.activeTab = "vitals";
  save();
  document.getElementById("wizard-overlay").classList.remove("open");
  renderAll();
}

function renderWizard(){
  var overlay = document.getElementById("wizard-overlay");
  overlay.innerHTML = "";

  var header = ce("div"); header.id = "wizard-header";
  var h2 = document.createElement("h2"); h2.textContent = "New Character — "+wizardStepTitle(wizardState.step);
  var closeBtn = document.createElement("button"); closeBtn.className = "btn small ghost"; closeBtn.textContent = "✕ Cancel";
  closeBtn.addEventListener("click", requestCloseWizard);
  header.appendChild(h2); header.appendChild(closeBtn);
  overlay.appendChild(header);

  var progress = ce("div"); progress.id = "wizard-progress";
  var applicableSteps = WIZARD_STEP_IDS.filter(isStepApplicable);
  var curPos = applicableSteps.indexOf(wizardState.step);
  applicableSteps.forEach(function(id, i){
    var dot = ce("div","wiz-dot");
    if(i<curPos) dot.classList.add("done");
    if(i===curPos) dot.classList.add("current");
    progress.appendChild(dot);
  });
  overlay.appendChild(progress);

  var body = ce("div"); body.id = "wizard-body";
  var inner = ce("div"); inner.id = "wizard-body-inner";
  body.appendChild(inner);
  overlay.appendChild(body);

  var renderers = {
    class: wizardStepClass, race: wizardStepRace, background: wizardStepBackground,
    alignment: wizardStepAlignment,
    abilities: wizardStepAbilities, skills: wizardStepSkills, equipment: wizardStepEquipment,
    spells: wizardStepSpells, review: wizardStepReview
  };
  renderers[wizardState.step](inner);

  var errorBox = ce("div","wiz-error"); errorBox.id = "wizard-error";
  overlay.appendChild(errorBox);

  var footer = ce("div"); footer.id = "wizard-footer";
  var backBtn = document.createElement("button");
  backBtn.className = "btn ghost"; backBtn.textContent = "← Back";
  backBtn.disabled = wizardStepIndex()===0;
  backBtn.addEventListener("click", function(){ goStep(-1); });
  var nextBtn = document.createElement("button");
  nextBtn.className = "btn primary";
  nextBtn.textContent = wizardState.step==="review" ? "Create Character" : "Next →";
  nextBtn.addEventListener("click", function(){
    var err = validateStep(wizardState.step);
    if(err){
      errorBox.textContent = "⚠ "+err;
      errorBox.classList.add("show");
      if(wizardState.step==="review"){
        var nameEl = document.getElementById("wiz-name-input");
        if(nameEl){ nameEl.classList.add("wiz-invalid"); nameEl.focus(); }
      }
      return;
    }
    errorBox.classList.remove("show");
    if(wizardState.step==="review"){ finishWizard(); return; }
    goStep(1);
  });
  footer.appendChild(backBtn); footer.appendChild(nextBtn);
  overlay.appendChild(footer);
}

/* ---------------- Dice tray & Smooth Animations ---------------- */
var advMode = "none"; // none | adv | dis
var lastRollConfig = null;
var rollAnimationTimers = [];
var toastTimer = null;

function getDieSvg(die, value){
  var valStr = value != null ? String(value) : "?";
  if(die === 4){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,10 92,84 8,84"/><line class="die-facet" x1="50" y1="10" x2="50" y2="58"/><line class="die-facet" x1="92" y1="84" x2="50" y2="58"/><line class="die-facet" x1="8" y1="84" x2="50" y2="58"/><text class="die-text" x="50" y="68">'+valStr+'</text></svg>';
  }
  if(die === 6){
    return '<svg viewBox="0 0 100 100"><rect class="die-bg" x="12" y="12" width="76" height="76" rx="14"/><rect class="die-facet" x="22" y="22" width="56" height="56" rx="8"/><text class="die-text" x="50" y="52">'+valStr+'</text></svg>';
  }
  if(die === 8){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,8 90,50 50,92 10,50"/><line class="die-facet" x1="50" y1="8" x2="50" y2="92"/><line class="die-facet" x1="10" y1="50" x2="90" y2="50"/><polygon class="die-facet" points="50,26 74,50 50,74 26,50"/><text class="die-text" x="50" y="52">'+valStr+'</text></svg>';
  }
  if(die === 10 || die === 100){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,6 90,40 50,94 10,40"/><line class="die-facet" x1="50" y1="6" x2="50" y2="94"/><polyline class="die-facet" points="10,40 50,56 90,40"/><text class="die-text" x="50" y="47">'+valStr+'</text></svg>';
  }
  if(die === 12){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,8 88,22 95,64 64,94 36,94 5,64 12,22"/><polygon class="die-facet" points="50,30 74,48 65,76 35,76 26,48"/><text class="die-text" x="50" y="53">'+valStr+'</text></svg>';
  }
  // default / d20
  return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,6 88,28 88,72 50,94 12,72 12,28"/><polygon class="die-facet" points="50,22 78,70 22,70"/><line class="die-facet" x1="50" y1="6" x2="50" y2="22"/><line class="die-facet" x1="88" y1="28" x2="78" y2="70"/><line class="die-facet" x1="88" y1="72" x2="50" y2="94"/><line class="die-facet" x1="12" y1="72" x2="50" y2="94"/><line class="die-facet" x1="12" y1="28" x2="22" y2="70"/><text class="die-text" x="50" y="52">'+valStr+'</text></svg>';
}

function clearRollTimers(){
  rollAnimationTimers.forEach(function(t){
    clearInterval(t);
    clearTimeout(t);
  });
  rollAnimationTimers = [];
}

function animateNumberCount(el, targetVal, duration){
  var start = 0;
  var startTime = performance.now();
  var animFrame = function(currentTime){
    var progress = Math.min((currentTime - startTime) / duration, 1);
    var ease = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(start + (targetVal - start) * ease);
    el.textContent = current;
    if(progress < 1){
      requestAnimationFrame(animFrame);
    } else {
      el.textContent = targetVal;
    }
  };
  requestAnimationFrame(animFrame);
}

function showFloatingToast(die, finalTotal, summary, label, isCrit, isFail){
  var toast = document.getElementById("floating-roll-toast");
  if(!toast) return;
  if(toastTimer){ clearTimeout(toastTimer); toastTimer = null; }

  var titleText = label || ("d" + die + " Roll");
  var dieSvg = getDieSvg(die, finalTotal);

  var badgeHtml = "";
  if(isCrit) badgeHtml = '<span class="crit-badge crit-success" style="font-size:9.5px;padding:2px 6px;">NAT 20</span>';
  else if(isFail) badgeHtml = '<span class="crit-badge crit-fail" style="font-size:9.5px;padding:2px 6px;">NAT 1</span>';

  toast.innerHTML = '<div class="toast-die-mini">' + dieSvg + '</div>' +
    '<div class="toast-info">' +
      '<div class="toast-title">' + escapeHtml(titleText) + ' ' + badgeHtml + '</div>' +
      '<div class="toast-total">' + finalTotal + '</div>' +
      '<div class="toast-detail">' + escapeHtml(summary) + '</div>' +
    '</div>';

  toast.classList.add("show");
  toast.onclick = function(){
    toast.classList.remove("show");
    openDiceTray();
  };

  toastTimer = setTimeout(function(){
    toast.classList.remove("show");
  }, 3200);
}

function performRoll(die, qty, modifier, adv, label){
  lastRollConfig = { die: die, qty: qty, modifier: modifier, adv: adv, label: label };
  clearRollTimers();

  var isAdvDis = (die === 20 && adv !== "none" && qty === 1);
  var diceCount = isAdvDis ? 2 : qty;
  var finalValues = [];
  var chosenValue = 0;
  var droppedIdx = -1;
  var isCrit = false;
  var isFail = false;
  var finalTotal = 0;
  var summary = "";
  var showsTotal = false;

  if(isAdvDis){
    var r1 = Math.floor(Math.random() * 20) + 1;
    var r2 = Math.floor(Math.random() * 20) + 1;
    finalValues = [r1, r2];
    var chosenIdx = (adv === "adv") ? (r1 >= r2 ? 0 : 1) : (r1 <= r2 ? 0 : 1);
    droppedIdx = (chosenIdx === 0) ? 1 : 0;
    chosenValue = finalValues[chosenIdx];
    finalTotal = chosenValue + modifier;
    if(chosenValue === 20) isCrit = true;
    if(chosenValue === 1) isFail = true;
    summary = "[" + r1 + ", " + r2 + "] " + (adv === "adv" ? "adv" : "dis") + " → " + chosenValue + (modifier ? " " + fmtMod(modifier) : "");
    showsTotal = true;
  } else {
    var sum = 0;
    for(var i = 0; i < qty; i++){
      var r = Math.floor(Math.random() * die) + 1;
      finalValues.push(r);
      sum += r;
    }
    finalTotal = sum + modifier;
    if(die === 20 && qty === 1){
      if(finalValues[0] === 20) isCrit = true;
      if(finalValues[0] === 1) isFail = true;
    }
    summary = "[" + finalValues.join(", ") + "]" + (modifier ? " " + fmtMod(modifier) : "");
    showsTotal = finalValues.length > 1 || !!modifier;
  }

  var full = showsTotal ? summary + " = " + finalTotal : summary;

  // Render dice tokens in the animation stage
  var stage = document.getElementById("dice-stage");
  stage.innerHTML = "";

  var tokenElements = [];
  for(var d = 0; d < diceCount; d++){
    var wrapper = document.createElement("div");
    wrapper.className = "dice-token-wrapper";
    var token = document.createElement("div");
    token.className = "dice-token rolling";
    token.innerHTML = getDieSvg(die, Math.floor(Math.random() * die) + 1);
    wrapper.appendChild(token);
    stage.appendChild(wrapper);
    tokenElements.push({ wrapper: wrapper, token: token, targetVal: finalValues[d], index: d });
  }

  var resultEl = document.getElementById("roll-result");
  var badgeSlot = document.getElementById("roll-badge-slot");
  var detailEl = document.getElementById("roll-detail");
  var rollAgainBtn = document.getElementById("roll-again-btn");

  resultEl.textContent = "…";
  resultEl.classList.remove("result-pop");
  badgeSlot.innerHTML = "";
  detailEl.textContent = (label ? label + ": " : "") + "Rolling…";
  rollAgainBtn.style.display = "none";

  // Rapidly cycle random numbers during roll animation
  var cycleInterval = setInterval(function(){
    tokenElements.forEach(function(item){
      if(item.token.classList.contains("rolling")){
        var textNode = item.token.querySelector(".die-text");
        if(textNode){
          textNode.textContent = Math.floor(Math.random() * die) + 1;
        }
      }
    });
  }, 45);
  rollAnimationTimers.push(cycleInterval);

  // Settle dice with smooth staggered timing
  var rollDuration = 480;
  tokenElements.forEach(function(item, idx){
    var settleDelay = rollDuration + (idx * 60);
    var timer = setTimeout(function(){
      item.token.classList.remove("rolling");
      item.token.classList.add("settled");
      item.token.title = "Tap to roll again";
      item.token.onclick = function(){
        if(lastRollConfig){
          performRoll(lastRollConfig.die, lastRollConfig.qty, lastRollConfig.modifier, lastRollConfig.adv, lastRollConfig.label);
        }
      };
      var textNode = item.token.querySelector(".die-text");
      if(textNode){
        textNode.textContent = item.targetVal;
      }

      // Check nat 20 / nat 1
      if(die === 20){
        if(item.targetVal === 20){
          item.token.classList.add("nat-20");
        } else if(item.targetVal === 1){
          item.token.classList.add("nat-1");
        }
      }

      // Advantage/Disadvantage dropped vs kept tags
      if(isAdvDis){
        var tag = document.createElement("span");
        tag.className = "die-status-tag";
        if(idx === droppedIdx){
          item.token.classList.add("die-dropped");
          tag.className += " tag-dropped";
          tag.textContent = "Dropped";
        } else {
          tag.className += " tag-kept";
          tag.textContent = "Kept";
        }
        item.wrapper.appendChild(tag);
      }
    }, settleDelay);
    rollAnimationTimers.push(timer);
  });

  // Final settlement of total result & breakdown
  var totalDelay = rollDuration + ((diceCount - 1) * 60) + 80;
  var finalTimer = setTimeout(function(){
    clearInterval(cycleInterval);

    resultEl.classList.add("result-pop");
    animateNumberCount(resultEl, finalTotal, 220);

    // Critical Hit / Miss badge
    if(isCrit){
      badgeSlot.innerHTML = '<span class="crit-badge crit-success">✨ Natural 20 — Critical Hit! ✨</span>';
    } else if(isFail){
      badgeSlot.innerHTML = '<span class="crit-badge crit-fail">💀 Natural 1 — Critical Miss! 💀</span>';
    }

    detailEl.textContent = (label ? label + ": " : "") + summary;
    rollAgainBtn.style.display = "inline-flex";

    logRoll(label || ("d" + die), full);
  }, totalDelay);
  rollAnimationTimers.push(finalTimer);

  var tray = document.getElementById("dice-tray");
  if(tray.classList.contains("open")){
    // already open, rolls inside tray seamlessly
  } else {
    // Show smooth floating toast on screen
    showFloatingToast(die, finalTotal, summary, label, isCrit, isFail);
  }
}

function logRoll(label, detail){
  var c = getActive();
  var entry = {ts: nowStamp(), label: label, detail: detail};
  if(c){
    c.rollLog = c.rollLog || [];
    c.rollLog.unshift(entry);
    c.rollLog = c.rollLog.slice(0,25);
    save();
  }
  renderRollLog();
}

function renderRollLog(){
  var c = getActive();
  var el = document.getElementById("roll-log");
  if(!el) return;
  el.innerHTML = "";
  var logArr = c && c.rollLog ? c.rollLog : [];
  if(logArr.length === 0){
    el.innerHTML = '<div style="font-size:11px;color:var(--text-on-ink-dim);font-style:italic;padding:4px 0;">No rolls yet</div>';
    return;
  }
  logArr.forEach(function(entry){
    var d = document.createElement("div");
    d.innerHTML = '<span class="rl-label">'+escapeHtml(entry.label)+'</span> — '+escapeHtml(entry.detail);
    el.appendChild(d);
  });
}

function openDiceTray(){
  var tray = document.getElementById("dice-tray");
  tray.classList.add("open");
  renderRollLog();
}
function closeDiceTray(){
  document.getElementById("dice-tray").classList.remove("open");
}
function toggleDiceTray(){
  var tray = document.getElementById("dice-tray");
  if(tray.classList.contains("open")){
    closeDiceTray();
  } else {
    openDiceTray();
  }
}

function setupDiceTray(){
  document.getElementById("dice-fab").addEventListener("click", toggleDiceTray);
  document.getElementById("dice-tray-close").addEventListener("click", closeDiceTray);

  // Capture phase so clicking rolls outside doesn't immediately dismiss
  document.addEventListener("click", function(e){
    var tray = document.getElementById("dice-tray");
    if(!tray.classList.contains("open")) return;
    var fab = document.getElementById("dice-fab");
    var toast = document.getElementById("floating-roll-toast");
    if(tray.contains(e.target) || fab.contains(e.target) || (toast && toast.contains(e.target))) return;
    // Don't close if clicked on a rollable sheet element
    if(e.target.closest && (e.target.closest(".stat-box") || e.target.closest(".skill-row") || e.target.closest(".save-row") || e.target.closest(".feat-item"))) return;
    closeDiceTray();
  }, true);

  document.addEventListener("keydown", function(e){
    if(e.key==="Escape") closeDiceTray();
  });

  // Die buttons
  document.querySelectorAll(".die-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      var die = Number(btn.getAttribute("data-die"));
      var qty = clamp(Number(document.getElementById("dice-qty").value)||1, 1, 20);
      var modv = Number(document.getElementById("dice-mod").value)||0;
      btn.classList.add("rolling-active");
      setTimeout(function(){ btn.classList.remove("rolling-active"); }, 400);
      performRoll(die, qty, modv, die===20 ? advMode : "none", null);
    });
  });

  // Steppers for Qty and Mod
  var qtyInput = document.getElementById("dice-qty");
  var modInput = document.getElementById("dice-mod");

  document.getElementById("qty-inc").addEventListener("click", function(){
    var v = clamp((Number(qtyInput.value) || 1) + 1, 1, 20);
    qtyInput.value = v;
  });
  document.getElementById("qty-dec").addEventListener("click", function(){
    var v = clamp((Number(qtyInput.value) || 1) - 1, 1, 20);
    qtyInput.value = v;
  });
  document.getElementById("mod-inc").addEventListener("click", function(){
    var v = clamp((Number(modInput.value) || 0) + 1, -50, 50);
    modInput.value = v;
  });
  document.getElementById("mod-dec").addEventListener("click", function(){
    var v = clamp((Number(modInput.value) || 0) - 1, -50, 50);
    modInput.value = v;
  });

  // Reset button
  var resetBtn = document.getElementById("dice-reset");
  if(resetBtn){
    resetBtn.addEventListener("click", function(){
      qtyInput.value = 1;
      modInput.value = 0;
      advMode = "none";
      var advBtns = {
        none: document.getElementById("adv-normal"),
        adv: document.getElementById("adv-adv"),
        dis: document.getElementById("adv-dis")
      };
      Object.keys(advBtns).forEach(function(kk){
        if(advBtns[kk]) advBtns[kk].classList.toggle("on", kk === "none");
      });
    });
  }

  // Roll again button
  var rollAgainBtn = document.getElementById("roll-again-btn");
  if(rollAgainBtn){
    rollAgainBtn.addEventListener("click", function(){
      if(lastRollConfig){
        performRoll(lastRollConfig.die, lastRollConfig.qty, lastRollConfig.modifier, lastRollConfig.adv, lastRollConfig.label);
      }
    });
  }

  // Clear log button
  var clearLogBtn = document.getElementById("clear-log-btn");
  if(clearLogBtn){
    clearLogBtn.addEventListener("click", function(){
      var c = getActive();
      if(c){
        c.rollLog = [];
        save();
      }
      renderRollLog();
    });
  }

  // Advantage buttons
  var advBtns = {
    none: document.getElementById("adv-normal"),
    adv: document.getElementById("adv-adv"),
    dis: document.getElementById("adv-dis")
  };
  Object.keys(advBtns).forEach(function(k){
    if(advBtns[k]){
      advBtns[k].addEventListener("click", function(){
        advMode = k;
        Object.keys(advBtns).forEach(function(kk){
          if(advBtns[kk]) advBtns[kk].classList.toggle("on", kk === k);
        });
      });
    }
  });
}

/* ---------------- Sidebar mobile toggle ---------------- */
function closeSidebarMobile(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
}
function setupMobileNav(){
  document.getElementById("hamburger").addEventListener("click", function(){
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("scrim").classList.add("show");
  });
  document.getElementById("scrim").addEventListener("click", closeSidebarMobile);
}

/* ---------------- Confirm modal ---------------- */
function confirmDialog(title, body, onConfirm){
  var modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  modal.classList.add("open");
  function cleanup(){
    modal.classList.remove("open");
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
  }
  var okBtn = document.getElementById("confirm-ok");
  var cancelBtn = document.getElementById("confirm-cancel");
  function onOk(){ cleanup(); onConfirm(); }
  function onCancel(){ cleanup(); }
  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
}

/* ---------------- Top-level actions ---------------- */
function setupTopLevel(){
  document.getElementById("new-char-btn").addEventListener("click", openWizard);

  document.getElementById("export-btn").addEventListener("click", function(){
    var blob = new Blob([JSON.stringify(state.characters, null, 2)], {type:"application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ragnars-den-backup-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  });

  document.getElementById("import-btn").addEventListener("click", function(){
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", function(e){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var data = JSON.parse(reader.result);
        if(!Array.isArray(data)) throw new Error("Invalid format");
        confirmDialog(
          "Import backup?",
          "This will add "+data.length+" character(s) from the backup file to your current vault. Existing characters are kept.",
          function(){
            data.forEach(function(c){
              c.id = uid(); // avoid collisions
              ensureShape(c);
              state.characters.push(c);
            });
            save();
            renderAll();
          }
        );
      }catch(err){
        alert("That file doesn't look like a valid Ragnar's Den backup.");
      }
      document.getElementById("import-file").value = "";
    };
    reader.readAsText(file);
  });
}

/* ---------------- Delete character ---------------- */
/* Rendered inline at the end of the identity block's classes row. */
function makeDeleteButton(c){
  var btn = document.createElement("button");
  btn.className = "btn small danger";
  btn.textContent = "Delete character";
  btn.addEventListener("click", function(){
    confirmDialog("Delete "+(c.name||"this character")+"?", "This cannot be undone. Consider exporting a backup first.", function(){
      state.characters = state.characters.filter(function(x){ return x.id!==c.id; });
      state.activeId = state.characters.length ? state.characters[0].id : null;
      if(state.activeId) state.activeTab = "vitals";
      save();
      renderAll();
    });
  });
  return btn;
}

/* ---------------- Init ---------------- */
function init(){
  load();
  state.characters.forEach(ensureShape);
  if(state.characters.length && !state.activeId){
    state.activeId = state.characters[0].id;
  }
  setupTopLevel();
  setupDiceTray();
  setupMobileNav();
  renderAll();

  if("serviceWorker" in navigator){
    // When an updated service worker takes control, reload once so the
    // page picks up the fresh HTML/CSS/JS instead of the previous cache.
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if(hadController){ hadController = false; window.location.reload(); }
    });
    navigator.serviceWorker.register("sw.js").catch(function(){ /* offline-first, fine if this fails */ });
  }
}

document.addEventListener("DOMContentLoaded", init);
})();