import { FIGHTING_STYLES } from "../data/classes.js";
import { CLASS_PROGRESSION } from "../data/progression.js";
import { SPELL_DATA } from "../data/spells.js";
import { optionSetDef } from "../data/class-options.js";
import { classFeaturesGainedAt, uid, spellAbilityNote } from "./helpers.js";

/* ---------------- Fighting styles ----------------
   A style the character has is a feature tagged `fightingStyle` (so
   deleting the feature removes its bonus). Some of Tasha's styles ask for
   more: Superior Technique a maneuver, Blessed and Druidic Warrior two
   cantrips; those picks are kept on the feature as `picks`
   ({options:[names], spells:[names]}).

   Where styles come from: a class's Fighting Style level (Fighter 1,
   Paladin 2, Ranger 2), a subclass feature flagged `styleChoice`
   (Champion 10, College of Swords 3), and, with Tasha's optional features,
   Martial Versatility: swapping one at an Ability Score Improvement level
   of a class that has the Fighting Style feature. */

export function styleDef(name){ return FIGHTING_STYLES[name] || null; }
export function styleFeatures(c){
  return (c.features||[]).filter(function(f){ return f && f.fightingStyle; });
}
export function hasStyle(c, name){
  return styleFeatures(c).some(function(f){ return f.fightingStyle===name; });
}
/* A class's own style list (all, Tasha's included), or []. */
export function classStyleList(className){
  var fs = (CLASS_PROGRESSION[className]||{}).fightingStyle;
  return fs ? fs.options.slice() : [];
}

/* A new style due when `className` reaches `newLevel` (with `subclass`,
   which may be picked on that same level-up): {options, from} or null. */
export function styleDueAt(className, subclass, newLevel){
  var fs = (CLASS_PROGRESSION[className]||{}).fightingStyle;
  if(fs && fs.level===newLevel) return {options: fs.options.slice(), from: "Fighting Style"};
  var f = classFeaturesGainedAt({name: className, subclass: subclass, level: newLevel}, newLevel).find(function(x){ return x.styleChoice; });
  if(!f) return null;
  var opts = f.styleChoice.options==="class" ? classStyleList(className) : f.styleChoice.options.slice();
  return {options: opts, from: f.name};
}

/* Why a style can't be picked ("" if it can). */
export function styleReason(c, name, tasha){
  if(hasStyle(c, name)) return "known";
  var def = styleDef(name);
  if(def && def.optional && !tasha) return "Tasha's optional";
  return "";
}
export function availableStyleNames(c, options, tasha){
  return options.filter(function(n){ return !styleReason(c, n, tasha); });
}
/* How many of `options` only Tasha's optional features would unlock. */
export function tashaOnlyStyles(c, options, tasha){
  if(tasha) return 0;
  return options.filter(function(n){ var d = styleDef(n); return d && d.optional && !hasStyle(c, n); }).length;
}

/* Martial Versatility: with Tasha's on, at an ASI level of a class that
   has the Fighting Style feature, one style may be replaced. */
export function versatilityStyleSwap(c, className, newLevel){
  var prog = CLASS_PROGRESSION[className] || {};
  return !!c.tashaOptional && !!prog.fightingStyle && (prog.asiLevels||[]).indexOf(newLevel)!==-1 && styleFeatures(c).length > 0;
}

/* ---- A style's own picks ---- */
export function stylePickChoices(name, tasha){
  var def = styleDef(name);
  if(def && def.optionPick){
    var set = optionSetDef(def.optionPick.set);
    return set.options.filter(function(o){ return !o.optional || tasha; }).map(function(o){ return o.name; });
  }
  if(def && def.spellPick){
    var sp = def.spellPick;
    return Object.keys(SPELL_DATA).filter(function(n){
      var d = SPELL_DATA[n];
      return d.level===sp.level && (d.classes||[]).indexOf(sp.list)!==-1;
    }).sort();
  }
  return [];
}
/* What's missing for a style's picks ("" when complete or none needed).
   knownOptions: option names the character already knows from the set. */
export function stylePicksProblem(name, picks, tasha, knownOptions){
  var def = styleDef(name);
  if(!def) return "";
  picks = picks || {};
  var choices = stylePickChoices(name, tasha);
  if(def.optionPick){
    var set = optionSetDef(def.optionPick.set), n = def.optionPick.count;
    var got = (picks.options||[]).slice(0, n).filter(function(x){ return choices.indexOf(x)!==-1; });
    if(got.length < n || new Set(got).size < n) return "Choose " + (n===1 ? "a " + set.noun : n + " " + set.noun + "s") + " for " + name + ".";
    var dup = got.find(function(x){ return (knownOptions||[]).indexOf(x)!==-1; });
    if(dup) return "You already know " + dup + ". Pick another " + set.noun + " for " + name + ".";
  }
  if(def.spellPick){
    var k = def.spellPick.count;
    var spells = (picks.spells||[]).slice(0, k).filter(function(x){ return choices.indexOf(x)!==-1; });
    if(spells.length < k || new Set(spells).size < k) return "Choose " + k + " different " + def.spellPick.list.toLowerCase() + " cantrips for " + name + ".";
  }
  return "";
}
export function styleNeedsPicks(name){
  var def = styleDef(name);
  return !!(def && (def.optionPick || def.spellPick));
}
/* The sheet feature for a style (and its picks). */
export function makeStyleFeature(name, picks){
  var f = {id: uid(), name: "Fighting Style: " + name, source: "Class", text: (styleDef(name)||{}).text || "", isPassive: true, fightingStyle: name};
  if(styleNeedsPicks(name)) f.picks = {options: ((picks||{}).options||[]).filter(Boolean), spells: ((picks||{}).spells||[]).filter(Boolean)};
  return f;
}

/* ---- What styles do on the sheet ---- */
/* Cantrips from Blessed / Druidic Warrior, shaped like featureSpells'. */
export function styleSpells(c){
  var out = [];
  styleFeatures(c).forEach(function(f){
    var def = styleDef(f.fightingStyle);
    if(!def || !def.spellPick || !f.picks) return;
    (f.picks.spells||[]).forEach(function(n){
      if(out.some(function(x){ return x.name===n; })) return;
      var data = SPELL_DATA[n] || null;
      out.push({name: n, data: data, level: data ? data.level : 0, kind: "known", source: "Fighting Style", feature: f.fightingStyle,
        note: spellAbilityNote(c, def.spellPick.ability, f.fightingStyle + ": a " + def.spellPick.list.toLowerCase() + " cantrip you always know.")});
    });
  });
  return out;
}
/* Senses from styles: "Blindsight 10 ft" (Blind Fighting). */
export function styleSenses(c){
  var best = 0;
  styleFeatures(c).forEach(function(f){ var d = styleDef(f.fightingStyle); if(d && d.blindsight) best = Math.max(best, d.blindsight); });
  return best ? ["Blindsight " + best + " ft"] : [];
}
