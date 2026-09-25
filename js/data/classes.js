import { CLASS_LIST } from "./abilities-skills.js";

/* ---------------- Character Creation Wizard data ----------------
   Barbarian, Cleric, Fighter, Rogue, Sorcerer, Warlock and Wizard have a
   fully guided creation experience right now. The other classes appear
   (with a one-line blurb) so the class list reads as complete, but are
   marked unavailable until they are built out the same way. */
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

export var CLASSES_INFO = {};
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
        {key:"greataxe", label:"Greataxe", detail:"1d12 slashing damage, heavy, two-handed", items:[
          {name:"Greataxe",qty:1,weight:7,notes:"heavy, two-handed",type:"weapon",damageDice:"1d12",damageType:"Slashing",ability:"str",proficient:true}
        ]},
        {key:"martial", label:"Any other martial melee weapon", detail:"Pick the specific weapon once you're on the sheet", items:[
          {name:"Martial melee weapon",qty:1,weight:6,notes:"choose specific weapon, then fill in its damage dice",type:"weapon",ability:"str",proficient:true}
        ]}
      ]},
      {options:[
        {key:"handaxes", label:"Two handaxes", detail:"1d6 slashing, light, thrown (range 20/60 ft)", items:[
          {name:"Handaxe",qty:2,weight:2,notes:"light, thrown 20/60",type:"weapon",damageDice:"1d6",damageType:"Slashing",ability:"str",proficient:true}
        ]},
        {key:"simple", label:"Any simple weapon", detail:"Pick the specific weapon once you're on the sheet", items:[
          {name:"Simple weapon",qty:1,weight:4,notes:"choose specific weapon, then fill in its damage dice",type:"weapon",ability:"str",proficient:true}
        ]}
      ]}
    ],
    fixed:[
      {name:"Explorer's Pack", qty:1, weight:59, notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"},
      {name:"Javelin", qty:4, weight:2, notes:"thrown 30/120", type:"weapon", damageDice:"1d6", damageType:"Piercing", ability:"str", proficient:true}
    ]
  }
};

