import { MONSTER_DATA } from "../data/monsters.js";
import { CONDITIONS, SPELL_CONDITIONS } from "../data/conditions.js";
import { openBottomSheet } from "../ui/bottom-sheet.js";
import { makeConditionSvg } from "../ui/svg-icons.js";
import { conditionTakesHold, conditionEnds } from "../ui/fx.js";
import { playConditionOn, playConditionOff } from "../ui/sound.js";
import { closeButton, sheetHeader, rulesList } from "./panels/conditions.js";
import {
  monsterConditions, monsterConditionDef, hasMonsterCondition, addMonsterCondition, removeMonsterCondition, isDead
} from "../core/encounters.js";

/* ---------------- Conditions on encounter monsters ----------------
   The character sheet's conditions (js/render/panels/conditions.js) for
   the DM's monsters, plus the spells a DM keeps track of the same way:
   Hex, Bestow Curse, Slow, Sleep and Bless. A button on the monster's
   box opens one sheet with every one as a tile. What's on shows as chips
   on the box, and a chip opens the rules.

   `onChange()` saves the encounter and redraws the board. */

/* The box's button, lit with a count while something is on. */
export function conditionsButton(enc, m, onChange){
  var on = monsterConditions(m).length;
  var b = document.createElement("button");
  b.type = "button";
  b.className = "enc-cond-open" + (on ? " on" : "");
  b.innerHTML = '<span class="cond-icon">' + makeConditionSvg("conditions") + '</span>';
  if(on){
    var n = document.createElement("span");
    n.className = "cond-count";
    n.textContent = on;
    b.appendChild(n);
  }
  b.title = "Conditions";
  b.setAttribute("aria-label", "Conditions for " + m.name + (on ? " (" + on + " on)" : ""));
  b.addEventListener("click", function(){ openMonsterConditions(enc, m, onChange); });
  return b;
}

/* Every box has one row for its chips, empty or not, so the boxes all
   match. As many chips as fit go in it, and a "+3" pill shows the rest
   without the box growing: a small pop-up under the row, or on a phone
   a bottom sheet listing every condition on the monster (PHONE, the
   width where the boxes stack). How many fit is measured once the box
   is on screen, see fitChips. */
var PHONE = "(max-width: 640px)";

/* The chips row: every chip, the "+3" pill and its pop-up. fitChips then
   moves the chips that don't fit into the pop-up. */
export function conditionChips(enc, m, onChange){
  var list = monsterConditions(m);
  var row = document.createElement("div");
  row.className = "cond-chips enc-cond-chips" + (list.length ? "" : " empty");
  row.dataset.monsterId = m.id;
  list.forEach(function(x){
    var d = x.def;
    var chip = document.createElement("div");
    chip.className = "cond-chip cond-" + d.id;
    chip.dataset.cond = d.id;
    chip.style.setProperty("--hue", d.hue);
    var open = document.createElement("button");
    open.type = "button";
    open.className = "cond-chip-main";
    open.innerHTML = '<span class="cond-icon">' + makeConditionSvg(d.id) + '</span>';
    var name = document.createElement("span");
    name.className = "cond-name";
    name.textContent = d.name;
    open.appendChild(name);
    if(x.pick && x.pick.label){
      var tag = document.createElement("span");
      tag.className = "cond-why";
      tag.textContent = x.pick.label;
      open.appendChild(tag);
    }
    open.title = d.name + ": " + (x.pick ? x.pick.text : d.short);
    open.setAttribute("aria-label", d.name + (x.pick ? ": " + x.pick.text : "") + ". Show the rules");
    open.addEventListener("click", function(){ openMonsterConditions(enc, m, onChange, d.id); });
    chip.appendChild(open);
    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "cond-chip-x";
    rm.textContent = "✕";
    rm.title = d.id === "prone" ? "Stand up" : "End " + d.name;
    rm.setAttribute("aria-label", rm.title + " on " + m.name);
    rm.addEventListener("click", function(){ end(enc, m, d.id, chip, onChange); });
    chip.appendChild(rm);
    row.appendChild(chip);
  });
  if(!list.length) return row;
  var more = document.createElement("button");
  more.type = "button";
  more.className = "enc-cond-more";
  // The pop-up is styled and closed like the boxes' ⋯ menus.
  var pop = document.createElement("div");
  pop.className = "catalog-row-dropdown enc-cond-pop cond-chips";
  more.addEventListener("click", function(e){
    e.stopPropagation();
    if(window.matchMedia && window.matchMedia(PHONE).matches){ openOnSheet(enc, m, onChange); return; }
    var open = pop.classList.contains("open");
    document.querySelectorAll(".catalog-row-dropdown.open").forEach(function(d){ d.classList.remove("open"); });
    document.querySelectorAll('.enc-cond-more[aria-expanded="true"]').forEach(function(b){ b.setAttribute("aria-expanded", "false"); });
    if(!open) pop.classList.add("open");
    more.setAttribute("aria-expanded", open ? "false" : "true");
  });
  pop.addEventListener("click", function(e){ if(!e.target.closest("button")) e.stopPropagation(); });
  row.appendChild(more);
  row.appendChild(pop);
  return row;
}

