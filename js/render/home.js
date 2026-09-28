import { openWizard } from "../wizard/wizard-core.js";
import { openArmory } from "./armory.js";
import { openSpellbook } from "./spellbook.js";
import { openCompendium } from "./compendium.js";
import { openInfoModal } from "../ui/info-modal.js";
import { toggleDiceTray } from "../dice/dice.js";
import { showActionToast } from "../ui/toast.js";

var SELECT_ANIM_MS = 600;
var TRANSITION_MS = 450;

var currentRingIndex = 0;
var isTransitioning = false;

/* Configurable ring definitions - structured dynamically so adding
   Ring 3 or Ring 4 later is straightforward. */
export var RINGS = [
  {
    id: "ring-core",
    name: "Core Tools",
    description: "Create a character, or roll up something quick from the menu above.",
    nodes: [
      { id: "home-node-new", pos: "top", label: "New", title: "New Character", action: openWizard },
      { id: "home-node-spellbook", pos: "upper-right", label: "Spellbook", title: "Spellbook", action: openSpellbook },
      { id: "home-node-armory", pos: "lower-right", label: "Armory", title: "Grimtooth's Armory", action: openArmory },
      { id: "home-node-compendium", pos: "lower-left", label: "Compendium", title: "Compendium: classes, subclasses and feats", action: openCompendium },
      { id: "home-node-about", pos: "upper-left", label: "About", title: "About Ragnar's Den", action: openAbout }
    ]
  },
  {
    id: "ring-upcoming",
    name: "Upcoming Features",
    description: "Preview upcoming tools and features in development.",
    nodes: [
      { id: "home-node-monsters", pos: "top", label: "Monsters", title: "Monsters (Coming Soon)", isPlaceholder: true, toast: "Monsters are coming in a future update!" }
    ]
  }
];

export function getActiveRingIndex(){
  return currentRingIndex;
}

/* Allow registering dynamic rings at runtime */
export function registerRing(ringConfig){
  RINGS.push(ringConfig);
  updatePaginationDots();
}

/* Picking a ring option arcs it across into the dice while the other
   options get wiped away carousel-style, then the action opens once the
   animation settles. Classes are cleared right after (behind whatever
   just opened) so the hub is fresh if the user comes back without
   completing anything. */
function selectNode(node, action){
  if(node.classList.contains("chosen") || isTransitioning) return; // already mid-selection or transitioning
  var layer = node.closest(".home-ring-layer") || document.getElementById("home-ring");
  var ring = document.getElementById("home-ring");
  var allNodes = layer ? layer.querySelectorAll(".home-node") : ring.querySelectorAll(".home-node");
  allNodes.forEach(function(n){
    if(n === node) n.classList.add("chosen");
    else n.classList.add("wiping");
  });
  if(ring) ring.classList.add("selecting");

  setTimeout(function(){
    if(typeof action === "function") action();
    allNodes.forEach(function(n){ n.classList.remove("chosen","wiping"); });
    if(ring) ring.classList.remove("selecting");
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
    p2.textContent = "Ragnar's Den follows the standard D&D 5th Edition rules, but it can also include any extra content, homebrew or house rules, basically whatever i want.";
    body.appendChild(p2);
  });
}

/* Places a ring layer at a horizontal offset. The further it is from
   centre, the more it tilts, shrinks and fades, so it reads as the ring
   rolling off to the side. */
function placeLayer(layer, x, width){
  var p = Math.min(Math.abs(x) / width, 1);
  layer.style.visibility = "visible";
  layer.style.transform = "translateX(" + x + "px) rotate(" + (x / width * 30) + "deg) scale(" + (1 - p * 0.15) + ")";
  layer.style.opacity = String(1 - p);
  layer.style.filter = "none";
}

function clearLayerStyles(layer){
  layer.style.transition = "none";
  layer.style.transform = "";
  layer.style.opacity = "";
  layer.style.filter = "";
  layer.style.visibility = "";
  void layer.offsetWidth;
  layer.style.transition = "";
}

function getLayer(ring, idx){
  return ring.querySelector('.home-ring-layer[data-ring-index="' + idx + '"]');
}

function slideDistance(ring){
  var wrapper = ring.parentElement;
  return Math.max((wrapper && wrapper.offsetWidth) || 0, ring.offsetWidth) || 340;
}

