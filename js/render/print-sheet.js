/* ---------------- The printed character sheet ----------------
   Lays out js/core/print-sheet.js's contents like the classic three-page
   character sheet everyone knows (page 1 the stats, page 2 details and
   story, page 3 spellcasting), drawn in our own lines with no logo or
   artwork, then pages with every feature's and spell's full text.

   The pages are built into #print-root, which only @media print shows
   (css/pages/print.css). Pages 1 to 3 have fixed boxes, like the paper
   sheet: each list is filled item by item while it fits, and what
   doesn't fit carries on in a later box or a "continued" section, so
   nothing is cut off. That needs the pages laid out at their printed
   size, so #print-root is laid out off screen while it is built.

   openPrintDialog(c) is the identity card's "Print sheet": section
   switches, an optional player name (both kept on the character), then
   the browser's print window. printCharacters(chars, sections) prints
   several one after another (the sidebar's select mode). */
import { printSheetData, MAX_USE_BOXES } from "../core/print-sheet.js";
import { useSpellsOf } from "../core/spell-edition.js";
import { state, save, getActive } from "../core/state.js";
import { characterCompanions } from "../core/companions.js";
import { godIconSvg } from "../core/faith.js";
import { openInfoModal } from "../ui/info-modal.js";
import { splitTraits } from "./panels/companions.js";

/* ---- small DOM helpers ---- */
function el(tag, cls, text){
  var e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text !== undefined && text !== null) e.textContent = text;
  return e;
}
function add(parent, child){ parent.appendChild(child); return child; }

/* A labelled box like the paper sheet's: the label under (or over) its
   contents. Returns {box, body}. */
