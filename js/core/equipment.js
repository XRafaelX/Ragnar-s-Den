/* ---------------- Equipment ----------------
   Hands and equipping, weapon attack and damage numbers, and weapon and
   armor proficiency. */
import { RACE_DATA } from "../data/race-data.js";
import { WEAPON_DATA, weaponDataOf, baseWeaponName } from "../data/weapons.js";
import { featProficiencies, featDef, featSpellEntries, featCastAbility } from "./feat-picks.js";
import { characterPickedProfs, characterChoices, raceProficiencies, backgroundProficiencies, overlapTools } from "./class-picks.js";
import { mod, profBonus, parseDiceNotation, combineRolls } from "./basics.js";
import { barbarianClassEntry, barbarianRageDamage } from "./character-resources.js";
import { classFeatureList, classProficiencies, classLevelOf, classSpellAbility, classCasterType, usesVariant } from "./class-features.js";
import { songOfVictoryBonus, martialArtsDie } from "./effects.js";
import { hasFeat } from "./vitals.js";
import { holsterDamageBonus, coinAttackBonus, magicBonusOf } from "./magic-items.js";
import { abilityScore, abilityScores } from "./ability-scores.js";
import { conditionRolls } from "./conditions.js";
import { effectRolls, effectOn, BEAST_FORMS, elementalCleaver, weaponAttackEffect } from "./effects.js";
import { sharpenBonus } from "./monk.js";
import { sacredWeaponBonus, auraOfHate } from "./paladin.js";

/* Fighting styles live on the sheet as features tagged `fightingStyle`
   (see applyClassChoices), so deleting the feature removes its bonus. */
export function hasFightingStyle(c, style){
  return (c.features||[]).some(function(f){ return f.fightingStyle===style; });
}
export function isRangedWeapon(item){
  var d = weaponDataOf(item);
  return !!(d && d.ranged);
}

/* ---------------- Equipping: one armor, two hands ----------------
   A character wears at most one suit of armor and carries at most one
   shield, and has two hands: a shield takes one, a weapon takes one, a
   two-handed weapon takes both (a stack like "Dagger ×2" counts as one
   weapon in hand). */
function isBodyArmor(i){ return i.type==="armor" && i.category!=="shield"; }
function isShield(i){ return i.type==="armor" && i.category==="shield"; }
function isTwoHanded(item){
  var d = weaponDataOf(item);
  return /two-handed/i.test(((d && d.properties) || "") + " " + (item.notes || ""));
}
export function itemHands(item){
  if(isShield(item)) return 1;
  if(item.type==="weapon") return isTwoHanded(item) ? 2 : 1;
  return 0;
}
/* What's in the character's hands right now. */
export function handsInUse(c, except){
  var held = (c.inventory||[]).filter(function(i){ return i.equipped && i!==except && itemHands(i) > 0; });
  return {used: held.reduce(function(n, i){ return n + itemHands(i); }, 0), items: held};
}
/* Equip an item, following the rules above. Another suit of armor (or
   shield) comes off automatically; a weapon or shield that needs a hand
   you don't have is refused. Returns {ok, message}; nothing changes when
   ok is false. */
export function tryEquip(c, item){
  var swapped = [];
  if(isBodyArmor(item) || isShield(item)){
    var same = isBodyArmor(item) ? isBodyArmor : isShield;
    (c.inventory||[]).forEach(function(i){ if(i!==item && i.equipped && same(i)) swapped.push(i); });
  }
  var need = itemHands(item);
  if(need){
    var held = handsInUse(c, item).items.filter(function(i){ return swapped.indexOf(i)===-1; });
    var used = held.reduce(function(n, i){ return n + itemHands(i); }, 0);
    if(used + need > 2){
      var names = held.map(function(i){ return i.name; }).join(" and ");
      return {ok:false, message: need===2
        ? (item.name||"This weapon")+" needs both hands, but you're holding "+names+". Unequip "+(held.length>1 ? "them" : "it")+" first."
        : "Your hands are full ("+names+"). Unequip something first."};
    }
  }
  swapped.forEach(function(i){ i.equipped = false; delete i.shillelagh; });
  item.equipped = true;
  return {ok:true, message: swapped.length ? "Took off "+swapped.map(function(i){ return i.name; }).join(", ")+"." : ""};
}
/* Rule breaks in an existing inventory (older saves could equip freely);
   shown as a warning so the player can fix them. kind: "armor" | "hands". */
export function equipProblems(c){
  var eq = (c.inventory||[]).filter(function(i){ return i.equipped; });
  var out = [];
  var armor = eq.filter(isBodyArmor), shields = eq.filter(isShield);
  if(armor.length > 1) out.push({kind:"armor", text:"You can only wear one suit of armor. Unequip "+armor.slice(1).map(function(i){ return i.name; }).join(", ")+" (only "+armor[0].name+" counts toward AC)."});
  if(shields.length > 1) out.push({kind:"armor", text:"You can only carry one shield. Unequip "+shields.slice(1).map(function(i){ return i.name; }).join(", ")+"."});
  // Armor without proficiency (2014 rules): disadvantage on STR and DEX
  // checks, saves and attacks, and no spellcasting.
  armor.concat(shields).forEach(function(i){
    if(!isProficientWithArmor(c, i)) out.push({kind:"armor", text:"You aren't proficient with "+(i.name||"this armor")+": while you wear it you have disadvantage on ability checks, saving throws and attack rolls that use STR or DEX, and you can't cast spells."});
  });
  var hands = handsInUse(c);
  if(hands.used > 2) out.push({kind:"hands", text:"That's "+hands.used+" hands' worth of gear ("+hands.items.map(function(i){ return i.name; }).join(", ")+"). You only have two."});
  return out;
}
/* A legal starting loadout for a new character: the first suit of armor,
   then shield and weapons in list order while hands are free; the rest
   goes in the pack. */
