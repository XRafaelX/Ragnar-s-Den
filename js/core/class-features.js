/* ---------------- Class features ----------------
   What a character's classes and subclasses give: the feature list at
   each level, spell slots, proficiencies, and the Features tab's list. */
import { CLASSES_INFO, CLASS_PROFICIENCIES } from "../data/classes.js";
import { RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { RACE_DATA, DRAGONBORN_BREATH, TRAIT_DCS } from "../data/race-data.js";
import { BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";
import { CLASS_PROGRESSION, SUBCLASSES, SPELL_SLOT_TABLE, PACT_SLOT_TABLE } from "../data/progression.js";
import { featDef, featPicksSummary, featPickDetail } from "./feat-picks.js";
import { uid, mod, fmtMod, totalLevel, profBonus } from "./basics.js";
import { halfProficiency } from "./checks.js";
import { pickedProfs, featurePicksText, raceTraitPicksText, backgroundPicksText, backgroundGrants } from "./class-picks.js";
import { abilityScore, abilityScores } from "./ability-scores.js";
import { effectOn } from "./effects.js";

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
     spellKind     "prepared", "known", "spellbook", "ritual", "expanded"
                   (added to the spells the class can learn: a warlock
                   patron's list), "free" (cast without a slot, limited)
                   or "atwill" (see featureSpells)
     spellLabel    the Spells tab tag for them ("Free 1/long rest", "2 ki");
     spellTip      its tooltip (the rule); spellAbility: the ability for
                   their save DC when the class doesn't cast
     speeds        [{type, value, when}]: a fly, swim or climb speed. value
                   is feet, "walk" (equal to walking speed) or "2walk";
                   `when` says when it applies ("while raging (Eagle)"),
                   none for an always-on speed. {type, bonus} instead adds
                   to that speed from any other source (Superior Mobility).
     extraSpellList  another class's list the class can learn spells from
                   (Divine Magic: "Cleric"); the spell pickers include it
     darkvision    {range, add}: darkvision out to `range` feet, or `add`
                   feet more if the character already has it (Umbral Sight)
     advantage     {on: "save" | "initiative", abilities, when}: advantage the
                   feature gives (Feral Instinct on initiative; Danger
                   Sense on DEX saves, `when` against effects you can see);
                   see advantagesFor in checks.js
     styleChoice   {options}: a Fighting Style the subclass grants, asked
                   for in the level-up ("class" = the class's own list;
                   Champion 10) or from a short list (College of Swords)
     spellChoice   {id, label, options:{name: spells}}: more spells that
                   depend on a choice (Circle of the Land's land, a genie
                   kind), each option shaped like `spells`. The pick is
                   saved on the class entry as spellChoices[id].
     attuneLimit   how many magic items the character can attune to at
                   once (an artificer's Magic Item Adept: 4)
     chip(x)       a number worked out for the Features card, x = {lv, pb,
                   mods}: Slow Fall's "Reduces falls by 25"
     immune, conditionImmune  damage types and conditions the feature makes
                   you immune to (Purity of Body), shown with the race's
     saveNote      {abilities, text}: a reminder for those saves on the saves
                   card (Evasion on DEX saves)
     sense         a sense the feature gives, listed with darkvision
                   ("Blindsense 10 ft")
     resist        damage types the feature gives resistance to, always on
                   (Guarded Mind: ["psychic"]); see featureResistances
     skillBonus    {skill, ability}: that ability's modifier added to the
                   skill's checks (Elegant Courtier: WIS to Persuasion)
     skillDouble   a skill whose checks get double the proficiency bonus
                   when proficient (Royal Envoy: "Persuasion")
     saveDc        {save, ability} or a list of them: a save DC the feature
                   sets, 8 + proficiency bonus + the ability's modifier
                   (Intimidating Presence: {save:"wis", ability:"cha"};
                   save "" when its effects ask for different saves),
                   shown as a chip on its Features card (featureDcs) */
var FEATURE_FLAGS = ["advantage", "speed", "walkSpeed", "speedWhen", "halfProficiency", "initiative", "acHeavyArmor", "grants", "magicWeaponAbility", "chosenWeaponAbility", "abilityBonus", "abilityMax", "saveBonus", "spells", "spellKind", "spellLabel", "spellTip", "spellAbility", "spellChoice", "speeds", "darkvision", "extraSpellList", "styleChoice", "attuneLimit", "saveDc", "rollButton", "skillBonus", "skillDouble", "resist", "saveNote", "sense", "chip", "immune", "conditionImmune"];

/* ---- Optional features that replace one of the class's own ----
   Tasha's Favored Foe for a ranger's Favored Enemy, Deft Explorer for
   Natural Explorer (CLASS_PROGRESSION's `variants`). A class entry using
   one keeps it as cl.variants[replaced feature] = variant name. An
   addition (a rogue's Steady Aim) replaces nothing and is kept under its
   own name. */
export function classVariants(className){
  return (CLASS_PROGRESSION[className] || {}).variants || [];
}
/* The swaps the player chooses (not the additions), only the ones
   offered at class level `level` when it's given. With a class entry `cl`,
   a swap for a subclass feature comes resolved for it (and is left out
   when its subclass has none of those features). */
export function classVariantSwaps(className, level, cl){
  return classVariants(className).filter(function(v){ return !v.adds && (level==null || (v.level||1)===level); })
    .map(function(v){ return cl ? variantFor(cl, v) : v; }).filter(Boolean);
}
/* A swap for a subclass feature (Blessed Strikes for a domain's Divine
   Strike or Potent Spellcasting) for this class entry: a copy whose
   `replaces` names the one its subclass has at the swap's level, or null
   when it has neither (or no subclass yet). Any other variant as it is. */
export function variantFor(cl, v){
  if(!v.subclassReplaces) return v;
  var sub = cl && findSubclass(cl.name, cl.subclass);
  var at = (sub && sub.features && sub.features[v.level||1]) || [];
  var hit = v.subclassReplaces.find(function(n){ return at.some(function(f){ return f.name===n; }); });
  return hit ? Object.assign({}, v, {replaces: hit}) : null;
}
/* The feature a swap takes the place of, as the class or subclass has it
   at the swap's level ({name, text, profs, source}), or null. */
export function variantBase(cl, v){
  var lv = v.level || 1, f;
  if(v.subclassReplaces){
    var sub = findSubclass(cl.name, cl.subclass);
    f = sub && ((sub.features && sub.features[lv]) || []).find(function(x){ return x.name===v.replaces; });
    return f ? Object.assign({source: sub.name}, f) : null;
  }
  return classFeaturesAt({name: cl.name}, lv).find(function(x){ return x.name===v.replaces; }) || null;
}
function variantKey(v){ return v.adds ? v.name : v.replaces; }
/* The variants a class entry uses. */
export function activeVariants(cl){
  var picked = (cl && cl.variants) || {};
  return classVariants(cl && cl.name).map(function(v){ return variantFor(cl, v); })
    .filter(function(v){ return v && picked[variantKey(v)]===v.name; });
}
/* Tasha's additions follow the switch: every class entry at the level
   gets them while it's on, and none while it's off. True if any changed. */
export function syncTashaAdditions(c){
  var changed = false;
  (c.classes||[]).forEach(function(cl){
    classVariants(cl.name).forEach(function(v){
      if(!v.adds) return;
      var want = !!c.tashaOptional && (Number(cl.level)||1) >= (v.level||1);
      if(want===!!(cl.variants && cl.variants[v.name])) return;
      if(want){ cl.variants = cl.variants || {}; cl.variants[v.name] = v.name; }
      else delete cl.variants[v.name];
      changed = true;
    });
  });
  return changed;
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
    // (A subclass feature a Tasha's swap stands in for, at every level, is left out.)
    var swapped = activeVariants(cl).filter(function(v){ return v.subclassReplaces; }).map(function(v){ return v.replaces; });
    for(var sl=1; sl<=level; sl++){
      ((sub.features && sub.features[sl]) || []).forEach(function(f){ if(swapped.indexOf(f.name)===-1) addFeature(f, sl, true); });
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
  // Once the starting tool choices are made, the picks stand in for the
  // "of your choice" line.
  var starting = idx===0 && prog && prog.startingProfs;
  var startEntry = starting && cl.profPicks && cl.profPicks.starting;
  if(startEntry && (startEntry.manual || (startEntry.slots||[]).some(function(s){ return (s||[]).length; })) && base){
    base = Object.assign({}, base, {tools: (base.tools||[]).filter(function(t){ return t!==starting.text; })});
  }
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
/* A dragonborn's breath weapon (any kind: DRAGONBORN_BREATH) from the
   ancestry picked on Race Traits, worked out for the character, or null
   until one is picked:
   {dragon, damage, area, save, die, dice, next: {level, dice} or null,
    con, pb, dc, uses, reset, attack, resistance, metallic}.
   The dice go by character level; the DC is 8 + CON modifier +
   proficiency bonus; `metallic` is a Metallic dragonborn of level 5+. */
export function draconicBreath(c){
  var kind = DRAGONBORN_BREATH[c.race];
  if(!kind) return null;
  var entry = c.racePicks && c.racePicks.profPicks && c.racePicks.profPicks["race:" + kind.trait + ":pick"];
  var dragon = entry && !entry.manual && ((entry.slots && entry.slots[0]) || [])[0];
  var a = dragon && kind.ancestries[dragon];
  if(!a) return null;
  var lv = totalLevel(c), dice = 0, next = null;
  kind.steps.forEach(function(st){ if(lv >= st[0]) dice = st[1]; else if(!next) next = {level: st[0], dice: st[1]}; });
  var con = mod(abilityScore(c, "con")), pb = profBonus(c);
  return {dragon: dragon, damage: a.damage, area: a.area || kind.area, save: a.save || kind.save,
    die: kind.die, dice: dice, next: next, con: con, pb: pb, dc: 8 + con + pb,
    uses: kind.uses==="pb" ? pb : 1, reset: kind.uses==="pb" ? "long" : "short",
    attack: !!kind.attack, resistance: !!kind.resistance, metallic: !!kind.metallic && lv >= 5};
}
/* "8 + CON +2 + proficiency +2": how the breath's save DC is made up. */
export function breathDcFormula(b){
  return "8 + CON " + fmtMod(b.con) + " + proficiency " + fmtMod(b.pb);
}
/* "Once per short or long rest" or "3 uses per long rest (your proficiency bonus)". */
export function breathUsesText(b){
  return b.reset==="short" ? "Once per short or long rest" : b.uses + (b.uses===1 ? " use" : " uses") + " per long rest (your proficiency bonus)";
}
/* The breath worked out for the character, a line per trait it fills in
   ({breath, metallic, resistance}, each "" when it doesn't apply), or
   null until a dragon is picked. */
export function draconicBreathLines(c){
  var b = draconicBreath(c);
  if(!b) return null;
  return {
    breath: "Breath Weapon (" + b.dragon + "): " + b.area + (b.attack ? ", in place of one attack" : "") + ", " + b.save + " save DC " + b.dc +
      " (" + breathDcFormula(b) + "), " + b.dice + "d" + b.die + " " + b.damage.toLowerCase() + " damage (half on a success). " + breathUsesText(b) + "." +
      (b.next ? " " + b.next.dice + "d" + b.die + " from level " + b.next.level + "." : ""),
    metallic: b.metallic ? "Metallic Breath Weapon: save DC " + b.dc + ". Once per long rest." : "",
    resistance: b.resistance ? "Damage Resistance: " + b.damage.toLowerCase() + "." : ""
  };
}
/* The breath as lines in one block: "" until picked. */
export function draconicBreathText(c){
  var l = draconicBreathLines(c);
  return l ? [l.breath, l.metallic, l.resistance].filter(Boolean).join("\n") : "";
}
/* The race's Features cards: one per trait (Darkvision first, from its
   range), with what was picked for it and a dragonborn's breath worked
   out on the trait it belongs to. A race
   with no trait data (typed in, or homebrew without traits) is one card
   with its summary. */
export function raceTraitFeatures(c){
  if(!c.race) return [];
  var source = "Race · " + c.race, traits = (RACE_DATA[c.race] || {}).traits || [];
  if(!traits.length){
    return [{id: "race_"+c.race, name: c.race + " Traits", source: source, text: RACE_TRAITS[c.race] || RACE_TRAIT_FALLBACK, category: "race", isDerived: true}];
  }
  var breath = draconicBreathLines(c) || {};
  // Darkvision is a trait in the book; the data keeps only its range.
  var d = RACE_DATA[c.race], dark = d.darkvision && !d.darkvisionUnlessPicked && !traits.some(function(t){ return /Darkvision/.test(t.name); })
    ? [{id: "race_" + c.race + "_Darkvision", name: "Darkvision", source: source, category: "race", isDerived: true,
      text: "You can see in dim light within " + d.darkvision + " feet of you as if it were bright light, and in darkness as if it were dim light. In darkness you see only shades of gray, not color."}] : [];
  return dark.concat(traits.map(function(t){
    // (An optional pick left empty keeps what it says: a Custom Lineage's darkvision.)
    var picked = raceTraitPicksText(c, t.name) || (((t.profs||{}).pick||[])[0]||{}).none || "", values = raceTraitPickValues(c, t);
    var worked = t.name==="Breath Weapon" ? breath.breath
      : t.name==="Metallic Breath Weapon" ? breath.metallic
      : (t.name==="Damage Resistance" || t.name==="Draconic Resistance") ? breath.resistance : "";
    // (A card showing only the chosen option already says what was picked.)
    var text = pickedOptionText(t, values);
    var extra = [picked && text===t.text ? "Your picks: " + picked + "." : "", worked || ""].concat(traitDcLines(c, t, values)).filter(Boolean).join("\n");
    return {id: "race_" + c.race + "_" + t.name, name: t.name, source: source,
      text: text + (extra ? "\n\n" + extra : ""), category: "race", isDerived: true};
  }));
}
/* Every value picked for a race trait's pick slots ([] for none yet). */
function raceTraitPickValues(c, t){
  var entry = c.racePicks && c.racePicks.profPicks && c.racePicks.profPicks["race:" + t.name + ":pick"];
  if(!entry || entry.manual) return [];
  return (entry.slots || []).reduce(function(a, s){ return a.concat(s || []); }, []).filter(Boolean);
}
/* A trait that lists its options as "• " lines (Shifter Type, Celestial
   Revelation, a Simic Hybrid's enhancements): once one is picked, only
   that option's line stays, or its details when the trait doesn't list
   it (a 5th-level enhancement that was a 1st-level option), and a
   choosing prompt ending in ":" goes. */
function pickedOptionText(t, values){
  var slot = ((t.profs && t.profs.pick) || []).find(function(s){ return s.kind==="choice"; });
  var v = slot && values.find(function(x){ return slot.options.indexOf(x)!==-1; });
  if(!v || t.text.indexOf("\n\u2022 ")===-1) return t.text;
  var lines = t.text.split("\n").filter(function(l){ return l.indexOf("\u2022 ")!==0 || l.indexOf("\u2022 " + v)===0; });
  if(!lines.some(function(l){ return l.indexOf("\u2022 " + v)===0; }) && slot.details && slot.details[v]){
    lines.splice(1, 0, "\u2022 " + v + ": " + slot.details[v]);
  }
  // A prompt to choose ("...or one of these:") has done its job: the
  // option then reads as its own paragraph.
  if(/:$/.test(lines[0])){
    lines.shift();
    lines[0] = lines[0].replace(/^\u2022 /, "");
  }
  return lines.join("\n");
}
var ABILITY_OF = {Intelligence: "int", Wisdom: "wis", Charisma: "cha", Strength: "str", Dexterity: "dex", Constitution: "con"};
function abilityName(key){ return Object.keys(ABILITY_OF).find(function(k){ return ABILITY_OF[k]===key; }) || key.toUpperCase(); }
/* The save DCs a class feature sets (its saveDc), worked out: [{dc, save,
   chip: "WIS DC 13", line: "Wisdom save DC 13 (8 + proficiency +3 +
   Charisma +2)."}]. */
/* Damage resistances class features give ([{type, source}]): their
   `resist`, always on. */
export function featureResistances(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){ (f.resist||[]).forEach(function(t){ out.push({type: t, source: f.name}); }); });
  });
  return out;
}
function featureChip(c, cl, f){
  var mods = {};
  ["str","dex","con","int","wis","cha"].forEach(function(k){ mods[k] = mod(abilityScore(c, k)); });
  var text = f.chip({lv: Number(cl.level)||1, pb: profBonus(c), mods: mods});
  return {chip: text, line: f.name + ": " + text + "."};
}
/* The roll a feature has its own button for on its card (Vigilant
   Rebuke), worked out: {qty, die, bonus, label}, or null. */
export function featureRoll(c, f){
  var r = f.rollButton;
  return r ? {qty: r.qty, die: r.die, bonus: r.ability ? mod(abilityScore(c, r.ability)) : 0, label: r.label} : null;
}
export function featureDcs(c, f){
  var pb = profBonus(c);
  return [].concat(f.saveDc || []).map(function(d){
    var m = mod(abilityScore(c, d.ability)), dc = 8 + pb + m;
    // (No save named: the feature's effects ask for different ones, "DC 13".)
    return {dc: dc, save: d.save || "", chip: (d.save ? d.save.toUpperCase() + " " : "") + "DC " + dc,
      line: (d.save ? abilityName(d.save) + " save" : "Save") + " DC " + dc + " (8 + proficiency " + fmtMod(pb) + " + " + abilityName(d.ability) + " " + fmtMod(m) + ")."};
  });
}
/* The save DCs a trait sets (TRAIT_DCS), worked out: "Taunt save DC 13
   (8 + proficiency +2 + Charisma +3)." Waits for an ability still to be
   picked, or for the option the DC belongs to. */
function traitDcLines(c, t, values){
  return [].concat(TRAIT_DCS[t.name] || []).map(function(dc){
    if(dc.when && values.indexOf(dc.when)===-1) return "";
    var ability = dc.ability==="pick" ? values.map(function(v){ return ABILITY_OF[v]; }).filter(Boolean)[0] : dc.ability;
    if(!ability) return "";
    var m = mod(abilityScore(c, ability)), pb = profBonus(c);
    var name = Object.keys(ABILITY_OF).find(function(k){ return ABILITY_OF[k]===ability; });
    return dc.label + " " + (8 + pb + m) + " (8 + proficiency " + fmtMod(pb) + " + " + name + " " + fmtMod(m) + ").";
  });
}
/* What the race's traits protect against: {resist, immune,
   conditionImmune}, each [{type, source}] with the trait's name as the
   source. A dragonborn's resistance comes from the dragon picked; the
   Active effects add Chromatic Warding's immunity and the Raven Queen's
   resistance to "all damage". */
export function raceWards(c){
  var out = {resist: [], immune: [], conditionImmune: []};
  var traits = (RACE_DATA[c.race] || {}).traits || [];
  traits.forEach(function(t){
    Object.keys(out).forEach(function(k){
      (t[k] || []).forEach(function(v){ out[k].push({type: v, source: t.name}); });
    });
  });
  var b = draconicBreath(c);
  if(b && b.resistance){
    var rt = traits.find(function(t){ return t.name==="Damage Resistance" || t.name==="Draconic Resistance"; });
    out.resist.push({type: b.damage.toLowerCase(), source: rt ? rt.name : c.race});
  }
  // Class features' (Purity of Body: poison and the poisoned condition).
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      (f.immune||[]).forEach(function(v){ out.immune.push({type: v, source: f.name}); });
      (f.conditionImmune||[]).forEach(function(v){ out.conditionImmune.push({type: v, source: f.name}); });
    });
  });
  // Switched on from the Active effects card.
  if(b && effectOn(c, "chromatic_warding")) out.immune.push({type: b.damage.toLowerCase(), source: "Chromatic Warding"});
  if(effectOn(c, "raven_queen_resistance")) out.resist.push({type: "all damage", source: "Blessing of the Raven Queen"});
  return out;
}
/* The race trait that makes the character immune to a condition
   (a yuan-ti's Poison Immunity: "poisoned"), or "". */
