import { save } from "../../core/state.js";
import { nowStamp } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";

var ENTRY_MAX_HEIGHT = 320; // px — beyond this the box scrolls instead of growing
var ENTRY_MAX_CHARS = 8000; // generous ceiling, mainly a guard against runaway paste/storage bloat

function autoGrow(ta){
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, ENTRY_MAX_HEIGHT) + "px";
}

/* ---- Journal panel ---- */
export function renderJournalPanel(c){
  var panel = document.createElement("div");
  var card = makeCard("Journal", "notes, session recaps, plans — kept only on this device");

  var addBtn = document.createElement("button");
  addBtn.className = "btn small primary"; addBtn.style.marginBottom="12px";
  addBtn.textContent = "+ New entry";
  addBtn.addEventListener("click", function(){
    c.notes.unshift({ts: nowStamp(), text:""});
    save(); renderAll();
  });
  card.appendChild(addBtn);

  (c.notes||[]).forEach(function(entry, idx){
    var e = document.createElement("div");
    e.className = "journal-entry";
    var tsRow = document.createElement("div");
    tsRow.className = "journal-entry-header";
    var ts = document.createElement("span"); ts.className="ts"; ts.textContent = entry.ts;
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.addEventListener("click", function(){ c.notes.splice(idx,1); save(); renderAll(); });
    tsRow.appendChild(ts); tsRow.appendChild(rmBtn);
    e.appendChild(tsRow);
    var ta = document.createElement("textarea");
    ta.value = entry.text||"";
    ta.placeholder = "Write here…";
    ta.rows = 1;
    ta.maxLength = ENTRY_MAX_CHARS;
    ta.addEventListener("input", function(){ entry.text = ta.value; save(); autoGrow(ta); });
    e.appendChild(ta);
    card.appendChild(e);
    requestAnimationFrame(function(){ autoGrow(ta); });
  });
  if((c.notes||[]).length===0){
    var p = document.createElement("p");
    p.style.fontSize="13px"; p.style.color="var(--text-on-parch-dim)";
    p.textContent = "No entries yet.";
    card.appendChild(p);
  }
  panel.appendChild(card);
  return panel;
}
