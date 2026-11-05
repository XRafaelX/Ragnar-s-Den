/* The 2024 Barbarian (Player's Handbook 2024, pp. 51 to 56), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-05. Only what differs from
   the 2014 barbarian is here. What the features do on the sheet is in
   js/core/barbarian-2024.js.

   Path of the Berserker and Path of the Zealot have 2014 versions, so
   theirs carry " (2024)". Path of the Wild Heart and Path of the World Tree
   are new, and the older paths with no 2024 version stay open. */
import { masteryPick } from "./fighter-2024.js";

var SKILLS = ["Animal Handling","Athletics","Intimidation","Nature","Perception","Survival"];
function masteryText(kinds, next){
  return "You can use the mastery properties of " + kinds + " kinds of simple or martial melee weapons of your choice" + next + ". Whenever you finish a long rest, you can change one of them. Change them on the Feature choices card.";
}
var BRUTAL_LIST = "Forceful Blow: the target is pushed 15 feet straight away from you, and you can then move up to half your speed straight toward it with no opportunity attacks.\nHamstring Blow: the target's speed drops by 15 feet until the start of your next turn.";
var BRUTAL_MORE = "\nStaggering Blow: the target has disadvantage on its next saving throw and can't make opportunity attacks until the start of your next turn.\nSundering Blow: before the start of your next turn, the next attack roll another creature makes against the target gains +5.";

