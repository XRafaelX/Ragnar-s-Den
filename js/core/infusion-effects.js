import { INFUSIONS } from "../data/infusions.js";
import { mod, profBonus } from "./basics.js";

/* ---------------- What active infusions do on the sheet ----------------
   Worked out when shown, from c.infusions.active (see js/core/artificer.js
   for infusing). An infusion works while its item is in the inventory and
   attuned, if it needs to be; armor ones also only while the armor is
   worn (equipped). Carried gear has no "held" state, so a focus, helmet
   or ring counts as in use while it's carried. Kept apart from
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

function artificerLevel(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Artificer"; });
  return cl ? (Number(cl.level)||1) : 0;
}
/* Working infusions by name: [{active, data, item}]. */
function working(c, name, worn){
  var out = [];
  ((c.infusions && c.infusions.active) || []).forEach(function(a){
    var d = activeInfusionData(c, a);
    if(!d || d.name!==name) return;
    var item = a.itemId && (c.inventory||[]).find(function(i){ return i.id===a.itemId; });
    if(!item || !infusionWorks(item, a) || (worn && !item.equipped)) return;
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
  var str = mod(c.abilities && c.abilities.str);
  return {name: "Propulsion gauntlets", attack: str + profBonus(c), die: 8, bonus: str, type: "Force", ability: "STR",
    parts: ["Arcane Propulsion Armor", "empty hand", "thrown 20/60 ft, flies back"]};
}
