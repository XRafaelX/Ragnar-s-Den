import { openCatalogPicker, showCatalogCustomView, refreshCatalog } from "../ui/catalog-picker.js";
import { themedPicker } from "../ui/themed-picker.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { showActionToast } from "../ui/toast.js";
import { playAdd, playDelete } from "../ui/sound.js";
import { makePlusSvg } from "../ui/svg-icons.js";
import { getCustomSubclass, saveCustomSubclass, deleteCustomSubclass, subclassNameProblem, charactersUsing } from "../core/custom-subclasses.js";
import { renderAll } from "./sheet.js";
import { openInfoModal } from "../ui/info-modal.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../data/classes.js";
import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL } from "../data/progression.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { ALIGNMENTS, ALIGNMENT_INFO, ALIGNMENT_DETAILS } from "../data/alignments.js";
import { RACES } from "../data/races.js";
import { RACE_DATA, raceAsiText, raceAsiShort, raceSpeedText } from "../data/race-data.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK, BACKGROUND_LANGUAGES, BACKGROUND_TOOLS } from "../data/backgrounds.js";
import { ABILITIES, SKILLS, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { getHomebrewEntry, saveHomebrew, deleteHomebrew, homebrewNameProblem, charactersUsingHomebrew } from "../core/custom-homebrew.js";
import { FEATURE_SOURCES, FEAT_CATEGORIES, getCustom, getCustomEntry, saveCustom, deleteCustom, customNameProblem,
  charactersWithCustom, characterHasCustom, addCustomToCharacter, linkCharacterCopy } from "../core/custom-features.js";
import { classFeatureList, escapeHtml, uid } from "../core/helpers.js";
import { save } from "../core/state.js";

/* ---------------- Compendium ----------------
   A read-only reference (home screen) for classes, subclasses, races,
   backgrounds, feats, custom features and alignments,
   in the same browse page as the Armory and Spellbook. Tapping an entry
   opens its details instead of adding it to anyone. The Subclasses tab's
   + makes a custom (homebrew) subclass: pick the class, name it and list
   its features with the level each is gained; it then shows up for
   characters in level-up and creation like any other. The Feats tab's +
   makes a custom feat or a custom feature, made here once and then given
   to any character (the sheet's buttons open it for that character). */

var ABILITY_NAME = {};
ABILITIES.forEach(function(a){ ABILITY_NAME[a[0]] = a[1]; });

var CLASS_ROLES = {
  "Martial": ["Barbarian","Fighter","Monk","Rogue"],
  "Half casters": ["Artificer","Paladin","Ranger"],
  "Full casters": ["Bard","Cleric","Druid","Sorcerer","Warlock","Wizard"]
};
var CASTER_LABEL = {full:"Full caster", half:"Half caster", artificer:"Half caster", pact:"Pact Magic", third:"One-third caster"};

function abilityList(keys){ return (keys||[]).map(function(k){ return ABILITY_NAME[k] || k; }).join(", "); }

/* ---- Detail views (info modal) ---- */
function block(body, title, html){
  var sec = document.createElement("div");
  sec.className = "cmp-block";
  if(title){
    var h = document.createElement("h5");
    h.className = "cmp-block-title";
    h.textContent = title;
    sec.appendChild(h);
  }
  var content = document.createElement("div");
  content.innerHTML = html;
  sec.appendChild(content);
  body.appendChild(sec);
}
function facts(rows){
  return "<dl class='cmp-facts'>"+rows.filter(function(r){ return r[1]; }).map(function(r){
    return "<dt>"+escapeHtml(r[0])+"</dt><dd>"+escapeHtml(r[1])+"</dd>";
  }).join("")+"</dl>";
}
function featureList(features){
  return features.map(function(f){
    return "<div class='cmp-feature'><div class='cmp-feature-head'><strong>"+escapeHtml(f.name)+"</strong>"+
      (f.level ? "<span class='cmp-lv'>Lv "+f.level+"</span>" : "")+"</div><p>"+escapeHtml(f.text)+"</p></div>";
  }).join("");
}

function showClass(name){
  var info = CLASSES_INFO[name] || {};
  var prog = CLASS_PROGRESSION[name] || {};
  var profs = CLASS_PROFICIENCIES[name] || {};
  openInfoModal(name, function(body){
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(info.blurb||"")+"</p>"+facts([
      ["Hit die", "d"+(HIT_DICE_BY_CLASS[name]||8)],
      ["Primary ability", info.primaryAbilityLabel || ABILITY_NAME[info.primaryAbility] || ""],
      ["Saving throws", abilityList(profs.savingThrows || info.savingThrows)],
      ["Spellcasting", prog.casterType ? CASTER_LABEL[prog.casterType]+(prog.spellAbility ? " ("+ABILITY_NAME[prog.spellAbility]+")" : "") : "None"],
      [prog.subclassLabel || "Subclass", prog.subclassLevel ? "Chosen at level "+prog.subclassLevel : ""]
    ]));
    block(body, "Proficiencies", facts([
      ["Armor", (profs.armor||[]).join(", ") || "None"],
      ["Weapons", (profs.weapons||[]).join(", ") || "None"],
      ["Tools", (profs.tools||[]).join(", ") || "None"],
      ["Skills", info.skillChoices ? "Choose "+info.skillChoices.count+" from "+info.skillChoices.options.join(", ") : ""]
    ]));
    block(body, "Class features (levels 1 to "+MAX_LEVEL+")", featureList(classFeatureList({name:name, level:MAX_LEVEL, subclass:""})));
    var subs = SUBCLASSES[name] || [];
    if(subs.length){
      var list = document.createElement("div");
      list.className = "cmp-sub-list";
      subs.forEach(function(sub){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cmp-sub-link";
        b.innerHTML = "<strong>"+escapeHtml(sub.name)+"</strong><span>"+escapeHtml(sub.blurb)+"</span>";
        b.addEventListener("click", function(){ showSubclass(name, sub); });
        list.appendChild(b);
      });
      block(body, (prog.subclassLabel || "Subclasses")+" ("+subs.length+")", "");
      body.lastChild.appendChild(list);
    }
  });
}

function showSubclass(className, sub){
  var prog = CLASS_PROGRESSION[className] || {};
  openInfoModal(sub.name, function(body){
    if(sub.custom){
      var bar = document.createElement("div");
      bar.className = "cmp-custom-bar";
      bar.innerHTML = "<span class='cmp-custom-tag'>Custom</span>";
      var editBtn = document.createElement("button");
      editBtn.type = "button"; editBtn.className = "btn small"; editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function(){ closeInfo(); editSubclass(sub.id); });
      var delBtn = document.createElement("button");
      delBtn.type = "button"; delBtn.className = "btn small danger"; delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function(){ closeInfo(); confirmDeleteSubclass(sub.id); });
      bar.appendChild(editBtn); bar.appendChild(delBtn);
      body.appendChild(bar);
    }
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(sub.blurb||"")+"</p>"+facts([
      ["Class", className],
      [prog.subclassLabel || "Subclass", prog.subclassLevel ? "Chosen at "+className+" level "+prog.subclassLevel : ""],
      ["Spellcasting", sub.casterType==="third" ? "One-third caster ("+ABILITY_NAME[sub.spellAbility]+")" : ""]
    ]));
    var features = [];
    Object.keys(sub.features||{}).map(Number).sort(function(a, b){ return a-b; }).forEach(function(lv){
      sub.features[lv].forEach(function(f){ features.push({name:f.name, text:f.text, level:lv}); });
    });
    // Built-in data stops at MAX_LEVEL; custom subclasses can list later levels too.
    block(body, "Features by level", featureList(features) || "<p class='cmp-muted'>No features before level "+(MAX_LEVEL+1)+".</p>");
    var back = document.createElement("button");
    back.type = "button";
    back.className = "btn small ghost cmp-back";
    back.textContent = "← All about the "+className;
    back.addEventListener("click", function(){ showClass(className); });
    body.appendChild(back);
  });
}

