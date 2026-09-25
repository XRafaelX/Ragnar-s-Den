import { save } from "../../core/state.js";
import { profBonus, mod, fmtMod, clamp, ce } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";
import { playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { SPELL_LEVEL_LABELS, spellLevelLabel } from "../../data/spells.js";
import { openSpellPicker } from "./spell-picker.js";
import { sheetHeader } from "./inventory.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";
import { showActionToast } from "../../ui/toast.js";


var SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];

function ordinal(n){ return n + (n===1 ? "st" : n===2 ? "nd" : n===3 ? "rd" : "th"); }

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

/* Editable spell details in a bottom sheet; same treatment as
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
    var blank = document.createElement("option"); blank.value = ""; blank.textContent = "None";
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

/* ---- Spellcasting stats ----
   Same tile look as the Vitals tab: ability (a select styled as the big
   value), save DC, and spell attack (tap to roll). */
function statTile(label, hint){
  var box = ce("div","vital-box vital-mini sc-tile");
  var lbl = ce("div","lbl"); lbl.textContent = label;
  box.appendChild(lbl);
  var val = ce("div","init-hero-val");
  box.appendChild(val);
  var h = ce("div","vital-hint"); h.textContent = hint;
  box.appendChild(h);
  return {box:box, val:val};
}

function renderSpellcastingCard(c){
  var card = makeCard("Spellcasting");
  var pb = profBonus(c);
  var scMod = mod(c.abilities[c.spellcasting.ability]);
  var grid = ce("div","vitals-grid");

  var ab = statTile("Ability", fmtMod(scMod)+" modifier");
  var sel = ce("select","sc-ability-select");
  sel.setAttribute("aria-label", "Spellcasting ability");
  [["int","INT"],["wis","WIS"],["cha","CHA"]].forEach(function(a){
    var o = document.createElement("option"); o.value = a[0]; o.textContent = a[1];
    if(c.spellcasting.ability===a[0]) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener("change", function(){ c.spellcasting.ability = sel.value; save(); renderAll(); });
  ab.val.appendChild(sel);
  grid.appendChild(ab.box);

  var dc = statTile("Save DC", "8 + prof + mod");
  dc.val.textContent = 8+pb+scMod;
  grid.appendChild(dc.box);

  var atk = statTile("Spell attack", "Tap to roll");
  atk.val.textContent = fmtMod(pb+scMod);
  atk.box.classList.add("sc-roll");
  atk.box.setAttribute("role","button"); atk.box.tabIndex = 0;
  atk.box.title = "Roll a spell attack";
  function roll(){ performRoll(20,1,pb+scMod,"none","Spell attack"); }
  atk.box.addEventListener("click", roll);
  atk.box.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); roll(); } });
  grid.appendChild(atk.box);

  card.appendChild(grid);
  return card;
}

/* ---- Spell slots ----
   One row per slot level the character actually has, as pips: filled =
   available, hollow = spent. Tap a filled pip to spend one, a hollow one
   to get it back. Pact Magic sits in the same card as its own row.
   Edit reveals all nine levels with steppers for items / homebrew. */
var slotEditOpen = false;

function slotPips(total, used, label, onChange){
  var wrap = ce("div","slot-pips");
  var left = total - used;
  for(var p=0; p<total; p++){
    var avail = p < left;
    var pip = document.createElement("button");
    pip.type = "button";
    pip.className = "slot-pip" + (avail ? "" : " used");
    pip.title = avail ? "Available. Tap to spend" : "Spent. Tap to restore";
    pip.setAttribute("aria-label", label+" slot "+(p+1)+(avail ? " (available)" : " (spent)"));
    pip.addEventListener("click", (function(avail){
      return function(){ onChange(clamp(used + (avail ? 1 : -1), 0, total)); };
    })(avail));
    wrap.appendChild(pip);
  }
  return wrap;
}

function slotRow(levelText, subText, pipsEl, rightEl){
  var row = ce("div","slot-row");
  var name = ce("div","slot-row-name");
  name.innerHTML = "<b></b><span></span>";
  name.firstChild.textContent = levelText;
  name.lastChild.textContent = subText;
  row.appendChild(name);
  row.appendChild(pipsEl);
  row.appendChild(rightEl);
  return row;
}

