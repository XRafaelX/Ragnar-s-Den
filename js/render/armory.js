import { getActive } from "../core/state.js";
import { openCatalogPicker } from "../ui/catalog-picker.js";
import { buildWeaponSection } from "./panels/weapon-picker.js";
import { buildArmorSection } from "./panels/armor-picker.js";
import { renderAll } from "./sheet.js";
import { openWizard } from "../wizard/wizard-core.js";
import { confirmDialog } from "../ui/confirm-modal.js";

/* Grimtooth's Armory — the sidebar's standalone entry into the same
   weapon/armor catalogue used by the Inventory tab's Add buttons, so
   players can browse without first digging into a character's sheet.
   Adds go to whichever character is currently active. */
export function openArmory(){
  var c = getActive();
  if(!c){
    confirmDialog(
      "No character selected",
      "The Armory adds items to your active character. Create one now?",
      openWizard
    );
    return;
  }
  openCatalogPicker({
    sections: [buildWeaponSection(c), buildArmorSection(c)],
    onClose: function(){ renderAll(); }
  });
}
