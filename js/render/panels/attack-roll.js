import { save } from "../../core/state.js";
import { useSteadyAim, hasFocusedAim, kiLeft, spendKi } from "../../core/helpers.js";
import { renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";

/* ---------------- Attack rolls ----------------
   Every attack roll on the sheet (weapons, unarmed strikes, spell
   attacks, the astral arms) goes through here: Steady Aim's advantage is
   used up by it, and a monk with Focused Aim is offered ki after it in
   the dice tray. */
export function rollAttack(c, bonus, mode, label){
  performRoll(20, 1, bonus, mode, label, hasFocusedAim(c) ? function(){ return focusedAim(c); } : null);
  if(useSteadyAim(c)){ save(); renderAll(); }
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
