import { state, getActive, save } from "../core/state.js";
import { characterIsCaster, fmtMod, profBonus, unseenUnlockCount } from "../core/helpers.js";
import { renderSidebar } from "./sidebar.js";
import { renderVitalsPanel } from "./panels/vitals.js";
import { renderInformationPanel } from "./panels/information.js";
import { renderAbilitiesPanel } from "./panels/abilities.js";
import { renderFeaturesPanel } from "./panels/features.js";
import { renderSpellsPanel } from "./panels/spells.js";
import { renderInventoryPanel } from "./panels/inventory.js";
import { renderJournalPanel } from "./panels/journal.js";
import { renderRollLog } from "../dice/dice.js";
import { confirmDeleteCharacter } from "../app.js";
import { makeKebabSvg, makeCheckSvg } from "../ui/svg-icons.js";
import { buildLevelRow, subclassEligible, openSubclassPicker } from "../levelup/level-row.js";
import { buildAvatar, refreshAvatarInitial } from "../ui/avatar.js";
import { applyBackdrop, backdropMenuItems, buildBanner } from "../ui/backdrop.js";

export var TABS = [
  ["vitals","Vitals"],
  ["info","Information"],
  ["abilities","Abilities & Skills"],
  ["features","Features & Feats"],
  ["spells","Spells"],
  ["inventory","Inventory"],
  ["journal","Journal"]
];
export function visibleTabs(c){
  return TABS.filter(function(t){ return t[0]!=="spells" || characterIsCaster(c); });
}

var lastTabsActive = null;
var lastTabsCharId = null;

/* Glide the active tab to the middle of the bar, so the neighbouring
   sections on both sides stay in view and the next tap is easy. */
function centerActiveTab(tabsBar){
  var btn = tabsBar.querySelector("button.active");
  if(!btn) return;
  var maxScroll = tabsBar.scrollWidth - tabsBar.clientWidth;
  if(maxScroll<=0) return;
  var barRect = tabsBar.getBoundingClientRect();
  var btnRect = btn.getBoundingClientRect();
  var btnCenter = btnRect.left - barRect.left + tabsBar.scrollLeft + btnRect.width/2;
  var target = Math.min(maxScroll, Math.max(0, btnCenter - tabsBar.clientWidth/2));
  if(Math.abs(target - tabsBar.scrollLeft) < 1) return;
  tabsBar.scrollTo({left: target, behavior:"smooth"});
}

/* Fade whichever edge still has hidden tabs behind it (left, right or
   both), so it's clear the bar scrolls in that direction. */
function setupTabsEdgeFade(tabsBar){
  var queued = false;
  function update(){
    queued = false;
    var maxScroll = tabsBar.scrollWidth - tabsBar.clientWidth;
    tabsBar.classList.toggle("fade-start", tabsBar.scrollLeft > 1);
    tabsBar.classList.toggle("fade-end", tabsBar.scrollLeft < maxScroll - 1);
  }
  tabsBar.addEventListener("scroll", function(){
    if(!queued){ queued = true; requestAnimationFrame(update); }
  }, {passive:true});
  update();
}

