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
/* How each group is titled in language pickers. Exotic languages are
   usually only for characters with a reason to know them, so tables
   typically need the DM to sign off. */
export var LANGUAGE_GROUP_LABELS = {
  "Standard":"Standard",
  "Exotic":"Exotic (requires DM approval)",
  "Secret":"Secret"
};
export var LANGUAGE_LIST = Object.keys(LANGUAGES).reduce(function(all, group){
  return all.concat(LANGUAGES[group]);
}, []);
