/* ---------------- Character background image ----------------
   Each character can have a background image (cropped to 16:9 in the
   crop modal, stored as a JPEG data URL like the avatar). It's shown dimmed
   behind the sheet, and the sheet's colors are re-tinted from it: the
   dominant hue of the image becomes the accent and tints the dark surfaces,
   by setting the same CSS custom properties the theme picker uses inline on
   <html> while that character is open. The palette is computed once at
   upload and stored on the character (c.backdropPalette), so switching
   characters is just applying a handful of properties. */
import { state, save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { openImageCropper } from "./avatar-crop.js";

var PALETTE_KEYS = ["--brass","--brass-rgb","--brass-bright","--brass-bright2","--brass-hover","--brass-active",
                    "--ink","--ink-deep","--parchment","--parchment-dim","--field-bg",
                    "--text-on-ink","--text-on-ink-dim","--text-on-parch","--text-on-parch-dim"];

/* ---- color helpers ---- */
function rgbToHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var l = (max + min) / 2, h = 0, s = 0;
  if(max !== min){
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if(max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if(max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l){
  h = ((h % 360) + 360) % 360 / 360;
  if(s === 0) return [l * 255, l * 255, l * 255];
  var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  function f(t){
    if(t < 0) t += 1; if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  return [f(h + 1/3) * 255, f(h) * 255, f(h - 1/3) * 255];
}

function toHex(rgb){
  return "#" + rgb.map(function(v){ var n = Math.round(v); return (n < 16 ? "0" : "") + n.toString(16); }).join("");
}
function hsl(h, s, l){ return toHex(hslToRgb(h, s, l)); }

function luminance(rgb){
  var c = rgb.map(function(v){ v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/* Builds the accent + surface tokens for one hue. The accent's lightness is
   lowered until white text on it stays readable (buttons use white text),
   so yellows and greens end up deeper than blues and purples. */
export function paletteForHue(h, s){
  var l = 0.62;
  while(l > 0.4 && luminance(hslToRgb(h, s, l)) > 0.30) l -= 0.02;
  var brass = hslToRgb(h, s, l);
  return {
    "--brass": toHex(brass),
    "--brass-rgb": brass.map(Math.round).join(","),
    "--brass-bright": hsl(h, s * 0.9, 0.80),
    "--brass-bright2": hsl(h, s * 0.8, 0.89),
    "--brass-hover": hsl(h, s, l - 0.08),
    "--brass-active": hsl(h, s, l - 0.16),
    "--ink": hsl(h, 0.26, 0.11),
    "--ink-deep": hsl(h, 0.26, 0.075),
    "--parchment": hsl(h, 0.26, 0.16),
    "--parchment-dim": hsl(h, 0.26, 0.20),
    "--field-bg": hsl(h, 0.30, 0.10),
    "--text-on-ink": hsl(h, 0.30, 0.92),
    "--text-on-ink-dim": hsl(h, 0.16, 0.66),
    "--text-on-parch": hsl(h, 0.30, 0.92),
    "--text-on-parch-dim": hsl(h, 0.16, 0.66)
  };
}

function loadImage(src){
  return new Promise(function(resolve, reject){
    var img = new Image();
    img.onload = function(){ resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

/* Finds the image's dominant vivid hue: pixels are binned by hue (15°
   buckets) and weighted by how colorful they are, ignoring near-black,
   near-white, and washed-out pixels. Resolves null for an image with no
   real color (a grayscale photo), in which case the sheet keeps the app
   theme. */
export function extractPalette(src){
  return loadImage(src).then(function(img){
    var W = 48, H = Math.max(1, Math.round(W * img.height / img.width));
    var canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, W, H);
    var data = ctx.getImageData(0, 0, W, H).data;

    var weight = [], sumH = [], sumS = [];
    for(var b = 0; b < 24; b++){ weight[b] = 0; sumH[b] = 0; sumS[b] = 0; }
    for(var i = 0; i < data.length; i += 4){
      var c = rgbToHsl(data[i], data[i+1], data[i+2]);
      if(c[2] < 0.12 || c[2] > 0.92 || c[1] < 0.2) continue;
      var w = c[1] * (1 - Math.abs(2 * c[2] - 1));
      var bucket = Math.floor(c[0] / 15) % 24;
      weight[bucket] += w; sumH[bucket] += w * c[0]; sumS[bucket] += w * c[1];
    }
    var best = 0;
    for(var k = 1; k < 24; k++){ if(weight[k] > weight[best]) best = k; }
    if(weight[best] < 8) return null;
    var hue = sumH[best] / weight[best];
    var sat = Math.min(0.85, Math.max(0.45, sumS[best] / weight[best]));
    return paletteForHue(hue, sat);
  });
}

/* ---- applying the backdrop ---- */
var appliedUrl = null;

/* Called on every render with the active character (or null on the home
   screen): sets the dimmed image behind the sheet and, if the character has
   a palette and "match colors" is on, the re-tinted surface/accent tokens. */
export function applyBackdrop(c){
  var main = document.getElementById("main");
  var root = document.documentElement;
  var url = c && c.backdrop ? c.backdrop : null;

  main.classList.toggle("has-backdrop", !!url);
  if(url !== appliedUrl){
    if(url) main.style.setProperty("--sheet-bg", 'url("' + url + '")');
    else main.style.removeProperty("--sheet-bg");
    appliedUrl = url;
  }

  var pal = url && c.backdropTheme !== false ? c.backdropPalette : null;
  PALETTE_KEYS.forEach(function(key){
    if(pal && pal[key]) root.style.setProperty(key, pal[key]);
    else root.style.removeProperty(key);
  });
}

/* True when this character's sheet colors currently come from its image
   rather than the app theme. */
export function sheetThemedFromImage(c){
  return !!(c && c.backdrop && c.backdropPalette && c.backdropTheme !== false);
}

/* ---- banner geometry ----
   The banner strip is BANNER_HEIGHT tall and shows the image cover-fit at
   BANNER_FOCUS (its object-position, mirrored in css/sheet/identity.css). How much of
   the picture that is depends on the card width, so the cropper's guide
   uses the widest card (the narrowest band) — everything inside the guide
   is visible on every screen. */
var BANNER_HEIGHT = 120;
var BANNER_FOCUS = 0.4;
var WIDEST_CARD = 916;

function bannerGuide(aspectW, aspectH){
  var scaledH = WIDEST_CARD * aspectH / aspectW;
  var height = BANNER_HEIGHT / scaledH;
  var top = (1 - height) * BANNER_FOCUS;
  return {top: top, height: height, label: "Always visible in the banner"};
}

/* ---- upload flow ---- */
export function setupBackdropUpload(){
  var input = document.getElementById("backdrop-file");
  input.addEventListener("change", function(e){
    var file = e.target.files[0];
    var charId = input.dataset.forChar;
    input.value = "";
    if(!file || !charId) return;
    openImageCropper(file, {
      title: "Background Image",
      hint: "Drag to choose the part of the picture to show, scroll or use the slider to zoom. Keep your subject inside the dashed band so it always shows in the banner.",
      aspect: [16, 9], outW: 1024, outH: 576, circle: false, quality: 0.78,
      guide: bannerGuide(16, 9),
      onSave: function(dataUrl){
        var c = state.characters.find(function(x){ return x.id === charId; });
        if(!c) return;
        extractPalette(dataUrl).catch(function(){ return null; }).then(function(palette){
          c.backdrop = dataUrl;
          c.backdropPalette = palette;
          if(c.backdropTheme === undefined) c.backdropTheme = true;
          save();
          renderAll();
        });
      }
    });
  });
}

function triggerBackdropUpload(charId){
  var input = document.getElementById("backdrop-file");
  input.dataset.forChar = charId;
  input.click();
}

/* Banner strip for the top of the identity card; null without an image.
   Tapping it opens the picker, same as "Change background image" in the
   identity card's ⋮ menu. */
export function buildBanner(c){
  if(!c.backdrop) return null;
  var banner = document.createElement("div");
  banner.className = "identity-banner";
  banner.title = "Change background image";
  var img = document.createElement("img");
  img.src = c.backdrop; img.alt = "";
  banner.appendChild(img);
  banner.addEventListener("click", function(){ triggerBackdropUpload(c.id); });
  return banner;
}

/* Background actions for the identity card's ⋮ menu: add, or change /
   match-colors / remove once there's an image. Each item is
   {label, run, checked?} — `checked` marks an on/off toggle. */
export function backdropMenuItems(c){
  if(!c.backdrop){
    return [{label:"Add background image", run:function(){ triggerBackdropUpload(c.id); }}];
  }
  var items = [{label:"Change background image", run:function(){ triggerBackdropUpload(c.id); }}];
  if(c.backdropPalette){
    items.push({label:"Match colors to image", checked: c.backdropTheme !== false, run:function(){
      c.backdropTheme = c.backdropTheme === false; save(); renderAll();
    }});
  }
  items.push({label:"Remove background image", run:function(){
    c.backdrop = null; c.backdropPalette = null;
    save(); renderAll();
  }});
  return items;
}
