/* ---------------- Cleric ----------------
   Divine Strike, what Channel Divinity can do for each domain, Divine
   Intervention and Blessing of the Forge (checked against the Player's
   Handbook, Dungeon Master's Guide, Sword Coast Adventurer's Guide,
   Xanathar's Guide and Tasha's Cauldron on 5etools' data 2026-10-30; the
   Fate Domain isn't in that data and keeps its text as it was).

   A Channel Divinity action has the same shape as a paladin's
   (js/core/paladin.js), with `pool` naming the cleric's uses. */
import { mod, profBonus } from "./basics.js";
import { classFeatureList, classLevelOf } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { resourceLeft, effectOn } from "./effects.js";
import { SKILLS } from "../data/abilities-skills.js";

var CHANNEL = "Cleric:channel_divinity";
function cleric(c){
  return (c.classes||[]).find(function(cl){ return cl.name==="Cleric"; }) || null;
}
function wisAtLeastOne(c){
  return Math.max(1, mod(abilityScore(c, "wis")));
}
export function clericDc(c){
  return 8 + profBonus(c) + mod(abilityScore(c, "wis"));
}
/* The highest challenge rating Destroy Undead reaches, as text, or "". */
export function destroyUndeadCr(lv){
  return lv >= 17 ? "4" : lv >= 14 ? "3" : lv >= 11 ? "2" : lv >= 8 ? "1" : lv >= 5 ? "1/2" : "";
}
/* The damage type of a domain's Divine Strike. */
var STRIKE_TYPES = {"Life Domain": "Radiant", "Tempest Domain": "Thunder", "Trickery Domain": "Poison", "Twilight Domain": "Radiant",
  "Forge Domain": "Fire", "Order Domain": "Psychic", "Death Domain": "Necrotic"};
var STRIKE_WORDS = {"War Domain": "the weapon's type", "Nature Domain": "cold, fire or lightning"};
/* Divine Strike (cleric 8): the extra dice once on each of your turns,
   in the same shape as a ranger's (rangerHitDice). [] without it, as when
   Blessed Strikes has replaced it. */
export function clericHitDice(c){
  var cl = cleric(c);
  if(!cl || !classFeatureList(cl).some(function(f){ return f.name==="Divine Strike"; })) return [];
  var qty = (Number(cl.level)||1) >= 14 ? 2 : 1, type = STRIKE_TYPES[cl.subclass] || "";
  return [{id: "divine", name: "Divine Strike", text: "Divine Strike +" + qty + "d8", qty: qty, die: 8, label: "Divine Strike" + (type ? " (" + type + ")" : ""), unarmed: true,
    title: "Once on each of your turns when you hit with a weapon attack" + (STRIKE_WORDS[cl.subclass] ? ": " + STRIKE_WORDS[cl.subclass] + " damage" : "")}];
}
/* Guided Strike's pool for this character (War Domain 2), "" without it. */
export function warGuidedStrike(c){
  return classLevelOf(c, "Cleric", "War Domain") >= 2 && resourceLeft(c, CHANNEL) > 0 ? CHANNEL : "";
}
/* The healing a Twilight Sanctuary gives at the end of a turn. */
export function sanctuaryBonus(c){
  return classLevelOf(c, "Cleric");
}
/* Twilight Shroud (Twilight Domain 17): half cover in your sanctuary, which
   is +2 to AC and Dexterity saves. 0 when it isn't up. */
export function twilightShroud(c){
  return classLevelOf(c, "Cleric", "Twilight Domain") >= 17 && effectOn(c, "twilight_sanctuary") ? 2 : 0;
}
/* Saint of Forge and Fire (Forge Domain 17): needs heavy armor on. */
export function saintResistance(c){
  if(classLevelOf(c, "Cleric", "Forge Domain") < 17) return [];
  var heavy = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; });
  return heavy ? [{type: "nonmagical bludgeoning, piercing and slashing", source: "Saint of Forge and Fire"}] : [];
}

/* ---- Blessing of the Forge (Forge Domain 1) ---- */
export function forgeItems(c){
  if(classLevelOf(c, "Cleric", "Forge Domain") < 1) return [];
  return (c.inventory||[]).filter(function(i){ return (i.type==="weapon" || i.type==="armor") && !(Number(i.magicBonus)||0) && !i.magic; });
}
export function blessItem(c, item){
  item.magicBonus = 1;
  c.forgeBlessed = item.id;
}
/* It lasts until the end of your next long rest. */
export function forgeOnLongRest(c){
  if(!c.forgeBlessed) return;
  var item = (c.inventory||[]).find(function(i){ return i.id===c.forgeBlessed; });
  if(item) item.magicBonus = 0;
  delete c.forgeBlessed;
}

/* ---- Divine Intervention (cleric 10) ----
   A failed call can be tried again after a long rest, a success after 7
   days (the row's own counter, reset by hand). */
export function interventionOnLongRest(c){
  if(!c.interventionFailed) return;
  delete c.interventionFailed;
  c.resourcesUsed["Cleric:divine_intervention"] = 0;
}

