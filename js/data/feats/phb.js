/* ---------------- Feats: Player's Handbook ----------------
   The Player's Handbook's 42 feats.
   The fields are explained at the top of ../feats.js. */
export var PHB_FEATS = [
  {
    name: "Alert",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "You gain +5 to initiative and can't be surprised while you are conscious. Creatures you can't see don't gain advantage on attacks against you.",
    description: "Always on the lookout for danger, you gain the following benefits:\n• You gain a +5 bonus to initiative.\n• You can't be surprised while you are conscious.\n• Other creatures don’t gain advantage on attack rolls against you as a result of being unseen by you."
  },
  {
    name: "Athlete",
    source: "PHB",
    ability:["str","dex"],
    prerequisite: "None",
    category: "Physical",
    summary: "Raise Strength or Dexterity by 1. Standing up costs only 5 feet of movement, climbing doesn't slow you, and you need only a 5-foot run-up to jump.",
    description: "You have undergone extensive physical training to gain the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• When you are prone, standing up uses only 5 feet of your movement.\n• Climbing doesn't cost you extra movement.\n• You can make a running long jump or a running high jump after moving only 5 feet on foot."
  },
  {
    name: "Actor",
    source: "PHB",
    ability:["cha"],
    prerequisite: "None",
    category: "Social",
    summary: "Raise Charisma by 1. You have advantage on Deception and Performance checks to pass as someone else, and you can mimic voices and sounds you have heard.",
    description: "Skilled at mimicry and dramatics, you gain the following benefits:\n• Increase your Charisma score by 1, to a maximum of 20.\n• You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person.\n• You can mimic the speech of another person or the sounds made by other creatures that you have heard for at least 1 minute."
  },
  {
    name: "Charger",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "After you Dash, you can use a bonus action to make a melee attack or shove a creature. If you moved 10 feet in a straight line first, you deal 5 extra damage or push the target 10 feet.",
    description: "When you use your action to Dash, you can use a bonus action to make one melee weapon attack or to shove a creature.\nIf you move at least 10 feet in a straight line immediately before taking this bonus action, you either gain a +5 bonus to the attack's damage roll (if you hit with a melee attack) or push the target up to 10 feet away from you (if you succeed on the shove)."
  },
  {
    name: "Crossbow Expert",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "You ignore the loading property of crossbows and have no disadvantage on ranged attacks next to an enemy. After attacking with a one-handed weapon, you can fire a hand crossbow as a bonus action.",
    description: "Thanks to extensive practice with crossbows, you gain the following benefits:\n• You ignore the loading quality of crossbows with which you are proficient.\n• Being within 5 feet of a hostile creature doesn’t impose disadvantage on your ranged attack rolls.\n• When you use the Attack action and attack with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding."
  },
  {
    name: "Defensive Duelist",
    source: "PHB",
    prerequisite: "Dexterity 13 or higher",
    category: "Defense",
    summary: "While you hold a finesse weapon you are proficient with, you can use your reaction to add your proficiency bonus to your AC against one melee attack.",
    description: "When you are wielding a finesse weapon with which you are proficient and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing the attack to miss you."
  },
  {
    name: "Dual Wielder",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "You gain +1 to AC while holding a melee weapon in each hand. You can fight with two weapons that aren't light, and you can draw or stow both at once.",
    description: "You master fighting with two weapons, gaining the following benefits:\n• You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand.\n• You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren’t light.\n• You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one."
  },
  {
    name: "Dungeon Delver",
    source: "PHB",
    prerequisite: "None",
    category: "Utility",
    summary: "You have advantage on checks to find secret doors and on saves against traps, and resistance to trap damage. You can search for traps while travelling at a normal pace.",
    description: "Alert to the hidden traps and secret doors found in dungeons, you gain the following benefits:\n• You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks made to detect the presence of secret doors.\n• You have advantage on saving throws made to avoid or resist traps.\n• You have resistance to the damage dealt by traps.\n• Traveling at a fast pace doesn't impose the normal -5 penalty on your passive Wisdom (Perception) score."
  },
  {
    name: "Durable",
    source: "PHB",
    ability:["con"],
    prerequisite: "None",
    category: "Defense",
    summary: "Raise Constitution by 1. When you roll a Hit Die to regain hit points, you regain at least twice your Constitution modifier.",
    description: "Hardy and resilient, you gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• When you roll a Hit Die to regain hit points, the minimum number of hit points you regain from the roll equals twice your Constitution modifier (minimum of 2)."
  },
  {
    name: "Elemental Adept",
    source: "PHB",
    option: {label: "Damage type", options: ["Acid", "Cold", "Fire", "Lightning", "Thunder"]},
    repeatable: true,
    prerequisite: "The ability to cast at least one spell",
    category: "Magic",
    summary: "Choose acid, cold, fire, lightning or thunder. Your spells ignore resistance to that damage type, and you treat any 1 on their damage dice as a 2.",
    description: "When you gain this feat, choose one damage type: acid, cold, fire, lightning, or thunder.\n• Spells you cast ignore resistance to damage of the chosen type.\n• In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2.\nYou can select this feat multiple times. Each time you do so, you must choose a different damage type."
  },
  {
    name: "Grappler",
    source: "PHB",
    prerequisite: "Strength 13 or higher",
    category: "Combat",
    summary: "You have advantage on attacks against a creature you are grappling. You can use an action to pin it, which restrains both of you.",
    description: "You’ve developed the skills necessary to hold your own in close-quarters grappling:\n• You have advantage on attack rolls against a creature you are grappling.\n• You can use your action to try to pin a creature grappled by you. To do so, make another grapple check. If you succeed, you and the creature are both restrained until the grapple ends."
  },
  {
    name: "Great Weapon Master",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "When you score a critical hit or drop a creature to 0 hit points, you can make a bonus melee attack. With a heavy weapon you can take -5 to hit for +10 damage.",
    description: "You’ve learned to put the weight of a weapon to your advantage:\n• On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action.\n• Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack’s damage."
  },
  {
    name: "Healer",
    source: "PHB",
    prerequisite: "None",
    category: "Support",
    summary: "With a healer's kit you can stabilize a creature and bring it to 1 hit point. You can also use the kit to restore 1d6 + 4 hit points plus the creature's number of Hit Dice, once per creature per rest.",
    description: "You are an able physician, allowing you to mend wounds quickly and get your allies back in the fight:\n• When you use a healer’s kit to stabilize a dying creature, that creature also regains 1 hit point.\n• As an action, you can spend one use of a healer’s kit to tend to a creature and restore 1d6 + 4 hit points to it, plus additional hit points equal to the creature’s maximum number of Hit Dice. The creature can’t regain hit points from this feat again until it finishes a short or long rest."
  },
  {
    name: "Heavily Armored",
    source: "PHB",
    ability:["str"], armor:["Heavy armor"],
    prerequisite: "Proficiency with medium armor",
    category: "Defense",
    summary: "Raise Strength by 1. You gain proficiency with heavy armor.",
    description: "You have trained to master the use of heavy armor, gaining the following benefits:\n• Increase your Strength score by 1, to a maximum of 20.\n• You gain proficiency with heavy armor."
  },
  {
    name: "Heavy Armor Master",
    source: "PHB",
    ability:["str"],
    prerequisite: "Proficiency with heavy armor",
    category: "Defense",
    summary: "Raise Strength by 1. While you wear heavy armor, nonmagical bludgeoning, piercing and slashing damage you take is reduced by 3.",
    description: "You can use your armor to deflect strikes that would kill others:\n• Increase your Strength score by 1, to a maximum of 20.\n• While you are wearing heavy armor, bludgeoning, piercing, and slashing damage that you take from nonmagical attacks is reduced by 3."
  },
  {
    name: "Inspiring Leader",
    source: "PHB",
    prerequisite: "Charisma 13 or higher",
    category: "Support",
    summary: "Spend 10 minutes inspiring up to six creatures, yourself included. Each gains temporary hit points equal to your level + your Charisma modifier, once per rest.",
    description: "You can spend 10 minutes inspiring your companions, shoring up their resolve to fight. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you who can see or hear you and who can understand you. Each creature gains temporary hit points equal to your level + your Charisma modifier. A creature can't gain temporary hit points from this feat again until it has finished a short or long rest."
  },
  {
    name: "Keen Mind",
    source: "PHB",
    ability:["int"],
    prerequisite: "None",
    category: "Utility",
    summary: "Raise Intelligence by 1. You always know which way is north and how long until sunrise or sunset, and you can recall anything you saw or heard in the past month.",
    description: "You have a mind that can track time, direction, and detail with uncanny precision:\n• Increase your Intelligence score by 1, to a maximum of 20.\n• You always know which way is north.\n• You always know the number of hours left before the next sunrise or sunset.\n• You can accurately recall anything you have seen or heard within the past month."
  },
  {
    name: "Lightly Armored",
    source: "PHB",
    ability:["str","dex"], armor:["Light armor"],
    prerequisite: "None",
    category: "Defense",
    summary: "Raise Strength or Dexterity by 1. You gain proficiency with light armor.",
    description: "You have trained to master the use of light armor, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with light armor."
  },
  {
    name: "Lucky",
    source: "PHB",
    prerequisite: "None",
    category: "General",
    summary: "You have 3 luck points per long rest. Spend one to roll an extra d20 on an attack roll, ability check or saving throw, or on an attack against you, and choose which die counts.",
    description: "You have inexplicable luck that seems to kick in at just the right moment:\n• You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20 and choose which d20 to use.\n• You can also spend one luck point when an attack roll is made against you to roll a d20 and choose whether the attack uses the attacker’s roll or yours.\n• You regain your expended luck points when you finish a long rest."
  },
  {
    name: "Mage Slayer",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "You can use your reaction to attack a creature within 5 feet that casts a spell. Creatures you damage have disadvantage on concentration saves, and you have advantage on saves against spells cast within 5 feet of you.",
    description: "You have practiced techniques useful in melee combat against spellcasters:\n• When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee weapon attack against that creature.\n• When you damage a creature that is concentrating on a spell, that creature has disadvantage on the saving throw it makes to maintain its concentration.\n• You have advantage on saving throws against spells cast by creatures within 5 feet of you."
  },
  {
    name: "Magic Initiate",
    source: "PHB",
    option:{label:"Class", options:["Bard","Cleric","Druid","Sorcerer","Warlock","Wizard"]},
    castAbilityByOption:{"Bard":"cha", "Cleric":"wis", "Druid":"wis", "Sorcerer":"cha", "Warlock":"cha", "Wizard":"int"},
    spellPick:[
      {count:2, level:0, label:"cantrip from that class's list", plural:"cantrips from that class's list", byOption:{
        "Bard":{list:"Bard"}, "Cleric":{list:"Cleric"}, "Druid":{list:"Druid"}, "Sorcerer":{list:"Sorcerer"}, "Warlock":{list:"Warlock"}, "Wizard":{list:"Wizard"}}},
      {count:1, level:1, label:"1st-level spell from that class's list", use:"once", byOption:{
        "Bard":{list:"Bard"}, "Cleric":{list:"Cleric"}, "Druid":{list:"Druid"}, "Sorcerer":{list:"Sorcerer"}, "Warlock":{list:"Warlock"}, "Wizard":{list:"Wizard"}}}
    ],
    prerequisite: "None",
    category: "Magic",
    summary: "Choose a spellcasting class. You learn two of its cantrips and one of its 1st-level spells, which you can cast once per long rest.",
    description: "Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard.\n• You learn two cantrips of your choice from that class’s spell list.\n• In addition, choose one 1st-level spell from that same list. You learn that spell and can cast it at its lowest level. Once you cast it, you must finish a long rest before you can cast it again using this feat.\n• Your spellcasting ability for these spells depends on the class you chose: Charisma for bard, sorcerer or warlock, Wisdom for cleric or druid, and Intelligence for wizard."
  },
  {
    name: "Martial Adept",
    source: "PHB",
    optionPicks:{set:"maneuvers", count:2},
    prerequisite: "None",
    category: "Combat",
    summary: "You learn two Battle Master maneuvers and gain one superiority die, a d6, to fuel them. You regain it on a short or long rest.",
    description: "You have martial training that allows you to perform special combat maneuvers:\n• You learn two maneuvers of your choice from among those available to the Battle Master archetype in the fighter class.\n• You gain one superiority die, which is a d6 (used to fuel your maneuvers). You regain your expended superiority die when you finish a short or long rest.\n• If a maneuver you use requires a saving throw, the DC equals 8 + your proficiency bonus + your Strength or Dexterity modifier (your choice)."
  },
  {
    name: "Medium Armor Master",
    source: "PHB",
    prerequisite: "Proficiency with medium armor",
    category: "Defense",
    summary: "Medium armor doesn't give you disadvantage on Stealth checks, and you can add up to 3 from your Dexterity modifier to your AC instead of 2.",
    description: "You have practiced moving in medium armor to gain the following benefits:\n• Wearing medium armor doesn’t impose disadvantage on your Dexterity (Stealth) checks.\n• When you wear medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity of 16 or higher."
  },
  {
    name: "Mobile",
    source: "PHB",
    prerequisite: "None",
    category: "Movement",
    summary: "Your speed increases by 10 feet, and difficult terrain doesn't slow your Dash. A creature you make a melee attack against can't make opportunity attacks against you that turn.",
    description: "You are exceptionally speedy and agile:\n• Your speed increases by 10 feet.\n• When you use the Dash action, difficult terrain doesn’t cost you extra movement on that turn.\n• When you make a melee attack against a creature, you don’t provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not."
  },
  {
    name: "Moderately Armored",
    source: "PHB",
    ability:["str","dex"], armor:["Medium armor","Shields"],
    prerequisite: "Proficiency with light armor",
    category: "Defense",
    summary: "Raise Strength or Dexterity by 1. You gain proficiency with medium armor and shields.",
    description: "You have trained to master the use of medium armor and shields, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with medium armor and shields."
  },
  {
    name: "Mounted Combatant",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "While mounted, you have advantage on melee attacks against unmounted creatures smaller than your mount. You can take a hit aimed at your mount, and your mount avoids damage on a successful Dexterity save.",
    description: "You are a dangerous foe to face while mounted:\n• You have advantage on melee attack rolls against any unmounted creature that is smaller than your mount.\n• You can force an attack targeted at your mount to target you instead.\n• If your mount is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, it instead takes no damage if it succeeds on the saving throw, and only half damage if it fails."
  },
  {
    name: "Observant",
    source: "PHB",
    ability:["int","wis"],
    prerequisite: "None",
    category: "Utility",
    summary: "Raise Intelligence or Wisdom by 1. You can read lips, and you gain +5 to passive Perception and passive Investigation.",
    description: "Quick to notice details of your environment, you gain the following benefits:\n• Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n• If you can see a creature’s mouth while it speaks a language you understand, you can interpret what it’s saying by reading its lips.\n• You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores."
  },
  {
    name: "Polearm Master",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "When you attack with a glaive, halberd, quarterstaff or spear, you can use a bonus action to strike with its other end for 1d4 damage. Creatures provoke an opportunity attack when they enter your reach.",
    description: "You can keep your enemies at bay with reach weapons:\n• When you take the Attack action and attack with only a glaive, halberd, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon. This attack uses the same ability modifier as the primary attack. Its damage die is a d4, and it deals bludgeoning damage.\n• While you are wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter the reach you have with that weapon."
  },
  {
    name: "Resilient",
    source: "PHB",
    ability:["str","dex","con","int","wis","cha"], saveProf:true,
    prerequisite: "None",
    category: "Defense",
    summary: "Raise one ability score by 1 and gain proficiency in saving throws with that ability.",
    description: "Choose one ability score. You gain the following benefits:\n• Increase the chosen ability score by 1, to a maximum of 20.\n• You gain proficiency in saving throws using the chosen ability."
  },
  {
    name: "Ritual Caster",
    source: "PHB",
    option:{label:"Spell list", options:["Bard","Cleric","Druid","Sorcerer","Warlock","Wizard"]},
    castAbilityByOption:{"Bard":"cha", "Cleric":"wis", "Druid":"wis", "Sorcerer":"cha", "Warlock":"cha", "Wizard":"int"},
    spellPick:[
      {count:2, level:1, ritual:true, use:"ritual", label:"1st-level ritual spell from that list", plural:"1st-level ritual spells from that list", byOption:
        ["Bard","Cleric","Druid","Sorcerer","Warlock","Wizard"].reduce(function(o, cls){ o[cls] = {list:cls}; return o; }, {})}
    ],
    prerequisite: "Intelligence or Wisdom 13 or higher",
    category: "Magic",
    summary: "You gain a ritual book with two 1st-level ritual spells from one class's list. You can cast them as rituals and copy other ritual spells you find into the book.",
    description: "You have learned a number of spells that you can cast as rituals. Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard.\n• You acquire a ritual book holding two 1st-level spells of your choice that have the ritual tag from that class’s spell list.\n• You can cast these spells as rituals. If you come across a spell in written form, you might be able to add it to your ritual book."
  },
  {
    name: "Savage Attacker",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "Once per turn when you roll damage for a melee weapon attack, you can roll the damage dice again and use either total.",
    description: "Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon’s damage dice and use either total."
  },
  {
    name: "Sentinel",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "Your opportunity attacks stop the target's movement, and creatures provoke them even after Disengaging. You can use your reaction to attack a creature within 5 feet that attacks someone other than you.",
    description: "You have mastered techniques to take advantage of every drop in any enemy's guard:\n• When you hit a creature with an opportunity attack, the creature’s speed becomes 0 for the rest of the turn.\n• Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach.\n• When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn’t have this feat), you can use your reaction to make a melee weapon attack against the attacking creature."
  },
  {
    name: "Sharpshooter",
    source: "PHB",
    prerequisite: "None",
    category: "Combat",
    summary: "Long range doesn't give you disadvantage, and your ranged weapon attacks ignore half and three-quarters cover. You can take -5 to hit for +10 damage.",
    description: "You have mastered ranged weapons and can make shots that others find impossible:\n• Attacking at long range doesn't impose disadvantage on your ranged weapon attack rolls.\n• Your ranged weapon attacks ignore half cover and three-quarters cover.\n• Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack’s damage."
  },
  {
    name: "Shield Master",
    source: "PHB",
    prerequisite: "None",
    category: "Defense",
    summary: "After you take the Attack action, you can use a bonus action to shove with your shield. You add the shield's AC bonus to Dexterity saves against effects that target only you, and you can use your reaction to take no damage on a successful save.",
    description: "You use shields not just for protection but also for offense:\n• If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet of you with your shield.\n• If you aren’t incapacitated, you can add your shield’s AC bonus to any Dexterity saving throw you make against a spell or other harmful effect that targets only you.\n• If you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you can use your reaction to take no damage if you succeed on the saving throw."
  },
  {
    name: "Skilled",
    source: "PHB",
    skillsOrTools:3,
    prerequisite: "None",
    category: "Utility",
    summary: "You gain proficiency in any three skills or tools of your choice.",
    description: "You have exceptionally broad training:\n• You gain proficiency in any combination of three skills or tools of your choice."
  },
  {
    name: "Skulker",
    source: "PHB",
    prerequisite: "Dexterity 13 or higher",
    category: "Utility",
    summary: "You can hide when you are only lightly obscured. Missing with a ranged attack doesn't reveal you, and dim light doesn't give you disadvantage on Perception checks that rely on sight.",
    description: "You are expert at slinking through shadows:\n• You can try to hide when you are lightly obscured from the creature from which you are hiding.\n• When you are hidden from a creature and miss it with a ranged weapon attack, making the attack doesn't reveal your position.\n• Dim light doesn’t impose disadvantage on your Wisdom (Perception) checks relying on sight."
  },
  {
    name: "Spell Sniper",
    source: "PHB",
    // Bard and cleric have no attack-roll cantrip, so only these lists are offered.
    option:{label:"Spell list", options:["Druid","Sorcerer","Warlock","Wizard"]},
    castAbilityByOption:{"Druid":"wis", "Sorcerer":"cha", "Warlock":"cha", "Wizard":"int"},
    spellPick:[
      {count:1, level:0, label:"attack-roll cantrip from that list", plural:"attack-roll cantrips from that list", byOption:
        ["Druid","Sorcerer","Warlock","Wizard"].reduce(function(o, cls){
          o[cls] = {list:cls, names:["Booming Blade","Chill Touch","Eldritch Blast","Fire Bolt","Green-Flame Blade","Magic Stone","Primal Savagery","Produce Flame","Ray of Frost","Shocking Grasp","Thorn Whip"]};
          return o;
        }, {})}
    ],
    prerequisite: "The ability to cast at least one spell",
    category: "Magic",
    summary: "Your spells that need an attack roll have double range and ignore half and three-quarters cover. You learn one cantrip that requires an attack roll.",
    description: "You have mastered spells that require attack rolls:\n• When you cast a spell that requires you to make an attack roll, the spell’s range is doubled.\n• Your ranged spell attacks ignore half cover and three-quarters cover.\n• You learn one cantrip that requires an attack roll. Choose it from the bard, cleric, druid, sorcerer, warlock, or wizard spell list. Your spellcasting ability for it depends on the list you chose from: Charisma for bard, sorcerer or warlock, Wisdom for cleric or druid, and Intelligence for wizard."
  },
  {
    name: "Tavern Brawler",
    source: "PHB",
    ability:["str","con"],
    prerequisite: "None",
    category: "Combat",
    summary: "Raise Strength or Constitution by 1. You are proficient with improvised weapons, your unarmed strikes deal 1d4 damage, and you can grapple as a bonus action after hitting with either.",
    description: "Accustomed to rough-and-tumble fighting using whatever weapons happen to be at hand, you gain the following benefits:\n• Increase your Strength or Constitution score by 1, to a maximum of 20.\n• You are proficient with improvised weapons.\n• Your unarmed strike uses a d4 for damage.\n• When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target."
  },
  {
    name: "Tough",
    source: "PHB",
    prerequisite: "None",
    category: "Defense",
    summary: "Your hit point maximum increases by 2 for every level you have and every level you gain.",
    description: "Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points."
  },
  {
    name: "War Caster",
    source: "PHB",
    prerequisite: "The ability to cast at least one spell",
    category: "Magic",
    summary: "You have advantage on saves to keep concentration when you take damage. You can cast spells with weapons or a shield in your hands, and you can cast a spell instead of making an opportunity attack.",
    description: "You have practiced casting spells in the midst of combat:\n• You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage.\n• You can perform the somatic components of spells even when you have weapons or a shield in one or both hands.\n• When a hostile creature’s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack."
  },
  {
    name: "Weapon Master",
    source: "PHB",
    ability:["str","dex"], weapons:4,
    prerequisite: "None",
    category: "Combat",
    summary: "Raise Strength or Dexterity by 1. You gain proficiency with four weapons of your choice.",
    description: "You have practiced extensively with a variety of weapons, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with four weapons of your choice."
  },
  {
    name: "Linguist",
    source: "PHB",
    ability:["int"], languagePicks:3,
    prerequisite: "None",
    category: "Utility",
    summary: "Raise Intelligence by 1. You learn three languages and can write ciphers that only you and those you teach can read.",
    description: "You have studied languages and codes, gaining the following benefits:\n• Increase your Intelligence score by 1, to a maximum of 20.\n• You learn three languages of your choice.\n• You can create written ciphers. Others can't decipher a code you create unless you teach them, they succeed on an Intelligence check (DC equal to your Intelligence score + your proficiency bonus), or they use magic to decipher it."
  }
];
