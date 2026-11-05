/* ---------------- The 2024 rogue on the sheet ----------------
   What the 2024 class and its subclasses do beyond the rules shared with
   the 2014 rogue (Player's Handbook 2024, pp. 128 to 136). The features'
   words are in js/data/rogue-2024.js. */
import { isRogue2024 } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { mod, profBonus } from "./basics.js";
import { effectOn } from "./effects.js";

function rogueEntry(c){ return (c.classes||[]).find(function(cl){ return cl.name==="Rogue"; }); }
function level2024(c, subclass){
  var cl = isRogue2024(c) && rogueEntry(c);
  return cl && (!subclass || cl.subclass===subclass) ? Number(cl.level)||1 : 0;
}
/* A Cunning Strike's and Death Strike's save DC. */
export function rogueStrikeDc(c){ return 8 + mod(abilityScore(c, "dex")) + profBonus(c); }

/* ---- Cunning Strike (5) ----
   {picks, dc, options: [{name, cost, line, short, blocked}]} or null. picks: how
   many effects one Sneak Attack can add. */
export function cunningStrike(c){
  var lv = level2024(c);
  if(lv < 5) return null;
  var dc = rogueStrikeDc(c);
  var kit = level2024(c, "Assassin (2024)") >= 3 || (c.inventory||[]).some(function(i){ return /poisoner/i.test(i.name||""); });
  var envenom = level2024(c, "Assassin (2024)") >= 13;
  var trickster = level2024(c, "Arcane Trickster (2024)") >= 13;
  var options = [
    {name: "Poison", cost: 1, short: "CON DC " + dc + " or poisoned for 1 minute", blocked: kit ? "" : "Needs a Poisoner's Kit in your inventory",
      envenom: envenom, line: "Poison: the target makes a DC " + dc + " Constitution save or is poisoned for 1 minute, repeating the save at the end of each of its turns." + (envenom ? " Each failed save also deals 2d6 poison damage, ignoring resistance to it." : "")},
    {name: "Trip", cost: 1, short: "DEX DC " + dc + " or prone (Large or smaller)",
      line: "Trip: a Large or smaller target makes a DC " + dc + " Dexterity save or falls prone." + (trickster ? " You can also use it on another creature within 5 feet of your spectral hand." : "")},
    {name: "Withdraw", cost: 1, short: "Move half your speed, no opportunity attacks",
      line: "Withdraw: right after the attack, move up to half your speed with no opportunity attacks."}
  ];
  if(level2024(c, "Thief (2024)") >= 9) options.push({name: "Stealth Attack", cost: 1, short: "Stay hidden if you end the turn behind good cover",
    line: "Stealth Attack: if you have the Hide action's Invisible condition, this attack doesn't end it if you end the turn behind three-quarters or total cover."});
  if(lv >= 14) options.push(
    {name: "Daze", cost: 2, short: "CON DC " + dc + " or only move or act next turn",
      line: "Daze: the target makes a DC " + dc + " Constitution save or, on its next turn, it can only move or take an action or a bonus action."},
    {name: "Obscure", cost: 3, short: "DEX DC " + dc + " or blinded",
      line: "Obscure: the target makes a DC " + dc + " Dexterity save or is blinded until the end of its next turn."},
    {name: "Knock Out", cost: 6, short: "CON DC " + dc + " or unconscious for 1 minute",
      line: "Knock Out: the target makes a DC " + dc + " Constitution save or is unconscious for 1 minute or until it takes damage, repeating the save at the end of each of its turns."}
  );
  return {picks: lv >= 11 ? 2 : 1, dc: dc, options: options};
}

/* ---- Assassin ---- */
/* Surprising Strikes: the extra damage on a first-round Sneak Attack, or 0. */
export function surprisingStrikes(c){
  return effectOn(c, "assassinate_2024") ? level2024(c, "Assassin (2024)") : 0;
}
/* Death Strike (17): its DC on a first-round Sneak Attack, or 0. */
export function deathStrikeDc(c){
  return effectOn(c, "assassinate_2024") && level2024(c, "Assassin (2024)") >= 17 ? rogueStrikeDc(c) : 0;
}
/* Roving Aim (9): Steady Aim leaves your speed alone. */
export function rovingAim(c){ return level2024(c, "Assassin (2024)") >= 9; }
/* Rend Mind's DC (2024 Soulknife 17), or 0. */
export function rendMindDc(c){ return level2024(c, "Soulknife (2024)") >= 17 ? rogueStrikeDc(c) : 0; }