function showRace(name){
  var d = RACE_DATA[name] || {};
  var langs = (d.languages && d.languages.fixed || []).join(", ") + (d.languages && d.languages.choose ? ", plus "+d.languages.choose+" of your choice" : "");
  openInfoModal(name, function(body){
    if(d.custom) customBar(body, function(){ editHomebrew("race", d.id); }, function(){ confirmDeleteHomebrew("race", d.id); });
    block(body, "", (d.blurb ? "<p class='cmp-lead'>"+escapeHtml(d.blurb)+"</p>" : "")+facts([
      ["Ability scores", raceAsiText(d)],
      ["Size", d.size],
      ["Speed", raceSpeedText(d)],
      ["Darkvision", d.darkvision ? d.darkvision+" ft"+(d.darkvision>=120 ? " (superior)" : "") : "None"],
      ["Languages", langs],
      ["Source", d.source]
    ]));
    block(body, "Traits", featureList(d.traits || []) || "<p class='cmp-muted'>No special traits.</p>");
  });
}

function backgroundSkills(info){
  var fixed = (info.skills||[]).join(", ");
  if(info.skillChoice) return fixed ? fixed+", "+info.skillChoice : "Choose "+info.skillChoice;
  return fixed || (info.custom ? "None" : "Two of your choice");
}
function backgroundLanguages(name){
  var n = BACKGROUND_LANGUAGES[name] || 0;
  return n ? n+" of your choice" : "None";
}

function showBackground(name){
  var info = BACKGROUND_INFO[name];
  openInfoModal(name, function(body){
    if(info && info.custom) customBar(body, function(){ editHomebrew("background", info.id); }, function(){ confirmDeleteHomebrew("background", info.id); });
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(info ? (info.blurb || "A custom background.") : BACKGROUND_INFO_FALLBACK)+"</p>"+facts([
      ["Skills", info ? backgroundSkills(info) : "Two of your choice"],
      ["Tools", BACKGROUND_TOOLS[name] || "Check your sourcebook"],
      ["Languages", backgroundLanguages(name)]
    ]));
    if(info && info.feature && info.feature.name) block(body, "Feature", featureList([info.feature]));
  });
}

/* A 3×3 alignment grid with this one lit up. */
function alignmentGrid(name){
  var html = "<div class='cmp-align-grid' role='img' aria-label='"+escapeHtml(name)+" on the alignment grid'>";
  ["Good","Neutral","Evil"].forEach(function(m){
    ["Lawful","Neutral","Chaotic"].forEach(function(o){
      var cell = o==="Neutral" && m==="Neutral" ? "True Neutral" : o+" "+m;
      html += "<span class='cmp-align-cell"+(cell===name ? " on" : "")+"'>"+escapeHtml(cell.replace(" ", "\u00a0"))+"</span>";
    });
  });
  return html+"</div>";
}

function showAlignment(name){
  var d = ALIGNMENT_DETAILS[name] || {};
  openInfoModal(name, function(body){
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(ALIGNMENT_INFO[name]||"")+"</p>"+alignmentGrid(name));
    block(body, "", facts([["Typical of", d.examples], ["Playing it", d.tip]]));
  });
}

/* ---- Catalog sections ---- */
function classSection(){
  var data = {};
  Object.keys(CLASS_ROLES).forEach(function(g){ CLASS_ROLES[g].forEach(function(n){ data[n] = CLASSES_INFO[n] || {}; }); });
  return {
    key:"classes", label:"Classes", searchPlaceholder:"Search classes…",
    groups:CLASS_ROLES, data:data,
    renderSub:function(name, d){ return d.blurb || ""; },
    renderRight:function(name, d){ return ["d"+(HIT_DICE_BY_CLASS[name]||8), d.primaryAbilityLabel ? d.primaryAbilityLabel.split(" (")[0] : (ABILITY_NAME[d.primaryAbility]||"")]; },
    searchText:function(name, d){ return name+" "+(d.blurb||""); },
    onAdd:function(name){ showClass(name); return false; }
  };
}

/* (Re)build the Subclasses tab's lists from SUBCLASSES, which includes
   custom ones; called again after a custom subclass is saved or deleted. */
function fillSubclassSection(section){
  var groups = {}, data = {};
  Object.keys(SUBCLASSES).sort().forEach(function(cls){
    if(!SUBCLASSES[cls].length) return;
    groups[cls] = SUBCLASSES[cls].map(function(sub){
      // A custom one may share a name with another class's subclass.
      var key = data[sub.name] ? sub.name+" ("+cls+")" : sub.name;
      data[key] = {cls:cls, sub:sub};
      return key;
    });
  });
  section.groups = groups;
  section.data = data;
}

var subclassSectionRef = null;
function subclassSection(){
  var section = {
    key:"subclasses", label:"Subclasses", searchPlaceholder:"Search subclasses…",
    renderSub:function(name, d){ return d.sub.blurb || ""; },
    renderRight:function(name, d){
      var prog = CLASS_PROGRESSION[d.cls] || {};
      return [d.cls, (d.sub.custom ? "Custom · " : "")+(prog.subclassLevel ? "From level "+prog.subclassLevel : "")];
    },
    searchText:function(name, d){ return name+" "+d.cls+" "+(d.sub.blurb||"")+(d.sub.custom ? " custom homebrew" : ""); },
    onAdd:function(name, d){ showSubclass(d.cls, d.sub); return false; },
    renderCustomForm:function(container){ buildSubclassForm(container); }
  };
  fillSubclassSection(section);
  subclassSectionRef = section;
  return section;
}

function afterSubclassChange(){
  if(subclassSectionRef) fillSubclassSection(subclassSectionRef);
  refreshCatalog();
  renderAll(); // characters using it pick up new/renamed features
}

function closeInfo(){ document.getElementById("info-modal-close").click(); }

/* ---- Custom subclass form ---- */
var editingId = null;

function editSubclass(id){
  editingId = id;
  showCatalogCustomView();
}

function confirmDeleteSubclass(id){
  var entry = getCustomSubclass(id);
  if(!entry) return;
  var users = charactersUsing(entry);
  confirmDialog("Delete "+entry.name+"?",
    users.length ? users.map(function(c){ return c.name||"A character"; }).join(", ")+(users.length>1 ? " use" : " uses")+" it and will lose its features (the subclass name stays on the sheet)."
                 : "This custom subclass will be removed from the Compendium.",
    function(){
      deleteCustomSubclass(id);
      afterSubclassChange();
      playDelete();
      showActionToast("Deleted "+entry.name+".");
    });
}

function textField(labelTxt, value, placeholder, multiline){
  var f = document.createElement("div");
  f.className = "field cmp-form-field";
  var l = document.createElement("label");
  l.textContent = labelTxt;
  f.appendChild(l);
  var input = document.createElement(multiline ? "textarea" : "input");
  if(!multiline) input.type = "text";
  if(multiline) input.rows = 3;
  input.value = value || "";
  input.placeholder = placeholder || "";
  f.appendChild(input);
  return {field:f, input:input};
}

