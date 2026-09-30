import { FEATS_CATALOG } from "../data/feats.js";
import { ABILITIES, SKILLS } from "../data/abilities-skills.js";
import { ARTISAN_TOOLS, MUSICAL_INSTRUMENTS } from "../data/classes.js";

/* ---------------- Feat picks ----------------
   Choices a feat asks for when it's taken: the ability a half-feat raises
   by 1 (Athlete: STR or DEX), Skilled's three skills or tools, Skill
   Expert's skill and expertise. The catalog entry says what a feat
   offers (see the key at the top of js/data/feats.js).

   The character's copy of the feat keeps `picks` (what was chosen) and
   `applied` (what that actually changed: a score already at 20 or a skill
   already proficient changes nothing), so removing the feat, or undoing
   the level-up that gave it, takes back exactly that. Resilient's save,
   armor and tool proficiencies aren't written anywhere; they're read from
   the picks (featProficiencies). */

export var TOOL_GROUPS = {
  "Artisan's tools": ARTISAN_TOOLS,
  "Musical instruments": MUSICAL_INSTRUMENTS,
  "Other tools": ["Disguise kit","Forgery kit","Herbalism kit","Navigator's tools","Poisoner's kit","Thieves' tools",
    "Dice set","Playing card set","Dragonchess set","Three-Dragon Ante set","Vehicles (land)","Vehicles (water)"]
};
var SKILL_NAMES = SKILLS.map(function(s){ return s[0]; });
function isSkill(name){ return SKILL_NAMES.indexOf(name)!==-1; }
function abilityName(k){ var a = ABILITIES.find(function(x){ return x[0]===k; }); return a ? a[1] : k; }

export function featDef(name){
  return FEATS_CATALOG.find(function(f){ return f.name===name; }) || null;
}
/* Anything taking this feat changes on the sheet. */
export function featHasPicks(def){
  return !!def && !!((def.ability && def.ability.length) || def.skills || def.skillsOrTools || def.expertise);
}
/* Something the player has to choose (not just a fixed +1). */
export function featNeedsChoice(def){
  return !!def && !!((def.ability && def.ability.length > 1) || def.skills || def.skillsOrTools || def.expertise);
}
export function emptyPicks(def){
  return { ability: def && def.ability && def.ability.length===1 ? def.ability[0] : "", skills: [], expertise: [] };
}
function profCount(def){ return def.skillsOrTools || def.skills || 0; }

/* What's still missing or wrong ("" when the picks are complete).
   ctx: {abilities, skillProfs} of the character taking the feat. */
export function featPicksProblem(def, picks, ctx){
  if(!featHasPicks(def)) return "";
  picks = picks || {};
  if(def.ability && def.ability.length && def.ability.indexOf(picks.ability)===-1) return "Pick the ability "+def.name+" raises.";
  var n = profCount(def);
  var chosen = (picks.skills||[]).slice(0, n).filter(Boolean);
  var noun = def.skillsOrTools ? "skills or tools" : "skills";
  if(chosen.length < n || new Set(chosen).size < n) return "Pick "+(n===1 ? "a skill" : n+" different "+noun)+" for "+def.name+".";
  if(chosen.some(function(x){ return isSkill(x) && hasProf(ctx, x); })) return "Pick "+noun+" you're not already proficient in.";
  var exp = (picks.expertise||[]).slice(0, def.expertise||0).filter(Boolean);
  if(exp.length < (def.expertise||0)) return "Pick a skill for "+def.name+"'s expertise.";
  if(exp.some(function(x){ return expertiseReason(ctx, picks, x); })) return "Pick a skill you're proficient in and don't already have expertise in.";
  return "";
}
function hasProf(ctx, skill){ var e = ctx && ctx.skillProfs && ctx.skillProfs[skill]; return !!(e && e.prof); }
/* Why a skill can't take this feat's expertise ("" if it can). */
export function expertiseReason(ctx, picks, skill){
  var e = ctx && ctx.skillProfs && ctx.skillProfs[skill];
  if(e && e.expertise) return "expert";
  return hasProf(ctx, skill) || (picks.skills||[]).indexOf(skill)!==-1 ? "" : "not proficient";
}
/* Skills an expertise pick can go to: proficient ones plus this feat's own skill picks. */
export function expertiseOptions(ctx, picks){
  return SKILL_NAMES.filter(function(sk){ return hasProf(ctx, sk) || (picks.skills||[]).indexOf(sk)!==-1; });
}

