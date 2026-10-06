import { save } from "../../core/state.js";
import { fmtMod, mod, computeSave, passivePerception, passiveInvestigation, passiveInsight, getCharacterSenses, computeDarkvision, checkAbility, abilityCheck, skillCheck, saveRollMode, escapeHtml } from "../../core/helpers.js";
import { ABILITIES, SKILLS } from "../../data/abilities-skills.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg, makeAlertSvg } from "../../ui/svg-icons.js";
import { performRoll } from "../../dice/dice.js";

/* "Adv" / "Dis" tag for a check, save or skill that rolls that way. */
function rollTag(roll){
  var tag = document.createElement("span");
  tag.className = "skill-roll-tag " + roll.mode;
  if(roll.mode==="dis") tag.innerHTML = makeAlertSvg() + "Dis";
  else tag.textContent = "Adv";
  tag.title = roll.reason;
  return tag;
}

/* The modifier pill on a save or skill row: a button, so a roll can be
   made from the keyboard too. Its click bubbles up to the row's roll. */
function rollButton(value, label){
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "row-mod";
  btn.textContent = fmtMod(value);
  btn.setAttribute("aria-label", "Roll " + label + " (" + fmtMod(value) + ")");
  return btn;
}

/* Clicking anywhere on a save or skill row rolls it, except its checkboxes. */
function onRowRoll(row, roll){
  row.addEventListener("click", function(e){
    if(e.target.closest("input")) return;
    roll();
  });
}

