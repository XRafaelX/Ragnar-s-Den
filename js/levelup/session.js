/* ---------------- Level-up: the session ----------------
   `lu` holds the choices of the level-up in progress (null when the
   dialog is closed). It is set only here; the step screens and the apply
   code read it and change its fields. This module also says which steps
   apply, what each still needs before Next, and draws the dialog shell. */
import { ABILITIES, SKILLS, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASS_PROGRESSION, MAX_LEVEL, XP_THRESHOLDS } from "../data/progression.js";
import { mod, ce, escapeHtml, totalLevel, classFeaturesGainedAt, classVariantSwaps, syncTashaAdditions, wizardScrollSave, wizardScrollRestore, wizardScrollReset, hasFeat, raceHpPerLevel, classSpellChoices, spellHeldBy } from "../core/helpers.js";
import { knownInvocations, levelUpPlan, levelUpContext, levelUpProblem } from "../core/invocations.js";
import { levelUpOptionPlans, planProblem, planSlots, allKnownOptions } from "../core/class-options.js";
import { levelUpGrants, grantHasChoices, grantHasSpells, classPickContext, classPicksProblem, fillSlots, slotIsFixed } from "../core/class-picks.js";
import { styleDueAt, classStyleList, availableStyleNames, versatilityStyleSwap, styleFeatures, stylePicksProblem, styleCantripSwap } from "../core/fighting-styles.js";
import { showActionToast } from "../ui/toast.js";
import { makeMoveLeftSvg, makeMoveRightSvg, makeAlertSvg } from "../ui/svg-icons.js";
import { featDef, featNeedsChoice, featPicksProblem, featRequiresReason, featSpellEntries, campaignFeatsAt } from "../core/feat-picks.js";
import { featPicksContext } from "../ui/feat-picks.js";
import { learnPlan, swapSection, cantripSwapSection, learnProblem } from "../core/spells-known.js";
import { finish } from "./apply.js";
import { stepClass, stepStyle, stepSubclass, stepSpells, stepCantrips, stepLearn, stepInvocations, stepOptions, stepProfs, stepAsi, stepFeatPicks, stepBonusFeat, stepBonusFeatPicks, stepHp, stepReview } from "./steps.js";

/* ---------------- Level-up flow ----------------
   A short guided flow in the same full-screen overlay as the creation
   wizard: pick which class gains the level (or multiclass into a new
   one), a subclass when one is due, a Fighting Style when one is due
   (Fighter 1, Paladin 2, Ranger 2), a warlock's Pact Boon and eldritch
   invocations (new ones when due, and an optional swap of one known
   invocation every warlock level), the spells and cantrips the class
   learns (New spells, with an optional swap for classes that know a
   fixed set), the proficiencies a new feature lets you choose
   (Expertise, a subclass's skills, tools or languages), an Ability Score
   Improvement / feat
   at class level 4 (a feat's own picks, when it has any, on a Feat
   picks step after it), then hit points. Applying it records what changed in
   c.levelHistory so the last level-up can be undone. */
var STEP_IDS = ["class","subclass","style","spells","cantrips","learn","invocations","options","profs","asi","featPicks","bonusFeat","bonusFeatPicks","hp","review"];
var STEP_LABELS = {class:"Class", subclass:"Subclass", style:"Style", spells:"Subclass spells", cantrips:"Cantrips", learn:"New spells", invocations:"Invocations", options:"Options", profs:"Proficiencies", asi:"Abilities", featPicks:"Feat picks", bonusFeat:"Campaign feat", bonusFeatPicks:"Campaign feat picks", hp:"Hit points", review:"Review"};
export var lu = null;

export function abilityName(key){
  var found = ABILITIES.find(function(a){ return a[0]===key; });
  return found ? found[1] : key;
}
export function progFor(name){ return CLASS_PROGRESSION[name] || {prereq:[], asiLevels:[4,8,12,16,19], features:{}}; }

export function xpForNextLevel(c){ return XP_THRESHOLDS[totalLevel(c)+1]; }
export function hasXpForNextLevel(c){ return (Number(c.xp)||0) >= xpForNextLevel(c); }
export function canLevelUp(c){ return totalLevel(c) < MAX_LEVEL && hasXpForNextLevel(c); }

/* Multiclass prerequisites: 13+ in the listed abilities (any one group). */
export function meetsPrereq(c, className){
  var prog = CLASS_PROGRESSION[className];
  if(!prog || !prog.prereq.length) return true;
  return prog.prereq.some(function(group){
    return group.every(function(ab){ return (Number(c.abilities[ab])||0) >= 13; });
  });
}
export function prereqText(className){
  var prog = CLASS_PROGRESSION[className];
  if(!prog || !prog.prereq.length) return "";
  return prog.prereq.map(function(g){
    return g.map(function(ab){ return ab.toUpperCase()+" 13"; }).join(" and ");
  }).join(" or ");
}

