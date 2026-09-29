import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";
import { showActionToast } from "../../ui/toast.js";
import { playCoins } from "../../ui/sound.js";
import { COINS, parseCoinAmount, addCoins, spendCoins, purseValueCp, formatGp } from "../../core/coins.js";

/* The Inventory tab's Currency card: one box per coin with a +/- 1
   stepper, and under it a coin purse bar for the real work of play
   ("the party splits 340 gp", "the room costs 5 sp"): type an amount,
   pick a coin, Add or Spend. Spending makes change like a shopkeeper
   would (see spendCoins). Coins fly into (or out of) their box, the
   counts tick up, and the purse clinks. */

var QUICK_AMOUNTS = [1, 10, 50, 100];

// Remembered across re-renders (every edit rebuilds the sheet).
var selectedCoin = "gp";

function reducedMotion(){
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

export function renderCurrencyCard(c){
  if(!c.currency) c.currency = {cp:0, sp:0, ep:0, gp:0, pp:0};

  var curCard = makeCard("Currency");
  var curGrid = document.createElement("div");
  curGrid.className = "currency-grid";

  COINS.forEach(function(coin){
    var box = document.createElement("div");
    box.className = "currency-box currency-" + coin.key;
    box.dataset.coin = coin.key;

    var header = document.createElement("div");
    header.className = "currency-header";
    header.innerHTML = '<span class="currency-abbr">'+coin.abbr+'</span><span class="currency-name">'+coin.name+'</span>';
    box.appendChild(header);

    var curVal = Number(c.currency[coin.key]) || 0;

    var stepper = document.createElement("div");
    stepper.className = "stat-stepper currency-stepper";

    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "stat-arrow-btn stat-arrow-down";
    downBtn.title = "Decrease " + coin.name;
    downBtn.setAttribute("aria-label", "Decrease " + coin.name);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = curVal <= 0;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var v = Number(c.currency[coin.key]) || 0;
      c.currency[coin.key] = Math.max(0, v - 1);
      save(); renderAll();
    });

    var valSpan = document.createElement("span");
    valSpan.className = "stat-score-val currency-val";
    valSpan.textContent = curVal;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "stat-arrow-btn stat-arrow-up";
    upBtn.title = "Increase " + coin.name;
    upBtn.setAttribute("aria-label", "Increase " + coin.name);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var v = Number(c.currency[coin.key]) || 0;
      c.currency[coin.key] = v + 1;
      save(); renderAll();
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(valSpan);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    curGrid.appendChild(box);
  });
  curCard.appendChild(curGrid);

  curCard.appendChild(renderPurseBar(c));

  var curSummary = document.createElement("div");
  curSummary.className = "currency-summary";
  curSummary.innerHTML = '<span>Total Wealth: <strong class="currency-total">' + formatGp(purseValueCp(c.currency)) + '</strong></span>';
  curCard.appendChild(curSummary);
  return curCard;
}

