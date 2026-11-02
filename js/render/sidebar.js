import { state, getActive, save } from "../core/state.js";
import { clamp, escapeHtml, maxHp } from "../core/helpers.js";
import { closeSidebarMobile } from "../ui/mobile-nav.js";
import { buildAvatar } from "../ui/avatar.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { exportCharacters } from "../ui/export-file.js";
import { playDelete } from "../ui/sound.js";
import { renderAll } from "./sheet.js";

/* ---------------- Rendering: sidebar ----------------
   Holding a character (and letting go) starts selecting: tap others to
   add them, then Export or Delete from the bar that takes the New
   Character button's place. Holding and then dragging moves a character
   up or down the list. A mouse can drag straight away. A finger has to
   hold first, so a plain swipe still scrolls the list. */

var HOLD_MS = 550;
var SLOP = 10;          // px of drift before a press counts as a move
var EDGE = 36;          // px from the list's edge where a drag scrolls it
var SUBTITLE = "Your characters, kept offline.";

var selecting = false;
var selected = {};
var press = null;       // the press or drag in progress
var suppressClick = false;

var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

function selectedChars(){ return state.characters.filter(function(c){ return selected[c.id]; }); }

function stopSelecting(){
  selecting = false;
  selected = {};
}

export function renderSidebar(){
  var list = document.getElementById("char-list");
  list.innerHTML = "";
  // Forget picks whose characters are gone; nothing left picked ends it.
  Object.keys(selected).forEach(function(id){
    if(!state.characters.some(function(c){ return c.id===id; })) delete selected[id];
  });
  if(selecting && !selectedChars().length) stopSelecting();

  state.characters.forEach(function(c){
    var li = document.createElement("li");
    li.dataset.id = c.id;
    if(c.id===state.activeId) li.classList.add("active");
    if(selected[c.id]) li.classList.add("selected");
    li.title = "Hold to select, drag to reorder";
    var hpMax = maxHp(c);
    var pct = hpMax>0 ? clamp(Math.round((c.hp.current/hpMax)*100),0,100) : 0;
    var clsText = (c.classes||[]).map(function(cl){return (cl.name||"?")+" "+(cl.level||1);}).join(" / ");
    var row = document.createElement("div");
    row.className = "char-row";
    var av = document.createElement("div");
    av.className = "char-row-avatar";
    av.appendChild(buildAvatar(c, 34, false));
    var check = document.createElement("span");
    check.className = "char-check";
    check.innerHTML = CHECK_SVG;
    av.appendChild(check);
    row.appendChild(av);
    var info = document.createElement("div");
    info.className = "char-row-info";
    info.innerHTML =
      '<span class="cname">'+escapeHtml(c.name||"Unnamed")+'</span>'+
      '<span class="cmeta">'+escapeHtml([c.race, clsText].filter(Boolean).join(" · "))+'</span>'+
      '<div class="hp-bar"><div class="hp-fill" style="width:'+pct+'%"></div></div>';
    row.appendChild(info);
    li.appendChild(row);
    li.addEventListener("pointerdown", function(e){ onPressStart(e, li, c); });
    li.addEventListener("click", function(){
      if(suppressClick){ suppressClick = false; return; }
      if(selecting){ toggle(c.id); return; }
      state.activeId = c.id;
      state.activeTab = "vitals";
      renderAll();
      closeSidebarMobile();
    });
    list.appendChild(li);
  });
  syncSelectUi();
  var titleEl = document.getElementById("tb-title");
  var active = getActive();
  titleEl.textContent = active ? active.name : "Ragnar's Den";
}

function syncSelectUi(){
  var n = selectedChars().length;
  document.getElementById("sidebar").classList.toggle("selecting", selecting);
  document.getElementById("new-char-btn").hidden = selecting;
  document.getElementById("select-bar").hidden = !selecting;
  document.getElementById("sidebar-sub").textContent = selecting ? n+" selected" : SUBTITLE;
}

function toggle(id){
  if(selected[id]) delete selected[id]; else selected[id] = true;
  renderSidebar();
}

/* A hold that ends without moving: start selecting, or add/remove. */
function onHold(c){
  if(navigator.vibrate) navigator.vibrate(30);
  if(!selecting){
    selecting = true;
    selected = {};
    selected[c.id] = true;
    renderSidebar();
  } else toggle(c.id);
}

/* ---------- Press, hold and drag ---------- */
function onPressStart(e, li, c){
  if(e.button!==0 || press) return;
  suppressClick = false;
  press = {li:li, c:c, x:e.clientX, y:e.clientY, lastY:e.clientY, mouse:e.pointerType==="mouse", held:false, drag:false, timer:null};
  li.classList.add("pressing");
  press.timer = setTimeout(function(){
    if(!press || press.li!==li) return;
    press.timer = null;
    press.held = true;
    li.classList.remove("pressing");
    li.classList.add("held");
  }, HOLD_MS);
  window.addEventListener("pointermove", onPressMove);
  window.addEventListener("pointerup", onPressEnd);
  window.addEventListener("pointercancel", onPressCancel);
}

function onPressMove(e){
  if(!press) return;
  press.lastY = e.clientY;
  if(press.drag){ e.preventDefault(); moveDrag(); return; }
  if(Math.hypot(e.clientX - press.x, e.clientY - press.y) <= SLOP) return;
  if(press.held || press.mouse) startDrag();
  else endPress();     // a finger swipe: let the list scroll
}

