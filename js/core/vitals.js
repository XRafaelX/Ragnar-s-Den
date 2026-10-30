/* ---------------- Vitals ----------------
   Numbers worked out when shown, so feats, armor and effects never need
   bookkeeping: hit points, speed, Armor Class, initiative, saving throws
   and senses. */
import { RACE_DATA } from "../data/race-data.js";
import { ARMOR_MODELS } from "../data/artificer-extras.js";
import { ARMOR_DATA, armorDataOf } from "../data/armor.js";
import { CLASS_PROGRESSION } from "../data/progression.js";
import { featDef, featProficiencies } from "./feat-picks.js";
import { characterPickedProfs, raceChoiceEffects } from "./class-picks.js";
import { invocationSpeedSources, invocationSenses } from "./invocations.js";
import { optionEffects } from "./class-options.js";
import { styleSenses } from "./fighting-styles.js";
import { mod, fmtMod, totalLevel, profBonus } from "./basics.js";
import { halfProficiency, checkAbility } from "./checks.js";
import { findSubclass, classFeatureList } from "./class-features.js";
import { effectOn, bladesongBonus, wildSurgeNow } from "./effects.js";
import { twilightShroud } from "./cleric.js";
import { defensiveFlourish } from "./bard.js";
import { wildForm, wildShapeSpeeds, wildShapeArmorClass, wildShapeSenses, incarnationAc } from "./druid.js";
import { hasFightingStyle, isRangedWeapon } from "./equipment.js";
import { holsterSpeedParts, coinAcBonus, magicBonusOf, magicItemAcBonuses, magicItemSaveBonuses } from "./magic-items.js";
import { infusionSpeedParts } from "./infusion-effects.js";
import { abilityScore, abilityScores, abilityScoreDetail, baseScore } from "./ability-scores.js";
import { conditionSpeed, hpMaxHalved, activeConditions } from "./conditions.js";

/* ---------------- Feats the sheet applies ----------------
   Feats are matched by name. Their bonuses are worked out when shown
   rather than added to saved numbers, so taking, deleting or undoing a
   feat needs no bookkeeping. */
export function hasFeat(c, name){
  var lower = name.toLowerCase();
  return (c.feats||[]).some(function(f){ return ((f.name||"") + "").toLowerCase()===lower; });
}
/* Max HP: the saved number (hit dice, level-ups, manual changes) plus
   Tough's 2 per character level and the race's hpPerLevel (Dwarven
   Toughness: 1 per level), worked out so they follow levels and feats. */
export function toughBonus(c){
  return hasFeat(c, "Tough") ? 2 * totalLevel(c) : 0;
}
export function raceHpPerLevel(c){
  var race = RACE_DATA[c.race];
  return race && Number(race.hpPerLevel) || 0;
}
export function raceHpBonus(c){
  return raceHpPerLevel(c) * totalLevel(c);
}
/* An item that raises Constitution (an Amulet of Health) raises the hit
   point maximum by the change in modifier for every level. */
export function itemConHpBonus(c){
  if(c.wildShape) return 0; // (the form's CON, not an item's)
  var gain = mod(abilityScore(c, "con")) - mod(baseScore(c, "con"));
  return gain > 0 ? gain * totalLevel(c) : 0;
}
/* The bonuses above that apply, as [{name, value}], for tooltips. */
export function hpBonuses(c){
  var out = [];
  var tough = toughBonus(c), race = raceHpBonus(c), item = itemConHpBonus(c);
  if(tough) out.push({name:"Tough", value:tough});
  if(race) out.push({name:(RACE_DATA[c.race].hpTrait || c.race), value:race});
  if(item) out.push({name:abilityScoreDetail(c, "con").sources.join(" and "), value:item});
  return out;
}
/* The hit point maximum, halved (rounded down) from exhaustion level 4. */
export function maxHp(c){
  if(c.wildShape) return c.wildShape.max;
  var full = fullMaxHp(c);
  return hpMaxHalved(c) ? Math.max(1, Math.floor(full / 2)) : full;
}
export function fullMaxHp(c){
  return (Number(c.hp && c.hp.max)||0) + toughBonus(c) + raceHpBonus(c) + itemConHpBonus(c);
}
/* Walking speed gained from features that only count out of armor
   (`speedWhen`: "unarmored" for Unarmored Movement, "noHeavyArmor" for
   Fast Movement), by feature name: {name: {when, value}}. Level-ups add
   it to the saved speed, so computeSpeed takes it back off in armor. */
