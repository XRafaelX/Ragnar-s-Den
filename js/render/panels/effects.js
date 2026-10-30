import { save } from "../../core/state.js";
import { fmtMod, characterEffects, startEffect, endEffect, pruneEffects, bladesongBonus, symbioticTempHp, haloOfSporesDie, astralArmsAttack, plainAttackRollMode, draconicBreath, classLevelOf, fightingSpiritTempHp, effectOn, mod, profBonus, maxHp, ordinal, paladinDc, favoredFoeDie, spellSlotsLeft, sanctuaryBonus, computeSpeed, hasCondition, removeCondition } from "../../core/helpers.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { abilityScore } from "../../core/ability-scores.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeDiceSvg, makeDicesSvg, makeAlertSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { rollAttack } from "./sheet-rolls.js";

/* ---------------- Active effects ----------------
   On the Vitals tab, only for characters with a feature they switch on
   for a while (js/data/effects.js): Bladesong, the Astral Self, Symbiotic
   Entity, Steady Aim, Nature's Veil, and race traits (a tortle's Shell Defense, a drow in sunlight). Start pays the cost from Class resources; the bonuses then show
   where they apply (AC, speed, skills, saves, senses, weapon damage), so
   the card itself only says what's on and rolls what has no other home. */
export function renderEffectsCard(c){
  // (One started from the Channel Divinity list only shows while it's on.)
  var shown = function(){ return characterEffects(c).filter(function(e){ return e.on || !e.def.channel; }); };
  var effects = shown();
  if(!effects.length) return null;
  // Symbiotic Entity ends with its temporary HP; an undone level takes the feature away.
  if(pruneEffects(c)){ save(); effects = shown(); }

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
  btn.textContent = e.on ? def.endLabel || "End" : def.startLabel || "Start";
  btn.setAttribute("aria-label", btn.textContent + " " + def.name);
  btn.disabled = !e.on && !!e.why;
  if(btn.disabled) btn.title = e.why;
  btn.addEventListener("click", function(){
    if(e.on){
      endEffect(c, def.id);
    } else {
      if(!startEffect(c, def.id)) return;
      var gain = def.id==="symbiotic_entity" ? " Temporary HP: " + c.hp.temp + "." : "";
      logRoll(def.name, (def.startLabel ? def.startLabel : "Started") + " (" + costText(e) + ")." + gain);
    }
    save(); renderAll();
  });
  ctrl.appendChild(btn);
  // Primeval Awareness: the slot picked is what pays.
  if(def.slotPick && !e.on){
    if(!e.why) info.appendChild(slotPicker(c, def));
    return row;
  }
  row.appendChild(ctrl);
  return row;
}
function slotPicker(c, def){
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  var items = spellSlotsLeft(c).filter(function(s){ return !s.pact; }).map(function(s){
    return {value: String(s.level), label: ordinal(s.level) + "-level slot: " + s.level + (s.level===1 ? " minute" : " minutes")};
  });
  wrap.appendChild(themedPicker({key: "effect:" + def.id, groups: {"": items}, value: "", placeholder: "Spend a spell slot...", ariaLabel: "Spend a spell slot on " + def.name,
    onPick: function(v){
      if(!startEffect(c, def.id, Number(v))) return;
      logRoll(def.name, "Sensing for " + v + (v==="1" ? " minute." : " minutes."));
      save(); renderAll();
    }}));
  return wrap;
}

