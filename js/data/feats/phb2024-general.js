/* ---------------- Feats: Player's Handbook (2024), the rest ----------------
   The General, Fighting Style and Epic Boon feats of the 2024 Player's
   Handbook's chapter 5 (pages 202-211, checked against the printed book
   in books/ on 2026-11-05). The Origin feats are in ./phb2024.js.
   Offered only to a character on the 2024 rules (featOffered, by their
   source "XPHB"); the Compendium lists them all.
   A feat that shares its name with an older one carries " (2024)". The
   book's own Ability Score Improvement feat is the level-up's ASI choice.
   `book2024`: the book's category ("General", "Fighting Style", "Epic
   Boon"). Every General feat needs level 4 and every Epic Boon level 19
   (`requires.level`); the rest of a prerequisite is `requires` too:
     scores        any one of these abilities at 13 or more
     spellcasting  the Spellcasting or Pact Magic feature
     armor         training with "light", "medium" or "heavy" armor, or a "shield"
     style         the Fighting Style feature
   Fields new with these feats (the rest are explained in ../feats.js):
     orExpertise   a `skills` pick already proficient gets expertise
                   instead (Keen Mind, Observant)
     allSkills     proficiency in every skill (Boon of Skill)
     damagePicks   {count, options}: damage types to resist (Boon of
                   Energy Resistance), kept in picks.options
     abilityMax    the +1 can go past 20, to this (an Epic Boon's 30)
     style         the fighting style it gives, as a style feature
                   (`styleText` and `styleRemind` its 2024 wording)
     speeds        [{type, value}] like class features' ("walk": equal to
                   the walking speed)
     sense         a sense line ("Blindsight 10 ft")
     hp            hit points added to the maximum (Boon of Fortitude)
     deathSaveAdvantage  advantage on death saving throws (Durable)
     masteryPick   its `option` is a weapon kind whose mastery property
                   the character can use (Weapon Master) */
import { WEAPON_MASTERY } from "../weapon-mastery.js";

var ALL = ["str","dex","con","int","wis","cha"];
var MENTAL = ["int","wis","cha"];
var PHYSICAL = ["str","dex"];
var GENERAL = {level: 4};
function gen(more){ return Object.assign({level: 4}, more || {}); }
// Weapon Master's kinds: every weapon with a mastery property (p. 215).
var WEAPON_KINDS = Object.keys(WEAPON_MASTERY).sort();
var DAMAGE_TYPES = ["Acid","Cold","Fire","Lightning","Necrotic","Poison","Psychic","Radiant","Thunder"];

function feat(name, o){
  return Object.assign({name: name, source: "XPHB", book2024: "General"}, o);
}
function style(name, text, remind){
  var o = {name: name, source: "XPHB", book2024: "Fighting Style", style: name, styleText: text,
    requires: {style: true}, prerequisite: "Fighting Style feature", category: "Combat", summary: text,
    description: text};
  if(remind) o.styleRemind = remind;
  return o;
}
function boon(name, o){
  return Object.assign({name: name, source: "XPHB", book2024: "Epic Boon", ability: ALL, abilityMax: 30,
    requires: {level: 19}, prerequisite: "Level 19+", category: "General"}, o);
}

