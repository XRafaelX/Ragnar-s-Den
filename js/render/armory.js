import { getActive } from "../core/state.js";
import { openCatalogPicker } from "../ui/catalog-picker.js";
import { buildWeaponSection } from "./panels/weapon-picker.js";
import { buildArmorSection } from "./panels/armor-picker.js";
import { renderAll } from "./sheet.js";

/* Grimtooth's Armory — the sidebar's standalone entry into the same
   weapon/armor catalogue used by the Inventory tab's Add buttons, so
   players can browse without first digging into a character's sheet.
   Adds go to whichever character is currently active. */
export function openArmory(){
  var c = getActive();
  if(!c){
    alert("Select or create a character first — the Armory adds items to whoever's active.");
    return;
  }
  openCatalogPicker({
    sections: [buildWeaponSection(c), buildArmorSection(c)],
    onClose: function(){ renderAll(); }
  });
}