export function autoEquipLoadout(items){
  var hands = 0, wearing = false, shield = false;
  items.forEach(function(i){
    if(i.type!=="weapon" && i.type!=="armor"){ i.equipped = false; return; }
    if(isBodyArmor(i)){ i.equipped = !wearing; wearing = true; return; }
    if(isShield(i) && shield){ i.equipped = false; return; }
    var need = itemHands(i);
    i.equipped = hands + need <= 2;
    if(i.equipped){ hands += need; if(isShield(i)) shield = true; }
  });
  return items;
}

/* ---------------- Weapon attack & damage bonuses ---------------- */
/* A monk weapon: a shortsword, or a simple melee weapon that isn't
   two-handed or heavy. */
export function isMonkWeapon(item){
  if(baseWeaponName(item)==="Shortsword") return true;
  var d = weaponDataOf(item);
  if(!d || d.category!=="simple" || d.ranged) return false;
  return !/two-handed|heavy/i.test(d.properties || "");
}
/* Dedicated Weapon (Tasha's, monk 2): one weapon the monk has chosen
   (item.dedicated) counts as a monk weapon. */
export function hasDedicatedWeapon(c){
  return (c.classes||[]).some(function(cl){ return cl.name==="Monk" && usesVariant(cl, "Dedicated Weapon"); });
}
/* Why this weapon can't be the dedicated one, or "": it must be a simple
   or martial weapon you're proficient with, without heavy or special. */
export function dedicateProblem(item){
  var d = weaponDataOf(item);
  if(!d || (d.category!=="simple" && d.category!=="martial")) return "It must be a simple or martial weapon.";
  if(!item.proficient) return "You must be proficient with it.";
  var heavy = /heavy/i.test(d.properties || ""), special = /special/i.test(d.properties || "");
  if(heavy || special) return "It can't have the " + (heavy ? "heavy" : "special") + " property.";
  return "";
}
/* Make `item` the dedicated weapon (only one at a time), or stop. */
export function setDedicatedWeapon(c, item, on){
  (c.inventory||[]).forEach(function(i){ if(i.dedicated) delete i.dedicated; });
  if(on) item.dedicated = true;
}
/* Martial Arts: a monk wearing no armor and holding no shield can use DEX
   instead of STR with monk weapons, a Kensei's chosen weapons and a
   Dedicated Weapon included. */
export function martialArtsApplies(c, item){
  if(!(c.classes||[]).some(function(cl){ return cl.name==="Monk"; })) return false;
  if(!isMonkWeaponFor(c, item)) return false;
  return !(c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped; });
}
export function isMonkWeaponFor(c, item){
  var dedicated = item.dedicated && hasDedicatedWeapon(c) && !dedicateProblem(item);
  return isMonkWeapon(item) || !!dedicated || characterPickedProfs(c).monkWeapons.indexOf(baseWeaponName(item))!==-1;
}
/* The damage dice a weapon rolls: its own, or the Martial Arts die when
   that's bigger ("You can roll a d4 in place of the normal damage of your
   unarmed strike or monk weapon", growing with monk level). {qty, die,
   martialArts} or null when the item has no dice. */
export function weaponDamageDice(c, item){
  var own = parseDiceNotation(item.damageDice);
  if(!own) return null;
  // Shillelagh: the weapon's damage die becomes a d8.
  if(own.qty===1 && own.die < 8 && shillelaghOn(c, item)) own = {qty: 1, die: 8};
  if(martialArtsApplies(c, item)){
    var ma = martialArtsDie(c);
    if(ma * 1 > own.qty * own.die) return {qty: 1, die: ma, martialArts: true};
  }
  return {qty: own.qty, die: own.die, martialArts: false};
}
/* An unarmed strike (Basic Rules: you are proficient with it, and it deals
   1 + STR bludgeoning), shown for characters who make something of it: a
   race with natural weapons (a tabaxi's claws: 1d4 + STR slashing), Tavern
   Brawler (a d4), the Unarmed Fighting style (a d6, a d8 with nothing in
   hand; `grappleDie` its 1d4 to a grappled creature), and a monk, whose
   Martial Arts die and DEX apply while wearing no armor and holding no
   shield. Null for everyone else.
   {name, attack, die (0 for the flat 1), bonus, type, ability, roll,
   parts (what shaped it, for the card)}. */
