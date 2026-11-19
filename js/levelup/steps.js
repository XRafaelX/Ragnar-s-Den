/* ---------------- Level-up: the step screens ----------------
   One function per step of the dialog. Each draws its screen into the
   container it is given and writes the player's choices into `lu`. */
import { CLASS_PROGRESSION as CLASS_EDITIONS } from "../data/progression.js";
import { featOffered, usesRules2024 } from "../core/feats-2024.js";
import { ABILITIES, CLASS_LIST } from "../data/abilities-skills.js";
import { CLASSES_INFO } from "../data/classes.js";
import { FEATS_CATALOG, CAMPAIGN_FEATS } from "../data/feats.js";
import { mod, fmtMod, ce, escapeHtml, totalLevel, profBonus, ordinal, spellHeldBy, variantBase, subclassesFor, classHasEdition } from "../core/helpers.js";
import { renderSpellChoiceOptions } from "../ui/spell-choice.js";
import { invocationsKnownAt, invocationDef, pactBoonDef, invocationLabel } from "../data/invocations.js";
import { optionsKnownAt } from "../data/class-options.js";
import { availableInvocations, resolveSpellPick } from "../core/invocations.js";
import { renderPactBoonOptions, renderInvocationPicker, renderSpellPickPickers, renderHiddenNotes } from "../ui/invocation-picks.js";
import { themedPicker } from "../ui/themed-picker.js";
import { planSlots, planContext, availableOptions } from "../core/class-options.js";
import { styleFeatures, styleNeedsPicks, stylePickChoices, styleSwapsEachLevel } from "../core/fighting-styles.js";
import { renderStyleOptions, renderStylePicks } from "../ui/style-picks.js";
import { renderOptionPicker, renderTashaNote } from "../ui/option-picks.js";
import { renderClassPicks, renderVariantOptions } from "../ui/class-picks.js";
import { grantHasChoices, classPicksSummary, raceSize } from "../core/class-picks.js";
import { logRoll, getDieSvg } from "../dice/dice.js";
import { makePlusSvg } from "../ui/svg-icons.js";
import { openCompendium } from "../render/compendium.js";
import { featDef, featNeedsChoice, emptyPicks, featPicksSummary, featRequiresReason } from "../core/feat-picks.js";
import { renderFeatPicks } from "../ui/feat-picks.js";
import { fillFeatList, featListLabel } from "../ui/feat-list.js";
import { spellPickGrid } from "../ui/spell-pick-grid.js";
import { SPELL_DATA } from "../data/spells.js";
function spellLevelOf(n){ return (SPELL_DATA[n] || {}).level; }
import { lu, luEdition, styleOptions, featWho, levelUpClassNames, learnActive, onCantripStep, meetsPrereq, prereqText, target, stepApplicable, bonusFeatChoices, bonusFeatReason, optionPlans, optChoice, profGrants, profSlots, profCtx, profPicksToApply, profStepLabel, variantOffers, offerEntry, pactDue, newInvocationCount, luInvocationCtx, spellHeldNow, chosenSubclass, dueSpellChoices, learnEntry, currentLearnPlan, learnSections, asiPointsUsed, asiPointsAvailable, close, go, render, refreshProgress, stepCard, gainLabels, resetChoicesFor, availableStyles, knownManeuvers, featCtx, bonusFeatCtx, conModAfterAsi, hpGain, toughGain } from "./session.js";

/* A feat's picks redraw the step, except a spell card ticked (the cards keep their scroll and search). */
function softRender(meta){ if(!(meta && meta.soft)) render(); }

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
  // A new monk: the 2014 or the 2024 rules (see js/data/monk-2024.js).
  if(!c.classes.some(function(cl){ return cl.name===lu.className; }) && classHasEdition(lu.className, "2024")){
    var which = ce("p","lu-choice-title");
    which.textContent = "Which " + lu.className.toLowerCase() + "? Ask your DM which rules your table uses.";
    mcCard.appendChild(which);
    var whichText = CLASS_EDITIONS[lu.className].editions["2024"].which;
    [["", "2014 " + lu.className, whichText.old],
     ["2024", "2024 " + lu.className, whichText.now]].forEach(function(o){
      var opt = ce("div","wiz-equip-option"+((lu.edition||"")===o[0]?" selected":""));
      opt.innerHTML = "<b>"+escapeHtml(o[1])+"</b><div class='lu-sub-blurb'>"+escapeHtml(o[2])+"</div>";
      opt.addEventListener("click", function(){ lu.edition = o[0]; render(); });
      mcCard.appendChild(opt);
    });
  }
}

