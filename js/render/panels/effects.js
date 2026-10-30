import { save } from "../../core/state.js";
import { bardDc, druidDc, druidSpellAttack, starryDice, canChangeConstellation, hasEnhancedBond, defileGround, fmtMod, characterEffects, startEffect, endEffect, pruneEffects, bladesongBonus, symbioticTempHp, haloOfSporesDie, astralArmsAttack, plainAttackRollMode, draconicBreath, classLevelOf, fightingSpiritTempHp, effectOn, mod, profBonus, maxHp, ordinal, paladinDc, favoredFoeDie, spellSlotsLeft, sanctuaryBonus, insightfulAttack, clericDc, computeSpeed, hasCondition, removeCondition } from "../../core/helpers.js";
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
    } else if(def.id==="luck_of_the_draw"){
      // The d4 decides: only a 4 turns it on.
      performRoll(4, 1, 0, "none", "Luck of the Draw", {onResult: function(r){
        if(r.total!==4) return;
        startEffect(c, def.id);
        save(); renderAll();
      }});
      return;
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
  // Starry Form, Spirit Totem: picking one starts it.
  if(def.choose && !e.on){
    if(!e.why) info.appendChild(choicePicker(c, def, false));
    return row;
  }
  // Twinkling Constellations: another constellation at the start of a turn.
  if(def.id==="starry_form" && e.on && canChangeConstellation(c)) info.appendChild(choicePicker(c, def, true));
  row.appendChild(ctrl);
  return row;
}
function choicePicker(c, def, on){
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "effect:" + def.id, groups: {"": def.choose.options}, value: on ? c.effects[def.id] : "", placeholder: def.choose.placeholder, ariaLabel: def.name + ": choose",
    onPick: function(v){
      if(on) c.effects[def.id] = v;
      else if(!startEffect(c, def.id, v)) return;
      logRoll(def.name, v + ".");
      save(); renderAll();
    }}));
  return wrap;
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
    return "+" + symbioticTempHp(c) + " temporary HP · Halo of Spores 2d" + halo + " necrotic · melee weapon attacks +1d6 necrotic";
  }
  if(id==="countercharm") return "Advantage on saves against being frightened or charmed, for you and friendly creatures within 30 ft";
  if(id==="defensive_flourish") return "+" + (Number(c.effects && c.effects.defensive_flourish)||0) + " AC";
  if(id==="mantle_of_majesty") return "Command as a bonus action each turn without a spell slot, DC " + bardDc(c) + " · creatures charmed by you fail the save";
  if(id==="unbreakable_majesty") return "The first time a creature tries to attack you on a turn: CHA save DC " + bardDc(c) + " or it can't, and picks a new target. If it saves, disadvantage on saves against your spells on your next turn";
  if(id==="shadow_disguise") return "You look like the dead person and know what it would tell a casual acquaintance · +5 to Deception against Insight";
  if(id==="spreading_spores") return "A creature entering the cube or starting its turn there: CON save DC " + druidDc(c) + " or your Halo of Spores damage, once per turn · no Halo of Spores reaction while it lasts";
  if(id==="starry_form"){
    var star = c.effects && c.effects.starry_form, wisMod = mod(abilityScore(c, "wis")), dice = starryDice(c) + "d8" + fmtMod(wisMod);
    var stars = star==="Archer" ? ["A luminous arrow as you start and as a bonus action on later turns, 60 ft, " + dice + " radiant"]
      : star==="Chalice" ? ["A healing spell with a slot: you or a creature within 30 ft also regains " + dice + " hit points"]
      : star==="Dragon" ? ["A d20 of 9 or lower counts as a 10 on INT and WIS checks and CON saves to keep concentration"].concat(canChangeConstellation(c) ? ["Fly 20 ft and hover"] : [])
      : ["Archer, Chalice or Dragon"];
    if(star && canChangeConstellation(c)) stars.push("You can change it at the start of each turn");
    if(star && classLevelOf(c, "Druid", "Circle of Stars") >= 14) stars.push("Resistance to bludgeoning, piercing and slashing");
    return stars.join(" · ");
  }
  if(id==="wildfire_spirit") return "On arrival, each creature within 10 ft of it but you: DEX save DC " + druidDc(c) + " or 2d6 fire" + (classLevelOf(c, "Druid", "Circle of Wildfire") >= 6 ? " · Enhanced Bond: +1d8 to one roll of a fire or healing spell, which can start from the spirit" : "");
  if(id==="hearth_of_moonlight") return "+5 to Stealth and Perception in the sphere, for you and your allies";
  if(id==="spirit_totem"){
    var spirit = c.effects && c.effects.spirit_totem, shepherd = classLevelOf(c, "Druid", "Circle of the Shepherd");
    var aura = spirit==="Bear" ? ["Creatures you choose in the aura as it appears: +" + (5 + shepherd) + " temporary HP", "Advantage on STR checks and saves in the aura, for you and your allies"]
      : spirit==="Hawk" ? ["Reaction: advantage on an attack roll against a target in the aura", "Advantage on Perception in the aura, for you and your allies"]
      : spirit==="Unicorn" ? ["Advantage on checks to detect creatures in the aura", "A healing spell with a slot: creatures you choose in the aura regain " + shepherd + " hit points"]
      : ["Bear, Hawk or Unicorn"];
    if(spirit && shepherd >= 10) aura.push("Guardian Spirit: your summoned beasts and fey that end their turn in it regain " + Math.floor(shepherd / 2) + " hit points");
    return aura.join(" · ");
  }
  if(id==="defile_ground"){
    var defile = defileGround(c);
    return defile.radius + "-ft radius · difficult terrain for hostile creatures · +1d" + defile.die + " necrotic the first time on a turn a creature in it takes damage from an attack or spell";
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
  if(id==="ties_that_bind") return "Sense its direction and movement while on your plane · unwilling: WIS save DC " + clericDc(c) + " · once per turn, +1d6 when a spell with a slot damages or heals it";
  if(id==="strands_of_fate") return "Your reaction: advantage or disadvantage on an attack roll or ability check by another creature you can see";
  if(id==="insightful_striking"){
    var glimpse = c.effects && c.effects.insightful_striking;
    return !glimpse ? "+1d6 on your next attack roll against it, or -1d6 on its next save against your spell"
      : insightfulAttack(c) ? "+1d6 on your next attack roll against it, offered after the roll" : "It subtracts 1d6 from its next save against a spell you cast";
  }
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
  if(id==="predicted_critical") return "A hit with your next firearm attack is a critical hit";
  if(id==="luck_of_the_draw") return "An extra reaction until the start of your next turn";
  if(id==="duel") return "Neither of you can target anyone else · both move at once, in a straight line";
  if(id==="steady_aim" || id==="take_aim") return c.effects[id]==="used" ? "Advantage used · speed 0" : "Advantage on your next attack roll · speed 0";
  return "";
}
function hasSongOfVictory(c){
  return (c.classes||[]).some(function(cl){ return cl.name==="Wizard" && cl.subclass==="Bladesinging" && (Number(cl.level)||1) >= 14; });
}

