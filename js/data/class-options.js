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
                level in the class), "never"
     versatility  true when Tasha's optional "Versatility" feature lets
                one be replaced at the class's Ability Score Improvement
                levels (Sorcerous / Martial Versatility); only for
                characters with Tasha's optional features turned on
     help       one plain sentence for the level-up and the card
     options    [{name, source ("PHB"/"TCE"), text, cost (sorcery points,
                Metamagic), save (ability for its saving throw, maneuvers),
                level (class level needed, when gated)}] */
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
      {name:"Seeking Spell", source:"TCE", cost:"2", text:"If you make an attack roll for a spell and miss, reroll the d20 and use the new roll. You can use this even if you already used another Metamagic option on the spell."},
      {name:"Transmuted Spell", source:"TCE", cost:"1", text:"Change a spell's acid, cold, fire, lightning, poison or thunder damage to another of those types."}
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
      {name:"Ambush", source:"TCE", text:"When you make a Dexterity (Stealth) check or an initiative roll, add the superiority die to it, unless you're incapacitated."},
      {name:"Bait and Switch", source:"TCE", text:"On your turn, spend at least 5 feet of movement to swap places with a willing creature within 5 feet (no opportunity attacks); you or it (your choice) adds the superiority die to AC until the start of your next turn."},
      {name:"Brace", source:"TCE", text:"When a creature you can see moves into the reach of the melee weapon you're wielding, use your reaction to make one attack against it with that weapon, adding the superiority die to the damage if it hits."},
      {name:"Commanding Presence", source:"TCE", text:"When you make a Charisma (Intimidation), (Performance) or (Persuasion) check, add the superiority die to it."},
      {name:"Grappling Strike", source:"TCE", text:"Right after you hit a creature with a melee attack on your turn, try to grapple it as a bonus action, adding the superiority die to your Strength (Athletics) check."},
      {name:"Quick Toss", source:"TCE", text:"As a bonus action, make a ranged attack with a thrown weapon (you can draw it as part of the attack), adding the superiority die to the damage if it hits."},
      {name:"Tactical Assessment", source:"TCE", text:"When you make an Intelligence (Investigation), Intelligence (History) or Wisdom (Insight) check, add the superiority die to it."}
    ]
  }
];

export var OPTION_SOURCES = {PHB:"Player's Handbook", TCE:"Tasha's Cauldron"};

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
