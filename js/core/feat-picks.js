import { FEATS_CATALOG } from "../data/feats.js";
import { ABILITIES, SKILLS } from "../data/abilities-skills.js";
import { ARTISAN_TOOLS, MUSICAL_INSTRUMENTS } from "../data/classes.js";
import { WEAPON_GROUPS } from "../data/weapons.js";
import { SPELL_DATA } from "../data/spells.js";
import { optionSetDef } from "../data/class-options.js";
import { INVOCATIONS, invocationDef } from "../data/invocations.js";
import { RACE_DATA } from "../data/race-data.js";
import { profBonus, uid } from "./helpers.js";
import { classStyleList, styleDef, stylePicksProblem, makeStyleFeature } from "./fighting-styles.js";

/* ---------------- Feat picks ----------------
   Choices a feat asks for when it's taken: the ability a half-feat raises
   by 1 (Athlete: STR or DEX), Skilled's three skills or tools, Skill
   Expert's skill and expertise, Weapon Master's four weapons, Fey
   Touched's 1st-level spell, Linguist's languages, Strixhaven Initiate's
   college, Fighting Initiate's style, Eldritch Adept's invocation. The
   catalog entry says what a feat offers (see the key at the top of
   js/data/feats.js).

   The character's copy of the feat keeps `picks` (what was chosen) and
   `applied` (what that actually changed: a score already at 20 or a skill
   already proficient changes nothing), so removing the feat, or undoing
   the level-up that gave it, takes back exactly that. Resilient's save,
   armor, tool and weapon proficiencies aren't written anywhere; they're
   read from the picks (featProficiencies), and so are picked spells
   (featureSpells puts them on the Spells tab). Weapon picks do tick the
   Proficient box on matching weapons already carried (and undo it);
   languages go onto the character's list, and Fighting Initiate's style
   becomes a style feature (both taken back with the feat). */

export var TOOL_GROUPS = {
  "Artisan's tools": ARTISAN_TOOLS,
  "Musical instruments": MUSICAL_INSTRUMENTS,
  "Other tools": ["Disguise kit","Forgery kit","Herbalism kit","Navigator's tools","Poisoner's kit","Thieves' tools",
    "Dice set","Playing card set","Dragonchess set","Three-Dragon Ante set","Vehicles (land)","Vehicles (water)"]
};
var SKILL_NAMES = SKILLS.map(function(s){ return s[0]; });
function isSkill(name){ return SKILL_NAMES.indexOf(name)!==-1; }
export function abilityName(k){ var a = ABILITIES.find(function(x){ return x[0]===k; }); return a ? a[1] : k; }
function aOrAn(word){ return (/^[aeiou]/i.test(word) ? "an " : "a ") + word; }

export function featDef(name){
  return FEATS_CATALOG.find(function(f){ return f.name===name; }) || null;
}
/* Anything taking this feat changes on the sheet. */
function hasChoices(def){
  return !!(def.skills || def.skillsOrTools || def.expertise || def.weapons || def.option || def.spellPick || def.optionPicks ||
    def.toolPicks || def.languagePicks || Array.isArray(def.castAbility) || def.stylePick || def.invocationPick);
}
export function featHasPicks(def){
  return !!def && !!((def.ability && def.ability.length) || (def.languages && def.languages.length) || hasChoices(def));
}
/* Something the player has to choose (not just a fixed +1). */
export function featNeedsChoice(def){
  return !!def && !!((def.ability && def.ability.length > 1) || hasChoices(def));
}
export function emptyPicks(def){
  return { ability: def && def.ability && def.ability.length===1 ? def.ability[0] : "", skills: [], expertise: [], weapons: [], option: "", spells: [], options: [],
    castAbility: "", tools: [], languages: [] };
}
/* The option names a feat's optionPicks can choose from (Martial Adept: maneuvers). */
export function featOptionChoices(def){
  var set = def && def.optionPicks && optionSetDef(def.optionPicks.set);
  return set ? set.options.map(function(o){ return o.name; }) : [];
}
/* A feat's spell picks as groups, in the order their picks sit in
   picks.spells: [{count, level, label, plural, use, tags, offset,
   options}]. `options` are the spells a group can choose from (none
   until the option it depends on is picked: a college, a moon). ctx.pb
   sizes a "halfPb" group (Rune Shaper's runes). */
