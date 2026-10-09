/* ---------------- Class option sets ----------------
   Features where a class or subclass learns options from a list as it
   levels: Metamagic, Battle Master maneuvers (more sets follow the same
   shape). Rules from the Player's Handbook and Tasha's Cauldron (2014).
   Each set:
     id, label (the set, "Maneuvers"), noun (one option, "maneuver")
     className, subclass (null for a class feature)
     known      {classLevel: total known}: the count from that level on
     swap       when one known option may be replaced on a level-up:
                "learn" (only when new ones are learned), "level" (any
                level in the class), "never", or "rest" (after any long
                rest: done on the sheet's card, never in the level-up)
     costUnit   [one, many] for `cost` ("ki point"); sorcery points if absent
     always     options always known on top of the picks (Elemental
                Attunement): shown on the card, never offered
     card, cardLabel  sets sharing one Features-tab card (the Hunter's four
                tiers, the Totem Warrior's three animals)
     versatility  true when Tasha's optional "Versatility" feature lets
                one be replaced at the class's Ability Score Improvement
                levels (Sorcerous / Martial Versatility); only for
                characters with Tasha's optional features turned on
     help       one plain sentence for the level-up and the card
     options    [{name, source ("PHB"/"TCE"), text, cost (sorcery points,
                Metamagic), save (ability for its saving throw, maneuvers),
                level (class level needed, when gated), optional (one of
                Tasha's optional class features: offered only to characters
                using them), darkvision (feet), speeds (like class
                features'; `level` = class level it starts at), rageSpeed
                (walking speed bonus while raging, not in heavy armor)}] */
