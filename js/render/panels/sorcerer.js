import { save } from "../../core/state.js";
import { clamp, maxHp, ordinal, sorceryActions, sorceryProblem, payForSorcery, surgeEntry, hasControlledChaos, regainTides, regainLowestSlot, regainAllPoints, unearthlyRecovery, PHASES, LUNAR_SPELLS, lunarFreeUsed, useLunarFree, setLunarPhase, phenomenonSpent, usePhenomenon, sorcererDc, resourceLeft, spendResource, bastionDice, startEffect } from "../../core/helpers.js";
import { renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeDiceSvg, makeDicesSvg } from "../../ui/svg-icons.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { sheetTop, lead, sheetButton } from "./paladin.js";

/* ---------------- Sorcerer ----------------
   The "Spend sorcery points on..." list, the Wild Magic table, Unearthly
   Recovery, the Lunar phases and Revelation in Flesh's sheet. */
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
export function sorcererResourceRow(c, r){
  if(r.key==="Sorcerer:sorcery_points" || r.key==="feat:sorcery_points") return pointsPicker(c, r.key);
  if(r.key==="Sorcerer:tides_of_chaos") return surgeRow(c);
  if(r.key==="Sorcerer:unearthly_recovery") return recoveryRow(c, r);
  if(r.key==="Sorcerer:lunar_embodiment") return lunarRow(c);
  if(r.key==="Sorcerer:lunar_phenomenon") return phenomenonRow(c);
  return null;
}
function pointsPicker(c, key){
  var actions = sorceryActions(c, key), groups = {};
  function find(id){ return actions.find(function(a){ return a.id===id; }); }
  function cost(a){ return a.gain ? "+" + a.gain : a.cost + (a.cost===1 ? " point" : " points"); }
  actions.forEach(function(a){
    (groups[a.group] = groups[a.group] || []).push({value: a.id, label: a.discount || a.gain ? a.name : a.name + " · " + cost(a)});
  });
  if(!actions.length) return null;
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "sorcery:spend", groups: groups, value: "", placeholder: "Spend sorcery points on...", ariaLabel: "Spend sorcery points on", sheet: true,
    reasonFor: function(id){ return sorceryProblem(c, find(id), key); },
    detailFor: function(id){ return find(id).detail; },
    onPick: function(id){
      var a = find(id), paid = cost(a);
      if(!payForSorcery(c, a, key)) return;
      if(a.log) logRoll(a.group==="Metamagic" ? "Metamagic" : a.name, a.log + " (" + paid + ")");
      save(); renderAll();
      if(a.roll) performRoll(a.roll.die, a.roll.qty, a.roll.bonus, "none", a.roll.label);
    }}));
  return wrap;
}

/* ---- Wild Magic ---- */
function surgeRow(c){
  var row = buttonRow();
  row.appendChild(rollBtn(makeDiceSvg(), "Surge check d20", "After a sorcerer spell of 1st level or higher, when your DM asks: a 1 means a surge", function(){
    performRoll(20, 1, 0, "none", "Wild Magic Surge check", function(r){
      if(!r || r.total!==1) return null;
      return {lead: "A surge!", options: [{label: "Roll on the table", title: "Roll a d100 on the Wild Magic Surge table", use: function(){ rollSurge(c); return {silent: true}; }}]};
    });
  }));
  row.appendChild(rollBtn(makeDicesSvg(), "Surge table d100", "Roll on the Wild Magic Surge table. It gives Tides of Chaos back.", function(){ rollSurge(c); }));
  return row;
}
/* Controlled Chaos: two rolls and a choice. */
function rollSurge(c){
  var d = function(){ return Math.floor(Math.random() * 100) + 1; };
  var rolls = hasControlledChaos(c) ? [d(), d()] : [d()];
  regainTides(c);
  save(); renderAll();
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, "Wild Magic Surge", close);
    lead(body, rolls.length > 1 ? "You rolled " + rolls.join(" and ") + ". Use either one." : "You rolled " + rolls[0] + ".");
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    rolls.forEach(function(n){
      var e = surgeEntry(n);
      var p = document.createElement("div");
      p.className = "fx-now";
      p.textContent = e.text;
      list.appendChild(p);
      if(e.apply) list.appendChild(sheetButton("Apply it", function(){ applySurge(c, e); close(); }));
    });
    body.appendChild(list);
  });
  logRoll("Wild Magic Surge", "Rolled " + rolls.join(" and ") + ": " + rolls.map(function(n){ return surgeEntry(n).text; }).join(" Or: "));
}
function applySurge(c, e){
  if(e.apply==="points"){ regainAllPoints(c); logRoll("Wild Magic Surge", "All sorcery points back."); }
  if(e.apply==="slot"){
    var l = regainLowestSlot(c);
    logRoll("Wild Magic Surge", l ? "A " + ordinal(l) + "-level spell slot back." : "No spent slot to regain.");
  }
  if(e.apply==="heal"){
    performRoll(10, 2, 0, "none", "Wild Magic Surge: hit points", {onResult: function(r){
      c.hp.current = clamp((Number(c.hp.current)||0) + r.total, 0, maxHp(c));
      save(); renderSidebar(); renderAll();
    }});
    return;
  }
  save(); renderAll();
}

/* ---- Divine Soul ---- */
function recoveryRow(c, r){
  var row = buttonRow(), hpMax = maxHp(c), heal = unearthlyRecovery(c, hpMax), half = Math.floor(hpMax / 2);
  var b = rollBtn("", "Heal " + half, "", function(){
    if(!spendResource(c, r.key, 1)) return;
    c.hp.current = clamp((Number(c.hp.current)||0) + half, 0, hpMax);
    logRoll(r.name, "Regained " + half + " HP.");
    save(); renderSidebar(); renderAll();
  });
  b.disabled = r.used >= r.max || !heal;
  b.title = r.used >= r.max ? "Used until a long rest" : !heal ? "Only below half your hit points" : "Bonus action";
  row.appendChild(b);
  return row;
}

