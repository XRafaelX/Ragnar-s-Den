/* ---------------- Monster data (SRD 5.1 selection) ----------------
   MONSTER_GROUPS: type → [name, ...]
   MONSTER_DATA:   name → { type, cr, hp, ac, speed, size, alignment,
                             str, dex, con, int, wis, cha, notes }
   CR is stored as a string ("1/4", "1/2", "1", "2", … "30") for display. */

export var MONSTER_GROUPS = {
  "Beasts": [
    "Wolf","Brown Bear","Giant Spider","Giant Rat","Dire Wolf",
    "Giant Eagle","Black Bear","Panther","Lion","Tiger",
    "Giant Crocodile","Mammoth","Giant Ape"
  ],
  "Undead": [
    "Skeleton","Zombie","Ghoul","Shadow","Specter","Wight",
    "Vampire Spawn","Ghost","Mummy","Wraith","Banshee","Vampire","Lich"
  ],
  "Humanoids": [
    "Goblin","Hobgoblin","Orc","Bugbear","Gnoll","Kobold",
    "Lizardfolk","Bandit","Cultist","Guard","Veteran","Gladiator","Assassin"
  ],
  "Fiends": [
    "Imp","Quasit","Dretch","Lemure","Nightmare","Hell Hound",
    "Bearded Devil","Barbed Devil","Bone Devil","Horned Devil",
    "Ice Devil","Pit Fiend","Balor","Marilith"
  ],
  "Dragons": [
    "White Dragon Wyrmling","Black Dragon Wyrmling","Copper Dragon Wyrmling",
    "Green Dragon Wyrmling","Blue Dragon Wyrmling","Red Dragon Wyrmling",
    "Young White Dragon","Young Black Dragon","Young Green Dragon",
    "Adult White Dragon","Adult Red Dragon","Ancient Red Dragon","Tiamat"
  ],
  "Giants": [
    "Ogre","Hill Giant","Stone Giant","Frost Giant","Fire Giant",
    "Cloud Giant","Storm Giant"
  ],
  "Monstrosities": [
    "Harpy","Minotaur","Owlbear","Manticore","Basilisk","Medusa",
    "Chimera","Hydra","Roc","Tarrasque"
  ],
  "Constructs": [
    "Animated Armor","Flying Sword","Rug of Smothering",
    "Stone Golem","Iron Golem","Clay Golem","Flesh Golem"
  ],
  "Elementals": [
    "Magmin","Gargoyle","Air Elemental","Earth Elemental",
    "Fire Elemental","Water Elemental","Djinni","Efreeti"
  ],
  "Fey": [
    "Pixie","Dryad","Satyr","Green Hag","Night Hag","Lamia"
  ],
  "Aberrations": [
    "Gibbering Mouther","Intellect Devourer","Grick","Chuul",
    "Otyugh","Mind Flayer","Aboleth","Beholder"
  ],
  "Plants & Oozes": [
    "Shrieker","Violet Fungus","Twig Blight","Needle Blight","Vine Blight",
    "Gray Ooze","Gelatinous Cube","Black Pudding","Ochre Jelly"
  ]
};

/* Stat block shape:
   type, cr, size, alignment, hp, ac, speed (ft),
   str, dex, con, int, wis, cha,
   notes: brief string for search / preview (special traits summary) */