/* ---- Derived view of the pending choice ---- */
export function target(){
  var c = lu.c;
  var existing = (c.classes||[]).find(function(cl){ return cl.name===lu.className; });
  var prog = progFor(lu.className);
  var newLevel = existing ? (Number(existing.level)||1)+1 : 1;
  var hasSub = !!(existing && existing.subclass);
  var needsSubclass = !!prog.subclassLevel && newLevel >= prog.subclassLevel && !hasSub;
  return {
    existing: existing,
    prog: prog,
    newLevel: newLevel,
    needsSubclass: needsSubclass,
    asi: prog.asiLevels.indexOf(newLevel) !== -1,
    // The class's Fighting Style level, or a subclass's (Champion 10,
    // College of Swords 3, with the subclass maybe picked on this level-up).
    fightingStyle: styleDueAt(lu.className, hasSub ? existing.subclass : (needsSubclass ? lu.subclass || "" : ""), newLevel),
    hitDie: HIT_DICE_BY_CLASS[lu.className] || 8
  };
}

/* Cantrips and a cantrip swap (with Mystic Arcanum, which the same swap
   may change) have a step of their own; every other list is on New spells. */
export function onCantripStep(section){ return section.kind==="cantrip" || section.id==="arcanumIn"; }
/* True when either spell step has something to do. */
export function learnActive(){ return stepApplicable("cantrips") || stepApplicable("learn"); }
export function stepApplicable(id){
  if(!lu.className) return id==="class";
  var t = target();
  if(id==="subclass") return t.needsSubclass;
  if(id==="style") return !!t.fightingStyle || styleSwapOffered() || !!styleCantripOffer();
  if(id==="spells") return dueSpellChoices().length > 0;
  if(id==="cantrips"){ var cp = currentLearnPlan(); return cp.sections.some(onCantripStep) || !!cp.cantripSwap || cp.auto.length > 0; }
  if(id==="learn"){ var lp = currentLearnPlan(); return lp.sections.some(function(x){ return !onCantripStep(x); }) || !!lp.swap; }
  if(id==="invocations") return lu.className==="Warlock" && t.newLevel >= 2;
  if(id==="options") return optionPlans().length > 0;
  if(id==="profs") return profGrantsToChoose().length > 0 || variantOffers().length > 0;
  if(id==="asi") return t.asi;
  if(id==="featPicks") return t.asi && lu.asiMode==="feat" && !!lu.featName && featNeedsChoice(featDef(lu.featName));
  if(id==="bonusFeat") return bonusFeatChoices().length > 0;
  if(id==="bonusFeatPicks") return bonusFeatChoices().length > 0 && !!lu.bonusFeatName && featNeedsChoice(featDef(lu.bonusFeatName));
  return true;
}

/* ---- A campaign's bonus feat ----
   Dragonlance gives one at character level 4, from its own list (see
   CAMPAIGN_FEATS). lu.bonusFeatName / lu.bonusFeatPicks hold the choice.
   A feat's prerequisites still apply, and the feat taken instead of an
   ability increase on this same level-up counts as already had. */
export function bonusFeatChoices(){ return campaignFeatsAt(lu.c, totalLevel(lu.c) + 1); }
function asiFeatNow(){
  return target().asi && lu.asiMode==="feat" && lu.featName ? {name: lu.featName, picks: lu.featPicks || {}} : null;
}
export function bonusFeatReason(def){
  var c = lu.c, now = asiFeatNow();
  if((c.feats||[]).some(function(f){ return f.name===def.name; })) return "you have it";
  if(now && now.name===def.name) return "picked as your feat this level";
  return featRequiresReason(def, {race: c.race, level: totalLevel(c) + 1, feats: (c.feats||[]).concat(now ? [now] : [])});
}

/* ---- Warlock: Pact Boon and invocations ----
   lu.pactBoon / lu.pactSpells: the boon picked at warlock 3 (and the
   Tome's cantrips); lu.invPicks: the invocations to learn, one per slot;
   lu.invSpells[name]: picks a new invocation asks for (Book of Ancient
   Secrets); lu.swapOut: the id of a known invocation to give up for one
   more pick. */
/* ---- Class option sets (Metamagic, maneuvers) ----
   lu.optChoices[setId] = {picks, swapOut}: the options to learn this
   level and, when the set allows it now, a known one to give up. */
export function optionPlans(){
  var t = target();
  var sub = (t.existing && t.existing.subclass) || (t.needsSubclass ? chosenSubclass() : "");
  return levelUpOptionPlans(lu.c, t.existing, lu.className, sub, t.newLevel);
}
export function optChoice(setId){
  return lu.optChoices[setId] = lu.optChoices[setId] || {picks: [], swapOut: ""};
}

/* ---- Proficiency picks (js/core/class-picks.js) ----
   lu.profPicks[key]: the picks for each grant this level brings, one
   list per slot. The grants are worked out from the class entry as this
   level-up will leave it: its new level, a subclass picked now, and the
   options picked on the Options step (a Tiger totem's skills). */
/* Tasha's replacement features the class offers at this level (a new
   ranger's Favored Foe and Deft Explorer, a ranger 3's Primal
   Awareness), for a character using Tasha's optional class features.
   lu.variants[replaced feature] = the variant taken. */
export function variantOffers(){
  return lu.c.tashaOptional ? classVariantSwaps(lu.className, target().newLevel) : [];
}
/* The class entry's variants after this level: the ones it had, the
   offers as picked now (an older pick for the same feature, from a level
   that was undone, gives way), and Tasha's additions it reaches (a rogue
   3's Steady Aim). */
