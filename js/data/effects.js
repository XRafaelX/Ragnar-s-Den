/* ---------------- Temporary effects ----------------
   Features the player switches on for a while, on the Active effects card
   (Vitals tab, only for characters who have one). Switching one on pays
   its cost from the class resources; while it's on, its bonuses show up
   where they apply (AC, speed, saves, skills, senses, attacks). A rest or
   dropping to 0 HP ends them all.

   className / subclass / level: who has it (class level, not total).
   variant: only for a class entry using that Tasha's feature (Steady Aim).
   race / level: or a race's (character level): [race names].
   cost: {resource, amount}, a resource id from resources.js on the same
     class or race ("bladesong", "ki", "chromatic_warding"); unlimited
     uses cost nothing, and an effect with no cost is free (Shell Defense).
   startLabel / endLabel: the button's words in place of Start / End.
   requires: other effects that must be on first; ending one of those
     ends this too (Awakened Astral Self needs the arms and the visage).
   channel: started from the Channel Divinity list, shown here only while on.
   slotCost: a spell slot of this level can pay instead once the uses are gone.
   slotPick: the player picks a spell slot to pay with (Primeval Awareness).
   replacedBy: a Tasha's feature that replaces it (the entry using that loses it).
   option: {set, name}, only with that class option known (Hunter's picks).
   choose: {placeholder, options}, started by picking one, which is kept
     as the effect's value (Starry Form's constellation, Spirit Totem's spirit).
   staysUp: dropping to 0 HP doesn't end it (the wildfire spirit).
   duration: shown on the card.
   hint: what it does, kept short; the card adds the worked-out numbers. */
