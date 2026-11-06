/* The 2024 Warlock (Player's Handbook 2024, pp. 153 to 163), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-06. Only what differs from
   the 2014 warlock is here. What the features do on the sheet is in
   js/core/warlock.js and js/core/invocations.js.

   The Pact Boons are now invocations (Pact of the Blade, Chain, Tome), and
   the first invocation comes at level 1. The 2024 invocations are listed
   with the 2014 ones (js/data/invocations.js) with `edition: "2024"`; a
   name the 2014 list already uses gets " (2024)" (shown without it).

   The patrons come at level 3 with new names ("Fiend Patron" for "The
   Fiend"): classLevelOf's SUBCLASS_ALIASES counts them for their 2014
   names, so what's the same is automated once. */

var SKILLS = ["Arcana","Deception","History","Intimidation","Investigation","Nature","Religion"];
var SCHOLARS_PACK = {name:"Scholar's Pack",qty:1,weight:10,notes:"backpack, book of lore, ink, quill, 10 sheets of parchment, bag of sand, small knife"};

/* Eldritch Invocations column of the Warlock Features table (index = level). */
export var INVOCATIONS_KNOWN_2024 = [0,1,3,3,3,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10];

export var WARLOCK_2024 = {
  label: "2024 Warlock",
  blurb: "A pact caster with an invocation at level 1, Magical Cunning and a patron at level 3.",
  card: {perks: ["Invocation at 1", "Pacts are invocations", "Magical Cunning"],
    text: "The 2024 rules for the warlock: an invocation from level 1, Pact of the Blade, Chain and Tome as invocations, Magical Cunning to get pact slots back, Contact Patron, a patron at level 3 and the 2024 patrons.",
    outcome: "<b>2024 Warlock:</b> an invocation at level 1, the pacts as invocations, Magical Cunning, a patron at level 3, and the 2024 features, gear and patrons."},
  which: {old: "The Player's Handbook 2014 warlock.", now: "The Player's Handbook 2024 warlock: an invocation at level 1, Magical Cunning and a patron at level 3."},
  swaps: {"The Archfey":"Archfey Patron", "The Celestial":"Celestial Patron", "The Fiend":"Fiend Patron", "The Great Old One":"Great Old One Patron"},
  subclassLevel: 3,
  skillChoices: {count:2, options:SKILLS},
  proficiencies: {armor:["Light armor"], weapons:["Simple weapons"], tools:[], savingThrows:["wis","cha"]},
  // A multiclass: light armor and the level 1 features (p. 153).
  multiclassProfs: {armor:["Light armor"], weapons:[], tools:[], note:""},
  spellcasting: {ability:"cha", spellList:"Warlock", cantrips:2, spells:2, prepares:false, slots:{}, pact:{max:1, slotLevel:1},
    spellsLabel:"Level 1 spells",
    spellsHelp:"Choose two level 1 warlock spells. Charm Person and Hex are the book's suggestions. Your pact slot comes back on a short rest, and each time you gain a warlock level you can swap one spell."},
  choices: [
    {id:"invocation", kind:"invocation", label:"Eldritch Invocation",
      help:"Your first invocation, a lasting gift from your patron. Pact of the Blade suits a warlock who fights up close, Pact of the Chain gives you a familiar, Pact of the Tome extra spells, and Armor of Shadows free Mage Armor."}
  ],
  level1: [
    {name:"Eldritch Invocations", text:"You know one eldritch invocation, such as Pact of the Tome, and more as you level (three at 2, five at 5, up to ten at 18). Whenever you gain a warlock level, you can swap one for another you qualify for, unless another invocation you have needs it. The level-up asks, and the Eldritch invocations card lists them."},
    {name:"Pact Magic", text:"You cast warlock spells using Charisma. You know two cantrips (three at level 4, four at 10) and two level 1 spells, more as you level, following the Prepared Spells column. Your pact slots are all of the same level and come back on a short or long rest. Whenever you gain a warlock level, you can swap one cantrip and one spell. An arcane focus can be your spellcasting focus."}
  ],
  features: {
    2: [{name:"Magical Cunning", text:"You can perform a 1 minute rite to regain spent pact slots, up to half your maximum (round up). Once per long rest. The button is on the Magical Cunning row on Vitals."}],
    9: [{name:"Contact Patron", spells:["Contact Other Plane"], spellKind:"known", spellLabel:"Free 1/long rest",
      spellTip:"Contact Patron: always prepared. Cast it once without a spell slot to contact your patron, and you automatically succeed on its saving throw (counter on Vitals).",
      text:"You always have Contact Other Plane prepared. You can cast it once without a spell slot to contact your patron, and you automatically succeed on the spell's saving throw. Once per long rest."}],
    11: [{name:"Mystic Arcanum", text:"Choose one level 6 warlock spell as an arcanum. You can cast it once per long rest without a spell slot. You gain a level 7 arcanum at level 13, level 8 at 15 and level 9 at 17. Whenever you gain a warlock level, you can swap one for another of the same level."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Fate is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Eldritch Master", text:"When you use Magical Cunning, you regain all your spent pact slots."}]
  },
  // The book's starting equipment: (A) or (B) 100 gp (p. 153).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Leather armor, sickle, 2 daggers, arcane focus (orb), book (occult lore), Scholar's Pack and 15 gp", coins:{gp:15}, items:[
          {name:"Leather",qty:1,weight:10,notes:"light armor",type:"armor",category:"light",baseAC:11},
          {name:"Sickle",qty:1,weight:2,notes:"light",type:"weapon",damageDice:"1d4",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Dagger",qty:2,weight:1,notes:"finesse, light, thrown 20/60",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Arcane Focus (orb)",qty:1,weight:3,notes:"spellcasting focus"},
          {name:"Book (occult lore)",qty:1,weight:5,notes:""},
          SCHOLARS_PACK
        ]},
        {key:"gold", label:"100 gp", detail:"Buy your own gear", coins:{gp:100}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* A patron's spell table: the feature at each level with what's prepared
   so far, added to that patron's own features. */
function patronSpells(label, table, features){
  var have = [];
  Object.keys(table).forEach(function(lv){
    have = have.concat(table[lv]);
    var f = {name:label, text:"You always have " + have.join(", ").replace(/, ([^,]*)$/, " and $1") + " prepared. They don't count against your spells.", spells:have.slice(), spellKind:"known"};
    if(lv!=="3") f.replaces = label;
    features[lv] = [f].concat(features[lv] || []);
  });
  return features;
}

/* The 2024 patrons (Player's Handbook 2024, pp. 159 to 163). */
export var WARLOCK_2024_SUBCLASSES = [
  {name:"Archfey Patron", edition:"2024", blurb:"Bargains with whimsical fey.", features:patronSpells("Archfey Spells", {
    3:["Calm Emotions","Faerie Fire","Misty Step","Phantasmal Force","Sleep"], 5:["Blink","Plant Growth"], 7:["Dominate Beast","Greater Invisibility"], 9:["Dominate Person","Seeming"]
  }, {
    3:[{name:"Steps of the Fey", text:"You can cast Misty Step without a spell slot a number of times equal to your Charisma modifier (minimum once), regained on a long rest. When you cast it, you can add one effect. Refreshing Step: right after you teleport, you or a creature you can see within 10 feet gains 1d10 temporary hit points. Taunting Step: creatures within 5 feet of the space you left make a Wisdom save against your spell save DC or have disadvantage on attack rolls against creatures other than you until the start of your next turn. The free casts and the Refreshing Step roll are on Vitals.",
      saveDc:{save:"wis", ability:"cha"}}],
    6:[{name:"Misty Escape", remind:{when:"reaction", line:"When you take damage, cast Misty Step"},
      text:"You can cast Misty Step as a reaction when you take damage. Your Steps of the Fey gain two effects. Disappearing Step: you are invisible until the start of your next turn, or until right after you attack, deal damage or cast a spell. Dreadful Step: creatures within 5 feet of the space you left or the one you arrive in (your choice) make a Wisdom save against your spell save DC or take 2d10 psychic damage.",
      saveDc:{save:"wis", ability:"cha"}}],
    10:[{name:"Beguiling Defenses", conditionImmune:["charmed"],
      saveDc:{save:"wis", ability:"cha"},
      text:"You are immune to the charmed condition. Right after a creature you can see hits you with an attack roll, you can take a reaction to halve the damage you take (round down), and the attacker makes a Wisdom save against your spell save DC or takes psychic damage equal to the damage you take. Once per long rest, or spend a pact slot to use it again."}],
    14:[{name:"Bewitching Magic", remind:{when:"always", line:"After an enchantment or illusion spell with a slot, cast Misty Step free"},
      text:"Right after you cast an enchantment or illusion spell using an action and a spell slot, you can cast Misty Step as part of the same action without a spell slot."}]
  })},
  {name:"Celestial Patron", edition:"2024", blurb:"Calls on the power of the heavens.", features:patronSpells("Celestial Spells", {
    3:["Aid","Cure Wounds","Guiding Bolt","Lesser Restoration","Light","Sacred Flame"], 5:["Daylight","Revivify"], 7:["Guardian of Faith","Wall of Fire"], 9:["Greater Restoration","Summon Celestial"]
  }, {
    3:[{name:"Healing Light", text:"You have a pool of d6s equal to 1 + your warlock level, regained on a long rest. As a bonus action, heal yourself or a creature you can see within 60 feet by spending dice from the pool, up to your Charisma modifier at once (minimum one). Roll them and restore that many hit points. The dice are on Vitals."}],
    6:[{name:"Radiant Soul", resist:["radiant"], remind:{when:"always", line:"Once a turn, add CHA to one target's radiant or fire spell damage"},
      text:"You have resistance to radiant damage. Once per turn, when a spell you cast deals radiant or fire damage, you can add your Charisma modifier to that spell's damage against one of its targets."}],
    10:[{name:"Celestial Resilience", text:"You gain temporary hit points equal to your warlock level + your Charisma modifier whenever you use Magical Cunning or finish a short or long rest (the sheet adds them). Up to five creatures you can see then gain half your warlock level + your Charisma modifier."}],
    14:[{name:"Searing Vengeance", text:"When you or an ally within 60 feet is about to make a death saving throw, you can unleash radiant energy: the creature regains half its hit point maximum and can end the prone condition on itself. Each creature you choose within 30 feet of it takes 2d8 + your Charisma modifier radiant damage and is blinded until the end of the current turn. Once per long rest."}]
  })},
  {name:"Fiend Patron", edition:"2024", blurb:"Makes a deal with the Lower Planes.", features:patronSpells("Fiend Spells", {
    3:["Burning Hands","Command","Scorching Ray","Suggestion"], 5:["Fireball","Stinking Cloud"], 7:["Fire Shield","Wall of Fire"], 9:["Geas","Insect Plague"]
  }, {
    3:[{name:"Dark One's Blessing", text:"When you reduce an enemy to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum 1). You also gain them if someone else reduces an enemy within 10 feet of you to 0 hit points. The button is on Vitals."}],
    6:[{name:"Dark One's Own Luck", text:"When you make an ability check or a saving throw, you can add 1d10 to the roll, after seeing it but before its effects occur. Uses equal to your Charisma modifier (minimum once), no more than once per roll, regained on a long rest."}],
    10:[{name:"Fiendish Resilience", text:"Whenever you finish a short or long rest, choose a damage type other than force. You have resistance to it until you choose a different one. Pick it on the Fiendish Resilience row on Vitals."}],
    14:[{name:"Hurl Through Hell", saveDc:{save:"cha", ability:"cha"},
      text:"Once per turn when you hit a creature with an attack roll, you can try to send it through the Lower Planes. It makes a Charisma save against your spell save DC. On a failure it disappears, takes 8d10 psychic damage if it isn't a fiend, and is incapacitated until the end of your next turn, when it returns to its space or the nearest free one. Once per long rest, or spend a pact slot to use it again."}]
  })},
  {name:"Great Old One Patron", edition:"2024", blurb:"Unearths forbidden lore of ineffable beings.", features:patronSpells("Great Old One Spells", {
    3:["Detect Thoughts","Dissonant Whispers","Phantasmal Force","Tasha's Hideous Laughter"], 5:["Clairvoyance","Hunger of Hadar"], 7:["Confusion","Summon Aberration"], 9:["Modify Memory","Telekinesis"]
  }, {
    3:[
      {name:"Awakened Mind", remind:{when:"bonus", line:"Link telepathically with a creature you can see within 30 feet"},
        text:"As a bonus action, choose a creature you can see within 30 feet. You can speak telepathically with each other while within your Charisma modifier in miles (minimum 1), using a language the other knows, for minutes equal to your warlock level. It ends early if you link with another creature."},
      {name:"Psychic Spells", remind:{when:"always", line:"Warlock spell damage can be psychic, and enchantments and illusions need no V or S"},
        text:"When you cast a warlock spell that deals damage, you can change its damage type to psychic. You can cast warlock enchantment and illusion spells without verbal or somatic components."}
    ],
    6:[{name:"Clairvoyant Combatant", saveDc:{save:"wis", ability:"cha"},
      text:"When you link with a creature using Awakened Mind, you can make it take a Wisdom save against your spell save DC. On a failure, it has disadvantage on attack rolls against you, and you have advantage on attack rolls against it while the link lasts. Once per short or long rest, or spend a pact slot to use it again."}],
    10:[
      {name:"Eldritch Hex", spells:["Hex"], spellKind:"known", spellLabel:"Always prepared",
        spellTip:"Eldritch Hex: when you cast Hex and choose an ability, the target also has disadvantage on saving throws of that ability.",
        text:"You always have Hex prepared. When you cast it and choose an ability, the target also has disadvantage on saving throws of that ability while the spell lasts."},
      {name:"Thought Shield", resist:["psychic"], remind:{when:"always", line:"A creature that deals psychic damage to you takes the same amount"},
        text:"Your thoughts can't be read by telepathy or other means unless you allow it. You have resistance to psychic damage, and a creature that deals psychic damage to you takes the same amount of damage you take."}
    ],
    14:[{name:"Create Thrall", text:"When you cast Summon Aberration, you can make it need no concentration. Its duration is then 1 minute, and the aberration has temporary hit points equal to your warlock level + your Charisma modifier. The first time each turn it hits a creature under your Hex, it deals extra psychic damage equal to Hex's bonus damage."}]
  })}
];

/* The 2024 invocations (pp. 155 to 157), shaped like the 2014 ones (see
   js/data/invocations.js) plus:
     pact       the Pact invocation it needs (the 2024 pacts are invocations)
     requires   another invocation it needs (Devouring Blade: Thirsting Blade)
     needs      "damageCantrip" or "attackCantrip": a warlock cantrip that
                deals damage (with an attack roll); spellPick.known picks it
     repeatable can be learned again, with a different cantrip or feat
     featPick   "origin": an Origin feat of your choice (on its card)
     spellPick  .parts: picks of different kinds ({count, level, ritual,
                label}); .known: a cantrip you know, not a new spell;
                .kind / .note: how the picked spells show on the Spells tab
     extraAttacks  attacks with the pact weapon (Thirsting Blade 2, Devouring Blade 3) */
var P = "PHB24";
export var INVOCATIONS_2024 = [
  {name:"Agonizing Blast (2024)", label:"Agonizing Blast", edition:"2024", source:P, level:2, needs:"damageCantrip", repeatable:true, blast:{damage:true},
    spellPick:{count:1, known:"damage", label:"warlock cantrip that deals damage"},
    text:"Choose one of your warlock cantrips that deals damage. You add your Charisma modifier to that spell's damage rolls. You can take it again for a different cantrip."},
  {name:"Armor of Shadows (2024)", label:"Armor of Shadows", edition:"2024", source:P, spells:[{name:"Mage Armor", kind:"atwill"}],
    text:"You can cast Mage Armor on yourself without a spell slot."},
  {name:"Ascendant Step (2024)", label:"Ascendant Step", edition:"2024", source:P, level:5, spells:[{name:"Levitate", kind:"atwill"}],
    text:"You can cast Levitate on yourself without a spell slot."},
  {name:"Devil's Sight (2024)", label:"Devil's Sight", edition:"2024", source:P, level:2, sight:"Devil's Sight 120 ft",
    text:"You can see normally in dim light and darkness, both magical and nonmagical, within 120 feet of yourself."},
  {name:"Devouring Blade", edition:"2024", source:P, level:12, requires:"Thirsting Blade (2024)", extraAttacks:3,
    text:"The Extra Attack of your Thirsting Blade invocation gives two extra attacks rather than one."},
  {name:"Eldritch Mind (2024)", label:"Eldritch Mind", edition:"2024", source:P,
    text:"You have advantage on Constitution saving throws that you make to maintain concentration."},
  {name:"Eldritch Smite (2024)", label:"Eldritch Smite", edition:"2024", source:P, level:5, pact:"Pact of the Blade",
    text:"Once per turn when you hit a creature with your pact weapon, you can spend a pact slot to deal an extra 1d8 force damage to the target, plus another 1d8 per level of the slot, and you can knock it prone if it is Huge or smaller."},
  {name:"Eldritch Spear (2024)", label:"Eldritch Spear", edition:"2024", source:P, level:2, needs:"damageCantrip", repeatable:true, blast:{rangePerLevel:30},
    spellPick:{count:1, known:"damage", label:"warlock cantrip that deals damage"},
    text:"Choose one of your warlock cantrips that deals damage and has a range of 10 feet or more. When you cast it, its range increases by 30 feet times your warlock level. You can take it again for a different cantrip."},
  {name:"Fiendish Vigor (2024)", label:"Fiendish Vigor", edition:"2024", source:P, level:2, spells:[{name:"False Life", kind:"atwill"}],
    text:"You can cast False Life on yourself without a spell slot. When you do, you don't roll for the temporary hit points: you get the highest number on the die."},
  {name:"Gaze of Two Minds (2024)", label:"Gaze of Two Minds", edition:"2024", source:P, level:5, remind:{when:"bonus", line:"Touch a willing creature and perceive through its senses"},
    text:"As a bonus action, touch a willing creature and perceive through its senses until the end of your next turn. On later turns you can keep the link with a bonus action while you're on the same plane. While linked you use its special senses, and you can cast spells as if you were in your space or its space if you're within 60 feet of each other."},
  {name:"Gift of the Depths (2024)", label:"Gift of the Depths", edition:"2024", source:P, level:5, speeds:[{type:"swim", value:"walk"}], spells:[{name:"Water Breathing", kind:"free"}],
    text:"You can breathe underwater, and you gain a swim speed equal to your speed. You can also cast Water Breathing once without a spell slot, regained on a long rest."},
  {name:"Gift of the Protectors (2024)", label:"Gift of the Protectors", edition:"2024", source:P, level:9, pact:"Pact of the Tome", uses:{max:"1", reset:"long", name:"Gift of the Protectors"},
    text:"A new page appears in your Book of Shadows. With your permission, a creature can take an action to write its name on it. It holds names equal to your Charisma modifier (minimum one). When a creature named on the page drops to 0 hit points but isn't killed outright, it drops to 1 hit point instead. Once per long rest for everyone. As a Magic action, you can erase a name by touching it."},
  {name:"Investment of the Chain Master (2024)", label:"Investment of the Chain Master", edition:"2024", source:P, level:5, pact:"Pact of the Chain",
    remind:{when:"bonus", line:"Command your familiar to take the Attack action"},
    text:"When you cast Find Familiar, the familiar gains a fly or swim speed (your choice) of 40 feet. As a bonus action, you can command it to take the Attack action. Its bludgeoning, piercing or slashing damage can be necrotic or radiant instead, and a saving throw it forces uses your spell save DC. When it takes damage, you can take a reaction to give it resistance to that damage."},
  {name:"Lessons of the First Ones", edition:"2024", source:P, level:2, repeatable:true, featPick:"origin",
    text:"You gain an Origin feat of your choice. You can take it again for a different Origin feat. Choose the feat on its card in the Eldritch invocations list."},
  {name:"Lifedrinker (2024)", label:"Lifedrinker", edition:"2024", source:P, level:9, pact:"Pact of the Blade",
    text:"Once per turn when you hit a creature with your pact weapon, you can deal an extra 1d6 necrotic, psychic or radiant damage (your choice), and you can spend one of your Hit Point Dice to roll it and regain that many hit points plus your Constitution modifier (minimum 1)."},
  {name:"Mask of Many Faces (2024)", label:"Mask of Many Faces", edition:"2024", source:P, level:2, spells:[{name:"Disguise Self", kind:"atwill"}],
    text:"You can cast Disguise Self without a spell slot."},
  {name:"Master of Myriad Forms (2024)", label:"Master of Myriad Forms", edition:"2024", source:P, level:5, spells:[{name:"Alter Self", kind:"atwill"}],
    text:"You can cast Alter Self without a spell slot."},
  {name:"Misty Visions (2024)", label:"Misty Visions", edition:"2024", source:P, level:2, spells:[{name:"Silent Image", kind:"atwill"}],
    text:"You can cast Silent Image without a spell slot."},
  {name:"One with Shadows (2024)", label:"One with Shadows", edition:"2024", source:P, level:5, spells:[{name:"Invisibility", kind:"atwill"}],
    text:"While you're in dim light or darkness, you can cast Invisibility on yourself without a spell slot."},
  {name:"Otherworldly Leap (2024)", label:"Otherworldly Leap", edition:"2024", source:P, level:2, spells:[{name:"Jump", kind:"atwill"}],
    text:"You can cast Jump on yourself without a spell slot."},
  {name:"Pact of the Blade", edition:"2024", source:P, pactInvocation:true,
    remind:{when:"bonus", line:"Conjure your pact weapon, or bond with a magic weapon you touch"},
    text:"As a bonus action, conjure a pact weapon in your hand (a simple or martial melee weapon of your choice) or bond with a magic weapon you touch (not one someone else is attuned to or another warlock is bonded with). While bonded you're proficient with it, it can be your spellcasting focus, you can use Charisma for its attack and damage rolls, and it can deal necrotic, psychic or radiant damage or its normal type. The bond ends if you use this again, if the weapon is more than 5 feet from you for 1 minute, or if you die. Tick Pact weapon on its card in the Inventory."},
  {name:"Pact of the Chain", edition:"2024", source:P, pactInvocation:true, spells:[{name:"Find Familiar", kind:"atwill"}],
    text:"You learn Find Familiar and can cast it as a Magic action without a spell slot. Your familiar can take a normal form or a special one: imp, pseudodragon, quasit, skeleton, slaad tadpole, sphinx of wonder, sprite or venomous snake. When you take the Attack action, you can give up one of your attacks to let your familiar make one attack with its reaction."},
  {name:"Pact of the Tome", edition:"2024", source:P, pactInvocation:true,
    spellPick:{count:5, label:"spells for your Book of Shadows (3 cantrips and 2 level 1 rituals)", kind:"known",
      note:"Book of Shadows: prepared while the book is on you. It counts as a warlock spell for you.",
      parts:[{count:3, level:0, label:"cantrip from any class"}, {count:2, level:1, ritual:true, label:"level 1 ritual from any class"}]},
    text:"At the end of a short or long rest you conjure a Book of Shadows. When it appears, choose three cantrips and two level 1 spells with the ritual tag, from any class's list, that you don't already have prepared. While the book is on you, you have them prepared and they work as warlock spells for you. You can use the book as a spellcasting focus."},
  {name:"Repelling Blast (2024)", label:"Repelling Blast", edition:"2024", source:P, level:2, needs:"attackCantrip", repeatable:true, blast:{rider:"push 10 ft (Large or smaller)"},
    spellPick:{count:1, known:"attack", label:"warlock cantrip that needs an attack roll"},
    text:"Choose one of your warlock cantrips that needs an attack roll. When you hit a Large or smaller creature with it, you can push the creature up to 10 feet straight away from you. You can take it again for a different cantrip."},
  {name:"Thirsting Blade (2024)", label:"Thirsting Blade", edition:"2024", source:P, level:5, pact:"Pact of the Blade", extraAttacks:2,
    text:"You gain the Extra Attack feature for your pact weapon only: you attack twice with it instead of once when you take the Attack action on your turn."},
  {name:"Visions of Distant Realms (2024)", label:"Visions of Distant Realms", edition:"2024", source:P, level:9, spells:[{name:"Arcane Eye", kind:"atwill"}],
    text:"You can cast Arcane Eye without a spell slot."},
  {name:"Whispers of the Grave (2024)", label:"Whispers of the Grave", edition:"2024", source:P, level:7, spells:[{name:"Speak with Dead", kind:"atwill"}],
    text:"You can cast Speak with Dead without a spell slot."},
  {name:"Witch Sight (2024)", label:"Witch Sight", edition:"2024", source:P, level:15, sight:"Truesight 30 ft",
    text:"You have truesight with a range of 30 feet."}
];
