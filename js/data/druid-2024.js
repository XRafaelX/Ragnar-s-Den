/* The 2024 Druid (Player's Handbook 2024, pp. 78 to 88), a choice per
   character next to the 2014 one (the class entry's `edition: "2024"`).
   Checked against the printed book on 2026-11-06. Only what differs from
   the 2014 druid is here. What the features do on the sheet is in
   js/core/druid.js.

   Wild Shape keeps your own hit points and gives temporary ones (c.wildShape
   .own), two uses with one back on a short rest. The circle comes at level 3
   (`subclassLevel`). Primal Order is a choice whose effects (`choiceEffects`)
   the sheet applies, like the 2024 cleric's Divine Order.

   The 2024 circles carry " (2024)" (classLevelOf counts them for their 2014
   names, so what's the same is automated once). The Circle of the Sea is
   new. The older circles with no 2024 version stay open to a 2024 druid. */

var SKILLS = ["Arcana","Animal Handling","Insight","Medicine","Nature","Perception","Religion","Survival"];
var EXPLORERS_PACK = {name:"Explorer's Pack",qty:1,weight:59,notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"};
var ORDERS = {
  "Magician": "One extra druid cantrip, and your Wisdom modifier (minimum +1) added to Intelligence (Arcana or Nature) checks.",
  "Warden": "Trained for battle: proficiency with martial weapons and training with medium armor."
};
var FURY = {
  "Potent Spellcasting": "Add your Wisdom modifier to the damage you deal with any druid cantrip (already in your cantrips' lines). From level 15, a druid cantrip with a range of 10 feet or more reaches 300 feet farther.",
  "Primal Strike": "Once on each of your turns when you hit a creature with a weapon or a Beast form's attack, it takes an extra 1d8 cold, fire, lightning or thunder damage (your choice). 2d8 from level 15. The die is on your weapon cards and your form's attacks."
};
/* Wild Shape's uses by druid level (p. 80). */
export function wildShapeUses2024(lv){ return lv >= 17 ? 4 : lv >= 6 ? 3 : 2; }
/* The land's damage type for Nature's Ward (p. 85). */
export var LAND_WARDS = {Arid: "fire", Polar: "cold", Temperate: "lightning", Tropical: "poison"};

export var DRUID_2024 = {
  label: "2024 Druid",
  blurb: "A nature spellcaster who keeps their own hit points in Wild Shape, with a Primal Order and a circle at level 3.",
  card: {perks: ["Primal Order", "New Wild Shape", "Elemental Fury"],
    text: "The 2024 rules for the druid: a Primal Order at level 1 (an extra cantrip or medium armor), a Wild Shape that keeps your own hit points with temporary ones on top, Wild Resurgence, Elemental Fury, a circle at level 3 and the 2024 circles, the Circle of the Sea among them.",
    outcome: "<b>2024 Druid:</b> a Primal Order, the new Wild Shape, Elemental Fury, a circle at level 3, and the 2024 features, gear and circles."},
  which: {old: "The Player's Handbook 2014 druid.", now: "The Player's Handbook 2024 druid: a Primal Order, the new Wild Shape and a circle at level 3."},
  swaps: {"Circle of the Land":"Circle of the Land (2024)", "Circle of the Moon":"Circle of the Moon (2024)", "Circle of Stars":"Circle of the Stars (2024)"},
  subclassLevel: 3,
  skillChoices: {count:2, options:SKILLS},
  proficiencies: {armor:["Light armor","Shields"], weapons:["Simple weapons"], tools:["Herbalism kit"], savingThrows:["int","wis"]},
  // A multiclass: light armor and shields, and the level 1 features (p. 79).
  multiclassProfs: {armor:["Light armor","Shields"], weapons:[], tools:[], note:""},
  spellcasting: {ability:"wis", spellList:"Druid", cantrips:2, spells:4, prepares:true, slots:{1:2},
    spellsLabel:"Prepared spells",
    spellsHelp:"You know every druid spell. You prepare four of them (more as you level). Animal Friendship, Cure Wounds, Faerie Fire and Thunderwave are the book's suggestions. After a long rest you can change any of them on the Spells tab."},
  choiceEffects: {primalOrder: {
    "Magician": {cantrips:1, skillBonus:{skills:["Arcana","Nature"], ability:"wis", min:1}},
    "Warden": {grants:{armor:["Medium armor"], weapons:["Martial weapons"]}}
  }},
  choices: [],
  level1: [
    {name:"Spellcasting", text:"You cast druid spells using Wisdom. You know two cantrips (three at level 4, four at 10), and can replace one with another whenever you gain a druid level. You prepare four level 1 spells, more as you level, up to the Prepared count on the Spells tab, and can change them all after a long rest. A druidic focus can be your spellcasting focus."},
    {name:"Druidic", spells:["Speak with Animals"], spellKind:"prepared", text:"You know Druidic, the secret language of druids, and can leave hidden messages in it. Others spot one with a DC 15 Intelligence (Investigation) check but can't read it without magic. You always have Speak with Animals prepared."},
    {name:"Primal Order", text:"Choose a sacred role.\nMagician: " + ORDERS.Magician + "\nWarden: " + ORDERS.Warden + " (Already applied on the sheet.)",
      profs:{pick:[{kind:"choice", id:"primalOrder", noun:"role", count:1, options:Object.keys(ORDERS), details:ORDERS, label:"Choose your Primal Order"}]}}
  ],
  features: {
    2: [
      {name:"Wild Shape", text:"As a bonus action, you take a Beast form for up to half your druid level in hours, until you use Wild Shape again, are incapacitated or die. Leaving early is a bonus action too. You can do this twice (three times from level 6, four from 17), regaining one use on a short rest and all on a long rest.\nYou know four forms (six from level 4, eight from 8): beasts of challenge rating 1/4 or lower with no fly speed, 1/2 from level 4, and 1 with flying from level 8. The Rat, Riding Horse, Spider and Wolf are recommended. After a long rest you can swap one. Choose them on the Wild Shape row on Vitals.\nIn a form you keep your own hit points and gain temporary hit points equal to your druid level. The beast's statistics replace yours except your hit points, Intelligence, Wisdom, Charisma, features, languages and feats. You can't cast spells, but concentration isn't broken. Transform from Wild Shape on the Vitals tab."},
      {name:"Wild Companion", spells:["Find Familiar"], spellKind:"free", spellLabel:"Slot or Wild Shape", spellTip:"Wild Companion: spend a spell slot or a use of Wild Shape to cast it without material components (from Wild Shape on the Vitals tab). The familiar is a fey and leaves when you finish a long rest.",
        text:"As a Magic action, you can spend a spell slot or a use of Wild Shape to cast Find Familiar without material components. The familiar is a fey and disappears when you finish a long rest."}
    ],
    5: [{name:"Wild Resurgence", text:"Once on each of your turns, if you have no uses of Wild Shape left, you can spend a spell slot to get one back (no action needed). You can also spend a use of Wild Shape to get a level 1 spell slot back, once per long rest. Both are buttons on the Wild Shape row."}],
    7: [{name:"Elemental Fury", text:"Choose one, on the Feature choices card.\nPotent Spellcasting: " + FURY["Potent Spellcasting"] + "\nPrimal Strike: " + FURY["Primal Strike"],
      profs:{pick:[{kind:"choice", id:"elementalFury", noun:"option", count:1, options:Object.keys(FURY), details:FURY, label:"Choose your Elemental Fury"}]}}],
    15: [{name:"Improved Elemental Fury", text:"Your Elemental Fury grows stronger. Potent Spellcasting: a druid cantrip with a range of 10 feet or more reaches 300 feet farther. Primal Strike: the extra damage becomes 2d8."}],
    18: [{name:"Beast Spells", text:"While in Wild Shape, you can cast spells, except one with a material component that has a cost or is consumed."}],
    19: [{name:"Epic Boon", text:"You gain an Epic Boon feat or another feat you qualify for. Boon of Dimensional Travel is recommended. Take it in place of raising your scores at this level-up."}],
    20: [{name:"Archdruid", text:"Evergreen Wild Shape: when you roll initiative with no Wild Shape uses left, you regain one (the sheet does this).\nNature Magician: once per long rest, turn unspent uses of Wild Shape into one spell slot, two slot levels per use (two uses make a level 4 slot). A button on the Wild Shape row.\nLongevity: you age only one year for every ten that pass."}]
  },
  // The book's starting equipment: (A) or (B) 50 gp (p. 79).
  equipment: {
    choiceGroups:[
      {options:[
        {key:"a", label:"Leather armor, shield, sickle, druidic focus (quarterstaff), Explorer's Pack, herbalism kit and 9 gp", coins:{gp:9}, items:[
          {name:"Leather",qty:1,weight:10,notes:"light armor",type:"armor",category:"light",baseAC:11},
          {name:"Shield",qty:1,weight:6,notes:"+2 AC",type:"armor",category:"shield",baseAC:2},
          {name:"Sickle",qty:1,weight:2,notes:"light",type:"weapon",damageDice:"1d4",damageType:"Slashing",ability:"str",proficient:true},
          {name:"Quarterstaff",qty:1,weight:4,notes:"versatile 1d8, druidic focus",type:"weapon",damageDice:"1d6",damageType:"Bludgeoning",ability:"str",proficient:true},
          EXPLORERS_PACK,
          {name:"Herbalism Kit",qty:1,weight:3,notes:"identify and apply herbs"}
        ]},
        {key:"gold", label:"50 gp", detail:"Buy your own gear", coins:{gp:50}, items:[]}
      ]}
    ],
    fixed:[]
  }
};

/* A circle's spell table: the feature at each level with what's prepared so
   far, added to that circle's own features. */
function circleSpells(label, table, features){
  var have = [];
  Object.keys(table).forEach(function(lv){
    have = have.concat(table[lv]);
    var f = {name:label, text:"You always have " + have.join(", ").replace(/, ([^,]*)$/, " and $1") + " prepared. They don't count against your prepared spells.", spells:have.slice(), spellKind:"prepared"};
    if(lv!=="3") f.replaces = label;
    features[lv] = [f].concat(features[lv] || []);
  });
  return features;
}
var LANDS = {
  Arid: {3:["Blur","Burning Hands","Fire Bolt"], 5:["Fireball"], 7:["Blight"], 9:["Wall of Stone"]},
  Polar: {3:["Fog Cloud","Hold Person","Ray of Frost"], 5:["Sleet Storm"], 7:["Ice Storm"], 9:["Cone of Cold"]},
  Temperate: {3:["Misty Step","Shocking Grasp","Sleep"], 5:["Lightning Bolt"], 7:["Freedom of Movement"], 9:["Tree Stride"]},
  Tropical: {3:["Acid Splash","Ray of Sickness","Web"], 5:["Stinking Cloud"], 7:["Polymorph"], 9:["Insect Plague"]}
};
var STAR_MAPS = ["A scroll of constellations","A stone tablet with fine holes","An owlbear hide tooled with stars","Maps bound in an ebony cover","A crystal engraved with stars","A glass disk etched with constellations"];

/* The 2024 circles (Player's Handbook 2024, pp. 84 to 88). */
export var DRUID_2024_SUBCLASSES = [
  {name:"Circle of the Land (2024)", edition:"2024", blurb:"Celebrates a connection to the land, with spells that follow it.", features:{
    3:[
      {name:"Circle Spells", spellChoice:{id:"land", label:"Land", options:LANDS}, spellKind:"prepared", text:"Whenever you finish a long rest, choose a land: arid, polar, temperate or tropical. You have its spells for your druid level and lower prepared (on the Spells tab, where you can change the land).\nArid: Blur, Burning Hands, Fire Bolt (3), Fireball (5), Blight (7), Wall of Stone (9).\nPolar: Fog Cloud, Hold Person, Ray of Frost (3), Sleet Storm (5), Ice Storm (7), Cone of Cold (9).\nTemperate: Misty Step, Shocking Grasp, Sleep (3), Lightning Bolt (5), Freedom of Movement (7), Tree Stride (9).\nTropical: Acid Splash, Ray of Sickness, Web (3), Stinking Cloud (5), Polymorph (7), Insect Plague (9)."},
      {name:"Land's Aid", text:"As a Magic action, spend a use of Wild Shape and choose a point within 60 feet. Each creature you choose in a 10-foot-radius sphere there makes a Constitution save against your spell save DC, taking 2d6 necrotic damage on a failure or half on a success. One creature you choose there regains 2d6 hit points. Both become 3d6 at level 10 and 4d6 at 14. A button on the Wild Shape row."}
    ],
    6:[{name:"Natural Recovery", text:"You can cast one level 1 or higher spell from your Circle Spells without a spell slot, once per long rest. Also, once per long rest when you finish a short rest, you can recover spent spell slots with a combined level up to half your druid level (rounded up), none of level 6 or higher. Both are rows on Vitals."}],
    10:[{name:"Nature's Ward", conditionImmune:["poisoned"], text:"You are immune to the poisoned condition, and you resist the damage type of your current land: arid fire, polar cold, temperate lightning, tropical poison (already on the sheet)."}],
    14:[{name:"Nature's Sanctuary", text:"As a Magic action, spend a use of Wild Shape to make spectral trees and vines fill a 15-foot cube on the ground within 120 feet, for 1 minute or until you're incapacitated or die. You and your allies have half cover there, and your allies gain your Nature's Ward resistance there. As a bonus action, you can move the cube up to 60 feet. Start it from the Active effects card."}]
  }},
  {name:"Circle of the Moon (2024)", edition:"2024", blurb:"Adopts animal forms with lunar magic to guard the wilds.", features:circleSpells("Circle of the Moon Spells", {
    3:["Cure Wounds","Moonbeam","Starry Wisp"], 5:["Conjure Animals"], 7:["Fount of Moonlight"], 9:["Mass Cure Wounds"]
  }, {
    3:[{name:"Circle Forms", text:"When you take a Wild Shape form: its challenge rating can be up to your druid level divided by 3 (rounded down, at least 1), your AC is 13 + your Wisdom modifier if that's higher than the beast's, and you gain temporary hit points equal to three times your druid level. You can cast your Circle of the Moon spells in a form. The sheet applies all of these."}],
    6:[{name:"Improved Circle Forms", text:"In a Wild Shape form, each of your attacks can deal its normal damage type or radiant damage (your choice on each hit), and you add your Wisdom modifier to your Constitution saving throws (already on your saves while you're in a form)."}],
    10:[{name:"Moonlight Step", text:"As a bonus action, you teleport up to 30 feet to a space you can see, and have advantage on your next attack roll before the end of the turn. Uses equal to your Wisdom modifier (minimum once), regained on a long rest, or spend a level 2 or higher spell slot for each use."}],
    14:[{name:"Lunar Form", text:"Improved Lunar Radiance: once per turn, a Wild Shape form's attack that hits deals an extra 2d10 radiant damage (a button on the form's attacks).\nShared Moonlight: when you use Moonlight Step, you can also teleport a willing creature within 10 feet of you to a space within 10 feet of your destination."}]
  })},
  {name:"Circle of the Sea", edition:"2024", blurb:"Becomes one with tides and storms.", features:circleSpells("Circle of the Sea Spells", {
    3:["Fog Cloud","Gust of Wind","Ray of Frost","Shatter","Thunderwave"], 5:["Lightning Bolt","Water Breathing"], 7:["Control Water","Ice Storm"], 9:["Conjure Elemental","Hold Monster"]
  }, {
    3:[{name:"Wrath of the Sea", text:"As a bonus action, spend a use of Wild Shape to wrap yourself in a 5-foot emanation of ocean spray for 10 minutes (it ends if you dismiss it, use it again or are incapacitated). When it appears, and as a bonus action on later turns, choose another creature you can see in it: it makes a Constitution save against your spell save DC or takes cold damage, a number of d6s equal to your Wisdom modifier (minimum one), and if it's Large or smaller is pushed up to 15 feet away. Start it from the Active effects card."}],
    6:[{name:"Aquatic Affinity", speeds:[{type:"swim", value:"walk"}], text:"Your Wrath of the Sea's emanation is 10 feet. You have a swim speed equal to your speed."}],
    10:[{name:"Stormborn", text:"While your Wrath of the Sea is active, you have a fly speed equal to your speed, and resistance to cold, lightning and thunder damage (the sheet adds them while it's on)."}],
    14:[{name:"Oceanic Gift", text:"You can manifest your Wrath of the Sea around a willing creature within 60 feet instead of yourself. It gains its benefits and uses your spell save DC and Wisdom modifier. Spending two uses of Wild Shape puts it around both of you."}]
  })},
  {name:"Circle of the Stars (2024)", edition:"2024", blurb:"Harnesses secrets hidden in the constellations.", features:{
    3:[
      {name:"Star Map", spells:["Guidance","Guiding Bolt"], spellKind:"prepared", spellLabel:"Map, free WIS times", spellTip:"Star Map: while you hold your map, you have it prepared, and can cast Guiding Bolt without a spell slot a number of times equal to your Wisdom modifier (counter on Vitals).",
        profs:{pick:[{kind:"choice", id:"starMap", noun:"map", count:1, options:STAR_MAPS, label:"Choose your star map's form"}]},
        text:"Your star map is a Tiny object and a spellcasting focus. While you hold it, you have Guidance and Guiding Bolt prepared, and can cast Guiding Bolt without a spell slot a number of times equal to your Wisdom modifier (minimum once), regained on a long rest. A lost map can be remade in a 1-hour ceremony during a rest."},
      {name:"Starry Form", text:"As a bonus action, spend a use of Wild Shape to take a starry form instead of a beast's, for 10 minutes (until you dismiss it, are incapacitated or use this again). You keep your statistics and shed bright light for 10 feet and dim light 10 feet beyond. Choose a constellation.\nArcher: when you take this form, and as a bonus action on later turns, a ranged spell attack at a creature within 60 feet: 1d8 + your Wisdom modifier radiant damage.\nChalice: when you cast a spell with a slot that restores hit points, you or a creature within 30 feet regains 1d8 + your Wisdom modifier hit points.\nDragon: a d20 roll of 9 or lower on an Intelligence or Wisdom check, or a Constitution save to keep concentration, counts as a 10. Start it from the Active effects card."}
    ],
    6:[{name:"Cosmic Omen", text:"After a long rest, roll a die: even is Weal, odd is Woe (the sheet rolls it). Until your next long rest, when a creature you can see within 30 feet is about to make a d20 test, you can take a reaction to roll 1d6 and add it (Weal) or subtract it (Woe). Uses equal to your Wisdom modifier (minimum once), regained on a long rest."}],
    10:[{name:"Twinkling Constellations", text:"The Archer's and Chalice's 1d8 becomes 2d8. While the Dragon is active, you have a fly speed of 20 feet and can hover. At the start of each of your turns in your starry form, you can change its constellation."}],
    14:[{name:"Full of Stars", text:"While in your starry form, you have resistance to bludgeoning, piercing and slashing damage."}]
  }}
];
