import { soulOfArtificeReady, endInfusion } from "../../core/artificer.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { sheetTop, lead, sheetButton } from "./paladin.js";
import { save } from "../../core/state.js";
import { renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { getDieSvg, logRoll, performRoll } from "../../dice/dice.js";
import { searingVengeanceReady, necroticHuskReady, spendForRests, mod, strengthOfTheGrave, blazingRevivalReady, useBlazingRevival, faithfulSummonsReady, maxHp, computeSave, saveRollMode, relentlessRageDc, resolveRelentlessRage, rageBeyondDeath, endAllEffects, addCondition, fmtMod, characterResources, soulTrinkets, classLevelOf, kiLeft, spendKi, removeCondition, resourceLeft, spendResource } from "../../core/helpers.js";
import { abilityScore } from "../../core/ability-scores.js";
import { showActionToast } from "../../ui/toast.js";
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
var HINT_ADV = "Advantage from your soul trinket · " + HINT;

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

/* The Death Saves strip for the HP box (or, right after dropping to 0
   HP while raging, Relentless Rage's save in its place). */
export function renderDeathSaves(c){
  if(c.rage && c.rage.relentless) return renderRelentless(c);
  var n = counts(c);
  var stable = n.success >= 3 && n.fail < 3;
  var dead = n.fail >= 3;
  // Rage Beyond Death: death waits until the rage ends.
  var holding = rageBeyondDeath(c);

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
    badge.innerHTML = (dead ? SKULL : SHIELD) + '<span>' + (dead ? (holding ? "Holding on" : "Dead") : "Stable") + '</span>';
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

  // Strength Before Death (Samurai 18): a reaction for an extra turn
  // before falling unconscious, once per long rest.
  var sbd = strengthBeforeDeath(c);
  if(sbd && !dead){
    var sbdBtn = document.createElement("button");
    sbdBtn.type = "button";
    sbdBtn.className = "btn small primary ds-extra-turn";
    sbdBtn.textContent = c.extraTurn ? "End the extra turn" : "Strength Before Death";
    sbdBtn.title = c.extraTurn ? "You fall unconscious if you're still at 0 HP" : "Reaction: delay falling unconscious and take an extra turn right now";
    sbdBtn.disabled = !c.extraTurn && !sbd.left;
    sbdBtn.addEventListener("click", function(e){
      e.stopPropagation();
      if(c.extraTurn){ delete c.extraTurn; logRoll("Strength Before Death", "The extra turn ends."); }
      else {
        c.resourcesUsed[sbd.key] = sbd.used + 1;
        c.extraTurn = true;
        logRoll("Strength Before Death", "An extra turn right now, at 0 HP. Damage still causes death save failures.");
      }
      save(); renderSidebar(); renderAll();
    });
    box.appendChild(sbdBtn);
  }

  // Mastery of Death (Way of Long Death 11): 1 ki for 1 hit point instead.
  if(classLevelOf(c, "Monk", "Way of Long Death") >= 11 && !dead){
    box.appendChild(backToOne(c, "ds-mastery", "Mastery of Death · 1 ki", kiLeft(c) >= 1, "No ki left", function(){ return spendKi(c, 1); }, "1 hit point instead of 0 (1 ki)."));
  }
  // Blazing Revival (Wildfire 14): the spirit drops to 0 and you rise with half your hit points.
  if(blazingRevivalReady(c) && !dead){
    var revive = document.createElement("button");
    revive.type = "button"; revive.className = "btn small primary ds-revival";
    revive.textContent = "Blazing Revival";
    revive.title = "Your wildfire spirit drops to 0 hit points if it's within 120 feet: regain half your hit points and rise to your feet";
    revive.addEventListener("click", function(e){
      e.stopPropagation();
      if(!useBlazingRevival(c, maxHp(c))) return;
      removeCondition(c, "prone");
      logRoll("Blazing Revival", "Your spirit fell. You rise with " + c.hp.current + " hit points.");
      playRevive();
      save(); renderSidebar(); renderAll();
    });
    box.appendChild(revive);
  }
  // Soul of Artifice (artificer 20): an infusion ends, and you have 1 hit point.
  if(soulOfArtificeReady(c) && !dead){
    var soul = document.createElement("button");
    soul.type = "button"; soul.className = "btn small primary ds-soul";
    soul.textContent = "Soul of Artifice";
    soul.title = "Reaction: end one of your infusions to have 1 hit point instead of 0";
    soul.addEventListener("click", function(e){
      e.stopPropagation();
      openBottomSheet(function(body, refresh, close){
        sheetTop(body, "Soul of Artifice", close);
        lead(body, "End which infusion?");
        var list = document.createElement("div");
        list.className = "pal-sheet-list";
        (c.infusions.active||[]).forEach(function(a){
          list.appendChild(sheetButton(a.name, function(){
            endInfusion(c, a);
            c.hp.current = 1;
            c.deathSaves = {success: 0, fail: 0};
            removeCondition(c, "prone");
            logRoll("Soul of Artifice", a.name + " ended. 1 hit point instead of 0.");
            playRevive();
            close();
            save(); renderSidebar(); renderAll();
          }));
        });
        body.appendChild(list);
      });
    });
    box.appendChild(soul);
  }
  // Strength of the Grave (Shadow Magic 1): only a success spends it.
  if(strengthOfTheGrave(c) && !dead){
    var grave = document.createElement("button");
    grave.type = "button"; grave.className = "btn small primary ds-grave";
    grave.textContent = "Strength of the Grave";
    grave.title = "CHA save, DC 5 + the damage you took. Not against radiant damage or a critical hit.";
    grave.addEventListener("click", function(e){
      e.stopPropagation();
      var save2 = computeSave(c, "cha");
      performRoll(20, 1, save2.value, saveRollMode(c, "cha").mode, "Strength of the Grave (DC 5 + the damage)", function(r){
        if(!r) return null;
        return {lead: "Saved?", options: [{label: "Back to 1 hit point", title: "Only a success spends it",
          use: function(){
            if(!spendResource(c, "Sorcerer:strength_of_the_grave", 1)) return null;
            c.hp.current = 1;
            c.deathSaves = {success: 0, fail: 0};
            removeCondition(c, "prone");
            playRevive();
            save(); renderSidebar(); renderAll();
            return {silent: true};
          }}]};
      });
    });
    box.appendChild(grave);
  }
  // Searing Vengeance (Celestial 14): instead of a death save.
  if(searingVengeanceReady(c) && !dead){
    var searing = document.createElement("button");
    searing.type = "button"; searing.className = "btn small primary ds-searing";
    searing.textContent = "Searing Vengeance";
    searing.title = "Instead of the death save at the start of your turn: regain half your hit points and stand. Creatures you choose within 30 ft take radiant damage and are blinded until the end of the turn.";
    searing.addEventListener("click", function(e){
      e.stopPropagation();
      if(!spendResource(c, "Warlock:searing_vengeance", 1)) return;
      c.hp.current = Math.floor(maxHp(c) / 2);
      c.deathSaves = {success: 0, fail: 0};
      removeCondition(c, "prone");
      playRevive();
      save(); renderSidebar(); renderAll();
      performRoll(8, 2, mod(abilityScore(c, "cha")), "none", "Searing Vengeance (Radiant)");
    });
    box.appendChild(searing);
  }
  // Necrotic Husk (Undead 10): 1 hit point instead, an eruption and a level of exhaustion.
  if(necroticHuskReady(c) && !dead){
    var husk = document.createElement("button");
    husk.type = "button"; husk.className = "btn small primary ds-husk";
    husk.textContent = "Necrotic Husk";
    husk.title = "Reaction when you would drop to 0: 1 hit point instead. Creatures you choose within 30 ft take necrotic damage, and you gain a level of exhaustion. It comes back after 1d4 long rests.";
    husk.addEventListener("click", function(e){
      e.stopPropagation();
      var rests = spendForRests(c, "Warlock:necrotic_husk");
      if(!rests) return;
      c.hp.current = 1;
      c.deathSaves = {success: 0, fail: 0};
      c.exhaustion = Math.min(6, (Number(c.exhaustion)||0) + 1);
      removeCondition(c, "prone");
      logRoll("Necrotic Husk", "1 hit point instead. It comes back after " + rests + (rests===1 ? " long rest." : " long rests."));
      playRevive();
      save(); renderSidebar(); renderAll();
      performRoll(10, 2, classLevelOf(c, "Warlock", "The Undead"), "none", "Necrotic Husk (Necrotic)");
    });
    box.appendChild(husk);
  }
  // Faithful Summons (Shepherd 14): four beasts protect you.
  if(faithfulSummonsReady(c) && !dead){
    var summons = document.createElement("button");
    summons.type = "button"; summons.className = "btn small primary ds-summons";
    summons.textContent = "Faithful Summons";
    summons.title = "Four beasts of challenge rating 2 or lower appear within 20 feet and protect you for 1 hour, with no concentration";
    summons.addEventListener("click", function(e){
      e.stopPropagation();
      if(!spendResource(c, "Druid:faithful_summons", 1)) return;
      logRoll("Faithful Summons", "Four beasts of CR 2 or lower appear within 20 feet and protect you for 1 hour.");
      showActionToast("Four beasts come to protect you.");
      save(); renderSidebar(); renderAll();
    });
    box.appendChild(summons);
  }
  // Undying Sentinel (Oath of the Ancients 15): 1 hit point instead, once per long rest.
  if(classLevelOf(c, "Paladin", "Oath of the Ancients") >= 15 && !dead){
    var sentinel = resourceLeft(c, "Paladin:undying_sentinel") > 0;
    box.appendChild(backToOne(c, "ds-sentinel", "Undying Sentinel", sentinel, "Used until a long rest", function(){ return spendResource(c, "Paladin:undying_sentinel", 1); }, "1 hit point instead of 0."));
  }

  var status = document.createElement("div");
  status.className = "ds-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = dead ? (holding ? "Three failures, but your rage holds death off. You die when it ends if you're still at 0 HP." : "Three failures. The character has died.")
    : stable ? "Stable at 0 HP. No more saves unless you take damage."
    : holding ? "Rage Beyond Death: you stay conscious and keep fighting. " + HINT
    : c.extraTurn ? "Strength Before Death: your extra turn. You fall unconscious when it ends if you're still at 0 HP."
    : soulTrinkets(c) && soulTrinkets(c).held ? HINT_ADV
    : HINT;
  box.appendChild(status);

  return box;
}

/* A feature that leaves you on 1 hit point instead of 0. */
function backToOne(c, cls, label, ready, whyNot, pay, log){
  var name = label.split(" · ")[0];
  var b = document.createElement("button");
  b.type = "button";
  b.className = "btn small primary " + cls;
  b.textContent = label;
  b.title = ready ? "When you're reduced to 0 hit points: have 1 hit point instead (no action)" : whyNot;
  b.disabled = !ready;
  b.addEventListener("click", function(e){
    e.stopPropagation();
    if(!pay()) return;
    c.hp.current = 1;
    c.deathSaves = {success: 0, fail: 0};
    removeCondition(c, "prone");
    logRoll(name, log);
    showActionToast(name + ": you have 1 hit point instead.");
    playRevive();
    save(); renderSidebar(); renderAll();
  });
  return b;
}

/* Relentless Rage (barbarian 11): dropping to 0 HP while raging, a
   Constitution save (DC 10, 5 more each use since a rest) puts the
   barbarian back on 1 HP, still raging. A failure ends the rage there,
   unless Rage Beyond Death holds it. */
function renderRelentless(c){
  var dc = relentlessRageDc(c), sv = computeSave(c, "con"), mode = saveRollMode(c, "con");
  var box = document.createElement("div");
  box.className = "death-saves ds-relentless";
  var head = document.createElement("div");
  head.className = "ds-head";
  head.innerHTML = '<span class="ds-heart">' + HEART + '</span><span class="ds-title">Relentless Rage</span>';
  box.appendChild(head);
  var status = document.createElement("div");
  status.className = "ds-status";
  status.textContent = "You dropped to 0 HP while raging. Make a Constitution save, DC " + dc + ". On a success you drop to 1 HP instead.";
  box.appendChild(status);
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn small primary ds-relentless-roll";
  btn.textContent = "Roll CON save (" + fmtMod(sv.value) + (mode.mode==="adv" ? ", Adv" : mode.mode==="dis" ? ", Dis" : "") + ")";
  if(mode.reason) btn.title = mode.reason;
  btn.addEventListener("click", function(e){
    e.stopPropagation();
    btn.disabled = true;
    performRoll(20, 1, sv.value, mode.mode, "Relentless Rage: CON save (DC " + dc + ")", {onResult: function(r){
      var outcome = resolveRelentlessRage(c, r.total);
      if(outcome==="up"){
        logRoll("Relentless Rage", "Saved (" + r.total + " vs DC " + dc + "): back up on 1 HP, still raging.");
        showActionToast("Relentless Rage: you drop to 1 HP instead.");
        playRevive();
      } else if(outcome==="down"){
        // The rage ends with the fall, unless Rage Beyond Death holds it.
        var holds = rageBeyondDeath(c);
        if(!holds){ endAllEffects(c); addCondition(c, "prone"); }
        logRoll("Relentless Rage", "Failed (" + r.total + " vs DC " + dc + ")." + (holds ? " Rage Beyond Death keeps you conscious." : " You fall unconscious."));
        showActionToast(holds ? "Relentless Rage failed. Rage Beyond Death keeps you up." : "Relentless Rage failed. You fall unconscious.", !holds);
      }
      save(); renderSidebar(); renderAll();
    }});
  });
  box.appendChild(btn);
  return box;
}

/* Strength Before Death's use: {key, used, left}, or null without it. */
function strengthBeforeDeath(c){
  var r = characterResources(c).find(function(x){ return x.key==="Fighter:strength_before_death"; });
  return r ? {key: r.key, used: r.used, left: r.max - r.used} : null;
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
  // A Phantom's soul trinket (Tokens of the Departed): advantage on death saves.
  var t = soulTrinkets(c);
  if(t && t.held) value = Math.max(value, Math.floor(Math.random()*20) + 1);
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
