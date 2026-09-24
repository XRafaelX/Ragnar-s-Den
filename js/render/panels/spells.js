import { save } from "../../core/state.js";
import { profBonus, mod, fmtMod, clamp } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";
import { playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { SPELL_LEVEL_LABELS, spellLevelLabel } from "../../data/spells.js";
import { openSpellPicker } from "./spell-picker.js";
import { sheetHeader } from "./inventory.js";


var SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];

function spellSubtitle(sp){
  return [sp.school, sp.castingTime, sp.range, sp.components, sp.duration].filter(Boolean).join(" · ");
}

/* Compact header: name + concentration/ritual tags, a Prepared pill
   (cantrips are always ready, so no pill), edit pencil, remove. Tapping
   the row opens the spell sheet. */
function spellHeader(c, sp, idx){
  var header = document.createElement("div");
  header.className = "inv-card-header";
  header.addEventListener("click", function(){ openSpellSheet(c, sp); });

  var titleGroup = document.createElement("div");
  titleGroup.className = "inv-card-title-group";
  var nameSpan = document.createElement("span");
  nameSpan.className = "inv-name-inline";
  nameSpan.textContent = sp.name || "Unnamed spell";
  titleGroup.appendChild(nameSpan);
  [[sp.concentration, "C", "Concentration"], [sp.ritual, "R", "Ritual"]].forEach(function(t){
    if(!t[0]) return;
    var tag = document.createElement("span");
    tag.className = "inv-qty-badge";
    tag.textContent = t[1]; tag.title = t[2];
    titleGroup.appendChild(tag);
  });
  header.appendChild(titleGroup);

  var actions = document.createElement("div");
  actions.className = "inv-card-header-actions";

  if((sp.level||0) > 0){
    var prepLbl = document.createElement("label"); prepLbl.className = "inv-eq-pill";
    var prepCb = document.createElement("input"); prepCb.type = "checkbox"; prepCb.className = "chk";
    prepCb.checked = !!sp.prepared;
    prepCb.addEventListener("click", function(e){ e.stopPropagation(); });
    prepCb.addEventListener("change", function(){ sp.prepared = prepCb.checked; save(); });
    prepLbl.appendChild(prepCb);
    prepLbl.appendChild(document.createTextNode("Prepared"));
    actions.appendChild(prepLbl);
  }

  var editBtn = document.createElement("button");
  editBtn.type = "button"; editBtn.className = "inv-edit-btn";
  editBtn.textContent = "✎"; editBtn.title = "Edit details";
  editBtn.setAttribute("aria-label", "Edit details");
  editBtn.addEventListener("click", function(e){ e.stopPropagation(); openSpellSheet(c, sp); });
  actions.appendChild(editBtn);

  var rmBtn = document.createElement("button");
  rmBtn.className = "rm-btn"; rmBtn.textContent = "✕"; rmBtn.title = "Remove spell";
  rmBtn.addEventListener("click", function(e){
    e.stopPropagation();
    confirmDialog("Remove "+(sp.name||"this spell")+"?", "This cannot be undone.", function(){
      c.spells.splice(idx,1); save(); renderAll(); playDelete();
    });
  });
  actions.appendChild(rmBtn);

  header.appendChild(actions);
  return header;
}

function renderSpellCard(c, sp, idx){
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card";
  card.appendChild(spellHeader(c, sp, idx));

  var sub = spellSubtitle(sp);
  if(sub){
    var subEl = document.createElement("div");
    subEl.className = "inv-card-subtitle";
    subEl.textContent = sub;
    card.appendChild(subEl);
  }
  if(sp.summary){
    var summaryP = document.createElement("p");
    summaryP.className = "inv-armor-note";
    summaryP.textContent = sp.summary;
    card.appendChild(summaryP);
  }
  if(sp.notes){
    var notesP = document.createElement("p");
    notesP.className = "spell-notes";
    notesP.textContent = sp.notes;
    card.appendChild(notesP);
  }
  return card;
}

/* Editable spell details in a bottom sheet — same treatment as
   weapons/armor/gear. Everything is editable so custom and homebrew
   spells (and corrections to catalog ones) are first-class. */
