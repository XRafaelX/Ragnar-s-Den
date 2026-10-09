import { ce, escapeHtml } from "../core/helpers.js";
import { SPELL_DATA } from "../data/spells.js";
import { optionSetDef } from "../data/class-options.js";
import { styleDef, stylePickChoices, availableStyleNames, tashaOnlyStyles, styleReason } from "../core/fighting-styles.js";
import { themedPicker } from "./themed-picker.js";

/* ---------------- Fighting style pickers ----------------
   Shared by the creation wizard's Class Features step and the level-up's
   Fighting style step. */

/* The style options as tappable cards: owned ones greyed out, Tasha's
   optional ones left out unless the character uses them (a note says so).
   onPick(name). */
export function renderStyleOptions(c, options, value, tasha, onPick){
  var box = ce("div", "fs-options");
  options.forEach(function(name){
    var why = styleReason(c, name, tasha);
    if(why==="Tasha's optional") return;
    var def = styleDef(name) || {text: ""};
    var row = ce("div", "wiz-equip-option fs-option" + (value===name ? " selected" : "") + (why ? " disabled" : ""));
    row.setAttribute("role", "button");
    row.tabIndex = why ? -1 : 0;
    row.setAttribute("aria-pressed", value===name ? "true" : "false");
    row.innerHTML = "<div><strong>" + escapeHtml(name) + "</strong><div class='lu-sub-blurb'>" + escapeHtml(def.text) + "</div>" +
      (why==="known" ? "<div class='lu-sub-feats'>You already have this style.</div>" : "") + "</div>";
    if(!why){
      row.addEventListener("click", function(){ onPick(name); });
      row.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); onPick(name); } });
    }
    box.appendChild(row);
  });
  var more = tashaOnlyStyles(c, options, tasha);
  if(more){
    var note = ce("p", "eli-hidden-note");
    note.textContent = "Tasha's Cauldron adds " + more + " more fighting style" + (more>1 ? "s" : "") + " if your character uses Tasha's optional class features.";
    box.appendChild(note);
  }
  return box;
}

/* The picked style's own picks, when it has any (Superior Technique's
   maneuver, Blessed or Druidic Warrior's cantrips). Changes `picks` in
   place and calls onChange(). known: option names already known. */
export function renderStylePicks(name, picks, tasha, known, onChange, keyBase){
  var def = styleDef(name);
  var box = ce("div", "fs-picks");
  if(!def || !(def.optionPick || def.spellPick)) return box;
  var choices = stylePickChoices(name, tasha).filter(function(n){ return (known||[]).indexOf(n)===-1; });
  if(def.optionPick){
    var set = optionSetDef(def.optionPick.set);
    if(!picks.options) picks.options = [];
    box.appendChild(label(name + ": choose " + (def.optionPick.count===1 ? "a " + set.noun : def.optionPick.count + " " + set.noun + "s")));
    for(var i=0;i<def.optionPick.count;i++) (function(i){
      box.appendChild(field(themedPicker({
        key: keyBase + ":opt:" + i, ariaLabel: name + " " + set.noun + " " + (i+1), placeholder: "Choose a " + set.noun,
        groups: {"": choices}, value: picks.options[i] || "", search: true, sheet: true,
        detailFor: function(v){ var o = set.options.find(function(x){ return x.name===v; }); return o ? o.text : ""; },
        reasonFor: function(v){ return v!==picks.options[i] && picks.options.indexOf(v)!==-1 ? "picked" : ""; },
        onPick: function(v){ picks.options[i] = v; onChange(); }
      })));
    })(i);
  }
  if(def.spellPick){
    var sp = def.spellPick;
    if(!picks.spells) picks.spells = [];
    box.appendChild(label(name + ": choose " + sp.count + " " + sp.list.toLowerCase() + " cantrips"));
    for(var j=0;j<sp.count;j++) (function(j){
      box.appendChild(field(themedPicker({
        key: keyBase + ":spell:" + j, ariaLabel: name + " cantrip " + (j+1), placeholder: "Choose a cantrip",
        groups: {"": choices}, value: picks.spells[j] || "", search: true, sheet: true,
        detailFor: function(v){ return SPELL_DATA[v] ? SPELL_DATA[v].summary || "" : ""; },
        reasonFor: function(v){ return v!==picks.spells[j] && picks.spells.indexOf(v)!==-1 ? "picked" : ""; },
        onPick: function(v){ picks.spells[j] = v; onChange(); }
      })));
    })(j);
  }
  return box;
}
function label(text){ var l = ce("div", "fp-label"); l.textContent = text; return l; }
function field(el){ var f = ce("div", "field rt-field fp-field"); f.appendChild(el); return f; }
export { availableStyleNames };
