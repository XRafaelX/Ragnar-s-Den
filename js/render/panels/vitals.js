import { save } from "../../core/state.js";
import { clamp, mod, fmtMod, totalLevel, hitDicePools, spendHitDie, recoverHitDice, barbarianClassEntry, barbarianRageMax, barbarianRageDamage, computeArmorClass, computeInitiative, initiativeRollMode, characterResources, resourceIsNumber, restoreResources, maxHp, fullMaxHp, hpBonuses, computeSpeed, hitDieHealing, heavyArmorMasterActive, endAllEffects, endEffect, hpMaxHalved, resistsAllDamage, raceWards, addCondition, longRestExhaustion, exhaustionLevel, wieldsMeleeWeaponOrShield } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeStatArrowSvg, makeInfoSvg, makeFlameSvg, makeDiceSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { elixirsOnLongRest, infusionsOnLongRest } from "../../core/artificer.js";
import { restoreCompanions } from "../../core/companions.js";
import { useNextCheck, magicItemsOnLongRest, endTimedBoons, coinResistances } from "../../core/magic-items.js";
import { infusionResistances } from "../../core/infusion-effects.js";
import { renderDeathSaves } from "./death-saves.js";
import { renderEffectsCard } from "./effects.js";
import { renderConditionsButton, renderConditionsStrip, longRestConditionsChoice } from "./conditions.js";
import { openPrepareSheet } from "./spells.js";
import { preparedState } from "../../core/spells-known.js";
import { flash, pipChanged, pipsRefilled, restScene, floatDelta } from "../../ui/fx.js";
import { playShortRest, playLongRest } from "../../ui/sound.js";
import { abilityScore, abilityScores } from "../../core/ability-scores.js";
import { classFeatureList } from "../../core/class-features.js";

function preparesSpells(c){ return (c.classes||[]).some(function(cl){ return preparedState(c, cl.name); }); }

/* A class resource's row as drawn now. */
function resourceRow(key){
  return document.querySelector('.res-row[data-res="'+CSS.escape(key)+'"]');
}

/* How much of each class resource is used, to see what a rest gave back. */
function resourceUse(c){
  var used = {};
  characterResources(c).forEach(function(r){ used[r.key] = r.used; });
  return used;
}

/* After a rest, every resource that came back refills its pips in turn
   (or bumps its number), one resource after another, from `startDelay` ms. */
function showRefilled(c, before, startDelay){
  var n = 0;
  characterResources(c).forEach(function(r){
    var was = before[r.key] || 0;
    if(r.max===Infinity || r.used >= was) return;
    var row = resourceRow(r.key);
    if(!row) return;
    var pips = row.querySelector(".res-pips");
    if(pips) pipsRefilled(pips, r.max - was, r.max - r.used, startDelay + n*180);
    else {
      var num = row.querySelector(".res-count b");
      flash(num, "fx-bump", startDelay + n*180);
      floatDelta(num, was - r.used, null, startDelay + n*180);
    }
    n++;
  });
}

