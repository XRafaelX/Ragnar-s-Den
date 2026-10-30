import { save } from "../../core/state.js";
import { clamp, maxHp, mod, darkOnesBlessing, DAMAGE_TYPES, spendResource, spendForRests } from "../../core/helpers.js";
import { abilityScore } from "../../core/ability-scores.js";
import { renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { performRoll, logRoll } from "../../dice/dice.js";

/* ---------------- Warlock ----------------
   What the patrons add to Class resources: Dark One's Blessing, Fiendish
   Resilience's type, Healing Light's dice, Eldritch Master, Grasping
   Tentacles, Limited Wish and Tomb of Levistus. */
function buttonRow(){
  var row = document.createElement("div");
  row.className = "inv-roll-actions fx-rolls";
  return row;
}
function rowBtn(text, title, onClick, icon){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn res-roll-btn";
  if(icon) b.innerHTML = icon;
  b.appendChild(document.createTextNode(text));
  if(title) b.title = title;
  b.addEventListener("click", onClick);
  return b;
}
function tempButton(c, label, n, title, onUse){
  var row = buttonRow();
  var b = rowBtn(label, title, function(){
    if(onUse && !onUse()) return;
    if(n > (Number(c.hp.temp)||0)) c.hp.temp = n;
    logRoll(label, "Temporary hit points: " + c.hp.temp + ".");
    save(); renderSidebar(); renderAll();
  });
  row.appendChild(b);
  return row;
}
export function warlockResourceRow(c, r){
  if(r.key==="Warlock:dark_ones_blessing"){
    var gain = darkOnesBlessing(c);
    return tempButton(c, "Temp HP " + gain, gain, "When you reduce a hostile creature to 0 hit points");
  }
  if(r.key==="Warlock:fiendish_resilience") return fiendishPicker(c);
  if(r.key==="Warlock:healing_light") return healingLightPicker(c, r);
  if(r.key==="Warlock:eldritch_master") return eldritchMasterRow(c, r);
  if(r.key==="Warlock:grasping_tentacles"){
    var lv = (c.classes||[]).reduce(function(n, cl){ return cl.name==="Warlock" ? Number(cl.level)||1 : n; }, 0);
    return tempButton(c, "Cast it free · +" + lv + " temp HP", lv, "Evard's Black Tentacles without a spell slot", function(){ return spendResource(c, r.key, 1); });
  }
  if(r.key==="Warlock:limited_wish") return wishRow(c, r);
  if(/Tomb of Levistus/.test(r.name)){
    var tomb = 10 * (c.classes||[]).reduce(function(n, cl){ return cl.name==="Warlock" ? Number(cl.level)||1 : n; }, 0);
    return tempButton(c, "Temp HP " + tomb, tomb, "Reaction when you take damage. You're incapacitated and your speed is 0 until the ice melts at the end of your next turn.", function(){ return spendResource(c, r.key, 1); });
  }
  return null;
}
function fiendishPicker(c){
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "fiendish", groups: {"": DAMAGE_TYPES}, value: c.fiendishResist || "", placeholder: "Choose a damage type...", ariaLabel: "Fiendish Resilience: damage type",
    onPick: function(v){
      c.fiendishResist = v;
      logRoll("Fiendish Resilience", "Resistance to " + v.toLowerCase() + " damage.");
      save(); renderAll();
    }}));
  return wrap;
}
/* Up to your CHA modifier in dice at once. */
function healingLightPicker(c, r){
  var left = r.max - r.used, most = Math.min(Math.max(1, mod(abilityScore(c, "cha"))), left);
  if(most <= 0) return null;
  var items = [];
  for(var n = 1; n <= most; n++) items.push({value: String(n), label: n + (n===1 ? " die: " : " dice: ") + n + "d6"});
  var wrap = document.createElement("div");
  wrap.className = "res-pick";
  wrap.appendChild(themedPicker({key: "healing-light", groups: {"": items}, value: "", placeholder: "Spend dice...", ariaLabel: "Healing Light: dice to spend",
    onPick: function(v){
      var dice = Number(v);
      if(!spendResource(c, r.key, dice)) return;
      save(); renderAll();
      performRoll(6, dice, 0, "none", "Healing Light", function(x){
        if(!x) return null;
        return {lead: "For the creature you chose, or:", options: [{label: "Heal yourself " + x.total, title: "You regain these hit points",
          use: function(){
            c.hp.current = clamp((Number(c.hp.current)||0) + x.total, 0, maxHp(c));
            save(); renderSidebar(); renderAll();
            return {silent: true};
          }}]};
      });
    }}));
  return wrap;
}
function eldritchMasterRow(c, r){
  var row = buttonRow(), pact = c.spellcasting && c.spellcasting.pact;
  var b = rowBtn("Regain pact slots", "1 minute entreating your patron", function(){
    if(!spendResource(c, r.key, 1)) return;
    c.spellcasting.pact.used = 0;
    logRoll("Eldritch Master", "All your pact slots are back.");
    save(); renderAll();
  });
  b.disabled = r.used >= r.max || !(pact && pact.used);
  row.appendChild(b);
  return row;
}
/* Comes back by itself after 1d4 long rests. */
function wishRow(c, r){
  var row = buttonRow(), wait = (c.restWait||{})[r.key];
  var b = rowBtn(wait ? "Back in " + wait + (wait===1 ? " long rest" : " long rests") : "Make a wish", "The effect of a spell of 6th level or lower with a casting time of 1 action", function(){
    var n = spendForRests(c, r.key);
    if(!n) return;
    logRoll("Limited Wish", "It comes back after " + n + (n===1 ? " long rest." : " long rests."));
    showActionToast("Limited Wish comes back after " + n + (n===1 ? " long rest." : " long rests."));
    save(); renderAll();
  });
  b.disabled = r.used >= r.max;
  row.appendChild(b);
  return row;
}
