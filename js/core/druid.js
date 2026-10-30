/* ---------------- Druid ----------------
   Wild Shape and what the circles add to it, checked against the Player's
   Handbook, Xanathar's Guide and Tasha's Cauldron on 5etools' data
   2026-10-30, and Tal'Dorei Reborn (pp. 171-174) for the Circle of the
   Blighted.

   While transformed, c.wildShape = {form, max, normal}: c.hp.current is the
   form's hit points (so every heal and rest reads them as it always does),
   `normal` holds the character's own until they turn back. The form's STR,
   DEX and CON replace theirs in ability-scores.js; AC, speed, senses and
   skills ask here. */
import { mod, profBonus } from "./basics.js";
import { classLevelOf } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { resourceLeft, effectOn, endEffect } from "./effects.js";
import { characterResources } from "./character-resources.js";
import { WILD_SHAPE_FORMS, WILD_SHAPE_ELEMENTALS, wildShapeForm } from "../data/wild-shapes.js";

var USES = "Druid:wild_shape";
function druidLevel(c){ return classLevelOf(c, "Druid"); }
function circle(c, name){ return classLevelOf(c, "Druid", name); }
function wisMod(c){ return mod(abilityScore(c, "wis")); }

export function druidDc(c){ return 8 + profBonus(c) + wisMod(c); }
export function druidSpellAttack(c){ return profBonus(c) + wisMod(c); }
function crValue(cr){
  var p = String(cr).split("/");
  return p.length===2 ? Number(p[0]) / Number(p[1]) : Number(cr);
}
/* The Beast Shapes table, or the Circle Forms table for the Moon: the
   highest challenge rating, whether flying and swimming speeds are
   allowed, and the hours a form lasts. */
export function wildShapeLimit(c){
  var lv = druidLevel(c), moon = circle(c, "Circle of the Moon") > 0;
  var cr = lv >= 8 ? 1 : lv >= 4 ? 1/2 : 1/4;
  if(moon) cr = lv >= 6 ? Math.floor(lv / 3) : 1;
  return {cr: cr, fly: lv >= 8, swim: lv >= 4, elemental: moon && lv >= 10, hours: Math.max(1, Math.floor(lv / 2))};
}
export function wildShapeOptions(c){
  var limit = wildShapeLimit(c);
  return WILD_SHAPE_FORMS.filter(function(f){
    if(WILD_SHAPE_ELEMENTALS.indexOf(f.name)!==-1) return limit.elemental;
    return crValue(f.cr) <= limit.cr && (limit.fly || !f.speed.fly) && (limit.swim || !f.speed.swim);
  });
}
/* Elemental Wild Shape takes two uses at once. */
export function wildShapeCost(name){
  return WILD_SHAPE_ELEMENTALS.indexOf(name)!==-1 ? 2 : 1;
}
/* Why this form can't be taken now, or "". */
export function wildShapeProblem(c, name){
  if(!wildShapeOptions(c).some(function(f){ return f.name===name; })) return "Not one of your forms yet.";
  var res = characterResources(c).find(function(r){ return r.key===USES; });
  if(!res) return "You don't have Wild Shape yet.";
  if(res.max!==Infinity && res.max - res.used < wildShapeCost(name)) return "Not enough Wild Shape uses left.";
  return "";
}
/* Transform (another use while in a form changes it): pays, ends Symbiotic
   Entity (it lasts until you use Wild Shape again), and keeps the
   character's own hit points. False if it can't. */
export function startWildShape(c, name){
  if(wildShapeProblem(c, name)) return false;
  var res = characterResources(c).find(function(r){ return r.key===USES; });
  if(res.max!==Infinity){
    if(!c.resourcesUsed) c.resourcesUsed = {};
    c.resourcesUsed[USES] = res.used + wildShapeCost(name);
  }
  endEffect(c, "symbiotic_entity");
  var form = wildShapeForm(name);
  c.wildShape = {form: name, max: form.hp, normal: c.wildShape ? c.wildShape.normal : Number(c.hp.current)||0};
  c.hp.current = form.hp;
  return true;
}
/* Back to the character's own shape and hit points. */
export function endWildShape(c){
  if(!c.wildShape) return;
  c.hp.current = c.wildShape.normal;
  delete c.wildShape;
}
/* The form's stat block while transformed, or null. */
export function wildForm(c){
  return c.wildShape ? wildShapeForm(c.wildShape.form) : null;
}
/* Damage reaches a form: at 0 hit points you turn back and what's left
   carries over. How much still hits the character, or -1 while the form
   holds. */