function conditionalSpeeds(cl){
  var lv = Number(cl.level)||1, out = {};
  var prog = CLASS_PROGRESSION[cl.name], sub = findSubclass(cl.name, cl.subclass);
  for(var l=1; l<=lv; l++){
    ((prog && prog.features[l]) || []).concat((sub && sub.features && sub.features[l]) || []).forEach(function(f){
      if(!f.speed || !f.speedWhen) return;
      var g = out[f.name] = out[f.name] || {when: f.speedWhen, value: 0};
      g.value += f.speed;
    });
  }
  return out;
}
/* The Strength this heavy armor needs and the character lacks (0 when
   it doesn't slow them): never for dwarves (Unslowed) or an Armorer,
   whose armor is Arcane Armor with no Strength requirement. */
export function armorStrengthShortfall(c, item){
  if(!item || item.category!=="heavy") return 0;
  // The row's own number first (Mithral Armor has none), then its armor's.
  var req = item.strReq!=null ? Number(item.strReq)||0 : ((armorDataOf(item) || {}).strReq || 0);
  if(!req || (Number(abilityScore(c, "str"))||10) >= req) return 0;
  var race = RACE_DATA[c.race];
  if(race && (race.traits||[]).some(function(t){ return t.name==="Unslowed"; })) return 0;
  var armorer = (c.classes||[]).some(function(cl){ return cl.name==="Artificer" && cl.subclass==="Armorer" && (Number(cl.level)||1) >= 3; });
  return armorer ? 0 : req;
}
/* Walking speed: the saved number plus Mobile's 10 ft, an Infiltrator
   Armorer's Powered Steps (while wearing armor) and Bladesong's 10 ft
   (while it's on), minus Unarmored or Fast Movement while armor rules
   them out and 10 ft for heavy armor worn without the Strength it needs
   (not for dwarves, or an Armorer's Arcane Armor);
   `parts` names each change ({name, value, why}) for the hint. `others` are the
   fly, swim and climb speeds from the race and from features tagged
   `speeds`, as {type, value, when, source}: always-on ones first (only
   the best of each type), then the ones that depend on something. */