export function renderAll(){
  renderSidebar();
  var c = getActive();
  applyBackdrop(c);
  var empty = document.getElementById("empty-state");
  var sheet = document.getElementById("sheet");
  if(!c){
    empty.style.display = "flex";
    sheet.style.display = "none";
    renderRollLog();
    return;
  }
  if(state.activeTab==="spells" && !characterIsCaster(c)) state.activeTab = "vitals";
  // The tab bar is rebuilt below; remember where it was scrolled so the new
  // one starts from the same spot instead of snapping back to the far left.
  var oldTabsBar = document.getElementById("tabs");
  var prevTabsScroll = oldTabsBar && lastTabsCharId===c.id ? oldTabsBar.scrollLeft : 0;
  // Same for the page itself: clearing the sheet collapses #main, which
  // resets its scroll to the top. Keep the spot when the rebuild is just an
  // edit (same character and tab), e.g. a stepper far down the Vitals tab.
  var mainEl = document.getElementById("main");
  var sameView = lastTabsCharId===c.id && lastTabsActive===state.activeTab;
  var prevMainScroll = mainEl && sameView ? mainEl.scrollTop : null;
  empty.style.display = "none";
  sheet.style.display = "block";
  sheet.innerHTML = "";
  sheet.appendChild(renderIdentity(c));

  var tabsBar = document.createElement("div");
  tabsBar.id = "tabs";
  visibleTabs(c).forEach(function(t){
    var b = document.createElement("button");
    b.textContent = t[1];
    b.dataset.tab = t[0];
    if(t[0]==="features" && unseenUnlockCount(c)){
      var dot = document.createElement("span");
      dot.className = "tab-new-dot";
      dot.title = "New features unlocked";
      b.appendChild(dot);
    }
    if(state.activeTab===t[0]) b.className = "active";
    b.addEventListener("click", function(){ state.activeTab = t[0]; renderAll(); });
    tabsBar.appendChild(b);
  });
  sheet.appendChild(tabsBar);
  tabsBar.scrollLeft = prevTabsScroll;
  setupTabsEdgeFade(tabsBar);
  // Only glide when the tab actually changed, so editing something on the
  // current tab doesn't yank the bar back after a manual swipe.
  if(lastTabsActive!==state.activeTab || lastTabsCharId!==c.id) centerActiveTab(tabsBar);
  lastTabsActive = state.activeTab;
  lastTabsCharId = c.id;

  var panelMap = {
    vitals: renderVitalsPanel,
    info: renderInformationPanel,
    abilities: renderAbilitiesPanel,
    features: renderFeaturesPanel,
    spells: renderSpellsPanel,
    inventory: renderInventoryPanel,
    journal: renderJournalPanel
  };
  visibleTabs(c).forEach(function(t){
    var panel = panelMap[t[0]](c);
    panel.className = "panel" + (state.activeTab===t[0] ? " active" : "");
    sheet.appendChild(panel);
  });
  if(prevMainScroll!=null) mainEl.scrollTop = prevMainScroll;

  renderRollLog();
}

/* Generic dropdown field with grouped standard/expanded options plus a
   "Custom / homebrew" fallback that reveals a free-text input. Used for
   race, background, alignment; anywhere we want guided choices without
   ever blocking something not on the list. */
export function dropdownField(labelTxt, key, groups, c, onChangeExtra){
  var f = document.createElement("div");
  f.className = "field";
  var l = document.createElement("label"); l.textContent = labelTxt;
  f.appendChild(l);

  var allValues = [];
  Object.keys(groups).forEach(function(g){ allValues = allValues.concat(groups[g]); });

  var select = document.createElement("select");
  var blankOpt = document.createElement("option");
  blankOpt.value = ""; blankOpt.textContent = "Select "+labelTxt.toLowerCase();
  blankOpt.disabled = true;
  blankOpt.hidden = true;
  select.appendChild(blankOpt);
  Object.keys(groups).forEach(function(groupLabel){
    var og = document.createElement("optgroup");
    og.label = groupLabel;
    groups[groupLabel].forEach(function(opt){
      var o = document.createElement("option");
      o.value = opt; o.textContent = opt;
      og.appendChild(o);
    });
    select.appendChild(og);
  });
  var customOpt = document.createElement("option");
  customOpt.value = "__custom__"; customOpt.textContent = "Custom / homebrew…";
  select.appendChild(customOpt);

  var customInput = document.createElement("input");
  customInput.type = "text";
  customInput.placeholder = "Enter custom "+labelTxt.toLowerCase();
  customInput.style.display = "none";
  customInput.style.marginTop = "3px";

  function updatePlaceholderStyle(){
    select.classList.toggle("placeholder", select.value==="");
  }

  var currentVal = c[key]||"";
  if(currentVal && allValues.indexOf(currentVal)===-1){
    select.value = "__custom__";
    customInput.value = currentVal;
    customInput.style.display = "block";
  } else {
    select.value = currentVal;
  }
  updatePlaceholderStyle();

  select.addEventListener("change", function(){
    if(select.value==="__custom__"){
      customInput.style.display = "block";
      customInput.focus();
      c[key] = customInput.value;
    } else {
      customInput.style.display = "none";
      c[key] = select.value;
    }
    updatePlaceholderStyle();
    save();
    if(onChangeExtra) onChangeExtra();
  });
  customInput.addEventListener("input", function(){
    c[key] = customInput.value;
    save();
    if(onChangeExtra) onChangeExtra();
  });

  f.appendChild(select);
  f.appendChild(customInput);
  return f;
}

