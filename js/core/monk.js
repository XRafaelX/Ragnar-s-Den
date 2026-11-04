/* ---------------- What ki can pay for ----------------
   The Ki row's "Spend ki on..." list on Vitals: every ki feature the monk
   has now, by class level and tradition (checked against the Player's
   Handbook, Xanathar's Guide, the Sword Coast Adventurer's Guide, Tasha's
   Cauldron and Fizban's Treasury on 5etools' data 2026-10-30).

   Each action: {id, name, group, cost (ki), detail, log, roll: {qty, die,
   bonus, label}, temp (temporary HP), useKey (a resource it spends instead
   of ki while one is left), payKey (a resource it spends as well), sharpen
   (Sharpen the Blade's bonus), reason (why it can't be used now)}. */
import { mod, profBonus, clamp } from "./basics.js";
import { classLevelOf, isMonk2024, classVariants } from "./class-features.js";
import { MONK_2024_SWAPS } from "../data/monk-2024.js";
import { abilityScore } from "./ability-scores.js";
import { martialArtsDie, resourceLeft, spendResource, effectOn } from "./effects.js";
import { maxHp } from "./vitals.js";
import { characterPickedProfs } from "./class-picks.js";
import { allKnownOptions } from "./class-options.js";
import { optionSetDef } from "../data/class-options.js";
import { magicBonusOf } from "./magic-items.js";
import { baseWeaponName } from "../data/weapons.js";

/* Switch the character's monk to the 2024 rules (on) or back to 2014.
   Open Hand, Shadow, Four Elements and Mercy become their other
   edition's version, Tasha's monk extras go (2024) or come back with the
   switch (syncTashaAdditions, done by the caller), and a level 20 monk
   gains or loses Body and Mind's +4 DEX and WIS. True if anything changed. */
export function setMonkEdition(c, on){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Monk"; });
  if(!cl || !!on===(cl.edition==="2024")) return false;
  var back = {};
  Object.keys(MONK_2024_SWAPS).forEach(function(k){ back[MONK_2024_SWAPS[k]] = k; });
  if(on){
    classVariants("Monk").forEach(function(v){ if(cl.variants) delete cl.variants[v.adds ? v.name : v.replaces]; });
    cl.edition = "2024";
    if(MONK_2024_SWAPS[cl.subclass]) cl.subclass = MONK_2024_SWAPS[cl.subclass];
    if((Number(cl.level)||1) >= 20){
      var gain = {};
      ["dex", "wis"].forEach(function(k){
        var was = Number(c.abilities[k])||10, now = Math.min(25, was + 4);
        if(now > was){ c.abilities[k] = now; gain[k] = now - was; }
      });
      cl.bodyAndMind = gain;
    }
  } else {
    delete cl.edition;
    if(back[cl.subclass]) cl.subclass = back[cl.subclass];
    Object.keys(cl.bodyAndMind || {}).forEach(function(k){ c.abilities[k] = (Number(c.abilities[k])||10) - cl.bodyAndMind[k]; });
    delete cl.bodyAndMind;
  }
  return true;
}
/* ---- Rolling initiative (2024 monk) ----
   Uncanny Metabolism (monk 2): all Focus back and a Martial Arts die +
   monk level of healing, once per long rest. Offered only when it would
   give something (Focus spent or hit points missing). {die, bonus} or null. */
export function uncannyMetabolism(c){
  var lv = classLevelOf(c, "Monk");
  if(!isMonk2024(c) || lv < 2 || resourceLeft(c, "Monk:uncanny_metabolism") < 1) return null;
  var spent = Number((c.resourcesUsed||{})["Monk:ki"]) > 0, hurt = (Number(c.hp && c.hp.current)||0) < maxHp(c);
  return spent || hurt ? {die: martialArtsDie(c), bonus: lv} : null;
}
/* Use it with the die rolled: the hit points healed. */
export function useUncannyMetabolism(c, roll){
  var um = uncannyMetabolism(c);
  if(!um || !spendResource(c, "Monk:uncanny_metabolism", 1)) return 0;
  c.resourcesUsed["Monk:ki"] = 0;
  var before = Number(c.hp.current)||0;
  c.hp.current = clamp(before + roll + um.bonus, 0, maxHp(c));
  return c.hp.current - before;
}
/* Perfect Focus (monk 15): rolling initiative without Uncanny Metabolism
   brings Focus back up to 4 when you have 3 or fewer. The points it gives. */