export function computeSpeed(c){
  var parts = [];
  if(hasFeat(c, "Mobile")) parts.push({name: "Mobile", value: 10});
  // Feats tagged `speed` (Squat Nimbleness: 5 ft).
  var speedFeats = [];
  (c.feats||[]).forEach(function(f){
    var fd = featDef(f.name);
    if(fd && fd.speed && speedFeats.indexOf(fd)===-1){ speedFeats.push(fd); parts.push({name: fd.name, value: fd.speed}); }
  });
  var armorer = (c.classes||[]).find(function(cl){ return cl.name==="Artificer" && cl.subclass==="Armorer" && (Number(cl.level)||1) >= 3; });
  var model = armorer && ARMOR_MODELS[armorer.armorModel];
  var inArmor = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category!=="shield"; });
  if(model && model.speed && inArmor) parts.push({name: "Powered Steps", value: model.speed});
  if(effectOn(c, "bladesong")) parts.push({name: "Bladesong", value: 10});
  if(effectOn(c, "dread_ambusher")) parts.push({name: "Dread Ambusher", value: 10});
  // A Heavy Holster with no knives in it: +20 ft.
  parts = parts.concat(holsterSpeedParts(c));
  // Arcane Propulsion Armor, worn: +5 ft.
  parts = parts.concat(infusionSpeedParts(c));
  // A race choice that sets the walking speed (Fleet of Foot: 35 ft): the
  // difference from the race's own.
  var raceWalk = ((RACE_DATA[c.race] || {}).speed || {}).walk || 30;
  raceChoiceEffects(c).forEach(function(e){ if(e.walk && e.walk > raceWalk) parts.push({name: e.name, value: e.walk - raceWalk}); });
  // Walking speed a feature adds while the character has it (Roving).
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){ if(f.walkSpeed) parts.push({name: f.name, value: f.walkSpeed}); });
  });
  var worn = (c.inventory||[]).filter(function(i){ return i.type==="armor" && i.equipped; });
  var body = worn.find(function(i){ return i.category!=="shield"; });
  // A totem's speed while raging (Elk: +15 ft), not in heavy armor.
  if(c.rage && c.rage.active && !(body && body.category==="heavy")){
    optionEffects(c).forEach(function(f){ if(f.rageSpeed) parts.push({name: f.name, value: f.rageSpeed}); });
  }
  var shield = worn.some(function(i){ return i.category==="shield"; });
  (c.classes||[]).forEach(function(cl){
    var gained = conditionalSpeeds(cl);
    Object.keys(gained).forEach(function(name){
      var g = gained[name];
      var off = g.when==="unarmored" ? !!(body || shield) : g.when==="noHeavyArmor" ? !!(body && body.category==="heavy") : false;
      if(off) parts.push({name: name, value: -g.value, why: g.when==="unarmored" ? (body ? "in armor" : "with a shield") : "in heavy armor"});
    });
  });
  var strReq = armorStrengthShortfall(c, body);
  if(strReq) parts.push({name: body.name || "Heavy armor", value: -10, why: "needs STR " + strReq});
  // Wild Shape: the form's speeds, plus what your features still add.
  var form = wildForm(c);
  if(form) parts = parts.filter(function(p){ return p.value > 0; });
  var mobile = parts.reduce(function(a, p){ return a + p.value; }, 0);
  var walk = Math.max(0, (form ? form.speed.walk||0 : Number(c.speed)||0) + mobile);
  var list = [], bonus = {};
  var race = RACE_DATA[c.race];
  var rs = race && race.speed || {};
  ["fly", "swim", "climb"].forEach(function(t){
    if(rs[t]) list.push({type: t, value: rs[t], when: (race.speedWhen||{})[t] || "", source: c.race});
  });
  // A race choice's speed (a Half-Elf (Variant)'s Swim Speed; "walk" for
  // one equal to the walking speed, a Simic Hybrid's Nimble Climber).
  raceChoiceEffects(c).forEach(function(e){ ["fly", "swim", "climb"].forEach(function(t){ if(e[t]) list.push({type: t, value: e[t]==="walk" ? walk : e[t], when: "", source: e.name}); }); });
  var speedSources = [];
  (c.classes||[]).forEach(function(cl){ speedSources = speedSources.concat(classFeatureList(cl)); });
  speedSources.concat(invocationSpeedSources(c), optionEffects(c)).forEach(function(f){
    (f.speeds||[]).forEach(function(sp){
      if(sp.bonus){ bonus[sp.type] = (bonus[sp.type]||0) + sp.bonus; return; }
      var value = sp.value==="walk" ? walk : sp.value==="2walk" ? 2 * walk : sp.value;
      // (`effect`: no longer conditional while that effect is on.)
      var live = sp.effect && effectOn(c, sp.effect) && (!sp.choice || [].concat(c.effects[sp.effect]).indexOf(sp.choice)!==-1);
      list.push({type: sp.type, value: value, when: live ? "" : sp.when || "", source: f.name});
    });
  });
  list.forEach(function(o){ if(bonus[o.type]) o.value += bonus[o.type]; });
  var always = [];
  list.filter(function(o){ return !o.when; }).forEach(function(o){
    var same = always.find(function(a){ return a.type===o.type; });
    if(!same) always.push(o);
    else if(o.value > same.value){ always[always.indexOf(same)] = o; }
  });
  // A conditional speed no better than an always-on one adds nothing.
  var others = always.concat(list.filter(function(o){
    return o.when && !always.some(function(a){ return a.type===o.type && a.value >= o.value; });
  }));
  if(form) others = wildShapeSpeeds(form);
  // Wind Soul: flight shared, yours drops to 30 ft.
  if(effectOn(c, "wind_soul_shared")) others.forEach(function(o){ if(o.type==="fly" && o.source==="Wind Soul") o.value = 30; });
  // Grappled, restrained or unable to move: 0, bonuses and all. Exhaustion
  // 2 halves every speed (rounded down), 5 takes it to 0.
  // In a tortle's shell, or after Steady Aim: 0, and it can't increase.
  var hindered = conditionSpeed(c) || (effectOn(c, "shell_defense") ? {zero: "Shell Defense"} : effectOn(c, "steady_aim") ? {zero: "Steady Aim"} : effectOn(c, "take_aim") ? {zero: "Take Aim"} : null);
  if(hindered){
    var cut = function(v){ return hindered.zero ? 0 : Math.floor(v / 2); };
    walk = cut(walk);
    others.forEach(function(o){ o.value = cut(o.value); });
  }
  return { value: walk, bonus: mobile, parts: parts, others: others, hindered: hindered };
}
/* ---------------- Armor Class ----------------
   Computed from equipped armor/shield inventory items rather than a raw
   manual number, with Barbarian/Monk Unarmored Defense honored when no
   body armor is equipped. c.acMisc covers anything else (rings, feats). */
