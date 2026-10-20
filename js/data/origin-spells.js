/* ---------------- Spells an origin adds to class lists ----------------
   A dragonmark's Spells of the Mark (Eberron) and a Ravnica guild
   background's Guild Spells: for a character with the Spellcasting or
   Pact Magic feature, these join the spell list of every spellcasting
   class they have (see originListSpells in js/core/spell-grants.js).
   By spell level, 0 = cantrips. Checked against dnd5e.wikidot.com's race
   and background pages 2026-10-20. */
var FINDING = {1:["Faerie Fire","Longstrider"], 2:["Locate Animals or Plants","Locate Object"], 3:["Clairvoyance","Speak with Plants"], 4:["Divination","Locate Creature"], 5:["Commune with Nature"]};

export var MARK_SPELLS = {
  "Dwarf (Mark of Warding)": {1:["Alarm","Armor of Agathys"], 2:["Arcane Lock","Knock"], 3:["Glyph of Warding","Magic Circle"], 4:["Leomund's Secret Chest","Mordenkainen's Faithful Hound"], 5:["Antilife Shell"]},
  "Elf (Mark of Shadow)": {1:["Disguise Self","Silent Image"], 2:["Darkness","Pass without Trace"], 3:["Clairvoyance","Major Image"], 4:["Greater Invisibility","Hallucinatory Terrain"], 5:["Mislead"]},
  "Gnome (Mark of Scribing)": {1:["Comprehend Languages","Illusory Script"], 2:["Animal Messenger","Silence"], 3:["Sending","Tongues"], 4:["Arcane Eye","Divination"], 5:["Dream"]},
  "Halfling (Mark of Healing)": {1:["Cure Wounds","Healing Word"], 2:["Lesser Restoration","Prayer of Healing"], 3:["Aura of Vitality","Mass Healing Word"], 4:["Aura of Purity","Aura of Life"], 5:["Greater Restoration"]},
  "Halfling (Mark of Hospitality)": {1:["Goodberry","Sleep"], 2:["Aid","Calm Emotions"], 3:["Create Food and Water","Leomund's Tiny Hut"], 4:["Aura of Purity","Mordenkainen's Private Sanctum"], 5:["Hallow"]},
  "Half-Elf (Mark of Detection)": {1:["Detect Magic","Detect Poison and Disease"], 2:["Detect Thoughts","Find Traps"], 3:["Clairvoyance","Nondetection"], 4:["Arcane Eye","Divination"], 5:["Legend Lore"]},
  "Half-Elf (Mark of Storm)": {1:["Feather Fall","Fog Cloud"], 2:["Gust of Wind","Levitate"], 3:["Sleet Storm","Wind Wall"], 4:["Conjure Minor Elementals","Control Water"], 5:["Conjure Elemental"]},
  "Half-Orc (Mark of Finding)": FINDING,
  "Human (Mark of Finding)": FINDING,
  "Human (Mark of Handling)": {1:["Animal Friendship","Speak with Animals"], 2:["Beast Sense","Calm Emotions"], 3:["Beacon of Hope","Conjure Animals"], 4:["Aura of Life","Dominate Beast"], 5:["Awaken"]},
  "Human (Mark of Making)": {1:["Identify","Tenser's Floating Disk"], 2:["Continual Flame","Magic Weapon"], 3:["Conjure Barrage","Elemental Weapon"], 4:["Fabricate","Stone Shape"], 5:["Creation"]},
  "Human (Mark of Passage)": {1:["Expeditious Retreat","Jump"], 2:["Misty Step","Pass without Trace"], 3:["Blink","Phantom Steed"], 4:["Dimension Door","Freedom of Movement"], 5:["Teleportation Circle"]},
  "Human (Mark of Sentinel)": {1:["Compelled Duel","Shield of Faith"], 2:["Warding Bond","Zone of Truth"], 3:["Counterspell","Protection from Energy"], 4:["Death Ward","Guardian of Faith"], 5:["Bigby's Hand"]}
};

export var GUILD_SPELLS = {
  "Azorius Functionary": {0:["Friends","Message"], 1:["Command","Ensnaring Strike"], 2:["Arcane Lock","Calm Emotions","Hold Person"], 3:["Clairvoyance","Counterspell"], 4:["Compulsion","Divination"], 5:["Dominate Person"]},
  "Boros Legionnaire": {0:["Fire Bolt","Sacred Flame"], 1:["Guiding Bolt","Heroism"], 2:["Aid","Scorching Ray"], 3:["Beacon of Hope","Blinding Smite"], 4:["Death Ward","Wall of Fire"], 5:["Flame Strike"]},
  "Dimir Operative": {0:["Encode Thoughts","Mage Hand"], 1:["Disguise Self","Sleep"], 2:["Detect Thoughts","Pass without Trace"], 3:["Gaseous Form","Meld into Stone","Nondetection"], 4:["Arcane Eye","Freedom of Movement"], 5:["Modify Memory"]},
  "Golgari Agent": {0:["Dancing Lights","Spare the Dying"], 1:["Entangle","Ray of Sickness"], 2:["Protection from Poison","Ray of Enfeeblement","Spider Climb"], 3:["Animate Dead","Plant Growth"], 4:["Giant Insect","Grasping Vine"], 5:["Cloudkill","Insect Plague"]},
  "Gruul Anarch": {0:["Fire Bolt","Produce Flame"], 1:["Compelled Duel","Speak with Animals","Thunderwave"], 2:["Beast Sense","Shatter"], 3:["Conjure Animals","Conjure Barrage"], 4:["Dominate Beast","Stoneskin"], 5:["Destructive Wave"]},
  "Izzet Engineer": {0:["Produce Flame","Shocking Grasp"], 1:["Chaos Bolt","Create or Destroy Water","Unseen Servant"], 2:["Heat Metal","Rope Trick"], 3:["Call Lightning","Elemental Weapon","Glyph of Warding"], 4:["Conjure Minor Elementals","Divination","Otiluke's Resilient Sphere"], 5:["Animate Objects","Conjure Elemental"]},
  "Orzhov Representative": {0:["Friends","Guidance"], 1:["Command","Illusory Script"], 2:["Enthrall","Ray of Enfeeblement","Zone of Truth"], 3:["Bestow Curse","Speak with Dead","Spirit Guardians"], 4:["Blight","Death Ward","Leomund's Secret Chest"], 5:["Geas"]},
  "Rakdos Cultist": {0:["Fire Bolt","Vicious Mockery"], 1:["Burning Hands","Dissonant Whispers","Hellish Rebuke"], 2:["Crown of Madness","Enthrall","Flaming Sphere"], 3:["Fear","Haste"], 4:["Confusion","Wall of Fire"], 5:["Dominate Person"]},
  // The page lists Aid with the 1st-level spells; it's a 2nd-level spell.
  "Selesnya Initiate": {0:["Druidcraft","Friends"], 1:["Animal Friendship","Charm Person"], 2:["Aid","Animal Messenger","Calm Emotions","Warding Bond"], 3:["Plant Growth","Speak with Plants"], 4:["Aura of Life","Conjure Minor Elementals"], 5:["Awaken","Commune with Nature"]},
  "Simic Scientist": {0:["Acid Splash","Druidcraft"], 1:["Detect Poison and Disease","Expeditious Retreat","Jump"], 2:["Alter Self","Enhance Ability","Enlarge/Reduce"], 3:["Gaseous Form","Water Breathing","Wind Wall"], 4:["Freedom of Movement","Polymorph"], 5:["Creation"]}
};
