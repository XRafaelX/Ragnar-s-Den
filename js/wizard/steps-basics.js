/* ---------------- Creation wizard: who the character is ----------------
   Class, race, background (with the optional campaign), alignment and
   ability scores, plus the dropdown the first steps share. */
import { ABILITIES, CLASS_LIST } from "../data/abilities-skills.js";
import { CLASSES_INFO } from "../data/classes.js";
import { RACES, RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { RACE_DATA, raceAsiText } from "../data/race-data.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";
import { ALIGNMENTS, ALIGNMENT_INFO, ALIGNMENT_INFO_FALLBACK } from "../data/alignments.js";
import { POINT_BUY_COSTS } from "../data/misc.js";
import { mod, fmtMod, escapeHtml, ce } from "../core/helpers.js";
import { makeStatArrowSvg, makeDicesSvg, makePlusSvg } from "../ui/svg-icons.js";
import { dlcShelf, campaignBookCard } from "../ui/dlc-shelf.js";
import { getDieSvg } from "../dice/dice.js";
import { playDiceRattle, playDiceLand, playAdd } from "../ui/sound.js";
import { themedPicker } from "../ui/themed-picker.js";
import { openCompendium } from "../render/compendium.js";
import { currentClassInfo, wizardState, renderWizard, abilityFullName, raceChoiceDef, raceAbilityIncreases, refreshWizardProgress } from "./wizard-core.js";
import { backgroundFeatGrant, backgroundFeatLabel, campaignLevel1Feats } from "../core/feat-picks.js";
import { CAMPAIGN_FEATS } from "../data/feats.js";

export function setAbilityMethod(method){
  wizardState.abilityMethod = method;
  wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
  wizardState.pointBuy = {str:8,dex:8,con:8,int:8,wis:8,cha:8};
  wizardState.rolledPool = null;
  // Point Buy starts every score at 8, so the character must too.
  var start = method==="pointbuy" ? 8 : 10;
  wizardState.abilities = {str:start,dex:start,con:start,int:start,wis:start,cha:start};
  renderWizard();
}

/* One 4d6-drop-lowest roll with its dice, for the roll animation. */
function rollAbilityScoreDetailed(){
  var dice = [];
  for(var i=0;i<4;i++) dice.push(1+Math.floor(Math.random()*6));
  var lowest = dice.indexOf(Math.min.apply(null, dice));
  var total = dice.reduce(function(a,b){ return a+b; }, 0) - dice[lowest];
  return {dice:dice, dropped:lowest, total:total};
}

/* Roll six scores with a little show: six rows of 4d6 tumble in place of
   the button, land one after another (the lowest die dims and is struck
   out, the total pops in), with a rattle, a knock per row and a chime at
   the end. Only then are the scores saved and the step re-rendered.
   Honors prefers-reduced-motion by landing everything at once. */
var abilityRollRunning = false;
function animateAbilityRoll(anchor){
  if(abilityRollRunning) return;
  abilityRollRunning = true;
  var session = wizardState;
  var results = [];
  for(var r=0;r<6;r++) results.push(rollAbilityScoreDetailed());
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var stage = ce("div","wiz-roll-stage");
  var caption = ce("p","wiz-roll-caption");
  caption.textContent = "Rolling 4d6 for each score, dropping the lowest die…";
  stage.appendChild(caption);
  var rows = results.map(function(res){
    var row = ce("div","wiz-roll-row");
    var dice = res.dice.map(function(){
      var tok = ce("div","dice-token wiz-roll-die"+(reduced ? "" : " rolling"));
      tok.innerHTML = getDieSvg(6, 1+Math.floor(Math.random()*6));
      row.appendChild(tok);
      return tok;
    });
    var total = ce("div","wiz-roll-total");
    total.textContent = "?";
    row.appendChild(total);
    stage.appendChild(row);
    return {row:row, dice:dice, total:total, res:res, landed:false};
  });
  anchor.replaceWith(stage);
  // On a phone the tray lands below the fold; bring it into view.
  stage.scrollIntoView({block:"nearest", behavior: reduced ? "auto" : "smooth"});
  playDiceRattle();

  // Faces flicker while tumbling.
  var flicker = setInterval(function(){
    rows.forEach(function(r){
      if(r.landed) return;
      r.dice.forEach(function(tok){ tok.innerHTML = getDieSvg(6, 1+Math.floor(Math.random()*6)); });
    });
  }, 90);

  function land(r){
    r.landed = true;
    r.dice.forEach(function(tok, i){
      tok.classList.remove("rolling");
      tok.classList.add("settled");
      tok.innerHTML = getDieSvg(6, r.res.dice[i]);
      if(i===r.res.dropped) tok.classList.add("dropped");
    });
    r.total.textContent = r.res.total;
    r.total.classList.add("show");
    if(r.res.total>=16) r.row.classList.add("high");
    else if(r.res.total<=7) r.row.classList.add("low");
    playDiceLand((r.res.total-3)/15);
  }

  var firstLand = reduced ? 0 : 650, gap = reduced ? 0 : 230;
  rows.forEach(function(r, i){ setTimeout(function(){ land(r); }, firstLand + i*gap); });
  setTimeout(function(){
    clearInterval(flicker);
    abilityRollRunning = false;
    playAdd();
    // Only apply if the player is still on this wizard's abilities step.
    if(wizardState!==session || session.step!=="abilities" || session.abilityMethod!=="roll") return;
    session.rolledPool = results.map(function(x){ return x.total; });
    session.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
    renderWizard();
  }, firstLand + 5*gap + (reduced ? 150 : 900));
}

export function syncAbilitiesFromAssignment(pool){
  ABILITIES.forEach(function(a){
    var idx = wizardState.assignIdx[a[0]];
    wizardState.abilities[a[0]] = idx!=null ? pool[idx] : 10;
  });
}

/* The pill that assigns a rolled score: a themed picker in its pill
   form, with centered numbers. "Pick" at the top clears the score. */
function scorePicker(abilityName, usedIdx, choices, onPick){
  return themedPicker({
    variant:"pill", triggerClass:"ability-assign-select"+(usedIdx==null?" placeholder":""),
    groups:{"":choices.map(function(ch){ return {value:ch.idx==null ? "__clear__" : String(ch.idx), label:ch.label, muted:ch.idx==null}; })},
    value:usedIdx==null ? "" : String(usedIdx), placeholder:"Pick", ariaLabel:abilityName+" score", search:false,
    onPick:function(v){ onPick(v==="__clear__" ? null : Number(v)); }
  });
}

export function wizardAssignAbilities(container, pool){
  var grid = ce("div","abilities-grid");
  ABILITIES.forEach(function(a){
    var key = a[0];
    var usedIdx = wizardState.assignIdx[key];
    var box = ce("div","ability-box");
    box.style.cursor = "default";
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div>';
    // Highest first so the list reads top-down instead of in roll order;
    // scores another ability already took are left out.
    var order = pool.map(function(val, pi){ return pi; }).sort(function(x, y){ return pool[y]-pool[x] || x-y; });
    var choices = [{idx:null, label:"Pick"}];
    order.forEach(function(pi){
      var takenBy = Object.keys(wizardState.assignIdx).find(function(k2){ return wizardState.assignIdx[k2]===pi; });
      if(takenBy && takenBy!==key) return;
      choices.push({idx:pi, label:String(pool[pi])});
    });
    box.appendChild(scorePicker(a[1], usedIdx, choices, function(idx){
      wizardState.assignIdx[key] = idx;
      syncAbilitiesFromAssignment(pool);
      renderWizard();
    }));
    var modDiv = document.createElement("div"); modDiv.className="mod";
    // Unassigned boxes keep an invisible modifier line so their "Pick"
    // pill lines up with the assigned ones instead of dropping lower.
    modDiv.textContent = usedIdx!=null ? fmtMod(mod(pool[usedIdx])) : "+0";
    if(usedIdx==null) modDiv.style.visibility = "hidden";
    box.appendChild(modDiv);
    grid.appendChild(box);
  });
  container.appendChild(grid);
}

/* Six ability boxes with up/down steppers. Shared by Manual and Point
   Buy; `canUp` lets Point Buy stop at its budget. */
function abilityStepperGrid(container, get, set, min, max, canUp){
  var grid = ce("div","abilities-grid");
  ABILITIES.forEach(function(a){
    var key = a[0];
    var score = get(key);
    var box = ce("div","ability-box");
    box.style.cursor = "default";
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(mod(score))+'</div>';

    var stepper = ce("div", "stat-stepper");

    var downBtn = ce("button", "stat-arrow-btn stat-arrow-down");
    downBtn.type = "button";
    downBtn.title = "Decrease " + a[1] + " (Down arrow)";
    downBtn.setAttribute("aria-label", "Decrease " + a[1]);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = score <= min;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      set(key, score - 1);
      renderWizard();
    });

    var val = ce("span", "stat-score-val");
    val.textContent = score;

    var upBtn = ce("button", "stat-arrow-btn stat-arrow-up");
    upBtn.type = "button";
    upBtn.title = "Increase " + a[1] + " (Up arrow)";
    upBtn.setAttribute("aria-label", "Increase " + a[1]);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.disabled = score >= max || (canUp && !canUp(score));
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      set(key, score + 1);
      renderWizard();
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(val);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    grid.appendChild(box);
  });
  container.appendChild(grid);
}

