/* ---------------- Magic items for the 2024 artificer's plans ----------------
   The items on Eberron: Forge of the Artificer's Magic Item Plans tables
   that the SRD list (./magic-items-srd.js) doesn't have, from the 2024
   Dungeon Master's Guide and Forge of the Artificer. Checked against
   5etools' items.json and magicvariants.json on 2026-11-12. They join
   MAGIC_ITEM_DATA (so a made item works like any magic item) but not the
   Armory's list: they're made through Replicate Magic Item.

   Fields are explained in ./magic-items.js, plus:
     initiativeAdv  advantage on initiative while it works (a shield only
                    while held)
     skillBonus     {skill: n} added to that skill's checks
     skillAdv       [skills] with advantage on their checks
     unarmed        bonus to unarmed strikes' attack and damage rolls
     spellAttack    bonus to spell attack rolls (a Wand of the War Mage)
     refuel         once a day, get back a spent spell slot of level 3 or lower
   weaponAny also takes "ammo" (a weapon with the ammunition property)
   and "thrown" (one with the thrown property). */
export var ARTIFICER_ITEM_DATA = {
  "Alchemy Jug": {
    kind: "Wondrous item", rarity: "Uncommon", attunement: false,
    text: "This ceramic jug holds a gallon and weighs 12 pounds, full or empty. As a Magic action, name a liquid from the table and the jug makes it. Then you can uncork it as a Utilize action and pour up to 2 gallons a minute. Once it starts on a liquid, it can't make a different one, or more of one that reached its limit, until the next dawn.\n\n| Liquid | Most it makes |\n|---|---|\n| Acid | 8 ounces |\n| Basic Poison | 4 ounces |\n| Beer | 4 gallons |\n| Honey | 1 gallon |\n| Mayonnaise | 2 gallons |\n| Oil | 1 quart |\n| Vinegar | 2 gallons |\n| Water, fresh | 8 gallons |\n| Water, salt | 12 gallons |\n| Wine | 1 gallon |"
  },
  "Cap of Water Breathing": {
    kind: "Wondrous item", rarity: "Uncommon", attunement: false,
    text: "While wearing this cap underwater, you can take a Magic action to make a bubble of air around your head, so you can breathe normally underwater. The bubble stays until you take the cap off or you're no longer underwater."
  },
  "Manifold Tool": {
    kind: "Wondrous item", rarity: "Common", attunement: true,
    text: "This tool looks like a wrench, a screwdriver or another basic tool. As a Magic action, touch it to turn it into any kind of artisan's tools. Whatever form it takes, you're proficient with it when you use it."
  },
  "Sending Stones": {
    kind: "Wondrous item", rarity: "Uncommon", attunement: false,
    text: "These stones come in a matching pair. While you touch one, you can cast Sending from it, and the target is whoever carries the other stone. If no one carries it, you know at once and the spell isn't cast. Once either stone casts Sending, neither can again until the next dawn. If one stone is destroyed, the other stops being magical."
  },
  "Wraps of Unarmed Power, +1": {
    kind: "Wondrous item", rarity: "Uncommon", attunement: false, unarmed: 1,
    text: "While wearing these wraps, you have a +1 bonus to attack and damage rolls with your unarmed strikes. They deal force damage or their normal damage type, your choice."
  },
  "Wraps of Unarmed Power, +2": {
    kind: "Wondrous item", rarity: "Rare", attunement: false, unarmed: 2,
    text: "While wearing these wraps, you have a +2 bonus to attack and damage rolls with your unarmed strikes. They deal force damage or their normal damage type, your choice."
  },
  "Boots of the Winding Path": {
    kind: "Wondrous item", rarity: "Uncommon", attunement: true,
    text: "While wearing these boots, you can take a bonus action to teleport up to 15 feet to an unoccupied space you can see that you were in at some point this turn."
  },
  "Gloves of Thievery": {
    kind: "Wondrous item", rarity: "Uncommon", attunement: false, skillBonus: {"Sleight of Hand": 5},
    text: "These gloves can't be noticed while worn. While wearing them, you have a +5 bonus to Dexterity (Sleight of Hand) checks."
  },
  "Helm of Awareness": {
    kind: "Wondrous item", rarity: "Uncommon", attunement: false, initiativeAdv: true,
    text: "While wearing this helmet, you have advantage on initiative rolls."
  },
  "Mind Sharpener": {
    kind: "Ring", rarity: "Uncommon", attunement: true, charges: {max: 4, regain: "1d4"},
    text: "The item has 4 charges. When you fail a Constitution saving throw to keep concentrating, you can take a reaction and spend 1 charge to succeed instead. It regains 1d4 charges each dawn."
  },
  "Spell-Refueling Ring": {
    kind: "Ring", rarity: "Uncommon", attunement: true, attuneBy: "a spellcaster", refuel: true,
    text: "While wearing this ring, you can take a bonus action to get back one spent spell slot of level 3 or lower. Once used, it can't be used again until the next dawn."
  },
  "Shield, +1": {
    kind: "Armor (shield)", rarity: "Uncommon", attunement: false, armor: "Shield", bonus: 1,
    text: "While holding this shield, you have a +1 bonus to AC, on top of the shield's normal bonus."
  },
  "Shield, +2": {
    kind: "Armor (shield)", rarity: "Rare", attunement: false, armor: "Shield", bonus: 2,
    text: "While holding this shield, you have a +2 bonus to AC, on top of the shield's normal bonus."
  },
  "Repulsion Shield": {
    kind: "Armor (shield)", rarity: "Uncommon", attunement: false, armor: "Shield", bonus: 1, charges: {max: 4, regain: "1d4"},
    text: "You have a +1 bonus to AC while wielding this shield. It has 4 charges. While you hold it, when a Large or smaller creature within 5 feet hits you with a melee attack, you can take a reaction and spend 1 charge to push the attacker up to 15 feet straight away. It regains 1d4 charges each dawn."
  },
  "Sentinel Shield": {
    kind: "Armor (shield)", rarity: "Uncommon", attunement: false, armor: "Shield", initiativeAdv: true, skillAdv: ["Perception"],
    text: "While holding this shield, you have advantage on initiative rolls and Wisdom (Perception) checks. It bears the symbol of an eye."
  },
  "Dazzling Weapon": {
    kind: "Weapon (any simple or martial)", rarity: "Rare", attunement: true, weaponAny: "any", bonus: 1, charges: {max: 4, regain: "1d4"},
    text: "You have a +1 bonus to attack and damage rolls made with this magic weapon. While holding it, you can take a bonus action to make it shed bright light in a 30-foot radius and dim light 30 feet beyond, and a bonus action to put the light out. It has 4 charges. Right after you're hit by an attack roll, you can take a reaction and spend 1 charge: the attacker makes a DC 15 Constitution saving throw or is blinded until the end of its next turn. It regains 1d4 charges each dawn."
  },
  "Repeating Shot": {
    kind: "Weapon (any simple or martial with the ammunition property)", rarity: "Uncommon", attunement: true, weaponAny: "ammo", bonus: 1,
    text: "You have a +1 bonus to attack and damage rolls made with this magic weapon when you make a ranged attack with it, and it ignores the loading property. If you have no ammunition, it makes one piece of magic ammunition when you make a ranged attack roll with it, which vanishes the instant after it hits or misses."
  },
  "Returning Weapon": {
    kind: "Weapon (any simple or martial with the thrown property)", rarity: "Uncommon", attunement: false, weaponAny: "thrown", bonus: 1,
    text: "You have a +1 bonus to attack and damage rolls made with this magic weapon, and it returns to your hand right after you use it to make a ranged attack roll."
  },
  "Weapon of Warning": {
    kind: "Weapon (any simple or martial)", rarity: "Uncommon", attunement: true, weaponAny: "any", initiativeAdv: true,
    text: "While this weapon is within your reach and you're attuned to it, you and allies within 30 feet have advantage on initiative rolls, and it wakes each of you who is sleeping naturally (not magically) when combat begins."
  }
};
