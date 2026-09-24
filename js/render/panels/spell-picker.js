import { SPELL_DATA, SPELL_LEVEL_LABELS, buildSpellGroups, spellDataForClass } from "../../data/spells.js";
import { save } from "../../core/state.js";
import { renderAll } from "../sheet.js";
import { openCatalogPicker } from "../../ui/catalog-picker.js";
import { playAdd } from "../../ui/sound.js";
import { showActionToast } from "../../ui/toast.js";

var SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];

function hasSpell(c, name){
  var n = (name||"").trim().toLowerCase();
  return (c.spells||[]).some(function(sp){ return (sp.name||"").trim().toLowerCase() === n; });
}

/* The catalog fields a character's spell keeps (so the sheet can show
   casting time/range/etc. without looking anything up). `notes` stays the
   player's own free text. */
export function spellFromCatalog(name, d){
  return {
    name: name, level: d.level, prepared: d.level === 0, notes: "",
    school: d.school, castingTime: d.castingTime, range: d.range,
    components: d.components, duration: d.duration,
    concentration: !!d.concentration, ritual: !!d.ritual, summary: d.summary
  };
}

/* Returns false (so the picker skips its "✓ Added" flash) when the spell
   is already on the sheet. */
export function addCatalogSpell(c, name, d){
  if(hasSpell(c, name)){
    showActionToast(name + " is already on " + (c.name||"this character") + "’s list.");
    return false;
  }
  c.spells.push(spellFromCatalog(name, d));
  save();
  playAdd();
}

export function addCustomSpell(c, fields){
  c.spells.push({
    name: fields.name, level: fields.level, prepared: fields.level === 0, notes: "",
    school: fields.school, castingTime: fields.castingTime, range: fields.range,
    components: fields.components, duration: fields.duration,
    concentration: fields.concentration, ritual: fields.ritual, summary: fields.summary
  });
  save();
  playAdd();
}

function field(labelText, control){
  var f = document.createElement("div"); f.className = "field";
  f.innerHTML = "<label>" + labelText + "</label>";
  f.appendChild(control);
  return f;
}

