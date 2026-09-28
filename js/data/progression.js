/* ---------------- Levelling, subclasses & multiclassing data ----------------
   5e (2014) progression. Level-1 class features live in classes.js
   (CLASSES_INFO[..].features); this file covers what each class gains
   from level 2 up. A feature with `replaces` swaps out an earlier
   feature of that name (e.g. Sneak Attack growing from 1d6 to 2d6), and
   `speed` is a flat walking-speed bonus applied when it's gained. */

/* Levelling is capped here for now; raise it once the feature data
   below is filled in for higher levels. */
export var MAX_LEVEL = 5;

/* Total XP needed to reach each character level (index = level). */
export var XP_THRESHOLDS = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

var STANDARD_ASI = [4, 8, 12, 16, 19];

/* prereq: list of alternatives, each a list of abilities that must all be
   13+ (Fighter: STR or DEX; Monk: DEX and WIS).
   casterType: "full" | "half" | "artificer" | "pact" | null. Drives spell
   slots. spellAbility: the class's spellcasting ability.
   multiclassProfs: what you gain when this is NOT your first class.
   fightingStyle: {level, options}: the class level that grants a
   Fighting Style and which styles it may pick (see FIGHTING_STYLES in
   classes.js). Level-up shows a picker for it. */
export var CLASS_PROGRESSION = {
  "Artificer": {
    subclassLevel: 3, subclassLabel: "Artificer Specialist",
    prereq: [["int"]], casterType: "artificer", spellAbility: "int", asiLevels: [4, 8, 12, 16, 19],
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:[], tools:["Thieves' tools","Tinker's tools"], note:""},
    features: {
      2: [{name:"Infuse Item", text:"You learn artifice infusions and can turn ordinary items into magic ones after a long rest (e.g. +1 weapons or armor). You know 4 infusions and can have 2 infused items at once."}],
      3: [{name:"The Right Tool for the Job", text:"With thieves' or artisan's tools in hand, you can spend 1 hour to magically create one set of artisan's tools."}],
      4: []
    }
  },
  "Barbarian": {
    subclassLevel: 3, subclassLabel: "Primal Path",
    prereq: [["str"]], casterType: null, asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], note:""},
    features: {
      2: [
        {name:"Reckless Attack", text:"On your first attack of a turn you can attack recklessly: advantage on your Strength melee attacks this turn, but attacks against you also have advantage until your next turn."},
        {name:"Danger Sense", text:"Advantage on Dexterity saving throws against effects you can see (traps, spells) as long as you aren't blinded, deafened or incapacitated."}
      ],
      5: [
        {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."},
        {name:"Fast Movement", text:"Your speed increases by 10 feet while you aren't wearing heavy armor. (Already added to your speed.)", speed:10}
      ]
    }
  },
  "Bard": {
    subclassLevel: 3, subclassLabel: "Bard College",
    prereq: [["cha"]], casterType: "full", spellAbility: "cha", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor"], weapons:[], tools:["One musical instrument"], note:"Also gain proficiency in one skill of your choice. Tick it on the Abilities & Skills tab."},
    features: {
      2: [
        {name:"Jack of All Trades", text:"Add half your proficiency bonus (rounded down) to any ability check that doesn't already include your proficiency bonus."},
        {name:"Song of Rest", text:"During a short rest, allies who spend hit dice while hearing you perform regain an extra 1d6 hit points."}
      ],
      3: [{name:"Expertise", text:"Pick two skills you're proficient in: your proficiency bonus is doubled for them. Tick the E box next to them on the Abilities & Skills tab."}],
      5: [
        {name:"Bardic Inspiration", replaces:"Bardic Inspiration", text:"Bonus action to give an ally within 60 feet a d8 inspiration die to add to one ability check, attack roll or saving throw. Uses equal to your Charisma modifier."},
        {name:"Font of Inspiration", text:"You regain all your Bardic Inspiration uses on a short rest as well as a long rest."}
      ]
    }
  },
  "Cleric": {
    subclassLevel: 1, subclassLabel: "Divine Domain",
    prereq: [["wis"]], casterType: "full", spellAbility: "wis", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:[], tools:[], note:""},
    features: {
      2: [{name:"Channel Divinity (1/rest)", text:"Channel divine power once per short or long rest. Every cleric has Turn Undead: each undead within 30 feet that fails a Wisdom save must flee from you for 1 minute. Your domain adds another option."}],
      5: [{name:"Destroy Undead (CR 1/2)", text:"When an undead of challenge rating 1/2 or lower fails its save against your Turn Undead, it is destroyed instantly."}]
    }
  },
  "Druid": {
    subclassLevel: 2, subclassLabel: "Druid Circle",
    prereq: [["wis"]], casterType: "full", spellAbility: "wis", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:[], tools:[], note:""},
    features: {
      2: [{name:"Wild Shape", text:"Action to turn into a beast you've seen (max CR 1/4, no flying or swimming speed) for hours equal to half your druid level. Twice per short or long rest. You use the beast's hit points; when they hit 0 you turn back."}],
      4: [{name:"Wild Shape", replaces:"Wild Shape", text:"Action to turn into a beast you've seen (max CR 1/2, no flying speed) for hours equal to half your druid level. Twice per short or long rest. You use the beast's hit points; when they hit 0 you turn back."}]
    }
  },
  "Fighter": {
    subclassLevel: 3, subclassLabel: "Martial Archetype",
    fightingStyle: {level:1, options:["Archery","Defense","Dueling","Great Weapon Fighting","Protection","Two-Weapon Fighting"]},
    prereq: [["str"], ["dex"]], casterType: null, asiLevels: [4, 6, 8, 12, 14, 16, 19],
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], note:""},
    features: {
      2: [{name:"Action Surge", text:"Once per short or long rest, take one additional action on your turn, e.g. to attack again or cast a second spell with an action."}],
      5: [{name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}]
    }
  },
  "Monk": {
    subclassLevel: 3, subclassLabel: "Monastic Tradition",
    prereq: [["dex", "wis"]], casterType: null, asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:[], weapons:["Simple weapons","Shortswords"], tools:[], note:""},
    features: {
      2: [
        {name:"Ki", text:"You have ki points equal to your monk level, regained on a short or long rest. Spend 1 ki for: Flurry of Blows (two unarmed strikes as a bonus action), Patient Defense (Dodge as a bonus action) or Step of the Wind (Disengage or Dash as a bonus action, jump distance doubled). Save DC = 8 + proficiency + WIS."},
        {name:"Unarmored Movement", text:"Your speed increases by 10 feet while you wear no armor and no shield. (Already added to your speed.)", speed:10}
      ],
      3: [{name:"Deflect Missiles", text:"Reaction when hit by a ranged weapon attack: reduce the damage by 1d10 + DEX modifier + monk level. If that reduces it to 0 you can catch it and spend 1 ki to throw it back."}],
      4: [{name:"Slow Fall", text:"Reaction when you fall: reduce the falling damage by five times your monk level."}],
      5: [
        {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."},
        {name:"Stunning Strike", text:"When you hit with a melee weapon attack, spend 1 ki: the target must make a Constitution save or be stunned until the end of your next turn."},
        {name:"Martial Arts", replaces:"Martial Arts", text:"Use DEX for unarmed strikes and monk weapons, which now deal 1d6 damage. Bonus action unarmed strike after the Attack action."}
      ]
    }
  },
  "Paladin": {
    subclassLevel: 3, subclassLabel: "Sacred Oath",
    fightingStyle: {level:2, options:["Defense","Dueling","Great Weapon Fighting","Protection"]},
    prereq: [["str", "cha"]], casterType: "half", spellAbility: "cha", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], note:""},
    features: {
      2: [
        {name:"Fighting Style", text:"Adopt a fighting style: Defense (+1 AC in armor), Dueling (+2 damage with a one-handed weapon and nothing in the other hand), Great Weapon Fighting (reroll 1s and 2s on two-handed damage) or Protection (impose disadvantage on an attack against an ally next to you)."},
        {name:"Spellcasting", text:"You can now cast paladin spells using Charisma. Each day you prepare Charisma modifier + half your paladin level spells from the paladin list."},
        {name:"Divine Smite", text:"When you hit with a melee weapon attack, spend a spell slot to deal an extra 2d8 radiant damage (+1d8 per slot level above 1st, +1d8 against undead or fiends)."}
      ],
      3: [{name:"Divine Health", text:"You are immune to disease."}],
      5: [{name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}]
    }
  },
  "Ranger": {
    subclassLevel: 3, subclassLabel: "Ranger Archetype",
    fightingStyle: {level:2, options:["Archery","Defense","Dueling","Two-Weapon Fighting"]},
    prereq: [["dex", "wis"]], casterType: "half", spellAbility: "wis", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], note:"Also gain proficiency in one skill from the ranger list. Tick it on the Abilities & Skills tab."},
    features: {
      2: [
        {name:"Fighting Style", text:"Adopt a fighting style: Archery (+2 to ranged weapon attacks), Defense (+1 AC in armor), Dueling (+2 damage one-handed) or Two-Weapon Fighting (add your modifier to the off-hand attack's damage)."},
        {name:"Spellcasting", text:"You can now cast ranger spells using Wisdom. You know two 1st-level ranger spells and learn more as you level."}
      ],
      3: [{name:"Primeval Awareness", text:"Spend a spell slot to sense for 1 minute per slot level whether aberrations, celestials, dragons, elementals, fey, fiends or undead are within 1 mile (6 in your favored terrain)."}],
      5: [{name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}]
    }
  },
  "Rogue": {
    subclassLevel: 3, subclassLabel: "Roguish Archetype",
    prereq: [["dex"]], casterType: null, asiLevels: [4, 8, 10, 12, 16, 19],
    multiclassProfs: {armor:["Light armor"], weapons:[], tools:["Thieves' tools"], note:"Also gain proficiency in one skill from the rogue list. Tick it on the Abilities & Skills tab."},
    features: {
      2: [{name:"Cunning Action", text:"You can Dash, Disengage or Hide as a bonus action on each of your turns."}],
      3: [{name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 2d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage, or an ally is within 5 feet of it."}],
      5: [
        {name:"Uncanny Dodge", text:"Reaction when an attacker you can see hits you: halve the attack's damage."},
        {name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 3d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage, or an ally is within 5 feet of it."}
      ]
    }
  },
  "Sorcerer": {
    subclassLevel: 1, subclassLabel: "Sorcerous Origin",
    prereq: [["cha"]], casterType: "full", spellAbility: "cha", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:[], weapons:[], tools:[], note:""},
    features: {
      2: [{name:"Font of Magic", text:"You have sorcery points equal to your sorcerer level (regained on a long rest). Turn them into spell slots or break slots down into points as a bonus action."}],
      3: [{name:"Metamagic", text:"Pick two Metamagic options (e.g. Quickened Spell: cast an action spell as a bonus action; Twinned Spell: target a second creature). Spend sorcery points to twist your spells."}]
    }
  },
  "Warlock": {
    subclassLevel: 1, subclassLabel: "Otherworldly Patron",
    prereq: [["cha"]], casterType: "pact", spellAbility: "cha", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor"], weapons:["Simple weapons"], tools:[], note:""},
    features: {
      2: [{name:"Eldritch Invocations", text:"You learn two eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). Add them as custom features."}],
      3: [{name:"Pact Boon", text:"Your patron grants a gift: Pact of the Chain (a special familiar), Pact of the Blade (summon a magic weapon you're proficient with) or Pact of the Tome (a book with three extra cantrips from any class)."}],
      5: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know three eldritch invocations: permanent magical upgrades such as Agonizing Blast or Devil's Sight. You can swap one each time you gain a warlock level."}]
    }
  },
  "Wizard": {
    subclassLevel: 2, subclassLabel: "Arcane Tradition",
    prereq: [["int"]], casterType: "full", spellAbility: "int", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:[], weapons:[], tools:[], note:""},
    features: {}
  }
};

