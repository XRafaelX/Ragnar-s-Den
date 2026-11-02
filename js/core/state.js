/* ---------------- App state & persistence ---------------- */
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
  }catch(e){
    console.error("Failed to load vault data", e);
    state.characters = [];
  }
  state.hiddenCharacters = []; hiddenAfter = {};
}
export function save(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allCharacters()));
  }catch(e){
    alert("Could not save. Your browser storage may be full or restricted.");
    console.error(e);
  }
}

export function getActive(){
  return state.characters.find(function(c){ return c.id===state.activeId; });
}