export var PHB_2024_GENERAL_FEATS = [
  feat("Actor (2024)", {ability: ["cha"], requires: gen({scores: ["cha"]}), prerequisite: "Level 4+, Charisma 13+", category: "Social",
    advantage: {on: "skill", skills: ["Deception", "Performance"], when: "while disguised, to pass as that person"},
    summary: "Raise Charisma by 1. While disguised you have advantage on Deception and Performance checks to pass as that person, and you can mimic voices and sounds.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Charisma score by 1, to a maximum of 20.\n• Impersonation. While you're disguised as a real or fictional person, you have Advantage on Charisma (Deception or Performance) checks to convince others that you are that person.\n• Mimicry. You can mimic the sounds of other creatures, including speech. A creature that hears the mimicry must succeed on a Wisdom (Insight) check to determine the effect is faked (DC 8 plus your Charisma modifier and Proficiency Bonus)."}),
  feat("Athlete (2024)", {ability: PHYSICAL, requires: gen({scores: PHYSICAL}), prerequisite: "Level 4+, Strength or Dexterity 13+", category: "Movement",
    speeds: [{type: "climb", value: "walk"}],
    remind: {when: "always", line: "Stand up from prone with 5 feet of movement. Running jumps need only 5 feet"},
    summary: "Raise Strength or Dexterity by 1. You gain a climb speed equal to your speed, stand up with 5 feet of movement, and make running jumps after 5 feet.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Climb Speed. You gain a Climb Speed equal to your Speed.\n• Hop Up. When you have the Prone condition, you can right yourself with only 5 feet of movement.\n• Jumping. You can make a running Long or High Jump after moving only 5 feet."}),
  feat("Charger (2024)", {ability: PHYSICAL, requires: gen({scores: PHYSICAL}), prerequisite: "Level 4+, Strength or Dexterity 13+", category: "Combat",
    remind: {when: "always", line: "Dash: 10 ft more. After 10 ft straight, a melee hit adds 1d8 or a 10 ft push"},
    summary: "Raise Strength or Dexterity by 1. Your Dash goes 10 feet further, and once a turn a melee hit after a 10-foot run deals 1d8 more damage or pushes the target 10 feet.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Improved Dash. When you take the Dash action, your Speed increases by 10 feet for that action.\n• Charge Attack. If you move at least 10 feet in a straight line toward a target immediately before hitting it with a melee attack roll as part of the Attack action, choose one of the following effects: gain a 1d8 bonus to the attack's damage roll, or push the target up to 10 feet away if it is no more than one size larger than you. You can use this benefit only once on each of your turns."}),
  feat("Chef (2024)", {ability: ["con","wis"], tools: ["Cook's utensils"], requires: GENERAL, prerequisite: "Level 4+", category: "Support",
    summary: "Raise Constitution or Wisdom by 1. Proficiency with cook's utensils. Your food heals an extra 1d8 on a short rest, and your treats give temporary hit points.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Constitution or Wisdom score by 1, to a maximum of 20.\n• Cook's Utensils. You gain proficiency with Cook's Utensils if you don't already have it.\n• Replenishing Meal. As part of a Short Rest, you can cook special food if you have ingredients and Cook's Utensils on hand. You can prepare enough of this food for a number of creatures equal to 4 plus your Proficiency Bonus. At the end of the Short Rest, any creature who eats the food and spends one or more Hit Dice to regain Hit Points regains an extra 1d8 Hit Points.\n• Bolstering Treats. With 1 hour of work or when you finish a Long Rest, you can cook a number of treats equal to your Proficiency Bonus if you have ingredients and Cook's Utensils on hand. These special treats last 8 hours after being made. A creature can use a Bonus Action to eat one of those treats to gain a number of Temporary Hit Points equal to your Proficiency Bonus."}),
  feat("Crossbow Expert (2024)", {ability: ["dex"], requires: gen({scores: ["dex"]}), prerequisite: "Level 4+, Dexterity 13+", category: "Combat",
    remind: {when: "always", line: "Crossbows: no loading, and an enemy within 5 feet gives no disadvantage"},
    summary: "Raise Dexterity by 1. You ignore the loading property of crossbows, being next to an enemy doesn't give your crossbow attacks disadvantage, and a light crossbow's extra attack adds your modifier.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n• Ignore Loading. You ignore the Loading property of the Hand Crossbow, Heavy Crossbow, and Light Crossbow (all called crossbows elsewhere in this feat). If you're holding one of them, you can load a piece of ammunition into it even if you lack a free hand.\n• Firing in Melee. Being within 5 feet of an enemy doesn't impose Disadvantage on your attack rolls with crossbows.\n• Dual Wielding. When you make the extra attack of the Light property, you can add your ability modifier to the damage of the extra attack if that attack is with a crossbow that has the Light property and you aren't already adding that modifier to the damage."}),
  feat("Crusher (2024)", {ability: ["str","con"], requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    remind: {when: "always", line: "Once a turn, a bludgeoning hit pushes 5 feet. A critical gives allies advantage"},
    summary: "Raise Strength or Constitution by 1. Once a turn a bludgeoning hit can move the target 5 feet, and a bludgeoning critical hit gives attacks against it advantage until your next turn.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Constitution score by 1, to a maximum of 20.\n• Push. Once per turn, when you hit a creature with an attack that deals Bludgeoning damage, you can move it 5 feet to an unoccupied space if the target is no more than one size larger than you.\n• Enhanced Critical. When you score a Critical Hit that deals Bludgeoning damage to a creature, attack rolls against that creature have Advantage until the start of your next turn."}),
  feat("Defensive Duelist (2024)", {ability: ["dex"], requires: gen({scores: ["dex"]}), prerequisite: "Level 4+, Dexterity 13+", category: "Defense",
    remind: {when: "reaction", line: "Holding a finesse weapon, add your proficiency bonus to AC against a melee hit"},
    summary: "Raise Dexterity by 1. Holding a finesse weapon, you can use your reaction when a melee attack hits you to add your proficiency bonus to your AC until your next turn.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n• Parry. If you're holding a Finesse weapon and another creature hits you with a melee attack, you can take a Reaction to add your Proficiency Bonus to your Armor Class, potentially causing the attack to miss you. You gain this bonus to your AC against melee attacks until the start of your next turn."}),
  feat("Dual Wielder (2024)", {ability: PHYSICAL, requires: gen({scores: PHYSICAL}), prerequisite: "Level 4+, Strength or Dexterity 13+", category: "Combat",
    summary: "Raise Strength or Dexterity by 1. After attacking with a light weapon, your bonus action attack can be with any one-handed melee weapon, and you draw or stow two weapons at once.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Enhanced Dual Wielding. When you take the Attack action on your turn and attack with a weapon that has the Light property, you can make one extra attack as a Bonus Action later on the same turn with a different weapon, which must be a Melee weapon that lacks the Two-Handed property. You don't add your ability modifier to the extra attack's damage unless that modifier is negative.\n• Quick Draw. You can draw or stow two weapons that lack the Two-Handed property when you would normally be able to draw or stow only one."}),
  feat("Durable (2024)", {ability: ["con"], requires: GENERAL, prerequisite: "Level 4+", category: "Defense", deathSaveAdvantage: true,
    remind: {when: "bonus", line: "Spend one of your Hit Point Dice and regain the hit points you roll"},
    summary: "Raise Constitution by 1. You have advantage on death saving throws, and as a bonus action you can spend a Hit Die to heal.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Constitution score by 1, to a maximum of 20.\n• Defy Death. You have Advantage on Death Saving Throws.\n• Speedy Recovery. As a Bonus Action, you can expend one of your Hit Point Dice, roll the die, and regain a number of Hit Points equal to the roll."}),
  feat("Elemental Adept (2024)", {ability: MENTAL, option: {label: "Damage type", options: ["Acid", "Cold", "Fire", "Lightning", "Thunder"]}, repeatable: true,
    requires: gen({spellcasting: true}), prerequisite: "Level 4+, Spellcasting or Pact Magic feature", category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. Choose acid, cold, fire, lightning or thunder: your spells ignore resistance to it, and a 1 on their damage dice counts as a 2.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Energy Mastery. Choose one of the following damage types: Acid, Cold, Fire, Lightning, or Thunder. Spells you cast ignore Resistance to damage of the chosen type. In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2.\n• Repeatable. You can take this feat more than once, but you must choose a different damage type each time for Energy Mastery."}),
  feat("Fey Touched (2024)", {ability: MENTAL, grantsSpells: ["Misty Step"],
    spellPick: {count: 1, level: 1, schools: ["Divination", "Enchantment"], label: "level 1 divination or enchantment spell"},
    requires: GENERAL, prerequisite: "Level 4+", category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You always have Misty Step and one level 1 divination or enchantment spell prepared, each free once per long rest.",
    description: "Your exposure to the Feywild's magic grants you the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Fey Magic. Choose one level 1 spell from the Divination or Enchantment school of magic. You always have that spell and the Misty Step spell prepared. You can cast each of these spells without expending a spell slot. Once you cast either spell in this way, you can't cast that spell in this way again until you finish a Long Rest. You can also cast these spells using spell slots you have of the appropriate level. The spells' spellcasting ability is the ability increased by this feat."}),
  feat("Grappler (2024)", {ability: PHYSICAL, requires: gen({scores: PHYSICAL}), prerequisite: "Level 4+, Strength or Dexterity 13+", category: "Combat",
    remind: {when: "always", line: "Advantage on attacks against a creature you're grappling. Once a turn, hit and grab"},
    summary: "Raise Strength or Dexterity by 1. Once a turn an unarmed hit can both deal damage and grapple, you have advantage on attacks against a creature you grapple, and moving it doesn't slow you.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Punch and Grab. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can use both the Damage and the Grapple option. You can use this benefit only once per turn.\n• Attack Advantage. You have Advantage on attack rolls against a creature Grappled by you.\n• Fast Wrestler. Your Speed isn't halved when you move a creature Grappled by you if the creature is your size or smaller."}),
  feat("Great Weapon Master (2024)", {ability: ["str"], requires: gen({scores: ["str"]}), prerequisite: "Level 4+, Strength 13+", category: "Combat",
    remind: {when: "bonus", line: "After a melee critical hit or a kill, one more attack with the same weapon"},
    summary: "Raise Strength by 1. A hit with a heavy weapon in the Attack action deals extra damage equal to your proficiency bonus, and a melee critical hit or kill earns a bonus action attack.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength score by 1, to a maximum of 20.\n• Heavy Weapon Mastery. When you hit a creature with a weapon that has the Heavy property as part of the Attack action on your turn, you can cause the weapon to deal extra damage to the target. The extra damage equals your Proficiency Bonus.\n• Hew. Immediately after you score a Critical Hit with a Melee weapon or reduce a creature to 0 Hit Points with one, you can make one attack with the same weapon as a Bonus Action."}),
  feat("Heavily Armored (2024)", {ability: ["con","str"], armor: ["Heavy armor"], requires: gen({armor: "medium"}), prerequisite: "Level 4+, Medium armor training", category: "Defense",
    summary: "Raise Constitution or Strength by 1. You gain training with heavy armor.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Constitution or Strength score by 1, to a maximum of 20.\n• Armor Training. You gain training with Heavy armor."}),
  feat("Heavy Armor Master (2024)", {ability: ["con","str"], requires: gen({armor: "heavy"}), prerequisite: "Level 4+, Heavy armor training", category: "Defense",
    summary: "Raise Constitution or Strength by 1. In heavy armor, bludgeoning, piercing and slashing damage from an attack that hits you is reduced by your proficiency bonus.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Constitution or Strength score by 1, to a maximum of 20.\n• Damage Reduction. When you're hit by an attack while you're wearing Heavy armor, any Bludgeoning, Piercing, and Slashing damage dealt to you by that attack is reduced by an amount equal to your Proficiency Bonus."}),
  feat("Inspiring Leader (2024)", {ability: ["wis","cha"], requires: gen({scores: ["wis","cha"]}), prerequisite: "Level 4+, Wisdom or Charisma 13+", category: "Support",
    remind: {when: "always", line: "After a short or long rest, a speech gives six allies temporary hit points"},
    summary: "Raise Wisdom or Charisma by 1. After a short or long rest, up to six allies (you too) gain temporary hit points equal to your level plus that ability's modifier.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Wisdom or Charisma score by 1, to a maximum of 20.\n• Bolstering Performance. When you finish a Short or Long Rest, you can give an inspiring performance: a speech, song, or dance. When you do so, choose up to six allies (which can include yourself) within 30 feet of yourself who witness the performance. The chosen creatures each gain Temporary Hit Points equal to your character level plus the modifier of the ability you increased with this feat."}),
  feat("Keen Mind (2024)", {ability: ["int"], skills: 1, skillOptions: ["Arcana", "History", "Investigation", "Nature", "Religion"], orExpertise: true,
    requires: gen({scores: ["int"]}), prerequisite: "Level 4+, Intelligence 13+", category: "Utility",
    remind: {when: "bonus", line: "Take the Study action"},
    summary: "Raise Intelligence by 1. Proficiency in Arcana, History, Investigation, Nature or Religion (expertise if you have it already), and you can Study as a bonus action.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence score by 1, to a maximum of 20.\n• Lore Knowledge. Choose one of the following skills: Arcana, History, Investigation, Nature, or Religion. If you lack proficiency in the chosen skill, you gain proficiency in it, and if you already have proficiency in it, you gain Expertise in it.\n• Quick Study. You can take the Study action as a Bonus Action."}),
  feat("Lightly Armored (2024)", {ability: PHYSICAL, armor: ["Light armor", "Shields"], requires: GENERAL, prerequisite: "Level 4+", category: "Defense",
    summary: "Raise Strength or Dexterity by 1. You gain training with light armor and shields.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Armor Training. You gain training with Light armor and Shields."}),
  feat("Mage Slayer (2024)", {ability: PHYSICAL, requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    remind: {when: "always", line: "A creature you damage has disadvantage on its save to keep concentrating"},
    summary: "Raise Strength or Dexterity by 1. Creatures you damage have disadvantage on concentration saves, and once per short rest you can turn a failed Intelligence, Wisdom or Charisma save into a success.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Concentration Breaker. When you damage a creature that is concentrating, it has Disadvantage on the saving throw it makes to maintain Concentration.\n• Guarded Mind. If you fail an Intelligence, a Wisdom, or a Charisma saving throw, you can cause yourself to succeed instead. Once you use this benefit, you can't use it again until you finish a Short or Long Rest."}),
  feat("Martial Weapon Training", {ability: PHYSICAL, weaponProfs: ["Martial weapons"], requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    summary: "Raise Strength or Dexterity by 1. You gain proficiency with martial weapons.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Weapon Proficiency. You gain proficiency with Martial weapons."}),
  feat("Medium Armor Master (2024)", {ability: PHYSICAL, requires: gen({armor: "medium"}), prerequisite: "Level 4+, Medium armor training", category: "Defense",
    summary: "Raise Strength or Dexterity by 1. In medium armor with Dexterity 16 or more, you add 3 to your AC rather than 2.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Dexterous Wearer. While you're wearing Medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity score of 16 or higher."}),
  feat("Moderately Armored (2024)", {ability: PHYSICAL, armor: ["Medium armor"], requires: gen({armor: "light"}), prerequisite: "Level 4+, Light armor training", category: "Defense",
    summary: "Raise Strength or Dexterity by 1. You gain training with medium armor.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Armor Training. You gain training with Medium armor."}),
  feat("Mounted Combatant (2024)", {ability: ["str","dex","wis"], requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    remind: {when: "always", line: "Mounted: advantage on smaller unmounted foes next to your mount. Take its hits"},
    summary: "Raise Strength, Dexterity or Wisdom by 1. Mounted, you have advantage against smaller unmounted creatures near your mount, it takes no damage on a successful Dexterity save, and you can take hits meant for it.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength, Dexterity, or Wisdom score by 1, to a maximum of 20.\n• Mounted Strike. While mounted, you have Advantage on attack rolls against any unmounted creature within 5 feet of your mount that is at least one size smaller than the mount.\n• Leap Aside. If your mount is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, it instead takes no damage if it succeeds on the saving throw and only half damage if it fails. For your mount to gain this benefit, you must be riding it, and neither of you can have the Incapacitated condition.\n• Veer. While mounted, you can force an attack that hits your mount to hit you instead if you don't have the Incapacitated condition."}),
  feat("Observant (2024)", {ability: ["int","wis"], skills: 1, skillOptions: ["Insight", "Investigation", "Perception"], orExpertise: true,
    requires: gen({scores: ["int","wis"]}), prerequisite: "Level 4+, Intelligence or Wisdom 13+", category: "Utility",
    remind: {when: "bonus", line: "Take the Search action"},
    summary: "Raise Intelligence or Wisdom by 1. Proficiency in Insight, Investigation or Perception (expertise if you have it already), and you can Search as a bonus action.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n• Keen Observer. Choose one of the following skills: Insight, Investigation, or Perception. If you lack proficiency with the chosen skill, you gain proficiency in it, and if you already have proficiency in it, you gain Expertise in it.\n• Quick Search. You can take the Search action as a Bonus Action."}),
  feat("Piercer (2024)", {ability: PHYSICAL, requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    remind: {when: "always", line: "Once a turn, reroll one piercing damage die. A critical rolls one more die"},
    summary: "Raise Strength or Dexterity by 1. Once a turn you can reroll one damage die of a piercing hit, and a piercing critical hit rolls one extra damage die.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Puncture. Once per turn, when you hit a creature with an attack that deals Piercing damage, you can reroll one of the attack's damage dice, and you must use the new roll.\n• Enhanced Critical. When you score a Critical Hit that deals Piercing damage to a creature, you can roll one additional damage die when determining the extra Piercing damage the target takes."}),
  feat("Poisoner (2024)", {ability: ["dex","int"], tools: ["Poisoner's kit"], requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    remind: {when: "bonus", line: "Coat a weapon or a piece of ammunition with a dose of your poison"},
    summary: "Raise Dexterity or Intelligence by 1. Your poison damage ignores resistance, and you brew doses that deal 2d8 poison and poison a creature that fails a Constitution save.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Dexterity or Intelligence score by 1, to a maximum of 20.\n• Potent Poison. When you make a damage roll that deals Poison damage, it ignores Resistance to Poison damage.\n• Brew Poison. You gain proficiency with the Poisoner's Kit. With 1 hour of work using such a kit and expending 50 GP worth of materials, you can create a number of poison doses equal to your Proficiency Bonus. As a Bonus Action, you can apply a poison dose to a weapon or piece of ammunition. Once applied, the poison retains its potency for 1 minute or until you hit with the poisoned item, whichever is shorter. When a creature takes damage from the poisoned item, that creature must succeed on a Constitution saving throw (DC 8 plus the modifier of the ability increased by this feat and your Proficiency Bonus) or take 2d8 Poison damage and have the Poisoned condition until the end of your next turn."}),
  feat("Polearm Master (2024)", {ability: PHYSICAL, requires: gen({scores: PHYSICAL}), prerequisite: "Level 4+, Strength or Dexterity 13+", category: "Combat",
    remind: {when: "reaction", line: "With a polearm, attack a creature that enters your reach"},
    summary: "Raise Strength or Dexterity by 1. With a quarterstaff, a spear or a heavy reach weapon, a bonus action strikes with the other end (1d4 bludgeoning), and a creature entering your reach provokes an attack.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Dexterity or Strength score by 1, to a maximum of 20.\n• Pole Strike. Immediately after you take the Attack action and attack with a Quarterstaff, a Spear, or a weapon that has the Heavy and Reach properties, you can use a Bonus Action to make a melee attack with the opposite end of the weapon. The weapon deals Bludgeoning damage, and the weapon's damage die for this attack is a d4.\n• Reactive Strike. While you're holding a Quarterstaff, a Spear, or a weapon that has the Heavy and Reach properties, you can take a Reaction to make one melee attack against a creature that enters the reach you have with that weapon."}),
  feat("Resilient (2024)", {ability: ALL, saveProf: true, requires: GENERAL, prerequisite: "Level 4+", category: "Defense",
    summary: "Raise one ability you lack saving throw proficiency in by 1, and gain proficiency in its saving throws.",
    description: "You gain the following benefits.\n• Ability Score Increase. Choose one ability in which you lack saving throw proficiency. Increase the chosen ability score by 1, to a maximum of 20.\n• Saving Throw Proficiency. You gain saving throw proficiency with the chosen ability."}),
  feat("Ritual Caster (2024)", {ability: MENTAL, requires: gen({scores: MENTAL}), prerequisite: "Level 4+, Intelligence, Wisdom or Charisma 13+", category: "Magic",
    spellPick: {count: "pb", level: 1, ritual: true, use: "prepared", label: "level 1 ritual spell", plural: "level 1 ritual spells"},
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You always have level 1 ritual spells prepared (as many as your proficiency bonus), and once per long rest you can cast one at its normal speed without a slot.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Ritual Spells. Choose a number of level 1 spells equal to your Proficiency Bonus that have the Ritual tag. You always have those spells prepared, and you can cast them with any spell slots you have. The spells' spellcasting ability is the ability increased by this feat. Whenever your Proficiency Bonus increases thereafter, you can add an additional level 1 spell with the Ritual tag to the spells always prepared with this feature.\n• Quick Ritual. With this benefit, you can cast a Ritual spell that you have prepared using its regular casting time rather than the extended time for a Ritual. Doing so doesn't require a spell slot. Once you cast the spell in this way, you can't use this benefit again until you finish a Long Rest."}),
  feat("Sentinel (2024)", {ability: PHYSICAL, requires: gen({scores: PHYSICAL}), prerequisite: "Level 4+, Strength or Dexterity 13+", category: "Combat",
    remind: {when: "reaction", line: "Opportunity attack when a creature near you Disengages or hits someone else"},
    summary: "Raise Strength or Dexterity by 1. A creature within 5 feet that Disengages or hits someone else provokes an opportunity attack from you, and your opportunity attack hits stop its movement.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Guardian. Immediately after a creature within 5 feet of you takes the Disengage action or hits a target other than you with an attack, you can make an Opportunity Attack against that creature.\n• Halt. When you hit a creature with an Opportunity Attack, the creature's Speed becomes 0 for the rest of the current turn."}),
  feat("Shadow Touched (2024)", {ability: MENTAL, grantsSpells: ["Invisibility"],
    spellPick: {count: 1, level: 1, schools: ["Illusion", "Necromancy"], label: "level 1 illusion or necromancy spell"},
    requires: GENERAL, prerequisite: "Level 4+", category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You always have Invisibility and one level 1 illusion or necromancy spell prepared, each free once per long rest.",
    description: "Your exposure to the Shadowfell's magic grants you the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Shadow Magic. Choose one level 1 spell from the Illusion or Necromancy school of magic. You always have that spell and the Invisibility spell prepared. You can cast each of these spells without expending a spell slot. Once you cast either spell in this way, you can't cast that spell in this way again until you finish a Long Rest. You can also cast these spells using spell slots you have of the appropriate level. The spells' spellcasting ability is the ability increased by this feat."}),
  feat("Sharpshooter (2024)", {ability: ["dex"], requires: gen({scores: ["dex"]}), prerequisite: "Level 4+, Dexterity 13+", category: "Combat",
    remind: {when: "always", line: "Ranged weapons ignore half and three-quarters cover, long range and nearby foes"},
    summary: "Raise Dexterity by 1. Your ranged weapon attacks ignore half and three-quarters cover, and neither long range nor an enemy within 5 feet gives them disadvantage.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n• Bypass Cover. Your ranged attacks with weapons ignore Half Cover and Three-Quarters Cover.\n• Firing in Melee. Being within 5 feet of an enemy doesn't impose Disadvantage on your attack rolls with Ranged weapons.\n• Long Shots. Attacking at long range doesn't impose Disadvantage on your attack rolls with Ranged weapons."}),
  feat("Shield Master (2024)", {ability: ["str"], requires: gen({armor: "shield"}), prerequisite: "Level 4+, Shield training", category: "Defense",
    remind: {when: "always", line: "Once a turn after a melee hit, bash with your shield: push 5 feet or knock prone"},
    summary: "Raise Strength by 1. Once a turn after a melee hit you can bash with your shield to push or knock the target prone (a Strength save), and your shield can turn a successful Dexterity save into no damage.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength score by 1, to a maximum of 20.\n• Shield Bash. If you attack a creature within 5 feet of you as part of the Attack action and hit with a Melee weapon, you can immediately bash the target with your Shield if it's equipped, forcing the target to make a Strength saving throw (DC 8 plus your Strength modifier and Proficiency Bonus). On a failed save, you either push the target 5 feet from you or cause it to have the Prone condition (your choice). You can use this benefit only once on each of your turns.\n• Interpose Shield. If you're subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you can take a Reaction to take no damage if you succeed on the saving throw and are holding a Shield."}),
  feat("Skill Expert (2024)", {ability: ALL, skills: 1, expertise: 1, requires: GENERAL, prerequisite: "Level 4+", category: "Utility",
    summary: "Raise one ability score by 1. You gain proficiency in one skill and expertise in one skill you're proficient in.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 20.\n• Skill Proficiency. You gain proficiency in one skill of your choice.\n• Expertise. Choose one skill in which you have proficiency but lack Expertise. You gain Expertise with that skill."}),
  feat("Skulker (2024)", {ability: ["dex"], sense: "Blindsight 10 ft", requires: gen({scores: ["dex"]}), prerequisite: "Level 4+, Dexterity 13+", category: "Utility",
    advantage: {on: "skill", skills: ["Stealth"], when: "when you Hide during combat"},
    remind: {when: "always", line: "A missed attack while you're hidden doesn't give away where you are"},
    summary: "Raise Dexterity by 1. You have blindsight out to 10 feet, advantage on Stealth to Hide in combat, and a missed attack doesn't reveal you.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Dexterity score by 1, to a maximum of 20.\n• Blindsight. You have Blindsight with a range of 10 feet.\n• Fog of War. You exploit the distractions of battle, gaining Advantage on any Dexterity (Stealth) check you make as part of the Hide action during combat.\n• Sniper. If you make an attack roll while hidden and the roll misses, making the attack roll doesn't reveal your location."}),
  feat("Slasher (2024)", {ability: PHYSICAL, requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    remind: {when: "always", line: "Once a turn, a slashing hit slows the target 10 ft. A critical gives it disadvantage"},
    summary: "Raise Strength or Dexterity by 1. Once a turn a slashing hit cuts the target's speed by 10 feet, and a slashing critical hit gives it disadvantage on attacks until your next turn.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Hamstring. Once per turn when you hit a creature with an attack that deals Slashing damage, you can reduce the Speed of that creature by 10 feet until the start of your next turn.\n• Enhanced Critical. When you score a Critical Hit that deals Slashing damage to a creature, it has Disadvantage on attack rolls until the start of your next turn."}),
  feat("Speedy", {ability: ["dex","con"], speed: 10, requires: gen({scores: ["dex","con"]}), prerequisite: "Level 4+, Dexterity or Constitution 13+", category: "Movement",
    remind: {when: "always", line: "Opportunity attacks against you have disadvantage. Dash ignores difficult terrain"},
    summary: "Raise Dexterity or Constitution by 1. Your speed increases by 10 feet, Dash ignores difficult terrain, and opportunity attacks against you have disadvantage.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Dexterity or Constitution score by 1, to a maximum of 20.\n• Speed Increase. Your Speed increases by 10 feet.\n• Dash over Difficult Terrain. When you take the Dash action on your turn, Difficult Terrain doesn't cost you extra movement for the rest of that turn.\n• Agile Movement. Opportunity Attacks have Disadvantage against you."}),
  feat("Spell Sniper (2024)", {ability: MENTAL, requires: gen({spellcasting: true}), prerequisite: "Level 4+, Spellcasting or Pact Magic feature", category: "Magic",
    summary: "Raise Intelligence, Wisdom or Charisma by 1. Your spell attacks ignore half and three-quarters cover, a nearby enemy doesn't give them disadvantage, and their range grows by 60 feet.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Bypass Cover. Your attack rolls for spells ignore Half Cover and Three-Quarters Cover.\n• Casting in Melee. Being within 5 feet of an enemy doesn't impose Disadvantage on your attack rolls with spells.\n• Increased Range. When you cast a spell that has a range of at least 10 feet and requires you to make an attack roll, you can increase the spell's range by 60 feet."}),
  feat("Telekinetic (2024)", {ability: MENTAL, grantsSpells: [{name: "Mage Hand", use: "known"}], requires: GENERAL, prerequisite: "Level 4+", category: "Magic",
    remind: {when: "bonus", line: "Shove a creature within 30 feet 5 feet toward or away from you (a STR save)"},
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You know Mage Hand (invisible, no components, 30 feet more range), and as a bonus action you can shove a creature within 30 feet.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Minor Telekinesis. You learn the Mage Hand spell. You can cast it without Verbal or Somatic components, you can make the spectral hand Invisible, and its range increases by 30 feet when you cast it. The spell's spellcasting ability is the ability increased by this feat.\n• Telekinetic Shove. As a Bonus Action, you can telekinetically shove one creature you can see within 30 feet of yourself. When you do so, the target must succeed on a Strength saving throw (DC 8 plus the ability modifier of the score increased by this feat and your Proficiency Bonus) or be moved 5 feet toward or away from you."}),
  feat("Telepathic (2024)", {ability: MENTAL, grantsSpells: ["Detect Thoughts"], requires: GENERAL, prerequisite: "Level 4+", category: "Magic",
    remind: {when: "always", line: "Speak telepathically to a creature you can see within 60 feet"},
    summary: "Raise Intelligence, Wisdom or Charisma by 1. You can speak telepathically to a creature within 60 feet, and you always have Detect Thoughts prepared, free once per long rest.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Telepathic Utterance. You can speak telepathically to any creature you can see within 60 feet of yourself. Your telepathic utterances are in a language you know, and the creature understands you only if it knows that language. Your communication doesn't give the creature the ability to respond to you telepathically.\n• Detect Thoughts. You always have the Detect Thoughts spell prepared. You can cast it without a spell slot or spell components, and you must finish a Long Rest before you can cast it in this way again. You can also cast it using spell slots you have of the appropriate level. Your spellcasting ability for the spell is the ability increased by this feat."}),
  feat("War Caster (2024)", {ability: MENTAL, requires: gen({spellcasting: true}), prerequisite: "Level 4+, Spellcasting or Pact Magic feature", category: "Magic",
    advantage: {on: "save", abilities: ["con"], when: "to keep concentrating on a spell"},
    remind: {when: "reaction", line: "Cast a spell at a creature that provokes an opportunity attack, instead of attacking"},
    summary: "Raise Intelligence, Wisdom or Charisma by 1. Advantage on concentration saves, a spell in place of an opportunity attack, and somatic components with your hands full.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Concentration. You have Advantage on Constitution saving throws that you make to maintain Concentration.\n• Reactive Spell. When a creature provokes an Opportunity Attack from you by leaving your reach, you can take a Reaction to cast a spell at the creature rather than making an Opportunity Attack. The spell must have a casting time of one action and must target only that creature.\n• Somatic Components. You can perform the Somatic components of spells even when you have weapons or a Shield in one or both hands."}),
  feat("Weapon Master (2024)", {ability: PHYSICAL, masteryPick: true,
    option: {label: "Weapon", options: WEAPON_KINDS, details: WEAPON_KINDS.reduce(function(o, k){ o[k] = "Its mastery: " + WEAPON_MASTERY[k] + "."; return o; }, {})}, requires: GENERAL, prerequisite: "Level 4+", category: "Combat",
    summary: "Raise Strength or Dexterity by 1. You can use the mastery property of one kind of simple or martial weapon you're proficient with, and change it after a long rest.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Mastery Property. Your training with weapons allows you to use the mastery property of one kind of Simple or Martial weapon of your choice, provided you have proficiency with it. Whenever you finish a Long Rest, you can change the kind of weapon to another eligible kind."})
];

/* The Fighting Style feats (p. 209): the style's own feature on the
   sheet, worked out like a class's. */
export var PHB_2024_STYLE_FEATS = [
  style("Archery", "You gain a +2 bonus to attack rolls you make with Ranged weapons."),
  style("Blind Fighting", "You have Blindsight with a range of 10 feet."),
  style("Defense", "While you're wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class."),
  style("Dueling", "When you're holding a Melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon."),
  style("Great Weapon Fighting", "When you roll damage for an attack you make with a Melee weapon that you are holding with two hands, you can treat any 1 or 2 on a damage die as a 3. The weapon must have the Two-Handed or Versatile property to gain this benefit.",
    {when: "always", line: "A 1 or 2 on the damage dice of a melee weapon held in two hands counts as a 3"}),
  style("Interception", "When a creature you can see hits another creature within 5 feet of you with an attack roll, you can take a Reaction to reduce the damage dealt to the target by 1d10 plus your Proficiency Bonus. You must be holding a Shield or a Simple or Martial weapon to use this Reaction.",
    {when: "reaction", line: "Cut the damage of a hit on a creature next to you by 1d10 + your proficiency bonus"}),
  style("Protection", "When a creature you can see attacks a target other than you that is within 5 feet of you, you can take a Reaction to interpose your Shield if you're holding one. You impose Disadvantage on the triggering attack roll and all other attack rolls against the target until the start of your next turn if you remain within 5 feet of the target.",
    {when: "reaction", line: "With a shield, give disadvantage to attacks on someone next to you until your turn"}),
  style("Thrown Weapon Fighting", "When you hit with a ranged attack roll using a weapon that has the Thrown property, you gain a +2 bonus to the damage roll."),
  style("Two-Weapon Fighting", "When you make an extra attack as a result of using a weapon that has the Light property, you can add your ability modifier to the damage of that attack if you aren't already adding it to the damage."),
  style("Unarmed Fighting", "When you hit with your Unarmed Strike and deal damage, you can deal Bludgeoning damage equal to 1d6 plus your Strength modifier instead of the normal damage of an Unarmed Strike. If you aren't holding any weapons or a Shield when you make the attack roll, the d6 becomes a d8. At the start of each of your turns, you can deal 1d4 Bludgeoning damage to one creature Grappled by you.")
];

/* The Epic Boons (pp. 209-211): level 19, and their +1 can reach 30. */
export var PHB_2024_BOONS = [
  boon("Boon of Combat Prowess", {
    remind: {when: "always", line: "Once a turn, when you miss with an attack roll, you can hit instead"},
    summary: "Raise one ability score by 1 (up to 30). When you miss with an attack roll you can hit instead, once until the start of your next turn.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Peerless Aim. When you miss with an attack roll, you can hit instead. Once you use this benefit, you can't use it again until the start of your next turn."}),
  boon("Boon of Dimensional Travel", {
    remind: {when: "always", line: "Right after the Attack or Magic action, teleport up to 30 feet"},
    summary: "Raise one ability score by 1 (up to 30). Right after you take the Attack or Magic action, you can teleport up to 30 feet to a space you can see.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Blink Steps. Immediately after you take the Attack action or the Magic action, you can teleport up to 30 feet to an unoccupied space you can see."}),
  boon("Boon of Energy Resistance", {damagePicks: {count: 2, options: DAMAGE_TYPES},
    remind: {when: "reaction", line: "Hurt by a resisted type: a creature within 60 feet saves (DEX) or takes 2d12 + CON"},
    summary: "Raise one ability score by 1 (up to 30). Resistance to two damage types of your choice, and when you take one of them you can send it at a creature within 60 feet.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Energy Resistances. You gain Resistance to two of the following damage types of your choice: Acid, Cold, Fire, Lightning, Necrotic, Poison, Psychic, Radiant, or Thunder. Whenever you finish a Long Rest, you can change your choices.\n• Energy Redirection. When you take damage of one of the types chosen for the Energy Resistances benefit, you can take a Reaction to direct damage of the same type toward another creature you can see within 60 feet of yourself that isn't behind Total Cover. If you do so, that creature must succeed on a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus) or take damage equal to 2d12 plus your Constitution modifier."}),
  boon("Boon of Fate", {
    summary: "Raise one ability score by 1 (up to 30). Once until you roll initiative or rest, add or subtract 2d4 to a d20 test you or a creature within 60 feet just made.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Improve Fate. When you or another creature within 60 feet of you succeeds on or fails a D20 Test, you can roll 2d4 and apply the total rolled as a bonus or penalty to the d20 roll. Once you use this benefit, you can't use it again until you roll Initiative or finish a Short or Long Rest."}),
  boon("Boon of Fortitude", {hp: 40,
    remind: {when: "always", line: "Once a turn when you regain hit points, regain your CON modifier more"},
    summary: "Raise one ability score by 1 (up to 30). Your hit point maximum increases by 40, and once a turn you regain extra hit points equal to your Constitution modifier.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Fortified Health. Your Hit Point maximum increases by 40. In addition, whenever you regain Hit Points, you can regain additional Hit Points equal to your Constitution modifier. Once you've regained these additional Hit Points, you can't do so again until the start of your next turn."}),
  boon("Boon of Irresistible Offense", {ability: PHYSICAL,
    remind: {when: "always", line: "Your weapon damage ignores resistance. A 20 adds the raised score as damage"},
    summary: "Raise Strength or Dexterity by 1 (up to 30). Your bludgeoning, piercing and slashing damage ignores resistance, and a 20 on an attack deals extra damage equal to that score.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 30.\n• Overcome Defenses. The Bludgeoning, Piercing, and Slashing damage you deal always ignores Resistance.\n• Overwhelming Strike. When you roll a 20 on the d20 for an attack roll, you can deal extra damage to the target equal to the ability score increased by this feat. The extra damage's type is the same as the attack's type."}),
  boon("Boon of Recovery", {
    summary: "Raise one ability score by 1 (up to 30). Once per long rest, drop to 1 hit point instead of 0 and regain half your hit points, and heal from a pool of ten d10s.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Last Stand. When you would be reduced to 0 Hit Points, you can drop to 1 Hit Point instead and regain a number of Hit Points equal to half your Hit Point maximum. Once you use this benefit, you can't use it again until you finish a Long Rest.\n• Recover Vitality. You have a pool of ten d10s. As a Bonus Action, you can expend dice from the pool, roll those dice, and regain a number of Hit Points equal to the roll's total. You regain all the expended dice when you finish a Long Rest."}),
  boon("Boon of Skill", {allSkills: true, expertise: 1,
    summary: "Raise one ability score by 1 (up to 30). You gain proficiency in every skill and expertise in one.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• All-Around Adept. You gain proficiency in all skills.\n• Expertise. Choose one skill in which you lack Expertise. You gain Expertise in that skill."}),
  boon("Boon of Speed", {speed: 30,
    remind: {when: "bonus", line: "Disengage, which also ends the grappled condition on you"},
    summary: "Raise one ability score by 1 (up to 30). Your speed increases by 30 feet, and as a bonus action you can Disengage and escape a grapple.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Escape Artist. As a Bonus Action, you can take the Disengage action, which also ends the Grappled condition on you.\n• Quickness. Your Speed increases by 30 feet."}),
  boon("Boon of Spell Recall", {ability: MENTAL, requires: {level: 19, spellcasting: true}, prerequisite: "Level 19+, Spellcasting feature",
    remind: {when: "always", line: "Casting with a level 1 to 4 slot, roll 1d4. On the slot's level, it isn't spent"},
    summary: "Raise Intelligence, Wisdom or Charisma by 1 (up to 30). When you cast with a level 1 to 4 slot, a d4 that matches the slot's level keeps the slot.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 30.\n• Free Casting. Whenever you cast a spell with a level 1-4 spell slot, roll 1d4. If the number you roll is the same as the slot's level, the slot isn't expended."}),
  boon("Boon of the Night Spirit", {
    remind: {when: "bonus", line: "In dim light or darkness, turn invisible until you next act"},
    summary: "Raise one ability score by 1 (up to 30). In dim light or darkness you can turn invisible as a bonus action, and you resist all damage but psychic and radiant.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Merge with Shadows. While within Dim Light or Darkness, you can give yourself the Invisible condition as a Bonus Action. The condition ends on you immediately after you take an action, a Bonus Action, or a Reaction.\n• Shadowy Form. While within Dim Light or Darkness, you have Resistance to all damage except Psychic and Radiant."}),
  boon("Boon of Truesight", {sense: "Truesight 60 ft",
    summary: "Raise one ability score by 1 (up to 30). You have truesight out to 60 feet.",
    description: "You gain the following benefits.\n• Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n• Truesight. You have Truesight with a range of 60 feet."})
];
