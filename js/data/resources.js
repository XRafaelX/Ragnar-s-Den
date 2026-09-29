/* ---------------- Limited-use class resources ----------------
   Everything a class or subclass can spend and gets back on a rest
   (Second Wind, Ki, Bardic Inspiration, ...). Rage lives on its own card
   because it also has an on/off state.

   level: class level the resource unlocks at.
   max(lv, m): uses at class level `lv`; `m` holds the character's ability
     modifiers ({str, dex, con, int, wis, cha}).
   reset(lv): "short" or "long"; the rest that restores it (a short rest
     also counts as covered by a long rest). "manual" for the odd one no
     rest restores on its own (Necrotic Husk); the player regains it.
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
  "Barbarian": {
    "Path of the Zealot": [
      {id:"zealous_presence", name:"Zealous Presence", level:10, max:always(1), reset:always("long"),
        hint:"Bonus action: up to ten allies within 60 ft have advantage on attack rolls and saves until the start of your next turn."}
    ],
    "Path of the Ancestral Guardian": [
      {id:"consult_the_spirits", name:"Consult the Spirits", level:10, max:always(1), reset:always("short"),
        hint:"Cast Augury or Clairvoyance without a spell slot or material components."}
    ],
    "Path of Wild Magic": [
      {id:"magic_awareness", name:"Magic Awareness", level:3,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Action: sense spells and magic items within 60 ft until the end of your next turn."},
      {id:"bolstering_magic", name:"Bolstering Magic", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Action: a touched creature adds a d3 to attacks and checks for 10 minutes, or regains a spell slot of up to a d3's level."}
    ],
    "Path of the Beast": [
      {id:"infectious_fury", name:"Infectious Fury", level:10,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"On a natural-weapon hit while raging: WIS save or it attacks a creature you choose, or takes 2d12 psychic."},
      {id:"call_the_hunt", name:"Call the Hunt", level:14,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"When you rage: allies (up to CON mod) add 1d6 to one hit each turn; you gain 5 temp HP per ally."}
    ]
  },
  "Artificer": {
    "Alchemist": [
      {id:"experimental_elixir", name:"Free Experimental Elixir", level:3,
        max:function(lv){ return lv>=15 ? 3 : lv>=6 ? 2 : 1; }, reset:always("long"),
        hint:"Elixirs you create for free after a long rest. You can still make more by spending spell slots."},
      {id:"restorative_reagents", name:"Restorative Reagents (Lesser Restoration)", level:9,
        max:function(lv, m){ return atLeastOne(m.int); }, reset:always("long"),
        hint:"Cast Lesser Restoration without a spell slot, using alchemist's supplies as your focus."},
      {id:"chemical_mastery_greater_restoration", name:"Chemical Mastery: Greater Restoration", level:15, max:always(1), reset:always("long"),
        hint:"Cast Greater Restoration without a spell slot or material components."},
      {id:"chemical_mastery_heal", name:"Chemical Mastery: Heal", level:15, max:always(1), reset:always("long"),
        hint:"Cast Heal without a spell slot or material components."}
    ],
    "Artillerist": [
      {id:"eldritch_cannon", name:"Eldritch Cannon", level:3, max:always(1), reset:always("long"),
        hint:"Create a cannon (two at once from level 15) without spending a spell slot. After that, each one costs a spell slot."}
    ],
    "Battle Smith": [
      {id:"steel_defender_repair", name:"Steel Defender: Repair", level:3, max:always(3), reset:always("long"),
        hint:"Your steel defender's action: restore 2d8 + proficiency bonus HP to itself or a construct or object within 5 ft."},
      {id:"arcane_jolt", name:"Arcane Jolt", level:9,
        max:function(lv, m){ return atLeastOne(m.int); }, reset:always("long"),
        hint:"On a magic weapon or steel defender hit: +2d6 force damage, or heal a creature within 30 ft of the target 2d6 (4d6 from level 15)."}
    ],
    "Armorer": [
      {id:"defensive_field", name:"Defensive Field (Guardian)", level:3,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Guardian model, bonus action: gain temporary HP equal to your artificer level."},
      {id:"perfected_armor_pull", name:"Perfected Armor Pull (Guardian)", level:15,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Guardian model, reaction: pull a creature ending its turn within 30 ft up to 30 ft toward you (STR save), then attack it if adjacent."}
    ]
  },
  "Bard": {
    "College of Eloquence": [
      {id:"universal_speech", name:"Universal Speech", level:6, max:always(1), reset:always("long"),
        hint:"Action: up to CHA mod creatures within 60 ft understand you for 1 hour. More uses cost a spell slot."},
      {id:"infectious_inspiration", name:"Infectious Inspiration", level:14,
        max:function(lv, m){ return atLeastOne(m.cha); }, reset:always("long"),
        hint:"Reaction when your Bardic Inspiration die helps someone succeed: give another creature within 60 ft a free die."}
    ],
    "College of Creation": [
      {id:"performance_of_creation", name:"Performance of Creation", level:3, max:always(1), reset:always("long"),
        hint:"Action: create a nonmagical item worth up to 20 x your bard level gp. More uses cost a 2nd-level or higher spell slot."},
      {id:"animating_performance", name:"Animating Performance", level:6, max:always(1), reset:always("long"),
        hint:"Action: animate a Large or smaller nonmagical item within 30 ft as your Dancing Item for 1 hour. More uses cost a 3rd-level or higher spell slot."}
    ],
    "College of Glamour": [
      {id:"enthralling_performance", name:"Enthralling Performance", level:3, max:always(1), reset:always("short"),
        hint:"After performing for 1 minute: up to CHA mod humanoids that watched make a WIS save or are charmed by you for 1 hour."},
      {id:"mantle_of_majesty", name:"Mantle of Majesty", level:6, max:always(1), reset:always("long"),
        hint:"Bonus action: cast Command without a slot, then again as a bonus action each turn for 1 minute (concentration)."},
      {id:"unbreakable_majesty", name:"Unbreakable Majesty", level:14, max:always(1), reset:always("short"),
        hint:"Bonus action for 1 minute: the first time a creature attacks you each turn, it makes a CHA save or must pick another target."}
    ],
    "College of Spirits": [
      {id:"spirit_session", name:"Spirit Session", level:6, max:always(1), reset:always("long"),
        hint:"1-hour ritual with up to proficiency-bonus creatures: learn a divination or necromancy spell of level up to the number taking part."}
    ],
    "College of Whispers": [
      {id:"words_of_terror", name:"Words of Terror", level:3, max:always(1), reset:always("short"),
        hint:"After speaking alone with a humanoid for 1 minute: it makes a WIS save or is frightened of you (or someone you choose) for 1 hour."},
      {id:"mantle_of_whispers", name:"Mantle of Whispers", level:6, max:always(1), reset:always("short"),
        hint:"Reaction when a humanoid dies within 30 ft: capture its shadow, then use an action to take on its appearance for 1 hour."},
      {id:"shadow_lore", name:"Shadow Lore", level:14, max:always(1), reset:always("long"),
        hint:"Action: whisper to a creature within 30 ft. On a failed WIS save it is charmed for 8 hours, sure you know its darkest secret."}
    ]
  },
  "Fighter": {
    "Battle Master": [
      {id:"superiority_dice", name:"Superiority Dice", level:3,
        max:function(lv){ return lv>=15 ? 6 : lv>=7 ? 5 : 4; }, reset:always("short"),
        hint:"d8s (d10 from level 10, d12 from level 18) that fuel your maneuvers. Relentless (level 15) gives one back on initiative if you have none."}
    ],
    "Echo Knight": [
      {id:"unleash_incarnation", name:"Unleash Incarnation", level:3,
        max:function(lv, m){ return atLeastOne(m.con); }, reset:always("long"),
        hint:"When you take the Attack action, make one additional melee attack from your echo's position."},
      {id:"shadow_martyr", name:"Shadow Martyr", level:10, max:always(1), reset:always("short"),
        hint:"Reaction: teleport your echo next to a creature about to be attacked; the attack targets the echo instead."},
      {id:"reclaim_potential", name:"Reclaim Potential", level:15,
        max:function(lv, m){ return atLeastOne(m.con); }, reset:always("long"),
        hint:"When your echo is destroyed by damage: gain 2d6 + CON mod temporary HP (if you have none)."}
    ],
    "Rune Knight": [
      {id:"giants_might", name:"Giant's Might", level:3,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action for 1 minute: become Large, advantage on STR checks and saves, +1d6 damage once per turn (1d8 at 10, 1d10 at 18)."},
      {id:"runic_shield", name:"Runic Shield", level:7,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Reaction: force a reroll when another creature within 60 ft is hit by an attack roll."}
    ],
    "Cavalier": [
      {id:"unwavering_mark", name:"Unwavering Mark (Special Attack)", level:3,
        max:function(lv, m){ return atLeastOne(m.str); }, reset:always("long"),
        hint:"Bonus action: attack a marked creature that damaged someone else, with advantage and + half your fighter level damage."},
      {id:"warding_maneuver", name:"Warding Maneuver", level:7,
        max:function(lv, m){ return atLeastOne(m.con); }, reset:always("long"),
        hint:"Reaction: add 1d8 to the AC of you or an adjacent creature against a hit; resistance if it still hits."}
    ],
    "Samurai": [
      {id:"fighting_spirit", name:"Fighting Spirit", level:3,
        max:always(3), reset:always("long"),
        hint:"Bonus action: advantage on weapon attacks until the end of your turn, and gain 5 temporary HP (10 at level 10, 15 at level 15)."},
      {id:"strength_before_death", name:"Strength Before Death", level:18, max:always(1), reset:always("long"),
        hint:"Reaction when dropped to 0 HP: take an extra turn immediately before falling unconscious."}
    ],
    "Arcane Archer": [
      {id:"arcane_shot", name:"Arcane Shot", level:3, max:always(2), reset:always("short"),
        hint:"Once per turn, apply an Arcane Shot option to an arrow fired as part of the Attack action. Regain one on initiative if empty (level 15)."}
    ],
    "Psi Warrior": [
      {id:"psionic_energy_dice", name:"Psionic Energy Dice", level:3, pool:true,
        max:function(lv, m){ return m.pb * 2; }, reset:always("long"),
        hint:"Fuel Protective Field, Psionic Strike and extra uses of your other psionic features. Bonus action: regain one (once per short or long rest)."},
      {id:"telekinetic_movement", name:"Telekinetic Movement", level:3, max:always(1), reset:always("short"),
        hint:"Action: move a Large or smaller object or a willing creature within 30 ft up to 30 ft. More uses cost a Psionic Energy die."},
      {id:"psi_powered_leap", name:"Psi-Powered Leap", level:7, max:always(1), reset:always("short"),
        hint:"Bonus action: flying speed equal to twice your walking speed until the end of the turn. More uses cost a Psionic Energy die."},
      {id:"bulwark_of_force", name:"Bulwark of Force", level:15, max:always(1), reset:always("long"),
        hint:"Bonus action: up to INT mod creatures within 30 ft (you included) gain half cover for 1 minute. More uses cost a Psionic Energy die."},
      {id:"telekinetic_master", name:"Telekinetic Master", level:18, max:always(1), reset:always("long"),
        hint:"Cast Telekinesis without a slot; make a weapon attack as a bonus action each turn you concentrate on it. More uses cost a Psionic Energy die."}
    ]
  },
  "Monk": {
    "Way of the Open Hand": [
      {id:"wholeness_of_body", name:"Wholeness of Body", level:6, max:always(1), reset:always("long"),
        hint:"Action: regain hit points equal to three times your monk level."}
    ],
    "Way of Mercy": [
      {id:"free_hand_of_harm", name:"Free Hand of Harm (Flurry)", level:11,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Use Hand of Harm on a Flurry of Blows strike without spending ki."},
      {id:"hand_of_ultimate_mercy", name:"Hand of Ultimate Mercy", level:17, max:always(1), reset:always("long"),
        hint:"Action, 5 ki: revive a creature dead under 24 hours with 4d10 + WIS mod HP."}
    ],
    "Way of the Ascendant Dragon": [
      {id:"draconic_presence", name:"Draconic Presence", level:3, max:always(1), reset:always("long"),
        hint:"Reaction: reroll a failed CHA (Intimidation or Persuasion) check. Spent only when the reroll succeeds."},
      {id:"breath_of_the_dragon", name:"Breath of the Dragon", level:3,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Replace one attack with a 20-ft cone or 30-ft line of elemental damage (DEX save). When out, spend 2 ki instead."},
      {id:"wings_unfurled", name:"Wings Unfurled", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"When you use Step of the Wind, gain a flying speed equal to your walking speed until the end of the turn."},
      {id:"aspect_of_the_wyrm", name:"Aspect of the Wyrm", level:11, max:always(1), reset:always("long"),
        hint:"Bonus action: 10-ft aura for 1 minute with Frightful Presence or elemental resistance. More uses cost 3 ki."}
    ]
  },
  "Paladin": {
    "Oath of Devotion": [
      {id:"holy_nimbus", name:"Holy Nimbus", level:20, max:always(1), reset:always("long"),
        hint:"Action for 1 minute: 30-ft bright light that deals 10 radiant to enemies starting their turn in it."}
    ],
    "Oath of the Ancients": [
      {id:"undying_sentinel", name:"Undying Sentinel", level:15, max:always(1), reset:always("long"),
        hint:"When reduced to 0 HP and not killed outright, drop to 1 HP instead."},
      {id:"elder_champion", name:"Elder Champion", level:20, max:always(1), reset:always("long"),
        hint:"Action for 1 minute: regain 10 HP each turn, cast 1-action paladin spells as bonus actions, nearby enemies save at disadvantage."}
    ],
    "Oath of Vengeance": [
      {id:"avenging_angel", name:"Avenging Angel", level:20, max:always(1), reset:always("long"),
        hint:"Action for 1 hour: 60-ft flight and a 30-ft aura that frightens enemies (WIS save)."}
    ],
    "Oath of Conquest": [
      {id:"invincible_conqueror", name:"Invincible Conqueror", level:20, max:always(1), reset:always("long"),
        hint:"Action for 1 minute: resistance to all damage, an extra attack, and melee crits on 19 or 20."}
    ],
    "Oathbreaker": [
      {id:"dread_lord", name:"Dread Lord", level:20, max:always(1), reset:always("long"),
        hint:"Action for 1 minute: 30-ft aura of gloom; frightened enemies take 4d10 psychic, bonus action shadow attack for 3d10 + CHA."}
    ],
    "Oath of Glory": [
      {id:"glorious_defense", name:"Glorious Defense", level:15,
        max:function(lv, m){ return atLeastOne(m.cha); }, reset:always("long"),
        hint:"Reaction when you or a creature within 10 ft is hit: add CHA mod to its AC; if the attack misses, make a weapon attack against the attacker."},
      {id:"living_legend", name:"Living Legend", level:20, max:always(1), reset:always("long"),
        hint:"Bonus action for 1 minute: advantage on CHA checks, turn one miss per turn into a hit, reroll failed saves. More uses cost a 5th-level slot."}
    ],
    "Oath of the Crown": [
      {id:"exalted_champion", name:"Exalted Champion", level:20, max:always(1), reset:always("long"),
        hint:"Action for 1 hour: resist nonmagical weapon damage; allies within 30 ft get advantage on death saves, and you all get advantage on WIS saves."}
    ],
    "Oath of the Watchers": [
      {id:"mortal_bulwark", name:"Mortal Bulwark", level:20, max:always(1), reset:always("long"),
        hint:"Bonus action for 1 minute: truesight 120 ft, advantage against extraplanar creatures, and banish them on a hit (CHA save). More uses cost a 5th-level slot."}
    ]
  },
  "Ranger": {
    "Monster Slayer": [
      {id:"hunters_sense", name:"Hunter's Sense", level:3,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Action: learn a creature's damage immunities, resistances and vulnerabilities (within 60 ft)."},
      {id:"magic_users_nemesis", name:"Magic-User's Nemesis", level:11, max:always(1), reset:always("short"),
        hint:"Reaction: a creature casting a spell or teleporting within 60 ft makes a WIS save or the spell or teleport fails."}
    ],
    "Swarmkeeper": [
      {id:"writhing_tide", name:"Writhing Tide", level:7,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: gain a 10-ft flying speed and hover for 1 minute."},
      {id:"swarming_dispersal", name:"Swarming Dispersal", level:15,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Reaction when you take damage: resist it and teleport up to 30 ft to a space you can see."}
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
    ],
    "Storm Sorcery": [
      {id:"wind_soul", name:"Wind Soul (Share Flight)", level:18, max:always(1), reset:always("short"),
        hint:"Action: drop your flying speed to 30 ft for 1 hour and give up to 3 + CHA mod creatures within 30 ft a 30-ft flying speed."}
    ],
    "Lunar Sorcery": [
      {id:"lunar_embodiment", name:"Lunar Embodiment (Free Spell)", level:1, max:always(1), reset:always("long"),
        hint:"Cast your current phase's 1st-level spell without a slot: Shield (Full), Ray of Sickness (New) or Color Spray (Crescent)."},
      {id:"lunar_boons", name:"Lunar Boons", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Spend 1 fewer sorcery point on Metamagic for a spell from a school tied to your current phase."},
      {id:"lunar_phenomenon", name:"Lunar Phenomenon", level:18, max:always(1), reset:always("long"),
        hint:"Bonus action: unleash your current phase's power (blind and heal, necrotic burst and invisibility, or teleport with resistance). More uses cost 5 sorcery points."}
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
        hint:"Bonus action: curse a creature within 30 ft: add proficiency to damage, crit on a 19 or 20, regain HP equal to warlock level + CHA when it dies."}
    ],
    "The Celestial": [
      {id:"healing_light", name:"Healing Light", level:1, pool:true,
        max:function(lv){ return 1 + lv; }, reset:always("long"),
        hint:"Bonus action: spend d6s from this pool (max CHA mod per turn) to heal a creature within 60 ft."}
    ],
    "The Fathomless": [
      {id:"tentacle_of_the_deeps", name:"Tentacle of the Deeps", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: summon a spectral tentacle for 1 minute: lash out for 2d8 cold damage or deal 1d8 cold to attackers as a reaction."}
    ],
    "The Undead": [
      {id:"form_of_dread", name:"Form of Dread", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action for 1 minute: 1d10 + warlock level temp HP, immune to fear, and frighten a creature you hit once per turn (WIS save)."},
      {id:"necrotic_husk", name:"Necrotic Husk", level:10, max:always(1), reset:always("manual"),
        hint:"Reaction at 0 HP: drop to 1 HP and deal 2d10 + warlock level necrotic around you, gaining 1 exhaustion. Returns after 1d4 long rests: roll when you use it and regain it yourself."},
      {id:"spirit_projection", name:"Spirit Projection", level:14, max:always(1), reset:always("long"),
        hint:"Action: project your spirit for up to 1 hour, with flight, weapon resistance and easier conjuration and necromancy spells."}
    ],
    "The Undying": [
      {id:"defy_death", name:"Defy Death", level:6, max:always(1), reset:always("long"),
        hint:"When you succeed on a death save or stabilize someone with Spare the Dying, regain 1d8 + CON mod HP."},
      {id:"indestructible_life", name:"Indestructible Life", level:14, max:always(1), reset:always("short"),
        hint:"Bonus action: regain 1d8 + warlock level HP, and reattach a severed body part held in place."}
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
        hint:"Bonus action: enter Bladesong for 1 minute: +INT to AC, +10 ft speed, advantage on Acrobatics, +INT to concentration saves."}
    ],
    "School of Enchantment": [
      {id:"hypnotic_gaze", name:"Hypnotic Gaze", level:2, max:always(1), reset:always("short"),
        hint:"Action: charm a creature within 5 ft: speed 0, incapacitated. Maintain with your action each turn. Ends if you move away or it saves."}
    ],
    "School of Transmutation": [
      {id:"shapechanger", name:"Shapechanger (Polymorph Self)", level:10, max:always(1), reset:always("short"),
        hint:"Cast Polymorph on yourself without expending a spell slot."}
    ],
    "Chronurgy Magic": [
      {id:"chronal_shift", name:"Chronal Shift", level:2, max:always(2), reset:always("long"),
        hint:"Reaction: force a creature within 30 ft to reroll an attack roll, ability check or save after seeing the result."},
      {id:"momentary_stasis", name:"Momentary Stasis", level:6,
        max:function(lv, m){ return atLeastOne(m.int); }, reset:always("long"),
        hint:"Action: a Large or smaller creature within 60 ft makes a CON save or is incapacitated with speed 0 until the end of your next turn."},
      {id:"arcane_abeyance", name:"Arcane Abeyance", level:10, max:always(1), reset:always("short"),
        hint:"Freeze a spell of 4th level or lower in a bead for 1 hour; whoever holds it can release the spell as an action."}
    ],
    "Graviturgy Magic": [
      {id:"violent_attraction", name:"Violent Attraction", level:10,
        max:function(lv, m){ return atLeastOne(m.int); }, reset:always("long"),
        hint:"Reaction: add 1d10 to a weapon hit within 60 ft, or 2d10 to falling damage."},
      {id:"event_horizon", name:"Event Horizon", level:14, max:always(1), reset:always("long"),
        hint:"Action: 1-minute gravity field; hostile creatures starting within 30 ft take 2d10 force and are stopped (STR save). More uses cost a 3rd-level slot."}
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
      {id:"eyes_of_night", name:"Eyes of Night (Share)", level:1, max:always(1), reset:always("long"),
        hint:"Action: share your 300-ft darkvision for 1 hour with up to WIS mod willing creatures within 10 ft. More uses cost a spell slot."},
      {id:"steps_of_night", name:"Steps of Night", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action in dim light or darkness: flying speed equal to your walking speed for 1 minute."}
    ],
    "Forge Domain": [
      {id:"blessing_of_the_forge", name:"Blessing of the Forge", level:1, max:always(1), reset:always("long"),
        hint:"At the end of a long rest: make one nonmagical weapon (+1 attack and damage) or armor (+1 AC) magical until your next long rest."}
    ],
    "Order Domain": [
      {id:"embodiment_of_the_law", name:"Embodiment of the Law", level:6,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Cast a 1-action enchantment spell (1st level or higher) as a bonus action."}
    ],
    "Peace Domain": [
      {id:"emboldening_bond", name:"Emboldening Bond", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Action: bond up to proficiency-bonus creatures; each adds 1d4 to attacks, checks and saves while a bonded ally is within 30 ft."}
    ],
    "Knowledge Domain": [
      {id:"visions_of_the_past", name:"Visions of the Past", level:17, max:always(1), reset:always("short"),
        hint:"Meditate for 1+ minutes to see the history of an object you hold or of your surroundings."}
    ],
    "Grave Domain": [
      {id:"eyes_of_the_grave", name:"Eyes of the Grave", level:1,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Action: sense any undead within 60 ft (not behind total cover) until the end of your next turn."},
      {id:"sentinel_at_deaths_door", name:"Sentinel at Death's Door", level:6,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Reaction: turn a critical hit against you or a creature within 30 ft into a normal hit."}
    ],
    "Fate Domain": [
      {id:"omens_and_portents", name:"Omens and Portents (Free Augury)", level:1, max:always(1), reset:always("long"),
        hint:"Cast Augury without a spell slot or components."},
      {id:"ties_that_bind", name:"Ties That Bind", level:1,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Action: bind a creature's fate for 1 hour; track it and add 1d6 to your spell damage or healing on it once per turn."},
      {id:"insightful_striking", name:"Insightful Striking", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Bonus action: +1d6 to your next attack roll against a target within 30 ft, or -1d6 to its next save against your spell."},
      {id:"visions_of_the_future", name:"Visions of the Future", level:17, max:always(1), reset:always("long"),
        hint:"Action: cast Foresight without a spell slot; it lasts 1 minute."}
    ]
  },
  "Druid": {
    "Circle of the Land": [
      {id:"natural_recovery", name:"Natural Recovery", level:2, max:always(1), reset:always("long"),
        hint:"During a short rest, recover spell slots with a combined level up to half your druid level (rounded up), none 6th level or higher."}
    ],
    "Circle of Stars": [
      {id:"star_map_guiding_bolt", name:"Star Map: Free Guiding Bolt", level:2,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"While holding your star map, cast Guiding Bolt without a spell slot."},
      {id:"cosmic_omen", name:"Cosmic Omen", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Reaction: add (Weal, even roll) or subtract (Woe, odd roll) 1d6 from a roll made within 30 ft. Rolled each long rest."}
    ],
    "Circle of Wildfire": [
      {id:"cauterizing_flames", name:"Cauterizing Flames", level:10,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Reaction: extinguish a spectral flame to heal or burn the creature entering it for 2d10 + WIS mod."},
      {id:"blazing_revival", name:"Blazing Revival", level:14, max:always(1), reset:always("long"),
        hint:"When you drop to 0 HP with your spirit within 120 ft: it drops to 0 HP, and you regain half your HP and stand up."}
    ],
    "Circle of Dreams": [
      {id:"balm_of_the_summer_court", name:"Balm of the Summer Court (d6s)", level:2, pool:true,
        max:function(lv){ return lv; }, reset:always("long"),
        hint:"Bonus action: spend up to half your druid level in d6s to heal a creature within 120 ft (+1 temp HP per die)."},
      {id:"hidden_paths", name:"Hidden Paths", level:10,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Bonus action: teleport yourself up to 60 ft, or action: teleport a willing creature you touch up to 30 ft."},
      {id:"walker_in_dreams", name:"Walker in Dreams", level:14, max:always(1), reset:always("long"),
        hint:"After a short rest: cast Dream, Scrying or Teleportation Circle without a slot or material components."}
    ],
    "Circle of Spores": [
      {id:"fungal_infestation", name:"Fungal Infestation", level:6,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Reaction: animate a Small or Medium beast or humanoid that dies within 10 ft as a 1-HP zombie for 1 hour."}
    ],
    "Circle of the Shepherd": [
      {id:"spirit_totem", name:"Spirit Totem", level:2, max:always(1), reset:always("short"),
        hint:"Bonus action: summon a Bear, Hawk or Unicorn spirit with a 30-ft aura for 1 minute."},
      {id:"faithful_summons", name:"Faithful Summons", level:14, max:always(1), reset:always("long"),
        hint:"When you drop to 0 HP or are incapacitated against your will, four CR 2 or lower beasts appear to protect you for 1 hour."}
    ],
    "Circle of the Blighted": [
      {id:"defile_ground", name:"Defile Ground", level:2, max:always(1), reset:always("short"),
        hint:"Bonus action: 1-minute defiled area within 60 ft; difficult terrain for enemies and extra necrotic damage (1d4, 1d6 from level 10, 1d8 from 14)."},
      {id:"call_of_the_shadowseeds", name:"Call of the Shadowseeds", level:6,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"Reaction when a creature takes damage in your Defile Ground: raise a Blighted Sapling next to it that attacks at once."}
    ]
  },
  "Rogue": {
    "Phantom": [
      {id:"wails_from_the_grave", name:"Wails from the Grave", level:3,
        max:function(lv, m){ return m.pb; }, reset:always("long"),
        hint:"When you deal Sneak Attack damage, choose a creature within 30 ft; it takes half your Sneak Attack as necrotic damage."}
    ],
    "Soulknife": [
      {id:"psionic_energy_dice", name:"Psionic Energy Dice", level:3, pool:true,
        max:function(lv, m){ return m.pb * 2; }, reset:always("long"),
        hint:"Fuel Psychic Blades (off-hand), Soul Blades (Homing Strikes / Psychic Teleportation), Psychic Veil and Rend Mind. Regain 1 die on a short rest."}
    ],
    "Inquisitive": [
      {id:"unerring_eye", name:"Unerring Eye", level:13,
        max:function(lv, m){ return atLeastOne(m.wis); }, reset:always("long"),
        hint:"Action: sense illusions, shapechangers and other deceptive magic within 30 ft."}
    ],
    "Misfortune Bringer": [
      {id:"jinx_points", name:"Jinx Points", level:3,
        max:function(lv){ return lv>=13 ? 6 : 4; }, reset:always("short"),
        hint:"Spend on the misfortunes you know against the creature marked by your Evil Eye. Curse Caster (level 13) costs 3."},
      {id:"steal_luck", name:"Steal Luck", level:9,
        max:function(lv){ return lv>=17 ? 3 : 1; }, reset:always("short"),
        hint:"Reaction: remove advantage from a roll made within 30 ft and regain 1 Jinx Point."}
    ]
  }
};
