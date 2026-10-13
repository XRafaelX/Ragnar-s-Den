/* ---------------- Compendium: Feats and custom features ----------------
   The Feats tab's list and detail views, adding a feat or feature to the
   character the Compendium was opened for, and the form that makes or
   edits a custom feat or feature. */
import { showCatalogCustomView, refreshCatalog } from "../../ui/catalog-picker.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { makePlusSvg } from "../../ui/svg-icons.js";
import { renderAll } from "../sheet.js";
import { openInfoModal } from "../../ui/info-modal.js";
import { FEATS_CATALOG } from "../../data/feats.js";
import { FEATURE_SOURCES, FEAT_CATEGORIES, getCustom, getCustomEntry, saveCustom, deleteCustom, customNameProblem, charactersWithCustom, characterHasCustom, addCustomToCharacter, linkCharacterCopy } from "../../core/custom-features.js";
import { escapeHtml, uid } from "../../core/helpers.js";
import { facts, textField, homebrewShell, pickerField, previewCard } from "../../ui/homebrew-form.js";
import { save } from "../../core/state.js";
import { featHasPicks, featNeedsChoice, emptyPicks, applyFeatPicks } from "../../core/feat-picks.js";
import { openFeatPicksModal } from "../../ui/feat-picks.js";
import { session, block, closeInfo, closeCompendium, customBar } from "./shared.js";

/* ---- Feats tab: built-in feats, custom feats and custom features ----
   The tab's + makes either a custom feat (a talent you choose, e.g.
   instead of an Ability Score Improvement; it joins the feat lists in the
   feat picker, level-up and the wizard) or a custom feature (something a
   class, race, background or item gives you, given from a sheet). Both
   are kept in this browser (core/custom-features.js). Opened from a
   sheet, session.giveTarget is that character: entries offer "Add to <name>" and
   a newly created one goes straight onto it. */
var CUSTOM_FEATURES_GROUP = "Custom features";
var featSectionRef = null;

function targetName(){ return session.giveTarget && session.giveTarget.name || "this character"; }
function hasFeatNamed(c, name){
  var lower = name.toLowerCase();
  return (c.feats||[]).some(function(f){ return (f.name||"").toLowerCase()===lower; });
}
function hasPrereq(f){ return f.prerequisite && f.prerequisite!=="None"; }
var FEAT_SOURCES = {
  PHB:"Player's Handbook", TCE:"Tasha's Cauldron of Everything", XGE:"Xanathar's Guide to Everything",
  MTF:"Mordenkainen's Tome of Foes", ERLW:"Eberron: Rising from the Last War", FTD:"Fizban's Treasury of Dragons",
  SCC:"Strixhaven: A Curriculum of Chaos", DSotDQ:"Dragonlance: Shadow of the Dragon Queen",
  BGG:"Bigby Presents: Glory of the Giants", PAitM:"Planescape: Adventures in the Multiverse", BMT:"The Book of Many Things"
};

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

export function featSection(){
  var section = {
    key:"feats", label:"Feats", searchPlaceholder:"Search feats and custom features…",
    renderSub:function(name, d){ return d.kind==="feat" ? d.entry.summary||"" : d.entry.text||""; },
    renderRight:function(name, d){
      var e = d.entry;
      if(d.kind==="feature"){
        var onIt = session.giveTarget && characterHasCustom("feature", session.giveTarget, e);
        return [e.isPassive ? "Passive" : "Active", onIt ? "On "+targetName() : e.source];
      }
      var owned = session.giveTarget && hasFeatNamed(session.giveTarget, e.name);
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

function openCustomForm(preset){ session.formPreset = preset; showCatalogCustomView(); }

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
  if(!session.giveTarget) return;
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
    if(feat.source && FEAT_SOURCES[feat.source]) rows.push(["Source", FEAT_SOURCES[feat.source]]);
    if(feat.custom){
      var users = charactersWithCustom("feat", feat).map(function(c){ return c.name || "A character"; });
      rows.push(["Characters", users.join(", ") || "None yet"]);
    }
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(feat.summary||"")+"</p>"+facts(rows));
    block(body, "Full description", "<p class='cmp-desc'>"+escapeHtml(feat.description||"")+"</p>");
    giveRow(body, session.giveTarget && !feat.repeatable && hasFeatNamed(session.giveTarget, feat.name), function(){
      var entry = feat.custom && getCustomEntry("feat", feat.id);
      if(entry) addCustomToCharacter("feat", session.giveTarget, entry);
      else {
        if(!session.giveTarget.feats) session.giveTarget.feats = [];
        var copy = {id:uid(), name:feat.name, prerequisite:feat.prerequisite||"None", category:feat.category||"General",
          summary:feat.summary||"", description:feat.description||"", source:"SRD"};
        session.giveTarget.feats.push(copy);
        save();
        // Its +1 or skills: asked for now (applied at once when there's
        // nothing to choose); skipping leaves a prompt on the sheet.
        if(featHasPicks(feat)){
          var target = session.giveTarget;
          if(featNeedsChoice(feat)) openFeatPicksModal(target, copy, function(){ save(); afterCustomChange(); });
          else { applyFeatPicks(target, copy, emptyPicks(feat)); save(); }
        }
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
    giveRow(body, session.giveTarget && characterHasCustom("feature", session.giveTarget, entry), function(){
      addCustomToCharacter("feature", session.giveTarget, entry);
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
  var p = session.formPreset || {};
  session.formPreset = null; // used up: leaving the form resets it to "new"
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
      : session.giveTarget ? "It's added to "+targetName()+" and kept in the Compendium, so other characters can take it too."
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

    shell.actions(existing ? "Save changes" : session.giveTarget ? "Create and add to "+targetName() : "Create "+kind, function(){
      var name = (d.name||"").trim();
      if(!name){ showActionToast("Give your "+kind+" a name.", true); nameF.input.focus(); return; }
      var clash = customNameProblem(kind, name, existing && existing.id);
      if(clash){ showActionToast(clash, true); nameF.input.focus(); return; }
      if(kind==="feat" && !d.text.trim()){ showActionToast("Describe what the feat grants.", true); textF.input.focus(); return; }
      var saved = saveCustom(kind, kind==="feat"
        ? {id:existing && existing.id, name:name, category:d.category, prerequisite:d.prerequisite, summary:d.summary, description:d.text}
        : {id:existing && existing.id, name:name, source:d.source, isPassive:d.isPassive, text:d.text});
      playAdd();
      if(!existing && session.giveTarget){
        // From a sheet: onto that character (relinking the copy it was
        // made from, if any), then back to the sheet.
        var copies = session.giveTarget[kind==="feat" ? "feats" : "features"] || [];
        if(from && copies.indexOf(from)!==-1) linkCharacterCopy(kind, from, saved);
        else addCustomToCharacter(kind, session.giveTarget, saved);
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
