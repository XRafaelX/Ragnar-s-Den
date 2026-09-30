import { save } from "../core/state.js";
import { pickTitleIdeas } from "../data/misc.js";
import { makeDiceSvg } from "./svg-icons.js";

/* Character title (an epithet like "the Unbroken"), shown under the name
   on the identity card as gleaming small caps between two ornaments.
   Tap it to edit in place; an empty title shows a quiet "Add a title". */

export var TITLE_MAX = 48;

var SHIMMER_MS = 7000;   // one light sweep per cycle, keep in step with .ct-shine in identity.css
var ENTRANCE_MS = 1100;  // .ct-text's reveal plus the ornaments drawing in

/* The entrance plays when a sheet opens or the title changes, not on every
   re-render: a stepper tap elsewhere rebuilds the whole identity card, and
   replaying it then would be noise. shimmerStart keeps the light sweep's
   phase across those rebuilds so it doesn't restart mid-pass either. */
var lastShown = null;
var shimmerStart = 0;

function flourishSvg(side){
  // Thin rule ending in a diamond by the text, with a dot at the far end.
  // pathLength="1" lets the CSS draw it in with a dash offset of 1 to 0.
  var svg = '<svg viewBox="0 0 44 12" aria-hidden="true">' +
    '<path class="ct-rule" pathLength="1" d="M4 6 H33"/>' +
    '<circle class="ct-dot" cx="2" cy="6" r="1.4"/>' +
    '<path class="ct-gem" d="M38 2.5 L41.5 6 L38 9.5 L34.5 6 Z"/>' +
    '</svg>';
  var span = document.createElement("span");
  span.className = "ct-flourish ct-" + side;
  span.innerHTML = svg;
  return span;
}

function titleDisplay(text, animate){
  var el = document.createElement("div");
  el.className = "char-title" + (animate ? " ct-enter" : "");
  el.setAttribute("role", "button");
  el.tabIndex = 0;
  el.title = "Edit title";
  el.setAttribute("aria-label", "Title: " + text + ". Tap to edit.");
  el.appendChild(flourishSvg("left"));
  // Outer span runs the entrance, inner one carries the gradient and the
  // light sweep, so each gets its own animation delay.
  var t = document.createElement("span");
  t.className = "ct-text";
  var shine = document.createElement("span");
  shine.className = "ct-shine";
  shine.textContent = text;
  // Start the sweep once the entrance is done; otherwise pick up where the
  // last render left off.
  if(animate) shimmerStart = Date.now() + ENTRANCE_MS;
  var since = Date.now() - shimmerStart;
  shine.style.animationDelay = (since < 0 ? -since : -(since % SHIMMER_MS)) + "ms";
  t.appendChild(shine);
  el.appendChild(t);
  el.appendChild(flourishSvg("right"));
  // Glints that twinkle in turn around the text.
  for(var i=0;i<3;i++){
    var s = document.createElement("span");
    s.className = "ct-spark ct-spark-" + (i+1);
    s.setAttribute("aria-hidden", "true");
    el.appendChild(s);
  }
  return el;
}

export function buildCharTitle(c){
  var wrap = document.createElement("div");
  wrap.className = "char-title-wrap";

  function show(){
    wrap.innerHTML = "";
    var text = (c.title || "").trim();
    var key = c.id + "\n" + text;
    var animate = key !== lastShown;
    lastShown = key;
    if(!text){
      var add = document.createElement("button");
      add.type = "button";
      add.className = "char-title-add";
      add.textContent = "+ Add a title";
      add.title = "Give your character a title, like “the Unbroken”";
      add.addEventListener("click", edit);
      wrap.appendChild(add);
      return;
    }
    var d = titleDisplay(text, animate);
    d.addEventListener("click", edit);
    d.addEventListener("keydown", function(e){
      if(e.key==="Enter" || e.key===" "){ e.preventDefault(); edit(); }
    });
    wrap.appendChild(d);
  }

  function edit(){
    wrap.innerHTML = "";
    var row = document.createElement("div");
    row.className = "char-title-edit";
    var input = document.createElement("input");
    input.className = "char-title-input";
    input.value = c.title || "";
    input.maxLength = TITLE_MAX;
    input.placeholder = "e.g. the Unbroken";
    input.setAttribute("aria-label", "Character title");
    var dice = document.createElement("button");
    dice.type = "button";
    dice.className = "btn small ghost char-title-dice";
    dice.innerHTML = makeDiceSvg();
    dice.title = "Suggest a title";
    dice.setAttribute("aria-label", "Suggest a title");
    // Keep focus in the field so tapping the die doesn't count as done.
    dice.addEventListener("pointerdown", function(e){ e.preventDefault(); });
    dice.addEventListener("click", function(){
      var ideas = pickTitleIdeas(2);
      input.value = ideas[0]===input.value ? ideas[1] : ideas[0];
      input.focus();
    });
    var done = false;
    function finish(keep){
      if(done) return;
      done = true;
      if(keep){
        c.title = input.value.trim().slice(0, TITLE_MAX);
        save();
      }
      show();
    }
    input.addEventListener("keydown", function(e){
      if(e.key==="Enter"){ e.preventDefault(); finish(true); }
      else if(e.key==="Escape"){ e.preventDefault(); finish(false); }
    });
    input.addEventListener("blur", function(){ finish(true); });
    row.appendChild(input);
    row.appendChild(dice);
    wrap.appendChild(row);
    input.focus();
    input.select();
  }

  show();
  return wrap;
}
