/* ---------------- Background starting equipment ----------------
   What each background puts in a new character's pack and purse. Every
   line was checked against the published page on 2026-10-19/20 (the
   Player's Handbook and The Wild Beyond the Witchlight in the books, the
   rest on wikidot); see .claude/research/background-equipment.md.

   BACKGROUND_EQUIPMENT[background] = {items, coins, note}. An item is:
     "Crowbar"                a gear catalog item (js/data/gear.js)
     {gear, name, notes, qty} a catalog item under the background's own
                              wording ("Bottle of black ink")
     {name, notes, qty}       an item of the background's own (a letter, a
                              trophy): no price or weight in the books
     {weapon, name}           a weapon from js/data/weapons.js, ready to
                              attack with (a sailor's belaying pin is a club)
     {pick, options}          the player chooses one; an option is any of
                              these, or a list of them (a mule and a cart)
     {group, label}           any one of a gear group ("Artisan's tools"),
                              or of several; it starts on the tool the
                              background's proficiency pick chose
     {trinket, label, count}  rolled (or chosen) on a table in
                              js/data/trinkets.js
     {none}                   a pick's option with nothing to carry
   coins: {gp, sp, pp}. Variants share their base background's kit
   (BACKGROUND_EQUIPMENT_SAME_AS). */

function g(gear, name, extra){ var o = {gear: gear}; if(name) o.name = name; return Object.assign(o, extra || {}); }
function n(name, notes, extra){ var o = {name: name}; if(notes) o.notes = notes; return Object.assign(o, extra || {}); }
function w(weapon, name){ return name ? {weapon: weapon, name: name} : {weapon: weapon}; }
function pick(label, options){ return {pick: label, options: options}; }
function group(label, groups){ return {group: groups, label: label}; }
function trinket(table, label, count){ return {trinket: table, label: label, count: count || 1}; }
var ARTISAN = "Artisan's tools", INSTRUMENT = "Musical instruments", GAMING = "Gaming sets";
var HOLY = pick("Holy symbol", [g("Holy Symbol (amulet)"), g("Holy Symbol (emblem)"), g("Holy Symbol (reliquary)")]);
var COMMON = "Clothes, Common", FINE = "Clothes, Fine", TRAVELER = "Clothes, Traveler's", COSTUME = "Clothes, Costume";
var INK = g("Ink (1 ounce bottle)", "Bottle of black ink");
var UNIFORM = n("School uniform");