function entryVariants(){
  var t = target(), out = Object.assign({}, t.existing && t.existing.variants);
  variantOffers().forEach(function(v){
    delete out[v.replaces];
    if(lu.variants[v.replaces]===v.name) out[v.replaces] = v.name;
  });
  syncTashaAdditions({tashaOptional: lu.c.tashaOptional, classes: [{name: lu.className, level: t.newLevel, variants: out}]});
  return out;
}
function entryAfter(){
  var t = target(), options = {};
  Object.keys((t.existing && t.existing.options) || {}).forEach(function(k){ options[k] = t.existing.options[k].slice(); });
  optionPlans().forEach(function(plan){
    var choice = optChoice(plan.set.id), n = planSlots(plan, t.existing, choice);
    var list = (options[plan.set.id] || []).filter(function(e){ return !(n > plan.fresh && e.id===choice.swapOut); });
    choice.picks.slice(0, n).filter(Boolean).forEach(function(name){ list.push({name: name}); });
    options[plan.set.id] = list;
  });
  return {name: lu.className, level: t.newLevel, options: options, profPicks: t.existing && t.existing.profPicks, variants: entryVariants(),
    subclass: (t.existing && t.existing.subclass) || (t.needsSubclass ? chosenSubclass() : "")};
}
/* Every grant gained now, with or without a choice. */
export function profGrants(){
  var t = target();
  return levelUpGrants(t.existing, entryAfter(), t.existing ? lu.c.classes.indexOf(t.existing) > 0 : true);
}
/* The ones with something for the player to choose. */
export function profGrantsToChoose(){
  return profGrants().filter(function(g){
    if(!grantHasChoices(g.def)) return false;
    var slots = fillSlots(g.def, profSlots(g.key), profCtx(g));
    return g.def.pick.some(function(s, i){ return !slotIsFixed(g.def, slots, i, profCtx(g)); });
  });
}
export function profSlots(key){ return lu.profPicks[key] = lu.profPicks[key] || []; }
/* The step's name: "Proficiencies", or "Feature choices" once a spell is
   among them (an Arcana cleric's cantrips, a wizard's Spell Mastery). */
export function profStepLabel(){
  return variantOffers().length || profGrantsToChoose().some(function(g){ return grantHasSpells(g.def); }) ? "Feature choices" : STEP_LABELS.profs;
}
/* The class entry's variants after this level, to put on it. */
export function variantsToApply(){ return entryVariants(); }
/* The character as this level-up will leave it, for a grant's pickers.
   What another grant or this level's feat picks is greyed out. */
export function profCtx(grant){
  var t = target(), after = entryAfter();
  var classes = t.existing ? lu.c.classes.map(function(cl){ return cl===t.existing ? after : cl; }) : lu.c.classes.concat([after]);
  var ctx = classPickContext(Object.assign({}, lu.c, {classes: classes}), after, grant.key);
  var elsewhere = profPicked(grant.key), doubled = profPicked(grant.key, true);
  // Expertise only clashes with other expertise; a skill another feature
  // adds this level can take it.
  ctx.taken = function(v, kind){
    if(kind==="expertise") return doubled.indexOf(v)!==-1 ? "picked" : "";
    if(elsewhere.indexOf(v)!==-1) return "picked";
    // A spell learned on this level's New spells step.
    if(kind==="spell" && learningNow().indexOf(v)!==-1) return "new this level";
    return featPicked().indexOf(v)!==-1 ? "your feat's pick" : "";
  };
  ctx.gaining = function(){ return elsewhere; };
  return ctx;
}
/* Skills, tools and languages this level's grants give: fixed ones and
   picks (leaving out one grant's own). expertise: the skills and tools
   they double instead. */
function profPicked(exceptKey, expertise){
  var out = [];
  profGrants().forEach(function(g){
    if(g.key===exceptKey) return;
    out = out.concat(expertise ? g.def.expertise || [] : (g.def.skills || []).concat(g.def.languages || []));
    (lu.profPicks[g.key] || []).forEach(function(slot, i){
      var s = (g.def.pick || [])[i] || {};
      // An expertise slot doubles; any other adds (Blessings of Knowledge's does both).
      if(expertise ? s.kind==="expertise" || !!s.expertise : s.kind!=="expertise") out = out.concat(slot || []);
    });
  });
  return out.filter(Boolean);
}
/* And what this level's feats pick. */
function featPicked(){
  var out = [];
  [target().asi && lu.asiMode==="feat" && lu.featPicks, stepApplicable("bonusFeat") && lu.bonusFeatName && lu.bonusFeatPicks].forEach(function(p){
    if(p) out = out.concat(p.skills || [], p.languages || [], p.tools || [], p.spells || []);
  });
  return out.filter(Boolean);
}
/* The grants with their picks tidied, ready to apply: asked before the
   class entry changes. */
export function profPicksToApply(){
  return profGrants().map(function(g){
    return {grant: g, slots: fillSlots(g.def, profSlots(g.key).map(function(s){ return (s||[]).slice(); }), profCtx(g))};
  });
}

