import { save } from "../../core/state.js";
import { characterGrants, grantHasChoices, grantEntry, classPicksSummary, classPicksDetails, setClassVariant, backgroundSkillFix, resolveBackgroundSkillFix, darkvisionCoveredBy } from "../../core/class-picks.js";
import { BACKGROUND_INFO } from "../../data/backgrounds.js";
import { RACE_DATA } from "../../data/race-data.js";
import { classVariantSwaps, usesVariant, classFeatureList } from "../../core/helpers.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { sectionTitle } from "../../ui/card-parts.js";
import { makeCard, renderAll } from "../sheet.js";
import { hint } from "../../ui/card-parts.js";
import { openClassPicksModal } from "../../ui/class-picks.js";
import { playAdd } from "../../ui/sound.js";

/* ---- Feature choices card (Features tab) ----
   The skills, expertise, tools, languages, saving throws, weapons and
   spells the character's class features and race traits let the player
   choose (see js/core/class-picks.js): one row per feature with what was
   picked and a
   button to choose or change it. New ones normally come through the
   level-up; the card catches up older sheets (a rogue who ticked their
   Expertise by hand) and fixes mistakes. A character using Tasha's
   optional class features also sees the features they may take in place
   of the Player's Handbook ones (a ranger's Favored Foe and Deft
   Explorer), with a switch for each. A character made before this app
   corrected its background's skills (a Lorehold Student given Arcana for
   Religion) is offered the swap first. No card when there is nothing to
   choose. */
/* The offer to correct an older sheet's background skills. */
function skillFixEntry(c, fix){
  var box = document.createElement("div");
  box.className = "inf-entry eli-entry cpk-pending cpk-skill-fix";
  var head = document.createElement("div");
  head.className = "inf-entry-head";
  var title = document.createElement("span");
  title.className = "inf-entry-title";
  title.textContent = fix.background + " skills";
  head.appendChild(title);
  box.appendChild(head);
  var src = document.createElement("div");
  src.className = "inf-goes";
  src.innerHTML = "<span>From</span> ";
  src.appendChild(document.createTextNode("Background · " + fix.background));
  box.appendChild(src);
  var bookSkills = (BACKGROUND_INFO[fix.background] || {}).skills || [];
  var text = document.createElement("div");
  text.className = "inf-text";
  text.textContent = "The book gives " + bookSkills.join(" and ") + ". This app used to give " +
    (fix.was.length ? fix.was.join(" and ") + " instead of " : "you nothing for ") + fix.now.join(" and ") + ".";
  box.appendChild(text);
  var row = document.createElement("div");
  row.className = "cmp-give-row fp-modal-row";
  var keep = document.createElement("button");
  keep.type = "button"; keep.className = "btn small ghost"; keep.textContent = "Keep my sheet as it is";
  keep.addEventListener("click", function(){ resolveBackgroundSkillFix(c, false); save(); renderAll(); });
  var swap = document.createElement("button");
  swap.type = "button"; swap.className = "btn small primary";
  swap.textContent = fix.was.length ? "Swap " + fix.was.join(" and ") + " for " + fix.now.join(" and ") : "Add " + fix.now.join(" and ");
  swap.addEventListener("click", function(){ resolveBackgroundSkillFix(c, true); save(); renderAll(); playAdd(); });
  row.appendChild(keep); row.appendChild(swap);
  box.appendChild(row);
  return box;
}

export function renderClassPicksCard(c){
  // (A race's choices too: a dwarf's tool, a kenku's skills.)
  var grants = characterGrants(c).filter(function(g){ return grantHasChoices(g.def); });
  // Replacement features: offered with Tasha's switch on once the class
  // has reached the feature's level; one already in use stays listed (so
  // it can be switched back) after the switch goes off.
  var variants = [];
  (c.classes||[]).forEach(function(cl){
    classVariantSwaps(cl.name, null, cl).forEach(function(v){
      if((c.tashaOptional && (Number(cl.level)||1) >= (v.level||1)) || usesVariant(cl, v.name)) variants.push({cl: cl, def: v});
    });
  });
  var skillFix = backgroundSkillFix(c);
  if(!grants.length && !variants.length && !skillFix) return null;
  var card = makeCard("Feature choices");
  card.classList.add("inf-card", "eli-card", "cpk-card");
  card.appendChild(hint("Skills, tools, languages, spells and other things your race, background and class features let you choose. The sheet adds what you pick."));
  if(skillFix) card.appendChild(skillFixEntry(c, skillFix));
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
    // What was picked, plainly (the card says what it is), and a picked
    // option's details under it (a dragon's breath and resistance).
    var text = document.createElement("div");
    var picked = classPicksSummary(g, entry) || (entry && !entry.manual && ((g.def.pick||[])[0]||{}).none) || "";
    text.className = "inf-text" + (entry && !entry.manual && picked ? " cpk-picked" : "");
    text.textContent = !entry ? "Not chosen yet."
      : entry.manual ? "Marked as already on your sheet."
      : picked ? picked
      : "Nothing to add: you already had everything it offers.";
    box.appendChild(text);
    classPicksDetails(g, entry).forEach(function(line){
      var detail = document.createElement("div");
      detail.className = "inf-text cpk-picked-detail";
      detail.textContent = line;
      box.appendChild(detail);
    });
    // Keeping darkvision a class feature already beats (a Custom Lineage
    // who became a Twilight cleric): the skill would add more.
    var covered = entry && !classPicksSummary(g, entry) && g.name===(RACE_DATA[c.race]||{}).darkvisionUnlessPicked &&
      darkvisionCoveredBy(c.race, (c.classes||[]).reduce(function(a, cl){ return a.concat(classFeatureList(cl)); }, []));
    if(covered){
      var nudge = document.createElement("div");
      nudge.className = "inf-text cpk-picked-detail";
      nudge.textContent = covered.name + " already gives you better darkvision, so you could take a skill here instead.";
      box.appendChild(nudge);
    }
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
