/* ---------------- Tier list (secret): subclasses ----------------
   Each subclass rated S to D in each band of levels (js/data/tier-list.js's
   TIER_BANDS), against the OTHER subclasses of its class: a D wizard school
   is still a wizard. Keyed by class, then by the subclass's name as
   SUBCLASSES has it, so a 2014 and a 2024 version are rated apart ("Life
   Domain" and "Life Domain (2024)"). A subclass for both editions (no
   edition tag) has one rating and shows in both lists. Shadow Stalker is
   private: it only shows while the private content is on. Custom
   (homebrew) subclasses aren't rated.
   r("ABBA", why): the four letters in band order and a short reason. */
function r(tiers, why){ return {tiers: tiers.split(""), why: why}; }

export var SUBCLASS_TIERS = {
  "Artificer": {
    "Alchemist": r("CBBB", "Random elixirs and small heals at first, then a solid healer and support from level 5."),
    "Artillerist": r("BBBB", "The Eldritch Cannon adds damage or temporary HP each turn, and its spells hit harder from level 5."),
    "Battle Smith": r("AAAA", "Attacks with Intelligence and brings a Steel Defender. Arcane Jolt at 9 and Improved Defender at 15 keep it strong."),
    "Armorer": r("AAAA", "Heavy armor and a built-in weapon from level 3. Guardian draws attacks, Infiltrator hits hard from range."),
    "Alchemist (2024)": r("BBBB", "You choose your elixirs, and it makes a simple, solid support caster."),
    "Armorer (2024)": r("AAAA", "Heavy armor, a built-in weapon and the new Dreadnaught model for melee."),
    "Artillerist (2024)": r("AAAA", "The Eldritch Cannon adds damage or temporary HP every turn. The 2024 version is easy to play and very strong."),
    "Battle Smith (2024)": r("AAAA", "Attacks with Intelligence and brings a Steel Defender that tanks for you. Arcane Jolt and Improved Defender keep it strong."),
    "Cartographer": r("BBBB", "Free Faerie Fire, short teleports and Safe Haven help the party, but it has few combat tricks of its own."),
    "Reanimator": r("BBBB", "A stitched companion and Jolt to Life to revive the fallen. Good, but slower to set up.")
  },
  "Barbarian": {
    "Path of the Berserker": r("DDCC", "Frenzy's exhaustion makes its main feature costly. Retaliation at 14 helps, but it stays the weakest path."),
    "Path of the Totem Warrior": r("SSSS", "The Bear totem resists every damage type but psychic while raging, which matters more as foes use magic. The toughest barbarian."),
    "Path of the Zealot": r("AASS", "Extra damage on the first hit each turn, free resurrection, and Rage Beyond Death at 14."),
    "Path of the Ancestral Guardian": r("ASSS", "Its spirits make foes attack you instead of your friends, and Spirit Shield at 6 blocks damage for them every round."),
    "Path of Wild Magic": r("CBBB", "Random surges at 3 are hit and miss. Bolstering Magic at 6 boosts allies, and Controlled Surge at 14 tames the chaos."),
    "Path of the Beast": r("AAAA", "Claws give an extra attack even before Extra Attack, and it stays tough and dangerous. Infectious Fury at 10 adds control."),
    "Path of the Giant": r("AAAA", "Reach, thrown foes and elemental damage on every hit. Strong and flexible."),
    "Path of the Storm Herald": r("CCCC", "Its aura is small and its numbers too low to matter much."),
    "Path of the Battlerager": r("CCCC", "Spiked armor attacks and some temporary HP, but it gives up a shield and stronger armor."),
    "Path of the Berserker (2024)": r("AAAA", "Frenzy is now free extra damage while reckless, with no exhaustion."),
    "Path of the Wild Heart": r("AAAA", "The 2024 Totem Warrior. The bear's resistances still make it very hard to bring down."),
    "Path of the World Tree": r("BAAA", "Temporary HP for the party, short teleports and pulling foes from 10 feet away."),
    "Path of the Zealot (2024)": r("AAAA", "Divine Fury on the first hit each turn and healing from its own pool. Rage of the Gods arrives late, at 14.")
  },
  "Bard": {
    "College of Lore": r("ASSS", "Cutting Words from 3, then two extra Magical Secrets at 6 make it the strongest bard for spells."),
    "College of Valor": r("BABB", "Medium armor, shields and Extra Attack at 6 for a fighting bard."),
    "College of Eloquence": r("SSSS", "Inspiration is never wasted, and Unsettling Words lowers saves for your big spells, which matters more as they grow."),
    "College of Swords": r("BBAA", "Blade flourishes share your Bardic Inspiration uses until Master's Flourish at 14 makes them free."),
    "College of Creation": r("CBBB", "Little in a fight at first. The Dancing Item from 6 is a strong helper that grows with you."),
    "College of Glamour": r("AABB", "Mantle of Inspiration gives the party temporary HP and free movement. Great early."),
    "College of Spirits": r("BBBB", "Spirit tales are random but often strong. A good support pick."),
    "College of Whispers": r("CCCC", "Psychic blades add some damage, but its tricks rarely come up in a fight."),
    "College of Dance": r("AAAA", "Unarmored AC, unarmed strikes with your inspiration die and better initiative for the party."),
    "College of Glamour (2024)": r("AAAA", "Mantle of Inspiration adds temporary HP and movement, and Mantle of Majesty is free once a day."),
    "College of Lore (2024)": r("ASSS", "Cutting Words from 3, then Magical Discoveries at 6 adds two spells from other lists."),
    "College of Valor (2024)": r("BABB", "Martial training and Extra Attack at 6, with a cantrip in place of one attack.")
  },
  "Cleric": {
    "Life Domain": r("AAAA", "Heavy armor and bigger heals on every healing spell. Simple and strong."),
    "Light Domain": r("ASAA", "Warding Flare and Radiance of the Dawn from the start, and Fireball at 5 makes levels 5 to 10 its peak."),
    "War Domain": r("BBCC", "Heavy armor and bonus action attacks, but few uses of War Priest, and weapons fall behind cantrips later."),
    "Knowledge Domain": r("BBBB", "Two skills with Expertise and good control spells. More useful outside combat."),
    "Tempest Domain": r("AAAA", "Heavy armor, and Destructive Wrath maximizes thunder and lightning damage."),
    "Trickery Domain": r("BBBB", "Invoke Duplicity gives advantage from a decoy, and its stealth tricks help scouting. Tricky to play well."),
    "Nature Domain": r("CCCC", "Heavy armor and a druid cantrip, but its later features are weak."),
    "Twilight Domain": r("SSSS", "Long darkvision and Twilight Sanctuary's temporary HP every turn. Often called too strong."),
    "Forge Domain": r("SAAA", "AC 20 or more from level 1 is huge early. Later that edge matters less, but it stays a sturdy front liner."),
    "Order Domain": r("AAAA", "Voice of Authority gives an ally a free attack when you cast a spell on them."),
    "Peace Domain": r("SSSS", "Emboldening Bond adds a d4 to almost everything the party does."),
    "Death Domain": r("BBBB", "Reaper doubles necrotic cantrips, and from level 6 your necrotic damage ignores resistance."),
    "Arcana Domain": r("BBBA", "Wizard cantrips and spells, and wizard spells of 6th level and up at 17."),
    "Grave Domain": r("AAAA", "Path to the Grave doubles one hit's damage, and its healing beats death saves."),
    "Fate Domain": r("AAAS", "Strands of Fate gives or takes advantage on the rolls that matter, and Foresight is free at 17."),
    "Life Domain (2024)": r("AAAA", "Heavy armor and bigger heals, with Preserve Life for many allies at once."),
    "Light Domain (2024)": r("ASAA", "Warding Flare and Radiance of the Dawn, and Fireball at 5 makes levels 5 to 10 its peak."),
    "Trickery Domain (2024)": r("BBBB", "Invoke Duplicity is much better and now lets you cast spells from it."),
    "War Domain (2024)": r("BAAA", "Guided Strike and War Priest attacks with more uses than before.")
  },
  "Druid": {
    "Circle of the Land": r("BAAA", "Extra spells by land and slot recovery. A solid caster with no tricks."),
    "Circle of the Moon": r("SABA", "Combat Wild Shape rules levels 2 to 4. Beasts fall behind later, until unlimited shapes at 20."),
    "Circle of Stars": r("SSSS", "Starry Form adds healing or a bonus action attack every turn and protects concentration."),
    "Circle of Wildfire": r("AAAA", "A fire spirit that teleports the party and adds fire damage to spells."),
    "Circle of Dreams": r("BBBB", "Bonus action healing from a pool, and the party can teleport on a rest."),
    "Circle of Spores": r("CCCC", "Halo of Spores and temporary HP, but a melee druid struggles."),
    "Circle of the Shepherd": r("ASSS", "Spirit Totem helps from 2, and Mighty Summoner at 6 makes its summoned creatures much stronger. The best summoner."),
    "Circle of the Blighted": r("BBBB", "Necrotic damage on spells and darker Wild Shapes from 2, and a sapling ally from 6."),
    "Circle of the Land (2024)": r("AAAA", "Land's Aid heals and harms with one Wild Shape use, plus extra spells by land."),
    "Circle of the Moon (2024)": r("AAAA", "Forms use your own HP plus temporary HP. Not as dominant early as the 2014 version, but strong at every level."),
    "Circle of the Sea": r("BBBB", "Wrath of the Sea deals cold damage and pushes foes, but it starts slowly and most of it comes online at 6."),
    "Circle of the Stars (2024)": r("SSSS", "Starry Form adds healing or a bonus action attack every turn and protects concentration.")
  },
  "Fighter": {
    "Champion": r("CCCB", "More critical hits and little else, so one of the weakest fighters. Crits on 18 to 20 and Survivor help at the top."),
    "Battle Master": r("AAAA", "Maneuvers add damage, control and support many times a fight."),
    "Eldritch Knight": r("AAAA", "Shield and Absorb Elements make it very hard to hit, and War Magic adds a cantrip and an attack each turn."),
    "Echo Knight": r("SSSS", "An echo that attacks from where it stands and lets you teleport. The strongest fighter."),
    "Rune Knight": r("AAAA", "Growing Large and runes add damage, control and help on saves."),
    "Cavalier": r("AAAA", "Marks hold foes on you and Warding Maneuver protects allies. A fantastic defender, even more so mounted."),
    "Samurai": r("AAAA", "Fighting Spirit gives advantage and temporary HP. Big damage with a power attack feat."),
    "Arcane Archer": r("CCCC", "Only two arcane shots per short rest, so its main feature runs out fast."),
    "Psi Warrior": r("BBBA", "Psionic dice for damage, a shield for allies and telekinesis. Telekinetic Master at 18 adds Telekinesis and a bonus action attack."),
    "Banneret (Purple Dragon Knight)": r("DDDD", "Small group healing and a few skills. The weakest fighter."),
    "Gunslinger": r("BBBB", "Firearm damage and trick shots fueled by grit."),
    "Battle Master (2024)": r("AAAA", "Maneuvers add damage, control and support many times a fight."),
    "Champion (2024)": r("BBAA", "Better crits and Remarkable Athlete, then Heroic Inspiration almost every turn from level 10."),
    "Eldritch Knight (2024)": r("AAAA", "Shield and war magic make it hard to hit and hard to escape, with spells woven into its attacks."),
    "Psi Warrior (2024)": r("AAAA", "More psionic dice, a shield for allies and telekinesis.")
  },
  "Gunslinger": {
    "Marksman": r("AAAS", "Expert Sniper and crits on a 19 from 3, then Deadly Critical at 18 crits on 18 to 20. The simplest damage pick."),
    "Outlaw": r("BBBB", "Plus 2 damage with one firearm, two pistols and extra reactions."),
    "Marshal": r("CCBB", "Rerolls low damage dice and Pinpoint Control at 14. Little until then."),
    "Eldritch Gunman": r("AAAA", "Wizard spells such as Shield and a firearm enchantment. The most flexible.")
  },
  "Monk": {
    "Way of the Open Hand": r("AAAS", "Flurry of Blows knocks foes prone or pushes them, and Quivering Palm at 17 can drop a foe to 0 hit points."),
    "Way of Shadow": r("AAAA", "Darkness, Pass without Trace and Shadow Step for advantage."),
    "Way of the Four Elements": r("DDDD", "Its spells cost far too much ki. The weakest monk."),
    "Way of Mercy": r("SSSS", "Heals and harms with Flurry of Blows. The best monk."),
    "Way of the Kensei": r("CCCC", "A weapon monk with ranged options, but its edge fades as monk damage grows, and Sharpen the Blade costs ki."),
    "Way of the Astral Self": r("BBBB", "Wisdom for attacks and reaching arms, but it eats ki."),
    "Way of the Ascendant Dragon": r("BBBB", "A breath weapon and flight, with more ki costs."),
    "Way of the Drunken Master": r("BBBB", "Free Disengage on Flurry of Blows and turned attacks. Great mobility."),
    "Way of the Sun Soul": r("CCCC", "Ranged radiant bolts, but ki costs limit them."),
    "Way of Long Death": r("AAAA", "Very hard to kill: temporary HP on kills, a fear burst at 6 and Mastery of Death at 11."),
    "Warrior of the Open Hand": r("AAAS", "Flurry of Blows knocks foes prone or pushes them, and Quivering Palm at 17 deals 10d12 force damage."),
    "Warrior of Shadow": r("AAAA", "Darkness, Shadow Step and teleporting strikes."),
    "Warrior of the Elements": r("BBBB", "Rebuilt with elemental reach and damage instead of costly spells. Now solid."),
    "Warrior of Mercy": r("SSSS", "Heals and harms with Flurry of Blows. The best monk.")
  },
  "Paladin": {
    "Oath of Devotion": r("AAAA", "Sacred Weapon adds Charisma to attacks, and its aura stops charm."),
    "Oath of the Ancients": r("ASSS", "Aura of Warding at 7 halves spell damage for nearby allies. Superb against casters."),
    "Oath of Vengeance": r("SSSS", "Vow of Enmity gives advantage on one foe all fight. The damage oath."),
    "Oath of Conquest": r("AASS", "Aura of Conquest locks frightened foes in place. Superb control from level 7."),
    "Oathbreaker": r("ASSS", "Dreadful Aspect frightens a crowd from 3, and Aura of Hate at 7 adds your Charisma to every melee damage roll."),
    "Oath of Redemption": r("AAAA", "Aura of the Guardian takes hits for allies, and Rebuke the Violent turns damage back. A strong protector."),
    "Oath of Glory": r("BAAA", "Its level 3 features are mostly for outside combat. Aura of Alacrity at 7 speeds up the party."),
    "Oath of the Crown": r("CCCC", "Draws attacks to you, but its features are weak."),
    "Oath of the Watchers": r("BBBB", "Initiative and mental save help for the party. Good against magic."),
    "Oath of Devotion (2024)": r("AAAA", "Sacred Weapon adds Charisma to attacks, and its aura stops charm."),
    "Oath of Glory (2024)": r("BAAA", "Its level 3 features are mostly for outside combat. Aura of Alacrity at 7 speeds up the party."),
    "Oath of the Ancients (2024)": r("ASSS", "Aura of Warding at 7 halves spell damage for nearby allies. Superb against casters."),
    "Oath of Vengeance (2024)": r("SSSS", "Vow of Enmity gives advantage on one foe all fight. The damage oath.")
  },
  "Ranger": {
    "Hunter": r("BBBB", "Colossus Slayer and a useful choice at each level. Steady damage."),
    "Beast Master": r("BBBB", "With Tasha's primal companion the beast hits hard and stays useful. The original companion costs your actions."),
    "Gloom Stalker": r("SSAA", "An extra attack and damage on the first turn, and unseen in darkness."),
    "Fey Wanderer": r("AAAA", "Wisdom on Charisma checks, extra psychic damage and charm resistance."),
    "Horizon Walker": r("AAAA", "Planar Warrior's force damage from level 3, then Distant Strike at 11 teleports between attacks and adds a third attack."),
    "Drakewarden": r("AAAA", "A drake companion with a breath weapon, and a flying mount you can ride from level 7. One of the strongest rangers."),
    "Monster Slayer": r("BBBB", "Slayer's Prey damage and good defenses against casters."),
    "Swarmkeeper": r("BAAA", "A free push, pull or extra damage every turn, and short bursts of flight from level 7."),
    "Beast Master (2024)": r("BBAA", "The primal beast attacks along with you, and Bestial Fury at 11 lets it attack twice. Much better than before."),
    "Fey Wanderer (2024)": r("AAAA", "Wisdom on Charisma checks, extra psychic damage and charm resistance."),
    "Gloom Stalker (2024)": r("AAAA", "Better initiative and unseen in darkness, but Dread Ambusher now has only a few uses."),
    "Hunter (2024)": r("BBBB", "Colossus Slayer and a choice of defenses. Steady damage.")
  },
  "Rogue": {
    "Thief": r("BBBA", "Fast Hands for items and a second turn in the first round at 17."),
    "Assassin": r("BBCC", "Huge first-round damage when you surprise foes, little otherwise."),
    "Arcane Trickster": r("AAAA", "Shield, Booming Blade and Mage Hand tricks. Close behind it come the Swashbuckler and Soulknife."),
    "Swashbuckler": r("AAAA", "Charisma on initiative and Sneak Attack in a duel. Great mobility."),
    "Soulknife": r("AAAA", "Psychic blades that need no weapon and psionic dice for skills."),
    "Phantom": r("BBAA", "Extra Sneak Attack damage on a second target and soul trinkets."),
    "Scout": r("BBBA", "Free movement as a reaction from 3, Ambush Master at 13, and at 17 Sudden Strike adds a bonus action attack with its own Sneak Attack."),
    "Inquisitive": r("CCCC", "Insightful Fighting gives Sneak Attack without help, but little else. Eye for Weakness at 17 adds only a little."),
    "Mastermind": r("CCCC", "Bonus action Help from 30 feet. Support, not damage."),
    "Misfortune Bringer": r("BBAA", "Evil Eye gives Sneak Attack without help, and misfortunes curse foes. Steal Luck at 9 and Curse Caster at 13 add more."),
    "Shadow Stalker": r("BBAS", "Shadow clones for flanking and swaps from 3, and Living Shadows at 17 gives two Sneak Attacks a turn."),
    "Arcane Trickster (2024)": r("AAAA", "Shield, Mage Hand tricks and Magical Ambush."),
    "Assassin (2024)": r("BBBB", "Better first-round damage, and Envenom Weapons adds poison."),
    "Soulknife (2024)": r("AAAA", "Psychic blades that need no weapon and psionic dice for skills."),
    "Thief (2024)": r("BBBA", "Fast Hands for items, Use Magic Device and a second turn in the first round at 17.")
  },
  "Sorcerer": {
    "Draconic Bloodline": r("BBBB", "Better AC and hit points, and extra damage with one element."),
    "Wild Magic": r("CBBB", "Random surges at first. Bend Luck at 6 turns sorcery points into a strong reaction, so it holds up better from there."),
    "Clockwork Soul": r("AAAA", "Extra spells and Bastion of Law to shield allies."),
    "Aberrant Mind": r("SSSS", "Extra spells you can cast with sorcery points and no components."),
    "Divine Soul": r("SSSS", "The whole cleric list, with healing and Spirit Guardians."),
    "Shadow Magic": r("AAAA", "Darkness you can see through, and Strength of the Grave keeps you up."),
    "Storm Sorcery": r("CCCC", "Free flight after spells and thunder damage, but small numbers."),
    "Lunar Sorcery": r("AAAA", "Many extra spells by moon phase and cheaper Metamagic make it very flexible."),
    "Aberrant Sorcery": r("SSSS", "Extra spells you can cast with sorcery points and no components."),
    "Clockwork Sorcery": r("AAAA", "Extra spells and Bastion of Law to shield allies."),
    "Draconic Sorcery": r("AAAA", "Better AC and hit points, extra damage with one element, and wings. Hard to beat as an all-rounder."),
    "Wild Magic Sorcery": r("BBBB", "More control over your surges than the 2014 version.")
  },
  "Warlock": {
    "The Fiend": r("AAAA", "Temporary HP on every kill and Fireball on the list."),
    "The Archfey": r("BBBB", "Fey Presence charms or frightens, and Misty Escape at 6."),
    "The Great Old One": r("BBBB", "Telepathy and good enchantment spells. Better outside combat."),
    "The Hexblade": r("SSSS", "Charisma for weapon attacks, medium armor and shields. The best warlock."),
    "The Celestial": r("BBBB", "Healing Light from a bonus action helps, but its damage and later features fall behind other patrons."),
    "The Fathomless": r("BBBB", "A tentacle attack every turn and underwater travel."),
    "The Genie": r("AASS", "Extra damage each turn and a vessel to rest in, then Limited Wish at 14 casts any spell of 6th level or lower."),
    "The Undead": r("AAAA", "Form of Dread frightens on a hit and gives temporary HP."),
    "The Undying": r("DDDD", "Its features keep you alive but rarely matter. The weakest patron."),
    "Archfey Patron": r("BBBB", "Free Misty Steps with extra effects, but few uses and little else."),
    "Celestial Patron": r("AAAA", "Healing Light from a bonus action and extra radiant damage."),
    "Fiend Patron": r("AAAA", "Temporary HP on kills, Fireball, and Dark One's Own Luck."),
    "Great Old One Patron": r("BBAA", "Psychic spells without components and telepathy, then Eldritch Hex at 10 makes your Hex give disadvantage on one kind of save.")
  },
  "Wizard": {
    "School of Evocation": r("AAAA", "Sculpt Spells keeps allies out of your fireballs."),
    "School of Abjuration": r("AAAA", "Arcane Ward absorbs damage, and counterspells get better."),
    "School of Divination": r("SSSS", "Portent replaces two d20 rolls each day. The strongest school."),
    "School of Illusion": r("BBAA", "Better illusions that become real at 14."),
    "School of Necromancy": r("BBBB", "Stronger undead servants. Slow and fiddly."),
    "Bladesinging": r("SSSS", "Huge AC, speed and concentration from Intelligence."),
    "War Magic": r("AAAA", "Initiative and AC boosts, and Durable Magic."),
    "Order of Scribes": r("AAAA", "Change damage types and keep a spare body."),
    "School of Conjuration": r("CCBB", "Little at first. Focused Conjuration at 10 protects your concentration, and Durable Summons at 14 gives them 30 temporary HP."),
    "School of Enchantment": r("BBBB", "Hypnotic Gaze locks down one foe early, and Split Enchantment at 10 lets one spell like Hold Monster hit two targets."),
    "School of Transmutation": r("CCCC", "The transmuter's stone and minor alchemy."),
    "Chronurgy Magic": r("SSSS", "Chronal Shift forces rerolls, and Arcane Abeyance stores spells."),
    "Graviturgy Magic": r("BBBB", "Moves foes and allies and adds damage."),
    "Abjurer": r("AAAA", "Arcane Ward absorbs damage, and Spell Breaker helps end spells."),
    "Diviner": r("SSSS", "Portent replaces two d20 rolls each day. The strongest school."),
    "Evoker": r("AAAA", "Potent Cantrip, Sculpt Spells and Empowered Evocation."),
    "Illusionist": r("AAAA", "Free Minor Illusion, Phantasmal Creatures and Illusory Self.")
  }
};

