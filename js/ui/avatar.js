/* ---------------- Character avatar (profile photo) ----------------
   Photos are stored inline as compressed data URLs on the character,
   same as everything else in this offline-first app — no server, no
   external storage. A selected file goes through the crop modal
   (avatar-crop.js) before it's saved, so the user picks which part of
   the photo to keep rather than getting a blind center-crop. */
import { save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { openAvatarCropper } from "./avatar-crop.js";

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
   it's showing a photo instead) — used when the name changes so the
   identity block's avatar stays in sync without rebuilding the whole
   block and stealing focus from the name input mid-keystroke. */
export function refreshAvatarInitial(avatarEl, name){
  var initialEl = avatarEl.querySelector(".avatar-initial");
  if(!initialEl) return;
  initialEl.textContent = (name || "?").trim().charAt(0).toUpperCase() || "?";
}

/* Builds a circular avatar element — the character's photo if they have
   one, otherwise their initial on a tinted field. `size` is the
   diameter in px. `editable` adds the click-to-upload and remove
   affordances (identity block); the sidebar list just shows the plain
   thumbnail. */
export function buildAvatar(c, size, editable){
  var wrap = document.createElement("div");
  wrap.className = "avatar" + (editable ? " avatar-editable" : "");
  wrap.style.width = size + "px";
  wrap.style.height = size + "px";

  if(c.avatar){
    var img = document.createElement("img");
    img.src = c.avatar;
    img.alt = "";
    wrap.appendChild(img);
  } else {
    var initial = document.createElement("span");
    initial.className = "avatar-initial";
    initial.style.fontSize = Math.round(size * 0.42) + "px";
    initial.textContent = (c.name || "?").trim().charAt(0).toUpperCase() || "?";
    wrap.appendChild(initial);
  }

  if(editable){
    wrap.title = "Click to change photo";
    wrap.addEventListener("click", function(){ triggerAvatarUpload(c.id); });

    var editBadge = document.createElement("span");
    editBadge.className = "avatar-edit-badge";
    editBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4.5a2.121 2.121 0 0 1 3 3L7 18l-4 1 1-4Z"/></svg>';
    wrap.appendChild(editBadge);

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
