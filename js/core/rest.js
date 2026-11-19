/* ---------------- Short and long rests ----------------
   What a rest does to a character, every step in order (the order
   matters: see the long rest's comments). The Hit dice & rest card on
   the Vitals tab calls these, logs the note and draws; nothing here
   touches the page. */
import { classLevelOf } from "./class-features.js";
import { characterResources, restoreResources, recoverHitDice } from "./character-resources.js";
import { maxHp } from "./vitals.js";
import { endAllEffects } from "./effects.js";
import { longRestExhaustion, removeCondition, conditionDef } from "./conditions.js";
import { rageOnShortRest } from "./barbarian-2024.js";
import { talesOnRest } from "./bard.js";
import { forgeOnLongRest, interventionOnLongRest } from "./cleric.js";
import { endWildShape, omenOnLongRest } from "./druid.js";
import { tirelessRest } from "./ranger.js";
import { sorcerousRestoration, fontOnLongRest, lunarOnLongRest } from "./sorcerer.js";
import { resilienceOnRest, restWaitOnLongRest } from "./warlock.js";
import { surgesOnRest, rollPortent } from "./wizard.js";
import { infusionsOnLongRest, elixirsOnLongRest, tinkerItemsOnLongRest } from "./artificer.js";
import { plansOnLongRest } from "./replicate.js";
import { endTimedBoons, magicItemsOnLongRest } from "./magic-items.js";
import { resourcefulOnLongRest } from "./species-2024.js";
import { restoreCompanions } from "./companions.js";

/* War Magic's Power Surge resource, or undefined. */
function powerSurges(c){
  return characterResources(c).find(function(r){ return r.key==="Wizard:power_surges"; });
}

/* ---- Short rest ----
   Hit dice are spent on the card, one at a time, so they aren't here.
   What came of it, for the log (shortRestNote):
   {pactRestored, restored: resource names, ended: effects and boons,
    resilience: Celestial Resilience's {self, others} or null,
    sorceryPoints: Sorcerous Restoration's, tireless: the new exhaustion
    level or null}. */
export function shortRest(c){
  var out = {pactRestored: false};
  if(c.spellcasting.pact && c.spellcasting.pact.used){ c.spellcasting.pact.used = 0; out.pactRestored = true; }
  out.restored = restoreResources(c, "short");
  if(rageOnShortRest(c)) out.restored.push("one use of Rage");
  talesOnRest(c);
  delete c.relentlessUses; // Relentless Rage's DC is back to 10
  out.ended = endAllEffects(c, "short").concat(endTimedBoons(c));
  var surges = powerSurges(c);
  if(surges) surgesOnRest(c, "short", surges.max);
  out.resilience = resilienceOnRest(c);
  out.sorceryPoints = sorcerousRestoration(c);
  out.tireless = tirelessRest(c);
  return out;
}
export function shortRestNote(r){
  return "Spend hit dice as needed to heal." +
    (r.pactRestored ? " Pact slots restored." : "") +
    (r.restored.length ? " Restored: " + r.restored.join(", ") + "." : "") +
    (r.resilience ? " Celestial Resilience: " + r.resilience.self + " temporary HP, " + r.resilience.others + " for up to five creatures." : "") +
    (r.sorceryPoints ? " Sorcerous Restoration: " + r.sorceryPoints + " sorcery points." : "") +
    (r.ended.length ? " Ended: " + r.ended.join(", ") + "." : "") +
    (r.tireless!==null ? " Tireless: exhaustion down to level " + r.tireless + "." : "");
}

/* ---- Long rest ----
   opts.endConditions: the ids of the conditions the player chose to end
   with it (the confirm dialog's "End these too": the ones it showed,
   when ticked). What came of it, for the log (longRestNote) and the
   card: {healed: hit points the rest gave, recovered: hit dice,
   exhaustion: the new level or null, conditionsEnded: names,
   items: {recharged, ended}, omen, inspired, foretold: Portent's dice or
   a falsy value, elixirs, tinkered}. */
export function longRest(c, opts){
  var endConditions = (opts && opts.endConditions) || [];
  var out = {};
  endWildShape(c); // Sleep ends a form: it ends if you fall unconscious.
  var hpBefore = Number(c.hp.current) || 0;
  // A rage still going ended long before the rest (Frenzy's
  // exhaustion is taken first, then the rest's level comes off).
  endAllEffects(c); // also ends Rage
  delete c.relentlessUses;
  delete c.extraTurn;
  // Death's Friend (Phantom 17): a soul trinket appears if you have none.
  if(classLevelOf(c, "Rogue", "Phantom") >= 17 && !(Number(c.soulTrinkets)||0)) c.soulTrinkets = 1;
  // One level of exhaustion goes first, so a maximum halved by
  // level 4 is whole again when the hit points come back.
  out.exhaustion = longRestExhaustion(c);
  endConditions.forEach(function(id){ removeCondition(c, id); });
  out.conditionsEnded = endConditions.map(function(id){ var d = conditionDef(id); return d ? d.name : id; });
  c.hp.current = maxHp(c);
  out.healed = c.hp.current - hpBefore;
  c.hp.temp = 0;
  c.deathSaves = {success:0, fail:0};
  out.recovered = recoverHitDice(c);
  Object.keys(c.spellcasting.slots).forEach(function(lvl){
    c.spellcasting.slots[lvl].used = 0;
  });
  if(c.spellcasting.pact) c.spellcasting.pact.used = 0;
  c.rage.used = 0;
  delete c.rage.persistentUsed;
  // Magic items: charges back at dawn, the day's boons over.
  out.items = magicItemsOnLongRest(c);
  out.items.recharged = out.items.recharged.concat(infusionsOnLongRest(c));
  restoreResources(c, "long");
  forgeOnLongRest(c);
  interventionOnLongRest(c);
  out.omen = omenOnLongRest(c);
  out.inspired = resourcefulOnLongRest(c);
  var surges = powerSurges(c);
  if(surges) surgesOnRest(c, "long", surges.max);
  delete c.overchannels;
  delete c.arcaneWard;
  delete c.stoneGone;
  out.foretold = rollPortent(c);
  resilienceOnRest(c);
  restWaitOnLongRest(c);
  fontOnLongRest(c);
  lunarOnLongRest(c);
  talesOnRest(c);
  delete c.sessionSpell; // Spirit Session's spell goes as a long rest starts.
  restoreCompanions(c);
  out.elixirs = elixirsOnLongRest(c);
  out.tinkered = tinkerItemsOnLongRest(c);
  plansOnLongRest(c); // Drain's slots go, Drain and Transmute are back
  return out;
}
export function longRestNote(r){
  return "HP and spell slots restored. " + r.recovered + " hit dice recovered." +
    (r.elixirs.length ? " New elixirs: " + r.elixirs.join(", ") + "." : "") +
    (r.tinkered.length ? " Tinker's Magic items vanished: " + r.tinkered.join(", ") + "." : "") +
    (r.items.recharged.length ? " Recharged: " + r.items.recharged.join(", ") + "." : "") +
    (r.items.ended.length ? " Ended: " + r.items.ended.join(", ") + "." : "") +
    (r.omen ? " Cosmic Omen: " + r.omen + "." : "") +
    (r.inspired ? " Resourceful: you have Heroic Inspiration." : "") +
    (r.foretold ? " Portent: " + r.foretold.join(", ") + "." : "") +
    (r.exhaustion!==null ? " Exhaustion down to level " + r.exhaustion + " (with food and drink)." : "") +
    (r.conditionsEnded.length ? " Conditions ended: " + r.conditionsEnded.join(", ") + "." : "");
}
