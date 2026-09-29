import { SPELL_DATA, SPELL_LEVEL_LABELS, buildSpellGroups, spellDataForClass } from "../../data/spells.js";
import { save } from "../../core/state.js";
import { renderAll } from "../sheet.js";
import { openCatalogPicker, showCatalogCustomView, refreshCatalog } from "../../ui/catalog-picker.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { showActionToast } from "../../ui/toast.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { facts, textField, homebrewShell, pickerField, previewCard } from "../../ui/homebrew-form.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { escapeHtml } from "../../core/helpers.js";
import {
  getCustomSpell, saveCustomSpell, deleteCustomSpell,
  spellNameProblem, charactersWithSpell, SPELL_HOMEBREW_GROUP
} from "../../core/custom-spells.js";

var SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];

/* id being edited in the custom form; null = create new */
var editing = null;

function hasSpell(c, name){
  var n = (name || "").trim().toLowerCase();
  return (c.spells || []).some(function(sp){ return (sp.name || "").trim().toLowerCase() === n; });
}

/* The catalog fields a character's spell keeps (so the sheet can show
   casting time/range/etc. without looking anything up). `notes` stays the
   player's own free text. */
export function spellFromCatalog(name, d){
  var entry = {
    name: name, level: d.level, prepared: d.level === 0, notes: "",
    school: d.school, castingTime: d.castingTime, range: d.range,
    components: d.components, material: d.material || "", duration: d.duration,
    concentration: !!d.concentration, ritual: !!d.ritual, summary: d.summary
  };
  if(d.custom && d.id) entry.homebrewId = d.id;
  return entry;
}

/* Returns false (so the picker skips its "Added" badge) when the spell
   is already on the sheet. */
export function addCatalogSpell(c, name, d){
  if(hasSpell(c, name)){
    showActionToast(name + " is already on " + (c.name || "this character") + "'s list.");
    return false;
  }
  c.spells.push(spellFromCatalog(name, d));
  save();
  playAdd();
  return true;
}

/* ---- Homebrew row actions: Edit / Delete ---- */
function customRowActions(name, d){
  if(!d.custom) return [];
  return [
    {
      label: "Edit", title: "Edit " + name,
      onClick: function(){ editing = d.id; showCatalogCustomView(); }
    },
    {
      label: "Delete", title: "Delete " + name, danger: true,
      onClick: function(){
        var entry = getCustomSpell(d.id);
        if(!entry) return;
        var users = charactersWithSpell(entry);
        confirmDialog(
          "Delete " + name + "?",
          users.length
            ? users.map(function(c){ return c.name || "A character"; }).join(", ") +
              (users.length > 1 ? " have" : " has") +
              " it and will keep their copy; it just won't be in the Spellbook anymore."
            : "This custom spell will be removed from the catalog.",
          function(){
            deleteCustomSpell(d.id);
            refreshCatalog();
            playDelete();
            showActionToast("Deleted " + name + ".");
          }
        );
      }
    }
  ];
}

