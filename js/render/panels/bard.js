import { save } from "../../core/state.js";
import { clamp, maxHp, plainAttackRollMode, resourceLeft, bardicDie, bardicActions, bardicProblem, spendBardic, bladeFlourish, spiritTale, hasMysticalConnection, taleRoll, bardSpellAttack, sessionSpells, songOfRestDie } from "../../core/helpers.js";
import { SPIRIT_TALES } from "../../data/spirit-tales.js";
import { SPELL_DATA } from "../../data/spells.js";
import { renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeDicesSvg } from "../../ui/svg-icons.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { rollAttack } from "./sheet-rolls.js";
import { sheetTop, lead, sheetButton } from "./paladin.js";

/* ---------------- Bard ----------------
   What a Bardic Inspiration row can do (Vitals): the list of what it pays
   for, the tale in mind and Spirit Session, plus Blade Flourish's sheet and
   Song of Rest's button. */
function buttonRow(){
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  return row;
}
function rollBtn(text, title, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn";
  b.innerHTML = makeDicesSvg();
  b.appendChild(document.createTextNode(text));
  if(title) b.title = title;
  b.addEventListener("click", onClick);
  return b;
}
/* "Heal yourself 7" for a roll that can go to you. gain: "heal" or "temp". */
function toYou(c, gain, label){
  return function(x){
    if(!x) return null;
    return {lead: "For the creature you chose, or:", options: [{label: (gain==="heal" ? "Heal yourself " : "Take ") + x.total + (gain==="heal" ? "" : " temporary HP"),
      title: gain==="heal" ? "You regain these hit points" : "Temporary hit points don't stack: you keep the higher",
      use: function(){
        if(gain==="heal") c.hp.current = clamp((Number(c.hp.current)||0) + x.total, 0, maxHp(c));
        else if(x.total > (Number(c.hp.temp)||0)) c.hp.temp = x.total;
        logRoll(label, gain==="heal" ? "Regained " + x.total + " HP." : "Temporary hit points: " + c.hp.temp + ".");
        save(); renderSidebar(); renderAll();
        return {silent: true};
      }}]};
  };
}

/* ---- The Bardic Inspiration row ---- */
export function bardResourceRow(c, r){
  if(r.key==="Bard:spirit_session") return sessionPicker(c, r);
  if(r.key!=="Bard:bardic_inspiration") return null;
  var wrap = document.createElement("div");
  var actions = bardicActions(c);
  // (With nothing but inspiring, the Use button says it all.)
  if(actions.length > 1) wrap.appendChild(actionPicker(c, actions));
  var tale = spiritTale(c);
  if(tale) wrap.appendChild(taleRow(c, tale));
  return wrap.childNodes.length ? wrap : null;
}
function actionPicker(c, actions){
  function find(id){ return actions.find(function(a){ return a.id===id; }); }
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "bardic:spend", groups: {"": actions.map(function(a){ return {value: a.id, label: a.name}; })}, value: "",
    placeholder: "Spend Bardic Inspiration on...", ariaLabel: "Spend Bardic Inspiration on", sheet: true,
    reasonFor: function(){ return bardicProblem(c); },
    detailFor: function(id){ return find(id).detail; },
    onPick: function(id){
      var a = find(id);
      if(!spendBardic(c)) return;
      if(a.log) logRoll(a.name, a.log);
      save(); renderAll();
      if(a.tale) tellTale(c);
      else if(a.roll) performRoll(a.roll.die, a.roll.qty, a.roll.bonus, "none", a.roll.label);
    }}));
  return wrap;
}
/* A roll on the Spirit Tales table. Mystical Connection: two rolls and a
   choice, or any tale if they match. */
