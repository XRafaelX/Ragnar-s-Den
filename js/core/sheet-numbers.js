/* ---------------- Numbers the sheet and the printout share ----------------
   Worked out here once, so the Spells and Information tabs and the
   printed sheet (js/core/print-sheet.js) can never disagree:
   - spellcastingStats(c): the Spellcasting card's save DC and spell
     attack, one set or one per casting ability (a Cleric/Wizard);
   - characterProficiencies(c): the Proficiencies card's armor, weapons,
     tools and saving throws from every source. */
import { profBonus, mod, fmtMod, combineRolls } from "./basics.js";
import { abilityScore } from "./ability-scores.js";
import { conduitAbility } from "./gunslinger.js";
import { innateSorceryOn } from "./sorcerer.js";
import { coinAttackBonus, magicItemSpellAttack } from "./magic-items.js";
import { infusionSpellAttack } from "./infusion-effects.js";
import { spellcastingAbilities } from "./spell-grants.js";
import { plainAttackRollMode } from "./checks.js";
import { classProficiencies } from "./class-features.js";
import { raceProficiencies, backgroundProficiencies, characterPickedProfs } from "./class-picks.js";
import { featProficiencies } from "./feat-picks.js";
import { characterToolProfs, artificerFirearms } from "./equipment.js";
import { hasToolExpertise } from "./artificer.js";
import { ABILITIES } from "../data/abilities-skills.js";

var ABILITY_NAME = {};
ABILITIES.forEach(function(a){ ABILITY_NAME[a[0]] = a[1]; });

/* The Spellcasting card's numbers.
   One casting ability: {multi:false, ability, mod, dc, dcHint, attack,
   extras:["Duality +1", ...], attackRoll, innate}.
   Several (a Cleric/Wizard): {multi:true, rows:[{label, classes, ability,
   dc, dcHint, attack, attackRoll, innate}]}. */
export function spellcastingStats(c){
  var byAbility = spellcastingAbilities(c);
  if(byAbility.length > 1){
    var baseRoll = plainAttackRollMode(c);
    return {multi: true, rows: byAbility.map(function(x){
      var inn = innateSorceryOn(c) && x.classes.indexOf("Sorcerer")!==-1;
      return {
        label: x.classes.join(" / ") + " · " + x.ability.toUpperCase(),
        classes: x.classes,
        ability: x.ability,
        dc: x.dc + (inn ? 1 : 0),
        dcHint: "8 + prof + " + x.ability.toUpperCase() + (inn ? " + 1 (Innate Sorcery)" : ""),
        attack: x.attack,
        attackRoll: inn ? combineRolls([baseRoll, {mode: "adv", reason: "Innate Sorcery"}]) : baseRoll,
        innate: inn
      };
    })};
  }
  var pb = profBonus(c);
  // (Arcane Conduit: Wisdom while the enchanted firearm is in hand.)
  var ability = conduitAbility(c) || (c.spellcasting && c.spellcasting.ability) || "int";
  var m = mod(abilityScore(c, ability));
  // (Innate Sorcery, 2024: +1 and advantage for a sorcerer's spells.)
  var innate = innateSorceryOn(c) && (c.classes||[]).some(function(cl){ return cl.name==="Sorcerer"; });
  // A boon to attack rolls (Duality's demon side) counts for spells too,
  // and so do an Enhanced Arcane Focus and a Wand of the War Mage.
  var coin = coinAttackBonus(c), focus = infusionSpellAttack(c), wand = magicItemSpellAttack(c);
  var boon = coin + (focus ? focus.value : 0) + (wand ? wand.value : 0);
  return {
    multi: false,
    ability: ability,
    mod: m,
    dc: 8 + pb + m + (innate ? 1 : 0),
    dcHint: "8 + prof + mod" + (innate ? " + 1 (Innate Sorcery)" : ""),
    attack: pb + m + boon,
    extras: (coin ? ["Duality " + fmtMod(coin)] : []).concat(focus ? [focus.name + " " + fmtMod(focus.value)] : [], wand ? [wand.name + " " + fmtMod(wand.value)] : []),
    // Conditions that change attack rolls (Poisoned, Invisible, exhaustion).
    attackRoll: innate ? combineRolls([plainAttackRollMode(c), {mode: "adv", reason: "Innate Sorcery"}]) : plainAttackRollMode(c),
    innate: innate
  };
}

/* The Proficiencies card's lists: {armor, weapons, tools, saves}. Tools
   with expertise read "Thieves' tools (expertise)"; saves are ability
   names ("Strength"). */
export function characterProficiencies(c){
  var armor = [], weapons = [], saves = [];
  function add(list, v){ if(list.indexOf(v)===-1) list.push(v); }
  (c.classes||[]).forEach(function(cl, idx){
    var p = classProficiencies(c, idx);
    if(!p) return;
    (p.armor||[]).forEach(function(v){ add(armor, v); });
    (p.weapons||[]).forEach(function(v){ add(weapons, v); });
    (p.savingThrows||[]).forEach(function(v){ add(saves, ABILITY_NAME[v] || v); });
  });
  // Plus what the race gives (an elf's weapons, a dwarf's armor and tool),
  // the background's weapons (a Rifle Corps member's firearms) and what
  // feats grant (Moderately Armored, Skilled, Weapon Master, Resilient).
  var fromRace = raceProficiencies(c);
  fromRace.armor.forEach(function(v){ add(armor, v); });
  fromRace.weapons.concat(backgroundProficiencies(c).weapons).forEach(function(v){ add(weapons, v); });
  var fromFeats = featProficiencies(c);
  fromFeats.armor.forEach(function(p){ add(armor, p.name); });
  fromFeats.weapons.forEach(function(p){ add(weapons, p.name); });
  if(artificerFirearms(c)) add(weapons, "Firearms");
  fromFeats.saves.forEach(function(p){ add(saves, ABILITY_NAME[p.ability] || p.ability); });
  // Tools from every source (classes, race, background, a pick in place of
  // one given twice, feats), with expertise picked for a tool (a rogue's
  // thieves' tools). (An artificer's Tool Expertise covers every tool.)
  var expertTools = characterPickedProfs(c).toolExpertise.map(function(t){ return t.toLowerCase(); });
  var allExpert = hasToolExpertise(c);
  var tools = characterToolProfs(c).map(function(t){
    return allExpert || expertTools.indexOf(t.toLowerCase())!==-1 ? t + " (expertise)" : t;
  });
  return {armor: armor, weapons: weapons, tools: tools, saves: saves};
}
