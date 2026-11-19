import { save } from "../../core/state.js";
import { WILDS_OPTIONS, POWER_OPTIONS, wildsChoiceDue, lifeGivingDice, branchesDc, longTravelReady, hasRageOfGods, divineFormOn, revivificationHp, spendRage, ragesLeft, persistentRageReady, usePersistentRage, useTides, spendResource, clamp, mod, fmtMod, totalLevel, hitDicePools, barbarianClassEntry, barbarianRageMax, barbarianRageDamage, computeArmorClass, computeInitiative, initiativeRollMode, characterResources, resourceIsNumber, maxHp, fullMaxHp, hpBonuses, computeSpeed, usesVariant, heavyArmorMasterActive, heavyArmorMasterAmount, hasFeat, endEffect, hpMaxHalved, resistsAllDamage, raceWards, exhaustionLevel, wieldsMeleeWeaponOrShield, regainOnInitiative, soulTrinkets, startRage, endRage, canFrenzy, ragePerks, spiritShield, wildSurgeNow, wildSurgeDc, rollWildSurge, chooseWildSurge, classLevelOf, parseDiceNotation, beastFormDue, chooseBeastForm, BEAST_FORMS, callTheHuntMax, elementalCleaver, setElementalCleaver, CLEAVER_TYPES, stormAura, stormSoulResistances, effectResistances, featureResistances, ordinal, protectiveSpirit, spellSlotsLeft, spendSpellSlot, drakeResistance, saintResistance, resourceLeft, spendChannel, effectOn, hpAfterDamage, hpDragChange, hpChangeLimits, attacksPerAction, bonusActionAttacks, uncannyMetabolism, useUncannyMetabolism, perfectFocusGain, usePerfectFocus, takeDamage, healHp, spendHitDieToHeal, shortRest, shortRestNote, longRest, longRestNote } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg, makeInfoSvg, makeFlameSvg, makeDiceSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { stepper } from "../../ui/card-parts.js";
import { showActionToast } from "../../ui/toast.js";
import { WILD_SURGES } from "../../data/effects.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { paladinResourceRow } from "./paladin.js";
import { renderChannelCard, channelResourceKey } from "./channel-divinity.js";
import { clericResourceRow, harnessDivinePowerRow } from "./cleric.js";
import { gunslingerResourceRow } from "./gunslinger.js";
import { useNextCheck, coinResistances } from "../../core/magic-items.js";
import { infusionResistances } from "../../core/infusion-effects.js";
import { renderDeathSaves } from "./death-saves.js";
import { renderEffectsCard } from "./effects.js";
import { renderRemindCard } from "./reminders.js";
import { renderWildShapeCard, druidResourceRow, wildCompanionButton } from "./druid.js";
import { druidResistances } from "../../core/druid.js";
import { bardResourceRow, songOfRestButton } from "./bard.js";
import { sorcererResourceRow } from "./sorcerer.js";
import { warlockResourceRow } from "./warlock.js";
import { wizardResourceRow } from "./wizard.js";
import { renderConditionsButton, renderConditionsStrip, longRestConditionsChoice } from "./conditions.js";
import { openPrepareSheet } from "./spells.js";
import { preparedState } from "../../core/spells-known.js";
import { flash, pipChanged, pipsRefilled, restScene, floatDelta } from "../../ui/fx.js";
import { playShortRest, playLongRest } from "../../ui/sound.js";
import { abilityScore, abilityScores } from "../../core/ability-scores.js";
import { classFeatureList } from "../../core/class-features.js";
import { fighterResourceRow } from "./fighter.js";
import { monkResourceRow } from "./monk.js";
import { artificerResourceRow } from "./artificer.js";

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
/* Attacks: how many the Attack action makes, with Action Surge and the
   bonus-action attacks in its tooltip. */
function attacksBox(c){
  var n = attacksPerAction(c);
  var box = document.createElement("div");
  box.className = "vital-box vital-mini attacks-vital-box";
  box.innerHTML = '<div class="lbl">Attacks</div><div class="init-hero-val vital-plain-val"></div><div class="vital-hint">per Attack action</div>';
  box.querySelector(".init-hero-val").textContent = n;
  var tip = ["When you take the Attack action, you make " + (n > 1 ? n + " weapon attacks." : "one weapon attack.")];
  if(classLevelOf(c, "Fighter") >= 2) tip.push("Action Surge lets you take the Attack action again for " + (n > 1 ? n + " more." : "one more."));
  var bonus = bonusActionAttacks(c);
  if(bonus.length) tip.push("As a bonus action:\n" + bonus.map(function(b){ return "\u2022 " + b; }).join("\n"));
  box.title = tip.join("\n\n");
  return box;
}

/* The HP number flashes after damage or healing (on the next frame,
   once the sheet is drawn again). */
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