/* ---- Abilities & Skills panel ---- */
export function renderAbilitiesPanel(c){
  var panel = document.createElement("div");

  var abCard = makeCard("Ability scores");
  var grid = document.createElement("div");
  grid.className = "abilities-grid";
  ABILITIES.forEach(function(a){
    var key = a[0];
    var score = Number(c.abilities[key]) || 10;
    var m = mod(score);
    // The box shows the modifier (Arms of the Astral Self can swap WIS in
    // for STR); a check also adds Jack of All Trades and can roll with
    // disadvantage (armor without proficiency).
    var shown = checkAbility(c, key).mod;
    var check = abilityCheck(c, key);
    var box = document.createElement("div");
    box.className = "ability-box";

    var rollArea = document.createElement("div");
    rollArea.className = "ability-roll-area";
    rollArea.title = "Roll " + a[1] + " check (1d20" + fmtMod(check.value) + (check.value!==m ? ": " + check.breakdown : "") + ")" +
      (check.roll.mode!=="none" ? ". " + (check.roll.mode==="dis" ? "Disadvantage: " : "Advantage: ") + check.roll.reason : "");
    rollArea.setAttribute("role", "button");
    rollArea.setAttribute("tabindex", "0");
    rollArea.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(shown)+'</div>';
    if(check.roll.mode!=="none") rollArea.appendChild(rollTag(check.roll));
    function rollCheck(){ performRoll(20,1,check.value,check.roll.mode, a[1]+" check"); }
    rollArea.addEventListener("click", function(e){
      e.stopPropagation();
      rollCheck();
    });
    rollArea.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        rollCheck();
      }
    });
    box.appendChild(rollArea);

    var stepper = document.createElement("div");
    stepper.className = "stat-stepper";

    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "stat-arrow-btn stat-arrow-down";
    downBtn.title = "Decrease " + a[1] + " (Down arrow)";
    downBtn.setAttribute("aria-label", "Decrease " + a[1]);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = score <= 1;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = Number(c.abilities[key]) || 10;
      if(cur > 1){
        c.abilities[key] = cur - 1;
        save();
        renderAll();
      }
    });

    var val = document.createElement("span");
    val.className = "stat-score-val";
    val.textContent = score;
    val.setAttribute("aria-label", a[1] + " score");
    val.title = a[1] + " score: " + score;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "stat-arrow-btn stat-arrow-up";
    upBtn.title = "Increase " + a[1] + " (Up arrow)";
    upBtn.setAttribute("aria-label", "Increase " + a[1]);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.disabled = score >= 30;
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var cur = Number(c.abilities[key]) || 10;
      if(cur < 30){
        c.abilities[key] = cur + 1;
        save();
        renderAll();
      }
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(val);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    grid.appendChild(box);
  });
  abCard.appendChild(grid);
  panel.appendChild(abCard);

  var saveCard = makeCard("Saving throws");
  var saveRows = document.createElement("div");
  saveRows.className = "save-grid";
  ABILITIES.forEach(function(a){
    var key = a[0];
    var sv = computeSave(c, key);
    var total = sv.value;
    var saveRoll = saveRollMode(c, key);
    var row = document.createElement("div");
    row.className = "list-row save-tile" + (sv.prof ? " is-prof" : "");
    row.title = sv.breakdown;
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="prof-pip"; cb.checked = sv.prof;
    cb.title = "Proficient in " + a[1] + " saves";
    cb.setAttribute("aria-label", cb.title);
    // A save a feature makes proficient (Diamond Soul) is locked on;
    // the player's own ticks are left as they are underneath.
    if(sv.grantedBy){ cb.disabled = true; cb.title = "Proficient from " + sv.grantedBy; }
    cb.addEventListener("change", function(){ c.saveProfs[key]=cb.checked; save(); renderAll(); });
    var name = document.createElement("span");
    name.className = "row-name"; name.textContent = a[1];
    if(saveRoll.mode!=="none"){ name.appendChild(rollTag(saveRoll)); name.title = saveRoll.reason; }
    row.appendChild(cb); row.appendChild(name); row.appendChild(rollButton(total, a[1] + " save"));
    onRowRoll(row, function(){ performRoll(20,1,total,saveRoll.mode, a[1]+" save"); });
    saveRows.appendChild(row);
  });
  saveCard.appendChild(saveRows);
  panel.appendChild(saveCard);

  var skillCard = makeCard("Skills");
  var legend = document.createElement("span");
  legend.className = "prof-legend";
  legend.innerHTML = '<span><i class="legend-pip"></i>Proficient</span><span><i class="legend-pip exp"></i>Expertise</span>';
  skillCard.querySelector("h3").appendChild(legend);
  var skillRows = document.createElement("div");
  skillRows.className = "skill-list";
  skillRows.style.setProperty("--skill-rows", Math.ceil(SKILLS.length / 2));
  SKILLS.forEach(function(s){
    var name = s[0], ab = s[1];
    var entry = c.skillProfs[name] || {prof:false, expertise:false};
    var check = skillCheck(c, name);
    var skillAbility = checkAbility(c, ab);
    var bonus = check.value;
    var row = document.createElement("div");
    row.className = "list-row skill-row" + (entry.expertise ? " is-exp" : entry.prof ? " is-prof" : "");
    var pips = document.createElement("span");
    pips.className = "skill-pips";
    var profCb = document.createElement("input");
    profCb.type="checkbox"; profCb.className="prof-pip";
    profCb.checked = !!entry.prof;
    profCb.title = "Proficient in " + name;
    profCb.setAttribute("aria-label", profCb.title);
    // Expertise needs proficiency: dropping proficiency drops it too.
    profCb.addEventListener("change", function(){ entry.prof = profCb.checked; if(!entry.prof) entry.expertise = false; c.skillProfs[name]=entry; save(); renderAll(); });
    var expCb = document.createElement("input");
    expCb.type="checkbox"; expCb.className="exp-chk";
    expCb.checked = !!entry.expertise;
    expCb.title = "Expertise in " + name;
    expCb.setAttribute("aria-label", expCb.title);
    // ...and ticking expertise ticks proficiency.
    expCb.addEventListener("change", function(){ entry.expertise = expCb.checked; if(entry.expertise) entry.prof = true; c.skillProfs[name]=entry; save(); renderAll(); });
    pips.appendChild(profCb); pips.appendChild(expCb);
    var nameSpan = document.createElement("span");
    nameSpan.className = "row-name"; nameSpan.textContent = name;
    // Stealth with armor's disadvantage (or Dampening Field's advantage),
    // advantage from an effect that's on (Bladesong, the astral visage).
    var roll = check.roll;
    var rollMode = roll.mode;
    if(rollMode!=="none"){
      nameSpan.appendChild(rollTag(roll));
      nameSpan.title = roll.reason;
    } else if(roll.reason) nameSpan.title = roll.reason;   // advantage and disadvantage cancelled
    row.title = check.breakdown;
    var abbr = document.createElement("span");
    abbr.className = "abbr"; abbr.textContent = skillAbility.label.slice(0, 3);
    if(skillAbility.label.length > 3) abbr.title = skillAbility.label;
    row.appendChild(pips); row.appendChild(nameSpan); row.appendChild(abbr); row.appendChild(rollButton(bonus, name));
    onRowRoll(row, function(){ performRoll(20,1,bonus,rollMode, name); });
    skillRows.appendChild(row);
  });
  skillCard.appendChild(skillRows);
  panel.appendChild(skillCard);

  var passCard = makeCard("Passive senses");
  var passGrid = document.createElement("div");
  passGrid.className = "passives-grid";
  var pPerc = passivePerception(c);
  var pInv = passiveInvestigation(c);
  var pIns = passiveInsight(c);
  var senses = getCharacterSenses(c);

  [
    { label: "Passive Perception", val: pPerc, sub: "WIS ("+fmtMod(mod(c.abilities.wis))+")" },
    { label: "Passive Investigation", val: pInv, sub: "INT ("+fmtMod(mod(c.abilities.int))+")" },
    { label: "Passive Insight", val: pIns, sub: "WIS ("+fmtMod(mod(c.abilities.wis))+")" },
    { label: "Senses", val: senses, sub: computeDarkvision(c).sources.join(", ") || (c.race || "Base race") }
  ].forEach(function(st){
    var box = document.createElement("div");
    box.className = "passive-box";
    var valStyle = typeof st.val === "string" && st.val.length > 8 ? "font-size:15px;line-height:1.3;margin-top:2px;" : "";
    box.innerHTML = '<div class="lbl">' + escapeHtml(st.label) + '</div>' +
      '<div class="val" style="' + valStyle + '">' + escapeHtml(String(st.val)) + '</div>' +
      '<div class="sub">' + escapeHtml(st.sub) + '</div>';
    passGrid.appendChild(box);
  });
  passCard.appendChild(passGrid);
  panel.appendChild(passCard);

  return panel;
}