function buildSubclassForm(container){
  var existing = editingId ? getCustomSubclass(editingId) : null;
  editingId = null; // consumed: leaving the form resets it to "new"
  var draft = existing ? JSON.parse(JSON.stringify(existing)) : {className:presetClass||"", name:"", blurb:"", features:[]};
  presetClass = null;
  function defaultLevel(){ return (CLASS_PROGRESSION[draft.className]||{}).subclassLevel || 3; }
  if(!draft.features.length) draft.features.push({level:defaultLevel(), name:"", text:""});

  // Layout: the form card, and beside it (wide screens) a live preview of
  // how the subclass will look in the Compendium.
  var wrap = document.createElement("div");
  wrap.className = "cmp-form-wrap";
  var form = document.createElement("div");
  form.className = "cmp-form";
  wrap.appendChild(form);

  var head = document.createElement("div");
  head.className = "cmp-form-head";
  head.innerHTML = "<h4 class='cmp-form-title'>"+escapeHtml(existing ? "Edit "+existing.name : "Create a subclass")+"</h4>"+
    "<p class='cmp-form-intro'>Pick the class it belongs to, then list its features and the class level each one is gained at. Characters can pick it when they level up (or at creation for classes that choose at level 1).</p>";
  form.appendChild(head);

  function section(titleText, extra){
    var sec = document.createElement("div");
    sec.className = "cmp-form-section";
    var h = document.createElement("div");
    h.className = "cmp-form-section-head";
    h.innerHTML = "<h5>"+escapeHtml(titleText)+"</h5>"+(extra||"");
    sec.appendChild(h);
    form.appendChild(sec);
    return sec;
  }

  /* -- Basics -- */
  var basics = section("Basics");
  var row = document.createElement("div");
  row.className = "cmp-form-row";
  var classField = document.createElement("div");
  classField.className = "field cmp-form-field";
  classField.innerHTML = "<label>Class *</label>";
  classField.appendChild(themedPicker({
    key:"cmp:subclass:class", groups:CLASS_ROLES, value:draft.className, search:false,
    placeholder:"Choose a class", ariaLabel:"Class",
    onPick:function(v){
      var wasDefault = defaultLevel();
      draft.className = v;
      // Untouched features follow the new class's subclass level.
      draft.features.forEach(function(f){ if(!f.name && f.level===wasDefault) f.level = defaultLevel(); });
      renderFeatures();
      updatePreview();
    }
  }));
  row.appendChild(classField);
  var nameF = textField("Subclass name *", draft.name, "e.g. Oath of the Tide");
  nameF.input.addEventListener("input", function(){ draft.name = nameF.input.value; updatePreview(); });
  row.appendChild(nameF.field);
  basics.appendChild(row);
  var blurbF = textField("Short description", draft.blurb, "One line on what it's about", true);
  blurbF.input.rows = 2;
  blurbF.input.addEventListener("input", function(){ draft.blurb = blurbF.input.value; updatePreview(); });
  basics.appendChild(blurbF.field);

  /* -- Features -- */
  var featSec = section("Features", "<span class='cmp-count'></span>");
  var featCount = featSec.querySelector(".cmp-count");
  var featHint = document.createElement("p");
  featHint.className = "cmp-form-hint";
  featHint.textContent = "Add them in any order; they're sorted by level when you save.";
  featSec.appendChild(featHint);
  var featList = document.createElement("div");
  featList.className = "cmp-feat-edits";
  featSec.appendChild(featList);

  var levelItems = [];
  for(var lv=1; lv<=20; lv++) levelItems.push({value:String(lv), label:"Level "+lv});

  function renderFeatures(){
    featList.innerHTML = "";
    featCount.textContent = draft.features.length;
    draft.features.forEach(function(f, i){
      var card = document.createElement("div");
      card.className = "cmp-feat-edit";
      var top = document.createElement("div");
      top.className = "cmp-feat-edit-top";
      var lvWrap = document.createElement("div");
      lvWrap.className = "cmp-feat-level";
      lvWrap.appendChild(themedPicker({
        key:"cmp:feat:lv:"+i, groups:{"":levelItems}, value:String(f.level), search:false,
        variant:"pill", triggerClass:"cmp-level-pill",
        placeholder:"Level", ariaLabel:"Feature "+(i+1)+" level",
        onPick:function(v){ f.level = Number(v); updatePreview(); }
      }));
      top.appendChild(lvWrap);
      var nameIn = document.createElement("input");
      nameIn.type = "text"; nameIn.className = "cmp-feat-name"; nameIn.placeholder = "Feature name";
      nameIn.value = f.name;
      nameIn.setAttribute("aria-label", "Feature "+(i+1)+" name");
      nameIn.addEventListener("input", function(){ f.name = nameIn.value; updatePreview(); });
      top.appendChild(nameIn);
      var rm = document.createElement("button");
      rm.type = "button"; rm.className = "cmp-feat-remove"; rm.textContent = "✕";
      rm.title = "Remove feature"; rm.setAttribute("aria-label", "Remove feature "+(i+1));
      rm.disabled = draft.features.length===1;
      rm.addEventListener("click", function(){ draft.features.splice(i, 1); renderFeatures(); updatePreview(); });
      top.appendChild(rm);
      card.appendChild(top);
      var textIn = document.createElement("textarea");
      textIn.rows = 2; textIn.className = "cmp-feat-text"; textIn.placeholder = "What it does";
      textIn.value = f.text;
      textIn.setAttribute("aria-label", "Feature "+(i+1)+" description");
      textIn.addEventListener("input", function(){ f.text = textIn.value; updatePreview(); });
      card.appendChild(textIn);
      featList.appendChild(card);
    });
  }

  var addFeat = document.createElement("button");
  addFeat.type = "button";
  addFeat.className = "cmp-add-feat";
  addFeat.innerHTML = makePlusSvg()+"Add another feature";
  addFeat.addEventListener("click", function(){
    var last = draft.features[draft.features.length-1];
    draft.features.push({level:last ? last.level : defaultLevel(), name:"", text:""});
    renderFeatures();
    updatePreview();
    var names = featList.querySelectorAll(".cmp-feat-name");
    if(names.length) names[names.length-1].focus();
  });
  featSec.appendChild(addFeat);

  /* -- Actions -- */
  var actions = document.createElement("div");
  actions.className = "cmp-form-actions";
  var cancel = document.createElement("button");
  cancel.type = "button"; cancel.className = "btn ghost"; cancel.textContent = "Cancel";
  cancel.addEventListener("click", function(){ refreshCatalog(); });
  var saveBtn = document.createElement("button");
  saveBtn.type = "button"; saveBtn.className = "btn primary"; saveBtn.textContent = existing ? "Save changes" : "Create subclass";
  saveBtn.addEventListener("click", function(){
    var name = (draft.name||"").trim();
    if(!draft.className){ showActionToast("Pick the class this subclass belongs to.", true); return; }
    if(!name){ showActionToast("Give your subclass a name.", true); nameF.input.focus(); return; }
    var clash = subclassNameProblem(draft.className, name, existing && existing.id);
    if(clash){ showActionToast(clash, true); nameF.input.focus(); return; }
    if(!draft.features.some(function(f){ return f.name && f.name.trim(); })){ showActionToast("Add at least one feature with a name.", true); return; }
    var saved = saveCustomSubclass(draft);
    afterSubclassChange();
    playAdd();
    if(savedHook && !existing && savedHookKind==="subclass"){
      // Opened from level-up: hand the new subclass back to it.
      var hook = savedHook; savedHook = null;
      showActionToast("Created "+saved.name+".");
      hook(saved);
      return;
    }
    showActionToast((existing ? "Saved " : "Created ")+saved.name+"."+(existing ? "" : " Characters can pick it when they level up."));
  });
  actions.appendChild(cancel);
  actions.appendChild(saveBtn);
  form.appendChild(actions);

  /* -- Live preview -- */
  var preview = document.createElement("aside");
  preview.className = "cmp-preview";
  preview.setAttribute("aria-label", "Preview");
  wrap.appendChild(preview);
  function updatePreview(){
    var named = draft.features.filter(function(f){ return f.name && f.name.trim(); })
      .slice().sort(function(a, b){ return a.level - b.level; });
    var prog = CLASS_PROGRESSION[draft.className] || {};
    preview.innerHTML =
      "<div class='cmp-preview-label'>Preview</div>"+
      "<div class='cmp-preview-card'>"+
        "<div class='cmp-preview-name'>"+escapeHtml((draft.name||"").trim() || "Your subclass")+"</div>"+
        "<div class='cmp-preview-tags'>"+
          "<span class='cmp-tag-class'>"+escapeHtml(draft.className || "No class yet")+"</span>"+
          "<span class='cmp-custom-tag'>Custom</span>"+
          (prog.subclassLevel ? "<span class='cmp-tag-muted'>From level "+prog.subclassLevel+"</span>" : "")+
        "</div>"+
        "<p class='cmp-preview-blurb'>"+escapeHtml((draft.blurb||"").trim() || "A short description will show here.")+"</p>"+
        (named.length
          ? named.map(function(f){ return "<div class='cmp-preview-feat'><span class='cmp-lv'>Lv "+f.level+"</span><div><strong>"+escapeHtml(f.name)+"</strong>"+(f.text ? "<p>"+escapeHtml(f.text)+"</p>" : "")+"</div></div>"; }).join("")
          : "<p class='cmp-muted'>Features you add appear here, sorted by level.</p>")+
      "</div>";
  }

  renderFeatures();
  updatePreview();
  container.appendChild(wrap);
}

