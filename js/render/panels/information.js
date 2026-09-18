import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { openInfoModal } from "../../ui/info-modal.js";
import { RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../../data/races.js";
import { BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../../data/backgrounds.js";
import { ALIGNMENT_INFO, ALIGNMENT_INFO_FALLBACK } from "../../data/alignments.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../../data/classes.js";
import { ABILITIES } from "../../data/abilities-skills.js";
import { LANGUAGES } from "../../data/languages.js";

/* ---- Information panel ----
   A calm "About the character" summary. Proficiencies & Languages are
   short enough to show outright; everything else (lore blurbs, trait
   lists, feature text) is one tap away in a modal instead of being
   dumped on screen, so the tab stays scannable for a new player. */

var ABILITY_NAME = {};
ABILITIES.forEach(function(a){ ABILITY_NAME[a[0]] = a[1]; });

function splitIntoTraits(text){
  return (text||"").split(/\.\s+/)
    .map(function(s){ return s.replace(/\.\s*$/,"").trim(); })
    .filter(Boolean);
}

function bulletList(items){
  var ul = document.createElement("ul");
  ul.className = "info-list";
  items.forEach(function(item){
    var li = document.createElement("li");
    if(typeof item === "string"){
      li.textContent = item;
    } else {
      var strong = document.createElement("strong");
      strong.textContent = item.name;
      li.appendChild(strong);
      if(item.text){
        li.appendChild(document.createTextNode(" — " + item.text));
      }
    }
    ul.appendChild(li);
  });
  return ul;
}

function blurb(text){
  var p = document.createElement("p");
  p.className = "info-blurb";
  p.textContent = text;
  return p;
}

function chipRow(label, values){
  var row = document.createElement("div");
  row.className = "info-chip-row";
  var l = document.createElement("span");
  l.className = "info-label";
  l.textContent = label;
  row.appendChild(l);
  if(!values.length){
    var none = document.createElement("span");
    none.className = "info-chip-none";
    none.textContent = "None";
    row.appendChild(none);
  } else {
    var wrap = document.createElement("div");
    wrap.className = "info-chips";
    values.forEach(function(v){
      var chip = document.createElement("span");
      chip.className = "info-chip";
      chip.textContent = v;
      wrap.appendChild(chip);
    });
    row.appendChild(wrap);
  }
  return row;
}

function emptyNote(text){
  var p = document.createElement("p");
  p.className = "info-empty-note";
  p.textContent = text;
  return p;
}

/* A tappable summary row: label + value on the left, a chevron on the
   right. Opens a modal with the full detail on click. */
function linkRow(label, value, modalTitle, buildContent){
  var row = document.createElement("button");
  row.type = "button";
  row.className = "info-link-row";

  var left = document.createElement("span");
  left.className = "info-link-left";
  var l = document.createElement("span");
  l.className = "info-label";
  l.textContent = label;
  var v = document.createElement("span");
  v.className = "info-link-value";
  v.textContent = value || "—";
  left.appendChild(l);
  left.appendChild(v);
  row.appendChild(left);

  var chevron = document.createElement("span");
  chevron.className = "info-link-chevron";
  chevron.textContent = "›";
  row.appendChild(chevron);

  row.addEventListener("click", function(){
    openInfoModal(modalTitle, buildContent);
  });
  return row;
}

export function renderInformationPanel(c){
  var panel = document.createElement("div");
  var bg = BACKGROUND_INFO[c.background];

  // 1. About — compact, tappable rows that open modals with the details
  var aboutCard = makeCard("About");

  aboutCard.appendChild(linkRow("Background", c.background, "Background · " + (c.background || ""), function(body){
    body.appendChild(blurb(bg ? bg.blurb : BACKGROUND_INFO_FALLBACK));
    if(bg && bg.skills && bg.skills.length){
      body.appendChild(chipRow("Skill Proficiencies", bg.skills));
    }
  }));

  aboutCard.appendChild(linkRow("Alignment", c.alignment, "Alignment · " + (c.alignment || ""), function(body){
    body.appendChild(blurb(ALIGNMENT_INFO[c.alignment] || ALIGNMENT_INFO_FALLBACK));
  }));

  aboutCard.appendChild(linkRow("Racial Traits", c.race, "Racial Traits · " + (c.race || ""), function(body){
    var traits = splitIntoTraits(RACE_TRAITS[c.race] || RACE_TRAIT_FALLBACK);
    body.appendChild(bulletList(traits));
  }));

  var classSummary = (c.classes||[]).map(function(cl){ return cl.name + " " + (cl.level||1); }).join(" / ");
  aboutCard.appendChild(linkRow("Class Features", classSummary, "Class Features", function(body){
    (c.classes||[]).forEach(function(cl, idx){
      if(idx>0){
        var hr = document.createElement("hr");
        hr.className = "info-modal-divider";
        body.appendChild(hr);
      }
      var head = document.createElement("h5");
      head.className = "info-modal-subhead";
      head.textContent = cl.name + (cl.subclass ? " (" + cl.subclass + ")" : "") + " — Level " + (cl.level||1);
      body.appendChild(head);
      var info = CLASSES_INFO[cl.name];
      if(info && info.features && info.features.length){
        body.appendChild(bulletList(info.features));
      } else {
        body.appendChild(emptyNote("No feature data yet for " + cl.name + " — check your sourcebook for its class features."));
      }
    });
  }));

  panel.appendChild(aboutCard);

  // 2. Proficiencies (aggregated across all classes)
  var profCard = makeCard("Proficiencies");
  var armor = [], weapons = [], tools = [], saves = [];
  (c.classes||[]).forEach(function(cl){
    var p = CLASS_PROFICIENCIES[cl.name];
    if(!p) return;
    (p.armor||[]).forEach(function(v){ if(armor.indexOf(v)===-1) armor.push(v); });
    (p.weapons||[]).forEach(function(v){ if(weapons.indexOf(v)===-1) weapons.push(v); });
    (p.tools||[]).forEach(function(v){ if(tools.indexOf(v)===-1) tools.push(v); });
    (p.savingThrows||[]).forEach(function(v){
      var label = ABILITY_NAME[v] || v;
      if(saves.indexOf(label)===-1) saves.push(label);
    });
  });
  profCard.appendChild(chipRow("Armor", armor));
  profCard.appendChild(chipRow("Weapons", weapons));
  profCard.appendChild(chipRow("Tools", tools));
  profCard.appendChild(chipRow("Saving Throws", saves));
  panel.appendChild(profCard);

  // 3. Languages — every character starts with Common; add more as needed
  var langCard = makeCard("Languages");
  if(!c.languages || !c.languages.length) c.languages = ["Common"];

  var chipsWrap = document.createElement("div");
  chipsWrap.className = "info-chips info-lang-chips";
  c.languages.forEach(function(lang, idx){
    var chip = document.createElement("span");
    chip.className = "info-chip info-lang-chip";
    var label = document.createElement("span");
    label.textContent = lang;
    chip.appendChild(label);
    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "info-lang-chip-remove";
    rm.textContent = "×";
    rm.title = "Remove " + lang;
    rm.addEventListener("click", function(){
      c.languages.splice(idx, 1);
      save();
      renderAll();
    });
    chip.appendChild(rm);
    chipsWrap.appendChild(chip);
  });
  langCard.appendChild(chipsWrap);

  var knownLower = c.languages.map(function(l){ return l.toLowerCase(); });

  var addRow = document.createElement("div");
  addRow.className = "info-lang-add-row";

  var select = document.createElement("select");
  select.className = "info-lang-select";
  var blankOpt = document.createElement("option");
  blankOpt.value = ""; blankOpt.textContent = "Select a language…";
  blankOpt.disabled = true; blankOpt.selected = true; blankOpt.hidden = true;
  select.appendChild(blankOpt);
  Object.keys(LANGUAGES).forEach(function(groupLabel){
    var remaining = LANGUAGES[groupLabel].filter(function(l){ return knownLower.indexOf(l.toLowerCase())===-1; });
    if(!remaining.length) return;
    var og = document.createElement("optgroup");
    og.label = groupLabel;
    remaining.forEach(function(l){
      var o = document.createElement("option");
      o.value = l; o.textContent = l;
      og.appendChild(o);
    });
    select.appendChild(og);
  });
  var customOpt = document.createElement("option");
  customOpt.value = "__custom__"; customOpt.textContent = "Custom / homebrew…";
  select.appendChild(customOpt);

  var customInput = document.createElement("input");
  customInput.type = "text";
  customInput.className = "info-lang-input";
  customInput.placeholder = "Enter custom language";
  customInput.style.display = "none";
  select.addEventListener("change", function(){
    var isCustom = select.value === "__custom__";
    customInput.style.display = isCustom ? "block" : "none";
    if(isCustom) customInput.focus();
  });

  var addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn small";
  addBtn.textContent = "+ Add";
  function addLanguage(){
    var val = select.value === "__custom__" ? customInput.value.trim() : select.value;
    if(!val) return;
    var exists = c.languages.some(function(l){ return l.toLowerCase()===val.toLowerCase(); });
    if(!exists){
      c.languages.push(val);
      save();
      renderAll();
    }
  }
  addBtn.addEventListener("click", addLanguage);
  customInput.addEventListener("keydown", function(e){
    if(e.key==="Enter"){ e.preventDefault(); addLanguage(); }
  });

  addRow.appendChild(select);
  addRow.appendChild(customInput);
  addRow.appendChild(addBtn);
  langCard.appendChild(addRow);

  panel.appendChild(langCard);

  return panel;
}