export function renderVitalsPanel(c){
  var panel = document.createElement("div");
  panel.appendChild(renderHpDefenseCard(c));
  panel.appendChild(renderRestCard(c));

  // A cleric's or paladin's Channel Divinity, with every option on it.
  var allResources = characterResources(c);
  var channelCard = renderChannelCard(c, allResources, resourceRowEl);
  if(channelCard) panel.appendChild(channelCard);

  var barbClass = barbarianClassEntry(c);
  if(barbClass) panel.appendChild(renderRageCard(c, barbClass));

  if(c.wildShape) panel.appendChild(renderWildShapeCard(c));

  var effectsCard = renderEffectsCard(c);
  if(effectsCard) panel.appendChild(effectsCard);

  var remindCard = renderRemindCard(c);
  if(remindCard) panel.appendChild(remindCard);

  // A use kept with its card elsewhere (a Breath Weapon on Inventory) isn't repeated here.
  // (Nor are Channel Divinity's, which have their own card.)
  var resources = allResources.filter(function(r){ return r.place!=="inventory" && !channelResourceKey(r.key); });
  if(resources.length) panel.appendChild(renderResourcesCard(c, resources));

  return panel;
}

/* ---- Hit points & defense ----
   The HP box, then Armor Class, Initiative, Speed and Attacks on one
   grid; other speeds and the conditions that are on under it. */
function renderHpDefenseCard(c){
  var card = makeCard("Hit points & defense");
  // Conditions and exhaustion open from the header; what's on shows below the grid.
  card.querySelector("h3").appendChild(renderConditionsButton(c));
  var grid = document.createElement("div");
  grid.className = "vitals-grid vitals-main";
  grid.appendChild(renderHpBox(c));
  grid.appendChild(renderAcBox(c));
  grid.appendChild(renderInitiativeBox(c));
  var speed = renderSpeedBox(c);
  grid.appendChild(speed.box);
  grid.appendChild(attacksBox(c));

  card.appendChild(grid);
  if(speed.others) card.appendChild(speed.others);
  var conditionChips = renderConditionsStrip(c);
  if(conditionChips) card.appendChild(conditionChips);
  return card;
}

/* The HP box: the number and its bar (dragged sideways or stepped with
   the arrows), the quick buttons, resistances, Max and Temp, and the
   death saves at 0. */
