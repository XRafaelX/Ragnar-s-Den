import { ABILITIES, CLASS_LIST, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, FIGHTING_STYLES } from "../data/classes.js";
import { RACES, RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";
import { ALIGNMENTS, ALIGNMENT_INFO, ALIGNMENT_INFO_FALLBACK } from "../data/alignments.js";
import { POINT_BUY_COSTS, pickNameIdeas } from "../data/misc.js";
import { SPELL_DATA, spellDataForClass } from "../data/spells.js";
import { mod, fmtMod, escapeHtml, ce, computeArmorClass } from "../core/helpers.js";
import { makeStatArrowSvg, makeDiceSvg, makeDicesSvg } from "../ui/svg-icons.js";
import { dropdownField } from "../render/sheet.js";
import { currentClassInfo, wizardState, renderWizard, abilityFullName, applyClassChoices, subclassGrants, equipmentOptionAvailable, spellPickCount } from "./wizard-core.js";
import { SUBCLASSES } from "../data/progression.js";

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

export function rollAbilityScore(){
  var rolls = [];
  for(var i=0;i<4;i++) rolls.push(1+Math.floor(Math.random()*6));
  rolls.sort(function(a,b){ return b-a; });
  return rolls[0]+rolls[1]+rolls[2];
}
export function rollSixAbilityScores(){
  var arr = [];
  for(var i=0;i<6;i++) arr.push(rollAbilityScore());
  return arr;
}

export function syncAbilitiesFromAssignment(pool){
  ABILITIES.forEach(function(a){
    var idx = wizardState.assignIdx[a[0]];
    wizardState.abilities[a[0]] = idx!=null ? pool[idx] : 10;
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
    var sel = document.createElement("select");
    sel.className = "ability-assign-select"+(usedIdx==null?" placeholder":"");
    var blank = document.createElement("option"); blank.value=""; blank.textContent="Assign score";
    sel.appendChild(blank);
    pool.forEach(function(val, pi){
      var takenBy = Object.keys(wizardState.assignIdx).find(function(k2){ return wizardState.assignIdx[k2]===pi; });
      if(takenBy && takenBy!==key) return;
      var o = document.createElement("option");
      o.value = pi; o.textContent = val;
      if(usedIdx===pi) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function(){
      wizardState.assignIdx[key] = sel.value==="" ? null : Number(sel.value);
      syncAbilitiesFromAssignment(pool);
      renderWizard();
    });
    box.appendChild(sel);
    var modDiv = document.createElement("div"); modDiv.className="mod";
    modDiv.textContent = usedIdx!=null ? fmtMod(mod(pool[usedIdx])) : "";
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
  var hint = document.createElement("p");
  hint.style.cssText = "font-size:13px;margin-bottom:10px;color:var(--text-on-parch-dim);";
  hint.textContent = "Set each score to whatever you like, from 1 to 20.";
  container.appendChild(hint);
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
  return "<b>"+escapeHtml(name)+":</b> "+(info ? info.blurb : BACKGROUND_INFO_FALLBACK);
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

  var dd = dropdownField("Race", "race", RACES, wizardState, function(){
    explain.innerHTML = raceExplainHtml(wizardState.race);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

export function wizardStepBackground(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Background</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = backgroundExplainHtml(wizardState.background);
  card.appendChild(explain);

  var dd = dropdownField("Background", "background", BACKGROUNDS, wizardState, function(){
    explain.innerHTML = backgroundExplainHtml(wizardState.background);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

export function wizardStepAlignment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose an Alignment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = alignmentExplainHtml(wizardState.alignment);
  card.appendChild(explain);

  var dd = dropdownField("Alignment", "alignment", ALIGNMENTS, wizardState, function(){
    explain.innerHTML = alignmentExplainHtml(wizardState.alignment);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

export function wizardStepAbilities(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Ability Scores</span></h3>";
  var info = currentClassInfo();
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> These six scores drive almost everything you roll. As a "+escapeHtml(wizardState.classId)+", <b>"+escapeHtml(info.primaryAbilityLabel || abilityFullName(info.primaryAbility))+"</b> matters most, so prioritize it if you can.";
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
      rollBtn.addEventListener("click", function(){
        wizardState.rolledPool = rollSixAbilityScores();
        wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
        renderWizard();
      });
      card.appendChild(rollBtn);
    } else {
      var poolP = document.createElement("p");
      poolP.style.cssText = "font-size:13px;margin:10px 0;";
      poolP.textContent = "Rolled: "+wizardState.rolledPool.join(", ");
      card.appendChild(poolP);
      wizardAssignAbilities(card, wizardState.rolledPool);
      var reroll = document.createElement("button");
      reroll.type="button"; reroll.className="btn small ghost"; reroll.style.marginTop="10px"; reroll.textContent="Reroll (Don't tell the DM!)";
      reroll.addEventListener("click", function(){
        wizardState.rolledPool = rollSixAbilityScores();
        wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
        renderWizard();
      });
      card.appendChild(reroll);
    }
  } else if(wizardState.abilityMethod==="pointbuy"){
    wizardPointBuyUI(card);
  }

  container.appendChild(card);
}

export function wizardStepSkills(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Skills & Proficiencies</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Skills add your proficiency bonus to certain checks. Your class and background each grant some. You don't pick from all 18, just the ones you're allowed.";
  card.appendChild(explain);

  var bgInfo = BACKGROUND_INFO[wizardState.background];
  if(bgInfo && bgInfo.skills && bgInfo.skills.length){
    var bgP = document.createElement("p");
    bgP.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);margin-bottom:12px;";
    bgP.innerHTML = "From your <b>"+escapeHtml(wizardState.background)+"</b> background: "+bgInfo.skills.join(", ")+" (automatic).";
    card.appendChild(bgP);
  }

  var info = currentClassInfo();
  var label = document.createElement("p");
  label.style.cssText = "font-size:13px;margin-bottom:8px;";
  label.textContent = "Choose "+info.skillChoices.count+" from your class list:";
  card.appendChild(label);

  var rows = ce("div","list-rows");
  info.skillChoices.options.forEach(function(sk){
    var row = ce("div","list-row wiz-pick-row");
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk";
    var checked = wizardState.skillChoices.indexOf(sk)!==-1;
    cb.checked = checked;
    var full = !checked && wizardState.skillChoices.length>=info.skillChoices.count;
    cb.disabled = full;
    if(full) row.classList.add("disabled");
    var name = document.createElement("span"); name.className="row-name"; name.textContent = sk;
    row.appendChild(cb); row.appendChild(name);
    rows.appendChild(row);

    // The whole row is the tap target, not just the small checkbox; matters
    // most on touchscreens. Clicking the checkbox itself already toggles it
    // (native behavior fires first), so only toggle manually when the click
    // landed elsewhere on the row.
    row.addEventListener("click", function(e){
      if(cb.disabled) return;
      if(e.target!==cb) cb.checked = !cb.checked;
      if(cb.checked){
        if(wizardState.skillChoices.length>=info.skillChoices.count){ cb.checked=false; return; }
        wizardState.skillChoices.push(sk);
      } else {
        wizardState.skillChoices = wizardState.skillChoices.filter(function(x){ return x!==sk; });
      }
      renderWizard();
    });
  });
  card.appendChild(rows);
  container.appendChild(card);
}

/* What a Rogue-style expertise pick can target: every skill the new
   character is proficient in (class picks + background) plus any tools
   the choice allows. */
export function expertiseOptions(choice){
  var bgSkills = (BACKGROUND_INFO[wizardState.background]||{}).skills||[];
  var skills = wizardState.skillChoices.concat(bgSkills.filter(function(sk){ return wizardState.skillChoices.indexOf(sk)===-1; }));
  return skills.concat(choice.tools||[]);
}

export function wizardStepChoices(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Class Features</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Some of your level 1 class features come with a choice. These shape what your "+escapeHtml(wizardState.classId)+" is best at.";
  card.appendChild(explain);

  var info = currentClassInfo();
  (info.choices||[]).forEach(function(ch){
    var title = document.createElement("p");
    title.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    title.textContent = ch.label;
    card.appendChild(title);
    if(ch.help){
      var help = document.createElement("p");
      help.style.cssText = "font-size:13px;margin:0 0 10px;";
      help.textContent = ch.help;
      card.appendChild(help);
    }
    if(ch.kind==="subclass") choiceSubclass(card, ch);
    else if(ch.kind==="fightingStyle") choiceFightingStyle(card, ch);
    else if(ch.kind==="expertise") choiceExpertise(card, ch);
  });
  container.appendChild(card);
}

var PROF_LABELS = {heavy:"heavy armor", martial:"martial weapons"};

function choiceSubclass(card, ch){
  (SUBCLASSES[wizardState.classId]||[]).forEach(function(sub){
    var grants = ch.grants && ch.grants[sub.name] || {};
    var lvl1 = ((sub.features||{})[1]||[]).map(function(f){ return f.name; });
    var extras = [];
    if(grants.profs && grants.profs.length) extras.push("Proficient with "+grants.profs.map(function(p){ return PROF_LABELS[p]||p; }).join(" and "));
    if(grants.spells && grants.spells.length) extras.push("Always prepared: "+grants.spells.join(", "));
    if(grants.expandedSpells && grants.expandedSpells.length) extras.push("Adds to your spell list: "+grants.expandedSpells.join(", "));
    var row = ce("div","wiz-equip-option");
    if(wizardState.classChoices[ch.id]===sub.name) row.classList.add("selected");
    row.innerHTML = "<div><strong>"+escapeHtml(sub.name)+"</strong><br>"+
      "<span style='font-size:12px'>"+escapeHtml(sub.blurb)+"</span><br>"+
      "<span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(["Level 1: "+lvl1.join(", ")].concat(extras).join(" · "))+"</span></div>";
    row.addEventListener("click", function(){
      wizardState.classChoices[ch.id] = sub.name;
      renderWizard();
    });
    card.appendChild(row);
  });

  // Follow-up picks some subclasses need once chosen: Knowledge Domain's
  // skills, Draconic Bloodline's dragon ancestor.
  var g = subclassGrants(currentClassInfo(), wizardState.classChoices);
  if(g.pick){
    var pickTitle = document.createElement("p");
    pickTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    pickTitle.textContent = g.pick.label;
    card.appendChild(pickTitle);
    var pickHelp = document.createElement("p");
    pickHelp.style.cssText = "font-size:13px;margin:0 0 10px;";
    pickHelp.textContent = g.pick.help;
    card.appendChild(pickHelp);
    g.pick.options.forEach(function(opt){
      var row = ce("div","wiz-equip-option");
      if(wizardState.classChoices[g.pick.id]===opt.name) row.classList.add("selected");
      row.innerHTML = "<div><strong>"+escapeHtml(opt.name)+"</strong><br><span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(opt.text)+"</span></div>";
      row.addEventListener("click", function(){
        wizardState.classChoices[g.pick.id] = opt.name;
        renderWizard();
      });
      card.appendChild(row);
    });
  }
  var bonus = g.expertise;
  if(bonus){
    var title = document.createElement("p");
    title.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    title.textContent = bonus.label;
    card.appendChild(title);
    var help = document.createElement("p");
    help.style.cssText = "font-size:13px;margin:0 0 10px;";
    help.textContent = bonus.help;
    card.appendChild(help);
    choiceExpertise(card, {id:bonus.id, count:bonus.count, fixedOptions:bonus.options});
  }
}

function choiceFightingStyle(card, ch){
  ch.options.forEach(function(name){
    var row = ce("div","wiz-equip-option");
    if(wizardState.classChoices[ch.id]===name) row.classList.add("selected");
    row.innerHTML = "<div><strong>"+escapeHtml(name)+"</strong><br><span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(FIGHTING_STYLES[name].text)+"</span></div>";
    row.addEventListener("click", function(){
      wizardState.classChoices[ch.id] = name;
      renderWizard();
    });
    card.appendChild(row);
  });
}

function choiceExpertise(card, ch){
  var allowed = ch.fixedOptions || expertiseOptions(ch);
  // Drop picks that are no longer valid (the player went back and
  // changed their skills or background).
  var picked = (wizardState.classChoices[ch.id]||[]).filter(function(x){ return allowed.indexOf(x)!==-1; });
  wizardState.classChoices[ch.id] = picked;

  var rows = ce("div","list-rows");
  allowed.forEach(function(name){
    var row = ce("div","list-row wiz-pick-row");
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk";
    var checked = picked.indexOf(name)!==-1;
    cb.checked = checked;
    var full = !checked && picked.length>=ch.count;
    cb.disabled = full;
    if(full) row.classList.add("disabled");
    var label = document.createElement("span"); label.className="row-name"; label.textContent = name;
    row.appendChild(cb); row.appendChild(label);
    rows.appendChild(row);
    row.addEventListener("click", function(e){
      if(cb.disabled) return;
      if(e.target!==cb) cb.checked = !cb.checked;
      var cur = wizardState.classChoices[ch.id];
      if(cb.checked){
        if(cur.length>=ch.count){ cb.checked=false; return; }
        cur.push(name);
      } else {
        wizardState.classChoices[ch.id] = cur.filter(function(x){ return x!==name; });
      }
      renderWizard();
    });
  });
  card.appendChild(rows);
}

/* " (Life, Tempest or War Domain)": which subclass picks unlock it. */
function requiresHint(prof){
  var info = currentClassInfo();
  var ch = (info.choices||[]).find(function(x){ return x.kind==="subclass"; });
  if(!ch) return "";
  var names = Object.keys(ch.grants||{}).filter(function(n){ return (ch.grants[n].profs||[]).indexOf(prof)!==-1; });
  if(!names.length) return "";
  var short = names.map(function(n){ return n.replace(/ Domain$/, ""); });
  var list = short.length>1 ? short.slice(0,-1).join(", ")+" or "+short[short.length-1] : short[0];
  return " ("+list+(names[0].indexOf(" Domain")!==-1 ? " Domain" : "")+")";
}

export function wizardStepEquipment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Starting Equipment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class gives you a choice of starting gear instead of buying everything piece by piece. Pick what fits how you want to fight.";
  card.appendChild(explain);

  var info = currentClassInfo();
  info.equipment.choiceGroups.forEach(function(group, gi){
    var groupTitle = document.createElement("p");
    groupTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    groupTitle.textContent = "Choice "+String.fromCharCode(65+gi);
    card.appendChild(groupTitle);
    group.options.forEach(function(opt){
      var row = ce("div","wiz-equip-option");
      var available = equipmentOptionAvailable(opt);
      // A pick that a changed subclass no longer allows is cleared.
      if(!available && wizardState.equipment[gi]===opt.key) delete wizardState.equipment[gi];
      if(wizardState.equipment[gi]===opt.key) row.classList.add("selected");
      var lockNote = available ? "" : "<br><span style='font-size:11.5px;color:var(--oxblood)'>Needs "+escapeHtml(PROF_LABELS[opt.requires]||opt.requires)+" proficiency"+escapeHtml(requiresHint(opt.requires))+"</span>";
      row.innerHTML = "<div><strong>"+escapeHtml(opt.label)+"</strong><br><span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(opt.detail||"")+"</span>"+lockNote+"</div>";
      if(!available){ row.classList.add("disabled"); row.style.opacity = ".5"; row.style.cursor = "not-allowed"; card.appendChild(row); return; }
      row.addEventListener("click", function(){
        wizardState.equipment[gi] = opt.key;
        renderWizard();
      });
      card.appendChild(row);
    });
  });

  if(info.equipment.fixed.length){
    var fixedTitle = document.createElement("p");
    fixedTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    fixedTitle.textContent = "Always included";
    card.appendChild(fixedTitle);
    var fixedP = document.createElement("p");
    fixedP.style.fontSize = "13px";
    fixedP.textContent = info.equipment.fixed.map(function(i){ return i.qty>1 ? i.qty+"× "+i.name : i.name; }).join(", ");
    card.appendChild(fixedP);
  }

  container.appendChild(card);
}

/* One pick-N-from-a-list block (cantrips or 1st-level spells). Toggling
   updates the rows in place rather than re-rendering the whole wizard, so a
   long list keeps its scroll position and the search box keeps focus. */
function spellPickSection(title, help, count, level, chosen, listClass, exclude, extra){
  var wrap = ce("div","wiz-spell-section");

  var head = ce("div","wiz-spell-head");
  var h = document.createElement("h4"); h.textContent = title;
  var counter = ce("span","wiz-spell-counter");
  head.appendChild(h); head.appendChild(counter);
  wrap.appendChild(head);

  if(help){
    var helpP = document.createElement("p");
    helpP.className = "wiz-spell-help";
    helpP.textContent = help;
    wrap.appendChild(helpP);
  }

  var search = document.createElement("input");
  search.type = "text"; search.className = "wiz-spell-search";
  search.placeholder = "Search " + title.toLowerCase() + "…";
  wrap.appendChild(search);

  var list = ce("div","wiz-spell-list");
  var data = spellDataForClass(listClass);
  // Extra spells a subclass adds to the class list (a warlock's patron).
  (extra||[]).forEach(function(name){ if(SPELL_DATA[name]) data[name] = SPELL_DATA[name]; });
  // Spells the character gets for free (domain spells, bonus cantrips) are
  // left out so a pick isn't wasted on them.
  exclude = exclude || [];
  for(var i=chosen.length-1;i>=0;i--){ if(exclude.indexOf(chosen[i])!==-1) chosen.splice(i,1); }
  var entries = Object.keys(data).filter(function(name){ return data[name].level === level && exclude.indexOf(name)===-1; }).sort().map(function(name){
    var d = data[name];
    var row = ce("div","wiz-pick-row wiz-spell-row");
    var cb = document.createElement("input"); cb.type = "checkbox"; cb.className = "chk";
    var text = ce("div","wiz-spell-text");
    var meta = ((extra||[]).indexOf(name)!==-1 ? ["Patron spell"] : []).concat([d.school, d.castingTime, d.range], d.concentration ? ["Concentration"] : [], d.ritual ? ["Ritual"] : []).join(" · ");
    text.innerHTML =
      '<span class="row-name">' + escapeHtml(name) + '</span>' +
      '<span class="wiz-spell-meta">' + escapeHtml(meta) + '</span>' +
      '<span class="wiz-spell-desc">' + escapeHtml(d.summary) + '</span>';
    row.appendChild(cb); row.appendChild(text);
    list.appendChild(row);
    return {name:name, d:d, row:row, cb:cb};
  });
  wrap.appendChild(list);

  function refresh(){
    var full = chosen.length >= count;
    counter.textContent = chosen.length + " of " + count + " chosen";
    counter.classList.toggle("complete", chosen.length === count);
    entries.forEach(function(e){
      var on = chosen.indexOf(e.name) !== -1;
      e.cb.checked = on;
      e.cb.disabled = !on && full;
      e.row.classList.toggle("selected", on);
      e.row.classList.toggle("disabled", !on && full);
    });
  }

  entries.forEach(function(e){
    e.row.addEventListener("click", function(ev){
      if(e.cb.disabled) return;
      if(ev.target !== e.cb) e.cb.checked = !e.cb.checked;
      var i = chosen.indexOf(e.name);
      if(e.cb.checked && i === -1){
        if(chosen.length >= count){ e.cb.checked = false; return; }
        chosen.push(e.name);
      } else if(!e.cb.checked && i !== -1){
        chosen.splice(i, 1);
      }
      var errBox = document.getElementById("wizard-error");
      if(errBox) errBox.classList.remove("show");
      refresh();
    });
  });

  search.addEventListener("input", function(){
    var q = search.value.toLowerCase().trim();
    entries.forEach(function(e){
      var hay = (e.name + " " + e.d.school + " " + e.d.summary).toLowerCase();
      e.row.style.display = (!q || hay.indexOf(q) !== -1) ? "" : "none";
    });
  });

  refresh();
  return wrap;
}

export function wizardStepSpells(container){
  var info = currentClassInfo();
  var sc = info.spellcasting;
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Spells</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Cantrips are spells you can cast at will, and your starting spells are your first real tools. You can always change or add more from the Spells tab once your character exists.";
  card.appendChild(explain);

  var grants = subclassGrants(info, wizardState.classChoices);
  var freebies = (grants.cantrips||[]).concat(grants.spells||[]);
  if(freebies.length){
    var free = document.createElement("p");
    free.style.cssText = "font-size:13px;margin:0 0 12px;";
    free.innerHTML = "Your <b>"+escapeHtml(wizardState.classChoices.subclass)+"</b> also gives you "+escapeHtml(freebies.join(", "))+" for free. They're added automatically and don't count toward the picks below.";
    card.appendChild(free);
  }
  // A shrinking count (e.g. lower Wisdom after going back) trims extra picks.
  var need = spellPickCount(sc);
  if(wizardState.spellChoices.spells.length > need) wizardState.spellChoices.spells.length = need;
  card.appendChild(spellPickSection("Cantrips", "", sc.cantrips, 0, wizardState.spellChoices.cantrips, sc.spellList, grants.cantrips));
  if(grants.expandedSpells){
    var exp = document.createElement("p");
    exp.style.cssText = "font-size:13px;margin:0 0 12px;";
    exp.innerHTML = "Your <b>"+escapeHtml(wizardState.classChoices.subclass)+"</b> adds "+escapeHtml(grants.expandedSpells.join(" and "))+" to the spells you can learn (marked <i>Patron spell</i>).";
    card.appendChild(exp);
  }
  card.appendChild(spellPickSection(sc.spellsLabel || "1st-level spells", sc.spellsHelp || "", need, 1, wizardState.spellChoices.spells, sc.spellList, grants.spells, grants.expandedSpells));
  container.appendChild(card);
}

export function wizardStepReview(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Review & Finish</span></h3>";

  var nameWrap = document.createElement("div");
  nameWrap.style.cssText = "margin-bottom:16px;";
  nameWrap.innerHTML = "<label style='font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-on-parch-dim);display:block;margin-bottom:3px;'>Character name <span style='color:var(--oxblood);'>*</span> required</label>";
  var nameInput = document.createElement("input");
  nameInput.id = "wiz-name-input";
  nameInput.value = wizardState.name; nameInput.placeholder = "e.g. Ragnar";
  nameInput.style.cssText = "width:100%;max-width:320px;background:transparent;border:none;border-bottom:1px solid var(--rule);color:var(--text-on-parch);font-family:var(--serif);font-size:20px;padding:4px 0;";
  nameInput.addEventListener("input", function(){
    wizardState.name = nameInput.value;
    nameInput.classList.remove("wiz-invalid");
    var errBox = document.getElementById("wizard-error");
    if(errBox) errBox.classList.remove("show");
  });
  nameWrap.appendChild(nameInput);

  var ideaWrap = ce("div","wiz-name-ideas");
  var ideaLabel = document.createElement("span");
  ideaLabel.textContent = "Need ideas? ";
  ideaWrap.appendChild(ideaLabel);
  function renderIdeaChips(){
    ideaWrap.querySelectorAll(".wiz-name-chip").forEach(function(el){ el.remove(); });
    pickNameIdeas(4).forEach(function(idea){
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "btn small ghost wiz-name-chip";
      chip.textContent = idea;
      chip.addEventListener("click", function(){
        wizardState.name = idea;
        nameInput.value = idea;
        nameInput.classList.remove("wiz-invalid");
        var errBox = document.getElementById("wizard-error");
        if(errBox) errBox.classList.remove("show");
      });
      ideaWrap.appendChild(chip);
    });
    var shuffleBtn = document.createElement("button");
    shuffleBtn.type = "button";
    shuffleBtn.className = "btn small ghost wiz-name-chip";
    shuffleBtn.innerHTML = makeDiceSvg() + "More ideas";
    shuffleBtn.addEventListener("click", renderIdeaChips);
    ideaWrap.appendChild(shuffleBtn);
  }
  renderIdeaChips();
  nameWrap.appendChild(ideaWrap);

  card.appendChild(nameWrap);

  var info = currentClassInfo();
  var conMod = mod(wizardState.abilities.con);
  var hpBonus = subclassGrants(info, wizardState.classChoices).hpPerLevel||0;
  var hp = HIT_DICE_BY_CLASS[wizardState.classId] + conMod + hpBonus;
  // Same AC math as the sheet, run on the gear and picks chosen so far.
  var preview = {
    abilities: wizardState.abilities,
    classes: [{name:wizardState.classId, level:1}],
    inventory: buildEquipmentList(info, wizardState.equipment),
    features: [], skillProfs: {}, acMisc: 0
  };
  applyClassChoices(preview, info, wizardState.classChoices);
  var ac = computeArmorClass(preview);

  var rows = ce("div","list-rows");
  function row(label, val){
    var r = ce("div","list-row");
    var l = document.createElement("span"); l.className="row-name"; l.textContent = label;
    var v = document.createElement("span"); v.style.fontWeight="600"; v.textContent = val;
    r.appendChild(l); r.appendChild(v);
    rows.appendChild(r);
  }
  row("Class", wizardState.classId+" (level 1)");
  row("Race", wizardState.race);
  row("Background", wizardState.background);
  row("Alignment", wizardState.alignment || "None");
  row("Ability scores", ABILITIES.map(function(a){ return a[1].slice(0,3).toUpperCase()+" "+wizardState.abilities[a[0]]; }).join("  "));
  row("Hit points", hp+" (d"+HIT_DICE_BY_CLASS[wizardState.classId]+" + CON "+fmtMod(conMod)+(hpBonus ? " + "+hpBonus+" "+wizardState.classChoices.subclass : "")+")");
  row("Armor Class", ac.value + " (" + ac.breakdown + ")");
  row("Saving throws", info.savingThrows.map(function(k){ return k.toUpperCase(); }).join(", "));
  var allSkills = wizardState.skillChoices.concat((BACKGROUND_INFO[wizardState.background]||{}).skills||[]);
  row("Skills", allSkills.filter(function(sk, i){ return allSkills.indexOf(sk)===i; }).join(", ") || "None");
  (info.choices||[]).forEach(function(ch){
    var v = wizardState.classChoices[ch.id];
    row(ch.label, Array.isArray(v) ? v.join(", ") : (v || "None"));
  });
  var grants = subclassGrants(info, wizardState.classChoices);
  if(grants.pick) row(grants.pick.label, wizardState.classChoices[grants.pick.id] || "None");
  if(grants.expertise) row(grants.expertise.label, (wizardState.classChoices[grants.expertise.id]||[]).join(", ") || "None");
  if(grants.spells) row("Domain spells", grants.spells.join(", ")+" (always prepared)");
  if(info.spellcasting && info.spellcasting.pact) row("Pact Magic", info.spellcasting.pact.max+" × "+info.spellcasting.pact.slotLevel+"st-level slot, back on a short rest");
  if(info.spellcasting){
    row("Cantrips", wizardState.spellChoices.cantrips.join(", ") || "None");
    row(info.spellcasting.spellsLabel || "1st-level spells", wizardState.spellChoices.spells.join(", ") || "None");
  }
  card.appendChild(rows);

  var featTitle = document.createElement("p");
  featTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
  featTitle.textContent = "Level 1 features";
  card.appendChild(featTitle);
  var sub = (SUBCLASSES[wizardState.classId]||[]).find(function(x){ return x.name===wizardState.classChoices.subclass; });
  info.features.concat(sub && sub.features && sub.features[1] || []).forEach(function(f){
    var p = document.createElement("p");
    p.style.cssText = "font-size:13px;margin:0 0 8px;";
    p.innerHTML = "<strong>"+escapeHtml(f.name)+":</strong> "+escapeHtml(f.text);
    card.appendChild(p);
  });

  container.appendChild(card);
}

/* Carries a starting-equipment entry into an inventory item, keeping the
   structured weapon/armor fields (type, damage dice, category, etc.) when
   the class data defines them so it's ready to roll/count toward AC right
   away, instead of landing as generic untyped Gear. */
function equipmentItemToInventoryItem(it, equipped){
  var item = {name:it.name, qty:it.qty, equipped:equipped, notes:it.notes||"", type: it.type||"gear"};
  if(it.type==="weapon"){
    item.damageDice = it.damageDice||"";
    item.damageType = it.damageType||"";
    item.ability = it.ability||"str";
    item.proficient = it.proficient!=null ? it.proficient : true;
    item.magicBonus = it.magicBonus||0;
  } else if(it.type==="armor"){
    item.category = it.category||"light";
    item.baseAC = it.baseAC!=null ? it.baseAC : 10;
    item.magicBonus = it.magicBonus||0;
  }
  return item;
}

export function buildEquipmentList(info, chosenKeys){
  var items = [];
  info.equipment.choiceGroups.forEach(function(group, gi){
    var opt = group.options.find(function(o){ return o.key===chosenKeys[gi]; });
    if(opt){
      opt.items.forEach(function(it){
        items.push(equipmentItemToInventoryItem(it, it.type==="weapon" || it.type==="armor"));
      });
    }
  });
  info.equipment.fixed.forEach(function(it){
    items.push(equipmentItemToInventoryItem(it, it.type==="weapon" || it.type==="armor"));
  });
  return items;
}