export function featSpellGroups(def, picks, ctx){
  if(!def || !def.spellPick) return [];
  var offset = 0;
  return [].concat(def.spellPick).map(function(g){
    var count = g.count==="halfPb" ? Math.max(1, Math.floor(((ctx && ctx.pb) || 2) / 2)) : g.count;
    var src = g.byOption ? g.byOption[(picks && picks.option) || ""] : g;
    var out = {count: count, level: g.level, label: g.label, plural: g.plural || g.label + "s", use: g.use || (g.level===0 ? "known" : "long"),
      tags: g.tags || null, offset: offset, options: src ? spellChoices(g, src) : []};
    offset += count;
    return out;
  });
}
function spellChoices(g, src){
  if(src.names) return src.names.slice().sort();
  var lists = src.list ? [].concat(src.list) : null;
  return Object.keys(SPELL_DATA).filter(function(n){
    var d = SPELL_DATA[n];
    return d.level===g.level && (!g.schools || g.schools.indexOf(d.school)!==-1) &&
      (!lists || lists.some(function(l){ return (d.classes||[]).indexOf(l)!==-1; }));
  }).sort();
}
/* Every spell a feat's spell picks can choose from. */
export function featSpellOptions(def, picks, ctx){
  return featSpellGroups(def, picks, ctx).reduce(function(all, g){
    return all.concat(g.options.filter(function(n){ return all.indexOf(n)===-1; }));
  }, []);
}
/* Every spell the feat gives with these picks, as [{name, use}]: use is
   "long" or "short" (one free cast per rest), "atwill", "ritual" or
   "known" (a cantrip). */
export function featSpellEntries(def, picks){
  if(!def) return [];
  picks = picks || {};
  var out = [];
  function add(name, use){
    if(!name || out.some(function(e){ return e.name===name; })) return;
    var d = SPELL_DATA[name];
    out.push({name: name, use: use || (d && d.level===0 ? "known" : "long")});
  }
  (def.grantsSpells||[]).concat((def.grantsByOption && def.grantsByOption[picks.option]) || []).forEach(function(s){
    if(typeof s==="string") add(s); else add(s.name, s.use);
  });
  var groups = featSpellGroups(def, picks);
  (picks.spells||[]).forEach(function(name, i){
    var g = groups.filter(function(x){ return i >= x.offset; }).pop();
    if(g) add(name, g.use);
  });
  return out;
}
/* The ability the feat's spells are cast with ("" when not chosen yet):
   a fixed one (Drow High Magic: CHA), the one picked for it, the one
   picked for another feat (an Adept's is the Initiate's), or its +1. */
export function featCastAbility(c, def, picks){
  picks = picks || {};
  var ca = def && def.castAbility;
  if(typeof ca==="string") return ca;
  if(Array.isArray(ca)) return picks.castAbility || "";
  if(ca && ca.feat){
    var other = ((c && c.feats) || []).find(function(f){ return f.name===ca.feat; });
    var otherDef = other && featDef(other.name);
    return otherDef && otherDef!==def ? featCastAbility(c, otherDef, other.picks) : "";
  }
  return picks.ability || "";
}
/* The styles Fighting Initiate can choose from. */
export function featStyleChoices(){ return classStyleList("Fighter"); }
/* The invocations Eldritch Adept can choose from. ctx.invocationChoices()
   answers for a character on the sheet (a warlock may take one whose
   prerequisite they meet); without it, the ones with no prerequisite.
   Book of Ancient Secrets, which has picks of its own, is left to the
   warlock's own invocations. */
