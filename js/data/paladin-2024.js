/* The 2024 Paladin (Player's Handbook 2024, pp. 108 to 116), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-05. Only what differs from
   the 2014 paladin is here. What the features do on the sheet is in
   js/core/paladin.js.

   It casts from level 1: `casterType` "halfUp" is half its levels rounded up,
   alone or multiclassed (p. 45), and `spellcasting` is the wizard's Spells step.

   The 2024 oaths carry " (2024)" (classLevelOf counts them for their 2014
   names, so what's the same is automated once). The older oaths with no 2024
   version stay open to a 2024 paladin. */
import { masteryPick } from "./fighter-2024.js";

var STYLES = ["Archery","Blessed Warrior","Blind Fighting","Defense","Dueling","Great Weapon Fighting","Interception","Protection","Thrown Weapon Fighting","Two-Weapon Fighting","Unarmed Fighting"];
var PRIESTS_PACK = {name:"Priest's Pack",qty:1,weight:24,notes:"backpack, blanket, 10 candles, tinderbox, alms box, 2 blocks of incense, censer, vestments, 2 days rations, waterskin"};
function auraRange(x){ return "Within " + (x.lv >= 18 ? 30 : 10) + " ft"; }

export var PALADIN_2024 = {
  label: "2024 Paladin",
  blurb: "A holy warrior who casts from level 1, with Weapon Mastery and Divine Smite as a spell.",
  card: {perks: ["Spells at level 1", "Divine Smite spell", "Weapon Mastery"],
    text: "The 2024 rules for the paladin: spells and the mastery of two kinds of weapon from level 1, Divine Smite as a spell with a free cast each day, two uses of Channel Divinity, Radiant Strikes, and the 2024 oaths.",
    outcome: "<b>2024 Paladin:</b> spells from level 1, Weapon Mastery, Divine Smite as a spell, and the 2024 features, gear and oaths."},
  which: {old: "The Player's Handbook 2014 paladin.", now: "The Player's Handbook 2024 paladin: spells from level 1, Weapon Mastery and Divine Smite as a spell."},
  swaps: {"Oath of Devotion":"Oath of Devotion (2024)", "Oath of Glory":"Oath of Glory (2024)", "Oath of the Ancients":"Oath of the Ancients (2024)", "Oath of Vengeance":"Oath of Vengeance (2024)"},
  casterType: "halfUp",
  fightingStyle: {level:2, options:STYLES},
  skillChoices: {count:2, options:["Athletics","Insight","Intimidation","Medicine","Persuasion","Religion"]},
  proficiencies: {armor:["All armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], savingThrows:["wis","cha"]},
  // A multiclass: martial weapons, light and medium armor and shields, and the level 1 features (p. 108).
  multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Martial weapons"], tools:[], note:""},
  // The wizard's Spells step (no cantrips, two prepared spells).
  spellcasting: {ability:"cha", spellList:"Paladin", cantrips:0, spells:2, prepares:true, slots:{1:2},
    spellsLabel:"Prepared spells",
    spellsHelp:"You prepare two level 1 paladin spells, and more as you level. Heroism and Searing Smite are the book's suggestions. Each long rest you can swap one for another."},
  choices: [],
  level1: [
    {name:"Lay On Hands", text:"You have a pool of healing equal to five times your paladin level, refilled on a long rest. As a bonus action, touch a creature and restore hit points from the pool. You can also spend 5 points to remove the poisoned condition, and those points don't heal. Use it from Lay On Hands on the Vitals tab."},
    {name:"Spellcasting", text:"You cast paladin spells using Charisma. You prepare two level 1 spells, and more as you level, up to the Prepared count on the Spells tab. Whenever you finish a long rest, you can replace one of them with another paladin spell you have slots for. A holy symbol can be your spellcasting focus."},
    {name:"Weapon Mastery", text:"You can use the mastery properties of two kinds of weapons you are proficient with, such as longswords and javelins. Whenever you finish a long rest, you can change them on the Feature choices card.", profs:{pick:[masteryPick(2)]}}
  ],
  features: {
    2: [
      {name:"Fighting Style", text:"You gain a Fighting Style feat of your choice, or Blessed Warrior instead: two cleric cantrips that count as paladin spells and use Charisma. Guidance and Sacred Flame are recommended. Whenever you gain a paladin level, you can replace one of those cantrips with another cleric cantrip. The level-up asks you to choose."},
      {name:"Paladin's Smite", text:"You always have Divine Smite prepared. You can also cast it once without a spell slot, and you regain that on a long rest. The Divine Smite button on a melee weapon's card offers both.", spells:["Divine Smite"], spellKind:"prepared"}
    ],
    3: [{name:"Channel Divinity", saveDc:{save:"", ability:"cha"}, text:"You can use this twice, and three times from level 11. You regain one use on a short rest and all of them on a long rest. Each time, choose what it does from Channel Divinity on the Vitals tab. A save uses your spell save DC.\nDivine Sense: as a bonus action, for 10 minutes or until you're incapacitated, you know where any celestial, fiend or undead is within 60 feet, and what type it is. You also sense consecrated or desecrated places and objects there, as with Hallow."}],
    5: [
      {name:"Extra Attack", text:"You can attack twice instead of once whenever you take the Attack action on your turn."},
      {name:"Faithful Steed", text:"You always have Find Steed prepared. You can also cast it once without a spell slot, and you regain that on a long rest. Track the steed on the Companions tab.", spells:["Find Steed"], spellKind:"prepared"}
    ],
    6: [{name:"Aura of Protection", saveBonus:"cha", saveBonusOff:"incapacitated", chip:function(x){ return "+" + Math.max(1, x.mods.cha) + " " + auraRange(x).toLowerCase(); },
      remind:{when:"always", line:"You and allies in your aura add your CHA modifier to saves"},
      text:"You radiate an unseen aura in a 10-foot emanation, inactive while you're incapacitated. You and your allies in it add your Charisma modifier (minimum +1) to saving throws. It's already added to your own saves. If another paladin's aura overlaps, a creature benefits from only one of them."}],
    9: [{name:"Abjure Foes", text:"As a Magic action, spend a use of Channel Divinity and choose creatures you can see within 60 feet, up to your Charisma modifier (minimum one). Each makes a Wisdom save or is frightened for 1 minute or until it takes damage. While frightened this way, on its turns it can only move, take an action or take a bonus action, one of these."}],
    10: [{name:"Aura of Courage", conditionImmune:["frightened"], chip:auraRange,
      remind:{when:"always", line:"You and allies in your aura are immune to the frightened condition"},
      text:"You and your allies are immune to the frightened condition while in your Aura of Protection. If a frightened ally enters the aura, the condition has no effect on that ally while there."}],
    11: [{name:"Radiant Strikes", text:"When you hit a target with an attack roll using a melee weapon or an unarmed strike, it takes an extra 1d8 radiant damage. The button is on the weapon's card."}],
    14: [{name:"Restoring Touch", text:"When you use Lay On Hands on a creature, you can also remove the blinded, charmed, deafened, frightened, paralyzed or stunned condition. Each one you remove costs 5 points from the pool, and those points don't heal."}],
    18: [{name:"Aura Expansion", text:"Your Aura of Protection is now a 30-foot emanation."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Truesight is recommended. Take it in place of raising your scores at this level-up."}]
  },
  // The book's starting equipment: (A) or (B) 150 gp (p. 108).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Chain mail, shield, longsword, 6 javelins, holy symbol, Priest's Pack and 9 gp", coins:{gp:9}, items:[
          {name:"Chain Mail",qty:1,weight:55,notes:"heavy, Str 13, stealth disadvantage",type:"armor",category:"heavy",baseAC:16},
          {name:"Shield",qty:1,weight:6,notes:"+2 AC",type:"armor",category:"shield",baseAC:2},
          {name:"Longsword",qty:1,weight:3,notes:"versatile 1d10",type:"weapon",damageDice:"1d8",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Javelin",qty:6,weight:2,notes:"thrown 30/120",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"str",proficient:true},
          {name:"Holy Symbol",qty:1,weight:1,notes:"spellcasting focus"},
          PRIESTS_PACK
        ]},
        {key:"gold", label:"150 gp", detail:"Buy your own gear", coins:{gp:150}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* An oath's table: the feature at each level with what's prepared so far,
   added to that oath's own features. */
function oathSpells(table, features){
  var have = [];
  Object.keys(table).forEach(function(lv){
    have = have.concat(table[lv]);
    var f = {name:"Oath Spells", text:"You always have " + have.join(", ").replace(/, ([^,]*)$/, " and $1") + " prepared. They don't count against your prepared spells.", spells:have.slice(), spellKind:"prepared"};
    if(lv!=="3") f.replaces = "Oath Spells";
    features[lv] = [f].concat(features[lv] || []);
  });
  return features;
}

/* The 2024 oaths (Player's Handbook 2024, pp. 113 to 116). */
export var PALADIN_2024_SUBCLASSES = [
  {name:"Oath of Devotion (2024)", edition:"2024", blurb:"Upholds justice and order, the knight in shining armor.", features:oathSpells({
    3:["Protection from Evil and Good","Shield of Faith"], 5:["Aid","Zone of Truth"], 9:["Beacon of Hope","Dispel Magic"], 13:["Freedom of Movement","Guardian of Faith"], 17:["Commune","Flame Strike"]
  }, {
    3:[{name:"Sacred Weapon", text:"When you take the Attack action, you can spend a use of Channel Divinity to imbue a melee weapon you're holding. For 10 minutes or until you use this again, add your Charisma modifier (minimum +1) to attack rolls with it, and its hits can deal radiant damage or their normal type. It sheds bright light for 20 feet and dim light 20 feet beyond. You can end this at any time, and it ends if you aren't carrying the weapon. Start it from Channel Divinity on the Vitals tab."}],
    7:[{name:"Aura of Devotion", conditionImmune:["charmed"], chip:auraRange,
      remind:{when:"always", line:"You and allies in your aura are immune to the charmed condition"},
      text:"You and your allies are immune to the charmed condition while in your Aura of Protection. If a charmed ally enters the aura, the condition has no effect on that ally while there."}],
    15:[{name:"Smite of Protection", remind:{when:"always", line:"Cast Divine Smite: you and allies in your aura have half cover until your next turn"},
      text:"Whenever you cast Divine Smite, you and your allies have half cover while in your Aura of Protection, until the start of your next turn."}],
    20:[{name:"Holy Nimbus", text:"As a bonus action, for 10 minutes or until you end it, your aura gains these benefits. Once per long rest, or spend a level 5 spell slot (no action needed) to use it again.\nHoly Ward: advantage on any saving throw a fiend or undead forces you to make.\nRadiant Damage: an enemy that starts its turn in the aura takes radiant damage equal to your Charisma modifier plus your proficiency bonus.\nSunlight: the aura is filled with bright light that is sunlight. Start it from the Active effects card."}]
  })},
  {name:"Oath of Glory (2024)", edition:"2024", blurb:"Strives for the heights of heroism and urges companions on.", features:oathSpells({
    3:["Guiding Bolt","Heroism"], 5:["Enhance Ability","Magic Weapon"], 9:["Haste","Protection from Energy"], 13:["Compulsion","Freedom of Movement"], 17:["Legend Lore","Yolande's Regal Presence"]
  }, {
    3:[
      {name:"Inspiring Smite", text:"Immediately after you cast Divine Smite, you can spend a use of Channel Divinity and share 2d8 + your paladin level temporary hit points among creatures you choose within 30 feet, which can include you. It's offered after the smite."},
      {name:"Peerless Athlete", text:"As a bonus action, spend a use of Channel Divinity. For 1 hour, you have advantage on Strength (Athletics) and Dexterity (Acrobatics) checks, and your long and high jumps go 10 feet farther (the extra distance costs movement as normal). Start it from Channel Divinity on the Vitals tab."}
    ],
    7:[{name:"Aura of Alacrity", speed:10, remind:{when:"always", line:"An ally entering or starting in your aura gets 10 feet more speed"},
      text:"Your speed increases by 10 feet (already added). Whenever an ally enters your Aura of Protection for the first time on a turn or starts its turn there, its speed increases by 10 feet until the end of its next turn."}],
    15:[{name:"Glorious Defense", text:"When you or another creature you can see within 10 feet is hit by an attack roll, take a reaction to add your Charisma modifier (minimum +1) to the target's AC against that attack, possibly making it miss. If it misses, you can make one weapon attack against the attacker as part of this reaction, if it's in range. Uses equal to your Charisma modifier (minimum once), regained on a long rest."}],
    20:[{name:"Living Legend", text:"As a bonus action, you gain these benefits for 10 minutes. Once per long rest, or spend a level 5 spell slot (no action needed) to use it again.\nCharismatic: advantage on all Charisma checks.\nSaving Throw Reroll: if you fail a saving throw, take a reaction to reroll it. You must use the new roll.\nUnerring Strike: once on each of your turns when you miss with a weapon attack, you can make it hit instead. Start it from the Active effects card."}]
  })},
  {name:"Oath of the Ancients (2024)", edition:"2024", blurb:"Preserves life and light in the world.", features:oathSpells({
    3:["Ensnaring Strike","Speak with Animals"], 5:["Misty Step","Moonbeam"], 9:["Plant Growth","Protection from Energy"], 13:["Ice Storm","Stoneskin"], 17:["Commune with Nature","Tree Stride"]
  }, {
    3:[{name:"Nature's Wrath", text:"As a Magic action, spend a use of Channel Divinity to conjure spectral vines. Each creature you choose that you can see within 15 feet makes a Strength save or is restrained for 1 minute, repeating the save at the end of each of its turns. Use it from Channel Divinity on the Vitals tab."}],
    7:[{name:"Aura of Warding", resist:["necrotic","psychic","radiant"], chip:auraRange,
      remind:{when:"always", line:"You and allies in your aura resist necrotic, psychic and radiant damage"},
      text:"You and your allies have resistance to necrotic, psychic and radiant damage while in your Aura of Protection."}],
    15:[{name:"Undying Sentinel", text:"When you drop to 0 hit points and aren't killed outright, you can drop to 1 hit point instead and regain hit points equal to three times your paladin level. Once per long rest. The death saves card offers it. You also can't be aged magically, and you cease visibly aging."}],
    20:[{name:"Elder Champion", text:"As a bonus action, your aura gains these benefits for 1 minute or until you end them. Once per long rest, or spend a level 5 spell slot (no action needed) to use it again.\nDiminish Defiance: enemies in the aura have disadvantage on saves against your spells and Channel Divinity.\nRegeneration: you regain 10 hit points at the start of each of your turns.\nSwift Spells: a spell with a casting time of an action can be cast as a bonus action instead. Start it from the Active effects card."}]
  })},
  {name:"Oath of Vengeance (2024)", edition:"2024", blurb:"Punishes evildoers at any cost.", features:oathSpells({
    3:["Bane","Hunter's Mark"], 5:["Hold Person","Misty Step"], 9:["Haste","Protection from Energy"], 13:["Banishment","Dimension Door"], 17:["Hold Monster","Scrying"]
  }, {
    3:[{name:"Vow of Enmity", text:"When you take the Attack action, you can spend a use of Channel Divinity to vow enmity against a creature you can see within 30 feet. You have advantage on attack rolls against it for 1 minute or until you use this again. If it drops to 0 hit points first, you can move the vow to another creature within 30 feet (no action needed). Start it from Channel Divinity on the Vitals tab."}],
    7:[{name:"Relentless Avenger", remind:{when:"reaction", line:"Opportunity attack hits: its speed drops to 0, and you can move half your speed"},
      text:"When you hit a creature with an opportunity attack, you can reduce its speed to 0 until the end of the current turn. You can then move up to half your speed as part of the same reaction, with no opportunity attacks."}],
    15:[{name:"Soul of Vengeance", remind:{when:"reaction", line:"After your Vow's target attacks, make a melee attack against it"},
      text:"Immediately after a creature under your Vow of Enmity hits or misses with an attack roll, you can take a reaction to make a melee attack against it if it's within range."}],
    20:[{name:"Avenging Angel", saveDc:{save:"wis", ability:"cha"}, speeds:[{type:"fly", value:60, when:"Avenging Angel, 10 minutes"}], text:"As a bonus action, you gain these benefits for 10 minutes or until you end them. Once per long rest, or spend a level 5 spell slot (no action needed) to use it again.\nFlight: spectral wings give you a fly speed of 60 feet, and you can hover.\nFrightful Aura: whenever an enemy starts its turn in your aura, it makes a Wisdom save or is frightened for 1 minute or until it takes damage. Attack rolls against it have advantage. Start it from the Active effects card."}]
  })}
];