export function invChoice(){
  return {pactBoon: lu.pactBoon, pactSpells: lu.pactSpells, picks: lu.invPicks, pickSpells: lu.invSpells, swapOut: lu.swapOut, pactChange: pactChange()};
}
function invPlan(){ var t = target(); return levelUpPlan(t.existing, t.newLevel, lu.swapOut, pactChange()); }
export function pactDue(){ return invPlan().pactDue; }
export function knownNow(){ return knownInvocations(target().existing); }
export function newInvocationCount(){ return invPlan().fresh; }
export function invocationSlots(){ return invPlan().slots; }
export function luInvocationCtx(){ var t = target(); return levelUpContext(lu.c, t.existing, t.newLevel, invChoice()); }
function invocationProblem(){
  var t = target();
  var problem = levelUpProblem(lu.c, t.existing, t.newLevel, invChoice());
  if(problem) return problem;
  // A Tome cantrip or ritual the character already has (or is learning now).
  var choice = invChoice();
  var picked = (pactDue() ? choice.pactSpells||[] : []).concat(Object.keys(choice.pickSpells||{}).reduce(function(a, k){
    return (choice.picks||[]).indexOf(k)!==-1 ? a.concat(choice.pickSpells[k]) : a; }, [])).filter(Boolean);
  var dup = picked.find(function(n){ return spellHeldNow(n); });
  return dup ? "You already have "+dup+" ("+spellHeldNow(dup)+"). Pick a different spell." : null;
}
/* Spells being learned as class spells in this level-up: the New spells
   step's picks and the cantrips it adds for free. */
function learningNow(){
  var plan = currentLearnPlan();
  return learnSections(plan).reduce(function(a, s){ return a.concat((lu.learnPicks[s.id]||[]).slice(0, s.count)); }, plan.auto.slice()).filter(Boolean);
}
/* Why a pick list should grey a spell out: the character has it ("known",
   "from Fey Touched") or is learning it in this level-up; "" otherwise. */
export function spellHeldNow(name){
  return spellHeldBy(lu.c, name) || (learningNow().indexOf(name)!==-1 ? "new this level" : "");
}

export function chosenSubclass(){ return lu.subclass || ""; }

/* Spell choices the class has at its new level that aren't made yet
   (Circle Spells at druid 3; a Genie or Divine Soul taken on this
   level-up). Asked on the Spells step, saved on the class entry. */
export function dueSpellChoices(){
  var t = target();
  var entry = {name: lu.className, level: t.newLevel,
    subclass: (t.existing && t.existing.subclass) || (t.needsSubclass ? chosenSubclass() : ""),
    spellChoices: t.existing && t.existing.spellChoices};
  return classSpellChoices(entry).filter(function(x){ return !x.pick; });
}

/* ---- New spells ----
   lu.learnPicks[sectionId]: the spells picked in each list of the plan
   (js/core/spells-known.js); lu.learnSwap: a known spell to replace,
   whose replacement is picked in the extra "swapIn" list.
   lu.versatilityPick: the one thing a cantrip swap rule changes this
   level: "cantrip:<name>" (the artificer's every level, Tasha's
   Versatility at Ability Score Improvement levels; replacement in
   "cantripIn"), and for Bardic / Eldritch Versatility instead
   "expertise:<skill>" (its new skill in lu.versatilitySkill),
   "arcanum:<spell>" (replacement in "arcanumIn") or "pact" (a new Pact
   Boon, picked on the Invocations step). */
export function learnEntry(){
  var t = target();
  var choices = Object.assign({}, t.existing && t.existing.spellChoices, lu.spellChoices);
  return {name: lu.className, level: t.newLevel, spellChoices: choices,
    subclass: (t.existing && t.existing.subclass) || (t.needsSubclass ? chosenSubclass() : "")};
}
export function currentLearnPlan(){ return learnPlan(lu.c, learnEntry(), !target().existing); }
export function learnSections(plan){
  plan = plan || currentLearnPlan();
  var swap = swapSection(lu.c, learnEntry(), plan, lu.learnSwap);
  var cantrip = cantripSwapSection(lu.c, learnEntry(), plan, cantripSwapOut(plan));
  return plan.sections.concat(swap ? [swap] : [], cantrip ? [cantrip] : []);
}
/* What the level's cantrip swap rule may change, or null:
   {from, cantrips, arcanum, expertise: [skills a Bardic Versatility may
   move], pact: the Pact Boon an Eldritch Versatility may replace}. */
export function versatilityChoices(plan){
  plan = plan || currentLearnPlan();
  var cs = plan.cantripSwap, cl = target().existing;
  if(!cs) return null;
  var out = {from: cs.from, cantrips: cs.known, arcanum: cs.arcanum || [], expertise: [], pact: ""};
  if(cs.from==="Bardic Versatility" && cl) out.expertise = expertiseSkills(cl).map(function(x){ return x.skill; });
  if(cs.from==="Eldritch Versatility" && cl && cl.pactBoon) out.pact = cl.pactBoon;
  return out;
}
/* The skills a class's Expertise features gave, with the grant holding
   each: [{skill, key}]. */
function expertiseSkills(cl){
  var out = [];
  Object.keys(cl.profPicks||{}).forEach(function(key){
    if(!/^class:Expertise@/.test(key)) return;
    ((cl.profPicks[key].slots||[])[0]||[]).forEach(function(v){
      if(SKILLS.some(function(sk){ return sk[0]===v; })) out.push({skill: v, key: key});
    });
  });
  return out;
}
/* Sorcerous Versatility changes one thing a level: a Metamagic option
   (Options step) or a cantrip. The thing it's changing instead, or "". */
