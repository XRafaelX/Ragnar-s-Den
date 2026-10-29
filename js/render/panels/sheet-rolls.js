import { save } from "../../core/state.js";
import { useSteadyAim, hasFocusedAim, kiLeft, spendKi, hasMagicalGuidance, resourceLeft, spendResource } from "../../core/helpers.js";
import { useNextCheck } from "../../core/magic-items.js";
import { renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";

/* ---------------- Attack rolls and ability checks ----------------
   Every attack roll on the sheet (weapons, unarmed strikes, spell
   attacks, the astral arms) and every ability or skill check goes
   through here, for what happens around the roll: Steady Aim's and
   Duality's advantage are used up by it, and the dice tray offers what
   can still change it (Focused Aim's ki after a miss, Magical
   Guidance's reroll after a failed check). */
export function rollAttack(c, bonus, mode, label){
  performRoll(20, 1, bonus, mode, label, hasFocusedAim(c) ? function(){ return focusedAim(c); } : null);
  if(useSteadyAim(c)){ save(); renderAll(); }
}
export function rollCheck(c, bonus, mode, label){
  performRoll(20, 1, bonus, mode, label, hasMagicalGuidance(c) ? function(){ return magicalGuidance(c); } : null);
  if(useNextCheck(c)){ save(); renderAll(); }
}

/* Focused Aim's choices: +2, +4 or +6 for 1, 2 or 3 ki. */
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
