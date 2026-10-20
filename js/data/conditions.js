/* ---------------- Conditions ----------------
   The fourteen conditions and exhaustion of the 2014 rules, from the
   Player's Handbook's appendix A (pages 290 to 292, the same text as the
   SRD 5.1), checked against the book on 2026-10-20.

   `rules` is the book's text, shown in the condition's sheet. The other
   fields are what the character sheet applies by itself:
     attack     "adv" or "dis" on the character's own attack rolls
     checks     "dis" on ability checks (skills and initiative too)
     saves      {ability: "dis"} on those saving throws
     autoFail   abilities whose saving throws fail automatically
     noMove     speed 0 (grappled, restrained, or "can't move")
     incapacitated, resistAll (resistance to all damage)
   `short` is the one line in the Add a condition list, `hue` the colour
   of its chip and its animation. */
export var CONDITIONS = [
  {id: "blinded", name: "Blinded", hue: "#64748b", attack: "dis",
    short: "Can't see. Your attacks have disadvantage.",
    rules: ["A blinded creature can't see and automatically fails any ability check that requires sight.",
      "Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage."]},
  {id: "charmed", name: "Charmed", hue: "#ec4899",
    short: "Can't attack the charmer, who has advantage on social checks with you.",
    rules: ["A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects.",
      "The charmer has advantage on any ability check to interact socially with the creature."]},
  {id: "deafened", name: "Deafened", hue: "#0ea5e9",
    short: "Can't hear. Fails checks that need hearing.",
    rules: ["A deafened creature can't hear and automatically fails any ability check that requires hearing."]},
  {id: "frightened", name: "Frightened", hue: "#8b5cf6", attack: "dis", checks: "dis",
    short: "Disadvantage on checks and attacks while you can see the source.",
    rules: ["A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.",
      "The creature can't willingly move closer to the source of its fear."]},
  {id: "grappled", name: "Grappled", hue: "#d97706", noMove: true,
    short: "Your speed is 0.",
    rules: ["A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
      "The condition ends if the grappler is incapacitated (see the condition).",
      "The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect, such as when a creature is hurled away by the thunderwave spell."]},
  {id: "incapacitated", name: "Incapacitated", hue: "#78716c", incapacitated: true,
    short: "No actions or reactions.",
    rules: ["An incapacitated creature can't take actions or reactions."]},
  {id: "invisible", name: "Invisible", hue: "#22d3ee", attack: "adv",
    short: "Unseen without magic. Your attacks have advantage.",
    rules: ["An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature's location can be detected by any noise it makes or any tracks it leaves.",
      "Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage."]},
  {id: "paralyzed", name: "Paralyzed", hue: "#facc15", noMove: true, incapacitated: true, autoFail: ["str", "dex"],
    short: "Can't move or act. Fails STR and DEX saves.",
    rules: ["A paralyzed creature is incapacitated (see the condition) and can't move or speak.",
      "The creature automatically fails Strength and Dexterity saving throws.",
      "Attack rolls against the creature have advantage.",
      "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature."]},
  {id: "petrified", name: "Petrified", hue: "#a8a29e", noMove: true, incapacitated: true, autoFail: ["str", "dex"], resistAll: true,
    short: "Turned to stone. Fails STR and DEX saves, resists all damage.",
    rules: ["A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.",
      "The creature is incapacitated (see the condition), can't move or speak, and is unaware of its surroundings.",
      "Attack rolls against the creature have advantage.",
      "The creature automatically fails Strength and Dexterity saving throws.",
      "The creature has resistance to all damage.",
      "The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized."]},
  {id: "poisoned", name: "Poisoned", hue: "#65a30d", attack: "dis", checks: "dis",
    short: "Disadvantage on attacks and ability checks.",
    rules: ["A poisoned creature has disadvantage on attack rolls and ability checks."]},
  {id: "prone", name: "Prone", hue: "#b45309", attack: "dis",
    short: "Crawl or stand up. Your attacks have disadvantage.",
    rules: ["A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition.",
      "The creature has disadvantage on attack rolls.",
      "An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage."]},
  {id: "restrained", name: "Restrained", hue: "#9f1239", attack: "dis", noMove: true, saves: {dex: "dis"},
    short: "Speed 0. Disadvantage on attacks and DEX saves.",
    rules: ["A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
      "Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
      "The creature has disadvantage on Dexterity saving throws."]},
  {id: "stunned", name: "Stunned", hue: "#f97316", noMove: true, incapacitated: true, autoFail: ["str", "dex"],
    short: "Can't move or act. Fails STR and DEX saves.",
    rules: ["A stunned creature is incapacitated (see the condition), can't move, and can speak only falteringly.",
      "The creature automatically fails Strength and Dexterity saving throws.",
      "Attack rolls against the creature have advantage."]},
  {id: "unconscious", name: "Unconscious", hue: "#6366f1", noMove: true, incapacitated: true, autoFail: ["str", "dex"],
    short: "Out cold and prone. Fails STR and DEX saves.",
    rules: ["An unconscious creature is incapacitated (see the condition), can't move or speak, and is unaware of its surroundings.",
      "The creature drops whatever it's holding and falls prone.",
      "The creature automatically fails Strength and Dexterity saving throws.",
      "Attack rolls against the creature have advantage.",
      "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature."]}
];

/* Exhaustion's six levels; a creature suffers its level's effect and
   every lower one. `short` is the card's wording of the same effect. */
export var EXHAUSTION_LEVELS = [
  {level: 1, effect: "Disadvantage on ability checks", short: "disadvantage on checks"},
  {level: 2, effect: "Speed halved", short: "speed halved"},
  {level: 3, effect: "Disadvantage on attack rolls and saving throws", short: "disadvantage on attacks and saves"},
  {level: 4, effect: "Hit point maximum halved", short: "HP maximum halved"},
  {level: 5, effect: "Speed reduced to 0", short: "speed 0"},
  {level: 6, effect: "Death", short: "death"}
];

export var EXHAUSTION_RULES = [
  "Some special abilities and environmental hazards, such as starvation and the long-term effects of freezing or scorching temperatures, can lead to a special condition called exhaustion. Exhaustion is measured in six levels.",
  "If an already exhausted creature suffers another effect that causes exhaustion, its current level of exhaustion increases by the amount specified in the effect's description.",
  "A creature suffers the effect of its current level of exhaustion as well as all lower levels.",
  "An effect that removes exhaustion reduces its level as specified in the effect's description, with all exhaustion effects ending if a creature's exhaustion level is reduced below 1.",
  "Finishing a long rest reduces a creature's exhaustion level by 1, provided that the creature has also ingested some food and drink."
];
