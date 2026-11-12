/* ---------------- The private content switch ----------------
   A secret switch for Michael's private content (js/core/private-content.js):
   ten taps in a row on the home screen's centre die (the Dice Roller),
   each within TAP_GAP of the last, show it or hide it again, with a toast
   saying which. Nothing on screen hints at it.
   The first tap rolls the die as usual. A second tap within TAP_GAP,
   which is shorter than the roll (it lands at 560 ms), marks the die so
   that roll doesn't open the tray (on a phone the tray covers the die),
   and the quick taps after it don't roll at all (stopped here, before
   home.js's own listener). A single tap is still just a roll.

   The same die holds a second secret: pressing and holding it for
   HOLD_MS shows or hides the Compendium's Tier list tab
   (js/core/tier-list-switch.js), with a toast saying which. The click
   that ends the hold doesn't roll. Moving the finger off, or more than
   HOLD_SLOP pixels, cancels it. */
import { setPrivateContent, privateContentOn } from "../core/private-content.js";
import { setTierList, tierListOn } from "../core/tier-list-switch.js";
import { renderAll } from "../render/sheet.js";
import { showActionToast } from "./toast.js";

var TAPS = 10, TAP_GAP = 500, ROLL_DONE_MS = 900;
var HOLD_MS = 3000, HOLD_SLOP = 12;

export function setupPrivateEgg(){
  var die = document.getElementById("home-center");
  if(!die) return;
  // First, so its click listener can stop a hold's click before the tap counter sees it.
  setupTierListHold(die);
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

function setupTierListHold(die){
  var timer = null, startX = 0, startY = 0, swallow = false;
  function cancel(){ clearTimeout(timer); timer = null; }
  die.addEventListener("pointerdown", function(e){
    if(e.button) return;   // the main button or a finger only
    swallow = false;
    cancel();
    startX = e.clientX; startY = e.clientY;
    timer = setTimeout(function(){
      timer = null;
      swallow = true;
      var on = setTierList(!tierListOn());
      showActionToast(on ? "Tier list shown in the Compendium." : "Tier list hidden.");
    }, HOLD_MS);
  });
  die.addEventListener("pointermove", function(e){
    if(timer && Math.hypot(e.clientX - startX, e.clientY - startY) > HOLD_SLOP) cancel();
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function(t){ die.addEventListener(t, cancel); });
  // A long press on a phone would open the browser's menu instead.
  die.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  die.addEventListener("click", function(e){
    if(!swallow) return;
    swallow = false;
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);
}
