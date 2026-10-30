import { getActive, save } from "../core/state.js";
import { nowStamp, escapeHtml, fmtMod, clamp } from "../core/helpers.js";
import { playCrit, playFail } from "../ui/sound.js";

/* ---------------- Dice tray & Smooth Animations ---------------- */
var advMode = "none"; // none | adv | dis
var lastRollConfig = null;
var rollAnimationTimers = [];
var toastTimer = null;
var previewDie = 20;      // die shown in the un-rolled preview (the last one rolled)
var rolling = false;      // a roll animation is in flight
var previewPending = false; // Qty/adv changed mid-roll; redraw once it settles

export function getDieSvg(die, value){
  var valStr = value != null ? String(value) : "?";
  if(die === 4){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,10 92,84 8,84"/><line class="die-facet" x1="50" y1="10" x2="50" y2="43"/><line class="die-facet" x1="92" y1="84" x2="67" y2="68"/><line class="die-facet" x1="8" y1="84" x2="33" y2="68"/><text class="die-text" x="50" y="61">'+valStr+'</text></svg>';
  }
  if(die === 6){
    return '<svg viewBox="0 0 100 100"><rect class="die-bg" x="12" y="12" width="76" height="76" rx="14"/><rect class="die-facet" x="22" y="22" width="56" height="56" rx="8"/><text class="die-text" x="50" y="52">'+valStr+'</text></svg>';
  }
  if(die === 8){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,8 90,50 50,92 10,50"/><line class="die-facet" x1="50" y1="8" x2="50" y2="92"/><line class="die-facet" x1="10" y1="50" x2="90" y2="50"/><polygon class="die-facet" points="50,26 74,50 50,74 26,50"/><text class="die-text" x="50" y="52">'+valStr+'</text></svg>';
  }
  if(die === 10 || die === 100){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,6 90,40 50,94 10,40"/><line class="die-facet" x1="50" y1="6" x2="50" y2="94"/><polyline class="die-facet" points="10,40 50,56 90,40"/><text class="die-text" x="50" y="47">'+valStr+'</text></svg>';
  }
  if(die === 12){
    return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,8 88,22 95,64 64,94 36,94 5,64 12,22"/><polygon class="die-facet" points="50,30 74,48 65,76 35,76 26,48"/><text class="die-text" x="50" y="53">'+valStr+'</text></svg>';
  }
  // default / d20
  return '<svg viewBox="0 0 100 100"><polygon class="die-bg" points="50,6 88,28 88,72 50,94 12,72 12,28"/><polygon class="die-facet" points="50,22 78,70 22,70"/><line class="die-facet" x1="50" y1="6" x2="50" y2="22"/><line class="die-facet" x1="88" y1="28" x2="78" y2="70"/><line class="die-facet" x1="88" y1="72" x2="50" y2="94"/><line class="die-facet" x1="12" y1="72" x2="50" y2="94"/><line class="die-facet" x1="12" y1="28" x2="22" y2="70"/><text class="die-text" x="50" y="52">'+valStr+'</text></svg>';
}

export function clearRollTimers(){
  rollAnimationTimers.forEach(function(t){
    clearInterval(t);
    clearTimeout(t);
  });
  rollAnimationTimers = [];
}

export function animateNumberCount(el, targetVal, duration){
  var start = 0;
  var startTime = performance.now();
  var animFrame = function(currentTime){
    var progress = Math.min((currentTime - startTime) / duration, 1);
    var ease = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(start + (targetVal - start) * ease);
    el.textContent = current;
    if(progress < 1){
      requestAnimationFrame(animFrame);
    } else {
      el.textContent = targetVal;
    }
  };
  requestAnimationFrame(animFrame);
}

