import { save } from "../../core/state.js";
import { fmtMod, mod, ce, parseDiceNotation } from "../../core/helpers.js";
import { characterCompanions, setCompanionHp, setCompanionChoice, setCompanionBeast } from "../../core/companions.js";
import { BEAST_PRESETS } from "../../data/companions.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { openInfoModal } from "../../ui/info-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";
import { makeDiceSvg, makeStatArrowSvg, makeChevronRightSvg } from "../../ui/svg-icons.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";

/* ---- Companion cards (Companions tab) ----
   One stat card per companion (js/data/companions.js): its choice (a
   drake's essence), then a vitals row (AC, an HP tracker per copy, e.g.
   two cannons, speed), then two columns on a wide card: ability scores
   and facts beside attacks, actions and reactions with roll buttons;
   traits (and a mount's riding rules) run full width under them as tiles
   that open their whole text. A Beast Master's card starts with a form
   for the beast's own stat block. */
var ABILITY_KEYS = ["str","dex","con","int","wis","cha"];

function rollButton(text, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn";
  b.innerHTML = makeDiceSvg();
  if(typeof text==="string") b.appendChild(document.createTextNode(text));
  else b.appendChild(text);
  b.addEventListener("click", onClick);
  return b;
}
function diceText(dice, bonus){ return dice + (bonus ? fmtMod(bonus) : ""); }
function rollDice(dice, bonus, label){
  var d = parseDiceNotation(dice);
  if(d) performRoll(d.die, d.qty, bonus||0, "none", label);
}

/* One HP tracker, laid out like the Vitals HP box: current / max over
   a fill that shrinks with HP, then damage 1, Full, heal 1. */
function hpTracker(c, comp, i){
  var max = comp.stats.hp, cur = comp.hp[i];
  var pct = max ? Math.round(Math.max(0, Math.min(1, cur / max)) * 1000) / 10 : 0;
  var row = ce("div", "comp-hp" + (pct <= 30 && cur > 0 ? " hp-low" : ""));
  row.style.setProperty("--hp-pct", pct + "%");
  var value = ce("div", "hp-hero-display comp-hp-value");
  if(comp.stats.count > 1){
    var label = ce("span", "comp-hp-label");
    label.textContent = "#" + (i + 1);
    value.appendChild(label);
  }
  value.insertAdjacentHTML("beforeend", "<span class='hp-cur-num'></span><span class='hp-slash'>/</span><span class='hp-max-num'></span>");
  value.querySelector(".hp-cur-num").textContent = cur;
  value.querySelector(".hp-max-num").textContent = max;
  if(cur === 0) value.querySelector(".hp-cur-num").classList.add("down");
  row.appendChild(value);

  function set(to, flash){
    setCompanionHp(c, comp.def.id, i, to, max); save(); renderAll();
    requestAnimationFrame(function(){
      var el = document.querySelectorAll(".comp-card[data-comp='" + comp.def.id + "'] .comp-hp .hp-cur-num")[i];
      if(el) el.classList.add(flash);
    });
  }
  var btns = ce("div", "hp-actions-row");
  var dmg = document.createElement("button");
  dmg.type = "button"; dmg.className = "stat-arrow-btn stat-arrow-down";
  dmg.title = "Take 1 damage";
  dmg.setAttribute("aria-label", "Damage " + comp.def.name + " 1");
  dmg.innerHTML = makeStatArrowSvg("down");
  dmg.addEventListener("click", function(){ set(cur - 1, "hp-dmg"); });
  var full = document.createElement("button");
  full.type = "button"; full.className = "btn small quick-heal-btn hp-full-inline";
  full.textContent = "Full";
  full.addEventListener("click", function(){ set(max, "hp-heal"); });
  var heal = document.createElement("button");
  heal.type = "button"; heal.className = "stat-arrow-btn stat-arrow-up";
  heal.title = "Heal 1 HP";
  heal.setAttribute("aria-label", "Heal " + comp.def.name + " 1");
  heal.innerHTML = makeStatArrowSvg("up");
  heal.addEventListener("click", function(){ set(cur + 1, "hp-heal"); });
  btns.appendChild(dmg); btns.appendChild(full); btns.appendChild(heal);
  row.appendChild(btns);
  return row;
}

