import { save } from "../../core/state.js";
import { uid, escapeHtml } from "../../core/helpers.js";
import { INFUSIONS, infusionsKnownAt, infusedItemsAt } from "../../data/infusions.js";
import { WEAPON_DATA } from "../../data/weapons.js";
import { makeCard, renderAll } from "../sheet.js";
import { meter, sectionTitle, hint } from "../../ui/card-parts.js";
import { artificerLevel, infusionBonus, endInfusion } from "../../core/artificer.js";
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
   (or infusing past the limit, which ends the oldest) takes it back off. */

// Form state survives the re-render each pick triggers.
var learnPick = "", learnNote = "";
var infusingId = "", infuseTarget = "", infuseFreeText = "";

function infusionData(name){ return INFUSIONS.find(function(i){ return i.name===name; }); }

function weaponProps(item){
  var d = WEAPON_DATA[item.name];
  return ((d && d.properties) || "") + " " + (item.notes || "");
}
/* Inventory items an infusion can target, minus ones already infused
   (an object can hold only one infusion at a time). */
function targetItems(c, inf){
  var taken = c.infusions.active.map(function(a){ return a.itemId; });
  return (c.inventory||[]).filter(function(item){
    if(taken.indexOf(item.id)!==-1) return false;
    if(inf.target==="armor") return item.type==="armor";
    if(inf.target==="shield") return item.type==="armor" && item.category==="shield";
    if(item.type!=="weapon") return false;
    if(inf.target==="weapon") return true;
    if(inf.target==="ammoWeapon") return /ammunition/i.test(weaponProps(item));
    if(inf.target==="thrownWeapon") return /thrown/i.test(weaponProps(item));
    return false;
  });
}

export function renderInfusionsCard(c){
  var level = artificerLevel(c);
  if(level < 2) return null;
  if(!c.infusions) c.infusions = {known:[], active:[]};
  // Infusions point at inventory items by id; older items may not have one.
  (c.inventory||[]).forEach(function(item){ if(!item.id) item.id = uid(); });
  var inf = c.infusions;
  var maxKnown = infusionsKnownAt(level), maxActive = infusedItemsAt(level);
  // Armor Modifications (Armorer 9): two more infused items, which must be
  // parts of the Arcane Armor. The panel doesn't check which items they are.
  var armorMods = level>=9 && (c.classes||[]).some(function(cl){ return cl.name==="Artificer" && cl.subclass==="Armorer"; }) ? 2 : 0;
  maxActive += armorMods;
  if(infusingId && !inf.known.some(function(k){ return k.id===infusingId; })) infusingId = "";

  var card = makeCard("Artifice infusions");
  card.classList.add("inf-card");
  card.appendChild(hint("Infusions turn everyday items into magic ones. Learn a few, then after a long rest put each one on an item. An infusion can be on one item at a time."));

  var meters = document.createElement("div");
  meters.className = "inf-meters";
  meters.appendChild(meter("Infusions known", inf.known.length, maxKnown,
    inf.known.length>maxKnown ? "More than your level allows" : inf.known.length<maxKnown ? (maxKnown-inf.known.length)+" left to learn" : "All learned"));
  meters.appendChild(meter("Items infused", inf.active.length, maxActive,
    armorMods ? "+2 for Arcane Armor parts" : inf.active.length>=maxActive ? "Full: a new one ends the oldest" : (maxActive-inf.active.length)+" free"));
  card.appendChild(meters);

  /* -- Known infusions, each with what it's on right now -- */
  card.appendChild(sectionTitle("Your infusions"));
  if(!inf.known.length) card.appendChild(hint("You don't know any infusions yet. Learn one below."));
  inf.known.forEach(function(k){
    var using = inf.active.filter(function(a){ return a.knownId===k.id; });
    card.appendChild(infusionEntry(c, k, using, maxActive));
  });
  // Older saves can hold an infusion whose known entry is gone.
  inf.active.filter(function(a){ return !inf.known.some(function(k){ return k.id===a.knownId; }); }).forEach(function(a){
    var entry = document.createElement("div");
    entry.className = "inf-entry is-on";
    entry.appendChild(entryHead(a.name, null));
    entry.appendChild(statusRow(c, a));
    card.appendChild(entry);
  });

  /* -- Learn -- */
  if(inf.known.length < maxKnown){
    card.appendChild(sectionTitle("Learn an infusion"));
    card.appendChild(learnForm(c, level));
  } else {
    card.appendChild(hint("You know as many infusions as your level allows. Each time you gain an artificer level you can swap one: forget it, then learn the new one."));
  }
  return card;
}

function entryHead(title, onForget){
  var head = document.createElement("div");
  head.className = "inf-entry-head";
  var t = document.createElement("span");
  t.className = "inf-entry-title";
  t.textContent = title;
  head.appendChild(t);
  if(onForget){
    var forget = document.createElement("button");
    forget.className = "btn small ghost inf-forget";
    forget.textContent = "Forget";
    forget.addEventListener("click", onForget);
    head.appendChild(forget);
  }
  return head;
}