/* A subclass that's in both lists (no edition tag) shares one rating,
   unless it plays very differently on a 2024 class: then it gets its own
   2024 rating here, used in the 2024 list only. */
export var SUBCLASS_TIERS_2024 = {
  "Cleric": {
    "Death Domain": r("CCCC", "Little reason to pick it over the Grave Domain, and many undead resist necrotic damage until level 6.")
  },
  "Warlock": {
    "The Hexblade": r("AAAA", "Still strong, but the 2024 Pact of the Blade already gives Charisma weapon attacks, so much of its edge is gone.")
  }
};

/* The subclass's rating (its 2024 one when edition is "2024" and it has
   one), or null when it isn't rated (custom). */
export function subclassRating(className, subclassName, edition){
  var own = edition === "2024" && (SUBCLASS_TIERS_2024[className] || {})[subclassName];
  return own || (SUBCLASS_TIERS[className] || {})[subclassName] || null;
}

/* ---- Role profiles ----
   What each subclass ADDS on top of its class, 0 to 3 per role (0 nothing,
   1 a little, 2 a real strength, 3 its main job), as five digits in
   SUBCLASS_ROLE_KEYS order. Not power: a C subclass can still be a 3 at
   what it does. Keyed like SUBCLASS_TIERS. Every rated subclass has one. */