function renderHpBox(c){
  // Max HP with Tough's and Dwarven Toughness's bonus; c.hp.max is the
  // part the stepper edits.
  var hpMax = maxHp(c);
  var bonusTitle = hpBonuses(c).map(function(b){ return b.name+" (+"+b.value+")"; }).join(", ");
  if(bonusTitle) bonusTitle = "Includes "+bonusTitle;

  var hpBox = document.createElement("div");
  hpBox.className = "vital-box hp-vital-box";
  hpBox.innerHTML = '<div class="lbl">Hit Points</div>';
  if(c.wildShape && !c.wildShape.own) hpBox.querySelector(".lbl").textContent = c.wildShape.form + " hit points";

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
  // ---- Damage and healing (the rules: js/core/hit-points.js) ----
  function applyDamage(n){
    if(n <= 0) return;
    var hit = takeDamage(c, n);
    if(hit.turnedBack) showActionToast(hit.carried ? "You turn back, and " + hit.carried + " damage carries over." : "You turn back to your own shape.");
    save(); renderAll();
    // (All of it on the Arcane Ward: your hit points didn't move.)
    if(hit.reached !== "ward") flashHpNum("hp-dmg");
    if(hit.wentDown){ var ds = document.querySelector(".death-saves"); if(ds) ds.classList.add("ds-enter"); }
  }

  function applyHeal(n){
    if(n <= 0) return;
    healHp(c, n);
    save(); renderAll();
    flashHpNum("hp-heal");
  }

  // ---- Dragging the bar, holding an arrow ----
  // Both only show the change while the finger is down (the bar, the
  // number and a "−23" bubble). Letting go takes it in one go through
  // applyDamage / applyHeal, so temp HP, the ward and Wild Shape still count.
  var deltaBubble = document.createElement("span");
  deltaBubble.className = "hp-delta-bubble";
  deltaBubble.hidden = true;
  heroDisplay.appendChild(deltaBubble);

  function previewChange(d){
    var shown = d < 0 ? hpAfterDamage(c, -d) : clamp(hpCur + d, 0, hpMax);
    var pct = hpMax > 0 ? clamp(shown / hpMax, 0, 1) * 100 : 0;
    curSpan.textContent = shown;
    hpBox.style.setProperty("--hp-pct", pct + "%");
    hpBox.classList.toggle("hp-low", pct <= 30 && shown > 0);
    deltaBubble.hidden = !d;
    deltaBubble.textContent = d < 0 ? "\u2212" + (-d) : "+" + d;
    deltaBubble.classList.toggle("is-heal", d > 0);
  }
  function commitChange(d){
    if(d < 0) applyDamage(-d);
    else if(d > 0) applyHeal(d);
    else previewChange(0);
  }
  function clampChange(d){ var lim = hpChangeLimits(c); return clamp(d, -lim.down, lim.up); }

  // Sideways only: a vertical swipe still scrolls the page (touch-action: pan-y).
  var drag = null;
  hpBox.title = "Drag sideways: left to take damage, right to heal";
  hpBox.addEventListener("pointerdown", function(e){
    if(e.button > 0 || e.target.closest("button, input, select, a, .death-saves, .hp-sub-row")) return;
    drag = {id: e.pointerId, x: e.clientX, y: e.clientY, on: false, d: 0};
  });
  hpBox.addEventListener("pointermove", function(e){
    if(!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if(!drag.on){
      if(Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)){ drag = null; return; }
      if(Math.abs(dx) < 8) return;
      // Counted from here, so the first few pixels don't jump a point.
      drag.on = true; drag.x = e.clientX; dx = 0;
      try { hpBox.setPointerCapture(e.pointerId); } catch(err){}
      hpBox.classList.add("hp-dragging");
    }
    drag.d = hpDragChange(c, dx, hpBox.clientWidth);
    previewChange(drag.d);
  });
  function endDrag(e, apply){
    if(!drag || e.pointerId !== drag.id) return;
    var was = drag; drag = null;
    if(!was.on) return;
    hpBox.classList.remove("hp-dragging");
    if(apply) commitChange(was.d); else previewChange(0);
  }
  hpBox.addEventListener("pointerup", function(e){ endDrag(e, true); });
  hpBox.addEventListener("pointercancel", function(e){ endDrag(e, false); });

  // Keyboard: the number is a slider (arrows 1, Page Up / Down 10).
  heroDisplay.tabIndex = 0;
  heroDisplay.setAttribute("role", "slider");
  heroDisplay.setAttribute("aria-label", "Hit points");
  heroDisplay.setAttribute("aria-valuemin", "0");
  heroDisplay.setAttribute("aria-valuemax", String(hpMax));
  heroDisplay.setAttribute("aria-valuenow", String(hpCur));
  heroDisplay.setAttribute("aria-valuetext", hpCur + " of " + hpMax + " hit points");
  heroDisplay.addEventListener("keydown", function(e){
    var step = {ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10}[e.key];
    if(!step) return;
    e.preventDefault();
    var d = clampChange(step);
    if(!d) return;
    commitChange(d);
    var again = document.querySelector(".hp-vital-box .hp-hero-display");
    if(again) again.focus();
  });

  // Press and hold an arrow: it keeps counting, faster the longer it's held.
  function holdToRepeat(btn, sign){
    var timer = null, held = 0, skipClick = false;
    btn.addEventListener("contextmenu", function(e){ e.preventDefault(); });
    btn.addEventListener("pointerdown", function(e){
      if(e.button > 0) return;
      held = 0;
      try { btn.setPointerCapture(e.pointerId); } catch(err){}
      var steps = 0;
      timer = setTimeout(function tick(){
        steps++;
        held = clampChange(sign * steps);
        previewChange(held);
        timer = setTimeout(tick, steps < 5 ? 170 : steps < 15 ? 90 : 45);
      }, 420);
    });
    function release(){
      clearTimeout(timer); timer = null;
      if(!held) return;
      var d = held; held = 0; skipClick = true;
      // After the click this release makes, which mustn't add one more.
      setTimeout(function(){ skipClick = false; commitChange(d); }, 0);
    }
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    return function(){ return skipClick; };
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
  var dmgHeld = holdToRepeat(dmg1Btn, -1);
  dmg1Btn.addEventListener("click", function(e){ e.stopPropagation(); if(!dmgHeld()) applyDamage(1); });
  hpActionsRow.appendChild(dmg1Btn);

  var fullBtn = document.createElement("button");
  fullBtn.type = "button";
  fullBtn.className = "btn small quick-heal-btn hp-full-inline";
  fullBtn.textContent = "Full";
  fullBtn.title = "Restore to full HP. Resources are not restored, use Long rest for that";
  fullBtn.addEventListener("click", function(e){
    e.stopPropagation();
    c.hp.current = hpMax;
    save(); renderAll();
    flashHpNum("hp-heal");
  });
  hpActionsRow.appendChild(fullBtn);

  var heal1Btn = document.createElement("button");
  heal1Btn.type = "button";
  heal1Btn.className = "stat-arrow-btn stat-arrow-up";
  heal1Btn.title = "Heal 1 HP";
  heal1Btn.setAttribute("aria-label", "Heal 1 HP");
  heal1Btn.innerHTML = makeStatArrowSvg("up");
  var healHeld = holdToRepeat(heal1Btn, 1);
  heal1Btn.addEventListener("click", function(e){ e.stopPropagation(); if(!healHeld()) applyHeal(1); });
  hpActionsRow.appendChild(heal1Btn);

  hpBox.appendChild(hpActionsRow);

  var spirit = protectiveSpirit(c, hpMax);
  if(spirit) hpBox.appendChild(protectiveSpiritButton(c, spirit, hpMax));
  hpWardLines(c).forEach(function(line){ hpBox.appendChild(line); });
  if(heavyArmorMasterActive(c)) hpBox.appendChild(heavyArmorMasterRow(c, applyDamage));
  hpBox.appendChild(hpSubRow(c, bonusTitle));

  if(c.hp.current<=0){
    hpBox.classList.add("is-dying");
    hpBox.appendChild(renderDeathSaves(c));
  }
  return hpBox;
}

/* Protective Spirit (Oath of Redemption 15): at the end of your turn,
   below half your hit points. */
function protectiveSpiritButton(c, spirit, hpMax){
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
    save(); renderAll();
    flashHpNum("hp-heal");
  });
  return spiritBtn;
}

