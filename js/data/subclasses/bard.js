/* Bard subclasses: the full feature list for each one, keyed by class
   level. Assembled into SUBCLASSES in ../progression.js; see the comment
   there for the feature fields and flags. */
export var BARD_SUBCLASSES = [
  {name:"College of Lore", blurb:"Collects knowledge and uses words to undermine foes.", features:{
    3:[
      {name:"Bonus Proficiencies", text:"Gain proficiency with three skills of your choice. Tick them on the Abilities & Skills tab."},
      {name:"Cutting Words", text:"When a creature you can see within 60 feet makes an attack roll, ability check or damage roll, you can use your reaction to expend a Bardic Inspiration die, roll it and subtract the number from the creature's roll. You can do this after it rolls but before the DM says whether the attack or check succeeds, or before it deals its damage. It has no effect on a creature that can't hear you or is immune to being charmed."}
    ],
    6:[{name:"Additional Magical Secrets", text:"You learn two spells of your choice from any class. Each must be a cantrip or of a level you can cast. They count as bard spells for you but don't count against your spells known."}],
    14:[{name:"Peerless Skill", text:"When you make an ability check, you can expend a Bardic Inspiration die, roll it and add the number to the check. You can do this after rolling but before the DM says whether you succeed."}]
  }},
  {name:"College of Valor", blurb:"A battle-bard who inspires heroics on the front line.", features:{
    3:[
      {name:"Bonus Proficiencies", text:"Proficiency with medium armor, shields and martial weapons.", grants:{armor:["Medium armor","Shields"], weapons:["Martial weapons"]}},
      {name:"Combat Inspiration", text:"A creature with one of your Bardic Inspiration dice can roll it and add the number to a weapon damage roll it just made. Or, when an attack roll is made against it, it can use its reaction to roll the die and add the number to its AC against that attack, after seeing the roll but before knowing whether it hits."}
    ],
    6:[{name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}],
    14:[{name:"Battle Magic", text:"When you use your action to cast a bard spell, you can make one weapon attack as a bonus action."}]
  }},
  {name:"College of Eloquence", blurb:"A master orator whose words never miss and always inspire.", features:{
    3:[
      {name:"Silver Tongue", text:"When you make a Persuasion or Deception check you can treat a roll of 9 or lower on the d20 as a 10."},
      {name:"Unsettling Words", text:"As a bonus action, expend one Bardic Inspiration die and choose a creature you can see within 60 feet. Roll the die; the creature subtracts the result from the next saving throw it makes before the start of your next turn."}
    ],
    6:[
      {name:"Unfailing Inspiration", text:"When a creature adds your Bardic Inspiration die to a roll and fails, it keeps the die; it isn't expended."},
      {name:"Universal Speech", text:"As an action, choose up to a number of creatures equal to your CHA modifier (minimum 1) within 60 feet. For 1 hour they magically understand you, regardless of language. Once per long rest, or expend a spell slot of any level to use it again."}
    ],
    14:[
      {name:"Infectious Inspiration", text:"When a creature uses your Bardic Inspiration die and succeeds on the roll, you can use your reaction to give a different creature within 60 feet a Bardic Inspiration die without expending one of your uses. You can use this reaction a number of times equal to your CHA modifier (minimum 1), regained on a long rest."}
    ]
  }},
  {name:"College of Swords", blurb:"A daring blade performer who weaves weapon tricks into combat.", features:{
    3:[
      {name:"Bonus Proficiencies", text:"You gain proficiency with medium armor and with the scimitar. If you are already proficient with a simple or martial melee weapon you can use it as a spellcasting focus.", grants:{armor:["Medium armor"], weapons:["Scimitars"]}},
      {name:"Fighting Style", text:"Choose one fighting style: Dueling (+2 damage with a one-handed melee weapon while your other hand is empty) or Two-Weapon Fighting (add your modifier to the off-hand attack's damage)."},
      {name:"Blade Flourish", text:"When you take the Attack action, your walking speed increases by 10 feet until the end of the turn, and one attack you make this turn can be a Blade Flourish. Expend a Bardic Inspiration die to choose one: Defensive Flourish (add the die to the attack's damage and to your AC until the start of your next turn), Slashing Flourish (add the die to the damage of the attack, and deal the same amount of damage to any other creature of your choice you can see within 5 feet of you), or Mobile Flourish (add the die to the damage and push the target up to 5 + the die result feet away; you can then move up to your speed toward it as a reaction)."}
    ],
    6:[
      {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}
    ],
    14:[
      {name:"Master's Flourish", text:"Whenever you use a Blade Flourish option you can roll a d6 and use it instead of expending a Bardic Inspiration die."}
    ]
  }},
  {name:"College of Creation", blurb:"Sings the Song of Creation to conjure objects and bring them to dancing life.", features:{
    3:[
      {name:"Mote of Potential", text:"When you give a creature a Bardic Inspiration die, a tiny mote orbits it and adds a bonus when the die is used. Ability check: roll the die twice and use either result. Attack roll: right after the die is rolled, the mote shatters and the target and each creature of your choice within 5 feet of it make a CON save against your spell save DC or take thunder damage equal to the die roll. Saving throw: the creature gains temporary HP equal to the die roll + your CHA modifier (minimum 1)."},
      {name:"Performance of Creation", text:"As an action, create one nonmagical item in an unoccupied space within 10 feet, on a surface that can support it. It is Medium or smaller (Large from level 6, Huge from level 14), worth no more than 20 x your bard level in gp, and glimmers softly. It lasts for a number of hours equal to your proficiency bonus; you can have only one at a time. Once per long rest, or expend a 2nd-level or higher spell slot to use it again."}
    ],
    6:[
      {name:"Animating Performance", text:"As an action, animate a Large or smaller nonmagical item within 30 feet as a Dancing Item for 1 hour (until it drops to 0 HP or you die). It is friendly and takes its turn immediately after yours. It can move and use its reaction on its own, but only takes the Dodge action unless you use a bonus action to command it (you can also command it as part of the bonus action you use for Bardic Inspiration). Dancing Item: AC 16, HP 10 + 5 x bard level, speed 30 ft (fly 30 ft, hover), immune to poison and psychic damage and to charm, exhaustion, poison and fright. Irrepressible Dance: a creature that starts its turn within 10 feet of it has its walking speed raised or lowered by 10 feet until the end of that turn (your choice). Force-Empowered Slam: melee attack using your spell attack bonus, 1d10 + proficiency bonus force damage. Once per long rest, or expend a 3rd-level or higher spell slot to use it again."}
    ],
    14:[
      {name:"Creative Crescendo", text:"When you use Performance of Creation, you can create a number of items equal to your CHA modifier (minimum 2) at once. Only one of them can be of the maximum size you can create; the rest must be Small or Tiny. You are no longer limited by gp value. If creating one would exceed your limit, you choose which earlier item disappears."}
    ]
  }},
  {name:"College of Glamour", blurb:"A fey-touched performer whose beauty charms crowds and commands foes.", features:{
    3:[
      {name:"Mantle of Inspiration", text:"As a bonus action, expend one Bardic Inspiration use and choose up to your CHA modifier (minimum 1) creatures within 60 feet. Each gains 5 temporary HP (8 at level 5, 11 at level 10, 14 at level 15) and can immediately use its reaction to move up to its speed without provoking opportunity attacks."},
      {name:"Enthralling Performance", text:"After performing for at least 1 minute, choose up to your CHA modifier (minimum 1) humanoids within 60 feet that watched and listened. Each makes a WIS save against your spell save DC or is charmed by you for 1 hour: it idolizes you, speaks glowingly of you and hinders anyone who opposes you (avoiding violence unless already inclined to fight). The effect ends early if the creature takes damage, you attack it, or it sees you attack or damage any of its allies. A creature that succeeds has no hint you tried. Once per short or long rest."}
    ],
    6:[
      {name:"Mantle of Majesty", text:"As a bonus action, cast Command without expending a spell slot and take on an unearthly appearance for 1 minute or until your concentration ends (as if concentrating on a spell). Until then, you can cast Command as a bonus action on each of your turns without a spell slot. Any creature charmed by you automatically fails its save against it. Once per long rest."}
    ],
    14:[
      {name:"Unbreakable Majesty", text:"As a bonus action, assume a magically majestic presence for 1 minute or until you are incapacitated. While it lasts, the first time a creature attacks you on a turn it must make a CHA save against your spell save DC. On a failure it can't attack you this turn and must choose a new target or lose the attack. On a success it has disadvantage on saves against your spells on your next turn. Once per short or long rest."}
    ]
  }},
  {name:"College of Spirits", blurb:"A medium who channels the tales of the dead to aid allies and smite foes.", features:{
    3:[
      {name:"Guiding Whispers", text:"You learn the Guidance cantrip (it doesn't count against your cantrips known). When you cast it, its range is 60 feet.", spells:["Guidance"], spellKind:"known"},
      {name:"Spiritual Focus", text:"You can use a candle, crystal ball, skull, spirit board or tarokka deck as a spellcasting focus for your bard spells. From level 6, when you cast a bard spell that deals damage or restores hit points through your Spiritual Focus, roll a d6 and add it to one damage or healing roll of the spell."},
      {name:"Tales from Beyond", text:"As a bonus action, expend one Bardic Inspiration use and roll your Bardic Inspiration die on the Spirit Tales table. You keep the tale in mind until you bestow it or finish a short or long rest, and can hold only one at a time. As an action, bestow it on a creature within 30 feet (it can be you). Save DC is your spell save DC; \"BI\" below is a roll of your Bardic Inspiration die. 1 Clever Animal: for 10 minutes, add BI to INT, WIS and CHA checks. 2 Renowned Duelist: melee spell attack, 2 BI + CHA mod force damage. 3 Beloved Friends: the target and one creature within 5 feet of it gain BI + CHA mod temporary HP. 4 Runaway: the target teleports up to 30 feet with its reaction; up to CHA mod creatures within 30 feet of it can do the same. 5 Avenger: for 1 minute, a creature that hits the target with a melee attack takes BI force damage. 6 Traveler: the target gains BI + bard level temporary HP; while they last, +10 feet speed and +1 AC. 7 Beguiler: WIS save or 2 BI psychic damage and incapacitated until the end of its next turn. 8 Phantom: invisible until the end of its next turn or until it hits; the creature it hits takes BI necrotic damage and is frightened of it until the end of that creature's next turn. 9 Brute: creatures of the target's choice within 30 feet make a STR save or take 3 BI thunder damage and fall prone (half, not prone, on a success). 10 Dragon: 30-foot cone of fire, DEX save, 4 BI fire damage (half on a success). 11 Angel: the target regains 2 BI + CHA mod HP and you end one of blinded, deafened, paralyzed, petrified or poisoned on it. 12 Mind-Bender: INT save or 3 BI psychic damage and stunned until the end of its next turn."}
    ],
    6:[
      {name:"Spirit Session", text:"Over a 1-hour ritual during a short or long rest, commune with spirits alongside a number of willing creatures equal to your proficiency bonus (including you). You temporarily learn one divination or necromancy spell from any class, of a level no higher than the number of creatures that took part and that you can cast. It counts as a bard spell for you but not against your spells known, and you keep it until you perform another Spirit Session or finish a long rest. Once per long rest."}
    ],
    14:[
      {name:"Mystical Connection", text:"Whenever you roll on the Spirit Tales table, roll the die twice and choose which effect to use. If both rolls match, you can ignore them and choose any effect on the table."}
    ]
  }},
  {name:"College of Whispers", blurb:"A spy and blackmailer who wields fear, secrets and stolen faces.", features:{
    3:[
      {name:"Psychic Blades", text:"When you hit a creature with a weapon attack, you can expend one Bardic Inspiration use to deal an extra 2d6 psychic damage (3d6 at level 5, 5d6 at level 10, 8d6 at level 15). Once per round, on your turn."},
      {name:"Words of Terror", text:"After speaking to a humanoid alone for at least 1 minute, it makes a WIS save against your spell save DC or is frightened of you or another creature of your choice for 1 hour, until it is attacked or damaged, or until it sees its allies attacked or damaged. A creature that succeeds has no hint you tried. Once per short or long rest."}
    ],
    6:[
      {name:"Mantle of Whispers", text:"When a humanoid dies within 30 feet of you, use your reaction to capture its shadow, which you keep until you use it or finish a long rest. As an action, use it to take on the dead person's appearance for 1 hour (end it early as a bonus action). While disguised you know what the creature would freely share with a casual acquaintance, enough to pass yourself off as it. A creature sees through it with a WIS (Insight) check contested by your CHA (Deception) check, and you add +5 to your roll. Once you capture a shadow, you can't do so again until you finish a short or long rest."}
    ],
    14:[
      {name:"Shadow Lore", text:"As an action, whisper a phrase that only one creature within 30 feet can hear. It makes a WIS save against your spell save DC (it succeeds automatically if it can't hear you or shares no language with you). On a failure it is charmed by you for 8 hours or until you or your allies attack or damage it, convinced you know its most mortifying secret. It obeys your commands for fear you'll reveal it, grants favors it would give a close friend, but won't risk its life or fight for you unless already inclined. When it ends, it has no idea why it feared you. Once per long rest."}
    ]
  }}
];
