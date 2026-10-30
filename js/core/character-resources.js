/* ---------------- Limited uses and hit dice ----------------
   The uses a character has right now (class, subclass, feat and
   invocation ones), what a rest restores, rage numbers and hit dice. */
import { HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASS_RESOURCES, SUBCLASS_RESOURCES, FEAT_RESOURCES, RACE_RESOURCES } from "../data/resources.js";
import { featDef, featSpellEntries } from "./feat-picks.js";
import { invocationResources } from "./invocations.js";
import { knownOptions as knownClassOptions } from "./class-options.js";
import { mod, totalLevel, profBonus, clamp } from "./basics.js";
import { hasFeat } from "./vitals.js";
import { usesVariant, draconicBreath } from "./class-features.js";
import { abilityScore, abilityScores } from "./ability-scores.js";
import { raceSpellEntries } from "./spell-grants.js";
import { raceChoiceValues } from "./class-picks.js";

/* Limited-use resources this character has right now, from each class
   and its subclass. `key` is unique per character (class + resource id)
   and indexes c.resourcesUsed. One with place "inventory" is drawn on the
   Inventory tab instead of the Vitals tab's resources card. */
/* The spells picked for a class feature's grant (see class-picks.js). */
function pickedSpellNames(cl, key){
  var entry = cl.profPicks && cl.profPicks[key];
  if(!entry || !entry.slots) return [];
  return entry.slots.reduce(function(a, s){ return a.concat(s||[]); }, []).filter(Boolean);
}
/* How a resource is counted on the sheet, decided in one place. Points
   you spend in variable amounts or that grow with level (Ki, Lay on Hands,
   Sorcery Points) show as a number, flagged `pool` in js/data/resources.js.
   Anything else is a count of uses shown as pips, up to RESOURCE_PIP_LIMIT,
   and a number beyond that. Unlimited is never a number. */