/* ---- Vitals panel ---- */
export function renderVitalsPanel(c){
  var panel = document.createElement("div");
  // Max HP with Tough's and Dwarven Toughness's bonus; c.hp.max is the
  // part the stepper edits.
  var hpMax = maxHp(c);
  var bonusTitle = hpBonuses(c).map(function(b){ return b.name+" (+"+b.value+")"; }).join(", ");
  if(bonusTitle) bonusTitle = "Includes "+bonusTitle;

  var card = makeCard("Hit points & defense");
  // Conditions and exhaustion open from the header; what's on shows below the grid.
  card.querySelector("h3").appendChild(renderConditionsButton(c));
  var grid = document.createElement("div");
  grid.className = "vitals-grid";

  // HP box
  var hpBox = document.createElement("div");
  hpBox.className = "vital-box hp-vital-box";
  hpBox.innerHTML = '<div class="lbl">Hit Points</div>';

  // HP fill bar: set the CSS variable so the ::before pseudo-element
  // knows how wide the fill should be. Clamp to [0,100]% and flag low HP.
  var hpCur = Number(c.hp.current) || 0;
  var hpPct = hpMax > 0 ? Math.round(clamp(hpCur / hpMax, 0, 1) * 1000) / 10 : 0;
  hpBox.style.setProperty("--hp-pct", hpPct + "%");
  if(hpPct <= 30 && hpCur > 0) hpBox.classList.add("hp-low");

  var heroDisplay = document.createElement("div");
  heroDisplay.className = "hp-hero-display";

  var curSpan = document.createElement("span");
  curSpan.className = "hp-cur-num";
  curSpan.textContent = c.hp.current;

  var slashSpan = document.createElement("span");
  slashSpan.className = "hp-slash";
  slashSpan.textContent = "/";

  var maxSpan = document.createElement("span");
  maxSpan.className = "hp-max-num";
  maxSpan.textContent = hpMax;
  if(bonusTitle) maxSpan.title = bonusTitle;
  // Exhaustion 4 halves the maximum; the stepper below keeps the full one.
  if(hpMaxHalved(c)){
    maxSpan.classList.add("hp-max-halved");
    maxSpan.title = "Halved by exhaustion (full maximum " + fullMaxHp(c) + ")";
  }

  heroDisplay.appendChild(curSpan);
  heroDisplay.appendChild(slashSpan);
  heroDisplay.appendChild(maxSpan);

  if((Number(c.hp.temp)||0) > 0){
    var tempBadge = document.createElement("span");
    tempBadge.className = "hp-temp-badge";
    tempBadge.textContent = "+" + c.hp.temp + " temp";
    heroDisplay.appendChild(tempBadge);
  }
  // ---- Core damage/heal logic ----
  function applyDamage(n){
    if(n <= 0) return;
    var temp = Number(c.hp.temp) || 0;
    if(temp > 0){
      var absorbed = Math.min(temp, n);
      c.hp.temp = temp - absorbed;
      n -= absorbed;
    }
    var wasUp = (Number(c.hp.current)||0) > 0;
    c.hp.current = Math.max(0, (Number(c.hp.current)||0) - n);
    var wentDown = wasUp && c.hp.current === 0;
    // Dropping to 0 HP: unconscious (worked out from the HP) and prone.
    if(wentDown){ c.deathSaves = {success:0, fail:0}; endAllEffects(c); addCondition(c, "prone"); }
    save(); renderSidebar(); renderAll();
    flashHpNum("hp-dmg");
    if(wentDown){ var ds = document.querySelector(".death-saves"); if(ds) ds.classList.add("ds-enter"); }
  }

  function applyHeal(n){
    if(n <= 0) return;
    c.hp.current = clamp((Number(c.hp.current)||0) + n, 0, hpMax);
    save(); renderSidebar(); renderAll();
    flashHpNum("hp-heal");
  }

  function flashHpNum(cls){
    requestAnimationFrame(function(){
      var el = document.querySelector(".hp-vital-box .hp-cur-num");
      if(!el) return;
      el.classList.remove("hp-dmg", "hp-heal");
      void el.offsetWidth;
      el.classList.add(cls);
      el.addEventListener("animationend", function(){ el.classList.remove(cls); }, {once:true});
    });
  }

  hpBox.appendChild(heroDisplay);

  // ---- Quick HP buttons: ↓ (damage) · Full · ↑ (heal) ----
  var hpActionsRow = document.createElement("div");
  hpActionsRow.className = "hp-actions-row";

  var dmg1Btn = document.createElement("button");
  dmg1Btn.type = "button";
  dmg1Btn.className = "stat-arrow-btn stat-arrow-down";
  dmg1Btn.title = "Take 1 damage";
  dmg1Btn.setAttribute("aria-label", "Take 1 damage");
  dmg1Btn.innerHTML = makeStatArrowSvg("down");
  dmg1Btn.addEventListener("click", function(e){ e.stopPropagation(); applyDamage(1); });
  hpActionsRow.appendChild(dmg1Btn);

  var fullBtn = document.createElement("button");
  fullBtn.type = "button";
  fullBtn.className = "btn small quick-heal-btn hp-full-inline";
  fullBtn.textContent = "Full";
  fullBtn.title = "Restore to full HP. Resources are not restored, use Long rest for that";
  fullBtn.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.current = hpMax;
    save(); renderSidebar(); renderAll();
    flashHpNum("hp-heal");
  });
  hpActionsRow.appendChild(fullBtn);

  var heal1Btn = document.createElement("button");
  heal1Btn.type = "button";
  heal1Btn.className = "stat-arrow-btn stat-arrow-up";
  heal1Btn.title = "Heal 1 HP";
  heal1Btn.setAttribute("aria-label", "Heal 1 HP");
  heal1Btn.innerHTML = makeStatArrowSvg("up");
  heal1Btn.addEventListener("click", function(e){ e.stopPropagation(); applyHeal(1); });
  hpActionsRow.appendChild(heal1Btn);

  hpBox.appendChild(hpActionsRow);

  // Damage resistances and immunities from the race (Mountain Born, Poison
  // Immunity) and items (Resistant Armor, Duality), only when there are
  // any; where each comes from is in the tooltip. A type the character is
  // immune to isn't listed as resisted too.
  var wards = raceWards(c);
  var immuneTypes = wards.immune.map(function(r){ return r.type; });
  var resist = wards.resist.concat(infusionResistances(c), coinResistances(c).map(function(t){ return {type: t, source: "Duality"}; }))
    .filter(function(r){ return immuneTypes.indexOf(r.type.toLowerCase())===-1; });
  var resistAll = resistsAllDamage(c); // Petrified
  if(resistAll) resist = [{type: "all damage", source: resistAll}];
  // (Resistance to all damage covers the rest: the Raven Queen's blessing.)
  var toAll = resist.find(function(r){ return r.type==="all damage"; });
  if(toAll) resist = [toAll];
  var wardTip = function(list){
    return list.map(function(r){ return r.type.charAt(0).toUpperCase() + r.type.slice(1) + ": " + r.source; }).join("\n");
  };
  if(resist.length){
    var types = [];
    resist.forEach(function(r){ if(types.indexOf(r.type.toLowerCase())===-1) types.push(r.type.toLowerCase()); });
    var resistLine = document.createElement("div");
    resistLine.className = "hp-resist";
    resistLine.textContent = "Resistant to " + types.join(", ");
    resistLine.title = wardTip(resist);
    hpBox.appendChild(resistLine);
  }
  // "Immune to poison and the poisoned condition".
  var immuneConds = wards.conditionImmune.map(function(r){ return r.type; });
  if(immuneTypes.length || immuneConds.length){
    var immuneLine = document.createElement("div");
    immuneLine.className = "hp-resist";
    immuneLine.textContent = "Immune to " + [immuneTypes.join(", "), immuneConds.length ? "the " + immuneConds.join(", ") + " condition" : ""].filter(Boolean).join(" and ");
    immuneLine.title = wardTip(wards.immune.concat(wards.conditionImmune.map(function(r){ return {type: r.type + " condition", source: r.source}; })));
    hpBox.appendChild(immuneLine);
  }

  // ---- Heavy Armor Master ----
  if(heavyArmorMasterActive(c)){
    var hamRow = document.createElement("div");
    hamRow.className = "hp-amount-row";
    var hamInput = document.createElement("input");
    hamInput.type = "number"; hamInput.min = "0"; hamInput.inputMode = "numeric";
    hamInput.className = "hp-amount-input";
    hamInput.placeholder = "Damage";
    hamInput.setAttribute("aria-label", "Damage amount");
    hamRow.appendChild(hamInput);
    var hamAmount = function(){ return Math.max(0, Math.floor(Number(hamInput.value)||0)); };
    var makeHamBtn = function(text, title, fn){
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn small danger"; b.textContent = text; b.title = title;
      b.addEventListener("click", function(e){ e.stopPropagation(); var n = hamAmount(); if(n > 0) fn(n); });
      hamRow.appendChild(b);
    };
    makeHamBtn("Take", "Take the full damage (temp HP first)", applyDamage);
    makeHamBtn("Take −3", "Heavy Armor Master: nonmagical B/P/S reduced by 3", function(n){
      var taken = Math.max(0, n - 3);
      logRoll("Heavy Armor Master", n + " damage reduced to " + taken + ".");
      if(taken > 0) applyDamage(taken); else { save(); renderAll(); flashHpNum("hp-dmg"); }
    });
    hpBox.appendChild(hamRow);
  }

  // Sub row for Max & Temp HP
  var subRow = document.createElement("div");
  subRow.className = "hp-sub-row";

  // Max HP
  var maxGroup = document.createElement("div");
  maxGroup.className = "hp-sub-group";
  var maxLbl = document.createElement("span");
  maxLbl.className = "hp-sub-lbl";
  maxLbl.textContent = "Max:";
  maxGroup.appendChild(maxLbl);

  var maxStepper = document.createElement("div");
  maxStepper.className = "stat-stepper hp-sub-stepper";

  var maxDown = document.createElement("button");
  maxDown.type = "button";
  maxDown.className = "stat-arrow-btn stat-arrow-down";
  maxDown.title = "Decrease max HP";
  maxDown.setAttribute("aria-label", "Decrease max HP");
  maxDown.innerHTML = makeStatArrowSvg("down");
  maxDown.disabled = (Number(c.hp.max)||1) <= 1;
  maxDown.addEventListener("click", function(e){
    e.stopPropagation();
    var curMax = Number(c.hp.max) || 1;
    if(curMax > 1){
      c.hp.max = curMax - 1;
      c.hp.current = Math.min(Number(c.hp.current)||0, maxHp(c));
      save(); renderSidebar(); renderAll();
    }
  });

  var maxValSpan = document.createElement("span");
  maxValSpan.className = "stat-score-val";
  maxValSpan.textContent = fullMaxHp(c);
  if(bonusTitle) maxValSpan.title = bonusTitle;

  var maxUp = document.createElement("button");
  maxUp.type = "button";
  maxUp.className = "stat-arrow-btn stat-arrow-up";
  maxUp.title = "Increase max HP";
  maxUp.setAttribute("aria-label", "Increase max HP");
  maxUp.innerHTML = makeStatArrowSvg("up");
  maxUp.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.max = (Number(c.hp.max)||1) + 1;
    save(); renderSidebar(); renderAll();
  });

  maxStepper.appendChild(maxDown);
  maxStepper.appendChild(maxValSpan);
  maxStepper.appendChild(maxUp);
  maxGroup.appendChild(maxStepper);
  subRow.appendChild(maxGroup);

  // Temp HP
  var tempGroup = document.createElement("div");
  tempGroup.className = "hp-sub-group";
  var tempLbl = document.createElement("span");
  tempLbl.className = "hp-sub-lbl";
  tempLbl.textContent = "Temp:";
  tempGroup.appendChild(tempLbl);

  var tempStepper = document.createElement("div");
  tempStepper.className = "stat-stepper hp-sub-stepper";

  var tempDown = document.createElement("button");
  tempDown.type = "button";
  tempDown.className = "stat-arrow-btn stat-arrow-down";
  tempDown.title = "Decrease temp HP";
  tempDown.setAttribute("aria-label", "Decrease temp HP");
  tempDown.innerHTML = makeStatArrowSvg("down");
  tempDown.disabled = (Number(c.hp.temp)||0) <= 0;
  tempDown.addEventListener("click", function(e){
    e.stopPropagation();
    var t = Number(c.hp.temp) || 0;
    if(t > 0){
      c.hp.temp = t - 1;
      save(); renderAll();
    }
  });

  var tempValSpan = document.createElement("span");
  tempValSpan.className = "stat-score-val";
  tempValSpan.textContent = c.hp.temp || 0;

  var tempUp = document.createElement("button");
  tempUp.type = "button";
  tempUp.className = "stat-arrow-btn stat-arrow-up";
  tempUp.title = "Increase temp HP";
  tempUp.setAttribute("aria-label", "Increase temp HP");
  tempUp.innerHTML = makeStatArrowSvg("up");
  tempUp.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.temp = (Number(c.hp.temp)||0) + 1;
    save(); renderAll();
  });

  tempStepper.appendChild(tempDown);
  tempStepper.appendChild(tempValSpan);
  tempStepper.appendChild(tempUp);
  tempGroup.appendChild(tempStepper);
  subRow.appendChild(tempGroup);

  hpBox.appendChild(subRow);

  if(c.hp.current<=0){
    hpBox.classList.add("is-dying");
    hpBox.appendChild(renderDeathSaves(c));
  }
  grid.appendChild(hpBox);

  // Same four-row shape as AC / Initiative (label, hero value, hint, controls)
  // so the three boxes line up on the shared subgrid.
  function smallVital(label, key, isNested, hint, step, suffix, bonus){
    step = step || 1;
    suffix = suffix || "";
    var box = document.createElement("div");
    box.className = "vital-box vital-mini";
    box.innerHTML = '<div class="lbl">'+label+'</div>';

    var val = isNested ? c[isNested][key] : c[key];
    val = Number(val) || 0;

    var valDiv = document.createElement("div");
    valDiv.className = "init-hero-val vital-plain-val";
    valDiv.textContent = (val + (bonus||0)) + suffix;
    box.appendChild(valDiv);

    var hintEl = document.createElement("div");
    hintEl.className = "vital-hint";
    hintEl.textContent = hint || "";
    box.appendChild(hintEl);

    var ctrlRow = document.createElement("div");
    ctrlRow.className = "init-misc-row";
    var stepper = document.createElement("div");
    stepper.className = "stat-stepper vital-stepper";

    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "stat-arrow-btn stat-arrow-down";
    downBtn.title = "Decrease " + label;
    downBtn.setAttribute("aria-label", "Decrease " + label);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = val <= 0;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = isNested ? c[isNested][key] : c[key];
      var nextVal = Math.max(0, (Number(cur) || 0) - step);
      if(isNested) c[isNested][key] = nextVal; else c[key] = nextVal;
      save(); renderAll();
    });

    var stepSpan = document.createElement("span");
    stepSpan.className = "stat-score-val vital-step-lbl";
    stepSpan.textContent = "\u00b1" + step;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "stat-arrow-btn stat-arrow-up";
    upBtn.title = "Increase " + label;
    upBtn.setAttribute("aria-label", "Increase " + label);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = isNested ? c[isNested][key] : c[key];
      var nextVal = (Number(cur) || 0) + step;
      if(isNested) c[isNested][key] = nextVal; else c[key] = nextVal;
      save(); renderAll();
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(stepSpan);
    stepper.appendChild(upBtn);
    ctrlRow.appendChild(stepper);
    box.appendChild(ctrlRow);
    return box;
  }
  var acResult = computeArmorClass(c);

  var acBox = document.createElement("div");
  acBox.className = "vital-box vital-mini ac-vital-box";
  var acHeader = document.createElement("div");
  acHeader.className = "lbl";
  acHeader.textContent = "Armor Class";
  acBox.appendChild(acHeader);

  var acValDiv = document.createElement("div");
  acValDiv.className = "init-hero-val";
  acValDiv.textContent = acResult.value;
  acBox.appendChild(acValDiv);

  var acHint = document.createElement("div");
  acHint.className = "vital-hint";
  acHint.title = acResult.breakdown;
  acHint.innerHTML = '<span class="hint-long"></span><span class="hint-short"></span>';
  acHint.firstChild.textContent = acResult.breakdown;
  acHint.lastChild.textContent = acResult.short;
  acBox.appendChild(acHint);

  var acMiscRow = document.createElement("div");
  acMiscRow.className = "init-misc-row";
  var acMiscLbl = document.createElement("span");
  acMiscLbl.textContent = "Misc:";
  acMiscRow.appendChild(acMiscLbl);

  var acMiscStepper = document.createElement("div");
  acMiscStepper.className = "stat-stepper";

  var acMiscDown = document.createElement("button");
  acMiscDown.type = "button";
  acMiscDown.className = "stat-arrow-btn stat-arrow-down";
  acMiscDown.title = "Decrease misc AC modifier";
  acMiscDown.setAttribute("aria-label", "Decrease misc AC modifier");
  acMiscDown.innerHTML = makeStatArrowSvg("down");
  acMiscDown.addEventListener("click", function(e){
    e.stopPropagation();
    c.acMisc = (Number(c.acMisc)||0) - 1;
    save(); renderAll();
  });

  var acMiscVal = document.createElement("span");
  acMiscVal.className = "stat-score-val";
  acMiscVal.textContent = fmtMod(c.acMisc||0);

  var acMiscUp = document.createElement("button");
  acMiscUp.type = "button";
  acMiscUp.className = "stat-arrow-btn stat-arrow-up";
  acMiscUp.title = "Increase misc AC modifier";
  acMiscUp.setAttribute("aria-label", "Increase misc AC modifier");
  acMiscUp.innerHTML = makeStatArrowSvg("up");
  acMiscUp.addEventListener("click", function(e){
    e.stopPropagation();
    c.acMisc = (Number(c.acMisc)||0) + 1;
    save(); renderAll();
  });

  acMiscStepper.appendChild(acMiscDown);
  acMiscStepper.appendChild(acMiscVal);
  acMiscStepper.appendChild(acMiscUp);
  acMiscRow.appendChild(acMiscStepper);
  acBox.appendChild(acMiscRow);

  grid.appendChild(acBox);

  var initBox = document.createElement("div");
  initBox.className = "vital-box vital-mini init-vital-box";
  var initResult = computeInitiative(c);
  var initTotal = initResult.value;
  var initRoll = initiativeRollMode(c); // Feral Instinct, or armor without proficiency

  var initHeader = document.createElement("div");
  initHeader.className = "lbl";
  initHeader.textContent = "Initiative";
  initBox.appendChild(initHeader);

  var initValDiv = document.createElement("div");
  initValDiv.className = "init-hero-val";
  initValDiv.textContent = fmtMod(initTotal);
  initValDiv.title = "Click to roll initiative (1d20" + fmtMod(initTotal) + ")" + (initRoll.mode!=="none" ? ", with " + (initRoll.mode==="adv" ? "advantage" : "disadvantage") + ": " + initRoll.reason : "");
  initBox.appendChild(initValDiv);

  var initHint = document.createElement("div");
  initHint.className = "vital-hint";
  initHint.textContent = initResult.short + (initRoll.mode==="adv" ? " · Adv" : initRoll.mode==="dis" ? " · Dis" : "");
  initHint.title = initResult.breakdown;
  initBox.appendChild(initHint);

  var miscStepperRow = document.createElement("div");
  miscStepperRow.className = "init-misc-row";
  var miscLbl = document.createElement("span");
  miscLbl.textContent = "Misc:";
  miscStepperRow.appendChild(miscLbl);

  var miscStepper = document.createElement("div");
  miscStepper.className = "stat-stepper";

  var miscDown = document.createElement("button");
  miscDown.type = "button";
  miscDown.className = "stat-arrow-btn stat-arrow-down";
  miscDown.title = "Decrease misc modifier";
  miscDown.setAttribute("aria-label", "Decrease misc modifier");
  miscDown.innerHTML = makeStatArrowSvg("down");
  miscDown.addEventListener("click", function(e){
    e.stopPropagation();
    c.initiativeMisc = (Number(c.initiativeMisc)||0) - 1;
    save(); renderAll();
  });

  var miscVal = document.createElement("span");
  miscVal.className = "stat-score-val";
  miscVal.textContent = fmtMod(c.initiativeMisc||0);

  var miscUp = document.createElement("button");
  miscUp.type = "button";
  miscUp.className = "stat-arrow-btn stat-arrow-up";
  miscUp.title = "Increase misc modifier";
  miscUp.setAttribute("aria-label", "Increase misc modifier");
  miscUp.innerHTML = makeStatArrowSvg("up");
  miscUp.addEventListener("click", function(e){
    e.stopPropagation();
    c.initiativeMisc = (Number(c.initiativeMisc)||0) + 1;
    save(); renderAll();
  });

  miscStepper.appendChild(miscDown);
  miscStepper.appendChild(miscVal);
  miscStepper.appendChild(miscUp);
  miscStepperRow.appendChild(miscStepper);
  initBox.appendChild(miscStepperRow);

  initBox.style.cursor="pointer";
  initBox.title = "Click to roll initiative (1d20" + fmtMod(initTotal) + ")";
  initBox.addEventListener("click", function(e){
    if(e.target.closest(".stat-stepper") || e.target.closest("button")) return;
    performRoll(20,1,initTotal,initRoll.mode,"Initiative");
    // Initiative is a DEX check: Duality's next-check advantage is used.
    if(useNextCheck(c)){ save(); renderAll(); }
  });
  grid.appendChild(initBox);

  var speed = computeSpeed(c);
  var speedHint = speed.parts.length ? "per turn, incl. "+speed.parts.map(function(p){
    return p.name+" "+fmtMod(p.value)+(p.why ? " ("+p.why+")" : "");
  }).join(", ") : "per turn";
  // A condition's 0 (named) or exhaustion's half replaces the bonuses line.
  if(speed.hindered) speedHint = speed.hindered.zero || "Halved (exhaustion)";
  var speedBox = smallVital("Speed","speed",null,speedHint,5," ft",speed.value - (Number(c.speed)||0));
  if(speed.hindered) speedBox.classList.add("speed-hindered");
  // Fly, swim and climb speeds under walking speed; conditional ones say when.
  if(speed.others.length){
    var others = document.createElement("div");
    others.className = "speed-others";
    speed.others.forEach(function(o){
      var line = document.createElement("div");
      line.className = "speed-other" + (o.when ? " conditional" : "");
      line.title = "From " + o.source;
      var amount = document.createElement("b");
      amount.textContent = o.type.charAt(0).toUpperCase() + o.type.slice(1) + " " + o.value + " ft";
      line.appendChild(amount);
      if(o.when){
        var when = document.createElement("span");
        when.className = "speed-when";
        when.textContent = o.when;
        line.appendChild(when);
      }
      others.appendChild(line);
    });
    // Inside the hint row: the mini boxes share a 4-row subgrid (label,
    // value, hint, stepper), so an extra child would land on the stepper.
    speedBox.querySelector(".vital-hint").appendChild(others);
  }
  speedBox.classList.add("speed-vital-box");
  grid.appendChild(speedBox);

  card.appendChild(grid);
  var conditionChips = renderConditionsStrip(c);
  if(conditionChips) card.appendChild(conditionChips);
  panel.appendChild(card);

  // Hit dice + rest
  var restCard = makeCard("Hit dice & rest");
  var hd = totalLevel(c);
  // Hit dice are counted per size (a multiclass character has a mix, e.g.
  // 3d12 + 2d6). One tile each, and the tile is the button: the player picks
  // which size to spend, and a single class has one tile.
  var pools = hitDicePools(c);
  var hdRemaining = pools.reduce(function(n, p){ return n + p.total - p.used; }, 0);
  // Spends a die of that size and rolls it.
  function spendDie(size){
    var die = spendHitDie(c, size);
    if(!die) return;
    var conMod = mod(abilityScore(c, "con"));
    var roll = Math.floor(Math.random()*die)+1;
    var healed = hitDieHealing(c, roll);
    c.hp.current = clamp(c.hp.current+healed, 0, hpMax);
    logRoll("Hit die (d"+die+fmtMod(conMod)+")", roll+" "+fmtMod(conMod)+" = "+healed+" HP healed"+(healed > Math.max(1, roll+conMod) ? " (Durable minimum)" : ""));
    save(); renderAll();
  }
  // The total only when there are several sizes: with one, its tile says the same.
  if(pools.length > 1){
    var hdHead = document.createElement("div");
    hdHead.className = "hd-head";
    hdHead.innerHTML = "<span class='hd-title'>Hit dice left</span><span class='hd-total"+(hdRemaining===0 ? " spent" : "")+"'><b>"+hdRemaining+"</b> / "+hd+"</span>";
    restCard.appendChild(hdHead);
  }
  var hdTiles = document.createElement("div");
  hdTiles.className = "hd-tiles";
  pools.forEach(function(p){
    var left = p.total - p.used;
    var tile = document.createElement("button");
    tile.type = "button";
    tile.className = "hd-tile" + (left===0 ? " spent" : "");
    tile.disabled = left===0;
    tile.title = left===0 ? "No d"+p.die+" left" : "Spend a d"+p.die+" and roll it";
    tile.setAttribute("aria-label", "Spend a d"+p.die+" hit die, "+left+" of "+p.total+" left");
    tile.innerHTML = "<span class='hd-die'>d"+p.die+"</span><span class='hd-count'><b>"+left+"</b> / "+p.total+"</span>";
    tile.addEventListener("click", function(){ spendDie(p.die); });
    hdTiles.appendChild(tile);
  });
  restCard.appendChild(hdTiles);
  var hdHint = document.createElement("p");
  hdHint.className = "hd-hint";
  hdHint.textContent = hdRemaining===0 ? "No hit dice left. A long rest gives some back." : pools.length > 1 ? "Tap a die to roll it and heal." : "Tap the die to roll it and heal.";
  restCard.appendChild(hdHint);

  var restRow = document.createElement("div");
  restRow.className = "rest-row";

  var shortRestBtn = document.createElement("button");
  shortRestBtn.className = "btn small"; shortRestBtn.textContent = "Short rest";
  shortRestBtn.title = "Restores short-rest resources. Spend hit dice to heal.";
  shortRestBtn.addEventListener("click", function(){
    var before = resourceUse(c);
    var pactNote = "";
    if(c.spellcasting.pact && c.spellcasting.pact.used){ c.spellcasting.pact.used = 0; pactNote = " Pact slots restored."; }
    var restored = restoreResources(c, "short");
    var resNote = restored.length ? " Restored: "+restored.join(", ")+"." : "";
    var ended = endAllEffects(c).concat(endTimedBoons(c));
    if(ended.length) resNote += " Ended: "+ended.join(", ")+".";
    logRoll("Short rest taken", "Spend hit dice as needed to heal."+pactNote+resNote);
    save(); renderAll();
    restScene("short");
    playShortRest();
    showRefilled(c, before, 400);
  });
  restRow.appendChild(shortRestBtn);

  var longRestBtn = document.createElement("button");
  longRestBtn.className = "btn small primary"; longRestBtn.textContent = "Long rest";
  longRestBtn.addEventListener("click", function(){
    // Conditions still on: offered to end with the rest (ticked).
    var conditionChoice = longRestConditionsChoice(c);
    confirmDialog(
      "Take a long rest?",
      "This resets HP to full, clears temp HP and death saves, restores spell slots, rage and class resources, and recovers hit dice."+
        (exhaustionLevel(c) && exhaustionLevel(c) < 6 ? " One level of exhaustion goes too, if you've had food and drink." : "")+
        (preparesSpells(c) ? " Afterwards you can choose today's prepared spells." : ""),
      function(){
        var before = resourceUse(c);
        var ragesBefore = c.rage.used || 0;
        var hpBefore = Number(c.hp.current) || 0;
        // One level of exhaustion goes first, so a maximum halved by
        // level 4 is whole again when the hit points come back.
        var exhaustionNow = longRestExhaustion(c);
        var conditionsEnded = conditionChoice ? conditionChoice.apply() : [];
        hpMax = maxHp(c);
        c.hp.current = hpMax;
        c.hp.temp = 0;
        c.deathSaves = {success:0, fail:0};
        var recovered = recoverHitDice(c);
        Object.keys(c.spellcasting.slots).forEach(function(lvl){
          c.spellcasting.slots[lvl].used = 0;
        });
        if(c.spellcasting.pact) c.spellcasting.pact.used = 0;
        c.rage.used = 0;
        endAllEffects(c); // also ends Rage
        // Magic items: charges back at dawn, the day's boons over.
        var items = magicItemsOnLongRest(c);
        items.recharged = items.recharged.concat(infusionsOnLongRest(c));
        restoreResources(c, "long");
        restoreCompanions(c);
        var elixirs = elixirsOnLongRest(c);
        logRoll("Long rest taken", "HP and spell slots restored. "+recovered+" hit dice recovered."+
          (elixirs.length ? " New elixirs: "+elixirs.join(", ")+"." : "")+
          (items.recharged.length ? " Recharged: "+items.recharged.join(", ")+"." : "")+
          (items.ended.length ? " Ended: "+items.ended.join(", ")+"." : "")+
          (exhaustionNow!==null ? " Exhaustion down to level "+exhaustionNow+" (with food and drink)." : "")+
          (conditionsEnded.length ? " Conditions ended: "+conditionsEnded.join(", ")+"." : ""));
        save(); renderAll();
        // Night falls, then at dawn hit points and resources come back.
        restScene("long");
        playLongRest();
        if(hpMax > hpBefore) setTimeout(function(){ flashHpNum("hp-heal"); }, 1300);
        showRefilled(c, before, 1300);
        var ragePips = document.querySelector(".rage-pips");
        if(ragePips) pipsRefilled(ragePips, ragePips.children.length - ragesBefore, ragePips.children.length, 1300);
        // A cleric, druid, paladin, wizard or artificer picks today's
        // spells after a long rest.
        openPrepareSheet(c, true);
      },
      conditionChoice && conditionChoice.el
    );
  });
  restRow.appendChild(longRestBtn);

  restCard.appendChild(restRow);
  panel.appendChild(restCard);

  var barbClass = barbarianClassEntry(c);
  if(barbClass) panel.appendChild(renderRageCard(c, barbClass));

  var effectsCard = renderEffectsCard(c);
  if(effectsCard) panel.appendChild(effectsCard);

  // A use kept with its card elsewhere (a Breath Weapon on Inventory) isn't repeated here.
  var resources = characterResources(c).filter(function(r){ return r.place!=="inventory"; });
  if(resources.length) panel.appendChild(renderResourcesCard(c, resources));

  return panel;
}

