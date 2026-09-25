/* ---------------- Race details ----------------
   Structured data for every race in RACES: the Compendium shows it, and
   races.js derives the one-line summaries and the creation wizard's
   language picks from it.

   asi:        fixed ability score increases, e.g. {dex:2, wis:1}.
   asiText:    for flexible increases ("+2 to one score, +1 to another").
   size:       "Medium", "Small", or "Small or Medium".
   speed:      {walk, fly?, swim?, climb?} in feet.
   darkvision: range in feet (0 = none; 120 = superior darkvision).
   languages:  {fixed:[…], choose:n}.
   traits:     [{name, text}] short paraphrases of each trait.
   source:     where it's from. Expanded races use their original
               (2014-era) versions, matching the rest of the app. */

function tr(name, text){ return {name:name, text:text}; }
var ELF_BASE = [
  tr("Keen Senses", "Proficiency in the Perception skill."),
  tr("Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."),
  tr("Trance", "You meditate for 4 hours instead of sleeping 8 to get the benefit of a long rest.")
];
var DWARF_BASE = [
  tr("Dwarven Resilience", "Advantage on saves against poison, and resistance to poison damage."),
  tr("Dwarven Combat Training", "Proficiency with battleaxes, handaxes, light hammers and warhammers."),
  tr("Tool Proficiency", "Proficiency with smith's tools, brewer's supplies or mason's tools (your choice)."),
  tr("Stonecunning", "Double proficiency on History checks about the origin of stonework."),
  tr("Unslowed", "Heavy armor doesn't reduce your speed.")
];
var HALFLING_BASE = [
  tr("Lucky", "When you roll a 1 on an attack roll, ability check or saving throw, reroll the die and use the new roll."),
  tr("Brave", "Advantage on saves against being frightened."),
  tr("Halfling Nimbleness", "You can move through the space of any creature larger than you.")
];
var GNOME_CUNNING = tr("Gnome Cunning", "Advantage on Intelligence, Wisdom and Charisma saves against magic.");
var POWERFUL_BUILD = tr("Powerful Build", "You count as one size larger for carrying capacity and what you can push, drag or lift.");
var SUNLIGHT = tr("Sunlight Sensitivity", "Disadvantage on attack rolls and sight-based Perception checks when you or your target are in direct sunlight.");

