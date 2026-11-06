/* The 2024 Sorcerer (Player's Handbook 2024, pp. 137 to 150), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-06. Only what differs from
   the 2014 sorcerer is here. What the features do on the sheet is in
   js/core/sorcerer.js.

   Like the 2024 bard, the spell list changes one spell per level, so the
   sheet keeps it as spells learned at each level-up (EDITION_CASTERS, the
   Prepared Spells column as the count). The origin comes at level 3.

   The 2024 subclasses have new names ("Draconic Sorcery" for "Draconic
   Bloodline"): classLevelOf's SUBCLASS_ALIASES counts them for their 2014
   names, so what's the same is automated once. */

var SKILLS = ["Arcana","Deception","Insight","Intimidation","Persuasion","Religion"];
var DUNGEONEERS_PACK = {name:"Dungeoneer's Pack",qty:1,weight:61.5,notes:"backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50ft rope"};
/* Font of Magic's Creating Spell Slots table (p. 141): the sorcerer level each needs. */
export var SLOT_MIN_LEVEL_2024 = {1: 2, 2: 3, 3: 5, 4: 7, 5: 9};

export var SORCERER_2024 = {
  label: "2024 Sorcerer",
  blurb: "An innate spellcaster with Innate Sorcery, Metamagic at level 2 and an origin at level 3.",
  card: {perks: ["Innate Sorcery", "Metamagic at 2", "New Metamagic"],
    text: "The 2024 rules for the sorcerer: Innate Sorcery to sharpen your spells, Metamagic at level 2 with more options and new costs, Sorcerous Restoration at level 5, Sorcery Incarnate, Arcane Apotheosis, an origin at level 3 and the 2024 origins.",
    outcome: "<b>2024 Sorcerer:</b> Innate Sorcery, Metamagic at level 2, an origin at level 3, and the 2024 features, gear and origins."},
  which: {old: "The Player's Handbook 2014 sorcerer.", now: "The Player's Handbook 2024 sorcerer: Innate Sorcery, Metamagic at level 2 and an origin at level 3."},
  swaps: {"Aberrant Mind":"Aberrant Sorcery", "Clockwork Soul":"Clockwork Sorcery", "Draconic Bloodline":"Draconic Sorcery", "Wild Magic":"Wild Magic Sorcery"},
  subclassLevel: 3,
  skillChoices: {count:2, options:SKILLS},
  proficiencies: {armor:[], weapons:["Simple weapons"], tools:[], savingThrows:["con","cha"]},
  // A multiclass: only the level 1 features (p. 138).
  multiclassProfs: {armor:[], weapons:[], tools:[], note:""},
  spellcasting: {ability:"cha", spellList:"Sorcerer", cantrips:4, spells:2, prepares:false, slots:{1:2},
    spellsLabel:"Level 1 spells",
    spellsHelp:"Choose two level 1 sorcerer spells. Burning Hands and Detect Magic are the book's suggestions. Each time you gain a sorcerer level you can swap one."},
  choices: [],
  level1: [
    {name:"Spellcasting", text:"You cast sorcerer spells using Charisma. You know four cantrips (five at level 4, six at 10). Light, Prestidigitation, Shocking Grasp and Sorcerous Burst are recommended. You know two level 1 spells, more as you level, following the Prepared Spells column. Whenever you gain a sorcerer level, you can swap one cantrip and one spell. An arcane focus can be your spellcasting focus."},
    {name:"Innate Sorcery", text:"As a bonus action, unleash your magic for 1 minute: the spell save DC of your sorcerer spells goes up by 1, and you have advantage on the attack rolls of sorcerer spells you cast (both on the Spellcasting card while it's on). You can do this twice, regained on a long rest. Start it from the Active effects card."}
  ],
  features: {
    2: [
      {name:"Font of Magic", text:"You have sorcery points equal to your sorcerer level, regained on a long rest. With no action, spend a spell slot to gain points equal to its level. As a bonus action, turn points into a spell slot: level 1 for 2 points, level 2 for 3 (from sorcerer level 3), level 3 for 5 (from 5), level 4 for 6 (from 7), level 5 for 7 (from 9). A slot you make is gone after a long rest. Both are on the Sorcery Points row on Vitals."},
      {name:"Metamagic", text:"You know two Metamagic options (four at level 10, six at 17), paid for with sorcery points. You can use one per spell unless an option says otherwise. Whenever you gain a sorcerer level, you can swap one. The level-up asks, and the Metamagic card lists them with their costs."}
    ],
    5: [{name:"Sorcerous Restoration", text:"When you finish a short rest, you regain spent sorcery points, up to half your sorcerer level (rounded down). Once per long rest. The short rest does this for you."}],
    7: [{name:"Sorcery Incarnate", text:"With no uses of Innate Sorcery left, you can start it by spending 2 sorcery points. While it's on, you can use up to two Metamagic options on each spell you cast."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Dimensional Travel is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Arcane Apotheosis", text:"While your Innate Sorcery is on, you can use one Metamagic option on each of your turns without spending sorcery points on it."}]
  },
  // The book's starting equipment: (A) or (B) 50 gp (p. 138).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Spear, 2 daggers, arcane focus (crystal), Dungeoneer's Pack and 28 gp", coins:{gp:28}, items:[
          {name:"Spear",qty:1,weight:3,notes:"thrown 20/60, versatile 1d8",type:"weapon",damageDice:"1d6",damageType:"Piercing",ability:"str",proficient:true},
          {name:"Dagger",qty:2,weight:1,notes:"finesse, light, thrown 20/60",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Arcane Focus (crystal)",qty:1,weight:1,notes:"spellcasting focus"},
          DUNGEONEERS_PACK
        ]},
        {key:"gold", label:"50 gp", detail:"Buy your own gear", coins:{gp:50}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* An origin's spell table: the feature at each level with what's prepared so
   far, added to that origin's own features. */
function originSpells(label, table, features){
  var have = [];
  Object.keys(table).forEach(function(lv){
    have = have.concat(table[lv]);
    var f = {name:label, text:"You always have " + have.join(", ").replace(/, ([^,]*)$/, " and $1") + " prepared. They don't count against your spells.", spells:have.slice(), spellKind:"known"};
    if(lv!=="3") f.replaces = label;
    features[lv] = [f].concat(features[lv] || []);
  });
  return features;
}
var AFFINITY = ["Acid","Cold","Fire","Lightning","Poison"];
var MANIFESTATIONS = ["Spectral cogwheels","Clock hands in your eyes","A brassy sheen","Floating equations","A clockwork focus","Ticking gears"];

/* The 2024 origins (Player's Handbook 2024, pp. 145 to 150). */
export var SORCERER_2024_SUBCLASSES = [
  {name:"Aberrant Sorcery", edition:"2024", blurb:"Wields unnatural psionic power.", features:originSpells("Psionic Spells", {
    3:["Arms of Hadar","Calm Emotions","Detect Thoughts","Dissonant Whispers","Mind Sliver"], 5:["Hunger of Hadar","Sending"], 7:["Evard's Black Tentacles","Summon Aberration"], 9:["Rary's Telepathic Bond","Telekinesis"]
  }, {
    3:[{name:"Telepathic Speech", text:"As a bonus action, choose a creature you can see within 30 feet. You can speak telepathically with each other while within your Charisma modifier in miles (minimum 1), using a language the other knows, for minutes equal to your sorcerer level, or until you connect with someone else. Start it from the Active effects card."}],
    6:[
      {name:"Psionic Sorcery", text:"You can cast a level 1 or higher Psionic Spell by spending sorcery points equal to its level instead of a slot. Cast that way, it needs no verbal or somatic components, and no material ones unless they're consumed or have a cost. On the Sorcery Points row."},
      {name:"Psychic Defenses", resist:["psychic"], saveNote:{abilities:["str","dex","con","int","wis","cha"], text:"Advantage on saves to avoid or end the charmed or frightened condition"}, text:"You have resistance to psychic damage, and advantage on saving throws to avoid or end the charmed or frightened condition."}
    ],
    14:[{name:"Revelation in Flesh", text:"As a bonus action, spend 1 or more sorcery points to alter your body for 10 minutes, one benefit per point: Aquatic Adaptation (a swim speed twice your speed, and you breathe water), Glistening Flight (a fly speed equal to your speed, and you hover), See the Invisible (within 60 feet), Wormlike Movement (squeeze through 1 inch, and 5 feet of movement escapes nonmagical restraints or a grapple). Start it from the Active effects card."}],
    18:[{name:"Warping Implosion", text:"As a Magic action, teleport up to 120 feet to a space you can see. Each creature within 30 feet of where you left makes a Strength save against your spell save DC: 3d10 force damage and pulled toward that space on a failure, half damage only on a success. Once per long rest, or spend 5 sorcery points to use it again."}]
  })},
  {name:"Clockwork Sorcery", edition:"2024", blurb:"Channels the cosmic forces of order.", features:originSpells("Clockwork Spells", {
    3:["Aid","Alarm","Lesser Restoration","Protection from Evil and Good"], 5:["Dispel Magic","Protection from Energy"], 7:["Freedom of Movement","Summon Construct"], 9:["Greater Restoration","Wall of Force"]
  }, {
    3:[
      {name:"Manifestation of Order", text:"Choose how your connection to order shows while you cast sorcerer spells.", profs:{pick:[{kind:"choice", id:"orderManifestation", noun:"manifestation", count:1, options:MANIFESTATIONS, label:"Choose your manifestation of order"}]}},
      {name:"Restore Balance", text:"When a creature you can see within 60 feet is about to roll a d20 with advantage or disadvantage, you can take a reaction to cancel both. Uses equal to your Charisma modifier (minimum once), regained on a long rest."}
    ],
    6:[{name:"Bastion of Law", text:"As a Magic action, spend 1 to 5 sorcery points to ward yourself or a creature you can see within 30 feet with that many d8s. When the warded creature takes damage, it can spend some of the dice and reduce the damage by their total. The ward lasts until you finish a long rest or use this again. On the Sorcery Points row."}],
    14:[{name:"Trance of Order", text:"As a bonus action, for 1 minute, attack rolls against you can't have advantage, and whenever you make a d20 test, a roll of 9 or lower counts as a 10. Once per long rest, or spend 5 sorcery points to use it again. Start it from the Active effects card."}],
    18:[{name:"Clockwork Cavalcade", text:"As a Magic action, spirits of order fill a 30-foot cube from you: they restore up to 100 hit points shared among creatures you choose, repair damaged objects entirely inside, and end every spell of level 6 or lower on creatures and objects you choose there. Once per long rest, or spend 7 sorcery points to use it again."}]
  })},
  {name:"Draconic Sorcery", edition:"2024", blurb:"Breathes the magic of dragons.", features:originSpells("Draconic Spells", {
    3:["Alter Self","Chromatic Orb","Command","Dragon's Breath"], 5:["Fear","Fly"], 7:["Arcane Eye","Charm Monster"], 9:["Legend Lore","Summon Dragon"]
  }, {
    3:[{name:"Draconic Resilience", text:"Your hit point maximum goes up by 3, and by 1 more each sorcerer level after (already added). While you wear no armor, your AC is 10 + your Dexterity and Charisma modifiers (already on the sheet)."}],
    6:[{name:"Elemental Affinity", text:"Choose acid, cold, fire, lightning or poison. You resist that damage (already on the sheet), and when you cast a spell that deals it, you add your Charisma modifier to one damage roll of the spell (in your spells' lines).",
      profs:{pick:[{kind:"choice", id:"draconicAffinity", noun:"damage type", count:1, options:AFFINITY, label:"Choose your elemental affinity"}]}}],
    14:[{name:"Dragon Wings", text:"As a bonus action, draconic wings give you a fly speed of 60 feet for 1 hour or until you dismiss them. Once per long rest, or spend 3 sorcery points to use it again. Start it from the Active effects card."}],
    18:[{name:"Dragon Companion", spells:["Summon Dragon"], spellKind:"known", spellLabel:"Free 1/long rest", spellTip:"Dragon Companion: cast it without a material component, and once without a spell slot (counter on Vitals). It can skip concentration and last 1 minute.",
      text:"You can cast Summon Dragon without a material component, and once without a spell slot, regained on a long rest. Whenever you cast it, you can make it not need concentration, and then it lasts 1 minute."}]
  })},
  {name:"Wild Magic Sorcery", edition:"2024", blurb:"Unleashes chaotic magic.", features:{
    3:[
      {name:"Wild Magic Surge", text:"Once per turn, right after you cast a sorcerer spell with a spell slot, you can roll a d20. On a 20, roll on the Wild Magic Surge table. If the effect is a spell, Metamagic can't change it. The surge check and the table are on the Tides of Chaos row."},
      {name:"Tides of Chaos", text:"Give yourself advantage on one d20 test before you roll. Then you must cast a sorcerer spell with a spell slot, or finish a long rest, before you can do it again. If you cast that spell before a long rest, you automatically roll on the Wild Magic Surge table. Use it from the Active effects card."}
    ],
    6:[{name:"Bend Luck", text:"Right after another creature you can see rolls the d20 for a d20 test, you can take a reaction and spend 1 sorcery point to roll 1d4 and add it to or subtract it from that d20 roll. On the Sorcery Points row."}],
    14:[{name:"Controlled Chaos", text:"Whenever you roll on the Wild Magic Surge table, you can roll twice and use either number (the sheet rolls both)."}],
    18:[{name:"Tamed Surge", text:"Right after you cast a sorcerer spell with a spell slot, you can create any effect from the Wild Magic Surge table except the last row instead of rolling. If it involves a roll, you make it. Once per long rest."}]
  }}
];

/* The 2024 Wild Magic Surge table (p. 148 and 149): 25 rows of four numbers
   on the d100 (01-04 first, 97-00 last). `applies`: what the sheet can do for
   you, as buttons. */
export var WILD_SURGE_2024 = [
  {text:"Roll on this table at the start of each of your turns for the next minute, ignoring this result on later rolls."},
  {text:"A creature friendly to you appears in a random unoccupied space within 60 feet, controlled by the DM, and disappears 1 minute later. Roll 1d4: a modron duodrone, a flumph, a modron monodrone or a unicorn."},
  {text:"For the next minute, you regain 5 hit points at the start of each of your turns."},
  {text:"Creatures have disadvantage on saving throws against the next spell you cast in the next minute that involves a saving throw."},
  {text:"An effect lasts 1 minute unless it says otherwise. Roll 1d8: 1 faint ethereal music around you, 2 you grow one size category, 3 a long feather beard until you sneeze, 4 you must shout when you speak, 5 illusory butterflies within 10 feet, 6 an eye on your forehead gives advantage on Wisdom (Perception) checks, 7 pink bubbles float out when you speak, 8 your skin turns vibrant blue for 24 hours or until Remove Curse ends it."},
  {text:"For the next minute, all your spells with a casting time of an action take a bonus action instead."},
  {text:"You are transported to the Astral Plane until the end of your next turn, then return to your space or the nearest unoccupied one."},
  {text:"The next time you cast a spell that deals damage in the next minute, use the highest number on each damage die instead of rolling."},
  {text:"You have resistance to all damage for the next minute."},
  {text:"You turn into a potted plant until the start of your next turn: incapacitated, with vulnerability to all damage. At 0 hit points the pot breaks and you change back."},
  {text:"For the next minute, you can teleport up to 20 feet as a bonus action on each of your turns."},
  {text:"You and up to three creatures you choose within 30 feet are invisible for 1 minute. It ends on a creature right after it attacks, deals damage or casts a spell."},
  {text:"A spectral shield hovers near you for the next minute: +2 to AC and immunity to Magic Missile."},
  {text:"You can take one extra action on this turn."},
  {text:"You cast a random spell. If it needs concentration it doesn't, and lasts its full duration. Roll 1d10: Confusion, Fireball, Fog Cloud, Fly on a random creature within 60 feet, Grease, Levitate on yourself, Magic Missile as a level 5 spell, Mirror Image, Polymorph on yourself (fail the save and you're a goat), See Invisibility."},
  {text:"For the next minute, any flammable nonmagical object you touch that isn't worn or carried by another creature bursts into flame, takes 1d4 fire damage and is burning."},
  {text:"If you die within the next hour, you immediately revive as if by the Reincarnate spell."},
  {text:"You are frightened until the end of your next turn. The DM decides the source."},
  {text:"You teleport up to 60 feet to an unoccupied space you can see."},
  {text:"A random creature within 60 feet of you is poisoned for 1d4 hours."},
  {text:"You shed bright light in a 30-foot radius for the next minute. A creature that ends its turn within 5 feet of you is blinded until the end of its next turn."},
  {text:"Up to three creatures you choose that you can see within 30 feet take 1d10 necrotic damage, and you regain hit points equal to the total."},
  {text:"Up to three creatures you choose that you can see within 30 feet take 4d10 lightning damage."},
  {text:"You and every creature within 30 feet have vulnerability to piercing damage for the next minute."},
  {text:"Roll 1d6: 1 you regain 2d10 hit points, 2 an ally within 300 feet regains 2d10 hit points, 3 you regain your lowest-level spent spell slot, 4 an ally within 300 feet regains their lowest-level spent slot, 5 you regain all your sorcery points, 6 every effect of the fifth row (1d8) affects you at once.",
    applies:[{label:"On a 1: regain 2d10 hit points", apply:"heal"}, {label:"On a 3: your lowest spent slot back", apply:"slot"}, {label:"On a 5: all sorcery points back", apply:"points"}]}
];
