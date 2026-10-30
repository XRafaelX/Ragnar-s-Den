import { ce, escapeHtml } from "../core/helpers.js";
import { makeBookSvg, makeChevronDownSvg, makeCheckSvg } from "./svg-icons.js";
import { CAMPAIGN_FEATS } from "../data/feats.js";

/* ---------------- "DLC" shelf ----------------
   Optional books kept out of the way behind one tile: the tile (an icon,
   a name, a line saying what is in use, a DLC badge) slides open onto a
   card per book; tapping a card turns it on, tapping it again turns it
   off, and a line under the cards says what that gives this character.
   Shared by the creation wizard's Campaign books (Background step) and
   the sheet's Optional rules (Information tab). Styles: .wiz-dlc-* in
   css/overlays/wizard.css.

   dlcShelf(opts) returns {el, refresh(tapped)}:
     id        the panel's id (the tile points at it)
     title     the tile's name
     sub()     the tile's second line, for the current state
     lead      the line above the cards
     cards     [{key, series, title, perks: [text], text, switchLabel}]:
               `series` is the small line over the title, `perks` the
               pills, `text` an optional sentence under them, and
               `switchLabel` names the card as an on/off switch for
               screen readers (otherwise it is a pressed button)
     isOn(key) whether a card is in use
     onTap(key)  the card was tapped: change the state. The shelf then
               refreshes itself, unless the caller redraws everything
     outcome() html for the line under the cards ("" hides it)
     open      start open
     onToggle(open)  the tile was opened or closed by hand
     fresh     the card tapped just before a full redraw: it and the
               outcome line play their entrance once more
     wide      room for three cards in a row
   The entrances only play once the tile has been opened by hand, so a
   redraw with the shelf already open doesn't replay them. */
export function dlcShelf(opts){
  var wrap = ce("div", "wiz-dlc" + (opts.wide ? " wiz-dlc-wide" : ""));
  var tile = document.createElement("button");
  tile.type = "button";
  tile.className = "wiz-dlc-tile";
  tile.setAttribute("aria-controls", opts.id);
  tile.innerHTML = "<span class='wiz-dlc-icon'>"+makeBookSvg()+"</span>"+
    "<span class='wiz-dlc-text'><b>"+escapeHtml(opts.title)+"</b><span class='wiz-dlc-sub'></span></span>"+
    "<span class='wiz-dlc-badge'>DLC</span><span class='wiz-dlc-chevron'>"+makeChevronDownSvg()+"</span>";
  var sub = tile.querySelector(".wiz-dlc-sub");
  var panel = ce("div", "wiz-dlc-panel");
  panel.id = opts.id;
  var inner = ce("div", "wiz-dlc-inner");
  var lead = ce("p", "wiz-dlc-lead");
  lead.textContent = opts.lead;
  inner.appendChild(lead);
  var grid = ce("div", "wiz-dlc-grid");
  var cards = {};
  opts.cards.forEach(function(def){
    var card = document.createElement("button");
    card.type = "button";
    card.className = "wiz-dlc-card";
    if(def.switchLabel){ card.setAttribute("role", "switch"); card.setAttribute("aria-label", def.switchLabel); }
    card.innerHTML = "<span class='wiz-dlc-check'>"+makeCheckSvg()+"</span>"+
      "<span class='wiz-dlc-series'>"+escapeHtml(def.series)+"</span>"+
      "<strong>"+escapeHtml(def.title)+"</strong>"+
      "<span class='wiz-dlc-perks'>"+(def.perks||[]).map(function(p){ return "<span>"+escapeHtml(p)+"</span>"; }).join("")+"</span>"+
      (def.text ? "<span class='wiz-dlc-desc'>"+escapeHtml(def.text)+"</span>" : "")+
      "<span class='wiz-dlc-state'></span>";
    card.addEventListener("click", function(){
      opts.onTap(def.key);
      refresh(def.key);
    });
    cards[def.key] = card;
    grid.appendChild(card);
  });
  inner.appendChild(grid);
  var outcome = ce("div", "wiz-dlc-outcome");
  outcome.setAttribute("aria-live", "polite");
  inner.appendChild(outcome);
  panel.appendChild(inner);
  /* `tapped` is the card just used, so only it and the outcome animate. */
  function refresh(tapped){
    var any = false;
    opts.cards.forEach(function(def){
      var on = !!opts.isOn(def.key), card = cards[def.key];
      any = any || on;
      card.classList.toggle("on", on);
      card.classList.toggle("fresh", on && tapped===def.key);
      card.setAttribute(def.switchLabel ? "aria-checked" : "aria-pressed", on ? "true" : "false");
      card.querySelector(".wiz-dlc-state").textContent = on ? "In use. Tap to turn off" : "Tap to use";
    });
    wrap.classList.toggle("has-book", any);
    sub.textContent = opts.sub();
    outcome.innerHTML = opts.outcome();
    outcome.hidden = !outcome.innerHTML;
    if(tapped && !outcome.hidden){
      outcome.classList.remove("fresh");
      void outcome.offsetWidth; // restart the entrance
      outcome.classList.add("fresh");
    }
  }
  function setOpen(open){
    wrap.classList.toggle("open", open);
    tile.setAttribute("aria-expanded", open ? "true" : "false");
  }
  tile.addEventListener("click", function(){
    wrap.classList.add("moved"); // entrances only play once it has been opened by hand
    var open = !wrap.classList.contains("open");
    setOpen(open);
    if(opts.onToggle) opts.onToggle(open);
  });
  wrap.appendChild(tile);
  wrap.appendChild(panel);
  setOpen(!!opts.open);
  refresh(opts.fresh);
  return {el: wrap, refresh: refresh};
}

/* The Gunslinger class's optional misfire rule (c.gunMisfire), offered
   only to a character with that class. See firearmStats in
   js/core/equipment.js. */
export var GUN_MISFIRE_CARD = {key: "gunMisfire", series: "Gunslinger class", title: "Firearm misfires", switchLabel: "Use firearm misfires",
  perks: ["Guns can jam on a 1", "An action clears it", "Gone at level 2"],
  text: "The Handcannon, Long Gun and Spread Shot jam on an attack roll of 1. Clearing a jam takes an action and always works. Master of Arms (gunslinger level 2) stops your guns from misfiring."};
export var GUN_MISFIRE_OUTCOME = "<b>Misfires:</b> your Handcannon, Long Gun and Spread Shot jam on a roll of 1 until Master of Arms at gunslinger level 2. Clearing a jam takes an action.";

/* A campaign book (see CAMPAIGN_FEATS) as a shelf card: "Dragonlance"
   over its title, and what it gives. */
export function campaignBookCard(k){
  var camp = CAMPAIGN_FEATS[k], parts = camp.label.split(": ");
  return {key: k, series: parts.length>1 ? parts[0] : "Campaign book", title: parts[parts.length-1],
    perks: ["Free feat at level 1"].concat(camp.level4 ? ["Another feat at level 4"] : [])};
}