export function perfectFocusGain(c){
  if(!isMonk2024(c) || classLevelOf(c, "Monk") < 15) return 0;
  var left = resourceLeft(c, "Monk:ki");
  return left >= 0 && left <= 3 ? 4 - left : 0;
}
export function usePerfectFocus(c){
  var n = perfectFocusGain(c);
  if(n) c.resourcesUsed["Monk:ki"] = Math.max(0, (Number(c.resourcesUsed["Monk:ki"])||0) - n);
  return n;
}
/* "Focus" for a 2024 monk, "ki" otherwise, for labels. */
export function kiWord(c){ return isMonk2024(c) ? "Focus" : "ki"; }
export function kiSaveDc(c){
  return 8 + profBonus(c) + mod(abilityScore(c, "wis"));
}
/* Kensei weapons (weapons chosen for the Way of the Kensei). */
export function isKenseiWeapon(c, item){
  return classLevelOf(c, "Monk", "Way of the Kensei") >= 3 && characterPickedProfs(c).monkWeapons.indexOf(baseWeaponName(item))!==-1;
}
function heldKensei(c){
  return (c.inventory||[]).find(function(i){ return i.type==="weapon" && i.equipped && !magicBonusOf(i) && isKenseiWeapon(c, i); }) || null;
}
/* Sharpen the Blade (Kensei 11): the bonus on this weapon, or 0 (none on a
   magic weapon that already has one). */
export function sharpenBonus(c, item){
  return c.sharpen && c.sharpen.item===item.id && !magicBonusOf(item) ? Number(c.sharpen.bonus)||0 : 0;
}
/* The most ki one elemental spell can take at this monk level, base cost
   included (Spells and Ki Points table): none extra below 5th. */
function spellKiCap(lv){
  return lv >= 17 ? 6 : lv >= 13 ? 5 : lv >= 9 ? 4 : lv >= 5 ? 3 : 0;
}
/* The elemental disciplines the monk knows. upcast "spell": more ki raises
   the spell, up to the table's limit. upcast "ki": more dice for as much
   ki as is left. */
