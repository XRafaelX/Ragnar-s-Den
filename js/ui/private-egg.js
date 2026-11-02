/* ---------------- The private content switch ----------------
   A secret switch for Michael's private content (js/core/private-content.js):
   ten taps in a row on the home screen's centre die (the Dice Roller),
   each within TAP_GAP of the last, show it or hide it again, with a toast
   saying which. Nothing on screen hints at it.
   The first tap rolls the die as usual. A second tap within TAP_GAP,
   which is shorter than the roll (it lands at 560 ms), marks the die so
   that roll doesn't open the tray (on a phone the tray covers the die),
   and the quick taps after it don't roll at all (stopped here, before
   home.js's own listener). A single tap is still just a roll. */
import { setPrivateContent, privateContentOn } from "../core/private-content.js";
import { renderAll } from "../render/sheet.js";
import { showActionToast } from "./toast.js";

var TAPS = 10, TAP_GAP = 500, ROLL_DONE_MS = 900;

export function setupPrivateEgg(){
  var die = document.getElementById("home-center");
  if(!die) return;
  var count = 0, last = 0;
  // Capture: runs before the die's own roll listener, so it can stop it.
  die.addEventListener("click", function(e){
    var now = Date.now();
    count = now - last <= TAP_GAP ? count + 1 : 1;
    last = now;
    if(count < 2){ delete die.dataset.noTray; return; }   // a single tap is just a roll
    die.dataset.noTray = "1";
    e.stopImmediatePropagation();
    if(count < TAPS) return;
    count = 0;
    var on = setPrivateContent(!privateContentOn());
    renderAll();
    showActionToast(on ? "Private content shown." : "Private content hidden.");
    setTimeout(function(){ delete die.dataset.noTray; }, ROLL_DONE_MS);
  }, true);
}
