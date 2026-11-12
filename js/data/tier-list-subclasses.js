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
    "Battle Smith": r("AABB", "Attacks with Intelligence and brings a Steel Defender that tanks and protects with its reaction."),
    "Armorer": r("AAAA", "Heavy armor and a built-in weapon from level 3. Guardian draws attacks, Infiltrator hits hard from range."),
    "Alchemist (2024)": r("CCCC", "You now choose your elixirs, but it still adds little in a fight."),
    "Armorer (2024)": r("AAAA", "Heavy armor, a built-in weapon and the new Dreadnaught model for melee."),
    "Artillerist (2024)": r("BBBB", "The Eldritch Cannon adds damage or temporary HP each turn without costing your action."),
    "Battle Smith (2024)": r("AABB", "Attacks with Intelligence and brings a Steel Defender that tanks for you."),
    "Cartographer": r("AAAA", "Free Faerie Fire, short teleports and Safe Haven, which saves a falling ally. Strong support."),
    "Reanimator": r("BBBB", "A stitched companion and Jolt to Life to revive the fallen. Good, but slower to set up.")
  },
  "Barbarian": {
    "Path of the Berserker": r("CCCC", "Frenzy's exhaustion makes its best feature costly, and little else comes until late."),
    "Path of the Totem Warrior": r("SSAA", "The Bear totem resists every damage type but psychic while raging. The toughest barbarian."),
    "Path of the Zealot": r("AASS", "Extra damage on the first hit each turn, free resurrection, and Rage Beyond Death at 14."),
    "Path of the Ancestral Guardian": r("AAAA", "Its spirits make foes attack you instead of your friends. One of the best tanks in the game."),
    "Path of Wild Magic": r("BBBB", "Random surges help, and Bolstering Magic boosts allies. Fun but less reliable."),
    "Path of the Beast": r("BBBB", "Natural weapons give extra attacks early, and Infectious Fury at 14 adds control."),
    "Path of the Giant": r("AAAA", "Reach, thrown foes and elemental damage on every hit. Strong and flexible."),
    "Path of the Storm Herald": r("CCCC", "Its aura is small and its numbers too low to matter much."),
    "Path of the Battlerager": r("DDDD", "Spiked armor damage only, and it gives up a shield and stronger armor. The weakest path."),
    "Path of the Berserker (2024)": r("AAAA", "Frenzy is now free extra damage while reckless, with no exhaustion."),
    "Path of the Wild Heart": r("AAAA", "The 2024 Totem Warrior. The bear's resistances still make it very hard to bring down."),
    "Path of the World Tree": r("BAAA", "Temporary HP for the party, short teleports and pulling foes from 10 feet away."),
    "Path of the Zealot (2024)": r("AASS", "Divine Fury on the first hit each turn, healing from its own pool, and Rage of the Gods at 14.")
  },
  "Bard": {
    "College of Lore": r("SSSS", "Cutting Words and extra Magical Secrets at 6. The strongest bard for spells."),
    "College of Valor": r("BABB", "Medium armor, shields and Extra Attack at 6 for a fighting bard."),
    "College of Eloquence": r("SSAA", "Inspiration is never wasted, and Unsettling Words lowers saves for your big spells."),
    "College of Swords": r("BBBB", "Blade flourishes add damage and mobility, but they share your Bardic Inspiration uses."),
    "College of Creation": r("BBBB", "Performance of Creation makes useful items, and the Dancing Item helps in fights."),
    "College of Glamour": r("AABB", "Mantle of Inspiration gives the party temporary HP and free movement. Great early."),
    "College of Spirits": r("BBBB", "Spirit tales are random but often strong. A good support pick."),
    "College of Whispers": r("CCCC", "Psychic blades add some damage, but its tricks rarely come up in a fight."),
    "College of Dance": r("AAAA", "Unarmored AC, unarmed strikes with your inspiration die and better initiative for the party."),
    "College of Glamour (2024)": r("AAAA", "Mantle of Inspiration adds temporary HP and movement, and Mantle of Majesty is free once a day."),
    "College of Lore (2024)": r("SSSS", "Cutting Words, and Magical Discoveries at 6 gives spells from other lists."),
    "College of Valor (2024)": r("BABB", "Martial training and Extra Attack at 6, with a cantrip in place of one attack.")
  },
  "Cleric": {
    "Life Domain": r("AAAA", "Heavy armor and bigger heals on every healing spell. Simple and strong."),
    "Light Domain": r("AAAA", "Warding Flare and Fireball on the list. The blaster cleric."),
    "War Domain": r("BBBB", "Heavy armor and bonus action attacks, but few uses of War Priest."),
    "Knowledge Domain": r("BBBB", "Two skills with Expertise and good control spells. More useful outside combat."),
    "Tempest Domain": r("AAAA", "Heavy armor, and Destructive Wrath maximizes thunder and lightning damage."),
    "Trickery Domain": r("CCCC", "Invoke Duplicity helps, but its other features do little."),
    "Nature Domain": r("CCCC", "Heavy armor and a druid cantrip, but its later features are weak."),
    "Twilight Domain": r("SSSS", "Long darkvision and Twilight Sanctuary's temporary HP every turn. Often called too strong."),
    "Forge Domain": r("AAAA", "AC 20 or more early and fire resistance. A very sturdy front liner."),
    "Order Domain": r("AAAA", "Voice of Authority gives an ally a free attack when you cast a spell on them."),
    "Peace Domain": r("SSSS", "Emboldening Bond adds a d4 to almost everything the party does."),
    "Death Domain": r("BBBB", "Reaper doubles necrotic cantrips, but many undead resist necrotic damage."),
    "Arcana Domain": r("BBBA", "Wizard cantrips and spells, and wizard spells of 6th level and up at 17."),
    "Grave Domain": r("AAAA", "Path to the Grave doubles one hit's damage, and its healing beats death saves."),
    "Fate Domain": r("AAAS", "Strands of Fate gives or takes advantage on the rolls that matter, and Foresight is free at 17."),
    "Life Domain (2024)": r("AAAA", "Heavy armor and bigger heals, with Preserve Life for many allies at once."),
    "Light Domain (2024)": r("AAAA", "Warding Flare, Radiance of the Dawn and Fireball on the list."),
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
    "Circle of the Shepherd": r("SSSS", "Spirit totems and much stronger summoned creatures. The best summoner."),
    "Circle of the Blighted": r("BBBB", "Necrotic damage on spells, a sapling ally at 10 and darker Wild Shapes."),
    "Circle of the Land (2024)": r("AAAA", "Land's Aid heals and harms with one Wild Shape use, plus extra spells by land."),
    "Circle of the Moon (2024)": r("AABB", "Forms use your own HP plus temporary HP, so it is strong but no longer dominant early."),
    "Circle of the Sea": r("AAAA", "Wrath of the Sea deals cold damage and pushes foes every turn."),
    "Circle of the Stars (2024)": r("SSSS", "Starry Form adds healing or a bonus action attack every turn and protects concentration.")
  },
  "Fighter": {
    "Champion": r("CCCC", "More critical hits and little else. Simple, but the weakest of the published fighters."),
    "Battle Master": r("AAAA", "Maneuvers add damage, control and support many times a fight."),
    "Eldritch Knight": r("BBAA", "Shield and Absorb Elements make it very hard to hit. Its spells come slowly."),
    "Echo Knight": r("SSSS", "An echo that attacks from where it stands and lets you teleport. The strongest fighter."),
    "Rune Knight": r("AAAA", "Growing Large and runes add damage, control and help on saves."),
    "Cavalier": r("BBBB", "Marks hold foes on you and protect allies. Great with a mount."),
    "Samurai": r("AAAA", "Fighting Spirit gives advantage and temporary HP. Big damage with a power attack feat."),
    "Arcane Archer": r("CCCC", "Only two arcane shots per short rest, so its main feature runs out fast."),
    "Psi Warrior": r("BBBB", "Psionic dice for damage, a shield for allies and telekinesis."),
    "Banneret (Purple Dragon Knight)": r("DDDD", "Small group healing and a few skills. The weakest fighter."),
    "Gunslinger": r("BBBB", "Firearm damage and trick shots fueled by grit."),
    "Battle Master (2024)": r("AAAA", "Maneuvers add damage, control and support many times a fight."),
    "Champion (2024)": r("BBBB", "Better crits, Remarkable Athlete and Heroic Inspiration each turn at 10. Much improved."),
    "Eldritch Knight (2024)": r("BBAA", "Shield and war magic make it hard to hit and hard to escape. Its spells come slowly."),
    "Psi Warrior (2024)": r("AAAA", "More psionic dice, a shield for allies and telekinesis.")
  },
  "Gunslinger": {
    "Marksman": r("AAAA", "Expert Sniper, crits on a 19 from level 3 and Vital Points. The simplest damage pick."),
    "Outlaw": r("BBBB", "Plus 2 damage with one firearm, two pistols and extra reactions."),
    "Marshal": r("CCBB", "Rerolls low damage dice and Pinpoint Control at 14. Little until then."),
    "Eldritch Gunman": r("AAAA", "Wizard spells such as Shield and a firearm enchantment. The most flexible.")
  },
  "Monk": {
    "Way of the Open Hand": r("AAAA", "Flurry of Blows knocks foes prone or pushes them. Simple and strong."),
    "Way of Shadow": r("AAAA", "Darkness, Pass without Trace and Shadow Step for advantage."),
    "Way of the Four Elements": r("DDDD", "Its spells cost far too much ki. The weakest monk."),
    "Way of Mercy": r("SSSS", "Heals and harms with Flurry of Blows. The best monk."),
    "Way of the Kensei": r("BBBB", "A weapon monk with ranged options and Sharpen the Blade."),
    "Way of the Astral Self": r("BBBB", "Wisdom for attacks and reaching arms, but it eats ki."),
    "Way of the Ascendant Dragon": r("BBBB", "A breath weapon and flight, with more ki costs."),
    "Way of the Drunken Master": r("BBBB", "Free Disengage on Flurry of Blows and turned attacks. Great mobility."),
    "Way of the Sun Soul": r("CCCC", "Ranged radiant bolts, but ki costs limit them."),
    "Way of Long Death": r("CCBB", "Temporary HP on kills and Mastery of Death. Better at high levels."),
    "Warrior of the Open Hand": r("AAAA", "Flurry of Blows knocks foes prone or pushes them. Simple and strong."),
    "Warrior of Shadow": r("AAAA", "Darkness, Shadow Step and teleporting strikes."),
    "Warrior of the Elements": r("BBBB", "Rebuilt with elemental reach and damage instead of costly spells. Now solid."),
    "Warrior of Mercy": r("SSSS", "Heals and harms with Flurry of Blows. The best monk.")
  },
  "Paladin": {
    "Oath of Devotion": r("AAAA", "Sacred Weapon adds Charisma to attacks, and its aura stops charm."),
    "Oath of the Ancients": r("AASS", "Aura of Warding halves spell damage for nearby allies. Superb against casters."),
    "Oath of Vengeance": r("SSSS", "Vow of Enmity gives advantage on one foe all fight. The damage oath."),
    "Oath of Conquest": r("AASS", "Aura of Conquest locks frightened foes in place. Superb control from level 7."),
    "Oathbreaker": r("AAAA", "Charisma on undead allies' attacks and an aura of extra damage."),
    "Oath of Redemption": r("BBBB", "Takes damage for allies and turns it back on attackers."),
    "Oath of Glory": r("AAAA", "Faster movement for the party and Peerless Athlete. Strong buffs."),
    "Oath of the Crown": r("CCCC", "Draws attacks to you, but its features are weak."),
    "Oath of the Watchers": r("BBBB", "Initiative and mental save help for the party. Good against magic."),
    "Oath of Devotion (2024)": r("AAAA", "Sacred Weapon adds Charisma to attacks, and its aura stops charm."),
    "Oath of Glory (2024)": r("AAAA", "Faster movement for the party and Peerless Athlete. Strong buffs."),
    "Oath of the Ancients (2024)": r("AASS", "Aura of Warding halves spell damage for nearby allies. Superb against casters."),
    "Oath of Vengeance (2024)": r("SSSS", "Vow of Enmity gives advantage on one foe all fight. The damage oath.")
  },
  "Ranger": {
    "Hunter": r("BBBB", "Colossus Slayer and a useful choice at each level. Steady damage."),
    "Beast Master": r("DCCC", "The companion costs your actions. Tasha's beasts help, but it stays behind."),
    "Gloom Stalker": r("SSAA", "An extra attack and damage on the first turn, and unseen in darkness."),
    "Fey Wanderer": r("AAAA", "Wisdom on Charisma checks, extra psychic damage and charm resistance."),
    "Horizon Walker": r("BBBB", "Force damage and short teleports. Planar Warrior adds steady damage."),
    "Drakewarden": r("BBBB", "A drake companion with a breath weapon that you can ride from level 15."),
    "Monster Slayer": r("BBBB", "Slayer's Prey damage and good defenses against casters."),
    "Swarmkeeper": r("BAAA", "A free push, pull or extra damage every turn, and flight at 11."),
    "Beast Master (2024)": r("BBBB", "The primal beast now attacks along with you. Much better than before."),
    "Fey Wanderer (2024)": r("AAAA", "Wisdom on Charisma checks, extra psychic damage and charm resistance."),
    "Gloom Stalker (2024)": r("SSAA", "Extra damage on the first turn, better initiative, and unseen in darkness."),
    "Hunter (2024)": r("BBBB", "Colossus Slayer and a choice of defenses. Steady damage.")
  },
  "Rogue": {
    "Thief": r("BBBA", "Fast Hands for items and a second turn in the first round at 17."),
    "Assassin": r("BBCC", "Huge first-round damage when you surprise foes, little otherwise."),
    "Arcane Trickster": r("AAAA", "Shield, Booming Blade and Mage Hand tricks. The strongest rogue."),
    "Swashbuckler": r("AAAA", "Charisma on initiative and Sneak Attack in a duel. Great mobility."),
    "Soulknife": r("AAAA", "Psychic blades that need no weapon and psionic dice for skills."),
    "Phantom": r("BBAA", "Extra Sneak Attack damage on a second target and soul trinkets."),
    "Scout": r("BBBB", "Free movement as a reaction, and Sudden Strike at 17."),
    "Inquisitive": r("CCCC", "Insightful Fighting gives Sneak Attack without help, but little else."),
    "Mastermind": r("CCCC", "Bonus action Help from 30 feet. Support, not damage."),
    "Misfortune Bringer": r("BAAA", "Evil Eye gives Sneak Attack without help, and misfortunes curse foes."),
    "Shadow Stalker": r("BAAS", "Shadow clones for flanking and swaps, and two Sneak Attacks a turn at 17."),
    "Arcane Trickster (2024)": r("AAAA", "Shield, Mage Hand tricks and Magical Ambush."),
    "Assassin (2024)": r("BBBB", "Better first-round damage, and Envenom Weapons adds poison."),
    "Soulknife (2024)": r("AAAA", "Psychic blades that need no weapon and psionic dice for skills."),
    "Thief (2024)": r("BBBA", "Fast Hands for items, Use Magic Device and a second turn in the first round at 17.")
  },
  "Sorcerer": {
    "Draconic Bloodline": r("BBBB", "Better AC and hit points, and extra damage with one element."),
    "Wild Magic": r("CCCC", "Random surges you can't control. Fun but unreliable."),
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
    "The Genie": r("AAAA", "A vessel to rest in, extra damage each turn and a wish at 14."),
    "The Undead": r("AAAA", "Form of Dread frightens on a hit and gives temporary HP."),
    "The Undying": r("DDDD", "Its features keep you alive but rarely matter. The weakest patron."),
    "Archfey Patron": r("AAAA", "Steps of the Fey: free Misty Steps with extra effects."),
    "Celestial Patron": r("AAAA", "Healing Light from a bonus action and extra radiant damage."),
    "Fiend Patron": r("AAAA", "Temporary HP on kills, Fireball, and Dark One's Own Luck."),
    "Great Old One Patron": r("BBBB", "Psychic spells without components, telepathy and Clairvoyant Combatant.")
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
    "School of Conjuration": r("CCCC", "Minor Conjuration and Benign Transposition. Little else."),
    "School of Enchantment": r("CCCC", "Hypnotic Gaze and split enchantments, but many foes resist charm."),
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
