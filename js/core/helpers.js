import { HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../data/classes.js";
import { RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { RACE_DATA } from "../data/race-data.js";
import { ARMOR_MODELS } from "../data/artificer-extras.js";
import { BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";
import { CLASS_PROGRESSION, SUBCLASSES, SPELL_SLOT_TABLE, PACT_SLOT_TABLE } from "../data/progression.js";
import { WEAPON_DATA } from "../data/weapons.js";
import { CLASS_RESOURCES, SUBCLASS_RESOURCES, FEAT_RESOURCES } from "../data/resources.js";
import { featDef, featProficiencies, featPicksSummary } from "./feat-picks.js";
import { SPELL_DATA, catalogSpellName } from "../data/spells.js";

/* ---------------- Helpers ---------------- */
export function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
export function mod(score){ return Math.floor((Number(score||10)-10)/2); }
export function fmtMod(n){ return (n>=0?"+":"")+n; }
export function totalLevel(c){ return (c.classes||[]).reduce(function(a,cl){return a+(Number(cl.level)||0);},0) || 1; }
export function profBonus(c){ return Math.floor((totalLevel(c)-1)/4)+2; }
export function primaryHitDie(c){
  var cl = (c.classes||[])[0];
  if(!cl) return 8;
  return HIT_DICE_BY_CLASS[cl.name] || 8;
}
export function characterIsCaster(c){
  return (c.classes||[]).some(function(cl){
    var info = CLASSES_INFO[cl.name];
    var type = classCasterType(cl);
    if(type==="third") return true;
    // Paladins and Rangers only start casting at level 2.
    if(type==="half" && (Number(cl.level)||1) < 2) return false;
    return info ? !!info.spellcaster : true; // unknown class name: don't hide existing spell data
  });
}

/* ---------------- Levelling / subclass helpers ---------------- */
export function findSubclass(className, subclassName){
  if(!subclassName) return null;
  return (SUBCLASSES[className]||[]).find(function(s){ return s.name===subclassName; }) || null;
}
/* "full" | "half" | "artificer" | "pact" | "third" | null. A subclass can
   make a non-caster class a one-third caster (Eldritch Knight etc.). */
export function classCasterType(cl){
  var sub = findSubclass(cl.name, cl.subclass);
  if(sub && sub.casterType) return sub.casterType;
  var prog = CLASS_PROGRESSION[cl.name];
  return prog ? prog.casterType : null;
}
export function classSpellAbility(cl){
  var sub = findSubclass(cl.name, cl.subclass);
  if(sub && sub.spellAbility) return sub.spellAbility;
  var prog = CLASS_PROGRESSION[cl.name];
  return prog && prog.spellAbility || null;
}
/* Mechanical flags a class or subclass feature can carry; they're copied
   onto classFeatureList items so the sheet can apply them:
     speed         walking speed gained at level-up (Fast Movement)
     initiative    ability ("wis", "int", ...) or "pb" added to initiative
     acHeavyArmor  AC bonus while wearing heavy armor (Soul of the Forge)
     grants        {armor, weapons, tools, savingThrows} proficiencies
                   (Battle Ready; Diamond Soul grants every save)
     saveBonus     ability whose modifier (minimum +1) is added to every
                   saving throw (Aura of Protection: "cha")
     magicWeaponAbility  ability usable for attacks with magic weapons
     chosenWeaponAbility  ability usable with one weapon the player marks
                   as `chosenWeapon` in the inventory (Hex Warrior)
     abilityBonus  {str:4, ...} added to ability scores at level-up, up to
                   abilityMax (default 20) (Primal Champion)
     spells        spells the feature grants: a list (a replacing entry
                   carries the whole list so far, like Domain Spells) or an
                   object keyed by class level (Psionic Spells)
     spellKind     "prepared", "known", "spellbook", "ritual" or "expanded"
                   (added to the spells the class can learn: a warlock
                   patron's list) (see featureSpells)
     speeds        [{type, value, when}]: a fly, swim or climb speed. value
                   is feet, "walk" (equal to walking speed) or "2walk";
                   `when` says when it applies ("while raging (Eagle)"),
                   none for an always-on speed. {type, bonus} instead adds
                   to that speed from any other source (Superior Mobility).
     spellChoice   {id, label, options:{name: spells}}: more spells that
                   depend on a choice (Circle of the Land's land, a genie
                   kind), each option shaped like `spells`. The pick is
                   saved on the class entry as spellChoices[id]. */
var FEATURE_FLAGS = ["speed", "initiative", "acHeavyArmor", "grants", "magicWeaponAbility", "chosenWeaponAbility", "abilityBonus", "abilityMax", "saveBonus", "spells", "spellKind", "spellChoice", "speeds"];

/* Class features a class entry has at its current level: level-1 features
   from classes.js, then each level's progression features (a `replaces`
   entry swaps out the earlier version), then subclass features. Each item
   gets an `id` stable across levels so a "new" flag can point at it. */
export function classFeatureList(cl, uptoLevel){
  var level = uptoLevel!=null ? uptoLevel : (Number(cl.level)||1);
  var list = [];
  var info = CLASSES_INFO[cl.name];
  (info && info.features || []).forEach(function(f){
    list.push({id:"class_"+cl.name+"_"+f.name, name:f.name, text:f.text, level:1, subclass:false});
  });
  var prog = CLASS_PROGRESSION[cl.name];
  var sub = findSubclass(cl.name, cl.subclass);
  for(var lv=2; lv<=level; lv++){
    ((prog && prog.features[lv]) || []).forEach(function(f){ addFeature(f, lv, false); });
  }
  if(sub){
    for(var sl=1; sl<=level; sl++){
      ((sub.features && sub.features[sl]) || []).forEach(function(f){ addFeature(f, sl, true); });
    }
  }
  function addFeature(f, atLevel, isSub){
    var item = {id:(isSub ? "sub_" : "class_")+cl.name+"_"+f.name, name:f.name, text:f.text, level:atLevel, subclass:isSub};
    FEATURE_FLAGS.forEach(function(k){ if(f[k]) item[k] = f[k]; });
    var at = f.replaces ? list.findIndex(function(x){ return x.name===f.replaces; }) : -1;
    if(at!==-1){ item.id = list[at].id; item.upgraded = true; list[at] = item; }
    else list.push(item);
  }
  return list;
}
/* Features gained exactly on reaching `level` in this class (for the
   level-up popup), including improved versions of earlier ones. */
export function classFeaturesGainedAt(cl, level){
  return classFeatureList(cl, level).filter(function(f){ return f.level===level; });
}

/* Spell slots from the (multiclass) spellcaster table. A single
   spellcasting class uses its own table (half/third casters round up
   there); with several, the multiclass rules round half/third down. */
export function computeSpellSlots(classes){
  var casters = [];
  var warlockLevel = 0;
  (classes||[]).forEach(function(cl){
    var t = classCasterType(cl);
    var lv = Number(cl.level)||0;
    if(t==="pact") warlockLevel += lv;
    else if(t) casters.push({type:t, level:lv});
  });
  var casterLevel = 0;
  if(casters.length===1){
    var one = casters[0];
    if(one.type==="full") casterLevel = one.level;
    else if(one.type==="half") casterLevel = one.level>=2 ? Math.ceil(one.level/2) : 0;
    else if(one.type==="artificer") casterLevel = Math.ceil(one.level/2);
    else if(one.type==="third") casterLevel = one.level>=3 ? Math.ceil(one.level/3) : 0;
  } else {
    casters.forEach(function(x){
      if(x.type==="full") casterLevel += x.level;
      else if(x.type==="half") casterLevel += Math.floor(x.level/2);
      else if(x.type==="artificer") casterLevel += Math.ceil(x.level/2);
      else if(x.type==="third") casterLevel += Math.floor(x.level/3);
    });
  }
  casterLevel = Math.min(20, casterLevel);
  var row = SPELL_SLOT_TABLE[casterLevel] || [];
  var slots = {};
  for(var i=1;i<=9;i++) slots[i] = row[i-1] || 0;
  var pactRow = PACT_SLOT_TABLE[Math.min(20, warlockLevel)];
  return { slots: slots, pact: pactRow ? {max:pactRow[0], slotLevel:pactRow[1]} : null };
}

/* Proficiencies a class grants this character: the full list for the
   first (starting) class, the reduced multiclass list for the others. */
export function classProficiencies(c, idx){
  var cl = (c.classes||[])[idx];
  if(!cl) return null;
  var base;
  var prog = CLASS_PROGRESSION[cl.name];
  if(idx===0 || !prog) base = CLASS_PROFICIENCIES[cl.name] || null;
  else {
    var m = prog.multiclassProfs;
    base = {armor:m.armor, weapons:m.weapons, tools:m.tools, savingThrows:[], note:m.note};
  }
  // Features tagged `grants` (a subclass's tool or armor proficiency) add
  // to the class's own list; copies, so the shared data isn't changed.
  var extra = classFeatureList(cl).filter(function(f){ return f.grants; });
  if(!extra.length) return base;
  var p = {armor:(base&&base.armor||[]).slice(), weapons:(base&&base.weapons||[]).slice(), tools:(base&&base.tools||[]).slice(),
    savingThrows:(base&&base.savingThrows||[]).slice(), note:base&&base.note};
  extra.forEach(function(f){
    ["armor","weapons","tools","savingThrows"].forEach(function(k){
      (f.grants[k]||[]).forEach(function(v){ if(p[k].indexOf(v)===-1) p[k].push(v); });
    });
  });
  return p;
}
/* Limited-use resources this character has right now, from each class
   and its subclass. `key` is unique per character (class + resource id)
   and indexes c.resourcesUsed. */
export function characterResources(c){
  var m = {};
  ["str","dex","con","int","wis","cha"].forEach(function(k){ m[k] = mod(c.abilities && c.abilities[k]); });
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
      var key = cl.name+":"+r.id;
      var max = r.max(lv, m);
      list.push({
        key: key, name: r.name, source: d.source, hint: r.hint, pool: !!r.pool,
        max: max, used: clamp(Number((c.resourcesUsed||{})[key])||0, 0, max),
        reset: r.reset(lv)
      });
    });
  });
  // Feats with uses. Martial Adept's die adds to a Battle Master's
  // superiority dice when the character has them.
  Object.keys(FEAT_RESOURCES).forEach(function(featName){
    if(!hasFeat(c, featName)) return;
    FEAT_RESOURCES[featName].forEach(function(r){
      var key = "feat:"+r.id;
      if(featName==="Martial Adept"){
        var pool = list.find(function(x){ return x.key==="Fighter:superiority_dice"; });
        if(pool){
          pool.max += 1;
          pool.used = clamp(Number((c.resourcesUsed||{})[pool.key])||0, 0, pool.max);
          pool.hint += " Includes Martial Adept's extra die (a d6).";
          return;
        }
      }
      var max = r.max(0, m);
      list.push({
        key: key, name: r.name, source: featName, hint: r.hint, pool: !!r.pool,
        max: max, used: clamp(Number((c.resourcesUsed||{})[key])||0, 0, max),
        reset: r.reset(0)
      });
    });
  });
  return list;
}
/* Restore resources on a rest. A long rest restores everything except
   "manual" ones; a short rest only what recharges on one. Returns the names restored. */
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