/* Damage resistances and immunities from the race (Mountain Born, Poison
   Immunity) and items (Resistant Armor, Duality), only when there are
   any; where each comes from is in the tooltip. A type the character is
   immune to isn't listed as resisted too. */
function hpWardLines(c){
  var lines = [];
  var wards = raceWards(c);
  var immuneTypes = wards.immune.map(function(r){ return r.type; });
  var resist = wards.resist.concat(druidResistances(c), infusionResistances(c), coinResistances(c).map(function(t){ return {type: t, source: "Duality"}; }), stormSoulResistances(c), featureResistances(c), effectResistances(c), drakeResistance(c), saintResistance(c))
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
    lines.push(resistLine);
  }
  // "Immune to poison and the poisoned condition".
  var immuneConds = wards.conditionImmune.map(function(r){ return r.type; });
  if(immuneTypes.length || immuneConds.length){
    var immuneLine = document.createElement("div");
    immuneLine.className = "hp-resist";
    immuneLine.textContent = "Immune to " + [immuneTypes.join(", "), immuneConds.length ? "the " + immuneConds.join(", ") + " condition" : ""].filter(Boolean).join(" and ");
    immuneLine.title = wardTip(wards.immune.concat(wards.conditionImmune.map(function(r){ return {type: r.type + " condition", source: r.source}; })));
    lines.push(immuneLine);
  }
  return lines;
}

/* Heavy Armor Master: a damage field with Take and Take less. */
function heavyArmorMasterRow(c, applyDamage){
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
  // (The 2024 feat takes off the proficiency bonus, from any attack's bludgeoning, piercing or slashing.)
  var hamCut = heavyArmorMasterAmount(c);
  makeHamBtn("Take −" + hamCut, "Heavy Armor Master: " + (hamCut===3 && !hasFeat(c, "Heavy Armor Master (2024)") ? "nonmagical bludgeoning, piercing or slashing damage" : "bludgeoning, piercing or slashing damage from an attack") + " reduced by " + hamCut, function(n){
    var taken = Math.max(0, n - hamCut);
    logRoll("Heavy Armor Master", n + " damage reduced to " + taken + ".");
    if(taken > 0) applyDamage(taken); else { save(); renderAll(); flashHpNum("hp-dmg"); }
  });
  return hamRow;
}

/* Max and Temp HP, each with its stepper. */
function hpSubRow(c, bonusTitle){
  var subRow = document.createElement("div");
  subRow.className = "hp-sub-row";
  subRow.appendChild(hpSubGroup("Max:", stepper("max HP", {cls: "hp-sub-stepper", value: fullMaxHp(c), valueTitle: bonusTitle,
    downDisabled: (Number(c.hp.max)||1) <= 1,
    onDown: function(){
      var curMax = Number(c.hp.max) || 1;
      if(curMax > 1){
        c.hp.max = curMax - 1;
        c.hp.current = Math.min(Number(c.hp.current)||0, maxHp(c));
        save(); renderAll();
      }
    },
    onUp: function(){ c.hp.max = (Number(c.hp.max)||1) + 1; save(); renderAll(); }})));
  subRow.appendChild(hpSubGroup("Temp:", stepper("temp HP", {cls: "hp-sub-stepper", value: c.hp.temp || 0,
    downDisabled: (Number(c.hp.temp)||0) <= 0,
    onDown: function(){
      var t = Number(c.hp.temp) || 0;
      if(t > 0){ c.hp.temp = t - 1; save(); renderAll(); }
    },
    onUp: function(){ c.hp.temp = (Number(c.hp.temp)||0) + 1; save(); renderAll(); }})));
  return subRow;
}
function hpSubGroup(label, st){
  var group = document.createElement("div");
  group.className = "hp-sub-group";
  var lbl = document.createElement("span");
  lbl.className = "hp-sub-lbl";
  lbl.textContent = label;
  group.appendChild(lbl);
  group.appendChild(st);
  return group;
}

// Same four-row shape as AC / Initiative (label, hero value, hint, controls)
// so the three boxes line up on the shared subgrid.
function smallVital(c, label, key, isNested, hint, step, suffix, bonus){
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
  ctrlRow.appendChild(stepper(label, {cls: "vital-stepper", value: "\u00b1" + step, valueCls: "vital-step-lbl", downDisabled: val <= 0,
    onDown: function(){
      var cur = isNested ? c[isNested][key] : c[key];
      var nextVal = Math.max(0, (Number(cur) || 0) - step);
      if(isNested) c[isNested][key] = nextVal; else c[key] = nextVal;
      save(); renderAll();
    },
    onUp: function(){
      var cur = isNested ? c[isNested][key] : c[key];
      var nextVal = (Number(cur) || 0) + step;
      if(isNested) c[isNested][key] = nextVal; else c[key] = nextVal;
      save(); renderAll();
    }}));
  box.appendChild(ctrlRow);
  return box;
}