export var OPTION_SETS = [
  {
    id:"metamagic", label:"Metamagic", noun:"Metamagic option", className:"Sorcerer", subclass:null,
    known:{3:2, 10:3, 17:4}, swap:"never", versatility:true,
    help:"Ways to twist your spells, paid for with sorcery points. You can use one per spell (Empowered and Seeking can be added to another).",
    options:[
      {name:"Careful Spell", source:"PHB", cost:"1", text:"When you cast a spell that forces other creatures to make a saving throw, choose up to your Charisma modifier of them (minimum one): they automatically succeed on their saving throw against it."},
      {name:"Distant Spell", source:"PHB", cost:"1", text:"Double the range of a spell with a range of 5 feet or more, or make a touch spell's range 30 feet."},
      {name:"Empowered Spell", source:"PHB", cost:"1", text:"When you roll damage for a spell, reroll up to your Charisma modifier of the damage dice (minimum one) and use the new rolls. You can use this even if you already used another Metamagic option on the spell."},
      {name:"Extended Spell", source:"PHB", cost:"1", text:"Double the duration of a spell that lasts 1 minute or longer, to a maximum of 24 hours."},
      {name:"Heightened Spell", source:"PHB", cost:"3", text:"Give one target of a spell disadvantage on its first saving throw against it."},
      {name:"Quickened Spell", source:"PHB", cost:"2", text:"Cast a spell that takes 1 action as a bonus action instead."},
      {name:"Subtle Spell", source:"PHB", cost:"1", text:"Cast a spell without any somatic or verbal components."},
      {name:"Twinned Spell", source:"PHB", cost:"spell level (1 for a cantrip)", text:"When a spell targets only one creature and doesn't have a range of self, target a second creature in range with it."},
      {name:"Seeking Spell", source:"TCE", optional:true, cost:"2", text:"If you make an attack roll for a spell and miss, reroll the d20 and use the new roll. You can use this even if you already used another Metamagic option on the spell."},
      {name:"Transmuted Spell", source:"TCE", optional:true, cost:"1", text:"Change a spell's acid, cold, fire, lightning, poison or thunder damage to another of those types."}
    ]
  },
  {
    id:"maneuvers", label:"Maneuvers", noun:"maneuver", className:"Fighter", subclass:"Battle Master",
    known:{3:3, 7:5, 10:7, 15:9}, swap:"learn", versatility:true,
    help:"Special combat moves, each fuelled by a superiority die: an extra effect on a hit, a reaction, or a bonus to a check.",
    options:[
      {name:"Commander's Strike", source:"PHB", text:"When you take the Attack action, forgo one of your attacks and use a bonus action to direct an ally who can see or hear you: it can use its reaction to make one weapon attack, adding the superiority die to its damage."},
      {name:"Disarming Attack", source:"PHB", save:"str", text:"When you hit with a weapon attack, add the superiority die to the damage; the target makes a Strength save or drops one item it's holding (your choice), which lands at its feet."},
      {name:"Distracting Strike", source:"PHB", text:"When you hit with a weapon attack, add the superiority die to the damage; the next attack roll against the target by someone other than you has advantage, if made before the start of your next turn."},
      {name:"Evasive Footwork", source:"PHB", text:"When you move, add the superiority die to your AC until you stop moving."},
      {name:"Feinting Attack", source:"PHB", text:"As a bonus action, feint at a creature within 5 feet: you have advantage on your next attack roll against it this turn, and add the superiority die to the damage if it hits."},
      {name:"Goading Attack", source:"PHB", save:"wis", text:"When you hit with a weapon attack, add the superiority die to the damage; the target makes a Wisdom save or has disadvantage on attacks against anyone but you until the end of your next turn."},
      {name:"Lunging Attack", source:"PHB", text:"When you make a melee weapon attack on your turn, increase your reach for it by 5 feet; add the superiority die to the damage if it hits."},
      {name:"Maneuvering Attack", source:"PHB", text:"When you hit with a weapon attack, add the superiority die to the damage; an ally who can see or hear you can use its reaction to move up to half its speed without provoking an opportunity attack from the target."},
      {name:"Menacing Attack", source:"PHB", save:"wis", text:"When you hit with a weapon attack, add the superiority die to the damage; the target makes a Wisdom save or is frightened of you until the end of your next turn."},
      {name:"Parry", source:"PHB", text:"When another creature damages you with a melee attack, use your reaction to reduce the damage by the superiority die + your Dexterity modifier."},
      {name:"Precision Attack", source:"PHB", text:"When you make a weapon attack roll, add the superiority die to it, before or after rolling but before the result is known."},
      {name:"Pushing Attack", source:"PHB", save:"str", text:"When you hit with a weapon attack, add the superiority die to the damage; a Large or smaller target makes a Strength save or is pushed up to 15 feet away from you."},
      {name:"Rally", source:"PHB", text:"On your turn, use a bonus action to bolster an ally who can see or hear you: it gains temporary hit points equal to the superiority die + your Charisma modifier."},
      {name:"Riposte", source:"PHB", text:"When a creature misses you with a melee attack, use your reaction to make a melee weapon attack against it, adding the superiority die to the damage if it hits."},
      {name:"Sweeping Attack", source:"PHB", text:"When you hit a creature with a melee weapon attack, choose another creature within 5 feet of it and within your reach: if your attack roll would hit it, it takes the superiority die in damage of the same type."},
      {name:"Trip Attack", source:"PHB", save:"str", text:"When you hit with a weapon attack, add the superiority die to the damage; a Large or smaller target makes a Strength save or is knocked prone."},
      {name:"Ambush", source:"TCE", optional:true, text:"When you make a Dexterity (Stealth) check or an initiative roll, add the superiority die to it, unless you're incapacitated."},
      {name:"Bait and Switch", source:"TCE", optional:true, text:"On your turn, spend at least 5 feet of movement to swap places with a willing creature within 5 feet (no opportunity attacks); you or it (your choice) adds the superiority die to AC until the start of your next turn."},
      {name:"Brace", source:"TCE", optional:true, text:"When a creature you can see moves into the reach of the melee weapon you're wielding, use your reaction to make one attack against it with that weapon, adding the superiority die to the damage if it hits."},
      {name:"Commanding Presence", source:"TCE", optional:true, text:"When you make a Charisma (Intimidation), (Performance) or (Persuasion) check, add the superiority die to it."},
      {name:"Grappling Strike", source:"TCE", optional:true, text:"Right after you hit a creature with a melee attack on your turn, try to grapple it as a bonus action, adding the superiority die to your Strength (Athletics) check."},
      {name:"Quick Toss", source:"TCE", optional:true, text:"As a bonus action, make a ranged attack with a thrown weapon (you can draw it as part of the attack), adding the superiority die to the damage if it hits."},
      {name:"Tactical Assessment", source:"TCE", optional:true, text:"When you make an Intelligence (Investigation), Intelligence (History) or Wisdom (Insight) check, add the superiority die to it."}
    ]
  },
  /* ---- Rune Knight (Tasha's subclass: its runes are standard, not optional) ---- */
  {
    id:"runes", label:"Runes", noun:"rune", className:"Fighter", subclass:"Rune Knight",
    known:{3:2, 7:3, 10:4, 15:5}, swap:"level",
    help:"Giant runes you carve on your gear after a long rest. Each gives a passive benefit and can be invoked once per short or long rest (twice from fighter level 15).",
    options:[
      {name:"Cloud Rune", source:"TCE", text:"Passive: advantage on Dexterity (Sleight of Hand) and Charisma (Deception) checks. Invoke: when you or a creature you can see within 30 feet is hit by an attack roll, use your reaction to make a different creature within 30 feet (not the attacker) the target instead, using the same roll."},
      {name:"Fire Rune", source:"TCE", save:"str", text:"Passive: your proficiency bonus is doubled for ability checks with a tool you're proficient with. Invoke: when you hit with a weapon attack, the target takes an extra 2d6 fire damage and makes a Strength save or is restrained for 1 minute, taking 2d6 fire damage at the start of each of its turns (repeating the save at the end of each turn)."},
      {name:"Frost Rune", source:"TCE", text:"Passive: advantage on Wisdom (Animal Handling) and Charisma (Intimidation) checks. Invoke: as a bonus action, +2 to all Strength- and Constitution-based ability checks and saving throws for 10 minutes."},
      {name:"Stone Rune", source:"TCE", save:"wis", darkvision:120, text:"Passive: advantage on Wisdom (Insight) checks and darkvision out to 120 feet. Invoke: with your reaction when a creature you can see ends its turn within 30 feet, it makes a Wisdom save or is charmed by you for 1 minute (incapacitated, speed 0), repeating the save at the end of each of its turns."},
      {name:"Hill Rune", source:"TCE", level:7, text:"Passive: advantage on saving throws against being poisoned, and resistance to poison damage. Invoke: as a bonus action, resistance to bludgeoning, piercing and slashing damage for 1 minute."},
      {name:"Storm Rune", source:"TCE", level:7, text:"Passive: advantage on Intelligence (Arcana) checks, and you can't be surprised unless you're incapacitated. Invoke: as a bonus action, for 1 minute when you or a creature you can see within 60 feet makes an attack roll, saving throw or ability check, you can use your reaction to give the roll advantage or disadvantage."}
    ]
  },

  /* ---- Arcane Archer (Xanathar's) ---- */
  {
    id:"arcaneShots", label:"Arcane Shots", noun:"Arcane Shot option", className:"Fighter", subclass:"Arcane Archer",
    known:{3:2, 7:3, 10:4, 15:5, 18:6}, swap:"learn",
    help:"Magic you weave into an arrow fired from a shortbow or longbow, once per turn as part of the Attack action. You have two uses per short or long rest; the extra damage doubles at fighter level 18.",
    options:[
      {name:"Banishing Arrow", source:"XGE", save:"cha", text:"On a hit, the target makes a Charisma save or is banished to the Feywild until the end of its next turn (speed 0, incapacitated), returning to its space or the nearest free one. From fighter level 18 it also takes 2d6 force damage."},
      {name:"Beguiling Arrow", source:"XGE", save:"wis", text:"On a hit, +2d6 psychic damage, and you choose one of your allies within 30 feet of the target: it makes a Wisdom save or is charmed by that ally until the start of your next turn."},
      {name:"Bursting Arrow", source:"XGE", text:"On a hit, the arrow detonates: the target and each creature within 10 feet of it take 2d6 force damage."},
      {name:"Enfeebling Arrow", source:"XGE", save:"con", text:"On a hit, +2d6 necrotic damage, and the target makes a Constitution save or deals only half damage with weapon attacks until the start of your next turn."},
      {name:"Grasping Arrow", source:"XGE", text:"On a hit, +2d6 poison damage, and brambles wrap the target for 1 minute: its speed drops by 10 feet and it takes 2d6 slashing damage the first time on each turn it moves 1 foot or more without teleporting. A creature can use its action to pull them free with a Strength (Athletics) check against your Arcane Shot save DC."},
      {name:"Piercing Arrow", source:"XGE", save:"dex", text:"No attack roll: the arrow flies in a 30-foot line, passing through objects and ignoring cover. Each creature in the line makes a Dexterity save, taking the arrow's damage + 1d6 piercing on a failure, or half on a success."},
      {name:"Seeking Arrow", source:"XGE", save:"dex", text:"No attack roll: aim at a creature you've seen in the past minute; the arrow flies around obstacles to it. It makes a Dexterity save, taking the arrow's damage + 1d6 force on a failure (and you learn where it is), or half on a success."},
      {name:"Shadow Arrow", source:"XGE", save:"wis", text:"On a hit, +2d6 psychic damage, and the target makes a Wisdom save or can't see anything farther than 5 feet away until the start of your next turn."}
    ]
  },

  /* ---- Way of the Four Elements ---- */
  {
    id:"disciplines", label:"Elemental Disciplines", noun:"elemental discipline", className:"Monk", subclass:"Way of the Four Elements",
    known:{3:1, 6:2, 11:3, 17:4}, swap:"learn", costUnit:["ki point", "ki points"],
    always:[{name:"Elemental Attunement", source:"PHB", text:"As an action, briefly control elemental forces nearby: a harmless sensory effect, light or snuff out a small flame, chill or warm up to 1 pound of nonliving material for 1 hour, or shape earth, fire, water or mist that fits in a 1-foot cube for 1 minute."}],
    help:"Elemental magic fuelled by ki. You always know Elemental Attunement; the others are your picks, with stronger ones unlocking at monk levels 6, 11 and 17.",
    options:[
      {name:"Fangs of the Fire Snake", source:"PHB", cost:"1", text:"When you take the Attack action, your unarmed strikes this turn have 10 extra feet of reach and deal fire damage. Spend 1 more ki on a hit to deal an extra 1d10 fire damage."},
      {name:"Fist of Four Thunders", source:"PHB", cost:"2", text:"Cast Thunderwave: a 15-foot cube of thunder from you (Constitution save: 2d8 thunder damage and pushed 10 feet, or half damage and no push on a success)."},
      {name:"Fist of Unbroken Air", source:"PHB", cost:"2", save:"str", text:"As an action, a creature within 30 feet makes a Strength save or takes 3d10 bludgeoning damage (+1d10 per extra ki spent), is pushed up to 20 feet away and knocked prone; on a success, half damage only."},
      {name:"Rush of the Gale Spirits", source:"PHB", cost:"2", text:"Cast Gust of Wind: a 60-foot line of strong wind for up to 1 minute (concentration) that pushes creatures 15 feet away (Strength save) and makes moving toward you cost double."},
      {name:"Shape the Flowing River", source:"PHB", cost:"1", text:"As an action, shape, freeze or melt water and ice in a 30-foot cube within 120 feet (raise or lower it, make trenches or walls, but nothing that traps or damages a creature)."},
      {name:"Sweeping Cinder Strike", source:"PHB", cost:"2", text:"Cast Burning Hands: a 15-foot cone of flame (Dexterity save: 3d6 fire damage, half on a success)."},
      {name:"Water Whip", source:"PHB", cost:"2", save:"dex", text:"As an action, a creature within 30 feet makes a Dexterity save or takes 3d10 bludgeoning damage (+1d10 per extra ki spent) and is pulled up to 25 feet closer or knocked prone (your choice); on a success, half damage only."},
      {name:"Clench of the North Wind", source:"PHB", cost:"3", level:6, text:"Cast Hold Person: a humanoid you can see within 60 feet makes a Wisdom save or is paralyzed for up to 1 minute (concentration), repeating the save at the end of each of its turns."},
      {name:"Gong of the Summit", source:"PHB", cost:"3", level:6, text:"Cast Shatter: a 10-foot-radius burst of sound within 60 feet (Constitution save: 3d8 thunder damage, half on a success)."},
      {name:"Eternal Mountain Defense", source:"PHB", cost:"5", level:11, text:"Cast Stoneskin on yourself: resistance to nonmagical bludgeoning, piercing and slashing damage for up to 1 hour (concentration)."},
      {name:"Flames of the Phoenix", source:"PHB", cost:"4", level:11, text:"Cast Fireball: a 20-foot-radius explosion within 150 feet (Dexterity save: 8d6 fire damage, half on a success)."},
      {name:"Mist Stance", source:"PHB", cost:"4", level:11, text:"Cast Gaseous Form on yourself: become a misty cloud that can fly 10 feet and slip through small gaps, with resistance to nonmagical damage, for up to 1 hour (concentration)."},
      {name:"Ride the Wind", source:"PHB", cost:"4", level:11, text:"Cast Fly on yourself: a flying speed of 60 feet for up to 10 minutes (concentration)."},
      {name:"Breath of Winter", source:"PHB", cost:"6", level:17, text:"Cast Cone of Cold: a 60-foot cone of cold air (Constitution save: 8d8 cold damage, half on a success)."},
      {name:"River of Hungry Flame", source:"PHB", cost:"5", level:17, text:"Cast Wall of Fire: a wall of flame up to 60 feet long for up to 1 minute (concentration); creatures caught in it or ending a turn near its hot side take 5d8 fire damage (Dexterity save for half when it appears)."},
      {name:"Wave of Rolling Earth", source:"PHB", cost:"6", level:17, text:"Cast Wall of Stone: a wall of ten 10-by-10-foot stone panels for up to 10 minutes (concentration), permanent if you keep concentrating the whole time."}
    ]
  },

  /* ---- Hunter: one pick at each of 3, 7, 11 and 15, shown on one card ---- */
  {
    id:"huntersPrey", label:"Hunter's Prey", noun:"Hunter's Prey option", className:"Ranger", subclass:"Hunter",
    known:{3:1}, swap:"never", card:"hunter", cardLabel:"Hunter's choices",
    help:"How you bring down your quarry.",
    options:[
      {name:"Colossus Slayer", source:"PHB", text:"Once per turn when you hit a creature with a weapon attack, it takes an extra 1d8 damage if it's below its hit point maximum."},
      {name:"Giant Killer", source:"PHB", text:"When a Large or larger creature within 5 feet of you hits or misses you with an attack, you can use your reaction to attack it right after, if you can see it."},
      {name:"Horde Breaker", source:"PHB", text:"Once on each of your turns when you make a weapon attack, you can make another attack with the same weapon against a different creature within 5 feet of the original target and within your weapon's range."}
    ]
  },
  {
    id:"defensiveTactics", label:"Defensive Tactics", noun:"Defensive Tactics option", className:"Ranger", subclass:"Hunter",
    known:{7:1}, swap:"never", card:"hunter", cardLabel:"Hunter's choices",
    help:"How you keep yourself alive in a fight.",
    options:[
      {name:"Escape the Horde", source:"PHB", text:"Opportunity attacks against you have disadvantage."},
      {name:"Multiattack Defense", source:"PHB", text:"When a creature hits you with an attack, you gain a +4 bonus to AC against all later attacks by that creature for the rest of the turn."},
      {name:"Steel Will", source:"PHB", text:"You have advantage on saving throws against being frightened."}
    ]
  },
  {
    id:"hunterMultiattack", label:"Multiattack", noun:"Multiattack option", className:"Ranger", subclass:"Hunter",
    known:{11:1}, swap:"never", card:"hunter", cardLabel:"Hunter's choices",
    help:"How you strike many foes at once.",
    options:[
      {name:"Volley", source:"PHB", text:"As an action, make a ranged attack against any number of creatures within 10 feet of a point you can see within your weapon's range, with ammunition for each and a separate attack roll for each."},
      {name:"Whirlwind Attack", source:"PHB", text:"As an action, make a melee attack against any number of creatures within 5 feet of you, with a separate attack roll for each."}
    ]
  },
  {
    id:"superiorHuntersDefense", label:"Superior Hunter's Defense", noun:"Superior Hunter's Defense option", className:"Ranger", subclass:"Hunter",
    known:{15:1}, swap:"never", card:"hunter", cardLabel:"Hunter's choices",
    help:"Your last line of defense.",
    options:[
      {name:"Evasion", source:"PHB", text:"When an effect lets you make a Dexterity save to take only half damage, you take no damage on a success and half on a failure."},
      {name:"Stand Against the Tide", source:"PHB", text:"When a hostile creature misses you with a melee attack, you can use your reaction to make it repeat the same attack against another creature (other than itself) of your choice."},
      {name:"Uncanny Dodge", source:"PHB", text:"When an attacker you can see hits you with an attack, you can use your reaction to halve the attack's damage against you."}
    ]
  },

  /* ---- Totem Warrior: an animal at each of 3, 6 and 14, shown on one card ---- */
  {
    id:"totemSpirit", label:"Totem Spirit", noun:"totem animal", className:"Barbarian", subclass:"Path of the Totem Warrior",
    known:{3:1}, swap:"never", card:"totem", cardLabel:"Totem animals",
    help:"The spirit that fills you while you rage.",
    options:[
      {name:"Bear", source:"PHB", text:"While raging, you have resistance to all damage except psychic damage."},
      {name:"Eagle", source:"PHB", text:"While raging and not wearing heavy armor, other creatures have disadvantage on opportunity attacks against you, and you can use the Dash action as a bonus action."},
      {name:"Elk", source:"SCAG", rageSpeed:15, text:"While raging and not wearing heavy armor, your walking speed increases by 15 feet."},
      {name:"Tiger", source:"SCAG", text:"While raging, you can add 10 feet to your long jump distance and 3 feet to your high jump distance."},
      {name:"Wolf", source:"PHB", text:"While raging, your friends have advantage on melee attack rolls against any hostile creature within 5 feet of you."}
    ]
  },
  {
    id:"totemAspect", label:"Aspect of the Beast", noun:"totem animal", className:"Barbarian", subclass:"Path of the Totem Warrior",
    known:{6:1}, swap:"never", card:"totem", cardLabel:"Totem animals",
    help:"A gift from your totem that works even when you aren't raging. It can be a different animal from your Totem Spirit.",
    options:[
      {name:"Bear", source:"PHB", text:"Your carrying capacity (including push, drag and lift) doubles, and you have advantage on Strength checks to push, pull, lift or break objects."},
      {name:"Eagle", source:"PHB", text:"You can see up to 1 mile away with no difficulty, discerning fine details as if looking at something 100 feet away, and dim light doesn't impose disadvantage on your Wisdom (Perception) checks."},
      {name:"Elk", source:"SCAG", text:"Your travel pace is doubled, whether mounted or on foot, as is that of up to ten companions within 60 feet of you while you're not incapacitated."},
      {name:"Tiger", source:"SCAG", text:"You gain proficiency in two skills from Athletics, Acrobatics, Stealth and Survival."},
      {name:"Wolf", source:"PHB", text:"You can track other creatures while traveling at a fast pace, and you can move stealthily while traveling at a normal pace."}
    ]
  },
  {
    id:"totemAttunement", label:"Totemic Attunement", noun:"totem animal", className:"Barbarian", subclass:"Path of the Totem Warrior",
    known:{14:1}, swap:"never", card:"totem", cardLabel:"Totem animals",
    help:"Your totem's greatest gift. It can be a different animal from your earlier ones.",
    options:[
      {name:"Bear", source:"PHB", text:"While raging, any hostile creature within 5 feet of you that can see or hear you has disadvantage on attack rolls against targets other than you or another character with this feature (unless it can't be frightened)."},
      {name:"Eagle", source:"PHB", speeds:[{type:"fly", value:"walk", when:"while raging"}], text:"While raging, you have a flying speed equal to your walking speed, but you fall if you end your turn in the air with nothing else holding you aloft."},
      {name:"Elk", source:"SCAG", save:"str", text:"While raging, you can use a bonus action to move through the space of a Large or smaller creature; it makes a Strength save (DC 8 + Strength modifier + proficiency bonus) or is knocked prone and takes 1d12 + your Strength modifier bludgeoning damage."},
      {name:"Tiger", source:"SCAG", text:"While raging, if you move at least 20 feet in a straight line toward a Large or smaller target right before making a melee weapon attack against it, you can use a bonus action to make an additional melee weapon attack against it."},
      {name:"Wolf", source:"PHB", text:"While raging, you can use a bonus action on your turn to knock a Large or smaller creature prone when you hit it with a melee weapon attack."}
    ]
  },

  /* ---- Storm Herald (Xanathar's): one environment, changeable each level ---- */
  {
    id:"stormEnvironment", label:"Storm Aura", noun:"environment", className:"Barbarian", subclass:"Path of the Storm Herald",
    known:{3:1}, swap:"level",
    help:"The storm you call while raging. It shapes your Storm Aura, Storm Soul (level 6) and Raging Storm (level 14), and you can change it each time you gain a barbarian level.",
    options:[
      {name:"Desert", source:"XGE", text:"Aura: every other creature in it takes fire damage when it activates (2, rising to 3 at barbarian level 5, 4 at 10, 5 at 15, 6 at 20). Storm Soul: resistance to fire damage, no ill effects from extreme heat, and as an action you can set fire to a flammable object you touch that no one is wearing or carrying. Raging Storm: when a creature in your aura hits you, use your reaction to make it take fire damage equal to half your barbarian level unless it succeeds on a Dexterity save."},
      {name:"Sea", source:"XGE", speeds:[{type:"swim", value:30, level:6}], text:"Aura: one other creature in it makes a Dexterity save or takes 1d6 lightning damage, half on a success (2d6 at barbarian level 10, 3d6 at 15, 4d6 at 20). Storm Soul: resistance to lightning damage, you can breathe underwater, and you gain a swimming speed of 30 feet. Raging Storm: when you hit a creature in your aura, use your reaction to make it succeed on a Strength save or be knocked prone."},
      {name:"Tundra", source:"XGE", text:"Aura: each creature of your choice in it gains temporary hit points (2, rising to 3 at barbarian level 5, 4 at 10, 5 at 15, 6 at 20). Storm Soul: resistance to cold damage, no ill effects from extreme cold, and as an action you can touch water and turn a 5-foot cube of it into ice that melts after 1 minute. Raging Storm: whenever your aura activates, choose one creature in it; it makes a Strength save or its speed becomes 0 until the start of your next turn."}
    ]
  },

  /* ---- Misfortune Bringer (Grim Hollow Player's Guide) ---- */
  {
    id:"misfortunes", label:"Misfortunes", noun:"misfortune", className:"Rogue", subclass:"Misfortune Bringer",
    known:{3:2, 9:3, 13:4, 17:5}, swap:"rest", costUnit:["Jinx Point", "Jinx Points"],
    help:"Curses you lay on the creature marked by your Evil Eye, paid for with Jinx Points. After a long rest you can swap one you know for another.",
    options:[
      {name:"Befuddled", source:"GHPG", cost:"2", text:"Action: the marked creature is charmed for 10 minutes, ending if it takes damage or must make a saving throw; afterwards it knows it was magically charmed."},
      {name:"Clumsy", source:"GHPG", cost:"3", text:"Reaction when it moves 5 feet or more: it falls prone and its speed becomes 0 until the end of the turn."},
      {name:"Debilitated", source:"GHPG", cost:"1", text:"Reaction when it takes damage: roll 1d12; it takes that much extra necrotic damage and its hit point maximum drops by the same amount."},
      {name:"Doomed", source:"GHPG", cost:"1", text:"Reaction when you miss it with a weapon attack: make another weapon attack."},
      {name:"Fearful", source:"GHPG", cost:"2", text:"Action: it's frightened for 1 minute (Wisdom save at the end of each of its turns)."},
      {name:"Inept", source:"GHPG", cost:"1", text:"Reaction when it makes an attack roll or ability check: it rerolls and uses the lower result."},
      {name:"Insensate", source:"GHPG", cost:"3", text:"Action: it's blinded and deafened for 1 minute (Constitution save at the end of each of its turns)."},
      {name:"Maimed", source:"GHPG", cost:"2", text:"Reaction when you hit it with an attack roll of 18 or 19: the hit becomes a critical hit."},
      {name:"Marked", source:"GHPG", cost:"2", text:"Bonus action: your Evil Eye lasts 24 hours instead and lets you track the creature."},
      {name:"Plagued", source:"GHPG", cost:"1", text:"Reaction when it regains hit points: the healing is halved and it can't regain more until the start of your next turn."},
      {name:"Ruined", source:"GHPG", cost:"2", text:"Reaction when it makes a saving throw: it rerolls and uses the lower result."},
      {name:"Somnolent", source:"GHPG", cost:"3", text:"Action: roll a number of d10s equal to your rogue level and add 15; if its current hit points are equal to or lower than the total, it falls unconscious for 10 minutes, or until it takes damage or another creature uses an action to wake it."},
      {name:"Unlucky", source:"GHPG", cost:"2", text:"Bonus action: it subtracts 1d4 from its attack rolls and saving throws while it stays marked."}
    ]
  }
];

export var OPTION_SOURCES = {PHB:"Player's Handbook", XGE:"Xanathar's Guide", TCE:"Tasha's Cauldron",
  SCAG:"Sword Coast Adventurer's Guide", GHPG:"Grim Hollow Player's Guide"};

export function optionSetDef(id){
  return OPTION_SETS.find(function(s){ return s.id===id; }) || null;
}
export function optionDef(setId, name){
  var set = optionSetDef(setId);
  return set && set.options.find(function(o){ return o.name===name; }) || null;
}
/* How many of a set are known at a class level (0 before the first). */
export function optionsKnownAt(set, level){
  var n = 0;
  Object.keys(set.known).forEach(function(k){ if(Number(level) >= Number(k)) n = Math.max(n, set.known[k]); });
  return n;
}
/* The class level a set starts at. */
export function optionSetStart(set){
  return Math.min.apply(null, Object.keys(set.known).map(Number));
}
