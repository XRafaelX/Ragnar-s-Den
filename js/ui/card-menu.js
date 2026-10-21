import { makeKebabSvg } from "./svg-icons.js";

/* The ⋯ button on a card and its small menu ([{label, danger, blocked,
   title, onClick}]; a blocked entry is greyed out but still tapped, to
   say why). Closes on a pick, a tap elsewhere or Escape; taps on it never
   reach the card behind it (an item card's header opens its sheet).
   Used by the inventory's item cards and the companion cards. */
export function cardMenu(ariaLabel, entries){
  var wrap = document.createElement("div");
  wrap.className = "inv-card-menu";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "catalog-row-menu-btn inv-menu-btn";
  btn.innerHTML = makeKebabSvg();
  btn.title = "More options";
  btn.setAttribute("aria-label", ariaLabel);
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  var pop = document.createElement("div");
  pop.className = "catalog-row-dropdown";
  pop.setAttribute("role", "menu");
  entries.forEach(function(en){
    var it = document.createElement("button");
    it.type = "button";
    it.className = "catalog-dropdown-item" + (en.danger ? " danger" : "") + (en.blocked ? " blocked" : "");
    it.setAttribute("role", "menuitem");
    if(en.blocked) it.setAttribute("aria-disabled", "true");
    if(en.title) it.title = en.title;
    it.textContent = en.label;
    it.addEventListener("click", function(e){ e.stopPropagation(); close(); en.onClick(); });
    pop.appendChild(it);
  });
  wrap.appendChild(btn);
  wrap.appendChild(pop);
  wrap.addEventListener("click", function(e){ e.stopPropagation(); });
  function onDocClick(e){ if(!wrap.contains(e.target)) close(); }
  function onKey(e){ if(e.key==="Escape"){ close(); btn.focus(); } }
  function open(){
    pop.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
  }
  function close(){
    pop.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey);
  }
  btn.addEventListener("click", function(){ pop.classList.contains("open") ? close() : open(); });
  return wrap;
}
