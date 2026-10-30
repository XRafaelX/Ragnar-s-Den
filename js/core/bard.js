/* ---------------- Bard ----------------
   Bardic Inspiration and what the colleges spend it on (checked against the
   Player's Handbook, Xanathar's Guide, Tasha's Cauldron and Van Richten's
   Guide on 5etools' data 2026-10-30).

   A Bardic Inspiration action: {id, name, detail, log, roll: {die, qty,
   bonus, label}, tale (Tales from Beyond rolls on its own table)}. */
import { mod, profBonus } from "./basics.js";
import { classLevelOf } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { resourceLeft, spendResource, effectOn } from "./effects.js";
import { SPIRIT_TALES } from "../data/spirit-tales.js";
import { SPELL_DATA } from "../data/spells.js";

var USES = "Bard:bardic_inspiration";
function bardLevel(c){ return classLevelOf(c, "Bard"); }
function college(c, name){ return classLevelOf(c, "Bard", name); }
function chaMod(c){ return mod(abilityScore(c, "cha")); }

export function bardDc(c){ return 8 + profBonus(c) + chaMod(c); }
export function bardSpellAttack(c){ return profBonus(c) + chaMod(c); }
/* The die: d6, d8 from 5, d10 from 10, d12 from 15. */
export function bardicDie(c){
  var lv = bardLevel(c);
  return lv >= 15 ? 12 : lv >= 10 ? 10 : lv >= 5 ? 8 : 6;
}
/* Song of Rest's die, or 0 before level 2. */
export function songOfRestDie(c){
  var lv = bardLevel(c);
  return lv >= 17 ? 12 : lv >= 13 ? 10 : lv >= 9 ? 8 : lv >= 2 ? 6 : 0;
}
/* Mantle of Inspiration's temporary hit points. */
export function mantleTempHp(lv){
  return lv >= 15 ? 14 : lv >= 10 ? 11 : lv >= 5 ? 8 : 5;
}
/* Everything a use of Bardic Inspiration can pay for from the row. */
export function bardicActions(c){
  var die = bardicDie(c), chaTargets = Math.max(1, chaMod(c)), out = [];
  var mote = college(c, "College of Creation") >= 3;
  out.push({id: "inspire", name: "Inspire a creature", log: "A creature within 60 feet gained a d" + die + ".",
    detail: "Bonus action: a creature other than you within 60 ft that can hear you gets a d" + die + " for 10 minutes." + (mote ? " It can also get a mote of potential." : "")});
  if(college(c, "College of Lore") >= 3) out.push({id: "cutting_words", name: "Cutting Words",
    detail: "Reaction: subtract the die from an attack roll, ability check or damage roll of a creature you can see within 60 ft. It has to hear you and can't be immune to being charmed.",
    roll: {die: die, qty: 1, bonus: 0, label: "Cutting Words: subtract it"}});
  if(college(c, "College of Eloquence") >= 3) out.push({id: "unsettling_words", name: "Unsettling Words",
    detail: "Bonus action: a creature you can see within 60 ft subtracts the die from its next saving throw before the start of your next turn.",
    roll: {die: die, qty: 1, bonus: 0, label: "Unsettling Words: it subtracts this"}});
  if(college(c, "College of Glamour") >= 3){
    var temp = mantleTempHp(bardLevel(c));
    out.push({id: "mantle_of_inspiration", name: "Mantle of Inspiration",
      detail: "Bonus action: up to " + chaTargets + (chaTargets===1 ? " creature" : " creatures") + " you can see within 60 ft gain " + temp + " temporary hit points and can use their reaction to move up to their speed without opportunity attacks.",
      log: "Up to " + chaTargets + (chaTargets===1 ? " creature gains " : " creatures gain ") + temp + " temporary hit points and can move with their reaction."});
  }
  if(college(c, "College of Spirits") >= 3) out.push({id: "tales_from_beyond", name: "Tales from Beyond", tale: true,
    detail: "Bonus action, holding your Spiritual Focus: roll a d" + die + " on the Spirit Tales table. You keep the tale until you tell it or finish a rest."});
  return out;
}
export function bardicProblem(c){
  return resourceLeft(c, USES) > 0 ? "" : "None left";
}
export function spendBardic(c){
  return spendResource(c, USES, 1);
}