export function computeArmorClass(c){
  var shape = wildShapeArmorClass(c);
  if(shape) return shape;
  var dexMod = mod(abilityScore(c, "dex"));
  var items = (c.inventory||[]).filter(function(i){ return i.type==="armor" && i.equipped; });
  var bodyArmor = items.find(function(i){ return i.category!=="shield"; });
  var shieldBonus = items.filter(function(i){ return i.category==="shield"; })
    .reduce(function(a,i){ return a + (Number(i.baseAC)||0) + magicBonusOf(i); }, 0);
  var misc = Number(c.acMisc)||0;
  var base, breakdown, short;

  if(bodyArmor){
    var dexContribution = 0;
    if(bodyArmor.category==="light") dexContribution = dexMod;
    else if(bodyArmor.category==="medium") dexContribution = Math.min(dexMod, hasFeat(c, "Medium Armor Master") ? 3 : 2);
    var armorAC = Number(bodyArmor.baseAC)||10;
    var magic = magicBonusOf(bodyArmor);
    base = armorAC + dexContribution + magic;
    breakdown = (bodyArmor.name||"Armor") + " (" + armorAC + ")" +
      (bodyArmor.category!=="heavy" ? " + DEX (" + fmtMod(dexContribution) + ")" : "") +
      (magic ? " + magic (" + fmtMod(magic) + ")" : "");
    short = "Armor " + armorAC + (bodyArmor.category!=="heavy" ? " + DEX" : "") + (magic ? " + magic" : "");
  } else {
    // Every unarmored formula the character qualifies for; the best wins
    // (a Barbarian/Draconic Sorcerer multiclass gets whichever is higher).
    var hasClass = function(name, sub){ return (c.classes||[]).some(function(cl){ return cl.name===name && (!sub || cl.subclass===sub); }); };
    var options = [{value: 10 + dexMod, breakdown: "Unarmored: 10 + DEX (" + fmtMod(dexMod) + ")", short: "10 + DEX"}];
    if(hasClass("Barbarian")){
      var conMod = mod(abilityScore(c, "con"));
      options.push({value: 10 + dexMod + conMod, breakdown: "Unarmored Defense: 10 + DEX (" + fmtMod(dexMod) + ") + CON (" + fmtMod(conMod) + ")", short: "10 + DEX + CON"});
    }
    if(hasClass("Monk") && !items.some(function(i){ return i.category==="shield"; })){
      var wisMod = mod(abilityScore(c, "wis"));
      options.push({value: 10 + dexMod + wisMod, breakdown: "Unarmored Defense: 10 + DEX (" + fmtMod(dexMod) + ") + WIS (" + fmtMod(wisMod) + ")", short: "10 + DEX + WIS"});
    }
    if(hasClass("Sorcerer", "Draconic Bloodline")){
      options.push({value: 13 + dexMod, breakdown: "Draconic Resilience: 13 + DEX (" + fmtMod(dexMod) + ")", short: "13 + DEX"});
    }
    // A race's natural armor (Lizardfolk: 13 + DEX, Tortle: 17).
    var nat = RACE_DATA[c.race] && RACE_DATA[c.race].unarmoredAc;
    if(nat){
      var natMod = nat.ability ? mod(abilityScore(c, nat.ability)) : 0, natAb = (nat.ability || "").toUpperCase();
      options.push({value: nat.base + natMod, breakdown: nat.trait + ": " + nat.base + (natAb ? " + " + natAb + " (" + fmtMod(natMod) + ")" : ""), short: nat.base + (natAb ? " + " + natAb : "")});
    }
    // A feat's own formula (Dragon Hide: 13 + DEX).
    (c.feats||[]).forEach(function(f){
      var fd = featDef(f.name);
      if(fd && fd.unarmoredAc) options.push({value: fd.unarmoredAc + dexMod, breakdown: fd.name + ": " + fd.unarmoredAc + " + DEX (" + fmtMod(dexMod) + ")", short: fd.unarmoredAc + " + DEX"});
    });
    var best = options.reduce(function(a, o){ return o.value > a.value ? o : a; });
    base = best.value; breakdown = best.breakdown; short = best.short;
  }

  if(shieldBonus){ breakdown += " + shield (" + fmtMod(shieldBonus) + ")"; short += " + shield"; }
  // Defense needs worn armor; a shield alone doesn't count (the 2024 text
  // says "Light, Medium, or Heavy armor").
  var defense = bodyArmor && hasFightingStyle(c, "Defense") ? 1 : 0;
  if(defense){ breakdown += " + Defense style (+1)"; short += " + Defense"; }
  base += defense;
  // Agile Parry (Kensei 3): +2 until the start of your next turn.
  if(effectOn(c, "agile_parry")){ base += 2; breakdown += " + Agile Parry (+2)"; short += " + Agile Parry"; }
  // Multiattack Defense (Hunter 7): +4 against that creature for the turn.
  if(effectOn(c, "multiattack_defense")){ base += 4; breakdown += " + Multiattack Defense (+4)"; short += " + Multiattack Defense"; }
  var shroud = twilightShroud(c);
  if(shroud){ base += shroud; breakdown += " + Twilight Shroud (" + fmtMod(shroud) + ")"; short += " + Twilight Shroud"; }
  // A race's own bonus (Warforged's Integrated Protection).
  var raceAc = RACE_DATA[c.race] && Number(RACE_DATA[c.race].acBonus) || 0;
  if(raceAc){
    var acTrait = RACE_DATA[c.race].acTrait || c.race;
    breakdown += " + " + acTrait + " (" + fmtMod(raceAc) + ")"; short += " + " + acTrait;
    base += raceAc;
  }
  // A race choice's (a Simic Hybrid's Carapace: +1 unless in heavy armor).
  raceChoiceEffects(c).forEach(function(e){
    if(!e.ac || (e.acWhen==="noHeavyArmor" && bodyArmor && bodyArmor.category==="heavy")) return;
    base += e.ac; breakdown += " + " + e.name + " (" + fmtMod(e.ac) + ")"; short += " + " + e.name;
  });
  // Dual Wielder: +1 while wielding a separate melee weapon in each hand
  // (two equipped melee weapon items; a "Dagger ×2" stack is one weapon).
  var dualWielder = hasFeat(c, "Dual Wielder") &&
    (c.inventory||[]).filter(function(i){ return i.type==="weapon" && i.equipped && !isRangedWeapon(i); }).length >= 2 ? 1 : 0;
  if(dualWielder){ breakdown += " + Dual Wielder (+1)"; short += " + Dual Wielder"; }
  base += dualWielder;
  // Revenant Blade: +1 while holding a double-bladed scimitar with two
  // hands (it's two-handed, so equipped means both hands).
  var revenant = hasFeat(c, "Revenant Blade") &&
    (c.inventory||[]).some(function(i){ return i.type==="weapon" && i.equipped && i.name==="Double-Bladed Scimitar"; }) ? 1 : 0;
  if(revenant){ breakdown += " + Revenant Blade (+1)"; short += " + Revenant Blade"; }
  base += revenant;
  // Class or subclass features tagged `acHeavyArmor` (Soul of the Forge)
  // add their bonus while the character wears heavy armor.
  if(bodyArmor && bodyArmor.category==="heavy"){
    (c.classes||[]).forEach(function(cl){
      classFeatureList(cl).forEach(function(f){
        if(!f.acHeavyArmor) return;
        base += f.acHeavyArmor;
        breakdown += " + " + f.name + " (" + fmtMod(f.acHeavyArmor) + ")";
        short += " + " + f.name;
      });
    });
  }
  // Effects switched on from the Active effects card.
  if(effectOn(c, "bladesong")){
    var song = bladesongBonus(c);
    base += song; breakdown += " + Bladesong (" + fmtMod(song) + ")"; short += " + Bladesong";
  }
  if(effectOn(c, "awakened_astral_self")){
    base += 2; breakdown += " + Armor of the Spirit (+2)"; short += " + Astral Self";
  }
  if(effectOn(c, "shell_defense")){
    base += 4; breakdown += " + Shell Defense (+4)"; short += " + Shell Defense";
  }
  // A Wild Surge's protective lights while the rage lasts.
  var surge = wildSurgeNow(c);
  if(surge && surge.ac){
    base += surge.ac; breakdown += " + Wild Surge (" + fmtMod(surge.ac) + ")"; short += " + Wild Surge";
  }
  var flourish = defensiveFlourish(c);
  if(flourish){ base += flourish; breakdown += " + Defensive Flourish (" + fmtMod(flourish) + ")"; short += " + Flourish"; }
  var corrupt = incarnationAc(c);
  if(corrupt){ base += corrupt; breakdown += " + Incarnation of Corruption (+2)"; short += " + Incarnation"; }
  // A magic item's boon (Duality's angel side: +1 AC for 10 minutes).
  var coinAc = coinAcBonus(c);
  if(coinAc){ base += coinAc; breakdown += " + Duality (" + fmtMod(coinAc) + ")"; short += " + Duality"; }
  // Magic items that add to AC (a Ring of Protection, Bracers of Defense).
  magicItemAcBonuses(c).forEach(function(b){ base += b.value; breakdown += " + " + b.name + " (" + fmtMod(b.value) + ")"; short += " + " + b.name; });
  if(misc){ breakdown += " + misc (" + fmtMod(misc) + ")"; short += " + misc"; }

  return { value: base + shieldBonus + misc, breakdown: breakdown, short: short };
}