export var TOGGLE_EFFECTS = [
  {id:"bladesong", name:"Bladesong", className:"Wizard", subclass:"Bladesinging", level:2,
    cost:{resource:"bladesong", amount:1}, duration:"1 minute", endsIncapacitated:true,
    hint:"Ends early if you are incapacitated, don medium or heavy armor or a shield, or attack with a weapon in two hands."},
  {id:"astral_arms", name:"Arms of the Astral Self", className:"Monk", subclass:"Way of the Astral Self", level:3,
    cost:{resource:"ki", amount:1}, duration:"10 minutes",
    hint:"On arrival, creatures of your choice within 10 ft make a DEX save or take the Arrival damage. The extra reach is on your turn only. Ends early if you are incapacitated."},
  {id:"astral_visage", name:"Visage of the Astral Self", className:"Monk", subclass:"Way of the Astral Self", level:6,
    cost:{resource:"ki", amount:1}, duration:"10 minutes",
    hint:"Astral Sight sees through magical darkness too. Word of the Spirit: speak so only one creature within 60 ft hears you, or be heard within 600 ft."},
  {id:"awakened_astral_self", name:"Awakened Astral Self", className:"Monk", subclass:"Way of the Astral Self", level:17,
    cost:{resource:"ki", amount:5}, duration:"10 minutes", requires:["astral_arms", "astral_visage"],
    hint:"Astral Barrage: when you use Extra Attack, attack three times instead of twice if every attack uses your astral arms."},
  {id:"symbiotic_entity", name:"Symbiotic Entity", className:"Druid", subclass:"Circle of Spores", level:2,
    cost:{resource:"wild_shape", amount:1}, duration:"10 minutes",
    hint:"Ends early when these temporary hit points are gone or you use Wild Shape again."},
  // Player's Handbook (p. 54) and Xanathar's Guide (pp. 14-16), checked on
  // 5etools' data 2026-10-30.
  {id:"countercharm", name:"Countercharm", className:"Bard", level:6, duration:"Until the end of your next turn", endsIncapacitated:true,
    hint:"Action: a performance. It ends early if you are incapacitated or silenced, or if you stop it. Friends within 30 ft have to hear you."},
  {id:"defensive_flourish", name:"Defensive Flourish", className:"Bard", subclass:"College of Swords", level:3, channel:true, duration:"Until the start of your next turn",
    hint:"From a Blade Flourish."},
  {id:"mantle_of_majesty", name:"Mantle of Majesty", className:"Bard", subclass:"College of Glamour", level:6,
    cost:{resource:"mantle_of_majesty", amount:1}, duration:"1 minute",
    hint:"Bonus action, with your concentration as if on a spell. It ends if your concentration does."},
  {id:"unbreakable_majesty", name:"Unbreakable Majesty", className:"Bard", subclass:"College of Glamour", level:14,
    cost:{resource:"unbreakable_majesty", amount:1}, duration:"1 minute", endsIncapacitated:true,
    hint:"Bonus action. Ends early if you are incapacitated."},
  {id:"shadow_disguise", name:"Stolen Shadow", className:"Bard", subclass:"College of Whispers", level:6, duration:"1 hour", startLabel:"Wear it", endLabel:"End",
    hint:"Action: use a shadow from Mantle of Whispers to look like the dead person. A bonus action ends it."},
  // Tasha's Cauldron (pp. 36-39), checked on 5etools' data 2026-10-30.
  {id:"spreading_spores", name:"Spreading Spores", className:"Druid", subclass:"Circle of Spores", level:10,
    duration:"1 minute", requires:["symbiotic_entity"], startLabel:"Hurl",
    hint:"Bonus action: a 10-foot cube within 30 ft. It ends early if you hurl it again, dismiss it as a bonus action or Symbiotic Entity ends."},
  {id:"starry_form", name:"Starry Form", className:"Druid", subclass:"Circle of Stars", level:2,
    cost:{resource:"wild_shape", amount:1}, duration:"10 minutes", endsIncapacitated:true,
    choose:{placeholder:"Choose a constellation...", options:["Archer", "Chalice", "Dragon"]},
    hint:"Bonus action instead of a beast form. You keep your statistics and shed bright light for 10 ft and dim light for 10 ft more. It ends early if you dismiss it or are incapacitated."},
  {id:"wildfire_spirit", name:"Wildfire Spirit", className:"Druid", subclass:"Circle of Wildfire", level:2,
    cost:{resource:"wild_shape", amount:1}, duration:"1 hour", staysUp:true, startLabel:"Summon", endLabel:"Dismiss",
    hint:"Action instead of a beast form, within 30 ft. It ends early at 0 hit points, if you summon it again or if you die. Its stats are on the Companions tab."},
  // Xanathar's Guide (pp. 22-23), checked on 5etools' data 2026-10-30.
  {id:"hearth_of_moonlight", name:"Hearth of Moonlight and Shadow", className:"Druid", subclass:"Circle of Dreams", level:6,
    duration:"Until the rest ends",
    hint:"At the start of a short or long rest, a 30-ft sphere around a point you touch. Cover blocks it, and it ends if you leave it. Light from open flames in it can't be seen outside."},
  {id:"spirit_totem", name:"Spirit Totem", className:"Druid", subclass:"Circle of the Shepherd", level:2,
    cost:{resource:"spirit_totem", amount:1}, duration:"1 minute", endsIncapacitated:true,
    choose:{placeholder:"Summon a spirit...", options:["Bear", "Hawk", "Unicorn"]},
    hint:"Bonus action: a 30-ft aura around a point within 60 ft. A bonus action moves it up to 60 ft. Ends early if you are incapacitated."},
  // Tal'Dorei Reborn (p. 172), checked on the book's scan 2026-10-30.
  {id:"defile_ground", name:"Defile Ground", className:"Druid", subclass:"Circle of the Blighted", level:2,
    cost:{resource:"defile_ground", amount:1}, duration:"1 minute",
    hint:"Bonus action: centered on a point within 60 ft. A bonus action moves it up to 30 ft. Flying creatures are unaffected."},
  // Player's Handbook (p. 46), checked on 5etools' data 2026-10-29. With
  // Reckless Abandon (Battlerager 6) it gives temporary HP while raging.
  {id:"reckless_attack", name:"Reckless Attack", className:"Barbarian", level:2, duration:"Until your next turn",
    startLabel:"Attack recklessly",
    hint:"Decide on your first attack of the turn. Attacks against you have advantage until your next turn."},
  // Tasha's Cauldron (p. 44), checked on 5etools' data 2026-10-30.
  {id:"giants_might", name:"Giant's Might", className:"Fighter", subclass:"Rune Knight", level:3,
    cost:{resource:"giants_might", amount:1}, duration:"1 minute",
    hint:"Bonus action. You become Large if there's room, along with what you wear."},
  // Xanathar's Guide (p. 31), checked on 5etools' data 2026-10-30.
  {id:"fighting_spirit", name:"Fighting Spirit", className:"Fighter", subclass:"Samurai", level:3,
    cost:{resource:"fighting_spirit", amount:1}, duration:"Until the end of your turn",
    hint:"Bonus action on your turn."},
  // Ranger (Player's Handbook pp. 91 to 93, Xanathar's Guide pp. 41 to 43,
  // Tasha's Cauldron pp. 56 to 60), checked on 5etools' data 2026-10-30.
  {id:"favored_foe", name:"Favored Foe", className:"Ranger", level:1, variant:"Favored Foe", cost:{resource:"favored_foe", amount:1}, duration:"1 minute",
    startLabel:"Mark", hint:"Needs your concentration, as a spell does."},
  {id:"primeval_awareness", name:"Primeval Awareness", className:"Ranger", level:3, replacedBy:"Primal Awareness", slotPick:true, duration:"1 minute per slot level",
    startLabel:"Sense", hint:"An action. It doesn't reveal where they are or how many."},
  {id:"hide_in_plain_sight", name:"Hide in Plain Sight", className:"Ranger", level:10, replacedBy:"Nature's Veil", duration:"Until you move or act",
    startLabel:"Camouflage", endLabel:"Move", hint:"1 minute to make, against a solid surface at least as tall and wide as you."},
  {id:"dread_ambusher", name:"Dread Ambusher", className:"Ranger", subclass:"Gloom Stalker", level:3, duration:"Your first turn of combat",
    startLabel:"First turn", endLabel:"Done", hint:"Each combat, at the start of your first turn."},
  {id:"multiattack_defense", name:"Multiattack Defense", className:"Ranger", subclass:"Hunter", level:7, option:{set:"defensiveTactics", name:"Multiattack Defense"}, duration:"Rest of this turn",
    startLabel:"Hit", endLabel:"Done", hint:"When a creature hits you with an attack."},
  {id:"slayers_prey", name:"Slayer's Prey", className:"Ranger", subclass:"Monster Slayer", level:3, duration:"Until a rest",
    startLabel:"Mark", hint:"A bonus action, on a creature you can see within 60 feet. Marking another ends it on the first."},
  {id:"writhing_tide", name:"Writhing Tide", className:"Ranger", subclass:"Swarmkeeper", level:7, cost:{resource:"writhing_tide", amount:1}, duration:"1 minute",
    hint:"A bonus action. Ends early if you are incapacitated."},
  // Cleric domains (Player's Handbook pp. 59 to 63, Tasha's Cauldron pp. 32
  // and 34), checked on 5etools' data 2026-10-30.
  {id:"knowledge_of_the_ages", name:"Knowledge of the Ages", className:"Cleric", subclass:"Knowledge Domain", level:2, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"10 minutes",
    hint:"Already added to that skill."},
  {id:"invoke_duplicity", name:"Invoke Duplicity", className:"Cleric", subclass:"Trickery Domain", level:2, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"1 minute",
    hint:"Needs your concentration, as a spell does."},
  {id:"trickery_cloak", name:"Cloak of Shadows", className:"Cleric", subclass:"Trickery Domain", level:6, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"Until the end of your next turn",
    hint:"Ends if you attack or cast a spell."},
  {id:"twilight_sanctuary", name:"Twilight Sanctuary", className:"Cleric", subclass:"Twilight Domain", level:2, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"1 minute", endsIncapacitated:true,
    hint:"Ends early if you are incapacitated or die."},
  {id:"vigilant_blessing", name:"Vigilant Blessing", className:"Cleric", subclass:"Twilight Domain", level:1, duration:"Your next initiative",
    startLabel:"Bless", hint:"An action, on a creature you touch. Switch it on when that's you."},
  {id:"steps_of_night", name:"Steps of Night", className:"Cleric", subclass:"Twilight Domain", level:6, cost:{resource:"steps_of_night", amount:1}, duration:"1 minute",
    hint:"A bonus action, in dim light or darkness."},
  {id:"corona_of_light", name:"Corona of Light", className:"Cleric", subclass:"Light Domain", level:17, duration:"1 minute",
    hint:"An action. You can dismiss it with another action."},
  {id:"emboldening_bond", name:"Emboldening Bond", className:"Cleric", subclass:"Peace Domain", level:1, cost:{resource:"emboldening_bond", amount:1}, duration:"10 minutes",
    startLabel:"Bond", hint:"An action. The d4 is offered after your rolls, once per turn."},
  // Fate Domain (Unearthed Arcana: Wonders of the Multiverse, 2022, pp. 2
  // and 3), checked against the PDF 2026-10-30.
  {id:"ties_that_bind", name:"Ties That Bind", className:"Cleric", subclass:"Fate Domain", level:1, cost:{resource:"ties_that_bind", amount:1}, duration:"1 hour", staysUp:true,
    startLabel:"Bind", hint:"An action, touching a creature or object. To bind something else, end this and bind again."},
  {id:"strands_of_fate", name:"Strands of Fate", className:"Cleric", subclass:"Fate Domain", level:2, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"1 minute",
    hint:"Needs your concentration, as a spell does."},
  {id:"insightful_striking", name:"Insightful Striking", className:"Cleric", subclass:"Fate Domain", level:6, cost:{resource:"insightful_striking", amount:1}, duration:"Until the end of your next turn",
    choose:{placeholder:"Choose one...", options:["Your next attack roll", "Its next saving throw"]},
    hint:"A bonus action, on a creature you can see within 30 ft."},
  // Paladin oaths (Player's Handbook pp. 85 to 87, Dungeon Master's Guide
  // p. 97, Sword Coast Adventurer's Guide p. 132, Xanathar's Guide pp. 37
  // and 38, Tasha's Cauldron pp. 53 and 54), checked on 5etools' data
  // 2026-10-30. channel: started from the Channel Divinity list, so the
  // card only shows it while it's on.
  {id:"sacred_weapon", name:"Sacred Weapon", className:"Paladin", subclass:"Oath of Devotion", level:3, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"1 minute",
    hint:"Ends if you drop the weapon or fall unconscious. You can end it on your turn as part of any other action."},
  {id:"vow_of_enmity", name:"Vow of Enmity", className:"Paladin", subclass:"Oath of Vengeance", level:3, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"1 minute",
    hint:"Ends early if the creature drops to 0 hit points or falls unconscious."},
  {id:"emissary_of_peace", name:"Emissary of Peace", className:"Paladin", subclass:"Oath of Redemption", level:3, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"10 minutes",
    hint:"Already added to your Persuasion."},
  {id:"peerless_athlete", name:"Peerless Athlete", className:"Paladin", subclass:"Oath of Glory", level:3, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"10 minutes",
    hint:"The advantage is already on your skills."},
  {id:"watchers_will", name:"Watcher's Will", className:"Paladin", subclass:"Oath of the Watchers", level:3, channel:true, cost:{resource:"channel_divinity", amount:1}, duration:"1 minute",
    hint:"The advantage is already on your saves."},
  {id:"holy_nimbus", name:"Holy Nimbus", className:"Paladin", subclass:"Oath of Devotion", level:20, cost:{resource:"holy_nimbus", amount:1}, duration:"1 minute",
    hint:"An action."},
  {id:"elder_champion", name:"Elder Champion", className:"Paladin", subclass:"Oath of the Ancients", level:20, cost:{resource:"elder_champion", amount:1}, duration:"1 minute",
    hint:"An action."},
  {id:"avenging_angel", name:"Avenging Angel", className:"Paladin", subclass:"Oath of Vengeance", level:20, cost:{resource:"avenging_angel", amount:1}, duration:"1 hour",
    hint:"An action."},
  {id:"invincible_conqueror", name:"Invincible Conqueror", className:"Paladin", subclass:"Oath of Conquest", level:20, cost:{resource:"invincible_conqueror", amount:1}, duration:"1 minute",
    hint:"An action."},
  {id:"dread_lord", name:"Dread Lord", className:"Paladin", subclass:"Oathbreaker", level:20, cost:{resource:"dread_lord", amount:1}, duration:"1 minute",
    hint:"An action. The shadows' attack is a bonus action."},
  {id:"living_legend", name:"Living Legend", className:"Paladin", subclass:"Oath of Glory", level:20, cost:{resource:"living_legend", amount:1}, slotCost:5, duration:"1 minute",
    hint:"A bonus action. The hit and the reroll are offered after those rolls."},
  {id:"exalted_champion", name:"Exalted Champion", className:"Paladin", subclass:"Oath of the Crown", level:20, cost:{resource:"exalted_champion", amount:1}, duration:"1 hour",
    hint:"An action. Ends early if you are incapacitated or die."},
  {id:"mortal_bulwark", name:"Mortal Bulwark", className:"Paladin", subclass:"Oath of the Watchers", level:20, cost:{resource:"mortal_bulwark", amount:1}, slotCost:5, duration:"1 minute",
    hint:"A bonus action."},
  // Monk (Player's Handbook pp. 76 to 80, Xanathar's Guide p. 34), checked
  // on 5etools' data 2026-10-30.
  {id:"empty_body", name:"Empty Body", className:"Monk", level:18, cost:{resource:"ki", amount:4}, duration:"1 minute",
    hint:"An action."},
  {id:"shadow_step", name:"Shadow Step", className:"Monk", subclass:"Way of Shadow", level:6, duration:"This turn",
    startLabel:"Step", endLabel:"Done",
    hint:"Bonus action, in dim light or darkness: teleport up to 60 feet to another such space. Your next melee attack uses it up."},
  {id:"cloak_of_shadows", name:"Cloak of Shadows", className:"Monk", subclass:"Way of Shadow", level:11, duration:"Until you attack or cast a spell",
    startLabel:"Vanish", endLabel:"Reappear",
    hint:"An action, in dim light or darkness. It also ends in bright light."},
  {id:"agile_parry", name:"Agile Parry", className:"Monk", subclass:"Way of the Kensei", level:3, duration:"Until the start of your next turn",
    startLabel:"Parry",
    hint:"After an unarmed strike in the Attack action, with a melee kensei weapon in hand."},
  // Rogue archetypes (Player's Handbook p. 97, Xanathar's Guide pp. 45 to
  // 48, Tasha's Cauldron pp. 62 to 63), checked on 5etools' data 2026-10-30.
  {id:"assassinate", name:"Assassinate", className:"Rogue", subclass:"Assassin", level:3, duration:"The first round of combat",
    startLabel:"Combat starts", endLabel:"First round over",
    hint:"Only against creatures that haven't taken a turn yet. Any hit against a surprised creature is a critical hit."},
  {id:"versatile_trickster", name:"Versatile Trickster", className:"Rogue", subclass:"Arcane Trickster", level:13, duration:"Until the end of your turn",
    hint:"Bonus action: pick a creature within 5 feet of your mage hand."},
  {id:"elegant_maneuver", name:"Elegant Maneuver", className:"Rogue", subclass:"Swashbuckler", level:13, duration:"This turn",
    hint:"Bonus action. It's used up by your next Acrobatics or Athletics check."},
  {id:"insightful_fighting", name:"Insightful Fighting", className:"Rogue", subclass:"Inquisitive", level:3, duration:"1 minute",
    startLabel:"Read the target",
    hint:"Bonus action: an Insight check against the target's Deception. Start this when you win it."},
  {id:"ghost_walk", name:"Ghost Walk", className:"Rogue", subclass:"Phantom", level:13,
    cost:{resource:"ghost_walk", amount:1}, duration:"10 minutes",
    hint:"Bonus action. You take 1d10 force damage if you end your turn inside a creature or an object."},
  // Tasha's Cauldron (p. 62), checked on 5etools' data 2026-10-29. The
  // advantage goes with the next attack roll, the speed stays 0 until End turn.
  {id:"steady_aim", name:"Steady Aim", className:"Rogue", level:3, variant:"Steady Aim", duration:"Until the end of your turn",
    startLabel:"Take aim", endLabel:"End turn",
    hint:"Bonus action. Only if you haven't moved this turn."},
  // The Gunslinger class (Spikael's homebrew), level 3: Steady Aim's twin.
  {id:"take_aim", name:"Take Aim", className:"Gunslinger", level:3, duration:"Until the end of your turn",
    startLabel:"Take aim", endLabel:"End turn",
    hint:"Bonus action. Only if you haven't moved this turn."},
  {id:"luck_of_the_draw", name:"Luck of the Draw", className:"Gunslinger", subclass:"Outlaw", level:7, duration:"Until the start of your next turn",
    startLabel:"Roll d4", hint:"Roll at the start of your turn. A 4 turns it on."},
  {id:"duel", name:"Duel", className:"Gunslinger", subclass:"Outlaw", level:18, cost:{resource:"duel", amount:1},
    duration:"Until one of you drops to 0 HP or you move over 30 ft away", startLabel:"Challenge",
    hint:"You both act together on your turn, and its own turns are skipped. Attacks are compared: the higher total succeeds, a tie means both do, and a 20 doesn't guarantee it."},
  {id:"predicted_critical", name:"Predicted Critical", className:"Gunslinger", subclass:"Marksman", level:14,
    cost:{resource:"predicted_critical", amount:1}, duration:"Your next firearm attack", startLabel:"Predict",
    hint:"Before you roll, only for an attack with advantage. The use is spent even if you miss."},
  // Tasha's Cauldron (p. 57), checked on 5etools' data 2026-10-29.
  {id:"natures_veil", name:"Nature's Veil", className:"Ranger", level:10, variant:"Nature's Veil",
    cost:{resource:"natures_veil", amount:1}, duration:"Until the start of your next turn",
    startLabel:"Turn invisible",
    hint:"Bonus action. Everything you're wearing or carrying turns invisible with you."},
  // Race traits (checked against the books' wording on 5etools' data 2026-10-22).
  {id:"shell_defense", name:"Shell Defense", race:["Tortle"], level:1, duration:"Until you come out",
    startLabel:"Withdraw", endLabel:"Come out",
    hint:"Withdrawing takes your action. While in your shell you're prone, you can't take reactions, and your only action is a bonus action to come out."},
  {id:"chromatic_warding", name:"Chromatic Warding", race:["Dragonborn (Chromatic)"], level:5,
    cost:{resource:"chromatic_warding", amount:1}, duration:"1 minute",
    hint:"Takes your action."},
  {id:"raven_queen_resistance", name:"Blessing of the Raven Queen", race:["Shadar-kai"], level:3,
    cost:{resource:"blessing_raven_queen", amount:1}, duration:"Until the start of your next turn",
    hint:"Bonus action: teleport up to 30 feet to an unoccupied space you can see, looking ghostly and translucent until the resistance ends."},
  {id:"sunlight", name:"Sunlight Sensitivity", race:["Dark Elf (Drow)", "Duergar", "Kobold"], level:1, duration:"While in direct sunlight",
    startLabel:"In sunlight", endLabel:"Out of it",
    hint:"Also when your target, or whatever you're trying to see, is in direct sunlight."}
];

