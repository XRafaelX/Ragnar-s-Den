/* ---------------- Levelling, subclasses & multiclassing data ----------------
   5e (2014) progression. Level-1 class features live in classes.js
   (CLASSES_INFO[..].features); this file covers what each class gains
   from level 2 up. A feature with `replaces` swaps out an earlier
   feature of that name (e.g. Sneak Attack growing from 1d6 to 2d6), and
   `speed` is a flat walking-speed bonus applied when it's gained. */

import { ARTIFICER_SUBCLASSES } from "./subclasses/artificer.js";
import { BARBARIAN_SUBCLASSES } from "./subclasses/barbarian.js";
import { BARD_SUBCLASSES } from "./subclasses/bard.js";
import { CLERIC_SUBCLASSES } from "./subclasses/cleric.js";
import { DRUID_SUBCLASSES } from "./subclasses/druid.js";
import { FIGHTER_SUBCLASSES } from "./subclasses/fighter.js";
import { MONK_SUBCLASSES } from "./subclasses/monk.js";
import { PALADIN_SUBCLASSES } from "./subclasses/paladin.js";
import { RANGER_SUBCLASSES } from "./subclasses/ranger.js";
import { ROGUE_SUBCLASSES } from "./subclasses/rogue.js";
import { SORCERER_SUBCLASSES } from "./subclasses/sorcerer.js";
import { WARLOCK_SUBCLASSES } from "./subclasses/warlock.js";
import { WIZARD_SUBCLASSES } from "./subclasses/wizard.js";

/* Highest character level. Every class and subclass has its features
   filled in up to it. */
