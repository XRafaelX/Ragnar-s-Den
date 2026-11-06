import { save } from "../../core/state.js";
import { escapeHtml, spellHeldBy } from "../../core/helpers.js";
import { invocationDef, pactBoonDef, INVOCATION_SOURCES, invocationLabel } from "../../data/invocations.js";
import {
  warlockEntry, knownInvocations, invocationsDue, invocationContext, invocationReason, invocationBroken,
  learnInvocation, forgetInvocation, eldritchBlastSummary, customInvocationFeatures, adoptCustomInvocations,
  resolveSpellPick, lessonsFeatChoices, lessonsFeat, addLessonsFeat
} from "../../core/invocations.js";
import { featDef, featHasPicks, featNeedsChoice, applyFeatPicks, emptyPicks } from "../../core/feat-picks.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { makeCard, renderAll } from "../sheet.js";
import { meter, sectionTitle, hint } from "../../ui/card-parts.js";
import { renderPactBoonOptions, renderInvocationPicker, renderSpellPickPickers, renderHiddenNotes } from "../../ui/invocation-picks.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd, playDelete } from "../../ui/sound.js";

/* ---- Eldritch invocations (Features tab, any Warlock) ----
   The Pact Boon (warlock 3) and the invocations the warlock knows, each
   with what the sheet does with it, plus a form to learn one while the
   warlock knows fewer than the level allows. New ones normally come
   through the level-up dialog; this card is for catching up an older
   sheet and fixing mistakes. Data lives on the class entry (see
   js/core/invocations.js). */

// Form state survives the re-render each pick triggers.
var learnPick = "";
var changingBoon = false;
var pickDrafts = {}; // id -> spells being picked for a pending entry

export function renderInvocationsCard(c){
  var cl = warlockEntry(c);
  if(!cl) return null;
  var level = Number(cl.level)||1;
  var card = makeCard("Eldritch invocations");
  card.classList.add("inf-card", "eli-card");
  card.appendChild(hint("Invocations are lasting gifts from your patron: a spell you can cast at will, a stronger Eldritch Blast, a new sense. You learn more as you level up, and the sheet applies what each one does."));

  // (A 2024 warlock knows one from level 1.)
  if(level < 2 && cl.edition!=="2024"){
    var soon = hint("You learn your first two invocations at warlock level 2. The level-up will ask you to pick them.");
    soon.classList.add("inf-note");
    card.appendChild(soon);
    return card;
  }

  var known = knownInvocations(cl);
  var due = invocationsDue(cl);
  var meters = document.createElement("div");
  meters.className = "inf-meters eli-meters";
  meters.appendChild(meter("Invocations known", known.length, due,
    known.length>due ? "More than your level allows" : known.length<due ? (due-known.length)+" left to learn" : "All learned"));
  card.appendChild(meters);

  // (The 2024 pacts are invocations.)
  if(level >= 3 && cl.edition!=="2024") card.appendChild(pactSection(c, cl));

  var blast = eldritchBlastSummary(c);
  if(blast) card.appendChild(blastBox(blast));

  var olds = customInvocationFeatures(c);
  if(olds.length) card.appendChild(adoptBox(c, cl, olds));

  card.appendChild(sectionTitle("Your invocations"));
  if(!known.length) card.appendChild(hint("You don't know any invocations yet. Learn one below."));
  known.forEach(function(e){ card.appendChild(invocationEntry(c, cl, e)); });

  if(known.length < due){
    card.appendChild(sectionTitle("Learn an invocation"));
    card.appendChild(learnForm(c, cl));
  } else {
    card.appendChild(hint("You know as many invocations as your level allows. Each time you gain a warlock level, the level-up lets you swap one for another."));
  }
  return card;
}

function pactSection(c, cl){
  var box = document.createElement("div");
  box.appendChild(sectionTitle("Pact Boon"));
  var boon = pactBoonDef(cl.pactBoon);
  if(!boon || changingBoon){
    box.appendChild(hint(boon ? "Pick your new Pact Boon." : "At warlock level 3 your patron grants you a Pact Boon. Pick one. Some invocations need a particular pact."));
    box.appendChild(renderPactBoonOptions(cl.pactBoon || "", function(name){
      if(name!==cl.pactBoon) cl.pactSpells = [];
      cl.pactBoon = name;
      changingBoon = false;
      save(); renderAll(); playAdd();
    }, !!c.tashaOptional));
    if(boon){
      var cancel = document.createElement("button");
      cancel.className = "btn small ghost"; cancel.textContent = "Keep " + boon.name;
      cancel.addEventListener("click", function(){ changingBoon = false; renderAll(); });
      box.appendChild(cancel);
    }
    return box;
  }
  var entry = document.createElement("div");
  entry.className = "inf-entry is-on eli-entry";
  entry.appendChild(entryHead(boon.name, "Change", function(){
    confirmDialog("Change your Pact Boon?", "A Pact Boon is normally for good. Change it only to fix a mistake. Invocations that need your current pact will show a warning.", function(){
      changingBoon = true; renderAll();
    });
  }));
  entry.appendChild(text(boon.text));
  if(boon.spellPick){
    var picks = cl.pactSpells || [];
    if(picks.length >= boon.spellPick.count){
      entry.appendChild(tagRow(["Spells tab: " + picks.join(", ")]));
    } else {
      entry.appendChild(pendingPicks(c, boon.spellPick, "pact", function(values){ cl.pactSpells = values; }));
    }
  }
  var tags = effectTags(boon);
  if(tags.length) entry.appendChild(tagRow(tags));
  box.appendChild(entry);
  return box;
}