export function unarmedStrike(c){
  var nat = RACE_DATA[c.race] && RACE_DATA[c.race].unarmed;
  var monk = (c.classes||[]).some(function(cl){ return cl.name==="Monk"; });
  var brawler = hasFeat(c, "Tavern Brawler");
  var styled = hasFightingStyle(c, "Unarmed Fighting");
  if(!nat && !monk && !brawler && !styled) return null;
  var ab = abilityScores(c), str = mod(ab.str), dex = mod(ab.dex);
  var die = 0, name = "Unarmed strike", type = "Bludgeoning", parts = [];
  if(nat){ die = nat.die; name = nat.name + " (unarmed strike)"; type = nat.type; parts.push(c.race + " " + nat.name.toLowerCase()); }
  if(brawler && die < 4){ die = 4; parts.push("Tavern Brawler"); }
  // Unarmed Fighting: 1d6 bludgeoning, or 1d8 when wielding no weapon
  // and no shield at the attack roll.
  if(styled){
    var holding = (c.inventory||[]).some(function(i){ return i.equipped && (i.type==="weapon" || isShield(i)); });
    var sd = holding ? 6 : 8;
    if(sd > die){ die = sd; name = "Unarmed strike"; type = "Bludgeoning"; }
    parts.push("Unarmed Fighting d" + sd + (holding ? " (d8 with no weapon or shield in hand)" : ""));
  }
  var abilityMod = str, ability = "STR";
  // A dhampir's bite uses Constitution in place of Strength.
  if(nat && nat.ability==="con" && die===nat.die){ abilityMod = mod(ab.con); ability = "CON"; }
  var armored = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped; });
  if(monk && !armored){
    var ma = martialArtsDie(c);
    if(ma > die){ die = ma; }
    parts.push("Martial Arts d" + ma);
    if(dex > abilityMod){ abilityMod = dex; ability = "DEX"; }
  }
  // Ki-Empowered Strikes (monk 6): they count as magical.
  if(monk && classLevelOf(c, "Monk") >= 6) parts.push("Magic");
  var bonus = abilityMod + holsterDamageBonus(c) + auraOfHate(c);
  // Rage: melee weapon attacks with STR, not in heavy armor.
  var barb = barbarianClassEntry(c);
  var heavy = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; });
  if(c.rage && c.rage.active && barb && !heavy && ability==="STR") bonus += barbarianRageDamage(Number(barb.level)||1);
  bonus += songOfVictoryBonus(c, {name: "Unarmed strike"});
  return {name: name, attack: abilityMod + profBonus(c), die: die, bonus: bonus, type: type, ability: ability,
    roll: combineRolls([armorPenalty(c, ability.toLowerCase()), ability==="STR" && effectOn(c, "reckless_attack") ? {mode: "adv", reason: "Reckless Attack"} : null,
      effectOn(c, "shadow_step") ? {mode: "adv", reason: "Shadow Step"} : null, weaponAttackEffect(c)]
      .concat(conditionRolls(c, "attack"), effectRolls(c, "attack"))), parts: parts, grappleDie: styled ? 4 : 0};
}
/* ---------------- Shillelagh ----------------
   A club or quarterstaff you hold becomes magical, uses your spellcasting
   ability for its attack and damage rolls and has a d8 damage die. It
   lasts a minute, ends if you let go of the weapon, and a rest or dropping
   to 0 hit points ends it too (see endAllEffects). `shillelagh` on the item
   is the player's switch. */
/* The spellcasting abilities the character has for Shillelagh (the
   cantrip on the sheet, from its class, or one a feat teaches), [] if they
   don't know it. */
export function shillelaghAbilities(c){
  var out = [];
  var sp = (c.spells||[]).find(function(x){ return (x.name||"").trim().toLowerCase()==="shillelagh"; });
  if(sp){
    var cls = null;
    if(sp.learnedBy) cls = (c.classes||[]).find(function(x){ return x.name===sp.learnedBy; });
    if(!cls){
      var casters = (c.classes||[]).filter(function(x){ return classCasterType(x); });
      cls = casters.find(function(x){ return x.name==="Druid"; }) || casters[0];
    }
    var ab = cls && classSpellAbility(cls);
    if(ab && out.indexOf(ab)===-1) out.push(ab);
  }
  (c.feats||[]).forEach(function(feat){
    var def = featDef(feat.name);
    if(!def || !featSpellEntries(def, feat.picks||{}).some(function(e){ return e.name==="Shillelagh"; })) return;
    var ab = featCastAbility(c, def, feat.picks||{});
    if(ab && out.indexOf(ab)===-1) out.push(ab);
  });
  return out;
}
/* A club or quarterstaff the character can cast Shillelagh on. */
export function canShillelagh(c, item){
  if(!item || item.type!=="weapon") return false;
  var base = baseWeaponName(item);
  return (base==="Club" || base==="Quarterstaff") && shillelaghAbilities(c).length > 0;
}
/* Shillelagh is on this weapon: it's in hand and the spell is still known.
   (Letting go of it, or forgetting the cantrip, ends it.) */
export function shillelaghOn(c, item){
  if(!item || !item.shillelagh) return false;
  if(!(item.equipped && canShillelagh(c, item))){ delete item.shillelagh; return false; }
  return true;
}
/* Cast Shillelagh on this weapon, or end it. It only lasts on one weapon. */
export function setShillelagh(c, item, on){
  (c.inventory||[]).forEach(function(i){ delete i.shillelagh; });
  if(on && canShillelagh(c, item)) item.shillelagh = true;
}

/* The abilities a weapon attack may use and the best modifier among
   them: {mod, keys}, `keys` being every ability that reaches it (on a tie
   the player picks, so a Battle Ready artificer with INT equal to STR can
   attack with INT and dodge armor's STR penalty, or with STR for rage). */
export function weaponAbility(c, item){
  var ab = abilityScores(c);
  var allowed = item.ability==="dex" ? ["dex"] : item.ability==="finesse" ? ["str", "dex"] : ["str"];
  if(martialArtsApplies(c, item) || revenantBladeApplies(c, item)) allowed = ["str", "dex"];
  // Shillelagh: the spellcasting ability can stand in for Strength.
  if(shillelaghOn(c, item)) shillelaghAbilities(c).forEach(function(k){ if(allowed.indexOf(k)===-1) allowed.push(k); });
  // A feature tagged `magicWeaponAbility` lets magic weapons (see
  // isMagicWeapon) use that ability instead, when it's higher; one tagged
  // `chosenWeaponAbility` does the same for the weapon marked `chosenWeapon`.
  var isMagic = isMagicWeapon(c, item);
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      if(f.magicWeaponAbility && isMagic) allowed.push(f.magicWeaponAbility);
      if(f.chosenWeaponAbility && item.chosenWeapon) allowed.push(f.chosenWeaponAbility);
    });
  });
  var best = Math.max.apply(null, allowed.map(function(k){ return mod(ab[k]); }));
  return {mod: best, keys: allowed.filter(function(k, i){ return allowed.indexOf(k)===i && mod(ab[k])===best; })};
}
export function weaponAbilityMod(c, item){ return weaponAbility(c, item).mod; }
/* Revenant Blade: a double-bladed scimitar has the finesse property when
   the character wields it. */
