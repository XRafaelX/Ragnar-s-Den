import { save } from "../../core/state.js";
import { loadedRound, heavyRoundBonus, spendRound, gunslingerHitDice, roundRigged, calibratedSights, pinpointDc, hasIntuition, INTUITION_SKILLS, enchantmentOf, spellcastingAbilities, skillCheck, useSteadyAim, insightfulAttack, hasFocusedAim, kiLeft, spendKi, hasMagicalGuidance, resourceLeft, spendResource, criticalDamage, indomitableMight, fanaticalFocusReady, firearmStats, viciousIntent, hemorrhagingCritical, regainGrit, classLevelOf, magicArrows, reliableTalent, effectOn, endEffect, soulknifeDie, sneakAttack, attackEndsEffects, isMonkWeaponFor, guidedStrikePool, spendChannel, smiteSlots, hasImprovedSmite, livingLegendOn, mod, fmtMod, foeSlayer, hasStalkersFlurry, hasSupernaturalDefense, rangerHitDice, clericHitDice, druidHitDice, starryDragon, bardHitDice, bardicDie, spendBardic, bladeFlourish, hasPeerlessSkill, silverTongue, tranceOn, useTides, favoredByTheGods } from "../../core/helpers.js";
import { openFlourishSheet } from "./bard.js";
import { abilityScore } from "../../core/ability-scores.js";
import { openSmiteSheet } from "./paladin.js";
import { useNextCheck } from "../../core/magic-items.js";
import { renderAll } from "../sheet.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { showActionToast } from "../../ui/toast.js";

/* ---------------- Attack rolls, ability checks and saves ----------------
   Every attack roll on the sheet (weapons, unarmed strikes, spell
   attacks, the astral arms), ability or skill check and saving throw
   goes through here, for what happens around the roll: Steady Aim's and
   Duality's advantage are used up by it, a total can change (Indomitable
   Might), and the dice tray offers what can still be done with it
   (critical damage after a natural 20, Focused Aim's ki after a miss,
   Magical Guidance's reroll after a failed check, Fanatical Focus's
   after a failed save). */

/* hit (optional) = {qty, die, bonus, melee, label, critMin, item}: the
   attack's damage for its critical hit (on critMin or more, 20 if not
   given), and the weapon (a firearm counts its shots and can misfire). */
export function rollAttack(c, bonus, mode, label, hit){
  var aim = hasFocusedAim(c) || !!(hit && hit.item && magicArrows(c, hit.item)), gun = hit && hit.item && firearmStats(hit.item, c);
  if(hit) hit.rollMode = mode; // (Intuition needs no disadvantage.)
  if(gun && gun.reload) hit.item.shots = (Number(hit.item.shots)||0) + 1;
  // Predicted Critical (Marksman 14): this firearm attack is the one.
  if(gun && effectOn(c, "predicted_critical")){
    hit.predicted = true;
    endEffect(c, "predicted_critical");
  }
  // A Gunslinger class gun fires its loaded round (noted first: the last
  // one unloads the gun).
  var round = gun && gun.set==="gunslinger" && loadedRound(c, hit.item);
  if(round){
    hit.heavyRound = !!heavyRoundBonus(c, hit.item);
    hit.noDamage = round.noDamage;
    spendRound(c, hit.item);
  }
  // Playing Dirty (Outlaw 14): the rigged round flashes instead.
  if(gun && roundRigged(c, hit.item)){
    hit.noDamage = true;
    hit.rigged = true;
    delete hit.item.rigged;
  }
  // Master of the Barrel (gunslinger 20): a firearm's d20 of 9 or lower counts as a 10.
  var barrel = gun && classLevelOf(c, "Gunslinger") >= 20, trance = tranceOn(c);
  performRoll(20, 1, bonus, mode, label, {
    followUp: function(r){ return attackFollowUp(c, r, aim, hit); },
    adjust: barrel || trance ? function(r){ return r.natural!=null && r.natural < 10 ? {total: r.total + 10 - r.natural, note: barrel ? "Master of the Barrel" : "Trance of Order"} : null; } : null,
    onResult: gun ? function(r){ firearmResult(c, hit.item, gun, r); } : null
  });
  var ended = attackEndsEffects(c, !!(hit && hit.melee)), tides = useTides(c);
  if(useSteadyAim(c) || gun || ended || tides){ save(); renderAll(); }
}
/* A firearm's roll (the Gunslinger's rules): at or under its misfire
   score it misfires, and the gun is jammed until repaired. Vicious Intent
   (gunslinger 18): a grit point back on a 19 or 20. */