export var SUBCLASS_ROLE_KEYS = [
  {key: "damage", label: "Damage", hint: "Hits harder or more often"},
  {key: "defense", label: "Defense", hint: "Harder to hurt or bring down"},
  {key: "control", label: "Control", hint: "Moves, holds or hinders foes"},
  {key: "support", label: "Support", hint: "Protects, heals or boosts allies"},
  {key: "utility", label: "Utility", hint: "Exploring, travel and talking"}
];

export var SUBCLASS_ROLES = {
  "Artificer": {
    "Alchemist": "10031",
    "Artillerist": "31120",
    "Battle Smith": "21020",
    "Armorer": "23101",
    "Alchemist (2024)": "10031",
    "Armorer (2024)": "23201",
    "Artillerist (2024)": "31120",
    "Battle Smith (2024)": "21020",
    "Cartographer": "10133",
    "Reanimator": "21121"
  },
  "Barbarian": {
    "Path of the Berserker": "21100",
    "Path of the Totem Warrior": "03112",
    "Path of the Zealot": "22011",
    "Path of the Ancestral Guardian": "11231",
    "Path of Wild Magic": "11121",
    "Path of the Beast": "21212",
    "Path of the Giant": "20201",
    "Path of the Storm Herald": "11121",
    "Path of the Battlerager": "11001",
    "Path of the Berserker (2024)": "31200",
    "Path of the Wild Heart": "02112",
    "Path of the World Tree": "01322",
    "Path of the Zealot (2024)": "22021"
  },
  "Bard": {
    "College of Lore": "00123",
    "College of Valor": "22010",
    "College of Eloquence": "00322",
    "College of Swords": "21100",
    "College of Creation": "10023",
    "College of Glamour": "01232",
    "College of Spirits": "10122",
    "College of Whispers": "20003",
    "College of Dance": "12020",
    "College of Glamour (2024)": "01231",
    "College of Lore (2024)": "00123",
    "College of Valor (2024)": "22010"
  },
  "Cleric": {
    "Life Domain": "01030",
    "Light Domain": "32110",
    "War Domain": "21010",
    "Knowledge Domain": "00103",
    "Tempest Domain": "31101",
    "Trickery Domain": "11112",
    "Nature Domain": "11111",
    "Twilight Domain": "02032",
    "Forge Domain": "13001",
    "Order Domain": "01221",
    "Peace Domain": "01031",
    "Death Domain": "30000",
    "Arcana Domain": "10112",
    "Grave Domain": "20031",
    "Fate Domain": "10222",
    "Life Domain (2024)": "00030",
    "Light Domain (2024)": "32110",
    "Trickery Domain (2024)": "01122",
    "War Domain (2024)": "21020"
  },
  "Druid": {
    "Circle of the Land": "11102",
    "Circle of the Moon": "23001",
    "Circle of Stars": "21121",
    "Circle of Wildfire": "21021",
    "Circle of Dreams": "00032",
    "Circle of Spores": "22100",
    "Circle of the Shepherd": "20131",
    "Circle of the Blighted": "21201",
    "Circle of the Land (2024)": "21121",
    "Circle of the Moon (2024)": "22001",
    "Circle of the Sea": "21211",
    "Circle of the Stars (2024)": "21121"
  },
  "Fighter": {
    "Champion": "21001",
    "Battle Master": "21211",
    "Eldritch Knight": "13101",
    "Echo Knight": "31112",
    "Rune Knight": "21221",
    "Cavalier": "11321",
    "Samurai": "32001",
    "Arcane Archer": "10201",
    "Psi Warrior": "11221",
    "Banneret (Purple Dragon Knight)": "00021",
    "Gunslinger": "20201",
    "Battle Master (2024)": "21211",
    "Champion (2024)": "22001",
    "Eldritch Knight (2024)": "13101",
    "Psi Warrior (2024)": "11221"
  },
  "Gunslinger": {
    "Marksman": "30001",
    "Outlaw": "20201",
    "Marshal": "10212",
    "Eldritch Gunman": "22111"
  },
  "Monk": {
    "Way of the Open Hand": "21300",
    "Way of Shadow": "11113",
    "Way of the Four Elements": "10201",
    "Way of Mercy": "20131",
    "Way of the Kensei": "21001",
    "Way of the Astral Self": "21001",
    "Way of the Ascendant Dragon": "20111",
    "Way of the Drunken Master": "22001",
    "Way of the Sun Soul": "20000",
    "Way of Long Death": "13200",
    "Warrior of the Open Hand": "21301",
    "Warrior of Shadow": "12102",
    "Warrior of the Elements": "21202",
    "Warrior of Mercy": "20131"
  },
  "Paladin": {
    "Oath of Devotion": "22120",
    "Oath of the Ancients": "02230",
    "Oath of Vengeance": "30200",
    "Oath of Conquest": "11300",
    "Oathbreaker": "31201",
    "Oath of Redemption": "12032",
    "Oath of Glory": "11022",
    "Oath of the Crown": "01220",
    "Oath of the Watchers": "10131",
    "Oath of Devotion (2024)": "22020",
    "Oath of Glory (2024)": "11022",
    "Oath of the Ancients (2024)": "02320",
    "Oath of Vengeance (2024)": "30100"
  },
  "Ranger": {
    "Hunter": "22000",
    "Beast Master": "11011",
    "Gloom Stalker": "22102",
    "Fey Wanderer": "11113",
    "Horizon Walker": "21112",
    "Drakewarden": "20012",
    "Monster Slayer": "21201",
    "Swarmkeeper": "11301",
    "Beast Master (2024)": "21111",
    "Fey Wanderer (2024)": "11113",
    "Gloom Stalker (2024)": "22102",
    "Hunter (2024)": "22001"
  },
  "Rogue": {
    "Thief": "10003",
    "Assassin": "30002",
    "Arcane Trickster": "12102",
    "Swashbuckler": "21101",
    "Soulknife": "21102",
    "Phantom": "21002",
    "Scout": "12012",
    "Inquisitive": "10003",
    "Mastermind": "01032",
    "Misfortune Bringer": "21200",
    "Shadow Stalker": "21002",
    "Arcane Trickster (2024)": "12102",
    "Assassin (2024)": "30002",
    "Soulknife (2024)": "21102",
    "Thief (2024)": "11003"
  },
  "Sorcerer": {
    "Draconic Bloodline": "22101",
    "Wild Magic": "10120",
    "Clockwork Soul": "02131",
    "Aberrant Mind": "11202",
    "Divine Soul": "11031",
    "Shadow Magic": "12202",
    "Storm Sorcery": "11111",
    "Lunar Sorcery": "11111",
    "Aberrant Sorcery": "11202",
    "Clockwork Sorcery": "02131",
    "Draconic Sorcery": "22001",
    "Wild Magic Sorcery": "10120"
  },
  "Warlock": {
    "The Fiend": "22001",
    "The Archfey": "02201",
    "The Great Old One": "01202",
    "The Hexblade": "32000",
    "The Celestial": "21030",
    "The Fathomless": "10222",
    "The Genie": "21013",
    "The Undead": "12201",
    "The Undying": "02011",
    "Archfey Patron": "12102",
    "Celestial Patron": "21030",
    "Fiend Patron": "22001",
    "Great Old One Patron": "11202"
  },
  "Wizard": {
    "School of Evocation": "30010",
    "School of Abjuration": "03120",
    "School of Divination": "00222",
    "School of Illusion": "01203",
    "School of Necromancy": "21101",
    "Bladesinging": "23001",
    "War Magic": "13000",
    "Order of Scribes": "11003",
    "School of Conjuration": "11012",
    "School of Enchantment": "01301",
    "School of Transmutation": "01013",
    "Chronurgy Magic": "00321",
    "Graviturgy Magic": "10311",
    "Abjurer": "03220",
    "Diviner": "00222",
    "Evoker": "30010",
    "Illusionist": "11203"
  }
};

