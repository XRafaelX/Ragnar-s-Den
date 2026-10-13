import { save } from "../../core/state.js";
import { classGrants, grantHasChoices, grantEntry, classPicksSummary } from "../../core/class-picks.js";
import { makeCard, renderAll } from "../sheet.js";
import { hint } from "../../ui/card-parts.js";
import { openClassPicksModal } from "../../ui/class-picks.js";
import { playAdd } from "../../ui/sound.js";

/* ---- Feature choices card (Features tab) ----
   The skills, expertise, tools, languages, saving throws, weapons and
   spells the character's class features let the player choose (see
   js/core/class-picks.js): one row per feature with what was picked and a
   button to choose or change it. New ones normally come through the
   level-up; the card catches up older sheets (a rogue who ticked their
   Expertise by hand) and fixes mistakes. No card when no feature has a
   choice. */
export function renderClassPicksCard(c){
  var grants = classGrants(c).filter(function(g){ return grantHasChoices(g.def); });
  if(!grants.length) return null;
  var card = makeCard("Feature choices");
  card.classList.add("inf-card", "eli-card", "cpk-card");
  card.appendChild(hint("Skills, tools, languages, spells and other things your class features let you choose. The sheet adds what you pick."));
  grants.forEach(function(g){
    var entry = grantEntry(g.cl, g.key);
    var box = document.createElement("div");
    box.className = "inf-entry eli-entry" + (entry ? " is-on" : " cpk-pending");
    var head = document.createElement("div");
    head.className = "inf-entry-head";
    var title = document.createElement("span");
    title.className = "inf-entry-title";
    title.textContent = g.name;
    head.appendChild(title);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small " + (entry && !entry.manual ? "ghost" : "primary");
    btn.textContent = entry && !entry.manual ? "Change" : "Choose";
    btn.setAttribute("aria-label", btn.textContent + " " + g.name);
    btn.addEventListener("click", function(){
      openClassPicksModal(c, g.cl, g, function(){ save(); renderAll(); playAdd(); });
    });
    head.appendChild(btn);
    box.appendChild(head);
    var src = document.createElement("div");
    src.className = "inf-goes";
    src.innerHTML = "<span>From</span> ";
    src.appendChild(document.createTextNode(g.source));
    box.appendChild(src);
    var text = document.createElement("div");
    text.className = "inf-text";
    var picked = classPicksSummary(g, entry);
    text.textContent = !entry ? "Not chosen yet."
      : entry.manual ? "Marked as already on your sheet."
      : picked ? "Your picks: " + picked + "."
      : "Nothing to add: you already had everything it offers.";
    box.appendChild(text);
    card.appendChild(box);
  });
  return card;
}