export function revenantBladeApplies(c, item){
  return item.type==="weapon" && baseWeaponName(item)==="Double-Bladed Scimitar" && hasFeat(c, "Revenant Blade");
}
/* A double-bladed scimitar's other blade: after attacking with it as part
   of the Attack action, a bonus action attack that deals 1d4 slashing in
   place of 2d4 (the weapon's usual damage bonus still applies; this is
   not two-weapon fighting). Only while it's equipped. {dice, damage} or null. */
export function otherBladeAttack(c, item){
  if(item.type!=="weapon" || baseWeaponName(item)!=="Double-Bladed Scimitar" || !item.equipped) return null;
  return {dice: "1d4", damage: weaponDamageBonus(c, item)};
}
/* The feature (if any) that lets this character mark one weapon to attack
   with a different ability, e.g. Hex Warrior (CHA). */
export function chosenWeaponFeature(c){
  var found = null;
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){ if(!found && f.chosenWeaponAbility) found = f; });
  });
  return found;
}
/* A magic weapon: marked magic on the sheet (a Flame Tongue, a +0
   weapon), with a magic bonus, or holding an active artificer infusion. */
export function isMagicWeapon(c, item){
  if(item.magic || magicBonusOf(item) > 0 || shillelaghOn(c, item) || sacredWeaponBonus(c, item) > 0) return true;
  var active = c.infusions && c.infusions.active || [];
  return !!item.id && active.some(function(a){ return a.itemId===item.id; });
}
/* The feat that lets this weapon trade -5 to hit for +10 damage:
   Great Weapon Master for a heavy melee weapon, Sharpshooter for a ranged
   one, both only with weapons you're proficient with. Null if neither. */
export function powerAttackFeat(c, item){
  if(!item.proficient) return null;
  if(isRangedWeapon(item)) return hasFeat(c, "Sharpshooter") ? "Sharpshooter" : null;
  var d = weaponDataOf(item);
  var heavy = /\bheavy\b/i.test(((d && d.properties) || "") + " " + (item.notes || ""));
  return heavy && hasFeat(c, "Great Weapon Master") ? "Great Weapon Master" : null;
}
/* The weapon's -5/+10 switch is on (and its feat still applies). */
export function powerAttackOn(c, item){
  return !!item.powerAttack && !!powerAttackFeat(c, item);
}
export function weaponAttackBonus(c, item){
  var pb = item.proficient ? profBonus(c) : 0;
  var archery = isRangedWeapon(item) && hasFightingStyle(c, "Archery") ? 2 : 0;
  return weaponAbilityMod(c, item) + pb + magicBonusOf(item) + sharpenBonus(c, item) + sacredWeaponBonus(c, item) + archery - (powerAttackOn(c, item) ? 5 : 0) + coinAttackBonus(c);
}
export function weaponDamageBonus(c, item){
  return weaponAbilityMod(c, item) + magicBonusOf(item) + sharpenBonus(c, item) + auraOfHate(c, item) + (powerAttackOn(c, item) ? 10 : 0) + songOfVictoryBonus(c, item) + rageDamageBonus(c, item) + duelingBonus(c, item) + sidearmMasteryBonus(c, item) + holsterDamageBonus(c)
    + (isRangedWeapon(item) ? thrownStyleBonus(c, item) : 0);
}
/* A weapon with the thrown property (a dagger, a handaxe, a dart). */
export function isThrownWeapon(item){
  var d = weaponDataOf(item);
  return item.type==="weapon" && /\bthrown\b/i.test(((d && d.properties) || "") + " " + (item.notes || ""));
}
/* Thrown Weapon Fighting: +2 damage when you hit with a ranged attack
   using a thrown weapon. */
function thrownStyleBonus(c, item){
  return isThrownWeapon(item) && hasFightingStyle(c, "Thrown Weapon Fighting") ? 2 : 0;
}
/* Throwing a melee weapon (a handaxe, a javelin) makes a ranged attack:
   Archery's +2 to hit and Thrown Weapon Fighting's +2 damage apply, a
   barbarian's rage damage doesn't (melee only). {attack, damage, parts}
   when that differs from the melee numbers, else null (a dart, being a
   ranged weapon, already shows its thrown numbers). */
export function thrownAttack(c, item){
  // (Elemental Cleaver's weapon gains the thrown property while raging.)
  if(!(isThrownWeapon(item) || elementalCleaver(c, item)) || isRangedWeapon(item)) return null;
  var archery = hasFightingStyle(c, "Archery") ? 2 : 0;
  var style = thrownStyleBonus(c, item), rage = rageDamageBonus(c, item);
  // Giant's Havoc's Crushing Throw (giant 3): rage damage on thrown attacks too.
  if(rage && classLevelOf(c, "Barbarian", "Path of the Giant") >= 3) rage = 0;
  if(!archery && !style && !rage) return null;
  var parts = [];
  if(archery) parts.push("Archery +2 to hit");
  if(style) parts.push("Thrown Weapon Fighting +2 damage");
  if(rage) parts.push("no rage damage (a ranged attack)");
  return {attack: weaponAttackBonus(c, item) + archery, damage: weaponDamageBonus(c, item) - rage + style, parts: parts};
}
/* Two-weapon fighting (Basic Rules): attacking with a light melee weapon
   in one hand, a bonus action attacks with a different light melee weapon
   in the other, adding no ability modifier to its damage unless the
   modifier is negative; the Two-Weapon Fighting style adds it. Dual
   Wielder lifts "light" (one-handed weapons still). Two separate equipped
   weapons are needed: a stack ("Dagger ×2") is one weapon in hand. For
   `item`, when it's the off-hand weapon (see dualWieldHands): {damage,
   style}, else null. */
