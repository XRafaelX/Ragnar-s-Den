import { save } from "../../core/state.js";
import { spendResource, sorcerousRestoration, fontOnLongRest, lunarOnLongRest, talesOnRest, wildShapeDamage, endWildShape, omenOnLongRest, clamp, mod, fmtMod, totalLevel, hitDicePools, spendHitDie, recoverHitDice, barbarianClassEntry, barbarianRageMax, barbarianRageDamage, computeArmorClass, computeInitiative, initiativeRollMode, characterResources, resourceIsNumber, restoreResources, maxHp, fullMaxHp, hpBonuses, computeSpeed, usesVariant, hitDieHealing, heavyArmorMasterActive, endAllEffects, endEffect, hpMaxHalved, resistsAllDamage, raceWards, addCondition, longRestExhaustion, exhaustionLevel, wieldsMeleeWeaponOrShield, quickenedHealing, regainOnInitiative, secondWind, survivorHeal, soulTrinkets, startRage, endRage, canFrenzy, ragePerks, rageAtZero, spiritShield, wildSurgeNow, wildSurgeDc, rollWildSurge, chooseWildSurge, classLevelOf, parseDiceNotation, beastFormDue, chooseBeastForm, BEAST_FORMS, callTheHuntMax, elementalCleaver, setElementalCleaver, CLEAVER_TYPES, stormAura, stormSoulResistances, effectResistances, featureResistances, harnessDivinePower, useHarnessDivinePower, ordinal, kiActions, kiActionProblem, payKiAction, protectiveSpirit, spellSlotsLeft, spendSpellSlot, tirelessRest, drakeResistance, saintResistance, resourceLeft, spendChannel, forgeOnLongRest, interventionOnLongRest, effectOn } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeStatArrowSvg, makeInfoSvg, makeFlameSvg, makeDiceSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { elixirsOnLongRest, infusionsOnLongRest } from "../../core/artificer.js";
import { restoreCompanions, wildCompanionHours, summonWildCompanion } from "../../core/companions.js";
import { showActionToast } from "../../ui/toast.js";
import { WILD_SURGES } from "../../data/effects.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { channelPicker, layOnHandsRow } from "./paladin.js";
import { interventionRow, forgePicker } from "./cleric.js";
import { gunslingerResourceRow } from "./gunslinger.js";
import { useNextCheck, magicItemsOnLongRest, endTimedBoons, coinResistances } from "../../core/magic-items.js";
import { infusionResistances } from "../../core/infusion-effects.js";
import { renderDeathSaves } from "./death-saves.js";
import { renderEffectsCard } from "./effects.js";
import { renderWildShapeCard, druidResourceRow } from "./druid.js";
import { bardResourceRow, songOfRestButton } from "./bard.js";
import { sorcererResourceRow } from "./sorcerer.js";
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
  if(c.wildShape) hpBox.querySelector(".lbl").textContent = c.wildShape.form + " hit points";

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
    // Wild Shape: the form takes it. At 0 hit points you turn back, and
    // what's left carries over.
    if(c.wildShape){
      n = wildShapeDamage(c, n);
      if(n < 0){ save(); renderSidebar(); renderAll(); flashHpNum("hp-dmg"); return; }
      showActionToast(n ? "You turn back, and " + n + " damage carries over." : "You turn back to your own shape.");
    }
    var wasUp = (Number(c.hp.current)||0) > 0;
    c.hp.current = Math.max(0, (Number(c.hp.current)||0) - n);
    var wentDown = wasUp && c.hp.current === 0;
    // Dropping to 0 HP: unconscious (worked out from the HP) and prone.
    // (Relentless Rage's save waiting, or Rage Beyond Death: the rage holds.)
    if(wentDown){
      c.deathSaves = {success:0, fail:0};
      delete c.extraTurn; // a new fall: Strength Before Death can be used again (if a use is left)
      if(!rageAtZero(c)){ endAllEffects(c, true); addCondition(c, "prone"); }
    }
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

  // Protective Spirit (Oath of Redemption 15): at the end of your turn,
  // below half your hit points.
  var spirit = protectiveSpirit(c, hpMax);
  if(spirit){
    var spiritBtn = document.createElement("button");
    spiritBtn.type = "button"; spiritBtn.className = "btn small inv-roll-btn hp-spirit-btn";
    spiritBtn.innerHTML = makeDiceSvg();
    spiritBtn.appendChild(document.createTextNode("Protective Spirit 1d6+" + spirit.bonus));
    spiritBtn.title = "At the end of your turn in combat, below half your hit points and not incapacitated";
    spiritBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var roll = Math.floor(Math.random()*6)+1, healed = roll + spirit.bonus;
      c.hp.current = clamp((Number(c.hp.current)||0) + healed, 0, hpMax);
      logRoll("Protective Spirit (1d6+" + spirit.bonus + ")", roll + " +" + spirit.bonus + " = " + healed + " HP healed");
      save(); renderSidebar(); renderAll();
      flashHpNum("hp-heal");
    });
    hpBox.appendChild(spiritBtn);
  }

  // Damage resistances and immunities from the race (Mountain Born, Poison
  // Immunity) and items (Resistant Armor, Duality), only when there are
  // any; where each comes from is in the tooltip. A type the character is
  // immune to isn't listed as resisted too.
  var wards = raceWards(c);
  var immuneTypes = wards.immune.map(function(r){ return r.type; });
  var resist = wards.resist.concat(infusionResistances(c), coinResistances(c).map(function(t){ return {type: t, source: "Duality"}; }), stormSoulResistances(c), featureResistances(c), effectResistances(c), drakeResistance(c), saintResistance(c))
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
    // Thief's Reflexes (Thief 17): a second turn at the initiative minus 10.
    var reflexes = classLevelOf(c, "Rogue", "Thief") >= 17;
    performRoll(20,1,initTotal,initRoll.mode,"Initiative", reflexes ? function(r){
      return r ? {lead: "Thief's Reflexes: a second turn in the first round at initiative " + (r.total - 10) + " (not when you're surprised).", options: []} : null;
    } : null);
    // Initiative is a DEX check: Duality's next-check advantage is used.
    var used = useNextCheck(c);
    if(effectOn(c, "vigilant_blessing")){ endEffect(c, "vigilant_blessing"); used = true; }
    // Relentless, Tireless Spirit...: one use back if none were left.
    var back = regainOnInitiative(c);
    if(back.length){ logRoll("Initiative", "Regained one use of " + back.join(", ") + "."); showActionToast("Regained one use of " + back.join(", ") + "."); }
    if(used || back.length){ save(); renderAll(); }
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
  var songRow = songOfRestButton(c);
  if(songRow) restCard.appendChild(songRow);

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
    talesOnRest(c);
    delete c.relentlessUses; // Relentless Rage's DC is back to 10
    var resNote = restored.length ? " Restored: "+restored.join(", ")+"." : "";
    var ended = endAllEffects(c, "short").concat(endTimedBoons(c));
    var back = sorcerousRestoration(c);
    if(back) resNote += " Sorcerous Restoration: " + back + " sorcery points.";
    if(ended.length) resNote += " Ended: "+ended.join(", ")+".";
    var rested = tirelessRest(c);
    if(rested!==null) resNote += " Tireless: exhaustion down to level "+rested+".";
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
        endWildShape(c); // Sleep ends a form: it ends if you fall unconscious.
        var before = resourceUse(c);
        var ragesBefore = c.rage.used || 0;
        var hpBefore = Number(c.hp.current) || 0;
        // A rage still going ended long before the rest (Frenzy's
        // exhaustion is taken first, then the rest's level comes off).
        endAllEffects(c); // also ends Rage
        delete c.relentlessUses;
        delete c.extraTurn;
        // Death's Friend (Phantom 17): a soul trinket appears if you have none.
        if(classLevelOf(c, "Rogue", "Phantom") >= 17 && !(Number(c.soulTrinkets)||0)) c.soulTrinkets = 1;
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
        // Magic items: charges back at dawn, the day's boons over.
        var items = magicItemsOnLongRest(c);
        items.recharged = items.recharged.concat(infusionsOnLongRest(c));
        restoreResources(c, "long");
        forgeOnLongRest(c);
        interventionOnLongRest(c);
        var omen = omenOnLongRest(c);
        fontOnLongRest(c);
        lunarOnLongRest(c);
        talesOnRest(c);
        delete c.sessionSpell; // Spirit Session's spell goes as a long rest starts.
        restoreCompanions(c);
        var elixirs = elixirsOnLongRest(c);
        logRoll("Long rest taken", "HP and spell slots restored. "+recovered+" hit dice recovered."+
          (elixirs.length ? " New elixirs: "+elixirs.join(", ")+"." : "")+
          (items.recharged.length ? " Recharged: "+items.recharged.join(", ")+"." : "")+
          (items.ended.length ? " Ended: "+items.ended.join(", ")+"." : "")+
          (omen ? " Cosmic Omen: " + omen + "." : "")+
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

  if(c.wildShape) panel.appendChild(renderWildShapeCard(c));

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
  // Instinctive Pounce (Tasha's): the move that comes with entering.
  else if(!raging && usesVariant(barbClass, "Instinctive Pounce")) btn.title = "Instinctive Pounce: as you enter your rage, you can move up to half your speed (" + Math.floor(computeSpeed(c).value / 2) + " ft).";
  btn.addEventListener("click", function(){
    if(c.rage.active){
      var notes = endRage(c);
      if(notes.length){ logRoll("Rage ended", notes.join(". ") + "."); showActionToast(notes.join(". ") + "."); }
    } else {
      if(rageLeft<=0) return;
      var started = startRage(c);
      if(rageMax!==Infinity) c.rage.used = rageUsed+1;
      if(started.length) logRoll("Rage", started.join(". ") + ".");
    }
    save(); renderAll();
    // Entering spends the last full pip.
    if(c.rage.active && rageMax!==Infinity) pipChanged(document.querySelector(".rage-pips"), rageLeft-1, true);
  });
  main.appendChild(btn);
  card.appendChild(main);

  // A Wild Surge: the effect in play (or Controlled Surge's choice).
  if(raging){
    var surgeBox = wildSurgeBlock(c);
    if(surgeBox) card.appendChild(surgeBox);
  }
  // What the rage's features let you do now (Frenzy), as buttons.
  if(raging){
    var acts = rageActions(c);
    if(acts.length){
      var actRow = document.createElement("div");
      actRow.className = "inv-roll-actions rage-acts";
      acts.forEach(function(b){ actRow.appendChild(b); });
      card.appendChild(actRow);
    }
  }

  var perks = ragePerks(c);
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
/* Path of Wild Magic: the Wild Surge in play, its save DC and dice, and
   Unstable Backlash's reroll (10); with Controlled Surge (14) a choice
   between the two rolled first. */
function wildSurgeBlock(c){
  var choice = c.rage.surgeChoice, s = wildSurgeNow(c);
  if(!choice && !s) return null;
  var box = document.createElement("div");
  box.className = "rage-surge";
  var head = document.createElement("div");
  head.className = "rage-surge-head";
  var acts = document.createElement("div");
  acts.className = "inv-roll-actions";
  if(choice){
    head.textContent = choice.length > 2 ? "Controlled Surge: you rolled the same number twice, so choose any effect" : "Controlled Surge: choose one";
    box.appendChild(head);
    choice.forEach(function(n){
      var e = WILD_SURGES[n-1];
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn small inv-roll-btn";
      b.textContent = n + ". " + e.name;
      b.title = e.text;
      b.addEventListener("click", function(){
        var note = chooseWildSurge(c, n);
        if(note) logRoll("Wild Surge", note + ".");
        save(); renderAll();
      });
      acts.appendChild(b);
    });
    box.appendChild(acts);
    return box;
  }
  head.textContent = "Wild Surge " + s.n + ": " + s.name;
  box.appendChild(head);
  var text = document.createElement("div");
  text.className = "rage-surge-text";
  text.textContent = s.text;
  box.appendChild(text);
  if(s.dice){
    var p = parseDiceNotation(s.dice);
    var dmg = document.createElement("button");
    dmg.type = "button"; dmg.className = "btn small inv-roll-btn";
    dmg.innerHTML = makeDiceSvg() + s.dice + " " + s.type.toLowerCase() + (s.save ? " · " + s.save.toUpperCase() + " DC " + wildSurgeDc(c) : "");
    dmg.addEventListener("click", function(){ performRoll(p.die, p.qty, 0, "none", "Wild Surge: " + s.name + " (" + s.type + ")"); });
    acts.appendChild(dmg);
  }
  if(classLevelOf(c, "Barbarian", "Path of Wild Magic") >= 10){
    var back = document.createElement("button");
    back.type = "button"; back.className = "btn small inv-roll-btn";
    back.textContent = "Unstable Backlash";
    back.title = "Reaction: right after you take damage or fail a saving throw while raging, roll a new Wild Surge in place of this one";
    back.addEventListener("click", function(){
      logRoll("Unstable Backlash", rollWildSurge(c) + ".");
      save(); renderAll();
    });
    acts.appendChild(back);
  }
  if(acts.children.length) box.appendChild(acts);
  return box;
}
/* The rage's buttons and pickers: Frenzy (Berserker), Form of the Beast
   and Call the Hunt (Beast), Elemental Cleaver (Giant), Storm Aura and
   Raging Storm (Storm Herald), Spirit Shield (Ancestral Guardian). */
/* "Spend ki on...": what the monk's ki can pay for. Picking one pays for
   it and rolls its dice, if it has any. */
function kiPicker(c){
  var actions = kiActions(c), groups = {"": []};
  function cost(a){ return a.useKey && a.freeUse ? "1 use" : a.cost ? a.cost + " ki" : "Free"; }
  actions.forEach(function(a){
    var g = a.group || "";
    if(!groups[g]) groups[g] = [];
    groups[g].push({value: a.id, label: a.name + " · " + cost(a)});
  });
  function find(id){ return actions.find(function(a){ return a.id===id; }); }
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "ki:spend", groups: groups, value: "", placeholder: "Spend ki on...", ariaLabel: "Spend ki on", sheet: true,
    reasonFor: function(id){ return kiActionProblem(c, find(id)); },
    detailFor: function(id){ return find(id).detail; },
    onPick: function(id){
      var a = find(id), paid = cost(a);
      if(!payKiAction(c, a)) return;
      var name = (a.group ? a.group + ": " : "") + a.name;
      if(a.log) logRoll(name, a.log + " (" + paid + ")");
      save(); renderAll();
      if(a.sharpen) showActionToast(a.sharpen.name + " sharpened: +" + a.sharpen.bonus + " to attack and damage for 1 minute.");
      if(a.roll) performRoll(a.roll.die, a.roll.qty, a.roll.bonus, "none", a.roll.label);
    }}));
  return wrap;
}