export var MAX_LEVEL = 20;

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
      2: [{name:"Infuse Item", text:"You learn artifice infusions and can turn ordinary items into magic ones after a long rest (e.g. +1 weapons or armor). You know 4 infusions and can have 2 infused items at once (6 and 3 at level 6, 8 and 4 at 10, 10 and 5 at 14, 12 and 6 at 18)."}],
      3: [{name:"The Right Tool for the Job", text:"With thieves' or artisan's tools in hand, you can spend 1 hour to magically create one set of artisan's tools."}],
      6: [{name:"Tool Expertise", text:"Your proficiency bonus is doubled for any ability check that uses your proficiency with a tool."}],
      7: [{name:"Flash of Genius", text:"When you or a creature you can see within 30 feet makes an ability check or saving throw, you can use your reaction to add your INT modifier to the roll. Uses equal to your INT modifier (minimum 1) per long rest."}],
      10: [{name:"Magic Item Adept", text:"You can attune to up to four magic items at once, and crafting a common or uncommon magic item takes you a quarter of the normal time and half the gold."}],
      11: [{name:"Spell-Storing Item", text:"When you finish a long rest, touch a simple or martial weapon or a spellcasting focus and store a 1st- or 2nd-level artificer spell with a casting time of 1 action in it. A creature holding it can use an action to produce the spell, using your spellcasting ability modifier. It holds twice your INT modifier (minimum 2) uses, until they're spent or you store another spell."}],
      14: [{name:"Magic Item Savant", text:"You can attune to up to five magic items at once, and you ignore all class, race, spell and level requirements on attuning to or using a magic item."}],
      18: [{name:"Magic Item Master", text:"You can attune to up to six magic items at once."}],
      20: [{name:"Soul of Artifice", text:"You gain a +1 bonus to all saving throws per magic item you are attuned to. When you are reduced to 0 hit points but not killed outright, you can use your reaction to end one of your artifice infusions and drop to 1 hit point instead."}]
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
        {name:"Fast Movement", text:"Your speed increases by 10 feet while you aren't wearing heavy armor. (Added to your speed while that's true.)", speed:10, speedWhen:"noHeavyArmor"}
      ],
      7: [{name:"Feral Instinct", text:"You have advantage on initiative rolls. If you are surprised at the start of combat and aren't incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else."}],
      9: [
        {name:"Rage", replaces:"Rage", text:"Bonus action to enter a rage for 1 minute: +3 damage on Strength melee weapon attacks, resistance to bludgeoning, piercing and slashing damage, and advantage on Strength checks and saves. You can't cast or concentrate on spells while raging. It ends early if you are knocked unconscious, or if your turn ends without you attacking a hostile creature or taking damage since your last turn."},
        {name:"Brutal Critical", text:"When you score a critical hit with a melee attack, roll one additional weapon damage die for the extra critical damage (two dice from level 13, three from level 17)."}
      ],
      11: [{name:"Relentless Rage", text:"If you drop to 0 hit points while raging and don't die outright, you can make a DC 10 CON save to drop to 1 hit point instead. Each later use adds 5 to the DC, which resets to 10 after a short or long rest."}],
      15: [{name:"Persistent Rage", text:"Your rage ends early only if you fall unconscious or choose to end it."}],
      16: [{name:"Rage", replaces:"Rage", text:"Bonus action to enter a rage for 1 minute: +4 damage on Strength melee weapon attacks, resistance to bludgeoning, piercing and slashing damage, and advantage on Strength checks and saves. You can't cast or concentrate on spells while raging. It ends early only if you fall unconscious or choose to end it."}],
      18: [{name:"Indomitable Might", text:"If your total for a Strength check is lower than your Strength score, you can use the score instead."}],
      20: [{name:"Primal Champion", text:"Your Strength and Constitution scores increase by 4, and their maximum becomes 24. (Already added to your scores and hit points.)", abilityBonus:{str:4, con:4}, abilityMax:24}]
    }
  },
  "Bard": {
    subclassLevel: 3, subclassLabel: "Bard College",
    prereq: [["cha"]], casterType: "full", spellAbility: "cha", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor"], weapons:[], tools:["One musical instrument"], note:"Also gain proficiency in one skill of your choice. Tick it on the Abilities & Skills tab."},
    features: {
      2: [
        {name:"Jack of All Trades", text:"Add half your proficiency bonus (rounded down) to any ability check that doesn't already include your proficiency bonus. (Already added to your checks, initiative and passive scores.)", halfProficiency:{abilities:"all", round:"down"}},
        {name:"Song of Rest", text:"During a short rest, allies who spend hit dice while hearing you perform regain an extra 1d6 hit points (1d8 at level 9, 1d10 at 13, 1d12 at 17)."}
      ],
      3: [{name:"Expertise", text:"Pick two skills you're proficient in: your proficiency bonus is doubled for them. Tick the E box next to them on the Abilities & Skills tab."}],
      5: [
        {name:"Bardic Inspiration", replaces:"Bardic Inspiration", text:"Bonus action to give an ally within 60 feet a d8 inspiration die to add to one ability check, attack roll or saving throw within 10 minutes. Uses equal to your Charisma modifier (minimum 1)."},
        {name:"Font of Inspiration", text:"You regain all your Bardic Inspiration uses on a short rest as well as a long rest."}
      ],
      6: [{name:"Countercharm", text:"As an action, start a performance lasting until the end of your next turn. You and friendly creatures within 30 feet that can hear you have advantage on saves against being frightened or charmed. It ends early if you are incapacitated or silenced, or you end it."}],
      10: [
        {name:"Bardic Inspiration", replaces:"Bardic Inspiration", text:"Bonus action to give an ally within 60 feet a d10 inspiration die to add to one ability check, attack roll or saving throw within 10 minutes. Uses equal to your Charisma modifier (minimum 1)."},
        {name:"Expertise", replaces:"Expertise", text:"Pick two more skills you're proficient in (four in total): your proficiency bonus is doubled for them. Tick the E box next to them on the Abilities & Skills tab."},
        {name:"Magical Secrets", text:"You learn two spells of your choice from any class (cantrips or spells of a level you can cast). They count as bard spells for you and are included in your spells known. You learn two more at levels 14 and 18."}
      ],
      15: [{name:"Bardic Inspiration", replaces:"Bardic Inspiration", text:"Bonus action to give an ally within 60 feet a d12 inspiration die to add to one ability check, attack roll or saving throw within 10 minutes. Uses equal to your Charisma modifier (minimum 1)."}],
      20: [{name:"Superior Inspiration", text:"When you roll initiative and have no Bardic Inspiration uses left, you regain one."}]
    }
  },
  "Cleric": {
    subclassLevel: 1, subclassLabel: "Divine Domain",
    prereq: [["wis"]], casterType: "full", spellAbility: "wis", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:[], tools:[], note:""},
    features: {
      2: [{name:"Channel Divinity", text:"Channel divine power once per short or long rest. Every cleric has Turn Undead (action: each undead within 30 feet that can see or hear you makes a WIS save or is turned for 1 minute or until it takes damage), and your domain adds another option."}],
      5: [{name:"Destroy Undead", text:"When an undead of challenge rating 1/2 or lower fails its save against your Turn Undead, it is destroyed instantly (CR 1 at level 8, CR 2 at 11, CR 3 at 14, CR 4 at 17)."}],
      6: [{name:"Channel Divinity", replaces:"Channel Divinity", text:"Channel divine power twice per short or long rest (three times from level 18). Every cleric has Turn Undead (action: each undead within 30 feet that can see or hear you makes a WIS save or is turned for 1 minute or until it takes damage), and your domain adds another option."}],
      10: [{name:"Divine Intervention", text:"As an action, describe the help you seek and roll percentile dice; if you roll equal to or lower than your cleric level, your deity intervenes (the DM chooses how). If it does, you can't use this again for 7 days; otherwise you can after a long rest. From level 20 the call succeeds automatically."}]
    }
  },
  "Druid": {
    subclassLevel: 2, subclassLabel: "Druid Circle",
    prereq: [["wis"]], casterType: "full", spellAbility: "wis", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:[], tools:[], note:""},
    features: {
      2: [{name:"Wild Shape", text:"Action to turn into a beast you've seen (max CR 1/4, no flying or swimming speed) for hours equal to half your druid level. Twice per short or long rest. You use the beast's hit points; when they hit 0 you turn back."}],
      4: [{name:"Wild Shape", replaces:"Wild Shape", text:"Action to turn into a beast you've seen (max CR 1/2, no flying speed) for hours equal to half your druid level. Twice per short or long rest. You use the beast's hit points; when they hit 0 you turn back."}],
      8: [{name:"Wild Shape", replaces:"Wild Shape", text:"Action to turn into a beast you've seen (max CR 1, flying allowed) for hours equal to half your druid level. Twice per short or long rest (unlimited from level 20). You use the beast's hit points; when they hit 0 you turn back."}],
      18: [
        {name:"Timeless Body", text:"You age only 1 year for every 10 that pass."},
        {name:"Beast Spells", text:"You can cast many of your druid spells in any Wild Shape form, performing their verbal and somatic components, but you can't provide material components."}
      ],
      20: [{name:"Archdruid", text:"You can use Wild Shape an unlimited number of times. You can ignore the verbal and somatic components of your druid spells, and material components that have no cost and aren't consumed, in normal and beast form."}]
    }
  },
  "Fighter": {
    subclassLevel: 3, subclassLabel: "Martial Archetype",
    fightingStyle: {level:1, options:["Archery","Defense","Dueling","Great Weapon Fighting","Protection","Two-Weapon Fighting"]},
    prereq: [["str"], ["dex"]], casterType: null, asiLevels: [4, 6, 8, 12, 14, 16, 19],
    multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons","Martial weapons"], tools:[], note:""},
    features: {
      2: [{name:"Action Surge", text:"Once per short or long rest, take one additional action on your turn, e.g. to attack again or cast a second spell with an action."}],
      5: [{name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}],
      9: [{name:"Indomitable", text:"You can reroll a saving throw that you fail, and you must use the new roll. Once per long rest (twice from level 13, three times from level 17)."}],
      11: [{name:"Extra Attack", replaces:"Extra Attack", text:"When you take the Attack action, you attack three times instead of once."}],
      17: [{name:"Action Surge", replaces:"Action Surge", text:"Twice per short or long rest, take one additional action on your turn, but only once on the same turn."}],
      20: [{name:"Extra Attack", replaces:"Extra Attack", text:"When you take the Attack action, you attack four times instead of once."}]
    }
  },
  "Monk": {
    subclassLevel: 3, subclassLabel: "Monastic Tradition",
    prereq: [["dex", "wis"]], casterType: null, asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:[], weapons:["Simple weapons","Shortswords"], tools:[], note:""},
    features: {
      2: [
        {name:"Ki", text:"You have ki points equal to your monk level, regained on a short or long rest. Spend 1 ki for: Flurry of Blows (two unarmed strikes as a bonus action), Patient Defense (Dodge as a bonus action) or Step of the Wind (Disengage or Dash as a bonus action, jump distance doubled). Save DC = 8 + proficiency + WIS."},
        {name:"Unarmored Movement", text:"Your speed increases by 10 feet while you wear no armor and no shield. (Added to your speed while that's true.)", speed:10, speedWhen:"unarmored"}
      ],
      3: [{name:"Deflect Missiles", text:"Reaction when hit by a ranged weapon attack: reduce the damage by 1d10 + DEX modifier + monk level. If that reduces it to 0 you can catch it and spend 1 ki to throw it back."}],
      4: [{name:"Slow Fall", text:"Reaction when you fall: reduce the falling damage by five times your monk level."}],
      5: [
        {name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."},
        {name:"Stunning Strike", text:"When you hit with a melee weapon attack, spend 1 ki: the target must make a Constitution save or be stunned until the end of your next turn."},
        {name:"Martial Arts", replaces:"Martial Arts", text:"Use DEX instead of STR for unarmed strikes and monk weapons, which deal 1d6 damage. When you take the Attack action with them, you can make one unarmed strike as a bonus action."}
      ],
      6: [
        {name:"Ki-Empowered Strikes", text:"Your unarmed strikes count as magical for overcoming resistance and immunity to nonmagical attacks and damage."},
        {name:"Unarmored Movement", replaces:"Unarmored Movement", text:"Your speed increases by 15 feet while you wear no armor and no shield. (Added to your speed while that's true.)", speed:5, speedWhen:"unarmored"}
      ],
      7: [
        {name:"Evasion", text:"When an effect lets you make a DEX save to take half damage, you take no damage on a success and half on a failure."},
        {name:"Stillness of Mind", text:"As an action, end one effect on yourself that is causing you to be charmed or frightened."}
      ],
      9: [{name:"Unarmored Movement", replaces:"Unarmored Movement", text:"Your speed increases by 15 feet while you wear no armor and no shield. (Added to your speed while that's true.) You can also move along vertical surfaces and across liquids on your turn without falling during the move."}],
      10: [
        {name:"Purity of Body", text:"You are immune to disease and poison."},
        {name:"Unarmored Movement", replaces:"Unarmored Movement", text:"Your speed increases by 20 feet while you wear no armor and no shield. (Added to your speed while that's true.) You can also move along vertical surfaces and across liquids on your turn without falling during the move.", speed:5, speedWhen:"unarmored"}
      ],
      11: [{name:"Martial Arts", replaces:"Martial Arts", text:"Use DEX instead of STR for unarmed strikes and monk weapons, which deal 1d8 damage. When you take the Attack action with them, you can make one unarmed strike as a bonus action."}],
      13: [{name:"Tongue of the Sun and Moon", text:"You understand all spoken languages, and any creature that understands a language can understand what you say."}],
      14: [
        {name:"Diamond Soul", text:"You gain proficiency in all saving throws (already applied to your saves). When you fail a saving throw, you can spend 1 ki to reroll it and take the second result.", grants:{savingThrows:["str","dex","con","int","wis","cha"]}},
        {name:"Unarmored Movement", replaces:"Unarmored Movement", text:"Your speed increases by 25 feet while you wear no armor and no shield. (Added to your speed while that's true.) You can also move along vertical surfaces and across liquids on your turn without falling during the move.", speed:5, speedWhen:"unarmored"}
      ],
      15: [{name:"Timeless Body", text:"You suffer none of the frailty of old age and can't be aged magically, but still die of old age. You no longer need food or water."}],
      17: [{name:"Martial Arts", replaces:"Martial Arts", text:"Use DEX instead of STR for unarmed strikes and monk weapons, which deal 1d10 damage. When you take the Attack action with them, you can make one unarmed strike as a bonus action."}],
      18: [
        {name:"Empty Body", text:"As an action, spend 4 ki to become invisible for 1 minute, with resistance to all damage except force. Or spend 8 ki to cast Astral Projection on yourself only, without material components."},
        {name:"Unarmored Movement", replaces:"Unarmored Movement", text:"Your speed increases by 30 feet while you wear no armor and no shield. (Added to your speed while that's true.) You can also move along vertical surfaces and across liquids on your turn without falling during the move.", speed:5, speedWhen:"unarmored"}
      ],
      20: [{name:"Perfect Self", text:"When you roll initiative and have no ki points left, you regain 4 ki points."}]
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
        {name:"Divine Smite", text:"When you hit with a melee weapon attack, spend a spell slot to deal an extra 2d8 radiant damage, +1d8 per slot level above 1st (to a maximum of 5d8), and +1d8 against undead or fiends."}
      ],
      3: [{name:"Divine Health", text:"You are immune to disease."}],
      5: [{name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}],
      6: [{name:"Aura of Protection", text:"While you're conscious, whenever you or a friendly creature within 10 feet of you makes a saving throw, it gains a bonus equal to your CHA modifier (minimum +1); it's already added to your own saves. The range becomes 30 feet at level 18.", saveBonus:"cha"}],
      10: [{name:"Aura of Courage", text:"While you're conscious, you and friendly creatures within 10 feet of you can't be frightened. The range becomes 30 feet at level 18."}],
      11: [{name:"Improved Divine Smite", text:"Whenever you hit a creature with a melee weapon, it takes an extra 1d8 radiant damage. This stacks with Divine Smite."}],
      14: [{name:"Cleansing Touch", text:"As an action, end one spell on yourself or on a willing creature you touch. Uses equal to your CHA modifier (minimum 1) per long rest."}]
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
      5: [{name:"Extra Attack", text:"When you take the Attack action, you attack twice instead of once."}],
      6: [
        {name:"Favored Enemy", replaces:"Favored Enemy", text:"Choose favored enemies (a type of creature, or two humanoid races): you have advantage on WIS (Survival) checks to track them and INT checks to recall information about them, and you learn a language they speak. You pick a second one at level 6 and a third at level 14."},
        {name:"Natural Explorer", replaces:"Natural Explorer", text:"Choose favored terrains (arctic, coast, desert, forest, grassland, mountain, swamp or Underdark). When you travel through one, difficult terrain doesn't slow your group, you can't become lost except by magic, you stay alert while doing other activities, you can move stealthily alone at a normal pace, you find twice as much food, and you learn more when tracking. Your proficiency bonus is doubled for INT and WIS checks about them. You pick a second terrain at level 6 and a third at level 10."}
      ],
      8: [{name:"Land's Stride", text:"Moving through nonmagical difficult terrain costs you no extra movement, and you can pass through nonmagical plants without being slowed or harmed by thorns, spines or similar hazards. You have advantage on saves against plants that are magically created or manipulated to impede movement."}],
      10: [{name:"Hide in Plain Sight", text:"Spend 1 minute creating camouflage against a solid surface. While you stay there without moving or taking actions or reactions, you have +10 to DEX (Stealth) checks; once you do, you must camouflage yourself again."}],
      14: [{name:"Vanish", text:"You can take the Hide action as a bonus action, and you can't be tracked by nonmagical means unless you choose to leave a trail."}],
      18: [{name:"Feral Senses", text:"Attacking a creature you can't see doesn't give you disadvantage, and you know where any invisible creature within 30 feet of you is, as long as it isn't hidden from you and you aren't blinded or deafened."}],
      20: [{name:"Foe Slayer", text:"Once on each of your turns, you can add your WIS modifier to the attack roll or the damage roll of an attack against one of your favored enemies, choosing before or after the roll but before its effects."}]
    }
  },
  "Rogue": {
    subclassLevel: 3, subclassLabel: "Roguish Archetype",
    prereq: [["dex"]], casterType: null, asiLevels: [4, 8, 10, 12, 16, 19],
    multiclassProfs: {armor:["Light armor"], weapons:[], tools:["Thieves' tools"], note:"Also gain proficiency in one skill from the rogue list. Tick it on the Abilities & Skills tab."},
    features: {
      2: [{name:"Cunning Action", text:"You can Dash, Disengage or Hide as a bonus action on each of your turns."}],
      3: [{name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 2d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."}],
      5: [
        {name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 3d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."},
        {name:"Uncanny Dodge", text:"Reaction when an attacker you can see hits you: halve the attack's damage."}
      ],
      6: [{name:"Expertise", replaces:"Expertise", text:"Your proficiency bonus is doubled for four of your skill proficiencies (or three and thieves' tools): the two from level 1 plus two more. Tick the E box next to them on the Abilities & Skills tab."}],
      7: [
        {name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 4d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."},
        {name:"Evasion", text:"When an effect lets you make a DEX save to take half damage, you take no damage on a success and half on a failure."}
      ],
      9: [{name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 5d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."}],
      11: [
        {name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 6d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."},
        {name:"Reliable Talent", text:"Whenever you make an ability check that uses your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10."}
      ],
      13: [{name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 7d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."}],
      14: [{name:"Blindsense", text:"If you can hear, you know the location of any hidden or invisible creature within 10 feet of you."}],
      15: [
        {name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 8d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."},
        {name:"Slippery Mind", text:"You gain proficiency in Wisdom saving throws (already applied to your saves).", grants:{savingThrows:["wis"]}}
      ],
      17: [{name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 9d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."}],
      18: [{name:"Elusive", text:"While you aren't incapacitated, no attack roll has advantage against you."}],
      19: [{name:"Sneak Attack", replaces:"Sneak Attack", text:"Once per turn, deal an extra 10d6 damage to a creature you hit with a finesse or ranged weapon if you have advantage on the attack roll, or if another enemy of the target is within 5 feet of it (and you don't have disadvantage)."}],
      20: [{name:"Stroke of Luck", text:"If your attack misses a target within range, you can turn the miss into a hit; or if you fail an ability check, you can treat the d20 roll as a 20. Once per short or long rest."}]
    }
  },
  "Sorcerer": {
    subclassLevel: 1, subclassLabel: "Sorcerous Origin",
    prereq: [["cha"]], casterType: "full", spellAbility: "cha", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:[], weapons:[], tools:[], note:""},
    features: {
      2: [{name:"Font of Magic", text:"You have sorcery points equal to your sorcerer level, regained on a long rest. As a bonus action, expend a spell slot to gain points equal to its level, or spend points to create a slot: 1st (2 points), 2nd (3), 3rd (5), 4th (7) or 5th (9); created slots vanish on a long rest."}],
      3: [{name:"Metamagic", text:"You learn two Metamagic options (a third at level 10, a fourth at 17), fuelled by sorcery points: ways to twist your spells, such as Quickened Spell (cast as a bonus action) or Twinned Spell (a second target). You can use one per spell; Empowered and Seeking can be added to another. The level-up asks you to pick them, and the Metamagic card on the Features & Feats tab lists them with their costs."}],
      10: [{name:"Metamagic", replaces:"Metamagic", text:"You know three Metamagic options (a fourth at level 17), fuelled by sorcery points. The level-up asks you to pick the new one, and the Metamagic card on the Features & Feats tab lists them with their costs."}],
      17: [{name:"Metamagic", replaces:"Metamagic", text:"You know four Metamagic options, fuelled by sorcery points. The level-up asks you to pick the new one, and the Metamagic card on the Features & Feats tab lists them with their costs."}],
      20: [{name:"Sorcerous Restoration", text:"You regain 4 expended sorcery points whenever you finish a short rest."}]
    }
  },
  "Warlock": {
    subclassLevel: 1, subclassLabel: "Otherworldly Patron",
    prereq: [["cha"]], casterType: "pact", spellAbility: "cha", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:["Light armor"], weapons:["Simple weapons"], tools:[], note:""},
    features: {
      2: [{name:"Eldritch Invocations", text:"You learn two eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). The level-up asks you to pick them, and the Eldritch invocations card on the Features & Feats tab lists them and applies what they do."}],
      3: [{name:"Pact Boon", text:"Your patron grants a gift: Pact of the Chain (a special familiar), Pact of the Blade (summon a magic weapon you're proficient with), Pact of the Tome (a book with three extra cantrips from any class) or, from Tasha's, Pact of the Talisman (an amulet that adds a d4 to a failed ability check). You choose it in the level-up; it's shown in the Eldritch invocations card."}],
      5: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know three eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). You can swap one each time you gain a warlock level. The level-up asks you to pick them, and the Eldritch invocations card on the Features & Feats tab lists them and applies what they do."}],
      7: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know four eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). You can swap one each time you gain a warlock level. The level-up asks you to pick them, and the Eldritch invocations card on the Features & Feats tab lists them and applies what they do."}],
      9: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know five eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). You can swap one each time you gain a warlock level. The level-up asks you to pick them, and the Eldritch invocations card on the Features & Feats tab lists them and applies what they do."}],
      11: [{name:"Mystic Arcanum", text:"Choose one 6th-level warlock spell as an arcanum; you can cast it once per long rest without a spell slot. You gain a 7th-level arcanum at level 13, 8th at 15 and 9th at 17."}],
      12: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know six eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). You can swap one each time you gain a warlock level. The level-up asks you to pick them, and the Eldritch invocations card on the Features & Feats tab lists them and applies what they do."}],
      15: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know seven eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). You can swap one each time you gain a warlock level. The level-up asks you to pick them, and the Eldritch invocations card on the Features & Feats tab lists them and applies what they do."}],
      18: [{name:"Eldritch Invocations", replaces:"Eldritch Invocations", text:"You know eight eldritch invocations: permanent magical upgrades such as Agonizing Blast (add CHA to Eldritch Blast damage) or Devil's Sight (see in magical darkness). You can swap one each time you gain a warlock level. The level-up asks you to pick them, and the Eldritch invocations card on the Features & Feats tab lists them and applies what they do."}],
      20: [{name:"Eldritch Master", text:"You can spend 1 minute entreating your patron to regain all your expended Pact Magic slots. Once per long rest."}]
    }
  },
  "Wizard": {
    subclassLevel: 2, subclassLabel: "Arcane Tradition",
    prereq: [["int"]], casterType: "full", spellAbility: "int", asiLevels: STANDARD_ASI,
    multiclassProfs: {armor:[], weapons:[], tools:[], note:""},
    features: {
      18: [{name:"Spell Mastery", text:"Choose a 1st-level and a 2nd-level wizard spell in your spellbook. While you have them prepared, you can cast them at their lowest level without a spell slot. You can swap either choice after 8 hours of study."}],
      20: [{name:"Signature Spells", text:"Choose two 3rd-level wizard spells in your spellbook. They are always prepared (not counting against your prepared spells), and you can cast each once at 3rd level without a spell slot, regained on a short or long rest."}]
    }
  }
};

/* Subclasses, one file per class in ./subclasses/. `features` is keyed by
   class level and runs to each subclass's last feature. casterType
   "third" marks the Eldritch Knight / Arcane Trickster style one-third
   casters. Homebrew subclasses are added to these arrays at runtime
   (custom-subclasses.js), so SUBCLASSES must stay one shared object. */
export var SUBCLASSES = {
  "Artificer": ARTIFICER_SUBCLASSES,
  "Barbarian": BARBARIAN_SUBCLASSES,
  "Bard": BARD_SUBCLASSES,
  "Cleric": CLERIC_SUBCLASSES,
  "Druid": DRUID_SUBCLASSES,
  "Fighter": FIGHTER_SUBCLASSES,
  "Monk": MONK_SUBCLASSES,
  "Paladin": PALADIN_SUBCLASSES,
  "Ranger": RANGER_SUBCLASSES,
  "Rogue": ROGUE_SUBCLASSES,
  "Sorcerer": SORCERER_SUBCLASSES,
  "Warlock": WARLOCK_SUBCLASSES,
  "Wizard": WIZARD_SUBCLASSES
};

/* What to do about spells after reaching a class level; shown in the
   "you unlocked" popup so new players know what to pick. */
export var SPELL_TIPS = {
  "Artificer": {1:"Pick 2 artificer cantrips. You prepare INT modifier + half your artificer level (min 1) spells each day.", 2:"Learn 4 infusions and infuse up to 2 items in the Artifice infusions card on the Features tab.", 5:"2nd-level artificer spells are now available to prepare.", 6:"Learn 2 more infusions (6 known, up to 3 infused items).", 9:"3rd-level artificer spells are now available to prepare.", 10:"Learn 1 new artificer cantrip. Learn 2 more infusions (8 known, up to 4 infused items).", 13:"4th-level artificer spells are now available to prepare.", 14:"Learn 1 new artificer cantrip. Learn 2 more infusions (10 known, up to 5 infused items).", 17:"5th-level artificer spells are now available to prepare.", 18:"Learn 2 more infusions (12 known, up to 6 infused items)."},
  "Bard": {1:"Pick 2 bard cantrips and 4 1st-level bard spells.", 2:"Learn 1 new bard spell.", 3:"Learn 1 new bard spell.", 4:"Learn 1 new bard spell and 1 new cantrip.", 5:"Learn 1 new bard spell. 3rd-level spells are now available.", 6:"Learn 1 new bard spell.", 7:"Learn 1 new bard spell. 4th-level spells are now available.", 8:"Learn 1 new bard spell.", 9:"Learn 1 new bard spell. 5th-level spells are now available.", 10:"Learn 2 spells from any class (Magical Secrets) and 1 new cantrip.", 11:"Learn 1 new bard spell. 6th-level spells are now available.", 13:"Learn 1 new bard spell. 7th-level spells are now available.", 14:"Learn 2 spells from any class (Magical Secrets).", 15:"Learn 1 new bard spell. 8th-level spells are now available.", 17:"Learn 1 new bard spell. 9th-level spells are now available.", 18:"Learn 2 spells from any class (Magical Secrets)."},
  "Cleric": {1:"Pick 3 cleric cantrips. You prepare WIS modifier + cleric level spells from the whole cleric list each day.", 3:"2nd-level cleric spells are now available to prepare.", 4:"Learn 1 new cleric cantrip.", 5:"3rd-level cleric spells are now available to prepare.", 7:"4th-level cleric spells are now available to prepare.", 9:"5th-level cleric spells are now available to prepare.", 10:"Learn 1 new cleric cantrip.", 11:"6th-level cleric spells are now available to prepare.", 13:"7th-level cleric spells are now available to prepare.", 15:"8th-level cleric spells are now available to prepare.", 17:"9th-level cleric spells are now available to prepare."},
  "Druid": {1:"Pick 2 druid cantrips. You prepare WIS modifier + druid level spells from the druid list each day.", 3:"2nd-level druid spells are now available to prepare.", 4:"Learn 1 new druid cantrip.", 5:"3rd-level druid spells are now available to prepare.", 7:"4th-level druid spells are now available to prepare.", 9:"5th-level druid spells are now available to prepare.", 10:"Learn 1 new druid cantrip.", 11:"6th-level druid spells are now available to prepare.", 13:"7th-level druid spells are now available to prepare.", 15:"8th-level druid spells are now available to prepare.", 17:"9th-level druid spells are now available to prepare."},
  "Paladin": {2:"You prepare CHA modifier + half your paladin level spells from the paladin list each day.", 5:"2nd-level paladin spells are now available to prepare.", 9:"3rd-level paladin spells are now available to prepare.", 13:"4th-level paladin spells are now available to prepare.", 17:"5th-level paladin spells are now available to prepare."},
  "Ranger": {2:"Learn 2 1st-level ranger spells.", 3:"Learn 1 new ranger spell.", 5:"Learn 1 new ranger spell. 2nd-level spells are now available.", 7:"Learn 1 new ranger spell.", 9:"Learn 1 new ranger spell. 3rd-level spells are now available.", 11:"Learn 1 new ranger spell.", 13:"Learn 1 new ranger spell. 4th-level spells are now available.", 15:"Learn 1 new ranger spell.", 17:"Learn 1 new ranger spell. 5th-level spells are now available.", 19:"Learn 1 new ranger spell."},
  "Sorcerer": {1:"Pick 4 sorcerer cantrips and 2 1st-level sorcerer spells.", 2:"Learn 1 new sorcerer spell.", 3:"Learn 1 new sorcerer spell.", 4:"Learn 1 new sorcerer spell and 1 new cantrip.", 5:"Learn 1 new sorcerer spell. 3rd-level spells are now available.", 6:"Learn 1 new sorcerer spell.", 7:"Learn 1 new sorcerer spell. 4th-level spells are now available.", 8:"Learn 1 new sorcerer spell.", 9:"Learn 1 new sorcerer spell. 5th-level spells are now available.", 10:"Learn 1 new sorcerer spell and 1 new cantrip.", 11:"Learn 1 new sorcerer spell. 6th-level spells are now available.", 13:"Learn 1 new sorcerer spell. 7th-level spells are now available.", 15:"Learn 1 new sorcerer spell. 8th-level spells are now available.", 17:"Learn 1 new sorcerer spell. 9th-level spells are now available."},
  "Warlock": {1:"Pick 2 warlock cantrips and 2 1st-level warlock spells.", 2:"Learn 1 new warlock spell.", 3:"Learn 1 new warlock spell. Your pact slots are now 2nd level.", 4:"Learn 1 new warlock spell and 1 new cantrip.", 5:"Learn 1 new warlock spell. Your pact slots are now 3rd level.", 6:"Learn 1 new warlock spell.", 7:"Learn 1 new warlock spell. Your pact slots are now 4th level.", 8:"Learn 1 new warlock spell.", 9:"Learn 1 new warlock spell. Your pact slots are now 5th level.", 10:"Learn 1 new warlock cantrip.", 11:"Learn 1 new warlock spell. You now have 3 pact slots, and choose a 6th-level Mystic Arcanum spell.", 13:"Learn 1 new warlock spell. Choose a 7th-level Mystic Arcanum spell.", 15:"Learn 1 new warlock spell. Choose an 8th-level Mystic Arcanum spell.", 17:"Learn 1 new warlock spell. You now have 4 pact slots, and choose a 9th-level Mystic Arcanum spell.", 19:"Learn 1 new warlock spell."},
  "Wizard": {1:"Pick 3 wizard cantrips and 6 1st-level spells for your spellbook.", 2:"Add 2 wizard spells to your spellbook.", 3:"Add 2 wizard spells to your spellbook. 2nd-level spells are now available.", 4:"Add 2 wizard spells to your spellbook and learn 1 new cantrip.", 5:"Add 2 wizard spells to your spellbook. 3rd-level spells are now available.", 6:"Add 2 wizard spells to your spellbook.", 7:"Add 2 wizard spells to your spellbook. 4th-level spells are now available.", 8:"Add 2 wizard spells to your spellbook.", 9:"Add 2 wizard spells to your spellbook. 5th-level spells are now available.", 10:"Add 2 wizard spells to your spellbook and learn 1 new cantrip.", 11:"Add 2 wizard spells to your spellbook. 6th-level spells are now available.", 12:"Add 2 wizard spells to your spellbook.", 13:"Add 2 wizard spells to your spellbook. 7th-level spells are now available.", 14:"Add 2 wizard spells to your spellbook.", 15:"Add 2 wizard spells to your spellbook. 8th-level spells are now available.", 16:"Add 2 wizard spells to your spellbook.", 17:"Add 2 wizard spells to your spellbook. 9th-level spells are now available.", 18:"Add 2 wizard spells to your spellbook.", 19:"Add 2 wizard spells to your spellbook.", 20:"Add 2 wizard spells to your spellbook."}
};
export var THIRD_CASTER_SPELL_TIPS = {
  3:"Learn 2 wizard cantrips and 3 1st-level wizard spells.",
  4:"Learn 1 new wizard spell.",
  7:"Learn 1 new wizard spell. 2nd-level spells are now available.",
  8:"Learn 1 new wizard spell (from any school).",
  10:"Learn 1 new wizard spell and 1 new wizard cantrip.",
  11:"Learn 1 new wizard spell.",
  13:"Learn 1 new wizard spell. 3rd-level spells are now available.",
  14:"Learn 1 new wizard spell (from any school).",
  16:"Learn 1 new wizard spell.",
  19:"Learn 1 new wizard spell. 4th-level spells are now available.",
  20:"Learn 1 new wizard spell (from any school)."
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