/* ---- Custom spell form (homebrewShell style) ---- */
export function buildCustomSpellForm(container, _closeCustom, onSubmit){
  var existing = editing ? getCustomSpell(editing) : null;
  editing = null;

  var d = existing
    ? JSON.parse(JSON.stringify(existing))
    : { name:"", level:0, school:"", castingTime:"1 action", range:"",
        components:"", material:"", duration:"Instantaneous",
        concentration:false, ritual:false, classes:[], summary:"" };

  var introText = existing
    ? "Changes apply to every character that has this spell."
    : "Saved in this browser under Homebrew, so any spellcaster can learn it.";

  var shell = homebrewShell(container, existing ? "Edit " + existing.name : "Custom Spell", introText);

  /* ── Basics ── */
  var basics = shell.section("Basics");
  var row1 = document.createElement("div"); row1.className = "cmp-form-row";

  var nameF = textField("Spell Name *", d.name, "e.g. Bigby's Fist");
  nameF.input.addEventListener("input", function(){ d.name = nameF.input.value; update(); });
  row1.appendChild(nameF.field);

  row1.appendChild(pickerField("Level", themedPicker({
    key: "sp:level", search: false, value: String(d.level), placeholder: "Level", ariaLabel: "Spell Level",
    groups: { "": SPELL_LEVEL_LABELS.map(function(label, i){ return {value:String(i), label:label}; }) },
    onPick: function(v){ d.level = Number(v); update(); }
  })));

  row1.appendChild(pickerField("School", themedPicker({
    key: "sp:school", search: false, value: d.school, placeholder: "School", ariaLabel: "Spell School",
    groups: { "": [{value:"", label:"None", muted:true}].concat(SCHOOLS.map(function(sc){ return {value:sc, label:sc}; })) },
    onPick: function(v){ d.school = v; update(); }
  })));
  basics.appendChild(row1);

  /* ── Casting ── */
  var casting = shell.section("Casting");
  var row2 = document.createElement("div"); row2.className = "cmp-form-row";

  var timeF = textField("Casting Time", d.castingTime, "1 action");
  timeF.input.addEventListener("input", function(){ d.castingTime = timeF.input.value; update(); });
  row2.appendChild(timeF.field);

  var rangeF = textField("Range", d.range, "e.g. 60 feet");
  rangeF.input.addEventListener("input", function(){ d.range = rangeF.input.value; update(); });
  row2.appendChild(rangeF.field);
  casting.appendChild(row2);

  var row3 = document.createElement("div"); row3.className = "cmp-form-row";
  var compF = textField("Components", d.components, "V, S, M");
  compF.input.addEventListener("input", function(){ d.components = compF.input.value; update(); });
  row3.appendChild(compF.field);

  var durF = textField("Duration", d.duration, "Instantaneous");
  durF.input.addEventListener("input", function(){ d.duration = durF.input.value; update(); });
  row3.appendChild(durF.field);
  casting.appendChild(row3);

  /* ── Flags ── */
  var flagSec = shell.section("Properties");
  var flagRow = document.createElement("div"); flagRow.className = "cmp-kind-row";

  function flagPill(label, key){
    var b = document.createElement("button");
    b.type = "button";
    function paint(){
      b.className = "ff-pill" + (d[key] ? " active" : "");
      b.setAttribute("aria-pressed", d[key] ? "true" : "false");
    }
    b.textContent = label;
    b.addEventListener("click", function(){ d[key] = !d[key]; paint(); update(); });
    paint();
    flagRow.appendChild(b);
    return b;
  }
  flagPill("Concentration", "concentration");
  flagPill("Ritual", "ritual");
  flagSec.appendChild(flagRow);

  /* ── Description ── */
  var descSec = shell.section("Description");
  var summaryF = textField("What the spell does", d.summary, "A brief description of the spell's effect…", true);
  summaryF.input.addEventListener("input", function(){ d.summary = summaryF.input.value; update(); });
  descSec.appendChild(summaryF.field);

  /* ── Material component details (optional) ── */
  var matF = textField("Material components (optional)", d.material, "e.g. a pinch of sulfur");
  matF.input.addEventListener("input", function(){ d.material = matF.input.value; update(); });
  descSec.appendChild(matF.field);

  /* ── Actions ── */
  shell.actions(existing ? "Save changes" : "Create spell", function(){
    var name = (d.name || "").trim();
    if(!name){
      showActionToast("Give your spell a name.", true);
      nameF.input.focus();
      return;
    }
    var clash = spellNameProblem(name, existing && existing.id);
    if(clash){
      showActionToast(clash, true);
      nameF.input.focus();
      return;
    }
    var saved = saveCustomSpell(d);
    playAdd();
    showActionToast(
      (existing ? "Saved " : "Created ") + saved.name + "." +
      (existing ? "" : " It's under Homebrew for every spellcaster.")
    );
    // If called with a direct onSubmit callback (from sheet spell picker),
    // hand the result back so the character copy is added immediately.
    if(typeof onSubmit === "function") onSubmit(saved);
    refreshCatalog();
  });

  /* ── Live preview ── */
  function update(){
    var name = (d.name || "").trim() || "Your spell";
    var tags = [];
    if(d.concentration) tags.push("Concentration");
    if(d.ritual) tags.push("Ritual");
    previewCard(shell.preview,
      "<div class='cmp-preview-name'>" + escapeHtml(name) + "</div>" +
      "<div class='cmp-preview-tags'>" +
        (d.school ? "<span class='cmp-tag-class'>" + escapeHtml(d.school) + "</span>" : "") +
        "<span class='cmp-tag-muted'>" + escapeHtml(SPELL_LEVEL_LABELS[d.level] || "Cantrip") + "</span>" +
        "<span class='cmp-custom-tag'>Custom</span>" +
        (tags.length ? "<span class='cmp-tag-muted'>" + escapeHtml(tags.join(" · ")) + "</span>" : "") +
      "</div>" +
      facts([
        ["Casting Time", d.castingTime],
        ["Range",        d.range],
        ["Components",   d.components + (d.material ? " (" + d.material + ")" : "")],
        ["Duration",     d.duration]
      ]) +
      (d.summary ? "<p class='cmp-preview-blurb'>" + escapeHtml(d.summary) + "</p>" : "")
    );
  }
  update();
}

/* ---- Section descriptor ---- */
export function spellSection(key, label, groups, data, onAdd, onCustomSaved){
  return {
    key: key,
    label: label,
    searchPlaceholder: "Search spells…",
    groups: groups,
    data: data,
    searchText: function(name, d){
      return [name, d.school, (d.classes||[]).join(" "), d.summary,
              d.concentration ? "concentration" : "", d.ritual ? "ritual" : ""].join(" ");
    },
    renderSub: function(name, d){ return (d.school || "") + " · " + (d.castingTime || "") + " · " + (d.range || ""); },
    renderDetail: function(name, d){ return d.summary; },
    renderRight: function(name, d){
      var tags = [];
      if(d.concentration) tags.push("Conc.");
      if(d.ritual) tags.push("Ritual");
      return [d.components, tags.join(" · ")];
    },
    onAdd: onAdd,
    rowActions: customRowActions,
    renderCustomForm: function(container, closeCustom){
      buildCustomSpellForm(container, closeCustom, onCustomSaved);
    }
  };
}

/* ---- Sheet spell picker (opened from a character's Spells tab) ---- */
export function buildSpellSections(c){
  function onAdd(name, d){ return addCatalogSpell(c, name, d); }
  function onCustomSaved(saved){
    // saved is the registry entry; add a linked copy to this character
    if(!hasSpell(c, saved.name)){
      c.spells.push(spellFromCatalog(saved.name, SPELL_DATA[saved.name] || saved));
      save();
    }
    renderAll();
  }
  var sections = [];
  var seen = {};
  (c.classes || []).forEach(function(cl){
    var name = cl.name;
    if(seen[name]) return;
    seen[name] = true;
    var data = spellDataForClass(name);
    if(!Object.keys(data).length) return;
    sections.push(spellSection("class-" + name, name + " spells", buildSpellGroups(name), data, onAdd, onCustomSaved));
  });
  // "All spells" tab always includes the homebrew group
  sections.push(spellSection("all", "All spells", buildSpellGroups(), SPELL_DATA, onAdd, onCustomSaved));
  return sections;
}

export function openSpellPicker(c){
  editing = null;
  openCatalogPicker({
    sections: buildSpellSections(c),
    onClose: function(){ editing = null; renderAll(); }
  });
}
