/* ---------------- Background data ---------------- */
export var BACKGROUNDS = {
  "Standard (SRD)": ["Acolyte"],
  "Expanded": [
    "Charlatan","Criminal","Entertainer","Folk Hero","Guild Artisan","Guild Merchant",
    "Hermit","Noble","Outlander","Sage","Sailor","Soldier","Urchin","Anthropologist",
    "Archaeologist","City Watch","Clan Crafter","Cloistered Scholar","Courtier",
    "Faction Agent","Far Traveler","Inheritor","Knight of the Order","Mercenary Veteran",
    "Urban Bounty Hunter","Uthgardt Tribe Member","Waterdhavian Noble"
  ]
};

export var BACKGROUND_INFO = {
  "Acolyte": {skills:["Insight","Religion"], blurb:"Grants Insight and Religion, plus a holy symbol and prayer book. You served in a temple."},
  "Charlatan": {skills:["Deception","Sleight of Hand"], blurb:"Grants Deception and Sleight of Hand. You're a practiced con artist and forger."},
  "Criminal": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth, plus a criminal contact. You have a history of breaking the law."},
  "Entertainer": {skills:["Acrobatics","Performance"], blurb:"Grants Acrobatics and Performance, plus a musical instrument. You lived to entertain audiences."},
  "Folk Hero": {skills:["Animal Handling","Survival"], blurb:"Grants Animal Handling and Survival. You're a champion of the common people back home."},
  "Guild Artisan": {skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion, plus membership in a trade guild and its tools."},
  "Hermit": {skills:["Medicine","Religion"], blurb:"Grants Medicine and Religion. You lived in seclusion, seeking spiritual insight."},
  "Noble": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion, plus a signet ring and standing in society."},
  "Outlander": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You grew up in the wilds, far from civilization, a natural fit for a Barbarian."},
  "Sage": {skills:["Arcana","History"], blurb:"Grants Arcana and History. You spent years learning the lore of the multiverse."},
  "Sailor": {skills:["Athletics","Perception"], blurb:"Grants Athletics and Perception, plus rope and a vehicle proficiency. You sailed the seas."},
  "Soldier": {skills:["Athletics","Intimidation"], blurb:"Grants Athletics and Intimidation, plus rank and military gear. You served in an army."},
  "Urchin": {skills:["Sleight of Hand","Stealth"], blurb:"Grants Sleight of Hand and Stealth. You grew up on the streets, alone and poor."},
  "Guild Merchant": {skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion. A guild trader who knows markets, contracts and caravan routes."},
  "Anthropologist": {skills:["Insight","Religion"], blurb:"Grants Insight and Religion, plus two languages. You study other cultures by living among them."},
  "Archaeologist": {skills:["History","Survival"], blurb:"Grants History and Survival. You dig through ruins to uncover the secrets of lost civilizations."},
  "City Watch": {skills:["Athletics","Insight"], blurb:"Grants Athletics and Insight, plus two languages. You kept the peace on a city's streets."},
  "Clan Crafter": {skills:["History","Insight"], blurb:"Grants History and Insight, plus a set of artisan's tools. You learned a craft from a dwarven clan."},
  "Cloistered Scholar": {skills:["History"], skillChoice:"plus one of Arcana, Nature or Religion", blurb:"Grants History plus one of Arcana, Nature or Religion, and two languages. You studied in a great library or monastery."},
  "Courtier": {skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion, plus two languages. You know the etiquette and intrigue of royal courts."},
  "Faction Agent": {skills:["Insight"], skillChoice:"plus one Intelligence, Wisdom or Charisma skill", blurb:"Grants Insight plus one more social or mental skill, and two languages. You serve a faction and can call on its members."},
  "Far Traveler": {skills:["Insight","Perception"], blurb:"Grants Insight and Perception. You come from a distant land, and people are curious about your ways."},
  "Inheritor": {skills:["Survival"], skillChoice:"plus one of Arcana, History or Religion", blurb:"Grants Survival plus one of Arcana, History or Religion. You carry an heirloom others would kill for."},
  "Knight of the Order": {skills:["Persuasion"], skillChoice:"plus one of Arcana, History, Nature or Religion", blurb:"Grants Persuasion plus one of Arcana, History, Nature or Religion. You're sworn to a knightly order and its ideals."},
  "Mercenary Veteran": {skills:["Athletics","Persuasion"], blurb:"Grants Athletics and Persuasion. You fought for coin with a mercenary company."},
  "Urban Bounty Hunter": {skills:[], skillChoice:"two of Deception, Insight, Persuasion or Stealth", blurb:"Grants two of Deception, Insight, Persuasion or Stealth. You hunt fugitives through a city's streets and underworld."},
  "Uthgardt Tribe Member": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You belong to one of the barbarian tribes of the North."},
  "Waterdhavian Noble": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion. You were born into a wealthy family of the City of Splendors."}
};

/* Tool (and vehicle) proficiencies each background grants, for the
   Compendium. "Choose" entries are picked by the player. */
export var BACKGROUND_TOOLS = {
  "Acolyte":"None", "Charlatan":"Disguise kit, forgery kit", "Criminal":"One gaming set, thieves' tools",
  "Entertainer":"Disguise kit, one musical instrument", "Folk Hero":"One type of artisan's tools, land vehicles",
  "Guild Artisan":"One type of artisan's tools", "Guild Merchant":"Navigator's tools or one language",
  "Hermit":"Herbalism kit", "Noble":"One gaming set", "Outlander":"One musical instrument", "Sage":"None",
  "Sailor":"Navigator's tools, water vehicles", "Soldier":"One gaming set, land vehicles",
  "Urchin":"Disguise kit, thieves' tools", "Anthropologist":"None", "Archaeologist":"Cartographer's or navigator's tools",
  "City Watch":"None", "Clan Crafter":"One type of artisan's tools", "Cloistered Scholar":"None", "Courtier":"None",
  "Faction Agent":"None", "Far Traveler":"One musical instrument or gaming set", "Inheritor":"One gaming set or musical instrument",
  "Knight of the Order":"One gaming set or musical instrument", "Mercenary Veteran":"One gaming set, land vehicles",
  "Urban Bounty Hunter":"Two of: one gaming set, one musical instrument, thieves' tools",
  "Uthgardt Tribe Member":"One musical instrument or artisan's tools", "Waterdhavian Noble":"One gaming set or musical instrument"
};
/* Some backgrounds let the player pick a skill (`skillChoice`); the wizard
   grants the fixed `skills` and the blurb says what else to tick. */
export var BACKGROUND_INFO_FALLBACK = "Grants two skill proficiencies of your choice (and usually a tool or language). Pick whatever fits your character's story; you can add them on the sheet's Skills tab afterward.";

/* Languages of your choice each background grants (0 when it gives a
   tool instead). Drives the Languages step of the creation wizard. */
export var BACKGROUND_LANGUAGES = {
  "Acolyte":2, "Charlatan":0, "Criminal":0, "Entertainer":0, "Folk Hero":0,
  "Guild Artisan":1, "Guild Merchant":1, "Hermit":1, "Noble":1, "Outlander":1,
  "Sage":2, "Sailor":0, "Soldier":0, "Urchin":0, "Anthropologist":2,
  "Archaeologist":1, "City Watch":2, "Clan Crafter":1, "Cloistered Scholar":2,
  "Courtier":2, "Faction Agent":2, "Far Traveler":1, "Inheritor":1,
  "Knight of the Order":1, "Mercenary Veteran":0, "Urban Bounty Hunter":0,
  "Uthgardt Tribe Member":1, "Waterdhavian Noble":1
};