export function cantripSwapBlocked(plan){
  plan = plan || currentLearnPlan();
  if(!plan.cantripSwap || plan.cantripSwap.from!=="Sorcerous Versatility") return "";
  return (lu.optChoices.metamagic||{}).swapOut ? "a Metamagic option" : "";
}
/* The picked change, still allowed: {kind, name} or null. */
export function versatilityPicked(plan){
  plan = plan || currentLearnPlan();
  var v = versatilityChoices(plan), pick = lu.versatilityPick || "";
  if(!v || !pick || cantripSwapBlocked(plan)) return null;
  var at = pick.indexOf(":"), kind = at===-1 ? pick : pick.slice(0, at), name = at===-1 ? "" : pick.slice(at+1);
  var ok = kind==="cantrip" ? v.cantrips.indexOf(name)!==-1
    : kind==="arcanum" ? v.arcanum.indexOf(name)!==-1
    : kind==="expertise" ? v.expertise.indexOf(name)!==-1
    : kind==="pact" ? !!v.pact : false;
  return ok ? {kind: kind, name: name} : null;
}
/* The spell a Versatility swap takes off this level (a cantrip or a
   Mystic Arcanum spell), or "". */
export function cantripSwapOut(plan){
  var p = versatilityPicked(plan);
  return p && (p.kind==="cantrip" || p.kind==="arcanum") ? p.name : "";
}
/* Bardic Versatility: {key, from, to} for the Expertise skill moved, or
   null. `to` may still be "" (not picked yet). */
export function expertiseSwap(plan){
  var p = versatilityPicked(plan);
  if(!p || p.kind!=="expertise") return null;
  var hit = expertiseSkills(target().existing).find(function(x){ return x.skill===p.name; });
  return hit ? {key: hit.key, from: p.name, to: lu.versatilitySkill || ""} : null;
}
/* Skills a moved Expertise can go to: proficient ones without expertise. */
export function expertiseTargets(){
  var sp = lu.c.skillProfs || {};
  return SKILLS.map(function(sk){ return sk[0]; }).filter(function(n){ return sp[n] && sp[n].prof && !sp[n].expertise; });
}
/* Eldritch Versatility picked the Pact Boon. */
export function pactChange(){
  if(lu.className!=="Warlock") return false;
  var p = versatilityPicked();
  return !!(p && p.kind==="pact");
}

export function asiPointsUsed(){
  return Object.keys(lu.asi).reduce(function(a,k){ return a + lu.asi[k]; }, 0);
}
/* How many of the two points can be placed at all: "You can't increase an
   ability score above 20 using this feature", so scores at or near 20 may
   leave fewer than two places to put them. */
export function asiPointsAvailable(){
  var room = Object.keys(lu.asi).reduce(function(a, k){ return a + Math.max(0, Math.min(2, 20 - (Number(lu.c.abilities[k])||10))); }, 0);
  return Math.min(2, room);
}

export function validate(id){
  if(id==="class") return lu.className ? null : "Pick a class to gain the level in.";
  if(id==="subclass") return chosenSubclass() ? null : "Pick a "+(target().prog.subclassLabel||"subclass").toLowerCase()+".";
  if(id==="style"){
    var tS = target();
    var cOffer = styleCantripOffer();
    if(cOffer && lu.styleCantripOut){
      var cList = cOffer.def.spellPick.list.toLowerCase();
      if(!lu.styleCantripIn) return "Pick the "+cList+" cantrip that replaces "+lu.styleCantripOut+".";
      if(spellHeldBy(lu.c, lu.styleCantripIn)) return "You already have "+lu.styleCantripIn+" ("+spellHeldBy(lu.c, lu.styleCantripIn)+"). Pick a different cantrip.";
    }
    if(tS.fightingStyle){
      // Nothing left to pick if the character already has every style
      // this class offers (possible with multiclassing).
      if(!lu.style) return availableStyles().length ? "Pick a fighting style." : null;
    } else {
      if(!lu.styleSwapOut) return null;
      if(!lu.style) return "Pick the fighting style that replaces "+swapOutStyle().fightingStyle+".";
    }
    var styleProblem = stylePicksProblem(lu.style, lu.stylePicks, !!lu.c.tashaOptional, knownManeuvers());
    if(styleProblem) return styleProblem;
    var dupCantrip = ((lu.stylePicks||{}).spells||[]).find(function(n){ return n && spellHeldBy(lu.c, n); });
    return dupCantrip ? "You already have "+dupCantrip+" ("+spellHeldBy(lu.c, dupCantrip)+"). Pick a different cantrip." : null;
  }
  if(id==="spells"){
    var missing = dueSpellChoices().find(function(x){ return !lu.spellChoices[x.choice.id]; });
    return missing ? "Choose your "+missing.choice.label.toLowerCase()+" for "+missing.feature+"." : null;
  }
  if(id==="cantrips"){
    var ex = expertiseSwap();
    if(ex && !ex.to) return "Pick the skill that gets expertise in place of "+ex.from+".";
    return learnProblem(learnSections().filter(onCantripStep), lu.learnPicks);
  }
  if(id==="learn") return learnProblem(learnSections().filter(function(x){ return !onCantripStep(x); }), lu.learnPicks);
  if(id==="invocations") return invocationProblem();
  if(id==="options"){
    var t = target(), plans = optionPlans();
    for(var oi=0; oi<plans.length; oi++){
      var why = planProblem(lu.c, t.existing, plans[oi], optChoice(plans[oi].set.id), t.newLevel);
      if(why) return why;
    }
    return null;
  }
  if(id==="profs"){
    var grants = profGrants().filter(function(g){ return grantHasChoices(g.def); });
    for(var pi=0; pi<grants.length; pi++){
      var pctx = profCtx(grants[pi]);
      var pwhy = classPicksProblem(grants[pi], fillSlots(grants[pi].def, profSlots(grants[pi].key), pctx), pctx);
      if(pwhy) return pwhy;
    }
    return null;
  }
  if(id==="asi"){
    if(lu.asiMode==="feat"){
      if(!lu.featName) return "Pick a feat, or switch to raising ability scores.";
      var blocked = featRequiresReason(featDef(lu.featName), {race: lu.c.race, level: totalLevel(lu.c) + 1, feats: lu.c.feats || []});
      return blocked ? lu.featName+" "+blocked+". Pick another feat." : null;
    }
    var can = asiPointsAvailable();
    if(!can) return "Every score is already 20. Take a feat instead.";
    return asiPointsUsed()===can ? null : can===2 ? "Spend both ability points (you have "+(2-asiPointsUsed())+" left)." : "Spend your ability point (only one can go anywhere: the rest of your scores are at 20).";
  }
  if(id==="featPicks") return featPicksProblem(featDef(lu.featName), lu.featPicks, featCtx()) || null;
  if(id==="bonusFeat"){
    if(!lu.bonusFeatName || bonusFeatChoices().indexOf(lu.bonusFeatName)===-1) return "Pick your campaign's bonus feat.";
    var bonusWhy = bonusFeatReason(featDef(lu.bonusFeatName));
    return bonusWhy ? lu.bonusFeatName+": "+bonusWhy+". Pick another." : null;
  }
  if(id==="bonusFeatPicks") return featPicksProblem(featDef(lu.bonusFeatName), lu.bonusFeatPicks, bonusFeatCtx()) || null;
  if(id==="hp"){
    if(lu.hpRolling) return "Wait for the die to land.";
    return (lu.hpMethod==="avg" || lu.hpRoll!=null) ? null : "Take the average or roll your hit die.";
  }
  return null;
}

