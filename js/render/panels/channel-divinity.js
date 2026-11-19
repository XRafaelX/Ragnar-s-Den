/* ---------------- Channel Divinity ----------------
   A cleric's or paladin's Channel Divinity card on Vitals (2026-11-16),
   under Hit dice & rest. First the uses (the class resource's own row, with
   its pips and rest pill) and Tasha's Harness Divine Power, which spends
   one. Then a tile per option: its name, when you use it (Action, Bonus
   action, Reaction...), its first lines with your numbers, and Use. A tap on
   the tile opens the whole text in a bottom sheet. An option that lasts
   shows "On" while it runs (its controls are on the Active effects card);
   one offered somewhere else (Guided Strike after an attack roll) says
   where. A cleric/paladin gets a part for each class.

   The options come from clericChannels and channelActions (js/core/cleric.js,
   js/core/paladin.js). */
import { save } from "../../core/state.js";
import { clericChannels, channelActions, channelProblem, useChannelAction, effectOn, resourceLeft, clamp, maxHp, classFeatureList, classEntryOf } from "../../core/helpers.js";
import { renderAll, makeCard } from "../sheet.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { makeDiceSvg, makeChevronRightSvg } from "../../ui/svg-icons.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { sheetTop } from "./paladin.js";

var CLASSES = ["Cleric", "Paladin"];

/* The resources this card shows, so the Class resources card leaves them out. */
export function channelResourceKey(key){
  return CLASSES.some(function(cls){ return key===cls + ":channel_divinity" || key===cls + ":harness_divine_power"; });
}

/* The card, or null for a character with no Channel Divinity yet.
   `rowFor(c, r)` draws a resource's row (js/render/panels/vitals.js). */
export function renderChannelCard(c, resources, rowFor){
  var parts = CLASSES.map(function(cls){
    return {cls: cls, pool: find(resources, cls + ":channel_divinity"), harness: find(resources, cls + ":harness_divine_power")};
  }).filter(function(p){ return p.pool; });
  if(!parts.length) return null;
  var card = makeCard("Channel Divinity");
  card.classList.add("cd-card");
  parts.forEach(function(p){
    if(parts.length > 1){
      var head = document.createElement("div");
      head.className = "cd-class";
      head.textContent = p.cls;
      card.appendChild(head);
    }
    var uses = document.createElement("div");
    uses.className = "res-list";
    uses.appendChild(usesRow(c, p.pool, rowFor, "Uses"));
    if(p.harness) uses.appendChild(usesRow(c, p.harness, rowFor, ""));
    card.appendChild(uses);
    var list = document.createElement("div");
    list.className = "cd-list";
    optionsOf(c, p.cls).forEach(function(o){ list.appendChild(tile(c, o)); });
    card.appendChild(list);
  });
  return card;
}
/* A resource's row as on Class resources, but under this card's title:
   "Uses", not "Channel Divinity" again, and no "(Cleric)" after the hint. */
function usesRow(c, r, rowFor, label){
  var row = rowFor(c, Object.assign({}, r, {source: ""}));
  var name = row.querySelector(".res-name");
  if(label && name && name.firstChild && name.firstChild.nodeType===3) name.firstChild.nodeValue = label;
  return row;
}
function find(resources, key){
  return resources.find(function(r){ return r.key===key; }) || null;
}

/* The options for a class, a group (Knowledge of the Ages, Sacred Weapon)
   as one: {name, items, detail, pick (the group's picker label)}. */
export function optionsOf(c, cls){
  var actions = cls==="Cleric" ? clericChannels(c) : channelActions(c), out = [];
  actions.forEach(function(a){
    if(!a.group){ out.push({cls: cls, name: a.name, items: [a], detail: a.detail, when: a.when}); return; }
    var g = out.find(function(o){ return o.group===a.group; });
    if(g) g.items.push(a);
    else out.push({cls: cls, name: a.group, group: a.group, items: [a], detail: a.groupDetail || a.detail, when: a.when, pick: a.groupPick || "Choose..."});
  });
  return out;
}