/* Path of Wild Magic's Wild Magic table (Tasha's Cauldron, p. 25, checked
   on 5etools' data 2026-10-29): rolled with a d8 when the barbarian enters
   a rage. dice: what its Rage card button rolls; save: the ability of the
   save it asks for (DC 8 + proficiency + CON); temp: temporary HP the
   barbarian gains at once; ac: an AC bonus while the rage lasts. */
export var WILD_SURGES = [
  {n:1, name:"Shadowy tendrils", dice:"1d12", type:"Necrotic", save:"con", temp:"1d12",
    text:"Each creature you choose within 30 feet makes a Constitution save or takes 1d12 necrotic damage. You gain 1d12 temporary hit points."},
  {n:2, name:"Teleport",
    text:"You teleport up to 30 feet to an unoccupied space you can see. Until the rage ends, you can do it again as a bonus action on each of your turns."},
  {n:3, name:"Exploding spirit", dice:"1d6", type:"Force", save:"dex",
    text:"A spirit appears within 5 feet of a creature you choose within 30 feet and explodes at the end of the turn: each creature within 5 feet of it makes a Dexterity save or takes 1d6 force damage. You can summon another as a bonus action on each of your turns."},
  {n:4, name:"Infused weapon",
    text:"A weapon you're holding deals force damage and gains the light and thrown properties (20/60 feet) until the rage ends. If it leaves your hand, it reappears there at the end of the turn."},
  {n:5, name:"Retribution", dice:"1d6", type:"Force",
    text:"Whenever a creature hits you with an attack roll before the rage ends, it takes 1d6 force damage."},
  {n:6, name:"Protective lights", ac:1,
    text:"Until the rage ends you gain +1 AC, and allies within 10 feet of you gain it too."},
  {n:7, name:"Flowers and vines",
    text:"Until the rage ends, the ground within 15 feet of you is difficult terrain for your enemies."},
  {n:8, name:"Bolt of light", dice:"1d6", type:"Radiant", save:"con",
    text:"Another creature you choose within 30 feet makes a Constitution save or takes 1d6 radiant damage and is blinded until the start of your next turn. You can do it again as a bonus action on each of your turns."}
];
