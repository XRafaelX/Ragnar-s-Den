/* The 2024 Cleric (Player's Handbook 2024, pp. 68 to 76), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-06. Only what differs from
   the 2014 cleric is here. What the features do on the sheet is in
   js/core/cleric.js.

   The domain comes at level 3 (`subclassLevel`), not 1. Divine Order is a
   choice on the Feature choices card whose effects (`choiceEffects`) the
   sheet applies: Protector's proficiencies, Thaumaturge's cantrip and its
   bonus to Arcana and Religion. An older domain's own Divine Strike or
   Potent Spellcasting gives way to Blessed Strikes (`subclassDrops`, p. 71).

   The 2024 domains carry " (2024)" (classLevelOf counts them for their 2014
   names, so what's the same is automated once). The older domains with no
   2024 version stay open to a 2024 cleric. */

var SKILLS = ["History","Insight","Medicine","Persuasion","Religion"];
var PRIESTS_PACK = {name:"Priest's Pack",qty:1,weight:24,notes:"backpack, blanket, 10 candles, tinderbox, alms box, 2 blocks of incense, censer, vestments, 2 days rations, waterskin"};
var ORDERS = {
  "Protector": "Trained for battle: proficiency with martial weapons and training with heavy armor.",
  "Thaumaturge": "One extra cleric cantrip, and your Wisdom modifier (minimum +1) added to Intelligence (Arcana or Religion) checks."
};
var STRIKES = {
  "Divine Strike": "Once on each of your turns when you hit a creature with a weapon attack, it takes an extra 1d8 necrotic or radiant damage (your choice). 2d8 from level 14. The die is on your weapon cards.",
  "Potent Spellcasting": "Add your Wisdom modifier to the damage you deal with any cleric cantrip (already in your cantrips' lines). From level 14, a cleric cantrip that deals damage also gives you or a creature within 60 feet temporary hit points equal to twice your Wisdom modifier."
};
/* Divine Spark's dice by cleric level. */
export function divineSparkDice(lv){ return lv >= 18 ? 4 : lv >= 13 ? 3 : lv >= 7 ? 2 : 1; }

