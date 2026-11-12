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
    "Alchemist": r("DCCC", "Random elixirs and small heals. It adds the least in a fight of the four."),
    "Artillerist": r("BBBB", "The Eldritch Cannon adds damage or temporary HP each turn, and its spells hit harder from level 5."),
    "Battle Smith": r("AAAA", "Attacks with Intelligence and brings a Steel Defender. Arcane Jolt at 9 and Improved Defender at 15 keep it strong."),
    "Armorer": r("AAAA", "Heavy armor and a built-in weapon from level 3. Guardian draws attacks, Infiltrator hits hard from range."),
    "Alchemist (2024)": r("CCCC", "You now choose your elixirs, but it still adds little in a fight."),
    "Armorer (2024)": r("AAAA", "Heavy armor, a built-in weapon and the new Dreadnaught model for melee."),
    "Artillerist (2024)": r("BBBB", "The Eldritch Cannon adds damage or temporary HP each turn without costing your action."),
    "Battle Smith (2024)": r("AAAA", "Attacks with Intelligence and brings a Steel Defender that tanks for you. Arcane Jolt and Improved Defender keep it strong."),
    "Cartographer": r("AAAA", "Free Faerie Fire, short teleports and Safe Haven, which saves a falling ally. Strong support."),
    "Reanimator": r("BBBB", "A stitched companion and Jolt to Life to revive the fallen. Good, but slower to set up.")
  },
  "Barbarian": {
    "Path of the Berserker": r("CCBB", "Frenzy's exhaustion makes its best feature costly early. Mindless Rage at 6 and Retaliation's reaction attacks at 14 lift it late."),
    "Path of the Totem Warrior": r("SSSS", "The Bear totem resists every damage type but psychic while raging, which matters more as foes use magic. The toughest barbarian."),
    "Path of the Zealot": r("AASS", "Extra damage on the first hit each turn, free resurrection, and Rage Beyond Death at 14."),
    "Path of the Ancestral Guardian": r("ASSS", "Its spirits make foes attack you instead of your friends, and Spirit Shield at 6 blocks damage for them every round."),
    "Path of Wild Magic": r("CBBB", "Random surges at 3 are hit and miss. Bolstering Magic at 6 boosts allies, and Controlled Surge at 14 tames the chaos."),
    "Path of the Beast": r("AABB", "Claws give an extra attack even before Extra Attack, so it shines early. Infectious Fury at 10 adds some control."),
    "Path of the Giant": r("AAAA", "Reach, thrown foes and elemental damage on every hit. Strong and flexible."),
    "Path of the Storm Herald": r("CCCC", "Its aura is small and its numbers too low to matter much."),
    "Path of the Battlerager": r("DDDD", "Spiked armor damage only, and it gives up a shield and stronger armor. The weakest path."),
    "Path of the Berserker (2024)": r("AAAA", "Frenzy is now free extra damage while reckless, with no exhaustion."),
    "Path of the Wild Heart": r("AAAA", "The 2024 Totem Warrior. The bear's resistances still make it very hard to bring down."),
    "Path of the World Tree": r("BAAA", "Temporary HP for the party, short teleports and pulling foes from 10 feet away."),
    "Path of the Zealot (2024)": r("AASS", "Divine Fury on the first hit each turn, healing from its own pool, and Rage of the Gods at 14.")
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
    "War Domain": r("BBBB", "Heavy armor and bonus action attacks, but few uses of War Priest."),
    "Knowledge Domain": r("BBBB", "Two skills with Expertise and good control spells. More useful outside combat."),
    "Tempest Domain": r("AAAA", "Heavy armor, and Destructive Wrath maximizes thunder and lightning damage."),
    "Trickery Domain": r("CCCC", "Invoke Duplicity helps, but its other features do little."),
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
    "Circle of the Moon (2024)": r("AABB", "Forms use your own HP plus temporary HP, so it is strong but no longer dominant early."),
    "Circle of the Sea": r("AAAA", "Wrath of the Sea deals cold damage and pushes foes every turn."),
    "Circle of the Stars (2024)": r("SSSS", "Starry Form adds healing or a bonus action attack every turn and protects concentration.")
  },
  "Fighter": {
    "Champion": r("CCCB", "More critical hits and little else, so one of the weakest fighters. Crits on 18 to 20 and Survivor help at the top."),
    "Battle Master": r("AAAA", "Maneuvers add damage, control and support many times a fight."),
    "Eldritch Knight": r("BBAA", "Shield and Absorb Elements make it very hard to hit. Its spells come slowly."),
    "Echo Knight": r("SSSS", "An echo that attacks from where it stands and lets you teleport. The strongest fighter."),
    "Rune Knight": r("AAAA", "Growing Large and runes add damage, control and help on saves."),
    "Cavalier": r("BBBB", "Marks hold foes on you and protect allies. Great with a mount."),
    "Samurai": r("AAAA", "Fighting Spirit gives advantage and temporary HP. Big damage with a power attack feat."),
    "Arcane Archer": r("CCCC", "Only two arcane shots per short rest, so its main feature runs out fast."),
    "Psi Warrior": r("BBBA", "Psionic dice for damage, a shield for allies and telekinesis. Telekinetic Master at 18 adds Telekinesis and a bonus action attack."),
    "Banneret (Purple Dragon Knight)": r("DDDD", "Small group healing and a few skills. The weakest fighter."),
    "Gunslinger": r("BBBB", "Firearm damage and trick shots fueled by grit."),
    "Battle Master (2024)": r("AAAA", "Maneuvers add damage, control and support many times a fight."),
    "Champion (2024)": r("BBAA", "Better crits and Remarkable Athlete, then Heroic Inspiration almost every turn from level 10."),
    "Eldritch Knight (2024)": r("BBAA", "Shield and war magic make it hard to hit and hard to escape. Its spells come slowly."),
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
    "Way of the Kensei": r("BBBB", "A weapon monk with ranged options and Sharpen the Blade."),
    "Way of the Astral Self": r("BBBB", "Wisdom for attacks and reaching arms, but it eats ki."),
    "Way of the Ascendant Dragon": r("BBBB", "A breath weapon and flight, with more ki costs."),
    "Way of the Drunken Master": r("BBBB", "Free Disengage on Flurry of Blows and turned attacks. Great mobility."),
    "Way of the Sun Soul": r("CCCC", "Ranged radiant bolts, but ki costs limit them."),
    "Way of Long Death": r("CCBB", "Temporary HP on kills and Mastery of Death. Better at high levels."),
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
    "Oath of Redemption": r("BBBB", "Takes damage for allies and turns it back on attackers."),
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
    "Beast Master": r("DCCC", "The companion costs your actions. Tasha's beasts help, but it stays behind."),
    "Gloom Stalker": r("SSAA", "An extra attack and damage on the first turn, and unseen in darkness."),
    "Fey Wanderer": r("AAAA", "Wisdom on Charisma checks, extra psychic damage and charm resistance."),
    "Horizon Walker": r("BBAA", "Force damage from Planar Warrior, then Distant Strike at 11 teleports between attacks and adds a third attack on a second foe."),
    "Drakewarden": r("BBBB", "A drake companion with a breath weapon, which you can ride as a flying mount from level 7."),
    "Monster Slayer": r("BBBB", "Slayer's Prey damage and good defenses against casters."),
    "Swarmkeeper": r("BAAA", "A free push, pull or extra damage every turn, and short bursts of flight from level 7."),
    "Beast Master (2024)": r("BBAA", "The primal beast attacks along with you, and Bestial Fury at 11 lets it attack twice. Much better than before."),
    "Fey Wanderer (2024)": r("AAAA", "Wisdom on Charisma checks, extra psychic damage and charm resistance."),
    "Gloom Stalker (2024)": r("SSAA", "Extra damage on the first turn, better initiative, and unseen in darkness."),
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
    "Inquisitive": r("CCCB", "Insightful Fighting gives Sneak Attack without help, but little else until Eye for Weakness adds 3d6 at 17."),
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
    "Lunar Sorcery": r("BBBB", "Extra spells by moon phase and cheaper Metamagic."),
    "Aberrant Sorcery": r("SSSS", "Extra spells you can cast with sorcery points and no components."),
    "Clockwork Sorcery": r("AAAA", "Extra spells and Bastion of Law to shield allies."),
    "Draconic Sorcery": r("BBBB", "Better AC and hit points, and extra damage with one element."),
    "Wild Magic Sorcery": r("BBBB", "More control over your surges than the 2014 version.")
  },
  "Warlock": {
    "The Fiend": r("AAAA", "Temporary HP on every kill and Fireball on the list."),
    "The Archfey": r("BBBB", "Fey Presence charms or frightens, and Misty Escape at 6."),
    "The Great Old One": r("BBBB", "Telepathy and good enchantment spells. Better outside combat."),
    "The Hexblade": r("SSSS", "Charisma for weapon attacks, medium armor and shields. The best warlock."),
    "The Celestial": r("AAAA", "Healing Light from a bonus action and extra radiant damage."),
    "The Fathomless": r("BBBB", "A tentacle attack every turn and underwater travel."),
    "The Genie": r("AASS", "Extra damage each turn and a vessel to rest in, then Limited Wish at 14 casts any spell of 6th level or lower."),
    "The Undead": r("AAAA", "Form of Dread frightens on a hit and gives temporary HP."),
    "The Undying": r("DDDD", "Its features keep you alive but rarely matter. The weakest patron."),
    "Archfey Patron": r("AAAA", "Steps of the Fey: free Misty Steps with extra effects."),
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
    "School of Enchantment": r("CCBB", "Hypnotic Gaze early, then Split Enchantment at 10 lets one spell like Hold Monster hit two targets."),
    "School of Transmutation": r("CCCC", "The transmuter's stone and minor alchemy."),
    "Chronurgy Magic": r("SSSS", "Chronal Shift forces rerolls, and Arcane Abeyance stores spells."),
    "Graviturgy Magic": r("BBBB", "Moves foes and allies and adds damage."),
    "Abjurer": r("AAAA", "Arcane Ward absorbs damage, and Spell Breaker helps end spells."),
    "Diviner": r("SSSS", "Portent replaces two d20 rolls each day. The strongest school."),
    "Evoker": r("AAAA", "Potent Cantrip, Sculpt Spells and Empowered Evocation."),
    "Illusionist": r("AAAA", "Free Minor Illusion, Phantasmal Creatures and Illusory Self.")
  }
};

/* The subclass's rating, or null when it isn't rated (custom). */
export function subclassRating(className, subclassName){
  return (SUBCLASS_TIERS[className] || {})[subclassName] || null;
}
