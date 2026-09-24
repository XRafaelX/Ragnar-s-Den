import { CLASS_LIST } from "./abilities-skills.js";

/* ---------------- Character Creation Wizard data ----------------
   Only Barbarian has a fully guided creation experience right now.
   The other classes appear (with a one-line blurb) so the class list
   reads as complete, but are marked unavailable until they are built
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

/* ---------------- Standard SRD proficiencies by class ----------------
   Used by the Information tab to show a quick, non-editable readout of
   what each class grants. Kept separate from CLASSES_INFO so it can cover
   every class without disturbing the wizard-only fields above. */
export var CLASS_PROFICIENCIES = {
  "Artificer": {
    armor:["Light armor"],
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
