import { save } from "../../core/state.js";
import { clamp, mod, fmtMod, totalLevel, primaryHitDie, barbarianClassEntry, barbarianRageMax, computeArmorClass } from "../../core/helpers.js";
import { CLASSES_INFO } from "../../data/classes.js";
import { makeCard, renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";

/* ---- Vitals panel ---- */
export function renderVitalsPanel(c){
  var panel = document.createElement("div");

  var card = makeCard("Hit points & defense");
  var grid = document.createElement("div");
  grid.className = "vitals-grid";

  // HP box
  var hpBox = document.createElement("div");
  hpBox.className = "vital-box hp-vital-box";
  hpBox.innerHTML = '<div class="lbl">Hit Points</div>';

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
  maxSpan.textContent = c.hp.max;

  heroDisplay.appendChild(curSpan);
  heroDisplay.appendChild(slashSpan);
  heroDisplay.appendChild(maxSpan);

  if((Number(c.hp.temp)||0) > 0){
    var tempBadge = document.createElement("span");
    tempBadge.className = "hp-temp-badge";
    tempBadge.textContent = "+" + c.hp.temp + " temp";
    heroDisplay.appendChild(tempBadge);
  }
  hpBox.appendChild(heroDisplay);

  function applyQuickDamage(n){
    if(n <= 0) return;
    var temp = Number(c.hp.temp) || 0;
    if(temp > 0){
      var absorbed = Math.min(temp, n);
      c.hp.temp = temp - absorbed;
      n -= absorbed;
    }
    c.hp.current = Math.max(0, (Number(c.hp.current)||0) - n);
    save(); renderSidebar(); renderAll();
  }

  function applyQuickHeal(n){
    if(n <= 0) return;
    c.hp.current = clamp((Number(c.hp.current)||0) + n, 0, c.hp.max);
    save(); renderSidebar(); renderAll();
  }

  // Quick HP controls
  var hpControlsRow = document.createElement("div");
  hpControlsRow.className = "hp-actions-row";

  var dmg5Btn = document.createElement("button");
  dmg5Btn.type = "button";
  dmg5Btn.className = "btn small danger quick-adj-btn";
  dmg5Btn.textContent = "-5";
  dmg5Btn.title = "Take 5 damage";
  dmg5Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickDamage(5);
  });
  hpControlsRow.appendChild(dmg5Btn);

  var dmg1Btn = document.createElement("button");
  dmg1Btn.type = "button";
  dmg1Btn.className = "btn small danger quick-adj-btn";
  dmg1Btn.textContent = "-1";
  dmg1Btn.title = "Take 1 damage";
  dmg1Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickDamage(1);
  });
  hpControlsRow.appendChild(dmg1Btn);

  var heal1Btn = document.createElement("button");
  heal1Btn.type = "button";
  heal1Btn.className = "btn small quick-adj-btn quick-heal-btn";
  heal1Btn.textContent = "+1";
  heal1Btn.title = "Heal 1 HP";
  heal1Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickHeal(1);
  });
  hpControlsRow.appendChild(heal1Btn);

  var heal5Btn = document.createElement("button");
  heal5Btn.type = "button";
  heal5Btn.className = "btn small quick-adj-btn quick-heal-btn";
  heal5Btn.textContent = "+5";
  heal5Btn.title = "Heal 5 HP";
  heal5Btn.addEventListener("click", function(e){
    e.stopPropagation();
    applyQuickHeal(5);
  });
  hpControlsRow.appendChild(heal5Btn);

  var fullBtn = document.createElement("button");
  fullBtn.type = "button";
  fullBtn.className = "btn small quick-adj-btn quick-heal-btn";
  fullBtn.textContent = "Full";
  fullBtn.title = "Restore to full HP";
  fullBtn.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.current = c.hp.max;
    save(); renderSidebar(); renderAll();
  });
  hpControlsRow.appendChild(fullBtn);

  hpBox.appendChild(hpControlsRow);

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
      if(c.hp.current > c.hp.max) c.hp.current = c.hp.max;
      save(); renderSidebar(); renderAll();
    }
  });

  var maxValSpan = document.createElement("span");
  maxValSpan.className = "stat-score-val";
  maxValSpan.textContent = c.hp.max;

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
    var ds = document.createElement("div");
    ds.className = "death-saves";
    ["success","fail"].forEach(function(kind){
      var grp = document.createElement("div"); grp.className="grp";
      var lbl = document.createElement("div"); lbl.textContent = kind==="success"?"Successes":"Failures";
      var boxes = document.createElement("div"); boxes.className="boxes";
      for(var i=0;i<3;i++){
        var cb = document.createElement("input"); cb.type="checkbox";
        cb.checked = i < (c.deathSaves[kind]||0);
        (function(i){
          cb.addEventListener("change", function(){
            c.deathSaves[kind] = cb.checked ? i+1 : i;
            save(); renderAll();
          });
        })(i);
        boxes.appendChild(cb);
      }
      grp.appendChild(lbl); grp.appendChild(boxes);
      ds.appendChild(grp);
    });
    hpBox.appendChild(ds);
  }
  grid.appendChild(hpBox);

  function smallVital(label, key, isNested, hint, step, suffix){
    step = step || 1;
    suffix = suffix || "";
    var box = document.createElement("div");
    box.className = "vital-box";
    box.innerHTML = '<div class="lbl">'+label+'</div>';

    var val = isNested ? c[isNested][key] : c[key];
    val = Number(val) || 0;

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

    var valSpan = document.createElement("span");
    valSpan.className = "stat-score-val vital-val";
    valSpan.textContent = val + suffix;

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
    stepper.appendChild(valSpan);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    if(hint){
      var hintEl = document.createElement("div");
      hintEl.className = "vital-hint";
      hintEl.textContent = hint;
      box.appendChild(hintEl);
    }
    return box;
  }
  var acResult = computeArmorClass(c);
  c.ac = acResult.value;

  var acBox = document.createElement("div");
  acBox.className = "vital-box ac-vital-box";
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
  acHint.textContent = acResult.breakdown;
  acBox.appendChild(acHint);

  var acMiscRow = document.createElement("div");
  acMiscRow.className = "init-misc-row";
  var acMiscLbl = document.createElement("span");
  acMiscLbl.textContent = "Misc:";
  acMiscRow.appendChild(acMiscLbl);

  var acMiscStepper = document.createElement("div");
  acMiscStepper.className = "stat-stepper";
  acMiscStepper.style.maxWidth = "84px";

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
  initBox.className = "vital-box init-vital-box";
  var dexMod = mod(c.abilities.dex);
  var initTotal = dexMod + (Number(c.initiativeMisc)||0);

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
  initHint.textContent = "DEX (" + fmtMod(dexMod) + ") + misc";
  initBox.appendChild(initHint);

  var miscStepperRow = document.createElement("div");
  miscStepperRow.className = "init-misc-row";
  var miscLbl = document.createElement("span");
  miscLbl.textContent = "Misc:";
  miscStepperRow.appendChild(miscLbl);

  var miscStepper = document.createElement("div");
  miscStepper.className = "stat-stepper";
  miscStepper.style.maxWidth = "84px";

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

  grid.appendChild(smallVital("Speed","speed",null,"ft per turn",5," ft"));

  card.appendChild(grid);
  panel.appendChild(card);

  // Hit dice + rest
  var restCard = makeCard("Hit dice & rest");
  var hd = totalLevel(c);
  var hdUsed = clamp(c.hitDiceUsed||0,0,hd);
  var hdRemaining = hd-hdUsed;
  var hdP = document.createElement("p");
  hdP.style.fontSize="13px"; hdP.style.margin="0 0 8px";
  hdP.textContent = "Hit dice remaining: "+hdRemaining+" / "+hd+"  (d"+primaryHitDie(c)+")";
  restCard.appendChild(hdP);

  var restRow = document.createElement("div");
  restRow.className = "rest-row";

  var spendBtn = document.createElement("button");
  spendBtn.className = "btn small"; spendBtn.textContent = "Spend 1 hit die";
  spendBtn.addEventListener("click", function(){
    if(hdRemaining<=0){ return; }
    var die = primaryHitDie(c);
    var conMod = mod(c.abilities.con);
    var roll = Math.floor(Math.random()*die)+1;
    var healed = Math.max(1, roll+conMod);
    c.hitDiceUsed = hdUsed+1;
    c.hp.current = clamp(c.hp.current+healed, 0, c.hp.max);
    logRoll("Hit die (d"+die+"+"+conMod+")", roll+" "+fmtMod(conMod)+" = "+healed+" HP healed");
    save(); renderAll();
  });
  restRow.appendChild(spendBtn);

  var shortRestBtn = document.createElement("button");
  shortRestBtn.className = "btn small"; shortRestBtn.textContent = "Short rest";
  shortRestBtn.title = "Reminder to spend hit dice; does not auto-heal";
  shortRestBtn.addEventListener("click", function(){
    logRoll("Short rest taken", "Spend hit dice as needed to heal.");
    save(); renderAll();
  });
  restRow.appendChild(shortRestBtn);

  var longRestBtn = document.createElement("button");
  longRestBtn.className = "btn small primary"; longRestBtn.textContent = "Long rest";
  longRestBtn.addEventListener("click", function(){
    c.hp.current = c.hp.max;
    c.hp.temp = 0;
    c.deathSaves = {success:0, fail:0};
    var recovered = Math.max(1, Math.floor(hd/2));
    c.hitDiceUsed = clamp(hdUsed-recovered, 0, hd);
    Object.keys(c.spellcasting.slots).forEach(function(lvl){
      c.spellcasting.slots[lvl].used = 0;
    });
    c.rage.used = 0;
    c.rage.active = false;
    logRoll("Long rest taken", "HP and spell slots restored; "+recovered+" hit dice recovered.");
    save(); renderAll();
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
    rageP.textContent = "Rages remaining: "+rageRemaining+" / "+rageMaxLabel;
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

  return panel;
}
