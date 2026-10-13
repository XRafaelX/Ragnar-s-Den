/* ---------------- Compendium: shared ----------------
   What every tab uses: the session the Compendium was opened with, the
   blocks of a detail view, and the edit and delete bar of custom entries. */
import { ABILITIES } from "../../data/abilities-skills.js";
import { escapeHtml } from "../../core/helpers.js";

/* What the Compendium was opened with, shared by all its tabs and reset
   when it closes:
     giveTarget     the character it was opened for (feats and custom
                    features then offer "Add to <name>"), or null
     formPreset     {kind, edit, from, direct}: used up by the next build
                    of the custom feat or feature form
     presetClass    the class a new custom subclass is for
     savedHook      called once with what was just created
     savedHookKind  which kind of creation savedHook is waiting for */
export var session = {giveTarget:null, formPreset:null, presetClass:null, savedHook:null, savedHookKind:null};
export var ABILITY_NAME = {};
ABILITIES.forEach(function(a){ ABILITY_NAME[a[0]] = a[1]; });

export function abilityList(keys){ return (keys||[]).map(function(k){ return ABILITY_NAME[k] || k; }).join(", "); }

/* ---- Detail views (info modal) ---- */
export function block(body, title, html){
  var sec = document.createElement("div");
  sec.className = "cmp-block";
  if(title){
    var h = document.createElement("h5");
    h.className = "cmp-block-title";
    h.textContent = title;
    sec.appendChild(h);
  }
  var content = document.createElement("div");
  content.innerHTML = html;
  sec.appendChild(content);
  body.appendChild(sec);
}
export function featureList(features){
  return features.map(function(f){
    return "<div class='cmp-feature'><div class='cmp-feature-head'><strong>"+escapeHtml(f.name)+"</strong>"+
      (f.level ? "<span class='cmp-lv'>Lv "+f.level+"</span>" : "")+"</div><p>"+escapeHtml(f.text)+"</p></div>";
  }).join("");
}

export function closeInfo(){ document.getElementById("info-modal-close").click(); }

export function closeCompendium(){ document.getElementById("catalog-back").click(); }

/* Custom tag + Edit / Delete at the top of a homebrew entry's details. */
export function customBar(body, onEdit, onDelete){
  var bar = document.createElement("div");
  bar.className = "cmp-custom-bar";
  bar.innerHTML = "<span class='cmp-custom-tag'>Custom</span>";
  var editBtn = document.createElement("button");
  editBtn.type = "button"; editBtn.className = "btn small"; editBtn.textContent = "Edit";
  editBtn.addEventListener("click", function(){ closeInfo(); onEdit(); });
  var delBtn = document.createElement("button");
  delBtn.type = "button"; delBtn.className = "btn small danger"; delBtn.textContent = "Delete";
  delBtn.addEventListener("click", function(){ closeInfo(); onDelete(); });
  bar.appendChild(editBtn); bar.appendChild(delBtn);
  body.appendChild(bar);
}
