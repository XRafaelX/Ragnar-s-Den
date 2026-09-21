/* ---------------- Avatar crop modal ----------------
   A blind center-crop can cut off a face that isn't centered in the
   original photo, so an upload opens this modal first: drag to
   reposition, scroll/slider to zoom, inside a square stage with a
   circular mask (matching how the avatar is actually displayed). Saving
   renders just the visible region onto a square canvas and stores that
   as the character's avatar. */
import { state, save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";

var OUTPUT_SIZE = 320;
var JPEG_QUALITY = 0.85;
var MAX_ZOOM = 3;

var frame = 0;          // stage size in px (square)
var natW = 0, natH = 0; // natural image dimensions
var fitScale = 1;       // scale at which the image just covers the frame
var scale = 1;          // fitScale * current zoom
var offX = 0, offY = 0; // image top-left, in stage-space px
var dragging = false;
var dragStartX = 0, dragStartY = 0, startOffX = 0, startOffY = 0;
var pendingCharId = null;
var objectUrl = null;

function clampOffsets(){
  var dispW = natW * scale, dispH = natH * scale;
  offX = Math.min(0, Math.max(frame - dispW, offX));
  offY = Math.min(0, Math.max(frame - dispH, offY));
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
  var newScale = fitScale * z;
  // Keep whatever's currently at the frame's center fixed in image-space,
  // so zooming feels like it's anchored on what you're looking at.
  var cx = (frame / 2 - offX) / scale;
  var cy = (frame / 2 - offY) / scale;
  scale = newScale;
  offX = frame / 2 - cx * scale;
  offY = frame / 2 - cy * scale;
  clampOffsets();
  applyTransform();
}

export function openAvatarCropper(file, charId){
  pendingCharId = charId;
  var img = document.getElementById("avatar-crop-img");
  var zoomSlider = document.getElementById("avatar-crop-zoom");

  if(objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);

  img.onload = function(){
    // The modal must be visible (not display:none) before its layout can
    // be measured, so open it first and only then read the stage size.
    document.getElementById("avatar-crop-modal").classList.add("open");
    var stage = document.getElementById("avatar-crop-stage");
    frame = stage.clientWidth;
    natW = img.naturalWidth;
    natH = img.naturalHeight;
    fitScale = frame / Math.min(natW, natH);
    scale = fitScale;
    offX = (frame - natW * scale) / 2;
    offY = (frame - natH * scale) / 2;
    zoomSlider.value = "1";
    applyTransform();
  };
  img.onerror = function(){
    alert("Could not read that image — try a different file.");
  };
  img.src = objectUrl;
}

function closeCropper(){
  document.getElementById("avatar-crop-modal").classList.remove("open");
  if(objectUrl){ URL.revokeObjectURL(objectUrl); objectUrl = null; }
  pendingCharId = null;
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
    var c = state.characters.find(function(x){ return x.id === pendingCharId; });
    if(c){
      var sSize = frame / scale;
      var sx = Math.max(0, Math.min(natW - sSize, -offX / scale));
      var sy = Math.max(0, Math.min(natH - sSize, -offY / scale));
      var canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      c.avatar = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      save();
      renderAll();
    }
    closeCropper();
  });
}
