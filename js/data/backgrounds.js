/* ---------------- Background data ---------------- */
export var BACKGROUNDS = {
  "Standard (SRD)": ["Acolyte"],
  "Expanded": [
    "Charlatan","Criminal","Entertainer","Folk Hero","Guild Artisan","Guild Merchant",
    "Hermit","Noble","Outlander","Sage","Sailor","Soldier","Urchin","Anthropologist",
    "Archaeologist","City Watch","Clan Crafter","Cloistered Scholar","Courtier",
    "Faction Agent","Far Traveler","Inheritor","Knight of the Order","Mercenary Veteran",
    "Urban Bounty Hunter","Uthgardt Tribe Member","Waterdhavian Noble"
  ],
  "Sword Coast Adventurer's Guide": [
    "Investigator","Pirate"
  ],
  "Guildmasters' Guide to Ravnica": [
    "Azorius Functionary","Boros Legionnaire","Dimir Operative","Golgari Agent",
    "Gruul Anarch","Izzet Engineer","Orzhov Representative","Rakdos Cultist",
    "Selesnya Initiate","Simic Scientist"
  ],
  "Ghosts of Saltmarsh": [
    "Fisher","Marine","Shipwright","Smuggler"
  ],
  "Acquisitions Incorporated": [
    "Celebrity Adventurer's Scion","Failed Merchant","Gambler","Plaintiff","Rival Intern"
  ],
  "Eberron: Rising from the Last War": [
    "House Agent"
  ],
  "Mythic Odysseys of Theros": [
    "Athlete"
  ],
  "Strixhaven: Curriculum of Chaos": [
    "Lorehold Student","Prismari Student","Quandrix Student","Silverquill Student","Witherbloom Student"
  ],
  "The Wild Beyond the Witchlight": [
    "Feylost","Witchlight Hand"
  ],
  "Spelljammer: Adventures in Space": [
    "Astral Drifter","Wildspacer"
  ],
  "Dragonlance: Shadow of the Dragon Queen": [
    "Knight of Solamnia","Mage of High Sorcery"
  ],
  "Planescape: Adventures in the Multiverse": [
    "Gate Warden","Planar Philosopher"
  ],
  "Glory of the Giants": [
    "Giant Foundling","Rune Carver"
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
  "Waterdhavian Noble": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion. You were born into a wealthy family of the City of Splendors."},

  /* ---- Sword Coast Adventurer's Guide ---- */
  "Investigator": {skills:["Insight","Investigation"], blurb:"Grants Insight and Investigation. A variant of City Watch — you track down criminals and unravel crimes rather than patrol the streets."},
  "Pirate": {skills:["Athletics","Perception"], blurb:"Grants Athletics and Perception. A variant of Sailor — you sailed under the black flag, plundering ships and earning a bad reputation in many ports."},

  /* ---- Guildmasters' Guide to Ravnica ---- */
  "Azorius Functionary": {skills:["Insight","Intimidation"], blurb:"Grants Insight and Intimidation. You serve the Azorius Senate, Ravnica's lawmakers, enforcers of order and legal authority."},
  "Boros Legionnaire": {skills:["Athletics","Intimidation"], blurb:"Grants Athletics and Intimidation. You are a soldier of the Boros Legion, Ravnica's combined military and police force, devoted to justice."},
  "Dimir Operative": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth. You work in the shadows for House Dimir, Ravnica's guild of spies, assassins, and secret brokers."},
  "Golgari Agent": {skills:["Athletics","Nature"], blurb:"Grants Athletics and Nature. You serve the Golgari Swarm, a guild that embraces the cycle of life, death, and decay beneath Ravnica's streets."},
  "Gruul Anarch": {skills:["Animal Handling","Athletics"], blurb:"Grants Animal Handling and Athletics. You run with the Gruul Clans, wild warriors who rage against Ravnica's urban sprawl and the guilds that built it."},
  "Izzet Engineer": {skills:["Arcana","Investigation"], blurb:"Grants Arcana and Investigation. You experiment under the chaotic brilliance of the Izzet League, blending magic and technology in often explosive ways."},
  "Orzhov Representative": {skills:["Insight","Religion"], blurb:"Grants Insight and Religion. You represent the Orzhov Syndicate, a corrupt church-turned-crime-family that deals in wealth, power, and undying debts."},
  "Rakdos Cultist": {skills:["Acrobatics","Performance"], blurb:"Grants Acrobatics and Performance. You perform with the Cult of Rakdos, a demonic circus that brings brutal, thrilling spectacle to Ravnica's streets."},
  "Selesnya Initiate": {skills:["Nature","Persuasion"], blurb:"Grants Nature and Persuasion. You are a member of the Selesnya Conclave, a guild devoted to community, nature, and the harmony of the Worldsoul."},
  "Simic Scientist": {skills:["Arcana","Medicine"], blurb:"Grants Arcana and Medicine. You conduct research for the Simic Combine, a guild that merges magic with biology to adapt life to an ever-changing world."},

  /* ---- Ghosts of Saltmarsh ---- */
  "Fisher": {skills:["History","Survival"], blurb:"Grants History and Survival. You spent your life aboard fishing vessels or combing the shallows for the bounty of the sea."},
  "Marine": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You have sailed into war on the decks of great ships, hardened by combat and the harsh life at sea."},
  "Shipwright": {skills:["History","Perception"], blurb:"Grants History and Perception. You have spent years designing and building seaworthy vessels, intimately familiar with how ships are put together."},
  "Smuggler": {skills:["Athletics","Deception"], blurb:"Grants Athletics and Deception. You have paddled goods past watchful eyes, built a network of contacts, and always have a tale that explains why you're innocent."},

  /* ---- Acquisitions Incorporated ---- */
  "Celebrity Adventurer's Scion": {skills:["Perception","Performance"], blurb:"Grants Perception and Performance. Your parent was a famous adventurer; you carry their name, their legend, and the weight of expectations you never asked for."},
  "Failed Merchant": {skills:["Investigation","Persuasion"], blurb:"Grants Investigation and Persuasion. Your business venture collapsed, but you emerged with a keen understanding of trade, contracts, and desperate negotiation."},
  "Gambler": {skills:["Deception","Insight"], blurb:"Grants Deception and Insight. You have spent years reading people and playing odds, learning when to bluff and when to fold."},
  "Plaintiff": {skills:["Medicine","Persuasion"], blurb:"Grants Medicine and Persuasion. You were once embroiled in a legal dispute with Acquisitions Incorporated, which left you knowing both the law and your own wounds."},
  "Rival Intern": {skills:["History","Investigation"], blurb:"Grants History and Investigation. You interned at a rival of Acquisitions Incorporated and gained a healthy — if grudging — respect for how they do business."},

  /* ---- Eberron: Rising from the Last War ---- */
  "House Agent": {skills:["Investigation","Persuasion"], blurb:"Grants Investigation and Persuasion. You have sworn fealty to one of Eberron's dragonmarked houses, serving as its eyes, hands, and sometimes its blade."},

  /* ---- Mythic Odysseys of Theros ---- */
  "Athlete": {skills:["Acrobatics","Athletics"], blurb:"Grants Acrobatics and Athletics. You have competed in the great athletic contests of Theros, earning glory, the roar of crowds, and the notice of the gods."},

  /* ---- Strixhaven: Curriculum of Chaos ---- */
  "Lorehold Student": {skills:["History","Arcana"], blurb:"Grants History and Arcana. A student of Lorehold College, devoted to exploring the past through magic, archaeology, and communing with spirits of history."},
  "Prismari Student": {skills:["Arcana","Performance"], blurb:"Grants Arcana and Performance. A student of Prismari College, merging elemental magic with artistic expression in grand, emotionally charged displays."},
  "Quandrix Student": {skills:["Arcana","Nature"], blurb:"Grants Arcana and Nature. A student of Quandrix College, studying the mathematical and geometric underpinnings of magic and the natural world."},
  "Silverquill Student": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion. A student of Silverquill College, wielding the power of words — inspiring speeches, cutting wit, and ink-forged magic."},
  "Witherbloom Student": {skills:["Survival","Medicine"], blurb:"Grants Survival and Medicine. A student of Witherbloom College, drawing power from the essence of life and death through biology, herbalism, and dark vitality."},

  /* ---- The Wild Beyond the Witchlight ---- */
  "Feylost": {skills:["Deception","Survival"], blurb:"Grants Deception and Survival. You grew up in the Feywild after vanishing from your home plane as a child, returning changed by your time among the fey."},
  "Witchlight Hand": {skills:["Performance","Sleight of Hand"], blurb:"Grants Performance and Sleight of Hand. You work behind the scenes of the Witchlight Carnival, keeping its wonders running and its secrets hidden."},

  /* ---- Spelljammer: Adventures in Space ---- */
  "Astral Drifter": {skills:["Insight","Religion"], blurb:"Grants Insight and Religion. You have traversed the Astral Sea for longer than you can remember, camping on dead gods and navigating the Silver Void."},
  "Wildspacer": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You grew up in Wildspace — on a spelljamming ship or far-flung settlement — and its dangers have made you tough as nails."},

  /* ---- Dragonlance: Shadow of the Dragon Queen ---- */
  "Knight of Solamnia": {skills:["Athletics","Persuasion"], blurb:"Grants Athletics and Persuasion. You have trained as a Knight of Solamnia, bound by strict codes of honor to defend the weak and oppose evil across Krynn."},
  "Mage of High Sorcery": {skills:["Arcana","History"], blurb:"Grants Arcana and History. You have studied at the Towers of High Sorcery on Krynn, devoting yourself to the disciplines of magic in one of its three orders."},

  /* ---- Planescape: Adventures in the Multiverse ---- */
  "Gate Warden": {skills:["Persuasion","Survival"], blurb:"Grants Persuasion and Survival. You grew up near a permanent planar portal, absorbing the essence of other planes and growing comfortable with the extraordinary."},
  "Planar Philosopher": {skills:["Arcana"], skillChoice:"plus one skill linked to your Sigil faction (e.g. Religion, History, Nature, Stealth, Perception, Insight, Medicine, Survival, Persuasion, Performance, or Athletics)", blurb:"Grants Arcana plus one faction-linked skill. You subscribe to a philosophy seeking hidden truths of the multiverse, aligned to one of Sigil's great factions."},

  /* ---- Glory of the Giants ---- */
  "Giant Foundling": {skills:["Intimidation","Survival"], blurb:"Grants Intimidation and Survival. You were raised among giants and carry their perspective — and their magic — with you into a world that seems small by comparison."},
  "Rune Carver": {skills:["History","Perception"], blurb:"Grants History and Perception. You have dedicated your life to studying the ancient runic magic of giants, carving their secrets into objects to wield their power."}
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
  "Uthgardt Tribe Member":"One musical instrument or artisan's tools", "Waterdhavian Noble":"One gaming set or musical instrument",

  /* ---- Sword Coast Adventurer's Guide ---- */
  "Investigator":"None", "Pirate":"Navigator's tools, water vehicles",

  /* ---- Guildmasters' Guide to Ravnica ---- */
  "Azorius Functionary":"None", "Boros Legionnaire":"None", "Dimir Operative":"Disguise kit or thieves' tools",
  "Golgari Agent":"Poisoner's kit", "Gruul Anarch":"Herbalism kit", "Izzet Engineer":"One type of artisan's tools",
  "Orzhov Representative":"None", "Rakdos Cultist":"One musical instrument", "Selesnya Initiate":"Herbalism kit",
  "Simic Scientist":"None",

  /* ---- Ghosts of Saltmarsh ---- */
  "Fisher":"Fishing tackle", "Marine":"Vehicles (water)", "Shipwright":"Carpenter's tools, vehicles (water)",
  "Smuggler":"Vehicles (water)",

  /* ---- Acquisitions Incorporated ---- */
  "Celebrity Adventurer's Scion":"Disguise kit",
  "Failed Merchant":"One type of artisan's tools", "Gambler":"One gaming set",
  "Plaintiff":"None", "Rival Intern":"None",

  /* ---- Eberron: Rising from the Last War ---- */
  "House Agent":"Two from house tool proficiencies table (varies by house)",

  /* ---- Mythic Odysseys of Theros ---- */
  "Athlete":"Vehicles (land)",

  /* ---- Strixhaven: Curriculum of Chaos ---- */
  "Lorehold Student":"One type of artisan's tools", "Prismari Student":"One type of artisan's tools",
  "Quandrix Student":"One type of artisan's tools", "Silverquill Student":"One type of artisan's tools",
  "Witherbloom Student":"One type of artisan's tools",

  /* ---- The Wild Beyond the Witchlight ---- */
  "Feylost":"One musical instrument", "Witchlight Hand":"Disguise kit or one musical instrument",

  /* ---- Spelljammer: Adventures in Space ---- */
  "Astral Drifter":"None", "Wildspacer":"Navigator's tools, vehicles (space)",

  /* ---- Dragonlance: Shadow of the Dragon Queen ---- */
  "Knight of Solamnia":"None", "Mage of High Sorcery":"None",

  /* ---- Planescape: Adventures in the Multiverse ---- */
  "Gate Warden":"None", "Planar Philosopher":"None",

  /* ---- Glory of the Giants ---- */
  "Giant Foundling":"None", "Rune Carver":"One type of artisan's tools"
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
  "Uthgardt Tribe Member":1, "Waterdhavian Noble":1,

  /* ---- Sword Coast Adventurer's Guide ---- */
  "Investigator":2, "Pirate":0,

  /* ---- Guildmasters' Guide to Ravnica ---- */
  "Azorius Functionary":2, "Boros Legionnaire":0, "Dimir Operative":0,
  "Golgari Agent":1, "Gruul Anarch":0, "Izzet Engineer":0,
  "Orzhov Representative":2, "Rakdos Cultist":0, "Selesnya Initiate":0,
  "Simic Scientist":2,

  /* ---- Ghosts of Saltmarsh ---- */
  "Fisher":1, "Marine":0, "Shipwright":0, "Smuggler":0,

  /* ---- Acquisitions Incorporated ---- */
  "Celebrity Adventurer's Scion":2, "Failed Merchant":0, "Gambler":0,
  "Plaintiff":0, "Rival Intern":1,

  /* ---- Eberron: Rising from the Last War ---- */
  "House Agent":0,

  /* ---- Mythic Odysseys of Theros ---- */
  "Athlete":1,

  /* ---- Strixhaven: Curriculum of Chaos ---- */
  "Lorehold Student":1, "Prismari Student":1, "Quandrix Student":1,
  "Silverquill Student":1, "Witherbloom Student":1,

  /* ---- The Wild Beyond the Witchlight ---- */
  "Feylost":1, "Witchlight Hand":0,

  /* ---- Spelljammer: Adventures in Space ---- */
  "Astral Drifter":2, "Wildspacer":0,

  /* ---- Dragonlance: Shadow of the Dragon Queen ---- */
  "Knight of Solamnia":0, "Mage of High Sorcery":0,

  /* ---- Planescape: Adventures in the Multiverse ---- */
  "Gate Warden":2, "Planar Philosopher":2,

  /* ---- Glory of the Giants ---- */
  "Giant Foundling":2, "Rune Carver":1
};
