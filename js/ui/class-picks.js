import { ABILITIES } from "../data/abilities-skills.js";
import { SPELL_DATA } from "../data/spells.js";
import { ce } from "../core/helpers.js";
import { themedPicker } from "./themed-picker.js";
import { openInfoModal } from "./info-modal.js";
import { slotOptions, slotLabel, slotIsFixed, fillSlots, grantFixedLines, grantEntry, classPickContext, classPicksProblem,
  applyClassPicks, markClassPicksManual } from "../core/class-picks.js";

/* ---------------- Class picks UI ----------------
   The choices block for a feature's proficiencies and spells (see
   js/core/class-picks.js), shared by the level-up dialog, the creation
   wizard and the picks modal on the Features tab. It changes `slots` in
   place and calls onChange(meta) after each pick so the caller can
   re-render and re-check; meta.typing is true while the player types a
   choice of their own (don't re-render then: it would steal focus). Options the character already has are greyed out with
   the reason; a slot with nothing to choose says what it adds. */
var NONE = "(none)"; // the list entry that empties an optional slot
function abilityName(k){ var a = ABILITIES.find(function(x){ return x[0]===k; }); return a ? a[1] : k; }
function shown(slot, v){ return slot.kind==="save" ? abilityName(v) + " saving throws" : v; }

export function renderClassPicks(grant, slots, ctx, onChange, keyPrefix, opts){
  var def = grant.def, box = ce("div", "fp-box");
  grantFixedLines(def).forEach(function(line){ box.appendChild(note(line)); });
  // (Left out under a replacement choice, whose card already says it.)
  if(def.help && !(opts && opts.noHelp)) box.appendChild(note(def.help));
  fillSlots(def, slots, ctx);
  (def.pick||[]).forEach(function(slot, i){
    var opts = slotOptions(def, slots, i, ctx), n = slot.count || 1;
    box.appendChild(label(slotLabel(def, slots, i, ctx)));
    if(slotIsFixed(def, slots, i, ctx)){
      box.appendChild(note(slots[i].length ? "Added for you: " + slots[i].map(function(v){ return shown(slot, v); }).join(", ") + "."
        : slot.from==="spellbook" ? "You have no spells of that level on the Spells tab yet. Add them there, then choose here from the Feature choices card on the Features & Feats tab."
        : "You already have everything this offers, so there's nothing to pick."));
      return;
    }
    var isSpell = slot.kind==="spell", details = slot.kind==="choice" && slot.details;
    var groups = {};
    // A slot that may stay empty shows its placeholder until something is
    // picked, and leads its list with a way back to nothing.
    if(slot.optional) groups[""] = [{value: NONE, label: slot.none || "None", muted: true}];
    opts.forEach(function(o){
      if(o.custom) return; // typed in: the picker's own text box holds it
      (groups[o.group] = groups[o.group] || []).push(slot.kind==="save" ? {value: o.value, label: abilityName(o.value)} : o.value);
    });
    for(var p = 0; p < n; p++) (function(p){
      var f = field(themedPicker({
        key: keyPrefix + ":" + i + ":" + p, ariaLabel: grant.name + " choice " + (p + 1), placeholder: placeholder(slot) + (slot.optional ? " (optional)" : ""),
        groups: groups, value: slots[i][p] || "", search: opts.length > 12,
        // Spells open as a sheet on phones, each with what it does.
        sheet: isSpell, detailFor: isSpell ? function(v){ return (SPELL_DATA[v] || {}).summary || ""; } : details ? function(v){ return details[v] || ""; } : undefined,
        // A favored enemy can be two humanoid races of the player's own.
        homebrew: slot.custom ? {noun: slot.noun} : undefined,
        reasonFor: function(v){
          if(v!==slots[i][p] && slots[i].indexOf(v)!==-1) return "picked";
          return (opts.find(function(o){ return o.value===v; }) || {}).reason || "";
        },
        onPick: function(v, meta){
          if(v && v!==NONE) slots[i][p] = v; else slots[i].splice(p, 1);
          onChange(meta && meta.typing ? {typing: true} : undefined);
        }
      }));
      if(slot.optional) f.classList.add("fp-optional");
      box.appendChild(f);
      if(isSpell && slots[i][p] && SPELL_DATA[slots[i][p]]) box.appendChild(spellNote(slots[i][p]));
      if(details && details[slots[i][p]]) box.appendChild(note(slots[i][p] + ": " + details[slots[i][p]]));
    })(p);
  });
  return box;
}
/* A class feature and the Tasha's feature that can take its place
   ("Favored Enemy" and "Favored Foe"), as cards. The feature's own card
   is always there, so the step reads the same with Tasha's switch off or
   on; the Tasha's card sits folded away under it and slides open when
   `show` is true (`from`: whether it was showing before this redraw, so
   the fold animates both ways). `base` is the class's own feature ({name,
   text, profs}), described by its picks' help line when it has one;
   onPick(true) takes the variant. */
