/* ---------------- Active effects ----------------
   Effects switched on from the Vitals tab (Bladesong, the Astral Self,
   Symbiotic Entity) and the numbers they change. */
import { TOGGLE_EFFECTS, WILD_SURGES } from "../data/effects.js";
import { mod, profBonus, totalLevel } from "./basics.js";
import { characterResources } from "./character-resources.js";
import { classLevelOf, computeSpellSlots, usesVariant } from "./class-features.js";
import { isRangedWeapon } from "./equipment.js";
import { abilityScore, abilityScores } from "./ability-scores.js";
import { knownOptions } from "./class-options.js";

/* ---------------- Temporary effects ----------------
   Bladesong, the Astral Self and Symbiotic Entity (js/data/effects.js).
   c.effects holds the ids switched on. One only counts while the
   character still has the feature and nothing has cut it short: Bladesong
   in medium or heavy armor or with a shield, Symbiotic Entity with its
   temporary HP gone, Awakened Astral Self without the arms and visage. */
function effectDef(id){
  return TOGGLE_EFFECTS.find(function(d){ return d.id===id; });
}
/* Who has it: the class entry, or for a race's effect the race (from
   the character level it starts at). */
function effectClass(c, def){
  if(def.race) return def.race.indexOf(c.race)!==-1 && totalLevel(c) >= def.level;
  return (c.classes||[]).find(function(cl){
    return cl.name===def.className && (!def.subclass || cl.subclass===def.subclass) && (Number(cl.level)||1) >= def.level &&
      (!def.variant || usesVariant(cl, def.variant)) && !(def.replacedBy && usesVariant(cl, def.replacedBy)) &&
      (!def.option || knownOptions(cl, def.option.set).some(function(e){ return e.name===def.option.name; }));
  });
}
/* Why an effect that's switched on gives nothing right now, or "". */
export function effectBlocked(c, id){
  if(id==="bladesong"){
    var worn = (c.inventory||[]).find(function(i){
      return i.type==="armor" && i.equipped && (i.category==="medium" || i.category==="heavy" || i.category==="shield");
    });
    if(worn) return "Not working while you wear " + (worn.name || "medium or heavy armor or a shield") + ".";
  }
  return "";
}
export function effectOn(c, id){
  var def = effectDef(id);
  if(!def || !(c.effects && c.effects[id]) || !effectClass(c, def)) return false;
  if((def.requires||[]).some(function(r){ return !effectOn(c, r); })) return false;
  if(id==="symbiotic_entity" && !((Number(c.hp && c.hp.temp)||0) > 0)) return false;
  return !effectBlocked(c, id);
}
function spellSlotLeft(c, level){
  var s = c.spellcasting && c.spellcasting.slots && c.spellcasting.slots[level];
  return s ? (Number(s.max)||0) - (Number(s.used)||0) : 0;
}
/* The spell slots left, lowest first: [{level, left, pact}]. */
export function spellSlotsLeft(c){
  var out = [];
  for(var l = 1; l <= 9; l++) if(spellSlotLeft(c, l) > 0) out.push({level: l, left: spellSlotLeft(c, l), pact: false});
  var sc = c.spellcasting || {}, pact = sc.pact, level = (computeSpellSlots(c.classes).pact || {}).slotLevel;
  var pactLeft = pact ? (Number(pact.max)||0) - (Number(pact.used)||0) : 0;
  if(pactLeft > 0 && level) out.push({level: level, left: pactLeft, pact: true});
  return out;
}
export function spendSpellSlot(c, slot){
  var s = slot.pact ? c.spellcasting.pact : c.spellcasting.slots[slot.level];
  s.used = (Number(s.used)||0) + 1;
}
/* The effects this character has, for the card: {def, on, blocked,
   resource (the class resource it spends), why (it can't start, or ""),
   slot (the spell slot level that pays for it instead, or 0)}. */
