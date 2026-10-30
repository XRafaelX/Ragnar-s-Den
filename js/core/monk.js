/* ---------------- What ki can pay for ----------------
   The Ki row's "Spend ki on..." list on Vitals: every ki feature the monk
   has now, by class level and tradition (checked against the Player's
   Handbook, Xanathar's Guide, the Sword Coast Adventurer's Guide, Tasha's
   Cauldron and Fizban's Treasury on 5etools' data 2026-10-30).

   Each action: {id, name, group, cost (ki), detail, log, roll: {qty, die,
   bonus, label}, temp (temporary HP), useKey (a resource it spends instead
   of ki while one is left), payKey (a resource it spends as well), sharpen
   (Sharpen the Blade's bonus), reason (why it can't be used now)}. */
import { mod, profBonus } from "./basics.js";
import { classLevelOf } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { martialArtsDie, resourceLeft } from "./effects.js";
import { characterPickedProfs } from "./class-picks.js";
import { allKnownOptions } from "./class-options.js";
import { optionSetDef } from "../data/class-options.js";
import { magicBonusOf } from "./magic-items.js";
import { baseWeaponName } from "../data/weapons.js";

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
  var out = [];
  var flurry = "Two unarmed strikes as a bonus action, right after the Attack action.";
  if(way("Way of the Open Hand", 3)) flurry += " Open Hand Technique: on a hit, DEX save (DC " + dc + ") or prone, STR save or pushed 15 feet, or it can't take reactions until the end of your next turn.";
  if(way("Way of Mercy", 11)) flurry += " Each strike can be Hand of Healing for free, and Hand of Harm costs no ki with a strike.";
  else if(way("Way of Mercy", 3)) flurry += " One strike can be Hand of Healing for free.";
  if(way("Way of the Drunken Master", 3)) flurry += " You also get the Disengage action and +10 feet of walking speed this turn.";
  if(way("Way of the Drunken Master", 17)) flurry += " Up to five attacks, if each one targets a different creature.";
  out.push({id: "flurry", name: "Flurry of Blows", cost: 1, detail: flurry, log: flurry});
  out.push({id: "patient", name: "Patient Defense", cost: 1, detail: "Take the Dodge action as a bonus action.", log: "The Dodge action as a bonus action."});
  var step = "Disengage or Dash as a bonus action, and your jump distance doubles this turn.";
  if(way("Way of the Ascendant Dragon", 6)) step += " Wings Unfurled can give you a flying speed this turn.";
  out.push({id: "step", name: "Step of the Wind", cost: 1, detail: step, log: step});
  if(lv >= 5) out.push({id: "stun", name: "Stunning Strike", cost: 1, detail: "On a melee weapon hit: CON save DC " + dc + " or stunned until the end of your next turn.", log: "CON save DC " + dc + " or stunned until the end of your next turn."});
  if(way("Way of the Open Hand", 17)){
    out.push({id: "quiver", name: "Quivering Palm", cost: 3, detail: "On an unarmed hit: start the vibrations, which last " + lv + " days.", log: "Vibrations started. They last " + lv + " days."});
    out.push({id: "quiver-end", name: "Quivering Palm: end it", cost: 0, detail: "An action: CON save DC " + dc + ". On a failure it drops to 0 hit points, on a success it takes 10d10 necrotic.",
      roll: {qty: 10, die: 10, bonus: 0, label: "Quivering Palm: necrotic if it saves (CON DC " + dc + ")"}});
  }
  if(lv >= 18) out.push({id: "astral", name: "Astral Projection", cost: 8, detail: "Empty Body: cast Astral Projection without material components. You can't take any other creatures with you.", log: "Astral Projection, on yourself only."});
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
/* Why an action can't be taken now, or "". */
export function kiActionProblem(c, a){
  if(a.reason) return a.reason;
  if(a.useKey && a.freeUse) return "";
  return resourceLeft(c, "Monk:ki") < a.cost ? "Needs " + a.cost + " ki" : "";
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
