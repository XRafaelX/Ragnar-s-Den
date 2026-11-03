/* ---------------- Remember (Vitals) ----------------
   What a new player forgets mid-fight, grouped by when it's used: bonus
   actions, reactions, and what's always on (js/core/reminders.js). One
   line each, cut with "…" if it runs long. A tap opens the feature's
   whole text, the same sheet as on the Features tab. No buttons: the
   rolls live on the cards that make them.
   A player who knows the class can fold the card to its title with the
   Hide pill (c.hideRemember, kept per character); Show opens it again.
   It folds in place, without redrawing the sheet. */
import { characterReminders, REMIND_GROUPS } from "../../core/helpers.js";
import { makeCard } from "../sheet.js";
import { makeChevronRightSvg, makeRemindSvg } from "../../ui/svg-icons.js";
import { openFeatureSheet } from "./features.js";
import { save } from "../../core/state.js";

export function renderRemindCard(c){
  var all = characterReminders(c);
  if(!all.length) return null;
  var card = makeCard("Remember");
  card.classList.add("rm-card");
  if(c.hideRemember) card.classList.add("folded");
  var body = document.createElement("div");
  body.className = "rm-body";
  body.id = "rm-body";
  var inner = document.createElement("div");
  inner.className = "rm-inner";
  body.appendChild(inner);
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "rm-toggle";
  function label(){
    var hidden = !!c.hideRemember;
    toggle.textContent = hidden ? "Show" : "Hide";
    toggle.setAttribute("aria-expanded", hidden ? "false" : "true");
    toggle.setAttribute("aria-label", hidden ? "Show the Remember card" : "Hide the Remember card");
    toggle.title = hidden ? "Show the reminders again" : "Fold this card away if you already know your features";
    // (Folded rows can't be reached with Tab.)
    inner.inert = hidden;
  }
  toggle.setAttribute("aria-controls", "rm-body");
  toggle.addEventListener("click", function(){
    if(c.hideRemember) delete c.hideRemember; else c.hideRemember = true;
    card.classList.toggle("folded", !!c.hideRemember);
    label();
    save();
  });
  label();
  card.querySelector("h3").appendChild(toggle);
  card.appendChild(body);
  // The groups side by side on a wide screen (the action economy at a
  // glance), stacked on a phone. Each has its icon and colour (rm-bonus,
  // rm-reaction, rm-always) and a count.
  var groups = document.createElement("div");
  groups.className = "rm-groups";
  REMIND_GROUPS.forEach(function(g){
    var items = all.filter(function(r){ return r.when===g.when; });
    if(!items.length) return;
    var group = document.createElement("section");
    group.className = "rm-group rm-" + g.when;
    group.setAttribute("aria-label", g.label);
    var head = document.createElement("div");
    head.className = "rm-head";
    head.innerHTML = '<span class="rm-icon">' + makeRemindSvg(g.when) + '</span><span class="rm-head-label"></span><span class="rm-count"></span>';
    head.querySelector(".rm-head-label").textContent = g.label;
    head.querySelector(".rm-count").textContent = items.length;
    group.appendChild(head);
    var list = document.createElement("div");
    list.className = "rm-list";
    items.forEach(function(r){ list.appendChild(remindRow(r)); });
    group.appendChild(list);
    groups.appendChild(group);
  });
  inner.appendChild(groups);
  return card;
}

function remindRow(r){
  var row = document.createElement("div");
  row.className = "rm-row";
  row.setAttribute("role", "button");
  row.tabIndex = 0;
  row.setAttribute("aria-label", r.name + ": " + r.line + ". Open the full text");
  // The name on its own line, the reminder under it.
  var text = document.createElement("div");
  text.className = "rm-text";
  var name = document.createElement("div");
  name.className = "rm-name";
  name.textContent = r.name;
  var line = document.createElement("div");
  line.className = "rm-line";
  line.textContent = r.line;
  text.appendChild(name);
  text.appendChild(line);
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