export function characterEffects(c){
  var resources = characterResources(c);
  var flags = c.effects || {};
  return TOGGLE_EFFECTS.filter(function(def){ return effectClass(c, def); }).map(function(def){
    var res = def.cost && resources.find(function(r){ return r.key===(def.race ? "race" : def.className)+":"+def.cost.resource; });
    var on = !!flags[def.id];
    var why = "", slot = 0;
    if(!on){
      var missing = (def.requires||[]).filter(function(r){ return !flags[r]; });
      if(missing.length) why = "Needs " + missing.map(function(r){ return effectDef(r).name; }).join(" and ") + " first.";
      else if(def.slotPick && !spellSlotsLeft(c).some(function(s){ return !s.pact; })) why = "No spell slots left.";
      else if(def.cost && (!res || res.max - res.used < def.cost.amount)){
        // Living Legend: a spell slot of that level pays once the use is gone.
        if(def.slotCost && spellSlotLeft(c, def.slotCost)) slot = def.slotCost;
        else why = "Not enough " + (res ? res.name : def.cost.resource) + " left.";
      }
    }
    return {def: def, on: on, blocked: on ? effectBlocked(c, def.id) : "", resource: res, why: why, slot: slot};
  });
}
/* Switch an effect on: pay its cost and, for Symbiotic Entity, gain its
   temporary HP (they don't stack: keep the higher). False if it can't. */
export function startEffect(c, id, slotLevel){
  var e = characterEffects(c).find(function(x){ return x.def.id===id; });
  if(!e || e.on || e.why) return false;
  if(e.def.slotPick) c.spellcasting.slots[slotLevel].used = (Number(c.spellcasting.slots[slotLevel].used)||0) + 1;
  if(e.slot) c.spellcasting.slots[e.slot].used = (Number(c.spellcasting.slots[e.slot].used)||0) + 1;
  else if(e.resource && e.resource.max!==Infinity){
    if(!c.resourcesUsed) c.resourcesUsed = {};
    c.resourcesUsed[e.resource.key] = e.resource.used + e.def.cost.amount;
  }
  if(!c.effects) c.effects = {};
  c.effects[id] = e.def.slotPick ? slotLevel : true;
  if(id==="symbiotic_entity"){
    if(!c.hp) c.hp = {max:0, current:0, temp:0};
    c.hp.temp = Math.max(Number(c.hp.temp)||0, symbioticTempHp(c));
  }
  if(id==="reckless_attack") recklessAbandon(c);
  // Fighting Spirit: 5 temporary HP, 10 from fighter 10, 15 from 15 (keep the higher).
  if(id==="fighting_spirit"){
    var fs = fightingSpiritTempHp(c);
    if(!c.hp) c.hp = {max:0, current:0, temp:0};
    if(fs > (Number(c.hp.temp)||0)) c.hp.temp = fs;
  }
  return true;
}
/* Switch an effect off, and anything that needs it. */
export function endEffect(c, id){
  if(!c.effects) return;
  delete c.effects[id];
  TOGGLE_EFFECTS.forEach(function(d){ if((d.requires||[]).indexOf(id)!==-1) endEffect(c, d.id); });
}
/* A rest or dropping to 0 HP ends every effect, and a Barbarian's Rage.
   Returns the names that were on. */
export function endAllEffects(c){
  var ended = TOGGLE_EFFECTS.filter(function(d){ return c.effects && c.effects[d.id]; }).map(function(d){ return d.name; });
  c.effects = {};
  if(c.rage && c.rage.active){ ended.push("Rage"); ended = ended.concat(endRage(c)); }
  // Sharpen the Blade lasts a minute.
  if(c.sharpen){ delete c.sharpen; ended.push("Sharpen the Blade"); }
  // Shillelagh lasts a minute: a rest or dropping to 0 hit points ends it.
  var lit = (c.inventory||[]).filter(function(i){ return i.shillelagh; });
  if(lit.length){ lit.forEach(function(i){ delete i.shillelagh; }); ended.push("Shillelagh"); }
  return ended;
}
/* A condition that incapacitates ends the effects tagged
   `endsIncapacitated` (Twilight Sanctuary, Bladesong). Returns their names. */
export function endIncapacitatedEffects(c){
  var ended = TOGGLE_EFFECTS.filter(function(d){ return d.endsIncapacitated && c.effects && c.effects[d.id]; });
  ended.forEach(function(d){ endEffect(c, d.id); });
  return ended.map(function(d){ return d.name; });
}
/* Drop flags that can't come back on their own: the feature is gone
   (level undone) or Symbiotic Entity's temporary HP ran out. True if any went. */
