import { save } from "../../core/state.js";
import { fmtMod, mod, ce, parseDiceNotation } from "../../core/helpers.js";
import { characterCompanions, setCompanionHp, setCompanionChoice, setCompanionBeast } from "../../core/companions.js";
import { BEAST_PRESETS } from "../../data/companions.js";
import { openInfoModal } from "../../ui/info-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";

/* ---- Companion cards (Companions tab) ----
   One stat card per companion (js/data/companions.js): its choice (a
   drake's essence), AC, HP tracker (one per copy, e.g. two cannons),
   speed, ability scores, then attacks and actions with roll buttons,
   reactions and traits as text. A Beast Master's card starts with a
   form for the beast's own stat block. */
var ABILITY_KEYS = ["str","dex","con","int","wis","cha"];

function rollButton(text, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn";
  b.innerHTML = makeDiceSvg() + text;
  b.addEventListener("click", onClick);
  return b;
}
function diceText(dice, bonus){ return dice + (bonus ? fmtMod(bonus) : ""); }
function rollDice(dice, bonus, label){
  var d = parseDiceNotation(dice);
  if(d) performRoll(d.die, d.qty, bonus||0, "none", label);
}

function hpTracker(c, comp, i){
  var max = comp.stats.hp, cur = comp.hp[i];
  var row = ce("div", "comp-hp");
  var label = ce("span", "comp-hp-label");
  label.textContent = (comp.stats.count > 1 ? "#" + (i + 1) + " " : "") + "HP";
  var value = ce("span", "comp-hp-value" + (cur === 0 ? " down" : ""));
  value.textContent = cur + " / " + max;
  row.appendChild(label); row.appendChild(value);
  [[-5, "danger"], [-1, "danger"], [1, ""], [5, ""]].forEach(function(s){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small quick-adj-btn " + (s[1] || "quick-heal-btn");
    b.textContent = (s[0] > 0 ? "+" : "") + s[0];
    b.setAttribute("aria-label", (s[0] < 0 ? "Damage " : "Heal ") + comp.def.name + " " + Math.abs(s[0]));
    b.addEventListener("click", function(){ setCompanionHp(c, comp.def.id, i, cur + s[0], max); save(); renderAll(); });
    row.appendChild(b);
  });
  var full = document.createElement("button");
  full.type = "button"; full.className = "btn small quick-adj-btn quick-heal-btn";
  full.textContent = "Full";
  full.addEventListener("click", function(){ setCompanionHp(c, comp.def.id, i, max, max); save(); renderAll(); });
  row.appendChild(full);
  return row;
}

function entryBlock(title, list, render){
  if(!list || !list.length) return null;
  var box = ce("div", "comp-section");
  var h = ce("div", "comp-section-title");
  h.textContent = title;
  box.appendChild(h);
  list.forEach(function(e){ box.appendChild(render(e)); });
  return box;
}
function textEntry(e){
  var p = ce("p", "comp-entry");
  p.innerHTML = "<b></b> <span></span>";
  p.firstChild.textContent = e.name + ".";
  p.lastChild.textContent = e.text;
  return p;
}

function choiceRow(c, comp){
  var ch = comp.def.choice;
  var box = ce("div", "comp-choice" + (comp.choice ? "" : " pending"));
  var label = ce("span", "comp-choice-label");
  label.textContent = ch.label + ":";
  box.appendChild(label);
  ch.options.forEach(function(o){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small" + (comp.choice===o ? " primary" : "");
    b.setAttribute("aria-pressed", comp.choice===o ? "true" : "false");
    b.textContent = o;
    b.addEventListener("click", function(){ setCompanionChoice(c, comp.def.id, o); save(); renderAll(); });
    box.appendChild(b);
  });
  return box;
}

/* The stat block itself (AC/HP/speed tiles, abilities, facts, attacks,
   actions, reactions, traits) into `card`. opts.rolls adds roll buttons
   (the sheet); opts.afterTiles(card) adds rows under the tiles (HP
   trackers). The Compendium's Companions list shows it read-only. */
