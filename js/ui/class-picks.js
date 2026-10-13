import { ABILITIES } from "../data/abilities-skills.js";
import { ce } from "../core/helpers.js";
import { themedPicker } from "./themed-picker.js";
import { openInfoModal } from "./info-modal.js";
import { slotOptions, slotLabel, slotIsFixed, fillSlots, grantFixedLines, grantEntry, classPickContext, classPicksProblem,
  applyClassPicks, markClassPicksManual } from "../core/class-picks.js";

/* ---------------- Class picks UI ----------------
   The choices block for a feature's proficiencies (see
   js/core/class-picks.js), shared by the level-up dialog, the creation
   wizard and the picks modal on the Features tab. It changes `slots` in
   place and calls onChange() after each pick so the caller can re-render
   and re-check. Options the character already has are greyed out with
   the reason; a slot with nothing to choose says what it adds. */
function abilityName(k){ var a = ABILITIES.find(function(x){ return x[0]===k; }); return a ? a[1] : k; }
function shown(slot, v){ return slot.kind==="save" ? abilityName(v) + " saving throws" : v; }

export function renderClassPicks(grant, slots, ctx, onChange, keyPrefix){
  var def = grant.def, box = ce("div", "fp-box");
  grantFixedLines(def).forEach(function(line){ box.appendChild(note(line)); });
  if(def.help) box.appendChild(note(def.help));
  fillSlots(def, slots, ctx);
  (def.pick||[]).forEach(function(slot, i){
    var opts = slotOptions(def, slots, i, ctx), n = slot.count || 1;
    box.appendChild(label(slotLabel(def, slots, i, ctx)));
    if(slotIsFixed(def, slots, i, ctx)){
      box.appendChild(note(slots[i].length ? "Added for you: " + slots[i].map(function(v){ return shown(slot, v); }).join(", ") + "."
        : "You already have everything this offers, so there's nothing to pick."));
      return;
    }
    var groups = {};
    opts.forEach(function(o){ (groups[o.group] = groups[o.group] || []).push(slot.kind==="save" ? {value: o.value, label: abilityName(o.value)} : o.value); });
    for(var p = 0; p < n; p++) (function(p){
      box.appendChild(field(themedPicker({
        key: keyPrefix + ":" + i + ":" + p, ariaLabel: grant.name + " choice " + (p + 1), placeholder: placeholder(slot),
        groups: groups, value: slots[i][p] || "", search: opts.length > 12,
        reasonFor: function(v){
          if(v!==slots[i][p] && slots[i].indexOf(v)!==-1) return "picked";
          return (opts.find(function(o){ return o.value===v; }) || {}).reason || "";
        },
        onPick: function(v){ slots[i][p] = v; onChange(); }
      })));
    })(p);
  });
  return box;
}
function placeholder(slot){
  return {skill: "Choose a skill", expertise: slot.tools ? "Choose a skill or tool" : "Choose a skill", tool: "Choose a tool", language: "Choose a language",
    save: "Choose a saving throw", weapon: "Choose a weapon", skillOrLanguage: "Choose a skill or language"}[slot.kind];
}
function note(text){ var n = ce("p", "fp-spell-note"); n.textContent = text; return n; }
function label(text){ var l = ce("div", "fp-label"); l.textContent = text; return l; }
function field(el){ var f = ce("div", "field rt-field fp-field"); f.appendChild(el); return f; }

/* Make (or change) a feature's picks on the sheet: for a character from
   before the sheet asked for them, a subclass picked by hand, or a
   mistake. "I've already added it" marks it done without changing
   anything, for players who ticked the skills themselves. onDone() runs
   after either. */
export function openClassPicksModal(c, cl, grant, onDone){
  var entry = grantEntry(cl, grant.key);
  var slots = entry && entry.slots ? entry.slots.map(function(s){ return s.slice(); }) : [];
  var ctx = classPickContext(c, cl, grant.key);
  openInfoModal(grant.name, function(body){
    var lead = ce("p", "fp-lead");
    lead.textContent = "Choose what " + grant.name + " gives " + (c.name || "your character") + ". The sheet applies it for you.";
    body.appendChild(lead);
    var holder = ce("div");
    body.appendChild(holder);
    var problem = ce("p", "fp-problem");
    body.appendChild(problem);
    var row = ce("div", "cmp-give-row fp-modal-row");
    var apply = document.createElement("button");
    apply.type = "button"; apply.className = "btn primary"; apply.textContent = "Apply";
    row.appendChild(apply);
    // Only before the first pick: after that there is something to change.
    if(!entry || entry.manual){
      var manual = document.createElement("button");
      manual.type = "button"; manual.className = "btn ghost"; manual.textContent = "I've already added it";
      manual.title = "Mark it done without changing the sheet";
      manual.addEventListener("click", function(){ markClassPicksManual(cl, grant.key); close(); onDone(); });
      row.insertBefore(manual, apply);
    }
    body.appendChild(row);
    function draw(){
      holder.innerHTML = "";
      holder.appendChild(renderClassPicks(grant, slots, ctx, draw, "cp:" + grant.key));
      var why = classPicksProblem(grant, slots, ctx);
      apply.disabled = !!why;
      problem.textContent = why;
    }
    function close(){ document.getElementById("info-modal-close").click(); }
    apply.addEventListener("click", function(){ applyClassPicks(c, cl, grant, slots); close(); onDone(); });
    draw();
  });
}
