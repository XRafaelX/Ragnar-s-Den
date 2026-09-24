/* ---------------- Image crop modal ----------------
   A blind center-crop can cut off a face (or the interesting part of a
   scene) that isn't centered in the original, so uploads open this modal
   first: drag to reposition, scroll/slider to zoom, inside a stage with
   the target aspect ratio. Saving renders just the visible region onto a
   canvas of the requested size and hands it to the caller as a JPEG data
   URL. Used for the square, circle-masked avatar and the wide background
   image (the element ids keep their original "avatar-crop" names). */
import { state, save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";

var MAX_ZOOM = 3;

var opts = null;          // options for the crop currently open
var frameW = 0, frameH = 0; // stage size in px
var natW = 0, natH = 0;   // natural image dimensions
var fitScale = 1;         // scale at which the image just covers the frame
var scale = 1;            // fitScale * current zoom
var offX = 0, offY = 0;   // image top-left, in stage-space px
var dragging = false;
var dragStartX = 0, dragStartY = 0, startOffX = 0, startOffY = 0;
var objectUrl = null;

function clampOffsets(){
  offX = Math.min(0, Math.max(frameW - natW * scale, offX));
  offY = Math.min(0, Math.max(frameH - natH * scale, offY));
}

function applyTransform(){
  var img = document.getElementById("avatar-crop-img");
  img.style.width = (natW * scale) + "px";
  img.style.height = (natH * scale) + "px";
  img.style.left = offX + "px";
  img.style.top = offY + "px";
}

function setZoom(z){
  z = Math.min(MAX_ZOOM, Math.max(1, z));
  // Keep whatever's currently at the frame's center fixed in image-space,
  // so zooming feels like it's anchored on what you're looking at.
  var cx = (frameW / 2 - offX) / scale;
  var cy = (frameH / 2 - offY) / scale;
  scale = fitScale * z;
  offX = frameW / 2 - cx * scale;
  offY = frameH / 2 - cy * scale;
  clampOffsets();
  applyTransform();
}

/* opts: {title, hint, aspect:[w,h], outW, outH, circle, quality, onSave(dataUrl),
          guide: {top, height, label}  (optional dashed band, as fractions of the frame)} */
export function openImageCropper(file, options){
  opts = options;
  var img = document.getElementById("avatar-crop-img");
  var zoomSlider = document.getElementById("avatar-crop-zoom");

  if(objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);

  img.onload = function(){
    var modal = document.getElementById("avatar-crop-modal");
    var stage = document.getElementById("avatar-crop-stage");
    document.getElementById("avatar-crop-title").textContent = opts.title;
    document.querySelector("#avatar-crop-modal .avatar-crop-hint").textContent = opts.hint;
    stage.style.setProperty("--crop-aspect", opts.aspect[0] + " / " + opts.aspect[1]);
    modal.classList.toggle("crop-wide", opts.aspect[0] > opts.aspect[1]);
    document.getElementById("avatar-crop-mask").classList.toggle("rect", !opts.circle);
    var guide = document.getElementById("avatar-crop-guide");
    guide.style.display = opts.guide ? "block" : "none";
    if(opts.guide){
      guide.style.top = (opts.guide.top * 100) + "%";
      guide.style.height = (opts.guide.height * 100) + "%";
      guide.firstChild.textContent = opts.guide.label;
    }

    // The modal must be visible (not display:none) before its layout can
    // be measured, so open it first and only then read the stage size.
    modal.classList.add("open");
    frameW = stage.clientWidth;
    frameH = stage.clientHeight;
    natW = img.naturalWidth;
    natH = img.naturalHeight;
    fitScale = Math.max(frameW / natW, frameH / natH);
    scale = fitScale;
    offX = (frameW - natW * scale) / 2;
    offY = (frameH - natH * scale) / 2;
    zoomSlider.value = "1";
    applyTransform();
  };
  img.onerror = function(){
    alert("Could not read that image. Try a different file.");
  };
  img.src = objectUrl;
}

/* The character's square, circle-masked profile photo. */
export function openAvatarCropper(file, charId){
  openImageCropper(file, {
    title: "Adjust Photo",
    hint: "Drag to reposition, scroll or use the slider to zoom.",
    aspect: [1, 1], outW: 320, outH: 320, circle: true, quality: 0.85,
    onSave: function(dataUrl){
      var c = state.characters.find(function(x){ return x.id === charId; });
      if(!c) return;
      c.avatar = dataUrl;
      save();
      renderAll();
    }
  });
}

function closeCropper(){
  document.getElementById("avatar-crop-modal").classList.remove("open");
  if(objectUrl){ URL.revokeObjectURL(objectUrl); objectUrl = null; }
  opts = null;
}

export function setupAvatarCropper(){
  var stage = document.getElementById("avatar-crop-stage");
  var img = document.getElementById("avatar-crop-img");
  var zoomSlider = document.getElementById("avatar-crop-zoom");

  stage.addEventListener("pointerdown", function(e){
    dragging = true;
    stage.classList.add("dragging");
    dragStartX = e.clientX; dragStartY = e.clientY;
    startOffX = offX; startOffY = offY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", function(e){
    if(!dragging) return;
    offX = startOffX + (e.clientX - dragStartX);
    offY = startOffY + (e.clientY - dragStartY);
    clampOffsets();
    applyTransform();
  });
  function endDrag(){ dragging = false; stage.classList.remove("dragging"); }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("wheel", function(e){
    e.preventDefault();
    var z = scale / fitScale + (e.deltaY < 0 ? 0.08 : -0.08);
    zoomSlider.value = String(Math.min(MAX_ZOOM, Math.max(1, z)));
    setZoom(Number(zoomSlider.value));
  }, {passive:false});

  zoomSlider.addEventListener("input", function(){ setZoom(Number(zoomSlider.value)); });

  document.getElementById("avatar-crop-cancel").addEventListener("click", closeCropper);
  document.getElementById("avatar-crop-close").addEventListener("click", closeCropper);
  document.getElementById("avatar-crop-save").addEventListener("click", function(){
    if(!opts) return;
    var sW = frameW / scale, sH = frameH / scale;
    var sx = Math.max(0, Math.min(natW - sW, -offX / scale));
    var sy = Math.max(0, Math.min(natH - sH, -offY / scale));
    var canvas = document.createElement("canvas");
    canvas.width = opts.outW;
    canvas.height = opts.outH;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, opts.outW, opts.outH);
    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, opts.outW, opts.outH);
    var dataUrl = canvas.toDataURL("image/jpeg", opts.quality);
    var onSave = opts.onSave;
    closeCropper();
    onSave(dataUrl);
  });
}
