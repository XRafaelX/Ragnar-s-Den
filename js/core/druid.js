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
import { classLevelOf, isDruid2024 } from "./class-features.js";
import { entryChoices } from "./class-picks.js";
import { LAND_WARDS } from "../data/druid-2024.js";
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
  // The 2024 table (p. 81): swimming at any level, no elementals; the Moon's
  // Circle Forms reach a third of the druid level (p. 86).
  if(isDruid2024(c)){
    var cr24 = lv >= 8 ? 1 : lv >= 4 ? 1/2 : 1/4;
    if(moon) cr24 = Math.max(cr24, Math.floor(lv / 3));
    return {cr: cr24, fly: lv >= 8, swim: true, elemental: false, hours: Math.max(1, Math.floor(lv / 2))};
  }
  var cr = lv >= 8 ? 1 : lv >= 4 ? 1/2 : 1/4;
  if(moon) cr = lv >= 6 ? Math.floor(lv / 3) : 1;
  return {cr: cr, fly: lv >= 8, swim: lv >= 4, elemental: moon && lv >= 10, hours: Math.max(1, Math.floor(lv / 2))};
}
/* Every form the druid's level (and circle) allows. */
export function wildShapeEligible(c){
  var limit = wildShapeLimit(c);
  return WILD_SHAPE_FORMS.filter(function(f){
    if(WILD_SHAPE_ELEMENTALS.indexOf(f.name)!==-1) return limit.elemental;
    return crValue(f.cr) <= limit.cr && (limit.fly || !f.speed.fly) && (limit.swim || !f.speed.swim);
  });
}
/* ---- The 2024 druid's Known Forms (p. 80) ----
   Four Beast forms at level 2, six at 4, eight at 8 (the Beast Shapes
   table), one swapped after each long rest. Saved on the druid's class
   entry as `wildShapeForms`. Until any is chosen, every eligible form is
   offered (an older sheet keeps working). */
export var KNOWN_FORMS_SUGGESTED = ["Rat", "Riding Horse", "Spider", "Wolf"];
function druid2024Entry(c){
  return (c.classes||[]).find(function(cl){ return cl.name==="Druid" && cl.edition==="2024"; }) || null;
}
export function knownFormsMax(c){
  var cl = druid2024Entry(c), lv = cl ? Number(cl.level)||1 : 0;
  return lv >= 8 ? 8 : lv >= 4 ? 6 : lv >= 2 ? 4 : 0;
}
/* The forms the druid has chosen ([] for a 2014 druid or none chosen yet). */
export function knownForms(c){
  var cl = druid2024Entry(c);
  return cl && Array.isArray(cl.wildShapeForms) ? cl.wildShapeForms.slice() : [];
}
export function learnForm(c, name){
  var cl = druid2024Entry(c);
  if(!cl || knownForms(c).length >= knownFormsMax(c) || knownForms(c).indexOf(name)!==-1) return false;
  if(!wildShapeEligible(c).some(function(f){ return f.name===name; })) return false;
  cl.wildShapeForms = knownForms(c).concat([name]);
  return true;
}
export function forgetForm(c, name){
  var cl = druid2024Entry(c);
  if(!cl) return false;
  cl.wildShapeForms = knownForms(c).filter(function(n){ return n!==name; });
  return true;
}
/* The forms the druid can take now: a 2024 druid's known ones (once any
   are chosen) that the level still allows, else every eligible form. */
export function wildShapeOptions(c){
  var eligible = wildShapeEligible(c), known = knownForms(c);
  if(!known.length) return eligible;
  return eligible.filter(function(f){ return known.indexOf(f.name)!==-1; });
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
  // The 2024 Wild Shape keeps your own hit points, with temporary ones on top
  // (three times the druid level for the Moon). They don't stack: keep the higher.
  if(isDruid2024(c)){
    c.wildShape = {form: name, own: true};
    var temp = wildShapeTempHp(c);
    if(!c.hp) c.hp = {max: 0, current: 0, temp: 0};
    if(temp > (Number(c.hp.temp)||0)) c.hp.temp = temp;
    return true;
  }
  c.wildShape = {form: name, max: form.hp, normal: c.wildShape ? c.wildShape.normal : Number(c.hp.current)||0};
  c.hp.current = form.hp;
  return true;
}
/* Back to the character's own shape and hit points. */
export function endWildShape(c){
  if(!c.wildShape) return;
  if(!c.wildShape.own) c.hp.current = c.wildShape.normal;
  delete c.wildShape;
}
/* The form's stat block while transformed, or null. */
export function wildForm(c){
  return c.wildShape ? wildShapeForm(c.wildShape.form) : null;
}
/* Damage reaches a form: at 0 hit points you turn back and what's left
   carries over. How much still hits the character, or -1 while the form
   holds. */
/* The 2024 form's temporary hit points: the druid level, three times it for
   the Moon (Circle Forms). */