export function featInvocationChoices(ctx){
  if(ctx && ctx.invocationChoices) return ctx.invocationChoices();
  return INVOCATIONS.filter(function(inv){
    return !inv.level && !inv.pact && !inv.needs && !inv.spellPick && (!inv.optional || (ctx && ctx.tasha));
  }).map(function(inv){ return inv.name; });
}
/* What the picked option does, as "Fire Strike: ..." ("" for none). */
export function featPickDetail(def, picks){
  var name = picks && picks.option;
  if(!def || !name) return "";
  if(def.invocationPick){ var inv = invocationDef(name); return inv ? name + ": " + inv.text : ""; }
  var text = def.option && def.option.details && def.option.details[name];
  return text ? name + ": " + text : "";
}
/* Picks to start a picker from: the feat's own (to finish them) or empty. */
export function startingPicks(def, feat){
  var p = feat && feat.picks && !feat.picks.manual ? feat.picks : emptyPicks(def);
  return {ability: p.ability || emptyPicks(def).ability, skills: (p.skills||[]).slice(), expertise: (p.expertise||[]).slice(), weapons: (p.weapons||[]).slice(), option: p.option || "", spells: (p.spells||[]).slice(), options: (p.options||[]).slice(),
    castAbility: p.castAbility || "", tools: (p.tools||[]).slice(), languages: (p.languages||[]).slice()};
}
function profCount(def){ return def.skillsOrTools || def.skills || 0; }
/* The tools a feat's toolPicks can choose from. */
export function featToolChoices(def){
  var g = def && def.toolPicks && def.toolPicks.group;
  if(g) return TOOL_GROUPS[g].slice();
  return Object.keys(TOOL_GROUPS).reduce(function(all, k){ return all.concat(TOOL_GROUPS[k]); }, []);
}

/* Why this character can't take the feat ("" if they can), from its
   `requires`: race, character level, another feat (and its option).
   who: {race, level, feats}. A homebrew race is never ruled out. */
export function featRequiresReason(def, who){
  var r = def && def.requires;
  if(!r) return "";
  who = who || {};
  var race = RACE_DATA[who.race];
  if(r.races && race && !race.custom && r.races.indexOf(who.race)===-1) return "only for " + r.raceLabel;
  if(r.level && (Number(who.level)||1) < r.level) return "needs level " + r.level;
  if(r.feat){
    var has = (who.feats||[]).some(function(f){ return f.name===r.feat && (!r.option || (f.picks && f.picks.option===r.option)); });
    if(!has) return "needs " + r.feat + (r.option ? " (" + r.option + ")" : "");
  }
  return "";
}

/* What's still missing or wrong ("" when the picks are complete).
   ctx: {abilities, skillProfs} of the character taking the feat. */
