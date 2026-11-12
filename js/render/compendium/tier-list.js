/* ---------------- Compendium: Tier list (secret) ----------------
   Only added to the Compendium while the tier list switch is on
   (js/core/tier-list-switch.js, held centre die). Two views:
   - Classes: the classes in rows S to D for one rules edition and one
     band of levels (js/data/tier-list.js).
   - Subclasses: one class's subclasses, picked from a dropdown, rated
     against each other (js/data/tier-list-subclasses.js). The list is
     the one the app offers for that edition (subclassesFor), so the
     private Shadow Stalker only shows while the private content is on.
   Tapping an entry shows its letter in every band, the reason, and its
   Compendium details; a class's also jumps to its subclass tiers.
   Motion (none under prefers-reduced-motion): each redraw is compared
   with the one before it (snapshot). Chips still on the page fly from
   where they were to their new spot (FLIP), and one that changed tier
   gets a short ▲ or ▼ badge and a flash; new chips and rows come in one
   after another; the switches' highlight slides to the new option. */
import { openInfoModal } from "../../ui/info-modal.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { CLASS_LIST } from "../../data/abilities-skills.js";
import { CLASS_TIERS, TIER_LETTERS, TIER_BANDS } from "../../data/tier-list.js";
import { subclassRating } from "../../data/tier-list-subclasses.js";
import { escapeHtml, subclassesFor } from "../../core/helpers.js";
import { showClass, showSubclass } from "./classes.js";
import { closeInfo } from "./shared.js";

var MODES = [["classes", "Classes"], ["subclasses", "Subclasses"]];
var EDITIONS = [["2014", "2014 rules"], ["2024", "2024 rules"]];
var view = {mode: "classes", edition: "2014", band: TIER_BANDS[0].key, cls: ""};
var current = null;   // the element the tab is drawn in
var observers = [];   // the switches' ResizeObservers, dropped on each redraw
function redraw(){ if(current) draw(current); }
function reducedMotion(){
  try{ return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; }
}
function animate(el, frames, opts){ if(el.animate) el.animate(frames, opts); }
var EASE = "cubic-bezier(.2,.8,.2,1)";

function segmented(options, value, label, onPick){
  var bar = document.createElement("div");
  bar.className = "cmp-edition tier-seg";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", label);
  // The highlight behind the picked option (placed by placeHighlight).
  var ind = document.createElement("span");
  ind.className = "tier-seg-ind";
  ind.setAttribute("aria-hidden", "true");
  bar.appendChild(ind);
  options.forEach(function(o){
    var b = document.createElement("button");
    b.type = "button";
    // o[2]: words a phone leaves out ("Levels "), kept for screen readers.
    b.innerHTML = (o[2] ? "<span class='tier-hide-narrow'>" + escapeHtml(o[2]) + "</span>" : "") + escapeHtml(o[1]);
    b.className = value === o[0] ? "on" : "";
    b.setAttribute("aria-pressed", value === o[0] ? "true" : "false");
    b.addEventListener("click", function(){ if(value !== o[0]) onPick(o[0]); });
    bar.appendChild(b);
  });
  return bar;
}

/* The rating sheet: the letter in each band, the reason, and buttons
   [{label, onClick}]. */
function showRating(title, entry, buttons){
  openInfoModal(title + " (" + view.edition + " rules)", function(body){
    var strip = document.createElement("div");
    strip.className = "tier-strip";
    strip.innerHTML = TIER_BANDS.map(function(b, i){
      var t = entry.tiers[i];
      return "<div class='tier-strip-cell tier-" + t + (b.key === view.band ? " current" : "") + "'><span class='tier-letter tier-" + t + "'>" + t + "</span>" +
        "<span class='tier-strip-band'>" + escapeHtml(b.label) + "</span></div>";
    }).join("");
    body.appendChild(strip);
    var why = document.createElement("p");
    why.className = "cmp-lead";
    why.textContent = entry.why;
    body.appendChild(why);
    var actions = document.createElement("div");
    actions.className = "tier-actions";
    buttons.forEach(function(btn){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn small ghost";
      b.textContent = btn.label;
      b.addEventListener("click", btn.onClick);
      actions.appendChild(b);
    });
    body.appendChild(actions);
  });
}

