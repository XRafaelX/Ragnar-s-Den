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

   The four subclasses are new versions ("Alchemist (2024)"...); the
   Tasha's ones stay for the Tasha's artificer (`swaps`). classLevelOf
   counts a 2024 one under its old name, so what's the same is automated
   once. */

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
  swaps: {"Alchemist":"Alchemist (2024)", "Armorer":"Armorer (2024)", "Artillerist":"Artillerist (2024)", "Battle Smith":"Battle Smith (2024)"},
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

/* Always-prepared subclass spells: a feature at 3 and one replacing it at
   each new pair (5, 9, 13, 17). */
function subclassSpells(label, byLevel){
  var out = {}, all = [];
  [3, 5, 9, 13, 17].forEach(function(lv, i){
    all = all.concat(byLevel[lv]);
    var f = {name: label, text: "You always have " + all.join(", ").replace(/, ([^,]*)$/, " and $1") + " prepared. They don't count against your prepared spells.",
      spells: all.slice(), spellKind: "prepared"};
    if(i) f.replaces = label;
    out[lv] = [f];
  });
  return out;
}
function merge(spells, features){
  var out = {};
  Object.keys(spells).concat(Object.keys(features)).forEach(function(lv){ out[lv] = (features[lv] || []).concat(spells[lv] || []); });
  return out;
}

/* The 2024 subclasses (Eberron: Forge of the Artificer), checked against
   5etools' class-artificer.json (source EFA) on 2026-11-12. */