function firearmResult(c, item, gun, r){
  if(r.natural!=null && r.natural <= gun.misfire){
    item.misfired = true;
    save(); renderAll();
    return;
  }
  if(r.natural >= 19 && viciousIntent(c) && regainGrit(c)){
    logRoll("Vicious Intent", "Regained a grit point.");
    save(); renderAll();
  }
}
/* ability: the check's ability ("str" for a Strength check or Athletics). */
/* opts = {proficient, skill}: whether the check adds the proficiency bonus
   (Reliable Talent, Psi-Bolstered Knack) and which skill it is (Ear for
   Deceit on Insight, Elegant Maneuver on Acrobatics and Athletics). */
export function rollCheck(c, bonus, mode, label, ability, opts){
  opts = opts || {};
  var might = ability==="str" ? indomitableMight(c) : 0;
  var reliable = opts.proficient && reliableTalent(c);
  var trance = tranceOn(c);
  var dragon = ((ability==="int" || ability==="wis") && starryDragon(c)) || silverTongue(c, opts.skill) || trance;
  opts.mode = mode; // (Intuition needs no disadvantage.)
  performRoll(20, 1, bonus, mode, label, {
    followUp: function(r){ return checkFollowUp(c, r, opts); },
    adjust: might || reliable || dragon ? function(r){
      var total = r.total, notes = [];
      // Reliable Talent: a d20 of 9 or lower counts as a 10.
      if((reliable || dragon) && r.natural!=null && r.natural < 10){ total += 10 - r.natural; notes.push(reliable ? "Reliable Talent" : trance ? "Trance of Order" : silverTongue(c, opts.skill) ? "Silver Tongue" : "Starry Form: Dragon"); }
      if(might && total < might){ total = might; notes.push("Indomitable Might"); }
      return notes.length ? {total: total, note: notes.join(", ")} : null;
    } : null
  });
  var used = useTides(c);
  used = useNextCheck(c) || used;
  // Elegant Maneuver is used up by the Acrobatics or Athletics check.
  if((opts.skill==="Acrobatics" || opts.skill==="Athletics") && effectOn(c, "elegant_maneuver")){ endEffect(c, "elegant_maneuver"); used = true; }
  if(used){ save(); renderAll(); }
}
/* After a check: Magical Guidance's reroll, Stroke of Luck's 20,
   Psi-Bolstered Knack's die (a proficient check), Ear for Deceit's 8
   (Insight). (r is null for the toast's hint.) */