/* Armor Class, with its make-up and a misc modifier. */
function renderAcBox(c){
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

  acMiscRow.appendChild(stepper("misc AC modifier", {value: fmtMod(c.acMisc||0),
    onDown: function(){ c.acMisc = (Number(c.acMisc)||0) - 1; save(); renderAll(); },
    onUp: function(){ c.acMisc = (Number(c.acMisc)||0) + 1; save(); renderAll(); }}));
  acBox.appendChild(acMiscRow);

  return acBox;
}

/* Initiative: a tap rolls it (with what follows a roll), and a misc modifier. */
function renderInitiativeBox(c){
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

  miscStepperRow.appendChild(stepper("misc modifier", {value: fmtMod(c.initiativeMisc||0),
    onDown: function(){ c.initiativeMisc = (Number(c.initiativeMisc)||0) - 1; save(); renderAll(); },
    onUp: function(){ c.initiativeMisc = (Number(c.initiativeMisc)||0) + 1; save(); renderAll(); }}));
  initBox.appendChild(miscStepperRow);

  initBox.style.cursor="pointer";
  initBox.title = "Click to roll initiative (1d20" + fmtMod(initTotal) + ")";
  initBox.addEventListener("click", function(e){
    if(e.target.closest(".stat-stepper") || e.target.closest("button")) return;
    // Thief's Reflexes (Thief 17): a second turn at the initiative minus 10.
    var reflexes = classLevelOf(c, "Rogue", "Thief") >= 17;
    // A 2024 monk: Uncanny Metabolism offered after the roll (with Perfect
    // Focus as the other choice), or Perfect Focus at once when it's used up.
    var um = uncannyMetabolism(c), pf = perfectFocusGain(c), pfNow = !um && pf ? usePerfectFocus(c) : 0;
    var pr = persistentRageReady(c);
    // Adventurer's Atlas (Cartographer 3): a map holder adds 1d4.
    var atlas = classLevelOf(c, "Artificer", "Cartographer") >= 3;
    var follow = reflexes || um || pr || atlas ? function(r){
      if(!r) return null;
      var lead = reflexes ? "Thief's Reflexes: a second turn in the first round at initiative " + (r.total - 10) + " (not when you're surprised)." : "";
      var options = !um ? [] : [{label: "Uncanny Metabolism: all Focus, heal 1d" + um.die + "+" + um.bonus, title: "Get all your Focus Points back and regain 1d" + um.die + " + " + um.bonus + " hit points. Once per long rest.",
        use: function(){
          var roll = Math.floor(Math.random() * um.die) + 1, healed = useUncannyMetabolism(c, roll);
          logRoll("Uncanny Metabolism (1d" + um.die + "+" + um.bonus + ")", "All Focus Points back. " + roll + " +" + um.bonus + " = " + (roll + um.bonus) + " (" + healed + " HP healed).");
          save(); renderAll();
          return {silent: true};
        }}].concat(pf ? [{label: "Perfect Focus: Focus back up to 4", title: "Keep Uncanny Metabolism for later and get Focus Points back until you have 4.",
        use: function(){
          var n = usePerfectFocus(c);
          logRoll("Perfect Focus", n + " Focus Point" + (n===1 ? "" : "s") + " back (4 now).");
          save(); renderAll();
          return {silent: true};
        }}] : []);
      if(pr) options = options.concat([{label: "Regain all your rages (Persistent Rage)", title: "Get all your uses of Rage back. Once per long rest.",
        use: function(){
          if(!usePersistentRage(c)) return null;
          logRoll("Persistent Rage", "Regained all uses of Rage.");
          save(); renderAll();
          return {silent: true};
        }}]);
      if(atlas) options = [{label: "+1d4 (Adventurer's Atlas)", title: "While you carry one of your maps, add 1d4 to initiative",
        use: function(){
          var n = Math.floor(Math.random() * 4) + 1;
          return {bonus: n, log: "Adventurer's Atlas (1d4: " + n + ")"};
        }}].concat(options);
      return {lead: lead || "When you roll initiative:", options: options};
    } : null;
    performRoll(20,1,initTotal,initRoll.mode,"Initiative", follow);
    // Initiative is a DEX check: Duality's next-check advantage is used.
    var used = useNextCheck(c);
    if(useTides(c)) used = true;
    if(effectOn(c, "vigilant_blessing")){ endEffect(c, "vigilant_blessing"); used = true; }
    // Relentless, Tireless Spirit...: one use back if none were left.
    var back = regainOnInitiative(c);
    if(back.length){ logRoll("Initiative", "Regained one use of " + back.join(", ") + "."); showActionToast("Regained one use of " + back.join(", ") + "."); }
    if(pfNow){ logRoll("Perfect Focus", pfNow + " Focus Point" + (pfNow===1 ? "" : "s") + " back (4 now)."); showActionToast("Perfect Focus: Focus Points back up to 4."); }
    if(used || back.length || pfNow){ save(); renderAll(); }
  });
  return initBox;
}