/* ---------------- Feats the sheet applies ----------------
   Feats are matched by name. Their bonuses are worked out when shown
   rather than added to saved numbers, so taking, deleting or undoing a
   feat needs no bookkeeping. */
export function hasFeat(c, name){
  var lower = name.toLowerCase();
  return (c.feats||[]).some(function(f){ return ((f.name||"") + "").toLowerCase()===lower; });
}
/* Max HP: the saved number (hit dice, level-ups, manual changes) plus
   Tough's 2 per character level. */
export function toughBonus(c){
  return hasFeat(c, "Tough") ? 2 * totalLevel(c) : 0;
}
export function maxHp(c){
  return (Number(c.hp && c.hp.max)||0) + toughBonus(c);
}
/* Walking speed: the saved number plus Mobile's 10 ft and an Infiltrator
   Armorer's Powered Steps (while wearing armor); `parts` names each bonus
   for the hint. `others` are the
   fly, swim and climb speeds from the race and from features tagged
   `speeds`, as {type, value, when, source}: always-on ones first (only
   the best of each type), then the ones that depend on something. */
export function computeSpeed(c){
  var parts = [];
  if(hasFeat(c, "Mobile")) parts.push({name: "Mobile", value: 10});
  var armorer = (c.classes||[]).find(function(cl){ return cl.name==="Artificer" && cl.subclass==="Armorer" && (Number(cl.level)||1) >= 3; });
  var model = armorer && ARMOR_MODELS[armorer.armorModel];
  var inArmor = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category!=="shield"; });
  if(model && model.speed && inArmor) parts.push({name: "Powered Steps", value: model.speed});
  var mobile = parts.reduce(function(a, p){ return a + p.value; }, 0);
  var walk = (Number(c.speed)||0) + mobile;
  var list = [], bonus = {};
  var race = RACE_DATA[c.race];
  var rs = race && race.speed || {};
  ["fly", "swim", "climb"].forEach(function(t){
    if(rs[t]) list.push({type: t, value: rs[t], when: (race.speedWhen||{})[t] || "", source: c.race});
  });
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      (f.speeds||[]).forEach(function(sp){
        if(sp.bonus){ bonus[sp.type] = (bonus[sp.type]||0) + sp.bonus; return; }
        var value = sp.value==="walk" ? walk : sp.value==="2walk" ? 2 * walk : sp.value;
        list.push({type: sp.type, value: value, when: sp.when || "", source: f.name});
      });
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
  return { value: walk, bonus: mobile, parts: parts, others: others };
}
/* HP from one spent hit die: roll + CON (at least 1). Durable raises the
   floor to twice the CON modifier, at least 2. */
