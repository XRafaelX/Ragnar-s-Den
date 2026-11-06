/* ---------------- Which edition's weapons ----------------
   Like the spells (js/core/spell-edition.js): a character on the 2024 rules
   or with a 2024 class uses the 2024 Player's Handbook's weapon stats
   (js/data/weapons-2024.js), swapped into WEAPON_DATA in place so every
   screen follows. The Net leaves the martial ranged weapons and joins the
   adventuring gear. A weapon the character already carries follows too,
   except for what the player edited (syncSavedWeapons). Data imports only,
   so this loads before the core modules. */
import { WEAPON_DATA, WEAPON_GROUPS } from "../data/weapons.js";
import { GEAR_DATA, GEAR_GROUPS } from "../data/gear.js";
import { WEAPON_DATA_2024, NET_2024 } from "../data/weapons-2024.js";

var current = "2014";
var saved = null; // {weapons: {name: 2014 entry}, net: 2014 Net entry, netAt: its place in the group}

export function weaponEdition(){ return current; }
/* Switch the catalog to an edition's weapons. */
export function setWeaponEdition(edition){
  edition = edition==="2024" ? "2024" : "2014";
  if(edition===current) return;
  var ranged = WEAPON_GROUPS["Martial Ranged"], gear = GEAR_GROUPS["Adventuring gear"];
  if(edition==="2024"){
    saved = {weapons: {}, net: WEAPON_DATA["Net"], netAt: ranged.indexOf("Net")};
    Object.keys(WEAPON_DATA_2024).forEach(function(n){ saved.weapons[n] = WEAPON_DATA[n]; WEAPON_DATA[n] = WEAPON_DATA_2024[n]; });
    if(saved.netAt!==-1) ranged.splice(saved.netAt, 1);
    delete WEAPON_DATA["Net"];
    GEAR_DATA["Net"] = NET_2024;
    if(gear.indexOf("Net")===-1){ gear.push("Net"); gear.sort(); }
  } else if(saved){
    Object.keys(saved.weapons).forEach(function(n){ WEAPON_DATA[n] = saved.weapons[n]; });
    if(saved.net) WEAPON_DATA["Net"] = saved.net;
    if(saved.netAt!==-1 && ranged.indexOf("Net")===-1) ranged.splice(saved.netAt, 0, "Net");
    delete GEAR_DATA["Net"];
    if(gear.indexOf("Net")!==-1) gear.splice(gear.indexOf("Net"), 1);
    saved = null;
  }
  current = edition;
}
/* A carried weapon keeps its own copy of the catalog's damage, weight and
   properties (its notes). One still holding the other edition's moves to
   this edition's, and one the player changed stays. */
var COPIED = {damageDice: "damageDice", weight: "weight", notes: "properties"};
function syncSavedWeapons(c){
  (c.inventory||[]).forEach(function(item){
    // (A magic one by its base weapon: a Trident of Returning is a trident.)
    var name = item && (WEAPON_DATA_2024[item.name] ? item.name : item.baseWeapon);
    if(!item || item.type!=="weapon" || item.homebrewId || !WEAPON_DATA_2024[name]) return;
    var older = current==="2024" ? saved.weapons[name] : WEAPON_DATA[name], newer = WEAPON_DATA_2024[name];
    if(!older) return;
    var from = current==="2024" ? older : newer, to = current==="2024" ? newer : older;
    Object.keys(COPIED).forEach(function(k){
      if(item[k]!==undefined && item[k]===from[COPIED[k]]) item[k] = to[COPIED[k]];
    });
  });
}
/* Switch to the edition this character's weapons follow ("2024" or "2014",
   decided like its spells: characterSpellEdition). */
export function useWeaponsOf(c, edition){
  setWeaponEdition(edition);
  if(c) syncSavedWeapons(c);
}