export function pruneEffects(c){
  var changed = false;
  Object.keys(c.effects||{}).forEach(function(id){
    var def = effectDef(id);
    var gone = !def || !effectClass(c, def) || (id==="symbiotic_entity" && !((Number(c.hp && c.hp.temp)||0) > 0));
    if(gone){ endEffect(c, id); changed = true; }
  });
  return changed;
}
/* How the effects change rolls: Shell Defense's saves (advantage on STR
   and CON, disadvantage on DEX), Sunlight Sensitivity's attacks and
   Perception, Steady Aim's next attack and attacking while invisible
   (Nature's Veil), as roll modes. kind: "save"
   (with its ability), "attack" or "perception". */
export function effectRolls(c, kind, ability){
  var out = [];
  if(kind==="save" && effectOn(c, "shell_defense")){
    if(ability==="str" || ability==="con") out.push({mode: "adv", reason: "Shell Defense"});
    if(ability==="dex") out.push({mode: "dis", reason: "Shell Defense"});
  }
  if((kind==="attack" || kind==="perception") && effectOn(c, "sunlight")) out.push({mode: "dis", reason: "Sunlight Sensitivity"});
  if(kind==="attack" && steadyAimReady(c)) out.push({mode: "adv", reason: "Steady Aim"});
  if(kind==="attack" && effectOn(c, "natures_veil")) out.push({mode: "adv", reason: "Nature's Veil: you're invisible"});
  // Empty Body and Cloak of Shadows: invisible, so advantage on attack rolls.
  if(kind==="attack" && effectOn(c, "empty_body")) out.push({mode: "adv", reason: "Empty Body: you're invisible"});
  if(kind==="attack" && effectOn(c, "cloak_of_shadows")) out.push({mode: "adv", reason: "Cloak of Shadows: you're invisible"});
  if(kind==="attack" && effectOn(c, "trickery_cloak")) out.push({mode: "adv", reason: "Cloak of Shadows: you're invisible"});
  // Assassinate and Versatile Trickster: advantage on attack rolls while they're on.
  if(kind==="attack" && effectOn(c, "assassinate")) out.push({mode: "adv", reason: "Assassinate"});
  if(kind==="attack" && effectOn(c, "versatile_trickster")) out.push({mode: "adv", reason: "Versatile Trickster"});
  if(kind==="attack" && effectOn(c, "vow_of_enmity")) out.push({mode: "adv", reason: "Vow of Enmity"});
  return out;
}
/* Steady Aim: on, with its advantage not yet used ("used" once an
   attack is rolled, while the speed stays 0 until the turn ends). */
export function steadyAimReady(c){
  return effectOn(c, "steady_aim") && c.effects.steady_aim!=="used";
}
/* An attack was rolled: Steady Aim's advantage is used up. True if it was. */
export function useSteadyAim(c){
  if(!steadyAimReady(c)) return false;
  c.effects.steady_aim = "used";
  return true;
}
/* Bladesong's bonus to AC and concentration saves (and Song of Victory's damage). */
export function bladesongBonus(c){
  return Math.max(1, mod(abilityScore(c, "int")));
}
export function symbioticTempHp(c){
  return 4 * classLevelOf(c, "Druid", "Circle of Spores");
}
/* Halo of Spores' die by druid level (d4, d6 from 6, d8 from 10, d10 from 14). */
export function haloOfSporesDie(c){
  var lv = classLevelOf(c, "Druid", "Circle of Spores");
  return lv>=14 ? 10 : lv>=10 ? 8 : lv>=6 ? 6 : 4;
}
/* The Martial Arts die by monk level (d4, d6 from 5, d8 from 11, d10 from 17). */
export function martialArtsDie(c){
  var lv = classLevelOf(c, "Monk");
  return lv>=17 ? 10 : lv>=11 ? 8 : lv>=5 ? 6 : 4;
}
/* An unarmed strike with the astral arms: the best of STR, DEX and WIS,
   plus proficiency, Martial Arts die of force damage; Empowered Arms
   (monk 11) adds one more die once per turn. */
