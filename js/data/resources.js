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
    ],
    "Echo Knight": [
      {id:"unleash_incarnation", name:"Unleash Incarnation", level:3,
        max:function(lv, m){ return atLeastOne(m.con); }, reset:always("long"),
        hint:"When you take the Attack action, make one additional melee attack from your echo's position."}
    ],
    "Rune Knight": [
      {id:"giants_might", name:"Giant's Might", level:3,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: grow one size, deal +1d6 damage on weapon attacks, and gain advantage on STR checks and saves for 1 minute."}
    ],
    "Samurai": [
      {id:"fighting_spirit", name:"Fighting Spirit", level:3,
        max:always(3), reset:always("long"),
        hint:"Bonus action: advantage on all weapon attacks until end of your turn, and gain 5 temporary HP (10 at level 10, 15 at level 15)."}
    ]
  },
  "Sorcerer": {
    "Wild Magic": [
      {id:"tides_of_chaos", name:"Tides of Chaos", level:1, max:always(1), reset:always("long"),
        hint:"Gain advantage on one attack roll, ability check or saving throw. Also comes back when you roll a Wild Magic Surge."}
    ],
    "Shadow Magic": [
      {id:"strength_of_the_grave", name:"Strength of the Grave", level:1, max:always(1), reset:always("long"),
        hint:"When damage would drop you to 0 HP, make a CHA save (DC 5 + damage dealt) to drop to 1 HP instead. Doesn't work vs radiant or crits."}
    ],
    "Clockwork Soul": [
      {id:"restore_balance", name:"Restore Balance", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Reaction: when a creature within 60 ft rolls with advantage or disadvantage, cancel it."}
    ],
    "Aberrant Mind": [
      {id:"telepathic_speech", name:"Telepathic Speech", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: form a telepathic connection with a creature you can see within 30 ft for sorcerer-level minutes."}
    ]
  },
  "Warlock": {
    "The Archfey": [
      {id:"fey_presence", name:"Fey Presence", level:1, max:always(1), reset:always("short"),
        hint:"Action: creatures in a 10-ft cube around you must make a WIS save or be charmed or frightened."}
    ],
    "The Hexblade": [
      {id:"hexblades_curse", name:"Hexblade's Curse", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: curse a creature within 30 ft — add proficiency to damage, crit on 19–20, regain HP equal to warlock level + CHA when it dies."}
    ],
    "The Celestial": [
      {id:"healing_light", name:"Healing Light", level:1, pool:true,
        max:function(lv){ return 1 + lv; }, reset:always("long"),
        hint:"Bonus action: spend d6s from this pool (max CHA mod per turn) to heal a creature within 60 ft."}
    ],
    "The Fathomless": [
      {id:"tentacle_of_the_deeps", name:"Tentacle of the Deeps", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: summon a spectral tentacle for 1 minute — lash out for 2d8 cold damage or deal 1d8 cold to attackers as a reaction."}
    ]
  },
  "Wizard": {
    "School of Divination": [
      {id:"portent", name:"Portent Dice", level:2,
        max:function(lv){ return lv>=14 ? 3 : 2; }, reset:always("long"),
        hint:"Roll these d20s after a long rest and write them down. Replace any attack, save or check you can see with one of them."}
    ],
    "Bladesinging": [
      {id:"bladesong", name:"Bladesong", level:2,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: enter Bladesong for 1 minute — +INT to AC, +10 ft speed, advantage on Acrobatics, +INT to concentration saves."}
    ],
    "School of Enchantment": [
      {id:"hypnotic_gaze", name:"Hypnotic Gaze", level:2, max:always(1), reset:always("short"),
        hint:"Action: charm a creature within 5 ft — speed 0, incapacitated. Maintain with your action each turn. Ends if you move away or it saves."}
    ],
    "School of Transmutation": [
      {id:"shapechanger", name:"Shapechanger (Polymorph Self)", level:10, max:always(1), reset:always("short"),
        hint:"Cast Polymorph on yourself without expending a spell slot."}
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
    ],
    "Twilight Domain": [
      {id:"eyes_of_night", name:"Eyes of Night", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Action: grant up to WIS mod creatures darkvision 300 ft for 1 hour."}
    ],
    "Peace Domain": [
      {id:"emboldening_bond", name:"Emboldening Bond", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Action: bond up to proficiency-bonus creatures — each adds 1d4 to attacks, checks and saves while a bonded ally is within 30 ft."}
    ]
  },
  "Druid": {
    "Circle of the Land": [
      {id:"natural_recovery", name:"Natural Recovery", level:2, max:always(1), reset:always("long"),
        hint:"During a short rest, recover spell slots with a combined level up to half your druid level (rounded up)."}
    ],
    "Circle of Stars": [
      {id:"cosmic_omen", name:"Cosmic Omen", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Reaction: add or subtract 1d6 from a creature's attack roll, check or save (Weal adds, Woe subtracts). Determined each long rest."}
    ]
  },
  "Rogue": {
    "Phantom": [
      {id:"wails_from_the_grave", name:"Wails from the Grave", level:3,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"When you deal Sneak Attack damage, choose a creature within 30 ft — it takes half your Sneak Attack as necrotic damage."}
    ],
    "Soulknife": [
      {id:"psionic_energy_dice", name:"Psionic Energy Dice", level:3, pool:true,
        max:function(lv, m){ return m.pb * 2; }, reset:always("long"),
        hint:"Fuel Psychic Blades (off-hand), Soul Blades (Homing Strikes / Psychic Teleportation), Psychic Veil and Rend Mind. Regain 1 die on a short rest."}
    ]
  }
};