/* A fixed, non-editable field; used for choices locked in at character
   creation (race, background, alignment) so they can't drift by accident
   later on the sheet. */
function lockedField(labelTxt, value){
  var f = document.createElement("div");
  f.className = "field";
  var l = document.createElement("label"); l.textContent = labelTxt;
  f.appendChild(l);
  var val = document.createElement("input");
  val.value = value || "Not set";
  val.disabled = true;
  val.style.color = "var(--text-on-parch-dim)";
  val.title = labelTxt + " is set during character creation and can't be changed here.";
  f.appendChild(val);
  return f;
}

/* ⋮ overflow menu in the identity card's top-right corner. Holds the
   rarely used actions (background image and Delete character) so they
   don't take rows of their own. Closes on an outside tap or Escape. */
function buildIdentityMenu(c){
  var menu = document.createElement("div");
  menu.className = "identity-menu";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "identity-menu-btn";
  btn.innerHTML = makeKebabSvg();
  btn.title = "More options";
  btn.setAttribute("aria-label", "More options");
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  var pop = document.createElement("div");
  pop.className = "identity-menu-pop";
  pop.setAttribute("role", "menu");

  function addItem(label, run, extraClass, checked){
    var item = document.createElement("button");
    item.type = "button";
    item.className = "identity-menu-item" + (extraClass ? " " + extraClass : "");
    if(checked===undefined){
      item.setAttribute("role", "menuitem");
      item.textContent = label;
    } else {
      item.setAttribute("role", "menuitemcheckbox");
      item.setAttribute("aria-checked", checked ? "true" : "false");
      var mark = document.createElement("span");
      mark.className = "identity-menu-check";
      if(checked) mark.innerHTML = makeCheckSvg();
      item.appendChild(mark);
      item.appendChild(document.createTextNode(label));
    }
    item.addEventListener("click", function(){ close(); run(); });
    pop.appendChild(item);
  }
  backdropMenuItems(c).forEach(function(it){ addItem(it.label, it.run, "", it.checked); });
  var sep = document.createElement("div");
  sep.className = "identity-menu-sep";
  sep.setAttribute("role", "separator");
  pop.appendChild(sep);
  addItem("Delete character", function(){ confirmDeleteCharacter(c); }, "danger");
  menu.appendChild(btn);
  menu.appendChild(pop);

  function onDocClick(e){ if(!menu.contains(e.target)) close(); }
  function onKey(e){ if(e.key==="Escape"){ close(); btn.focus(); } }
  function open(){
    menu.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
  }
  function close(){
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey);
  }
  btn.addEventListener("click", function(){ menu.classList.contains("open") ? close() : open(); });
  return menu;
}