/* Initiative: DEX, plus the ability modifier of any class or subclass
   feature tagged `initiative` (Dread Ambusher adds WIS, Tactical Wit INT,
   ...; "pb" adds the proficiency bonus, e.g. Aura of the Sentinel), the Alert feat, a Harengon's Hare-Trigger and the misc modifier.
   Same shape as computeArmorClass: `breakdown` for the tooltip, `short`
   for the hint under the value. */
export function computeInitiative(c){
  var dexMod = mod(abilityScore(c, "dex"));
  var value = dexMod;
  var breakdown = "DEX (" + fmtMod(dexMod) + ")";
  var short = "DEX";
  // Initiative is a DEX check: Jack of All Trades / Remarkable Athlete.
  var half = halfProficiency(c, "dex");
  if(half){ value += half.value; breakdown += " + " + half.name + " (" + fmtMod(half.value) + ")"; short += " + " + half.name; }
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      if(!f.initiative) return;
      var bonus = f.initiative==="pb" ? profBonus(c) : mod(abilityScore(c, f.initiative));
      value += bonus;
      breakdown += " + " + f.name + " (" + fmtMod(bonus) + ")";
      short += " + " + f.initiative.toUpperCase();
    });
  });
  if(hasFeat(c, "Alert")){
    value += 5; breakdown += " + Alert (+5)"; short += " + Alert";
  }
  if(c.race==="Harengon"){
    var pb = profBonus(c);
    value += pb; breakdown += " + Hare-Trigger (" + fmtMod(pb) + ")"; short += " + PB";
  }
  var misc = Number(c.initiativeMisc)||0;
  if(misc){ value += misc; breakdown += " + misc (" + fmtMod(misc) + ")"; short += " + misc"; }
  return { value: value, breakdown: breakdown, short: short };
}