function offHandCapable(c, item){
  if(item.type!=="weapon" || !item.equipped || isRangedWeapon(item) || isTwoHanded(item)) return false;
  var d = weaponDataOf(item);
  return /\blight\b/i.test(((d && d.properties) || "") + " " + (item.notes || "")) || hasFeat(c, "Dual Wielder");
}
/* With two such weapons in hand, one is the main hand (its card rolls the
   Attack action's damage) and the other the off-hand (its card rolls the
   bonus action's). The player's pick is kept as `offHand` on the item;
   until they pick, the weapon with less average damage is the off-hand.
   {main, off} or null when not wielding two. */
export function dualWieldHands(c){
  var pair = (c.inventory||[]).filter(function(i){ return offHandCapable(c, i); });
  if(pair.length!==2) return null;
  if(pair[0].offHand!==pair[1].offHand) return pair[0].offHand ? {main: pair[1], off: pair[0]} : {main: pair[0], off: pair[1]};
  function avg(i){ var d = weaponDamageDice(c, i); return (d ? d.qty * (d.die + 1) / 2 : 0) + weaponDamageBonus(c, i); }
  return avg(pair[1]) > avg(pair[0]) ? {main: pair[1], off: pair[0]} : {main: pair[0], off: pair[1]};
}
/* Swap which weapon is in the off-hand. */
export function swapHands(c){
  var hands = dualWieldHands(c);
  if(!hands) return;
  delete hands.off.offHand;
  hands.main.offHand = true;
}
export function offHandAttack(c, item){
  var hands = dualWieldHands(c);
  if(!hands || hands.off!==item) return null;
  var ab = weaponAbilityMod(c, item);
  var style = hasFightingStyle(c, "Two-Weapon Fighting");
  return {damage: weaponDamageBonus(c, item) - (style || ab < 0 ? 0 : ab), style: style};
}
/* Dueling: +2 damage with a melee weapon held in one hand while no other
   weapon is held (a shield or a free hand is fine). Judged against what
   is equipped now, so a second weapon in hand turns it off; a stack like
   "Dagger ×2" is one weapon in hand, as for the hands count. */
export function duelingBonus(c, item){
  if(item.type!=="weapon" || isRangedWeapon(item) || isTwoHanded(item)) return 0;
  if(!hasFightingStyle(c, "Dueling")) return 0;
  var other = (c.inventory||[]).some(function(i){ return i!==item && i.equipped && i.type==="weapon"; });
  return other ? 0 : 2;
}
/* Sidearm Mastery: +2 damage with a firearm held in one hand while no other
   weapon is held, judged like Dueling's. */
export function sidearmMasteryBonus(c, item){
  var d = weaponDataOf(item);
  if(item.type!=="weapon" || !d || d.category!=="firearm" || isTwoHanded(item)) return 0;
  if(!hasFeat(c, "Sidearm Mastery")) return 0;
  var other = (c.inventory||[]).some(function(i){ return i!==item && i.equipped && i.type==="weapon"; });
  return other ? 0 : 2;
}
/* Rage: + rage damage to melee weapon attacks that use STR, while raging
   and not in heavy armor. */
export function rageDamageBonus(c, item){
  if(!c.rage || !c.rage.active || isRangedWeapon(item)) return 0;
  var barb = barbarianClassEntry(c);
  if(!barb) return 0;
  if((c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; })) return 0;
  if(weaponAbility(c, item).keys.indexOf("str")===-1) return 0; // rage needs a STR attack
  return barbarianRageDamage(Number(barb.level)||1);
}
/* Divine Fury (Path of the Zealot, barbarian 3): while raging, the first
   creature you hit with a weapon attack on each of your turns takes an
   extra 1d6 + half your barbarian level, of the type picked (radiant or
   necrotic; "" while not picked yet). Any weapon attack, ranged or not,
   heavy armor or not. {bonus, type} or null. */
export function divineFury(c){
  if(!c.rage || !c.rage.active) return null;
  var barb = barbarianClassEntry(c), lv = barb ? Number(barb.level)||1 : 0;
  if(!barb || barb.subclass!=="Path of the Zealot" || lv < 3) return null;
  return {bonus: Math.floor(lv / 2), type: characterChoices(c, "divineFury")[0] || ""};
}
/* Natural weapons and armor spikes some barbarians attack with, shaped
   like an unarmed strike for its card: Form of the Beast's bite, claws or
   tail while raging (beast 3; magical from 6), and a Battlerager's armor
   spikes while raging in spiked armor (a bonus action, 1d4 piercing). STR
   for attack and damage, with rage damage. [] when there are none. */