function infusionEntry(c, k, using, maxActive){
  var inf = c.infusions;
  var data = infusionData(k.name) || {};
  var entry = document.createElement("div");
  entry.className = "inf-entry"+(using.length ? " is-on" : "");
  entry.appendChild(entryHead(k.name+(k.note ? ": "+k.note : ""), function(){
    confirmDialog("Forget "+k.name+"?", using.length ? "This also ends it on "+using.map(function(a){ return a.itemName; }).join(", ")+"." : "You can learn another infusion in its place.", function(){
      using.forEach(function(a){ endInfusion(c, a); });
      inf.known = inf.known.filter(function(x){ return x.id!==k.id; });
      save(); renderAll(); playDelete();
    });
  }));
  if(data.item){
    var goes = document.createElement("div");
    goes.className = "inf-goes";
    goes.innerHTML = "<span>Goes on</span> "+escapeHtml(data.item);
    entry.appendChild(goes);
  }
  if(data.text){
    var text = document.createElement("div");
    text.className = "inf-text";
    text.textContent = data.text;
    entry.appendChild(text);
  }
  if(using.length){
    using.forEach(function(a){ entry.appendChild(statusRow(c, a)); });
  } else if(infusingId===k.id){
    entry.appendChild(infuseForm(c, k, data, maxActive));
  } else {
    var row = document.createElement("div");
    row.className = "inf-status";
    row.innerHTML = "<span class='inf-off'>Not on an item</span>";
    var btn = document.createElement("button");
    btn.className = "btn small inf-act";
    btn.textContent = "Infuse an item";
    btn.addEventListener("click", function(){
      infusingId = k.id; infuseTarget = ""; infuseFreeText = "";
      renderAll();
    });
    row.appendChild(btn);
    entry.appendChild(row);
  }
  return entry;
}

function statusRow(c, a){
  var row = document.createElement("div");
  row.className = "inf-status";
  row.innerHTML = "<span class='inf-on'>Infused on <b>"+escapeHtml(a.itemName)+"</b></span>"+
    (a.bonus ? "<span class='inf-tag'>+"+a.bonus+" applied</span>" : "");
  var end = document.createElement("button");
  end.className = "btn small ghost inf-act";
  end.textContent = "End";
  end.setAttribute("aria-label", "End "+a.name+" on "+a.itemName);
  end.addEventListener("click", function(){
    endInfusion(c, a);
    save(); renderAll(); playDelete();
  });
  row.appendChild(end);
  return row;
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
  var noteInput = null;
  if(picked && picked.repeatable){
    noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.placeholder = "Which magic item? e.g. Bag of Holding";
    noteInput.value = learnNote;
    noteInput.addEventListener("input", function(){ learnNote = noteInput.value; });
    wrap.appendChild(field(noteInput));
  }

  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Learn";
  btn.disabled = !picked;
  btn.addEventListener("click", function(){
    if(!picked) return;
    var note = picked.repeatable ? (learnNote||"").trim() : "";
    if(picked.repeatable && !note){ showActionToast("Name the magic item this replicates.", true); return; }
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

/* Inline on an infusion's entry: pick the item (or name the object), then
   Infuse. Over the limit, the oldest infusion ends, as in the rules. */
function infuseForm(c, known, data, maxActive){
  var inf = c.infusions;
  var wrap = document.createElement("div");
  wrap.className = "inf-form inf-infuse";
  var targets = data.target ? targetItems(c, data) : null;
  if(targets){
    if(infuseTarget && !targets.some(function(i){ return i.id===infuseTarget; })) infuseTarget = "";
    if(!targets.length){
      wrap.appendChild(hint("No suitable item in your inventory ("+data.item.toLowerCase()+"). Add one on the Inventory tab first."));
    } else {
      wrap.appendChild(field(themedPicker({
        key: "inf:target", ariaLabel: "Item to infuse", placeholder: "Which item?",
        groups: {"": targets.map(function(i){ return {value:i.id, label:i.name + (i.magicBonus ? " (+"+i.magicBonus+")" : "")}; })}, value: infuseTarget,
        onPick: function(v){ infuseTarget = v; }
      })));
    }
  } else {
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Which object? e.g. "+data.item.replace(/ \(.*\)$/, "").replace(/^An? /, "").toLowerCase();
    input.setAttribute("aria-label", "Object to infuse");
    input.value = infuseFreeText;
    input.addEventListener("input", function(){ infuseFreeText = input.value; });
    wrap.appendChild(field(input));
  }

  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Infuse";
  btn.disabled = targets && !targets.length;
  btn.addEventListener("click", function(){
    var item = null, itemName = "";
    if(targets){
      item = targets.find(function(i){ return i.id===infuseTarget; });
      if(!item){ showActionToast("Pick which item to infuse.", true); return; }
      itemName = item.name;
    } else {
      itemName = (infuseFreeText||"").trim();
      if(!itemName){ showActionToast("Name the object you're infusing.", true); return; }
    }
    while(inf.active.length >= maxActive && inf.active.length) endInfusion(c, inf.active[0]);
    var bonus = item ? infusionBonus(c, known.name) : 0;
    if(bonus) item.magicBonus = (Number(item.magicBonus)||0) + bonus;
    inf.active.push({id:uid(), knownId:known.id, name:known.name + (known.note ? ": "+known.note : ""), itemId:item ? item.id : null, itemName:itemName, bonus:bonus});
    infusingId = ""; infuseTarget = ""; infuseFreeText = "";
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);

  var cancel = document.createElement("button");
  cancel.className = "btn small ghost";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", function(){ infusingId = ""; renderAll(); });
  wrap.appendChild(cancel);

  if(inf.active.length >= maxActive && inf.active.length){
    var oldest = inf.active[0];
    var warn = hint("You're at your limit, so this ends "+oldest.name+" on "+oldest.itemName+".");
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
