import { state } from "../core/state.js";
import { characterIsCaster } from "../core/helpers.js";
import { openCatalogPicker } from "../ui/catalog-picker.js";
import { SPELL_DATA, buildSpellGroups, spellDataForClass } from "../data/spells.js";
import { spellSection, addCatalogSpell, addCustomSpell } from "./panels/spell-picker.js";
import { renderAll } from "./sheet.js";
import { chooseCharacter } from "../ui/character-picker.js";
import { showActionToast } from "../ui/toast.js";

/* The Spellbook; the home screen's standalone entry into the spell
   catalogue the Spells tab's "+ Add Spell" uses, so players can look
   spells up (or plan a class) without opening a character. Browsing
   always works; adding asks which character, offering only those that
   can cast, since the Spells tab is hidden for everyone else. */

function casters(){
  return state.characters.filter(characterIsCaster);
}

function spellClassNames(){
  var seen = {};
  Object.keys(SPELL_DATA).forEach(function(name){
    SPELL_DATA[name].classes.forEach(function(cl){ seen[cl] = true; });
  });
  return Object.keys(seen).sort();
}

/* Runs `give(c)` for a chosen spellcaster, or explains why it can't. */
function withCaster(give){
  var list = casters();
  if(!list.length){
    showActionToast(state.characters.length
      ? "None of your characters can cast spells yet."
      : "Create a spellcasting character to add spells.", true);
    return;
  }
  chooseCharacter(give, list);
}

function onAdd(name, d){
  withCaster(function(c){
    if(addCatalogSpell(c, name, d) === false) return; // already known; it toasted
    renderAll();
    showActionToast('Added "' + name + '" to ' + (c.name||"Unnamed") + "’s spells.");
  });
  return false; // the add happens after the character pick, so no flash
}

function onCustom(fields){
  withCaster(function(c){
    addCustomSpell(c, fields);
    renderAll();
    showActionToast('Added "' + fields.name + '" to ' + (c.name||"Unnamed") + "’s spells.");
  });
}

export function openSpellbook(){
  var sections = [spellSection("all", "All spells", buildSpellGroups(), SPELL_DATA, onAdd, onCustom)];
  spellClassNames().forEach(function(cl){
    sections.push(spellSection("class-" + cl, cl, buildSpellGroups(cl), spellDataForClass(cl), onAdd, onCustom));
  });
  openCatalogPicker({
    sections: sections,
    onClose: function(){ renderAll(); }
  });
}