export function renderIdentity(c){
  var wrap = document.createElement("div");
  wrap.className = "identity";

  var banner = buildBanner(c);
  if(banner){
    wrap.classList.add("has-banner");
    wrap.appendChild(banner);
  }

  var topRow = document.createElement("div");
  topRow.className = "identity-top";
  var avatarEl = buildAvatar(c, 76, true);
  topRow.appendChild(avatarEl);

  var main = document.createElement("div");
  main.className = "identity-main";

  var nameRow = document.createElement("div");
  nameRow.className = "name-row";
  var nameInput = document.createElement("input");
  nameInput.className = "charname";
  nameInput.value = c.name;
  nameInput.placeholder = "Character name";
  nameInput.addEventListener("input", function(){
    c.name = nameInput.value;
    save();
    refreshAvatarInitial(avatarEl, c.name);
    renderSidebar();
  });
  nameRow.appendChild(nameInput);
  main.appendChild(nameRow);

  var subRow = document.createElement("div");
  subRow.className = "sub-row";

  subRow.appendChild(lockedField("Race", c.race));
  subRow.appendChild(lockedField("Background", c.background));
  subRow.appendChild(lockedField("Alignment", c.alignment));

  var pbField = document.createElement("div");
  pbField.className = "field";
  pbField.innerHTML = '<label>Proficiency</label>';
  var pbVal = document.createElement("input");
  pbVal.value = fmtMod(profBonus(c));
  pbVal.disabled = true;
  pbVal.style.color = "var(--text-on-parch-dim)";
  pbField.appendChild(pbVal);
  subRow.appendChild(pbField);

  main.appendChild(subRow);

  // Phone-only stand-in for the sub-row: the four stacked fields made the
  // card very tall there, and race/background/alignment are locked anyway
  // (details live on the Information tab). CSS picks which one shows.
  var compact = document.createElement("div");
  compact.className = "identity-compact";
  var summary = document.createElement("span");
  summary.className = "identity-summary";
  summary.textContent = [c.race, c.background, c.alignment].filter(Boolean).join(" · ");
  compact.appendChild(summary);
  var pbPill = document.createElement("span");
  pbPill.className = "identity-pb-pill";
  pbPill.textContent = "Prof " + fmtMod(profBonus(c));
  pbPill.title = "Proficiency bonus";
  compact.appendChild(pbPill);
  main.appendChild(compact);
  topRow.appendChild(main);
  wrap.appendChild(topRow);

  // Classes are read-only here: levels (and multiclassing) go through the
  // Level up flow so HP, features and spell slots stay in step. A chip is
  // tappable to pick a subclass once its class has reached that level.
  var classesRow = document.createElement("div");
  classesRow.className = "classes-row";
  (c.classes||[]).forEach(function(cl){
    var eligible = subclassEligible(cl);
    var chip = document.createElement(eligible ? "button" : "div");
    chip.className = "class-chip" + (eligible ? " clickable" : "");
    var nameEl = document.createElement("b");
    nameEl.textContent = (cl.name||"?") + " " + (cl.level||1);
    chip.appendChild(nameEl);
    if(cl.subclass){
      var sub = document.createElement("span");
      sub.className = "class-chip-sub";
      sub.textContent = cl.subclass;
      chip.appendChild(sub);
    } else if(eligible){
      var pick = document.createElement("span");
      pick.className = "class-chip-pick";
      pick.textContent = "Choose subclass";
      chip.appendChild(pick);
    }
    if(eligible){
      chip.type = "button";
      chip.title = "Choose " + (cl.subclass ? "a different" : "a") + " subclass";
      chip.addEventListener("click", function(){ openSubclassPicker(c, cl); });
    }
    classesRow.appendChild(chip);
  });

  wrap.appendChild(classesRow);
  wrap.appendChild(buildLevelRow(c));

  wrap.appendChild(buildIdentityMenu(c));

  return wrap;
}

export function makeCard(titleText){
  var card = document.createElement("div");
  card.className = "card";
  var h = document.createElement("h3");
  var span = document.createElement("span");
  span.textContent = titleText;
  h.appendChild(span);
  card.appendChild(h);
  return card;
}
