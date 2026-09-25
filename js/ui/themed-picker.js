/* ---------------- Themed picker ----------------
   A dropdown drawn by the page instead of the browser. A native <select>
   hands its open list to the browser/OS, which ignores most styling
   (Chrome's white/blue list on desktop, the system wheel on phones), so
   the lists never matched the theme and couldn't be centered or greyed
   out reliably. This one looks the same everywhere.

   themedPicker(opts) returns an element:
     groups       {"Group label": [item, ...]}; a "" label hides the header.
                  An item is a string or {value, label, muted} (muted:
                  a dimmer style, e.g. a "clear" entry).
     value        the current value ("" = nothing picked).
     placeholder  trigger text while nothing is picked.
     ariaLabel    what the picker is for (screen readers).
     variant      "field" (underlined, like a form field; left-aligned list)
                  or "pill" (the ability-score pills; centered list).
     triggerClass extra class for the trigger (e.g. the pill styling).
     search       true/false; default: on when there are more than 12 items.
     homebrew     {noun} to add "Custom / homebrew…" plus a text box for
                  anything not on the list; the search also offers
                  `Use "…"` for what was typed.
     key          stable id so an open homebrew box survives re-renders.
     reasonFor    function(value) -> "" or a short reason ("known",
                  "picked") that greys the item out.
     onPick       function(value, meta): meta.typing is true while typing
                  in the homebrew box (don't re-render then: it would
                  steal focus).
   Keyboard: Enter/Space/Down opens; Up/Down move; Enter picks; Escape or
   Tab closes; a click outside closes. */

var customOpen = {};
export function resetThemedPickers(){ customOpen = {}; }

var CHEVRON = '<svg class="tp-chevron" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
var uidCounter = 0;

function normalize(item){
  return typeof item === "string" ? {value:item, label:item}
    : {value:item.value, label:item.label!=null ? item.label : String(item.value), muted:!!item.muted};
}

