import { SKILLS } from "../data/abilities-skills.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { uid } from "./helpers.js";

/* ---------------- Default character ---------------- */
export function newCharacter(name){
  var abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  var skillProfs = {};
  SKILLS.forEach(function(s){ skillProfs[s[0]] = {prof:false, expertise:false}; });
  var saveProfs = {str:false,dex:false,con:false,int:false,wis:false,cha:false};
  var slots = {};
  for(var i=1;i<=9;i++) slots[i] = {max:0, used:0};
  return {
    id: uid(),
    name: name || "New Character",
    avatar: null,
    inspiration: 0,
    backdrop: null,
    backdropPalette: null,
    backdropTheme: true,
    race: "Human",
    background: "Acolyte",
    alignment: "Neutral Good",
    languages: ["Common"],
    classes: [{name:"Fighter", subclass:"", level:1}],
    xp: 0,
    levelHistory: [],
    newUnlocks: [],
    abilities: abilities,
    saveProfs: saveProfs,
    skillProfs: skillProfs,
    hp: {max:10, current:10, temp:0},
    ac: 10,
    acMisc: 0,
    initiativeMisc: 0,
    speed: 30,
    hitDiceUsed: 0,
    deathSaves: {success:0, fail:0},
    rage: {active:false, used:0},
    resourcesUsed: {},
    spellcasting: {ability:"int", slots: slots, pact: null},
    spells: [],
    feats: [],
    features: [],
    inventory: [],
    currency: {cp:0, sp:0, ep:0, gp:0, pp:0},
    notes: [],
    rollLog: []
  };
}

/* ---------------- Migration safety (older saves) ---------------- */
export function ensureShape(c){
  if(c.avatar===undefined) c.avatar = null;
  if(c.inspiration===undefined) c.inspiration = c.inspired ? 1 : 0;
  delete c.inspired;
  if(c.backdrop===undefined) c.backdrop = null;
  if(c.backdropPalette===undefined) c.backdropPalette = null;
  if(c.backdropTheme===undefined) c.backdropTheme = true;
  if(!c.classes) c.classes = [{name:"Fighter", subclass:"", level: c.level||1}];
  if(c.xp==null) c.xp = 0;
  if(!Array.isArray(c.levelHistory)) c.levelHistory = [];
  if(!Array.isArray(c.newUnlocks)) c.newUnlocks = [];
  if(!c.race) c.race = "Human";
  if(!c.background) c.background = "Acolyte";
  if(!c.alignment) c.alignment = "Neutral Good";
  if(typeof c.languages === "string"){
    c.languages = c.languages.split(",").map(function(s){ return s.trim(); }).filter(Boolean);
  }
  if(!Array.isArray(c.languages) || !c.languages.length) c.languages = ["Common"];
  if(!c.abilities) c.abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  if(!c.skillProfs){
    c.skillProfs = {};
    SKILLS.forEach(function(s){ c.skillProfs[s[0]] = {prof:false, expertise:false}; });
  }
  if(!c.saveProfs) c.saveProfs = {str:false,dex:false,con:false,int:false,wis:false,cha:false};
  if(!c.hp) c.hp = {max:10, current:10, temp:0};
  if(c.ac==null) c.ac = 10;
  if(c.acMisc==null) c.acMisc = 0;
  if(c.initiativeMisc==null) c.initiativeMisc = 0;
  if(c.speed==null) c.speed = 30;
  if(c.hitDiceUsed==null) c.hitDiceUsed = 0;
  if(!c.deathSaves) c.deathSaves = {success:0, fail:0};
  if(!c.rage) c.rage = {active:false, used:0};
  if(!c.resourcesUsed) c.resourcesUsed = {};
  if(!c.spellcasting) c.spellcasting = {ability:"int", slots:{}};
  if(!c.spellcasting.slots) c.spellcasting.slots = {};
  if(c.spellcasting.pact===undefined) c.spellcasting.pact = null;
  for(var i=1;i<=9;i++){ if(!c.spellcasting.slots[i]) c.spellcasting.slots[i] = {max:0,used:0}; }
  if(!c.spells) c.spells = [];
  if(!c.feats) c.feats = [];
  else {
    c.feats = c.feats.map(function(item){
      if(typeof item === "string"){
        var found = FEATS_CATALOG.find(function(f){ return f.name.toLowerCase()===item.toLowerCase(); });
        return {
          id: uid(),
          name: item,
          prerequisite: found ? found.prerequisite : "None",
          category: found ? found.category : "General",
          summary: found ? found.summary : "",
          description: found ? found.description : item,
          source: found ? "SRD" : "Custom"
        };
      }
      if(!item.id) item.id = uid();
      return item;
    });
  }
  if(!c.features) c.features = [];
  else {
    c.features = c.features.map(function(item){
      if(typeof item === "string"){
        var parts = item.split(":");
        var name = parts[0].trim();
        var text = parts.slice(1).join(":").trim();
        if(!text){ text = name; name = "Custom Feature"; }
        return {
          id: uid(),
          name: name,
          source: "Custom",
          text: text,
          isPassive: true
        };
      }
      if(!item.id) item.id = uid();
      return item;
    });
  }
  if(!c.inventory) c.inventory = [];
  else {
    c.inventory.forEach(function(item){
      if(!item.type) item.type = "gear";
    });
  }
  if(!c.currency) c.currency = {cp:0,sp:0,ep:0,gp:0,pp:0};
  if(!c.notes) c.notes = [];
  if(!c.rollLog) c.rollLog = [];
  return c;
}