function disciplineActions(c, lv, dc){
  var out = [], set = optionSetDef("disciplines");
  allKnownOptions(c, "disciplines").forEach(function(k){
    var o = set.options.find(function(x){ return x.name===k.name; });
    if(!o || !o.cost) return;
    var base = Number(o.cost), left = resourceLeft(c, "Monk:ki");
    var top = o.upcast==="spell" ? Math.max(base, spellKiCap(lv)) : o.upcast==="ki" ? Math.max(base, left) : base;
    var detail = (o.save ? o.save.toUpperCase() + " save DC " + dc + ". " : "") + o.text;
    for(var n = base; n <= top; n++){
      var a = {id: "disc-" + o.name + "-" + n, name: o.name, cost: n, detail: detail, log: o.name + "."};
      if(top > base){
        a.group = o.name;
        var more = n - base;
        a.name = o.dmg ? (o.dmg.qty + more) + "d" + o.dmg.die + " " + o.dmg.type : (1 + more) + (more ? " targets" : " target");
      }
      if(o.dmg) a.roll = {qty: o.dmg.qty + n - base, die: o.dmg.die, bonus: 0, label: o.name + " (" + (o.save ? o.save.toUpperCase() + " DC " + dc + ", " : "") + o.dmg.type + ")"};
      out.push(a);
    }
    if(o.onHit) out.push({id: "disc-hit-" + o.name, name: o.onHit.name, cost: 1, detail: "When that attack hits: an extra 1d" + o.onHit.die + " " + o.onHit.type + ".",
      roll: {qty: 1, die: o.onHit.die, bonus: 0, label: o.onHit.name + " (" + o.onHit.type + ")"}});
  });
  return out;
}
export function kiActions(c){
  var lv = classLevelOf(c, "Monk");
  if(lv < 2) return [];
  var dc = kiSaveDc(c), die = martialArtsDie(c), wis = mod(abilityScore(c, "wis")), dex = mod(abilityScore(c, "dex"));
  var way = function(name, level){ return classLevelOf(c, "Monk", name) >= level; };
  var out = [], focus = isMonk2024(c);
  // The 2024 monk: Flurry needs no Attack action first (three strikes from
  // monk 10), Patient Defense and Step of the Wind give two actions.
  var flurry = focus ? (lv >= 10 ? "Three" : "Two") + " unarmed strikes as a bonus action." : "Two unarmed strikes as a bonus action, right after the Attack action.";
  if(way("Way of the Open Hand", 3)) flurry += " Open Hand Technique: on a hit, DEX save (DC " + dc + ") or prone, STR save or pushed 15 feet, or it can't take reactions until the end of your next turn.";
  if(way("Way of Mercy", 11)) flurry += " Each strike can be Hand of Healing for free, and Hand of Harm costs no ki with a strike.";
  else if(way("Way of Mercy", 3)) flurry += " One strike can be Hand of Healing for free.";
  // The 2024 subclasses.
  if(way("Warrior of the Open Hand", 3)) flurry += " Open Hand Technique: on a hit, Addle (it can't make opportunity attacks until the start of its next turn), Push (STR save DC " + dc + " or pushed 15 feet) or Topple (DEX save DC " + dc + " or prone).";
  if(way("Warrior of Mercy", 11)) flurry += " Flurry of Healing and Harm: each strike can be Hand of Healing, and Hand of Harm can come with a strike, without spending Focus (uses on Vitals).";
  else if(way("Warrior of Mercy", 3)) flurry += " One strike can be Hand of Healing, with no Focus for the healing.";
  if(way("Way of the Drunken Master", 3)) flurry += " You also get the Disengage action and +10 feet of walking speed this turn.";
  if(way("Way of the Drunken Master", 17)) flurry += " Up to five attacks, if each one targets a different creature.";
  // (Cloak of Shadows, 2024 Shadow 17: Flurry costs nothing while it's on.)
  var cloaked = effectOn(c, "shadow_cloak");
  if(cloaked) flurry += " Cloak of Shadows: no Focus needed.";
  out.push({id: "flurry", name: "Flurry of Blows", cost: cloaked ? 0 : 1, detail: flurry, log: flurry});
  if(focus){
    var patient = "Take both the Disengage and Dodge actions as a bonus action." + (lv >= 10 ? " Heightened Focus: you also gain temporary hit points equal to two rolls of your Martial Arts die." : "");
    // (Heightened Focus rolls the temporary hit points: `temp` on the roll.)
    out.push({id: "patient", name: "Patient Defense", cost: 1, detail: patient, log: patient,
      roll: lv >= 10 ? {qty: 2, die: die, bonus: 0, label: "Patient Defense: temporary hit points", temp: true} : null});
  }
  else out.push({id: "patient", name: "Patient Defense", cost: 1, detail: "Take the Dodge action as a bonus action.", log: "The Dodge action as a bonus action."});
  var step = focus ? "Take both the Disengage and Dash actions as a bonus action, and your jump distance doubles this turn." : "Disengage or Dash as a bonus action, and your jump distance doubles this turn.";
  if(focus && lv >= 10) step += " Heightened Focus: you can take a willing Large or smaller creature within 5 feet along with you, and its movement doesn't provoke opportunity attacks.";
  if(way("Way of the Ascendant Dragon", 6)) step += " Wings Unfurled can give you a flying speed this turn.";
  if(way("Warrior of the Open Hand", 11)) step += " Fleet Step: you can also use it right after any other bonus action.";
  if(effectOn(c, "elemental_epitome")) step += " Elemental Epitome: +20 feet this turn, and each creature you choose takes a Martial Arts die of elemental damage when you move within 5 feet of it (once per turn).";
  out.push({id: "step", name: "Step of the Wind", cost: 1, detail: step, log: step});
  // Deflect Missiles' throw back (2014 monk 3), also on the unarmed strike
  // card after the reduction roll: a ranged attack, so it rolls to hit.
  if(lv >= 3 && !focus){
    out.push({id: "deflect-throw", name: "Deflect Missiles: throw it back", cost: 1, detail: "When Deflect Missiles brings a ranged weapon attack's damage to 0 and you catch the missile: throw it back as part of the same reaction, a ranged attack (20/60 feet) with proficiency, as a monk weapon.",
      log: "Caught the missile and threw it back.",
      attack: {bonus: dex + profBonus(c), hit: {qty: 1, die: die, bonus: dex, label: "Caught missile", offerDamage: true}}});
  }
  // Deflect Attacks' redirect (2024 monk 3), also on the unarmed strike
  // card after the reduction roll. Any damage type from monk 13 (Deflect Energy).
  if(lv >= 3 && focus){
    var redirect = "When Deflect Attacks brings an attack's damage to 0" + (lv >= 13 ? "" : " (bludgeoning, piercing or slashing)") + ": a creature you can see within 5 feet (melee attack) or 60 feet and not behind total cover (ranged attack) makes a DEX save, DC " + dc + ", or takes two rolls of your Martial Arts die + DEX, of the attack's damage type.";
    out.push({id: "deflect-redirect", name: "Deflect Attacks: redirect", cost: 1, detail: redirect, log: "Redirected: the target makes a DEX save, DC " + dc + ".",
      roll: {qty: 2, die: die, bonus: dex, label: "Deflect Attacks: redirected (DEX save DC " + dc + ")"}});
  }
  if(lv >= 5 && focus){
    var stun = "Once per turn, on a hit with a monk weapon or an unarmed strike: CON save DC " + dc + ". On a failure it is stunned until the start of your next turn. On a success its speed is halved and the next attack against it has advantage, until the start of your next turn.";
    out.push({id: "stun", name: "Stunning Strike", cost: 1, detail: stun, log: stun});
  }
  else if(lv >= 5) out.push({id: "stun", name: "Stunning Strike", cost: 1, detail: "On a melee weapon hit: CON save DC " + dc + " or stunned until the end of your next turn.", log: "CON save DC " + dc + " or stunned until the end of your next turn."});
  if(way("Way of the Open Hand", 17)){
    out.push({id: "quiver", name: "Quivering Palm", cost: 3, detail: "On an unarmed hit: start the vibrations, which last " + lv + " days.", log: "Vibrations started. They last " + lv + " days."});
    out.push({id: "quiver-end", name: "Quivering Palm: end it", cost: 0, detail: "An action: CON save DC " + dc + ". On a failure it drops to 0 hit points, on a success it takes 10d10 necrotic.",
      roll: {qty: 10, die: 10, bonus: 0, label: "Quivering Palm: necrotic if it saves (CON DC " + dc + ")"}});
  }
  if(lv >= 18 && !focus) out.push({id: "astral", name: "Astral Projection", cost: 8, detail: "Empty Body: cast Astral Projection without material components. You can't take any other creatures with you.", log: "Astral Projection, on yourself only."});
  if(way("Way of Shadow", 3)) [
    ["Darkness", "Magical darkness in a 15-foot radius for up to 10 minutes (concentration)."],
    ["Darkvision", "A willing creature you touch gains darkvision out to 60 feet for 8 hours."],
    ["Pass without Trace", "You and creatures within 30 feet get +10 to Stealth for up to 1 hour (concentration)."],
    ["Silence", "No sound in a 20-foot radius for up to 10 minutes (concentration)."]
  ].forEach(function(s){
    out.push({id: "shadow-" + s[0], group: "Shadow Arts", name: s[0], cost: 2, detail: "An action. " + s[1], log: "Cast " + s[0] + "."});
  });
  if(way("Way of the Sun Soul", 6)) for(var arc = 2; arc <= Math.floor(lv / 2); arc++){
    out.push({id: "arc" + arc, group: "Searing Arc Strike", name: (arc + 1) + "d6 fire", cost: arc, detail: "Burning Hands as a bonus action, right after the Attack action: a 15-foot cone, DEX save DC " + dc + " for half.",
      roll: {qty: arc + 1, die: 6, bonus: 0, label: "Searing Arc Strike (DEX DC " + dc + ", half on a success)"}});
  }
  out = out.concat(disciplineActions(c, lv, dc));
  if(way("Way of Mercy", 3)){
    var touch = way("Way of Mercy", 6);
    out.push({id: "harm", name: "Hand of Harm", cost: 1, detail: "On an unarmed hit, once per turn: extra necrotic damage." + (touch ? " Physician's Touch: you can poison it until the end of your next turn." : ""),
      roll: {qty: 1, die: die, bonus: wis, label: "Hand of Harm (Necrotic)"}});
    out.push({id: "heal", name: "Hand of Healing", cost: 1, detail: "An action: restore hit points to a creature you touch." + (touch ? " Physician's Touch: you can also end a disease, or blinded, deafened, paralyzed, poisoned or stunned." : ""),
      roll: {qty: 1, die: die, bonus: wis, label: "Hand of Healing: hit points restored"}});
  }
  if(way("Way of Mercy", 17)) out.push({id: "ultimate", name: "Hand of Ultimate Mercy", cost: 5, payKey: "Monk:hand_of_ultimate_mercy", detail: "An action: bring back a creature that died within 24 hours. Once per long rest.",
    roll: {qty: 4, die: 10, bonus: wis, label: "Hand of Ultimate Mercy: hit points regained"}, reason: resourceLeft(c, "Monk:hand_of_ultimate_mercy") > 0 ? "" : "Used until a long rest"});
  // ---- The 2024 subclasses (Player's Handbook 2024, pp. 104 to 107) ----
  if(way("Warrior of the Open Hand", 17)){
    out.push({id: "quiver24", name: "Quivering Palm", cost: 4, detail: "On an unarmed hit: start harmless vibrations that last " + lv + " days. Only one creature at a time.", log: "Vibrations started. They last " + lv + " days."});
    out.push({id: "quiver24-end", name: "Quivering Palm: end it", cost: 0, detail: "An action, or give up one attack of the Attack action: CON save DC " + dc + ", 10d12 force damage on a failure, half on a success.",
      roll: {qty: 10, die: 12, bonus: 0, label: "Quivering Palm: force damage (CON DC " + dc + ", half on a success)"}});
  }
  if(way("Warrior of Shadow", 3)) out.push({id: "shadow24-darkness", name: "Darkness", cost: 1, detail: "Cast Darkness without components. You can see within it, and you can move its area to a space within 60 feet at the start of each of your turns.", log: "Cast Darkness."});
  if(way("Warrior of Shadow", 11)) out.push({id: "improved-step", name: "Improved Shadow Step", cost: 1, detail: "With Shadow Step: you don't need to start and end in dim light or darkness, and you can make an unarmed strike right after you teleport.", log: "Shadow Step without the darkness, with an unarmed strike after it."});
  if(way("Warrior of the Elements", 6)) out.push({id: "burst", name: "Elemental Burst", cost: 2, detail: "A Magic action: a 20-foot-radius sphere within 120 feet, acid, cold, fire, lightning or thunder. DEX save DC " + dc + " for half.",
    roll: {qty: 3, die: die, bonus: 0, label: "Elemental Burst (DEX DC " + dc + ", half on a success)"}});
  if(way("Warrior of Mercy", 3)){
    var touch24 = way("Warrior of Mercy", 6), harmRoll = {qty: 1, die: die, bonus: wis, label: "Hand of Harm (Necrotic)"}, healRoll = {qty: 1, die: die, bonus: wis, label: "Hand of Healing: hit points restored"};
    var harmText = "Once per turn, on an unarmed hit: extra necrotic damage." + (touch24 ? " Physician's Touch: you can also poison it until the end of your next turn." : "");
    var healText = (touch24 ? " Physician's Touch: you can also end blinded, deafened, paralyzed, poisoned or stunned." : "");
    out.push({id: "harm24", name: "Hand of Harm", cost: 1, detail: harmText, roll: harmRoll});
    out.push({id: "heal24", name: "Hand of Healing", cost: 1, detail: "A Magic action: restore hit points to a creature you touch." + healText, roll: healRoll});
    out.push({id: "heal24-flurry", name: "Hand of Healing in a Flurry", cost: 0, detail: "In place of one Flurry of Blows strike, with no Focus for the healing." + healText, roll: healRoll});
    if(way("Warrior of Mercy", 11)){
      var mercyLeft = resourceLeft(c, "Monk:flurry_of_healing_and_harm") > 0 ? "" : "Used up until a long rest";
      out.push({id: "harm24-flurry", name: "Hand of Harm with a Flurry strike", cost: 0, payKey: "Monk:flurry_of_healing_and_harm", reason: mercyLeft, detail: "Flurry of Healing and Harm: with a Flurry of Blows strike that deals damage, no Focus. Still once per turn." + (touch24 ? " You can also poison it." : ""), roll: harmRoll});
      out.push({id: "heal24-more", name: "Hand of Healing on another Flurry strike", cost: 0, payKey: "Monk:flurry_of_healing_and_harm", reason: mercyLeft, detail: "Flurry of Healing and Harm: another strike of the same Flurry becomes Hand of Healing, no Focus." + healText, roll: healRoll});
    }
  }
  if(way("Warrior of Mercy", 17)) out.push({id: "ultimate24", name: "Hand of Ultimate Mercy", cost: 5, payKey: "Monk:hand_of_ultimate_mercy", detail: "A Magic action: bring back a creature that died within 24 hours, free of blinded, deafened, paralyzed, poisoned and stunned. Once per long rest.",
    roll: {qty: 4, die: 10, bonus: wis, label: "Hand of Ultimate Mercy: hit points regained"}, reason: resourceLeft(c, "Monk:hand_of_ultimate_mercy") > 0 ? "" : "Used until a long rest"});
  if(way("Way of the Drunken Master", 6)) out.push({id: "redirect", name: "Redirect Attack", cost: 1, detail: "Reaction: when a creature misses you with a melee attack, it hits another creature of your choice within 5 feet of you.", log: "The missed attack hits another creature within 5 feet of you."});
  if(way("Way of the Drunken Master", 11)) out.push({id: "luck", name: "Drunkard's Luck", cost: 2, detail: "Cancel the disadvantage on an ability check, attack roll or saving throw.", log: "Disadvantage cancelled for that roll."});
  if(way("Way of the Sun Soul", 3)) out.push({id: "bolt", name: "Radiant Sun Bolt: two more", cost: 1, detail: "After using it with the Attack action, make the special attack twice as a bonus action.", log: "Two more Radiant Sun Bolts as a bonus action."});
  if(way("Way of the Kensei", 6)) out.push({id: "deft", name: "Deft Strike", cost: 1, detail: "On a hit with a kensei weapon, once per turn: extra damage of the weapon's type.", roll: {qty: 1, die: die, bonus: 0, label: "Deft Strike"}});
  if(way("Way of the Kensei", 11)){
    var held = heldKensei(c);
    [1, 2, 3].forEach(function(n){
      out.push({id: "sharpen" + n, group: "Sharpen the Blade", name: "+" + n + " for 1 minute", cost: n, sharpen: held ? {item: held.id, bonus: n, name: held.name} : null,
        detail: "A bonus action: +" + n + " to attack and damage with the kensei weapon in your hand.", reason: held ? "" : "Hold a kensei weapon first"});
    });
  }
  if(way("Way of the Ascendant Dragon", 3)){
    var rolls = way("Way of the Ascendant Dragon", 11) ? 3 : 2, free = resourceLeft(c, "Monk:breath_of_the_dragon") > 0;
    out.push({id: "breath", name: "Breath of the Dragon", cost: 2, useKey: "Monk:breath_of_the_dragon", freeUse: free, detail: "In place of an attack: a 20-foot cone or a 30-foot line, DEX save DC " + dc + " for half.",
      roll: {qty: rolls, die: die, bonus: 0, label: "Breath of the Dragon (DEX DC " + dc + ", half on a success)"}});
  }
  if(way("Way of the Ascendant Dragon", 11)) out.push({id: "wyrm", name: "Aspect of the Wyrm", cost: 3, useKey: "Monk:aspect_of_the_wyrm", freeUse: resourceLeft(c, "Monk:aspect_of_the_wyrm") > 0, detail: "A bonus action: a 10-foot aura for 1 minute, Frightful Presence (WIS DC " + dc + ") or resistance to a damage type.", log: "A 10-foot aura for 1 minute."});
  if(way("Way of the Ascendant Dragon", 17)){
    out.push({id: "augment", name: "Augment Breath", cost: 1, detail: "With Breath of the Dragon: a 60-foot cone or a 90-foot line, DEX save DC " + dc + " for half.", roll: {qty: 4, die: die, bonus: 0, label: "Augmented Breath (DEX DC " + dc + ", half on a success)"}});
    out.push({id: "fury", name: "Explosive Fury", cost: 0, detail: "When you activate Aspect of the Wyrm: creatures you choose in the aura make a DEX save (DC " + dc + ") or take this.", roll: {qty: 3, die: 10, bonus: 0, label: "Explosive Fury (DEX DC " + dc + ")"}});
  }
  if(way("Way of the Sun Soul", 11)) [0, 1, 2, 3].forEach(function(n){
    out.push({id: "burst" + n, group: "Searing Sunburst", name: (2 + 2 * n) + "d6 radiant", cost: n, detail: "An action: a 20-foot-radius sphere within 150 feet, CON save DC " + dc + " or take this.",
      roll: {qty: 2 + 2 * n, die: 6, bonus: 0, label: "Searing Sunburst (CON DC " + dc + ")"}});
  });
  if(way("Way of Long Death", 3)){
    var gain = Math.max(1, wis + lv);
    out.push({id: "touch", name: "Touch of Death", cost: 0, temp: gain, detail: "When you reduce a creature within 5 feet to 0 hit points: " + gain + " temporary HP.", log: gain + " temporary HP."});
  }
  if(way("Way of Long Death", 17)) for(var n = 1; n <= 10; n++){
    out.push({id: "long" + n, group: "Touch of the Long Death", name: (2 * n) + "d10 necrotic", cost: n, detail: "An action: CON save DC " + dc + ", half on a success.",
      roll: {qty: 2 * n, die: 10, bonus: 0, label: "Touch of the Long Death (CON DC " + dc + ", half on a success)"}});
  }
  return out;
}
/* One of the monk's ki actions by id ("flurry", "stun"), or null. */
export function kiAction(c, id){
  return kiActions(c).find(function(a){ return a.id===id; }) || null;
}
/* Flurry of Blows' unarmed strikes: two, three from 2024 monk 10
   (Heightened Focus). */
