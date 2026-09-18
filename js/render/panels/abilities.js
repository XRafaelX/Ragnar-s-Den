import { save } from "../../core/state.js";
import { fmtMod, mod, profBonus, passivePerception, passiveInvestigation, passiveInsight, getCharacterSenses, escapeHtml } from "../../core/helpers.js";
import { ABILITIES, SKILLS } from "../../data/abilities-skills.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";
import { performRoll } from "../../dice/dice.js";

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
    var box = document.createElement("div");
    box.className = "ability-box";

    var rollArea = document.createElement("div");
    rollArea.className = "ability-roll-area";
    rollArea.title = "Roll " + a[1] + " check (1d20" + fmtMod(m) + ")";
    rollArea.setAttribute("role", "button");
    rollArea.setAttribute("tabindex", "0");
    rollArea.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(m)+'</div>';
    rollArea.addEventListener("click", function(e){
      e.stopPropagation();
      performRoll(20,1,mod(c.abilities[key]),"none", a[1]+" check");
    });
    rollArea.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        performRoll(20,1,mod(c.abilities[key]),"none", a[1]+" check");
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
  saveRows.className = "list-rows";
  ABILITIES.forEach(function(a){
    var key = a[0];
    var pb = c.saveProfs[key] ? profBonus(c) : 0;
    var total = mod(c.abilities[key]) + pb;
    var row = document.createElement("div");
    row.className = "list-row";
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk"; cb.checked = !!c.saveProfs[key];
    cb.addEventListener("change", function(){ c.saveProfs[key]=cb.checked; save(); renderAll(); });
    var name = document.createElement("span");
    name.className = "row-name"; name.textContent = a[1];
    name.addEventListener("click", function(){ performRoll(20,1,total,"none", a[1]+" save"); });
    var modSpan = document.createElement("span");
    modSpan.className = "row-mod"; modSpan.textContent = fmtMod(total);
    row.appendChild(cb); row.appendChild(name); row.appendChild(modSpan);
    saveRows.appendChild(row);
  });
  saveCard.appendChild(saveRows);
  panel.appendChild(saveCard);

  var skillCard = makeCard("Skills");
  var skillRows = document.createElement("div");
  skillRows.className = "list-rows";
  var header = document.createElement("div");
  header.className = "list-row";
  header.style.borderBottom = "1px solid var(--rule)";
  header.innerHTML = '<span style="width:15px;font-size:10px;color:var(--text-on-parch-dim);">P</span>'+
    '<span style="width:15px;font-size:10px;color:var(--text-on-parch-dim);">E</span>'+
    '<span class="row-name" style="font-size:10px;color:var(--text-on-parch-dim);text-transform:uppercase;">Skill</span>'+
    '<span class="abbr"></span><span class="row-mod"></span>';
  skillRows.appendChild(header);
  SKILLS.forEach(function(s){
    var name = s[0], ab = s[1];
    var entry = c.skillProfs[name] || {prof:false, expertise:false};
    var pb = profBonus(c);
    var bonus = mod(c.abilities[ab]) + (entry.expertise ? pb*2 : (entry.prof ? pb : 0));
    var row = document.createElement("div");
    row.className = "list-row";
    var profCb = document.createElement("input");
    profCb.type="checkbox"; profCb.className="chk";
    profCb.checked = !!entry.prof;
    profCb.addEventListener("change", function(){ entry.prof = profCb.checked; c.skillProfs[name]=entry; save(); renderAll(); });
    var expCb = document.createElement("input");
    expCb.type="checkbox"; expCb.className="exp-chk";
    expCb.checked = !!entry.expertise;
    expCb.addEventListener("change", function(){ entry.expertise = expCb.checked; c.skillProfs[name]=entry; save(); renderAll(); });
    var nameSpan = document.createElement("span");
    nameSpan.className = "row-name"; nameSpan.textContent = name;
    nameSpan.addEventListener("click", function(){ performRoll(20,1,bonus,"none", name); });
    var abbr = document.createElement("span");
    abbr.className = "abbr"; abbr.textContent = ab.toUpperCase();
    var modSpan = document.createElement("span");
    modSpan.className = "row-mod"; modSpan.textContent = fmtMod(bonus);
    row.appendChild(profCb); row.appendChild(expCb); row.appendChild(nameSpan); row.appendChild(abbr); row.appendChild(modSpan);
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
    { label: "Senses", val: senses, sub: (c.race || "Base race") }
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