export function showFloatingToast(die, finalTotal, summary, label, isCrit, isFail){
  var toast = document.getElementById("floating-roll-toast");
  if(!toast) return;
  if(toastTimer){ clearTimeout(toastTimer); toastTimer = null; }

  var titleText = label || ("d" + die + " Roll");
  var dieSvg = getDieSvg(die, finalTotal);

  var badgeHtml = "";
  if(isCrit) badgeHtml = '<span class="crit-badge crit-success" style="font-size:9.5px;padding:2px 6px;">NAT 20</span>';
  else if(isFail) badgeHtml = '<span class="crit-badge crit-fail" style="font-size:9.5px;padding:2px 6px;">NAT 1</span>';

  toast.innerHTML = '<div class="toast-die-mini">' + dieSvg + '</div>' +
    '<div class="toast-info">' +
      '<div class="toast-title">' + escapeHtml(titleText) + ' ' + badgeHtml + '</div>' +
      '<div class="toast-total">' + finalTotal + '</div>' +
      '<div class="toast-detail">' + escapeHtml(summary) + '</div>' +
    '</div>';

  toast.classList.add("show");
  toast.onclick = function(){
    toast.classList.remove("show");
    openDiceTray();
  };

  toastTimer = setTimeout(function(){
    toast.classList.remove("show");
  }, 3200);
}

/* The Mod box as a whole number within ±50. Typed values bypass the
   stepper clamp, so this normalizes them and writes the result back so
   the box shows what was actually rolled. */
function readTrayMod(){
  var input = document.getElementById("dice-mod");
  var v = clamp(Math.round(Number(input.value)||0), -50, 50);
  input.value = v;
  return v;
}

/* Roll Again / tapping a rolled die. Tray rolls (no label) re-read the
   tray, so Qty / Mod / advantage changed since the last roll apply;
   sheet rolls (Stealth, an attack...) repeat with their own modifier. */
function rollAgain(){
  if(!lastRollConfig) return;
  if(lastRollConfig.label === null) rollFromTray(lastRollConfig.die);
  else performRoll(lastRollConfig.die, lastRollConfig.qty, lastRollConfig.modifier, lastRollConfig.adv, lastRollConfig.label, lastRollConfig.followUp);
}

/* Rolls the die with the tray's current Qty / Mod / advantage settings
   (used by the die buttons and by tapping a preview die). */
function rollFromTray(die){
  var qty = clamp(Number(document.getElementById("dice-qty").value)||1, 1, 20);
  var modv = readTrayMod();
  // Advantage/disadvantage is one roll of two d20s (Qty shows 2 for it),
  // resolved by performRoll as a single d20 with an adv/dis mode.
  if(die === 20 && advMode !== "none") performRoll(20, 1, modv, advMode, null);
  else performRoll(die, qty, modv, "none", null);
}

function syncAdvButtons(){
  [["none","adv-normal"],["adv","adv-adv"],["dis","adv-dis"]].forEach(function(pair){
    var b = document.getElementById(pair[1]);
    if(b) b.classList.toggle("on", advMode === pair[0]);
  });
}

/* Qty and Adv/Dis have to agree: advantage means exactly two dice, so
   choosing it sets Qty to 2, and moving Qty off 2 drops back to Normal. */
function onQtyChanged(){
  var qty = clamp(Number(document.getElementById("dice-qty").value)||1, 1, 20);
  if(advMode !== "none" && qty !== 2){
    advMode = "none";
    syncAdvButtons();
  }
  renderDicePreview();
}

function setAdvMode(mode){
  var wasAdv = advMode !== "none";
  var qtyInput = document.getElementById("dice-qty");
  advMode = mode;
  syncAdvButtons();
  if(mode !== "none"){
    previewDie = 20;
    qtyInput.value = 2;
  } else if(wasAdv && Number(qtyInput.value) === 2){
    qtyInput.value = 1;
  }
  renderDicePreview();
}

function markSelectedDie(){
  document.querySelectorAll(".die-btn").forEach(function(btn){
    btn.classList.toggle("selected", Number(btn.getAttribute("data-die")) === previewDie);
  });
}

function makeIdleToken(die, animateIn){
  var wrapper = document.createElement("div");
  wrapper.className = "dice-token-wrapper";
  var token = document.createElement("div");
  token.className = "dice-token idle" + (animateIn ? " pop-in" : "");
  token.dataset.die = String(die);
  token.title = "Tap to roll";
  token.innerHTML = getDieSvg(die, null);
  token.addEventListener("click", function(){ rollFromTray(die); });
  wrapper.appendChild(token);
  return wrapper;
}

