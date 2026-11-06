/* ---------------- A searchable feat list ----------------
   Shared by the creation wizard's Feat step and the level-up's "take a
   feat": the feats this character can take come first, then the ones
   they can't under a "Not available to this character" heading, each
   greyed out with why. The heading folds that group away; a search
   always shows its matches, so a feat looked for is never missing. */
import { escapeHtml, ce } from "../core/helpers.js";
import { featDef } from "../core/feat-picks.js";

/* Fills `list` (a .wiz-spell-list). opts:
     feats       the feats on offer
     query       the search text (matched against name and summary)
     selected    the picked feat's name
     reason(f)   why this character can't take it, "" when they can
     onPick(f)   an open feat was tapped
     open        whether the unavailable group is unfolded
     onToggle()  its heading was tapped
     rules2024   the character is on the 2024 rules (the 2014 versions
                 of rewritten feats move to "Older versions (2014)") */
/* ---- Feats in both books (opts.rules2024) ----
   For a character on the 2024 rules, a feat with a 2024 version shows
   that one under the plain name ("Alert"), and the 2014 one goes to an
   "Older versions (2014)" group at the end as "Alert (2014)". Nothing is
   hidden, and the saved names don't change. */
function hasNewer(f){ return !/ \(2024\)$/.test(f.name) && !!featDef(f.name + " (2024)"); }
export function featListLabel(f, rules2024){
  if(!rules2024) return f.name;
  if(/ \(2024\)$/.test(f.name) && featDef(f.name.replace(/ \(2024\)$/, ""))) return f.name.replace(/ \(2024\)$/, "");
  return hasNewer(f) ? f.name + " (2014)" : f.name;
}
export function fillFeatList(list, opts){
  list.innerHTML = "";
  var q = (opts.query||"").toLowerCase().trim();
  var rules2024 = !!opts.rules2024;
  var label = function(f){ return featListLabel(f, rules2024); };
  var open = [], older = [], blocked = [];
  opts.feats.filter(function(f){
    return !q || f.name.toLowerCase().indexOf(q)!==-1 || label(f).toLowerCase().indexOf(q)!==-1 || (f.summary||"").toLowerCase().indexOf(q)!==-1;
  }).sort(function(a, b){ return label(a).localeCompare(label(b)); }).forEach(function(f){
    var why = opts.reason(f);
    (why ? blocked : rules2024 && hasNewer(f) ? older : open).push({feat: f, why: why});
  });
  function row(entry){
    var f = entry.feat, why = entry.why, picked = opts.selected===f.name;
    var r = ce("div","wiz-spell-row wiz-pick-row"+(picked ? " selected" : "")+(why ? " disabled" : ""));
    r.setAttribute("role", "button");
    r.tabIndex = why ? -1 : 0;
    r.setAttribute("aria-pressed", picked ? "true" : "false");
    if(why) r.setAttribute("aria-disabled", "true");
    r.innerHTML = "<div class='wiz-spell-text'><b>"+escapeHtml(label(f))+"</b>"+
      (f.prerequisite && f.prerequisite!=="None" ? "<span class='wiz-spell-meta'>Requires: "+escapeHtml(f.prerequisite)+(why ? " ("+escapeHtml(why)+")" : "")+"</span>"
        : why ? "<span class='wiz-spell-meta'>"+escapeHtml(why.charAt(0).toUpperCase()+why.slice(1))+"</span>" : "")+
      "<span class='wiz-spell-desc'>"+escapeHtml(f.summary||"")+"</span></div>";
    if(!why){
      r.addEventListener("click", function(){ opts.onPick(f); });
      r.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); opts.onPick(f); } });
    }
    list.appendChild(r);
  }
  open.forEach(row);
  // (The 2014 versions of feats the 2024 rules rewrote, still there to pick.)
  if(older.length){
    var oldHead = ce("div", "wiz-feat-group wiz-feat-older");
    oldHead.textContent = "Older versions (2014)";
    list.appendChild(oldHead);
    older.forEach(row);
  }
  if(blocked.length){
    // A search shows its greyed matches, and so does a pick that has
    // since become unavailable; then there's nothing to fold.
    var forced = !!q || blocked.some(function(e){ return e.feat.name===opts.selected; });
    var shown = forced || !!opts.open;
    var head = document.createElement(forced ? "div" : "button");
    head.className = "wiz-feat-group";
    head.textContent = "Not available to this character ("+blocked.length+")";
    if(!forced){
      head.type = "button";
      head.setAttribute("aria-expanded", shown ? "true" : "false");
      // The caller refills the list, so hand the focus to the new heading.
      head.addEventListener("click", function(){
        opts.onToggle();
        var again = list.querySelector("button.wiz-feat-group");
        if(again) again.focus();
      });
    }
    list.appendChild(head);
    if(shown) blocked.forEach(row);
  }
  if(!open.length && !older.length && !blocked.length){
    var none = ce("p","wiz-spell-empty");
    none.textContent = "No feats match “"+opts.query+"”.";
    list.appendChild(none);
  }
}