function maxStepper(s){
  var st = ce("div","stat-stepper slot-stepper");
  var down = ce("button","stat-arrow-btn stat-arrow-down");
  down.type = "button"; down.innerHTML = makeStatArrowSvg("down");
  down.setAttribute("aria-label","Fewer slots"); down.disabled = s.max <= 0;
  down.addEventListener("click", function(){ s.max = Math.max(0, s.max-1); s.used = clamp(s.used,0,s.max); save(); renderAll(); });
  var val = ce("span","stat-score-val"); val.textContent = s.max;
  var up = ce("button","stat-arrow-btn stat-arrow-up");
  up.type = "button"; up.innerHTML = makeStatArrowSvg("up");
  up.setAttribute("aria-label","More slots"); up.disabled = s.max >= 9;
  up.addEventListener("click", function(){ s.max = Math.min(9, s.max+1); save(); renderAll(); });
  st.appendChild(down); st.appendChild(val); st.appendChild(up);
  return st;
}

function renderSlotsCard(c){
  var sc = c.spellcasting;
  var pact = sc.pact && sc.pact.max ? sc.pact : null;
  var card = makeCard("Spell slots");

  var tools = ce("div","slot-tools");
  var anySpent = pact && pact.used > 0;
  for(var i=1;i<=9;i++) if(sc.slots[i].used > 0) anySpent = true;
  var rest = ce("button","btn small ghost");
  rest.type = "button"; rest.textContent = "Long rest";
  rest.title = "Get all spent slots back";
  rest.disabled = !anySpent;
  rest.addEventListener("click", function(){
    for(var i=1;i<=9;i++) sc.slots[i].used = 0;
    if(sc.pact) sc.pact.used = 0;
    save(); renderAll();
    showActionToast("All spell slots restored.");
  });
  var edit = ce("button","btn small ghost"+(slotEditOpen ? " on" : ""));
  edit.type = "button"; edit.textContent = slotEditOpen ? "Done" : "Edit";
  edit.title = "Set slot maximums by hand (magic items, homebrew)";
  edit.addEventListener("click", function(){ slotEditOpen = !slotEditOpen; renderAll(); });
  tools.appendChild(rest); tools.appendChild(edit);
  card.querySelector("h3").appendChild(tools);

  var list = ce("div","slot-list");
  for(var lvl=1;lvl<=9;lvl++){
    (function(lvl){
      var s = sc.slots[lvl];
      if(!slotEditOpen && !s.max) return;
      var right;
      if(slotEditOpen) right = maxStepper(s);
      else { right = ce("div","slot-left"+(s.used>=s.max ? " empty" : "")); right.textContent = (s.max-s.used)+" left"; }
      list.appendChild(slotRow(ordinal(lvl), "level",
        slotPips(s.max, s.used, ordinal(lvl)+" level", function(u){ s.used = u; save(); renderAll(); }), right));
    })(lvl);
  }
  if(pact){
    var pr = ce("div","slot-left"+(pact.used>=pact.max ? " empty" : ""));
    pr.textContent = (pact.max-pact.used)+" left";
    var restNote = ce("small"); restNote.textContent = "short rest";
    pr.appendChild(restNote);
    var row = slotRow("Pact", ordinal(pact.slotLevel)+" level",
      slotPips(pact.max, pact.used, "Pact", function(u){ pact.used = u; save(); renderAll(); }), pr);
    row.classList.add("pact-row");
    list.appendChild(row);
  }
  if(!list.children.length){
    var empty = ce("p","slot-empty");
    empty.textContent = "No spell slots. Spellcasting classes get them automatically as they level; use Edit to add slots from items or homebrew.";
    card.appendChild(empty);
  }
  card.appendChild(list);
  return card;
}

/* "1 of 2 left" next to a level heading in the spell list. */
function slotsLeftText(c, lvl){
  var s = lvl > 0 && c.spellcasting.slots[lvl];
  if(!s || !s.max) return "";
  return (s.max - s.used)+" of "+s.max+" slots left";
}

/* ---- Spells panel ---- */
export function renderSpellsPanel(c){
  var panel = document.createElement("div");
  panel.appendChild(renderSpellcastingCard(c));
  panel.appendChild(renderSlotsCard(c));

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
        var leftTxt = slotsLeftText(c, lvl);
        if(leftTxt){
          var leftEl = ce("span","spell-level-slots");
          leftEl.textContent = leftTxt;
          label.appendChild(leftEl);
        }
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
