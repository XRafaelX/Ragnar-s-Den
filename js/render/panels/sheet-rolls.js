import { save } from "../../core/state.js";
import { useSteadyAim, hasFocusedAim, kiLeft, spendKi, hasMagicalGuidance, resourceLeft, spendResource, criticalDamage, indomitableMight, fanaticalFocusReady } from "../../core/helpers.js";
import { useNextCheck } from "../../core/magic-items.js";
import { renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";

/* ---------------- Attack rolls, ability checks and saves ----------------
   Every attack roll on the sheet (weapons, unarmed strikes, spell
   attacks, the astral arms), ability or skill check and saving throw
   goes through here, for what happens around the roll: Steady Aim's and
   Duality's advantage are used up by it, a total can change (Indomitable
   Might), and the dice tray offers what can still be done with it
   (critical damage after a natural 20, Focused Aim's ki after a miss,
   Magical Guidance's reroll after a failed check, Fanatical Focus's
   after a failed save). */

/* hit (optional) = {qty, die, bonus, melee, label}: the attack's damage,
   for its critical hit. */
export function rollAttack(c, bonus, mode, label, hit){
  var aim = hasFocusedAim(c);
  performRoll(20, 1, bonus, mode, label, aim || hit ? function(r){ return attackFollowUp(c, r, aim, hit); } : null);
  if(useSteadyAim(c)){ save(); renderAll(); }
}
/* ability: the check's ability ("str" for a Strength check or Athletics). */
export function rollCheck(c, bonus, mode, label, ability){
  var might = ability==="str" ? indomitableMight(c) : 0;
  performRoll(20, 1, bonus, mode, label, {
    followUp: hasMagicalGuidance(c) ? function(){ return magicalGuidance(c); } : null,
    adjust: might ? function(r){ return r.total < might ? {total: might, note: "Indomitable Might"} : null; } : null
  });
  if(useNextCheck(c)){ save(); renderAll(); }
}
export function rollSave(c, bonus, mode, label){
  performRoll(20, 1, bonus, mode, label, fanaticalFocusReady(c) ? function(){ return fanaticalFocus(c); } : null);
}

/* After an attack roll: critical damage on a natural 20, else Focused
   Aim's +2, +4 or +6 for 1, 2 or 3 ki. (r is null for the toast's hint.) */
function attackFollowUp(c, r, aim, hit){
  if(hit && r && r.natural===20) return criticalHit(c, hit);
  return aim ? focusedAim(c) : null;
}
function criticalHit(c, hit){
  var crit = criticalDamage(c, hit);
  return {lead: "Critical hit!", hint: "",
    options: [{label: "Roll " + crit.qty + "d" + crit.die + (crit.bonus ? (crit.bonus > 0 ? "+" : "") + crit.bonus : "") + " damage",
      title: "Critical hit: the damage dice twice" + (crit.brutal ? ", plus " + crit.brutal + " more from Brutal Critical" : "") + ", then your bonus once",
      use: function(){
        performRoll(crit.die, crit.qty, crit.bonus, "none", hit.label + ": Critical damage");
        return {bonus: 0, log: "Critical hit", silent: true};
      }}]};
}
function focusedAim(c){
  var left = kiLeft(c);
  return {lead: "Missed? Focused Aim:", hint: "Missed? Tap for Focused Aim.",
    options: [1, 2, 3].map(function(n){
      return {label: "+" + 2 * n + " (" + n + " ki)", disabled: left < n,
        title: left < n ? "Not enough ki left" : "Spend " + n + " ki to add " + 2 * n + " to this attack roll",
        use: function(){
          if(!spendKi(c, n)) return null;
          save(); renderAll();
          return {bonus: 2 * n, log: "Focused Aim (" + n + " ki)"};
        }};
    })};
}
/* Magical Guidance: reroll the d20 for 1 sorcery point (the new roll stands). */
function magicalGuidance(c){
  var left = resourceLeft(c, "Sorcerer:sorcery_points");
  return {lead: "Failed? Magical Guidance:", hint: "Failed? Tap to reroll with Magical Guidance.",
    options: [{label: "Reroll (1 sorcery point)", disabled: left < 1,
      title: left < 1 ? "No sorcery points left" : "Spend 1 sorcery point to reroll the d20. You must use the new roll.",
      use: function(){
        if(!spendResource(c, "Sorcerer:sorcery_points", 1)) return null;
        save(); renderAll();
        return {reroll: true, log: "Magical Guidance (1 sorcery point)"};
      }}]};
}
/* Fanatical Focus: reroll a failed save while raging, once per rage. */
function fanaticalFocus(c){
  return {lead: "Failed? Fanatical Focus:", hint: "Failed? Tap to reroll with Fanatical Focus.",
    options: [{label: "Reroll (once per rage)", title: "Reroll this saving throw. You must use the new roll.",
      use: function(){
        if(!fanaticalFocusReady(c)) return null;
        c.rage.fanatical = true;
        save(); renderAll();
        return {reroll: true, log: "Fanatical Focus"};
      }}]};
}