function raceSection(){
  return {
    key:"races", label:"Races", searchPlaceholder:"Search races…",
    groups:RACES, data:RACE_DATA,
    renderSub:function(name, d){ return (d.traits||[]).map(function(t){ return t.name; }).join(", "); },
    // Row: the ability score increase, with speed/darkvision underneath.
    renderRight:function(name, d){
      var bits = [];
      if(d.darkvision) bits.push("Darkvision "+d.darkvision);
      if((d.speed||{}).walk!==30 || d.speed.fly || d.speed.swim || d.speed.climb) bits.push(raceSpeedText(d));
      return [raceAsiShort(d), bits.join(" · ")];
    },
    searchText:function(name, d){ return name+" "+raceAsiText(d)+" "+(d.source||"")+" "+(d.blurb||"")+" "+(d.traits||[]).map(function(t){ return t.name+" "+t.text; }).join(" "); },
    onAdd:function(name){ showRace(name); return false; },
    renderCustomForm:function(container){ buildRaceForm(container); }
  };
}

/* Its data map is built from BACKGROUND_INFO, so it's refilled after a
   custom background is saved or deleted. */
function fillBackgroundSection(section){
  var data = {};
  Object.keys(BACKGROUNDS).forEach(function(g){ BACKGROUNDS[g].forEach(function(n){ data[n] = BACKGROUND_INFO[n] || {}; }); });
  section.data = data;
}
var backgroundSectionRef = null;
function backgroundSection(){
  var section = {
    key:"backgrounds", label:"Backgrounds", searchPlaceholder:"Search backgrounds…",
    groups:BACKGROUNDS,
    renderSub:function(name, d){ return d.blurb || BACKGROUND_INFO_FALLBACK; },
    // Row: the fixed skills, with a short note when there's a pick to make.
    renderRight:function(name, d){
      var fixed = (d.skills||[]).join(", ");
      var extra = d.skillChoice ? (fixed ? "+ a skill of choice" : "Skills of choice") : (d.custom ? "Custom" : "");
      return [fixed, extra];
    },
    searchText:function(name, d){ return name+" "+(d.blurb||"")+" "+(d.skills||[]).join(" ")+(d.custom ? " custom homebrew" : ""); },
    onAdd:function(name){ showBackground(name); return false; },
    renderCustomForm:function(container){ buildBackgroundForm(container); }
  };
  fillBackgroundSection(section);
  backgroundSectionRef = section;
  return section;
}

/* Grouped Good / Neutral / Evil (the data keeps them in one list). */
function alignmentSection(){
  var groups = {"Good":[], "Neutral":[], "Evil":[]}, data = {};
  (ALIGNMENTS.Alignment||[]).forEach(function(n){
    var d = ALIGNMENT_DETAILS[n] || {};
    (groups[d.morality] || groups.Neutral).push(n);
    data[n] = {text:ALIGNMENT_INFO[n]||"", d:d};
  });
  return {
    key:"alignments", label:"Alignments", searchPlaceholder:"Search alignments…",
    groups:groups, data:data,
    renderSub:function(name, x){ return x.text; },
    renderRight:function(name, x){
      var axes = x.d.order===x.d.morality ? x.d.order : x.d.order+" · "+x.d.morality; // True Neutral: just "Neutral"
      return [x.d.order ? axes : "", x.d.morality==="Evil" ? "Ask your DM" : ""];
    },
    searchText:function(name, x){ return name+" "+x.text+" "+(x.d.examples||""); },
    onAdd:function(name){ showAlignment(name); return false; }
  };
}

/* opts (all optional):
     create          "subclass" | "race" | "background" | "feat" | "feature":
                     open straight into that tab's custom form (from
                     level-up, the wizard, the feat picker or the sheet).
     tab             the same kinds: open on that tab's list instead.
     forClass        with create:"subclass", the class to pre-pick.
     onSaved         function(entry) called once after that form creates it.
     onClose         called when the Compendium is closed.
     forCharacter    a character, from its sheet: feats and custom features
                     offer "Add to <name>", and one created now is added to
                     it (then the Compendium closes, back to the sheet).
     edit            {kind:"feat"|"feature", id}: open that custom entry's
                     edit form (closes after saving).
     from            with create:"feat"/"feature", a copy already on
                     forCharacter (made before the Compendium kept them) to
                     pre-fill from; it's linked to the new entry.
   (newSubclassFor / onSubclassSaved are the older names for
    create:"subclass" + forClass / onSaved.) */
var presetClass = null, savedHook = null, savedHookKind = null;
var CREATE_TAB = {subclass:1, race:2, background:3, feat:4, feature:4};
export function openCompendium(opts){
  opts = opts || {};
  var create = opts.create || (opts.newSubclassFor ? "subclass" : null) || (opts.edit ? opts.edit.kind : null);
  giveTarget = opts.forCharacter || null;
  var sections = [classSection(), subclassSection(), raceSection(), backgroundSection(), featSection(), alignmentSection()];
  openCatalogPicker({
    sections:sections,
    initialSection: CREATE_TAB[create || opts.tab] || 0,
    onClose:function(){
      presetClass = null; savedHook = null; savedHookKind = null;
      giveTarget = null; formPreset = null;
      if(opts.onClose) opts.onClose();
    }
  });
  if(create){
    // Set after the picker's first build of the form, which would
    // otherwise use these up before the custom view is shown.
    presetClass = opts.forClass || opts.newSubclassFor || null;
    savedHook = opts.onSaved || opts.onSubclassSaved || null;
    savedHookKind = create;
    if(create==="feat" || create==="feature")
      formPreset = {kind:create, edit:opts.edit ? opts.edit.id : null, from:opts.from || null, direct:true};
    showCatalogCustomView();
  }
}

function closeCompendium(){ document.getElementById("catalog-back").click(); }

/* ---- Homebrew races and backgrounds (the Races / Backgrounds tabs' +) ----
   Same layout as the custom subclass form: a form card with a live
   preview beside it on wide screens. */
var editingHomebrew = {race:null, background:null};

/* Custom tag + Edit / Delete at the top of a homebrew entry's details. */
function customBar(body, onEdit, onDelete){
  var bar = document.createElement("div");
  bar.className = "cmp-custom-bar";
  bar.innerHTML = "<span class='cmp-custom-tag'>Custom</span>";
  var editBtn = document.createElement("button");
  editBtn.type = "button"; editBtn.className = "btn small"; editBtn.textContent = "Edit";
  editBtn.addEventListener("click", function(){ closeInfo(); onEdit(); });
  var delBtn = document.createElement("button");
  delBtn.type = "button"; delBtn.className = "btn small danger"; delBtn.textContent = "Delete";
  delBtn.addEventListener("click", function(){ closeInfo(); onDelete(); });
  bar.appendChild(editBtn); bar.appendChild(delBtn);
  body.appendChild(bar);
}

function editHomebrew(kind, id){
  editingHomebrew[kind] = id;
  showCatalogCustomView();
}

function confirmDeleteHomebrew(kind, id){
  var entry = getHomebrewEntry(kind, id);
  if(!entry) return;
  var users = charactersUsingHomebrew(kind, entry);
  confirmDialog("Delete "+entry.name+"?",
    users.length ? users.map(function(c){ return c.name||"A character"; }).join(", ")+(users.length>1 ? " use" : " uses")+" it. The name stays on their sheet, but its details go."
                 : "This custom "+kind+" will be removed from the Compendium.",
    function(){
      deleteHomebrew(kind, id);
      afterHomebrewChange();
      playDelete();
      showActionToast("Deleted "+entry.name+".");
    });
}

function afterHomebrewChange(){
  if(backgroundSectionRef) fillBackgroundSection(backgroundSectionRef);
  refreshCatalog();
  renderAll();
}

