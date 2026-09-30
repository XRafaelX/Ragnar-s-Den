import { save } from "../../core/state.js";
import { fmtMod, mod, ce, parseDiceNotation } from "../../core/helpers.js";
import { characterCompanions, setCompanionHp } from "../../core/companions.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";

/* ---- Companion cards (Vitals tab) ----
   One stat card per companion (js/data/companions.js): AC, HP tracker
   (one per copy, e.g. two cannons), speed, ability scores, then attacks
   and actions with roll buttons, reactions and traits as text. */
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

function renderCompanion(c, comp){
  var s = comp.stats, name = comp.def.name;
  var card = makeCard(name + (s.count > 1 ? " ×" + s.count : ""));
  card.classList.add("comp-card");
  var type = ce("p", "art-intro");
  type.textContent = s.type + " · from " + comp.def.subclass;
  card.appendChild(type);

  var tiles = ce("div", "comp-tiles");
  [["AC", s.ac], ["Max HP", s.hp], ["Speed", s.speed]].forEach(function(t){
    var tile = ce("div", "comp-tile");
    tile.innerHTML = "<span class='lbl'></span><span class='val'></span>";
    tile.firstChild.textContent = t[0];
    tile.lastChild.textContent = t[1];
    tiles.appendChild(tile);
  });
  card.appendChild(tiles);
  comp.hp.forEach(function(_, i){ card.appendChild(hpTracker(c, comp, i)); });

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
  var facts = [["Saves", s.saves], ["Skills", s.skills], ["Senses", s.senses], ["Immune", s.immunities]].filter(function(f){ return f[1]; });
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
    box.appendChild(textEntry({name: a.name, text: a.text + " Hit: " + diceText(a.dice, a.bonus) + " " + a.damageType + " damage."}));
    var rolls = ce("div", "inv-roll-actions");
    rolls.appendChild(rollButton("Attack " + fmtMod(a.toHit), function(){ performRoll(20, 1, a.toHit, "none", name + ": " + a.name); }));
    rolls.appendChild(rollButton("Damage " + diceText(a.dice, a.bonus), function(){ rollDice(a.dice, a.bonus, name + ": " + a.name + " damage"); }));
    box.appendChild(rolls);
    return box;
  });
  if(attacks) card.appendChild(attacks);
  var actions = entryBlock("Actions", s.actions, function(a){
    var box = ce("div", "comp-entry-box");
    box.appendChild(textEntry({name: a.name, text: (a.save ? a.save + " save. " : "") + a.text}));
    if(a.dice){
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
  return card;
}

export function renderCompanionCards(c){
  return characterCompanions(c).map(function(comp){ return renderCompanion(c, comp); });
}
