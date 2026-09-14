/* ---------------- Feats Catalog (Standard 5e SRD) ---------------- */
export var FEATS_CATALOG = [
  {
    name: "Alert",
    prerequisite: "None",
    category: "Combat",
    summary: "+5 initiative, cannot be surprised while conscious, enemies gain no advantage from being unseen.",
    description: "Always on the lookout for danger, you gain the following benefits:\n• You gain a +5 bonus to initiative.\n• You can't be surprised while you are conscious.\n• Other creatures don’t gain advantage on attack rolls against you as a result of being unseen by you."
  },
  {
    name: "Athlete",
    prerequisite: "None",
    category: "Physical",
    summary: "+1 STR/DEX, stand up with 5ft movement, climbing uses no extra movement, running jumps need only 5ft.",
    description: "You have undergone extensive physical training to gain the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• When you are prone, standing up uses only 5 feet of your movement.\n• Climbing doesn't cost you extra movement.\n• You can make a running long jump or a running high jump after moving only 5 feet on foot."
  },
  {
    name: "Actor",
    prerequisite: "None",
    category: "Social",
    summary: "+1 CHA, advantage on Deception/Performance when impersonating, mimic speech and sounds.",
    description: "Skilled at mimicry and dramatics, you gain the following benefits:\n• Increase your Charisma score by 1, to a maximum of 20.\n• You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person.\n• You can mimic the speech of another person or the sounds made by other creatures that you have heard for at least 1 minute."
  },
  {
    name: "Charger",
    prerequisite: "None",
    category: "Combat",
    summary: "Bonus action melee attack or shove after Dashing, with +5 damage or 10ft push.",
    description: "When you use your action to Dash, you can use a bonus action to make one melee weapon attack or to shove a creature.\nIf you move at least 10 feet in a straight line immediately before taking this bonus action, you either gain a +5 bonus to the attack's damage roll (if you hit with a melee attack) or push the target up to 10 feet away from you (if you succeed on the shove)."
  },
  {
    name: "Crossbow Expert",
    prerequisite: "None",
    category: "Combat",
    summary: "Ignore loading quality, no disadvantage on ranged attacks in close combat, bonus action hand crossbow attack.",
    description: "Thanks to extensive practice with crossbows, you gain the following benefits:\n• You ignore the loading quality of crossbows with which you are proficient.\n• Being within 5 feet of a hostile creature doesn’t impose disadvantage on your ranged attack rolls.\n• When you use the Attack action and attack with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding."
  },
  {
    name: "Defensive Duelist",
    prerequisite: "Dexterity 13 or higher",
    category: "Defense",
    summary: "Use reaction to add proficiency bonus to AC against a melee attack while wielding a finesse weapon.",
    description: "When you are wielding a finesse weapon with which you are proficient and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing the attack to miss you."
  },
  {
    name: "Dual Wielder",
    prerequisite: "None",
    category: "Combat",
    summary: "+1 AC while dual wielding, use non-light weapons for two-weapon fighting, draw/stow two weapons.",
    description: "You master fighting with two weapons, gaining the following benefits:\n• You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand.\n• You can use two-weapon fighting even when the one-handed melee weapons you are wielding aren’t light.\n• You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one."
  },
  {
    name: "Dungeon Delver",
    prerequisite: "None",
    category: "Utility",
    summary: "Advantage to find secret doors, advantage vs traps, resistance to trap damage, search at normal pace.",
    description: "Alert to the hidden traps and secret doors found in dungeons, you gain the following benefits:\n• You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks made to detect the presence of secret doors.\n• You have advantage on saving throws made to avoid or resist traps.\n• You have resistance to the damage dealt by traps.\n• Traveling at a fast pace doesn't impose the normal -5 penalty on your passive Wisdom (Perception) score."
  },
  {
    name: "Durable",
    prerequisite: "None",
    category: "Defense",
    summary: "+1 CON, minimum HP regained from rolling a Hit Die is 2x your CON modifier (minimum 2).",
    description: "Hardy and resilient, you gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• When you roll a Hit Die to regain hit points, the minimum number of hit points you regain from the roll equals twice your Constitution modifier (minimum of 2)."
  },
  {
    name: "Elemental Adept",
    prerequisite: "Spellcasting feature",
    category: "Magic",
    summary: "Spells ignore resistance to a chosen element; treat 1s on damage dice as 2s.",
    description: "When you gain this feat, choose one damage type: acid, cold, fire, lightning, or thunder.\n• Spells you cast ignore resistance to damage of the chosen type.\n• In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2."
  },
  {
    name: "Grappler",
    prerequisite: "Strength 13 or higher",
    category: "Combat",
    summary: "Advantage on attack rolls against creatures you grapple, can attempt to pin grappled creatures.",
    description: "You’ve developed the skills necessary to hold your own in close-quarters grappling:\n• You have advantage on attack rolls against a creature you are grappling.\n• You can use your action to try to pin a creature grappled by you. To do so, make another grapple check. If you succeed, you and the creature are both restrained until the grapple ends."
  },
  {
    name: "Great Weapon Master",
    prerequisite: "None",
    category: "Combat",
    summary: "Bonus action attack on crit/kill, take -5 to hit with heavy weapon for +10 damage.",
    description: "You’ve learned to put the weight of a weapon to your advantage:\n• On your turn, when you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one melee weapon attack as a bonus action.\n• Before you make a melee attack with a heavy weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack’s damage."
  },
  {
    name: "Healer",
    prerequisite: "None",
    category: "Support",
    summary: "Use healer's kit to stabilize at 1 HP, or restore 1d6 + 4 + max Hit Dice HP once per rest per creature.",
    description: "You are an able physician, allowing you to mend wounds quickly and get your allies back in the fight:\n• When you use a healer’s kit to stabilize a dying creature, that creature also regains 1 hit point.\n• As an action, you can spend one use of a healer’s kit to tend to a creature and restore 1d6 + 4 hit points to it, plus additional hit points equal to the creature’s maximum number of Hit Dice. The creature can’t regain hit points from this feat again until it finishes a short or long rest."
  },
  {
    name: "Heavily Armored",
    prerequisite: "Proficiency with medium armor",
    category: "Defense",
    summary: "+1 STR, gain proficiency with heavy armor.",
    description: "You have trained to master the use of heavy armor, gaining the following benefits:\n• Increase your Strength score by 1, to a maximum of 20.\n• You gain proficiency with heavy armor."
  },
  {
    name: "Heavy Armor Master",
    prerequisite: "Proficiency with heavy armor",
    category: "Defense",
    summary: "+1 STR, reduce nonmagical bludgeoning, piercing, and slashing damage by 3 while wearing heavy armor.",
    description: "You can use your armor to deflect strikes that would kill others:\n• Increase your Strength score by 1, to a maximum of 20.\n• While you are wearing heavy armor, bludgeoning, piercing, and slashing damage that you take from nonmagical attacks is reduced by 3."
  },
  {
    name: "Inspiring Leader",
    prerequisite: "Charisma 13 or higher",
    category: "Support",
    summary: "Spend 10 minutes inspiring up to 6 allies to grant temporary HP equal to level + CHA mod.",
    description: "You can spend 10 minutes inspiring your companions, shoring up their resolve to fight. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you who can see or hear you and who can understand you. Each creature gains temporary hit points equal to your level + your Charisma modifier (once per rest per creature)."
  },
  {
    name: "Keen Mind",
    prerequisite: "None",
    category: "Utility",
    summary: "+1 INT, always know north and time until sunrise/sunset, perfectly recall past month.",
    description: "You have a mind that can track time, direction, and detail with uncanny precision:\n• Increase your Intelligence score by 1, to a maximum of 20.\n• You always know which way is north.\n• You always know the number of hours left before the next sunrise or sunset.\n• You can accurately recall anything you have seen or heard within the past month."
  },
  {
    name: "Lightly Armored",
    prerequisite: "None",
    category: "Defense",
    summary: "+1 STR or DEX, gain proficiency with light armor.",
    description: "You have trained to master the use of light armor, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with light armor."
  },
  {
    name: "Lucky",
    prerequisite: "None",
    category: "General",
    summary: "3 luck points per long rest to roll an extra d20 on attacks, checks, saves, or enemy attacks against you.",
    description: "You have inexplicable luck that seems to kick in at just the right moment:\n• You have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20 and choose which d20 to use.\n• You can also spend one luck point when an attack roll is made against you to roll a d20 and choose whether the attack uses the attacker’s roll or yours.\n• You regain your expended luck points when you finish a long rest."
  },
  {
    name: "Mage Slayer",
    prerequisite: "None",
    category: "Combat",
    summary: "Reaction attack against adjacent spellcaster, disadvantage on enemy concentration saves, advantage vs nearby spells.",
    description: "You have practiced techniques useful in melee combat against spellcasters:\n• When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee weapon attack against that creature.\n• When you damage a creature that is concentrating on a spell, that creature has disadvantage on the saving throw it makes to maintain its concentration.\n• You have advantage on saving throws against spells cast by creatures within 5 feet of you."
  },
  {
    name: "Magic Initiate",
    prerequisite: "None",
    category: "Magic",
    summary: "Learn 2 cantrips and one 1st-level spell from a chosen spellcaster class; cast 1st-level spell 1/day.",
    description: "Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard.\n• You learn two cantrips of your choice from that class’s spell list.\n• In addition, choose one 1st-level spell to learn from that same list. You can cast this spell once at its lowest level without expending a spell slot, regaining the ability on a long rest."
  },
  {
    name: "Martial Adept",
    prerequisite: "None",
    category: "Combat",
    summary: "Learn two Battle Master maneuvers and gain one superiority die (d6) per short or long rest.",
    description: "You have martial training that allows you to perform special combat maneuvers:\n• You learn two maneuvers of your choice from among those available to the Battle Master archetype in the fighter class.\n• You gain one superiority die, which is a d6 (used to fuel your maneuvers). You regain your expended superiority die when you finish a short or long rest.\n• Saving throw DC equals 8 + proficiency bonus + STR or DEX modifier (your choice)."
  },
  {
    name: "Medium Armor Master",
    prerequisite: "Proficiency with medium armor",
    category: "Defense",
    summary: "Medium armor imposes no Stealth disadvantage, max DEX bonus to AC increases from +2 to +3.",
    description: "You have practiced moving in medium armor to gain the following benefits:\n• Wearing medium armor doesn’t impose disadvantage on your Dexterity (Stealth) checks.\n• When you wear medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity of 16 or higher."
  },
  {
    name: "Mobile",
    prerequisite: "None",
    category: "Movement",
    summary: "+10ft speed, Dash ignores difficult terrain, melee attacking a creature prevents opportunity attacks from it.",
    description: "You are exceptionally speedy and agile:\n• Your speed increases by 10 feet.\n• When you use the Dash action, difficult terrain doesn’t cost you extra movement on that turn.\n• When you make a melee attack against a creature, you don’t provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not."
  },
  {
    name: "Moderately Armored",
    prerequisite: "Proficiency with light armor",
    category: "Defense",
    summary: "+1 STR or DEX, gain proficiency with medium armor and shields.",
    description: "You have trained to master the use of medium armor and shields, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with medium armor and shields."
  },
  {
    name: "Mounted Combatant",
    prerequisite: "None",
    category: "Combat",
    summary: "Advantage on melee attacks vs smaller unmounted foes, redirect attacks to mount to yourself, mount DEX save evasion.",
    description: "You are a dangerous foe to face while mounted:\n• You have advantage on melee attack rolls against any unmounted creature that is smaller than your mount.\n• You can force an attack targeted at your mount to target you instead.\n• If your mount is subjected to an effect that allows it to make a DEX saving throw to take only half damage, it takes no damage on success and half damage on failure."
  },
  {
    name: "Observant",
    prerequisite: "None",
    category: "Utility",
    summary: "+1 INT or WIS, read lips, +5 bonus to passive Perception and passive Investigation.",
    description: "Quick to notice details of your environment, you gain the following benefits:\n• Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n• If you can see a creature’s mouth while it speaks a language you understand, you can interpret what it’s saying by reading its lips.\n• You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores."
  },
  {
    name: "Polearm Master",
    prerequisite: "None",
    category: "Combat",
    summary: "Bonus action attack with opposite end of polearms (1d4), opportunity attack when enemies enter your reach.",
    description: "You can keep your enemies at bay with reach weapons:\n• When you take the Attack action and attack with only a glaive, halberd, pike, quarterstaff, or spear, you can use a bonus action to make a melee attack with the opposite end of the weapon (deals 1d4 bludgeoning damage).\n• While you are wielding a glaive, halberd, pike, quarterstaff, or spear, other creatures provoke an opportunity attack from you when they enter the reach you have with that weapon."
  },
  {
    name: "Resilient",
    prerequisite: "None",
    category: "Defense",
    summary: "+1 to any ability score, gain saving throw proficiency in that chosen ability.",
    description: "Choose one ability score. You gain the following benefits:\n• Increase the chosen ability score by 1, to a maximum of 20.\n• You gain proficiency in saving throws using the chosen ability."
  },
  {
    name: "Ritual Caster",
    prerequisite: "Intelligence or Wisdom 13 or higher",
    category: "Magic",
    summary: "Gain ritual book with two 1st-level ritual spells from a chosen class, scribe more ritual spells you find.",
    description: "You have learned a number of spells that you can cast as rituals. Choose a class: bard, cleric, druid, sorcerer, warlock, or wizard.\n• You acquire a ritual book holding two 1st-level spells of your choice that have the ritual tag from that class’s spell list.\n• You can cast these spells as rituals. If you come across a spell in written form, you might be able to add it to your ritual book."
  },
  {
    name: "Savage Attacker",
    prerequisite: "None",
    category: "Combat",
    summary: "Once per turn when rolling melee weapon damage, roll again and use either total.",
    description: "Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon’s damage dice and use either total."
  },
  {
    name: "Sentinel",
    prerequisite: "None",
    category: "Combat",
    summary: "Opportunity attacks reduce enemy speed to 0, enemies provoke even when Disengaging, reaction attack when enemy attacks nearby ally.",
    description: "You have mastered techniques to take advantage of every drop in any enemy's guard:\n• When you hit a creature with an opportunity attack, the creature’s speed becomes 0 for the rest of the turn.\n• Creatures provoke opportunity attacks from you even if they take the Disengage action before leaving your reach.\n• When a creature within 5 feet of you makes an attack against a target other than you (and that target doesn’t have this feat), you can use your reaction to make a melee weapon attack against the attacking creature."
  },
  {
    name: "Sharpshooter",
    prerequisite: "None",
    category: "Combat",
    summary: "Attacking at long range has no disadvantage, ignore half and 3/4 cover, take -5 to hit for +10 damage with ranged weapon.",
    description: "You have mastered ranged weapons and can make shots that others find impossible:\n• Attacking at long range doesn't impose disadvantage on your ranged weapon attack rolls.\n• Your ranged weapon attacks ignore half cover and three-quarters cover.\n• Before you make an attack with a ranged weapon that you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack’s damage."
  },
  {
    name: "Shield Master",
    prerequisite: "None",
    category: "Defense",
    summary: "Bonus action shield shove, add shield AC to DEX saves targeting only you, reaction to take 0 damage on successful DEX save.",
    description: "You use shields not just for protection but also for offense:\n• If you take the Attack action on your turn, you can use a bonus action to try to shove a creature within 5 feet of you with your shield.\n• If you aren’t incapacitated, you can add your shield’s AC bonus to any Dexterity saving throw you make against a spell or other harmful effect that targets only you.\n• If you are subjected to an effect that allows you to make a DEX saving throw for half damage, you can use your reaction to take no damage on a success."
  },
  {
    name: "Skill Expert",
    prerequisite: "None",
    category: "Utility",
    summary: "+1 to any ability score, gain proficiency in one skill, and gain expertise in one proficient skill.",
    description: "You have honed your proficiency with particular skills:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• You gain proficiency in one skill of your choice.\n• Choose one skill in which you have proficiency. You gain expertise with that skill (your proficiency bonus is doubled for checks made with it)."
  },
  {
    name: "Skilled",
    prerequisite: "None",
    category: "Utility",
    summary: "Gain proficiency in any combination of three skills or tools of your choice.",
    description: "You have exceptionally broad training:\n• You gain proficiency in any combination of three skills or tools of your choice."
  },
  {
    name: "Skulker",
    prerequisite: "Dexterity 13 or higher",
    category: "Utility",
    summary: "Hide when lightly obscured, missing a ranged attack while hidden does not reveal you, dim light imposes no disadvantage.",
    description: "You are expert at slinking through shadows:\n• You can try to hide when you are lightly obscured from the creature from which you are hiding.\n• When you are hidden from a creature and miss it with a ranged weapon attack, making the attack doesn't reveal your position.\n• Dim light doesn’t impose disadvantage on your Wisdom (Perception) checks relying on sight."
  },
  {
    name: "Spell Sniper",
    prerequisite: "Spellcasting feature",
    category: "Magic",
    summary: "Double range of attack spells, ignore half and 3/4 cover with spells, learn one attack cantrip.",
    description: "You have mastered spells that require attack rolls:\n• When you cast a spell that requires you to make an attack roll, the spell’s range is doubled.\n• Your ranged spell attacks ignore half cover and three-quarters cover.\n• You learn one cantrip that requires an attack roll from the bard, cleric, druid, sorcerer, warlock, or wizard spell list (using that class's casting ability)."
  },
  {
    name: "Tavern Brawler",
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or CON, proficient with improvised weapons, 1d4 unarmed strikes, bonus action grapple on unarmed/improvised hit.",
    description: "Accustomed to rough-and-tumble fighting using whatever is at hand:\n• Increase your Strength or Constitution score by 1, to a maximum of 20.\n• You are proficient with improvised weapons.\n• Your unarmed strike uses a d4 for damage.\n• When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a bonus action to attempt to grapple the target."
  },
  {
    name: "Tough",
    prerequisite: "None",
    category: "Defense",
    summary: "HP maximum increases by 2 per level (current and future).",
    description: "Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points."
  },
  {
    name: "War Caster",
    prerequisite: "Spellcasting feature",
    category: "Magic",
    summary: "Advantage on concentration saves, perform somatic components with weapons/shield in hand, cast spell as opportunity attack.",
    description: "You have practiced casting spells in the midst of combat:\n• You have advantage on Constitution saving throws that you make to maintain your concentration on a spell when you take damage.\n• You can perform the somatic components of spells even when you have weapons or a shield in one or both hands.\n• When a hostile creature’s movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature, rather than making an opportunity attack."
  },
  {
    name: "Weapon Master",
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or DEX, gain proficiency with four weapons of your choice.",
    description: "You have practiced extensively with a variety of weapons, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with four weapons of your choice."
  }
];
