/* ---------------- Character avatar (profile photo) ----------------
   Photos are stored inline as compressed data URLs on the character,
   same as everything else in this offline-first app; no server, no
   external storage. A selected file goes through the crop modal
   (avatar-crop.js) before it's saved, so the user picks which part of
   the photo to keep rather than getting a blind center-crop. */
import { save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { renderSidebar } from "../render/sidebar.js";
import { openAvatarCropper } from "./avatar-crop.js";
import { showActionToast } from "./toast.js";
import { playInspire, playDelete } from "./sound.js";

/* Table rule: Inspiration stacks, up to this many at once. */
export var MAX_INSPIRATION = 3;

var LONG_PRESS_MS = 550;
var LONG_PRESS_SLOP = 10; /* px of finger drift allowed before it counts as a scroll */

export function setupAvatarUpload(){
  var input = document.getElementById("avatar-file");
  input.addEventListener("change", function(e){
    var file = e.target.files[0];
    var charId = input.dataset.forChar;
    input.value = "";
    if(!file || !charId) return;
    openAvatarCropper(file, charId);
  });
}

export function triggerAvatarUpload(charId){
  var input = document.getElementById("avatar-file");
  input.dataset.forChar = charId;
  input.click();
}

export function clearAvatar(c){
  c.avatar = null;
  save();
  renderAll();
}

/* Updates an already-built avatar's initial letter in place (a no-op if
   it's showing a photo instead); used when the name changes so the
   identity block's avatar stays in sync without rebuilding the whole
   block and stealing focus from the name input mid-keystroke. */
export function refreshAvatarInitial(avatarEl, name){
  var initialEl = avatarEl.querySelector(".avatar-initial");
  if(!initialEl) return;
  initialEl.textContent = (name || "?").trim().charAt(0).toUpperCase() || "?";
}

/* Inspiration is gained by long-pressing the avatar and spent by
   tapping its badge. Both update the avatar in place rather than
   re-rendering the sheet so the burst animation isn't thrown away
   mid-play; the sidebar thumbnail is rebuilt to match. */
function characterLabel(c){
  return (c.name || "").trim() || "Your character";
}

/* Toast lines, one picked at random each time. {name} is the character. */
var GAIN_LINES = [
  "✨ {name} is inspired! Somewhere, a bard just felt a disturbance.",
  "✨ {name} is inspired! Main character energy: activated.",
  "✨ {name} is inspired! The dice are nervous.",
  "✨ {name} is inspired! Quick, before the DM changes their mind.",
  "✨ {name} is inspired! Plot armor has been lightly buffed.",
  "✨ {name} is inspired! Cue the dramatic music.",
  "✨ {name} is inspired! Please use responsibly (you won't)."
];
var SPEND_LINES = [
  "{name} spent Inspiration. Let's hope that d20 was worth it.",
  "{name} spent Inspiration. The dice gods have been bribed.",
  "{name} spent Inspiration. No refunds.",
  "{name} spent Inspiration. It's a cool story now, whatever happens.",
  "{name} spent Inspiration. Rolling with main character energy."
];
var EMPTY_LINES = [
  "{name} is out of Inspiration. Back to being a regular adventurer.",
  "{name} is out of Inspiration. Time to do something heroic (or stupid).",
  "{name} is out of Inspiration. The bard is now judging you."
];
var MAX_LINES = [
  "{name} is already maxed out on Inspiration. For more, please beg the DM (PANAIS).",
  "{name} can't hold any more Inspiration. Any more and they'd ascend.",
  "{name} is at max Inspiration. PANAIS says no. PANAIS always says no.",
  "{name} is overflowing with Inspiration. Go spend some, show-off."
];

function pickLine(lines, c){
  return lines[Math.floor(Math.random() * lines.length)].replace("{name}", characterLabel(c));
}

function gainInspiration(c, wrap){
  if(c.inspiration >= MAX_INSPIRATION){
    shake(wrap.querySelector(".inspire-badge"));
    showActionToast(pickLine(MAX_LINES, c) + " (" + MAX_INSPIRATION + "/" + MAX_INSPIRATION + ")");
    return;
  }
  c.inspiration++;
  save();
  syncInspiration(c, wrap);
  playInspire();
  playInspireBurst(wrap);
  showActionToast(pickLine(GAIN_LINES, c) + " (" + c.inspiration + "/" + MAX_INSPIRATION + ")");
  renderSidebar();
}

function spendInspiration(c, wrap){
  if(c.inspiration <= 0) return;
  c.inspiration--;
  save();
  syncInspiration(c, wrap);
  playDelete();
  showActionToast(c.inspiration ? pickLine(SPEND_LINES, c) + " (" + c.inspiration + " left)" : pickLine(EMPTY_LINES, c));
  renderSidebar();
}

function syncInspiration(c, wrap){
  wrap.classList.toggle("inspired", c.inspiration > 0);
  wrap.dataset.inspiration = c.inspiration;
  var badge = wrap.querySelector(".inspire-badge");
  if(badge){
    badge.querySelector(".inspire-count").textContent = c.inspiration;
    badge.title = "Inspiration " + c.inspiration + "/" + MAX_INSPIRATION + ". Tap to spend one";
  }
}

function shake(el){
  if(!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

/* One-shot golden flash + sparks flying out from the avatar. */
function playInspireBurst(wrap){
  var old = wrap.querySelector(".inspire-burst");
  if(old) old.remove();
  wrap.classList.remove("inspire-pop");
  void wrap.offsetWidth; /* restart the pop animation if it's re-triggered */
  wrap.classList.add("inspire-pop");

  var burst = document.createElement("span");
  burst.className = "inspire-burst";
  burst.setAttribute("aria-hidden", "true");
  var ring = document.createElement("span");
  ring.className = "inspire-ring";
  burst.appendChild(ring);
  var count = 14;
  for(var i=0;i<count;i++){
    var spark = document.createElement("span");
    spark.className = "inspire-spark" + (i % 2 ? " star" : "");
    spark.style.setProperty("--a", (360 / count * i + Math.random() * 12) + "deg");
    spark.style.setProperty("--d", (46 + Math.random() * 28) + "px");
    spark.style.animationDelay = (Math.random() * 0.12) + "s";
    burst.appendChild(spark);
  }
  wrap.appendChild(burst);
  setTimeout(function(){
    burst.remove();
    wrap.classList.remove("inspire-pop");
  }, 1300);
}

/* Long-press (touch or mouse) on the editable avatar toggles
   Inspiration. A completed long press swallows the click that follows
   it so it doesn't also open the photo picker. */
function attachLongPress(wrap, c){
  var timer = null, startX = 0, startY = 0, fired = false;

  function cancel(){
    if(timer){ clearTimeout(timer); timer = null; }
    wrap.classList.remove("pressing");
  }

  wrap.addEventListener("pointerdown", function(e){
    if(e.button !== 0 || e.target.closest(".avatar-remove, .inspire-badge")) return;
    fired = false;
    startX = e.clientX; startY = e.clientY;
    wrap.classList.add("pressing");
    timer = setTimeout(function(){
      timer = null;
      fired = true;
      wrap.classList.remove("pressing");
      if(navigator.vibrate) navigator.vibrate(30);
      gainInspiration(c, wrap);
    }, LONG_PRESS_MS);
  });
  wrap.addEventListener("pointermove", function(e){
    if(timer && Math.hypot(e.clientX - startX, e.clientY - startY) > LONG_PRESS_SLOP) cancel();
  });
  wrap.addEventListener("pointerup", cancel);
  wrap.addEventListener("pointerleave", cancel);
  wrap.addEventListener("pointercancel", cancel);
  /* Stops the browser's own long-press menu ("Save image…") on mobile. */
  wrap.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  wrap.addEventListener("click", function(e){
    if(fired){
      fired = false;
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
}

/* Builds a circular avatar element; the character's photo if they have
   one, otherwise their initial on a tinted field. `size` is the
   diameter in px. `editable` adds the click-to-upload and remove
   affordances (identity block); the sidebar list just shows the plain
   thumbnail. */
export function buildAvatar(c, size, editable){
  var wrap = document.createElement("div");
  wrap.className = "avatar" + (editable ? " avatar-editable" : "") + (c.inspiration > 0 ? " inspired" : "");
  wrap.dataset.inspiration = c.inspiration || 0;
  wrap.style.width = size + "px";
  wrap.style.height = size + "px";

  if(c.avatar){
    var img = document.createElement("img");
    img.src = c.avatar;
    img.alt = "";
    img.draggable = false;
    wrap.appendChild(img);
  } else {
    var initial = document.createElement("span");
    initial.className = "avatar-initial";
    initial.style.fontSize = Math.round(size * 0.42) + "px";
    initial.textContent = (c.name || "?").trim().charAt(0).toUpperCase() || "?";
    wrap.appendChild(initial);
  }

  if(editable){
    wrap.title = "Click to change photo · Long-press to gain Inspiration";
    attachLongPress(wrap, c);
    wrap.addEventListener("click", function(){ triggerAvatarUpload(c.id); });

    var editBadge = document.createElement("span");
    editBadge.className = "avatar-edit-badge";
    editBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4.5a2.121 2.121 0 0 1 3 3L7 18l-4 1 1-4Z"/></svg>';
    wrap.appendChild(editBadge);

    /* Always built, hidden by CSS at 0, so syncInspiration can update it in place. */
    var inspireBadge = document.createElement("button");
    inspireBadge.type = "button";
    inspireBadge.className = "inspire-badge";
    inspireBadge.innerHTML = '<span aria-hidden="true">✦</span><span class="inspire-count"></span>';
    inspireBadge.addEventListener("click", function(ev){
      ev.stopPropagation();
      spendInspiration(c, wrap);
    });
    inspireBadge.addEventListener("animationend", function(){ inspireBadge.classList.remove("shake"); });
    wrap.appendChild(inspireBadge);
    syncInspiration(c, wrap);

    if(c.avatar){
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "avatar-remove";
      removeBtn.title = "Remove photo";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", function(ev){
        ev.stopPropagation();
        clearAvatar(c);
      });
      wrap.appendChild(removeBtn);
    }
  }

  return wrap;
}
