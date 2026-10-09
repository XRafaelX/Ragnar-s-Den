import { save } from "../../core/state.js";
import { profBonus, mod, fmtMod, clamp, ce, featureSpells, characterIsCaster, classSpellChoices, spellOptionText, ordinal, spellcastingAbilities } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";
import { playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { SPELL_LEVEL_LABELS, spellLevelLabel, SPELL_DATA, catalogSpellName } from "../../data/spells.js";
import { openSpellPicker, addCatalogSpell } from "./spell-picker.js";
import { renderSpellChoiceOptions } from "../../ui/spell-choice.js";
import { sheetHeader } from "./inventory.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";
import { showActionToast } from "../../ui/toast.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { spellCounts, spellNeedsPreparing, classKnownSpells, casterDef, preparingClassFor, preparedState, prepareProblem, prepareLevelProblem, alwaysPrepared } from "../../core/spells-known.js";
import { PREPARED_CASTERS } from "../../data/spells-known.js";


var SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];

function spellSubtitle(sp){
  return [sp.school, sp.castingTime, sp.range, sp.components, sp.duration].filter(Boolean).join(" · ");
}

/* Compact header: name + concentration/ritual tags, the patron's name
   for a learned patron spell, a Prepared pill (only for spells of a class
   that prepares: cantrips and a bard's, sorcerer's, warlock's or ranger's
   spells are always ready), edit pencil, remove. Tapping the row opens
   the spell sheet. */
function spellHeader(c, sp, idx, patron){
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

  // A domain spell that's also on the list: always ready, no switch.
  var always = alwaysPrepared(c, sp);
  if(always){
    var alwaysTag = document.createElement("span");
    alwaysTag.className = "ff-tag source-feat";
    alwaysTag.textContent = "Always prepared";
    alwaysTag.title = "From " + always.feature + " (" + always.source + "); doesn't count against your prepared spells";
    actions.appendChild(alwaysTag);
  }
  if(patron){
    var src = document.createElement("span");
    src.className = "ff-tag source-class";
    src.textContent = patron.source;
    src.title = "Patron spell, from " + patron.feature;
    actions.appendChild(src);
  }

  if(spellNeedsPreparing(c, sp)){
    var prepLbl = document.createElement("label"); prepLbl.className = "inv-eq-pill";
    var prepCb = document.createElement("input"); prepCb.type = "checkbox"; prepCb.className = "chk";
    prepCb.checked = !!sp.prepared;
    prepCb.addEventListener("click", function(e){ e.stopPropagation(); });
    prepCb.addEventListener("change", function(){
      // A preparing class can't go over its daily limit.
      var why = prepCb.checked && prepareProblem(c, sp);
      if(why){ prepCb.checked = false; showActionToast(why, true); return; }
      sp.prepared = prepCb.checked; save(); renderAll();
    });
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

function renderSpellCard(c, sp, idx, patron){
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card";
  card.appendChild(spellHeader(c, sp, idx, patron));

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
    levelField.appendChild(themedPicker({
      variant:"field", search:false,
      groups:{"":SPELL_LEVEL_LABELS.map(function(label, i){ return {value:String(i), label:label}; })},
      value:String(sp.level||0), ariaLabel:"Spell level",
      onPick:function(v){ sp.level = Number(v)||0; save(); renderAll(); }
    }));
    details.appendChild(levelField);

    var schoolField = document.createElement("div");
    schoolField.className = "field-inline spell-field";
    schoolField.innerHTML = "<label>School</label>";
    schoolField.appendChild(themedPicker({
      variant:"field", search:false,
      groups:{"": [{value:"", label:"None", muted:true}].concat(SCHOOLS.map(function(name){ return {value:name, label:name}; }))},
      value:sp.school||"", ariaLabel:"Spell school",
      onPick:function(v){ sp.school = v; save(); renderAll(); }
    }));
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
   Same tile look as the Vitals tab: ability (a themed picker styled as
   the big value), save DC, and spell attack (tap to roll). */
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
  // Classes casting with different abilities (a Cleric/Wizard) each get
  // their own save DC and spell attack.
  var byAbility = spellcastingAbilities(c);
  if(byAbility.length > 1) return renderMulticlassCasting(byAbility);
  var card = makeCard("Spellcasting");
  var pb = profBonus(c);
  var scMod = mod(c.abilities[c.spellcasting.ability]);
  var grid = ce("div","vitals-grid");

  var ab = statTile("Ability", fmtMod(scMod)+" modifier");
  ab.val.appendChild(themedPicker({
    variant:"pill", triggerClass:"sc-ability-pill", chevron:true, search:false,
    groups:{"":[{value:"int", label:"INT"}, {value:"wis", label:"WIS"}, {value:"cha", label:"CHA"}]},
    value:c.spellcasting.ability, ariaLabel:"Spellcasting ability",
    onPick:function(v){ c.spellcasting.ability = v; save(); renderAll(); }
  }));
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

function renderMulticlassCasting(byAbility){
  var card = makeCard("Spellcasting");
  byAbility.forEach(function(x){
    var label = x.classes.join(" / ") + " · " + x.ability.toUpperCase();
    var head = ce("p","sc-class-head"); head.textContent = label;
    card.appendChild(head);
    var grid = ce("div","vitals-grid sc-class-grid");
    var dc = statTile("Save DC", "8 + prof + " + x.ability.toUpperCase());
    dc.val.textContent = x.dc;
    grid.appendChild(dc.box);
    var atk = statTile("Spell attack", "Tap to roll");
    atk.val.textContent = fmtMod(x.attack);
    atk.box.classList.add("sc-roll");
    atk.box.setAttribute("role","button"); atk.box.tabIndex = 0;
    atk.box.title = "Roll a " + x.classes.join(" / ") + " spell attack";
    function roll(){ performRoll(20,1,x.attack,"none", x.classes.join(" / ") + " spell attack"); }
    atk.box.addEventListener("click", roll);
    atk.box.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); roll(); } });
    grid.appendChild(atk.box);
    card.appendChild(grid);
  });
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

