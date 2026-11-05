/* The 2024 Fighter (Player's Handbook 2024, pp. 90 to 99), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-05. Only what differs from
   the 2014 fighter is here.

   The 2024 subclasses carry " (2024)" (classLevelOf counts them for their
   2014 names, so what's the same is automated once). The older fighter
   subclasses with no 2024 version stay open to a 2024 fighter. */
import { WEAPON_MASTERY } from "./weapon-mastery.js";

var KINDS = Object.keys(WEAPON_MASTERY).sort();
var KIND_DETAILS = KINDS.reduce(function(o, k){ o[k] = "Its mastery: " + WEAPON_MASTERY[k] + "."; return o; }, {});
var RANGED_KINDS = ["Blowgun","Dart","Hand Crossbow","Heavy Crossbow","Light Crossbow","Longbow","Musket","Pistol","Shortbow","Sling"];
/* A Weapon Mastery pick: `count` kinds of weapon, tied across levels by the
   id. `melee`: melee weapons only (the barbarian's). `kinds`: the list to offer
   (the rogue's, those it's proficient with). */
export function masteryPick(count, melee, kinds){
  var word = melee ? "melee weapon" : "weapon";
  return {kind:"choice", id:"weaponMastery", noun:word, count:count, details:KIND_DETAILS,
    options:kinds || melee ? (kinds || KINDS).filter(function(k){ return !melee || RANGED_KINDS.indexOf(k)===-1; }) : KINDS,
    label:count > 1 ? "Choose " + count + " kinds of " + word + " whose mastery you can use" : "Choose one more kind of " + word + " whose mastery you can use"};
}
var STYLES = ["Archery","Blind Fighting","Defense","Dueling","Great Weapon Fighting","Interception","Protection","Thrown Weapon Fighting","Two-Weapon Fighting","Unarmed Fighting"];

