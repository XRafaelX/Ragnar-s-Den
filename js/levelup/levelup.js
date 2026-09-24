import { ABILITIES, CLASS_LIST, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { CLASSES_INFO } from "../data/classes.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL, XP_THRESHOLDS, SPELL_TIPS, THIRD_CASTER_SPELL_TIPS } from "../data/progression.js";
import {
  mod, fmtMod, ce, escapeHtml, uid, clamp, totalLevel, profBonus,
  classFeatureList, classFeaturesGainedAt, classCasterType, classSpellAbility, computeSpellSlots
} from "../core/helpers.js";
import { save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { logRoll } from "../dice/dice.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { openInfoModal } from "../ui/info-modal.js";
import { playAdd, playDelete } from "../ui/sound.js";
import { showActionToast } from "../ui/toast.js";

/* ---------------- Level-up flow ----------------
   A short guided flow in the same full-screen overlay as the creation
   wizard: pick which class gains the level (or multiclass into a new
   one), a subclass when one is due, an Ability Score Improvement / feat
   at class level 4, then hit points. Applying it records what changed in
   c.levelHistory so the last level-up can be undone. */
var STEP_IDS = ["class","subclass","asi","hp","review"];
var lu = null;

function abilityName(key){
  var found = ABILITIES.find(function(a){ return a[0]===key; });
  return found ? found[1] : key;
}
function progFor(name){ return CLASS_PROGRESSION[name] || {prereq:[], asiLevels:[4,8,12,16,19], features:{}}; }

export function canLevelUp(c){ return totalLevel(c) < MAX_LEVEL; }
export function xpForNextLevel(c){ return XP_THRESHOLDS[totalLevel(c)+1]; }

/* Multiclass prerequisites: 13+ in the listed abilities (any one group). */
export function meetsPrereq(c, className){
  var prog = CLASS_PROGRESSION[className];
  if(!prog || !prog.prereq.length) return true;
  return prog.prereq.some(function(group){
    return group.every(function(ab){ return (Number(c.abilities[ab])||0) >= 13; });
  });
}
export function prereqText(className){
  var prog = CLASS_PROGRESSION[className];
  if(!prog || !prog.prereq.length) return "";
  return prog.prereq.map(function(g){
    return g.map(function(ab){ return ab.toUpperCase()+" 13"; }).join(" and ");
  }).join(" or ");
}

/* ---- Derived view of the pending choice ---- */
function target(){
  var c = lu.c;
  var existing = (c.classes||[]).find(function(cl){ return cl.name===lu.className; });
  var prog = progFor(lu.className);
  var newLevel = existing ? (Number(existing.level)||1)+1 : 1;
  var hasSub = !!(existing && existing.subclass);
  return {
    existing: existing,
    prog: prog,
    newLevel: newLevel,
    needsSubclass: !!prog.subclassLevel && newLevel >= prog.subclassLevel && !hasSub,
    asi: prog.asiLevels.indexOf(newLevel) !== -1,
    hitDie: HIT_DICE_BY_CLASS[lu.className] || 8
  };
}

function stepApplicable(id){
  if(!lu.className) return id==="class";
  var t = target();
  if(id==="subclass") return t.needsSubclass;
  if(id==="asi") return t.asi;
  return true;
}

function chosenSubclass(){
  if(lu.subclass==="__custom__") return (lu.subclassCustom||"").trim();
  return lu.subclass || "";
}

function asiPointsUsed(){
  return Object.keys(lu.asi).reduce(function(a,k){ return a + lu.asi[k]; }, 0);
}

function validate(id){
  if(id==="class") return lu.className ? null : "Pick a class to gain the level in.";
  if(id==="subclass") return chosenSubclass() ? null : "Pick a "+(target().prog.subclassLabel||"subclass").toLowerCase()+".";
  if(id==="asi"){
    if(lu.asiMode==="feat") return lu.featName ? null : "Pick a feat, or switch to raising ability scores.";
    return asiPointsUsed()===2 ? null : "Spend both ability points (you have "+(2-asiPointsUsed())+" left).";
  }
  if(id==="hp") return (lu.hpMethod==="avg" || lu.hpRoll!=null) ? null : "Take the average or roll your hit die.";
  return null;
}

/* ---- Open / navigate ---- */
export function openLevelUp(c){
  if(!canLevelUp(c)){
    showActionToast("Level "+MAX_LEVEL+" is the highest level supported for now.", true);
    return;
  }
  lu = {
    c: c, step:"class",
    className: c.classes.length===1 ? c.classes[0].name : null,
    subclass:"", subclassCustom:"",
    asiMode:"asi", asi:{str:0,dex:0,con:0,int:0,wis:0,cha:0}, featName:"", featQuery:"",
    hpMethod:"avg", hpRoll:null
  };
  document.getElementById("wizard-overlay").classList.add("open");
  render();
}

function close(){
  document.getElementById("wizard-overlay").classList.remove("open");
  lu = null;
}

function go(delta){
  var idx = STEP_IDS.indexOf(lu.step);
  var next = idx;
  do { next += delta; } while(next>=0 && next<STEP_IDS.length && !stepApplicable(STEP_IDS[next]));
  if(next<0 || next>=STEP_IDS.length) return;
  lu.step = STEP_IDS[next];
  render();
}

function render(){
  var overlay = document.getElementById("wizard-overlay");
  overlay.innerHTML = "";
  var c = lu.c;

  var header = ce("div"); header.id = "wizard-header";
  var h2 = document.createElement("h2");
  h2.textContent = "Level Up — "+(c.name||"Character")+" (level "+totalLevel(c)+" → "+(totalLevel(c)+1)+")";
  var closeBtn = document.createElement("button"); closeBtn.className = "btn small ghost"; closeBtn.textContent = "✕ Cancel";
  closeBtn.addEventListener("click", close);
  header.appendChild(h2); header.appendChild(closeBtn);
  overlay.appendChild(header);

  var progress = ce("div"); progress.id = "wizard-progress";
  var steps = STEP_IDS.filter(stepApplicable);
  var cur = steps.indexOf(lu.step);
  steps.forEach(function(id, i){
    var dot = ce("div","wiz-dot");
    if(i<cur) dot.classList.add("done");
    if(i===cur) dot.classList.add("current");
    progress.appendChild(dot);
  });
  overlay.appendChild(progress);

  var body = ce("div"); body.id = "wizard-body";
  var inner = ce("div"); inner.id = "wizard-body-inner";
  body.appendChild(inner);
  overlay.appendChild(body);
  ({class:stepClass, subclass:stepSubclass, asi:stepAsi, hp:stepHp, review:stepReview})[lu.step](inner);

  var errorBox = ce("div","wiz-error");
  overlay.appendChild(errorBox);

  var footer = ce("div"); footer.id = "wizard-footer";
  var backBtn = document.createElement("button");
  backBtn.className = "btn ghost"; backBtn.textContent = "← Back";
  backBtn.disabled = lu.step==="class";
  backBtn.addEventListener("click", function(){ go(-1); });
  var nextBtn = document.createElement("button");
  nextBtn.className = "btn primary";
  nextBtn.textContent = lu.step==="review" ? "Level up!" : "Next →";
  nextBtn.addEventListener("click", function(){
    var err = validate(lu.step);
    if(err){ errorBox.textContent = "⚠ "+err; errorBox.classList.add("show"); return; }
    if(lu.step==="review"){ finish(); return; }
    go(1);
  });
  footer.appendChild(backBtn); footer.appendChild(nextBtn);
  overlay.appendChild(footer);
}

function stepCard(container, title, explainHtml){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>"+escapeHtml(title)+"</span></h3>";
  if(explainHtml){
    var explain = ce("div","wiz-explain");
    explain.innerHTML = explainHtml;
    card.appendChild(explain);
  }
  container.appendChild(card);
  return card;
}

/* What a class would gain at `level`, as short labels for the pick cards. */
function gainLabels(className, subclass, level){
  var prog = progFor(className);
  var labels = classFeaturesGainedAt({name:className, subclass:subclass, level:level}, level).map(function(f){ return f.name; });
  if(prog.subclassLevel && level >= prog.subclassLevel && !subclass) labels.unshift("Choose "+prog.subclassLabel);
  if(prog.asiLevels.indexOf(level)!==-1) labels.push("Ability Score Improvement");
  return labels;
}

function resetChoicesFor(name){
  if(lu.className===name) return;
  lu.className = name;
  lu.subclass = ""; lu.subclassCustom = "";
  lu.asi = {str:0,dex:0,con:0,int:0,wis:0,cha:0}; lu.featName = ""; lu.asiMode = "asi";
  lu.hpRoll = null; lu.hpMethod = "avg";
}

function stepClass(container){
  var c = lu.c;
  var card = stepCard(container, "Advance a class",
    "<b>How levelling works:</b> each level you gain goes into one class. Most players keep levelling the class they started with — that's how you unlock its strongest features.");
  var grid = ce("div","class-pick-grid");
  c.classes.forEach(function(cl){
    var next = (Number(cl.level)||1)+1;
    var box = ce("div","class-pick-card"+(lu.className===cl.name?" selected":""));
    var gains = gainLabels(cl.name, cl.subclass, next);
    box.innerHTML = "<h4>"+escapeHtml(cl.name)+" "+(cl.level||1)+" → "+next+"</h4>"+
      (cl.subclass ? "<p><i>"+escapeHtml(cl.subclass)+"</i></p>" : "")+
      "<p>"+(gains.length ? "Gains: "+escapeHtml(gains.join(", ")) : "More hit points (no new class features this level)")+"</p>";
    box.addEventListener("click", function(){ resetChoicesFor(cl.name); render(); });
    grid.appendChild(box);
  });
  card.appendChild(grid);

  var mcCard = stepCard(container, "…or multiclass",
    "<b>Multiclassing</b> adds level 1 of a different class. You need <b>13 or higher</b> in the key ability of your current class(es) <i>and</i> of the new one. "+
    "You only get some of the new class's proficiencies and none of its saving throws. It's optional and mostly for experienced players.");
  var blockers = c.classes.filter(function(cl){ return !meetsPrereq(c, cl.name); });
  if(blockers.length){
    var warn = ce("p","lu-note");
    warn.textContent = "You can't multiclass yet: your "+blockers.map(function(cl){ return cl.name+" needs "+prereqText(cl.name); }).join("; ")+".";
    mcCard.appendChild(warn);
  }
  var mcGrid = ce("div","class-pick-grid");
  CLASS_LIST.forEach(function(name){
    if(c.classes.some(function(cl){ return cl.name===name; })) return;
    var ok = !blockers.length && meetsPrereq(c, name);
    var box = ce("div","class-pick-card"+(ok?"":" disabled")+(lu.className===name?" selected":""));
    var info = CLASSES_INFO[name];
    box.innerHTML = "<h4>"+escapeHtml(name)+" 1</h4><p>"+escapeHtml(info ? info.blurb : "")+"</p>"+
      "<span class='soon'>Needs "+escapeHtml(prereqText(name))+"</span>";
    if(ok) box.addEventListener("click", function(){ resetChoicesFor(name); render(); });
    mcGrid.appendChild(box);
  });
  mcCard.appendChild(mcGrid);
}

function stepSubclass(container){
  var t = target();
  var label = t.prog.subclassLabel || "Subclass";
  var card = stepCard(container, "Choose your "+label,
    "<b>Your "+escapeHtml(label)+"</b> is your "+escapeHtml(lu.className)+"'s specialisation. It shapes your play style and grants extra features now and at later levels. This choice is permanent, so pick the one that sounds most fun.");
  var list = SUBCLASSES[lu.className] || [];
  list.forEach(function(sub){
    var opt = ce("div","wiz-equip-option"+(lu.subclass===sub.name?" selected":""));
    var feats = [];
    for(var lv=1; lv<=t.newLevel; lv++) ((sub.features||{})[lv]||[]).forEach(function(f){ feats.push(f.name); });
    opt.innerHTML = "<b>"+escapeHtml(sub.name)+"</b><div class='lu-sub-blurb'>"+escapeHtml(sub.blurb)+"</div>"+
      (feats.length ? "<div class='lu-sub-feats'>Unlocks: "+escapeHtml(feats.join(", "))+"</div>" : "");
    opt.addEventListener("click", function(){ lu.subclass = sub.name; render(); });
    card.appendChild(opt);
  });
  var custom = ce("div","wiz-equip-option"+(lu.subclass==="__custom__"?" selected":""));
  custom.innerHTML = "<b>Custom / homebrew…</b><div class='lu-sub-blurb'>Another sourcebook or your DM's own — add its features as custom features afterwards.</div>";
  custom.addEventListener("click", function(){ if(lu.subclass!=="__custom__"){ lu.subclass = "__custom__"; render(); } });
  if(lu.subclass==="__custom__"){
    var input = document.createElement("input");
    input.type = "text"; input.className = "wiz-spell-search lu-custom-input";
    input.placeholder = label+" name";
    input.value = lu.subclassCustom;
    input.addEventListener("click", function(e){ e.stopPropagation(); });
    input.addEventListener("input", function(){ lu.subclassCustom = input.value; });
    custom.appendChild(input);
    setTimeout(function(){ input.focus(); }, 0);
  }
  card.appendChild(custom);
}

function stepAsi(container){
  var c = lu.c;
  var card = stepCard(container, "Ability Score Improvement",
    "<b>Get stronger:</b> raise one ability score by 2, or two scores by 1 each (max 20). Or, instead, take a <b>feat</b> — a special talent. If you're unsure, raising your class's main ability is always a solid choice.");
  var row = ce("div","wiz-method-row");
  [["asi","Raise ability scores"],["feat","Take a feat instead"]].forEach(function(m){
    var b = document.createElement("button");
    b.className = "btn wiz-method-btn"+(lu.asiMode===m[0]?" primary":"");
    b.textContent = m[1];
    b.addEventListener("click", function(){ lu.asiMode = m[0]; render(); });
    row.appendChild(b);
  });
  card.appendChild(row);

  if(lu.asiMode==="asi"){
    var left = ce("p","lu-points");
    left.textContent = "Points left: "+(2-asiPointsUsed())+" / 2";
    card.appendChild(left);
    ABILITIES.forEach(function(a){
      var k = a[0];
      var base = Number(c.abilities[k])||10;
      var r = ce("div","lu-asi-row");
      var name = ce("span","lu-asi-name"); name.textContent = a[1];
      var val = ce("span","lu-asi-val");
      var now = base + lu.asi[k];
      val.textContent = now + " (" + fmtMod(mod(now)) + ")" + (lu.asi[k] ? "  +" + lu.asi[k] : "");
      if(lu.asi[k]) val.classList.add("up");
      var minus = document.createElement("button");
      minus.className = "btn small"; minus.textContent = "−";
      minus.disabled = lu.asi[k]<=0;
      minus.addEventListener("click", function(){ lu.asi[k]--; render(); });
      var plus = document.createElement("button");
      plus.className = "btn small"; plus.textContent = "+";
      plus.disabled = asiPointsUsed()>=2 || lu.asi[k]>=2 || now>=20;
      plus.addEventListener("click", function(){ lu.asi[k]++; render(); });
      r.appendChild(name); r.appendChild(val); r.appendChild(minus); r.appendChild(plus);
      card.appendChild(r);
    });
    return;
  }

  var search = document.createElement("input");
  search.type = "text"; search.className = "wiz-spell-search";
  search.placeholder = "Search feats…"; search.value = lu.featQuery;
  card.appendChild(search);
  var list = ce("div","wiz-spell-list");
  card.appendChild(list);
  function fill(){
    list.innerHTML = "";
    var q = lu.featQuery.toLowerCase().trim();
    FEATS_CATALOG.filter(function(f){
      if((c.feats||[]).some(function(x){ return x.name===f.name; })) return false;
      return !q || f.name.toLowerCase().indexOf(q)!==-1 || (f.summary||"").toLowerCase().indexOf(q)!==-1;
    }).slice().sort(function(a,b){ return a.name.localeCompare(b.name); }).forEach(function(f){
      var r = ce("div","wiz-spell-row wiz-pick-row"+(lu.featName===f.name?" selected":""));
      r.innerHTML = "<div class='wiz-spell-text'><b>"+escapeHtml(f.name)+"</b>"+
        (f.prerequisite && f.prerequisite!=="None" ? "<span class='wiz-spell-meta'>Requires: "+escapeHtml(f.prerequisite)+"</span>" : "")+
        "<span class='wiz-spell-desc'>"+escapeHtml(f.summary||"")+"</span></div>";
      r.addEventListener("click", function(){ lu.featName = f.name; fill(); });
      list.appendChild(r);
    });
  }
  search.addEventListener("input", function(){ lu.featQuery = search.value; fill(); });
  fill();
}

function conModAfterAsi(){
  var con = (Number(lu.c.abilities.con)||10) + (lu.asiMode==="asi" && target().asi ? lu.asi.con : 0);
  return mod(con);
}

function stepHp(container){
  var t = target();
  var conMod = conModAfterAsi();
  var avg = t.hitDie/2 + 1;
  var card = stepCard(container, "Hit points",
    "<b>More health:</b> each level adds your "+escapeHtml(lu.className)+" hit die (d"+t.hitDie+") plus your Constitution modifier ("+fmtMod(conMod)+") to your max HP. "+
    "Taking the average is the safe choice; rolling can go higher or lower. Many tables just take the average.");

  var avgOpt = ce("div","wiz-equip-option"+(lu.hpMethod==="avg"?" selected":""));
  avgOpt.innerHTML = "<b>Take the average: "+avg+" "+fmtMod(conMod)+" = "+Math.max(1, avg+conMod)+" HP</b>";
  avgOpt.addEventListener("click", function(){ lu.hpMethod = "avg"; render(); });
  card.appendChild(avgOpt);

  var rollOpt = ce("div","wiz-equip-option"+(lu.hpMethod==="roll"?" selected":""));
  if(lu.hpRoll==null){
    rollOpt.innerHTML = "<b>Roll 1d"+t.hitDie+" "+fmtMod(conMod)+"</b><div class='lu-sub-blurb'>Tap to roll — the result is final.</div>";
    rollOpt.addEventListener("click", function(){
      lu.hpRoll = Math.floor(Math.random()*t.hitDie)+1;
      lu.hpMethod = "roll";
      logRoll("Level-up HP (d"+t.hitDie+fmtMod(conMod)+")", lu.hpRoll+" "+fmtMod(conMod)+" = "+Math.max(1, lu.hpRoll+conMod)+" HP");
      render();
    });
  } else {
    rollOpt.innerHTML = "<b>Rolled "+lu.hpRoll+" "+fmtMod(conMod)+" = "+Math.max(1, lu.hpRoll+conMod)+" HP</b>";
    rollOpt.addEventListener("click", function(){ lu.hpMethod = "roll"; render(); });
  }
  card.appendChild(rollOpt);
}

/* HP gained this level. Raising CON also raises HP retroactively by the
   modifier change for every level you already had. */
function hpGain(){
  var t = target();
  var oldCon = mod(lu.c.abilities.con);
  var newCon = conModAfterAsi();
  var base = lu.hpMethod==="roll" && lu.hpRoll!=null ? lu.hpRoll : t.hitDie/2 + 1;
  return Math.max(1, base + newCon) + (newCon - oldCon) * totalLevel(lu.c);
}

function stepReview(container){
  var c = lu.c;
  var t = target();
  var card = stepCard(container, "Review", "Here's what changes. Press <b>Level up!</b> to apply it — you can undo the last level-up from the sheet if you made a mistake.");
  var items = [];
  items.push((t.existing ? lu.className+" "+(t.newLevel-1)+" → "+t.newLevel : "Multiclass: "+lu.className+" 1")+" (character level "+totalLevel(c)+" → "+(totalLevel(c)+1)+")");
  if(t.needsSubclass) items.push(target().prog.subclassLabel+": "+chosenSubclass());
  if(t.asi){
    if(lu.asiMode==="feat") items.push("Feat: "+lu.featName);
    else items.push(ABILITIES.filter(function(a){ return lu.asi[a[0]]; }).map(function(a){ return a[1]+" +"+lu.asi[a[0]]; }).join(", "));
  }
  items.push("Max HP +"+hpGain());
  var newPb = Math.floor(totalLevel(c)/4)+2;
  if(newPb!==profBonus(c)) items.push("Proficiency bonus "+fmtMod(profBonus(c))+" → "+fmtMod(newPb));
  var ul = document.createElement("ul"); ul.className = "lu-review-list";
  items.forEach(function(txt){ var li = document.createElement("li"); li.textContent = txt; ul.appendChild(li); });
  card.appendChild(ul);
  var gains = gainLabels(lu.className, t.existing && t.existing.subclass || chosenSubclass(), t.newLevel)
    .filter(function(l){ return l.indexOf("Choose ")!==0 && l!=="Ability Score Improvement"; });
  if(gains.length){
    var p = ce("p","lu-note");
    p.textContent = "New features: "+gains.join(", ");
    card.appendChild(p);
  }
}

/* ---------------- Apply & undo ---------------- */
function slotSnapshot(c){
  var s = {};
  for(var i=1;i<=9;i++) s[i] = c.spellcasting.slots[i].max;
  return s;
}

/* Recompute slot maximums from the class levels, keeping used counts. */
export function applySpellSlots(c){
  var res = computeSpellSlots(c.classes);
  for(var i=1;i<=9;i++){
    var s = c.spellcasting.slots[i];
    s.max = res.slots[i];
    s.used = clamp(s.used||0, 0, s.max);
  }
  if(res.pact){
    var prev = c.spellcasting.pact;
    c.spellcasting.pact = {max:res.pact.max, slotLevel:res.pact.slotLevel, used: prev ? clamp(prev.used||0, 0, res.pact.max) : 0};
  } else {
    c.spellcasting.pact = null;
  }
}

function hadAnyCasting(slots, pact){
  return !!pact || Object.keys(slots).some(function(k){ return slots[k]>0; });
}

function finish(){
  var c = lu.c;
  var t = target();
  var subName = t.needsSubclass ? chosenSubclass() : null;
  var gain = hpGain();
  var before = {total: totalLevel(c), pb: profBonus(c), slots: slotSnapshot(c), pact: c.spellcasting.pact ? JSON.parse(JSON.stringify(c.spellcasting.pact)) : null};
  var record = {
    className: lu.className, isNewClass: !t.existing, prevSubclass: t.existing ? (t.existing.subclass||"") : "",
    hpGain: gain, speedGain: 0, asi: null, featId: null, unlockIds: [],
    prevSpellcasting: {ability: c.spellcasting.ability, slots: before.slots, pact: before.pact}
  };

  var feat = null;
  if(t.asi && lu.asiMode==="feat"){
    var f = FEATS_CATALOG.find(function(x){ return x.name===lu.featName; });
    feat = {id: uid(), name: f.name, prerequisite: f.prerequisite, category: f.category, summary: f.summary, description: f.description, source: "SRD"};
    c.feats.push(feat);
    record.featId = feat.id;
  } else if(t.asi){
    record.asi = {};
    ABILITIES.forEach(function(a){
      if(!lu.asi[a[0]]) return;
      c.abilities[a[0]] = Math.min(20, (Number(c.abilities[a[0]])||10) + lu.asi[a[0]]);
      record.asi[a[0]] = lu.asi[a[0]];
    });
  }

  var entry = t.existing;
  if(entry) entry.level = t.newLevel;
  else { entry = {name: lu.className, subclass: "", level: 1}; c.classes.push(entry); }
  if(subName) entry.subclass = subName;

  // New features: whatever this class level grants, plus every subclass
  // feature up to now when the subclass was picked on this level-up.
  var gained = classFeaturesGainedAt(entry, t.newLevel);
  if(subName){
    classFeatureList(entry).forEach(function(f){
      if(f.subclass && !gained.some(function(g){ return g.id===f.id; })) gained.push(f);
    });
  }

  ((t.prog.features && t.prog.features[t.newLevel]) || []).forEach(function(f){
    if(f.speed) record.speedGain += f.speed;
  });
  c.speed = (Number(c.speed)||30) + record.speedGain;

  c.hp.max = (Number(c.hp.max)||0) + gain;
  c.hp.current = (Number(c.hp.current)||0) + gain;

  applySpellSlots(c);
  var ability = classSpellAbility(entry);
  if(ability && !hadAnyCasting(before.slots, before.pact) && classCasterType(entry)) c.spellcasting.ability = ability;

  var ids = gained.map(function(f){ return f.id; });
  if(feat) ids.push("feat_"+feat.id);
  ids.forEach(function(id){
    if(c.newUnlocks.indexOf(id)===-1){ c.newUnlocks.push(id); record.unlockIds.push(id); }
  });
  c.levelHistory.push(record);

  save();
  close();
  renderAll();
  playAdd();

  showUnlocked(c, {
    className: entry.name, isNewClass: record.isNewClass, newClassLevel: t.newLevel, subclass: subName,
    totalBefore: before.total, pbBefore: before.pb, hpGain: gain, speedGain: record.speedGain,
    features: gained, feat: feat, asi: record.asi,
    slotsBefore: before.slots, pactBefore: before.pact,
    thirdCaster: classCasterType(entry)==="third"
  });
}

export function undoLastLevelUp(c){
  var rec = c.levelHistory[c.levelHistory.length-1];
  if(!rec) return;
  var entry = c.classes.find(function(cl){ return cl.name===rec.className; });
  var label = rec.className+" "+(entry ? entry.level : "");
  confirmDialog("Undo last level-up?", "This removes "+label+" and reverts the HP, ability scores, feat and spell slots it gave.", function(){
    c.levelHistory.pop();
    if(entry){
      if(rec.isNewClass) c.classes.splice(c.classes.indexOf(entry), 1);
      else { entry.level = Math.max(1, (Number(entry.level)||1)-1); entry.subclass = rec.prevSubclass; }
    }
    if(rec.asi) Object.keys(rec.asi).forEach(function(k){ c.abilities[k] = (Number(c.abilities[k])||10) - rec.asi[k]; });
    if(rec.featId) c.feats = c.feats.filter(function(f){ return f.id!==rec.featId; });
    c.hp.max = Math.max(1, (Number(c.hp.max)||1) - rec.hpGain);
    c.hp.current = Math.min(Number(c.hp.current)||0, c.hp.max);
    c.speed = (Number(c.speed)||30) - (rec.speedGain||0);
    var prev = rec.prevSpellcasting;
    c.spellcasting.ability = prev.ability;
    for(var i=1;i<=9;i++){
      var s = c.spellcasting.slots[i];
      s.max = prev.slots[i]||0;
      s.used = clamp(s.used||0, 0, s.max);
    }
    c.spellcasting.pact = prev.pact;
    c.newUnlocks = c.newUnlocks.filter(function(id){ return rec.unlockIds.indexOf(id)===-1; });
    c.hitDiceUsed = clamp(c.hitDiceUsed||0, 0, totalLevel(c));
    save(); renderAll(); playDelete();
    showActionToast("Level-up undone — back to level "+totalLevel(c)+".");
  });
}

/* ---------------- "You unlocked…" popup ----------------
   Shown right after levelling so new players see, in plain words, what
   they just gained and what (if anything) they should do next. */
function showUnlocked(c, s){
  var total = totalLevel(c);
  openInfoModal("Level "+total+" reached!", function(body){
    var hero = ce("div","lu-hero");
    hero.innerHTML = "<div class='lu-hero-level'>"+total+"</div><div class='lu-hero-text'><b>"+escapeHtml(c.name||"Your character")+"</b> is now "+
      escapeHtml(s.className)+" "+s.newClassLevel+(s.isNewClass ? " (new class!)" : "")+"</div>";
    body.appendChild(hero);

    var stats = ce("div","lu-stat-row");
    function stat(label, value){
      var d = ce("div","lu-stat"); d.innerHTML = "<span class='lbl'>"+escapeHtml(label)+"</span><span class='val'>"+escapeHtml(value)+"</span>";
      stats.appendChild(d);
    }
    stat("Max HP", "+"+s.hpGain+" (now "+c.hp.max+")");
    if(profBonus(c)!==s.pbBefore) stat("Proficiency", fmtMod(s.pbBefore)+" → "+fmtMod(profBonus(c)));
    if(s.speedGain) stat("Speed", "+"+s.speedGain+" ft");
    if(s.asi) Object.keys(s.asi).forEach(function(k){ stat(abilityName(k), "+"+s.asi[k]+" (now "+c.abilities[k]+")"); });
    var slotChanges = [];
    for(var i=1;i<=9;i++){
      var now = c.spellcasting.slots[i].max;
      if(now!==s.slotsBefore[i]) slotChanges.push(ordinal(i)+"-level ×"+now+(s.slotsBefore[i] ? " (was "+s.slotsBefore[i]+")" : " (new!)"));
    }
    if(slotChanges.length) stat("Spell slots", slotChanges.join(", "));
    var pact = c.spellcasting.pact, pb = s.pactBefore;
    if(pact && (!pb || pb.max!==pact.max || pb.slotLevel!==pact.slotLevel)) stat("Pact slots", pact.max+" × "+ordinal(pact.slotLevel)+"-level");
    body.appendChild(stats);

    if(s.subclass){
      var subP = ce("p","lu-note");
      subP.innerHTML = "You chose <b>"+escapeHtml(s.subclass)+"</b> as your "+escapeHtml(progFor(s.className).subclassLabel||"subclass")+".";
      body.appendChild(subP);
    }

    var unlocked = s.features.map(function(f){ return {name:f.name, text:f.text, tag: f.subclass ? s.subclass : s.className, upgraded: f.upgraded}; });
    if(s.feat) unlocked.push({name:s.feat.name, text:s.feat.summary || s.feat.description, tag:"Feat"});
    if(unlocked.length){
      var h = ce("h5","info-modal-subhead"); h.textContent = "New things you unlocked";
      body.appendChild(h);
      unlocked.forEach(function(u){
        var card = ce("div","lu-unlock");
        card.innerHTML = "<div class='lu-unlock-top'><span class='lu-new-badge'>"+(u.upgraded ? "Upgraded" : "New")+"</span><b>"+escapeHtml(u.name)+"</b><span class='ff-tag source-class'>"+escapeHtml(u.tag)+"</span></div>"+
          "<div class='lu-unlock-text'>"+escapeHtml(u.text)+"</div>";
        body.appendChild(card);
      });
    }

    var tips = [];
    var spellTip = s.thirdCaster ? THIRD_CASTER_SPELL_TIPS[s.newClassLevel] : (SPELL_TIPS[s.className]||{})[s.newClassLevel];
    if(spellTip) tips.push(spellTip+" Add them on the Spells tab.");
    if(s.isNewClass){
      var m = progFor(s.className).multiclassProfs;
      if(m){
        var profs = m.armor.concat(m.weapons, m.tools);
        if(profs.length) tips.push("New proficiencies: "+profs.join(", ")+".");
        if(m.note) tips.push(m.note);
      }
    }
    if(s.feat && /increase your \w+/i.test(s.feat.description||"")) tips.push("Your feat raises an ability score — add it on the Abilities & Skills tab.");
    if(unlocked.length) tips.push("These are marked NEW on the Features & Feats tab — tap one to clear its badge.");
    if(total < MAX_LEVEL) tips.push("Next level at "+XP_THRESHOLDS[total+1].toLocaleString()+" XP.");
    else tips.push("That's the highest level supported for now — more levels are coming.");
    var th = ce("h5","info-modal-subhead"); th.textContent = "What to do next";
    body.appendChild(th);
    var ul = document.createElement("ul"); ul.className = "lu-tips";
    tips.forEach(function(tip){ var li = document.createElement("li"); li.textContent = tip; ul.appendChild(li); });
    body.appendChild(ul);

    var actions = ce("div","actions");
    var ok = document.createElement("button");
    ok.className = "btn primary"; ok.textContent = "Got it!";
    ok.addEventListener("click", function(){ document.getElementById("info-modal-close").click(); });
    actions.appendChild(ok);
    body.appendChild(actions);
  });
}

function ordinal(n){ return n + (n===1 ? "st" : n===2 ? "nd" : n===3 ? "rd" : "th"); }