export var CLERIC_2024 = {
  label: "2024 Cleric",
  blurb: "A divine spellcaster with a Divine Order, Divine Spark and a domain from level 3.",
  card: {perks: ["Divine Order", "Divine Spark", "Blessed Strikes"],
    text: "The 2024 rules for the cleric: a Divine Order at level 1 (heavy armor or an extra cantrip), two uses of Channel Divinity with Divine Spark, Sear Undead, Blessed Strikes for every cleric, a domain at level 3 and the 2024 domains.",
    outcome: "<b>2024 Cleric:</b> a Divine Order, Divine Spark, Blessed Strikes, a domain at level 3, and the 2024 features, gear and domains."},
  which: {old: "The Player's Handbook 2014 cleric.", now: "The Player's Handbook 2024 cleric: a Divine Order, Divine Spark and a domain at level 3."},
  swaps: {"Life Domain":"Life Domain (2024)", "Light Domain":"Light Domain (2024)", "Trickery Domain":"Trickery Domain (2024)", "War Domain":"War Domain (2024)"},
  subclassLevel: 3,
  subclassDrops: ["Divine Strike", "Potent Spellcasting"],
  skillChoices: {count:2, options:SKILLS},
  proficiencies: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons"], tools:[], savingThrows:["wis","cha"]},
  // A multiclass: light and medium armor and shields, and the level 1 features (p. 68).
  multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:[], tools:[], note:""},
  spellcasting: {ability:"wis", spellList:"Cleric", cantrips:3, spells:4, prepares:true, slots:{1:2},
    spellsLabel:"Prepared spells",
    spellsHelp:"You know every cleric spell. You prepare four of them (more as you level). Bless, Cure Wounds, Guiding Bolt and Shield of Faith are the book's suggestions. After a long rest you can change any of them on the Spells tab."},
  // What a Divine Order choice does on the sheet.
  choiceEffects: {divineOrder: {
    "Protector": {grants:{armor:["Heavy armor"], weapons:["Martial weapons"]}},
    "Thaumaturge": {cantrips:1, skillBonus:{skills:["Arcana","Religion"], ability:"wis", min:1}}
  }},
  choices: [],
  level1: [
    {name:"Spellcasting", text:"You cast cleric spells using Wisdom. You know three cantrips (four at level 4, five at 10), and can replace one with another whenever you gain a cleric level. You prepare four level 1 spells, more as you level, up to the Prepared count on the Spells tab, and can change them all after a long rest. A holy symbol can be your spellcasting focus."},
    {name:"Divine Order", text:"Choose a sacred role.\nProtector: " + ORDERS.Protector + "\nThaumaturge: " + ORDERS.Thaumaturge + " (Already applied on the sheet.)",
      profs:{pick:[{kind:"choice", id:"divineOrder", noun:"role", count:1, options:Object.keys(ORDERS), details:ORDERS, label:"Choose your Divine Order"}]}}
  ],
  features: {
    2: [{name:"Channel Divinity", saveDc:{save:"", ability:"wis"}, text:"You can use this twice (three times from level 6, four from 18). You regain one use on a short rest and all of them on a long rest. Each time, choose what it does from Channel Divinity on the Vitals tab.\nDivine Spark: as a Magic action, point your holy symbol at a creature within 30 feet. Roll 1d8 + your Wisdom modifier (2d8 at level 7, 3d8 at 13, 4d8 at 18) and restore that many hit points, or force a Constitution save: necrotic or radiant damage (your choice) on a failure, half on a success.\nTurn Undead: as a Magic action, each undead you choose within 30 feet makes a Wisdom save or is frightened and incapacitated for 1 minute, moving as far from you as it can. It ends if it takes damage, or if you're incapacitated or die."}],
    5: [{name:"Sear Undead", text:"When you use Turn Undead, you can roll a number of d8s equal to your Wisdom modifier (minimum 1). Each undead that fails the save takes that much radiant damage, which doesn't end the turn effect. The roll is offered with Turn Undead."}],
    7: [{name:"Blessed Strikes", text:"Choose one, on the Feature choices card.\nDivine Strike: " + STRIKES["Divine Strike"] + "\nPotent Spellcasting: " + STRIKES["Potent Spellcasting"],
      profs:{pick:[{kind:"choice", id:"blessedStrikes", noun:"option", count:1, options:Object.keys(STRIKES), details:STRIKES, label:"Choose your Blessed Strikes"}]}}],
    10: [{name:"Divine Intervention", text:"As a Magic action, choose any cleric spell of level 5 or lower that doesn't need a reaction, and cast it without a spell slot or material components. Once per long rest (the row on Vitals)."}],
    14: [{name:"Improved Blessed Strikes", remind:{choice:"blessedStrikes", by:{"Potent Spellcasting":{when:"always", line:"Damage with a cleric cantrip: give twice your WIS mod in temp HP within 60 ft"}}},
      text:"Your Blessed Strikes grow stronger. Divine Strike deals 2d8. Potent Spellcasting: when a cleric cantrip deals damage to a creature, you can give yourself or a creature within 60 feet temporary hit points equal to twice your Wisdom modifier."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Fate is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Greater Divine Intervention", text:"When you use Divine Intervention, you can choose Wish. If you do, you can't use Divine Intervention again until you finish 2d4 long rests."}]
  },
  // The book's starting equipment: (A) or (B) 110 gp (p. 68).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Chain shirt, shield, mace, holy symbol, Priest's Pack and 7 gp", coins:{gp:7}, items:[
          {name:"Chain Shirt",qty:1,weight:20,notes:"medium armor",type:"armor",category:"medium",baseAC:13},
          {name:"Shield",qty:1,weight:6,notes:"+2 AC",type:"armor",category:"shield",baseAC:2},
          {name:"Mace",qty:1,weight:4,notes:"",type:"weapon",damageDice:"1d6",damageType:"Bludgeoning",ability:"str",proficient:true},
          {name:"Holy Symbol",qty:1,weight:1,notes:"spellcasting focus"},
          PRIESTS_PACK
        ]},
        {key:"gold", label:"110 gp", detail:"Buy your own gear", coins:{gp:110}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* A domain's spell table: the feature at each level with what's prepared so
   far, added to that domain's own features. */
function domainSpells(table, features){
  var have = [];
  Object.keys(table).forEach(function(lv){
    have = have.concat(table[lv]);
    var f = {name:"Domain Spells", text:"You always have " + have.join(", ").replace(/, ([^,]*)$/, " and $1") + " prepared. They don't count against your prepared spells.", spells:have.slice(), spellKind:"prepared"};
    if(lv!=="3") f.replaces = "Domain Spells";
    features[lv] = [f].concat(features[lv] || []);
  });
  return features;
}

/* The 2024 domains (Player's Handbook 2024, pp. 72 to 76). */
export var CLERIC_2024_SUBCLASSES = [
  {name:"Life Domain (2024)", edition:"2024", blurb:"Soothes the hurts of the world with healing.", features:domainSpells({
    3:["Aid","Bless","Cure Wounds","Lesser Restoration"], 5:["Mass Healing Word","Revivify"], 7:["Aura of Life","Death Ward"], 9:["Greater Restoration","Mass Cure Wounds"]
  }, {
    3:[
      {name:"Disciple of Life", text:"When a spell you cast with a spell slot restores hit points to a creature, it regains 2 + the slot's level more that turn (in your healing spells' lines)."},
      {name:"Preserve Life", text:"As a Magic action, spend a use of Channel Divinity to restore hit points equal to five times your cleric level, divided among bloodied creatures you choose within 30 feet (you can be one). No one goes above half their hit point maximum. Use it from Channel Divinity on the Vitals tab."}
    ],
    6:[{name:"Blessed Healer", text:"Right after you cast a spell with a spell slot that restores hit points to a creature other than you, you regain 2 + the slot's level hit points."}],
    17:[{name:"Supreme Healing", text:"When you would roll dice to restore hit points with a spell or Channel Divinity, use the highest number on each die instead."}]
  })},
  {name:"Light Domain (2024)", edition:"2024", blurb:"Brings light to banish darkness, with fire and radiance.", features:domainSpells({
    3:["Burning Hands","Faerie Fire","Scorching Ray","See Invisibility"], 5:["Daylight","Fireball"], 7:["Arcane Eye","Wall of Fire"], 9:["Flame Strike","Scrying"]
  }, {
    3:[
      {name:"Radiance of the Dawn", text:"As a Magic action, spend a use of Channel Divinity. Magical darkness within 30 feet ends, and each creature you choose within 30 feet makes a Constitution save, taking 2d10 + your cleric level radiant damage on a failure, or half on a success. Use it from Channel Divinity on the Vitals tab."},
      {name:"Warding Flare", text:"When a creature you can see within 30 feet makes an attack roll, you can take a reaction to give it disadvantage. Uses equal to your Wisdom modifier (minimum once), regained on a long rest."}
    ],
    6:[{name:"Improved Warding Flare", text:"You regain all uses of Warding Flare on a short or long rest. Whenever you use it, you can give the target of the attack temporary hit points equal to 2d6 + your Wisdom modifier (a button on the Warding Flare row)."}],
    17:[{name:"Corona of Light", text:"As a Magic action, for 1 minute or until you dismiss it, you shed bright light in a 60-foot radius and dim light 30 feet beyond. Your enemies in the bright light have disadvantage on saves against Radiance of the Dawn and any spell that deals fire or radiant damage. Uses equal to your Wisdom modifier (minimum once), regained on a long rest. Start it from the Active effects card."}]
  })},
  {name:"Trickery Domain (2024)", edition:"2024", blurb:"Makes mischief and challenges authority with illusion and stealth.", features:domainSpells({
    3:["Charm Person","Disguise Self","Invisibility","Pass without Trace"], 5:["Hypnotic Pattern","Nondetection"], 7:["Confusion","Dimension Door"], 9:["Dominate Person","Modify Memory"]
  }, {
    3:[
      {name:"Blessing of the Trickster", text:"As a Magic action, you or a willing creature within 30 feet gains advantage on Dexterity (Stealth) checks until you finish a long rest or use this again. Switch it on from the Active effects card when it's you."},
      {name:"Invoke Duplicity", text:"As a bonus action, spend a use of Channel Divinity to create an illusion of yourself within 30 feet for 1 minute (it ends if you dismiss it or are incapacitated). You can cast spells as though you were in its space, using your own senses. When you and it are both within 5 feet of a creature that can see it, you have advantage on attack rolls against that creature. As a bonus action, you can move it up to 30 feet to a space within 120 feet of you. Start it from Channel Divinity on the Vitals tab."}
    ],
    6:[{name:"Trickster's Transposition", text:"Whenever you take the bonus action to create or move the illusion, you can teleport, swapping places with it."}],
    17:[{name:"Improved Duplicity", text:"You and your allies have advantage on attack rolls against a creature within 5 feet of the illusion. When the illusion ends, you or a creature you choose within 5 feet of it regains hit points equal to your cleric level."}]
  })},
  {name:"War Domain (2024)", edition:"2024", blurb:"Inspires valor and smites foes in battle.", features:domainSpells({
    3:["Guiding Bolt","Magic Weapon","Shield of Faith","Spiritual Weapon"], 5:["Crusader's Mantle","Spirit Guardians"], 7:["Fire Shield","Freedom of Movement"], 9:["Hold Monster","Steel Wind Strike"]
  }, {
    3:[
      {name:"Guided Strike", remind:{when:"reaction", line:"An ally within 30 ft misses: spend Channel Divinity for +10 to the roll"},
        text:"When you or a creature within 30 feet misses with an attack roll, you can spend a use of Channel Divinity to give that roll +10, possibly making it hit. For another creature's roll, this takes your reaction. Your own misses offer it in the dice tray."},
      {name:"War Priest", text:"As a bonus action, you can make one attack with a weapon or an unarmed strike. Uses equal to your Wisdom modifier (minimum once), regained on a short or long rest."}
    ],
    6:[{name:"War God's Blessing", text:"You can spend a use of Channel Divinity to cast Shield of Faith or Spiritual Weapon without a spell slot. Cast this way, it doesn't need concentration and lasts 1 minute, ending early if you cast it again, are incapacitated or die. Use it from Channel Divinity on the Vitals tab."}],
    17:[{name:"Avatar of Battle", resist:["bludgeoning","piercing","slashing"], text:"You have resistance to bludgeoning, piercing and slashing damage."}]
  })}
];
