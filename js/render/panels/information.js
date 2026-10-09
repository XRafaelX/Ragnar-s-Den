import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { openInfoModal } from "../../ui/info-modal.js";
import { RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../../data/races.js";
import { BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../../data/backgrounds.js";
import { ALIGNMENT_INFO, ALIGNMENT_INFO_FALLBACK } from "../../data/alignments.js";
import { classFeatureList, classProficiencies } from "../../core/helpers.js";
import { featProficiencies } from "../../core/feat-picks.js";
import { ABILITIES } from "../../data/abilities-skills.js";
import { LANGUAGES, LANGUAGE_GROUP_LABELS } from "../../data/languages.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { themedPicker } from "../../ui/themed-picker.js";

/* ---- Information panel ----
   A calm "About the character" summary. Proficiencies & Languages are
   short enough to show outright; everything else (lore blurbs, trait
   lists, feature text) is one tap away in a modal instead of being
   dumped on screen, so the tab stays scannable for a new player. */

var ABILITY_NAME = {};
// Which character's Languages card has its add row open (null = closed).
var langAddOpenFor = null;
var langAddSeq = 0;   // a fresh picker key each time the add row opens
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
        li.appendChild(document.createTextNode(": " + item.text));
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
  v.textContent = value || "Not set";
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

  // 1. About; compact, tappable rows that open modals with the details
  var aboutCard = makeCard("About");

  aboutCard.appendChild(linkRow("Background", c.background, "Background · " + (c.background || ""), function(body){
    body.appendChild(blurb(bg ? bg.blurb : BACKGROUND_INFO_FALLBACK));
    if(bg && bg.skills && bg.skills.length){
      body.appendChild(chipRow("Skill Proficiencies", bg.skills));
    }
    if(bg && bg.feature && bg.feature.name){
      var feat = document.createElement("p");
      feat.className = "info-blurb";
      var b = document.createElement("b");
      b.textContent = bg.feature.name + ": ";
      feat.appendChild(b);
      feat.appendChild(document.createTextNode(bg.feature.text || ""));
      body.appendChild(feat);
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
      head.textContent = cl.name + (cl.subclass ? " (" + cl.subclass + ")" : "") + " · Level " + (cl.level||1);
      body.appendChild(head);
      var feats = classFeatureList(cl);
      if(feats.length){
        body.appendChild(bulletList(feats));
      } else {
        body.appendChild(emptyNote("No feature data yet for " + cl.name + ". Check your sourcebook for its class features."));
      }
    });
  }));

  panel.appendChild(aboutCard);

  // 2. Proficiencies (aggregated across all classes)
  var profCard = makeCard("Proficiencies");
  var armor = [], weapons = [], tools = [], saves = [];
  (c.classes||[]).forEach(function(cl, idx){
    var p = classProficiencies(c, idx);
    if(!p) return;
    (p.armor||[]).forEach(function(v){ if(armor.indexOf(v)===-1) armor.push(v); });
    (p.weapons||[]).forEach(function(v){ if(weapons.indexOf(v)===-1) weapons.push(v); });
    (p.tools||[]).forEach(function(v){ if(tools.indexOf(v)===-1) tools.push(v); });
    (p.savingThrows||[]).forEach(function(v){
      var label = ABILITY_NAME[v] || v;
      if(saves.indexOf(label)===-1) saves.push(label);
    });
  });
  // Plus what feats grant (Moderately Armored, Skilled, Weapon Master, Resilient).
  var fromFeats = featProficiencies(c);
  fromFeats.armor.forEach(function(p){ if(armor.indexOf(p.name)===-1) armor.push(p.name); });
  fromFeats.tools.forEach(function(p){ if(tools.indexOf(p.name)===-1) tools.push(p.name); });
  fromFeats.weapons.forEach(function(p){ if(weapons.indexOf(p.name)===-1) weapons.push(p.name); });
  fromFeats.saves.forEach(function(p){
    var label = ABILITY_NAME[p.ability] || p.ability;
    if(saves.indexOf(label)===-1) saves.push(label);
  });
  profCard.appendChild(chipRow("Armor", armor));
  profCard.appendChild(chipRow("Weapons", weapons));
  profCard.appendChild(chipRow("Tools", tools));
  profCard.appendChild(chipRow("Saving Throws", saves));
  panel.appendChild(profCard);

  // 3. Languages; every character starts with Common; add more as needed
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
      playDelete();
    });
    chip.appendChild(rm);
    chipsWrap.appendChild(chip);
  });
  // Adding a language hides behind a "+ Add language" chip (like the XP
  // row's Custom button), so the card is just the list until you need it.
  var addOpen = langAddOpenFor===c.id;
  if(!addOpen){
    var openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "info-chip info-lang-add-chip";
    openBtn.textContent = "+ Add language";
    openBtn.addEventListener("click", function(){
      langAddOpenFor = c.id;
      langAddSeq++;
      renderAll();
      var field = document.querySelector(".info-lang-picker .tp-trigger");
      if(field) field.focus();
    });
    chipsWrap.appendChild(openBtn);
  }
  langCard.appendChild(chipsWrap);

  if(addOpen){
    var knownLower = c.languages.map(function(l){ return l.toLowerCase(); });

    var addRow = document.createElement("div");
    addRow.className = "info-lang-add-row";

    var groups = {};
    Object.keys(LANGUAGES).forEach(function(groupLabel){
      var remaining = LANGUAGES[groupLabel].filter(function(l){ return knownLower.indexOf(l.toLowerCase())===-1; });
      if(remaining.length) groups[LANGUAGE_GROUP_LABELS[groupLabel] || groupLabel] = remaining;
    });
    // "Custom / homebrew…" opens a text box for any other language. The
    // key is new each time the row opens, so it starts on the list again.
    var langPick = "";
    var picker = themedPicker({
      groups:groups, value:"", placeholder:"Select a language…", ariaLabel:"Language to add",
      homebrew:{noun:"language"}, key:"info-lang-"+langAddSeq,
      onPick:function(v){ langPick = v; }
    });
    picker.classList.add("info-lang-picker");

    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn small primary";
    addBtn.textContent = "Add";
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn small ghost";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close add language");
    function closeAdd(){ langAddOpenFor = null; renderAll(); }
    function addLanguage(){
      var val = (langPick || "").trim();
      if(!val) return;
      var exists = c.languages.some(function(l){ return l.toLowerCase()===val.toLowerCase(); });
      langAddOpenFor = null;
      if(!exists){
        c.languages.push(val);
        save();
        playAdd();
      }
      renderAll();
    }
    addBtn.addEventListener("click", addLanguage);
    closeBtn.addEventListener("click", closeAdd);
    // Enter in the custom box adds; Escape closes the row, unless it is
    // closing the open list (capture: runs before the picker's own keys).
    picker.addEventListener("keydown", function(e){
      var inCustom = e.target.classList.contains("tp-custom-input");
      if(inCustom && e.key==="Enter"){ e.preventDefault(); addLanguage(); }
      else if(e.key==="Escape" && !picker.classList.contains("open")) closeAdd();
    }, true);

    addRow.appendChild(picker);
    addRow.appendChild(addBtn);
    addRow.appendChild(closeBtn);
    langCard.appendChild(addRow);
  }

  panel.appendChild(langCard);
  panel.appendChild(optionalRulesCard(c));

  return panel;
}

/* Optional rules the table may use. Tasha's optional class features are
   off unless the player turns them on (their DM decides); for now they add
   the Versatility swaps at Ability Score Improvement levels. */
function optionalRulesCard(c){
  var card = makeCard("Optional rules");
  var row = document.createElement("div");
  row.className = "opt-rule";
  var text = document.createElement("div");
  text.className = "opt-rule-text";
  text.innerHTML = "<b>Tasha's optional class features</b>"+
    "<span>Your DM decides whether your table uses these. Turned on, the level-up also lets you swap a Metamagic option (sorcerer) or a maneuver (Battle Master) at Ability Score Improvement levels.</span>";
  var sw = document.createElement("button");
  sw.type = "button";
  sw.className = "switch" + (c.tashaOptional ? " on" : "");
  sw.setAttribute("role", "switch");
  sw.setAttribute("aria-checked", c.tashaOptional ? "true" : "false");
  sw.setAttribute("aria-label", "Use Tasha's optional class features");
  sw.innerHTML = "<span class='switch-knob'></span>";
  sw.addEventListener("click", function(){
    c.tashaOptional = !c.tashaOptional;
    save(); renderAll();
  });
  row.appendChild(text);
  row.appendChild(sw);
  card.appendChild(row);
  return card;
}

