import { state } from "../core/state.js";
import { characterIsCaster } from "../core/helpers.js";
import { openCatalogPicker, refreshCatalog } from "../ui/catalog-picker.js";
import { SPELL_DATA, buildSpellGroups, spellDataForClass } from "../data/spells.js";
import { spellSection, addCatalogSpell } from "./panels/spell-picker.js";
import { spellFromCatalog, useSpellsOf, setSpellEdition, characterSpellEdition } from "../core/spell-edition.js";
import { saveCustomSpell } from "../core/custom-spells.js";
import { save } from "../core/state.js";
import { renderAll } from "./sheet.js";
import { chooseCharacter } from "../ui/character-picker.js";
import { showActionToast } from "../ui/toast.js";
import { playAdd } from "../ui/sound.js";

/* The Spellbook; the home screen's standalone entry into the spell
   catalogue. Browsing always works; adding a built-in spell asks which
   caster to add it to. Creating a custom spell via the + FAB saves it to
   the homebrew registry first, then offers to add it to a character.

   Which book's spells it shows ("2014" or "2024"): the 2024 Player's
   Handbook's when every caster uses those rules, else the 2014 ones, and
   the switch beside the search changes it. A spell is always added in
   the chosen character's own edition. The sheet behind redraws to the
   open character's edition (none on the home screen: 2014), so the
   Spellbook's is put back after each add. */
var shown = "2014";

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
  // Always asked, even with one caster: the player sees who gets it.
  chooseCharacter(give, list, {always: true});
}

/* Add a catalog spell to a caster, in that character's own edition (a
   2024 character gets the 2024 Cure Wounds), then put the Spellbook's
   edition back. "added", "known" (already on the sheet: it said so) or
   "missing" (not in that character's rules: Divine Smite for a 2014
   paladin). */
export function addFromSpellbook(c, name){
  useSpellsOf(c);
  var d = SPELL_DATA[name];
  var result = !d ? "missing" : addCatalogSpell(c, name, d) === false ? "known" : "added";
  setSpellEdition(shown);
  return result;
}

function onAdd(name){
  withCaster(function(c){
    var result = addFromSpellbook(c, name);
    if(result==="missing"){
      showActionToast('"' + name + '" isn\'t in the ' + characterSpellEdition(c) + " rules that " + (c.name || "this character") + " uses.", true);
      return;
    }
    if(result==="known") return;
    renderAll();
    setSpellEdition(shown);
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
    setSpellEdition(shown);
    showActionToast('Added "' + saved.name + '" to ' + (c.name || "Unnamed") + "'s spells.");
  });
}

export function openSpellbook(){
  var list = casters();
  shown = list.length && list.every(function(c){ return characterSpellEdition(c)==="2024"; }) ? "2024" : "2014";
  setSpellEdition(shown);
  var sections = spellbookSections();
  openCatalogPicker({
    sections: sections,
    headerExtra: editionSwitch(sections),
    onClose: function(){ renderAll(); }
  });
}

/* "All spells" first (includes Homebrew group), then one tab per class,
   from the edition shown. */
function spellbookSections(){
  var sections = [spellSection("all", "All spells", buildSpellGroups(), SPELL_DATA, onAdd, onCustomSaved)];
  spellClassNames().forEach(function(cl){
    // Class tabs include what Tasha's optional Additional Spells adds (marked on each row).
    sections.push(spellSection("class-" + cl, cl, buildSpellGroups(cl, true), spellDataForClass(cl, true), onAdd, onCustomSaved, cl));
  });
  return sections;
}

/* "2014 | 2024" beside the search: which book's spells to show. The tab
   and the search stay as they are. (Both editions have the same tabs.) */
function editionSwitch(sections){
  var wrap = document.createElement("div");
  wrap.className = "catalog-edition";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Rules edition");
  ["2014", "2024"].forEach(function(ed){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ff-pill" + (ed===shown ? " active" : "");
    b.textContent = ed;
    b.title = ed==="2024" ? "Spells from the 2024 Player's Handbook" : "Spells from the 2014 books";
    b.setAttribute("aria-pressed", ed===shown ? "true" : "false");
    b.addEventListener("click", function(){
      if(ed===shown) return;
      shown = ed;
      setSpellEdition(shown);
      var fresh = spellbookSections();
      sections.forEach(function(sec, i){ Object.assign(sec, fresh[i]); });
      wrap.querySelectorAll(".ff-pill").forEach(function(p){
        var on = p.textContent===shown;
        p.classList.toggle("active", on);
        p.setAttribute("aria-pressed", on ? "true" : "false");
      });
      refreshCatalog();
    });
    wrap.appendChild(b);
  });
  return wrap;
}