function checkFollowUp(c, r, opts){
  var out = [], lead = "Failed?";
  // Intuition (Marshal 18): a d20 of 9 or lower as a 10, once per turn.
  if(r && r.natural!=null && r.natural < 10 && hasIntuition(c) && INTUITION_SKILLS.indexOf(opts.skill)!==-1 && opts.mode!=="dis" && !(opts.proficient && reliableTalent(c))){
    var low = r.natural;
    out.push({label: "Count it as a 10 (Intuition)", title: "Once per turn, without disadvantage: a d20 of 9 or lower counts as a 10",
      use: function(){ return {bonus: 10 - low, log: "Intuition (the d20 counts as 10)"}; }});
  }
  if(hasMagicalGuidance(c)) out = out.concat(magicalGuidance(c).options);
  // Peerless Skill (College of Lore 14): a Bardic Inspiration die on your own check.
  if(hasPeerlessSkill(c)){
    var peerless = bardicDie(c);
    out.push({label: "+1d" + peerless + " (Peerless Skill)", title: "Spend a Bardic Inspiration and add the die",
      use: function(){
        if(!spendBardic(c)) return null;
        var got = Math.floor(Math.random() * peerless) + 1;
        save(); renderAll();
        return {bonus: got, log: "Peerless Skill (rolled " + got + ")"};
      }});
  }
  // (Counted from the d20 as it stands: Reliable Talent may have made a 1 a 10.)
  var counted = r && r.natural!=null ? (opts.proficient && reliableTalent(c) ? Math.max(10, r.natural) : r.natural) : null;
  if(counted!=null && counted < 20 && resourceLeft(c, "Rogue:stroke_of_luck") > 0){
    var nat = counted;
    out.push({label: "Stroke of Luck: a 20", title: "Treat the d20 as a 20 (once per short or long rest)",
      use: function(){
        if(!spendResource(c, "Rogue:stroke_of_luck", 1)) return null;
        save(); renderAll();
        return {bonus: 20 - nat, log: "Stroke of Luck (the d20 counts as 20)"};
      }});
  }
  // Supernatural Defense (Monster Slayer 7): escaping your prey's grapple.
  if((opts.skill==="Athletics" || opts.skill==="Acrobatics") && hasSupernaturalDefense(c)) out.push({label: "+1d6 (Supernatural Defense)", title: "When you're escaping the grapple of your Slayer's Prey target",
    use: function(){ var got = Math.floor(Math.random() * 6) + 1; return {bonus: got, log: "Supernatural Defense (rolled " + got + ")"}; }});
  if(effectOn(c, "emboldening_bond")) out.push({label: "+1d4 (Emboldening Bond)", title: "Once per turn, while a bonded creature is within range",
    use: function(){ var got = Math.floor(Math.random() * 4) + 1; return {bonus: got, log: "Emboldening Bond (rolled " + got + ")"}; }});
  // Draconic Presence (Ascendant Dragon 3): only used up by a success.
  if((opts.skill==="Intimidation" || opts.skill==="Persuasion") && resourceLeft(c, "Monk:draconic_presence") > 0){
    out.push({label: "Draconic Presence: reroll", title: "Reaction: reroll this check. It's only used up if the reroll succeeds: tap it back on Vitals if it didn't.",
      use: function(){
        if(!spendResource(c, "Monk:draconic_presence", 1)) return null;
        save(); renderAll();
        return {reroll: true, log: "Draconic Presence"};
      }});
  }
  var knack = opts.proficient && soulknifeDie(c);
  if(knack && knack.left > 0){
    out.push({label: "+1d" + knack.die + " (Psi-Bolstered Knack)", title: "Roll a Psionic Energy die and add it. Only spend the die if this turns the failure into a success: tap it back on Vitals if it didn't.",
      use: function(){
        var got = Math.floor(Math.random() * knack.die) + 1;
        c.resourcesUsed[knack.key] = knack.used + 1;
        save(); renderAll();
        return {bonus: got, log: "Psi-Bolstered Knack (rolled " + got + ")"};
      }});
  }
  if(opts.skill==="Insight" && r && r.natural!=null && r.natural <= 7 && classLevelOf(c, "Rogue", "Inquisitive") >= 3){
    var n8 = r.natural;
    out.push({label: "Lie check: count it as 8", title: "Ear for Deceit: when you're checking whether a creature is lying, a d20 of 7 or lower counts as 8",
      use: function(){ return {bonus: 8 - n8, log: "Ear for Deceit (the d20 counts as 8)"}; }});
    lead = "";
  }
  if(!out.length) return null;
  // Only Magical Guidance's reroll: named in the lead, as before.
  var onlyGuidance = out.length===1 && /sorcery point/.test(out[0].label);
  return {lead: onlyGuidance ? "Failed? Magical Guidance:" : lead, hint: onlyGuidance ? "Failed? Tap to reroll with Magical Guidance." : "Tap for more options.", options: out};
}
/* ability: the save's ability (Bulwark only helps with INT, WIS and CHA). */
export function rollSave(c, bonus, mode, label, ability){
  var fanatic = fanaticalFocusReady(c), indom = resourceLeft(c, "Fighter:indomitable") > 0, diamond = hasDiamondSoul(c), will = resourceLeft(c, "Gunslinger:willpower") > 0;
  var oath = livingLegendOn(c) || hasSupernaturalDefense(c) || effectOn(c, "emboldening_bond") || (ability!=="str" && ability!=="dex" && ability!=="con" && classLevelOf(c, "Paladin", "Oath of the Watchers") >= 15);
  var dragon = ability==="con" && starryDragon(c), favored = favoredByTheGods(c), trance = tranceOn(c);
  performRoll(20, 1, bonus, mode, label, {
    followUp: fanatic || indom || diamond || oath || will || dragon || favored ? function(r){ return saveFollowUp(c, ability, r); } : null,
    adjust: trance ? function(r){ return r.natural!=null && r.natural < 10 ? {total: r.total + 10 - r.natural, note: "Trance of Order"} : null; } : null
  });
  if(useTides(c)){ save(); renderAll(); }
}
/* After a save: Fanatical Focus (once per rage) and Indomitable (a use;
   a Banneret's Bulwark lets an ally who failed the same INT, WIS or CHA
   save reroll too). Willpower (gunslinger 13): the Wisdom score in
   place of the d20, once per long rest. r: the roll (null for the hint). */