export function wildShapeDamage(c, n){
  var left = (Number(c.hp.current)||0) - n;
  if(left > 0){ c.hp.current = left; return -1; }
  endWildShape(c);
  return -left;
}
/* The form's AC, with what the Circle of the Blighted adds to it. */
export function wildShapeArmorClass(c){
  var form = wildForm(c);
  if(!form) return null;
  var value = form.ac, breakdown = form.name + " (" + form.ac + ")", short = form.name;
  if(circle(c, "Circle of the Blighted")){ value += 2; breakdown += " + Blighted Shape (+2)"; short += " + Blighted Shape"; }
  var corrupt = incarnationAc(c);
  if(corrupt){ value += corrupt; breakdown += " + Incarnation of Corruption (+2)"; short += " + Incarnation"; }
  return {value: value, breakdown: breakdown, short: short};
}
/* Incarnation of Corruption (Blighted 14): +2 AC. */
export function incarnationAc(c){
  return circle(c, "Circle of the Blighted") >= 14 ? 2 : 0;
}
/* The form's speeds other than walking, shaped like computeSpeed's `others`. */
export function wildShapeSpeeds(form){
  return ["fly", "swim", "climb", "burrow"].filter(function(t){ return form.speed[t]; }).map(function(t){
    return {type: t, value: form.speed[t], when: "", source: form.name};
  });
}
/* Only the form's senses count. Blighted Shape gives it darkvision 60 ft,
   or 60 ft more. */