export function stepStyle(container){
  var t = target(), tasha = !!lu.c.tashaOptional || !!luEdition(), card;
  function pick(name){
    if(name!==lu.style) lu.stylePicks = {options: [], spells: []};
    lu.style = name; render();
  }
  if(t.fightingStyle){
    card = stepCard(container, t.fightingStyle.from==="Fighting Style" ? "Choose a Fighting Style" : t.fightingStyle.from,
      "<b>Your fighting style</b> is a combat specialty you " + (styleSwapsEachLevel(lu.className, luEdition()) ? "can change at any later level in this class, with Change on its feature on the Features tab" : "keep for good") + ". <b>Defense</b>, <b>Archery</b> and <b>Dueling</b> are added to your AC, attacks and damage automatically, and a few others add a sense, a maneuver or cantrips. The rest are reminders on your Features tab.");
    card.appendChild(renderStyleOptions(lu.c, styleOptions(), lu.style, tasha, pick, !!luEdition()));
    if(!availableStyles().length){
      var p = ce("p","lu-note");
      p.textContent = "You already know every style this class can pick, so there's nothing to choose.";
      card.appendChild(p);
    }
  }
  if(lu.style && styleNeedsPicks(lu.style)) card.appendChild(renderStylePicks(lu.style, lu.stylePicks, tasha, knownManeuvers(), render, "lu:style",
    function(n){ return spellHeldBy(lu.c, n); }));
}

