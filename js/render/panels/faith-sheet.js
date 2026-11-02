/* The Faith tile's sheet (Personality card): the gods as cards, a tab
   per pantheon, a search over all of them and a + for a god of your own.
   - Tabs: a cleric with a domain gets a first tab of the gods who suit
     it (that domain lit on every card), then "Your gods" when there are
     any, then the pantheons.
   - Search: typing searches every tab at once (name, title, alignment,
     what it rules, domains, symbol), the tabs stepping aside. Nothing
     found offers to add what was typed as a new god.
   - A card: the god's icon on a medallion (gold good, grey neutral, red
     evil), the name and title, its alignment and what it rules, the holy
     symbol and the domains. Tap one to choose it. Your own gods have a
     pencil to edit or delete them.
   - The + (or the pencil) opens the god form in the list's place: name,
     title, alignment (the nine as a grid), domains, holy symbol and an
     icon from the gods' icons. Adding a god chooses it.
   The list keeps one height in every mode, so nothing moves. */
import { ce } from "../../core/helpers.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { makePlusSvg } from "../../ui/svg-icons.js";
import { ALIGNMENT_NAMES } from "../../data/deities.js";
import { DEITY_ICONS } from "../../data/deity-icons.js";
import { faithTabs, faithShape, customGods, customGodText, clericDomains, godsForDomains, godIconSvg, iconSvg,
  searchGods, FAITH_DOMAINS } from "../../core/faith.js";

var SYMBOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/></svg>';
var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
var PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
var SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

