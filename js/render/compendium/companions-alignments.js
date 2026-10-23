/* ---------------- Compendium: Companions and Alignments ----------------
   The Companions tab (read-only stat blocks with a level stepper) and the
   Alignments tab with its grid. */
import { openInfoModal } from "../../ui/info-modal.js";
import { ALIGNMENTS, ALIGNMENT_INFO, ALIGNMENT_DETAILS } from "../../data/alignments.js";
import { escapeHtml, ce } from "../../core/helpers.js";
import { facts } from "../../ui/homebrew-form.js";
import { COMPANIONS, BEAST_PRESETS } from "../../data/companions.js";
import { renderStatBlock } from "../panels/companions.js";
import { block } from "./shared.js";

/* A 3×3 alignment grid with this one lit up. */
function alignmentGrid(name){
  var html = "<div class='cmp-align-grid' role='img' aria-label='"+escapeHtml(name)+" on the alignment grid'>";
  ["Good","Neutral","Evil"].forEach(function(m){
    ["Lawful","Neutral","Chaotic"].forEach(function(o){
      var cell = o==="Neutral" && m==="Neutral" ? "True Neutral" : o+" "+m;
      html += "<span class='cmp-align-cell"+(cell===name ? " on" : "")+"'>"+escapeHtml(cell.replace(" ", "\u00a0"))+"</span>";
    });
  });
  return html+"</div>";
}

function showAlignment(name){
  var d = ALIGNMENT_DETAILS[name] || {};
  openInfoModal(name, function(body){
    block(body, "", "<p class='cmp-lead'>"+escapeHtml(ALIGNMENT_INFO[name]||"")+"</p>"+alignmentGrid(name));
    block(body, "", facts([["Typical of", d.examples], ["Playing it", d.tip]]));
  });
}

/* ---- Companions: the creatures subclasses give (js/data/companions.js) ----
   One entry per creature, grouped by class; a Beast Master lists each of
   Tasha's primal beasts plus "your own beast", and a familiar each of its
   forms (grouped Find Familiar and Pact of the Chain). Stats depend on
   level, so the detail view has a level stepper and shows the numbers for
   an example +3 spellcasting modifier (the sheet uses the character's
   own); a familiar's don't, so it has none. */
