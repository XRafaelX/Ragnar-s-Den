/* ---------------- Language data (SRD, plus dialects and setting languages) ----------------
   Standard, Exotic and Secret are the Player's Handbook's tables. Primordial
   is a family of four dialects (Auran, Aquan, Ignan, Terran; speakers of
   different dialects understand each other), which races name on their
   own. The setting languages are ones a race or background in the app
   teaches (a Vedalken's Vedalken, a Shade Fanatic's Netherese). */
export var LANGUAGES = {
  "Standard": [
    "Common","Dwarvish","Elvish","Giant","Gnomish","Goblin","Halfling","Orc"
  ],
  "Exotic": [
    "Abyssal","Celestial","Deep Speech","Draconic","Infernal","Primordial","Sylvan","Undercommon"
  ],
  "Primordial dialects": [
    "Aquan","Auran","Ignan","Terran"
  ],
  "Setting": [
    "Aarakocra","Gith","Kraul","Loxodon","Minotaur","Netherese","Vedalken"
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
  "Primordial dialects":"Primordial dialects (requires DM approval)",
  "Setting":"Setting languages (requires DM approval)",
  "Secret":"Secret"
};
export var LANGUAGE_LIST = Object.keys(LANGUAGES).reduce(function(all, group){
  return all.concat(LANGUAGES[group]);
}, []);
/* The groups a "language of your choice" offers: everything but the
   secret languages (a class teaches those). exoticOnly leaves out the
   standard ones too, for a background that asks for an exotic language. */
var ANY_GROUPS = ["Standard","Exotic","Primordial dialects","Setting"];
export function languagePickerGroups(exoticOnly){
  var out = {};
  ANY_GROUPS.forEach(function(g){
    if(exoticOnly && g==="Standard") return;
    out[LANGUAGE_GROUP_LABELS[g]] = LANGUAGES[g];
  });
  return out;
}
export var ANY_LANGUAGES = ANY_GROUPS.reduce(function(all, g){ return all.concat(LANGUAGES[g]); }, []);