export var FIGHTER_2024 = {
  label: "2024 Fighter",
  blurb: "A master of weapons and armor, with Weapon Mastery and tactical tricks.",
  card: {perks: ["Weapon Mastery", "More Second Wind", "New features"],
    text: "The 2024 rules for the fighter: the mastery of three kinds of weapon (more as you level), Second Wind more often, Tactical Mind on failed checks, a stronger Indomitable and the 2024 subclasses.",
    outcome: "<b>2024 Fighter:</b> Weapon Mastery, more Second Wind, Tactical Mind, and the 2024 features, gear and subclasses."},
  which: {old: "The Player's Handbook 2014 fighter.", now: "The Player's Handbook 2024 fighter: Weapon Mastery, more Second Wind and the 2024 features."},
  swaps: {"Champion":"Champion (2024)", "Battle Master":"Battle Master (2024)", "Eldritch Knight":"Eldritch Knight (2024)", "Psi Warrior":"Psi Warrior (2024)"},
  fightingStyle: {level:1, options:STYLES, swap:true},
  skillChoices: {count:2, options:["Acrobatics","Animal Handling","Athletics","History","Insight","Intimidation","Perception","Persuasion","Survival"]},
  choices: [
    {id:"fightingStyle", kind:"fightingStyle", label:"Fighting Style",
      help:"Pick the style that matches how you'll fight. Defense is the book's suggestion. You can change it whenever you gain a fighter level.",
      options:STYLES}
  ],
  level1: [
    {name:"Fighting Style", text:"You gain a Fighting Style feat of your choice. Defense is recommended. Whenever you gain a fighter level, you can replace it with another."},
    {name:"Second Wind", text:"As a bonus action, regain hit points equal to 1d10 + your fighter level. You can use this twice (three times from level 4, four from level 10). You regain one use on a short rest and all of them on a long rest."},
    {name:"Weapon Mastery", text:"You can use the mastery properties of three kinds of simple or martial weapons of your choice (four from level 4, five from level 10, six from level 16). Whenever you finish a long rest, you can change one of them. Change them on the Feature choices card.",
      profs:{pick:[masteryPick(3)]}}
  ],
  features: {
    2: [
      {name:"Action Surge", text:"On your turn, you can take one additional action, except the Magic action. Once you use this, you can't again until you finish a short or long rest."},
      {name:"Tactical Mind", text:"When you fail an ability check, you can spend a use of Second Wind to roll 1d10 and add it to the check instead of healing. If the check still fails, the use isn't spent. The dice tray offers it after a check."}
    ],
    4: [{name:"Weapon Mastery", replaces:"Weapon Mastery", text:"You can use the mastery properties of four kinds of simple or martial weapons of your choice (five from level 10, six from level 16). Whenever you finish a long rest, you can change one of them.", profs:{pick:[masteryPick(1)]}}],
    5: [
      {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."},
      {name:"Tactical Shift", remind:{when:"bonus", line:"With Second Wind, move up to half your speed with no opportunity attacks"}, text:"Whenever you activate Second Wind with a bonus action, you can move up to half your speed without provoking opportunity attacks."}
    ],
    9: [
      {name:"Indomitable", text:"If you fail a saving throw, you can reroll it with a bonus equal to your fighter level. You must use the new roll. Once per long rest (twice from level 13, three times from level 17)."},
      {name:"Tactical Master", text:"When you attack with a weapon whose mastery property you can use, you can replace that property with Push, Sap or Slow for that attack. The dice tray offers them after an attack."}
    ],
    10: [{name:"Weapon Mastery", replaces:"Weapon Mastery", text:"You can use the mastery properties of five kinds of simple or martial weapons of your choice (six from level 16). Whenever you finish a long rest, you can change one of them.", profs:{pick:[masteryPick(1)]}}],
    11: [{name:"Extra Attack", replaces:"Extra Attack", text:"When you take the Attack action, you attack three times instead of once (Two Extra Attacks)."}],
    13: [{name:"Studied Attacks", remind:{when:"always", line:"After a miss, advantage on your next attack against that creature"}, text:"If you make an attack roll against a creature and miss, you have advantage on your next attack roll against that creature before the end of your next turn."}],
    16: [{name:"Weapon Mastery", replaces:"Weapon Mastery", text:"You can use the mastery properties of six kinds of simple or martial weapons of your choice. Whenever you finish a long rest, you can change one of them.", profs:{pick:[masteryPick(1)]}}],
    17: [{name:"Action Surge", replaces:"Action Surge", text:"On your turn, you can take one additional action, except the Magic action. You can use this twice before a short or long rest, but only once on a turn."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Combat Prowess is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Extra Attack", replaces:"Extra Attack", text:"When you take the Attack action, you attack four times instead of once (Three Extra Attacks)."}]
  },
  // The book's starting equipment: (A), (B) or (C) 155 gp (p. 91).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Chain mail, greatsword, flail, 8 javelins, Dungeoneer's Pack and 4 gp", coins:{gp:4}, items:[
          {name:"Chain Mail",qty:1,weight:55,notes:"heavy, Str 13, stealth disadvantage",type:"armor",category:"heavy",baseAC:16},
          {name:"Greatsword",qty:1,weight:6,notes:"heavy, two-handed",type:"weapon",damageDice:"2d6",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Flail",qty:1,weight:2,notes:"",type:"weapon",damageDice:"1d8",damageType:"Bludgeoning",ability:"str",proficient:true},
          {name:"Javelin",qty:8,weight:2,notes:"thrown 30/120",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"str",proficient:true},
          {name:"Dungeoneer's Pack",qty:1,weight:55,notes:"backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50ft rope"}
        ]},
        {key:"b", label:"Studded leather, scimitar, shortsword, longbow, 20 arrows, quiver, Dungeoneer's Pack and 11 gp", coins:{gp:11}, items:[
          {name:"Studded Leather",qty:1,weight:13,notes:"light armor",type:"armor",category:"light",baseAC:12},
          {name:"Scimitar",qty:1,weight:3,notes:"finesse, light",type:"weapon",damageDice:"1d6",damageType:"Slashing",ability:"finesse",proficient:true},
          {name:"Shortsword",qty:1,weight:2,notes:"finesse, light",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Longbow",qty:1,weight:2,notes:"ammunition, heavy, two-handed, range 150/600",type:"weapon",damageDice:"1d8",damageType:"Piercing",ability:"dex",proficient:true},
          {name:"Arrows",qty:20,weight:0.05,notes:"ammunition, in a quiver"},
          {name:"Dungeoneer's Pack",qty:1,weight:55,notes:"backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50ft rope"}
        ]},
        {key:"gold", label:"155 gp", detail:"Buy your own gear", coins:{gp:155}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* The 2024 subclasses (Player's Handbook 2024, pp. 93 to 99). */
export var FIGHTER_2024_SUBCLASSES = [
  {name:"Battle Master (2024)", edition:"2024", blurb:"A tactician with special combat maneuvers.", features:{
    3:[
      {name:"Combat Superiority", text:"You learn three maneuvers (two more at fighter levels 7, 10 and 15, and each time you learn new ones you can also swap one you know). You have four superiority dice, d8s (five at level 7, six at level 15), regained on a short or long rest. You can use one maneuver per attack. A maneuver's save DC is 8 + your proficiency bonus + your Strength or Dexterity modifier (your choice)."},
      {name:"Student of War", text:"You gain proficiency with one type of artisan's tools and in one skill from the fighter's list.",
        profs:{pick:[{kind:"tool", group:"Artisan's tools"}, {kind:"skill", options:["Acrobatics","Animal Handling","Athletics","History","Insight","Intimidation","Perception","Persuasion","Survival"]}]}}
    ],
    7:[{name:"Know Your Enemy", text:"As a bonus action, learn whether a creature you can see within 30 feet has any immunities, resistances or vulnerabilities, and what they are. Once per long rest, or spend a superiority die (no action needed) to use it again."}],
    10:[{name:"Improved Combat Superiority", text:"Your superiority die becomes a d10 (a d12 at level 18)."}],
    15:[{name:"Relentless", remind:{when:"always", line:"Once a turn when you use a maneuver, roll a d8 instead of spending a superiority die"}, text:"Once per turn, when you use a maneuver, you can roll 1d8 and use the number rolled instead of spending a superiority die."}],
    18:[{name:"Ultimate Combat Superiority", text:"Your superiority die becomes a d12."}]
  }},
  {name:"Champion (2024)", edition:"2024", blurb:"Simple, reliable raw power with more critical hits.", features:{
    3:[
      {name:"Improved Critical", text:"Your attack rolls with weapons and unarmed strikes score a critical hit on a roll of 19 or 20."},
      {name:"Remarkable Athlete", advantage:[{on:"initiative"}, {on:"skill", skills:["Athletics"]}], remind:{when:"always", line:"Right after a critical hit, move up to half your speed with no opportunity attacks"},
        text:"You have advantage on initiative rolls and Strength (Athletics) checks. Right after you score a critical hit, you can move up to half your speed without provoking opportunity attacks."}
    ],
    7:[{name:"Additional Fighting Style", text:"You gain another Fighting Style feat of your choice. The level-up asks you to choose.", styleChoice:{options:"class"}}],
    10:[{name:"Heroic Warrior", remind:{when:"always", line:"In combat, give yourself Heroic Inspiration when you start your turn without it"}, text:"During combat, you can give yourself Heroic Inspiration whenever you start your turn without it."}],
    15:[{name:"Improved Critical", replaces:"Improved Critical", text:"Your attack rolls with weapons and unarmed strikes score a critical hit on a roll of 18 to 20 (Superior Critical)."}],
    18:[{name:"Survivor", text:"You have advantage on death saving throws, and a roll of 18 to 20 on one counts as a 20. At the start of each of your turns, you regain 5 + your Constitution modifier hit points if you have half your hit points or fewer and at least 1."}]
  }},
  {name:"Eldritch Knight (2024)", edition:"2024", blurb:"Blends martial skill with wizard magic.", casterType:"third", spellAbility:"int", features:{
    3:[
      {name:"Spellcasting", text:"You cast wizard spells with Intelligence, using a third of your fighter level for spell slots. You know two wizard cantrips (a third at level 10). Ray of Frost and Shocking Grasp are recommended. You can swap one when you gain a fighter level. You prepare three level 1 wizard spells, more as you level, from any school. Burning Hands, Jump and Shield are recommended. You can swap one when you gain a fighter level."},
      {name:"War Bond", text:"In a 1-hour ritual (it can be during a short rest), bond with a weapon within your reach. You can't be disarmed of it unless you are incapacitated, and if it's on the same plane you can summon it to your hand as a bonus action. You can have up to two bonded weapons, and bonding a third breaks one."}
    ],
    7:[{name:"War Magic", remind:{when:"always", line:"In the Attack action, replace one attack with a wizard cantrip that takes an action"}, text:"When you take the Attack action, you can replace one of the attacks with casting one of your wizard cantrips that has a casting time of an action."}],
    10:[{name:"Eldritch Strike", remind:{when:"always", line:"A weapon hit gives the target disadvantage on its next save against your spell"}, text:"When you hit a creature with a weapon, it has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn."}],
    15:[{name:"Arcane Charge", text:"When you use Action Surge, you can teleport up to 30 feet to an unoccupied space you can see, before or after the extra action."}],
    18:[{name:"War Magic", replaces:"War Magic", remind:{when:"always", line:"In the Attack action, replace two attacks with a level 1 or 2 wizard spell"}, text:"When you take the Attack action, you can replace two of the attacks with casting one of your level 1 or level 2 wizard spells that has a casting time of an action (Improved War Magic). You can also replace one attack with a wizard cantrip."}]
  }},
  {name:"Psi Warrior (2024)", edition:"2024", blurb:"Augments physical might with psionic power to shield allies and hurl foes.", features:{
    3:[
      {name:"Psionic Power", text:"You have Psionic Energy Dice: four d6s at level 3, six d8s at 5, eight d8s at 9, eight d10s at 11, ten d10s at 13 and twelve d12s at 17. You regain one on a short rest and all of them on a long rest.\nProtective Field: when you or a creature you can see within 30 feet takes damage, use your reaction and a die to reduce the damage by the roll + your Intelligence modifier (at least 1).\nPsionic Strike: once on each of your turns, right after you hit a target within 30 feet with a weapon, spend a die to deal the roll + your Intelligence modifier in force damage.\nTelekinetic Movement: as a Magic action, move a loose Large or smaller object or a willing creature other than you up to 30 feet, or a Tiny object to or from your hand. Once per short or long rest, or spend a die to use it again."}
    ],
    7:[{name:"Telekinetic Adept", text:"Psi-Powered Leap: as a bonus action, gain a fly speed of twice your speed until the end of the turn. Once per short or long rest, or spend a die to use it again.\nTelekinetic Thrust: when you deal damage with Psionic Strike, the target makes a Strength save (DC 8 + your Intelligence modifier + your proficiency bonus) or you knock it prone or move it up to 10 feet horizontally."}],
    10:[{name:"Guarded Mind", text:"You have resistance to psychic damage. If you start your turn charmed or frightened, you can spend a die (no action needed) to end every effect on you causing those conditions.", resist:["psychic"]}],
    15:[{name:"Bulwark of Force", text:"As a bonus action, choose up to your Intelligence modifier (at least one) creatures within 30 feet, including you. Each has half cover for 1 minute or until you are incapacitated. Once per long rest, or spend a die to use it again."}],
    18:[{name:"Telekinetic Master", text:"You always have Telekinesis prepared. You can cast it without a slot or components, with Intelligence as your spellcasting ability. On each of your turns while concentrating on it, you can make one weapon attack as a bonus action. Once per long rest, or spend a die to use it again.", spells:["Telekinesis"], spellKind:"known", spellLabel:"Free 1/long rest", spellAbility:"int", spellTip:"Telekinetic Master: cast it without a spell slot or components, once per long rest or for a Psionic Energy Die."}]
  }}
];
