/* What a spell does at the character's level, for its card (data in
   data/spell-scaling.js). */
import { SPELL_SCALING } from "../data/spell-scaling.js";
import { SPELL_DATA, catalogSpellName } from "../data/spells.js";
import { totalLevel, computeSpellSlots, ordinal, mod, hasFeat, hasBlessedStrikes } from "./helpers.js";
import { eldritchBlastSummary } from "./invocations.js";
import { classFeatureList } from "./class-features.js";
import { abilityScore } from "./ability-scores.js";

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