function onPressEnd(){
  if(!press) return;
  if(press.drag){ suppressClick = true; finishDrag(); }
  else if(press.held){
    suppressClick = true;
    var c = press.c;
    endPress();
    onHold(c);
    return;
  }
  endPress();
}

/* The browser took over (a scroll began, or the page lost focus). */
function onPressCancel(){
  if(press && press.drag) finishDrag();
  endPress();
}

function endPress(){
  if(!press) return;
  if(press.timer) clearTimeout(press.timer);
  press.li.classList.remove("pressing", "held");
  press = null;
  window.removeEventListener("pointermove", onPressMove);
  window.removeEventListener("pointerup", onPressEnd);
  window.removeEventListener("pointercancel", onPressCancel);
}

function startDrag(){
  var li = press.li, list = li.parentNode;
  if(press.timer){ clearTimeout(press.timer); press.timer = null; }
  press.drag = true;
  press.grab = press.y - li.getBoundingClientRect().top;
  press.order = Array.prototype.map.call(list.children, function(x){ return x.dataset.id; }).join();
  li.classList.remove("pressing", "held");
  li.classList.add("dragging");
  list.classList.add("reordering");
  moveDrag();
  (function edgeScroll(){
    if(!press || !press.drag) return;
    var r = list.getBoundingClientRect();
    var step = press.lastY < r.top + EDGE ? -6 : press.lastY > r.bottom - EDGE ? 6 : 0;
    if(step){
      var before = list.scrollTop;
      list.scrollTop += step;
      if(list.scrollTop!==before) moveDrag();
    }
    requestAnimationFrame(edgeScroll);
  })();
}

/* Follow the pointer, and move the row past any neighbour whose middle
   it crosses. The neighbour slides into the freed slot. */
function moveDrag(){
  var li = press.li, list = li.parentNode;
  var r = list.getBoundingClientRect();
  var top = press.lastY - r.top + list.scrollTop - press.grab;
  var mid = top + li.offsetHeight/2;
  var prev = li.previousElementSibling, next = li.nextElementSibling;
  while(prev && mid < prev.offsetTop + prev.offsetHeight/2){
    slide(prev, function(){ list.insertBefore(li, prev); });
    prev = li.previousElementSibling;
  }
  while(next && mid > next.offsetTop + next.offsetHeight/2){
    slide(next, function(){ list.insertBefore(li, next.nextElementSibling); });
    next = li.nextElementSibling;
  }
  li.style.transform = "translateY("+(top - li.offsetTop)+"px)";
}

function slide(el, move){
  var before = el.offsetTop;
  move();
  var d = before - el.offsetTop;
  if(!d) return;
  el.style.transition = "none";
  el.style.transform = "translateY("+d+"px)";
  void el.offsetHeight;
  el.style.transition = "transform .15s ease";
  el.style.transform = "";
}

function finishDrag(){
  var li = press.li, list = li.parentNode;
  li.style.transform = "";
  li.classList.remove("dragging");
  list.classList.remove("reordering");
  var ids = Array.prototype.map.call(list.children, function(x){ return x.dataset.id; });
  if(ids.join()===press.order) return;
  var at = {};
  ids.forEach(function(id, i){ at[id] = i; });
  state.characters.sort(function(a, b){ return at[a.id] - at[b.id]; });
  save();
  renderAll();
}

/* ---------- Export / Delete bar ---------- */
function nameList(chars){
  var names = chars.map(function(c){ return c.name || "Unnamed"; });
  if(names.length > 5) names = names.slice(0, 4).concat([(names.length - 4)+" more"]);
  return names.length===1 ? names[0] : names.slice(0, -1).join(", ")+" and "+names[names.length-1];
}

function deleteSelected(){
  var chars = selectedChars();
  if(!chars.length) return;
  var title = chars.length===1 ? "Delete "+(chars[0].name || "this character")+"?" : "Delete "+chars.length+" characters?";
  confirmDialog(title, nameList(chars)+" will be removed. This cannot be undone, so export them first if you want to keep a copy.", function(){
    var gone = {};
    chars.forEach(function(c){ gone[c.id] = true; });
    state.characters = state.characters.filter(function(c){ return !gone[c.id]; });
    if(gone[state.activeId]){
      state.activeId = state.characters.length ? state.characters[0].id : null;
      if(state.activeId) state.activeTab = "vitals";
    }
    stopSelecting();
    save();
    renderAll();
    playDelete();
  });
}

export function setupSidebar(){
  var list = document.getElementById("char-list");
  // Once a finger has held a row, its moves drag the row instead of
  // scrolling the list. Stops the long-press menu on phones as well.
  list.addEventListener("touchmove", function(e){
    if(press && (press.held || press.drag)) e.preventDefault();
  }, {passive:false});
  list.addEventListener("contextmenu", function(e){ if(e.target.closest("li")) e.preventDefault(); });
  document.getElementById("select-export").addEventListener("click", function(){ exportCharacters(selectedChars()); });
  document.getElementById("select-delete").addEventListener("click", deleteSelected);
  document.getElementById("select-cancel").addEventListener("click", function(){ stopSelecting(); renderSidebar(); });
  document.addEventListener("keydown", function(e){
    if(e.key==="Escape" && selecting && !document.querySelector(".rd-backdrop.open")){ stopSelecting(); renderSidebar(); }
  });
}
