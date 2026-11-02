/* Gods a character can follow, for the Faith tile on the Personality
   card (flavour only, nothing reads it). Each group is one pantheon;
   each god is [text, alignment, suggested domains, holy symbol, icon].
   The text is what the tile shows once chosen; the icon is a key of
   DEITY_ICONS (js/data/deity-icons.js), picked to match the symbol.
     Forgotten Realms, Nonhuman Deities: Player's Handbook, Appendix B
     Prime Deities, Betrayer Gods: Explorer's Guide to Wildemount,
       chapter 1, Pantheon of Exandria (titles from each god's section,
       province and symbol from its table; Tal'Dorei Reborn shares these gods) */

export var DEITY_GROUPS = [
  {label: "Forgotten Realms", gods: [
    ["Auril, goddess of winter", "NE", "Nature, Tempest", "Six-pointed snowflake", "lorc/snowflake-2"],
    ["Azuth, god of wizards", "LN", "Knowledge", "Left hand pointing upward, outlined in fire", "lorc/magic-palm"],
    ["Bane, god of tyranny", "LE", "War", "Upright black right hand, thumb and fingers together", "lorc/black-hand-shield"],
    ["Beshaba, goddess of misfortune", "CE", "Trickery", "Black antlers", "lorc/stag-head"],
    ["Bhaal, god of murder", "NE", "Death", "Skull surrounded by a ring of blood droplets", "lorc/skull-ring"],
    ["Chauntea, goddess of agriculture", "NG", "Life", "Sheaf of grain or a blooming rose over grain", "lorc/wheat"],
    ["Cyric, god of lies", "CE", "Trickery", "White jawless skull on black or purple sunburst", "lorc/star-skull"],
    ["Deneir, god of writing", "NG", "Knowledge", "Lit candle above an open eye", "lorc/candle-light"],
    ["Eldath, goddess of peace", "NG", "Life, Nature", "Waterfall plunging into still pool", "delapouite/waterfall"],
    ["Gond, god of craft", "N", "Knowledge", "Toothed cog with four spokes", "lorc/cog"],
    ["Helm, god of protection", "LN", "Life, Light", "Staring eye on upright left gauntlet", "lorc/eye-shield"],
    ["Ilmater, god of endurance", "LG", "Life", "Hands bound at the wrist with red cord", "lorc/manacles"],
    ["Kelemvor, god of the dead", "LN", "Death", "Upright skeletal arm holding balanced scales", "delapouite/skeletal-hand"],
    ["Lathander, god of birth and renewal", "NG", "Life, Light", "Road traveling into a sunrise", "lorc/sunrise"],
    ["Leira, goddess of illusion", "CN", "Trickery", "Point-down triangle containing a swirl of mist", "lorc/moebius-triangle"],
    ["Lliira, goddess of joy", "CG", "Life", "Triangle of three six-pointed stars", "delapouite/star-formation"],
    ["Loviatar, goddess of pain", "LE", "Death", "Nine-tailed barbed scourge", "lorc/whip"],
    ["Malar, god of the hunt", "CE", "Nature", "Clawed paw", "lorc/paw"],
    ["Mask, god of thieves", "CN", "Trickery", "Black mask", "lorc/domino-mask"],
    ["Mielikki, goddess of forests", "NG", "Nature", "Unicorn's head", "delapouite/unicorn"],
    ["Milil, god of poetry and song", "NG", "Light", "Five-stringed harp made of leaves", "delapouite/harp"],
    ["Myrkul, god of death", "NE", "Death", "White human skull", "lorc/dread-skull"],
    ["Mystra, goddess of magic", "NG", "Knowledge", "Circle of seven stars, or nine stars encircling a flowing red mist, or a single star", "lorc/star-swirl"],
    ["Oghma, god of knowledge", "N", "Knowledge", "Blank scroll", "lorc/scroll-unfurled"],
    ["Savras, god of divination and fate", "LN", "Knowledge", "Crystal ball containing many kinds of eyes", "lorc/crystal-ball"],
    ["Selûne, goddess of the moon", "CG", "Knowledge, Life", "Pair of eyes surrounded by seven stars", "lorc/moon"],
    ["Shar, goddess of darkness and loss", "NE", "Death, Trickery", "Black disk encircled with a border", "lorc/eclipse"],
    ["Silvanus, god of wild nature", "N", "Nature", "Oak leaf", "delapouite/oak-leaf"],
    ["Sune, goddess of love and beauty", "CG", "Life, Light", "Face of a beautiful red-haired woman", "lorc/lips"],
    ["Talona, goddess of disease and poison", "CE", "Death", "Three teardrops on a triangle", "lorc/droplets"],
    ["Talos, god of storms", "CE", "Tempest", "Three lightning bolts radiating from a central point", "lorc/heavy-lightning"],
    ["Tempus, god of war", "N", "War", "Upright flaming sword", "lorc/winged-sword"],
    ["Torm, god of courage and self-sacrifice", "LG", "War", "White right gauntlet", "delapouite/gauntlet"],
    ["Tymora, goddess of good fortune", "CG", "Trickery", "Face-up coin", "caro-asercion/coinflip"],
    ["Tyr, god of justice", "LG", "War", "Balanced scales resting on a warhammer", "lorc/scales"],
    ["Umberlee, goddess of the sea", "CE", "Tempest", "Wave curling left and right", "lorc/big-wave"],
    ["Waukeen, goddess of trade", "N", "Knowledge, Trickery", "Upright coin with Waukeen's profile facing left", "delapouite/coins"]
  ]},
  {label: "Exandria: Prime Deities", gods: [
    ["Avandra, the Change Bringer (change, freedom, luck)", "CG", "Nature, Trickery", "Woman's profile embossed on a gold coin or pendant", "lorc/crown-coin"],
    ["Bahamut, the Platinum Dragon (honor, justice)", "LG", "Life, Order, War", "Silver dragon's head in profile", "lorc/dragon-head"],
    ["Corellon, the Arch Heart (art, beauty, elves)", "CG", "Arcana, Light", "Two crescent moons facing each other atop a four-pointed star", "lorc/concentric-crescents"],
    ["Erathis, the Law Bearer (civilization, law, peace)", "LN", "Knowledge, Order", "Double-headed axe inset with a pattern of scales", "lorc/battle-axe"],
    ["Ioun, the Knowing Mentor (knowledge, learning, teaching)", "N", "Arcana, Knowledge", "Pair of open eyes crowned with a third open eye", "lorc/third-eye"],
    ["Kord, the Storm Lord (battle, competition, storms)", "CN", "Tempest, War", "Four bolts of lightning radiating from the center of a shield", "lorc/lightning-shield"],
    ["Melora, the Wild Mother (seas, wilderness)", "N", "Life, Nature, Tempest", "Wreath of grass and grain affixed to a crook", "generalace135/shepherds-crook"],
    ["Moradin, the All-Hammer (craft, creation)", "LG", "Forge, Knowledge, War", "Hammer with ends carved in the likeness of dwarven heads", "delapouite/thor-hammer"],
    ["Pelor, the Dawn Father (healing, sun)", "NG", "Life, Light, Nature", "Bright, eight-pointed star", "lorc/sun"],
    ["Raei, the Everlight (atonement, compassion)", "NG", "Life, Light", "Humanoid, feminine phoenix", "lorc/angel-wings"],
    ["The Raven Queen, Matron of Ravens (death, fate, winter)", "LN", "Death, Grave", "White, humanoid mask framed in black feathers", "lorc/raven"],
    ["Sehanine, the Moon Weaver (illusion, moonlight, night)", "CG", "Arcana, Nature, Trickery", "Crescent moon turned upward, strung like a bow", "lorc/moon"]
  ]},
  {label: "Exandria: Betrayer Gods", gods: [
    ["Asmodeus, the Lord of the Nine Hells", "LE", "Trickery, War", "Crown of spiked onyx and curved horns", "delapouite/devil-mask"],
    ["Bane, the Strife Emperor (conquest, tyranny)", "LE", "Forge, Order, War", "Flail of chains, each ending in shackles", "delapouite/flail"],
    ["Gruumsh, the Ruiner (slaughter, warfare)", "CE", "Death, Tempest, War", "Single, unblinking eye that bleeds", "lorc/bleeding-eye"],
    ["Lolth, the Spider Queen (deceit, spiders)", "CE", "Knowledge, Trickery", "Jeweled spider", "lorc/masked-spider"],
    ["Tharizdun, the Chained Oblivion (darkness, destruction)", "CE", "Death, Grave, Trickery", "Crooked, seven-pointed star made of chains", "delapouite/seven-pointed-star"],
    ["Tiamat, the Scaled Tyrant (dragon god of evil)", "LE", "Order, Trickery, War", "Taloned dragon claw", "lorc/bird-claw"],
    ["Torog, the Crawling King (enslavement, torture)", "NE", "Death, Trickery", "Three pale arms clawing from a dark void", "lorc/grasping-claws"],
    ["Vecna, the Whispered One (necromancy, secrets)", "NE", "Arcana, Death, Grave, Knowledge", "Desiccated hand with an eye in the palm", "lorc/evil-hand"],
    ["Zehir, the Cloaked Serpent (assassins, poison, snakes)", "CE", "Nature, Trickery", "Coiled serpent", "delapouite/snake-spiral"]
  ]},
  {label: "Elves, dwarves & more", gods: [
    ["Bahamut, dragon god of good", "LG", "Life, War", "Dragon's head in profile", "lorc/dragon-head"],
    ["Blibdoolpoolp, kuo-toa goddess", "NE", "Death", "Lobster head or black pearl", "lorc/crab-claw"],
    ["Corellon Larethian, elf deity of art and magic", "CG", "Light", "Quarter moon or starburst", "lorc/concentric-crescents"],
    ["Deep Sashelas, elf god of the sea", "CG", "Nature, Tempest", "Dolphin", "delapouite/dolphin"],
    ["Eadro, merfolk deity of the sea", "N", "Nature, Tempest", "Spiral design", "lorc/spiral-shell"],
    ["Garl Glittergold, gnome god of trickery and wiles", "LG", "Trickery", "Gold nugget", "delapouite/gold-nuggets"],
    ["Grolantor, hill giant god of war", "CE", "War", "Wooden club", "delapouite/bone-mace"],
    ["Gruumsh, orc god of storms and war", "CE", "Tempest, War", "Unblinking eye", "lorc/eyeball"],
    ["Hruggek, bugbear god of violence", "CE", "War", "Morningstar", "lorc/spiked-mace"],
    ["Kurtulmak, kobold god of war and mining", "LE", "War", "Gnome skull", "lorc/broken-skull"],
    ["Laogzed, troglodyte god of hunger", "CE", "Death", "Image of the lizard/toad god", "lorc/toad-teeth"],
    ["Lolth, drow goddess of spiders", "CE", "Trickery", "Spider", "lorc/hanging-spider"],
    ["Maglubiyet, goblinoid god of war", "LE", "War", "Bloody axe", "lorc/battered-axe"],
    ["Moradin, dwarf god of creation", "LG", "Knowledge", "Hammer and anvil", "lorc/anvil-impact"],
    ["Rillifane Rallathil, wood elf god of nature", "CG", "Nature", "Oak", "lorc/oak"],
    ["Sehanine Moonbow, elf goddess of the moon", "CG", "Knowledge", "Crescent moon", "lorc/moon"],
    ["Sekolah, sahuagin god of the hunt", "LE", "Nature, Tempest", "Shark", "lorc/shark-jaws"],
    ["Semuanya, lizardfolk deity of survival", "N", "Life", "Egg", "lorc/dinosaur-egg"],
    ["Skerrit, centaur and satyr god of nature", "N", "Nature", "Oak growing from acorn", "lorc/acorn"],
    ["Skoraeus Stonebones, god of stone giants and art", "N", "Knowledge", "Stalactite", "delapouite/stalactites"],
    ["Surtur, god of fire giants and craft", "LE", "Knowledge, War", "Flaming sword", "lorc/relic-blade"],
    ["Thrym, god of frost giants and strength", "CE", "War", "White double-bladed axe", "lorc/battle-axe"],
    ["Tiamat, dragon goddess of evil", "LE", "Trickery", "Dragon head with five claw marks", "lorc/claw-slashes"],
    ["Yondalla, halfling goddess of fertility and protection", "LG", "Life", "Shield", "delapouite/heart-shield"]
  ]}
];

export var ALIGNMENT_NAMES = {LG: "Lawful Good", NG: "Neutral Good", CG: "Chaotic Good", LN: "Lawful Neutral",
  N: "Neutral", CN: "Chaotic Neutral", LE: "Lawful Evil", NE: "Neutral Evil", CE: "Chaotic Evil"};
