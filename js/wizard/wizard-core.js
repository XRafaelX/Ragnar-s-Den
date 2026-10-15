import { ABILITIES, SKILLS, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, CLASS_PROFICIENCIES, FIGHTING_STYLES } from "../data/classes.js";
import { FEATS_CATALOG, CAMPAIGN_FEATS } from "../data/feats.js";
import { BACKGROUND_INFO, BACKGROUND_LANGUAGES, BACKGROUND_LANGUAGE_RULES } from "../data/backgrounds.js";
import { RACE_LANGUAGES, RACE_LANGUAGES_FALLBACK, RACE_CHOICES } from "../data/races.js";
import { LANGUAGES } from "../data/languages.js";
import { RACE_DATA } from "../data/race-data.js";
import { mod, ce, uid, wizardScrollSave, wizardScrollRestore, wizardScrollReset, maxHp, featureSpells, classSpellChoices, classExtraSpellLists, classVariants, classFeaturesAt } from "../core/helpers.js";
import { catalogSpellName, spellDataForClass } from "../data/spells.js";
import { newCharacter } from "../core/character.js";
import { featPicksProblem, applyFeatPicks, featNeedsChoice, featRequiresReason, featHasPicks, featDef, emptyPicks, backgroundFeatGrant, backgroundFeatCopy, backgroundFeatPicks, campaignLevel1Feats, campaignFeatCopy } from "../core/feat-picks.js";
import { stylePicksProblem, makeStyleFeature } from "../core/fighting-styles.js";
import { entryGrants, grantHasChoices, classPickContext, classPicksProblem, fillSlots, applyClassPicks, raceGrantsFor, raceGrants, raceEntry,
  backgroundGrantsFor, backgroundGrants, backgroundEntry, overlapGrants, overlapEntry } from "../core/class-picks.js";
