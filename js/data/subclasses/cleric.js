/* Cleric subclasses: the full feature list for each one, keyed by class
   level. Assembled into SUBCLASSES in ../progression.js; see the comment
   there for the feature fields and flags. */
export var CLERIC_SUBCLASSES = [
  {name:"Life Domain", blurb:"The healer's domain: tougher armor and stronger heals.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Bless and Cure Wounds prepared; they don't count against your prepared spells."},
      {name:"Bonus Proficiency", text:"You gain proficiency with heavy armor.", grants:{armor:["Heavy armor"]}},
      {name:"Disciple of Life", text:"Whenever you use a spell of 1st level or higher to restore hit points to a creature, it regains an extra 2 + the spell's level hit points."}
    ],
    2:[{name:"Channel Divinity: Preserve Life", text:"As an action, restore hit points equal to five times your cleric level, split as you choose among creatures within 30 feet. This can't raise a creature above half its hit point maximum, and has no effect on undead or constructs."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bless, Cure Wounds, Lesser Restoration and Spiritual Weapon prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bless, Cure Wounds, Lesser Restoration, Spiritual Weapon, Beacon of Hope and Revivify prepared; they don't count against your prepared spells."}],
    6:[{name:"Blessed Healer", text:"When you cast a spell of 1st level or higher that restores hit points to a creature other than you, you regain 2 + the spell's level hit points."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bless, Cure Wounds, Lesser Restoration, Spiritual Weapon, Beacon of Hope, Revivify, Death Ward and Guardian of Faith prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 radiant damage. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bless, Cure Wounds, Lesser Restoration, Spiritual Weapon, Beacon of Hope, Revivify, Death Ward, Guardian of Faith, Mass Cure Wounds and Raise Dead prepared; they don't count against your prepared spells."}],
    17:[{name:"Supreme Healing", text:"When you would roll dice to restore hit points with a spell, you instead use the highest number possible for each die."}]
  }},
  {name:"Light Domain", blurb:"Wields fire and radiance against darkness.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Burning Hands and Faerie Fire prepared; they don't count against your prepared spells."},
      {name:"Bonus Cantrip", text:"You learn the Light cantrip (it doesn't count against your cantrips known)."},
      {name:"Warding Flare", text:"When a creature you can see within 30 feet attacks you, you can use your reaction to impose disadvantage on the attack roll before it hits or misses. Creatures that can't be blinded are immune. Uses equal to your Wisdom modifier (minimum 1) per long rest."}
    ],
    2:[{name:"Channel Divinity: Radiance of the Dawn", text:"As an action, dispel any magical darkness within 30 feet. Each hostile creature within 30 feet makes a CON save, taking 2d10 + your cleric level radiant damage on a failure or half on a success. Creatures behind total cover aren't affected."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Burning Hands, Faerie Fire, Flaming Sphere and Scorching Ray prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Burning Hands, Faerie Fire, Flaming Sphere, Scorching Ray, Daylight and Fireball prepared; they don't count against your prepared spells."}],
    6:[{name:"Improved Flare", text:"You can also use Warding Flare when a creature you can see within 30 feet attacks a creature other than you."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Burning Hands, Faerie Fire, Flaming Sphere, Scorching Ray, Daylight, Fireball, Guardian of Faith and Wall of Fire prepared; they don't count against your prepared spells."}],
    8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Burning Hands, Faerie Fire, Flaming Sphere, Scorching Ray, Daylight, Fireball, Guardian of Faith, Wall of Fire, Flame Strike and Scrying prepared; they don't count against your prepared spells."}],
    17:[{name:"Corona of Light", text:"As an action, surround yourself with an aura of sunlight for 1 minute (or until you dismiss it with another action): bright light in a 60-foot radius and dim light for 30 feet beyond. Your enemies in the bright light have disadvantage on saving throws against any spell that deals fire or radiant damage."}]
  }},
  {name:"War Domain", blurb:"A warrior-priest who fights in heavy armor.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Divine Favor and Shield of Faith prepared; they don't count against your prepared spells."},
      {name:"Bonus Proficiencies", text:"Proficiency with martial weapons and heavy armor.", grants:{armor:["Heavy armor"], weapons:["Martial weapons"]}},
      {name:"War Priest", text:"When you take the Attack action, you can make one weapon attack as a bonus action. Uses equal to your Wisdom modifier (minimum 1) per long rest."}
    ],
    2:[{name:"Channel Divinity: Guided Strike", text:"When you make an attack roll, you can add +10 to it, deciding after you see the roll but before the DM says whether it hits."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Divine Favor, Shield of Faith, Magic Weapon and Spiritual Weapon prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Divine Favor, Shield of Faith, Magic Weapon, Spiritual Weapon, Crusader's Mantle and Spirit Guardians prepared; they don't count against your prepared spells."}],
    6:[{name:"Channel Divinity: War God's Blessing", text:"When a creature within 30 feet makes an attack roll, you can use your reaction and Channel Divinity to give it +10 to the roll, deciding after you see the roll but before the DM says whether it hits."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Divine Favor, Shield of Faith, Magic Weapon, Spiritual Weapon, Crusader's Mantle, Spirit Guardians, Freedom of Movement and Stoneskin prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 damage of the same type as the weapon. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Divine Favor, Shield of Faith, Magic Weapon, Spiritual Weapon, Crusader's Mantle, Spirit Guardians, Freedom of Movement, Stoneskin, Flame Strike and Hold Monster prepared; they don't count against your prepared spells."}],
    17:[{name:"Avatar of Battle", text:"You have resistance to bludgeoning, piercing and slashing damage from nonmagical weapons."}]
  }},
  {name:"Knowledge Domain", blurb:"Seeks and guards secrets and lore.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Command and Identify prepared; they don't count against your prepared spells."},
      {name:"Blessings of Knowledge", text:"You learn two languages and gain proficiency in two of Arcana, History, Nature or Religion. Your proficiency bonus is doubled for checks with those two skills. Tick them on the Abilities & Skills tab."}
    ],
    2:[{name:"Channel Divinity: Knowledge of the Ages", text:"As an action, choose one skill or tool. For 10 minutes, you are proficient with it."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Identify, Augury and Suggestion prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Identify, Augury, Suggestion, Nondetection and Speak with Dead prepared; they don't count against your prepared spells."}],
    6:[{name:"Channel Divinity: Read Thoughts", text:"As an action, choose a creature you can see within 60 feet. It makes a WIS save. On a failure, you read its surface thoughts for 1 minute while it stays within 60 feet, and during that time you can use an action to end the effect and cast Suggestion on it without a spell slot; it automatically fails the save. On a success, you can't use this on it again until you finish a long rest."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Identify, Augury, Suggestion, Nondetection, Speak with Dead, Arcane Eye and Confusion prepared; they don't count against your prepared spells."}],
    8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Identify, Augury, Suggestion, Nondetection, Speak with Dead, Arcane Eye, Confusion, Legend Lore and Scrying prepared; they don't count against your prepared spells."}],
    17:[{name:"Visions of the Past", text:"After at least 1 minute of meditation and prayer, you receive glimpses of the past, meditating for up to a number of minutes equal to your WIS score (as if concentrating on a spell). Object Reading: holding an object, you see its previous owner, how they got and lost it, and the most recent significant event involving it. Area Reading: you see significant events in your immediate surroundings (a room, street, tunnel or clearing) going back a number of days equal to your WIS score. Once per short or long rest."}]
  }},
  {name:"Tempest Domain", blurb:"Commands storms, thunder and lightning.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Fog Cloud and Thunderwave prepared; they don't count against your prepared spells."},
      {name:"Bonus Proficiencies", text:"Proficiency with martial weapons and heavy armor.", grants:{armor:["Heavy armor"], weapons:["Martial weapons"]}},
      {name:"Wrath of the Storm", text:"When a creature within 5 feet that you can see hits you with an attack, you can use your reaction to make it take 2d8 lightning or thunder damage (your choice), DEX save for half. Uses equal to your Wisdom modifier (minimum 1) per long rest."}
    ],
    2:[{name:"Channel Divinity: Destructive Wrath", text:"When you roll lightning or thunder damage, you can use Channel Divinity to deal maximum damage instead of rolling."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Fog Cloud, Thunderwave, Gust of Wind and Shatter prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Fog Cloud, Thunderwave, Gust of Wind, Shatter, Call Lightning and Sleet Storm prepared; they don't count against your prepared spells."}],
    6:[{name:"Thunderbolt Strike", text:"When you deal lightning damage to a Large or smaller creature, you can also push it up to 10 feet away from you."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Fog Cloud, Thunderwave, Gust of Wind, Shatter, Call Lightning, Sleet Storm, Control Water and Ice Storm prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 thunder damage. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Fog Cloud, Thunderwave, Gust of Wind, Shatter, Call Lightning, Sleet Storm, Control Water, Ice Storm, Destructive Wave and Insect Plague prepared; they don't count against your prepared spells."}],
    17:[{name:"Stormborn", text:"You have a flying speed equal to your walking speed whenever you aren't underground or indoors."}]
  }},
  {name:"Trickery Domain", blurb:"Deception, stealth and mischief.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Charm Person and Disguise Self prepared; they don't count against your prepared spells."},
      {name:"Blessing of the Trickster", text:"As an action, touch a willing creature other than yourself to give it advantage on DEX (Stealth) checks for 1 hour, or until you use this feature again."}
    ],
    2:[{name:"Channel Divinity: Invoke Duplicity", text:"As an action, create a perfect illusion of yourself in an unoccupied space you can see within 30 feet, lasting 1 minute or until your concentration ends (as if concentrating on a spell). As a bonus action you can move it up to 30 feet, keeping it within 120 feet of you. You can cast spells as though you were in its space (using your own senses), and when you and the illusion are both within 5 feet of a creature that can see it, you have advantage on attack rolls against that creature."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Charm Person, Disguise Self, Mirror Image and Pass without Trace prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Charm Person, Disguise Self, Mirror Image, Pass without Trace, Blink and Dispel Magic prepared; they don't count against your prepared spells."}],
    6:[{name:"Channel Divinity: Cloak of Shadows", text:"As an action, you become invisible until the end of your next turn. You become visible if you attack or cast a spell."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Charm Person, Disguise Self, Mirror Image, Pass without Trace, Blink, Dispel Magic, Dimension Door and Polymorph prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 poison damage. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Charm Person, Disguise Self, Mirror Image, Pass without Trace, Blink, Dispel Magic, Dimension Door, Polymorph, Dominate Person and Modify Memory prepared; they don't count against your prepared spells."}],
    17:[{name:"Improved Duplicity", text:"Invoke Duplicity creates up to four duplicates of you instead of one. As a bonus action, you can move any number of them up to 30 feet each, to a maximum range of 120 feet."}]
  }},
  {name:"Nature Domain", blurb:"Channels the power of nature to command beasts and wield elemental fury.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Animal Friendship and Speak with Animals prepared; they don't count against your prepared spells."},
      {name:"Acolyte of Nature", text:"You learn one druid cantrip (it counts as a cleric cantrip for you) and gain proficiency in one of Animal Handling, Nature or Survival."},
      {name:"Bonus Proficiency", text:"You gain proficiency with heavy armor.", grants:{armor:["Heavy armor"]}}
    ],
    2:[{name:"Channel Divinity: Charm Animals and Plants", text:"As an action, each beast or plant creature within 30 feet that can see you makes a WIS save. On a failure, it is charmed by you for 1 minute or until it takes damage, and is friendly to you and creatures you designate."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Animal Friendship, Speak with Animals, Barkskin and Spike Growth prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Animal Friendship, Speak with Animals, Barkskin, Spike Growth, Plant Growth and Wind Wall prepared; they don't count against your prepared spells."}],
    6:[{name:"Dampen Elements", text:"When you or a creature within 30 feet takes acid, cold, fire, lightning or thunder damage, you can use your reaction to grant resistance against that instance of the damage."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Animal Friendship, Speak with Animals, Barkskin, Spike Growth, Plant Growth, Wind Wall, Dominate Beast and Grasping Vine prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 cold, fire or lightning damage (your choice each time). Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Animal Friendship, Speak with Animals, Barkskin, Spike Growth, Plant Growth, Wind Wall, Dominate Beast, Grasping Vine, Insect Plague and Tree Stride prepared; they don't count against your prepared spells."}],
    17:[{name:"Master of Nature", text:"While creatures are charmed by your Charm Animals and Plants, you can use a bonus action on your turn to verbally command what each of them will do on its next turn."}]
  }},
  {name:"Twilight Domain", blurb:"Guards against the terrors of night and eases the transition to death.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Faerie Fire and Sleep prepared; they don't count against your prepared spells."},
      {name:"Bonus Proficiencies", text:"You gain proficiency with martial weapons and heavy armor.", grants:{armor:["Heavy armor"], weapons:["Martial weapons"]}},
      {name:"Eyes of Night", text:"You have darkvision out to 300 feet. As an action, you can share it for 1 hour with willing creatures you can see within 10 feet, up to your Wisdom modifier (minimum 1). Once per long rest, or expend a spell slot of any level to share it again."},
      {name:"Vigilant Blessing", text:"As an action, give one creature you touch (including yourself) advantage on the next initiative roll it makes. The benefit ends right after that roll or when you use this feature again."}
    ],
    2:[{name:"Channel Divinity: Twilight Sanctuary", text:"As an action, a 30-foot-radius sphere of dim twilight emanates from you and moves with you for 1 minute, or until you are incapacitated or die. Whenever a creature (including you) ends its turn in the sphere, you can grant it one of these benefits: temporary hit points equal to 1d6 + your cleric level, or end one effect on it that is causing it to be charmed or frightened."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Faerie Fire, Sleep, Moonbeam and See Invisibility prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Faerie Fire, Sleep, Moonbeam, See Invisibility, Aura of Vitality and Leomund's Tiny Hut prepared; they don't count against your prepared spells."}],
    6:[{name:"Steps of Night", text:"As a bonus action while you are in dim light or darkness, you gain a flying speed equal to your walking speed for 1 minute. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Faerie Fire, Sleep, Moonbeam, See Invisibility, Aura of Vitality, Leomund's Tiny Hut, Aura of Life and Greater Invisibility prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 radiant damage. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Faerie Fire, Sleep, Moonbeam, See Invisibility, Aura of Vitality, Leomund's Tiny Hut, Aura of Life, Greater Invisibility, Circle of Power and Mislead prepared; they don't count against your prepared spells."}],
    17:[{name:"Twilight Shroud", text:"You and your allies have half cover while in the sphere created by your Twilight Sanctuary."}]
  }},
  {name:"Forge Domain", blurb:"Masters the divine art of crafting and imbuing weapons and armor.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Identify and Searing Smite prepared; they don't count against your prepared spells."},
      {name:"Bonus Proficiency", text:"You gain proficiency with heavy armor and smith's tools.", grants:{armor:["Heavy armor"], tools:["Smith's tools"]}},
      {name:"Blessing of the Forge", text:"At the end of a long rest, touch one nonmagical suit of armor or simple or martial weapon. Until the end of your next long rest or until you die, it becomes a magic item: +1 AC for armor, or +1 to attack and damage rolls for a weapon. Once per long rest."}
    ],
    2:[{name:"Channel Divinity: Artisan's Blessing", text:"In a 1-hour ritual, craft a nonmagical item that includes some metal and is worth no more than 100 gp: a simple or martial weapon, a suit of armor, ten pieces of ammunition, a set of tools or another metal object. You must lay out metal (coins count) worth as much as the item, which transforms into it. You can also duplicate a nonmagical item containing metal, such as a key, if you have the original during the ritual."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Identify, Searing Smite, Heat Metal and Magic Weapon prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Identify, Searing Smite, Heat Metal, Magic Weapon, Elemental Weapon and Protection from Energy prepared; they don't count against your prepared spells."}],
    6:[{name:"Soul of the Forge", text:"You have resistance to fire damage, and while wearing heavy armor you gain a +1 bonus to AC (already added on the sheet).", acHeavyArmor:1}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Identify, Searing Smite, Heat Metal, Magic Weapon, Elemental Weapon, Protection from Energy, Fabricate and Wall of Fire prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 fire damage. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Identify, Searing Smite, Heat Metal, Magic Weapon, Elemental Weapon, Protection from Energy, Fabricate, Wall of Fire, Animate Objects and Creation prepared; they don't count against your prepared spells."}],
    17:[{name:"Saint of Forge and Fire", text:"You are immune to fire damage, and while wearing heavy armor you have resistance to bludgeoning, piercing and slashing damage from nonmagical attacks."}]
  }},
  {name:"Order Domain", blurb:"Enforces divine law and compels others to act through holy authority.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Command and Heroism prepared; they don't count against your prepared spells."},
      {name:"Bonus Proficiencies", text:"You gain proficiency with heavy armor, and in Intimidation or Persuasion (your choice; tick it on the Abilities & Skills tab).", grants:{armor:["Heavy armor"]}},
      {name:"Voice of Authority", text:"When you cast a spell with a spell slot of 1st level or higher that targets an ally, that ally can use its reaction right after the spell to make one weapon attack against a creature of your choice that you can see. If the spell targets several allies, you choose which one can attack."}
    ],
    2:[{name:"Channel Divinity: Order's Demand", text:"As an action, each creature of your choice within 30 feet that can see or hear you makes a WIS save or is charmed by you until the end of your next turn or until it takes damage. You can also make any creature that fails drop what it is holding."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Heroism, Hold Person and Zone of Truth prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Heroism, Hold Person, Zone of Truth, Mass Healing Word and Slow prepared; they don't count against your prepared spells."}],
    6:[{name:"Embodiment of the Law", text:"When you cast an enchantment spell with a spell slot of 1st level or higher whose casting time is 1 action, you can cast it as a bonus action instead. Uses equal to your Wisdom modifier (minimum 1) per long rest."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Heroism, Hold Person, Zone of Truth, Mass Healing Word, Slow, Compulsion and Locate Creature prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once on each of your turns when you hit a creature with a weapon attack, deal an extra 1d8 psychic damage. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Command, Heroism, Hold Person, Zone of Truth, Mass Healing Word, Slow, Compulsion, Locate Creature, Commune and Dominate Person prepared; they don't count against your prepared spells."}],
    17:[{name:"Order's Wrath", text:"When you deal Divine Strike damage to a creature on your turn, you can curse it until the start of your next turn. The next time one of your allies hits it with an attack, it takes an extra 2d8 psychic damage and the curse ends. Once per turn."}]
  }},
  {name:"Peace Domain", blurb:"Spreads harmony, protection and unity among allies.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Heroism and Sanctuary prepared; they don't count against your prepared spells."},
      {name:"Implement of Peace", text:"You gain proficiency in Insight, Performance or Persuasion (your choice; tick it on the Abilities & Skills tab)."},
      {name:"Emboldening Bond", text:"As an action, bond a number of willing creatures within 30 feet equal to your proficiency bonus (you can include yourself) for 10 minutes, or until you use this again. While a bonded creature is within 30 feet of another, it can roll a d4 and add it to an attack roll, ability check or saving throw it makes, no more than once per turn. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
    ],
    2:[{name:"Channel Divinity: Balm of Peace", text:"As an action, move up to your speed without provoking opportunity attacks. When you move within 5 feet of another creature during this action, you can restore 2d6 + your Wisdom modifier (minimum 1) hit points to it; each creature can be healed only once per use."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Heroism, Sanctuary, Aid and Warding Bond prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Heroism, Sanctuary, Aid, Warding Bond, Beacon of Hope and Sending prepared; they don't count against your prepared spells."}],
    6:[{name:"Protective Bond", text:"When a creature under your Emboldening Bond is about to take damage, another bonded creature within 30 feet of it can use its reaction to teleport to an unoccupied space within 5 feet of it and take all the damage instead."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Heroism, Sanctuary, Aid, Warding Bond, Beacon of Hope, Sending, Aura of Purity and Otiluke's Resilient Sphere prepared; they don't count against your prepared spells."}],
    8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Heroism, Sanctuary, Aid, Warding Bond, Beacon of Hope, Sending, Aura of Purity, Otiluke's Resilient Sphere, Greater Restoration and Rary's Telepathic Bond prepared; they don't count against your prepared spells."}],
    17:[{name:"Expansive Bond", text:"Emboldening Bond and Protective Bond now work when the creatures are within 60 feet of each other, and a creature that takes someone else's damage with Protective Bond has resistance to it."}]
  }},
  {name:"Death Domain", blurb:"Wields necrotic power to reap the living and command death itself.", features:{
    1:[
      {name:"Domain Spells", text:"You always have False Life and Ray of Sickness prepared; they don't count against your prepared spells."},
      {name:"Bonus Proficiency", text:"You gain proficiency with martial weapons.", grants:{weapons:["Martial weapons"]}},
      {name:"Reaper", text:"You learn one necromancy cantrip of your choice from any class's spell list (e.g. Chill Touch or Toll the Dead). When you cast a necromancy cantrip that normally targets only one creature, it can instead target two creatures within range and within 5 feet of each other."}
    ],
    2:[{name:"Channel Divinity: Touch of Death", text:"When you hit a creature with a melee attack, you can use Channel Divinity to deal extra necrotic damage equal to 5 + twice your cleric level."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness and Ray of Enfeeblement prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness, Ray of Enfeeblement, Animate Dead and Vampiric Touch prepared; they don't count against your prepared spells."}],
    6:[{name:"Inescapable Destruction", text:"Necrotic damage dealt by your cleric spells and Channel Divinity options ignores resistance to necrotic damage."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness, Ray of Enfeeblement, Animate Dead, Vampiric Touch, Blight and Death Ward prepared; they don't count against your prepared spells."}],
    8:[{name:"Divine Strike", text:"Once per turn when you hit with a weapon attack, deal an extra 1d8 necrotic damage. Increases to 2d8 at level 14."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have False Life, Ray of Sickness, Blindness/Deafness, Ray of Enfeeblement, Animate Dead, Vampiric Touch, Blight, Death Ward, Antilife Shell and Cloudkill prepared; they don't count against your prepared spells."}],
    17:[{name:"Improved Reaper", text:"When you cast a necromancy spell of 1st through 5th level that targets only one creature, it can instead target two creatures within range and within 5 feet of each other. If the spell consumes its material components, you must provide them for each target."}]
  }},
  {name:"Arcana Domain", blurb:"A scholar-priest of magic who wields wizard spells and banishes otherworldly foes.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Detect Magic and Magic Missile prepared; they don't count against your prepared spells."},
      {name:"Arcane Initiate", text:"You gain proficiency in Arcana (tick it on the Abilities & Skills tab) and learn two wizard cantrips of your choice. They count as cleric cantrips for you."}
    ],
    2:[{name:"Channel Divinity: Arcane Abjuration", text:"Action: choose one celestial, elemental, fey or fiend within 30 feet that can see or hear you. It makes a Wisdom save or is turned for 1 minute or until it takes damage: it must spend its turns moving away from you, can't willingly come within 30 feet of you, can't take reactions, and can only Dash or try to escape."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon and Nystul's Magic Aura prepared; they don't count against your prepared spells."}],
    5:[
      {name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon, Nystul's Magic Aura, Dispel Magic and Magic Circle prepared; they don't count against your prepared spells."},
      {name:"Channel Divinity: Arcane Abjuration", replaces:"Channel Divinity: Arcane Abjuration", text:"Action: choose one celestial, elemental, fey or fiend within 30 feet that can see or hear you. It makes a Wisdom save or is turned for 1 minute or until it takes damage. If it fails, isn't on its home plane and has a challenge rating at or below your threshold, it is instead banished to its home plane for 1 minute (as Banishment, no concentration). Threshold: CR 1/2 at level 5, CR 1 at 8, CR 2 at 11, CR 3 at 14, CR 4 at 17."}
    ],
    6:[{name:"Spell Breaker", text:"When you restore hit points to an ally with a spell of 1st level or higher, you can also end one spell of your choice on that creature. The ended spell's level must be no higher than the slot you used for the healing spell."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon, Nystul's Magic Aura, Dispel Magic, Magic Circle, Arcane Eye and Leomund's Secret Chest prepared; they don't count against your prepared spells."}],
    8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Detect Magic, Magic Missile, Magic Weapon, Nystul's Magic Aura, Dispel Magic, Magic Circle, Arcane Eye, Leomund's Secret Chest, Planar Binding and Teleportation Circle prepared; they don't count against your prepared spells."}],
    17:[{name:"Arcane Mastery", text:"Choose four spells from the wizard spell list, one each of 6th, 7th, 8th and 9th level. They become domain spells for you: always prepared and not counted against your prepared spells."}]
  }},
  {name:"Grave Domain", blurb:"Watches over the line between life and death, sparing the dying and hastening the doomed.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Bane and False Life prepared; they don't count against your prepared spells."},
      {name:"Circle of Mortality", text:"When you restore hit points with a spell to a creature at 0 hit points, use the highest number possible for each die instead of rolling. You also learn the Spare the Dying cantrip (it doesn't count against your cantrips known), and you can cast it as a bonus action with a range of 30 feet."},
      {name:"Eyes of the Grave", text:"As an action, you know the location of any undead within 60 feet that isn't behind total cover or protected from divination magic, until the end of your next turn. You can use this a number of times equal to your Wisdom modifier (minimum 1), regained on a long rest."}
    ],
    2:[{name:"Channel Divinity: Path to the Grave", text:"Action: curse one creature within 30 feet until the end of your next turn. The next time you or an ally hits it with an attack, it has vulnerability to all of that attack's damage, and the curse ends."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose and Ray of Enfeeblement prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose, Ray of Enfeeblement, Revivify and Vampiric Touch prepared; they don't count against your prepared spells."}],
    6:[{name:"Sentinel at Death's Door", text:"Reaction when you or a creature you can see within 30 feet suffers a critical hit: turn it into a normal hit, cancelling any effects triggered by the critical hit. You can use this a number of times equal to your Wisdom modifier (minimum 1), regained on a long rest."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose, Ray of Enfeeblement, Revivify, Vampiric Touch, Blight and Death Ward prepared; they don't count against your prepared spells."}],
    8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Bane, False Life, Gentle Repose, Ray of Enfeeblement, Revivify, Vampiric Touch, Blight, Death Ward, Antilife Shell and Raise Dead prepared; they don't count against your prepared spells."}],
    17:[{name:"Keeper of Souls", text:"Once per turn, when an enemy you can see dies within 60 feet of you, you or one creature of your choice within 60 feet regains hit points equal to the enemy's number of Hit Dice. You can't use this while incapacitated."}]
  }},
  {name:"Fate Domain", blurb:"Wields the threads of destiny to foresee outcomes and tip the scales of luck.", features:{
    1:[
      {name:"Domain Spells", text:"You always have Dissonant Whispers and Heroism prepared; they don't count against your prepared spells."},
      {name:"Omens and Portents", text:"Once per long rest, you can cast Augury without expending a spell slot or using components. Whenever you cast a divination spell with a random chance of failure (such as Augury, Commune or Divination), that chance is reduced by 25%."},
      {name:"Ties That Bind", text:"As an action, touch a creature or object to tie its fate to yours for 1 hour (an unwilling creature makes a WIS save to resist). While it is bound and on the same plane as you, it can't hide from you: you know the direction it is in and the direction it is moving. Once per turn, when you cast a spell using a spell slot that deals damage to it or restores its hit points, roll a d6 and add it to the damage or healing. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}
    ],
    2:[{name:"Channel Divinity: Strands of Fate", text:"As a bonus action, enter a state of heightened foresight for up to 1 minute (concentration). While it lasts, whenever another creature you can see makes an attack roll or ability check, you can use your reaction to give that roll advantage or disadvantage."}],
    3:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Dissonant Whispers, Heroism, See Invisibility and Warding Bond prepared; they don't count against your prepared spells."}],
    5:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Dissonant Whispers, Heroism, See Invisibility, Warding Bond, Beacon of Hope and Clairvoyance prepared; they don't count against your prepared spells."}],
    6:[{name:"Insightful Striking", text:"As a bonus action, glimpse the defenses of a target within 30 feet. Until the end of your next turn, choose one: add 1d6 to your next attack roll against it, or make it subtract 1d6 from its next saving throw against one of your spells. You can use this a number of times equal to your proficiency bonus, regained on a long rest."}],
    7:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Dissonant Whispers, Heroism, See Invisibility, Warding Bond, Beacon of Hope, Clairvoyance, Death Ward and Divination prepared; they don't count against your prepared spells."}],
    8:[{name:"Potent Spellcasting", text:"Add your Wisdom modifier to the damage you deal with any cleric cantrip."}],
    9:[{name:"Domain Spells", replaces:"Domain Spells", text:"You always have Dissonant Whispers, Heroism, See Invisibility, Warding Bond, Beacon of Hope, Clairvoyance, Death Ward, Divination, Commune and Geas prepared; they don't count against your prepared spells."}],
    17:[{name:"Visions of the Future", text:"Once per long rest, you can cast Foresight as an action without expending a spell slot. When cast this way, it lasts 1 minute."}]
  }}
];