/* Manual: set each score to anything from 1 to 20, no budget. For
   players copying an existing character or using their table's rules. */
export function wizardManualUI(container){
  var row = ce("div");
  row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;";
  var hint = document.createElement("p");
  hint.style.cssText = "font-size:13px;margin:0;color:var(--text-on-parch-dim);";
  hint.textContent = "Set each score to whatever you like, from 1 to 20, before your race's increases.";
  row.appendChild(hint);
  // For testing: every score straight to 20.
  var maxBtn = ce("button", "btn small ghost");
  maxBtn.type = "button"; maxBtn.textContent = "Max all";
  maxBtn.title = "Set every score to 20";
  maxBtn.style.flex = "none";
  maxBtn.addEventListener("click", function(){
    ABILITIES.forEach(function(a){ wizardState.abilities[a[0]] = 20; });
    renderWizard();
  });
  row.appendChild(maxBtn);
  container.appendChild(row);
  abilityStepperGrid(container,
    function(key){ return wizardState.abilities[key]; },
    function(key, v){ wizardState.abilities[key] = v; },
    1, 20);
}

export function wizardPointBuyUI(container){
  var totalPoints = 27;
  var spent = ABILITIES.reduce(function(sum,a){ return sum + POINT_BUY_COSTS[wizardState.pointBuy[a[0]]]; },0);
  var remaining = totalPoints - spent;
  var remainP = document.createElement("p");
  remainP.style.cssText = "font-size:13px;margin-bottom:10px;color:var(--text-on-parch-dim);";
  remainP.innerHTML = "Points remaining: <strong style='color:var(--text-on-parch)'>"+remaining+"</strong> / "+totalPoints;
  container.appendChild(remainP);

  abilityStepperGrid(container,
    function(key){ return wizardState.pointBuy[key]; },
    function(key, v){ wizardState.pointBuy[key] = v; wizardState.abilities[key] = v; },
    8, 15,
    function(score){
      var nextCost = POINT_BUY_COSTS[score + 1];
      return nextCost !== undefined && (nextCost - POINT_BUY_COSTS[score]) <= remaining;
    });
}