export function featPicksProblem(def, picks, ctx){
  if(!featHasPicks(def)) return "";
  picks = picks || {};
  if(def.option){
    if(def.option.options.indexOf(picks.option)===-1) return "Pick "+aOrAn(def.option.label.toLowerCase())+" for "+def.name+".";
    if(def.repeatable && ctx && ctx.optionsTaken && ctx.optionsTaken(def.name).indexOf(picks.option)!==-1) return "You already have "+def.name+" ("+picks.option+"). Pick another "+def.option.label.toLowerCase()+".";
  }
  if(def.stylePick){
    if(featStyleChoices().indexOf(picks.option)===-1) return "Pick a fighting style for "+def.name+".";
    var styleWhy = ctx && ctx.styleReason ? ctx.styleReason(picks.option) : "";
    if(styleWhy==="known") return "You already have the "+picks.option+" style. Pick another.";
    if(styleWhy || ((styleDef(picks.option)||{}).optional && !(ctx && ctx.tasha))) return picks.option+" is one of Tasha's optional fighting styles, which this character doesn't use. Pick another.";
    var stylePicks = stylePicksProblem(picks.option, picks, !!(ctx && ctx.tasha), ctx && ctx.optionsKnown ? ctx.optionsKnown("maneuvers") : []);
    if(stylePicks) return stylePicks;
  }
  if(def.invocationPick && featInvocationChoices(ctx).indexOf(picks.option)===-1) return "Pick an eldritch invocation for "+def.name+".";
  if(def.ability && def.ability.length && def.ability.indexOf(picks.ability)===-1) return "Pick the ability "+def.name+" raises.";
  if(Array.isArray(def.castAbility) && def.castAbility.indexOf(picks.castAbility)===-1) return "Pick the spellcasting ability for "+def.name+".";
  var n = profCount(def);
  var chosen = (picks.skills||[]).slice(0, n).filter(Boolean);
  var noun = def.skillsOrTools ? "skills or tools" : "skills";
  if(def.skillOptions){
    // A skill already known is fine only when every option is (nothing left to gain).
    var open = def.skillOptions.filter(function(x){ return !hasProf(ctx, x); });
    if(chosen.length < n || def.skillOptions.indexOf(chosen[0])===-1) return "Pick "+def.skillOptions.join(" or ")+" for "+def.name+".";
    if(open.length && open.indexOf(chosen[0])===-1) return "You're already proficient in "+chosen[0]+". Pick "+open.join(" or ")+".";
  } else {
    if(chosen.length < n || new Set(chosen).size < n) return "Pick "+(n===1 ? "a skill" : n+" different "+noun)+" for "+def.name+".";
    if(chosen.some(function(x){ return isSkill(x) && hasProf(ctx, x); })) return "Pick "+noun+" you're not already proficient in.";
  }
  var tn = def.toolPicks ? def.toolPicks.count : 0;
  var tools = (picks.tools||[]).slice(0, tn).filter(function(x){ return featToolChoices(def).indexOf(x)!==-1; });
  if(tools.length < tn || new Set(tools).size < tn) return "Pick "+(tn===1 ? "a tool" : tn+" different tools")+" for "+def.name+".";
  var ln = def.languagePicks || 0;
  var langs = (picks.languages||[]).slice(0, ln).filter(Boolean);
  if(langs.length < ln || new Set(langs).size < ln) return "Pick "+(ln===1 ? "a language" : ln+" different languages")+" for "+def.name+".";
  var knownLang = langs.find(function(l){ return knowsLanguage(ctx, l) || (def.languages||[]).indexOf(l)!==-1; });
  if(knownLang) return "You already know "+knownLang+". Pick another language.";
  var exp = (picks.expertise||[]).slice(0, def.expertise||0).filter(Boolean);
  if(exp.length < (def.expertise||0)) return "Pick a skill for "+def.name+"'s expertise.";
  if(exp.some(function(x){ return expertiseReason(ctx, picks, x); })) return "Pick a skill you're proficient in and don't already have expertise in.";
  var w = def.weapons || 0;
  var weapons = (picks.weapons||[]).slice(0, w).filter(Boolean);
  if(weapons.length < w || new Set(weapons).size < w) return "Pick "+w+" different weapons for "+def.name+".";
  var groups = featSpellGroups(def, picks, ctx), allSpells = [];
  for(var gi = 0; gi < groups.length; gi++){
    var sp = groups[gi];
    var spells = (picks.spells||[]).slice(sp.offset, sp.offset + sp.count).filter(function(x){ return sp.options.indexOf(x)!==-1; });
    if(spells.length < sp.count || new Set(spells).size < sp.count || spells.some(function(x){ return allSpells.indexOf(x)!==-1; }))
      return "Pick "+(sp.count===1 ? aOrAn(sp.label) : sp.count+" different "+sp.plural)+" for "+def.name+".";
    allSpells = allSpells.concat(spells);
    // A spell being learned as a class spell in the same level-up.
    var clash = ctx && ctx.spellTaken && spells.find(function(x){ return ctx.spellTaken(x); });
    if(clash) return clash+" is already one of the spells you're learning this level. Pick another for "+def.name+", or go back and learn a different spell.";
  }
  if(def.optionPicks){
    var op = def.optionPicks, set = optionSetDef(op.set), choices = featOptionChoices(def);
    var opts = (picks.options||[]).slice(0, op.count).filter(function(x){ return choices.indexOf(x)!==-1; });
    if(opts.length < op.count || new Set(opts).size < op.count) return "Pick "+op.count+" different "+set.noun+"s for "+def.name+".";
    var known = ctx && ctx.optionsKnown ? ctx.optionsKnown(op.set) : [];
    var dup = opts.find(function(x){ return known.indexOf(x)!==-1; });
    if(dup) return "You already know "+dup+". Pick another "+set.noun+".";
    var optional = opts.find(function(x){ var o = set.options.find(function(y){ return y.name===x; }); return o && o.optional && !(ctx && ctx.tasha); });
    if(optional) return optional+" is one of Tasha's optional "+set.noun+"s, which this character doesn't use. Pick another.";
  }
  return "";
}
function hasProf(ctx, skill){ var e = ctx && ctx.skillProfs && ctx.skillProfs[skill]; return !!(e && e.prof); }
function knowsLanguage(ctx, lang){
  var lower = (lang||"").toLowerCase();
  return ((ctx && ctx.languages) || []).some(function(l){ return (l||"").toLowerCase()===lower; });
}
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
  if(picks.option) bits.push(picks.option);
  if(picks.ability) bits.push(abilityName(picks.ability)+" +1"+(def.saveProf ? " and its saving throw" : ""));
  (picks.skills||[]).filter(Boolean).forEach(function(s){ bits.push(s); });
  (picks.expertise||[]).filter(Boolean).forEach(function(s){ bits.push("expertise in "+s); });
  (picks.weapons||[]).filter(Boolean).forEach(function(s){ bits.push(s); });
  (picks.tools||[]).filter(Boolean).forEach(function(s){ bits.push(s); });
  (def.languages||[]).concat((picks.languages||[]).filter(Boolean)).forEach(function(s){ bits.push(s); });
  featSpellEntries(def, picks).forEach(function(e){ bits.push(e.name); });
  (picks.options||[]).filter(Boolean).forEach(function(s){ bits.push(s); });
  if(picks.castAbility) bits.push("spells cast with "+abilityName(picks.castAbility));
  return bits.join(", ");
}

