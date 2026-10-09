import { save } from "../../core/state.js";
import { clamp, mod, fmtMod, totalLevel, hitDicePools, spendHitDie, recoverHitDice, barbarianClassEntry, barbarianRageMax, barbarianRageDamage, computeArmorClass, computeInitiative, characterResources, restoreResources, maxHp, hpBonuses, computeSpeed, hitDieHealing, heavyArmorMasterActive, endAllEffects, endEffect } from "../../core/helpers.js";
import { CLASSES_INFO } from "../../data/classes.js";
import { makeCard, renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { elixirsOnLongRest } from "../../core/artificer.js";
import { restoreCompanions } from "../../core/companions.js";
import { renderDeathSaves } from "./death-saves.js";
import { renderEffectsCard } from "./effects.js";
import { openPrepareSheet } from "./spells.js";
import { preparedState } from "../../core/spells-known.js";

function preparesSpells(c){ return (c.classes||[]).some(function(cl){ return preparedState(c, cl.name); }); }

/* ---- Vitals panel ---- */
export function renderVitalsPanel(c){
  var panel = document.createElement("div");
  // Max HP with Tough's and Dwarven Toughness's bonus; c.hp.max is the
  // part the stepper edits.
  var hpMax = maxHp(c);
  var bonusTitle = hpBonuses(c).map(function(b){ return b.name+" (+"+b.value+")"; }).join(", ");
  if(bonusTitle) bonusTitle = "Includes "+bonusTitle;

  var card = makeCard("Hit points & defense");
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
    if(wentDown){ c.deathSaves = {success:0, fail:0}; endAllEffects(c); }
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
      if(c.hp.current > hpMax - 1) c.hp.current = hpMax - 1;
      save(); renderSidebar(); renderAll();
    }
  });

  var maxValSpan = document.createElement("span");
  maxValSpan.className = "stat-score-val";
  maxValSpan.textContent = hpMax;
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

  var initHeader = document.createElement("div");
  initHeader.className = "lbl";
  initHeader.textContent = "Initiative";
  initBox.appendChild(initHeader);

  var initValDiv = document.createElement("div");
  initValDiv.className = "init-hero-val";
  initValDiv.textContent = fmtMod(initTotal);
  initValDiv.title = "Click to roll initiative (1d20" + fmtMod(initTotal) + ")";
  initBox.appendChild(initValDiv);

  var initHint = document.createElement("div");
  initHint.className = "vital-hint";
  initHint.textContent = initResult.short;
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
    performRoll(20,1,initTotal,"none","Initiative");
  });
  grid.appendChild(initBox);

  var speed = computeSpeed(c);
  var speedBox = smallVital("Speed","speed",null,speed.parts.length ? "per turn, incl. "+speed.parts.map(function(p){
    return p.name+" "+fmtMod(p.value)+(p.why ? " ("+p.why+")" : "");
  }).join(", ") : "per turn",5," ft",speed.bonus);
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
  panel.appendChild(card);

  // Hit dice + rest
  var restCard = makeCard("Hit dice & rest");
  var hd = totalLevel(c);
  // Multiclassed characters have a mix of dice (e.g. 3d12 + 2d6), counted
  // per size; spending rolls the largest die left.
  var pools = hitDicePools(c);
  var hdRemaining = pools.reduce(function(n, p){ return n + p.total - p.used; }, 0);
  var hdP = document.createElement("p");
  hdP.style.fontSize="13px"; hdP.style.margin="0 0 8px";
  hdP.textContent = "Hit dice remaining: "+hdRemaining+" / "+hd+
    (pools.length > 1 ? "  ("+pools.map(function(p){ return (p.total-p.used)+"/"+p.total+" d"+p.die; }).join(", ")+")" : "  (d"+pools[0].die+")");
  restCard.appendChild(hdP);

  var restRow = document.createElement("div");
  restRow.className = "rest-row";

  var spendBtn = document.createElement("button");
  spendBtn.className = "btn small"; spendBtn.textContent = "Spend 1 hit die";
  spendBtn.disabled = hdRemaining<=0;
  spendBtn.addEventListener("click", function(){
    var die = spendHitDie(c);
    if(!die) return;
    var conMod = mod(c.abilities.con);
    var roll = Math.floor(Math.random()*die)+1;
    var healed = hitDieHealing(c, roll);
    c.hp.current = clamp(c.hp.current+healed, 0, hpMax);
    logRoll("Hit die (d"+die+fmtMod(conMod)+")", roll+" "+fmtMod(conMod)+" = "+healed+" HP healed"+(healed > Math.max(1, roll+conMod) ? " (Durable minimum)" : ""));
    save(); renderAll();
  });
  restRow.appendChild(spendBtn);

  var shortRestBtn = document.createElement("button");
  shortRestBtn.className = "btn small"; shortRestBtn.textContent = "Short rest";
  shortRestBtn.title = "Restores short-rest resources; spend hit dice to heal";
  shortRestBtn.addEventListener("click", function(){
    var pactNote = "";
    if(c.spellcasting.pact && c.spellcasting.pact.used){ c.spellcasting.pact.used = 0; pactNote = " Pact slots restored."; }
    var restored = restoreResources(c, "short");
    var resNote = restored.length ? " Restored: "+restored.join(", ")+"." : "";
    var ended = endAllEffects(c);
    if(ended.length) resNote += " Ended: "+ended.join(", ")+".";
    logRoll("Short rest taken", "Spend hit dice as needed to heal."+pactNote+resNote);
    save(); renderAll();
  });
  restRow.appendChild(shortRestBtn);

  var longRestBtn = document.createElement("button");
  longRestBtn.className = "btn small primary"; longRestBtn.textContent = "Long rest";
  longRestBtn.addEventListener("click", function(){
    confirmDialog(
      "Take a long rest?",
      "This resets HP to full, clears temp HP and death saves, restores spell slots, rage and class resources, and recovers hit dice."+
        (preparesSpells(c) ? " Afterwards you can choose today's prepared spells." : ""),
      function(){
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
        restoreResources(c, "long");
        restoreCompanions(c);
        var elixirs = elixirsOnLongRest(c);
        logRoll("Long rest taken", "HP and spell slots restored; "+recovered+" hit dice recovered."+
          (elixirs.length ? " New elixirs: "+elixirs.join(", ")+"." : ""));
        save(); renderAll();
        // A cleric, druid, paladin, wizard or artificer picks today's
        // spells after a long rest.
        openPrepareSheet(c, true);
      }
    );
  });
  restRow.appendChild(longRestBtn);

  restCard.appendChild(restRow);
  panel.appendChild(restCard);

  var barbClass = barbarianClassEntry(c);
  if(barbClass){
    var rageCard = makeCard("Rage");
    var rageMax = barbarianRageMax(barbClass.level||1);
    var rageMaxLabel = rageMax===Infinity ? "∞" : rageMax;
    var rageUsed = clamp(c.rage.used||0, 0, rageMax===Infinity ? c.rage.used||0 : rageMax);
    var rageRemaining = rageMax===Infinity ? "∞" : Math.max(0, rageMax-rageUsed);

    var rageP = document.createElement("p");
    rageP.style.fontSize="13px"; rageP.style.margin="0 0 10px";
    rageP.textContent = "Rages remaining: "+rageRemaining+" / "+rageMaxLabel+" · Rage damage +"+barbarianRageDamage(barbClass.level||1);
    rageCard.appendChild(rageP);

    var rageBtn = document.createElement("button");
    rageBtn.className = "btn small"+(c.rage.active ? "" : " primary");
    rageBtn.textContent = c.rage.active ? "End Rage" : "Enter Rage";
    var atCap = rageMax!==Infinity && rageUsed>=rageMax;
    rageBtn.disabled = !c.rage.active && atCap;
    rageBtn.addEventListener("click", function(){
      if(c.rage.active){
        c.rage.active = false;
      } else {
        if(rageMax!==Infinity && (c.rage.used||0)>=rageMax) return;
        c.rage.active = true;
        c.rage.used = (c.rage.used||0)+1;
      }
      save(); renderAll();
    });
    rageCard.appendChild(rageBtn);

    if(c.rage.active) rageCard.classList.add("raging");

    var rageFeature = CLASSES_INFO["Barbarian"].features.find(function(f){ return f.name==="Rage"; });
    if(rageFeature){
      var rageHint = document.createElement("p");
      rageHint.style.cssText = "font-size:12px;color:var(--text-on-parch-dim);margin:10px 0 0;line-height:1.5;";
      rageHint.textContent = rageFeature.text;
      rageCard.appendChild(rageHint);
    }

    panel.appendChild(rageCard);
  }

  var effectsCard = renderEffectsCard(c);
  if(effectsCard) panel.appendChild(effectsCard);

  var resources = characterResources(c);
  if(resources.length) panel.appendChild(renderResourcesCard(c, resources));

  return panel;
}

/* ---- Resources ----
   One row per limited-use class feature or feat: pips for small counts, a number for
   point pools (Ki, Lay on Hands), with use/regain buttons. */
var RESOURCE_PIP_LIMIT = 10;

function renderResourcesCard(c, resources){
  var card = makeCard(resources.some(function(r){ return r.key.indexOf("feat:")===0; }) ? "Class & feat resources" : "Class resources");
  var list = document.createElement("div");
  list.className = "res-list";
  resources.forEach(function(r){
    var remaining = r.max - r.used;
    var row = document.createElement("div");
    row.className = "res-row" + (remaining===0 ? " spent" : "");

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
    if(!r.pool && r.max <= RESOURCE_PIP_LIMIT){
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
      // Using Wild Shape again ends Symbiotic Entity.
      if(r.key==="Druid:wild_shape" && n > r.used) endEffect(c, "symbiotic_entity");
      if(n) c.resourcesUsed[r.key] = n; else delete c.resourcesUsed[r.key];
      save(); renderAll();
    }
    list.appendChild(row);
  });
  card.appendChild(list);
  return card;
}