/* Spells to choose for a pending entry: pickers, then Save once full.
   Spells the character already has are greyed out. */
function pendingPicks(c, pick, draftKey, onSave){
  var held = function(name){ return spellHeldBy(c, name); };
  var wrap = document.createElement("div");
  wrap.className = "eli-pending";
  var draft = pickDrafts[draftKey] = pickDrafts[draftKey] || [];
  var lead = hint("Choose " + pick.count + " " + pick.label + ":");
  lead.classList.add("inf-note");
  wrap.appendChild(lead);
  wrap.appendChild(renderSpellPickPickers(pick, draft, "eli:" + draftKey, function(){ renderAll(); }, held));
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Save";
  var full = draft.filter(Boolean).length===pick.count && new Set(draft.filter(Boolean)).size===pick.count;
  btn.disabled = !full;
  btn.addEventListener("click", function(){
    onSave(draft.filter(Boolean));
    delete pickDrafts[draftKey];
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  return wrap;
}

function invocationEntry(c, cl, e){
  var inv = invocationDef(e.name) || {name:e.name, text:"", source:""};
  var label = invocationLabel(e.name);
  var entry = document.createElement("div");
  entry.className = "inf-entry is-on eli-entry";
  entry.appendChild(entryHead(label, "Remove", function(){
    confirmDialog("Remove " + label + "?", "Normally you only swap invocations when you level up. Remove it to fix a mistake, then learn the right one below.", function(){
      forgetInvocation(c, cl, e.id);
      save(); renderAll(); playDelete();
    });
  }));
  if(inv.source){
    var src = document.createElement("div");
    src.className = "inf-goes";
    src.innerHTML = "<span>From</span> " + escapeHtml(INVOCATION_SOURCES[inv.source] || inv.source);
    entry.appendChild(src);
  }
  entry.appendChild(text(inv.text));
  if(inv.spellPick){
    // (A 2024 cantrip pick names one the warlock knows; the 2024 Tome holds cantrips and rituals.)
    var pick = inv.spellPick.known ? resolveSpellPick(inv.spellPick, invocationContext(c, cl), inv.name) : inv.spellPick;
    var tagLead = inv.spellPick.known ? "For " : inv.spellPick.parts ? "Book of Shadows: " : "Rituals: ";
    if((e.spells||[]).length >= inv.spellPick.count) entry.appendChild(tagRow([tagLead + e.spells.join(", ")]));
    else entry.appendChild(pendingPicks(c, pick, e.id, function(values){ e.spells = values; }));
  }
  if(inv.featPick) entry.appendChild(lessonsFeatBox(c, cl, e));
  var tags = effectTags(inv);
  if(tags.length) entry.appendChild(tagRow(tags));
  var broken = invocationBroken(c, cl, e);
  if(broken){
    var warn = hint(broken + ". It stays on your sheet. Check with your DM.");
    warn.classList.add("inf-warn");
    entry.appendChild(warn);
  }
  return entry;
}

/* Lessons of the First Ones: its Origin feat, picked here (it then sits
   with your feats, and its own choices open as for any feat). */
function lessonsFeatBox(c, cl, e){
  var feat = lessonsFeat(c, e);
  if(feat) return tagRow(["Feat: " + feat.name + " (Features tab)"]);
  var wrap = document.createElement("div");
  wrap.className = "eli-pending";
  var lead = hint("Choose its Origin feat:");
  lead.classList.add("inf-note");
  wrap.appendChild(lead);
  var field = document.createElement("div");
  field.className = "field inf-field eli-field";
  field.appendChild(themedPicker({
    key: "eli:lessons:" + e.id, ariaLabel: "Origin feat", placeholder: "Choose an Origin feat", search: false, sheet: true,
    groups: {"": lessonsFeatChoices(c, cl).map(function(n){ return {value: n, label: n + ": " + (featDef(n).summary || "")}; })},
    onPick: function(name){
      var def = featDef(name), copy = addLessonsFeat(c, e, name);
      if(!copy) return;
      if(featHasPicks(def) && !featNeedsChoice(def)) applyFeatPicks(c, copy, emptyPicks(def));
      save(); renderAll(); playAdd();
      // (Loaded when needed: the feat dialog builds its page parts on load.)
      if(featNeedsChoice(def)) import("../../ui/feat-picks.js").then(function(m){ m.openFeatPicksModal(c, copy, function(){ save(); renderAll(); }); });
    }
  }));
  wrap.appendChild(field);
  return wrap;
}

/* Short tags for what the sheet does with it, so it's clear where to look. */
function effectTags(def){
  var tags = [];
  (def.spells||[]).forEach(function(s){
    tags.push(s.name + (s.kind==="atwill" ? " at will" : s.kind==="known" ? "" : " 1/long rest") + " (Spells tab)");
  });
  if(def.uses) tags.push((def.uses.name || def.name) + " uses on Vitals");
  if(def.skills) tags.push(def.skills.join(" and ") + " proficiency");
  if(def.speeds) tags.push("Swim speed added");
  if(def.sight) tags.push("Added to your senses");
  if(def.blast) tags.push("In your Eldritch Blast above");
  return tags;
}

function blastBox(b){
  var box = document.createElement("div");
  box.className = "eli-blast";
  var dmg = b.dice + (b.bonus ? (b.bonus > 0 ? " + " : " - ") + Math.abs(b.bonus) : "") + " force";
  var parts = [b.beams + " beam" + (b.beams>1 ? "s" : ""), dmg + (b.beams>1 ? " each" : ""), b.range + " ft"].concat(b.riders);
  box.innerHTML = "<div class='eli-blast-name'>Your Eldritch Blast</div><div class='eli-blast-line'>" + escapeHtml(parts.join(" · ")) + "</div>" +
    "<div class='eli-blast-sub'>" + escapeHtml(b.beams>1 ? "Make a separate spell attack for each beam." : "One spell attack, with more beams at levels 5, 11 and 17.") +
    (b.by.length ? " Includes " + escapeHtml(b.by.join(", ")) + "." : "") + "</div>";
  return box;
}

function adoptBox(c, cl, olds){
  var box = document.createElement("div");
  box.className = "eli-adopt";
  box.appendChild(hint("Found on your Features tab as custom features: " + olds.map(function(f){ return f.name; }).join(", ") + ". Move them here so the sheet applies them?"));
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Move them here";
  btn.addEventListener("click", function(){
    var moved = adoptCustomInvocations(c, cl);
    save(); renderAll(); playAdd();
    showActionToast(moved.length ? "Moved " + moved.join(", ") + "." : "Removed the duplicate custom features.");
  });
  box.appendChild(btn);
  return box;
}

function learnForm(c, cl){
  var wrap = document.createElement("div");
  wrap.className = "inf-form inf-learn eli-learn";
  var ctx = invocationContext(c, cl);
  var picked = learnPick && invocationDef(learnPick);
  if(picked && invocationReason(picked, ctx)){ learnPick = ""; picked = null; }
  wrap.appendChild(renderInvocationPicker({
    key: "eli:learn", ctx: ctx, value: learnPick, ariaLabel: "Invocation to learn",
    onPick: function(v){ learnPick = v; renderAll(); }
  }));
  var hiddenNote = renderHiddenNotes(ctx);
  if(hiddenNote) wrap.appendChild(hiddenNote);
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Learn";
  btn.disabled = !picked;
  btn.addEventListener("click", function(){
    if(!picked) return;
    learnInvocation(c, cl, picked.name, []);
    showActionToast("Learned " + invocationLabel(picked.name) + "." + (picked.spellPick && picked.spellPick.known ? " Choose its cantrip on its card." : picked.spellPick ? " Choose its spells on its card." : picked.featPick ? " Choose its feat on its card." : ""));
    learnPick = "";
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  return wrap;
}

function entryHead(title, actionLabel, onAction){
  var head = document.createElement("div");
  head.className = "inf-entry-head";
  var t = document.createElement("span");
  t.className = "inf-entry-title";
  t.textContent = title;
  head.appendChild(t);
  var b = document.createElement("button");
  b.className = "btn small ghost inf-forget";
  b.textContent = actionLabel;
  b.setAttribute("aria-label", actionLabel + " " + title);
  b.addEventListener("click", onAction);
  head.appendChild(b);
  return head;
}
function tagRow(tags){
  var row = document.createElement("div");
  row.className = "eli-tags";
  tags.forEach(function(t){
    var s = document.createElement("span");
    s.className = "inf-tag";
    s.textContent = t;
    row.appendChild(s);
  });
  return row;
}
function text(t){
  var d = document.createElement("div");
  d.className = "inf-text";
  d.textContent = t;
  return d;
}