function tellTale(c){
  var die = bardicDie(c);
  if(!hasMysticalConnection(c)){
    performRoll(die, 1, 0, "none", "Tales from Beyond", {onResult: function(r){ keepTale(c, r.total); }});
    return;
  }
  var a = Math.floor(Math.random() * die) + 1, b = Math.floor(Math.random() * die) + 1;
  logRoll("Mystical Connection", "Rolled " + a + " and " + b + ".");
  var choices = a===b ? SPIRIT_TALES.map(function(t, i){ return i + 1; }) : [a, b];
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, "Mystical Connection", close);
    lead(body, a===b ? "You rolled " + a + " twice, so choose any tale." : "You rolled " + a + " and " + b + ". Choose one.");
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    choices.forEach(function(n){
      list.appendChild(sheetButton(n + ". " + SPIRIT_TALES[n - 1].name, function(){ close(); keepTale(c, n); }));
    });
    body.appendChild(list);
  });
}
function keepTale(c, n){
  c.spiritTale = n;
  logRoll("Tales from Beyond", spiritTale(c, n).name + " is in your mind.");
  save(); renderAll();
}
/* The tale in mind and the button that tells it (an action, within 30 ft). */
function taleRow(c, tale){
  var box = document.createElement("div");
  var name = document.createElement("div");
  name.className = "fx-now";
  name.textContent = tale.name;
  box.appendChild(name);
  var hint = document.createElement("div");
  hint.className = "res-hint";
  hint.textContent = tale.text;
  box.appendChild(hint);
  var row = buttonRow();
  row.appendChild(rollBtn("Tell the tale", "Action: choose a creature you can see within 30 ft. It can be you.", function(){ bestow(c, tale); }));
  box.appendChild(row);
  return box;
}
function bestow(c, tale){
  delete c.spiritTale;
  logRoll(tale.name, tale.text);
  save(); renderAll();
  var r = taleRoll(c, tale);
  if(!r) return;
  if(tale.def.attack){
    var mode = plainAttackRollMode(c);
    rollAttack(c, bardSpellAttack(c), mode.mode, tale.name, {qty: r.qty, die: r.die, bonus: r.bonus, label: r.label, offerDamage: true});
    return;
  }
  performRoll(r.die, r.qty, r.bonus, "none", r.label, tale.def.gain ? toYou(c, tale.def.gain, tale.name) : null);
}
/* Spirit Session: one spell until you start a long rest. */
function sessionPicker(c, r){
  var known = c.sessionSpell;
  if(r.used >= r.max || known){
    var note = document.createElement("div");
    note.className = "fx-now";
    note.textContent = known ? "Learned until your next long rest: " + known : "Used until your next long rest";
    return note;
  }
  var byLevel = {};
  sessionSpells(c).forEach(function(n){
    var lv = SPELL_DATA[n].level, g = lv ? "Level " + lv : "Cantrips";
    (byLevel[g] = byLevel[g] || []).push({value: n, label: n});
  });
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "spirit-session", groups: byLevel, value: "", placeholder: "Learn a spell...", ariaLabel: "Spirit Session: choose a spell", sheet: true, search: true,
    detailFor: function(n){ return SPELL_DATA[n].school; },
    onPick: function(n){
      c.sessionSpell = n;
      if(!c.resourcesUsed) c.resourcesUsed = {};
      c.resourcesUsed[r.key] = r.used + 1;
      logRoll("Spirit Session", "Learned " + n + " until your next long rest.");
      showActionToast(n + " is on your Spells tab until your next long rest.");
      save(); renderAll();
    }}));
  return wrap;
}

/* ---- Blade Flourish ---- */
/* name: what hit. crit: the die is doubled on a critical hit. */
export function openFlourishSheet(c, name, crit){
  var fl = bladeFlourish(c);
  if(!fl) return;
  var state = {free: !fl.left};
  var options = [
    {id: "Defensive Flourish", text: "Extra damage, and the number rolled goes on your AC until the start of your next turn."},
    {id: "Slashing Flourish", text: "Extra damage to the target and to any other creature you choose within 5 ft of you."},
    {id: "Mobile Flourish", text: "Extra damage. You can push the target 5 ft plus the number rolled, then use your reaction to move up to your walking speed to a space within 5 ft of it."}
  ];
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, "Blade Flourish", close);
    var die = state.free ? 6 : fl.die, qty = crit ? 2 : 1;
    lead(body, "One flourish a turn, on a hit. It costs " + (state.free ? "nothing with Master's Flourish" : "a Bardic Inspiration") + ", with a d" + die + ".");
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    if(fl.master && fl.left) list.appendChild(sheetButton(state.free ? "Spend a Bardic Inspiration instead" : "Use Master's Flourish's d6 instead", function(){ state.free = !state.free; refresh(); }));
    options.forEach(function(o){
      var b = sheetButton(o.id + ": " + qty + "d" + die, function(){
        if(!state.free && !spendBardic(c)) return;
        close();
        save(); renderAll();
        performRoll(die, qty, 0, "none", name + ": " + o.id, {onResult: function(r){
          if(o.id!=="Defensive Flourish") return;
          // (A critical hit doubles the damage, not the AC.)
          c.effects = c.effects || {};
          c.effects.defensive_flourish = r.values ? r.values[0] : r.total;
          save(); renderAll();
        }});
      });
      b.title = o.text;
      list.appendChild(b);
      var why = document.createElement("div");
      why.className = "res-hint";
      why.textContent = o.text;
      list.appendChild(why);
    });
    body.appendChild(list);
  });
}

/* ---- Song of Rest ---- */
/* On the rest card: the extra die for whoever spends Hit Dice in a short rest. */
export function songOfRestButton(c){
  var die = songOfRestDie(c);
  if(!die) return null;
  var row = buttonRow();
  row.appendChild(rollBtn("Song of Rest 1d" + die, "At the end of a short rest, for each friendly creature who can hear you and spends Hit Dice. You too.", function(){
    performRoll(die, 1, 0, "none", "Song of Rest", toYou(c, "heal", "Song of Rest"));
  }));
  return row;
}
