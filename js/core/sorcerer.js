/* ---------------- Sorcerer ----------------
   Sorcery points and what they buy, and the origins' moving parts (checked
   against the Player's Handbook, Xanathar's Guide, Tasha's Cauldron and
   Dragonlance on 5etools' data 2026-10-30).

   A sorcery point action: {id, group, name, cost, detail, log, roll: {die,
   qty, bonus, label}, make (a slot level), burn (a slot), bastion (dice),
   phase, discount}, in the shape of a monk's kiActions. */
import { mod, profBonus } from "./basics.js";
import { classLevelOf, classFeatureList } from "./class-features.js";
import { featurePicksText } from "./class-picks.js";
import { abilityScore } from "./ability-scores.js";
import { resourceLeft, spendResource, spellSlotsLeft, spendSpellSlot, effectOn } from "./effects.js";
import { allKnownOptions } from "./class-options.js";
import { featureSpells } from "./spell-grants.js";
import { characterResources } from "./character-resources.js";
import { optionSetDef } from "../data/class-options.js";
import { WILD_SURGE } from "../data/wild-surge.js";
import { SPELL_DATA } from "../data/spells.js";

var POINTS = "Sorcerer:sorcery_points";
function sorcererLevel(c){ return classLevelOf(c, "Sorcerer"); }
function origin(c, name){ return classLevelOf(c, "Sorcerer", name); }
function chaMod(c){ return mod(abilityScore(c, "cha")); }
function ord(n){ return n===1 ? "1st" : n===2 ? "2nd" : n===3 ? "3rd" : n + "th"; }

export function sorcererDc(c){ return 8 + profBonus(c) + chaMod(c); }

/* ---- Font of Magic ---- */
export var SLOT_COST = {1: 2, 2: 3, 3: 5, 4: 6, 5: 7};
/* A created slot is an extra one, gone after a long rest. */
export function createSlot(c, level){
  var s = c.spellcasting.slots[level];
  s.max = (Number(s.max)||0) + 1;
  s.extra = (Number(s.extra)||0) + 1;
  s.font = (Number(s.font)||0) + 1;
}
export function fontOnLongRest(c){
  var slots = (c.spellcasting && c.spellcasting.slots) || {};
  Object.keys(slots).forEach(function(l){
    var s = slots[l], n = Number(s.font)||0;
    if(!n) return;
    s.max = Math.max(0, (Number(s.max)||0) - n);
    s.extra = Math.max(0, (Number(s.extra)||0) - n);
    delete s.font;
  });
}
/* Sorcerous Restoration (sorcerer 20): 4 points on a short rest. How many
   came back. */
export function sorcerousRestoration(c){
  if(sorcererLevel(c) < 20) return 0;
  var used = (c.resourcesUsed && c.resourcesUsed[POINTS]) || 0, back = Math.min(4, used);
  if(back) c.resourcesUsed[POINTS] = used - back;
  return back;
}
function highestSlot(c){
  var slots = (c.spellcasting && c.spellcasting.slots) || {}, high = 0;
  Object.keys(slots).forEach(function(l){ if((Number(slots[l].max)||0) > 0) high = Math.max(high, Number(l)); });
  return high;
}
/* Everything sorcery points can pay for. key: the pool (a feat's Metamagic
   Adept points only pay for Metamagic). */
