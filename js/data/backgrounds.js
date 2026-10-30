/* ---------------- Background data ---------------- */
export var BACKGROUNDS = {
  "Player's Handbook": [
    "Acolyte","Charlatan","Criminal","Entertainer","Folk Hero","Guild Artisan","Guild Merchant",
    "Hermit","Noble","Outlander","Sage","Sailor","Soldier","Urchin",
    "Gladiator","Knight","Spy"
  ],
  "Forgotten Realms (SCAG / ToA)": [
    "Anthropologist","Archaeologist","City Watch","Clan Crafter","Cloistered Scholar","Courtier",
    "Faction Agent","Far Traveler","Inheritor","Knight of the Order","Mercenary Veteran",
    "Urban Bounty Hunter","Uthgardt Tribe Member","Waterdhavian Noble",
    "Investigator","Pirate"
  ],
  "Other Settings": [
    "Azorius Functionary","Boros Legionnaire","Dimir Operative","Golgari Agent",
    "Gruul Anarch","Izzet Engineer","Orzhov Representative","Rakdos Cultist",
    "Selesnya Initiate","Simic Scientist",
    "House Agent",
    "Athlete",
    "Lorehold Student","Prismari Student","Quandrix Student","Silverquill Student","Witherbloom Student",
    "Knight of Solamnia","Mage of High Sorcery",
    "Gate Warden","Planar Philosopher",
    "Giant Foundling","Rune Carver",
    "Ashari","Clasp Member","Lyceum Scholar","Reformed Cultist","Whitestone Rifle Corps",
    "Grinner","Volstrucker Agent",
    "Initiate","Vizier","Inquisitor"
  ],
  "Adventures & Supplements": [
    "Fisher","Marine","Shipwright","Smuggler",
    "Celebrity Adventurer's Scion","Failed Merchant","Gambler","Plaintiff","Rival Intern",
    "Feylost","Witchlight Hand",
    "Astral Drifter","Wildspacer",
    "Haunted One","Investigator (Ravenloft)",
    "Faceless",
    "Rewarded","Ruined"
  ],
  "Adventurers League": [
    "Black Fist Double Agent","Dragon Casualty","Iron Route Bandit","Phlan Insurgent","Stojanow Prisoner","Ticklebelly Nomad",
    "Caravan Specialist","Earthspur Miner","Harborfolk","Mulmaster Aristocrat","Phlan Refugee",
    "Cormanthor Refugee","Gate Urchin","Hillsfar Merchant","Hillsfar Smuggler","Secret Identity","Shade Fanatic","Trade Sheriff"
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
  "Cloistered Scholar": {skills:["History"], skillChoice:"plus one of Arcana, Nature or Religion", skillPick:{count:1, options:["Arcana","Nature","Religion"]}, blurb:"Grants History plus one of Arcana, Nature or Religion, and two languages. You studied in a great library or monastery."},
  "Courtier": {skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion, plus two languages. You know the etiquette and intrigue of royal courts."},
  "Faction Agent": {skills:["Insight"], skillChoice:"plus one Intelligence, Wisdom or Charisma skill", skillPick:{count:1, options:["Arcana","History","Investigation","Nature","Religion","Animal Handling","Medicine","Perception","Survival","Deception","Intimidation","Performance","Persuasion"]}, blurb:"Grants Insight plus one more social or mental skill, and two languages. You serve a faction and can call on its members."},
  "Far Traveler": {skills:["Insight","Perception"], blurb:"Grants Insight and Perception. You come from a distant land, and people are curious about your ways."},
  "Inheritor": {skills:["Survival"], skillChoice:"plus one of Arcana, History or Religion", skillPick:{count:1, options:["Arcana","History","Religion"]}, blurb:"Grants Survival plus one of Arcana, History or Religion. You carry an heirloom others would kill for."},
  "Knight of the Order": {skills:["Persuasion"], skillChoice:"plus one of Arcana, History, Nature or Religion", skillPick:{count:1, options:["Arcana","History","Nature","Religion"]}, blurb:"Grants Persuasion plus one of Arcana, History, Nature or Religion. You're sworn to a knightly order and its ideals."},
  "Mercenary Veteran": {skills:["Athletics","Persuasion"], blurb:"Grants Athletics and Persuasion. You fought for coin with a mercenary company."},
  "Urban Bounty Hunter": {skills:[], skillChoice:"two of Deception, Insight, Persuasion or Stealth", skillPick:{count:2, options:["Deception","Insight","Persuasion","Stealth"]}, blurb:"Grants two of Deception, Insight, Persuasion or Stealth. You hunt fugitives through a city's streets and underworld."},
  "Uthgardt Tribe Member": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You belong to one of the barbarian tribes of the North."},
  "Waterdhavian Noble": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion. You were born into a wealthy family of the City of Splendors."},

  /* ---- Sword Coast Adventurer's Guide ---- */
  "Investigator": {skills:["Insight","Investigation"], blurb:"Grants Insight and Investigation. A variant of City Watch: you track down criminals and unravel crimes rather than patrol the streets."},
  "Pirate": {skills:["Athletics","Perception"], blurb:"Grants Athletics and Perception. A variant of Sailor: you sailed under the black flag, plundering ships and earning a bad reputation in many ports."},

  /* ---- Guildmasters' Guide to Ravnica ---- */
  "Azorius Functionary": {skills:["Insight","Intimidation"], blurb:"Grants Insight and Intimidation. You serve the Azorius Senate, Ravnica's lawmakers, enforcers of order and legal authority."},
  "Boros Legionnaire": {skills:["Athletics","Intimidation"], blurb:"Grants Athletics and Intimidation. You are a soldier of the Boros Legion, Ravnica's combined military and police force, devoted to justice."},
  "Dimir Operative": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth. You work in the shadows for House Dimir, Ravnica's guild of spies, assassins, and secret brokers."},
  "Golgari Agent": {skills:["Nature","Survival"], blurb:"Grants Nature and Survival, plus a poisoner's kit. You serve the Golgari Swarm, a guild that embraces the cycle of life, death, and decay beneath Ravnica's streets."},
  "Gruul Anarch": {skills:["Animal Handling","Athletics"], blurb:"Grants Animal Handling and Athletics. You run with the Gruul Clans, wild warriors who rage against Ravnica's urban sprawl and the guilds that built it."},
  "Izzet Engineer": {skills:["Arcana","Investigation"], blurb:"Grants Arcana and Investigation. You experiment under the chaotic brilliance of the Izzet League, blending magic and technology in often explosive ways."},
  "Orzhov Representative": {skills:["Intimidation","Religion"], blurb:"Grants Intimidation and Religion. You represent the Orzhov Syndicate, a corrupt church-turned-crime-family that deals in wealth, power, and undying debts."},
  "Rakdos Cultist": {skills:["Acrobatics","Performance"], blurb:"Grants Acrobatics and Performance. You perform with the Cult of Rakdos, a demonic circus that brings brutal, thrilling spectacle to Ravnica's streets."},
  "Selesnya Initiate": {skills:["Nature","Persuasion"], blurb:"Grants Nature and Persuasion. You are a member of the Selesnya Conclave, a guild devoted to community, nature, and the harmony of the Worldsoul."},
  "Simic Scientist": {skills:["Arcana","Medicine"], blurb:"Grants Arcana and Medicine. You conduct research for the Simic Combine, a guild that merges magic with biology to adapt life to an ever-changing world."},

  /* ---- Ghosts of Saltmarsh ---- */
  "Fisher": {skills:["History","Survival"], blurb:"Grants History and Survival. You spent your life aboard fishing vessels or combing the shallows for the bounty of the sea."},
  "Marine": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You have sailed into war on the decks of great ships, hardened by combat and the harsh life at sea."},
  "Shipwright": {skills:["History","Perception"], blurb:"Grants History and Perception. You have spent years designing and building seaworthy vessels, intimately familiar with how ships are put together."},
  "Smuggler": {skills:["Athletics","Deception"], blurb:"Grants Athletics and Deception. You have paddled goods past watchful eyes, built a network of contacts, and always have a tale that explains why you're innocent."},

  /* ---- Acquisitions Incorporated ---- */
  "Celebrity Adventurer's Scion": {skills:["Perception","Performance"], blurb:"Grants Perception and Performance. Your parent was a famous adventurer. You carry their name, their legend, and the weight of expectations you never asked for."},
  "Failed Merchant": {skills:["Investigation","Persuasion"], blurb:"Grants Investigation and Persuasion. Your business venture collapsed, but you emerged with a keen understanding of trade, contracts, and desperate negotiation."},
  "Gambler": {skills:["Deception","Insight"], blurb:"Grants Deception and Insight. You have spent years reading people and playing odds, learning when to bluff and when to fold."},
  "Plaintiff": {skills:["Medicine","Persuasion"], blurb:"Grants Medicine and Persuasion. You were once embroiled in a legal dispute with Acquisitions Incorporated, which left you knowing both the law and your own wounds."},
  "Rival Intern": {skills:["History","Investigation"], blurb:"Grants History and Investigation. You interned at a rival of Acquisitions Incorporated and gained a healthy (if grudging) respect for how they do business."},

  /* ---- Eberron: Rising from the Last War ---- */
  "House Agent": {skills:["Investigation","Persuasion"], blurb:"Grants Investigation and Persuasion. You have sworn fealty to one of Eberron's dragonmarked houses, serving as its eyes, hands, and sometimes its blade."},

  /* ---- Mythic Odysseys of Theros ---- */
  "Athlete": {skills:["Acrobatics","Athletics"], blurb:"Grants Acrobatics and Athletics. You have competed in the great athletic contests of Theros, earning glory, the roar of crowds, and the notice of the gods."},

  /* ---- Strixhaven: Curriculum of Chaos ---- */
  "Lorehold Student": {feat:{name:"Strixhaven Initiate", option:"Lorehold"}, skills:["History","Religion"], blurb:"Grants History and Religion, and two languages. A student of Lorehold College, devoted to exploring the past through magic, archaeology, and communing with spirits of history."},
  "Prismari Student": {feat:{name:"Strixhaven Initiate", option:"Prismari"}, skills:["Acrobatics","Performance"], blurb:"Grants Acrobatics and Performance, plus a musical instrument or artisan's tools. A student of Prismari College, merging elemental magic with artistic expression in grand, emotionally charged displays."},
  "Quandrix Student": {feat:{name:"Strixhaven Initiate", option:"Quandrix"}, skills:["Arcana","Nature"], blurb:"Grants Arcana and Nature. A student of Quandrix College, studying the mathematical and geometric underpinnings of magic and the natural world."},
  "Silverquill Student": {feat:{name:"Strixhaven Initiate", option:"Silverquill"}, skills:["Intimidation","Persuasion"], blurb:"Grants Intimidation and Persuasion, and two languages. A student of Silverquill College, wielding the power of words: inspiring speeches, cutting wit, and ink-forged magic."},
  "Witherbloom Student": {feat:{name:"Strixhaven Initiate", option:"Witherbloom"}, skills:["Nature","Survival"], blurb:"Grants Nature and Survival, plus an herbalism kit. A student of Witherbloom College, drawing power from the essence of life and death through biology, herbalism, and dark vitality."},

  /* ---- The Wild Beyond the Witchlight ---- */
  "Feylost": {skills:["Deception","Survival"], blurb:"Grants Deception and Survival. You grew up in the Feywild after vanishing from your home plane as a child, returning changed by your time among the fey."},
  "Witchlight Hand": {skills:["Performance","Sleight of Hand"], blurb:"Grants Performance and Sleight of Hand. You work behind the scenes of the Witchlight Carnival, keeping its wonders running and its secrets hidden."},

  /* ---- Spelljammer: Adventures in Space ---- */
  "Astral Drifter": {feat:{name:"Magic Initiate", option:"Cleric"}, skills:["Insight","Religion"], blurb:"Grants Insight and Religion. You have traversed the Astral Sea for longer than you can remember, camping on dead gods and navigating the Silver Void."},
  "Wildspacer": {feat:{name:"Tough"}, skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You grew up in Wildspace (on a spelljamming ship or far-flung settlement), and its dangers have made you tough as nails."},

  /* ---- Dragonlance: Shadow of the Dragon Queen ---- */
  "Knight of Solamnia": {feat:{name:"Squire of Solamnia"}, skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival, and two languages. You have trained as a Knight of Solamnia, bound by strict codes of honor to defend the weak and oppose evil across Krynn."},
  "Mage of High Sorcery": {feat:{name:"Initiate of High Sorcery"}, skills:["Arcana","History"], blurb:"Grants Arcana and History. You have studied at the Towers of High Sorcery on Krynn, devoting yourself to the disciplines of magic in one of its three orders."},

  /* ---- Planescape: Adventures in the Multiverse ---- */
  "Gate Warden": {feat:{name:"Scion of the Outer Planes"}, skills:["Persuasion","Survival"], blurb:"Grants Persuasion and Survival. You grew up near a permanent planar portal, absorbing the essence of other planes and growing comfortable with the extraordinary."},
  "Planar Philosopher": {feat:{name:"Scion of the Outer Planes"}, skills:["Arcana"], skillChoice:"plus your Sigil faction's skill, or one skill of your choice", skillPick:{count:1, options:["Acrobatics","Animal Handling","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"]}, blurb:"Grants Arcana plus one faction-linked skill. You subscribe to a philosophy seeking hidden truths of the multiverse, aligned to one of Sigil's great factions."},

  /* ---- Glory of the Giants ---- */
  "Giant Foundling": {feat:{name:"Strike of the Giants"}, skills:["Intimidation","Survival"], blurb:"Grants Intimidation and Survival. You were raised among giants and carry their perspective, and their magic, with you into a world that seems small by comparison."},
  "Rune Carver": {feat:{name:"Rune Shaper"}, skills:["History","Perception"], blurb:"Grants History and Perception. You have dedicated your life to studying the ancient runic magic of giants, carving their secrets into objects to wield their power."},

  /* ---- Curse of Strahd / Van Richten's Guide to Ravenloft ---- */
  "Haunted One": {skills:[], skillChoice:"two of Arcana, Investigation, Religion or Survival", skillPick:{count:2, options:["Arcana","Investigation","Religion","Survival"]},
    exoticLanguages:1,
    blurb:"Grants two of Arcana, Investigation, Religion or Survival, and two languages (one of them exotic). Something terrible happened to you, and a dark presence still follows you. Starts with a monster hunter's pack (chest, crowbar, hammer, three wooden stakes, holy symbol, holy water, manacles, steel mirror, oil, tinderbox, three torches), one trinket of special significance, a set of common clothes and 1 sp.",
    feature:{name:"Heart of Darkness", text:"Those who look into your eyes can see that you have faced unimaginable horror and that you are no stranger to darkness. Though they might fear you, commoners will extend you every courtesy and do their utmost to help you. Unless you have shown yourself to be a danger to them, they will even take up arms to fight alongside you, should you find yourself facing an enemy alone."}},

  /* ---- Player's Handbook variants (checked against the published pages
     on 2026-10-17, see .claude/research/races-backgrounds.md) ---- */
  "Gladiator": {skills:["Acrobatics","Performance"], blurb:"Grants Acrobatics and Performance, plus a disguise kit and one musical instrument. A variant of Entertainer: you make combat a spectacle for the crowd, and may start with an inexpensive but unusual weapon, such as a trident or net, in place of the instrument.",
    feature:{name:"By Popular Demand", text:"You can always find a place to perform in any place that features combat for entertainment, perhaps a gladiatorial arena or secret pit fighting club. At such a place, you receive free lodging and food of a modest or comfortable standard (depending on the quality of the establishment), as long as you perform each night. In addition, your performance makes you something of a local figure. When strangers recognize you in a town where you have performed, they typically take a liking to you."}},
  "Knight": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion, plus one gaming set and one language. A variant of Noble: a knighthood is among the lowest noble titles, but it can be a path to higher status.",
    feature:{name:"Retainers", text:"You have the service of three retainers loyal to your family. One of them is a noble who serves as your squire, aiding you in exchange for training on their own path to knighthood. The other two might include a groom to care for your horse and a servant who polishes your armor. Your retainers can perform mundane tasks for you, but they do not fight for you, will not follow you into obviously dangerous areas (such as dungeons), and will leave if they are frequently endangered or abused."}},
  "Spy": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth, plus thieves' tools and one gaming set. A variant of Criminal: you learned your skills as an espionage agent, for the crown or for the highest bidder.",
    feature:{name:"Criminal Contact", text:"You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances. Specifically, you know the local messengers, corrupt caravan masters, and seedy sailors who can deliver messages for you."}},

  /* ---- Tal'Dorei Campaign Setting Reborn ---- */
  "Ashari": {skills:["Nature"], skillChoice:"plus one of Arcana or Survival", skillPick:{count:1, options:["Arcana","Survival"]}, blurb:"Grants Nature plus one of Arcana or Survival, an herbalism kit and Primordial. You grew up in an Ashari tribe, guarding one of Exandria's elemental rifts.",
    feature:{name:"Elemental Harmony", text:"As an action, you channel minor magic involving the element of your Ashari order. Pyrah: you instantly create and control a burst of flame small enough to light a candle, a torch or a small campfire, or snuff out a flame of that size. Terrah: you instantly create a small rock no larger than a gold coin in your hand. It turns to dust after 1 minute. Vesrah: you instantly create enough hot or cold water to fill a small drinking vessel. Zephrah: you create an instant puff of wind strong enough to blow papers off a desk or mess up someone's hair."}},
  "Clasp Member": {skills:["Deception"], skillChoice:"plus one of Sleight of Hand or Stealth", skillPick:{count:1, options:["Sleight of Hand","Stealth"]}, blurb:"Grants Deception plus one of Sleight of Hand or Stealth, one of a disguise kit, forgery kit or thieves' tools, and Thieves' Cant. You belong to the Clasp, a crime syndicate with hideouts in every city in Tal'Dorei. As a variant, you work for its ruthless rival, the Myriad.",
    feature:{name:"A Favor in Turn", text:"You can call in a favor from your contacts whenever you're close enough to a center of syndicate activity. A request can be no longer than 20 words, and is passed up the chain to an undisclosed Spireling for approval. The favor can take any form the DM approves, and the DM decides how it is fulfilled. If muscle is requested, an NPC member of the Clasp can temporarily aid your party. If money is needed, a small loan can be provided. If you've been imprisoned, Clasp operatives can look into breaking you out or paying off the jailer. At some point the favor will be called in for repayment, often without warning, and refusing means your termination, literally. You might be called on to commit a burglary, pressure a dignitary to reveal a secret, or even assassinate a specific person, with no questions asked or answered. It's up to the DM to make sure the request is proportionate to the favor, or that you are compensated for anything beyond it."}},
  "Lyceum Scholar": {skills:[], skillChoice:"two of Arcana, History or Persuasion", skillPick:{count:2, options:["Arcana","History","Persuasion"]}, blurb:"Grants two of Arcana, History or Persuasion, plus two languages. You studied at the Alabaster Lyceum in Emon, Tal'Dorei's highest place of learning, as a student or a graduate.",
    feature:{name:"Academic Requisition", text:"You have access to certain private areas within the Lyceum and other allied universities. Whenever you're on Lyceum grounds or at another major academic institution, you can requisition any set of tools found in the rules. Each set is magically marked to sound an alarm if it is removed from the university's grounds. When you seek services such as spellcasting from an NPC at the Alabaster Lyceum or a related institution, you can use those services at a 25 percent discount, at the DM's discretion."}},
  "Reformed Cultist": {skills:["Deception","Religion"], blurb:"Grants Deception and Religion, plus one language. You once belonged to a cult of the Betrayer Gods. You broke free, but the cult does not forgive betrayers, and it will hunt you for as long as you live.",
    feature:{name:"Fell Teachings", text:"Choose one of the Betrayer Gods. You know everything from their basic commandments to some of their most esoteric secrets, and you have advantage on Intelligence (Religion) checks to know information about their faith, including obscure secrets unknown to most worshipers. You can also work with your DM to create a secret you learned during your time in the cult. It might be the seed of a conspiracy, a myth of a legendary hero whose true meaning has changed over the years, or even the location of a fabled artifact of the gods."}},
  "Whitestone Rifle Corps": {skills:[], skillChoice:"two of Athletics, Perception or Survival", skillPick:{count:2, options:["Athletics","Perception","Survival"]}, blurb:"Grants two of Athletics, Perception or Survival, proficiency with firearms and one language. You trained with the elite defenders of the city-state of Whitestone and swore never to let the secrets of their firearms fall into the wrong hands. As a variant, you are a Whitestone Hunter, a secret operative of the de Rolo family.",
    feature:{name:"Legacy of Secrecy", text:"Your commander in the Whitestone Rifle Corps granted you a musket or a pistol. This weapon is a symbol of your status, and when you display it, other folk around you, particularly adventurers, mercenaries, guards, engineers and weapons enthusiasts, treat you differently. You might be seen as a noble defender of the people, a selfish hoarder of power, or anything in between, at the DM's discretion."},
    feature2:{name:"Rifle Corps Relationship", text:"You are, or were, a member of a trusted band of Whitestone's staunchest defenders. Work with your DM to determine your current relationship with the Rifle Corps. If your campaign starts in Whitestone, you might be an active member of that unit. Otherwise, the Rifle Corps Relationship table has suggestions. A Whitestone Hunter also has the ear of the lord and lady of Whitestone, but must use this privilege graciously or lose it."}},

  /* ---- Explorer's Guide to Wildemount ---- */
  "Grinner": {skills:["Deception","Performance"], blurb:"Grants Deception and Performance, plus thieves' tools and one musical instrument. You are a spy and rebel of the Golden Grin, hiding secret messages in folk songs.",
    feature:{name:"Ballad of the Grinning Fool", text:"In any city of 10,000 people or more on the Menagerie Coast or in the lands of the Dwendalian Empire, you can play the \"Ballad of the Grinning Fool\" in a major tavern or inn. A member of the Golden Grin will find you and give shelter to you and any companions you vouch for. This shelter might be discontinued if it becomes too dangerous to hide you, at the DM's discretion. Use it with caution: not all who know the ballad are your friends."}},
  "Volstrucker Agent": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth, plus a poisoner's kit and one language. You are a secret assassin of the Cerberus Assembly, chosen after a tragedy broke you.",
    feature:{name:"Shadow Network", text:"If you write a letter in special arcane ink (the ink a wizard uses for a spellbook, 10 gp per page), address it to a member of the Volstrucker and cast it into a fire, the letter burns to cinders and materializes whole again on the person of the agent you addressed it to."}},

  /* ---- Plane Shift: Amonkhet and Innistrad ---- */
  "Initiate": {skills:["Athletics","Intimidation"], blurb:"Grants Athletics and Intimidation, plus one gaming set and land vehicles. You train for the five trials of Amonkhet's gods, hoping to prove worthy of the afterlife.",
    feature:{name:"Trial of the Five Gods", text:"While you prepare for and undergo the trials, you have constant access to training, and a comfortable place to live and regular meals are provided by servitor mummies under the supervision of viziers. You enjoy these benefits only as long as you obey the norms of Naktamun: training for the trials, obeying the gods and following their viziers. If you break them, you risk being treated as a dissenter."}},
  "Vizier": {skills:["History","Religion"], blurb:"Grants History and Religion, plus one type of artisan's tools and one musical instrument. You serve one of Amonkhet's five gods, teaching and guiding the initiates.",
    feature:{name:"Voice of Authority", text:"Your voice is the voice of your god, at least in theory. Your job might include training and instructing initiates, and they are required to obey you. In any circumstance, an initiate is expected to defer to your voice and obey your commands. If you abuse this authority, though, your god might personally punish you."}},
  "Inquisitor": {skills:["Investigation","Religion"], blurb:"Grants Investigation and Religion, plus thieves' tools and one type of artisan's tools. You hunt heretics and monsters for the church of Innistrad.",
    feature:{name:"Legal Authority", text:"As an inquisitor of the church, you have the authority to arrest criminals. In the absence of other authorities, you are authorized to pass judgment and even carry out sentencing. If you abuse this power, however, your superiors in the church might strip it from you."}},

  /* ---- Van Richten's Guide to Ravenloft ---- */
  "Investigator (Ravenloft)": {skills:[], skillChoice:"two of Insight, Investigation or Perception", skillPick:{count:2, options:["Insight","Investigation","Perception"]}, blurb:"Grants two of Insight, Investigation or Perception, plus a disguise kit and thieves' tools. Your first case set you on the path of solving mysteries others leave alone.",
    feature:{name:"Official Inquiry", text:"Through a combination of fast-talking, determination and official-looking documentation, you can gain access to a place or an individual related to a crime you're investigating. Those who aren't involved in your investigation avoid impeding you or pass along your requests. Additionally, local law enforcement has firm opinions about you, viewing you as either a nuisance or one of their own."}},

  /* ---- Baldur's Gate: Descent into Avernus ---- */
  "Faceless": {skills:["Deception","Intimidation"], blurb:"Grants Deception and Intimidation, plus a disguise kit and one language. You adventure behind the mask of a public persona that hides your true face.",
    feature:{name:"Dual Personalities", text:"Most of your fellow adventurers and the world know you as your persona. Upon donning a disguise and behaving as your persona, you are unidentifiable as your true self. By removing your disguise and revealing your true face, you are no longer identifiable as your persona. You can change between your two personalities as often as you wish, using one to hide the other. However, should someone realize the connection between your persona and your true self, your deception might lose its effectiveness."}},

  /* ---- The Book of Many Things ---- */
  "Rewarded": {feat:{choices:["Lucky","Magic Initiate","Skilled"]}, skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion, plus one gaming set and one language. A miraculous turn of good fortune lifted you out of a hard life.",
    feature:{name:"Fortune's Favor", text:"Your unexpected good fortune is reflected by a minor boon: you gain the Lucky, Magic Initiate or Skilled feat (your choice). Your choice reflects the transformation that changed your life."}},
  "Ruined": {feat:{choices:["Alert","Skilled","Tough"]}, skills:["Stealth","Survival"], blurb:"Grants Stealth and Survival, plus one gaming set and one language. You had a life of comfort and lost it all, and adventuring is the only path left open.",
    feature:{name:"Still Standing", text:"You have weathered ruinous misfortune, and you possess hidden reserves others don't expect: you gain the Alert, Skilled or Tough feat (your choice). Your choice reflects how you've dealt with the terrible loss that changed your life forever."}},

  /* ---- Adventurers League: Phlan (Curse of Strahd character options) ---- */
  "Black Fist Double Agent": {skills:["Deception","Insight"], blurb:"Grants Deception and Insight, plus a disguise kit and one type of artisan's tools or gaming set. You inform for the Tears of Virulence in Phlan while secretly working for the Black Fist.",
    feature:{name:"Double Agent", text:"You have a reliable and trusty contact within the Tears of Virulence garrison in Phlan to whom you pass information and secrets. In exchange, you can get away with minor criminal offenses within the town of Phlan. In addition, your Black Fist contacts can help you secure an audience with the Lord Regent, the Lord Sage, members of the Black Fist, or deposed nobles and authority figures who are sympathetic to the Phlan refugees and insurgents."}},
  "Dragon Casualty": {skills:["Intimidation","Survival"], blurb:"Grants Intimidation and Survival, Draconic, and one tool set by your former occupation. You survived torture by the green dragon Vorgansharax, and the scars mark you.",
    feature:{name:"Dragonscarred", text:"Your disfigurement marks you as a survivor of the Maimed Virulence. Those who know of your ordeal are keen to hear the tale, which makes it hard to disguise your appearance and hide from prying eyes. You can parley this attention into access to people and places you might not otherwise have, for you and your companions: nobles, scholars, mages and those who seek the dragon's secrets want to hear your tale and study your affliction."}},
  "Iron Route Bandit": {skills:["Animal Handling","Stealth"], blurb:"Grants Animal Handling and Stealth, plus one gaming set and land vehicles. You robbed travelers on the Iron Route and now steal mounts for the underworld.",
    feature:{name:"Black-Market Breeder", text:"You know how to find people who are always looking for stolen animals and vehicles, whether for animal pit fights or to give desperate rogues a faster getaway. This contact tells you which animals and vehicles are in high demand in the area, and offers favors and information (DM's choice) if you bring such animals and vehicles to them."}},
  "Phlan Insurgent": {skills:["Stealth","Survival"], blurb:"Grants Stealth and Survival, plus one type of artisan's tools and land vehicles. You escaped the dragon's capture and stayed to fight a guerrilla war for Phlan.",
    feature:{name:"Guerilla", text:"You've come to know the surrounding forests, streams, caves and other natural features in which you can take refuge or set up ambushes. You can quickly survey your environment for advantageous features. Additionally, you can scavenge your natural surroundings to cobble together simple supplies (such as improvised torches, rope or patches of fabric) that are consumed after use."}},
  "Stojanow Prisoner": {skills:["Deception","Perception"], blurb:"Grants Deception and Perception, plus one gaming set and thieves' tools. You sold secrets in occupied Phlan until the dragon's soldiers locked you in the cells of Stojanow Gate.",
    feature:{name:"Ex-Convict", text:"The knowledge gained during your incarceration lets you gain insight into local guards and jailors. You know which will accept bribes, or look the other way for you. You can also seek shelter for yourself from authorities with other criminals in the area."}},
  "Ticklebelly Nomad": {skills:["Animal Handling","Nature"], blurb:"Grants Animal Handling and Nature, an herbalism kit and Giant. You were born to a nomadic tribe of the Ticklebelly Hills that knows the stone giants of the Giant's Cairn.",
    feature:{name:"At Home in the Wild", text:"You can find a place to hide, rest or recuperate when out in the wild. This place of rest is secure enough to conceal you from most natural threats. Supernatural or magical threats, or those actively seeking you, might find you with difficulty (as the DM decides). It doesn't shield or conceal you from scrying, mental probing, or threats that don't need the five senses to find you."}},

  /* ---- Adventurers League: Mulmaster Bonds and Backgrounds ---- */
  "Caravan Specialist": {skills:["Animal Handling","Survival"], blurb:"Grants Animal Handling and Survival, plus land vehicles and one language. You have traveled every major tradeway of the Moonsea, and know its inns, shortcuts and ambush spots.",
    feature:{name:"Wagonmaster", text:"Others look to you for direction when a situation gets serious. You are able to identify the most defensible locations for camping. If you are part of a caravan outfit, you are able to attract two additional workers who are loyal to you based on your reputation. You have an excellent memory for maps and geography and can always determine your cardinal directions while traveling."}},
  "Earthspur Miner": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival, plus Dwarvish and Undercommon. A down-on-your-luck miner from the Earthspur Mountains, as comfortable underground as above.",
    feature:{name:"Deep Miner", text:"You never get lost in caves or mines if you have either seen an accurate map of them or have been through them before. Furthermore, you are able to scrounge fresh water and food for yourself and as many as five other people each day if you are in a mine or natural caves."}},
  "Harborfolk": {skills:["Athletics","Sleight of Hand"], blurb:"Grants Athletics and Sleight of Hand, plus one gaming set and water vehicles. You fished Mulmaster's harbor and still count its dockworkers as friends.",
    feature:{name:"Harborfolk", text:"The harborfolk of Mulmaster remember you and still treat you as one of them. They welcome you and your companions. While they might charge you for it, they'll always offer what food and shelter they have. They'll even hide you if the City Watch is after you (but not if the Hawks are)."}},
  "Mulmaster Aristocrat": {skills:["Deception","Performance"], blurb:"Grants Deception and Performance, plus one type of artistic artisan's tools and one musical instrument. You are one of the elite of Mulmaster, the City of Danger.",
    feature:{name:"Highborn", text:"Every other class of citizen in Mulmaster defers to you, and even the priesthood, Soldiery, Hawks and Cloaks treat you with deference. Other aristocrats and nobles accept you in their circles and likely know you or of you. Your connections can get you the ear of a Zor or Zora under the right circumstances."}},
  "Phlan Refugee": {skills:["Athletics","Insight"], blurb:"Grants Athletics and Insight, plus one type of artisan's tools and one language. You escaped Phlan's fall with more than the shirt on your back and fled to Mulmaster.",
    feature:{name:"Phlan Survivor", text:"You are one of the many refugees who have come to Mulmaster. You are able to find refuge with others from Phlan and those who sympathize with your plight. Within Mulmaster this means that you can find a place to bed down, recover, and hide from the watch with either other refugees from Phlan, or the Zhents within the ghettos."}},

  /* ---- Adventurers League: State of Hillsfar ---- */
  "Cormanthor Refugee": {skills:["Nature","Survival"], blurb:"Grants Nature and Survival, plus Elvish and one type of artisan's tools. You shelter in the hidden refugee camps of the Cormanthor Forest, guests of the elves.",
    feature:{name:"Shelter of the Elven Clergy", text:"The clerics of Elventree have vowed to care for the Cormanthor refugees. They will help you when they can, including providing you and your companions with free healing and care at temples, shrines, and other established presences in Elventree. They will also provide you (but only you) with a poor lifestyle."}},
  "Gate Urchin": {skills:["Deception","Sleight of Hand"], blurb:"Grants Deception and Sleight of Hand, plus thieves' tools and one musical instrument. You grew up begging and busking in the shadow of the Hillsfar Gate.",
    feature:{name:"Red Plume and Mage Guild Contacts", text:"You made friends among the Red Plumes and the Mage's Guild when you lived at the Hillsfar Gate, and they help you in little ways when they can. You can invoke their assistance in and around Hillsfar to obtain food, as well as simple equipment for temporary use, and to gain access to the low-security areas of their garrisons, halls and encampments."}},
  "Hillsfar Merchant": {skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion, plus land and water vehicles. You come from a merchant family of Hillsfar, the City of Trade.",
    feature:{name:"Factor", text:"Your family has assigned you a loyal retainer from the business: a factor, husbanding agent, seafarer, caravan guard or clerk. This commoner can perform mundane tasks for you such as making purchases, delivering messages and running errands. They will not fight for you, will not follow you into obviously dangerous areas (such as dungeons), and will leave if frequently endangered or abused. If they are killed, the family assigns you another within a few days."}},
  "Hillsfar Smuggler": {skills:["Perception","Stealth"], blurb:"Grants Perception and Stealth, plus a forgery kit and one racial language. You moved illicit goods and non-humans past the Red Plumes of Hillsfar.",
    feature:{name:"Secret Passage", text:"You can call on your contacts within the smuggling community to secure secret passage into or out of Hillsfar for yourself and your companions, no questions asked, and no Red Plume entanglements. Because you're calling in a favor, you can't be certain they will help on your timetable or at all. The DM decides. In return, you and your companions may owe the Rogues' Guild a favor or have to pay bribes."}},
  "Secret Identity": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth, plus a disguise kit and forgery kit. You are a non-human living in Hillsfar in secret, despite its Great Law of Humanity.",
    feature:{name:"Secret Identity", text:"You have created a secret identity that you use to conceal your true race and that offers a covering explanation for your presence in Hillsfar. In addition, you can forge documents, including official papers and personal letters, as long as you have seen an example of the kind of document or the handwriting you are trying to copy."}},
  "Shade Fanatic": {skills:["Deception","Intimidation"], blurb:"Grants Deception and Intimidation, plus a forgery kit and Netherese. You stay loyal to Netheril and seek other Shade loyalists around Hillsfar.",
    feature:{name:"Secret Society", text:"You have a special way of communicating with others who feel the same way you do about the Shade. When you enter a village or larger city you can identify contacts who will give you information on those that would hinder your goals and those that would help you, simply because of your desire to see the Shade Enclave return in all its glory."}},
  "Trade Sheriff": {skills:["Investigation","Persuasion"], blurb:"Grants Investigation and Persuasion, plus thieves' tools and Elvish. You keep Hillsfar's trade routes clear of bandits and enforce the Great Law of Trade.",
    feature:{name:"Investigative Services", text:"You can invoke your rank to allow you access to a crime scene or to requisition equipment or horses on a temporary basis. When you enter a town or village around Hillsfar you can identify a contact who will give you information on the local rumors and would help you simply because of your desire to get answers and information for anyone wanting to disrupt trade."}}
};