export function hitDieHealing(c, roll){
  var conMod = mod(c.abilities && c.abilities.con);
  var floor = hasFeat(c, "Durable") ? Math.max(2, 2 * conMod) : 1;
  return Math.max(floor, roll + conMod);
}

/* ---------------- Armor Class ----------------
   Computed from equipped armor/shield inventory items rather than a raw
   manual number, with Barbarian/Monk Unarmored Defense honored when no
   body armor is equipped. c.acMisc covers anything else (rings, feats). */
export function computeArmorClass(c){
  var dexMod = mod(c.abilities && c.abilities.dex);
  var items = (c.inventory||[]).filter(function(i){ return i.type==="armor" && i.equipped; });
  var bodyArmor = items.find(function(i){ return i.category!=="shield"; });
  var shieldBonus = items.filter(function(i){ return i.category==="shield"; })
    .reduce(function(a,i){ return a + (Number(i.baseAC)||0) + (Number(i.magicBonus)||0); }, 0);
  var misc = Number(c.acMisc)||0;
  var base, breakdown, short;

  if(bodyArmor){
    var dexContribution = 0;
    if(bodyArmor.category==="light") dexContribution = dexMod;
    else if(bodyArmor.category==="medium") dexContribution = Math.min(dexMod, hasFeat(c, "Medium Armor Master") ? 3 : 2);
    var armorAC = Number(bodyArmor.baseAC)||10;
    var magic = Number(bodyArmor.magicBonus)||0;
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
      var conMod = mod(c.abilities && c.abilities.con);
      options.push({value: 10 + dexMod + conMod, breakdown: "Unarmored Defense: 10 + DEX (" + fmtMod(dexMod) + ") + CON (" + fmtMod(conMod) + ")", short: "10 + DEX + CON"});
    }
    if(hasClass("Monk") && !shieldBonus){
      var wisMod = mod(c.abilities && c.abilities.wis);
      options.push({value: 10 + dexMod + wisMod, breakdown: "Unarmored Defense: 10 + DEX (" + fmtMod(dexMod) + ") + WIS (" + fmtMod(wisMod) + ")", short: "10 + DEX + WIS"});
    }
    if(hasClass("Sorcerer", "Draconic Bloodline")){
      options.push({value: 13 + dexMod, breakdown: "Draconic Resilience: 13 + DEX (" + fmtMod(dexMod) + ")", short: "13 + DEX"});
    }
    var best = options.reduce(function(a, o){ return o.value > a.value ? o : a; });
    base = best.value; breakdown = best.breakdown; short = best.short;
  }

  if(shieldBonus){ breakdown += " + shield (" + fmtMod(shieldBonus) + ")"; short += " + shield"; }
  var defense = bodyArmor && hasFightingStyle(c, "Defense") ? 1 : 0;
  if(defense){ breakdown += " + Defense style (+1)"; short += " + Defense"; }
  base += defense;
  // Dual Wielder: +1 while wielding a separate melee weapon in each hand
  // (two equipped melee weapon items; a "Dagger ×2" stack is one weapon).
  var dualWielder = hasFeat(c, "Dual Wielder") &&
    (c.inventory||[]).filter(function(i){ return i.type==="weapon" && i.equipped && !isRangedWeapon(i); }).length >= 2 ? 1 : 0;
  if(dualWielder){ breakdown += " + Dual Wielder (+1)"; short += " + Dual Wielder"; }
  base += dualWielder;
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
  if(misc){ breakdown += " + misc (" + fmtMod(misc) + ")"; short += " + misc"; }

  return { value: base + shieldBonus + misc, breakdown: breakdown, short: short };
}

