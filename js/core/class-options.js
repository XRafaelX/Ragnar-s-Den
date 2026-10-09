import { OPTION_SETS, optionSetDef, optionsKnownAt, optionSetStart } from "../data/class-options.js";
import { CLASS_PROGRESSION } from "../data/progression.js";
import { uid } from "./helpers.js";
import { featDef } from "./feat-picks.js";

/* ---------------- Class option sets ----------------
   What a class entry knows from each set (js/data/class-options.js) is
   saved on it as cl.options = {setId: [{id, name}]}. Feats that teach
   options (Martial Adept's maneuvers) keep theirs in their own picks
   (feat.picks.options) and are read alongside.

   c.tashaOptional: the character uses Tasha's optional class features,
   which here only adds the Versatility swaps at Ability Score
   Improvement levels. */

export function tashaOn(c){ return !!(c && c.tashaOptional); }

/* The sets a class entry has at `level` (default: its own): its class's
   sets and its subclass's, from the level each starts at. */
export function entrySets(cl, level){
  if(!cl) return [];
  var lv = level!=null ? level : (Number(cl.level)||1);
  return OPTION_SETS.filter(function(s){
    return s.className===cl.name && (!s.subclass || s.subclass===cl.subclass) && lv >= optionSetStart(s);
  });
}
export function knownOptions(cl, setId){
  var list = cl && cl.options && cl.options[setId];
  return Array.isArray(list) ? list : [];
}
/* Options a character knows from a set from anywhere: class entries and
   feats, as [{name, from}] ("Battle Master", "Martial Adept"). */
export function allKnownOptions(c, setId){
  var out = [];
  // Labelled by what grants the set: the subclass for maneuvers, the class for Metamagic.
  var set = optionSetDef(setId);
  (c.classes||[]).forEach(function(cl){
    var from = set && set.subclass ? cl.subclass || cl.name : cl.name;
    knownOptions(cl, setId).forEach(function(e){ out.push({name: e.name, from: from, id: e.id}); });
  });
  (c.feats||[]).forEach(function(f){
    var def = featDef(f.name);
    if(def && def.optionPicks && def.optionPicks.set===setId && f.picks) (f.picks.options||[]).forEach(function(n){ out.push({name: n, from: f.name}); });
  });
  return out;
}

/* Why an option can't be learned ("" if it can). ctx: {level, known}. */
export function optionReason(opt, ctx){
  if(ctx.known.indexOf(opt.name)!==-1) return "known";
  if(opt.level && ctx.level < opt.level) return "level " + opt.level;
  return "";
}
export function availableOptions(set, ctx){
  return set.options.filter(function(o){ return !optionReason(o, ctx); });
}

/* ---- Level-up ----
   cl: the class entry before the level-up (null for a new multiclass);
   subclass: its subclass after it (picked on this level-up, maybe);
   newLevel: the class level it reaches. For each set due, the plan says
   how many new ones to learn and whether one may be swapped. */
export function levelUpOptionPlans(c, cl, className, subclass, newLevel){
  var entry = {name: className, subclass: subclass, level: newLevel};
  var asi = ((CLASS_PROGRESSION[className]||{}).asiLevels||[]).indexOf(newLevel)!==-1;
  return entrySets(entry, newLevel).map(function(set){
    var known = knownOptions(cl, set.id);
    var fresh = Math.max(0, optionsKnownAt(set, newLevel) - known.length);
    var canSwap = known.length > 0 && (
      (set.swap==="level") || (set.swap==="learn" && fresh > 0) ||
      (set.versatility && tashaOn(c) && asi));
    return {set: set, fresh: fresh, canSwap: canSwap, total: optionsKnownAt(set, newLevel),
      why: canSwap && !(set.swap==="level" || (set.swap==="learn" && fresh > 0)) ? "versatility" : ""};
  }).filter(function(p){ return p.fresh > 0 || p.canSwap; });
}
/* choice for one set: {picks: [names], swapOut: id of a known one}. */
export function planSlots(plan, cl, choice){
  var swapping = plan.canSwap && !!choice.swapOut && knownOptions(cl, plan.set.id).some(function(e){ return e.id===choice.swapOut; });
  return plan.fresh + (swapping ? 1 : 0);
}
export function planContext(c, cl, plan, choice, newLevel){
  // A feat's picks (Martial Adept) count as known too: no learning one twice.
  var others = allKnownOptions({classes: [], feats: c.feats||[]}, plan.set.id).map(function(o){ return o.name; });
  return {level: newLevel,
    known: knownOptions(cl, plan.set.id).filter(function(e){ return e.id!==choice.swapOut; }).map(function(e){ return e.name; }).concat(others)};
}
/* What's missing or wrong for one set, or null. */
export function planProblem(c, cl, plan, choice, newLevel){
  var n = planSlots(plan, cl, choice);
  var picks = (choice.picks||[]).slice(0, n);
  if(picks.filter(Boolean).length < n || new Set(picks).size < n){
    return n===1 ? "Choose your new " + plan.set.noun + "." : "Choose " + n + " different " + plan.set.noun + "s.";
  }
  var ctx = planContext(c, cl, plan, choice, newLevel);
  for(var i=0;i<picks.length;i++){
    var opt = plan.set.options.find(function(o){ return o.name===picks[i]; });
    var why = opt ? optionReason(opt, ctx) : "unknown";
    if(why) return picks[i] + " can't be learned now (" + why + "). Pick another.";
  }
  return null;
}
/* Apply one set's choice to the class entry; returns what undo needs. */
export function applyPlan(c, cl, plan, choice){
  var n = planSlots(plan, cl, choice);
  var rec = {set: plan.set.id, added: [], removed: null};
  if(n > plan.fresh) rec.removed = forgetOption(cl, plan.set.id, choice.swapOut);
  (choice.picks||[]).slice(0, n).forEach(function(name){ rec.added.push(learnOption(cl, plan.set.id, name).id); });
  return rec;
}
export function undoPlan(cl, rec){
  (rec.added||[]).forEach(function(id){ forgetOption(cl, rec.set, id); });
  if(rec.removed){
    if(!cl.options) cl.options = {};
    (cl.options[rec.set] = cl.options[rec.set] || []).push(rec.removed);
  }
}

export function learnOption(cl, setId, name){
  if(!cl.options) cl.options = {};
  if(!Array.isArray(cl.options[setId])) cl.options[setId] = [];
  var e = {id: uid(), name: name};
  cl.options[setId].push(e);
  return e;
}
export function forgetOption(cl, setId, id){
  var list = knownOptions(cl, setId);
  var e = list.find(function(x){ return x.id===id; });
  if(!e) return null;
  cl.options[setId] = list.filter(function(x){ return x.id!==id; });
  return e;
}
export { optionSetDef, optionsKnownAt };
