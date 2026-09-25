/* ---------------- Full-page catalog picker ----------------
   A generic "browse & add" page (search, category pills, grouped list,
   a custom-entry form behind the + FAB) used for Add Weapon / Add Armor,
   and for the standalone Armory reachable from the sidebar (which shows
   both as switchable sections/tabs). */
import { makeCheckCheckSvg } from "./svg-icons.js";

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

function renderPills(){
  var section = activeSection();
  var pillRow = document.getElementById("catalog-pills");
  pillRow.innerHTML = "";
  pillRow.appendChild(makePill("All", state.activeGroup==="all", function(){
    state.activeGroup = "all"; renderPills(); renderList();
  }));
  Object.keys(section.groups).forEach(function(g){
    pillRow.appendChild(makePill(g, state.activeGroup===g, function(){
      state.activeGroup = g; renderPills(); renderList();
    }));
  });
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