/* Apply the picks to the character (feat is its copy, already in c.feats).
   Picks made before are taken back first, so finishing or changing them
   (a Weapon Master taken before weapon picks existed) never doubles up. */
export function applyFeatPicks(c, feat, picks){
  var def = featDef(feat.name);
  if(!featHasPicks(def)) return;
  revertFeatPicks(c, feat);
  feat.picks = {ability: picks.ability||"", skills: (picks.skills||[]).filter(Boolean), expertise: (picks.expertise||[]).filter(Boolean),
    weapons: (picks.weapons||[]).filter(Boolean), option: picks.option||"", spells: (picks.spells||[]).filter(Boolean),
    options: (picks.options||[]).filter(Boolean), castAbility: picks.castAbility||"",
    tools: (picks.tools||[]).filter(Boolean), languages: (picks.languages||[]).filter(Boolean)};
  var applied = {abilities:{}, skills:[], expertise:[], weaponItems:[], languages:[]};
  var k = feat.picks.ability;
  if(k){
    var was = Number(c.abilities[k])||10, now = Math.min(20, was + 1);
    if(now !== was){ c.abilities[k] = now; applied.abilities[k] = now - was; }
  }
  if(!c.skillProfs) c.skillProfs = {};
  // An invocation's skills (Eldritch Adept: Beguiling Influence) too.
  var inv = def.invocationPick && invocationDef(feat.picks.option);
  feat.picks.skills.filter(isSkill).concat((inv && inv.skills) || []).forEach(function(sk){
    var entry = c.skillProfs[sk] || {prof:false, expertise:false};
    if(!entry.prof){ entry.prof = true; applied.skills.push(sk); }
    c.skillProfs[sk] = entry;
  });
  feat.picks.expertise.forEach(function(sk){
    var entry = c.skillProfs[sk] || {prof:false, expertise:false};
    if(!entry.expertise){ entry.expertise = true; applied.expertise.push(sk); }
    c.skillProfs[sk] = entry;
  });
  // Weapons already carried become proficient.
  (c.inventory||[]).forEach(function(item){
    if(item.type==="weapon" && !item.proficient && item.id && feat.picks.weapons.indexOf(item.name)!==-1){
      item.proficient = true; applied.weaponItems.push(item.id);
    }
  });
  // Languages the character doesn't speak yet.
  (def.languages||[]).concat(feat.picks.languages).forEach(function(lang){
    if(!Array.isArray(c.languages)) c.languages = ["Common"];
    if(knowsLanguage(c, lang)) return;
    c.languages.push(lang); applied.languages.push(lang);
  });
  // Fighting Initiate's style: a style feature like a class's, so its
  // bonus is worked out the same way.
  if(def.stylePick && feat.picks.option){
    var style = makeStyleFeature(feat.picks.option, {options: feat.picks.options, spells: []});
    style.id = uid(); style.source = "Feat · " + feat.name;
    if(!Array.isArray(c.features)) c.features = [];
    c.features.push(style);
    applied.featureId = style.id;
  }
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
  (c.inventory||[]).forEach(function(item){ if((a.weaponItems||[]).indexOf(item.id)!==-1) item.proficient = false; });
  if((a.languages||[]).length) c.languages = (c.languages||[]).filter(function(l){ return a.languages.indexOf(l)===-1; });
  var style = a.featureId && (c.features||[]).find(function(f){ return f.id===a.featureId; });
  if(style) c.features = c.features.filter(function(f){ return f!==style; });
  delete feat.applied;
  return bits.concat(a.skills||[], (a.expertise||[]).map(function(s){ return "expertise in "+s; }), a.languages||[], style ? [style.name] : []).join(", ");
}
/* What removing this feat would take back, for the confirm dialog. */
export function featAppliedSummary(feat){
  var a = feat && feat.applied;
  if(!a) return "";
  return Object.keys(a.abilities||{}).map(function(k){ return abilityName(k)+" +"+a.abilities[k]; })
    .concat(a.skills||[], (a.expertise||[]).map(function(s){ return "expertise in "+s; }), a.languages||[], a.featureId ? ["its fighting style"] : []).join(", ");
}
/* A feat whose picks were never made (taken before the sheet applied
   them, or added from the Compendium and the picker closed), or whose
   weapons are missing (a Weapon Master from before weapon picks), or
   that has grown a pick: a Rune Shaper's next rune when the proficiency
   bonus goes up (c, the character, sizes that one). */
