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
  "the Unbroken", "Slayer of Wyrms", "Oathkeeper", "the Grey Wanderer",
  "Stormborn", "Breaker of Chains", "Wolf of the North", "Last of the Line",
  "Keeper of the Flame", "Bane of the Undead", "the Lucky", "Scourge of the Seas",
  "Hand of the Gods", "the Silver Tongue", "Warden of the Wilds", "Dragonfriend",
  "the Twice-Dead", "Shieldbreaker", "Friend of Crows", "Kingslayer",
  "the Unkillable", "Tavern Legend", "Eater of Rations", "Voice of the Storm"
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
