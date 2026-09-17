import { ABILITIES, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO } from "../data/classes.js";
import { BACKGROUND_INFO } from "../data/backgrounds.js";
import { mod, ce } from "../core/helpers.js";
import { newCharacter } from "../core/character.js";
import { state, save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { closeSidebarMobile } from "../ui/mobile-nav.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import {
  buildEquipmentList,
  wizardStepClass, wizardStepRace, wizardStepBackground, wizardStepAlignment,
  wizardStepAbilities, wizardStepSkills, wizardStepEquipment, wizardStepSpells, wizardStepReview
} from "./wizard-steps.js";

/* ---------------- Character Creation Wizard ---------------- */
export var WIZARD_STEP_IDS = ["class","race","background","alignment","abilities","skills","equipment","spells","review"];
export var wizardState = null;

export function currentClassInfo(){ return wizardState && CLASSES_INFO[wizardState.classId]; }

export function isStepApplicable(id){
  if(id==="spells"){
    var info = currentClassInfo();
    return !!(info && info.spellcaster);
  }
  return true;
}

export function wizardStepTitle(id){
  return {
    class:"Choose a Class", race:"Choose a Race", background:"Choose a Background",
    alignment:"Choose an Alignment",
    abilities:"Ability Scores", skills:"Skills & Proficiencies", equipment:"Starting Equipment",
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
    if(wizardState.abilityMethod!=="pointbuy"){
      var allAssigned = ABILITIES.every(function(a){ return wizardState.assignIdx[a[0]]!=null; });
      if(!allAssigned) return "Assign a score to every ability.";
    }
    return null;
  }
  if(id==="skills"){
    return wizardState.skillChoices.length===info.skillChoices.count ? null : "Choose "+info.skillChoices.count+" skills.";
  }
  if(id==="equipment"){
    var ok = info.equipment.choiceGroups.every(function(g,gi){ return wizardState.equipment[gi]!=null; });
    return ok ? null : "Make a choice for each equipment option.";
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
    equipment:{}
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
  c.hp.max = HIT_DICE_BY_CLASS[w.classId] + conMod;
  c.hp.current = c.hp.max;
  // AC is derived on the sheet from equipped armor (see computeArmorClass) —
  // no armor is equipped yet, so it starts from unarmored / class defense.
  c.inventory = buildEquipmentList(info, w.equipment);

  state.characters.push(c);
  state.activeId = c.id;
  state.activeTab = "vitals";
  save();
  document.getElementById("wizard-overlay").classList.remove("open");
  renderAll();
}

export function renderWizard(){
  var overlay = document.getElementById("wizard-overlay");
  overlay.innerHTML = "";

  var header = ce("div"); header.id = "wizard-header";
  var h2 = document.createElement("h2"); h2.textContent = "New Character — "+wizardStepTitle(wizardState.step);
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
    abilities: wizardStepAbilities, skills: wizardStepSkills, equipment: wizardStepEquipment,
    spells: wizardStepSpells, review: wizardStepReview
  };
  renderers[wizardState.step](inner);

  var errorBox = ce("div","wiz-error"); errorBox.id = "wizard-error";
  overlay.appendChild(errorBox);

  var footer = ce("div"); footer.id = "wizard-footer";
  var backBtn = document.createElement("button");
  backBtn.className = "btn ghost"; backBtn.textContent = "← Back";
  backBtn.disabled = wizardStepIndex()===0;
  backBtn.addEventListener("click", function(){ goStep(-1); });
  var nextBtn = document.createElement("button");
  nextBtn.className = "btn primary";
  nextBtn.textContent = wizardState.step==="review" ? "Create Character" : "Next →";
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
