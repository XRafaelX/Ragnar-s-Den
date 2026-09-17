import { state, getActive, save } from "../core/state.js";
import { characterIsCaster, fmtMod, profBonus, clamp, totalLevel } from "../core/helpers.js";
import { RACES } from "../data/races.js";
import { BACKGROUNDS } from "../data/backgrounds.js";
import { ALIGNMENTS } from "../data/alignments.js";
import { CLASS_LIST } from "../data/abilities-skills.js";
import { renderSidebar } from "./sidebar.js";
import { renderVitalsPanel } from "./panels/vitals.js";
import { renderInformationPanel } from "./panels/information.js";
import { renderAbilitiesPanel } from "./panels/abilities.js";
import { renderFeaturesPanel } from "./panels/features.js";
import { renderSpellsPanel } from "./panels/spells.js";
import { renderInventoryPanel } from "./panels/inventory.js";
import { renderJournalPanel } from "./panels/journal.js";
import { renderRollLog } from "../dice/dice.js";
import { makeDeleteButton } from "../app.js";

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

export function renderAll(){
  renderSidebar();
  var c = getActive();
  var empty = document.getElementById("empty-state");
  var sheet = document.getElementById("sheet");
  if(!c){
    empty.style.display = "flex";
    sheet.style.display = "none";
    renderRollLog();
    return;
  }
  if(state.activeTab==="spells" && !characterIsCaster(c)) state.activeTab = "vitals";
  empty.style.display = "none";
  sheet.style.display = "block";
  sheet.innerHTML = "";
  sheet.appendChild(renderIdentity(c));

  var tabsBar = document.createElement("div");
  tabsBar.id = "tabs";
  visibleTabs(c).forEach(function(t){
    var b = document.createElement("button");
    b.textContent = t[1];
    if(state.activeTab===t[0]) b.className = "active";
    b.addEventListener("click", function(){ state.activeTab = t[0]; renderAll(); });
    tabsBar.appendChild(b);
  });
  sheet.appendChild(tabsBar);

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

  renderRollLog();
}

/* Generic dropdown field with grouped standard/expanded options plus a
   "Custom / homebrew" fallback that reveals a free-text input. Used for
   race, background, alignment — anywhere we want guided choices without
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

export function renderIdentity(c){
  var wrap = document.createElement("div");
  wrap.className = "identity";

  var nameRow = document.createElement("div");
  nameRow.className = "name-row";
  var nameInput = document.createElement("input");
  nameInput.className = "charname";
  nameInput.value = c.name;
  nameInput.placeholder = "Character name";
  nameInput.addEventListener("input", function(){ c.name = nameInput.value; save(); renderSidebar(); });
  nameRow.appendChild(nameInput);
  wrap.appendChild(nameRow);

  var subRow = document.createElement("div");
  subRow.className = "sub-row";

  subRow.appendChild(dropdownField("Race", "race", RACES, c, function(){ renderSidebar(); }));
  subRow.appendChild(dropdownField("Background", "background", BACKGROUNDS, c));
  subRow.appendChild(dropdownField("Alignment", "alignment", ALIGNMENTS, c));

  var pbField = document.createElement("div");
  pbField.className = "field";
  pbField.innerHTML = '<label>Proficiency</label>';
  var pbVal = document.createElement("input");
  pbVal.value = fmtMod(profBonus(c));
  pbVal.disabled = true;
  pbVal.style.color = "var(--text-on-parch-dim)";
  pbField.appendChild(pbVal);
  subRow.appendChild(pbField);

  wrap.appendChild(subRow);

  var classesRow = document.createElement("div");
  classesRow.className = "classes-row";
  (c.classes||[]).forEach(function(cl, idx){
    var chip = document.createElement("div");
    chip.className = "class-chip";
    var sel = document.createElement("select");
    sel.style.background = "transparent";
    sel.style.border = "none";
    sel.style.fontSize = "12.5px";
    sel.style.color = "var(--text-on-parch)";
    var freeOpt = document.createElement("option");
    var opts = CLASS_LIST.slice();
    if(cl.name && opts.indexOf(cl.name)===-1) opts.unshift(cl.name);
    opts.forEach(function(name){
      var o = document.createElement("option");
      o.value = name; o.textContent = name;
      if(cl.name===name) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function(){ cl.name = sel.value; save(); renderAll(); });
    var subInput = document.createElement("input");
    subInput.placeholder = "subclass";
    subInput.value = cl.subclass||"";
    subInput.addEventListener("input", function(){ cl.subclass = subInput.value; save(); });
    var lvlInput = document.createElement("input");
    lvlInput.className = "lvl";
    lvlInput.type = "number"; lvlInput.min="1"; lvlInput.max="20";
    lvlInput.value = cl.level||1;
    lvlInput.addEventListener("input", function(){ cl.level = clamp(Number(lvlInput.value)||1,1,20); save(); renderAll(); });
    chip.appendChild(sel);
    chip.appendChild(subInput);
    chip.appendChild(document.createTextNode("Lv"));
    chip.appendChild(lvlInput);
    if((c.classes||[]).length>1){
      var x = document.createElement("span");
      x.className = "x"; x.textContent = "×";
      x.addEventListener("click", function(){ c.classes.splice(idx,1); save(); renderAll(); });
      chip.appendChild(x);
    }
    classesRow.appendChild(chip);
  });
  var addClassBtn = document.createElement("button");
  addClassBtn.className = "btn small";
  addClassBtn.textContent = "+ Multiclass";
  addClassBtn.style.color = "var(--text-on-parch)";
  addClassBtn.style.borderColor = "var(--rule)";
  addClassBtn.addEventListener("click", function(){
    c.classes.push({name:"Fighter", subclass:"", level:1});
    save(); renderAll();
  });
  classesRow.appendChild(addClassBtn);
  var totalSpan = document.createElement("span");
  totalSpan.className = "total-level";
  totalSpan.textContent = "Total level "+totalLevel(c);
  classesRow.appendChild(totalSpan);

  var deleteBtn = makeDeleteButton(c);
  deleteBtn.classList.add("delete-char-btn");
  classesRow.appendChild(deleteBtn);

  wrap.appendChild(classesRow);

  return wrap;
}

export function makeCard(titleText, hint){
  var card = document.createElement("div");
  card.className = "card";
  var h = document.createElement("h3");
  var span = document.createElement("span");
  span.textContent = titleText;
  h.appendChild(span);
  if(hint){
    var hh = document.createElement("span");
    hh.className = "hint"; hh.textContent = hint;
    h.appendChild(hh);
  }
  card.appendChild(h);
  return card;
}
