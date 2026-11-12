/* ---------------- The tier list switch ----------------
   Whether this device shows the secret Tier list tab in the Compendium
   (js/render/compendium/tier-list.js). Switched by holding the home
   screen's centre die (js/ui/private-egg.js), remembered per device and
   separate from the private content switch. */
var KEY = "ragnarsDen.tierList";

export function tierListOn(){
  try{ return localStorage.getItem(KEY) === "1"; }catch(e){ return false; }
}
export function setTierList(on){
  try{ if(on) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); }catch(e){}
  return !!on;
}
