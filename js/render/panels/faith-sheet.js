/* The Faith tile's sheet (Personality card): the gods as cards, a tab
   per pantheon. A cleric with a domain gets a first tab of the gods who
   suit it, and that domain lit on every card. Each card: an alignment
   badge (gold good, grey neutral, red evil), the name and title, what
   the god rules, the holy symbol and the suggested domains. Tap one to
   choose it, or write your own below. The list keeps one height, so
   switching tabs never moves the sheet. */
import { ce } from "../../core/helpers.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { faithTabs, clericDomains, godsForDomains } from "../../core/faith.js";

var SYMBOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/></svg>';
var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* `current` is the saved faith; `done(text)` saves a pick ("" clears). */
export function openFaithSheet(c, current, done){
  var mine = clericDomains(c), tabs = faithTabs();
  var suited = godsForDomains(mine);
  if(suited.length) tabs.unshift({label: mine.join(" & ") + " Domain", mine: true, sections: [{label: "", gods: suited}]});
  // Open on the tab holding the chosen god, else the domain's, else the first.
  var active = Math.max(0, tabs.findIndex(function(t){
    return !t.mine && t.sections.some(function(s){ return s.gods.some(function(g){ return g.text === current; }); });
  }));
  if(suited.length && !tabs[active].sections.some(function(s){ return s.gods.some(function(g){ return g.text === current; }); })) active = 0;

  openBottomSheet(function(body, refresh, close){
    var header = ce("div", "bs-header");
    var title = ce("h3", "prep-title");
    title.textContent = "Faith";
    header.appendChild(title);
    var x = ce("button", "bs-close");
    x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "Close");
    x.addEventListener("click", close);
    header.appendChild(x);
    body.appendChild(header);
    function pick(v){ done(v); close(); }

    var pills = ce("div", "ff-pill-row faith-tabs");
    pills.setAttribute("role", "tablist");
    var list = ce("div", "faith-list");
    list.setAttribute("role", "tabpanel");
    function draw(){
      pills.innerHTML = "";
      tabs.forEach(function(t, i){
        var p = ce("button", "ff-pill" + (i === active ? " active" : "") + (t.mine ? " faith-tab-mine" : ""));
        p.type = "button";
        p.setAttribute("role", "tab");
        p.setAttribute("aria-selected", i === active ? "true" : "false");
        if(t.mine){ var star = ce("span", "faith-tab-star"); star.innerHTML = SYMBOL; p.appendChild(star); }
        p.appendChild(document.createTextNode(t.label));
        if(t.mine) p.title = "Gods who suit your " + t.label;
        p.addEventListener("click", function(){ if(active !== i){ active = i; draw(); list.scrollTop = 0; } });
        pills.appendChild(p);
      });
      list.innerHTML = "";
      tabs[active].sections.forEach(function(s){
        if(s.label){ var h = ce("p", "faith-section"); h.textContent = s.label; list.appendChild(h); }
        s.gods.forEach(function(g){ list.appendChild(godCard(g, g.text === current, mine, pick)); });
      });
    }
    draw();
    body.appendChild(pills);
    body.appendChild(list);
    // A phone can't fit every tab: the row scrolls sideways, fading at the
    // edge while more tabs lie beyond it, and the open tab is brought in.
    function edge(){ pills.classList.toggle("fade-end", pills.scrollLeft + pills.clientWidth < pills.scrollWidth - 2); }
    pills.addEventListener("scroll", edge, {passive: true});
    requestAnimationFrame(function(){
      var on = pills.querySelector(".active");
      if(on && on.offsetLeft + on.offsetWidth > pills.clientWidth) pills.scrollLeft = on.offsetLeft - 12;
      edge();
    });

    var own = ce("p", "story-own-label");
    own.textContent = "Or write your own";
    body.appendChild(own);
    var ta = ce("textarea", "story-own");
    ta.rows = 2; ta.maxLength = 400;
    ta.setAttribute("aria-label", "Faith in your own words");
    var known = tabs.some(function(t){ return t.sections.some(function(s){ return s.gods.some(function(g){ return g.text === current; }); }); });
    ta.value = current && !known ? current : "";
    body.appendChild(ta);
    var actions = ce("div", "prep-actions");
    if(current){
      var clear = ce("button", "btn small ghost");
      clear.type = "button"; clear.textContent = "Clear";
      clear.addEventListener("click", function(){ pick(""); });
      actions.appendChild(clear);
    }
    var saveBtn = ce("button", "btn small primary");
    saveBtn.type = "button"; saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", function(){ var v = ta.value.trim(); if(v) pick(v); else close(); });
    actions.appendChild(saveBtn);
    body.appendChild(actions);
  });
}

function godCard(g, selected, mine, pick){
  var card = ce("button", "faith-god is-" + g.moral + (selected ? " selected" : ""));
  card.type = "button";
  card.setAttribute("aria-pressed", selected ? "true" : "false");
  var badge = ce("span", "faith-align");
  badge.textContent = g.alignment;
  badge.title = g.alignmentName;
  card.appendChild(badge);
  var main = ce("span", "faith-main");
  var head = ce("span", "faith-head");
  var name = ce("span", "faith-name"); name.textContent = g.name;
  head.appendChild(name);
  if(g.title){ var t = ce("span", "faith-title"); t.textContent = g.title; head.appendChild(t); }
  main.appendChild(head);
  if(g.about){ var a = ce("span", "faith-about"); a.textContent = g.about.charAt(0).toUpperCase() + g.about.slice(1); main.appendChild(a); }
  if(g.symbol){
    var sym = ce("span", "faith-symbol");
    sym.title = "Holy symbol";
    sym.innerHTML = SYMBOL;
    sym.appendChild(document.createTextNode(g.symbol));
    main.appendChild(sym);
  }
  var doms = ce("span", "faith-domains");
  g.domains.forEach(function(d){
    var chip = ce("span", "faith-domain" + (mine.indexOf(d) !== -1 ? " is-mine" : ""));
    chip.textContent = d;
    if(mine.indexOf(d) !== -1) chip.title = "Your domain";
    doms.appendChild(chip);
  });
  main.appendChild(doms);
  card.appendChild(main);
  if(selected){ var tick = ce("span", "faith-tick"); tick.innerHTML = TICK; card.appendChild(tick); }
  card.setAttribute("aria-label", g.name + (g.title ? ", " + g.title : "") + ". " + g.alignmentName + ". Domains: " + g.domains.join(", "));
  card.addEventListener("click", function(){ pick(g.text); });
  return card;
}
