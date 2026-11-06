/* ---------------- Which edition's spells ----------------
   A character on the 2024 rules (usesRules2024: the Optional rules card,
   a 2024 background or species) or with a 2024 class (a class entry's
   edition "2024") reads and rolls the 2024 Player's Handbook's spells;
   everyone else the 2014 ones. The 2024 entries (js/data/spells-2024.js)
   and their scaling (SPELL_SCALING_2024) are swapped into SPELL_DATA and
   SPELL_SCALING in place, so every screen that reads them follows: the
   sheet, its spell pickers, the level-up and the creation wizard set the
   edition for the character they show (useSpellsOf). A 2024-only spell
   (Divine Smite, Starry Wisp) is there only while the 2024 edition is.
   A spell the character has saved follows too, except for what the
   player edited (syncSavedSpells). */
import { SPELL_DATA, catalogSpellName } from "../data/spells.js";
import { SPELL_DATA_2024 } from "../data/spells-2024.js";
import { SPELL_SCALING, SPELL_SCALING_2024 } from "../data/spell-scaling.js";
import { RACE_DATA } from "../data/race-data.js";
import { BACKGROUND_INFO } from "../data/backgrounds.js";
import { setWeaponEdition, useWeaponsOf } from "./weapon-edition.js";

var current = "2014";
var saved = null; // {spells: {name: 2014 entry or undefined}, scaling: {...}}

/* "2024" or "2014": the edition this character's spells follow. */
export function characterSpellEdition(c){
  if(!c) return "2014";
  // (usesRules2024's test, kept to data so this loads before the core modules.)
  var rules = !!(c.rules2024 || (BACKGROUND_INFO[c.background] || {}).edition==="2024" || (RACE_DATA[c.race] || {}).edition==="2024");
  return rules || (c.classes||[]).some(function(cl){ return cl && cl.edition==="2024"; }) ? "2024" : "2014";
}
export function spellEdition(){ return current; }
/* The 2014 spells the 2024 book replaced under a new name (its index:
   "Feeblemind spell. See Befuddlement"). On the 2024 rules they stay on
   offer, at the end of the lists as "Older version (2014)". */
var OLDER_SPELLS = {"Feeblemind": "Befuddlement", "Branding Smite": "Shining Smite"};
/* The 2024 spell that replaced this one, while the 2024 edition is on ("" otherwise). */
export function newerSpellOf(name){
  return current==="2024" && OLDER_SPELLS[name] && SPELL_DATA[OLDER_SPELLS[name]] ? OLDER_SPELLS[name] : "";
}
/* Switch the catalog to an edition's spells. */
export function setSpellEdition(edition){
  edition = edition==="2024" ? "2024" : "2014";
  // (The 2024 weapon stats follow the same rule: js/core/weapon-edition.js.)
  setWeaponEdition(edition);
  if(edition===current) return;
  if(edition==="2024"){
    saved = {spells: {}, scaling: {}};
    Object.keys(SPELL_DATA_2024).forEach(function(n){
      saved.spells[n] = SPELL_DATA[n];
      SPELL_DATA[n] = SPELL_DATA_2024[n];
    });
    Object.keys(SPELL_SCALING_2024).forEach(function(n){
      saved.scaling[n] = SPELL_SCALING[n];
      if(SPELL_SCALING_2024[n]===null) delete SPELL_SCALING[n]; else SPELL_SCALING[n] = SPELL_SCALING_2024[n];
    });
  } else if(saved){
    Object.keys(saved.spells).forEach(function(n){
      if(saved.spells[n]===undefined) delete SPELL_DATA[n]; else SPELL_DATA[n] = saved.spells[n];
    });
    Object.keys(saved.scaling).forEach(function(n){
      if(saved.scaling[n]===undefined) delete SPELL_SCALING[n]; else SPELL_SCALING[n] = saved.scaling[n];
    });
    saved = null;
  }
  current = edition;
}
/* A saved spell keeps its own copy of the catalog's words (spellFromCatalog),
   which the player can edit. A field still holding the other edition's
   words moves to this edition's, and one the player changed stays. */
var COPIED = ["school", "castingTime", "range", "components", "material", "duration", "concentration", "ritual", "summary"];
function syncSavedSpells(c){
  (c.spells||[]).forEach(function(sp){
    var name = catalogSpellName((sp.name||"").trim()), newer = SPELL_DATA_2024[name];
    if(!newer || sp.homebrewId) return;
    var older = current==="2024" ? saved.spells[name] : SPELL_DATA[name];
    if(!older) return; // (a 2024-only spell has no 2014 words to move from)
    var from = current==="2024" ? older : newer, to = current==="2024" ? newer : older;
    COPIED.forEach(function(k){
      if(sp[k]!==undefined && sp[k]===from[k]) sp[k] = to[k];
    });
  });
}
/* Switch to the edition this character's spells follow. */
export function useSpellsOf(c){
  setSpellEdition(characterSpellEdition(c));
  if(c) syncSavedSpells(c);
  useWeaponsOf(c, characterSpellEdition(c));
}