export function raceExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Race affects your ability score bonuses and grants special traits like darkvision or resistances. Pick one to see what it does.";
  return "<b>"+escapeHtml(name)+":</b> "+(RACE_TRAITS[name] || RACE_TRAIT_FALLBACK);
}

export function backgroundExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Your background grants two skill proficiencies (and usually a tool or language) that reflect your life before adventuring.";
  var info = BACKGROUND_INFO[name];
  // A background that gives a feat says so (and which choice the book makes for it).
  var grant = backgroundFeatGrant(name);
  var feat = !grant ? "" : grant.choices ? " <b>Feat:</b> "+escapeHtml(backgroundFeatLabel(name))+", picked on a later step."
    : " <b>Feat:</b> "+escapeHtml(backgroundFeatLabel(name))+". "+escapeHtml(grant.def.summary);
  // No feat of its own: the campaign's, when one is set below.
  var camp = wizardState && campaignLevel1Feats(wizardState.campaign, name);
  if(!grant && camp && camp.length) feat = " <b>Campaign feat:</b> "+escapeHtml(camp.join(" or "))+", picked on a later step.";
  return "<b>"+escapeHtml(name)+":</b> "+(info ? info.blurb : BACKGROUND_INFO_FALLBACK)+feat;
}

export function alignmentExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Alignment describes your character's moral compass and attitude toward society, order, and other creatures.";
  var info = ALIGNMENT_INFO[name];
  return "<b>"+escapeHtml(name)+":</b> "+escapeHtml(info || ALIGNMENT_INFO_FALLBACK);
}

