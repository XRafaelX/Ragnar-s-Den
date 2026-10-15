/* ---------------- Class features ----------------
   What a character's classes and subclasses give: the feature list at
   each level, spell slots, proficiencies, and the Features tab's list. */
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../data/classes.js";
import { RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";
import { CLASS_PROGRESSION, SUBCLASSES, SPELL_SLOT_TABLE, PACT_SLOT_TABLE } from "../data/progression.js";
import { featDef, featPicksSummary, featPickDetail } from "./feat-picks.js";
import { uid } from "./basics.js";
import { halfProficiency } from "./checks.js";
import { pickedProfs, featurePicksText } from "./class-picks.js";

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
     walkSpeed     walking speed the sheet adds itself while the feature is
                   there (Deft Explorer's Roving: 5), so it follows a
                   feature that can be swapped in on the sheet
     speedWhen     when that speed counts: "unarmored" (no armor or
                   shield) or "noHeavyArmor" (see computeSpeed)
     halfProficiency  {abilities: "all" or ["str", ...], round: "down" or
                   "up"}: half the proficiency bonus on those ability checks
                   when they don't already use it (Jack of All Trades,
                   Remarkable Athlete; see halfProficiency)
     initiative    ability ("wis", "int", ...) or "pb" added to initiative
     acHeavyArmor  AC bonus while wearing heavy armor (Soul of the Forge)
     grants        {armor, weapons, tools, savingThrows} proficiencies
                   (Battle Ready; Diamond Soul grants every save)
     profs         skills, expertise, languages and the proficiency choices
                   a feature gives (see js/core/class-picks.js, which reads
                   them straight from the data)
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
     extraSpellList  another class's list the class can learn spells from
                   (Divine Magic: "Cleric"); the spell pickers include it
     darkvision    {range, add}: darkvision out to `range` feet, or `add`
                   feet more if the character already has it (Umbral Sight)
     styleChoice   {options}: a Fighting Style the subclass grants, asked
                   for in the level-up ("class" = the class's own list;
                   Champion 10) or from a short list (College of Swords)
     spellChoice   {id, label, options:{name: spells}}: more spells that
                   depend on a choice (Circle of the Land's land, a genie
                   kind), each option shaped like `spells`. The pick is
                   saved on the class entry as spellChoices[id].
     attuneLimit   how many magic items the character can attune to at
                   once (an artificer's Magic Item Adept: 4) */
var FEATURE_FLAGS = ["speed", "walkSpeed", "speedWhen", "halfProficiency", "initiative", "acHeavyArmor", "grants", "magicWeaponAbility", "chosenWeaponAbility", "abilityBonus", "abilityMax", "saveBonus", "spells", "spellKind", "spellChoice", "speeds", "darkvision", "extraSpellList", "styleChoice", "attuneLimit"];

/* ---- Optional features that replace one of the class's own ----
   Tasha's Favored Foe for a ranger's Favored Enemy, Deft Explorer for
   Natural Explorer (CLASS_PROGRESSION's `variants`). A class entry using
   one keeps it as cl.variants[replaced feature] = variant name. */
export function classVariants(className){
  return (CLASS_PROGRESSION[className] || {}).variants || [];
}
/* The variants a class entry uses. */
export function activeVariants(cl){
  var picked = (cl && cl.variants) || {};
  return classVariants(cl && cl.name).filter(function(v){ return picked[v.replaces]===v.name; });
}
export function usesVariant(cl, name){
  return activeVariants(cl).some(function(v){ return v.name===name; });
}
/* The class's own features gained at class level `lv`, as the data has
   them: level-1 ones from classes.js, later ones from the progression,
   with any variant the entry uses in place of the feature it replaces
   (at every level that feature appears). */
export function classFeaturesAt(cl, lv){
  var info = CLASSES_INFO[cl.name], prog = CLASS_PROGRESSION[cl.name];
  var base = lv===1 ? (info && info.features) || [] : (prog && prog.features[lv]) || [];
  var variants = activeVariants(cl);
  if(!variants.length) return base;
  var out = base.filter(function(f){ return !variants.some(function(v){ return v.replaces===f.name; }); });
  variants.forEach(function(v){ out = out.concat(v.features[lv] || []); });
  return out;
}

/* Class features a class entry has at its current level: level-1 features
   from classes.js, then each level's progression features (a `replaces`
   entry swaps out the earlier version), then subclass features. Each item
   gets an `id` stable across levels so a "new" flag can point at it. */
export function classFeatureList(cl, uptoLevel){
  var level = uptoLevel!=null ? uptoLevel : (Number(cl.level)||1);
  var list = [];
  var sub = findSubclass(cl.name, cl.subclass);
  for(var lv=1; lv<=level; lv++){
    classFeaturesAt(cl, lv).forEach(function(f){ addFeature(f, lv, false); });
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
  // to the class's own list, and so do the tools, weapons and saves picked
  // for a feature (a Battle Master's artisan's tools; see class-picks.js);
  // copies, so the shared data isn't changed.
  var extra = classFeatureList(cl).filter(function(f){ return f.grants; });
  var picked = pickedProfs(cl, idx > 0);
  if(!extra.length && !picked.tools.length && !picked.weapons.length && !picked.saves.length) return base;
  var p = {armor:(base&&base.armor||[]).slice(), weapons:(base&&base.weapons||[]).slice(), tools:(base&&base.tools||[]).slice(),
    savingThrows:(base&&base.savingThrows||[]).slice(), note:base&&base.note};
  extra.forEach(function(f){
    ["armor","weapons","tools","savingThrows"].forEach(function(k){
      (f.grants[k]||[]).forEach(function(v){ if(p[k].indexOf(v)===-1) p[k].push(v); });
    });
  });
  picked.tools.forEach(function(v){ if(p.tools.indexOf(v)===-1) p.tools.push(v); });
  picked.weapons.forEach(function(v){ if(p.weapons.indexOf(v)===-1) p.weapons.push(v); });
  picked.saves.forEach(function(s){ if(p.savingThrows.indexOf(s.ability)===-1) p.savingThrows.push(s.ability); });
  return p;
}
export function classLevelOf(c, name, subclass){
  var cl = (c.classes||[]).find(function(x){ return x.name===name && (!subclass || x.subclass===subclass); });
  return cl ? Number(cl.level)||1 : 0;
}
export function getAllCharacterFeatures(c){
  var list = [];
  (c.classes||[]).forEach(function(cl, idx){
    classFeatureList(cl).forEach(function(f){
      // What was picked for it (an Expertise's skills, a tool).
      var picked = featurePicksText(cl, idx > 0, f.name, f.subclass);
      list.push({
        id: f.id,
        name: f.name,
        source: (f.subclass ? cl.subclass : "Class · " + cl.name) + " · Lv " + f.level,
        text: f.text + (picked ? "\n\nYour picks: " + picked + "." : ""),
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
      text: (bg ? bg.blurb : BACKGROUND_INFO_FALLBACK) + (bg && bg.feature && bg.feature.name ? "\n\n" + bg.feature.name + ": " + (bg.feature.text || "") : ""),
      category: "background",
      isDerived: true
    });
  }
  (c.feats||[]).forEach(function(feat){
    // A background's feat says where it came from in place of a prerequisite it didn't have to meet.
    var descText = (feat.from ? "(From your " + feat.from + " background)\n" : feat.campaign ? "(Bonus feat from your " + feat.campaign + " campaign)\n" : feat.prerequisite && feat.prerequisite !== "None" ? "(Prerequisite: " + feat.prerequisite + ")\n" : "") + (feat.description || feat.summary || "");
    var picked = featPicksSummary(featDef(feat.name), feat.picks);
    if(picked) descText += "\n\nYour picks: " + picked + ".";
    var detail = featPickDetail(featDef(feat.name), feat.picks);
    if(detail) descText += "\n" + detail;
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
