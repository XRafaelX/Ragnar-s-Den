import { openMonsterPicker, openMonsterDetail } from "./monsters.js";
import { MONSTER_DATA } from "../data/monsters.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { showActionToast } from "../ui/toast.js";
import { playAdd, playDelete, playMonsterHit, playMonsterSlain, playNewRound, playVictory } from "../ui/sound.js";
import { makeKebabSvg } from "../ui/svg-icons.js";
import {
  getEncounters, getEncounter, createEncounter, saveEncounter, deleteEncounter, duplicateEncounter,
  encounterNameProblem, knownPlayerNames, addMonster, getMonster, renameMonster, removeMonster, changeHp,
  isDead, orderEntryFor, unplacedMonsters, addPlayer, hasPlayer, placeMonster, moveInOrder, removeFromOrder,
  currentEntry, nextTurn, previousTurn, resetEncounter, encounterStarted
} from "../core/encounters.js";

/* ---------------- Encounters ----------------
   The DM's combat tracker, built after the paper version: a box per
   monster (AC, speed, hit points and the trail of what they were) and a
   numbered turn line beside them. Monsters come from the Monster Catalog;
   their boxes are dragged into the line between the players, whose names
   are typed in. Encounters are named and saved as they change, so one
   can be set up ahead of the session and Reset to run it again.

   Two views in one full-page overlay: the saved list, and one encounter's
   board. Dragging uses pointer events (not HTML drag and drop) so it
   works with a finger too. */

var overlay = null;
var openId = null;       // the encounter on the board, null = the list
var dragging = null;     // the drag in progress, see startDrag()

function ce(tag, cls, text){
  var el = document.createElement(tag);
  if(cls) el.className = cls;
  if(text !== undefined) el.textContent = text;
  return el;
}

function button(cls, text, onClick, title){
  var b = ce("button", cls, text);
  b.type = "button";
  if(title){ b.title = title; b.setAttribute("aria-label", title); }
  b.addEventListener("click", onClick);
  return b;
}

var GRIP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
var SHIELD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>';

/* A ⋯ button with a small menu: items are [{label, danger, onClick}]. */
function menu(items, title){
  var wrap = ce("div", "enc-menu");
  var btn = button("catalog-row-menu-btn", "", function(e){
    e.stopPropagation();
    var open = dropdown.classList.contains("open");
    closeMenus();
    if(!open) dropdown.classList.add("open");
  }, title || "More options");
  btn.innerHTML = makeKebabSvg();
  var dropdown = ce("div", "catalog-row-dropdown");
  items.forEach(function(it){
    dropdown.appendChild(button("catalog-dropdown-item" + (it.danger ? " danger" : ""), it.label, function(e){
      e.stopPropagation();
      closeMenus();
      it.onClick();
    }));
  });
  wrap.appendChild(btn);
  wrap.appendChild(dropdown);
  return wrap;
}
function closeMenus(){
  if(!overlay) return;
  overlay.querySelectorAll(".catalog-row-dropdown.open").forEach(function(d){ d.classList.remove("open"); });
}

/* ---- Shell ---- */
function ensureOverlay(){
  if(overlay) return;
  overlay = document.getElementById("encounter-overlay");
  overlay.addEventListener("click", closeMenus);
}

export function openEncounters(){
  ensureOverlay();
  openId = null;
  overlay.classList.add("open");
  render();
}

function close(){
  overlay.classList.remove("open");
  overlay.innerHTML = "";
  openId = null;
}

function render(){
  var enc = openId ? getEncounter(openId) : null;
  if(!enc) openId = null;
  var scroller = overlay.querySelector(".enc-scroll");
  var keep = scroller && enc && scroller.dataset.view === enc.id ? scroller.scrollTop : 0;
  overlay.innerHTML = "";
  if(enc) renderBoard(enc); else renderList();
  scroller = overlay.querySelector(".enc-scroll");
  if(scroller) scroller.scrollTop = keep;
}

function header(onBack, backLabel){
  var head = ce("div", "enc-header");
  head.appendChild(button("enc-back", "←", onBack, backLabel));
  overlay.appendChild(head);
  return head;
}

function scrollArea(view){
  var scroller = ce("div", "enc-scroll");
  scroller.dataset.view = view;
  var wrap = ce("div", "enc-wrap");
  scroller.appendChild(wrap);
  overlay.appendChild(scroller);
  return wrap;
}

