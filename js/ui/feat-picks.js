import { ABILITIES, SKILLS } from "../data/abilities-skills.js";
import { mod, fmtMod, ce } from "../core/helpers.js";
import { themedPicker } from "./themed-picker.js";
import { openInfoModal } from "./info-modal.js";
import {
  TOOL_GROUPS, featDef, featHasPicks, featNeedsChoice, emptyPicks, featPicksProblem,
  expertiseOptions, expertiseReason, applyFeatPicks
} from "../core/feat-picks.js";

/* ---------------- Feat picks UI ----------------
   The choices block for a feat (see js/core/feat-picks.js), shared by the
   level-up dialog, the creation wizard (Variant Human) and the picks
   modal (a feat added from the Compendium, or one taken before the sheet
   applied picks). It changes `picks` in place and calls onChange() after
   each pick so the caller can re-render and re-check.
   ctx: {abilities, skillProfs} of the character taking the feat. */
var SKILL_NAMES = SKILLS.map(function(s){ return s[0]; });

export function renderFeatPicks(def, picks, ctx, onChange){
  var box = ce("div", "fp-box");
  if(!featHasPicks(def)) return box;

  if(def.ability && def.ability.length){
    var choose = def.ability.length > 1;
    box.appendChild(label(choose
      ? (def.saveProf ? "Raise one ability by 1 and gain proficiency in its saving throws" : "Raise one ability by 1 (max 20)")
      : "Raises " + ABILITIES.find(function(a){ return a[0]===def.ability[0]; })[1] + " by 1 (max 20)"));
    var grid = ce("div", "rt-ab-grid fp-ab-grid");
    // Two or three options stay tile-sized; all six use the wizard's grid
    // (three columns on phones).
    if(def.ability.length < 6) grid.style.gridTemplateColumns = "repeat(" + def.ability.length + ", minmax(0, 110px))";
    ABILITIES.filter(function(a){ return def.ability.indexOf(a[0])!==-1; }).forEach(function(a){
      var key = a[0], base = Number(ctx.abilities && ctx.abilities[key])||10;
      var isOn = picks.ability===key, atMax = base>=20;
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "rt-ab" + (isOn ? " on" : "") + (atMax && !isOn ? " off" : "");
      tile.disabled = !choose;
      tile.setAttribute("aria-pressed", isOn ? "true" : "false");
      tile.setAttribute("aria-label", a[1] + " " + base + (atMax ? ", already 20" : ", raise to " + (base + 1)));
      tile.innerHTML = "<span class='rt-ab-lbl'>" + a[1].slice(0,3).toUpperCase() + "</span>" +
        "<span class='rt-ab-score'>" + (isOn && !atMax ? "<s>" + base + "</s> " + (base + 1) : base) + "</span>" +
        "<span class='rt-ab-mod'>" + (atMax ? "max" : isOn ? "+1" : fmtMod(mod(base))) + "</span>";
      if(choose) tile.addEventListener("click", function(){ picks.ability = key; onChange(); });
      grid.appendChild(tile);
    });
    box.appendChild(grid);
  }

  var n = def.skillsOrTools || def.skills || 0;
  if(n){
    box.appendChild(label(def.skillsOrTools ? "Gain proficiency in " + n + " skills or tools" : "Gain proficiency in " + (n > 1 ? n + " skills" : "a skill")));
    var groups = def.skillsOrTools ? Object.assign({"Skills": SKILL_NAMES}, TOOL_GROUPS) : {"": SKILL_NAMES};
    for(var i = 0; i < n; i++) (function(i){
      box.appendChild(field(themedPicker({
        key: "feat:" + def.name + ":skill:" + i, ariaLabel: def.name + " proficiency " + (i + 1),
        placeholder: def.skillsOrTools ? "Choose a skill or tool" : "Choose a skill",
        groups: groups, value: picks.skills[i] || "",
        reasonFor: function(v){
          var e = ctx.skillProfs && ctx.skillProfs[v];
          if(e && e.prof) return "known";
          return v!==picks.skills[i] && picks.skills.indexOf(v)!==-1 ? "picked" : "";
        },
        onPick: function(v){
          picks.skills[i] = v;
          // An expertise pick that leaned on a replaced skill no longer fits.
          picks.expertise = picks.expertise.filter(function(x){ return !expertiseReason(ctx, picks, x); });
          onChange();
        }
      })));
    })(i);
  }

  for(var j = 0; j < (def.expertise || 0); j++) (function(j){
    if(j===0) box.appendChild(label("Expertise: double your proficiency bonus in one skill you're proficient in"));
    box.appendChild(field(themedPicker({
      key: "feat:" + def.name + ":expertise:" + j, ariaLabel: def.name + " expertise",
      placeholder: "Choose a skill", groups: {"": expertiseOptions(ctx, picks)}, value: picks.expertise[j] || "",
      reasonFor: function(v){
        if(v!==picks.expertise[j] && picks.expertise.indexOf(v)!==-1) return "picked";
        return expertiseReason(ctx, picks, v)==="expert" ? "expertise" : "";
      },
      onPick: function(v){ picks.expertise[j] = v; onChange(); }
    })));
  })(j);
  return box;
}
function label(text){ var l = ce("div", "fp-label"); l.textContent = text; return l; }
function field(el){ var f = ce("div", "field rt-field fp-field"); f.appendChild(el); return f; }

/* Make a feat's picks after it was added: from the Compendium, or on a
   feat taken before the sheet applied them. A feat with nothing to
   choose (Actor: CHA +1) is applied right away. "I've already added it"
   marks it done without changing anything, for players who raised the
   score by hand. onDone() runs after either. */
export function openFeatPicksModal(c, feat, onDone){
  var def = featDef(feat.name);
  var picks = emptyPicks(def);
  var ctx = {abilities: c.abilities, skillProfs: c.skillProfs};
  openInfoModal(feat.name, function(body){
    var lead = ce("p", "fp-lead");
    lead.textContent = featNeedsChoice(def)
      ? "Choose what " + feat.name + " gives " + (c.name || "your character") + ". The sheet applies it, and removing the feat takes it back."
      : "The sheet applies this for you, and removing the feat takes it back.";
    body.appendChild(lead);
    var holder = ce("div");
    body.appendChild(holder);
    var problem = ce("p", "fp-problem");
    body.appendChild(problem);
    var row = ce("div", "cmp-give-row fp-modal-row");
    var apply = document.createElement("button");
    apply.type = "button"; apply.className = "btn primary"; apply.textContent = "Apply";
    var manual = document.createElement("button");
    manual.type = "button"; manual.className = "btn ghost"; manual.textContent = "I've already added it";
    manual.title = "Mark it done without changing the sheet";
    row.appendChild(manual); row.appendChild(apply);
    body.appendChild(row);
    function draw(){
      holder.innerHTML = "";
      holder.appendChild(renderFeatPicks(def, picks, ctx, draw));
      var why = featPicksProblem(def, picks, ctx);
      apply.disabled = !!why;
      problem.textContent = why;
    }
    function close(){ document.getElementById("info-modal-close").click(); }
    apply.addEventListener("click", function(){ applyFeatPicks(c, feat, picks); close(); onDone(); });
    manual.addEventListener("click", function(){ feat.picks = {ability: "", skills: [], expertise: []}; close(); onDone(); });
    draw();
  });
}
