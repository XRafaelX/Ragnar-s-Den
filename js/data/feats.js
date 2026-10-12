/* ---------------- Feats Catalog ----------------
   The 2014 rules' feats: the Player's Handbook, Tasha's Cauldron,
   Xanathar's racial feats, and the setting books' (`source` on the ones
   from outside the Player's Handbook).
   What taking a feat changes on the sheet (see js/core/feat-picks.js):
     ability        abilities its +1 can go to (one entry: no choice)
     saveProf       also proficiency in saves of that ability (Resilient)
     skills         skill proficiencies to pick (Skill Expert)
     skillOptions   the only skills `skills` can pick from (Squat
                    Nimbleness: Acrobatics or Athletics)
     skillsOrTools  skills or tools to pick (Skilled)
     expertise      expertise picks, in skills the character is proficient in
     armor          armor proficiencies it grants
     weapons        weapon proficiencies to pick (Weapon Master)
     weaponProfs    weapon proficiencies it grants outright (Gunner)
     tools          tool proficiencies it grants outright (Chef)
     toolPicks      {count, group}: tools to pick, from one group of
                    TOOL_GROUPS when `group` is set (Artificer Initiate)
     languages      languages it teaches outright (Fey Teleportation)
     languagePicks  languages to pick (Linguist)
     option         {label, options, details}: one choice that is kept and
                    shown (Elemental Adept's damage type); `details` says
                    what each option does (Strike of the Giants)
     repeatable     can be taken more than once, each time with a
                    different option
     grantsSpells   spells the feat teaches outright (Fey Touched: Misty
                    Step); shown on the Spells tab (see featureSpells).
                    A name, or {name, use}: "long" or "short" for one
                    free cast per rest (the default for a leveled spell),
                    "atwill", "ritual", or "known" (the default for a
                    cantrip)
     grantsByOption {option: [spells]}: spells that depend on `option`
                    (Scion of the Outer Planes' cantrip)
     spellPick      {count, level, schools, list, names, byOption, label,
                    plural, use, tags}, or a list of them: spells to pick at that
                    spell level, from those schools, from a class's list
                    (`list`: a class or several) or from `names`.
                    `byOption` gives the list or names per `option`
                    (Strixhaven Initiate's college). count "halfPb" is
                    half the proficiency bonus (Rune Shaper's runes);
                    `tags` names each spell in the picker (its rune).
     castAbility    what the feat's spells are cast with when that isn't
                    its +1: an ability ("cha"), a list to pick from, or
                    {feat}: the one picked for that feat
     optionPicks    {set, count}: options to learn from a class option set
                    (js/data/class-options.js); Martial Adept's two
                    maneuvers
     stylePick      a fighting style from the fighter's list (Fighting
                    Initiate); it becomes a style feature on the sheet
     invocationPick an eldritch invocation (Eldritch Adept)
     speed          feet added to walking speed (Squat Nimbleness)
     unarmoredAc    AC without armor is this + DEX (Dragon Hide)
     darkvision     {range, add}, like class features' (Keenness of the
                    Stone Giant)
     requires       {races, raceLabel, level, feat, option}: who can take
                    it; the pickers grey it out for everyone else. A
                    homebrew race is never ruled out. */
