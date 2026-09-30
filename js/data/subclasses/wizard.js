/* Wizard subclasses: the full feature list for each one, keyed by class
   level. Assembled into SUBCLASSES in ../progression.js; see the comment
   there for the feature fields and flags. */
export var WIZARD_SUBCLASSES = [
  {name:"School of Evocation", blurb:"Blasts with raw elemental energy.", features:{
    2:[
      {name:"Evocation Savant", text:"Copying evocation spells into your spellbook costs half the gold and time."},
      {name:"Sculpt Spells", text:"When you cast an evocation spell that affects other creatures you can see, choose up to 1 + the spell's level of them: they automatically succeed on their saves against it, and take no damage if they would take half on a success."}
    ],
    6:[{name:"Potent Cantrip", text:"When a creature succeeds on a save against your cantrip, it takes half the cantrip's damage (if any) but suffers no other effect from it."}],
    10:[{name:"Empowered Evocation", text:"Add your INT modifier to one damage roll of any wizard evocation spell you cast."}],
    14:[{name:"Overchannel", text:"When you cast a wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with it. The first use after a long rest is free; each later use before a long rest deals you 2d12 necrotic damage per spell level, increasing by 1d12 per level each further time, and this damage ignores resistance and immunity."}]
  }},
  {name:"School of Abjuration", blurb:"Protective wards and dispelling magic.", features:{
    2:[
      {name:"Abjuration Savant", text:"Copying abjuration spells into your spellbook costs half the gold and time."},
      {name:"Arcane Ward", text:"When you cast an abjuration spell of 1st level or higher, you can create a ward on yourself that lasts until you finish a long rest (once per long rest). Its hit point maximum is twice your wizard level + your INT modifier. It takes damage instead of you, and you take any excess. At 0 hit points it absorbs nothing but remains, and whenever you cast an abjuration spell of 1st level or higher it regains twice the spell's level in hit points."}
    ],
    6:[{name:"Projected Ward", text:"When a creature you can see within 30 feet takes damage, you can use your reaction to have your Arcane Ward absorb it; the creature takes any excess."}],
    10:[{name:"Improved Abjuration", text:"When you cast an abjuration spell that requires an ability check (such as Counterspell or Dispel Magic), add your proficiency bonus to that check."}],
    14:[{name:"Spell Resistance", text:"You have advantage on saving throws against spells and resistance to the damage of spells."}]
  }},
  {name:"School of Divination", blurb:"Sees the future and bends fate.", features:{
    2:[
      {name:"Divination Savant", text:"Copying divination spells into your spellbook costs half the gold and time."},
      {name:"Portent", text:"When you finish a long rest, roll two d20s and record them. You can replace any attack roll, saving throw or ability check made by you or a creature you can see with one of them, choosing before the roll; each can be used once, only one per turn. Unused rolls are lost at your next long rest."}
    ],
    6:[{name:"Expert Divination", text:"When you cast a divination spell of 2nd level or higher with a spell slot, you regain one expended slot of a lower level than the spell (5th level at most)."}],
    10:[{name:"The Third Eye", text:"As an action, gain one benefit until you are incapacitated or take a short or long rest: darkvision out to 60 feet; seeing into the Ethereal Plane within 60 feet; reading any language; or seeing invisible creatures and objects within 10 feet in your line of sight. Once per short or long rest."}],
    14:[{name:"Greater Portent", text:"You roll three d20s for Portent instead of two."}]
  }},
  {name:"School of Illusion", blurb:"Fools the senses with illusions.", features:{
    2:[
      {name:"Illusion Savant", text:"Copying illusion spells into your spellbook costs half the gold and time."},
      {name:"Improved Minor Illusion", text:"You learn Minor Illusion if you don't know it (it doesn't count against your cantrips known), and you can create both a sound and an image with a single casting.", spells:["Minor Illusion"], spellKind:"known"}
    ],
    6:[{name:"Malleable Illusions", text:"When you cast an illusion spell with a duration of 1 minute or longer, you can use your action to change the illusion (within the spell's normal limits) while you can see it."}],
    10:[{name:"Illusory Self", text:"When a creature makes an attack roll against you, you can use your reaction to interpose an illusory duplicate: the attack automatically misses. Once per short or long rest."}],
    14:[{name:"Illusory Reality", text:"When you cast an illusion spell of 1st level or higher, you can use a bonus action on your turn while it lasts to make one inanimate, nonmagical object in the illusion real for 1 minute. It can't deal damage or otherwise directly harm anyone."}]
  }},
  {name:"School of Necromancy", blurb:"Commands life, death and undeath.", features:{
    2:[
      {name:"Necromancy Savant", text:"Copying necromancy spells into your spellbook costs half the gold and time."},
      {name:"Grim Harvest", text:"Once per turn when you kill one or more creatures with a spell of 1st level or higher, you regain hit points equal to twice the spell's level, or three times its level for a necromancy spell. Killing constructs or undead doesn't count."}
    ],
    6:[{name:"Undead Thralls", text:"You add Animate Dead to your spellbook, and when you cast it you can animate one additional corpse or pile of bones. Undead you create with necromancy spells add your wizard level to their hit point maximum and your proficiency bonus to their weapon damage rolls.", spells:["Animate Dead"], spellKind:"spellbook"}],
    10:[{name:"Inured to Undeath", text:"You have resistance to necrotic damage, and your hit point maximum can't be reduced."}],
    14:[{name:"Command Undead", text:"As an action, choose an undead you can see within 60 feet. It makes a CHA save against your spell save DC (with advantage if its INT is 8 or higher). On a failure, it is friendly and obeys you until you use this again; if its INT is 12 or higher, it repeats the save every hour. On a success, you can't use this on it again."}]
  }},
  {name:"Bladesinging", blurb:"An elven tradition blending arcane magic with fluid, lethal swordplay.", features:{
    2:[
      {name:"Training in War and Song", text:"You gain proficiency with light armor and one type of one-handed melee weapon of your choice, and in Performance if you don't have it (tick it on the Abilities & Skills tab).", grants:{armor:["Light armor"]}},
      {name:"Bladesong", text:"As a bonus action, start the Bladesong for 1 minute. It ends early if you are incapacitated, don medium or heavy armor or a shield, or use two hands to attack with a weapon, and you can dismiss it at any time. While it's active: add your INT modifier (minimum +1) to your AC and to CON saves to maintain concentration, your walking speed increases by 10 feet, and you have advantage on DEX (Acrobatics) checks. Uses equal to your proficiency bonus per long rest."}
    ],
    6:[{name:"Extra Attack", text:"When you take the Attack action, you can attack twice, and you can cast one of your cantrips in place of one of those attacks."}],
    10:[{name:"Song of Defense", text:"While your Bladesong is active, when you take damage you can use your reaction and expend a spell slot to reduce the damage by five times the slot's level."}],
    14:[{name:"Song of Victory", text:"While your Bladesong is active, add your INT modifier (minimum +1) to the damage of your melee weapon attacks."}]
  }},
  {name:"War Magic", blurb:"Fuses offensive spellcasting with battlefield resilience and reactions.", features:{
    2:[
      {name:"Arcane Deflection", text:"When you are hit by an attack or fail a saving throw, you can use your reaction to gain +2 AC against that attack or +4 to that save. You then can't cast spells other than cantrips until the end of your next turn."},
      {name:"Tactical Wit", text:"Add your Intelligence modifier to your initiative rolls. (Already added to your initiative.)", initiative:"int"}
    ],
    6:[{name:"Power Surge", text:"You can store up to your INT modifier (minimum 1) in power surges. After a long rest you have exactly one. You gain one when you end a spell with Dispel Magic or Counterspell, and if you finish a short rest with none. Once per turn when you deal damage to a creature or object with a wizard spell, you can spend one to deal extra force damage equal to half your wizard level."}],
    10:[{name:"Durable Magic", text:"While you maintain concentration on a spell, you have a +2 bonus to AC and all saving throws."}],
    14:[{name:"Deflecting Shroud", text:"When you use Arcane Deflection, up to three creatures of your choice you can see within 60 feet each take force damage equal to half your wizard level."}]
  }},
  {name:"Order of Scribes", blurb:"Awakens the magic of the spellbook itself as a powerful arcane companion.", features:{
    2:[
      {name:"Wizardly Quill", text:"As a bonus action, create a Tiny magic quill in your free hand. It needs no ink, copying a spell into your spellbook with it takes 2 minutes per spell level, and you can erase its writing within 5 feet as a bonus action. It vanishes if you create another or die."},
      {name:"Awakened Spellbook", text:"While holding your spellbook: it can be your spellcasting focus for wizard spells; when you cast a wizard spell with a spell slot, you can swap its damage type for one that appears in another spell of the same level in your book; and once per long rest, you can cast a wizard spell as a ritual in its normal casting time instead of adding 10 minutes."}
    ],
    6:[{name:"Manifest Mind", text:"As a bonus action, manifest your spellbook's mind as a Tiny intangible spectral object within 60 feet. It sheds dim light in a 10-foot radius, can see and hear (darkvision 60 feet) and shares that with you telepathically, and you can move it up to 30 feet as a bonus action. When you cast a wizard spell on your turn, you can cast it as if you were in its space, using its senses, a number of times equal to your proficiency bonus per long rest. It ends if it's more than 300 feet from you, is dispelled, your book is destroyed, you die or you dismiss it. Once per long rest, or expend a spell slot to conjure it again."}],
    10:[{name:"Master Scrivener", text:"When you finish a long rest, you can use your Wizardly Quill to copy a 1st- or 2nd-level spell from your spellbook, with a casting time of 1 action, onto a blank scroll. The spell counts as one level higher, you cast it by reading it as an action, and it vanishes when cast or at your next long rest. You also halve the gold and time to craft spell scrolls with your quill."}],
    14:[{name:"One with the Word", text:"You have advantage on INT (Arcana) checks while your spellbook is on you. When you take damage while your spellbook's mind is manifested, you can use your reaction to dismiss it and prevent all of that damage. Roll 3d6: your spellbook loses spells of your choice with a combined level at least equal to the roll (you drop to 0 hit points if it doesn't have enough), and you can't cast them until you finish 1d6 long rests. Once per long rest."}]
  }},
  {name:"School of Conjuration", blurb:"Summons creatures and objects and teleports across the battlefield.", features:{
    2:[
      {name:"Conjuration Savant", text:"Copying conjuration spells into your spellbook costs half the gold and time."},
      {name:"Minor Conjuration", text:"As an action, conjure an inanimate nonmagical object you have seen, no larger than 3 feet on a side and no heavier than 10 pounds, in your hand or on the ground within 10 feet. It is visibly magical, shedding dim light for 5 feet, and disappears after 1 hour, when you use this again, or if it takes or deals damage."}
    ],
    6:[{name:"Benign Transposition", text:"As an action, teleport up to 30 feet to an unoccupied space you can see, or swap places with a willing Small or Medium creature in range. Once used, you can't do so again until you finish a long rest or cast a conjuration spell of 1st level or higher."}],
    10:[{name:"Focused Conjuration", text:"While you are concentrating on a conjuration spell, taking damage can't break your concentration."}],
    14:[{name:"Durable Summons", text:"Any creature you summon or create with a conjuration spell has 30 temporary hit points."}]
  }},
  {name:"School of Enchantment", blurb:"Bends minds, charms enemies and manipulates social interactions.", features:{
    2:[
      {name:"Enchantment Savant", text:"Copying enchantment spells into your spellbook costs half the gold and time."},
      {name:"Hypnotic Gaze", text:"As an action, choose a creature you can see within 5 feet that can see or hear you. It makes a WIS save against your spell save DC or is charmed by you until the end of your next turn: its speed drops to 0 and it is incapacitated and visibly dazed. On later turns you can use your action to extend it until the end of your next turn. It ends if you move more than 5 feet away, the creature can neither see nor hear you, or it takes damage. Once it ends, or if the creature succeeds on the first save, you can't use this on that creature again until you finish a long rest."}
    ],
    6:[{name:"Instinctive Charm", text:"When a creature you can see within 30 feet makes an attack roll against you, and another creature is within the attack's range, you can use your reaction (before knowing if it hits) to make the attacker make a WIS save against your spell save DC. On a failure, it must target the creature closest to it, other than you or itself. On a success, you can't use this on it again until you finish a long rest. Creatures that can't be charmed are immune."}],
    10:[{name:"Split Enchantment", text:"When you cast an enchantment spell of 1st level or higher that targets only one creature, you can have it target a second creature."}],
    14:[{name:"Alter Memories", text:"When you cast an enchantment spell to charm one or more creatures, you can make one of them unaware it was charmed. Once before the spell ends, you can use your action to make that creature make an INT save against your spell save DC or lose up to 1 + your CHA modifier (minimum 1) hours of memories, no more than the spell's duration."}]
  }},
  {name:"School of Transmutation", blurb:"Alters physical forms, mutates matter and crafts a powerful Transmuter's Stone.", features:{
    2:[
      {name:"Transmutation Savant", text:"Copying transmutation spells into your spellbook costs half the gold and time."},
      {name:"Minor Alchemy", text:"Transform a nonmagical object made entirely of wood, stone (not gemstone), iron, copper or silver into another of those materials, 1 cubic foot per 10 minutes of work. It reverts after 1 hour or when your concentration ends (as if concentrating on a spell)."}
    ],
    6:[{name:"Transmuter's Stone", text:"Over 8 hours, create a transmuter's stone. Whoever holds it gains one benefit you choose when you make it: darkvision 60 feet; +10 feet speed while unencumbered; proficiency in CON saves; or resistance to acid, cold, fire, lightning or thunder damage (your choice). While it's on you, you can change its benefit whenever you cast a transmutation spell of 1st level or higher. Making a new stone ends the old one."}],
    10:[{name:"Shapechanger", text:"You add Polymorph to your spellbook and can cast it without a spell slot, targeting only yourself and becoming a beast of challenge rating 1 or lower. Once per short or long rest.", spells:["Polymorph"], spellKind:"spellbook"}],
    14:[{name:"Master Transmuter", text:"As an action, consume your transmuter's stone for one effect (you can't make a new one until you finish a long rest). Major Transformation: over 10 minutes, turn a nonmagical object up to a 5-foot cube into another nonmagical object of similar size and mass and equal or lesser value. Panacea: a creature you touch is cured of all curses, diseases and poisons and regains all its hit points. Restore Life: cast Raise Dead on a creature you touch with the stone, without a spell slot or having it in your spellbook. Restore Youth: a willing creature's apparent age drops by 3d10 years (minimum 13), without extending its lifespan."}]
  }},
  {name:"Chronurgy Magic", blurb:"Manipulates the flow of time to reroll fate, freeze foes and store spells for later.", features:{
    2:[
      {name:"Chronal Shift", text:"After you or a creature you can see within 30 feet makes an attack roll, ability check or saving throw, you can use your reaction to force it to reroll, deciding after you see whether the roll succeeds or fails. The creature must use the second roll. You have two uses, regained on a long rest."},
      {name:"Temporal Awareness", text:"Add your INT modifier to your initiative rolls. (Already added to your initiative.)", initiative:"int"}
    ],
    6:[{name:"Momentary Stasis", text:"As an action, force a Large or smaller creature you can see within 60 feet to make a CON save against your spell save DC. On a failure it is encased in magical energy until the end of your next turn or until it takes damage: it is incapacitated and its speed is 0. You can use this a number of times equal to your INT modifier (minimum 1), regained on a long rest."}],
    10:[{name:"Arcane Abeyance", text:"When you cast a spell using a spell slot of 4th level or lower, you can freeze it in a Tiny gray bead for 1 hour (AC 15, 1 HP, immune to poison and psychic damage). A creature holding the bead can use its action to release the spell, which uses your spell attack bonus and save DC but treats that creature as the caster otherwise. If the hour passes or the bead is destroyed, the spell is lost. Once per short or long rest."}],
    14:[{name:"Convergent Future", text:"When you or a creature you can see within 60 feet makes an attack roll, ability check or saving throw, you can use your reaction to ignore the die and decide that the number rolled is either the minimum needed to succeed or one less (your choice). You gain one level of exhaustion each time, which only a long rest removes."}]
  }},
  {name:"Graviturgy Magic", blurb:"Bends gravity to make things lighter or heavier, pull foes around and crush them in place.", features:{
    2:[{name:"Adjust Density", text:"As an action, halve or double the weight of one Large or smaller creature or object you can see within 30 feet (Huge or smaller from level 10) for up to 1 minute, concentrating as if on a spell. Halved: +10 feet of speed, jumps twice as far, and disadvantage on STR checks and saves. Doubled: -10 feet of speed and advantage on STR checks and saves."}],
    6:[{name:"Gravity Well", text:"Whenever you cast a spell on a creature, you can move it 5 feet to an unoccupied space of your choice if it is willing, the spell hits it with an attack, or it fails a save against the spell."}],
    10:[{name:"Violent Attraction", text:"When a creature you can see within 60 feet hits with a weapon attack, you can use your reaction to add 1d10 damage of the weapon's type to the attack. Or, when a creature within 60 feet takes falling damage, use your reaction to add 2d10 to that damage. You can use this a number of times equal to your INT modifier (minimum 1), regained on a long rest."}],
    14:[{name:"Event Horizon", text:"As an action, emit a field of gravity for 1 minute, concentrating as if on a spell. Whenever a hostile creature starts its turn within 30 feet of you, it makes a STR save against your spell save DC. On a failure it takes 2d10 force damage and its speed becomes 0 until the start of its next turn. On a success it takes half damage and every foot it moves this turn costs 2 extra feet. Once per long rest, or expend a 3rd-level or higher spell slot to use it again."}]
  }}
];