export var BACKGROUND_EQUIPMENT = {
  /* Player's Handbook */
  "Acolyte": {coins: {gp: 15}, items: [
    pick("Holy symbol (a gift when you entered the priesthood)", [g("Holy Symbol (amulet)"), g("Holy Symbol (emblem)"), g("Holy Symbol (reliquary)")]),
    pick("Prayer book or prayer wheel", [n("Prayer book"), n("Prayer wheel")]),
    n("Stick of incense", "", {qty: 5}), n("Vestments"), COMMON]},
  "Charlatan": {coins: {gp: 15}, items: [FINE, "Disguise Kit",
    pick("Tools of the con", [n("Ten stoppered bottles filled with colored liquid"), n("Set of weighted dice"), n("Deck of marked cards"), n("Signet ring of an imaginary duke")])]},
  "Criminal": {coins: {gp: 15}, items: ["Crowbar", g(COMMON, "Dark common clothes with a hood")]},
  "Entertainer": {coins: {gp: 15}, items: [group("Musical instrument", [INSTRUMENT]),
    pick("Favor of an admirer", [n("Love letter from an admirer"), n("Lock of hair from an admirer"), trinket("phb", "Trinket from an admirer")]), COSTUME]},
  "Folk Hero": {coins: {gp: 10}, items: [group("Artisan's tools", [ARTISAN]), "Shovel", "Pot, Iron", COMMON]},
  "Guild Artisan": {coins: {gp: 15}, items: [group("Artisan's tools", [ARTISAN]), n("Letter of introduction from your guild"), TRAVELER]},
  "Hermit": {coins: {gp: 5}, items: [g("Case, Map or Scroll", "Scroll case stuffed full of notes from your studies or prayers"), g("Blanket", "Winter blanket"), COMMON, "Herbalism Kit"]},
  "Noble": {coins: {gp: 25}, items: [FINE, "Signet Ring", n("Scroll of pedigree")]},
  "Outlander": {coins: {gp: 10}, items: [w("Quarterstaff", "Staff"), "Hunting Trap", n("Trophy from an animal you killed"), TRAVELER]},
  "Sage": {coins: {gp: 10}, items: [INK, n("Quill"), n("Small knife"), n("Letter from a dead colleague", "It poses a question you have not yet been able to answer."), COMMON]},
  "Sailor": {coins: {gp: 10}, items: [w("Club", "Belaying pin"), "Rope, Silk (50 feet)",
    pick("Lucky charm", [n("Lucky charm (a rabbit foot)"), n("Lucky charm (a small stone with a hole in the center)"), trinket("phb", "Trinket (your lucky charm)")]), COMMON]},
  "Soldier": {coins: {gp: 10}, items: [n("Insignia of rank"),
    pick("Trophy taken from a fallen enemy", [w("Dagger", "Dagger (a trophy from a fallen enemy)"), n("Broken blade (a trophy from a fallen enemy)"), n("Piece of a banner (a trophy from a fallen enemy)")]),
    pick("Bone dice or a deck of cards", [g("Dice Set", "Bone dice"), g("Playing Card Set", "Deck of cards")]), COMMON]},
  "Urchin": {coins: {gp: 10}, items: [n("Small knife"), n("Map of the city you grew up in"), n("Pet mouse"), n("Token to remember your parents by"), COMMON]},
  // Variants that change the kit.
  "Guild Merchant": {coins: {gp: 15}, items: [
    pick("Artisan's tools, or a mule and a cart", [group("Artisan's tools", [ARTISAN]), [n("Mule"), n("Cart")]]),
    n("Letter of introduction from your guild"), TRAVELER]},
  "Gladiator": {coins: {gp: 15}, items: [
    pick("Musical instrument, or an inexpensive but unusual weapon", [group("Musical instrument", [INSTRUMENT]), w("Trident"), w("Net")]),
    pick("Favor of an admirer", [n("Love letter from an admirer"), n("Lock of hair from an admirer"), trinket("phb", "Trinket from an admirer")]), COSTUME]},

  /* Sword Coast Adventurer's Guide */
  "City Watch": {coins: {gp: 10}, items: [n("Uniform of your unit, showing your rank"), g("Horn", "Horn to summon help"), "Manacles"]},
  "Clan Crafter": {coins: {gp: 5}, items: [group("Artisan's tools", [ARTISAN]), n("Maker's mark chisel", "Marks your handiwork with the symbol of the clan of crafters you learned from."), TRAVELER, n("Gem worth 10 gp")]},
  "Cloistered Scholar": {coins: {gp: 10}, items: [g("Robes", "Scholar's robes of your cloister"),
    n("Writing kit", "A small pouch with a quill, a bottle of ink, folded parchment and a small penknife."), g("Book", "Borrowed book on the subject of your current study")]},
  "Courtier": {coins: {gp: 5}, items: [FINE]},
  "Faction Agent": {coins: {gp: 15}, items: [n("Badge or emblem of your faction"), n("Copy of a seminal faction text", "Or a code-book, for a covert faction."), COMMON]},
  "Far Traveler": {coins: {gp: 5}, items: [TRAVELER, group("Musical instrument or gaming set", [INSTRUMENT, GAMING]),
    n("Poorly wrought maps from your homeland", "They depict where you are in Faerûn."), n("Small piece of jewelry worth 10 gp", "In the style of your homeland's craftsmanship.")]},
  "Inheritor": {coins: {gp: 15}, items: [n("Your inheritance", "Choose it with your DM, or roll on the Inheritor's Inheritance table."), TRAVELER,
    group("Gaming set or musical instrument", [GAMING, INSTRUMENT])]},
  "Knight of the Order": {coins: {gp: 10}, items: [TRAVELER,
    pick("Signet, banner or seal of your place or rank in the order", [n("Signet of your order"), n("Banner of your order"), n("Seal of your order")])]},
  "Mercenary Veteran": {coins: {gp: 10}, items: [g(TRAVELER, "Uniform of your company"), n("Insignia of your rank"), group("Gaming set", [GAMING])]},
  "Urban Bounty Hunter": {coins: {gp: 20}, items: [n("Clothes appropriate to your duties")]},
  "Uthgardt Tribe Member": {coins: {gp: 10}, items: ["Hunting Trap",
    pick("Totemic token or tattoos of your loyalty to Uthgar", [n("Totemic token of your tribal totem"), {none: "Tattoos (nothing to carry)"}]), TRAVELER]},
  "Waterdhavian Noble": {coins: {gp: 20}, items: [FINE, pick("Signet ring or brooch", ["Signet Ring", n("Brooch")]), n("Scroll of pedigree"), n("Skin of fine zzar or wine")]},

  /* Tomb of Annihilation */
  "Anthropologist": {coins: {gp: 10}, items: [n("Leather-bound diary"), g("Ink (1 ounce bottle)", "Bottle of ink"), "Ink Pen", TRAVELER, trinket("phb", "Trinket of special significance")]},
  "Archaeologist": {coins: {gp: 25}, items: [n("Wooden case with a map to a ruin or dungeon"), "Lantern, Bullseye", "Pick, Miner's", TRAVELER, "Shovel", "Tent, Two-person",
    trinket("phb", "Trinket recovered from a dig site")]},

  /* Guildmaster's Guide to Ravnica (paid in zinos: 1 zino is 1 gp) */
  "Azorius Functionary": {coins: {gp: 10}, items: [n("Azorius insignia"), n("Scroll with the text of a law important to you"), g("Ink (1 ounce bottle)", "Bottle of blue ink"), "Ink Pen", FINE]},
  "Boros Legionnaire": {coins: {gp: 2}, items: [n("Boros insignia"), n("Feather from an angel's wing"), n("Tattered piece of a Boros banner", "A souvenir from a famous battle."), COMMON]},
  "Dimir Operative": {coins: {}, secondaryGuild: true, items: [n("Dimir insignia"), n("Small knife", "", {qty: 3}), g(COMMON, "Dark-colored common clothes")]},
  "Golgari Agent": {coins: {gp: 10}, items: [n("Golgari insignia"), "Poisoner's Kit", pick("Pet beetle or spider", [n("Pet beetle"), n("Pet spider")]), COMMON]},
  "Gruul Anarch": {coins: {gp: 10}, items: [n("Gruul insignia"), "Hunting Trap", "Herbalism Kit", n("Skull of a boar"), n("Beast-hide cloak"), TRAVELER]},
  "Izzet Engineer": {coins: {gp: 5}, items: [n("Izzet insignia"), group("Artisan's tools", [ARTISAN]), n("Charred and twisted remains of a failed experiment"), "Hammer", "Block and Tackle", COMMON]},
  "Orzhov Representative": {coins: {pp: 1}, items: [n("Orzhov insignia"), n("Foot-long chain made of ten gold coins"), n("Vestments"), FINE]},
  "Rakdos Cultist": {coins: {gp: 10}, items: [n("Rakdos insignia"), group("Musical instrument", [INSTRUMENT]), COSTUME, g("Lantern, Hooded", "Hooded lantern of wrought iron"),
    g("Chain (10 feet)", "Chain with sharply spiked links (10 feet)"), "Tinderbox", g("Torch", "", {qty: 10}), COMMON, n("Bottle of sweet, red juice")]},
  "Selesnya Initiate": {coins: {gp: 5}, items: [n("Selesnya insignia"), "Healer's Kit", "Robes", COMMON]},
  "Simic Scientist": {coins: {gp: 10}, items: [n("Simic insignia"), COMMON, n("Book of research notes"), "Ink Pen", n("Bottle of squid ink"),
    g("Oil (flask)", "Flask of oil (made from blubber)"), g("Acid (vial)", "Vial of acid (from digestive juices)"), n("Vial of fish scales"), n("Vial of seaweed"),
    n("Vial of jellyfish stingers"), n("Glass bottle of unidentified slime")]},

  /* Ghosts of Saltmarsh */
  "Fisher": {coins: {gp: 10}, items: ["Fishing Tackle", w("Net"), pick("Favorite fishing lure or oiled leather wading boots", [n("Favorite fishing lure"), n("Oiled leather wading boots")]), TRAVELER]},
  "Marine": {coins: {gp: 10}, items: [w("Dagger", "Dagger of a fallen comrade"), n("Folded rag emblazoned with the symbol of your ship or company"), TRAVELER]},
  "Shipwright": {coins: {gp: 10}, items: [g("Carpenter's Tools", "Well-loved carpenter's tools"), g("Book", "Blank book"), "Ink (1 ounce bottle)", "Ink Pen", TRAVELER]},
  "Smuggler": {coins: {gp: 15}, items: [pick("Fancy leather vest or leather boots", [n("Fancy leather vest"), n("Pair of leather boots")]), COMMON]},

  /* Acquisitions Incorporated */
  "Celebrity Adventurer's Scion": {coins: {gp: 30}, items: ["Disguise Kit", FINE]},
  "Failed Merchant": {coins: {gp: 10}, items: [group("Artisan's tools", [ARTISAN]), "Scale, Merchant's", FINE]},
  "Gambler": {coins: {gp: 15}, items: [group("Gaming set", [GAMING]), n("Lucky charm"), FINE]},
  "Plaintiff": {coins: {gp: 20}, items: [group("Artisan's tools", [ARTISAN]), FINE]},
  "Rival Intern": {coins: {gp: 10}, items: [group("Artisan's tools", [ARTISAN]), n("Ledger from your previous employer", "It holds a small piece of useful information."), FINE]},

  /* Eberron, Theros, Strixhaven */
  "House Agent": {coins: {gp: 20}, items: [FINE, g("Signet Ring", "Signet ring of your house"), n("Identification papers")]},
  "Athlete": {coins: {gp: 10}, items: [pick("Bronze discus or leather ball", [n("Bronze discus"), n("Leather ball")]), pick("Lucky charm or past trophy", [n("Lucky charm"), n("Past trophy")]), TRAVELER]},
  "Lorehold Student": {coins: {gp: 15}, items: [INK, "Ink Pen", "Hammer", "Lantern, Hooded", "Tinderbox", g("Book", "Tome of history"), UNIFORM]},
  "Prismari Student": {coins: {gp: 10}, items: [INK, "Ink Pen", group("Artisan's tools or musical instrument", [ARTISAN, INSTRUMENT]), UNIFORM]},
  "Quandrix Student": {coins: {gp: 15}, items: [INK, "Ink Pen", "Abacus", g("Book", "Book of arcane theory"), UNIFORM]},
  "Silverquill Student": {coins: {gp: 15}, items: [INK, "Ink Pen", g("Book", "Book of poetry"), UNIFORM]},
  "Witherbloom Student": {coins: {gp: 15}, items: [INK, "Ink Pen", g("Book", "Book about plant identification"), "Pot, Iron", "Herbalism Kit", UNIFORM]},

  /* The Wild Beyond the Witchlight */
  "Feylost": {coins: {gp: 8}, items: [group("Musical instrument", [INSTRUMENT]), TRAVELER, trinket("feywild", "Feywild trinket", 3)]},
  "Witchlight Hand": {coins: {gp: 8}, items: [pick("Disguise kit or a musical instrument", ["Disguise Kit", group("Musical instrument", [INSTRUMENT])]),
    g("Playing Card Set", "Deck of cards"), pick("Carnival uniform or costume", [n("Carnival uniform"), COSTUME]), trinket("feywild", "Feywild trinket")]},

  /* Spelljammer, Dragonlance, Planescape, Bigby */
  "Astral Drifter": {coins: {gp: 10}, items: [TRAVELER, n("Diary"), "Ink Pen", g("Ink (1 ounce bottle)", "Bottle of ink")]},
  "Wildspacer": {coins: {gp: 10}, items: [w("Club", "Belaying pin"), TRAVELER, "Grappling Hook", "Rope, Hempen (50 feet)"]},
  "Knight of Solamnia": {coins: {gp: 10}, items: [n("Insignia of rank"), g("Playing Card Set", "Deck of cards"), COMMON]},
  "Mage of High Sorcery": {coins: {gp: 10}, items: [g("Ink (1 ounce bottle)", "Bottle of colored ink"), "Ink Pen", COMMON]},
  "Gate Warden": {coins: {gp: 10}, items: [n("Ring of keys to unknown locks"), g("Book", "Blank book"), pick("Ink pen or quill", ["Ink Pen", n("Quill")]), INK, TRAVELER]},
  "Planar Philosopher": {coins: {gp: 10}, note: "Your 10 gp is in coins from different worlds and planes.", items: [
    n("Portal key", "Such as a bag of golden tea leaves or the tooth of a planar beast."), n("Manifesto of your guiding philosophy"), g(COMMON, "Common clothes in your faction's style")]},
  "Giant Foundling": {coins: {gp: 10}, items: ["Backpack", TRAVELER, pick("Small stone or sprig that reminds you of home", [n("Small stone that reminds you of home"), n("Sprig that reminds you of home")])]},
  "Rune Carver": {coins: {gp: 10}, items: [group("Artisan's tools", [ARTISAN]), n("Small knife"), "Whetstone", COMMON]},

  /* Wildemount, Tal'Dorei */
  "Ashari": {coins: {gp: 10}, items: [TRAVELER, w("Quarterstaff", "Staff carved with symbols of your tribe"), "Herbalism Kit"]},
  "Grinner": {coins: {gp: 15}, items: [FINE, "Disguise Kit", group("Musical instrument", [INSTRUMENT]), n("Gold-plated ring depicting a smiling face")]},
  "Volstrucker Agent": {coins: {gp: 10}, items: [COMMON, n("Black cloak with a hood"), "Poisoner's Kit"]},

  /* Curse of Strahd, Plane Shift, Ravenloft, Baldur's Gate, The Book of Many Things */
  "Haunted One": {coins: {sp: 1}, items: [n("Monster hunter's pack", "chest, crowbar, hammer, 3 wooden stakes, holy symbol, flask of holy water, manacles, steel mirror, flask of oil, tinderbox, 3 torches"),
    trinket("gothic", "Trinket of special significance"), COMMON]},
  "Initiate": {coins: {gp: 15}, note: "If you have completed any trials before the campaign starts, you also have the cartouches you earned.", items: [
    n("Simple puzzle box"), n("Scroll of the basic teachings of the five gods"), group("Gaming set", [GAMING]), COMMON]},
  "Vizier": {coins: {gp: 25}, items: [group("Artisan's tools or musical instrument", [ARTISAN, INSTRUMENT]), n("Scroll of your god's teachings"), n("Vizier's cartouche"), FINE]},
  "Inquisitor": {coins: {gp: 15}, items: [HOLY, TRAVELER]},
  "Investigator (Ravenloft)": {coins: {gp: 10}, items: ["Magnifying Glass", trinket("horror", "Evidence from a past case"), COMMON]},
  "Faceless": {coins: {gp: 10}, items: ["Disguise Kit", COSTUME]},
  "Rewarded": {coins: {gp: 18}, items: [INK, "Ink Pen", g("Paper (one sheet)", "", {qty: 5}), group("Gaming set", [GAMING]), "Signet Ring", FINE]},
  "Ruined": {coins: {gp: 13}, items: [g("Hourglass", "Cracked hourglass"), g("Manacles", "Rusty manacles"), n("Half-empty bottle"), "Hunting Trap", group("Gaming set", [GAMING]), TRAVELER]},

  /* Adventurers League: Phlan */
  "Black Fist Double Agent": {coins: {gp: 15}, items: ["Disguise Kit", COMMON, n("Tears of Virulence emblem"), n("Writ of free agency signed by the Lord Regent"),
    group("Artisan's tools or gaming set", [ARTISAN, GAMING])]},
  "Dragon Casualty": {coins: {gp: 5}, items: [w("Dagger"), n("Tattered rags"), n("Loaf of moldy bread"), n("Small cast-off scale of Vorgansharax, the Maimed Virulence")]},
  "Iron Route Bandit": {coins: {gp: 5}, items: [g(COMMON, "Dark common clothes"), n("Pack saddle"), "Burglar's Pack"]},
  "Phlan Insurgent": {coins: {gp: 5}, items: ["Caltrops (bag of 20)", trinket("phb", "Trinket from your life before the occupation of Phlan"), "Healer's Kit",
    g(COMMON, "Dark common clothes with a cloak and hood")]},
  "Stojanow Prisoner": {coins: {gp: 10}, items: [n("Small knife"), COMMON, trinket("phb", "Trinket from the life you stayed behind to defend")]},
  "Ticklebelly Nomad": {coins: {gp: 5}, items: ["Herbalism Kit", n("Small article of jewelry distinct to your tribe"), "Hunting Trap", COMMON]},
  /* Adventurers League: Mulmaster */
  "Caravan Specialist": {coins: {gp: 10}, items: [w("Whip"), n("Tent"), n("Regional map"), TRAVELER]},
  "Earthspur Miner": {coins: {gp: 5}, items: [pick("Shovel or miner's pick", ["Shovel", "Pick, Miner's"]), "Block and Tackle", "Climber's Kit", COMMON]},
  "Harborfolk": {coins: {gp: 5}, items: ["Fishing Tackle", pick("Dice, playing cards or Three-Dragon Ante", ["Dice Set", "Playing Card Set", "Three-Dragon Ante Set"]), COMMON, n("Rowboat")]},
  "Mulmaster Aristocrat": {coins: {gp: 10}, items: [group("Artisan's tools or musical instrument", [ARTISAN, INSTRUMENT]), FINE]},
  "Phlan Refugee": {coins: {gp: 15}, items: [group("Artisan's tools", [ARTISAN]), n("Token of the life you once knew"), TRAVELER]},
  /* Adventurers League: Hillsfar */
  "Cormanthor Refugee": {coins: {gp: 5}, items: ["Tent, Two-person", group("Artisan's tools", [ARTISAN]), HOLY, TRAVELER]},
  "Gate Urchin": {coins: {gp: 10}, items: [n("Battered alms box"), group("Musical instrument", [INSTRUMENT]),
    pick("Cast-off military jacket, cap or scarf", [n("Cast-off military jacket"), n("Cast-off military cap"), n("Cast-off military scarf")]), COMMON]},
  "Hillsfar Merchant": {coins: {gp: 25}, items: [FINE, "Signet Ring", n("Letter of introduction from your family's trading house")]},
  "Hillsfar Smuggler": {coins: {gp: 5}, items: ["Forgery Kit", COMMON]},
  "Secret Identity": {coins: {gp: 5}, items: ["Disguise Kit", "Forgery Kit", COMMON]},
  "Shade Fanatic": {coins: {gp: 15}, items: ["Forgery Kit", n("Transparent cylinder of shadow that has no opening"), "Signet Ring", FINE]},
  "Trade Sheriff": {coins: {gp: 17}, items: ["Thieves' Tools", n("Gray cloak"), n("Sheriff's insignia (badge)"), FINE]}
};

/* Variants with their base background's kit. */
export var BACKGROUND_EQUIPMENT_SAME_AS = {"Knight": "Noble", "Spy": "Criminal", "Pirate": "Sailor", "Investigator": "City Watch"};

/* A Dimir Operative's secondary guild: its kit comes with the Dimir one. */
export var RAVNICA_GUILD_BACKGROUNDS = ["Azorius Functionary", "Boros Legionnaire", "Golgari Agent", "Gruul Anarch", "Izzet Engineer",
  "Orzhov Representative", "Rakdos Cultist", "Selesnya Initiate", "Simic Scientist"];