/* ---- Open / navigate ---- */
export function openLevelUp(c){
  if(totalLevel(c) >= MAX_LEVEL){
    showActionToast("Level "+MAX_LEVEL+" is the highest level.", true);
    return;
  }
  if(!hasXpForNextLevel(c)){
    showActionToast("You need "+xpForNextLevel(c).toLocaleString()+" XP to reach level "+(totalLevel(c)+1)+".", true);
    return;
  }
  lu = {
    c: c, step:"class",
    className: c.classes.length===1 ? c.classes[0].name : null,
    subclass:"", style:"",
    asiMode:"asi", asi:{str:0,dex:0,con:0,int:0,wis:0,cha:0}, featName:"", featQuery:"", featBlockedOpen:true, featPicks:null, bonusFeatName:"", bonusFeatPicks:null, spellChoices:{},
    pactBoon:"", pactSpells:[], invPicks:[], invSpells:{}, swapOut:"", optChoices:{}, profPicks:{}, variants:{}, learnPicks:{}, learnSwap:"", versatilityPick:"", versatilitySkill:"",
    stylePicks:{options:[], spells:[]}, styleSwapOut:"", styleCantripOut:"", styleCantripIn:"",
    hpMethod:"avg", hpRoll:null
  };
  wizardScrollReset();
  document.getElementById("wizard-overlay").classList.add("open");
  render();
}

export function close(){
  document.getElementById("wizard-overlay").classList.remove("open");
  lu = null;
}

export function go(delta){
  var idx = STEP_IDS.indexOf(lu.step);
  var next = idx;
  do { next += delta; } while(next>=0 && next<STEP_IDS.length && !stepApplicable(STEP_IDS[next]));
  if(next<0 || next>=STEP_IDS.length) return;
  lu.step = STEP_IDS[next];
  render();
}

