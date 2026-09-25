import { save } from "../../core/state.js";
import { uid, escapeHtml } from "../../core/helpers.js";
import { INFUSIONS, infusionsKnownAt, infusedItemsAt } from "../../data/infusions.js";
import { WEAPON_DATA } from "../../data/weapons.js";
import { makeCard, renderAll } from "../sheet.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
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
var infusePick = "", infuseTarget = "", infuseFreeText = "";

function artificerLevel(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Artificer"; });
  return cl ? (Number(cl.level)||1) : 0;
}
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

function endInfusion(c, active){
  var item = active.itemId && (c.inventory||[]).find(function(i){ return i.id===active.itemId; });
  if(item && active.bonus) item.magicBonus = (Number(item.magicBonus)||0) - active.bonus;
  c.infusions.active = c.infusions.active.filter(function(a){ return a.id!==active.id; });
}

export function renderInfusionsCard(c){
  var level = artificerLevel(c);
  if(level < 2) return null;
  if(!c.infusions) c.infusions = {known:[], active:[]};
  // Infusions point at inventory items by id; older items may not have one.
  (c.inventory||[]).forEach(function(item){ if(!item.id) item.id = uid(); });
  var inf = c.infusions;
  var maxKnown = infusionsKnownAt(level), maxActive = infusedItemsAt(level);
  var bonusValue = level>=10 ? 2 : 1;

  var card = makeCard("Artifice infusions");
  card.classList.add("inf-card");
  var summary = document.createElement("p");
  summary.className = "inf-summary";
  summary.innerHTML = "Known <b>"+inf.known.length+" / "+maxKnown+"</b> · Infused items <b>"+inf.active.length+" / "+maxActive+"</b>"+
    (inf.known.length>maxKnown ? " <span class='inf-warn'>(more known than your level allows)</span>" : "");
  card.appendChild(summary);

  /* -- Infused items -- */
  card.appendChild(sectionTitle("Infused items"));
  if(!inf.active.length){
    card.appendChild(hint("Nothing infused yet. After a long rest you can touch an object and infuse it with one of your known infusions."));
  }
  inf.active.forEach(function(a){
    // Look the text up through the known entry: a replicated item's name
    // carries the item ("Replicate Magic Item: Bag of Holding").
    var k = inf.known.find(function(x){ return x.id===a.knownId; });
    var data = infusionData(k ? k.name : a.name) || {};
    var row = document.createElement("div");
    row.className = "inf-row";
    row.innerHTML = "<div class='inf-row-main'><b>"+escapeHtml(a.name)+"</b> <span class='inf-arrow'>on</span> "+escapeHtml(a.itemName)+
      (a.bonus ? " <span class='inf-tag'>+"+a.bonus+" applied</span>" : "")+
      "<div class='inf-text'>"+escapeHtml(data.text||"")+"</div></div>";
    var end = document.createElement("button");
    end.className = "btn small ghost";
    end.textContent = "End";
    end.addEventListener("click", function(){
      endInfusion(c, a);
      save(); renderAll(); playDelete();
    });
    row.appendChild(end);
    card.appendChild(row);
  });

  if(inf.known.length) card.appendChild(infuseForm(c, maxActive, bonusValue));

  /* -- Known infusions -- */
  card.appendChild(sectionTitle("Known infusions"));
  if(!inf.known.length) card.appendChild(hint("Pick the infusions you know. You can swap one for another each time you gain an artificer level."));
  inf.known.forEach(function(k){
    var data = infusionData(k.name) || {};
    var row = document.createElement("div");
    row.className = "inf-row";
    row.innerHTML = "<div class='inf-row-main'><b>"+escapeHtml(k.name)+"</b>"+(k.note ? ": "+escapeHtml(k.note) : "")+
      "<div class='inf-item'>"+escapeHtml(data.item||"")+"</div><div class='inf-text'>"+escapeHtml(data.text||"")+"</div></div>";
    var forget = document.createElement("button");
    forget.className = "btn small ghost";
    forget.textContent = "Forget";
    forget.addEventListener("click", function(){
      var using = inf.active.filter(function(a){ return a.knownId===k.id; });
      confirmDialog("Forget "+k.name+"?", using.length ? "This also ends it on "+using.map(function(a){ return a.itemName; }).join(", ")+"." : "You can learn another infusion in its place.", function(){
        using.forEach(function(a){ endInfusion(c, a); });
        inf.known = inf.known.filter(function(x){ return x.id!==k.id; });
        save(); renderAll(); playDelete();
      });
    });
    row.appendChild(forget);
    card.appendChild(row);
  });

  if(inf.known.length < maxKnown) card.appendChild(learnForm(c, level));
  return card;
}