export function featPicksPending(feat, c){
  var def = featDef(feat.name);
  if(!featHasPicks(def)) return false;
  if(!feat.picks) return true;
  if(feat.picks.manual) return false;
  var spellsDue = featSpellGroups(def, feat.picks, {pb: c ? profBonus(c) : 2}).reduce(function(n, g){ return n + g.count; }, 0);
  return (!!def.weapons && (feat.picks.weapons||[]).length < def.weapons) ||
    (feat.picks.spells||[]).length < spellsDue ||
    (!!def.optionPicks && (feat.picks.options||[]).length < def.optionPicks.count);
}

/* Proficiencies feats grant: armor (Moderately Armored), tools (Skilled),
   weapons (Weapon Master) and saving throws (Resilient), each tagged with
   the feat's name. */
export function featProficiencies(c){
  var out = {armor:[], tools:[], weapons:[], saves:[]};
  (c.feats||[]).forEach(function(feat){
    var def = featDef(feat.name);
    if(!def) return;
    (def.armor||[]).forEach(function(a){ out.armor.push({name:a, feat:feat.name}); });
    (def.tools||[]).forEach(function(t){ out.tools.push({name:t, feat:feat.name}); });
    (def.weaponProfs||[]).forEach(function(w){ out.weapons.push({name:w, feat:feat.name}); });
    if(!feat.picks) return;
    (feat.picks.tools||[]).forEach(function(x){ out.tools.push({name:x, feat:feat.name}); });
    (feat.picks.skills||[]).forEach(function(x){ if(!isSkill(x)) out.tools.push({name:x, feat:feat.name}); });
    (feat.picks.weapons||[]).forEach(function(x){ out.weapons.push({name:x, feat:feat.name}); });
    if(def.saveProf && feat.picks.ability) out.saves.push({ability:feat.picks.ability, feat:feat.name});
  });
  return out;
}
