import { state, save, load } from "./core/state.js";
import { uid } from "./core/helpers.js";
import { ensureShape } from "./core/character.js";
import { confirmDialog } from "./ui/confirm-modal.js";
import { setupMobileNav, closeSidebarMobile } from "./ui/mobile-nav.js";
import { openWizard } from "./wizard/wizard-core.js";
import { renderAll } from "./render/sheet.js";
import { setupDiceTray } from "./dice/dice.js";
import { setupHomeMenu } from "./render/home.js";
import { playAdd, playDelete } from "./ui/sound.js";
import { initTheme, openThemeModal } from "./ui/theme.js";
import { setupAvatarUpload } from "./ui/avatar.js";
import { setupAvatarCropper } from "./ui/avatar-crop.js";
import { setupBackdropUpload } from "./ui/backdrop.js";
import { maybeStartTutorial, startTutorial } from "./ui/tutorial.js";
import { loadCustomSubclasses, getCustomSubclasses, importCustomSubclasses } from "./core/custom-subclasses.js";
import { loadHomebrew, getHomebrew, importHomebrew } from "./core/custom-homebrew.js";
import { loadCustomFeatures, getCustom, importCustom } from "./core/custom-features.js";
import { loadCustomItems, getCustomItems, importCustomItems } from "./core/custom-items.js";
import { APP_VERSION } from "./version.js";

/* ---------------- Top-level actions ---------------- */
export function setupTopLevel(){
  document.getElementById("app-version").textContent = " · v" + APP_VERSION;
  document.getElementById("new-char-btn").addEventListener("click", openWizard);
  document.getElementById("theme-btn").addEventListener("click", openThemeModal);
  document.getElementById("tutorial-btn").addEventListener("click", function(){
    // The tour points at the home screen, so go there and close the
    // mobile menu first, otherwise its targets would be hidden.
    state.activeId = null;
    renderAll();
    closeSidebarMobile();
    startTutorial();
  });

  function goHome(){
    if(!state.activeId) return;
    state.activeId = null;
    renderAll();
    closeSidebarMobile();
  }
  document.getElementById("tb-title").addEventListener("click", goHome);
  document.getElementById("sidebar-home-link").addEventListener("click", goHome);

  document.getElementById("export-btn").addEventListener("click", function(){
    // Characters plus homebrew made in the Compendium. (Older backups were
    // just the characters array; import still accepts those.)
    var backup = {version:2, appVersion:APP_VERSION, characters:state.characters, customSubclasses:getCustomSubclasses(),
      customRaces:getHomebrew("race"), customBackgrounds:getHomebrew("background"), customFeats:getCustom("feat"), customFeatures:getCustom("feature"),
      customWeapons:getCustomItems("weapon"), customArmor:getCustomItems("armor")};
    var blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ragnars-den-backup-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  });

  document.getElementById("import-btn").addEventListener("click", function(){
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", function(e){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var parsed = JSON.parse(reader.result);
        var data = Array.isArray(parsed) ? parsed : parsed && parsed.characters;
        var homebrew = !Array.isArray(parsed) && parsed && Array.isArray(parsed.customSubclasses) ? parsed.customSubclasses : [];
        var races = !Array.isArray(parsed) && parsed && Array.isArray(parsed.customRaces) ? parsed.customRaces : [];
        var backgrounds = !Array.isArray(parsed) && parsed && Array.isArray(parsed.customBackgrounds) ? parsed.customBackgrounds : [];
        var features = !Array.isArray(parsed) && parsed && Array.isArray(parsed.customFeatures) ? parsed.customFeatures : [];
        var feats = !Array.isArray(parsed) && parsed && Array.isArray(parsed.customFeats) ? parsed.customFeats : [];
        var weapons = !Array.isArray(parsed) && parsed && Array.isArray(parsed.customWeapons) ? parsed.customWeapons : [];
        var armor = !Array.isArray(parsed) && parsed && Array.isArray(parsed.customArmor) ? parsed.customArmor : [];
        var extras = [];
        if(homebrew.length) extras.push(homebrew.length+" custom subclass(es)");
        if(races.length) extras.push(races.length+" custom race(s)");
        if(backgrounds.length) extras.push(backgrounds.length+" custom background(s)");
        if(feats.length) extras.push(feats.length+" custom feat(s)");
        if(features.length) extras.push(features.length+" custom feature(s)");
        if(weapons.length) extras.push(weapons.length+" custom weapon(s)");
        if(armor.length) extras.push(armor.length+" custom armor");
        if(!Array.isArray(data)) throw new Error("Invalid format");
        confirmDialog(
          "Import backup?",
          "This will add "+data.length+" character(s)"+(extras.length ? " and "+extras.join(", ") : "")+" from the backup file to your current vault. Existing characters are kept.",
          function(){
            // Subclasses first, so imported characters find theirs.
            importCustomSubclasses(homebrew);
            importHomebrew("race", races);
            importHomebrew("background", backgrounds);
            // Feats and features get new ids here: relink the characters' copies.
            var featIds = importCustom("feat", feats), featureIds = importCustom("feature", features);
            var weaponIds = importCustomItems("weapon", weapons), armorIds = importCustomItems("armor", armor);
            data.forEach(function(c){
              c.id = uid(); // avoid collisions
              ensureShape(c);
              c.feats.forEach(function(f){ if(f.homebrewId) f.homebrewId = featIds[f.homebrewId] || null; });
              c.features.forEach(function(f){ if(f.homebrewId) f.homebrewId = featureIds[f.homebrewId] || null; });
              c.inventory.forEach(function(i){
                if(i.homebrewId) i.homebrewId = (i.type==="armor" ? armorIds : weaponIds)[i.homebrewId] || null;
              });
              state.characters.push(c);
            });
            save();
            renderAll();
            playAdd();
          }
        );
      }catch(err){
        alert("That file doesn't look like a valid Ragnar's Den backup.");
      }
      document.getElementById("import-file").value = "";
    };
    reader.readAsText(file);
  });
}

/* ---------------- Delete character ---------------- */
/* Opened from the identity card's ⋮ menu. */
export function confirmDeleteCharacter(c){
  confirmDialog("Delete "+(c.name||"this character")+"?", "This cannot be undone. Consider exporting a backup first.", function(){
    state.characters = state.characters.filter(function(x){ return x.id!==c.id; });
    state.activeId = state.characters.length ? state.characters[0].id : null;
    if(state.activeId) state.activeTab = "vitals";
    save();
    renderAll();
    playDelete();
  });
}

/* ---------------- Init ---------------- */
export function init(){
  initTheme();
  load();
  loadCustomSubclasses();
  loadHomebrew();
  loadCustomFeatures();
  loadCustomItems();
  state.characters.forEach(ensureShape);
  setupTopLevel();
  setupDiceTray();
  setupMobileNav();
  setupHomeMenu();
  setupAvatarUpload();
  setupAvatarCropper();
  setupBackdropUpload();
  renderAll();
  maybeStartTutorial(state.characters.length > 0);

  if("serviceWorker" in navigator){
    // When an updated service worker takes control, reload once so the
    // page picks up the fresh HTML/CSS/JS instead of the previous cache.
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if(hadController){ hadController = false; window.location.reload(); }
    });
    navigator.serviceWorker.register("sw.js").catch(function(){ /* offline-first, fine if this fails */ });
  }
}

document.addEventListener("DOMContentLoaded", init);