function saveFollowUp(c, ability, r){
  var opts = [];
  if(resourceLeft(c, "Gunslinger:willpower") > 0){
    var wis = abilityScore(c, "wis");
    opts.push({label: "Use Wisdom " + wis + " (Willpower)", title: "Replace the d20 with your Wisdom score (" + wis + "). Once per long rest.",
      use: function(){
        if(!r || r.natural==null || !spendResource(c, "Gunslinger:willpower", 1)) return null;
        save(); renderAll();
        return {bonus: wis - r.natural, log: "Willpower (the d20's " + r.natural + " becomes " + wis + ")"};
      }});
  }
  if(fanaticalFocusReady(c)) opts = opts.concat(fanaticalFocus(c).options);
  var left = resourceLeft(c, "Fighter:indomitable");
  if(left > 0){
    var bulwark = ["int", "wis", "cha"].indexOf(ability)!==-1 && classLevelOf(c, "Fighter", "Banneret (Purple Dragon Knight)") >= 15;
    opts.push({label: "Reroll (Indomitable, " + left + " left)",
      title: "Reroll this saving throw. You must use the new roll." + (bulwark ? " Bulwark: one ally within 60 feet who failed the same save can reroll too." : ""),
      use: function(){
        if(!spendResource(c, "Fighter:indomitable", 1)) return null;
        save(); renderAll();
        return {reroll: true, log: "Indomitable" + (bulwark ? " (Bulwark: an ally can reroll too)" : "")};
      }});
  }
  if(hasDiamondSoul(c)){
    opts.push({label: "Reroll (Diamond Soul, 1 ki)", title: "Spend 1 ki to reroll this saving throw. You must use the new roll.",
      use: function(){
        if(!spendKi(c, 1)) return null;
        save(); renderAll();
        return {reroll: true, log: "Diamond Soul (1 ki)"};
      }});
  }
  if(livingLegendOn(c)){
    opts.push({label: "Reroll (Living Legend)", title: "Your reaction: reroll this saving throw. You must use the new roll.",
      use: function(){ return {reroll: true, log: "Living Legend"}; }});
  }
  if(effectOn(c, "emboldening_bond")) opts.push({label: "+1d4 (Emboldening Bond)", title: "Once per turn, while a bonded creature is within range",
    use: function(){ var got = Math.floor(Math.random() * 4) + 1; return {bonus: got, log: "Emboldening Bond (rolled " + got + ")"}; }});
  // Supernatural Defense (Monster Slayer 7): your prey forced this save.
  if(hasSupernaturalDefense(c)) opts.push({label: "+1d6 (Supernatural Defense)", title: "When the target of your Slayer's Prey forces this save",
    use: function(){ var got = Math.floor(Math.random() * 6) + 1; return {bonus: got, log: "Supernatural Defense (rolled " + got + ")"}; }});
  var failed = opts.length;
  // Vigilant Rebuke (Oath of the Watchers 15): a reaction after a success.
  if(ability!=="str" && ability!=="dex" && ability!=="con" && classLevelOf(c, "Paladin", "Oath of the Watchers") >= 15){
    var rebuke = mod(abilityScore(c, "cha"));
    opts.push({label: "Saved? Vigilant Rebuke 2d8" + fmtMod(rebuke), title: "Your reaction: force damage to the creature that forced the save",
      use: function(){ performRoll(8, 2, rebuke, "none", "Vigilant Rebuke (Force)"); return {silent: true}; }});
  }
  if(favoredByTheGods(c)){ opts.push(favoredOption(c)); failed = opts.length; }
  // The Dragon (Starry Form): a low d20 counts as a 10 to keep concentration.
  if(ability==="con" && starryDragon(c) && (!r || (r.natural!=null && r.natural < 10))){
    opts.unshift({label: "Concentration: count the d20 as 10", title: "Starry Form, Dragon: a roll of 9 or lower counts as a 10 on a Constitution save to keep concentration",
      use: function(){ return r ? {bonus: 10 - r.natural, log: "Starry Form: Dragon"} : null; }});
    failed = opts.length;
  }
  if(!opts.length) return null;
  return failed ? {lead: "Failed?", hint: "Failed? Tap for options.", options: opts} : {lead: "", hint: "Saved? Tap for Vigilant Rebuke.", options: opts};
}
/* Favored by the Gods (Divine Soul 1): 2d4 on a failed save or a miss. */
function favoredOption(c){
  return {label: "+2d4 (Favored by the Gods)", title: "Once per short or long rest",
    use: function(){
      if(!spendResource(c, "Sorcerer:favored_by_the_gods", 1)) return null;
      var got = Math.floor(Math.random() * 4) + Math.floor(Math.random() * 4) + 2;
      save(); renderAll();
      return {bonus: got, log: "Favored by the Gods (rolled " + got + ")"};
    }};
}
/* Diamond Soul (monk 14): a ki point left to reroll a failed save. */
function hasDiamondSoul(c){
  return classLevelOf(c, "Monk") >= 14 && kiLeft(c) >= 1;
}

