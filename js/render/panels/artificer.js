import { save } from "../../core/state.js";
import { fmtMod, ce, maxHp } from "../../core/helpers.js";
import {
  armorerEntry, alchemistEntry, wearingBodyArmor, setArmorModel, armorModelWeapon, armorModelPerks, armorModelsFor, armorModelDef, artificerLevel,
  elixirState, elixirEffect, elixirEffectsFor, chooseElixir, freeElixirCount, freeElixirsLeft, rollFreeElixirs, brewElixirWithSlot, useElixir, elixirRolls
} from "../../core/artificer.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";
import { showActionToast } from "../../ui/toast.js";

/* ---- Artificer cards on the Inventory tab ----
   Armorer: pick the armor model; its special weapon gets roll buttons and
   its perks are listed. Alchemist: the experimental elixirs on hand, with
   rolls for the free ones and a spell slot for more. */

function rollButton(text, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn";
  b.innerHTML = makeDiceSvg() + text;
  b.addEventListener("click", onClick);
  return b;
}
function diceLabel(d, bonus){ return d.qty + "d" + d.die + (bonus ? fmtMod(bonus) : ""); }

export function renderArmorModelCard(c){
  var cl = armorerEntry(c);
  if(!cl) return null;
  var card = makeCard("Arcane Armor");
  var intro = ce("p", "art-intro");
  intro.textContent = cl.armorModel ? "Your armor model. Change it after a short or long rest with smith's tools."
    : "Choose your armor model. You can change it after a short or long rest with smith's tools.";
  card.appendChild(intro);

  var switcher = ce("div", "art-switch");
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "Armor model");
  Object.keys(armorModelsFor(cl)).forEach(function(name){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn small" + (cl.armorModel===name ? " primary" : "");
    b.setAttribute("aria-pressed", cl.armorModel===name ? "true" : "false");
    b.textContent = name;
    b.addEventListener("click", function(){ setArmorModel(c, name); save(); renderAll(); });
    switcher.appendChild(b);
  });
  card.appendChild(switcher);
  if(!cl.armorModel) return card;

  if(!wearingBodyArmor(c)){
    var warn = ce("p", "art-warn");
    warn.textContent = "Equip your armor above: the model's weapon and perks only work while you wear it.";
    card.appendChild(warn);
  }
  var w = armorModelWeapon(c);
  var weapon = ce("div", "art-weapon");
  var head = ce("div", "art-weapon-head");
  head.innerHTML = "<strong></strong><span></span>";
  head.firstChild.textContent = w.name;
  head.lastChild.textContent = w.diceText + " " + w.type + " · " + w.range + " · uses " + w.ability.toUpperCase() +
    (w.infusion ? " · " + w.infusion + (w.magic ? " " + fmtMod(w.magic) : "") : "");
  weapon.appendChild(head);
  var note = ce("p", "art-note");
  note.textContent = w.note;
  weapon.appendChild(note);
  var rolls = ce("div", "inv-roll-actions");
  rolls.appendChild(rollButton("Attack " + fmtMod(w.toHit), function(){ performRoll(20, 1, w.toHit, "none", w.name + ": Attack"); }));
  rolls.appendChild(rollButton("Damage " + diceLabel(w.dice, w.damageBonus), function(){ performRoll(w.dice.die, w.dice.qty, w.damageBonus, "none", w.name + ": Damage"); }));
  if(w.extra) rolls.appendChild(rollButton("+" + w.extraText + " (once per turn)", function(){ performRoll(w.extra.die, w.extra.qty, 0, "none", w.name + ": Extra damage"); }));
  weapon.appendChild(rolls);
  card.appendChild(weapon);

  // The 2024 Guardian's Defensive Field: while bloodied, no limit.
  var def = armorModelDef(c);
  if(def && def.bloodiedField){
    var lvl = artificerLevel(c), bloodied = (Number(c.hp.current)||0) <= Math.floor(maxHp(c) / 2);
    var fieldRow = ce("div", "inv-roll-actions");
    var fb = document.createElement("button");
    fb.type = "button"; fb.className = "btn small inv-roll-btn";
    fb.textContent = "Defensive Field: temp HP " + lvl;
    fb.disabled = !bloodied || !wearingBodyArmor(c);
    fb.title = !wearingBodyArmor(c) ? "Wear your Arcane Armor" : bloodied ? "Bonus action while bloodied" : "Only while bloodied (half your hit points or fewer)";
    fb.addEventListener("click", function(){
      if(lvl > (Number(c.hp.temp)||0)) c.hp.temp = lvl;
      logRoll("Defensive Field", "Temporary hit points: " + c.hp.temp + ".");
      save(); renderAll();
    });
    fieldRow.appendChild(fb);
    card.appendChild(fieldRow);
  }
  var perks = armorModelPerks(c);
  if(perks.length){
    var ul = ce("ul", "art-perks");
    perks.forEach(function(p){ var li = document.createElement("li"); li.textContent = p; ul.appendChild(li); });
    card.appendChild(ul);
  }
  return card;
}

