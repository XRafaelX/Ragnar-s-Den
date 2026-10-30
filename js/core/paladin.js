/* ---------------- Paladin ----------------
   Divine Smite, what Channel Divinity can do for each oath, Lay on Hands,
   and the auras that change a number (all checked against the Player's
   Handbook, Dungeon Master's Guide, Sword Coast Adventurer's Guide,
   Xanathar's Guide and Tasha's Cauldron on 5etools' data 2026-10-30).

   A Channel Divinity action: {id, name, group, detail, log, effect (an
   Active effect it starts), sacred (the weapon Sacred Weapon imbues), roll:
   {qty, die, bonus, label}, healSelf (the roll can heal you too), reason
   (why it can't be used now)}. */
import { mod, profBonus } from "./basics.js";
import { classLevelOf, computeSpellSlots } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { effectOn, resourceLeft, spendResource, startEffect } from "./effects.js";
import { isRangedWeapon } from "./equipment.js";

var CHANNEL = "Paladin:channel_divinity";
function chaAtLeastOne(c){
  return Math.max(1, mod(abilityScore(c, "cha")));
}
/* The Paladin's spell save DC, which Channel Divinity uses too. */
export function paladinDc(c){
  return 8 + profBonus(c) + mod(abilityScore(c, "cha"));
}

/* ---- Divine Smite (paladin 2) ----
   2d8 for a 1st-level slot, +1d8 per level to 5d8, +1d8 against undead or
   fiends to 6d8. A critical hit doubles the dice. */
export function smiteDice(slotLevel, undead, crit){
  var n = Math.min(5, slotLevel + 1) + (undead ? 1 : 0);
  return crit ? 2 * n : n;
}
/* The slots a smite can spend, lowest first: [{level, left, pact}]. A
   warlock's pact slots count too. */
export function smiteSlots(c){
  if(classLevelOf(c, "Paladin") < 2) return [];
  var sc = c.spellcasting || {}, slots = sc.slots || {}, out = [];
  for(var l = 1; l <= 9; l++){
    var s = slots[l], left = s ? (Number(s.max)||0) - (Number(s.used)||0) : 0;
    if(left > 0) out.push({level: l, left: left, pact: false});
  }
  var pact = sc.pact, level = (computeSpellSlots(c.classes).pact || {}).slotLevel;
  var pactLeft = pact ? (Number(pact.max)||0) - (Number(pact.used)||0) : 0;
  if(pactLeft > 0 && level) out.push({level: level, left: pactLeft, pact: true});
  return out;
}
export function spendSmiteSlot(c, slot){
  var s = slot.pact ? c.spellcasting.pact : c.spellcasting.slots[slot.level];
  s.used = (Number(s.used)||0) + 1;
}
/* Improved Divine Smite (paladin 11): 1d8 radiant on every melee weapon hit. */
export function hasImprovedSmite(c){
  return classLevelOf(c, "Paladin") >= 11;
}
/* Inspiring Smite (Oath of Glory 3): temporary HP to share after a smite. */
export function inspiringSmite(c){
  var lv = classLevelOf(c, "Paladin", "Oath of Glory");
  return lv >= 3 && resourceLeft(c, CHANNEL) > 0 ? {bonus: lv} : null;
}
/* Guided Strike (Oath of Conquest 3): +10 to an attack roll you just saw. */
export function hasGuidedStrike(c){
  return classLevelOf(c, "Paladin", "Oath of Conquest") >= 3 && resourceLeft(c, CHANNEL) > 0;
}
export function spendChannel(c){
  return spendResource(c, CHANNEL, 1);
}

/* ---- Numbers the oaths change ---- */
/* Sacred Weapon (Oath of Devotion 3): +CHA (minimum +1) to attack rolls
   with the imbued weapon, which is magical while it lasts. */
export function sacredWeaponBonus(c, item){
  return effectOn(c, "sacred_weapon") && c.sacredWeapon===item.id ? chaAtLeastOne(c) : 0;
}
/* Aura of Hate (Oathbreaker 7): +CHA (minimum +1) to melee weapon damage. */
export function auraOfHate(c, item){
  return classLevelOf(c, "Paladin", "Oathbreaker") >= 7 && !(item && isRangedWeapon(item)) ? chaAtLeastOne(c) : 0;
}
/* Protective Spirit (Oath of Redemption 15): 1d6 + half the paladin level
   at the end of your turn, below half your hit points. Null without it or
   when it isn't due. */
export function protectiveSpirit(c, hpMax){
  var lv = classLevelOf(c, "Paladin", "Oath of Redemption");
  if(lv < 15) return null;
  var hp = Number(c.hp && c.hp.current)||0;
  return hp > 0 && 2 * hp < hpMax ? {bonus: Math.floor(lv / 2)} : null;
}
/* Living Legend (Oath of Glory 20): the save reroll and the hit. */
export function livingLegendOn(c){
  return effectOn(c, "living_legend");
}

/* ---- Lay on Hands (paladin 1) ---- */
/* Spend `n` from the pool, false if there isn't that much. */
export function spendLayOnHands(c, n){
  return resourceLeft(c, "Paladin:lay_on_hands") >= n && spendResource(c, "Paladin:lay_on_hands", n);
}