/* Roll buttons for what the effect adds that has no weapon card of its
   own: the astral arms' strikes, the Halo of Spores. (Symbiotic Entity's
   1d6 necrotic sits on each melee weapon's card.) */
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
  if(id==="ties_that_bind") buttons.push(rollButton(makeDicesSvg(), "Extra 1d6", function(){ performRoll(6, 1, 0, "none", "Ties That Bind: extra damage or healing"); }));
  if(id==="insightful_striking" && !insightfulAttack(c)) buttons.push(rollButton(makeDicesSvg(), "Its save -1d6", function(){
    performRoll(6, 1, 0, "none", "Insightful Striking: subtract from its saving throw");
    endEffect(c, "insightful_striking");
    save(); renderAll();
  }));
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
  if(id==="spreading_spores"){
    var cube = haloOfSporesDie(c);
    buttons.push(rollButton(makeDicesSvg(), "Spores 2d" + cube, function(){ performRoll(cube, 2, 0, "none", "Spreading Spores (necrotic, CON save)"); }));
  }
  if(id==="starry_form"){
    var constellation = c.effects.starry_form, n = starryDice(c), wis2 = mod(abilityScore(c, "wis")), starText = n + "d8" + fmtMod(wis2);
    if(constellation==="Archer"){
      var arrow = druidSpellAttack(c), arrowRoll = plainAttackRollMode(c);
      var arrowBtn = rollButton(makeDiceSvg(), "Arrow " + fmtMod(arrow) + (arrowRoll.mode==="dis" ? " (Dis)" : arrowRoll.mode==="adv" ? " (Adv)" : ""), function(){ rollAttack(c, arrow, arrowRoll.mode, "Starry Form: luminous arrow", {qty: n, die: 8, bonus: wis2, label: "Luminous arrow (Radiant)"}); });
      if(arrowRoll.reason) arrowBtn.title = arrowRoll.reason;
      buttons.push(arrowBtn);
      buttons.push(rollButton(makeDicesSvg(), "Radiant " + starText, function(){ performRoll(8, n, wis2, "none", "Luminous arrow (Radiant)"); }));
    }
    if(constellation==="Chalice") buttons.push(rollButton(makeDicesSvg(), "Heal " + starText, function(){
      performRoll(8, n, wis2, "none", "Chalice: hit points regained", function(r){
        if(!r) return null;
        return {lead: "For a creature within 30 ft, or:", options: [{label: "Heal yourself " + r.total, title: "You regain these hit points",
          use: function(){ c.hp.current = Math.min(maxHp(c), (Number(c.hp.current)||0) + r.total); save(); renderAll(); return {silent: true}; }}]};
      });
    }));
  }
  if(id==="wildfire_spirit"){
    buttons.push(rollButton(makeDicesSvg(), "Arrival 2d6", function(){ performRoll(6, 2, 0, "none", "Wildfire Spirit: arrival (fire, DEX save)"); }));
    if(hasEnhancedBond(c)) buttons.push(rollButton(makeDicesSvg(), "Enhanced Bond 1d8", function(){ performRoll(8, 1, 0, "none", "Enhanced Bond"); }));
  }
  if(id==="defile_ground"){
    var blight = defileGround(c);
    buttons.push(rollButton(makeDicesSvg(), "+1d" + blight.die + " necrotic", function(){ performRoll(blight.die, 1, 0, "none", "Defile Ground (necrotic)"); }));
    // Incarnation of Corruption (Blighted 14): a bonus action, if your turn started in it.
    if(classLevelOf(c, "Druid", "Circle of the Blighted") >= 14){
      var pb = profBonus(c);
      var corrupt = rollButton("", "Temp HP " + pb, function(){
        if(pb > (Number(c.hp.temp)||0)) c.hp.temp = pb;
        logRoll("Incarnation of Corruption", "Temporary hit points: " + c.hp.temp + ".");
        save(); renderAll();
      });
      corrupt.title = "Bonus action, when you start your turn inside the area";
      buttons.push(corrupt);
    }
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
