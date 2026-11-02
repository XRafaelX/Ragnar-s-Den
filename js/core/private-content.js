/* ---------------- Private content ----------------
   Michael Hobson's (Spikael's) unpublished homebrew: the Gunslinger class
   (with its spells Ready Arms! and Switcheroo), the Shadow Stalker rogue
   subclass with the Reaper feat and the Scythe (js/data/shadow-stalker.js)
   and the Drecland gods. It
   stays hidden on a device until it is switched on, and the switch is a
   secret: ten quick taps on the home screen's centre die (the Dice Roller,
   js/ui/private-egg.js). The
   choice is remembered per device.
   While hidden:
   - the class leaves CLASS_LIST (creation wizard, level-up, multiclass,
     the Compendium), its spells leave SPELL_DATA (Spellbook, every
     picker), the Shadow Stalker leaves SUBCLASSES.Rogue, the Reaper
     leaves FEATS_CATALOG, the Scythe leaves WEAPON_DATA and the Martial
     Melee group, the Drecland pantheons leave DEITY_GROUPS (the Faith
     sheet) and the private credits leave CREDITS. They are taken out of those
     shared tables in place and put back in the same spots when shown.
   - characters that use any of it are set aside (js/core/state.js's
     splitCharacters): not listed, not opened, not offered for export one
     by one, but saved untouched and kept in a full backup.
   Hiding is not removal: the data still ships in the app's files. Before
   publishing anything, remove it (see js/data/deities-drecland.js). */
import { CLASS_LIST } from "../data/abilities-skills.js";
import { SPELL_DATA } from "../data/spells.js";
import { DEITY_GROUPS } from "../data/deities.js";
import { DRECLAND_GROUPS } from "../data/deities-drecland.js";
import { CREDITS } from "../data/credits.js";
import { SUBCLASSES } from "../data/progression.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { WEAPON_DATA, WEAPON_GROUPS } from "../data/weapons.js";
import { SHADOW_STALKER, REAPER_FEAT, SCYTHE } from "../data/shadow-stalker.js";
import { splitCharacters } from "./state.js";

var KEY = "ragnarsDen.privateContent";
export var PRIVATE_CLASSES = ["Gunslinger"];
// Spikael's subclasses of published classes, and his feats and weapons.
var PRIVATE_SUBCLASSES = [{className: "Rogue", sub: SHADOW_STALKER}];
var PRIVATE_FEATS = [REAPER_FEAT];
var PRIVATE_WEAPONS = [{name: "Scythe", group: "Martial Melee", data: SCYTHE}];
var PRIVATE_SPELL_SOURCE = "GSL";
// Ready Arms! and Switcheroo: read while every spell is still in the table.
var PRIVATE_SPELLS = Object.keys(SPELL_DATA).filter(function(n){ return SPELL_DATA[n].source === PRIVATE_SPELL_SOURCE; });

export function privateContentOn(){
  try{ return localStorage.getItem(KEY) === "1"; }catch(e){ return false; }
}
function store(on){
  try{ if(on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); }catch(e){}
}

var drecTexts = null;
function drecGod(text){
  if(!drecTexts){
    drecTexts = {};
    DRECLAND_GROUPS.forEach(function(g){ g.gods.forEach(function(d){ drecTexts[d[0]] = true; }); });
  }
  return !!drecTexts[text];
}

/* True when a character uses any private content: a Gunslinger level, a
   Shadow Stalker, the Reaper feat, a Drecland god as its faith, one of the
   class's guns, a scythe, one of the class's spells. */
export function usesPrivateContent(c){
  if(!c) return false;
  if((c.classes || []).some(function(cl){
    return PRIVATE_CLASSES.indexOf(cl.name) !== -1 || PRIVATE_SUBCLASSES.some(function(p){ return p.className === cl.name && p.sub.name === cl.subclass; });
  })) return true;
  if((c.feats || []).some(function(f){ return f && PRIVATE_FEATS.some(function(d){ return d.name === f.name; }); })) return true;
  if(c.story && drecGod(c.story.faith)) return true;
  if((c.inventory || []).some(function(i){
    return i && (i.firearmSet === "gunslinger" || (i.type === "weapon" && PRIVATE_WEAPONS.some(function(w){ return i.name === w.name || i.baseWeapon === w.name; })));
  })) return true;
  return (c.spells || []).some(function(sp){ return sp && PRIVATE_SPELLS.indexOf(sp.name) !== -1; });
}

/* ---- Taking it out of the shared tables, and putting it back ---- */
var hiddenClasses = [];   // [{name, at}]
var hiddenSpells = {};    // name -> data
var hiddenGroups = null;  // true while the Drecland groups are out
var hiddenCredits = [];   // [{entry, at}]
var hiddenSubs = [];      // [{list, sub, at}]
var hiddenFeats = [];     // [{feat, at}]
var hiddenWeapons = [];   // [{name, group, at, data}]