function entryBlock(title, list, render){
  if(!list || !list.length) return null;
  var box = ce("div", "comp-section");
  var h = ce("div", "comp-section-title");
  h.textContent = title;
  box.appendChild(h);
  list.forEach(function(e){ box.appendChild(render(e)); });
  return box;
}
/* A block of traits as one string, as the SRD blocks and the beast form
   keep them ("Keen Smell: ... Pack Tactics: ..."), split into named
   traits; text with no "Name:" at its start stays one unnamed entry. */
var TRAIT_NAME = /(?:^|\s)([A-Z][a-z']+(?:-[A-Za-z][a-z']+)*(?: (?:[A-Z][a-z'()]+(?:-[A-Za-z][a-z']+)*|and|of|the))*): /g;
export function splitTraits(list){
  var out = [];
  (list||[]).forEach(function(e){
    if(e.name || !e.text){ out.push(e); return; }
    var text = String(e.text).trim(), marks = [], m;
    TRAIT_NAME.lastIndex = 0;
    while((m = TRAIT_NAME.exec(text))) marks.push({at: m.index + (m[0].charAt(0)===" " ? 1 : 0), name: m[1], body: m.index + m[0].length});
    if(!marks.length || marks[0].at!==0){ out.push({text: text}); return; }
    marks.forEach(function(k, i){
      var body = text.slice(k.body, i + 1 < marks.length ? marks[i + 1].at : text.length).trim();
      out.push({name: k.name, text: /[.!?)]$/.test(body) ? body : body + "."});
    });
  });
  return out;
}
/* A trait as a tile: its name and two lines of text; a tap opens it all
   in a bottom sheet. One without a name is plain text. */
function traitTile(e, owner, kind){
  if(!e.name){
    var p = ce("p", "comp-entry");
    p.textContent = e.text;
    return p;
  }
  var tile = ce("div", "comp-trait");
  tile.setAttribute("role", "button");
  tile.tabIndex = 0;
  tile.setAttribute("aria-label", e.name + ": details");
  var head = ce("div", "comp-trait-head");
  var n = ce("span", "comp-trait-name");
  n.textContent = e.name;
  head.appendChild(n);
  var more = ce("span", "ff-more");
  more.setAttribute("aria-hidden", "true");
  more.innerHTML = makeChevronRightSvg();
  head.appendChild(more);
  tile.appendChild(head);
  var t = ce("p", "comp-trait-text");
  t.textContent = e.text;
  tile.appendChild(t);
  function open(){
    openBottomSheet(function(body, refresh, close){
      var header = ce("div", "bs-header");
      var title = ce("div", "bs-title");
      title.textContent = e.name;
      header.appendChild(title);
      var x = document.createElement("button");
      x.className = "bs-close"; x.textContent = "✕"; x.title = "Close";
      x.setAttribute("aria-label", "Close");
      x.addEventListener("click", close);
      header.appendChild(x);
      body.appendChild(header);
      var sub = ce("p", "bs-subtitle");
      sub.textContent = kind + " · " + owner;
      body.appendChild(sub);
      var d = ce("div", "ff-desc ff-sheet-desc");
      d.textContent = e.text;
      body.appendChild(d);
    });
  }
  tile.addEventListener("click", open);
  tile.addEventListener("keydown", function(ev){ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); open(); } });
  return tile;
}
/* Traits or riding rules: a titled grid of tiles. */
function traitBlock(title, list, owner, kind){
  var box = entryBlock(title, splitTraits(list), function(e){ return traitTile(e, owner, kind); });
  if(!box) return null;
  box.classList.add("comp-traits");
  var grid = ce("div", "comp-trait-grid");
  Array.prototype.slice.call(box.children, 1).forEach(function(el){ grid.appendChild(el); });
  box.appendChild(grid);
  return box;
}
/* An attack or action: its name with the roll buttons (or, read-only,
   tags) beside it, and what it does under them. */