/* When you use it, from the option's first words. */
var LEADS = [
  [/^A Magic action[,:]\s*/, "Magic action"],
  [/^An action[,:]\s*/, "Action"],
  [/^A bonus action[,:]\s*/, "Bonus action"],
  [/^(Your reaction|A reaction|Reaction)[,:]\s*/, "Reaction"],
  [/^When you take the Attack action[,:]\s*/, "Attack action"],
  [/^A 1-hour ritual[,:]\s*/, "1 hour"]
];
export function whenOf(o){
  if(o.when) return o.when;
  var hit = LEADS.find(function(l){ return l[0].test(o.detail || ""); });
  return hit ? hit[1] : "No action";
}
/* The text without those first words (the tag says them). */
function lineOf(o){
  var d = o.detail || "", hit = LEADS.find(function(l){ return l[0].test(d); });
  var t = hit ? d.replace(hit[0], "") : d;
  return t.charAt(0).toUpperCase() + t.slice(1);
}
/* Its colour: amber bonus actions and blue reactions, as on the Remember card. */
function hueOf(when){
  return when==="Bonus action" ? " cd-bonus" : when==="Reaction" ? " cd-reaction" : "";
}

/* Why none of it can be used now ("" when it can), and whether it's running. */
function stateOf(c, o){
  var on = o.items.some(function(a){ return a.effect && effectOn(c, a.effect); });
  var reason = o.items.length===1 && o.items[0].reason ? o.items[0].reason : "";
  var problem = reason || (o.items.every(function(a){ return channelProblem(c, a); }) ? channelProblem(c, o.items[0]) : "");
  return {on: on, reason: reason, problem: problem};
}

function tile(c, o){
  var when = whenOf(o), st = stateOf(c, o);
  var row = document.createElement("div");
  row.className = "cd-tile" + hueOf(when) + (st.on ? " on" : "") + (o.group && !st.on && !st.reason ? " cd-wide" : "");
  row.setAttribute("role", "button");
  row.tabIndex = 0;
  row.setAttribute("aria-label", o.name + ", " + when + ": " + lineOf(o) + " Open the full text");
  var text = document.createElement("div");
  text.className = "cd-text";
  var name = document.createElement("div");
  name.className = "cd-name";
  var label = document.createElement("span");
  label.className = "cd-label";
  label.textContent = o.name;
  name.appendChild(label);
  var tag = document.createElement("span");
  tag.className = "cd-when";
  tag.textContent = when;
  name.appendChild(tag);
  text.appendChild(name);
  var line = document.createElement("div");
  line.className = "cd-line";
  line.textContent = lineOf(o);
  text.appendChild(line);
  row.appendChild(text);
  row.appendChild(actionEl(c, o, st, false));
  var more = document.createElement("span");
  more.className = "ff-more";
  more.setAttribute("aria-hidden", "true");
  more.innerHTML = makeChevronRightSvg();
  row.appendChild(more);
  function open(){ openOption(c, o); }
  row.addEventListener("click", function(e){
    // (The Use button and a group's picker work on their own. The path as
    // the click began: a pick closes the picker's list before it gets here.)
    if(e.composedPath().some(function(n){ return n.classList && (n.classList.contains("cd-act") || n.classList.contains("tp-menu")); })) return;
    open();
  });
  row.addEventListener("keydown", function(e){
    if(e.target!==row) return;
    if(e.key==="Enter" || e.key===" "){ e.preventDefault(); open(); }
  });
  return row;
}

/* Use, a group's picker, "On", or where it's offered. `inSheet`: the
   bottom sheet's bigger version, which closes it after use. */
function actionEl(c, o, st, inSheet, close){
  var box = document.createElement("div");
  box.className = "cd-act";
  if(st.on){
    var on = document.createElement("span");
    on.className = "cd-on";
    on.textContent = "On";
    on.title = "Running now. End it on the Active effects card.";
    box.appendChild(on);
    return box;
  }
  if(st.reason){
    var where = document.createElement("span");
    where.className = "cd-reason";
    where.textContent = st.reason;
    box.appendChild(where);
    return box;
  }
  function done(a){ if(close) close(); use(c, a); }
  if(o.group){
    box.classList.add("res-pick");
    box.appendChild(themedPicker({key: "cd:" + o.group + (inSheet ? ":sheet" : ""), groups: {"": o.items.map(function(a){ return {value: a.id, label: a.name}; })},
      value: "", placeholder: o.pick, ariaLabel: o.name + ": " + o.pick.replace(/\.+$/, ""), sheet: true,
      reasonFor: function(id){ return channelProblem(c, o.items.find(function(a){ return a.id===id; })); },
      onPick: function(id){ done(o.items.find(function(a){ return a.id===id; })); }}));
    return box;
  }
  var a = o.items[0];
  var b = document.createElement("button");
  b.type = "button";
  b.className = "btn small inv-roll-btn res-roll-btn cd-use";
  if(a.roll) b.innerHTML = makeDiceSvg();
  b.appendChild(document.createTextNode(a.roll ? "Use · " + a.roll.qty + "d" + a.roll.die + (a.roll.bonus ? (a.roll.bonus > 0 ? "+" : "") + a.roll.bonus : "") : "Use"));
  b.disabled = !!st.problem;
  b.title = st.problem || "Spend a use of Channel Divinity on " + a.name;
  b.setAttribute("aria-label", "Use " + o.name);
  b.addEventListener("click", function(e){ e.stopPropagation(); done(a); });
  box.appendChild(b);
  return box;
}

