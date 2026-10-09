import { ABILITIES, CLASS_LIST, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, FIGHTING_STYLES } from "../data/classes.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL, XP_THRESHOLDS, SPELL_TIPS, THIRD_CASTER_SPELL_TIPS } from "../data/progression.js";
import {
  mod, fmtMod, ce, escapeHtml, uid, clamp, totalLevel, profBonus,
  classFeatureList, classFeaturesGainedAt, classCasterType, classSpellAbility, computeSpellSlots,
  wizardScrollSave, wizardScrollRestore, wizardScrollReset, hasFightingStyle,
  hasFeat, maxHp, raceHpPerLevel, syncHitDice, computeSpeed, classSpellChoices, ordinal
} from "../core/helpers.js";
import { renderSpellChoiceOptions } from "../ui/spell-choice.js";
import { save } from "../core/state.js";
import { syncInfusions } from "../core/artificer.js";
import { invocationsKnownAt, invocationDef, pactBoonDef } from "../data/invocations.js";
import { knownInvocations, availableInvocations, levelUpPlan, levelUpContext, levelUpProblem, applyLevelUpChoices, undoLevelUpChoices } from "../core/invocations.js";
import { renderPactBoonOptions, renderInvocationPicker, renderSpellPickPickers, renderHiddenNotes } from "../ui/invocation-picks.js";
import { themedPicker } from "../ui/themed-picker.js";
import { levelUpOptionPlans, planSlots, planContext, planProblem, applyPlan, undoPlan, knownOptions, availableOptions } from "../core/class-options.js";
import { renderOptionPicker } from "../ui/option-picks.js";
import { renderAll } from "../render/sheet.js";
import { logRoll, getDieSvg } from "../dice/dice.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { openInfoModal } from "../ui/info-modal.js";
import { playAdd, playDelete } from "../ui/sound.js";
import { showActionToast } from "../ui/toast.js";
import { makeMoveLeftSvg, makeMoveRightSvg, makePlusSvg, makeAlertSvg } from "../ui/svg-icons.js";
import { openCompendium } from "../render/compendium.js";
import { featDef, featHasPicks, featNeedsChoice, emptyPicks, featPicksProblem, featPicksSummary, applyFeatPicks, revertFeatPicks } from "../core/feat-picks.js";
import { renderFeatPicks, featPicksContext } from "../ui/feat-picks.js";

/* ---------------- Level-up flow ----------------
   A short guided flow in the same full-screen overlay as the creation
   wizard: pick which class gains the level (or multiclass into a new
   one), a subclass when one is due, a Fighting Style when one is due
   (Fighter 1, Paladin 2, Ranger 2), a warlock's Pact Boon and eldritch
   invocations (new ones when due, and an optional swap of one known
   invocation every warlock level), an Ability Score Improvement / feat
   at class level 4 (a feat's own picks, when it has any, on a Feat
   picks step after it), then hit points. Applying it records what changed in
   c.levelHistory so the last level-up can be undone. */
var STEP_IDS = ["class","subclass","style","spells","invocations","options","asi","featPicks","hp","review"];
var STEP_LABELS = {class:"Class", subclass:"Subclass", style:"Fighting style", spells:"Spells", invocations:"Invocations", options:"Options", asi:"Abilities", featPicks:"Feat picks", hp:"Hit points", review:"Review"};
var lu = null;

function abilityName(key){
  var found = ABILITIES.find(function(a){ return a[0]===key; });
  return found ? found[1] : key;
}
function progFor(name){ return CLASS_PROGRESSION[name] || {prereq:[], asiLevels:[4,8,12,16,19], features:{}}; }

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
function target(){
  var c = lu.c;
  var existing = (c.classes||[]).find(function(cl){ return cl.name===lu.className; });
  var prog = progFor(lu.className);
  var newLevel = existing ? (Number(existing.level)||1)+1 : 1;
  var hasSub = !!(existing && existing.subclass);
  return {
    existing: existing,
    prog: prog,
    newLevel: newLevel,
    needsSubclass: !!prog.subclassLevel && newLevel >= prog.subclassLevel && !hasSub,
    asi: prog.asiLevels.indexOf(newLevel) !== -1,
    fightingStyle: prog.fightingStyle && prog.fightingStyle.level===newLevel ? prog.fightingStyle : null,
    hitDie: HIT_DICE_BY_CLASS[lu.className] || 8
  };
}

function stepApplicable(id){
  if(!lu.className) return id==="class";
  var t = target();
  if(id==="subclass") return t.needsSubclass;
  if(id==="style") return !!t.fightingStyle;
  if(id==="spells") return dueSpellChoices().length > 0;
  if(id==="invocations") return lu.className==="Warlock" && t.newLevel >= 2;
  if(id==="options") return optionPlans().length > 0;
  if(id==="asi") return t.asi;
  if(id==="featPicks") return t.asi && lu.asiMode==="feat" && !!lu.featName && featNeedsChoice(featDef(lu.featName));
  return true;
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
function optionPlans(){
  var t = target();
  var sub = (t.existing && t.existing.subclass) || (t.needsSubclass ? chosenSubclass() : "");
  return levelUpOptionPlans(lu.c, t.existing, lu.className, sub, t.newLevel);
}
function optChoice(setId){
  return lu.optChoices[setId] = lu.optChoices[setId] || {picks: [], swapOut: ""};
}

function invChoice(){
  return {pactBoon: lu.pactBoon, pactSpells: lu.pactSpells, picks: lu.invPicks, pickSpells: lu.invSpells, swapOut: lu.swapOut};
}
function invPlan(){ var t = target(); return levelUpPlan(t.existing, t.newLevel, lu.swapOut); }
function pactDue(){ return invPlan().pactDue; }
function knownNow(){ return knownInvocations(target().existing); }
function newInvocationCount(){ return invPlan().fresh; }
function invocationSlots(){ return invPlan().slots; }
function luInvocationCtx(){ var t = target(); return levelUpContext(lu.c, t.existing, t.newLevel, invChoice()); }
function invocationProblem(){ var t = target(); return levelUpProblem(lu.c, t.existing, t.newLevel, invChoice()); }

function chosenSubclass(){ return lu.subclass || ""; }

/* Spell choices the class has at its new level that aren't made yet
   (Circle Spells at druid 3; a Genie or Divine Soul taken on this
   level-up). Asked on the Spells step, saved on the class entry. */
function dueSpellChoices(){
  var t = target();
  var entry = {name: lu.className, level: t.newLevel,
    subclass: (t.existing && t.existing.subclass) || (t.needsSubclass ? chosenSubclass() : ""),
    spellChoices: t.existing && t.existing.spellChoices};
  return classSpellChoices(entry).filter(function(x){ return !x.pick; });
}

function asiPointsUsed(){
  return Object.keys(lu.asi).reduce(function(a,k){ return a + lu.asi[k]; }, 0);
}

function validate(id){
  if(id==="class") return lu.className ? null : "Pick a class to gain the level in.";
  if(id==="subclass") return chosenSubclass() ? null : "Pick a "+(target().prog.subclassLabel||"subclass").toLowerCase()+".";
  if(id==="style"){
    // Nothing left to pick if the character already has every style
    // this class offers (possible with multiclassing).
    return lu.style || !availableStyles().length ? null : "Pick a fighting style.";
  }
  if(id==="spells"){
    var missing = dueSpellChoices().find(function(x){ return !lu.spellChoices[x.choice.id]; });
    return missing ? "Choose your "+missing.choice.label.toLowerCase()+" for "+missing.feature+"." : null;
  }
  if(id==="invocations") return invocationProblem();
  if(id==="options"){
    var t = target(), plans = optionPlans();
    for(var oi=0; oi<plans.length; oi++){
      var why = planProblem(lu.c, t.existing, plans[oi], optChoice(plans[oi].set.id), t.newLevel);
      if(why) return why;
    }
    return null;
  }
  if(id==="asi"){
    if(lu.asiMode==="feat") return lu.featName ? null : "Pick a feat, or switch to raising ability scores.";
    return asiPointsUsed()===2 ? null : "Spend both ability points (you have "+(2-asiPointsUsed())+" left).";
  }
  if(id==="featPicks") return featPicksProblem(featDef(lu.featName), lu.featPicks, featCtx()) || null;
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
    asiMode:"asi", asi:{str:0,dex:0,con:0,int:0,wis:0,cha:0}, featName:"", featQuery:"", featPicks:null, spellChoices:{},
    pactBoon:"", pactSpells:[], invPicks:[], invSpells:{}, swapOut:"", optChoices:{},
    hpMethod:"avg", hpRoll:null
  };
  wizardScrollReset();
  document.getElementById("wizard-overlay").classList.add("open");
  render();
}