export function renderVariantOptions(variant, base, active, onPick, show, from){
  var box = ce("div", "cpk-variant");
  function option(isVariant, name, source, text){
    var chosen = active===isVariant, pickable = show;
    var row = ce("div", "wiz-equip-option cpk-variant-option" + (chosen ? " selected" : "") + (pickable ? "" : " cpk-variant-only"));
    if(pickable){
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      row.setAttribute("aria-pressed", chosen ? "true" : "false");
      row.addEventListener("click", function(){ onPick(isVariant); });
      row.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); onPick(isVariant); } });
    }
    var inner = ce("div");
    var title = document.createElement("strong");
    title.textContent = name;
    var src = ce("span", "cpk-variant-source");
    src.textContent = " · " + source;
    var body = ce("div", "cpk-variant-text");
    body.textContent = text;
    inner.appendChild(title); inner.appendChild(src); inner.appendChild(body);
    row.appendChild(inner);
    return row;
  }
  box.appendChild(option(false, variant.replaces, "Player's Handbook", (base && ((base.profs && base.profs.help) || base.text)) || ""));
  var alt = ce("div", "cpk-variant-alt");
  alt.appendChild(option(true, variant.name, "Tasha's Cauldron of Everything", variant.blurb));
  var was = from==null ? show : from;
  if(was) alt.classList.add("open");
  if(!show) alt.setAttribute("aria-hidden", "true");
  // Drawn as it was, then moved to how it is, so the fold is animated.
  if(was!==show) requestAnimationFrame(function(){ alt.classList.toggle("open", show); });
  box.appendChild(alt);
  return box;
}
function placeholder(slot){
  return {skill: "Choose a skill", expertise: slot.tools ? "Choose a skill or tool" : "Choose a skill", tool: "Choose a tool", language: "Choose a language",
    save: "Choose a saving throw", weapon: "Choose a weapon", skillOrLanguage: "Choose a skill or language",
    spell: slot.level===0 ? "Choose a cantrip" : "Choose a spell",
    choice: "Choose " + (/^[aeiou]/.test(slot.noun || "") ? "an " : "a ") + slot.noun}[slot.kind];
}
function note(text){ var n = ce("p", "fp-spell-note"); n.textContent = text; return n; }
function spellNote(name){
  var n = ce("p", "fp-spell-note");
  var b = document.createElement("b");
  b.textContent = name + ": ";
  n.appendChild(b);
  n.appendChild(document.createTextNode(SPELL_DATA[name].summary || ""));
  return n;
}
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
    function draw(meta){
      if(!(meta && meta.typing)){
        holder.innerHTML = "";
        holder.appendChild(renderClassPicks(grant, slots, ctx, draw, "cp:" + grant.key));
      }
      var why = classPicksProblem(grant, slots, ctx);
      apply.disabled = !!why;
      problem.textContent = why;
    }
    function close(){ document.getElementById("info-modal-close").click(); }
    apply.addEventListener("click", function(){ applyClassPicks(c, cl, grant, slots); close(); onDone(); });
    draw();
  });
}
