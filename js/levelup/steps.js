/* ---------------- Level-up: the step screens ----------------
   One function per step of the dialog. Each draws its screen into the
   container it is given and writes the player's choices into `lu`. */
import { ABILITIES, CLASS_LIST } from "../data/abilities-skills.js";
import { CLASSES_INFO } from "../data/classes.js";
import { FEATS_CATALOG, CAMPAIGN_FEATS } from "../data/feats.js";
import { SUBCLASSES } from "../data/progression.js";
import { mod, fmtMod, ce, escapeHtml, totalLevel, profBonus, ordinal, spellHeldBy, variantBase } from "../core/helpers.js";
import { renderSpellChoiceOptions } from "../ui/spell-choice.js";
import { invocationsKnownAt, invocationDef, pactBoonDef } from "../data/invocations.js";
import { optionsKnownAt } from "../data/class-options.js";
import { availableInvocations } from "../core/invocations.js";
import { renderPactBoonOptions, renderInvocationPicker, renderSpellPickPickers, renderHiddenNotes } from "../ui/invocation-picks.js";
import { themedPicker } from "../ui/themed-picker.js";
import { planSlots, planContext, knownOptions, availableOptions } from "../core/class-options.js";
import { classStyleList, styleFeatures, styleNeedsPicks, stylePickChoices } from "../core/fighting-styles.js";
import { renderStyleOptions, renderStylePicks } from "../ui/style-picks.js";
import { renderOptionPicker, renderTashaNote } from "../ui/option-picks.js";
import { renderClassPicks, renderVariantOptions } from "../ui/class-picks.js";
import { grantHasChoices, classPicksSummary } from "../core/class-picks.js";
import { logRoll, getDieSvg } from "../dice/dice.js";
import { makePlusSvg } from "../ui/svg-icons.js";
import { openCompendium } from "../render/compendium.js";
import { featDef, featNeedsChoice, emptyPicks, featPicksSummary, featRequiresReason } from "../core/feat-picks.js";
import { renderFeatPicks } from "../ui/feat-picks.js";
import { fillFeatList } from "../ui/feat-list.js";
import { spellPickGrid } from "../ui/spell-pick-grid.js";
import { lu, learnActive, onCantripStep, meetsPrereq, prereqText, target, stepApplicable, bonusFeatChoices, bonusFeatReason, optionPlans, optChoice, profGrants, profSlots, profCtx, profPicksToApply, profStepLabel, variantOffers, offerEntry, pactDue, knownNow, newInvocationCount, invocationSlots, luInvocationCtx, spellHeldNow, chosenSubclass, dueSpellChoices, learnEntry, currentLearnPlan, learnSections, styleCantripOffer, styleSwapOffered, cantripSwapOut, cantripSwapBlocked, versatilityChoices, versatilityPicked, expertiseSwap, expertiseTargets, pactChange, asiPointsUsed, asiPointsAvailable, close, go, render, refreshProgress, stepCard, gainLabels, resetChoicesFor, availableStyles, swapOutStyle, knownManeuvers, featCtx, bonusFeatCtx, conModAfterAsi, hpGain, toughGain } from "./session.js";

