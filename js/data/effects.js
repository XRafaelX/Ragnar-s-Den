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
   duration: shown on the card.
   hint: what it does, kept short; the card adds the worked-out numbers. */
export var TOGGLE_EFFECTS = [
  {id:"bladesong", name:"Bladesong", className:"Wizard", subclass:"Bladesinging", level:2,
    cost:{resource:"bladesong", amount:1}, duration:"1 minute",
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