/* What the view lists: [{label, entry, open}] and the names with no rating. */
function entries(){
  var ed = view.edition, edArg = ed === "2024" ? "2024" : "";
  if(view.mode === "classes"){
    var ratings = CLASS_TIERS[ed];
    return {
      items: CLASS_LIST.filter(function(n){ return ratings[n]; }).map(function(n){
        return {label: n, entry: ratings[n], open: function(){
          showRating(n, ratings[n], [
            {label: "Class details", onClick: function(){ showClass(n, edArg); }},
            {label: "Subclass tiers", onClick: function(){ closeInfo(); view.mode = "subclasses"; view.cls = n; redraw(); }}
          ]);
        }};
      }),
      unrated: CLASS_LIST.filter(function(n){ return !ratings[n]; })
    };
  }
  var cls = view.cls, items = [], unrated = [];
  subclassesFor(cls, ed).forEach(function(sub){
    // In the 2024 list the 2024 version is the plain name.
    var label = sub.name.replace(/ \(2024\)$/, "");
    var entry = subclassRating(cls, sub.name);
    if(!entry){ unrated.push(label); return; }
    items.push({label: label, entry: entry, open: function(){
      showRating(label, entry, [{label: "Subclass details", onClick: function(){ showSubclass(cls, sub, edArg); }}]);
    }});
  });
  return {items: items, unrated: unrated};
}

/* Where things were before a redraw: each chip's box and tier (by key),
   each switch's highlight, and whether there was a page at all. */
function snapshot(el){
  var snap = {chips: {}, segs: {}, had: !!el.querySelector(".tier-view")};
  el.querySelectorAll(".tier-chip").forEach(function(c){
    snap.chips[c.dataset.key] = {rect: c.getBoundingClientRect(), tier: c.dataset.tier};
  });
  el.querySelectorAll(".tier-seg").forEach(function(bar){
    var ind = bar.querySelector(".tier-seg-ind");
    if(ind && ind.offsetWidth) snap.segs[bar.getAttribute("aria-label")] = boxOf(ind);
  });
  return snap;
}
function boxOf(n){ return {left: n.offsetLeft, top: n.offsetTop, width: n.offsetWidth, height: n.offsetHeight}; }