export var BARBARIAN_2024 = {
  label: "2024 Barbarian",
  blurb: "A primal warrior with Weapon Mastery, Brutal Strike and a Rage you can keep going.",
  card: {perks: ["Weapon Mastery", "Brutal Strike", "New features"],
    text: "The 2024 rules for the barbarian: the mastery of two kinds of melee weapon (more as you level), a rage back on a short rest, Strength for some skills while raging, Brutal Strike in place of Brutal Critical and the 2024 paths.",
    outcome: "<b>2024 Barbarian:</b> Weapon Mastery, a rage back on a short rest, Brutal Strike, and the 2024 features, gear and paths."},
  which: {old: "The Player's Handbook 2014 barbarian.", now: "The Player's Handbook 2024 barbarian: Weapon Mastery, Brutal Strike and the 2024 features."},
  swaps: {"Path of the Berserker":"Path of the Berserker (2024)", "Path of the Zealot":"Path of the Zealot (2024)"},
  skillChoices: {count:2, options:SKILLS},
  // A multiclass gets martial weapons and shields (p. 51).
  multiclassProfs: {armor:["Shields"], weapons:["Martial weapons"], tools:[], note:""},
  choices: [],
  level1: [
    {name:"Rage", text:"As a bonus action, if you aren't wearing heavy armor, you enter a Rage. While it's active you have resistance to bludgeoning, piercing and slashing damage, a bonus to damage on attacks using Strength (+2, +3 from level 9, +4 from level 16), and advantage on Strength checks and saving throws. You can't cast spells or keep concentration.\nIt lasts until the end of your next turn. On your next turn, you keep it going by attacking an enemy, forcing an enemy to make a saving throw, or taking a bonus action. It can last up to 10 minutes, and ends early if you put on heavy armor or are incapacitated.\nYou regain one use on a short rest and all of them on a long rest."},
    {name:"Unarmored Defense", text:"While you aren't wearing any armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still have this benefit."},
    {name:"Weapon Mastery", text:masteryText("two", " (three from level 4, four from level 10)"), profs:{pick:[masteryPick(2, true)]}}
  ],
  features: {
    2: [
      {name:"Danger Sense", text:"You have advantage on Dexterity saving throws unless you are incapacitated.", advantage:{on:"save", abilities:["dex"]}},
      {name:"Reckless Attack", text:"When you make your first attack roll on your turn, you can attack recklessly. You have advantage on attack rolls using Strength until the start of your next turn, but attack rolls against you have advantage during that time. Switch it on from Active effects."}
    ],
    3: [{name:"Primal Knowledge", text:"You gain proficiency in another skill from the barbarian's list. While your Rage is active, Acrobatics, Intimidation, Perception, Stealth and Survival checks can be made as Strength checks. The sheet does this for you when your Strength is at least as good.",
      profs:{pick:[{kind:"skill", label:"Choose a skill from the barbarian's list", options:SKILLS}]}}],
    4: [{name:"Weapon Mastery", replaces:"Weapon Mastery", text:masteryText("three", " (four from level 10)"), profs:{pick:[masteryPick(1, true)]}}],
    5: [
      {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."},
      {name:"Fast Movement", text:"Your speed increases by 10 feet while you aren't wearing heavy armor. (Added to your speed while that's true.)", speed:10, speedWhen:"noHeavyArmor"}
    ],
    7: [
      {name:"Feral Instinct", text:"You have advantage on initiative rolls.", advantage:{on:"initiative"}},
      {name:"Instinctive Pounce", remind:{when:"bonus", line:"Move up to half your speed as part of entering your rage"}, text:"As part of the bonus action you take to enter your Rage, you can move up to half your speed."}
    ],
    9: [{name:"Brutal Strike", text:"If you use Reckless Attack, you can give up advantage on one Strength attack on your turn, as long as that attack doesn't have disadvantage. If it hits, the target takes an extra 1d10 damage of the weapon's type, and you can cause one of these effects. The weapon card's Brutal Strike button does this.\n" + BRUTAL_LIST}],
    10: [{name:"Weapon Mastery", replaces:"Weapon Mastery", text:masteryText("four", ""), profs:{pick:[masteryPick(1, true)]}}],
    11: [{name:"Relentless Rage", text:"If you drop to 0 hit points while your Rage is active and don't die outright, you can make a DC 10 Constitution saving throw. If you succeed, your hit points become twice your barbarian level. Each later use adds 5 to the DC, which resets to 10 after a short or long rest."}],
    13: [{name:"Brutal Strike", replaces:"Brutal Strike", text:"If you use Reckless Attack, you can give up advantage on one Strength attack on your turn, as long as that attack doesn't have disadvantage. If it hits, the target takes an extra 1d10 damage of the weapon's type, and you can cause one of these effects. The weapon card's Brutal Strike button does this.\n" + BRUTAL_LIST + BRUTAL_MORE}],
    15: [{name:"Persistent Rage", text:"When you roll initiative, you can regain all your uses of Rage, once per long rest. The dice tray offers it. Your Rage also lasts 10 minutes without you doing anything to keep it going, and ends early only if you fall unconscious or put on heavy armor."}],
    17: [{name:"Brutal Strike", replaces:"Brutal Strike", text:"If you use Reckless Attack, you can give up advantage on one Strength attack on your turn, as long as that attack doesn't have disadvantage. If it hits, the target takes an extra 2d10 damage of the weapon's type, and you can cause two different effects. The weapon card's Brutal Strike button does this.\n" + BRUTAL_LIST + BRUTAL_MORE}],
    18: [{name:"Indomitable Might", text:"If your total for a Strength check or Strength saving throw is lower than your Strength score, you can use the score instead."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Irresistible Offense is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Primal Champion", text:"Your Strength and Constitution scores increase by 4, and their maximum becomes 25. (Already added to your scores and hit points.)", abilityBonus:{str:4, con:4}, abilityMax:25}]
  },
  // The book's starting equipment: (A) or (B) 75 gp (p. 51).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Greataxe, 4 handaxes, Explorer's Pack and 15 gp", coins:{gp:15}, items:[
          {name:"Greataxe",qty:1,weight:7,notes:"heavy, two-handed",type:"weapon",damageDice:"1d12",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Handaxe",qty:4,weight:2,notes:"light, thrown 20/60",type:"weapon",damageDice:"1d6",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Explorer's Pack",qty:1,weight:59,notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"}
        ]},
        {key:"gold", label:"75 gp", detail:"Buy your own gear", coins:{gp:75}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* Aspect of the Wilds (Wild Heart 6): changed on the Feature choices card. */
var ASPECTS = ["Owl","Panther","Salmon"];
var ASPECT_DETAILS = {
  "Owl":"Darkvision out to 60 feet, or 60 feet more if you already have it.",
  "Panther":"A climb speed equal to your speed.",
  "Salmon":"A swim speed equal to your speed."
};

/* The 2024 paths (Player's Handbook 2024, pp. 53 to 56). */
export var BARBARIAN_2024_SUBCLASSES = [
  {name:"Path of the Berserker (2024)", edition:"2024", blurb:"Channels Rage into violent fury and extra damage.", features:{
    3:[{name:"Frenzy", text:"If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on your turn with a Strength attack. Roll as many d6s as your Rage Damage bonus. The damage has the same type as the weapon or unarmed strike. A button on the weapon card rolls it."}],
    6:[{name:"Mindless Rage", text:"You are immune to the charmed and frightened conditions while your Rage is active. If you are charmed or frightened when you enter your Rage, the condition ends."}],
    10:[{name:"Retaliation", remind:{when:"reaction", line:"When a creature within 5 feet damages you, make a melee attack against it"}, text:"When you take damage from a creature within 5 feet of you, you can take a reaction to make one melee attack against it, with a weapon or an unarmed strike."}],
    14:[{name:"Intimidating Presence", text:"As a bonus action, each creature you choose within 30 feet makes a Wisdom saving throw (DC 8 + your Strength modifier + your proficiency bonus) or is frightened for 1 minute. It repeats the save at the end of each of its turns, ending the effect on a success. Once per long rest, or spend a use of Rage (no action needed) to use it again."}]
  }},
  {name:"Path of the Wild Heart", edition:"2024", blurb:"Kin to animals, with a Rage that takes on their power.", features:{
    3:[
      {name:"Animal Speaker", text:"You can cast Beast Sense and Speak with Animals, but only as rituals. Wisdom is your spellcasting ability for them.", spells:["Beast Sense","Speak with Animals"], spellKind:"ritual", spellAbility:"wis"},
      {name:"Rage of the Wilds", text:"Whenever you activate your Rage, choose one option. The Rage card asks.\nBear: resistance to every damage type except force, necrotic, psychic and radiant.\nEagle: as you activate your Rage, you can Disengage and Dash as part of that bonus action. While it's active, you can take a bonus action to do both.\nWolf: your allies have advantage on attack rolls against any enemy of yours within 5 feet of you."}
    ],
    6:[{name:"Aspect of the Wilds", text:"Choose one option. Whenever you finish a long rest, you can change it on the Feature choices card.\nOwl: darkvision out to 60 feet, or 60 feet more if you already have it.\nPanther: a climb speed equal to your speed.\nSalmon: a swim speed equal to your speed.",
      profs:{pick:[{kind:"choice", id:"wildAspect", noun:"aspect", count:1, options:ASPECTS, details:ASPECT_DETAILS, label:"Choose an aspect of the wilds"}]}}],
    10:[{name:"Nature Speaker", text:"You can cast Commune with Nature, but only as a ritual. Wisdom is your spellcasting ability for it.", spells:["Commune with Nature"], spellKind:"ritual", spellAbility:"wis"}],
    14:[{name:"Power of the Wilds", text:"Whenever you activate your Rage, choose one option. The Rage card asks.\nFalcon: a fly speed equal to your speed if you aren't wearing any armor.\nLion: enemies within 5 feet of you have disadvantage on attack rolls against targets other than you or another barbarian with this option active.\nRam: when you hit a Large or smaller creature with a melee attack, you can knock it prone."}]
  }},
  {name:"Path of the World Tree", edition:"2024", blurb:"Draws vitality and dimensional travel from the cosmic tree Yggdrasil.", features:{
    3:[{name:"Vitality of the Tree", text:"Vitality Surge: when you activate your Rage, you gain temporary hit points equal to your barbarian level.\nLife-Giving Force: at the start of each of your turns while your Rage is active, you can give another creature within 10 feet temporary hit points. Roll as many d6s as your Rage Damage bonus. Any of these left when your Rage ends vanish."}],
    6:[{name:"Branches of the Tree", text:"When a creature you can see starts its turn within 30 feet of you while your Rage is active, you can take a reaction to summon spectral branches around it. It makes a Strength saving throw (DC 8 + your Strength modifier + your proficiency bonus) or teleports to an unoccupied space you can see within 5 feet of you, or the nearest one you can see. After it teleports, you can reduce its speed to 0 until the end of the current turn."}],
    10:[{name:"Battering Roots", remind:{when:"always", line:"On your turn, heavy or versatile melee weapons reach 10 feet farther"}, text:"During your turn, your reach is 10 feet greater with any melee weapon that has the Heavy or Versatile property. When you hit with such a weapon on your turn, you can activate the Push or Topple mastery property in addition to a different mastery property you're using with that weapon. The dice tray offers them after an attack."}],
    14:[{name:"Travel Along the Tree", text:"When you activate your Rage, and as a bonus action while it's active, you can teleport up to 60 feet to an unoccupied space you can see. Once per Rage, you can make that range 150 feet and bring up to six willing creatures within 10 feet of you. Each teleports to an unoccupied space of your choice within 10 feet of your destination."}]
  }},
  {name:"Path of the Zealot (2024)", edition:"2024", blurb:"A divine warrior whose Rage is an ecstatic union with a god.", features:{
    3:[
      {name:"Divine Fury", text:"On each of your turns while your Rage is active, the first creature you hit with a weapon or an unarmed strike takes extra damage equal to 1d6 + half your barbarian level (round down). The damage is necrotic or radiant, and you choose each time. A button on the weapon card rolls it."},
      {name:"Warrior of the Gods", text:"You have a pool of four d12s (five at level 6, six at 12, seven at 17) to heal yourself. As a bonus action, spend dice from the pool, roll them and regain that many hit points. The pool refills on a long rest."}
    ],
    6:[{name:"Fanatical Focus", text:"Once per active Rage, if you fail a saving throw, you can reroll it with a bonus equal to your Rage Damage bonus. You must use the new roll. The dice tray offers it."}],
    10:[{name:"Zealous Presence", text:"As a bonus action, up to ten other creatures of your choice within 60 feet have advantage on attack rolls and saving throws until the start of your next turn. Once per long rest, or spend a use of Rage (no action needed) to use it again."}],
    14:[{name:"Rage of the Gods", text:"When you activate your Rage, you can take the form of a divine warrior for 1 minute or until you drop to 0 hit points. Once per long rest. The Rage card has the button.\nFlight: a fly speed equal to your speed, and you can hover.\nResistance: resistance to necrotic, psychic and radiant damage.\nRevivification: when a creature within 30 feet would drop to 0 hit points, you can take a reaction and spend a use of Rage to set its hit points to your barbarian level instead."}]
  }}
];
