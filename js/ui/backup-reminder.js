/* ---------------- Backup reminder ----------------
   When changes have gone REMIND_AFTER_DAYS without a backup (see
   js/core/backup-status.js), a banner at the top offers one: "Back up"
   saves the full backup file, "Later" asks again in a week. Shown once
   when the app starts, like the update banner it sits under. */
import { backupReminderDue, backupReminderText, snoozeReminder } from "../core/backup-status.js";
import { exportFullBackup } from "./export-file.js";

function hide(banner){ banner.classList.remove("show"); }

/* Under the update banner while that one shows (its height depends on
   how its text wraps), else in its own place at the top. */
function followUpdateBanner(banner){
  var update = document.getElementById("update-banner");
  if(!update) return;
  function place(){
    if(!banner.classList.contains("show")) return;
    // (Its resting top and height: it slides in, so where it is right now
    // can be part of the way.)
    banner.style.top = update.classList.contains("show") ? (parseFloat(getComputedStyle(update).top) + update.offsetHeight + 10) + "px" : "";
  }
  if(typeof MutationObserver === "function") new MutationObserver(place).observe(update, {attributes: true, attributeFilter: ["class"]});
  window.addEventListener("resize", place);
  place();
}

export function setupBackupReminder(){
  var banner = document.getElementById("backup-banner");
  if(!banner || !backupReminderDue()) return;
  document.getElementById("backup-banner-text").textContent = backupReminderText();
  document.getElementById("backup-now-btn").onclick = function(){
    hide(banner);
    exportFullBackup();
  };
  document.getElementById("backup-later-btn").onclick = function(){
    hide(banner);
    snoozeReminder();
  };
  banner.classList.add("show");
  followUpdateBanner(banner);
}