/* The shared form frame: title/intro, sections, actions, preview. */
function homebrewShell(container, titleText, introText){
  var wrap = document.createElement("div");
  wrap.className = "cmp-form-wrap";
  var form = document.createElement("div");
  form.className = "cmp-form";
  wrap.appendChild(form);
  var head = document.createElement("div");
  head.className = "cmp-form-head";
  head.innerHTML = "<h4 class='cmp-form-title'>"+escapeHtml(titleText)+"</h4><p class='cmp-form-intro'>"+escapeHtml(introText)+"</p>";
  form.appendChild(head);
  var preview = document.createElement("aside");
  preview.className = "cmp-preview";
  preview.setAttribute("aria-label", "Preview");
  wrap.appendChild(preview);
  container.appendChild(wrap);
  return {
    form: form,
    preview: preview,
    section: function(title, extra){
      var sec = document.createElement("div");
      sec.className = "cmp-form-section";
      var h = document.createElement("div");
      h.className = "cmp-form-section-head";
      h.innerHTML = "<h5>"+escapeHtml(title)+"</h5>"+(extra||"");
      sec.appendChild(h);
      form.appendChild(sec);
      return sec;
    },
    actions: function(saveLabel, onSave){
      var actions = document.createElement("div");
      actions.className = "cmp-form-actions";
      var cancel = document.createElement("button");
      cancel.type = "button"; cancel.className = "btn ghost"; cancel.textContent = "Cancel";
      cancel.addEventListener("click", function(){ refreshCatalog(); });
      var saveBtn = document.createElement("button");
      saveBtn.type = "button"; saveBtn.className = "btn primary"; saveBtn.textContent = saveLabel;
      saveBtn.addEventListener("click", onSave);
      actions.appendChild(cancel); actions.appendChild(saveBtn);
      form.appendChild(actions);
    }
  };
}

function numberField(labelTxt, value, placeholder){
  var f = textField(labelTxt, value==null ? "" : String(value), placeholder);
  f.input.type = "number"; f.input.min = "0"; f.input.step = "5"; f.input.inputMode = "numeric";
  return f;
}
function pickerField(labelTxt, picker){
  var f = document.createElement("div");
  f.className = "field cmp-form-field";
  f.innerHTML = "<label>"+escapeHtml(labelTxt)+"</label>";
  f.appendChild(picker);
  return f;
}
/* A list of {name, text} rows with remove buttons and an "add" button;
   used for race traits (and the background feature is a single one). */
function nameTextList(sec, items, addLabel, namePh, textPh, onChange){
  var list = document.createElement("div");
  list.className = "cmp-feat-edits";
  sec.appendChild(list);
  function render(){
    list.innerHTML = "";
    items.forEach(function(it, i){
      var card = document.createElement("div");
      card.className = "cmp-feat-edit";
      var top = document.createElement("div");
      top.className = "cmp-feat-edit-top";
      var nameIn = document.createElement("input");
      nameIn.type = "text"; nameIn.className = "cmp-feat-name"; nameIn.placeholder = namePh; nameIn.value = it.name;
      nameIn.setAttribute("aria-label", namePh+" "+(i+1));
      nameIn.addEventListener("input", function(){ it.name = nameIn.value; onChange(); });
      top.appendChild(nameIn);
      var rm = document.createElement("button");
      rm.type = "button"; rm.className = "cmp-feat-remove"; rm.textContent = "✕"; rm.title = "Remove";
      rm.setAttribute("aria-label", "Remove "+(i+1));
      rm.addEventListener("click", function(){ items.splice(i, 1); render(); onChange(); });
      top.appendChild(rm);
      card.appendChild(top);
      var textIn = document.createElement("textarea");
      textIn.rows = 2; textIn.className = "cmp-feat-text"; textIn.placeholder = textPh; textIn.value = it.text;
      textIn.setAttribute("aria-label", textPh+" "+(i+1));
      textIn.addEventListener("input", function(){ it.text = textIn.value; onChange(); });
      card.appendChild(textIn);
      list.appendChild(card);
    });
  }
  render();
  var add = document.createElement("button");
  add.type = "button"; add.className = "cmp-add-feat";
  add.innerHTML = makePlusSvg()+escapeHtml(addLabel);
  add.addEventListener("click", function(){
    items.push({name:"", text:""}); render(); onChange();
    var names = list.querySelectorAll(".cmp-feat-name");
    if(names.length) names[names.length-1].focus();
  });
  sec.appendChild(add);
}

function previewCard(preview, html){
  preview.innerHTML = "<div class='cmp-preview-label'>Preview</div><div class='cmp-preview-card'>"+html+"</div>";
}

function finishHomebrewSave(kind, saved, wasEditing){
  afterHomebrewChange();
  playAdd();
  if(savedHook && !wasEditing && savedHookKind===kind){
    var hook = savedHook; savedHook = null;
    showActionToast("Created "+saved.name+".");
    hook(saved);
    return;
  }
  showActionToast((wasEditing ? "Saved " : "Created ")+saved.name+"."+(wasEditing ? "" : " It's now in the creation wizard's list."));
}

/* ---- Race form ---- */
var LANGUAGE_CHOICE_ITEMS = [{value:"0", label:"None"},{value:"1", label:"1 of their choice"},{value:"2", label:"2 of their choice"},{value:"3", label:"3 of their choice"}];