/* Initiative: DEX, plus the ability modifier of any class or subclass
   feature tagged `initiative` (Dread Ambusher adds WIS, Tactical Wit INT,
   ...; "pb" adds the proficiency bonus, e.g. Aura of the Sentinel), the Alert feat, a Harengon's Hare-Trigger and the misc modifier.
   Same shape as computeArmorClass: `breakdown` for the tooltip, `short`
   for the hint under the value. */
export function computeInitiative(c){
  var dexMod = mod(c.abilities && c.abilities.dex);
  var value = dexMod;
  var breakdown = "DEX (" + fmtMod(dexMod) + ")";
  var short = "DEX";
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      if(!f.initiative) return;
      var bonus = f.initiative==="pb" ? profBonus(c) : mod(c.abilities && c.abilities[f.initiative]);
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
  value += misc; breakdown += " + misc (" + fmtMod(misc) + ")"; short += " + misc";
  return { value: value, breakdown: breakdown, short: short };
}

/* A saving throw: ability modifier, proficiency (ticked on the sheet or
   granted by a feature such as Diamond Soul) and feature bonuses such as
   Aura of Protection. `grantedBy` names the feature that makes the save
   proficient, so the sheet can lock that box. */
export function computeSave(c, key){
  var abilityMod = mod(c.abilities && c.abilities[key]);
  var grantedBy = null, bonuses = [];
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      if(!grantedBy && f.grants && (f.grants.savingThrows||[]).indexOf(key)!==-1) grantedBy = f.name;
      if(f.saveBonus && !bonuses.some(function(b){ return b.name===f.name; })){
        bonuses.push({name:f.name, value: Math.max(1, mod(c.abilities && c.abilities[f.saveBonus]))});
      }
    });
  });
  // Resilient: proficiency in the ability it raised.
  if(!grantedBy) featProficiencies(c).saves.forEach(function(s){ if(!grantedBy && s.ability===key) grantedBy = s.feat; });
  var prof = !!(c.saveProfs && c.saveProfs[key]) || !!grantedBy;
  var value = abilityMod + (prof ? profBonus(c) : 0);
  var breakdown = key.toUpperCase() + " (" + fmtMod(abilityMod) + ")" + (prof ? " + proficiency (" + fmtMod(profBonus(c)) + ")" : "");
  bonuses.forEach(function(b){ value += b.value; breakdown += " + " + b.name + " (" + fmtMod(b.value) + ")"; });
  return { value: value, prof: prof, grantedBy: grantedBy, breakdown: breakdown };
}

