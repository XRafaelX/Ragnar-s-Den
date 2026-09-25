import { SUBCLASSES } from "../data/progression.js";
import { state, save } from "./state.js";
import { uid } from "./helpers.js";

/* ---------------- Custom (homebrew) subclasses ----------------
   Made in the Compendium and saved in this browser, apart from any one
   character, so every character can take them. Stored as
     {id, className, name, blurb, features:[{level, name, text}]}
   and merged into SUBCLASSES (as {name, blurb, features:{level:[…]},
   custom:true, id}) so the level-up and creation pickers, the sheet's
   feature list and the Compendium all see them like the built-in ones.
   Characters remember their subclass by name, so renaming one here
   renames it on characters too. */

export var CUSTOM_SUBCLASSES_KEY = "ragnarsDen.customSubclasses.v1";
var list = [];

function readStorage(){
  try{
    var raw = localStorage.getItem(CUSTOM_SUBCLASSES_KEY);
    var data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  }catch(e){ return []; }
}
function writeStorage(){
  try{ localStorage.setItem(CUSTOM_SUBCLASSES_KEY, JSON.stringify(list)); }
  catch(e){ alert("Could not save. Your browser storage may be full or restricted."); }
}

function toSubclass(entry){
  var byLevel = {};
  (entry.features||[]).forEach(function(f){
    var lv = Number(f.level)||1;
    (byLevel[lv] = byLevel[lv] || []).push({name:f.name, text:f.text||""});
  });
  return {name:entry.name, blurb:entry.blurb||"", features:byLevel, custom:true, id:entry.id};
}

/* Rebuild the custom part of SUBCLASSES from `list`. */
function merge(){
  Object.keys(SUBCLASSES).forEach(function(cls){
    SUBCLASSES[cls] = SUBCLASSES[cls].filter(function(s){ return !s.custom; });
  });
  list.forEach(function(entry){
    if(!SUBCLASSES[entry.className]) SUBCLASSES[entry.className] = [];
    SUBCLASSES[entry.className].push(toSubclass(entry));
  });
}

export function loadCustomSubclasses(){
  list = readStorage();
  merge();
}

export function getCustomSubclasses(){ return list.slice(); }
export function getCustomSubclass(id){ return list.find(function(e){ return e.id===id; }) || null; }

/* Why this name can't be used for a class ("" if it can): another
   subclass of the same class already has it. */
export function subclassNameProblem(className, name, ownId){
  var taken = (SUBCLASSES[className]||[]).some(function(s){
    return s.name.toLowerCase()===name.toLowerCase() && s.id!==ownId;
  });
  return taken ? className+" already has a subclass called "+name+"." : "";
}

/* Add or update (matching id). Returns the saved entry. */
export function saveCustomSubclass(entry){
  var clean = {
    id: entry.id || uid(),
    className: entry.className,
    name: entry.name.trim(),
    blurb: (entry.blurb||"").trim(),
    features: (entry.features||[])
      .filter(function(f){ return f.name && f.name.trim(); })
      .map(function(f){ return {level:Math.max(1, Math.min(20, Number(f.level)||1)), name:f.name.trim(), text:(f.text||"").trim()}; })
      .sort(function(a, b){ return a.level - b.level; })
  };
  var old = getCustomSubclass(clean.id);
  if(old && (old.name!==clean.name || old.className!==clean.className)){
    // Characters store the subclass by name: follow the rename, and drop
    // it from characters if it moved to another class.
    state.characters.forEach(function(c){
      (c.classes||[]).forEach(function(cl){
        if(cl.name===old.className && cl.subclass===old.name) cl.subclass = cl.name===clean.className ? clean.name : "";
      });
    });
    save();
  }
  if(old) list[list.indexOf(old)] = clean; else list.push(clean);
  writeStorage();
  merge();
  return clean;
}

/* How many characters currently use it (shown before deleting). */
export function charactersUsing(entry){
  return state.characters.filter(function(c){
    return (c.classes||[]).some(function(cl){ return cl.name===entry.className && cl.subclass===entry.name; });
  });
}

export function deleteCustomSubclass(id){
  list = list.filter(function(e){ return e.id!==id; });
  writeStorage();
  merge();
}

/* Backups: custom subclasses travel with the characters. Imported ones
   are added unless the class already has a subclass with that name. */
export function importCustomSubclasses(entries){
  var added = 0;
  (entries||[]).forEach(function(e){
    if(!e || !e.className || !e.name) return;
    if(subclassNameProblem(e.className, e.name, null)) return;
    list.push({id:uid(), className:e.className, name:e.name, blurb:e.blurb||"", features:e.features||[]});
    merge();
    added++;
  });
  if(added) writeStorage();
  return added;
}
