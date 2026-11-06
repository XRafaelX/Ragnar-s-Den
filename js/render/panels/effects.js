import { save } from "../../core/state.js";
import { isRanger2024, isPaladin2024, surprisingStrikes, rovingAim, isBarbarian2024, wizardDc, deflectingShroud, spendSpellSlot, tentacleDice, warlockDc, warlockSpellAttack, hexCurseHealing, dragonType, sorcererDc, bastionDice, bardDc, druidDc, druidSpellAttack, starryDice, canChangeConstellation, hasEnhancedBond, defileGround, fmtMod, characterEffects, startEffect, endEffect, pruneEffects, bladesongBonus, symbioticTempHp, haloOfSporesDie, astralArmsAttack, plainAttackRollMode, draconicBreath, classLevelOf, fightingSpiritTempHp, effectOn, mod, profBonus, maxHp, ordinal, paladinDc, favoredFoeDie, spellSlotsLeft, sanctuaryBonus, insightfulAttack, clericDc, computeSpeed, hasCondition, removeCondition, kiSaveDc } from "../../core/helpers.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { abilityScore } from "../../core/ability-scores.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeDiceSvg, makeDicesSvg, makeAlertSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { rollAttack } from "./sheet-rolls.js";
import { showActionToast } from "../../ui/toast.js";
import { openRevelationSheet, bastionPicker } from "./sorcerer.js";

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

  // What it does, cut to two lines and the hint to one ("…"): a tap (or
  // Enter) opens the whole text in a bottom sheet.
  var summary = effectSummary(c, def.id);
  var text = document.createElement("div");
  text.className = "fx-text";
  text.setAttribute("role", "button");
  text.tabIndex = 0;
  text.title = "Read it all";
  text.setAttribute("aria-label", "Read all of " + def.name);
  var now = document.createElement("div");
  now.className = "fx-now";
  now.textContent = summary;
  if(summary) text.appendChild(now);
  var hint = document.createElement("div");
  hint.className = "res-hint";
  hint.textContent = def.hint;
  if(def.hint) text.appendChild(hint);
  function openText(){ openEffectSheet(e, summary, costText(e)); }
  text.addEventListener("click", openText);
  text.addEventListener("keydown", function(ev){ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); openText(); } });
  info.appendChild(text);

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
    } else if(def.id==="revelation_in_flesh"){
      openRevelationSheet(c);
      return;
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
/* An effect's whole text: what it does now, how to use it, the cost and
   how long it lasts, and why it can't start (if it can't). */
function openEffectSheet(e, summary, cost){
  var def = e.def;
  openBottomSheet(function(body, refresh, close){
    var header = document.createElement("div");
    header.className = "bs-header";
    var title = document.createElement("div");
    title.className = "bs-title";
    title.textContent = def.name;
    header.appendChild(title);
    var closeBtn = document.createElement("button");
    closeBtn.className = "bs-close"; closeBtn.textContent = "✕"; closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", close);
    header.appendChild(closeBtn);
    body.appendChild(header);
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = [cost, def.duration].filter(Boolean).join(" · ");
    body.appendChild(sub);
    // One sentence a line, so a long effect reads like a short list.
    if(summary){
      var now = document.createElement("div");
      now.className = "fx-sheet-now";
      summary.split(/\. (?=\S)/).forEach(function(line){
        var p = document.createElement("p");
        p.textContent = line;
        now.appendChild(p);
      });
      body.appendChild(now);
    }
    if(def.hint){
      var hint = document.createElement("p");
      hint.className = "fx-sheet-hint";
      hint.textContent = def.hint;
      body.appendChild(hint);
    }
    var why = e.blocked || (!e.on && e.why);
    if(why){
      var note = document.createElement("p");
      note.className = "fx-sheet-hint";
      note.textContent = why;
      body.appendChild(note);
    }
  });
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
  if(e.def.cost.resource==="ki") return n + (e.resource && /Focus/.test(e.resource.name) ? " Focus" : " ki");
  if(e.def.cost.resource==="wild_shape") return n + " Wild Shape";
  if(e.def.cost.resource==="sorcery_points") return n + (n===1 ? " point" : " points");
  if(e.points) return e.points + " points";
  return n + (n===1 ? " use" : " uses");
}

/* What the effect does for this character, with the numbers worked out. */
function effectSummary(c, id){
  if(id==="bladesong"){
    var b = fmtMod(bladesongBonus(c));
    var lines = [b + " AC and +10 ft speed", "Advantage on Acrobatics checks", b + " to CON saves to keep concentration"];
    if(hasSongOfVictory(c)) lines.push(b + " to melee weapon damage (Song of Victory)");
    return lines.join(". ");
  }
  if(id==="astral_arms"){
    var arms = astralArmsAttack(c);
    return "Astral arms: " + fmtMod(arms.attack) + " to hit, 1d" + arms.die + fmtMod(arms.damage) + " force, reach 10 ft. You use WIS for Strength checks and saves";
  }
  if(id==="astral_visage") return "Astral Sight 120 ft and advantage on Insight and Intimidation checks";
  if(id==="awakened_astral_self") return "+2 AC (Armor of the Spirit)";
  if(id==="symbiotic_entity"){
    var halo = haloOfSporesDie(c);
    return "+" + symbioticTempHp(c) + " temporary HP. Halo of Spores deals 2d" + halo + " necrotic, and your melee weapon attacks deal 1d6 more necrotic";
  }
  if(id==="third_eye") return {"Darkvision": "Darkvision 60 ft", "Ethereal Sight": "See into the Ethereal Plane within 60 ft", "Greater Comprehension": "Read any language", "See Invisibility": "See invisible creatures and objects within 10 ft in your line of sight"}[c.effects && c.effects.third_eye] || "One sight of your choice";
  if(id==="arcane_deflection") return "+2 AC against that attack. You can only cast cantrips until the end of your next turn" + (deflectingShroud(c) ? ". Deflecting Shroud: up to three creatures within 60 ft take " + deflectingShroud(c) + " force damage" : "");
  if(id==="durable_magic") return "+2 AC and +2 to all saving throws";
  if(id==="adjust_density"){
    var dense = c.effects && c.effects.adjust_density, size = classLevelOf(c, "Wizard", "Graviturgy Magic") >= 10 ? "Huge" : "Large";
    return "On a " + size + " or smaller target. " + (dense==="Doubled" ? "Its weight is doubled: -10 ft speed and advantage on STR checks and saves" : dense==="Halved" ? "Its weight is halved: +10 ft speed, jumps twice as far and disadvantage on STR checks and saves" : "Halve or double its weight");
  }
  if(id==="event_horizon") return "A hostile creature starting its turn within 30 ft: STR save DC " + wizardDc(c) + " or 2d10 force and speed 0 until the start of its next turn. On a success, half damage and each foot of movement costs 2 extra feet";
  if(id==="hexblades_curse") return "+" + profBonus(c) + " to damage rolls and a critical hit on 19 or 20 against the cursed target. Your weapon cards already include them";
  if(id==="misty_escape") return "You're invisible and have advantage on attack rolls. It ends if you attack or cast a spell";
  if(id==="entropic_ward") return "Its attack has disadvantage. If it misses, your next attack against it has advantage. End this if it hit";
  if(id==="tentacle_of_the_deeps") return tentacleDice(c) + "d8 cold, and its speed drops 10 ft until the start of your next turn. A bonus action moves it 30 ft and attacks again" + (classLevelOf(c, "Warlock", "The Fathomless") >= 6 ? ". Guardian Coil: your reaction reduces damage taken within 10 ft of it" : "");
  if(id==="elemental_flight") return "Fly 30 ft and hover";
  if(id==="bottled_respite") return "Up to " + 2 * profBonus(c) + " hours, and you can hear the area around the vessel" + (classLevelOf(c, "Warlock", "The Genie") >= 10 ? ". Up to five willing creatures can come with you. 10 minutes inside counts as a short rest, and your Hit Dice heal " + profBonus(c) + " more" : "");
  if(id==="form_of_dread") return "You can't be frightened. Once per turn when you hit, the target makes a WIS save (DC " + warlockDc(c) + ") or is frightened of you until the end of your next turn" + (classLevelOf(c, "Warlock", "The Undead") >= 10 ? ". You're immune to necrotic damage" : "");
  if(id==="spirit_projection") return "Your body is unconscious, and damage to one affects the other. You resist bludgeoning, piercing and slashing damage and fly at your walking speed. Conjuration and necromancy spells need no verbal, somatic or costless material components";
  if(id==="elemental_affinity") return "Resistance to " + (dragonType(c) || "your ancestry's") + " damage";
  if(id==="dragon_wings") return "Fly " + computeSpeed(c).value + " ft";
  if(id==="draconic_presence"){
    var dread = c.effects && c.effects.draconic_presence;
    return "A 60-ft aura. A hostile creature that starts its turn in it makes a WIS save (DC " + sorcererDc(c) + ") or is " + (dread==="Fear" ? "frightened" : "charmed") + " until the aura ends. A creature that succeeds is immune for 24 hours";
  }
  if(id==="tides_of_chaos") return "Advantage on your next attack roll, ability check or saving throw";
  if(id==="trance_of_order") return "Attack rolls against you can't have advantage. On your attacks, checks and saves, a d20 of 9 or lower counts as a 10";
  if(id==="telepathic_speech"){
    var mind = classLevelOf(c, "Sorcerer", "Aberrant Mind");
    return "For " + mind + (mind===1 ? " minute" : " minutes") + ", within " + Math.max(1, mod(abilityScore(c, "cha"))) + " miles. You each need to know a language the other knows";
  }
  if(id==="revelation_in_flesh"){
    var body = [].concat(c.effects && c.effects.revelation_in_flesh || []), speed = computeSpeed(c).value;
    return body.map(function(b){ return b==="Sight" ? "See invisible creatures within 60 ft" : b==="Flight" ? "Fly " + speed + " ft and hover" : b==="Water" ? "Swim " + 2 * speed + " ft and breathe underwater" : b==="Pliable" ? "Squeeze through 1-inch gaps, and spend 5 ft of movement to escape restraints or a grapple" : ""; }).filter(Boolean).join(". ") || "One benefit for each sorcery point";
  }
  if(id==="otherworldly_wings") return "Fly 30 ft";
  if(id==="umbral_form") return "Resistance to all damage but force and radiant. You move through creatures and objects as difficult terrain, but take 5 force damage if you end your turn inside an object";
  if(id==="bastion_of_law") return bastionDice(c) + "d8 left";
  if(id==="wind_soul_shared") return "Your flying speed is 30 ft, and up to " + (3 + mod(abilityScore(c, "cha"))) + " creatures within 30 ft can fly 30 ft too";
  if(id==="lunar_light") return "Bright light for 10 ft and dim light for 10 ft more. You and creatures you choose have advantage on Investigation and Perception in it";
  if(id==="countercharm") return "Advantage on saves against being frightened or charmed, for you and friendly creatures within 30 ft";
  if(id==="defensive_flourish") return "+" + (Number(c.effects && c.effects.defensive_flourish)||0) + " AC";
  if(id==="mantle_of_majesty") return "Cast Command as a bonus action each turn without a spell slot (DC " + bardDc(c) + "). Creatures charmed by you fail the save";
  if(id==="unbreakable_majesty") return "The first time a creature tries to attack you on a turn: CHA save DC " + bardDc(c) + " or it can't, and picks a new target. If it saves, disadvantage on saves against your spells on your next turn";
  if(id==="shadow_disguise") return "You look like the dead person and know what it would tell a casual acquaintance. +5 to Deception checks against Insight";
  if(id==="spreading_spores") return "A creature that enters the cube or starts its turn there makes a CON save (DC " + druidDc(c) + ") or takes your Halo of Spores damage, once per turn. You can't use the Halo of Spores reaction while it lasts";
  if(id==="starry_form"){
    var star = c.effects && c.effects.starry_form, wisMod = mod(abilityScore(c, "wis")), dice = starryDice(c) + "d8" + fmtMod(wisMod);
    var stars = star==="Archer" ? ["A luminous arrow as you start and as a bonus action on later turns, 60 ft, " + dice + " radiant"]
      : star==="Chalice" ? ["A healing spell with a slot: you or a creature within 30 ft also regains " + dice + " hit points"]
      : star==="Dragon" ? ["A d20 of 9 or lower counts as a 10 on INT and WIS checks and CON saves to keep concentration"].concat(canChangeConstellation(c) ? ["Fly 20 ft and hover"] : [])
      : ["Archer, Chalice or Dragon"];
    if(star && canChangeConstellation(c)) stars.push("You can change it at the start of each turn");
    if(star && classLevelOf(c, "Druid", "Circle of Stars") >= 14) stars.push("Resistance to bludgeoning, piercing and slashing");
    return stars.join(". ");
  }
  if(id==="wildfire_spirit") return "On arrival, each creature within 10 ft of it, other than you, makes a DEX save (DC " + druidDc(c) + ") or takes 2d6 fire" + (classLevelOf(c, "Druid", "Circle of Wildfire") >= 6 ? ". Enhanced Bond: +1d8 to one roll of a fire or healing spell, which can start from the spirit" : "");
  if(id==="hearth_of_moonlight") return "+5 to Stealth and Perception in the sphere, for you and your allies";
  if(id==="spirit_totem"){
    var spirit = c.effects && c.effects.spirit_totem, shepherd = classLevelOf(c, "Druid", "Circle of the Shepherd");
    var aura = spirit==="Bear" ? ["Creatures you choose in the aura as it appears: +" + (5 + shepherd) + " temporary HP", "Advantage on STR checks and saves in the aura, for you and your allies"]
      : spirit==="Hawk" ? ["Reaction: advantage on an attack roll against a target in the aura", "Advantage on Perception in the aura, for you and your allies"]
      : spirit==="Unicorn" ? ["Advantage on checks to detect creatures in the aura", "A healing spell with a slot: creatures you choose in the aura regain " + shepherd + " hit points"]
      : ["Bear, Hawk or Unicorn"];
    if(spirit && shepherd >= 10) aura.push("Guardian Spirit: your summoned beasts and fey that end their turn in it regain " + Math.floor(shepherd / 2) + " hit points");
    return aura.join(". ");
  }
  if(id==="defile_ground"){
    var defile = defileGround(c);
    return "A " + defile.radius + "-ft radius of difficult terrain for hostile creatures. The first time on a turn a creature in it takes damage from an attack or spell, it takes 1d" + defile.die + " more necrotic";
  }
  if(id==="shell_defense") return "+4 AC, but your speed is 0. Advantage on STR and CON saves, disadvantage on DEX saves";
  if(id==="chromatic_warding"){
    var b = draconicBreath(c);
    return "Immune to " + (b ? b.damage.toLowerCase() : "your ancestry's") + " damage";
  }
  if(id==="raven_queen_resistance") return "Resistance to all damage";
  if(id==="sunlight") return "Disadvantage on attack rolls and Perception checks";
  if(id==="knowledge_of_the_ages") return "Proficient with " + (c.agesSkill || "the skill you chose");
  if(id==="invoke_duplicity") return (classLevelOf(c, "Cleric", "Trickery Domain") >= 17 ? "Up to four illusions of you" : "An illusion of you") + ". Move it 30 ft as a bonus action and cast spells from its space. Advantage on attacks when you and it are both within 5 ft of a creature that can see it";
  if(id==="trickery_cloak") return "You're invisible and have advantage on attack rolls";
  if(id==="twilight_sanctuary") return "When a turn ends in the sphere, a creature gets temporary hit points or stops being charmed or frightened" + (classLevelOf(c, "Cleric", "Twilight Domain") >= 17 ? ". Twilight Shroud: you and your allies have half cover in it, +2 to AC and DEX saves" : "");
  if(id==="vigilant_blessing") return "Advantage on your next initiative roll";
  if(id==="steps_of_night") return "Fly " + computeSpeed(c).value + " ft";
  if(id==="corona_of_light") return "Bright light for 60 ft. Enemies in it have disadvantage on saves against spells that deal fire or radiant damage";
  if(id==="emboldening_bond") return "A d4 on attack rolls, ability checks and saves within " + (classLevelOf(c, "Cleric", "Peace Domain") >= 17 ? 60 : 30) + " ft of a bonded creature, once per turn";
  if(id==="ties_that_bind") return "You sense its direction and movement while you're on the same plane. An unwilling target makes a WIS save (DC " + clericDc(c) + "). Once per turn, +1d6 when a spell with a slot damages or heals it";
  if(id==="strands_of_fate") return "Your reaction: advantage or disadvantage on an attack roll or ability check by another creature you can see";
  if(id==="insightful_striking"){
    var glimpse = c.effects && c.effects.insightful_striking;
    return !glimpse ? "+1d6 on your next attack roll against it, or -1d6 on its next save against your spell"
      : insightfulAttack(c) ? "+1d6 on your next attack roll against it, offered after the roll" : "It subtracts 1d6 from its next save against a spell you cast";
  }
  if(id==="hunters_mark"){
    var markDie = classLevelOf(c, "Ranger") >= 20 ? 10 : 6;
    return "+1d" + markDie + " force damage each time you hit the marked creature, on your weapon's card. Advantage on Perception and Survival checks to find it" +
      (classLevelOf(c, "Ranger") >= 17 ? ". Precise Hunter: advantage on attack rolls against it" : "") +
      (classLevelOf(c, "Ranger", "Hunter") >= 3 ? ". Hunter's Lore: you know its immunities, resistances and vulnerabilities" : "");
  }
  if(id==="dread_ambusher" && isRanger2024(c)) return "Your speed is 10 feet higher this turn";
  if(id==="natures_veil" && isRanger2024(c)) return "You're invisible until the end of your next turn";
  if(id==="favored_foe") return "+1d" + favoredFoeDie(c) + " on the first hit each turn against it, on your weapon's card";
  if(id==="primeval_awareness"){
    var mins = Number(c.effects && c.effects.primeval_awareness)||0;
    return (mins ? "For " + mins + (mins===1 ? " minute" : " minutes") + ": sense" : "Sense") + " aberrations, celestials, dragons, elementals, fey, fiends and undead within 1 mile, or 6 in your favored terrain";
  }
  if(id==="hide_in_plain_sight") return "+10 to Stealth while you stay there, without moving or taking actions or reactions";
  if(id==="dread_ambusher") return "+10 ft speed and one more attack with the Attack action. That attack deals 1d8 more on a hit, on your weapon's card";
  if(id==="multiattack_defense") return "+4 AC against that creature's later attacks this turn";
  if(id==="slayers_prey"){
    var slayer = classLevelOf(c, "Ranger", "Monster Slayer");
    return "+1d6 on your first hit against it each turn, on your weapon's card" + (slayer >= 7 ? ". +1d6 on your saves against it, offered after the roll" : "") + (slayer >= 15 ? ". Slayer's Counter: when it forces you to save, your reaction is a weapon attack, and a hit means you succeed" : "");
  }
  if(id==="writhing_tide") return "Fly 10 ft and hover";
  if(id==="sacred_weapon"){
    var sacred = (c.inventory||[]).find(function(i){ return i.id===c.sacredWeapon; });
    return "+" + Math.max(1, mod(abilityScore(c, "cha"))) + " to attack rolls with " + (sacred ? sacred.name || "your weapon" : "your weapon") +
      (isPaladin2024(c) ? ". Its hits can deal radiant damage, and it sheds bright light for 20 ft and dim light 20 ft beyond" : ", which counts as magical and sheds bright light for 20 ft");
  }
  if(id==="vow_of_enmity") return "Advantage on attack rolls against that creature" + (classLevelOf(c, "Paladin", "Oath of Vengeance") >= 15 ? (isPaladin2024(c) ? ". Soul of Vengeance: right after it attacks, your reaction is a melee attack against it" : ". Soul of Vengeance: when it attacks, your reaction is a melee weapon attack against it") : "");
  if(id==="emissary_of_peace") return "+5 to Persuasion checks";
  if(id==="peerless_athlete") return isPaladin2024(c) ? "Advantage on Athletics and Acrobatics checks. Long and high jumps go 10 ft farther" : "Advantage on Athletics and Acrobatics checks. You carry twice as much and jump 10 ft farther";
  if(id==="watchers_will") return "Advantage on INT, WIS and CHA saves, for you and the creatures you chose";
  if(id==="holy_nimbus" && isPaladin2024(c)) return "An enemy that starts its turn in your aura takes " + (Math.max(0, mod(abilityScore(c, "cha"))) + profBonus(c)) + " radiant damage. Advantage on saves a fiend or undead forces. The aura is filled with sunlight";
  if(id==="holy_nimbus") return "Each enemy that starts its turn in the bright light takes 10 radiant. Advantage on saves against spells cast by fiends or undead";
  if(id==="elder_champion" && isPaladin2024(c)) return "Spells that take an action can take a bonus action. Enemies in your aura have disadvantage on saves against your spells and Channel Divinity";
  if(id==="elder_champion") return "Paladin spells that take an action take a bonus action. Enemies within 10 ft have disadvantage on saves against your paladin spells and Channel Divinity";
  if(id==="avenging_angel" && isPaladin2024(c)) return "Fly 60 ft and hover. An enemy that starts its turn in your aura makes a WIS save (DC " + paladinDc(c) + ") or is frightened for 1 minute or until it takes damage, and attacks against it have advantage";
  if(id==="avenging_angel") return "Fly 60 ft. A 30-ft aura: a WIS save (DC " + paladinDc(c) + ") or frightened of you, and attacks against it have advantage";
  if(id==="invincible_conqueror") return "Resistance to all damage and one more attack with the Attack action. Your melee attacks score a critical hit on 19 or 20";
  if(id==="dread_lord") return "A 30-ft aura of gloom. Creatures that rely on sight have disadvantage on attacks against you and the creatures you choose";
  if(id==="living_legend") return "Advantage on CHA checks. Once on each of your turns, a miss can hit instead, and you can reroll a failed save";
  if(id==="exalted_champion") return "Resistance to nonmagical bludgeoning, piercing and slashing, and advantage on WIS saves. Allies within 30 ft have advantage on WIS saves and death saves";
  if(id==="mortal_bulwark") return "Truesight 120 ft and advantage on attacks against aberrations, celestials, elementals, fey and fiends. On a hit, a CHA save (DC " + paladinDc(c) + ") or it's banished";
  if(id==="elemental_attunement") return "Unarmed strikes reach 10 feet farther and can deal acid, cold, fire, lightning or thunder damage. On such a hit, a STR save (DC " + kiSaveDc(c) + ") or you move it up to 10 feet toward or away from you" +
    (classLevelOf(c, "Monk") >= 11 ? ". Fly and swim speeds equal to your speed" : "");
  if(id==="elemental_epitome") return "Resistance to " + (typeof c.effects.elemental_epitome==="string" ? c.effects.elemental_epitome.toLowerCase() : "the type you pick") +
    ". Step of the Wind: +20 feet and a Martial Arts die to creatures you pass. Once per turn, an unarmed hit deals one more Martial Arts die";
  if(id==="shadow_cloak") return "You're invisible, can move through occupied spaces as difficult terrain, and Flurry of Blows costs no Focus";
  if(id==="superior_defense") return "Resistance to all damage but force. Ends early if you're incapacitated";
  if(id==="empty_body") return "You're invisible and have advantage on attack rolls. Resistance to all damage but force";
  if(id==="shadow_step") return "Advantage on your first melee attack this turn";
  if(id==="cloak_of_shadows") return "You're invisible and have advantage on attack rolls";
  if(id==="agile_parry") return "+2 AC while the weapon is in your hand";
  if(id==="assassinate") return "Advantage on attack rolls, and any hit against a surprised creature is a critical hit";
  if(id==="versatile_trickster") return "Advantage on attack rolls against that creature";
  if(id==="elegant_maneuver") return "Advantage on your next Acrobatics or Athletics check";
  if(id==="insightful_fighting") return "Sneak Attack against that creature without advantage" + (classLevelOf(c, "Rogue", "Inquisitive") >= 17 ? ", with 3d6 more (Eye for Weakness)" : "");
  if(id==="shadow_walk") return "+10 ft speed and advantage on attacks. Sneak Attack dice of 1 or 2 are rolled again. Physical attacks can't target you, and Stealth checks in dim light or darkness succeed";
  if(id==="shadow_clone"){
    var ss = classLevelOf(c, "Rogue", "Shadow Stalker");
    return "Swap places with it as a bonus action, or as a reaction when you're attacked, and it takes the hit. Your attacks can come from its space" +
      (ss >= 9 ? ". You can create it in a shadow up to 60 ft away" : "") + (ss >= 13 ? ". It can look exactly like you" : "") + (ss >= 17 ? ". It attacks too (Living Shadows)" : "");
  }
  if(id==="inside_wound") return "Your next attack hits automatically and deals Sneak Attack damage";
  if(id==="ghost_walk") return "Fly 10 ft and hover, and attack rolls against you have disadvantage. You move through creatures and objects";
  if(id==="giants_might"){
    var gm = classLevelOf(c, "Fighter", "Rune Knight");
    return "You grow " + (gm >= 18 ? "Large or Huge (+5 ft reach while Huge)" : "Large") + ". Advantage on Strength checks and saves, and +1d" + (gm >= 18 ? 10 : gm >= 10 ? 8 : 6) + " damage once on each of your turns";
  }
  if(id==="fighting_spirit") return "Advantage on weapon attack rolls and +" + fightingSpiritTempHp(c) + " temporary HP";
  if(id==="reckless_attack") return "Advantage on " + (isBarbarian2024(c) ? "attack rolls using Strength" : "Strength melee weapon attacks") + ", but attacks against you have advantage too";
  if(id==="natures_veil") return "You're invisible: advantage on your attack rolls, and attacks against you have disadvantage";
  if(id==="predicted_critical") return "A hit with your next firearm attack is a critical hit";
  if(id==="luck_of_the_draw") return "An extra reaction until the start of your next turn";
  if(id==="duel") return "Neither of you can target anyone else. You both move at once, in a straight line";
  if(id==="assassinate_2024") return "Advantage on attacks against creatures that haven't had a turn. Sneak Attack hits deal +" + surprisingStrikes(c) + " damage";
  if(id==="steady_aim" && rovingAim(c)) return c.effects[id]==="used" ? "Advantage used" : "Advantage on your next attack roll";
  if(id==="steady_aim" || id==="take_aim") return c.effects[id]==="used" ? "Advantage used. Your speed is 0 until the end of your turn" : "Advantage on your next attack roll. Your speed is 0 until the end of your turn";
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
  if(id==="bastion_of_law") info.appendChild(bastionPicker(c));
  // Song of Defense (Bladesinging 10): a slot takes five times its level off the damage.
  if(id==="bladesong" && classLevelOf(c, "Wizard", "Bladesinging") >= 10){
    var defendSlots = spellSlotsLeft(c);
    if(defendSlots.length){
      var defend = document.createElement("div");
      defend.className = "res-pick";
      defend.appendChild(themedPicker({key: "song-of-defense", groups: {"": defendSlots.map(function(s, i){ return {value: String(i), label: ordinal(s.level) + "-level slot: reduce by " + 5 * s.level}; })}, value: "", placeholder: "Song of Defense...", ariaLabel: "Song of Defense: spend a spell slot",
        onPick: function(v){
          var s = defendSlots[Number(v)];
          spendSpellSlot(c, s);
          logRoll("Song of Defense", "Reduced the damage by " + 5 * s.level + ".");
          save(); renderAll();
        }}));
      info.appendChild(defend);
    }
  }
  if(id==="event_horizon") buttons.push(rollButton(makeDicesSvg(), "Force 2d10", function(){ performRoll(10, 2, 0, "none", "Event Horizon (force, STR save)"); }));
  if(id==="hexblades_curse"){
    var healed = hexCurseHealing(c), hexLv = classLevelOf(c, "Warlock", "The Hexblade");
    buttons.push(rollButton("", "It died: heal " + healed, function(){
      c.hp.current = Math.min(maxHp(c), (Number(c.hp.current)||0) + healed);
      endEffect(c, "hexblades_curse");
      logRoll("Hexblade's Curse", "The target died. Regained " + healed + " HP.");
      save(); renderAll();
    }));
    if(hexLv >= 14) buttons.push(rollButton("", "It died: move the curse", function(){ logRoll("Master of Hexes", "The curse moved to a creature within 30 ft. No hit points regained."); showActionToast("The curse moves on."); }));
    if(hexLv >= 10) buttons.push(rollButton(makeDicesSvg(), "Armor of Hexes d6", function(){
      performRoll(6, 1, 0, "none", "Armor of Hexes: 4 or higher, it misses");
    }));
  }
  if(id==="tentacle_of_the_deeps"){
    var tent = tentacleDice(c), tentHit = warlockSpellAttack(c), tentRoll = plainAttackRollMode(c);
    buttons.push(rollButton(makeDiceSvg(), "Attack " + fmtMod(tentHit), function(){ rollAttack(c, tentHit, tentRoll.mode, "Tentacle of the Deeps", {qty: tent, die: 8, bonus: 0, label: "Tentacle of the Deeps (Cold)", offerDamage: true}); }));
    buttons.push(rollButton(makeDicesSvg(), "Cold " + tent + "d8", function(){ performRoll(8, tent, 0, "none", "Tentacle of the Deeps (Cold)"); }));
    if(classLevelOf(c, "Warlock", "The Fathomless") >= 6) buttons.push(rollButton(makeDicesSvg(), "Guardian Coil " + tent + "d8", function(){ performRoll(8, tent, 0, "none", "Guardian Coil: damage reduced"); }));
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
