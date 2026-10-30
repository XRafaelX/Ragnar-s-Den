import { save } from "../../core/state.js";
import { maxHp, activeConditions, exhaustionLevel, exhaustionSummary, addCondition, removeCondition, conditionDef, raceConditionImmunity, rageSuspends, classLevelOf } from "../../core/helpers.js";
import { CONDITIONS, EXHAUSTION_LEVELS, EXHAUSTION_RULES } from "../../data/conditions.js";
import { makeCard, renderAll } from "../sheet.js";
import { renderSidebar } from "../sidebar.js";
import { makeConditionSvg, makeInfoSvg } from "../../ui/svg-icons.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { logRoll } from "../../dice/dice.js";
import { conditionTakesHold, conditionEnds, exhaustionChanged } from "../../ui/fx.js";
import { playConditionOn, playConditionOff, playExhaustion, playDeath } from "../../ui/sound.js";

/* ---------------- Conditions ----------------
   Kept out of the way until needed: a Conditions button in the Hit
   points & defense card's header opens one sheet with the exhaustion
   track (six segments, tap one to set the level) and every condition as
   a tile. While any is on, a row of chips sits in the HP card, so what's
   on stays in view; a chip opens the book's text and what the sheet does
   about it. The effects themselves show where they apply
   (js/core/conditions.js): Dis tags on rolls, speed 0, a halved HP
   maximum, STR and DEX saves that fail. */

/* The header button, with a count when something is on. */
export function renderConditionsButton(c){
  var on = activeConditions(c).length + (exhaustionLevel(c) ? 1 : 0);
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cond-open" + (on ? " on" : "");
  btn.innerHTML = '<span class="cond-icon">' + makeConditionSvg("conditions") + '</span><span class="cond-open-lbl">Conditions</span>';
  if(on){
    var n = document.createElement("span");
    n.className = "cond-count";
    n.textContent = on;
    btn.appendChild(n);
  }
  btn.setAttribute("aria-label", "Conditions and exhaustion" + (on ? " (" + on + " on)" : ""));
  btn.addEventListener("click", function(){ openConditionsSheet(c); });
  return btn;
}

/* The chips for what's on (exhaustion first), or null when nothing is. */
export function renderConditionsStrip(c){
  var list = activeConditions(c);
  var level = exhaustionLevel(c);
  if(!list.length && !level) return null;
  var strip = document.createElement("div");
  strip.className = "cond-chips cond-strip";
  if(level){
    var ex = document.createElement("div");
    ex.className = "cond-chip cond-exhaustion" + (level >= 6 ? " dead" : "");
    ex.dataset.cond = "exhaustion";
    ex.style.setProperty("--hue", EX_COLORS[level - 1]);
    var open = document.createElement("button");
    open.type = "button";
    open.className = "cond-chip-main";
    open.innerHTML = '<span class="cond-icon">' + makeConditionSvg("exhaustion") + '</span>';
    var name = document.createElement("span");
    name.className = "cond-name";
    name.textContent = "Exhaustion " + level;
    open.appendChild(name);
    open.title = exhaustionSummary(level);
    open.setAttribute("aria-label", "Exhaustion level " + level + ": " + exhaustionSummary(level));
    open.addEventListener("click", function(){ openConditionsSheet(c); });
    ex.appendChild(open);
    strip.appendChild(ex);
  }
  list.forEach(function(x){ strip.appendChild(conditionChip(c, x)); });
  // Stillness of Mind (monk 7): an action ends one charmed or frightened effect.
  if(classLevelOf(c, "Monk") >= 7) list.forEach(function(x){
    if(x.def.id!=="charmed" && x.def.id!=="frightened") return;
    var calm = document.createElement("button");
    calm.type = "button";
    calm.className = "btn small cond-stillness";
    calm.textContent = "Stillness of Mind: end " + x.def.name;
    calm.title = "An action: end one effect that's making you " + x.def.name.toLowerCase();
    calm.addEventListener("click", function(){
      removeCondition(c, x.def.id);
      logRoll("Stillness of Mind", x.def.name + " ended.");
      save(); renderAll();
    });
    strip.appendChild(calm);
  });
  return strip;
}

/* For the long rest's confirm dialog: the conditions on now (the ones
   stored; Unconscious from 0 HP ends with the healing anyway), with "End
   these too" ticked, since most effects have run out after 8 hours.
   {el, apply} where apply() ends them if still ticked and returns their
   names, or null with nothing on. */
