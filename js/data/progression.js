/* ---------------- Levelling, subclasses & multiclassing data ----------------
   5e (2014) progression. Level-1 class features live in classes.js
   (CLASSES_INFO[..].features); this file covers what each class gains
   from level 2 up. A feature with `replaces` swaps out an earlier
   feature of that name (e.g. Sneak Attack growing from 1d6 to 2d6), and
   `speed` is a flat walking-speed bonus applied when it's gained. */

/* Levelling is capped here for now — raise it once the feature data
   below is filled in for higher levels. */
export var MAX_LEVEL = 5;

/* Total XP needed to reach each character level (index = level). */
export var XP_THRESHOLDS = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

var STANDARD_ASI = [4, 8, 12, 16, 19];

/* prereq: list of alternatives, each a list of abilities that must all be
   13+ (Fighter: STR or DEX; Monk: DEX and WIS).
   casterType: "full" | "half" | "artificer" | "pact" | null — drives spell
   slots. spellAbility: the class's spellcasting ability.
   multiclassProfs: what you gain when this is NOT your first class. */
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
    multiclassProfs: {armor:["Light armor"], weapons:[], tools:["One musical instrument"], note:"Also gain proficiency in one skill of your choice — tick it on the Abilities & Skills tab."},
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
    prereq: [["str"], ["dex"]], casterType: null, asiLevels: [4, 6, 8, 12, 14, 16, 19],
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], note:""},
    features: {
      2: [{name:"Action Surge", text:"Once per short or long rest, take one additional action on your turn — e.g. attack again or cast a second spell with an action."}],
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
    prereq: [["dex", "wis"]], casterType: "half", spellAbility: "wis", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], note:"Also gain proficiency in one skill from the ranger list — tick it on the Abilities & Skills tab."},
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
    multiclassProfs: {armor:["Light armor"], weapons:[], tools:["Thieves' tools"], note:"Also gain proficiency in one skill from the rogue list — tick it on the Abilities & Skills tab."},
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
      2: [{name:"Eldritch Invocations", text:"You learn two eldritch invocations — permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). Add them as custom features."}],
      3: [{name:"Pact Boon", text:"Your patron grants a gift: Pact of the Chain (a special familiar), Pact of the Blade (summon a magic weapon you're proficient with) or Pact of the Tome (a book with three extra cantrips from any class)."}],
      5: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know three eldritch invocations — permanent magical upgrades such as Agonizing Blast or Devil's Sight. You can swap one each time you gain a warlock level."}]
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
    {name:"Alchemist", blurb:"Brews magical elixirs and heals or harms with potions.", features:{3:[
      {name:"Experimental Elixir", text:"After a long rest, create one magic elixir with a random effect (healing, swiftness, resilience, boldness, flight or transformation). Spend spell slots to make more."},
      {name:"Alchemist Spells", text:"You always have Healing Word and Ray of Sickness prepared; they don't count against your prepared spells."}
    ]}},
    {name:"Artillerist", blurb:"Builds a magical cannon that blasts foes or shields allies.", features:{3:[
      {name:"Eldritch Cannon", text:"Action to create a small magical cannon for 1 hour: Flamethrower (2d8 fire cone), Force Ballista (2d8 force, pushes) or Protector (temp HP to allies). Bonus action to fire it. Once per long rest, or spend a spell slot."},
      {name:"Artillerist Spells", text:"You always have Shield and Thunderwave prepared."}
    ]}},
    {name:"Battle Smith", blurb:"A soldier-engineer fighting beside a loyal steel defender.", features:{3:[
      {name:"Battle Ready", text:"Proficiency with martial weapons, and you can use Intelligence instead of Strength or Dexterity for attacks with magic weapons."},
      {name:"Steel Defender", text:"You build a mechanical companion that fights beside you. It acts on your turn; use a bonus action to command it."}
    ]}},
    {name:"Armorer", blurb:"Turns a suit of armor into a powerful magical exosuit.", features:{3:[
      {name:"Arcane Armor", text:"Turn a suit of armor into Arcane Armor: no Strength requirement, it acts as your spellcasting focus, and it can't be removed against your will."},
      {name:"Armor Model", text:"Choose Guardian (thunder gauntlets, temporary HP) or Infiltrator (lightning launcher, +5 ft speed, stealthy) — you can switch after a rest."}
    ]}}
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
    ]}}
  ],
  "Bard": [
    {name:"College of Lore", blurb:"Collects knowledge and uses words to undermine foes.", features:{3:[
      {name:"Bonus Proficiencies", text:"Gain proficiency with three skills of your choice — tick them on the Abilities & Skills tab."},
      {name:"Cutting Words", text:"Reaction: spend a Bardic Inspiration die to subtract it from an enemy's attack roll, ability check or damage roll."}
    ]}},
    {name:"College of Valor", blurb:"A battle-bard who inspires heroics on the front line.", features:{3:[
      {name:"Bonus Proficiencies", text:"Proficiency with medium armor, shields and martial weapons."},
      {name:"Combat Inspiration", text:"Allies can add your Bardic Inspiration die to a damage roll, or to their AC against one attack."}
    ]}}
  ],
  "Cleric": [
    {name:"Life Domain", blurb:"The healer's domain — tougher armor and stronger heals.", features:{
      1:[
        {name:"Bonus Proficiency", text:"You gain proficiency with heavy armor."},
        {name:"Disciple of Life", text:"Your healing spells restore an extra 2 + the spell's level hit points."}
      ],
      2:[{name:"Channel Divinity: Preserve Life", text:"Action: split healing equal to five times your cleric level among creatures within 30 feet (up to half their max HP)."}]
    }},
    {name:"Light Domain", blurb:"Wields fire and radiance against darkness.", features:{
      1:[
        {name:"Bonus Cantrip", text:"You learn the Light cantrip."},
        {name:"Warding Flare", text:"Reaction when attacked by a creature you can see within 30 feet: impose disadvantage on the attack. Uses equal to your Wisdom modifier per long rest."}
      ],
      2:[{name:"Channel Divinity: Radiance of the Dawn", text:"Action: dispel magical darkness within 30 feet, and hostile creatures there take 2d10 + cleric level radiant damage (Constitution save for half)."}]
    }},
    {name:"War Domain", blurb:"A warrior-priest who fights in heavy armor.", features:{
      1:[
        {name:"Bonus Proficiencies", text:"Proficiency with martial weapons and heavy armor."},
        {name:"War Priest", text:"When you take the Attack action, make one weapon attack as a bonus action. Uses equal to your Wisdom modifier per long rest."}
      ],
      2:[{name:"Channel Divinity: Guided Strike", text:"When you make an attack roll, gain +10 to it (decide after seeing the roll, before knowing if it hits)."}]
    }},
    {name:"Knowledge Domain", blurb:"Seeks and guards secrets and lore.", features:{
      1:[{name:"Blessings of Knowledge", text:"Learn two languages and gain expertise in two of Arcana, History, Nature or Religion — tick them on the Abilities & Skills tab."}],
      2:[{name:"Channel Divinity: Knowledge of the Ages", text:"Action: gain proficiency with one skill or tool for 10 minutes."}]
    }},
    {name:"Tempest Domain", blurb:"Commands storms, thunder and lightning.", features:{
      1:[
        {name:"Bonus Proficiencies", text:"Proficiency with martial weapons and heavy armor."},
        {name:"Wrath of the Storm", text:"Reaction when a creature within 5 feet hits you: it takes 2d8 lightning or thunder damage (Dexterity save for half). Uses equal to your Wisdom modifier per long rest."}
      ],
      2:[{name:"Channel Divinity: Destructive Wrath", text:"When you roll lightning or thunder damage, deal the maximum instead of rolling."}]
    }},
    {name:"Trickery Domain", blurb:"Deception, stealth and mischief.", features:{
      1:[{name:"Blessing of the Trickster", text:"Action: give another willing creature advantage on Stealth checks for 1 hour."}],
      2:[{name:"Channel Divinity: Invoke Duplicity", text:"Create an illusory duplicate of yourself for 1 minute; cast spells from its space and gain advantage when you and it are both next to a target."}]
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
    ]}}
  ],
  "Fighter": [
    {name:"Champion", blurb:"Simple, reliable raw power — more critical hits.", features:{3:[
      {name:"Improved Critical", text:"Your weapon attacks score a critical hit on a roll of 19 or 20."}
    ]}},
    {name:"Battle Master", blurb:"A tactician with special combat maneuvers.", features:{3:[
      {name:"Combat Superiority", text:"You learn three maneuvers (e.g. Trip Attack, Riposte, Precision Attack) and have four d8 superiority dice to fuel them, regained on a short or long rest."},
      {name:"Student of War", text:"Gain proficiency with one type of artisan's tools."}
    ]}},
    {name:"Eldritch Knight", blurb:"Blends martial skill with wizard magic.", casterType:"third", spellAbility:"int", features:{3:[
      {name:"Spellcasting", text:"You learn two wizard cantrips and three 1st-level wizard spells (mostly abjuration and evocation), cast with Intelligence."},
      {name:"Weapon Bond", text:"Bond with up to two weapons: you can't be disarmed of them and can summon one to your hand as a bonus action."}
    ]}}
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
    ]}}
  ],
  "Paladin": [
    {name:"Oath of Devotion", blurb:"The classic knight in shining armor.", features:{3:[
      {name:"Oath Spells", text:"You always have Protection from Evil and Good and Sanctuary prepared."},
      {name:"Channel Divinity", text:"Once per short or long rest: Sacred Weapon (add CHA to attack rolls for 1 minute) or Turn the Unholy (fiends and undead must flee)."}
    ]}},
    {name:"Oath of the Ancients", blurb:"Protects light and life in the world.", features:{3:[
      {name:"Oath Spells", text:"You always have Ensnaring Strike and Speak with Animals prepared."},
      {name:"Channel Divinity", text:"Once per short or long rest: Nature's Wrath (restrain a creature with vines) or Turn the Faithless (fey and fiends must flee)."}
    ]}},
    {name:"Oath of Vengeance", blurb:"Punishes wrongdoers at any cost.", features:{3:[
      {name:"Oath Spells", text:"You always have Bane and Hunter's Mark prepared."},
      {name:"Channel Divinity", text:"Once per short or long rest: Abjure Enemy (frighten one creature) or Vow of Enmity (advantage on attacks against one creature for 1 minute)."}
    ]}}
  ],
  "Ranger": [
    {name:"Hunter", blurb:"Specialist monster slayer.", features:{3:[
      {name:"Hunter's Prey", text:"Choose one: Colossus Slayer (+1d8 once per turn against a wounded target), Giant Killer (reaction attack against a Large foe that attacks you) or Horde Breaker (extra attack against a second adjacent enemy)."}
    ]}},
    {name:"Beast Master", blurb:"Fights alongside an animal companion.", features:{3:[
      {name:"Ranger's Companion", text:"Gain a beast companion (CR 1/4 or lower). It obeys your commands; use your action to have it attack."}
    ]}},
    {name:"Gloom Stalker", blurb:"An ambusher at home in the dark.", features:{3:[
      {name:"Dread Ambusher", text:"Add WIS to initiative. On your first turn of combat, +10 ft speed and one extra attack that deals +1d8 damage."},
      {name:"Umbral Sight", text:"Darkvision 60 ft (or +30 ft), and you're invisible to creatures relying on darkvision to see you in the dark."}
    ]}}
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
    ]}}
  ],
  "Sorcerer": [
    {name:"Draconic Bloodline", blurb:"Dragon blood grants toughness and elemental power.", features:{1:[
      {name:"Dragon Ancestor", text:"Choose a dragon type (sets your damage type later). You speak Draconic and double your proficiency bonus on Charisma checks with dragons."},
      {name:"Draconic Resilience", text:"Your max HP increases by 1 per sorcerer level, and without armor your AC is 13 + DEX modifier. (Adjust your max HP by hand.)"}
    ]}},
    {name:"Wild Magic", blurb:"Chaotic magic that surges unpredictably.", features:{1:[
      {name:"Wild Magic Surge", text:"When you cast a leveled sorcerer spell, the DM can have you roll a d20 — on a 1, roll on the Wild Magic Surge table."},
      {name:"Tides of Chaos", text:"Gain advantage on one attack roll, ability check or save. Regained on a long rest (or when a surge happens)."}
    ]}}
  ],
  "Warlock": [
    {name:"The Fiend", blurb:"A pact with a devil or demon.", features:{1:[
      {name:"Dark One's Blessing", text:"When you drop a hostile creature to 0 HP, gain temporary HP equal to your CHA modifier + warlock level."}
    ]}},
    {name:"The Archfey", blurb:"A pact with a lord or lady of the fey.", features:{1:[
      {name:"Fey Presence", text:"Action: each creature in a 10-foot cube around you must pass a Wisdom save or be charmed or frightened until the end of your next turn. Once per short or long rest."}
    ]}},
    {name:"The Great Old One", blurb:"A pact with an unknowable alien entity.", features:{1:[
      {name:"Awakened Mind", text:"Speak telepathically to any creature you can see within 30 feet."}
    ]}}
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

/* What to do about spells after reaching a class level — shown in the
   "you unlocked" popup so new players know what to pick. */
export var SPELL_TIPS = {
  "Artificer": {1:"Pick 2 artificer cantrips. You prepare INT modifier + half your artificer level (min 1) spells each day."},
  "Bard": {1:"Pick 2 bard cantrips and 4 1st-level bard spells.", 2:"Learn 1 new bard spell.", 3:"Learn 1 new bard spell.", 4:"Learn 1 new bard spell and 1 new cantrip.", 5:"Learn 1 new bard spell — 3rd-level spells are now available."},
  "Cleric": {1:"Pick 3 cleric cantrips. You prepare WIS modifier + cleric level spells from the whole cleric list each day.", 3:"2nd-level cleric spells are now available to prepare.", 4:"Learn 1 new cleric cantrip.", 5:"3rd-level cleric spells are now available to prepare."},
  "Druid": {1:"Pick 2 druid cantrips. You prepare WIS modifier + druid level spells from the druid list each day.", 3:"2nd-level druid spells are now available to prepare.", 4:"Learn 1 new druid cantrip.", 5:"3rd-level druid spells are now available to prepare."},
  "Paladin": {2:"You prepare CHA modifier + half your paladin level spells from the paladin list each day.", 5:"2nd-level paladin spells are now available to prepare."},
  "Ranger": {2:"Learn 2 1st-level ranger spells.", 3:"Learn 1 new ranger spell.", 5:"Learn 1 new ranger spell — 2nd-level spells are now available."},
  "Sorcerer": {1:"Pick 4 sorcerer cantrips and 2 1st-level sorcerer spells.", 2:"Learn 1 new sorcerer spell.", 3:"Learn 1 new sorcerer spell.", 4:"Learn 1 new sorcerer spell and 1 new cantrip.", 5:"Learn 1 new sorcerer spell — 3rd-level spells are now available."},
  "Warlock": {1:"Pick 2 warlock cantrips and 2 1st-level warlock spells.", 2:"Learn 1 new warlock spell.", 3:"Learn 1 new warlock spell — your pact slots are now 2nd level.", 4:"Learn 1 new warlock spell and 1 new cantrip.", 5:"Learn 1 new warlock spell — your pact slots are now 3rd level."},
  "Wizard": {1:"Pick 3 wizard cantrips and 6 1st-level spells for your spellbook.", 2:"Add 2 wizard spells to your spellbook.", 3:"Add 2 wizard spells to your spellbook — 2nd-level spells are now available.", 4:"Add 2 wizard spells to your spellbook and learn 1 new cantrip.", 5:"Add 2 wizard spells to your spellbook — 3rd-level spells are now available."}
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
