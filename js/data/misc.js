/* ---------------- Misc wizard data ---------------- */
export var POINT_BUY_COSTS = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};

/* A few Barbarian-flavored name ideas, shown as tappable suggestions on the
   Review step so a blank name field is not a dead end. */
export var NAME_IDEAS = [
  "Ragnar", "Ulfgar Ironhide", "Korgath Bloodaxe", "Brenna Skullcrusher",
  "Thrain Stonefist", "Vex Wildmane", "Dagna Frostborn", "Grom Ashfang",
  "Sela Stormheart", "Kael Grimtusk", "Rurik Oakshoulder", "Yrsa Wolfsbane"
];
export function pickNameIdeas(n){
  var pool = NAME_IDEAS.slice();
  var picks = [];
  while(picks.length<n && pool.length){
    picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  }
  return picks;
}