export function wildShapeTempHp(c){
  var lv = druidLevel(c);
  return circle(c, "Circle of the Moon") >= 3 && isDruid2024(c) ? 3 * lv : lv;
}
export function wildShapeDamage(c, n){
  if(c.wildShape && c.wildShape.own) return n;
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
  // Circle Forms (2024 Moon 3): 13 + WIS when that's higher.
  if(isDruid2024(c) && circle(c, "Circle of the Moon") >= 3 && 13 + wisMod(c) > value){
    value = 13 + wisMod(c); breakdown = "Circle Forms: 13 + WIS (" + wisMod(c) + ")"; short = form.name + " + Circle Forms";
  }
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
  return circle(c, "Circle of the Moon") >= 6 && !isDruid2024(c);
}
/* Combat Wild Shape (2014 Moon 2): a spell slot heals the form. */
export function hasCombatWildShape(c){
  return circle(c, "Circle of the Moon") >= 2 && !isDruid2024(c);
}
/* Improved Circle Forms (2024 Moon 6): WIS to CON saves in a form. */
export function moonConBonus(c){
  return c.wildShape && isDruid2024(c) && circle(c, "Circle of the Moon") >= 6 ? wisMod(c) : 0;
}
function druidEntry(c){ return (c.classes||[]).find(function(cl){ return cl.name==="Druid"; }) || null; }
/* Elemental Fury (2024 druid 7): the option picked, or "". */
export function elementalFury(c){
  var cl = druidEntry(c);
  return cl && cl.edition==="2024" && (Number(cl.level)||1) >= 7 ? entryChoices(cl, "elementalFury")[0] || "" : "";
}
export function druidPotentSpellcasting(c){ return elementalFury(c)==="Potent Spellcasting"; }
/* Primal Strike's and Lunar Form's dice on a beast form's attack, shaped
   like rangerHitDice. */
export function formHitDice(c){
  var out = [];
  if(elementalFury(c)==="Primal Strike"){
    var n = druidLevel(c) >= 15 ? 2 : 1;
    out.push({id: "primal_strike", name: "Primal Strike", text: "Primal Strike +" + n + "d8", qty: n, die: 8, label: "Primal Strike (Cold, Fire, Lightning or Thunder)", title: "Once on each of your turns, on a hit"});
  }
  if(isDruid2024(c) && circle(c, "Circle of the Moon") >= 14) out.push({id: "lunar_form", name: "Lunar Form", text: "Lunar Form +2d10", qty: 2, die: 10, label: "Lunar Form (Radiant)", title: "Once per turn, on a hit"});
  return out;
}
/* Land's Aid (2024 Land 3): its dice, 2d6, 3d6 from 10, 4d6 from 14. 0 without it. */
export function landsAidDice(c){
  var lv = isDruid2024(c) ? circle(c, "Circle of the Land") : 0;
  return lv >= 14 ? 4 : lv >= 10 ? 3 : lv >= 3 ? 2 : 0;
}
/* Nature's Ward (2024 Land 10): the land's damage type, or "". */
export function landWard(c){
  var cl = druidEntry(c);
  if(!cl || cl.edition!=="2024" || cl.subclass!=="Circle of the Land (2024)" || (Number(cl.level)||1) < 10) return "";
  return LAND_WARDS[(cl.spellChoices||{}).land] || "";
}
/* Wrath of the Sea's d6s: the WIS modifier, at least one. */
export function wrathDice(c){ return Math.max(1, wisMod(c)); }
/* Resistances from a 2024 circle: Nature's Ward, Stormborn. */
export function druidResistances(c){
  var out = [], ward = landWard(c);
  if(ward) out.push({type: ward, source: "Nature's Ward"});
  if(effectOn(c, "wrath_of_the_sea") && circle(c, "Circle of the Sea") >= 10) ["cold", "lightning", "thunder"].forEach(function(t){ out.push({type: t, source: "Stormborn"}); });
  return out;
}
/* Beast Spells (druid 18). */
export function hasBeastSpells(c){
  return druidLevel(c) >= 18;
}
/* What the Spells tab says while transformed, or "". */
export function wildShapeSpellNote(c){
  if(!c.wildShape) return "";
  if(hasBeastSpells(c) && isDruid2024(c)) return "Beast Spells: you can cast spells in this form, except one with a material component that has a cost or is consumed.";
  if(isDruid2024(c) && circle(c, "Circle of the Moon") >= 3) return "You can cast your Circle of the Moon spells in this form. Other spells wait until you turn back. Concentration keeps going.";
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
  // Primal Strike (2024 Elemental Fury): any weapon hit, once on each of your turns.
  var primal = formHitDice(c).filter(function(d){ return d.id==="primal_strike"; }).map(function(d){ return Object.assign({unarmed: false}, d); });
  if(primal.length) return primal.concat(druidHitDice2014(c, melee));
  return druidHitDice2014(c, melee);
}
function druidHitDice2014(c, melee){
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