/* ---- The saved list ---- */
var ICON = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  skull: '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>'
};
function icon(name, cls){
  var span = ce("span", "enc-icon" + (cls ? " " + cls : ""));
  span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>';
  return span;
}
/* The shield in the blue circle, as on the home menu's Encounters. */
function badge(cls){
  var b = ce("span", "enc-badge" + (cls ? " " + cls : ""));
  b.innerHTML = SHIELD_SVG;
  return b;
}

function renderList(){
  var head = header(close, "Back");
  head.appendChild(badge());
  head.appendChild(ce("h2", "enc-title", "Encounters"));
  var wrap = scrollArea("list");
  var all = getEncounters();

  // New encounter
  var panel = ce("section", "enc-create");
  var top = ce("div", "enc-create-top");
  top.appendChild(icon("plus", "enc-create-icon"));
  var words = ce("div", "enc-create-words");
  words.appendChild(ce("h3", "enc-create-title", "New encounter"));
  words.appendChild(ce("p", "enc-create-help", "Add monsters from the catalog, type in your players and drag everyone into turn order. It saves as you go, so you can prepare fights before the session and run them again later."));
  top.appendChild(words);
  panel.appendChild(top);
  var form = ce("form", "enc-new");
  var input = ce("input", "enc-input");
  input.type = "text";
  input.placeholder = "Name it, e.g. Goblin ambush";
  input.setAttribute("aria-label", "New encounter name");
  input.maxLength = 60;
  var create = ce("button", "btn primary", "Create");
  create.type = "submit";
  form.appendChild(input);
  form.appendChild(create);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var problem = encounterNameProblem(input.value, null);
    if(problem){ showActionToast(problem, true); input.focus(); return; }
    var enc = createEncounter(input.value.trim());
    playAdd();
    openId = enc.id;
    render();
  });
  panel.appendChild(form);
  wrap.appendChild(panel);

  if(!all.length){
    var empty = ce("div", "enc-empty enc-empty-list");
    empty.appendChild(badge("big"));
    empty.appendChild(ce("div", "enc-empty-title", "No encounters yet"));
    empty.appendChild(ce("div", "enc-empty-text", "Name your first one above. It will wait here, ready for the table."));
    wrap.appendChild(empty);
    return;
  }

  var label = ce("div", "enc-section-label");
  label.appendChild(ce("span", "", "Your encounters"));
  label.appendChild(ce("span", "enc-count", String(all.length)));
  wrap.appendChild(label);

  var grid = ce("div", "enc-saved-list");
  all.forEach(function(enc){ grid.appendChild(savedCard(enc)); });
  wrap.appendChild(grid);
}

function savedCard(enc){
  var started = encounterStarted(enc);
  var card = ce("div", "enc-saved" + (started ? " live" : ""));
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "Open " + enc.name);

  var top = ce("div", "enc-saved-top");
  top.appendChild(ce("div", "enc-saved-name", enc.name));
  top.appendChild(ce("span", "enc-saved-status" + (started ? " live" : ""), started ? "Round " + enc.round : "Ready"));
  top.appendChild(menu([
    { label: "Duplicate", onClick: function(){
      var copy = duplicateEncounter(enc.id);
      playAdd();
      showActionToast("Made " + copy.name + ".");
      render();
    } },
    { label: "Delete", danger: true, onClick: function(){
      confirmDialog("Delete " + enc.name + "?", "This encounter and its monsters' hit points will be removed. This cannot be undone.", function(){
        deleteEncounter(enc.id);
        playDelete();
        render();
      });
    } }
  ], "Options for " + enc.name));
  card.appendChild(top);

  // What's in it: a chip per kind of monster ("2× Goblin").
  var chips = ce("div", "enc-saved-sub");
  var kinds = monsterKinds(enc);
  if(!kinds.length) chips.appendChild(ce("span", "enc-saved-none", "No monsters yet"));
  kinds.slice(0, 4).forEach(function(k){
    var chip = ce("span", "enc-mchip");
    if(k.count > 1) chip.appendChild(ce("b", "", k.count + "×"));
    chip.appendChild(document.createTextNode(k.name));
    chips.appendChild(chip);
  });
  if(kinds.length > 4) chips.appendChild(ce("span", "enc-mchip more", "+" + (kinds.length - 4) + " more"));
  card.appendChild(chips);

  // In a fight: how much of the monsters' hit points are left.
  if(started && enc.monsters.length){
    var hp = 0, max = 0, standing = 0;
    enc.monsters.forEach(function(m){ hp += m.hp; max += m.maxHp; if(!isDead(m)) standing++; });
    var meter = ce("div", "enc-meter");
    var row = ce("div", "enc-meter-row");
    row.appendChild(ce("span", "", standing + " of " + enc.monsters.length + " monsters standing"));
    row.appendChild(ce("span", "enc-meter-num", hp + " / " + max + " HP"));
    meter.appendChild(row);
    var bar = ce("div", "enc-meter-bar");
    var fill = ce("span", "");
    fill.style.width = Math.round(hp / max * 100) + "%";
    bar.appendChild(fill);
    meter.appendChild(bar);
    card.appendChild(meter);
  }

  var foot = ce("div", "enc-saved-foot");
  var players = enc.order.filter(function(o){ return o.type === "player"; }).length;
  foot.appendChild(stat("skull", enc.monsters.length + (enc.monsters.length === 1 ? " monster" : " monsters")));
  foot.appendChild(stat("users", players + (players === 1 ? " player" : " players")));
  foot.appendChild(stat("clock", timeAgo(enc.updated), "enc-when"));
  foot.appendChild(icon("chevron", "enc-go"));
  card.appendChild(foot);

  function open(){ openId = enc.id; render(); }
  card.addEventListener("click", function(e){ if(!e.target.closest(".enc-menu")) open(); });
  card.addEventListener("keydown", function(e){ if((e.key === "Enter" || e.key === " ") && e.target === card){ e.preventDefault(); open(); } });
  return card;
}