function buildRaceForm(container){
  var existing = editingHomebrew.race ? getHomebrewEntry("race", editingHomebrew.race) : null;
  editingHomebrew.race = null;
  var d = existing ? JSON.parse(JSON.stringify(existing)) : {
    name:"", blurb:"", asi:{}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:0}, traits:[{name:"", text:""}]
  };
  d.asi = d.asi || {}; d.speed = d.speed || {walk:30}; d.languages = d.languages || {fixed:["Common"]};
  var shell = homebrewShell(container, existing ? "Edit "+existing.name : "Create a race",
    "Fill in what the race gets: ability increases, size, speed, senses, languages and its traits. It appears in the creation wizard's race list and on sheets like any other race.");

  var basics = shell.section("Basics");
  var row = document.createElement("div"); row.className = "cmp-form-row";
  var nameF = textField("Race name *", d.name, "e.g. Moonkin");
  nameF.input.addEventListener("input", function(){ d.name = nameF.input.value; update(); });
  row.appendChild(nameF.field);
  row.appendChild(pickerField("Size", themedPicker({
    key:"cmp:race:size", search:false, groups:{"":["Tiny","Small","Medium","Large"]}, value:d.size, placeholder:"Size", ariaLabel:"Size",
    onPick:function(v){ d.size = v; update(); }
  })));
  basics.appendChild(row);
  var blurbF = textField("Short description", d.blurb, "One line on who they are", true);
  blurbF.input.rows = 2;
  blurbF.input.addEventListener("input", function(){ d.blurb = blurbF.input.value; update(); });
  basics.appendChild(blurbF.field);

  // Ability increases: one small stepper per score (−2 to +2).
  var asiSec = shell.section("Ability score increases");
  var grid = document.createElement("div"); grid.className = "cmp-asi-grid";
  ABILITIES.forEach(function(a){
    var tile = document.createElement("div"); tile.className = "cmp-asi";
    var val = document.createElement("span"); val.className = "cmp-asi-val";
    function paint(){ var v = d.asi[a[0]]||0; val.textContent = v>0 ? "+"+v : (v<0 ? "−"+Math.abs(v) : "0"); tile.classList.toggle("on", !!v); }
    function step(n){ var v = Math.max(-2, Math.min(2, (d.asi[a[0]]||0)+n)); if(v) d.asi[a[0]] = v; else delete d.asi[a[0]]; paint(); update(); }
    var minus = document.createElement("button"); minus.type = "button"; minus.className = "cmp-asi-btn"; minus.textContent = "−";
    minus.setAttribute("aria-label", "Lower "+a[1]); minus.addEventListener("click", function(){ step(-1); });
    var plus = document.createElement("button"); plus.type = "button"; plus.className = "cmp-asi-btn"; plus.textContent = "+";
    plus.setAttribute("aria-label", "Raise "+a[1]); plus.addEventListener("click", function(){ step(1); });
    tile.innerHTML = "<span class='cmp-asi-lbl'>"+a[1].slice(0,3).toUpperCase()+"</span>";
    var ctl = document.createElement("div"); ctl.className = "cmp-asi-ctl";
    ctl.appendChild(minus); ctl.appendChild(val); ctl.appendChild(plus);
    tile.appendChild(ctl);
    paint();
    grid.appendChild(tile);
  });
  asiSec.appendChild(grid);

  var moveSec = shell.section("Speed and senses");
  var moveRow = document.createElement("div"); moveRow.className = "cmp-form-row cmp-form-row-4";
  [["walk","Walking speed"],["fly","Fly (optional)"],["swim","Swim (optional)"],["climb","Climb (optional)"]].forEach(function(p){
    var f = numberField(p[1]+(p[0]==="walk" ? " *" : ""), d.speed[p[0]] || (p[0]==="walk" ? 30 : ""), p[0]==="walk" ? "30" : "—");
    f.input.addEventListener("input", function(){
      var n = parseInt(f.input.value, 10);
      if(n>0) d.speed[p[0]] = n; else if(p[0]==="walk") d.speed.walk = 30; else delete d.speed[p[0]];
      update();
    });
    moveRow.appendChild(f.field);
  });
  moveSec.appendChild(moveRow);
  moveSec.appendChild(pickerField("Darkvision", themedPicker({
    key:"cmp:race:dv", search:false, groups:{"":[{value:"0", label:"None"},{value:"60", label:"60 ft"},{value:"120", label:"120 ft (superior)"}]},
    value:String(d.darkvision||0), placeholder:"Darkvision", ariaLabel:"Darkvision",
    onPick:function(v){ d.darkvision = Number(v); update(); }
  })));

  var langSec = shell.section("Languages");
  var langRow = document.createElement("div"); langRow.className = "cmp-form-row";
  var langF = textField("Always known", (d.languages.fixed||[]).join(", "), "e.g. Common, Sylvan");
  langF.input.addEventListener("input", function(){
    d.languages.fixed = langF.input.value.split(",").map(function(x){ return x.trim(); }).filter(Boolean);
    update();
  });
  langRow.appendChild(langF.field);
  langRow.appendChild(pickerField("Extra languages", themedPicker({
    key:"cmp:race:langs", search:false, groups:{"":LANGUAGE_CHOICE_ITEMS}, value:String(d.languages.choose||0), placeholder:"None", ariaLabel:"Extra languages",
    onPick:function(v){ d.languages.choose = Number(v); update(); }
  })));
  langSec.appendChild(langRow);

  var traitSec = shell.section("Traits");
  nameTextList(traitSec, d.traits, "Add a trait", "Trait name", "What it does", update);

  shell.actions(existing ? "Save changes" : "Create race", function(){
    var name = (d.name||"").trim();
    if(!name){ showActionToast("Give your race a name.", true); nameF.input.focus(); return; }
    var clash = homebrewNameProblem("race", name, existing && existing.id);
    if(clash){ showActionToast(clash, true); nameF.input.focus(); return; }
    d.traits = d.traits.filter(function(t){ return t.name && t.name.trim(); });
    if(!d.languages.choose) delete d.languages.choose;
    var saved = saveHomebrew("race", d);
    finishHomebrewSave("race", saved, !!existing);
  });

  function update(){
    var traits = d.traits.filter(function(t){ return t.name && t.name.trim(); });
    var langs = (d.languages.fixed||[]).join(", ")+(d.languages.choose ? (d.languages.fixed.length ? ", " : "")+"+"+d.languages.choose+" of choice" : "");
    previewCard(shell.preview,
      "<div class='cmp-preview-name'>"+escapeHtml((d.name||"").trim() || "Your race")+"</div>"+
      "<div class='cmp-preview-tags'><span class='cmp-tag-class'>"+escapeHtml(d.size)+"</span><span class='cmp-custom-tag'>Custom</span></div>"+
      "<p class='cmp-preview-blurb'>"+escapeHtml((d.blurb||"").trim() || "A short description will show here.")+"</p>"+
      facts([["Ability scores", raceAsiText({asi:d.asi})], ["Speed", raceSpeedText({speed:d.speed})],
        ["Darkvision", d.darkvision ? d.darkvision+" ft" : "None"], ["Languages", langs || "None"]])+
      (traits.length ? traits.map(function(t){ return "<div class='cmp-preview-feat'><div><strong>"+escapeHtml(t.name)+"</strong>"+(t.text ? "<p>"+escapeHtml(t.text)+"</p>" : "")+"</div></div>"; }).join("")
                     : "<p class='cmp-muted'>Traits you add appear here.</p>"));
  }
  update();
}

/* ---- Background form ---- */
function buildBackgroundForm(container){
  var existing = editingHomebrew.background ? getHomebrewEntry("background", editingHomebrew.background) : null;
  editingHomebrew.background = null;
  var d = existing ? JSON.parse(JSON.stringify(existing)) : {name:"", blurb:"", skills:["",""], tools:"", languages:0, feature:{name:"", text:""}};
  while(d.skills.length < 2) d.skills.push("");
  d.feature = d.feature || {name:"", text:""};
  var shell = homebrewShell(container, existing ? "Edit "+existing.name : "Create a background",
    "Describe where your character comes from and what it taught them: skills, tools, languages and a background feature. It appears in the creation wizard's background list.");

  var basics = shell.section("Basics");
  var nameF = textField("Background name *", d.name, "e.g. Lighthouse Keeper");
  nameF.input.addEventListener("input", function(){ d.name = nameF.input.value; update(); });
  basics.appendChild(nameF.field);
  var blurbF = textField("Short description", d.blurb, "One line on this background", true);
  blurbF.input.rows = 2;
  blurbF.input.addEventListener("input", function(){ d.blurb = blurbF.input.value; update(); });
  basics.appendChild(blurbF.field);

  var profSec = shell.section("Proficiencies");
  var skillRow = document.createElement("div"); skillRow.className = "cmp-form-row";
  [0,1].forEach(function(i){
    skillRow.appendChild(pickerField("Skill "+(i+1), themedPicker({
      key:"cmp:bg:skill:"+i, groups:{"":[{value:"", label:"None", muted:true}].concat(SKILLS.map(function(s){ return {value:s[0], label:s[0]}; }))},
      value:d.skills[i]||"", placeholder:"Choose a skill", ariaLabel:"Skill "+(i+1),
      reasonFor:function(v){ return v && v!==d.skills[i] && d.skills.indexOf(v)!==-1 ? "picked" : ""; },
      // reasonFor is checked each time the list opens, so the other
      // picker greys this one's choice out without a rebuild.
      onPick:function(v){ d.skills[i] = v; update(); }
    })));
  });
  profSec.appendChild(skillRow);
  var toolRow = document.createElement("div"); toolRow.className = "cmp-form-row";
  var toolsF = textField("Tools", d.tools, "e.g. Navigator's tools");
  toolsF.input.addEventListener("input", function(){ d.tools = toolsF.input.value; update(); });
  toolRow.appendChild(toolsF.field);
  toolRow.appendChild(pickerField("Languages", themedPicker({
    key:"cmp:bg:langs", search:false, groups:{"":LANGUAGE_CHOICE_ITEMS}, value:String(d.languages||0), placeholder:"None", ariaLabel:"Languages",
    onPick:function(v){ d.languages = Number(v); update(); }
  })));
  profSec.appendChild(toolRow);

  var featSec = shell.section("Feature");
  var featName = textField("Feature name", d.feature.name, "e.g. Beacon's Welcome");
  featName.input.addEventListener("input", function(){ d.feature.name = featName.input.value; update(); });
  featSec.appendChild(featName.field);
  var featText = textField("What it does", d.feature.text, "The background's special benefit", true);
  featText.input.addEventListener("input", function(){ d.feature.text = featText.input.value; update(); });
  featSec.appendChild(featText.field);

  shell.actions(existing ? "Save changes" : "Create background", function(){
    var name = (d.name||"").trim();
    if(!name){ showActionToast("Give your background a name.", true); nameF.input.focus(); return; }
    var clash = homebrewNameProblem("background", name, existing && existing.id);
    if(clash){ showActionToast(clash, true); nameF.input.focus(); return; }
    var out = JSON.parse(JSON.stringify(d));
    out.skills = out.skills.filter(Boolean);
    out.tools = (out.tools||"").trim() || "None";
    if(!out.feature.name || !out.feature.name.trim()) out.feature = null;
    var saved = saveHomebrew("background", out);
    finishHomebrewSave("background", saved, !!existing);
  });

  function update(){
    var skills = d.skills.filter(Boolean);
    previewCard(shell.preview,
      "<div class='cmp-preview-name'>"+escapeHtml((d.name||"").trim() || "Your background")+"</div>"+
      "<div class='cmp-preview-tags'><span class='cmp-custom-tag'>Custom</span></div>"+
      "<p class='cmp-preview-blurb'>"+escapeHtml((d.blurb||"").trim() || "A short description will show here.")+"</p>"+
      facts([["Skills", skills.join(", ") || "None"], ["Tools", (d.tools||"").trim() || "None"],
        ["Languages", d.languages ? d.languages+" of your choice" : "None"]])+
      (d.feature.name && d.feature.name.trim() ? "<div class='cmp-preview-feat'><div><strong>"+escapeHtml(d.feature.name)+"</strong>"+(d.feature.text ? "<p>"+escapeHtml(d.feature.text)+"</p>" : "")+"</div></div>" : ""));
  }
  update();
}

