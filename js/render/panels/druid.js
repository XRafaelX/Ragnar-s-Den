import { save } from "../../core/state.js";
import { clamp, fmtMod, maxHp, ordinal, plainAttackRollMode, spellSlotsLeft, spendSpellSlot, wildForm, wildShapeOptions, wildShapeCost, wildShapeProblem, wildShapeLimit, startWildShape, endWildShape, hasPrimalStrike, hasCombatWildShape, naturalRecoveryBudget, recoverableSlots, recoverSlots, balmDiceLimit, setCosmicOmen } from "../../core/helpers.js";
import { WILD_SHAPE_ELEMENTALS, wildShapeForm } from "../../data/wild-shapes.js";
import { makeCard, renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeDiceSvg, makeDicesSvg } from "../../ui/svg-icons.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { rollAttack } from "./sheet-rolls.js";
import { sheetTop, lead, sheetButton } from "./paladin.js";

/* ---------------- Druid ----------------
   The Wild Shape card and its picker (Vitals), and the rows Class resources
   add for Natural Recovery, Cosmic Omen and Balm of the Summer Court. */
function speedText(form){
  var s = form.speed;
  return [s.walk ? s.walk + " ft" : ""].concat(["fly", "swim", "climb", "burrow"].filter(function(t){ return s[t]; }).map(function(t){ return t + " " + s[t] + " ft"; })).filter(Boolean).join(", ");
}
function buttonRow(){
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  return row;
}
function rollBtn(icon, text, title, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn";
  b.innerHTML = icon;
  b.appendChild(document.createTextNode(text));
  if(title) b.title = title;
  b.addEventListener("click", onClick);
  return b;
}