export function wizardStepClass(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Class</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class is the biggest driver of how your character plays. It sets your main ability score, hit points, and what you're good at in and out of combat.";
  card.appendChild(explain);

  var grid = ce("div","class-pick-grid");
  CLASS_LIST.forEach(function(name){
    var info = CLASSES_INFO[name];
    var box = ce("div","class-pick-card"+(info.available?"":" disabled"));
    if(wizardState.classId===name) box.classList.add("selected");
    box.innerHTML = "<h4>"+escapeHtml(name)+"</h4><p>"+escapeHtml(info.blurb)+"</p>"+(info.available?"":"<span class='soon'>Coming soon</span>");
    if(info.available){
      box.addEventListener("click", function(){ wizardState.classId = name; renderWizard(); });
    }
    grid.appendChild(box);
  });
  card.appendChild(grid);
  container.appendChild(card);
}

export function wizardStepRace(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Race</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = raceExplainHtml(wizardState.race);
  card.appendChild(explain);

  // Race Traits picks belong to one race: a different race starts fresh.
  var shownRace = wizardState.race;
  var dd = wizardDropdown("Race", "race", RACES, wizardState, function(){
    explain.innerHTML = raceExplainHtml(wizardState.race);
    if(wizardState.race!==shownRace){
      var rc = wizardState.raceChoices;
      rc.abilities = []; rc.alt = false; rc.preset = ""; rc.profPicks = {}; rc.feat = ""; rc.featPicks = null;
      shownRace = wizardState.race;
    }
  }, "race");
  dd.firstChild.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

export function wizardStepBackground(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Background</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = backgroundExplainHtml(wizardState.background);
  card.appendChild(explain);

  // The campaign row's outcome line depends on the background too.
  var campaign = campaignNote(function(){ explain.innerHTML = backgroundExplainHtml(wizardState.background); });
  var shownBackground = wizardState.background;
  var dd = wizardDropdown("Background", "background", BACKGROUNDS, wizardState, function(){
    explain.innerHTML = backgroundExplainHtml(wizardState.background);
    // Tool picks belong to one background: a different one starts fresh.
    if(wizardState.background!==shownBackground){ wizardState.bgPicks = {}; wizardState.bgGear = {}; shownBackground = wizardState.background; }
    campaign.refresh();
  }, "background");
  dd.firstChild.style.maxWidth = "320px";
  card.appendChild(dd);
  card.appendChild(campaign.el);
  container.appendChild(card);
}

/* What the chosen campaign book gives this character, for the line under
   its picker: "" with no campaign set. */
function campaignOutcomeHtml(){
  var camp = CAMPAIGN_FEATS[wizardState.campaign], bg = wizardState.background;
  if(!camp) return "";
  var later = camp.level4 ? " You'll also pick another feat when you reach level 4." : "";
  if(!bg) return "Choose a background above to see what this gives you."+later;
  var own = backgroundFeatGrant(bg);
  if(own) return "Your "+escapeHtml(bg)+" background already comes with its own feat (<b>"+escapeHtml(backgroundFeatLabel(bg))+"</b>), so this adds nothing now."+later;
  var names = campaignLevel1Feats(wizardState.campaign, bg).map(function(n){ return "<b>"+escapeHtml(n)+"</b>"; });
  return "You get a free feat: "+names.join(" or ")+". You'll choose on a later step."+later;
}

/* Campaign books (optional): the books whose campaigns give every
   character a feat at level 1. Off unless picked; the DM decides. A
   "DLC" tile that slides open onto one card per book (tap one to use
   it, tap it again to stop), with a line saying what the pick gives
   this character (see js/ui/dlc-shelf.js). It starts open when a book
   is already picked. Returns {el, refresh}. */
function campaignNote(onChange){
  var keys = Object.keys(CAMPAIGN_FEATS);
  var shelf = dlcShelf({
    id: "wiz-dlc-panel", title: "Campaign books", open: !!wizardState.campaign,
    lead: "These books give every character a free feat. Turn one on only if your DM is running it. You can change this later on the Information tab.",
    sub: function(){
      var on = wizardState.campaign;
      return on ? "Using "+CAMPAIGN_FEATS[on].label : "Playing "+keys.join(" or ")+"? Their bonus feats are in here.";
    },
    cards: keys.map(campaignBookCard),
    isOn: function(k){ return wizardState.campaign===k; },
    onTap: function(k){
      wizardState.campaign = wizardState.campaign===k ? "" : k;
      onChange();
      refreshWizardProgress(); // the campaign's feat adds a step
    },
    outcome: campaignOutcomeHtml
  });
  return {el: shelf.el, refresh: function(){ shelf.refresh(); }};
}
export function wizardStepAlignment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose an Alignment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = alignmentExplainHtml(wizardState.alignment);
  card.appendChild(explain);

  var dd = wizardDropdown("Alignment", "alignment", ALIGNMENTS, wizardState, function(){
    explain.innerHTML = alignmentExplainHtml(wizardState.alignment);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

/* What the race adds on top of these scores, for the Ability Scores step. */
function raceBonusNote(){
  var race = RACE_DATA[wizardState.race], def = raceChoiceDef();
  var picks = def && (def.abilityBonus || def.abilityPreset);
  var fixed = Object.keys(raceAbilityIncreases({fixedOnly:true})).length;
  if(!race || (!fixed && !picks)) return "";
  return " As a "+escapeHtml(wizardState.race)+" you also get <b>"+escapeHtml(raceAsiText(race))+"</b>"+
    (picks ? ", picked on the Race Traits step" : ", added for you")+". Enter your scores before that.";
}

export function wizardStepAbilities(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Ability Scores</span></h3>";
  var info = currentClassInfo();
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> These six scores drive almost everything you roll. As a "+escapeHtml(wizardState.classId)+", <b>"+escapeHtml(info.primaryAbilityLabel || abilityFullName(info.primaryAbility))+"</b> matters most, so prioritize it if you can."+
    raceBonusNote();
  card.appendChild(explain);

  var methodRow = ce("div","wiz-method-row");
  [
    ["manual","Manual","Set each score to whatever you want. Good for copying an existing character."],
    ["pointbuy","Point Buy","Spend 27 points to customize scores from 8 to 15. Most flexible."],
    ["roll","Roll","Roll 4d6 (drop lowest) six times. Random, can be stronger or weaker."]
  ].forEach(function(m){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn wiz-method-btn"+(wizardState.abilityMethod===m[0]?" primary":"");
    btn.innerHTML = "<strong>"+m[1]+"</strong><br><span style='font-size:11px;opacity:.8;'>"+m[2]+"</span>";
    btn.addEventListener("click", function(){ setAbilityMethod(m[0]); });
    methodRow.appendChild(btn);
  });
  card.appendChild(methodRow);

  if(wizardState.abilityMethod==="manual"){
    wizardManualUI(card);
  } else if(wizardState.abilityMethod==="roll"){
    if(!wizardState.rolledPool){
      var rollBtn = document.createElement("button");
      rollBtn.type="button"; rollBtn.className="btn primary small"; rollBtn.innerHTML=makeDicesSvg()+"Roll 6 scores";
      rollBtn.addEventListener("click", function(){ animateAbilityRoll(rollBtn); });
      card.appendChild(rollBtn);
    } else {
      // Everything about the current roll lives in one block, so a reroll
      // swaps all of it for the dice tray (not just the button, which left
      // the old scores showing above the new roll).
      var rollArea = ce("div","wiz-roll-results");
      var poolP = document.createElement("p");
      poolP.style.cssText = "font-size:13px;margin:10px 0;";
      poolP.textContent = "Rolled: "+wizardState.rolledPool.join(", ");
      rollArea.appendChild(poolP);
      wizardAssignAbilities(rollArea, wizardState.rolledPool);
      var reroll = document.createElement("button");
      reroll.type="button"; reroll.className="btn small ghost"; reroll.style.marginTop="10px"; reroll.textContent="Reroll (Don't tell the DM!)";
      reroll.addEventListener("click", function(){ animateAbilityRoll(rollArea); });
      rollArea.appendChild(reroll);
      card.appendChild(rollArea);
    }
  } else if(wizardState.abilityMethod==="pointbuy"){
    wizardPointBuyUI(card);
  }

  container.appendChild(card);
}

/* Race, background and alignment: a labelled themed dropdown with the
   homebrew option, writing straight into wizardState[key]. */
/* Race, background and alignment: a labelled themed dropdown writing
   straight into wizardState[key]. Races and backgrounds pass
   `createKind`: instead of a free-text homebrew option they get a note
   and a button to make a proper one (traits, skills, …) in the
   Compendium, which comes back selected. */
function wizardDropdown(labelTxt, key, groups, obj, onChangeExtra, createKind){
  var f = ce("div","field");
  var l = document.createElement("label");
  l.textContent = labelTxt;
  f.appendChild(l);
  f.appendChild(themedPicker({
    key:"field:"+key, groups:groups, value:obj[key], placeholder:"Select "+labelTxt.toLowerCase(),
    ariaLabel:labelTxt, homebrew:createKind ? null : {noun:labelTxt.toLowerCase()},
    onPick:function(v){
      obj[key] = v;
      var errBox = document.getElementById("wizard-error");
      if(errBox) errBox.classList.remove("show");
      if(onChangeExtra) onChangeExtra();
    }
  }));
  if(!createKind) return f;
  var wrap = document.createElement("div");
  wrap.appendChild(f);
  var noun = labelTxt.toLowerCase();
  var note = ce("div","lu-custom-note");
  note.innerHTML = "<div><b>Playing a homebrew "+escapeHtml(noun)+"?</b> Create it in the Compendium with its "+(createKind==="race" ? "ability scores, speed and traits" : "skills, tools and feature")+". It'll appear in this list.</div>";
  var make = document.createElement("button");
  make.type = "button";
  make.className = "btn small";
  make.innerHTML = makePlusSvg()+"Create a custom "+escapeHtml(noun);
  make.addEventListener("click", function(){
    openCompendium({
      create:createKind,
      // Saved: pick it and come straight back here.
      onSaved:function(entry){ obj[key] = entry.name; document.getElementById("catalog-back").click(); },
      onClose:function(){ if(wizardState) renderWizard(); }
    });
  });
  note.appendChild(make);
  wrap.appendChild(note);
  return wrap;
}