function hideTables(){
  if(!hiddenClasses.length){
    PRIVATE_CLASSES.forEach(function(name){
      var at = CLASS_LIST.indexOf(name);
      if(at !== -1){ hiddenClasses.push({name: name, at: at}); CLASS_LIST.splice(at, 1); }
    });
  }
  Object.keys(SPELL_DATA).forEach(function(name){
    if(SPELL_DATA[name].source === PRIVATE_SPELL_SOURCE){ hiddenSpells[name] = SPELL_DATA[name]; delete SPELL_DATA[name]; }
  });
  if(!hiddenGroups){
    DRECLAND_GROUPS.forEach(function(g){ var at = DEITY_GROUPS.indexOf(g); if(at !== -1) DEITY_GROUPS.splice(at, 1); });
    hiddenGroups = true;
  }
  if(!hiddenSubs.length){
    PRIVATE_SUBCLASSES.forEach(function(p){
      var list = SUBCLASSES[p.className], at = list ? list.indexOf(p.sub) : -1;
      if(at !== -1){ hiddenSubs.push({list: list, sub: p.sub, at: at}); list.splice(at, 1); }
    });
  }
  if(!hiddenFeats.length){
    PRIVATE_FEATS.forEach(function(f){
      var at = FEATS_CATALOG.indexOf(f);
      if(at !== -1){ hiddenFeats.push({feat: f, at: at}); FEATS_CATALOG.splice(at, 1); }
    });
  }
  if(!hiddenWeapons.length){
    PRIVATE_WEAPONS.forEach(function(w){
      var group = WEAPON_GROUPS[w.group], at = group ? group.indexOf(w.name) : -1;
      if(at === -1 && WEAPON_DATA[w.name] !== w.data) return;
      hiddenWeapons.push({name: w.name, group: w.group, at: at, data: w.data});
      if(at !== -1) group.splice(at, 1);
      if(WEAPON_DATA[w.name] === w.data) delete WEAPON_DATA[w.name];
    });
  }
  if(!hiddenCredits.length){
    for(var i = CREDITS.length - 1; i >= 0; i--){
      if(CREDITS[i].private){ hiddenCredits.unshift({entry: CREDITS[i], at: i}); CREDITS.splice(i, 1); }
    }
  }
}
function showTables(){
  hiddenClasses.slice().sort(function(a, b){ return a.at - b.at; }).forEach(function(h){
    if(CLASS_LIST.indexOf(h.name) === -1) CLASS_LIST.splice(Math.min(h.at, CLASS_LIST.length), 0, h.name);
  });
  hiddenClasses = [];
  Object.keys(hiddenSpells).forEach(function(name){ SPELL_DATA[name] = hiddenSpells[name]; });
  hiddenSpells = {};
  if(hiddenGroups){
    DRECLAND_GROUPS.slice().reverse().forEach(function(g){ if(DEITY_GROUPS.indexOf(g) === -1) DEITY_GROUPS.unshift(g); });
    hiddenGroups = null;
  }
  hiddenCredits.forEach(function(h){ CREDITS.splice(Math.min(h.at, CREDITS.length), 0, h.entry); });
  hiddenCredits = [];
  hiddenSubs.forEach(function(h){ if(h.list.indexOf(h.sub) === -1) h.list.splice(Math.min(h.at, h.list.length), 0, h.sub); });
  hiddenSubs = [];
  hiddenFeats.slice().sort(function(a, b){ return a.at - b.at; }).forEach(function(h){
    if(FEATS_CATALOG.indexOf(h.feat) === -1) FEATS_CATALOG.splice(Math.min(h.at, FEATS_CATALOG.length), 0, h.feat);
  });
  hiddenFeats = [];
  hiddenWeapons.forEach(function(h){
    WEAPON_DATA[h.name] = h.data;
    var group = WEAPON_GROUPS[h.group];
    if(h.at !== -1 && group && group.indexOf(h.name) === -1) group.splice(Math.min(h.at, group.length), 0, h.name);
  });
  hiddenWeapons = [];
}

/* Show or hide everything as the device's choice says. Called once at
   start (after every character is shaped), after an import, and by the
   switch. `on` (optional) forces a state without storing it (tests). */
export function applyPrivateContent(on){
  if(on === undefined) on = privateContentOn();
  if(on) showTables(); else hideTables();
  splitCharacters(on ? null : usesPrivateContent);
}

/* The switch: store the choice and apply it. Returns the new state. */
export function setPrivateContent(on){
  store(on);
  applyPrivateContent(on);
  return on;
}
