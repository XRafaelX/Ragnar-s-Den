import { ce, escapeHtml } from "../core/helpers.js";
import { INVOCATIONS, PACT_BOONS, INVOCATION_SOURCES } from "../data/invocations.js";
import { SPELL_DATA } from "../data/spells.js";
import { invocationReason, invocationPrereqText, pickOptions } from "../core/invocations.js";
import { themedPicker } from "./themed-picker.js";

/* ---------------- Invocation and Pact Boon pickers ----------------
   Shared by the level-up dialog and the sheet's Eldritch invocations card
   (js/render/panels/invocations.js). */

/* The four Pact Boons as tappable cards; onPick(name). */
export function renderPactBoonOptions(value, onPick){
  var box = ce("div", "eli-boons");
  PACT_BOONS.forEach(function(b){
    var row = ce("div", "wiz-equip-option eli-boon" + (value===b.name ? " selected" : ""));
    row.setAttribute("role", "button");
    row.tabIndex = 0;
    row.setAttribute("aria-pressed", value===b.name ? "true" : "false");
    row.innerHTML = "<div><strong>" + escapeHtml(b.name) + "</strong><div class='eli-boon-sum'>" + escapeHtml(b.summary) + "</div>" +
      (value===b.name ? "<div class='eli-boon-text'>" + escapeHtml(b.text) + "</div>" : "") + "</div>";
    row.addEventListener("click", function(){ onPick(b.name); });
    row.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); onPick(b.name); } });
    box.appendChild(row);
  });
  return box;
}

/* One invocation dropdown (grouped by book; the ones whose prerequisite
   isn't met are greyed out with the reason) and, under it, what the
   picked one does. ctx: invocationContext(); taken: names picked in the
   other dropdowns, greyed out as "picked". */
export function renderInvocationPicker(opts){
  var wrap = ce("div", "eli-pick");
  var groups = {};
  Object.keys(INVOCATION_SOURCES).forEach(function(src){
    groups[INVOCATION_SOURCES[src]] = INVOCATIONS.filter(function(i){ return i.source===src; }).map(function(i){ return i.name; });
  });
  var field = ce("div", "field inf-field eli-field");
  field.appendChild(themedPicker({
    key: opts.key, ariaLabel: opts.ariaLabel || "Eldritch invocation", placeholder: opts.placeholder || "Pick an invocation…",
    groups: groups, value: opts.value || "", search: true, sheet: true,
    reasonFor: function(v){
      if(v!==opts.value && (opts.taken||[]).indexOf(v)!==-1) return "picked";
      var inv = INVOCATIONS.find(function(i){ return i.name===v; });
      return inv ? invocationReason(inv, opts.ctx) : "";
    },
    onPick: opts.onPick
  }));
  wrap.appendChild(field);
  var inv = INVOCATIONS.find(function(i){ return i.name===opts.value; });
  if(inv) wrap.appendChild(invocationPreview(inv));
  return wrap;
}
export function invocationPreview(inv){
  var box = ce("div", "inf-preview eli-preview");
  var prereq = invocationPrereqText(inv);
  box.innerHTML = (prereq ? "<div class='inf-goes'><span>Requires</span> " + escapeHtml(prereq) + "</div>" : "") +
    "<div class='inf-text'>" + escapeHtml(inv.text) + "</div>";
  return box;
}

/* Pickers for a spellPick ({count, level, ritual, label}): the Tome's
   cantrips, Book of Ancient Secrets' rituals. Changes `values` in place
   and calls onChange() after each pick. */
export function renderSpellPickPickers(pick, values, key, onChange){
  var box = ce("div", "eli-spell-picks");
  var options = pickOptions(pick);
  for(var i = 0; i < pick.count; i++) (function(i){
    var field = ce("div", "field inf-field eli-field");
    field.appendChild(themedPicker({
      key: key + ":" + i, ariaLabel: pick.label + " " + (i + 1), placeholder: "Choose a spell", search: true,
      groups: {"": options}, value: values[i] || "", sheet: true,
      detailFor: function(v){ return SPELL_DATA[v] ? SPELL_DATA[v].summary || "" : ""; },
      reasonFor: function(v){ return v!==values[i] && values.indexOf(v)!==-1 ? "picked" : ""; },
      onPick: function(v){ values[i] = v; onChange(); }
    }));
    box.appendChild(field);
    if(values[i] && SPELL_DATA[values[i]]){
      var note = ce("p", "fp-spell-note");
      note.innerHTML = "<b>" + escapeHtml(values[i]) + ":</b> " + escapeHtml(SPELL_DATA[values[i]].summary || "");
      box.appendChild(note);
    }
  })(i);
  return box;
}
