import { INFUSIONS } from "../data/infusions.js";
import { mod, profBonus } from "./basics.js";
import { abilityScore, abilityScores } from "./ability-scores.js";

/* ---------------- What active infusions do on the sheet ----------------
   Worked out when shown, from c.infusions.active (see js/core/artificer.js
   for infusing). An infusion works while its item is in the inventory and
   attuned, if it needs to be, and one marked `worn` only while its item
   is worn or held (equipped; an Arcane Armor part while its armor is).
   Kept apart from
   artificer.js so the spell, check and speed code can use it without an
   import loop through helpers.js. */

/* The infusion's rules (js/data/infusions.js) for an active one. */
export function activeInfusionData(c, active){
  var known = ((c.infusions && c.infusions.known) || []).find(function(k){ return k.id===active.knownId; });
  var name = known ? known.name : String(active.name||"").replace(/:.*$/, "");
  return INFUSIONS.find(function(i){ return i.name===name; }) || null;
}
/* Its magic works: attuned, or it doesn't need to be. */
export function infusionWorks(item, active){
  return !active.attunement || !!item.attuned;
}
/* Worn or held as its rules need (Helm of Awareness worn, Enhanced Arcane
   Focus held): "" when it is, else what to do. Plain gear can only be
   equipped once it bears such an infusion (see js/render/panels/inventory.js). */
export function infusionWornProblem(c, item, active){
  var d = activeInfusionData(c, active);
  if(!d || !d.worn || !item) return "";
  if(item.armorPart) return partWorn(c, item) ? "" : "Wear your Arcane Armor to use its magic";
  return item.equipped ? "" : (d.worn==="hold" ? "Hold it (Equip) to use its magic" : "Wear it (Equip) to use its magic");
}

function artificerLevel(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Artificer"; });
  return cl ? (Number(cl.level)||1) : 0;
}
/* An Arcane Armor part (Armor Modifications) works only while its armor
   is worn; any other item is fine. */
function partWorn(c, item){
  if(!item.armorPart) return true;
  return (c.inventory||[]).some(function(i){ return i.id===item.partOf && i.equipped; });
}
/* Working infusions by name: [{active, data, item}]. */
function working(c, name, worn){
  var out = [];
  ((c.infusions && c.infusions.active) || []).forEach(function(a){
    var d = activeInfusionData(c, a);
    if(!d || d.name!==name) return;
    var item = a.itemId && (c.inventory||[]).find(function(i){ return i.id===a.itemId; });
    if(!item || !infusionWorks(item, a) || (worn && !item.equipped) || !partWorn(c, item) || infusionWornProblem(c, item, a)) return;
    out.push({active: a, data: d, item: item});
  });
  return out;
}

/* Enhanced Arcane Focus: +1 to spell attack rolls (+2 from artificer
   level 10). {value, name} or null. */
export function infusionSpellAttack(c){
  if(!working(c, "Enhanced Arcane Focus").length) return null;
  return {value: artificerLevel(c) >= 10 ? 2 : 1, name: "Enhanced Arcane Focus"};
}
/* Resistant Armor, worn: [{type, source}] ("Fire", "Resistant Armor (Chain Mail)"). */
export function infusionResistances(c){
  return working(c, "Resistant Armor", true).filter(function(w){ return w.active.choice; }).map(function(w){
    return {type: w.active.choice, source: "Resistant Armor (" + w.item.name + ")"};
  });
}
/* Helm of Awareness: advantage on initiative, as a roll mode, or null. */
export function infusionInitiative(c){
  return working(c, "Helm of Awareness").length ? {mode: "adv", reason: "Helm of Awareness"} : null;
}
/* Arcane Propulsion Armor, worn: +5 ft walking speed. */
export function infusionSpeedParts(c){
  return working(c, "Arcane Propulsion Armor", true).length ? [{name: "Arcane Propulsion Armor", value: 5}] : [];
}
/* Arcane Propulsion Armor's gauntlets, as an attack like an unarmed
   strike's: proficient, 1d8 force with STR, thrown 20/60 ft and back. */
export function propulsionGauntlets(c){
  if(!working(c, "Arcane Propulsion Armor", true).length) return null;
  var str = mod(abilityScore(c, "str"));
  return {name: "Propulsion gauntlets", attack: str + profBonus(c), die: 8, bonus: str, type: "Force", ability: "STR",
    parts: ["Arcane Propulsion Armor", "empty hand", "thrown 20/60 ft, flies back"]};
}
