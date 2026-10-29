import { save } from "../../core/state.js";
import { nowStamp } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { makeChevronRightSvg, makePinSvg } from "../../ui/svg-icons.js";

var ENTRY_MAX_HEIGHT = 320; // px; beyond this the box scrolls instead of growing
var ENTRY_MAX_CHARS = 8000; // generous ceiling, mainly a guard against runaway paste/storage bloat
var TITLE_MAX_CHARS = 80;
var COUNTER_FROM = 0.9;     // show the character counter once an entry is 90% full

/* Entries the player has opened. Not saved: a fresh visit starts with every
   written entry folded to one line, and so does adding a new entry. */
var openEntries = new WeakSet();
var focusAfter = null;  // {entry, grip}: what takes focus after a redraw (a new entry's text box, or a moved entry's grip)

function autoGrow(ta){
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, ENTRY_MAX_HEIGHT) + "px";
}

function isBlank(entry){
  return !(entry.title||"").trim() && !(entry.text||"").trim();
}

function firstLine(text){
  var line = (text||"").split("\n").map(function(l){ return l.trim(); }).filter(Boolean)[0];
  return line || "";
}

/* Pinned entries come first. The saved order stays the player's own, so the
   list shown is that order with the pinned ones lifted out. */
export function journalOrder(notes){
  var list = notes || [];
  return list.filter(function(n){ return n.pinned; }).concat(list.filter(function(n){ return !n.pinned; }));
}

/* Put an entry at place `to` among the entries of its own group (pinned or
   not), counted as shown. The pin line is never crossed. Returns true when
   it moved. */
export function reorderJournalEntry(notes, entry, to){
  var group = journalOrder(notes).filter(function(n){ return !!n.pinned === !!entry.pinned; });
  var from = group.indexOf(entry), target = group[to];
  if(from < 0 || !target || to === from) return false;
  notes.splice(notes.indexOf(entry), 1);
  notes.splice(notes.indexOf(target) + (to > from ? 1 : 0), 0, entry);
  return true;
}

/* One place up (-1) or down (+1) within the group, for the keyboard. */
export function moveJournalEntry(notes, entry, dir){
  var group = journalOrder(notes).filter(function(n){ return !!n.pinned === !!entry.pinned; });
  return reorderJournalEntry(notes, entry, group.indexOf(entry) + dir);
}

/* Pinning lifts an entry to the front of the pinned ones. */
export function setJournalPinned(notes, entry, pinned){
  entry.pinned = !!pinned;
  if(pinned){ notes.splice(notes.indexOf(entry), 1); notes.unshift(entry); }
}

var GRIP_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';

/* Drag an entry by its grip (pointer events, so a finger works too: the grip
   is the only part that doesn't scroll the page). The entry follows the
   pointer while the others in its group slide aside. Dropping calls
   onDrop(newPlace) with the place among that group's entries. */
function enableDrag(grip, el, onDrop){
  grip.addEventListener("pointerdown", function(ev){
    if(ev.button !== 0) return;
    ev.preventDefault();
    var pinned = el.classList.contains("pinned");
    var group = Array.prototype.filter.call(el.parentNode.children, function(n){
      return n.classList.contains("journal-entry") && n.classList.contains("pinned") === pinned;
    });
    var from = group.indexOf(el), to = from;
    var centres = group.map(function(n){ var r = n.getBoundingClientRect(); return r.top + window.scrollY + r.height/2; });
    var step = el.offsetHeight + (parseFloat(getComputedStyle(el).marginBottom) || 0);
    var startY = ev.clientY, startScroll = window.scrollY, lastY = startY, raf = 0;
    grip.setPointerCapture(ev.pointerId);
    el.classList.add("dragging");
    group.forEach(function(n){ if(n !== el) n.classList.add("journal-shifting"); });

    function update(){
      var dy = lastY - startY + (window.scrollY - startScroll);
      el.style.transform = "translateY(" + dy + "px)";
      var mid = centres[from] + dy;
      to = 0;
      centres.forEach(function(cy, j){ if(j !== from && cy < mid) to++; });
      group.forEach(function(n, j){
        if(n === el) return;
        var shift = 0;
        if(from < to && j > from && j <= to) shift = -step;
        else if(to < from && j >= to && j < from) shift = step;
        n.style.transform = shift ? "translateY(" + shift + "px)" : "";
      });
    }
    // Near the top or bottom of the window the page scrolls along.
    function tick(){
      if(lastY < 60) window.scrollBy(0, -12);
      else if(lastY > window.innerHeight - 60) window.scrollBy(0, 12);
      update();
      raf = requestAnimationFrame(tick);
    }
    function move(e2){ lastY = e2.clientY; }
    function finish(drop){
      cancelAnimationFrame(raf);
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", up);
      grip.removeEventListener("pointercancel", cancel);
      el.classList.remove("dragging");
      group.forEach(function(n){ n.classList.remove("journal-shifting"); n.style.transform = ""; });
      if(drop && to !== from) onDrop(to);
    }
    function up(){ finish(true); }
    function cancel(){ finish(false); }
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
    grip.addEventListener("pointercancel", cancel);
    raf = requestAnimationFrame(tick);
  });
}

