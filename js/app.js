import { state, save, load } from "./core/state.js";
import { uid } from "./core/helpers.js";
import { ensureShape } from "./core/character.js";
import { confirmDialog } from "./ui/confirm-modal.js";
import { setupMobileNav, closeSidebarMobile } from "./ui/mobile-nav.js";
import { openWizard } from "./wizard/wizard-core.js";
import { renderAll } from "./render/sheet.js";
import { setupDiceTray } from "./dice/dice.js";
import { openArmory } from "./render/armory.js";
import { setupHomeMenu } from "./render/home.js";

/* ---------------- Top-level actions ---------------- */
export function setupTopLevel(){
  document.getElementById("new-char-btn").addEventListener("click", openWizard);
  document.getElementById("armory-btn").addEventListener("click", openArmory);

  function goHome(){
    if(!state.activeId) return;
    state.activeId = null;
    renderAll();
    closeSidebarMobile();
  }
  document.getElementById("tb-title").addEventListener("click", goHome);
  document.getElementById("sidebar-home-link").addEventListener("click", goHome);

  document.getElementById("export-btn").addEventListener("click", function(){
    var blob = new Blob([JSON.stringify(state.characters, null, 2)], {type:"application/json"});
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
        var data = JSON.parse(reader.result);
        if(!Array.isArray(data)) throw new Error("Invalid format");
        confirmDialog(
          "Import backup?",
          "This will add "+data.length+" character(s) from the backup file to your current vault. Existing characters are kept.",
          function(){
            data.forEach(function(c){
              c.id = uid(); // avoid collisions
              ensureShape(c);
              state.characters.push(c);
            });
            save();
            renderAll();
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
/* Rendered inline at the end of the identity block's classes row. */
export function makeDeleteButton(c){
  var btn = document.createElement("button");
  btn.className = "btn small danger";
  btn.textContent = "Delete character";
  btn.addEventListener("click", function(){
    confirmDialog("Delete "+(c.name||"this character")+"?", "This cannot be undone. Consider exporting a backup first.", function(){
      state.characters = state.characters.filter(function(x){ return x.id!==c.id; });
      state.activeId = state.characters.length ? state.characters[0].id : null;
      if(state.activeId) state.activeTab = "vitals";
      save();
      renderAll();
    });
  });
  return btn;
}

/* ---------------- Init ---------------- */
export function init(){
  load();
  state.characters.forEach(ensureShape);
  if(state.characters.length && !state.activeId){
    state.activeId = state.characters[0].id;
  }
  setupTopLevel();
  setupDiceTray();
  setupMobileNav();
  setupHomeMenu();
  renderAll();

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