/* ---- Feats tab: built-in feats, custom feats and custom features ----
   The tab's + makes either a custom feat (a talent you choose, e.g.
   instead of an Ability Score Improvement; it joins the feat lists in the
   feat picker, level-up and the wizard) or a custom feature (something a
   class, race, background or item gives you, given from a sheet). Both
   are kept in this browser (core/custom-features.js). Opened from a
   sheet, giveTarget is that character: entries offer "Add to <name>" and
   a newly created one goes straight onto it. */
var CUSTOM_FEATURES_GROUP = "Custom features";
var giveTarget = null;     // character the Compendium was opened for
var formPreset = null;     // {kind, edit, from, direct}: used by the next form build
var featSectionRef = null;

function targetName(){ return giveTarget && giveTarget.name || "this character"; }
function hasFeatNamed(c, name){
  var lower = name.toLowerCase();
  return (c.feats||[]).some(function(f){ return (f.name||"").toLowerCase()===lower; });
}
function hasPrereq(f){ return f.prerequisite && f.prerequisite!=="None"; }

function fillFeatSection(section){
  var byCat = {}, data = {};
  FEATS_CATALOG.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(f){
    (byCat[f.category] = byCat[f.category] || []).push(f.name);
    data[f.name] = {kind:"feat", entry:f};
  });
  var groups = {};
  FEAT_CATEGORIES.concat(Object.keys(byCat)).forEach(function(cat){ if(byCat[cat] && !groups[cat]) groups[cat] = byCat[cat]; });
  var features = getCustom("feature").sort(function(a, b){ return a.name.localeCompare(b.name); });
  if(features.length){
    groups[CUSTOM_FEATURES_GROUP] = features.map(function(e){
      var key = data[e.name] ? e.name+" (feature)" : e.name; // may share a feat's name
      data[key] = {kind:"feature", entry:e};
      return key;
    });
  }
  section.groups = groups;
  section.data = data;
}

function featSection(){
  var section = {
    key:"feats", label:"Feats", searchPlaceholder:"Search feats and custom features…",
    renderSub:function(name, d){ return d.kind==="feat" ? d.entry.summary||"" : d.entry.text||""; },
    renderRight:function(name, d){
      var e = d.entry;
      if(d.kind==="feature"){
        var onIt = giveTarget && characterHasCustom("feature", giveTarget, e);
        return [e.isPassive ? "Passive" : "Active", onIt ? "On "+targetName() : e.source];
      }
      var owned = giveTarget && hasFeatNamed(giveTarget, e.name);
      return [e.custom ? "Custom" : (hasPrereq(e) ? "Requires" : ""),
              owned ? "On "+targetName() : (hasPrereq(e) ? (e.custom ? "Requires " : "")+e.prerequisite : "")];
    },
    searchText:function(name, d){
      var e = d.entry;
      return d.kind==="feat"
        ? name+" "+(e.summary||"")+" "+(e.category||"")+" "+(e.prerequisite||"")+(e.custom ? " custom homebrew" : "")
        : name+" "+e.source+" "+(e.text||"")+" custom feature homebrew "+(e.isPassive ? "passive" : "active");
    },
    onAdd:function(name, d){ if(d.kind==="feat") showFeat(d.entry); else showCustomFeature(d.entry); return false; },
    renderCustomForm:function(container){ buildCustomForm(container); }
  };
  fillFeatSection(section);
  featSectionRef = section;
  return section;
}

function afterCustomChange(){
  if(featSectionRef) fillFeatSection(featSectionRef);
  refreshCatalog();
  renderAll(); // sheets show the new or updated copies
}

function openCustomForm(preset){ formPreset = preset; showCatalogCustomView(); }

function confirmDeleteCustom(kind, id){
  var entry = getCustomEntry(kind, id);
  if(!entry) return;
  var users = charactersWithCustom(kind, entry);
  confirmDialog("Delete "+entry.name+"?",
    users.length ? users.map(function(c){ return c.name||"A character"; }).join(", ")+(users.length>1 ? " have" : " has")+" it and will keep their copy; it just won't be in the Compendium anymore."
                 : "This custom "+kind+" will be removed from the Compendium.",
    function(){
      deleteCustom(kind, id);
      afterCustomChange();
      playDelete();
      showActionToast("Deleted "+entry.name+".");
    });
}

/* "Add to <character>" at the bottom of a detail view. */
function giveRow(body, alreadyHas, onGive){
  if(!giveTarget) return;
  var row = document.createElement("div");
  row.className = "cmp-give-row";
  var give = document.createElement("button");
  give.type = "button";
  give.className = "btn primary";
  if(alreadyHas){
    give.disabled = true;
    give.textContent = targetName()+" already has it";
  } else {
    give.innerHTML = makePlusSvg()+"Add to "+escapeHtml(targetName());
    give.addEventListener("click", function(){ closeInfo(); onGive(); });
  }
  row.appendChild(give);
  body.appendChild(row);
}

/* Stays open so several can be added in a row; the list marks what the
   character already has. */
function gave(name){
  playAdd();
  showActionToast("Added "+name+" to "+targetName()+".");
  afterCustomChange();
}

function showFeat(feat){
  openInfoModal(feat.name, function(body){
    if(feat.custom) customBar(body, function(){ openCustomForm({kind:"feat", edit:feat.id}); }, function(){ confirmDeleteCustom("feat", feat.id); });
    var rows = [["Category", feat.category], ["Prerequisite", hasPrereq(feat) ? feat.prerequisite : "None"]];
    if(feat.custom){
      var users = charactersWithCustom("feat", feat).map(function(c){ return c.name || "A character"; });
      rows.push(["Characters", users.join(", ") || "None yet"]);
    }
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(feat.summary||"")+"</p>"+facts(rows));
    block(body, "Full description", "<p class='cmp-desc'>"+escapeHtml(feat.description||"")+"</p>");
    giveRow(body, giveTarget && hasFeatNamed(giveTarget, feat.name), function(){
      var entry = feat.custom && getCustomEntry("feat", feat.id);
      if(entry) addCustomToCharacter("feat", giveTarget, entry);
      else {
        if(!giveTarget.feats) giveTarget.feats = [];
        giveTarget.feats.push({id:uid(), name:feat.name, prerequisite:feat.prerequisite||"None", category:feat.category||"General",
          summary:feat.summary||"", description:feat.description||"", source:"SRD"});
        save();
      }
      gave(feat.name);
    });
  });
}

function showCustomFeature(entry){
  openInfoModal(entry.name, function(body){
    customBar(body, function(){ openCustomForm({kind:"feature", edit:entry.id}); }, function(){ confirmDeleteCustom("feature", entry.id); });
    var users = charactersWithCustom("feature", entry).map(function(c){ return c.name || "A character"; });
    block(body, "", (entry.text ? "<p class='cmp-desc'>"+escapeHtml(entry.text)+"</p>" : "<p class='cmp-muted'>No description.</p>"));
    block(body, "", facts([
      ["Kind", "Custom feature"],
      ["Source", entry.source],
      ["Type", entry.isPassive ? "Passive (always on)" : "Active (you use it)"],
      ["Characters", users.join(", ") || "None yet"]
    ]));
    giveRow(body, giveTarget && characterHasCustom("feature", giveTarget, entry), function(){
      addCustomToCharacter("feature", giveTarget, entry);
      gave(entry.name);
    });
  });
}

