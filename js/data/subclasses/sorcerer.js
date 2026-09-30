/* Sorcerer subclasses: the full feature list for each one, keyed by class
   level. Assembled into SUBCLASSES in ../progression.js; see the comment
   there for the feature fields and flags. */
export var SORCERER_SUBCLASSES = [
  {name:"Draconic Bloodline", blurb:"Dragon blood grants toughness and elemental power.", features:{
    1:[
      {name:"Dragon Ancestor", text:"Choose a dragon type, which sets your damage type: Black or Copper (acid), Blue or Bronze (lightning), Brass, Gold or Red (fire), Green (poison), Silver or White (cold). You speak, read and write Draconic, and your proficiency bonus is doubled for CHA checks when interacting with dragons."},
      {name:"Draconic Resilience", text:"Your hit point maximum increases by 1 per sorcerer level, and while you wear no armor your AC is 13 + your DEX modifier. (Already added to your max HP and AC.)"}
    ],
    6:[{name:"Elemental Affinity", text:"When you cast a spell that deals your ancestry's damage type, add your CHA modifier to one damage roll of it. At the same time, you can spend 1 sorcery point to gain resistance to that damage type for 1 hour."}],
    14:[{name:"Dragon Wings", text:"As a bonus action, sprout dragon wings and gain a flying speed equal to your current speed, until you dismiss them as a bonus action. You can't manifest them while wearing armor unless it's made to accommodate them.", speeds:[{type:"fly", value:"walk", when:"wings out (bonus action)"}]}],
    18:[{name:"Draconic Presence", text:"As an action, spend 5 sorcery points to exude a 60-foot aura of awe or fear (your choice) for 1 minute or until your concentration ends (as if concentrating on a spell). Each hostile creature that starts its turn in the aura makes a WIS save or is charmed (awe) or frightened (fear) until the aura ends; one that succeeds is immune to it for 24 hours."}]
  }},
  {name:"Wild Magic", blurb:"Chaotic magic that surges unpredictably.", features:{
    1:[
      {name:"Wild Magic Surge", text:"Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table for a random magical effect."},
      {name:"Tides of Chaos", text:"Gain advantage on one attack roll, ability check or saving throw. Once per long rest, but before then the DM can have you roll on the Wild Magic Surge table right after you cast a sorcerer spell of 1st level or higher, and you regain the use."}
    ],
    6:[{name:"Bend Luck", text:"When another creature you can see makes an attack roll, ability check or saving throw, you can use your reaction and spend 2 sorcery points to roll 1d4 and add it to or subtract it from the roll (your choice), after it rolls but before any effects occur."}],
    14:[{name:"Controlled Chaos", text:"Whenever you roll on the Wild Magic Surge table, you can roll twice and use either number."}],
    18:[{name:"Spell Bombardment", text:"When you roll damage for a spell and roll the highest number possible on any of the dice, choose one of them, roll it again and add that roll to the damage. Once per turn."}]
  }},
  {name:"Clockwork Soul", blurb:"Draws power from Mechanus to impose order and nullify chaos.", features:{
    1:[
      {name:"Clockwork Magic", text:"You learn additional spells that don't count against your spells known: Alarm and Protection from Evil and Good (1st), Aid and Lesser Restoration (3rd), Dispel Magic and Protection from Energy (5th), Freedom of Movement and Summon Construct (7th), Greater Restoration and Wall of Force (9th). When you gain a sorcerer level, you can replace one with an abjuration or transmutation spell of the same level from the sorcerer, warlock or wizard list.", spells:{1:["Alarm","Protection from Evil and Good"], 3:["Aid","Lesser Restoration"], 5:["Dispel Magic","Protection from Energy"], 7:["Freedom of Movement","Summon Construct"], 9:["Greater Restoration","Wall of Force"]}, spellKind:"known"},
      {name:"Restore Balance", text:"When a creature you can see within 60 feet is about to roll a d20 with advantage or disadvantage, you can use your reaction to make the roll straight. Uses equal to your proficiency bonus per long rest."}
    ],
    6:[{name:"Bastion of Law", text:"As an action, spend 1 to 5 sorcery points to ward yourself or a creature you can see within 30 feet, with one d8 per point spent. When the warded creature takes damage, it can expend any number of those dice, roll them and reduce the damage by the total. The ward lasts until you finish a long rest or use this feature again."}],
    14:[{name:"Trance of Order", text:"As a bonus action, for 1 minute attack rolls against you can't benefit from advantage, and you can treat a d20 roll of 9 or lower on your attack rolls, ability checks and saving throws as a 10. Once per long rest, or spend 5 sorcery points to use it again."}],
    18:[{name:"Clockwork Cavalcade", text:"As an action, intangible spirits of order fill a 30-foot cube originating from you and then vanish: they restore up to 100 hit points, divided as you choose among creatures of your choice in the cube; repair every damaged object entirely in the cube; and end every spell of 6th level or lower on creatures and objects of your choice in it. Once per long rest, or spend 7 sorcery points to use it again."}]
  }},
  {name:"Aberrant Mind", blurb:"Touched by a psionic entity, warping mind and body with alien power.", features:{
    1:[
      {name:"Psionic Spells", text:"You learn additional spells that don't count against your spells known: Arms of Hadar, Dissonant Whispers and the Mind Sliver cantrip (1st), Calm Emotions and Detect Thoughts (3rd), Hunger of Hadar and Sending (5th), Evard's Black Tentacles and Summon Aberration (7th), Rary's Telepathic Bond and Telekinesis (9th). When you gain a sorcerer level, you can replace one with a divination or enchantment spell of the same level from the sorcerer, warlock or wizard list.", spells:{1:["Arms of Hadar","Dissonant Whispers","Mind Sliver"], 3:["Calm Emotions","Detect Thoughts"], 5:["Hunger of Hadar","Sending"], 7:["Evard's Black Tentacles","Summon Aberration"], 9:["Rary's Telepathic Bond","Telekinesis"]}, spellKind:"known"},
      {name:"Telepathic Speech", text:"As a bonus action, choose a creature you can see within 30 feet. For a number of minutes equal to your sorcerer level, you and it can speak telepathically while within a number of miles of each other equal to your CHA modifier (minimum 1), if it understands a language. It ends early if you are incapacitated or die, or connect with a different creature."}
    ],
    6:[
      {name:"Psionic Sorcery", text:"You can cast a 1st-level or higher spell from Psionic Spells by spending sorcery points equal to its level instead of a spell slot. Cast this way, it needs no verbal or somatic components, and no material components unless they are consumed."},
      {name:"Psychic Defenses", text:"You have resistance to psychic damage and advantage on saving throws against being charmed or frightened."}
    ],
    14:[{name:"Revelation in Flesh", text:"As a bonus action, spend 1 or more sorcery points to transform for 10 minutes, gaining one benefit per point: you see any invisible creature within 60 feet not behind total cover; a flying speed equal to your walking speed, with hover; a swimming speed equal to twice your walking speed, and you can breathe underwater; or your body becomes slimy and pliable, letting you move through spaces 1 inch wide without squeezing and spend 5 feet of movement to escape nonmagical restraints or a grapple.", speeds:[{type:"fly", value:"walk", when:"Revelation in Flesh, 10 minutes, hover"},{type:"swim", value:"2walk", when:"Revelation in Flesh, 10 minutes"}]}],
    18:[{name:"Warping Implosion", text:"As an action, teleport to an unoccupied space you can see within 120 feet. Each creature within 30 feet of the space you left makes a STR save, taking 3d10 force damage and being pulled toward that space on a failure, or half damage and no pull on a success. Once per long rest, or spend 5 sorcery points to use it again."}]
  }},
  {name:"Divine Soul", blurb:"Bears a divine spark that grants access to cleric spells alongside sorcery.", features:{
    1:[
      {name:"Divine Magic", text:"When you learn or replace a sorcerer cantrip or spell, you can choose it from the cleric list as well as the sorcerer list. Choose an affinity and learn its spell, which doesn't count against your spells known: Good (Cure Wounds), Evil (Inflict Wounds), Law (Bless), Chaos (Bane) or Neutrality (Protection from Evil and Good).", spellChoice:{id:"affinity",label:"Affinity",options:{Good:["Cure Wounds"],Evil:["Inflict Wounds"],Law:["Bless"],Chaos:["Bane"],Neutrality:["Protection from Evil and Good"]}}, spellKind:"known"},
      {name:"Favored by the Gods", text:"When you fail a saving throw or miss with an attack roll, you can roll 2d4 and add it to the total, possibly changing the outcome. Once per short or long rest."}
    ],
    6:[{name:"Empowered Healing", text:"When you or an ally within 5 feet rolls dice to determine the hit points a spell restores, you can spend 1 sorcery point to reroll any number of those dice once, if you aren't incapacitated. Once per turn."}],
    14:[{name:"Otherworldly Wings", text:"As a bonus action, manifest spectral wings (their look depends on your affinity) and gain a flying speed of 30 feet until you are incapacitated, die or dismiss them as a bonus action.", speeds:[{type:"fly", value:30, when:"wings out (bonus action)"}]}],
    18:[{name:"Unearthly Recovery", text:"As a bonus action when you have fewer than half your hit points remaining, regain hit points equal to half your hit point maximum. Once per long rest."}]
  }},
  {name:"Shadow Magic", blurb:"Born of shadow, drawing on the Shadowfell for dark and terrifying power.", features:{
    1:[
      {name:"Eyes of the Dark", text:"You have darkvision out to 120 feet. From level 3 you know Darkness (it doesn't count against your spells known) and can cast it with 2 sorcery points or a spell slot; cast with sorcery points, you can see through its darkness.", darkvision:{range:120}, spells:{3:["Darkness"]}, spellKind:"known"},
      {name:"Strength of the Grave", text:"When damage reduces you to 0 hit points, you can make a CHA save (DC 5 + the damage taken); on a success you drop to 1 hit point instead. It doesn't work against radiant damage or a critical hit. After a successful save, you can't use it again until you finish a long rest."}
    ],
    6:[{name:"Hound of Ill Omen", text:"As a bonus action, spend 3 sorcery points to summon a hound of ill omen targeting a creature you can see within 120 feet. It uses dire wolf statistics, but is a Medium monstrosity with temporary hit points equal to half your sorcerer level. It appears within 30 feet of the target, rolls its own initiative, always knows where the target is, can move through creatures and objects as difficult terrain (5 force damage if it ends its turn inside an object), and can only move toward and attack its target (including opportunity attacks). While it is within 5 feet of the target, the target has disadvantage on saves against your spells. It vanishes at 0 hit points, when the target drops to 0, or after 5 minutes."}],
    14:[{name:"Shadow Walk", text:"When you are in dim light or darkness, as a bonus action you can teleport up to 120 feet to an unoccupied space you can see that is also in dim light or darkness."}],
    18:[{name:"Umbral Form", text:"As a bonus action, spend 6 sorcery points to become shadowy for 1 minute (until incapacitated or dead): you have resistance to all damage except force and radiant, and you can move through creatures and objects as difficult terrain, taking 5 force damage if you end your turn inside an object."}]
  }},
  {name:"Storm Sorcery", blurb:"Innate magic of elemental air that lets you ride the winds and call down lightning and thunder.", features:{
    1:[
      {name:"Wind Speaker", text:"You can speak, read and write Primordial, which lets you understand and be understood by speakers of its dialects: Aquan, Auran, Ignan and Terran."},
      {name:"Tempestuous Magic", text:"Immediately before or after you cast a spell of 1st level or higher, you can use a bonus action to fly up to 10 feet without provoking opportunity attacks."}
    ],
    6:[
      {name:"Heart of the Storm", text:"You have resistance to lightning and thunder damage. Whenever you start casting a spell of 1st level or higher that deals lightning or thunder damage, creatures of your choice that you can see within 10 feet of you take lightning or thunder damage (your choice) equal to half your sorcerer level."},
      {name:"Storm Guide", text:"If it's raining, you can use an action to stop rain falling in a 20-foot-radius sphere centered on you (end it as a bonus action). If it's windy, you can use a bonus action each round to choose the wind's direction in a 100-foot-radius sphere centered on you, until the end of your next turn. Neither changes the wind's speed."}
    ],
    14:[{name:"Storm's Fury", text:"When a creature hits you with a melee attack, you can use your reaction to deal lightning damage to it equal to your sorcerer level. It must also make a STR save against your spell save DC or be pushed up to 20 feet straight away from you."}],
    18:[{name:"Wind Soul", text:"You are immune to lightning and thunder damage, and you gain a magical flying speed of 60 feet. As an action, you can reduce your flying speed to 30 feet for 1 hour and choose up to 3 + your CHA modifier creatures within 30 feet; they gain a magical flying speed of 30 feet for 1 hour. Once you share your flight this way, you can't do so again until you finish a short or long rest.", speeds:[{type:"fly", value:60}]}]
  }},
  {name:"Lunar Sorcery", blurb:"Draws power from the moons, shifting between full, new and crescent phases.", features:{
    1:[
      {name:"Lunar Embodiment", text:"You learn additional spells that don't count against your spells known, grouped by lunar phase (Full / New / Crescent): Shield, Ray of Sickness, Color Spray (1st); Lesser Restoration, Blindness/Deafness, Alter Self (3rd); Dispel Magic, Vampiric Touch, Phantom Steed (5th); Death Ward, Confusion, Hallucinatory Terrain (7th); Rary's Telepathic Bond, Hold Monster, Mislead (9th). When you finish a long rest, choose your current phase: Full Moon, New Moon or Crescent Moon. Once per long rest, you can cast the 1st-level spell of your current phase without expending a spell slot.", spells:{1:["Shield","Ray of Sickness","Color Spray"], 3:["Lesser Restoration","Blindness/Deafness","Alter Self"], 5:["Dispel Magic","Vampiric Touch","Phantom Steed"], 7:["Death Ward","Confusion","Hallucinatory Terrain"], 9:["Rary's Telepathic Bond","Hold Monster","Mislead"]}, spellKind:"known"},
      {name:"Moon Fire", text:"You learn the Sacred Flame cantrip, which doesn't count against your cantrips known. When you cast it, you can target one creature as normal, or two creatures within range that are within 5 feet of each other."}
    ],
    6:[
      {name:"Lunar Boons", text:"Each phase is tied to two schools of magic: Full Moon (abjuration and divination), New Moon (enchantment and necromancy) and Crescent Moon (illusion and transmutation). When you cast a spell with a spell slot from a school tied to your current phase, you can reduce the sorcery points you spend on Metamagic for it by 1 (minimum 0). You can do this a number of times equal to your proficiency bonus, regained on a long rest."},
      {name:"Waxing and Waning", text:"As a bonus action, spend 1 sorcery point to change your current lunar phase."}
    ],
    14:[{name:"Lunar Empowerment", text:"You gain a benefit from your current phase. Full Moon: as a bonus action, you can shed (or stop shedding) bright light in a 10-foot radius and dim light for another 10 feet, and you and your allies have advantage on INT (Investigation) and WIS (Perception) checks while in that bright light. New Moon: you have advantage on DEX (Stealth) checks, and while you are entirely in darkness, attack rolls against you have disadvantage. Crescent Moon: you have resistance to necrotic and radiant damage."}],
    18:[{name:"Lunar Phenomenon", text:"As a bonus action (or as part of the bonus action to change phase with Waxing and Waning), unleash the power of your current phase. Full Moon: each creature of your choice within 30 feet makes a CON save or is blinded until the end of its next turn, and one creature of your choice there regains 3d8 hit points. New Moon: each creature of your choice within 30 feet makes a DEX save or takes 3d10 necrotic damage and has its speed reduced to 0 until the end of its next turn, and you become invisible until the end of your next turn or until right after you make an attack roll or cast a spell. Crescent Moon: teleport up to 60 feet to an unoccupied space you can see, optionally bringing one willing creature within 5 feet of you; you both gain resistance to all damage until the start of your next turn. Once per long rest, or spend 5 sorcery points to use it again."}]
  }}
];
