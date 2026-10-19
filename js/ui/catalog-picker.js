/* ---------------- Full-page catalog picker ----------------
   A generic "browse & add" page (search, category pills, grouped list,
   a custom-entry form behind the + FAB) used for Add Weapon / Add Armor,
   and for the standalone Armory reachable from the sidebar (which shows
   both as switchable sections/tabs). */
import { makeCheckCheckSvg } from "./svg-icons.js";
import { themedPicker } from "./themed-picker.js";

var state = null;

function activeSection(){ return state.sections[state.activeSectionIndex]; }

function makePill(label, active, onClick){
  var b = document.createElement("button");
  b.className = "ff-pill" + (active ? " active" : "");
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

/* A section can supply searchText(name, d) to control what its search box
   matches against (spells search school/classes/summary, say); the default
   covers weapon/armor fields. */
function matchesQuery(section, name, d, q){
  if(!q) return true;
  var text = section.searchText
    ? section.searchText(name, d)
    : name + " " + (d.properties||"") + " " + (d.damageType||"");
  return text.toLowerCase().indexOf(q) !== -1;
}

function renderSectionTabs(){
  var tabsEl = document.getElementById("catalog-tabs");
  tabsEl.innerHTML = "";
  if(state.sections.length < 2){
    tabsEl.style.display = "none";
    return;
  }
  tabsEl.style.display = "flex";
  state.sections.forEach(function(section, i){
    var b = document.createElement("button");
    b.className = "catalog-tab-btn" + (i===state.activeSectionIndex ? " active" : "");
    b.textContent = section.label;
    b.addEventListener("click", function(){
      if(state.activeSectionIndex===i) return;
      state.activeSectionIndex = i;
      state.activeGroup = "all";
      state.query = "";
      document.getElementById("catalog-search").value = "";
      document.getElementById("catalog-search").placeholder = section.searchPlaceholder || "Search…";
      renderCustomForm();
      renderSectionTabs();
      renderPills();
      renderList();
    });
    tabsEl.appendChild(b);
  });
}

/* The category pills sit on one line that scrolls sideways (a swipe, or
   the mouse wheel), faded at an edge with more beyond it. When they don't
   all fit, a ⋯ button at the end lists every category. Picking one keeps
   the line where it was and slides the picked pill into view. */
var pillObserver = null;

function pickGroup(g){
  state.activeGroup = g;
  renderPills();
  renderList();
}

function updatePillOverflow(){
  var scroller = document.querySelector("#catalog-pills .catalog-pill-scroll");
  if(!scroller) return;
  var max = scroller.scrollWidth - scroller.clientWidth;
  scroller.classList.toggle("fade-left", scroller.scrollLeft > 1);
  scroller.classList.toggle("fade-right", scroller.scrollLeft < max - 1);
  document.getElementById("catalog-pills").classList.toggle("overflowing", max > 1);
}

function revealActivePill(scroller){
  var pill = scroller.querySelector(".ff-pill.active");
  if(!pill) return;
  var left = pill.offsetLeft - scroller.offsetLeft, right = left + pill.offsetWidth;
  if(left < scroller.scrollLeft) scroller.scrollLeft = left - 16;
  else if(right > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = right - scroller.clientWidth + 16;
}

function renderPills(){
  var section = activeSection();
  var pillRow = document.getElementById("catalog-pills");
  var old = pillRow.querySelector(".catalog-pill-scroll");
  var keepScroll = old ? old.scrollLeft : 0;
  pillRow.innerHTML = "";

  var scroller = document.createElement("div");
  scroller.className = "catalog-pill-scroll";
  var groups = Object.keys(section.groups);
  scroller.appendChild(makePill("All", state.activeGroup==="all", function(){ pickGroup("all"); }));
  groups.forEach(function(g){
    scroller.appendChild(makePill(g, state.activeGroup===g, function(){ pickGroup(g); }));
  });
  scroller.addEventListener("scroll", updatePillOverflow, {passive:true});
  // A mouse wheel scrolls the line sideways.
  scroller.addEventListener("wheel", function(e){
    if(!e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if(scroller.scrollWidth <= scroller.clientWidth) return;
    e.preventDefault();
    scroller.scrollLeft += e.deltaY;
  }, {passive:false});
  pillRow.appendChild(scroller);

  var more = themedPicker({
    variant: "field", search: false, sheet: true,
    value: state.activeGroup, placeholder: "Categories", ariaLabel: "All categories",
    triggerClass: "catalog-pill-more-btn",
    groups: { "": [{value:"all", label:"All"}].concat(groups.map(function(g){ return {value:g, label:g}; })) },
    onPick: pickGroup
  });
  more.classList.add("catalog-pill-more");
  more.querySelector(".tp-trigger").insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>');
  pillRow.appendChild(more);

  scroller.scrollLeft = keepScroll;
  revealActivePill(scroller);
  updatePillOverflow();
  // Sizes are only known once the overlay shows, and change with the window.
  if(pillObserver) pillObserver.disconnect();
  if(typeof ResizeObserver !== "undefined"){
    pillObserver = new ResizeObserver(updatePillOverflow);
    pillObserver.observe(scroller);
  }
}

function renderRow(section, name, d){
  var row = document.createElement("div");
  row.className = "catalog-row";

  var left = document.createElement("div");
  left.className = "catalog-row-left";
  var nameEl = document.createElement("div");
  nameEl.className = "catalog-row-name";
  nameEl.textContent = name;
  left.appendChild(nameEl);
  var sub = section.renderSub ? section.renderSub(name, d) : "";
  if(sub){
    var subEl = document.createElement("div");
    subEl.className = "catalog-row-sub";
    subEl.textContent = sub;
    left.appendChild(subEl);
  }
  var detail = section.renderDetail ? section.renderDetail(name, d) : "";
  if(detail){
    var detailEl = document.createElement("div");
    detailEl.className = "catalog-row-detail";
    detailEl.textContent = detail;
    left.appendChild(detailEl);
  }
  row.appendChild(left);

  var right = document.createElement("div");
  right.className = "catalog-row-right";
  var parts = section.renderRight ? section.renderRight(name, d) : [];
  parts.forEach(function(text, i){
    if(!text) return;
    var el = document.createElement("div");
    el.className = i===0 ? "catalog-row-primary" : "catalog-row-secondary";
    el.textContent = text;
    right.appendChild(el);
  });

  // A section can add small buttons to a row (Edit / Delete / Customize on
  // custom items): [{label, title, danger, onClick}].
  // They are hidden behind a ⋯ menu button to keep rows compact.
  var actions = section.rowActions ? section.rowActions(name, d) : [];
  if(actions.length){
    var menuWrap = document.createElement("div");
    menuWrap.className = "catalog-row-menu";

    var menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "catalog-row-menu-btn";
    menuBtn.title = "More options";
    menuBtn.setAttribute("aria-label", "More options");
    menuBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';

    var dropdown = document.createElement("div");
    dropdown.className = "catalog-row-dropdown";
    // Prevent clicks inside the dropdown from bubbling to the list
    // (which would trigger the row below or close the menu prematurely)
    dropdown.addEventListener("click", function(e){ e.stopPropagation(); });

    actions.forEach(function(a){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "catalog-dropdown-item" + (a.danger ? " danger" : "");
      b.textContent = a.label;
      if(a.title) b.title = a.title;
      b.addEventListener("click", function(e){
        e.stopPropagation();
        dropdown.classList.remove("open");
        a.onClick();
      });
      dropdown.appendChild(b);
    });

    menuBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var isOpen = dropdown.classList.contains("open");
      // Close any other open dropdowns
      document.querySelectorAll(".catalog-row-dropdown.open").forEach(function(el){
        el.classList.remove("open");
      });
      if(!isOpen) dropdown.classList.add("open");
    });

    // Close on outside click
    document.addEventListener("click", function closeMenu(){
      dropdown.classList.remove("open");
    }, {once: false, capture: false});

    menuWrap.appendChild(menuBtn);
    menuWrap.appendChild(dropdown);
    row.appendChild(menuWrap);
    row.classList.add("has-menu");
  }
  row.appendChild(right);

  row.addEventListener("click", function(){
    var ok = section.onAdd(name, d);
    if(ok===false) return;
    // Brief "Added" badge after the name. A separate element (rather
    // than editing the name text) so quick repeat taps can't leave it
    // stuck on the name.
    var badge = nameEl.querySelector(".catalog-added-badge");
    if(!badge){
      badge = document.createElement("span");
      badge.className = "catalog-added-badge";
      badge.innerHTML = makeCheckCheckSvg() + "Added";
      nameEl.appendChild(badge);
    }
    row.classList.add("added");
    clearTimeout(row._addedTimer);
    row._addedTimer = setTimeout(function(){
      row.classList.remove("added");
      badge.remove();
    }, 900);
  });

  return row;
}

function renderList(){
  var section = activeSection();
  var listEl = document.getElementById("catalog-list");
  listEl.innerHTML = "";
  // A list where some row's right column is too long to sit beside the
  // name on a phone (a feat's prerequisite, a race's bonuses and speed):
  // the stylesheet moves it under the name there, for every row of that
  // list so they all read the same way. Worked out over the whole list,
  // so a search doesn't flip the layout.
  listEl.classList.toggle("long-right", !!section.renderRight && Object.keys(section.groups).some(function(g){
    return section.groups[g].some(function(name){
      return section.renderRight(name, section.data[name]||{}).filter(Boolean).join(" ").length > 28;
    });
  }));
  var q = (state.query||"").toLowerCase().trim();
  var groupNames = Object.keys(section.groups).filter(function(g){
    return state.activeGroup==="all" || state.activeGroup===g;
  });
  var any = false;
  groupNames.forEach(function(g){
    var names = section.groups[g].filter(function(name){
      return matchesQuery(section, name, section.data[name]||{}, q);
    });
    if(!names.length) return;
    any = true;
    var label = document.createElement("div");
    label.className = "catalog-group-label";
    label.textContent = g;
    listEl.appendChild(label);
    names.forEach(function(name){
      listEl.appendChild(renderRow(section, name, section.data[name]||{}));
    });
  });
  if(!any){
    var empty = document.createElement("div");
    empty.className = "catalog-empty";
    empty.textContent = "No matches.";
    listEl.appendChild(empty);
  }
}

function renderCustomForm(){
  var overlay = document.getElementById("catalog-overlay");
  overlay.classList.remove("custom-mode");
  var section = activeSection();
  var customBody = document.getElementById("catalog-custom-body");
  customBody.innerHTML = "";
  var fab = document.getElementById("catalog-fab");
  fab.classList.toggle("no-custom", !section.renderCustomForm);
  if(section.renderCustomForm){
    section.renderCustomForm(customBody, function(){ overlay.classList.remove("custom-mode"); });
  }
}

/* Open the current section's custom form from code (e.g. an Edit button
   that pre-fills it); the form is rebuilt first so it picks up the data. */
export function showCatalogCustomView(){
  if(!state) return;
  renderCustomForm();
  document.getElementById("catalog-overlay").classList.add("custom-mode");
}
/* Rebuild the list, pills and custom form after the section's data
   changed (something was added, edited or deleted). */
export function refreshCatalog(){
  if(!state) return;
  renderCustomForm();
  renderPills();
  renderList();
}

export function openCatalogPicker(config){
  state = {
    sections: config.sections,
    activeSectionIndex: config.initialSection || 0,
    activeGroup: "all",
    query: ""
  };

  var overlay = document.getElementById("catalog-overlay");
  overlay.classList.remove("custom-mode");

  var searchInput = document.getElementById("catalog-search");
  searchInput.value = "";
  searchInput.placeholder = activeSection().searchPlaceholder || "Search…";

  renderSectionTabs();
  renderCustomForm();
  renderPills();
  renderList();
  overlay.classList.add("open");

  function onSearchInput(){ state.query = searchInput.value; renderList(); }
  function onFab(){ overlay.classList.add("custom-mode"); }
  // Leaving the custom view resets its form, so an Edit that was opened
  // (pre-filled) doesn't linger for the next "+".
  function onCustomBack(){ renderCustomForm(); }
  function onBack(){
    overlay.classList.remove("open");
    overlay.classList.remove("custom-mode");
    searchInput.removeEventListener("input", onSearchInput);
    backBtn.removeEventListener("click", onBack);
    fab.removeEventListener("click", onFab);
    customBackBtn.removeEventListener("click", onCustomBack);
    if(config.onClose) config.onClose();
  }

  var backBtn = document.getElementById("catalog-back");
  var fab = document.getElementById("catalog-fab");
  var customBackBtn = document.getElementById("catalog-custom-back");

  searchInput.addEventListener("input", onSearchInput);
  backBtn.addEventListener("click", onBack);
  fab.addEventListener("click", onFab);
  customBackBtn.addEventListener("click", onCustomBack);
}
