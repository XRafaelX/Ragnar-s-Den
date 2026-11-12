/* The 2024 Artificer (Eberron: Forge of the Artificer, 2025), a choice per
   character next to the Tasha's one (the class entry's `edition: "2024"`).
   Checked against 5etools' class-artificer.json (source EFA) on
   2026-11-12. Only what differs from the Tasha's artificer is here; what
   the features do on the sheet is in js/core/artificer.js.

   What changes: no infusions (Replicate Magic Item's plans instead, from
   level 2), Tinker's Magic at 1 (Mending and everyday items), no Tool
   Expertise or The Right Tool for the Job, Magic Item Tinker at 6, a
   cantrip swap after each long rest, Spell-Storing Item up to level 3
   spells, Advanced Artifice at 14 (Refreshed Genius), an Epic Boon at 19
   and a new Soul of Artifice.

   Until the 2024 subclasses are in (artificer fix Phase 5), a 2024
   artificer picks from the Tasha's four. */

var SKILLS = ["Arcana","History","Investigation","Medicine","Nature","Perception","Sleight of Hand"];

/* Tinker's Magic's everyday items. `gear` is the item's name in the gear
   catalog (js/data/gear.js), when it has one. */
export var TINKER_ITEMS = [
  {name:"Ball Bearings", gear:"Ball Bearings (bag of 1,000)"}, {name:"Basket", gear:"Basket"}, {name:"Bedroll", gear:"Bedroll"},
  {name:"Bell", gear:"Bell"}, {name:"Blanket", gear:"Blanket"}, {name:"Block and Tackle", gear:"Block and Tackle"},
  {name:"Glass Bottle", gear:"Bottle, Glass"}, {name:"Bucket", gear:"Bucket"}, {name:"Caltrops", gear:"Caltrops (bag of 20)"},
  {name:"Candle", gear:"Candle"}, {name:"Crowbar", gear:"Crowbar"}, {name:"Flask", gear:"Flask or Tankard"},
  {name:"Grappling Hook", gear:"Grappling Hook"}, {name:"Hunting Trap", gear:"Hunting Trap"}, {name:"Jug", gear:"Jug or Pitcher"},
  {name:"Lamp", gear:"Lamp"}, {name:"Manacles", gear:"Manacles"}, {name:"Net", notes:"Thrown at a creature within 15 feet: DEX save or it's restrained"},
  {name:"Oil", gear:"Oil (flask)"}, {name:"Paper", gear:"Paper (one sheet)"}, {name:"Parchment", gear:"Parchment (one sheet)"},
  {name:"Pole", gear:"Pole (10-foot)"}, {name:"Pouch", gear:"Pouch"}, {name:"Rope", gear:"Rope, Hempen (50 feet)"},
  {name:"Sack", gear:"Sack"}, {name:"Shovel", gear:"Shovel"}, {name:"Iron Spikes", gear:"Spikes, Iron (10)"},
  {name:"String", notes:"10 feet of string"}, {name:"Tinderbox", gear:"Tinderbox"}, {name:"Torch", gear:"Torch"}, {name:"Vial", gear:"Vial"}
];