/* Draws the un-rolled dice for the current Qty (and advantage, which puts
   two d20s on the table) so the stage always shows what a roll will
   throw. Existing preview dice are kept and only the difference is
   added/removed; anything else on the stage (a previous roll's dice, the
   placeholder) is replaced. The last result below the stage (total,
   detail, Roll Again) is deliberately left alone. Deferred while a roll
   is animating. */
export function renderDicePreview(){
  if(rolling){ previewPending = true; return; }
  previewPending = false;

  var qty = clamp(Number(document.getElementById("dice-qty").value)||1, 1, 20);
  var count = qty;
  var stage = document.getElementById("dice-stage");

  var wrappers = Array.prototype.slice.call(stage.children);
  var reusable = wrappers.length > 0 && wrappers.every(function(w){
    var t = w.querySelector(".dice-token");
    return t && t.classList.contains("idle") && t.dataset.die === String(previewDie);
  });
  if(!reusable){
    stage.innerHTML = "";
    wrappers = [];
  }
  while(wrappers.length > count) stage.removeChild(wrappers.pop());
  while(wrappers.length < count){
    var w = makeIdleToken(previewDie, reusable);
    stage.appendChild(w);
    wrappers.push(w);
  }

  markSelectedDie();
}

/* extra (optional): what happens around the roll, either a followUp
   function or {followUp, adjust}.
   followUp(result) is called once the dice settle (and once before, with
   null, for the toast's hint), returning {lead, hint, options: [{label,
   title, disabled, use}]} or null: what the player can still do with
   this roll (Focused Aim's ki after a missed attack, Magical Guidance's
   reroll after a failed check, critical damage after a natural 20).
   They show under the result in the tray; use() pays for it and returns
   {bonus, log}, and the total grows by the bonus, or {reroll: true, log,
   adv} and the same dice are rolled again (with advantage when adv is
   "adv"), or {silent: true} when it rolled
   something of its own (null when it can't). One per roll.
   adjust(result) can change the total before it's shown: {total, note}
   (Indomitable Might's Strength score in place of a lower total).
   onResult(result) is told the final result once the dice settle (a
   Relentless Rage save puts the character back on 1 HP when it succeeds).
   result = {total, natural (the d20 kept, or null), values}. */