/* Slide the radial menu to another ring. `dragOffset` lets a swipe hand
   over mid-gesture so the slide continues from where the finger let go. */
export function switchHomeRing(targetIndex, direction, dragOffset){
  var total = RINGS.length;
  if(total <= 1 || isTransitioning) return;

  var newIndex = ((targetIndex % total) + total) % total;
  if(newIndex === currentRingIndex) return;

  var fromIndex = currentRingIndex;
  currentRingIndex = newIndex;

  if(!direction){
    direction = newIndex > fromIndex ? "next" : "prev";
  }

  var ring = document.getElementById("home-ring");
  if(!ring){
    updatePaginationDots();
    updateDescription();
    return;
  }

  var fromLayer = getLayer(ring, fromIndex);
  var toLayer = getLayer(ring, newIndex);

  if(!fromLayer || !toLayer){
    updatePaginationDots();
    updateDescription();
    return;
  }

  isTransitioning = true;
  updatePaginationDots();
  updateDescription();

  var isNext = direction === "next";
  var width = slideDistance(ring);
  var offset = dragOffset || 0;
  var incomingStart = offset + (isNext ? width : -width);

  // Park both layers at their start positions without animating
  fromLayer.style.transition = "none";
  toLayer.style.transition = "none";
  placeLayer(fromLayer, offset, width);
  placeLayer(toLayer, incomingStart, width);
  void toLayer.offsetWidth;

  // Then slide: current ring rolls out, the next one rolls in to centre
  fromLayer.style.transition = "";
  toLayer.style.transition = "";
  fromLayer.classList.remove("active");
  toLayer.classList.add("active");
  placeLayer(fromLayer, isNext ? -width : width, width);
  placeLayer(toLayer, 0, width);

  setTimeout(function(){
    clearLayerStyles(fromLayer);
    clearLayerStyles(toLayer);
    isTransitioning = false;
  }, TRANSITION_MS);
}

function updatePaginationDots(){
  var dotsContainer = document.getElementById("home-ring-dots");
  if(!dotsContainer) return;

  dotsContainer.innerHTML = "";
  RINGS.forEach(function(ring, idx){
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "home-ring-dot" + (idx === currentRingIndex ? " active" : "");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-selected", idx === currentRingIndex ? "true" : "false");
    dot.setAttribute("aria-label", "Ring " + (idx + 1) + ": " + ring.name);
    dot.title = ring.name;
    dot.addEventListener("click", function(e){
      e.stopPropagation();
      if(idx !== currentRingIndex){
        switchHomeRing(idx, idx > currentRingIndex ? "next" : "prev");
      }
    });
    dotsContainer.appendChild(dot);
  });
}

function updateDescription(){
  var desc = document.getElementById("home-hub-description");
  if(desc && RINGS[currentRingIndex] && RINGS[currentRingIndex].description){
    desc.style.opacity = "0";
    setTimeout(function(){
      desc.textContent = RINGS[currentRingIndex].description;
      desc.style.opacity = "1";
    }, 150);
  }
}

/* Drag / swipe the ring sideways (touch or mouse). The current ring
   follows the pointer with its neighbour peeking in; letting go past the
   threshold slides to that neighbour, otherwise it snaps back. */