/* ---- Rage ----
   Rages left as pips, the damage bonus and the Enter/End button on one
   row; what rage gives as chips that light up while raging. The full
   rule is in the info icon's tooltip. */
function renderRageCard(c, barbClass){
  var level = barbClass.level||1;
  var rageMax = barbarianRageMax(level);
  var rageUsed = rageMax===Infinity ? 0 : clamp(c.rage.used||0, 0, rageMax);
  var rageLeft = rageMax===Infinity ? Infinity : rageMax-rageUsed;
  var raging = !!c.rage.active;

  var card = makeCard("Rage");
  card.classList.add("rage-card");
  if(raging) card.classList.add("raging");
  var head = card.querySelector("h3");
  var tools = document.createElement("span");
  tools.className = "rage-head";
  if(raging){
    var badge = document.createElement("span");
    badge.className = "rage-badge";
    badge.textContent = "Raging";
    tools.appendChild(badge);
  }
  var rule = classFeatureList(barbClass).find(function(f){ return f.name==="Rage"; });
  if(rule){
    var info = document.createElement("span");
    info.className = "rage-info";
    info.title = rule.text;
    info.setAttribute("aria-label", rule.text);
    info.setAttribute("role", "img");
    info.innerHTML = makeInfoSvg();
    tools.appendChild(info);
  }
  head.appendChild(tools);

  var main = document.createElement("div");
  main.className = "rage-main";

  var left = document.createElement("div");
  left.className = "rage-stat";
  left.innerHTML = '<span class="rage-lbl">Rages</span>';
  if(rageMax===Infinity){
    var unlimited = document.createElement("span");
    unlimited.className = "rage-val";
    unlimited.textContent = "Unlimited";
    left.appendChild(unlimited);
  } else {
    var pips = document.createElement("div");
    pips.className = "rage-pips";
    pips.setAttribute("aria-label", rageLeft+" of "+rageMax+" left");
    for(var i=0;i<rageMax;i++){
      var pip = document.createElement("span");
      pip.className = "res-pip rage-pip" + (i < rageLeft ? " full" : "");
      pips.appendChild(pip);
    }
    left.appendChild(pips);
  }
  main.appendChild(left);

  var dmg = document.createElement("div");
  dmg.className = "rage-stat";
  dmg.innerHTML = '<span class="rage-lbl">Damage</span><span class="rage-val">+'+barbarianRageDamage(level)+'</span>';
  dmg.title = "Added to Strength melee weapon attacks while raging";
  main.appendChild(dmg);

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn rage-btn"+(raging ? "" : " primary");
  btn.innerHTML = makeFlameSvg();
  btn.appendChild(document.createTextNode(raging ? "End Rage" : "Enter Rage"));
  btn.disabled = !raging && rageLeft<=0;
  if(btn.disabled) btn.title = "No rages left until a long rest";
  btn.addEventListener("click", function(){
    if(c.rage.active){
      c.rage.active = false;
    } else {
      if(rageLeft<=0) return;
      c.rage.active = true;
      if(rageMax!==Infinity) c.rage.used = rageUsed+1;
    }
    save(); renderAll();
    // Entering spends the last full pip.
    if(c.rage.active && rageMax!==Infinity) pipChanged(document.querySelector(".rage-pips"), rageLeft-1, true);
  });
  main.appendChild(btn);
  card.appendChild(main);

  var perks = ["Resist bludgeoning, piercing & slashing", "Advantage on Strength checks & saves"];
  if(castsSpells(c)) perks.push("No spellcasting or concentration");
  var perkRow = document.createElement("div");
  perkRow.className = "rage-perks";
  perks.forEach(function(text){
    var chip = document.createElement("span");
    chip.className = "rage-perk";
    chip.textContent = text;
    perkRow.appendChild(chip);
  });
  card.appendChild(perkRow);
  return card;
}
/* Has spell slots or pact slots, so rage's "no spells" matters. */
function castsSpells(c){
  var sc = c.spellcasting || {};
  var slots = sc.slots || {};
  return Object.keys(slots).some(function(k){ return (slots[k].max||0) > 0; }) || !!(sc.pact && sc.pact.max);
}