var HALFLINGS = ["Lightfoot Halfling","Stout Halfling"];
var DWARVES = ["Hill Dwarf","Mountain Dwarf","Duergar"];
var GNOMES = ["Rock Gnome","Forest Gnome","Deep Gnome (Svirfneblin)"];
var ELVES = ["High Elf","Wood Elf","Dark Elf (Drow)","Eladrin","Sea Elf","Shadar-kai"];
var SMALL_RACES = HALFLINGS.concat(GNOMES, ["Fairy","Goblin","Harengon","Kobold","Thri-kreen","Verdan"]);
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
    ability:["str","dex"],
    prerequisite: "None",
    category: "Physical",
    summary: "+1 STR/DEX, stand up with 5ft movement, climbing uses no extra movement, running jumps need only 5ft.",
    description: "You have undergone extensive physical training to gain the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• When you are prone, standing up uses only 5 feet of your movement.\n• Climbing doesn't cost you extra movement.\n• You can make a running long jump or a running high jump after moving only 5 feet on foot."
  },
  {
    name: "Actor",
    ability:["cha"],
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
    ability:["con"],
    prerequisite: "None",
    category: "Defense",
    summary: "+1 CON, minimum HP regained from rolling a Hit Die is 2x your CON modifier (minimum 2).",
    description: "Hardy and resilient, you gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• When you roll a Hit Die to regain hit points, the minimum number of hit points you regain from the roll equals twice your Constitution modifier (minimum of 2)."
  },
  {
    name: "Elemental Adept",
    option: {label: "Damage type", options: ["Acid", "Cold", "Fire", "Lightning", "Thunder"]},
    repeatable: true,
    prerequisite: "Spellcasting feature",
    category: "Magic",
    summary: "Spells ignore resistance to a chosen element; treat 1s on damage dice as 2s.",
    description: "When you gain this feat, choose one damage type: acid, cold, fire, lightning, or thunder.\n• Spells you cast ignore resistance to damage of the chosen type.\n• In addition, when you roll damage for a spell you cast that deals damage of that type, you can treat any 1 on a damage die as a 2."
  },
  {
    name: "Fey Touched",
    ability:["int","wis","cha"],
    grantsSpells:["Misty Step"],
    spellPick:{count:1, level:1, schools:["Divination","Enchantment"], label:"1st-level divination or enchantment spell"},
    prerequisite: "None",
    category: "Magic",
    summary: "+1 INT/WIS/CHA, learn Misty Step and one 1st-level divination or enchantment spell; cast each once per long rest without a slot.",
    description: "Your exposure to the Feywild's magic has changed you, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You learn the misty step spell and one 1st-level spell of your choice. The 1st-level spell must be from the divination or enchantment school of magic. You can cast each of these spells without expending a spell slot. Once you cast either of these spells in this way, you can't cast that spell in this way again until you finish a long rest. You can also cast these spells using spell slots you have of the appropriate level. The spells' spellcasting ability is the ability increased by this feat."
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
    ability:["str"], armor:["Heavy armor"],
    prerequisite: "Proficiency with medium armor",
    category: "Defense",
    summary: "+1 STR, gain proficiency with heavy armor.",
    description: "You have trained to master the use of heavy armor, gaining the following benefits:\n• Increase your Strength score by 1, to a maximum of 20.\n• You gain proficiency with heavy armor."
  },
  {
    name: "Heavy Armor Master",
    ability:["str"],
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
    ability:["int"],
    prerequisite: "None",
    category: "Utility",
    summary: "+1 INT, always know north and time until sunrise/sunset, perfectly recall past month.",
    description: "You have a mind that can track time, direction, and detail with uncanny precision:\n• Increase your Intelligence score by 1, to a maximum of 20.\n• You always know which way is north.\n• You always know the number of hours left before the next sunrise or sunset.\n• You can accurately recall anything you have seen or heard within the past month."
  },
  {
    name: "Lightly Armored",
    ability:["str","dex"], armor:["Light armor"],
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
    optionPicks:{set:"maneuvers", count:2},
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
    ability:["str","dex"], armor:["Medium armor","Shields"],
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
    ability:["int","wis"],
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
    ability:["str","dex","con","int","wis","cha"], saveProf:true,
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
    ability:["str","dex","con","int","wis","cha"], skills:1, expertise:1,
    prerequisite: "None",
    category: "Utility",
    summary: "+1 to any ability score, gain proficiency in one skill, and gain expertise in one proficient skill.",
    description: "You have honed your proficiency with particular skills:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• You gain proficiency in one skill of your choice.\n• Choose one skill in which you have proficiency. You gain expertise with that skill (your proficiency bonus is doubled for checks made with it)."
  },
  {
    name: "Skilled",
    skillsOrTools:3,
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
    ability:["str","con"],
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
    ability:["str","dex"], weapons:4,
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or DEX, gain proficiency with four weapons of your choice.",
    description: "You have practiced extensively with a variety of weapons, gaining the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with four weapons of your choice."
  },

  /* ---- Player's Handbook ---- */
  {
    name: "Linguist",
    source: "PHB",
    ability:["int"], languagePicks:3,
    prerequisite: "None",
    category: "Utility",
    summary: "+1 INT, learn three languages, write ciphers only you and those you teach can read.",
    description: "You have studied languages and codes, gaining the following benefits:\n• Increase your Intelligence score by 1, to a maximum of 20.\n• You learn three languages of your choice.\n• You can create written ciphers. Others can't decipher a code you create unless you teach them, they succeed on an Intelligence check (DC equal to your Intelligence score + your proficiency bonus), or they use magic to decipher it."
  },

  /* ---- Tasha's Cauldron of Everything ---- */
  {
    name: "Artificer Initiate",
    source: "TCE",
    castAbility:"int",
    spellPick:[
      {count:1, level:0, list:"Artificer", label:"artificer cantrip"},
      {count:1, level:1, list:"Artificer", label:"1st-level artificer spell"}
    ],
    toolPicks:{count:1, group:"Artisan's tools"},
    prerequisite: "None",
    category: "Magic",
    summary: "Learn an artificer cantrip and a 1st-level artificer spell (free once per long rest), plus one type of artisan's tools.",
    description: "You've learned some of an artificer's inventiveness:\n• You learn one cantrip of your choice from the artificer spell list, and one 1st-level spell of your choice from that list. Intelligence is your spellcasting ability for these spells.\n• You can cast this feat's 1st-level spell without a spell slot, and you must finish a long rest before you can cast it this way again. You can also cast it using any spell slots you have.\n• You gain proficiency with one type of artisan's tools of your choice, and you can use that type of tool as a spellcasting focus for any spell you cast that uses Intelligence as its spellcasting ability."
  },
  {
    name: "Chef",
    source: "TCE",
    ability:["con","wis"], tools:["Cook's utensils"],
    prerequisite: "None",
    category: "Support",
    summary: "+1 CON or WIS, cook's utensils, food that heals an extra 1d8 on a short rest, treats that give temporary HP.",
    description: "Time spent mastering the culinary arts has paid off:\n• Increase your Constitution or Wisdom score by 1, to a maximum of 20.\n• You gain proficiency with cook's utensils if you don't already have it.\n• As part of a short rest, you can cook special food if you have ingredients and cook's utensils on hand. You can prepare enough for a number of creatures equal to 4 + your proficiency bonus. At the end of the short rest, any creature who eats the food and spends one or more Hit Dice to regain hit points regains an extra 1d8 hit points.\n• With one hour of work or when you finish a long rest, you can cook a number of treats equal to your proficiency bonus. They last 8 hours. A creature can use a bonus action to eat one and gain temporary hit points equal to your proficiency bonus."
  },
  {
    name: "Crusher",
    source: "TCE",
    ability:["str","con"],
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or CON, push a creature 5 ft when you deal bludgeoning damage, a bludgeoning crit gives advantage against it.",
    description: "You are practiced in the art of crushing your enemies:\n• Increase your Strength or Constitution by 1, to a maximum of 20.\n• Once per turn, when you hit a creature with an attack that deals bludgeoning damage, you can move it 5 feet to an unoccupied space, provided the target is no more than one size larger than you.\n• When you score a critical hit that deals bludgeoning damage to a creature, attack rolls against that creature are made with advantage until the start of your next turn."
  },
  {
    name: "Eldritch Adept",
    source: "TCE",
    invocationPick:true,
    prerequisite: "Spellcasting or Pact Magic feature",
    category: "Magic",
    summary: "Learn one Eldritch Invocation from the warlock class.",
    description: "Studying occult lore, you have unlocked eldritch power within yourself: you learn one Eldritch Invocation option of your choice from the warlock class. If the invocation has a prerequisite of any kind, you can choose it only if you're a warlock who meets the prerequisite.\nWhenever you gain a level, you can replace the invocation with another one from the warlock class."
  },
  {
    name: "Fighting Initiate",
    source: "TCE",
    stylePick:true,
    prerequisite: "Proficiency with a martial weapon",
    category: "Combat",
    summary: "Learn one Fighting Style from the fighter class.",
    description: "Your martial training has helped you develop a particular style of fighting. You learn one Fighting Style option of your choice from the fighter class. If you already have a style, the one you choose must be different.\nWhenever you reach a level that grants the Ability Score Improvement feature, you can replace this feat's fighting style with another one from the fighter class that you don't have."
  },
  {
    name: "Gunner",
    source: "TCE",
    ability:["dex"], weaponProfs:["Firearms"],
    prerequisite: "None",
    category: "Combat",
    summary: "+1 DEX, firearm proficiency, ignore the loading property of firearms, no disadvantage on ranged attacks in close combat.",
    description: "You have a quick hand and keen eye when employing firearms, granting you the following benefits:\n• Increase your Dexterity score by 1, to a maximum of 20.\n• You gain proficiency with firearms.\n• You ignore the loading property of firearms.\n• Being within 5 feet of a hostile creature doesn't impose disadvantage on your ranged attack rolls."
  },
  {
    name: "Metamagic Adept",
    source: "TCE",
    optionPicks:{set:"metamagic", count:2},
    prerequisite: "Spellcasting or Pact Magic feature",
    category: "Magic",
    summary: "Learn two Metamagic options and gain 2 sorcery points per long rest to spend on them.",
    description: "You've learned how to exert your will on your spells to alter how they function:\n• You learn two Metamagic options of your choice from the sorcerer class. You can use only one Metamagic option on a spell when you cast it, unless the option says otherwise. Whenever you reach a level that grants the Ability Score Improvement feature, you can replace one of these options with another one from the sorcerer class.\n• You gain 2 sorcery points to spend on Metamagic (added to any sorcery points you have from another source, but usable only on Metamagic). You regain all spent sorcery points when you finish a long rest."
  },
  {
    name: "Piercer",
    source: "TCE",
    ability:["str","dex"],
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or DEX, reroll one piercing damage die once per turn, a piercing crit rolls one more damage die.",
    description: "You have achieved a penetrating precision in combat:\n• Increase your Strength or Dexterity by 1, to a maximum of 20.\n• Once per turn, when you hit a creature with an attack that deals piercing damage, you can reroll one of the attack's damage dice, and you must use the new roll.\n• When you score a critical hit that deals piercing damage to a creature, you can roll one additional damage die when determining the extra piercing damage the target takes."
  },
  {
    name: "Poisoner",
    source: "TCE",
    tools:["Poisoner's kit"],
    prerequisite: "None",
    category: "Combat",
    summary: "Ignore poison resistance, coat a weapon as a bonus action, poisoner's kit, brew potent poison (DC 14, 2d8 poison and poisoned).",
    description: "You can prepare and deliver deadly poisons:\n• When you make a damage roll, you ignore resistance to poison damage.\n• You can coat a weapon in poison as a bonus action, instead of an action.\n• You gain proficiency with the poisoner's kit if you don't already have it. With one hour of work using a poisoner's kit and expending 50 gp worth of materials, you can create a number of doses of potent poison equal to your proficiency bonus. Once applied to a weapon or piece of ammunition, the poison retains its potency for 1 minute or until you hit with the weapon or ammunition. When a creature takes damage from the coated weapon or ammunition, it must succeed on a DC 14 Constitution saving throw or take 2d8 poison damage and become poisoned until the end of your next turn."
  },
  {
    name: "Shadow Touched",
    source: "TCE",
    ability:["int","wis","cha"],
    grantsSpells:["Invisibility"],
    spellPick:{count:1, level:1, schools:["Illusion","Necromancy"], label:"1st-level illusion or necromancy spell"},
    prerequisite: "None",
    category: "Magic",
    summary: "+1 INT/WIS/CHA, learn Invisibility and one 1st-level illusion or necromancy spell; cast each once per long rest without a slot.",
    description: "Your exposure to the Shadowfell's magic has changed you, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You learn the invisibility spell and one 1st-level spell of your choice. The 1st-level spell must be from the illusion or necromancy school of magic. You can cast each of these spells without expending a spell slot. Once you cast either of these spells in this way, you can't cast that spell in this way again until you finish a long rest. You can also cast these spells using spell slots you have of the appropriate level. The spells' spellcasting ability is the ability increased by this feat."
  },
  {
    name: "Slasher",
    source: "TCE",
    ability:["str","dex"],
    prerequisite: "None",
    category: "Combat",
    summary: "+1 STR or DEX, slashing hits cut the target's speed by 10 ft, a slashing crit gives it disadvantage on attacks.",
    description: "You've learned where to cut to have the greatest results:\n• Increase your Strength or Dexterity by 1, to a maximum of 20.\n• Once per turn when you hit a creature with an attack that deals slashing damage, you can reduce the speed of the target by 10 feet until the start of your next turn.\n• When you score a critical hit that deals slashing damage to a creature, you grievously wound it. Until the start of your next turn, the target has disadvantage on all attack rolls."
  },
  {
    name: "Telekinetic",
    source: "TCE",
    ability:["int","wis","cha"],
    grantsSpells:["Mage Hand"],
    prerequisite: "None",
    category: "Magic",
    summary: "+1 INT/WIS/CHA, an invisible Mage Hand cast without components, bonus action to shove a creature 5 ft with your mind.",
    description: "You learn to move things with your mind, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You learn the mage hand cantrip. You can cast it without verbal or somatic components, and you can make the spectral hand invisible. If you already know this spell, its range increases by 30 feet when you cast it. Its spellcasting ability is the ability increased by this feat.\n• As a bonus action, you can try to telekinetically shove one creature you can see within 30 feet of you. When you do so, the target must succeed on a Strength saving throw (DC 8 + your proficiency bonus + the ability modifier of the score increased by this feat) or be moved 5 feet toward you or away from you. A creature can willingly fail this save."
  },
  {
    name: "Telepathic",
    source: "TCE",
    ability:["int","wis","cha"],
    grantsSpells:["Detect Thoughts"],
    prerequisite: "None",
    category: "Magic",
    summary: "+1 INT/WIS/CHA, speak telepathically to a creature within 60 ft, cast Detect Thoughts once per long rest without a slot.",
    description: "You awaken the ability to mentally connect with others, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• You can speak telepathically to any creature you can see within 60 feet of you. Your telepathic utterances are in a language you know, and the creature understands you only if it knows that language. Your communication doesn't give the creature the ability to respond to you telepathically.\n• You can cast the detect thoughts spell, requiring no spell slot or components, and you must finish a long rest before you can cast it this way again. Your spellcasting ability for the spell is the ability increased by this feat. If you have spell slots of 2nd level or higher, you can cast this spell with them."
  },

  /* ---- Xanathar's Guide to Everything: racial feats ---- */
  {
    name: "Bountiful Luck",
    source: "XGE",
    requires:{races:HALFLINGS, raceLabel:"a halfling"},
    prerequisite: "Halfling",
    category: "Support",
    summary: "Reaction: let an ally within 30 ft reroll a 1 on an attack roll, ability check or saving throw.",
    description: "Your people have extraordinary luck, which you have learned to lend to your companions. When an ally you can see within 30 feet of you rolls a 1 on the d20 for an attack roll, an ability check, or a saving throw, you can use your reaction to let the ally reroll the die. The ally must use the new roll.\nWhen you use this ability, you can't use your Lucky racial trait before the end of your next turn."
  },
  {
    name: "Dragon Fear",
    source: "XGE",
    ability:["str","con","cha"],
    requires:{races:["Dragonborn"], raceLabel:"a dragonborn"},
    prerequisite: "Dragonborn",
    category: "Combat",
    summary: "+1 STR, CON or CHA, spend a Breath Weapon use to roar and frighten creatures within 30 ft.",
    description: "When angered, you radiate menace. You gain the following benefits:\n• Increase your Strength, Constitution, or Charisma score by 1, to a maximum of 20.\n• Instead of exhaling destructive energy, you can expend a use of your Breath Weapon trait to roar, forcing each creature of your choice within 30 feet of you to make a Wisdom saving throw (DC 8 + your proficiency bonus + your Charisma modifier). A target automatically succeeds if it can't hear or see you. On a failed save, a target becomes frightened of you for 1 minute. If the frightened target takes any damage, it can repeat the saving throw, ending the effect on itself on a success."
  },
  {
    name: "Dragon Hide",
    source: "XGE",
    ability:["str","con","cha"], unarmoredAc:13,
    requires:{races:["Dragonborn"], raceLabel:"a dragonborn"},
    prerequisite: "Dragonborn",
    category: "Defense",
    summary: "+1 STR, CON or CHA, scales give AC 13 + DEX without armor, claws deal 1d4 + STR slashing.",
    description: "You manifest scales and claws reminiscent of your draconic ancestors. You gain the following benefits:\n• Increase your Strength, Constitution, or Charisma score by 1, to a maximum of 20.\n• Your scales harden. While you aren't wearing armor, you can calculate your AC as 13 + your Dexterity modifier. You can use a shield and still gain this benefit.\n• You grow retractable claws from the tips of your fingers. Extending or retracting the claws requires no action. The claws are natural weapons, which you can use to make unarmed strikes. If you hit with them, you deal slashing damage equal to 1d4 + your Strength modifier, instead of the normal bludgeoning damage for an unarmed strike."
  },
  {
    name: "Drow High Magic",
    source: "XGE",
    castAbility:"cha",
    grantsSpells:[{name:"Detect Magic", use:"atwill"}, "Levitate", "Dispel Magic"],
    requires:{races:["Dark Elf (Drow)"], raceLabel:"a drow"},
    prerequisite: "Elf (drow)",
    category: "Magic",
    summary: "Cast Detect Magic at will, and Levitate and Dispel Magic once each per long rest, with Charisma.",
    description: "You learn more of the magic typical of dark elves. You learn the detect magic spell and can cast it at will, without expending a spell slot. You also learn levitate and dispel magic, each of which you can cast once without expending a spell slot. You regain the ability to cast those two spells in this way when you finish a long rest. Charisma is your spellcasting ability for all three spells."
  },
  {
    name: "Dwarven Fortitude",
    source: "XGE",
    ability:["con"],
    requires:{races:DWARVES, raceLabel:"a dwarf"},
    prerequisite: "Dwarf",
    category: "Defense",
    summary: "+1 CON, spend a Hit Die to heal when you take the Dodge action.",
    description: "You have the blood of dwarf heroes flowing through your veins. You gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• Whenever you take the Dodge action in combat, you can spend one Hit Die to heal yourself. Roll the die, add your Constitution modifier, and regain a number of hit points equal to the total (minimum of 1)."
  },
  {
    name: "Elven Accuracy",
    source: "XGE",
    ability:["dex","int","wis","cha"],
    requires:{races:ELVES.concat(["Half-Elf"]), raceLabel:"an elf or half-elf"},
    prerequisite: "Elf or half-elf",
    category: "Combat",
    summary: "+1 DEX, INT, WIS or CHA, reroll one die when you attack with advantage using one of those abilities.",
    description: "The accuracy of elves is legendary. You gain the following benefits:\n• Increase your Dexterity, Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Whenever you have advantage on an attack roll using Dexterity, Intelligence, Wisdom, or Charisma, you can reroll one of the dice once."
  },
  {
    name: "Fade Away",
    source: "XGE",
    ability:["dex","int"],
    requires:{races:GNOMES, raceLabel:"a gnome"},
    prerequisite: "Gnome",
    category: "Defense",
    summary: "+1 DEX or INT, reaction to turn invisible when you take damage, once per short or long rest.",
    description: "Your people are clever, with a knack for illusion magic. You have learned a magical trick for fading away when you suffer harm. You gain the following benefits:\n• Increase your Dexterity or Intelligence score by 1, to a maximum of 20.\n• Immediately after you take damage, you can use a reaction to magically become invisible until the end of your next turn or until you attack, deal damage, or force someone to make a saving throw. Once you use this ability, you can't do so again until you finish a short or long rest."
  },
  {
    name: "Fey Teleportation",
    source: "XGE",
    ability:["int","cha"], castAbility:"int",
    languages:["Sylvan"],
    grantsSpells:[{name:"Misty Step", use:"short"}],
    requires:{races:["High Elf"], raceLabel:"a high elf"},
    prerequisite: "Elf (high)",
    category: "Magic",
    summary: "+1 INT or CHA, learn Sylvan, cast Misty Step once per short or long rest without a slot.",
    description: "Your study of high elven lore has unlocked fey power that few other elves possess, except your eladrin cousins. You gain the following benefits:\n• Increase your Intelligence or Charisma score by 1, to a maximum of 20.\n• You learn to speak, read, and write Sylvan.\n• You learn the misty step spell and can cast it once without expending a spell slot. You regain the ability to cast it in this way when you finish a short or long rest. Intelligence is your spellcasting ability for this spell."
  },
  {
    name: "Flames of Phlegethos",
    source: "XGE",
    ability:["int","cha"],
    requires:{races:["Tiefling"], raceLabel:"a tiefling"},
    prerequisite: "Tiefling",
    category: "Magic",
    summary: "+1 INT or CHA, reroll 1s on fire spell damage, wreathe yourself in flames that burn melee attackers for 1d4.",
    description: "You learn to call on hellfire to serve your commands. You gain the following benefits:\n• Increase your Intelligence or Charisma score by 1, to a maximum of 20.\n• When you roll fire damage for a spell you cast, you can reroll any roll of 1 on the fire damage dice, but you must use the new roll, even if it is another 1.\n• Whenever you cast a spell that deals fire damage, you can cause flames to wreathe you until the end of your next turn. The flames don't harm you or your possessions, and they shed bright light out to 30 feet and dim light for an additional 30 feet. While the flames are present, any creature within 5 feet of you that hits you with a melee attack takes 1d4 fire damage."
  },
  {
    name: "Infernal Constitution",
    source: "XGE",
    ability:["con"],
    requires:{races:["Tiefling"], raceLabel:"a tiefling"},
    prerequisite: "Tiefling",
    category: "Defense",
    summary: "+1 CON, resistance to cold and poison damage, advantage on saves against being poisoned.",
    description: "Fiendish blood runs strong in you, unlocking a resilience akin to that possessed by some fiends. You gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• You have resistance to cold damage and poison damage.\n• You have advantage on saving throws against being poisoned."
  },
  {
    name: "Orcish Fury",
    source: "XGE",
    ability:["str","con"],
    requires:{races:["Half-Orc"], raceLabel:"a half-orc"},
    prerequisite: "Half-orc",
    category: "Combat",
    summary: "+1 STR or CON, one extra weapon damage die once per short or long rest, reaction attack after Relentless Endurance.",
    description: "Your inner fury burns tirelessly. You gain the following benefits:\n• Increase your Strength or Constitution score by 1, to a maximum of 20.\n• When you hit with an attack using a simple or martial weapon, you can roll one of the weapon's damage dice an additional time and add it as extra damage of the weapon's damage type. Once you use this ability, you can't use it again until you finish a short or long rest.\n• Immediately after you use your Relentless Endurance trait, you can use your reaction to make one weapon attack."
  },
  {
    name: "Prodigy",
    source: "XGE",
    skills:1, toolPicks:{count:1}, languagePicks:1, expertise:1,
    requires:{races:["Half-Elf","Half-Orc","Human","Variant Human"], raceLabel:"a half-elf, half-orc or human"},
    prerequisite: "Half-elf, half-orc, or human",
    category: "Utility",
    summary: "Gain one skill, one tool and one language, plus expertise in one skill you're proficient in.",
    description: "You have a knack for learning new things. You gain the following benefits:\n• You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.\n• Choose one skill in which you have proficiency. You gain expertise with that skill, which means your proficiency bonus is doubled for any ability check you make with it. The skill you choose must be one that isn't already benefiting from a feature, such as Expertise, that doubles your proficiency bonus."
  },
  {
    name: "Second Chance",
    source: "XGE",
    ability:["dex","con","cha"],
    requires:{races:HALFLINGS, raceLabel:"a halfling"},
    prerequisite: "Halfling",
    category: "Defense",
    summary: "+1 DEX, CON or CHA, reaction to make a creature reroll an attack that hit you, once per fight or rest.",
    description: "Fortune favors you when someone tries to strike you. You gain the following benefits:\n• Increase your Dexterity, Constitution, or Charisma score by 1, to a maximum of 20.\n• When a creature you can see hits you with an attack roll, you can use your reaction to force that creature to reroll. Once you use this ability, you can't use it again until you roll initiative at the start of combat or until you finish a short or long rest."
  },
  {
    name: "Squat Nimbleness",
    source: "XGE",
    ability:["str","dex"], speed:5, skills:1, skillOptions:["Acrobatics","Athletics"],
    requires:{races:DWARVES.concat(SMALL_RACES), raceLabel:"a dwarf or a Small race"},
    prerequisite: "Dwarf or a Small race",
    category: "Movement",
    summary: "+1 STR or DEX, +5 ft walking speed, proficiency in Acrobatics or Athletics, advantage to escape a grapple.",
    description: "You are uncommonly nimble for your race. You gain the following benefits:\n• Increase your Strength or Dexterity score by 1, to a maximum of 20.\n• Increase your walking speed by 5 feet.\n• You gain proficiency in the Acrobatics or Athletics skill (your choice).\n• You have advantage on any Strength (Athletics) or Dexterity (Acrobatics) check you make to escape from being grappled."
  },
  {
    name: "Wood Elf Magic",
    source: "XGE",
    castAbility:"wis",
    spellPick:{count:1, level:0, list:"Druid", label:"druid cantrip"},
    grantsSpells:["Longstrider", "Pass without Trace"],
    requires:{races:["Wood Elf"], raceLabel:"a wood elf"},
    prerequisite: "Elf (wood)",
    category: "Magic",
    summary: "Learn a druid cantrip, and cast Longstrider and Pass without Trace once each per long rest, with Wisdom.",
    description: "You learn the magic of the primeval woods, which are revered and protected by your people. You learn one druid cantrip of your choice. You also learn the longstrider and pass without trace spells, each of which you can cast once without expending a spell slot. You regain the ability to cast these two spells in this way when you finish a long rest. Wisdom is your spellcasting ability for all three spells."
  },

  /* ---- Mordenkainen's Tome of Foes ---- */
  {
    name: "Svirfneblin Magic",
    source: "MTF",
    castAbility:"int",
    grantsSpells:[{name:"Nondetection", use:"atwill"}, "Blindness/Deafness", "Blur", "Disguise Self"],
    requires:{races:["Deep Gnome (Svirfneblin)"], raceLabel:"a deep gnome"},
    prerequisite: "Gnome (deep gnome)",
    category: "Magic",
    summary: "Cast Nondetection on yourself at will, and Blindness/Deafness, Blur and Disguise Self once each per long rest, with Intelligence.",
    description: "You have inherited the innate spellcasting ability of your ancestors. This ability allows you to cast nondetection on yourself at will, without needing a material component. You can also cast each of the following spells once with this ability: blindness/deafness, blur, and disguise self. You regain the ability to cast these spells when you finish a long rest. Intelligence is your spellcasting ability for these spells."
  },

  /* ---- Eberron: Rising from the Last War ---- */
  {
    name: "Aberrant Dragonmark",
    source: "ERLW",
    ability:["con"], castAbility:"con",
    spellPick:[
      {count:1, level:0, list:"Sorcerer", label:"sorcerer cantrip"},
      {count:1, level:1, list:"Sorcerer", label:"1st-level sorcerer spell", use:"short"}
    ],
    prerequisite: "No other dragonmark",
    category: "Magic",
    summary: "+1 CON, learn a sorcerer cantrip and a 1st-level sorcerer spell (free once per short or long rest), with a Hit Die surge.",
    description: "You have manifested an aberrant dragonmark. Determine its appearance and the flaw associated with it. You gain the following benefits:\n• Increase your Constitution score by 1, to a maximum of 20.\n• You learn a cantrip of your choice from the sorcerer spell list. In addition, choose a 1st-level spell from the sorcerer spell list. You learn that spell and can cast it through your mark. Once you cast it, you must finish a short or long rest before you can cast it again through the mark. Constitution is your spellcasting ability for these spells.\n• When you cast the 1st-level spell through your mark, you can expend one of your Hit Dice and roll it. If you roll an even number, you gain a number of temporary hit points equal to the number rolled. If you roll an odd number, one random creature within 30 feet of you (not including you) takes force damage equal to the number rolled. If no other creatures are in range, you take the damage.\nYou also develop a random flaw from the Aberrant Dragonmark Flaws table. At your DM's option, the mark may grow in power from 10th level on."
  },
  {
    name: "Revenant Blade",
    source: "ERLW",
    ability:["dex","str"],
    requires:{races:ELVES, raceLabel:"an elf"},
    prerequisite: "Elf",
    category: "Combat",
    summary: "+1 DEX or STR, +1 AC while holding a double-bladed scimitar in two hands, and it counts as a finesse weapon.",
    description: "You are descended from a master of the double-bladed scimitar, and some of that mastery has passed on to you. You gain the following benefits:\n• Increase your Dexterity or Strength score by 1, to a maximum of 20.\n• While you are holding a double-bladed scimitar with two hands, you gain a +1 bonus to Armor Class.\n• A double-bladed scimitar has the finesse property when you wield it."
  },

  /* ---- Fizban's Treasury of Dragons ---- */
  {
    name: "Gift of the Chromatic Dragon",
    source: "FTD",
    prerequisite: "None",
    category: "Combat",
    summary: "Infuse a weapon with 1d4 elemental damage for 1 minute once per long rest, reaction to resist elemental damage.",
    description: "You've manifested some of the power of chromatic dragons, granting you the following benefits:\n• Chromatic Infusion. As a bonus action, you can touch a simple or martial weapon and infuse it with one of the following damage types: acid, cold, fire, lightning, or poison. For the next minute, the weapon deals an extra 1d4 damage of the chosen type when it hits. After you use this bonus action, you can't do so again until you finish a long rest.\n• Reactive Resistance. When you take acid, cold, fire, lightning, or poison damage, you can use your reaction to give yourself resistance to that instance of damage. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Gift of the Gem Dragon",
    source: "FTD",
    ability:["int","wis","cha"],
    prerequisite: "None",
    category: "Defense",
    summary: "+1 INT/WIS/CHA, reaction when damaged by a creature within 10 ft: 2d8 force and a 10 ft push (Strength save for half).",
    description: "You've manifested some of the power of gem dragons, granting you the following benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Telekinetic Reprisal. When you take damage from a creature that is within 10 feet of you, you can use your reaction to emanate telekinetic energy. The creature that dealt damage to you must make a Strength saving throw (DC 8 + your proficiency bonus + the ability modifier of the score increased by this feat). On a failed save, the creature takes 2d8 force damage and is pushed up to 10 feet away from you. On a successful save, the creature takes half as much damage and isn't pushed. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Gift of the Metallic Dragon",
    source: "FTD",
    castAbility:["int","wis","cha"],
    grantsSpells:["Cure Wounds"],
    prerequisite: "None",
    category: "Support",
    summary: "Cast Cure Wounds once per long rest without a slot, reaction to add your proficiency bonus to AC against one attack.",
    description: "You've manifested some of the power of metallic dragons, granting you the following benefits:\n• Draconic Healing. You learn the cure wounds spell. You can cast this spell without expending a spell slot. Once you cast it in this way, you can't do so again until you finish a long rest. You can also cast it using spell slots you have. The spell's spellcasting ability is Intelligence, Wisdom, or Charisma when you cast it with this feat (choose when you gain the feat).\n• Protective Wings. You can manifest protective wings that can shield you or others. When you or another creature you can see within 5 feet of you is hit by an attack roll, you can use your reaction to manifest spectral wings from your back for a moment. You grant a bonus to the target's AC equal to your proficiency bonus against that attack roll, potentially causing it to miss. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },

  /* ---- Strixhaven: A Curriculum of Chaos ---- */
  {
    name: "Strixhaven Initiate",
    source: "SCC",
    option:{label:"College", options:["Lorehold","Prismari","Quandrix","Silverquill","Witherbloom"]},
    castAbility:["int","wis","cha"],
    spellPick:[
      {count:2, level:0, label:"cantrip from your college's list", plural:"cantrips from your college's list", byOption:{
        "Lorehold":{names:["Light","Sacred Flame","Thaumaturgy"]},
        "Prismari":{names:["Fire Bolt","Prestidigitation","Ray of Frost"]},
        "Quandrix":{names:["Druidcraft","Guidance","Mage Hand"]},
        "Silverquill":{names:["Sacred Flame","Thaumaturgy","Vicious Mockery"]},
        "Witherbloom":{names:["Chill Touch","Druidcraft","Spare the Dying"]}}},
      {count:1, level:1, label:"1st-level spell from your college's lists", byOption:{
        "Lorehold":{list:["Cleric","Wizard"]},
        "Prismari":{list:["Bard","Sorcerer"]},
        "Quandrix":{list:["Druid","Wizard"]},
        "Silverquill":{list:["Bard","Cleric"]},
        "Witherbloom":{list:["Druid","Wizard"]}}}
    ],
    prerequisite: "None",
    category: "Magic",
    summary: "Choose a Strixhaven college: learn two of its cantrips and a 1st-level spell you can cast once per long rest without a slot.",
    description: "You have studied some magical theory and have learned a few spells associated with Strixhaven University. Choose one of Strixhaven's colleges: Lorehold, Prismari, Quandrix, Silverquill, or Witherbloom. You learn two cantrips and one 1st-level spell based on the college you choose:\n• Lorehold: two of light, sacred flame and thaumaturgy; a 1st-level cleric or wizard spell.\n• Prismari: two of fire bolt, prestidigitation and ray of frost; a 1st-level bard or sorcerer spell.\n• Quandrix: two of druidcraft, guidance and mage hand; a 1st-level druid or wizard spell.\n• Silverquill: two of sacred flame, thaumaturgy and vicious mockery; a 1st-level bard or cleric spell.\n• Witherbloom: two of chill touch, druidcraft and spare the dying; a 1st-level druid or wizard spell.\nYou can cast the chosen 1st-level spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast the spell using any spell slots you have.\nYour spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat)."
  },
  {
    name: "Strixhaven Mascot",
    source: "SCC",
    grantsSpells:[{name:"Find Familiar", use:"ritual"}],
    requires:{level:4, feat:"Strixhaven Initiate"},
    prerequisite: "4th level, Strixhaven Initiate feat",
    category: "Magic",
    summary: "Cast Find Familiar as a ritual for your college's mascot, let it attack in place of one of yours, swap places with it.",
    description: "You have learned how to summon a Strixhaven mascot to assist you, granting you these benefits:\n• You can cast the find familiar spell as a ritual. Your familiar can take the form of the mascot associated with the college you chose for the Strixhaven Initiate feat: a spirit statue (Lorehold), an art elemental (Prismari), a fractal (Quandrix), an inkling (Silverquill), or a pest (Witherbloom).\n• When you take the Attack action on your turn, you can forgo one attack to allow your mascot familiar to make one attack of its own with its reaction.\n• If your mascot familiar is within 60 feet of you, you can teleport as an action, swapping places with the familiar. If your destination space is too small for you to occupy, the teleportation fails and is wasted. Once you teleport in this way, you can't do so again until you finish a long rest, unless you expend a spell slot of 2nd level or higher to do it again."
  },

  /* ---- Dragonlance: Shadow of the Dragon Queen ---- */
  {
    name: "Squire of Solamnia",
    source: "DSotDQ",
    prerequisite: "Dragonlance campaign; fighter or paladin class, or Knight of Solamnia background",
    category: "Combat",
    summary: "Mount or dismount for 5 ft of movement; Precise Strike gives a weapon attack advantage and +1d8 damage on a hit.",
    description: "Your training in the ways of the Knights of Solamnia grants you these benefits:\n• Mount Up. Mounting or dismounting costs you only 5 feet of movement.\n• Precise Strike. Once per turn, when you make a weapon attack roll against a creature, you can cause the attack roll to have advantage. If the attack hits, you roll a d8 and add the number rolled as a bonus to the attack's damage roll. You can use this benefit a number of times equal to your proficiency bonus, but a use is expended only if the attack hits. You regain all expended uses when you finish a long rest."
  },
  {
    name: "Knight of the Crown",
    source: "DSotDQ",
    ability:["str","dex","con"],
    requires:{level:4, feat:"Squire of Solamnia"},
    prerequisite: "4th level, Squire of Solamnia feat",
    category: "Support",
    summary: "+1 STR, DEX or CON; bonus action to order an ally within 30 ft to attack with its reaction for +1d8 damage.",
    description: "You are a Knight of Solamnia aligned with the Order of the Crown, a group that extols the virtues of cooperation, loyalty, and obedience. You gain these benefits:\n• Increase your Strength, Dexterity, or Constitution score by 1, to a maximum of 20.\n• Commanding Rally. As a bonus action, you can command one ally within 30 feet of yourself to attack. If that ally can see or hear you, they can immediately make one weapon attack as a reaction. If the attack hits, the ally can roll a d8 and add the number rolled as a bonus to the attack's damage roll. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Knight of the Sword",
    source: "DSotDQ",
    ability:["int","wis","cha"],
    requires:{level:4, feat:"Squire of Solamnia"},
    prerequisite: "4th level, Squire of Solamnia feat",
    category: "Combat",
    summary: "+1 INT, WIS or CHA; once per turn a weapon hit can frighten the target (Wisdom save).",
    description: "You are a Knight of Solamnia aligned with the Order of the Sword, a group devoted to heroism and courage. You gain these benefits:\n• Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Demoralizing Strike. Once per turn, when you hit a creature with a weapon attack roll, you can attempt to frighten that target. The target must make a Wisdom saving throw (DC 8 + your proficiency bonus + the modifier of the ability score increased by this feat). On a failed save, the target is frightened of you until the end of your next turn. On a successful save, the target has disadvantage on the next attack roll it makes before the end of its next turn. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Knight of the Rose",
    source: "DSotDQ",
    ability:["con","wis","cha"],
    requires:{level:4, feat:"Squire of Solamnia"},
    prerequisite: "4th level, Squire of Solamnia feat",
    category: "Support",
    summary: "+1 CON, WIS or CHA; bonus action to give a creature within 30 ft temporary HP (1d8 + proficiency + the raised ability).",
    description: "You are a Knight of Solamnia aligned with the Order of the Rose, a group known for leadership, justice, and wisdom. You gain these benefits:\n• Increase your Constitution, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Bolstering Rally. As a bonus action, you can encourage one creature you can see within 30 feet of yourself (you can choose yourself). If the target can see or hear you, the target gains temporary hit points equal to 1d8 + your proficiency bonus + the ability modifier of the ability score increased by this feat. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Initiate of High Sorcery",
    source: "DSotDQ",
    option:{label:"Moon", options:["Nuitari","Lunitari","Solinari"], details:{
      "Nuitari":"The black moon. Spells: dissonant whispers, false life, hex, ray of sickness.",
      "Lunitari":"The red moon. Spells: color spray, disguise self, feather fall, longstrider.",
      "Solinari":"The white moon. Spells: comprehend languages, detect evil and good, protection from evil and good, shield."}},
    castAbility:["int","wis","cha"],
    spellPick:[
      {count:1, level:0, list:"Wizard", label:"wizard cantrip"},
      {count:2, level:1, label:"1st-level spell from your moon's list", plural:"1st-level spells from your moon's list", byOption:{
        "Nuitari":{names:["Dissonant Whispers","False Life","Hex","Ray of Sickness"]},
        "Lunitari":{names:["Color Spray","Disguise Self","Feather Fall","Longstrider"]},
        "Solinari":{names:["Comprehend Languages","Detect Evil and Good","Protection from Evil and Good","Shield"]}}}
    ],
    prerequisite: "Dragonlance campaign; sorcerer or wizard class, or Mage of High Sorcery background",
    category: "Magic",
    summary: "Choose a moon of Krynn: learn a wizard cantrip and two of the moon's 1st-level spells, each free once per long rest.",
    description: "You've received training from magic-users affiliated with the Mages of High Sorcery. Choose one of the three moons of Krynn to influence your magic: the black moon, Nuitari; the red moon, Lunitari; or the white moon, Solinari. You learn one cantrip of your choice from the wizard spell list and two 1st-level spells based on the moon you choose:\n• Nuitari: choose two from dissonant whispers, false life, hex, and ray of sickness.\n• Lunitari: choose two from color spray, disguise self, feather fall, and longstrider.\n• Solinari: choose two from comprehend languages, detect evil and good, protection from evil and good, and shield.\nYou can cast each of the chosen 1st-level spells without a spell slot, and you must finish a long rest before you can cast them in this way again. You can also cast the spells using any spell slots you have.\nYour spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat)."
  },
  {
    name: "Adept of the Black Robes",
    source: "DSotDQ",
    castAbility:{feat:"Initiate of High Sorcery"},
    spellPick:{count:1, level:2, schools:["Enchantment","Necromancy"], label:"2nd-level enchantment or necromancy spell"},
    requires:{level:4, feat:"Initiate of High Sorcery", option:"Nuitari"},
    prerequisite: "4th level, Initiate of High Sorcery (Nuitari) feat",
    category: "Magic",
    summary: "Learn a 2nd-level enchantment or necromancy spell (free once per long rest); spend Hit Dice to add damage to your spells.",
    description: "You chose the moon Nuitari to influence your magic, and your ambition and loyalty to the Order of the Black Robes has been recognized, granting you these benefits:\n• Ambitious Magic. You learn one 2nd-level spell of your choice. The spell must be from the enchantment or necromancy school of magic. You can cast this spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using spell slots you have of the appropriate level. The spell's spellcasting ability is the one chosen when you gained the Initiate of High Sorcery feat.\n• Life Channel. You can channel your life force into the power of your magic. When a creature you can see within 60 feet of you fails a saving throw against a spell that deals damage that you cast, you can expend a number of Hit Dice equal to the level of the spell. Roll the expended Hit Dice and add them together. The damage that the creature takes increases by an amount equal to that total."
  },
  {
    name: "Adept of the Red Robes",
    source: "DSotDQ",
    castAbility:{feat:"Initiate of High Sorcery"},
    spellPick:{count:1, level:2, schools:["Illusion","Transmutation"], label:"2nd-level illusion or transmutation spell"},
    requires:{level:4, feat:"Initiate of High Sorcery", option:"Lunitari"},
    prerequisite: "4th level, Initiate of High Sorcery (Lunitari) feat",
    category: "Magic",
    summary: "Learn a 2nd-level illusion or transmutation spell (free once per long rest); treat a d20 roll of 9 or lower as a 10.",
    description: "You chose the moon Lunitari to influence your magic, and your dedication to maintaining the balance between all things has been recognized by the Order of the Red Robes, granting you these benefits:\n• Insightful Magic. You learn one 2nd-level spell of your choice. The spell must be from the illusion or transmutation school of magic. You can cast this spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using spell slots you have of the appropriate level. The spell's spellcasting ability is the one chosen when you gained the Initiate of High Sorcery feat.\n• Magical Balance. When you make an attack roll or an ability check, you can treat a roll of 9 or lower on the d20 as a 10. You can balance fate in this way a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Adept of the White Robes",
    source: "DSotDQ",
    castAbility:{feat:"Initiate of High Sorcery"},
    spellPick:{count:1, level:2, schools:["Abjuration","Divination"], label:"2nd-level abjuration or divination spell"},
    requires:{level:4, feat:"Initiate of High Sorcery", option:"Solinari"},
    prerequisite: "4th level, Initiate of High Sorcery (Solinari) feat",
    category: "Magic",
    summary: "Learn a 2nd-level abjuration or divination spell (free once per long rest); spend a spell slot to reduce damage as a reaction.",
    description: "You chose the moon Solinari to influence your magic, and your oath to use magic to make the world a better place has been recognized by the Order of the White Robes, granting you these benefits:\n• Protective Magic. You learn one 2nd-level spell of your choice. The spell must be from the abjuration or divination school of magic. You can cast this spell without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using spell slots you have of the appropriate level. The spell's spellcasting ability is the one chosen when you gained the Initiate of High Sorcery feat.\n• Protective Ward. When you or a creature you can see within 30 feet of you takes damage, you can use your reaction to expend a spell slot and weave protective magic around the target. Roll a number of d6s equal to the level of the spell slot expended and reduce the damage the target takes by the total rolled on those dice + your spellcasting ability modifier."
  },
  {
    name: "Divinely Favored",
    source: "DSotDQ",
    option:{label:"Alignment", options:["Good","Neutral","Evil"], details:{
      "Good":"Your 1st-level spell comes from the cleric spell list.",
      "Neutral":"Your 1st-level spell comes from the druid spell list.",
      "Evil":"Your 1st-level spell comes from the warlock spell list."}},
    castAbility:["int","wis","cha"],
    grantsSpells:["Augury"],
    spellPick:[
      {count:1, level:0, list:"Cleric", label:"cleric cantrip"},
      {count:1, level:1, label:"1st-level spell for your alignment", byOption:{
        "Good":{list:"Cleric"}, "Neutral":{list:"Druid"}, "Evil":{list:"Warlock"}}}
    ],
    requires:{level:4},
    prerequisite: "4th level, Dragonlance campaign",
    category: "Magic",
    summary: "Learn a cleric cantrip, a 1st-level spell set by your alignment and Augury; cast each leveled spell once per long rest for free.",
    description: "A god chose you to carry a spark of their power:\n• You learn one cantrip of your choice from the cleric spell list and one 1st-level spell based on the alignment of your character: evil, a 1st-level warlock spell; good, a 1st-level cleric spell; neutral, a 1st-level druid spell.\n• You also learn the augury spell.\n• You can cast the chosen 1st-level spell and the augury spell without a spell slot, and you must finish a long rest before you can cast either of these spells in this way again. You can also cast these spells using spell slots you have of the appropriate level.\n• Your spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat).\n• You can use a holy symbol as a spellcasting focus for any spell you cast that uses the spellcasting ability you choose when you select this feat."
  },

  /* ---- Bigby Presents: Glory of the Giants ---- */
  {
    name: "Strike of the Giants",
    source: "BGG",
    option:{label:"Strike", options:["Cloud Strike","Fire Strike","Frost Strike","Hill Strike","Stone Strike","Storm Strike"], details:{
      "Cloud Strike":"The target takes an extra 1d4 thunder damage. If the target is a creature, it must succeed on a Wisdom saving throw, or you become invisible to it until the start of your next turn or until immediately after you make an attack roll or cast a spell.",
      "Fire Strike":"The target takes an extra 1d10 fire damage.",
      "Frost Strike":"The target takes an extra 1d6 cold damage. If the target is a creature, it must succeed on a Constitution saving throw, or its speed is reduced to 0 until the start of your next turn.",
      "Hill Strike":"The target takes an extra 1d6 damage of the weapon's type. If the target is a creature, it must succeed on a Strength saving throw or have the prone condition.",
      "Stone Strike":"The target takes an extra 1d6 force damage. If the target is a creature, it must succeed on a Strength saving throw or be pushed 10 feet from you in a straight line.",
      "Storm Strike":"The target takes an extra 1d6 lightning damage. If the target is a creature, it must succeed on a Constitution saving throw, or it has disadvantage on attack rolls until the start of your next turn."}},
    prerequisite: "Martial weapon proficiency or Giant Foundling background",
    category: "Combat",
    summary: "Choose a giant's strike; once per turn a melee or thrown weapon hit adds its damage and effect, proficiency bonus times per long rest.",
    description: "You have absorbed primeval magic that gives you an echo of the might of giants. When you gain this feat, choose one of the benefits listed below. Once per turn, when you hit a target with a melee weapon attack or a ranged weapon attack using a thrown weapon, you can imbue the attack with an additional effect depending on the benefit you chose. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.\nIf a benefit requires a saving throw, the DC equals 8 + your proficiency bonus + your Strength or Constitution modifier (your choice).\n• Cloud Strike: an extra 1d4 thunder damage; a creature must succeed on a Wisdom save or you become invisible to it until the start of your next turn or until immediately after you make an attack roll or cast a spell.\n• Fire Strike: an extra 1d10 fire damage.\n• Frost Strike: an extra 1d6 cold damage; a creature must succeed on a Constitution save or its speed is reduced to 0 until the start of your next turn.\n• Hill Strike: an extra 1d6 damage of the weapon's type; a creature must succeed on a Strength save or fall prone.\n• Stone Strike: an extra 1d6 force damage; a creature must succeed on a Strength save or be pushed 10 feet from you in a straight line.\n• Storm Strike: an extra 1d6 lightning damage; a creature must succeed on a Constitution save or have disadvantage on attack rolls until the start of your next turn."
  },
  {
    name: "Rune Shaper",
    source: "BGG",
    castAbility:["int","wis","cha"],
    grantsSpells:["Comprehend Languages"],
    spellPick:{count:"halfPb", level:1, label:"rune", plural:"runes", tags:{
      "Fog Cloud":"Cloud rune", "Inflict Wounds":"Death rune", "Chromatic Orb":"Dragon rune", "Disguise Self":"Enemy rune",
      "Burning Hands":"Fire rune", "Speak with Animals":"Friend rune", "Armor of Agathys":"Frost rune", "Goodberry":"Hill rune",
      "Longstrider":"Journey rune", "Command":"King rune", "Entangle":"Mountain rune", "Sanctuary":"Stone rune", "Thunderwave":"Storm rune"},
      names:["Fog Cloud","Inflict Wounds","Chromatic Orb","Disguise Self","Burning Hands","Speak with Animals","Armor of Agathys","Goodberry","Longstrider","Command","Entangle","Sanctuary","Thunderwave"]},
    prerequisite: "Spellcasting feature or Rune Carver background",
    category: "Magic",
    summary: "Cast Comprehend Languages once per long rest for free; know runes (half your proficiency bonus), each giving a 1st-level spell with a free cast.",
    description: "You've studied the magic of giant runes:\n• You learn the comprehend languages spell. You can cast it without a spell slot, and you must finish a long rest before you can cast it in this way again. You can also cast it using any spell slots you have.\n• Rune Magic. You know a number of runes equal to half your proficiency bonus (rounded down), chosen from the Rune Spells list. Whenever you gain a level, you can replace one rune you know with a different one. When you finish a long rest, you can inscribe each rune you know onto a nonmagical weapon, armor, piece of clothing, or other object you touch. You temporarily learn the 1st-level spell that corresponds to each rune you inscribed, and you know that spell until you finish a long rest, when the rune fades.\n• While you are wearing or carrying any rune-marked object, you can cast the spells associated with its runes using any spell slots you have. You can also invoke a rune to cast its spell without a spell slot and without material components; once you do, you can't invoke that rune again until you finish a long rest.\n• Your spellcasting ability for this feat's spells is Intelligence, Wisdom, or Charisma (choose when you select this feat).\nRune Spells: Cloud (fog cloud), Death (inflict wounds), Dragon (chromatic orb), Enemy (disguise self), Fire (burning hands), Friend (speak with animals), Frost (armor of Agathys), Hill (goodberry), Journey (longstrider), King (command), Mountain (entangle), Stone (sanctuary), Storm (thunderwave)."
  },
  {
    name: "Ember of the Fire Giant",
    source: "BGG",
    ability:["str","con","wis"],
    requires:{level:4, feat:"Strike of the Giants", option:"Fire Strike"},
    prerequisite: "4th level, Strike of the Giants (Fire Strike) feat",
    category: "Combat",
    summary: "+1 STR, CON or WIS, fire resistance; replace an attack with a 15 ft burst of flame (1d8 + proficiency fire, blinded).",
    description: "You've manifested the fiery combat emblematic of fire giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Born of Flame. You have resistance to fire damage.\n• Searing Ignition. When you take the Attack action on your turn, you can replace a single attack with a magical burst of flame. Each creature of your choice in a 15-foot-radius sphere centered on you must make a Dexterity saving throw (DC 8 + your proficiency bonus + the modifier of the ability increased by this feat). On a failed save, a creature takes fire damage equal to 1d8 + your proficiency bonus and is blinded until the start of your next turn. On a successful save, a creature takes half as much damage only. You can use Searing Ignition a number of times equal to your proficiency bonus (but no more than once per turn), and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Fury of the Frost Giant",
    source: "BGG",
    ability:["str","con","wis"],
    requires:{level:4, feat:"Strike of the Giants", option:"Frost Strike"},
    prerequisite: "4th level, Strike of the Giants (Frost Strike) feat",
    category: "Defense",
    summary: "+1 STR, CON or WIS, cold resistance; reaction when hit to blast the attacker (1d8 + proficiency cold, speed 0).",
    description: "You've manifested the icy might emblematic of frost giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Born of Ice. You have resistance to cold damage.\n• Frigid Retaliation. Immediately after a creature you can see within 30 feet of you hits you with an attack roll and deals damage, you can use your reaction to retaliate with a conjured blast of ice. The creature must make a Constitution saving throw (DC 8 + your proficiency bonus + the modifier of the ability increased by this feat). On a failed save, the creature takes cold damage equal to 1d8 + your proficiency bonus, and its speed is reduced to 0 until the end of its next turn. You can use Frigid Retaliation a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Guile of the Cloud Giant",
    source: "BGG",
    ability:["str","con","cha"],
    requires:{level:4, feat:"Strike of the Giants", option:"Cloud Strike"},
    prerequisite: "4th level, Strike of the Giants (Cloud Strike) feat",
    category: "Defense",
    summary: "+1 STR, CON or CHA; reaction when hit to resist the attack's damage and teleport up to 30 ft.",
    description: "You've manifested the confounding magic emblematic of cloud giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Charisma score by 1, to a maximum of 20.\n• Cloudy Escape. When a creature you can see hits you with an attack roll, you can use your reaction to give yourself resistance to that attack's damage. You then teleport to an unoccupied space that you can see within 30 feet of yourself. You can use this reaction a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Keenness of the Stone Giant",
    source: "BGG",
    ability:["str","con","wis"], darkvision:{range:60, add:60},
    requires:{level:4, feat:"Strike of the Giants", option:"Stone Strike"},
    prerequisite: "4th level, Strike of the Giants (Stone Strike) feat",
    category: "Combat",
    summary: "+1 STR, CON or WIS, darkvision 60 ft (or +60 ft); bonus action to hurl a rock (1d10 force, knocked prone).",
    description: "You've manifested the physical talents emblematic of stone giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Cavernous Sight. You gain darkvision with a range of 60 feet. If you already have darkvision, its range increases by 60 feet.\n• Stone Throw. As a bonus action, you can take a rock and make a magical attack with it. The attack is a ranged spell attack with a range of 60 feet that uses the ability score you increased with this feat as the spellcasting ability. On a hit, the rock deals 1d10 force damage, and the target must succeed on a Strength saving throw (DC 8 + your proficiency bonus + the spellcasting ability modifier) or be knocked prone. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Soul of the Storm Giant",
    source: "BGG",
    ability:["str","wis","cha"],
    requires:{level:4, feat:"Strike of the Giants", option:"Storm Strike"},
    prerequisite: "4th level, Strike of the Giants (Storm Strike) feat",
    category: "Defense",
    summary: "+1 STR, WIS or CHA; bonus action aura (10 ft): lightning and thunder resistance, attacks against you have disadvantage.",
    description: "You've manifested the tempestuous might emblematic of storm giants, granting you the following benefits:\n• Increase your Strength, Wisdom, or Charisma score by 1, to a maximum of 20.\n• Maelstrom Aura. As a bonus action, you surround yourself with an aura of magical wind and lightning that extends 10 feet from you in every direction but not through total cover. The aura lasts until the start of your next turn or until you are incapacitated. While the aura is active, you have resistance to lightning and thunder damage, and attack rolls against you have disadvantage. Whenever another creature starts its turn within the aura, you can force it to make a Strength saving throw (DC 8 + your proficiency bonus + the modifier of the ability increased by this feat). On a failed save, the creature's speed is halved until the start of its next turn. You can use this bonus action a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Vigor of the Hill Giant",
    source: "BGG",
    ability:["str","con","wis"],
    requires:{level:4, feat:"Strike of the Giants", option:"Hill Strike"},
    prerequisite: "4th level, Strike of the Giants (Hill Strike) feat",
    category: "Defense",
    summary: "+1 STR, CON or WIS; reaction to not be moved or knocked prone, extra healing when you eat and spend Hit Dice.",
    description: "You've manifested the resilience emblematic of hill giants, granting you the following benefits:\n• Increase your Strength, Constitution, or Wisdom score by 1, to a maximum of 20.\n• Bulwark. When you are subjected to an effect that would move you at least 5 feet or knock you prone, you can use your reaction to steady yourself. You are neither moved nor knocked prone.\n• Iron Stomach. Whenever you eat food as part of a short rest and spend one or more Hit Dice to regain hit points, you regain additional hit points equal to your Constitution modifier + your proficiency bonus."
  },

  /* ---- Planescape: Adventures in the Multiverse ---- */
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
    summary: "Choose a kind of Outer Plane: gain a damage resistance and a cantrip tied to it.",
    description: "You are infused with the energy of an Outer Plane or the Outlands. Choose a type of plane; it gives you resistance to a damage type and a cantrip:\n• Chaotic Outer Plane: poison resistance, minor illusion.\n• Evil Outer Plane: necrotic resistance, chill touch.\n• Good Outer Plane: radiant resistance, sacred flame.\n• Lawful Outer Plane: force resistance, guidance.\n• The Outlands: psychic resistance, mage hand.\nYou can cast the cantrip without material components, and your spellcasting ability for it is Intelligence, Wisdom, or Charisma (choose when you select this feat)."
  },
  {
    name: "Agent of Order",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Lawful Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Lawful Outer Plane) feat",
    category: "Combat",
    summary: "+1 to any ability; once per turn deal an extra 1d8 force damage and restrain the target (Wisdom save).",
    description: "You can channel cosmic forces of order to bind your foes. You gain the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Stasis Strike. Once per turn, when you deal damage to a creature you can see within 60 feet of yourself, you can deal an extra 1d8 force damage to the target, and it must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + the modifier of the spellcasting ability you chose for the Scion of the Outer Planes feat) or have the restrained condition until the start of your next turn. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Baleful Scion",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Evil Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Evil Outer Plane) feat",
    category: "Combat",
    summary: "+1 to any ability; once per turn deal 1d6 + proficiency extra necrotic damage and regain that many hit points.",
    description: "You can channel sinister forces to drain the life of your foes. You gain the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Grasp of Avarice. Once per turn, when you deal damage to a creature you can see within 60 feet of yourself, you can also deal necrotic damage to it equal to 1d6 + your proficiency bonus. You then regain hit points equal to the necrotic damage dealt. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },
  {
    name: "Cohort of Chaos",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Chaotic Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Chaotic Outer Plane) feat",
    category: "General",
    summary: "+1 to any ability; rolling a 1 or 20 on an attack roll or saving throw sets off a random chaotic flare.",
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
    summary: "+1 to any ability; cast Misty Step and Tongues once each per long rest without a slot.",
    description: "Your connection to the crossroads of the multiverse grants you the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Crossroads Emissary. You learn the misty step and tongues spells. You can cast each of them once without a spell slot (tongues without material components), and you must finish a long rest before you can cast that spell in this way again. You can also cast these spells using spell slots you have of the appropriate level. Their spellcasting ability is the one chosen when you gained the Scion of the Outer Planes feat."
  },
  {
    name: "Planar Wanderer",
    source: "PAitM",
    requires:{level:4, feat:"Scion of the Outer Planes"},
    prerequisite: "4th level, Scion of the Outer Planes feat",
    category: "Utility",
    summary: "Choose acid, cold or fire resistance after each long rest, force portals open, sense nearby portals.",
    description: "You can draw on the forces of the multiverse to survive in and traverse its planes. You gain the following benefits:\n• Planar Adaptation. When you finish a long rest, you gain resistance to acid, cold, or fire damage (your choice) until you finish your next long rest.\n• Portal Cracker. You can use an action to concentrate on a portal you're aware of within 5 feet of you and make a DC 20 Intelligence (Arcana) check. On a failed check, you take 3d8 psychic damage and can't use this benefit on that portal again until you finish a long rest. On a successful check, you can force the portal open or closed for 1 hour, during which it ignores its portal key unless a creature using the key succeeds on a DC 20 Intelligence (Arcana) check as an action.\n• Portal Sense. You know the direction to the last planar portal you used while you and the portal are on the same plane. As an action, you can detect any portals within 30 feet of you that aren't behind total cover. Once you use this action, you can't use it again until you finish a long rest."
  },
  {
    name: "Righteous Heritor",
    source: "PAitM",
    ability:["str","dex","con","int","wis","cha"],
    requires:{level:4, feat:"Scion of the Outer Planes", option:"Good Outer Plane"},
    prerequisite: "4th level, Scion of the Outer Planes (Good Outer Plane) feat",
    category: "Support",
    summary: "+1 to any ability; reaction to reduce damage to you or a creature within 30 ft by 1d10 + your proficiency bonus.",
    description: "You can channel benevolent forces to protect others. You gain the following benefits:\n• Increase one ability score of your choice by 1, to a maximum of 20.\n• Soothe Pain. When you or a creature within 30 feet of you takes damage, you can use your reaction to reduce that damage by 1d10 + your proficiency bonus. You can use this benefit a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest."
  },

  /* ---- The Book of Many Things ---- */
  {
    name: "Cartomancer",
    source: "BMT",
    grantsSpells:["Prestidigitation"],
    requires:{level:4},
    prerequisite: "4th level, Spellcasting feature",
    category: "Magic",
    summary: "Learn Prestidigitation for card tricks; after a long rest, store a spell in a card to cast later as a bonus action.",
    description: "You have learned to channel your magic through a deck of cards, which you can use as a spellcasting focus. You gain the following benefits:\n• Card Tricks. You learn the prestidigitation cantrip and can use it to create illusions that duplicate the effects of stage magic. When you use a card deck as your focus, you can conceal the verbal and somatic components of the cantrip in ordinary conversation and card handling.\n• Hidden Ace. When you finish a long rest, you can choose one spell from your class's spell list and imbue that spell into a card. The spell must have a casting time of 1 action, and it must be of a level for which you have spell slots. The card stays imbued for 8 hours. While you hold it, you can use a bonus action to flourish the card and cast the spell within. The card then loses its magic."
  }
];
