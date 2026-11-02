import { state, allCharacters } from "../core/state.js";
import { backupFileName } from "../core/helpers.js";
import { homebrewForCharacters } from "../core/backup.js";
import { getCustomSubclasses } from "../core/custom-subclasses.js";
import { getHomebrew } from "../core/custom-homebrew.js";
import { getCustom } from "../core/custom-features.js";
import { getCustomItems } from "../core/custom-items.js";
import { getCustomMonsters } from "../core/custom-monsters.js";
import { getCustomSpells } from "../core/custom-spells.js";
import { getEncounters } from "../core/encounters.js";
import { APP_VERSION } from "../version.js";

/* ---------------- Backup files ----------------
   Both kinds are read by Import backup. (Older backups were just the
   characters array; import still accepts those.) */

function homebrewLibrary(){
  return {customSubclasses:getCustomSubclasses(), customRaces:getHomebrew("race"), customBackgrounds:getHomebrew("background"),
    customFeats:getCustom("feat"), customFeatures:getCustom("feature"), customWeapons:getCustomItems("weapon"),
    customArmor:getCustomItems("armor"), customSpells:getCustomSpells()};
}

function downloadJson(data, fileName){
  var blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
}

/* Every character (hidden private ones too, so a move to a new device
   keeps them) plus all homebrew made in the Compendium. */
export function exportFullBackup(){
  var backup = Object.assign({version:2, appVersion:APP_VERSION, characters:allCharacters()}, homebrewLibrary(),
    {customMonsters:getCustomMonsters(), encounters:getEncounters()});
  downloadJson(backup, backupFileName(new Date(), APP_VERSION));
}

/* Just these characters and the homebrew they use. */
export function exportCharacters(chars){
  if(!chars.length) return;
  var file = Object.assign({version:2, appVersion:APP_VERSION, characters:chars}, homebrewForCharacters(chars, homebrewLibrary()));
  downloadJson(file, backupFileName(new Date(), APP_VERSION, "characters"));
}
