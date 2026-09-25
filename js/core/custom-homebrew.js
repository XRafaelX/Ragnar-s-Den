import { RACES, RACE_TRAITS, RACE_LANGUAGES, raceSummary } from "../data/races.js";
import { RACE_DATA } from "../data/race-data.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_LANGUAGES, BACKGROUND_TOOLS } from "../data/backgrounds.js";
import { state, save } from "./state.js";
import { uid } from "./helpers.js";

/* ---------------- Custom (homebrew) races and backgrounds ----------------
   Made in the Compendium and saved in this browser, apart from any one
   character. Merged into the same tables the built-in ones live in (a
   "Homebrew" group in RACES / BACKGROUNDS, plus RACE_DATA, RACE_TRAITS,
   RACE_LANGUAGES, BACKGROUND_INFO, …) so the creation wizard, the sheet
   and the Compendium treat them like any other. Characters store their
   race and background by name, so a rename here follows onto them.

   Race entry:       {id, name, blurb, asi:{str…}, size, speed:{walk, fly,
                      swim, climb}, darkvision, languages:{fixed, choose},
                      traits:[{name, text}]}
   Background entry: {id, name, blurb, skills:[…], tools, languages:n,
                      feature:{name, text}} */

export var HOMEBREW_GROUP = "Homebrew";

var KINDS = {
  race: {
    key: "ragnarsDen.customRaces.v1",
    groups: RACES,
    add: function(e){
      RACE_DATA[e.name] = {asi:e.asi||{}, size:e.size||"Medium", speed:e.speed||{walk:30}, darkvision:Number(e.darkvision)||0,
        languages:e.languages||{fixed:["Common"]}, traits:e.traits||[], source:"Homebrew", blurb:e.blurb||"", custom:true, id:e.id};
      RACE_TRAITS[e.name] = (e.blurb ? e.blurb.replace(/\.?$/, ". ") : "") + raceSummary(RACE_DATA[e.name]);
      RACE_LANGUAGES[e.name] = RACE_DATA[e.name].languages;
    },
    remove: function(name){ delete RACE_DATA[name]; delete RACE_TRAITS[name]; delete RACE_LANGUAGES[name]; },
    field: "race"
  },
  background: {
    key: "ragnarsDen.customBackgrounds.v1",
    groups: BACKGROUNDS,
    add: function(e){
      BACKGROUND_INFO[e.name] = {skills:e.skills||[], blurb:e.blurb || autoBackgroundBlurb(e), feature:e.feature||null, custom:true, id:e.id};
      BACKGROUND_LANGUAGES[e.name] = Number(e.languages)||0;
      BACKGROUND_TOOLS[e.name] = e.tools || "None";
    },
    remove: function(name){ delete BACKGROUND_INFO[name]; delete BACKGROUND_LANGUAGES[name]; delete BACKGROUND_TOOLS[name]; },
    field: "background"
  }
};
var lists = {race:[], background:[]};

/* A background saved without a description still gets a useful line
   (the wizard shows it when you pick the background). */
function autoBackgroundBlurb(e){
  var skills = (e.skills||[]).filter(Boolean);
  var parts = [];
  if(skills.length) parts.push("Grants "+skills.join(" and "));
  var n = Number(e.languages)||0;
  if(n) parts.push((parts.length ? "plus " : "Grants ")+n+" language"+(n>1 ? "s" : "")+" of your choice");
  var out = parts.join(", ");
  if(e.feature && e.feature.name) out += (out ? ". " : "")+"Feature: "+e.feature.name;
  return out ? out+"." : "A custom background.";
}

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

/* Rebuild the homebrew part of the tables for one kind. */
var merged = {race:[], background:[]};
function merge(kind){
  var k = KINDS[kind];
  merged[kind].forEach(function(name){ k.remove(name); });
  merged[kind] = [];
  delete k.groups[HOMEBREW_GROUP];
  if(!lists[kind].length) return;
  k.groups[HOMEBREW_GROUP] = [];
  lists[kind].forEach(function(e){
    k.add(e);
    k.groups[HOMEBREW_GROUP].push(e.name);
    merged[kind].push(e.name);
  });
}

export function loadHomebrew(){
  ["race","background"].forEach(function(kind){ lists[kind] = read(kind); merge(kind); });
}
export function getHomebrew(kind){ return lists[kind].slice(); }
export function getHomebrewEntry(kind, id){ return lists[kind].find(function(e){ return e.id===id; }) || null; }

/* Why this name can't be used ("" if it can). */
export function homebrewNameProblem(kind, name, ownId){
  var lower = name.trim().toLowerCase();
  if(Object.keys(KINDS[kind].groups).some(function(g){
    return g!==HOMEBREW_GROUP && KINDS[kind].groups[g].some(function(n){ return n.toLowerCase()===lower; });
  })) return "There's already a "+kind+" called "+name.trim()+".";
  var clash = lists[kind].some(function(e){ return e.name.toLowerCase()===lower && e.id!==ownId; });
  return clash ? "You already made a "+kind+" called "+name.trim()+"." : "";
}

export function charactersUsingHomebrew(kind, entry){
  return state.characters.filter(function(c){ return c[KINDS[kind].field]===entry.name; });
}

/* Add or update (matching id); returns the saved entry. */
export function saveHomebrew(kind, entry){
  var clean = JSON.parse(JSON.stringify(entry));
  clean.id = clean.id || uid();
  clean.name = clean.name.trim();
  clean.blurb = (clean.blurb||"").trim();
  var old = getHomebrewEntry(kind, clean.id);
  if(old && old.name!==clean.name){
    // Characters store it by name: follow the rename.
    var field = KINDS[kind].field;
    state.characters.forEach(function(c){ if(c[field]===old.name) c[field] = clean.name; });
    save();
  }
  if(old) lists[kind][lists[kind].indexOf(old)] = clean; else lists[kind].push(clean);
  write(kind);
  merge(kind);
  return clean;
}

export function deleteHomebrew(kind, id){
  lists[kind] = lists[kind].filter(function(e){ return e.id!==id; });
  write(kind);
  merge(kind);
}

/* Backups: added unless the name is already taken. */
export function importHomebrew(kind, entries){
  var added = 0;
  (entries||[]).forEach(function(e){
    if(!e || !e.name || homebrewNameProblem(kind, e.name, null)) return;
    var copy = JSON.parse(JSON.stringify(e));
    copy.id = uid();
    lists[kind].push(copy);
    added++;
  });
  if(added){ write(kind); merge(kind); }
  return added;
}