function box(cls, label, labelTop){
  var b = el("section", "ps-box" + (cls ? " " + cls : ""));
  var body = el("div", "ps-body");
  if(labelTop) add(b, el("div", "ps-label ps-label-top", label));
  add(b, body);
  if(!labelTop && label) add(b, el("div", "ps-label", label));
  return {box: b, body: body};
}
function field(value, label, cls){
  var f = el("div", "ps-field" + (cls ? " " + cls : ""));
  add(f, el("div", "ps-field-value", value === undefined || value === null ? "" : String(value)));
  add(f, el("div", "ps-field-label", label));
  return f;
}
function pencilBoxes(n){
  var s = el("span", "ps-ticks");
  for(var i = 0; i < n; i++) add(s, el("span", "ps-tick"));
  return s;
}
function dateText(d){
  try{ return d.toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"}); }
  catch(e){ return String(d); }
}
function footer(data){
  return el("div", "ps-footer", "Printed from Ragnar's Den, " + dateText(data.footer.date) + ", level " + data.footer.level);
}

/* ---- fitting lists into fixed boxes ---- */
function fits(body){ return body.scrollHeight <= body.clientHeight + 1; }

/* Adds each item's node to `list` while its box `body` (the list's own
   when not given) still fits; returns the items left over. */
function fill(list, items, make, body){
  body = body || list;
  for(var i = 0; i < items.length; i++){
    var node = make(items[i]);
    list.appendChild(node);
    if(!fits(body)){ list.removeChild(node); return items.slice(i); }
  }
  return [];
}

/* One-line values (a long class and subclass, an attack's damage)
   shrink until they fit their space, down to 5.5pt; a field that still
   doesn't fit wraps onto two lines. */
function shrinkLines(root){
  Array.prototype.forEach.call(root.querySelectorAll(".ps-field-value, .ps-attack-row span, .ps-check-name"), function(e){
    if(e.scrollWidth <= e.clientWidth + 1) return;
    var size = parseFloat(getComputedStyle(e).fontSize) * 0.75;   // px to pt
    while(e.scrollWidth > e.clientWidth + 1 && size > 5.5){ size -= 0.5; e.style.fontSize = size + "pt"; }
    // Still too long (a three-class Class & Level): two lines, not cut off.
    if(e.scrollWidth > e.clientWidth + 1 && e.classList.contains("ps-field-value")){
      e.style.fontSize = "6.5pt";
      e.classList.add("ps-wrap");
    }
  });
}

/* A paragraph box: the text at the largest size that fits, down to a
   floor; returns the text that still didn't fit ("" when it all did). */
var TEXT_SIZES = [8.5, 8, 7.5, 7, 6.5];
function fillText(body, text){
  var p = add(body, el("p", "ps-text", text));
  for(var i = 0; i < TEXT_SIZES.length; i++){
    p.style.fontSize = TEXT_SIZES[i] + "pt";
    if(fits(body)) return "";
  }
  // Still too long at the smallest size: keep the words that fit.
  var words = text.split(/\s+/), lo = 0, hi = words.length;
  while(lo < hi){
    var mid = Math.ceil((lo + hi) / 2);
    p.textContent = words.slice(0, mid).join(" ") + " (continued)";
    if(fits(body)) lo = mid; else hi = mid - 1;
  }
  p.textContent = words.slice(0, lo).join(" ") + (lo < words.length ? " (continued)" : "");
  return words.slice(lo).join(" ");
}

/* ---- page 1 ---- */
function featureLine(f, use){
  var li = el("li", "ps-feature");
  add(li, el("b", null, f.name));
  if(use){
    add(li, document.createTextNode(" "));
    if(use.boxes) add(li, pencilBoxes(use.max));
    else add(li, el("span", "ps-blank", "____ / " + use.max));
    add(li, el("span", "ps-dim", " per " + use.reset));
  }
  else if(f.source) add(li, el("span", "ps-dim", " " + f.source));
  return li;
}
/* Features & Traits lines: a feature with limited uses carries its
   pencil boxes on its own line (Rage, Second Wind); uses with no feature
   of that name (a race's Fey Step) come first. */
function featureItems(data){
  var byName = {};
  data.uses.forEach(function(u){ byName[u.name.toLowerCase()] = u; });
  var claimed = {};
  var feats = data.features.map(function(f){
    var u = byName[f.name.toLowerCase()];
    if(u) claimed[u.name.toLowerCase()] = true;
    return {feature: f, use: u || null};
  });
  return data.uses.filter(function(u){ return !claimed[u.name.toLowerCase()]; }).map(function(u){ return {use: u}; }).concat(feats);
}
function featureItemLine(x){ return x.feature ? featureLine(x.feature, x.use) : useLine(x.use); }
function useLine(u){
  var li = el("li", "ps-use");
  add(li, el("b", null, u.name + " "));
  if(u.boxes) add(li, pencilBoxes(u.max));
  else add(li, el("span", "ps-blank", "____ / " + u.max));
  add(li, el("span", "ps-dim", " per " + u.reset));
  return li;
}
function equipmentLine(i){
  return el("li", "ps-item", (i.qty > 1 ? i.qty + " " : "") + i.name + (i.attuned ? " (attuned)" : i.equipped ? " (equipped)" : ""));
}

function buildPage1(data, carry){
  var page = el("div", "ps-page ps-page-1");
  // Header: the name banner, then class & level ... experience points.
  var head = add(page, el("header", "ps-head"));
  add(head, field(data.header.name, "Character Name", "ps-name"));
  var hf = add(head, el("div", "ps-head-fields"));
  [[data.header.classLevel, "Class & Level"], [data.header.background, "Background"], [data.header.playerName, "Player Name"],
   [data.header.race, "Race"], [data.header.alignment, "Alignment"], [data.header.xp || "", "Experience Points"]]
    .forEach(function(x){ add(hf, field(x[0], x[1])); });

  var cols = add(page, el("div", "ps-cols"));
  // Column 1: the abilities, then inspiration, proficiency, saves, skills.
  var c1 = add(cols, el("div", "ps-col ps-col-1"));
  var top = add(c1, el("div", "ps-col1-top"));
  var abil = add(top, el("div", "ps-abilities"));
  data.abilities.forEach(function(a){
    var b = add(abil, el("div", "ps-ability"));
    add(b, el("div", "ps-ability-name", a.name));
    add(b, el("div", "ps-ability-mod", a.mod));
    add(b, el("div", "ps-ability-score", String(a.score)));
  });
  var mid = add(top, el("div", "ps-col1-mid"));
  var insp = add(mid, el("div", "ps-pill"));
  add(insp, el("span", "ps-pill-value", data.inspiration ? String(data.inspiration) : ""));
  add(insp, el("span", "ps-pill-label", "Inspiration"));
  var pb = add(mid, el("div", "ps-pill"));
  add(pb, el("span", "ps-pill-value", data.profBonus));
  add(pb, el("span", "ps-pill-label", "Proficiency Bonus"));
  var saves = box("ps-saves", "Saving Throws");
  data.saves.forEach(function(s){
    var r = add(saves.body, el("div", "ps-check" + (s.prof ? " is-prof" : "")));
    add(r, el("span", "ps-dot"));
    add(r, el("span", "ps-check-value", s.value));
    add(r, el("span", "ps-check-name", s.name));
  });
  add(mid, saves.box);
  var skills = box("ps-skills", "Skills");
  data.skills.forEach(function(s){
    var r = add(skills.body, el("div", "ps-check" + (s.expertise ? " is-exp" : s.prof ? " is-prof" : "")));
    add(r, el("span", "ps-dot"));
    add(r, el("span", "ps-check-value", s.value));
    var n = add(r, el("span", "ps-check-name", s.name + " "));
    add(n, el("span", "ps-dim", "(" + s.ability + ")"));
  });
  add(mid, skills.box);
  var pass = add(c1, el("div", "ps-pill ps-pill-wide"));
  add(pass, el("span", "ps-pill-value", String(data.passivePerception)));
  add(pass, el("span", "ps-pill-label", "Passive Wisdom (Perception)"));
  var other = box("ps-other ps-grow", "Other Proficiencies & Languages");
  add(c1, other.box);

  // Column 2: AC, initiative, speed, hit points, hit dice, death saves,
  // attacks, equipment.
  var c2 = add(cols, el("div", "ps-col ps-col-2"));
  var combat = add(c2, el("div", "ps-combat"));
  var three = add(combat, el("div", "ps-three"));
  add(three, field(data.ac, "Armor Class", "ps-big ps-ac"));
  add(three, field(data.initiative, "Initiative", "ps-big"));
  add(three, field(data.speed.walk + " ft", "Speed", "ps-big"));
  if(data.speed.others.length) add(combat, el("div", "ps-speed-others", data.speed.others.join(" · ")));
  var hp = box("ps-hp", "Current Hit Points");
  add(hp.body, el("div", "ps-corner", "Hit Point Maximum  " + data.hpMax));
  add(combat, hp.box);
  add(combat, box("ps-temp", "Temporary Hit Points").box);
  var pair = add(combat, el("div", "ps-pair"));
  var hd = box("ps-hd", "Hit Dice");
  add(hd.body, el("div", "ps-corner", "Total  " + data.hitDice));
  add(pair, hd.box);
  var ds = box("ps-death", "Death Saves");
  ["Successes", "Failures"].forEach(function(t){
    var r = add(ds.body, el("div", "ps-death-row"));
    add(r, el("span", "ps-death-label", t));
    add(r, pencilBoxes(3)).classList.add("ps-round");
  });
  add(pair, ds.box);
  var atk = box("ps-attacks", "Attacks & Spellcasting");
  var table = add(atk.body, el("div", "ps-attack-table"));
  var th = add(table, el("div", "ps-attack-row ps-attack-head"));
  ["Name", "Atk Bonus", "Damage/Type"].forEach(function(t){ add(th, el("span", null, t)); });
  add(c2, atk.box);
  var eq = box("ps-equipment ps-grow", "Equipment");
  var coins = add(eq.body, el("div", "ps-coins"));
  ["cp", "sp", "ep", "gp", "pp"].forEach(function(k){
    var cb = add(coins, el("div", "ps-coin"));
    add(cb, el("span", "ps-coin-label", k.toUpperCase()));
    add(cb, el("span", "ps-coin-value", data.coins[k] ? String(data.coins[k]) : ""));
  });
  var eqList = add(eq.body, el("ul", "ps-list ps-eq-list"));
  add(c2, eq.box);

  // Column 3: personality, then features & traits.
  var c3 = add(cols, el("div", "ps-col ps-col-3"));
  var pers = add(c3, el("div", "ps-personality"));
  var traits = box("ps-traits", "Personality Traits");
  var ideals = box("ps-ideals", "Ideals");
  var bonds = box("ps-bonds", "Bonds");
  var flaws = box("ps-flaws", "Flaws");
  [traits, ideals, bonds, flaws].forEach(function(b){ add(pers, b.box); });
  var feats = box("ps-features ps-grow", "Features & Traits");
  var featList = add(feats.body, el("ul", "ps-list"));
  add(c3, feats.box);
  add(page, footer(data));

  return {page: page, fillLater: function(){
    // Proficiencies and languages: a line per kind, the rest carries on.
    var p = data.proficiencies;
    var lines = [["Armor", p.armor], ["Weapons", p.weapons], ["Tools", p.tools], ["Languages", data.languages]]
      .filter(function(x){ return x[1].length; }).map(function(x){ return {label: x[0], text: x[1].join(", ")}; });
    if(data.senses.length) lines.push({label: "Senses", text: data.senses.join(", ")});
    var otherList = add(other.body, el("ul", "ps-list"));
    carry.other = fill(otherList, lines, function(l){
      var li = el("li", "ps-prof-line"); add(li, el("b", null, l.label + ": ")); add(li, document.createTextNode(l.text)); return li;
    }, other.body);

    carry.attacks = fill(table, data.attacks, function(a){
      var r = el("div", "ps-attack-row");
      add(r, el("span", null, a.name)); add(r, el("span", null, a.bonus)); add(r, el("span", null, a.damage));
      return r;
    }, atk.body);
    // Blank rows for pencil, as many as fit.
    for(var i = 0; i < 12; i++){
      var blank = el("div", "ps-attack-row ps-attack-blank");
      ["", "", ""].forEach(function(){ add(blank, el("span")); });
      table.appendChild(blank);
      if(!fits(atk.body)){ table.removeChild(blank); break; }
    }
    carry.equipment = fill(eqList, data.equipment, equipmentLine, eq.body);
    [[traits, data.personality.traits.join(" ")], [ideals, data.personality.ideal], [bonds, data.personality.bond], [flaws, data.personality.flaw]]
      .forEach(function(x){
        var left = x[1] ? fillText(x[0].body, x[1]) : "";
        if(left) carry.personality.push({label: x[0].box.querySelector(".ps-label").textContent, text: left});
      });
    carry.features = fill(featList, featureItems(data), featureItemLine, feats.body);
  }};
}

/* ---- page 2 ---- */
function buildPage2(data, carry){
  var page = el("div", "ps-page ps-page-2");
  var head = add(page, el("header", "ps-head"));
  add(head, field(data.header.name, "Character Name", "ps-name"));
  var hf = add(head, el("div", "ps-head-fields"));
  data.details.forEach(function(d){ add(hf, field(d.value, d.label)); });
  var grid = add(page, el("div", "ps-p2"));
  var appear = box("ps-appearance", "Character Appearance");
  if(data.photo){
    var img = add(appear.body, el("img", "ps-photo"));
    img.src = data.photo; img.alt = "";
  }
  add(grid, appear.box);
  var allies = box("ps-allies", "Allies & Organizations");
  var sym = add(allies.body, el("div", "ps-symbol"));
  add(sym, el("div", "ps-symbol-name", data.faith ? data.faith.name + (data.faith.title ? ", " + data.faith.title : "") : ""));
  add(sym, el("div", "ps-symbol-label", "Name"));
  var art = add(sym, el("div", "ps-symbol-art"));
  if(data.faith){
    var svg = godIconSvg(data.faith);
    if(svg) art.innerHTML = svg;
    if(data.faith.symbol) add(art, el("div", "ps-symbol-text", data.faith.symbol));
  }
  add(sym, el("div", "ps-symbol-label", "Symbol"));
  add(grid, allies.box);
  var back = box("ps-backstory", "Character Backstory");
  add(grid, back.box);
  var more = box("ps-more", "Additional Features & Traits");
  var moreList = add(more.body, el("ul", "ps-list"));
  add(grid, more.box);
  add(grid, box("ps-treasure", "Treasure").box);
  add(page, footer(data));
  return {page: page, fillLater: function(){
    carry.backstory = fill(back.body, data.backstory, function(r){
      var p = el("p", "ps-story"); add(p, el("b", null, r.label + ": ")); add(p, document.createTextNode(r.text)); return p;
    });
    // Features that didn't fit on page 1.
    carry.features = fill(moreList, carry.features, featureItemLine, more.body);
  }};
}

/* ---- page 3 ---- */
var SPELL_LINES = {0: 8, 1: 12, 2: 12, 3: 12, 4: 12, 5: 8, 6: 8, 7: 8, 8: 6, 9: 6};
var SPELL_COLUMNS = [[0, 1, 2], [3, 4, 5], [6, 7, 8, 9]];

function buildPage3(data, carry){
  var sc = data.spellcasting;
  var page = el("div", "ps-page ps-page-3");
  var head = add(page, el("header", "ps-head"));
  add(head, field(sc.rows.map(function(r){ return r.className; }).join(", "), "Spellcasting Class", "ps-name"));
  var hf = add(head, el("div", "ps-head-fields ps-spell-stats"));
  add(hf, field(sc.rows.map(function(r){ return r.ability; }).join(" / "), "Spellcasting Ability", "ps-big"));
  add(hf, field(sc.rows.map(function(r){ return r.dc; }).join(" / "), "Spell Save DC", "ps-big"));
  add(hf, field(sc.rows.map(function(r){ return r.attack; }).join(" / "), "Spell Attack Bonus", "ps-big"));
  var cols = add(page, el("div", "ps-spell-cols"));
  carry.spells = [];
  SPELL_COLUMNS.forEach(function(levels){
    var col = add(cols, el("div", "ps-spell-col"));
    levels.forEach(function(lv){
      var L = sc.levels[lv];
      var block = add(col, el("section", "ps-spell-level"));
      var lh = add(block, el("div", "ps-spell-head"));
      add(lh, el("span", "ps-spell-num", String(lv)));
      if(lv === 0) add(lh, el("span", "ps-spell-title", "Cantrips"));
      else {
        var pactHere = sc.pact && sc.pact.slotLevel === lv;
        var total = L.slotsTotal + (pactHere ? sc.pact.max : 0);
        add(lh, field(total || "", "Slots Total", "ps-slot-total"));
        var exp = add(lh, el("div", "ps-field ps-slot-exp"));
        add(exp, total ? pencilBoxes(total) : el("span"));
        add(exp, el("div", "ps-field-label", pactHere ? "Slots Expended (pact " + sc.pact.max + ")" : "Slots Expended"));
      }
      var list = add(block, el("ol", "ps-spell-lines"));
      var shown = L.spells.slice(0, SPELL_LINES[lv]);
      shown.forEach(function(s){
        var li = add(list, el("li", "ps-spell-line" + (s.prepared && lv > 0 ? " is-prepared" : "")));
        if(lv > 0) add(li, el("span", "ps-dot"));
        add(li, el("span", null, s.name));
        if(s.note) add(li, el("span", "ps-dim", " " + s.note));
      });
      for(var i = shown.length; i < SPELL_LINES[lv]; i++){
        var blank = add(list, el("li", "ps-spell-line ps-blank-line"));
        if(lv > 0) add(blank, el("span", "ps-dot"));
      }
      if(L.spells.length > SPELL_LINES[lv]) carry.spells = carry.spells.concat(L.spells.slice(SPELL_LINES[lv]).map(function(s){ return Object.assign({level: lv}, s); }));
    });
  });
  add(page, footer(data));
  return {page: page, fillLater: function(){}};
}

/* ---- full text pages ---- */
function flowSection(title){
  var sec = el("section", "ps-flow");
  add(sec, el("h2", "ps-flow-title", title));
  var cols = add(sec, el("div", "ps-flow-cols"));
  return {sec: sec, cols: cols};
}
function textBlock(title, sub, paragraphs){
  var b = el("article", "ps-entry");
  var h = add(b, el("h3", null, title));
  if(sub) add(h, el("span", "ps-dim", " " + sub));
  paragraphs.filter(Boolean).forEach(function(t){
    String(t).split(/\n{2,}/).forEach(function(par){ add(b, el("p", null, par)); });
  });
  return b;
}

function buildFlowPages(data, sections, carry, c){
  var out = [];
  // What didn't fit in the fixed boxes comes first.
  var cont = flowSection("Continued from the sheet");
  var any = false;
  if(carry.personality.length){ any = true; carry.personality.forEach(function(p){ add(cont.cols, textBlock(p.label, "", [p.text])); }); }
  if(carry.other.length){ any = true; add(cont.cols, textBlock("Other Proficiencies & Languages", "", carry.other.map(function(l){ return l.label + ": " + l.text; }))); }
  if(carry.attacks.length){ any = true; add(cont.cols, textBlock("Attacks", "", carry.attacks.map(function(a){ return a.name + ": " + a.bonus + " to hit, " + a.damage; }))); }
  if(carry.equipment.length){ any = true; add(cont.cols, textBlock("Equipment", "", [carry.equipment.map(function(i){ return (i.qty > 1 ? i.qty + " " : "") + i.name; }).join(", ")])); }
  if(carry.features.length){
    any = true;
    add(cont.cols, textBlock("Features & Traits", "", carry.features.map(function(x){
      var f = x.feature, u = x.use;
      return (f ? f.name + (f.source ? " (" + f.source + ")" : "") : u.name) + (u ? ": " + u.max + " per " + u.reset : "");
    })));
  }
  if(carry.backstory.length){ any = true; carry.backstory.forEach(function(r){ add(cont.cols, textBlock(r.label, "", [r.text])); }); }
  if(carry.spells.length){
    any = true;
    add(cont.cols, textBlock("Spells", "", carry.spells.map(function(s){ return (s.level === 0 ? "Cantrip" : "Level " + s.level) + ": " + s.name + (s.prepared && s.level > 0 ? " (prepared)" : ""); })));
  }
  if(any) out.push(cont.sec);

  if(sections.featureText && data.featureTexts.length){
    var f = flowSection("Features & Traits");
    data.featureTexts.forEach(function(x){ add(f.cols, textBlock(x.name, x.source, [x.text])); });
    out.push(f.sec);
  }
  if(sections.spellText && data.spellTexts.length){
    var s = flowSection("Spells");
    data.spellTexts.forEach(function(x){
      add(s.cols, textBlock(x.name, x.line + (x.note ? " · " + x.note : ""), [x.meta.join(" · "), x.text, x.scaling]));
    });
    out.push(s.sec);
  }
  if(sections.companions){
    var comps = characterCompanions(c).filter(function(x){ return x.stats; });   // (a choice still to make has none yet)
    if(comps.length){
      var cs = flowSection("Companions");
      comps.forEach(function(x){ add(cs.cols, companionBlock(x)); });
      out.push(cs.sec);
    }
  }
  if(sections.journal && data.journal.length){
    var j = flowSection("Journal");
    data.journal.forEach(function(n){ add(j.cols, textBlock(n.title || "Note", "", [n.text])); });
    out.push(j.sec);
  }
  return out;
}

/* A companion's stat block, compact, with the fields the Companions
   tab shows (render/panels/companions.js renderStatBlock). */
function signed(n){ n = Number(n) || 0; return (n >= 0 ? "+" : "") + n; }
function diceText(dice, bonus){ return (dice || "") + (bonus ? signed(bonus) : ""); }
function companionBlock(comp){
  var s = comp.stats, b = el("article", "ps-entry ps-statblock");
  add(b, el("h3", null, (comp.name || comp.def.name || "Companion") + (s.count > 1 ? " ×" + s.count : "")));
  add(b, el("p", "ps-dim", [comp.name ? comp.def.name : "", s.type].filter(Boolean).join(", ")));
  add(b, el("p", null, ["AC " + s.ac, "HP " + s.hp, "Speed " + s.speed].join(" · ")));
  if(s.abilities){
    add(b, el("p", null, ["str", "dex", "con", "int", "wis", "cha"].map(function(k){
      var v = Number(s.abilities[k]) || 10;
      return k.toUpperCase() + " " + v + " (" + signed(Math.floor((v - 10) / 2)) + ")";
    }).join("  ")));
  }
  [["Saves", s.saves], ["Skills", s.skills], ["Senses", s.senses], ["Languages", s.languages],
   ["Vulnerable", s.vulnerabilities], ["Resist", s.resistances], ["Immune", s.immunities]].forEach(function(f){
    if(f[1]) add(b, el("p", null, f[0] + ": " + f[1]));
  });
  function entry(name, text){
    var p = add(b, el("p"));
    add(p, el("b", null, name + ". "));
    add(p, document.createTextNode(text || ""));
  }
  (s.attacks || []).forEach(function(a){
    entry(a.name, signed(a.toHit) + " to hit. " + (a.text ? a.text + " " : "") + "Hit: " + diceText(a.dice, a.bonus) + " " + (a.damageType || "") + " damage" +
      (a.extraDice ? " plus " + a.extraDice + " " + a.extraType : "") + ".");
  });
  (s.actions || []).forEach(function(a){
    entry(a.name, [a.save ? a.save + " save." : "", a.dice ? diceText(a.dice, a.bonus) + "." : "", a.text].filter(Boolean).join(" "));
  });
  splitTraits(s.reactions).forEach(function(r){ entry(r.name || "Reaction", r.text); });
  splitTraits(s.traits).forEach(function(t){ entry(t.name || "Trait", t.text); });
  splitTraits(s.riding).forEach(function(t){ entry(t.name || "Riding", t.text); });
  return b;
}

/* ---- building and printing ---- */
export var PRINT_SECTIONS = [
  {key: "details", label: "Details page", hint: "Appearance, faith, backstory and treasure."},
  {key: "spells", label: "Spellcasting page", hint: "Save DC, slots and spells by level.", when: function(d){ return !!d.spellcasting; }},
  {key: "featureText", label: "Full feature text", hint: "Every feature, trait and feat in full."},
  {key: "spellText", label: "Full spell text", hint: "Every spell in full.", when: function(d){ return d.spellTexts.length > 0; }},
  {key: "companions", label: "Companions", hint: "Their stat blocks.", when: function(d, c){ return characterCompanions(c).length > 0; }},
  {key: "journal", label: "Journal", hint: "Your journal entries.", when: function(d){ return d.journal.length > 0; }, off: true}
];

function printRoot(){
  var root = document.getElementById("print-root");
  if(!root){
    root = el("div");
    root.id = "print-root";
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
  }
  return root;
}

/* Builds one character's pages into `root`. */
export function buildCharacterPages(c, sections, root, opts){
  opts = opts || {};
  var data = printSheetData(c, {playerName: opts.playerName || "", printedAt: opts.printedAt});
  var carry = {other: [], attacks: [], equipment: [], personality: [], features: [], backstory: [], spells: []};
  var doc = add(root, el("div", "ps-doc"));
  var p1 = buildPage1(data, carry);
  add(doc, p1.page);
  p1.fillLater();
  if(sections.details !== false){
    var p2 = buildPage2(data, carry);
    add(doc, p2.page);
    p2.fillLater();
  }
  if(sections.spells !== false && data.spellcasting){
    var p3 = buildPage3(data, carry);
    add(doc, p3.page);
  }
  buildFlowPages(data, sections, carry, c).forEach(function(sec){ add(doc, sec); });
  shrinkLines(doc);
  return {doc: doc, data: data};
}

/* The sections a character prints with: its saved choices, else on
   (journal off), and only those that apply. */
export function sectionsFor(c){
  var saved = (c.print && c.print.sections) || {};
  var data = printSheetData(c);
  var out = {};
  PRINT_SECTIONS.forEach(function(s){
    var applies = !s.when || s.when(data, c);
    out[s.key] = applies && (saved[s.key] !== undefined ? !!saved[s.key] : !s.off);
  });
  return out;
}

/* After printing the pages go. Not at once: some browsers say printing
   ended before they have finished with the pages, so a moment later,
   and not at all if another print starts meanwhile. */
var CLEAR_AFTER_MS = 1500;
var clearTimer = null;
function cancelClear(){ if(clearTimer){ clearTimeout(clearTimer); clearTimer = null; } }
function clearSoon(){ cancelClear(); clearTimer = setTimeout(clearAfterPrint, CLEAR_AFTER_MS); }
if(typeof window !== "undefined" && window.addEventListener){
  window.addEventListener("beforeprint", cancelClear);
  window.addEventListener("afterprint", function(){
    if(document.body && document.body.classList.contains("ps-printing")) clearSoon();
  });
}
function clearAfterPrint(){
  clearTimer = null;
  var root = document.getElementById("print-root");
  if(root) root.innerHTML = "";
  document.body.classList.remove("ps-printing");
  // Back to the edition of the character on screen.
  var active = getActive();
  if(active) useSpellsOf(active);
}

/* Prints these characters, one after another. */
export function printCharacters(chars, sectionsOf){
  var root = printRoot();
  root.innerHTML = "";
  document.body.classList.add("ps-printing");
  chars.forEach(function(c){
    buildCharacterPages(c, sectionsOf ? sectionsOf(c) : sectionsFor(c), root, {playerName: (c.print && c.print.player) || ""});
  });
  var active = getActive();
  if(active) useSpellsOf(active);
  cancelClear();
  if(typeof window.print === "function") window.print();
}

/* The identity card's "Print sheet". */
export function openPrintDialog(c){
  var data = printSheetData(c);
  var chosen = sectionsFor(c);
  openInfoModal("Print sheet", function(body){
    body.classList.add("ps-dialog");
    add(body, el("p", "ps-dialog-intro", "Prints the classic three-page character sheet, filled in, with the pages you pick below."));
    var list = add(body, el("div", "ps-dialog-list"));
    PRINT_SECTIONS.forEach(function(s){
      if(s.when && !s.when(data, c)) return;
      var row = add(list, el("label", "ps-dialog-row"));
      var cb = add(row, el("input", "chk"));
      cb.type = "checkbox"; cb.checked = !!chosen[s.key];
      cb.addEventListener("change", function(){ chosen[s.key] = cb.checked; });
      var txt = add(row, el("span"));
      add(txt, el("b", null, s.label));
      add(txt, el("span", "ps-dialog-hint", s.hint));
    });
    var nameRow = add(body, el("label", "field ps-dialog-player"));
    add(nameRow, el("span", "ps-dialog-label", "Player name (optional)"));
    var input = add(nameRow, el("input"));
    input.type = "text"; input.maxLength = 40;
    input.value = (c.print && c.print.player) || "";
    input.setAttribute("aria-label", "Player name");
    add(body, el("p", "ps-dialog-hint", "To keep a PDF, choose Save as PDF in the print window."));
    var actions = add(body, el("div", "actions"));
    var go = add(actions, el("button", "btn primary", "Print"));
    go.type = "button";
    go.addEventListener("click", function(){
      c.print = {player: input.value.trim(), sections: Object.assign({}, chosen)};
      save();
      document.getElementById("info-modal").classList.remove("open");
      printCharacters([c], function(){ return chosen; });
    });
  });
}
