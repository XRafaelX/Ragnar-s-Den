import { HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../data/classes.js";
import { RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";
import { CLASS_PROGRESSION, SUBCLASSES, SPELL_SLOT_TABLE, PACT_SLOT_TABLE } from "../data/progression.js";
import { WEAPON_DATA } from "../data/weapons.js";
import { CLASS_RESOURCES, SUBCLASS_RESOURCES } from "../data/resources.js";

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
  if(idx===0) return CLASS_PROFICIENCIES[cl.name] || null;
  var prog = CLASS_PROGRESSION[cl.name];
  if(!prog) return CLASS_PROFICIENCIES[cl.name] || null;
  var m = prog.multiclassProfs;
  return {armor:m.armor, weapons:m.weapons, tools:m.tools, savingThrows:[], note:m.note};
}
/* Limited-use resources this character has right now, from each class
   and its subclass. `key` is unique per character (class + resource id)
   and indexes c.resourcesUsed. */
export function characterResources(c){
  var m = {};
  ["str","dex","con","int","wis","cha"].forEach(function(k){ m[k] = mod(c.abilities && c.abilities[k]); });
  var list = [];
  (c.classes||[]).forEach(function(cl){
    var lv = Number(cl.level)||1;
    var defs = (CLASS_RESOURCES[cl.name]||[]).map(function(r){ return {def:r, source:cl.name}; });
    var subDefs = cl.subclass && SUBCLASS_RESOURCES[cl.name] && SUBCLASS_RESOURCES[cl.name][cl.subclass];
    (subDefs||[]).forEach(function(r){ defs.push({def:r, source:cl.subclass}); });
    defs.forEach(function(d){
      var r = d.def;
      if(lv < r.level) return;
      var key = cl.name+":"+r.id;
      var max = r.max(lv, m);
      list.push({
        key: key, name: r.name, source: d.source, hint: r.hint, pool: !!r.pool,
        max: max, used: clamp(Number((c.resourcesUsed||{})[key])||0, 0, max),
        reset: r.reset(lv)
      });
    });
  });
  return list;
}
/* Restore resources on a rest. A long rest restores everything; a short
   rest only what recharges on one. Returns the names restored. */
export function restoreResources(c, restType){
  var restored = [];
  characterResources(c).forEach(function(r){
    if(restType==="short" && r.reset!=="short") return;
    if(r.used>0) restored.push(r.name);
    delete c.resourcesUsed[r.key];
  });
  return restored;
}
export function barbarianClassEntry(c){
  return (c.classes||[]).find(function(cl){ return cl.name==="Barbarian"; });
}
export function barbarianRageMax(level){
  if(level>=20) return Infinity;
  if(level>=17) return 6;
  if(level>=12) return 5;
  if(level>=6) return 4;
  if(level>=3) return 3;
  return 2;
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
    else if(bodyArmor.category==="medium") dexContribution = Math.min(dexMod,2);
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
  if(misc){ breakdown += " + misc (" + fmtMod(misc) + ")"; short += " + misc"; }

  return { value: base + shieldBonus + misc, breakdown: breakdown, short: short };
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

/* ---------------- Weapon attack & damage bonuses ---------------- */
export function weaponAbilityMod(c, item){
  var strMod = mod(c.abilities && c.abilities.str);
  var dexMod = mod(c.abilities && c.abilities.dex);
  if(item.ability==="dex") return dexMod;
  if(item.ability==="finesse") return Math.max(strMod, dexMod);
  return strMod;
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
  var featBonus = (c.feats||[]).some(function(f){ return ((f.name||"") + "").toLowerCase()==="observant"; }) ? 5 : 0;
  return 10 + bonus + featBonus;
}
export function passiveInvestigation(c){
  var intMod = mod(c.abilities && c.abilities.int != null ? c.abilities.int : 10);
  var entry = c.skillProfs && c.skillProfs["Investigation"];
  var pb = profBonus(c);
  var bonus = intMod + (entry && entry.expertise ? pb*2 : (entry && entry.prof ? pb : 0));
  var featBonus = (c.feats||[]).some(function(f){ return ((f.name||"") + "").toLowerCase()==="observant"; }) ? 5 : 0;
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