/* Fits a chips row on one line: the chips that don't fit go into the
   "+3" pop-up, in order. Run once the row is on screen and again
   whenever the row changes width. With every chip fitting there's no
   pill, and a lone chip too wide for the box has its name cut with "…". */
export function fitChips(row){
  var more = row.querySelector(":scope > .enc-cond-more");
  if(!more) return;
  var pop = row.querySelector(":scope > .enc-cond-pop");
  while(pop.firstChild) row.insertBefore(pop.firstChild, more);
  var chips = Array.prototype.slice.call(row.querySelectorAll(":scope > .cond-chip"));
  more.style.display = "none";
  row.classList.add("measuring");
  // Too wide when the last chip or pill ends past the row's inner edge.
  // Measured in fractions of a pixel: a row over by even a little would
  // squeeze the chips and cut their names.
  var cs = getComputedStyle(row);
  var edge = row.getBoundingClientRect().right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
  var over = function(){
    var kids = row.querySelectorAll(":scope > .cond-chip");
    var last = more.style.display === "none" ? kids[kids.length - 1] : more;
    return !!last && last.getBoundingClientRect().right > edge - 0.5;
  };
  if(!over()){ row.classList.remove("measuring"); return; }
  more.style.display = "";
  more.textContent = "+" + chips.length;  // the widest it can be, while measuring
  var n = chips.length;
  while(n > 1 && over()){
    pop.insertBefore(chips[--n], pop.firstChild);
    more.textContent = "+" + (chips.length - n);
  }
  row.classList.remove("measuring");
  var name = row.closest(".enc-card") ? row.closest(".enc-card").dataset.name : "";
  var hidden = chips.slice(n).map(function(c){ return c.querySelector(".cond-name").textContent; });
  more.title = "Show " + hidden.length + " more: " + hidden.join(", ");
  more.setAttribute("aria-expanded", pop.classList.contains("open") ? "true" : "false");
  more.setAttribute("aria-label", "Show " + hidden.length + " more conditions on " + name + ": " + hidden.join(", "));
}

/* On a phone, "+3" opens every condition on the monster as a list in a
   bottom sheet: a row each with what it does and End. A row opens its
   rules, and "Add a condition" the sheet with every tile. */
function openOnSheet(enc, m, onChange){
  openBottomSheet(function(body, refresh, close){
    var list = monsterConditions(m);
    if(!list.length){ close(); return; }
    var header = document.createElement("div");
    header.className = "bs-header";
    var title = document.createElement("div");
    title.className = "bs-title";
    title.textContent = m.name;
    header.appendChild(title);
    header.appendChild(closeButton(close));
    body.appendChild(header);
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = list.length + " conditions on it. Tap one for its rules.";
    body.appendChild(sub);
    var ul = document.createElement("div");
    ul.className = "enc-cond-list";
    list.forEach(function(x){
      var d = x.def;
      var item = document.createElement("div");
      item.className = "enc-cond-item";
      item.dataset.cond = d.id;
      item.style.setProperty("--hue", d.hue);
      var main = document.createElement("button");
      main.type = "button";
      main.className = "enc-cond-item-main";
      main.innerHTML = '<span class="cond-icon">' + makeConditionSvg(d.id) + '</span><span class="cond-tile-text"><b></b><small></small></span>';
      var name = main.querySelector("b");
      name.textContent = d.name;
      if(x.pick && x.pick.label){
        var tag = document.createElement("span");
        tag.className = "cond-why";
        tag.textContent = x.pick.label;
        name.appendChild(tag);
      }
      main.querySelector("small").textContent = x.pick ? x.pick.text : d.short;
      main.setAttribute("aria-label", d.name + (x.pick ? ": " + x.pick.text : "") + ". Show the rules");
      main.addEventListener("click", function(){ openMonsterConditions(enc, m, onChange, d.id); });
      item.appendChild(main);
      var stop = document.createElement("button");
      stop.type = "button";
      stop.className = "btn small ghost enc-cond-item-end";
      stop.textContent = d.id === "prone" ? "Stand up" : "End";
      stop.setAttribute("aria-label", (d.id === "prone" ? "Stand up" : "End " + d.name) + " on " + m.name);
      stop.addEventListener("click", function(){
        removeMonsterCondition(enc, m.id, d.id);
        onChange();
        playConditionOff();
        refresh();
      });
      item.appendChild(stop);
      ul.appendChild(item);
    });
    body.appendChild(ul);
    var row = document.createElement("div");
    row.className = "cond-sheet-actions";
    var add = document.createElement("button");
    add.type = "button";
    add.className = "btn small primary";
    add.textContent = "Add a condition";
    add.addEventListener("click", function(){ openMonsterConditions(enc, m, onChange); });
    row.appendChild(add);
    body.appendChild(row);
  });
}