export var RESOURCE_PIP_LIMIT = 10;
export function resourceIsNumber(r){
  if(r.max===Infinity) return false;
  return !!r.pool || r.max > RESOURCE_PIP_LIMIT;
}
export function characterResources(c){
  var m = {};
  ["str","dex","con","int","wis","cha"].forEach(function(k){ m[k] = mod(abilityScore(c, k)); });
  m.pb = profBonus(c); // proficiency bonus, available to max() as m.pb
  var list = [];
  (c.classes||[]).forEach(function(cl){
    var lv = Number(cl.level)||1;
    var defs = (CLASS_RESOURCES[cl.name]||[]).map(function(r){ return {def:r, source:cl.name}; });
    var subDefs = cl.subclass && SUBCLASS_RESOURCES[cl.name] && SUBCLASS_RESOURCES[cl.name][cl.subclass];
    (subDefs||[]).forEach(function(r){ defs.push({def:r, source:cl.subclass}); });
    defs.forEach(function(d){
      var r = d.def;
      if(lv < r.level) return;
      // Armor-model uses (Defensive Field) only for that model.
      if(r.armorModel && cl.armorModel!==r.armorModel) return;
      // An optional feature's uses (Favored Foe) only for a ranger using it.
      if(r.variant && !usesVariant(cl, r.variant)) return;
      var key = cl.name+":"+r.id;
      // One counter per picked spell (Signature Spells), once they're picked.
      var perSpell = r.perSpell && pickedSpellNames(cl, r.perSpell.grant);
      if(perSpell && perSpell.length){
        perSpell.forEach(function(name){
          var k = key+":"+slug(name);
          list.push({key: k, name: r.perSpell.name.replace("{spell}", name), source: d.source, pool: false,
            hint: r.perSpell.hint.replace("{spell}", name), max: 1, used: clamp(Number((c.resourcesUsed||{})[k])||0, 0, 1), reset: r.reset(lv)});
        });
        return;
      }
      var max = r.max(lv, m);
      // Rune invocations follow the runes actually known (older sheets
      // without picks keep the count for their level).
      var runes = r.id==="rune_invocations" ? knownClassOptions(cl, "runes").length : 0;
      if(runes) max = runes * (lv>=15 ? 2 : 1);
      // (A roll's die can grow with level: superiority dice d8, d10, d12.)
      // (And a roll can add an ability modifier: Protective Field's INT.)
      var roll = r.roll ? Object.assign({}, r.roll, r.roll.dieAt ? {die: r.roll.dieAt(lv)} : {}, r.roll.qtyAt ? {qty: r.roll.qtyAt(lv)} : {}, r.roll.bonusAbility ? {bonus: m[r.roll.bonusAbility]} : {}) : null;
      list.push({
        key: key, name: r.name, source: d.source, hint: typeof r.hint==="function" ? r.hint(lv, m, cl) : r.hint, pool: !!r.pool,
        max: max, used: max===Infinity ? 0 : clamp(Number((c.resourcesUsed||{})[key])||0, 0, max),
        reset: r.reset(lv), roll: roll, heal: r.heal ? r.heal(lv, m) : 0, slotMin: r.slotMin || 0,
        initiativeRegain: r.initiativeRegain && lv >= r.initiativeRegain ? (r.initiativeAmount || 1) : 0
      });
    });
  });
  // Race traits with uses (Relentless Endurance, Fey Step), from the
  // character level they start at.
  var charLv = totalLevel(c);
  (RACE_RESOURCES[c.race]||[]).forEach(function(r){
    if(charLv < (r.level||1)) return;
    // One a choice gives (a Simic Hybrid's Acid Spit) once it's picked.
    if(r.choice && raceChoiceValues(c, r.choice.id).indexOf(r.choice.value)===-1) return;
    var key = "race:"+r.id, max = r.max(charLv, m);
    list.push({
      // "Chromatic Dragonborn", not "Dragonborn (Chromatic)": Vitals puts the source in brackets.
      key: key, name: r.name, source: c.race.replace(/^(.+) \((.+)\)$/, "$2 $1"), hint: r.hint, pool: false,
      max: max, used: clamp(Number((c.resourcesUsed||{})[key])||0, 0, max),
      reset: r.reset(charLv)
    });
  });
  // Feats with uses. One that `joins` a class pool adds to it when the
  // character has that pool (Martial Adept's die and a Battle Master's
  // superiority dice, Metamagic Adept's points and a sorcerer's).
  Object.keys(FEAT_RESOURCES).forEach(function(featName){
    var feat = (c.feats||[]).find(function(f){ return f.name===featName; });
    if(!feat) return;
    FEAT_RESOURCES[featName].forEach(function(r){
      var key = "feat:"+r.id;
      var max = r.max(0, m);
      var pool = r.joins && list.find(function(x){ return x.key===r.joins; });
      if(pool){
        pool.max += max;
        pool.used = clamp(Number((c.resourcesUsed||{})[pool.key])||0, 0, pool.max);
        pool.hint += " " + r.joinHint;
        return;
      }
      list.push({
        key: key, name: typeof r.name==="function" ? r.name(feat) : r.name, source: featName, hint: r.hint, pool: !!r.pool,
        max: max, used: clamp(Number((c.resourcesUsed||{})[key])||0, 0, max),
        reset: r.reset(0)
      });
    });
  });
  // A free cast of each spell a feat teaches (Shadow Touched's
  // Invisibility, Telepathic's Detect Thoughts). Fey Touched's two keep
  // the entries they have always had in FEAT_RESOURCES.
  (c.feats||[]).forEach(function(feat){
    var def = featDef(feat.name);
    if(!def || (FEAT_RESOURCES[feat.name]||[]).some(function(r){ return r.freeCast; })) return;
    featSpellEntries(def, feat.picks).forEach(function(e){
      if(e.use!=="long" && e.use!=="short") return;
      var key = "feat:" + slug(feat.name) + ":" + slug(e.name);
      if(list.some(function(x){ return x.key===key; })) return;
      list.push({
        key: key, name: e.name + " (" + feat.name + ")", source: feat.name, pool: false,
        hint: "Cast " + e.name + " once without a spell slot. Casting it with a slot you have doesn't use this.",
        max: 1, used: clamp(Number((c.resourcesUsed||{})[key])||0, 0, 1), reset: e.use
      });
    });
  });
  // A free cast of each of the race's once-a-rest spells (Drow Magic's
  // Darkness, Firbolg Magic's Detect Magic), from the level it arrives.
  raceSpellEntries(c).forEach(function(e){
    if(e.use!=="long" && e.use!=="short") return;
    var key = "race:spell:" + slug(e.name);
    if(list.some(function(x){ return x.key===key; })) return;
    list.push({
      key: key, name: e.name + " (" + e.feature + ")", source: c.race.replace(/^(.+) \((.+)\)$/, "$2 $1"), pool: false,
      hint: "Cast " + e.name + " once without a spell slot." + (e.slots ? " Casting it with a slot you have doesn't use this." : ""),
      max: 1, used: clamp(Number((c.resourcesUsed||{})[key])||0, 0, 1), reset: e.use
    });
  });
  // A dragonborn's Breath Weapon (once per short or long rest, or a
  // Fizban's dragonborn's proficiency bonus per long rest) and a Metallic
  // dragonborn's second breath. Their card is with the weapons on the
  // Inventory tab.
  var breath = draconicBreath(c);
  if(breath){
    list.push({key: "race:breath_weapon", name: "Breath Weapon", source: c.race, place: "inventory", pool: false,
      hint: "Exhale your draconic ancestry's damage.", max: breath.uses,
      used: clamp(Number((c.resourcesUsed||{})["race:breath_weapon"])||0, 0, breath.uses), reset: breath.reset});
    if(breath.metallic) list.push({key: "race:metallic_breath", name: "Metallic Breath Weapon", source: c.race, place: "inventory", pool: false,
      hint: "Enervating or Repulsion Breath in a 15 ft cone.", max: 1,
      used: clamp(Number((c.resourcesUsed||{})["race:metallic_breath"])||0, 0, 1), reset: "long"});
  }
  // Superior Technique (Tasha's fighting style): one d6 superiority die,
  // added to a pool the character already has (Battle Master, Martial Adept).
  if((c.features||[]).some(function(f){ return f && f.fightingStyle==="Superior Technique"; })){
    var stPool = list.find(function(x){ return x.key==="Fighter:superiority_dice"; }) || list.find(function(x){ return x.key==="feat:superiority_dice"; });
    if(stPool){
      stPool.max += 1;
      stPool.used = clamp(Number((c.resourcesUsed||{})[stPool.key])||0, 0, stPool.max);
      stPool.hint += " Includes Superior Technique's die (a d6).";
    } else {
      list.push({key: "style:superiority_dice", name: "Superiority Die", source: "Superior Technique", pool: false,
        hint: "A d6 that fuels your Superior Technique maneuver.", max: 1,
        used: clamp(Number((c.resourcesUsed||{})["style:superiority_dice"])||0, 0, 1), reset: "short"});
    }
  }
  // What a fighter archetype adds to Action Surge (Arcane Charge, Inspiring Surge).
  var surge = list.find(function(x){ return x.key==="Fighter:action_surge"; });
  if(surge){
    var ek = classLevelIn(c, "Fighter", "Eldritch Knight"), ban = classLevelIn(c, "Fighter", "Banneret (Purple Dragon Knight)");
    if(ek >= 15) surge.hint += " Arcane Charge: you can also teleport up to 30 feet to a space you can see, before or after the extra action.";
    if(ban >= 10) surge.hint += " Inspiring Surge: " + (ban >= 18 ? "two allies" : "one ally") + " within 60 feet who can see or hear you can make one weapon attack with their reaction.";
  }
  // Pact Boon and invocation uses (Tomb of Levistus, Sign of Ill Omen's curse).
  return list.concat(invocationResources(c, m));
}
function classLevelIn(c, name, subclass){
  var cl = (c.classes||[]).find(function(x){ return x.name===name && x.subclass===subclass; });
  return cl ? Number(cl.level)||1 : 0;
}
/* Second Wind's healing (1d10 + fighter level) and Rallying Cry's
   (Banneret 3): allies healed by the fighter level. {die, bonus, rally}
   or null without Second Wind. Survivor's (Champion 18): 5 + CON while
   at half HP or less, {heal, due}. */
