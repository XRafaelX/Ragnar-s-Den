import { save } from "../../core/state.js";
import { uid, escapeHtml } from "../../core/helpers.js";
import { INFUSIONS, REPLICABLE_ITEMS, infusionsKnownAt, infusedItemsAt } from "../../data/infusions.js";
import { makeCard, renderAll } from "../sheet.js";
import { sectionTitle, hint } from "../../ui/card-parts.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { artificerLevel, endInfusion, infusionTargets, infuseItem, dropOrphanInfusions } from "../../core/artificer.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd, playDelete } from "../../ui/sound.js";

/* ---- Artifice infusions (Features tab, Artificer 2+) ----
   c.infusions = {
     known:  [{id, name, note}]  (note: the item a Replicate Magic Item makes)
     active: [{id, knownId, name, itemId, itemName, bonus}]
   }
   Infusions with `bonus` raise the infused inventory item's magicBonus
   while active, so AC / attack / damage pick it up; ending the infusion
   (or infusing past the limit, which ends the oldest) takes it back off.
   Every infusion goes on an inventory item (js/core/artificer.js picks
   which fit); Replicate Magic Item makes its item instead. */

// Form state survives the re-render each pick triggers.
var learnPick = "", learnNote = "";
var infusingId = "", infuseTarget = "", infuseChoice = "";

function infusionData(name){ return INFUSIONS.find(function(i){ return i.name===name; }); }

export function renderInfusionsCard(c){
  var level = artificerLevel(c);
  if(level < 2) return null;
  if(!c.infusions) c.infusions = {known:[], active:[]};
  // Infusions point at inventory items by id; older items may not have one.
  (c.inventory||[]).forEach(function(item){ if(!item.id) item.id = uid(); });
  dropOrphanInfusions(c);
  var inf = c.infusions;
  var maxKnown = infusionsKnownAt(level), maxActive = infusedItemsAt(level);
  // Armor Modifications (Armorer 9): two more infused items, which must be
  // parts of the Arcane Armor. The panel doesn't check which items they are.
  var armorMods = level>=9 && (c.classes||[]).some(function(cl){ return cl.name==="Artificer" && cl.subclass==="Armorer"; }) ? 2 : 0;
  maxActive += armorMods;
  if(infusingId && !inf.known.some(function(k){ return k.id===infusingId; })) infusingId = "";

  var card = makeCard("Artifice infusions");
  card.classList.add("inf-card");
  card.appendChild(hint("After a long rest, put each infusion you know on an item to make it magic."));

  /* -- Infused items: a tile per slot -- */
  var slotsHead = countTitle("Infused items", inf.active.length, maxActive, "");
  if(armorMods) slotsHead.title = "Includes 2 for Arcane Armor parts (Armor Modifications)";
  card.appendChild(slotsHead);
  card.appendChild(slotTiles(c, maxActive));

  /* -- Known infusions: a compact row each; the rules are in its sheet -- */
  card.appendChild(countTitle("Your infusions", inf.known.length, maxKnown, inf.known.length>maxKnown ? "more than your level allows" : ""));
  if(!inf.known.length) card.appendChild(hint("You don't know any infusions yet. Learn one below."));
  var rows = document.createElement("div");
  rows.className = "inf-rows";
  inf.known.forEach(function(k){
    var using = inf.active.filter(function(a){ return a.knownId===k.id; });
    rows.appendChild(infusionRow(c, k, using, maxActive));
  });
  if(inf.known.length) card.appendChild(rows);

  /* -- Learn -- */
  if(inf.known.length < maxKnown){
    card.appendChild(sectionTitle("Learn an infusion"));
    card.appendChild(learnForm(c, level));
  } else {
    card.appendChild(hint("All learned. When you gain an artificer level you can swap one: open it, Forget, then learn another."));
  }
  return card;
}

/* "INFUSED ITEMS   2 of 3": a section title with its count on the right. */
function countTitle(text, count, max, warn){
  var p = sectionTitle(text);
  p.classList.add("inf-count-title");
  var n = document.createElement("span");
  n.className = "inf-count" + (count > max ? " over" : "");
  n.innerHTML = "<b>"+count+"</b> of "+max+(warn ? " · "+escapeHtml(warn) : "");
  p.appendChild(n);
  return p;
}

/* What an infusion is called on the card: a replicated item by its own
   name ("Bag of Holding"), the rest by the infusion's. */
function displayName(k){ return k.note || k.name; }

/* One tile per infused item (what it is, which infusion, +1 or "Not
   attuned", End), then a dashed tile per free slot. */