export function render(){
  var overlay = document.getElementById("wizard-overlay");
  var keepScroll = wizardScrollSave("levelup:"+lu.step);
  overlay.innerHTML = "";
  var c = lu.c;

  var header = ce("div"); header.id = "wizard-header";
  var h2 = document.createElement("h2");
  h2.textContent = "Level up: "+(c.name||"Character")+" to level "+(totalLevel(c)+1);
  var closeBtn = document.createElement("button"); closeBtn.className = "btn small ghost"; closeBtn.textContent = "✕ Cancel";
  closeBtn.addEventListener("click", close);
  header.appendChild(h2); header.appendChild(closeBtn);
  overlay.appendChild(header);

  overlay.appendChild(buildProgress());

  var body = ce("div"); body.id = "wizard-body";
  var inner = ce("div"); inner.id = "wizard-body-inner";
  body.appendChild(inner);
  overlay.appendChild(body);
  ({class:stepClass, subclass:stepSubclass, style:stepStyle, spells:stepSpells, cantrips:stepCantrips, learn:stepLearn, invocations:stepInvocations, options:stepOptions, profs:stepProfs, asi:stepAsi, featPicks:stepFeatPicks, bonusFeat:stepBonusFeat, bonusFeatPicks:stepBonusFeatPicks, hp:stepHp, review:stepReview})[lu.step](inner);

  var errorBox = ce("div","wiz-error");
  overlay.appendChild(errorBox);

  var footer = ce("div"); footer.id = "wizard-footer";
  var backBtn = document.createElement("button");
  backBtn.className = "btn ghost btn-nav"; backBtn.innerHTML = makeMoveLeftSvg() + "Back";
  backBtn.disabled = lu.step==="class";
  backBtn.addEventListener("click", function(){ go(-1); });
  var nextBtn = document.createElement("button");
  nextBtn.className = "btn primary";
  nextBtn.classList.add("btn-nav");
  if(lu.step==="review") nextBtn.textContent = "Level up!";
  else nextBtn.innerHTML = "Next" + makeMoveRightSvg();
  nextBtn.addEventListener("click", function(){
    var err = validate(lu.step);
    if(err){ errorBox.innerHTML = makeAlertSvg() + "<span></span>"; errorBox.lastChild.textContent = err; errorBox.classList.add("show"); return; }
    if(lu.step==="review"){ finish(); return; }
    go(1);
  });
  footer.appendChild(backBtn); footer.appendChild(nextBtn);
  overlay.appendChild(footer);
  wizardScrollRestore(keepScroll);
}

/* Labelled steps so players can see what's left (steps that don't apply
   this level, e.g. Subclass, are left out). */
function buildProgress(){
  var progress = ce("div","lu-progress"); progress.id = "wizard-progress";
  var steps = STEP_IDS.filter(stepApplicable);
  var cur = steps.indexOf(lu.step);
  steps.forEach(function(id, i){
    var step = ce("div","lu-step");
    var dot = ce("div","wiz-dot");
    if(i<cur){ dot.classList.add("done"); step.classList.add("done"); }
    if(i===cur){ dot.classList.add("current"); step.classList.add("current"); step.setAttribute("aria-current", "step"); }
    var label = ce("span","lu-step-label");
    label.textContent = id==="options" ? optionPlans().map(function(p){ return p.set.label; }).join(", ") || STEP_LABELS.options
      : id==="profs" ? profStepLabel() : STEP_LABELS[id];
    step.appendChild(dot); step.appendChild(label);
    progress.appendChild(step);
  });
  return progress;
}
/* Redraw just the progress bar (a feat with choices adds a step). */
export function refreshProgress(){
  var old = document.getElementById("wizard-progress");
  if(old) old.replaceWith(buildProgress());
}

export function stepCard(container, title, explainHtml){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>"+escapeHtml(title)+"</span></h3>";
  if(explainHtml){
    var explain = ce("div","wiz-explain");
    explain.innerHTML = explainHtml;
    card.appendChild(explain);
  }
  container.appendChild(card);
  return card;
}

/* What a class would gain at `level`, as short labels for the pick cards. */
export function gainLabels(className, subclass, level){
  var prog = progFor(className);
  // (With the optional features the class entry uses: Favored Foe, not
  // Favored Enemy. For the class levelling now, as picked on this level-up.)
  var entry = (lu.c.classes||[]).find(function(cl){ return cl.name===className; });
  var variants = lu.className===className ? entryVariants() : entry ? entry.variants : null;
  var labels = classFeaturesGainedAt({name:className, subclass:subclass, level:level, variants:variants}, level).map(function(f){ return f.name; });
  if(prog.subclassLevel && level >= prog.subclassLevel && !subclass) labels.unshift("Choose "+prog.subclassLabel);
  if(prog.asiLevels.indexOf(level)!==-1) labels.push("Ability Score Improvement");
  return labels;
}

export function resetChoicesFor(name){
  if(lu.className===name) return;
  lu.className = name;
  lu.subclass = "";
  lu.style = ""; lu.stylePicks = {options: [], spells: []}; lu.styleSwapOut = ""; lu.styleCantripOut = ""; lu.styleCantripIn = "";
  lu.spellChoices = {}; lu.learnPicks = {}; lu.learnSwap = ""; lu.versatilityPick = ""; lu.versatilitySkill = "";
  lu.pactBoon = ""; lu.pactSpells = []; lu.invPicks = []; lu.invSpells = {}; lu.swapOut = ""; lu.optChoices = {}; lu.profPicks = {}; lu.variants = {};
  lu.asi = {str:0,dex:0,con:0,int:0,wis:0,cha:0}; lu.featName = ""; lu.featPicks = null; lu.asiMode = "asi";
  lu.hpRoll = null; lu.hpMethod = "avg";
}

/* Styles this class may pick now that the character doesn't already have
   (a Fighter who multiclasses into Paladin keeps Defense and picks
   another); Tasha's optional ones only with the switch on. */
function styleOptions(){
  var t = target();
  return t.fightingStyle ? t.fightingStyle.options : classStyleList(lu.className);
}
export function availableStyles(){ return availableStyleNames(lu.c, styleOptions(), !!lu.c.tashaOptional); }
/* Blessed / Druidic Warrior: a level in the paladin / ranger may change
   one of the style's cantrips (not when that style is being replaced).
   {feature, def} or null. */