export function wildShapeSenses(c){
  var form = wildForm(c), list = form.senses ? form.senses.split(", ") : [];
  if(circle(c, "Circle of the Blighted")){
    var at = list.findIndex(function(s){ return /^darkvision/.test(s); });
    if(at===-1) list.push("darkvision 60 ft");
    else list[at] = "darkvision " + (parseInt(list[at].replace(/\D/g, ""), 10) + 60) + " ft";
  }
  if(!list.length) return "No special senses";
  var text = list.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
/* The form's bonus with a skill, or null. */
export function wildShapeSkill(c, skill){
  var form = wildForm(c);
  return form && form.skills && form.skills[skill]!=null ? form.skills[skill] : null;
}
/* Primal Strike (Moon 6). */
export function hasPrimalStrike(c){
  return circle(c, "Circle of the Moon") >= 6;
}
/* Combat Wild Shape (Moon 2): a spell slot heals the form. */
export function hasCombatWildShape(c){
  return circle(c, "Circle of the Moon") >= 2;
}
/* Beast Spells (druid 18). */
export function hasBeastSpells(c){
  return druidLevel(c) >= 18;
}
/* What the Spells tab says while transformed, or "". */
export function wildShapeSpellNote(c){
  if(!c.wildShape) return "";
  return hasBeastSpells(c) ? "Beast Spells: you can cast your druid spells in this form, but you can't provide material components."
    : "You can't cast spells in this form. Spells you are already concentrating on keep going.";
}

/* ---- Circle of Stars ---- */
export function starryConstellation(c){
  return effectOn(c, "starry_form") ? c.effects.starry_form : "";
}
/* The Archer's and Chalice's dice: 1d8, 2d8 from level 10. */
export function starryDice(c){
  return circle(c, "Circle of Stars") >= 10 ? 2 : 1;
}
/* The Dragon: a d20 of 9 or lower counts as a 10. */
export function starryDragon(c){
  return starryConstellation(c)==="Dragon";
}
export function canChangeConstellation(c){
  return circle(c, "Circle of Stars") >= 10;
}
/* Cosmic Omen (Stars 6): Weal or Woe until the next long rest. */
export function setCosmicOmen(c, roll){
  c.cosmicOmen = roll % 2===0 ? "Weal" : "Woe";
  return c.cosmicOmen;
}
export function omenOnLongRest(c){
  if(circle(c, "Circle of Stars") < 6) return "";
  return setCosmicOmen(c, Math.floor(Math.random() * 6) + 1);
}

/* ---- Circle of the Land ---- */
/* Natural Recovery: half the druid level, rounded up, in slot levels. */
export function naturalRecoveryBudget(c){
  return Math.ceil(circle(c, "Circle of the Land") / 2);
}
/* The spent slots a recovery can give back, lowest first: [{level, spent}].
   None of them can be 6th level or higher. */
export function recoverableSlots(c){
  var slots = (c.spellcasting && c.spellcasting.slots) || {}, out = [];
  for(var l = 1; l <= 5; l++){
    var s = slots[l];
    if(s && (Number(s.used)||0) > 0) out.push({level: l, spent: Number(s.used)});
  }
  return out;
}
/* picked = {level: count}. False if it costs more than the budget. */
export function recoverSlots(c, picked, budget){
  var cost = Object.keys(picked).reduce(function(n, l){ return n + Number(l) * picked[l]; }, 0);
  if(!cost || cost > budget) return false;
  Object.keys(picked).forEach(function(l){
    var s = c.spellcasting.slots[l];
    s.used = Math.max(0, (Number(s.used)||0) - picked[l]);
  });
  return true;
}

/* ---- Circle of Dreams ---- */
/* Balm of the Summer Court: up to half the druid level in dice at once. */
export function balmDiceLimit(c){
  return Math.max(1, Math.floor(circle(c, "Circle of Dreams") / 2));
}

/* ---- Circle of Wildfire ---- */
export function hasEnhancedBond(c){
  return circle(c, "Circle of Wildfire") >= 6 && effectOn(c, "wildfire_spirit");
}
export function blazingRevivalReady(c){
  return circle(c, "Circle of Wildfire") >= 14 && effectOn(c, "wildfire_spirit") && resourceLeft(c, "Druid:blazing_revival") > 0;
}
export function useBlazingRevival(c, hpMax){
  if(!blazingRevivalReady(c)) return false;
  c.resourcesUsed["Druid:blazing_revival"] = (c.resourcesUsed["Druid:blazing_revival"]||0) + 1;
  endEffect(c, "wildfire_spirit");
  if(c.companions && c.companions.wildfire_spirit) c.companions.wildfire_spirit.hp = [0];
  c.hp.current = Math.floor(hpMax / 2);
  c.deathSaves = {success: 0, fail: 0};
  return true;
}

/* ---- Circle of Spores ---- */
/* Symbiotic Entity's extra die on a melee weapon attack, shaped like
   rangerHitDice. */
export function druidHitDice(c, melee){
  return melee && effectOn(c, "symbiotic_entity") ? [{id: "symbiotic_entity", name: "Symbiotic Entity", text: "+1d6 necrotic", qty: 1, die: 6,
    label: "Symbiotic Entity (Necrotic)", title: "Symbiotic Entity: extra necrotic damage on a hit", unarmed: true}] : [];
}

/* ---- Circle of the Shepherd ---- */
export function totemSpirit(c){
  return effectOn(c, "spirit_totem") ? c.effects.spirit_totem : "";
}
export function faithfulSummonsReady(c){
  return circle(c, "Circle of the Shepherd") >= 14 && resourceLeft(c, "Druid:faithful_summons") > 0;
}

/* ---- Circle of the Blighted ---- */
/* Defile Ground's die and radius: d4 and 10 ft, d6 and 20 ft from 10, d8 from 14. */
export function defileGround(c){
  var lv = circle(c, "Circle of the Blighted");
  return {die: lv >= 14 ? 8 : lv >= 10 ? 6 : 4, radius: lv >= 10 ? 20 : 10};
}
