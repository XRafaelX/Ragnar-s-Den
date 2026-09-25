import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL, XP_THRESHOLDS } from "../data/progression.js";
import { ce, escapeHtml, totalLevel, classFeatureList } from "../core/helpers.js";
import { save } from "../core/state.js";
import { renderAll } from "../render/sheet.js";
import { openInfoModal } from "../ui/info-modal.js";
import { playAdd } from "../ui/sound.js";
import { showActionToast } from "../ui/toast.js";
import { makeLevelUpSvg, makeUndoSvg } from "../ui/svg-icons.js";
import { openLevelUp, undoLastLevelUp, applySpellSlots } from "./levelup.js";

var QUICK_XP = [50, 100, 250, 500];
var customXpOpen = false;

/* ---------------- Experience strip ----------------
   Level badge, XP progress toward the next level, a quick "+XP" field and
   the Level up button. Level up unlocks (and glows) only once the XP
   threshold for the next level is reached. XP can't go past
   what the next level needs (at the level cap: what this level needed);
   you level up to keep earning. */
export function buildLevelRow(c){
  var row = ce("div","level-row");
  var level = totalLevel(c);
  var atCap = level >= MAX_LEVEL;
  var floor = XP_THRESHOLDS[level] || 0;
  var next = XP_THRESHOLDS[level+1];
  var maxXp = atCap ? floor : next;
  var xp = Math.min(Number(c.xp)||0, maxXp); // older saves may hold more
  var full = xp >= maxXp;
  var ready = !atCap && full;

  var badge = ce("div","lvl-badge");
  badge.setAttribute("aria-label", "Level "+level);
  badge.innerHTML = "<span class='lvl-caption' aria-hidden='true'>Level</span><span class='lvl-circle' aria-hidden='true'><b>"+level+"</b></span>";
  row.appendChild(badge);

  var block = ce("div","xp-block");
  var top = ce("div","xp-top");
  var hint;
  if(atCap) hint = "Max level ("+MAX_LEVEL+") for now";
  else if(ready) hint = "Ready to level up!";
  else hint = (next - xp).toLocaleString()+" XP to level "+(level+1);
  top.innerHTML = "<span class='xp-num'>"+xp.toLocaleString()+(atCap ? "" : " / "+next.toLocaleString())+" XP</span>"+
    "<span class='xp-hint"+(ready?" ready":"")+"'>"+escapeHtml(hint)+"</span>";
  block.appendChild(top);
  var bar = ce("div","xp-bar");
  var fill = ce("div","xp-fill");
  var pct = atCap ? 100 : Math.max(0, Math.min(100, (xp - floor) / (next - floor) * 100));
  fill.style.width = pct+"%";
  bar.appendChild(fill);
  block.appendChild(bar);

  function setXp(total){
    total = Math.round(total);
    var capped = total > maxXp;
    total = Math.max(0, Math.min(maxXp, total));
    if(capped) showActionToast(atCap
      ? "XP is capped at "+maxXp.toLocaleString()+". Level "+MAX_LEVEL+" is the highest for now."
      : "XP capped at "+maxXp.toLocaleString()+". Level up to keep earning.");
    if(total===xp && (Number(c.xp)||0)===xp) return;
    c.xp = total;
    save(); renderAll();
    if(!ready && !atCap && c.xp >= next) playAdd();
  }

  // One-tap awards for the common round numbers, plus "Custom" which
  // swaps the buttons for a field: exact amounts, or a negative number to
  // fix a mis-tap. Custom stays usable when XP is full, for corrections.
  var chips = ce("div","xp-chips");
  if(customXpOpen){
    var input = document.createElement("input");
    input.type = "number"; input.className = "xp-custom-input";
    input.placeholder = "XP"; input.setAttribute("aria-label", "XP to add, negative to remove");
    var addBtn = document.createElement("button");
    addBtn.type = "button"; addBtn.className = "xp-chip xp-chip-primary"; addBtn.textContent = "Add";
    var closeBtn = document.createElement("button");
    closeBtn.type = "button"; closeBtn.className = "xp-chip xp-chip-close"; closeBtn.textContent = "✕";
    closeBtn.title = "Close"; closeBtn.setAttribute("aria-label", "Close custom XP");
    function closeCustom(){ customXpOpen = false; renderAll(); }
    function submit(){
      var n = Number(input.value)||0;
      if(!n) return;
      customXpOpen = false;
      if(Math.min(maxXp, Math.max(0, xp + n))===xp) renderAll(); // nothing changed, still close
      setXp(xp + n);
    }
    addBtn.addEventListener("click", submit);
    closeBtn.addEventListener("click", closeCustom);
    input.addEventListener("keydown", function(e){
      if(e.key==="Enter") submit();
      else if(e.key==="Escape") closeCustom();
    });
    chips.appendChild(input); chips.appendChild(addBtn); chips.appendChild(closeBtn);
  } else {
    QUICK_XP.forEach(function(n){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "xp-chip";
      chip.textContent = "+"+n;
      chip.title = full ? (atCap ? "Max XP for now" : "Level up to earn more XP") : "Add "+n+" XP";
      chip.disabled = full;
      chip.addEventListener("click", function(){ setXp(xp + n); });
      chips.appendChild(chip);
    });
    var customBtn = document.createElement("button");
    customBtn.type = "button"; customBtn.className = "xp-chip xp-chip-custom";
    customBtn.textContent = "Custom";
    customBtn.title = "Add an exact amount, or remove XP";
    customBtn.addEventListener("click", function(){
      customXpOpen = true;
      renderAll();
      var field = document.querySelector(".xp-custom-input");
      if(field) field.focus();
    });
    chips.appendChild(customBtn);
  }
  block.appendChild(chips);
  row.appendChild(block);

  var actions = ce("div","level-actions");
  var lvlBtn = document.createElement("button");
  lvlBtn.className = "btn small primary levelup-btn"+(ready ? " ready" : "");
  lvlBtn.innerHTML = atCap ? "Max level" : makeLevelUpSvg() + "Level up";
  lvlBtn.disabled = !ready;
  if(!atCap && !ready) lvlBtn.title = "Reach "+next.toLocaleString()+" XP to level up";
  lvlBtn.addEventListener("click", function(){ openLevelUp(c); });
  actions.appendChild(lvlBtn);
  if(c.levelHistory && c.levelHistory.length){
    var undo = document.createElement("button");
    undo.className = "btn small ghost undo-level-btn";
    undo.innerHTML = makeUndoSvg() + "Undo level";
    undo.title = "Undo the last level-up";
    undo.addEventListener("click", function(){ undoLastLevelUp(c); });
    actions.appendChild(undo);
  }
  row.appendChild(actions);
  return row;
}