export function longRestConditionsChoice(c){
  var list = activeConditions(c).filter(function(x){ return !x.auto; });
  if(!list.length) return null;
  var el = document.createElement("label");
  el.className = "cond-rest-choice";
  var cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "chk";
  cb.checked = true;
  el.appendChild(cb);
  var text = document.createElement("span");
  text.className = "cond-rest-text";
  var lead = document.createElement("b");
  lead.textContent = "End these too";
  text.appendChild(lead);
  var chips = document.createElement("span");
  chips.className = "cond-rest-chips";
  list.forEach(function(x){
    var chip = document.createElement("span");
    chip.className = "cond-rest-chip";
    chip.style.setProperty("--hue", x.def.hue);
    chip.innerHTML = '<span class="cond-icon">' + makeConditionSvg(x.def.id) + '</span><span class="cond-name"></span>';
    chip.lastChild.textContent = x.def.name;
    chips.appendChild(chip);
  });
  text.appendChild(chips);
  var hint = document.createElement("small");
  hint.textContent = "Untick to keep them, as with a curse.";
  text.appendChild(hint);
  el.appendChild(text);
  return {el: el, apply: function(){
    if(!cb.checked) return [];
    list.forEach(function(x){ removeCondition(c, x.def.id); });
    return list.map(function(x){ return x.def.name; });
  }};
}

/* ---- Exhaustion ---- */
var EX_COLORS = ["#f59e0b", "#f97316", "#ef4444", "#dc2626", "#9f1239", "#4c0519"];

/* Whether the exhaustion rules are folded open in the sheet. */
var exRulesOpen = false;

/* The track inside the Conditions sheet; `sheet` is the bottom sheet's
   {refresh, close}, so a level change redraws it in place. */
function exhaustionTrack(c, sheet){
  var level = exhaustionLevel(c);
  var wrap = document.createElement("div");
  wrap.className = "cond-ex" + (level ? " on" : "") + (level >= 6 ? " dead" : "");

  var head = document.createElement("button");
  head.type = "button";
  head.className = "cond-ex-head";
  head.innerHTML = '<span class="cond-icon">' + makeConditionSvg("exhaustion") + '</span><span class="cond-ex-lbl">Exhaustion</span>';
  var val = document.createElement("span");
  val.className = "cond-ex-val";
  val.textContent = level ? "Level " + level : "None";
  head.appendChild(val);
  var info = document.createElement("span");
  info.className = "cond-info";
  info.innerHTML = makeInfoSvg();
  head.appendChild(info);
  head.setAttribute("aria-expanded", exRulesOpen ? "true" : "false");
  head.setAttribute("aria-label", "Exhaustion: " + (level ? "level " + level : "none") + ". Show the rules");
  wrap.appendChild(head);

  var track = document.createElement("div");
  track.className = "cond-ex-track";
  track.setAttribute("role", "group");
  track.setAttribute("aria-label", "Exhaustion level");
  EXHAUSTION_LEVELS.forEach(function(l, i){
    var seg = document.createElement("button");
    seg.type = "button";
    seg.className = "cond-ex-seg" + (i < level ? " filled" : "");
    seg.style.setProperty("--seg", EX_COLORS[i]);
    seg.textContent = l.level;
    seg.title = "Level " + l.level + ": " + l.effect;
    seg.setAttribute("aria-label", "Level " + l.level + ": " + l.effect);
    seg.setAttribute("aria-pressed", i < level ? "true" : "false");
    // Tapping the top filled segment takes a level off; any other sets it.
    seg.addEventListener("click", function(){ setExhaustion(c, level === l.level ? l.level - 1 : l.level, sheet); });
    track.appendChild(seg);
  });
  wrap.appendChild(track);

  if(level){
    var now = document.createElement("div");
    now.className = "cond-ex-now";
    now.textContent = exhaustionSummary(level);
    wrap.appendChild(now);
  }

  // The six levels and the book's rules, folded under the track.
  var more = document.createElement("div");
  more.className = "cond-ex-more" + (exRulesOpen ? " open" : "");
  var inner = document.createElement("div");
  inner.className = "cond-ex-more-inner";
  var table = document.createElement("div");
  table.className = "cond-ex-table";
  EXHAUSTION_LEVELS.forEach(function(l, i){
    var row = document.createElement("div");
    row.className = "cond-ex-row" + (l.level <= level ? " on" : "");
    row.style.setProperty("--seg", EX_COLORS[i]);
    row.innerHTML = '<b>' + l.level + '</b><span></span>';
    row.lastChild.textContent = l.effect;
    table.appendChild(row);
  });
  inner.appendChild(table);
  inner.appendChild(rulesList(EXHAUSTION_RULES));
  more.appendChild(inner);
  wrap.appendChild(more);
  head.addEventListener("click", function(){
    exRulesOpen = !exRulesOpen;
    more.classList.toggle("open", exRulesOpen);
    head.setAttribute("aria-expanded", exRulesOpen ? "true" : "false");
  });
  return wrap;
}

