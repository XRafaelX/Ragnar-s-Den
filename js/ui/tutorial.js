/* ---------------- First-run tutorial ----------------
   A short spotlight tour of the home screen: each step dims the page,
   cuts a lit hole around one control and points a small popup at it.
   Shown once for brand-new users (no characters, never seen it) and
   replayable from the About modal. */

export var TUTORIAL_STORAGE_KEY = "ragnarsDen.tutorial.v1";

var MOBILE_MAX = 800; // matches the sidebar's off-canvas breakpoint
var GAP = 14;         // space between the lit target and the popup
var EDGE = 12;        // keep the popup this far from the viewport edge

function isMobile(){ return window.innerWidth <= MOBILE_MAX; }
function byId(id){ return function(){ return document.getElementById(id); }; }

/* On phones the sidebar is off-canvas, so its steps point at the
   hamburger instead of at buttons the user can't see. */
var STEPS = [
  {
    title: "Welcome to Ragnar's Den",
    text: "A quick tour of the essentials. It takes less than a minute, and you can skip it any time."
  },
  {
    target: byId("home-node-new"),
    spot: function(el){ return el.querySelector(".home-node-circle"); },
    title: "Create a character",
    text: "Start here. The wizard walks you through race, class, background and ability scores step by step."
  },
  {
    target: byId("home-node-armory"),
    spot: function(el){ return el.querySelector(".home-node-circle"); },
    title: "Grimtooth's Armory",
    text: "Browse weapons, armor and gear, then add them straight to any of your characters."
  },
  {
    target: byId("home-center"),
    pad: 16,
    title: "Roll some dice",
    text: "Tap the die to open the dice roller. On a character sheet, tapping a stat or skill rolls it for you."
  },
  {
    target: byId("dice-fab"),
    title: "Dice, always at hand",
    text: "This button opens the same dice roller from anywhere in the app, with advantage, modifiers and a roll history."
  },
  {
    target: function(){ return isMobile() ? document.getElementById("hamburger") : document.getElementById("sidebar"); },
    title: "Your characters",
    text: function(){
      return isMobile()
        ? "Open the menu to switch between characters, back up your data and change the theme."
        : "Every character you create is listed in this sidebar. Click one to open its sheet.";
    }
  },
  {
    target: byId("export-btn"),
    desktopOnly: true,
    title: "Back up your vault",
    text: "Everything lives only in this browser. Export a backup now and then, and import it to move to another device."
  },
  {
    target: byId("theme-btn"),
    desktopOnly: true,
    title: "Make it yours",
    text: "Pick an accent color for the whole app."
  },
  {
    title: "You're ready",
    text: "Create your first character to get started. You can replay this tour any time from the menu."
  }
];

var els = null;
var steps = [];
var index = 0;
var frame = 0;
var lastKey = "";

function build(){
  var root = document.createElement("div");
  root.id = "tutorial";
  root.innerHTML =
    '<div class="tut-blocker"></div>' +
    '<div class="tut-spotlight"></div>' +
    '<div class="tut-pop" role="dialog" aria-modal="true" aria-labelledby="tut-title" aria-describedby="tut-text">' +
      '<div class="tut-arrow"></div>' +
      '<div class="tut-step"></div>' +
      '<h4 id="tut-title"></h4>' +
      '<p id="tut-text"></p>' +
      '<div class="tut-actions">' +
        '<button type="button" class="btn small ghost tut-skip">Skip</button>' +
        '<div class="tut-dots"></div>' +
        '<button type="button" class="btn small ghost tut-back">Back</button>' +
        '<button type="button" class="btn small primary tut-next">Next</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  els = {
    root: root,
    spot: root.querySelector(".tut-spotlight"),
    pop: root.querySelector(".tut-pop"),
    arrow: root.querySelector(".tut-arrow"),
    step: root.querySelector(".tut-step"),
    title: root.querySelector("#tut-title"),
    text: root.querySelector("#tut-text"),
    dots: root.querySelector(".tut-dots"),
    back: root.querySelector(".tut-back"),
    next: root.querySelector(".tut-next")
  };

  root.querySelector(".tut-skip").addEventListener("click", finish);
  els.back.addEventListener("click", function(){ go(index - 1); });
  els.next.addEventListener("click", function(){ go(index + 1); });
}

function targetOf(step){
  if(!step.target) return null;
  var el = step.target();
  if(!el) return null;
  var r = el.getBoundingClientRect();
  return (r.width && r.height) ? el : null;
}

function go(i){
  if(i < 0) return;
  if(i >= steps.length){ finish(); return; }
  index = i;
  var step = steps[i];

  els.step.textContent = "Step " + (i + 1) + " of " + steps.length;
  els.title.textContent = step.title;
  els.text.textContent = typeof step.text === "function" ? step.text() : step.text;
  els.back.style.visibility = i === 0 ? "hidden" : "visible";
  els.next.textContent = i === steps.length - 1 ? "Let's go" : "Next";

  els.dots.innerHTML = "";
  steps.forEach(function(_, d){
    var dot = document.createElement("span");
    if(d === i) dot.className = "on";
    els.dots.appendChild(dot);
  });

  // Restart the pop-in so each step feels like a fresh popup.
  els.pop.classList.remove("in");
  void els.pop.offsetWidth;
  els.pop.classList.add("in");

  lastKey = "";
  position();
  els.next.focus({ preventScroll: true });
}

