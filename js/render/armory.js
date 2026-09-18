import { state } from "../core/state.js";
import { openCatalogPicker } from "../ui/catalog-picker.js";
import { WEAPON_GROUPS, WEAPON_DATA } from "../data/weapons.js";
import { ARMOR_GROUPS, ARMOR_DATA } from "../data/armor.js";
import { addCatalogWeapon, addCustomWeapon, buildCustomWeaponForm } from "./panels/weapon-picker.js";
import { addCatalogArmor, addCustomArmor, buildCustomArmorForm } from "./panels/armor-picker.js";
import { renderAll } from "./sheet.js";
import { openWizard } from "../wizard/wizard-core.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { chooseCharacter } from "../ui/character-picker.js";
import { showActionToast } from "../ui/toast.js";

var ARMOR_CATEGORY_LABEL = {light:"Light", medium:"Medium", heavy:"Heavy", shield:"Shield"};

function announceAdd(name, c){
  showActionToast('Added "' + name + '" to ' + (c.name||"Unnamed") + "’s inventory.");
}

/* Grimtooth's Armory — the sidebar's standalone entry into the same
   weapon/armor catalogue used by the Inventory tab's Add buttons, so
   players can browse without first digging into a character's sheet.
   Unlike the in-sheet pickers (bound to whichever character you're
   editing), every add here asks which character it should go to, then
   confirms with a toast — since Armory can be reached with no "current"
   character in context. */
function buildArmoryWeaponSection(){
  return {
    key: "weapons",
    label: "Weapons",
    searchPlaceholder: "Search all weapons…",
    groups: WEAPON_GROUPS,
    data: WEAPON_DATA,
    renderSub: function(name, d){ return d.properties || ""; },
    renderRight: function(name, d){ return [d.damageDice||"—", d.damageType||""]; },
    onAdd: function(name, d){
      chooseCharacter(function(c){
        addCatalogWeapon(c, name, d);
        renderAll();
        announceAdd(name, c);
      });
      return false;
    },
    renderCustomForm: function(container, closeCustom){
      buildCustomWeaponForm(container, closeCustom, function(fields){
        chooseCharacter(function(c){
          addCustomWeapon(c, fields);
          renderAll();
          announceAdd(fields.name, c);
        });
      });
    }
  };
}

function buildArmoryArmorSection(){
  return {
    key: "armor",
    label: "Armor",
    searchPlaceholder: "Search all armor…",
    groups: ARMOR_GROUPS,
    data: ARMOR_DATA,
    renderSub: function(name, d){ return d.stealthDisadvantage ? "Disadvantage on Stealth checks" : ""; },
    renderRight: function(name, d){
      var acText = d.category==="shield" ? "+" + d.baseAC + " AC" : "AC " + d.baseAC;
      return [acText, ARMOR_CATEGORY_LABEL[d.category]||""];
    },
    onAdd: function(name, d){
      chooseCharacter(function(c){
        addCatalogArmor(c, name, d);
        renderAll();
        announceAdd(name, c);
      });
      return false;
    },
    renderCustomForm: function(container, closeCustom){
      buildCustomArmorForm(container, closeCustom, function(fields){
        chooseCharacter(function(c){
          addCustomArmor(c, fields);
          renderAll();
          announceAdd(fields.name, c);
        });
      });
    }
  };
}

export function openArmory(){
  if(!state.characters.length){
    confirmDialog(
      "No characters yet",
      "The Armory adds items to one of your characters. Create one now?",
      openWizard
    );
    return;
  }
  openCatalogPicker({
    sections: [buildArmoryWeaponSection(), buildArmoryArmorSection()],
    onClose: function(){ renderAll(); }
  });
}