/* Subclasses. `features` is keyed by class level (only up to MAX_LEVEL is
   filled in). casterType "third" marks the Eldritch Knight / Arcane
   Trickster style one-third casters. */
export var SUBCLASSES = {
  "Artificer": [
    {name:"Alchemist", blurb:"Brews magical elixirs and heals or harms with potions.", features:{
      3:[
        {name:"Tool Proficiency", text:"You gain proficiency with alchemist's supplies (or another type of artisan's tools if you already have it)."},
        {name:"Experimental Elixir", text:"After a long rest, create one magic elixir with a random effect (healing, swiftness, resilience, boldness, flight or transformation). Spend spell slots to make more."},
        {name:"Alchemist Spells", text:"You always have Healing Word and Ray of Sickness prepared; they don't count against your prepared spells."}
      ],
      5:[
        {name:"Alchemist Spells", replaces:"Alchemist Spells", text:"You always have Healing Word, Ray of Sickness, Flaming Sphere and Melf's Acid Arrow prepared; they don't count against your prepared spells."},
        {name:"Alchemical Savant", text:"When you cast a spell using alchemist's supplies as your focus, add your INT modifier (min +1) to one roll of the spell that restores hit points or deals acid, fire, necrotic or poison damage."}
      ]
    }},
    {name:"Artillerist", blurb:"Builds a magical cannon that blasts foes or shields allies.", features:{
      3:[
        {name:"Tool Proficiency", text:"You gain proficiency with woodcarver's tools (or another type of artisan's tools if you already have it)."},
        {name:"Eldritch Cannon", text:"Action to create a small magical cannon for 1 hour: Flamethrower (2d8 fire cone), Force Ballista (2d8 force, pushes) or Protector (temp HP to allies). Bonus action to fire it. Once per long rest, or spend a spell slot."},
        {name:"Artillerist Spells", text:"You always have Shield and Thunderwave prepared."}
      ],
      5:[
        {name:"Artillerist Spells", replaces:"Artillerist Spells", text:"You always have Shield, Thunderwave, Scorching Ray and Shatter prepared."},
        {name:"Arcane Firearm", text:"After a long rest, carve sigils into a wand, staff or rod to make it your arcane firearm. When you cast an artificer spell through it, roll a d8 and add it to one of the spell's damage rolls."}
      ]
    }},
    {name:"Battle Smith", blurb:"A soldier-engineer fighting beside a loyal steel defender.", features:{
      3:[
        {name:"Tool Proficiency", text:"You gain proficiency with smith's tools (or another type of artisan's tools if you already have it)."},
        {name:"Battle Ready", text:"Proficiency with martial weapons, and you can use Intelligence instead of Strength or Dexterity for attacks with magic weapons."},
        {name:"Steel Defender", text:"You build a mechanical companion that fights beside you. It acts on your turn; use a bonus action to command it."},
        {name:"Battle Smith Spells", text:"You always have Heroism and Shield prepared."}
      ],
      5:[
        {name:"Battle Smith Spells", replaces:"Battle Smith Spells", text:"You always have Heroism, Shield, Branding Smite and Warding Bond prepared."},
        {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}
      ]
    }},
    {name:"Armorer", blurb:"Turns a suit of armor into a powerful magical exosuit.", features:{
      3:[
        {name:"Tools of the Trade", text:"You gain proficiency with heavy armor and smith's tools."},
        {name:"Arcane Armor", text:"Turn a suit of armor into Arcane Armor: no Strength requirement, it acts as your spellcasting focus, and it can't be removed against your will."},
        {name:"Armor Model", text:"Choose Guardian (thunder gauntlets, temporary HP) or Infiltrator (lightning launcher, +5 ft speed, stealthy). You can switch after a rest."},
        {name:"Armorer Spells", text:"You always have Magic Missile and Thunderwave prepared."}
      ],
      5:[
        {name:"Armorer Spells", replaces:"Armorer Spells", text:"You always have Magic Missile, Thunderwave, Mirror Image and Shatter prepared."},
        {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}
      ]
    }}
  ],
  "Barbarian": [
    {name:"Path of the Berserker", blurb:"Rage turns into a violent frenzy for extra attacks.", features:{3:[
      {name:"Frenzy", text:"When you rage you can choose to frenzy: make one extra melee attack as a bonus action each turn. When the rage ends you gain one level of exhaustion."}
    ]}},
    {name:"Path of the Totem Warrior", blurb:"Draws strength from a spirit animal guide.", features:{3:[
      {name:"Spirit Seeker", text:"You can cast Beast Sense and Speak with Animals as rituals."},
      {name:"Totem Spirit", text:"Choose a totem: Bear (resist all damage but psychic while raging), Eagle (others have disadvantage on opportunity attacks against you; Dash as a bonus action) or Wolf (allies have advantage on melee attacks against enemies next to you while you rage)."}
    ]}},
    {name:"Path of the Zealot", blurb:"A divine warrior powered by a god's fury.", features:{3:[
      {name:"Divine Fury", text:"While raging, the first creature you hit each turn takes an extra 1d6 + half your barbarian level radiant or necrotic damage."},
      {name:"Warrior of the Gods", text:"Spells that would bring you back from the dead need no material components."}
    ]}},
    {name:"Path of the Ancestral Guardian", blurb:"Calls on ancestral spirits to protect allies and hinder foes.", features:{
      3:[
        {name:"Ancestral Protectors", text:"While you're raging, the first creature you hit with an attack on your turn becomes the quarry of your ancestors. Until the start of your next turn it has disadvantage on attack rolls against targets other than you, and any creature other than you that it attacks has resistance to all damage from that attack."}
      ],
      6:[
        {name:"Spirit Shield", text:"While you're raging, you can use your reaction when another creature you can see within 30 feet is damaged to reduce that damage by 2d6. This increases to 3d6 at level 10 and 4d6 at level 14."}
      ],
      10:[
        {name:"Consult the Spirits", text:"You gain the ability to consult ancestral spirits. You cast Clairvoyance or Augury (no spell slot or material components) a number of times equal to your proficiency bonus, regained on a long rest."}
      ],
      14:[
        {name:"Vengeful Ancestors", text:"Your ancestral spirits grow powerful enough to strike back. When you use Spirit Shield to reduce damage, the attacker takes force damage equal to the amount reduced."}
      ]
    }},
    {name:"Path of Wild Magic", blurb:"Fuels rage with unstable magical energy from the raw weave.", features:{
      3:[
        {name:"Magic Awareness", text:"As an action, you can sense the presence of spells or magic items within 60 feet until the end of your next turn. You can use this a number of times equal to your proficiency bonus, regained on a long rest."},
        {name:"Wild Surge", text:"Each time you enter a rage, roll on the Wild Magic table: one of eight random surges occurs (e.g. teleport up to 30 ft, summon a spectral warrior, deal necrotic damage to each creature within 30 ft, or gain +5 ft fly speed)."}
      ],
      6:[
        {name:"Bolstering Magic", text:"As an action, touch a creature (including yourself) to give it one of: advantage on attack rolls and ability checks for 10 minutes, or expend one of your rage uses to restore a 1st- or 2nd-level spell slot to it. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
      ],
      10:[
        {name:"Unstable Backlash", text:"When you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Magic table and immediately apply the result. This replaces the current Wild Surge effect."}
      ],
      14:[
        {name:"Controlled Surge", text:"Whenever you roll on the Wild Magic table, roll twice and choose which of the two effects to apply. If both results are the same you can ignore the table and pick any result."}
      ]
    }},
    {name:"Path of the Beast", blurb:"Taps into a monstrous inner nature to sprout natural weapons.", features:{
      3:[
        {name:"Form of the Beast", text:"While raging, you manifest one natural weapon of your choice: Bite (1d8 piercing; if the target is Large or smaller, make a second bite as a bonus action for 1d8 + STR, regaining HP equal to half the damage), Claws (two attacks with 1d6 slashing; each hit lets you make another claw attack as a bonus action), or Tail (1d8 piercing with 10 ft reach; once per turn when a creature within reach hits you, add your proficiency bonus to AC against that attack as a reaction)."}
      ],
      6:[
        {name:"Bestial Soul", text:"Your natural weapons count as magical for overcoming resistance. Additionally, choose one permanent buff: swim speed equal to your walking speed and water breathing, climb speed equal to walking speed, or jump triple the normal distance. You can change this choice on a long rest."}
      ],
      10:[
        {name:"Infectious Fury", text:"When you hit a creature with your natural weapons while raging, the creature must succeed on a Wisdom save (DC 8 + proficiency + CON) or suffer one of two effects (your choice): it uses its reaction to attack a creature of your choice, or it takes 2d12 psychic damage. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
      ],
      14:[
        {name:"Call the Hunt", text:"At the start of each of your rages, you can choose up to five willing creatures you can see within 30 feet. Until the rage ends, each target deals +1d6 damage on their first hit each turn with a weapon or unarmed strike. You also gain 5 temporary HP per creature that accepts this benefit. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
      ]
    }}
  ],
  "Bard": [
    {name:"College of Lore", blurb:"Collects knowledge and uses words to undermine foes.", features:{3:[
      {name:"Bonus Proficiencies", text:"Gain proficiency with three skills of your choice. Tick them on the Abilities & Skills tab."},
      {name:"Cutting Words", text:"Reaction: spend a Bardic Inspiration die to subtract it from an enemy's attack roll, ability check or damage roll."}
    ]}},
    {name:"College of Valor", blurb:"A battle-bard who inspires heroics on the front line.", features:{3:[
      {name:"Bonus Proficiencies", text:"Proficiency with medium armor, shields and martial weapons."},
      {name:"Combat Inspiration", text:"Allies can add your Bardic Inspiration die to a damage roll, or to their AC against one attack."}
    ]}},
    {name:"College of Eloquence", blurb:"A master orator whose words never miss and always inspire.", features:{
      3:[
        {name:"Silver Tongue", text:"When you make a Persuasion or Deception check you can treat a roll of 9 or lower on the d20 as a 10."},
        {name:"Unsettling Words", text:"As a bonus action, expend one Bardic Inspiration die and choose a creature you can see within 60 feet. Roll the die; until the end of your next turn the creature subtracts the result from its next saving throw."}
      ],
      6:[
        {name:"Unfailing Inspiration", text:"When a creature adds your Bardic Inspiration die to a roll and fails, it keeps the die; it isn't expended."},
        {name:"Universal Speech", text:"As an action, choose up to a number of creatures equal to your CHA modifier (minimum 1) within 60 feet. For 1 hour they magically understand you, regardless of language. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
      ],
      14:[
        {name:"Infectious Inspiration", text:"When a creature uses your Bardic Inspiration die and succeeds on the roll, you can use your reaction to give a different creature within 60 feet a Bardic Inspiration die — without expending one of your uses. You can use this reaction a number of times equal to your CHA modifier (minimum 1), regained on a long rest."}
      ]
    }},
    {name:"College of Swords", blurb:"A daring blade performer who weaves weapon tricks into combat.", features:{
      3:[
        {name:"Bonus Proficiencies", text:"You gain proficiency with medium armor and with the scimitar. If you are already proficient with a simple or martial melee weapon you can use it as a spellcasting focus."},
        {name:"Fighting Style", text:"Choose one fighting style: Dueling (+2 damage with a one-handed melee weapon while your other hand is empty) or Two-Weapon Fighting (add your modifier to the off-hand attack's damage)."},
        {name:"Blade Flourish", text:"When you take the Attack action, your walking speed increases by 10 feet until the end of the turn, and one attack you make this turn can be a Blade Flourish. Expend a Bardic Inspiration die to choose one: Defensive Flourish (add the die to the attack's damage and to your AC until the start of your next turn), Slashing Flourish (add the die to the damage and deal the same damage to any other creature within 5 feet of the target), or Mobile Flourish (add the die to the damage and push the target up to 5 + the die result feet away; you can then move up to your speed toward it as a reaction)."}
      ],
      6:[
        {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}
      ],
      14:[
        {name:"Master's Flourish", text:"Whenever you use a Blade Flourish option you can roll a d6 and use it instead of expending a Bardic Inspiration die."}
      ]
    }}
  ],
  "Cleric": [
    {name:"Life Domain", blurb:"The healer's domain: tougher armor and stronger heals.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Bless and Cure Wounds prepared; they don't count against your prepared spells."},
        {name:"Bonus Proficiency", text:"You gain proficiency with heavy armor."},
        {name:"Disciple of Life", text:"Your healing spells restore an extra 2 + the spell's level hit points."}
      ],
      2:[{name:"Channel Divinity: Preserve Life", text:"Action: split healing equal to five times your cleric level among creatures within 30 feet (up to half their max HP)."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bless, Cure Wounds, Lesser Restoration and Spiritual Weapon prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bless, Cure Wounds, Lesser Restoration, Spiritual Weapon, Beacon of Hope and Revivify prepared; they don't count against your prepared spells."}]
    }},
    {name:"Light Domain", blurb:"Wields fire and radiance against darkness.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Burning Hands and Faerie Fire prepared; they don't count against your prepared spells."},
        {name:"Bonus Cantrip", text:"You learn the Light cantrip."},
        {name:"Warding Flare", text:"Reaction when attacked by a creature you can see within 30 feet: impose disadvantage on the attack. Uses equal to your Wisdom modifier per long rest."}
      ],
      2:[{name:"Channel Divinity: Radiance of the Dawn", text:"Action: dispel magical darkness within 30 feet, and hostile creatures there take 2d10 + cleric level radiant damage (Constitution save for half)."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Burning Hands, Faerie Fire, Flaming Sphere and Scorching Ray prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Burning Hands, Faerie Fire, Flaming Sphere, Scorching Ray, Daylight and Fireball prepared; they don't count against your prepared spells."}]
    }},
    {name:"War Domain", blurb:"A warrior-priest who fights in heavy armor.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Divine Favor and Shield of Faith prepared; they don't count against your prepared spells."},
        {name:"Bonus Proficiencies", text:"Proficiency with martial weapons and heavy armor."},
        {name:"War Priest", text:"When you take the Attack action, make one weapon attack as a bonus action. Uses equal to your Wisdom modifier per long rest."}
      ],
      2:[{name:"Channel Divinity: Guided Strike", text:"When you make an attack roll, gain +10 to it (decide after seeing the roll, before knowing if it hits)."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Divine Favor, Shield of Faith, Magic Weapon and Spiritual Weapon prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Divine Favor, Shield of Faith, Magic Weapon, Spiritual Weapon, Crusader's Mantle and Spirit Guardians prepared; they don't count against your prepared spells."}]
    }},
    {name:"Knowledge Domain", blurb:"Seeks and guards secrets and lore.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Command and Identify prepared; they don't count against your prepared spells."},
        {name:"Blessings of Knowledge", text:"Learn two languages and gain expertise in two of Arcana, History, Nature or Religion. Tick them on the Abilities & Skills tab."}
      ],
      2:[{name:"Channel Divinity: Knowledge of the Ages", text:"Action: gain proficiency with one skill or tool for 10 minutes."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Identify, Augury and Suggestion prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Identify, Augury, Suggestion, Nondetection and Speak with Dead prepared; they don't count against your prepared spells."}]
    }},
    {name:"Tempest Domain", blurb:"Commands storms, thunder and lightning.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Fog Cloud and Thunderwave prepared; they don't count against your prepared spells."},
        {name:"Bonus Proficiencies", text:"Proficiency with martial weapons and heavy armor."},
        {name:"Wrath of the Storm", text:"Reaction when a creature within 5 feet hits you: it takes 2d8 lightning or thunder damage (Dexterity save for half). Uses equal to your Wisdom modifier per long rest."}
      ],
      2:[{name:"Channel Divinity: Destructive Wrath", text:"When you roll lightning or thunder damage, deal the maximum instead of rolling."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Fog Cloud, Thunderwave, Gust of Wind and Shatter prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Fog Cloud, Thunderwave, Gust of Wind, Shatter, Call Lightning and Sleet Storm prepared; they don't count against your prepared spells."}]
    }},
    {name:"Trickery Domain", blurb:"Deception, stealth and mischief.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Charm Person and Disguise Self prepared; they don't count against your prepared spells."},
        {name:"Blessing of the Trickster", text:"Action: give another willing creature advantage on Stealth checks for 1 hour."}
      ],
      2:[{name:"Channel Divinity: Invoke Duplicity", text:"Create an illusory duplicate of yourself for 1 minute; cast spells from its space and gain advantage when you and it are both next to a target."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Charm Person, Disguise Self, Mirror Image and Pass without Trace prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Charm Person, Disguise Self, Mirror Image, Pass without Trace, Blink and Dispel Magic prepared; they don't count against your prepared spells."}]
    }},
    {name:"Twilight Domain", blurb:"Guards against the terrors of night and eases the transition to death.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Faerie Fire and Sleep prepared; they don't count against your prepared spells."},
        {name:"Bonus Proficiencies", text:"You gain proficiency with martial weapons and heavy armor."},
        {name:"Eyes of Night", text:"You gain darkvision out to 300 feet. As an action, grant up to a number of willing creatures equal to your Wisdom modifier (minimum 1) darkvision out to 300 feet for 1 hour. You can use this a number of times equal to your proficiency bonus, regained on a long rest."},
        {name:"Vigilant Blessing", text:"As an action, give one creature you touch advantage on the next initiative roll it makes. This benefit ends immediately after the roll or when you use this feature again."}
      ],
      2:[{name:"Channel Divinity: Twilight Sanctuary", text:"Action: create a 30-foot-radius sphere of twilight centered on yourself that moves with you for 1 minute. At the start of each of your turns, each creature in the sphere chooses: gain temporary HP equal to 1d6 + your cleric level, or end one effect causing it to be charmed or frightened."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Faerie Fire, Sleep, Moonbeam and See Invisibility prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Faerie Fire, Sleep, Moonbeam, See Invisibility, Aura of Vitality and Leomund's Tiny Hut prepared; they don't count against your prepared spells."}]
    }},
    {name:"Forge Domain", blurb:"Masters the divine art of crafting and imbuing weapons and armor.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Identify and Searing Smite prepared; they don't count against your prepared spells."},
        {name:"Bonus Proficiency", text:"You gain proficiency with heavy armor and smith's tools."},
        {name:"Blessing of the Forge", text:"At the end of a long rest, touch one nonmagical weapon or piece of armor. Until your next long rest it becomes magical: weapon gains +1 to attack and damage, armor gains +1 AC."}
      ],
      2:[{name:"Channel Divinity: Artisan's Blessing", text:"Conduct a 1-hour ritual to create a nonmagical item worth up to 100 gp (metal only), or to add raw metal to reduce the cost of a more expensive item by 100 gp."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Identify, Searing Smite, Heat Metal and Magic Weapon prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Identify, Searing Smite, Heat Metal, Magic Weapon, Elemental Weapon and Protection from Energy prepared; they don't count against your prepared spells."}]
    }},
    {name:"Order Domain", blurb:"Enforces divine law and compels others to act through holy authority.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Command and Heroism prepared; they don't count against your prepared spells."},
        {name:"Bonus Proficiencies", text:"You gain proficiency with heavy armor and with the Persuasion and Intimidation skills."},
        {name:"Voice of Authority", text:"When you cast a spell of 1st level or higher using a spell slot that targets an ally, that ally can use their reaction immediately after the spell to make one weapon attack against a creature of your choice that you can see."}
      ],
      2:[{name:"Channel Divinity: Order's Demand", text:"Action: each creature you choose within 30 feet must succeed on a Wisdom save or be charmed by you until the end of your next turn or until it takes damage. While charmed it must use its reaction to move to the nearest unoccupied space if you command it (no action required by you)."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Heroism, Hold Person and Zone of Truth prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Heroism, Hold Person, Zone of Truth, Mass Healing Word and Slow prepared; they don't count against your prepared spells."}]
    }},
    {name:"Peace Domain", blurb:"Spreads harmony, protection and unity among allies.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Heroism and Sanctuary prepared; they don't count against your prepared spells."},
        {name:"Implement of Peace", text:"You gain proficiency in Insight, Performance or Persuasion (your choice)."},
        {name:"Emboldening Bond", text:"As an action, choose a number of willing creatures equal to your proficiency bonus within 30 feet (including yourself). For 10 minutes, each bonded creature adds 1d4 to attack rolls, ability checks and saving throws as long as at least one other bonded creature is within 30 feet of it. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
      ],
      2:[{name:"Channel Divinity: Balm of Peace", text:"Move up to your speed without provoking opportunity attacks. When you move within 5 feet of a creature, you can restore HP to it equal to 2d6 + your Wisdom modifier (only once per creature per use of this feature)."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Heroism, Sanctuary, Aid and Warding Bond prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Heroism, Sanctuary, Aid, Warding Bond, Beacon of Hope and Sending prepared; they don't count against your prepared spells."}]
    }}
  ],
  "Druid": [
    {name:"Circle of the Land", blurb:"A mystic tied to a type of terrain, with extra spells.", features:{
      2:[
        {name:"Bonus Cantrip", text:"You learn one additional druid cantrip."},
        {name:"Natural Recovery", text:"Once per day during a short rest, recover spell slots with combined level up to half your druid level (rounded up)."}
      ],
      3:[{name:"Circle Spells", text:"Choose a terrain (arctic, coast, desert, forest, grassland, mountain, swamp or Underdark). You always have its circle spells prepared."}]
    }},
    {name:"Circle of the Moon", blurb:"A shapeshifter who fights in beast form.", features:{2:[
      {name:"Combat Wild Shape", text:"Wild Shape as a bonus action, and while transformed spend a spell slot as a bonus action to heal 1d8 per slot level."},
      {name:"Circle Forms", text:"You can Wild Shape into beasts up to CR 1 (instead of 1/4)."}
    ]}},
    {name:"Circle of Stars", blurb:"Charts the stars to gain cosmic boons during Wild Shape and prayer.", features:{
      2:[
        {name:"Star Map", text:"You create a star map (a small object). While holding it you always have Guidance and Guiding Bolt prepared (free, don't count against your prepared spells), and can cast Guiding Bolt without a slot a number of times equal to your proficiency bonus per long rest."},
        {name:"Starry Form", text:"When you use Wild Shape you can assume a starry form instead of a beast. Choose Archer (bonus action ranged spell attack, 1d8 + WIS radiant, on each turn), Chalice (when you cast a healing spell of 1st level or higher, you or a creature within 30 feet regains 1d8 + WIS HP), or Dragon (concentration checks automatically succeed, Guiding Bolt as a bonus action once per turn)."}
      ],
      6:[{name:"Cosmic Omen", text:"After each long rest, roll a d6. Odd: Weal — reaction when a creature within 30 feet makes an attack, check or save: +1d6 to the roll. Even: Woe — reaction: −1d6 to the roll. You can use this a number of times equal to your proficiency bonus per long rest."}],
      10:[{name:"Twinkling Constellations", text:"While in Starry Form, the Archer and Chalice forms each deal an extra 1d8 radiant damage or healing. The Dragon form grants a flying speed of 20 feet and can hover."}],
      14:[{name:"Full of Stars", text:"While in Starry Form, you become partially incorporeal: resistance to bludgeoning, piercing and slashing damage."}]
    }},
    {name:"Circle of Wildfire", blurb:"Bonds with a wildfire spirit to burn away the old and nurture the new.", features:{
      2:[
        {name:"Enhanced Bond", text:"When you cast a spell that deals fire damage or restores HP, add 1d8 to one fire damage or healing roll while your wildfire spirit is summoned."},
        {name:"Summon Wildfire Spirit", text:"As an action, expend one Wild Shape use to summon a wildfire spirit in an unoccupied space within 30 feet. It lasts 1 hour or until reduced to 0 HP. It acts on your initiative. You can command it with a bonus action: it can move and use its Flame Seed (ranged spell attack, 1d6 + WIS fire) or Fiery Teleportation (teleport yourself and up to 3 willing creatures within 5 feet of it up to 15 feet; creatures near the origin take 1d6 + WIS fire on a failed DEX save)."},
        {name:"Circle Spells", text:"You always have Burning Hands, Cure Wounds, Flaming Sphere, Scorching Ray, Plant Growth, Revivify, Aura of Life and Fire Shield prepared; they don't count against your prepared spells."}
      ],
      6:[{name:"Cauterizing Flames", text:"When a Small or larger creature dies within 30 feet of you or your wildfire spirit, a harmless spectral flame appears in its space for 1 minute. As a reaction when a creature you can see enters that space, extinguish the flame to heal or deal 2d10 + WIS fire damage (their choice). Uses equal to your WIS modifier per long rest."}],
      10:[{name:"Blazing Revival", text:"When your wildfire spirit drops to 0 HP, you can expend one Wild Shape use as a reaction to have it drop to 1 HP instead."}],
      14:[{name:"Firestorm", text:"When you cast a fire spell using a spell slot, choose any number of creatures you can see within 60 feet that are not the target. Each must succeed on a DEX save (DC = your spell save DC) or take 2d10 fire damage."}]
    }},
    {name:"Circle of Dreams", blurb:"Connected to the Feywild, weaving healing and travel magic.", features:{
      2:[
        {name:"Balm of the Summer Court", text:"You have a pool of healing equal to five times your druid level. As a bonus action, restore HP to a creature within 120 feet by spending dice from the pool (d6 each); it also gains temporary HP equal to the number of dice spent."},
        {name:"Circle Spells", text:"You always have Sleep, Telekinesis, Mislead and Seeming prepared; they don't count against your prepared spells."}
      ],
      6:[{name:"Hearth of Moonlight and Shadow", text:"At the start of a short or long rest in the open, you can invoke a 30-foot-radius magical space. Until the rest ends, each creature you choose in the area has a +5 bonus to Perception checks and can't be surprised. Flames within are hidden from outside and the area is magically silenced."}],
      10:[{name:"Hidden Paths", text:"You can teleport up to 60 feet to an unoccupied space you can see as a bonus action. As an action, teleport a willing creature you touch to an unoccupied space you can see within 30 feet of you. Uses equal to your WIS modifier (min 1) per long rest."}],
      14:[{name:"Walker in Dreams", text:"When you finish a short rest, you can cast Dream (targeting yourself), Scrying or Teleportation Circle without expending a spell slot or using material components. You must finish a long rest to use this feature again."}]
    }},
    {name:"Circle of Spores", blurb:"Finds beauty in decay and animates the dead with fungal energy.", features:{
      2:[
        {name:"Halo of Spores", text:"When a creature you can see moves into a space within 10 feet of you, use your reaction to deal 1d4 necrotic damage (Constitution save negates). The damage increases as you level."},
        {name:"Symbiotic Entity", text:"When you use Wild Shape you can expend one use to awaken your spores instead of transforming. Gain temporary HP equal to 4 × your druid level, Halo of Spores deals +1d4 extra damage, and your melee attacks deal an extra 1d6 poison damage. This lasts until the temp HP are lost."},
        {name:"Circle Spells", text:"You always have Chill Touch, Blindness/Deafness, Gentle Repose, Animate Dead, Gaseous Form, Blight, Confusion and Cloudkill prepared; they don't count against your prepared spells."}
      ],
      6:[{name:"Fungal Infestation", text:"When a Small or Medium beast or humanoid dies within 10 feet of you, you can use your reaction to animate it as a zombie (it has 1 HP). It acts immediately after you each round and obeys your mental commands. It turns to dust after 1 hour or when it drops to 0 HP. Uses equal to your WIS modifier per long rest."}],
      10:[{name:"Spreading Spores", text:"While Symbiotic Entity is active, use a bonus action to hurl spores up to 30 feet. Halo of Spores works in a 10-foot cube centered on that point instead of around you. Each turn you can move the cube up to 10 feet using your reaction."}],
      14:[{name:"Fungal Body", text:"The fungal spores permeate your body: you are immune to blinded, deafened, frightened and poisoned conditions, and critical hits against you become normal hits."}]
    }}
  ],
  "Fighter": [
    {name:"Champion", blurb:"Simple, reliable raw power with more critical hits.", features:{3:[
      {name:"Improved Critical", text:"Your weapon attacks score a critical hit on a roll of 19 or 20."}
    ]}},
    {name:"Battle Master", blurb:"A tactician with special combat maneuvers.", features:{3:[
      {name:"Combat Superiority", text:"You learn three maneuvers (e.g. Trip Attack, Riposte, Precision Attack) and have four d8 superiority dice to fuel them, regained on a short or long rest."},
      {name:"Student of War", text:"Gain proficiency with one type of artisan's tools."}
    ]}},
    {name:"Eldritch Knight", blurb:"Blends martial skill with wizard magic.", casterType:"third", spellAbility:"int", features:{3:[
      {name:"Spellcasting", text:"You learn two wizard cantrips and three 1st-level wizard spells (mostly abjuration and evocation), cast with Intelligence."},
      {name:"Weapon Bond", text:"Bond with up to two weapons: you can't be disarmed of them and can summon one to your hand as a bonus action."}
    ]}},
    {name:"Echo Knight", blurb:"Conjures a duplicate from a parallel timeline to fight alongside you.", features:{
      3:[
        {name:"Manifest Echo", text:"As a bonus action, create an echo — a translucent, silvery image of yourself — within 15 feet of you. It shares your AC and saving throw bonuses, has 1 HP, immunity to all conditions, and vanishes if it takes any damage. You can use a bonus action to move it up to 30 feet. Once per turn when you take the Attack action you can make one of the attacks originating from the echo's position. As a reaction when a creature you can see within 5 feet of the echo moves at least 5 feet away from it, you can make an opportunity attack from the echo's position."},
        {name:"Unleash Incarnation", text:"When you take the Attack action you can make one additional melee attack from your echo's position. You can use this a number of times equal to your Constitution modifier (minimum 1), and you regain all expended uses on a long rest."}
      ],
      7:[
        {name:"Echo Avatar", text:"As an action, temporarily transfer your consciousness to your echo for up to 10 minutes. During this time you can see and hear through the echo, you are blinded and deafened in your own body, and you can move the echo up to 30 feet on each of your turns without using a bonus action. You can end this early as a bonus action."},
        {name:"Shadow Martyr", text:"As a reaction when an ally you can see is hit by an attack and is within 5 feet of your echo, you can cause the echo to take the hit instead. It is then destroyed."}
      ],
      10:[
        {name:"Reclaim Potential", text:"When your echo is destroyed (not when you choose to dismiss it), you can gain temporary hit points equal to 2d6 + your Constitution modifier. You can use this a number of times equal to your Constitution modifier (minimum 1), and you regain all uses on a long rest."},
        {name:"Legion of One", text:"You can now have two echoes active at the same time. Each must be within 15 feet of you or within 15 feet of each other when created. Each functions identically to a single echo, but only one can be moved with your bonus action per turn. Unleash Incarnation attacks can originate from either echo."}
      ],
      18:[
        {name:"Glorious Echo", text:"Your echo now has a number of hit points equal to half your fighter level instead of 1 HP. Whenever your echo is destroyed, you can immediately create a new echo as part of the same reaction or bonus action (no additional action cost), once per turn."}
      ]
    }},
    {name:"Rune Knight", blurb:"Channels giant magic through runes carved into weapons and armor.", features:{
      3:[
        {name:"Bonus Proficiencies", text:"You gain proficiency with smith's tools and learn to read, write and speak Giant."},
        {name:"Rune Carving", text:"Learn two runes of your choice (Cloud, Stone, Fire, Frost, Hill or Storm). Each grants a passive benefit and an active ability. You can invoke a rune's active ability once per short or long rest, and you know one additional rune at levels 7, 10 and 15."},
        {name:"Giant's Might", text:"As a bonus action, channel giant magic for 1 minute: grow one size category larger (and your equipment grows with you), deal +1d6 damage on weapon and unarmed attacks, and gain advantage on Strength checks and saves. Uses equal to your proficiency bonus per long rest."}
      ],
      7:[{name:"Runic Shield", text:"As a reaction when a creature you can see within 60 feet is hit by an attack roll, force the attacker to reroll and use the new result. Uses equal to your proficiency bonus per long rest."}],
      10:[{name:"Great Stature", text:"Your runes permanently enlarge you: gain 3d4 inches of height, and Giant's Might deals +1d8 damage instead of +1d6."}],
      15:[{name:"Master of Runes", text:"You can invoke each of your runes twice per short or long rest instead of once."}],
      18:[{name:"Runic Juggernaut", text:"While Giant's Might is active you can grow to Huge size (10 ft space, 15 ft reach) and deal +1d10 damage instead of the earlier bonus."}]
    }},
    {name:"Cavalier", blurb:"A mounted warrior who excels at protecting allies and controlling enemies.", features:{
      3:[
        {name:"Bonus Proficiency", text:"Gain proficiency in one of Animal Handling, History, Insight, Performance or Persuasion."},
        {name:"Born to the Saddle", text:"Mounting or dismounting costs only 5 feet of movement. Advantage on saving throws to avoid falling off a mount. If you fall off, land on your feet if not incapacitated."},
        {name:"Unwavering Mark", text:"When you hit a creature with a melee attack, mark it until the end of your next turn. While marked: the target has disadvantage on attacks against anyone but you, and if it attacks someone else you can make one melee attack against it as a bonus action (with advantage). Uses equal to STR modifier (min 1) per long rest."}
      ],
      7:[{name:"Warding Maneuver", text:"As a reaction when you or a creature within 5 feet is hit, roll a d8 and add it to the target's AC for that attack; if it still hits the creature takes half damage. Uses equal to CON modifier (min 1) per long rest."}],
      10:[{name:"Hold the Line", text:"Creatures provoke opportunity attacks from you when they move 5 feet or more within your reach, and if you hit the creature its speed drops to 0 for the rest of the turn."}],
      15:[{name:"Ferocious Charger", text:"When you move at least 10 feet toward a creature and hit it with a melee attack, it must succeed on a Strength save (DC 8 + proficiency + STR) or be knocked prone. Use this once per turn."}],
      18:[{name:"Vigilant Defender", text:"Whenever a creature makes an opportunity attack against you, make an opportunity attack against it as a reaction."}]
    }},
    {name:"Samurai", blurb:"A disciplined warrior whose unyielding will powers devastating strikes.", features:{
      3:[
        {name:"Bonus Proficiency", text:"Gain proficiency in History, Insight, Performance or Persuasion (your choice), or learn one language of your choice."},
        {name:"Fighting Spirit", text:"As a bonus action, give yourself advantage on all weapon attack rolls until the end of the current turn, and gain 5 temporary HP (increasing to 10 at level 10 and 15 at level 15). Uses 3 per long rest."}
      ],
      7:[{name:"Elegant Courtier", text:"Add your Wisdom modifier to Persuasion checks. Advantage on saving throws against being frightened."}],
      10:[{name:"Tireless Spirit", text:"At the start of combat if you have no uses of Fighting Spirit left, regain one use."}],
      15:[{name:"Rapid Strike", text:"When you have advantage on a weapon attack, forgo it to make one additional weapon attack as a bonus action this turn (once per turn)."}],
      18:[{name:"Strength Before Death", text:"When damage reduces you to 0 HP but doesn't kill you outright, you can delay falling unconscious until the end of your next turn. You immediately take a special turn (after the triggering creature's turn), though you can't regain HP until the start of that turn. If you drop to 0 HP during this turn you die. Once per long rest."}]
    }}
  ],
  "Monk": [
    {name:"Way of the Open Hand", blurb:"Master of unarmed combat.", features:{3:[
      {name:"Open Hand Technique", text:"When you hit with a Flurry of Blows attack you can knock the target prone, push it 15 feet, or stop it taking reactions."}
    ]}},
    {name:"Way of Shadow", blurb:"A ninja who uses darkness and stealth.", features:{3:[
      {name:"Shadow Arts", text:"Spend 2 ki to cast Darkness, Darkvision, Pass without Trace or Silence. You also learn the Minor Illusion cantrip."}
    ]}},
    {name:"Way of the Four Elements", blurb:"Channels ki into elemental magic.", features:{3:[
      {name:"Disciple of the Elements", text:"Learn Elemental Attunement and one more elemental discipline (e.g. Fangs of the Fire Snake, Water Whip) fuelled by ki."}
    ]}},
    {name:"Way of Mercy", blurb:"Heals allies and harvests life force from enemies with mysterious techniques.", features:{
      3:[
        {name:"Implements of Mercy", text:"Gain proficiency in Insight and Medicine, and gain a special mask you must wear to use this subclass's features."},
        {name:"Hand of Harm", text:"Once per turn when you hit with an unarmed strike, spend 1 ki to deal extra necrotic damage equal to 1d6 + your Wisdom modifier and possibly poison the target (Constitution save or poisoned until the end of your next turn)."},
        {name:"Hand of Healing", text:"As an action, spend 1 ki to restore HP to a creature you touch equal to a roll of your Martial Arts die + Wisdom modifier. You can also end one disease or one of: blinded, deafened, paralyzed, poisoned or stunned on the creature."}
      ],
      6:[{name:"Physician's Touch", text:"Hand of Healing can also end one effect from a broader list, and Hand of Harm can also impose the poisoned condition without an extra ki cost."}],
      11:[{name:"Flurry of Healing and Harm", text:"With Flurry of Blows you can replace either unarmed strike with a Hand of Healing (no ki cost) or a Hand of Harm (still costs 1 ki and can only be used once per Flurry)."}],
      17:[{name:"Hand of Ultimate Mercy", text:"Spend 5 ki to cast Raise Dead without material components, targeting a creature dead no longer than 24 hours. You can use this once per long rest."}]
    }},
    {name:"Way of the Kensei", blurb:"Treats weapons as an extension of the body, mastering them as art.", features:{
      3:[
        {name:"Path of the Kensei", text:"Choose two weapons (one melee, one ranged) as kensei weapons; you gain proficiency with them, they count as monk weapons, and you can use them with Martial Arts. Agile Parry: +2 AC if your kensei melee weapon is in hand and you use your unarmed strike bonus action that turn."},
        {name:"Kensei's Shot", text:"Use a bonus action to make ranged kensei weapon attacks deal +1d4 damage on hit this turn."}
      ],
      6:[{name:"One with the Blade", text:"Your kensei attacks count as magical. Magic Kensei Weapons: when you hit with a kensei weapon, spend 1 ki to deal +1d6 damage of the weapon's type."}],
      11:[{name:"Sharpen the Blade", text:"As a bonus action, spend up to 3 ki to give your kensei weapon a bonus to attack and damage rolls equal to the ki spent (+1 to +3) for 1 minute. Has no effect if the weapon already has a magical bonus."}],
      17:[{name:"Unerring Accuracy", text:"Once on each of your turns, if you miss with a monk weapon attack, reroll the attack roll (you can use the result)."}]
    }},
    {name:"Way of the Astral Self", blurb:"Manifests a spectral astral form to amplify attacks and awareness.", features:{
      3:[{name:"Arms of the Astral Self", text:"Spend 1 ki (bonus action) to summon spectral arms for 10 minutes. They let you use WIS instead of STR or DEX for unarmed strikes, deal 1d6 (1d8 at level 11) force damage, count as monk weapons, and have a reach of 5 feet. When summoned, deal 2 unarmed strikes to up to two creatures within 10 feet."}],
      6:[{name:"Visage of the Astral Self", text:"Spend 1 ki (bonus action) to summon a spectral visage for 10 minutes. Gain darkvision 120 ft, advantage on WIS (Insight) and CHA (Intimidation) checks, and understand all spoken languages. You can speak and be understood in any language."}],
      11:[{name:"Body of the Astral Self", text:"When arms and visage are both active, spectral body armor appears. Gain resistance to bludgeoning, piercing and slashing damage, and when a creature within 10 feet hits you with an attack you can use your reaction to deal force damage equal to 3d10."}],
      17:[{name:"Awakened Astral Self", text:"Spend 5 ki (bonus action) to empower your astral form for 10 minutes: arms deal +2d6 force damage on each hit, you gain a flying speed equal to your walking speed, and you can cast Banishment (save DC = ki save DC) once per activation without expending a spell slot."}]
    }}
  ],
  "Paladin": [
    {name:"Oath of Devotion", blurb:"The classic knight in shining armor.", features:{
      3:[
        {name:"Oath Spells", text:"You always have Protection from Evil and Good and Sanctuary prepared."},
        {name:"Channel Divinity", text:"Once per short or long rest: Sacred Weapon (add CHA to attack rolls for 1 minute) or Turn the Unholy (fiends and undead must flee)."}
      ],
      5:[{name:"Oath Spells", replaces:"Oath Spells", text:"You always have Protection from Evil and Good, Sanctuary, Lesser Restoration and Zone of Truth prepared."}]
    }},
    {name:"Oath of the Ancients", blurb:"Protects light and life in the world.", features:{
      3:[
        {name:"Oath Spells", text:"You always have Ensnaring Strike and Speak with Animals prepared."},
        {name:"Channel Divinity", text:"Once per short or long rest: Nature's Wrath (restrain a creature with vines) or Turn the Faithless (fey and fiends must flee)."}
      ],
      5:[{name:"Oath Spells", replaces:"Oath Spells", text:"You always have Ensnaring Strike, Speak with Animals, Moonbeam and Misty Step prepared."}]
    }},
    {name:"Oath of Vengeance", blurb:"Punishes wrongdoers at any cost.", features:{
      3:[
        {name:"Oath Spells", text:"You always have Bane and Hunter's Mark prepared."},
        {name:"Channel Divinity", text:"Once per short or long rest: Abjure Enemy (frighten one creature) or Vow of Enmity (advantage on attacks against one creature for 1 minute)."}
      ],
      5:[{name:"Oath Spells", replaces:"Oath Spells", text:"You always have Bane, Hunter's Mark, Hold Person and Misty Step prepared."}]
    }},
    {name:"Oath of Conquest", blurb:"Rules through fear and iron will — break the enemy's spirit.", features:{
      3:[
        {name:"Oath Spells", text:"You always have Armor of Agathys and Command prepared; they don't count against your prepared spells."},
        {name:"Channel Divinity", text:"Once per short or long rest: Conquering Presence (each creature you choose within 30 feet must succeed on a Wisdom save or be frightened of you for 1 minute) or Guided Strike (+10 to one attack roll, declared after seeing the roll but before knowing the result)."}
      ],
      5:[{name:"Oath Spells", replaces:"Oath Spells", text:"You always have Armor of Agathys, Command, Hold Person and Spiritual Weapon prepared."}],
      7:[{name:"Aura of Conquest", text:"While you're not incapacitated, frightened creatures within 10 feet of you can't move and take psychic damage equal to half your paladin level at the start of each of their turns. Extends to 30 feet at level 18."}],
      9:[{name:"Oath Spells", replaces:"Oath Spells", text:"You always have Armor of Agathys, Command, Hold Person, Spiritual Weapon, Bestow Curse and Fear prepared."}],
      15:[{name:"Scornful Rebuke", text:"Whenever a creature hits you with an attack while you are not incapacitated, it takes psychic damage equal to your Charisma modifier (minimum 1)."}],
      20:[{name:"Invincible Conqueror", text:"For 1 minute (once per long rest): resistance to all damage, extra attack when you take the Attack action, and critical hits on 19–20."}]
    }},
    {name:"Oathbreaker", blurb:"A fallen paladin who abandoned their oath and turned to darkness.", features:{
      3:[
        {name:"Oathbreaker Spells", text:"You always have Hellish Rebuke and Inflict Wounds prepared; they don't count against your prepared spells."},
        {name:"Channel Divinity", text:"Once per short or long rest: Control Undead (a target undead within 30 feet makes a Wisdom save or obeys your commands for 24 hours) or Dreadful Aspect (each creature of your choice within 30 feet must succeed on a Wisdom save or be frightened of you for 1 minute)."}
      ],
      5:[{name:"Oathbreaker Spells", replaces:"Oathbreaker Spells", text:"You always have Hellish Rebuke, Inflict Wounds, Crown of Madness and Darkness prepared."}],
      7:[{name:"Aura of Hate", text:"You and friendly fiends and undead within 10 feet add your Charisma modifier to melee weapon damage. Extends to 30 feet at level 18."}],
      9:[{name:"Oathbreaker Spells", replaces:"Oathbreaker Spells", text:"You always have Hellish Rebuke, Inflict Wounds, Crown of Madness, Darkness, Animate Dead and Bestow Curse prepared."}],
      15:[{name:"Supernatural Resistance", text:"Resistance to bludgeoning, piercing and slashing damage from nonmagical weapons."}],
      20:[{name:"Dread Lord", text:"For 1 minute (once per long rest): create a 30-foot aura of gloom — dim light, disadvantage on saves against being frightened, shadowy duplicates attack frightened creatures (3d10 psychic), and melee attacks deal +3d10 psychic on a failed Wisdom save."}]
    }},
    {name:"Oath of Redemption", blurb:"Seeks to reform the wicked through peace, mercy and patience.", features:{
      3:[
        {name:"Oath Spells", text:"You always have Sanctuary and Sleep prepared; they don't count against your prepared spells."},
        {name:"Channel Divinity", text:"Once per short or long rest: Emissary of Peace (+5 to Persuasion checks for 10 minutes) or Rebuke the Violent (when a creature within 30 feet deals damage to a third party, the attacker must make a Wisdom save or take radiant damage equal to the damage dealt)."}
      ],
      5:[{name:"Oath Spells", replaces:"Oath Spells", text:"You always have Sanctuary, Sleep, Calm Emotions and Hold Person prepared."}],
      7:[{name:"Aura of the Guardian", text:"When another creature within 10 feet takes damage, use your reaction to take that damage yourself instead. Extends to 30 feet at level 18."}],
      9:[{name:"Oath Spells", replaces:"Oath Spells", text:"You always have Sanctuary, Sleep, Calm Emotions, Hold Person, Counterspell and Hypnotic Pattern prepared."}],
      15:[{name:"Protective Spirit", text:"At the end of your turn if you have fewer than half your max HP and are not incapacitated, regain HP equal to 1d6 + half your paladin level."}],
      20:[{name:"Emissary of Redemption", text:"Resistance to all damage dealt by creatures. When a creature hits you with an attack, it takes radiant damage equal to half the damage it dealt. Both effects end for a creature if you attack it, deal damage to it or force it to make a saving throw."}]
    }}
  ],
  "Ranger": [
    {name:"Hunter", blurb:"Specialist monster slayer.", features:{3:[
      {name:"Hunter's Prey", text:"Choose one: Colossus Slayer (+1d8 once per turn against a wounded target), Giant Killer (reaction attack against a Large foe that attacks you) or Horde Breaker (extra attack against a second adjacent enemy)."}
    ]}},
    {name:"Beast Master", blurb:"Fights alongside an animal companion.", features:{3:[
      {name:"Ranger's Companion", text:"Gain a beast companion (CR 1/4 or lower). It obeys your commands; use your action to have it attack."}
    ]}},
    {name:"Gloom Stalker", blurb:"An ambusher at home in the dark.", features:{
      3:[
        {name:"Dread Ambusher", text:"Add WIS to initiative. On your first turn of combat, +10 ft speed and one extra attack that deals +1d8 damage."},
        {name:"Umbral Sight", text:"Darkvision 60 ft (or +30 ft), and you're invisible to creatures relying on darkvision to see you in the dark."},
        {name:"Gloom Stalker Magic", text:"You always know Disguise Self; it doesn't count against your ranger spells known."}
      ],
      5:[{name:"Gloom Stalker Magic", replaces:"Gloom Stalker Magic", text:"You always know Disguise Self and Rope Trick; they don't count against your ranger spells known."}]
    }},
    {name:"Fey Wanderer", blurb:"Channels the magic and mystique of the Feywild to charm and bewilder.", features:{
      3:[
        {name:"Dreadful Strikes", text:"When you hit a creature with a weapon attack, deal an extra 1d4 psychic damage (once per turn). Increases to 1d6 at level 11."},
        {name:"Fey Wanderer Magic", text:"You always know Charm Person and it doesn't count against your ranger spells known. You learn additional spells at levels 5, 9, 13 and 17 (Misty Step, Dispel Magic, Dimension Door, Mislead)."},
        {name:"Otherworldly Glamour", text:"Add your Wisdom modifier to Charisma checks. Gain proficiency in Deception, Performance or Persuasion (your choice)."}
      ],
      7:[{name:"Beguiling Twist", text:"Advantage on saves against being charmed or frightened. When a creature you can see within 120 feet succeeds on a save against being charmed or frightened, use your reaction to impose that condition on a different creature within 120 feet (Wisdom save negates, lasts 1 minute)."}],
      11:[{name:"Fey Reinforcements", text:"Once per long rest, cast Summon Fey without a spell slot. You can also cast it with a spell slot, and it doesn't count against your spells known."}],
      15:[{name:"Misty Wanderer", text:"Cast Misty Step without expending a spell slot a number of times equal to your Wisdom modifier per long rest. When you cast it, take up to 5 willing creatures with you."}]
    }},
    {name:"Horizon Walker", blurb:"Guards the boundaries between planes and hunts extraplanar threats.", features:{
      3:[
        {name:"Detect Portal", text:"As an action, sense the distance and direction to the nearest planar portal within 1 mile. Once per short or long rest."},
        {name:"Horizon Walker Magic", text:"You always know Protection from Evil and Good; it doesn't count against your ranger spells known. You learn additional spells at levels 5, 9, 13 and 17 (Misty Step, Haste, Banishment, Teleportation Circle)."},
        {name:"Planar Warrior", text:"As a bonus action before attacking, choose a target. The first hit that turn deals +1d8 force damage and the attack's normal damage becomes force. Increases to +2d8 at level 11."}
      ],
      7:[{name:"Ethereal Step", text:"At the start of your turn, bonus action to cast Etherealness (affects only you) until the end of that turn. Once per short or long rest."}],
      11:[{name:"Distant Strike", text:"When you take the Attack action, teleport up to 10 feet before each attack. If you attack two different creatures on that turn, make one extra attack against a third creature."}],
      15:[{name:"Spectral Defense", text:"When a creature hits you with an attack, use your reaction to give yourself resistance to all damage from that attack."}]
    }},
    {name:"Drakewarden", blurb:"Bonds with a drake companion that grows into a fearsome mount.", features:{
      3:[
        {name:"Draconic Gift", text:"You learn the Draconic language and the Thaumaturgy cantrip."},
        {name:"Drake Companion", text:"As an action, summon your drake in an unoccupied space within 30 feet. It acts on your initiative with its own turn; use a bonus action to command it to Maul (melee attack) or move. It has AC 14 + proficiency, HP equal to five times your ranger level, and deals 1d6 piercing + proficiency bonus damage. If it dies, resummon it after a long rest (or expend a spell slot to do so after 1 hour)."}
      ],
      7:[{name:"Bond of Fang and Scale", text:"Your drake can now be ridden as a mount (your size or smaller). It gains resistance to one damage type linked to its color (acid, cold, fire, lightning or poison). When you cast a spell targeting only yourself while mounted on it, you can also affect the drake."}],
      11:[{name:"Drake's Breath", text:"As an action, cause your drake (or yourself if it's not summoned) to exhale a 30-foot cone dealing 8d6 damage of the drake's chosen type (Dex save for half). Once per long rest, or expend a spell slot to use again."}],
      15:[{name:"Perfected Bond", text:"Your drake grows to Large size, can fly at its walking speed, and when it hits with its Maul attack you can use your reaction to make one weapon attack."}]
    }}
  ],
  "Rogue": [
    {name:"Thief", blurb:"A burglar and treasure hunter.", features:{3:[
      {name:"Fast Hands", text:"Your Cunning Action can also make a Sleight of Hand check, use thieves' tools, or take the Use an Object action."},
      {name:"Second-Story Work", text:"Climbing costs no extra movement, and your running jumps go further by your DEX modifier in feet."}
    ]}},
    {name:"Assassin", blurb:"Deadly in the first moments of a fight.", features:{3:[
      {name:"Bonus Proficiencies", text:"Proficiency with the disguise kit and the poisoner's kit."},
      {name:"Assassinate", text:"Advantage on attacks against creatures that haven't acted yet in combat, and any hit against a surprised creature is a critical hit."}
    ]}},
    {name:"Arcane Trickster", blurb:"Enhances stealth and trickery with illusion and enchantment magic.", casterType:"third", spellAbility:"int", features:{3:[
      {name:"Spellcasting", text:"You learn Mage Hand plus two other wizard cantrips and three 1st-level wizard spells (mostly enchantment and illusion), cast with Intelligence."},
      {name:"Mage Hand Legerdemain", text:"Your Mage Hand is invisible and can stow or pick objects from others and use thieves' tools."}
    ]}},
    {name:"Swashbuckler", blurb:"A daring duelist who fights with flair and wins with charm.", features:{
      3:[
        {name:"Fancy Footwork", text:"After making a melee attack against a creature during your turn, that creature can't make opportunity attacks against you for the rest of the turn."},
        {name:"Rakish Audacity", text:"Add your Charisma modifier to your initiative. You can use Sneak Attack if no other creatures are within 5 feet of you (even without advantage), as long as you don't have disadvantage on the roll."}
      ],
      9:[{name:"Panache", text:"As an action, make a Persuasion check contested by a creature's Insight. On a success, a hostile creature is charmed (disadvantage on attacks against anyone but you, can't opportunity-attack you) for 1 minute, or a non-hostile creature is charmed for 1 hour."}],
      13:[{name:"Elegant Maneuver", text:"On your turn, use a bonus action to gain advantage on the next Acrobatics or Athletics check you make before the end of your turn."}],
      17:[{name:"Master Duelist", text:"Once per short or long rest, if you miss with an attack roll you can reroll it with advantage."}]
    }},
    {name:"Soulknife", blurb:"Focuses psionic energy into blades of psychic power.", features:{
      3:[
        {name:"Psionic Power", text:"You have a pool of Psionic Energy dice (d6, increasing to d8 at level 5 and d10 at level 11). Regain one die on a short rest; regain all on a long rest. Pool size equals twice your proficiency bonus."},
        {name:"Psychic Blades", text:"As part of an attack you can manifest a psychic blade from your free hand (1d6 psychic, finesse, thrown 60 ft, vanishes after). Draw-and-throw as one object interaction. As a bonus action, manifest a second blade for an off-hand attack; add your ability modifier to the damage."}
      ],
      9:[{name:"Soul Blades", text:"Homing Strikes: spend 1 Psionic die after missing an attack to add the roll to the attack (may turn the miss into a hit). Psychic Teleportation: bonus action to spend 1 Psionic die and teleport up to 10 × the roll in feet to an unoccupied space you can see."}],
      13:[{name:"Psychic Veil", text:"Cast Invisibility on yourself without a spell slot or components (lasts 1 hour or until you attack, deal damage or force a save). Regained after a long rest, or spend 1 Psionic die to use again."}],
      17:[{name:"Rend Mind", text:"When you use Sneak Attack against a creature, spend 3 Psionic dice to force a Wisdom save (DC 8 + proficiency + DEX) or the creature is stunned until the end of your next turn."}]
    }},
    {name:"Phantom", blurb:"Flirts with death, drawing power from the boundary between life and undeath.", features:{
      3:[
        {name:"Whispers of the Dead", text:"After each short or long rest, gain proficiency in one skill or tool of your choice, chosen from a whisper of the dead."},
        {name:"Wails from the Grave", text:"When you deal Sneak Attack damage to a creature, choose a second creature within 30 feet; it takes half as much necrotic damage as the Sneak Attack dealt (rounded down). Uses equal to your proficiency bonus per long rest."}
      ],
      9:[{name:"Tokens of the Departed", text:"When a creature you can see dies within 30 feet, capture its soul in a Tiny object (Soul Trinket, max proficiency bonus at once). While holding a trinket: advantage on death saves and Constitution checks, and ask one question of the soul (once per trinket). Can destroy a trinket to regain one Wails from the Grave use."}],
      13:[{name:"Ghost Walk", text:"Spend one Soul Trinket to assume Ghost Walk (bonus action) for 10 minutes: fly 10 ft (hover), pass through creatures and objects (3d10 force damage if you end your turn inside one), and attacks against you have disadvantage."}],
      17:[{name:"Death's Friend", text:"Wails from the Grave now also deals necrotic damage to the original target. Soul Trinkets replenish one per long rest if you have none."}]
    }},
    {name:"Scout", blurb:"An expert skirmisher and survivalist who strikes from range and keeps moving.", features:{
      3:[
        {name:"Skirmisher", text:"When a creature ends its turn within 5 feet of you, use your reaction to move up to half your speed without provoking opportunity attacks."},
        {name:"Survivalist", text:"Gain proficiency in Nature and Survival, and double your proficiency bonus for checks with either skill."}
      ],
      9:[{name:"Superior Mobility", text:"Your walking speed increases by 10 feet. If you have a climbing or swimming speed, those also increase by 10 feet."}],
      13:[{name:"Ambush Master", text:"You have advantage on initiative rolls. The first creature you hit on your first turn of combat becomes easier to hit: attack rolls against it have advantage until the start of your next turn."}],
      17:[{name:"Sudden Strike", text:"On your turn you can make one additional attack as a bonus action; this attack can trigger Sneak Attack even if you've already used it this turn (but only once per turn regardless)."}]
    }}
  ],
  "Sorcerer": [
    {name:"Draconic Bloodline", blurb:"Dragon blood grants toughness and elemental power.", features:{1:[
      {name:"Dragon Ancestor", text:"Choose a dragon type (sets your damage type later). You speak Draconic and double your proficiency bonus on Charisma checks with dragons."},
      {name:"Draconic Resilience", text:"Your max HP increases by 1 per sorcerer level, and without armor your AC is 13 + DEX modifier. (Already added to your max HP and AC.)"}
    ]}},
    {name:"Wild Magic", blurb:"Chaotic magic that surges unpredictably.", features:{1:[
      {name:"Wild Magic Surge", text:"When you cast a leveled sorcerer spell, the DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table."},
      {name:"Tides of Chaos", text:"Gain advantage on one attack roll, ability check or save. Regained on a long rest (or when a surge happens)."}
    ]}},
    {name:"Clockwork Soul", blurb:"Draws power from Mechanus to impose order and nullify chaos.", features:{
      1:[
        {name:"Clockwork Magic", text:"You learn additional spells that don't count against your spells known: Alarm and Protect from Evil and Good (1st), Aid and Lesser Restoration (3rd), Dispel Magic and Protection from Energy (5th), Freedom of Movement and Summon Construct (7th), Greater Restoration and Wall of Force (9th)."},
        {name:"Restore Balance", text:"When a creature within 60 feet is about to roll with advantage or disadvantage, use your reaction to prevent that roll from having either. Uses equal to your proficiency bonus per long rest."}
      ],
      6:[{name:"Bastion of Law", text:"As an action, expend 1–5 sorcery points to create a magical ward on a creature you touch, giving it a number of d8s equal to the points spent. When it takes damage, expend any number of those dice and reduce the damage by the total rolled. The ward lasts until you finish a long rest or use it again."}],
      14:[{name:"Trance of Order", text:"As a bonus action, enter a state of clockwork consciousness for 1 minute: attacks against you can't benefit from advantage, and on each of your turns you can treat a d20 roll of 9 or lower as a 10. Once per long rest."}],
      18:[{name:"Clockwork Cavalcade", text:"Briefly summon spirits of order to restore balance. In a 30-foot cube originating from you: repair up to 4 objects of your choice, end every spell of 6th level or lower on creatures and objects, remove all curses and disease and poisons from creatures. Once per long rest."}]
    }},
    {name:"Aberrant Mind", blurb:"Touched by a psionic entity, warping mind and body with alien power.", features:{
      1:[
        {name:"Psionic Spells", text:"You learn additional spells that don't count against your spells known: Arms of Hadar and Dissonant Whispers (1st), Calm Emotions and Detect Thoughts (3rd), Hunger of Hadar and Sending (5th), Evard's Black Tentacles and Summon Aberration (7th), Modify Memory and Rary's Telepathic Bond (9th)."},
        {name:"Telepathic Speech", text:"As a bonus action, form a telepathic connection with a creature you can see within 30 feet for a number of minutes equal to your sorcerer level. The connection ends early if you are incapacitated, die or use this feature again."}
      ],
      6:[{name:"Psionic Sorcery", text:"When you cast any of your Psionic Spells, you can cast it by expending a spell slot as normal or by spending sorcery points equal to the spell's level. If you use sorcery points, the spell requires no verbal or somatic components."}],
      14:[{name:"Revelation in Flesh", text:"As a bonus action, spend 1 or more sorcery points (up to 4) to gain one benefit per point spent for 10 minutes: see invisible creatures within 60 ft, resistance to psychic damage, fly at your walking speed (hover), and swim at your walking speed (breathe water). Once per long rest."}],
      18:[{name:"Warping Implosion", text:"As an action, teleport to an unoccupied space you can see within 120 feet. Each creature within 30 feet of your origin must succeed on a Strength save or take 3d10 force damage and be pulled to the nearest unoccupied space to your destination. Once per long rest, or spend 5 sorcery points to use again."}]
    }},
    {name:"Divine Soul", blurb:"Bears a divine spark that grants access to cleric spells alongside sorcery.", features:{
      1:[
        {name:"Divine Magic", text:"Choose an affinity (Good, Evil, Law, Chaos or Neutrality). You learn a bonus spell from the cleric list based on your affinity (e.g. Cure Wounds for Good) and can pick cleric spells when you learn new sorcerer spells. Your bonus spells don't count against your spells known."},
        {name:"Favored by the Gods", text:"When you fail a saving throw or miss with an attack roll, add 2d4 to the total (possibly turning the miss into a hit). Once per short or long rest."}
      ],
      6:[{name:"Empowered Healing", text:"Once per turn when you or an ally within 5 feet rolls dice to restore HP with a spell, you can spend 1 sorcery point to reroll any number of those dice (you must use the new rolls)."}],
      14:[{name:"Otherworldly Wings", text:"As a bonus action, manifest spectral wings giving you a flying speed of 30 feet. The wings last until you dismiss them (no action) or become incapacitated."}],
      18:[{name:"Unearthly Recovery", text:"As a bonus action when you have fewer than half your maximum HP remaining, regain HP equal to half your HP maximum. Once per long rest."}]
    }},
    {name:"Shadow Magic", blurb:"Born of shadow — draws on the Shadowfell for dark and terrifying power.", features:{
      1:[
        {name:"Eyes of the Dark", text:"Darkvision 120 feet. At level 3 you also learn Darkness and can cast it by spending 2 sorcery points without needing concentration (you can see through the darkness it creates)."},
        {name:"Strength of the Grave", text:"When damage would drop you to 0 HP, make a Charisma save (DC 5 + the damage dealt). On a success, drop to 1 HP instead. Doesn't work against radiant damage or a critical hit. Once per long rest."}
      ],
      6:[{name:"Hound of Ill Omen", text:"As a bonus action, spend 3 sorcery points to summon a howling shadow hound targeting a creature within 120 feet you can see. It appears adjacent to the target, moves and attacks independently (uses your spell save DC), has half your max HP, and the target has disadvantage on saves against your spells while within 5 feet of the hound. The hound disappears after 5 minutes."}],
      14:[{name:"Shadow Walk", text:"When you are in dim light or darkness, as a bonus action teleport up to 120 feet to an unoccupied space you can see that is also in dim light or darkness."}],
      18:[{name:"Umbral Form", text:"As a bonus action, spend 6 sorcery points to transform for 1 minute: resistance to all damage except force and radiant, pass through other creatures and objects as difficult terrain (take 1d10 force damage if you end your turn inside an object), and become immune to the grappled and restrained conditions."}]
    }}
  ],
  "Warlock": [
    {name:"The Fiend", blurb:"A pact with a devil or demon.", features:{1:[
      {name:"Expanded Spell List", text:"These are added to the warlock spells you can learn: Burning Hands and Command (1st level), Blindness/Deafness and Scorching Ray (2nd, from warlock level 3), Fireball and Stinking Cloud (3rd, from warlock level 5)."},
      {name:"Dark One's Blessing", text:"When you drop a hostile creature to 0 HP, gain temporary HP equal to your CHA modifier + warlock level."}
    ]}},
    {name:"The Archfey", blurb:"A pact with a lord or lady of the fey.", features:{1:[
      {name:"Expanded Spell List", text:"These are added to the warlock spells you can learn: Faerie Fire and Sleep (1st level), Calm Emotions and Phantasmal Force (2nd, from warlock level 3), Blink and Plant Growth (3rd, from warlock level 5)."},
      {name:"Fey Presence", text:"Action: each creature in a 10-foot cube around you must pass a Wisdom save or be charmed or frightened until the end of your next turn. Once per short or long rest."}
    ]}},
    {name:"The Great Old One", blurb:"A pact with an unknowable alien entity.", features:{1:[
      {name:"Expanded Spell List", text:"These are added to the warlock spells you can learn: Dissonant Whispers and Tasha's Hideous Laughter (1st level), Detect Thoughts and Phantasmal Force (2nd, from warlock level 3), Clairvoyance and Sending (3rd, from warlock level 5)."},
      {name:"Awakened Mind", text:"Speak telepathically to any creature you can see within 30 feet."}
    ]}},
    {name:"The Hexblade", blurb:"A pact forged with a sentient weapon from the Shadowfell.", features:{
      1:[
        {name:"Expanded Spell List", text:"These are added to the warlock spells you can learn: Shield and Wrathful Smite (1st level), Blur and Branding Smite (2nd, from warlock level 3), Blink and Elemental Weapon (3rd, from warlock level 5)."},
        {name:"Hexblade's Curse", text:"As a bonus action, curse a creature within 30 feet for 1 minute. Against it: add your proficiency bonus to damage, score criticals on 19–20, and regain HP equal to your warlock level + CHA modifier when it dies. Uses equal to your proficiency bonus per long rest."},
        {name:"Hex Warrior", text:"Proficiency with medium armor, shields and martial weapons. Choose one weapon you're holding after a long rest: use your Charisma modifier for its attack and damage rolls. If it's a pact weapon this applies to all pact weapons automatically."}
      ],
      6:[{name:"Accursed Specter", text:"When you slay a humanoid, you can curse its spirit to rise as a specter under your control for 24 hours or until you use this feature again. It adds your CHA modifier to its attack bonus and has temporary HP equal to half your warlock level. Once per long rest."}],
      10:[{name:"Armor of Hexes", text:"When the target of your Hexblade's Curse hits you with an attack roll, roll a d6. On a 4 or higher the attack instead misses you regardless of the roll."}],
      14:[{name:"Master of Hexes", text:"When the target of your Hexblade's Curse dies, you can move the curse to a new creature within 30 feet (no action required). You don't regain HP from the old target's death."}]
    }},
    {name:"The Celestial", blurb:"A pact with a powerful being of the Upper Planes.", features:{
      1:[
        {name:"Expanded Spell List", text:"These are added to the warlock spells you can learn: Cure Wounds and Guiding Bolt (1st level), Flaming Sphere and Lesser Restoration (2nd, from warlock level 3), Daylight and Revivify (3rd, from warlock level 5)."},
        {name:"Bonus Cantrips", text:"You learn the Light and Sacred Flame cantrips; they don't count against your cantrips known."},
        {name:"Healing Light", text:"A pool of d6s equal to 1 + your warlock level. As a bonus action, heal a creature within 60 feet by spending dice from the pool (max CHA modifier dice per turn). Replenish the pool on a long rest."}
      ],
      6:[{name:"Radiant Soul", text:"Resistance to radiant damage. When you cast a spell that deals radiant or fire damage, add your CHA modifier to one radiant or fire damage roll."}],
      10:[{name:"Celestial Resilience", text:"Gain temporary HP equal to your warlock level + CHA modifier when you finish a short or long rest. Five creatures you can see also gain temporary HP equal to half that amount."}],
      14:[{name:"Searing Vengeance", text:"When you or an ally within 60 feet would make a death saving throw, you can instead have them regain HP equal to half their max HP and stand up. Each creature of your choice within 30 feet takes 2d8 + CHA radiant damage and is blinded until the end of their next turn. Once per long rest."}]
    }},
    {name:"The Fathomless", blurb:"A pact with an unfathomable entity of the deep ocean.", features:{
      1:[
        {name:"Expanded Spell List", text:"These are added to the warlock spells you can learn: Create or Destroy Water and Thunderwave (1st level), Gust of Wind and Silence (2nd, from warlock level 3), Lightning Bolt and Sleet Storm (3rd, from warlock level 5)."},
        {name:"Tentacle of the Deeps", text:"As a bonus action, summon a spectral tentacle in a space within 60 feet for 1 minute. When a creature within 10 feet of the tentacle hits you or another creature you can see, use your reaction to deal 1d8 cold damage to the attacker. On your turn (no action), move the tentacle up to 30 feet and have it lash out: melee spell attack, 2d8 cold damage + reduce speed by 10 feet until your next turn. Uses equal to your proficiency bonus per long rest."},
        {name:"Gift of the Sea", text:"You gain a swimming speed of 40 feet and can breathe underwater."}
      ],
      6:[{name:"Oceanic Soul", text:"Resistance to cold damage. You can communicate telepathically with any creature that can breathe water, as long as you share a language and it is within 30 feet."}],
      10:[{name:"Guardian Coil", text:"Your Tentacle of the Deeps can now protect. When you or a creature you can see within 10 feet of the tentacle takes damage, use your reaction to choose one of those creatures: reduce the damage it takes by 1d8."}],
      14:[{name:"Fathomless Plunge", text:"As an action, you and up to five creatures within 30 feet that you choose are teleported to a location you can visualize within 1 mile that is on or in a body of water. Once per short or long rest."}]
    }},
    {name:"The Genie", blurb:"A pact with one of the noble genies of the four elements.", features:{
      1:[
        {name:"Genie's Vessel", text:"Your patron gives you a tiny vessel (a lamp, urn, ring or bottle). As a bonus action, vanish into the vessel for up to 10 minutes while remaining aware of your surroundings; other creatures can enter it (up to your proficiency bonus). The vessel has AC and HP equal to your warlock level + proficiency bonus. If destroyed, a new one appears after 7 days."},
        {name:"Expanded Spell List", text:"Your genie type determines your bonus spells. Dao (earth): Sanctuary and Speak with Animals (1st), Spike Growth and Phantasmal Force (3rd). Djinni (air): Detect Evil and Good and Thunderwave (1st), Gust of Wind and Phantasmal Force (3rd). Efreeti (fire): Burning Hands and Detect Magic (1st), Scorching Ray and Suggestion (3rd). Marid (water): Detect Evil and Good and Fog Cloud (1st), Blur and Silence (3rd)."},
        {name:"Elemental Gift", text:"At the end of a long rest, gain temporary HP equal to your warlock level + CHA modifier. Also gain a damage resistance based on genie type: bludgeoning (Dao), thunder (Djinni), fire (Efreeti) or cold (Marid)."}
      ],
      6:[{name:"Sanctuary Vessel", text:"When you enter your Genie's Vessel, choose up to 5 willing creatures within 30 feet to enter with you. Inside the vessel, creatures can use a short rest in only 10 minutes, and you can expend Hit Dice to heal a creature in the vessel as if it spent them during a short rest."}],
      10:[{name:"Limited Wish", text:"Three times per long rest, speak a wish of up to 6th level to your patron: cast any spell of 6th level or lower from any class spell list (no spell slot, no material components). If it normally requires concentration you must concentrate."}],
      14:[{name:"Genie's Wrath", text:"Once per turn when you hit with an attack roll, deal extra damage based on your genie type: 1d6 bludgeoning (Dao), 1d6 thunder (Djinni), 1d6 fire (Efreeti) or 1d6 cold (Marid)."}]
    }}
  ],
  "Wizard": [
    {name:"School of Evocation", blurb:"Blasts with raw elemental energy.", features:{2:[
      {name:"Evocation Savant", text:"Copying evocation spells into your spellbook costs half the gold and time."},
      {name:"Sculpt Spells", text:"When you cast an evocation spell, choose up to 1 + spell level creatures: they automatically succeed on the save and take no damage."}
    ]}},
    {name:"School of Abjuration", blurb:"Protective wards and dispelling magic.", features:{2:[
      {name:"Abjuration Savant", text:"Copying abjuration spells into your spellbook costs half the gold and time."},
      {name:"Arcane Ward", text:"When you cast an abjuration spell of 1st level or higher, create a ward with HP equal to twice your wizard level + INT modifier that absorbs damage for you."}
    ]}},
    {name:"School of Divination", blurb:"Sees the future and bends fate.", features:{2:[
      {name:"Divination Savant", text:"Copying divination spells into your spellbook costs half the gold and time."},
      {name:"Portent", text:"After each long rest roll two d20s and record them. You can replace any attack roll, save or ability check you see with one of them."}
    ]}},
    {name:"School of Illusion", blurb:"Fools the senses with illusions.", features:{2:[
      {name:"Illusion Savant", text:"Copying illusion spells into your spellbook costs half the gold and time."},
      {name:"Improved Minor Illusion", text:"You learn Minor Illusion (if you didn't know it) and can create both a sound and an image with one casting."}
    ]}},
    {name:"School of Necromancy", blurb:"Commands life, death and undeath.", features:{2:[
      {name:"Necromancy Savant", text:"Copying necromancy spells into your spellbook costs half the gold and time."},
      {name:"Grim Harvest", text:"When you kill a creature with a spell of 1st level or higher, regain HP equal to twice the spell's level (three times for necromancy)."}
    ]}}
  ]
};

