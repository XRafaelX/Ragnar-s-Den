import { save } from "../../core/state.js";
import { classGrants, grantHasChoices, grantEntry, classPicksSummary, setClassVariant } from "../../core/class-picks.js";
import { classVariants, usesVariant } from "../../core/helpers.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { sectionTitle } from "../../ui/card-parts.js";
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
   Expertise by hand) and fixes mistakes. A character using Tasha's
   optional class features also sees the features they may take in place
   of the Player's Handbook ones (a ranger's Favored Foe and Deft
   Explorer), with a switch for each. No card when there is nothing to
   choose. */
export function renderClassPicksCard(c){
  var grants = classGrants(c).filter(function(g){ return grantHasChoices(g.def); });
  // Replacement features: offered with Tasha's switch on; one already in
  // use stays listed (so it can be switched back) after the switch goes off.
  var variants = [];
  (c.classes||[]).forEach(function(cl){
    classVariants(cl.name).forEach(function(v){ if(c.tashaOptional || usesVariant(cl, v.name)) variants.push({cl: cl, def: v}); });
  });
  if(!grants.length && !variants.length) return null;
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
  if(variants.length) card.appendChild(sectionTitle("Tasha's optional features"));
  variants.forEach(function(x){
    var v = x.def, on = usesVariant(x.cl, v.name);
    var box = document.createElement("div");
    box.className = "inf-entry eli-entry" + (on ? " is-on" : "");
    var head = document.createElement("div");
    head.className = "inf-entry-head";
    var title = document.createElement("span");
    title.className = "inf-entry-title";
    title.textContent = v.name;
    head.appendChild(title);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small ghost";
    btn.textContent = on ? "Back to " + v.replaces : "Use instead";
    btn.setAttribute("aria-label", on ? "Go back to " + v.replaces : "Use " + v.name + " instead of " + v.replaces);
    btn.addEventListener("click", function(){
      confirmDialog(on ? "Go back to " + v.replaces + "?" : "Use " + v.name + " instead of " + v.replaces + "?",
        "This swaps the feature at every " + x.cl.name.toLowerCase() + " level you have. What you chose for " + (on ? v.name : v.replaces) + " is taken off the sheet, and " +
        (on ? v.replaces : v.name) + " asks for its own choices here. Your DM decides whether your table uses Tasha's optional features.", function(){
        setClassVariant(c, x.cl, v, !on);
        save(); renderAll(); playAdd();
      });
    });
    head.appendChild(btn);
    box.appendChild(head);
    var src = document.createElement("div");
    src.className = "inf-goes";
    src.innerHTML = "<span>" + (on ? "In place of" : "Can replace") + "</span> ";
    src.appendChild(document.createTextNode(v.replaces + " · " + x.cl.name));
    box.appendChild(src);
    var text = document.createElement("div");
    text.className = "inf-text";
    text.textContent = v.blurb;
    box.appendChild(text);
    card.appendChild(box);
  });
  return card;
}