/* ---- Journal panel ---- */
export function renderJournalPanel(c){
  var panel = document.createElement("div");
  var card = makeCard("Journal");

  var addBtn = document.createElement("button");
  addBtn.className = "btn small primary"; addBtn.style.marginBottom="12px";
  addBtn.textContent = "+ New entry";
  addBtn.addEventListener("click", function(){
    var entry = {ts: nowStamp(), title:"", text:""};
    // The entries already written fold away, so only the new one is open.
    c.notes.forEach(function(n){ openEntries.delete(n); });
    c.notes.unshift(entry);
    openEntries.add(entry); focusAfter = {entry: entry, grip: false};
    save(); renderAll(); playAdd();
  });
  card.appendChild(addBtn);

  var shown = journalOrder(c.notes);
  shown.forEach(function(entry){
    var e = document.createElement("div");
    e.className = "journal-entry" + (entry.pinned ? " pinned" : "");

    // Header: grip, a button that folds the entry, then the date, pin and delete.
    var head = document.createElement("div");
    head.className = "journal-entry-header";
    var toggle = document.createElement("button");
    toggle.type = "button"; toggle.className = "journal-toggle";
    var chev = document.createElement("span");
    chev.className = "journal-chevron"; chev.innerHTML = makeChevronRightSvg();
    var summary = document.createElement("span"); summary.className = "journal-summary";
    var sumTitle = document.createElement("span"); sumTitle.className = "journal-summary-title";
    var sumText = document.createElement("span"); sumText.className = "journal-summary-text";
    summary.appendChild(sumTitle); summary.appendChild(sumText);
    toggle.appendChild(chev); toggle.appendChild(summary);
    var ts = document.createElement("span"); ts.className="ts"; ts.textContent = entry.ts;
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.title = "Delete entry";
    rmBtn.setAttribute("aria-label", "Delete entry");
    rmBtn.addEventListener("click", function(){
      function remove(){ c.notes.splice(c.notes.indexOf(entry),1); save(); renderAll(); playDelete(); }
      // An empty entry goes at once; one with writing asks first.
      if(isBlank(entry)) remove();
      else confirmDialog("Delete this journal entry?", "This cannot be undone.", remove);
    });
    var pinBtn = document.createElement("button"); pinBtn.type = "button"; pinBtn.className = "journal-pin";
    pinBtn.innerHTML = makePinSvg();
    pinBtn.title = entry.pinned ? "Unpin entry" : "Pin entry to the top";
    pinBtn.setAttribute("aria-label", pinBtn.title);
    pinBtn.setAttribute("aria-pressed", entry.pinned ? "true" : "false");
    pinBtn.addEventListener("click", function(){
      setJournalPinned(c.notes, entry, !entry.pinned); save(); renderAll();
    });
    var grip = document.createElement("button"); grip.type = "button"; grip.className = "journal-grip";
    grip.innerHTML = GRIP_SVG;
    grip.title = "Drag to reorder (or use the up and down arrow keys)";
    grip.setAttribute("aria-label", "Reorder entry");
    grip.addEventListener("keydown", function(ev){
      if(ev.key !== "ArrowUp" && ev.key !== "ArrowDown") return;
      ev.preventDefault();
      if(moveJournalEntry(c.notes, entry, ev.key === "ArrowUp" ? -1 : 1)){
        focusAfter = {entry: entry, grip: true}; save(); renderAll();
      }
    });
    enableDrag(grip, e, function(to){
      if(reorderJournalEntry(c.notes, entry, to)){ focusAfter = {entry: entry, grip: true}; save(); renderAll(); }
    });
    head.appendChild(grip); head.appendChild(toggle); head.appendChild(ts); head.appendChild(pinBtn); head.appendChild(rmBtn);
    e.appendChild(head);

    // Body: optional title, the text, and a counter that only appears near the limit.
    var body = document.createElement("div");
    body.className = "journal-body";
    var titleIn = document.createElement("input");
    titleIn.type = "text"; titleIn.className = "journal-title-input";
    titleIn.value = entry.title||"";
    titleIn.placeholder = "Title (optional)";
    titleIn.maxLength = TITLE_MAX_CHARS;
    titleIn.setAttribute("aria-label", "Entry title");
    var ta = document.createElement("textarea");
    ta.value = entry.text||"";
    ta.placeholder = "Write here…";
    ta.rows = 1;
    ta.maxLength = ENTRY_MAX_CHARS;
    ta.setAttribute("aria-label", "Entry text");
    var counter = document.createElement("div");
    counter.className = "journal-counter";
    body.appendChild(titleIn); body.appendChild(ta); body.appendChild(counter);
    e.appendChild(body);

    function refreshSummary(){
      var t = (entry.title||"").trim(), line = firstLine(entry.text);
      sumTitle.textContent = t || line || "Empty entry";
      sumText.textContent = t ? line : "";
      e.classList.toggle("untitled", !t);
    }
    function refreshCounter(){
      var n = ta.value.length;
      counter.textContent = n >= ENTRY_MAX_CHARS*COUNTER_FROM ? n.toLocaleString()+" / "+ENTRY_MAX_CHARS.toLocaleString() : "";
    }
    function isOpen(){ return openEntries.has(entry) || isBlank(entry); }
    function setOpen(open){
      if(open) openEntries.add(entry); else openEntries.delete(entry);
      e.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if(open) autoGrow(ta);
      refreshSummary();
    }
    toggle.addEventListener("click", function(){ setOpen(!e.classList.contains("open")); });
    titleIn.addEventListener("input", function(){ entry.title = titleIn.value; save(); refreshSummary(); });
    ta.addEventListener("input", function(){ entry.text = ta.value; save(); autoGrow(ta); refreshSummary(); refreshCounter(); });

    refreshSummary(); refreshCounter();
    var open = isOpen();
    e.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    card.appendChild(e);
    requestAnimationFrame(function(){
      if(open) autoGrow(ta);
      if(focusAfter && focusAfter.entry === entry){
        (focusAfter.grip ? grip : ta).focus(); focusAfter = null;
      }
    });
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
