/* The 2024 Wizard (Player's Handbook 2024, pp. 164 to 175), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-06. Only what differs from
   the 2014 wizard is here. What the features do on the sheet is in
   js/core/wizard.js.

   The spellbook, Arcane Recovery and the Prepared Spells column are the
   2014 wizard's in the app already. New: a cantrip swap after each long
   rest, Scholar's Expertise at 2, the subclass at 3, Memorize Spell at 5.

   The subclasses have new names ("Evoker" for "School of Evocation"):
   classLevelOf's SUBCLASS_ALIASES counts them for their 2014 names, so
   what's the same is automated once. Each one's Savant adds spells of
   its school to the spellbook for free: two at level 3 and one more at
   each new level of spell slots (the New spells step asks, SAVANT_SCHOOLS). */

var SKILLS = ["Arcana","History","Insight","Investigation","Medicine","Nature","Religion"];
var SCHOLAR_SKILLS = ["Arcana","History","Investigation","Medicine","Nature","Religion"];

/* Each subclass's Savant school (pp. 172 to 175). */
export var SAVANT_SCHOOLS = {"Abjurer": "Abjuration", "Diviner": "Divination", "Evoker": "Evocation", "Illusionist": "Illusion"};
/* Wizard levels with a new level of spell slots after 3, when a Savant adds one more. */
export var SAVANT_LEVELS = [5, 7, 9, 11, 13, 15, 17];