/* Packs shared by several classes' starting equipment. */
var EXPLORERS_PACK = {name:"Explorer's Pack", qty:1, weight:59, notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"};
var DUNGEONEERS_PACK = {name:"Dungeoneer's Pack", qty:1, weight:61.5, notes:"backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50ft rope"};
var BURGLARS_PACK = {name:"Burglar's Pack", qty:1, weight:44.5, notes:"backpack, 1,000 ball bearings, 10ft string, bell, 5 candles, crowbar, hammer, 10 pitons, hooded lantern, 2 flasks of oil, 5 days rations, tinderbox, waterskin, 50ft rope"};

/* Fighting styles a class can pick. `fightingStyle` on the chosen feature
   lets the sheet apply the ones with a flat bonus (Defense, Archery). */
export var FIGHTING_STYLES = {
  "Archery":{text:"You gain a +2 bonus to attack rolls you make with ranged weapons. (Already added to your ranged attacks.)"},
  "Defense":{text:"While you are wearing armor, you gain a +1 bonus to AC. (Already added to your AC.)"},
  "Dueling":{text:"When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon."},
  "Great Weapon Fighting":{text:"When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll."},
  "Protection":{text:"When a creature you can see attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll. You must be wielding a shield."},
  "Two-Weapon Fighting":{text:"When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack."}
};

CLASSES_INFO["Fighter"].features = [
  {name:"Fighting Style", text:"Adopt a particular style of fighting as your specialty (e.g. Archery, Defense, Dueling, Great Weapon Fighting, Protection, Two-Weapon Fighting)."},
  {name:"Second Wind", text:"Bonus action to regain hit points equal to 1d10 + your fighter level (once per short or long rest)."}
];

/* `choices` drives the creation wizard's Class Features step: level-1
   picks a class makes beyond skills (a fighting style, expertise, ...). */
Object.assign(CLASSES_INFO["Fighter"], {
  available:true,
  primaryAbility:"str",
  primaryAbilityLabel:"Strength (or Dexterity for an archer or finesse fighter)",
  savingThrows:["str","con"],
  skillChoices:{count:2, options:["Acrobatics","Animal Handling","Athletics","History","Insight","Intimidation","Perception","Survival"]},
  choices:[
    {id:"fightingStyle", kind:"fightingStyle", label:"Fighting Style",
      help:"Pick the style that matches how you'll fight. Defense and Archery are added to your AC and attacks automatically; the others are reminders on your Features tab.",
      options:["Archery","Defense","Dueling","Great Weapon Fighting","Protection","Two-Weapon Fighting"]}
  ],
  equipment:{
    choiceGroups:[
      {options:[
        {key:"chain", label:"Chain mail", detail:"Heavy armor, AC 16. Needs 13 Strength or your speed drops by 10 ft; disadvantage on Stealth", items:[
          {name:"Chain Mail",qty:1,weight:55,notes:"heavy; Str 13; stealth disadvantage",type:"armor",category:"heavy",baseAC:16}
        ]},
        {key:"leather_bow", label:"Leather armor, longbow and 20 arrows", detail:"Light armor, AC 11 + DEX, plus a 1d8 bow with range 150/600 ft", items:[
          {name:"Leather",qty:1,weight:10,notes:"light armor",type:"armor",category:"light",baseAC:11},
          {name:"Longbow",qty:1,weight:2,notes:"ammunition, heavy, two-handed, range 150/600",type:"weapon",damageDice:"1d8",damageType:"Piercing",ability:"dex",proficient:true},
          {name:"Arrows",qty:20,weight:0.05,notes:"ammunition"}
        ]}
      ]},
      {options:[
        {key:"weapon_shield", label:"A martial weapon and a shield", detail:"Starts as a longsword (1d8, versatile 1d10); swap it on the sheet. Shield gives +2 AC", items:[
          {name:"Longsword",qty:1,weight:3,notes:"versatile 1d10",type:"weapon",damageDice:"1d8",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Shield",qty:1,weight:6,notes:"+2 AC",type:"armor",category:"shield",baseAC:2}
        ]},
        {key:"two_martial", label:"Two martial weapons", detail:"Starts as a greatsword (2d6) and a longsword (1d8); swap them on the sheet", items:[
          {name:"Greatsword",qty:1,weight:6,notes:"heavy, two-handed",type:"weapon",damageDice:"2d6",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Longsword",qty:1,weight:3,notes:"versatile 1d10",type:"weapon",damageDice:"1d8",damageType:"Slashing",ability:"str",proficient:true}
        ]}
      ]},
      {options:[
        {key:"crossbow", label:"Light crossbow and 20 bolts", detail:"1d8 piercing, range 80/320 ft, loading", items:[
          {name:"Light Crossbow",qty:1,weight:5,notes:"ammunition, loading, two-handed, range 80/320",type:"weapon",damageDice:"1d8",damageType:"Piercing",ability:"dex",proficient:true},
          {name:"Crossbow Bolts",qty:20,weight:0.075,notes:"ammunition"}
        ]},
        {key:"handaxes", label:"Two handaxes", detail:"1d6 slashing, light, thrown (range 20/60 ft)", items:[
          {name:"Handaxe",qty:2,weight:2,notes:"light, thrown 20/60",type:"weapon",damageDice:"1d6",damageType:"Slashing",ability:"str",proficient:true}
        ]}
      ]},
      {options:[
        {key:"dungeoneer", label:"Dungeoneer's Pack", detail:"Backpack, crowbar, hammer, pitons, torches, rations, waterskin, rope", items:[DUNGEONEERS_PACK]},
        {key:"explorer", label:"Explorer's Pack", detail:"Backpack, bedroll, mess kit, tinderbox, torches, rations, waterskin, rope", items:[EXPLORERS_PACK]}
      ]}
    ],
    fixed:[]
  }
});

CLASSES_INFO["Rogue"].features = [
  {name:"Expertise", text:"Double your proficiency bonus for two of your skill proficiencies (or one skill and thieves' tools)."},
  {name:"Sneak Attack", text:"Once per turn, deal an extra 1d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage, or an ally is within 5 feet of it."},
  {name:"Thieves' Cant", text:"A secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation."}
];

Object.assign(CLASSES_INFO["Rogue"], {
  available:true,
  primaryAbility:"dex",
  savingThrows:["dex","int"],
  skillChoices:{count:4, options:["Acrobatics","Athletics","Deception","Insight","Intimidation","Investigation","Perception","Performance","Persuasion","Sleight of Hand","Stealth"]},
  choices:[
    {id:"expertise", kind:"expertise", label:"Expertise", count:2, tools:["Thieves' tools"],
      help:"Pick two things you're proficient in to double your proficiency bonus for. Stealth, Perception and thieves' tools are popular picks."}
  ],
  equipment:{
    choiceGroups:[
      {options:[
        {key:"rapier", label:"Rapier", detail:"1d8 piercing, finesse", items:[
          {name:"Rapier",qty:1,weight:2,notes:"finesse",type:"weapon",damageDice:"1d8",damageType:"Piercing",ability:"finesse",proficient:true}
        ]},
        {key:"shortsword", label:"Shortsword", detail:"1d6 piercing, finesse, light (good for fighting with two weapons)", items:[
          {name:"Shortsword",qty:1,weight:2,notes:"finesse, light",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"finesse",proficient:true}
        ]}
      ]},
      {options:[
        {key:"shortbow", label:"Shortbow and a quiver of 20 arrows", detail:"1d6 piercing, range 80/320 ft", items:[
          {name:"Shortbow",qty:1,weight:2,notes:"ammunition, two-handed, range 80/320",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"dex",proficient:true},
          {name:"Arrows",qty:20,weight:0.05,notes:"ammunition, in a quiver"}
        ]},
        {key:"shortsword2", label:"Shortsword", detail:"1d6 piercing, finesse, light", items:[
          {name:"Shortsword",qty:1,weight:2,notes:"finesse, light",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"finesse",proficient:true}
        ]}
      ]},
      {options:[
        {key:"burglar", label:"Burglar's Pack", detail:"Backpack, ball bearings, string, bell, candles, crowbar, lantern, oil, rations, rope", items:[BURGLARS_PACK]},
        {key:"dungeoneer", label:"Dungeoneer's Pack", detail:"Backpack, crowbar, hammer, pitons, torches, rations, waterskin, rope", items:[DUNGEONEERS_PACK]},
        {key:"explorer", label:"Explorer's Pack", detail:"Backpack, bedroll, mess kit, tinderbox, torches, rations, waterskin, rope", items:[EXPLORERS_PACK]}
      ]}
    ],
    fixed:[
      {name:"Leather", qty:1, weight:10, notes:"light armor", type:"armor", category:"light", baseAC:11},
      {name:"Dagger", qty:2, weight:1, notes:"finesse, light, thrown 20/60", type:"weapon", damageDice:"1d4", damageType:"Piercing", ability:"finesse", proficient:true},
      {name:"Thieves' Tools", qty:1, weight:1, notes:"pick locks and disarm traps"}
    ]
  }
});

CLASSES_INFO["Wizard"].features = [
  {name:"Spellcasting", text:"Prepare and cast spells from your spellbook using Intelligence. Can cast ritual spells from your spellbook."},
  {name:"Arcane Recovery", text:"Once per day during a short rest, recover expended spell slots with combined level up to half your wizard level."}
];

/* Wizard is fully guided in the creation wizard (the first spellcaster to
   be). `spellcasting` drives the wizard's Spells step: how many cantrips
   and 1st-level spells to pick, which class list to pick from, and the
   level-1 slots. `prepares` casters choose from a spellbook and prepare
   a subset (ability modifier + level) rather than knowing them all. */
Object.assign(CLASSES_INFO["Wizard"], {
  available:true,
  primaryAbility:"int",
  savingThrows:["int","wis"],
  skillChoices:{count:2, options:["Arcana","History","Insight","Investigation","Medicine","Religion"]},
  spellcasting:{
    ability:"int", spellList:"Wizard", cantrips:3, spells:6, prepares:true, slots:{1:2},
    spellsLabel:"Spellbook spells",
    spellsHelp:"Your spellbook starts with six 1st-level wizard spells. Each day you prepare a number equal to your Intelligence modifier + your wizard level; the rest stay in the book for later."
  },
  equipment:{
    choiceGroups:[
      {options:[
        {key:"quarterstaff", label:"Quarterstaff", detail:"1d6 bludgeoning, versatile (1d8)", items:[
          {name:"Quarterstaff",qty:1,weight:4,notes:"versatile 1d8",type:"weapon",damageDice:"1d6",damageType:"Bludgeoning",ability:"str",proficient:true}
        ]},
        {key:"dagger", label:"Dagger", detail:"1d4 piercing, finesse, light, thrown (range 20/60 ft)", items:[
          {name:"Dagger",qty:1,weight:1,notes:"finesse, light, thrown 20/60",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true}
        ]}
      ]},
      {options:[
        {key:"pouch", label:"Component pouch", detail:"Holds the material components your spells need", items:[
          {name:"Component Pouch",qty:1,weight:2,notes:"spellcasting focus; holds material components"}
        ]},
        {key:"focus", label:"Arcane focus", detail:"A crystal, orb, rod, staff, or wand to channel your spells", items:[
          {name:"Arcane Focus",qty:1,weight:1,notes:"spellcasting focus"}
        ]}
      ]},
      {options:[
        {key:"scholar", label:"Scholar's Pack", detail:"Backpack, book of lore, ink, quill, parchment, sand, small knife", items:[
          {name:"Scholar's Pack",qty:1,weight:10,notes:"backpack, book of lore, ink, quill, 10 sheets of parchment, bag of sand, small knife"}
        ]},
        {key:"explorer", label:"Explorer's Pack", detail:"Backpack, bedroll, mess kit, tinderbox, torches, rations, waterskin, rope", items:[
          {name:"Explorer's Pack",qty:1,weight:59,notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"}
        ]}
      ]}
    ],
    fixed:[
      {name:"Spellbook", qty:1, weight:3, notes:"holds your wizard spells"}
    ]
  }
});

CLASSES_INFO["Cleric"].features = [
  {name:"Spellcasting", text:"Cast divine spells channeled from your deity using Wisdom as your spellcasting ability."},
  {name:"Divine Domain", text:"Chosen religious domain granting domain spells and bonus domain features."}
];

/* Cleric picks its subclass (Divine Domain) at level 1, so the wizard's
   Class Features step offers it. `grants` is what each domain adds at
   creation: proficiencies that unlock gear (`requires` on an equipment
   option), always-prepared domain spells, bonus cantrips, and Knowledge's
   extra expertise pick. Clerics prepare from the whole cleric list, so the
   "spells" count is how many to prepare today (WIS modifier + 1). */
Object.assign(CLASSES_INFO["Cleric"], {
  available:true,
  primaryAbility:"wis",
  savingThrows:["wis","cha"],
  skillChoices:{count:2, options:["History","Insight","Medicine","Persuasion","Religion"]},
  choices:[
    {id:"subclass", kind:"subclass", label:"Divine Domain",
      help:"Your domain is the part of your god's power you wield. It sets your bonus features and a few spells that are always prepared.",
      grants:{
        "Life Domain":{profs:["heavy"], spells:["Bless","Cure Wounds"]},
        "Light Domain":{cantrips:["Light"], spells:["Burning Hands","Faerie Fire"]},
        "War Domain":{profs:["heavy","martial"], spells:["Divine Favor","Shield of Faith"]},
        "Knowledge Domain":{spells:["Command","Identify"],
          expertise:{id:"knowledgeSkills", label:"Blessings of Knowledge", count:2, options:["Arcana","History","Nature","Religion"],
            help:"You become proficient in two of these skills, with your proficiency bonus doubled. You also learn two languages (add them on the Information tab)."}},
        "Tempest Domain":{profs:["heavy","martial"], spells:["Fog Cloud","Thunderwave"]},
        "Trickery Domain":{spells:["Charm Person","Disguise Self"]}
      }}
  ],
  spellcasting:{
    ability:"wis", spellList:"Cleric", cantrips:3, prepares:true, slots:{1:2},
    spells:function(w){ return Math.max(1, Math.floor((w.abilities.wis-10)/2) + 1); },
    spellsLabel:"Prepared spells",
    spellsHelp:"You know every cleric spell. Each day you prepare a number equal to your Wisdom modifier + your cleric level; pick today's here and swap them on the Spells tab after a long rest. Your domain spells are always prepared on top of these."
  },
  equipment:{
    choiceGroups:[
      {options:[
        {key:"mace", label:"Mace", detail:"1d6 bludgeoning", items:[
          {name:"Mace",qty:1,weight:4,notes:"",type:"weapon",damageDice:"1d6",damageType:"Bludgeoning",ability:"str",proficient:true}
        ]},
        {key:"warhammer", label:"Warhammer", detail:"1d8 bludgeoning, versatile (1d10)", requires:"martial", items:[
          {name:"Warhammer",qty:1,weight:2,notes:"versatile 1d10",type:"weapon",damageDice:"1d8",damageType:"Bludgeoning",ability:"str",proficient:true}
        ]}
      ]},
      {options:[
        {key:"scale", label:"Scale mail", detail:"Medium armor, AC 14 + DEX (max 2); disadvantage on Stealth", items:[
          {name:"Scale Mail",qty:1,weight:45,notes:"medium; stealth disadvantage",type:"armor",category:"medium",baseAC:14}
        ]},
        {key:"leather", label:"Leather armor", detail:"Light armor, AC 11 + DEX", items:[
          {name:"Leather",qty:1,weight:10,notes:"light armor",type:"armor",category:"light",baseAC:11}
        ]},
        {key:"chain", label:"Chain mail", detail:"Heavy armor, AC 16. Needs 13 Strength or your speed drops by 10 ft; disadvantage on Stealth", requires:"heavy", items:[
          {name:"Chain Mail",qty:1,weight:55,notes:"heavy; Str 13; stealth disadvantage",type:"armor",category:"heavy",baseAC:16}
        ]}
      ]},
      {options:[
        {key:"crossbow", label:"Light crossbow and 20 bolts", detail:"1d8 piercing, range 80/320 ft, loading", items:[
          {name:"Light Crossbow",qty:1,weight:5,notes:"ammunition, loading, two-handed, range 80/320",type:"weapon",damageDice:"1d8",damageType:"Piercing",ability:"dex",proficient:true},
          {name:"Crossbow Bolts",qty:20,weight:0.075,notes:"ammunition"}
        ]},
        {key:"simple", label:"Any simple weapon", detail:"Starts as a spear (1d6, thrown 20/60, versatile 1d8); swap it on the sheet", items:[
          {name:"Spear",qty:1,weight:3,notes:"thrown 20/60, versatile 1d8",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"str",proficient:true}
        ]}
      ]},
      {options:[
        {key:"priest", label:"Priest's Pack", detail:"Backpack, blanket, candles, tinderbox, alms box, incense, censer, vestments, rations, waterskin", items:[
          {name:"Priest's Pack",qty:1,weight:24,notes:"backpack, blanket, 10 candles, tinderbox, alms box, 2 blocks of incense, censer, vestments, 2 days rations, waterskin"}
        ]},
        {key:"explorer", label:"Explorer's Pack", detail:"Backpack, bedroll, mess kit, tinderbox, torches, rations, waterskin, rope", items:[EXPLORERS_PACK]}
      ]}
    ],
    fixed:[
      {name:"Shield", qty:1, weight:6, notes:"+2 AC", type:"armor", category:"shield", baseAC:2},
      {name:"Holy Symbol", qty:1, weight:1, notes:"spellcasting focus"}
    ]
  }
});

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

var ARCANE_FOCUS_CHOICE = {options:[
  {key:"pouch", label:"Component pouch", detail:"Holds the material components your spells need", items:[
    {name:"Component Pouch",qty:1,weight:2,notes:"spellcasting focus; holds material components"}
  ]},
  {key:"focus", label:"Arcane focus", detail:"A crystal, orb, rod, staff, or wand to channel your spells", items:[
    {name:"Arcane Focus",qty:1,weight:1,notes:"spellcasting focus"}
  ]}
]};
var CROSSBOW_OR_SIMPLE_CHOICE = {options:[
  {key:"crossbow", label:"Light crossbow and 20 bolts", detail:"1d8 piercing, range 80/320 ft, loading", items:[
    {name:"Light Crossbow",qty:1,weight:5,notes:"ammunition, loading, two-handed, range 80/320",type:"weapon",damageDice:"1d8",damageType:"Piercing",ability:"dex",proficient:true},
    {name:"Crossbow Bolts",qty:20,weight:0.075,notes:"ammunition"}
  ]},
  {key:"simple", label:"Any simple weapon", detail:"Starts as a quarterstaff (1d6, versatile 1d8); swap it on the sheet", items:[
    {name:"Quarterstaff",qty:1,weight:4,notes:"versatile 1d8",type:"weapon",damageDice:"1d6",damageType:"Bludgeoning",ability:"str",proficient:true}
  ]}
]};
var TWO_DAGGERS = {name:"Dagger", qty:2, weight:1, notes:"finesse, light, thrown 20/60", type:"weapon", damageDice:"1d4", damageType:"Piercing", ability:"finesse", proficient:true};
var SCHOLARS_PACK = {name:"Scholar's Pack", qty:1, weight:10, notes:"backpack, book of lore, ink, quill, 10 sheets of parchment, bag of sand, small knife"};

/* Dragon Ancestor options: the type sets your damage type for later
   Draconic Bloodline features. */
var DRAGON_ANCESTORS = [
  ["Black","Acid"],["Blue","Lightning"],["Brass","Fire"],["Bronze","Lightning"],["Copper","Acid"],
  ["Gold","Fire"],["Green","Poison"],["Red","Fire"],["Silver","Cold"],["White","Cold"]
].map(function(d){ return {name:d[0]+" dragon", text:d[1]+" damage. Your Elemental Affinity (sorcerer level 6) boosts spells of this type."}; });

/* Sorcerer: Sorcerous Origin at level 1. Draconic Bloodline's Resilience
   (+1 HP per sorcerer level, unarmored AC 13 + DEX) is applied by the
   sheet itself; `hpPerLevel` covers the level-1 HP here. */
Object.assign(CLASSES_INFO["Sorcerer"], {
  available:true,
  primaryAbility:"cha",
  savingThrows:["con","cha"],
  skillChoices:{count:2, options:["Arcana","Deception","Insight","Intimidation","Persuasion","Religion"]},
  choices:[
    {id:"subclass", kind:"subclass", label:"Sorcerous Origin",
      help:"Where your magic comes from. It shapes your extra features as you level.",
      grants:{
        "Draconic Bloodline":{hpPerLevel:1, languages:["Draconic"],
          pick:{id:"dragonAncestor", label:"Dragon Ancestor", help:"Pick the kind of dragon in your bloodline. You also learn to speak, read and write Draconic.",
            options:DRAGON_ANCESTORS}},
        "Wild Magic":{}
      }}
  ],
  spellcasting:{
    ability:"cha", spellList:"Sorcerer", cantrips:4, spells:2, prepares:false, slots:{1:2},
    spellsLabel:"1st-level spells known",
    spellsHelp:"Sorcerers know a small set of spells and can cast any of them with a slot. You learn one more each level, and can swap one out when you level up."
  },
  equipment:{
    choiceGroups:[
      CROSSBOW_OR_SIMPLE_CHOICE,
      ARCANE_FOCUS_CHOICE,
      {options:[
        {key:"dungeoneer", label:"Dungeoneer's Pack", detail:"Backpack, crowbar, hammer, pitons, torches, rations, waterskin, rope", items:[DUNGEONEERS_PACK]},
        {key:"explorer", label:"Explorer's Pack", detail:"Backpack, bedroll, mess kit, tinderbox, torches, rations, waterskin, rope", items:[EXPLORERS_PACK]}
      ]}
    ],
    fixed:[TWO_DAGGERS]
  }
});

/* Warlock: Otherworldly Patron at level 1. `expandedSpells` join the list
   the wizard's spell picker offers; Pact Magic uses `pact` slots (one
   1st-level slot, back on a short rest) instead of regular ones. */
Object.assign(CLASSES_INFO["Warlock"], {
  available:true,
  primaryAbility:"cha",
  savingThrows:["wis","cha"],
  skillChoices:{count:2, options:["Arcana","Deception","History","Intimidation","Investigation","Nature","Religion"]},
  choices:[
    {id:"subclass", kind:"subclass", label:"Otherworldly Patron",
      help:"The being you made your pact with. It grants a feature now and adds a few spells to the list you can learn from.",
      grants:{
        "The Fiend":{expandedSpells:["Burning Hands","Command"]},
        "The Archfey":{expandedSpells:["Faerie Fire","Sleep"]},
        "The Great Old One":{expandedSpells:["Dissonant Whispers","Tasha's Hideous Laughter"]}
      }}
  ],
  spellcasting:{
    ability:"cha", spellList:"Warlock", cantrips:2, spells:2, prepares:false, slots:{}, pact:{max:1, slotLevel:1},
    spellsLabel:"1st-level spells known",
    spellsHelp:"You know two warlock spells. Pact Magic gives you one spell slot that comes back on a short rest, so you can cast often across a day."
  },
  equipment:{
    choiceGroups:[
      CROSSBOW_OR_SIMPLE_CHOICE,
      ARCANE_FOCUS_CHOICE,
      {options:[
        {key:"scholar", label:"Scholar's Pack", detail:"Backpack, book of lore, ink, quill, parchment, sand, small knife", items:[SCHOLARS_PACK]},
        {key:"dungeoneer", label:"Dungeoneer's Pack", detail:"Backpack, crowbar, hammer, pitons, torches, rations, waterskin, rope", items:[DUNGEONEERS_PACK]}
      ]}
    ],
    fixed:[
      {name:"Leather", qty:1, weight:10, notes:"light armor", type:"armor", category:"light", baseAC:11},
      {name:"Spear", qty:1, weight:3, notes:"any simple weapon; swap it on the sheet. Thrown 20/60, versatile 1d8", type:"weapon", damageDice:"1d6", damageType:"Piercing", ability:"str", proficient:true},
      TWO_DAGGERS
    ]
  }
});

CLASSES_INFO["Artificer"].features = [
  {name:"Magical Tinkering", text:"Invest a spark of magic into mundane tiny objects (light, recorded sound, odor, or visual effect)."},
  {name:"Spellcasting", text:"Cast spells by using tools as focuses, with Intelligence as your spellcasting ability."}
];

/* ---------------- Standard SRD proficiencies by class ----------------
   Used by the Information tab to show a quick, non-editable readout of
   what each class grants. Kept separate from CLASSES_INFO so it can cover
   every class without disturbing the wizard-only fields above. */
export var CLASS_PROFICIENCIES = {
  "Artificer": {
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons"],
    tools:["Thieves' tools","Tinker's tools","One type of artisan's tools"],
    savingThrows:["con","int"]
  },
  "Barbarian": {
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    savingThrows:["str","con"]
  },
  "Bard": {
    armor:["Light armor"],
    weapons:["Simple weapons","Hand crossbows","Longswords","Rapiers","Shortswords"],
    tools:["Three musical instruments of your choice"],
    savingThrows:["dex","cha"]
  },
  "Cleric": {
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons"],
    tools:[],
    savingThrows:["wis","cha"]
  },
  "Druid": {
    armor:["Light armor","Medium armor","Shields (non-metal)"],
    weapons:["Clubs","Daggers","Darts","Javelins","Maces","Quarterstaffs","Scimitars","Sickles","Slings","Spears"],
    tools:["Herbalism kit"],
    savingThrows:["int","wis"]
  },
  "Fighter": {
    armor:["All armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    savingThrows:["str","con"]
  },
  "Monk": {
    armor:[],
    weapons:["Simple weapons","Shortswords"],
    tools:["One type of artisan's tools or musical instrument"],
    savingThrows:["str","dex"]
  },
  "Paladin": {
    armor:["All armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    savingThrows:["wis","cha"]
  },
  "Ranger": {
    armor:["Light armor","Medium armor","Shields"],
    weapons:["Simple weapons","Martial weapons"],
    tools:[],
    savingThrows:["str","dex"]
  },
  "Rogue": {
    armor:["Light armor"],
    weapons:["Simple weapons","Hand crossbows","Longswords","Rapiers","Shortswords"],
    tools:["Thieves' tools"],
    savingThrows:["dex","int"]
  },
  "Sorcerer": {
    armor:[],
    weapons:["Daggers","Darts","Slings","Quarterstaffs","Light crossbows"],
    tools:[],
    savingThrows:["con","cha"]
  },
  "Warlock": {
    armor:["Light armor"],
    weapons:["Simple weapons"],
    tools:[],
    savingThrows:["wis","cha"]
  },
  "Wizard": {
    armor:[],
    weapons:["Daggers","Darts","Slings","Quarterstaffs","Light crossbows"],
    tools:[],
    savingThrows:["int","wis"]
  }
};
