/* The 2024 Monk (Player's Handbook 2024, pp. 100 to 106), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against 5etools' data (class-monk.json, the XPHB entries) on
   2026-11-03. Only what differs from the 2014 monk is here: level 1
   features, the progression, proficiencies, starting gear and the four
   2024 subclasses. Focus Points keep the ki resource's id ("Monk:ki"), so
   everything that spends ki spends Focus for a 2024 monk.

   The 2024 rules let a 2024 monk take the older subclasses that have no
   2024 version (Kensei, Drunken Master, Sun Soul, Long Death, Astral Self,
   Ascendant Dragon), with ki read as Focus. The 2014 Open Hand, Shadow,
   Four Elements and Mercy are 2014 only (MONK_2024_SWAPS maps them). */

var UNARMORED = "Your speed increases by {n} feet while you wear no armor and no shield. (Added to your speed while that's true.)";
function movement(n, extra){
  return Object.assign({name:"Unarmored Movement", text:UNARMORED.replace("{n}", n), speedWhen:"unarmored"}, extra);
}
function martialArts(die){
  // (The level 1 version replaces nothing.)
  return {name:"Martial Arts", replaces:die > 6 ? "Martial Arts" : "", remind:{when:"bonus", line:"An unarmed strike, while you wear no armor and no shield"}, text:"While you wear no armor and no shield, and are unarmed or using only monk weapons (simple melee weapons and martial melee weapons with the light property): your unarmed strikes and monk weapons can deal 1d" + die + " in place of their normal damage, you can use DEX instead of STR for their attack and damage rolls (and for the save DC of a grapple or shove), and you can make an unarmed strike as a bonus action."};
}

