/* ---------------- Supplies and tools ----------------
   Most tables never track rations, rope or a gaming set, so the creation
   wizard leaves them out unless "Track supplies and tools" is on (the
   Optional rules shelf on the Class step; wizardState.trackSupplies,
   remembered for the next character).

   Off, the character still gets what they fight and cast with: weapons,
   armor, ammunition and a spellcasting focus (holy symbol, arcane or
   druidic focus, component pouch, spellbook), plus the tools a class
   casts through (a bard's instrument, an artificer's tools). Packs,
   clothes, keepsakes and other tools are left out. Tool proficiencies
   still count: their pickers are hidden and filled with the first
   option, which the Features tab's Feature choices card can change. */
import { GEAR_GROUPS } from "../data/gear.js";
import { slotOptions } from "./class-picks.js";

var STORAGE_KEY = "ragnarsDen.trackSupplies.v1";

/* The choice the last character was made with (off by default). */
export function loadTrackSupplies(){
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch(e){ return false; }
}
export function saveTrackSupplies(on){
  try { localStorage.setItem(STORAGE_KEY, on ? "1" : "0"); } catch(e){}
}

function lowerSet(names){
  var out = {};
  names.forEach(function(n){ out[n.toLowerCase()] = true; });
  return out;
}
var AMMO = lowerSet(GEAR_GROUPS["Ammunition"]);
var INSTRUMENTS = lowerSet(GEAR_GROUPS["Musical instruments"].concat(["Musical Instrument"]));
var ARTISAN = lowerSet(GEAR_GROUPS["Artisan's tools"]);
var FOCUS = /focus|holy symbol|component pouch|spellbook/i;

/* The tools a class casts its spells through. */
function focusTool(classId, name){
  if(classId === "Bard") return !!INSTRUMENTS[name];
  if(classId === "Artificer") return name === "thieves' tools" || !!ARTISAN[name];
  return false;
}

/* Whether an item is kept when supplies aren't tracked. */
export function keptWithoutSupplies(item, classId){
  if(!item) return false;
  if(item.type === "weapon" || item.type === "armor") return true;
  var name = (item.name || "").toLowerCase();
  if(AMMO[name] || /^ammunition\b/.test((item.notes || "").toLowerCase())) return true;
  if(FOCUS.test(name)) return true;
  return focusTool(classId, name);
}

/* A starting-gear option's label without the items left out: "Chain mail,
   greatsword, flail, 8 javelins, Dungeoneer's Pack and 4 gp" reads
   "Chain mail, greatsword, flail, 8 javelins and 4 gp". `dropped`: the
   names left out (any case); a quiver goes with them. */
export function labelWithout(label, dropped){
  if(!dropped.length) return label;
  var gone = lowerSet(dropped.concat(["quiver"]));
  var parts = String(label || "").split(/, | and /);
  var kept = parts.filter(function(p){
    return !gone[p.toLowerCase().replace(/^(\d+|an?) /, "")];
  });
  if(kept.length === parts.length) return label;
  return kept.length > 1 ? kept.slice(0, -1).join(", ") + " and " + kept[kept.length - 1] : kept.join("");
}

/* ---- Tool proficiency picks ---- */
function isToolSlot(slot){ return !!slot && slot.kind === "tool"; }
/* Whether every one of a feature's picks is a tool (a dwarf's Tool
   Proficiency, a Criminal's gaming set, a bard's three instruments). */
export function toolOnlyPicks(def){
  var picks = (def && def.pick) || [];
  return picks.length > 0 && picks.every(isToolSlot);
}
/* Fills a feature's empty tool picks with the first options still open,
   in place. Returns slots. */
export function fillToolPicks(def, slots, ctx){
  ((def && def.pick) || []).forEach(function(slot, i){
    if(!isToolSlot(slot)) return;
    var have = (slots[i] || []).filter(Boolean), n = slot.count || 1;
    if(have.length >= n) return;
    slotOptions(def, slots, i, ctx).forEach(function(o){
      if(have.length < n && !o.reason && !o.custom && have.indexOf(o.value) === -1) have.push(o.value);
    });
    slots[i] = have;
  });
  return slots;
}