export function flurryStrikes(c){
  return isMonk2024(c) && classLevelOf(c, "Monk") >= 10 ? 3 : 2;
}
/* Stunning Strike (monk 5) with this weapon: the 2024 monk's needs a monk
   weapon (or an unarmed strike, item null), the 2014 monk's any melee
   weapon attack. */
export function canStunWith(c, item, monkWeapon, ranged){
  if(classLevelOf(c, "Monk") < 5) return false;
  if(!item) return true;
  return isMonk2024(c) ? !!monkWeapon : !ranged;
}
/* The 2024 Unarmed Strike's Grapple and Shove (2024 monk only: the 2014
   rules contest them with Athletics, no DC): the target saves with STR or
   DEX, its choice, against 8 + STR + proficiency. Dexterous Attacks lets
   the monk use DEX instead while wearing no armor and holding no shield.
   {dc, ability: "STR"|"DEX"} or null. */
export function grappleShoveDc(c){
  if(!isMonk2024(c)) return null;
  var str = mod(abilityScore(c, "str")), dex = mod(abilityScore(c, "dex"));
  var geared = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped; });
  var useDex = !geared && dex > str;
  return {dc: 8 + profBonus(c) + (useDex ? dex : str), ability: useDex ? "DEX" : "STR"};
}
/* Open Hand Technique, on a hit from Flurry of Blows (2014 Way of the
   Open Hand 3, 2024 Warrior of the Open Hand 3): one of three effects,
   [{name, text}] or []. */
