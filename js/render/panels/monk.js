/* ---------------- Monk on the Vitals tab ----------------
   What the Ki (Focus) row offers under its name: everything ki can pay
   for in one list, and Tasha's Quickened Healing. */
import { save } from "../../core/state.js";
import { kiActions, kiActionProblem, payKiAction, kiWord, quickenedHealing, clamp, maxHp, fmtMod } from "../../core/helpers.js";
import { renderAll } from "../sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { showActionToast } from "../../ui/toast.js";
import { rollAttack } from "./sheet-rolls.js";

export function monkResourceRow(c, r, ctx){
  if(r.key!=="Monk:ki") return null;
  var out = [kiPicker(c)];
  var qh = quickenedHealing(c);
  if(qh) out.push(quickenedHealingRow(c, r, ctx.remaining, qh));
  return out;
}

/* "Spend ki on...": what the monk's ki can pay for. Picking one pays for
   it and rolls its dice, if it has any. */
function kiPicker(c){
  var actions = kiActions(c), groups = {"": []};
  var word = kiWord(c);
  function cost(a){ return a.useKey && a.freeUse ? "1 use" : a.cost ? a.cost + " " + word : "Free"; }
  actions.forEach(function(a){
    var g = a.group || "";
    if(!groups[g]) groups[g] = [];
    groups[g].push({value: a.id, label: a.name + " · " + cost(a)});
  });
  function find(id){ return actions.find(function(a){ return a.id===id; }); }
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "ki:spend", groups: groups, value: "", placeholder: "Spend " + word + " on...", ariaLabel: "Spend " + word + " on", sheet: true,
    reasonFor: function(id){ return kiActionProblem(c, find(id)); },
    detailFor: function(id){ return find(id).detail; },
    onPick: function(id){
      var a = find(id), paid = cost(a);
      if(!payKiAction(c, a)) return;
      var name = (a.group ? a.group + ": " : "") + a.name;
      if(a.log) logRoll(name, a.log + " (" + paid + ")");
      save(); renderAll();
      if(a.sharpen) showActionToast(a.sharpen.name + " sharpened: +" + a.sharpen.bonus + " to attack and damage for 1 minute.");
      // A roll that gives temporary hit points (Heightened Focus): the
      // higher of what you have and the roll, as they don't stack.
      if(a.roll && a.roll.temp) performRoll(a.roll.die, a.roll.qty, a.roll.bonus, "none", a.roll.label, {onResult: function(r){
        if(r.total > (Number(c.hp.temp)||0)){ c.hp.temp = r.total; save(); renderAll(); }
      }});
      else if(a.roll) performRoll(a.roll.die, a.roll.qty, a.roll.bonus, "none", a.roll.label);
      // (A caught missile thrown back: an attack, its damage offered on a hit.)
      else if(a.attack) rollAttack(c, a.attack.bonus, "none", a.attack.hit.label + ": Attack", Object.assign({}, a.attack.hit));
    }}));
  return wrap;
}

/* Quickened Healing (Tasha's, monk 4): 2 ki for a Martial Arts die
   plus the proficiency bonus of healing. */
function quickenedHealingRow(c, r, remaining, qh){
  var heals = document.createElement("div");
  heals.className = "inv-roll-actions fx-rolls";
  var healBtn = document.createElement("button");
  healBtn.type = "button"; healBtn.className = "btn small inv-roll-btn res-roll-btn";
  healBtn.innerHTML = makeDiceSvg();
  healBtn.appendChild(document.createTextNode("Quickened Healing · " + qh.cost + " ki"));
  var atFull = (Number(c.hp.current)||0) >= maxHp(c);
  healBtn.disabled = remaining < qh.cost || atFull;
  healBtn.title = remaining < qh.cost ? "Not enough ki left" : atFull ? "You're at full hit points"
    : "Action: spend " + qh.cost + " ki and heal 1d" + qh.die + " + " + qh.bonus;
  healBtn.addEventListener("click", function(){
    var roll = Math.floor(Math.random()*qh.die)+1, healed = roll + qh.bonus;
    c.hp.current = clamp((Number(c.hp.current)||0) + healed, 0, maxHp(c));
    c.resourcesUsed[r.key] = r.used + qh.cost;
    logRoll("Quickened Healing (1d" + qh.die + fmtMod(qh.bonus) + ")", roll + " " + fmtMod(qh.bonus) + " = " + healed + " HP healed (" + qh.cost + " ki)");
    save(); renderAll();
  });
  heals.appendChild(healBtn);
  return heals;
}
