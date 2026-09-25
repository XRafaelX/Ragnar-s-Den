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
  "Urchin": {skills:["Sleight of Hand","Stealth"], blurb:"Grants Sleight of Hand and Stealth. You grew up on the streets, alone and poor."}
};
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
