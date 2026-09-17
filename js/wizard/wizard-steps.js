import { ABILITIES, CLASS_LIST, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO } from "../data/classes.js";
import { RACES, RACE_TRAITS, RACE_TRAIT_FALLBACK } from "../data/races.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_INFO_FALLBACK } from "../data/backgrounds.js";
import { ALIGNMENTS, ALIGNMENT_INFO, ALIGNMENT_INFO_FALLBACK } from "../data/alignments.js";
import { POINT_BUY_COSTS, pickNameIdeas } from "../data/misc.js";
import { mod, fmtMod, escapeHtml, ce } from "../core/helpers.js";
import { makeStatArrowSvg } from "../ui/svg-icons.js";
import { dropdownField } from "../render/sheet.js";
import { currentClassInfo, wizardState, renderWizard, abilityFullName } from "./wizard-core.js";

export function setAbilityMethod(method){
  wizardState.abilityMethod = method;
  wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
  wizardState.pointBuy = {str:8,dex:8,con:8,int:8,wis:8,cha:8};
  wizardState.rolledPool = null;
  wizardState.abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
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
    modDiv.textContent = usedIdx!=null ? fmtMod(mod(pool[usedIdx])) : "—";
    box.appendChild(modDiv);
    grid.appendChild(box);
  });
  container.appendChild(grid);
}