function actEntry(name, side, text){
  var box = ce("div", "comp-act");
  var head = ce("div", "comp-act-head");
  var n = ce("span", "comp-act-name");
  n.textContent = name;
  head.appendChild(n);
  if(side.length){
    var rolls = ce("div", "comp-act-rolls");
    side.forEach(function(el){ rolls.appendChild(el); });
    head.appendChild(rolls);
  }
  box.appendChild(head);
  if(text){
    var p = ce("p", "comp-act-text");
    p.textContent = text;
    box.appendChild(p);
  }
  return box;
}
function tag(text){
  var t = ce("span", "comp-tag");
  t.textContent = text;
  return t;
}

function choiceRow(c, comp){
  var ch = comp.def.choice;
  var options = comp.options && comp.options.length ? comp.options : ch.options;
  var box = ce("div", "comp-choice" + (comp.choice ? "" : " pending"));
  var label = ce("span", "comp-choice-label");
  label.textContent = ch.label;
  box.appendChild(label);
  // A long list (a familiar's forms) is a dropdown rather than buttons.
  if(options.length > 6){
    box.appendChild(themedPicker({
      key: "comp:" + comp.def.id, ariaLabel: ch.label, placeholder: "Choose a " + ch.label.toLowerCase(), search: true, sheet: true,
      groups: {"": options}, value: comp.choice || "",
      onPick: function(v){ setCompanionChoice(c, comp.def.id, v); save(); renderAll(); }
    }));
    return box;
  }
  var seg = ce("div", "comp-seg");
  seg.setAttribute("role", "group");
  seg.setAttribute("aria-label", ch.label);
  options.forEach(function(o){
    var b = document.createElement("button");
    b.type = "button"; b.className = "comp-seg-btn" + (comp.choice===o ? " active" : "");
    b.setAttribute("aria-pressed", comp.choice===o ? "true" : "false");
    b.textContent = o;
    b.addEventListener("click", function(){ setCompanionChoice(c, comp.def.id, o); save(); renderAll(); });
    seg.appendChild(b);
  });
  box.appendChild(seg);
  return box;
}

function statTile(label, value, cls){
  var tile = ce("div", "comp-tile" + (cls ? " " + cls : ""));
  tile.innerHTML = "<span class='lbl'></span><span class='val'></span>";
  tile.firstChild.textContent = label;
  tile.lastChild.textContent = value;
  if(String(value).length > 10) tile.lastChild.classList.add("long");   // "40 ft, fly 40 ft (not while ridden)"
  return tile;
}

/* The stat block itself (vitals row, abilities, facts, attacks, actions,
   reactions, traits) into `card`. opts.rolls adds roll buttons (the
   sheet); opts.hpTile() replaces the Max HP tile (the HP trackers). The
   Compendium's Companions list shows it read-only. */