export function performRoll(die, qty, modifier, adv, label, extra){
  var followUp = typeof extra==="function" ? extra : (extra && extra.followUp) || null;
  var adjust = extra && typeof extra==="object" ? extra.adjust || null : null;
  var onResult = extra && typeof extra==="object" ? extra.onResult || null : null;
  lastRollConfig = { die: die, qty: qty, modifier: modifier, adv: adv, label: label, followUp: extra || null };
  previewDie = die;
  rolling = true;
  markSelectedDie();
  clearRollTimers();

  var isAdvDis = (die === 20 && adv !== "none" && qty === 1);
  var diceCount = isAdvDis ? 2 : qty;
  var finalValues = [];
  var chosenValue = 0;
  var droppedIdx = -1;
  var isCrit = false;
  var isFail = false;
  var finalTotal = 0;
  var summary = "";
  var showsTotal = false;

  if(isAdvDis){
    var r1 = Math.floor(Math.random() * 20) + 1;
    var r2 = Math.floor(Math.random() * 20) + 1;
    finalValues = [r1, r2];
    var chosenIdx = (adv === "adv") ? (r1 >= r2 ? 0 : 1) : (r1 <= r2 ? 0 : 1);
    droppedIdx = (chosenIdx === 0) ? 1 : 0;
    chosenValue = finalValues[chosenIdx];
    finalTotal = chosenValue + modifier;
    if(chosenValue === 20) isCrit = true;
    if(chosenValue === 1) isFail = true;
    summary = "[" + r1 + ", " + r2 + "] " + (adv === "adv" ? "adv" : "dis") + " → " + chosenValue + (modifier ? " " + fmtMod(modifier) : "");
    showsTotal = true;
  } else {
    var sum = 0;
    for(var i = 0; i < qty; i++){
      var r = Math.floor(Math.random() * die) + 1;
      finalValues.push(r);
      sum += r;
    }
    finalTotal = sum + modifier;
    if(die === 20 && qty === 1){
      if(finalValues[0] === 20) isCrit = true;
      if(finalValues[0] === 1) isFail = true;
    }
    summary = "[" + finalValues.join(", ") + "]" + (modifier ? " " + fmtMod(modifier) : "");
    showsTotal = finalValues.length > 1 || !!modifier;
  }

  var natural = die === 20 && qty === 1 ? (isAdvDis ? chosenValue : finalValues[0]) : null;
  var adjusted = adjust && adjust({total: finalTotal, natural: natural, values: finalValues});
  // "[4] +3 = 7 → 18 (Indomitable Might)"
  if(adjusted && adjusted.total !== finalTotal){
    summary += " = " + finalTotal + " \u2192 " + adjusted.total + " (" + adjusted.note + ")";
    finalTotal = adjusted.total;
    showsTotal = false;
  }
  var full = showsTotal ? summary + " = " + finalTotal : summary;

  // Render dice tokens in the animation stage
  var stage = document.getElementById("dice-stage");
  stage.innerHTML = "";

  var tokenElements = [];
  for(var d = 0; d < diceCount; d++){
    var wrapper = document.createElement("div");
    wrapper.className = "dice-token-wrapper";
    var token = document.createElement("div");
    token.className = "dice-token rolling";
    token.innerHTML = getDieSvg(die, Math.floor(Math.random() * die) + 1);
    wrapper.appendChild(token);
    stage.appendChild(wrapper);
    tokenElements.push({ wrapper: wrapper, token: token, targetVal: finalValues[d], index: d });
  }

  var resultEl = document.getElementById("roll-result");
  var badgeSlot = document.getElementById("roll-badge-slot");
  var detailEl = document.getElementById("roll-detail");
  var rollAgainBtn = document.getElementById("roll-again-btn");

  resultEl.textContent = "…";
  resultEl.classList.remove("result-pop");
  badgeSlot.innerHTML = "";
  var followEl = followUpSlot();
  followEl.innerHTML = "";
  detailEl.textContent = (label ? label + ": " : "") + "Rolling…";
  rollAgainBtn.style.display = "none";

  // Rapidly cycle random numbers during roll animation
  var cycleInterval = setInterval(function(){
    tokenElements.forEach(function(item){
      if(item.token.classList.contains("rolling")){
        var textNode = item.token.querySelector(".die-text");
        if(textNode){
          textNode.textContent = Math.floor(Math.random() * die) + 1;
        }
      }
    });
  }, 45);
  rollAnimationTimers.push(cycleInterval);

  // Settle dice with smooth staggered timing
  var rollDuration = 480;
  tokenElements.forEach(function(item, idx){
    var settleDelay = rollDuration + (idx * 60);
    var timer = setTimeout(function(){
      item.token.classList.remove("rolling");
      item.token.classList.add("settled");
      item.token.title = "Tap to roll again";
      item.token.onclick = rollAgain;
      var textNode = item.token.querySelector(".die-text");
      if(textNode){
        textNode.textContent = item.targetVal;
      }

      // Check nat 20 / nat 1
      if(die === 20){
        if(item.targetVal === 20){
          item.token.classList.add("nat-20");
        } else if(item.targetVal === 1){
          item.token.classList.add("nat-1");
        }
      }

      // Advantage/Disadvantage dropped vs kept tags
      if(isAdvDis){
        var tag = document.createElement("span");
        tag.className = "die-status-tag";
        if(idx === droppedIdx){
          item.token.classList.add("die-dropped");
          tag.className += " tag-dropped";
          tag.textContent = "Dropped";
        } else {
          tag.className += " tag-kept";
          tag.textContent = "Kept";
        }
        item.wrapper.appendChild(tag);
      }
    }, settleDelay);
    rollAnimationTimers.push(timer);
  });

  // Final settlement of total result & breakdown
  var totalDelay = rollDuration + ((diceCount - 1) * 60) + 80;
  var finalTimer = setTimeout(function(){
    clearInterval(cycleInterval);
    rolling = false;
    if(previewPending){
      // Let the result register for a moment before the stage is redrawn.
      setTimeout(function(){ if(!rolling && previewPending) renderDicePreview(); }, 900);
    }

    resultEl.classList.add("result-pop");
    animateNumberCount(resultEl, finalTotal, 220);

    // Critical Hit / Miss badge
    if(isCrit){
      badgeSlot.innerHTML = '<span class="crit-badge crit-success">✨ Natural 20: Critical Hit! ✨</span>';
      playCrit();
    } else if(isFail && !adjusted){
      // (Not when a feature counted the 1 as more: Master of the Barrel, Reliable Talent.)
      badgeSlot.innerHTML = '<span class="crit-badge crit-fail">💀 Natural 1: Critical Miss! 💀</span>';
      playFail();
    }

    detailEl.textContent = (label ? label + ": " : "") + summary;
    rollAgainBtn.style.display = "inline-flex";

    logRoll(label || ("d" + die), full);
    if(onResult) onResult({total: finalTotal, natural: natural, values: finalValues});
    var follow = followUp && followUp({total: finalTotal, natural: natural, values: finalValues});
    if(follow) renderFollowUp(followEl, follow, function(res){
      // A reroll (Magical Guidance): the same roll again, and it stands
      // (an adjustment still applies to it, but no second follow-up).
      if(res.reroll){
        logRoll(label || ("d" + die), res.log + ": rerolled");
        // (Master Duelist rerolls with advantage: res.adv.)
        performRoll(die, qty, modifier, res.adv || adv, label, adjust ? {adjust: adjust} : null);
        return;
      }
      // One that rolled something of its own (critical damage) is done.
      if(res.silent) return;
      finalTotal += res.bonus;
      resultEl.textContent = finalTotal;
      detailEl.textContent += " " + fmtMod(res.bonus) + " = " + finalTotal;
      logRoll(label || ("d" + die), res.log + ": " + fmtMod(res.bonus) + ", now " + finalTotal);
    });
  }, totalDelay);
  rollAnimationTimers.push(finalTimer);

  var tray = document.getElementById("dice-tray");
  if(tray.classList.contains("open")){
    // already open, rolls inside tray seamlessly
  } else {
    // Show smooth floating toast on screen (it says where a follow-up is:
    // tapping the toast opens the tray).
    var ahead = followUp && followUp(null);
    showFloatingToast(die, finalTotal, summary + (ahead && ahead.hint ? " · " + ahead.hint : ""), label, isCrit, isFail);
  }
}

