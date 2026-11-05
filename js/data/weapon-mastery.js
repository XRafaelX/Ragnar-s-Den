/* ---------------- Weapon mastery (Player's Handbook 2024) ----------------
   Each weapon's mastery property, from the Weapons table (p. 215), and
   what each property does (Mastery Properties, p. 214), checked against
   the printed book in books/ on 2026-11-05. Only a character with a
   feature that unlocks a weapon's mastery uses it: the Weapon Master
   (2024) feat's kind, or a 2024 class's Weapon Mastery (c.weaponMasteries).
   A weapon the book says to treat as another (a khopesh as a longsword)
   uses that one's. The app's Pistol and Musket are the 2024 book's too.
   `when`: "hit" (after a hit), "miss" (after a miss) or "extra" (the
   Light property's extra attack). */
export var WEAPON_MASTERY = {
  // Simple melee
  "Club": "Slow", "Dagger": "Nick", "Greatclub": "Push", "Handaxe": "Vex", "Javelin": "Slow",
  "Light Hammer": "Nick", "Mace": "Sap", "Quarterstaff": "Topple", "Sickle": "Nick", "Spear": "Sap",
  // Simple ranged
  "Dart": "Vex", "Light Crossbow": "Slow", "Shortbow": "Vex", "Sling": "Slow",
  // Martial melee
  "Battleaxe": "Topple", "Flail": "Sap", "Glaive": "Graze", "Greataxe": "Cleave", "Greatsword": "Graze",
  "Halberd": "Cleave", "Lance": "Topple", "Longsword": "Sap", "Maul": "Topple", "Morningstar": "Sap",
  "Pike": "Push", "Rapier": "Vex", "Scimitar": "Nick", "Shortsword": "Vex", "Trident": "Topple",
  "Warhammer": "Push", "War Pick": "Sap", "Whip": "Slow",
  // Martial ranged
  "Blowgun": "Vex", "Hand Crossbow": "Vex", "Heavy Crossbow": "Push", "Longbow": "Slow", "Musket": "Slow", "Pistol": "Vex"
};

export var MASTERY_PROPERTIES = {
  "Cleave": {when: "hit", short: "On a hit, attack a second creature within 5 feet of it",
    text: "If you hit a creature with a melee attack roll using this weapon, you can make a melee attack roll with the weapon against a second creature within 5 feet of the first that is also within your reach. On a hit, the second creature takes the weapon's damage, but don't add your ability modifier to that damage unless that modifier is negative. You can make this extra attack only once per turn."},
  "Graze": {when: "miss", short: "On a miss, deal damage equal to your ability modifier",
    text: "If your attack roll with this weapon misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the weapon, and the damage can be increased only by increasing the ability modifier."},
  "Nick": {when: "extra", short: "The light weapon's extra attack is part of the Attack action",
    text: "When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can make this extra attack only once per turn."},
  "Push": {when: "hit", short: "On a hit, push a Large or smaller creature 10 feet away",
    text: "If you hit a creature with this weapon, you can push the creature up to 10 feet straight away from yourself if it is Large or smaller."},
  "Sap": {when: "hit", short: "On a hit, its next attack roll has disadvantage",
    text: "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn."},
  "Slow": {when: "hit", short: "On a hit that deals damage, its speed drops by 10 feet",
    text: "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn't exceed 10 feet."},
  "Topple": {when: "hit", short: "On a hit, a Constitution save or it falls prone",
    text: "If you hit a creature with this weapon, you can force the creature to make a Constitution saving throw (DC 8 plus the ability modifier used to make the attack roll and your Proficiency Bonus). On a failed save, the creature has the Prone condition."},
  "Vex": {when: "hit", short: "On a hit that deals damage, advantage on your next attack against it",
    text: "If you hit a creature with this weapon and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn."}
};