export function buildCustomSpellForm(container, closeCustom, onSubmit){
  var form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:420px;";

  var title = document.createElement("h4");
  title.style.cssText = "font-family:var(--serif);color:var(--brass-bright);margin:0;font-weight:normal;font-size:17px;";
  title.textContent = "Custom Spell";
  form.appendChild(title);

  var nameInput = document.createElement("input");
  nameInput.type = "text"; nameInput.placeholder = "e.g. Bigby's Fist";
  form.appendChild(field("Spell Name *", nameInput));

  var row1 = document.createElement("div");
  row1.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";
  var levelSelect = document.createElement("select");
  SPELL_LEVEL_LABELS.forEach(function(label, i){
    var o = document.createElement("option"); o.value = i; o.textContent = label;
    levelSelect.appendChild(o);
  });
  row1.appendChild(field("Level", levelSelect));
  var schoolSelect = document.createElement("select");
  var blank = document.createElement("option"); blank.value = ""; blank.textContent = "—";
  schoolSelect.appendChild(blank);
  SCHOOLS.forEach(function(sc){
    var o = document.createElement("option"); o.value = sc; o.textContent = sc;
    schoolSelect.appendChild(o);
  });
  row1.appendChild(field("School", schoolSelect));
  form.appendChild(row1);

  var row2 = document.createElement("div");
  row2.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";
  var timeInput = document.createElement("input"); timeInput.type = "text"; timeInput.value = "1 action";
  row2.appendChild(field("Casting Time", timeInput));
  var rangeInput = document.createElement("input"); rangeInput.type = "text"; rangeInput.placeholder = "e.g. 60 feet";
  row2.appendChild(field("Range", rangeInput));
  var compInput = document.createElement("input"); compInput.type = "text"; compInput.placeholder = "V, S, M";
  row2.appendChild(field("Components", compInput));
  var durInput = document.createElement("input"); durInput.type = "text"; durInput.value = "Instantaneous";
  row2.appendChild(field("Duration", durInput));
  form.appendChild(row2);

  var flags = document.createElement("div");
  flags.style.cssText = "display:flex;gap:18px;";
  function checkbox(labelText){
    var l = document.createElement("label");
    l.style.cssText = "display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;";
    var cb = document.createElement("input"); cb.type = "checkbox"; cb.className = "chk";
    l.appendChild(cb); l.appendChild(document.createTextNode(labelText));
    flags.appendChild(l);
    return cb;
  }
  var concCb = checkbox("Concentration");
  var ritualCb = checkbox("Ritual");
  form.appendChild(flags);

  var summaryInput = document.createElement("textarea");
  summaryInput.rows = 3; summaryInput.placeholder = "What the spell does…";
  summaryInput.style.cssText = "width:100%;background:var(--field-bg);border:1px solid var(--rule);border-radius:4px;color:var(--text-on-parch);padding:6px 9px;font-size:13px;resize:vertical;";
  form.appendChild(field("Description", summaryInput));

  var addBtn = document.createElement("button");
  addBtn.className = "btn primary"; addBtn.textContent = "+ Add Spell";
  addBtn.addEventListener("click", function(){
    var nameVal = nameInput.value.trim();
    if(!nameVal){ alert("Please enter a spell name."); nameInput.focus(); return; }
    var fields = {
      name: nameVal, level: Number(levelSelect.value) || 0, school: schoolSelect.value,
      castingTime: timeInput.value.trim(), range: rangeInput.value.trim(),
      components: compInput.value.trim(), duration: durInput.value.trim(),
      concentration: concCb.checked, ritual: ritualCb.checked, summary: summaryInput.value.trim()
    };
    nameInput.value = ""; levelSelect.value = "0"; schoolSelect.value = "";
    timeInput.value = "1 action"; rangeInput.value = ""; compInput.value = "";
    durInput.value = "Instantaneous"; concCb.checked = false; ritualCb.checked = false;
    summaryInput.value = "";
    closeCustom();
    onSubmit(fields);
  });
  form.appendChild(addBtn);

  container.appendChild(form);
}

function spellSection(key, label, groups, data, c){
  return {
    key: key,
    label: label,
    searchPlaceholder: "Search spells…",
    groups: groups,
    data: data,
    searchText: function(name, d){
      return [name, d.school, d.classes.join(" "), d.summary, d.concentration ? "concentration" : "", d.ritual ? "ritual" : ""].join(" ");
    },
    renderSub: function(name, d){ return d.school + " · " + d.castingTime + " · " + d.range; },
    renderDetail: function(name, d){ return d.summary; },
    renderRight: function(name, d){
      var tags = [];
      if(d.concentration) tags.push("Conc.");
      if(d.ritual) tags.push("Ritual");
      return [d.components, tags.join(" · ")];
    },
    onAdd: function(name, d){ return addCatalogSpell(c, name, d); },
    renderCustomForm: function(container, closeCustom){
      buildCustomSpellForm(container, closeCustom, function(fields){
        addCustomSpell(c, fields);
        renderAll();
      });
    }
  };
}

/* One tab per spellcasting class on the sheet (so a Wizard sees the
   Wizard list first), then everything. */
export function buildSpellSections(c){
  var sections = [];
  var seen = {};
  (c.classes||[]).forEach(function(cl){
    var name = cl.name;
    if(seen[name]) return;
    seen[name] = true;
    var data = spellDataForClass(name);
    if(!Object.keys(data).length) return;
    sections.push(spellSection("class-" + name, name + " spells", buildSpellGroups(name), data, c));
  });
  sections.push(spellSection("all", "All spells", buildSpellGroups(), SPELL_DATA, c));
  return sections;
}

export function openSpellPicker(c){
  openCatalogPicker({
    sections: buildSpellSections(c),
    onClose: function(){ renderAll(); }
  });
}
