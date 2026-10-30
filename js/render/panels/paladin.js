import { save } from "../../core/state.js";
import { clamp, maxHp, ordinal, smiteDice, smiteSlots, spendSmiteSlot, inspiringSmite, spendChannel, hasImprovedSmite, channelActions, channelProblem, useChannelAction, resourceLeft, spendLayOnHands, removeCondition, activeConditions } from "../../core/helpers.js";
import { renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeDicesSvg } from "../../ui/svg-icons.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { performRoll, logRoll } from "../../dice/dice.js";

/* ---------------- Paladin ----------------
   Divine Smite's sheet (from a melee weapon's card, or a natural 20), the
   Channel Divinity list and Lay on Hands (Vitals). */
function sheetTop(body, title, close){
  var header = document.createElement("div");
  header.className = "bs-header";
  var name = document.createElement("div");
  name.className = "bs-title";
  name.textContent = title;
  header.appendChild(name);
  var x = document.createElement("button");
  x.type = "button"; x.className = "bs-close"; x.textContent = "✕"; x.title = "Close";
  x.setAttribute("aria-label", "Close");
  x.addEventListener("click", close);
  header.appendChild(x);
  body.appendChild(header);
}
function lead(body, text){
  var p = document.createElement("p");
  p.className = "bs-subtitle"; p.textContent = text;
  body.appendChild(p);
}
function sheetButton(text, onClick, disabled, title){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn pal-sheet-btn";
  b.textContent = text;
  b.disabled = !!disabled;
  if(title) b.title = title;
  b.addEventListener("click", onClick);
  return b;
}
function tick(text, on, onChange){
  var label = document.createElement("label");
  label.className = "pal-tick";
  var box = document.createElement("input");
  box.type = "checkbox"; box.className = "chk"; box.checked = on;
  box.addEventListener("change", function(){ onChange(box.checked); });
  label.appendChild(box);
  label.appendChild(document.createTextNode(text));
  return label;
}

/* ---- Divine Smite ---- */
/* name: what hit, for the roll's label. crit starts with Critical hit on. */
export function openSmiteSheet(c, name, crit){
  var state = {crit: !!crit, undead: false};
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, "Divine Smite", close);
    lead(body, "Spend a spell slot for extra radiant damage on this hit.");
    var ticks = document.createElement("div");
    ticks.className = "pal-ticks";
    ticks.appendChild(tick("Critical hit (double dice)", state.crit, function(v){ state.crit = v; refresh(); }));
    ticks.appendChild(tick("Undead or fiend (+1d8)", state.undead, function(v){ state.undead = v; refresh(); }));
    body.appendChild(ticks);
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    smiteSlots(c).forEach(function(s){
      var n = smiteDice(s.level, state.undead, state.crit);
      var what = ordinal(s.level) + (s.pact ? "-level pact slot" : "-level slot");
      list.appendChild(sheetButton(what + ": " + n + "d8 (" + s.left + " left)", function(){
        spendSmiteSlot(c, s);
        close();
        save(); renderAll();
        performRoll(8, n, 0, "none", name + ": Divine Smite (Radiant)", function(r){ return r ? smiteFollowUp(c) : null; });
      }));
    });
    body.appendChild(list);
  });
}
/* After a smite: an Oath of Glory paladin's Inspiring Smite. */
function smiteFollowUp(c){
  var ins = inspiringSmite(c);
  if(!ins) return null;
  return {lead: "Inspiring Smite:", options: [{label: "Share 2d8+" + ins.bonus + " temporary HP", title: "A bonus action: your Channel Divinity. Share them among creatures you choose within 30 feet",
    use: function(){
      if(!spendChannel(c)) return null;
      save(); renderAll();
      performRoll(8, 2, ins.bonus, "none", "Inspiring Smite: temporary HP to share", function(r){
        if(!r) return null;
        return {lead: "Share them out, or:", options: [{label: "Take all " + r.total + " yourself", title: "Temporary hit points don't stack: you keep the higher",
          use: function(){
            if(r.total > (Number(c.hp.temp)||0)) c.hp.temp = r.total;
            save(); renderSidebar(); renderAll();
            return {silent: true};
          }}]};
      });
      return {silent: true};
    }}]};
}
/* The buttons on a melee weapon's card. improved: a real weapon, for
   Improved Divine Smite (an unarmed strike isn't one). */
export function smiteButtons(c, name, improved){
  var out = [];
  if(!c.classes.some(function(x){ return x.name==="Paladin" && (Number(x.level)||1) >= 2; })) return out;
  var slots = smiteSlots(c);
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn inv-fury-btn";
  b.innerHTML = makeDicesSvg() + "Divine Smite";
  b.disabled = !slots.length;
  b.title = slots.length ? "After a hit: spend a spell slot for extra radiant damage" : "No spell slots left";
  b.addEventListener("click", function(){ openSmiteSheet(c, name); });
  out.push(b);
  if(improved && hasImprovedSmite(c)){
    var i = document.createElement("button");
    i.type = "button"; i.className = "btn small inv-roll-btn inv-fury-btn";
    i.innerHTML = makeDicesSvg() + "+1d8 radiant";
    i.title = "Improved Divine Smite: every melee weapon hit deals this too";
    i.addEventListener("click", function(){ performRoll(8, 1, 0, "none", name + ": Improved Divine Smite (Radiant)"); });
    out.push(i);
  }
  return out;
}

