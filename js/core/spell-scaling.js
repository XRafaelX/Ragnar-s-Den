/* What a spell does at the character's level, for its card (data in
   data/spell-scaling.js). */
import { SPELL_SCALING } from "../data/spell-scaling.js";
import { SPELL_DATA, catalogSpellName } from "../data/spells.js";
import { profBonus, featureSpells, totalLevel, computeSpellSlots, ordinal, mod, hasFeat, hasBlessedStrikes, classLevelOf } from "./helpers.js";
import { eldritchBlastSummary } from "./invocations.js";
import { classFeatureList } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";
import { dragonType, heartOfTheStorm } from "./sorcerer.js";
import { druidDc, starryConstellation, starryDice, totemSpirit, hasEnhancedBond } from "./druid.js";

var CANTRIP_STEPS = [5, 11, 17];

/* "At level 7: 2d8 necrotic damage. More at level 11." for a cantrip,
   "With your 3rd-level pact slots: 4d10 fire damage." for a spell a
   warlock casts, "Higher slots: +1d10 fire damage per slot level above
   1st." otherwise, or "" for a spell that doesn't grow. `how.pact`: cast
   with a pact slot; `how.owner`: the class that casts it ("" when unknown); `how.fixed`: always cast at its own level (at will,
   as a ritual, a Mystic Arcanum); `how.castAt`: cast at that higher level
   ("As a 2nd-level spell: 3d10 fire damage."). */
export function spellScalingLine(c, name, level, how){
  var base = scalingBody(c, name, level, how || {});
  // An Evoker's Empowered Evocation also adds to a leveled evocation spell's damage.
  var note = level ? empoweredNote(c, name, (how||{}).owner) : "";
  return base && note ? base + " " + note : base || note;
}
function scalingBody(c, name, level, how){
  var entry = SPELL_SCALING[catalogSpellName((name||"").trim())];
  if(!entry) return "";
  if(!level){
    var lv = totalLevel(c);
    var n = 1 + CANTRIP_STEPS.filter(function(x){ return lv >= x; }).length;
    var next = CANTRIP_STEPS[n-1];
    return "At level " + lv + ": " + cantripEffect(c, name, entry, n) + cantripBonus(c, name, how.owner) + "." + (next ? " More at level " + next + "." : "");
  }
  // A spell a feature casts at a set higher level (Infernal Legacy's Hellish Rebuke at 2nd).
  if(how.castAt > level) return "As a " + ordinal(how.castAt) + "-level spell: " + entry.at(how.castAt - level, how.castAt) + ".";
  if(how.fixed) return "";
  var pact = how.pact && computeSpellSlots(c.classes).pact;
  if(pact && pact.slotLevel < level) return "";
  if(pact && pact.slotLevel > level)
    return "With your " + ordinal(pact.slotLevel) + "-level pact slots: " + entry.at(pact.slotLevel - level, pact.slotLevel) + ".";
  return "Higher slots: " + (entry.rule || entry.per + " per slot level above " + ordinal(level)) + ".";
}

/* Eldritch Blast with the warlock's invocations (Agonizing Blast's
   damage, Eldritch Spear's range); other cantrips from the table. */
function cantripEffect(c, name, entry, n){
  var b = catalogSpellName(name)==="Eldritch Blast" && eldritchBlastSummary(c);
  if(!b) return entry.at(n);
  return b.beams + " beam" + (b.beams>1 ? "s" : "") + ", 1d10" + (b.bonus > 0 ? " + " + b.bonus : b.bonus < 0 ? " - " + (-b.bonus) : "") + " force damage" + (b.beams>1 ? " each" : "") +
    (b.range!==120 ? ", " + b.range + " ft" : "");
}

/* A cleric's Potent Spellcasting (Wisdom to a cleric cantrip's damage) or
   Blessed Strikes (1d8 radiant once per turn, any cantrip), and
   an Evoker's Empowered Evocation (Intelligence to one damage roll of a
   wizard evocation spell), as text for the end of a cantrip's line. Only
   for a cantrip on that class's list that the class casts. */
function cantripBonus(c, name, owner){
  var d = SPELL_DATA[catalogSpellName(name)];
  if(!d) return "";
  var out = "";
  function add(className, feature, ability, extra){
    if(owner && owner!==className) return;
    if(d.classes.indexOf(className)===-1) return;
    var has = (c.classes||[]).some(function(cl){ return cl.name===className && classFeatureList(cl).some(function(f){ return f.name===feature; }); });
    var m = mod(abilityScore(c, ability));
    if(has && m) out += (m>0 ? ", plus " + m : ", minus " + (-m)) + " from " + feature + extra;
  }
  add("Cleric", "Potent Spellcasting", "wis", "");
  if(d.school==="Evocation") add("Wizard", "Empowered Evocation", "int", " on one damage roll");
  // Blessed Strikes (Tasha's, cleric 8): any damaging cantrip, once per turn.
  if(/damage/i.test(d.summary) && /\d+d\d+/.test(d.summary) && hasBlessedStrikes(c)) out += ", plus 1d8 radiant to one creature it damages, once per turn (Blessed Strikes)";
  // An Evoker's Potent Cantrip: half damage even when the target saves.
  if((!owner || owner==="Wizard") && /\bsave\b/i.test(d.summary) && /\d+d\d+/.test(d.summary) && hasWizardFeature(c, "Potent Cantrip"))
    out += ", and half damage even when the target saves (Potent Cantrip)";
  return out;
}
function hasWizardFeature(c, feature){
  return (c.classes||[]).some(function(cl){ return cl.name==="Wizard" && classFeatureList(cl).some(function(f){ return f.name===feature; }); });
}
/* "Empowered Evocation: plus 4 to one damage roll." for a damaging
   evocation spell on the wizard list that the wizard casts. */
