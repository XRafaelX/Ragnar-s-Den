import { ABILITIES, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, FIGHTING_STYLES, CLASS_PROFICIENCIES } from "../data/classes.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { BACKGROUND_INFO, BACKGROUND_LANGUAGES } from "../data/backgrounds.js";
import { RACE_LANGUAGES, RACE_LANGUAGES_FALLBACK, RACE_CHOICES } from "../data/races.js";
import { RACE_DATA } from "../data/race-data.js";
import { mod, ce, uid, wizardScrollSave, wizardScrollRestore, wizardScrollReset, maxHp, featureSpells, classSpellChoices, classExtraSpellLists } from "../core/helpers.js";
import { catalogSpellName, spellDataForClass } from "../data/spells.js";
import { newCharacter } from "../core/character.js";
import { featPicksProblem, applyFeatPicks } from "../core/feat-picks.js";
import { state, save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { closeSidebarMobile } from "../ui/mobile-nav.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { playAdd } from "../ui/sound.js";
import { SPELL_DATA } from "../data/spells.js";
import { spellFromCatalog } from "../render/panels/spell-picker.js";
import {
  buildEquipmentList,
  wizardStepClass, wizardStepRace, wizardStepBackground, wizardStepAlignment,
  wizardStepAbilities, wizardStepSkills, wizardStepRaceChoices, wizardStepChoices, wizardStepLanguages, wizardStepEquipment, wizardStepCantrips, wizardStepSpells, wizardStepReview,
  expertiseOptions, resetHomebrewPickers
} from "./wizard-steps.js";
import { makeMoveLeftSvg, makeMoveRightSvg, makeAlertSvg } from "../ui/svg-icons.js";

/* ---------------- Character Creation Wizard ---------------- */
export var WIZARD_STEP_IDS = ["class","race","background","alignment","abilities","skills","raceChoices","choices","languages","equipment","cantrips","spells","review"];
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
  return {name: wizardState.classId, level: 1,
    subclass: subclass!=null ? subclass : (ch && wizardState.classChoices[ch.id]) || "",
    spellChoices: wizardState.classChoices.spellChoices || {}};
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
/* Spells from other classes' lists the chosen subclass opens (a Divine
   Soul sorcerer can pick cleric spells), as catalog names. */
export function wizardExtraListSpells(){
  var out = [];
  classExtraSpellLists(wizardClassEntry()).forEach(function(list){ out = out.concat(Object.keys(spellDataForClass(list))); });
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
/* The new character's skills so far (class picks, background, the Race
   Traits skill), in the sheet's skillProfs shape, for feat picks. */
export function wizardSkillProfs(){
  var out = {};
  var def = raceChoiceDef();
  var raceSkills = def && def.skills ? wizardState.raceChoices.skills.slice(0, def.skills) : [];
  wizardState.skillChoices.concat((BACKGROUND_INFO[wizardState.background]||{}).skills||[], raceSkills).forEach(function(sk){
    if(sk) out[sk] = {prof:true, expertise:false};
  });
  return out;
}

/* Why the new character can't take a feat yet ("" if they can): ability
   minimums, a Spellcasting feature, or armor proficiency. */
var ABILITY_WORDS = {Strength:"str", Dexterity:"dex", Constitution:"con", Intelligence:"int", Wisdom:"wis", Charisma:"cha"};
export function featPrereqReason(feat){
  var req = feat.prerequisite || "None";
  if(req==="None") return "";
  var ab = finalAbilities({withoutFeat:true}), info = currentClassInfo() || {};
  var m = /^(.+?) 13 or higher$/.exec(req);
  if(m){
    var keys = m[1].split(" or ").map(function(w){ return ABILITY_WORDS[w.trim()]; });
    return keys.some(function(k){ return (ab[k]||0) >= 13; }) ? "" : "needs "+keys.map(function(k){ return k.toUpperCase(); }).join(" or ")+" 13";
  }
  if(req==="Spellcasting feature") return info.spellcasting ? "" : "needs spellcasting";
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
   it comes from (race, background, Ranger's favored enemy, Knowledge
   Domain). */
export function languagePlan(){
  var w = wizardState, info = currentClassInfo();
  var race = RACE_LANGUAGES[w.race] || RACE_LANGUAGES_FALLBACK;
  var grants = subclassGrants(info, w.classChoices);
  var fixed = [];
  function addFixed(l){ if(fixed.indexOf(l)===-1) fixed.push(l); }
  race.fixed.forEach(addFixed);
  ((info && info.languages)||[]).forEach(addFixed);
  (grants.languages||[]).forEach(addFixed);
  var slots = [];
  function addSlots(n, source, help){ for(var i=0;i<(n||0);i++) slots.push({source:source, help:help||""}); }
  addSlots(race.choose, w.race || "Race", race.note);
  addSlots(BACKGROUND_LANGUAGES[w.background]!=null ? BACKGROUND_LANGUAGES[w.background] : 0, w.background);
  if(info && info.languagePicks) addSlots(info.languagePicks.count, info.languagePicks.label, info.languagePicks.help);
  addSlots(grants.languagePicks, w.classChoices.subclass);
  return {fixed:fixed, slots:slots};
}

/* 1st-level spells to pick: a fixed number, or computed from the scores
   (a cleric prepares WIS modifier + 1). */
export function spellPickCount(sc){
  return typeof sc.spells==="function" ? sc.spells({abilities:finalAbilities()}) : sc.spells;
}

export function isStepApplicable(id){
  if(id==="cantrips" || id==="spells"){
    var info = currentClassInfo();
    return !!(info && info.spellcasting);
  }
  if(id==="choices"){
    var ci = currentClassInfo();
    return !!(ci && ci.choices && ci.choices.length);
  }
  if(id==="languages") return languagePlan().slots.length > 0;
  if(id==="raceChoices") return !!raceChoiceDef();
  return true;
}

export function wizardStepTitle(id){
  return {
    class:"Choose a Class", race:"Choose a Race", background:"Choose a Background",
    alignment:"Choose an Alignment",
    abilities:"Ability Scores", skills:"Skills & Proficiencies", raceChoices:"Race Traits", choices:"Class Features", languages:"Languages", equipment:"Starting Equipment",
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
    return wizardState.skillChoices.length===info.skillChoices.count ? null : "Choose "+info.skillChoices.count+" skills.";
  }
  if(id==="raceChoices"){
    var def = raceChoiceDef(), rc = wizardState.raceChoices;
    if(def.abilityBonus){
      var n = def.abilityBonus.amounts.length, exclude = def.abilityBonus.exclude || [];
      var ab = rc.abilities.slice(0, n).filter(Boolean);
      if(ab.length!==n || new Set(ab).size!==ab.length || ab.some(function(k){ return exclude.indexOf(k)!==-1; })){
        return n===1 ? "Pick an ability to increase"+(exclude.length ? " other than "+exclude.map(abilityFullName).join(" or ") : "")+"."
          : "Pick "+n+" different abilities to increase"+(exclude.length ? ", not "+exclude.map(abilityFullName).join(" or ") : "")+".";
      }
    }
    if(def.abilityPreset && !def.abilityPreset.options[rc.preset]) return "Pick your "+def.abilityPreset.label.toLowerCase()+".";
    if(def.skills){
      var known = wizardState.skillChoices.concat((BACKGROUND_INFO[wizardState.background]||{}).skills||[]);
      var sk = rc.skills.slice(0, def.skills).filter(Boolean);
      if(sk.length!==def.skills || sk.some(function(x){ return known.indexOf(x)!==-1; })) return "Pick "+(def.skills>1 ? def.skills+" skills" : "a skill")+" you're not already proficient in.";
    }
    if(def.feat){
      var feat = FEATS_CATALOG.find(function(f){ return f.name===rc.feat; });
      if(!feat) return "Pick a feat.";
      var why = featPrereqReason(feat);
      if(why) return feat.name+" "+why+". Pick another feat or change your scores.";
      var picksWhy = featPicksProblem(feat, rc.featPicks, {abilities: finalAbilities({withoutFeat:true}), skillProfs: wizardSkillProfs()});
      if(picksWhy) return picksWhy;
    }
    return null;
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
    if(missing){
      if(missing.kind==="listPick" && missing.count>1) return "Choose "+missing.count+" different "+missing.label.toLowerCase()+".";
      return missing.kind==="expertise" ? "Choose "+missing.count+" for "+missing.label+"." : "Choose a "+missing.label+".";
    }
    var g = subclassGrants(info, wizardState.classChoices);
    var bonus = g.expertise;
    if(bonus && (wizardState.classChoices[bonus.id]||[]).length!==bonus.count) return "Choose "+bonus.count+" skills for "+bonus.label+".";
    if(g.pick && !wizardState.classChoices[g.pick.id]) return "Choose a "+g.pick.label+".";
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
    return wizardState.spellChoices.cantrips.length===csc.cantrips ? null : "Choose "+csc.cantrips+" cantrips.";
  }
  if(id==="spells"){
    var sc = info.spellcasting;
    if(!sc) return null;
    var need = spellPickCount(sc);
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
    classChoices:{},
    raceChoices:{abilities:[], preset:"", skills:[], feat:"", featPicks:null},
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
  var fa = finalAbilities({withoutFeat:true}); // applyRaceChoices adds the feat's +1
  c.abilities = {str:fa.str, dex:fa.dex, con:fa.con, int:fa.int, wis:fa.wis, cha:fa.cha};
  info.savingThrows.forEach(function(k){ c.saveProfs[k] = true; });
  w.skillChoices.forEach(function(sk){ c.skillProfs[sk] = {prof:true, expertise:false}; });
  var bgInfo = BACKGROUND_INFO[w.background];
  if(bgInfo && bgInfo.skills){
    bgInfo.skills.forEach(function(sk){
      var entry = c.skillProfs[sk] || {prof:false, expertise:false};
      entry.prof = true;
      c.skillProfs[sk] = entry;
    });
  }
  c.features = [];
  c.feats = [];
  applyRaceChoices(c);
  var conMod = mod(c.abilities.con);
  c.hp.max = HIT_DICE_BY_CLASS[w.classId] + conMod + (subclassGrants(info, w.classChoices).hpPerLevel||0);
  c.hp.current = maxHp(c); // a Variant Human's Tough counts too
  // AC is derived on the sheet from equipped armor (see computeArmorClass);
  // no armor is equipped yet, so it starts from unarmored / class defense.
  c.inventory = buildEquipmentList(info, w.equipment);
  applyClassChoices(c, info, w.classChoices);
  var plan = languagePlan();
  c.languages = plan.fixed.concat(w.languageChoices.slice(0, plan.slots.length).filter(function(l, i, all){
    return l && plan.fixed.indexOf(l)===-1 && all.indexOf(l)===i;
  }));

  if(info.spellcasting){
    var sc = info.spellcasting;
    c.spellcasting.ability = sc.ability;
    Object.keys(sc.slots).forEach(function(lvl){ c.spellcasting.slots[lvl] = {max:sc.slots[lvl], used:0}; });
    if(sc.pact) c.spellcasting.pact = {max:sc.pact.max, slotLevel:sc.pact.slotLevel, used:0};
    // Preparing casters get a starting prepared list (ability mod + level,
    // at least 1); everyone else knows (and so has prepared) all of theirs.
    var prepareCount = sc.prepares ? Math.max(1, mod(c.abilities[sc.ability]) + 1) : Infinity;
    w.spellChoices.cantrips.forEach(function(name){
      c.spells.push(spellFromCatalog(name, SPELL_DATA[name]));
    });
    w.spellChoices.spells.forEach(function(name, i){
      var sp = spellFromCatalog(name, SPELL_DATA[name]);
      sp.prepared = i < prepareCount;
      c.spells.push(sp);
    });
    // Subclass freebies: bonus cantrips and always-prepared spells.
    var grants = subclassGrants(info, w.classChoices);
    (grants.cantrips||[]).concat(grants.spells||[]).forEach(function(name){
      if(!SPELL_DATA[name] || c.spells.some(function(sp){ return sp.name===name; })) return;
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
  playAdd();
}

/* Race Traits picks (Variant Human): the skill, the feat and its picks.
   The race's ability increases are already in c.abilities via
   finalAbilities(); the feat's +1 is added here. */
function applyRaceChoices(c){
  var def = raceChoiceDef();
  if(!def) return;
  var rc = wizardState.raceChoices;
  if(def.skills) rc.skills.slice(0, def.skills).forEach(function(sk){
    if(!sk) return;
    var entry = c.skillProfs[sk] || {prof:false, expertise:false};
    entry.prof = true;
    c.skillProfs[sk] = entry;
  });
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
   apply Defense and Archery), expertise doubles proficiency on skills. */
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
      var g = subclassGrants(info, picks);
      (g.expertise && picks[g.expertise.id] || []).forEach(function(sk){ c.skillProfs[sk] = {prof:true, expertise:true}; });
      var picked = g.pick && g.pick.options.find(function(o){ return o.name===picks[g.pick.id]; });
      if(picked) c.features.push({id:uid(), name:g.pick.label+": "+picked.name, source:"Class", text:picked.text, isPassive:true});
    } else if(ch.kind==="listPick"){
      // A pick from a list (tools, instruments, favored enemy): recorded as
      // a feature; `featureText` overrides the default proficiency wording.
      var vals = Array.isArray(v) ? v : [v];
      var joined = vals.join(", ");
      var text = ch.featureText ? ch.featureText.replace(/\{v\}/g, joined.toLowerCase()) :
        "You're proficient with "+joined.toLowerCase()+": add your proficiency bonus to ability checks you make with them.";
      c.features.push({id:uid(), name:ch.label+": "+joined, source:"Class", text:text, isPassive:true});
    } else if(ch.kind==="fightingStyle"){
      var style = FIGHTING_STYLES[v];
      c.features.push({id:uid(), name:"Fighting Style: "+v, source:"Class", text:style ? style.text : "", isPassive:true, fightingStyle:v});
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

  var progress = ce("div"); progress.id = "wizard-progress";
  var applicableSteps = WIZARD_STEP_IDS.filter(isStepApplicable);
  var curPos = applicableSteps.indexOf(wizardState.step);
  applicableSteps.forEach(function(id, i){
    var dot = ce("div","wiz-dot");
    if(i<curPos) dot.classList.add("done");
    if(i===curPos) dot.classList.add("current");
    progress.appendChild(dot);
  });
  overlay.appendChild(progress);

  var body = ce("div"); body.id = "wizard-body";
  var inner = ce("div"); inner.id = "wizard-body-inner";
  body.appendChild(inner);
  overlay.appendChild(body);

  var renderers = {
    class: wizardStepClass, race: wizardStepRace, background: wizardStepBackground,
    alignment: wizardStepAlignment,
    abilities: wizardStepAbilities, skills: wizardStepSkills, raceChoices: wizardStepRaceChoices, choices: wizardStepChoices, languages: wizardStepLanguages, equipment: wizardStepEquipment,
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
