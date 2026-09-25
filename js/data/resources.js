/* ---------------- Limited-use class resources ----------------
   Everything a class or subclass can spend and gets back on a rest
   (Second Wind, Ki, Bardic Inspiration, ...). Rage lives on its own card
   because it also has an on/off state.

   level: class level the resource unlocks at.
   max(lv, m): uses at class level `lv`; `m` holds the character's ability
     modifiers ({str, dex, con, int, wis, cha}).
   reset(lv): "short" or "long"; the rest that restores it (a short rest
     also counts as covered by a long rest).
   pool: true for point pools (Ki, Lay on Hands) shown as a number rather
     than pips. */

function atLeastOne(n){ return Math.max(1, n); }
function always(value){ return function(){ return value; }; }

export var CLASS_RESOURCES = {
  "Bard": [
    {id:"bardic_inspiration", name:"Bardic Inspiration", level:1,
      max:function(lv, m){ return atLeastOne(m.cha); },
      reset:function(lv){ return lv>=5 ? "short" : "long"; },
      hint:"Bonus action: give an ally within 60 ft an inspiration die (d6, d8 from level 5) to add to one check, attack or save."}
  ],
  "Cleric": [
    {id:"channel_divinity", name:"Channel Divinity", level:2,
      max:function(lv){ return lv>=18 ? 3 : lv>=6 ? 2 : 1; }, reset:always("short"),
      hint:"Turn Undead or your domain's Channel Divinity option."}
  ],
  "Druid": [
    {id:"wild_shape", name:"Wild Shape", level:2, max:always(2), reset:always("short"),
      hint:"Action (bonus action for Circle of the Moon): turn into a beast you've seen."}
  ],
  "Fighter": [
    {id:"second_wind", name:"Second Wind", level:1, max:always(1), reset:always("short"),
      hint:"Bonus action: regain 1d10 + your fighter level hit points."},
    {id:"action_surge", name:"Action Surge", level:2,
      max:function(lv){ return lv>=17 ? 2 : 1; }, reset:always("short"),
      hint:"Take one additional action on your turn."}
  ],
  "Monk": [
    {id:"ki", name:"Ki Points", level:2, pool:true,
      max:function(lv){ return lv; }, reset:always("short"),
      hint:"1 ki: Flurry of Blows, Patient Defense or Step of the Wind. Stunning Strike from level 5."}
  ],
  "Paladin": [
    {id:"divine_sense", name:"Divine Sense", level:1,
      max:function(lv, m){ return atLeastOne(1 + m.cha); }, reset:always("long"),
      hint:"Action: sense celestials, fiends and undead within 60 ft until the end of your next turn."},
    {id:"lay_on_hands", name:"Lay on Hands", level:1, pool:true,
      max:function(lv){ return lv*5; }, reset:always("long"),
      hint:"Action: restore hit points from this pool, or spend 5 to cure a disease or poison."},
    {id:"channel_divinity", name:"Channel Divinity", level:3, max:always(1), reset:always("short"),
      hint:"Use one of your Sacred Oath's Channel Divinity options."}
  ],
  "Sorcerer": [
    {id:"sorcery_points", name:"Sorcery Points", level:2, pool:true,
      max:function(lv){ return lv; }, reset:always("long"),
      hint:"Fuel Metamagic, or convert them to and from spell slots as a bonus action."}
  ],
  "Wizard": [
    {id:"arcane_recovery", name:"Arcane Recovery", level:1, max:always(1), reset:always("long"),
      hint:"During a short rest, recover spell slots with a combined level up to half your wizard level (rounded up)."}
  ]
};

/* Keyed by class, then subclass name (as in SUBCLASSES). */
export var SUBCLASS_RESOURCES = {
  "Artificer": {
    "Alchemist": [
      {id:"experimental_elixir", name:"Free Experimental Elixir", level:3,
        max:function(lv){ return lv>=15 ? 3 : lv>=6 ? 2 : 1; }, reset:always("long"),
        hint:"Elixirs you create for free after a long rest. You can still make more by spending spell slots."}
    ],
    "Artillerist": [
      {id:"eldritch_cannon", name:"Eldritch Cannon", level:3, max:always(1), reset:always("long"),
        hint:"Create a cannon without spending a spell slot. After that, each one costs a spell slot."}
    ]
  },
  "Cleric": {
    "Light Domain": [
      {id:"warding_flare", name:"Warding Flare", level:1,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Reaction: impose disadvantage on an attack against you from a creature within 30 ft."}
    ],
    "War Domain": [
      {id:"war_priest", name:"War Priest", level:1,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"When you take the Attack action, make one weapon attack as a bonus action."}
    ],
    "Tempest Domain": [
      {id:"wrath_of_the_storm", name:"Wrath of the Storm", level:1,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Reaction when hit by a creature within 5 ft: it takes 2d8 lightning or thunder damage (DEX save for half)."}
    ]
  },
  "Druid": {
    "Circle of the Land": [
      {id:"natural_recovery", name:"Natural Recovery", level:2, max:always(1), reset:always("long"),
        hint:"During a short rest, recover spell slots with a combined level up to half your druid level (rounded up)."}
    ]
  },
  "Fighter": {
    "Battle Master": [
      {id:"superiority_dice", name:"Superiority Dice", level:3,
        max:function(lv){ return lv>=15 ? 6 : lv>=7 ? 5 : 4; }, reset:always("short"),
        hint:"d8s (d10 from level 10) that fuel your maneuvers."}
    ]
  },
  "Sorcerer": {
    "Wild Magic": [
      {id:"tides_of_chaos", name:"Tides of Chaos", level:1, max:always(1), reset:always("long"),
        hint:"Gain advantage on one attack roll, ability check or saving throw. Also comes back when you roll a Wild Magic Surge."}
    ]
  },
  "Warlock": {
    "The Archfey": [
      {id:"fey_presence", name:"Fey Presence", level:1, max:always(1), reset:always("short"),
        hint:"Action: creatures in a 10-ft cube around you must make a WIS save or be charmed or frightened."}
    ]
  },
  "Wizard": {
    "School of Divination": [
      {id:"portent", name:"Portent Dice", level:2,
        max:function(lv){ return lv>=14 ? 3 : 2; }, reset:always("long"),
        hint:"Roll these d20s after a long rest and write them down. Replace any attack, save or check you can see with one of them."}
    ]
  }
};
