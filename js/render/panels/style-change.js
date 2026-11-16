/* ---- Change a fighting style (Features tab) ----
   The level-up no longer offers the optional style swaps (Martial
   Versatility, a 2024 fighter's swap at every level, a Blessed or Druidic
   Warrior's cantrip each level, 2026-11-16). The style's feature sheet
   has a Change button instead: this bottom sheet lists the styles the
   character's classes can take (the current one included, to change its
   picks) and the picked style's own picks, then replaces the feature in
   place (same id). */
import { save } from "../../core/state.js";
import { ce, escapeHtml, spellHeldBy } from "../../core/helpers.js";
import { CLASS_PROGRESSION } from "../../data/progression.js";
import { styleFeatures, styleNeedsPicks, stylePicksProblem, makeStyleFeature, syncStyleWording } from "../../core/fighting-styles.js";
import { allKnownOptions } from "../../core/class-options.js";
import { renderStyleOptions, renderStylePicks } from "../../ui/style-picks.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd } from "../../ui/sound.js";
import { renderAll } from "../sheet.js";

/* The styles the character's classes can take, and whether they read as
   the 2024 feats (a 2024 class with a Fighting Style). */
function styleChoicesFor(c){
  var names = [], book2024 = false;
  (c.classes||[]).forEach(function(cl){
    var prog = CLASS_PROGRESSION[cl.name] || {};
    var ed = cl.edition && (prog.editions||{})[cl.edition];
    var fs = (ed && ed.fightingStyle) || prog.fightingStyle;
    if(!fs) return;
    if(ed && ed.fightingStyle) book2024 = true;
    fs.options.forEach(function(n){ if(names.indexOf(n)===-1) names.push(n); });
  });
  return {names: names, book2024: book2024};
}

export function openStyleChangeSheet(c, feature){
  var choices = styleChoicesFor(c);
  var tasha = !!c.tashaOptional || choices.book2024;
  // The character without this style, so it isn't greyed out as known.
  var others = {features: styleFeatures(c).filter(function(f){ return f!==feature; }), tashaOptional: c.tashaOptional};
  var own = (feature.picks || {});
  var state = {style: feature.fightingStyle, picks: {options: (own.options||[]).slice(), spells: (own.spells||[]).slice()}, error: ""};
  if(choices.names.indexOf(state.style)===-1) choices.names.unshift(state.style);

  openBottomSheet(function(body, refresh, close){
    var header = ce("div", "bs-header");
    var title = ce("div", "bs-title");
    title.textContent = "Change your fighting style";
    header.appendChild(title);
    var x = ce("button", "bs-close");
    x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
    x.addEventListener("click", close);
    header.appendChild(x);
    body.appendChild(header);
    var lead = ce("p", "bs-subtitle");
    lead.innerHTML = "You have <b>" + escapeHtml(feature.fightingStyle) + "</b>. Pick the style you want, or keep it and change its picks.";
    body.appendChild(lead);

    body.appendChild(renderStyleOptions(others, choices.names, state.style, tasha, function(name){
      if(name!==state.style) state.picks = {options: [], spells: []};
      state.style = name; state.error = ""; refresh();
    }, choices.book2024));
    if(styleNeedsPicks(state.style)){
      // Maneuvers and cantrips this style has now don't count as known elsewhere.
      var known = allKnownOptions(c, "maneuvers").map(function(o){ return o.name; })
        .filter(function(n){ return (own.options||[]).indexOf(n)===-1; });
      body.appendChild(renderStylePicks(state.style, state.picks, tasha, known, function(){ state.error = ""; refresh(); }, "fs:change",
        function(n){ return (own.spells||[]).indexOf(n)!==-1 ? "" : spellHeldBy(c, n); }));
    }
    if(state.error){
      var err = ce("p", "lu-note fs-change-error");
      err.textContent = state.error;
      body.appendChild(err);
    }
    var actions = ce("div", "prep-actions");
    var cancel = ce("button", "btn small ghost");
    cancel.type = "button"; cancel.textContent = "Cancel";
    cancel.addEventListener("click", close);
    var go = ce("button", "btn small primary");
    go.type = "button"; go.textContent = "Save";
    go.addEventListener("click", function(){
      var known = allKnownOptions(c, "maneuvers").map(function(o){ return o.name; })
        .filter(function(n){ return (own.options||[]).indexOf(n)===-1; });
      var why = stylePicksProblem(state.style, state.picks, tasha, known);
      if(why){ state.error = why; refresh(); return; }
      var made = makeStyleFeature(state.style, state.picks);
      made.id = feature.id;
      if(feature.source) made.source = feature.source;
      var at = (c.features||[]).indexOf(feature);
      if(at!==-1) c.features[at] = made;
      syncStyleWording(c); // (a 2024 class reads it as the 2024 feat)
      save(); close(); renderAll(); playAdd();
      showActionToast(state.style===feature.fightingStyle ? "Updated " + state.style + "." : "Changed " + feature.fightingStyle + " to " + state.style + ".");
    });
    actions.appendChild(cancel); actions.appendChild(go);
    body.appendChild(actions);
  });
}
