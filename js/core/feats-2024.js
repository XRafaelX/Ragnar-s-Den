/* ---------------- Feats the sheet rolls for ----------------
   Savage Attacker (the 2014 feat and the 2024 one) and the 2024 Healer's
   Battle Medic and Healing Rerolls, plus who sees the 2024 Origin feats.

   Savage Attacker: once per turn, a weapon's damage dice rolled twice and
   either roll used (the 2014 feat: a melee weapon attack). After a weapon
   damage roll the tray offers "Savage Attacker: roll again"; the higher
   roll is kept.
   Battle Medic (Healer (2024)): a healer's kit use, the creature spends a
   Hit Die and regains that roll plus your proficiency bonus; Healing
   Rerolls rolls a 1 again (the new roll stands). */
import { BACKGROUND_INFO } from "../data/backgrounds.js";
import { hasFeat } from "./vitals.js";
import { profBonus } from "./basics.js";

/* Whether the character plays by the 2024 character rules: switched on
   (c.rules2024) or with a 2024 background. */
export function usesRules2024(c){
  return !!(c && (c.rules2024 || ((BACKGROUND_INFO[c.background] || {}).edition === "2024")));
}
/* The 2024 Origin feats are offered (at level-up, a race's feat) only to
   a character on the 2024 rules; every other feat to everyone. */
export function featOffered(def, rules2024){
  return !def || !def.origin || !!rules2024;
}

/* ---- Savage Attacker ---- */
/* Which version applies to this damage roll ("" for none): the 2024 one
   on any weapon, the 2014 one on a melee weapon. */
export function savageAttacker(c, melee){
  if(hasFeat(c, "Savage Attacker (2024)")) return "2024";
  return melee && hasFeat(c, "Savage Attacker") ? "2014" : "";
}
/* The tray's follow-up for a weapon damage roll of qty dice of `die` plus
   `modifier`, or null. Rolling again keeps the higher of the two rolls
   (its dice only: the modifier is the same). rng: [0, 1), for tests. */
export function savageFollowUp(c, melee, die, qty, modifier, rng){
  if(!savageAttacker(c, melee)) return null;
  return function(r){
    if(!r) return {hint: "Savage Attacker? Tap to roll again.", options: []};
    return {options: [{label: "Savage Attacker: roll again", title: "Once per turn: roll the damage dice again and use either roll (the higher is kept)",
      use: function(){ return savageReroll(die, qty, r.total - modifier, rng); }}]};
  };
}
/* Roll the dice again; had: the first roll's dice. {bonus, log}: what the
   higher roll adds (0 when the first was as good). */
export function savageReroll(die, qty, had, rng){
  var vals = [];
  for(var i = 0; i < qty; i++) vals.push(Math.floor((rng || Math.random)() * die) + 1);
  var now = vals.reduce(function(a, b){ return a + b; }, 0);
  var gain = Math.max(0, now - had);
  return {bonus: gain, log: "Savage Attacker [" + vals.join(", ") + "], " + (gain ? "kept the new roll" : "kept the first roll")};
}

/* ---- Healer (2024) ---- */
export function hasBattleMedic(c){ return hasFeat(c, "Healer (2024)"); }
/* A healer's kit in the pack. */
export function isHealersKit(item){ return /healer'?s kit/i.test((item && item.name) || ""); }
/* Healing Rerolls as a dice-tray adjust for one die of `die` plus bonus:
   a 1 is rolled again and the new roll stands. */
export function healingRerollAdjust(die, bonus, rng){
  return function(r){
    if(!r || !r.values || r.values[0] !== 1) return null;
    var again = Math.floor((rng || Math.random)() * die) + 1;
    return {total: again + bonus, note: "Healing Rerolls: the 1 rolled again, " + again};
  };
}
/* Battle Medic's heal from a roll of `die`: {first, roll, total, rerolled}.
   rng: [0, 1). */
export function battleMedicRoll(c, die, rng){
  var roll = function(){ return Math.floor((rng || Math.random)() * die) + 1; };
  var first = roll(), kept = first === 1 ? roll() : first;
  return {first: first, roll: kept, rerolled: first === 1, total: kept + profBonus(c)};
}
/* Heal the character: current hit points up to max. Returns what was gained. */
export function healSelf(c, amount, max){
  c.hp = c.hp || {};
  var before = Number(c.hp.current) || 0;
  c.hp.current = Math.min(Number(max) || 0, before + amount);
  return c.hp.current - before;
}

/* A roll's extra ({followUp, adjust}, a followUp function, or null) with
   one more followUp joined on: both one's options show. */
export function joinFollowUp(extra, more){
  if(!more) return extra || null;
  var obj = typeof extra === "function" ? {followUp: extra} : Object.assign({}, extra || {});
  var first = obj.followUp;
  obj.followUp = !first ? more : function(r, seen){
    var a = first(r, seen), b = more(r, seen);
    if(!a) return b;
    if(!b) return a;
    return {lead: a.lead || b.lead, hint: a.hint || b.hint, options: (a.options || []).concat(b.options || [])};
  };
  return obj;
}

/* ---- Tavern Brawler (2024) ----
   Damage Rerolls: a 1 on an unarmed strike's damage die is rolled again
   (the new roll stands). Push: once per turn a hit with an unarmed strike
   (the Attack action) can also push the target 5 feet, a "Hit?" button
   after the attack. */
export function hasBrawler2024(c){ return hasFeat(c, "Tavern Brawler (2024)"); }
/* A dice-tray adjust rolling each 1 of `die` again, or null when the
   character doesn't have the feat. */
export function brawlerRerolls(c, die, rng){
  if(!hasBrawler2024(c) || !die) return null;
  return rerollOnes(die, "Tavern Brawler", rng);
}
export function rerollOnes(die, name, rng){
  return function(r){
    if(!r || !r.values) return null;
    var gain = 0, again = [];
    r.values.forEach(function(v){
      if(v !== 1) return;
      var n = Math.floor((rng || Math.random)() * die) + 1;
      again.push(n); gain += n - 1;
    });
    return again.length ? {total: r.total + gain, note: name + ": the 1" + (again.length > 1 ? "s" : "") + " rolled again, " + again.join(", ")} : null;
  };
}

/* ---- Lucky ----
   After a d20 roll (an attack, a check or a save), a point rolls another
   d20 and the higher is kept. The 2014 feat ("roll an additional d20 and
   choose") on any roll; the 2024 one gives advantage, so only on a roll
   made with neither advantage nor disadvantage. {key, label, title, log},
   or null. */
export function luckyChoice(c, mode){
  if(hasFeat(c, "Lucky (2024)") && mode !== "adv" && mode !== "dis") return {key: "feat:luck_points_2024", label: "Advantage (Lucky, 1 point)",
    title: "Spend a Luck Point: roll another d20 and keep the higher", log: "Lucky: advantage"};
  if(hasFeat(c, "Lucky")) return {key: "feat:luck_points", label: "Another d20 (Lucky, 1 point)",
    title: "Spend a luck point: roll another d20 and use the one you want", log: "Lucky"};
  return null;
}
/* The other d20 against the roll's: had = the d20 the total stands on
   (its total less the modifier, so a Reliable Talent 10 counts as 10).
   {got, bonus}: what it adds (0 when the first was as good). */
export function luckyRoll(had, rng){
  var got = Math.floor((rng || Math.random)() * 20) + 1;
  return {got: got, bonus: Math.max(0, got - had)};
}