/* A class chip is tappable to pick (or change) its subclass once the
   class has reached its subclass level; covers characters whose level
   was set before subclasses were chosen during level-up. */
export function subclassEligible(cl){
  var prog = CLASS_PROGRESSION[cl.name];
  return !!(prog && prog.subclassLevel && (Number(cl.level)||1) >= prog.subclassLevel);
}

export function openSubclassPicker(c, cl){
  var prog = CLASS_PROGRESSION[cl.name];
  openInfoModal(cl.name+": "+prog.subclassLabel, function(body){
    var p = ce("p","lu-note");
    p.textContent = "Your "+prog.subclassLabel+" is your "+cl.name+"'s specialisation, gained at level "+prog.subclassLevel+". Pick one to add its features to your sheet.";
    body.appendChild(p);
    (SUBCLASSES[cl.name]||[]).forEach(function(sub){
      var opt = ce("div","wiz-equip-option"+(cl.subclass===sub.name?" selected":""));
      opt.innerHTML = "<b>"+escapeHtml(sub.name)+"</b><div class='lu-sub-blurb'>"+escapeHtml(sub.blurb)+"</div>";
      opt.addEventListener("click", function(){ choose(sub.name); });
      body.appendChild(opt);
    });
    var customRow = ce("div","lu-custom-row");
    var input = document.createElement("input");
    input.type = "text"; input.className = "wiz-spell-search"; input.placeholder = "Custom / homebrew name";
    var known = (SUBCLASSES[cl.name]||[]).some(function(s){ return s.name===cl.subclass; });
    if(cl.subclass && !known) input.value = cl.subclass;
    var useBtn = document.createElement("button");
    useBtn.className = "btn small"; useBtn.textContent = "Use custom";
    useBtn.addEventListener("click", function(){ if(input.value.trim()) choose(input.value.trim()); });
    customRow.appendChild(input); customRow.appendChild(useBtn);
    body.appendChild(customRow);
  });

  function choose(name){
    cl.subclass = name;
    classFeatureList(cl).forEach(function(f){
      if(f.subclass && c.newUnlocks.indexOf(f.id)===-1) c.newUnlocks.push(f.id);
    });
    applySpellSlots(c); // an Eldritch Knight / Arcane Trickster changes slots
    save();
    document.getElementById("info-modal-close").click();
    renderAll();
    playAdd();
  }
}