export function barbarianNaturalWeapons(c){
  var out = [];
  if(!(c.rage && c.rage.active)) return out;
  var barb = barbarianClassEntry(c);
  if(!barb) return out;
  var str = mod(abilityScore(c, "str")), pb = profBonus(c), rage = barbarianRageDamage(Number(barb.level)||1);
  var roll = combineRolls([armorPenalty(c, "str"), effectOn(c, "reckless_attack") ? {mode: "adv", reason: "Reckless Attack"} : null, weaponAttackEffect(c)]
    .concat(conditionRolls(c, "attack"), effectRolls(c, "attack")));
  var form = barb.subclass==="Path of the Beast" && c.rage.beast && BEAST_FORMS[c.rage.beast];
  if(form) out.push({name: c.rage.beast, beast: c.rage.beast, attack: str + pb, die: form.die, bonus: str + rage, type: form.type, ability: "STR",
    roll: roll, parts: ["Form of the Beast"].concat((Number(barb.level)||1) >= 6 ? ["magical"] : [])});
  var spiked = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && /spiked armor/i.test(i.name||""); });
  if(barb.subclass==="Path of the Battlerager" && spiked) out.push({name: "Armor spikes", spikes: true, attack: str + pb, die: 4, bonus: str + rage, type: "Piercing", ability: "STR",
    roll: roll, parts: ["Bonus action", "a grapple you win also deals 3 piercing"]});
  return out;
}
/* The lowest d20 roll that's a critical hit with this attack: 20, 19
   with a Champion's Improved Critical (fighter 3), 18 with Superior
   Critical (15), 19 with a firearm for a Gunslinger's Vicious Intent (18). */
export function critRange(c, item){
  var champ = classLevelOf(c, "Fighter", "Champion");
  var min = champ >= 15 ? 18 : champ >= 3 ? 19 : 20;
  // Invincible Conqueror: melee weapon attacks crit on 19 or 20.
  if(effectOn(c, "invincible_conqueror") && !(item && isRangedWeapon(item))) min = Math.min(min, 19);
  if(item && isFirearm(item) && classLevelOf(c, "Fighter", "Gunslinger") >= 18) min = Math.min(min, 19);
  return min;
}
export function isFirearm(item){
  var d = weaponDataOf(item);
  return !!(item && item.type==="weapon" && d && d.category==="firearm");
}
/* A firearm's misfire and reload scores (the Gunslinger's rules): from its
   properties ("reload 4 ... misfire 1"), +1 misfire without proficiency.
   {misfire, reload} or null for any other weapon. */
export function firearmStats(item){
  if(!isFirearm(item)) return null;
  var props = (weaponDataOf(item).properties || "") + " " + (item.notes || "");
  var mf = /misfire (\d+)/i.exec(props), rl = /reload (\d+)/i.exec(props);
  return {misfire: (mf ? Number(mf[1]) : 1) + (item.proficient===false ? 1 : 0), reload: rl ? Number(rl[1]) : 1};
}
/* How many attacks the Attack action makes: 2 with any Extra Attack
   feature, 3 for a fighter 11 and 4 for a fighter 20. */
export function attacksPerAction(c){
  var n = 1;
  (c.classes||[]).forEach(function(cl){
    var lv = Number(cl.level)||1;
    if(cl.name==="Fighter") n = Math.max(n, lv >= 20 ? 4 : lv >= 11 ? 3 : lv >= 5 ? 2 : 1);
    if(classFeatureList(cl).some(function(f){ return f.name==="Extra Attack"; })) n = Math.max(n, 2);
  });
  // Invincible Conqueror and Dread Ambusher's first turn: one more.
  return n + (effectOn(c, "invincible_conqueror") ? 1 : 0) + (effectOn(c, "dread_ambusher") ? 1 : 0);
}
/* Every tool the character is proficient with, in the Information tab's
   order: classes, race, background, a tool picked in place of one given
   twice, feats. */
export function characterToolProfs(c){
  var tools = [];
  function add(v){ if(v && tools.indexOf(v)===-1) tools.push(v); }
  (c.classes||[]).forEach(function(cl, idx){ var p = classProficiencies(c, idx); ((p && p.tools)||[]).forEach(add); });
  raceProficiencies(c).tools.forEach(add);
  backgroundProficiencies(c).tools.forEach(add);
  overlapTools(c).forEach(add);
  featProficiencies(c).tools.forEach(function(p){ add(p.name); });
  return tools;
}
/* A misfired firearm's repair: a tinker's tools check against DC 8 + its
   misfire score. The Gunslinger's rules don't name the ability, so the
   better of INT and DEX is used, with proficiency when the character has
   tinker's tools. {dc, bonus, ability}. */
export function firearmRepair(c, item){
  var gun = firearmStats(item);
  if(!gun) return null;
  var intMod = mod(abilityScore(c, "int")), dexMod = mod(abilityScore(c, "dex"));
  var prof = characterToolProfs(c).some(function(t){ return /tinker/i.test(t); }) ? profBonus(c) : 0;
  return {dc: 8 + gun.misfire, bonus: Math.max(intMod, dexMod) + prof, ability: intMod >= dexMod ? "INT" : "DEX", proficient: !!prof};
}
/* Psi Warrior (fighter 3): the Psionic Energy die (d6, d8 from 5, d10 from
   11, d12 from 17) and Psionic Strike's roll: that die + INT force, for a
   die. {die, bonus, key, used, left, thrustDc (Telekinetic Thrust, 7)}
   or null. */
export function psionicDie(c){
  var lv = classLevelOf(c, "Fighter", "Psi Warrior");
  return lv >= 17 ? 12 : lv >= 11 ? 10 : lv >= 5 ? 8 : lv >= 3 ? 6 : 0;
}
export function psionicStrike(c){
  var die = psionicDie(c);
  if(!die) return null;
  var key = "Fighter:psionic_energy_dice", max = profBonus(c) * 2, used = Math.min(max, Number((c.resourcesUsed||{})[key])||0);
  var int = mod(abilityScore(c, "int"));
  return {die: die, bonus: int, key: key, used: used, left: max - used,
    thrustDc: classLevelOf(c, "Fighter", "Psi Warrior") >= 7 ? 8 + profBonus(c) + int : 0};
}
/* Magic Arrow (Arcane Archer 7): a shortbow's or longbow's arrows count as magical. */
export function magicArrows(c, item){
  return classLevelOf(c, "Fighter", "Arcane Archer") >= 7 && /^(Shortbow|Longbow)$/.test(baseWeaponName(item) || "");
}
/* A Soulknife's Psionic Energy die (d6, d8 from 5, d10 from 11, d12 from
   17) and the pool: {die, key, used, left} or null. */