export function openHandTechniques(c){
  var dc = kiSaveDc(c);
  if(classLevelOf(c, "Monk", "Warrior of the Open Hand") >= 3) return [
    {name: "Topple (DEX DC " + dc + ")", text: "Topple: DEX save DC " + dc + " or it falls prone."},
    {name: "Push (STR DC " + dc + ")", text: "Push: STR save DC " + dc + " or it's pushed up to 15 feet away."},
    {name: "Addle", text: "Addle: no opportunity attacks until the start of its next turn."}];
  if(classLevelOf(c, "Monk", "Way of the Open Hand") >= 3) return [
    {name: "Prone (DEX DC " + dc + ")", text: "DEX save DC " + dc + " or it falls prone."},
    {name: "Push (STR DC " + dc + ")", text: "STR save DC " + dc + " or it's pushed up to 15 feet away."},
    {name: "No reactions", text: "It can't take reactions until the end of your next turn."}];
  return [];
}
/* Elemental Attunement's push (2024 Warrior of the Elements 3), on an
   unarmed hit of an elemental type while it's on: the STR save DC, or 0. */
export function elementalPushDc(c){
  return effectOn(c, "elemental_attunement") ? kiSaveDc(c) : 0;
}
/* Why an action can't be taken now, or "". */
export function kiActionProblem(c, a){
  if(a.reason) return a.reason;
  if(a.useKey && a.freeUse) return "";
  return resourceLeft(c, "Monk:ki") < a.cost ? "Needs " + a.cost + " " + kiWord(c) : "";
}
/* Pay for it: a use of its own while one is left, else ki. True if paid. */
export function payKiAction(c, a){
  if(kiActionProblem(c, a)) return false;
  var key = a.useKey && a.freeUse ? a.useKey : "Monk:ki";
  var n = a.useKey && a.freeUse ? 1 : a.cost;
  if(!c.resourcesUsed) c.resourcesUsed = {};
  if(n) c.resourcesUsed[key] = (Number(c.resourcesUsed[key])||0) + n;
  if(a.payKey) c.resourcesUsed[a.payKey] = (Number(c.resourcesUsed[a.payKey])||0) + 1;
  if(a.sharpen) c.sharpen = {item: a.sharpen.item, bonus: a.sharpen.bonus};
  if(a.temp && !(c.hp && (Number(c.hp.temp)||0) >= a.temp)) c.hp.temp = a.temp;
  return true;
}
