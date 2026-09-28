import { state } from "../core/state.js";
import { characterIsCaster } from "../core/helpers.js";
import { openCatalogPicker } from "../ui/catalog-picker.js";
import { SPELL_DATA, buildSpellGroups, spellDataForClass } from "../data/spells.js";
import { spellSection, addCatalogSpell, spellFromCatalog } from "./panels/spell-picker.js";
import { saveCustomSpell } from "../core/custom-spells.js";
import { save } from "../core/state.js";
import { renderAll } from "./sheet.js";
import { chooseCharacter } from "../ui/character-picker.js";
import { showActionToast } from "../ui/toast.js";
import { playAdd } from "../ui/sound.js";

/* The Spellbook; the home screen's standalone entry into the spell
   catalogue. Browsing always works; adding a built-in spell asks which
   caster to add it to. Creating a custom spell via the + FAB saves it to
   the homebrew registry first, then offers to add it to a character. */

function casters(){
  return state.characters.filter(characterIsCaster);
}

function spellClassNames(){
  var seen = {};
  Object.keys(SPELL_DATA).forEach(function(name){
    (SPELL_DATA[name].classes || []).forEach(function(cl){ seen[cl] = true; });
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
    showActionToast('Added "' + name + '" to ' + (c.name || "Unnamed") + "'s spells.");
  });
  return false; // add happens after character pick, so suppress the inline badge
}

/* Called by the custom form after it saves to the registry.
   `saved` is the persisted registry entry (has an id).
   Optionally offer to add it to a caster. */
function onCustomSaved(saved){
  playAdd();
  showActionToast('Created "' + saved.name + '". It\'s under Homebrew for every spellcaster.');
  withCaster(function(c){
    var already = (c.spells || []).some(function(sp){
      return (sp.name || "").toLowerCase() === saved.name.toLowerCase();
    });
    if(!already){
      c.spells.push(spellFromCatalog(saved.name, SPELL_DATA[saved.name] || saved));
      save();
    }
    renderAll();
    showActionToast('Added "' + saved.name + '" to ' + (c.name || "Unnamed") + "'s spells.");
  });
}

export function openSpellbook(){
  // "All spells" first (includes Homebrew group), then one tab per class
  var sections = [spellSection("all", "All spells", buildSpellGroups(), SPELL_DATA, onAdd, onCustomSaved)];
  spellClassNames().forEach(function(cl){
    sections.push(spellSection("class-" + cl, cl, buildSpellGroups(cl), spellDataForClass(cl), onAdd, onCustomSaved));
  });
  openCatalogPicker({
    sections: sections,
    onClose: function(){ renderAll(); }
  });
}