/* ---- Wild Shape ---- */
/* Only what this druid can turn into now, by challenge rating. */
function wildShapePicker(c, r){
  var left = r.max===Infinity ? Infinity : r.max - r.used;
  if(left <= 0) return null;
  var groups = {};
  wildShapeOptions(c).forEach(function(f){
    var g = WILD_SHAPE_ELEMENTALS.indexOf(f.name)!==-1 ? "Elementals (2 uses)" : "CR " + f.cr;
    (groups[g] = groups[g] || []).push({value: f.name, label: f.name});
  });
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "wild-shape", groups: groups, value: "", search: true, sheet: true,
    placeholder: c.wildShape ? "Change form..." : "Transform into...", ariaLabel: "Wild Shape: choose a form",
    reasonFor: function(v){ return wildShapeProblem(c, v) ? "2 uses" : ""; },
    detailFor: function(v){ var f = wildShapeForm(v); return "AC " + f.ac + ", " + f.hp + " HP, " + speedText(f); },
    onPick: function(v){
      if(!startWildShape(c, v)) return;
      logRoll("Wild Shape", "Transformed into: " + v + " (" + wildShapeCost(v) + (wildShapeCost(v)===1 ? " use" : " uses") + ").");
      showActionToast("You are a " + v.toLowerCase() + ". Your form is on the Wild Shape card.");
      save(); renderSidebar(); renderAll();
    }}));
  return wrap;
}
/* Shown while transformed: the form's attacks, what it can do, and the way back. */
export function renderWildShapeCard(c){
  var form = wildForm(c);
  var card = makeCard("Wild Shape");
  var list = document.createElement("div");
  list.className = "res-list";
  var row = document.createElement("div");
  row.className = "res-row fx-row on";
  var info = document.createElement("div");
  info.className = "res-info";
  var name = document.createElement("div");
  name.className = "res-name";
  name.textContent = form.name;
  [["CR " + form.cr], ["Up to " + wildShapeLimit(c).hours + (wildShapeLimit(c).hours===1 ? " hour" : " hours")]].forEach(function(t){
    var tag = document.createElement("span");
    tag.className = "res-reset";
    tag.textContent = t[0];
    name.appendChild(tag);
  });
  info.appendChild(name);
  var now = document.createElement("div");
  now.className = "fx-now";
  now.textContent = "Your own hit points: " + c.wildShape.normal + (hasPrimalStrike(c) ? " · Your attacks count as magical" : "");
  info.appendChild(now);
  attackRows(c, form).forEach(function(r){ info.appendChild(r); });
  if(hasCombatWildShape(c)){
    var pick = healPicker(c);
    if(pick) info.appendChild(pick);
  }
  var details = buttonRow();
  details.appendChild(rollBtn("", "Stat block", "Everything this form can do", function(){ openFormSheet(form); }));
  info.appendChild(details);
  row.appendChild(info);

  var ctrl = document.createElement("div");
  ctrl.className = "res-ctrl";
  var back = document.createElement("button");
  back.type = "button"; back.className = "btn small";
  back.textContent = "Turn back";
  back.title = "Bonus action on your turn";
  back.setAttribute("aria-label", "Turn back from Wild Shape");
  back.addEventListener("click", function(){
    endWildShape(c);
    logRoll("Wild Shape", "Back to your own shape.");
    save(); renderSidebar(); renderAll();
  });
  ctrl.appendChild(back);
  row.appendChild(ctrl);
  list.appendChild(row);
  card.appendChild(list);
  return card;
}
function attackRows(c, form){
  var roll = plainAttackRollMode(c);
  return form.attacks.map(function(a){
    var row = buttonRow();
    var parts = a.dice ? a.dice.split("d") : null;
    var hit = parts ? {qty: Number(parts[0]), die: Number(parts[1]), bonus: a.bonus, melee: a.melee, label: form.name + " " + a.name} : undefined;
    var tag = roll.mode==="dis" ? " (Dis)" : roll.mode==="adv" ? " (Adv)" : "";
    var atk = rollBtn(makeDiceSvg(), a.name + " " + fmtMod(a.toHit) + tag, roll.reason || a.text, function(){ rollAttack(c, a.toHit, roll.mode, form.name + ": " + a.name, hit); });
    row.appendChild(atk);
    var damage = (a.dice ? a.dice + (a.bonus ? fmtMod(a.bonus) : "") : a.bonus) + " " + a.damageType;
    if(parts) row.appendChild(rollBtn(makeDicesSvg(), damage, a.text, function(){ performRoll(hit.die, hit.qty, a.bonus, "none", form.name + ": " + a.name + " (" + a.damageType + ")"); }));
    else { var flat = document.createElement("span"); flat.className = "res-hint"; flat.textContent = damage; row.appendChild(flat); }
    return row;
  });
}
/* Combat Wild Shape (Moon 2): 1d8 per level of the slot spent. */
function healPicker(c){
  var slots = spellSlotsLeft(c);
  if(!slots.length) return null;
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  var items = slots.map(function(s, i){ return {value: String(i), label: ordinal(s.level) + "-level " + (s.pact ? "pact slot" : "slot") + ": " + s.level + "d8"}; });
  wrap.appendChild(themedPicker({key: "combat-wild-shape", groups: {"": items}, value: "", placeholder: "Heal with a spell slot...", ariaLabel: "Combat Wild Shape: spend a spell slot to heal",
    onPick: function(v){
      var slot = slots[Number(v)];
      spendSpellSlot(c, slot);
      save(); renderAll();
      performRoll(8, slot.level, 0, "none", "Combat Wild Shape (" + ordinal(slot.level) + "-level slot)", {onResult: function(r){
        c.hp.current = clamp((Number(c.hp.current)||0) + r.total, 0, maxHp(c));
        save(); renderSidebar(); renderAll();
      }});
    }}));
  return wrap;
}
function openFormSheet(form){
  var lines = function(body, title, list){
    if(!list || !list.length) return;
    var h = document.createElement("div");
    h.className = "pal-sheet-head";
    h.textContent = title;
    body.appendChild(h);
    list.forEach(function(x){
      var p = document.createElement("p");
      p.className = "res-hint";
      var b = document.createElement("b");
      b.textContent = x.name + ". ";
      p.appendChild(b);
      p.appendChild(document.createTextNode(x.text));
      body.appendChild(p);
    });
  };
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, form.name, close);
    lead(body, form.size + ", CR " + form.cr + ", AC " + form.ac + ", " + form.hp + " HP (" + form.hd + "), speed " + speedText(form) +
      ", STR " + form.str + ", DEX " + form.dex + ", CON " + form.con + ".");
    var wards = [["Resistances", form.resist], ["Immunities", form.immune], ["Vulnerabilities", form.vulnerable]].filter(function(w){ return w[1]; })
      .map(function(w){ return {name: w[0], text: w[1]}; });
    lines(body, "", wards);
    lines(body, "Traits", form.traits);
    lines(body, "Actions", (form.actions||[]).concat(form.attacks.map(function(a){ return {name: a.name, text: a.text}; })));
    lines(body, "Reactions", form.reactions);
  });
}

