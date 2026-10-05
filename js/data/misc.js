/* ---------------- Misc wizard data ---------------- */
export var POINT_BUY_COSTS = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};

/* Name ideas, shown as tappable suggestions on the Review step so a blank
   name field is not a dead end. Four are picked at random each time. */
export var NAME_IDEAS = [
  // Our table's characters
  "Ragnar", "Nanos", "Kayn", "Belisarius", "Hunter", "Cyrene",
  "TOUKELLIENMELI", "Tommys the Barber", "Orinel", "Luner", "Death",

  // Baldur's Gate 3 companions
  "Astarion", "Shadowheart", "Gale Dekarios", "Lae'zel", "Wyll Ravengard",
  "Karlach Cliffgate", "Halsin", "Minthara", "Jaheira", "Minsc",

  // Roman and Byzantine emperors
  "Marcus Aurelius", "Constantine the Great", "Justinian I",

  // Warhammer 40,000
  "Demetrian Titus", "Leandros",

  // Destiny
  "Commander Zavala", "Ikora Rey", "Cayde-6", "Saint-14", "Osiris",
  "Eris Morn", "Lord Shaxx", "Mara Sov", "Savathun", "Crow"
];
/* Title ideas: the epithet shown under the name on the sheet, offered on
   the Review step and by the dice button when editing a title. */
export var TITLE_IDEAS = [
  // Generic fantasy epithets
  "the Unbroken", "Slayer of Wyrms", "Oathkeeper", "the Grey Wanderer",
  "Stormborn", "Breaker of Chains", "Wolf of the North", "Last of the Line",
  "Keeper of the Flame", "Bane of the Undead", "the Lucky", "Scourge of the Seas",
  "Hand of the Gods", "the Silver Tongue", "Warden of the Wilds", "Dragonfriend",
  "the Twice-Dead", "Shieldbreaker", "Friend of Crows", "Kingslayer",
  "the Unkillable", "Tavern Legend", "Eater of Rations", "Voice of the Storm",

  // Destiny — titles earned through triumph
  "Chosen of the Light", "Ghost-Touched", "Dredgen", "Flawless",
  "Unbroken Guardian", "Seeker of Secrets", "Warden of the City",
  "Hunter of the Darkness", "Speaker of the Traveler", "Sword Logic Survivor",
  "Queensguard", "Nightstalker", "Gunslinger", "Stormcaller",
  "Hammer of Sol", "Titan of the Wall", "Disciple-Slayer",

  // Warhammer 40,000
  "Adeptus Astartes", "Veteran of a Hundred Crusades", "Herald of the Omnissiah",
  "Purger of Heretics", "Knight of Ultramar", "Defender of the Imperium",
  "Scion of Dorn", "The Emperor's Blade", "Slayer of the Xenos",
  "Iron Within", "For the Emperor", "Blade of the Chapter",
  "Champion of Macragge", "Last Remnant",

  // Baldur's Gate 3 flavour
  "Blade of the Absolute", "Chosen of Selûne", "Oathbreaker Redeemed",
  "Duke's Companion", "Child of Bhaal", "Illithid Ascendant",
  "Rider of Avernus", "the Weave-Touched", "Guardian of Baldur's Gate",

  // Roman & Byzantine
  "Augustus", "Imperator", "Pater Patriae", "Defender of the Senate",
  "Victor over the Barbarians", "Restorer of the World",
  "Purple-Born", "Strategos of the East"
];
function pickIdeas(list, n){
  var pool = list.slice();
  var picks = [];
  while(picks.length<n && pool.length){
    picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  }
  return picks;
}
export function pickNameIdeas(n){ return pickIdeas(NAME_IDEAS, n); }
export function pickTitleIdeas(n){ return pickIdeas(TITLE_IDEAS, n); }
