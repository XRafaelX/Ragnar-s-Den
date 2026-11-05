/* The 2024 Rogue (Player's Handbook 2024, pp. 128 to 136), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-05. Only what differs from
   the 2014 rogue is here. What the features do on the sheet is in
   js/core/rogue-2024.js.

   The 2024 subclasses carry " (2024)" (classLevelOf counts them for their
   2014 names, so what's the same is automated once). The older rogue
   subclasses with no 2024 version stay open to a 2024 rogue. */
import { masteryPick } from "./fighter-2024.js";

var SKILLS = ["Acrobatics","Athletics","Deception","Insight","Intimidation","Investigation","Perception","Persuasion","Sleight of Hand","Stealth"];
// The kinds a rogue is proficient with: simple, and martial with Finesse or Light.
var KINDS = ["Club","Dagger","Dart","Greatclub","Hand Crossbow","Handaxe","Javelin","Light Crossbow","Light Hammer","Mace","Quarterstaff","Rapier","Scimitar","Shortbow","Shortsword","Sickle","Sling","Spear","Whip"];
var LEATHER = {name:"Leather",qty:1,weight:10,notes:"light armor",type:"armor",category:"light",baseAC:11};
var BURGLARS_PACK = {name:"Burglar's Pack",qty:1,weight:44.5,notes:"backpack, 1,000 ball bearings, 10ft string, bell, 5 candles, crowbar, hammer, 10 pitons, hooded lantern, 2 flasks of oil, 5 days rations, tinderbox, waterskin, 50ft rope"};

