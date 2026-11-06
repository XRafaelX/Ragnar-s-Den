/* The 2024 Ranger (Player's Handbook 2024, pp. 117 to 127), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-06. Only what differs from
   the 2014 ranger is here. What the features do on the sheet is in
   js/core/ranger.js.

   Like the 2024 paladin it casts from level 1 (`casterType` "halfUp") and
   prepares its spells (EDITION_PREPARED in js/data/spells-known.js).

   The 2024 subclasses carry " (2024)" (classLevelOf counts them for their
   2014 names, so what's the same is automated once). The older ranger
   subclasses with no 2024 version stay open to a 2024 ranger. */
import { masteryPick } from "./fighter-2024.js";

var SKILLS = ["Animal Handling","Athletics","Insight","Investigation","Nature","Perception","Stealth","Survival"];
var STYLES = ["Archery","Blind Fighting","Defense","Druidic Warrior","Dueling","Great Weapon Fighting","Interception","Protection","Thrown Weapon Fighting","Two-Weapon Fighting","Unarmed Fighting"];
var EXPLORERS_PACK = {name:"Explorer's Pack",qty:1,weight:59,notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"};
/* Favored Enemy's casts of Hunter's Mark without a slot, by ranger level. */
export var FAVORED_ENEMY_CASTS = [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6];

export var RANGER_2024 = {
  label: "2024 Ranger",
  blurb: "A wilderness warrior who casts from level 1, with Hunter's Mark and Weapon Mastery.",
  card: {perks: ["Hunter's Mark", "Spells at level 1", "Weapon Mastery"],
    text: "The 2024 rules for the ranger: spells and the mastery of two kinds of weapon from level 1, Hunter's Mark cast free a few times a day and growing stronger, Expertise and the 2024 subclasses.",
    outcome: "<b>2024 Ranger:</b> spells from level 1, free Hunter's Marks, Weapon Mastery, and the 2024 features, gear and subclasses."},
  which: {old: "The Player's Handbook 2014 ranger.", now: "The Player's Handbook 2024 ranger: spells from level 1, free Hunter's Marks and Weapon Mastery."},
  swaps: {"Beast Master":"Beast Master (2024)", "Fey Wanderer":"Fey Wanderer (2024)", "Gloom Stalker":"Gloom Stalker (2024)", "Hunter":"Hunter (2024)"},
  casterType: "halfUp",
  fightingStyle: {level:2, options:STYLES},
  skillChoices: {count:3, options:SKILLS},
  proficiencies: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], savingThrows:["str","dex"]},
  // A multiclass: martial weapons, light and medium armor, shields and a skill from the list (p. 118).
  multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Martial weapons"], tools:[], note:"",
    profs:{pick:[{kind:"skill", label:"Gain proficiency in one skill from the ranger's list", options:SKILLS}]}},
  // The wizard's Spells step (no cantrips, two prepared spells).
  spellcasting: {ability:"wis", spellList:"Ranger", cantrips:0, spells:2, prepares:true, slots:{1:2},
    spellsLabel:"Prepared spells",
    spellsHelp:"You prepare two level 1 ranger spells, and more as you level. Cure Wounds and Ensnaring Strike are the book's suggestions. Hunter's Mark is always prepared on top. Each long rest you can swap one for another."},
  choices: [],
  level1: [
    {name:"Spellcasting", text:"You cast ranger spells using Wisdom. You prepare two level 1 spells, and more as you level, up to the Prepared count on the Spells tab. Whenever you finish a long rest, you can replace one of them with another ranger spell you have slots for. A druidic focus can be your spellcasting focus."},
    {name:"Favored Enemy", spells:["Hunter's Mark"], spellKind:"prepared", text:"You always have Hunter's Mark prepared. You can cast it twice without a spell slot (more as you level), and you regain those casts on a long rest. Mark a creature from Hunter's Mark on the Active effects card: it uses a free cast first, then a spell slot. The extra damage is on your weapon cards."},
    {name:"Weapon Mastery", text:"You can use the mastery properties of two kinds of weapons you are proficient with, such as longbows and shortswords. Whenever you finish a long rest, you can change them on the Feature choices card.", profs:{pick:[masteryPick(2)]}}
  ],
  features: {
    2: [
      {name:"Deft Explorer", text:"Expertise in one of your skill proficiencies that lacks it, and two languages of your choice.", profs:{pick:[{kind:"expertise"}, {kind:"language", count:2}]}},
      {name:"Fighting Style", text:"You gain a Fighting Style feat of your choice, or Druidic Warrior instead: two druid cantrips that count as ranger spells and use Wisdom. Guidance and Starry Wisp are recommended. Whenever you gain a ranger level, you can replace one of those cantrips with another druid cantrip. The level-up asks you to choose."}
    ],
    5: [{name:"Extra Attack", text:"You can attack twice instead of once whenever you take the Attack action on your turn."}],
    6: [{name:"Roving", walkSpeed:10, speedWhen:"noHeavyArmor", speeds:[{type:"climb", value:"walk"}, {type:"swim", value:"walk"}],
      text:"Your speed increases by 10 feet while you aren't wearing heavy armor (already added). You also have a climb speed and a swim speed equal to your speed."}],
    9: [{name:"Expertise", text:"Expertise in two more of your skill proficiencies that lack it.", profs:{pick:[{kind:"expertise", count:2}]}}],
    10: [{name:"Tireless", text:"As a Magic action, give yourself temporary hit points equal to 1d8 + your Wisdom modifier (minimum 1). You can do this a number of times equal to your Wisdom modifier (minimum once), regained on a long rest. Whenever you finish a short rest, your exhaustion level, if any, drops by 1 (the rest does this for you)."}],
    13: [{name:"Relentless Hunter", remind:{when:"always", line:"Taking damage can't break your concentration on Hunter's Mark"},
      text:"Taking damage can't break your concentration on Hunter's Mark."}],
    14: [{name:"Nature's Veil", text:"As a bonus action, you turn invisible until the end of your next turn. You can do this a number of times equal to your Wisdom modifier (minimum once), regained on a long rest. Turn invisible from the Active effects card."}],
    17: [{name:"Precise Hunter", text:"You have advantage on attack rolls against the creature marked by your Hunter's Mark (already on your attacks while it's on)."}],
    18: [{name:"Feral Senses", sense:"Blindsight 30 ft", text:"You have blindsight with a range of 30 feet."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Dimensional Travel is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Foe Slayer", text:"The damage die of your Hunter's Mark is a d10 rather than a d6 (already on your weapon cards)."}]
  },
  // The book's starting equipment: (A) or (B) 150 gp (p. 118).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Studded leather, scimitar, shortsword, longbow, 20 arrows, quiver, druidic focus, Explorer's Pack and 7 gp", coins:{gp:7}, items:[
          {name:"Studded Leather",qty:1,weight:13,notes:"light armor",type:"armor",category:"light",baseAC:12},
          {name:"Scimitar",qty:1,weight:3,notes:"finesse, light",type:"weapon",damageDice:"1d6",damageType:"Slashing",ability:"finesse",proficient:true},
          {name:"Shortsword",qty:1,weight:2,notes:"finesse, light",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Longbow",qty:1,weight:2,notes:"ammunition, heavy, two-handed, range 150/600",type:"weapon",damageDice:"1d8",damageType:"Piercing",ability:"dex",proficient:true},
          {name:"Arrows",qty:20,weight:0.05,notes:"ammunition, in a quiver"},
          {name:"Druidic Focus",qty:1,weight:1,notes:"spellcasting focus: a sprig of mistletoe"},
          EXPLORERS_PACK
        ]},
        {key:"gold", label:"150 gp", detail:"Buy your own gear", coins:{gp:150}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* A subclass's spell table: the feature at each level with what's prepared
   so far, added to that subclass's own features. */
function subclassSpells(label, table, features){
  var have = [];
  Object.keys(table).forEach(function(lv){
    have = have.concat(table[lv]);
    var f = {name:label, text:"You always have " + have.join(", ").replace(/, ([^,]*)$/, " and $1") + " prepared. They don't count against your prepared spells.", spells:have.slice(), spellKind:"prepared"};
    if(lv!=="3") f.replaces = label;
    features[lv] = [f].concat(features[lv] || []);
  });
  return features;
}
var GIFTS = ["Illusory butterflies","Flowers in your hair","A comforting scent","A dancing shadow","Horns or antlers","Colors that change"];
var GIFT_DETAILS = {
  "Illusory butterflies": "Illusory butterflies flutter around you while you take a short or long rest.",
  "Flowers in your hair": "Flowers bloom from your hair each dawn.",
  "A comforting scent": "You faintly smell of cinnamon, lavender, nutmeg, or another comforting herb or spice.",
  "A dancing shadow": "Your shadow dances while no one is looking directly at it.",
  "Horns or antlers": "Horns or antlers sprout from your head.",
  "Colors that change": "Your skin and hair change color each dawn."
};
var PREY = {"Colossus Slayer": "Once per turn when you hit a creature with a weapon, it takes an extra 1d8 damage if it's missing any of its hit points. The die is on your weapon cards.",
  "Horde Breaker": "Once on each of your turns when you attack with a weapon, you can make another attack with the same weapon against a different creature within 5 feet of the first target, within the weapon's range, that you haven't attacked this turn."};
var TACTICS = {"Escape the Horde": "Opportunity attacks have disadvantage against you.",
  "Multiattack Defense": "When a creature hits you with an attack roll, it has disadvantage on all its other attack rolls against you this turn."};

/* The 2024 subclasses (Player's Handbook 2024, pp. 122 to 127). */
export var RANGER_2024_SUBCLASSES = [
  {name:"Beast Master (2024)", edition:"2024", blurb:"Bonds with a primal beast that fights at your side.", features:{
    3:[{name:"Primal Companion", text:"You summon a primal beast: a Beast of the Land, the Sea or the Sky, in the shape of an animal you choose. It obeys you and vanishes if you die. In combat it acts on your turn and only Dodges, unless you take a bonus action to command it, or give up one of your attacks to command its Beast's Strike. If it died within the last hour, a Magic action and a spell slot bring it back after 1 minute. After a long rest you can summon a different one. Its card is on the Companions tab."}],
    7:[{name:"Exceptional Training", text:"When you take a bonus action to command your beast, it can also take the Dash, Disengage, Dodge or Help action with its own bonus action. Its attacks can deal force damage or their normal type."}],
    11:[{name:"Bestial Fury", text:"When you command your beast's Beast's Strike, it can use it twice. The first time each turn it hits the creature marked by your Hunter's Mark, it deals extra force damage equal to that spell's bonus damage."}],
    15:[{name:"Share Spells", text:"When you cast a spell targeting yourself, you can also affect your beast with it if it's within 30 feet of you."}]
  }},
  {name:"Fey Wanderer (2024)", edition:"2024", blurb:"Wields fey mirth and fury, charming and frightening foes.", features:subclassSpells("Fey Wanderer Spells", {
    3:["Charm Person"], 5:["Misty Step"], 9:["Summon Fey"], 13:["Dimension Door"], 17:["Mislead"]
  }, {
    3:[
      {name:"Dreadful Strikes", text:"When you hit a creature with a weapon, you can deal an extra 1d4 psychic damage. A creature can take this only once per turn. It becomes 1d6 at ranger level 11. The die is on your weapon cards."},
      {name:"Feywild Gift", text:"A fey blessing marks you. Choose it on the Feature choices card, or roll for it in the book.", profs:{pick:[{kind:"choice", id:"feywildGift", noun:"gift", count:1, options:GIFTS, details:GIFT_DETAILS, label:"Choose your Feywild gift"}]}},
      {name:"Otherworldly Glamour", text:"Add your Wisdom modifier (minimum +1) to your Charisma checks (already added on the sheet), and gain proficiency in Deception, Performance or Persuasion (your choice).", profs:{pick:[{kind:"skill", options:["Deception","Performance","Persuasion"]}]}}
    ],
    7:[{name:"Beguiling Twist", saveDc:{save:"wis", ability:"wis"}, saveNote:{abilities:["str","dex","con","int","wis","cha"], text:"Advantage on saves to avoid or end the charmed or frightened condition."},
      text:"You have advantage on saving throws to avoid or end the charmed or frightened condition. When you or a creature you can see within 120 feet succeeds on such a save, you can take a reaction to force a different creature you can see within 120 feet to make a Wisdom save against your spell save DC. On a failure it's charmed or frightened (your choice) for 1 minute, repeating the save at the end of each of its turns."}],
    11:[{name:"Fey Reinforcements", spells:["Summon Fey"], spellKind:"prepared", spellLabel:"Free 1/long rest", spellTip:"Fey Reinforcements: cast it once without a spell slot or material component (counter on Vitals). It can skip concentration and last 1 minute.",
      text:"You can cast Summon Fey without a material component. You can also cast it once without a spell slot, regained on a long rest. Whenever you cast it, you can make it not need concentration, and then it lasts 1 minute."}],
    15:[{name:"Misty Wanderer", spells:["Misty Step"], spellKind:"prepared", spellLabel:"Free, WIS mod times", spellTip:"Misty Wanderer: cast it without a spell slot a number of times equal to your Wisdom modifier (counter on Vitals), bringing a willing creature within 5 feet along.",
      text:"You can cast Misty Step without a spell slot a number of times equal to your Wisdom modifier (minimum once), regained on a long rest. Whenever you cast it, you can bring along one willing creature you can see within 5 feet of you. It teleports to a space within 5 feet of your destination."}]
  })},
  {name:"Gloom Stalker (2024)", edition:"2024", blurb:"Draws on shadow magic to strike from the dark.", features:subclassSpells("Gloom Stalker Spells", {
    3:["Disguise Self"], 5:["Rope Trick"], 9:["Fear"], 13:["Greater Invisibility"], 17:["Seeming"]
  }, {
    3:[
      {name:"Dread Ambusher", initiative:"wis", text:"Initiative Bonus: you add your Wisdom modifier to initiative (already added).\nAmbusher's Leap: at the start of your first turn of each combat, your speed increases by 10 feet until the end of that turn. Switch it on from the Active effects card.\nDreadful Strike: when you hit a creature with a weapon, you can deal an extra 2d6 psychic damage, once per turn. You can do this a number of times equal to your Wisdom modifier (minimum once), regained on a long rest. The button is on your weapon cards."},
      {name:"Umbral Sight", darkvision:{range:60, add:60}, remind:{when:"always", line:"In darkness, you're invisible to creatures that rely on darkvision to see you"},
        text:"You gain darkvision out to 60 feet, or 60 feet more if you already have it. While entirely in darkness, you're invisible to any creature that relies on darkvision to see you there."}
    ],
    7:[{name:"Iron Mind", text:"You gain proficiency in Wisdom saving throws, or in Intelligence or Charisma saves (your choice) if you already have Wisdom.", profs:{pick:[{kind:"save", options:["wis"], fallback:["int","cha"]}]}}],
    11:[{name:"Stalker's Flurry", saveDc:{save:"wis", ability:"wis"}, text:"Your Dreadful Strike becomes 2d8 psychic. When you use it, you can also cause one of these.\nSudden Strike: make another attack with the same weapon against a different creature within 5 feet of the first target and within the weapon's range.\nMass Fear: the target and each creature within 10 feet of it make a Wisdom save against your spell save DC, or are frightened until the start of your next turn."}],
    15:[{name:"Shadowy Dodge", remind:{when:"reaction", line:"An attack roll against you gets disadvantage, then teleport 30 feet"},
      text:"When a creature makes an attack roll against you, you can take a reaction to give it disadvantage. Whether it hits or misses, you can then teleport up to 30 feet to an unoccupied space you can see."}]
  })},
  {name:"Hunter (2024)", edition:"2024", blurb:"Protects nature and people by hunting what would destroy them.", features:{
    3:[
      {name:"Hunter's Lore", text:"While a creature is marked by your Hunter's Mark, you know whether it has any immunities, resistances or vulnerabilities, and what they are."},
      {name:"Hunter's Prey", remind:{choice:"huntersPrey2024", by:{"Horde Breaker":{when:"always", line:"Once per turn, one more attack at a different creature within 5 feet of your target"}}},
        text:"Choose Colossus Slayer or Horde Breaker. Whenever you finish a short or long rest, you can change it on the Feature choices card.\nColossus Slayer: " + PREY["Colossus Slayer"] + "\nHorde Breaker: " + PREY["Horde Breaker"],
        profs:{pick:[{kind:"choice", id:"huntersPrey2024", noun:"option", count:1, options:Object.keys(PREY), details:PREY, label:"Choose your Hunter's Prey"}]}}
    ],
    7:[{name:"Defensive Tactics", remind:{choice:"defensiveTactics2024", by:{"Escape the Horde":{when:"always", line:"Opportunity attacks have disadvantage against you"}, "Multiattack Defense":{when:"always", line:"A creature that hits you has disadvantage on its other attacks against you this turn"}}},
      text:"Choose Escape the Horde or Multiattack Defense. Whenever you finish a short or long rest, you can change it on the Feature choices card.\nEscape the Horde: " + TACTICS["Escape the Horde"] + "\nMultiattack Defense: " + TACTICS["Multiattack Defense"],
      profs:{pick:[{kind:"choice", id:"defensiveTactics2024", noun:"option", count:1, options:Object.keys(TACTICS), details:TACTICS, label:"Choose your Defensive Tactics"}]}}],
    11:[{name:"Superior Hunter's Prey", remind:{when:"always", line:"Once per turn, Hunter's Mark's damage can hit another creature within 30 feet"},
      text:"Once per turn when you deal damage to the creature marked by your Hunter's Mark, you can also deal that spell's extra damage to a different creature you can see within 30 feet of the first."}],
    15:[{name:"Superior Hunter's Defense", remind:{when:"reaction", line:"When you take damage, resist it and that type until the turn ends"},
      text:"When you take damage, you can take a reaction to give yourself resistance to that damage and any other damage of the same type until the end of the current turn."}]
  }}
];