export var MONK_2024 = {
  label: "2024 Monk",
  blurb: "A martial artist who fights unarmed with supernatural speed and focus.",
  level1: [
    {name:"Unarmored Defense", text:"While wearing no armor and no shield, AC equals 10 + DEX modifier + WIS modifier."},
    martialArts(6)
  ],
  features: {
    2: [
      {name:"Monk's Focus", remind:{when:"bonus", line:"Disengage or Dash free (Patient Defense, Step of the Wind), or pay Focus for more"}, text:"You have Focus Points equal to your monk level, and get them all back on a short or long rest. Flurry of Blows: spend 1 Focus to make two unarmed strikes as a bonus action. Patient Defense: take the Disengage action as a bonus action, or spend 1 Focus to take both Disengage and Dodge. Step of the Wind: take the Dash action as a bonus action, or spend 1 Focus to take both Disengage and Dash, and your jump distance doubles this turn. Save DC = 8 + proficiency + WIS.", saveDc:{save:"", ability:"wis"}},
      movement(10, {speed:10}),
      {name:"Uncanny Metabolism", text:"When you roll initiative, you can get back all your spent Focus Points. When you do, roll your Martial Arts die and regain hit points equal to your monk level plus the roll. Once per long rest."}
    ],
    3: [{name:"Deflect Attacks", remind:{when:"reaction", line:"When an attack hits you, reduce its damage (the roll is on the unarmed strike card)"}, text:"Reaction when an attack hits you and its damage includes bludgeoning, piercing or slashing: reduce the attack's total damage by 1d10 + DEX modifier + monk level. If that brings it to 0, you can spend 1 Focus to redirect it: a creature you can see within 5 feet (melee attack) or within 60 feet and not behind total cover (ranged attack) makes a DEX save or takes two rolls of your Martial Arts die + DEX modifier, of the attack's damage type.", saveDc:{save:"dex", ability:"wis"}}],
    4: [{name:"Slow Fall", remind:{when:"reaction", line:"When you fall, take 5 less damage for each monk level"}, text:"Reaction when you fall: reduce the falling damage by five times your monk level.", chip:function(x){ return "Reduces falls by " + 5 * x.lv; }}],
    5: [
      {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."},
      {name:"Stunning Strike", text:"Once per turn, when you hit a creature with a monk weapon or an unarmed strike, you can spend 1 Focus: it makes a Constitution save. On a failure it is stunned until the start of your next turn. On a success its speed is halved until the start of your next turn, and the next attack roll against it before then has advantage.", saveDc:{save:"con", ability:"wis"}},
      martialArts(8)
    ],
    6: [
      {name:"Empowered Strikes", text:"Whenever you deal damage with an unarmed strike, it can deal force damage or its normal damage type, your choice."},
      movement(15, {replaces:"Unarmored Movement", speed:5})
    ],
    7: [{name:"Evasion", text:"When an effect lets you make a DEX save to take half damage, you take no damage on a success and half on a failure. Not while you're incapacitated.", saveNote:{abilities:["dex"], text:"When a Dexterity save would halve the damage, you take none on a success and half on a failure"}}],
    9: [{name:"Acrobatic Movement", text:"While you wear no armor and no shield, you can move along vertical surfaces and across liquids on your turn without falling during the move.",
      speeds:[{type:"climb", value:"walk", when:"walls and liquids, on your turn, no armor or shield"}]}],
    10: [
      {name:"Heightened Focus", text:"Flurry of Blows makes three unarmed strikes for 1 Focus instead of two. When you spend Focus on Patient Defense, you also gain temporary hit points equal to two rolls of your Martial Arts die. When you spend Focus on Step of the Wind, you can take a willing Large or smaller creature within 5 feet along with you until the end of your turn, and its movement doesn't provoke opportunity attacks."},
      {name:"Self-Restoration", remind:{when:"always", line:"At the end of each turn, end charmed, frightened or poisoned on yourself"}, text:"At the end of each of your turns, you can end one of these conditions on yourself: charmed, frightened or poisoned. Going without food and drink doesn't give you exhaustion."},
      movement(20, {replaces:"Unarmored Movement", speed:5})
    ],
    11: [martialArts(10)],
    13: [{name:"Deflect Energy", text:"Deflect Attacks now works against attacks of any damage type, not just bludgeoning, piercing or slashing."}],
    14: [
      {name:"Disciplined Survivor", text:"You gain proficiency in all saving throws (already applied to your saves). When you fail a saving throw, you can spend 1 Focus to reroll it, and you must use the new roll.", grants:{savingThrows:["str","dex","con","int","wis","cha"]}},
      movement(25, {replaces:"Unarmored Movement", speed:5})
    ],
    15: [{name:"Perfect Focus", text:"When you roll initiative and don't use Uncanny Metabolism, you get back spent Focus Points until you have 4, if you have 3 or fewer."}],
    17: [martialArts(12)],
    18: [
      {name:"Superior Defense", text:"At the start of your turn, you can spend 3 Focus to gain resistance to all damage except force for 1 minute, or until you're incapacitated."},
      movement(30, {replaces:"Unarmored Movement", speed:5})
    ],
    20: [{name:"Body and Mind", text:"Your Dexterity and Wisdom scores increase by 4, and their maximum becomes 25. (Already added to your scores.)", abilityBonus:{dex:4, wis:4}, abilityMax:25}]
  },
  // No Tasha's extras: the 2024 class already has its own versions.
  variants: [],
  proficiencies: {
    armor:[],
    weapons:["Simple weapons","Martial weapons with the Light property"],
    tools:["One type of artisan's tools or musical instrument"],
    savingThrows:["str","dex"]
  },
  // Multiclassing into the 2024 monk gives no proficiencies.
  multiclassProfs: {armor:[], weapons:[], tools:[], note:""},
  // Starting gear: (A) a spear, 5 daggers, the tool picked for the tool
  // proficiency, an Explorer's Pack and 11 gp, or (B) 50 gp.
  equipment: {
    choiceGroups:[
      {options:[
        {key:"kit", label:"Spear, 5 daggers, your tool, Explorer's Pack and 11 gp", detail:"The artisan's tools or instrument you pick for your tool proficiency", coins:{gp:11}, starterTool:true, items:[
          {name:"Spear",qty:1,weight:3,notes:"thrown 20/60, versatile 1d8, monk weapon",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Dagger",qty:5,weight:1,notes:"finesse, light, thrown 20/60, monk weapon",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Explorer's Pack", qty:1, weight:59, notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"}
        ]},
        {key:"gold", label:"50 gp", detail:"Buy your own gear", coins:{gp:50}, items:[]}
      ]}
    ],
    fixed:[]
  },
  // Martial Arts die by monk level.
  martialArtsDie: function(lv){ return lv>=17 ? 12 : lv>=11 ? 10 : lv>=5 ? 8 : 6; }
};

/* The 2014 subclasses with a 2024 version, and what they become when a
   monk switches rules (and back). */
export var MONK_2024_SWAPS = {
  "Way of the Open Hand": "Warrior of the Open Hand",
  "Way of Shadow": "Warrior of Shadow",
  "Way of the Four Elements": "Warrior of the Elements",
  "Way of Mercy": "Warrior of Mercy"
};

/* The 2024 subclasses (Player's Handbook 2024, pp. 104 to 107). */
export var MONK_2024_SUBCLASSES = [
  {name:"Warrior of the Open Hand", edition:"2024", blurb:"Master of unarmed combat who pushes, trips and heals.", features:{
    3:[{name:"Open Hand Technique", text:"Whenever you hit a creature with an attack from Flurry of Blows, you can impose one effect: Addle (it can't make opportunity attacks until the start of its next turn), Push (it makes a STR save or is pushed up to 15 feet away from you) or Topple (it makes a DEX save or falls prone).", saveDc:{save:"", ability:"wis"}}],
    6:[{name:"Wholeness of Body", text:"As a bonus action, roll your Martial Arts die and regain hit points equal to the roll + your WIS modifier (at least 1). You can do this a number of times equal to your WIS modifier (at least once), and get them all back on a long rest."}],
    11:[{name:"Fleet Step", remind:{when:"bonus", line:"After any other bonus action, use Step of the Wind too"}, text:"When you take a bonus action other than Step of the Wind, you can also use Step of the Wind right after it."}],
    17:[{name:"Quivering Palm", text:"When you hit a creature with an unarmed strike, you can spend 4 Focus to start harmless vibrations in its body that last a number of days equal to your monk level. To end them, take an action, or give up one of your attacks when you take the Attack action, while you're both on the same plane: it makes a CON save, taking 10d12 force damage on a failure or half as much on a success. Only one creature at a time, and you can end them harmlessly with no action.", saveDc:{save:"con", ability:"wis"}}]
  }},
  {name:"Warrior of Shadow", edition:"2024", blurb:"A ninja who hides in darkness and steps from shadow to shadow.", features:{
    3:[
      {name:"Shadow Arts", text:"You can spend 1 Focus to cast Darkness without spell components. You can see within it, and while it lasts you can move its area to a space within 60 feet of you at the start of each of your turns. You also know the Minor Illusion cantrip, with Wisdom as your spellcasting ability, and gain darkvision out to 60 feet (60 feet more if you already have it).",
        spells:["Minor Illusion","Darkness"], spellKind:"known", spellLabel:"1 Focus", spellAbility:"wis", spellTip:"Shadow Arts: spend 1 Focus to cast Darkness without components. Minor Illusion is a cantrip you always know.",
        darkvision:{range:60, add:60}}
    ],
    6:[{name:"Shadow Step", text:"While entirely in dim light or darkness, as a bonus action you can teleport up to 60 feet to an unoccupied space you can see that is also in dim light or darkness. You then have advantage on the next melee attack you make before the end of the turn."}],
    11:[{name:"Improved Shadow Step", text:"When you use Shadow Step, you can spend 1 Focus to drop the need to start and end in dim light or darkness. As part of the same bonus action, you can make an unarmed strike right after you teleport."}],
    17:[{name:"Cloak of Shadows", text:"As a Magic action while entirely in dim light or darkness, spend 3 Focus to shroud yourself in shadows for 1 minute, until you're incapacitated, or until you end your turn in bright light. While shrouded, you are invisible, you can move through occupied spaces as difficult terrain (ending a turn in one shunts you back to the last unoccupied space you were in), and Flurry of Blows costs no Focus."}]
  }},
  {name:"Warrior of the Elements", edition:"2024", blurb:"Wraps strikes and bursts in elemental power.", features:{
    3:[
      {name:"Elemental Attunement", text:"At the start of your turn, you can spend 1 Focus to fill yourself with elemental energy for 10 minutes, or until you're incapacitated. While it lasts, your unarmed strikes have 10 feet more reach, and when one hits you can make it deal acid, cold, fire, lightning or thunder damage. When you do, you can also make the target take a STR save: on a failure you move it up to 10 feet toward or away from you.", saveDc:{save:"str", ability:"wis"}},
      {name:"Manipulate Elements", text:"You know the Elementalism cantrip, with Wisdom as your spellcasting ability.", spells:["Elementalism"], spellKind:"known", spellAbility:"wis"}
    ],
    6:[{name:"Elemental Burst", text:"As a Magic action, spend 2 Focus to burst elemental energy in a 20-foot-radius sphere centered on a point within 120 feet. Choose acid, cold, fire, lightning or thunder. Each creature in it makes a DEX save, taking three rolls of your Martial Arts die of that type on a failure, or half as much on a success.", saveDc:{save:"dex", ability:"wis"}}],
    11:[{name:"Stride of the Elements", text:"While Elemental Attunement is on, you also have a fly speed and a swim speed equal to your speed.",
      speeds:[{type:"fly", value:"walk", when:"Elemental Attunement", effect:"elemental_attunement"}, {type:"swim", value:"walk", when:"Elemental Attunement", effect:"elemental_attunement"}]}],
    17:[{name:"Elemental Epitome", text:"While Elemental Attunement is on, you also gain these benefits. Damage Resistance: resistance to acid, cold, fire, lightning or thunder, your choice, which you can change at the start of each of your turns. Destructive Stride: when you use Step of the Wind, your speed increases by 20 feet until the end of the turn, and any creature you choose takes one roll of your Martial Arts die of acid, cold, fire, lightning or thunder damage (your choice) when you enter a space within 5 feet of it, once per turn per creature. Empowered Strikes: once on each of your turns, an unarmed strike hit deals one extra roll of your Martial Arts die, of the same type."}]
  }},
  {name:"Warrior of Mercy", edition:"2024", blurb:"A masked healer who brings a swift end to enemies.", features:{
    3:[
      {name:"Implements of Mercy", text:"You gain proficiency in the Insight and Medicine skills and with the herbalism kit.", grants:{tools:["Herbalism kit"]}, profs:{skills:["Insight","Medicine"]}},
      {name:"Hand of Harm", text:"Once per turn, when you hit a creature with an unarmed strike and deal damage, you can spend 1 Focus to deal extra necrotic damage equal to one roll of your Martial Arts die + your WIS modifier."},
      {name:"Hand of Healing", text:"As a Magic action, spend 1 Focus to touch a creature and restore hit points equal to one roll of your Martial Arts die + your WIS modifier. When you use Flurry of Blows, you can replace one of its unarmed strikes with this, without spending Focus for the healing."}
    ],
    6:[{name:"Physician's Touch", text:"Hand of Harm can also make the target poisoned until the end of your next turn. Hand of Healing can also end one of these conditions on the creature you heal: blinded, deafened, paralyzed, poisoned or stunned."}],
    11:[{name:"Flurry of Healing and Harm", text:"When you use Flurry of Blows, you can replace each unarmed strike with Hand of Healing without spending Focus for the healing. When you deal damage with an unarmed strike from Flurry of Blows, you can use Hand of Harm with it without spending Focus (still once per turn). You can use these benefits a number of times equal to your WIS modifier (at least once), and get them all back on a long rest."}],
    17:[{name:"Hand of Ultimate Mercy", text:"As a Magic action, touch the corpse of a creature that died within the past 24 hours and spend 5 Focus. It returns to life with 4d10 + your WIS modifier hit points, free of blinded, deafened, paralyzed, poisoned and stunned. Once per long rest."}]
  }}
];
