/* ---------------- A class's rules edition ----------------
   Switching a class entry between its 2014 and 2024 rules (the Optional
   rules shelf's "2024 class" card, the level-up's "Which fighter?"). A
   subclass with another edition's version becomes it, and so do the picks
   that carry over. The monk's own extras are in js/core/monk.js. */
import { CLASS_PROGRESSION } from "../data/progression.js";
import { classVariants, classHasEdition } from "./class-features.js";
import { setMonkEdition } from "./monk.js";
import { syncStyleWording } from "./fighting-styles.js";

/* Maneuvers known carry over under the same names, for those both lists have. */
var OPTION_SETS_SWAP = {"maneuvers": "maneuvers2024"};
export function setClassEdition(c, className, on){
  if(className==="Monk") return setMonkEdition(c, on);
  var cl = (c.classes||[]).find(function(x){ return x.name===className; });
  if(!cl || !classHasEdition(className, "2024") || !!on===(cl.edition==="2024")) return false;
  var swaps = CLASS_PROGRESSION[className].editions["2024"].swaps || {}, back = {};
  Object.keys(swaps).forEach(function(k){ back[swaps[k]] = k; });
  if(on){
    classVariants(className).forEach(function(v){ if(cl.variants) delete cl.variants[v.adds ? v.name : v.replaces]; });
    cl.edition = "2024";
    if(swaps[cl.subclass]) cl.subclass = swaps[cl.subclass];
  } else {
    delete cl.edition;
    if(back[cl.subclass]) cl.subclass = back[cl.subclass];
  }
  Object.keys(OPTION_SETS_SWAP).forEach(function(oldId){
    var from = on ? oldId : OPTION_SETS_SWAP[oldId], to = on ? OPTION_SETS_SWAP[oldId] : oldId;
    if(cl.options && cl.options[from] && !cl.options[to]){ cl.options[to] = cl.options[from]; delete cl.options[from]; }
  });
  syncStyleWording(c);
  return true;
}