export function renderStatBlock(card, s, name, opts){
  opts = opts || {};
  var tiles = ce("div", "comp-tiles");
  [["AC", s.ac], ["Max HP", s.hp], ["Speed", s.speed]].forEach(function(t){
    var tile = ce("div", "comp-tile");
    tile.innerHTML = "<span class='lbl'></span><span class='val'></span>";
    tile.firstChild.textContent = t[0];
    tile.lastChild.textContent = t[1];
    if(String(t[1]).length > 10) tile.lastChild.classList.add("long");   // "40 ft, fly 40 ft (not while ridden)"
    tiles.appendChild(tile);
  });
  card.appendChild(tiles);
  if(opts.afterTiles) opts.afterTiles(card);

  if(s.abilities){
    var ab = ce("div", "comp-abilities");
    ABILITY_KEYS.forEach(function(k){
      var cell = ce("div", "comp-ability");
      cell.innerHTML = "<span class='lbl'></span><span class='val'></span>";
      cell.firstChild.textContent = k.toUpperCase();
      cell.lastChild.textContent = s.abilities[k] + " (" + fmtMod(mod(s.abilities[k])) + ")";
      ab.appendChild(cell);
    });
    card.appendChild(ab);
  }
  var facts = [["Saves", s.saves], ["Skills", s.skills], ["Senses", s.senses], ["Vulnerable", s.vulnerabilities], ["Resist", s.resistances], ["Immune", s.immunities]]
    .filter(function(f){ return f[1]; });
  if(facts.length){
    var dl = ce("div", "comp-facts");
    facts.forEach(function(f){
      var p = document.createElement("p");
      p.innerHTML = "<b></b> <span></span>";
      p.firstChild.textContent = f[0] + ":";
      p.lastChild.textContent = f[1];
      dl.appendChild(p);
    });
    card.appendChild(dl);
  }

  var attacks = entryBlock("Attacks", s.attacks, function(a){
    var box = ce("div", "comp-entry-box");
    box.appendChild(textEntry({name: a.name, text: a.text + " Hit: " + diceText(a.dice, a.bonus) + " " + a.damageType + " damage" +
      (a.extraDice ? " plus " + a.extraDice + " " + a.extraType : "") + "."}));
    if(!opts.rolls){
      box.appendChild(textEntry({name: "To hit", text: fmtMod(a.toHit)}));
      return box;
    }
    var rolls = ce("div", "inv-roll-actions");
    rolls.appendChild(rollButton("Attack " + fmtMod(a.toHit), function(){ performRoll(20, 1, a.toHit, "none", name + ": " + a.name); }));
    rolls.appendChild(rollButton("Damage " + diceText(a.dice, a.bonus), function(){ rollDice(a.dice, a.bonus, name + ": " + a.name + " damage"); }));
    if(a.extraDice) rolls.appendChild(rollButton("+" + a.extraDice + " " + a.extraType, function(){ rollDice(a.extraDice, 0, name + ": " + a.name + " " + a.extraType + " damage"); }));
    box.appendChild(rolls);
    return box;
  });
  if(attacks) card.appendChild(attacks);
  var actions = entryBlock("Actions", s.actions, function(a){
    var box = ce("div", "comp-entry-box");
    box.appendChild(textEntry({name: a.name, text: (a.save ? a.save + " save. " : "") + a.text + (a.dice && !opts.rolls ? " (" + diceText(a.dice, a.bonus) + ")" : "")}));
    if(a.dice && opts.rolls){
      var rolls = ce("div", "inv-roll-actions");
      rolls.appendChild(rollButton(diceText(a.dice, a.bonus), function(){ rollDice(a.dice, a.bonus, name + ": " + a.name); }));
      box.appendChild(rolls);
    }
    return box;
  });
  if(actions) card.appendChild(actions);
  var reactions = entryBlock("Reactions", s.reactions, textEntry);
  if(reactions) card.appendChild(reactions);
  var traits = entryBlock("Traits", s.traits, textEntry);
  if(traits) card.appendChild(traits);
}

