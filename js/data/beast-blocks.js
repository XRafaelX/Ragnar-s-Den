/* ---------------- Beasts and familiars: SRD 5.1 stat blocks ----------------
   Generated from the System Reference Document 5.1 (Wizards of the Coast,
   CC BY 4.0, via dnd5eapi.co, 2026-10-20), in BEAST_PRESETS' shape (see
   ./companions.js): every beast a Beast Master can take (Medium or
   smaller, challenge rating 1/4 or lower), every Find Familiar form,
   Pact of the Chain's four, and the PHB's mounts (MOUNTS, a Cavalier's
   Mount card; added 2026-10-21). */
export var BEAST_MASTER_BEASTS = ["Baboon", "Badger", "Bat", "Blood Hawk", "Boar", "Cat", "Crab", "Deer", "Eagle", "Flying Snake", "Frog", "Giant Badger", "Giant Centipede", "Giant Crab", "Giant Fire Beetle", "Giant Frog", "Giant Poisonous Snake", "Giant Rat", "Giant Rat (Diseased)", "Giant Weasel", "Giant Wolf Spider", "Goat", "Hawk", "Hyena", "Jackal", "Lizard", "Mastiff", "Mule", "Octopus", "Owl", "Panther", "Poisonous Snake", "Pony", "Quipper", "Rat", "Raven", "Scorpion", "Sea Horse", "Spider", "Stirge", "Vulture", "Weasel", "Wolf"];
export var FAMILIAR_FORMS = ["Bat", "Cat", "Crab", "Frog", "Hawk", "Lizard", "Octopus", "Owl", "Poisonous Snake", "Quipper", "Rat", "Raven", "Sea Horse", "Spider", "Weasel"];
export var CHAIN_FAMILIARS = ["Imp", "Pseudodragon", "Quasit", "Sprite"];
/* The PHB's Mounts and Vehicles table, in its order. */
export var MOUNTS = ["Camel", "Mule", "Draft Horse", "Elephant", "Mastiff", "Pony", "Riding Horse", "Warhorse"];