/* After an attack roll: critical damage on a natural 20, else Focused
   Aim's +2, +4 or +6 for 1, 2 or 3 ki. (r is null for the toast's hint.) */
function attackFollowUp(c, r, aim, hit){
  var gun = hit && hit.item && firearmStats(hit.item, c);
  if(gun && r && r.natural <= gun.misfire) return {lead: "Misfire! The attack misses and the " + (hit.item.name || "firearm") + " jams. " + (gun.set==="gunslinger" ? "Clear it on its card." : "Repair it on its card."), options: []};
  if(hit && r && hit.rigged) return {lead: "Playing Dirty: the target makes a DC 14 Wisdom save or is blinded until the start of your next turn.", options: []};
  if(hit && r && r.natural >= (hit.critMin || 20)) return hit.noDamage ? {lead: "Critical hit! The round deals no damage.", options: []} : withPinpoint(c, hit, criticalHit(c, hit), criticalDamage(c, hit).qty);
  if(hit && r && hit.predicted && !hit.noDamage) return withPinpoint(c, hit, Object.assign(criticalHit(c, hit), {lead: "Predicted Critical: if it hits, it's a critical hit."}), criticalDamage(c, hit).qty);
  var opts = !hit || hit.noDamage ? [] : pinpointOptions(c, hit, hit.qty);
  // The Eldritch Gunman's enchanted firearm: Runic Bind on a hit, Veil of
  // Smoke on a miss.
  var ench = hit && !hit.noDamage && enchantmentOf(c, hit.item);
  if(ench && ench.id==="runic_bind"){
    var bindDc = spellcastingAbilities(c).filter(function(a){ return a.classes.indexOf("Gunslinger")!==-1; }).map(function(a){ return a.dc; })[0];
    opts.push(reminder("Hit? Runic Bind (STR DC " + bindDc + ")", "Your bonus action: on a failed save the target is restrained. It can use its action to repeat the save.", "Runic Bind", "Strength save, DC " + bindDc + ", or the target is restrained. It can use its action to repeat the save."));
  }
  if(ench && ench.id==="veil_of_smoke") opts.push(reminder("Missed? Veil of Smoke", "The bullet vanishes into a puff of smoke until the start of your next turn", "Veil of Smoke", "Unless the target moves away from the smoke, it has disadvantage on its attacks until the start of your next turn."));
  // Intuition (Marshal 18): a firearm's d20 of 9 or lower as a 10, once per
  // turn, without disadvantage. (Master of the Barrel already did it at 20.)
  if(hit && r && r.natural!=null && r.natural < 10 && gun && hasIntuition(c) && hit.rollMode!=="dis" && classLevelOf(c, "Gunslinger") < 20){
    var counted = r.natural;
    opts.push({label: "Count it as a 10 (Intuition)", title: "Once per turn, without disadvantage: a d20 of 9 or lower counts as a 10",
      use: function(){ return {bonus: 10 - counted, log: "Intuition (the d20 counts as 10)"}; }});
  }
  // Expert Sniper (Marksman 1): the Perception bonus, once per long rest.
  if(hit && resourceLeft(c, "Gunslinger:expert_sniper") > 0){
    var sniper = skillCheck(c, "Perception").value;
    opts.push({label: fmtMod(sniper) + " (Expert Sniper)", title: "Add your Perception bonus to this attack roll. Once per long rest.",
      use: function(){
        if(!spendResource(c, "Gunslinger:expert_sniper", 1)) return null;
        save(); renderAll();
        return {bonus: sniper, log: "Expert Sniper"};
      }});
  }
  if(favoredByTheGods(c)) opts.push(favoredOption(c));
  // Blade Flourish (College of Swords 3): on a hit with a weapon.
  if(hit && hit.item && bladeFlourish(c)) opts.push({label: "Hit? Blade Flourish", title: "One flourish a turn, on a hit", use: function(){ openFlourishSheet(c, hit.label); return {silent: true}; }});
  // A roll with no card of its own to roll damage from (a caught missile).
  if(hit && hit.offerDamage) opts.push({label: "Hit? Damage " + hit.qty + "d" + hit.die + (hit.bonus ? (hit.bonus > 0 ? "+" : "") + hit.bonus : ""), title: "Roll the damage",
    use: function(){ performRoll(hit.die, hit.qty, hit.bonus, "none", hit.label + ": Damage"); return {silent: true}; }});
  // Assassinate (Assassin 3): any hit against a surprised creature is a critical hit.
  if(hit && r && effectOn(c, "assassinate")){
    var surprised = criticalHit(c, hit).options.map(function(o){ return Object.assign({}, o, {label: "Surprised target? " + o.label}); });
    opts = opts.concat(surprised);
  }
  // After a miss: Focused Aim's ki (monk 5), Curving Shot's reroll with a
  // magic arrow (Arcane Archer 7), Homing Strikes' die with a psychic blade
  // (Soulknife 9), Master Duelist's reroll with advantage (Swashbuckler
  // 17), Stroke of Luck's hit (rogue 20).
  if(hasFocusedAim(c)) opts = opts.concat(focusedAim(c).options);
  // Guided Strike (Oath of Conquest 3): +10 after seeing the roll.
  var guided = guidedStrikePool(c);
  if(guided){
    opts.push({label: "+10 (Guided Strike)", title: "Spend your Channel Divinity to add 10 to this attack roll",
      use: function(){
        if(!spendChannel(c, guided)) return null;
        save(); renderAll();
        return {bonus: 10, log: "Guided Strike (Channel Divinity)"};
      }});
  }
  // Emboldening Bond (Peace Domain 1): a d4, once per turn.
  if(effectOn(c, "emboldening_bond")) opts.push({label: "+1d4 (Emboldening Bond)", title: "Once per turn, while a bonded creature is within range",
    use: function(){ var got = Math.floor(Math.random() * 4) + 1; return {bonus: got, log: "Emboldening Bond (rolled " + got + ")"}; }});
  // Insightful Striking (Fate Domain 6): a d6 on the next attack roll against the creature chosen.
  if(insightfulAttack(c)) opts.push({label: "+1d6 (Insightful Striking)", title: "On your next attack roll against the creature you chose",
    use: function(){
      var got = Math.floor(Math.random() * 6) + 1;
      endEffect(c, "insightful_striking");
      save(); renderAll();
      return {bonus: got, log: "Insightful Striking (rolled " + got + ")"};
    }});
  // Foe Slayer (ranger 20): +WIS against a favored enemy, once on each of your turns.
  var slayer = foeSlayer(c);
  if(slayer > 0 && hit){
    opts.push({label: "+" + slayer + " (Foe Slayer)", title: "Once on each of your turns, against one of your favored enemies",
      use: function(){ return {bonus: slayer, log: "Foe Slayer"}; }});
  }
  // Stalker's Flurry (Gloom Stalker 11): another attack after a miss, once on each of your turns.
  if(hit && hit.item && hasStalkersFlurry(c)){
    opts.push({label: "Stalker's Flurry: attack again", title: "Once on each of your turns: another weapon attack as part of the same action",
      use: function(){ return {reroll: true, log: "Stalker's Flurry"}; }});
  }
  // Living Legend (Oath of Glory 20): one miss on each of your turns hits.
  if(hit && livingLegendOn(c)){
    opts.push({label: "Living Legend: it hits", title: "Once on each of your turns, a weapon attack that missed hits instead",
      use: function(){ return {bonus: 0, log: "Living Legend: the miss is a hit"}; }});
  }
  if(hit && hit.item && magicArrows(c, hit.item)){
    opts.push({label: "Curving Shot", title: "A bonus action: reroll this attack against a different target within 60 feet of the first",
      use: function(){ return {reroll: true, log: "Curving Shot (a different target)"}; }});
  }
  var sk = hit && hit.psychicBlade && classLevelOf(c, "Rogue", "Soulknife") >= 9 && soulknifeDie(c);
  if(sk && sk.left > 0){
    opts.push({label: "+1d" + sk.die + " (Homing Strikes)", title: "Roll a Psionic Energy die and add it. Only spend the die if the attack now hits: tap it back on Vitals if it still misses.",
      use: function(){
        var got = Math.floor(Math.random() * sk.die) + 1;
        c.resourcesUsed[sk.key] = sk.used + 1;
        save(); renderAll();
        return {bonus: got, log: "Homing Strikes (rolled " + got + ")"};
      }});
  }
  // Unerring Accuracy (Kensei 17): reroll a miss with a monk weapon, once a turn.
  if(hit && hit.item && isMonkWeaponFor(c, hit.item) && classLevelOf(c, "Monk", "Way of the Kensei") >= 17){
    opts.push({label: "Unerring Accuracy: reroll", title: "Once on each of your turns: reroll this attack",
      use: function(){ return {reroll: true, log: "Unerring Accuracy"}; }});
  }
  if(resourceLeft(c, "Rogue:master_duelist") > 0){
    opts.push({label: "Master Duelist: reroll with advantage", title: "Once per short or long rest",
      use: function(){
        if(!spendResource(c, "Rogue:master_duelist", 1)) return null;
        save(); renderAll();
        return {reroll: true, adv: "adv", log: "Master Duelist (with advantage)"};
      }});
  }
  if(resourceLeft(c, "Rogue:stroke_of_luck") > 0){
    opts.push({label: "Stroke of Luck: it hits", title: "Turn the miss into a hit (once per short or long rest)",
      use: function(){
        if(!spendResource(c, "Rogue:stroke_of_luck", 1)) return null;
        save(); renderAll();
        return {bonus: 0, log: "Stroke of Luck: the miss is a hit"};
      }});
  }
  if(!opts.length) return null;
  // Only Focused Aim's three: named in the lead, as before.
  var onlyAim = opts.every(function(o){ return / ki\)$/.test(o.label); });
  // (Pinpoint Control's are for a hit: "Missed?" would read wrong over them.)
  if(opts.some(function(o){ return /^(Hit\? (Disarm|Hobble|Interrupt|Runic)|Missed\? Veil)/.test(o.label); })) return {lead: "", hint: "Tap for more options.", options: opts};
  return {lead: onlyAim ? "Missed? Focused Aim:" : "Missed?", hint: onlyAim ? "Missed? Tap for Focused Aim." : "Missed? Tap for more options.", options: opts};
}
/* A tray option that only tells the player what happens, logged. pay
   (optional) spends what it costs, false if it can't. */