function stat(iconName, text, cls){
  var s = ce("span", "enc-stat" + (cls ? " " + cls : ""));
  s.appendChild(icon(iconName));
  s.appendChild(document.createTextNode(text));
  return s;
}

/* [{name:"Goblin", count:2}, ...] in the order they were added. */
function monsterKinds(enc){
  var byName = {}, kinds = [];
  enc.monsters.forEach(function(m){
    var k = m.kind || m.name;
    if(!byName[k]){ byName[k] = { name: k, count: 0 }; kinds.push(byName[k]); }
    byName[k].count++;
  });
  return kinds;
}

/* "Edited just now", "5 min ago", "3 h ago", "yesterday", "Oct 3". */
function timeAgo(t){
  var mins = Math.floor((Date.now() - t) / 60000);
  if(mins < 1) return "Edited just now";
  if(mins < 60) return "Edited " + mins + " min ago";
  var hours = Math.floor(mins / 60);
  if(hours < 24) return "Edited " + hours + " h ago";
  if(hours < 48) return "Edited yesterday";
  return "Edited " + new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---- One encounter's board ---- */
function commit(enc){
  saveEncounter(enc);
  render();
}

function renderBoard(enc){
  var head = header(function(){ openId = null; render(); }, "Back to encounters");
  var name = ce("input", "enc-name-input");
  name.type = "text";
  name.value = enc.name;
  name.maxLength = 60;
  name.setAttribute("aria-label", "Encounter name");
  name.addEventListener("keydown", function(e){ if(e.key === "Enter") name.blur(); });
  name.addEventListener("change", function(){
    var problem = encounterNameProblem(name.value, enc.id);
    if(problem){ showActionToast(problem, true); name.value = enc.name; return; }
    enc.name = name.value.trim();
    saveEncounter(enc);
  });
  head.appendChild(name);
  head.appendChild(button("btn small ghost enc-reset", "Reset", function(){
    confirmDialog("Reset " + enc.name + "?", "Every monster goes back to full hit points and the fight starts again from round 1. The monsters, players and turn order stay.", function(){
      resetEncounter(enc);
      commit(enc);
      showActionToast(enc.name + " is ready to run again.");
    });
  }, "Reset the fight to run it again"));

  var wrap = scrollArea(enc.id);
  var board = ce("div", "enc-board");
  board.appendChild(monstersPanel(enc));
  board.appendChild(turnsPanel(enc));
  wrap.appendChild(board);
}

/* ---- Monster boxes ---- */
function monstersPanel(enc){
  var panel = ce("section", "enc-monsters");
  var head = ce("div", "enc-panel-head");
  head.appendChild(ce("h3", "enc-panel-title", "Monsters"));
  head.appendChild(button("btn small enc-add-monster", "+ Add monster", function(){
    openMonsterPicker(function(kind, data){
      addMonster(enc, kind, data);
      saveEncounter(enc);
    }, function(){ render(); });
  }));
  panel.appendChild(head);

  if(!enc.monsters.length){
    panel.appendChild(ce("div", "enc-empty", "No monsters yet. Add them from the catalog, then drag their boxes into the turn order."));
    return panel;
  }
  var grid = ce("div", "enc-cards");
  var cur = currentEntry(enc);
  enc.monsters.forEach(function(m){ grid.appendChild(monsterCard(enc, m, cur)); });
  panel.appendChild(grid);
  return panel;
}

function monsterCard(enc, m, cur){
  var entry = orderEntryFor(enc, m.id);
  var dead = isDead(m);
  var card = ce("article", "enc-card" + (dead ? " dead" : "") + (entry ? "" : " unplaced") +
    (cur && entry && cur.id === entry.id ? " active" : ""));
  card.dataset.monsterId = m.id;
  card.dataset.name = m.name;

  var top = ce("div", "enc-card-top");
  var grip = ce("span", "enc-grip");
  grip.innerHTML = GRIP_SVG;
  grip.title = "Drag into the turn order";
  top.appendChild(grip);

  var ac = ce("span", "enc-ac");
  ac.title = "Armor Class " + m.ac;
  ac.innerHTML = SHIELD_SVG;
  ac.appendChild(ce("span", "enc-ac-num", String(m.ac)));
  top.appendChild(ac);

  // The name wraps instead of being cut off; tapping it edits it in place.
  var names = ce("div", "enc-card-names");
  var nameBtn = button("enc-card-name", m.name, function(){ editName(); }, null);
  nameBtn.title = "Rename";
  nameBtn.setAttribute("aria-label", "Rename " + m.name);
  names.appendChild(nameBtn);
  if(showKind(m)) names.appendChild(ce("div", "enc-card-kind", m.kind));
  top.appendChild(names);
  function editName(){
    var input = ce("input", "enc-input enc-card-name-input");
    input.type = "text";
    input.value = m.name;
    input.maxLength = 40;
    input.setAttribute("aria-label", "Name of " + m.name);
    var done = false;
    function finish(keep){
      if(done) return;
      done = true;
      var n = input.value.trim();
      if(keep && n && n !== m.name){ renameMonster(enc, m.id, n); commit(enc); }
      else render();
    }
    input.addEventListener("keydown", function(e){
      if(e.key === "Enter"){ e.preventDefault(); finish(true); }
      else if(e.key === "Escape"){ e.preventDefault(); finish(false); }
    });
    input.addEventListener("blur", function(){ finish(true); });
    names.replaceChild(input, nameBtn);
    input.focus();
    input.select();
  }

  top.appendChild(menu([
    { label: "Stat block", onClick: function(){ showStatBlock(m); } },
    { label: "Rename", onClick: editName },
    entry
      ? { label: "Take out of turn order", onClick: function(){ removeFromOrder(enc, entry.id); commit(enc); } }
      : { label: "Add to turn order", onClick: function(){ placeMonster(enc, m.id); playAdd(); commit(enc); } },
    { label: "Remove from encounter", danger: true, onClick: function(){
      removeMonster(enc, m.id);
      playDelete();
      commit(enc);
    } }
  ], "Options for " + m.name));
  card.appendChild(top);

  var hp = ce("div", "enc-hp");
  var now = ce("div", "enc-hp-now");
  now.appendChild(ce("span", "enc-hp-cur", String(m.hp)));
  now.appendChild(ce("span", "enc-hp-max", "/ " + m.maxHp + " HP"));
  if(dead) now.appendChild(ce("span", "enc-dead-tag", "Down"));
  var speed = ce("span", "enc-speed", m.speed + " ft");
  speed.title = "Speed " + m.speed + " ft";
  now.appendChild(speed);
  hp.appendChild(now);
  // The trail, like the paper: every value the monster went through.
  if(m.log.length > 1){
    var trail = ce("div", "enc-hp-trail");
    trail.setAttribute("aria-label", "Hit point history");
    m.log.slice(-8).forEach(function(v, i, arr){
      trail.appendChild(ce("span", i === arr.length - 1 ? "enc-hp-step last" : "enc-hp-step", String(v)));
    });
    hp.appendChild(trail);
  }
  card.appendChild(hp);

  var ctrl = ce("form", "enc-hp-ctrl");
  var amount = ce("input", "enc-input enc-amount");
  amount.type = "number";
  amount.min = "0";
  amount.inputMode = "numeric";
  amount.placeholder = "Amount";
  amount.setAttribute("aria-label", "Damage or healing for " + m.name);
  function apply(sign){
    var n = parseInt(amount.value, 10);
    if(!(n > 0)){ amount.focus(); return; }
    if(sign < 0 && isDead(m)){
      amount.value = "";
      showActionToast(deadJoke(m));
      return;
    }
    var before = m.hp;
    changeHp(enc, m.id, sign * n);
    commit(enc);
    if(m.hp >= before) return;
    if(isDead(m)){
      // The last one standing going down ends the fight.
      var allDown = enc.monsters.every(isDead);
      if(allDown) playVictory(); else playMonsterSlain();
      showActionToast(allDown ? "Victory! Every monster is down." : m.name + " is down.");
    }else playMonsterHit(before - m.hp >= m.maxHp / 4);
  }
  var dmg = ce("button", "btn small danger", "Damage");
  dmg.type = "submit";
  ctrl.appendChild(amount);
  ctrl.appendChild(dmg);
  ctrl.appendChild(button("btn small quick-heal-btn", "Heal", function(){ apply(1); }));
  // Enter in the box is damage, by far the more common.
  ctrl.addEventListener("submit", function(e){ e.preventDefault(); apply(-1); });
  card.appendChild(ctrl);

  if(!entry){
    var foot = ce("div", "enc-card-foot");
    foot.appendChild(ce("span", "enc-card-hint", "Not in the turn order yet. Drag this box there, or"));
    foot.appendChild(button("enc-link", "add it at the end", function(){ placeMonster(enc, m.id); playAdd(); commit(enc); }));
    card.appendChild(foot);
  }

  dragSource(card, grip, function(){
    return { label: m.name, entryId: entry ? entry.id : null,
      drop: function(index){ placeMonster(enc, m.id, index); if(!entry) playAdd(); commit(enc); } };
  });
  return card;
}

/* Damage on a monster that's already down: nothing happens, and the DM
   gets a joke instead. Never the same one twice in a row. */
var DEAD_JOKES = [
  "{name} is already dead. Let it rest in pieces.",
  "{name} can't get any deader than this.",
  "That's beating a dead {kind}.",
  "Overkill noted. {name} was already dead.",
  "You hit the corpse of {name}. The corpse doesn't mind.",
  "{name} has left the fight. Spiritually and physically.",
  "The bard is writing a song about how you kept hitting {name} after it died.",
  "{name} is dead, Panai.",
  "Even the necromancer says {name} has had enough.",
  "{name} files a complaint from the afterlife."
];
var lastJoke = -1;
function deadJoke(m){
  var count = DEAD_JOKES.length;
  // Pick among the others, then step over the last one shown.
  var i = Math.floor(Math.random() * (lastJoke === -1 ? count : count - 1));
  if(lastJoke !== -1 && i >= lastJoke) i++;
  lastJoke = i;
  var kind = (m.kind || m.name).replace(/\s*\(.*\)$/, "").toLowerCase();
  return DEAD_JOKES[i].replace("{name}", m.name).replace("{kind}", kind);
}

/* What the monster is, under a name the DM gave it. Not for the catalog
   name or its numbered copies ("Wolf 2" needs no "Wolf" under it). */
function showKind(m){
  if(!m.kind) return false;
  var name = m.name.toLowerCase(), kind = m.kind.toLowerCase();
  return name !== kind && !(name.indexOf(kind + " ") === 0 && /^\d+$/.test(name.slice(kind.length + 1)));
}

function showStatBlock(m){
  var d = MONSTER_DATA[m.kind];
  // A homebrew monster deleted since it was added: what the box still knows.
  if(!d) d = { size: "", type: "", cr: "?", alignment: "", hp: m.maxHp, ac: m.ac, speed: m.speed,
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, notes: "This monster is no longer in the catalog, so only what the encounter kept is shown." };
  openMonsterDetail(m.kind || m.name, d, true);
}

/* ---- The turn line ---- */
function turnsPanel(enc){
  var panel = ce("aside", "enc-turns");
  var head = ce("div", "enc-panel-head");
  head.appendChild(ce("h3", "enc-panel-title", "Turn order"));
  head.appendChild(ce("span", "enc-round", "Round " + enc.round));
  panel.appendChild(head);

  var cur = currentEntry(enc);
  if(enc.order.length){
    var ctrls = ce("div", "enc-turn-ctrls");
    ctrls.appendChild(button("btn small ghost", "‹ Back", function(){ previousTurn(enc); commit(enc); }, "Back one turn"));
    ctrls.appendChild(button("btn primary enc-next", "Next turn ›", function(){
      var round = enc.round;
      nextTurn(enc);
      commit(enc);
      if(enc.round > round) playNewRound();
    }));
    panel.appendChild(ctrls);
  }

  var listEl = ce("ol", "enc-turn-list" + (enc.order.length ? "" : " empty"));
  listEl.dataset.empty = "Drag monster boxes here and add your players below. The top of the line goes first.";
  enc.order.forEach(function(o, i){
    var m = o.type === "monster" ? getMonster(enc, o.monsterId) : null;
    var dead = m && isDead(m);
    var li = ce("li", "enc-turn " + o.type + (dead ? " dead" : "") + (cur && cur.id === o.id ? " current" : ""));
    li.dataset.entryId = o.id;
    var grip = ce("span", "enc-grip");
    grip.innerHTML = GRIP_SVG;
    grip.title = "Drag to change the order";
    li.appendChild(grip);
    li.appendChild(ce("span", "enc-turn-num", (i + 1) + ")"));
    var label = o.type === "player" ? o.name : m.name;
    li.appendChild(ce("span", "enc-turn-name", label));
    li.appendChild(o.type === "player"
      ? ce("span", "enc-turn-tag", "Player")
      : ce("span", "enc-turn-hp" + (dead ? " down" : ""), m.hp + "/" + m.maxHp));
    li.appendChild(button("enc-turn-x", "×", function(e){
      e.stopPropagation();
      removeFromOrder(enc, o.id);
      if(o.type === "player") playDelete();
      commit(enc);
    }, o.type === "player" ? "Remove " + o.name : "Take " + label + " out of the turn order"));
    // Tapping a monster's line finds its box (handy on a phone, where
    // the boxes are below the line).
    if(m) li.addEventListener("click", function(e){
      if(e.target.closest("button")) return;
      var card = overlay.querySelector('.enc-card[data-monster-id="' + m.id + '"]');
      if(!card) return;
      card.scrollIntoView({ block: "center", behavior: "smooth" });
      card.classList.remove("flash");
      void card.offsetWidth;
      card.classList.add("flash");
    });
    dragSource(li, grip, function(){
      return { label: label, entryId: o.id, drop: function(index){ moveInOrder(enc, o.id, index); commit(enc); } };
    });
    listEl.appendChild(li);
  });
  panel.appendChild(listEl);

  var waiting = unplacedMonsters(enc).length;
  if(waiting) panel.appendChild(ce("p", "enc-turn-note", waiting === 1 ? "1 monster is not in the turn order yet." : waiting + " monsters are not in the turn order yet."));

  panel.appendChild(playerForm(enc));
  return panel;
}

function playerForm(enc){
  var box = ce("div", "enc-players");
  var form = ce("form", "enc-new");
  var input = ce("input", "enc-input");
  input.type = "text";
  input.placeholder = "Player name";
  input.maxLength = 40;
  input.setAttribute("aria-label", "Player name");
  var add = ce("button", "btn small", "Add player");
  add.type = "submit";
  form.appendChild(input);
  form.appendChild(add);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var n = input.value.trim();
    if(!n){ input.focus(); return; }
    if(hasPlayer(enc, n)){ showActionToast(n + " is already in the turn order.", true); return; }
    addPlayer(enc, n);
    playAdd();
    commit(enc);
    var again = overlay.querySelector(".enc-players .enc-input");
    if(again) again.focus();
  });
  box.appendChild(form);

  // The party from other encounters, a tap away.
  var known = knownPlayerNames().filter(function(n){ return !hasPlayer(enc, n); });
  if(known.length){
    var chips = ce("div", "enc-chips");
    chips.appendChild(ce("span", "enc-chips-label", "From other encounters:"));
    known.slice(0, 12).forEach(function(n){
      chips.appendChild(button("enc-chip", "+ " + n, function(){ addPlayer(enc, n); playAdd(); commit(enc); }, "Add " + n));
    });
    box.appendChild(chips);
  }
  return box;
}