export function sorceryActions(c, key){
  var out = [], font = key===POINTS, off = c.lunarDiscount ? 1 : 0;
  if(font){
    [1, 2, 3, 4, 5].forEach(function(l){
      out.push({id: "make" + l, group: "Font of Magic", name: "Make a " + ord(l) + "-level slot", cost: SLOT_COST[l], make: l,
        detail: "Bonus action. The slot is gone after a long rest.", log: "Made a " + ord(l) + "-level spell slot."});
    });
    spellSlotsLeft(c).forEach(function(s){
      out.push({id: "burn" + s.level + (s.pact ? "p" : ""), group: "Font of Magic", name: "Turn a " + ord(s.level) + "-level " + (s.pact ? "pact slot" : "slot") + " into " + s.level + (s.level===1 ? " point" : " points"), cost: 0, gain: s.level, burn: s,
        detail: "Bonus action.", log: "Turned a " + ord(s.level) + "-level spell slot into " + s.level + (s.level===1 ? " point." : " points.")});
    });
  }
  var set = optionSetDef("metamagic");
  allKnownOptions(c, "metamagic").forEach(function(k){
    var o = set.options.find(function(x){ return x.name===k.name; });
    if(!o) return;
    if(o.name==="Twinned Spell"){
      for(var l = 0; l <= highestSlot(c); l++) out.push({id: "twin" + l, group: "Metamagic", name: "Twinned Spell, " + (l ? ord(l) + " level" : "cantrip"), cost: Math.max(0, (l || 1) - off), meta: true, detail: o.text, log: "Twinned Spell."});
      return;
    }
    out.push({id: o.name, group: "Metamagic", name: o.name, cost: Math.max(0, Number(o.cost) - off), meta: true, detail: o.text, log: o.name + "."});
  });
  if(!font) return out;
  // Lunar Boons: 1 point off the next Metamagic, for a spell of the phase's schools.
  if(origin(c, "Lunar Sorcery") >= 6 && !c.lunarDiscount && c.lunarPhase) out.push({id: "lunar_boon", group: "Metamagic", name: "Lunar Boons: 1 point off your next Metamagic", cost: 0, discount: true,
    detail: "For a spell of these schools: " + LUNAR_SCHOOLS[c.lunarPhase] + ".", log: "Your next Metamagic costs 1 point less."});
  var mine = "Your sorcery";
  if(origin(c, "Wild Magic") >= 6) out.push({id: "bend_luck", group: mine, name: "Bend Luck", cost: 2, roll: {die: 4, qty: 1, bonus: 0, label: "Bend Luck: add it or subtract it"},
    detail: "Reaction: when a creature you can see rolls an attack, check or save, add or subtract 1d4 before any effects."});
  if(origin(c, "Clockwork Soul") >= 6) [1, 2, 3, 4, 5].forEach(function(n){
    out.push({id: "bastion" + n, group: mine, name: "Bastion of Law, " + n + "d8", cost: n, bastion: n,
      detail: "Action: ward you or a creature you can see within 30 ft. It spends the dice to reduce damage. It lasts until a long rest or your next Bastion.", log: "A ward of " + n + "d8."});
  });
  if(origin(c, "Divine Soul") >= 6) out.push({id: "empowered_healing", group: mine, name: "Empowered Healing", cost: 1,
    detail: "When you or an ally within 5 ft rolls a spell's healing: reroll any number of the dice once. Once per turn.", log: "Rerolled the healing dice."});
  if(origin(c, "Shadow Magic") >= 3) out.push({id: "darkness", group: mine, name: "Cast Darkness", cost: 2,
    detail: "You can see through this darkness.", log: "Cast Darkness with sorcery points. You can see through it."});
  if(origin(c, "Shadow Magic") >= 6) out.push({id: "hound", group: mine, name: "Hound of Ill Omen", cost: 3,
    detail: "Bonus action: it hunts a creature you can see within 120 ft. Its stats are on the Companions tab.", log: "A hound of ill omen hunts its target."});
  if(origin(c, "Aberrant Mind") >= 6) featureSpells(c).filter(function(s){ return s.feature==="Psionic Spells" && s.level >= 1; }).forEach(function(s){
    out.push({id: "psionic:" + s.name, group: "Psionic Sorcery", name: "Cast " + s.name, cost: s.level,
      detail: "No verbal or somatic components, and no material ones unless the spell consumes them.", log: "Cast " + s.name + " with sorcery points, no components."});
  });
  if(origin(c, "Lunar Sorcery") >= 6) PHASES.filter(function(p){ return p!==c.lunarPhase; }).forEach(function(p){
    out.push({id: "wax:" + p, group: mine, name: "Change to the " + p, cost: 1, phase: p, detail: "Bonus action (Waxing and Waning).", log: "Your phase is now the " + p + "."});
  });
  return out;
}
export function sorceryProblem(c, a, key){
  var r = characterResources(c).find(function(x){ return x.key===key; });
  if(!r) return "None left";
  if(a.gain && r.used <= 0) return "Already full";
  if(a.cost > r.max - r.used) return "Not enough points";
  if(a.make && a.make > 5) return "Too high";
  return "";
}
/* Pays and does what the action does. False if it can't. */
export function payForSorcery(c, a, key){
  if(sorceryProblem(c, a, key)) return false;
  if(a.gain){
    c.resourcesUsed[key] = Math.max(0, (c.resourcesUsed[key]||0) - a.gain);
    spendSpellSlot(c, a.burn);
    return true;
  }
  if(a.cost && !spendResource(c, key, a.cost)) return false;
  if(a.meta) delete c.lunarDiscount;
  if(a.discount){
    if(!spendResource(c, "Sorcerer:lunar_boons", 1)) return false;
    c.lunarDiscount = true;
  }
  if(a.make) createSlot(c, a.make);
  if(a.bastion){
    c.effects = c.effects || {};
    c.effects.bastion_of_law = a.bastion;
  }
  if(a.phase) c.lunarPhase = a.phase;
  return true;
}

