/* ---------------- Race data ---------------- */
export var RACES = {
  "Standard (SRD)": [
    "Human","Hill Dwarf","Mountain Dwarf","High Elf","Wood Elf","Dark Elf (Drow)",
    "Lightfoot Halfling","Stout Halfling","Dragonborn","Rock Gnome","Forest Gnome",
    "Half-Elf","Half-Orc","Tiefling"
  ],
  "Expanded": [
    "Aarakocra","Aasimar","Bugbear","Centaur","Changeling","Deep Gnome (Svirfneblin)",
    "Duergar","Eladrin","Fairy","Firbolg","Genasi (Air)","Genasi (Earth)","Genasi (Fire)",
    "Genasi (Water)","Gith (Githyanki)","Gith (Githzerai)","Goblin","Goliath","Harengon",
    "Hobgoblin","Kenku","Kobold","Lizardfolk","Loxodon","Minotaur","Orc","Satyr",
    "Sea Elf","Shadar-kai","Shifter","Simic Hybrid","Tabaxi","Thri-kreen","Tortle",
    "Triton","Vedalken","Verdan","Warforged","Yuan-ti Pureblood"
  ]
};

export var RACE_TRAITS = {
  "Human": "+1 to every ability score. No other special traits — flexible and simple to play.",
  "Hill Dwarf": "+2 CON, +1 WIS. Darkvision 60ft, resistance to poison damage, advantage on saves vs. poison, +1 HP per level.",
  "Mountain Dwarf": "+2 CON, +2 STR. Darkvision 60ft, poison resistance, proficiency with light and medium armor.",
  "High Elf": "+2 DEX, +1 INT. Darkvision 60ft, advantage vs. being charmed, can't be magically put to sleep, know one wizard cantrip.",
  "Wood Elf": "+2 DEX, +1 WIS. Darkvision, fey ancestry, +5ft speed, can try to hide even when only lightly obscured.",
  "Dark Elf (Drow)": "+2 DEX, +1 CHA. Superior darkvision 120ft, sunlight sensitivity (disadvantage in bright sunlight), a few innate spells at higher levels.",
  "Lightfoot Halfling": "+2 DEX, +1 CHA. Lucky (reroll 1s on d20), brave (advantage vs. frightened), can hide behind bigger creatures.",
  "Stout Halfling": "+2 DEX, +1 CON. Lucky, brave, resistance to poison damage and advantage vs. poison.",
  "Dragonborn": "+2 STR, +1 CHA. Breath weapon (elemental damage in a line or cone) and resistance to your draconic ancestry's damage type.",
  "Rock Gnome": "+2 INT, +1 CON. Darkvision, advantage on INT/WIS/CHA saves vs. magic, can tinker with tiny clockwork devices.",
  "Forest Gnome": "+2 INT, +1 DEX. Darkvision, advantage vs. magic saves, know the minor illusion cantrip, can speak with small animals.",
  "Half-Elf": "+2 CHA, +1 to two other abilities of your choice. Darkvision, advantage vs. charm, two extra skill proficiencies.",
  "Half-Orc": "+2 STR, +1 CON. Darkvision, menacing (Intimidation proficiency), relentless endurance (drop to 1 HP instead of 0, once per long rest).",
  "Tiefling": "+2 CHA, +1 INT. Darkvision, resistance to fire damage, know the thaumaturgy cantrip and more spells at higher levels."
};
export var RACE_TRAIT_FALLBACK = "This is an expanded (non-SRD) race — check your table's sourcebook for its exact ability score bonuses and traits. Everything else here still works fine once you've picked it.";