function empoweredNote(c, name, owner){
  var d = SPELL_DATA[catalogSpellName((name||"").trim())];
  if(!d || !d.level || d.school!=="Evocation" || d.classes.indexOf("Wizard")===-1) return "";
  if(owner && owner!=="Wizard") return "";
  if(!/damage/i.test(d.summary) || !/\d+d\d+/.test(d.summary) || !hasWizardFeature(c, "Empowered Evocation")) return "";
  var m = mod(abilityScore(c, "int"));
  return m ? "Empowered Evocation: " + (m>0 ? "plus " + m : "minus " + (-m)) + " to one damage roll." : "";
}

/* What a Life or Grave cleric adds to a healing spell, for its card. "" for
   any other spell or character. */
var HEALING_SPELLS = ["Cure Wounds", "Healing Word", "Prayer of Healing", "Aura of Vitality", "Mass Healing Word", "Mass Cure Wounds", "Heal", "Regenerate", "Power Word Heal", "Healing Spirit", "Mass Heal", "Goodberry"];
export function healingNote(c, name){
  var spell = catalogSpellName((name||"").trim()), d = SPELL_DATA[spell];
  if(!d || HEALING_SPELLS.indexOf(spell)===-1) return "";
  var life = classLevelOf(c, "Cleric", "Life Domain"), grave = classLevelOf(c, "Cleric", "Grave Domain");
  var dice = /\d+d\d+/.test(d.summary), notes = [];
  if(life >= 1) notes.push("Disciple of Life: plus " + (2 + d.level) + " hit points to each creature, and 1 more per slot level above " + ordinal(d.level) + ".");
  if(life >= 6) notes.push("Blessed Healer: you regain the same when it heals someone else.");
  if(life >= 17 && dice) notes.push("Supreme Healing: use the highest number on each die.");
  if(grave >= 1 && dice) notes.push("Circle of Mortality: use the highest number on each die for a creature at 0 hit points.");
  // Druid: what's on right now. These need a spell slot, so not a cantrip's or a free cast.
  if(starryConstellation(c)==="Chalice"){
    var wis = mod(abilityScore(c, "wis"));
    notes.push("Chalice: with a spell slot, you or a creature within 30 feet also regains " + starryDice(c) + "d8" + (wis ? (wis > 0 ? "+" : "") + wis : "") + " hit points.");
  }
  if(totemSpirit(c)==="Unicorn") notes.push("Unicorn Spirit: with a spell slot, each creature you choose in the aura also regains " + classLevelOf(c, "Druid", "Circle of the Shepherd") + " hit points.");
  if(hasEnhancedBond(c)) notes.push("Enhanced Bond: add a d8 to one healing roll.");
  if(classLevelOf(c, "Sorcerer", "Divine Soul") >= 6) notes.push("Empowered Healing: 1 sorcery point rerolls any of the dice, once per turn.");
  return notes.join(" ");
}
/* What a druid's circle or a bard's college adds to other spells, for
   their cards: Enhanced Bond's d8 on fire damage, Spiritual Focus's d6, and
   what Mighty Summoner and Foul Conjuration do to the beasts and fey a
   spell brings. And Omens and Portents (Fate Domain 1): once its free
   Augury is used, until a long rest. */