/* Spells the character's class and subclass features grant, once each,
   in feature order: always prepared (Domain Spells), always known (Psionic
   Spells, bonus cantrips), added to the spellbook (Undead Thralls) or
   ritual-only (Spirit Seeker). Worked out from the current features, not
   saved, so it follows level-ups and undo. `data` is the catalog entry. */
export function featureSpells(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    var lv = Number(cl.level)||1;
    classFeatureList(cl).forEach(function(f){
      var names = f.spells ? spellsUpTo(f.spells, lv) : [];
      var pick = f.spellChoice && (cl.spellChoices||{})[f.spellChoice.id];
      if(pick && f.spellChoice.options[pick]) names = names.concat(spellsUpTo(f.spellChoice.options[pick], lv));
      names.forEach(function(name){
        if(out.some(function(x){ return x.name===name; })) return;
        var data = SPELL_DATA[catalogSpellName(name)] || null;
        out.push({ name: name, data: data, level: data ? data.level : 0, kind: f.spellKind || "prepared",
          source: f.subclass ? cl.subclass : cl.name, feature: f.name, className: cl.name });
      });
    });
  });
  return out;
}
/* A `spells` list: every name, or those keyed at or below class level `lv`. */
function spellsUpTo(spells, lv){
  if(Array.isArray(spells)) return spells;
  return Object.keys(spells).filter(function(k){ return Number(k) <= lv; })
    .reduce(function(a, k){ return a.concat(spells[k]); }, []);
}
/* Spell choices a class entry has at `level` (default: its own), with
   what's picked: [{feature, choice, pick}]. */
export function classSpellChoices(cl, level){
  return classFeatureList(cl, level).filter(function(f){ return f.spellChoice; }).map(function(f){
    return {feature: f.name, choice: f.spellChoice, pick: (cl.spellChoices||{})[f.spellChoice.id] || ""};
  });
}
/* Choices still to make, across classes: [{cl, feature, choice}]. */
export function pendingSpellChoices(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    classSpellChoices(cl).forEach(function(x){ if(!x.pick) out.push({cl: cl, feature: x.feature, choice: x.choice}); });
  });
  return out;
}
/* One option's spells as text: "Hold Person, Spike Growth (Druid 3);
   Sleet Storm, Slow (5); ..." (the class level each pair arrives at), or
   just the names for a flat list. */