/* ---- Dragging into the turn line ----
   `el` is what moves: a monster box or a line of the turn order. A finger
   drags by the grip (so the boxes still scroll), a mouse from anywhere
   that isn't a field or button. While dragging, a marker shows where it
   will land; letting go over the line calls drop(index), the place among
   the line's other entries. */
function dragSource(el, grip, describe){
  el.addEventListener("pointerdown", function(e){
    if(e.button !== 0 || dragging) return;
    var onGrip = grip.contains(e.target);
    if(!onGrip && (e.pointerType !== "mouse" || e.target.closest("input, button, textarea, .enc-menu"))) return;
    if(onGrip) e.preventDefault();
    startDrag(e, el, describe());
  });
}

function startDrag(e, el, info){
  dragging = { x: e.clientX, y: e.clientY, pointerId: e.pointerId, el: el, info: info, active: false,
    ghost: null, marker: null, index: null, raf: 0 };

  function onMove(ev){
    if(!dragging || ev.pointerId !== dragging.pointerId) return;
    dragging.x = ev.clientX;
    dragging.y = ev.clientY;
    if(!dragging.active){
      if(Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 6) return;
      activate();
    }
    ev.preventDefault();
    track();
  }
  function onUp(ev){
    if(!dragging || ev.pointerId !== dragging.pointerId) return;
    var d = dragging;
    finish();
    if(d.active && ev.type === "pointerup" && d.index !== null) d.info.drop(d.index);
  }
  function activate(){
    dragging.active = true;
    var ghost = ce("div", "enc-drag-ghost", info.label);
    document.body.appendChild(ghost);
    dragging.ghost = ghost;
    dragging.marker = ce("li", "enc-drop-marker");
    el.classList.add("enc-drag-source");
    overlay.classList.add("enc-dragging");
    window.getSelection && window.getSelection().removeAllRanges();
    autoScroll();
  }
  function finish(){
    var d = dragging;
    dragging = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    if(!d.active) return;
    cancelAnimationFrame(d.raf);
    d.ghost.remove();
    d.marker.remove();
    el.classList.remove("enc-drag-source");
    overlay.classList.remove("enc-dragging");
    var listEl = overlay.querySelector(".enc-turn-list");
    if(listEl) listEl.classList.remove("drop-here");
  }
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

/* Moves the ghost and works out where in the line it would land. */
function track(){
  var d = dragging;
  d.ghost.style.transform = "translate(" + (d.x + 14) + "px," + (d.y + 10) + "px)";
  var listEl = overlay.querySelector(".enc-turn-list");
  if(!listEl) return;
  var r = listEl.getBoundingClientRect();
  var slack = 36;
  var over = d.x >= r.left - slack && d.x <= r.right + slack && d.y >= r.top - slack && d.y <= r.bottom + slack;
  listEl.classList.toggle("drop-here", over);
  if(!over){
    d.marker.remove();
    d.index = null;
    return;
  }
  var items = Array.prototype.filter.call(listEl.querySelectorAll(".enc-turn"), function(li){
    return li.dataset.entryId !== d.info.entryId;
  });
  var index = 0;
  items.forEach(function(li){
    var b = li.getBoundingClientRect();
    if(d.y > b.top + b.height / 2) index++;
  });
  d.index = index;
  // The marker is laid over the gap rather than put in the line, so the
  // lines don't shift under the pointer as it moves.
  var top = 0;
  if(items[index]) top = items[index].offsetTop - 4;
  else if(items.length){ var last = items[items.length - 1]; top = last.offsetTop + last.offsetHeight; }
  d.marker.style.top = top + "px";
  if(d.marker.parentNode !== listEl) listEl.appendChild(d.marker);
}

/* Near the top or bottom edge the page scrolls, so a box can be carried
   to a line that's off screen (on a phone the line is above the boxes). */
function autoScroll(){
  var d = dragging;
  if(!d || !d.active) return;
  var scroller = overlay.querySelector(".enc-scroll");
  if(scroller){
    var r = scroller.getBoundingClientRect();
    var edge = 70, step = 0;
    if(d.y < r.top + edge) step = -Math.ceil((r.top + edge - d.y) / 5);
    else if(d.y > r.bottom - edge) step = Math.ceil((d.y - (r.bottom - edge)) / 5);
    if(step){
      scroller.scrollTop += step;
      track();
    }
  }
  d.raf = requestAnimationFrame(autoScroll);
}