/* Tool (and vehicle) proficiencies each background grants, for the
   Compendium. "Choose" entries are picked by the player. */
/* A background's features: most have one, a Whitestone Rifle Corps
   member two (`feature2`). */
export function backgroundFeatures(info){
  return info ? [info.feature, info.feature2].filter(function(f){ return f && f.name; }) : [];
}

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
  "Azorius Functionary":"None", "Boros Legionnaire":"One gaming set", "Dimir Operative":"Disguise kit",
  "Golgari Agent":"Poisoner's kit", "Gruul Anarch":"Herbalism kit", "Izzet Engineer":"One type of artisan's tools",
  "Orzhov Representative":"None", "Rakdos Cultist":"One musical instrument", "Selesnya Initiate":"One type of artisan's tools or one musical instrument",
  "Simic Scientist":"None",

  /* ---- Ghosts of Saltmarsh ---- */
  "Fisher":"None", "Marine":"Vehicles (land and water)", "Shipwright":"Carpenter's tools, vehicles (water)",
  "Smuggler":"Vehicles (water)",

  /* ---- Acquisitions Incorporated ---- */
  "Celebrity Adventurer's Scion":"Disguise kit",
  "Failed Merchant":"One type of artisan's tools", "Gambler":"One gaming set",
  "Plaintiff":"One type of artisan's tools", "Rival Intern":"One type of artisan's tools",

  /* ---- Eberron: Rising from the Last War ---- */
  "House Agent":"Two set by your house (Cannith: alchemist's supplies and tinker's tools, Deneith: a gaming set and land vehicles, and so on)",

  /* ---- Mythic Odysseys of Theros ---- */
  "Athlete":"Vehicles (land)",

  /* ---- Strixhaven: Curriculum of Chaos ---- */
  "Lorehold Student":"None", "Prismari Student":"One musical instrument or artisan's tools",
  "Quandrix Student":"One type of artisan's tools", "Silverquill Student":"None",
  "Witherbloom Student":"Herbalism kit",

  /* ---- The Wild Beyond the Witchlight ---- */
  "Feylost":"One musical instrument", "Witchlight Hand":"Disguise kit or one musical instrument",

  /* ---- Spelljammer: Adventures in Space ---- */
  "Astral Drifter":"None", "Wildspacer":"Navigator's tools, vehicles (space)",

  /* ---- Dragonlance: Shadow of the Dragon Queen ---- */
  "Knight of Solamnia":"None", "Mage of High Sorcery":"None",

  /* ---- Planescape: Adventures in the Multiverse ---- */
  "Gate Warden":"None", "Planar Philosopher":"None",

  /* ---- Glory of the Giants ---- */
  "Giant Foundling":"None", "Rune Carver":"One type of artisan's tools",

  /* ---- Curse of Strahd / Van Richten's Guide to Ravenloft ---- */
  "Haunted One":"None",

  /* ---- Added 2026-10-17 ---- */
  "Gladiator":"Disguise kit, one musical instrument", "Knight":"One gaming set", "Spy":"One gaming set, thieves' tools",
  "Ashari":"Herbalism kit", "Clasp Member":"One of disguise kit, forgery kit or thieves' tools", "Lyceum Scholar":"None",
  "Reformed Cultist":"None", "Whitestone Rifle Corps":"None",
  "Grinner":"One musical instrument, thieves' tools", "Volstrucker Agent":"Poisoner's kit",
  "Initiate":"One gaming set, land vehicles", "Vizier":"One type of artisan's tools, one musical instrument",
  "Inquisitor":"Thieves' tools, one type of artisan's tools", "Investigator (Ravenloft)":"Disguise kit, thieves' tools",
  "Faceless":"Disguise kit", "Rewarded":"One gaming set", "Ruined":"One gaming set",
  "Black Fist Double Agent":"Disguise kit, and one type of artisan's tools or gaming set",
  "Dragon Casualty":"One set by your former occupation: water or land vehicles, artisan's tools, a gaming set, a musical instrument, herbalism kit, thieves' tools, forgery kit or disguise kit",
  "Iron Route Bandit":"One gaming set, land vehicles", "Phlan Insurgent":"One type of artisan's tools, land vehicles",
  "Stojanow Prisoner":"One gaming set, thieves' tools", "Ticklebelly Nomad":"Herbalism kit",
  "Caravan Specialist":"Land vehicles", "Earthspur Miner":"None", "Harborfolk":"One gaming set, water vehicles",
  "Mulmaster Aristocrat":"One type of artistic artisan's tools, one musical instrument", "Phlan Refugee":"One type of artisan's tools",
  "Cormanthor Refugee":"One type of artisan's tools", "Gate Urchin":"Thieves' tools, one musical instrument",
  "Hillsfar Merchant":"Land and water vehicles", "Hillsfar Smuggler":"Forgery kit", "Secret Identity":"Disguise kit, forgery kit",
  "Shade Fanatic":"Forgery kit", "Trade Sheriff":"Thieves' tools"
};
/* Some backgrounds let the player pick skills: `skillChoice` describes it
   (Compendium) and `skillPick` {count, options} is what the creation
   wizard's Skills step offers on top of the fixed `skills`.
   `exoticLanguages`: how many of the background's languages must be
   exotic ones (Haunted One: one of its two). `feature`: {name, text}, the
   background feature shown on the Features tab and in the Compendium.
   `feat`: {name, option}: a feat the background gives (Wildspacer: Tough),
   with the choice the book makes for it when it makes one (a Lorehold
   Student's Strixhaven Initiate is Lorehold's; an Astral Drifter's Magic
   Initiate is the cleric's). Or {choices}: the feats the player picks one
   from (a Rewarded's Lucky, Magic Initiate or Skilled). The creation wizard grants it; an older
   sheet is offered it on the Features tab. */
