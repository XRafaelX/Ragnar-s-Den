import { save } from "../../core/state.js";
import { wildShapeSpellNote, fmtMod, clamp, ce, featureSpells, characterIsCaster, classSpellChoices, spellOptionText, ordinal, plainAttackRollMode, classEntryOf } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { rollAttack } from "./sheet-rolls.js";
import { playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { SPELL_LEVEL_LABELS, spellLevelLabel, SPELL_DATA, catalogSpellName } from "../../data/spells.js";
import { openSpellPicker, addCatalogSpell } from "./spell-picker.js";
import { renderSpellChoiceOptions } from "../../ui/spell-choice.js";
import { sheetHeader } from "./inventory.js";
import { makeStatArrowSvg, STAR_SVG } from "../../ui/svg-icons.js";
import { showActionToast } from "../../ui/toast.js";
import { pipChanged, pipsRefilled } from "../../ui/fx.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { spellCounts, spellNeedsPreparing, classKnownSpells, casterDef, preparingClassFor, preparedState, prepareProblem, prepareLevelProblem, spellOwner, cantripFormulas, swapCantripFormula } from "../../core/spells-known.js";
import { classPrepares } from "../../core/spells-known.js";
import { spellScalingLine, spellRangeText, healingNote, circleSpellNote } from "../../core/spell-scaling.js";
import { spellcastingStats } from "../../core/sheet-numbers.js";


var SCHOOLS = ["Abjuration","Conjuration","Divination","Enchantment","Evocation","Illusion","Necromancy","Transmutation"];

function spellSubtitle(sp, c){
  return [sp.school, sp.castingTime, c ? spellRangeText(c, sp.name, sp.range) : sp.range, sp.components, sp.duration].filter(Boolean).join(" · ");
}

/* Card header: name + concentration/ritual badges, then the one control
   a card keeps: a Prepared switch (only for spells of a class that
   prepares: cantrips and a bard's, sorcerer's, warlock's or ranger's
   spells are always ready) or a patron spell's Learn button. Edit and
   Remove live in the details sheet, which a tap anywhere on the card
   opens. */
function spellHeader(c, name, d){
  var header = document.createElement("div");
  header.className = "inv-card-header";
  var titleGroup = document.createElement("div");
  titleGroup.className = "inv-card-title-group";
  var nameSpan = document.createElement("span");
  nameSpan.className = "inv-name-inline";
  nameSpan.textContent = name || "Unnamed spell";
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
  actions.appendChild(favStar(c, name));
  header.appendChild(actions);
  return header;
}

/* ---- Favourites ----
   A star on each card. Starred spells come first in their level (and on
   the Cantrips card), and the "★" chip shows only them. Kept by name in
   c.favSpells, so a feature's spell can be starred too. */
function favKey(name){ return (name||"").trim().toLowerCase(); }
function isFav(c, name){ return (c.favSpells||[]).indexOf(favKey(name)) >= 0; }
function favStar(c, name){
  var on = isFav(c, name);
  var b = ce("button", "spell-star" + (on ? " on" : ""));
  b.type = "button";
  b.innerHTML = STAR_SVG;
  b.title = on ? "Remove from favourites" : "Add to favourites";
  b.setAttribute("aria-label", (on ? "Remove " : "Add ") + (name || "this spell") + (on ? " from favourites" : " to favourites"));
  b.setAttribute("aria-pressed", on ? "true" : "false");
  b.addEventListener("click", function(e){
    e.stopPropagation();
    if(!Array.isArray(c.favSpells)) c.favSpells = [];
    var key = favKey(name), at = c.favSpells.indexOf(key);
    if(at >= 0) c.favSpells.splice(at, 1); else c.favSpells.push(key);
    save(); renderAll();
  });
  return b;
}

function preparedSwitch(c, sp){
  var prepLbl = document.createElement("label"); prepLbl.className = "inv-eq-pill";
  // The switch sits on a card that opens the details sheet when tapped.
  prepLbl.addEventListener("click", function(e){ e.stopPropagation(); });
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
  return prepLbl;
}

/* One quiet line saying where a spell comes from ("Oath of Vengeance ·
   Always prepared"), in place of the old header pills. */
function grantKindLabel(fs){
  return fs.level === 0 ? "Cantrip" : fs.kindLabel || KIND_LABELS[fs.kind] || KIND_LABELS.prepared;
}
function sourceLine(fs, patron){
  var p = ce("div", "spell-source");
  var name = ce("span", "spell-source-name");
  name.textContent = fs.source;
  name.title = "From " + fs.feature;
  var kind = ce("span", "spell-source-kind");
  kind.textContent = patron ? "Patron spell" : grantKindLabel(fs);
  if(!patron && fs.tip) kind.title = fs.tip;
  p.appendChild(name);
  p.appendChild(document.createTextNode(" · "));
  p.appendChild(kind);
  return p;
}

/* The "what it does at your level" lines (spellScalingLine and friends),
   shared by the card and the details sheet. */
function appendScaling(card, text){
  if(!text) return;
  var p = document.createElement("p");
  p.className = "spell-scaling";
  p.textContent = text;
  card.appendChild(p);
}

/* The whole card is the tap target for the details sheet. Taps on its
   own controls (Prepared, Learn) stop before they reach it. */
function makeCardOpen(card, name, open){
  card.classList.add("spell-card");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", (name || "Spell") + ", show details");
  card.addEventListener("click", open);
  card.addEventListener("keydown", function(e){
    if(e.target !== card) return;
    if(e.key==="Enter" || e.key===" "){ e.preventDefault(); open(); }
  });
}

/* The parts every spell card shares: header, source line, meta line,
   the summary (two lines, the rest is in the details sheet) and the
   at-your-level lines. Returns the header's actions box. */
function fillSpellCard(card, c, name, d, src, isPatron, lines, note){
  var header = spellHeader(c, name, d);
  card.appendChild(header);
  if(src) card.appendChild(sourceLine(src, isPatron));
  var sub = spellSubtitle(d, c);
  if(sub){
    var subEl = document.createElement("div");
    subEl.className = "inv-card-subtitle";
    subEl.textContent = sub;
    card.appendChild(subEl);
  }
  if(d.summary){
    var summaryP = document.createElement("p");
    summaryP.className = "inv-armor-note spell-card-summary";
    summaryP.textContent = d.summary;
    card.appendChild(summaryP);
  }
  lines.forEach(function(t){ appendScaling(card, t); });
  if(note){
    var noteP = document.createElement("p");
    noteP.className = "inv-armor-note feature-spell-note";
    noteP.textContent = note;
    card.appendChild(noteP);
  }
  return header.querySelector(".inv-card-header-actions");
}

function renderSpellCard(c, sp, idx, patron, granted){
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card" + (granted ? " feature-spell-card" : "");
  var owner = spellOwner(c, sp);
  var lines = [
    spellScalingLine(c, sp.name, sp.level||0, {pact: owner==="Warlock", owner: owner, fixed: !!sp.arcanum}),
    healingNote(c, sp.name),
    circleSpellNote(c, sp.name)
  ].filter(Boolean);
  // A spell a feature also grants (a domain spell, Fey Touched's Hex on
  // a warlock) says so, and a domain spell's Always prepared needs no
  // Prepared switch.
  var actions = fillSpellCard(card, c, sp.name, sp, granted || patron, !granted && !!patron, lines, granted && granted.note);
  if(spellNeedsPreparing(c, sp)) actions.appendChild(preparedSwitch(c, sp));
  makeCardOpen(card, sp.name, function(){
    openSpellDetails(c, {sp: sp, fs: granted, patron: !granted && patron, lines: lines});
  });
  return card;
}

/* Read-only details for a new player: the facts as tiles, what
   Concentration and Ritual mean, the whole summary, the at-your-level
   lines and where the spell comes from. A spell on the sheet adds the
   Edit and Remove buttons. Personal notes belong in the Journal. */
var CONCENTRATION_TEXT = "Concentration: the spell ends early if you cast another concentration spell, or if you take damage and fail a Constitution save (DC 10 or half the damage, whichever is higher).";
var RITUAL_TEXT = "Ritual: if your class can cast rituals, you can cast it without a spell slot by taking 10 minutes longer.";

function openSpellDetails(c, o){
  var sp = o.sp, fs = o.fs || o.patron || null;
  var d = sp || (fs && fs.data) || {};
  var name = sp ? (sp.name || "Unnamed spell") : fs.name;
  var level = sp ? (sp.level||0) : fs.level;
  var catalog = SPELL_DATA[catalogSpellName(name)] || {};
  openBottomSheet(function(body, refresh, close){
    var head = ce("div", "bs-header");
    var title = ce("div", "bs-title");
    title.textContent = name;
    head.appendChild(title);
    var closeBtn = ce("button", "bs-close");
    closeBtn.type = "button"; closeBtn.textContent = "✕"; closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", close);
    head.appendChild(closeBtn);
    body.appendChild(head);

    var kind = level===0 ? (d.school ? d.school + " cantrip" : "Cantrip")
      : ordinal(level) + "-level" + (d.school ? " " + d.school.toLowerCase() : " spell");
    var subtitle = ce("p", "bs-subtitle");
    subtitle.textContent = kind;
    body.appendChild(subtitle);

    if(fs){
      var tags = ce("div", "spell-detail-tags");
      if(o.patron){
        var pt = ce("span", "ff-tag source-class");
        pt.textContent = fs.source;
        var pk = ce("span", "ff-tag source-feat");
        pk.textContent = "Patron spell";
        tags.appendChild(pk); tags.appendChild(pt);
      } else appendGrantTags(tags, fs);
      body.appendChild(tags);
    }

    var facts = ce("div", "spell-facts");
    [["Casting time", d.castingTime], ["Range", spellRangeText(c, name, d.range)],
     ["Components", d.components], ["Duration", d.duration]].forEach(function(f){
      if(!f[1]) return;
      var tile = ce("div", "spell-fact");
      var l = ce("span"); l.textContent = f[0];
      var v = ce("b"); v.textContent = f[1];
      tile.appendChild(l); tile.appendChild(v);
      facts.appendChild(tile);
    });
    body.appendChild(facts);

    var material = d.material || catalog.material;
    var explain = [];
    if(material && /\bM\b/.test(d.components||"")) explain.push("Material: " + material + ".");
    if(d.concentration) explain.push(CONCENTRATION_TEXT);
    if(d.ritual) explain.push(RITUAL_TEXT);
    if(explain.length){
      var box = ce("div", "spell-explain");
      explain.forEach(function(t){ var p = ce("p"); p.textContent = t; box.appendChild(p); });
      body.appendChild(box);
    }

    if(d.summary){
      var text = ce("p", "spell-detail-text");
      text.textContent = d.summary;
      body.appendChild(text);
    }
    (o.lines||[]).forEach(function(t){ appendScaling(body, t); });
    var tip = fs && !o.patron && (fs.tip || (fs.kind==="prepared" && level > 0 ? "Always prepared: it doesn't count against your prepared spells." : ""));
    [fs && !o.patron && fs.note, tip].forEach(function(t){
      if(!t) return;
      var p = ce("p", "spell-detail-note");
      p.textContent = t;
      body.appendChild(p);
    });

    if(!sp) return;
    var btns = ce("div", "spell-detail-actions");
    var editBtn = ce("button", "btn small");
    editBtn.type = "button"; editBtn.textContent = "Edit spell";
    editBtn.addEventListener("click", function(){ openSpellSheet(c, sp); });
    var rmBtn = ce("button", "btn small danger");
    rmBtn.type = "button"; rmBtn.textContent = "Remove";
    // The sheet closes first: the confirm dialog sits under it.
    rmBtn.addEventListener("click", function(){
      close();
      confirmDialog("Remove "+(sp.name||"this spell")+"?", "This cannot be undone.", function(){
        var at = (c.spells||[]).indexOf(sp);
        if(at >= 0) c.spells.splice(at, 1);
        save(); renderAll(); playDelete();
      });
    });
    btns.appendChild(editBtn); btns.appendChild(rmBtn);
    body.appendChild(btns);
  });
}

/* Editable spell details in a bottom sheet; same treatment as
   weapons/armor/gear. Everything is editable so custom and homebrew
   spells (and corrections to catalog ones) are first-class. */
function openSpellSheet(c, sp){
  openBottomSheet(function(body, refresh, close){
    sheetHeader(body, sp, "Spell name", spellSubtitle(sp, c), close);

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

/* The numbers come from js/core/sheet-numbers.js (the printed sheet
   uses the same). */
function renderSpellcastingCard(c){
  // Classes casting with different abilities (a Cleric/Wizard) each get
  // their own save DC and spell attack.
  var st = spellcastingStats(c);
  if(st.multi) return renderMulticlassCasting(c, st.rows);
  var card = makeCard("Spellcasting");
  var scAbility = st.ability, scMod = st.mod;
  var grid = ce("div","vitals-grid");

  var ab = statTile("Ability", fmtMod(scMod)+" modifier");
  ab.val.appendChild(themedPicker({
    variant:"pill", triggerClass:"sc-ability-pill", chevron:true, search:false,
    groups:{"":[{value:"int", label:"INT"}, {value:"wis", label:"WIS"}, {value:"cha", label:"CHA"}]},
    value:scAbility, ariaLabel:"Spellcasting ability",
    onPick:function(v){ c.spellcasting.ability = v; save(); renderAll(); }
  }));
  grid.appendChild(ab.box);

  var dc = statTile("Save DC", st.dcHint);
  dc.val.textContent = st.dc;
  grid.appendChild(dc.box);

  var atkRoll = st.attackRoll;
  var atk = statTile("Spell attack", ["Tap to roll"].concat(st.extras, rollModeTag(atkRoll)).join(" · "));
  atk.val.textContent = fmtMod(st.attack);
  atk.box.classList.add("sc-roll");
  atk.box.setAttribute("role","button"); atk.box.tabIndex = 0;
  atk.box.title = "Roll a spell attack" + (atkRoll.reason ? " (" + atkRoll.reason + ")" : "");
  function roll(){ rollAttack(c, st.attack, atkRoll.mode, "Spell attack"); }
  atk.box.addEventListener("click", roll);
  atk.box.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); roll(); } });
  grid.appendChild(atk.box);

  card.appendChild(grid);
  return card;
}

