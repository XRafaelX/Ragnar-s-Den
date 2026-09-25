import { ABILITIES, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO, FIGHTING_STYLES } from "../data/classes.js";
import { BACKGROUND_INFO } from "../data/backgrounds.js";
import { mod, ce, uid } from "../core/helpers.js";
import { newCharacter } from "../core/character.js";
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
  wizardStepAbilities, wizardStepSkills, wizardStepChoices, wizardStepEquipment, wizardStepSpells, wizardStepReview,
  expertiseOptions
} from "./wizard-steps.js";
import { makeMoveLeftSvg, makeMoveRightSvg } from "../ui/svg-icons.js";

/* ---------------- Character Creation Wizard ---------------- */
export var WIZARD_STEP_IDS = ["class","race","background","alignment","abilities","skills","choices","equipment","spells","review"];
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
/* Some gear needs a proficiency only certain subclasses give (a cleric's
   chain mail needs a heavy-armor domain). */
export function equipmentOptionAvailable(opt){
  if(!opt.requires) return true;
  var grants = subclassGrants(currentClassInfo(), wizardState.classChoices);
  return (grants.profs||[]).indexOf(opt.requires)!==-1;
}
/* 1st-level spells to pick: a fixed number, or computed from the scores
   (a cleric prepares WIS modifier + 1). */
export function spellPickCount(sc){
  return typeof sc.spells==="function" ? sc.spells(wizardState) : sc.spells;
}

export function isStepApplicable(id){
  if(id==="spells"){
    var info = currentClassInfo();
    return !!(info && info.spellcasting);
  }
  if(id==="choices"){
    var ci = currentClassInfo();
    return !!(ci && ci.choices && ci.choices.length);
  }
  return true;
}

export function wizardStepTitle(id){
  return {
    class:"Choose a Class", race:"Choose a Race", background:"Choose a Background",
    alignment:"Choose an Alignment",
    abilities:"Ability Scores", skills:"Skills & Proficiencies", choices:"Class Features", equipment:"Starting Equipment",
    spells:"Spells", review:"Review & Finish"
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
  if(id==="choices"){
    var missing = (info.choices||[]).find(function(ch){
      var v = wizardState.classChoices[ch.id];
      if(ch.kind==="expertise"){
        var allowed = expertiseOptions(ch);
        return !v || v.length!==ch.count || v.some(function(x){ return allowed.indexOf(x)===-1; });
      }
      return !v;
    });
    if(missing) return missing.kind==="expertise" ? "Choose "+missing.count+" for "+missing.label+"." : "Choose a "+missing.label+".";
    var g = subclassGrants(info, wizardState.classChoices);
    var bonus = g.expertise;
    if(bonus && (wizardState.classChoices[bonus.id]||[]).length!==bonus.count) return "Choose "+bonus.count+" skills for "+bonus.label+".";
    if(g.pick && !wizardState.classChoices[g.pick.id]) return "Choose a "+g.pick.label+".";
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
  if(id==="spells"){
    var sc = info.spellcasting;
    if(!sc) return null;
    var picked = wizardState.spellChoices;
    if(picked.cantrips.length!==sc.cantrips) return "Choose "+sc.cantrips+" cantrips.";
    var need = spellPickCount(sc);
    if(picked.spells.length!==need) return "Choose "+need+" 1st-level spells.";
    return null;
  }
  if(id==="review"){
    return (wizardState.name && wizardState.name.trim()) ? null : "Give your character a name before creating them.";
  }
  return null;
}

export function openWizard(){
  wizardState = {
    step:"class", name:"", classId:null, race:"", background:"", alignment:"",
    abilityMethod:null,
    abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    assignIdx:{str:null,dex:null,con:null,int:null,wis:null,cha:null},
    pointBuy:{str:8,dex:8,con:8,int:8,wis:8,cha:8},
    rolledPool:null,
    skillChoices:[],
    classChoices:{},
    equipment:{},
    spellChoices:{cantrips:[], spells:[]}
  };
  closeSidebarMobile();
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
  c.race = w.race;
  c.background = w.background;
  c.alignment = w.alignment;
  c.classes = [{name:w.classId, subclass:"", level:1}];
  c.abilities = {str:w.abilities.str, dex:w.abilities.dex, con:w.abilities.con, int:w.abilities.int, wis:w.abilities.wis, cha:w.abilities.cha};
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
  var conMod = mod(c.abilities.con);
  c.hp.max = HIT_DICE_BY_CLASS[w.classId] + conMod + (subclassGrants(info, w.classChoices).hpPerLevel||0);
  c.hp.current = c.hp.max;
  // AC is derived on the sheet from equipped armor (see computeArmorClass);
  // no armor is equipped yet, so it starts from unarmored / class defense.
  c.inventory = buildEquipmentList(info, w.equipment);
  applyClassChoices(c, info, w.classChoices);

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

/* Level-1 class picks from the Class Features step: a fighting style
   becomes a feature on the sheet (its `fightingStyle` tag lets AC/attacks
   apply Defense and Archery), expertise doubles proficiency on skills. */
export function applyClassChoices(c, info, picks){
  (info.choices||[]).forEach(function(ch){
    var v = picks[ch.id];
    if(!v) return;
    if(ch.kind==="subclass"){
      c.classes[0].subclass = v;
      var g = subclassGrants(info, picks);
      (g.expertise && picks[g.expertise.id] || []).forEach(function(sk){ c.skillProfs[sk] = {prof:true, expertise:true}; });
      var picked = g.pick && g.pick.options.find(function(o){ return o.name===picks[g.pick.id]; });
      if(picked) c.features.push({id:uid(), name:g.pick.label+": "+picked.name, source:"Class", text:picked.text, isPassive:true});
      if(c.languages) (g.languages||[]).forEach(function(l){ if(c.languages.indexOf(l)===-1) c.languages.push(l); });
    } else if(ch.kind==="tool"){
      c.features.push({id:uid(), name:"Tool Proficiency: "+v, source:"Class", text:"You're proficient with "+v.toLowerCase()+": add your proficiency bonus to ability checks you make with them.", isPassive:true});
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
    abilities: wizardStepAbilities, skills: wizardStepSkills, choices: wizardStepChoices, equipment: wizardStepEquipment,
    spells: wizardStepSpells, review: wizardStepReview
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
      errorBox.textContent = "⚠ "+err;
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
}