/* Spend it: start its effect, log it, roll its dice. */
export function use(c, a){
  if(!useChannelAction(c, a)) return;
  var title = "Channel Divinity: " + (a.group || a.name);
  if(a.log!=="") logRoll(title, a.log || "Used.");
  save(); renderAll();
  if(a.roll) performRoll(a.roll.die, a.roll.qty, a.roll.bonus, "none", a.roll.label, a.healSelf ? function(r){ return r ? healYourself(c, r.total) : null; } : null);
  else showActionToast((a.group ? a.group + " (" + a.name + ")" : a.name) + (a.effect ? ": on. It's on the Active effects card." : a.log ? ": " + a.log : ": used."));
}
/* Turn the Tide can include you, at half your hit points or fewer. */
function healYourself(c, n){
  var hp = Number(c.hp.current)||0, top = maxHp(c);
  if(hp <= 0 || 2 * hp > top) return null;
  return {lead: "You're at half your hit points or fewer:", options: [{label: "Heal yourself " + n, title: "You can be one of the creatures it heals",
    use: function(){
      c.hp.current = clamp(hp + n, 0, top);
      save(); renderAll();
      return {silent: true};
    }}]};
}

/* The class or subclass feature an option comes from: "Channel Divinity:
   Twilight Sanctuary", a 2024 domain's "Preserve Life", or the "Channel
   Divinity" feature that names it (Turn Undead, an oath's two options),
   the subclass's first. Null when none says it. */
export function featureFor(c, o){
  var cl = classEntryOf(c, o.cls);
  if(!cl) return null;
  var list = classFeatureList(cl);
  return list.find(function(f){ return f.name==="Channel Divinity: " + o.name; }) ||
    list.find(function(f){ return f.name===o.name; }) ||
    list.filter(function(f){ return /^Channel Divinity/.test(f.name) && (f.text||"").indexOf(o.name)!==-1; })
      .sort(function(a, b){ return (b.subclass ? 1 : 0) - (a.subclass ? 1 : 0); })[0] || null;
}

/* The whole text, with the same Use. */
function openOption(c, o){
  openBottomSheet(function(body, refresh, close){
    var when = whenOf(o);
    sheetTop(body, o.name, close);
    var tags = document.createElement("div");
    tags.className = "cd-sheet-tags";
    var tag = document.createElement("span");
    tag.className = "cd-when" + hueOf(when);
    tag.textContent = when;
    tags.appendChild(tag);
    body.appendChild(tags);
    // The feature's whole text as the book gives it, then the short version
    // with this character's numbers (DC, dice).
    var feature = featureFor(c, o);
    var text = document.createElement("p");
    text.className = "cd-sheet-text";
    text.textContent = feature ? feature.text : o.detail || "";
    body.appendChild(text);
    if(feature && o.detail){
      var mine = document.createElement("p");
      mine.className = "cd-sheet-mine";
      var b = document.createElement("b");
      b.textContent = "On your sheet: ";
      mine.appendChild(b);
      mine.appendChild(document.createTextNode(o.detail));
      body.appendChild(mine);
    }
    var left = resourceLeft(c, o.cls + ":channel_divinity");
    var cost = document.createElement("p");
    cost.className = "cd-sheet-cost";
    cost.textContent = "Costs one use of Channel Divinity. " + (left===1 ? "You have 1 left." : "You have " + left + " left.");
    body.appendChild(cost);
    var act = actionEl(c, o, stateOf(c, o), true, close);
    act.classList.add("cd-sheet-act");
    body.appendChild(act);
  });
}
