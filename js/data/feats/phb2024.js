/* ---------------- Feats: Player's Handbook (2024) ----------------
   The ten Origin feats the 2024 Player's Handbook's backgrounds give.
   Checked against the printed 2024 Player's Handbook (chapter 5, pages
   200-201, books/) on 2026-11-04.
   Eight share a name with a 2014 feat and differ from it, so they carry
   " (2024)"; Crafter and Musician are new. The 2014 feats stay as they
   were for everything else.
   `origin`: an Origin feat (the 2024 character rules' free feat for a
   background without one is picked from these). `spellChange`: one of
   its picked spells can be swapped at each level-up (Magic Initiate).
   The fields are explained at the top of ../feats.js. */
var CRAFTER_TOOLS = ["Carpenter's tools","Leatherworker's tools","Mason's tools","Potter's tools","Smith's tools","Tinker's tools","Weaver's tools","Woodcarver's tools"];
var MI_LISTS = {"Cleric":{list:"Cleric"}, "Druid":{list:"Druid"}, "Wizard":{list:"Wizard"}};

export var PHB_2024_FEATS = [
  {
    name: "Alert (2024)",
    remind: {when: "always", line: "Right after you roll initiative, you can swap it with a willing ally's"},
    source: "XPHB", origin: true,
    prerequisite: "None",
    category: "Combat",
    summary: "Add your proficiency bonus to initiative. Right after you roll initiative, you can swap it with a willing ally's.",
    description: "You gain the following benefits.\n• Initiative Proficiency. When you roll Initiative, you can add your Proficiency Bonus to the roll.\n• Initiative Swap. Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can't make this swap if you or the ally has the Incapacitated condition."
  },
  {
    name: "Crafter",
    remind: {when: "always", line: "Nonmagical items cost you 20% less. After a long rest, fast craft one item"},
    source: "XPHB", origin: true,
    toolPicks: {count: 3, group: "Artisan's tools", only: CRAFTER_TOOLS},
    prerequisite: "None",
    category: "Utility",
    summary: "Proficiency with three artisan's tools. You pay 20% less for nonmagical items, and after a long rest you can craft one simple item that lasts until your next long rest.",
    description: "You gain the following benefits.\n• Tool Proficiency. You gain proficiency with three different Artisan's Tools of your choice from the Fast Crafting table.\n• Discount. Whenever you buy a nonmagical item, you receive a 20 percent discount on it.\n• Fast Crafting. When you finish a Long Rest, you can craft one piece of gear from the Fast Crafting table, provided you have the Artisan's Tools associated with that item and have proficiency with those tools. The item lasts until you finish another Long Rest, at which point the item falls apart.\nFast Crafting:\n• Carpenter's Tools: Ladder, Torch\n• Leatherworker's Tools: Case, Pouch\n• Mason's Tools: Block and Tackle\n• Potter's Tools: Jug, Lamp\n• Smith's Tools: Ball Bearings, Bucket, Caltrops, Grappling Hook, Iron Pot\n• Tinker's Tools: Bell, Shovel, Tinder Box\n• Weaver's Tools: Basket, Rope, Net, Tent\n• Woodcarver's Tools: Club, Greatclub, Quarterstaff"
  },
  {
    name: "Healer (2024)",
    source: "XPHB", origin: true,
    prerequisite: "None",
    category: "Support",
    summary: "As an action, use a healer's kit on a creature within 5 feet: it spends a Hit Die, and it regains that roll plus your proficiency bonus. You reroll 1s on your healing dice.",
    description: "You gain the following benefits.\n• Battle Medic. If you have a Healer's Kit, you can expend one use of it and tend to a creature within 5 feet of yourself as a Utilize action. That creature can expend one of its Hit Point Dice, and you then roll that die. The creature regains a number of Hit Points equal to the roll plus your Proficiency Bonus.\n• Healing Rerolls. Whenever you roll a die to determine the number of Hit Points you restore with a spell or with this feat's Battle Medic benefit, you can reroll the die if it rolls a 1, and you must use the new roll."
  },
  {
    name: "Lucky (2024)",
    source: "XPHB", origin: true,
    prerequisite: "None",
    category: "General",
    summary: "You have Luck Points equal to your proficiency bonus each long rest. Spend one for advantage on a d20 roll, or to give disadvantage to an attack against you.",
    description: "You gain the following benefits.\n• Luck Points. You have a number of Luck Points equal to your Proficiency Bonus and can spend the points on the benefits below. You regain your expended Luck Points when you finish a Long Rest.\n• Advantage. When you roll a d20 for a D20 Test, you can spend 1 Luck Point to give yourself Advantage on the roll.\n• Disadvantage. When a creature rolls a d20 for an attack roll against you, you can spend 1 Luck Point to impose Disadvantage on that roll."
  },
  {
    name: "Magic Initiate (2024)",
    source: "XPHB", origin: true,
    option: {label: "Spell list", options: ["Cleric","Druid","Wizard"]},
    repeatable: true, spellChange: true,
    castAbility: ["int","wis","cha"],
    spellPick: [
      {count: 2, level: 0, label: "cantrip from that list", plural: "cantrips from that list", byOption: MI_LISTS},
      {count: 1, level: 1, label: "level 1 spell from that list", byOption: MI_LISTS}
    ],
    prerequisite: "None",
    category: "Magic",
    summary: "Two cantrips and a level 1 spell from the cleric, druid or wizard list. The spell is always prepared, and you can cast it once per long rest without a slot, or with your slots.",
    description: "You gain the following benefits.\n• Two Cantrips. You learn two cantrips of your choice from the Cleric, Druid, or Wizard spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat's spells (choose when you select this feat).\n• Level 1 Spell. Choose a level 1 spell from the same list you selected for this feat's cantrips. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n• Spell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.\n• Repeatable. You can take this feat more than once, but you must choose a different spell list each time."
  },
  {
    name: "Musician",
    remind: {when: "always", line: "As you finish a rest, a song gives Heroic Inspiration to allies (your PB)"},
    source: "XPHB", origin: true,
    toolPicks: {count: 3, group: "Musical instruments"},
    prerequisite: "None",
    category: "Support",
    summary: "Proficiency with three musical instruments. As you finish a short or long rest, you can play a song that gives Heroic Inspiration to allies who hear it, as many as your proficiency bonus.",
    description: "You gain the following benefits.\n• Instrument Training. You gain proficiency with three Musical Instruments of your choice.\n• Encouraging Song. As you finish a Short or Long Rest, you can play a song on a Musical Instrument with which you have proficiency and give Heroic Inspiration to allies who hear the song. The number of allies you can affect in this way equals your Proficiency Bonus."
  },
  {
    name: "Savage Attacker (2024)",
    remind: {when: "always", line: "Once per turn when you hit with a weapon, roll its damage dice twice, use either"},
    source: "XPHB", origin: true,
    prerequisite: "None",
    category: "Combat",
    summary: "Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll.",
    description: "You've trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target."
  },
  {
    name: "Skilled (2024)",
    source: "XPHB", origin: true,
    skillsOrTools: 3,
    repeatable: true,
    prerequisite: "None",
    category: "Utility",
    summary: "You gain proficiency in any three skills or tools of your choice.",
    description: "You gain proficiency in any combination of three skills or tools of your choice.\n• Repeatable. You can take this feat more than once."
  },
  {
    name: "Tavern Brawler (2024)",
    remind: {when: "always", line: "Reroll 1s on unarmed damage. Once per turn, an unarmed hit can push 5 feet"},
    source: "XPHB", origin: true,
    prerequisite: "None",
    category: "Combat",
    summary: "Your unarmed strikes deal 1d4 + Strength bludgeoning damage, and you reroll 1s on their damage. You are proficient with improvised weapons, and once per turn an unarmed hit can push the target 5 feet.",
    description: "You gain the following benefits.\n• Enhanced Unarmed Strike. When you hit with your Unarmed Strike and deal damage, you can deal Bludgeoning damage equal to 1d4 plus your Strength modifier instead of the normal damage of an Unarmed Strike.\n• Damage Rerolls. Whenever you roll a damage die for your Unarmed Strike, you can reroll the die if it rolls a 1, and you must use the new roll.\n• Improvised Weaponry. You have proficiency with improvised weapons.\n• Push. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can deal damage to the target and also push it 5 feet away from you. You can use this benefit only once per turn."
  },
  {
    name: "Tough (2024)",
    source: "XPHB", origin: true,
    prerequisite: "None",
    category: "Defense",
    summary: "Your hit point maximum increases by 2 for every level you have and every level you gain.",
    description: "Your Hit Point maximum increases by an amount equal to twice your character level when you gain this feat. Whenever you gain a character level thereafter, your Hit Point maximum increases by an additional 2 Hit Points."
  }
];