function rageActions(c){
  var out = [];
  if(canFrenzy(c)){
    var fz = document.createElement("button");
    fz.type = "button"; fz.className = "btn small inv-roll-btn";
    fz.textContent = "Frenzy";
    fz.title = "Go into a frenzy: a melee weapon attack as a bonus action on each of your turns after this one. When the rage ends, you gain 1 level of exhaustion.";
    fz.addEventListener("click", function(){
      c.rage.frenzy = true;
      logRoll("Frenzy", "A melee weapon attack as a bonus action on each of your next turns. 1 level of exhaustion when the rage ends.");
      save(); renderAll();
    });
    out.push(fz);
  }
  // Form of the Beast: the natural weapon for this rage.
  if(beastFormDue(c)){
    Object.keys(BEAST_FORMS).forEach(function(form){
      var bf = document.createElement("button");
      bf.type = "button"; bf.className = "btn small inv-roll-btn";
      bf.textContent = form;
      bf.title = "Form of the Beast: 1d" + BEAST_FORMS[form].die + " " + BEAST_FORMS[form].type.toLowerCase() + ". " + BEAST_FORMS[form].note + " Its card is on the Inventory tab.";
      bf.addEventListener("click", function(){
        chooseBeastForm(c, form);
        logRoll("Form of the Beast", form + " for this rage.");
        save(); renderAll();
      });
      out.push(bf);
    });
  }
  // Call the Hunt (beast 14): how many allies join, 5 temporary HP each.
  var hunt = characterResources(c).find(function(r){ return r.key==="Barbarian:call_the_hunt"; });
  var huntMax = callTheHuntMax(c);
  if(hunt && huntMax && hunt.max - hunt.used > 0){
    var counts = [];
    for(var n = 1; n <= huntMax; n++) counts.push({value: String(n), label: n + (n===1 ? " ally joins" : " allies join") + " (+" + 5 * n + " temp HP)"});
    out.push(themedPicker({key: "rage:hunt", groups: {"": counts}, value: "", placeholder: "Call the Hunt", ariaLabel: "Call the Hunt: how many allies join",
      onPick: function(v){
        var gain = 5 * Number(v);
        c.resourcesUsed[hunt.key] = hunt.used + 1;
        if(gain > (Number(c.hp.temp)||0)) c.hp.temp = gain;
        logRoll("Call the Hunt", v + (v==="1" ? " ally joins" : " allies join") + ": +" + gain + " temporary HP. Each can add 1d6 to one hit on each of their turns.");
        save(); renderAll();
      }}));
  }
  // Elemental Cleaver (giant 6): the weapon infused and its damage type.
  var cleaver = elementalCleaver(c);
  if(cleaver){
    var held = (c.inventory||[]).filter(function(i){ return i.type==="weapon" && i.equipped; });
    var cv = document.createElement("div");
    cv.className = "rage-pick";
    var cvLbl = document.createElement("span");
    cvLbl.className = "rage-pick-lbl";
    cvLbl.textContent = "Elemental Cleaver (+" + cleaver.dice + "d6)";
    cv.appendChild(cvLbl);
    if(held.length) cv.appendChild(themedPicker({key: "rage:cleaver-item", groups: {"": held.map(function(i){ return {value: i.id, label: i.name || "Weapon"}; })},
      value: cleaver.item || "", placeholder: "Weapon", ariaLabel: "Elemental Cleaver: the weapon to infuse",
      onPick: function(v){ setElementalCleaver(c, v, null); save(); renderAll(); }}));
    else cvLbl.textContent += ": hold a weapon to infuse it";
    cv.appendChild(themedPicker({key: "rage:cleaver-type", groups: {"": CLEAVER_TYPES}, value: cleaver.type || "", placeholder: "Damage type",
      ariaLabel: "Elemental Cleaver: damage type",
      onPick: function(v){ setElementalCleaver(c, null, v); logRoll("Elemental Cleaver", v + " (+" + cleaver.dice + "d6)."); save(); renderAll(); }}));
    out.push(cv);
  }
  // Storm Aura (storm herald 3) when it activates, and Raging Storm's Desert reaction (14).
  var aura = stormAura(c);
  if(aura){
    var ab = document.createElement("button");
    ab.type = "button"; ab.className = "btn small inv-roll-btn";
    if(aura.env==="Sea"){
      ab.innerHTML = makeDiceSvg() + "Storm Aura " + aura.dice + "d6 lightning · DEX DC " + aura.dc;
      ab.title = "One other creature in your aura makes a Dexterity save, taking half on a success. When you enter a rage, and as a bonus action on each of your turns.";
      ab.addEventListener("click", function(){ performRoll(6, aura.dice, 0, "none", "Storm Aura: lightning (DEX DC " + aura.dc + ", half on a success)"); });
    } else if(aura.env==="Desert"){
      ab.textContent = "Storm Aura: " + aura.step + " fire";
      ab.title = "Every other creature in your aura takes " + aura.step + " fire damage. When you enter a rage, and as a bonus action on each of your turns.";
      ab.addEventListener("click", function(){ logRoll("Storm Aura", aura.step + " fire damage to every other creature in your aura."); });
    } else {
      ab.textContent = "Storm Aura: +" + aura.step + " temp HP";
      ab.title = "Each creature you choose in your aura (you too) gains " + aura.step + " temporary hit points. When you enter a rage, and as a bonus action on each of your turns.";
      ab.addEventListener("click", function(){
        if(aura.step > (Number(c.hp.temp)||0)) c.hp.temp = aura.step;
        logRoll("Storm Aura", "+" + aura.step + " temporary HP for each creature you choose in your aura.");
        save(); renderAll();
      });
    }
    out.push(ab);
    if(aura.ragingStorm && aura.env==="Desert"){
      var rs = document.createElement("button");
      rs.type = "button"; rs.className = "btn small inv-roll-btn";
      rs.textContent = "Raging Storm: " + aura.ragingStorm + " fire · DEX DC " + aura.dc;
      rs.title = "Reaction: right after a creature in your aura hits you, it makes a Dexterity save or takes " + aura.ragingStorm + " fire damage.";
      rs.addEventListener("click", function(){ logRoll("Raging Storm", aura.ragingStorm + " fire damage unless the attacker succeeds on a DEX save (DC " + aura.dc + ")."); });
      out.push(rs);
    }
  }
  var shield = spiritShield(c);
  if(shield){
    var ss = document.createElement("button");
    ss.type = "button"; ss.className = "btn small inv-roll-btn";
    ss.innerHTML = makeDiceSvg() + "Spirit Shield " + shield.dice + "d6";
    ss.title = "Reaction: when a creature you can see within 30 feet takes damage, reduce it by " + shield.dice + "d6" +
      (shield.vengeful ? ". The attacker takes that much force damage (Vengeful Ancestors)." : ".");
    ss.addEventListener("click", function(){
      performRoll(6, shield.dice, 0, "none", "Spirit Shield: damage prevented" + (shield.vengeful ? ", and force damage to the attacker" : ""));
    });
    out.push(ss);
  }
  return out;
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
    // A spell slot pays once the uses are gone (Drake's Breath), or sorcery points (Warping Implosion).
    var slotPay = r.slotMin && remaining<=0 ? spellSlotsLeft(c).find(function(s){ return s.level >= r.slotMin; }) : null;
    var pointsPay = r.againPoints && remaining<=0 && resourceLeft(c, "Sorcerer:sorcery_points") >= r.againPoints ? r.againPoints : 0;
    var slotWords = slotPay ? " (" + ordinal(slotPay.level) + "-level slot)" : pointsPay ? " (" + pointsPay + " points)" : "";
    // A use that rolls a die (Warding Maneuver's d8): spends one and rolls.
    if(r.roll && r.max!==Infinity){
      var rolls = document.createElement("div");
      rolls.className = "inv-roll-actions fx-rolls";
      var rollBtn = document.createElement("button");
      rollBtn.type = "button"; rollBtn.className = "btn small inv-roll-btn res-roll-btn";
      rollBtn.innerHTML = makeDiceSvg();
      rollBtn.appendChild(document.createTextNode((r.roll.button || "Use") + " · " + (r.roll.qty || 1) + "d" + r.roll.die + (r.roll.bonus ? fmtMod(r.roll.bonus) : "") + slotWords));
      var unarmed = r.roll.needs==="meleeOrShield" && !wieldsMeleeWeaponOrShield(c);
      rollBtn.disabled = (remaining<=0 && !slotPay && !pointsPay) || unarmed;
      rollBtn.title = remaining<=0 && !slotPay && !pointsPay ? "None left" : unarmed ? "Needs a melee weapon or a shield in hand" : "Spend one and roll " + (r.roll.qty || 1) + "d" + r.roll.die;
      rollBtn.addEventListener("click", function(){
        if(slotPay){ spendSpellSlot(c, slotPay); save(); renderAll(); }
        else if(pointsPay){ spendResource(c, "Sorcerer:sorcery_points", pointsPay); save(); renderAll(); }
        else setUsed(r.used+1);
        var least = r.roll.min || 0;
        // Destructive Wrath: a Channel Divinity for the maximum.
        var wrath = r.key==="Cleric:wrath_of_the_storm" && resourceLeft(c, "Cleric:channel_divinity") > 0;
        performRoll(r.roll.die, r.roll.qty || 1, r.roll.bonus || 0, "none", r.roll.label, wrath ? function(x){
          if(!x) return null;
          var top = (r.roll.qty || 1) * r.roll.die;
          return x.total >= top ? null : {lead: "Destructive Wrath:", options: [{label: "Maximum " + top + " (Channel Divinity)", title: "Spend your Channel Divinity to deal the maximum instead",
            use: function(){
              if(!spendChannel(c, "Cleric:channel_divinity")) return null;
              save(); renderAll();
              return {bonus: top - x.total, log: "Destructive Wrath"};
            }}]};
        } : r.roll.min || r.roll.temp ? {
          adjust: least ? function(x){ return x.total < least ? {total: least, note: "at least " + least} : null; } : null,
          // Temporary hit points don't stack: keep the higher.
          onResult: r.roll.temp ? function(x){
            var got = Math.max(x.total, least);
            if(got > (Number(c.hp.temp)||0)){ c.hp.temp = got; save(); renderSidebar(); renderAll(); }
          } : null
        } : null);
      });
      rolls.appendChild(rollBtn);
      info.appendChild(rolls);
    }
    // No roll: the slot or the points just pay (summoning the drake again).
    if(pointsPay && !r.roll){
      var againPts = document.createElement("div");
      againPts.className = "inv-roll-actions fx-rolls";
      var ptsBtn = document.createElement("button");
      ptsBtn.type = "button"; ptsBtn.className = "btn small inv-roll-btn res-roll-btn";
      ptsBtn.textContent = "Again" + slotWords;
      ptsBtn.title = "Spend sorcery points to use it again";
      ptsBtn.addEventListener("click", function(){
        spendResource(c, "Sorcerer:sorcery_points", pointsPay);
        logRoll(r.name, "Used again with " + pointsPay + " sorcery points.");
        save(); renderAll();
      });
      againPts.appendChild(ptsBtn);
      info.appendChild(againPts);
    }
    if(slotPay && !r.roll){
      var again = document.createElement("div");
      again.className = "inv-roll-actions fx-rolls";
      var againBtn = document.createElement("button");
      againBtn.type = "button"; againBtn.className = "btn small inv-roll-btn res-roll-btn";
      againBtn.textContent = "Again" + slotWords;
      againBtn.title = "Spend a spell slot to use it again";
      againBtn.addEventListener("click", function(){
        spendSpellSlot(c, slotPay);
        logRoll(r.name, "Used again with a " + ordinal(slotPay.level) + "-level spell slot.");
        save(); renderAll();
      });
      again.appendChild(againBtn);
      info.appendChild(again);
    }
    // Second Wind (fighter 1): a use for 1d10 + fighter level, and
    // Rallying Cry's healing for allies (Banneret 3).
    var sw = r.key==="Fighter:second_wind" && secondWind(c);
    if(sw){
      var swRow = document.createElement("div");
      swRow.className = "inv-roll-actions fx-rolls";
      var swBtn = document.createElement("button");
      swBtn.type = "button"; swBtn.className = "btn small inv-roll-btn res-roll-btn";
      swBtn.innerHTML = makeDiceSvg();
      swBtn.appendChild(document.createTextNode("Heal 1d10+" + sw.bonus));
      var swFull = (Number(c.hp.current)||0) >= maxHp(c);
      swBtn.disabled = remaining<=0 || (swFull && !sw.rally);
      swBtn.title = remaining<=0 ? "Used until a short or long rest" : swFull && !sw.rally ? "You're at full hit points"
        : "Bonus action: regain 1d10 + " + sw.bonus + " hit points." + (sw.rally ? " Rallying Cry: up to three allies within 60 feet who can see or hear you regain " + sw.rally + " hit points each." : "");
      swBtn.addEventListener("click", function(){
        var roll = Math.floor(Math.random()*10)+1, healed = roll + sw.bonus;
        c.hp.current = clamp((Number(c.hp.current)||0) + healed, 0, maxHp(c));
        c.resourcesUsed[r.key] = r.used + 1;
        logRoll("Second Wind (1d10+" + sw.bonus + ")", roll + " +" + sw.bonus + " = " + healed + " HP healed" + (sw.rally ? ". Rallying Cry: up to three allies regain " + sw.rally + " HP each" : ""));
        save(); renderAll();
      });
      swRow.appendChild(swBtn);
      info.appendChild(swRow);
    }
    // Reclaim Potential (Echo Knight 15): 2d6 + CON temporary HP when the
    // echo is destroyed by damage, if you have none.
    if(r.key==="Fighter:reclaim_potential"){
      var conM = mod(abilityScore(c, "con"));
      var rpRow = document.createElement("div");
      rpRow.className = "inv-roll-actions fx-rolls";
      var rpBtn = document.createElement("button");
      rpBtn.type = "button"; rpBtn.className = "btn small inv-roll-btn res-roll-btn";
      rpBtn.innerHTML = makeDiceSvg();
      rpBtn.appendChild(document.createTextNode("Temp HP 2d6" + fmtMod(conM)));
      var hasTemp = (Number(c.hp.temp)||0) > 0;
      rpBtn.disabled = remaining<=0 || hasTemp;
      rpBtn.title = remaining<=0 ? "None left until a long rest" : hasTemp ? "Only when you have no temporary hit points" : "When your echo is destroyed by taking damage";
      rpBtn.addEventListener("click", function(){
        var a = Math.floor(Math.random()*6)+1, b2 = Math.floor(Math.random()*6)+1, got = Math.max(0, a + b2 + conM);
        c.hp.temp = got;
        c.resourcesUsed[r.key] = r.used + 1;
        logRoll("Reclaim Potential (2d6" + fmtMod(conM) + ")", "[" + a + ", " + b2 + "] " + fmtMod(conM) + " = " + got + " temporary HP");
        save(); renderAll();
      });
      rpRow.appendChild(rpBtn);
      info.appendChild(rpRow);
    }
    // Survivor (Champion 18): regain 5 + CON at the start of a turn, at half HP or less.
    var surv = r.key==="Fighter:survivor" && survivorHeal(c);
    if(surv){
      var svRow = document.createElement("div");
      svRow.className = "inv-roll-actions fx-rolls";
      var svBtn = document.createElement("button");
      svBtn.type = "button"; svBtn.className = "btn small inv-roll-btn res-roll-btn";
      svBtn.textContent = "Heal " + surv.heal;
      svBtn.disabled = !surv.due;
      svBtn.title = surv.due ? "Start of your turn: regain " + surv.heal + " hit points" : "Only while you have half your hit points or fewer (not at 0)";
      svBtn.addEventListener("click", function(){
        c.hp.current = clamp((Number(c.hp.current)||0) + surv.heal, 0, maxHp(c));
        logRoll("Survivor", "Regained " + surv.heal + " HP at the start of the turn.");
        save(); renderAll();
      });
      svRow.appendChild(svBtn);
      info.appendChild(svRow);
    }
    // A use that restores a set number of hit points (Wholeness of Body).
    if(r.heal && r.max!==Infinity){
      var hr = document.createElement("div");
      hr.className = "inv-roll-actions fx-rolls";
      var hb = document.createElement("button");
      hb.type = "button"; hb.className = "btn small inv-roll-btn res-roll-btn";
      hb.textContent = "Heal " + r.heal;
      var hbFull = (Number(c.hp.current)||0) >= maxHp(c);
      hb.disabled = remaining<=0 || hbFull;
      hb.title = remaining<=0 ? "None left" : hbFull ? "You're at full hit points" : "Spend one and regain " + r.heal + " hit points";
      hb.addEventListener("click", function(){
        c.hp.current = clamp((Number(c.hp.current)||0) + r.heal, 0, maxHp(c));
        c.resourcesUsed[r.key] = r.used + 1;
        logRoll(r.name, "Regained " + r.heal + " HP.");
        save(); renderAll();
      });
      hr.appendChild(hb);
      info.appendChild(hr);
    }
    // Everything ki can pay for, in one list.
    if(r.key==="Monk:ki") info.appendChild(kiPicker(c));
    if(r.key==="Paladin:channel_divinity") info.appendChild(channelPicker(c, "Paladin"));
    if(r.key==="Cleric:channel_divinity") info.appendChild(channelPicker(c, "Cleric"));
    if(r.key==="Cleric:divine_intervention") info.appendChild(interventionRow(c, r));
    if(r.key==="Cleric:blessing_of_the_forge" && remaining > 0) info.appendChild(forgePicker(c, r));
    if(r.key==="Paladin:lay_on_hands") info.appendChild(layOnHandsRow(c));
    var gunRow = gunslingerResourceRow(c, r); // Quick Patch, Honed Instinct
    if(gunRow) info.appendChild(gunRow);
    var druidRow = druidResourceRow(c, r); // Wild Shape, Natural Recovery, Cosmic Omen, Balm
    if(druidRow) info.appendChild(druidRow);
    var bardRow = bardResourceRow(c, r); // Bardic Inspiration's list and tale, Spirit Session
    if(bardRow) info.appendChild(bardRow);
    var sorcRow = sorcererResourceRow(c, r); // Sorcery points' list, the surge table, the phases
    if(sorcRow) info.appendChild(sorcRow);
    // Quickened Healing (Tasha's, monk 4): 2 ki for a Martial Arts die
    // plus the proficiency bonus of healing.
    var qh = r.key==="Monk:ki" && quickenedHealing(c);
    if(qh){
      var heals = document.createElement("div");
      heals.className = "inv-roll-actions fx-rolls";
      var healBtn = document.createElement("button");
      healBtn.type = "button"; healBtn.className = "btn small inv-roll-btn res-roll-btn";
      healBtn.innerHTML = makeDiceSvg();
      healBtn.appendChild(document.createTextNode("Quickened Healing · " + qh.cost + " ki"));
      var atFull = (Number(c.hp.current)||0) >= maxHp(c);
      healBtn.disabled = remaining < qh.cost || atFull;
      healBtn.title = remaining < qh.cost ? "Not enough ki left" : atFull ? "You're at full hit points"
        : "Action: spend " + qh.cost + " ki and heal 1d" + qh.die + " + " + qh.bonus;
      healBtn.addEventListener("click", function(){
        var roll = Math.floor(Math.random()*qh.die)+1, healed = roll + qh.bonus;
        c.hp.current = clamp((Number(c.hp.current)||0) + healed, 0, maxHp(c));
        c.resourcesUsed[r.key] = r.used + qh.cost;
        logRoll("Quickened Healing (1d" + qh.die + fmtMod(qh.bonus) + ")", roll + " " + fmtMod(qh.bonus) + " = " + healed + " HP healed (" + qh.cost + " ki)");
        save(); renderAll();
      });
      heals.appendChild(healBtn);
      info.appendChild(heals);
    }
    // Harness Divine Power (Tasha's, cleric 2, paladin 3): a Channel
    // Divinity for a spent spell slot. Buttons only while one is spent.
    var hdpClass = /:harness_divine_power$/.test(r.key) && r.key.split(":")[0];
    var hdp = hdpClass && harnessDivinePower(c, hdpClass);
    if(hdp && hdp.levels.length){
      var slotsRow = document.createElement("div");
      slotsRow.className = "inv-roll-actions fx-rolls";
      var why = !hdp.usesLeft ? "Used up until a long rest" : !hdp.channelLeft ? "No Channel Divinity left" : "";
      hdp.levels.forEach(function(l){
        var slotBtn = document.createElement("button");
        slotBtn.type = "button"; slotBtn.className = "btn small inv-roll-btn res-roll-btn";
        slotBtn.textContent = "Get back a " + ordinal(l) + "-level slot";
        slotBtn.disabled = !!why;
        slotBtn.title = why || "Bonus action: spend a Channel Divinity to get back one spent " + ordinal(l) + "-level spell slot";
        slotBtn.addEventListener("click", function(){
          if(!useHarnessDivinePower(c, hdpClass, l)) return;
          logRoll("Harness Divine Power", "Got back a " + ordinal(l) + "-level spell slot (1 Channel Divinity)");
          save(); renderAll();
        });
        slotsRow.appendChild(slotBtn);
      });
      info.appendChild(slotsRow);
    }
    // Wild Companion (Tasha's, druid 2): a use of Wild Shape casts Find
    // Familiar, a fey that lasts half the druid level in hours.
    var wildHours = r.key==="Druid:wild_shape" && wildCompanionHours(c);
    if(wildHours){
      var wildRow = document.createElement("div");
      wildRow.className = "inv-roll-actions fx-rolls";
      var wildBtn = document.createElement("button");
      wildBtn.type = "button"; wildBtn.className = "btn small inv-roll-btn res-roll-btn";
      wildBtn.textContent = "Wild Companion · 1 use";
      var lasts = wildHours + (wildHours===1 ? " hour" : " hours");
      wildBtn.disabled = remaining<=0;
      wildBtn.title = remaining<=0 ? "No Wild Shape uses left" : "Action: spend a use of Wild Shape to cast Find Familiar. The familiar is a fey and lasts " + lasts + ".";
      wildBtn.addEventListener("click", function(){
        summonWildCompanion(c);
        logRoll("Wild Companion", "Cast Find Familiar with a use of Wild Shape. The fey familiar lasts " + lasts + ".");
        var form = c.companions && c.companions.familiar && c.companions.familiar.choice;
        showActionToast(form ? "Your " + form.toLowerCase() + " appears. It lasts " + lasts + "." : "Your familiar appears. Choose its form on the Companions tab.");
        if(r.max!==Infinity) setUsed(r.used+1); else { save(); renderAll(); }
      });
      wildRow.appendChild(wildBtn);
      info.appendChild(wildRow);
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
  // A Phantom's soul trinkets (Tokens of the Departed): how many are held.
  var trinkets = soulTrinkets(c);
  if(trinkets) list.appendChild(soulTrinketRow(c, trinkets));
  card.appendChild(list);
  return card;
}
/* Soul trinkets held, with a button for one gained (a creature dies
   within 30 feet, a reaction) and one used up. */
function soulTrinketRow(c, t){
  var row = document.createElement("div");
  row.className = "res-row";
  var info = document.createElement("div");
  info.className = "res-info";
  var name = document.createElement("div");
  name.className = "res-name";
  name.textContent = "Soul Trinkets";
  info.appendChild(name);
  var hint = document.createElement("div");
  hint.className = "res-hint";
  hint.textContent = "While you carry one: advantage on death saves and Constitution saves. Destroy one to use Wails from the Grave without a use, to use Ghost Walk again, or (as an action) to ask its spirit one question. (Phantom)";
  info.appendChild(hint);
  row.appendChild(info);
  var ctrl = document.createElement("div");
  ctrl.className = "res-ctrl";
  var count = document.createElement("div");
  count.className = "res-count";
  count.innerHTML = "<b>" + t.held + "</b> / " + t.max;
  ctrl.appendChild(count);
  var steps = document.createElement("div");
  steps.className = "res-steps";
  [["down", "Destroy a soul trinket", -1], ["up", "Gain a soul trinket (a creature you can see dies within 30 feet)", 1]].forEach(function(s){
    var b = document.createElement("button");
    b.type = "button"; b.className = "stat-arrow-btn stat-arrow-" + s[0];
    b.innerHTML = makeStatArrowSvg(s[0]);
    b.title = s[1]; b.setAttribute("aria-label", s[1]);
    b.disabled = s[2] < 0 ? t.held <= 0 : t.held >= t.max;
    b.addEventListener("click", function(){
      c.soulTrinkets = Math.max(0, Math.min(t.max, t.held + s[2]));
      logRoll("Soul trinkets", (s[2] > 0 ? "Gained one" : "Destroyed one") + ": " + c.soulTrinkets + " held.");
      save(); renderAll();
    });
    steps.appendChild(b);
  });
  ctrl.appendChild(steps);
  row.appendChild(ctrl);
  return row;
}
