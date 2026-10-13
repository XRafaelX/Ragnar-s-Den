/* ---------------- Feats: Planescape: Adventures in the Multiverse ----------------
   Planescape: Adventures in the Multiverse. Scion of the Outer Planes
   picks a plane; each level 4 feat needs the matching one.
   The fields are explained at the top of ../feats.js. */
export var PLANESCAPE_FEATS = [
  {
    name: "Scion of the Outer Planes",
    source: "PAitM",
    option:{label:"Plane", options:["Chaotic Outer Plane","Evil Outer Plane","Good Outer Plane","Lawful Outer Plane","The Outlands"], details:{
      "Chaotic Outer Plane":"Resistance to poison damage and the minor illusion cantrip.",
      "Evil Outer Plane":"Resistance to necrotic damage and the chill touch cantrip.",
      "Good Outer Plane":"Resistance to radiant damage and the sacred flame cantrip.",
      "Lawful Outer Plane":"Resistance to force damage and the guidance cantrip.",
      "The Outlands":"Resistance to psychic damage and the mage hand cantrip."}},
    castAbility:["int","wis","cha"],
    grantsByOption:{
      "Chaotic Outer Plane":["Minor Illusion"], "Evil Outer Plane":["Chill Touch"], "Good Outer Plane":["Sacred Flame"],
      "Lawful Outer Plane":["Guidance"], "The Outlands":["Mage Hand"]},
    prerequisite: "Planescape campaign",
    category: "Magic",
    summary: "Choose a kind of Outer Plane. You gain resistance to one damage type and learn one cantrip tied to that plane.",
    description: "You are infused with the energy of an Outer Plane or the Outlands. Choose a type of plane. It gives you resistance to a damage type and a cantrip:\n• Chaotic Outer Plane: poison resistance, minor illusion.\n• Evil Outer Plane: necrotic resistance, chill touch.\n• Good Outer Plane: radiant resistance, sacred flame.\n• Lawful Outer Plane: force resistance, guidance.\n• The Outlands: psychic resistance, mage hand.\nYou can cast the cantrip without material components, and your spellcasting ability for it is Intelligence, Wisdom, or Charisma (choose when you select this feat)."
  },
  {
    name: "Agent of Order",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Lawful Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Lawful Outer Plane) feat",
    category: "Combat",
    summary: "Raise one ability score by 1. Once per turn when you damage a creature, you can deal an extra 1d8 force damage, and it must succeed on a Wisdom save or be restrained.",
    description: "You can channel cosmic forces of order to bind your foes. You gain the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Stasis Strike. Once per turn, when you deal damage to a creature you can see within 60 feet of yourself, you can deal an extra 1d8 force damage to the target, and it must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + the modifier of the spellcasting ability you chose for the Scion of the Outer Planes feat) or have the restrained condition until the start of your next turn. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Baleful Scion",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Evil Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Evil Outer Plane) feat",
    category: "Combat",
    summary: "Raise one ability score by 1. Once per turn when you damage a creature, you can deal extra necrotic damage equal to 1d6 + your proficiency bonus and regain that many hit points.",
    description: "You can channel sinister forces to drain the life of your foes. You gain the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Grasp of Avarice. Once per turn, when you deal damage to a creature you can see within 60 feet of yourself, you can also deal necrotic damage to it equal to 1d6 + your proficiency bonus. You then regain hit points equal to the necrotic damage dealt. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Cohort of Chaos",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Chaotic Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Chaotic Outer Plane) feat",
    category: "General",
    summary: "Raise one ability score by 1. When you roll a 1 or a 20 on an attack roll or saving throw, a random chaotic effect erupts around you.",
    description: "You can channel chaos. You gain the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Chaotic Flare. When you roll a 1 or a 20 on an attack roll or a saving throw, roll a d4 for a flare that lasts until the end of your next turn. A new flare can't occur until the current one ends.\n1, Battle Fury: one creature you can see gains advantage on attack rolls and disadvantage on ability checks.\n2, Disruption Field: waves of energy surround you in a 5-foot radius. Each creature that starts its turn there, or enters it for the first time on a turn, takes 1d8 force damage.\n3, Unbound: when you move, you can use some or all of your walking speed to teleport once, with anything you wear or carry, up to the distance used to an unoccupied space you can see.\n4, Wailing Winds: winds swirl in a 15-foot-radius sphere centered on you. You and other creatures in that area have disadvantage on Wisdom saving throws."
  },
  {
    name: "Outlands Envoy",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    castAbility:{feat:"Scion of the Outer Planes"},
    grantsSpells:["Misty Step", "Tongues"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"The Outlands"},
    prerequisite: "4th level, Scion of the Outer Planes (The Outlands) feat",
    category: "Magic",
    summary: "Raise one ability score by 1. You can cast Misty Step and Tongues once each per long rest without a spell slot.",
    description: "Your connection to the crossroads of the multiverse grants you the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Crossroads Emissary. You learn the misty step and tongues spells. You can cast each of them once without a spell slot (tongues without material components), and you must finish a long rest before you can cast that spell in this way again. You can also cast these spells using spell slots you have of the appropriate level. Their spellcasting ability is the one chosen when you gained the Scion of the Outer Planes feat."
  },
  {
    name: "Planar Wanderer",
    source: "PAitM",
    requires:{level:4, feat:"Scion of the Outer Planes"},
    prerequisite: "4th level, Scion of the Outer Planes feat",
    category: "Utility",
    summary: "After each long rest you choose resistance to acid, cold or fire damage. You can force planar portals open or closed and sense portals near you.",
    description: "You can draw on the forces of the multiverse to survive in and traverse its planes. You gain the following benefits:\n• Planar Adaptation. When you finish a long rest, you gain resistance to acid, cold, or fire damage (your choice) until you finish your next long rest.\n• Portal Cracker. You can use an action to concentrate on a portal you're aware of within 5 feet of you and make a DC 20 Intelligence (Arcana) check. On a failed check, you take 3d8 psychic damage and can't use this benefit on that portal again until you finish a long rest. On a successful check, you can force the portal open or closed for 1 hour, during which it ignores its portal key unless a creature using the key succeeds on a DC 20 Intelligence (Arcana) check as an action.\n• Portal Sense. You know the direction to the last planar portal you used while you and the portal are on the same plane. As an action, you can detect any portals within 30 feet of you that aren't behind total cover. Once you use this action, you can't use it again until you finish a long rest."
  },
  {
    name: "Righteous Heritor",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Good Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Good Outer Plane) feat",
    category: "Support",
    summary: "Raise one ability score by 1. When you or a creature within 30 feet takes damage, you can use your reaction to reduce it by 1d10 + your proficiency bonus.",
    description: "You can channel benevolent forces to protect others. You gain the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Soothe Pain. When you or a creature within 30 feet of you takes damage, you can use your reaction to reduce that damage by 1d10 + your proficiency bonus. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  }
];