export var ROGUE_2024 = {
  label: "2024 Rogue",
  blurb: "A cunning expert with Weapon Mastery and strikes that trade Sneak Attack dice for tricks.",
  card: {perks: ["Weapon Mastery", "Cunning Strike", "New features"],
    text: "The 2024 rules for the rogue: the mastery of two kinds of weapon, Steady Aim for everyone, Cunning Strike's tricks in exchange for Sneak Attack dice, Reliable Talent at level 7 and the 2024 subclasses.",
    outcome: "<b>2024 Rogue:</b> Weapon Mastery, Cunning Strike, Reliable Talent at level 7, and the 2024 features, gear and subclasses."},
  which: {old: "The Player's Handbook 2014 rogue.", now: "The Player's Handbook 2024 rogue: Weapon Mastery, Cunning Strike and the 2024 features."},
  swaps: {"Thief":"Thief (2024)", "Assassin":"Assassin (2024)", "Arcane Trickster":"Arcane Trickster (2024)", "Soulknife":"Soulknife (2024)"},
  skillChoices: {count:4, options:SKILLS},
  proficiencies: {armor:["Light armor"], weapons:["Simple weapons","Martial weapons with the Finesse or Light property"], tools:["Thieves' tools"], savingThrows:["dex","int"]},
  // A multiclass: a skill from the list, thieves' tools and light armor, and the
  // level 1 features, so Expertise's two picks too (p. 128).
  multiclassProfs: {armor:["Light armor"], weapons:[], tools:["Thieves' tools"], note:"",
    profs:{pick:[{kind:"skill", label:"Gain proficiency in one skill from the rogue's list", options:SKILLS}, {kind:"expertise", count:2}]}},
  choices: [
    {id:"expertise", kind:"expertise", label:"Expertise", count:2,
      help:"Pick two skills you're proficient in to double your proficiency bonus for. The book suggests Sleight of Hand and Stealth."}
  ],
  level1: [
    {name:"Expertise", text:"You have Expertise in two of your skill proficiencies (two more from level 6). Sleight of Hand and Stealth are recommended."},
    {name:"Sneak Attack", text:"Once per turn, you can deal extra damage of the weapon's type to one creature you hit with a Finesse or Ranged weapon, if you have advantage on the attack roll. You don't need advantage if an ally that isn't incapacitated is within 5 feet of the target and you don't have disadvantage. It's 1d6, and one more die at every odd rogue level (10d6 at level 19)."},
    {name:"Thieves' Cant", text:"You know Thieves' Cant and one other language of your choice.", profs:{languages:["Thieves' Cant"], pick:[{kind:"language", label:"Learn a language of your choice"}]}},
    {name:"Weapon Mastery", text:"You can use the mastery properties of two kinds of weapons you are proficient with, such as daggers and shortbows. Whenever you finish a long rest, you can change them on the Feature choices card.", profs:{pick:[masteryPick(2, false, KINDS)]}}
  ],
  features: {
    2: [{name:"Cunning Action", remind:{when:"bonus", line:"Dash, Disengage or Hide"}, text:"On your turn, you can Dash, Disengage or Hide as a bonus action."}],
    3: [{name:"Steady Aim", text:"As a bonus action, give yourself advantage on your next attack roll this turn. You can do this only if you haven't moved during this turn, and afterwards your speed is 0 until the end of the turn. Take aim from the Active effects card."}],
    5: [
      {name:"Cunning Strike", text:"When you deal Sneak Attack damage, you can add an effect by giving up Sneak Attack dice before you roll. The weapon card's Cunning Strike button does this. A save's DC is 8 + your Dexterity modifier + your proficiency bonus.\nPoison (1d6): needs a Poisoner's Kit. A Constitution save or the target is poisoned for 1 minute, repeating the save at the end of each of its turns.\nTrip (1d6): a Large or smaller target makes a Dexterity save or falls prone.\nWithdraw (1d6): right after the attack, move up to half your speed with no opportunity attacks."},
      {name:"Uncanny Dodge", remind:{when:"reaction", line:"Halve the damage when an attacker you can see hits you"}, text:"When an attacker you can see hits you with an attack roll, you can take a reaction to halve the attack's damage against you (round down)."}
    ],
    6: [{name:"Expertise", replaces:"Expertise", text:"You have Expertise in four of your skill proficiencies: the two from level 1 plus two more you choose now.", profs:{pick:[{kind:"expertise", count:2}]}}],
    7: [
      {name:"Evasion", text:"When an effect lets you make a Dexterity save to take half damage, you take no damage on a success and half on a failure. You can't use this while incapacitated.", saveNote:{abilities:["dex"], text:"When a Dexterity save would halve the damage, you take none on a success and half on a failure"}},
      {name:"Reliable Talent", text:"Whenever you make an ability check that uses one of your skill or tool proficiencies, you can treat a d20 roll of 9 or lower as a 10."}
    ],
    11: [{name:"Improved Cunning Strike", text:"You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the dice for each."}],
    14: [{name:"Devious Strikes", text:"These are now among your Cunning Strike effects.\nDaze (2d6): a Constitution save or, on its next turn, the target can only move or take an action or a bonus action.\nKnock Out (6d6): a Constitution save or it's unconscious for 1 minute or until it takes damage, repeating the save at the end of each of its turns.\nObscure (3d6): a Dexterity save or it's blinded until the end of its next turn."}],
    15: [{name:"Slippery Mind", text:"You gain proficiency in Wisdom and Charisma saving throws (already applied to your saves).", grants:{savingThrows:["wis","cha"]}}],
    18: [{name:"Elusive", remind:{when:"always", line:"No attack roll has advantage against you while you aren't incapacitated"}, text:"No attack roll can have advantage against you unless you are incapacitated."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of the Night Spirit is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Stroke of Luck", text:"If you fail a d20 test, you can turn the roll into a 20. Once per short or long rest. The dice tray offers it."}]
  },
  // The book's starting equipment: (A) or (B) 100 gp (p. 128).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Leather armor, 2 daggers, shortsword, shortbow, 20 arrows, quiver, thieves' tools, Burglar's Pack and 8 gp", coins:{gp:8}, items:[
          LEATHER,
          {name:"Dagger",qty:2,weight:1,notes:"finesse, light, thrown 20/60",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Shortsword",qty:1,weight:2,notes:"finesse, light",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Shortbow",qty:1,weight:2,notes:"ammunition, two-handed, range 80/320",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"dex",proficient:true},
          {name:"Arrows",qty:20,weight:0.05,notes:"ammunition, in a quiver"},
          {name:"Thieves' Tools",qty:1,weight:1,notes:"pick locks and disarm traps"},
          BURGLARS_PACK
        ]},
        {key:"gold", label:"100 gp", detail:"Buy your own gear", coins:{gp:100}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* The 2024 subclasses (Player's Handbook 2024, pp. 131 to 136). */
export var ROGUE_2024_SUBCLASSES = [
  {name:"Arcane Trickster (2024)", edition:"2024", blurb:"Enhances stealth and trickery with wizard spells of any school.", casterType:"third", spellAbility:"int", features:{
    3:[
      {name:"Spellcasting", text:"You cast wizard spells with Intelligence, using a third of your rogue level for spell slots. You know Mage Hand and two other wizard cantrips (a fourth at level 10). Mind Sliver and Minor Illusion are recommended. You can swap one, except Mage Hand, when you gain a rogue level. You prepare three level 1 wizard spells, more as you level, from any school. Charm Person, Disguise Self and Fog Cloud are recommended. You can swap one when you gain a rogue level."},
      {name:"Mage Hand Legerdemain", remind:{when:"bonus", line:"Control your Mage Hand, or cast it, invisible if you like"}, text:"When you cast Mage Hand, you can cast it as a bonus action and make the hand invisible. You can control the hand as a bonus action, and make Dexterity (Sleight of Hand) checks through it."}
    ],
    9:[{name:"Magical Ambush", remind:{when:"always", line:"Cast a spell while invisible: the target has disadvantage on its save this turn"}, text:"If you are invisible when you cast a spell on a creature, it has disadvantage on any saving throw it makes against the spell on the same turn."}],
    13:[{name:"Versatile Trickster", text:"When you use Cunning Strike's Trip on a creature, you can also use it on another creature within 5 feet of your spectral hand."}],
    17:[{name:"Spell Thief", text:"Right after a creature casts a spell that targets you or includes you in its area, you can take a reaction to force it to make an Intelligence save against your spell save DC. On a failure, you negate the spell's effect against you, and if it's level 1 or higher and of a level you can cast, you have it prepared for the next 8 hours, and the creature can't cast it until then. Once per long rest."}]
  }},
  {name:"Assassin (2024)", edition:"2024", blurb:"Deadly in the first round of a fight, with poison and disguise.", features:{
    3:[
      {name:"Assassinate", advantage:{on:"initiative"}, text:"You have advantage on initiative rolls. During the first round of each combat, you have advantage on attack rolls against any creature that hasn't taken a turn, and a Sneak Attack hit deals extra damage of the weapon's type equal to your rogue level. Start it from the Active effects card."},
      {name:"Assassin's Tools", text:"You gain a Disguise Kit and a Poisoner's Kit, and you have proficiency with them.", grants:{tools:["Disguise kit","Poisoner's kit"]}}
    ],
    9:[{name:"Infiltration Expertise", text:"Masterful Mimicry: you can unerringly mimic another person's speech, handwriting or both after studying them for at least 1 hour.\nRoving Aim: Steady Aim doesn't reduce your speed to 0."}],
    13:[{name:"Envenom Weapons", text:"When you use Cunning Strike's Poison, the target also takes 2d6 poison damage whenever it fails the save. This ignores resistance to poison damage."}],
    17:[{name:"Death Strike", text:"When you hit with your Sneak Attack on the first round of a combat, the target makes a Constitution save (DC 8 + your Dexterity modifier + your proficiency bonus) or the attack's damage is doubled against it."}]
  }},
  {name:"Soulknife (2024)", edition:"2024", blurb:"Strikes with blades of psychic energy.", features:{
    3:[
      {name:"Psionic Power", text:"You have Psionic Energy Dice: four d6s at level 3, six d8s at 5, eight d8s at 9, eight d10s at 11, ten d10s at 13 and twelve d12s at 17. You regain one on a short rest and all of them on a long rest.\nPsi-Bolstered Knack: if you fail a check using a skill or tool you're proficient with, roll a die and add it. The die is spent only if the check then succeeds.\nPsychic Whispers: as a Magic action, choose creatures you can see, up to your proficiency bonus, and roll a die. For that many hours, they can speak telepathically with you within 1 mile. The first use after each long rest doesn't spend the die."},
      {name:"Psychic Blades", text:"When you take the Attack action or make an opportunity attack, you can manifest a blade in your free hand and attack with it: a simple melee weapon, 1d6 psychic + the attack's ability modifier, Finesse, Thrown (60/120 feet), mastery Vex (this doesn't count against your Weapon Mastery). After you attack with it on your turn, you can attack with a second blade as a bonus action if your other hand is free. Its die is a d4."}
    ],
    9:[{name:"Soul Blades", text:"Homing Strikes: if you miss with a blade, roll a die and add it to the attack roll. The die is spent only if the attack then hits.\nPsychic Teleportation: as a bonus action, spend and roll a die, throw a blade at an unoccupied space you can see up to 10 times the roll in feet away, and teleport there."}],
    13:[{name:"Psychic Veil", text:"As a Magic action, you are invisible for 1 hour or until you dismiss it. It ends right after you deal damage to a creature or force one to make a saving throw. Once per long rest, or spend a die (no action needed) to use it again."}],
    17:[{name:"Rend Mind", text:"When you deal Sneak Attack damage with your blades, you can force the target to make a Wisdom save (DC 8 + your Dexterity modifier + your proficiency bonus) or be stunned for 1 minute, repeating the save at the end of each of its turns. Once per long rest, or spend three dice (no action needed) to use it again."}]
  }},
  {name:"Thief (2024)", edition:"2024", blurb:"A burglar, treasure hunter and explorer.", features:{
    3:[
      {name:"Fast Hands", remind:{when:"bonus", line:"Sleight of Hand with tools or a pocket, Utilize, or use a magic item"}, text:"As a bonus action, you can make a Dexterity (Sleight of Hand) check to pick a lock, disarm a trap with thieves' tools or pick a pocket, take the Utilize action, or take the Magic action to use a magic item that requires it."},
      {name:"Second-Story Work", speeds:[{type:"climb", value:"walk"}], remind:{when:"always", line:"Your jump distance can use Dexterity instead of Strength"}, text:"You have a climb speed equal to your speed. You can work out your jump distance with Dexterity instead of Strength."}
    ],
    9:[{name:"Supreme Sneak", text:"You gain a Cunning Strike effect.\nStealth Attack (1d6): if you have the Hide action's Invisible condition, this attack doesn't end it if you end the turn behind three-quarters or total cover."}],
    13:[{name:"Use Magic Device", attuneLimit:4, remind:{when:"always", line:"Spending a magic item's charges: on a d6 roll of 6, none are spent"}, text:"You can attune to up to four magic items. Whenever you use a magic item property that spends charges, roll 1d6, and on a 6 none are spent. You can use any Spell Scroll with Intelligence as your spellcasting ability. A cantrip or level 1 spell always works. A higher one needs an Intelligence (Arcana) check, DC 10 + the spell's level, or the scroll disintegrates."}],
    17:[{name:"Thief's Reflexes", remind:{when:"always", line:"Two turns in the first round of combat, the second at your initiative minus 10"}, text:"You can take two turns during the first round of any combat: the first at your normal initiative and the second at your initiative minus 10."}]
  }}
];
