import { WEAPON_GROUPS, WEAPON_DATA } from "../data/weapons.js";
import { ARMOR_GROUPS, ARMOR_DATA } from "../data/armor.js";
import { state, save } from "./state.js";
import { uid } from "./helpers.js";

/* ---------------- Custom (homebrew) weapons and armor ----------------
   Made in the Armory (or from a sheet's Add Weapon / Add Armor) and saved
   in this browser, apart from any one character, so any character can
   take them. Merged into WEAPON_GROUPS / WEAPON_DATA and ARMOR_GROUPS /
   ARMOR_DATA as a "Homebrew" group (custom:true, id), so the pickers, the
   hands/two-handed rules and infusions treat them like the built-in ones.
     weapon: {id, name, category:"simple"|"martial", ranged, damageDice,
              damageType, properties, tags:[…], extra} (properties is
              the text built from the form's tags + extra)
     armor:  {id, name, category:"light"|"medium"|"heavy"|"shield", baseAC,
              stealthDisadvantage}
   A character's inventory gets its own copy linked back with homebrewId:
   editing the entry updates the item's stats on every character (but not
   their qty, equipped, magic bonus or proficiency), and deleting it
   leaves the copies alone. */

export var ITEM_HOMEBREW_GROUP = "Homebrew";

export function weaponAbility(e){
  if(/finesse/i.test(e.properties||"")) return "finesse";
  return e.ranged ? "dex" : "str";
}
export function armorNote(e){ return e.stealthDisadvantage ? "Disadvantage on Stealth checks" : ""; }

var KINDS = {
  weapon: {
    key: "ragnarsDen.customWeapons.v1",
    groups: WEAPON_GROUPS, data: WEAPON_DATA,
    clean: function(e){
      return {name:e.name.trim(), category:e.category==="martial" ? "martial" : "simple", ranged:!!e.ranged,
        damageDice:(e.damageDice||"").trim(), damageType:e.damageType||"", properties:(e.properties||"").trim(),
        tags:Array.isArray(e.tags) ? e.tags.filter(function(t){ return typeof t==="string"; }) : undefined,
        extra:typeof e.extra==="string" ? e.extra : undefined};
    },
    toData: function(e){
      return {damageDice:e.damageDice, damageType:e.damageType, weight:0, category:e.category,
        finesse:weaponAbility(e)==="finesse", ranged:e.ranged, properties:e.properties, custom:true, id:e.id};
    },
    // The item's notes start as the properties; they follow an edit only
    // if the player hasn't changed them.
    apply: function(item, e, old){
      item.name = e.name; item.damageDice = e.damageDice; item.damageType = e.damageType; item.ability = weaponAbility(e);
      if(!old || (item.notes||"")===(old.properties||"")) item.notes = e.properties;
    }
  },
  armor: {
    key: "ragnarsDen.customArmor.v1",
    groups: ARMOR_GROUPS, data: ARMOR_DATA,
    clean: function(e){
      return {name:e.name.trim(), category:["light","medium","heavy","shield"].indexOf(e.category)!==-1 ? e.category : "light",
        baseAC:Math.max(0, Math.min(30, Number(e.baseAC)||0)), stealthDisadvantage:!!e.stealthDisadvantage};
    },
    toData: function(e){
      return {category:e.category, baseAC:e.baseAC, weight:0, stealthDisadvantage:e.stealthDisadvantage, custom:true, id:e.id};
    },
    apply: function(item, e, old){
      item.name = e.name; item.category = e.category; item.baseAC = e.baseAC;
      if(!old || (item.notes||"")===armorNote(old)) item.notes = armorNote(e);
    }
  }
};
var lists = {weapon:[], armor:[]};
var merged = {weapon:[], armor:[]};

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

/* Rebuild the Homebrew part of the tables for one kind. */
function merge(kind){
  var k = KINDS[kind];
  merged[kind].forEach(function(name){ delete k.data[name]; });
  merged[kind] = [];
  delete k.groups[ITEM_HOMEBREW_GROUP];
  if(!lists[kind].length) return;
  k.groups[ITEM_HOMEBREW_GROUP] = [];
  lists[kind].slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(e){
    k.data[e.name] = k.toData(e);
    k.groups[ITEM_HOMEBREW_GROUP].push(e.name);
    merged[kind].push(e.name);
  });
}

export function loadCustomItems(){
  ["weapon","armor"].forEach(function(kind){ lists[kind] = read(kind); merge(kind); });
}
export function getCustomItems(kind){ return lists[kind].slice(); }
export function getCustomItem(kind, id){ return lists[kind].find(function(e){ return e.id===id; }) || null; }

/* Why this name can't be used ("" if it can). */
export function itemNameProblem(kind, name, ownId){
  var lower = name.trim().toLowerCase();
  var noun = kind==="weapon" ? "weapon" : "armor";
  var groups = KINDS[kind].groups;
  if(Object.keys(groups).some(function(g){
    return g!==ITEM_HOMEBREW_GROUP && groups[g].some(function(n){ return n.toLowerCase()===lower; });
  })) return "There's already a "+noun+" called "+name.trim()+".";
  var clash = lists[kind].some(function(e){ return e.name.toLowerCase()===lower && e.id!==ownId; });
  return clash ? "You already made a "+noun+" called "+name.trim()+"." : "";
}

function copiesOf(entry){
  var out = [];
  state.characters.forEach(function(c){
    (c.inventory||[]).forEach(function(i){ if(i.homebrewId===entry.id) out.push({c:c, item:i}); });
  });
  return out;
}
export function charactersWithItem(entry){
  var seen = [];
  copiesOf(entry).forEach(function(x){ if(seen.indexOf(x.c)===-1) seen.push(x.c); });
  return seen;
}

/* Add or update (matching id); linked copies follow. Returns the entry. */
export function saveCustomItem(kind, entry){
  var k = KINDS[kind];
  var clean = k.clean(entry);
  clean.id = entry.id || uid();
  var old = getCustomItem(kind, clean.id);
  if(old){
    lists[kind][lists[kind].indexOf(old)] = clean;
    var copies = copiesOf(clean);
    copies.forEach(function(x){ k.apply(x.item, clean, old); });
    if(copies.length) save();
  } else lists[kind].push(clean);
  write(kind);
  merge(kind);
  return clean;
}

export function deleteCustomItem(kind, id){
  lists[kind] = lists[kind].filter(function(e){ return e.id!==id; });
  write(kind);
  merge(kind);
}

/* Backups: added unless the name is taken. Returns {oldId: newId} (a taken
   name maps onto your entry of that name) to relink imported items. */
export function importCustomItems(kind, entries){
  var idMap = {}, added = 0;
  (entries||[]).forEach(function(e){
    if(!e || !e.name) return;
    var lower = String(e.name).trim().toLowerCase();
    var same = lists[kind].find(function(x){ return x.name.toLowerCase()===lower; });
    if(same){ if(e.id) idMap[e.id] = same.id; return; }
    if(itemNameProblem(kind, String(e.name), null)) return; // a built-in item's name
    var copy = KINDS[kind].clean(Object.assign({}, e, {name:String(e.name)}));
    copy.id = uid();
    if(e.id) idMap[e.id] = copy.id;
    lists[kind].push(copy);
    added++;
  });
  if(added){ write(kind); merge(kind); }
  return idMap;
}