/* ---- Resources ----
   One row per limited-use class feature or feat, with use/regain buttons. Counts of
   uses (pips) come first, then the point pools (a number: Ki, Lay on Hands) under a
   thin divider. See resourceIsNumber for which is which. */

/* "Class resources", "Class & feat resources", "Class, race & feat
   resources", "Race resources" ...: whose uses the card holds. */
function resourcesTitle(resources){
  var race = resources.some(function(r){ return r.key.indexOf("race:")===0; });
  var feat = resources.some(function(r){ return r.key.indexOf("feat:")===0; });
  var cls = resources.some(function(r){ return !/^(race|feat):/.test(r.key); });
  var kinds = [cls ? "class" : "", race ? "race" : "", feat ? "feat" : ""].filter(Boolean);
  var text = kinds.length > 1 ? kinds.slice(0, -1).join(", ") + " & " + kinds[kinds.length-1] : kinds[0];
  return text.charAt(0).toUpperCase() + text.slice(1) + " resources";
}
function renderResourcesCard(c, resources){
  var card = makeCard(resourcesTitle(resources));
  var list = document.createElement("div");
  list.className = "res-list";
  // Uses first, then points, each keeping its order (the sort is stable).
  var ordered = resources.filter(function(r){ return !resourceIsNumber(r); }).concat(resources.filter(resourceIsNumber));
  var dividerAt = ordered.findIndex(resourceIsNumber);
  ordered.forEach(function(r, index){
    if(index===dividerAt && index>0){
      var divider = document.createElement("div");
      divider.className = "res-divider";
      divider.setAttribute("role", "separator");
      list.appendChild(divider);
    }
    var remaining = r.max - r.used;
    var row = document.createElement("div");
    row.className = "res-row" + (remaining===0 ? " spent" : "");
    row.setAttribute("data-res", r.key);

    var info = document.createElement("div");
    info.className = "res-info";
    var name = document.createElement("div");
    name.className = "res-name";
    name.textContent = r.name;
    var tag = document.createElement("span");
    tag.className = "res-reset res-reset-"+r.reset;
    tag.textContent = r.reset==="short" ? "Short rest" : r.reset==="manual" ? "Manual" : "Long rest";
    if(r.max!==Infinity) name.appendChild(tag);
    info.appendChild(name);
    var hint = document.createElement("div");
    hint.className = "res-hint";
    hint.textContent = r.hint + (r.source ? " ("+r.source+")" : "");
    info.appendChild(hint);
    // A use that rolls a die (Warding Maneuver's d8): spends one and rolls.
    if(r.roll && r.max!==Infinity){
      var rolls = document.createElement("div");
      rolls.className = "inv-roll-actions fx-rolls";
      var rollBtn = document.createElement("button");
      rollBtn.type = "button"; rollBtn.className = "btn small inv-roll-btn res-roll-btn";
      rollBtn.innerHTML = makeDiceSvg();
      rollBtn.appendChild(document.createTextNode("Use · 1d" + r.roll.die));
      var unarmed = r.roll.needs==="meleeOrShield" && !wieldsMeleeWeaponOrShield(c);
      rollBtn.disabled = remaining<=0 || unarmed;
      rollBtn.title = remaining<=0 ? "None left" : unarmed ? "Needs a melee weapon or a shield in hand" : "Spend one and roll 1d" + r.roll.die;
      rollBtn.addEventListener("click", function(){
        setUsed(r.used+1);
        performRoll(r.roll.die, 1, 0, "none", r.roll.label);
      });
      rolls.appendChild(rollBtn);
      info.appendChild(rolls);
    }
    row.appendChild(info);

    var ctrl = document.createElement("div");
    ctrl.className = "res-ctrl";
    row.appendChild(ctrl);
    // Unlimited (Archdruid's Wild Shape): nothing to count or spend.
    if(r.max===Infinity){
      var unlimited = document.createElement("div");
      unlimited.className = "res-count";
      unlimited.innerHTML = "<b>Unlimited</b>";
      ctrl.appendChild(unlimited);
      list.appendChild(row);
      return;
    }
    if(!resourceIsNumber(r)){
      var pips = document.createElement("div");
      pips.className = "res-pips";
      pips.setAttribute("aria-label", remaining+" of "+r.max+" left");
      for(var i=0;i<r.max;i++){
        var pip = document.createElement("span");
        pip.className = "res-pip" + (i < remaining ? " full" : "");
        pips.appendChild(pip);
      }
      ctrl.appendChild(pips);
    } else {
      var count = document.createElement("div");
      count.className = "res-count";
      count.innerHTML = "<b>"+remaining+"</b> / "+r.max;
      ctrl.appendChild(count);
    }

    var stepper = document.createElement("div");
    stepper.className = "stat-stepper";
    var useBtn = document.createElement("button");
    useBtn.type = "button";
    useBtn.className = "stat-arrow-btn";
    useBtn.title = "Use one";
    useBtn.setAttribute("aria-label", "Use one "+r.name);
    useBtn.innerHTML = makeStatArrowSvg("down");
    useBtn.disabled = remaining<=0;
    useBtn.addEventListener("click", function(){ setUsed(r.used+1); });
    var regainBtn = document.createElement("button");
    regainBtn.type = "button";
    regainBtn.className = "stat-arrow-btn";
    regainBtn.title = "Regain one";
    regainBtn.setAttribute("aria-label", "Regain one "+r.name);
    regainBtn.innerHTML = makeStatArrowSvg("up");
    regainBtn.disabled = r.used<=0;
    regainBtn.addEventListener("click", function(){ setUsed(r.used-1); });
    stepper.appendChild(useBtn);
    stepper.appendChild(regainBtn);
    ctrl.appendChild(stepper);

    function setUsed(n){
      n = clamp(n, 0, r.max);
      var before = r.used;
      // Using Wild Shape again ends Symbiotic Entity.
      if(r.key==="Druid:wild_shape" && n > r.used) endEffect(c, "symbiotic_entity");
      if(n) c.resourcesUsed[r.key] = n; else delete c.resourcesUsed[r.key];
      save(); renderAll();
      if(n === before) return;
      var drawn = resourceRow(r.key);
      if(!drawn) return;
      var pips = drawn.querySelector(".res-pips");
      // Spent: the last full pip empties. Got back: the first empty one fills.
      if(pips) pipChanged(pips, n > before ? r.max - n : r.max - before, n > before);
      else {
        // A point pool: the number pops and the amount floats up from it.
        var num = drawn.querySelector(".res-count b");
        flash(num, "fx-bump");
        floatDelta(num, before - n, r.key);
      }
    }
    list.appendChild(row);
  });
  card.appendChild(list);
  return card;
}