/* `onChange()` saves the character and redraws the sheet behind. */
export function openFaithSheet(c, onChange){
  var s = faithShape(c);
  var mine = clericDomains(c);
  var query = "", mode = "browse", editing = null, active = -1;

  function tabsNow(){
    var tabs = faithTabs(), own = customGods(c);
    if(own.length) tabs.unshift({label: "Your gods", own: true, sections: [{label: "", gods: own}]});
    var suited = godsForDomains(mine, c);
    if(suited.length) tabs.unshift({label: mine.join(" & ") + " Domain", mine: true, sections: [{label: "", gods: suited}]});
    return tabs;
  }
  function holds(t, text){ return t.sections.some(function(x){ return x.gods.some(function(g){ return g.text === text; }); }); }
  // Open on the chosen god's tab (not the domain's), else the first.
  (function(){
    var tabs = tabsNow();
    active = Math.max(0, tabs.findIndex(function(t){ return !t.mine && holds(t, s.faith); }));
    if(tabs[0] && tabs[0].mine && !holds(tabs[active], s.faith)) active = 0;
  })();

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
    function pick(v){ s.faith = v; onChange(); close(); }

    // Search and +.
    var bar = ce("div", "faith-search-row");
    var field = ce("label", "faith-search");
    field.innerHTML = SEARCH;
    var input = ce("input", "faith-search-input");
    input.type = "search";
    input.placeholder = "Search gods, domains or symbols";
    input.setAttribute("aria-label", "Search the gods");
    input.autocomplete = "off";
    field.appendChild(input);
    bar.appendChild(field);
    var add = ce("button", "faith-add");
    add.type = "button";
    add.innerHTML = makePlusSvg();
    add.title = "Add your own god";
    add.setAttribute("aria-label", "Add your own god");
    add.addEventListener("click", function(){ openForm(null, input.value.trim()); });
    bar.appendChild(add);
    body.appendChild(bar);

    var pills = ce("div", "ff-pill-row faith-tabs");
    pills.setAttribute("role", "tablist");
    var list = ce("div", "faith-list");
    body.appendChild(pills);
    body.appendChild(list);

    input.addEventListener("input", function(){ query = input.value; draw(); list.scrollTop = 0; });

    function draw(){
      var tabs = tabsNow();
      if(active >= tabs.length) active = 0;
      var searching = mode === "browse" && query.trim();
      bar.classList.toggle("is-off", mode === "form");
      body.classList.toggle("faith-form-open", mode === "form");
      pills.classList.toggle("is-off", mode === "form");
      pills.classList.toggle("is-searching", !!searching);
      input.disabled = add.disabled = mode === "form";
      pills.innerHTML = "";
      tabs.forEach(function(t, i){
        var on = i === active && !searching;
        var p = ce("button", "ff-pill" + (on ? " active" : "") + (t.mine ? " faith-tab-mine" : ""));
        p.type = "button";
        p.disabled = mode === "form";
        p.setAttribute("role", "tab");
        p.setAttribute("aria-selected", on ? "true" : "false");
        if(t.mine){ var star = ce("span", "faith-tab-star"); star.innerHTML = SYMBOL; p.appendChild(star); }
        p.appendChild(document.createTextNode(t.label));
        if(t.mine) p.title = "Gods who suit your " + t.label;
        p.addEventListener("click", function(){
          // A tab ends a search.
          if(active === i && !searching) return;
          active = i; query = ""; input.value = "";
          draw(); list.scrollTop = 0;
        });
        pills.appendChild(p);
      });
      list.innerHTML = "";
      list.classList.toggle("is-form", mode === "form");
      if(mode === "form"){ list.appendChild(godForm()); return; }
      var sections = searching ? searchGods(query, c) : tabs[active].sections;
      if(searching && !sections.length){
        var none = ce("div", "faith-empty");
        var msg = ce("p");
        msg.textContent = "No god matches \"" + query.trim() + "\".";
        none.appendChild(msg);
        var mk = ce("button", "btn small ghost");
        mk.type = "button";
        mk.innerHTML = makePlusSvg();
        mk.appendChild(document.createTextNode("Add \"" + query.trim() + "\" as your own god"));
        mk.addEventListener("click", function(){ openForm(null, query.trim()); });
        none.appendChild(mk);
        list.appendChild(none);
        return;
      }
      sections.forEach(function(sec){
        if(sec.label){ var h = ce("p", "faith-section"); h.textContent = sec.label; list.appendChild(h); }
        sec.gods.forEach(function(g){ list.appendChild(godCard(g, g.text === s.faith, mine, pick, g.custom ? function(){ openForm(g.index); } : null)); });
      });
    }

    function edge(){ pills.classList.toggle("fade-end", pills.scrollLeft + pills.clientWidth < pills.scrollWidth - 2); }
    // A phone can't fit every tab: the row scrolls sideways, fading at the
    // edge while more tabs lie beyond it, and the open tab is brought in.
    function showActive(){
      var on = pills.querySelector(".active");
      if(on && on.offsetLeft + on.offsetWidth > pills.scrollLeft + pills.clientWidth) pills.scrollLeft = on.offsetLeft - 12;
      edge();
    }
    pills.addEventListener("scroll", edge, {passive: true});

    /* ---- The god form ---- */
    var draft = null, confirmDelete = false, error = "";
    function openForm(index, name){
      editing = index;
      var g = index === null ? null : s.customGods[index];
      draft = g ? {name: g.name || "", title: g.title || "", alignment: g.alignment || "", domains: (g.domains || []).slice(), symbol: g.symbol || "", icon: g.icon || ""}
        : {name: name || "", title: "", alignment: "", domains: [], symbol: "", icon: ""};
      confirmDelete = false; error = "";
      mode = "form";
      draw();
      list.scrollTop = 0;
      var first = list.querySelector("input");
      if(first) first.focus();
    }
    function backToList(tabLabel){
      mode = "browse"; editing = null; draft = null;
      query = ""; input.value = "";
      if(tabLabel){ var i = tabsNow().findIndex(function(t){ return t.label === tabLabel; }); if(i !== -1) active = i; }
      draw();
      requestAnimationFrame(showActive);
    }
    function textField(label, key, placeholder, max){
      var wrap = ce("label", "faith-field");
      var l = ce("span", "faith-field-label"); l.textContent = label;
      wrap.appendChild(l);
      var inp = ce("input", "faith-input");
      inp.type = "text"; inp.maxLength = max; inp.placeholder = placeholder;
      inp.value = draft[key];
      inp.addEventListener("input", function(){ draft[key] = inp.value; if(error){ error = ""; var e = list.querySelector(".faith-error"); if(e) e.textContent = ""; } });
      wrap.appendChild(inp);
      return wrap;
    }
    function godForm(){
      var f = ce("form", "faith-form");
      f.noValidate = true;
      var h = ce("p", "faith-section");
      h.textContent = editing === null ? "New god" : "Edit god";
      f.appendChild(h);
      f.appendChild(textField("Name", "name", "Sol", 60));
      f.appendChild(textField("Title or what they rule", "title", "goddess of the harvest", 80));

      var alWrap = ce("div", "faith-field");
      var alLabel = ce("span", "faith-field-label"); alLabel.textContent = "Alignment";
      alWrap.appendChild(alLabel);
      // The nine as the classic grid (lawful to chaotic across, good to
      // evil down), each in its medallion colour. Tap the chosen one again
      // for none. No dropdown: the form scrolls, and it would be cut off.
      var alGrid = ce("div", "faith-align-grid");
      alGrid.setAttribute("role", "radiogroup");
      alGrid.setAttribute("aria-label", "Alignment");
      ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"].forEach(function(k){
        var b = ce("button", "faith-align-pick is-" + (/G$/.test(k) ? "good" : /E$/.test(k) ? "evil" : "neutral") + (draft.alignment === k ? " selected" : ""));
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", draft.alignment === k ? "true" : "false");
        b.textContent = ALIGNMENT_NAMES[k];
        b.addEventListener("click", function(){
          draft.alignment = draft.alignment === k ? "" : k;
          alGrid.querySelectorAll(".faith-align-pick").forEach(function(o){
            var on = o === b && draft.alignment === k;
            o.classList.toggle("selected", on);
            o.setAttribute("aria-checked", on ? "true" : "false");
          });
        });
        alGrid.appendChild(b);
      });
      alWrap.appendChild(alGrid);
      f.appendChild(alWrap);

      var domWrap = ce("div", "faith-field");
      var domLabel = ce("span", "faith-field-label"); domLabel.textContent = "Domains";
      domWrap.appendChild(domLabel);
      var chips = ce("div", "faith-domains faith-domain-picks");
      FAITH_DOMAINS.forEach(function(d){
        var on = draft.domains.indexOf(d) !== -1;
        var b = ce("button", "faith-domain" + (on ? " is-on" : "") + (mine.indexOf(d) !== -1 ? " is-mine-hint" : ""));
        b.type = "button"; b.textContent = d;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.addEventListener("click", function(){
          var i = draft.domains.indexOf(d);
          if(i === -1) draft.domains.push(d); else draft.domains.splice(i, 1);
          b.classList.toggle("is-on", i === -1);
          b.setAttribute("aria-pressed", i === -1 ? "true" : "false");
        });
        chips.appendChild(b);
      });
      domWrap.appendChild(chips);
      f.appendChild(domWrap);
      f.appendChild(textField("Holy symbol", "symbol", "a golden sheaf of wheat", 120));

      var icWrap = ce("div", "faith-field");
      var icLabel = ce("span", "faith-field-label"); icLabel.textContent = "Icon";
      icWrap.appendChild(icLabel);
      var grid = ce("div", "faith-icon-grid");
      grid.setAttribute("role", "radiogroup");
      grid.setAttribute("aria-label", "Icon");
      [""].concat(Object.keys(DEITY_ICONS)).forEach(function(k){
        var b = ce("button", "faith-icon-pick" + (draft.icon === k ? " selected" : ""));
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", draft.icon === k ? "true" : "false");
        var label = k ? k.split("/")[1].replace(/-\d+$/, "").replace(/-/g, " ") : "star";
        b.title = label; b.setAttribute("aria-label", label);
        b.innerHTML = k ? iconSvg(k) : godIconSvg({custom: true});
        b.addEventListener("click", function(){
          draft.icon = k;
          grid.querySelectorAll(".faith-icon-pick").forEach(function(o){ o.classList.toggle("selected", o === b); o.setAttribute("aria-checked", o === b ? "true" : "false"); });
        });
        grid.appendChild(b);
      });
      icWrap.appendChild(grid);
      f.appendChild(icWrap);

      var err = ce("p", "faith-error");
      err.setAttribute("role", "alert");
      err.textContent = error;
      f.appendChild(err);

      var actions = ce("div", "prep-actions faith-form-actions");
      if(editing !== null){
        var del = ce("button", "btn small ghost faith-delete" + (confirmDelete ? " is-armed" : ""));
        del.type = "button";
        del.textContent = confirmDelete ? "Tap again to delete" : "Delete";
        del.addEventListener("click", function(){
          if(!confirmDelete){ confirmDelete = true; del.classList.add("is-armed"); del.textContent = "Tap again to delete"; return; }
          var gone = customGodText(s.customGods[editing]);
          s.customGods.splice(editing, 1);
          if(s.faith === gone) s.faith = "";
          onChange();
          backToList(s.customGods.length ? "Your gods" : null);
        });
        actions.appendChild(del);
      }
      var cancel = ce("button", "btn small ghost");
      cancel.type = "button"; cancel.textContent = "Cancel";
      cancel.addEventListener("click", function(){ backToList(editing !== null ? "Your gods" : null); });
      actions.appendChild(cancel);
      var ok = ce("button", "btn small primary");
      ok.type = "submit"; ok.textContent = editing === null ? "Add god" : "Save";
      actions.appendChild(ok);
      f.appendChild(actions);

      f.addEventListener("submit", function(e){
        e.preventDefault();
        var g = {name: draft.name.trim(), title: draft.title.trim(), alignment: draft.alignment, domains: FAITH_DOMAINS.filter(function(d){ return draft.domains.indexOf(d) !== -1; }),
          symbol: draft.symbol.trim(), icon: draft.icon};
        var text = customGodText(g);
        if(!g.name){ error = "Give your god a name."; err.textContent = error; f.querySelector("input").focus(); return; }
        if(s.customGods.some(function(o, i){ return i !== editing && customGodText(o) === text; })){ error = "You already have a god called " + text + "."; err.textContent = error; return; }
        if(editing === null){
          s.customGods.push(g);
          pick(text);
          return;
        }
        var was = customGodText(s.customGods[editing]);
        s.customGods[editing] = g;
        if(s.faith === was) s.faith = text;
        onChange();
        backToList("Your gods");
      });
      return f;
    }

    draw();
    requestAnimationFrame(showActive);

    if(s.faith){
      var actions = ce("div", "prep-actions faith-actions");
      var clear = ce("button", "btn small ghost");
      clear.type = "button"; clear.textContent = "Clear my faith";
      clear.addEventListener("click", function(){ pick(""); });
      actions.appendChild(clear);
      body.appendChild(actions);
    }
  });
}