/* A saving throw: ability modifier (WIS for STR with the astral arms out), proficiency (ticked on the sheet or
   granted by a feature such as Diamond Soul) and feature bonuses such as
   Aura of Protection. `grantedBy` names the feature that makes the save
   proficient, so the sheet can lock that box. */
export function computeSave(c, key){
  var ability = checkAbility(c, key);
  var abilityMod = ability.mod;
  var grantedBy = null, bonuses = [];
  var unconscious = activeConditions(c).some(function(x){ return x.def.id==="unconscious"; });
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      if(!grantedBy && f.grants && (f.grants.savingThrows||[]).indexOf(key)!==-1) grantedBy = f.name;
      // (Aura of Protection needs you conscious.)
      if(f.saveBonus && !unconscious && !bonuses.some(function(b){ return b.name===f.name; })){
        bonuses.push({name:f.name, value: Math.max(1, mod(abilityScore(c, f.saveBonus)))});
      }
    });
  });
  // Magic items that add to every save (a Cloak of Protection).
  magicItemSaveBonuses(c).forEach(function(b){ bonuses.push(b); });
  // Half cover in a Twilight Sanctuary.
  if(key==="dex" && twilightShroud(c)) bonuses.push({name: "Twilight Shroud", value: twilightShroud(c)});
  // A save picked for a feature (Iron Mind, Elegant Courtier).
  if(!grantedBy) characterPickedProfs(c).saves.forEach(function(s){ if(!grantedBy && s.ability===key) grantedBy = s.name; });
  // Resilient: proficiency in the ability it raised.
  if(!grantedBy) featProficiencies(c).saves.forEach(function(s){ if(!grantedBy && s.ability===key) grantedBy = s.feat; });
  var prof = !!(c.saveProfs && c.saveProfs[key]) || !!grantedBy;
  var value = abilityMod + (prof ? profBonus(c) : 0);
  var breakdown = ability.label + " (" + fmtMod(abilityMod) + ")" + (prof ? " + proficiency (" + fmtMod(profBonus(c)) + ")" : "");
  bonuses.forEach(function(b){ value += b.value; breakdown += " + " + b.name + " (" + fmtMod(b.value) + ")"; });
  return { value: value, prof: prof, grantedBy: grantedBy, breakdown: breakdown };
}