export function astralArmsAttack(c){
  var ab = abilityScores(c);
  var best = Math.max(mod(ab.str), mod(ab.dex), mod(ab.wis));
  return {attack: best + profBonus(c), damage: best, die: martialArtsDie(c),
    empowered: classLevelOf(c, "Monk", "Way of the Astral Self") >= 11};
}
/* Song of Victory: + Bladesong's bonus to melee weapon damage while
   Bladesong is on (wizard 14). */
export function songOfVictoryBonus(c, item){
  if(isRangedWeapon(item) || !effectOn(c, "bladesong")) return 0;
  return classLevelOf(c, "Wizard", "Bladesinging") >= 14 ? bladesongBonus(c) : 0;
}

/* ---- Tasha's features that spend points ----
   Quickened Healing (monk 4): 2 ki for a Martial Arts die plus the
   proficiency bonus of healing. Focused Aim (monk 5): after a missed
   attack roll, 1 to 3 ki for +2 to the roll each. Magical Guidance
   (sorcerer 5): 1 sorcery point to reroll a failed ability check. */
function classUses(c, className, name){
  return (c.classes||[]).some(function(cl){ return cl.name===className && usesVariant(cl, name); });
}
function pool(c, key){
  return characterResources(c).find(function(r){ return r.key===key; }) || null;
}
/* What's left of a resource ("Monk:ki"), or -1 without it. */
export function resourceLeft(c, key){
  var r = pool(c, key);
  return r ? r.max - r.used : -1;
}
/* Spend `n` of it. False when there isn't enough. */
export function spendResource(c, key, n){
  var r = pool(c, key);
  if(!r || r.max - r.used < n) return false;
  if(!c.resourcesUsed) c.resourcesUsed = {};
  c.resourcesUsed[r.key] = r.used + n;
  return true;
}
export function kiLeft(c){ return resourceLeft(c, "Monk:ki"); }
export function spendKi(c, n){ return spendResource(c, "Monk:ki", n); }
/* {cost, die, bonus} for Quickened Healing, or null without it. */
export function quickenedHealing(c){
  return classUses(c, "Monk", "Quickened Healing") && pool(c, "Monk:ki") ? {cost: 2, die: martialArtsDie(c), bonus: profBonus(c)} : null;
}
export function hasFocusedAim(c){
  return classUses(c, "Monk", "Focused Aim") && !!pool(c, "Monk:ki");
}
export function hasMagicalGuidance(c){
  return classUses(c, "Sorcerer", "Magical Guidance") && !!pool(c, "Sorcerer:sorcery_points");
}

/* ---- Harness Divine Power (Tasha's, cleric 2, paladin 3) ----
   A use of it and of that class's Channel Divinity give back one spent
   spell slot, of a level up to half the proficiency bonus (rounded up). */
export function harnessDivinePower(c, className){
  if(!classUses(c, className, "Harness Divine Power")) return null;
  var uses = pool(c, className + ":harness_divine_power"), channel = pool(c, className + ":channel_divinity");
  if(!uses || !channel) return null;
  var top = Math.ceil(profBonus(c) / 2), slots = (c.spellcasting && c.spellcasting.slots) || {};
  var levels = [];
  for(var l = 1; l <= top; l++) if(slots[l] && (Number(slots[l].used)||0) > 0) levels.push(l);
  return {top: top, levels: levels, usesLeft: uses.max - uses.used, channelLeft: channel.max - channel.used};
}
/* Get back a spent slot of `level`. False if it can't. */
export function useHarnessDivinePower(c, className, level){
  var h = harnessDivinePower(c, className);
  if(!h || !h.usesLeft || !h.channelLeft || h.levels.indexOf(level)===-1) return false;
  spendResource(c, className + ":harness_divine_power", 1);
  spendResource(c, className + ":channel_divinity", 1);
  c.spellcasting.slots[level].used = Number(c.spellcasting.slots[level].used) - 1;
  return true;
}