/* The follow-up row under the result, made the first time it's needed. */
function followUpSlot(){
  var el = document.getElementById("roll-follow-up");
  if(!el){
    el = document.createElement("div");
    el.id = "roll-follow-up";
    var detail = document.getElementById("roll-detail");
    detail.parentNode.insertBefore(el, detail.nextSibling);
  }
  return el;
}
function renderFollowUp(el, follow, onUsed){
  var lead = document.createElement("span");
  lead.className = "roll-follow-lead";
  lead.textContent = follow.lead;
  el.appendChild(lead);
  follow.options.forEach(function(opt){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn-roll-again btn-roll-follow";
    b.textContent = opt.label;
    if(opt.title) b.title = opt.title;
    b.disabled = !!opt.disabled;
    b.addEventListener("click", function(){
      var res = opt.use();
      if(!res) return;
      el.innerHTML = "";
      onUsed(res);
    });
    el.appendChild(b);
  });
}

export function logRoll(label, detail){
  var c = getActive();
  var entry = {ts: nowStamp(), label: label, detail: detail};
  if(c){
    c.rollLog = c.rollLog || [];
    c.rollLog.unshift(entry);
    c.rollLog = c.rollLog.slice(0,25);
    save();
  }
  renderRollLog();
}

export function renderRollLog(){
  var c = getActive();
  var el = document.getElementById("roll-log");
  if(!el) return;
  el.innerHTML = "";
  var logArr = c && c.rollLog ? c.rollLog : [];
  if(logArr.length === 0){
    el.innerHTML = '<div style="font-size:11px;color:var(--text-on-ink-dim);font-style:italic;padding:4px 0;">No rolls yet</div>';
    return;
  }
  logArr.forEach(function(entry){
    var d = document.createElement("div");
    d.innerHTML = '<span class="rl-label">'+escapeHtml(entry.label)+'</span>: '+escapeHtml(entry.detail);
    el.appendChild(d);
  });
}

