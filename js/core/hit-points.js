/* ---------------- Hit points: damage and healing ----------------
   What taking damage, healing and spending a hit die do to a character,
   step by step in the rules' order. The HP card on the Vitals tab calls
   these, then saves and draws; nothing here touches the page. */
import { clamp, mod } from "./basics.js";
import { maxHp } from "./vitals.js";
import { wardAbsorb } from "./wizard.js";
import { wildShapeDamage } from "./druid.js";
import { rageAtZero, endAllEffects } from "./effects.js";
import { addCondition } from "./conditions.js";
import { spendHitDie, hitDieHealing } from "./character-resources.js";
import { abilityScore } from "./ability-scores.js";

/* Take n damage. What happened, for the HP card:
   {reached: "ward" (the Arcane Ward soaked all of it), "form" (a Wild
     Shape form took it and holds) or "you",
    turnedBack: a Wild Shape form dropped to 0 and ended,
    carried: the damage that then went on to you,
    wentDown: you dropped to 0 hit points}. */
export function takeDamage(c, n){
  var out = {reached: "you", turnedBack: false, carried: 0, wentDown: false};
  if(n <= 0) return out;
  // Arcane Ward: it takes the damage first.
  n = wardAbsorb(c, n);
  if(n <= 0){ out.reached = "ward"; return out; }
  var temp = Number(c.hp.temp) || 0;
  if(temp > 0){
    var absorbed = Math.min(temp, n);
    c.hp.temp = temp - absorbed;
    n -= absorbed;
  }
  // Wild Shape: the form takes it. At 0 hit points you turn back, and
  // what's left carries over.
  if(c.wildShape && !c.wildShape.own){
    n = wildShapeDamage(c, n);
    if(n < 0){ out.reached = "form"; return out; }
    out.turnedBack = true;
    out.carried = n || 0; // (-0 when the form took exactly all of it)
  }
  var wasUp = (Number(c.hp.current)||0) > 0;
  c.hp.current = Math.max(0, (Number(c.hp.current)||0) - n);
  out.wentDown = wasUp && c.hp.current === 0;
  // Dropping to 0 HP: unconscious (worked out from the HP) and prone.
  // (Relentless Rage's save waiting, or Rage Beyond Death: the rage holds.)
  if(out.wentDown){
    c.deathSaves = {success:0, fail:0};
    delete c.extraTurn; // a new fall: Strength Before Death can be used again (if a use is left)
    if(!rageAtZero(c)){ endAllEffects(c, true); addCondition(c, "prone"); }
  }
  return out;
}

/* Heal n hit points, never past the maximum. */
export function healHp(c, n){
  if(n <= 0) return;
  c.hp.current = clamp((Number(c.hp.current)||0) + n, 0, maxHp(c));
}

/* Spend a hit die of that size and heal what it rolls. `roll` is for
   tests (sides -> 1..sides). null when none of that size is left, or
   {die, roll, conMod, healed, durable: Durable raised it to its minimum}. */
export function spendHitDieToHeal(c, size, roll){
  var die = spendHitDie(c, size);
  if(!die) return null;
  var conMod = mod(abilityScore(c, "con"));
  var rolled = roll ? roll(die) : Math.floor(Math.random()*die)+1;
  var healed = hitDieHealing(c, rolled);
  c.hp.current = clamp(c.hp.current+healed, 0, maxHp(c));
  return {die: die, roll: rolled, conMod: conMod, healed: healed, durable: healed > Math.max(1, rolled+conMod)};
}
