import { openCatalogPicker } from "../ui/catalog-picker.js";
import { openInfoModal } from "../ui/info-modal.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../data/classes.js";
import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL } from "../data/progression.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { ABILITIES, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { classFeatureList, escapeHtml } from "../core/helpers.js";

/* ---------------- Compendium ----------------
   A read-only reference (home screen) for classes, subclasses and feats,
   in the same browse page as the Armory and Spellbook. Tapping an entry
   opens its details instead of adding it to anyone. */

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
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(sub.blurb||"")+"</p>"+facts([
      ["Class", className],
      [prog.subclassLabel || "Subclass", prog.subclassLevel ? "Chosen at "+className+" level "+prog.subclassLevel : ""],
      ["Spellcasting", sub.casterType==="third" ? "One-third caster ("+ABILITY_NAME[sub.spellAbility]+")" : ""]
    ]));
    var features = [];
    Object.keys(sub.features||{}).map(Number).sort(function(a, b){ return a-b; }).forEach(function(lv){
      sub.features[lv].forEach(function(f){ features.push({name:f.name, text:f.text, level:lv}); });
    });
    block(body, "Features (up to level "+MAX_LEVEL+")", featureList(features) || "<p class='cmp-muted'>No features before level "+(MAX_LEVEL+1)+".</p>");
    var back = document.createElement("button");
    back.type = "button";
    back.className = "btn small ghost cmp-back";
    back.textContent = "← All about the "+className;
    back.addEventListener("click", function(){ showClass(className); });
    body.appendChild(back);
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

function subclassSection(){
  var groups = {}, data = {};
  Object.keys(SUBCLASSES).sort().forEach(function(cls){
    groups[cls] = SUBCLASSES[cls].map(function(sub){
      // Names are unique today; the class suffix only guards future clashes.
      var key = data[sub.name] ? sub.name+" ("+cls+")" : sub.name;
      data[key] = {cls:cls, sub:sub};
      return key;
    });
  });
  return {
    key:"subclasses", label:"Subclasses", searchPlaceholder:"Search subclasses…",
    groups:groups, data:data,
    renderSub:function(name, d){ return d.sub.blurb || ""; },
    renderRight:function(name, d){
      var prog = CLASS_PROGRESSION[d.cls] || {};
      return [d.cls, prog.subclassLevel ? "From level "+prog.subclassLevel : ""];
    },
    searchText:function(name, d){ return name+" "+d.cls+" "+(d.sub.blurb||""); },
    onAdd:function(name, d){ showSubclass(d.cls, d.sub); return false; }
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

export function openCompendium(){
  openCatalogPicker({sections:[classSection(), subclassSection(), featSection()]});
}