export function openDiceTray(){
  var tray = document.getElementById("dice-tray");
  tray.classList.add("open");
  // The tray shows the roll now, so the toast for it would only cover it.
  var toast = document.getElementById("floating-roll-toast");
  if(toast) toast.classList.remove("show");
  renderRollLog();
}
export function closeDiceTray(){
  document.getElementById("dice-tray").classList.remove("open");
}
export function toggleDiceTray(){
  var tray = document.getElementById("dice-tray");
  if(tray.classList.contains("open")){
    closeDiceTray();
  } else {
    openDiceTray();
  }
}

export function setupDiceTray(){
  document.getElementById("dice-fab").addEventListener("click", toggleDiceTray);
  document.getElementById("dice-tray-close").addEventListener("click", closeDiceTray);

  // Capture phase so clicking rolls outside doesn't immediately dismiss
  document.addEventListener("click", function(e){
    var tray = document.getElementById("dice-tray");
    if(!tray.classList.contains("open")) return;
    var fab = document.getElementById("dice-fab");
    var toast = document.getElementById("floating-roll-toast");
    // The home menu's centre die toggles the tray itself, like the fab
    var hubDie = document.getElementById("home-center");
    if(tray.contains(e.target) || fab.contains(e.target) || (hubDie && hubDie.contains(e.target)) || (toast && toast.contains(e.target))) return;
    // Don't close if clicked on a rollable sheet element
    if(e.target.closest && (e.target.closest(".stat-box") || e.target.closest(".skill-row") || e.target.closest(".save-row") || e.target.closest(".feat-item"))) return;
    closeDiceTray();
  }, true);

  document.addEventListener("keydown", function(e){
    if(e.key==="Escape") closeDiceTray();
  });

  // Die buttons
  document.querySelectorAll(".die-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      btn.classList.add("rolling-active");
      setTimeout(function(){ btn.classList.remove("rolling-active"); }, 400);
      var die = Number(btn.getAttribute("data-die"));
      // Adv/Dis only exists for d20; rolling anything else leaves it.
      if(die !== 20 && advMode !== "none") setAdvMode("none");
      rollFromTray(die);
    });
  });

  // Steppers for Qty and Mod
  var qtyInput = document.getElementById("dice-qty");
  var modInput = document.getElementById("dice-mod");

  document.getElementById("qty-inc").addEventListener("click", function(){
    var v = clamp((Number(qtyInput.value) || 1) + 1, 1, 20);
    qtyInput.value = v;
    onQtyChanged();
  });
  document.getElementById("qty-dec").addEventListener("click", function(){
    var v = clamp((Number(qtyInput.value) || 1) - 1, 1, 20);
    qtyInput.value = v;
    onQtyChanged();
  });
  qtyInput.addEventListener("input", onQtyChanged);
  document.getElementById("mod-inc").addEventListener("click", function(){
    modInput.value = clamp(readTrayMod() + 1, -50, 50);
  });
  document.getElementById("mod-dec").addEventListener("click", function(){
    modInput.value = clamp(readTrayMod() - 1, -50, 50);
  });

  // Reset button
  var resetBtn = document.getElementById("dice-reset");
  if(resetBtn){
    resetBtn.addEventListener("click", function(){
      qtyInput.value = 1;
      modInput.value = 0;
      advMode = "none";
      syncAdvButtons();
      renderDicePreview();
    });
  }

  // Roll again button
  var rollAgainBtn = document.getElementById("roll-again-btn");
  if(rollAgainBtn){
    rollAgainBtn.addEventListener("click", rollAgain);
  }

  // Clear log button
  var clearLogBtn = document.getElementById("clear-log-btn");
  if(clearLogBtn){
    clearLogBtn.addEventListener("click", function(){
      var c = getActive();
      if(c){
        c.rollLog = [];
        save();
      }
      renderRollLog();
    });
  }

  // Advantage buttons
  [["none","adv-normal"],["adv","adv-adv"],["dis","adv-dis"]].forEach(function(pair){
    var btn = document.getElementById(pair[1]);
    if(btn) btn.addEventListener("click", function(){ setAdvMode(pair[0]); });
  });
}
