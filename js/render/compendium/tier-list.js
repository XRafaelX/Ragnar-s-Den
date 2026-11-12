/* ---------------- Compendium: Tier list (secret) ----------------
   Only added to the Compendium while the tier list switch is on
   (js/core/tier-list-switch.js, held centre die). The classes in rows S
   to D for one rules edition and one band of levels (js/data/tier-list.js).
   Tapping a class shows its letter in every band, the reason, and a way
   to its class details. */
import { openInfoModal } from "../../ui/info-modal.js";
import { CLASS_LIST } from "../../data/abilities-skills.js";
import { CLASS_TIERS, TIER_LETTERS, TIER_BANDS } from "../../data/tier-list.js";
import { escapeHtml } from "../../core/helpers.js";
import { showClass } from "./classes.js";

var EDITIONS = [["2014", "2014 rules"], ["2024", "2024 rules"]];
var view = {edition: "2014", band: TIER_BANDS[0].key};

function segmented(options, value, label, onPick){
  var bar = document.createElement("div");
  bar.className = "cmp-edition";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", label);
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

function showRating(name, edition){
  var entry = CLASS_TIERS[edition][name];
  openInfoModal(name + " (" + edition + " rules)", function(body){
    var strip = document.createElement("div");
    strip.className = "tier-strip";
    strip.innerHTML = TIER_BANDS.map(function(b, i){
      var t = entry.tiers[i];
      return "<div class='tier-strip-cell" + (b.key === view.band ? " current" : "") + "'><span class='tier-letter tier-" + t + "'>" + t + "</span>" +
        "<span class='tier-strip-band'>" + escapeHtml(b.label) + "</span></div>";
    }).join("");
    body.appendChild(strip);
    var why = document.createElement("p");
    why.className = "cmp-lead";
    why.textContent = entry.why;
    body.appendChild(why);
    var more = document.createElement("button");
    more.type = "button";
    more.className = "btn small ghost";
    more.textContent = "Class details";
    more.addEventListener("click", function(){ showClass(name, edition === "2024" ? "2024" : ""); });
    body.appendChild(more);
  });
}

function draw(el){
  el.innerHTML = "";
  var wrap = document.createElement("div");
  wrap.className = "tier-view";

  var controls = document.createElement("div");
  controls.className = "tier-controls";
  // The band bar gets its own class: on a phone it spreads to four equal columns.
  controls.appendChild(segmented(EDITIONS, view.edition, "Rules edition", function(v){ view.edition = v; draw(el); }));
  controls.appendChild(segmented(TIER_BANDS.map(function(b){ return [b.key, b.key, "Levels "]; }), view.band, "Character level", function(v){ view.band = v; draw(el); }));
  wrap.appendChild(controls);

  var lead = document.createElement("p");
  lead.className = "tier-lead";
  lead.textContent = "Overall power at levels " + view.band + " with a strong build. Every class can shine at the table.";
  wrap.appendChild(lead);

  var ratings = CLASS_TIERS[view.edition];
  var band = TIER_BANDS.findIndex(function(b){ return b.key === view.band; });
  var shown = CLASS_LIST.filter(function(n){ return ratings[n]; });
  TIER_LETTERS.forEach(function(letter){
    var here = shown.filter(function(n){ return ratings[n].tiers[band] === letter; });
    // D, the bottom, only when something is there (no class is, some subclasses are).
    // The others always show: an empty S says something too.
    if(letter === "D" && !here.length) return;
    var row = document.createElement("div");
    row.className = "tier-row";
    row.innerHTML = "<span class='tier-letter tier-" + letter + "'>" + letter + "</span>";
    var chips = document.createElement("div");
    chips.className = "tier-chips";
    here.forEach(function(n){
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tier-chip";
      chip.textContent = n;
      chip.addEventListener("click", function(){ showRating(n, view.edition); });
      chips.appendChild(chip);
    });
    row.appendChild(chips);
    wrap.appendChild(row);
  });

  // A class the app offers that has no rating in this edition yet.
  var unrated = CLASS_LIST.filter(function(n){ return !ratings[n]; });
  if(unrated.length){
    var note = document.createElement("p");
    note.className = "tier-unrated";
    note.textContent = "Not rated yet: " + unrated.join(", ") + ".";
    wrap.appendChild(note);
  }
  el.appendChild(wrap);
}

export function tierListSection(){
  return {key: "tiers", label: "Tier list", renderBody: draw};
}
