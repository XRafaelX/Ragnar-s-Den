/* ---------------- A weapon card's line ----------------
   What the line under a weapon's name says, worked out from the rules
   (render/panels/inventory.js draws it): the damage dice and type, the
   ability it uses, proficiency, magic, and what adds to its damage. */
import { revenantBladeApplies, martialArtsApplies, reaperDex, weaponDamageDice, shillelaghOn, shillelaghAbilities, pactWeaponCha, weaponAbility,
  elementalCleaver, loadedRound, isMagicWeapon, isKenseiWeapon, magicArrows, chosenWeaponFeature, rageDamageBonus, batteringRoots, duelingBonus,
  gwm2024Bonus, sidearmMasteryBonus, outlawGritBonus, marshalRange, enchantmentOf, arcaneInfusionBonus, classLevelOf, fmtMod } from "./helpers.js";

/* {damageType: the type it deals now (a loaded round's, Elemental
    Cleaver's), parts: the words, in order}. */
export function weaponSummary(c, item){
  var abilityLabel = item.ability==="finesse" || revenantBladeApplies(c, item) ? "Finesse" : (item.ability==="dex" ? "DEX" : "STR");
  // Martial Arts: a monk weapon uses the better of STR and DEX, and the
  // Martial Arts die when it's bigger than the weapon's.
  if(martialArtsApplies(c, item)) abilityLabel = "Martial Arts (STR or DEX)";
  // Reaper: a scythe swung with Dexterity, for 1d6.
  var reaper = reaperDex(c, item);
  if(reaper) abilityLabel = "DEX (Reaper)";
  var maDice = weaponDamageDice(c, item);
  if(maDice && maDice.martialArts) abilityLabel += " · Martial Arts d" + maDice.die;
  // Shillelagh: the spellcasting ability can replace Strength, and the die is a d8.
  var shil = shillelaghOn(c, item);
  if(shil) abilityLabel = "Shillelagh (STR or " + shillelaghAbilities(c).map(function(k){ return k.toUpperCase(); }).join(" or ") + ")";
  // The 2024 Pact of the Blade: Charisma when it's the best.
  if(pactWeaponCha(c, item) && weaponAbility(c, item).keys.indexOf("cha")!==-1) abilityLabel = "CHA (Pact of the Blade)";
  var subtitleParts = [];
  // Elemental Cleaver's weapon deals the chosen type while the rage lasts.
  var cleave = elementalCleaver(c, item);
  // A Gunslinger class gun deals its loaded round's damage type.
  var round = loadedRound(c, item);
  var dmgType = (round && round.damageType) || (cleave && cleave.type) || item.damageType;
  if(item.damageDice) subtitleParts.push(((shil || reaper) && maDice ? maDice.qty + "d" + maDice.die : item.damageDice) + (dmgType ? " " + dmgType : ""));
  subtitleParts.push(abilityLabel);
  subtitleParts.push(item.proficient ? "Proficient" : "Not proficient");
  if(item.magicBonus) subtitleParts.push(fmtMod(item.magicBonus) + " magic");
  else if(isMagicWeapon(c, item) || (classLevelOf(c, "Monk", "Way of the Kensei") >= 6 && isKenseiWeapon(c, item))) subtitleParts.push("Magic");
  // Magic Arrow (Arcane Archer 7): arrows from a shortbow or longbow count as magical.
  else if(magicArrows(c, item)) subtitleParts.push("magic arrows");
  if(item.bonded && classLevelOf(c, "Fighter", "Eldritch Knight") >= 3) subtitleParts.push("bonded");
  var chosenFeat = item.chosenWeapon && chosenWeaponFeature(c);
  if(chosenFeat) subtitleParts.push(chosenFeat.name);
  var rage = rageDamageBonus(c, item);
  if(rage) subtitleParts.push("Rage +" + rage + " damage");
  if(batteringRoots(c, item)) subtitleParts.push("Reach +10 ft on your turn");
  if(duelingBonus(c, item)) subtitleParts.push("Dueling +2 damage");
  var gwm = gwm2024Bonus(c, item);
  if(gwm) subtitleParts.push("Great Weapon Master +" + gwm + " damage");
  if(sidearmMasteryBonus(c, item)) subtitleParts.push("Sidearm Mastery +2 damage");
  if(outlawGritBonus(c, item)) subtitleParts.push("Outlaw's Grit +2 damage");
  if(marshalRange(c, item)) subtitleParts.push(marshalRange(c, item));
  var ench = enchantmentOf(c, item);
  if(ench) subtitleParts.push(ench.name + (arcaneInfusionBonus(c, item) ? " " + fmtMod(arcaneInfusionBonus(c, item)) + " damage" : ""));
  return {damageType: dmgType, parts: subtitleParts};
}
