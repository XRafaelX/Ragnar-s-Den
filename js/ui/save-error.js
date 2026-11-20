/* ---------------- Telling the player a save failed ----------------
   js/core/save-error.js reports a refused save here. The first one opens
   a dialog that says why and offers the full backup, which is made from
   what's on screen, so it still holds the change that wasn't saved.
   When every tap fails (a full browser), the dialog would come back on
   each one, so for REPEAT_MS after it a short red toast says the change
   isn't saved instead. */
import { onSaveError } from "../core/save-error.js";
import { confirmDialog } from "./confirm-modal.js";
import { showActionToast } from "./toast.js";
import { exportFullBackup } from "./export-file.js";

var REPEAT_MS = 2 * 60 * 1000;
var lastDialog = 0;

export function saveErrorText(full){
  return full
    ? "The browser's space for this app is full, so your last change isn't saved yet. Export a backup now to keep it, then remove a photo or banner you don't need to make room."
    : "The browser didn't let the app save, so your last change isn't saved yet. This can happen in a private window or when site data is blocked. Export a backup now to keep your characters.";
}

export function saveErrorToast(full){
  return full ? "This change isn't saved. The browser's space is full." : "This change isn't saved. The browser blocked saving.";
}

function showSaveError(full){
  var modal = document.getElementById("confirm-modal");
  var open = modal && modal.classList.contains("open");
  if(open || Date.now() - lastDialog < REPEAT_MS){
    showActionToast(saveErrorToast(full), true);
    return;
  }
  lastDialog = Date.now();
  confirmDialog("Couldn't save your change", saveErrorText(full), exportFullBackup, null,
    {ok: "Export backup", cancel: "Close", safe: true});
}

export function setupSaveErrors(){ onSaveError(showSaveError); }