/* ---- Draconic Bloodline ---- */
var DRAGON_TYPES = {Black: "acid", Copper: "acid", Blue: "lightning", Bronze: "lightning", Brass: "fire", Gold: "fire", Red: "fire", Green: "poison", Silver: "cold", White: "cold"};
/* The damage type of the character's ancestry, or "". */
export function dragonType(c){
  var type = "";
  (c.classes||[]).forEach(function(cl, i){
    if(cl.name!=="Sorcerer" || cl.subclass!=="Draconic Bloodline") return;
    var m = /(Black|Copper|Blue|Bronze|Brass|Gold|Red|Green|Silver|White)/.exec(featurePicksText(cl, i > 0, "Dragon Ancestor", true));
    if(m) type = DRAGON_TYPES[m[1]];
  });
  return type;
}

/* ---- Wild Magic ---- */
/* The table's entry for a d100 roll (100 is the 00). */
export function surgeEntry(roll){
  return WILD_SURGE[Math.ceil(roll / 2) - 1] || null;
}
export function hasControlledChaos(c){
  return origin(c, "Wild Magic") >= 14;
}
/* Rolling on the table gives Tides of Chaos back. */
export function regainTides(c){
  if(c.resourcesUsed) delete c.resourcesUsed["Sorcerer:tides_of_chaos"];
}
/* Your lowest-level spent slot comes back; its level, or 0. */
export function regainLowestSlot(c){
  var slots = (c.spellcasting && c.spellcasting.slots) || {};
  for(var l = 1; l <= 9; l++){
    if(slots[l] && (Number(slots[l].used)||0) > 0){ slots[l].used -= 1; return l; }
  }
  return 0;
}
export function regainAllPoints(c){
  if(c.resourcesUsed) delete c.resourcesUsed[POINTS];
}

/* ---- Clockwork Soul ---- */
export function tranceOn(c){ return effectOn(c, "trance_of_order"); }
/* Bastion of Law's dice left. */
export function bastionDice(c){
  return effectOn(c, "bastion_of_law") ? Number(c.effects.bastion_of_law)||0 : 0;
}

/* ---- Divine Soul ---- */
export function favoredByTheGods(c){
  return resourceLeft(c, "Sorcerer:favored_by_the_gods") > 0;
}
/* Unearthly Recovery: half the hit point maximum, below half hit points. */
export function unearthlyRecovery(c, hpMax){
  return (Number(c.hp.current)||0) < hpMax / 2 ? Math.floor(hpMax / 2) : 0;
}

/* ---- Shadow Magic ---- */
export function strengthOfTheGrave(c){
  return resourceLeft(c, "Sorcerer:strength_of_the_grave") > 0;
}

/* ---- Storm Sorcery ---- */
export function heartOfTheStorm(c){
  var lv = origin(c, "Storm Sorcery");
  return lv >= 6 ? Math.floor(lv / 2) : 0;
}

/* ---- Lunar Sorcery ---- */
export var PHASES = ["Full Moon", "New Moon", "Crescent Moon"];
export var LUNAR_SPELLS = {"Full Moon": "Shield", "New Moon": "Ray of Sickness", "Crescent Moon": "Color Spray"};
export var LUNAR_SCHOOLS = {"Full Moon": "abjuration and divination", "New Moon": "enchantment and necromancy", "Crescent Moon": "illusion and transmutation"};
export function lunarPhase(c){
  return origin(c, "Lunar Sorcery") ? c.lunarPhase || "" : "";
}
/* The phase is chosen at the end of a long rest. */
export function lunarOnLongRest(c){
  if(!origin(c, "Lunar Sorcery")) return;
  c.lunarChoose = true;
  delete c.lunarFree;
  delete c.lunarPhenomenon;
}
export function setLunarPhase(c, phase){
  c.lunarPhase = phase;
  delete c.lunarChoose;
}
/* The current phase's free spell has been cast. */
export function lunarFreeUsed(c){
  return !!(c.lunarFree && c.lunarFree[c.lunarPhase]);
}
export function useLunarFree(c){
  if(!c.lunarPhase || lunarFreeUsed(c) || !spendResource(c, "Sorcerer:lunar_embodiment", 1)) return false;
  c.lunarFree = c.lunarFree || {};
  c.lunarFree[c.lunarPhase] = true;
  return true;
}
/* Lunar Phenomenon: each phase's power once per long rest, then 5 points. */
export function phenomenonSpent(c){
  return !!(c.lunarPhenomenon && c.lunarPhenomenon[c.lunarPhase]);
}
export function usePhenomenon(c){
  if(!c.lunarPhase) return false;
  if(phenomenonSpent(c)) return spendResource(c, POINTS, 5);
  if(!spendResource(c, "Sorcerer:lunar_phenomenon", 1)) return false;
  c.lunarPhenomenon = c.lunarPhenomenon || {};
  c.lunarPhenomenon[c.lunarPhase] = true;
  return true;
}
/* The Crescent Moon's resistance (Lunar Empowerment, 14). */
export function lunarEmpowered(c){
  return origin(c, "Lunar Sorcery") >= 14 ? c.lunarPhase || "" : "";
}