export function renderStatBlock(card, s, name, opts){
  opts = opts || {};
  var block = ce("div", "comp-block");
  var tiles = ce("div", "comp-tiles");
  tiles.appendChild(statTile("AC", s.ac, "comp-tile-ac"));
  tiles.appendChild(opts.hpTile ? opts.hpTile() : statTile("Max HP", s.hp, "comp-tile-hp"));
  tiles.appendChild(statTile("Speed", s.speed, "comp-tile-speed"));
  block.appendChild(tiles);

  var body = ce("div", "comp-body");
  var stats = ce("div", "comp-col");
  if(s.abilities){
    var ab = ce("div", "comp-abilities");
    ABILITY_KEYS.forEach(function(k){
      var m = mod(s.abilities[k]);
      var cell = ce(opts.rolls ? "button" : "div", "comp-ability");
      if(opts.rolls){
        cell.type = "button";
        cell.title = "Roll a " + k.toUpperCase() + " check";
        cell.addEventListener("click", function(){ performRoll(20, 1, m, "none", name + ": " + k.toUpperCase() + " check"); });
      }
      cell.innerHTML = "<span class='lbl'></span><span class='mod'></span><span class='score'></span>";
      cell.children[0].textContent = k.toUpperCase();
      cell.children[1].textContent = fmtMod(m);
      cell.children[2].textContent = s.abilities[k];
      ab.appendChild(cell);
    });
    stats.appendChild(ab);
  }
  var facts = [["Saves", s.saves], ["Skills", s.skills], ["Senses", s.senses], ["Vulnerable", s.vulnerabilities], ["Resist", s.resistances], ["Immune", s.immunities]]
    .filter(function(f){ return f[1]; });
  if(facts.length){
    var dl = ce("dl", "comp-facts");
    facts.forEach(function(f){
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = f[0];
      dd.textContent = f[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });
    stats.appendChild(dl);
  }
  if(stats.childNodes.length) body.appendChild(stats);

  var acts = ce("div", "comp-col");
  var attacks = entryBlock("Attacks", s.attacks, function(a){
    if(!opts.rolls){
      return actEntry(a.name, [tag(fmtMod(a.toHit) + " to hit")], a.text + " Hit: " + diceText(a.dice, a.bonus) + " " + a.damageType + " damage" +
        (a.extraDice ? " plus " + a.extraDice + " " + a.extraType : "") + ".");
    }
    var dmg = document.createDocumentFragment();
    dmg.appendChild(document.createTextNode("Damage " + diceText(a.dice, a.bonus)));
    if(a.damageType){
      var dt = ce("span", "comp-dmg-type");
      dt.textContent = " " + a.damageType;
      dmg.appendChild(dt);
    }
    var side = [
      rollButton("Attack " + fmtMod(a.toHit), function(){ performRoll(20, 1, a.toHit, "none", name + ": " + a.name); }),
      rollButton(dmg, function(){ rollDice(a.dice, a.bonus, name + ": " + a.name + " damage"); })
    ];
    if(a.extraDice) side.push(rollButton("+" + a.extraDice + " " + a.extraType, function(){ rollDice(a.extraDice, 0, name + ": " + a.name + " " + a.extraType + " damage"); }));
    return actEntry(a.name, side, a.text);
  });
  if(attacks) acts.appendChild(attacks);
  var actions = entryBlock("Actions", s.actions, function(a){
    var side = [];
    if(a.save) side.push(tag(a.save + " save"));
    if(a.dice) side.push(opts.rolls ? rollButton(diceText(a.dice, a.bonus), function(){ rollDice(a.dice, a.bonus, name + ": " + a.name); }) : tag(diceText(a.dice, a.bonus)));
    return actEntry(a.name, side, a.text);
  });
  if(actions) acts.appendChild(actions);
  var reactions = entryBlock("Reactions", splitTraits(s.reactions), function(r){ return actEntry(r.name || "Reaction", [], r.text); });
  if(reactions) acts.appendChild(reactions);
  if(acts.childNodes.length) body.appendChild(acts);
  if(body.childNodes.length < 2) body.classList.add("single");

  var traits = traitBlock("Traits", s.traits, name, "Trait");
  if(traits) body.appendChild(traits);
  var riding = traitBlock("Riding", s.riding, name, "Riding");
  if(riding) body.appendChild(riding);
  block.appendChild(body);
  card.appendChild(block);
}

function renderCompanion(c, comp){
  var s = comp.stats, name = comp.def.name;
  if(!s) return renderSetupCard(c, comp);
  var card = makeCard(name + (s.count > 1 ? " ×" + s.count : ""));
  card.classList.add("comp-card");
  card.dataset.comp = comp.def.id;
  if(isSetupMode(comp)){
    var edit = document.createElement("button");
    edit.type = "button"; edit.className = "btn small ghost comp-edit";
    edit.textContent = "Edit beast";
    edit.addEventListener("click", function(){ openBeastForm(c, comp); });
    card.querySelector("h3").appendChild(edit);
  }
  var type = ce("p", "comp-sub");
  type.textContent = s.type + " · from " + (comp.source || comp.def.source || comp.def.subclass);
  card.appendChild(type);
  if(comp.def.choice) card.appendChild(choiceRow(c, comp));

  renderStatBlock(card, s, name, {rolls: true, hpTile: function(){
    var tile = ce("div", "comp-tile comp-tile-hp");
    comp.hp.forEach(function(_, i){ tile.appendChild(hpTracker(c, comp, i)); });
    var lbl = ce("span", "lbl");   // inside the first tracker, so its fill runs behind it as on Vitals
    lbl.textContent = "Hit Points";
    tile.firstChild.insertBefore(lbl, tile.firstChild.firstChild);
    return tile;
  }});
  return card;
}

/* ---- Beast Master: the beast's own stat block ----
   Entered as printed (a preset fills it in); the card adds the ranger's
   proficiency bonus to AC, attacks, damage and skills, and raises its HP
   to four times the ranger level when that's higher. */
/* The companion is in "enter your own stat block" mode: setup is true, or
   names the chosen option (a beast saved before the choice existed counts). */
function isSetupMode(comp){
  var setup = comp.def.setup;
  if(setup===true) return true;
  if(!setup) return false;
  var saved = comp.choice || (comp.hasBeast ? setup : "");
  return saved===setup;
}
/* No stat block yet: pick the kind of companion (Tasha's primal beasts or
   your own), and for your own beast, open the form. */
function renderSetupCard(c, comp){
  var card = makeCard(comp.def.name);
  card.classList.add("comp-card");
  var intro = ce("p", "art-intro");
  if(comp.def.choice){
    intro.textContent = comp.def.choice.intro || "Choose your companion: one of Tasha's primal beasts (it uses your spell attack and grows with your level), or your own beast from the PHB rules.";
    card.appendChild(intro);
    card.appendChild(choiceRow(c, comp));
  }
  if(isSetupMode(comp)){
    var own = ce("p", "art-intro");
    own.textContent = "Choose a beast no larger than Medium with a challenge rating of 1/4 or lower, and enter its stat block as printed. The sheet adds your bonuses.";
    card.appendChild(own);
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small primary";
    b.textContent = "Set up your beast";
    b.addEventListener("click", function(){ openBeastForm(c, comp); });
    card.appendChild(b);
  }
  return card;
}

var ABILITY_LABELS = {str:"STR", dex:"DEX", con:"CON", int:"INT", wis:"WIS", cha:"CHA"};
function emptyBeast(){
  return {name:"", size:"Medium", ac:12, hp:10, speed:"30 ft", abilities:{str:10, dex:10, con:10, int:3, wis:10, cha:5},
    skills:"", senses:"", traits:"", attacks:[{name:"Bite", toHit:3, dice:"1d6", bonus:1, damageType:"piercing", text:""}]};
}
function openBeastForm(c, comp){
  var saved = c.companions && c.companions[comp.def.id] && c.companions[comp.def.id].beast;
  var draft = JSON.parse(JSON.stringify(saved || emptyBeast()));
  openInfoModal(comp.def.name, function(body){
    var holder = ce("div", "beast-form");
    body.appendChild(holder);
    function input(label, value, type, onInput, wide){
      var f = ce("label", "beast-field" + (wide ? " wide" : ""));
      var span = ce("span"); span.textContent = label;
      var el = document.createElement(type==="area" ? "textarea" : "input");
      if(type!=="area") el.type = type || "text";
      el.value = value==null ? "" : value;
      el.setAttribute("aria-label", label);
      el.addEventListener("input", function(){ onInput(type==="number" ? Number(el.value) : el.value); });
      f.appendChild(span); f.appendChild(el);
      return f;
    }
    function draw(){
      holder.innerHTML = "";
      // Start from an SRD beast (every one a Beast Master can take).
      var presets = ce("div", "art-switch");
      var pl = ce("span", "comp-choice-label"); pl.textContent = "Start from:";
      presets.appendChild(pl);
      presets.appendChild(themedPicker({
        key: "beast-preset", ariaLabel: "Start from a beast", placeholder: "Choose a beast", search: true, sheet: true,
        groups: {"": Object.keys(BEAST_PRESETS)}, value: BEAST_PRESETS[draft.name] ? draft.name : "",
        onPick: function(k){ draft = JSON.parse(JSON.stringify(BEAST_PRESETS[k])); draw(); }
      }));
      holder.appendChild(presets);
      var grid = ce("div", "beast-grid");
      grid.appendChild(input("Name", draft.name, "text", function(v){ draft.name = v; }));
      grid.appendChild(input("Size", draft.size, "text", function(v){ draft.size = v; }));
      grid.appendChild(input("AC", draft.ac, "number", function(v){ draft.ac = v; }));
      grid.appendChild(input("Hit points", draft.hp, "number", function(v){ draft.hp = v; }));
      grid.appendChild(input("Speed", draft.speed, "text", function(v){ draft.speed = v; }, true));
      holder.appendChild(grid);
      var ab = ce("div", "beast-grid beast-abilities");
      Object.keys(ABILITY_LABELS).forEach(function(k){
        ab.appendChild(input(ABILITY_LABELS[k], draft.abilities[k], "number", function(v){ draft.abilities[k] = v; }));
      });
      holder.appendChild(ab);
      var more = ce("div", "beast-grid");
      more.appendChild(input("Skills (as printed)", draft.skills, "text", function(v){ draft.skills = v; }, true));
      more.appendChild(input("Senses", draft.senses, "text", function(v){ draft.senses = v; }, true));
      holder.appendChild(more);
      draft.attacks.forEach(function(a, i){
        var t = ce("div", "comp-section-title"); t.textContent = "Attack " + (i + 1);
        holder.appendChild(t);
        var row = ce("div", "beast-grid");
        row.appendChild(input("Name", a.name, "text", function(v){ a.name = v; }));
        row.appendChild(input("To hit (as printed)", a.toHit, "number", function(v){ a.toHit = v; }));
        row.appendChild(input("Damage dice", a.dice, "text", function(v){ a.dice = v; }));
        row.appendChild(input("Damage bonus", a.bonus, "number", function(v){ a.bonus = v; }));
        row.appendChild(input("Damage type", a.damageType, "text", function(v){ a.damageType = v; }));
        row.appendChild(input("Notes", a.text, "text", function(v){ a.text = v; }, true));
        holder.appendChild(row);
      });
      var atkRow = ce("div", "art-switch");
      if(draft.attacks.length < 3){
        var add = document.createElement("button");
        add.type = "button"; add.className = "btn small ghost"; add.textContent = "+ Attack";
        add.addEventListener("click", function(){ draft.attacks.push({name:"", toHit:3, dice:"1d4", bonus:1, damageType:"", text:""}); draw(); });
        atkRow.appendChild(add);
      }
      if(draft.attacks.length > 1){
        var rm = document.createElement("button");
        rm.type = "button"; rm.className = "btn small ghost"; rm.textContent = "Remove last attack";
        rm.addEventListener("click", function(){ draft.attacks.pop(); draw(); });
        atkRow.appendChild(rm);
      }
      holder.appendChild(atkRow);
      holder.appendChild(input("Traits", draft.traits, "area", function(v){ draft.traits = v; }, true));
      var saveRow = ce("div", "cmp-give-row fp-modal-row");
      var saveBtn = document.createElement("button");
      saveBtn.type = "button"; saveBtn.className = "btn primary"; saveBtn.textContent = "Save beast";
      saveBtn.addEventListener("click", function(){
        if(!(draft.name||"").trim()){ showActionToast("Give your beast a name.", true); return; }
        setCompanionBeast(c, comp.def.id, draft);
        document.getElementById("info-modal-close").click();
        save(); renderAll();
      });
      saveRow.appendChild(saveBtn);
      holder.appendChild(saveRow);
    }
    draw();
  });
}

/* The Companions tab (shown only when the character has one). */
export function renderCompanionsPanel(c){
  var panel = document.createElement("div");
  characterCompanions(c).forEach(function(comp){ panel.appendChild(renderCompanion(c, comp)); });
  return panel;
}
