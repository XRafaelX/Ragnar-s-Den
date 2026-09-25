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
import { RACES } from "../data/races.js";
import { RACE_DATA, raceAsiText, raceAsiShort, raceSpeedText } from "../data/race-data.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK, BACKGROUND_LANGUAGES, BACKGROUND_TOOLS } from "../data/backgrounds.js";
import { ABILITIES, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { classFeatureList, escapeHtml } from "../core/helpers.js";

/* ---------------- Compendium ----------------
   A read-only reference (home screen) for classes, subclasses, races,
   backgrounds and feats,
   in the same browse page as the Armory and Spellbook. Tapping an entry
   opens its details instead of adding it to anyone. The Subclasses tab's
   + makes a custom (homebrew) subclass: pick the class, name it and list
   its features with the level each is gained; it then shows up for
   characters in level-up and creation like any other. */

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
    block(body, "", facts([
      ["Ability scores", raceAsiText(d)],
      ["Size", d.size],
      ["Speed", raceSpeedText(d)],
      ["Darkvision", d.darkvision ? d.darkvision+" ft"+(d.darkvision>=120 ? " (superior)" : "") : "None"],
      ["Languages", langs],
      ["Source", d.source]
    ]));
    block(body, "Traits", featureList(d.traits || []));
  });
}

function backgroundSkills(info){
  var fixed = (info.skills||[]).join(", ");
  if(info.skillChoice) return fixed ? fixed+", "+info.skillChoice : "Choose "+info.skillChoice;
  return fixed || "Two of your choice";
}
function backgroundLanguages(name){
  var n = BACKGROUND_LANGUAGES[name] || 0;
  return n ? n+" of your choice" : "None";
}

function showBackground(name){
  var info = BACKGROUND_INFO[name];
  openInfoModal(name, function(body){
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(info ? info.blurb : BACKGROUND_INFO_FALLBACK)+"</p>"+facts([
      ["Skills", info ? backgroundSkills(info) : "Two of your choice"],
      ["Tools", BACKGROUND_TOOLS[name] || "Check your sourcebook"],
      ["Languages", backgroundLanguages(name)]
    ]));
  });
}

function showFeat(feat){
  openInfoModal(feat.name, function(body){
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(feat.summary||"")+"</p>"+facts([
      ["Category", feat.category],
      ["Prerequisite", feat.prerequisite && feat.prerequisite!=="None" ? feat.prerequisite : "None"]
    ]));
    block(body, "Full description", "<p class='cmp-desc'>"+escapeHtml(feat.description||"")+"</p>");
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
    if(savedHook && !existing){
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
    searchText:function(name, d){ return name+" "+raceAsiText(d)+" "+(d.source||"")+" "+(d.traits||[]).map(function(t){ return t.name+" "+t.text; }).join(" "); },
    onAdd:function(name){ showRace(name); return false; }
  };
}

function backgroundSection(){
  var data = {};
  Object.keys(BACKGROUNDS).forEach(function(g){ BACKGROUNDS[g].forEach(function(n){ data[n] = BACKGROUND_INFO[n] || {}; }); });
  return {
    key:"backgrounds", label:"Backgrounds", searchPlaceholder:"Search backgrounds…",
    groups:BACKGROUNDS, data:data,
    renderSub:function(name, d){ return d.blurb || BACKGROUND_INFO_FALLBACK; },
    // Row: the fixed skills, with a short note when there's a pick to make.
    renderRight:function(name, d){
      var fixed = (d.skills||[]).join(", ");
      var extra = d.skillChoice ? (fixed ? "+ a skill of choice" : "Skills of choice") : "";
      return [fixed, extra];
    },
    searchText:function(name, d){ return name+" "+(d.blurb||"")+" "+(d.skills||[]).join(" "); },
    onAdd:function(name){ showBackground(name); return false; }
  };
}

function featSection(){
  var groups = {}, data = {};
  FEATS_CATALOG.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(f){
    (groups[f.category] = groups[f.category] || []).push(f.name);
    data[f.name] = f;
  });
  return {
    key:"feats", label:"Feats", searchPlaceholder:"Search feats…",
    groups:groups, data:data,
    renderSub:function(name, d){ return d.summary || ""; },
    renderRight:function(name, d){ return [d.prerequisite && d.prerequisite!=="None" ? "Requires" : "", d.prerequisite && d.prerequisite!=="None" ? d.prerequisite : ""]; },
    searchText:function(name, d){ return name+" "+(d.summary||"")+" "+(d.category||""); },
    onAdd:function(name, d){ showFeat(d); return false; }
  };
}

/* opts (all optional):
     newSubclassFor  class name: open straight into the custom subclass
                     form with that class picked (from level-up).
     onSubclassSaved function(entry) called once after that form saves.
     onClose         called when the Compendium is closed. */
var presetClass = null, savedHook = null;
export function openCompendium(opts){
  opts = opts || {};
  var sections = [classSection(), subclassSection(), raceSection(), backgroundSection(), featSection()];
  openCatalogPicker({
    sections:sections,
    initialSection: opts.newSubclassFor ? 1 : 0,
    onClose:function(){
      presetClass = null; savedHook = null;
      if(opts.onClose) opts.onClose();
    }
  });
  if(opts.newSubclassFor){
    presetClass = opts.newSubclassFor;
    savedHook = opts.onSubclassSaved || null;
    showCatalogCustomView();
  }
}