/* Put a switch's highlight behind its picked option, sliding from `from`. */
function placeHighlight(bar, from){
  var on = bar.querySelector("button.on"), ind = bar.querySelector(".tier-seg-ind");
  if(!on || !ind || !bar.offsetWidth) return;
  var to = boxOf(on);
  ["left", "top", "width", "height"].forEach(function(k){ ind.style[k] = to[k] + "px"; });
  if(from && !reducedMotion() && (from.left !== to.left || from.top !== to.top || from.width !== to.width)){
    animate(ind, [
      {left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px"},
      {left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px"}
    ], {duration: 340, easing: EASE});
  }
}

/* After a redraw: the switches' highlights, then the chips and rows. */
function animateView(el, before){
  observers.forEach(function(o){ o.disconnect(); });
  observers = [];
  el.querySelectorAll(".tier-seg").forEach(function(bar){
    placeHighlight(bar, before.segs[bar.getAttribute("aria-label")]);
    // Placed again whenever the bar's size changes (the page opening, a
    // narrower window, the phone layout).
    if(typeof ResizeObserver !== "undefined"){
      var ro = new ResizeObserver(function(){ placeHighlight(bar); });
      ro.observe(bar);
      observers.push(ro);
    }
  });
  if(reducedMotion()) return;
  if(!before.had){
    // A fresh page: the rows slide in and their letters pop, one after another.
    el.querySelectorAll(".tier-row").forEach(function(row, i){
      animate(row, [{opacity: 0, transform: "translateX(-14px)"}, {opacity: 1, transform: "none"}],
        {duration: 380, delay: i * 70, easing: EASE, fill: "backwards"});
      var letter = row.querySelector(".tier-letter");
      if(letter) animate(letter, [{transform: "scale(.4) rotate(-10deg)"}, {transform: "none"}],
        {duration: 460, delay: 80 + i * 70, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards"});
    });
  }
  var fresh = 0;
  el.querySelectorAll(".tier-chip").forEach(function(chip){
    var old = before.chips[chip.dataset.key];
    if(!old){
      animate(chip, [{opacity: 0, transform: "translateY(8px) scale(.95)"}, {opacity: 1, transform: "none"}],
        {duration: 320, delay: (before.had ? 0 : 140) + Math.min(fresh++, 24) * 24, easing: "ease-out", fill: "backwards"});
      return;
    }
    var now = chip.getBoundingClientRect();
    var dx = old.rect.left - now.left, dy = old.rect.top - now.top;
    if(dx || dy) animate(chip, [{transform: "translate(" + dx + "px," + dy + "px)"}, {transform: "none"}], {duration: 520, easing: EASE});
    if(old.tier !== chip.dataset.tier){
      var up = TIER_LETTERS.indexOf(chip.dataset.tier) < TIER_LETTERS.indexOf(old.tier);
      var badge = document.createElement("span");
      badge.className = "tier-move " + (up ? "up" : "down");
      badge.textContent = up ? "\u25B2" : "\u25BC";
      badge.setAttribute("aria-hidden", "true");
      chip.appendChild(badge);
      setTimeout(function(){ badge.remove(); }, 1900);
      var c = getComputedStyle(chip).getPropertyValue("--tier-c").trim() || "#fff";
      animate(chip, [{boxShadow: "0 0 0 2px " + c + ", 0 0 18px " + c}, {boxShadow: "0 0 0 0 transparent"}],
        {duration: 1100, delay: 380, easing: "ease-out"});
    }
  });
}

function draw(el){
  var before = snapshot(el);
  current = el;
  // A class hidden since (the private Gunslinger) falls back to the first.
  if(CLASS_LIST.indexOf(view.cls) === -1) view.cls = CLASS_LIST[0];
  el.innerHTML = "";
  var wrap = document.createElement("div");
  wrap.className = "tier-view";

  var controls = document.createElement("div");
  controls.className = "tier-controls";
  controls.appendChild(segmented(MODES, view.mode, "Rate", function(v){ view.mode = v; redraw(); }));
  controls.appendChild(segmented(EDITIONS, view.edition, "Rules edition", function(v){ view.edition = v; redraw(); }));
  controls.appendChild(segmented(TIER_BANDS.map(function(b){ return [b.key, b.key, "Levels "]; }), view.band, "Character level", function(v){ view.band = v; redraw(); }));
  wrap.appendChild(controls);

  if(view.mode === "subclasses"){
    var pick = document.createElement("div");
    pick.className = "tier-class-pick";
    pick.appendChild(themedPicker({
      key: "tier:class", groups: {"": CLASS_LIST.slice()}, value: view.cls, search: false, sheet: true,
      placeholder: "Choose a class", ariaLabel: "Class",
      onPick: function(v){ view.cls = v; redraw(); }
    }));
    wrap.appendChild(pick);
  }

  var lead = document.createElement("p");
  lead.className = "tier-lead";
  lead.textContent = view.mode === "classes"
    ? "Overall power at levels " + view.band + " with a strong build. Every class can shine at the table."
    : "How the " + view.cls + " subclasses compare with each other at levels " + view.band + ", with a strong build.";
  wrap.appendChild(lead);

  var list = entries();
  var band = TIER_BANDS.findIndex(function(b){ return b.key === view.band; });
  TIER_LETTERS.forEach(function(letter){
    var here = list.items.filter(function(it){ return it.entry.tiers[band] === letter; });
    // D, the bottom, only when something is there. The others always
    // show: an empty S says something too.
    if(letter === "D" && !here.length) return;
    var row = document.createElement("div");
    row.className = "tier-row tier-" + letter;
    row.innerHTML = "<span class='tier-letter tier-" + letter + "'>" + letter + "</span>";
    var chips = document.createElement("div");
    chips.className = "tier-chips";
    here.forEach(function(it){
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tier-chip";
      chip.textContent = it.label;
      // The same entry keeps its key across bands and editions, so it can fly to its new tier.
      chip.dataset.key = view.mode + ":" + (view.mode === "subclasses" ? view.cls + ":" : "") + it.label;
      chip.dataset.tier = letter;
      chip.addEventListener("click", it.open);
      chips.appendChild(chip);
    });
    if(!here.length) chips.innerHTML = "<span class='tier-empty'>None at these levels</span>";
    row.appendChild(chips);
    wrap.appendChild(row);
  });

  // A class with no rating yet, or a custom (homebrew) subclass.
  if(list.unrated.length){
    var note = document.createElement("p");
    note.className = "tier-unrated";
    note.textContent = (view.mode === "classes" ? "Not rated yet: " : "Not rated (custom): ") + list.unrated.join(", ") + ".";
    wrap.appendChild(note);
  }
  el.appendChild(wrap);
  animateView(el, before);
}

export function tierListSection(){
  return {key: "tiers", label: "Tier list", renderBody: draw};
}