export function soulknifeDie(c){
  var lv = classLevelOf(c, "Rogue", "Soulknife");
  if(lv < 3) return null;
  var key = "Rogue:psionic_energy_dice", max = profBonus(c) * 2, used = Math.min(max, Number((c.resourcesUsed||{})[key])||0);
  return {die: lv >= 17 ? 12 : lv >= 11 ? 10 : lv >= 5 ? 8 : 6, key: key, used: used, left: max - used};
}
/* A Sun Soul's Radiant Sun Bolt (monk 3), shaped like an unarmed strike
   for its card: a ranged spell attack, 30 feet, DEX, the Martial Arts die
   of radiant. [] or [bolt]. */
export function sunBolts(c){
  if(classLevelOf(c, "Monk", "Way of the Sun Soul") < 3) return [];
  var dex = mod(abilityScore(c, "dex"));
  return [{name: "Radiant Sun Bolt", ranged: true, attack: dex + profBonus(c), die: martialArtsDie(c), bonus: dex, type: "Radiant", ability: "DEX",
    roll: combineRolls(conditionRolls(c, "attack").concat(effectRolls(c, "attack"))), parts: ["ranged spell attack, 30 ft", "with the Attack action"]}];
}
/* Sneak Attack (rogue 1): the d6s once per turn (half the rogue level,
   rounded up), with a finesse or ranged weapon (or a Soulknife's psychic
   blade). Eye for Weakness (Inquisitive 17) adds 3d6 while Insightful
   Fighting is on. {dice, eye} or null. */
export function sneakAttack(c){
  var lv = classLevelOf(c, "Rogue");
  if(!lv) return null;
  var eye = classLevelOf(c, "Rogue", "Inquisitive") >= 17 && effectOn(c, "insightful_fighting") ? 3 : 0;
  return {dice: Math.ceil(lv / 2) + eye, eye: eye};
}
export function sneakAttackWeapon(item){
  if(!item || item.psychicBlade) return !!item;
  if(item.type!=="weapon") return false;
  var d = weaponDataOf(item);
  return isRangedWeapon(item) || item.ability==="finesse" || !!(d && d.finesse) || /\bfinesse\b/i.test(item.notes || "");
}
/* A Soulknife's psychic blades (rogue 3), shaped like an unarmed strike
   for their card: a simple melee weapon with finesse and thrown (60 ft),
   1d6 psychic plus the better of STR and DEX, proficient. [] or [blade]. */
export function psychicBlades(c){
  if(classLevelOf(c, "Rogue", "Soulknife") < 3) return [];
  var str = mod(abilityScore(c, "str")), dex = mod(abilityScore(c, "dex")), best = Math.max(str, dex);
  return [{name: "Psychic blade", psychicBlade: true, attack: best + profBonus(c), die: 6, bonus: best, type: "Psychic", ability: dex >= str ? "DEX" : "STR",
    roll: combineRolls([armorPenalty(c, dex >= str ? "dex" : "str")].concat(conditionRolls(c, "attack"), effectRolls(c, "attack"))),
    parts: ["finesse, thrown (60 ft)", "magic"], secondDie: 4}];
}
/* Phantom (rogue 9): soul trinkets held (c.soulTrinkets, up to the
   proficiency bonus). {held, max} or null. */
export function soulTrinkets(c){
  if(classLevelOf(c, "Rogue", "Phantom") < 9) return null;
  var max = profBonus(c);
  return {held: Math.max(0, Math.min(max, Number(c.soulTrinkets)||0)), max: max};
}
/* Wails from the Grave (Phantom 3): half the Sneak Attack dice for the
   level (rounded up) of necrotic to a second creature, both with Death's
   Friend (17). {dice, both, usesLeft, key, trinkets} or null. */
export function wailsFromTheGrave(c){
  var lv = classLevelOf(c, "Rogue", "Phantom"), rogue = classLevelOf(c, "Rogue");
  if(lv < 3) return null;
  var key = "Rogue:wails_from_the_grave", max = profBonus(c), used = Math.min(max, Number((c.resourcesUsed||{})[key])||0);
  var t = soulTrinkets(c);
  return {dice: Math.ceil(Math.ceil(rogue / 2) / 2), both: lv >= 17, key: key, used: used, usesLeft: max - used, trinkets: t ? t.held : 0};
}
/* Gunslinger (fighter 18): Vicious Intent and Hemorrhaging Critical. */
export function viciousIntent(c){ return classLevelOf(c, "Fighter", "Gunslinger") >= 18; }
export function hemorrhagingCritical(c){ return classLevelOf(c, "Fighter", "Gunslinger") >= 18; }
/* A grit point back (one spent, up to the most). True if one came back. */
export function regainGrit(c){
  var key = "Fighter:grit_points", used = Number((c.resourcesUsed||{})[key])||0;
  if(!used) return false;
  c.resourcesUsed[key] = used - 1;
  return true;
}
/* Brutal Critical (barbarian 9): extra weapon damage dice on a critical
   hit with a melee attack, 1 die at 9, 2 at 13, 3 at 17. */
export function brutalCriticalDice(c){
  var lv = classLevelOf(c, "Barbarian");
  return lv >= 17 ? 3 : lv >= 13 ? 2 : lv >= 9 ? 1 : 0;
}
/* A critical hit's damage: the attack's dice twice, Brutal Critical's
   extra dice on a melee attack, the bonus once. hit = {qty, die, bonus,
   melee}. {qty, die, bonus, brutal}. */