/* Darkvision: the race's (from the race data) and features tagged
   `darkvision` (Eyes of the Dark 120 ft; Umbral Sight 60 ft, or +30 on top
   of the race's). {range, sources} with range 0 for none. */
export function computeDarkvision(c){
  var race = RACE_DATA[c.race];
  var range = race && Number(race.darkvision) || 0;
  // Custom Lineage: darkvision, unless its Variable Trait took a skill instead.
  if(range && race.darkvisionUnlessPicked){
    var held = ((c.racePicks && c.racePicks.profPicks) || {})["race:" + race.darkvisionUnlessPicked + ":pick"];
    if(held && (held.slots || []).some(function(s){ return (s || []).length; })) range = 0;
  }
  var sources = range ? [c.race] : [];
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      var dv = f.darkvision;
      if(!dv) return;
      var next = dv.add && range ? range + dv.add : Math.max(range, dv.range || 0);
      if(next > range){ range = next; sources.push(f.name); }
    });
  });
  // Feats tagged `darkvision` (Keenness of the Stone Giant: 60 ft, or 60 more).
  var seen = [];
  (c.feats||[]).forEach(function(f){
    var fd = featDef(f.name), dv = fd && fd.darkvision;
    if(!dv || seen.indexOf(fd)!==-1) return;
    seen.push(fd);
    var next = dv.add && range ? range + dv.add : Math.max(range, dv.range || 0);
    if(next > range){ range = next; sources.push(fd.name); }
  });
  // Options that give darkvision (the Stone rune's 120 feet).
  optionEffects(c).forEach(function(f){
    if(f.darkvision && f.darkvision.range > range){ range = f.darkvision.range; sources.push(f.name); }
  });
  // Astral Sight sees through any darkness; shown as 120 ft while the visage is out.
  if(effectOn(c, "astral_visage") && range < 120){ range = 120; sources.push("Astral Sight"); }
  return {range: range, sources: sources};
}
export function getCharacterSenses(c){
  if(c.wildShape) return wildShapeSenses(c);
  var dv = computeDarkvision(c);
  // (A class feature's own sense too: a rogue's Blindsense.)
  var extra = styleSenses(c).concat(invocationSenses(c));
  if(effectOn(c, "mortal_bulwark")) extra.push("Truesight 120 ft");
  if(effectOn(c, "revelation_in_flesh") && [].concat(c.effects.revelation_in_flesh).indexOf("Sight")!==-1) extra.push("See invisible creatures 60 ft");
  (c.classes||[]).forEach(function(cl){ classFeatureList(cl).forEach(function(f){ if(f.sense && extra.indexOf(f.sense)===-1) extra.push(f.sense); }); });
  if(!dv.range && extra.length) return extra.join(", ");
  return [dv.range ? "Darkvision " + dv.range + " ft" : "No darkvision"].concat(extra).join(", ");
}

/* Heavy Armor Master: nonmagical bludgeoning, piercing and slashing
   damage is reduced by 3 while wearing heavy armor. */
export function heavyArmorMasterActive(c){
  return hasFeat(c, "Heavy Armor Master") &&
    (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; });
}