function costText(e){
  if(e.slot) return ordinal(e.slot) + "-level slot";
  if(e.def.slotPick) return "A spell slot";
  if(!e.def.cost || (e.resource && e.resource.max===Infinity)) return "Free";
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
  if(id==="shell_defense") return "+4 AC · advantage on STR and CON saves · disadvantage on DEX saves · speed 0";
  if(id==="chromatic_warding"){
    var b = draconicBreath(c);
    return "Immune to " + (b ? b.damage.toLowerCase() : "your ancestry's") + " damage";
  }
  if(id==="raven_queen_resistance") return "Resistance to all damage";
  if(id==="sunlight") return "Disadvantage on attack rolls and Perception checks";
  if(id==="knowledge_of_the_ages") return "Proficient with " + (c.agesSkill || "the skill you chose");
  if(id==="invoke_duplicity") return (classLevelOf(c, "Cleric", "Trickery Domain") >= 17 ? "Up to four illusions of you" : "An illusion of you") + " · move as a bonus action, 30 ft · cast spells from its space · advantage on attacks when you and it are both within 5 ft of a creature that can see it";
  if(id==="trickery_cloak") return "Invisible · advantage on attack rolls";
  if(id==="twilight_sanctuary") return "When a turn ends in the sphere: temporary hit points, or end charmed or frightened" + (classLevelOf(c, "Cleric", "Twilight Domain") >= 17 ? " · Twilight Shroud: half cover in it for you and your allies, +2 to AC and DEX saves" : "");
  if(id==="vigilant_blessing") return "Advantage on your next initiative roll";
  if(id==="steps_of_night") return "Fly " + computeSpeed(c).value + " ft";
  if(id==="corona_of_light") return "Bright light 60 ft · enemies in it have disadvantage on saves against spells that deal fire or radiant damage";
  if(id==="emboldening_bond") return "A d4 on attack rolls, ability checks and saves within " + (classLevelOf(c, "Cleric", "Peace Domain") >= 17 ? 60 : 30) + " ft of a bonded creature, once per turn";
  if(id==="favored_foe") return "+1d" + favoredFoeDie(c) + " on the first hit each turn against it, on your weapon's card";
  if(id==="primeval_awareness"){
    var mins = Number(c.effects && c.effects.primeval_awareness)||0;
    return (mins ? "For " + mins + (mins===1 ? " minute" : " minutes") + ": sense" : "Sense") + " aberrations, celestials, dragons, elementals, fey, fiends and undead within 1 mile, or 6 in your favored terrain";
  }
  if(id==="hide_in_plain_sight") return "+10 to Stealth while you stay there, without moving or taking actions or reactions";
  if(id==="dread_ambusher") return "+10 ft speed · one more attack with the Attack action · +1d8 on that attack's hit, on your weapon's card";
  if(id==="multiattack_defense") return "+4 AC against that creature's later attacks this turn";
  if(id==="slayers_prey"){
    var slayer = classLevelOf(c, "Ranger", "Monster Slayer");
    return "+1d6 on the first hit each turn, on your weapon's card" + (slayer >= 7 ? " · +1d6 on saves it forces, offered after the roll" : "") + (slayer >= 15 ? " · Slayer's Counter: your reaction is a weapon attack before the save, and a hit means you succeed" : "");
  }
  if(id==="writhing_tide") return "Fly 10 ft and hover";
  if(id==="sacred_weapon"){
    var sacred = (c.inventory||[]).find(function(i){ return i.id===c.sacredWeapon; });
    return "+" + Math.max(1, mod(abilityScore(c, "cha"))) + " to attack rolls with " + (sacred ? sacred.name || "your weapon" : "your weapon") + " · it's magical · bright light 20 ft";
  }
  if(id==="vow_of_enmity") return "Advantage on attack rolls against that creature" + (classLevelOf(c, "Paladin", "Oath of Vengeance") >= 15 ? " · Soul of Vengeance: when it attacks, your reaction is a melee weapon attack against it" : "");
  if(id==="emissary_of_peace") return "+5 to Persuasion checks";
  if(id==="peerless_athlete") return "Advantage on Athletics and Acrobatics · carry twice as much · +10 ft on long and high jumps";
  if(id==="watchers_will") return "Advantage on INT, WIS and CHA saves, for you and the creatures you chose";
  if(id==="holy_nimbus") return "10 radiant to each enemy that starts its turn in the bright light · advantage on saves against spells cast by fiends or undead";
  if(id==="elder_champion") return "1-action paladin spells as a bonus action · enemies within 10 ft have disadvantage on saves against your paladin spells and Channel Divinity";
  if(id==="avenging_angel") return "Fly 60 ft · 30-ft aura: WIS save DC " + paladinDc(c) + " or frightened of you, and attacks against it have advantage";
  if(id==="invincible_conqueror") return "Resistance to all damage · one more attack with the Attack action · melee attacks crit on 19 or 20";
  if(id==="dread_lord") return "30-ft aura of gloom · creatures that rely on sight have disadvantage on attacks against you and those you choose";
  if(id==="living_legend") return "Advantage on CHA checks · one miss on each of your turns hits · reroll a failed save";
  if(id==="exalted_champion") return "Resistance to nonmagical bludgeoning, piercing and slashing · advantage on WIS saves · allies within 30 ft: advantage on WIS saves and death saves";
  if(id==="mortal_bulwark") return "Truesight 120 ft · advantage on attacks against aberrations, celestials, elementals, fey and fiends · on a hit, CHA save DC " + paladinDc(c) + " or banished";
  if(id==="empty_body") return "Invisible · advantage on attack rolls · resistance to all damage but force";
  if(id==="shadow_step") return "Advantage on your first melee attack this turn";
  if(id==="cloak_of_shadows") return "Invisible · advantage on attack rolls";
  if(id==="agile_parry") return "+2 AC while the weapon is in your hand";
  if(id==="assassinate") return "Advantage on attack rolls · critical damage on any hit against a surprised creature";
  if(id==="versatile_trickster") return "Advantage on attack rolls against that creature";
  if(id==="elegant_maneuver") return "Advantage on your next Acrobatics or Athletics check";
  if(id==="insightful_fighting") return "Sneak Attack against that creature without advantage" + (classLevelOf(c, "Rogue", "Inquisitive") >= 17 ? " · +3d6 Sneak Attack (Eye for Weakness)" : "");
  if(id==="ghost_walk") return "Fly 10 ft and hover · attack rolls against you have disadvantage · move through creatures and objects";
  if(id==="giants_might"){
    var gm = classLevelOf(c, "Fighter", "Rune Knight");
    return (gm >= 18 ? "Large or Huge (reach +5 ft while Huge)" : "Large") + " · advantage on Strength checks and saves · +1d" + (gm >= 18 ? 10 : gm >= 10 ? 8 : 6) + " damage once on each of your turns";
  }
  if(id==="fighting_spirit") return "Advantage on weapon attack rolls · +" + fightingSpiritTempHp(c) + " temporary HP";
  if(id==="reckless_attack") return "Advantage on Strength melee weapon attacks · attacks against you have advantage";
  if(id==="natures_veil") return "Invisible · advantage on your attack rolls · attacks against you have disadvantage";
  if(id==="steady_aim") return c.effects.steady_aim==="used" ? "Advantage used · speed 0" : "Advantage on your next attack roll · speed 0";
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
    var armsRoll = plainAttackRollMode(c);
    var armsBtn = rollButton(makeDiceSvg(), "Attack " + fmtMod(arms.attack) + (armsRoll.mode==="dis" ? " (Dis)" : armsRoll.mode==="adv" ? " (Adv)" : ""), function(){ rollAttack(c, arms.attack, armsRoll.mode, "Astral arms: Attack", {qty: 1, die: arms.die, bonus: arms.damage, melee: true, label: "Astral arms"}); });
    if(armsRoll.reason) armsBtn.title = armsRoll.reason;
    buttons.push(armsBtn);
    buttons.push(rollButton(makeDicesSvg(), "Damage 1d" + arms.die + fmtMod(arms.damage), function(){ performRoll(arms.die, 1, arms.damage, "none", "Astral arms: Damage (force)"); }));
    if(arms.empowered) buttons.push(rollButton(makeDicesSvg(), "Empowered +1d" + arms.die, function(){ performRoll(arms.die, 1, 0, "none", "Empowered Arms (once per turn)"); }));
    buttons.push(rollButton(makeDicesSvg(), "Arrival 2d" + arms.die, function(){ performRoll(arms.die, 2, 0, "none", "Arms of the Astral Self: arrival (force, DEX save)"); }));
  }
  // Deflect Energy (Body of the Astral Self, 11): arms and visage both out.
  if(id==="astral_visage" && classLevelOf(c, "Monk", "Way of the Astral Self") >= 11 && effectOn(c, "astral_arms")){
    var wis = mod(abilityScore(c, "wis"));
    var de = rollButton(makeDicesSvg(), "Deflect Energy 1d10" + fmtMod(wis), function(){
      performRoll(10, 1, wis, "none", "Deflect Energy: damage reduced", {adjust: function(r){ return r.total < 1 ? {total: 1, note: "at least 1"} : null; }});
    });
    de.title = "Reaction, when you take acid, cold, fire, force, lightning or thunder damage";
    buttons.push(de);
  }
  if(id==="twilight_sanctuary"){
    var dusk = sanctuaryBonus(c);
    buttons.push(rollButton(makeDicesSvg(), "Temp HP 1d6+" + dusk, function(){
      performRoll(6, 1, dusk, "none", "Twilight Sanctuary: temporary hit points", function(r){
        if(!r) return null;
        return {lead: "For whoever ended their turn in it, or:", options: [{label: "Take " + r.total + " yourself", title: "Temporary hit points don't stack: you keep the higher",
          use: function(){
            if(r.total > (Number(c.hp.temp)||0)) c.hp.temp = r.total;
            save(); renderAll();
            return {silent: true};
          }}]};
      });
    }));
    // The other benefit, on you: ends a charm or a fright, so the sheet can too.
    ["charmed", "frightened"].forEach(function(cond){
      if(!hasCondition(c, cond)) return;
      var ease = rollButton("", "End " + cond, function(){
        removeCondition(c, cond);
        logRoll("Twilight Sanctuary", "Ended " + cond + ".");
        save(); renderAll();
      });
      ease.title = "Instead of temporary hit points, when your turn ends in the sphere";
      buttons.push(ease);
    });
  }
  if(id==="elder_champion"){
    var regain = rollButton("", "Regain 10 HP", function(){
      c.hp.current = Math.min(maxHp(c), (Number(c.hp.current)||0) + 10);
      logRoll("Elder Champion", "Regained 10 HP at the start of your turn.");
      save(); renderAll();
    });
    regain.title = "At the start of each of your turns";
    regain.disabled = (Number(c.hp.current)||0) >= maxHp(c);
    buttons.push(regain);
  }
  if(id==="dread_lord"){
    var dreadCha = mod(abilityScore(c, "cha")), dreadAtk = profBonus(c) + dreadCha;
    buttons.push(rollButton(makeDicesSvg(), "Aura 4d10 psychic", function(){ performRoll(10, 4, 0, "none", "Dread Lord: a frightened enemy starts its turn in the aura (Psychic)"); }));
    buttons.push(rollButton(makeDiceSvg(), "Shadows " + fmtMod(dreadAtk), function(){ rollAttack(c, dreadAtk, "none", "Dread Lord: shadows attack", {qty: 3, die: 10, bonus: dreadCha, label: "Dread Lord shadows (Necrotic)", offerDamage: true}); }));
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