/* ---- Channel Divinity (cleric 2) ---- */
export function clericChannels(c){
  var cl = cleric(c), lv = cl ? Number(cl.level)||1 : 0;
  if(lv < 2) return [];
  var dc = clericDc(c), wis = wisAtLeastOne(c), cr = destroyUndeadCr(lv);
  function act(name, detail, more){
    return Object.assign({id: name, name: name, pool: CHANNEL, detail: detail, log: "Used."}, more || {});
  }
  function saveLog(what){ return what + " save DC " + dc + "."; }
  var turned = " or is turned for 1 minute or until it takes damage. It must move away from you, can't take reactions, and for its action can only Dash, try to escape or Dodge.";
  var out = [act("Turn Undead", "An action: each undead within 30 feet that can see or hear you makes a WIS save (DC " + dc + ")" + turned + (cr ? " Undead of CR " + cr + " or lower are destroyed instead." : ""), {log: saveLog("WIS")})];
  var sub = cl.subclass;
  var at = function(level){ return lv >= level; };
  if(sub==="Life Domain") out.push(act("Preserve Life", "An action: restore up to " + 5 * lv + " hit points, split among creatures within 30 feet. No one goes above half their hit point maximum, and undead and constructs can't be healed.", {log: "Up to " + 5 * lv + " hit points to share."}));
  if(sub==="Light Domain") out.push(act("Radiance of the Dawn", "An action: magical darkness within 30 feet ends. Each hostile creature within 30 feet makes a CON save (DC " + dc + "), half on a success. Total cover protects them.",
    {roll: {qty: 2, die: 10, bonus: lv, label: "Radiance of the Dawn (CON DC " + dc + ", half on a success)"}, log: ""}));
  if(sub==="War Domain"){
    out.push(act("Guided Strike", "+10 to your attack roll, after you see the roll.", {reason: "Offered after an attack roll"}));
    if(at(6)) out.push(act("War God's Blessing", "Your reaction, when a creature within 30 feet makes an attack roll: +10 to that roll.", {log: "+10 to that creature's attack roll."}));
  }
  if(sub==="Knowledge Domain"){
    SKILLS.forEach(function(s){
      var known = c.skillProfs && c.skillProfs[s[0]] && c.skillProfs[s[0]].prof;
      if(!known) out.push(act("ages-" + s[0], "An action: proficiency with " + s[0] + " for 10 minutes.", {name: s[0], group: "Knowledge of the Ages", effect: "knowledge_of_the_ages", ages: s[0]}));
    });
    out.push(act("ages-tool", "An action: proficiency with one tool for 10 minutes.", {name: "A tool", group: "Knowledge of the Ages", log: "Proficient with that tool for 10 minutes."}));
    if(at(6)) out.push(act("Read Thoughts", "An action: a creature you can see within 60 feet makes a WIS save (DC " + dc + "). On a failure you read its surface thoughts for 1 minute, and can end that to cast Suggestion on it, which it automatically fails.", {log: saveLog("WIS")}));
  }
  if(sub==="Tempest Domain") out.push(act("Destructive Wrath", "When you roll lightning or thunder damage: deal the maximum instead of rolling.", {log: "Use the maximum on that lightning or thunder damage."}));
  if(sub==="Trickery Domain"){
    out.push(act("Invoke Duplicity", "An action: an illusion of you within 30 feet for 1 minute, with your concentration.", {effect: "invoke_duplicity"}));
    if(at(6)) out.push(act("Cloak of Shadows", "An action: you're invisible until the end of your next turn, or until you attack or cast a spell.", {effect: "trickery_cloak"}));
  }
  if(sub==="Nature Domain") out.push(act("Charm Animals and Plants", "An action: each beast or plant within 30 feet that can see you makes a WIS save (DC " + dc + ") or is charmed by you for 1 minute or until it takes damage.", {log: saveLog("WIS")}));
  if(sub==="Twilight Domain") out.push(act("Twilight Sanctuary", "An action: a 30-foot sphere of twilight around you for 1 minute. It gives temporary hit points, or ends charmed or frightened, when a turn ends in it.", {effect: "twilight_sanctuary"}));
  if(sub==="Forge Domain") out.push(act("Artisan's Blessing", "A 1-hour ritual: make a nonmagical item with some metal in it, worth up to 100 gp. Lay out metal worth the same, coins included.", {log: "The ritual takes an hour."}));
  if(sub==="Order Domain") out.push(act("Order's Demand", "An action: each creature you choose within 30 feet that can see or hear you makes a WIS save (DC " + dc + ") or is charmed by you until the end of your next turn or until it takes damage. Any that fail can be made to drop what they hold.", {log: saveLog("WIS")}));
  if(sub==="Peace Domain") out.push(act("Balm of Peace", "An action: move up to your speed without provoking opportunity attacks. Each creature you pass within 5 feet of can regain this, once per use.",
    {roll: {qty: 2, die: 6, bonus: wis, label: "Balm of Peace: hit points regained"}, log: ""}));
  if(sub==="Death Domain") out.push(act("Touch of Death", "When you hit a creature with a melee attack: " + (5 + 2 * lv) + " extra necrotic damage.", {log: (5 + 2 * lv) + " extra necrotic damage."}));
  if(sub==="Arcana Domain"){
    var banish = destroyUndeadCr(lv);
    out.push(act("Arcane Abjuration", "An action: one celestial, elemental, fey or fiend within 30 feet that can see or hear you makes a WIS save (DC " + dc + ")" + turned + (banish ? " Off its home plane and CR " + banish + " or lower, it's banished for 1 minute instead." : ""), {log: saveLog("WIS")}));
  }
  if(sub==="Grave Domain") out.push(act("Path to the Grave", "An action: curse a creature you can see within 30 feet until the end of your next turn. The next hit on it by you or an ally deals double damage.", {log: "The next hit on that creature deals double damage."}));
  if(sub==="Fate Domain") out.push(act("Strands of Fate", "A bonus action, with your concentration for up to 1 minute: your reaction gives another creature's attack roll or ability check advantage or disadvantage.", {log: "Up to 1 minute, with your concentration."}));
  return out;
}