import { state, save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { closeSidebarMobile } from "../ui/mobile-nav.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { playNewCharacter, playToukellienmeli } from "../ui/sound.js";
import { characterBorn } from "../ui/fx.js";
import { SPELL_DATA } from "../data/spells.js";
import { spellFromCatalog } from "../render/panels/spell-picker.js";
import { preparedAt } from "../data/spells-known.js";
import {
  buildEquipmentList,
  wizardStepClass, wizardStepRace, wizardStepBackground, wizardStepAlignment,
  wizardStepAbilities, wizardStepSkills, wizardStepRaceChoices, wizardStepFeat, wizardStepFeatPicks, wizardStepBgFeat, wizardStepChoices, wizardStepLanguages, wizardStepEquipment, wizardStepCantrips, wizardStepSpells, wizardStepReview,
  expertiseOptions, resetHomebrewPickers
} from "./wizard-steps.js";
import { makeMoveLeftSvg, makeMoveRightSvg, makeAlertSvg } from "../ui/svg-icons.js";

/* ---------------- Character Creation Wizard ---------------- */
export var WIZARD_STEP_IDS = ["class","race","background","alignment","abilities","skills","raceChoices","feat","featPicks","bgFeat","choices","languages","equipment","cantrips","spells","review"];
export var wizardState = null;

export function currentClassInfo(){ return wizardState && CLASSES_INFO[wizardState.classId]; }

/* The class's level-1 subclass pick (Cleric's Divine Domain), if it has one. */
export function subclassChoice(info){
  return ((info && info.choices)||[]).find(function(ch){ return ch.kind==="subclass"; }) || null;
}
/* What the chosen subclass adds at creation (see `grants` in classes.js). */
export function subclassGrants(info, picks){
  var ch = subclassChoice(info);
  var v = ch && picks[ch.id];
  return (v && ch.grants && ch.grants[v]) || {};
}
/* The level-1 class entry being built, with a level-1 subclass (Warlock
   patron, Sorcerous Origin) and its spell picks (genie kind, Divine
   Soul affinity), so the sheet's own spell helpers can read it. */
function wizardClassEntry(subclass){
  var ch = subclassChoice(currentClassInfo());
  // Picks made for its features (an Arcana cleric's wizard cantrips), in
  // the sheet's shape.
  var profPicks = {}, made = wizardState.classChoices.profPicks || {};
  Object.keys(made).forEach(function(key){ profPicks[key] = {slots: made[key]}; });
  return {name: wizardState.classId, level: 1,
    subclass: subclass!=null ? subclass : (ch && wizardState.classChoices[ch.id]) || "",
    spellChoices: wizardState.classChoices.spellChoices || {}, profPicks: profPicks, variants: wizardVariants()};
}
/* Tasha's replacement features the class offers (a ranger's Favored Foe
   and Deft Explorer), and the ones taken: only with Tasha's switch on. */
export function wizardVariantOffers(){
  return wizardState && wizardState.classId ? classVariants(wizardState.classId) : [];
}
export function wizardVariants(){
  var out = {}, picked = wizardState.classChoices.variants || {};
  if(wizardState.tashaOptional) wizardVariantOffers().forEach(function(v){ if(picked[v.replaces]===v.name) out[v.replaces] = v.name; });
  return out;
}
/* The class's own level-1 features, with those swapped in. */
export function wizardLevel1Features(){
  return classFeaturesAt(wizardClassEntry(), 1);
}
/* What the class's and chosen subclass's level-1 features give beyond
   armor and weapons (see js/core/class-picks.js): a ranger's favored
   enemy and terrain, an Order cleric's skill, a Knowledge cleric's skills
   and languages, a Storm sorcerer's Primordial.
   Picks are kept in classChoices.profPicks[key], one list per slot. */
export function wizardClassGrants(){
  return wizardState && wizardState.classId ? entryGrants(wizardClassEntry(), false) : [];
}
export function wizardPickSlots(key){
  var all = wizardState.classChoices.profPicks = wizardState.classChoices.profPicks || {};
  return all[key] = all[key] || [];
}
/* The new character as those pickers see it: the skills picked so far,
   the feats' skills and languages, the race's and class's languages.
   What another of the subclass's features picked is greyed out. */
export function wizardPickContext(grant){
  var w = wizardState, info = currentClassInfo() || {}, entry = wizardClassEntry();
  var feat = isStepApplicable("feat") && wizardFeat(), bg = wizardBackgroundFeat();
  var feats = (feat ? [{name: feat.name, picks: w.raceChoices.featPicks || {}}] : [])
    .concat(bg && bg.def ? [{name: bg.def.name, picks: wizardBackgroundFeatPicks() || {}}] : []);
  var profs = wizardSkillProfs(), saves = {};
  var languages = (RACE_LANGUAGES[w.race] || RACE_LANGUAGES_FALLBACK).fixed.concat(info.languages || [], subclassGrants(info, w.classChoices).languages || []);
  feats.forEach(function(f){
    (f.picks.skills||[]).forEach(function(sk){ if(sk) profs[sk] = profs[sk] || {prof:true, expertise:false}; });
    (f.picks.expertise||[]).forEach(function(sk){ if(sk) profs[sk] = {prof:true, expertise:true}; });
    languages = languages.concat((featDef(f.name) || {}).languages || [], f.picks.languages || []);
  });
  (info.savingThrows||[]).forEach(function(k){ saves[k] = true; });
  var ctx = classPickContext({classes:[entry], skillProfs:profs, saveProfs:saves, languages:languages.filter(Boolean), feats:feats, inventory:[], spells:[],
    tashaOptional:!!w.tashaOptional}, entry, grant.key);
  ctx.taken = function(v){
    return wizardClassGrants().some(function(g){
      return g.key!==grant.key && ((w.classChoices.profPicks||{})[g.key] || []).some(function(slot){ return (slot||[]).indexOf(v)!==-1; });
    }) ? "picked" : "";
  };
  return ctx;
}
/* ---- Race Traits picks ----
   What the race's traits give (an elf's Perception, a dwarf's weapons)
   and the ones that ask for a choice (a dwarf's tool, a kenku's two
   skills, a hobgoblin's two martial weapons; see raceGrantsFor). Picks
   are kept in raceChoices.profPicks[key], one list per slot. */
export function wizardRaceGrants(){
  var grants = wizardState && wizardState.race ? raceGrantsFor(wizardState.race) : [];
  // A choice the Race Traits ability picks already make (a shifter's type)
  // is copied in, not asked for again.
  grants.forEach(function(g){
    if(!g.def.presetChoice) return;
    var slots = wizardRaceSlots(g.key), preset = wizardState.raceChoices.preset;
    slots[0] = preset ? [preset] : [];
    slots[1] = preset && g.def.pick[1] && g.def.pick[1].byChoice ? (g.def.pick[1].byChoice.options[preset] || []).slice() : [];
  });
  return grants;
}
export function wizardRacePickGrants(){ return wizardRaceGrants().filter(function(g){ return grantHasChoices(g.def) && !g.def.presetChoice; }); }
export function wizardRaceSlots(key){
  var all = wizardState.raceChoices.profPicks = wizardState.raceChoices.profPicks || {};
  return all[key] = all[key] || [];
}
var SKILL_NAMES = SKILLS.map(function(s){ return s[0]; });
/* Skills the race gives: outright, and picked so far (leaving out one
   grant's picks, for its own pickers). fixedOnly: just the given ones. */
export function wizardRaceSkills(exceptKey, fixedOnly){
  var out = [], picks = wizardState.raceChoices.profPicks || {};
  wizardRaceGrants().forEach(function(g){
    out = out.concat(g.def.skills || []);
    if(fixedOnly || g.key===exceptKey) return;
    (picks[g.key] || []).forEach(function(slot){ (slot||[]).forEach(function(v){ if(SKILL_NAMES.indexOf(v)!==-1) out.push(v); }); });
  });
  return out.filter(function(sk, i){ return out.indexOf(sk)===i; });
}
/* The new character as a race pick's pickers see it: its class, the
   skills picked so far and what the race's other traits give. */
export function wizardRacePickContext(grant){
  var w = wizardState, held = {}, picks = w.raceChoices.profPicks || {};
  Object.keys(picks).forEach(function(k){ held[k] = {slots: picks[k]}; });
  var standIn = {race: w.race, racePicks: {profPicks: held}, classes: w.classId ? [wizardClassEntry()] : [], skillProfs: wizardSkillProfs(grant.key),
    saveProfs: {}, languages: [], feats: [], inventory: [], spells: [], tashaOptional: !!w.tashaOptional};
  return classPickContext(standIn, standIn.racePicks, grant.key);
}
/* What's still missing from the race's picks, or "". */
export function wizardRacePicksProblem(){
  var grants = wizardRacePickGrants();
  for(var i = 0; i < grants.length; i++){
    var ctx = wizardRacePickContext(grants[i]);
    var why = classPicksProblem(grants[i], fillSlots(grants[i].def, wizardRaceSlots(grants[i].key), ctx), ctx);
    if(why) return why;
  }
  return "";
}

/* ---- Background tool picks ----
   The tools a background gives (BACKGROUND_PROFS: a Criminal's thieves'
   tools) and the ones it lets you choose (a gaming set, an instrument, a
   House Agent's house), asked on the Skills step. Picks are kept in
   bgPicks[key], one list per slot. */
export function wizardBackgroundGrants(){ return wizardState && wizardState.background ? backgroundGrantsFor(wizardState.background) : []; }
export function wizardBackgroundPickGrants(){ return wizardBackgroundGrants().filter(function(g){ return grantHasChoices(g.def); }); }
export function wizardBgSlots(key){
  var all = wizardState.bgPicks = wizardState.bgPicks || {};
  return all[key] = all[key] || [];
}
/* The new character as a background pick's pickers see it: its class's
   tools, the race's and the background's own given ones. */
export function wizardBgPickContext(grant){
  var w = wizardState, held = {}, picks = w.bgPicks || {}, raceHeld = {};
  Object.keys(picks).forEach(function(k){ held[k] = {slots: picks[k]}; });
  Object.keys(w.raceChoices.profPicks || {}).forEach(function(k){ raceHeld[k] = {slots: w.raceChoices.profPicks[k]}; });
  var standIn = {race: w.race, racePicks: {profPicks: raceHeld}, background: w.background, backgroundPicks: {profPicks: held},
    classes: w.classId ? [wizardClassEntry()] : [], skillProfs: wizardSkillProfs(), saveProfs: {},
    languages: (RACE_LANGUAGES[w.race] || RACE_LANGUAGES_FALLBACK).fixed.slice(), feats: [], inventory: [], spells: [], tashaOptional: !!w.tashaOptional};
  return classPickContext(standIn, standIn.backgroundPicks, grant.key);
}
/* What's still missing from the background's picks, or "". */
export function wizardBackgroundPicksProblem(){
  var grants = wizardBackgroundPickGrants();
  for(var i = 0; i < grants.length; i++){
    var ctx = wizardBgPickContext(grants[i]);
    var why = classPicksProblem(grants[i], fillSlots(grants[i].def, wizardBgSlots(grants[i].key), ctx), ctx);
    if(why) return why;
  }
  return "";
}
/* ---- Given twice ----
   A skill or tool two sources give outright (an elf's Perception and a
   Far Traveler's) earns a pick of another (see overlapGrants), asked at
   the bottom of the Skills step. Picks are kept in overlapPicks[key]. */
function wizardStandIn(){
  var w = wizardState, held = {}, raceHeld = {}, twice = {};
  Object.keys(w.bgPicks || {}).forEach(function(k){ held[k] = {slots: w.bgPicks[k]}; });
  Object.keys(w.raceChoices.profPicks || {}).forEach(function(k){ raceHeld[k] = {slots: w.raceChoices.profPicks[k]}; });
  Object.keys(w.overlapPicks || {}).forEach(function(k){ twice[k] = {slots: w.overlapPicks[k]}; });
  return {race: w.race, racePicks: {profPicks: raceHeld}, background: w.background, backgroundPicks: {profPicks: held}, overlapPicks: {profPicks: twice},
    classes: w.classId ? [wizardClassEntry()] : [], skillProfs: wizardSkillProfs(null, true), saveProfs: {},
    languages: (RACE_LANGUAGES[w.race] || RACE_LANGUAGES_FALLBACK).fixed.slice(), feats: [], inventory: [], spells: [], tashaOptional: !!w.tashaOptional};
}
export function wizardOverlapGrants(){ return wizardState && wizardState.classId ? overlapGrants(wizardStandIn()) : []; }
export function wizardOverlapSlots(key){
  var all = wizardState.overlapPicks = wizardState.overlapPicks || {};
  return all[key] = all[key] || [];
}
export function wizardOverlapContext(grant){
  var standIn = wizardStandIn();
  return classPickContext(standIn, standIn.overlapPicks, grant.key);
}
export function wizardOverlapProblem(){
  var grants = wizardOverlapGrants();
  for(var i = 0; i < grants.length; i++){
    var ctx = wizardOverlapContext(grants[i]);
    var why = classPicksProblem(grants[i], fillSlots(grants[i].def, wizardOverlapSlots(grants[i].key), ctx), ctx);
    if(why) return why;
  }
  return "";
}

/* Languages picked for the background in place of a tool (a Guild
   Merchant's extra language). */
function wizardBackgroundLanguages(){
  var out = [], standard = LANGUAGES.Standard.concat(LANGUAGES.Exotic);
  wizardBackgroundPickGrants().forEach(function(g){
    ((wizardState.bgPicks||{})[g.key] || []).forEach(function(slot, i){
      if(((g.def.pick||[])[i] || {}).kind==="toolOrLanguage") out = out.concat((slot||[]).filter(function(v){ return standard.indexOf(v)!==-1; }));
    });
  });
  return out;
}

/* Languages those features teach: given outright or picked. */
function wizardClassLanguages(){
  var out = [], standard = LANGUAGES.Standard.concat(LANGUAGES.Exotic);
  wizardClassGrants().forEach(function(g){
    out = out.concat(g.def.languages || []);
    ((wizardState.classChoices.profPicks||{})[g.key] || []).forEach(function(slot, i){
      var kind = ((g.def.pick||[])[i] || {}).kind;
      if(kind==="language" || kind==="skillOrLanguage") out = out.concat((slot||[]).filter(function(v){ return standard.indexOf(v)!==-1; }));
    });
  });
  return out;
}
/* Spell choices the chosen subclass asks for at level 1: [{feature, choice, pick}]. */
export function wizardSpellChoices(){
  return classSpellChoices(wizardClassEntry());
}
/* Spells a subclass adds to the list the character can learn at level 1
   (a warlock patron's expanded list), as catalog names. */
export function wizardExpandedSpells(subclass){
  return featureSpells({classes: [wizardClassEntry(subclass)]})
    .filter(function(fs){ return fs.kind==="expanded"; })
    .map(function(fs){ return catalogSpellName(fs.name); });
}
/* Spells the character being built already gets from its features, as
   [{name, source}] with catalog names: the subclass's (domain spells, a
   Divine Soul's affinity spell) and the Race Traits feat's (Fey Touched's
   Misty Step and its picked spell). The Cantrips and Spells steps leave
   them out, so a class pick isn't spent on a spell the character has. */
export function wizardGrantedSpells(){
  var feat = isStepApplicable("feat") && wizardFeat(), bg = wizardBackgroundFeat();
  var standIn = {classes: [wizardClassEntry()], abilities: finalAbilities(),
    feats: (feat ? [{name: feat.name, picks: wizardState.raceChoices.featPicks || {}}] : [])
      .concat(bg && bg.def ? [{name: bg.def.name, picks: wizardBackgroundFeatPicks()}] : [])};
  return featureSpells(standIn).filter(function(fs){ return fs.kind!=="expanded"; })
    .map(function(fs){ return {name: catalogSpellName(fs.name), source: fs.source}; });
}
/* Drops class picks the features now grant (the feat's spell was changed
   to one already picked). In place: the pick grids hold these arrays. */
export function dropGrantedSpellPicks(){
  var granted = wizardGrantedSpells().map(function(g){ return g.name; });
  [wizardState.spellChoices.cantrips, wizardState.spellChoices.spells].forEach(function(list){
    for(var i=list.length-1;i>=0;i--) if(granted.indexOf(list[i])!==-1) list.splice(i, 1);
  });
}
/* Spells from other classes' lists the chosen subclass opens (a Divine
   Soul sorcerer can pick cleric spells), as catalog names. */
export function wizardExtraListSpells(){
  var out = [];
  classExtraSpellLists(wizardClassEntry()).forEach(function(list){ out = out.concat(Object.keys(spellDataForClass(list, !!wizardState.tashaOptional))); });
  return out;
}
/* Which list an extra spell comes from, for its tag in the picker. */
export function wizardExtraListName(){
  return classExtraSpellLists(wizardClassEntry())[0] || "";
}
/* Some gear needs a proficiency only certain subclasses give (a cleric's
   chain mail needs a heavy-armor domain). */
export function equipmentOptionAvailable(opt){
  if(!opt.requires) return true;
  var grants = subclassGrants(currentClassInfo(), wizardState.classChoices);
  return (grants.profs||[]).indexOf(opt.requires)!==-1;
}
/* Race picks (Variant Human): what the race lets you choose, if anything. */
export function raceChoiceDef(){ return wizardState && RACE_CHOICES[wizardState.race] || null; }

/* The race's ability increases as {ability: amount}: its fixed ones
   (Hill Dwarf +2 CON, +1 WIS) plus what's picked on Race Traits, either
   one ability per abilityBonus amount or an abilityPreset option.
   fixedOnly leaves the picks out. */
export function raceAbilityIncreases(opts){
  var out = {};
  function add(k, n){ if(n) out[k] = (out[k]||0) + n; }
  var race = RACE_DATA[wizardState.race];
  var fixed = race && race.asi || {};
  Object.keys(fixed).forEach(function(k){ add(k, Number(fixed[k])||0); });
  if(opts && opts.fixedOnly) return out;
  var def = raceChoiceDef(), rc = wizardState.raceChoices;
  if(def && def.abilityBonus){
    var amounts = def.abilityBonus.amounts, exclude = def.abilityBonus.exclude || [];
    var picks = rc.abilities.slice(0, amounts.length);
    picks.forEach(function(k, i){
      if(k && picks.indexOf(k)===i && exclude.indexOf(k)===-1) add(k, amounts[i]);
    });
  }
  var preset = def && def.abilityPreset && def.abilityPreset.options[rc.preset];
  Object.keys(preset || {}).forEach(function(k){ add(k, preset[k]); });
  return out;
}

/* The scores the character will actually have: the base scores from the
   Ability Scores step plus the race's increases (kept within 1 to 20),
   plus the Race Traits feat's +1. Everything downstream (HP, AC, spell
   counts, the review) reads these. withoutFeat leaves the feat's +1 out:
   for feat prerequisites, and for the finished sheet, where
   applyFeatPicks adds it and records it so removing the feat takes it
   back. */
export function finalAbilities(opts){
  var out = {};
  Object.keys(wizardState.abilities).forEach(function(k){ out[k] = wizardState.abilities[k]; });
  var inc = raceAbilityIncreases();
  Object.keys(inc).forEach(function(k){ out[k] = Math.max(1, Math.min(20, (Number(out[k])||10) + inc[k])); });
  var def = raceChoiceDef();
  var fp = def && def.feat && !(opts && opts.withoutFeat) && wizardState.raceChoices.featPicks;
  if(fp && fp.ability) out[fp.ability] = Math.min(20, (Number(out[fp.ability])||10) + 1);
  return out;
}
/* Skills the chosen background gives: its fixed ones plus the player's
   picks from its `skillPick` list (a Haunted One's two of four). Picks
   that don't fit the background (it was changed since) are left out. */
export function wizardBackgroundSkills(){
  var info = BACKGROUND_INFO[wizardState.background] || {};
  var pick = info.skillPick;
  var picks = pick ? (wizardState.bgSkillChoices||[]).filter(function(sk){ return pick.options.indexOf(sk)!==-1; }).slice(0, pick.count) : [];
  return (info.skills||[]).concat(picks);
}

/* The new character's skills so far (class picks, background, what the
   race gives and its Race Traits picks), in the sheet's skillProfs shape,
   for feat picks. exceptRaceKey leaves out one race grant's picks. */
export function wizardSkillProfs(exceptRaceKey, noReplacements){
  var out = {};
  var raceSkills = wizardState.race ? wizardRaceSkills(exceptRaceKey) : [];
  // And skills picked in place of one given twice.
  var instead = noReplacements ? [] : ((wizardState.overlapPicks || {})["overlap:skills"] || []).reduce(function(a, s){ return a.concat(s || []); }, []);
  wizardState.skillChoices.concat(wizardBackgroundSkills(), raceSkills, instead).forEach(function(sk){
    if(sk) out[sk] = {prof:true, expertise:false};
  });
  return out;
}

/* Why the new character can't take a feat yet ("" if they can): its race,
   a level or feat it needs first, ability minimums, a Spellcasting
   feature, or armor proficiency. */
var ABILITY_WORDS = {Strength:"str", Dexterity:"dex", Constitution:"con", Intelligence:"int", Wisdom:"wis", Charisma:"cha"};
export function featPrereqReason(feat){
  var blocked = featRequiresReason(feat, {race: wizardState.race, level: 1, feats: []});
  if(blocked) return blocked;
  var bg = wizardBackgroundFeat();
  if(bg && bg.def===feat && !feat.repeatable) return bg.campaign ? "it's your campaign feat" : "your background already gives it";
  var req = feat.prerequisite || "None";
  if(req==="None") return "";
  var ab = finalAbilities({withoutFeat:true}), info = currentClassInfo() || {};
  var m = /^(.+?) 13 or higher$/.exec(req);
  if(m){
    var keys = m[1].split(" or ").map(function(w){ return ABILITY_WORDS[w.trim()]; });
    return keys.some(function(k){ return (ab[k]||0) >= 13; }) ? "" : "needs "+keys.map(function(k){ return k.toUpperCase(); }).join(" or ")+" 13";
  }
  if(req==="The ability to cast at least one spell") return info.spellcasting ? "" : "needs spellcasting";
  m = /^Proficiency with (light|medium|heavy) armor$/.exec(req);
  if(m){
    var armor = ((CLASS_PROFICIENCIES[wizardState.classId]||{}).armor||[]).map(function(a){ return a.toLowerCase(); });
    var has = armor.indexOf("all armor")!==-1 || armor.indexOf(m[1]+" armor")!==-1 ||
      (m[1]==="heavy" && (subclassGrants(info, wizardState.classChoices).profs||[]).indexOf("heavy")!==-1);
    return has ? "" : "needs "+m[1]+" armor";
  }
  return "";
}

/* Languages the new character knows: `fixed` ones come automatically
   (race, class, subclass); `slots` are free picks, each tagged with where
   it comes from (race, background), with `options` when it must come
   from a short list (a Boros Legionnaire's). `fromClass` are the fixed
   ones only a class or subclass feature gives or picked (Class Features
   step: a ranger's favored enemy's language) or the background's picks
   give (a Guild Merchant's extra language), which the sheet records with
   that feature. */
export function languagePlan(){
  var w = wizardState, info = currentClassInfo();
  var race = RACE_LANGUAGES[w.race] || RACE_LANGUAGES_FALLBACK;
  var grants = subclassGrants(info, w.classChoices);
  var fixed = [];
  function addFixed(l){ if(fixed.indexOf(l)===-1) fixed.push(l); }
  race.fixed.forEach(addFixed);
  // Languages the Race Traits feat teaches (Linguist's three).
  var feat = isStepApplicable("feat") && wizardFeat(), fp = feat && w.raceChoices.featPicks;
  if(feat) (feat.languages||[]).concat((fp && fp.languages)||[]).filter(Boolean).forEach(addFixed);
  ((info && info.languages)||[]).forEach(addFixed);
  (grants.languages||[]).forEach(addFixed);
  var slots = [];
  function addSlots(n, source, help, exotic){ for(var i=0;i<(n||0);i++) slots.push({source:source, help:help||"", exotic:!!exotic}); }
  addSlots(race.choose, w.race || "Race", race.note);
  // Languages the background names (a Rune Carver's Giant); one already
  // known becomes a free pick instead.
  var bgRules = BACKGROUND_LANGUAGE_RULES[w.background] || {};
  var bgExtra = 0;
  (bgRules.fixed||[]).forEach(function(l){ if(fixed.indexOf(l)!==-1) bgExtra++; else addFixed(l); });
  // A Haunted One's first pick has to be an exotic language.
  var bgCount = (BACKGROUND_LANGUAGES[w.background]!=null ? BACKGROUND_LANGUAGES[w.background] : 0) + bgExtra;
  var bgExotic = Math.min(bgCount, (BACKGROUND_INFO[w.background]||{}).exoticLanguages || 0);
  addSlots(bgExotic, w.background, bgExotic ? (bgExotic===bgCount ? "These must be exotic languages." : "The first must be an exotic language, such as the tongue of whatever haunts you.") : "", true);
  // A Ravnica guild's language comes from a short list.
  var before = slots.length;
  addSlots(bgCount - bgExotic, w.background, bgRules.options ? "Choose from " + bgRules.options.join(", ") + "." : "");
  if(bgRules.options) slots.slice(before).forEach(function(s){ s.options = bgRules.options; });
  var fromClass = wizardClassLanguages().concat(wizardBackgroundLanguages()).filter(function(l, i, all){ return fixed.indexOf(l)===-1 && all.indexOf(l)===i; });
  return {fixed:fixed.concat(fromClass), slots:slots, fromClass:fromClass};
}

/* 1st-level spells to pick: a fixed number, or computed from the scores
   when a class's `spells` is a function. */
export function spellPickCount(sc){
  return typeof sc.spells==="function" ? sc.spells({abilities:finalAbilities()}) : sc.spells;
}

export function isStepApplicable(id){
  if(id==="cantrips" || id==="spells"){
    var info = currentClassInfo();
    return !!(info && info.spellcasting);
  }
  if(id==="choices"){
    // A class's own level-1 choices, a feature's proficiency or spell
    // picks (a ranger's favored enemy), or Tasha's replacement features.
    var ci = currentClassInfo();
    return !!(ci && ci.choices && ci.choices.length) || wizardClassGrants().some(function(g){ return grantHasChoices(g.def); }) || wizardVariantOffers().length > 0;
  }
  if(id==="languages") return languagePlan().slots.length > 0;
  // (Ability picks, a feat, or a trait's choice: a dwarf's tool, a kenku's skills.)
  if(id==="raceChoices") return !!raceChoiceDef() || wizardRacePickGrants().length > 0;
  // A race's feat (Variant Human) gets its own step, and the feat's own
  // picks (Fey Touched's spell, Skilled's skills) one more, only when it has any.
  if(id==="feat") return !!(raceChoiceDef() && raceChoiceDef().feat);
  if(id==="featPicks") return isStepApplicable("feat") && featNeedsChoice(wizardFeat());
  // A background's feat is given, not chosen; only its own picks need a step.
  // A campaign's feat is picked on that step too (Skilled or Tough).
  if(id==="bgFeat"){ var bg = wizardBackgroundFeat(); return !!bg && (!!bg.choices || featNeedsChoice(bg.def)); }
  return true;
}
/* The new character as the feat pickers see it. Its languages are only
   the race's fixed ones here: the Languages step comes later and leaves
   out whatever the feat teaches. */
export function wizardFeatContext(opts){
  var w = wizardState, info = currentClassInfo() || {};
  var profs = wizardSkillProfs();
  // The background's or campaign's feat comes after the race's, whose skills count as known.
  var racePicks = opts && opts.forBackgroundFeat && isStepApplicable("feat") && w.raceChoices.featPicks;
  if(racePicks) (racePicks.skills||[]).forEach(function(sk){ if(sk) profs[sk] = profs[sk] || {prof:true, expertise:false}; });
  var styleCh = (info.choices||[]).find(function(ch){ return ch.kind==="fightingStyle"; });
  var classStyle = styleCh && w.classChoices[styleCh.id];
  return {abilities: finalAbilities({withoutFeat:true}), skillProfs: profs, tasha: !!w.tashaOptional, pb: 2,
    languages: (RACE_LANGUAGES[w.race] || RACE_LANGUAGES_FALLBACK).fixed,
    styleReason: function(name){
      if(classStyle===name) return "known";
      return (FIGHTING_STYLES[name]||{}).optional && !w.tashaOptional ? "Tasha's optional" : "";
    }};
}
/* The feat the new character starts with besides a race's: the chosen
   background's, as {def, option}, or, when it gives none and a campaign
   that hands out feats is set (wizardState.campaign), the campaign's:
   {def, option:"", choices, campaign}, where def is the one picked from
   `choices` (null until then). Null when there is neither. */
export function wizardBackgroundFeat(){
  var w = wizardState;
  if(!w) return null;
  var own = backgroundFeatGrant(w.background);
  if(own) return own;
  var choices = campaignLevel1Feats(w.campaign, w.background);
  if(!choices.length) return null;
  return {def: choices.indexOf(w.campaignFeat)!==-1 ? featDef(w.campaignFeat) : null, option: "", choices: choices, campaign: w.campaign};
}
/* Its picks, kept in wizardState.bgFeat and started afresh when the
   background or the feat (and so the option the book fixes) changes. */
export function wizardBackgroundFeatPicks(){
  var g = wizardBackgroundFeat(), w = wizardState;
  if(!g || !g.def) return null;
  if(!w.bgFeat || w.bgFeat.background!==w.background || (w.bgFeat.name || g.def.name)!==g.def.name){
    w.bgFeat = {background: w.background, name: g.def.name, picks: g.campaign ? emptyPicks(g.def) : backgroundFeatPicks(w.background)};
  }
  return w.bgFeat.picks;
}
/* The feat picked for the race (Variant Human), or null. */
export function wizardFeat(){
  var name = wizardState && wizardState.raceChoices.feat;
  return name ? FEATS_CATALOG.find(function(f){ return f.name===name; }) || null : null;
}

export function wizardStepTitle(id){
  // The same step asks for a campaign's feat when the background has none.
  if(id==="bgFeat" && wizardBackgroundFeat() && wizardBackgroundFeat().campaign) return "Campaign Feat";
  return {
    class:"Choose a Class", race:"Choose a Race", background:"Choose a Background",
    alignment:"Choose an Alignment",
    abilities:"Ability Scores", skills:"Skills & Proficiencies", raceChoices:"Race Traits", feat:"Choose a Feat", featPicks:"Feat Choices", bgFeat:"Background Feat", choices:"Class Features", languages:"Languages", equipment:"Starting Equipment",
    cantrips:"Cantrips", spells:"Spells", review:"Review & Finish"
  }[id];
}

export function abilityFullName(key){
  var found = ABILITIES.find(function(a){ return a[0]===key; });
  return found ? found[1] : key;
}

export function wizardStepIndex(){ return WIZARD_STEP_IDS.indexOf(wizardState.step); }

export function goStep(delta){
  var idx = wizardStepIndex();
  var next = idx;
  do{
    next += delta;
  } while(next>=0 && next<WIZARD_STEP_IDS.length && !isStepApplicable(WIZARD_STEP_IDS[next]));
  if(next<0 || next>=WIZARD_STEP_IDS.length) return;
  wizardState.step = WIZARD_STEP_IDS[next];
  renderWizard();
}

export function validateStep(id){
  var info = currentClassInfo();
  if(id==="class") return (wizardState.classId && info && info.available) ? null : "Pick an available class to continue.";
  if(id==="race") return wizardState.race ? null : "Pick a race to continue.";
  if(id==="background") return wizardState.background ? null : "Pick a background to continue.";
  if(id==="alignment") return wizardState.alignment ? null : "Pick an alignment to continue.";
  if(id==="abilities"){
    if(!wizardState.abilityMethod) return "Pick a method for generating ability scores.";
    if(wizardState.abilityMethod==="roll"){
      var allAssigned = ABILITIES.every(function(a){ return wizardState.assignIdx[a[0]]!=null; });
      if(!allAssigned) return "Assign a score to every ability.";
    }
    return null;
  }
  if(id==="skills"){
    if(wizardState.skillChoices.length!==info.skillChoices.count) return "Choose "+info.skillChoices.count+" skills from your class list.";
    var bgInfo = BACKGROUND_INFO[wizardState.background] || {}, bgPick = bgInfo.skillPick;
    // A skill the race gives already (an elf's Perception) is a wasted pick.
    var fromRace = wizardRaceSkills(null, true);
    var dup = wizardState.skillChoices.find(function(sk){ return fromRace.indexOf(sk)!==-1; });
    if(dup) return "Your "+wizardState.race+" race already gives you "+dup+". Pick a different class skill.";
    if(bgPick){
      var bgPicked = wizardBackgroundSkills().slice((bgInfo.skills||[]).length);
      if(bgPicked.length!==bgPick.count) return "Choose "+(bgPick.count>1 ? bgPick.count+" skills" : "a skill")+" from your "+wizardState.background+" background.";
      if(bgPicked.some(function(sk){ return wizardState.skillChoices.indexOf(sk)!==-1; })) return "Pick different skills for your class and your background.";
    }
    // Then the background's tools (a Criminal's gaming set), and anything
    // given twice.
    return wizardBackgroundPicksProblem() || wizardOverlapProblem() || null;
  }
  if(id==="raceChoices"){
    var def = raceChoiceDef() || {}, rc = wizardState.raceChoices;
    if(def.abilityBonus){
      var n = def.abilityBonus.amounts.length, exclude = def.abilityBonus.exclude || [];
      var ab = rc.abilities.slice(0, n).filter(Boolean);
      if(ab.length!==n || new Set(ab).size!==ab.length || ab.some(function(k){ return exclude.indexOf(k)!==-1; })){
        return n===1 ? "Pick an ability to increase"+(exclude.length ? " other than "+exclude.map(abilityFullName).join(" or ") : "")+"."
          : "Pick "+n+" different abilities to increase"+(exclude.length ? ", not "+exclude.map(abilityFullName).join(" or ") : "")+".";
      }
    }
    if(def.abilityPreset && !def.abilityPreset.options[rc.preset]) return "Pick your "+def.abilityPreset.label.toLowerCase()+".";
    return wizardRacePicksProblem() || null;
  }
  if(id==="feat"){
    var feat = wizardFeat();
    if(!feat) return "Pick a feat.";
    var why = featPrereqReason(feat);
    return why ? feat.name+" "+why+". Pick another feat or change your scores." : null;
  }
  if(id==="bgFeat"){
    var bgf = wizardBackgroundFeat();
    if(!bgf.def) return "Pick "+bgf.choices.join(" or ")+" as your campaign feat.";
    var raceFeat = isStepApplicable("feat") && wizardFeat();
    if(bgf.campaign && raceFeat===bgf.def) return "You already took "+bgf.def.name+" as your "+wizardState.race+" feat. Pick the other one.";
    return featPicksProblem(bgf.def, wizardBackgroundFeatPicks(), wizardFeatContext({forBackgroundFeat:true})) || null;
  }
  if(id==="featPicks"){
    return featPicksProblem(wizardFeat(), wizardState.raceChoices.featPicks || {}, wizardFeatContext()) || null;
  }
  if(id==="choices"){
    var missing = (info.choices||[]).find(function(ch){
      var v = wizardState.classChoices[ch.id];
      if(ch.kind==="listPick" && ch.count>1){
        var lower = (v||[]).map(function(x){ return (x||"").trim().toLowerCase(); }).filter(Boolean);
        return lower.length!==ch.count || new Set(lower).size!==ch.count;
      }
      if(ch.kind==="expertise"){
        var allowed = expertiseOptions(ch);
        return !v || v.length!==ch.count || v.some(function(x){ return allowed.indexOf(x)===-1; });
      }
      return !v;
    });
    if(missing && missing.kind==="fightingStyle"){
      return "Choose a "+missing.label+".";
    }
    // A style with its own picks (Superior Technique's maneuver).
    var styleCh = (info.choices||[]).find(function(ch){ return ch.kind==="fightingStyle" && wizardState.classChoices[ch.id]; });
    var stylePick = styleCh && stylePicksProblem(wizardState.classChoices[styleCh.id], wizardState.classChoices[styleCh.id+"Picks"], !!wizardState.tashaOptional, []);
    if(stylePick) return stylePick;
    if(missing){
      if(missing.kind==="listPick" && missing.count>1) return "Choose "+missing.count+" different "+missing.label.toLowerCase()+".";
      return missing.kind==="expertise" ? "Choose "+missing.count+" for "+missing.label+"." : "Choose a "+missing.label+".";
    }
    // What the level-1 features let you choose (a domain's skill, a
    // ranger's favored enemy, a Draconic sorcerer's dragon).
    var grantWhy = "";
    wizardClassGrants().forEach(function(gr){
      if(grantWhy || !grantHasChoices(gr.def)) return;
      var pctx = wizardPickContext(gr);
      grantWhy = classPicksProblem(gr, fillSlots(gr.def, wizardPickSlots(gr.key), pctx), pctx);
    });
    if(grantWhy) return grantWhy;
    var spellPick = wizardSpellChoices().find(function(x){ return !x.pick; });
    if(spellPick) return "Choose your "+spellPick.choice.label.toLowerCase()+" for "+spellPick.feature+".";
    return null;
  }
  if(id==="languages"){
    var plan = languagePlan();
    var picks = wizardState.languageChoices.slice(0, plan.slots.length);
    // Case-insensitive, since homebrew languages are typed in.
    var fixedLower = plan.fixed.map(function(l){ return l.toLowerCase(); });
    var filled = picks.map(function(l){ return (l||"").trim().toLowerCase(); }).filter(function(l){ return l && fixedLower.indexOf(l)===-1; });
    if(filled.length!==plan.slots.length || new Set(filled).size!==filled.length) return "Pick "+plan.slots.length+" different language"+(plan.slots.length>1?"s":"")+" you don't already know.";
    var standardLower = LANGUAGES.Standard.map(function(l){ return l.toLowerCase(); });
    var notExotic = plan.slots.find(function(slot, i){ return slot.exotic && standardLower.indexOf((picks[i]||"").trim().toLowerCase())!==-1; });
    if(notExotic) return "Your "+notExotic.source+" background needs an exotic language (Abyssal, Celestial, Draconic, Infernal...).";
    var offList = plan.slots.find(function(slot, i){ return slot.options && slot.options.indexOf((picks[i]||"").trim())===-1; });
    if(offList) return "Your "+offList.source+" background's language is one of "+offList.options.join(", ")+".";
    return null;
  }
  if(id==="equipment"){
    var ok = info.equipment.choiceGroups.every(function(g,gi){ return wizardState.equipment[gi]!=null; });
    if(!ok) return "Make a choice for each equipment option.";
    var locked = info.equipment.choiceGroups.some(function(g,gi){
      var opt = g.options.find(function(o){ return o.key===wizardState.equipment[gi]; });
      return opt && !equipmentOptionAvailable(opt);
    });
    return locked ? "Your class choices don't give proficiency with one of the picked items. Pick another option." : null;
  }
  if(id==="cantrips"){
    var csc = info.spellcasting;
    if(!csc) return null;
    dropGrantedSpellPicks();
    return wizardState.spellChoices.cantrips.length===csc.cantrips ? null : "Choose "+csc.cantrips+" cantrips.";
  }
  if(id==="spells"){
    var sc = info.spellcasting;
    if(!sc) return null;
    var need = spellPickCount(sc);
    dropGrantedSpellPicks();
    if(wizardState.spellChoices.spells.length!==need) return "Choose "+need+" 1st-level spell"+(need>1?"s":"")+".";
    return null;
  }
  if(id==="review"){
    return (wizardState.name && wizardState.name.trim()) ? null : "Give your character a name before creating them.";
  }
  return null;
}

export function openWizard(){
  wizardState = {
    step:"class", name:"", title:"", classId:null, race:"", background:"", alignment:"",
    abilityMethod:null,
    abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    assignIdx:{str:null,dex:null,con:null,int:null,wis:null,cha:null},
    pointBuy:{str:8,dex:8,con:8,int:8,wis:8,cha:8},
    rolledPool:null,
    skillChoices:[],
    bgSkillChoices:[],
    bgPicks:{}, overlapPicks:{},
    classChoices:{},
    raceChoices:{abilities:[], preset:"", profPicks:{}, feat:"", featPicks:null},
    bgFeat:null, campaign:"", campaignFeat:"",
    languageChoices:[],
    equipment:{},
    spellChoices:{cantrips:[], spells:[]}
  };
  closeSidebarMobile();
  wizardScrollReset();
  resetHomebrewPickers();
  document.getElementById("wizard-overlay").classList.add("open");
  renderWizard();
}

export function requestCloseWizard(){
  if(!wizardState || !wizardState.classId){
    document.getElementById("wizard-overlay").classList.remove("open");
    return;
  }
  confirmDialog("Discard this character?", "Your in-progress choices will be lost.", function(){
    document.getElementById("wizard-overlay").classList.remove("open");
  });
}

export function finishWizard(){
  var w = wizardState;
  var info = CLASSES_INFO[w.classId];
  var c = newCharacter((w.name||"").trim());
  c.title = (w.title||"").trim();
  c.race = w.race;
  // Walking speed from the race (dwarves 25, wood elves 35); fly, swim
  // and climb speeds are read from the race data on the sheet.
  c.speed = (RACE_DATA[w.race] && RACE_DATA[w.race].speed && RACE_DATA[w.race].speed.walk) || 30;
  c.background = w.background;
  c.alignment = w.alignment;
  c.classes = [{name:w.classId, subclass:"", level:1}];
  if(Object.keys(wizardVariants()).length) c.classes[0].variants = wizardVariants(); // Favored Foe in place of Favored Enemy
  if(w.tashaOptional) c.tashaOptional = true;
  var fa = finalAbilities({withoutFeat:true}); // applyRaceChoices adds the feat's +1
  c.abilities = {str:fa.str, dex:fa.dex, con:fa.con, int:fa.int, wis:fa.wis, cha:fa.cha};
  info.savingThrows.forEach(function(k){ c.saveProfs[k] = true; });
  w.skillChoices.forEach(function(sk){ c.skillProfs[sk] = {prof:true, expertise:false}; });
  wizardBackgroundSkills().forEach(function(sk){
    var entry = c.skillProfs[sk] || {prof:false, expertise:false};
    entry.prof = true;
    c.skillProfs[sk] = entry;
  });
  c.features = [];
  c.feats = [];
  applyRaceChoices(c);
  // The background's feat, with the picks from its step (a Wildspacer's
  // Tough has none and is simply added).
  // A campaign's feat (Skilled or Tough) goes on the same way.
  var grant = wizardBackgroundFeat();
  if(CAMPAIGN_FEATS[w.campaign]) c.campaign = w.campaign;
  if(grant && grant.def){
    var bgFeat = grant.campaign ? campaignFeatCopy(grant.def, grant.campaign, 1) : backgroundFeatCopy(w.background);
    c.feats.push(bgFeat);
    if(featHasPicks(grant.def)) applyFeatPicks(c, bgFeat, wizardBackgroundFeatPicks());
  }
  var conMod = mod(c.abilities.con);
  c.hp.max = HIT_DICE_BY_CLASS[w.classId] + conMod + (subclassGrants(info, w.classChoices).hpPerLevel||0);
  c.hp.current = maxHp(c); // a Variant Human's Tough counts too
  // AC is derived on the sheet from equipped armor (see computeArmorClass);
  // no armor is equipped yet, so it starts from unarmored / class defense.
  c.inventory = buildEquipmentList(info, w.equipment);
  applyClassChoices(c, info, w.classChoices);
  // The background's tools: given ones and the Skills step's picks.
  var bgHolder = backgroundEntry(c);
  backgroundGrants(c).forEach(function(g){
    if(!grantHasChoices(g.def)) return; // given outright: read from the data
    var slots = wizardBgSlots(g.key).map(function(s){ return (s||[]).slice(); }), bgCtx = classPickContext(c, bgHolder, g.key);
    fillSlots(g.def, slots, bgCtx);
    // (One left unfinished stays pending on the Feature choices card.)
    if(!classPicksProblem(g, slots, bgCtx)) applyClassPicks(c, bgHolder, g, slots);
  });
  // What the race's traits give and the picks from Race Traits (after the
  // gear, so a dwarf's handaxe is marked proficient).
  var raceHolder = raceEntry(c);
  wizardRaceGrants(); // copies a shifter's type into its choice
  raceGrants(c).forEach(function(g){
    if(!grantHasChoices(g.def)){ applyClassPicks(c, raceHolder, g, []); return; }
    var slots = wizardRaceSlots(g.key).map(function(s){ return (s||[]).slice(); }), raceCtx = classPickContext(c, raceHolder, g.key);
    fillSlots(g.def, slots, raceCtx);
    if(!classPicksProblem(g, slots, raceCtx)) applyClassPicks(c, raceHolder, g, slots);
  });
  // Picks in place of a skill or tool given twice.
  var twice = overlapEntry(c);
  overlapGrants(c).forEach(function(g){
    var slots = wizardOverlapSlots(g.key).map(function(s){ return (s||[]).slice(); }), twiceCtx = classPickContext(c, twice, g.key);
    fillSlots(g.def, slots, twiceCtx);
    if(!classPicksProblem(g, slots, twiceCtx)) applyClassPicks(c, twice, g, slots);
  });
  var plan = languagePlan();
  c.languages = plan.fixed.concat(w.languageChoices.slice(0, plan.slots.length).filter(function(l, i, all){
    return l && plan.fixed.indexOf(l)===-1 && all.indexOf(l)===i;
  })).filter(function(l){ return plan.fromClass.indexOf(l)===-1; });
  // The subclass's skills, expertise and languages (given or picked on
  // the Class Features step), recorded with the feature that gives them.
  entryGrants(c.classes[0], false).forEach(function(g){
    var slots = ((w.classChoices.profPicks||{})[g.key] || []).map(function(s){ return (s||[]).slice(); });
    applyClassPicks(c, c.classes[0], g, fillSlots(g.def, slots, classPickContext(c, c.classes[0], g.key)));
  });

  if(info.spellcasting){
    var sc = info.spellcasting;
    c.spellcasting.ability = sc.ability;
    Object.keys(sc.slots).forEach(function(lvl){ c.spellcasting.slots[lvl] = {max:sc.slots[lvl], used:0}; });
    if(sc.pact) c.spellcasting.pact = {max:sc.pact.max, slotLevel:sc.pact.slotLevel, used:0};
    // Preparing casters get a starting prepared list (the class's level-1
    // count: a wizard prepares 4 of their 6 spellbook spells); everyone
    // else knows (and so has prepared) all of theirs.
    var prepareCount = sc.prepares ? preparedAt(w.classId, 1) : Infinity;
    // Picked spells carry their class, so the Spells tab and later
    // level-ups can count them (see js/core/spells-known.js).
    w.spellChoices.cantrips.forEach(function(name){
      var sp = spellFromCatalog(name, SPELL_DATA[name]);
      sp.learnedBy = w.classId;
      c.spells.push(sp);
    });
    w.spellChoices.spells.forEach(function(name, i){
      var sp = spellFromCatalog(name, SPELL_DATA[name]);
      sp.prepared = i < prepareCount;
      sp.learnedBy = w.classId;
      c.spells.push(sp);
    });
    // Subclass freebies: bonus cantrips and always-prepared spells. The
    // ones a feature grants (domain spells, Light Domain's Light) already
    // show in the Spells tab's spell list on their own, so they aren't
    // copied into the spell list as well.
    var grants = subclassGrants(info, w.classChoices);
    var fromFeatures = featureSpells(c).map(function(fs){ return fs.name; });
    (grants.cantrips||[]).concat(grants.spells||[]).forEach(function(name){
      if(!SPELL_DATA[name] || fromFeatures.indexOf(name)!==-1 || c.spells.some(function(sp){ return sp.name===name; })) return;
      var sp = spellFromCatalog(name, SPELL_DATA[name]);
      sp.prepared = true;
      sp.notes = (grants.spells||[]).indexOf(name)!==-1 ? "Domain spell: always prepared, doesn't count against your prepared spells." : "Bonus cantrip from your "+w.classChoices.subclass+".";
      c.spells.push(sp);
    });
  }

  state.characters.push(c);
  state.activeId = c.id;
  state.activeTab = "vitals";
  save();
  document.getElementById("wizard-overlay").classList.remove("open");
  renderAll();
  characterBorn();
  if(c.name.toUpperCase()==="TOUKELLIENMELI") playToukellienmeli();
  else playNewCharacter();
}

/* The Race Traits feat and its picks. The race's ability increases are
   already in c.abilities via finalAbilities(); the feat's +1 is added
   here. (Its skills, weapons and tools go on in finishWizard.) */
function applyRaceChoices(c){
  var def = raceChoiceDef();
  if(!def) return;
  var rc = wizardState.raceChoices;
  if(def.feat){
    var f = FEATS_CATALOG.find(function(x){ return x.name===rc.feat; });
    if(f){
      var feat = {id:uid(), name:f.name, prerequisite:f.prerequisite, category:f.category, summary:f.summary, description:f.description,
        source:f.custom ? "Custom" : "SRD", homebrewId:f.custom ? f.id : undefined};
      c.feats.push(feat);
      if(rc.featPicks) applyFeatPicks(c, feat, rc.featPicks);
    }
  }
}

/* Level-1 class picks from the Class Features step: a fighting style
   becomes a feature on the sheet (its `fightingStyle` tag lets AC/attacks
   apply Defense, Archery and Dueling), expertise doubles proficiency on skills. */
export function applyClassChoices(c, info, picks){
  (info.choices||[]).forEach(function(ch){
    var v = picks[ch.id];
    if(!v) return;
    if(ch.kind==="subclass"){
      c.classes[0].subclass = v;
      // Spell picks for this subclass only (not ones left over from
      // another subclass tried first).
      wizardSpellChoices().forEach(function(x){
        if(!x.pick) return;
        c.classes[0].spellChoices = c.classes[0].spellChoices || {};
        c.classes[0].spellChoices[x.choice.id] = x.pick;
      });
    } else if(ch.kind==="listPick"){
      // A pick from a list (tools, instruments, favored enemy): recorded as
      // a feature; `featureText` overrides the default proficiency wording.
      var vals = Array.isArray(v) ? v : [v];
      var joined = vals.join(", ");
      var text = ch.featureText ? ch.featureText.replace(/\{v\}/g, joined.toLowerCase()) :
        "You're proficient with "+joined.toLowerCase()+": add your proficiency bonus to ability checks you make with them.";
      c.features.push({id:uid(), name:ch.label+": "+joined, source:"Class", text:text, isPassive:true});
    } else if(ch.kind==="fightingStyle"){
      c.features.push(makeStyleFeature(v, picks[ch.id+"Picks"]));
    } else if(ch.kind==="expertise"){
      v.forEach(function(name){
        if((ch.tools||[]).indexOf(name)!==-1){
          var tools = c.inventory.find(function(i){ return i.name.toLowerCase()===name.toLowerCase(); });
          if(tools) tools.notes = (tools.notes ? tools.notes+"; " : "")+"expertise: double proficiency bonus";
          c.features.push({id:uid(), name:"Expertise: "+name, source:"Class", text:"Your proficiency bonus is doubled for ability checks you make with "+name.toLowerCase()+".", isPassive:true});
          return;
        }
        c.skillProfs[name] = {prof:true, expertise:true};
      });
    }
  });
}

/* One dot per step that applies, the current one lit. */
function buildWizardProgress(){
  var progress = ce("div"); progress.id = "wizard-progress";
  var applicableSteps = WIZARD_STEP_IDS.filter(isStepApplicable);
  var curPos = applicableSteps.indexOf(wizardState.step);
  applicableSteps.forEach(function(id, i){
    var dot = ce("div","wiz-dot");
    if(i<curPos) dot.classList.add("done");
    if(i===curPos) dot.classList.add("current");
    progress.appendChild(dot);
  });
  return progress;
}
/* Redraw just the dots, when a pick adds or removes a step (a feat with
   choices) without redrawing the step itself. */
export function refreshWizardProgress(){
  var old = document.getElementById("wizard-progress");
  if(old) old.replaceWith(buildWizardProgress());
}

export function renderWizard(){
  var overlay = document.getElementById("wizard-overlay");
  var keepScroll = wizardScrollSave("create:"+wizardState.step);
  overlay.innerHTML = "";

  var header = ce("div"); header.id = "wizard-header";
  var h2 = document.createElement("h2"); h2.textContent = "New character: "+wizardStepTitle(wizardState.step);
  var closeBtn = document.createElement("button"); closeBtn.className = "btn small ghost"; closeBtn.textContent = "✕ Cancel";
  closeBtn.addEventListener("click", requestCloseWizard);
  header.appendChild(h2); header.appendChild(closeBtn);
  overlay.appendChild(header);

  overlay.appendChild(buildWizardProgress());

  var body = ce("div"); body.id = "wizard-body";
  var inner = ce("div"); inner.id = "wizard-body-inner";
  body.appendChild(inner);
  overlay.appendChild(body);

  var renderers = {
    class: wizardStepClass, race: wizardStepRace, background: wizardStepBackground,
    alignment: wizardStepAlignment,
    abilities: wizardStepAbilities, skills: wizardStepSkills, raceChoices: wizardStepRaceChoices, feat: wizardStepFeat, featPicks: wizardStepFeatPicks, bgFeat: wizardStepBgFeat, choices: wizardStepChoices, languages: wizardStepLanguages, equipment: wizardStepEquipment,
    cantrips: wizardStepCantrips, spells: wizardStepSpells, review: wizardStepReview
  };
  renderers[wizardState.step](inner);

  var errorBox = ce("div","wiz-error"); errorBox.id = "wizard-error";
  overlay.appendChild(errorBox);

  var footer = ce("div"); footer.id = "wizard-footer";
  var backBtn = document.createElement("button");
  backBtn.className = "btn ghost btn-nav"; backBtn.innerHTML = makeMoveLeftSvg() + "Back";
  backBtn.disabled = wizardStepIndex()===0;
  backBtn.addEventListener("click", function(){ goStep(-1); });
  var nextBtn = document.createElement("button");
  nextBtn.className = "btn primary";
  nextBtn.classList.add("btn-nav");
  if(wizardState.step==="review") nextBtn.textContent = "Create Character";
  else nextBtn.innerHTML = "Next" + makeMoveRightSvg();
  nextBtn.addEventListener("click", function(){
    var err = validateStep(wizardState.step);
    if(err){
      errorBox.innerHTML = makeAlertSvg() + "<span></span>";
      errorBox.lastChild.textContent = err;
      errorBox.classList.add("show");
      if(wizardState.step==="review"){
        var nameEl = document.getElementById("wiz-name-input");
        if(nameEl){ nameEl.classList.add("wiz-invalid"); nameEl.focus(); }
      }
      return;
    }
    errorBox.classList.remove("show");
    if(wizardState.step==="review"){ finishWizard(); return; }
    goStep(1);
  });
  footer.appendChild(backBtn); footer.appendChild(nextBtn);
  overlay.appendChild(footer);
  wizardScrollRestore(keepScroll);
}