/* ---------------- Rage ----------------
   c.rage = {active, used} and, for the rage going on now, what its
   features have set: frenzy (Frenzy), fanatical (Fanatical Focus used),
   abandon (Reckless Abandon's temporary HP), relentless (a Relentless
   Rage save waiting at 0 HP). c.relentlessUses counts Relentless Rage's
   saves since the last rest (its DC grows by 5 each time). */
var RAGE_STATE = ["frenzy", "fanatical", "abandon", "relentless", "surge", "surgeChoice", "beast", "cleaver"];
function barbLevel(c, subclass){ return classLevelOf(c, "Barbarian", subclass); }
/* Enter a rage: what that brings, as notes for the log (a Wild Surge).
   `roll` (sides -> 1..sides) is for tests. */
export function startRage(c, roll){
  RAGE_STATE.forEach(function(k){ delete c.rage[k]; });
  c.rage.active = true;
  return barbLevel(c, "Path of Wild Magic") >= 3 ? [rollWildSurge(c, roll)] : [];
}
/* The rage ends (the button, a rest, or dropping to 0 HP): what that
   brings, as notes for the log ("Frenzy: 1 level of exhaustion"). */
export function endRage(c){
  if(!c.rage || !c.rage.active) return [];
  var notes = [];
  c.rage.active = false;
  if(c.rage.frenzy){
    c.exhaustion = Math.min(6, (Number(c.exhaustion)||0) + 1);
    notes.push("Frenzy: 1 level of exhaustion");
  }
  // Reckless Abandon's temporary HP vanish with the rage.
  if(c.rage.abandon && c.hp && (Number(c.hp.temp)||0) > 0){
    c.hp.temp = Math.max(0, (Number(c.hp.temp)||0) - c.rage.abandon);
  }
  RAGE_STATE.forEach(function(k){ delete c.rage[k]; });
  return notes;
}
/* Spirit Shield (Path of the Ancestral Guardian, barbarian 6): the dice
   a reaction takes off another creature's damage while raging (2d6, 3d6
   at 10, 4d6 at 14), and whether Vengeful Ancestors (14) sends it back.
   {dice, vengeful} or null. */
export function spiritShield(c){
  var lv = barbLevel(c, "Path of the Ancestral Guardian");
  if(lv < 6 || !(c.rage && c.rage.active)) return null;
  return {dice: lv >= 14 ? 4 : lv >= 10 ? 3 : 2, vengeful: lv >= 14};
}
/* Frenzy (Path of the Berserker, barbarian 3): while raging, go into a
   frenzy. True if it could. */
export function canFrenzy(c){
  return !!(c.rage && c.rage.active) && barbLevel(c, "Path of the Berserker") >= 3 && !c.rage.frenzy;
}
/* Relentless Rage (barbarian 11): dropping to 0 HP while raging asks for
   a CON save, DC 10 and 5 more for each use since the last rest. */
export function relentlessRageDc(c){
  return barbLevel(c) >= 11 ? 10 + 5 * (Number(c.relentlessUses)||0) : 0;
}
/* Rage Beyond Death (Path of the Zealot, barbarian 14): raging at 0 HP,
   you stay conscious and the rage goes on; you die only when it ends with
   you still at 0 HP. */
export function rageBeyondDeath(c){
  return !!(c.rage && c.rage.active) && barbLevel(c, "Path of the Zealot") >= 14;
}
/* Dropping to 0 HP while raging: Relentless Rage's save is set up, and the
   rage goes on while that save is waiting or with Rage Beyond Death. True
   when the rage holds (the caller then doesn't end the effects). */
export function rageAtZero(c){
  if(!(c.rage && c.rage.active)) return false;
  if(relentlessRageDc(c)) c.rage.relentless = true;
  return !!c.rage.relentless || rageBeyondDeath(c);
}
/* The Relentless Rage save's outcome: back to 1 HP on a success, the rage
   still going; on a failure the rage ends (unless Rage Beyond Death holds
   it). Returns "up", "down" or "" when no save was waiting. */
