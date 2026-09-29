/* Barbarian subclasses: the full feature list for each one, keyed by class
   level. Assembled into SUBCLASSES in ../progression.js; see the comment
   there for the feature fields and flags. */
export var BARBARIAN_SUBCLASSES = [
  {name:"Path of the Berserker", blurb:"Rage turns into a violent frenzy for extra attacks.", features:{
    3:[{name:"Frenzy", text:"When you rage, you can choose to frenzy. For the rest of that rage, on each of your turns after this one you can make a single melee weapon attack as a bonus action. When the rage ends, you suffer one level of exhaustion."}],
    6:[{name:"Mindless Rage", text:"You can't be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the rage's duration."}],
    10:[{name:"Intimidating Presence", text:"As an action, frighten one creature you can see within 30 feet that can see or hear you. It makes a WIS save (DC 8 + proficiency bonus + CHA modifier) or is frightened of you until the end of your next turn. On later turns you can use your action to extend this until the end of your next turn. The effect ends if the creature ends its turn out of your line of sight or more than 60 feet away. If it succeeds on its save, you can't use this on it again for 24 hours."}],
    14:[{name:"Retaliation", text:"When you take damage from a creature within 5 feet of you, you can use your reaction to make a melee weapon attack against it."}]
  }},
  {name:"Path of the Totem Warrior", blurb:"Draws strength from a spirit animal guide.", features:{
    3:[
      {name:"Spirit Seeker", text:"You can cast Beast Sense and Speak with Animals, but only as rituals."},
      {name:"Totem Spirit", text:"Choose a totem animal (you can pick a different animal at levels 6 and 14). Bear: while raging, you have resistance to all damage except psychic. Eagle: while raging and not wearing heavy armor, other creatures have disadvantage on opportunity attacks against you, and you can Dash as a bonus action. Wolf: while raging, your friends have advantage on melee attacks against any hostile creature within 5 feet of you. Elk (SCAG): while raging and not wearing heavy armor, your walking speed increases by 15 feet. Tiger (SCAG): while raging, you can add 10 feet to your long jump and 3 feet to your high jump."}
    ],
    6:[{name:"Aspect of the Beast", text:"Choose a totem animal. Bear: your carrying capacity doubles, and you have advantage on STR checks to push, pull, lift or break objects. Eagle: you can see up to 1 mile away as clearly as if it were 100 feet, and dim light doesn't give you disadvantage on WIS (Perception) checks. Wolf: you can track creatures while travelling at a fast pace, and move stealthily while travelling at a normal pace. Elk: your travel pace is doubled, as is that of up to ten companions within 60 feet of you (while you aren't incapacitated). Tiger: you gain proficiency in two of Athletics, Acrobatics, Stealth and Survival (tick them on the Abilities & Skills tab)."}],
    10:[{name:"Spirit Walker", text:"You can cast Commune with Nature, but only as a ritual. A spiritual version of one of your totem animals appears to give you the information."}],
    14:[{name:"Totemic Attunement", text:"Choose a totem animal. Bear: while raging, any hostile creature within 5 feet of you that can see or hear you has disadvantage on attacks against targets other than you or another character with this feature (unless it can't be frightened). Eagle: while raging, you have a flying speed equal to your walking speed, but you fall if you end your turn in the air with nothing holding you aloft. Wolf: while raging, when you hit a Large or smaller creature with a melee weapon attack, you can use a bonus action to knock it prone. Elk: while raging, you can use a bonus action to move through the space of a Large or smaller creature; it makes a STR save (DC 8 + STR modifier + proficiency bonus) or is knocked prone and takes 1d12 + STR modifier bludgeoning damage. Tiger: while raging, if you move at least 20 feet in a straight line toward a Large or smaller target right before a melee weapon attack against it, you can make an extra melee weapon attack against it as a bonus action."}]
  }},
  {name:"Path of the Zealot", blurb:"A divine warrior powered by a god's fury.", features:{
    3:[
      {name:"Divine Fury", text:"While raging, the first creature you hit with a weapon attack on each of your turns takes an extra 1d6 + half your barbarian level damage. Choose radiant or necrotic when you gain this feature."},
      {name:"Warrior of the Gods", text:"A spell that restores you to life, but not one that makes you undead, needs no material components when cast on you."}
    ],
    6:[{name:"Fanatical Focus", text:"If you fail a saving throw while raging, you can reroll it, and you must use the new roll. You can do this only once per rage."}],
    10:[{name:"Zealous Presence", text:"As a bonus action, let out a battle cry. Up to ten other creatures of your choice within 60 feet that can hear you have advantage on attack rolls and saving throws until the start of your next turn. Once per long rest."}],
    14:[{name:"Rage Beyond Death", text:"While raging, having 0 hit points doesn't knock you unconscious. You still make death saving throws and suffer the normal effects of taking damage at 0 hit points, but if you would die from failed death saves, you don't die until your rage ends, and then only if you still have 0 hit points."}]
  }},
  {name:"Path of the Ancestral Guardian", blurb:"Calls on ancestral spirits to protect allies and hinder foes.", features:{
    3:[
      {name:"Ancestral Protectors", text:"While you're raging, the first creature you hit with an attack on your turn is hindered by your ancestors' spirits until the start of your next turn: it has disadvantage on attack rolls against anyone other than you, and when it hits a creature other than you with an attack, that creature has resistance to the damage. The effect ends early if your rage ends."}
    ],
    6:[
      {name:"Spirit Shield", text:"While you're raging, when another creature you can see within 30 feet takes damage, you can use your reaction to reduce that damage by 2d6. This increases to 3d6 at level 10 and 4d6 at level 14."}
    ],
    10:[
      {name:"Consult the Spirits", text:"You can cast Augury or Clairvoyance without a spell slot or material components (Wisdom is your spellcasting ability for them). Instead of a sensor, this Clairvoyance invisibly summons one of your ancestral spirits to the chosen location. Once per short or long rest."}
    ],
    14:[
      {name:"Vengeful Ancestors", text:"When you use Spirit Shield to reduce the damage of an attack, the attacker takes force damage equal to the damage your Spirit Shield prevents."}
    ]
  }},
  {name:"Path of Wild Magic", blurb:"Fuels rage with unstable magical energy from the raw weave.", features:{
    3:[
      {name:"Magic Awareness", text:"As an action, until the end of your next turn you know the location of any spell or magic item within 60 feet that isn't behind total cover, and the school of magic of any spell you sense. You can use this a number of times equal to your proficiency bonus, regained on a long rest."},
      {name:"Wild Surge", text:"When you enter your rage, roll a d8 on the Wild Magic table (save DC 8 + proficiency bonus + CON modifier). 1: each creature of your choice within 30 feet makes a CON save or takes 1d12 necrotic damage, and you gain 1d12 temporary HP. 2: teleport up to 30 feet to a space you can see; until the rage ends you can do this again as a bonus action each turn. 3: a spirit appears next to a creature within 30 feet and explodes at the end of the turn (DEX save or 1d6 force to each creature within 5 feet of it); until the rage ends you can summon another as a bonus action each turn. 4: a weapon you hold deals force damage and gains the light and thrown (20/60) properties until the rage ends, reappearing in your hand at the end of the turn if it leaves it. 5: until the rage ends, any creature that hits you with an attack roll takes 1d6 force damage. 6: until the rage ends, you and allies within 10 feet of you gain +1 AC. 7: until the rage ends, the ground within 15 feet of you is difficult terrain for your enemies. 8: another creature within 30 feet makes a CON save or takes 1d6 radiant damage and is blinded until the start of your next turn; until the rage ends you can do this again as a bonus action each turn."}
    ],
    6:[
      {name:"Bolstering Magic", text:"As an action, touch a creature (it can be you) and choose one: for 10 minutes it can roll a d3 and add it to each attack roll or ability check it makes; or roll a d3, and it regains one expended spell slot of that level or lower (its choice). A creature can't benefit from this again until after a long rest. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
    ],
    10:[
      {name:"Unstable Backlash", text:"Immediately after you take damage or fail a saving throw while raging, you can use your reaction to roll on the Wild Magic table and produce that effect at once. It replaces your current Wild Magic effect."}
    ],
    14:[
      {name:"Controlled Surge", text:"Whenever you roll on the Wild Magic table, roll the die twice and choose which effect to unleash. If both rolls match, you can ignore them and choose any effect on the table."}
    ]
  }},
  {name:"Path of the Beast", blurb:"Taps into a monstrous inner nature to sprout natural weapons.", features:{
    3:[
      {name:"Form of the Beast", text:"When you enter your rage, you can manifest a natural weapon until the rage ends (choose its form each time). It counts as a simple melee weapon, and you add your STR modifier to its attack and damage rolls. Bite: 1d8 piercing; once on each of your turns when you damage a creature with it while you have less than half your hit points, you regain hit points equal to your proficiency bonus. Claws: 1d6 slashing per claw (the hand must be empty); once on each of your turns when you attack with a claw using the Attack action, you can make one additional claw attack as part of the same action. Tail: 1d8 piercing with reach; when a creature you can see within 10 feet hits you with an attack roll, you can use your reaction to roll a d8 and add it to your AC against that attack, possibly making it miss."}
    ],
    6:[
      {name:"Bestial Soul", text:"Your natural weapons count as magical for overcoming resistance and immunity to nonmagical attacks and damage. When you finish a short or long rest, choose one benefit that lasts until your next short or long rest: a swimming speed equal to your walking speed and water breathing; a climbing speed equal to your walking speed, climbing difficult surfaces (even upside down on ceilings) without an ability check; or, once per turn when you jump, a STR (Athletics) check that extends the jump by a number of feet equal to the check's total."}
    ],
    10:[
      {name:"Infectious Fury", text:"When you hit a creature with your natural weapons while raging, it makes a WIS save (DC 8 + CON modifier + proficiency bonus) or suffers one of these (your choice): it uses its reaction to make a melee attack against another creature of your choice that you can see, or it takes 2d12 psychic damage. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
    ],
    14:[
      {name:"Call the Hunt", text:"When you enter your rage, choose a number of other willing creatures you can see within 30 feet equal to your CON modifier (minimum 1). You gain 5 temporary hit points for each one that accepts. Until the rage ends, once on each of their turns, each of them can roll a d6 and add it to the damage when they hit a target with an attack roll and deal damage. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
    ]
  }},
  {name:"Path of the Giant", blurb:"Channels the might of giants to grow huge and hurl elemental weapons.", features:{
    3:[
      {name:"Giant's Power", text:"You learn to speak, read and write Giant (or another language of your choice if you already know Giant). You also learn the Druidcraft or Thaumaturgy cantrip; Wisdom is your spellcasting ability for it."},
      {name:"Giant's Havoc", text:"While raging: Crushing Throw (when you hit with a ranged attack using a thrown weapon and Strength, add your Rage damage bonus to the damage) and Giant Stature (your reach increases by 5 feet, and if you are smaller than Large you become Large, along with anything you're wearing, if there's room)."}
    ],
    6:[
      {name:"Elemental Cleaver", text:"When you enter your rage, infuse one weapon you're holding with acid, cold, fire, lightning or thunder until the rage ends. It deals that damage type instead of its normal type plus an extra 1d6 damage of that type, gains the thrown property (range 20/60) and flies back to your hand right after you throw it. As a bonus action on later turns of the rage, you can change the damage type."}
    ],
    10:[
      {name:"Mighty Impel", text:"Bonus action while raging: choose one Medium or smaller creature within your reach and move it to an unoccupied space you can see within 30 feet of you. An unwilling creature makes a Strength save (DC 8 + proficiency bonus + STR modifier) to avoid it. A creature moved into the air falls and takes falling damage as normal."}
    ],
    14:[
      {name:"Demiurgic Colossus", text:"While raging, Giant Stature increases your reach by 10 feet instead of 5, and you can choose to become Large or Huge if there's room. Mighty Impel can now move Large or smaller creatures, and the extra damage from Elemental Cleaver increases to 2d6."}
    ]
  }},
  {name:"Path of the Storm Herald", blurb:"Rages as a living storm, surrounded by an aura of desert, sea or tundra.", features:{
    3:[
      {name:"Storm Aura", text:"While raging you emanate a 10-foot aura. Choose desert, sea or tundra (you can change it each time you gain a barbarian level). The effect activates when you enter your rage, and again each turn as a bonus action. Save DC is 8 + proficiency bonus + CON modifier. Desert: every other creature in the aura takes 2 fire damage (3 at level 5, 4 at 10, 5 at 15, 6 at 20). Sea: one other creature in the aura makes a DEX save or takes 1d6 lightning damage, half on a success (2d6 at level 10, 3d6 at 15, 4d6 at 20). Tundra: each creature of your choice in the aura gains 2 temporary HP (3 at level 5, 4 at 10, 5 at 15, 6 at 20)."}
    ],
    6:[
      {name:"Storm Soul", text:"You gain a benefit based on your aura, even when not raging. Desert: resistance to fire damage, no ill effects from extreme heat, and as an action you can set fire to a flammable object you touch that no one is wearing or carrying. Sea: resistance to lightning damage, you can breathe underwater, and you gain a 30-foot swim speed. Tundra: resistance to cold damage, no ill effects from extreme cold, and as an action you can touch water and turn a 5-foot cube of it into ice, which melts after 1 minute."}
    ],
    10:[
      {name:"Shielding Storm", text:"Each creature of your choice has the damage resistance you gained from Storm Soul while it is in your Storm Aura."}
    ],
    14:[
      {name:"Raging Storm", text:"Your aura gains a stronger effect while raging. Desert: right after a creature in your aura hits you with an attack, use your reaction to force it to make a DEX save; on a failure it takes fire damage equal to half your barbarian level. Sea: when you hit a creature in your aura, use your reaction to force it to make a STR save; on a failure it is knocked prone. Tundra: whenever your aura's effect activates, choose one creature in it; it makes a STR save or its speed becomes 0 until the start of your next turn."}
    ]
  }},
  {name:"Path of the Battlerager", blurb:"A dwarven berserker who charges into battle clad in spiked armor.", features:{
    3:[
      {name:"Battlerager Armor", text:"Traditionally for dwarves only (ask your DM). While wearing spiked armor and raging, you can use a bonus action to make one melee attack with your armor spikes against a creature within 5 feet: 1d4 + STR piercing damage on a hit. When you use the Attack action to grapple and succeed, the target also takes 3 piercing damage."}
    ],
    6:[
      {name:"Reckless Abandon", text:"When you use Reckless Attack while raging, you gain temporary hit points equal to your CON modifier (minimum 1). They vanish when your rage ends."}
    ],
    10:[
      {name:"Battlerager Charge", text:"You can take the Dash action as a bonus action while you are raging."}
    ],
    14:[
      {name:"Spiked Retribution", text:"When a creature within 5 feet of you hits you with a melee attack, it takes 3 piercing damage if you are raging, aren't incapacitated and are wearing spiked armor."}
    ]
  }}
];