export function raceConditionImmunity(c, id){
  var x = raceWards(c).conditionImmune.find(function(w){ return w.type===id; });
  return x ? x.source : "";
}
export function getAllCharacterFeatures(c){
  var list = [];
  (c.classes||[]).forEach(function(cl, idx){
    classFeatureList(cl).forEach(function(f){
      // What was picked for it (an Expertise's skills, a tool).
      var picked = featurePicksText(cl, idx > 0, f.name, f.subclass);
      var dcs = featureDcs(c, f);
      if(f.chip) dcs = dcs.concat(featureChip(c, cl, f));
      list.push({
        id: f.id,
        name: f.name,
        source: (f.subclass ? cl.subclass : "Class · " + cl.name) + " · Lv " + f.level,
        text: f.text + (picked ? "\n\nYour picks: " + picked + "." : "") + (dcs.length ? "\n\n" + dcs.map(function(d){ return d.line; }).join("\n") : ""),
        dcs: dcs,
        roll: featureRoll(c, f),
        category: "class",
        isDerived: true
      });
    });
  });
  list = list.concat(raceTraitFeatures(c));
  if(c.background){
    var bg = BACKGROUND_INFO[c.background];
    // Its tools: given ones, and what was picked (a gaming set, a house).
    var bgGiven = backgroundGrants(c).reduce(function(a, g){ return a.concat(g.def.tools || []); }, []);
    var bgChosen = backgroundPicksText(c);
    var bgTools = (bgGiven.length ? "\n\nTools: " + bgGiven.join(", ") + "." : "") + (bgChosen ? "\n\nYour picks: " + bgChosen + "." : "");
    list.push({
      id: "bg_"+c.background,
      name: c.background + " Lore & Features",
      source: "Background · " + c.background,
      text: (bg ? bg.blurb : BACKGROUND_INFO_FALLBACK) + (bg && bg.feature && bg.feature.name ? "\n\n" + bg.feature.name + ": " + (bg.feature.text || "") : "") + bgTools,
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
