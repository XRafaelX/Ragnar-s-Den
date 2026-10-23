/* ---------------- Compendium: Classes and Subclasses ----------------
   The two tabs' lists and detail views, and the form that makes or edits
   a custom subclass. */
import { showCatalogCustomView, refreshCatalog } from "../../ui/catalog-picker.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { makePlusSvg } from "../../ui/svg-icons.js";
import { getCustomSubclass, saveCustomSubclass, deleteCustomSubclass, subclassNameProblem, charactersUsing } from "../../core/custom-subclasses.js";
import { renderAll } from "../sheet.js";
import { openInfoModal } from "../../ui/info-modal.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../../data/classes.js";
import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL } from "../../data/progression.js";
import { HIT_DICE_BY_CLASS } from "../../data/abilities-skills.js";
import { classFeatureList, escapeHtml } from "../../core/helpers.js";
import { facts, textField } from "../../ui/homebrew-form.js";
import { save } from "../../core/state.js";
import { session, ABILITY_NAME, abilityList, block, featureList, closeInfo } from "./shared.js";

var CLASS_ROLES = {
  "Martial": ["Barbarian","Fighter","Monk","Rogue"],
  "Half casters": ["Artificer","Paladin","Ranger"],
  "Full casters": ["Bard","Cleric","Druid","Sorcerer","Warlock","Wizard"]
};
var CASTER_LABEL = {full:"Full caster", half:"Half caster", artificer:"Half caster", pact:"Pact Magic", third:"One-third caster"};

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
    block(body, "Features by level", featureList(features) || "<p class='cmp-muted'>No features listed.</p>");
    var back = document.createElement("button");
    back.type = "button";
    back.className = "btn small ghost cmp-back";
    back.textContent = "← All about the "+className;
    back.addEventListener("click", function(){ showClass(className); });
    body.appendChild(back);
  });
}

/* ---- Catalog sections ---- */
export function classSection(){
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
export function subclassSection(){
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

function buildSubclassForm(container){
  var existing = editingId ? getCustomSubclass(editingId) : null;
  editingId = null; // consumed: leaving the form resets it to "new"
  var draft = existing ? JSON.parse(JSON.stringify(existing)) : {className:session.presetClass||"", name:"", blurb:"", features:[]};
  session.presetClass = null;
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
  featHint.textContent = "Add them in any order. They're sorted by level when you save.";
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
    if(session.savedHook && !existing && session.savedHookKind==="subclass"){
      // Opened from level-up: hand the new subclass back to it.
      var hook = session.savedHook; session.savedHook = null;
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
