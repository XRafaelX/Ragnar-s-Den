/* ---- A feat's Spell Change (Features tab) ----
   Magic Initiate (2024): "Whenever you gain a new level, you can replace
   one of the spells you chose for this feat with a different spell of the
   same level from the chosen spell list." The level-up no longer asks
   (2026-11-16): the feat's sheet has "Change spells", which opens this
   bottom sheet. Pick the spell to replace, then its replacement. */
import { save } from "../../core/state.js";
import { ce, spellHeldBy } from "../../core/helpers.js";
import { SPELL_DATA } from "../../data/spells.js";
import { spellChangeOptions } from "../../core/feat-picks.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd } from "../../ui/sound.js";
import { renderAll } from "../sheet.js";

function levelText(n){
  var lv = (SPELL_DATA[n] || {}).level;
  return lv===0 ? " (cantrip)" : lv ? " (level " + lv + ")" : "";
}

export function openFeatSpellChangeSheet(c, feat){
  var state = {index: "", to: ""};
  openBottomSheet(function(body, refresh, close){
    var spells = (feat.picks && feat.picks.spells) || [];
    var list = (feat.picks && feat.picks.option) || feat.lockedOption || "";
    var header = ce("div", "bs-header");
    var title = ce("div", "bs-title");
    title.textContent = "Change " + feat.name + " spells";
    header.appendChild(title);
    var x = ce("button", "bs-close");
    x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
    x.addEventListener("click", close);
    header.appendChild(x);
    body.appendChild(header);
    var lead = ce("p", "bs-subtitle");
    lead.textContent = "Each time you gain a level, you can replace one of these with another of the same level" + (list ? " from the " + list.toLowerCase() + " list" : "") + ".";
    body.appendChild(lead);

    var out = ce("div", "field fp-field");
    out.appendChild(themedPicker({
      key: "fsc:out:" + feat.id, ariaLabel: "Spell to replace", placeholder: "Choose the spell to replace", search: false, value: state.index,
      groups: {"": spells.map(function(n, i){ return n ? {value: String(i), label: "Replace " + n + levelText(n)} : null; }).filter(Boolean)},
      onPick: function(v){ state.index = v; state.to = ""; refresh(); }
    }));
    body.appendChild(out);
    if(state.index!==""){
      // A cantrip the character already has elsewhere gives nothing twice.
      var own = "from " + feat.name; // (its own spells don't count)
      var opts = spellChangeOptions(feat, Number(state.index));
      var into = ce("div", "field fp-field");
      into.appendChild(themedPicker({
        key: "fsc:in:" + feat.id, ariaLabel: "New spell", placeholder: "Choose the new spell", search: opts.length > 12, sheet: opts.length > 12,
        groups: {"": opts.map(function(n){ return {value: n, label: n}; })}, value: state.to,
        reasonFor: function(n){
          if((SPELL_DATA[n] || {}).level!==0) return "";
          var has = spellHeldBy(c, n);
          return has && has!==own ? has : "";
        },
        detailFor: function(n){ return (SPELL_DATA[n] || {}).summary || ""; },
        onPick: function(v){ state.to = v; refresh(); }
      }));
      body.appendChild(into);
    }
    var actions = ce("div", "prep-actions");
    var cancel = ce("button", "btn small ghost");
    cancel.type = "button"; cancel.textContent = "Cancel";
    cancel.addEventListener("click", close);
    var go = ce("button", "btn small primary");
    go.type = "button"; go.textContent = "Save";
    go.disabled = state.index==="" || !state.to;
    go.addEventListener("click", function(){
      var i = Number(state.index), from = spells[i];
      if(!from || !state.to) return;
      feat.picks.spells[i] = state.to;
      save(); close(); renderAll(); playAdd();
      showActionToast("Replaced " + from + " with " + state.to + ".");
    });
    actions.appendChild(cancel); actions.appendChild(go);
    body.appendChild(actions);
  });
}