var TYPE_ITEMS = [{value:"passive", label:"Passive (always on)"}, {value:"active", label:"Active (you use it)"}];
var KIND_HINT = {
  feat: "A talent a character chooses, usually instead of an Ability Score Improvement. It's offered with the other feats when adding a feat, levelling up or making a character.",
  feature: "Something a class, race, background or item gives a character, like a trait or a passive bonus. Add it from their sheet's Features & Feats tab."
};

function buildCustomForm(container){
  var p = formPreset || {};
  formPreset = null; // used up: leaving the form resets it to "new"
  var existing = p.edit ? getCustomEntry(p.kind, p.edit) : null;
  var from = existing ? null : p.from || null;
  var src = existing || from || {};
  var d = {
    kind: p.kind || "feat",
    name: src.name || "",
    text: (src.description!=null ? src.description : src.text) || "",
    // feat
    category: FEAT_CATEGORIES.indexOf(src.category)!==-1 ? src.category : "General",
    prerequisite: src.prerequisite && src.prerequisite!=="None" ? src.prerequisite : "",
    summary: existing ? existing.summary||"" : "",
    // feature
    source: FEATURE_SOURCES.indexOf(src.source)!==-1 ? src.source : "Passive",
    isPassive: src.isPassive!=null ? !!src.isPassive : true
  };
  render();

  function render(){
    container.innerHTML = "";
    var kind = d.kind;
    var intro = existing ? "Changes apply to every character that has it."
      : giveTarget ? "It's added to "+targetName()+" and kept in the Compendium, so other characters can take it too."
      : "Saved in this browser, so any character can take it.";
    var shell = homebrewShell(container, existing ? "Edit "+existing.name : "Create a "+kind, intro);

    // Feat or feature (fixed once it exists, or when re-saving a copy).
    var kindSec = shell.section(existing || from ? "Kind: "+kind : "What are you making?");
    if(!existing && !from){
      var pills = document.createElement("div");
      pills.className = "cmp-kind-row";
      [["feat","Feat"],["feature","Feature"]].forEach(function(k){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ff-pill"+(kind===k[0] ? " active" : "");
        b.textContent = k[1];
        b.setAttribute("aria-pressed", kind===k[0] ? "true" : "false");
        b.addEventListener("click", function(){ if(d.kind!==k[0]){ d.kind = k[0]; render(); } });
        pills.appendChild(b);
      });
      kindSec.appendChild(pills);
    }
    var hint = document.createElement("p");
    hint.className = "cmp-form-hint";
    hint.textContent = KIND_HINT[kind];
    kindSec.appendChild(hint);

    var basics = shell.section("Basics");
    var nameF = textField((kind==="feat" ? "Feat" : "Feature")+" name *", d.name,
      kind==="feat" ? "e.g. Shield Slam, Shadow Walker" : "e.g. Relentless Rage, Fey Gift, Cloak of Embers");
    nameF.input.addEventListener("input", function(){ d.name = nameF.input.value; update(); });
    basics.appendChild(nameF.field);
    var row = document.createElement("div"); row.className = "cmp-form-row";
    if(kind==="feat"){
      row.appendChild(pickerField("Category", themedPicker({
        key:"cmp:feat:category", search:false, groups:{"":FEAT_CATEGORIES}, value:d.category, placeholder:"Category", ariaLabel:"Category",
        onPick:function(v){ d.category = v; update(); }
      })));
      var reqF = textField("Prerequisite (optional)", d.prerequisite, "e.g. Strength 13 or higher");
      reqF.input.addEventListener("input", function(){ d.prerequisite = reqF.input.value; update(); });
      row.appendChild(reqF.field);
    } else {
      row.appendChild(pickerField("Source", themedPicker({
        key:"cmp:feature:source", search:false, groups:{"":FEATURE_SOURCES}, value:d.source, placeholder:"Source", ariaLabel:"Source",
        onPick:function(v){ d.source = v; update(); }
      })));
      row.appendChild(pickerField("Type", themedPicker({
        key:"cmp:feature:type", search:false, groups:{"":TYPE_ITEMS}, value:d.isPassive ? "passive" : "active", placeholder:"Type", ariaLabel:"Type",
        onPick:function(v){ d.isPassive = v==="passive"; update(); }
      })));
    }
    basics.appendChild(row);

    var descSec = shell.section("Description");
    if(kind==="feat"){
      var sumF = textField("Summary (optional)", d.summary, "One line for the feat lists; the description's start is used if empty");
      sumF.input.addEventListener("input", function(){ d.summary = sumF.input.value; update(); });
      descSec.appendChild(sumF.field);
    }
    var textF = textField(kind==="feat" ? "Benefits *" : "What it does", d.text,
      kind==="feat" ? "What the feat grants: ability increases, new actions, bonuses…" : "The rules: bonuses, how it's used, how often, when it recharges…", true);
    textF.input.rows = 6;
    textF.input.addEventListener("input", function(){ d.text = textF.input.value; update(); });
    descSec.appendChild(textF.field);

    shell.actions(existing ? "Save changes" : giveTarget ? "Create and add to "+targetName() : "Create "+kind, function(){
      var name = (d.name||"").trim();
      if(!name){ showActionToast("Give your "+kind+" a name.", true); nameF.input.focus(); return; }
      var clash = customNameProblem(kind, name, existing && existing.id);
      if(clash){ showActionToast(clash, true); nameF.input.focus(); return; }
      if(kind==="feat" && !d.text.trim()){ showActionToast("Describe what the feat grants.", true); textF.input.focus(); return; }
      var saved = saveCustom(kind, kind==="feat"
        ? {id:existing && existing.id, name:name, category:d.category, prerequisite:d.prerequisite, summary:d.summary, description:d.text}
        : {id:existing && existing.id, name:name, source:d.source, isPassive:d.isPassive, text:d.text});
      playAdd();
      if(!existing && giveTarget){
        // From a sheet: onto that character (relinking the copy it was
        // made from, if any), then back to the sheet.
        var copies = giveTarget[kind==="feat" ? "feats" : "features"] || [];
        if(from && copies.indexOf(from)!==-1) linkCharacterCopy(kind, from, saved);
        else addCustomToCharacter(kind, giveTarget, saved);
        showActionToast("Added "+saved.name+" to "+targetName()+". It's in the Compendium for other characters too.");
        afterCustomChange();
        closeCompendium();
        return;
      }
      afterCustomChange();
      showActionToast((existing ? "Saved " : "Created ")+saved.name+"."+(existing || kind!=="feat" ? "" : " It's now in the feat lists."));
      if(p.direct) closeCompendium();
    });

    function update(){
      var tags = kind==="feat"
        ? "<span class='cmp-tag-class'>"+escapeHtml(d.category)+"</span><span class='cmp-custom-tag'>Custom</span>"+
          ((d.prerequisite||"").trim() ? "<span class='cmp-tag-muted'>Requires "+escapeHtml(d.prerequisite.trim())+"</span>" : "")
        : "<span class='cmp-tag-class'>"+escapeHtml(d.source)+"</span><span class='cmp-custom-tag'>Custom</span>"+
          "<span class='cmp-tag-muted'>"+(d.isPassive ? "Passive" : "Active")+"</span>";
      var summary = kind==="feat" && (d.summary||"").trim();
      previewCard(shell.preview,
        "<div class='cmp-preview-name'>"+escapeHtml((d.name||"").trim() || "Your "+kind)+"</div>"+
        "<div class='cmp-preview-tags'>"+tags+"</div>"+
        (summary ? "<p class='cmp-preview-blurb'><strong>"+escapeHtml(summary)+"</strong></p>" : "")+
        "<p class='cmp-preview-blurb cmp-desc'>"+escapeHtml((d.text||"").trim() || "Its description will show here.")+"</p>");
    }
    update();
  }
}
