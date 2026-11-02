/* Gods a character can follow, for the Faith tile on the Personality
   card (flavour only, nothing reads it). Each group is one pantheon;
   each god is [text, alignment, suggested domains]. The text is what
   the tile shows once chosen.
     Forgotten Realms, Nonhuman Deities: Player's Handbook, Appendix B
     Prime Deities, Betrayer Gods: Explorer's Guide to Wildemount,
       chapter 1, Pantheon of Exandria (titles from each god's section,
       province from its table; Tal'Dorei Reborn shares these gods) */

export var DEITY_GROUPS = [
  {label: "Forgotten Realms", gods: [
    ["Auril, goddess of winter", "NE", "Nature, Tempest"],
    ["Azuth, god of wizards", "LN", "Knowledge"],
    ["Bane, god of tyranny", "LE", "War"],
    ["Beshaba, goddess of misfortune", "CE", "Trickery"],
    ["Bhaal, god of murder", "NE", "Death"],
    ["Chauntea, goddess of agriculture", "NG", "Life"],
    ["Cyric, god of lies", "CE", "Trickery"],
    ["Deneir, god of writing", "NG", "Knowledge"],
    ["Eldath, goddess of peace", "NG", "Life, Nature"],
    ["Gond, god of craft", "N", "Knowledge"],
    ["Helm, god of protection", "LN", "Life, Light"],
    ["Ilmater, god of endurance", "LG", "Life"],
    ["Kelemvor, god of the dead", "LN", "Death"],
    ["Lathander, god of birth and renewal", "NG", "Life, Light"],
    ["Leira, goddess of illusion", "CN", "Trickery"],
    ["Lliira, goddess of joy", "CG", "Life"],
    ["Loviatar, goddess of pain", "LE", "Death"],
    ["Malar, god of the hunt", "CE", "Nature"],
    ["Mask, god of thieves", "CN", "Trickery"],
    ["Mielikki, goddess of forests", "NG", "Nature"],
    ["Milil, god of poetry and song", "NG", "Light"],
    ["Myrkul, god of death", "NE", "Death"],
    ["Mystra, goddess of magic", "NG", "Knowledge"],
    ["Oghma, god of knowledge", "N", "Knowledge"],
    ["Savras, god of divination and fate", "LN", "Knowledge"],
    ["Selûne, goddess of the moon", "CG", "Knowledge, Life"],
    ["Shar, goddess of darkness and loss", "NE", "Death, Trickery"],
    ["Silvanus, god of wild nature", "N", "Nature"],
    ["Sune, goddess of love and beauty", "CG", "Life, Light"],
    ["Talona, goddess of disease and poison", "CE", "Death"],
    ["Talos, god of storms", "CE", "Tempest"],
    ["Tempus, god of war", "N", "War"],
    ["Torm, god of courage and self-sacrifice", "LG", "War"],
    ["Tymora, goddess of good fortune", "CG", "Trickery"],
    ["Tyr, god of justice", "LG", "War"],
    ["Umberlee, goddess of the sea", "CE", "Tempest"],
    ["Waukeen, goddess of trade", "N", "Knowledge, Trickery"]
  ]},
  {label: "Exandria: Prime Deities", gods: [
    ["Avandra, the Change Bringer (change, freedom, luck)", "CG", "Nature, Trickery"],
    ["Bahamut, the Platinum Dragon (honor, justice)", "LG", "Life, Order, War"],
    ["Corellon, the Arch Heart (art, beauty, elves)", "CG", "Arcana, Light"],
    ["Erathis, the Law Bearer (civilization, law, peace)", "LN", "Knowledge, Order"],
    ["Ioun, the Knowing Mentor (knowledge, learning, teaching)", "N", "Arcana, Knowledge"],
    ["Kord, the Storm Lord (battle, competition, storms)", "CN", "Tempest, War"],
    ["Melora, the Wild Mother (seas, wilderness)", "N", "Life, Nature, Tempest"],
    ["Moradin, the All-Hammer (craft, creation)", "LG", "Forge, Knowledge, War"],
    ["Pelor, the Dawn Father (healing, sun)", "NG", "Life, Light, Nature"],
    ["Raei, the Everlight (atonement, compassion)", "NG", "Life, Light"],
    ["The Raven Queen, Matron of Ravens (death, fate, winter)", "LN", "Death, Grave"],
    ["Sehanine, the Moon Weaver (illusion, moonlight, night)", "CG", "Arcana, Nature, Trickery"]
  ]},
  {label: "Exandria: Betrayer Gods", gods: [
    ["Asmodeus, the Lord of the Nine Hells", "LE", "Trickery, War"],
    ["Bane, the Strife Emperor (conquest, tyranny)", "LE", "Forge, Order, War"],
    ["Gruumsh, the Ruiner (slaughter, warfare)", "CE", "Death, Tempest, War"],
    ["Lolth, the Spider Queen (deceit, spiders)", "CE", "Knowledge, Trickery"],
    ["Tharizdun, the Chained Oblivion (darkness, destruction)", "CE", "Death, Grave, Trickery"],
    ["Tiamat, the Scaled Tyrant (dragon god of evil)", "LE", "Order, Trickery, War"],
    ["Torog, the Crawling King (enslavement, torture)", "NE", "Death, Trickery"],
    ["Vecna, the Whispered One (necromancy, secrets)", "NE", "Arcana, Death, Grave, Knowledge"],
    ["Zehir, the Cloaked Serpent (assassins, poison, snakes)", "CE", "Nature, Trickery"]
  ]},
  {label: "Gods of other peoples", gods: [
    ["Bahamut, dragon god of good", "LG", "Life, War"],
    ["Blibdoolpoolp, kuo-toa goddess", "NE", "Death"],
    ["Corellon Larethian, elf deity of art and magic", "CG", "Light"],
    ["Deep Sashelas, elf god of the sea", "CG", "Nature, Tempest"],
    ["Eadro, merfolk deity of the sea", "N", "Nature, Tempest"],
    ["Garl Glittergold, gnome god of trickery and wiles", "LG", "Trickery"],
    ["Grolantor, hill giant god of war", "CE", "War"],
    ["Gruumsh, orc god of storms and war", "CE", "Tempest, War"],
    ["Hruggek, bugbear god of violence", "CE", "War"],
    ["Kurtulmak, kobold god of war and mining", "LE", "War"],
    ["Laogzed, troglodyte god of hunger", "CE", "Death"],
    ["Lolth, drow goddess of spiders", "CE", "Trickery"],
    ["Maglubiyet, goblinoid god of war", "LE", "War"],
    ["Moradin, dwarf god of creation", "LG", "Knowledge"],
    ["Rillifane Rallathil, wood elf god of nature", "CG", "Nature"],
    ["Sehanine Moonbow, elf goddess of the moon", "CG", "Knowledge"],
    ["Sekolah, sahuagin god of the hunt", "LE", "Nature, Tempest"],
    ["Semuanya, lizardfolk deity of survival", "N", "Life"],
    ["Skerrit, centaur and satyr god of nature", "N", "Nature"],
    ["Skoraeus Stonebones, god of stone giants and art", "N", "Knowledge"],
    ["Surtur, god of fire giants and craft", "LE", "Knowledge, War"],
    ["Thrym, god of frost giants and strength", "CE", "War"],
    ["Tiamat, dragon goddess of evil", "LE", "Trickery"],
    ["Yondalla, halfling goddess of fertility and protection", "LG", "Life"]
  ]}
];

export var ALIGNMENT_NAMES = {LG: "Lawful Good", NG: "Neutral Good", CG: "Chaotic Good", LN: "Lawful Neutral",
  N: "Neutral", CN: "Chaotic Neutral", LE: "Lawful Evil", NE: "Neutral Evil", CE: "Chaotic Evil"};