function openSpellSheet(c, sp){
  openBottomSheet(function(body, refresh, close){
    sheetHeader(body, sp, "Spell name", spellSubtitle(sp), close);

    var details = document.createElement("div");
    details.className = "inv-type-fields";

    function textField(labelText, key, wide){
      var f = document.createElement("div");
      f.className = "field-inline " + (wide ? "spell-field-wide" : "spell-field");
      f.innerHTML = "<label>"+labelText+"</label>";
      var input = document.createElement("input");
      input.type = "text"; input.value = sp[key]||"";
      input.addEventListener("input", function(){ sp[key] = input.value; save(); renderAll(); });
      f.appendChild(input);
      details.appendChild(f);
    }

    var levelField = document.createElement("div");
    levelField.className = "field-inline spell-field";
    levelField.innerHTML = "<label>Level</label>";
    var levelSel = document.createElement("select");
    SPELL_LEVEL_LABELS.forEach(function(label, i){
      var o = document.createElement("option"); o.value = i; o.textContent = label;
      if((sp.level||0) === i) o.selected = true;
      levelSel.appendChild(o);
    });
    levelSel.addEventListener("change", function(){ sp.level = Number(levelSel.value)||0; save(); renderAll(); });
    levelField.appendChild(levelSel);
    details.appendChild(levelField);

    var schoolField = document.createElement("div");
    schoolField.className = "field-inline spell-field";
    schoolField.innerHTML = "<label>School</label>";
    var schoolSel = document.createElement("select");
    var blank = document.createElement("option"); blank.value = ""; blank.textContent = "—";
    schoolSel.appendChild(blank);
    SCHOOLS.forEach(function(name){
      var o = document.createElement("option"); o.value = name; o.textContent = name;
      if(sp.school === name) o.selected = true;
      schoolSel.appendChild(o);
    });
    schoolSel.addEventListener("change", function(){ sp.school = schoolSel.value; save(); renderAll(); });
    schoolField.appendChild(schoolSel);
    details.appendChild(schoolField);

    textField("Casting time", "castingTime");
    textField("Range", "range");
    textField("Components", "components");
    textField("Duration", "duration");

    function flag(labelText, key){
      var l = document.createElement("label");
      l.className = "inv-prof-label";
      var cb = document.createElement("input"); cb.type = "checkbox"; cb.className = "chk";
      cb.checked = !!sp[key];
      cb.addEventListener("change", function(){ sp[key] = cb.checked; save(); renderAll(); });
      l.appendChild(cb); l.appendChild(document.createTextNode(labelText));
      details.appendChild(l);
    }
    flag("Concentration", "concentration");
    flag("Ritual", "ritual");

    var descField = document.createElement("div");
    descField.className = "field-inline spell-field-wide";
    descField.innerHTML = "<label>Description</label>";
    var desc = document.createElement("textarea");
    desc.rows = 3; desc.className = "spell-textarea"; desc.value = sp.summary||"";
    desc.addEventListener("input", function(){ sp.summary = desc.value; save(); renderAll(); });
    descField.appendChild(desc);
    details.appendChild(descField);

    var notesField = document.createElement("div");
    notesField.className = "field-inline spell-field-wide";
    notesField.innerHTML = "<label>My notes</label>";
    var notes = document.createElement("textarea");
    notes.rows = 2; notes.className = "spell-textarea"; notes.placeholder = "Reminders, how you use it…";
    notes.value = sp.notes||"";
    notes.addEventListener("input", function(){ sp.notes = notes.value; save(); renderAll(); });
    notesField.appendChild(notes);
    details.appendChild(notesField);

    body.appendChild(details);
  });
}

