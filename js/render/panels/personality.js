/* The Information tab's Personality card: two personality traits, an
   ideal, a bond and a flaw, then the background's own story tables (a
   Haunted One's Harrowing Event), as tiles of plain text. Each tile can
   be rolled on its table or edited in a sheet (pick an entry, or write
   your own). "Roll the rest" fills the empty ones. Optional: nothing asks
   for them (see js/core/background-story.js). */
import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { ce } from "../../core/helpers.js";
import { makeDiceSvg, makeCheckSvg } from "../../ui/svg-icons.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { storyShape, storyTables, entryRoll, rollStory } from "../../core/background-story.js";

var PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
// An ideal ends with its alignment: "(Lawful)", "(Any)".
var ALIGNMENT = /\s*\(([A-Za-z ,]+)\)\s*$/;

/* The tiles: {label, table, get(), set(v), avoid() (a second trait
   differs from the first)}. */
function storyRows(c){
  var s = storyShape(c), t = storyTables(c.background);
  var personality = [
    {label: "Personality trait", table: t.traits, get: function(){ return s.traits[0]; }, set: function(v){ s.traits[0] = v; }, avoid: function(){ return s.traits[1]; }},
    {label: "Personality trait", table: t.traits, get: function(){ return s.traits[1]; }, set: function(v){ s.traits[1] = v; }, avoid: function(){ return s.traits[0]; }},
    {label: "Ideal", table: t.ideal, ideal: true, get: function(){ return s.ideal; }, set: function(v){ s.ideal = v; }},
    {label: "Bond", table: t.bond, get: function(){ return s.bond; }, set: function(v){ s.bond = v; }},
    {label: "Flaw", table: t.flaw, get: function(){ return s.flaw; }, set: function(v){ s.flaw = v; }}
  ];
  var story = t.story.map(function(st){
    return {label: st.label, table: st, get: function(){ return s.tables[st.label] || ""; }, set: function(v){ s.tables[st.label] = v; }};
  });
  return {from: t.from, personality: personality, story: story};
}

export function renderPersonalityCard(c){
  var r = storyRows(c), all = r.personality.concat(r.story);
  var card = makeCard("Personality");
  card.classList.add("story-card");
  var rollable = all.filter(function(row){ return row.table; });
  var empty = rollable.filter(function(row){ return !row.get(); });
  if(empty.length){
    var rest = ce("button", "btn small ghost story-roll-rest");
    rest.type = "button";
    rest.innerHTML = makeDiceSvg() + (empty.length === rollable.length ? "Roll all" : "Roll the rest");
    rest.title = "Roll on the background's tables for every empty one";
    rest.addEventListener("click", function(){
      empty.forEach(function(row){ row.set(rollStory(row.table, null, row.avoid && row.avoid())); });
      save(); renderAll();
    });
    var tools = ce("div", "slot-tools");
    tools.appendChild(rest);
    card.querySelector("h3").appendChild(tools);
  }
  if(r.from){
    var from = ce("p", "story-from");
    from.textContent = "Rolls on the " + r.from + " background's tables.";
    card.appendChild(from);
  }
  card.appendChild(grid(r.personality, "is-personality"));
  if(r.story.length){
    var h = ce("p", "story-section");
    h.textContent = "Background story";
    card.appendChild(h);
    card.appendChild(grid(r.story, "is-story"));
  }
  return card;
}

function grid(rows, kind){
  var g = ce("div", "story-grid " + kind);
  rows.forEach(function(row){ g.appendChild(tile(row)); });
  return g;
}