export var BACKGROUND_INFO_FALLBACK = "Grants two skill proficiencies of your choice (and usually a tool or language). Pick whatever fits your character's story. You can add them on the sheet's Skills tab afterward.";

/* Languages of your choice each background grants (0 when it gives a
   tool instead). Drives the Languages step of the creation wizard.
   Languages it names (Giant) and short lists to pick from are in
   BACKGROUND_LANGUAGE_RULES. Checked against the published pages on
   2026-10-15 (see .claude/research/races-backgrounds.md). */
export var BACKGROUND_LANGUAGES = {
  "Acolyte":2, "Charlatan":0, "Criminal":0, "Entertainer":0, "Folk Hero":0,
  "Guild Artisan":1, "Guild Merchant":1, "Hermit":1, "Noble":1, "Outlander":1,
  "Sage":2, "Sailor":0, "Soldier":0, "Urchin":0, "Anthropologist":2,
  "Archaeologist":1, "City Watch":2, "Clan Crafter":0, "Cloistered Scholar":2,
  "Courtier":2, "Faction Agent":2, "Far Traveler":1, "Inheritor":1,
  "Knight of the Order":1, "Mercenary Veteran":0, "Urban Bounty Hunter":0,
  "Uthgardt Tribe Member":1, "Waterdhavian Noble":1,

  /* ---- Sword Coast Adventurer's Guide ---- */
  "Investigator":2, "Pirate":0,

  /* ---- Guildmasters' Guide to Ravnica ---- */
  "Azorius Functionary":2, "Boros Legionnaire":1, "Dimir Operative":1,
  "Golgari Agent":1, "Gruul Anarch":1, "Izzet Engineer":1,
  "Orzhov Representative":2, "Rakdos Cultist":1, "Selesnya Initiate":1,
  "Simic Scientist":2,

  /* ---- Ghosts of Saltmarsh ---- */
  "Fisher":1, "Marine":0, "Shipwright":0, "Smuggler":0,

  /* ---- Acquisitions Incorporated ---- */
  "Celebrity Adventurer's Scion":2, "Failed Merchant":1, "Gambler":1,
  "Plaintiff":1, "Rival Intern":1,

  /* ---- Eberron: Rising from the Last War ---- */
  "House Agent":0,

  /* ---- Mythic Odysseys of Theros ---- */
  "Athlete":1,

  /* ---- Strixhaven: Curriculum of Chaos ---- */
  "Lorehold Student":2, "Prismari Student":1, "Quandrix Student":1,
  "Silverquill Student":2, "Witherbloom Student":1,

  /* ---- The Wild Beyond the Witchlight ---- */
  "Feylost":1, "Witchlight Hand":1,

  /* ---- Spelljammer: Adventures in Space ---- */
  "Astral Drifter":2, "Wildspacer":0,

  /* ---- Dragonlance: Shadow of the Dragon Queen ---- */
  "Knight of Solamnia":2, "Mage of High Sorcery":2,

  /* ---- Planescape: Adventures in the Multiverse ---- */
  "Gate Warden":2, "Planar Philosopher":2,

  /* ---- Glory of the Giants ---- */
  "Giant Foundling":1, "Rune Carver":0,

  /* ---- Curse of Strahd / Van Richten's Guide to Ravenloft ---- */
  "Haunted One":2,

  /* ---- Added 2026-10-17 (named languages are in BACKGROUND_LANGUAGE_RULES) ---- */
  "Gladiator":0, "Knight":1, "Spy":0, "Ashari":0, "Clasp Member":0, "Lyceum Scholar":2, "Reformed Cultist":1,
  "Whitestone Rifle Corps":1, "Grinner":0, "Volstrucker Agent":1,
  "Initiate":0, "Vizier":0, "Inquisitor":0, "Investigator (Ravenloft)":0, "Faceless":1,
  "Rewarded":1, "Ruined":1, "Black Fist Double Agent":0, "Dragon Casualty":0, "Iron Route Bandit":0,
  "Phlan Insurgent":0, "Stojanow Prisoner":0, "Ticklebelly Nomad":0, "Caravan Specialist":1,
  "Earthspur Miner":0, "Harborfolk":0, "Mulmaster Aristocrat":0, "Phlan Refugee":1,
  "Cormanthor Refugee":0, "Gate Urchin":0, "Hillsfar Merchant":0, "Hillsfar Smuggler":1,
  "Secret Identity":0, "Shade Fanatic":0, "Trade Sheriff":0
};