export var RACE_DATA = {
  /* ---- Standard (SRD / Player's Handbook) ---- */
  "Human": {asi:{str:1,dex:1,con:1,int:1,wis:1,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Player's Handbook",
    traits:[tr("Versatile", "No special traits, but +1 to every ability score makes humans good at anything.")]},
  "Variant Human": {asiText:"+1 to two different ability scores of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Player's Handbook",
    traits:[tr("Skills", "Proficiency in one skill of your choice."), tr("Feat", "You gain one feat of your choice at level 1.")]},
  "Hill Dwarf": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Dwarvish"]}, source:"Player's Handbook",
    traits:DWARF_BASE.concat([tr("Dwarven Toughness", "Your hit point maximum increases by 1, and by 1 more every time you gain a level.")])},
  "Mountain Dwarf": {asi:{str:2,con:2}, size:"Medium", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Dwarvish"]}, source:"Player's Handbook",
    traits:DWARF_BASE.concat([tr("Dwarven Armor Training", "Proficiency with light and medium armor.")])},
  "High Elf": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Elf Weapon Training", "Proficiency with longswords, shortswords, shortbows and longbows."),
      tr("Cantrip", "You know one wizard cantrip of your choice, cast with Intelligence.")])},
  "Wood Elf": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:35}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Elf Weapon Training", "Proficiency with longswords, shortswords, shortbows and longbows."),
      tr("Fleet of Foot", "Your base walking speed is 35 feet."),
      tr("Mask of the Wild", "You can try to hide when only lightly obscured by foliage, rain, snow, mist or similar.")])},
  "Dark Elf (Drow)": {asi:{dex:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:120,
    languages:{fixed:["Common","Elvish"]}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Superior Darkvision", "Darkvision out to 120 feet."), SUNLIGHT,
      tr("Drow Magic", "You know Dancing Lights; Faerie Fire once per long rest from level 3 and Darkness from level 5, cast with Charisma."),
      tr("Drow Weapon Training", "Proficiency with rapiers, shortswords and hand crossbows.")])},
  "Lightfoot Halfling": {asi:{dex:2,cha:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Player's Handbook",
    traits:HALFLING_BASE.concat([tr("Naturally Stealthy", "You can try to hide even when only obscured by a creature at least one size larger than you.")])},
  "Stout Halfling": {asi:{dex:2,con:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Player's Handbook",
    traits:HALFLING_BASE.concat([tr("Stout Resilience", "Advantage on saves against poison, and resistance to poison damage.")])},
  "Dragonborn": {asi:{str:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Draconic"]}, source:"Player's Handbook",
    traits:[
      tr("Draconic Ancestry", "Choose a dragon type; it sets your breath weapon and resistance damage type."),
      tr("Breath Weapon", "Action: exhale a line or cone of your damage type, 2d6 (more at levels 6, 11 and 16). DEX or CON save for half. Once per short or long rest."),
      tr("Damage Resistance", "Resistance to the damage type of your draconic ancestry.")]},
  "Rock Gnome": {asi:{int:2,con:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Player's Handbook",
    traits:[GNOME_CUNNING,
      tr("Artificer's Lore", "Double proficiency on History checks about magic items, alchemical objects or technology."),
      tr("Tinker", "Proficiency with tinker's tools; build tiny clockwork devices like a toy, fire starter or music box.")]},
  "Forest Gnome": {asi:{int:2,dex:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Player's Handbook",
    traits:[GNOME_CUNNING,
      tr("Natural Illusionist", "You know the Minor Illusion cantrip, cast with Intelligence."),
      tr("Speak with Small Beasts", "You can communicate simple ideas with Small or smaller beasts.")]},
  "Half-Elf": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to two other scores of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Player's Handbook",
    traits:[tr("Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."),
      tr("Skill Versatility", "Proficiency in two skills of your choice.")]},
  "Half-Orc": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Orc"]}, source:"Player's Handbook",
    traits:[tr("Menacing", "Proficiency in the Intimidation skill."),
      tr("Relentless Endurance", "When reduced to 0 HP but not killed outright, drop to 1 HP instead. Once per long rest."),
      tr("Savage Attacks", "On a melee weapon critical hit, roll one of the weapon's damage dice one more time and add it.")]},
  "Tiefling": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Player's Handbook",
    traits:[tr("Hellish Resistance", "Resistance to fire damage."),
      tr("Infernal Legacy", "You know Thaumaturgy; Hellish Rebuke once per long rest from level 3 and Darkness from level 5, cast with Charisma.")]},

  /* ---- Expanded ---- */
  "Aarakocra": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:25, fly:50}, darkvision:0,
    languages:{fixed:["Common","Aarakocra","Auran"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Flight", "Flying speed of 50 feet, but not while wearing medium or heavy armor."),
      tr("Talons", "Your unarmed strikes deal 1d4 slashing damage.")]},
  "Aasimar": {asi:{cha:2}, asiText:"+2 Charisma, plus +1 from your subrace (Protector: WIS, Scourge: CON, Fallen: STR)", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Celestial"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Celestial Resistance", "Resistance to necrotic and radiant damage."),
      tr("Healing Hands", "Action: touch a creature to restore hit points equal to your level. Once per long rest."),
      tr("Light Bearer", "You know the Light cantrip, cast with Charisma."),
      tr("Celestial Revelation", "From level 3, transform once per long rest for 1 minute (radiant wings, radiant aura or necrotic shroud, by subrace).")]},
  "Bugbear": {asi:{str:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Long-Limbed", "Your melee attacks on your turn have 5 feet more reach."), POWERFUL_BUILD,
      tr("Sneaky", "Proficiency in the Stealth skill."),
      tr("Surprise Attack", "In the first round of combat, deal an extra 2d6 damage to a surprised creature you hit.")]},
  "Centaur": {asi:{str:2,wis:1}, size:"Medium", speed:{walk:40}, darkvision:0,
    languages:{fixed:["Common","Sylvan"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Fey", "Your creature type is fey rather than humanoid."),
      tr("Charge", "After moving 30 feet straight toward a target and hitting it with a melee weapon, make a hooves attack as a bonus action."),
      tr("Hooves", "Unarmed strikes with your hooves deal 1d4 + STR bludgeoning damage."),
      tr("Equine Build", "You count as Large for carrying capacity; climbing costs 4 extra feet per foot."),
      tr("Survivor", "Proficiency in one of Animal Handling, Medicine, Nature or Survival.")]},
  "Changeling": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:2}, source:"Eberron: Rising from the Last War",
    traits:[tr("Shapechanger", "Action: change your appearance and voice (not your equipment or size category) until you change back."),
      tr("Changeling Instincts", "Proficiency in two of Deception, Insight, Intimidation and Persuasion.")]},
  "Deep Gnome (Svirfneblin)": {asi:{int:2,dex:1}, size:"Small", speed:{walk:25}, darkvision:120,
    languages:{fixed:["Common","Gnomish","Undercommon"]}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Superior Darkvision", "Darkvision out to 120 feet."), GNOME_CUNNING,
      tr("Stone Camouflage", "Advantage on Stealth checks to hide in rocky terrain.")]},
  "Duergar": {asi:{con:2,str:1}, size:"Medium", speed:{walk:25}, darkvision:120,
    languages:{fixed:["Common","Dwarvish","Undercommon"]}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Superior Darkvision", "Darkvision out to 120 feet."),
      tr("Duergar Resilience", "Advantage on saves against illusions and against being charmed or paralyzed."),
      tr("Dwarven Resilience", "Advantage on saves against poison, and resistance to poison damage."),
      tr("Duergar Magic", "From level 3, cast Enlarge/Reduce (enlarge only) on yourself, and from level 5 Invisibility on yourself, each once per long rest."),
      SUNLIGHT]},
  "Eladrin": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([tr("Fey Step", "Bonus action: teleport up to 30 feet to a space you can see. Once per short or long rest; your season adds an extra effect.")])},
  "Fairy": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small", speed:{walk:30, fly:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"The Wild Beyond the Witchlight",
    traits:[tr("Fey", "Your creature type is fey rather than humanoid."),
      tr("Fairy Magic", "You know Druidcraft; Faerie Fire from level 3 and Enlarge/Reduce from level 5, each once per long rest."),
      tr("Flight", "Flying speed equal to your walking speed, but not while wearing medium or heavy armor.")]},
  "Firbolg": {asi:{wis:2,str:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Elvish","Giant"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Firbolg Magic", "Cast Detect Magic and Disguise Self (can seem 3 feet shorter) once each per short or long rest."),
      tr("Hidden Step", "Bonus action: turn invisible until the start of your next turn or until you attack. Once per short or long rest."),
      POWERFUL_BUILD,
      tr("Speech of Beast and Leaf", "Beasts and plants understand the meaning of your words, and you have advantage on Charisma checks to influence them.")]},
  "Genasi (Air)": {asi:{con:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Unending Breath", "You can hold your breath indefinitely while not incapacitated."),
      tr("Mingle with the Wind", "Cast Levitate once per long rest, using Constitution.")]},
  "Genasi (Earth)": {asi:{con:2,str:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Earth Walk", "Difficult terrain made of earth or stone doesn't slow you."),
      tr("Merge with Stone", "Cast Pass without Trace once per long rest, using Constitution.")]},
  "Genasi (Fire)": {asi:{con:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Fire Resistance", "Resistance to fire damage."),
      tr("Reach to the Blaze", "You know Produce Flame; from level 3 cast Burning Hands once per long rest, using Constitution.")]},
  "Genasi (Water)": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Acid Resistance", "Resistance to acid damage."),
      tr("Amphibious", "You can breathe air and water."),
      tr("Call to the Wave", "You know Shape Water; from level 3 cast Create or Destroy Water as a 2nd-level spell once per long rest, using Constitution.")]},
  "Gith (Githyanki)": {asi:{str:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Gith"], choose:1}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Decadent Mastery", "Proficiency in one skill or tool of your choice (plus one extra language)."),
      tr("Martial Prodigy", "Proficiency with light and medium armor, shortswords, longswords and greatswords."),
      tr("Githyanki Psionics", "You know Mage Hand (invisible); Jump from level 3 and Misty Step from level 5, each once per long rest, using Intelligence.")]},
  "Gith (Githzerai)": {asi:{wis:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Gith"]}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Mental Discipline", "Advantage on saves against being charmed or frightened."),
      tr("Githzerai Psionics", "You know Mage Hand (invisible); Shield from level 3 and Detect Thoughts from level 5, each once per long rest, using Wisdom.")]},
  "Goblin": {asi:{dex:2,con:1}, size:"Small", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Fury of the Small", "Once per short or long rest, deal extra damage equal to your level to a creature larger than you."),
      tr("Nimble Escape", "Disengage or Hide as a bonus action on each of your turns.")]},
  "Goliath": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Giant"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Natural Athlete", "Proficiency in the Athletics skill."),
      tr("Stone's Endurance", "Reaction when you take damage: reduce it by 1d12 + CON. Once per short or long rest."),
      POWERFUL_BUILD,
      tr("Mountain Born", "Resistance to cold damage, and you're used to high altitude.")]},
  "Harengon": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"The Wild Beyond the Witchlight",
    traits:[tr("Hare-Trigger", "Add your proficiency bonus to initiative rolls."),
      tr("Leporine Senses", "Proficiency in the Perception skill."),
      tr("Lucky Footwork", "Reaction when you fail a DEX save: add 1d4 to the roll."),
      tr("Rabbit Hop", "Bonus action: jump 5 × your proficiency bonus in feet without provoking opportunity attacks. Uses equal to your proficiency bonus per long rest.")]},
  "Hobgoblin": {asi:{con:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Martial Training", "Proficiency with two martial weapons of your choice and with light armor."),
      tr("Saving Face", "When you miss an attack or fail a check or save, gain a bonus equal to the number of allies you can see (max +5). Once per short or long rest.")]},
  "Kenku": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Auran"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Expert Forgery", "Advantage on checks to copy writing and craftwork you've seen."),
      tr("Kenku Training", "Proficiency in two of Acrobatics, Deception, Stealth and Sleight of Hand."),
      tr("Mimicry", "You can mimic sounds and voices you've heard; you can only speak using mimicry.")]},
  "Kobold": {asi:{dex:2,str:-2}, size:"Small", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Grovel, Cower and Beg", "Action: cower pathetically so allies have advantage on attacks against enemies within 10 feet of you. Once per short or long rest."),
      tr("Pack Tactics", "Advantage on attacks against a creature if an ally is within 5 feet of it."),
      SUNLIGHT]},
  "Lizardfolk": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Bite", "Your bite is a natural weapon dealing 1d6 + STR piercing damage."),
      tr("Cunning Artisan", "During a short rest, craft a shield, club, javelin or darts from a slain creature's bones and hide."),
      tr("Hold Breath", "You can hold your breath for 15 minutes."),
      tr("Hunter's Lore", "Proficiency in two of Animal Handling, Nature, Perception, Stealth and Survival."),
      tr("Natural Armor", "Without armor, your AC is 13 + DEX. A shield still adds."),
      tr("Hungry Jaws", "Bonus action: bite a creature and gain temporary HP equal to your CON modifier on a hit. Once per short or long rest.")]},
  "Loxodon": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Loxodon"]}, source:"Guildmasters' Guide to Ravnica",
    traits:[POWERFUL_BUILD,
      tr("Loxodon Serenity", "Advantage on saves against being charmed or frightened."),
      tr("Natural Armor", "Without armor, your AC is 12 + CON. A shield still adds."),
      tr("Trunk", "A prehensile trunk that can grab, lift and manipulate simple objects, and use as a snorkel."),
      tr("Keen Smell", "Advantage on Perception, Survival and Investigation checks that rely on smell.")]},
  "Minotaur": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Minotaur"]}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Horns", "Your horns are a natural weapon dealing 1d6 + STR piercing damage."),
      tr("Goring Rush", "After Dashing and moving 20 feet, make a horns attack as a bonus action."),
      tr("Hammering Horns", "After hitting with a melee attack, shove the target with your horns as a bonus action."),
      tr("Imposing Presence", "Proficiency in Intimidation or Persuasion (your choice).")]},
  "Orc": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Orc"]}, source:"Eberron: Rising from the Last War",
    traits:[tr("Aggressive", "Bonus action: move up to your speed toward an enemy you can see."),
      tr("Primal Intuition", "Proficiency in two of Animal Handling, Insight, Intimidation, Medicine, Nature, Perception and Survival."),
      POWERFUL_BUILD]},
  "Satyr": {asi:{cha:2,dex:1}, size:"Medium", speed:{walk:35}, darkvision:0,
    languages:{fixed:["Common","Sylvan"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Fey", "Your creature type is fey rather than humanoid."),
      tr("Ram", "Headbutts deal 1d4 + STR bludgeoning damage."),
      tr("Magic Resistance", "Advantage on saving throws against spells."),
      tr("Mirthful Leaps", "When you make a long or high jump, roll a d8 and add that many feet."),
      tr("Reveler", "Proficiency in Performance and Persuasion, and with one musical instrument.")]},
  "Sea Elf": {asi:{dex:2,con:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:60,
    languages:{fixed:["Common","Elvish","Aquan"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([
      tr("Child of the Sea", "You can breathe air and water, and have resistance to cold damage."),
      tr("Friend of the Sea", "You can communicate simple ideas with beasts that have a swimming speed."),
      tr("Sea Elf Training", "Proficiency with spears, tridents, light crossbows and nets.")])},
  "Shadar-kai": {asi:{dex:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([
      tr("Necrotic Resistance", "Resistance to necrotic damage."),
      tr("Blessing of the Raven Queen", "Bonus action: teleport up to 15 feet (from level 3 you also gain resistance to all damage until your next turn). Once per long rest.")])},
  "Shifter": {asiText:"Depends on your shifter type: Beasthide +2 CON +1 STR, Longtooth +2 STR +1 DEX, Swiftstride +2 DEX +1 CHA, Wildhunt +2 WIS +1 DEX", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"]}, source:"Eberron: Rising from the Last War",
    traits:[tr("Keen Senses", "Proficiency in the Perception skill."),
      tr("Shifting", "Bonus action: shift for 1 minute, gaining temporary HP equal to your level + CON and a bonus from your shifter type. Once per short or long rest.")]},
  "Simic Hybrid": {asi:{con:2}, asiText:"+2 Constitution, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Animal Enhancement", "Pick a graft at level 1 (Manta Glide, Nimble Climber or Underwater Adaptation) and another at level 5 (such as Grappling Appendages, Carapace or Acid Spit).")]},
  "Tabaxi": {asi:{dex:2,cha:1}, size:"Medium", speed:{walk:30, climb:20}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Volo's Guide to Monsters",
    traits:[tr("Feline Agility", "Double your speed until the end of the turn; recharges after a turn where you don't move."),
      tr("Cat's Claws", "Climbing speed of 20 feet, and your claws deal 1d4 + STR slashing damage."),
      tr("Cat's Talent", "Proficiency in the Perception and Stealth skills.")]},
  "Thri-kreen": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Adventures in Space",
    traits:[tr("Chameleon Carapace", "Without armor, your AC is 13 + DEX; action: change color for advantage on Stealth to hide."),
      tr("Secondary Arms", "Two smaller arms that can hold light weapons and objects."),
      tr("Sleepless", "You don't need to sleep and can stay conscious during a long rest."),
      tr("Thri-kreen Telepathy", "You can speak telepathically to a creature within 120 feet that shares a language with you.")]},
  "Tortle": {asi:{str:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Aquan"]}, source:"The Tortle Package",
    traits:[tr("Claws", "Your claws deal 1d4 + STR slashing damage."),
      tr("Hold Breath", "You can hold your breath for up to 1 hour."),
      tr("Natural Armor", "Your shell gives AC 17 (DEX doesn't apply). You can't wear armor, but a shield still adds."),
      tr("Shell Defense", "Action: withdraw into your shell for +4 AC and advantage on STR and CON saves, but you're prone and can't move."),
      tr("Survival Instinct", "Proficiency in the Survival skill.")]},
  "Triton": {asi:{str:1,con:1,cha:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Amphibious", "You can breathe air and water."),
      tr("Control Air and Water", "Cast Fog Cloud; from level 3 Gust of Wind and from level 5 Wall of Water, each once per long rest, using Charisma."),
      tr("Emissary of the Sea", "Aquatic beasts understand your speech, and you can communicate simple ideas with them."),
      tr("Guardians of the Depths", "Resistance to cold damage, and you ignore the drawbacks of deep water.")]},
  "Vedalken": {asi:{int:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Vedalken"], choose:1}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Vedalken Dispassion", "Advantage on Intelligence, Wisdom and Charisma saves."),
      tr("Tireless Precision", "Proficiency in one of Arcana, History, Investigation, Medicine, Performance or Sleight of Hand, and one tool; add a d4 to checks with them."),
      tr("Partially Amphibious", "You can breathe underwater for up to 1 hour, once per long rest.")]},
  "Verdan": {asi:{cha:2,con:1}, size:"Small", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Goblin"], choose:1}, source:"Acquisitions Incorporated",
    traits:[tr("Black Blood Healing", "When you roll a 1 or 2 on a Hit Die to regain HP, reroll it and use the new roll."),
      tr("Limited Telepathy", "Speak telepathically to a creature within 30 feet that understands a language."),
      tr("Persuasive", "Proficiency in the Persuasion skill."),
      tr("Telepathic Insight", "Advantage on Wisdom and Charisma saves."),
      tr("Growth", "You grow from Small to Medium at level 5.")]},
  "Warforged": {asi:{con:2}, asiText:"+2 Constitution, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Constructed Resilience", "Advantage on saves against poison, resistance to poison damage, immune to disease, and no need to eat, drink or breathe."),
      tr("Sentry's Rest", "A long rest is 6 hours of inactivity, during which you stay aware of your surroundings."),
      tr("Integrated Protection", "+1 to AC; armor you're proficient with is part of your body and takes 1 hour to don or doff."),
      tr("Specialized Design", "Proficiency in one skill and one tool of your choice.")]},
  "Yuan-ti Pureblood": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Abyssal","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Innate Spellcasting", "You know Poison Spray; cast Animal Friendship on snakes at will, and from level 3 Suggestion once per long rest, using Charisma."),
      tr("Magic Resistance", "Advantage on saving throws against spells and other magical effects."),
      tr("Poison Immunity", "Immunity to poison damage and the poisoned condition.")]}
};