/* What to do about spells after reaching a class level; shown in the
   "you unlocked" popup so new players know what to pick. */
export var SPELL_TIPS = {
  "Artificer": {1:"Pick 2 artificer cantrips. You prepare INT modifier + half your artificer level (min 1) spells each day.", 2:"Learn 4 infusions and infuse up to 2 items in the Artifice infusions card on the Features tab.", 5:"2nd-level artificer spells are now available to prepare."},
  "Bard": {1:"Pick 2 bard cantrips and 4 1st-level bard spells.", 2:"Learn 1 new bard spell.", 3:"Learn 1 new bard spell.", 4:"Learn 1 new bard spell and 1 new cantrip.", 5:"Learn 1 new bard spell. 3rd-level spells are now available."},
  "Cleric": {1:"Pick 3 cleric cantrips. You prepare WIS modifier + cleric level spells from the whole cleric list each day.", 3:"2nd-level cleric spells are now available to prepare.", 4:"Learn 1 new cleric cantrip.", 5:"3rd-level cleric spells are now available to prepare."},
  "Druid": {1:"Pick 2 druid cantrips. You prepare WIS modifier + druid level spells from the druid list each day.", 3:"2nd-level druid spells are now available to prepare.", 4:"Learn 1 new druid cantrip.", 5:"3rd-level druid spells are now available to prepare."},
  "Paladin": {2:"You prepare CHA modifier + half your paladin level spells from the paladin list each day.", 5:"2nd-level paladin spells are now available to prepare."},
  "Ranger": {2:"Learn 2 1st-level ranger spells.", 3:"Learn 1 new ranger spell.", 5:"Learn 1 new ranger spell. 2nd-level spells are now available."},
  "Sorcerer": {1:"Pick 4 sorcerer cantrips and 2 1st-level sorcerer spells.", 2:"Learn 1 new sorcerer spell.", 3:"Learn 1 new sorcerer spell.", 4:"Learn 1 new sorcerer spell and 1 new cantrip.", 5:"Learn 1 new sorcerer spell. 3rd-level spells are now available."},
  "Warlock": {1:"Pick 2 warlock cantrips and 2 1st-level warlock spells.", 2:"Learn 1 new warlock spell.", 3:"Learn 1 new warlock spell. Your pact slots are now 2nd level.", 4:"Learn 1 new warlock spell and 1 new cantrip.", 5:"Learn 1 new warlock spell. Your pact slots are now 3rd level."},
  "Wizard": {1:"Pick 3 wizard cantrips and 6 1st-level spells for your spellbook.", 2:"Add 2 wizard spells to your spellbook.", 3:"Add 2 wizard spells to your spellbook. 2nd-level spells are now available.", 4:"Add 2 wizard spells to your spellbook and learn 1 new cantrip.", 5:"Add 2 wizard spells to your spellbook. 3rd-level spells are now available."}
};
export var THIRD_CASTER_SPELL_TIPS = {
  3:"Learn 2 wizard cantrips and 3 1st-level wizard spells.",
  4:"Learn 1 new wizard spell."
};

/* Spell slots per spellcaster level (multiclass table), index = slot level - 1. */
export var SPELL_SLOT_TABLE = [
  [],
  [2], [3], [4,2], [4,3], [4,3,2], [4,3,3], [4,3,3,1], [4,3,3,2], [4,3,3,3,1], [4,3,3,3,2],
  [4,3,3,3,2,1], [4,3,3,3,2,1], [4,3,3,3,2,1,1], [4,3,3,3,2,1,1], [4,3,3,3,2,1,1,1], [4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1,1], [4,3,3,3,3,1,1,1,1], [4,3,3,3,3,2,1,1,1], [4,3,3,3,3,2,2,1,1]
];

/* Warlock Pact Magic by warlock level: [slot count, slot level]. */
export var PACT_SLOT_TABLE = [
  null,
  [1,1], [2,1], [2,2], [2,2], [2,3], [2,3], [2,4], [2,4], [2,5], [2,5],
  [3,5], [3,5], [3,5], [3,5], [3,5], [3,5], [4,5], [4,5], [4,5], [4,5]
];