export function stepSubclass(container){
  var t = target();
  var label = t.prog.subclassLabel || "Subclass";
  var card = stepCard(container, "Choose your "+label,
    "<b>Your "+escapeHtml(label)+"</b> is your "+escapeHtml(lu.className)+"'s specialisation. It shapes your play style and grants extra features now and at later levels. This choice is permanent, so pick the one that sounds most fun.");
  var list = subclassesFor(lu.className, luEdition());
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

/* The spell steps: Cantrips (the class's new cantrips and the free ones)
   and New spells (a pick list per other kind the class learns this
   level: spells, a third caster's any-school spell, Magical Secrets, a
   wizard's spellbook, Mystic Arcanum). Swaps are made on the sheet.
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
}

export function stepInvocations(container){
  var t = target();
  if(pactDue()){
    var pc = stepCard(container, "Choose your Pact Boon",
      "<b>Your patron's gift:</b> at warlock level 3 you choose a Pact Boon. It's yours for good, and some invocations need a particular pact. "+
      "Blade suits a warlock who fights up close, Chain gives you a clever familiar, Tome gives you extra cantrips, and Talisman helps an ally.");
    pc.appendChild(renderPactBoonOptions(lu.pactBoon, function(name){
      if(name!==lu.pactBoon) lu.pactSpells = [];
      lu.pactBoon = name; render();
    }, !!lu.c.tashaOptional));
    var boon = pactBoonDef(lu.pactBoon);
    if(boon && boon.spellPick){
      var title = ce("p","lu-choice-title");
      title.textContent = "Your Book of Shadows: choose "+boon.spellPick.count+" "+boon.spellPick.label;
      pc.appendChild(title);
      pc.appendChild(renderSpellPickPickers(boon.spellPick, lu.pactSpells, "lu:pact", render, spellHeldNow));
    }
  }

  var need = newInvocationCount();
  var total = invocationsKnownAt(t.newLevel, luEdition() || "");
  var ctx = luInvocationCtx();
  // Only invocations the warlock can take are listed; a pick that no
  // longer qualifies (the Pact Boon changed above) is cleared.
  var availableNames = availableInvocations(ctx).map(function(i){ return i.name; });
  lu.invPicks = lu.invPicks.slice(0, need).map(function(v){ return availableNames.indexOf(v)!==-1 ? v : ""; });
  var ed2024 = ctx.edition==="2024";
  var favourites = [["Agonizing Blast", "more Eldritch Blast damage"], ["Devil's Sight", "see in magical darkness"], ["Armor of Shadows", "free Mage Armor"]]
    .filter(function(f){ return availableNames.indexOf(ed2024 ? f[0] + " (2024)" : f[0])!==-1; }).slice(0, 2)
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
      // (A 2024 one names a cantrip you know: Agonizing Blast's Eldritch Blast.)
      sp.textContent = invocationLabel(inv.name)+": choose "+(inv.spellPick.known ? "the "+inv.spellPick.label : inv.spellPick.count+" "+inv.spellPick.label);
      card.appendChild(sp);
      card.appendChild(renderSpellPickPickers(resolveSpellPick(inv.spellPick, ctx, inv.name), values, "lu:invsp:"+i, render, spellHeldNow));
    }
    if(inv && inv.featPick){
      var fp = ce("p","lu-note");
      fp.textContent = "You choose its Origin feat on the Eldritch invocations card (Features tab) after the level-up.";
      card.appendChild(fp);
    }
  }
  for(var i=0;i<need;i++) picker(i, need>1 ? "New invocation "+(i+1) : "New invocation");

  var hiddenNote = renderHiddenNotes(ctx);
  if(hiddenNote) card.appendChild(hiddenNote);
}

/* Options: for each set due this level (a Battle Master's maneuvers, a
   sorcerer's Metamagic), pickers for the new ones. Only options the
   character can learn are listed. A swap is made on the set's card on
   the Features tab. */
export function stepOptions(container){
  var t = target();
  optionPlans().forEach(function(plan){
    var set = plan.set, choice = optChoice(set.id);
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
    var shown = def ? featListLabel(def, usesRules2024(c)) : "";
    nextBox.textContent = def ? (featNeedsChoice(def) ? shown+": next, you'll choose what it gives you." : shown+": nothing to choose, the sheet applies it.") : "";
    nextBox.hidden = !def;
  }
  var who = featWho();
  // A feat for another race, a higher level or after another feat is
  // greyed out at the end of the list, with why.
  function fill(){
    fillFeatList(list, {
      // (The 2024 Origin feats only for a character on the 2024 rules.)
      feats: FEATS_CATALOG.filter(function(f){ return featOffered(f, usesRules2024(c)) && (f.repeatable || !(c.feats||[]).some(function(x){ return x.name===f.name; })); }),
      query: lu.featQuery, selected: lu.featName, reason: function(f){ return featRequiresReason(f, who); }, rules2024: usesRules2024(c),
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
  card.appendChild(renderFeatPicks(def, lu.featPicks, featCtx(), softRender));
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
  card.appendChild(renderFeatPicks(def, lu.bonusFeatPicks, bonusFeatCtx(), softRender));
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
    var stylePicked = (lu.stylePicks.options||[]).concat(lu.stylePicks.spells||[]).filter(Boolean);
    items.push("Fighting style: "+lu.style+(stylePicked.length ? " ("+stylePicked.join(", ")+")" : ""));
  }
  dueSpellChoices().forEach(function(x){ if(lu.spellChoices[x.choice.id]) items.push(x.choice.label+": "+lu.spellChoices[x.choice.id]); });
  if(learnActive()){
    var lp = currentLearnPlan();
    learnSections(lp).forEach(function(s){
      var got = (lu.learnPicks[s.id]||[]).slice(0, s.count).filter(Boolean);
      if(!got.length) return;
      items.push(s.title+": "+got.join(", "));
    });
    if(lp.auto.length) items.push("Free cantrip: "+lp.auto.join(", "));
  }
  if(stepApplicable("invocations")){
    if(pactDue() && lu.pactBoon) items.push("Pact Boon: "+lu.pactBoon+(lu.pactSpells.length ? " ("+lu.pactSpells.filter(Boolean).join(", ")+")" : ""));
    var added = lu.invPicks.slice(0, newInvocationCount()).filter(Boolean);
    if(added.length) items.push("New invocation"+(added.length>1 ? "s" : "")+": "+added.map(invocationLabel).join(", "));
  }
  if(stepApplicable("options")) optionPlans().forEach(function(plan){
    var choice = optChoice(plan.set.id), n = planSlots(plan, t.existing, choice);
    var added = choice.picks.slice(0, n).filter(Boolean);
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