export var MONSTER_DATA = {
  /* ── Beasts ── */
  "Wolf":               {type:"Beast",     cr:"1/4",  size:"Medium",   alignment:"Unaligned",       hp:11,  ac:13, speed:40, str:12, dex:15, con:12, int:3,  wis:12, cha:6,  notes:"Pack Tactics, Knock Prone on bite"},
  "Brown Bear":         {type:"Beast",     cr:"1",    size:"Large",    alignment:"Unaligned",       hp:34,  ac:11, speed:40, str:19, dex:10, con:16, int:2,  wis:13, cha:7,  notes:"Multiattack (bite + claws)"},
  "Giant Spider":       {type:"Beast",     cr:"1",    size:"Large",    alignment:"Unaligned",       hp:26,  ac:14, speed:30, str:14, dex:16, con:12, int:2,  wis:11, cha:4,  notes:"Web Sense, Spider Climb, Web attack"},
  "Giant Rat":          {type:"Beast",     cr:"1/8",  size:"Small",    alignment:"Unaligned",       hp:7,   ac:12, speed:30, str:7,  dex:15, con:11, int:2,  wis:10, cha:4,  notes:"Pack Tactics, Keen Smell"},
  "Dire Wolf":          {type:"Beast",     cr:"1",    size:"Large",    alignment:"Unaligned",       hp:37,  ac:14, speed:50, str:17, dex:15, con:15, int:3,  wis:12, cha:7,  notes:"Pack Tactics, Knock Prone on bite"},
  "Giant Eagle":        {type:"Beast",     cr:"1",    size:"Large",    alignment:"Neutral Good",    hp:26,  ac:13, speed:10, str:16, dex:17, con:13, int:8,  wis:14, cha:10, notes:"Flyby, fly 80 ft."},
  "Black Bear":         {type:"Beast",     cr:"1/2",  size:"Medium",   alignment:"Unaligned",       hp:19,  ac:11, speed:40, str:15, dex:10, con:14, int:2,  wis:12, cha:7,  notes:"Multiattack (bite + claws), Keen Smell"},
  "Panther":            {type:"Beast",     cr:"1/4",  size:"Medium",   alignment:"Unaligned",       hp:13,  ac:12, speed:50, str:14, dex:15, con:10, int:3,  wis:14, cha:7,  notes:"Pounce, Stealthy (Stealth +6)"},
  "Lion":               {type:"Beast",     cr:"1",    size:"Large",    alignment:"Unaligned",       hp:26,  ac:12, speed:50, str:17, dex:15, con:13, int:3,  wis:12, cha:8,  notes:"Pounce, Pack Tactics, Keen Smell"},
  "Tiger":              {type:"Beast",     cr:"1",    size:"Large",    alignment:"Unaligned",       hp:37,  ac:12, speed:40, str:17, dex:15, con:14, int:3,  wis:12, cha:8,  notes:"Pounce, Keen Smell"},
  "Giant Crocodile":    {type:"Beast",     cr:"5",    size:"Huge",     alignment:"Unaligned",       hp:114, ac:14, speed:30, str:21, dex:9,  con:17, int:2,  wis:10, cha:7,  notes:"Hold Breath 30 min, Multiattack"},
  "Mammoth":            {type:"Beast",     cr:"6",    size:"Huge",     alignment:"Unaligned",       hp:126, ac:13, speed:40, str:24, dex:9,  con:21, int:3,  wis:11, cha:6,  notes:"Trampling Charge, Trunk Slam"},
  "Giant Ape":          {type:"Beast",     cr:"7",    size:"Huge",     alignment:"Unaligned",       hp:157, ac:12, speed:40, str:23, dex:14, con:18, int:7,  wis:12, cha:7,  notes:"Multiattack, Rock throw 50 ft."},

  /* ── Undead ── */
  "Skeleton":           {type:"Undead",    cr:"1/4",  size:"Medium",   alignment:"Lawful Evil",     hp:13,  ac:13, speed:30, str:10, dex:14, con:15, int:6,  wis:8,  cha:5,  notes:"Vulnerable to Bludgeoning, Immune to Poison/Exhaustion"},
  "Zombie":             {type:"Undead",    cr:"1/4",  size:"Medium",   alignment:"Neutral Evil",    hp:22,  ac:8,  speed:20, str:13, dex:6,  con:16, int:3,  wis:6,  cha:5,  notes:"Undead Fortitude (Con save on 0 hp)"},
  "Ghoul":              {type:"Undead",    cr:"1",    size:"Medium",   alignment:"Chaotic Evil",    hp:22,  ac:12, speed:30, str:13, dex:15, con:10, int:7,  wis:10, cha:8,  notes:"Paralyzing Touch, Undead nature"},
  "Shadow":             {type:"Undead",    cr:"1/2",  size:"Medium",   alignment:"Chaotic Evil",    hp:16,  ac:12, speed:40, str:6,  dex:14, con:13, int:6,  wis:10, cha:8,  notes:"Strength Drain, Sunlight Weakness, Amorphous"},
  "Specter":            {type:"Undead",    cr:"1",    size:"Medium",   alignment:"Chaotic Evil",    hp:22,  ac:12, speed:0,  str:1,  dex:14, con:11, int:10, wis:10, cha:11, notes:"Life Drain, Incorporeal, fly 50 ft."},
  "Wight":              {type:"Undead",    cr:"3",    size:"Medium",   alignment:"Neutral Evil",    hp:45,  ac:14, speed:30, str:15, dex:14, con:16, int:10, wis:13, cha:15, notes:"Life Drain, Sunlight Sensitivity, raises zombies"},
  "Vampire Spawn":      {type:"Undead",    cr:"5",    size:"Medium",   alignment:"Neutral Evil",    hp:82,  ac:15, speed:30, str:16, dex:18, con:18, int:11, wis:10, cha:12, notes:"Spider Climb, Regeneration, Charm"},
  "Ghost":              {type:"Undead",    cr:"4",    size:"Medium",   alignment:"Any",             hp:45,  ac:11, speed:0,  str:7,  dex:13, con:10, int:10, wis:12, cha:17, notes:"Horrifying Visage, Possession, fly 40 ft."},
  "Mummy":              {type:"Undead",    cr:"3",    size:"Medium",   alignment:"Lawful Evil",     hp:58,  ac:11, speed:20, str:16, dex:8,  con:15, int:6,  wis:10, cha:12, notes:"Mummy Rot curse, Dreadful Glare"},
  "Wraith":             {type:"Undead",    cr:"5",    size:"Medium",   alignment:"Neutral Evil",    hp:67,  ac:13, speed:0,  str:6,  dex:16, con:16, int:12, wis:14, cha:15, notes:"Life Drain, create Specter, fly 60 ft."},
  "Banshee":            {type:"Undead",    cr:"4",    size:"Medium",   alignment:"Chaotic Evil",    hp:58,  ac:12, speed:0,  str:1,  dex:14, con:10, int:12, wis:11, cha:17, notes:"Horrifying Visage, Wail (instant 0 hp on fail), fly 40 ft."},
  "Vampire":            {type:"Undead",    cr:"13",   size:"Medium",   alignment:"Lawful Evil",     hp:144, ac:16, speed:30, str:18, dex:18, con:18, int:17, wis:15, cha:18, notes:"Legendary Actions, Charm, Spider Climb, Regeneration"},
  "Lich":               {type:"Undead",    cr:"21",   size:"Medium",   alignment:"Any Evil",        hp:135, ac:17, speed:30, str:11, dex:16, con:16, int:20, wis:14, cha:16, notes:"Legendary Actions, Phylactery, Paralyzing Touch, 9th level spells"},

  /* ── Humanoids ── */
  "Goblin":             {type:"Humanoid",  cr:"1/4",  size:"Small",    alignment:"Neutral Evil",    hp:7,   ac:15, speed:30, str:8,  dex:14, con:10, int:10, wis:8,  cha:8,  notes:"Nimble Escape (Disengage/Hide as bonus)"},
  "Hobgoblin":          {type:"Humanoid",  cr:"1/2",  size:"Medium",   alignment:"Lawful Evil",     hp:11,  ac:18, speed:30, str:13, dex:12, con:12, int:10, wis:10, cha:9,  notes:"Martial Advantage (+2d6 damage with ally adjacent)"},
  "Orc":                {type:"Humanoid",  cr:"1/2",  size:"Medium",   alignment:"Chaotic Evil",    hp:15,  ac:13, speed:30, str:16, dex:12, con:16, int:7,  wis:11, cha:10, notes:"Aggressive (bonus action move toward enemy)"},
  "Bugbear":            {type:"Humanoid",  cr:"1",    size:"Medium",   alignment:"Chaotic Evil",    hp:27,  ac:16, speed:30, str:15, dex:14, con:13, int:8,  wis:11, cha:9,  notes:"Surprise Attack (+2d6), Brute (weapon dice × 2)"},
  "Gnoll":              {type:"Humanoid",  cr:"1/2",  size:"Medium",   alignment:"Chaotic Evil",    hp:22,  ac:15, speed:30, str:14, dex:12, con:11, int:6,  wis:10, cha:7,  notes:"Rampage (bonus bite after reducing creature to 0 hp)"},
  "Kobold":             {type:"Humanoid",  cr:"1/8",  size:"Small",    alignment:"Lawful Evil",     hp:5,   ac:12, speed:30, str:7,  dex:15, con:9,  int:8,  wis:7,  cha:8,  notes:"Pack Tactics, Sunlight Sensitivity"},
  "Lizardfolk":         {type:"Humanoid",  cr:"1/2",  size:"Medium",   alignment:"Neutral",         hp:22,  ac:15, speed:30, str:15, dex:10, con:13, int:7,  wis:12, cha:7,  notes:"Hold Breath 15 min, Multiattack"},
  "Bandit":             {type:"Humanoid",  cr:"1/8",  size:"Medium",   alignment:"Any Non-Lawful",  hp:11,  ac:12, speed:30, str:11, dex:12, con:12, int:10, wis:10, cha:10, notes:"Scimitar + light crossbow"},
  "Cultist":            {type:"Humanoid",  cr:"1/8",  size:"Medium",   alignment:"Any Evil",        hp:9,   ac:12, speed:30, str:11, dex:12, con:10, int:10, wis:11, cha:10, notes:"Dark Devotion (adv. on saves vs. frightened/charmed)"},
  "Guard":              {type:"Humanoid",  cr:"1/8",  size:"Medium",   alignment:"Any",             hp:11,  ac:16, speed:30, str:13, dex:12, con:12, int:10, wis:11, cha:10, notes:"Spear, shield + chain shirt"},
  "Veteran":            {type:"Humanoid",  cr:"3",    size:"Medium",   alignment:"Any",             hp:58,  ac:17, speed:30, str:16, dex:13, con:14, int:10, wis:11, cha:10, notes:"Multiattack ×2, parry reaction"},
  "Gladiator":          {type:"Humanoid",  cr:"5",    size:"Medium",   alignment:"Any",             hp:112, ac:16, speed:30, str:18, dex:15, con:16, int:10, wis:12, cha:15, notes:"Multiattack ×3, Shield Bash, Parry"},
  "Assassin":           {type:"Humanoid",  cr:"8",    size:"Medium",   alignment:"Any Non-Good",    hp:78,  ac:15, speed:30, str:11, dex:16, con:14, int:13, wis:11, cha:10, notes:"Sneak Attack 4d6, Assassinate, Evasion, Poison"},

  /* ── Fiends ── */
  "Imp":                {type:"Fiend",     cr:"1",    size:"Tiny",     alignment:"Lawful Evil",     hp:10,  ac:13, speed:20, str:6,  dex:17, con:13, int:11, wis:12, cha:14, notes:"Shapechanger, Devil's Sight, Poison sting, fly 40 ft."},
  "Quasit":             {type:"Fiend",     cr:"1",    size:"Tiny",     alignment:"Chaotic Evil",    hp:7,   ac:13, speed:40, str:5,  dex:17, con:10, int:7,  wis:10, cha:10, notes:"Shapechanger, Poison claw, Scare, Invisibility"},
  "Dretch":             {type:"Fiend",     cr:"1/4",  size:"Small",    alignment:"Chaotic Evil",    hp:18,  ac:11, speed:20, str:11, dex:11, con:12, int:5,  wis:8,  cha:3,  notes:"Fetid Cloud (poisonous fog)"},
  "Lemure":             {type:"Fiend",     cr:"0",    size:"Medium",   alignment:"Lawful Evil",     hp:13,  ac:7,  speed:15, str:10, dex:5,  con:11, int:1,  wis:11, cha:3,  notes:"Devil's Sight, Infernal Wound"},
  "Nightmare":          {type:"Fiend",     cr:"3",    size:"Large",    alignment:"Neutral Evil",    hp:68,  ac:13, speed:60, str:18, dex:15, con:16, int:10, wis:13, cha:15, notes:"Confer Fire Resistance, Illumination, fly 90 ft."},
  "Hell Hound":         {type:"Fiend",     cr:"3",    size:"Medium",   alignment:"Lawful Evil",     hp:45,  ac:15, speed:50, str:17, dex:12, con:14, int:6,  wis:13, cha:6,  notes:"Pack Tactics, Fire Breath (5d6)"},
  "Bearded Devil":      {type:"Fiend",     cr:"3",    size:"Medium",   alignment:"Lawful Evil",     hp:52,  ac:13, speed:30, str:16, dex:15, con:15, int:9,  wis:11, cha:11, notes:"Steadfast (immune fear near allies), Beard (poison)"},
  "Barbed Devil":       {type:"Fiend",     cr:"5",    size:"Medium",   alignment:"Lawful Evil",     hp:110, ac:15, speed:30, str:16, dex:17, con:18, int:12, wis:14, cha:14, notes:"Barbed Hide (impale on grapple), Multiattack ×3"},
  "Bone Devil":         {type:"Fiend",     cr:"9",    size:"Large",    alignment:"Lawful Evil",     hp:142, ac:19, speed:40, str:18, dex:16, con:18, int:13, wis:14, cha:16, notes:"Magic Resistance, Sting (3d8 + poison), fly 40 ft."},
  "Horned Devil":       {type:"Fiend",     cr:"11",   size:"Large",    alignment:"Lawful Evil",     hp:178, ac:18, speed:20, str:22, dex:17, con:21, int:12, wis:16, cha:17, notes:"Multiattack ×3, Infernal Wound, fly 60 ft."},
  "Ice Devil":          {type:"Fiend",     cr:"14",   size:"Large",    alignment:"Lawful Evil",     hp:180, ac:18, speed:40, str:21, dex:14, con:18, int:18, wis:15, cha:18, notes:"Magic Resistance, Wall of Ice, Multiattack ×3"},
  "Pit Fiend":          {type:"Fiend",     cr:"20",   size:"Large",    alignment:"Lawful Evil",     hp:300, ac:19, speed:30, str:26, dex:14, con:24, int:22, wis:18, cha:24, notes:"Legendary Actions, Fear Aura, Multiattack ×4, fly 60 ft."},
  "Balor":              {type:"Fiend",     cr:"19",   size:"Huge",     alignment:"Chaotic Evil",    hp:262, ac:19, speed:40, str:26, dex:15, con:22, int:20, wis:16, cha:22, notes:"Death Throes explosion, Fire Aura, Multiattack ×2, fly 80 ft."},
  "Marilith":           {type:"Fiend",     cr:"16",   size:"Large",    alignment:"Chaotic Evil",    hp:189, ac:18, speed:40, str:18, dex:20, con:20, int:18, wis:16, cha:20, notes:"Reactive (extra reaction/round), Multiattack ×7"},

  /* ── Dragons ── */
  "White Dragon Wyrmling":  {type:"Dragon", cr:"2",  size:"Medium",  alignment:"Chaotic Evil",    hp:32,  ac:16, speed:30, str:14, dex:10, con:14, int:5,  wis:10, cha:11, notes:"Cold Breath (3d8), fly 60 ft."},
  "Black Dragon Wyrmling":  {type:"Dragon", cr:"2",  size:"Medium",  alignment:"Chaotic Evil",    hp:33,  ac:17, speed:30, str:15, dex:14, con:13, int:10, wis:11, cha:13, notes:"Acid Breath (3d8), fly 60 ft., swim 30 ft."},
  "Copper Dragon Wyrmling": {type:"Dragon", cr:"1",  size:"Medium",  alignment:"Chaotic Good",    hp:27,  ac:16, speed:30, str:15, dex:12, con:13, int:14, wis:11, cha:13, notes:"Acid/Slowing Gas Breath, fly 60 ft."},
  "Green Dragon Wyrmling":  {type:"Dragon", cr:"2",  size:"Medium",  alignment:"Lawful Evil",     hp:38,  ac:17, speed:30, str:15, dex:12, con:13, int:14, wis:11, cha:13, notes:"Poison Breath (6d6), fly 60 ft., swim 30 ft."},
  "Blue Dragon Wyrmling":   {type:"Dragon", cr:"3",  size:"Medium",  alignment:"Lawful Evil",     hp:52,  ac:17, speed:30, str:17, dex:10, con:15, int:12, wis:11, cha:15, notes:"Lightning Breath (4d10), fly 60 ft., burrow 15 ft."},
  "Red Dragon Wyrmling":    {type:"Dragon", cr:"4",  size:"Medium",  alignment:"Chaotic Evil",    hp:75,  ac:17, speed:30, str:19, dex:10, con:17, int:12, wis:11, cha:15, notes:"Fire Breath (7d6), fly 60 ft., climb 30 ft."},
  "Young White Dragon":     {type:"Dragon", cr:"6",  size:"Large",   alignment:"Chaotic Evil",    hp:133, ac:17, speed:40, str:18, dex:10, con:18, int:6,  wis:11, cha:12, notes:"Cold Breath (8d8), fly 80 ft., Multiattack ×3"},
  "Young Black Dragon":     {type:"Dragon", cr:"7",  size:"Large",   alignment:"Chaotic Evil",    hp:127, ac:18, speed:40, str:19, dex:14, con:17, int:12, wis:11, cha:15, notes:"Acid Breath (11d8), fly 80 ft., Multiattack ×3"},
  "Young Green Dragon":     {type:"Dragon", cr:"8",  size:"Large",   alignment:"Lawful Evil",     hp:136, ac:18, speed:40, str:19, dex:12, con:17, int:16, wis:13, cha:15, notes:"Poison Breath (12d6), fly 80 ft., Multiattack ×3"},
  "Adult White Dragon":     {type:"Dragon", cr:"13", size:"Huge",    alignment:"Chaotic Evil",    hp:200, ac:18, speed:40, str:22, dex:10, con:22, int:8,  wis:12, cha:12, notes:"Legendary Actions, Cold Breath (12d8), fly 80 ft."},
  "Adult Red Dragon":       {type:"Dragon", cr:"17", size:"Huge",    alignment:"Chaotic Evil",    hp:256, ac:19, speed:40, str:27, dex:10, con:25, int:16, wis:13, cha:21, notes:"Legendary Actions, Fire Breath (16d6), fly 80 ft."},
  "Ancient Red Dragon":     {type:"Dragon", cr:"24", size:"Gargantuan", alignment:"Chaotic Evil", hp:546, ac:22, speed:40, str:30, dex:10, con:29, int:18, wis:15, cha:23, notes:"Legendary Actions ×3, Fire Breath (20d6), Frightful Presence, fly 80 ft."},
  "Tiamat":                 {type:"Dragon", cr:"30", size:"Gargantuan", alignment:"Chaotic Evil", hp:615, ac:25, speed:60, str:30, dex:10, con:30, int:26, wis:26, cha:26, notes:"Legendary Actions ×5, all five breath weapons, Divine Corruption, fly 120 ft."},

  /* ── Giants ── */
  "Ogre":               {type:"Giant",     cr:"2",    size:"Large",    alignment:"Chaotic Evil",    hp:59,  ac:11, speed:40, str:19, dex:8,  con:16, int:5,  wis:7,  cha:7,  notes:"Greatclub + javelin"},
  "Hill Giant":         {type:"Giant",     cr:"5",    size:"Huge",     alignment:"Chaotic Evil",    hp:105, ac:13, speed:40, str:21, dex:8,  con:19, int:5,  wis:9,  cha:6,  notes:"Multiattack ×2, Rock throw, Greatclub"},
  "Stone Giant":        {type:"Giant",     cr:"7",    size:"Huge",     alignment:"Neutral",         hp:126, ac:17, speed:40, str:23, dex:15, con:20, int:10, wis:12, cha:9,  notes:"Rock throw/catch, Stone Camouflage"},
  "Frost Giant":        {type:"Giant",     cr:"8",    size:"Huge",     alignment:"Neutral Evil",    hp:138, ac:15, speed:40, str:23, dex:9,  con:21, int:9,  wis:10, cha:12, notes:"Rock throw, immune to cold"},
  "Fire Giant":         {type:"Giant",     cr:"9",    size:"Huge",     alignment:"Lawful Evil",     hp:162, ac:18, speed:30, str:25, dex:9,  con:23, int:10, wis:14, cha:13, notes:"Multiattack ×2, Rock throw, immune to fire"},
  "Cloud Giant":        {type:"Giant",     cr:"9",    size:"Huge",     alignment:"Neutral Good/Evil",hp:200,ac:14, speed:40, str:27, dex:10, con:22, int:12, wis:16, cha:16, notes:"Keen Smell, Innate Spells, Fog Cloud, fly 0 (levitate at will)"},
  "Storm Giant":        {type:"Giant",     cr:"13",   size:"Huge",     alignment:"Chaotic Good",    hp:230, ac:16, speed:50, str:29, dex:14, con:20, int:16, wis:18, cha:18, notes:"Amphibious, Innate Spells, Lightning Strike, swim 50 ft."},

  /* ── Monstrosities ── */
  "Harpy":              {type:"Monstrosity",cr:"1",   size:"Medium",   alignment:"Chaotic Evil",    hp:38,  ac:11, speed:20, str:12, dex:13, con:12, int:7,  wis:10, cha:13, notes:"Luring Song (Wisdom save or charmed), fly 40 ft."},
  "Minotaur":           {type:"Monstrosity",cr:"3",   size:"Large",    alignment:"Chaotic Evil",    hp:114, ac:14, speed:40, str:18, dex:11, con:16, int:6,  wis:16, cha:9,  notes:"Charge (Gore + shove), Labyrinthine Recall"},
  "Owlbear":            {type:"Monstrosity",cr:"3",   size:"Large",    alignment:"Unaligned",       hp:59,  ac:13, speed:40, str:20, dex:12, con:17, int:3,  wis:12, cha:7,  notes:"Keen Sight and Smell, Multiattack (beak + claws)"},
  "Manticore":          {type:"Monstrosity",cr:"3",   size:"Large",    alignment:"Lawful Evil",     hp:68,  ac:14, speed:30, str:17, dex:16, con:17, int:7,  wis:12, cha:8,  notes:"Tail Spikes (ranged 3×/round), fly 50 ft."},
  "Basilisk":           {type:"Monstrosity",cr:"3",   size:"Medium",   alignment:"Unaligned",       hp:52,  ac:15, speed:20, str:16, dex:8,  con:15, int:2,  wis:8,  cha:7,  notes:"Petrifying Gaze (Con save or petrified)"},
  "Medusa":             {type:"Monstrosity",cr:"6",   size:"Medium",   alignment:"Lawful Evil",     hp:127, ac:15, speed:30, str:10, dex:15, con:16, int:12, wis:13, cha:15, notes:"Petrifying Gaze, Multiattack ×3 (bow + snakes)"},
  "Chimera":            {type:"Monstrosity",cr:"6",   size:"Large",    alignment:"Chaotic Evil",    hp:114, ac:14, speed:30, str:19, dex:11, con:19, int:3,  wis:14, cha:10, notes:"Multiattack ×3, Fire Breath (7d8), fly 60 ft."},
  "Hydra":              {type:"Monstrosity",cr:"8",   size:"Huge",     alignment:"Unaligned",       hp:172, ac:15, speed:30, str:20, dex:12, con:20, int:2,  wis:10, cha:7,  notes:"Multiattack (one bite per head), Reactive Heads, swim 30 ft."},
  "Roc":                {type:"Monstrosity",cr:"11",  size:"Gargantuan",alignment:"Unaligned",      hp:248, ac:15, speed:20, str:28, dex:10, con:20, int:3,  wis:10, cha:9,  notes:"Keen Sight, Multiattack (beak + talons), fly 120 ft."},
  "Tarrasque":          {type:"Monstrosity",cr:"30",  size:"Gargantuan",alignment:"Unaligned",      hp:676, ac:25, speed:40, str:30, dex:11, con:30, int:3,  wis:11, cha:11, notes:"Legendary Actions ×3, Magic Immunity, Reflective Carapace, Regeneration"},

  /* ── Constructs ── */
  "Animated Armor":     {type:"Construct", cr:"1",    size:"Medium",   alignment:"Unaligned",       hp:33,  ac:18, speed:25, str:14, dex:11, con:13, int:1,  wis:3,  cha:1,  notes:"Antimagic Susceptibility, False Appearance"},
  "Flying Sword":       {type:"Construct", cr:"1/4",  size:"Small",    alignment:"Unaligned",       hp:17,  ac:17, speed:0,  str:12, dex:15, con:11, int:1,  wis:5,  cha:1,  notes:"Antimagic Susceptibility, False Appearance, fly 50 ft."},
  "Rug of Smothering":  {type:"Construct", cr:"2",    size:"Large",    alignment:"Unaligned",       hp:33,  ac:12, speed:10, str:17, dex:14, con:10, int:1,  wis:3,  cha:1,  notes:"Antimagic Susceptibility, Suffocation on grapple"},
  "Stone Golem":        {type:"Construct", cr:"10",   size:"Large",    alignment:"Unaligned",       hp:178, ac:17, speed:30, str:22, dex:9,  con:20, int:3,  wis:11, cha:1,  notes:"Immutable Form, Magic Resistance, Slow (action)"},
  "Iron Golem":         {type:"Construct", cr:"16",   size:"Large",    alignment:"Unaligned",       hp:210, ac:20, speed:30, str:24, dex:9,  con:20, int:3,  wis:11, cha:1,  notes:"Fire Absorption, Poison Breath, Magic Resistance, Multiattack ×2"},
  "Clay Golem":         {type:"Construct", cr:"9",    size:"Large",    alignment:"Unaligned",       hp:133, ac:14, speed:20, str:20, dex:9,  con:18, int:3,  wis:8,  cha:1,  notes:"Acid Absorption, Berserk, Curse (Mummy Rot), Multiattack ×2"},
  "Flesh Golem":        {type:"Construct", cr:"5",    size:"Medium",   alignment:"Neutral",         hp:93,  ac:9,  speed:30, str:19, dex:9,  con:18, int:6,  wis:10, cha:5,  notes:"Berserk, Lightning Absorption, Aversion of Fire/Cold"},

  /* ── Elementals ── */
  "Magmin":             {type:"Elemental", cr:"1/2",  size:"Small",    alignment:"Chaotic Neutral", hp:9,   ac:14, speed:30, str:7,  dex:15, con:12, int:8,  wis:11, cha:10, notes:"Death Burst (fire), Ignited Illumination, Fire Form"},
  "Gargoyle":           {type:"Elemental", cr:"2",    size:"Medium",   alignment:"Chaotic Evil",    hp:52,  ac:15, speed:30, str:15, dex:11, con:16, int:6,  wis:11, cha:7,  notes:"False Appearance (stone), fly 60 ft., Multiattack ×2"},
  "Air Elemental":      {type:"Elemental", cr:"5",    size:"Large",    alignment:"Neutral",         hp:90,  ac:15, speed:0,  str:14, dex:20, con:14, int:6,  wis:10, cha:6,  notes:"Air Form (through tiny openings), Whirlwind, fly 90 ft."},
  "Earth Elemental":    {type:"Elemental", cr:"5",    size:"Large",    alignment:"Neutral",         hp:126, ac:17, speed:30, str:20, dex:8,  con:20, int:5,  wis:10, cha:5,  notes:"Earth Glide (burrow), Siege Monster, Multiattack ×2"},
  "Fire Elemental":     {type:"Elemental", cr:"5",    size:"Large",    alignment:"Neutral",         hp:102, ac:13, speed:50, str:10, dex:17, con:16, int:6,  wis:10, cha:7,  notes:"Fire Form, Ignite (Con save), Illumination"},
  "Water Elemental":    {type:"Elemental", cr:"5",    size:"Large",    alignment:"Neutral",         hp:114, ac:14, speed:30, str:18, dex:14, con:18, int:5,  wis:10, cha:8,  notes:"Water Form, Freeze (on hit), swim 90 ft."},
  "Djinni":             {type:"Elemental", cr:"11",   size:"Large",    alignment:"Chaotic Good",    hp:161, ac:17, speed:30, str:21, dex:15, con:22, int:15, wis:16, cha:20, notes:"Innate Spells, Create Whirlwind, fly 90 ft."},
  "Efreeti":            {type:"Elemental", cr:"11",   size:"Large",    alignment:"Lawful Evil",     hp:200, ac:17, speed:40, str:22, dex:12, con:24, int:16, wis:15, cha:16, notes:"Innate Spells, Hurl Flame, fly 60 ft."},

  /* ── Fey ── */
  "Pixie":              {type:"Fey",       cr:"1/4",  size:"Tiny",     alignment:"Neutral Good",    hp:1,   ac:15, speed:10, str:2,  dex:20, con:8,  int:10, wis:14, cha:15, notes:"Magic Resistance, Innate Spells (polymorph, sleep…), fly 30 ft."},
  "Dryad":              {type:"Fey",       cr:"1",    size:"Medium",   alignment:"Neutral",         hp:22,  ac:11, speed:30, str:10, dex:12, con:11, int:14, wis:15, cha:18, notes:"Innate Spells, Tree Stride, Speak with Plants"},
  "Satyr":              {type:"Fey",       cr:"1/2",  size:"Medium",   alignment:"Chaotic Neutral", hp:31,  ac:14, speed:40, str:12, dex:16, con:11, int:12, wis:10, cha:14, notes:"Magic Resistance, Ram attack, pipes lure"},
  "Green Hag":          {type:"Fey",       cr:"3",    size:"Medium",   alignment:"Neutral Evil",    hp:82,  ac:17, speed:30, str:18, dex:12, con:16, int:13, wis:14, cha:14, notes:"Amphibious, Mimicry, Illusory Appearance, Invisible Passage"},
  "Night Hag":          {type:"Fey",       cr:"5",    size:"Medium",   alignment:"Neutral Evil",    hp:112, ac:17, speed:30, str:18, dex:15, con:16, int:16, wis:14, cha:16, notes:"Etherealness, Magic Resistance, Heartstone, Dream Haunting"},
  "Lamia":              {type:"Fey",       cr:"4",    size:"Large",    alignment:"Chaotic Evil",    hp:97,  ac:13, speed:30, str:16, dex:13, con:15, int:14, wis:15, cha:16, notes:"Innate Spells, Intoxicating Touch (Wisdom curse)"},

  /* ── Aberrations ── */
  "Gibbering Mouther":  {type:"Aberration",cr:"2",    size:"Medium",   alignment:"Neutral",         hp:67,  ac:9,  speed:10, str:10, dex:8,  con:16, int:3,  wis:10, cha:6,  notes:"Aberrant Ground, Blinding Spittle, Gibbering (Wis save vs. actions)"},
  "Intellect Devourer": {type:"Aberration",cr:"2",    size:"Tiny",     alignment:"Lawful Evil",     hp:21,  ac:12, speed:40, str:6,  dex:14, con:13, int:12, wis:11, cha:10, notes:"Detect Sentience, Devour Intellect, Body Thief"},
  "Grick":              {type:"Aberration",cr:"2",    size:"Medium",   alignment:"Neutral",         hp:27,  ac:14, speed:30, str:14, dex:14, con:11, int:3,  wis:14, cha:5,  notes:"Stone Camouflage, Multiattack (tentacles + beak)"},
  "Chuul":              {type:"Aberration",cr:"4",    size:"Large",    alignment:"Chaotic Evil",    hp:93,  ac:16, speed:30, str:19, dex:10, con:16, int:5,  wis:11, cha:5,  notes:"Amphibious, Sense Magic, Multiattack, Paralytic Tentacles, swim 30 ft."},
  "Otyugh":             {type:"Aberration",cr:"5",    size:"Large",    alignment:"Neutral",         hp:114, ac:14, speed:30, str:16, dex:11, con:19, int:6,  wis:13, cha:4,  notes:"Limited Telepathy, Multiattack, Disease (tentacle hit)"},
  "Mind Flayer":        {type:"Aberration",cr:"7",    size:"Medium",   alignment:"Lawful Evil",     hp:71,  ac:15, speed:30, str:11, dex:12, con:12, int:19, wis:17, cha:17, notes:"Innate Spells, Mind Blast (stun), Extract Brain, Telepathy 120 ft."},
  "Aboleth":            {type:"Aberration",cr:"10",   size:"Large",    alignment:"Lawful Evil",     hp:135, ac:17, speed:10, str:21, dex:9,  con:15, int:18, wis:15, cha:18, notes:"Amphibious, Mucous Cloud, Enslave (3/day), Probing Telepathy, swim 40 ft."},
  "Beholder":           {type:"Aberration",cr:"13",   size:"Large",    alignment:"Lawful Evil",     hp:180, ac:18, speed:0,  str:10, dex:14, con:18, int:17, wis:15, cha:17, notes:"Antimagic Eye Cone, 10 Eye Rays (various effects), fly 20 ft."},

  /* ── Plants & Oozes ── */
  "Shrieker":           {type:"Plant",     cr:"0",    size:"Medium",   alignment:"Unaligned",       hp:13,  ac:5,  speed:0,  str:1,  dex:1,  con:10, int:1,  wis:3,  cha:1,  notes:"False Appearance, Shriek (alerts nearby creatures)"},
  "Violet Fungus":      {type:"Plant",     cr:"1/4",  size:"Medium",   alignment:"Unaligned",       hp:18,  ac:5,  speed:5,  str:3,  dex:1,  con:10, int:1,  wis:3,  cha:1,  notes:"False Appearance, Rotting Touch (necrotic)"},
  "Twig Blight":        {type:"Plant",     cr:"1/8",  size:"Small",    alignment:"Neutral Evil",    hp:4,   ac:13, speed:20, str:6,  dex:13, con:12, int:4,  wis:8,  cha:3,  notes:"False Appearance (dead shrub), Vulnerability to Fire"},
  "Needle Blight":      {type:"Plant",     cr:"1/4",  size:"Medium",   alignment:"Neutral Evil",    hp:11,  ac:12, speed:30, str:12, dex:12, con:13, int:4,  wis:8,  cha:3,  notes:"Needles (ranged 30/60 ft.)"},
  "Vine Blight":        {type:"Plant",     cr:"1/2",  size:"Medium",   alignment:"Neutral Evil",    hp:26,  ac:12, speed:10, str:15, dex:8,  con:14, int:5,  wis:10, cha:3,  notes:"False Appearance, Constrict (restrained on grapple)"},
  "Gray Ooze":          {type:"Ooze",      cr:"1/2",  size:"Medium",   alignment:"Unaligned",       hp:22,  ac:8,  speed:10, str:12, dex:6,  con:16, int:1,  wis:6,  cha:2,  notes:"Amorphous, Spider Climb, Corrode Metal, False Appearance"},
  "Gelatinous Cube":    {type:"Ooze",      cr:"2",    size:"Large",    alignment:"Unaligned",       hp:84,  ac:6,  speed:15, str:14, dex:3,  con:20, int:1,  wis:6,  cha:1,  notes:"Engulf (restrained + acid damage), Transparent, Ooze Cube"},
  "Black Pudding":      {type:"Ooze",      cr:"4",    size:"Large",    alignment:"Unaligned",       hp:85,  ac:7,  speed:20, str:16, dex:5,  con:16, int:1,  wis:6,  cha:1,  notes:"Amorphous, Spider Climb, Corrode Metal/Wood, splits on slashing"},
  "Ochre Jelly":        {type:"Ooze",      cr:"2",    size:"Large",    alignment:"Unaligned",       hp:45,  ac:8,  speed:10, str:15, dex:6,  con:14, int:2,  wis:6,  cha:1,  notes:"Amorphous, Spider Climb, splits on slashing/lightning"}
};