function slotTiles(c, maxActive){
  var inf = c.infusions;
  var grid = document.createElement("div");
  grid.className = "inf-slots";
  inf.active.forEach(function(a){
    var known = inf.known.find(function(k){ return k.id===a.knownId; });
    var tile = document.createElement("div");
    tile.className = "inf-slot";
    var top = document.createElement("div");
    top.className = "inf-slot-top";
    var item = document.createElement("span");
    item.className = "inf-slot-item";
    item.textContent = a.itemName;
    top.appendChild(item);
    var end = document.createElement("button");
    end.type = "button";
    end.className = "btn small ghost inf-slot-end";
    end.textContent = "End";
    end.setAttribute("aria-label", "End "+a.name+" on "+a.itemName);
    end.addEventListener("click", function(){ endWithCheck(c, a); });
    top.appendChild(end);
    tile.appendChild(top);
    var what = document.createElement("div");
    what.className = "inf-slot-what";
    what.textContent = (a.made ? "Replicate Magic Item" : (known ? known.name : a.name)) + (a.choice ? " · "+a.choice.toLowerCase() : "");
    tile.appendChild(what);
    var tags = [];
    if(a.bonus) tags.push("<span class='inf-tag'>+"+a.bonus+"</span>");
    if(a.attunement && !attunedNow(c, a)) tags.push("<span class='inf-tag inf-tag-off' title='Its magic works once you attune to it (the item&#39;s ⋯ menu on the Inventory tab)'>Not attuned</span>");
    if(tags.length){
      var t = document.createElement("div");
      t.className = "inf-slot-tags";
      t.innerHTML = tags.join("");
      tile.appendChild(t);
    }
    grid.appendChild(tile);
  });
  for(var i = inf.active.length; i < maxActive; i++){
    var free = document.createElement("div");
    free.className = "inf-slot inf-slot-free";
    free.textContent = "Free slot";
    grid.appendChild(free);
  }
  return grid;
}

/* Ending a replicated item's infusion removes the item, so that asks. */
function endWithCheck(c, a){
  var finish = function(){ endInfusion(c, a); save(); renderAll(); playDelete(); };
  if(!a.made) return finish();
  confirmDialog("End "+a.name+"?", "The "+a.itemName+" leaves your inventory. Anything inside it lands around it.", finish);
}

function forget(c, k, using){
  confirmDialog("Forget "+k.name+(k.note ? ": "+k.note : "")+"?", using.length ? "This also ends it on "+using.map(function(a){ return a.itemName; }).join(", ")+"." : "You can learn another infusion in its place.", function(){
    using.forEach(function(a){ endInfusion(c, a); });
    c.infusions.known = c.infusions.known.filter(function(x){ return x.id!==k.id; });
    save(); renderAll(); playDelete();
  });
}

/* A known infusion: its name (a tap opens the rules), what it goes on,
   and Infuse or "In use". Infuse folds the item picker open under it. */
var openedNow = "";
function infusionRow(c, k, using, maxActive){
  var data = infusionData(k.name) || {};
  var row = document.createElement("div");
  row.className = "inf-row"+(using.length ? " is-on" : "")+(infusingId===k.id ? " is-infusing" : "");
  var main = document.createElement("div");
  main.className = "inf-row-main";
  var info = document.createElement("button");
  info.type = "button";
  info.className = "inf-row-info";
  info.title = "What it does";
  info.setAttribute("aria-label", displayName(k)+": what it does");
  info.innerHTML = "<span class='inf-row-name'>"+escapeHtml(displayName(k))+"<span class='inf-row-more' aria-hidden='true'>›</span></span>"+
    "<span class='inf-row-goes'>"+escapeHtml(k.note ? "Replicate Magic Item" : shortItem(data.item))+"</span>";
  info.addEventListener("click", function(){ openInfusionSheet(c, k, using, data); });
  main.appendChild(info);
  if(using.length){
    var chip = document.createElement("span");
    chip.className = "inf-tag inf-row-chip";
    chip.textContent = "In use";
    main.appendChild(chip);
  } else if(infusingId!==k.id){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small inf-act";
    btn.textContent = data.target==="replica" ? "Make" : "Infuse";
    btn.setAttribute("aria-label", data.target==="replica" ? "Make "+displayName(k) : "Infuse an item with "+displayName(k));
    btn.addEventListener("click", function(){ startInfusing(k); });
    main.appendChild(btn);
  }
  row.appendChild(main);
  if(infusingId===k.id && !using.length){
    var form = infuseForm(c, k, data, maxActive);
    // Fold open once, when Infuse is tapped, not on every redraw.
    if(openedNow===k.id){ form.classList.add("inf-fold-in"); openedNow = ""; }
    row.appendChild(form);
  }
  return row;
}
function startInfusing(k){
  infusingId = k.id; infuseTarget = ""; infuseChoice = ""; openedNow = k.id;
  renderAll();
}
/* "A suit of armor or a shield" -> "Suit of armor or a shield": the
   attunement note is in the sheet. */
