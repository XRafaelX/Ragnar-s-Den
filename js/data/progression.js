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
    }},
    {name:"Path of the Giant", blurb:"Channels the might of giants to grow huge and hurl elemental weapons.", features:{
      3:[
        {name:"Giant's Power", text:"You learn to speak, read and write Giant (or another language of your choice if you already know Giant). You also learn the Druidcraft or Thaumaturgy cantrip; Wisdom is your spellcasting ability for it."},
        {name:"Giant's Havoc", text:"While raging: Crushing Throw (when you hit with a ranged attack using a thrown weapon and Strength, add your Rage damage bonus to the damage) and Giant Stature (your reach increases by 5 feet, and if you are smaller than Large you become Large, along with anything you're wearing, if there's room)."}
      ],
      6:[
        {name:"Elemental Cleaver", text:"When you enter your rage, infuse one weapon you're holding with acid, cold, fire, lightning or thunder until the rage ends. It deals that damage type instead of its normal type plus an extra 1d6 damage of that type, gains the thrown property (range 20/60) and flies back to your hand right after you throw it. As a bonus action on later turns of the rage, you can change the damage type."}
      ],
      10:[
        {name:"Mighty Impel", text:"Bonus action while raging: choose one Medium or smaller creature within your reach and move it to an unoccupied space you can see within 30 feet of you. An unwilling creature makes a Strength save (DC 8 + proficiency bonus + STR modifier) to avoid it. A creature moved into the air falls and takes falling damage as normal."}
      ],
      14:[
        {name:"Demiurgic Colossus", text:"While raging, Giant Stature increases your reach by 10 feet instead of 5, and you can choose to become Large or Huge if there's room. Mighty Impel can now move Large or smaller creatures, and the extra damage from Elemental Cleaver increases to 2d6."}
      ]
    }},
    {name:"Path of the Storm Herald", blurb:"Rages as a living storm, surrounded by an aura of desert, sea or tundra.", features:{
      3:[
        {name:"Storm Aura", text:"While raging you emanate a 10-foot aura. Choose desert, sea or tundra (you can change it each time you gain a barbarian level). The effect activates when you enter your rage, and again each turn as a bonus action. Save DC is 8 + proficiency bonus + CON modifier. Desert: every other creature in the aura takes 2 fire damage (3 at level 5, 4 at 10, 5 at 15, 6 at 20). Sea: one other creature in the aura makes a DEX save or takes 1d6 lightning damage, half on a success (2d6 at level 10, 3d6 at 15, 4d6 at 20). Tundra: each creature of your choice in the aura gains 2 temporary HP (3 at level 5, 4 at 10, 5 at 15, 6 at 20)."}
      ],
      6:[
        {name:"Storm Soul", text:"You gain a benefit based on your aura, even when not raging. Desert: resistance to fire damage, no ill effects from extreme heat, and as an action you can set fire to a flammable object you touch that no one is wearing or carrying. Sea: resistance to lightning damage, you can breathe underwater, and you gain a 30-foot swim speed. Tundra: resistance to cold damage, no ill effects from extreme cold, and as an action you can touch water and turn a 5-foot cube of it into ice, which melts after 1 minute."}
      ],
      10:[
        {name:"Shielding Storm", text:"Each creature of your choice has the damage resistance you gained from Storm Soul while it is in your Storm Aura."}
      ],
      14:[
        {name:"Raging Storm", text:"Your aura gains a stronger effect while raging. Desert: right after a creature in your aura hits you with an attack, use your reaction to force it to make a DEX save; on a failure it takes fire damage equal to half your barbarian level. Sea: when you hit a creature in your aura, use your reaction to force it to make a STR save; on a failure it is knocked prone. Tundra: whenever your aura's effect activates, choose one creature in it; it makes a STR save or its speed becomes 0 until the start of your next turn."}
      ]
    }},
    {name:"Path of the Battlerager", blurb:"A dwarven berserker who charges into battle clad in spiked armor.", features:{
      3:[
        {name:"Battlerager Armor", text:"Traditionally for dwarves only (ask your DM). While wearing spiked armor and raging, you can use a bonus action to make one melee attack with your armor spikes against a creature within 5 feet: 1d4 + STR piercing damage on a hit. When you use the Attack action to grapple and succeed, the target also takes 3 piercing damage."}
      ],
      6:[
        {name:"Reckless Abandon", text:"When you use Reckless Attack while raging, you gain temporary hit points equal to your CON modifier (minimum 1). They vanish when your rage ends."}
      ],
      10:[
        {name:"Battlerager Charge", text:"You can take the Dash action as a bonus action while you are raging."}
      ],
      14:[
        {name:"Spiked Retribution", text:"When a creature within 5 feet of you hits you with a melee attack, it takes 3 piercing damage if you are raging, aren't incapacitated and are wearing spiked armor."}
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
    }},
    {name:"College of Creation", blurb:"Sings the Song of Creation to conjure objects and bring them to dancing life.", features:{
      3:[
        {name:"Mote of Potential", text:"When you give a creature a Bardic Inspiration die, a tiny mote orbits it and adds a bonus when the die is used. Ability check: roll the die twice and use either result. Attack roll: on a hit, the target and each creature of your choice within 5 feet of it make a CON save against your spell save DC or take thunder damage equal to the die roll. Saving throw: the creature gains temporary HP equal to the die roll + your CHA modifier (minimum 1)."},
        {name:"Performance of Creation", text:"As an action, create one nonmagical item in an unoccupied space within 10 feet, on a surface that can support it. It is Medium or smaller (Large from level 6, Huge from level 14), worth no more than 20 x your bard level in gp, and glimmers softly. It lasts for a number of hours equal to your proficiency bonus; you can have only one at a time. Once per long rest, or expend a 2nd-level or higher spell slot to use it again."}
      ],
      6:[
        {name:"Animating Performance", text:"As an action, animate a Large or smaller nonmagical item within 30 feet as a Dancing Item for 1 hour (until it drops to 0 HP or you die). It is friendly, acts on your turn and obeys your commands (bonus action; you can also command it as part of the bonus action you use for Bardic Inspiration). Dancing Item: AC 16, HP 10 + 5 x bard level, speed 30 ft (fly 30 ft, hover), immune to poison and psychic damage and to charm, exhaustion, poison and fright. Irrepressible Dance: a creature that starts its turn within 10 feet of it has its speed raised or lowered by 10 feet (item's choice). Force-Empowered Slam: melee attack using your spell attack bonus, 1d10 + proficiency bonus force damage. Once per long rest, or expend a 3rd-level or higher spell slot to use it again."}
      ],
      14:[
        {name:"Creative Crescendo", text:"When you use Performance of Creation, you can create a number of items equal to your CHA modifier (minimum 2) at once. Only one of them can be of the maximum size you can create; the rest must be Small or Tiny. You are no longer limited by gp value. If creating one would exceed your limit, you choose which earlier item disappears."}
      ]
    }},
    {name:"College of Glamour", blurb:"A fey-touched performer whose beauty charms crowds and commands foes.", features:{
      3:[
        {name:"Mantle of Inspiration", text:"As a bonus action, expend one Bardic Inspiration use and choose up to your CHA modifier (minimum 1) creatures within 60 feet. Each gains 5 temporary HP (8 at level 5, 11 at level 10, 14 at level 15) and can immediately use its reaction to move up to its speed without provoking opportunity attacks."},
        {name:"Enthralling Performance", text:"After performing for at least 1 minute, choose up to your CHA modifier (minimum 1) humanoids within 60 feet that watched and listened. Each makes a WIS save against your spell save DC or is charmed by you for 1 hour: it idolizes you, speaks glowingly of you and hinders anyone who opposes you (avoiding violence unless already inclined to fight). The effect ends early if the creature is damaged, you attack it, or it sees you or your allies attack or damage its allies. A creature that succeeds has no hint you tried. Once per short or long rest."}
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
        {name:"Guiding Whispers", text:"You learn the Guidance cantrip (it doesn't count against your cantrips known). When you cast it, its range is 60 feet."},
        {name:"Spiritual Focus", text:"You can use a candle, crystal ball, skull, spirit board or tarokka deck as a spellcasting focus for your bard spells. From level 6, when you cast a bard spell that deals damage or restores hit points through your Spiritual Focus, roll a d6 and add it to one damage or healing roll of the spell."},
        {name:"Tales from Beyond", text:"As a bonus action, expend one Bardic Inspiration use and roll your Bardic Inspiration die on the Spirit Tales table. You keep the tale in mind until you bestow it or finish a short or long rest, and can hold only one at a time. As an action, bestow it on a creature within 30 feet (it can be you). Save DC is your spell save DC; \"BI\" below is a roll of your Bardic Inspiration die. 1 Clever Animal: for 10 minutes, add BI to INT, WIS and CHA checks. 2 Renowned Duelist: melee spell attack, 2 BI + CHA mod force damage. 3 Beloved Friends: the target and one creature within 5 feet of it gain BI + CHA mod temporary HP. 4 Runaway: the target teleports up to 30 feet with its reaction; up to CHA mod creatures within 30 feet of it can do the same. 5 Avenger: for 1 minute, a creature that hits the target with a melee attack takes BI force damage. 6 Traveler: the target gains BI + bard level temporary HP; while they last, +10 feet speed and +1 AC. 7 Beguiler: WIS save or 2 BI psychic damage and incapacitated until the end of its next turn. 8 Phantom: invisible until the end of its next turn or until it hits; the creature it hits takes BI necrotic damage and is frightened of it until the end of that creature's next turn. 9 Brute: creatures of the target's choice within 30 feet make a STR save or take 3 BI thunder damage and fall prone (half, not prone, on a success). 10 Dragon: 30-foot cone of fire, DEX save, 4 BI fire damage (half on a success). 11 Angel: the target regains 2 BI + CHA mod HP and you end one of blinded, deafened, paralyzed, petrified or poisoned on it. 12 Mind-Bender: INT save or 3 BI psychic damage and stunned until the end of its next turn."}
      ],
      6:[
        {name:"Spirit Session", text:"Over a 1-hour ritual during a short or long rest, commune with spirits alongside up to five willing creatures (including you). You temporarily learn one divination or necromancy spell from any class, of a level no higher than the number of creatures that took part and that you can cast. It counts as a bard spell for you but not against your spells known, and you keep it until you perform another Spirit Session or finish a long rest. Once per long rest."}
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
    {name:"Nature Domain", blurb:"Channels the power of nature to command beasts and wield elemental fury.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Animal Friendship and Speak with Animals prepared; they don't count against your prepared spells."},
        {name:"Acolyte of Nature", text:"Learn one Druid cantrip. Gain proficiency in one of Animal Handling, Nature or Survival."},
        {name:"Bonus Proficiency", text:"You gain proficiency with heavy armor."}
      ],
      2:[{name:"Channel Divinity: Charm Animals and Plants", text:"Action: each beast and plant creature within 30 feet must succeed on a Wisdom save or be charmed by you for 1 minute."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Animal Friendship, Speak with Animals, Barkskin and Spike Growth prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Animal Friendship, Speak with Animals, Barkskin, Spike Growth, Plant Growth and Wind Wall prepared; they don't count against your prepared spells."}],
      6:[{name:"Dampen Elements", text:"Reaction: when you or a creature within 30 feet takes acid, cold, fire, lightning or thunder damage, grant resistance to that damage for that instance."}],
      8:[{name:"Divine Strike", text:"Once per turn when you hit with a weapon attack, deal an extra 1d8 cold, fire or lightning damage (your choice when you gain this feature). Increases to 2d8 at level 14."}]
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
    }},
    {name:"Death Domain", blurb:"Wields necrotic power to reap the living and command death itself.", features:{
      1:[
        {name:"Domain Spells", text:"You always have False Life and Ray of Sickness prepared; they don't count against your prepared spells."},
        {name:"Bonus Proficiency", text:"You gain proficiency with martial weapons."},
        {name:"Reaper", text:"You learn one necromancy cantrip of your choice from any class's spell list (e.g. Chill Touch or Toll the Dead). When you cast a necromancy cantrip that normally targets only one creature, it can instead target two creatures within range and within 5 feet of each other."}
      ],
      2:[{name:"Channel Divinity: Touch of Death", text:"When you hit a creature with a melee attack, you can use Channel Divinity to deal extra necrotic damage equal to 5 + twice your cleric level."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness and Ray of Enfeeblement prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness, Ray of Enfeeblement, Animate Dead and Vampiric Touch prepared; they don't count against your prepared spells."}],
      6:[{name:"Inescapable Destruction", text:"Necrotic damage dealt by your cleric spells and Channel Divinity options ignores resistance to necrotic damage."}],
      7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness, Ray of Enfeeblement, Animate Dead, Vampiric Touch, Blight and Death Ward prepared; they don't count against your prepared spells."}],
      8:[{name:"Divine Strike", text:"Once per turn when you hit with a weapon attack, deal an extra 1d8 necrotic damage. Increases to 2d8 at level 14."}],
      9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness, Ray of Enfeeblement, Animate Dead, Vampiric Touch, Blight, Death Ward, Antilife Shell and Cloudkill prepared; they don't count against your prepared spells."}],
      17:[{name:"Improved Reaper", text:"When you cast a necromancy spell of 1st through 5th level that targets only one creature, it can instead target two creatures within range and within 5 feet of each other. If the spell consumes its material components, you must provide them for each target."}]
    }},
    {name:"Arcana Domain", blurb:"A scholar-priest of magic who wields wizard spells and banishes otherworldly foes.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Detect Magic and Magic Missile prepared; they don't count against your prepared spells."},
        {name:"Arcane Initiate", text:"You gain proficiency in Arcana (tick it on the Abilities & Skills tab) and learn two wizard cantrips of your choice. They count as cleric cantrips for you."}
      ],
      2:[{name:"Channel Divinity: Arcane Abjuration", text:"Action: choose one celestial, elemental, fey or fiend within 30 feet that can see or hear you. It makes a Wisdom save or is turned for 1 minute or until it takes damage: it must spend its turns moving away from you, can't willingly come within 30 feet of you, can't take reactions, and can only Dash or try to escape."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon and Nystul's Magic Aura prepared; they don't count against your prepared spells."}],
      5:[
        {name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon, Nystul's Magic Aura, Dispel Magic and Magic Circle prepared; they don't count against your prepared spells."},
        {name:"Channel Divinity: Arcane Abjuration", replaces:"Channel Divinity: Arcane Abjuration", text:"Action: choose one celestial, elemental, fey or fiend within 30 feet that can see or hear you. It makes a Wisdom save or is turned for 1 minute or until it takes damage. If it fails, isn't on its home plane and has a challenge rating at or below your threshold, it is instead banished to its home plane for 1 minute (as Banishment, no concentration). Threshold: CR 1/2 at level 5, CR 1 at 8, CR 2 at 11, CR 3 at 14, CR 4 at 17."}
      ],
      6:[{name:"Spell Breaker", text:"When you restore hit points to an ally with a spell of 1st level or higher, you can also end one spell of your choice on that creature. The ended spell's level must be no higher than the slot you used for the healing spell."}],
      7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon, Nystul's Magic Aura, Dispel Magic, Magic Circle, Arcane Eye and Leomund's Secret Chest prepared; they don't count against your prepared spells."}],
      8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
      9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon, Nystul's Magic Aura, Dispel Magic, Magic Circle, Arcane Eye, Leomund's Secret Chest, Planar Binding and Teleportation Circle prepared; they don't count against your prepared spells."}],
      17:[{name:"Arcane Mastery", text:"Choose four spells from the wizard spell list, one each of 6th, 7th, 8th and 9th level. They become domain spells for you: always prepared and not counted against your prepared spells."}]
    }},
    {name:"Grave Domain", blurb:"Watches over the line between life and death, sparing the dying and hastening the doomed.", features:{
      1:[
        {name:"Domain Spells", text:"You always have Bane and False Life prepared; they don't count against your prepared spells."},
        {name:"Circle of Mortality", text:"When you restore hit points with a spell to a creature at 0 hit points, use the highest number possible for each die instead of rolling. You also learn the Spare the Dying cantrip (it doesn't count against your cantrips known), and you can cast it as a bonus action with a range of 30 feet."},
        {name:"Eyes of the Grave", text:"As an action, you know the location of any undead within 60 feet that isn't behind total cover or protected from divination magic, until the end of your next turn. You can use this a number of times equal to your Wisdom modifier (minimum 1), regained on a long rest."}
      ],
      2:[{name:"Channel Divinity: Path to the Grave", text:"Action: curse one creature within 30 feet until the end of your next turn. The next time you or an ally hits it with an attack, it has vulnerability to all of that attack's damage, and the curse ends."}],
      3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose and Ray of Enfeeblement prepared; they don't count against your prepared spells."}],
      5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose, Ray of Enfeeblement, Revivify and Vampiric Touch prepared; they don't count against your prepared spells."}],
      6:[{name:"Sentinel at Death's Door", text:"Reaction when you or a creature you can see within 30 feet suffers a critical hit: turn it into a normal hit, cancelling any effects triggered by the critical hit. You can use this a number of times equal to your Wisdom modifier (minimum 1), regained on a long rest."}],
      7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose, Ray of Enfeeblement, Revivify, Vampiric Touch, Blight and Death Ward prepared; they don't count against your prepared spells."}],
      8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
      9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose, Ray of Enfeeblement, Revivify, Vampiric Touch, Blight, Death Ward, Antilife Shell and Raise Dead prepared; they don't count against your prepared spells."}],
      17:[{name:"Keeper of Souls", text:"Once per turn, when an enemy you can see dies within 60 feet of you, you or one creature of your choice within 60 feet regains hit points equal to the enemy's number of Hit Dice. You can't use this while incapacitated."}]
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
    ]}},
    {name:"Bladesinging", blurb:"An elven tradition blending arcane magic with fluid, lethal swordplay.", features:{
      2:[
        {name:"Training in War and Song", text:"Gain proficiency with light armor and one one-handed melee weapon of your choice."},
        {name:"Bladesong", text:"As a bonus action, enter a Bladesong for 1 minute (ends early if you don medium or heavy armor, a shield or two-handed weapon, or are incapacitated). While active: +INT modifier to AC, walking speed +10 feet, advantage on Acrobatics checks, and +INT modifier to concentration saves. Uses equal to your proficiency bonus per long rest."}
      ],
      6:[{name:"Extra Attack", text:"When you take the Attack action, you can attack twice instead of once. Moreover, you can cast one of your cantrips in place of one of those attacks."}],
      10:[{name:"Song of Defense", text:"While Bladesong is active, use your reaction when you take damage to expend a spell slot and reduce the damage by 5 times the slot's level."}],
      14:[{name:"Song of Victory", text:"While Bladesong is active, add your Intelligence modifier to the damage of melee weapon attacks."}]
    }},
    {name:"War Magic", blurb:"Fuses offensive spellcasting with battlefield resilience and reactions.", features:{
      2:[
        {name:"Arcane Deflection", text:"When you are hit by an attack or fail a saving throw, use your reaction to gain +2 AC against the triggering attack, or +4 to the triggering save. You can't cast spells other than cantrips until the end of your next turn after using this."},
        {name:"Tactical Wit", text:"Add your Intelligence modifier to your initiative rolls."}
      ],
      6:[{name:"Power Surge", text:"Store magical energy when you use Arcane Deflection or when you expend a spell slot to end a concentration spell. Maximum surges equal to your INT modifier (min 1). Once per turn when you deal damage with a wizard cantrip, expend a surge to deal extra force damage equal to half your wizard level."}],
      10:[{name:"Durable Magic", text:"While you maintain concentration on a spell, gain +2 to AC and all saving throws."}],
      14:[{name:"Deflecting Shroud", text:"When you use Arcane Deflection, you release magical energy that deals force damage equal to half your wizard level to up to three creatures of your choice within 60 feet."}]
    }},
    {name:"Order of Scribes", blurb:"Awakens the magic of the spellbook itself as a powerful arcane companion.", features:{
      2:[
        {name:"Awakened Spellbook", text:"Your spellbook becomes a magical arcane focus. When you cast a wizard spell as a ritual, you can use the spell's normal casting time (not 10 minutes extra). Once per long rest when you cast a wizard spell using a slot, you can replace its damage type with a type from another wizard spell in your book."},
        {name:"Wizardly Quill", text:"Conjure a magical quill (bonus action). It creates ink from nothing, writes twice as fast as normal, and you can use it to copy spells for free (0 gp) and in half the normal time. The quill disappears after use."}
      ],
      6:[{name:"Manifest Mind", text:"As a bonus action, manifest your spellbook's mind as a spectral orb within 60 feet. It sheds dim light 10 feet, floats and can move 30 feet per turn (bonus action). While active: cast wizard spells as if you were in its space, and you have advantage on saving throws to maintain concentration. Lasts until dismissed or destroyed (AC 13, HP equal to your wizard level + INT modifier). Uses equal to proficiency bonus per long rest."}],
      10:[{name:"Master Scrivener", text:"After a long rest, create a single-use magic scroll of a 1st or 2nd level spell from your spellbook using your Wizardly Quill (free, takes 1 minute). Casting from this scroll uses your spell save DC and attack bonus. The scroll crumbles after use or your next long rest."}],
      14:[{name:"One with the Word", text:"While your Manifest Mind is active, you can cast a spell through it as a reaction if a creature damages it: the spell targets only that creature. You can use this once per long rest. Additionally, once per long rest, if you take fatal damage you can prevent death by destroying 1d6 spells of your choice from your spellbook; you instead drop to 1 HP (the destroyed spells can be recopied normally)."}]
    }},
    {name:"School of Conjuration", blurb:"Summons creatures and objects and teleports across the battlefield.", features:{
      2:[
        {name:"Conjuration Savant", text:"Copying conjuration spells into your spellbook costs half the gold and time."},
        {name:"Minor Conjuration", text:"As an action, conjure a non-magical object no larger than 3 feet on a side and weighing no more than 10 pounds. It appears in your hand or on the ground within 10 feet, and disappears after 1 hour, when you use the feature again, or when it takes or deals damage."}
      ],
      6:[{name:"Benign Transposition", text:"As an action, teleport up to 30 feet to an unoccupied space you can see, or swap places with a willing Small or Medium creature within 30 feet. Once you use this feature, you must finish a long rest before using it again — unless you expend a spell slot of 1st level or higher to use it again."}],
      10:[{name:"Focused Conjuration", text:"While you are concentrating on a conjuration spell, your concentration can't be broken by taking damage."}],
      14:[{name:"Durable Summons", text:"Any creature you summon or create with a conjuration spell has 30 temporary hit points."}]
    }},
    {name:"School of Enchantment", blurb:"Bends minds, charms enemies and manipulates social interactions.", features:{
      2:[
        {name:"Enchantment Savant", text:"Copying enchantment spells into your spellbook costs half the gold and time."},
        {name:"Hypnotic Gaze", text:"As an action, choose a creature within 5 feet. It must succeed on a Wisdom save or be charmed until the end of your next turn, its speed drops to 0 and it is incapacitated. On each of your turns you can use your action to maintain the effect for another turn. The effect ends if you move more than 5 feet away, if it can no longer see you, or if it succeeds on a Wisdom save at end of your turn. Once it ends the creature is immune for 24 hours. Once per short or long rest."}
      ],
      6:[{name:"Instinctive Charm", text:"Reaction when a creature within 30 feet makes an attack roll against you: it must make a Wisdom save or attack the nearest other creature instead. On a success, you are immune to this creature's Instinctive Charm for 24 hours. Once per long rest."}],
      10:[{name:"Split Enchantment", text:"When you cast an enchantment spell of 1st level or higher targeting only one creature, you can target a second creature with the same spell at no extra cost."}],
      14:[{name:"Alter Memories", text:"When you cast an enchantment spell that charms a creature, you can make it forget it was ever charmed by you. Before the charm ends, the creature makes an Intelligence save. On a failure it has no memory of being charmed."}]
    }},
    {name:"School of Transmutation", blurb:"Alters physical forms, mutates matter and crafts a powerful Transmuter's Stone.", features:{
      2:[
        {name:"Transmutation Savant", text:"Copying transmutation spells into your spellbook costs half the gold and time."},
        {name:"Minor Alchemy", text:"As an action, transform a non-magical Small-or-smaller object of one material (wood, stone, iron, copper or silver) into another for up to 1 hour. The transformation ends if you use this feature again."}
      ],
      6:[{name:"Transmuter's Stone", text:"Over 8 hours, craft a stone that stores transmutation magic. Its bearer chooses one benefit: darkvision 60 ft, +10 ft speed, proficiency in CON saves, or resistance to one of acid/cold/fire/lightning/thunder. You can have only one stone; crafting a new one destroys the old one."}],
      10:[{name:"Shapechanger", text:"Add Polymorph to your spellbook for free. Cast it on yourself without expending a spell slot once per short or long rest."}],
      14:[{name:"Master Transmuter", text:"As an action, consume your Transmuter's Stone for one of four effects: Major Transformation (transmute an object up to 5-ft cube into another of equal or lesser value for 1 hour), Panacea (remove all curses/diseases/poisons and restore full HP to a touched creature), Restore Life (cast Raise Dead without material components on a creature dead no longer than 1 minute), or Restore Youth (reduce a touched creature's apparent age by 3d10 years, minimum 13)."}]
    }}
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