var OMENS_SPELLS = ["Augury", "Commune", "Divination"];
var SUMMON_SPELLS = ["Conjure Animals", "Conjure Woodland Beings", "Conjure Fey", "Summon Beast", "Summon Fey", "Find Familiar", "Find Steed", "Find Greater Steed"];
export function circleSpellNote(c, name){
  var spell = catalogSpellName((name||"").trim()), d = SPELL_DATA[spell], notes = [];
  if(!d) return "";
  if(hasEnhancedBond(c) && /\bfire\b[^.]*damage/i.test(d.summary)) notes.push("Enhanced Bond: add a d8 to one damage roll.");
  if(OMENS_SPELLS.indexOf(spell)!==-1 && classLevelOf(c, "Cleric", "Fate Domain") >= 1 && (c.resourcesUsed||{})["Cleric:omens_and_portents"] > 0) notes.push("Omens and Portents: 25 percent less chance of no answer or a random reading, until your long rest.");
  // Elemental Affinity (Draconic Bloodline 6): the ancestry's damage type.
  var ancestry = classLevelOf(c, "Sorcerer", "Draconic Bloodline") >= 6 && dragonType(c);
  if(ancestry && new RegExp("\\b" + ancestry + "\\b[^.]*damage", "i").test(d.summary)){
    var affinity = mod(abilityScore(c, "cha"));
    notes.push("Elemental Affinity: add " + affinity + " to one damage roll. You can also spend 1 sorcery point for resistance to " + ancestry + " for 1 hour, on Active effects.");
  }
  var storm = heartOfTheStorm(c);
  if(storm && d.level >= 1 && /\b(lightning|thunder)\b[^.]*damage/i.test(d.summary)) notes.push("Heart of the Storm: creatures you choose within 10 feet take " + storm + " lightning or thunder damage as you start casting.");
  if(classLevelOf(c, "Sorcerer", "Wild Magic") >= 18 && /\b\d+d\d+\b/.test(d.summary) && /damage/i.test(d.summary)) notes.push("Spell Bombardment: once per turn, when a die rolls its highest number, roll one of them again and add it.");
  if(classLevelOf(c, "Sorcerer", "Aberrant Mind") >= 6 && d.level >= 1 && featureSpells(c).some(function(s){ return s.name===spell && s.feature==="Psionic Spells"; })) notes.push("Psionic Sorcery: you can cast it with " + d.level + (d.level===1 ? " sorcery point" : " sorcery points") + " instead of a slot, with no components.");
  // Wizard schools.
  var school = function(n){ return classLevelOf(c, "Wizard", n); };
  if(school("School of Evocation") >= 2 && d.school==="Evocation" && /\bsave\b/i.test(d.summary)) notes.push("Sculpt Spells: up to " + (1 + d.level) + (d.level ? " creatures" : " creature") + " you can see automatically succeed, and take no damage on a half-damage save.");
  if(school("School of Abjuration") >= 2 && d.school==="Abjuration" && d.level >= 1) notes.push("Arcane Ward: casting it gives your ward " + 2 * d.level + " hit points, or creates it.");
  if(school("School of Abjuration") >= 10 && (spell==="Counterspell" || spell==="Dispel Magic")) notes.push("Improved Abjuration: add " + profBonus(c) + " to the ability check.");
  if(school("School of Divination") >= 6 && d.school==="Divination" && d.level >= 2) notes.push("Expert Divination: with a slot, you get back a lower slot, 5th level at most.");
  if(school("School of Necromancy") >= 6 && ["Animate Dead", "Create Undead", "Finger of Death"].indexOf(spell)!==-1) notes.push("Undead Thralls: undead it makes get +" + school("School of Necromancy") + " hit points and +" + profBonus(c) + " to weapon damage." + (spell==="Animate Dead" ? " You can target one more corpse or pile of bones." : ""));
  if(school("School of Conjuration") >= 14 && d.school==="Conjuration" && SUMMON_SPELLS.concat(["Conjure Minor Elementals", "Conjure Elemental", "Conjure Celestial", "Summon Elemental", "Summon Construct"]).indexOf(spell)!==-1) notes.push("Durable Summons: what it brings has 30 temporary hit points.");
  if(school("School of Enchantment") >= 10 && d.school==="Enchantment" && d.level >= 1) notes.push("Split Enchantment: if it targets only one creature, it can target a second.");
  // Radiant Soul (Celestial 6): radiant or fire damage.
  if(classLevelOf(c, "Warlock", "The Celestial") >= 6 && /\b(radiant|fire)\b[^.]*damage/i.test(d.summary)) notes.push("Radiant Soul: add " + mod(abilityScore(c, "cha")) + " to one radiant or fire damage roll against one target.");
  // Spiritual Focus (College of Spirits 6): a bard spell's damage or healing.
  if(classLevelOf(c, "Bard", "College of Spirits") >= 6 && d.classes.indexOf("Bard")!==-1 && (/\bdamage\b/i.test(d.summary) || HEALING_SPELLS.indexOf(spell)!==-1))
    notes.push("Spiritual Focus: through your focus, add a d6 to one damage or healing roll.");
  if(SUMMON_SPELLS.indexOf(spell)!==-1){
    if(classLevelOf(c, "Druid", "Circle of the Shepherd") >= 6) notes.push("Mighty Summoner: beasts and fey it brings get 2 extra hit points per Hit Die, and their natural weapons count as magical.");
    if(classLevelOf(c, "Druid", "Circle of the Blighted") >= 10) notes.push("Foul Conjuration: beasts and fey it brings are immune to necrotic and poison damage and to being poisoned. At 0 hit points they explode, CON save DC " + druidDc(c) + ".");
  }
  return notes.join(" ");
}
/* A spell's range as the character has it. Spell Sniper doubles the range
   of a spell that needs an attack roll (a spell attack in the summary),
   when that range is a distance. */
export function spellRangeText(c, name, range){
  var d = SPELL_DATA[catalogSpellName((name||"").trim())];
  var m = /^([\d,]+) feet$/.exec(range||"");
  if(!m || !d || !/spell attack/i.test(d.summary) || !hasFeat(c, "Spell Sniper")) return range;
  var ft = String(Number(m[1].replace(/,/g, "")) * 2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return ft + " feet (doubled by Spell Sniper)";
}
