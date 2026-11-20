/* ---------------- App state & persistence ---------------- */
import { noteChange } from "./backup-status.js";
import { reportSaveError } from "./save-error.js";
import { storedForm, syncPictures, takeMarkers } from "./picture-store.js";

export var STORAGE_KEY = "ragnarsDen.characters.v1";

export var state = {
  characters: [],
  // Characters set aside while private content is hidden (see
  // js/core/private-content.js): never listed or opened, saved untouched.
  hiddenCharacters: [],
  activeId: null,
  activeTab: "vitals"
};
var hiddenAfter = {};   // hidden id -> the visible id it came after (null: first)

/* Every character, hidden ones back in the places they were set aside
   from (after the same neighbour; at the end if that one is gone). */
export function allCharacters(){
  if(!state.hiddenCharacters.length) return state.characters;
  var out = [], placed = {};
  function after(id){
    state.hiddenCharacters.forEach(function(h){
      if(!placed[h.id] && hiddenAfter[h.id] === id){ placed[h.id] = true; out.push(h); }
    });
  }
  after(null);
  state.characters.forEach(function(c){ out.push(c); after(c.id); });
  state.hiddenCharacters.forEach(function(h){ if(!placed[h.id]) out.push(h); });
  return out;
}

/* Set aside the characters `hide(c)` picks (null: none, bring all back).
   An active character that is set aside closes. */
export function splitCharacters(hide){
  var all = allCharacters(), prev = null;
  state.characters = []; state.hiddenCharacters = []; hiddenAfter = {};
  all.forEach(function(c){
    if(hide && hide(c)){ state.hiddenCharacters.push(c); hiddenAfter[c.id] = prev; }
    else { state.characters.push(c); prev = c.id; }
  });
  if(state.activeId && !state.characters.some(function(c){ return c.id === state.activeId; })) state.activeId = null;
}

/* ---------------- Persistence ---------------- */
export function load(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    state.characters = raw ? JSON.parse(raw) : [];
    // Pictures kept in the browser's database come back later
    // (loadPictures in js/core/picture-store.js), never as a marker.
    if(Array.isArray(state.characters)) takeMarkers(state.characters);
  }catch(e){
    console.error("Failed to load vault data", e);
    state.characters = [];
  }
  state.hiddenCharacters = []; hiddenAfter = {};
}
/* Pictures already safe in the browser's database are saved as a marker
   (js/core/picture-store.js), so a save writes a few kilobytes. New
   pictures are stored after the save, which then runs once more. That
   also happens after a failed save: moving the pictures out may be what
   makes room. */
export function save(){
  var all = allCharacters();
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedForm(all)));
    noteChange();
  }catch(e){
    reportSaveError(e);
  }
  syncPictures(all, save);
}

export function getActive(){
  return state.characters.find(function(c){ return c.id===state.activeId; });
}