var EXAMPLE_MOD = 3;
function companionEntries(){
  var out = [];
  COMPANIONS.forEach(function(def){
    if(def.requires){
      // A familiar: each form, the chain's four under Pact of the Chain.
      def.choice.options.forEach(function(o){
        var chain = (def.choice.chainOnly||[]).indexOf(o)!==-1;
        out.push({key: o + " (familiar)", def: def, choice: o, chain: chain, group: chain ? def.requires.pactBoon : def.requires.spell});
      });
      return;
    }
    if(def.id==="beast_companion"){
      def.choice.options.forEach(function(o){
        out.push({key: o===def.setup ? "Ranger's Companion (your own beast)" : o, def: def, choice: o});
      });
    } else out.push({key: def.name, def: def, choice: ""});
  });
  return out;
}
function exampleStats(e, level){
  var pb = Math.floor((level - 1) / 4) + 2;
  var mods = {str:0, dex:0, con:0, int:EXAMPLE_MOD, wis:EXAMPLE_MOD, cha:EXAMPLE_MOD};
  return e.def.stats({lv: level, pb: pb, mods: mods, spellAttack: pb + EXAMPLE_MOD, spellDC: 8 + pb + EXAMPLE_MOD, choice: e.choice, beast: null, chain: !!e.chain});
}
/* A familiar's form: its stat block as the sheet shows it. */
function showFamiliar(e){
  openInfoModal(e.key, function(body){
    var lead = ce("p", "cmp-lead");
    lead.textContent = e.chain
      ? "Only with Pact of the Chain (warlock 3+). It gets its own card on the sheet's Companions tab, and it can attack when you give up one of your attacks."
      : "From the Find Familiar spell (or Pact of the Chain). It gets its own card on the sheet's Companions tab. A Find Familiar familiar can't attack.";
    body.appendChild(lead);
    var holder = ce("div", "cmp-companion");
    renderStatBlock(holder, exampleStats(e, 1), e.key, {rolls: false});
    body.appendChild(holder);
  });
}
function showCompanion(e){
  if(e.def.requires) return showFamiliar(e);
  var level = e.def.level;
  openInfoModal(e.key, function(body){
    var lead = ce("p", "cmp-lead");
    lead.textContent = "From " + (e.def.source ? "the " + e.def.source : e.def.subclass) + " (" + e.def.cls + " " + e.def.level + "+). It gets its own card on the sheet's Companions tab, with an HP tracker and roll buttons.";
    body.appendChild(lead);
    var stepper = ce("div", "cmp-level-stepper");
    var holder = ce("div", "cmp-companion");
    function button(text, label, delta){
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn small"; b.textContent = text; b.setAttribute("aria-label", label);
      b.addEventListener("click", function(){ level = Math.max(e.def.level, Math.min(20, level + delta)); draw(); });
      return b;
    }
    var shown = ce("span", "cmp-level-value");
    stepper.appendChild(button("−", "Lower level", -1));
    stepper.appendChild(shown);
    stepper.appendChild(button("+", "Higher level", 1));
    body.appendChild(stepper);
    body.appendChild(holder);
    var note = ce("p", "cmp-muted");
    body.appendChild(note);
    function draw(){
      shown.textContent = "At " + e.def.cls + " level " + level;
      holder.innerHTML = "";
      var stats = exampleStats(e, level);
      if(stats){
        renderStatBlock(holder, stats, e.key, {rolls: false});
        note.textContent = "Shown with a +" + EXAMPLE_MOD + " spellcasting modifier" + (e.def.id==="steel_defender" ? " (and INT)" : "") + "." +
          (e.def.choice && e.def.id!=="beast_companion" ? " Its " + e.def.choice.label.toLowerCase() + " (" + e.def.choice.options.join(", ") + ") is picked on the sheet." : "");
      } else {
        holder.innerHTML = "<p>Choose a beast no larger than Medium with a challenge rating of 1/4 or lower (for example: " + escapeHtml(Object.keys(BEAST_PRESETS).slice(0, 8).join(", ")) + " and " + (Object.keys(BEAST_PRESETS).length - 8) + " more" +
          "). On the sheet you enter its stat block as printed, and the sheet adds your proficiency bonus to its AC, attack and damage rolls and proficient saves and skills. Its hit point maximum becomes four times your ranger level when that's higher.</p>";
        note.textContent = "";
      }
    }
    draw();
  });
}
export function companionSection(){
  var groups = {}, data = {};
  companionEntries().forEach(function(e){
    var g = e.group || e.def.cls;
    (groups[g] = groups[g] || []).push(e.key);
    data[e.key] = e;
  });
  return {
    key:"companions", label:"Companions", searchPlaceholder:"Search companions…",
    groups:groups, data:data,
    renderSub:function(name, e){ return e.group ? (e.chain ? "Pact of the Chain familiar" : "Find Familiar form") : e.def.source || e.def.subclass; },
    renderRight:function(name, e){ return [e.group ? (e.chain ? "Warlock 3+" : "Spell") : e.def.cls + " " + e.def.level + "+", ""]; },
    searchText:function(name, e){ return name + " " + (e.group ? e.group + " familiar" : (e.def.source || e.def.subclass) + " " + e.def.cls); },
    onAdd:function(name){ showCompanion(data[name]); return false; }
  };
}

/* Grouped Good / Neutral / Evil (the data keeps them in one list). */
export function alignmentSection(){
  var groups = {"Good":[], "Neutral":[], "Evil":[]}, data = {};
  (ALIGNMENTS.Alignment||[]).forEach(function(n){
    var d = ALIGNMENT_DETAILS[n] || {};
    (groups[d.morality] || groups.Neutral).push(n);
    data[n] = {text:ALIGNMENT_INFO[n]||"", d:d};
  });
  return {
    key:"alignments", label:"Alignments", searchPlaceholder:"Search alignments…",
    groups:groups, data:data,
    renderSub:function(name, x){ return x.text; },
    renderRight:function(name, x){
      var axes = x.d.order===x.d.morality ? x.d.order : x.d.order+" · "+x.d.morality; // True Neutral: just "Neutral"
      return [x.d.order ? axes : "", x.d.morality==="Evil" ? "Ask your DM" : ""];
    },
    searchText:function(name, x){ return name+" "+x.text+" "+(x.d.examples||""); },
    onAdd:function(name){ showAlignment(name); return false; }
  };
}
