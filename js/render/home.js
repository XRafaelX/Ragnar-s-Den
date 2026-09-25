import { openWizard } from "../wizard/wizard-core.js";
import { openArmory } from "./armory.js";
import { openSpellbook } from "./spellbook.js";
import { openInfoModal } from "../ui/info-modal.js";
import { toggleDiceTray } from "../dice/dice.js";

var SELECT_ANIM_MS = 600;

/* Picking a ring option arcs it across into the dice while the other
   options get wiped away carousel-style, then the action opens once the
   animation settles. Classes are cleared right after (behind whatever
   just opened) so the hub is fresh if the user comes back without
   completing anything. */
function selectNode(node, action){
  if(node.classList.contains("chosen")) return; // already mid-selection
  var ring = document.getElementById("home-ring");
  var allNodes = ring.querySelectorAll(".home-node");
  allNodes.forEach(function(n){
    if(n === node) n.classList.add("chosen");
    else n.classList.add("wiping");
  });
  ring.classList.add("selecting");

  setTimeout(function(){
    action();
    allNodes.forEach(function(n){ n.classList.remove("chosen","wiping"); });
    ring.classList.remove("selecting");
  }, SELECT_ANIM_MS);
}

/* About: what the app is and where the data lives. */
function openAbout(){
  openInfoModal("About Ragnar's Den", function(body){
    var p1 = document.createElement("p");
    p1.className = "info-blurb";
    p1.textContent = "An offline-first D&D 5e character creator and interactive character sheet. No accounts, no ads, no internet connection required after the first load.";
    body.appendChild(p1);

    var p2 = document.createElement("p");
    p2.className = "info-blurb";
    p2.textContent = "Everything you create (characters, notes, roll history) is stored only in this browser. Use Export to back it up or move it to another device.";
    body.appendChild(p2);
  });
}

/* ---- Home hub (the "no character selected" landing screen) ----
   Kept to New / Spellbook / Armory / About; the character list, export
   and import already live in the sidebar, so repeating them here would
   just be the same actions in two places. */
export function setupHomeMenu(){
  var newBtn = document.getElementById("home-node-new");
  var spellbookBtn = document.getElementById("home-node-spellbook");
  var armoryBtn = document.getElementById("home-node-armory");
  var aboutBtn = document.getElementById("home-node-about");

  newBtn.addEventListener("click", function(){ selectNode(newBtn, openWizard); });
  spellbookBtn.addEventListener("click", function(){ selectNode(spellbookBtn, openSpellbook); });
  armoryBtn.addEventListener("click", function(){ selectNode(armoryBtn, openArmory); });
  aboutBtn.addEventListener("click", function(){ selectNode(aboutBtn, openAbout); });

  document.getElementById("home-center").addEventListener("click", toggleDiceTray);
}
