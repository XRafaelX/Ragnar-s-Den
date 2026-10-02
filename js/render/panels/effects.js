import { save } from "../../core/state.js";
import { fmtMod, characterEffects, startEffect, endEffect, pruneEffects, bladesongBonus, symbioticTempHp, haloOfSporesDie, astralArmsAttack } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeDiceSvg, makeDicesSvg, makeAlertSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";

/* ---------------- Active effects ----------------
   On the Vitals tab, only for characters with a feature they switch on
   for a while (js/data/effects.js): Bladesong, the Astral Self, Symbiotic
   Entity. Start pays the cost from Class resources; the bonuses then show
   where they apply (AC, speed, skills, saves, senses, weapon damage), so
   the card itself only says what's on and rolls what has no other home. */
export function renderEffectsCard(c){
  var effects = characterEffects(c);
  if(!effects.length) return null;
  // Symbiotic Entity ends with its temporary HP; an undone level takes the feature away.
  if(pruneEffects(c)){ save(); effects = characterEffects(c); }

  var card = makeCard("Active effects");
  var list = document.createElement("div");
  list.className = "res-list";
  effects.forEach(function(e){ list.appendChild(effectRow(c, e)); });
  card.appendChild(list);
  return card;
}

function effectRow(c, e){
  var def = e.def;
  var row = document.createElement("div");
  row.className = "res-row fx-row" + (e.on ? " on" : "");

  var info = document.createElement("div");
  info.className = "res-info";
  var name = document.createElement("div");
  name.className = "res-name";
  name.textContent = def.name;
  var cost = document.createElement("span");
  cost.className = "res-reset";
  cost.textContent = costText(e);
  name.appendChild(cost);
  var duration = document.createElement("span");
  duration.className = "res-reset";
  duration.textContent = def.duration;
  name.appendChild(duration);
  info.appendChild(name);

  var now = document.createElement("div");
  now.className = "fx-now";
  now.textContent = effectSummary(c, def.id);
  info.appendChild(now);
  var hint = document.createElement("div");
  hint.className = "res-hint";
  hint.textContent = def.hint;
  info.appendChild(hint);

  if(e.blocked || (!e.on && e.why)){
    var note = document.createElement("div");
    note.className = "fx-note" + (e.blocked ? " warn" : "");
    if(e.blocked) note.innerHTML = makeAlertSvg();
    note.appendChild(document.createTextNode(e.blocked || e.why));
    info.appendChild(note);
  }
  if(e.on && !e.blocked) appendRolls(c, def.id, info);
  row.appendChild(info);

  var ctrl = document.createElement("div");
  ctrl.className = "res-ctrl";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn small" + (e.on ? "" : " primary");
  btn.textContent = e.on ? "End" : "Start";
  btn.setAttribute("aria-label", (e.on ? "End " : "Start ") + def.name);
  btn.disabled = !e.on && !!e.why;
  if(btn.disabled) btn.title = e.why;
  btn.addEventListener("click", function(){
    if(e.on){
      endEffect(c, def.id);
    } else {
      if(!startEffect(c, def.id)) return;
      var gain = def.id==="symbiotic_entity" ? " Temporary HP: " + c.hp.temp + "." : "";
      logRoll(def.name, "Started (" + costText(e) + ")." + gain);
    }
    save(); renderAll();
  });
  ctrl.appendChild(btn);
  row.appendChild(ctrl);
  return row;
}

function costText(e){
  if(e.resource && e.resource.max===Infinity) return "Free";
  var n = e.def.cost.amount;
  if(e.def.cost.resource==="ki") return n + " ki";
  if(e.def.cost.resource==="wild_shape") return n + " Wild Shape";
  return n + (n===1 ? " use" : " uses");
}

/* What the effect does for this character, with the numbers worked out. */
function effectSummary(c, id){
  if(id==="bladesong"){
    var b = fmtMod(bladesongBonus(c));
    var lines = [b + " AC", "+10 ft speed", "advantage on Acrobatics", b + " to CON saves to keep concentration"];
    if(hasSongOfVictory(c)) lines.push(b + " melee weapon damage (Song of Victory)");
    return lines.join(" · ");
  }
  if(id==="astral_arms"){
    var arms = astralArmsAttack(c);
    return "Astral arms: " + fmtMod(arms.attack) + " to hit, 1d" + arms.die + fmtMod(arms.damage) + " force, reach 10 ft · WIS for Strength checks and saves";
  }
  if(id==="astral_visage") return "Astral Sight 120 ft · advantage on Insight and Intimidation";
  if(id==="awakened_astral_self") return "+2 AC (Armor of the Spirit)";
  if(id==="symbiotic_entity"){
    var halo = haloOfSporesDie(c);
    return "+" + symbioticTempHp(c) + " temporary HP · Halo of Spores 2d" + halo + " necrotic · melee weapon attacks +1d6 poison";
  }
  return "";
}
function hasSongOfVictory(c){
  return (c.classes||[]).some(function(cl){ return cl.name==="Wizard" && cl.subclass==="Bladesinging" && (Number(cl.level)||1) >= 14; });
}

/* Roll buttons for what the effect adds that has no weapon card of its
   own: the astral arms' strikes, the Halo of Spores. (Symbiotic Entity's
   1d6 poison sits on each melee weapon's card.) */
function appendRolls(c, id, info){
  var buttons = [];
  if(id==="astral_arms"){
    var arms = astralArmsAttack(c);
    buttons.push(rollButton(makeDiceSvg(), "Attack " + fmtMod(arms.attack), function(){ performRoll(20, 1, arms.attack, "none", "Astral arms: Attack"); }));
    buttons.push(rollButton(makeDicesSvg(), "Damage 1d" + arms.die + fmtMod(arms.damage), function(){ performRoll(arms.die, 1, arms.damage, "none", "Astral arms: Damage (force)"); }));
    if(arms.empowered) buttons.push(rollButton(makeDicesSvg(), "Empowered +1d" + arms.die, function(){ performRoll(arms.die, 1, 0, "none", "Empowered Arms (once per turn)"); }));
    buttons.push(rollButton(makeDicesSvg(), "Arrival 2d" + arms.die, function(){ performRoll(arms.die, 2, 0, "none", "Arms of the Astral Self: arrival (force, DEX save)"); }));
  }
  if(id==="symbiotic_entity"){
    var halo = haloOfSporesDie(c);
    buttons.push(rollButton(makeDicesSvg(), "Halo 2d" + halo, function(){ performRoll(halo, 2, 0, "none", "Halo of Spores (necrotic, CON save)"); }));
  }
  if(!buttons.length) return;
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  buttons.forEach(function(b){ row.appendChild(b); });
  info.appendChild(row);
}
function rollButton(icon, text, onRoll){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn";
  b.innerHTML = icon;
  b.appendChild(document.createTextNode(text));
  b.addEventListener("click", onRoll);
  return b;
}