/* Speed, with the other speeds as their own line: {box, others}. */
function renderSpeedBox(c){
  var speed = computeSpeed(c);
  var speedHint = speed.parts.length ? "per turn, incl. "+speed.parts.map(function(p){
    return p.name+" "+fmtMod(p.value)+(p.why ? " ("+p.why+")" : "");
  }).join(", ") : "per turn";
  // A condition's 0 (named) or exhaustion's half replaces the bonuses line.
  if(speed.hindered) speedHint = speed.hindered.zero || "Halved (exhaustion)";
  var speedBox = smallVital(c, "Speed","speed",null,speedHint,5," ft",speed.value - (Number(c.speed)||0));
  if(speed.hindered) speedBox.classList.add("speed-hindered");
  // Fly, swim and climb speeds on their own line under the boxes (so a
  // long condition doesn't stretch the row); conditional ones say when.
  var others = null;
  if(speed.others.length){
    others = document.createElement("div");
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
  }
  speedBox.classList.add("speed-vital-box");
  return {box: speedBox, others: others};
}

/* ---- Hit dice & rest ---- */
function renderRestCard(c){
  var restCard = makeCard("Hit dice & rest");
  var hd = totalLevel(c);
  // Hit dice are counted per size (a multiclass character has a mix, e.g.
  // 3d12 + 2d6). One tile each, and the tile is the button: the player picks
  // which size to spend, and a single class has one tile.
  var pools = hitDicePools(c);
  var hdRemaining = pools.reduce(function(n, p){ return n + p.total - p.used; }, 0);
  // Spends a die of that size and rolls it.
  function spendDie(size){
    var h = spendHitDieToHeal(c, size);
    if(!h) return;
    logRoll("Hit die (d"+h.die+fmtMod(h.conMod)+")", h.roll+" "+fmtMod(h.conMod)+(h.vessel ? " +"+h.vessel+" (Sanctuary Vessel)" : "")+" = "+h.healed+" HP healed"+(h.durable ? " (Durable minimum)" : ""));
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
  // (What a rest does: js/core/rest.js. Here: the log, the scene, the sound.)
  shortRestBtn.addEventListener("click", function(){
    var before = resourceUse(c);
    logRoll("Short rest taken", shortRestNote(shortRest(c)));
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
        var rested = longRest(c, {endConditions: conditionChoice ? conditionChoice.chosen() : []});
        logRoll("Long rest taken", longRestNote(rested));
        save(); renderAll();
        // Night falls, then at dawn hit points and resources come back.
        restScene("long");
        playLongRest();
        if(rested.healed > 0) setTimeout(function(){ flashHpNum("hp-heal"); }, 1300);
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
  return restCard;
}

/* ---- Rage ----
   Rages left as pips, the damage bonus and the Enter/End button on one
   row; what rage gives as chips that light up while raging. The full
   rule is in the info icon's tooltip. */
function renderRageCard(c, barbClass){
  var level = barbClass.level||1;
  var rageMax = barbarianRageMax(level, barbClass);
  var is2024 = barbClass.edition==="2024";
  var inHeavy = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; });
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
  dmg.title = is2024 ? "Added to attacks using Strength while raging, with a weapon or an unarmed strike" : "Added to Strength melee weapon attacks while raging";
  main.appendChild(dmg);

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn rage-btn"+(raging ? "" : " primary");
  btn.innerHTML = makeFlameSvg();
  btn.appendChild(document.createTextNode(raging ? "End Rage" : "Enter Rage"));
  btn.disabled = !raging && (rageLeft<=0 || (is2024 && inHeavy));
  if(btn.disabled) btn.title = rageLeft > 0 ? "Not while you wear heavy armor" : is2024 ? "No rages left. A short rest gives one back" : "No rages left until a long rest";
  // Instinctive Pounce (Tasha's): the move that comes with entering.
  else if(!raging && (usesVariant(barbClass, "Instinctive Pounce") || (is2024 && level >= 7))) btn.title = "Instinctive Pounce: as you enter your rage, you can move up to half your speed (" + Math.floor(computeSpeed(c).value / 2) + " ft).";
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
/* A small button for the Rage card. */
function rageButton(text, title, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn";
  b.textContent = text; b.title = title;
  b.addEventListener("click", function(){ onClick(); save(); renderAll(); });
  return b;
}
/* What the 2024 paths offer while raging: the Wild Heart's choices, the World
   Tree's temporary hit points, branches and long teleport, the Zealot's form. */
function rageActions2024(c){
  var out = [];
  [["wilds", "wilds", "Rage of the Wilds", WILDS_OPTIONS], ["power", "wildsPower", "Power of the Wilds", POWER_OPTIONS]].forEach(function(w){
    if(!wildsChoiceDue(c, w[0])) return;
    // (Two choices at level 14: each under its own name.)
    var pick = document.createElement("div");
    pick.className = "rage-pick";
    var pickLbl = document.createElement("span");
    pickLbl.className = "rage-pick-lbl";
    pickLbl.textContent = w[2];
    pick.appendChild(pickLbl);
    Object.keys(w[3]).forEach(function(name){
      pick.appendChild(rageButton(name, w[2] + ": " + w[3][name], function(){
        c.rage[w[1]] = name;
        logRoll(w[2], name + " for this Rage.");
      }));
    });
    out.push(pick);
  });
  var life = lifeGivingDice(c);
  if(life){
    var lg = rageButton("", "Life-Giving Force: at the start of each of your turns, another creature within 10 feet gains this many temporary hit points. They vanish when your Rage ends.", function(){});
    lg.innerHTML = makeDiceSvg() + "Life-Giving Force " + life + "d6";
    lg.addEventListener("click", function(){ performRoll(6, life, 0, "none", "Life-Giving Force: temporary HP for another creature"); });
    out.push(lg);
  }
  var branches = branchesDc(c);
  if(branches) out.push(rageButton("Branches · STR DC " + branches, "Reaction: when a creature you can see starts its turn within 30 feet, it makes a Strength save or teleports next to you, and you can reduce its speed to 0 until the end of the turn.", function(){
    logRoll("Branches of the Tree", "Strength save, DC " + branches + ", or the target teleports next to you. Its speed can drop to 0 until the end of the turn.");
  }));
  if(longTravelReady(c)) out.push(rageButton("Teleport 150 ft", "Once per Rage: teleport up to 150 feet and bring up to six willing creatures within 10 feet of you.", function(){
    c.rage.longTravel = true;
    logRoll("Travel Along the Tree", "Teleported up to 150 feet, with up to six willing creatures.");
  }));
  var formKey = "Barbarian:rage_of_the_gods";
  if(hasRageOfGods(c) && !c.rage.gods && resourceLeft(c, formKey) > 0) out.push(rageButton("Divine warrior form", "Rage of the Gods: as you enter your Rage, for 1 minute or until you drop to 0 hit points. Once per long rest.", function(){
    spendResource(c, formKey, 1);
    c.rage.gods = true;
    logRoll("Rage of the Gods", "Divine warrior form: fly speed, hover, and resistance to necrotic, psychic and radiant damage.");
  }));
  if(divineFormOn(c)){
    var hp = revivificationHp(c);
    var rev = rageButton("Revivification", "Reaction: when a creature within 30 feet would drop to 0 hit points, spend a use of Rage to set its hit points to " + hp + " instead.", function(){
      if(!spendRage(c)) return;
      logRoll("Revivification", "Spent a use of Rage: the creature's hit points become " + hp + " instead of 0.");
    });
    rev.disabled = ragesLeft(c) <= 0;
    out.push(rev);
  }
  return out;
}
function rageActions(c){
  var out = rageActions2024(c);
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
    list.appendChild(resourceRowEl(c, r));
  });
  // A Phantom's soul trinkets (Tokens of the Departed): how many are held.
  var trinkets = soulTrinkets(c);
  if(trinkets) list.appendChild(soulTrinketRow(c, trinkets));
  card.appendChild(list);
  return card;
}
/* One resource's row: its name, rest pill and hint, what it can be spent
   on, and its pips (or number) with use and regain arrows. */