function renderPurseBar(c){
  var bar = document.createElement("div");
  bar.className = "purse-bar";

  // Row 1: amount + coin picker
  var entry = document.createElement("div");
  entry.className = "purse-entry";

  var input = document.createElement("input");
  input.type = "text";
  input.className = "purse-amount";
  input.inputMode = "numeric";
  input.autocomplete = "off";
  input.maxLength = 7;
  // Digits only: whether coin comes in or goes out is the Add / Spend
  // button's call, so a minus sign (or anything else) is just dropped.
  input.addEventListener("input", function(){
    var clean = input.value.replace(/\D/g, "");
    if(clean !== input.value) input.value = clean;
  });
  input.placeholder = "Amount, e.g. 250";
  input.setAttribute("aria-label", "Amount of coin to add or spend");
  entry.appendChild(input);

  var picker = document.createElement("div");
  picker.className = "purse-coins";
  picker.setAttribute("role", "radiogroup");
  picker.setAttribute("aria-label", "Coin");
  COINS.forEach(function(coin){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "purse-coin purse-coin-" + coin.key + (coin.key===selectedCoin ? " selected" : "");
    b.textContent = coin.abbr;
    b.title = coin.name;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", coin.key===selectedCoin ? "true" : "false");
    b.addEventListener("click", function(){
      selectedCoin = coin.key;
      picker.querySelectorAll(".purse-coin").forEach(function(el){
        var on = el === b;
        el.classList.toggle("selected", on);
        el.setAttribute("aria-checked", on ? "true" : "false");
      });
      quick.querySelectorAll(".purse-chip-coin").forEach(function(el){ el.textContent = coin.abbr; });
      input.focus();
    });
    picker.appendChild(b);
  });
  entry.appendChild(picker);
  bar.appendChild(entry);

  // Row 2: one-tap amounts + Spend / Add
  var actions = document.createElement("div");
  actions.className = "purse-actions";

  var quick = document.createElement("div");
  quick.className = "purse-quick";
  QUICK_AMOUNTS.forEach(function(n){
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "purse-chip";
    chip.innerHTML = "+" + n + ' <span class="purse-chip-coin">' + coinByKey(selectedCoin).abbr + "</span>";
    chip.title = "Add " + n + " of the selected coin";
    chip.addEventListener("click", function(){
      commit(c, selectedCoin, n, false, chip, false);
    });
    quick.appendChild(chip);
  });
  actions.appendChild(quick);

  var spendBtn = document.createElement("button");
  spendBtn.type = "button";
  spendBtn.className = "purse-btn purse-spend";
  spendBtn.textContent = "Spend";
  spendBtn.addEventListener("click", function(){ submit(true, spendBtn); });
  actions.appendChild(spendBtn);

  var addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "purse-btn purse-add";
  addBtn.textContent = "Add";
  addBtn.addEventListener("click", function(){ submit(false, addBtn); });
  actions.appendChild(addBtn);

  bar.appendChild(actions);

  var hint = document.createElement("div");
  hint.className = "purse-hint";
  hint.textContent = "Spending breaks larger coins for change.";
  bar.appendChild(hint);

  input.addEventListener("keydown", function(e){
    if(e.key !== "Enter") return;
    e.preventDefault();
    submit(false, addBtn);
  });

  function submit(spend, sourceEl){
    var amount = parseCoinAmount(input.value);
    if(!amount){
      nudge(bar);
      input.focus();
      return;
    }
    commit(c, selectedCoin, amount, spend, sourceEl, true);
  }

  return bar;
}

function coinByKey(key){
  return COINS.filter(function(coin){ return coin.key === key; })[0];
}

/* Apply the change, re-render, then play the effects on the new DOM
   (renderAll rebuilds the whole sheet, so they run after it). */
function commit(c, key, amount, spend, sourceEl, fromInput){
  var before = Object.assign({}, c.currency);
  var coin = coinByKey(key);
  var after;
  if(spend){
    var res = spendCoins(before, key, amount);
    if(!res.ok){
      nudge(sourceEl.closest(".purse-bar") || sourceEl);
      showActionToast("Not enough coin: " + amount + " " + coin.abbr + " is " + formatGp(res.shortCp) + " more than the purse holds.", true);
      playCoins(1, true);
      return;
    }
    after = res.purse;
  } else {
    after = addCoins(before, key, amount);
  }

  var fromRect = sourceEl.getBoundingClientRect();
  c.currency = after;
  save(); renderAll();

  var magnitude = Math.round(Math.log10(amount * coin.cp) + 1);
  playCoins(magnitude, spend);

  if(fromInput){
    var newInput = document.querySelector(".purse-amount");
    if(newInput) newInput.focus({preventScroll:true});
  }

  var motion = !reducedMotion();
  COINS.forEach(function(k){
    var oldN = Number(before[k.key]) || 0, newN = Number(after[k.key]) || 0;
    if(oldN === newN) return;
    var box = document.querySelector('.currency-box[data-coin="' + k.key + '"]');
    if(!box) return;
    var gained = newN > oldN;
    box.classList.add(gained ? "coin-gain" : "coin-loss");
    floatLabel(box, (gained ? "+" : "−") + Math.abs(newN - oldN) + " " + k.abbr, gained, motion);
    if(!motion) return;
    var val = box.querySelector(".currency-val");
    if(val) countTo(val, oldN, newN, function(n){ return String(n); });
    var toRect = box.getBoundingClientRect();
    var n = Math.min(10, 2 + Math.round(Math.log10(Math.abs(newN - oldN) + 1) * 3));
    if(gained) flyCoins(k.key, fromRect, toRect, n);
    else spillCoins(k.key, toRect, n);
  });

  var total = document.querySelector(".currency-total");
  if(total){
    total.classList.add(spend ? "total-down" : "total-up");
    if(motion) countTo(total, purseValueCp(before), purseValueCp(after), formatGp);
  }
}