/* ---------------- Tool proficiencies, for the sheet ----------------
   What each background gives, in the shape class features and race
   traits use (js/core/class-picks.js): `tools` given outright and `pick`
   slots for the choices. A tool slot names a TOOL_GROUPS `group` ("one
   type of gaming set"), `options` or `kinds`: one pick of each kind it
   lists, a kind being a group or a single tool ("one musical instrument
   or artisan's tools"; Urban Bounty Hunter's two of three). The creation
   wizard asks for the picks on its Skills step; older sheets on the
   Features tab's Feature choices card. Checked against the published
   pages on 2026-10-15 (.claude/research/races-backgrounds.md).
   House Agent: the house (a `choice`) sets two tools, from the House
   Tool Proficiencies table (`toolsByChoice`), and a few houses' "one
   gaming set" or "one musical instrument" is picked (`byChoice`). */
var GAMING = {kind:"tool", group:"Gaming sets", noun:"gaming set"};
var INSTRUMENT = {kind:"tool", group:"Musical instruments", noun:"musical instrument"};
var ARTISAN = {kind:"tool", group:"Artisan's tools"};
function either(kinds){ return {kind:"tool", kinds:kinds}; }
var HOUSE_TOOLS = {
  "Cannith":["Alchemist's supplies","Tinker's tools"], "Deneith":["Vehicles (land)"],
  "Ghallanda":["Brewer's supplies","Cook's utensils"], "Jorasco":["Alchemist's supplies","Herbalism kit"],
  "Kundarak":["Thieves' tools","Tinker's tools"], "Lyrandar":["Navigator's tools","Vehicles (air)","Vehicles (water)"],
  "Medani":["Disguise kit","Thieves' tools"], "Orien":["Vehicles (land)"], "Phiarlan":["Disguise kit"],
  "Sivis":["Calligrapher's supplies","Forgery kit"], "Tharashk":["Thieves' tools"], "Thuranni":["Poisoner's kit"],
  "Vadalis":["Herbalism kit","Vehicles (land)"]
};
var HOUSE_PICKS = {"Deneith":"Gaming sets", "Orien":"Gaming sets", "Phiarlan":"Musical instruments", "Tharashk":"Gaming sets", "Thuranni":"Musical instruments"};
var HOUSE_DETAILS = {
  "Cannith":"Alchemist's supplies and tinker's tools", "Deneith":"One gaming set and land vehicles",
  "Ghallanda":"Brewer's supplies and cook's utensils", "Jorasco":"Alchemist's supplies and herbalism kit",
  "Kundarak":"Thieves' tools and tinker's tools", "Lyrandar":"Navigator's tools and vehicles (air and sea)",
  "Medani":"Disguise kit and thieves' tools", "Orien":"One gaming set and land vehicles",
  "Phiarlan":"Disguise kit and one musical instrument", "Sivis":"Calligrapher's supplies and forgery kit",
  "Tharashk":"One gaming set and thieves' tools", "Thuranni":"One musical instrument and poisoner's kit",
  "Vadalis":"Herbalism kit and land vehicles"
};
export var BACKGROUND_PROFS = {
  "Charlatan": {tools:["Disguise kit","Forgery kit"]},
  "Criminal": {tools:["Thieves' tools"], pick:[GAMING]},
  "Entertainer": {tools:["Disguise kit"], pick:[INSTRUMENT]},
  "Folk Hero": {tools:["Vehicles (land)"], pick:[ARTISAN]},
  "Guild Artisan": {pick:[ARTISAN]},
  // In place of the artisan's tools: navigator's tools or one more language.
  "Guild Merchant": {pick:[{kind:"toolOrLanguage", options:["Navigator's tools"]}]},
  "Hermit": {tools:["Herbalism kit"]},
  "Noble": {pick:[GAMING]},
  "Outlander": {pick:[INSTRUMENT]},
  "Sailor": {tools:["Navigator's tools","Vehicles (water)"]},
  "Soldier": {tools:["Vehicles (land)"], pick:[GAMING]},
  "Urchin": {tools:["Disguise kit","Thieves' tools"]},
  "Archaeologist": {pick:[{kind:"tool", options:["Cartographer's tools","Navigator's tools"]}]},
  "Clan Crafter": {pick:[ARTISAN]},
  "Far Traveler": {pick:[either(["Musical instruments","Gaming sets"])]},
  "Inheritor": {pick:[either(["Gaming sets","Musical instruments"])]},
  "Knight of the Order": {pick:[either(["Gaming sets","Musical instruments"])]},
  "Mercenary Veteran": {tools:["Vehicles (land)"], pick:[GAMING]},
  "Urban Bounty Hunter": {pick:[{kind:"tool", count:2, kinds:["Gaming sets","Musical instruments","Thieves' tools"]}]},
  "Uthgardt Tribe Member": {pick:[either(["Musical instruments","Artisan's tools"])]},
  "Waterdhavian Noble": {pick:[either(["Gaming sets","Musical instruments"])]},
  "Pirate": {tools:["Navigator's tools","Vehicles (water)"]},
  "Boros Legionnaire": {pick:[GAMING]},
  "Dimir Operative": {tools:["Disguise kit"]},
  "Golgari Agent": {tools:["Poisoner's kit"]},
  "Gruul Anarch": {tools:["Herbalism kit"]},
  "Izzet Engineer": {pick:[ARTISAN]},
  "Rakdos Cultist": {pick:[INSTRUMENT]},
  "Selesnya Initiate": {pick:[either(["Artisan's tools","Musical instruments"])]},
  "Marine": {tools:["Vehicles (land)","Vehicles (water)"]},
  "Shipwright": {tools:["Carpenter's tools","Vehicles (water)"]},
  "Smuggler": {tools:["Vehicles (water)"]},
  "Celebrity Adventurer's Scion": {tools:["Disguise kit"]},
  "Failed Merchant": {pick:[ARTISAN]},
  "Gambler": {pick:[GAMING]},
  "Plaintiff": {pick:[ARTISAN]},
  "Rival Intern": {pick:[ARTISAN]},
  "House Agent": {toolsByChoice:{slot:0, tools:HOUSE_TOOLS}, pick:[
    {kind:"choice", id:"house", noun:"house", label:"Choose your dragonmarked house", options:Object.keys(HOUSE_TOOLS), details:HOUSE_DETAILS},
    {kind:"tool", byChoice:{slot:0, groups:HOUSE_PICKS}}]},
  "Athlete": {tools:["Vehicles (land)"]},
  "Prismari Student": {pick:[either(["Musical instruments","Artisan's tools"])]},
  "Quandrix Student": {pick:[ARTISAN]},
  "Witherbloom Student": {tools:["Herbalism kit"]},
  "Feylost": {pick:[INSTRUMENT]},
  "Witchlight Hand": {pick:[either(["Disguise kit","Musical instruments"])]},
  "Wildspacer": {tools:["Navigator's tools","Vehicles (space)"]},
  "Rune Carver": {pick:[ARTISAN]},
  "Gladiator": {tools:["Disguise kit"], pick:[INSTRUMENT]},
  "Knight": {pick:[GAMING]},
  "Spy": {tools:["Thieves' tools"], pick:[GAMING]},
  "Ashari": {tools:["Herbalism kit"]},
  "Clasp Member": {pick:[{kind:"tool", options:["Disguise kit","Forgery kit","Thieves' tools"]}]},
  "Grinner": {tools:["Thieves' tools"], pick:[INSTRUMENT]},
  "Volstrucker Agent": {tools:["Poisoner's kit"]},
  "Initiate": {tools:["Vehicles (land)"], pick:[GAMING]},
  "Vizier": {pick:[ARTISAN, INSTRUMENT]},
  "Inquisitor": {tools:["Thieves' tools"], pick:[ARTISAN]},
  "Investigator (Ravenloft)": {tools:["Disguise kit","Thieves' tools"]},
  "Faceless": {tools:["Disguise kit"]},
  "Rewarded": {pick:[GAMING]},
  "Ruined": {pick:[GAMING]},
  "Black Fist Double Agent": {tools:["Disguise kit"], pick:[either(["Artisan's tools","Gaming sets"])]},
  // The tool its Origin table gives the former occupation, any of them.
  "Dragon Casualty": {pick:[either(["Vehicles (water)","Artisan's tools","Gaming sets","Vehicles (land)","Musical instruments","Herbalism kit","Thieves' tools","Forgery kit","Disguise kit"])]},
  "Iron Route Bandit": {tools:["Vehicles (land)"], pick:[GAMING]},
  "Phlan Insurgent": {tools:["Vehicles (land)"], pick:[ARTISAN]},
  "Stojanow Prisoner": {tools:["Thieves' tools"], pick:[GAMING]},
  "Ticklebelly Nomad": {tools:["Herbalism kit"]},
  "Caravan Specialist": {tools:["Vehicles (land)"]},
  "Harborfolk": {tools:["Vehicles (water)"], pick:[GAMING]},
  "Mulmaster Aristocrat": {pick:[ARTISAN, INSTRUMENT]},
  "Phlan Refugee": {pick:[ARTISAN]},
  "Cormanthor Refugee": {pick:[ARTISAN]},
  "Gate Urchin": {tools:["Thieves' tools"], pick:[INSTRUMENT]},
  "Hillsfar Merchant": {tools:["Vehicles (land)","Vehicles (water)"]},
  "Hillsfar Smuggler": {tools:["Forgery kit"]},
  "Secret Identity": {tools:["Disguise kit","Forgery kit"]},
  "Shade Fanatic": {tools:["Forgery kit"]},
  "Trade Sheriff": {tools:["Thieves' tools"]}
};