/* ---- Class resources ---- */
export function druidResourceRow(c, r){
  if(r.key==="Druid:wild_shape") return wildShapePicker(c, r);
  if(r.key==="Druid:natural_recovery") return slotRecoveryRow(c, r, naturalRecoveryBudget(c));
  if(r.key==="Druid:cosmic_omen") return omenRow(c, r);
  if(r.key==="Druid:balm_of_the_summer_court") return balmPicker(c, r);
  return null;
}
/* Natural Recovery and Arcane Recovery. */
export function slotRecoveryRow(c, r, budget){
  var row = buttonRow(), spent = recoverableSlots(c);
  var b = rollBtn("", "Recover slots", "", function(){ openRecoverySheet(c, r, budget); });
  b.disabled = r.used >= r.max || !spent.length;
  b.title = r.used >= r.max ? "Used until a long rest" : !spent.length ? "No spent spell slots to recover" : "With a short rest";
  row.appendChild(b);
  return row;
}
/* Tap a slot to pick it, as many as the budget allows. */
function openRecoverySheet(c, r, budget){
  var picked = {};
  var cost = function(){ return Object.keys(picked).reduce(function(n, l){ return n + Number(l) * picked[l]; }, 0); };
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, r.name, close);
    lead(body, "Pick spent slots worth up to " + budget + (budget===1 ? " level" : " levels") + ". Picked: " + cost() + ".");
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    recoverableSlots(c).forEach(function(s){
      var n = picked[s.level] || 0;
      list.appendChild(sheetButton(ordinal(s.level) + "-level slot: " + n + " of " + s.spent, function(){
        picked[s.level] = n + 1;
        refresh();
      }, n >= s.spent || cost() + s.level > budget));
    });
    list.appendChild(sheetButton("Clear", function(){ picked = {}; refresh(); }, !cost()));
    list.appendChild(sheetButton("Recover", function(){
      if(!recoverSlots(c, picked, budget)) return;
      if(!c.resourcesUsed) c.resourcesUsed = {};
      c.resourcesUsed[r.key] = r.used + 1;
      logRoll(r.name, "Recovered spell slots: " + Object.keys(picked).filter(function(l){ return picked[l]; }).map(function(l){ return picked[l] + " " + ordinal(Number(l)); }).join(", ") + ".");
      save(); close(); renderAll();
    }, !cost()));
    body.appendChild(list);
  });
}
/* Weal or Woe comes with each long rest, or from this button the first time. */
function omenRow(c, r){
  var row = buttonRow(), omen = c.cosmicOmen;
  if(!omen){
    row.appendChild(rollBtn(makeDiceSvg(), "Consult your star map", "Even: Weal. Odd: Woe.", function(){
      performRoll(6, 1, 0, "none", "Cosmic Omen", {onResult: function(x){
        logRoll("Cosmic Omen", setCosmicOmen(c, x.total) + " until your next long rest.");
        save(); renderAll();
      }});
    }));
    return row;
  }
  var word = omen==="Weal" ? "add" : "subtract";
  var b = rollBtn(makeDicesSvg(), omen + ": " + word + " 1d6", "Reaction: " + word + " the roll to a creature's attack roll, save or check", function(){
    c.resourcesUsed[r.key] = r.used + 1;
    save(); renderAll();
    performRoll(6, 1, 0, "none", "Cosmic Omen: " + omen + " (" + word + " it)");
  });
  b.disabled = r.used >= r.max;
  row.appendChild(b);
  return row;
}
/* Spend up to half the druid level in dice. */
function balmPicker(c, r){
  var most = Math.min(balmDiceLimit(c), r.max - r.used);
  if(most <= 0) return null;
  var items = [];
  for(var n = 1; n <= most; n++) items.push({value: String(n), label: n + (n===1 ? " die: " : " dice: ") + n + "d6 HP, " + n + " temp HP"});
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "balm", groups: {"": items}, value: "", placeholder: "Spend dice...", ariaLabel: "Balm of the Summer Court: dice to spend",
    onPick: function(v){
      var dice = Number(v);
      if(!c.resourcesUsed) c.resourcesUsed = {};
      c.resourcesUsed[r.key] = r.used + dice;
      save(); renderAll();
      performRoll(6, dice, 0, "none", "Balm of the Summer Court (+" + dice + " temporary HP)", function(x){
        if(!x) return null;
        return {lead: "For the creature you chose, or:", options: [{label: "Heal yourself " + x.total, title: "Temporary hit points don't stack: you keep the higher",
          use: function(){
            c.hp.current = clamp((Number(c.hp.current)||0) + x.total, 0, maxHp(c));
            if(dice > (Number(c.hp.temp)||0)) c.hp.temp = dice;
            save(); renderSidebar(); renderAll();
            return {silent: true};
          }}]};
      });
    }}));
  return wrap;
}