/* ---- Channel Divinity ---- */
export function channelPicker(c){
  var actions = channelActions(c), groups = {"": []};
  actions.forEach(function(a){
    var g = a.group || "";
    if(!groups[g]) groups[g] = [];
    groups[g].push({value: a.id, label: a.name});
  });
  function find(id){ return actions.find(function(a){ return a.id===id; }); }
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "channel:use", groups: groups, value: "", placeholder: "Use Channel Divinity on...", ariaLabel: "Use Channel Divinity on", sheet: true,
    reasonFor: function(id){ return channelProblem(c, find(id)); },
    detailFor: function(id){ return find(id).detail; },
    onPick: function(id){
      var a = find(id);
      if(!useChannelAction(c, a)) return;
      logRoll("Channel Divinity: " + (a.group || a.name), a.log || "Used.");
      save(); renderAll();
      if(a.roll) performRoll(a.roll.die, a.roll.qty, a.roll.bonus, "none", a.roll.label, a.healSelf ? function(r){ return r ? healYourself(c, r.total) : null; } : null);
    }}));
  return wrap;
}
/* Turn the Tide can include you, at half your hit points or fewer. */
function healYourself(c, n){
  var hp = Number(c.hp.current)||0, top = maxHp(c);
  if(hp <= 0 || 2 * hp > top) return null;
  return {lead: "You're at half your hit points or fewer:", options: [{label: "Heal yourself " + n, title: "You can be one of the creatures it heals",
    use: function(){
      c.hp.current = clamp(hp + n, 0, top);
      save(); renderSidebar(); renderAll();
      return {silent: true};
    }}]};
}

/* ---- Lay on Hands ---- */
export function layOnHandsRow(c){
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  var left = resourceLeft(c, "Paladin:lay_on_hands");
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn";
  b.textContent = "Lay on Hands";
  b.disabled = left <= 0;
  b.title = left > 0 ? "An action: heal a creature you touch, or cure a disease or poison" : "The pool is empty until a long rest";
  b.addEventListener("click", function(){ openLayOnHands(c); });
  row.appendChild(b);
  return row;
}
function openLayOnHands(c){
  var amount = 0;
  openBottomSheet(function(body, refresh, close){
    var left = resourceLeft(c, "Paladin:lay_on_hands");
    var missing = Math.max(0, maxHp(c) - (Number(c.hp.current)||0));
    if(!amount) amount = clamp(missing || left, 1, left);
    amount = clamp(amount, 1, Math.max(1, left));
    sheetTop(body, "Lay on Hands", close);
    lead(body, left + " points left in your pool. It has no effect on undead and constructs.");
    var field = document.createElement("label");
    field.className = "pal-amount";
    field.appendChild(document.createTextNode("Hit points to restore"));
    var input = document.createElement("input");
    input.type = "number"; input.min = "1"; input.max = String(left); input.inputMode = "numeric";
    input.className = "inv-qty-input"; input.value = amount;
    input.setAttribute("aria-label", "Hit points to restore");
    field.appendChild(input);
    body.appendChild(field);
    function read(){ return clamp(Math.floor(Number(input.value))||0, 0, left); }
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    function use(n, log, then){
      if(!n || !spendLayOnHands(c, n)) return;
      if(then) then();
      logRoll("Lay on Hands", log);
      close();
      save(); renderSidebar(); renderAll();
    }
    list.appendChild(sheetButton("Heal yourself", function(){
      var n = Math.min(read(), missing);
      use(n, "Healed yourself for " + n + " HP.", function(){ c.hp.current = clamp((Number(c.hp.current)||0) + n, 0, maxHp(c)); });
    }, !missing, missing ? "" : "You're at full hit points"));
    list.appendChild(sheetButton("Heal someone else", function(){
      var n = read();
      use(n, "Restored " + n + " HP to a creature you touched.");
    }));
    var poisoned = activeConditions(c).some(function(x){ return x.def.id==="poisoned"; });
    if(poisoned) list.appendChild(sheetButton("Cure your poison (5 points)", function(){
      use(5, "Neutralized a poison on yourself.", function(){ removeCondition(c, "poisoned"); });
    }, left < 5, left < 5 ? "Needs 5 points" : ""));
    list.appendChild(sheetButton("Cure a disease or poison (5 points)", function(){
      use(5, "Cured a disease or neutralized a poison.");
    }, left < 5, left < 5 ? "Needs 5 points" : ""));
    body.appendChild(list);
  });
}
