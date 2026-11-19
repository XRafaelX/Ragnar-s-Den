/* ---------------- Fighter on the Vitals tab ----------------
   What the fighter's resource rows offer under their names: Second Wind's
   healing (and Rallying Cry), Reclaim Potential's temporary hit points and
   Survivor's healing. */
import { save } from "../../core/state.js";
import { secondWind, survivorHeal, mod, fmtMod, clamp, maxHp } from "../../core/helpers.js";
import { abilityScore } from "../../core/ability-scores.js";
import { renderAll } from "../sheet.js";
import { makeDiceSvg } from "../../ui/svg-icons.js";
import { logRoll } from "../../dice/dice.js";

export function fighterResourceRow(c, r, ctx){
  if(r.key==="Fighter:second_wind"){ var sw = secondWind(c); return sw ? secondWindRow(c, r, ctx.remaining, sw) : null; }
  if(r.key==="Fighter:reclaim_potential") return reclaimPotentialRow(c, r, ctx.remaining);
  if(r.key==="Fighter:survivor"){ var surv = survivorHeal(c); return surv ? survivorRow(c, surv) : null; }
  return null;
}

/* Second Wind (fighter 1): a use for 1d10 + fighter level, and
   Rallying Cry's healing for allies (Banneret 3). */
function secondWindRow(c, r, remaining, sw){
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
  return swRow;
}
/* Reclaim Potential (Echo Knight 15): 2d6 + CON temporary HP when the
   echo is destroyed by damage, if you have none. */
function reclaimPotentialRow(c, r, remaining){
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
  return rpRow;
}
/* Survivor (Champion 18): regain 5 + CON at the start of a turn, at half HP or less. */
function survivorRow(c, surv){
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
  return svRow;
}