export function spellOptionText(spells, className){
  if(Array.isArray(spells)) return spells.join(", ");
  return Object.keys(spells).map(function(k, i){ return spells[k].join(", ") + " (" + (i ? "" : (className || "level") + " ") + k + ")"; }).join("; ");
}
/* The Spells tab shows for casters, and for anyone a feature grants a
   spell (a Shadow monk's Minor Illusion). */
export function hasSpellsTab(c){
  return characterIsCaster(c) || featureSpells(c).length > 0;
}

/* Fighting styles live on the sheet as features tagged `fightingStyle`
   (see applyClassChoices), so deleting the feature removes its bonus. */
export function hasFightingStyle(c, style){
  return (c.features||[]).some(function(f){ return f.fightingStyle===style; });
}
export function isRangedWeapon(item){
  var d = WEAPON_DATA[item.name];
  return !!(d && d.ranged);
}

/* ---------------- Equipping: one armor, two hands ----------------
   A character wears at most one suit of armor and carries at most one
   shield, and has two hands: a shield takes one, a weapon takes one, a
   two-handed weapon takes both (a stack like "Dagger ×2" counts as one
   weapon in hand). */
function isBodyArmor(i){ return i.type==="armor" && i.category!=="shield"; }
function isShield(i){ return i.type==="armor" && i.category==="shield"; }
function isTwoHanded(item){
  var d = WEAPON_DATA[item.name];
  return /two-handed/i.test(((d && d.properties) || "") + " " + (item.notes || ""));
}
export function itemHands(item){
  if(isShield(item)) return 1;
  if(item.type==="weapon") return isTwoHanded(item) ? 2 : 1;
  return 0;
}
/* What's in the character's hands right now. */
export function handsInUse(c, except){
  var held = (c.inventory||[]).filter(function(i){ return i.equipped && i!==except && itemHands(i) > 0; });
  return {used: held.reduce(function(n, i){ return n + itemHands(i); }, 0), items: held};
}
/* Equip an item, following the rules above. Another suit of armor (or
   shield) comes off automatically; a weapon or shield that needs a hand
   you don't have is refused. Returns {ok, message}; nothing changes when
   ok is false. */
export function tryEquip(c, item){
  var swapped = [];
  if(isBodyArmor(item) || isShield(item)){
    var same = isBodyArmor(item) ? isBodyArmor : isShield;
    (c.inventory||[]).forEach(function(i){ if(i!==item && i.equipped && same(i)) swapped.push(i); });
  }
  var need = itemHands(item);
  if(need){
    var held = handsInUse(c, item).items.filter(function(i){ return swapped.indexOf(i)===-1; });
    var used = held.reduce(function(n, i){ return n + itemHands(i); }, 0);
    if(used + need > 2){
      var names = held.map(function(i){ return i.name; }).join(" and ");
      return {ok:false, message: need===2
        ? (item.name||"This weapon")+" needs both hands, but you're holding "+names+". Unequip "+(held.length>1 ? "them" : "it")+" first."
        : "Your hands are full ("+names+"). Unequip something first."};
    }
  }
  swapped.forEach(function(i){ i.equipped = false; });
  item.equipped = true;
  return {ok:true, message: swapped.length ? "Took off "+swapped.map(function(i){ return i.name; }).join(", ")+"." : ""};
}
/* Rule breaks in an existing inventory (older saves could equip freely);
   shown as a warning so the player can fix them. kind: "armor" | "hands". */
export function equipProblems(c){
  var eq = (c.inventory||[]).filter(function(i){ return i.equipped; });
  var out = [];
  var armor = eq.filter(isBodyArmor), shields = eq.filter(isShield);
  if(armor.length > 1) out.push({kind:"armor", text:"You can only wear one suit of armor. Unequip "+armor.slice(1).map(function(i){ return i.name; }).join(", ")+" (only "+armor[0].name+" counts toward AC)."});
  if(shields.length > 1) out.push({kind:"armor", text:"You can only carry one shield. Unequip "+shields.slice(1).map(function(i){ return i.name; }).join(", ")+"."});
  var hands = handsInUse(c);
  if(hands.used > 2) out.push({kind:"hands", text:"That's "+hands.used+" hands' worth of gear ("+hands.items.map(function(i){ return i.name; }).join(", ")+"). You only have two."});
  return out;
}
/* A legal starting loadout for a new character: the first suit of armor,
   then shield and weapons in list order while hands are free; the rest
   goes in the pack. */