/* "Dis" or "Adv" for a stat tile's hint, or nothing. */
function rollModeTag(roll){
  return roll.mode==="dis" ? ["Dis"] : roll.mode==="adv" ? ["Adv"] : [];
}

function renderMulticlassCasting(c, rows){
  var card = makeCard("Spellcasting");
  var atkRoll = plainAttackRollMode(c);
  rows.forEach(function(x){
    var head = ce("p","sc-class-head"); head.textContent = x.label;
    card.appendChild(head);
    var grid = ce("div","vitals-grid sc-class-grid");
    var dc = statTile("Save DC", x.dcHint);
    dc.val.textContent = x.dc;
    grid.appendChild(dc.box);
    var xRoll = x.attackRoll;
    var atk = statTile("Spell attack", ["Tap to roll"].concat(rollModeTag(xRoll)).join(" · "));
    atk.val.textContent = fmtMod(x.attack);
    atk.box.classList.add("sc-roll");
    atk.box.setAttribute("role","button"); atk.box.tabIndex = 0;
    atk.box.title = "Roll a " + x.classes.join(" / ") + " spell attack" + (atkRoll.reason ? " (" + atkRoll.reason + ")" : "");
    function roll(){ rollAttack(c, x.attack, xRoll.mode, x.classes.join(" / ") + " spell attack"); }
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

/* The row of pips for one slot level, as drawn now. */
function slotPipsRow(label){
  return document.querySelector('.slot-pips[data-slot="'+label+'"]');
}

function slotPips(total, used, label, onChange){
  var wrap = ce("div","slot-pips");
  wrap.setAttribute("data-slot", label);
  var left = total - used;
  for(var p=0; p<total; p++){
    var avail = p < left;
    var pip = document.createElement("button");
    pip.type = "button";
    pip.className = "slot-pip" + (avail ? "" : " used");
    pip.title = avail ? "Available. Tap to spend" : "Spent. Tap to restore";
    pip.setAttribute("aria-label", label+" slot "+(p+1)+(avail ? " (available)" : " (spent)"));
    pip.addEventListener("click", (function(avail){
      return function(){
        onChange(clamp(used + (avail ? 1 : -1), 0, total));
        // Spent: the last full pip empties. Got back: the first empty one fills.
        pipChanged(slotPipsRow(label), avail ? left - 1 : left, avail);
      };
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
    // Each level's spent pips fill back in turn, level after level.
    var refills = [];
    for(var i=1;i<=9;i++){
      if(sc.slots[i].max && sc.slots[i].used) refills.push([ordinal(i)+" level", sc.slots[i].max - sc.slots[i].used, sc.slots[i].max]);
      sc.slots[i].used = 0;
    }
    if(sc.pact){
      if(sc.pact.max && sc.pact.used) refills.push(["Pact", sc.pact.max - sc.pact.used, sc.pact.max]);
      sc.pact.used = 0;
    }
    save(); renderAll();
    refills.forEach(function(r, n){ pipsRefilled(slotPipsRow(r[0]), r[1], r[2], n * 150); });
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
    empty.textContent = "No spell slots. Spellcasting classes get them automatically as they level. Use Edit to add slots from items or homebrew.";
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
   (featureSpells), so they follow level-ups and can't be removed here.
   They're listed with the known spells; one already on the sheet shows
   once, as the sheet's card with the feature's tags. */
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
  // At will and as a ritual it's cast at its own level, like an
  // invocation's free cast; other warlock spells use the pact slots.
  // A race's once-a-day spell is cast at its own level (or the one it names), never with a slot.
  var fixed = fs.kind==="atwill" || fs.kind==="ritual" || (fs.kind==="free" && fs.className==="Warlock") || !!fs.limited;
  var lines = [
    spellScalingLine(c, fs.name, fs.level, {pact: fs.className==="Warlock" && !fixed, owner: fs.className, fixed: fixed, castAt: fs.castAt}),
    healingNote(c, fs.name),
    circleSpellNote(c, fs.name)
  ].filter(Boolean);
  // The Patron spells card already says where these come from, so a
  // patron spell has no source line, only its Learn button.
  var patron = fs.kind==="expanded";
  var actions = fillSpellCard(card, c, fs.name, d, patron ? null : fs, false, lines, fs.note);
  // A patron spell isn't free: "Learn" adds it to the spells you know,
  // offered while the warlock has spells left to learn this level.
  var catalogName = catalogSpellName(fs.name);
  if(patron && canLearn && SPELL_DATA[catalogName]){
    var learn = document.createElement("button");
    learn.type = "button";
    learn.className = "btn small";
    learn.textContent = "Learn";
    learn.title = "Add " + fs.name + " to your known spells";
    learn.addEventListener("click", function(e){
      e.stopPropagation();
      if(addCatalogSpell(c, catalogName, SPELL_DATA[catalogName])){
        c.spells[c.spells.length-1].learnedBy = fs.className;
        save();
        showActionToast("Learned " + fs.name + ".");
        renderAll();
      }
    });
    actions.appendChild(learn);
  }
  makeCardOpen(card, fs.name, function(){
    openSpellDetails(c, patron ? {patron: fs, lines: lines} : {fs: fs, lines: lines});
  });
  return card;
}

/* "Free 1/long rest" (or Always prepared, Cantrip...) and the source's
   name, for a spell a feature grants. */
function appendGrantTags(actions, fs){
  var kind = document.createElement("span");
  kind.className = "ff-tag source-feat";
  kind.textContent = grantKindLabel(fs);
  if(fs.tip) kind.title = fs.tip;
  else if(fs.kind==="prepared" && fs.level > 0) kind.title = "Doesn't count against your prepared spells";
  var source = document.createElement("span");
  source.className = "ff-tag source-class";
  source.textContent = fs.source;
  source.title = "From " + fs.feature;
  actions.appendChild(kind);
  actions.appendChild(source);
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
    ? "You know every " + patron + " spell open to you at this level. They're under Known spells, marked " + patron + "."
    : patron + " adds these to the warlock spells you can learn. You pick them like any other warlock spell when you level up (the New spells step), and each one counts as one of your spells known." +
      (room > 0 ? " You still have " + room + " spell" + (room===1 ? "" : "s") + " to learn, so you can take " + (room===1 ? "one" : "them") + " here."
        : room===0 ? " You know all the warlock spells your level allows. When you gain a warlock level, you can swap one for a patron spell: remove one of yours, then learn the patron spell here." : "");
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
  var cl = classEntryOf(c, "Warlock");
  var def = cl && casterDef("Warlock");
  if(!def) return -1;
  var known = classKnownSpells(c, "Warlock");
  return known.certain ? Math.max(0, def.spells[Number(cl.level)||1] - known.spells.length) : -1;
}
/* The entry in `list` (patron or granted spells) a sheet spell matches, or null. */
function featureSpellFor(list, sp){
  return list.find(function(fs){ return isFeatureSpell(fs, sp); }) || null;
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
/* The per-class counts: "cantrips" for the Cantrips card, "spells"
   (Spells known, Prepared today) for the spells card. */
function renderSpellCounts(c, which){
  var rows = spellCounts(c).filter(function(r){ return which==="cantrips" ? r.cantrips : r.spells || r.prepared; });
  if(!rows.length) return null;
  var wrap = ce("div", "spell-counts");
  rows.forEach(function(r){
    var row = ce("div", "spell-count-row");
    var name = ce("span", "spell-count-class");
    name.textContent = r.className;
    row.appendChild(name);
    (which==="cantrips" ? [["Cantrips", r.cantrips]] : [["Spells known", r.spells], ["Prepared today", r.prepared]]).forEach(function(x){
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
  // Cantrip Formulas is offered only right after a long rest.
  var formulas = onlyWithChoices ? cantripFormulas(c) : null;
  var formulaOut = "", formulaDone = "";
  if(onlyWithChoices && !formulas && !(c.spells||[]).some(function(sp){ return preparingClassFor(c, sp) && !prepareLevelProblem(c, sp); })) return;
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

    if(formulas) body.appendChild(cantripFormulasBlock());
    function cantripFormulasBlock(){
      var box = ce("div", "prep-formulas");
      var head = ce("div", "prep-head");
      var cf = cantripFormulas(c), cls = cf.className.toLowerCase();
      // (Tasha's Cantrip Formulas for a 2014 wizard; a 2024 class's own swap otherwise.)
      var w2024 = cf.className!=="Wizard" || (c.classes||[]).some(function(cl){ return cl.name==="Wizard" && cl.edition==="2024"; });
      var name = ce("b"); name.textContent = w2024 ? "Swap a cantrip" : "Cantrip Formulas";
      head.appendChild(name);
      box.appendChild(head);
      var note = ce("p", "prep-note");
      if(formulaDone){
        note.textContent = formulaDone + " Your next chance is after your next long rest.";
        box.appendChild(note);
        return box;
      }
      note.textContent = (w2024 ? "After a long rest" : "Tasha's optional features: after a long rest") + " you may replace one " + cls + " cantrip you know with another from the " + cls + " spell list. Most players keep theirs.";
      box.appendChild(note);
      var outField = ce("div", "field rt-field fp-field");
      outField.appendChild(themedPicker({
        key: "prep:formula-out", ariaLabel: "Cantrip to replace", placeholder: "Keep them all", search: false,
        groups: {"": [{value: "", label: "Keep them all", muted: true}].concat(cf.known.map(function(n){ return {value: n, label: "Replace " + n}; }))},
        value: formulaOut,
        onPick: function(v){ formulaOut = v; refresh(); }
      }));
      box.appendChild(outField);
      if(formulaOut){
        var inField = ce("div", "field rt-field fp-field");
        inField.appendChild(themedPicker({
          key: "prep:formula-in", ariaLabel: "Replacement for " + formulaOut, placeholder: "Pick " + (cls==="artificer" ? "an " : "a ") + cls + " cantrip…", search: cf.options.length > 12,
          groups: {"": cf.options.map(function(n){ return {value: n, label: n}; })}, value: "",
          onPick: function(v){
            if(!swapCantripFormula(c, formulaOut, v)) return;
            formulaDone = "You replaced " + formulaOut + " with " + v + ".";
            formulaOut = "";
            save(); renderAll(); refresh();
          }
        }));
        box.appendChild(inField);
      }
      return box;
    }

    var actions = ce("div", "prep-actions");
    var done = ce("button", "btn small primary");
    done.type = "button"; done.textContent = "Done";
    done.addEventListener("click", close);
    actions.appendChild(done);
    body.appendChild(actions);
  });
}

/* ---- Known spells list ----
   Level chips (★ favourites, All, 1st, 2nd...) narrow the list, and
   a preparing class's unprepared spells fold away under "Not prepared
   today". Both are kept per character for this session only. */
var levelFilter = {};
var showUnprepared = {};

function isUnprepared(c, entry){
  return !entry.granted && spellNeedsPreparing(c, entry.sp) && !entry.sp.prepared;
}

function renderLevelChips(c, entries, levels, filter, favCount){
  var row = ce("div", "spell-level-chips");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Show spells of one level");
  function chip(label, value, count){
    var b = ce("button", "ff-pill" + (value===filter ? " active" : ""));
    b.type = "button";
    b.setAttribute("aria-pressed", value===filter ? "true" : "false");
    b.textContent = label + " ";
    var n = ce("span", "spell-chip-count");
    n.textContent = count;
    b.appendChild(n);
    b.addEventListener("click", function(){ levelFilter[c.id] = value; renderAll(); });
    row.appendChild(b);
  }
  if(favCount){
    chip("★", "fav", favCount);
    var favChip = row.lastChild;
    favChip.classList.add("spell-fav-chip");
    favChip.title = "Favourites";
    favChip.setAttribute("aria-label", "Favourites, " + favCount);
  }
  chip("All", null, entries.length);
  levels.forEach(function(l){
    chip(ordinal(l), l, entries.filter(function(e){ return e.level===l; }).length);
  });
  // A phone can't fit every chip: the row scrolls sideways, fading at the
  // edge while more lie beyond it, with the picked chip brought into view.
  function edge(){ row.classList.toggle("fade-end", row.scrollLeft + row.clientWidth < row.scrollWidth - 2); }
  row.addEventListener("scroll", edge);
  requestAnimationFrame(function(){
    var on = row.querySelector(".active");
    if(on && on.offsetLeft + on.offsetWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - 12;
    edge();
  });
  return row;
}

/* Cards under a heading per level; slotsLeft adds "3 of 4 slots left". */
function appendLevelGroups(c, parent, entries, card, slotsLeft){
  var currentLevel = null, list = null;
  entries.forEach(function(entry){
    if(entry.level !== currentLevel){
      currentLevel = entry.level;
      var label = ce("div", "spell-level-label");
      label.textContent = spellLevelLabel(currentLevel);
      var leftTxt = slotsLeft && slotsLeftText(c, currentLevel);
      if(leftTxt){
        var leftEl = ce("span", "spell-level-slots");
        leftEl.textContent = leftTxt;
        label.appendChild(leftEl);
      }
      parent.appendChild(label);
      list = ce("div", "ff-items-list inv-items-list");
      parent.appendChild(list);
    }
    list.appendChild(card(entry));
  });
}

/* ---- Spells panel ---- */
export function renderSpellsPanel(c){
  var panel = document.createElement("div");
  // Wild Shape: no spells in beast form until Beast Spells.
  var shapeNote = wildShapeSpellNote(c);
  if(shapeNote){
    var shapeLine = ce("div", "fx-note warn spell-shape-note");
    shapeLine.textContent = shapeNote;
    panel.appendChild(shapeLine);
  }
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
  if(expanded.length) panel.appendChild(renderPatronSpellsCard(c, expanded));

  var spells = c.spells || [];
  // Granted spells not on the sheet join the lists as read-only cards.
  // idx stays the position in c.spells so removal hits the right entry.
  var extra = granted.filter(function(fs){ return !knowsSpell(c, fs); });
  var entries = spells.map(function(sp, idx){ return {sp:sp, idx:idx, level:sp.level||0, name:sp.name||""}; })
    .concat(extra.map(function(fs){ return {fs:fs, level:fs.level, name:fs.name}; }));
  entries.forEach(function(e){
    e.fav = isFav(c, e.name);
    // A feature's spell can be cast whatever the Prepared switch says.
    e.granted = !e.sp || !!featureSpellFor(granted, e.sp);
  });
  entries.sort(function(a, b){ return a.level - b.level || (b.fav - a.fav) || a.name.localeCompare(b.name); });
  function card(entry){
    return entry.fs ? renderFeatureSpellCard(c, entry.fs)
      : renderSpellCard(c, entry.sp, entry.idx, featureSpellFor(expanded, entry.sp), featureSpellFor(granted, entry.sp));
  }
  // Cantrips get their own card: cast at will, no slots, never prepared.
  var cantrips = entries.filter(function(e){ return e.level===0; });
  var leveled = entries.filter(function(e){ return e.level > 0; });
  var cantripCounts = renderSpellCounts(c, "cantrips");
  var levelCounts = renderSpellCounts(c, "spells");
  var showSpells = characterIsCaster(c) || leveled.length || !cantrips.length;

  var addSpellBtn = document.createElement("button");
  addSpellBtn.className = "btn small primary"; addSpellBtn.style.marginTop = "12px";
  addSpellBtn.textContent = "+ Add Spell";
  addSpellBtn.addEventListener("click", function(){ openSpellPicker(c); });

  if(cantrips.length || cantripCounts){
    var cantripCard = makeCard("Cantrips");
    if(cantripCounts) cantripCard.appendChild(cantripCounts);
    if(cantrips.length){
      var cList = ce("div", "ff-items-list inv-items-list spell-cantrip-list");
      cantrips.forEach(function(e){ cList.appendChild(card(e)); });
      cantripCard.appendChild(cList);
    } else {
      var noCantrips = ce("p", "spell-list-empty");
      noCantrips.textContent = "No cantrips yet.";
      cantripCard.appendChild(noCantrips);
    }
    if(!showSpells) cantripCard.appendChild(addSpellBtn);
    panel.appendChild(cantripCard);
  }
  if(!showSpells) return panel;

  var prepares = (c.classes||[]).some(function(cl){ return classPrepares(c, cl.name); });
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
  if(levelCounts) spellCard.appendChild(levelCounts);
  if(!leveled.length){
    var empty = ce("p", "spell-list-empty");
    empty.textContent = "No spells yet.";
    spellCard.appendChild(empty);
  } else {
    var levels = [];
    leveled.forEach(function(e){ if(levels.indexOf(e.level) < 0) levels.push(e.level); });
    var favCount = leveled.filter(function(e){ return e.fav; }).length;
    var filter = levelFilter[c.id];
    if(filter==="fav" ? !favCount : levels.indexOf(filter) < 0) filter = null;
    if(levels.length > 1 || favCount) spellCard.appendChild(renderLevelChips(c, leveled, levels, filter, favCount));
    var shown = filter==null ? leveled
      : leveled.filter(function(e){ return filter==="fav" ? e.fav : e.level===filter; });
    // A spell of a preparing class that isn't prepared today folds away
    // at the end: the list is what can be cast now.
    var ready = shown.filter(function(e){ return !isUnprepared(c, e); });
    var later = shown.filter(function(e){ return isUnprepared(c, e); });
    if(ready.length) appendLevelGroups(c, spellCard, ready, card, true);
    else {
      var none = ce("p", "spell-list-empty");
      none.textContent = filter==null ? "No spells prepared today."
        : filter==="fav" ? "None of your favourites are prepared today."
        : "None of your " + spellLevelLabel(filter).toLowerCase() + " spells are prepared today.";
      spellCard.appendChild(none);
    }
    if(later.length){
      var open = !!showUnprepared[c.id];
      var fold = ce("button", "spell-fold" + (open ? " open" : ""));
      fold.type = "button";
      fold.setAttribute("aria-expanded", open ? "true" : "false");
      fold.innerHTML = "<span class='spell-fold-chev' aria-hidden='true'>›</span>";
      fold.appendChild(document.createTextNode("Not prepared today (" + later.length + ")"));
      fold.addEventListener("click", function(){ showUnprepared[c.id] = !open; renderAll(); });
      spellCard.appendChild(fold);
      if(open){
        var box = ce("div", "spell-fold-body");
        appendLevelGroups(c, box, later, card, false);
        spellCard.appendChild(box);
      }
    }
  }
  spellCard.appendChild(addSpellBtn);
  panel.appendChild(spellCard);

  return panel;
}