function start(enc, m, id, pick, onChange){
  var added = addMonsterCondition(enc, m.id, id, pick);
  onChange();
  // The new chips on the redrawn box, staggered when Prone comes along.
  added.forEach(function(a, i){
    setTimeout(function(){
      // One that went into the "+3" pop-up lands on the pill instead.
      var chip = document.querySelector('.enc-cond-chips[data-monster-id="' + m.id + '"] > .cond-chip[data-cond="' + a + '"]') ||
        document.querySelector('.enc-cond-chips[data-monster-id="' + m.id + '"] > .enc-cond-more');
      conditionTakesHold(chip, a, monsterConditionDef(a).hue);
    }, i * 220);
  });
  if(added.length) playConditionOn(id);
}

function end(enc, m, id, chip, onChange){
  conditionEnds(chip, function(){
    removeMonsterCondition(enc, m.id, id);
    onChange();
  });
  playConditionOff();
}

/* What the board does about it by itself, in a line, or "". */
function appliedText(d){
  var out = [];
  if(d.ac) out.push("its AC shows " + Math.abs(d.ac) + " lower");
  if(d.halfSpeed) out.push("its speed shows halved");
  if(d.noMove) out.push("its speed shows 0");
  if(d.wakes) out.push("damage wakes it up");
  if(d.id === "unconscious" || d.id === "asleep") out.push("it is knocked prone");
  if(!out.length) return "";
  var text = out.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

/* Why a monster can't have it, or "". Sleep doesn't work on undead. */
function immunity(m, d){
  var data = MONSTER_DATA[m.kind];
  return d.id === "asleep" && data && data.type === "Undead" ? "Undead can't be put to sleep." : "";
}

/* The sheet: every spell and condition as a tile. Tapping one that's off
   puts it on and closes the sheet, so its arrival is seen on the box.
   Hex and Bestow Curse first ask what the caster chose. `focus` opens
   straight on one condition's rules (from its chip). */
export function openMonsterConditions(enc, m, onChange, focus){
  var view = focus || null;
  openBottomSheet(function(body, refresh, close){
    if(view) detail(body, monsterConditionDef(view), function(){ show(null, refresh); }, close);
    else grid(body, refresh, close);
  });

  /* Switches between the list and one condition's page, from the top. */
  function show(id, refresh){
    view = id;
    refresh();
    document.getElementById("bottom-sheet").scrollTop = 0;
  }

  function grid(body, refresh, close){
    var header = document.createElement("div");
    header.className = "bs-header";
    var title = document.createElement("div");
    title.className = "bs-title";
    title.textContent = m.name;
    header.appendChild(title);
    header.appendChild(closeButton(close));
    body.appendChild(header);
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = isDead(m) ? "Down monsters have no conditions. Heal it first." : "Tap one to put it on or take it off.";
    body.appendChild(sub);
    section(body, "Spells", SPELL_CONDITIONS, refresh, close);
    section(body, "Conditions", CONDITIONS, refresh, close);
  }

  function section(body, label, defs, refresh, close){
    var head = document.createElement("div");
    head.className = "enc-cond-label";
    head.textContent = label;
    body.appendChild(head);
    var on = monsterConditions(m);
    var wrap = document.createElement("div");
    wrap.className = "cond-grid";
    defs.forEach(function(d){
      var cur = on.find(function(x){ return x.def.id === d.id; });
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "cond-tile" + (cur ? " on" : "");
      tile.dataset.cond = d.id;
      tile.style.setProperty("--hue", d.hue);
      tile.innerHTML = '<span class="cond-icon">' + makeConditionSvg(d.id) + '</span>';
      var text = document.createElement("span");
      text.className = "cond-tile-text";
      text.innerHTML = '<b></b><small></small>';
      text.firstChild.textContent = d.name;
      var immune = !cur && immunity(m, d);
      text.lastChild.textContent = immune || (cur && cur.pick ? cur.pick.text : d.short);
      tile.appendChild(text);
      tile.setAttribute("aria-pressed", cur ? "true" : "false");
      if(immune || (!cur && isDead(m))) tile.disabled = true;
      tile.addEventListener("click", function(){
        if(cur){
          removeMonsterCondition(enc, m.id, d.id);
          onChange();
          refresh();
          playConditionOff();
          return;
        }
        if(d.picks){ show(d.id, refresh); return; }
        close();
        start(enc, m, d.id, "", onChange);
      });
      wrap.appendChild(tile);
    });
    body.appendChild(wrap);
  }

  /* One condition's rules, with the caster's choice for Hex and Bestow
     Curse. Picking puts it on, or changes the choice if it's on. */
  function detail(body, d, back, close){
    var on = hasMonsterCondition(m, d.id);
    var cur = monsterConditions(m).find(function(x){ return x.def.id === d.id; });
    body.appendChild(sheetHeader(makeConditionSvg(d.id), d.name, d.hue, close));
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = (d.spell ? "From the " + d.spell + " spell" : "Condition") + " · " + m.name;
    body.appendChild(sub);
    if(d.picks){
      var ask = document.createElement("div");
      ask.className = "enc-cond-label";
      ask.textContent = d.pickTitle;
      body.appendChild(ask);
      // Short choices (an ability) sit in a grid, long ones one per row.
      var picks = null, group = null;
      d.picks.forEach(function(p){
        var short = p.button !== p.text;
        if(!picks || p.group !== group || short !== picks.classList.contains("short")){
          group = p.group;
          if(group){
            var cap = document.createElement("div");
            cap.className = "enc-cond-group";
            cap.textContent = group;
            body.appendChild(cap);
          }
          picks = document.createElement("div");
          picks.className = "enc-cond-picks" + (short ? " short" : "");
          body.appendChild(picks);
        }
        var chosen = cur && cur.pick && cur.pick.id === p.id;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "enc-cond-pick" + (chosen ? " on" : "");
        b.style.setProperty("--hue", d.hue);
        b.textContent = p.button;
        if(short) b.title = p.text;
        b.setAttribute("aria-pressed", chosen ? "true" : "false");
        b.disabled = !on && isDead(m);
        b.addEventListener("click", function(){
          close();
          if(on){ addMonsterCondition(enc, m.id, d.id, p.id); onChange(); }
          else start(enc, m, d.id, p.id, onChange);
        });
        picks.appendChild(b);
      });
    }
    body.appendChild(rulesList(d.rules));
    var applied = appliedText(d);
    if(applied){
      var note = document.createElement("p");
      note.className = "cond-applied";
      note.innerHTML = "<b>On the board:</b> ";
      note.appendChild(document.createTextNode(applied));
      body.appendChild(note);
    }
    var row = document.createElement("div");
    row.className = "cond-sheet-actions";
    var all = document.createElement("button");
    all.type = "button";
    all.className = "btn small ghost";
    all.textContent = "All conditions";
    all.addEventListener("click", back);
    row.appendChild(all);
    if(on){
      var stop = document.createElement("button");
      stop.type = "button";
      stop.className = "btn small primary";
      stop.textContent = d.id === "prone" ? "Stand up" : "End " + d.name;
      stop.addEventListener("click", function(){
        close();
        end(enc, m, d.id, document.querySelector('.enc-card[data-monster-id="' + m.id + '"] .cond-chip[data-cond="' + d.id + '"]'), onChange);
      });
      row.appendChild(stop);
    }
    body.appendChild(row);
  }
}
