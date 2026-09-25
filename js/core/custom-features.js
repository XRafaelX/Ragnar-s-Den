import { FEATS_CATALOG } from "../data/feats.js";
import { state, save } from "./state.js";
import { uid } from "./helpers.js";

/* ---------------- Custom (homebrew) feats and features ----------------
   Made in the Compendium's Feats tab and saved in this browser, apart
   from any one character, so they can be given to any character again
   and again.
     feature: {id, name, source, isPassive, text}
     feat:    {id, name, category, prerequisite, summary, description}
   Custom feats are also merged into FEATS_CATALOG (custom:true, id), so
   the feat picker, level-up and the creation wizard offer them like the
   built-in ones.
   A character that takes one gets its own copy (in c.features / c.feats)
   linked back with homebrewId: editing the entry here updates every
   linked copy, and deleting it here leaves the characters' copies alone. */

export var FEATURE_SOURCES = ["Class","Race","Background","Passive","Magic Item","Other"];
export var FEAT_CATEGORIES = ["Combat","Defense","Magic","Physical","Utility","Support","Movement","Social","General"];

/* A feat saved without a summary uses the start of its description (the
   feat lists show the summary under the name). */
function featSummary(e){
  if(e.summary) return e.summary;
  var first = (e.description||"").trim().split(/\n/)[0];
  return first.length>140 ? first.slice(0, 137).replace(/\s+\S*$/, "")+"…" : first;
}

var KINDS = {
  feature: {
    key: "ragnarsDen.customFeatures.v1",
    charList: "features",
    clean: function(e){
      return {name:e.name.trim(), source:FEATURE_SOURCES.indexOf(e.source)!==-1 ? e.source : "Other",
        isPassive:!!e.isPassive, text:(e.text||"").trim()};
    },
    apply: function(copy, e){ copy.name = e.name; copy.source = e.source; copy.isPassive = e.isPassive; copy.text = e.text; }
  },
  feat: {
    key: "ragnarsDen.customFeats.v1",
    charList: "feats",
    clean: function(e){
      return {name:e.name.trim(), category:FEAT_CATEGORIES.indexOf(e.category)!==-1 ? e.category : "General",
        prerequisite:(e.prerequisite||"").trim() || "None", summary:(e.summary||"").trim(), description:(e.description||"").trim()};
    },
    apply: function(copy, e){
      copy.name = e.name; copy.category = e.category; copy.prerequisite = e.prerequisite;
      copy.summary = featSummary(e); copy.description = e.description; copy.source = "Custom";
    }
  }
};
var lists = {feature:[], feat:[]};

function read(kind){
  try{
    var raw = localStorage.getItem(KINDS[kind].key);
    var data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  }catch(e){ return []; }
}
function write(kind){
  try{ localStorage.setItem(KINDS[kind].key, JSON.stringify(lists[kind])); }
  catch(e){ alert("Could not save. Your browser storage may be full or restricted."); }
}

/* Rebuild the custom part of FEATS_CATALOG. */
function mergeFeats(){
  for(var i=FEATS_CATALOG.length-1; i>=0; i--) if(FEATS_CATALOG[i].custom) FEATS_CATALOG.splice(i, 1);
  lists.feat.forEach(function(e){
    FEATS_CATALOG.push({name:e.name, prerequisite:e.prerequisite, category:e.category, summary:featSummary(e),
      description:e.description, custom:true, id:e.id});
  });
}

export function loadCustomFeatures(){
  lists.feature = read("feature");
  lists.feat = read("feat");
  mergeFeats();
}
export function getCustom(kind){ return lists[kind].slice(); }
export function getCustomEntry(kind, id){ return lists[kind].find(function(e){ return e.id===id; }) || null; }

/* Why this name can't be used ("" if it can). */
export function customNameProblem(kind, name, ownId){
  var lower = name.trim().toLowerCase();
  if(kind==="feat" && FEATS_CATALOG.some(function(f){ return !f.custom && f.name.toLowerCase()===lower; }))
    return "There's already a feat called "+name.trim()+".";
  var clash = lists[kind].some(function(e){ return e.name.toLowerCase()===lower && e.id!==ownId; });
  return clash ? "You already made a "+kind+" called "+name.trim()+"." : "";
}

export function characterHasCustom(kind, c, entry){
  return (c[KINDS[kind].charList]||[]).some(function(f){ return f.homebrewId===entry.id; });
}
export function charactersWithCustom(kind, entry){
  return state.characters.filter(function(c){ return characterHasCustom(kind, c, entry); });
}

/* Give a character its own linked copy. */
export function addCustomToCharacter(kind, c, entry){
  var listName = KINDS[kind].charList;
  if(!c[listName]) c[listName] = [];
  var copy = {id:uid(), homebrewId:entry.id};
  KINDS[kind].apply(copy, entry);
  c[listName].push(copy);
  save();
  return copy;
}
/* Link a copy the character already has (made before the Compendium kept
   them) to a library entry. */
export function linkCharacterCopy(kind, copy, entry){
  copy.homebrewId = entry.id;
  KINDS[kind].apply(copy, entry);
  save();
}

/* Add or update (matching id); linked copies on characters follow.
   Returns the saved entry. */
export function saveCustom(kind, entry){
  var k = KINDS[kind];
  var clean = k.clean(entry);
  clean.id = entry.id || uid();
  var old = getCustomEntry(kind, clean.id);
  if(old){
    lists[kind][lists[kind].indexOf(old)] = clean;
    var changed = false;
    state.characters.forEach(function(c){
      (c[k.charList]||[]).forEach(function(f){ if(f.homebrewId===clean.id){ k.apply(f, clean); changed = true; } });
    });
    if(changed) save();
  } else lists[kind].push(clean);
  write(kind);
  if(kind==="feat") mergeFeats();
  return clean;
}

export function deleteCustom(kind, id){
  lists[kind] = lists[kind].filter(function(e){ return e.id!==id; });
  write(kind);
  if(kind==="feat") mergeFeats();
}

/* Backups: added unless the name is already taken. Returns {oldId: newId}
   (a taken name maps onto the existing entry) so imported characters'
   copies can be relinked. */
export function importCustom(kind, entries){
  var idMap = {}, added = 0;
  (entries||[]).forEach(function(e){
    if(!e || !e.name) return;
    var lower = String(e.name).trim().toLowerCase();
    var same = lists[kind].find(function(x){ return x.name.toLowerCase()===lower; });
    if(same){ if(e.id) idMap[e.id] = same.id; return; }
    if(customNameProblem(kind, String(e.name), null)) return; // a built-in feat's name
    var copy = KINDS[kind].clean(Object.assign({}, e, {name:String(e.name)}));
    copy.id = uid();
    if(e.id) idMap[e.id] = copy.id;
    lists[kind].push(copy);
    added++;
  });
  if(added){ write(kind); if(kind==="feat") mergeFeats(); }
  return idMap;
}