function learnForm(c, level){
  var inf = c.infusions;
  var wrap = document.createElement("div");
  wrap.className = "inf-form";
  var knownNames = inf.known.map(function(k){ return k.name; });
  var options = INFUSIONS.filter(function(i){ return i.repeatable || knownNames.indexOf(i.name)===-1; });
  if(learnPick && !options.some(function(o){ return o.name===learnPick && o.level<=level; })) learnPick = "";

  var select = document.createElement("select");
  select.appendChild(opt("", "Learn an infusion…", true));
  options.forEach(function(i){
    var o = opt(i.name, i.name + (i.level>level ? " (artificer "+i.level+")" : ""));
    if(i.level>level) o.disabled = true;
    select.appendChild(o);
  });
  select.value = learnPick;
  select.addEventListener("change", function(){ learnPick = select.value; renderAll(); });
  wrap.appendChild(field(select));

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
  if(picked) wrap.appendChild(hint(picked.item+". "+picked.text));

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
  return wrap;
}

function infuseForm(c, maxActive, bonusValue){
  var inf = c.infusions;
  var wrap = document.createElement("div");
  wrap.className = "inf-form";
  if(infusePick && !inf.known.some(function(k){ return k.id===infusePick; })) infusePick = "";

  var select = document.createElement("select");
  select.appendChild(opt("", "Infuse an item with…", true));
  inf.known.forEach(function(k){ select.appendChild(opt(k.id, k.name+(k.note ? ": "+k.note : ""))); });
  select.value = infusePick;
  select.addEventListener("change", function(){ infusePick = select.value; infuseTarget = ""; infuseFreeText = ""; renderAll(); });
  wrap.appendChild(field(select));

  var known = inf.known.find(function(k){ return k.id===infusePick; });
  var data = known && infusionData(known.name);
  var targets = data && data.target ? targetItems(c, data) : null;
  if(data){
    if(targets){
      if(infuseTarget && !targets.some(function(i){ return i.id===infuseTarget; })) infuseTarget = "";
      if(!targets.length){
        wrap.appendChild(hint("No suitable item in your inventory ("+data.item.toLowerCase()+"). Add one on the Inventory tab first."));
      } else {
        var tsel = document.createElement("select");
        tsel.appendChild(opt("", "Pick the item…", true));
        targets.forEach(function(i){ tsel.appendChild(opt(i.id, i.name + (i.magicBonus ? " (+"+i.magicBonus+")" : ""))); });
        tsel.value = infuseTarget;
        tsel.addEventListener("change", function(){ infuseTarget = tsel.value; });
        wrap.appendChild(field(tsel));
      }
    } else {
      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = data.item;
      input.value = infuseFreeText;
      input.addEventListener("input", function(){ infuseFreeText = input.value; });
      wrap.appendChild(field(input));
    }
  }

  var full = inf.active.length >= maxActive;
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = full && inf.active.length ? "Infuse (ends "+inf.active[0].name+" on "+inf.active[0].itemName+")" : "Infuse";
  btn.disabled = !data || (targets && !targets.length);
  btn.addEventListener("click", function(){
    if(!data) return;
    var item = null, itemName = "";
    if(targets){
      item = targets.find(function(i){ return i.id===infuseTarget; });
      if(!item){ showActionToast("Pick which item to infuse.", true); return; }
      itemName = item.name;
    } else {
      itemName = (infuseFreeText||"").trim();
      if(!itemName){ showActionToast("Name the object you're infusing.", true); return; }
    }
    // Over the limit: the oldest infusion ends, as in the rules.
    while(inf.active.length >= maxActive && inf.active.length) endInfusion(c, inf.active[0]);
    var bonus = data.bonus && item ? bonusValue : 0;
    if(bonus) item.magicBonus = (Number(item.magicBonus)||0) + bonus;
    inf.active.push({id:uid(), knownId:known.id, name:known.name + (known.note ? ": "+known.note : ""), itemId:item ? item.id : null, itemName:itemName, bonus:bonus});
    infusePick = ""; infuseTarget = ""; infuseFreeText = "";
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  return wrap;
}

function opt(value, label, placeholder){
  var o = document.createElement("option");
  o.value = value; o.textContent = label;
  if(placeholder){ o.disabled = true; o.hidden = true; }
  return o;
}
function field(el){
  var f = document.createElement("div");
  f.className = "field inf-field";
  f.appendChild(el);
  return f;
}
function sectionTitle(text){
  var p = document.createElement("p");
  p.className = "inf-section";
  p.textContent = text;
  return p;
}
function hint(text){
  var p = document.createElement("p");
  p.className = "inf-hint";
  p.textContent = text;
  return p;
}