export function renderElixirCard(c){
  var cl = alchemistEntry(c);
  if(!cl) return null;
  var st = elixirState(c);
  var card = makeCard("Experimental elixirs");
  var is2024 = cl.subclass==="Alchemist (2024)";
  var max = freeElixirCount(Number(cl.level)||3, is2024 ? "2024" : ""), left = freeElixirsLeft(c);
  var intro = ce("p", "art-intro");
  intro.textContent = max + " free elixir" + (max > 1 ? "s" : "") + " per long rest, rolled on a d6" + (is2024 ? " (a 6 lets you choose)" : "") + ". They last until drunk or your next long rest, when new ones are rolled." +
    (is2024 ? " Drinking one, or giving it to a creature within 5 feet, is a bonus action." : "");
  card.appendChild(intro);
  if(left){
    var rollFree = rollButton("Roll " + left + " free elixir" + (left > 1 ? "s" : ""), function(){
      var made = rollFreeElixirs(c);
      logRoll("Experimental elixirs", made.join(", "));
      save(); renderAll();
    });
    rollFree.classList.add("primary");
    card.appendChild(rollFree);
  }

  if(!st.list.length){
    var none = ce("p", "art-note");
    none.textContent = "No elixirs on hand.";
    card.appendChild(none);
  }
  st.list.forEach(function(e){
    var effect = elixirEffect(e.name, c) || {text: ""};
    var row = ce("div", "art-elixir");
    var head = ce("div", "art-weapon-head");
    head.innerHTML = "<strong></strong><span></span>";
    head.firstChild.textContent = e.name;
    head.lastChild.textContent = e.free ? "Free" : "Spell slot";
    row.appendChild(head);
    var text = ce("p", "art-note");
    text.textContent = e.choose ? "You rolled a 6: choose its effect." : effect.text;
    row.appendChild(text);
    if(e.choose){
      var pick = ce("div", "field inf-field");
      pick.appendChild(themedPicker({key: "elixir:" + e.id, ariaLabel: "Effect for this elixir", placeholder: "Choose its effect…",
        groups: {"": elixirEffectsFor(c).map(function(x){ return x.name; })}, value: "",
        onPick: function(v){ if(chooseElixir(c, e.id, v)){ save(); renderAll(); } }}));
      row.appendChild(pick);
    }
    var rolls = ce("div", "inv-roll-actions");
    elixirRolls(c, e.name).forEach(function(r){
      rolls.appendChild(rollButton(r.label + " " + diceLabel(r.dice, r.bonus), function(){ performRoll(r.dice.die, r.dice.qty, r.bonus, "none", e.name + " elixir: " + r.label); }));
    });
    var used = document.createElement("button");
    used.type = "button"; used.className = "btn small ghost";
    used.textContent = "Used";
    used.title = "Drunk or given away: remove it";
    used.addEventListener("click", function(){ useElixir(c, e.id); save(); renderAll(); });
    rolls.appendChild(used);
    row.appendChild(rolls);
    card.appendChild(row);
  });

  var brew = ce("div", "art-brew");
  var brewLbl = ce("p", "art-note");
  brewLbl.textContent = "Brew another with a spell slot (you choose the effect, and it uses your lowest slot left):";
  brew.appendChild(brewLbl);
  var effects = ce("div", "art-switch");
  elixirEffectsFor(c).forEach(function(ef){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small";
    b.textContent = ef.name;
    b.addEventListener("click", function(){
      var slot = brewElixirWithSlot(c, ef.name);
      if(!slot){ showActionToast("No spell slots left to brew with.", true); return; }
      showActionToast("Brewed " + ef.name + " with a level " + slot + " slot.");
      save(); renderAll();
    });
    effects.appendChild(b);
  });
  brew.appendChild(effects);
  card.appendChild(brew);
  return card;
}