var ABILITY_SHORT = {str:"STR", dex:"DEX", con:"CON", int:"INT", wis:"WIS", cha:"CHA"};

/* "+2 DEX, +1 WIS" (or the flexible text). */
export function raceAsiText(d){
  if(d.asiText) return d.asiText;
  var keys = Object.keys(d.asi||{});
  if(keys.length===6 && keys.every(function(k){ return d.asi[k]===1; })) return "+1 to every ability score";
  return keys.map(function(k){ return (d.asi[k]>0 ? "+" : "−")+Math.abs(d.asi[k])+" "+ABILITY_SHORT[k]; }).join(", ");
}
/* Compact form for list rows: the fixed part, "+more" when there's a
   choice on top, or "Flexible" when it's all the player's choice. */
export function raceAsiShort(d){
  var keys = Object.keys(d.asi||{});
  if(!keys.length) return "Flexible";
  if(keys.length===6 && keys.every(function(k){ return d.asi[k]===1; })) return "+1 all";
  var fixed = keys.map(function(k){ return (d.asi[k]>0 ? "+" : "−")+Math.abs(d.asi[k])+" "+ABILITY_SHORT[k]; }).join(", ");
  return d.asiText ? fixed+", +more" : fixed;
}
/* "30 ft, fly 50 ft". */
export function raceSpeedText(d){
  var s = d.speed || {walk:30};
  var out = [s.walk+" ft"];
  ["fly","swim","climb"].forEach(function(k){ if(s[k]) out.push(k+" "+s[k]+" ft"); });
  return out.join(", ");
}