/* ---- Spells panel ---- */
export function renderSpellsPanel(c){
  var panel = document.createElement("div");

  var scCard = makeCard("Spellcasting");
  var row = document.createElement("div");
  row.className = "grid-row";
  var abField = document.createElement("div");
  var pb = profBonus(c);
  var scMod = mod(c.abilities[c.spellcasting.ability]);
  abField.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Spellcasting ability</label><br>';
  var sel = document.createElement("select");
  ["int","wis","cha"].forEach(function(a){
    var o = document.createElement("option"); o.value=a; o.textContent = a.toUpperCase();
    if(c.spellcasting.ability===a) o.selected = true;
    sel.appendChild(o);
  });
  sel.style.padding="4px"; sel.style.border="1px solid var(--rule)"; sel.style.borderRadius="4px"; sel.style.background="var(--field-bg)"; sel.style.color="var(--text-on-parch)";
  sel.addEventListener("change", function(){ c.spellcasting.ability = sel.value; save(); renderAll(); });
  abField.appendChild(sel);
  row.appendChild(abField);

  var dcBox = document.createElement("div");
  dcBox.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Save DC</label><br>'+
    '<span style="font-family:var(--serif);font-size:20px;">'+(8+pb+scMod)+'</span>';
  row.appendChild(dcBox);

  var atkBox = document.createElement("div");
  atkBox.style.cursor="pointer";
  atkBox.title = "Click to roll a spell attack";
  atkBox.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Attack bonus</label><br>'+
    '<span style="font-family:var(--serif);font-size:20px;">'+fmtMod(pb+scMod)+'</span>';
  atkBox.addEventListener("click", function(){ performRoll(20,1,pb+scMod,"none","Spell attack"); });
  row.appendChild(atkBox);
  scCard.appendChild(row);
  panel.appendChild(scCard);

  var slotCard = makeCard("Spell slots");
  var slotGrid = document.createElement("div");
  slotGrid.className = "slot-grid";
  for(var lvl=1;lvl<=9;lvl++){
    (function(lvl){
      var s = c.spellcasting.slots[lvl];
      var box = document.createElement("div");
      box.className = "slot-box";
      box.innerHTML = '<div class="lbl">Level '+lvl+'</div>';
      var frac = document.createElement("div");
      frac.className = "fraction";
      var usedInput = document.createElement("input");
      usedInput.type="number"; usedInput.value = s.used; usedInput.min="0";
      usedInput.addEventListener("input", function(){ s.used = clamp(Number(usedInput.value)||0,0,s.max); save(); });
      var slash = document.createElement("span"); slash.textContent="/";
      var maxInput = document.createElement("input");
      maxInput.type="number"; maxInput.value = s.max; maxInput.min="0";
      maxInput.addEventListener("input", function(){ s.max = Math.max(0,Number(maxInput.value)||0); s.used = clamp(s.used,0,s.max); save(); renderAll(); });
      frac.appendChild(usedInput); frac.appendChild(slash); frac.appendChild(maxInput);
      box.appendChild(frac);
      var useBtn = document.createElement("button");
      useBtn.className = "btn small"; useBtn.style.marginTop="4px"; useBtn.style.width="100%";
      useBtn.textContent = "Use slot";
      useBtn.disabled = s.used>=s.max;
      useBtn.addEventListener("click", function(){ if(s.used<s.max){ s.used++; save(); renderAll(); } });
      box.appendChild(useBtn);
      slotGrid.appendChild(box);
    })(lvl);
  }
  slotCard.appendChild(slotGrid);
  panel.appendChild(slotCard);

  var spellCard = makeCard("Known / prepared spells");
  var spells = c.spells || [];
  if(!spells.length){
    var empty = document.createElement("p");
    empty.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);";
    empty.textContent = "No spells yet.";
    spellCard.appendChild(empty);
  } else {
    // Grouped by spell level, alphabetical within each; idx stays the
    // position in c.spells so removal hits the right entry.
    var entries = spells.map(function(sp, idx){ return {sp:sp, idx:idx}; });
    entries.sort(function(a, b){
      return (a.sp.level||0) - (b.sp.level||0) || (a.sp.name||"").localeCompare(b.sp.name||"");
    });
    var currentLevel = null;
    var list = null;
    entries.forEach(function(entry){
      var lvl = entry.sp.level || 0;
      if(lvl !== currentLevel){
        currentLevel = lvl;
        var label = document.createElement("div");
        label.className = "spell-level-label";
        label.textContent = spellLevelLabel(lvl);
        spellCard.appendChild(label);
        list = document.createElement("div");
        list.className = "ff-items-list inv-items-list";
        spellCard.appendChild(list);
      }
      list.appendChild(renderSpellCard(c, entry.sp, entry.idx));
    });
  }

  var addSpellBtn = document.createElement("button");
  addSpellBtn.className = "btn small primary"; addSpellBtn.style.marginTop = "12px";
  addSpellBtn.textContent = "+ Add Spell";
  addSpellBtn.addEventListener("click", function(){ openSpellPicker(c); });
  spellCard.appendChild(addSpellBtn);
  panel.appendChild(spellCard);

  return panel;
}