function renderCompanion(c, comp){
  var s = comp.stats, name = comp.def.name;
  if(!s) return renderSetupCard(c, comp);
  var card = makeCard(name + (s.count > 1 ? " ×" + s.count : ""));
  card.classList.add("comp-card");
  var type = ce("p", "art-intro");
  type.textContent = s.type + " · from " + comp.def.subclass;
  card.appendChild(type);
  if(comp.def.choice) card.appendChild(choiceRow(c, comp));

  renderStatBlock(card, s, name, {rolls: true, afterTiles: function(el){
    comp.hp.forEach(function(_, i){ el.appendChild(hpTracker(c, comp, i)); });
  }});
  if(isSetupMode(comp)){
    var edit = document.createElement("button");
    edit.type = "button"; edit.className = "btn small ghost comp-edit";
    edit.textContent = "Edit beast";
    edit.addEventListener("click", function(){ openBeastForm(c, comp); });
    card.appendChild(edit);
  }
  return card;
}

/* ---- Beast Master: the beast's own stat block ----
   Entered as printed (a preset fills it in); the card adds the ranger's
   proficiency bonus to AC, attacks, damage and skills, and raises its HP
   to four times the ranger level when that's higher. */
/* The companion is in "enter your own stat block" mode: setup is true, or
   names the chosen option (a beast saved before the choice existed counts). */
function isSetupMode(comp){
  var setup = comp.def.setup;
  if(setup===true) return true;
  if(!setup) return false;
  var saved = comp.choice || (comp.hasBeast ? setup : "");
  return saved===setup;
}
/* No stat block yet: pick the kind of companion (Tasha's primal beasts or
   your own), and for your own beast, open the form. */
function renderSetupCard(c, comp){
  var card = makeCard(comp.def.name);
  card.classList.add("comp-card");
  var intro = ce("p", "art-intro");
  if(comp.def.choice){
    intro.textContent = "Choose your companion: one of Tasha's primal beasts (it uses your spell attack and grows with your level), or your own beast from the PHB rules.";
    card.appendChild(intro);
    card.appendChild(choiceRow(c, comp));
  }
  if(isSetupMode(comp)){
    var own = ce("p", "art-intro");
    own.textContent = "Choose a beast no larger than Medium with a challenge rating of 1/4 or lower, and enter its stat block as printed. The sheet adds your bonuses.";
    card.appendChild(own);
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small primary";
    b.textContent = "Set up your beast";
    b.addEventListener("click", function(){ openBeastForm(c, comp); });
    card.appendChild(b);
  }
  return card;
}