export function themedPicker(opts){
  var variant = opts.variant || "field";
  var groups = Object.keys(opts.groups).map(function(label){
    return {label:label, items:opts.groups[label].map(normalize)};
  });
  var all = [];
  groups.forEach(function(g){ all = all.concat(g.items); });
  var useSearch = opts.search!=null ? opts.search : all.length > 12;
  var reasonFor = opts.reasonFor || function(){ return ""; };
  var listId = "tp-list-"+(++uidCounter);

  var value = opts.value==null ? "" : opts.value;
  function findItem(v){ return all.find(function(i){ return i.value===v; }); }
  var isCustom = !!opts.homebrew && (customOpen[opts.key] || (value!=="" && !findItem(value)));

  var wrap = document.createElement("div");
  wrap.className = "tp tp-"+variant;

  var trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "tp-trigger"+(opts.triggerClass ? " "+opts.triggerClass : "");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  var valueSpan = document.createElement("span");
  valueSpan.className = "tp-value";
  trigger.appendChild(valueSpan);
  if(variant==="field") trigger.insertAdjacentHTML("beforeend", CHEVRON);
  wrap.appendChild(trigger);

  var customInput = null;
  if(opts.homebrew){
    customInput = document.createElement("input");
    customInput.type = "text";
    customInput.className = "tp-custom-input";
    customInput.placeholder = "Enter custom "+opts.homebrew.noun;
    customInput.addEventListener("input", function(){ opts.onPick(customInput.value.trim(), {typing:true, custom:true}); });
    wrap.appendChild(customInput);
  }

  function renderTrigger(){
    var item = findItem(value);
    var text = isCustom ? "Custom / homebrew…" : (item ? item.label : (opts.placeholder||"Select…"));
    valueSpan.textContent = text;
    trigger.classList.toggle("placeholder", !isCustom && !item);
    trigger.setAttribute("aria-label", (opts.ariaLabel ? opts.ariaLabel+": " : "")+(isCustom && value ? value : text));
    if(customInput){
      customInput.style.display = isCustom ? "block" : "none";
      if(isCustom && document.activeElement!==customInput) customInput.value = findItem(value) ? "" : value;
    }
  }
  renderTrigger();

  /* ---- The open menu ---- */
  var menu = null, search = null, list = null, entries = [], active = -1;

  function choose(entry){
    close(true);
    if(entry.kind==="homebrew"){
      customOpen[opts.key] = true;
      isCustom = true;
      value = customInput.value.trim();
      renderTrigger();
      customInput.focus();
      opts.onPick(value, {typing:true, custom:true});
      return;
    }
    if(entry.kind==="use"){
      customOpen[opts.key] = true;
      isCustom = true;
      value = entry.value;
      customInput.value = entry.value;
      renderTrigger();
      opts.onPick(value, {custom:true});
      return;
    }
    customOpen[opts.key] = false;
    isCustom = false;
    value = entry.value;
    renderTrigger();
    opts.onPick(value, {});
  }

  function setActive(i){
    if(!entries.length){ active = -1; return; }
    // Skip disabled entries in the direction of travel.
    var dir = i < active ? -1 : 1, n = entries.length, tries = 0;
    i = (i + n) % n;
    while(entries[i].disabled && tries < n){ i = (i + dir + n) % n; tries++; }
    active = i;
    entries.forEach(function(e, j){ e.el.classList.toggle("active", j===active); });
    var focusEl = search || trigger;
    focusEl.setAttribute("aria-activedescendant", entries[active].el.id);
    entries[active].el.scrollIntoView({block:"nearest"});
  }

  function buildList(){
    list.innerHTML = "";
    entries = [];
    var q = search ? search.value.trim().toLowerCase() : "";
    groups.forEach(function(g){
      var items = g.items.filter(function(i){ return !q || i.label.toLowerCase().indexOf(q)!==-1; });
      if(!items.length) return;
      if(g.label){
        var head = document.createElement("li");
        head.className = "tp-group";
        head.setAttribute("role", "presentation");
        head.textContent = g.label;
        list.appendChild(head);
      }
      items.forEach(function(i){
        var reason = reasonFor(i.value);
        addEntry({kind:"item", value:i.value, label:i.label + (reason ? " ("+reason+")" : ""), disabled:!!reason,
          selected:!isCustom && i.value===value, extraClass:i.muted ? "tp-muted" : ""});
      });
    });
    if(opts.homebrew){
      var typed = search ? search.value.trim() : "";
      var exact = typed && all.some(function(i){ return i.label.toLowerCase()===typed.toLowerCase(); });
      if(typed && !exact) addEntry({kind:"use", value:typed, label:"Use “"+typed+"”", extraClass:"tp-homebrew"});
      if(!typed) addEntry({kind:"homebrew", label:"Custom / homebrew…", extraClass:"tp-homebrew", selected:isCustom});
    }
    if(!entries.length){
      var empty = document.createElement("li");
      empty.className = "tp-empty";
      empty.textContent = "No matches";
      list.appendChild(empty);
    }
    var sel = entries.findIndex(function(e){ return e.selected; });
    active = -1;
    if(entries.length) setActive(sel!==-1 ? sel : 0);
  }

  function addEntry(e){
    var li = document.createElement("li");
    li.id = listId+"-"+entries.length;
    li.className = "tp-option"+(e.extraClass ? " "+e.extraClass : "")+(e.selected ? " selected" : "")+(e.disabled ? " disabled" : "");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", e.selected ? "true" : "false");
    if(e.disabled) li.setAttribute("aria-disabled", "true");
    li.textContent = e.label;
    var idx = entries.length;
    if(!e.disabled){
      li.addEventListener("pointerenter", function(){ setActive(idx); });
      li.addEventListener("click", function(){ choose(e); });
    }
    list.appendChild(li);
    e.el = li;
    entries.push(e);
  }

  function open(){
    if(menu) return;
    menu = document.createElement("div");
    menu.className = "tp-menu";
    if(useSearch){
      search = document.createElement("input");
      search.type = "text";
      search.className = "tp-search";
      search.placeholder = "Search…";
      search.setAttribute("aria-label", "Search "+(opts.ariaLabel||"options"));
      search.setAttribute("aria-controls", listId);
      search.addEventListener("input", buildList);
      search.addEventListener("keydown", onKey);
      menu.appendChild(search);
    }
    list = document.createElement("ul");
    list.className = "tp-list";
    list.id = listId;
    list.setAttribute("role", "listbox");
    menu.appendChild(list);
    wrap.appendChild(menu);
    wrap.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    buildList();
    // Don't pop the on-screen keyboard over the list on touch screens;
    // the search box is one tap away there.
    var touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if(search && !touch) search.focus();
    menu.scrollIntoView({block:"nearest", behavior:"smooth"});
    document.addEventListener("pointerdown", onOutside, true);
  }

  function close(keepFocus){
    if(!menu) return;
    menu.remove();
    menu = null; search = null; list = null; entries = []; active = -1;
    wrap.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    document.removeEventListener("pointerdown", onOutside, true);
    if(keepFocus) trigger.focus();
  }
  function onOutside(e){ if(!wrap.contains(e.target)) close(false); }

  function onKey(e){
    if(!menu){
      if(e.key==="ArrowDown" || e.key==="ArrowUp"){ e.preventDefault(); open(); }
      return;
    }
    if(e.key==="Escape"){ e.preventDefault(); close(true); }
    else if(e.key==="ArrowDown"){ e.preventDefault(); setActive(active+1); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); setActive(active-1); }
    else if(e.key==="Enter" || (e.key===" " && !search)){
      e.preventDefault();
      if(active>-1 && !entries[active].disabled) choose(entries[active]);
    }
    else if(e.key==="Tab") close(false);
  }
  trigger.addEventListener("click", function(){ if(menu) close(true); else open(); });
  trigger.addEventListener("keydown", onKey);

  return wrap;
}