export function secondWind(c){
  var lv = (c.classes||[]).reduce(function(a, cl){ return cl.name==="Fighter" ? Number(cl.level)||1 : a; }, 0);
  return lv ? {die: 10, bonus: lv, rally: classLevelIn(c, "Fighter", "Banneret (Purple Dragon Knight)") >= 3 ? lv : 0} : null;
}
export function survivorHeal(c){
  if(classLevelIn(c, "Fighter", "Champion") < 18) return null;
  var hp = c.hp || {}, cur = Number(hp.current)||0, max = Number(hp.max)||0;
  return {heal: 5 + mod(abilityScore(c, "con")), due: cur > 0 && cur <= max / 2};
}
/* Rolling initiative with none left gives one back (Relentless, Tireless
   Spirit, Ever-Ready Shot, Legion of One: a resource's initiativeRegain).
   The names that came back. */
export function regainOnInitiative(c){
  var back = [];
  characterResources(c).forEach(function(r){
    if(!r.initiativeRegain || r.max===Infinity || r.used < r.max) return;
    c.resourcesUsed[r.key] = Math.max(0, r.used - r.initiativeRegain);
    back.push(r.name);
  });
  return back;
}
/* Restore resources on a rest. A long rest restores everything except
   "manual" ones; a short rest only what recharges on one. Returns the names restored. */