export var ARTIFICER_2024_SUBCLASSES = [
  {name:"Alchemist (2024)", edition:"2024", blurb:"Brews elixirs that heal, speed and protect, and leeches life with acid and poison.",
    features: merge(subclassSpells("Alchemist Spells", {3:["Healing Word","Ray of Sickness"], 5:["Flaming Sphere","Melf's Acid Arrow"], 9:["Gaseous Form","Mass Healing Word"], 13:["Death Ward","Vitriolic Sphere"], 17:["Cloudkill","Raise Dead"]}), {
    3:[{name:"Tools of the Trade", grants:{tools:["Alchemist's supplies","Herbalism kit"]},
        text:"You gain proficiency with alchemist's supplies and the herbalism kit (another type of artisan's tools for each you already have). Brewing a potion with the Dungeon Master's Guide's crafting rules takes you half the time."},
      {name:"Experimental Elixir", text:"When you finish a long rest holding alchemist's supplies, you make two elixirs (three at level 5, four at 9, five at 15), each rolled on the Experimental Elixir table (a 6 lets you choose). As a bonus action a creature can drink one or give it to a creature within 5 feet. Elixirs left over vanish at your next long rest. As a Magic action with alchemist's supplies, you can spend a spell slot to make another, choosing its effect. The elixirs are on the Inventory tab."}],
    5:[{name:"Alchemical Savant", text:"When you cast a spell with alchemist's supplies as your focus, add your INT modifier (at least +1) to one roll of it that restores hit points or deals acid, fire or poison damage."}],
    9:[{name:"Restorative Reagents", spells:["Lesser Restoration"], spellKind:"free", spellLabel:"Free INT mod/long rest",
      spellTip:"Restorative Reagents: cast it without a spell slot or preparing it, with alchemist's supplies as your focus, a number of times equal to your INT modifier (counter on Vitals).",
      text:"You can cast Lesser Restoration without a spell slot or preparing it, using alchemist's supplies as your focus, a number of times equal to your INT modifier (at least once) per long rest."}],
    15:[{name:"Chemical Mastery", resist:["acid", "poison"], conditionImmune:["poisoned"], spells:["Tasha's Bubbling Cauldron"], spellKind:"free", spellLabel:"Free 1/long rest",
      spellTip:"Chemical Mastery: Conjured Cauldron casts it without a spell slot, preparing it or material components, with alchemist's supplies as your focus, once per long rest (counter on Vitals).",
      text:"Alchemical Eruption: when you cast an artificer spell that deals acid, fire or poison damage to a target, you can also deal it 2d8 force damage, once on each of your turns. Chemical Resistance: you have resistance to acid and poison damage and are immune to the poisoned condition. Conjured Cauldron: you can cast Tasha's Bubbling Cauldron without a spell slot, preparing it or material components, using alchemist's supplies as your focus, once per long rest."}]
  })},
  {name:"Armorer (2024)", edition:"2024", blurb:"Turns a suit of armor into a towering juggernaut, a guardian or an infiltrator.",
    features: merge(subclassSpells("Armorer Spells", {3:["Magic Missile","Thunderwave"], 5:["Mirror Image","Shatter"], 9:["Hypnotic Pattern","Lightning Bolt"], 13:["Fire Shield","Greater Invisibility"], 17:["Passwall","Wall of Force"]}), {
    3:[{name:"Tools of the Trade", grants:{armor:["Heavy armor"], tools:["Smith's tools"]},
        text:"You gain training with heavy armor and proficiency with smith's tools (or another type of artisan's tools if you already have it). Crafting armor takes you half the time."},
      {name:"Arcane Armor", text:"As a Magic action with smith's tools in hand, turn a suit of armor you're wearing into Arcane Armor, until you don another suit or die. While you wear it, it has no Strength requirement for you, you can don or doff it as a Utilize action (it can't be removed against your will), and it can be your spellcasting focus for artificer spells."},
      {name:"Armor Model", text:"Choose a model for your Arcane Armor (change it after a short or long rest with smith's tools in hand). Each has a special weapon that can use your INT modifier instead of STR or DEX for attack and damage rolls. Dreadnaught: Force Demolisher (simple melee weapon with reach, 1d10 force; a creature at least a size smaller can be pushed or pulled 10 feet) and Giant Stature (bonus action: 1 minute, your reach grows 5 feet and you become Large, INT modifier times per long rest). Guardian: Thunder Pulse (simple melee weapon, 1d8 thunder; a creature hit has disadvantage on attacks against anyone but you until your next turn) and Defensive Field (while bloodied, bonus action: temporary HP equal to your artificer level, lost if you doff the armor). Infiltrator: Lightning Launcher (simple ranged weapon, 90/300 feet, 1d6 lightning, once per turn an extra 1d6 on a hit), Powered Steps (+5 feet speed) and Dampening Field (advantage on Stealth checks). The model's card is on the Inventory tab."}],
    5:[{name:"Extra Attack", text:"You can attack twice instead of once whenever you take the Attack action on your turn."}],
    9:[{name:"Improved Armorer", text:"Armor Replication: you learn one more plan for Replicate Magic Item, which must be armor, and you can have one more item made, which must be armor too. Improved Arsenal: a +1 bonus to attack and damage rolls with your armor model's special weapon."}],
    15:[{name:"Perfected Armor", text:"Dreadnaught: Force Demolisher deals 2d6 force, and Giant Stature grows your reach by 10 feet, makes you Large or Huge and gives you advantage on Strength checks and saves while it lasts. Guardian: Thunder Pulse deals 1d10 thunder, and when a Huge or smaller creature you can see ends its turn within 30 feet, you can take a reaction to force a STR save against your spell save DC, pulling it up to 25 feet toward you on a failure, then make a melee weapon attack against it if it's within 5 feet (INT modifier times per long rest). Infiltrator: Lightning Launcher deals 2d6 lightning, a creature it damages glimmers until your next turn (dim light, disadvantage on attacks against you), and as a bonus action you can gain a fly speed of twice your speed until the end of the turn (INT modifier times per long rest)."}]
  })},
  {name:"Artillerist (2024)", edition:"2024", blurb:"Builds a magical cannon that blasts foes or shields allies.",
    features: merge(subclassSpells("Artillerist Spells", {3:["Shield","Thunderwave"], 5:["Scorching Ray","Shatter"], 9:["Fireball","Wind Wall"], 13:["Ice Storm","Wall of Fire"], 17:["Cone of Cold","Wall of Force"]}), {
    3:[{name:"Tools of the Trade", grants:{weapons:["Martial ranged weapons"], tools:["Woodcarver's tools"]},
        text:"You gain proficiency with martial ranged weapons and woodcarver's tools (or another type of artisan's tools if you already have it). Crafting a magic wand takes you half the time."},
      {name:"Eldritch Cannon", text:"With smith's or woodcarver's tools, take a Magic action to create a Small or Tiny eldritch cannon on a horizontal surface within 5 feet (carried, or with legs or wheels). It has AC 18, hit points equal to five times your artificer level and immunity to poison and psychic damage, and Mending restores 2d6. It disappears at 0 hit points or after 1 hour, or when you dismiss it as a Magic action. You can have only one. As a bonus action within 60 feet, activate it (and move it up to 15 feet): Flamethrower (15-foot cone, DEX save for 2d8 fire, half on a success), Force Ballista (ranged spell attack within 120 feet, 2d8 force and a 5-foot push) or Protector (it and creatures of your choice within 10 feet gain 1d8 + your INT modifier temporary HP). Once per long rest, or spend a spell slot to create another. Its card is on the Companions tab."}],
    5:[{name:"Arcane Firearm", text:"When you finish a long rest, you can use woodcarver's tools to carve sigils into a rod, staff, wand or martial ranged weapon, making it your arcane firearm. It can be your spellcasting focus for artificer spells, and when you cast an artificer spell through it, roll a d8 and add it to one of the spell's damage rolls."}],
    9:[{name:"Explosive Cannon", text:"Firepower: your cannon's damage rolls and Protector's temporary hit points increase by 1d8. Detonate: when your cannon takes damage and you're within 60 feet, you can take a reaction to make it explode: each creature within 20 feet of it makes a DEX save against your spell save DC, taking 3d10 force damage on a failure or half on a success."}],
    15:[{name:"Fortified Position", text:"You can have two cannons at once and create both with one Magic action (a second spell slot if the first needed one), and activate both with one bonus action. You and your allies have half cover within 10 feet of your cannon."}]
  })},
  {name:"Battle Smith (2024)", edition:"2024", blurb:"A protector and medic fighting beside a loyal steel defender.",
    features: merge(subclassSpells("Battle Smith Spells", {3:["Heroism","Shield"], 5:["Shining Smite","Warding Bond"], 9:["Aura of Vitality","Conjure Barrage"], 13:["Aura of Purity","Fire Shield"], 17:["Banishing Smite","Mass Cure Wounds"]}), {
    3:[{name:"Tools of the Trade", grants:{tools:["Smith's tools"]},
        text:"You gain proficiency with smith's tools (or another type of artisan's tools if you already have it). Crafting a weapon takes you half the time."},
      {name:"Battle Ready", grants:{weapons:["Martial weapons"]}, magicWeaponAbility:"int",
        text:"Arcane Empowerment: when you attack with a magic weapon, you can use your INT modifier instead of STR or DEX for the attack and damage rolls (the sheet does this for magic weapons). Weapon Knowledge: you gain proficiency with martial weapons, and any weapon you're proficient with can be your spellcasting focus for artificer spells."},
      {name:"Steel Defender", text:"Your steel defender acts during your turn. It can move and take its reaction on its own, but only takes the Dodge action unless you take a bonus action to command it (or you're incapacitated). If it died within the last hour, you can touch it as a Magic action and spend a spell slot: it returns to life after 1 minute with all its hit points. After a long rest with smith's tools in hand, you can build a new one (the old one vanishes). It vanishes if you die. Its card is on the Companions tab."}],
    5:[{name:"Extra Attack", text:"You can attack twice instead of once whenever you take the Attack action on your turn. You can give up one of those attacks to command your steel defender to use its Force-Empowered Rend."}],
    9:[{name:"Arcane Jolt", text:"When you hit with an attack roll using a magic weapon, or your steel defender hits, you can channel energy through the strike: the target takes an extra 2d6 force damage, or a creature or object you can see within 30 feet of it regains 2d6 hit points. INT modifier times (at least once) per long rest, at most once per turn."}],
    15:[{name:"Improved Defender", text:"Arcane Jolt's damage and healing become 4d6, and when your steel defender uses Deflect Attack, the attacker takes 1d4 + your INT modifier force damage."}]
  })},
  // New in Forge of the Artificer.
  {name:"Cartographer", edition:"2024", source:"Eberron: Forge of the Artificer", blurb:"A navigator and scout whose magical maps guide, guard and teleport allies.",
    features: merge(subclassSpells("Cartographer Spells", {3:["Faerie Fire","Guiding Bolt","Healing Word"], 5:["Locate Object","Mind Spike"], 9:["Call Lightning","Clairvoyance"], 13:["Banishment","Locate Creature"], 17:["Scrying","Teleportation Circle"]}), {
    3:[{name:"Tools of the Trade", grants:{tools:["Calligrapher's supplies","Cartographer's tools"]},
        text:"You gain proficiency with calligrapher's supplies and cartographer's tools (another type of artisan's tools for each you already have). Scribing a spell scroll takes you half the time."},
      {name:"Adventurer's Atlas", text:"When you finish a long rest holding cartographer's tools, you can make magical maps for 2 to 1 + your INT modifier creatures you touch (you can be one). Each map shows where the other holders are, and is unreadable to anyone else. They last until you die or make new ones. A holder adds 1d4 to its initiative rolls (the sheet offers it after your initiative roll), knows where the other holders on its plane are, and can target another holder with a spell or effect regardless of sight or cover, if it's within range."},
      {name:"Mapping Magic", spells:["Faerie Fire"], spellKind:"free", spellLabel:"Free INT mod/long rest",
        spellTip:"Mapping Magic: cast it without a spell slot a number of times equal to your INT modifier (counter on Vitals).",
        remind:{when:"always", line:"Portal Jump: half your speed to teleport 10 ft, or next to a map holder"},
        text:"Illuminated Cartography: you can cast Faerie Fire without a spell slot a number of times equal to your INT modifier (at least once) per long rest. Portal Jump: on your turn, spend half your speed to teleport to an unoccupied space you can see within 10 feet, or within 5 feet of a map holder within 30 feet of you (not while your speed is 0)."}],
    5:[{name:"Guided Precision", remind:{when:"always", line:"Once per turn, +INT to a damage roll on a creature in your Faerie Fire"},
      text:"Once per turn, when you cast a spell from your Cartographer Spells list or hit a creature affected by your Faerie Fire with an attack roll, you can add your INT modifier to one damage roll of it. Taking damage can't make you lose concentration on Faerie Fire."}],
    9:[{name:"Ingenious Movement", text:"When you use Flash of Genius, you or a willing creature you can see within 30 feet can also teleport up to 30 feet to an unoccupied space you can see, as part of the same reaction."}],
    15:[{name:"Superior Atlas", spells:["Find the Path"], spellKind:"free", spellLabel:"Free 1/long rest",
      spellTip:"Superior Atlas: while you hold one of your maps, cast it without a spell slot, preparing it or components, once per long rest (counter on Vitals).",
      text:"Safe Haven: when a map holder would drop to 0 hit points and isn't killed outright, it can destroy its map: its hit points become twice your artificer level and it teleports next to you or another holder of its choice. Unerring Path: while you hold one of your maps, you can cast Find the Path without a spell slot, preparing it or components, once per long rest."}]
  })},
  // Ravenloft: The Horrors Within (2026), for the 2024 artificer.
  {name:"Reanimator", edition:"2024", source:"Ravenloft: The Horrors Within", blurb:"A grim scientist who stitches a companion from corpses and jolts the dying back to life.",
    features: merge(subclassSpells("Reanimator Spells", {3:["False Life","Spare the Dying","Witch Bolt"], 5:["Blindness/Deafness","Enhance Ability"], 9:["Animate Dead","Lightning Bolt"], 13:["Blight","Death Ward"], 17:["Antilife Shell","Raise Dead"]}), {
    3:[{name:"Reanimator's Skill Set", grants:{tools:["Alchemist's supplies"]},
        text:"Jolt to Life: when you cast Spare the Dying, you can make it revive the target, which regains hit points equal to your artificer level, and each creature of your choice within 10 feet of it makes a DEX save against your spell save DC, taking 2d4 lightning damage (3d4 at level 11, 4d4 at 17) on a failure or half on a success. INT modifier times per long rest (the row on Vitals). Reanimator's Tools: you gain proficiency with alchemist's supplies (or another type of artisan's tools if you already have it)."},
      {name:"Reanimated Companion", text:"With tinker's tools or other artisan's tools you're proficient with, take a Magic action to create a reanimated companion within 5 feet. It's friendly and obeys you, and lasts until you finish a long rest or dismiss it (Magic action). It drops to 0 hit points and dies (with its Death Burst) if you die. Once per long rest, or spend a spell slot to create another; only one at a time. In combat it acts during your turn: it moves and takes reactions on its own, but only takes the Dodge action unless you use a bonus action to command it (or you're incapacitated). Its card is on the Companions tab."}],
    5:[{name:"Strange Modifications", text:"When you create your companion, give it one modification. Arcane Conduit: you can cast spells as if from its space (with your own senses), and once per turn, when an artificer evocation or necromancy spell you cast deals damage while it's within 120 feet, add your INT modifier to one damage roll. Ferocity: its Dreadful Swipe's die becomes 1d6. Choose them on its card."}],
    9:[{name:"Improved Reanimation", text:"Your companion's Death Burst deals 4d4 necrotic damage, and necrotic damage it deals ignores resistance."},
      {name:"Macabre Modifications", text:"Your companion gets two modifications instead of one, and three more are open: Bloated (it becomes Large, its Dreadful Swipe pushes a Large or smaller creature 10 feet, and its Death Burst adds your INT modifier), Gaunt (speed 45 feet and an equal climb speed, it climbs any surface, and a creature you choose that starts its turn within 10 feet makes a WIS save or is frightened until the start of its next turn) and Moist (a swim speed equal to its speed, it fits through a 1-inch gap, and a creature within 10 feet that hits it with an attack takes acid damage equal to your INT modifier)."}],
    15:[{name:"Refined Reanimation", spells:["Raise Dead"], spellKind:"free", spellLabel:"Free 1/long rest",
      spellTip:"Refined Reanimation: cast it once without a spell slot or material components, with tinker's tools or other artisan's tools as your focus, once per long rest (counter on Vitals).",
      remind:{when:"reaction", line:"Life Transfer: when either of you is hurt, gain your companion's hit points"},
      text:"Facilitated Revival: you can cast Raise Dead once without a spell slot or material components, with tinker's tools or other artisan's tools as your focus, once per long rest. Life Transfer: when you or your companion take damage, you can take a reaction to gain hit points equal to its current hit points; it then drops to 0 and dies (with its Death Burst). Superior Modifications: your companion gets three modifications."}]
  })}
];