function shortItem(item){
  var t = String(item||"").replace(/ \(requires attunement\)$/i, "").replace(/^An? /, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* The rules for a known infusion, in a bottom sheet: what it goes on,
   what it does, and Infuse / End / Forget. */
function openInfusionSheet(c, k, using, data){
  openBottomSheet(function(body, refresh, close){
    var header = document.createElement("div");
    header.className = "bs-header";
    var title = document.createElement("div");
    title.className = "bs-title";
    title.textContent = displayName(k);
    header.appendChild(title);
    var closeBtn = document.createElement("button");
    closeBtn.className = "bs-close"; closeBtn.textContent = "✕"; closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", close);
    header.appendChild(closeBtn);
    body.appendChild(header);
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = (k.note ? "Replicate Magic Item" : "Artifice infusion") + (data.level ? " · artificer "+data.level+"+" : "");
    body.appendChild(sub);
    if(data.item){
      var goes = document.createElement("div");
      goes.className = "inf-goes";
      goes.innerHTML = "<span>Goes on</span> "+escapeHtml(data.item);
      body.appendChild(goes);
    }
    if(data.text){
      var text = document.createElement("div");
      text.className = "ff-desc ff-sheet-desc inf-sheet-text";
      text.textContent = data.text;
      body.appendChild(text);
    }
    using.forEach(function(a){
      var on = document.createElement("p");
      on.className = "inf-sheet-on";
      on.innerHTML = (a.made ? "Made" : "On")+" <b>"+escapeHtml(a.itemName)+"</b>"+(a.choice ? " ("+escapeHtml(a.choice.toLowerCase())+")" : "");
      body.appendChild(on);
    });
    var actions = document.createElement("div");
    actions.className = "ff-sheet-actions";
    var add = function(label, cls, run){
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn small"+(cls ? " "+cls : ""); b.textContent = label;
      b.addEventListener("click", function(){ close(); run(); });
      actions.appendChild(b);
    };
    if(using.length) using.forEach(function(a){ add(using.length > 1 ? "End on "+a.itemName : "End", "", function(){ endWithCheck(c, a); }); });
    else add(data.target==="replica" ? "Make it" : "Infuse an item", "primary", function(){ startInfusing(k); });
    add("Forget", "ff-sheet-danger", function(){ forget(c, k, using); });
    body.appendChild(actions);
  });
}

function attunedNow(c, a){
  var item = (c.inventory||[]).find(function(i){ return i.id===a.itemId; });
  return !!(item && item.attuned);
}

function learnForm(c, level){
  var inf = c.infusions;
  var wrap = document.createElement("div");
  wrap.className = "inf-form inf-learn";
  var knownNames = inf.known.map(function(k){ return k.name; });
  var options = INFUSIONS.filter(function(i){ return i.repeatable || knownNames.indexOf(i.name)===-1; });
  if(learnPick && !options.some(function(o){ return o.name===learnPick && o.level<=level; })) learnPick = "";

  // Infusions above the artificer's level are listed but greyed out.
  var levelOf = {};
  options.forEach(function(i){ levelOf[i.name] = i.level; });
  wrap.appendChild(field(themedPicker({
    key: "inf:learn", ariaLabel: "Infusion to learn", placeholder: "Pick an infusion to learn…",
    groups: {"": options.map(function(i){ return i.name; })}, value: learnPick,
    reasonFor: function(v){ return levelOf[v] > level ? "artificer " + levelOf[v] : ""; },
    onPick: function(v){ learnPick = v; renderAll(); }
  })));

  var picked = infusionData(learnPick);
  if(picked && picked.repeatable) wrap.appendChild(field(replicaPicker(inf, level)));

  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Learn";
  btn.disabled = !picked;
  btn.addEventListener("click", function(){
    if(!picked) return;
    var note = picked.repeatable ? (learnNote||"").trim() : "";
    if(picked.repeatable && !note){ showActionToast("Pick the magic item this replicates.", true); return; }
    inf.known.push({id:uid(), name:picked.name, note:note});
    learnPick = ""; learnNote = "";
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  if(picked){
    var preview = document.createElement("div");
    preview.className = "inf-preview";
    preview.innerHTML = "<div class='inf-goes'><span>Goes on</span> "+escapeHtml(picked.item)+"</div><div class='inf-text'>"+escapeHtml(picked.text)+"</div>";
    wrap.appendChild(preview);
  }
  return wrap;
}

/* Replicate Magic Item: the item it makes, from the Replicable Items
   tables (higher tables greyed out until that artificer level, items
   already replicated greyed out), or any common magic item typed in. */
function replicaPicker(inf, level){
  var made = inf.known.filter(function(k){ return k.note; }).map(function(k){ return k.note.toLowerCase(); });
  var groups = {}, levelOf = {};
  REPLICABLE_ITEMS.forEach(function(t){
    groups["Artificer "+t.level] = t.items.map(function(i){ levelOf[i.name] = t.level; return i.name; });
  });
  return themedPicker({
    key: "inf:replica", ariaLabel: "Magic item to replicate", placeholder: "Which magic item?",
    groups: groups, value: learnNote, sheet: true,
    homebrew: {noun: "common magic item (not a potion or scroll)"},
    reasonFor: function(v){
      if(made.indexOf(v.toLowerCase())!==-1) return "known";
      return levelOf[v] > level ? "artificer " + levelOf[v] : "";
    },
    onPick: function(v, meta){ learnNote = v; if(!meta || !meta.typing) renderAll(); }
  });
}

/* Inline on an infusion's entry: pick the item from the inventory (or
   add a plain one, such as a ring), then Infuse. Replicate Magic Item
   makes its item instead. Over the limit, the oldest infusion ends, as
   in the rules. */
function infuseForm(c, known, data, maxActive){
  var inf = c.infusions;
  var wrap = document.createElement("div");
  wrap.className = "inf-form inf-infuse";
  var replica = data.target==="replica";
  var ready = true;
  if(!replica){
    var targets = infusionTargets(c, data);
    var newItems = data.newItems || [];
    var open = targets.filter(function(t){ return !t.reason; });
    var valid = open.map(function(t){ return t.item.id; }).concat(newItems.map(function(n){ return "new:"+n; }));
    if(valid.indexOf(infuseTarget)===-1) infuseTarget = "";
    if(!targets.length && !newItems.length){
      ready = false;
      wrap.appendChild(hint("No suitable item in your inventory ("+(data.item||"").toLowerCase()+"). Add one on the Inventory tab first."));
    } else {
      var reasons = {}, groups = {};
      targets.forEach(function(t){ reasons[t.item.id] = t.reason; });
      if(targets.length) groups["Your items"] = targets.map(function(t){
        return {value: t.item.id, label: t.item.name + (t.item.magicBonus ? " (+"+t.item.magicBonus+")" : "")};
      });
      if(newItems.length) groups["Add to your inventory"] = newItems.map(function(n){ return {value: "new:"+n, label: "+ "+n}; });
      wrap.appendChild(field(themedPicker({
        key: "inf:target", ariaLabel: "Item to infuse", placeholder: "Which item?",
        groups: groups, value: infuseTarget,
        reasonFor: function(v){ return reasons[v] || ""; },
        onPick: function(v){ infuseTarget = v; }
      })));
    }
    if(data.choice){
      wrap.appendChild(field(themedPicker({
        key: "inf:choice", ariaLabel: data.choice.label, placeholder: data.choice.label+"…",
        groups: {"": data.choice.options}, value: infuseChoice,
        onPick: function(v){ infuseChoice = v; }
      })));
    }
  }

  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = replica ? "Make it" : "Infuse";
  btn.disabled = !ready;
  btn.addEventListener("click", function(){
    var opts = {};
    if(!replica){
      if(!infuseTarget){ showActionToast("Pick which item to infuse.", true); return; }
      if(data.choice && !infuseChoice){ showActionToast("Pick the "+data.choice.label.toLowerCase()+".", true); return; }
      if(infuseTarget.indexOf("new:")===0) opts.newItem = infuseTarget.slice(4);
      else opts.itemId = infuseTarget;
      if(data.choice) opts.choice = infuseChoice;
    }
    var entry = infuseItem(c, known, opts, maxActive);
    if(!entry){ showActionToast("That item can't take an infusion.", true); return; }
    infusingId = ""; infuseTarget = ""; infuseChoice = "";
    save(); renderAll(); playAdd();
    if(entry.attunement && !attunedNow(c, entry)) showActionToast("Infused, but you're at your attunement limit: end one on the Inventory tab, then attune to this.");
  });
  wrap.appendChild(btn);

  var cancel = document.createElement("button");
  cancel.className = "btn small ghost";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", function(){ infusingId = ""; renderAll(); });
  wrap.appendChild(cancel);

  if(inf.active.length >= maxActive && inf.active.length){
    var oldest = inf.active[0];
    var warn = hint("You're at your limit, so this ends "+oldest.name+" on "+oldest.itemName+
      (oldest.made ? ", and the "+oldest.itemName+" leaves your inventory." : "."));
    warn.classList.add("inf-note");
    wrap.appendChild(warn);
  }
  return wrap;
}

function field(el){
  var f = document.createElement("div");
  f.className = "field inf-field";
  f.appendChild(el);
  return f;
}