var ABILITY_LABELS = {str:"STR", dex:"DEX", con:"CON", int:"INT", wis:"WIS", cha:"CHA"};
function emptyBeast(){
  return {name:"", size:"Medium", ac:12, hp:10, speed:"30 ft", abilities:{str:10, dex:10, con:10, int:3, wis:10, cha:5},
    skills:"", senses:"", traits:"", attacks:[{name:"Bite", toHit:3, dice:"1d6", bonus:1, damageType:"piercing", text:""}]};
}
function openBeastForm(c, comp){
  var saved = c.companions && c.companions[comp.def.id] && c.companions[comp.def.id].beast;
  var draft = JSON.parse(JSON.stringify(saved || emptyBeast()));
  openInfoModal(comp.def.name, function(body){
    var holder = ce("div", "beast-form");
    body.appendChild(holder);
    function input(label, value, type, onInput, wide){
      var f = ce("label", "beast-field" + (wide ? " wide" : ""));
      var span = ce("span"); span.textContent = label;
      var el = document.createElement(type==="area" ? "textarea" : "input");
      if(type!=="area") el.type = type || "text";
      el.value = value==null ? "" : value;
      el.setAttribute("aria-label", label);
      el.addEventListener("input", function(){ onInput(type==="number" ? Number(el.value) : el.value); });
      f.appendChild(span); f.appendChild(el);
      return f;
    }
    function draw(){
      holder.innerHTML = "";
      var presets = ce("div", "art-switch");
      var pl = ce("span", "comp-choice-label"); pl.textContent = "Start from:";
      presets.appendChild(pl);
      Object.keys(BEAST_PRESETS).forEach(function(k){
        var b = document.createElement("button");
        b.type = "button"; b.className = "btn small"; b.textContent = k;
        b.addEventListener("click", function(){ draft = JSON.parse(JSON.stringify(BEAST_PRESETS[k])); draw(); });
        presets.appendChild(b);
      });
      holder.appendChild(presets);
      var grid = ce("div", "beast-grid");
      grid.appendChild(input("Name", draft.name, "text", function(v){ draft.name = v; }));
      grid.appendChild(input("Size", draft.size, "text", function(v){ draft.size = v; }));
      grid.appendChild(input("AC", draft.ac, "number", function(v){ draft.ac = v; }));
      grid.appendChild(input("Hit points", draft.hp, "number", function(v){ draft.hp = v; }));
      grid.appendChild(input("Speed", draft.speed, "text", function(v){ draft.speed = v; }, true));
      holder.appendChild(grid);
      var ab = ce("div", "beast-grid beast-abilities");
      Object.keys(ABILITY_LABELS).forEach(function(k){
        ab.appendChild(input(ABILITY_LABELS[k], draft.abilities[k], "number", function(v){ draft.abilities[k] = v; }));
      });
      holder.appendChild(ab);
      var more = ce("div", "beast-grid");
      more.appendChild(input("Skills (as printed)", draft.skills, "text", function(v){ draft.skills = v; }, true));
      more.appendChild(input("Senses", draft.senses, "text", function(v){ draft.senses = v; }, true));
      holder.appendChild(more);
      draft.attacks.forEach(function(a, i){
        var t = ce("div", "comp-section-title"); t.textContent = "Attack " + (i + 1);
        holder.appendChild(t);
        var row = ce("div", "beast-grid");
        row.appendChild(input("Name", a.name, "text", function(v){ a.name = v; }));
        row.appendChild(input("To hit (as printed)", a.toHit, "number", function(v){ a.toHit = v; }));
        row.appendChild(input("Damage dice", a.dice, "text", function(v){ a.dice = v; }));
        row.appendChild(input("Damage bonus", a.bonus, "number", function(v){ a.bonus = v; }));
        row.appendChild(input("Damage type", a.damageType, "text", function(v){ a.damageType = v; }));
        row.appendChild(input("Notes", a.text, "text", function(v){ a.text = v; }, true));
        holder.appendChild(row);
      });
      var atkRow = ce("div", "art-switch");
      if(draft.attacks.length < 3){
        var add = document.createElement("button");
        add.type = "button"; add.className = "btn small ghost"; add.textContent = "+ Attack";
        add.addEventListener("click", function(){ draft.attacks.push({name:"", toHit:3, dice:"1d4", bonus:1, damageType:"", text:""}); draw(); });
        atkRow.appendChild(add);
      }
      if(draft.attacks.length > 1){
        var rm = document.createElement("button");
        rm.type = "button"; rm.className = "btn small ghost"; rm.textContent = "Remove last attack";
        rm.addEventListener("click", function(){ draft.attacks.pop(); draw(); });
        atkRow.appendChild(rm);
      }
      holder.appendChild(atkRow);
      holder.appendChild(input("Traits", draft.traits, "area", function(v){ draft.traits = v; }, true));
      var saveRow = ce("div", "cmp-give-row fp-modal-row");
      var saveBtn = document.createElement("button");
      saveBtn.type = "button"; saveBtn.className = "btn primary"; saveBtn.textContent = "Save beast";
      saveBtn.addEventListener("click", function(){
        if(!(draft.name||"").trim()){ showActionToast("Give your beast a name.", true); return; }
        setCompanionBeast(c, comp.def.id, draft);
        document.getElementById("info-modal-close").click();
        save(); renderAll();
      });
      saveRow.appendChild(saveBtn);
      holder.appendChild(saveRow);
    }
    draw();
  });
}

/* The Companions tab (shown only when the character has one). */
export function renderCompanionsPanel(c){
  var panel = document.createElement("div");
  characterCompanions(c).forEach(function(comp){ panel.appendChild(renderCompanion(c, comp)); });
  return panel;
}