/* Edit mode's stepper: changes the maximum and records the change as
   s.extra (slots from items or homebrew), which recalculating the class
   slots on a level-up keeps (applySpellSlots). */
function maxStepper(s){
  var st = ce("div","stat-stepper slot-stepper");
  var down = ce("button","stat-arrow-btn stat-arrow-down");
  down.type = "button"; down.innerHTML = makeStatArrowSvg("down");
  down.setAttribute("aria-label","Fewer slots"); down.disabled = s.max <= 0;
  down.addEventListener("click", function(){
    if(s.max <= 0) return;
    s.max--; s.extra = (Number(s.extra)||0) - 1; s.used = clamp(s.used,0,s.max); save(); renderAll();
  });
  var val = ce("span","stat-score-val"); val.textContent = s.max;
  var up = ce("button","stat-arrow-btn stat-arrow-up");
  up.type = "button"; up.innerHTML = makeStatArrowSvg("up");
  up.setAttribute("aria-label","More slots"); up.disabled = s.max >= 9;
  up.addEventListener("click", function(){
    if(s.max >= 9) return;
    s.max++; s.extra = (Number(s.extra)||0) + 1; save(); renderAll();
  });
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

/* ---- Spells from features ----
   Read-only: they come from the character's class and subclass features
   (featureSpells), so they follow level-ups and can't be removed here. */
var KIND_LABELS = { prepared: "Always prepared", known: "Always known", spellbook: "In your spellbook", ritual: "Ritual only",
  free: "Free 1/long rest", atwill: "At will" };

function isFeatureSpell(fs, sp){
  var name = (sp.name||"").trim().toLowerCase();
  return name===fs.name.toLowerCase() || name===catalogSpellName(fs.name).toLowerCase();
}
function knowsSpell(c, fs){
  return (c.spells||[]).some(function(sp){ return isFeatureSpell(fs, sp); });
}

function renderFeatureSpellCard(c, fs, canLearn){
  var d = fs.data || {};
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card feature-spell-card";
  var header = document.createElement("div");
  header.className = "inv-card-header";
  var titleGroup = document.createElement("div");
  titleGroup.className = "inv-card-title-group";
  var nameSpan = document.createElement("span");
  nameSpan.className = "inv-name-inline";
  nameSpan.textContent = fs.name;
  titleGroup.appendChild(nameSpan);
  [[d.concentration, "C", "Concentration"], [d.ritual, "R", "Ritual"]].forEach(function(t){
    if(!t[0]) return;
    var tag = document.createElement("span");
    tag.className = "inv-qty-badge";
    tag.textContent = t[1]; tag.title = t[2];
    titleGroup.appendChild(tag);
  });
  header.appendChild(titleGroup);
  var actions = document.createElement("div");
  actions.className = "inv-card-header-actions";
  // The Patron spells card already says where these come from, so a
  // patron spell only carries its Learn button.
  if(fs.kind!=="expanded"){
    var kind = document.createElement("span");
    kind.className = "ff-tag source-feat";
    kind.textContent = fs.level === 0 ? "Cantrip" : KIND_LABELS[fs.kind] || KIND_LABELS.prepared;
    var source = document.createElement("span");
    source.className = "ff-tag source-class";
    source.textContent = fs.source;
    source.title = "From " + fs.feature;
    actions.appendChild(kind);
    actions.appendChild(source);
  }
  // A patron spell isn't free: "Learn" adds it to the spells you know,
  // offered while the warlock has spells left to learn this level.
  var catalogName = catalogSpellName(fs.name);
  if(fs.kind==="expanded" && canLearn && SPELL_DATA[catalogName]){
    var learn = document.createElement("button");
    learn.type = "button";
    learn.className = "btn small";
    learn.textContent = "Learn";
    learn.title = "Add " + fs.name + " to your known spells";
    learn.addEventListener("click", function(){
      if(addCatalogSpell(c, catalogName, SPELL_DATA[catalogName])){
        c.spells[c.spells.length-1].learnedBy = fs.className;
        save();
        showActionToast("Learned " + fs.name + ".");
        renderAll();
      }
    });
    actions.appendChild(learn);
  }
  header.appendChild(actions);
  card.appendChild(header);
  var sub = spellSubtitle(d);
  if(sub){
    var subEl = document.createElement("div");
    subEl.className = "inv-card-subtitle";
    subEl.textContent = sub;
    card.appendChild(subEl);
  }
  if(d.summary){
    var summaryP = document.createElement("p");
    summaryP.className = "inv-armor-note";
    summaryP.textContent = d.summary;
    card.appendChild(summaryP);
  }
  if(fs.note){
    var noteP = document.createElement("p");
    noteP.className = "inv-armor-note feature-spell-note";
    noteP.textContent = fs.note;
    card.appendChild(noteP);
  }
  return card;
}

function renderFeatureSpellsCard(c, list, title, introText){
  var card = makeCard(title);
  var intro = document.createElement("p");
  intro.className = "feature-spells-intro";
  intro.textContent = introText;
  card.appendChild(intro);
  appendFeatureSpellGroups(c, card, list);
  return card;
}
function appendFeatureSpellGroups(c, card, list, canLearn){
  var sorted = list.slice().sort(function(a, b){ return a.level - b.level || a.name.localeCompare(b.name); });
  var currentLevel = null, group = null;
  sorted.forEach(function(fs){
    if(fs.level !== currentLevel){
      currentLevel = fs.level;
      var label = document.createElement("div");
      label.className = "spell-level-label";
      label.textContent = spellLevelLabel(fs.level);
      card.appendChild(label);
      group = document.createElement("div");
      group.className = "ff-items-list inv-items-list";
      card.appendChild(group);
    }
    group.appendChild(renderFeatureSpellCard(c, fs, canLearn));
  });
}

/* ---- Patron spells ----
   A warlock patron's expanded list. A learned one is an ordinary known
   spell (listed under Known spells with the patron's tag), so here it is
   only a checked chip; the ones still to learn get full cards with a
   Learn button. */
function renderPatronSpellsCard(c, list){
  var card = makeCard("Patron spells");
  var learned = list.filter(function(fs){ return knowsSpell(c, fs); });
  var toLearn = list.filter(function(fs){ return !knowsSpell(c, fs); });
  var count = ce("span", "patron-spell-count");
  count.textContent = learned.length + " of " + list.length + " learned";
  card.querySelector("h3").appendChild(count);
  var patron = list[0].source;
  var room = warlockSpellRoom(c);
  var intro = ce("p", "feature-spells-intro");
  intro.textContent = !toLearn.length
    ? "You know every " + patron + " spell open to you at this level. They're under Known spells with the " + patron + " tag."
    : patron + " adds these to the warlock spells you can learn. You pick them like any other warlock spell when you level up (the New spells step), and each one counts as one of your spells known." +
      (room > 0 ? " You still have " + room + " spell" + (room===1 ? "" : "s") + " to learn, so you can take " + (room===1 ? "one" : "them") + " here."
        : room===0 ? " You know all the warlock spells your level allows; swap one for a patron spell on your next level-up." : "");
  card.appendChild(intro);
  if(learned.length){
    var chips = ce("div", "patron-spell-chips");
    chips.setAttribute("aria-label", "Patron spells you know");
    learned.slice().sort(function(a, b){ return a.level - b.level || a.name.localeCompare(b.name); }).forEach(function(fs){
      var chip = ce("span", "patron-spell-chip");
      chip.textContent = "✓ " + fs.name;
      chip.title = spellLevelLabel(fs.level) + ", in your known spells";
      chips.appendChild(chip);
    });
    card.appendChild(chips);
  }
  if(toLearn.length) appendFeatureSpellGroups(c, card, toLearn, room!==0);
  return card;
}
/* Warlock spells still to learn at this level: a number, or -1 when the
   sheet's spells can't be told apart by class. */
function warlockSpellRoom(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Warlock"; });
  var def = cl && casterDef("Warlock");
  if(!def) return -1;
  var known = classKnownSpells(c, "Warlock");
  return known.certain ? Math.max(0, def.spells[Number(cl.level)||1] - known.spells.length) : -1;
}
/* The patron feature a known spell comes from, or null. */
function patronSpellFor(expanded, sp){
  return expanded.find(function(fs){ return isFeatureSpell(fs, sp); }) || null;
}

/* ---- Spell choices ----
   Features whose spells depend on a pick (Circle of the Land's land, a
   genie kind, a Divine Soul's affinity). An unmade pick shows every
   option; a made one shows its spells and a Change button. */
var changingChoice = null;

function renderSpellChoicesCard(c){
  var rows = [];
  (c.classes||[]).forEach(function(cl){
    classSpellChoices(cl).forEach(function(x){ rows.push({cl: cl, feature: x.feature, choice: x.choice, pick: x.pick}); });
  });
  if(!rows.length) return null;
  var card = makeCard("Spell choices");
  rows.forEach(function(r){
    var key = r.cl.name + ":" + r.choice.id;
    var row = ce("div", "spell-choice-row" + (r.pick ? "" : " pending"));
    var head = ce("div", "spell-choice-head");
    var label = ce("span", "spell-choice-label");
    label.textContent = r.feature + " (" + (r.cl.subclass || r.cl.name) + "): " + r.choice.label + (r.pick ? " " : "");
    head.appendChild(label);
    if(r.pick){
      var value = ce("strong", "spell-choice-value");
      value.textContent = r.pick;
      head.appendChild(value);
    }
    row.appendChild(head);
    function pick(v){
      if(!r.cl.spellChoices) r.cl.spellChoices = {};
      r.cl.spellChoices[r.choice.id] = v;
      changingChoice = null;
      save(); renderAll();
    }
    if(r.pick && changingChoice!==key){
      var spells = ce("p", "feature-spells-intro");
      spells.textContent = spellOptionText(r.choice.options[r.pick] || [], r.cl.name);
      row.appendChild(spells);
      var change = document.createElement("button");
      change.type = "button"; change.className = "btn small ghost"; change.textContent = "Change";
      change.addEventListener("click", function(){ changingChoice = key; renderAll(); });
      row.appendChild(change);
    } else {
      var hint = ce("p", "feature-spells-intro");
      hint.textContent = r.pick ? "Pick another " + r.choice.label.toLowerCase() + "." : "Choose your " + r.choice.label.toLowerCase() + " to add its spells.";
      row.appendChild(hint);
      row.appendChild(renderSpellChoiceOptions(r.choice, r.pick, pick, r.cl.name));
    }
    card.appendChild(row);
  });
  return card;
}

/* "Warlock: Spells 6 of 6 · Cantrips 3 of 3" per spellcasting class, so
   a player can see what's left to learn (or prepare) and when they're
   over. */
function renderSpellCounts(c){
  var rows = spellCounts(c);
  if(!rows.length) return null;
  var wrap = ce("div", "spell-counts");
  rows.forEach(function(r){
    var row = ce("div", "spell-count-row");
    var name = ce("span", "spell-count-class");
    name.textContent = r.className;
    row.appendChild(name);
    [["Spells known", r.spells], ["Cantrips", r.cantrips], ["Prepared today", r.prepared]].forEach(function(x){
      if(!x[1]) return;
      var pill = ce("span", "spell-count" + (x[1].have > x[1].max ? " over" : x[1].have < x[1].max ? " under" : " full"));
      pill.textContent = x[0] + " " + x[1].have + " of " + x[1].max;
      pill.title = x[1].have > x[1].max ? (x[1].have - x[1].max) + " more than your level allows"
        : x[1].have < x[1].max ? (x[1].max - x[1].have) + " left" : "All set";
      row.appendChild(pill);
    });
    wrap.appendChild(row);
  });
  return wrap;
}

/* ---- Prepare today ----
   A sheet listing each preparing class's spells with a switch each and
   the daily limit (ticking past it, or a spell too high a level, is
   blocked). Opened from the Known / prepared card and after a long rest
   on the Vitals tab (only when there's a spell to choose). */
function preparingClasses(c){
  return (c.classes||[]).filter(function(cl){ return preparedState(c, cl.name); }).map(function(cl){ return cl.name; });
}
export function openPrepareSheet(c, onlyWithChoices){
  var classes = preparingClasses(c);
  if(!classes.length) return;
  // After a long rest, only when there's a spell the player could tick.
  if(onlyWithChoices && !(c.spells||[]).some(function(sp){ return preparingClassFor(c, sp) && !prepareLevelProblem(c, sp); })) return;
  openBottomSheet(function(body, refresh, close){
    var header = ce("div", "bs-header");
    var title = ce("h3", "prep-title");
    title.textContent = "Prepare today's spells";
    header.appendChild(title);
    var closeBtn = ce("button", "bs-close");
    closeBtn.type = "button"; closeBtn.textContent = "✕"; closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", close);
    header.appendChild(closeBtn);
    body.appendChild(header);
    var lead = ce("p", "bs-subtitle");
    lead.textContent = "After a long rest you choose which spells are ready today. Cantrips are always ready.";
    body.appendChild(lead);

    var granted = featureSpells(c).filter(function(fs){ return fs.kind==="prepared" && fs.level > 0; });
    classes.forEach(function(cls){
      var st = preparedState(c, cls);
      var head = ce("div", "prep-head");
      var name = ce("b"); name.textContent = cls;
      var count = ce("span", "spell-count " + (st.have > st.max ? "over" : st.have < st.max ? "under" : "full"));
      count.textContent = st.have + " of " + st.max + " prepared";
      head.appendChild(name); head.appendChild(count);
      body.appendChild(head);
      var always = granted.filter(function(fs){ return fs.className===cls; });
      if(always.length){
        var note = ce("p", "prep-note");
        note.textContent = "Always prepared, and not counted: " + always.map(function(fs){ return fs.name; }).join(", ") + ".";
        body.appendChild(note);
      }
      var mine = (c.spells||[]).filter(function(sp){ return preparingClassFor(c, sp)===cls; })
        .sort(function(a, b){ return (a.level||0) - (b.level||0) || (a.name||"").localeCompare(b.name||""); });
      if(!mine.length){
        var none = ce("p", "prep-note");
        none.textContent = "No " + cls.toLowerCase() + " spells on your Spells tab yet.";
        body.appendChild(none);
      }
      if(mine.some(function(sp){ return prepareLevelProblem(c, sp); })){
        var later = ce("p", "prep-note");
        later.textContent = "Spells marked Not yet are too high a level for you to prepare now.";
        body.appendChild(later);
      }
      var list = ce("div", "prep-list");
      mine.forEach(function(sp){
        var row = ce("label", "prep-row" + (sp.prepared ? " on" : ""));
        var cb = document.createElement("input"); cb.type = "checkbox"; cb.className = "chk";
        cb.checked = !!sp.prepared;
        // Too high a level for the class yet, or today's limit reached.
        var why = prepareProblem(c, sp);
        cb.disabled = !!why;
        if(why){ row.classList.add("disabled"); row.title = why; }
        cb.addEventListener("change", function(){
          sp.prepared = cb.checked; save(); renderAll(); refresh();
        });
        var text = ce("span", "prep-name"); text.textContent = sp.name || "Unnamed spell";
        var lvl = ce("span", "prep-level"); lvl.textContent = spellLevelLabel(sp.level||0);
        row.appendChild(cb); row.appendChild(text); row.appendChild(lvl);
        if(prepareLevelProblem(c, sp)){
          var later = ce("span", "prep-later");
          later.textContent = "Not yet";
          row.appendChild(later);
        }
        list.appendChild(row);
      });
      body.appendChild(list);
    });

    var actions = ce("div", "prep-actions");
    var done = ce("button", "btn small primary");
    done.type = "button"; done.textContent = "Done";
    done.addEventListener("click", close);
    actions.appendChild(done);
    body.appendChild(actions);
  });
}

/* ---- Spells panel ---- */
export function renderSpellsPanel(c){
  var panel = document.createElement("div");
  // Non-casters reach this tab only through a granted spell (a Shadow
  // monk's Minor Illusion), so skip the spellcasting and slot cards.
  if(characterIsCaster(c)){
    panel.appendChild(renderSpellcastingCard(c));
    panel.appendChild(renderSlotsCard(c));
  }
  var choices = renderSpellChoicesCard(c);
  if(choices) panel.appendChild(choices);
  var all = featureSpells(c);
  var granted = all.filter(function(fs){ return fs.kind!=="expanded"; });
  var expanded = all.filter(function(fs){ return fs.kind==="expanded"; });
  if(granted.length) panel.appendChild(renderFeatureSpellsCard(c, granted, "From your features",
    "Granted by your class features, feats and invocations. They don't count against your spells known or prepared."));
  if(expanded.length) panel.appendChild(renderPatronSpellsCard(c, expanded));

  var prepares = (c.classes||[]).some(function(cl){ return PREPARED_CASTERS[cl.name]; });
  var spellCard = makeCard(prepares ? "Known / prepared spells" : "Known spells");
  if(preparingClasses(c).length){
    var prepBtn = ce("button", "btn small ghost");
    prepBtn.type = "button"; prepBtn.textContent = "Prepare today";
    prepBtn.title = "Choose today's prepared spells";
    prepBtn.addEventListener("click", function(){ openPrepareSheet(c); });
    var tools = ce("div", "slot-tools");
    tools.appendChild(prepBtn);
    spellCard.querySelector("h3").appendChild(tools);
  }
  var counts = renderSpellCounts(c);
  if(counts) spellCard.appendChild(counts);
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
      list.appendChild(renderSpellCard(c, entry.sp, entry.idx, patronSpellFor(expanded, entry.sp)));
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