/* Short text for the picks: "Dexterity +1, Stealth, expertise in Arcana". */
export function featPicksSummary(def, picks){
  if(!featHasPicks(def) || !picks) return "";
  var bits = [];
  if(picks.ability) bits.push(abilityName(picks.ability)+" +1"+(def.saveProf ? " and its saving throw" : ""));
  (picks.skills||[]).filter(Boolean).forEach(function(s){ bits.push(s); });
  (picks.expertise||[]).filter(Boolean).forEach(function(s){ bits.push("expertise in "+s); });
  return bits.join(", ");
}

/* Apply the picks to the character (feat is its copy, already in c.feats). */
export function applyFeatPicks(c, feat, picks){
  var def = featDef(feat.name);
  if(!featHasPicks(def)) return;
  feat.picks = {ability: picks.ability||"", skills: (picks.skills||[]).filter(Boolean), expertise: (picks.expertise||[]).filter(Boolean)};
  var applied = {abilities:{}, skills:[], expertise:[]};
  var k = feat.picks.ability;
  if(k){
    var was = Number(c.abilities[k])||10, now = Math.min(20, was + 1);
    if(now !== was){ c.abilities[k] = now; applied.abilities[k] = now - was; }
  }
  if(!c.skillProfs) c.skillProfs = {};
  feat.picks.skills.filter(isSkill).forEach(function(sk){
    var entry = c.skillProfs[sk] || {prof:false, expertise:false};
    if(!entry.prof){ entry.prof = true; applied.skills.push(sk); }
    c.skillProfs[sk] = entry;
  });
  feat.picks.expertise.forEach(function(sk){
    var entry = c.skillProfs[sk] || {prof:false, expertise:false};
    if(!entry.expertise){ entry.expertise = true; applied.expertise.push(sk); }
    c.skillProfs[sk] = entry;
  });
  feat.applied = applied;
}
/* Take back what applyFeatPicks changed. Returns a summary of it for a toast or dialog. */
export function revertFeatPicks(c, feat){
  var a = feat && feat.applied;
  if(!a) return "";
  var bits = [];
  Object.keys(a.abilities||{}).forEach(function(k){
    c.abilities[k] = (Number(c.abilities[k])||10) - a.abilities[k];
    bits.push(abilityName(k)+" -"+a.abilities[k]);
  });
  (a.expertise||[]).forEach(function(sk){ if(c.skillProfs[sk]) c.skillProfs[sk].expertise = false; });
  (a.skills||[]).forEach(function(sk){ if(c.skillProfs[sk]){ c.skillProfs[sk].prof = false; c.skillProfs[sk].expertise = false; } });
  delete feat.applied;
  return bits.concat(a.skills||[], (a.expertise||[]).map(function(s){ return "expertise in "+s; })).join(", ");
}
/* What removing this feat would take back, for the confirm dialog. */
export function featAppliedSummary(feat){
  var a = feat && feat.applied;
  if(!a) return "";
  return Object.keys(a.abilities||{}).map(function(k){ return abilityName(k)+" +"+a.abilities[k]; })
    .concat(a.skills||[], (a.expertise||[]).map(function(s){ return "expertise in "+s; })).join(", ");
}
/* A feat whose picks were never made: taken before the sheet applied
   them, or added from the Compendium and the picker closed. */
export function featPicksPending(feat){
  return !feat.picks && featHasPicks(featDef(feat.name));
}

/* Proficiencies feats grant: armor (Moderately Armored), tools (Skilled)
   and saving throws (Resilient), each tagged with the feat's name. */
export function featProficiencies(c){
  var out = {armor:[], tools:[], saves:[]};
  (c.feats||[]).forEach(function(feat){
    var def = featDef(feat.name);
    if(!def) return;
    (def.armor||[]).forEach(function(a){ out.armor.push({name:a, feat:feat.name}); });
    if(!feat.picks) return;
    (feat.picks.skills||[]).forEach(function(x){ if(!isSkill(x)) out.tools.push({name:x, feat:feat.name}); });
    if(def.saveProf && feat.picks.ability) out.saves.push({ability:feat.picks.ability, feat:feat.name});
  });
  return out;
}