function slug(text){ return (text||"").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
export function restoreResources(c, restType){
  var restored = [];
  characterResources(c).forEach(function(r){
    if(r.reset==="manual") return;
    if(restType==="short" && r.reset!=="short") return;
    if(r.used>0) restored.push(r.name);
    delete c.resourcesUsed[r.key];
  });
  return restored;
}
export function barbarianClassEntry(c){
  return (c.classes||[]).find(function(cl){ return cl.name==="Barbarian"; });
}
export function barbarianRageDamage(level){
  return level>=16 ? 4 : level>=9 ? 3 : 2;
}
export function barbarianRageMax(level){
  if(level>=20) return Infinity;
  if(level>=17) return 6;
  if(level>=12) return 5;
  if(level>=6) return 4;
  if(level>=3) return 3;
  return 2;
}

/* ---------------- Hit dice ----------------
   One die per class level, by size (a Barbarian 3 / Wizard 2 has 3d12
   and 2d6). c.hitDiceSpent = {12: 1, 6: 0} counts spent dice per size and
   c.hitDiceUsed keeps the total. Older saves only have the total; it's
   read as spent from the largest die down. [{die, total, used}], largest
   die first. */
export function hitDicePools(c){
  var totals = {};
  (c.classes||[]).forEach(function(cl){
    var d = HIT_DICE_BY_CLASS[cl.name] || 8;
    totals[d] = (totals[d]||0) + (Number(cl.level)||1);
  });
  var sizes = Object.keys(totals).map(Number).sort(function(a, b){ return b - a; });
  if(!sizes.length){ sizes = [8]; totals[8] = 1; }
  var spent = c.hitDiceSpent;
  var left = clamp(Number(c.hitDiceUsed)||0, 0, totalLevel(c));
  return sizes.map(function(d){
    var used;
    if(spent) used = clamp(Number(spent[d])||0, 0, totals[d]);
    else { used = Math.min(left, totals[d]); left -= used; }
    return {die: d, total: totals[d], used: used};
  });
}
function saveHitDice(c, pools){
  c.hitDiceSpent = {};
  pools.forEach(function(p){ if(p.used) c.hitDiceSpent[p.die] = p.used; });
  c.hitDiceUsed = pools.reduce(function(n, p){ return n + p.used; }, 0);
}
/* Brings c.hitDiceSpent and c.hitDiceUsed in line with the classes (after
   a level-up is undone). */
export function syncHitDice(c){ saveHitDice(c, hitDicePools(c)); }
/* Spend a die of the given size, or the largest left when none is given.
   Returns its size, or 0 if none of that size are left. */
export function spendHitDie(c, die){
  var pools = hitDicePools(c);
  // The size the player picked, or the largest left when none is given.
  var pool = pools.find(function(p){ return p.used < p.total && (!die || p.die===die); });
  if(!pool) return 0;
  pool.used++;
  saveHitDice(c, pools);
  return pool.die;
}
/* A long rest gives back half the character's dice (at least one),
   largest first. Returns how many came back. */
export function recoverHitDice(c){
  var pools = hitDicePools(c);
  var n = Math.max(1, Math.floor(totalLevel(c) / 2)), back = 0;
  pools.forEach(function(p){
    var take = Math.min(n - back, p.used);
    p.used -= take; back += take;
  });
  saveHitDice(c, pools);
  return back;
}

/* HP from one spent hit die: roll + CON (at least 1). Durable raises the
   floor to twice the CON modifier, at least 2. */
export function hitDieHealing(c, roll){
  var conMod = mod(abilityScore(c, "con"));
  var floor = hasFeat(c, "Durable") ? Math.max(2, 2 * conMod) : 1;
  return Math.max(floor, roll + conMod);
}