export function resolveRelentlessRage(c, total){
  if(!(c.rage && c.rage.relentless)) return "";
  var dc = relentlessRageDc(c);
  delete c.rage.relentless;
  c.relentlessUses = (Number(c.relentlessUses)||0) + 1;
  if(total >= dc){
    c.hp.current = 1;
    c.deathSaves = {success: 0, fail: 0};
    return "up";
  }
  return "down";
}
/* Reckless Abandon (Path of the Battlerager, barbarian 6): attacking
   recklessly while raging gives temporary HP equal to the CON modifier
   (minimum 1). They don't stack with others: keep the higher. */
function recklessAbandon(c){
  if(!(c.rage && c.rage.active) || barbLevel(c, "Path of the Battlerager") < 6) return;
  var gain = Math.max(1, mod(abilityScore(c, "con")));
  if(!c.hp) c.hp = {max: 0, current: 0, temp: 0};
  if(gain > (Number(c.hp.temp)||0)){ c.hp.temp = gain; c.rage.abandon = gain; }
}

/* What rage gives this barbarian right now, as the Rage card's chips: the
   base benefits, then each path's (a Bear totem's resistance in place of
   the usual one, Frenzy, Mindless Rage, Giant Stature...). Rolls and
   numbers live elsewhere; these are the rules to remember while raging. */
function totemPick(c, setId){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Barbarian" && x.subclass==="Path of the Totem Warrior"; });
  var o = cl && knownOptions(cl, setId)[0];
  return o ? o.name : "";
}
export function ragePerks(c){
  var raging = !!(c.rage && c.rage.active);
  var heavy = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; });
  var spirit = totemPick(c, "totemSpirit"), attune = totemPick(c, "totemAttunement");
  var out = [spirit==="Bear" ? "Resist all damage except psychic" : "Resist bludgeoning, piercing & slashing", "Advantage on Strength checks & saves"];
  var lv = function(sub){ return barbLevel(c, sub); };
  // Path of the Berserker
  if(raging && c.rage.frenzy) out.push("Frenzy: a melee weapon attack as a bonus action each turn");
  if(lv("Path of the Berserker") >= 6) out.push("Can't be charmed or frightened");
  // Path of the Totem Warrior
  if(spirit==="Eagle" && !heavy) out.push("Opportunity attacks against you have disadvantage", "Dash as a bonus action");
  if(spirit==="Wolf") out.push("Friends have advantage on melee attacks against enemies next to you");
  if(spirit==="Tiger") out.push("Long jump +10 ft, high jump +3 ft");
  if(attune==="Bear") out.push("Enemies next to you have disadvantage attacking anyone else");
  if(attune==="Tiger") out.push("After a 20 ft straight charge, a bonus action melee attack");
  if(attune==="Wolf") out.push("On a melee hit, knock a Large or smaller creature prone (bonus action)");
  // Path of the Zealot
  if(lv("Path of the Zealot") >= 6 && !(raging && c.rage.fanatical)) out.push("Reroll one failed save (Fanatical Focus)");
  if(lv("Path of the Zealot") >= 14) out.push("Stay conscious at 0 HP (Rage Beyond Death)");
  // Path of the Ancestral Guardian
  if(lv("Path of the Ancestral Guardian") >= 3) out.push("The first creature you hit each turn has disadvantage attacking anyone else");
  // Path of the Beast
  if(raging && c.rage.beast) out.push("Form of the Beast: " + c.rage.beast.toLowerCase() + " (its card is on the Inventory tab)");
  // Path of the Giant
  var giant = lv("Path of the Giant");
  if(giant >= 14) out.push("Large or Huge, reach +10 ft");
  else if(giant >= 3) out.push("Large, reach +5 ft");
  if(giant >= 3) out.push("Rage damage on thrown weapon attacks");
  // Path of the Storm Herald
  if(lv("Path of the Storm Herald") >= 10) out.push("Creatures you choose in your aura share your Storm Soul resistance");
  // Path of the Battlerager
  if(lv("Path of the Battlerager") >= 10) out.push("Dash as a bonus action");
  var spiked = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && /spiked armor/i.test(i.name||""); });
  if(lv("Path of the Battlerager") >= 14 && spiked) out.push("A creature next to you that hits you with a melee attack takes 3 piercing");
  return out;
}