/* ---- Channel Divinity (paladin 3) ---- */
export function channelActions(c){
  var lv = classLevelOf(c, "Paladin");
  if(lv < 3) return [];
  var cl = (c.classes||[]).find(function(x){ return x.name==="Paladin"; });
  var dc = paladinDc(c), cha = chaAtLeastOne(c);
  var turned = " or is turned for 1 minute or until it takes damage. It must move away from you, and for its action it can only Dash, try to escape or Dodge.";
  var turn = function(name, who, sense, extra){
    var text = "An action: each " + who + " within 30 feet that can " + sense + " you makes a WIS save (DC " + dc + ")" + turned + (extra || "");
    return {id: name, name: name, detail: text, log: "WIS save DC " + dc + "."};
  };
  var save = function(name, text, log){
    return {id: name, name: name, detail: text, log: log};
  };
  switch(cl.subclass){
    case "Oath of Devotion":
      var held = (c.inventory||[]).filter(function(i){ return i.type==="weapon" && i.equipped; });
      var weapon = held.length ? held.map(function(i){
        return {id: "sacred-" + i.id, group: "Sacred Weapon", name: i.name || "Weapon", effect: "sacred_weapon", sacred: i.id,
          detail: "An action: +" + cha + " to attack rolls with this weapon for 1 minute, and it's magical."};
      }) : [{id: "sacred", name: "Sacred Weapon", detail: "An action: +" + cha + " to attack rolls with a weapon you hold for 1 minute, and it's magical.", reason: "Hold a weapon first"}];
      return [turn("Turn the Unholy", "fiend or undead", "see or hear")].concat(weapon);
    case "Oath of the Ancients":
      return [save("Nature's Wrath", "An action: a creature you can see within 10 feet makes a STR or DEX save (its choice, DC " + dc + ") or is restrained. It repeats the save at the end of each of its turns.", "STR or DEX save DC " + dc + "."),
        turn("Turn the Faithless", "fey or fiend", "hear", " Its true form is revealed while it's turned.")];
    case "Oath of Vengeance":
      return [save("Abjure Enemy", "An action: a creature you can see within 60 feet makes a WIS save (DC " + dc + "), with disadvantage if it's a fiend or undead. On a failure it's frightened and its speed is 0, on a success its speed is halved, for 1 minute or until it takes damage.", "WIS save DC " + dc + "."),
        {id: "Vow of Enmity", name: "Vow of Enmity", effect: "vow_of_enmity", detail: "A bonus action: advantage on attack rolls against a creature you can see within 10 feet for 1 minute."}];
    case "Oath of Conquest":
      return [save("Conquering Presence", "An action: each creature you choose within 30 feet makes a WIS save (DC " + dc + ") or is frightened of you for 1 minute. It repeats the save at the end of each of its turns.", "WIS save DC " + dc + "."),
        {id: "Guided Strike", name: "Guided Strike", detail: "+10 to an attack roll, after you see the roll.", reason: "Offered after an attack roll"}];
    case "Oathbreaker":
      return [save("Control Undead", "An action: an undead you can see within 30 feet makes a WIS save (DC " + dc + ") or obeys you for 24 hours. Undead of challenge rating " + lv + " or higher are immune.", "WIS save DC " + dc + "."),
        save("Dreadful Aspect", "An action: each creature you choose within 30 feet that can see you makes a WIS save (DC " + dc + ") or is frightened of you for 1 minute.", "WIS save DC " + dc + ".")];
    case "Oath of Redemption":
      return [{id: "Emissary of Peace", name: "Emissary of Peace", effect: "emissary_of_peace", detail: "A bonus action: +5 to Persuasion checks for 10 minutes."},
        save("Rebuke the Violent", "Reaction, right after a creature within 30 feet damages someone else with an attack: WIS save (DC " + dc + "). It takes radiant damage equal to what it dealt on a failure, half on a success.", "WIS save DC " + dc + ".")];
    case "Oath of Glory":
      return [{id: "Peerless Athlete", name: "Peerless Athlete", effect: "peerless_athlete", detail: "A bonus action: for 10 minutes, advantage on Athletics and Acrobatics, carry twice as much, and +10 feet on long and high jumps."},
        {id: "Inspiring Smite", name: "Inspiring Smite", detail: "Temporary hit points to share, right after a Divine Smite.", reason: "Offered after a Divine Smite"}];
    case "Oath of the Crown":
      return [save("Champion Challenge", "A bonus action: each creature you choose within 30 feet makes a WIS save (DC " + dc + ") or can't willingly move more than 30 feet away from you.", "WIS save DC " + dc + "."),
        {id: "Turn the Tide", name: "Turn the Tide", healSelf: true, detail: "A bonus action: each creature you choose within 30 feet that can hear you and has no more than half its hit points regains this.",
          roll: {qty: 1, die: 6, bonus: cha, label: "Turn the Tide: hit points regained"}}];
    case "Oath of the Watchers":
      return [{id: "Watcher's Will", name: "Watcher's Will", effect: "watchers_will", detail: "An action: for 1 minute, you and up to " + cha + (cha===1 ? " creature" : " creatures") + " you can see within 30 feet have advantage on INT, WIS and CHA saves."},
        turn("Abjure the Extraplanar", "aberration, celestial, elemental, fey or fiend", "hear")];
  }
  return [];
}
/* Why an action can't be taken now, or "". */
export function channelProblem(c, a){
  if(a.reason) return a.reason;
  return resourceLeft(c, CHANNEL) > 0 ? "" : "Used until a rest";
}
/* Pay for it, and start its effect if it has one. True if it was used. */
export function useChannelAction(c, a){
  if(channelProblem(c, a)) return false;
  if(a.effect){
    if(!startEffect(c, a.effect)) return false;
    if(a.sacred) c.sacredWeapon = a.sacred;
    return true;
  }
  return spendChannel(c);
}