export function autoEquipLoadout(items){
  var hands = 0, wearing = false, shield = false;
  items.forEach(function(i){
    if(i.type!=="weapon" && i.type!=="armor"){ i.equipped = false; return; }
    if(isBodyArmor(i)){ i.equipped = !wearing; wearing = true; return; }
    if(isShield(i) && shield){ i.equipped = false; return; }
    var need = itemHands(i);
    i.equipped = hands + need <= 2;
    if(i.equipped){ hands += need; if(isShield(i)) shield = true; }
  });
  return items;
}

/* ---------------- Weapon attack & damage bonuses ---------------- */
export function weaponAbilityMod(c, item){
  var strMod = mod(c.abilities && c.abilities.str);
  var dexMod = mod(c.abilities && c.abilities.dex);
  var best = item.ability==="dex" ? dexMod : item.ability==="finesse" ? Math.max(strMod, dexMod) : strMod;
  // A feature tagged `magicWeaponAbility` lets magic weapons (see
  // isMagicWeapon) use that ability instead, when it's higher; one tagged
  // `chosenWeaponAbility` does the same for the weapon marked `chosenWeapon`.
  var isMagic = isMagicWeapon(c, item);
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      if(f.magicWeaponAbility && isMagic) best = Math.max(best, mod(c.abilities && c.abilities[f.magicWeaponAbility]));
      if(f.chosenWeaponAbility && item.chosenWeapon) best = Math.max(best, mod(c.abilities && c.abilities[f.chosenWeaponAbility]));
    });
  });
  return best;
}
/* The feature (if any) that lets this character mark one weapon to attack
   with a different ability, e.g. Hex Warrior (CHA). */
export function chosenWeaponFeature(c){
  var found = null;
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){ if(!found && f.chosenWeaponAbility) found = f; });
  });
  return found;
}
/* A magic weapon: marked magic on the sheet (a Flame Tongue, a +0
   weapon), with a magic bonus, or holding an active artificer infusion. */
export function isMagicWeapon(c, item){
  if(item.magic || (Number(item.magicBonus)||0) > 0) return true;
  var active = c.infusions && c.infusions.active || [];
  return !!item.id && active.some(function(a){ return a.itemId===item.id; });
}
export function weaponAttackBonus(c, item){
  var pb = item.proficient ? profBonus(c) : 0;
  var archery = isRangedWeapon(item) && hasFightingStyle(c, "Archery") ? 2 : 0;
  return weaponAbilityMod(c, item) + pb + (Number(item.magicBonus)||0) + archery;
}
export function weaponDamageBonus(c, item){
  return weaponAbilityMod(c, item) + (Number(item.magicBonus)||0);
}
export function parseDiceNotation(str){
  var m2 = /^(\d*)d(\d+)$/i.exec((str||"").trim());
  if(!m2) return null;
  return { qty: Number(m2[1])||1, die: Number(m2[2]) };
}

/* Best-effort default for a newly added weapon's Proficient checkbox:
   true if any of the character's classes list the weapon's category
   ("Simple weapons"/"Martial weapons") or name it specifically. */