function close(){
  document.getElementById("wizard-overlay").classList.remove("open");
  lu = null;
}

function go(delta){
  var idx = STEP_IDS.indexOf(lu.step);
  var next = idx;
  do { next += delta; } while(next>=0 && next<STEP_IDS.length && !stepApplicable(STEP_IDS[next]));
  if(next<0 || next>=STEP_IDS.length) return;
  lu.step = STEP_IDS[next];
  render();
}

function render(){
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
  ({class:stepClass, subclass:stepSubclass, style:stepStyle, spells:stepSpells, invocations:stepInvocations, options:stepOptions, asi:stepAsi, featPicks:stepFeatPicks, hp:stepHp, review:stepReview})[lu.step](inner);

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
    label.textContent = id==="options" ? optionPlans().map(function(p){ return p.set.label; }).join(", ") || STEP_LABELS.options : STEP_LABELS[id];
    step.appendChild(dot); step.appendChild(label);
    progress.appendChild(step);
  });
  return progress;
}
/* Redraw just the progress bar (a feat with choices adds a step). */
function refreshProgress(){
  var old = document.getElementById("wizard-progress");
  if(old) old.replaceWith(buildProgress());
}

function stepCard(container, title, explainHtml){
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
function gainLabels(className, subclass, level){
  var prog = progFor(className);
  var labels = classFeaturesGainedAt({name:className, subclass:subclass, level:level}, level).map(function(f){ return f.name; });
  if(prog.subclassLevel && level >= prog.subclassLevel && !subclass) labels.unshift("Choose "+prog.subclassLabel);
  if(prog.asiLevels.indexOf(level)!==-1) labels.push("Ability Score Improvement");
  return labels;
}

function resetChoicesFor(name){
  if(lu.className===name) return;
  lu.className = name;
  lu.subclass = "";
  lu.style = "";
  lu.spellChoices = {};
  lu.pactBoon = ""; lu.pactSpells = []; lu.invPicks = []; lu.invSpells = {}; lu.swapOut = ""; lu.optChoices = {};
  lu.asi = {str:0,dex:0,con:0,int:0,wis:0,cha:0}; lu.featName = ""; lu.featPicks = null; lu.asiMode = "asi";
  lu.hpRoll = null; lu.hpMethod = "avg";
}

function stepClass(container){
  var c = lu.c;
  var card = stepCard(container, "Advance a class",
    "<b>How levelling works:</b> each level you gain goes into one class. Most players keep levelling the class they started with. That's how you unlock its strongest features.");
  var grid = ce("div","class-pick-grid");
  c.classes.forEach(function(cl){
    var next = (Number(cl.level)||1)+1;
    var box = ce("div","class-pick-card"+(lu.className===cl.name?" selected":""));
    var gains = gainLabels(cl.name, cl.subclass, next);
    box.innerHTML = "<h4>"+escapeHtml(cl.name)+" Lvl "+next+"</h4>"+
      (cl.subclass ? "<p><i>"+escapeHtml(cl.subclass)+"</i></p>" : "")+
      "<p>"+(gains.length ? "Gains: "+escapeHtml(gains.join(", ")) : "More hit points (no new class features this level)")+"</p>";
    box.addEventListener("click", function(){ resetChoicesFor(cl.name); render(); });
    grid.appendChild(box);
  });
  card.appendChild(grid);

  var mcCard = stepCard(container, "…or multiclass",
    "<b>Multiclassing</b> adds level 1 of a different class. You need <b>13 or higher</b> in the key ability of your current class(es) <i>and</i> of the new one. "+
    "You only get some of the new class's proficiencies and none of its saving throws. It's optional and mostly for experienced players.");
  var blockers = c.classes.filter(function(cl){ return !meetsPrereq(c, cl.name); });
  if(blockers.length){
    var warn = ce("p","lu-note");
    warn.textContent = "You can't multiclass yet: your "+blockers.map(function(cl){ return cl.name+" needs "+prereqText(cl.name); }).join("; ")+".";
    mcCard.appendChild(warn);
  }
  var mcGrid = ce("div","class-pick-grid");
  CLASS_LIST.forEach(function(name){
    if(c.classes.some(function(cl){ return cl.name===name; })) return;
    var ok = !blockers.length && meetsPrereq(c, name);
    var box = ce("div","class-pick-card"+(ok?"":" disabled")+(lu.className===name?" selected":""));
    var info = CLASSES_INFO[name];
    box.innerHTML = "<h4>"+escapeHtml(name)+" Lvl 1</h4><p>"+escapeHtml(info ? info.blurb : "")+"</p>"+
      "<span class='soon'>Needs "+escapeHtml(prereqText(name))+"</span>";
    if(ok) box.addEventListener("click", function(){ resetChoicesFor(name); render(); });
    mcGrid.appendChild(box);
  });
  mcCard.appendChild(mcGrid);
}

/* Styles this class may pick that the character doesn't already have
   (e.g. a Fighter who multiclasses into Paladin keeps Defense and picks
   another). */
function availableStyles(){
  var fs = target().fightingStyle;
  return fs ? fs.options.filter(function(n){ return !hasFightingStyle(lu.c, n); }) : [];
}

function stepStyle(container){
  var fs = target().fightingStyle;
  var card = stepCard(container, "Choose a Fighting Style",
    "<b>Your fighting style</b> is a combat specialty you keep for good. <b>Defense</b> and <b>Archery</b> are added to your AC and attacks automatically; the others are reminders on your Features tab.");
  fs.options.forEach(function(name){
    var owned = hasFightingStyle(lu.c, name);
    var opt = ce("div","wiz-equip-option"+(lu.style===name?" selected":""));
    opt.innerHTML = "<b>"+escapeHtml(name)+"</b><div class='lu-sub-blurb'>"+escapeHtml(FIGHTING_STYLES[name].text)+"</div>"+
      (owned ? "<div class='lu-sub-feats'>You already have this style.</div>" : "");
    if(owned){ opt.style.opacity = ".5"; opt.style.cursor = "not-allowed"; }
    else opt.addEventListener("click", function(){ lu.style = name; render(); });
    card.appendChild(opt);
  });
  if(!availableStyles().length){
    var p = ce("p","lu-note");
    p.textContent = "You already know every style this class can pick, so there's nothing to choose.";
    card.appendChild(p);
  }
}

function stepSubclass(container){
  var t = target();
  var label = t.prog.subclassLabel || "Subclass";
  var card = stepCard(container, "Choose your "+label,
    "<b>Your "+escapeHtml(label)+"</b> is your "+escapeHtml(lu.className)+"'s specialisation. It shapes your play style and grants extra features now and at later levels. This choice is permanent, so pick the one that sounds most fun.");
  var list = SUBCLASSES[lu.className] || [];
  list.forEach(function(sub){
    var opt = ce("div","wiz-equip-option"+(lu.subclass===sub.name?" selected":""));
    var feats = [];
    for(var lv=1; lv<=t.newLevel; lv++) ((sub.features||{})[lv]||[]).forEach(function(f){ feats.push(f.name); });
    opt.innerHTML = "<b>"+escapeHtml(sub.name)+"</b>"+(sub.custom ? "<span class='lu-custom-tag'>Custom</span>" : "")+"<div class='lu-sub-blurb'>"+escapeHtml(sub.blurb)+"</div>"+
      (feats.length ? "<div class='lu-sub-feats'>Unlocks: "+escapeHtml(feats.join(", "))+"</div>" : "");
    opt.addEventListener("click", function(){ lu.subclass = sub.name; render(); });
    card.appendChild(opt);
  });
  // Homebrew subclasses are made in the Compendium (with their features
  // and levels), then show up in this list like the others.
  var note = ce("div","lu-custom-note");
  note.innerHTML = "<div><b>Want your own "+escapeHtml(label.toLowerCase())+"?</b> Create it in the Compendium with its features and the levels they unlock at. It'll appear in this list.</div>";
  var make = document.createElement("button");
  make.type = "button";
  make.className = "btn small";
  make.innerHTML = makePlusSvg()+"Create a custom "+escapeHtml(label.toLowerCase());
  make.addEventListener("click", function(){
    openCompendium({
      newSubclassFor: lu.className,
      // Saved: pick it and come straight back here.
      onSubclassSaved: function(entry){
        if(lu && entry.className===lu.className) lu.subclass = entry.name;
        document.getElementById("catalog-back").click();
      },
      onClose: function(){ if(lu) render(); }
    });
  });
  note.appendChild(make);
  card.appendChild(note);
}

function stepSpells(container){
  var card = stepCard(container, "Subclass spells",
    "<b>Pick once:</b> part of your subclass's spell list depends on this choice. You can change it later on the sheet's Spells tab.");
  dueSpellChoices().forEach(function(x){
    var title = ce("p","lu-choice-title");
    title.textContent = x.feature+": "+x.choice.label;
    card.appendChild(title);
    card.appendChild(renderSpellChoiceOptions(x.choice, lu.spellChoices[x.choice.id], function(v){ lu.spellChoices[x.choice.id] = v; render(); }, lu.className));
  });
}

function stepInvocations(container){
  var t = target();
  if(pactDue()){
    var pc = stepCard(container, "Choose your Pact Boon",
      "<b>Your patron's gift:</b> at warlock level 3 you choose a Pact Boon. It's yours for good, and some invocations need a particular pact. "+
      "Blade suits a warlock who fights up close, Chain gives you a clever familiar, Tome gives you extra cantrips, and Talisman helps an ally.");
    pc.appendChild(renderPactBoonOptions(lu.pactBoon, function(name){
      if(name!==lu.pactBoon) lu.pactSpells = [];
      lu.pactBoon = name; render();
    }));
    var boon = pactBoonDef(lu.pactBoon);
    if(boon && boon.spellPick){
      var title = ce("p","lu-choice-title");
      title.textContent = "Your Book of Shadows: choose "+boon.spellPick.count+" "+boon.spellPick.label;
      pc.appendChild(title);
      pc.appendChild(renderSpellPickPickers(boon.spellPick, lu.pactSpells, "lu:pact", render));
    }
  }

  var known = knownNow();
  var need = newInvocationCount();
  var total = invocationsKnownAt(t.newLevel);
  var ctx = luInvocationCtx();
  // Only invocations the warlock can take are listed; a pick that no
  // longer qualifies (the Pact Boon changed above) is cleared.
  var availableNames = availableInvocations(ctx).map(function(i){ return i.name; });
  var n = invocationSlots();
  lu.invPicks = lu.invPicks.slice(0, n).map(function(v){ return availableNames.indexOf(v)!==-1 ? v : ""; });
  var favourites = [["Agonizing Blast", "more Eldritch Blast damage"], ["Devil's Sight", "see in magical darkness"], ["Armor of Shadows", "free Mage Armor"]]
    .filter(function(f){ return availableNames.indexOf(f[0])!==-1; }).slice(0, 2)
    .map(function(f){ return "<b>"+escapeHtml(f[0])+"</b> ("+escapeHtml(f[1])+")"; });
  var card = stepCard(container, "Eldritch invocations",
    "<b>Invocations</b> are lasting gifts from your patron, such as casting a spell at will or a stronger Eldritch Blast. "+
    (need ? "At warlock level "+t.newLevel+" you know "+total+", so you learn <b>"+need+" new</b> now. " : "You don't learn a new one this level. ")+
    (favourites.length ? "If you're unsure, "+favourites.join(" and ")+(favourites.length>1 ? " are favourites." : " is a favourite.") : ""));
  function picker(i, labelText){
    var label = ce("p","lu-choice-title");
    label.textContent = labelText;
    card.appendChild(label);
    card.appendChild(renderInvocationPicker({
      key: "lu:inv:"+i, ctx: ctx, value: lu.invPicks[i] || "",
      taken: lu.invPicks.filter(function(v, j){ return j!==i && v; }),
      onPick: function(v){ lu.invPicks[i] = v; render(); }
    }));
    var inv = invocationDef(lu.invPicks[i]);
    if(inv && inv.spellPick){
      var values = lu.invSpells[inv.name] = lu.invSpells[inv.name] || [];
      var sp = ce("p","lu-choice-title");
      sp.textContent = inv.name+": choose "+inv.spellPick.count+" "+inv.spellPick.label;
      card.appendChild(sp);
      card.appendChild(renderSpellPickPickers(inv.spellPick, values, "lu:invsp:"+i, render));
    }
  }
  for(var i=0;i<need;i++) picker(i, need>1 ? "New invocation "+(i+1) : "New invocation");

  // The optional swap: give up one known invocation, then pick its
  // replacement (the last pick) right under it.
  if(known.length){
    var swapTitle = ce("p","lu-choice-title");
    swapTitle.textContent = "Swap one you know (optional)";
    card.appendChild(swapTitle);
    var swapHelp = ce("p","lu-note");
    swapHelp.textContent = "Each warlock level you may replace one invocation you know with another you could learn now. Most players keep theirs.";
    card.appendChild(swapHelp);
    var field = ce("div","field rt-field fp-field eli-field");
    var options = [{value:"", label:"Keep them all", muted:true}].concat(known.map(function(e){ return {value:e.id, label:"Replace "+e.name}; }));
    field.appendChild(themedPicker({
      key: "lu:swap", ariaLabel: "Invocation to replace", placeholder: "Keep them all", search: false,
      groups: {"": options}, value: lu.swapOut,
      onPick: function(v){
        if(v!==lu.swapOut) lu.invPicks = lu.invPicks.slice(0, need);
        lu.swapOut = v; render();
      }
    }));
    card.appendChild(field);
    var replacing = lu.swapOut && known.find(function(e){ return e.id===lu.swapOut; });
    if(replacing) picker(n-1, "Replacement for "+replacing.name);
  }
  var hiddenNote = renderHiddenNotes(ctx);
  if(hiddenNote) card.appendChild(hiddenNote);
}

/* Options: for each set due this level (a Battle Master's maneuvers, a
   sorcerer's Metamagic), pickers for the new ones and, when allowed, an
   optional swap. Only options the character can learn are listed. */
function stepOptions(container){
  var t = target();
  optionPlans().forEach(function(plan){
    var set = plan.set, choice = optChoice(set.id);
    var known = knownOptions(t.existing, set.id);
    if(choice.swapOut && !known.some(function(e){ return e.id===choice.swapOut; })) choice.swapOut = "";
    var n = planSlots(plan, t.existing, choice);
    var ctx = planContext(lu.c, t.existing, plan, choice, t.newLevel);
    var names = availableOptions(set, ctx).map(function(o){ return o.name; });
    choice.picks = choice.picks.slice(0, n).map(function(v){ return names.indexOf(v)!==-1 ? v : ""; });
    var lead = plan.fresh
      ? "At "+escapeHtml(lu.className.toLowerCase())+" level "+t.newLevel+" you know "+plan.total+", so you learn <b>"+plan.fresh+" new</b> now. "
      : "You don't learn a new one this level. ";
    var card = stepCard(container, set.label, "<b>"+escapeHtml(set.label)+":</b> "+escapeHtml(set.help)+" "+lead);
    function picker(i, labelText){
      var label = ce("p","lu-choice-title");
      label.textContent = labelText;
      card.appendChild(label);
      card.appendChild(renderOptionPicker({
        set: set, ctx: ctx, key: "lu:opt:"+set.id+":"+i, value: choice.picks[i] || "",
        taken: choice.picks.filter(function(v, j){ return j!==i && v; }),
        onPick: function(v){ choice.picks[i] = v; render(); }
      }));
    }
    for(var i=0;i<plan.fresh;i++) picker(i, plan.fresh>1 ? "New "+set.noun+" "+(i+1) : "New "+set.noun);
    if(plan.canSwap){
      var swapTitle = ce("p","lu-choice-title");
      swapTitle.textContent = "Swap one you know (optional)";
      card.appendChild(swapTitle);
      var help = ce("p","lu-note");
      help.textContent = plan.why==="versatility"
        ? "Tasha's optional features let you replace one "+set.noun+" at this level. Most players keep theirs."
        : "You may replace one "+set.noun+" you know with another you could learn now. Most players keep theirs.";
      card.appendChild(help);
      var field = ce("div","field rt-field fp-field eli-field");
      var options = [{value:"", label:"Keep them all", muted:true}].concat(known.map(function(e){ return {value:e.id, label:"Replace "+e.name}; }));
      field.appendChild(themedPicker({
        key: "lu:optswap:"+set.id, ariaLabel: set.label+" to replace", placeholder: "Keep them all", search: false,
        groups: {"": options}, value: choice.swapOut,
        onPick: function(v){
          if(v!==choice.swapOut) choice.picks = choice.picks.slice(0, plan.fresh);
          choice.swapOut = v; render();
        }
      }));
      card.appendChild(field);
      var replacing = choice.swapOut && known.find(function(e){ return e.id===choice.swapOut; });
      if(replacing) picker(n-1, "Replacement for "+replacing.name);
    }
  });
}

function stepAsi(container){
  var c = lu.c;
  var card = stepCard(container, "Ability Score Improvement",
    "<b>Get stronger:</b> raise one ability score by 2, or two scores by 1 each (max 20). Or, instead, take a <b>feat</b> (a special talent). If you're unsure, raising your class's main ability is always a solid choice.");
  var row = ce("div","wiz-method-row");
  [["asi","Raise ability scores"],["feat","Take a feat instead"]].forEach(function(m){
    var b = document.createElement("button");
    b.className = "btn wiz-method-btn"+(lu.asiMode===m[0]?" primary":"");
    b.textContent = m[1];
    b.addEventListener("click", function(){ lu.asiMode = m[0]; render(); });
    row.appendChild(b);
  });
  card.appendChild(row);

  if(lu.asiMode==="asi"){
    var left = ce("p","lu-points");
    left.textContent = "Points left: "+(2-asiPointsUsed())+" / 2";
    card.appendChild(left);
    ABILITIES.forEach(function(a){
      var k = a[0];
      var base = Number(c.abilities[k])||10;
      var r = ce("div","lu-asi-row");
      var name = ce("span","lu-asi-name"); name.textContent = a[1];
      var val = ce("span","lu-asi-val");
      var now = base + lu.asi[k];
      val.textContent = now + " (" + fmtMod(mod(now)) + ")" + (lu.asi[k] ? "  +" + lu.asi[k] : "");
      if(lu.asi[k]) val.classList.add("up");
      var minus = document.createElement("button");
      minus.className = "btn small"; minus.textContent = "−";
      minus.disabled = lu.asi[k]<=0;
      minus.addEventListener("click", function(){ lu.asi[k]--; render(); });
      var plus = document.createElement("button");
      plus.className = "btn small"; plus.textContent = "+";
      plus.disabled = asiPointsUsed()>=2 || lu.asi[k]>=2 || now>=20;
      plus.addEventListener("click", function(){ lu.asi[k]++; render(); });
      r.appendChild(name); r.appendChild(val); r.appendChild(minus); r.appendChild(plus);
      card.appendChild(r);
    });
    return;
  }

  var search = document.createElement("input");
  search.type = "text"; search.className = "wiz-spell-search";
  search.placeholder = "Search feats…"; search.value = lu.featQuery;
  card.appendChild(search);
  var list = ce("div","wiz-spell-list");
  card.appendChild(list);
  // Under the list: a line saying the feat's own picks come next (they
  // have their own step). Redrawn on its own so the list keeps its scroll.
  var nextBox = ce("p","lu-note lu-feat-next");
  card.appendChild(nextBox);
  function drawNext(){
    var def = lu.featName && featDef(lu.featName);
    nextBox.textContent = def ? (featNeedsChoice(def) ? lu.featName+": next, you'll choose what it gives you." : lu.featName+": nothing to choose, the sheet applies it.") : "";
    nextBox.hidden = !def;
  }
  function fill(){
    list.innerHTML = "";
    var q = lu.featQuery.toLowerCase().trim();
    FEATS_CATALOG.filter(function(f){
      if(!f.repeatable && (c.feats||[]).some(function(x){ return x.name===f.name; })) return false;
      return !q || f.name.toLowerCase().indexOf(q)!==-1 || (f.summary||"").toLowerCase().indexOf(q)!==-1;
    }).slice().sort(function(a,b){ return a.name.localeCompare(b.name); }).forEach(function(f){
      var r = ce("div","wiz-spell-row wiz-pick-row"+(lu.featName===f.name?" selected":""));
      r.innerHTML = "<div class='wiz-spell-text'><b>"+escapeHtml(f.name)+"</b>"+
        (f.prerequisite && f.prerequisite!=="None" ? "<span class='wiz-spell-meta'>Requires: "+escapeHtml(f.prerequisite)+"</span>" : "")+
        "<span class='wiz-spell-desc'>"+escapeHtml(f.summary||"")+"</span></div>";
      r.addEventListener("click", function(){
        if(lu.featName!==f.name){ lu.featName = f.name; lu.featPicks = emptyPicks(f); }
        fill(); drawNext();
        refreshProgress(); // a feat with choices adds the Feat picks step
      });
      list.appendChild(r);
    });
  }
  search.addEventListener("input", function(){ lu.featQuery = search.value; fill(); });
  fill();
  drawNext();
}

/* Feat picks: the picked feat's own picks (a half-feat's +1, Fey
   Touched's spell, Skilled's skills), on a screen of their own. */
function stepFeatPicks(container){
  var def = featDef(lu.featName);
  var card = stepCard(container, def.name,
    "<b>Your new feat:</b> "+escapeHtml(def.summary || "")+" Choose what it gives you; the sheet applies it, and undoing the level-up takes it back.");
  if(!lu.featPicks) lu.featPicks = emptyPicks(def);
  card.appendChild(renderFeatPicks(def, lu.featPicks, featCtx(), render));
}
function featCtx(){ return featPicksContext(lu.c); }
/* The +1 the chosen feat gives (Durable: CON), or null. */
function featAbilityPick(){
  return target().asi && lu.asiMode==="feat" && lu.featPicks && lu.featPicks.ability || null;
}

function conModAfterAsi(){
  var con = (Number(lu.c.abilities.con)||10) + (lu.asiMode==="asi" && target().asi ? lu.asi.con : 0);
  if(featAbilityPick()==="con") con = Math.min(20, con + 1);
  var fb = featureAbilityBonus().con;
  if(fb) con = Math.min(fb.max, con + fb.bonus);
  return mod(con);
}

/* Ability increases from features this level-up grants, as
   {ability: {bonus, max}} (Primal Champion: +4 STR and CON, max 24).
   Worked out from the target class level, so call it before finish()
   changes the class entry. */
function featureAbilityBonus(){
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

function stepHp(container){
  var t = target();
  var conMod = conModAfterAsi();
  var avg = t.hitDie/2 + 1;
  var card = stepCard(container, "Hit points",
    "<b>More health:</b> each level adds your "+escapeHtml(lu.className)+" hit die (d"+t.hitDie+") plus your Constitution modifier ("+fmtMod(conMod)+") to your max HP. "+
    "Taking the average is the safe choice; rolling can go higher or lower.");
  var grid = ce("div","lu-hp-grid");

  function hpCard(method, title, badge){
    var opt = ce("button","lu-hp-card"+(lu.hpMethod===method?" selected":""));
    opt.type = "button";
    opt.setAttribute("aria-pressed", lu.hpMethod===method ? "true" : "false");
    opt.innerHTML = "<span class='lu-hp-title'>"+escapeHtml(title)+(badge ? " <span class='lu-hp-badge'>"+escapeHtml(badge)+"</span>" : "")+"</span>";
    grid.appendChild(opt);
    return opt;
  }
  function hpLine(opt, base){
    var total = Math.max(1, base + conMod);
    var big = ce("span","lu-hp-big"); big.textContent = "+"+total+" HP";
    var math = ce("span","lu-hp-math"); math.textContent = base+" "+fmtMod(conMod)+" CON";
    opt.appendChild(big); opt.appendChild(math);
  }

  var avgOpt = hpCard("avg", "Take the average", "Safe");
  var avgDie = ce("span","lu-hp-avg-icon"); avgDie.textContent = "≈";
  avgOpt.insertBefore(avgDie, avgOpt.firstChild);
  hpLine(avgOpt, avg);
  avgOpt.addEventListener("click", function(){ if(!lu.hpRolling){ lu.hpMethod = "avg"; render(); } });

  var rollOpt = hpCard("roll", lu.hpRoll==null ? "Roll the die" : "You rolled");
  var die = ce("span","dice-token lu-hp-die"+(lu.hpJustRolled ? " settled" : ""));
  die.innerHTML = getDieSvg(t.hitDie, lu.hpRoll);
  rollOpt.insertBefore(die, rollOpt.firstChild);
  lu.hpJustRolled = false;
  if(lu.hpRoll==null){
    var hint = ce("span","lu-hp-big lu-hp-tap"); hint.textContent = "Tap to roll d"+t.hitDie;
    var fin = ce("span","lu-hp-math"); fin.textContent = "The result is final";
    rollOpt.appendChild(hint); rollOpt.appendChild(fin);
  } else {
    hpLine(rollOpt, lu.hpRoll);
  }
  rollOpt.addEventListener("click", function(){
    if(lu.hpRolling) return;
    if(lu.hpRoll!=null){ lu.hpMethod = "roll"; render(); return; }
    var result = Math.floor(Math.random()*t.hitDie)+1;
    function done(){
      lu.hpRolling = false;
      lu.hpRoll = result;
      lu.hpMethod = "roll";
      lu.hpJustRolled = true;
      logRoll("Level-up HP (d"+t.hitDie+fmtMod(conMod)+")", result+" "+fmtMod(conMod)+" = "+Math.max(1, result+conMod)+" HP");
      render();
    }
    if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){ done(); return; }
    // Tumble with random faces for a moment, then land on the result.
    lu.hpRolling = true;
    die.classList.add("rolling");
    var spin = setInterval(function(){
      die.innerHTML = getDieSvg(t.hitDie, Math.floor(Math.random()*t.hitDie)+1);
    }, 80);
    setTimeout(function(){ clearInterval(spin); if(lu) done(); }, 750);
  });

  card.appendChild(grid);
}

/* HP gained this level. Raising CON also raises HP retroactively by the
   modifier change for every level you already had. */
function hpGain(){
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
function toughGain(){
  var t = target();
  var race = raceHpPerLevel(lu.c);
  if(hasFeat(lu.c, "Tough")) return 2 + race;
  return (t.asi && lu.asiMode==="feat" && lu.featName==="Tough" ? 2 * (totalLevel(lu.c)+1) : 0) + race;
}

function stepReview(container){
  var c = lu.c;
  var t = target();
  var card = stepCard(container, "Review", "Here's what changes. Press <b>Level up!</b> to apply it. You can undo the last level-up from the sheet if you made a mistake.");
  var items = [];
  var classLine = (t.existing ? lu.className+" Lvl "+t.newLevel : "Multiclass: "+lu.className+" Lvl 1")+
    " (character level "+(totalLevel(c)+1)+")";
  if(t.needsSubclass) items.push(target().prog.subclassLabel+": "+chosenSubclass());
  if(t.fightingStyle && lu.style) items.push("Fighting style: "+lu.style);
  dueSpellChoices().forEach(function(x){ if(lu.spellChoices[x.choice.id]) items.push(x.choice.label+": "+lu.spellChoices[x.choice.id]); });
  if(stepApplicable("invocations")){
    if(pactDue() && lu.pactBoon) items.push("Pact Boon: "+lu.pactBoon+(lu.pactSpells.length ? " ("+lu.pactSpells.filter(Boolean).join(", ")+")" : ""));
    var swapped = lu.swapOut && knownNow().find(function(e){ return e.id===lu.swapOut; });
    var fresh = lu.invPicks.slice(0, invocationSlots()).filter(Boolean);
    if(swapped && fresh.length) items.push("Invocation swap: "+swapped.name+" → "+fresh[fresh.length-1]);
    var added = swapped ? fresh.slice(0, -1) : fresh;
    if(added.length) items.push("New invocation"+(added.length>1 ? "s" : "")+": "+added.join(", "));
  }
  if(stepApplicable("options")) optionPlans().forEach(function(plan){
    var choice = optChoice(plan.set.id), n = planSlots(plan, t.existing, choice);
    var fresh = choice.picks.slice(0, n).filter(Boolean);
    var swapped = n > plan.fresh && knownOptions(t.existing, plan.set.id).find(function(e){ return e.id===choice.swapOut; });
    if(swapped && fresh.length) items.push(plan.set.label+" swap: "+swapped.name+" → "+fresh[fresh.length-1]);
    var added = swapped ? fresh.slice(0, -1) : fresh;
    if(added.length) items.push("New "+(added.length>1 ? plan.set.noun+"s" : plan.set.noun)+": "+added.join(", "));
  });
  if(t.asi){
    if(lu.asiMode==="feat"){
      var picked = featPicksSummary(featDef(lu.featName), lu.featPicks);
      items.push("Feat: "+lu.featName+(picked ? " ("+picked+")" : ""));
    }
    else items.push(ABILITIES.filter(function(a){ return lu.asi[a[0]]; }).map(function(a){ return a[1]+" +"+lu.asi[a[0]]; }).join(", "));
  }
  items.push("Max HP +"+(hpGain()+toughGain()));
  var newPb = Math.floor(totalLevel(c)/4)+2;
  if(newPb!==profBonus(c)) items.push("Proficiency bonus "+fmtMod(profBonus(c))+" → "+fmtMod(newPb));
  var ul = document.createElement("ul"); ul.className = "lu-review-list";
  var classLi = document.createElement("li"); classLi.textContent = classLine; ul.appendChild(classLi);
  items.forEach(function(txt){ var li = document.createElement("li"); li.textContent = txt; ul.appendChild(li); });
  card.appendChild(ul);
  var gains = gainLabels(lu.className, t.existing && t.existing.subclass || chosenSubclass(), t.newLevel)
    .filter(function(l){ return l.indexOf("Choose ")!==0 && l!=="Ability Score Improvement"; });
  if(gains.length){
    var p = ce("p","lu-note");
    p.textContent = "New features: "+gains.join(", ");
    card.appendChild(p);
  }
}

/* ---------------- Apply & undo ---------------- */
function slotSnapshot(c){
  var s = {};
  for(var i=1;i<=9;i++) s[i] = c.spellcasting.slots[i].max;
  return s;
}

/* Recompute slot maximums from the class levels, keeping used counts and
   any slots added or removed by hand on the Spells tab (s.extra). */
export function applySpellSlots(c){
  // A character with no spellcasting class keeps whatever slots were typed
  // in by hand (magic items, homebrew); only casters get recalculated.
  if(!c.classes.some(function(cl){ return classCasterType(cl); })) return;
  var res = computeSpellSlots(c.classes);
  for(var i=1;i<=9;i++){
    var s = c.spellcasting.slots[i];
    s.max = Math.max(0, res.slots[i] + (Number(s.extra)||0));
    s.used = clamp(s.used||0, 0, s.max);
  }
  if(res.pact){
    var prev = c.spellcasting.pact;
    c.spellcasting.pact = {max:res.pact.max, slotLevel:res.pact.slotLevel, used: prev ? clamp(prev.used||0, 0, res.pact.max) : 0};
  } else {
    c.spellcasting.pact = null;
  }
}

function hadAnyCasting(slots, pact){
  return !!pact || Object.keys(slots).some(function(k){ return slots[k]>0; });
}

function finish(){
  var c = lu.c;
  var t = target();
  var subName = t.needsSubclass ? chosenSubclass() : null;
  var dueChoices = dueSpellChoices();
  // Asked before the class entry's level changes (target() reads it).
  var doInvocations = stepApplicable("invocations");
  var optPlans = stepApplicable("options") ? optionPlans() : [];
  var gain = hpGain();
  var featureBonus = featureAbilityBonus();
  var before = {total: totalLevel(c), pb: profBonus(c), slots: slotSnapshot(c), pact: c.spellcasting.pact ? JSON.parse(JSON.stringify(c.spellcasting.pact)) : null,
    hpMax: maxHp(c), speed: computeSpeed(c).value};
  var record = {
    className: lu.className, isNewClass: !t.existing, prevSubclass: t.existing ? (t.existing.subclass||"") : "",
    hpGain: gain, speedGain: 0, asi: null, featId: null, unlockIds: [],
    prevSpellcasting: {ability: c.spellcasting.ability, slots: before.slots, pact: before.pact}
  };

  var feat = null;
  if(t.asi && lu.asiMode==="feat"){
    var f = FEATS_CATALOG.find(function(x){ return x.name===lu.featName; });
    feat = {id: uid(), name: f.name, prerequisite: f.prerequisite, category: f.category, summary: f.summary, description: f.description, source: f.custom ? "Custom" : "SRD"};
    if(f.custom) feat.homebrewId = f.id; // linked to the Compendium entry
    c.feats.push(feat);
    if(lu.featPicks) applyFeatPicks(c, feat, lu.featPicks);
    record.featId = feat.id;
  } else if(t.asi){
    record.asi = {};
    ABILITIES.forEach(function(a){
      if(!lu.asi[a[0]]) return;
      var was = Number(c.abilities[a[0]])||10;
      c.abilities[a[0]] = Math.min(20, was + lu.asi[a[0]]);
      // Record what was actually added (after the 20 cap) so undo is exact.
      if(c.abilities[a[0]] !== was) record.asi[a[0]] = c.abilities[a[0]] - was;
    });
  }

  var entry = t.existing;
  if(entry) entry.level = t.newLevel;
  else { entry = {name: lu.className, subclass: "", level: 1}; c.classes.push(entry); }
  if(subName) entry.subclass = subName;
  // Spell choices made on this level-up; undo clears them again.
  dueChoices.forEach(function(x){
    var v = lu.spellChoices[x.choice.id];
    if(!v) return;
    entry.spellChoices = entry.spellChoices || {};
    entry.spellChoices[x.choice.id] = v;
    (record.spellChoiceIds = record.spellChoiceIds || []).push(x.choice.id);
  });

  // Pact Boon and invocations; undo takes back exactly these.
  var invGained = [];
  if(doInvocations){
    var invApplied = applyLevelUpChoices(c, entry, t.newLevel, invChoice());
    record.pactBoonSet = invApplied.pactBoonSet;
    record.invAdded = invApplied.invAdded;
    record.invSwappedOut = invApplied.invSwappedOut;
    invGained = invApplied.gained;
  }
  // Class options (Metamagic, maneuvers), recorded for undo.
  if(optPlans.length){
    record.optionRecs = optPlans.map(function(plan){
      var optRec = applyPlan(c, entry, plan, optChoice(plan.set.id));
      optRec.added.forEach(function(id){
        var e = knownOptions(entry, plan.set.id).find(function(x){ return x.id===id; });
        var o = e && plan.set.options.find(function(x){ return x.name===e.name; });
        if(o) invGained.push({id:"opt_"+id, name:o.name, text:o.text, subclass:false, tag:plan.set.noun.charAt(0).toUpperCase()+plan.set.noun.slice(1)});
      });
      return optRec;
    });
  }

  // The picked style becomes a tagged feature (like a starting Fighter's),
  // so Defense/Archery apply and undo can remove it.
  var styleFeature = null;
  if(t.fightingStyle && lu.style){
    styleFeature = {id:uid(), name:"Fighting Style: "+lu.style, source:"Class", text:FIGHTING_STYLES[lu.style].text, isPassive:true, fightingStyle:lu.style};
    c.features.push(styleFeature);
    record.featureId = styleFeature.id;
  }

  // New features: whatever this class level grants, plus every subclass
  // feature up to now when the subclass was picked on this level-up.
  var gained = classFeaturesGainedAt(entry, t.newLevel);
  if(subName){
    classFeatureList(entry).forEach(function(f){
      if(f.subclass && !gained.some(function(g){ return g.id===f.id; })) gained.push(f);
    });
  }

  // Speed bonuses from class and subclass features (Fast Movement,
  // Aura of Alacrity, ...) gained on this level-up.
  gained.forEach(function(f){
    if(f.speed) record.speedGain += f.speed;
  });
  c.speed = (Number(c.speed)||30) + record.speedGain;

  // Ability increases from features (Primal Champion), recorded with the
  // ASI so the unlock popup shows them and undo takes them back off.
  Object.keys(featureBonus).forEach(function(k){
    var was = Number(c.abilities[k])||10;
    var now = Math.min(featureBonus[k].max, was + featureBonus[k].bonus);
    if(now === was) return;
    c.abilities[k] = now;
    record.asi = record.asi || {};
    record.asi[k] = (record.asi[k]||0) + (now - was);
  });

  // Current HP rises by the whole max HP change, Tough's part included;
  // the record keeps Tough's part so undo can take it back off.
  c.hp.max = (Number(c.hp.max)||0) + gain;
  var maxGain = maxHp(c) - before.hpMax;
  record.toughGain = maxGain - gain;
  c.hp.current = (Number(c.hp.current)||0) + maxGain;

  applySpellSlots(c);
  syncInfusions(c); // Enhanced Weapon / Defense become +2 at artificer 10
  var ability = classSpellAbility(entry);
  if(ability && !hadAnyCasting(before.slots, before.pact) && classCasterType(entry)) c.spellcasting.ability = ability;

  var ids = gained.map(function(f){ return f.id; });
  if(feat) ids.push("feat_"+feat.id);
  if(styleFeature){
    ids.push(styleFeature.id);
    gained.push({id:styleFeature.id, name:styleFeature.name, text:styleFeature.text, subclass:false});
  }
  ids.forEach(function(id){
    if(c.newUnlocks.indexOf(id)===-1){ c.newUnlocks.push(id); record.unlockIds.push(id); }
  });
  gained = gained.concat(invGained); // shown in the popup; they live on their own card
  c.levelHistory.push(record);

  save();
  close();
  renderAll();
  playAdd();

  showUnlocked(c, {
    className: entry.name, isNewClass: record.isNewClass, newClassLevel: t.newLevel, subclass: subName, currentSubclass: entry.subclass,
    totalBefore: before.total, pbBefore: before.pb, hpGain: maxGain, speedGain: computeSpeed(c).value - before.speed,
    features: gained, feat: feat, asi: withFeatAbility(record.asi, feat),
    slotsBefore: before.slots, pactBefore: before.pact,
    thirdCaster: classCasterType(entry)==="third"
  });
}

/* The popup's ability changes: the ASI's plus the feat's +1 (kept on the
   feat, not the record, so undo doesn't take it back twice). */
function withFeatAbility(asi, feat){
  var gained = feat && feat.applied && feat.applied.abilities;
  if(!gained || !Object.keys(gained).length) return asi;
  var out = Object.assign({}, asi||{});
  Object.keys(gained).forEach(function(k){ out[k] = (out[k]||0) + gained[k]; });
  return out;
}

export function undoLastLevelUp(c){
  var rec = c.levelHistory[c.levelHistory.length-1];
  if(!rec) return;
  var entry = c.classes.find(function(cl){ return cl.name===rec.className; });
  var label = rec.className+" "+(entry ? entry.level : "");
  confirmDialog("Undo last level-up?", "This removes "+label+" and reverts the HP, ability scores, feat, fighting style, invocations, maneuvers or Metamagic, and spell slots it gave.", function(){
    c.levelHistory.pop();
    if(entry){
      if(rec.isNewClass) c.classes.splice(c.classes.indexOf(entry), 1);
      else {
        entry.level = Math.max(1, (Number(entry.level)||1)-1); entry.subclass = rec.prevSubclass;
        (rec.spellChoiceIds||[]).forEach(function(id){ if(entry.spellChoices) delete entry.spellChoices[id]; });
        undoLevelUpChoices(c, entry, rec);
        (rec.optionRecs||[]).forEach(function(r){ undoPlan(entry, r); });
      }
    }
    if(rec.asi) Object.keys(rec.asi).forEach(function(k){ c.abilities[k] = (Number(c.abilities[k])||10) - rec.asi[k]; });
    if(rec.featId){
      var featToRevert = c.feats.find(function(f){ return f.id===rec.featId; });
      if(featToRevert) revertFeatPicks(c, featToRevert);
      c.feats = c.feats.filter(function(f){ return f.id!==rec.featId; });
    }
    if(rec.featureId) c.features = c.features.filter(function(f){ return f.id!==rec.featureId; });
    c.hp.max = Math.max(1, (Number(c.hp.max)||1) - rec.hpGain);
    // Level-up added the gain to current HP too, so take it back off, but
    // never knock a conscious character down to 0 just by undoing.
    var cur = Number(c.hp.current)||0;
    c.hp.current = clamp(cur - rec.hpGain - (rec.toughGain||0), Math.min(cur, 1), maxHp(c));
    c.speed = (Number(c.speed)||30) - (rec.speedGain||0);
    var prev = rec.prevSpellcasting;
    c.spellcasting.ability = prev.ability;
    for(var i=1;i<=9;i++){
      var s = c.spellcasting.slots[i];
      s.max = prev.slots[i]||0;
      s.used = clamp(s.used||0, 0, s.max);
    }
    // Restore the old pact slot count but keep the slots spent since.
    var pactNow = c.spellcasting.pact;
    c.spellcasting.pact = prev.pact ? {max: prev.pact.max, slotLevel: prev.pact.slotLevel,
      used: clamp(pactNow ? (pactNow.used||0) : (prev.pact.used||0), 0, prev.pact.max)} : null;
    c.newUnlocks = c.newUnlocks.filter(function(id){ return rec.unlockIds.indexOf(id)===-1; });
    syncHitDice(c);
    syncInfusions(c);
    save(); renderAll(); playDelete();
    showActionToast("Level-up undone. Back to level "+totalLevel(c)+".");
  });
}

/* ---------------- "You unlocked…" popup ----------------
   Shown right after levelling so new players see, in plain words, what
   they just gained and what (if anything) they should do next. */
function showUnlocked(c, s){
  var total = totalLevel(c);
  openInfoModal("Level "+total+" reached!", function(body){
    var hero = ce("div","lu-hero");
    hero.innerHTML = "<div class='lu-hero-level'>"+total+"</div><div class='lu-hero-text'><b>"+escapeHtml(c.name||"Your character")+"</b> is now "+
      escapeHtml(s.className)+" "+s.newClassLevel+(s.isNewClass ? " (new class!)" : "")+"</div>";
    body.appendChild(hero);

    var stats = ce("div","lu-stat-row");
    function stat(label, value){
      var d = ce("div","lu-stat"); d.innerHTML = "<span class='lbl'>"+escapeHtml(label)+"</span><span class='val'>"+escapeHtml(value)+"</span>";
      stats.appendChild(d);
    }
    stat("Max HP", "+"+s.hpGain+" (now "+maxHp(c)+")");
    if(profBonus(c)!==s.pbBefore) stat("Proficiency", fmtMod(s.pbBefore)+" → "+fmtMod(profBonus(c)));
    if(s.speedGain) stat("Speed", "+"+s.speedGain+" ft");
    if(s.asi) Object.keys(s.asi).forEach(function(k){ stat(abilityName(k), "+"+s.asi[k]+" (now "+c.abilities[k]+")"); });
    var slotChanges = [];
    for(var i=1;i<=9;i++){
      var now = c.spellcasting.slots[i].max;
      if(now>s.slotsBefore[i]) slotChanges.push(ordinal(i)+"-level ×"+now+(s.slotsBefore[i] ? " (was "+s.slotsBefore[i]+")" : " (new!)"));
    }
    if(slotChanges.length) stat("Spell slots", slotChanges.join(", "));
    var pact = c.spellcasting.pact, pb = s.pactBefore;
    if(pact && (!pb || pb.max!==pact.max || pb.slotLevel!==pact.slotLevel)) stat("Pact slots", pact.max+" × "+ordinal(pact.slotLevel)+"-level");
    body.appendChild(stats);

    if(s.subclass){
      var subP = ce("p","lu-note");
      subP.innerHTML = "You chose <b>"+escapeHtml(s.subclass)+"</b> as your "+escapeHtml(progFor(s.className).subclassLabel||"subclass")+".";
      body.appendChild(subP);
    }

    var unlocked = s.features.map(function(f){ return {name:f.name, text:f.text, tag: f.tag || (f.subclass ? (s.currentSubclass || s.subclass) : s.className), upgraded: f.upgraded}; });
    if(s.feat) unlocked.push({name:s.feat.name, text:s.feat.summary || s.feat.description, tag:"Feat"});
    if(unlocked.length){
      var h = ce("h5","info-modal-subhead"); h.textContent = "New things you unlocked";
      body.appendChild(h);
      unlocked.forEach(function(u, i){
        var card = ce("div","lu-unlock");
        card.style.animationDelay = (0.15 + i*0.12) + "s"; // cards slide in one after another
        card.innerHTML = "<div class='lu-unlock-top'><span class='lu-new-badge'>"+(u.upgraded ? "Upgraded" : "New")+"</span><b>"+escapeHtml(u.name)+"</b><span class='ff-tag source-class'>"+escapeHtml(u.tag)+"</span></div>"+
          "<div class='lu-unlock-text'>"+escapeHtml(u.text)+"</div>";
        body.appendChild(card);
      });
    }

    var tips = [];
    var spellTip = s.thirdCaster ? THIRD_CASTER_SPELL_TIPS[s.newClassLevel] : (SPELL_TIPS[s.className]||{})[s.newClassLevel];
    if(spellTip) tips.push(spellTip+" Add them on the Spells tab.");
    if(s.isNewClass){
      var m = progFor(s.className).multiclassProfs;
      if(m){
        var profs = m.armor.concat(m.weapons, m.tools);
        if(profs.length) tips.push("New proficiencies: "+profs.join(", ")+".");
        if(m.note) tips.push(m.note);
      }
    }
    // Catalog feats apply their +1 themselves (feat picks); only a custom one needs it added by hand.
    var featData = s.feat && featDef(s.feat.name);
    if(s.feat && !featHasPicks(featData) && /increase your \w+/i.test(s.feat.description||"")) tips.push("Your feat raises an ability score. Add it on the Abilities & Skills tab.");
    if(featData && (featData.grantsSpells || featData.spellPick)) tips.push("Your feat's spells are on the Spells tab, with a free cast of each on the Vitals tab.");
    if(unlocked.length) tips.push("These are marked NEW on the Features & Feats tab. Tap one to clear its badge.");
    var optTags = s.features.filter(function(f){ return f.id && f.id.indexOf("opt_")===0; });
    if(optTags.length) tips.push("Your new "+optTags[0].tag.toLowerCase()+(optTags.length>1 ? "s are listed in their" : " is listed in its")+" card on the Features & Feats tab.");
    if(s.features.some(function(f){ return f.tag==="Invocation" || f.tag==="Pact Boon"; })) tips.push("Your Pact Boon and invocations are in the Eldritch invocations card on the Features & Feats tab; their spells are on the Spells tab.");
    if(total < MAX_LEVEL) tips.push("Next level at "+XP_THRESHOLDS[total+1].toLocaleString()+" XP.");
    else tips.push("You've reached level "+MAX_LEVEL+", the highest level. Congratulations!");
    var th = ce("h5","info-modal-subhead"); th.textContent = "What to do next";
    body.appendChild(th);
    var ul = document.createElement("ul"); ul.className = "lu-tips";
    tips.forEach(function(tip){ var li = document.createElement("li"); li.textContent = tip; ul.appendChild(li); });
    body.appendChild(ul);

    var actions = ce("div","actions");
    var ok = document.createElement("button");
    ok.className = "btn primary"; ok.textContent = "Got it!";
    ok.addEventListener("click", function(){ document.getElementById("info-modal-close").click(); });
    actions.appendChild(ok);
    body.appendChild(actions);
  });
}