function reminder(label, title, name, text, pay){
  return {label: label, title: title, use: function(){
    if(pay && !pay()) return null;
    logRoll(name, text);
    showActionToast(text);
    return {silent: true};
  }};
}
/* Pinpoint Control (Marshal 14): after a firearm attack, a use for one of
   its three effects. Disarm rolls the attack's damage halved, so it stands
   in for the damage roll. qty: the attack's dice (doubled on a critical). */
function pinpointOptions(c, hit, qty){
  if(!hit.item || !firearmStats(hit.item, c) || resourceLeft(c, "Gunslinger:pinpoint_control") <= 0) return [];
  var dc = pinpointDc(c);
  function spend(){
    if(!spendResource(c, "Gunslinger:pinpoint_control", 1)) return false;
    save(); renderAll();
    return true;
  }
  function effect(label, title, text){
    return reminder(label, title, "Pinpoint Control", text, spend);
  }
  return [
    {label: "Hit? Disarm (STR DC " + dc + ")", title: "Halved damage, and a Strength save or it drops an object of your choice at its feet",
      use: function(){
        if(!spend()) return null;
        var sights = calibratedSights(c, hit.item, hit.die);
        performRoll(hit.die, qty, hit.bonus, "none", hit.label + ": Disarm damage (halved)", {adjust: function(x){
          var got = sights && sights(x), total = got ? got.total : x.total;
          return {total: Math.max(1, Math.floor(total / 2)), note: "halved" + (got ? ", " + got.note : "")};
        }, followUp: function(x){
          return x ? {lead: "Disarm: Strength save, DC " + dc + ", or it drops an object of your choice at its feet.", options: []} : null;
        }});
        return {silent: true};
      }},
    effect("Hit? Hobble", "The target's speed drops by 10 feet until the start of your next turn", "Hobble: the target's speed drops by 10 feet until the start of your next turn."),
    effect("Hit? Interrupt", "If the target is concentrating, it makes the concentration save against this attack with disadvantage", "Interrupt: the target has disadvantage on its concentration save against this attack.")
  ];
}
function withPinpoint(c, hit, follow, qty){
  return Object.assign({}, follow, {options: follow.options.concat(pinpointOptions(c, hit, qty))});
}
function criticalHit(c, hit){
  var crit = criticalDamage(c, hit);
  var sa = hit.sneak && sneakAttack(c);
  var extra = sa ? [{label: "Sneak Attack " + 2 * sa.dice + "d6", title: "On a critical hit, Sneak Attack's dice are doubled too",
    use: function(){ performRoll(6, 2 * sa.dice, 0, "none", hit.label + ": Sneak Attack (critical)"); return {silent: true}; }}] : [];
  // A paladin's melee hit: the smites' dice are doubled too.
  if(hit.melee && hasImprovedSmite(c) && hit.item) extra.push({label: "Improved Divine Smite 2d8", title: "On a critical hit, its die is doubled too",
    use: function(){ performRoll(8, 2, 0, "none", hit.label + ": Improved Divine Smite (critical)"); return {silent: true}; }});
  // The dice a ranger's or cleric's hit adds are doubled too.
  rangerHitDice(c).concat(clericHitDice(c), gunslingerHitDice(c, hit.item), druidHitDice(c, hit.melee), bardHitDice(c)).filter(function(d){ return hit.item || d.unarmed; }).forEach(function(d){
    extra.push({label: d.name + " " + 2 * d.qty + "d" + d.die, title: "On a critical hit, these dice are doubled too",
      use: function(){
        if(d.pay && !spendResource(c, d.pay, 1)) return null;
        if(d.pay){ save(); renderAll(); }
        performRoll(d.die, 2 * d.qty, 0, "none", hit.label + ": " + d.label + " (critical)");
        return {silent: true};
      }});
  });
  if(hit.item && bladeFlourish(c)) extra.push({label: "Blade Flourish", title: "On a critical hit, its die is doubled too",
    use: function(){ openFlourishSheet(c, hit.label, true); return {silent: true}; }});
  if(hit.melee && smiteSlots(c).length) extra.push({label: "Divine Smite", title: "Spend a spell slot: the dice are doubled on a critical hit",
    use: function(){ openSmiteSheet(c, hit.label, true); return {silent: true}; }});
  return {lead: "Critical hit!", hint: "",
    options: extra.length ? [critOption(c, hit, crit)].concat(extra) : [critOption(c, hit, crit)]};
}
function critOption(c, hit, crit){
  return {label: "Roll " + crit.qty + "d" + crit.die + (crit.bonus ? (crit.bonus > 0 ? "+" : "") + crit.bonus : "") + " damage",
      title: "Critical hit: the damage dice twice" + (crit.brutal ? ", plus " + crit.brutal + " more from Brutal Critical" : "") + (crit.heavy ? ", plus one more for the heavy round" : "") + (crit.deadly ? ", plus one more from Deadly Critical" : "") + ", then your bonus once",
      use: function(){
        // Hemorrhaging Critical (gunslinger 18): half again at the end of the target's next turn.
        var bleed = hit.item && firearmStats(hit.item, c) && hemorrhagingCritical(c);
        performRoll(crit.die, crit.qty, crit.bonus, "none", hit.label + ": Critical damage", {followUp: bleed ? function(r){
          return r ? {lead: "Hemorrhaging Critical: " + Math.floor(r.total / 2) + " more damage to the target at the end of its next turn.", options: []} : null;
        } : null, adjust: hit.item ? calibratedSights(c, hit.item, crit.die) : null});
        return {bonus: 0, log: "Critical hit", silent: true};
      }};
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
