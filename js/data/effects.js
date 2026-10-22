/* ---------------- Temporary effects ----------------
   Features the player switches on for a while, on the Active effects card
   (Vitals tab, only for characters who have one). Switching one on pays
   its cost from the class resources; while it's on, its bonuses show up
   where they apply (AC, speed, saves, skills, senses, attacks). A rest or
   dropping to 0 HP ends them all.

   className / subclass / level: who has it (class level, not total).
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
