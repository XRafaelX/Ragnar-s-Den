/* ---------------- Warlock ----------------
   The pact weapon and the patrons' moving parts (checked against the
   Player's Handbook, Sword Coast Adventurer's Guide, Xanathar's Guide,
   Tasha's Cauldron and Van Richten's Guide on 5etools' data 2026-10-30). */
import { mod, profBonus } from "./basics.js";
import { classLevelOf } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { resourceLeft, spendResource, effectOn } from "./effects.js";
import { knownInvocations } from "./invocations.js";

function warlockLevel(c){ return classLevelOf(c, "Warlock"); }
function patron(c, name){ return classLevelOf(c, "Warlock", name); }
function chaMod(c){ return mod(abilityScore(c, "cha")); }

export function warlockDc(c){ return 8 + profBonus(c) + chaMod(c); }
export function warlockSpellAttack(c){ return profBonus(c) + chaMod(c); }
/* The warlock knows this invocation. */
export function hasInvocation(c, name){
  return (c.classes||[]).some(function(cl){ return cl.name==="Warlock" && knownInvocations(cl).some(function(i){ return i.name===name; }); });
}

/* ---- Pact of the Blade ---- */
export function hasPactOfTheBlade(c){
  return (c.classes||[]).some(function(cl){ return cl.name==="Warlock" && cl.pactBoon==="Pact of the Blade"; });
}
/* A weapon marked as the pact weapon on its card. */
export function isPactWeapon(c, item){
  return !!(item && item.pactWeapon) && hasPactOfTheBlade(c);
}
/* Improved Pact Weapon: +1 to attack and damage, unless it already has a bonus. */
export function pactWeaponBonus(c, item){
  return isPactWeapon(c, item) && hasInvocation(c, "Improved Pact Weapon") && !(Number(item.magicBonus)||0) ? 1 : 0;
}
/* The pact slots left and their level, or null. */
function pactSlot(c){
  var pact = c.spellcasting && c.spellcasting.pact;
  var left = pact ? (Number(pact.max)||0) - (Number(pact.used)||0) : 0;
  return left > 0 ? {level: Number(pact.slotLevel)||1, left: left, pact: true} : null;
}
/* What a warlock's hit adds, shaped like rangerHitDice. `flat`: a number
   with no die. `paySlot`: Eldritch Smite spends a pact slot. item is null
   for an unarmed strike. */
export function warlockHitDice(c, item){
  var out = [], pb = profBonus(c);
  if(isPactWeapon(c, item) && hasInvocation(c, "Lifedrinker")){
    var drink = Math.max(1, chaMod(c));
    out.push({id: "lifedrinker", name: "Lifedrinker", text: "+" + drink + " necrotic", flat: drink, qty: 0, die: 0, label: "Lifedrinker (Necrotic)", title: "On a hit with your pact weapon", unarmed: false});
  }
  var slot = isPactWeapon(c, item) && hasInvocation(c, "Eldritch Smite") && pactSlot(c);
  if(slot) out.push({id: "eldritch_smite", name: "Eldritch Smite", text: "Eldritch Smite " + (1 + slot.level) + "d8", qty: 1 + slot.level, die: 8, label: "Eldritch Smite (Force)",
    title: "Once per turn on a hit: spend a pact slot. You can knock a Huge or smaller target prone.", unarmed: false, paySlot: slot});
  var genie = genieDamage(c);
  if(genie) out.push({id: "genies_wrath", name: "Genie's Wrath", text: "+" + pb + " " + genie, flat: pb, qty: 0, die: 0, label: "Genie's Wrath (" + genie + ")", title: "Once on each of your turns, on a hit with an attack roll", unarmed: true});
  // Grave Touched: one more die in Form of Dread, when the damage is necrotic.
  var die = item && /d(\d+)/.exec(item.damageDice || "");
  if(die && patron(c, "The Undead") >= 6 && effectOn(c, "form_of_dread")) out.push({id: "grave_touched", name: "Grave Touched", text: "+1d" + die[1] + " necrotic", qty: 1, die: Number(die[1]), label: "Grave Touched (Necrotic)", title: "Once on each of your turns, if you change the damage to necrotic", unarmed: false});
  return out;
}

