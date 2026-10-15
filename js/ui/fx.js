/* ---------------- Sheet effects ----------------
   Short animations for the moments that matter at the table: spending
   or getting back a spell slot or a class resource, short and long
   rests, and a new character's first appearance. The sheet redraws on
   every change, so each effect is called right after the redraw and
   marks the freshly drawn element, the way the HP flash and the
   death-save pips do. Nothing runs when the device asks for reduced
   motion. Styles are in css/components/fx.css. */

var BURST_COLORS = ["#fde68a", "#fbbf24", "#f9a8d4", "#a78bfa", "#67e8f9", "#ffffff"];

export function reducedMotion(){
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/* Plays a one-shot animation class on `el`, optionally after `delay` ms,
   and takes it off again once the element's own animation ends (its
   pseudo-element rings and motes are never longer). The delay goes in a
   custom property so those rings and motes wait for it too. */
export function flash(el, cls, delay){
  if(!el || reducedMotion()) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.style.setProperty("--fx-delay", (delay || 0) + "ms");
  el.classList.add(cls);
  el.addEventListener("animationend", function done(e){
    if(e.target !== el || e.pseudoElement) return;
    el.classList.remove(cls);
    el.style.removeProperty("--fx-delay");
    el.removeEventListener("animationend", done);
  });
}

/* One pip that was just spent (`spent`) or got back. `pips` is the row of
   pips as drawn now, `index` the pip that changed. */
export function pipChanged(pips, index, spent){
  if(!pips) return;
  flash(pips.children[index], spent ? "fx-spent" : "fx-restored");
}

/* Pips that came back together (a rest): each fills in turn, from
   `from` up to but not including `to`, after `startDelay` ms. */
export function pipsRefilled(pips, from, to, startDelay){
  if(!pips) return;
  for(var i = from; i < to; i++) flash(pips.children[i], "fx-restored", (startDelay || 0) + (i - from) * 90);
}

/* "−1" or "+5" rising from a point pool's number (Ki, Lay on Hands), so
   you see how much went or came back, not just that it changed. Each tap
   redraws the card, so taps on the same pool within a second add up
   ("−3") instead of the last one replacing the others. With reduced
   motion the amount still shows, then fades without moving, like the
   coin purse's. */
var lastDelta = {key:null, total:0, at:0};
var DELTA_SUM_MS = 1000;

export function floatDelta(numEl, delta, key, delay){
  if(!numEl || !delta) return;
  var now = Date.now();
  if(key && key === lastDelta.key && now - lastDelta.at < DELTA_SUM_MS) lastDelta.total += delta;
  else lastDelta = {key:key, total:delta, at:now};
  lastDelta.at = now;
  var total = lastDelta.total;
  if(!total) return;
  var label = document.createElement("span");
  label.className = "fx-delta " + (total > 0 ? "gain" : "loss") + (reducedMotion() ? " still" : "");
  label.textContent = (total > 0 ? "+" : "\u2212") + Math.abs(total);
  label.setAttribute("aria-hidden", "true");
  label.style.animationDelay = (delay || 0) + "ms";
  numEl.parentElement.appendChild(label);
  setTimeout(function(){ label.remove(); }, 1400 + (delay || 0));
}

/* A short rest round a campfire (embers rising on a warm glow), or a
   long rest through the night (moon and stars, then dawn). It sits over
   the page without blocking it, and under the Prepare today sheet. */
export function restScene(kind){
  if(reducedMotion()) return;
  var old = document.querySelector(".fx-rest");
  if(old) old.remove();
  var scene = document.createElement("div");
  scene.className = "fx-rest fx-rest-" + kind;
  scene.setAttribute("aria-hidden", "true");
  var i, bit;
  if(kind === "long"){
    scene.innerHTML = '<div class="fx-night"></div><div class="fx-moon"></div><div class="fx-dawn"></div>';
    for(i = 0; i < 16; i++){
      bit = document.createElement("span");
      bit.className = "fx-star";
      bit.style.left = (6 + Math.random() * 88) + "%";
      bit.style.top = (4 + Math.random() * 50) + "%";
      bit.style.animationDelay = Math.round(Math.random() * 250) + "ms";
      scene.appendChild(bit);
    }
  }else{
    scene.innerHTML = '<div class="fx-fire-glow"></div>';
    for(i = 0; i < 18; i++){
      bit = document.createElement("span");
      bit.className = "fx-ember";
      bit.style.left = (28 + Math.random() * 44) + "%";
      bit.style.setProperty("--drift", Math.round(Math.random() * 90 - 45) + "px");
      bit.style.setProperty("--dur", (0.9 + Math.random() * 0.6).toFixed(2) + "s");
      bit.style.animationDelay = Math.round(Math.random() * 600) + "ms";
      scene.appendChild(bit);
    }
  }
  document.body.appendChild(scene);
  setTimeout(function(){ scene.remove(); }, kind === "long" ? 2500 : 2100);
}

/* A ring and a scatter of sparks around a point on the screen. */
function burstAt(x, y, delay){
  var burst = document.createElement("div");
  burst.className = "fx-burst";
  burst.setAttribute("aria-hidden", "true");
  burst.style.left = x + "px";
  burst.style.top = y + "px";
  burst.style.setProperty("--delay", (delay || 0) + "ms");
  var ring = document.createElement("span");
  ring.className = "fx-burst-ring";
  burst.appendChild(ring);
  var count = 16;
  for(var i = 0; i < count; i++){
    var spark = document.createElement("span");
    spark.className = "fx-spark";
    spark.style.setProperty("--a", (i * 360 / count + Math.random() * 16 - 8) + "deg");
    spark.style.setProperty("--dist", Math.round(54 + Math.random() * 34) + "px");
    spark.style.setProperty("--c", BURST_COLORS[i % BURST_COLORS.length]);
    burst.appendChild(spark);
  }
  document.body.appendChild(burst);
  setTimeout(function(){ burst.remove(); }, 1200 + (delay || 0));
}

/* Counts a plain number up from 0 to what it shows. */
function countUp(el, delay, duration){
  if(!el || !/^\d+$/.test(el.textContent.trim())) return;
  var target = parseInt(el.textContent, 10);
  el.textContent = "0";
  setTimeout(function(){
    var start = performance.now();
    (function step(now){
      if(!el.isConnected) return;
      var t = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if(t < 1) requestAnimationFrame(step);
    })(start);
  }, delay);
}

/* A new character's first appearance, straight out of the wizard: the
   portrait pops in with a burst, the header rises in line by line, then
   the cards, while hit points and AC count up. The classes go on the
   drawn elements themselves, so a later redraw never plays it again. */
export function characterBorn(){
  if(reducedMotion()) return;
  var sheet = document.getElementById("sheet");
  if(!sheet) return;
  var avatar = sheet.querySelector(".identity .avatar");
  if(avatar){
    flash(avatar, "fx-pop");
    var r = avatar.getBoundingClientRect();
    burstAt(r.left + r.width / 2, r.top + r.height / 2, 180);
  }
  var order = [".identity .name-row", ".identity .char-title-wrap", ".identity .sub-row", ".identity .identity-compact",
               ".identity .classes-row", ".identity .level-row", "#tabs"];
  var delay = 140;
  order.forEach(function(sel){
    var el = sheet.querySelector(sel);
    if(!el || !el.getClientRects().length) return; // not shown at this width
    flash(el, "fx-rise", delay);
    delay += 80;
  });
  sheet.querySelectorAll(".panel.active > .card").forEach(function(card, i){
    flash(card, "fx-rise", delay + i * 90);
  });
  countUp(sheet.querySelector(".hp-vital-box .hp-cur-num"), delay, 900);
  countUp(sheet.querySelector(".ac-vital-box .init-hero-val"), delay + 90, 900);
}