export var WIZARD_2024 = {
  label: "2024 Wizard",
  blurb: "A scholar of magic with a spellbook, Scholar at level 2 and a subclass at level 3.",
  card: {perks: ["Scholar at 2", "Memorize Spell", "Savant spells"],
    text: "The 2024 rules for the wizard: a cantrip swap after each long rest, Ritual Adept, Scholar's Expertise at level 2, Memorize Spell at level 5, a subclass at level 3 and the 2024 subclasses, each adding spells of its school to your spellbook for free.",
    outcome: "<b>2024 Wizard:</b> Scholar at level 2, Memorize Spell, a subclass at level 3, and the 2024 features, gear and subclasses."},
  which: {old: "The Player's Handbook 2014 wizard.", now: "The Player's Handbook 2024 wizard: Scholar at level 2, Memorize Spell and a subclass at level 3."},
  swaps: {"School of Abjuration":"Abjurer", "School of Divination":"Diviner", "School of Evocation":"Evoker", "School of Illusion":"Illusionist"},
  subclassLevel: 3,
  skillChoices: {count:2, options:SKILLS},
  proficiencies: {armor:[], weapons:["Simple weapons"], tools:[], savingThrows:["int","wis"]},
  // A multiclass: only the level 1 features (p. 165).
  multiclassProfs: {armor:[], weapons:[], tools:[], note:""},
  spellcasting: {ability:"int", spellList:"Wizard", cantrips:3, spells:6, prepares:true, slots:{1:2},
    spellsLabel:"Spellbook spells",
    spellsHelp:"Your spellbook starts with six level 1 wizard spells. Detect Magic, Feather Fall, Mage Armor, Magic Missile, Sleep and Thunderwave are the book's suggestions. You prepare 4 of them (more as you level) and can change which after a long rest."},
  choices: [],
  level1: [
    {name:"Spellcasting", text:"You cast wizard spells using Intelligence. You know three cantrips (four at level 4, five at 10), and after each long rest you can swap one for another wizard cantrip. Light, Mage Hand and Ray of Frost are recommended. Your spellbook starts with six level 1 wizard spells, and each wizard level adds two more of levels you have slots for. You prepare spells from it, following the Prepared Spells column, and can change them after a long rest. An arcane focus or your spellbook can be your spellcasting focus."},
    {name:"Ritual Adept", text:"You can cast any spell in your spellbook that has the ritual tag as a ritual, reading from the book. It needn't be prepared."},
    {name:"Arcane Recovery", text:"When you finish a short rest, you can recover spent spell slots with a combined level up to half your wizard level (round up), none of level 6 or higher. Once per long rest. The button is on the Arcane Recovery row on Vitals."}
  ],
  features: {
    2: [{name:"Scholar", text:"Choose one of these skills you're proficient in: Arcana, History, Investigation, Medicine, Nature or Religion. You have Expertise in it.",
      profs:{pick:[{kind:"expertise", options:SCHOLAR_SKILLS, label:"Choose a skill for Scholar's Expertise"}]}}],
    5: [{name:"Memorize Spell", remind:{when:"always", line:"After a short rest, swap one prepared spell for another in your spellbook"},
      text:"Whenever you finish a short rest, you can study your spellbook and replace one of your prepared level 1+ wizard spells with another level 1+ spell from the book."}],
    18: [{name:"Spell Mastery", text:"Choose a level 1 and a level 2 spell in your spellbook with a casting time of an action. You always have them prepared, and you can cast them at their lowest level without a spell slot. After a long rest, you can swap either for another eligible spell of the same level from your book.",
      profs:{pick:[{kind:"spell", from:"spellbook", level:1, grant:"mastery", kindLabel:"Spell Mastery", label:"Choose a level 1 spell from your spellbook"},
        {kind:"spell", from:"spellbook", level:2, grant:"mastery", kindLabel:"Spell Mastery", label:"Choose a level 2 spell from your spellbook"}]}}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Spell Recall is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Signature Spells", text:"Choose two level 3 spells in your spellbook as your signature spells. You always have them prepared, and you can cast each once at level 3 without a spell slot, regained on a short or long rest. To cast either at a higher level, you spend a slot.",
      profs:{pick:[{kind:"spell", from:"spellbook", level:3, count:2, grant:"prepared", label:"Choose two level 3 spells from your spellbook"}]}}]
  },
  // The book's starting equipment: (A) or (B) 55 gp (p. 165).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"2 daggers, arcane focus (quarterstaff), robe, spellbook, Scholar's Pack and 5 gp", coins:{gp:5}, items:[
          {name:"Dagger",qty:2,weight:1,notes:"finesse, light, thrown 20/60",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Quarterstaff",qty:1,weight:4,notes:"versatile 1d8, arcane focus",type:"weapon",damageDice:"1d6",damageType:"Bludgeoning",ability:"str",proficient:true},
          {name:"Robe",qty:1,weight:4,notes:""},
          {name:"Spellbook",qty:1,weight:3,notes:"spellcasting focus"},
          {name:"Scholar's Pack",qty:1,weight:10,notes:"backpack, book of lore, ink, quill, 10 sheets of parchment, bag of sand, small knife"}
        ]},
        {key:"gold", label:"55 gp", detail:"Buy your own gear", coins:{gp:55}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

function savant(school){
  return {name:school + " Savant", text:"Add two wizard " + school.toLowerCase() + " spells of level 2 or lower to your spellbook for free. Each time you gain a new level of spell slots, add one more " + school.toLowerCase() + " spell you have slots for. The New spells step asks for them."};
}

/* The 2024 subclasses (Player's Handbook 2024, pp. 172 to 175). */
export var WIZARD_2024_SUBCLASSES = [
  {name:"Abjurer", edition:"2024", blurb:"Shields companions and banishes foes.", features:{
    3:[savant("Abjuration"),
      {name:"Arcane Ward", text:"When you cast an abjuration spell with a spell slot, you can create a ward on yourself that lasts until you finish a long rest (once per long rest). Its hit point maximum is twice your wizard level + your Intelligence modifier. It takes damage before you do, after your resistances and vulnerabilities, and you take any excess. At 0 hit points it can't absorb damage, but its magic stays. Casting an abjuration spell with a slot gives it hit points equal to twice the slot's level, or as a bonus action you can spend a slot for the same. The ward is on Vitals."}],
    6:[{name:"Projected Ward", remind:{when:"reaction", line:"When a creature within 30 feet takes damage, your Arcane Ward takes it instead"},
      text:"When a creature you can see within 30 feet takes damage, you can take a reaction to have your Arcane Ward absorb it. The creature takes any excess, after its resistances and vulnerabilities."}],
    10:[{name:"Spell Breaker", spells:["Counterspell","Dispel Magic"], spellKind:"known", spellLabel:"Always prepared",
      spellTip:"Spell Breaker: always prepared. Dispel Magic as a bonus action, with your proficiency bonus on its check. If either fails to stop a spell, the slot isn't spent.",
      remind:{when:"bonus", line:"Cast Dispel Magic, adding your proficiency bonus to its check"},
      text:"You always have Counterspell and Dispel Magic prepared. You can cast Dispel Magic as a bonus action, and add your proficiency bonus to its ability check. When you cast either with a spell slot, the slot isn't spent if the spell fails to stop a spell."}],
    14:[{name:"Spell Resistance", resist:["the damage of spells"], advantage:{on:"save", abilities:"all", when:"against spells"},
      text:"You have advantage on saving throws against spells, and resistance to the damage of spells."}]
  }},
  {name:"Diviner", edition:"2024", blurb:"Learns the secrets of the multiverse.", features:{
    3:[savant("Divination"),
      {name:"Portent", text:"When you finish a long rest, roll two d20s and record them. You can replace any d20 test made by you or a creature you can see with one of them, choosing before the roll, once per turn. Each can be used once, and unused ones are lost at your next long rest. The dice are on Vitals."}],
    6:[{name:"Expert Divination", text:"When you cast a divination spell using a level 2+ spell slot, you regain one spent slot of a lower level than that one, level 5 at most."}],
    10:[{name:"The Third Eye", text:"As a bonus action, choose one benefit until you start a short or long rest. Darkvision: 120 feet. Greater Comprehension: you can read any language. See Invisibility: you can cast See Invisibility without a spell slot. Once per short or long rest. Start it from the Active effects card."}],
    14:[{name:"Greater Portent", text:"You roll three d20s for Portent instead of two."}]
  }},
  {name:"Evoker", edition:"2024", blurb:"Creates explosive elemental effects.", features:{
    3:[savant("Evocation"),
      {name:"Potent Cantrip", remind:{when:"always", line:"A cantrip that misses or is saved against still deals half its damage"},
        text:"When you cast a cantrip at a creature and miss with the attack roll, or the target succeeds on its save, the target still takes half the cantrip's damage (if any) but no other effect."}],
    6:[{name:"Sculpt Spells", text:"When you cast an evocation spell that affects other creatures you can see, choose up to 1 + the spell's level of them. They automatically succeed on their saves against it, and take no damage if they'd take half on a success."}],
    10:[{name:"Empowered Evocation", text:"Whenever you cast a wizard evocation spell, you can add your Intelligence modifier to one damage roll of that spell."}],
    14:[{name:"Overchannel", text:"When you cast a wizard spell with a level 1 to 5 slot that deals damage, you can deal maximum damage with it on that turn. The first use after a long rest is free. Each later use before a long rest deals you 2d12 necrotic damage per slot level, 1d12 more per level each further time. This damage ignores resistance and immunity."}]
  }},
  {name:"Illusionist", edition:"2024", blurb:"Weaves subtle spells of deception.", features:{
    3:[savant("Illusion"),
      {name:"Improved Illusions", spells:["Minor Illusion"], spellKind:"known",
        remind:{when:"bonus", line:"Cast Minor Illusion, with both a sound and an image"},
        text:"You can cast illusion spells without verbal components, and an illusion spell with a range of 10 feet or more gets 60 feet more. You know Minor Illusion (another wizard cantrip if you knew it), not counting against your cantrips. With one casting it can make both a sound and an image, and you can cast it as a bonus action."}],
    6:[{name:"Phantasmal Creatures", spells:["Summon Beast","Summon Fey"], spellKind:"known", spellLabel:"Free 1/long rest",
      spellTip:"Phantasmal Creatures: always prepared. Make it an illusion to cast it once without a spell slot (counter on Vitals), with half the creature's hit points.",
      text:"You always have Summon Beast and Summon Fey prepared. When you cast either, you can make it an illusion spell, so the creature looks spectral. You can cast the illusion version of each once without a spell slot, regained on a long rest, but the creature then has half its hit points."}],
    10:[{name:"Illusory Self", text:"When a creature hits you with an attack roll, you can take a reaction to put an illusory duplicate of yourself in the way: the attack misses. Once per short or long rest, or spend a level 2+ spell slot to use it again."}],
    14:[{name:"Illusory Reality", remind:{when:"bonus", line:"Make one nonmagical object in your illusion spell real for 1 minute"},
      text:"When you cast an illusion spell with a spell slot, you can make one inanimate, nonmagical object in the illusion real, on your turn as a bonus action while the spell lasts. It stays real for 1 minute. It can't deal damage or give conditions."}]
  }}
];