/* ---- The Fiend ---- */
export function darkOnesBlessing(c){
  return Math.max(1, chaMod(c) + warlockLevel(c));
}
export var DAMAGE_TYPES = ["Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning", "Necrotic", "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder"];

/* ---- The Hexblade ---- */
/* Hexblade's Curse: the bonus to damage while it's on. */
export function hexCurseBonus(c){
  return effectOn(c, "hexblades_curse") ? profBonus(c) : 0;
}
export function hexCurseHealing(c){
  return Math.max(1, warlockLevel(c) + chaMod(c));
}

/* ---- The Celestial ---- */
/* Celestial Resilience (10): {self, others}, or null. */
export function celestialResilience(c){
  var lv = patron(c, "The Celestial");
  return lv >= 10 ? {self: lv + chaMod(c), others: Math.floor(lv / 2) + chaMod(c)} : null;
}
/* At the end of a rest: the temporary hit points, keeping the higher. */
export function resilienceOnRest(c){
  var r = celestialResilience(c);
  if(!r) return null;
  if(r.self > (Number(c.hp.temp)||0)) c.hp.temp = r.self;
  return r;
}
export function searingVengeanceReady(c){
  return resourceLeft(c, "Warlock:searing_vengeance") > 0;
}

/* ---- The Fathomless ---- */
/* Tentacle of the Deeps and Guardian Coil: 1d8, 2d8 from 10. */
export function tentacleDice(c){
  return patron(c, "The Fathomless") >= 10 ? 2 : 1;
}

/* ---- The Genie ---- */
var GENIE_DAMAGE = {Dao: "bludgeoning", Djinni: "thunder", Efreeti: "fire", Marid: "cold"};
export function genieDamage(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Warlock" && x.subclass==="The Genie"; });
  return cl ? GENIE_DAMAGE[(cl.spellChoices||{}).genieKind] || "" : "";
}
/* Sanctuary Vessel (10): a rest in the vessel adds this to Hit Dice. */
export function vesselHitDieBonus(c){
  return patron(c, "The Genie") >= 10 && effectOn(c, "bottled_respite") ? profBonus(c) : 0;
}

/* ---- Limited Wish and Necrotic Husk: back after 1d4 long rests ---- */
/* Spends it and rolls how many long rests it takes. The roll, or 0. */
export function spendForRests(c, key){
  if(!spendResource(c, key, 1)) return 0;
  var n = Math.floor(Math.random() * 4) + 1;
  c.restWait = c.restWait || {};
  c.restWait[key] = n;
  return n;
}
export function restWaitOnLongRest(c){
  Object.keys(c.restWait||{}).forEach(function(key){
    c.restWait[key] -= 1;
    if(c.restWait[key] <= 0){
      delete c.restWait[key];
      if(c.resourcesUsed) delete c.resourcesUsed[key];
    }
  });
}

/* ---- The Undead ---- */
export function formOfDreadTemp(c){
  return Math.floor(Math.random() * 10) + 1 + patron(c, "The Undead");
}
export function necroticHuskReady(c){
  return resourceLeft(c, "Warlock:necrotic_husk") > 0;
}

/* Resistances a patron gives by choice or state, for the HP card's line. */
export function warlockResistances(c){
  var out = [];
  if(patron(c, "The Fiend") >= 10 && c.fiendishResist) out.push({type: c.fiendishResist.toLowerCase() + " (not from magical or silvered weapons)", source: "Fiendish Resilience"});
  var genie = patron(c, "The Genie") >= 6 && genieDamage(c);
  if(genie) out.push({type: genie, source: "Elemental Gift"});
  if(effectOn(c, "spirit_projection")) out.push({type: "bludgeoning, piercing and slashing", source: "Spirit Projection"});
  return out;
}