function setExhaustion(c, next, sheet){
  var before = exhaustionLevel(c);
  if(next === before) return;
  if(next >= 6){
    sheet.close();
    confirmDialog("Exhaustion level 6?", "Level 6 exhaustion is death: " + (c.name || "the character") + " drops to 0 HP with three failed death saves.", function(){
      c.exhaustion = 6;
      c.hp.current = 0;
      c.deathSaves = {success: 0, fail: 3};
      logRoll("Exhaustion", "Level 6: " + (c.name || "the character") + " has died.");
      save(); renderSidebar(); renderAll();
      playDeath();
    });
    return;
  }
  c.exhaustion = next;
  // Level 4 halves the maximum: hit points above it are lost.
  if(next >= 4) c.hp.current = Math.min(Number(c.hp.current)||0, maxHp(c));
  logRoll("Exhaustion", next ? "Level " + next + ": " + exhaustionSummary(next) + "." : "No more exhaustion.");
  save(); renderSidebar(); renderAll(); sheet.refresh();
  // The segment that changed, animated on the redrawn track.
  var track = document.querySelector("#bottom-sheet .cond-ex-track");
  var up = next > before;
  if(track) exhaustionChanged(track, track.children[(up ? next : before) - 1], up);
  playExhaustion(Math.max(next, before), up);
}

/* ---- Condition chips ---- */
function conditionChip(c, x){
  var d = x.def;
  var chip = document.createElement("div");
  chip.className = "cond-chip cond-" + d.id + (x.auto ? " auto" : "");
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
  if(x.auto){
    var why = document.createElement("span");
    why.className = "cond-why";
    why.textContent = "0 HP";
    open.appendChild(why);
  }
  open.title = d.short;
  open.setAttribute("aria-label", d.name + (x.auto ? " (at 0 HP)" : "") + ". Show the rules");
  open.addEventListener("click", function(){ openConditionSheet(c, x); });
  chip.appendChild(open);

  if(!x.auto){
    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "cond-chip-x";
    rm.textContent = "✕";
    rm.title = d.id === "prone" ? "Stand up" : "End " + d.name;
    rm.setAttribute("aria-label", rm.title);
    rm.addEventListener("click", function(){ endCondition(c, d.id, chip); });
    chip.appendChild(rm);
  }
  return chip;
}

function startCondition(c, id){
  var added = addCondition(c, id);
  if(!added.length) return;
  var def = conditionDef(id);
  logRoll(def.name, added.length > 1 ? "And falls prone." : def.short);
  save(); renderAll();
  // The new chips, staggered when Unconscious brings Prone with it.
  added.forEach(function(a, i){
    setTimeout(function(){
      conditionTakesHold(document.querySelector('.panel.active .cond-chip[data-cond="' + a + '"]'), a, conditionDef(a).hue);
    }, i * 220);
  });
  playConditionOn(id);
}

function endCondition(c, id, chip){
  conditionEnds(chip, function(){
    removeCondition(c, id);
    logRoll(conditionDef(id).name, id === "prone" ? "Stood up." : "Ended.");
    save(); renderAll();
  });
  playConditionOff();
}

