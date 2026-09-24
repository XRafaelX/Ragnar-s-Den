/* ---------------- App state & persistence ---------------- */
export var STORAGE_KEY = "ragnarsDen.characters.v1";

export var state = {
  characters: [],
  activeId: null,
  activeTab: "vitals"
};

/* ---------------- Persistence ---------------- */
export function load(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    state.characters = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error("Failed to load vault data", e);
    state.characters = [];
  }
}
export function save(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
  }catch(e){
    alert("Could not save. Your browser storage may be full or restricted.");
    console.error(e);
  }
}

export function getActive(){
  return state.characters.find(function(c){ return c.id===state.activeId; });
}
