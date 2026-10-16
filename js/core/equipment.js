/* ---------------- Equipment ----------------
   Hands and equipping, weapon attack and damage numbers, and weapon and
   armor proficiency. */
import { RACE_DATA } from "../data/race-data.js";
import { WEAPON_DATA } from "../data/weapons.js";
import { featProficiencies } from "./feat-picks.js";
import { characterPickedProfs, raceProficiencies } from "./class-picks.js";
import { mod, profBonus, parseDiceNotation } from "./basics.js";
import { barbarianClassEntry, barbarianRageDamage } from "./character-resources.js";
import { classFeatureList, classProficiencies } from "./class-features.js";
import { songOfVictoryBonus, martialArtsDie } from "./effects.js";
import { hasFeat } from "./vitals.js";
import { holsterDamageBonus } from "./magic-items.js";

/* Fighting styles live on the sheet as features tagged `fightingStyle`
   (see applyClassChoices), so deleting the feature removes its bonus. */
export function hasFightingStyle(c, style){
  return (c.features||[]).some(function(f){ return f.fightingStyle===style; });
}
export function isRangedWeapon(item){
  var d = WEAPON_DATA[item.name];
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
  var d = WEAPON_DATA[item.name];
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
  swapped.forEach(function(i){ i.equipped = false; });
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
  if(item.name==="Shortsword") return true;
  var d = WEAPON_DATA[item.name];
  if(!d || d.category!=="simple" || d.ranged) return false;
  return !/two-handed|heavy/i.test(d.properties || "");
}
/* Martial Arts: a monk wearing no armor and holding no shield can use DEX
   instead of STR with monk weapons, a Kensei's chosen weapons included. */
export function martialArtsApplies(c, item){
  if(!(c.classes||[]).some(function(cl){ return cl.name==="Monk"; })) return false;
  if(!isMonkWeapon(item) && characterPickedProfs(c).monkWeapons.indexOf(item.name)===-1) return false;
  return !(c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped; });
}
/* The damage dice a weapon rolls: its own, or the Martial Arts die when
   that's bigger ("You can roll a d4 in place of the normal damage of your
   unarmed strike or monk weapon", growing with monk level). {qty, die,
   martialArts} or null when the item has no dice. */
export function weaponDamageDice(c, item){
  var own = parseDiceNotation(item.damageDice);
  if(!own) return null;
  if(martialArtsApplies(c, item)){
    var ma = martialArtsDie(c);
    if(ma * 1 > own.qty * own.die) return {qty: 1, die: ma, martialArts: true};
  }
  return {qty: own.qty, die: own.die, martialArts: false};
}
/* An unarmed strike (Basic Rules: you are proficient with it, and it deals
   1 + STR bludgeoning), shown for characters who make something of it: a
   race with natural weapons (a tabaxi's claws: 1d4 + STR slashing), Tavern
   Brawler (a d4), and a monk, whose Martial Arts die and DEX apply while
   wearing no armor and holding no shield. Null for everyone else.
   {name, attack, die (0 for the flat 1), bonus, type, ability, roll,
   parts (what shaped it, for the card)}. */
export function unarmedStrike(c){
  var nat = RACE_DATA[c.race] && RACE_DATA[c.race].unarmed;
  var monk = (c.classes||[]).some(function(cl){ return cl.name==="Monk"; });
  var brawler = hasFeat(c, "Tavern Brawler");
  if(!nat && !monk && !brawler) return null;
  var ab = c.abilities || {}, str = mod(ab.str), dex = mod(ab.dex);
  var die = 0, name = "Unarmed strike", type = "Bludgeoning", parts = [];
  if(nat){ die = nat.die; name = nat.name + " (unarmed strike)"; type = nat.type; parts.push(c.race + " " + nat.name.toLowerCase()); }
  if(brawler && die < 4){ die = 4; parts.push("Tavern Brawler"); }
  var abilityMod = str, ability = "STR";
  var armored = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped; });
  if(monk && !armored){
    var ma = martialArtsDie(c);
    if(ma > die){ die = ma; }
    parts.push("Martial Arts d" + ma);
    if(dex > str){ abilityMod = dex; ability = "DEX"; }
  }
  var bonus = abilityMod + holsterDamageBonus(c);
  // Rage: melee weapon attacks with STR, not in heavy armor.
  var barb = barbarianClassEntry(c);
  var heavy = (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category==="heavy"; });
  if(c.rage && c.rage.active && barb && !heavy && ability==="STR") bonus += barbarianRageDamage(Number(barb.level)||1);
  bonus += songOfVictoryBonus(c, {name: "Unarmed strike"});
  return {name: name, attack: abilityMod + profBonus(c), die: die, bonus: bonus, type: type, ability: ability,
    roll: armorPenalty(c, ability.toLowerCase()), parts: parts};
}
/* The abilities a weapon attack may use and the best modifier among
   them: {mod, keys}, `keys` being every ability that reaches it (on a tie
   the player picks, so a Battle Ready artificer with INT equal to STR can
   attack with INT and dodge armor's STR penalty, or with STR for rage). */
export function weaponAbility(c, item){
  var ab = c.abilities || {};
  var allowed = item.ability==="dex" ? ["dex"] : item.ability==="finesse" ? ["str", "dex"] : ["str"];
  if(martialArtsApplies(c, item)) allowed = ["str", "dex"];
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
  if(item.magic || (Number(item.magicBonus)||0) > 0) return true;
  var active = c.infusions && c.infusions.active || [];
  return !!item.id && active.some(function(a){ return a.itemId===item.id; });
}
/* The feat that lets this weapon trade -5 to hit for +10 damage:
   Great Weapon Master for a heavy melee weapon, Sharpshooter for a ranged
   one, both only with weapons you're proficient with. Null if neither. */
export function powerAttackFeat(c, item){
  if(!item.proficient) return null;
  if(isRangedWeapon(item)) return hasFeat(c, "Sharpshooter") ? "Sharpshooter" : null;
  var d = WEAPON_DATA[item.name];
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
  return weaponAbilityMod(c, item) + pb + (Number(item.magicBonus)||0) + archery - (powerAttackOn(c, item) ? 5 : 0);
}
export function weaponDamageBonus(c, item){
  return weaponAbilityMod(c, item) + (Number(item.magicBonus)||0) + (powerAttackOn(c, item) ? 10 : 0) + songOfVictoryBonus(c, item) + rageDamageBonus(c, item) + duelingBonus(c, item) + holsterDamageBonus(c);
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
/* Best-effort default for a newly added weapon's Proficient checkbox:
   true if any of the character's classes list the weapon's category
   ("Simple weapons"/"Martial weapons") or name it specifically, or the
   race or a feat gives it. */
export function isProficientWithWeapon(c, weaponName, category){
  // Weapon Master's picks.
  if(weaponName && featProficiencies(c).weapons.some(function(w){ return w.name===weaponName; })) return true;
  // The race's weapon training (an elf's longbow, a hobgoblin's picks).
  if(weaponName && raceProficiencies(c).weapons.indexOf(weaponName)!==-1) return true;
  return (c.classes||[]).some(function(cl, idx){
    var p = classProficiencies(c, idx);
    if(!p || !p.weapons) return false;
    return p.weapons.some(function(w){
      var wl = w.toLowerCase();
      if(category==="simple" && wl==="simple weapons") return true;
      if(category==="martial" && wl==="martial weapons") return true;
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