function tile(row){
  var value = row.get();
  var t = ce("div", "story-tile" + (value ? " is-set" : " is-empty"));
  var head = ce("div", "story-head");
  var label = ce("span", "story-label");
  // A chosen one is marked done; it stays changeable (dice, pencil, or a
  // tap on the text).
  if(value){ var tick = ce("span", "story-check"); tick.innerHTML = makeCheckSvg(); label.appendChild(tick); }
  label.appendChild(document.createTextNode(row.label));
  head.appendChild(label);
  var acts = ce("div", "story-acts");
  if(row.table){
    var roll = ce("button", "story-icon");
    roll.type = "button";
    roll.innerHTML = makeDiceSvg();
    roll.title = (value ? "Roll again (d" : "Roll a d") + row.table.die + (value ? ")" : "");
    roll.setAttribute("aria-label", "Roll " + row.label.toLowerCase());
    roll.addEventListener("click", function(){ row.set(rollStory(row.table, null, row.avoid && row.avoid())); save(); renderAll(); });
    acts.appendChild(roll);
  }
  var edit = ce("button", "story-icon");
  edit.type = "button";
  edit.innerHTML = PENCIL;
  edit.title = row.table ? "Choose from the table or write your own" : "Write your own";
  edit.setAttribute("aria-label", "Edit " + row.label.toLowerCase());
  edit.addEventListener("click", function(){ openStorySheet(row); });
  acts.appendChild(edit);
  head.appendChild(acts);
  t.appendChild(head);
  var body = ce("p", "story-text");
  if(!value){
    body.textContent = row.table ? "Not chosen yet" : "Write your own";
  } else if(row.ideal){
    // "Tradition. The ancient traditions... (Lawful)": the ideal's name in
    // bold, its alignment as a tag.
    var m = value.match(ALIGNMENT), text = m ? value.slice(0, m.index) : value;
    var dot = text.indexOf(". ");
    if(dot > 0 && dot < 30){
      var b = ce("b"); b.textContent = text.slice(0, dot + 1);
      body.appendChild(b);
      body.appendChild(document.createTextNode(" " + text.slice(dot + 2)));
    } else body.textContent = text;
    if(m){ var tag = ce("span", "story-tag"); tag.textContent = m[1]; body.appendChild(tag); }
  } else body.textContent = value;
  if(value){
    body.tabIndex = 0;
    body.setAttribute("role", "button");
    body.title = "Change it";
    body.addEventListener("click", function(){ openStorySheet(row); });
    body.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openStorySheet(row); } });
  }
  t.appendChild(body);
  return t;
}

/* Pick an entry (tap it) or write your own (Save); Clear empties it. */
function openStorySheet(row){
  var current = row.get();
  openBottomSheet(function(body, refresh, close){
    var header = ce("div", "bs-header");
    var title = ce("h3", "prep-title");
    title.textContent = row.label;
    header.appendChild(title);
    var x = ce("button", "bs-close");
    x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
    x.addEventListener("click", close);
    header.appendChild(x);
    body.appendChild(header);
    function done(v){ row.set(v); save(); close(); renderAll(); }
    if(row.table){
      var list = ce("div", "story-opts");
      row.table.entries.forEach(function(text, i){
        var o = ce("button", "story-opt" + (text === current ? " selected" : ""));
        o.type = "button";
        var n = ce("span", "story-opt-roll"); n.textContent = entryRoll(row.table, i);
        var tx = ce("span"); tx.textContent = text;
        o.appendChild(n); o.appendChild(tx);
        o.addEventListener("click", function(){ done(text); });
        list.appendChild(o);
      });
      body.appendChild(list);
    }
    var own = ce("p", "story-own-label");
    own.textContent = row.table ? "Or write your own" : "In your own words";
    body.appendChild(own);
    var ta = ce("textarea", "story-own");
    ta.rows = 3; ta.maxLength = 400;
    ta.setAttribute("aria-label", row.label + " in your own words");
    var isOwn = current && !(row.table && row.table.entries.indexOf(current) !== -1);
    ta.value = isOwn ? current : "";
    body.appendChild(ta);
    var actions = ce("div", "prep-actions");
    if(current){
      var clear = ce("button", "btn small ghost");
      clear.type = "button"; clear.textContent = "Clear";
      clear.addEventListener("click", function(){ done(""); });
      actions.appendChild(clear);
    }
    var saveBtn = ce("button", "btn small primary");
    saveBtn.type = "button"; saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", function(){ var v = ta.value.trim(); if(v) done(v); else close(); });
    actions.appendChild(saveBtn);
    body.appendChild(actions);
  });
}
