import { save } from "../../core/state.js";
import { escapeHtml } from "../../core/helpers.js";
import { invocationDef, pactBoonDef, INVOCATION_SOURCES } from "../../data/invocations.js";
import {
  warlockEntry, knownInvocations, invocationsDue, invocationContext, invocationReason, invocationBroken,
  learnInvocation, forgetInvocation, eldritchBlastSummary, customInvocationFeatures, adoptCustomInvocations
} from "../../core/invocations.js";
import { makeCard, renderAll } from "../sheet.js";
import { renderPactBoonOptions, renderInvocationPicker, renderSpellPickPickers } from "../../ui/invocation-picks.js";
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

  if(level < 2){
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

  if(level >= 3) card.appendChild(pactSection(c, cl));

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
    box.appendChild(hint(boon ? "Pick your new Pact Boon." : "At warlock level 3 your patron grants you a Pact Boon. Pick one; some invocations need a particular pact."));
    box.appendChild(renderPactBoonOptions(cl.pactBoon || "", function(name){
      if(name!==cl.pactBoon) cl.pactSpells = [];
      cl.pactBoon = name;
      changingBoon = false;
      save(); renderAll(); playAdd();
    }));
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
      entry.appendChild(pendingPicks(boon.spellPick, "pact", function(values){ cl.pactSpells = values; }));
    }
  }
  var tags = effectTags(boon);
  if(tags.length) entry.appendChild(tagRow(tags));
  box.appendChild(entry);
  return box;
}

/* Spells to choose for a pending entry: pickers, then Save once full. */
function pendingPicks(pick, draftKey, onSave){
  var wrap = document.createElement("div");
  wrap.className = "eli-pending";
  var draft = pickDrafts[draftKey] = pickDrafts[draftKey] || [];
  var lead = hint("Choose " + pick.count + " " + pick.label + ":");
  lead.classList.add("inf-note");
  wrap.appendChild(lead);
  wrap.appendChild(renderSpellPickPickers(pick, draft, "eli:" + draftKey, function(){ renderAll(); }));
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
  var entry = document.createElement("div");
  entry.className = "inf-entry is-on eli-entry";
  entry.appendChild(entryHead(e.name, "Remove", function(){
    confirmDialog("Remove " + e.name + "?", "Normally you only swap invocations when you level up. Remove it to fix a mistake, then learn the right one below.", function(){
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
    if((e.spells||[]).length >= inv.spellPick.count) entry.appendChild(tagRow(["Rituals: " + e.spells.join(", ")]));
    else entry.appendChild(pendingPicks(inv.spellPick, e.id, function(values){ e.spells = values; }));
  }
  var tags = effectTags(inv);
  if(tags.length) entry.appendChild(tagRow(tags));
  var broken = invocationBroken(c, cl, e);
  if(broken){
    var warn = hint(broken + ". It stays on your sheet; check with your DM.");
    warn.classList.add("inf-warn");
    entry.appendChild(warn);
  }
  return entry;
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
    "<div class='eli-blast-sub'>" + escapeHtml(b.beams>1 ? "Make a separate spell attack for each beam." : "One spell attack; more beams at levels 5, 11 and 17.") +
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
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Learn";
  btn.disabled = !picked;
  btn.addEventListener("click", function(){
    if(!picked) return;
    learnInvocation(c, cl, picked.name, []);
    showActionToast("Learned " + picked.name + "." + (picked.spellPick ? " Choose its spells on its card." : ""));
    learnPick = "";
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  return wrap;
}

function meter(label, count, max, sub){
  var box = document.createElement("div");
  box.className = "inf-meter"+(count>max ? " over" : "");
  var top = document.createElement("div");
  top.className = "inf-meter-top";
  top.innerHTML = "<span class='inf-meter-lbl'>"+escapeHtml(label)+"</span><span class='inf-meter-val'><b>"+count+"</b> of "+max+"</span>";
  box.appendChild(top);
  var pips = document.createElement("div");
  pips.className = "inf-pips";
  for(var i=0;i<Math.max(count, max);i++){
    var pip = document.createElement("span");
    pip.className = "inf-pip"+(i<count ? " full" : "");
    pips.appendChild(pip);
  }
  box.appendChild(pips);
  var s = document.createElement("div");
  s.className = "inf-meter-sub";
  s.textContent = sub;
  box.appendChild(s);
  return box;
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
function sectionTitle(t){
  var p = document.createElement("p");
  p.className = "inf-section";
  p.textContent = t;
  return p;
}
function hint(t){
  var p = document.createElement("p");
  p.className = "inf-hint";
  p.textContent = t;
  return p;
}
