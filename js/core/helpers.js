import { HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../data/classes.js";
import { RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";

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
    return info ? !!info.spellcaster : true; // unknown class name: don't hide existing spell data
  });
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
  var base, breakdown;

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
  } else {
    var hasBarbarian = (c.classes||[]).some(function(cl){ return cl.name==="Barbarian"; });
    var hasMonk = (c.classes||[]).some(function(cl){ return cl.name==="Monk"; });
    if(hasBarbarian){
      var conMod = mod(c.abilities && c.abilities.con);
      base = 10 + dexMod + conMod;
      breakdown = "Unarmored Defense: 10 + DEX (" + fmtMod(dexMod) + ") + CON (" + fmtMod(conMod) + ")";
    } else if(hasMonk){
      var wisMod = mod(c.abilities && c.abilities.wis);
      base = 10 + dexMod + wisMod;
      breakdown = "Unarmored Defense: 10 + DEX (" + fmtMod(dexMod) + ") + WIS (" + fmtMod(wisMod) + ")";
    } else {
      base = 10 + dexMod;
      breakdown = "Unarmored: 10 + DEX (" + fmtMod(dexMod) + ")";
    }
  }

  if(shieldBonus) breakdown += " + shield (" + fmtMod(shieldBonus) + ")";
  if(misc) breakdown += " + misc (" + fmtMod(misc) + ")";

  return { value: base + shieldBonus + misc, breakdown: breakdown };
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
  return weaponAbilityMod(c, item) + pb + (Number(item.magicBonus)||0);
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
  return (c.classes||[]).some(function(cl){
    var p = CLASS_PROFICIENCIES[cl.name];
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
    var info = CLASSES_INFO[cl.name];
    if(info && info.features && info.features.length){
      info.features.forEach(function(f){
        list.push({
          id: "class_"+cl.name+"_"+f.name,
          name: f.name,
          source: "Class · " + cl.name,
          text: f.text,
          category: "class",
          isDerived: true
        });
      });
    }
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
