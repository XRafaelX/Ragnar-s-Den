/* Rogue subclasses: the full feature list for each one, keyed by class
   level. Assembled into SUBCLASSES in ../progression.js; see the comment
   there for the feature fields and flags. */
export var ROGUE_SUBCLASSES = [
  {name:"Thief", blurb:"A burglar and treasure hunter.", features:{
    3:[
      {name:"Fast Hands", text:"You can use the bonus action from Cunning Action to make a DEX (Sleight of Hand) check, use thieves' tools to disarm a trap or open a lock, or take the Use an Object action."},
      {name:"Second-Story Work", text:"Climbing costs you no extra movement, and your running jumps cover extra feet equal to your DEX modifier."}
    ],
    9:[{name:"Supreme Sneak", text:"You have advantage on DEX (Stealth) checks if you move no more than half your speed on the same turn."}],
    13:[{name:"Use Magic Device", text:"You ignore all class, race and level requirements on the use of magic items."}],
    17:[{name:"Thief's Reflexes", text:"You take two turns during the first round of any combat: the first at your normal initiative and the second at your initiative minus 10. You can't use this when you are surprised."}]
  }},
  {name:"Assassin", blurb:"Deadly in the first moments of a fight.", features:{
    3:[
      {name:"Bonus Proficiencies", text:"Proficiency with the disguise kit and the poisoner's kit.", grants:{tools:["Disguise kit","Poisoner's kit"]}},
      {name:"Assassinate", text:"You have advantage on attack rolls against any creature that hasn't taken a turn in the combat yet, and any hit you score against a surprised creature is a critical hit."}
    ],
    9:[{name:"Infiltration Expertise", text:"By spending seven days and 25 gp, you can create a false identity with a history, profession and affiliations (not one belonging to someone else), including documents and established acquaintances. While disguised as that identity, others believe you are that person until given an obvious reason not to."}],
    13:[{name:"Impostor", text:"After at least three hours studying a person's speech, writing and behavior, you can mimic them unerringly. The ruse fools casual observers, and if a wary creature suspects something, you have advantage on CHA (Deception) checks to avoid detection."}],
    17:[{name:"Death Strike", text:"When you hit a surprised creature, it makes a CON save (DC 8 + DEX modifier + proficiency bonus). On a failure, double the damage of your attack against it."}]
  }},
  {name:"Arcane Trickster", blurb:"Enhances stealth and trickery with illusion and enchantment magic.", casterType:"third", spellAbility:"int", features:{
    3:[
      {name:"Spellcasting", text:"You cast wizard spells with Intelligence, using a third of your rogue level for spell slots. You know Mage Hand and two other wizard cantrips (a third at level 10), and three 1st-level wizard spells, two of which must be enchantment or illusion. You learn more as you level; spells learned at levels 8, 14 and 20 can come from any school.", spells:["Mage Hand"], spellKind:"known"},
      {name:"Mage Hand Legerdemain", text:"When you cast Mage Hand, you can make the hand invisible, and it can also stow an object in, or retrieve one from, a container another creature wears or carries, and use thieves' tools at range. You can do one of these unnoticed with a DEX (Sleight of Hand) check contested by the creature's WIS (Perception). You can control the hand with your Cunning Action bonus action."}
    ],
    9:[{name:"Magical Ambush", text:"If you are hidden from a creature when you cast a spell on it, it has disadvantage on saving throws against the spell this turn."}],
    13:[{name:"Versatile Trickster", text:"As a bonus action, designate a creature within 5 feet of your Mage Hand Legerdemain hand; you have advantage on attack rolls against it until the end of the turn."}],
    17:[{name:"Spell Thief", text:"Immediately after a creature casts a spell that targets you or includes you in its area, you can use your reaction to force it to make a save with its spellcasting ability against your spell save DC. On a failure, you negate the spell's effect on you and, if it's 1st level or higher and of a level you can cast, you steal it: for 8 hours you know it and can cast it with your spell slots, and the creature can't cast it. Once per long rest."}]
  }},
  {name:"Swashbuckler", blurb:"A daring duelist who fights with flair and wins with charm.", features:{
    3:[
      {name:"Fancy Footwork", text:"During your turn, if you make a melee attack against a creature, it can't make opportunity attacks against you for the rest of your turn."},
      {name:"Rakish Audacity", text:"Add your CHA modifier to your initiative (already added on the sheet). You can also use Sneak Attack without advantage against a creature within 5 feet of you if no other creature is within 5 feet of you and you don't have disadvantage on the attack roll.", initiative:"cha"}
    ],
    9:[{name:"Panache", text:"As an action, make a CHA (Persuasion) check contested by a creature's WIS (Insight); it must be able to hear you and share a language with you. If it is hostile and you win, for 1 minute it has disadvantage on attack rolls against targets other than you and can't make opportunity attacks against anyone but you, ending if your companions attack it or affect it with a spell, or if you are more than 60 feet apart. If it isn't hostile and you win, it is charmed by you for 1 minute, regarding you as a friendly acquaintance, ending if you or your companions harm it."}],
    13:[{name:"Elegant Maneuver", text:"As a bonus action on your turn, you gain advantage on the next DEX (Acrobatics) or STR (Athletics) check you make during the same turn."}],
    17:[{name:"Master Duelist", text:"If you miss with an attack roll, you can roll it again with advantage. Once per short or long rest."}]
  }},
  {name:"Soulknife", blurb:"Focuses psionic energy into blades of psychic power.", features:{
    3:[
      {name:"Psionic Power", text:"You have Psionic Energy dice equal to twice your proficiency bonus: d6s, becoming d8s at level 5, d10s at 11 and d12s at 17. You regain one on a short rest and all on a long rest. Psi-Bolstered Knack: if you fail an ability check using a skill or tool you're proficient with, roll a die and add it; the die is spent only if you then succeed. Psychic Whispers: as an action, choose up to your proficiency bonus of creatures you can see and roll a die; for that many hours you and they can speak telepathically (within 1 mile). The first use after each long rest is free; later uses spend the die."},
      {name:"Psychic Blades", text:"Whenever you take the Attack action, you can manifest a psychic blade from your free hand and attack with it: a simple melee weapon with finesse and thrown (60 feet, no long range) that deals 1d6 + the attack's ability modifier psychic damage and vanishes after it hits or misses. Afterwards, you can attack with a second blade as a bonus action on the same turn if your other hand is free; its damage die is 1d4."}
    ],
    9:[{name:"Soul Blades", text:"Homing Strikes: if you miss with a Psychic Blades attack, roll a Psionic Energy die and add it to the roll; the die is spent only if the attack then hits. Psychic Teleportation: as a bonus action, spend and roll a die, throw a blade at an unoccupied space you can see up to 10 times the roll in feet away, and teleport there."}],
    13:[{name:"Psychic Veil", text:"As an action, you become invisible, along with what you wear and carry, for 1 hour or until you dismiss it. It ends early right after you deal damage to a creature or force one to make a saving throw. Once per long rest, or spend a Psionic Energy die to use it again."}],
    17:[{name:"Rend Mind", text:"When you deal Sneak Attack damage with your Psychic Blades, you can force the target to make a WIS save (DC 8 + proficiency bonus + DEX modifier) or be stunned for 1 minute, repeating the save at the end of each of its turns. Once per long rest, or spend three Psionic Energy dice (no action) to use it again."}]
  }},
  {name:"Phantom", blurb:"Flirts with death, drawing power from the boundary between life and undeath.", features:{
    3:[
      {name:"Whispers of the Dead", text:"Whenever you finish a short or long rest, you can gain one skill or tool proficiency of your choice. You lose it when you use this feature to choose a different one you lack."},
      {name:"Wails from the Grave", text:"Immediately after you deal Sneak Attack damage to a creature on your turn, you can target a second creature you can see within 30 feet of the first. Roll half your Sneak Attack dice (rounded up); it takes that much necrotic damage. Uses equal to your proficiency bonus per long rest."}
    ],
    9:[{name:"Tokens of the Departed", text:"As a reaction when a creature you can see dies within 30 feet, a Tiny soul trinket appears in your free hand; you can hold up to your proficiency bonus of them. While you carry one, you have advantage on death saves and CON saves. When you deal Sneak Attack damage on your turn, you can destroy one to use Wails from the Grave without spending a use. As an action, you can destroy one (wherever it is) to ask its spirit one question; it answers concisely, knowing only what it knew in life, and needn't be truthful."}],
    13:[{name:"Ghost Walk", text:"As a bonus action, assume a spectral form for 10 minutes (end it as a bonus action): a 10-foot flying speed with hover, attack rolls against you have disadvantage, and you can move through creatures and objects as difficult terrain, taking 1d10 force damage if you end your turn inside one. Once per long rest, or destroy a soul trinket as part of the bonus action to use it again.", speeds:[{type:"fly", value:10, when:"spectral form, 10 minutes, hover"}]}],
    17:[{name:"Death's Friend", text:"Wails from the Grave can deal its necrotic damage to both the first and the second creature. After you finish a long rest, a soul trinket appears in your hand if you have none."}]
  }},
  {name:"Scout", blurb:"An expert skirmisher and survivalist who strikes from range and keeps moving.", features:{
    3:[
      {name:"Skirmisher", text:"When an enemy ends its turn within 5 feet of you, you can use your reaction to move up to half your speed without provoking opportunity attacks."},
      {name:"Survivalist", text:"You gain proficiency in Nature and Survival (tick them on the Abilities & Skills tab), and your proficiency bonus is doubled for checks using them."}
    ],
    9:[{name:"Superior Mobility", text:"Your walking speed increases by 10 feet. (Already added to your speed.) If you have a climbing or swimming speed, those also increase by 10 feet.", speeds:[{type:"climb", bonus:10},{type:"swim", bonus:10}], speed:10}],
    13:[{name:"Ambush Master", text:"You have advantage on initiative rolls. The first creature you hit during the first round of a combat is easier to strike: attack rolls against it by anyone have advantage until the start of your next turn."}],
    17:[{name:"Sudden Strike", text:"If you take the Attack action on your turn, you can make one additional attack as a bonus action. It can use Sneak Attack even if you already have this turn, but not against the same target twice in a turn."}]
  }},
  {name:"Inquisitive", blurb:"A keen-eyed investigator who reads lies, spots clues and exploits a foe's weaknesses.", features:{
    3:[
      {name:"Ear for Deceit", text:"When you make a WIS (Insight) check to tell whether a creature is lying, treat a d20 roll of 7 or lower as an 8."},
      {name:"Eye for Detail", text:"As a bonus action, make a WIS (Perception) check to spot a hidden creature or object, or an INT (Investigation) check to uncover or decipher clues."},
      {name:"Insightful Fighting", text:"As a bonus action, make a WIS (Insight) check against a creature you can see that isn't incapacitated, contested by its CHA (Deception) check. If you win, you can use Sneak Attack against it even without advantage (but not with disadvantage) for 1 minute, or until you succeed with this feature against a different target."}
    ],
    9:[{name:"Steady Eye", text:"You have advantage on WIS (Perception) and INT (Investigation) checks if you move no more than half your speed on the same turn."}],
    13:[{name:"Unerring Eye", text:"As an action, sense the presence of illusions, shapechangers not in their true form, and other magic meant to deceive the senses within 30 feet, as long as you aren't blinded or deafened. You know something is trying to trick you, but not what it hides or its true nature. You can use this a number of times equal to your WIS modifier (minimum 1), regained on a long rest."}],
    17:[{name:"Eye for Weakness", text:"While your Insightful Fighting applies to a creature, your Sneak Attack damage against it increases by 3d6."}]
  }},
  {name:"Mastermind", blurb:"A schemer and spymaster who directs allies from the shadows and hides behind lies.", features:{
    3:[
      {name:"Master of Intrigue", text:"You gain proficiency with the disguise kit, the forgery kit and one gaming set, and learn two languages of your choice. You can also perfectly mimic the speech patterns and accent of a creature you've heard speak for at least 1 minute, passing yourself off as a native speaker of its land.", grants:{tools:["Disguise kit","Forgery kit","One gaming set"]}},
      {name:"Master of Tactics", text:"You can take the Help action as a bonus action. When you Help an ally attack a creature, that creature can be up to 30 feet away from you instead of 5, as long as it can see or hear you."}
    ],
    9:[{name:"Insightful Manipulator", text:"If you spend at least 1 minute observing or talking with a creature outside combat, the DM tells you whether it is your equal, superior or inferior in two of the following (your choice): INT score, WIS score, CHA score, or class levels. The DM may also reveal a piece of its history or one of its personality traits."}],
    13:[{name:"Misdirection", text:"When a creature targets you with an attack while another creature within 5 feet of you is giving you cover against it, you can use your reaction to make the attack target that creature instead."}],
    17:[{name:"Soul of Deceit", text:"Your thoughts can't be read by telepathy or other means unless you allow it. You can present false thoughts by winning a CHA (Deception) check against the reader's WIS (Insight). Magic that detects lies always shows you as truthful if you choose, and you can't be magically compelled to tell the truth."}]
  }},
  {name:"Misfortune Bringer", blurb:"Manipulates probability to curse foes with bad luck and capitalize on their failures.", features:{
    3:[
      {name:"Evil Eye", text:"As a bonus action, choose a creature you can see within 60 feet. It makes a CHA save against your misfortune save DC (8 + proficiency bonus + CHA modifier) or is marked by your evil eye for 1 minute, or until you mark a different creature. You can deal Sneak Attack damage to a marked creature as long as you don't have disadvantage on the attack roll."},
      {name:"Misfortunist", text:"You learn two misfortunes of your choice, and one more at rogue levels 9, 13 and 17; when you finish a long rest you can swap one you know for another. You have 4 Jinx Points to fuel them (6 from level 13), regained on a short or long rest. Each misfortune targets the creature marked by your Evil Eye. The level-up asks you to pick them, and the Misfortunes card on the Features & Feats tab lists them with their costs and your save DC."}
    ],
    9:[{name:"Steal Luck", text:"When a creature within 30 feet makes an attack roll, saving throw or ability check with advantage, you can use your reaction to remove the advantage from that roll and regain 1 expended Jinx Point. Once per short or long rest."}],
    13:[{name:"Curse Caster", text:"As an action, spend 3 Jinx Points to cast Bestow Curse without a spell slot, using Charisma as your spellcasting ability. You also gain 2 more Jinx Points (already added on the sheet)."}],
    17:[{name:"Improved Steal Luck", text:"You can use Steal Luck three times, regaining all uses when you finish a short or long rest."}]
  }}
];