export var ARTIFICER_2024 = {
  label: "2024 Artificer",
  series: "Eberron: Forge of the Artificer",
  blurb: "An inventor who makes magic items from plans, with Tinker's Magic at level 1 and a subclass at level 3.",
  card: {perks: ["Magic item plans", "Tinker's Magic", "Cantrip swap each rest"],
    text: "The 2024 rules for the artificer (Eberron: Forge of the Artificer): Tinker's Magic at level 1, magic item plans in place of infusions from level 2, Magic Item Tinker at 6, a cantrip swap after each long rest, Advanced Artifice at 14 and a new Soul of Artifice.",
    outcome: "<b>2024 Artificer:</b> Tinker's Magic, magic item plans in place of infusions, and the 2024 features and gear."},
  which: {old: "The Tasha's Cauldron artificer: infusions, Tool Expertise and The Right Tool for the Job.",
    now: "The 2024 artificer (Eberron: Forge of the Artificer): magic item plans, Tinker's Magic and Magic Item Tinker."},
  swaps: {},
  subclassLevel: 3,
  skillChoices: {count:2, options:SKILLS},
  proficiencies: {armor:["Light armor","Medium armor","Shields"], weapons:["Simple weapons"], tools:["Thieves' tools","Tinker's tools","One type of artisan's tools"], savingThrows:["con","int"]},
  // A multiclass: a skill from the list, tinker's tools, light and medium
  // armor and shields.
  multiclassProfs: {armor:["Light armor","Medium armor","Shields"], weapons:[], tools:["Tinker's tools"], note:"",
    profs:{pick:[{kind:"skill", label:"Gain proficiency in one skill from the artificer's list", options:SKILLS}]}},
  spellcasting: {ability:"int", spellList:"Artificer", cantrips:2, spells:2, prepares:true, slots:{1:2},
    spellsLabel:"Prepared spells",
    spellsHelp:"You know every artificer spell. Each day you prepare 2 of them (more as you level). Cure Wounds and Grease are the book's suggestions. Change them on the Spells tab after a long rest."},
  choices: [],
  level1: [
    {name:"Spellcasting", text:"You cast artificer spells using Intelligence, through thieves' tools, tinker's tools or other artisan's tools you're proficient with, held in your hand. You know two cantrips (three at level 10, four at 14), and after each long rest you can swap one for another artificer cantrip. Acid Splash and Prestidigitation are recommended. You prepare level 1+ spells from the artificer list, following the Prepared Spells column, and can change them after a long rest."},
    {name:"Tinker's Magic", spells:["Mending"], spellKind:"known", spellLabel:"Tinker's Magic",
      spellTip:"Tinker's Magic: you know Mending. It doesn't count against your cantrips.",
      text:"You know the Mending cantrip. As a Magic action while holding tinker's tools, you can make an everyday item appear within 5 feet: ball bearings, a basket, bedroll, bell, blanket, block and tackle, glass bottle, bucket, caltrops, candle, crowbar, flask, grappling hook, hunting trap, jug, lamp, manacles, net, oil, paper, parchment, pole, pouch, rope, sack, shovel, iron spikes, string, tinderbox, torch or vial. It vanishes when you finish a long rest. You can do this a number of times equal to your INT modifier (at least once) per long rest. Make one from the Tinker's Magic row on Vitals."}
  ],
  features: {
    2: [{name:"Replicate Magic Item", text:"You learn four magic item plans (more as you level, from tables that open up at levels 2, 6, 10 and 14). Bag of Holding, Cap of Water Breathing, Sending Stones and +1 Wand of the War Mage are recommended. After a long rest, with tinker's tools in hand, you can make one or two different magic items from your plans (more at higher levels). Each must come from a different plan, and if you go over your limit the oldest vanishes. If the item needs attunement, you can attune to it the instant you make it. You can use a wand or weapon you made as your spellcasting focus. When you gain an artificer level, you can swap one plan for another; items made from the old plan vanish."}],
    6: [{name:"Magic Item Tinker", text:"Your Replicate Magic Item feature gains three options. Charge Magic Item: as a bonus action, touch an item you made that uses charges and spend a spell slot: it regains charges equal to the slot's level. Drain Magic Item: as a bonus action, touch an item you made and make it vanish, turning it into a spell slot (level 1 for a common item, level 2 for an uncommon or rare one), once per long rest. The slot vanishes at your next long rest. Transmute Magic Item: as a Magic action, turn an item you made into another one from your plans, once per long rest."}],
    7: [{name:"Flash of Genius", text:"When you or a creature you can see within 30 feet fails an ability check or a saving throw, you can take a reaction to add your INT modifier (at least +1) to the roll, which might make it succeed. You can do this a number of times equal to your INT modifier (at least once) per long rest."}],
    10: [{name:"Magic Item Adept", attuneLimit:4, text:"You can attune to up to four magic items at once."}],
    11: [{name:"Spell-Storing Item", text:"When you finish a long rest, touch a simple or martial weapon or something you can use as a spellcasting focus and store a level 1, 2 or 3 artificer spell in it that takes an action to cast and doesn't use up a material component (it needn't be prepared). A creature holding it can take a Magic action to produce the spell, using your spellcasting modifier, at most once per turn. It holds twice your INT modifier (at least 2) uses, until they're spent or you store another spell."}],
    14: [{name:"Advanced Artifice", attuneLimit:5, text:"Magic Item Savant: you can attune to up to five magic items at once. Refreshed Genius: when you finish a short rest, you get one use of Flash of Genius back."}],
    18: [{name:"Magic Item Master", attuneLimit:6, text:"You can attune to up to six magic items at once."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Energy Resistance is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Soul of Artifice", text:"Cheat Death: if you drop to 0 hit points and aren't killed outright, you can disintegrate any number of uncommon or rare magic items you made with Replicate Magic Item. Your hit points become 20 times the number of items disintegrated. Magical Guidance: when you finish a short rest, you get every use of Flash of Genius back if you're attuned to at least one magic item."}]
  },
  // The book's starting equipment: (A) or (B) 150 gp.
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Studded leather armor, dagger, thieves' tools, tinker's tools, Dungeoneer's Pack and 16 gp", coins:{gp:16}, items:[
          {name:"Studded Leather",qty:1,weight:13,notes:"light armor",type:"armor",category:"light",baseAC:12},
          {name:"Dagger",qty:1,weight:1,notes:"finesse, light, thrown 20/60",type:"weapon",damageDice:"1d4",damageType:"Piercing",ability:"finesse",proficient:true},
          {name:"Thieves' Tools",qty:1,weight:1,notes:"pick locks and disarm traps"},
          {name:"Tinker's Tools",qty:1,weight:10,notes:"spellcasting focus, Tinker's Magic"},
          {name:"Dungeoneer's Pack",qty:1,weight:61.5,notes:"backpack, crowbar, hammer, 10 pitons, 10 torches, tinderbox, 10 days rations, waterskin, 50ft rope"}
        ]},
        {key:"gold", label:"150 gp", detail:"Buy your own gear", coins:{gp:150}, items:[]}
      ]}
    ],
    fixed:[]
  }
};
