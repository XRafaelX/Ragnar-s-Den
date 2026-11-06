/* The 2024 Bard (Player's Handbook 2024, pp. 58 to 66), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-06. Only what differs from
   the 2014 bard is here. What the features do on the sheet is in
   js/core/bard.js.

   The 2024 bard's spell list changes one spell per bard level, so the sheet
   keeps it as spells learned at each level-up (EDITION_CASTERS in
   js/data/spells-known.js, the Prepared Spells column as the count). From
   level 10, Magical Secrets opens the Cleric, Druid and Wizard lists to them.

   The 2024 colleges carry " (2024)" (classLevelOf counts them for their 2014
   names, so what's the same is automated once). The College of Dance is
   new. The older colleges with no 2024 version stay open to a 2024 bard. */

var EQUIP_PACK = {name:"Entertainer's Pack",qty:1,weight:38,notes:"backpack, bedroll, 2 costumes, 5 candles, 5 days rations, waterskin, disguise kit"};

export var BARD_2024 = {
  label: "2024 Bard",
  blurb: "A magical performer whose inspiration rescues failed rolls, with Magical Secrets from level 10.",
  card: {perks: ["Expertise at 2", "Magical Secrets", "College of Dance"],
    text: "The 2024 rules for the bard: Bardic Inspiration that rescues a failed d20 test, Expertise at level 2, a spell list that grows with the Prepared Spells column, Magical Secrets opening the Cleric, Druid and Wizard lists, Words of Creation, and the 2024 colleges with the new College of Dance.",
    outcome: "<b>2024 Bard:</b> Expertise at level 2, Magical Secrets from level 10, Words of Creation, and the 2024 features, gear and colleges."},
  which: {old: "The Player's Handbook 2014 bard.", now: "The Player's Handbook 2024 bard: Expertise at level 2, Magical Secrets and the 2024 colleges."},
  swaps: {"College of Glamour":"College of Glamour (2024)", "College of Lore":"College of Lore (2024)", "College of Valor":"College of Valor (2024)"},
  proficiencies: {armor:["Light armor"], weapons:["Simple weapons"], tools:["Three musical instruments of your choice"], savingThrows:["dex","cha"]},
  // A multiclass: a skill, a musical instrument and light armor (p. 59).
  multiclassProfs: {armor:["Light armor"], weapons:[], tools:[], note:"",
    profs:{pick:[{kind:"skill"}, {kind:"tool", group:"Musical instruments"}]}},
  spellcasting: {ability:"cha", spellList:"Bard", cantrips:2, spells:4, prepares:false, slots:{1:2},
    spellsLabel:"Level 1 spells",
    spellsHelp:"Choose four level 1 bard spells. Charm Person, Color Spray, Dissonant Whispers and Healing Word are the book's suggestions. Each time you gain a bard level you can swap one."},
  choices: [],
  level1: [
    {name:"Bardic Inspiration", text:"As a bonus action, give a creature within 60 feet that can see or hear you a Bardic Inspiration die (a d6, d8 at level 5, d10 at 10, d12 at 15). Once within the next hour when it fails a d20 test, it can roll the die and add it, possibly turning the failure into a success. A creature can hold only one. You can do this a number of times equal to your Charisma modifier (minimum once), regained on a long rest."},
    {name:"Spellcasting", text:"You cast bard spells using Charisma. You know two cantrips (three at level 4, four at 10) and four level 1 spells, more as you level, following the Prepared Spells column. Whenever you gain a bard level, you can swap one cantrip and one spell. A musical instrument can be your spellcasting focus."}
  ],
  features: {
    2: [
      {name:"Expertise", text:"Expertise in two of your skill proficiencies. Performance and Persuasion are recommended. Two more at level 9.", profs:{pick:[{kind:"expertise", count:2}]}},
      {name:"Jack of All Trades", text:"Add half your proficiency bonus (rounded down) to any ability check that uses a skill you aren't proficient in and doesn't already include your proficiency bonus (already added).", halfProficiency:{abilities:"all", round:"down"}}
    ],
    5: [{name:"Font of Inspiration", text:"You regain all your Bardic Inspiration on a short or long rest. You can also spend a spell slot (no action needed) to regain one use, a button on its row."}],
    7: [{name:"Countercharm", remind:{when:"reaction", line:"A failed save against charm or fear within 30 ft: reroll it with advantage"},
      text:"If you or a creature within 30 feet fails a saving throw against an effect that would charm or frighten, you can take a reaction to have the save rerolled, with advantage."}],
    9: [{name:"Expertise", replaces:"Expertise", text:"Expertise in two more of your skill proficiencies (four in all).", profs:{pick:[{kind:"expertise", count:2}]}}],
    10: [{name:"Magical Secrets", extraSpellList:["Cleric","Druid","Wizard"], text:"Whenever you gain a bard level and your spell list grows, any of the new spells can come from the Bard, Cleric, Druid or Wizard lists, and they count as bard spells. A spell you swap can come from those lists too. The level-up offers them."}],
    18: [{name:"Superior Inspiration", text:"When you roll initiative, you regain uses of Bardic Inspiration until you have two, if you have fewer (the sheet does this)."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Spell Recall is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Words of Creation", spells:["Power Word Heal","Power Word Kill"], spellKind:"known", text:"You always have Power Word Heal and Power Word Kill prepared. When you cast either, you can target a second creature within 10 feet of the first."}]
  },
  // The book's starting equipment: (A) or (B) 90 gp (p. 59).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Leather armor, 2 daggers, a musical instrument, Entertainer's Pack and 19 gp", coins:{gp:19}, items:[
          {name:"Leather",qty:1,weight:10,notes:"light armor",type:"armor",category:"light",baseAC:11},
          {name:"Dagger",qty:2,weight:1,notes:"finesse, light, thrown 20/60",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Lute",qty:1,weight:2,notes:"musical instrument, spellcasting focus"},
          EQUIP_PACK
        ]},
        {key:"gold", label:"90 gp", detail:"Buy your own gear", coins:{gp:90}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* The 2024 colleges (Player's Handbook 2024, pp. 64 to 66). */
export var BARD_2024_SUBCLASSES = [
  {name:"College of Dance", edition:"2024", blurb:"Moves in harmony with the cosmos, fighting with agile footwork.", features:{
    3:[{name:"Dazzling Footwork", text:"While you wear no armor and hold no shield:\nDance Virtuoso: advantage on Charisma (Performance) checks that involve dancing.\nUnarmored Defense: your AC is 10 + your Dexterity and Charisma modifiers (already on the sheet).\nAgile Strikes: when you spend a Bardic Inspiration as part of an action, bonus action or reaction, you can make one unarmed strike as part of it.\nBardic Damage: your unarmed strikes can use Dexterity, and deal bludgeoning damage equal to your Bardic Inspiration die + your Dexterity modifier, without spending the die (on your unarmed strike card)."}],
    6:[
      {name:"Inspiring Movement", remind:{when:"reaction", line:"An enemy ends its turn next to you: spend Inspiration to move, an ally moves too"},
        text:"When an enemy you can see ends its turn within 5 feet of you, you can take a reaction and spend a Bardic Inspiration to move up to half your speed. Then an ally within 30 feet can use its reaction to move up to half its speed. None of this provokes opportunity attacks."},
      {name:"Tandem Footwork", text:"When you roll initiative and aren't incapacitated, you can spend a Bardic Inspiration and roll the die. You and each ally within 30 feet who can see or hear you add the roll to initiative. Offered with Bardic Inspiration on Vitals."}
    ],
    14:[{name:"Leading Evasion", saveNote:{abilities:["dex"], text:"When a Dexterity save would halve the damage, you take none on a success and half on a failure, and so can creatures within 5 feet making the same save"},
      text:"When an effect lets you make a Dexterity save for half damage, you take none on a success and half on a failure. Creatures within 5 feet of you making the same save share this. Not while you're incapacitated."}]
  }},
  {name:"College of Glamour (2024)", edition:"2024", blurb:"Weaves beguiling fey magic of beauty and terror.", features:{
    3:[
      {name:"Beguiling Magic", spells:["Charm Person","Mirror Image"], spellKind:"known", text:"You always have Charm Person and Mirror Image prepared. Right after you cast an enchantment or illusion spell with a spell slot, a creature you can see within 60 feet makes a Wisdom save against your spell save DC or is charmed or frightened (your choice) for 1 minute, repeating the save at the end of each of its turns. Once per long rest, or spend a Bardic Inspiration to use it again."},
      {name:"Mantle of Inspiration", text:"As a bonus action, spend a Bardic Inspiration and roll the die. Up to your Charisma modifier (minimum one) other creatures within 60 feet each gain temporary hit points equal to twice the roll, and each can use its reaction to move up to its speed without opportunity attacks. Offered with Bardic Inspiration on Vitals."}
    ],
    6:[{name:"Mantle of Majesty", spells:["Command"], spellKind:"known", text:"You always have Command prepared. As a bonus action, you cast it without a spell slot and take on an unearthly look for 1 minute or until your concentration ends. Until then, you can cast Command as a bonus action without a slot, and a creature charmed by you fails its save against it. Once per long rest, or spend a level 3 or higher spell slot to use it again. Start it from the Active effects card."}],
    14:[{name:"Unbreakable Majesty", text:"As a bonus action, for 1 minute or until you're incapacitated, the first time a creature hits you with an attack roll on a turn, it makes a Charisma save against your spell save DC or the attack misses. Once per short or long rest. Start it from the Active effects card."}]
  }},
  {name:"College of Lore (2024)", edition:"2024", blurb:"Plumbs the depths of magical knowledge and cuts foes down with words.", features:{
    3:[
      {name:"Bonus Proficiencies", text:"You gain proficiency in three skills of your choice.", profs:{pick:[{kind:"skill", count:3}]}},
      {name:"Cutting Words", text:"When a creature you can see within 60 feet makes a damage roll or succeeds on an ability check or attack roll, you can take a reaction to spend a Bardic Inspiration, roll it and subtract the roll. Offered with Bardic Inspiration on Vitals."}
    ],
    6:[{name:"Magical Discoveries", text:"You learn two spells from the Cleric, Druid or Wizard lists, cantrips or spells of a level you have slots for. You always have them prepared, and whenever you gain a bard level you can swap one for another. The level-up asks for them."}],
    14:[{name:"Peerless Skill", text:"When you fail an ability check or attack roll, you can spend a Bardic Inspiration, roll it and add it, possibly turning the failure into a success. If it still fails, the use isn't spent. Offered after the roll."}]
  }},
  {name:"College of Valor (2024)", edition:"2024", blurb:"Sings the deeds of ancient heroes and fights beside the living.", features:{
    3:[
      {name:"Combat Inspiration", text:"A creature with your Bardic Inspiration die can use it for Defense (when hit by an attack roll, its reaction adds the roll to its AC against that attack) or Offense (right after it hits, it adds the roll to the attack's damage)."},
      {name:"Martial Training", grants:{armor:["Medium armor","Shields"], weapons:["Martial weapons"]}, text:"You gain proficiency with martial weapons and training with medium armor and shields. A simple or martial weapon can be your spellcasting focus for bard spells."}
    ],
    6:[{name:"Extra Attack", text:"You can attack twice instead of once whenever you take the Attack action on your turn. You can cast one of your cantrips that takes an action in place of one of those attacks."}],
    14:[{name:"Battle Magic", remind:{when:"bonus", line:"After you cast a spell that takes an action, one weapon attack"},
      text:"After you cast a spell that has a casting time of an action, you can make one attack with a weapon as a bonus action."}]
  }}
];