export var SRD_STAT_BLOCKS = {
 "Baboon": {
  "name": "Baboon",
  "size": "Small",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 3,
  "speed": "30 ft, climb 30 ft",
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 11,
   "int": 4,
   "wis": 12,
   "cha": 6
  },
  "skills": "",
  "senses": "passive Perception 11",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 1,
    "dice": "1d4",
    "bonus": -1,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Pack Tactics: The baboon has advantage on an attack roll against a creature if at least one of the baboon's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 },
 "Badger": {
  "name": "Badger",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 10,
  "hp": 3,
  "speed": "20 ft, burrow 5 ft",
  "abilities": {
   "str": 4,
   "dex": 11,
   "con": 12,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "skills": "",
  "senses": "darkvision 30 ft, passive Perception 11",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 2,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Smell: The badger has advantage on Wisdom (Perception) checks that rely on smell."
 },
 "Bat": {
  "name": "Bat",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 1,
  "speed": "5 ft, fly 30 ft",
  "abilities": {
   "str": 2,
   "dex": 15,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "skills": "",
  "senses": "blindsight 60 ft, passive Perception 11",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 0,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Echolocation: The bat can't use its blindsight while deafened. Keen Hearing: The bat has advantage on Wisdom (Perception) checks that rely on hearing."
 },
 "Blood Hawk": {
  "name": "Blood Hawk",
  "size": "Small",
  "type": "beast",
  "cr": 0.125,
  "ac": 12,
  "hp": 7,
  "speed": "10 ft, fly 60 ft",
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 10,
   "int": 3,
   "wis": 14,
   "cha": 5
  },
  "skills": "Perception +4",
  "senses": "passive Perception 14",
  "attacks": [
   {
    "name": "Beak",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Sight: The hawk has advantage on Wisdom (Perception) checks that rely on sight. Pack Tactics: The hawk has advantage on an attack roll against a creature if at least one of the hawk's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 },
 "Boar": {
  "name": "Boar",
  "size": "Medium",
  "type": "beast",
  "cr": 0.25,
  "ac": 11,
  "hp": 11,
  "speed": "40 ft",
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 12,
   "int": 2,
   "wis": 9,
   "cha": 5
  },
  "skills": "",
  "senses": "passive Perception 9",
  "attacks": [
   {
    "name": "Tusk",
    "toHit": 3,
    "dice": "1d6",
    "bonus": 1,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Charge: If the boar moves at least 20 ft. straight toward a target and then hits it with a tusk attack on the same turn, the target takes an extra 3 (1d6) slashing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone. Relentless: If the boar takes 7 damage or less that would reduce it to 0 hit points, it is reduced to 1 hit point instead."
 },
 "Camel": {
  "name": "Camel",
  "size": "Large",
  "type": "beast",
  "cr": 0.125,
  "ac": 9,
  "hp": 15,
  "speed": "50 ft",
  "abilities": {
   "str": 16,
   "dex": 8,
   "con": 14,
   "int": 2,
   "wis": 8,
   "cha": 5
  },
  "skills": "",
  "senses": "passive Perception 9",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 5,
    "dice": "1d4",
    "bonus": 0,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": ""
 },
 "Cat": {
  "name": "Cat",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 2,
  "speed": "40 ft, climb 30 ft",
  "abilities": {
   "str": 3,
   "dex": 15,
   "con": 10,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "skills": "Perception +3, Stealth +4",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Claws",
    "toHit": 0,
    "dice": "1",
    "bonus": 0,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Smell: The cat has advantage on Wisdom (Perception) checks that rely on smell."
 },
 "Crab": {
  "name": "Crab",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 11,
  "hp": 2,
  "speed": "20 ft, swim 20 ft",
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 10,
   "int": 1,
   "wis": 8,
   "cha": 2
  },
  "skills": "Stealth +2",
  "senses": "blindsight 30 ft, passive Perception 9",
  "attacks": [
   {
    "name": "Claw",
    "toHit": 0,
    "dice": "1",
    "bonus": 0,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Amphibious: The crab can breathe air and water."
 },
 "Deer": {
  "name": "Deer",
  "size": "Medium",
  "type": "beast",
  "cr": 0,
  "ac": 13,
  "hp": 4,
  "speed": "50 ft",
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 11,
   "int": 2,
   "wis": 14,
   "cha": 5
  },
  "skills": "",
  "senses": "passive Perception 12",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 2,
    "dice": "1d4",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": ""
 },
 "Draft Horse": {
  "name": "Draft Horse",
  "size": "Large",
  "type": "beast",
  "cr": 0.25,
  "ac": 10,
  "hp": 19,
  "speed": "40 ft",
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 12,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "skills": "",
  "senses": "passive Perception 10",
  "attacks": [
   {
    "name": "Hooves",
    "toHit": 6,
    "dice": "2d4",
    "bonus": 4,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": ""
 },
 "Eagle": {
  "name": "Eagle",
  "size": "Small",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 3,
  "speed": "10 ft, fly 60 ft",
  "abilities": {
   "str": 6,
   "dex": 15,
   "con": 10,
   "int": 2,
   "wis": 14,
   "cha": 7
  },
  "skills": "Perception +4",
  "senses": "passive Perception 14",
  "attacks": [
   {
    "name": "Talons",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Sight: The eagle has advantage on Wisdom (Perception) checks that rely on sight."
 },
 "Elephant": {
  "name": "Elephant",
  "size": "Huge",
  "type": "beast",
  "cr": 4,
  "ac": 12,
  "hp": 76,
  "speed": "40 ft",
  "abilities": {
   "str": 22,
   "dex": 9,
   "con": 17,
   "int": 3,
   "wis": 11,
   "cha": 6
  },
  "skills": "",
  "senses": "passive Perception 10",
  "attacks": [
   {
    "name": "Gore",
    "toHit": 8,
    "dice": "3d8",
    "bonus": 6,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   },
   {
    "name": "Stomp",
    "toHit": 8,
    "dice": "3d10",
    "bonus": 6,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft, one prone creature."
   }
  ],
  "traits": "Trampling Charge: If the elephant moves at least 20 ft. straight toward a creature and then hits it with a gore attack on the same turn, that target must succeed on a DC 12 Strength saving throw or be knocked prone. If the target is prone, the elephant can make one stomp attack against it as a bonus action."
 },
 "Flying Snake": {
  "name": "Flying Snake",
  "size": "Tiny",
  "type": "beast",
  "cr": 0.125,
  "ac": 14,
  "hp": 5,
  "speed": "30 ft, fly 60 ft, swim 30 ft",
  "abilities": {
   "str": 4,
   "dex": 18,
   "con": 11,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "skills": "",
  "senses": "blindsight 10 ft, passive Perception 11",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 6,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft. Plus 7 (3d4) poison damage."
   }
  ],
  "traits": "Flyby: The snake doesn't provoke opportunity attacks when it flies out of an enemy's reach."
 },
 "Frog": {
  "name": "Frog",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 11,
  "hp": 1,
  "speed": "20 ft, swim 20 ft",
  "abilities": {
   "str": 1,
   "dex": 13,
   "con": 8,
   "int": 1,
   "wis": 8,
   "cha": 3
  },
  "skills": "Perception +1, Stealth +3",
  "senses": "darkvision 30 ft, passive Perception 11",
  "attacks": [],
  "traits": "Amphibious: The frog can breathe air and water Standing Leap: The frog's long jump is up to 10 ft. and its high jump is up to 5 ft., with or without a running start."
 },
 "Giant Badger": {
  "name": "Giant Badger",
  "size": "Medium",
  "type": "beast",
  "cr": 0.25,
  "ac": 10,
  "hp": 13,
  "speed": "30 ft, burrow 10 ft",
  "abilities": {
   "str": 13,
   "dex": 10,
   "con": 15,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "skills": "",
  "senses": "darkvision 30 ft, passive Perception 11",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 3,
    "dice": "1d6",
    "bonus": 1,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   },
   {
    "name": "Claws",
    "toHit": 3,
    "dice": "2d4",
    "bonus": 1,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Smell: The badger has advantage on Wisdom (Perception) checks that rely on smell."
 },
 "Giant Centipede": {
  "name": "Giant Centipede",
  "size": "Small",
  "type": "beast",
  "cr": 0.25,
  "ac": 13,
  "hp": 4,
  "speed": "30 ft, climb 30 ft",
  "abilities": {
   "str": 5,
   "dex": 14,
   "con": 12,
   "int": 1,
   "wis": 7,
   "cha": 3
  },
  "skills": "",
  "senses": "blindsight 30 ft, passive Perception 8",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must succeed on a DC 11 Constitution saving throw or take 10 (3d6) poison damage. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way."
   }
  ],
  "traits": ""
 },
 "Giant Crab": {
  "name": "Giant Crab",
  "size": "Medium",
  "type": "beast",
  "cr": 0.125,
  "ac": 15,
  "hp": 13,
  "speed": "30 ft, swim 30 ft",
  "abilities": {
   "str": 13,
   "dex": 15,
   "con": 11,
   "int": 1,
   "wis": 9,
   "cha": 3
  },
  "skills": "Stealth +4",
  "senses": "blindsight 30 ft, passive Perception 9",
  "attacks": [
   {
    "name": "Claw",
    "toHit": 3,
    "dice": "1d6",
    "bonus": 1,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft. The target is grappled (escape DC 11). The crab has two claws, each of which can grapple only one target."
   }
  ],
  "traits": "Amphibious: The crab can breathe air and water."
 },
 "Giant Fire Beetle": {
  "name": "Giant Fire Beetle",
  "size": "Small",
  "type": "beast",
  "cr": 0,
  "ac": 13,
  "hp": 4,
  "speed": "30 ft",
  "abilities": {
   "str": 8,
   "dex": 10,
   "con": 12,
   "int": 1,
   "wis": 7,
   "cha": 3
  },
  "skills": "",
  "senses": "blindsight 30 ft, passive Perception 8",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 1,
    "dice": "1d6",
    "bonus": -1,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Illumination: The beetle sheds bright light in a 10-foot radius and dim light for an additional 10 ft.."
 },
 "Giant Frog": {
  "name": "Giant Frog",
  "size": "Medium",
  "type": "beast",
  "cr": 0.25,
  "ac": 11,
  "hp": 18,
  "speed": "30 ft, swim 30 ft",
  "abilities": {
   "str": 12,
   "dex": 13,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "skills": "Perception +2, Stealth +3",
  "senses": "darkvision 30 ft, passive Perception 12",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 3,
    "dice": "1d6",
    "bonus": 1,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target is grappled (escape DC 11). Until this grapple ends, the target is restrained, and the frog can't bite another target."
   }
  ],
  "traits": "Amphibious: The frog can breathe air and water Standing Leap: The frog's long jump is up to 20 ft. and its high jump is up to 10 ft., with or without a running start."
 },
 "Giant Poisonous Snake": {
  "name": "Giant Poisonous Snake",
  "size": "Medium",
  "type": "beast",
  "cr": 0.25,
  "ac": 14,
  "hp": 11,
  "speed": "30 ft, swim 30 ft",
  "abilities": {
   "str": 10,
   "dex": 18,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "skills": "Perception +2",
  "senses": "blindsight 10 ft, passive Perception 12",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 6,
    "dice": "1d4",
    "bonus": 4,
    "damageType": "piercing",
    "text": "Reach 10 ft. The target must make a DC 11 Constitution saving throw, taking 10 (3d6) poison damage on a failed save, or half as much damage on a successful one."
   }
  ],
  "traits": ""
 },
 "Giant Rat": {
  "name": "Giant Rat",
  "size": "Small",
  "type": "beast",
  "cr": 0.125,
  "ac": 12,
  "hp": 7,
  "speed": "30 ft",
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "skills": "",
  "senses": "darkvision 60 ft, passive Perception 10",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Smell: The rat has advantage on Wisdom (Perception) checks that rely on smell. Pack Tactics: The rat has advantage on an attack roll against a creature if at least one of the rat's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 },
 "Giant Rat (Diseased)": {
  "name": "Giant Rat (Diseased)",
  "size": "Small",
  "type": "beast",
  "cr": 0.125,
  "ac": 12,
  "hp": 7,
  "speed": "30 ft",
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "skills": "",
  "senses": "darkvision 60 ft, passive Perception 10",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft. If the target is a creature, it must succeed on a DC 10 Constitution saving throw or contract a disease. Until the disease is cured, the target can't regain hit points except by magical means, and the target's hit point maximum decreases by 3 (1d6) every 24 hours. If the target's hit point maximum drops to 0 as a result of this disease, the target dies."
   }
  ],
  "traits": "Keen Smell: The rat has advantage on Wisdom (Perception) checks that rely on smell. Pack Tactics: The rat has advantage on an attack roll against a creature if at least one of the rat's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 },
 "Giant Weasel": {
  "name": "Giant Weasel",
  "size": "Medium",
  "type": "beast",
  "cr": 0.125,
  "ac": 13,
  "hp": 9,
  "speed": "40 ft",
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 10,
   "int": 4,
   "wis": 12,
   "cha": 5
  },
  "skills": "Perception +3, Stealth +5",
  "senses": "darkvision 60 ft, passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 5,
    "dice": "1d4",
    "bonus": 3,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Hearing and Smell: The weasel has advantage on Wisdom (Perception) checks that rely on hearing or smell."
 },
 "Giant Wolf Spider": {
  "name": "Giant Wolf Spider",
  "size": "Medium",
  "type": "beast",
  "cr": 0.25,
  "ac": 13,
  "hp": 11,
  "speed": "40 ft, climb 40 ft",
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 13,
   "int": 3,
   "wis": 12,
   "cha": 4
  },
  "skills": "Perception +3, Stealth +7",
  "senses": "blindsight 10 ft, darkvision 60 ft, passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 3,
    "dice": "1d6",
    "bonus": 1,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must make a DC 11 Constitution saving throw, taking 7 (2d6) poison damage on a failed save, or half as much damage on a successful one. If the poison damage reduces the target to 0 hit points, the target is stable but poisoned for 1 hour, even after regaining hit points, and is paralyzed while poisoned in this way."
   }
  ],
  "traits": "Spider Climb: The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check. Web Sense: While in contact with a web, the spider knows the exact location of any other creature in contact with the same web. Web Walker: The spider ignores movement restrictions caused by webbing."
 },
 "Goat": {
  "name": "Goat",
  "size": "Medium",
  "type": "beast",
  "cr": 0,
  "ac": 10,
  "hp": 4,
  "speed": "40 ft",
  "abilities": {
   "str": 12,
   "dex": 10,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "skills": "",
  "senses": "passive Perception 10",
  "attacks": [
   {
    "name": "Ram",
    "toHit": 3,
    "dice": "1d4",
    "bonus": 1,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Charge: If the goat moves at least 20 ft. straight toward a target and then hits it with a ram attack on the same turn, the target takes an extra 2 (1d4) bludgeoning damage. If the target is a creature, it must succeed on a DC 10 Strength saving throw or be knocked prone. Sure-Footed: The goat has advantage on Strength and Dexterity saving throws made against effects that would knock it prone."
 },
 "Hawk": {
  "name": "Hawk",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 13,
  "hp": 1,
  "speed": "10 ft, fly 60 ft",
  "abilities": {
   "str": 5,
   "dex": 16,
   "con": 8,
   "int": 2,
   "wis": 14,
   "cha": 6
  },
  "skills": "Perception +4",
  "senses": "passive Perception 14",
  "attacks": [
   {
    "name": "Talons",
    "toHit": 5,
    "dice": "1",
    "bonus": 0,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Sight: The hawk has advantage on Wisdom (Perception) checks that rely on sight."
 },
 "Hyena": {
  "name": "Hyena",
  "size": "Medium",
  "type": "beast",
  "cr": 0,
  "ac": 11,
  "hp": 5,
  "speed": "50 ft",
  "abilities": {
   "str": 11,
   "dex": 13,
   "con": 12,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "skills": "Perception +3",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 2,
    "dice": "1d6",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Pack Tactics: The hyena has advantage on an attack roll against a creature if at least one of the hyena's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 },
 "Imp": {
  "name": "Imp",
  "size": "Tiny",
  "type": "fiend",
  "cr": 1,
  "ac": 13,
  "hp": 10,
  "speed": "20 ft, fly 40 ft",
  "abilities": {
   "str": 6,
   "dex": 17,
   "con": 13,
   "int": 11,
   "wis": 12,
   "cha": 14
  },
  "skills": "Deception +4, Insight +3, Persuasion +4, Stealth +5",
  "senses": "darkvision 120 ft, passive Perception 11",
  "attacks": [
   {
    "name": "Sting (Bite in Beast Form)",
    "toHit": 5,
    "dice": "1d4",
    "bonus": 3,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must make a DC 11 Constitution saving throw, taking 10 (3d6) poison damage on a failed save, or half as much damage on a successful one."
   }
  ],
  "traits": "Shapechanger: The imp can use its action to polymorph into a beast form that resembles a rat (speed 20 ft.), a raven (20 ft., fly 60 ft.), or a spider (20 ft., climb 20 ft.), or back into its true form. Its statistics are the same in each form, except for the speed changes noted. Any equipment it is wearing or carrying isn't transformed. It reverts to its true form if it dies. Devil's Sight: Magical darkness doesn't impede the imp's darkvision. Magic Resistance: The imp has advantage on saving throws against spells and other magical effects."
 },
 "Jackal": {
  "name": "Jackal",
  "size": "Small",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 3,
  "speed": "40 ft",
  "abilities": {
   "str": 8,
   "dex": 15,
   "con": 11,
   "int": 3,
   "wis": 12,
   "cha": 6
  },
  "skills": "Perception +3",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 1,
    "dice": "1d4",
    "bonus": -1,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Hearing and Smell: The jackal has advantage on Wisdom (Perception) checks that rely on hearing or smell. Pack Tactics: The jackal has advantage on an attack roll against a creature if at least one of the jackal's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 },
 "Lizard": {
  "name": "Lizard",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 10,
  "hp": 2,
  "speed": "20 ft, climb 20 ft",
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 10,
   "int": 1,
   "wis": 8,
   "cha": 3
  },
  "skills": "",
  "senses": "darkvision 30 ft, passive Perception 9",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 0,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": ""
 },
 "Mastiff": {
  "name": "Mastiff",
  "size": "Medium",
  "type": "beast",
  "cr": 0.125,
  "ac": 12,
  "hp": 5,
  "speed": "40 ft",
  "abilities": {
   "str": 13,
   "dex": 14,
   "con": 12,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "skills": "Perception +3",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 3,
    "dice": "1d6",
    "bonus": 1,
    "damageType": "piercing",
    "text": "Reach 5 ft. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone."
   }
  ],
  "traits": "Keen Hearing and Smell: The mastiff has advantage on Wisdom (Perception) checks that rely on hearing or smell."
 },
 "Mule": {
  "name": "Mule",
  "size": "Medium",
  "type": "beast",
  "cr": 0.125,
  "ac": 10,
  "hp": 11,
  "speed": "40 ft",
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "skills": "",
  "senses": "passive Perception 10",
  "attacks": [
   {
    "name": "Hooves",
    "toHit": 2,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Beast of Burden: The mule is considered to be a Large animal for the purpose of determining its carrying capacity. Sure-Footed: The mule has advantage on Strength and Dexterity saving throws made against effects that would knock it prone."
 },
 "Octopus": {
  "name": "Octopus",
  "size": "Small",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 3,
  "speed": "5 ft, swim 30 ft",
  "abilities": {
   "str": 4,
   "dex": 15,
   "con": 11,
   "int": 3,
   "wis": 10,
   "cha": 4
  },
  "skills": "Perception +2, Stealth +4",
  "senses": "darkvision 30 ft, passive Perception 12",
  "attacks": [
   {
    "name": "Tentacles",
    "toHit": 4,
    "dice": "1",
    "bonus": 0,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft. The target is grappled (escape DC 10). Until this grapple ends, the octopus can't use its tentacles on another target."
   }
  ],
  "traits": "Hold Breath: While out of water, the octopus can hold its breath for 30 minutes. Underwater Camouflage: The octopus has advantage on Dexterity (Stealth) checks made while underwater. Water Breathing: The octopus can breathe only underwater."
 },
 "Owl": {
  "name": "Owl",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 11,
  "hp": 1,
  "speed": "5 ft, fly 60 ft",
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "skills": "Perception +3, Stealth +3",
  "senses": "darkvision 120 ft, passive Perception 13",
  "attacks": [
   {
    "name": "Talons",
    "toHit": 3,
    "dice": "1",
    "bonus": 0,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Flyby: The owl doesn't provoke opportunity attacks when it flies out of an enemy's reach. Keen Hearing and Sight: The owl has advantage on Wisdom (Perception) checks that rely on hearing or sight."
 },
 "Panther": {
  "name": "Panther",
  "size": "Medium",
  "type": "beast",
  "cr": 0.25,
  "ac": 12,
  "hp": 13,
  "speed": "50 ft, climb 40 ft",
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 10,
   "int": 3,
   "wis": 14,
   "cha": 7
  },
  "skills": "Perception +4, Stealth +6",
  "senses": "passive Perception 14",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 4,
    "dice": "1d6",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   },
   {
    "name": "Claw",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Smell: The panther has advantage on Wisdom (Perception) checks that rely on smell. Pounce: If the panther moves at least 20 ft. straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a DC 12 Strength saving throw or be knocked prone. If the target is prone, the panther can make one bite attack against it as a bonus action."
 },
 "Poisonous Snake": {
  "name": "Poisonous Snake",
  "size": "Tiny",
  "type": "beast",
  "cr": 0.125,
  "ac": 13,
  "hp": 2,
  "speed": "30 ft, swim 30 ft",
  "abilities": {
   "str": 2,
   "dex": 16,
   "con": 11,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "skills": "",
  "senses": "blindsight 10 ft, passive Perception 10",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 5,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must make a DC 10 Constitution saving throw, taking 5 (2d4) poison damage on a failed save, or half as much damage on a successful one."
   }
  ],
  "traits": ""
 },
 "Pony": {
  "name": "Pony",
  "size": "Medium",
  "type": "beast",
  "cr": 0.125,
  "ac": 10,
  "hp": 11,
  "speed": "40 ft",
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "skills": "",
  "senses": "passive Perception 10",
  "attacks": [
   {
    "name": "Hooves",
    "toHit": 4,
    "dice": "2d4",
    "bonus": 2,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": ""
 },
 "Pseudodragon": {
  "name": "Pseudodragon",
  "size": "Tiny",
  "type": "dragon",
  "cr": 0.25,
  "ac": 13,
  "hp": 7,
  "speed": "15 ft, fly 60 ft",
  "abilities": {
   "str": 6,
   "dex": 15,
   "con": 13,
   "int": 10,
   "wis": 12,
   "cha": 10
  },
  "skills": "Perception +3, Stealth +4",
  "senses": "blindsight 10 ft, darkvision 60 ft, passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   },
   {
    "name": "Sting",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must succeed on a DC 11 Constitution saving throw or become poisoned for 1 hour. If the saving throw fails by 5 or more, the target falls unconscious for the same duration, or until it takes damage or another creature uses an action to shake it awake."
   }
  ],
  "traits": "Keen Senses: The pseudodragon has advantage on Wisdom (Perception) checks that rely on sight, hearing, or smell. Magic Resistance: The pseudodragon has advantage on saving throws against spells and other magical effects. Limited Telepathy: The pseudodragon can magically communicate simple ideas, emotions, and images telepathically with any creature within 100 ft. of it that can understand a language."
 },
 "Quasit": {
  "name": "Quasit",
  "size": "Tiny",
  "type": "fiend",
  "cr": 1,
  "ac": 13,
  "hp": 7,
  "speed": "40 ft",
  "abilities": {
   "str": 5,
   "dex": 17,
   "con": 10,
   "int": 7,
   "wis": 10,
   "cha": 10
  },
  "skills": "Stealth +5",
  "senses": "darkvision 120 ft, passive Perception 10",
  "attacks": [
   {
    "name": "Claw (Bite in Beast Form)",
    "toHit": 4,
    "dice": "1d4",
    "bonus": 3,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must succeed on a DC 10 Constitution saving throw or take 5 (2d4) poison damage and become poisoned for 1 minute. The target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success."
   }
  ],
  "traits": "Shapechanger: The quasit can use its action to polymorph into a beast form that resembles a bat (speed 10 ft. fly 40 ft.), a centipede (40 ft., climb 40 ft.), or a toad (40 ft., swim 40 ft.), or back into its true form . Its statistics are the same in each form, except for the speed changes noted. Any equipment it is wearing or carrying isn't transformed . It reverts to its true form if it dies. Magic Resistance: The quasit has advantage on saving throws against spells and other magical effects."
 },
 "Quipper": {
  "name": "Quipper",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 13,
  "hp": 1,
  "speed": "0 ft, swim 40 ft",
  "abilities": {
   "str": 2,
   "dex": 16,
   "con": 9,
   "int": 1,
   "wis": 7,
   "cha": 2
  },
  "skills": "",
  "senses": "darkvision 60 ft, passive Perception 8",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 5,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Blood Frenzy: The quipper has advantage on melee attack rolls against any creature that doesn't have all its hit points. Water Breathing: The quipper can breathe only underwater."
 },
 "Rat": {
  "name": "Rat",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 10,
  "hp": 1,
  "speed": "20 ft",
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 9,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "skills": "",
  "senses": "darkvision 30 ft, passive Perception 10",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 0,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Smell: The rat has advantage on Wisdom (Perception) checks that rely on smell."
 },
 "Raven": {
  "name": "Raven",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 1,
  "speed": "10 ft, fly 50 ft",
  "abilities": {
   "str": 2,
   "dex": 14,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 6
  },
  "skills": "Perception +3",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Beak",
    "toHit": 4,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Mimicry: The raven can mimic simple sounds it has heard, such as a person whispering, a baby crying, or an animal chittering. A creature that hears the sounds can tell they are imitations with a successful DC 10 Wisdom (Insight) check."
 },
 "Riding Horse": {
  "name": "Riding Horse",
  "size": "Large",
  "type": "beast",
  "cr": 0.25,
  "ac": 10,
  "hp": 13,
  "speed": "60 ft",
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 12,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "skills": "",
  "senses": "passive Perception 10",
  "attacks": [
   {
    "name": "Hooves",
    "toHit": 5,
    "dice": "2d4",
    "bonus": 3,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": ""
 },
 "Scorpion": {
  "name": "Scorpion",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 11,
  "hp": 1,
  "speed": "10 ft",
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 8,
   "int": 1,
   "wis": 8,
   "cha": 2
  },
  "skills": "",
  "senses": "blindsight 10 ft, passive Perception 9",
  "attacks": [
   {
    "name": "Sting",
    "toHit": 2,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must make a DC 9 Constitution saving throw, taking 4 (1d8) poison damage on a failed save, or half as much damage on a successful one."
   }
  ],
  "traits": ""
 },
 "Sea Horse": {
  "name": "Sea Horse",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 11,
  "hp": 1,
  "speed": "0 ft, swim 20 ft",
  "abilities": {
   "str": 1,
   "dex": 12,
   "con": 8,
   "int": 1,
   "wis": 10,
   "cha": 2
  },
  "skills": "",
  "senses": "passive Perception 10",
  "attacks": [],
  "traits": "Water Breathing: The sea horse can breathe only underwater."
 },
 "Spider": {
  "name": "Spider",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 12,
  "hp": 1,
  "speed": "20 ft, climb 20 ft",
  "abilities": {
   "str": 2,
   "dex": 14,
   "con": 8,
   "int": 1,
   "wis": 10,
   "cha": 2
  },
  "skills": "Stealth +4",
  "senses": "darkvision 30 ft, passive Perception 12",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 4,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft. The target must succeed on a DC 9 Constitution saving throw or take 2 (1d4) poison damage."
   }
  ],
  "traits": "Spider Climb: The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check. Web Sense: While in contact with a web, the spider knows the exact location of any other creature in contact with the same web. Web Walker: The spider ignores movement restrictions caused by webbing."
 },
 "Sprite": {
  "name": "Sprite",
  "size": "Tiny",
  "type": "fey",
  "cr": 0.25,
  "ac": 15,
  "hp": 2,
  "speed": "10 ft, fly 40 ft",
  "abilities": {
   "str": 3,
   "dex": 18,
   "con": 10,
   "int": 14,
   "wis": 13,
   "cha": 11
  },
  "skills": "Perception +3, Stealth +8",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Longsword",
    "toHit": 2,
    "dice": "1",
    "bonus": 0,
    "damageType": "slashing",
    "text": "Reach 5 ft."
   },
   {
    "name": "Shortbow",
    "toHit": 6,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Range 40/160 ft. The target must succeed on a DC 10 Constitution saving throw or become poisoned for 1 minute. If its saving throw result is 5 or lower, the poisoned target falls unconscious for the same duration, or until it takes damage or another creature takes an action to shake it awake."
   }
  ],
  "traits": ""
 },
 "Stirge": {
  "name": "Stirge",
  "size": "Tiny",
  "type": "beast",
  "cr": 0.125,
  "ac": 14,
  "hp": 2,
  "speed": "10 ft, fly 40 ft",
  "abilities": {
   "str": 4,
   "dex": 16,
   "con": 11,
   "int": 2,
   "wis": 8,
   "cha": 6
  },
  "skills": "",
  "senses": "darkvision 60 ft, passive Perception 9",
  "attacks": [
   {
    "name": "Blood Drain",
    "toHit": 5,
    "dice": "1d4",
    "bonus": 3,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": ""
 },
 "Vulture": {
  "name": "Vulture",
  "size": "Medium",
  "type": "beast",
  "cr": 0,
  "ac": 10,
  "hp": 5,
  "speed": "10 ft, fly 50 ft",
  "abilities": {
   "str": 7,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "skills": "Perception +3",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Beak",
    "toHit": 2,
    "dice": "1d4",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Sight and Smell: The vulture has advantage on Wisdom (Perception) checks that rely on sight or smell. Pack Tactics: The vulture has advantage on an attack roll against a creature if at least one of the vulture's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 },
 "Warhorse": {
  "name": "Warhorse",
  "size": "Large",
  "type": "beast",
  "cr": 0.5,
  "ac": 11,
  "hp": 19,
  "speed": "60 ft",
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "skills": "",
  "senses": "passive Perception 11",
  "attacks": [
   {
    "name": "Hooves",
    "toHit": 6,
    "dice": "2d6",
    "bonus": 4,
    "damageType": "bludgeoning",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Trampling Charge: If the horse moves at least 20 ft. straight toward a creature and then hits it with a hooves attack on the same turn, that target must succeed on a DC 14 Strength saving throw or be knocked prone. If the target is prone, the horse can make another attack with its hooves against it as a bonus action."
 },
 "Weasel": {
  "name": "Weasel",
  "size": "Tiny",
  "type": "beast",
  "cr": 0,
  "ac": 13,
  "hp": 1,
  "speed": "30 ft",
  "abilities": {
   "str": 3,
   "dex": 16,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 3
  },
  "skills": "Perception +3, Stealth +5",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 5,
    "dice": "1",
    "bonus": 0,
    "damageType": "piercing",
    "text": "Reach 5 ft."
   }
  ],
  "traits": "Keen Hearing and Smell: The weasel has advantage on Wisdom (Perception) checks that rely on hearing or smell."
 },
 "Wolf": {
  "name": "Wolf",
  "size": "Medium",
  "type": "beast",
  "cr": 0.25,
  "ac": 13,
  "hp": 11,
  "speed": "40 ft",
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 12,
   "int": 3,
   "wis": 12,
   "cha": 6
  },
  "skills": "Perception +3, Stealth +4",
  "senses": "passive Perception 13",
  "attacks": [
   {
    "name": "Bite",
    "toHit": 4,
    "dice": "2d4",
    "bonus": 2,
    "damageType": "piercing",
    "text": "Reach 5 ft. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone."
   }
  ],
  "traits": "Keen Hearing and Smell: The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell. Pack Tactics: The wolf has advantage on an attack roll against a creature if at least one of the wolf's allies is within 5 ft. of the creature and the ally isn't incapacitated."
 }
};