/* ---- Wild Surge (Path of Wild Magic, barbarian 3) ----
   Entering a rage rolls a d8 on the Wild Magic table (WILD_SURGES), and
   Unstable Backlash (10) rolls again. c.rage.surge is the effect in play;
   with Controlled Surge (14) two rolls wait in c.rage.surgeChoice for the
   player to pick one (the same number twice: any of the eight). Returns a
   note for the log. */
function d(sides){ return Math.floor(Math.random() * sides) + 1; }
export function rollWildSurge(c, roll){
  roll = roll || d;
  var a = roll(8);
  if(barbLevel(c, "Path of Wild Magic") >= 14){
    var b = roll(8);
    delete c.rage.surge;
    c.rage.surgeChoice = a===b ? [1, 2, 3, 4, 5, 6, 7, 8] : [a, b].sort();
    return a===b ? "Wild Surge: " + a + " twice, so choose any effect (Controlled Surge)" : "Wild Surge: " + a + " and " + b + ", choose one (Controlled Surge)";
  }
  return applySurge(c, a, roll);
}
/* Controlled Surge: the effect picked from the two rolled. */
export function chooseWildSurge(c, n, roll){
  if(!(c.rage && c.rage.surgeChoice && c.rage.surgeChoice.indexOf(n)!==-1)) return "";
  delete c.rage.surgeChoice;
  return applySurge(c, n, roll || d);
}
function applySurge(c, n, roll){
  var s = WILD_SURGES[n-1];
  c.rage.surge = n;
  var note = "Wild Surge " + n + ": " + s.name;
  // Shadowy tendrils: 1d12 temporary HP for the barbarian at once (they don't stack: keep the higher).
  if(s.temp){
    var got = roll(12);
    if(!c.hp) c.hp = {max: 0, current: 0, temp: 0};
    if(got > (Number(c.hp.temp)||0)) c.hp.temp = got;
    note += ", " + got + " temporary HP";
  }
  return note;
}
/* The effect in play this rage ({n, name, text, dice, type, save, ac}),
   or null. */
export function wildSurgeNow(c){
  return c.rage && c.rage.active && c.rage.surge ? WILD_SURGES[c.rage.surge-1] : null;
}
export function wildSurgeDc(c){
  return 8 + profBonus(c) + mod(abilityScore(c, "con"));
}

/* ---- Path of the Beast, Path of the Giant, Path of the Storm Herald ---- */
/* Form of the Beast (beast 3): the natural weapon picked for this rage
   (c.rage.beast: "Bite", "Claws" or "Tail"). */
export var BEAST_FORMS = {
  Bite: {die: 8, type: "Piercing", note: "Once on each of your turns, a bite that damages a creature heals you your proficiency bonus, while you have less than half your hit points."},
  Claws: {die: 6, type: "Slashing", note: "Once on each of your turns, when you attack with a claw using the Attack action, you can make one more claw attack."},
  Tail: {die: 8, type: "Piercing", note: "Reach. Reaction: when a creature you can see within 10 feet hits you, roll a d8 and add it to your AC against that attack."}
};
export function beastFormDue(c){
  return !!(c.rage && c.rage.active) && barbLevel(c, "Path of the Beast") >= 3 && !c.rage.beast;
}
export function chooseBeastForm(c, form){
  if(BEAST_FORMS[form] && c.rage && c.rage.active) c.rage.beast = form;
}
/* Elemental Cleaver (giant 6): the weapon infused this rage and its damage
   type (c.rage.cleaver = {item, type}); +1d6 of that type, 2d6 from 14. */
export var CLEAVER_TYPES = ["Acid", "Cold", "Fire", "Lightning", "Thunder"];
export function elementalCleaver(c, item){
  var lv = barbLevel(c, "Path of the Giant");
  if(lv < 6 || !(c.rage && c.rage.active)) return null;
  var cv = c.rage.cleaver;
  if(item && !(cv && cv.item===item.id)) return null;
  return {item: cv ? cv.item : "", type: cv ? cv.type : "", dice: lv >= 14 ? 2 : 1};
}
export function setElementalCleaver(c, itemId, type){
  if(!(c.rage && c.rage.active)) return;
  var cv = c.rage.cleaver || {item: "", type: ""};
  if(itemId!=null) cv.item = itemId;
  if(type!=null) cv.type = type;
  c.rage.cleaver = cv;
}
/* Storm Herald: the environment picked, or "". */
export function stormEnvironment(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Barbarian" && x.subclass==="Path of the Storm Herald"; });
  var o = cl && knownOptions(cl, "stormEnvironment")[0];
  return o ? o.name : "";
}
/* Storm Aura's numbers while raging (storm herald 3): {env, dc, damage
   (Desert, to each other creature), dice (Sea, lightning, DEX save for
   half), temp (Tundra)}, and Raging Storm's (14) Desert fire. Null when
   not raging or no environment is picked. */