export function isProficientWithWeapon(c, weaponName, category){
  return (c.classes||[]).some(function(cl, idx){
    var p = classProficiencies(c, idx);
    if(!p || !p.weapons) return false;
    return p.weapons.some(function(w){
      var wl = w.toLowerCase();
      if(category==="simple" && wl==="simple weapons") return true;
      if(category==="martial" && wl==="martial weapons") return true;
      return weaponName && wl.indexOf(weaponName.toLowerCase()) !== -1;
    });
  });
}
export function passivePerception(c){
  var wisMod = mod(c.abilities && c.abilities.wis != null ? c.abilities.wis : 10);
  var entry = c.skillProfs && c.skillProfs["Perception"];
  var pb = profBonus(c);
  var bonus = wisMod + (entry && entry.expertise ? pb*2 : (entry && entry.prof ? pb : 0));
  var featBonus = hasFeat(c, "Observant") ? 5 : 0;
  return 10 + bonus + featBonus;
}
export function passiveInvestigation(c){
  var intMod = mod(c.abilities && c.abilities.int != null ? c.abilities.int : 10);
  var entry = c.skillProfs && c.skillProfs["Investigation"];
  var pb = profBonus(c);
  var bonus = intMod + (entry && entry.expertise ? pb*2 : (entry && entry.prof ? pb : 0));
  var featBonus = hasFeat(c, "Observant") ? 5 : 0;
  return 10 + bonus + featBonus;
}
export function passiveInsight(c){
  var wisMod = mod(c.abilities && c.abilities.wis != null ? c.abilities.wis : 10);
  var entry = c.skillProfs && c.skillProfs["Insight"];
  var pb = profBonus(c);
  var bonus = wisMod + (entry && entry.expertise ? pb*2 : (entry && entry.prof ? pb : 0));
  return 10 + bonus;
}
export function getCharacterSenses(c){
  var race = (c.race||"").toLowerCase();
  if(race.indexOf("drow")!==-1) return "Superior Darkvision 120 ft";
  if(race.indexOf("dwarf")!==-1 || race.indexOf("elf")!==-1 || race.indexOf("gnome")!==-1 ||
     race.indexOf("half-elf")!==-1 || race.indexOf("half-orc")!==-1 || race.indexOf("tiefling")!==-1 ||
     race.indexOf("orc")!==-1 || race.indexOf("goblin")!==-1 || race.indexOf("kobold")!==-1 ||
     race.indexOf("bugbear")!==-1 || race.indexOf("aasimar")!==-1 || race.indexOf("tabaxi")!==-1) {
    return "Darkvision 60 ft";
  }
  return "Normal (60 ft)";
}
export function getAllCharacterFeatures(c){
  var list = [];
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      list.push({
        id: f.id,
        name: f.name,
        source: (f.subclass ? cl.subclass : "Class · " + cl.name) + " · Lv " + f.level,
        text: f.text,
        category: "class",
        isDerived: true
      });
    });
  });
  if(c.race){
    var traitText = RACE_TRAITS[c.race] || RACE_TRAIT_FALLBACK;
    list.push({
      id: "race_"+c.race,
      name: c.race + " Traits",
      source: "Race · " + c.race,
      text: traitText,
      category: "race",
      isDerived: true
    });
  }
  if(c.background){
    var bg = BACKGROUND_INFO[c.background];
    list.push({
      id: "bg_"+c.background,
      name: c.background + " Lore & Features",
      source: "Background · " + c.background,
      text: bg ? bg.blurb : BACKGROUND_INFO_FALLBACK,
      category: "background",
      isDerived: true
    });
  }
  (c.feats||[]).forEach(function(feat){
    var descText = (feat.prerequisite && feat.prerequisite !== "None" ? "(Prerequisite: " + feat.prerequisite + ")\n" : "") + (feat.description || feat.summary || "");
    var picked = featPicksSummary(featDef(feat.name), feat.picks);
    if(picked) descText += "\n\nYour picks: " + picked + ".";
    list.push({
      id: "feat_"+(feat.id || feat.name),
      name: feat.name,
      source: "Feat" + (feat.category ? " · " + feat.category : ""),
      text: descText,
      category: "feat",
      isFeat: true,
      featObj: feat
    });
  });
  (c.features||[]).forEach(function(f){
    list.push({
      id: f.id || uid(),
      name: f.name || "Custom Feature",
      source: f.source || "Custom",
      text: f.text || "",
      category: (f.source || "custom").toLowerCase(),
      isCustom: true,
      featureObj: f
    });
  });
  return list;
}
/* NEW-flagged features that still exist on the sheet (a flagged feat may
   have been deleted since). */
export function unseenUnlockCount(c){
  var ids = c.newUnlocks||[];
  if(!ids.length) return 0;
  return getAllCharacterFeatures(c).filter(function(f){ return ids.indexOf(f.id)!==-1; }).length;
}
/* The creation wizard and level-up rebuild the whole overlay on every
   tap, which snaps #wizard-body back to the top. Call before clearing the
   overlay with a key for the current view (flow + step): if it's the same
   view as last render, its scroll is returned so wizardScrollRestore can
   put it back; a new step starts at the top. */
export function wizardScrollSave(viewKey){
  var overlay = document.getElementById("wizard-overlay");
  var body = document.getElementById("wizard-body");
  var keep = body && overlay.dataset.view===viewKey ? body.scrollTop : null;
  overlay.dataset.view = viewKey;
  return keep;
}
export function wizardScrollRestore(keep){
  var body = document.getElementById("wizard-body");
  if(body && keep!=null) body.scrollTop = keep;
}
/* Forget the last view when a flow opens, so it starts at the top even
   on the same step the previous run ended on. */
export function wizardScrollReset(){
  document.getElementById("wizard-overlay").dataset.view = "";
}
export function clamp(n,lo,hi){ return Math.max(lo,Math.min(hi,n)); }
export function ce(tag, cls){ var e = document.createElement(tag); if(cls) e.className = cls; return e; }
export function escapeHtml(s){
  return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
export function nowStamp(){
  var d = new Date();
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})+" · "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}
