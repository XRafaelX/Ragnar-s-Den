/* A spell pick list: a tray of picked spells (one slot per pick, tap ×
   to drop one), search, school and spell-level filters, and a grid of
   spell cards to tick. Used by the creation wizard's Cantrips and Spells
   steps and the level-up's New spells step.

   opts:
     title, help   heading and help line
     count         how many to pick
     names         catalog spell names on offer
     chosen        array of picked names, changed in place
     tags          {name: [labels]}: highlighted tags on a card
                   ("Patron spell", "Cleric spell")
     taken         optional function returning names picked in another
                   list on the same step; they're greyed out here
     onChange      called after each pick or drop
   The returned element has refresh() to redraw after another list
   changes. */
import { SPELL_DATA, spellLevelLabel } from "../data/spells.js";
import { escapeHtml, ce } from "../core/helpers.js";
import { makeCheckSvg } from "./svg-icons.js";

export function spellPickGrid(opts){
  var count = opts.count, chosen = opts.chosen, tags = opts.tags || {};
  var title = opts.title;
  var wrap = ce("div","wiz-spell-section");

  var head = ce("div","wiz-spell-head");
  var h = document.createElement("h4"); h.textContent = title;
  var counter = ce("span","wiz-spell-counter");
  head.appendChild(h); head.appendChild(counter);
  wrap.appendChild(head);

  if(opts.help){
    var helpP = document.createElement("p");
    helpP.className = "wiz-spell-help";
    helpP.textContent = opts.help;
    wrap.appendChild(helpP);
  }

  var names = opts.names.filter(function(n){ return SPELL_DATA[n]; });
  // A pick no longer on offer (a subclass or swap changed) is dropped.
  for(var i=chosen.length-1;i>=0;i--){ if(names.indexOf(chosen[i])===-1) chosen.splice(i,1); }
  if(chosen.length > count) chosen.splice(count);

  var bar = ce("div","wiz-spell-bar");
  var tray = ce("div","wiz-spell-tray");
  bar.appendChild(tray);
  var search = document.createElement("input");
  search.type = "search"; search.className = "wiz-spell-search";
  var lowered = title.charAt(0).toLowerCase() + title.slice(1);
  search.placeholder = "Search " + lowered + "…";
  search.setAttribute("aria-label", "Search " + lowered);
  bar.appendChild(search);
  wrap.appendChild(bar);

  // Filters, only for the schools and levels this list has.
  var school = "", level = -1;
  function distinct(get){ return names.map(get).filter(function(v, idx, all){ return v!=null && v!=="" && all.indexOf(v)===idx; }); }
  var schools = distinct(function(n){ return SPELL_DATA[n].school; }).sort();
  var levels = distinct(function(n){ return SPELL_DATA[n].level; }).sort(function(a, b){ return a - b; });
  function filterRow(label, values, text, cls, onPick){
    var row = ce("div","wiz-spell-filters");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", label);
    return {row: row, btns: values.map(function(v){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "wiz-spell-filter" + cls(v);
      b.textContent = text(v);
      b.addEventListener("click", function(){ onPick(v); applyFilter(); });
      row.appendChild(b);
      return {value: v, btn: b};
    })};
  }
  var levelRow = filterRow("Filter by spell level", [-1].concat(levels),
    function(v){ return v===-1 ? "All levels" : spellLevelLabel(v); }, function(){ return " level-filter"; },
    function(v){ level = v; });
  if(levels.length > 1) wrap.appendChild(levelRow.row);
  var schoolRow = filterRow("Filter by school", [""].concat(schools),
    function(v){ return v || "All schools"; }, function(v){ return v ? " school-" + v.toLowerCase() : ""; },
    function(v){ school = v; });
  if(schools.length > 1) wrap.appendChild(schoolRow.row);

  var grid = ce("div","wiz-spell-grid");
  var entries = names.map(function(name){
    var d = SPELL_DATA[name];
    var card = ce("label","wiz-spell-card school-" + (d.school||"").toLowerCase());
    var cb = document.createElement("input"); cb.type = "checkbox"; cb.className = "wiz-spell-check";
    var tagHtml = (tags[name]||[]).map(function(t){ return "<span class='wiz-spell-tag extra'>" + escapeHtml(t) + "</span>"; });
    if(d.concentration) tagHtml.push("<span class='wiz-spell-tag'>Concentration</span>");
    if(d.ritual) tagHtml.push("<span class='wiz-spell-tag'>Ritual</span>");
    var schoolLine = (levels.length > 1 ? spellLevelLabel(d.level) + " · " : "") + (d.school || "");
    var body = ce("span","wiz-spell-body");
    body.innerHTML =
      '<span class="wiz-spell-top"><span class="wiz-spell-name">' + escapeHtml(name) + '</span><span class="wiz-spell-tick" aria-hidden="true">' + makeCheckSvg() + '</span></span>' +
      '<span class="wiz-spell-school">' + escapeHtml(schoolLine) + '</span>' +
      '<span class="wiz-spell-facts">' + [d.castingTime, d.range].filter(Boolean).map(function(f){ return '<span class="wiz-spell-fact">' + escapeHtml(f) + '</span>'; }).join("") + tagHtml.join("") + '</span>' +
      '<span class="wiz-spell-summary">' + escapeHtml(d.summary || "") + '</span>';
    card.appendChild(cb); card.appendChild(body);
    grid.appendChild(card);
    cb.addEventListener("change", function(){
      var at = chosen.indexOf(name);
      if(cb.checked && at === -1){
        if(chosen.length >= count){ cb.checked = false; return; }
        chosen.push(name);
      } else if(!cb.checked && at !== -1){
        chosen.splice(at, 1);
      }
      document.querySelectorAll("#wizard-error, #wizard-overlay .wiz-error").forEach(function(box){ box.classList.remove("show"); });
      refresh();
      if(opts.onChange) opts.onChange();
    });
    return {name:name, d:d, card:card, cb:cb};
  });
  wrap.appendChild(grid);

  var empty = ce("p","wiz-spell-empty");
  empty.textContent = "No spells match. Try another search or filter.";
  wrap.appendChild(empty);

  var shownInTray = chosen.slice();
  function refresh(){
    var full = chosen.length >= count;
    var elsewhere = opts.taken ? opts.taken() : [];
    counter.textContent = chosen.length + " of " + count + " chosen";
    counter.classList.toggle("complete", chosen.length === count);
    entries.forEach(function(e){
      var on = chosen.indexOf(e.name) !== -1;
      var taken = !on && elsewhere.indexOf(e.name) !== -1;
      e.cb.checked = on;
      e.cb.disabled = !on && (full || taken);
      e.card.classList.toggle("selected", on);
      e.card.classList.toggle("disabled", !on && (full || taken));
      e.card.title = taken ? "Already picked in another list" : "";
    });
    // One slot per pick: picked spells first, then empty slots.
    tray.innerHTML = "";
    for(var k=0;k<count;k++){
      var name = chosen[k];
      if(name){
        var chip = document.createElement("button");
        chip.type = "button";
        // Only a spell that just went in pops in.
        chip.className = "wiz-spell-slot filled school-" + ((SPELL_DATA[name]||{}).school||"").toLowerCase() + (shownInTray.indexOf(name)===-1 ? " added" : "");
        chip.setAttribute("aria-label", "Remove " + name);
        chip.innerHTML = '<span>' + escapeHtml(name) + '</span><span class="wiz-spell-x" aria-hidden="true">×</span>';
        chip.addEventListener("click", (function(n){ return function(){
          chosen.splice(chosen.indexOf(n), 1);
          refresh();
          if(opts.onChange) opts.onChange();
        }; })(name));
        tray.appendChild(chip);
      } else {
        var slot = ce("span","wiz-spell-slot");
        slot.textContent = "Empty";
        tray.appendChild(slot);
      }
    }
    shownInTray = chosen.slice();
    if(full){
      var hint = ce("span","wiz-spell-full");
      hint.textContent = count > 1 ? "All picked. Tap × to swap one out." : "Picked. Tap × to change it.";
      tray.appendChild(hint);
    }
  }

  function applyFilter(){
    var q = search.value.toLowerCase().trim();
    var shown = 0;
    entries.forEach(function(e){
      var hay = (e.name + " " + e.d.school + " " + e.d.summary + (e.d.concentration ? " concentration" : "") + (e.d.ritual ? " ritual" : "") + " " + (tags[e.name]||[]).join(" ")).toLowerCase();
      var ok = (!q || hay.indexOf(q) !== -1) && (!school || e.d.school === school) && (level===-1 || e.d.level===level);
      e.card.hidden = !ok;
      if(ok) shown++;
    });
    schoolRow.btns.forEach(function(f){
      f.btn.classList.toggle("active", f.value === school);
      f.btn.setAttribute("aria-pressed", f.value === school ? "true" : "false");
    });
    levelRow.btns.forEach(function(f){
      f.btn.classList.toggle("active", f.value === level);
      f.btn.setAttribute("aria-pressed", f.value === level ? "true" : "false");
    });
    empty.hidden = shown > 0;
  }

  search.addEventListener("input", applyFilter);
  refresh();
  applyFilter();
  wrap.refresh = refresh;
  return wrap;
}