export function stepClass(container){
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
    warn.textContent = "You can't multiclass yet: your "+blockers.map(function(cl){ return cl.name+" needs "+prereqText(cl.name); }).join(", and your ")+".";
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

export function stepStyle(container){
  var t = target(), tasha = !!lu.c.tashaOptional, card;
  function pick(name){
    if(name!==lu.style) lu.stylePicks = {options: [], spells: []};
    lu.style = name; render();
  }
  if(t.fightingStyle){
    card = stepCard(container, t.fightingStyle.from==="Fighting Style" ? "Choose a Fighting Style" : t.fightingStyle.from,
      "<b>Your fighting style</b> is a combat specialty you keep for good. <b>Defense</b>, <b>Archery</b> and <b>Dueling</b> are added to your AC, attacks and damage automatically, and a few others add a sense, a maneuver or cantrips. The rest are reminders on your Features tab.");
    card.appendChild(renderStyleOptions(lu.c, t.fightingStyle.options, lu.style, tasha, pick));
    if(!availableStyles().length){
      var p = ce("p","lu-note");
      p.textContent = "You already know every style this class can pick, so there's nothing to choose.";
      card.appendChild(p);
    }
  } else if(styleSwapOffered()){
    card = stepCard(container, "Fighting style",
      "<b>Martial Versatility</b> (Tasha's optional features): at this level you may replace one fighting style you know with another from the "+escapeHtml(lu.className.toLowerCase())+"'s list. Most players keep theirs.");
    var field = ce("div","field rt-field fp-field eli-field");
    var options = [{value:"", label:"Keep my fighting style", muted:true}].concat(styleFeatures(lu.c).map(function(f){ return {value:f.id, label:"Replace "+f.fightingStyle}; }));
    field.appendChild(themedPicker({
      key: "lu:styleswap", ariaLabel: "Fighting style to replace", placeholder: "Keep my fighting style", search: false,
      groups: {"": options}, value: lu.styleSwapOut,
      onPick: function(v){ lu.styleSwapOut = v; lu.style = ""; lu.stylePicks = {options: [], spells: []}; render(); }
    }));
    card.appendChild(field);
    if(lu.styleSwapOut) card.appendChild(renderStyleOptions(lu.c, classStyleList(lu.className), lu.style, tasha, pick));
  }
  if(lu.style && styleNeedsPicks(lu.style)) card.appendChild(renderStylePicks(lu.style, lu.stylePicks, tasha, knownManeuvers(), render, "lu:style",
    function(n){ return spellHeldBy(lu.c, n); }));
  // Blessed / Druidic Warrior: one of its cantrips may change each level.
  var offer = styleCantripOffer();
  if(!offer){ lu.styleCantripOut = ""; lu.styleCantripIn = ""; return; }
  var style = offer.feature.fightingStyle, list = offer.def.spellPick.list.toLowerCase();
  var help = "<b>"+escapeHtml(style)+":</b> each time you gain a "+escapeHtml(lu.className.toLowerCase())+" level you may replace one of its cantrips with another "+escapeHtml(list)+" cantrip. Most players keep theirs.";
  if(!card) card = stepCard(container, style+" cantrips", help);
  else {
    var title = ce("p","lu-choice-title"); title.textContent = style+" cantrips (optional)";
    card.appendChild(title);
    var p2 = ce("p","lu-note"); p2.innerHTML = help;
    card.appendChild(p2);
  }
  var have = offer.feature.picks.spells.filter(Boolean);
  if(have.indexOf(lu.styleCantripOut)===-1){ lu.styleCantripOut = ""; lu.styleCantripIn = ""; }
  var outField = ce("div","field rt-field fp-field eli-field");
  outField.appendChild(themedPicker({
    key: "lu:stylecantripout", ariaLabel: style+" cantrip to replace", placeholder: "Keep them both", search: false,
    groups: {"": [{value:"", label:"Keep them both", muted:true}].concat(have.map(function(n){ return {value:n, label:"Replace "+n}; }))},
    value: lu.styleCantripOut,
    onPick: function(v){ if(v!==lu.styleCantripOut) lu.styleCantripIn = ""; lu.styleCantripOut = v; render(); }
  }));
  card.appendChild(outField);
  if(!lu.styleCantripOut) return;
  var choices = stylePickChoices(style, tasha).map(function(n){ return {value: n, label: n}; });
  var inField = ce("div","field rt-field fp-field eli-field");
  var lbl = ce("p","lu-choice-title"); lbl.textContent = "Replacement for "+lu.styleCantripOut;
  card.appendChild(lbl);
  inField.appendChild(themedPicker({
    key: "lu:stylecantripin", ariaLabel: "Replacement for "+lu.styleCantripOut, placeholder: "Pick a "+list+" cantrip…", search: true,
    groups: {"": choices}, value: lu.styleCantripIn,
    reasonFor: function(n){ var held = spellHeldBy(lu.c, n); return held ? "you have it: "+held : ""; },
    onPick: function(v){ lu.styleCantripIn = v; render(); }
  }));
  card.appendChild(inField);
}

export function stepSubclass(container){
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

export function stepSpells(container){
  var card = stepCard(container, "Subclass spells",
    "<b>Pick once:</b> part of your subclass's spell list depends on this choice. You can change it later on the sheet's Spells tab.");
  dueSpellChoices().forEach(function(x){
    var title = ce("p","lu-choice-title");
    title.textContent = x.feature+": "+x.choice.label;
    card.appendChild(title);
    card.appendChild(renderSpellChoiceOptions(x.choice, lu.spellChoices[x.choice.id], function(v){ lu.spellChoices[x.choice.id] = v; render(); }, lu.className));
  });
}

/* The spell steps: Cantrips (the class's cantrips, the free ones and a
   cantrip swap) and New spells (a pick list per other kind the class
   learns this level: spells, a third caster's any-school spell, Magical
   Secrets, a wizard's spellbook, Mystic Arcanum, then the optional swap).
   Each is a pick list for the kind of spell, so a long cantrip list never
   buries the spells. */
export function stepCantrips(container){ renderLearn(container, true); }
export function stepLearn(container){ renderLearn(container, false); }
function renderLearn(container, cantripsStep){
  var plan = currentLearnPlan();
  var cls = lu.className.toLowerCase();
  var mine = plan.sections.filter(function(x){ return onCantripStep(x)===cantripsStep; });
  // The notes about the whole level go on the first of the two steps shown.
  var firstStep = cantripsStep || !stepApplicable("cantrips");
  var lead = firstStep && plan.summary ? "<b>Spells you know:</b> "+escapeHtml(plan.summary)+" " : "";
  var patron = mine.some(function(s){ return Object.keys(s.tags).some(function(n){ return s.tags[n].indexOf("Patron spell")!==-1; }); });
  var card = stepCard(container, cantripsStep ? "Cantrips" : "New spells", lead +
    (patron ? "Your patron's spells are mixed in and marked <i>Patron spell</i>. Each one you take counts as one of your spells known. " : "") +
    "Each card says what the spell does. Tap one to pick it.");
  if(plan.note && !cantripsStep){
    var note = ce("p","lu-note"); note.textContent = plan.note;
    card.appendChild(note);
  }
  if(plan.tashaNote && !cantripsStep){
    var tashaNote = ce("p","lu-note"); tashaNote.textContent = plan.tashaNote;
    card.appendChild(tashaNote);
  }
  if(plan.granted.length && firstStep){
    var free = ce("p","lu-note lu-granted-note");
    free.textContent = "This level also gives you " + plan.granted.map(function(g){ return g.name + " (from " + g.source + ")"; }).join(", ").replace(/, ([^,]*)$/, " and $1") +
      " for free, so " + (plan.granted.length>1 ? "they aren't" : "it isn't") + " in the list" + (plan.sections.length>1 ? "s" : "") + " below.";
    card.appendChild(free);
  }
  if(plan.freed.length && firstStep){
    var back = ce("p","lu-note lu-freed-note");
    var many = plan.freed.length>1;
    back.textContent = "You already know " + plan.freed.join(", ").replace(/, ([^,]*)$/, " and $1") + ", and this level gives " + (many ? "them" : "it") + " to you for free. " +
      (many ? "They no longer count" : "It no longer counts") + " against the " + cls + " spells you know, so you learn " + (many ? "others in their place." : "another in its place.");
    card.appendChild(back);
  }
  if(plan.auto.length && cantripsStep){
    var auto = ce("p","lu-note");
    auto.textContent = "You learn "+plan.auto.join(" and ")+" for free. "+(plan.auto.length>1 ? "They're" : "It's")+" added automatically.";
    card.appendChild(auto);
  }
  // A spell picked in one list is greyed out in the others.
  var grids = [];
  function grid(s){
    var g = spellPickGrid({title: s.title, help: s.help, count: s.count, names: s.names, tags: s.tags,
      chosen: lu.learnPicks[s.id] = lu.learnPicks[s.id] || [],
      taken: function(){ return Object.keys(lu.learnPicks).filter(function(id){ return id!==s.id; }).reduce(function(a, id){ return a.concat(lu.learnPicks[id]); }, []); },
      onChange: function(){ grids.forEach(function(other){ if(other!==g) other.refresh(); }); }});
    grids.push(g);
    return g;
  }
  var sections = learnSections(plan);
  mine.forEach(function(s){ card.appendChild(grid(s)); });
  if(plan.swap && !cantripsStep) renderSpellSwap();
  if(plan.cantripSwap && cantripsStep) renderCantripSwap();

  // A cantrip swap: the artificer's each level, or Tasha's Versatility
  // (Bardic and Eldritch Versatility may change something else instead).
  function renderCantripSwap(){
    var v = versatilityChoices(plan);
    var wide = v.expertise.length || v.arcanum.length || v.pact;
    var title = ce("p","lu-choice-title");
    title.textContent = wide ? v.from+" (optional)" : "Swap a cantrip (optional)";
    card.appendChild(title);
    var help = ce("p","lu-note");
    var also = v.from==="Sorcerous Versatility" ? " (or a Metamagic option instead, on the Options step)"
      : v.from==="Bardic Versatility" && v.expertise.length ? ", or move one of your Expertise skills to another skill you're proficient in"
      : v.from==="Eldritch Versatility" ? ", or replace your Pact Boon"+(v.arcanum.length ? " or a Mystic Arcanum spell (another warlock spell of the same level)" : "") : "";
    help.innerHTML = (v.from==="level"
      ? "Each time you gain an "+escapeHtml(cls)+" level"
      : "<b>"+escapeHtml(v.from)+"</b> (Tasha's optional features): at this level")+
      " you may replace one "+escapeHtml(cls)+" cantrip you know with another from the "+escapeHtml(cls)+" spell list"+escapeHtml(also)+
      (wide ? ". Only one of these. " : ". ")+"Most players keep theirs.";
    card.appendChild(help);
    var blocked = cantripSwapBlocked(plan);
    if(blocked){
      lu.versatilityPick = ""; lu.learnPicks.cantripIn = [];
      var note = ce("p","lu-note lu-cantrip-blocked");
      note.textContent = "You're using "+v.from+" on "+blocked+" this level, so no cantrip swap. Undo that on the Options step to swap a cantrip instead.";
      card.appendChild(note);
      return;
    }
    var picked = versatilityPicked(plan);
    if(!picked) lu.versatilityPick = "";
    var groups = {}, keep = [{value:"", label: wide ? "Keep everything" : "Keep them all", muted:true}];
    var cantripItems = v.cantrips.map(function(n){ return {value:"cantrip:"+n, label:"Replace "+n}; });
    if(!wide) groups[""] = keep.concat(cantripItems);
    else {
      groups[""] = keep;
      groups["Cantrips"] = cantripItems;
      if(v.expertise.length) groups["Expertise"] = v.expertise.map(function(n){ return {value:"expertise:"+n, label:"Move expertise from "+n}; });
      if(v.pact) groups["Pact Boon"] = [{value:"pact", label:"Replace "+v.pact}];
      if(v.arcanum.length) groups["Mystic Arcanum"] = v.arcanum.map(function(n){ return {value:"arcanum:"+n, label:"Replace "+n}; });
    }
    var vField = ce("div","field rt-field fp-field eli-field");
    vField.appendChild(themedPicker({
      key: "lu:cantripswap", ariaLabel: wide ? v.from+": what to change" : "Cantrip to replace", placeholder: keep[0].label, search: false,
      groups: groups, value: lu.versatilityPick,
      onPick: function(val){
        if(val!==lu.versatilityPick){ lu.learnPicks.cantripIn = []; lu.learnPicks.arcanumIn = []; lu.versatilitySkill = ""; }
        lu.versatilityPick = val; render();
      }
    }));
    card.appendChild(vField);
    var swapList = sections.find(function(s){ return s.id==="cantripIn" || s.id==="arcanumIn"; });
    if(swapList) card.appendChild(grid(swapList));
    var ex = expertiseSwap(plan);
    if(ex){
      var lbl = ce("p","lu-choice-title"); lbl.textContent = "Expertise moves to";
      card.appendChild(lbl);
      var targets = expertiseTargets();
      var sField = ce("div","field rt-field fp-field eli-field");
      sField.appendChild(themedPicker({
        key: "lu:expertiseto", ariaLabel: "Expertise moves to", placeholder: targets.length ? "Pick a skill you're proficient in…" : "No other proficient skill",
        search: false, groups: {"": targets.map(function(n){ return {value:n, label:n}; })}, value: lu.versatilitySkill,
        onPick: function(val){ lu.versatilitySkill = val; render(); }
      }));
      card.appendChild(sField);
    }
    if(picked && picked.kind==="pact"){
      var pn = ce("p","lu-note lu-pact-change-note");
      pn.textContent = "You pick the Pact Boon that replaces your "+v.pact+" on the Invocations step.";
      card.appendChild(pn);
    }
  }
  function renderSpellSwap(){
  var swapTitle = ce("p","lu-choice-title");
  swapTitle.textContent = "Swap one you know (optional)";
  card.appendChild(swapTitle);
  var swapHelp = ce("p","lu-note");
  swapHelp.textContent = "Each time you gain a "+cls+" level you may replace one "+cls+" spell you know with another of up to "+ordinal(plan.swap.maxLevel)+" level. Most players keep theirs.";
  card.appendChild(swapHelp);
  if(plan.swap.known.indexOf(lu.learnSwap)===-1) lu.learnSwap = "";
  var field = ce("div","field rt-field fp-field eli-field");
  field.appendChild(themedPicker({
    key: "lu:spellswap", ariaLabel: "Spell to replace", placeholder: "Keep them all", search: plan.swap.known.length > 8,
    groups: {"": [{value:"", label:"Keep them all", muted:true}].concat(plan.swap.known.map(function(n){ return {value:n, label:"Replace "+n}; }))},
    value: lu.learnSwap,
    onPick: function(v){ if(v!==lu.learnSwap) lu.learnPicks.swapIn = []; lu.learnSwap = v; render(); }
  }));
  card.appendChild(field);
  var swapIn = sections.find(function(s){ return s.id==="swapIn"; });
  if(swapIn) card.appendChild(grid(swapIn));
  }
}

export function stepInvocations(container){
  var t = target();
  if(pactDue()){
    var oldBoon = pactChange() ? t.existing.pactBoon : "";
    var pc = oldBoon
      ? stepCard(container, "Replace your Pact Boon",
        "<b>Eldritch Versatility</b> (Tasha's optional features): you chose to replace your <b>"+escapeHtml(oldBoon)+"</b> with another Pact Boon. "+
        "An invocation that needs your old pact has to go (swap it out below). You can still keep your pact: choose <i>Keep everything</i> on the Cantrips step.")
      : stepCard(container, "Choose your Pact Boon",
      "<b>Your patron's gift:</b> at warlock level 3 you choose a Pact Boon. It's yours for good, and some invocations need a particular pact. "+
      "Blade suits a warlock who fights up close, Chain gives you a clever familiar, Tome gives you extra cantrips, and Talisman helps an ally.");
    if(oldBoon && lu.pactBoon===oldBoon){ lu.pactBoon = ""; lu.pactSpells = []; }
    pc.appendChild(renderPactBoonOptions(lu.pactBoon, function(name){
      if(name!==lu.pactBoon) lu.pactSpells = [];
      lu.pactBoon = name; render();
    }, !!lu.c.tashaOptional, oldBoon));
    var boon = pactBoonDef(lu.pactBoon);
    if(boon && boon.spellPick){
      var title = ce("p","lu-choice-title");
      title.textContent = "Your Book of Shadows: choose "+boon.spellPick.count+" "+boon.spellPick.label;
      pc.appendChild(title);
      pc.appendChild(renderSpellPickPickers(boon.spellPick, lu.pactSpells, "lu:pact", render, spellHeldNow));
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
      card.appendChild(renderSpellPickPickers(inv.spellPick, values, "lu:invsp:"+i, render, spellHeldNow));
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
export function stepOptions(container){
  var t = target();
  optionPlans().forEach(function(plan){
    var set = plan.set, choice = optChoice(set.id);
    var known = knownOptions(t.existing, set.id);
    if(choice.swapOut && !known.some(function(e){ return e.id===choice.swapOut; })) choice.swapOut = "";
    var n = planSlots(plan, t.existing, choice);
    var ctx = planContext(lu.c, t.existing, plan, choice, t.newLevel);
    var names = availableOptions(set, ctx).map(function(o){ return o.name; });
    choice.picks = choice.picks.slice(0, n).map(function(v){ return names.indexOf(v)!==-1 ? v : ""; });
    // One-pick sets (a totem animal, a storm environment) read as a choice.
    var single = optionsKnownAt(set, 20)===1;
    var lead = single
      ? (plan.fresh ? "Choose one now. " : "")
      : plan.fresh
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
    for(var i=0;i<plan.fresh;i++) picker(i, single ? "Your "+set.noun : plan.fresh>1 ? "New "+set.noun+" "+(i+1) : "New "+set.noun);
    // Sorcerous Versatility changes one thing a level: a cantrip swapped
    // on the Cantrips step uses it.
    var cantripTaken = plan.canSwap && plan.why==="versatility" && set.id==="metamagic" && cantripSwapOut();
    if(cantripTaken){
      choice.swapOut = "";
      var used = ce("p","lu-note lu-versatility-used");
      used.textContent = "Sorcerous Versatility: you're replacing "+cantripTaken+" on the Cantrips step this level, so no Metamagic option changes. Keep that cantrip there to change one here instead.";
      card.appendChild(used);
    }
    if(plan.canSwap && !cantripTaken){
      var swapTitle = ce("p","lu-choice-title");
      swapTitle.textContent = single ? "Change your "+set.noun+" (optional)" : "Swap one you know (optional)";
      card.appendChild(swapTitle);
      var help = ce("p","lu-note");
      help.textContent = plan.why==="versatility"
        ? "Tasha's optional features let you replace one "+set.noun+" at this level. Most players keep theirs."
        : single ? "You may pick a different "+set.noun+" each time you gain a level in this class."
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
    var note = renderTashaNote(set, ctx);
    if(note) card.appendChild(note);
  });
}

/* Proficiencies: what this level's features let the player choose (a
   bard's or rogue's Expertise, a subclass's skill, tool, language or
   saving throw, the skill a second class adds), and the spells some of
   them teach (an Arcana cleric's cantrips, a wizard's Signature Spells). */
export function stepProfs(container){
  var withSpells = profStepLabel()!=="Proficiencies";
  var card = stepCard(container, profStepLabel(), withSpells
    ? "<b>Your new features come with choices.</b> Spells you pick here show on the Spells tab, skills and expertise on the Abilities & Skills tab, and tools, languages and saving throws on the Information tab. Anything you already have is greyed out."
    : "<b>New proficiencies:</b> this level lets you choose some. Skills and expertise show on the Abilities & Skills tab, and tools, languages and saving throws on the Information tab. Anything you already have is greyed out.");
  // A new ranger using Tasha's optional features may take Favored Foe or
  // Deft Explorer in place of the Player's Handbook feature.
  // Each feature is one panel (as in the creation wizard): the choice,
  // then under a rule the picks of whichever is taken.
  var grants = profGrants().filter(function(g){ return grantHasChoices(g.def); }), shown = [];
  function panel(title){
    var p = ce("div","cf-feature");
    if(title){
      var t = ce("div","cf-feature-title");
      t.textContent = title;
      p.appendChild(t);
    }
    card.appendChild(p);
    return p;
  }
  function picks(into, g, opts){
    shown.push(g.key);
    into.appendChild(renderClassPicks(g, profSlots(g.key), profCtx(g), function(meta){ if(!(meta && meta.typing)) render(); }, "lu:prof:"+g.key, opts));
  }
  variantOffers().forEach(function(v){
    var box = panel();
    var on = lu.variants[v.replaces]===v.name;
    var base = variantBase(offerEntry(), v);
    box.appendChild(renderVariantOptions(v, base, on, function(take){
      if(take) lu.variants[v.replaces] = v.name; else delete lu.variants[v.replaces];
      render();
    }, true));
    var own = grants.find(function(g){ return !g.subclass && g.level===(v.level || 1) && g.feature===(on ? v.name : v.replaces); });
    if(own) picks(box, own, {noHelp: !on});
  });
  grants.forEach(function(g){
    if(shown.indexOf(g.key)===-1) picks(panel(g.name), g);
  });
}

export function stepAsi(container){
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
    var placeable = asiPointsAvailable();
    left.textContent = "Points left: "+(placeable-asiPointsUsed())+" / "+placeable + (placeable < 2 ? " (scores can't go above 20)" : "");
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
  var who = {race: c.race, level: totalLevel(c) + 1, feats: c.feats || []};
  // A feat for another race, a higher level or after another feat is
  // greyed out at the end of the list, with why.
  function fill(){
    fillFeatList(list, {
      feats: FEATS_CATALOG.filter(function(f){ return f.repeatable || !(c.feats||[]).some(function(x){ return x.name===f.name; }); }),
      query: lu.featQuery, selected: lu.featName, reason: function(f){ return featRequiresReason(f, who); },
      open: lu.featBlockedOpen,
      onToggle: function(){ lu.featBlockedOpen = !lu.featBlockedOpen; fill(); },
      onPick: function(f){
        if(lu.featName!==f.name){ lu.featName = f.name; lu.featPicks = emptyPicks(f); }
        fill(); drawNext();
        refreshProgress(); // a feat with choices adds the Feat picks step
      }
    });
  }
  search.addEventListener("input", function(){ lu.featQuery = search.value; fill(); });
  fill();
  drawNext();
}

/* Feat picks: the picked feat's own picks (a half-feat's +1, Fey
   Touched's spell, Skilled's skills), on a screen of their own. */
export function stepFeatPicks(container){
  var def = featDef(lu.featName);
  var card = stepCard(container, def.name,
    "<b>Your new feat:</b> "+escapeHtml(def.summary || "")+" Choose what it gives you. The sheet applies it, and undoing the level-up takes it back.");
  if(!lu.featPicks) lu.featPicks = emptyPicks(def);
  card.appendChild(renderFeatPicks(def, lu.featPicks, featCtx(), render));
}
/* Campaign feat: the campaign's list as tappable cards, the ones this
   character can't take greyed out with why. */
export function stepBonusFeat(container){
  var c = lu.c, camp = CAMPAIGN_FEATS[c.campaign];
  var card = stepCard(container, "Campaign feat",
    "<b>A bonus from your "+escapeHtml(camp.label)+" campaign:</b> at level 4 every character gains one of these feats, on top of everything else this level gives. "+
    "Greyed-out ones need something your character doesn't have.");
  var box = ce("div","fs-options");
  bonusFeatChoices().forEach(function(name){
    var def = featDef(name), why = bonusFeatReason(def);
    var row = ce("div","wiz-equip-option fs-option"+(lu.bonusFeatName===name ? " selected" : "")+(why ? " disabled" : ""));
    row.setAttribute("role","button");
    row.tabIndex = why ? -1 : 0;
    row.setAttribute("aria-pressed", lu.bonusFeatName===name ? "true" : "false");
    row.innerHTML = "<div><strong>"+escapeHtml(name)+"</strong><div class='lu-sub-blurb'>"+escapeHtml(def.summary||"")+"</div>"+
      (def.prerequisite && def.prerequisite!=="None" ? "<div class='lu-sub-feats'>Requires: "+escapeHtml(def.prerequisite)+(why ? " ("+escapeHtml(why)+")" : "")+"</div>"
        : why ? "<div class='lu-sub-feats'>"+escapeHtml(why.charAt(0).toUpperCase()+why.slice(1))+".</div>" : "")+"</div>";
    function choose(){
      if(why) return;
      if(lu.bonusFeatName!==name){ lu.bonusFeatName = name; lu.bonusFeatPicks = emptyPicks(def); }
      render();
    }
    row.addEventListener("click", choose);
    row.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); choose(); } });
    box.appendChild(row);
  });
  card.appendChild(box);
}
export function stepBonusFeatPicks(container){
  var def = featDef(lu.bonusFeatName);
  var card = stepCard(container, def.name,
    "<b>Your campaign feat:</b> "+escapeHtml(def.summary || "")+" Choose what it gives you. The sheet applies it, and undoing the level-up takes it back.");
  if(!lu.bonusFeatPicks) lu.bonusFeatPicks = emptyPicks(def);
  card.appendChild(renderFeatPicks(def, lu.bonusFeatPicks, bonusFeatCtx(), render));
}
export function stepHp(container){
  var t = target();
  var conMod = conModAfterAsi();
  var avg = t.hitDie/2 + 1;
  var card = stepCard(container, "Hit points",
    "<b>More health:</b> each level adds your "+escapeHtml(lu.className)+" hit die (d"+t.hitDie+") plus your Constitution modifier ("+fmtMod(conMod)+") to your max HP. "+
    "Taking the average is the safe choice. Rolling can go higher or lower.");
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

export function stepReview(container){
  var c = lu.c;
  var t = target();
  var card = stepCard(container, "Review", "Here's what changes. Press <b>Level up!</b> to apply it. You can undo the last level-up from the sheet if you made a mistake.");
  var items = [];
  var classLine = (t.existing ? lu.className+" Lvl "+t.newLevel : "Multiclass: "+lu.className+" Lvl 1")+
    " (character level "+(totalLevel(c)+1)+")";
  if(t.needsSubclass) items.push(target().prog.subclassLabel+": "+chosenSubclass());
  if(stepApplicable("style") && lu.style){
    var swappedStyle = lu.styleSwapOut && swapOutStyle();
    var stylePicked = (lu.stylePicks.options||[]).concat(lu.stylePicks.spells||[]).filter(Boolean);
    items.push(swappedStyle ? "Fighting style swap: "+swappedStyle.fightingStyle+" → "+lu.style
      : "Fighting style: "+lu.style+(stylePicked.length ? " ("+stylePicked.join(", ")+")" : ""));
  }
  var cOffer = styleCantripOffer();
  if(cOffer && lu.styleCantripOut && lu.styleCantripIn) items.push(cOffer.feature.fightingStyle+" cantrip swap: "+lu.styleCantripOut+" → "+lu.styleCantripIn);
  dueSpellChoices().forEach(function(x){ if(lu.spellChoices[x.choice.id]) items.push(x.choice.label+": "+lu.spellChoices[x.choice.id]); });
  if(learnActive()){
    var lp = currentLearnPlan();
    learnSections(lp).forEach(function(s){
      var got = (lu.learnPicks[s.id]||[]).slice(0, s.count).filter(Boolean);
      if(!got.length) return;
      if(s.id==="swapIn") items.push("Spell swap: "+lu.learnSwap+" → "+got[0]);
      else if(s.id==="cantripIn") items.push("Cantrip swap: "+cantripSwapOut(lp)+" → "+got[0]);
      else if(s.id==="arcanumIn") items.push("Mystic Arcanum swap: "+cantripSwapOut(lp)+" → "+got[0]);
      else items.push(s.title+": "+got.join(", "));
    });
    if(lp.auto.length) items.push("Free cantrip: "+lp.auto.join(", "));
    var exs = expertiseSwap(lp);
    if(exs && exs.to) items.push("Expertise moved: "+exs.from+" → "+exs.to);
  }
  if(stepApplicable("invocations")){
    if(pactDue() && lu.pactBoon) items.push("Pact Boon: "+(pactChange() ? t.existing.pactBoon+" → " : "")+lu.pactBoon+(lu.pactSpells.length ? " ("+lu.pactSpells.filter(Boolean).join(", ")+")" : ""));
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
  // What this level's features add: given outright, or picked.
  profPicksToApply().forEach(function(x){
    var bits = (x.grant.def.skills||[]).concat((x.grant.def.expertise||[]).map(function(s){ return "expertise in "+s; }), x.grant.def.languages||[]);
    var chosen = classPicksSummary(x.grant, {slots: x.slots});
    if(chosen) bits.push(chosen);
    if(bits.length) items.push(x.grant.name+": "+bits.join(", "));
  });
  if(t.asi){
    if(lu.asiMode==="feat"){
      var picked = featPicksSummary(featDef(lu.featName), lu.featPicks);
      items.push("Feat: "+lu.featName+(picked ? " ("+picked+")" : ""));
    }
    else items.push(ABILITIES.filter(function(a){ return lu.asi[a[0]]; }).map(function(a){ return a[1]+" +"+lu.asi[a[0]]; }).join(", "));
  }
  if(stepApplicable("bonusFeat") && lu.bonusFeatName){
    var bonusPicked = featPicksSummary(featDef(lu.bonusFeatName), lu.bonusFeatPicks);
    items.push("Campaign feat: "+lu.bonusFeatName+(bonusPicked ? " ("+bonusPicked+")" : ""));
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
