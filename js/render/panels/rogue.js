/* ---- The 2024 rogue's Cunning Strike sheet ----
   Sneak Attack dice are given up before rolling, so the effects are chosen
   first: tiles with their cost, up to the number allowed, then one button
   rolls what's left. Each effect is logged and shown once rolled. */
import { cunningStrike, sneakAttack } from "../../core/helpers.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { sheetTop, lead, sheetButton } from "./paladin.js";
import { logRoll } from "../../dice/dice.js";
import { showActionToast } from "../../ui/toast.js";
import { rollSneak } from "./sheet-rolls.js";

/* name: the weapon's. crit: a critical hit doubles the dice left. done: called
   once it's rolled (the tray's kept buttons). */
export function openCunningSheet(c, name, crit, done){
  var cs = cunningStrike(c), sa = sneakAttack(c);
  if(!cs || !sa) return;
  var chosen = [];
  function find(n){ return cs.options.find(function(o){ return o.name===n; }); }
  function spent(){ return chosen.reduce(function(a, n){ return a + find(n).cost; }, 0); }
  openBottomSheet(function(body, refresh, close){
    sheetTop(body, "Cunning Strike", close);
    var left = sa.dice - spent(), qty = (crit ? 2 : 1) * left;
    lead(body, "You have " + sa.dice + "d6 of Sneak Attack. Choose " + (cs.picks > 1 ? "up to two effects" : "an effect") + " to give up dice for.");
    var list = document.createElement("div");
    list.className = "pal-sheet-list";
    cs.options.forEach(function(o){
      var on = chosen.indexOf(o.name)!==-1;
      var why = on ? "" : o.blocked || (chosen.length >= cs.picks ? "You've chosen " + (cs.picks > 1 ? "two" : "one") : o.cost > left ? "Not enough dice left" : "");
      var b = sheetButton((on ? "✓ " : "") + o.name + " (costs " + o.cost + "d6)", function(){
        if(on) chosen.splice(chosen.indexOf(o.name), 1); else chosen.push(o.name);
        refresh();
      }, !!why, why);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      list.appendChild(b);
      var note = document.createElement("div");
      note.className = "res-hint";
      note.textContent = o.blocked || o.short;
      list.appendChild(note);
    });
    body.appendChild(list);
    var go = sheetButton(qty ? "Roll " + qty + "d6 Sneak Attack" : "Use the effects, no dice to roll", function(){
      var picked = chosen.map(find);
      close();
      if(done) done();
      if(qty) rollSneak(c, qty, name + ": Sneak Attack" + (picked.length ? " (" + picked.map(function(o){ return o.name; }).join(", ") + ")" : "") + (crit ? " (critical)" : ""), {envenom: picked.some(function(o){ return o.envenom; })});
      picked.forEach(function(o){ logRoll("Cunning Strike", o.line); });
      if(picked.length) showActionToast(picked.map(function(o){ return o.line; }).join(" "));
    });
    go.classList.add("primary");
    body.appendChild(go);
  });
}