function godCard(g, selected, mine, pick, edit){
  var wrap = ce("div", "faith-god-wrap");
  var card = ce("button", "faith-god is-" + g.moral + (selected ? " selected" : "") + (edit ? " is-own" : ""));
  card.type = "button";
  card.setAttribute("aria-pressed", selected ? "true" : "false");
  var badge = ce("span", "faith-align");
  badge.innerHTML = godIconSvg(g);
  if(!badge.innerHTML) badge.textContent = g.alignment;
  if(g.alignmentName) badge.title = g.alignmentName;
  card.appendChild(badge);
  var main = ce("span", "faith-main");
  var head = ce("span", "faith-head");
  var name = ce("span", "faith-name"); name.textContent = g.name;
  head.appendChild(name);
  if(g.title){ var t = ce("span", "faith-title"); t.textContent = g.title; head.appendChild(t); }
  main.appendChild(head);
  // "Neutral Good · Healing, sun": the alignment in the medallion's colour.
  if(g.alignmentName || g.about){
    var a = ce("span", "faith-about");
    if(g.alignmentName){ var al = ce("span", "faith-alignment"); al.textContent = g.alignmentName; a.appendChild(al); }
    if(g.about) a.appendChild(document.createTextNode((g.alignmentName ? " · " : "") + g.about.charAt(0).toUpperCase() + g.about.slice(1)));
    main.appendChild(a);
  }
  if(g.symbol){
    var sym = ce("span", "faith-symbol");
    sym.title = "Holy symbol";
    sym.innerHTML = SYMBOL;
    sym.appendChild(document.createTextNode(g.symbol.charAt(0).toUpperCase() + g.symbol.slice(1)));
    main.appendChild(sym);
  }
  if(g.domains.length){
    var doms = ce("span", "faith-domains");
    g.domains.forEach(function(d){
      var chip = ce("span", "faith-domain" + (mine.indexOf(d) !== -1 ? " is-mine" : ""));
      chip.textContent = d;
      if(mine.indexOf(d) !== -1) chip.title = "Your domain";
      doms.appendChild(chip);
    });
    main.appendChild(doms);
  }
  card.appendChild(main);
  if(selected){ var tick = ce("span", "faith-tick"); tick.innerHTML = TICK; card.appendChild(tick); }
  card.setAttribute("aria-label", g.name + (g.title ? ", " + g.title : "") + (g.alignmentName ? ". " + g.alignmentName : "") + (g.domains.length ? ". Domains: " + g.domains.join(", ") : ""));
  card.addEventListener("click", function(){ pick(g.text); });
  wrap.appendChild(card);
  if(edit){
    var pen = ce("button", "faith-edit");
    pen.type = "button";
    pen.innerHTML = PENCIL;
    pen.title = "Edit " + g.name;
    pen.setAttribute("aria-label", "Edit " + g.name);
    pen.addEventListener("click", edit);
    wrap.appendChild(pen);
  }
  return wrap;
}