export function wizardPointBuyUI(container){
  var totalPoints = 27;
  var spent = ABILITIES.reduce(function(sum,a){ return sum + POINT_BUY_COSTS[wizardState.pointBuy[a[0]]]; },0);
  var remaining = totalPoints - spent;
  var remainP = document.createElement("p");
  remainP.style.cssText = "font-size:13px;margin-bottom:10px;color:var(--text-on-parch-dim);";
  remainP.innerHTML = "Points remaining: <strong style='color:var(--text-on-parch)'>"+remaining+"</strong> / "+totalPoints;
  container.appendChild(remainP);

  var grid = ce("div","abilities-grid");
  ABILITIES.forEach(function(a){
    var key = a[0];
    var score = wizardState.pointBuy[key];
    var box = ce("div","ability-box");
    box.style.cursor = "default";
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(mod(score))+'</div>';

    var stepper = ce("div", "stat-stepper");

    var downBtn = ce("button", "stat-arrow-btn stat-arrow-down");
    downBtn.type = "button";
    downBtn.title = "Decrease " + a[1] + " (Down arrow)";
    downBtn.setAttribute("aria-label", "Decrease " + a[1]);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = score <= 8;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      wizardState.pointBuy[key] = score - 1;
      wizardState.abilities[key] = score - 1;
      renderWizard();
    });

    var val = ce("span", "stat-score-val");
    val.textContent = score;

    var upBtn = ce("button", "stat-arrow-btn stat-arrow-up");
    upBtn.type = "button";
    upBtn.title = "Increase " + a[1] + " (Up arrow)";
    upBtn.setAttribute("aria-label", "Increase " + a[1]);
    upBtn.innerHTML = makeStatArrowSvg("up");
    var nextCost = POINT_BUY_COSTS[score + 1];
    upBtn.disabled = score >= 15 || nextCost === undefined || (nextCost - POINT_BUY_COSTS[score]) > remaining;
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      wizardState.pointBuy[key] = score + 1;
      wizardState.abilities[key] = score + 1;
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
  explain.innerHTML = "<b>Why this matters:</b> Your class is the biggest driver of how your character plays — it sets your main ability score, hit points, and what you're good at in and out of combat.";
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
  explain.innerHTML = "<b>Why this matters:</b> These six scores drive almost everything you roll. As a "+escapeHtml(wizardState.classId)+", <b>"+abilityFullName(info.primaryAbility)+"</b> matters most — prioritize it if you can.";
  card.appendChild(explain);

  var methodRow = ce("div","wiz-method-row");
  [
    ["array","Standard Array","Fixed set: 15, 14, 13, 12, 10, 8 — simplest, balanced."],
    ["pointbuy","Point Buy","Spend 27 points to customize scores from 8–15 — most flexible."],
    ["roll","Roll","Roll 4d6 (drop lowest) six times — random, can be stronger or weaker."]
  ].forEach(function(m){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn wiz-method-btn"+(wizardState.abilityMethod===m[0]?" primary":"");
    btn.innerHTML = "<strong>"+m[1]+"</strong><br><span style='font-size:11px;opacity:.8;'>"+m[2]+"</span>";
    btn.addEventListener("click", function(){ setAbilityMethod(m[0]); });
    methodRow.appendChild(btn);
  });
  card.appendChild(methodRow);

  if(wizardState.abilityMethod==="array"){
    wizardAssignAbilities(card, [15,14,13,12,10,8]);
  } else if(wizardState.abilityMethod==="roll"){
    if(!wizardState.rolledPool){
      var rollBtn = document.createElement("button");
      rollBtn.type="button"; rollBtn.className="btn primary small"; rollBtn.textContent="🎲 Roll 6 scores";
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
  explain.innerHTML = "<b>Why this matters:</b> Skills add your proficiency bonus to certain checks. Your class and background each grant some — you don't pick from all 18, just the ones you're allowed.";
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

    // The whole row is the tap target, not just the small checkbox — matters
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

export function wizardStepEquipment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Starting Equipment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class gives you a choice of starting gear instead of buying everything piece by piece — pick what fits how you want to fight.";
  card.appendChild(explain);

  var info = currentClassInfo();
  info.equipment.choiceGroups.forEach(function(group, gi){
    var groupTitle = document.createElement("p");
    groupTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    groupTitle.textContent = "Choice "+String.fromCharCode(65+gi);
    card.appendChild(groupTitle);
    group.options.forEach(function(opt){
      var row = ce("div","wiz-equip-option");
      if(wizardState.equipment[gi]===opt.key) row.classList.add("selected");
      row.innerHTML = "<div><strong>"+escapeHtml(opt.label)+"</strong><br><span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(opt.detail||"")+"</span></div>";
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

export function wizardStepSpells(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Spells</span></h3><p style='font-size:13px;color:var(--text-on-parch-dim);'>Spellcasting setup for this class hasn't been built yet.</p>";
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
    shuffleBtn.textContent = "🎲 More ideas";
    shuffleBtn.addEventListener("click", renderIdeaChips);
    ideaWrap.appendChild(shuffleBtn);
  }
  renderIdeaChips();
  nameWrap.appendChild(ideaWrap);

  card.appendChild(nameWrap);

  var info = currentClassInfo();
  var conMod = mod(wizardState.abilities.con), dexMod = mod(wizardState.abilities.dex);
  var hp = HIT_DICE_BY_CLASS[wizardState.classId] + conMod;
  var ac = 10 + dexMod + conMod;

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
  row("Alignment", wizardState.alignment || "—");
  row("Ability scores", ABILITIES.map(function(a){ return a[1].slice(0,3).toUpperCase()+" "+wizardState.abilities[a[0]]; }).join("  "));
  row("Hit points", hp+" (d"+HIT_DICE_BY_CLASS[wizardState.classId]+" + CON "+fmtMod(conMod)+")");
  row("Armor Class", ac+" (Unarmored Defense: 10 + DEX + CON)");
  row("Saving throws", info.savingThrows.map(function(k){ return k.toUpperCase(); }).join(", "));
  row("Skills", wizardState.skillChoices.concat((BACKGROUND_INFO[wizardState.background]||{}).skills||[]).join(", ") || "—");
  card.appendChild(rows);

  var featTitle = document.createElement("p");
  featTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
  featTitle.textContent = "Level 1 features";
  card.appendChild(featTitle);
  info.features.forEach(function(f){
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
        items.push(equipmentItemToInventoryItem(it, true));
      });
    }
  });
  info.equipment.fixed.forEach(function(it){
    items.push(equipmentItemToInventoryItem(it, it.type==="weapon"));
  });
  return items;
}

