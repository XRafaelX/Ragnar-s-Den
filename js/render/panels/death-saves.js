import { save } from "../../core/state.js";
import { renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { getDieSvg, logRoll } from "../../dice/dice.js";
import { playDiceRattle, playDeathSaveSuccess, playDeathSaveFail, playStabilized, playDeath, playRevive } from "../../ui/sound.js";

/* ---------------- Death saving throws ----------------
   Shown in the HP box while the character is at 0 HP: three heart pips
   (successes), three skull pips (failures) and a d20 in between. Rolling
   follows the 5e rules: 10+ succeeds, 2-9 fails, a natural 1 counts as two
   failures and a natural 20 brings the character back with 1 HP. Pips can
   also be tapped to mark or clear a save by hand (advantage, a hit while
   down, a table ruling). Three successes shows Stable; three failures
   shows Dead.

   renderAll rebuilds the sheet, so effects (pip pops, the rolled number,
   the status line) are applied to the new DOM right after it. */

var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
var SKULL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ds-skull-head" d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20Z"/><path class="ds-skull-jaw" d="M8 20v2h8v-2"/><circle class="ds-skull-eye" cx="9" cy="12" r="1.6"/><circle class="ds-skull-eye" cx="15" cy="12" r="1.6"/></svg>';
var SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path class="ds-shield-check" d="m9 12 2 2 4-4"/></svg>';

var HINT = "10+ succeeds · Natural 20 regains 1 HP";

function reducedMotion(){
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function counts(c){
  var ds = c.deathSaves || {};
  return {
    success: Math.max(0, Math.min(3, Number(ds.success)||0)),
    fail: Math.max(0, Math.min(3, Number(ds.fail)||0))
  };
}

/* The Death Saves strip for the HP box. */
export function renderDeathSaves(c){
  var n = counts(c);
  var stable = n.success >= 3 && n.fail < 3;
  var dead = n.fail >= 3;

  var box = document.createElement("div");
  box.className = "death-saves" + (stable ? " is-stable" : "") + (dead ? " is-dead" : "");
  // The heart beats faster the closer the character is to death.
  box.style.setProperty("--ds-beat", [1.25, 0.95, 0.7][Math.min(n.fail, 2)] + "s");

  var head = document.createElement("div");
  head.className = "ds-head";
  head.innerHTML = '<span class="ds-heart">' + HEART + '</span><span class="ds-title">Death Saves</span>';
  box.appendChild(head);

  var body = document.createElement("div");
  body.className = "ds-body";
  body.appendChild(track(c, "success", n.success));

  var core = document.createElement("div");
  core.className = "ds-core";
  if(stable || dead){
    var badge = document.createElement("div");
    badge.className = "ds-outcome";
    badge.innerHTML = (dead ? SKULL : SHIELD) + '<span>' + (dead ? "Dead" : "Stable") + '</span>';
    core.appendChild(badge);
  } else {
    var roll = document.createElement("button");
    roll.type = "button";
    roll.className = "ds-roll";
    roll.title = "Roll a death saving throw (d20)";
    roll.setAttribute("aria-label", "Roll a death saving throw");
    roll.innerHTML = '<span class="ds-die">' + getDieSvg(20, "?") + '</span><span class="ds-roll-lbl">Roll</span>';
    roll.addEventListener("click", function(e){
      e.stopPropagation();
      rollDeathSave(c, roll);
    });
    core.appendChild(roll);
  }
  body.appendChild(core);

  body.appendChild(track(c, "fail", n.fail));
  box.appendChild(body);

  var status = document.createElement("div");
  status.className = "ds-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = dead ? "Three failures. The character has died."
    : stable ? "Stable at 0 HP. No more saves unless you take damage."
    : HINT;
  box.appendChild(status);

  return box;
}

function track(c, kind, filled){
  var wrap = document.createElement("div");
  wrap.className = "ds-track ds-" + kind;
  var pips = document.createElement("div");
  pips.className = "ds-pips";
  pips.setAttribute("role", "group");
  pips.setAttribute("aria-label", kind === "success" ? "Successes" : "Failures");
  for(var i=0;i<3;i++){
    var pip = document.createElement("button");
    pip.type = "button";
    pip.className = "ds-pip" + (i < filled ? " filled" : "");
    pip.dataset.kind = kind;
    pip.dataset.i = i;
    pip.innerHTML = kind === "success" ? HEART : SKULL;
    pip.setAttribute("aria-pressed", i < filled ? "true" : "false");
    pip.setAttribute("aria-label", (kind === "success" ? "Success " : "Failure ") + (i+1));
    (function(i){
      pip.addEventListener("click", function(e){
        e.stopPropagation();
        var before = counts(c)[kind];
        // Tapping the last filled pip clears it; any other pip fills up to it.
        var next = before === i+1 ? i : i+1;
        c.deathSaves[kind] = next;
        save(); renderAll();
        if(next > before) afterMark(c, kind, before, next, false, null);
      });
    })(i);
    pips.appendChild(pip);
  }
  var lbl = document.createElement("span");
  lbl.className = "ds-track-lbl";
  lbl.textContent = kind === "success" ? "Successes" : "Failures";
  wrap.appendChild(pips);
  wrap.appendChild(lbl);
  return wrap;
}

/* Tumble the d20 in place, then apply the result. */
function rollDeathSave(c, btn){
  if(btn.disabled) return;
  btn.disabled = true;
  var value = Math.floor(Math.random()*20) + 1;
  var text = btn.querySelector(".die-text");
  var motion = !reducedMotion();
  playDiceRattle();
  btn.classList.add("rolling");
  var cycle = motion ? setInterval(function(){
    if(text) text.textContent = Math.floor(Math.random()*20) + 1;
  }, 50) : null;
  setTimeout(function(){
    if(cycle) clearInterval(cycle);
    if(text) text.textContent = value;
    btn.classList.remove("rolling");
    btn.classList.add("landed");
    if(value === 20) btn.classList.add("nat-20");
    if(value === 1) btn.classList.add("nat-1");
    setTimeout(function(){ applyRoll(c, value); }, motion ? 320 : 0);
  }, motion ? 640 : 60);
}

function applyRoll(c, value){
  var n = counts(c);
  if(value === 20){
    c.hp.current = 1;
    c.deathSaves = {success:0, fail:0};
    logRoll("Death save", "[20] Natural 20: back up with 1 HP.");
    save(); renderSidebar(); renderAll();
    playRevive();
    var hp = document.querySelector(".hp-cur-num");
    if(hp && !reducedMotion()) hp.classList.add("hp-revived");
    return;
  }
  var kind = value >= 10 ? "success" : "fail";
  var before = n[kind];
  var next = Math.min(3, before + (value === 1 ? 2 : 1));
  c.deathSaves[kind] = next;
  var word = kind === "success" ? "success" : (value === 1 ? "natural 1, two failures" : "failure");
  logRoll("Death save", "[" + value + "] " + word.charAt(0).toUpperCase() + word.slice(1) +
    " (" + next + "/3 " + (kind === "success" ? "successes" : "failures") + ")");
  save(); renderAll();
  afterMark(c, kind, before, next, value === 1, value);
}

/* Effects on the freshly rendered strip: pop the new pips, show the
   rolled number, shake on a failure and play the matching sound. */
function afterMark(c, kind, before, next, double, rolled){
  var box = document.querySelector(".death-saves");
  var motion = !reducedMotion();
  var other = counts(c)[kind === "success" ? "fail" : "success"];
  var finished = next >= 3 && (kind === "fail" || other < 3);

  if(finished){
    if(kind === "fail") playDeath(); else playStabilized();
  } else if(kind === "success"){
    playDeathSaveSuccess();
  } else {
    playDeathSaveFail(double);
  }
  if(!box) return;

  if(motion){
    for(var i=before;i<next;i++){
      var pip = box.querySelector('.ds-pip[data-kind="' + kind + '"][data-i="' + i + '"]');
      if(pip){
        pip.style.animationDelay = ((i - before) * 0.16) + "s";
        pip.classList.add("just-marked");
      }
    }
    if(finished) box.classList.add("just-finished");
    else if(kind === "fail") box.classList.add("ds-shake");
    else box.classList.add("ds-glow");
  }

  if(rolled != null){
    var die = box.querySelector(".ds-roll .die-text");
    if(die){
      die.textContent = rolled;
      box.querySelector(".ds-roll").classList.add("shown", rolled === 1 ? "nat-1" : (kind === "success" ? "was-success" : "was-fail"));
    }
    if(!finished){
      var status = box.querySelector(".ds-status");
      if(status){
        status.textContent = "Rolled " + rolled + ": " + (rolled === 1 ? "two failures" : kind === "success" ? "success" : "failure");
        status.classList.add(kind === "success" ? "is-success" : "is-fail");
      }
    }
  }
}
