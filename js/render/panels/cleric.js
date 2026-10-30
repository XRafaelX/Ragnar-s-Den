import { save } from "../../core/state.js";
import { blessItem, forgeItems } from "../../core/helpers.js";
import { renderAll } from "../sheet.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { showActionToast } from "../../ui/toast.js";

/* ---------------- Cleric ----------------
   Divine Intervention's call and Blessing of the Forge's choice, on their
   rows on Vitals. */
export function interventionRow(c, r){
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  var lv = (c.classes||[]).find(function(x){ return x.name==="Cleric"; }).level;
  var sure = Number(lv) >= 20;
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn";
  b.innerHTML = sure ? "" : makeDiceSvg();
  b.appendChild(document.createTextNode(sure ? "Call on your deity" : "Call on your deity · d100"));
  b.disabled = r.used >= r.max;
  b.title = r.used >= r.max ? "Spent until you reset it" : sure ? "It works, no roll needed" : "It works on a " + lv + " or lower";
  b.addEventListener("click", function(){
    c.resourcesUsed[r.key] = r.used + 1;
    if(sure){
      logRoll("Divine Intervention", "Your deity answers.");
      showActionToast("Divine Intervention: your deity answers.");
      save(); renderAll();
      return;
    }
    save(); renderAll();
    performRoll(100, 1, 0, "none", "Divine Intervention (" + lv + " or lower)", {onResult: function(x){
      var ok = x.total <= Number(lv);
      if(!ok) c.interventionFailed = true;
      logRoll("Divine Intervention", ok ? "Rolled " + x.total + ": your deity answers. You can't call again for 7 days." : "Rolled " + x.total + ": no answer. You can try again after a long rest.");
      showActionToast(ok ? "Your deity answers. You can't call again for 7 days." : "No answer. You can try again after a long rest.", !ok);
      save(); renderAll();
    }});
  });
  row.appendChild(b);
  return row;
}
export function forgePicker(c, r){
  var items = forgeItems(c);
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  if(!items.length) return wrap;
  wrap.appendChild(themedPicker({key: "forge:bless", groups: {"": items.map(function(i){
    return {value: i.id, label: (i.name || "Item") + (i.type==="armor" ? ": +1 AC" : ": +1 to attack and damage")};
  })}, value: "", placeholder: "Bless an item...", ariaLabel: "Bless an item with Blessing of the Forge",
    onPick: function(id){
      var item = (c.inventory||[]).find(function(i){ return i.id===id; });
      if(!item) return;
      blessItem(c, item);
      c.resourcesUsed[r.key] = r.used + 1;
      logRoll("Blessing of the Forge", (item.name || "Item") + " is a +1 magic item until your next long rest ends.");
      save(); renderAll();
    }}));
  return wrap;
}
