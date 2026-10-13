/* ---------------- A searchable feat list ----------------
   Shared by the creation wizard's Feat step and the level-up's "take a
   feat": the feats this character can take come first, then the ones
   they can't under a "Not available to this character" heading, each
   greyed out with why. The heading folds that group away; a search
   always shows its matches, so a feat looked for is never missing. */
import { escapeHtml, ce } from "../core/helpers.js";

/* Fills `list` (a .wiz-spell-list). opts:
     feats       the feats on offer
     query       the search text (matched against name and summary)
     selected    the picked feat's name
     reason(f)   why this character can't take it, "" when they can
     onPick(f)   an open feat was tapped
     open        whether the unavailable group is unfolded
     onToggle()  its heading was tapped */
export function fillFeatList(list, opts){
  list.innerHTML = "";
  var q = (opts.query||"").toLowerCase().trim();
  var open = [], blocked = [];
  opts.feats.filter(function(f){
    return !q || f.name.toLowerCase().indexOf(q)!==-1 || (f.summary||"").toLowerCase().indexOf(q)!==-1;
  }).sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(f){
    var why = opts.reason(f);
    (why ? blocked : open).push({feat: f, why: why});
  });
  function row(entry){
    var f = entry.feat, why = entry.why, picked = opts.selected===f.name;
    var r = ce("div","wiz-spell-row wiz-pick-row"+(picked ? " selected" : "")+(why ? " disabled" : ""));
    r.setAttribute("role", "button");
    r.tabIndex = why ? -1 : 0;
    r.setAttribute("aria-pressed", picked ? "true" : "false");
    if(why) r.setAttribute("aria-disabled", "true");
    r.innerHTML = "<div class='wiz-spell-text'><b>"+escapeHtml(f.name)+"</b>"+
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
  if(!open.length && !blocked.length){
    var none = ce("p","wiz-spell-empty");
    none.textContent = "No feats match “"+opts.query+"”.";
    list.appendChild(none);
  }
}