export function styleCantripOffer(){
  if(!lu.className || !target().existing) return null;
  var offer = styleCantripSwap(lu.c, lu.className);
  return offer && offer.feature.id!==lu.styleSwapOut ? offer : null;
}
/* Martial Versatility: no new style this level, but one may be swapped. */
export function styleSwapOffered(){
  var t = target();
  return !t.fightingStyle && versatilityStyleSwap(lu.c, lu.className, t.newLevel);
}
export function swapOutStyle(){ return styleFeatures(lu.c).find(function(f){ return f.id===lu.styleSwapOut; }) || null; }
export function knownManeuvers(){ return allKnownOptions(lu.c, "maneuvers").map(function(o){ return o.name; }); }

export function featCtx(){
  var ctx = featPicksContext(lu.c);
  // A spell learned on this level's New spells step isn't also the feat's.
  var learning = learningNow();
  ctx.spellTaken = function(name){ return learning.indexOf(name)!==-1 ? "new this level" : ""; };
  // Skills and languages this level's class features give count as had.
  var gained = profPicked();
  if(gained.length){
    ctx.skillProfs = Object.assign({}, ctx.skillProfs);
    gained.forEach(function(v){ if(ctx.skillProfs[v] || SKILLS.some(function(s){ return s[0]===v; })) ctx.skillProfs[v] = Object.assign({}, ctx.skillProfs[v], {prof: true}); });
    ctx.languages = ctx.languages.concat(gained);
  }
  return ctx;
}
/* Its picks see the other feat taken this level: a spell that one
   teaches isn't picked again, and an ability it raised counts. */
export function bonusFeatCtx(){
  var ctx = featCtx(), now = asiFeatNow();
  if(!now) return ctx;
  var taken = featSpellEntries(featDef(now.name), now.picks).map(function(e){ return e.name; });
  var earlier = ctx.spellTaken;
  ctx.spellTaken = function(name){ return taken.indexOf(name)!==-1 ? "from " + now.name : earlier(name); };
  if(now.picks.ability){
    ctx.abilities = Object.assign({}, ctx.abilities);
    ctx.abilities[now.picks.ability] = Math.min(20, (Number(ctx.abilities[now.picks.ability])||10) + 1);
  }
  return ctx;
}
/* The +1 the chosen feat gives (Durable: CON), or null. */
function featAbilityPick(){
  return target().asi && lu.asiMode==="feat" && lu.featPicks && lu.featPicks.ability || null;
}
/* And the campaign feat's (Knight of the Crown: CON), or null. */
function bonusFeatAbilityPick(){
  return stepApplicable("bonusFeat") && lu.bonusFeatName && lu.bonusFeatPicks && lu.bonusFeatPicks.ability || null;
}

export function conModAfterAsi(){
  var con = (Number(lu.c.abilities.con)||10) + (lu.asiMode==="asi" && target().asi ? lu.asi.con : 0);
  if(featAbilityPick()==="con") con = Math.min(20, con + 1);
  if(bonusFeatAbilityPick()==="con") con = Math.min(20, con + 1);
  var fb = featureAbilityBonus().con;
  if(fb) con = Math.min(fb.max, con + fb.bonus);
  return mod(con);
}

/* Ability increases from features this level-up grants, as
   {ability: {bonus, max}} (Primal Champion: +4 STR and CON, max 24).
   Worked out from the target class level, so call it before finish()
   changes the class entry. */
export function featureAbilityBonus(){
  var t = target();
  var entry = {name: lu.className, level: t.newLevel,
    subclass: (t.existing && t.existing.subclass) || (t.needsSubclass ? chosenSubclass() : "")};
  var out = {};
  classFeaturesGainedAt(entry, t.newLevel).forEach(function(f){
    if(!f.abilityBonus) return;
    Object.keys(f.abilityBonus).forEach(function(k){
      out[k] = {bonus: (out[k] ? out[k].bonus : 0) + f.abilityBonus[k], max: f.abilityMax || 20};
    });
  });
  return out;
}

/* HP gained this level. Raising CON also raises HP retroactively by the
   modifier change for every level you already had. */
export function hpGain(){
  var t = target();
  var oldCon = mod(lu.c.abilities.con);
  var newCon = conModAfterAsi();
  var base = lu.hpMethod==="roll" && lu.hpRoll!=null ? lu.hpRoll : t.hitDie/2 + 1;
  // Draconic Resilience: +1 HP per sorcerer level, including the level the
  // bloodline is picked on.
  var sub = t.existing && t.existing.subclass || (t.needsSubclass ? chosenSubclass() : "");
  var draconic = lu.className==="Sorcerer" && sub==="Draconic Bloodline" ? 1 : 0;
  return Math.max(1, base + newCon) + (newCon - oldCon) * totalLevel(lu.c) + draconic;
}
/* The share of this level's HP the sheet adds itself (see maxHp): Tough's
   2 for the new level, or 2 per character level when Tough is the feat
   taken now, plus Dwarven Toughness's 1. Only for showing it. */
export function toughGain(){
  var t = target();
  var race = raceHpPerLevel(lu.c);
  if(hasFeat(lu.c, "Tough")) return 2 + race;
  return (t.asi && lu.asiMode==="feat" && lu.featName==="Tough" ? 2 * (totalLevel(lu.c)+1) : 0) + race;
}
