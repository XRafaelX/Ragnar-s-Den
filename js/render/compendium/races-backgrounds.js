/* ---------------- Compendium: Races and Backgrounds ----------------
   The two tabs' lists and detail views, and the forms that make or edit
   a homebrew race or background. */
import { showCatalogCustomView, refreshCatalog } from "../../ui/catalog-picker.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { makePlusSvg } from "../../ui/svg-icons.js";
import { renderAll } from "../sheet.js";
import { openInfoModal } from "../../ui/info-modal.js";
import { RACES } from "../../data/races.js";
import { RACE_DATA, raceAsiText, raceAsiShort, raceSpeedText } from "../../data/race-data.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK, BACKGROUND_LANGUAGES, BACKGROUND_TOOLS } from "../../data/backgrounds.js";
import { ABILITIES, SKILLS } from "../../data/abilities-skills.js";
import { getHomebrewEntry, saveHomebrew, deleteHomebrew, homebrewNameProblem, charactersUsingHomebrew } from "../../core/custom-homebrew.js";
import { escapeHtml } from "../../core/helpers.js";
import { facts, textField, homebrewShell, numberField, pickerField, previewCard } from "../../ui/homebrew-form.js";
import { backgroundFeatGrant } from "../../core/feat-picks.js";
import { session, block, featureList, customBar } from "./shared.js";

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
    ].concat(backgroundFeatGrant(name) ? [["Feat", backgroundFeatGrant(name).def.name + (backgroundFeatGrant(name).option ? " (" + backgroundFeatGrant(name).option + ")" : "")]] : [])));
    if(info && info.feature && info.feature.name) block(body, "Feature", featureList([info.feature]));
  });
}

export function raceSection(){
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
export function backgroundSection(){
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

/* ---- Homebrew races and backgrounds (the Races / Backgrounds tabs' +) ----
   Same layout as the custom subclass form: a form card with a live
   preview beside it on wide screens. */
var editingHomebrew = {race:null, background:null};

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

function finishHomebrewSave(kind, saved, wasEditing){
  afterHomebrewChange();
  playAdd();
  if(session.savedHook && !wasEditing && session.savedHookKind===kind){
    var hook = session.savedHook; session.savedHook = null;
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
    var f = numberField(p[1]+(p[0]==="walk" ? " *" : ""), d.speed[p[0]] || (p[0]==="walk" ? 30 : ""), p[0]==="walk" ? "30" : "None");
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
