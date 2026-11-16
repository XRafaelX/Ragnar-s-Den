import { save } from "../../core/state.js";
import { blessItem, forgeItems, interventionSpells, interventionWish } from "../../core/helpers.js";
import { SPELL_DATA, spellLevelLabel } from "../../data/spells.js";
import { renderAll } from "../sheet.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { showActionToast } from "../../ui/toast.js";

/* ---------------- Cleric ----------------
   Divine Intervention's call and Blessing of the Forge's choice, on their
   rows on Vitals. */
export function interventionRow(c, r){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Cleric"; });
  if(cl && cl.edition==="2024") return interventionRow2024(c, r, Number(cl.level)||1);
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

/* The 2024 cleric's Divine Intervention (p. 71): it always works. Pick the
   cleric spell to cast without a slot, or Wish from level 20 (Greater
   Divine Intervention), which keeps it away for 2d4 long rests. */
function interventionRow2024(c, r, lv){
  var wait = (c.restWait||{})[r.key];
  if(wait || r.used >= r.max){
    var row = document.createElement("div");
    row.className = "inv-roll-actions fx-rolls";
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn"; b.disabled = true;
    b.textContent = wait ? "Back in " + wait + (wait===1 ? " long rest" : " long rests") : "Used until your next long rest";
    row.appendChild(b);
    return row;
  }
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  var groups = {};
  if(lv >= 20) groups["Greater Divine Intervention"] = [{value: "Wish", label: "Wish (then 2d4 long rests before the next use)"}];
  var spells = interventionSpells();
  Object.keys(spells).forEach(function(k){ groups[spellLevelLabel(Number(k))] = spells[k]; });
  wrap.appendChild(themedPicker({key: "cleric:intervention", groups: groups, value: "", placeholder: "Cast a spell...", ariaLabel: "Cast a cleric spell with Divine Intervention", search: true, sheet: true,
    detailFor: function(n){ return n==="Wish" ? "Duplicate any spell of level 8 or lower, or one of Wish's other effects" : (SPELL_DATA[n] || {}).summary || ""; },
    onPick: function(n){
      if(n==="Wish"){
        var rests = interventionWish(c);
        if(!rests) return;
        logRoll("Divine Intervention", "You cast Wish. Divine Intervention comes back after " + rests + (rests===1 ? " long rest." : " long rests."));
        showActionToast("Wish cast. Divine Intervention comes back after " + rests + (rests===1 ? " long rest." : " long rests."));
      } else {
        c.resourcesUsed[r.key] = r.used + 1;
        logRoll("Divine Intervention", "You cast " + n + " without a spell slot or material components.");
        showActionToast("Divine Intervention: " + n + " cast without a spell slot.");
      }
      save(); renderAll();
    }}));
  return wrap;
}