export function criticalDamage(c, hit){
  var brutal = hit.melee ? brutalCriticalDice(c) : 0;
  return {qty: hit.qty * 2 + brutal, die: hit.die, bonus: hit.bonus, brutal: brutal};
}
/* Fanatical Focus (Path of the Zealot, barbarian 6): while raging, a
   failed saving throw can be rerolled, once per rage (c.rage.fanatical
   is set when it's used; entering a rage clears it). */
export function fanaticalFocusReady(c){
  return !!(c.rage && c.rage.active) && classLevelOf(c, "Barbarian", "Path of the Zealot") >= 6 && !c.rage.fanatical;
}
/* Indomitable Might (barbarian 18): a Strength check's total below the
   Strength score becomes the score. The score, or 0 without the feature. */
export function indomitableMight(c){
  return classLevelOf(c, "Barbarian") >= 18 ? abilityScore(c, "str") : 0;
}
/* Blessed Strikes (Tasha's, cleric 8, in place of the domain's Divine
   Strike or Potent Spellcasting): 1d8 radiant once per turn when a
   cantrip or weapon attack damages a creature. */
export function hasBlessedStrikes(c){
  return (c.classes||[]).some(function(cl){ return cl.name==="Cleric" && usesVariant(cl, "Blessed Strikes"); });
}
/* Unwavering Mark (Cavalier, fighter 3): the bonus action attack against
   a marked creature that damaged someone else, with a melee weapon in
   hand. Advantage on the attack and + half the fighter level to its
   damage. {extra} or null. */
export function unwaveringMark(c, item){
  if(item.type!=="weapon" || !item.equipped || isRangedWeapon(item)) return null;
  var lv = classLevelOf(c, "Fighter", "Cavalier");
  return lv >= 3 ? {extra: Math.floor(lv / 2)} : null;
}
/* Ferocious Charger (Cavalier, fighter 15): the STR save DC against being
   knocked prone, or 0 without it. STR or DEX, whichever is higher, is a
   DM-approved change (the book says STR). */
export function ferociousChargerDc(c){
  if(classLevelOf(c, "Fighter", "Cavalier") < 15) return 0;
  return 8 + profBonus(c) + Math.max(mod(abilityScore(c, "str")), mod(abilityScore(c, "dex")));
}
/* A melee weapon or a shield in hand (Warding Maneuver needs one). */
export function wieldsMeleeWeaponOrShield(c){
  return (c.inventory||[]).some(function(i){
    return i.equipped && ((i.type==="weapon" && !isRangedWeapon(i)) || (i.type==="armor" && i.category==="shield"));
  });
}
/* Best-effort default for a newly added weapon's Proficient checkbox:
   true if any of the character's classes list the weapon's category
   ("Simple weapons"/"Martial weapons"/"Firearms") or name it specifically,
   or the race or a feat gives it. */
export function isProficientWithWeapon(c, weaponName, category){
  // Weapon Master's picks, and Gunner's firearms.
  if(featProficiencies(c).weapons.some(function(w){ return (weaponName && w.name===weaponName) || (category==="firearm" && w.name==="Firearms"); })) return true;
  // The race's weapon training (an elf's longbow, a hobgoblin's picks, a
  // giff's firearms).
  var raceWeapons = raceProficiencies(c).weapons;
  if(weaponName && raceWeapons.indexOf(weaponName)!==-1) return true;
  if(category==="firearm" && raceWeapons.indexOf("Firearms")!==-1) return true;
  return (c.classes||[]).some(function(cl, idx){
    var p = classProficiencies(c, idx);
    if(!p || !p.weapons) return false;
    return p.weapons.some(function(w){
      var wl = w.toLowerCase();
      if(category==="simple" && wl==="simple weapons") return true;
      if(category==="martial" && wl==="martial weapons") return true;
      if(category==="firearm" && wl==="firearms") return true;
      return weaponName && wl.indexOf(weaponName.toLowerCase()) !== -1;
    });
  });
}
/* ---------------- Armor proficiency and Stealth ---------------- */
/* Armor proficiencies, lowercased ("light armor", "shields"): each class's
   list (multiclass lists after the first), features' grants, feats and
   the race's armor training. */
export function armorProficiencies(c){
  var out = [];
  function add(v){ v = (v||"").toLowerCase(); if(v && out.indexOf(v)===-1) out.push(v); }
  (c.classes||[]).forEach(function(cl, idx){
    var p = classProficiencies(c, idx);
    (p && p.armor || []).forEach(add);
  });
  featProficiencies(c).armor.forEach(function(a){ add(a.name); });
  var race = RACE_DATA[c.race];
  (race && race.armorProfs || []).forEach(add);
  return out;
}
export function isProficientWithArmor(c, item){
  var profs = armorProficiencies(c);
  if(item.category==="shield") return profs.some(function(p){ return p.indexOf("shield")!==-1; });
  return profs.indexOf("all armor")!==-1 || profs.indexOf((item.category||"") + " armor")!==-1;
}
/* Armor or a shield worn without proficiency (2014 rules): disadvantage
   on any ability check, saving throw or attack roll that uses STR or DEX.
   The first such item, or null. */
export function unproficientArmor(c){
  return (c.inventory||[]).find(function(i){ return i.type==="armor" && i.equipped && !isProficientWithArmor(c, i); }) || null;
}
export function armorPenalty(c, ability){
  if(ability!=="str" && ability!=="dex") return null;
  var item = unproficientArmor(c);
  return item ? {mode: "dis", reason: "Not proficient with " + (item.name || "your armor")} : null;
}
