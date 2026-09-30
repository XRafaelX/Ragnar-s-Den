import { ce, escapeHtml, spellOptionText } from "../core/helpers.js";

/* ---------------- Spell choice options ----------------
   The options of a feature's spellChoice (Circle of the Land's land, a
   genie kind, a Divine Soul's affinity) as tappable rows, each listing
   the spells it adds. Shared by the Spells tab, the level-up dialog and
   the creation wizard; onPick(name) is called with the option tapped.
   className labels the levels ("Druid 3"). */
export function renderSpellChoiceOptions(choice, value, onPick, className){
  var box = ce("div", "spell-choice-options");
  Object.keys(choice.options).forEach(function(name){
    var row = ce("div", "wiz-equip-option spell-choice-option" + (value===name ? " selected" : ""));
    row.setAttribute("role", "button");
    row.tabIndex = 0;
    row.setAttribute("aria-pressed", value===name ? "true" : "false");
    row.innerHTML = "<div><strong>" + escapeHtml(name) + "</strong><br>" +
      "<span class='spell-choice-spells'>" + escapeHtml(spellOptionText(choice.options[name], className)) + "</span></div>";
    row.addEventListener("click", function(){ onPick(name); });
    row.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); onPick(name); } });
    box.appendChild(row);
  });
  return box;
}