/* Places the spotlight over the target and the popup on whichever side
   has room (below, above, right, left), then slides the arrow along the
   popup's edge so it still points at the lit spot after clamping.
   A step can light a smaller part of its target (`spot`, e.g. just a
   home node's circle, not its label) and widen the halo (`pad`); the
   popup still steers clear of the whole target. */
function position(){
  if(!els) return;
  var step = steps[index];
  var el = targetOf(step);
  var hole = el && step.spot ? (step.spot(el) || el) : el;
  var vw = window.innerWidth, vh = window.innerHeight;
  var pw = els.pop.offsetWidth, ph = els.pop.offsetHeight;

  // Skip the layout writes when nothing moved since the last frame.
  var r = el ? el.getBoundingClientRect() : null;
  var h = hole ? hole.getBoundingClientRect() : null;
  var key = [vw, vh, pw, ph, r ? [r.left, r.top, r.width, r.height, h.left, h.top, h.width, h.height].join() : "-"].join("|");
  if(key === lastKey) return;
  lastKey = key;

  if(!el){
    els.spot.classList.add("none");
    els.arrow.style.display = "none";
    els.pop.style.left = Math.max(EDGE, (vw - pw) / 2) + "px";
    els.pop.style.top = Math.max(EDGE, (vh - ph) / 2) + "px";
    return;
  }

  // Circles get a square, centered halo so the ring stays concentric
  // with the element even if its box is a pixel or two off square.
  var pad = step.pad || 6;
  var round = getComputedStyle(hole).borderRadius === "50%";
  var cx = h.left + h.width / 2, cy = h.top + h.height / 2;
  var sw = h.width + pad * 2, sh = h.height + pad * 2;
  if(round) sw = sh = Math.max(sw, sh);
  var spot = { left: cx - sw / 2, top: cy - sh / 2, right: cx + sw / 2, bottom: cy + sh / 2 };
  els.spot.classList.remove("none");
  els.spot.style.left = spot.left + "px";
  els.spot.style.top = spot.top + "px";
  els.spot.style.width = sw + "px";
  els.spot.style.height = sh + "px";
  els.spot.style.borderRadius = round ? "50%" : "10px";

  // Keep-out box: the lit spot plus the rest of the target (labels etc).
  var box = {
    left: Math.min(spot.left, r.left),
    top: Math.min(spot.top, r.top),
    right: Math.max(spot.right, r.right),
    bottom: Math.max(spot.bottom, r.bottom)
  };
  var space = {
    bottom: vh - box.bottom,
    top: box.top,
    right: vw - box.right,
    left: box.left
  };
  var side = ["bottom", "top", "right", "left"].find(function(s){
    var need = (s === "top" || s === "bottom") ? ph : pw;
    return space[s] >= need + GAP + EDGE;
  }) || "bottom";

  var left, top;
  if(side === "bottom" || side === "top"){
    left = Math.min(Math.max(cx - pw / 2, EDGE), vw - pw - EDGE);
    top = side === "bottom" ? box.bottom + GAP : box.top - GAP - ph;
  }else{
    top = Math.min(Math.max(cy - ph / 2, EDGE), vh - ph - EDGE);
    left = side === "right" ? box.right + GAP : box.left - GAP - pw;
  }
  els.pop.style.left = left + "px";
  els.pop.style.top = top + "px";

  els.arrow.style.display = "";
  els.arrow.className = "tut-arrow " + side;
  if(side === "bottom" || side === "top"){
    els.arrow.style.left = Math.min(Math.max(cx - left, 18), pw - 18) + "px";
    els.arrow.style.top = "";
  }else{
    els.arrow.style.top = Math.min(Math.max(cy - top, 18), ph - 18) + "px";
    els.arrow.style.left = "";
  }
}

/* Re-checks every frame so the spotlight follows targets that are still
   animating in (the home ring pops), scroll, or move on resize. */
function track(){
  position();
  frame = requestAnimationFrame(track);
}

function onKey(e){
  if(e.key === "Escape"){ e.preventDefault(); finish(); }
  else if(e.key === "ArrowRight"){ e.preventDefault(); go(index + 1); }
  else if(e.key === "ArrowLeft"){ e.preventDefault(); go(index - 1); }
}

function markSeen(){
  try{ localStorage.setItem(TUTORIAL_STORAGE_KEY, "1"); }catch(e){}
}

function finish(){
  if(!els) return;
  markSeen();
  cancelAnimationFrame(frame);
  document.removeEventListener("keydown", onKey, true);
  var root = els.root;
  els = null;
  root.classList.add("out");
  setTimeout(function(){ root.remove(); }, 250);
}

export function startTutorial(){
  if(els) return;
  steps = STEPS.filter(function(s){ return !(s.desktopOnly && isMobile()); });
  build();
  document.addEventListener("keydown", onKey, true);
  go(0);
  frame = requestAnimationFrame(track);
}

/* Only for a genuinely new user: someone who already has characters
   (e.g. from before this tour existed) is marked as seen and skipped. */
export function maybeStartTutorial(hasCharacters){
  var seen = false;
  try{ seen = !!localStorage.getItem(TUTORIAL_STORAGE_KEY); }catch(e){ return; }
  if(seen) return;
  if(hasCharacters){ markSeen(); return; }
  // A short beat so the home hub is seen before the page dims.
  setTimeout(startTutorial, 700);
}
