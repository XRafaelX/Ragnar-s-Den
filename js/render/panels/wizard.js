import { save } from "../../core/state.js";
import { clamp, maxHp, ordinal, arcaneRecoveryBudget, overchannelDice, wardUp, restoreWard, portentCount, rollPortent, usePortent, grimHarvest, powerSurgeDamage, STONE_BENEFITS, stoneBenefit, consumeStone, recoverableSlots, spendResource } from "../../core/helpers.js";
import { renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeDiceSvg, makeDicesSvg } from "../../ui/svg-icons.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { slotRecoveryRow } from "./druid.js";

/* ---------------- Wizard ----------------
   What the schools add to Class resources: Arcane Recovery, Overchannel,
   Arcane Ward, Portent, Grim Harvest, Power Surge, the transmuter's stone,
   Convergent Future and Violent Attraction. */
function buttonRow(){
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  return row;
}
function rowBtn(text, title, onClick, icon){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn";
  if(icon) b.innerHTML = icon;
  b.appendChild(document.createTextNode(text));
  if(title) b.title = title;
  b.addEventListener("click", onClick);
  return b;
}
function picker(opts){
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker(opts));
  return wrap;
}
export function wizardResourceRow(c, r){
  if(r.key==="Wizard:arcane_recovery") return slotRecoveryRow(c, r, arcaneRecoveryBudget(c));
  if(r.key==="Wizard:overchannel_free") return overchannelPicker(c, r);
  if(r.key==="Wizard:arcane_ward") return wardRow(c, r);
  if(r.key==="Wizard:portent") return portentRow(c);
  if(r.key==="Wizard:expert_divination") return expertDivinationPicker(c);
  if(r.key==="Wizard:grim_harvest") return grimHarvestPicker(c);
  if(r.key==="Wizard:power_surges") return surgeRow(c, r);
  if(r.key==="Wizard:transmuters_stone") return stonePicker(c);
  if(r.key==="Wizard:master_transmuter") return masterPicker(c, r);
  if(r.key==="Wizard:convergent_future") return convergentRow(c);
  if(r.key==="Wizard:violent_attraction") return attractionRow(c, r);
  return null;
}
/* The first is free. After that the spell's level sets the dice. */
function overchannelPicker(c, r){
  var items = [1, 2, 3, 4, 5].map(function(l){
    var dice = overchannelDice(c, l);
    return {value: String(l), label: ordinal(l) + "-level spell: " + (dice ? dice + "d12 necrotic to you" : "free")};
  });
  return picker({key: "overchannel", groups: {"": items}, value: "", placeholder: "Overchannel a spell...", ariaLabel: "Overchannel: the spell's level",
    onPick: function(v){
      var l = Number(v), dice = overchannelDice(c, l);
      if(!dice && r.used < r.max) spendResource(c, r.key, 1);
      c.overchannels = (Number(c.overchannels)||0) + 1;
      logRoll("Overchannel", "Maximum damage on a " + ordinal(l) + "-level spell.");
      save(); renderAll();
      if(dice) performRoll(12, dice, 0, "none", "Overchannel: necrotic to you, ignoring resistance and immunity");
    }});
}
function wardRow(c, r){
  var box = document.createElement("div");
  if(!wardUp(c)){
    var row = buttonRow();
    row.appendChild(rowBtn("Create the ward", "When you cast an abjuration spell of 1st level or higher. It lasts until a long rest.", function(){
      c.arcaneWard = true;
      if(c.resourcesUsed) delete c.resourcesUsed[r.key];
      logRoll("Arcane Ward", "The ward is up with " + r.max + " hit points.");
      save(); renderAll();
    }));
    box.appendChild(row);
    return box;
  }
  var items = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function(l){ return {value: String(l), label: ordinal(l) + "-level abjuration spell: +" + 2 * l}; });
  box.appendChild(picker({key: "ward-restore", groups: {"": items}, value: "", placeholder: "Cast an abjuration spell...", ariaLabel: "Arcane Ward: the abjuration spell's level",
    onPick: function(v){
      restoreWard(c, Number(v));
      logRoll("Arcane Ward", "The ward regained " + 2 * Number(v) + " hit points.");
      save(); renderAll();
    }}));
  return box;
}
function portentRow(c){
  var row = buttonRow();
  if(!c.portent){
    row.appendChild(rowBtn("Roll your dice", "After a long rest", function(){
      rollPortent(c);
      logRoll("Portent", "Rolled " + c.portent.join(", ") + ".");
      save(); renderAll();
    }, makeDiceSvg()));
    return row;
  }
  c.portent.forEach(function(n, i){
    row.appendChild(rowBtn("Use a " + n, "Replace an attack roll, save or check by you or a creature you can see, before it's rolled. One per turn.", function(){
      var used = usePortent(c, i);
      logRoll("Portent", "A roll becomes " + used + ".");
      showActionToast("Portent: the roll is a " + used + ".");
      save(); renderAll();
    }));
  });
  return c.portent.length ? row : null;
}
function expertDivinationPicker(c){
  var slots = recoverableSlots(c);
  if(!slots.length) return null;
  var items = slots.map(function(s){ return {value: String(s.level), label: "Get back a " + ordinal(s.level) + "-level slot"}; });
  return picker({key: "expert-divination", groups: {"": items}, value: "", placeholder: "After a divination spell...", ariaLabel: "Expert Divination: slot to regain",
    onPick: function(v){
      c.spellcasting.slots[v].used -= 1;
      logRoll("Expert Divination", "Got back a " + ordinal(Number(v)) + "-level spell slot.");
      save(); renderAll();
    }});
}
function grimHarvestPicker(c){
  var groups = {"Any school": [], "Necromancy": []};
  for(var l = 1; l <= 9; l++){
    groups["Any school"].push({value: "a" + l, label: ordinal(l) + "-level spell: " + grimHarvest(l, false) + " HP"});
    groups["Necromancy"].push({value: "n" + l, label: ordinal(l) + "-level spell: " + grimHarvest(l, true) + " HP"});
  }
  return picker({key: "grim-harvest", groups: groups, value: "", placeholder: "You killed with a spell...", ariaLabel: "Grim Harvest: the spell", sheet: true,
    onPick: function(v){
      var heal = grimHarvest(Number(v.slice(1)), v.charAt(0)==="n");
      c.hp.current = clamp((Number(c.hp.current)||0) + heal, 0, maxHp(c));
      logRoll("Grim Harvest", "Regained " + heal + " HP.");
      save(); renderSidebar(); renderAll();
    }});
}
function surgeRow(c, r){
  var row = buttonRow(), dmg = powerSurgeDamage(c);
  var b = rowBtn("+" + dmg + " force", "Once per turn, when you deal damage with a wizard spell", function(){
    if(!spendResource(c, r.key, 1)) return;
    logRoll("Power Surge", "+" + dmg + " force damage.");
    save(); renderAll();
  });
  b.disabled = r.used >= r.max;
  row.appendChild(b);
  return row;
}
function stonePicker(c){
  if(c.stoneGone){
    var gone = document.createElement("div");
    gone.className = "fx-now";
    gone.textContent = "Consumed. You can make a new one after a long rest.";
    return gone;
  }
  var groups = {"The benefit": ["Darkvision", "Speed", "CON saves"], "Resistance": STONE_BENEFITS.slice(3), "": [{value: "", label: "Not carrying it", muted: true}]};
  return picker({key: "transmuter-stone", groups: groups, value: stoneBenefit(c), placeholder: "Choose its benefit...", ariaLabel: "Transmuter's Stone: its benefit",
    onPick: function(v){
      if(v) c.stoneBenefit = v; else delete c.stoneBenefit;
      logRoll("Transmuter's Stone", v ? "Benefit: " + v + "." : "You aren't carrying it.");
      save(); renderAll();
    }});
}
function masterPicker(c, r){
  if(r.used >= r.max) return null;
  var items = ["Major Transformation", "Panacea", "Restore Life", "Restore Youth"];
  return picker({key: "master-transmuter", groups: {"": items}, value: "", placeholder: "Consume the stone...", ariaLabel: "Master Transmuter: the effect",
    reasonFor: function(){ return c.stoneBenefit ? "" : "Needs your stone"; },
    onPick: function(v){
      if(!c.stoneBenefit || !spendResource(c, r.key, 1)) return;
      consumeStone(c);
      logRoll("Master Transmuter", v + ". The stone is gone until you make another after a long rest.");
      save(); renderAll();
      if(v==="Restore Youth") performRoll(10, 3, 0, "none", "Restore Youth: years younger (minimum 13)");
    }});
}
function convergentRow(c){
  var row = buttonRow();
  row.appendChild(rowBtn("Use it · 1 exhaustion", "Reaction: the d20 becomes the lowest number that succeeds, or one less. Only a long rest removes this exhaustion.", function(){
    c.exhaustion = Math.min(6, (Number(c.exhaustion)||0) + 1);
    logRoll("Convergent Future", "A roll's result is decided. 1 level of exhaustion.");
    save(); renderSidebar(); renderAll();
  }));
  return row;
}
function attractionRow(c, r){
  var row = buttonRow();
  [[1, "On a hit 1d10"], [2, "On a fall 2d10"]].forEach(function(x){
    var b = rowBtn(x[1], "Reaction, within 60 ft", function(){
      if(!spendResource(c, r.key, 1)) return;
      save(); renderAll();
      performRoll(10, x[0], 0, "none", "Violent Attraction");
    }, makeDicesSvg());
    b.disabled = r.used >= r.max;
    row.appendChild(b);
  });
  return row;
}