function resourceRowEl(c, r){
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
  // (No limit: an Unlimited pill in the rest pill's place, nothing on the right.)
  if(r.max===Infinity){ tag.className = "res-reset res-reset-unlimited"; tag.textContent = "Unlimited"; }
  name.appendChild(tag);
  info.appendChild(name);
  var hint = document.createElement("div");
  hint.className = "res-hint";
  hint.textContent = r.hint + (r.source ? " ("+r.source+")" : "");
  info.appendChild(hint);
  // A spell slot pays once the uses are gone (Drake's Breath), or sorcery points (Warping Implosion).
  // (`pactSlot`: only a Pact Magic slot pays, as the 2024 patrons' features say.)
  var slotPay = r.slotMin && remaining<=0 ? spellSlotsLeft(c).find(function(s){ return s.level >= r.slotMin && (!r.pactSlot || s.pact); }) : null;
  var pointsPay = r.againPoints && remaining<=0 && resourceLeft(c, "Sorcerer:sorcery_points") >= r.againPoints ? r.againPoints : 0;
  var slotWords = slotPay ? " (" + (slotPay.pact && r.pactSlot ? "pact slot" : ordinal(slotPay.level) + "-level slot") + ")" : pointsPay ? " (" + pointsPay + " points)" : "";
  var ctx = {remaining: remaining, slotPay: slotPay, pointsPay: pointsPay, slotWords: slotWords,
    setUsed: function(n){ setResourceUsed(c, r, n); }};
  var setUsed = ctx.setUsed;
  // What it can be spent on, each block in its place (one gives an element,
  // a list of them, or nothing).
  resourceBlocks().forEach(function(block){
    [].concat(block(c, r, ctx) || []).forEach(function(el){ info.appendChild(el); });
  });
  row.appendChild(info);

  // Unlimited (Archdruid's Wild Shape): nothing to count or spend, so no
  // controls (the pill by the name says it).
  if(r.max===Infinity){
    return row;
  }
  var ctrl = document.createElement("div");
  ctrl.className = "res-ctrl";
  row.appendChild(ctrl);
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
  return row;
}