function setupRingSwipe(ring){
  var DRAG_START_PX = 8;
  var drag = null;
  var suppressClick = false;

  function neighbourIndex(dx){
    var total = RINGS.length;
    return (((currentRingIndex + (dx < 0 ? 1 : -1)) % total) + total) % total;
  }

  ring.addEventListener("pointerdown", function(e){
    if(e.button !== 0 || isTransitioning || RINGS.length <= 1) return;
    if(ring.classList.contains("selecting")) return;
    drag = { startX: e.clientX, startY: e.clientY, dx: 0, active: false, pointerId: e.pointerId, neighbour: null };
  });

  ring.addEventListener("pointermove", function(e){
    if(!drag || e.pointerId !== drag.pointerId) return;
    var dx = e.clientX - drag.startX;
    var dy = e.clientY - drag.startY;

    if(!drag.active){
      if(Math.abs(dx) < DRAG_START_PX) return;
      if(Math.abs(dy) > Math.abs(dx)){ drag = null; return; } // vertical: let the page scroll
      drag.active = true;
      drag.width = slideDistance(ring);
      ring.classList.add("dragging");
      try{ ring.setPointerCapture(e.pointerId); }catch(err){}
    }

    drag.dx = dx;
    var current = getLayer(ring, currentRingIndex);
    var nIdx = neighbourIndex(dx);
    var neighbour = getLayer(ring, nIdx);
    if(drag.neighbour && drag.neighbour !== neighbour) clearLayerStyles(drag.neighbour);
    drag.neighbour = neighbour;

    if(current) placeLayer(current, dx, drag.width);
    if(neighbour && neighbour !== current) placeLayer(neighbour, dx + (dx < 0 ? drag.width : -drag.width), drag.width);
  });

  function endDrag(e){
    if(!drag || e.pointerId !== drag.pointerId) return;
    var d = drag;
    drag = null;
    if(!d.active) return;

    ring.classList.remove("dragging");
    suppressClick = true;
    setTimeout(function(){ suppressClick = false; }, 0);

    var current = getLayer(ring, currentRingIndex);
    var threshold = Math.min(80, d.width * 0.2);
    if(e.type !== "pointercancel" && Math.abs(d.dx) > threshold){
      var isNext = d.dx < 0;
      switchHomeRing(currentRingIndex + (isNext ? 1 : -1), isNext ? "next" : "prev", d.dx);
      return;
    }

    // Not far enough: snap back to centre
    isTransitioning = true;
    void ring.offsetWidth;
    if(current) placeLayer(current, 0, d.width);
    if(d.neighbour && d.neighbour !== current) placeLayer(d.neighbour, d.dx < 0 ? d.width : -d.width, d.width);
    setTimeout(function(){
      if(current) clearLayerStyles(current);
      if(d.neighbour && d.neighbour !== current) clearLayerStyles(d.neighbour);
      isTransitioning = false;
    }, TRANSITION_MS);
  }

  ring.addEventListener("pointerup", endDrag);
  ring.addEventListener("pointercancel", endDrag);

  // A drag shouldn't also count as tapping whichever option it started on
  ring.addEventListener("click", function(e){
    if(suppressClick){
      e.stopPropagation();
      e.preventDefault();
      suppressClick = false;
    }
  }, true);

  // Stop the browser's native image/SVG drag from hijacking mouse swipes
  ring.addEventListener("dragstart", function(e){ e.preventDefault(); });
}

function setupRingNavigation(){
  var ring = document.getElementById("home-ring");

  if(ring){
    ring.addEventListener("keydown", function(e){
      if(e.key === "ArrowLeft"){
        e.preventDefault();
        switchHomeRing(currentRingIndex - 1, "prev");
      }else if(e.key === "ArrowRight"){
        e.preventDefault();
        switchHomeRing(currentRingIndex + 1, "next");
      }
    });

    setupRingSwipe(ring);
  }

  updatePaginationDots();
}

/* ---- Home hub (the "no character selected" landing screen) ---- */
export function setupHomeMenu(){
  setupRingNavigation();

  // Ring 1 Actions
  var newBtn = document.getElementById("home-node-new");
  var spellbookBtn = document.getElementById("home-node-spellbook");
  var armoryBtn = document.getElementById("home-node-armory");
  var aboutBtn = document.getElementById("home-node-about");
  var compendiumBtn = document.getElementById("home-node-compendium");

  if(newBtn) newBtn.addEventListener("click", function(){ selectNode(newBtn, openWizard); });
  if(spellbookBtn) spellbookBtn.addEventListener("click", function(){ selectNode(spellbookBtn, openSpellbook); });
  if(armoryBtn) armoryBtn.addEventListener("click", function(){ selectNode(armoryBtn, openArmory); });
  if(aboutBtn) aboutBtn.addEventListener("click", function(){ selectNode(aboutBtn, openAbout); });
  if(compendiumBtn) compendiumBtn.addEventListener("click", function(){ selectNode(compendiumBtn, openCompendium); });

  // Ring 2 Placeholder Actions
  var monstersBtn = document.getElementById("home-node-monsters");

  if(monstersBtn) monstersBtn.addEventListener("click", function(){
    selectNode(monstersBtn, function(){ showActionToast("Monsters are coming in a future update!"); });
  });

  var centerBtn = document.getElementById("home-center");
  if(centerBtn) centerBtn.addEventListener("click", toggleDiceTray);
}