/* ---- College of Lore ---- */
export function hasPeerlessSkill(c){
  return college(c, "College of Lore") >= 14 && resourceLeft(c, USES) > 0;
}

/* ---- College of Eloquence ---- */
/* Silver Tongue: a d20 of 9 or lower counts as a 10 on these two. */
export function silverTongue(c, skill){
  return college(c, "College of Eloquence") >= 3 && (skill==="Persuasion" || skill==="Deception");
}

/* ---- College of Swords ---- */
/* Blade Flourish: Master's Flourish's d6 needs no use. Null without it, or
   with nothing to pay. */
export function bladeFlourish(c){
  if(college(c, "College of Swords") < 3) return null;
  var left = resourceLeft(c, USES) > 0, master = college(c, "College of Swords") >= 14;
  return left || master ? {die: bardicDie(c), left: left, master: master} : null;
}
/* Defensive Flourish: the number rolled goes on your AC. */
export function defensiveFlourish(c){
  return effectOn(c, "defensive_flourish") ? Number(c.effects.defensive_flourish)||0 : 0;
}

/* ---- College of Spirits ---- */
function taleWords(c){
  return {die: bardicDie(c), cha: chaMod(c), lv: bardLevel(c), dc: bardDc(c)};
}
/* The tale in mind (or tale `n`), with its numbers: {n, name, text, def}. */
export function spiritTale(c, n){
  var at = n || c.spiritTale, def = SPIRIT_TALES[at - 1];
  return def ? {n: at, name: def.name, text: def.text(taleWords(c)), def: def} : null;
}
/* Mystical Connection (Spirits 14): two rolls and a choice. */
export function hasMysticalConnection(c){
  return college(c, "College of Spirits") >= 14;
}
/* A rest ends a tale you haven't told. */
export function talesOnRest(c){
  delete c.spiritTale;
}
/* The roll a tale makes when told, or null. */
export function taleRoll(c, tale){
  var r = tale.def.roll;
  if(!r) return null;
  return {die: bardicDie(c), qty: r.qty, bonus: r.bonus==="cha" ? chaMod(c) : r.bonus==="lv" ? bardLevel(c) : 0, label: r.label};
}
/* Spirit Session: divination or necromancy, up to the people taking part
   (your proficiency bonus at most) and a level you can cast. */
export function sessionSpells(c){
  var slots = (c.spellcasting && c.spellcasting.slots) || {}, high = 0;
  Object.keys(slots).forEach(function(l){ if((Number(slots[l].max)||0) > 0) high = Math.max(high, Number(l)); });
  var most = Math.min(profBonus(c), high);
  return Object.keys(SPELL_DATA).filter(function(n){
    var d = SPELL_DATA[n];
    return (d.school==="Divination" || d.school==="Necromancy") && d.level <= most;
  }).sort(function(a, b){ return SPELL_DATA[a].level - SPELL_DATA[b].level || (a < b ? -1 : 1); });
}

/* ---- College of Whispers ---- */
/* Psychic Blades' dice, shaped like rangerHitDice. Each costs a use. */
export function bardHitDice(c){
  var lv = college(c, "College of Whispers");
  if(lv < 3 || resourceLeft(c, USES) <= 0) return [];
  var qty = lv >= 15 ? 8 : lv >= 10 ? 5 : lv >= 5 ? 3 : 2;
  return [{id: "psychic_blades", name: "Psychic Blades", text: "Psychic Blades " + qty + "d6", qty: qty, die: 6, label: "Psychic Blades (Psychic)",
    title: "On a hit, once per round on your turn: spend a Bardic Inspiration", unarmed: true, pay: USES}];
}