/* The subclass's role profile as {damage: 0-3, ...}, or null when its class
   has none yet (or it's custom). */
export function subclassRoles(className, subclassName){
  var digits = (SUBCLASS_ROLES[className] || {})[subclassName];
  if(!digits) return null;
  var out = {};
  SUBCLASS_ROLE_KEYS.forEach(function(r, i){ out[r.key] = Number(digits[i]); });
  return out;
}

/* ---- Shines when ----
   One short line for a subclass whose value depends on the campaign or the
   table more than on its own features (darkness, undead, mounts, short
   rests, surprise, summons). Shown in its rating sheet under the reason.
   Keyed like SUBCLASS_TIERS. Most subclasses have none. */
export var SUBCLASS_SHINES = {
  "Artificer": {
    "Cartographer": "Shines in travel and exploration campaigns, where its maps and teleports get used every day."
  },
  "Bard": {
    "College of Whispers": "Shines in intrigue campaigns with lots of private talks, disguises and secrets.",
    "College of Creation": "Shines when the party often needs a ladder, a rope or a tool on the spot."
  },
  "Cleric": {
    "Death Domain": "Shines when few foes are undead. Many resist necrotic damage until level 6, and some are immune to it.",
    "Grave Domain": "Shines in deadly campaigns where allies often drop to 0 hit points.",
    "Knowledge Domain": "Shines in mystery and research campaigns with lots of questions to answer.",
    "Light Domain": "Shines against groups of weaker foes, where Fireball and Radiance of the Dawn hit many at once.",
    "Light Domain (2024)": "Shines against groups of weaker foes, where Fireball and Radiance of the Dawn hit many at once.",
    "Twilight Domain": "Shines underground and at night, where Steps of Night lets you fly."
  },
  "Druid": {
    "Circle of the Moon": "Shines when you have seen many beasts. Wild Shape only takes the form of beasts you have seen.",
    "Circle of the Shepherd": "Shines at tables happy to run many summoned creatures. They slow combat down.",
    "Circle of Spores": "Shines against crowds of beasts and humanoids it can raise as zombies."
  },
  "Fighter": {
    "Battle Master": "Shines in campaigns with many short rests, which bring its superiority dice back.",
    "Battle Master (2024)": "Shines in campaigns with many short rests, which bring its superiority dice back.",
    "Rune Knight": "Shines in campaigns with many short rests, which bring its runes and Giant's Might back.",
    "Arcane Archer": "Shines in campaigns with many short rests. It only gets two Arcane Shots per rest.",
    "Cavalier": "Shines when you fight mounted. At your table it uses the higher of STR or DEX and can ride the War Camel.",
    "Gunslinger": "Only works if your DM allows firearms in the campaign."
  },
  "Monk": {
    "Way of Shadow": "Shines in dark dungeons and on night missions, where Shadow Step works.",
    "Warrior of Shadow": "Shines in the dark, where Shadow Step works, until level 11 frees it from needing darkness.",
    "Way of Long Death": "Shines against crowds of weak foes that drop fast and feed Touch of Death."
  },
  "Paladin": {
    "Oath of Vengeance": "Shines in boss fights against one big foe.",
    "Oath of Vengeance (2024)": "Shines in boss fights against one big foe.",
    "Oath of Conquest": "Shines against foes that can be frightened. Many undead and constructs can't be.",
    "Oathbreaker": "Shines in evil or undead-heavy campaigns. It's a villain option, so ask your DM first.",
    "Oath of the Ancients": "Shines against spellcasters, since Aura of Warding halves the damage of their spells.",
    "Oath of the Ancients (2024)": "Shines against necrotic, psychic and radiant damage, like undead and mind flayers.",
    "Oath of Devotion": "Shines against charmers like vampires and fey.",
    "Oath of the Watchers": "Shines against creatures from other planes: aberrations, celestials, elementals, fey and fiends."
  },
  "Ranger": {
    "Beast Master": "Shines only with Tasha's optional rules on, which swap in the stronger primal companion.",
    "Gloom Stalker": "Shines underground and at night, where Umbral Sight hides you from darkvision.",
    "Gloom Stalker (2024)": "Shines underground and at night, where Umbral Sight hides you from darkvision.",
    "Horizon Walker": "Shines in planar campaigns, and against foes that resist weapon damage.",
    "Monster Slayer": "Shines against spellcasters and single big monsters.",
    "Drakewarden": "Shines on long outdoor journeys, where a flying mount from level 7 matters.",
    "Fey Wanderer": "Shines in social campaigns, with your Wisdom added to every Charisma check.",
    "Fey Wanderer (2024)": "Shines in social campaigns, with your Wisdom added to every Charisma check."
  },
  "Rogue": {
    "Assassin": "Shines when the party can often surprise foes. It does little when fights start in the open.",
    "Assassin (2024)": "Shines when you often act before your foes, in ambushes and the first round of a fight.",
    "Inquisitive": "Shines in mystery and investigation campaigns.",
    "Mastermind": "Shines in intrigue campaigns, next to allies who make big attacks.",
    "Thief": "Shines with plenty of magic items, traps, locks and climbing.",
    "Thief (2024)": "Shines with plenty of magic items, traps, locks and climbing.",
    "Swashbuckler": "Shines in one-on-one fights, where Sneak Attack needs no help.",
    "Scout": "Shines in wilderness campaigns.",
    "Shadow Stalker": "Shines in dim light, at night and in dungeons, where Shadow Walk works."
  },
  "Sorcerer": {
    "Draconic Bloodline": "Shines when many of your spells deal your dragon's damage type.",
    "Draconic Sorcery": "Shines when many of your spells deal your chosen damage type.",
    "Wild Magic": "Shines at tables that enjoy chaos. Your DM decides when you roll for a surge.",
    "Shadow Magic": "Shines in dark dungeons, where Shadow Walk teleports you from shadow to shadow."
  },
  "Warlock": {
    "The Fathomless": "Shines in sea, coastal and underwater campaigns.",
    "The Undead": "Shines against foes that can be frightened.",
    "The Undying": "Shines in undead-heavy campaigns, where undead struggle to attack you.",
    "The Great Old One": "Shines in intrigue campaigns, where telepathy opens doors.",
    "Great Old One Patron": "Shines in intrigue campaigns, where telepathy opens doors."
  },
  "Wizard": {
    "School of Necromancy": "Shines at tables happy with a horde of undead servants. They slow combat, and some allies may object.",
    "School of Conjuration": "Shines with summoning spells, at tables happy to run many summoned creatures.",
    "School of Enchantment": "Shines against humanoids. Many monsters, like undead and constructs, can't be charmed.",
    "School of Illusion": "Shines at creative tables where the DM rewards clever illusions.",
    "Illusionist": "Shines at creative tables where the DM rewards clever illusions.",
    "School of Evocation": "Shines when your allies fight up close, where Sculpt Spells keeps them out of your blasts.",
    "Evoker": "Shines when your allies fight up close, where Sculpt Spells keeps them out of your blasts.",
    "School of Abjuration": "Shines against enemy spellcasters, with better Counterspell and Dispel Magic.",
    "Abjurer": "Shines against enemy spellcasters, with Counterspell and Dispel Magic always ready."
  }
};

/* The subclass's "shines when" line, or "" when it has none. */
export function subclassShines(className, subclassName){
  return (SUBCLASS_SHINES[className] || {})[subclassName] || "";
}