/* What the sheet does about a condition, in a line. */
function appliedText(d){
  var out = [];
  if(d.attack) out.push("your attacks roll with " + (d.attack === "adv" ? "advantage" : "disadvantage"));
  if(d.checks) out.push("ability checks (skills, initiative) with disadvantage");
  if(d.saves && d.saves.dex) out.push("DEX saves with disadvantage");
  if(d.autoFail) out.push("STR and DEX saves fail");
  if(d.noMove) out.push("speed 0");
  if(d.resistAll) out.push("resistance to all damage");
  if(!out.length) return "";
  var text = out.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

function openConditionSheet(c, x){
  var d = x.def;
  openBottomSheet(function(body, refresh, close){
    body.appendChild(sheetHeader(makeConditionSvg(d.id), d.name, d.hue, close));
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = x.auto ? "At 0 hit points. Healing wakes you up." : "Condition";
    body.appendChild(sub);
    body.appendChild(rulesList(d.rules));
    var applied = appliedText(d);
    if(applied){
      var on = document.createElement("p");
      on.className = "cond-applied";
      on.innerHTML = "<b>On your sheet:</b> ";
      on.appendChild(document.createTextNode(applied));
      body.appendChild(on);
    }
    if(!x.auto){
      var row = document.createElement("div");
      row.className = "cond-sheet-actions";
      var end = document.createElement("button");
      end.type = "button";
      end.className = "btn small primary";
      end.textContent = d.id === "prone" ? "Stand up" : "End " + d.name;
      end.addEventListener("click", function(){
        close();
        endCondition(c, d.id, document.querySelector('.panel.active .cond-chip[data-cond="' + d.id + '"]'));
      });
      row.appendChild(end);
      body.appendChild(row);
    }
  });
}

/* The Conditions sheet: exhaustion, then every condition as a tile.
   Tapping one that's off puts it on (the sheet closes so its arrival is
   seen on the HP card); one that's on ends it. */
function openConditionsSheet(c){
  openBottomSheet(function(body, refresh, close){
    var header = document.createElement("div");
    header.className = "bs-header";
    var title = document.createElement("div");
    title.className = "bs-title";
    title.textContent = "Conditions";
    header.appendChild(title);
    header.appendChild(closeButton(close));
    body.appendChild(header);
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = "What they change shows on your sheet by itself.";
    body.appendChild(sub);

    body.appendChild(exhaustionTrack(c, {refresh: refresh, close: close}));

    var on = activeConditions(c);
    var grid = document.createElement("div");
    grid.className = "cond-grid";
    CONDITIONS.forEach(function(d){
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
      // A race immune to it (a yuan-ti's Poison Immunity) can't have it put on.
      var immune = !cur && raceConditionImmunity(c, d.id);
      // Mindless Rage: charmed and frightened wait until the rage ends.
      var suspended = !cur && rageSuspends(c, d.id);
      text.lastChild.textContent = cur && cur.auto ? "From 0 HP. Heal to wake up." : immune ? "Immune (" + immune + ")" : suspended ? "Suspended while raging (" + suspended + ")" : d.short;
      tile.appendChild(text);
      tile.setAttribute("aria-pressed", cur ? "true" : "false");
      if((cur && cur.auto) || immune || suspended) tile.disabled = true;
      tile.addEventListener("click", function(){
        if(cur){
          removeCondition(c, d.id);
          logRoll(d.name, d.id === "prone" ? "Stood up." : "Ended.");
          save(); renderAll(); refresh();
          playConditionOff();
          return;
        }
        close();
        startCondition(c, d.id);
      });
      grid.appendChild(tile);
    });
    body.appendChild(grid);
  });
}

/* ---- Sheet parts ---- */
export function closeButton(close){
  var b = document.createElement("button");
  b.className = "bs-close"; b.textContent = "✕"; b.title = "Close";
  b.setAttribute("aria-label", "Close");
  b.addEventListener("click", close);
  return b;
}
export function sheetHeader(icon, name, hue, close){
  var header = document.createElement("div");
  header.className = "bs-header cond-sheet-head";
  header.style.setProperty("--hue", hue);
  var title = document.createElement("div");
  title.className = "bs-title";
  title.innerHTML = '<span class="cond-icon">' + icon + '</span><span class="cond-sheet-name"></span>';
  title.lastChild.textContent = name;
  header.appendChild(title);
  header.appendChild(closeButton(close));
  return header;
}
export function rulesList(rules){
  var ul = document.createElement("ul");
  ul.className = "cond-rules";
  rules.forEach(function(r){
    var li = document.createElement("li");
    li.textContent = r;
    ul.appendChild(li);
  });
  return ul;
}