/* A short shake: "that didn't work". */
function nudge(el){
  el.classList.remove("purse-nudge");
  void el.offsetWidth;
  el.classList.add("purse-nudge");
}

function countTo(el, from, to, fmt){
  var start = performance.now(), dur = 650;
  el.textContent = fmt(from);
  function frame(now){
    if(!el.isConnected) return;
    var t = Math.min(1, (now - start) / dur);
    var eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(Math.round(from + (to - from) * eased));
    if(t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function fxLayer(){
  var layer = document.getElementById("coin-fx-layer");
  if(!layer){
    layer = document.createElement("div");
    layer.id = "coin-fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }
  return layer;
}

function makeCoin(key){
  var el = document.createElement("div");
  el.className = "fx-coin fx-coin-" + key;
  fxLayer().appendChild(el);
  return el;
}

/* Coins arc from the button that was pressed into the coin's box. */
function flyCoins(key, fromRect, toRect, n){
  var sx = fromRect.left + fromRect.width/2, sy = fromRect.top + fromRect.height/2;
  var ex = toRect.left + toRect.width/2, ey = toRect.top + toRect.height/2;
  for(var i=0;i<n;i++){
    var el = makeCoin(key);
    var jx = (Math.random()-0.5)*28, jy = (Math.random()-0.5)*14;
    var lift = 60 + Math.random()*60;
    var mx = (sx + ex)/2 + (Math.random()-0.5)*80, my = Math.min(sy, ey) - lift;
    var spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random()*360);
    var anim = el.animate([
      { transform: "translate(" + (sx+jx) + "px," + (sy+jy) + "px) scale(.4) rotateY(0deg)", opacity: 0 },
      { transform: "translate(" + mx + "px," + my + "px) scale(1.15) rotateY(" + spin/2 + "deg)", opacity: 1, offset: 0.45 },
      { transform: "translate(" + ex + "px," + ey + "px) scale(.7) rotateY(" + spin + "deg)", opacity: 0.9 }
    ], { duration: 620 + Math.random()*160, delay: i*55, easing: "cubic-bezier(.3,.6,.4,1)", fill: "both" });
    anim.onfinish = remover(el);
  }
}

/* Coins pop out of the box and tumble away. */
function spillCoins(key, rect, n){
  var sx = rect.left + rect.width/2, sy = rect.top + rect.height/2;
  for(var i=0;i<n;i++){
    var el = makeCoin(key);
    var dx = (Math.random()-0.5)*140;
    var up = 30 + Math.random()*40;
    var spin = (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random()*300);
    var anim = el.animate([
      { transform: "translate(" + sx + "px," + sy + "px) scale(.8) rotateY(0deg)", opacity: 1 },
      { transform: "translate(" + (sx+dx*0.5) + "px," + (sy-up) + "px) scale(1) rotateY(" + spin/2 + "deg)", opacity: 1, offset: 0.35 },
      { transform: "translate(" + (sx+dx) + "px," + (sy+90) + "px) scale(.6) rotateY(" + spin + "deg)", opacity: 0 }
    ], { duration: 700 + Math.random()*200, delay: i*45, easing: "cubic-bezier(.2,.7,.5,1)", fill: "both" });
    anim.onfinish = remover(el);
  }
}

function remover(el){ return function(){ el.remove(); }; }

/* "+50 GP" drifting up out of the box. */
function floatLabel(box, text, gained, motion){
  var label = document.createElement("span");
  label.className = "coin-float " + (gained ? "gain" : "loss") + (motion ? "" : " still");
  label.textContent = text;
  box.appendChild(label);
  setTimeout(function(){ label.remove(); }, 1400);
}
