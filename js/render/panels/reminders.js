/* ---------------- Remember (Vitals) ----------------
   What a new player forgets mid-fight, grouped by when it's used: bonus
   actions, reactions, and what's always on (js/core/reminders.js). One
   line each, cut with "…" if it runs long. A tap opens the feature's
   whole text, the same sheet as on the Features tab. No buttons: the
   rolls live on the cards that make them. */
import { characterReminders, REMIND_GROUPS } from "../../core/helpers.js";
import { makeCard } from "../sheet.js";
import { makeChevronRightSvg } from "../../ui/svg-icons.js";
import { openFeatureSheet } from "./features.js";

export function renderRemindCard(c){
  var all = characterReminders(c);
  if(!all.length) return null;
  var card = makeCard("Remember");
  card.classList.add("rm-card");
  REMIND_GROUPS.forEach(function(g){
    var items = all.filter(function(r){ return r.when===g.when; });
    if(!items.length) return;
    var group = document.createElement("div");
    group.className = "rm-group";
    var head = document.createElement("div");
    head.className = "rm-head";
    head.textContent = g.label;
    group.appendChild(head);
    items.forEach(function(r){ group.appendChild(remindRow(r)); });
    card.appendChild(group);
  });
  return card;
}

function remindRow(r){
  var row = document.createElement("div");
  row.className = "rm-row";
  row.setAttribute("role", "button");
  row.tabIndex = 0;
  row.setAttribute("aria-label", r.name + ": " + r.line + ". Open the full text");
  var text = document.createElement("div");
  text.className = "rm-text";
  var name = document.createElement("span");
  name.className = "rm-name";
  name.textContent = r.name;
  text.appendChild(name);
  text.appendChild(document.createTextNode(" " + r.line));
  row.appendChild(text);
  var more = document.createElement("span");
  more.className = "ff-more";
  more.setAttribute("aria-hidden", "true");
  more.innerHTML = makeChevronRightSvg();
  row.appendChild(more);
  function open(){ openFeatureSheet({name: r.name, source: r.source, text: r.text}); }
  row.addEventListener("click", open);
  row.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); open(); } });
  return row;
}