export function stormAura(c){
  var lv = barbLevel(c, "Path of the Storm Herald"), env = stormEnvironment(c);
  if(lv < 3 || !env || !(c.rage && c.rage.active)) return null;
  var step = lv >= 20 ? 6 : lv >= 15 ? 5 : lv >= 10 ? 4 : lv >= 5 ? 3 : 2;
  return {env: env, dc: 8 + profBonus(c) + mod(abilityScore(c, "con")), step: step,
    dice: lv >= 20 ? 4 : lv >= 15 ? 3 : lv >= 10 ? 2 : 1,
    ragingStorm: lv >= 14 ? Math.floor(lv / 2) : 0};
}
/* Storm Soul (storm herald 6): resistance by environment, always on.
   [{type, source}]. */
export function stormSoulResistances(c){
  var env = barbLevel(c, "Path of the Storm Herald") >= 6 ? stormEnvironment(c) : "";
  var t = {Desert: "fire", Sea: "lightning", Tundra: "cold"}[env];
  return t ? [{type: t, source: "Storm Soul"}] : [];
}
/* Call the Hunt (beast 14): 5 temporary HP for each creature that joins,
   up to the CON modifier (minimum 1). The most that can join. */
export function callTheHuntMax(c){
  return barbLevel(c, "Path of the Beast") >= 14 ? Math.max(1, mod(abilityScore(c, "con"))) : 0;
}

/* ---- Fighter archetypes ---- */
export function fightingSpiritTempHp(c){
  var lv = classLevelOf(c, "Fighter", "Samurai");
  return lv >= 15 ? 15 : lv >= 10 ? 10 : 5;
}
/* Giant's Might (Rune Knight 3): its extra damage die once per turn, 1d6,
   1d8 from fighter 10 (Great Stature), 1d10 from 18 (Runic Juggernaut),
   while it's on. The die size, or 0. */
export function giantsMightDie(c){
  if(!effectOn(c, "giants_might")) return 0;
  var lv = classLevelOf(c, "Fighter", "Rune Knight");
  return lv >= 18 ? 10 : lv >= 10 ? 8 : 6;
}
/* Advantage on weapon attack rolls from an effect that's on: Reckless
   Attack (STR melee only, worked out by the caller) aside, Fighting
   Spirit's for the turn. A roll mode or null. */
export function weaponAttackEffect(c){
  return effectOn(c, "fighting_spirit") ? {mode: "adv", reason: "Fighting Spirit"} : null;
}
/* An attack was rolled: what it uses up. Shadow Step's advantage goes
   with the next melee attack, Cloak of Shadows ends with any attack.
   True if either changed. */
/* Resistances from what's switched on, for the HP card's line. */
export function effectResistances(c){
  var out = [];
  if(effectOn(c, "empty_body")) out.push({type: "all damage but force", source: "Empty Body"});
  if(effectOn(c, "invincible_conqueror")) out.push({type: "all damage", source: "Invincible Conqueror"});
  if(effectOn(c, "exalted_champion")) out.push({type: "nonmagical bludgeoning, piercing and slashing", source: "Exalted Champion"});
  return out;
}
export function attackEndsEffects(c, melee){
  var changed = false;
  if(melee && effectOn(c, "shadow_step")){ endEffect(c, "shadow_step"); changed = true; }
  if(effectOn(c, "cloak_of_shadows")){ endEffect(c, "cloak_of_shadows"); changed = true; }
  if(effectOn(c, "trickery_cloak")){ endEffect(c, "trickery_cloak"); changed = true; }
  return changed;
}

