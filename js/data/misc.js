/* ---------------- Misc wizard data ---------------- */
export var POINT_BUY_COSTS = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};

/* Name ideas, shown as tappable suggestions on the Review step so a blank
   name field is not a dead end. Four are picked at random each time. */
export var NAME_IDEAS = [
  // Our table's characters
  "Ragnar", "Nanos", "Kayn", "Belisarius", "Hunter", "Cyrene",
  "TOUKELLIENMELI", "Tommys the Barber", "Orinel", "Michael", "Death",

  // Baldur's Gate 3 companions
  "Astarion", "Shadowheart", "Gale Dekarios", "Lae'zel", "Wyll Ravengard",
  "Karlach Cliffgate", "Halsin", "Minthara", "Jaheira", "Minsc",

  // Roman and Byzantine emperors
  "Marcus Aurelius", "Constantine the Great", "Justinian I",

  // Warhammer 40,000
  "Demetrian Titus", "Leandros",

  // Destiny
  "Commander Zavala", "Ikora Rey", "Cayde-6", "Saint-14", "Osiris",
  "Eris Morn", "Lord Shaxx", "Mara Sov", "Savathûn", "Crow"
];
export function pickNameIdeas(n){
  var pool = NAME_IDEAS.slice();
  var picks = [];
  while(picks.length<n && pool.length){
    picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  }
  return picks;
}