/* ---- Lunar Sorcery ---- */
/* The phase, chosen after each long rest, and its free spell. */
function lunarRow(c){
  var box = document.createElement("div"), phase = c.lunarPhase;
  if(!phase || c.lunarChoose){
    var wrap = document.createElement("div");
    wrap.className = "res-pick";
    wrap.appendChild(themedPicker({key: "lunar:phase", groups: {"": PHASES}, value: phase || "", placeholder: "Choose your phase...", ariaLabel: "Lunar Embodiment: choose your phase",
      onPick: function(v){
        setLunarPhase(c, v);
        logRoll("Lunar Embodiment", "Your phase is the " + v + ".");
        save(); renderAll();
      }}));
    box.appendChild(wrap);
  }
  if(!phase) return box;
  var now = document.createElement("div");
  now.className = "fx-now";
  now.textContent = phase;
  box.appendChild(now);
  var row = buttonRow(), spell = LUNAR_SPELLS[phase];
  var b = rollBtn("", "Cast " + spell + " free", "Without a spell slot", function(){
    if(!useLunarFree(c)) return;
    logRoll("Lunar Embodiment", "Cast " + spell + " without a spell slot.");
    save(); renderAll();
  });
  b.disabled = lunarFreeUsed(c) || resourceLeft(c, "Sorcerer:lunar_embodiment") <= 0;
  if(b.disabled) b.title = "Used until a long rest";
  row.appendChild(b);
  box.appendChild(row);
  return box;
}
function phenomenonRow(c){
  var phase = c.lunarPhase;
  if(!phase) return null;
  var row = buttonRow(), spent = phenomenonSpent(c), dc = sorcererDc(c);
  var text = {"Full Moon": "Blinding light", "New Moon": "Gloom", "Crescent Moon": "Teleport"}[phase];
  var title = {"Full Moon": "Each creature you choose within 30 ft: CON save DC " + dc + " or blinded until the end of its next turn. One creature there regains 3d8 hit points.",
    "New Moon": "Each creature you choose within 30 ft: DEX save DC " + dc + " or 3d10 necrotic and speed 0 until the end of its next turn. You are invisible until the end of your next turn, or until right after you attack or cast a spell.",
    "Crescent Moon": "Teleport up to 60 ft, with a willing creature within 5 ft if you like. You both have resistance to all damage until the start of your next turn."}[phase];
  var b = rollBtn(phase==="Crescent Moon" ? "" : makeDicesSvg(), text + (spent ? " · 5 points" : ""), title, function(){
    if(!usePhenomenon(c)) return;
    logRoll("Lunar Phenomenon", title);
    save(); renderAll();
    if(phase==="Full Moon") performRoll(8, 3, 0, "none", "Lunar Phenomenon: hit points regained");
    if(phase==="New Moon") performRoll(10, 3, 0, "none", "Lunar Phenomenon (necrotic, DEX save)");
  });
  b.disabled = spent && resourceLeft(c, "Sorcerer:sorcery_points") < 5;
  row.appendChild(b);
  return row;
}

/* ---- Revelation in Flesh ---- */
var REVELATIONS = [
  {id: "Sight", text: "See any invisible creature within 60 ft that isn't behind cover."},
  {id: "Flight", text: "A flying speed equal to your walking speed, and you can hover."},
  {id: "Water", text: "A swimming speed of twice your walking speed, and you breathe underwater."},
  {id: "Pliable", text: "Move through a 1-inch gap without squeezing, and spend 5 ft of movement to escape nonmagical restraints or a grapple."}
];
export function openRevelationSheet(c){
  var picked = [], left = resourceLeft(c, "Sorcerer:sorcery_points");
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, "Revelation in Flesh", close);
    lead(body, "One benefit for each point, for 10 minutes. Picked: " + picked.length + ".");
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    REVELATIONS.forEach(function(x){
      var on = picked.indexOf(x.id)!==-1;
      var b = sheetButton((on ? "Remove: " : "Add: ") + x.id, function(){
        picked = on ? picked.filter(function(p){ return p!==x.id; }) : picked.concat(x.id);
        refresh();
      }, !on && picked.length >= left);
      b.title = x.text;
      list.appendChild(b);
      var why = document.createElement("div");
      why.className = "res-hint";
      why.textContent = x.text;
      list.appendChild(why);
    });
    list.appendChild(sheetButton("Transform · " + picked.length + (picked.length===1 ? " point" : " points"), function(){
      if(!spendResource(c, "Sorcerer:sorcery_points", picked.length) || !startEffect(c, "revelation_in_flesh", picked)) return;
      logRoll("Revelation in Flesh", picked.join(", ") + ".");
      close();
      save(); renderAll();
    }, !picked.length));
    body.appendChild(list);
  });
}

/* ---- Bastion of Law ---- */
/* Spend some of the ward's dice against damage. */
export function bastionPicker(c){
  var dice = bastionDice(c), items = [];
  for(var n = 1; n <= dice; n++) items.push({value: String(n), label: n + "d8"});
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "bastion", groups: {"": items}, value: "", placeholder: "Spend dice to reduce damage...", ariaLabel: "Bastion of Law: dice to spend",
    onPick: function(v){
      var n = Number(v), rest = dice - n;
      if(rest > 0) c.effects.bastion_of_law = rest; else delete c.effects.bastion_of_law;
      save(); renderAll();
      performRoll(8, n, 0, "none", "Bastion of Law: damage reduced");
    }}));
  return wrap;
}
