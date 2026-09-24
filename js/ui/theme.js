/* ---------------- Theme picker ----------------
   A handful of curated accent palettes, all built on the same dark
   layout; picking one swaps a data-theme attribute on <html>, which
   re-points the --brass* custom properties that the rest of the stylesheets
   reads its accent color through. "purple" is the default and needs no
   attribute (it's what :root already defines), so it's left off the DOM
   and out of storage to keep the common case simple. */
import { playThemeShift } from "./sound.js";
import { getActive, save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { sheetThemedFromImage } from "./backdrop.js";

export var THEME_STORAGE_KEY = "ragnarsDen.theme.v1";
var DEFAULT_THEME = "purple";

export var THEMES = [
  {key:"purple", label:"Purple", swatch:"#8b5cf6"},
  {key:"crimson", label:"Crimson", swatch:"#dc4b63"},
  {key:"moss", label:"Moss", swatch:"#5fb377"},
  {key:"gold", label:"Gold", swatch:"#d9a441"}
];

export function getTheme(){
  try{
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  }catch(e){
    return DEFAULT_THEME;
  }
}

function applyTheme(key){
  if(key === DEFAULT_THEME) document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", key);
}

export function setTheme(key){
  applyTheme(key);
  try{
    localStorage.setItem(THEME_STORAGE_KEY, key);
  }catch(e){
    // Storage may be full or restricted; the theme still applies for this session.
  }
}

/* Reapplies the saved theme once the app boots. index.html also sets it
   inline before first paint (to avoid a flash of the default palette);
   this keeps app state consistent with that if storage changed between
   the two reads (e.g. another tab). */
export function initTheme(){
  applyTheme(getTheme());
}

export function openThemeModal(){
  var modal = document.getElementById("theme-modal");
  var body = document.getElementById("theme-modal-body");
  var startIndex = Math.max(0, THEMES.findIndex(function(t){ return t.key === getTheme(); }));
  body.innerHTML = "";

  // While a character's image is tinting the sheet, the app theme is
  // overridden for that character; say so, and offer the way out.
  var active = getActive();
  if(sheetThemedFromImage(active)){
    var note = document.createElement("div");
    note.className = "theme-override-note";
    var noteText = document.createElement("span");
    noteText.textContent = "Sheet colors come from its image.";
    note.appendChild(noteText);
    var useAppBtn = document.createElement("button");
    useAppBtn.type = "button"; useAppBtn.className = "btn";
    useAppBtn.textContent = "Use app theme";
    useAppBtn.title = "Stop coloring this character’s sheet from its image";
    useAppBtn.addEventListener("click", function(){
      active.backdropTheme = false; save(); renderAll();
      note.remove();
    });
    note.appendChild(useAppBtn);
    body.appendChild(note);
  }

  var preview = document.createElement("div");
  preview.className = "theme-slider-preview";
  var dot = document.createElement("span");
  dot.className = "theme-slider-dot";
  var name = document.createElement("span");
  name.className = "theme-slider-name";
  preview.appendChild(dot);
  preview.appendChild(name);

  var slider = document.createElement("input");
  slider.type = "range";
  slider.id = "theme-slider";
  slider.className = "styled-range";
  slider.min = "0";
  slider.max = String(THEMES.length - 1);
  slider.step = "1";
  slider.value = String(startIndex);
  slider.setAttribute("aria-label", "Theme");

  var ticks = document.createElement("div");
  ticks.className = "theme-slider-ticks";
  THEMES.forEach(function(t){
    var tick = document.createElement("span");
    tick.textContent = t.label;
    ticks.appendChild(tick);
  });
  var tickEls = ticks.querySelectorAll("span");

  function render(index){
    var t = THEMES[index];
    dot.style.background = t.swatch;
    name.textContent = t.label;
    tickEls.forEach(function(el, i){ el.classList.toggle("active", i === index); });
  }

  // "input" fires continuously while dragging, so the app re-themes live
  // as the thumb crosses each stop; no separate confirm step needed.
  slider.addEventListener("input", function(){
    var index = Number(slider.value);
    setTheme(THEMES[index].key);
    render(index);
    playThemeShift(index, THEMES.length);
  });

  render(startIndex);
  body.appendChild(preview);
  body.appendChild(slider);
  body.appendChild(ticks);

  modal.classList.add("open");
  var closeBtn = document.getElementById("theme-modal-close");
  function onClose(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", onClose);
  }
  closeBtn.addEventListener("click", onClose);
}
