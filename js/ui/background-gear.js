/* The background's starting equipment, as the creation wizard's Equipment
   step and the Inventory tab's one-time card show it: what comes in the
   kit, then a picker for each choice it asks for (a trinket is rolled,
   with "Roll again", or chosen from its table). Picks start filled, so
   nothing blocks; see js/core/background-gear.js. */
import { ce, escapeHtml } from "../core/helpers.js";
import { themedPicker } from "./themed-picker.js";
import { kitSlots, kitItems, fillKitPicks, coinsText, rollTrinket, trinketTable } from "../core/background-gear.js";

/* picks: the object the choices are kept in (changed in place); ctx:
   {toolPicks}; keyPrefix: themedPicker keys; onChange(): redraw. */
export function renderKitPicker(background, picks, ctx, keyPrefix, onChange){
  var box = ce("div", "bgk-box");
  fillKitPicks(background, picks, ctx);
  var res = kitItems(background, picks, ctx);
  var list = ce("p", "bgk-items");
  list.textContent = res.items.map(function(i){ return (i.qty > 1 ? i.qty + " × " : "") + i.name; }).join(", ") +
    (coinsText(res.coins) ? ", and " + coinsText(res.coins) : "") + ".";
  box.appendChild(list);
  res.notes.forEach(function(t){ var p = ce("p", "bgk-note"); p.textContent = t; box.appendChild(p); });
  kitSlots(background, picks).forEach(function(s){
    var row = ce("div", "bgk-slot");
    var label = ce("p", "lu-choice-title");
    label.textContent = s.label;
    row.appendChild(label);
    var field = ce("div", "field fp-field bgk-field");
    var table = s.kind === "trinket" && trinketTable(s.table);
    field.appendChild(themedPicker({
      key: keyPrefix + ":" + s.key, ariaLabel: s.label, placeholder: "Choose…", search: s.options.length > 12, sheet: s.options.length > 12,
      groups: {"": s.options}, value: picks[s.key],
      onPick: function(v){ picks[s.key] = v; onChange(); }
    }));
    row.appendChild(field);
    if(table){
      var again = ce("button", "btn small ghost bgk-roll");
      again.type = "button";
      again.textContent = "Roll again";
      again.title = "Roll a d100 on the " + table.label + " table (" + table.source + ")";
      again.addEventListener("click", function(){ picks[s.key] = String(rollTrinket(s.table)); onChange(); });
      row.appendChild(again);
    }
    box.appendChild(row);
  });
  return box;
}
export function kitIntroHtml(background){
  var article = /^[AEIOU]/.test(background) ? "an " : "a ";
  return "<b>From your background:</b> what " + article + escapeHtml(background) + " starts with. It goes in your pack, and the coins in your purse.";
}
