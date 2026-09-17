/* ---------------- Language data (SRD) ---------------- */
export var LANGUAGES = {
  "Standard": [
    "Common","Dwarvish","Elvish","Giant","Gnomish","Goblin","Halfling","Orc"
  ],
  "Exotic": [
    "Abyssal","Celestial","Deep Speech","Draconic","Infernal","Primordial","Sylvan","Undercommon"
  ],
  "Secret": [
    "Druidic","Thieves' Cant"
  ]
};
export var LANGUAGE_LIST = Object.keys(LANGUAGES).reduce(function(all, group){
  return all.concat(LANGUAGES[group]);
}, []);
