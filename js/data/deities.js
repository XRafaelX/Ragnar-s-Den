/* Gods a character can follow, for the Faith tile on the Personality
   card (flavour only, nothing reads it). Each group is one pantheon;
   each god is [text, alignment, suggested domains, holy symbol]. The
   text is what the tile shows once chosen.
     Forgotten Realms, Nonhuman Deities: Player's Handbook, Appendix B
     Prime Deities, Betrayer Gods: Explorer's Guide to Wildemount,
       chapter 1, Pantheon of Exandria (titles from each god's section,
       province and symbol from its table; Tal'Dorei Reborn shares these gods) */

export var DEITY_GROUPS = [
  {label: "Forgotten Realms", gods: [
    ["Auril, goddess of winter", "NE", "Nature, Tempest", "Six-pointed snowflake"],
    ["Azuth, god of wizards", "LN", "Knowledge", "Left hand pointing upward, outlined in fire"],
    ["Bane, god of tyranny", "LE", "War", "Upright black right hand, thumb and fingers together"],
    ["Beshaba, goddess of misfortune", "CE", "Trickery", "Black antlers"],
    ["Bhaal, god of murder", "NE", "Death", "Skull surrounded by a ring of blood droplets"],
    ["Chauntea, goddess of agriculture", "NG", "Life", "Sheaf of grain or a blooming rose over grain"],
    ["Cyric, god of lies", "CE", "Trickery", "White jawless skull on black or purple sunburst"],
    ["Deneir, god of writing", "NG", "Knowledge", "Lit candle above an open eye"],
    ["Eldath, goddess of peace", "NG", "Life, Nature", "Waterfall plunging into still pool"],
    ["Gond, god of craft", "N", "Knowledge", "Toothed cog with four spokes"],
    ["Helm, god of protection", "LN", "Life, Light", "Staring eye on upright left gauntlet"],
    ["Ilmater, god of endurance", "LG", "Life", "Hands bound at the wrist with red cord"],
    ["Kelemvor, god of the dead", "LN", "Death", "Upright skeletal arm holding balanced scales"],
    ["Lathander, god of birth and renewal", "NG", "Life, Light", "Road traveling into a sunrise"],
    ["Leira, goddess of illusion", "CN", "Trickery", "Point-down triangle containing a swirl of mist"],
    ["Lliira, goddess of joy", "CG", "Life", "Triangle of three six-pointed stars"],
    ["Loviatar, goddess of pain", "LE", "Death", "Nine-tailed barbed scourge"],
    ["Malar, god of the hunt", "CE", "Nature", "Clawed paw"],
    ["Mask, god of thieves", "CN", "Trickery", "Black mask"],
    ["Mielikki, goddess of forests", "NG", "Nature", "Unicorn's head"],
    ["Milil, god of poetry and song", "NG", "Light", "Five-stringed harp made of leaves"],
    ["Myrkul, god of death", "NE", "Death", "White human skull"],
    ["Mystra, goddess of magic", "NG", "Knowledge", "Circle of seven stars, or nine stars encircling a flowing red mist, or a single star"],
    ["Oghma, god of knowledge", "N", "Knowledge", "Blank scroll"],
    ["Savras, god of divination and fate", "LN", "Knowledge", "Crystal ball containing many kinds of eyes"],
    ["Selûne, goddess of the moon", "CG", "Knowledge, Life", "Pair of eyes surrounded by seven stars"],
    ["Shar, goddess of darkness and loss", "NE", "Death, Trickery", "Black disk encircled with a border"],
    ["Silvanus, god of wild nature", "N", "Nature", "Oak leaf"],
    ["Sune, goddess of love and beauty", "CG", "Life, Light", "Face of a beautiful red-haired woman"],
    ["Talona, goddess of disease and poison", "CE", "Death", "Three teardrops on a triangle"],
    ["Talos, god of storms", "CE", "Tempest", "Three lightning bolts radiating from a central point"],
    ["Tempus, god of war", "N", "War", "Upright flaming sword"],
    ["Torm, god of courage and self-sacrifice", "LG", "War", "White right gauntlet"],
    ["Tymora, goddess of good fortune", "CG", "Trickery", "Face-up coin"],
    ["Tyr, god of justice", "LG", "War", "Balanced scales resting on a warhammer"],
    ["Umberlee, goddess of the sea", "CE", "Tempest", "Wave curling left and right"],
    ["Waukeen, goddess of trade", "N", "Knowledge, Trickery", "Upright coin with Waukeen's profile facing left"]
  ]},
  {label: "Exandria: Prime Deities", gods: [
    ["Avandra, the Change Bringer (change, freedom, luck)", "CG", "Nature, Trickery", "Woman's profile embossed on a gold coin or pendant"],
    ["Bahamut, the Platinum Dragon (honor, justice)", "LG", "Life, Order, War", "Silver dragon's head in profile"],
    ["Corellon, the Arch Heart (art, beauty, elves)", "CG", "Arcana, Light", "Two crescent moons facing each other atop a four-pointed star"],
    ["Erathis, the Law Bearer (civilization, law, peace)", "LN", "Knowledge, Order", "Double-headed axe inset with a pattern of scales"],
    ["Ioun, the Knowing Mentor (knowledge, learning, teaching)", "N", "Arcana, Knowledge", "Pair of open eyes crowned with a third open eye"],
    ["Kord, the Storm Lord (battle, competition, storms)", "CN", "Tempest, War", "Four bolts of lightning radiating from the center of a shield"],
    ["Melora, the Wild Mother (seas, wilderness)", "N", "Life, Nature, Tempest", "Wreath of grass and grain affixed to a crook"],
    ["Moradin, the All-Hammer (craft, creation)", "LG", "Forge, Knowledge, War", "Hammer with ends carved in the likeness of dwarven heads"],
    ["Pelor, the Dawn Father (healing, sun)", "NG", "Life, Light, Nature", "Bright, eight-pointed star"],
    ["Raei, the Everlight (atonement, compassion)", "NG", "Life, Light", "Humanoid, feminine phoenix"],
    ["The Raven Queen, Matron of Ravens (death, fate, winter)", "LN", "Death, Grave", "White, humanoid mask framed in black feathers"],
    ["Sehanine, the Moon Weaver (illusion, moonlight, night)", "CG", "Arcana, Nature, Trickery", "Crescent moon turned upward, strung like a bow"]
  ]},
  {label: "Exandria: Betrayer Gods", gods: [
    ["Asmodeus, the Lord of the Nine Hells", "LE", "Trickery, War", "Crown of spiked onyx and curved horns"],
    ["Bane, the Strife Emperor (conquest, tyranny)", "LE", "Forge, Order, War", "Flail of chains, each ending in shackles"],
    ["Gruumsh, the Ruiner (slaughter, warfare)", "CE", "Death, Tempest, War", "Single, unblinking eye that bleeds"],
    ["Lolth, the Spider Queen (deceit, spiders)", "CE", "Knowledge, Trickery", "Jeweled spider"],
    ["Tharizdun, the Chained Oblivion (darkness, destruction)", "CE", "Death, Grave, Trickery", "Crooked, seven-pointed star made of chains"],
    ["Tiamat, the Scaled Tyrant (dragon god of evil)", "LE", "Order, Trickery, War", "Taloned dragon claw"],
    ["Torog, the Crawling King (enslavement, torture)", "NE", "Death, Trickery", "Three pale arms clawing from a dark void"],
    ["Vecna, the Whispered One (necromancy, secrets)", "NE", "Arcana, Death, Grave, Knowledge", "Desiccated hand with an eye in the palm"],
    ["Zehir, the Cloaked Serpent (assassins, poison, snakes)", "CE", "Nature, Trickery", "Coiled serpent"]
  ]},
  {label: "Elves, dwarves & more", gods: [
    ["Bahamut, dragon god of good", "LG", "Life, War", "Dragon's head in profile"],
    ["Blibdoolpoolp, kuo-toa goddess", "NE", "Death", "Lobster head or black pearl"],
    ["Corellon Larethian, elf deity of art and magic", "CG", "Light", "Quarter moon or starburst"],
    ["Deep Sashelas, elf god of the sea", "CG", "Nature, Tempest", "Dolphin"],
    ["Eadro, merfolk deity of the sea", "N", "Nature, Tempest", "Spiral design"],
    ["Garl Glittergold, gnome god of trickery and wiles", "LG", "Trickery", "Gold nugget"],
    ["Grolantor, hill giant god of war", "CE", "War", "Wooden club"],
    ["Gruumsh, orc god of storms and war", "CE", "Tempest, War", "Unblinking eye"],
    ["Hruggek, bugbear god of violence", "CE", "War", "Morningstar"],
    ["Kurtulmak, kobold god of war and mining", "LE", "War", "Gnome skull"],
    ["Laogzed, troglodyte god of hunger", "CE", "Death", "Image of the lizard/toad god"],
    ["Lolth, drow goddess of spiders", "CE", "Trickery", "Spider"],
    ["Maglubiyet, goblinoid god of war", "LE", "War", "Bloody axe"],
    ["Moradin, dwarf god of creation", "LG", "Knowledge", "Hammer and anvil"],
    ["Rillifane Rallathil, wood elf god of nature", "CG", "Nature", "Oak"],
    ["Sehanine Moonbow, elf goddess of the moon", "CG", "Knowledge", "Crescent moon"],
    ["Sekolah, sahuagin god of the hunt", "LE", "Nature, Tempest", "Shark"],
    ["Semuanya, lizardfolk deity of survival", "N", "Life", "Egg"],
    ["Skerrit, centaur and satyr god of nature", "N", "Nature", "Oak growing from acorn"],
    ["Skoraeus Stonebones, god of stone giants and art", "N", "Knowledge", "Stalactite"],
    ["Surtur, god of fire giants and craft", "LE", "Knowledge, War", "Flaming sword"],
    ["Thrym, god of frost giants and strength", "CE", "War", "White double-bladed axe"],
    ["Tiamat, dragon goddess of evil", "LE", "Trickery", "Dragon head with five claw marks"],
    ["Yondalla, halfling goddess of fertility and protection", "LG", "Life", "Shield"]
  ]}
];

export var ALIGNMENT_NAMES = {LG: "Lawful Good", NG: "Neutral Good", CG: "Chaotic Good", LN: "Lawful Neutral",
  N: "Neutral", CN: "Chaotic Neutral", LE: "Lawful Evil", NE: "Neutral Evil", CE: "Chaotic Evil"};
