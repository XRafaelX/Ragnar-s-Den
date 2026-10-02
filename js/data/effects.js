/* ---------------- Temporary effects ----------------
   Features the player switches on for a while, on the Active effects card
   (Vitals tab, only for characters who have one). Switching one on pays
   its cost from the class resources; while it's on, its bonuses show up
   where they apply (AC, speed, saves, skills, senses, attacks). A rest or
   dropping to 0 HP ends them all.

   className / subclass / level: who has it (class level, not total).
   cost: {resource, amount}, a resource id from resources.js on the same
     class ("bladesong", "ki", "wild_shape"); unlimited uses cost nothing.
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
    hint:"Ends early when these temporary hit points are gone or you use Wild Shape again."}
];