/* The blocks a resource row can show under its name, in this order. Each
   takes (c, r, ctx), ctx being {remaining, slotPay, pointsPay, slotWords,
   setUsed}, and draws only for the resources it knows. */
function resourceBlocks(){
  return [resourceRollButton, payAgainButtons, fighterResourceRow, diceRestoreButton, rageRestoreButton, resourceHealButton,
    monkResourceRow, clericResourceRow, paladinResourceRow, gunslingerResourceRow, druidResourceRow, bardResourceRow,
    sorcererResourceRow, warlockResourceRow, wizardResourceRow, artificerResourceRow, harnessDivinePowerRow, wildCompanionButton];
}

/* Set how much of a resource is used, then show the pip that changed. */
function setResourceUsed(c, r, n){
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

/* A use that rolls a die (Warding Maneuver's d8): spends one and rolls. */
function resourceRollButton(c, r, ctx){
  if(!(r.roll && r.max!==Infinity)) return null;
  var remaining = ctx.remaining, slotPay = ctx.slotPay, pointsPay = ctx.pointsPay, slotWords = ctx.slotWords, setUsed = ctx.setUsed;
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
    } : r.roll.min || r.roll.temp || r.roll.heal ? {
      adjust: least ? function(x){ return x.total < least ? {total: least, note: "at least " + least} : null; } : null,
      // Temporary hit points don't stack: keep the higher.
      onResult: r.roll.temp ? function(x){
        var got = Math.max(x.total, least);
        if(got > (Number(c.hp.temp)||0)){ c.hp.temp = got; save(); renderAll(); }
      } : r.roll.heal ? function(x){
        c.hp.current = clamp((Number(c.hp.current)||0) + Math.max(x.total, least), 0, maxHp(c));
        save(); renderAll();
      } : null
    } : null);
  });
  rolls.appendChild(rollBtn);
  return rolls;
}
/* No roll: the slot or the points just pay (summoning the drake again). */
function payAgainButtons(c, r, ctx){
  if(r.roll) return null;
  var out = [], slotPay = ctx.slotPay, pointsPay = ctx.pointsPay, slotWords = ctx.slotWords;
  if(pointsPay){
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
    out.push(againPts);
  }
  if(slotPay){
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
    out.push(again);
  }
  return out;
}
/* A use that restores a set number of hit points (Wholeness of Body).
   Psychic Veil, Rend Mind (2024): Psionic Energy Dice get it back. */
function diceRestoreButton(c, r, ctx){
  if(!(r.diceRestore && r.used > 0)) return null;
  var setUsed = ctx.setUsed;
  var dr = r.diceRestore, pool = resourceLeft(c, dr.key);
  var drRow = document.createElement("div");
  drRow.className = "inv-roll-actions fx-rolls";
  var drBtn = document.createElement("button");
  drBtn.type = "button"; drBtn.className = "btn small inv-roll-btn";
  var drNoun = dr.noun || ["Psionic Energy Die", "Psionic Energy Dice"], drWord = dr.noun ? (dr.count===1 ? "a " + drNoun[0] : dr.count + " " + drNoun[1]) : dr.count + (dr.count===1 ? " die" : " dice");
  drBtn.textContent = "Spend " + drWord + " to use it again";
  drBtn.disabled = pool < dr.count;
  drBtn.title = drBtn.disabled ? "Not enough " + drNoun[1] + " left" : "No action needed: spend " + drNoun[1] + " to get this back";
  drBtn.addEventListener("click", function(){
    if(!spendResource(c, dr.key, dr.count)) return;
    logRoll(r.name, "Spent " + dr.count + " " + (dr.count===1 ? drNoun[0] : drNoun[1]) + " to use it again.");
    setUsed(r.used-1);
  });
  drRow.appendChild(drBtn);
  return drRow;
}
/* Intimidating Presence, Zealous Presence (2024): a use of Rage gets it back. */
function rageRestoreButton(c, r, ctx){
  if(!(r.rageRestore && r.used > 0)) return null;
  var setUsed = ctx.setUsed;
  var rageRow = document.createElement("div");
  rageRow.className = "inv-roll-actions fx-rolls";
  var rageBack = document.createElement("button");
  rageBack.type = "button"; rageBack.className = "btn small inv-roll-btn";
  rageBack.textContent = "Spend a Rage to use it again";
  rageBack.disabled = ragesLeft(c) <= 0;
  rageBack.title = rageBack.disabled ? "No rages left" : "No action needed: spend a use of Rage to get this back";
  rageBack.addEventListener("click", function(){
    if(!spendRage(c)) return;
    logRoll(r.name, "Spent a use of Rage to use it again.");
    setUsed(r.used-1);
  });
  rageRow.appendChild(rageBack);
  return rageRow;
}
/* A use that heals a set number of hit points. */
function resourceHealButton(c, r, ctx){
  if(!(r.heal && r.max!==Infinity)) return null;
  var remaining = ctx.remaining;
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
  return hr;
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