/* Languages a background names (`fixed`: a Rune Carver's Giant; one
   already known becomes a free pick instead) and short lists its free
   picks come from (`options`: a Boros Legionnaire's Celestial, Draconic,
   Goblin or Minotaur). The counts are in BACKGROUND_LANGUAGES. */
export var BACKGROUND_LANGUAGE_RULES = {
  "Clan Crafter": {fixed:["Dwarvish"]},
  "Rune Carver": {fixed:["Giant"]},
  "Giant Foundling": {fixed:["Giant"]},
  "Feylost": {options:["Elvish","Gnomish","Goblin","Sylvan"]},
  "Boros Legionnaire": {options:["Celestial","Draconic","Goblin","Minotaur"]},
  "Golgari Agent": {options:["Elvish","Giant","Kraul"]},
  "Gruul Anarch": {options:["Draconic","Giant","Goblin","Sylvan"]},
  "Izzet Engineer": {options:["Draconic","Goblin","Vedalken"]},
  "Rakdos Cultist": {options:["Abyssal","Giant"]},
  "Selesnya Initiate": {options:["Elvish","Loxodon","Sylvan"]},
  "Ashari": {fixed:["Primordial"]},
  "Clasp Member": {fixed:["Thieves' Cant"]},
  "Dragon Casualty": {fixed:["Draconic"]},
  "Ticklebelly Nomad": {fixed:["Giant"]},
  "Earthspur Miner": {fixed:["Dwarvish","Undercommon"]},
  "Cormanthor Refugee": {fixed:["Elvish"]},
  "Shade Fanatic": {fixed:["Netherese"]},
  "Trade Sheriff": {fixed:["Elvish"]},
  // "One racial language".
  "Hillsfar Smuggler": {options:["Dwarvish","Elvish","Giant","Gnomish","Goblin","Halfling","Orc"]}
};

/* Weapons a background gives. */
export var BACKGROUND_WEAPONS = {
  "Whitestone Rifle Corps": ["Firearms"]
};

/* Skills this app's data had wrong before 2026-10-15 (checked then
   against the published pages): `was` what older sheets got, `now` what
   the book gives. An older character with the background is offered the
   swap on the Features tab's Feature choices card; nothing changes until
   the player says so. */
export var BACKGROUND_SKILL_FIXES = {
  "Lorehold Student": {was:["Arcana"], now:["Religion"]},
  "Prismari Student": {was:["Arcana"], now:["Acrobatics"]},
  "Silverquill Student": {was:["History"], now:["Intimidation"]},
  "Witherbloom Student": {was:["Medicine"], now:["Nature"]},
  "Golgari Agent": {was:["Athletics"], now:["Survival"]},
  "Orzhov Representative": {was:["Insight"], now:["Intimidation"]},
  "Knight of Solamnia": {was:["Persuasion"], now:["Survival"]}
};
