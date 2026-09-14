import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";

/* ---- Inventory panel ---- */
export function renderInventoryPanel(c){
  var panel = document.createElement("div");

  var curCard = makeCard("Currency");
  var curGrid = document.createElement("div");
  curGrid.className = "currency-grid";

  var coins = [
    { key: "cp", name: "Copper", abbr: "CP" },
    { key: "sp", name: "Silver", abbr: "SP" },
    { key: "ep", name: "Electrum", abbr: "EP" },
    { key: "gp", name: "Gold", abbr: "GP" },
    { key: "pp", name: "Platinum", abbr: "PP" }
  ];

  if(!c.currency) c.currency = {cp:0, sp:0, ep:0, gp:0, pp:0};

  coins.forEach(function(coin){
    var box = document.createElement("div");
    box.className = "currency-box currency-" + coin.key;

    var header = document.createElement("div");
    header.className = "currency-header";
    header.innerHTML = '<span class="currency-abbr">'+coin.abbr+'</span><span class="currency-name">'+coin.name+'</span>';
    box.appendChild(header);

    var curVal = Number(c.currency[coin.key]) || 0;

    var stepper = document.createElement("div");
    stepper.className = "stat-stepper currency-stepper";

    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "stat-arrow-btn stat-arrow-down";
    downBtn.title = "Decrease " + coin.name;
    downBtn.setAttribute("aria-label", "Decrease " + coin.name);
    downBtn.innerHTML = makeStatArrowSvg("down");
    downBtn.disabled = curVal <= 0;
    downBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var v = Number(c.currency[coin.key]) || 0;
      c.currency[coin.key] = Math.max(0, v - 1);
      save(); renderAll();
    });

    var valSpan = document.createElement("span");
    valSpan.className = "stat-score-val currency-val";
    valSpan.textContent = curVal;

    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "stat-arrow-btn stat-arrow-up";
    upBtn.title = "Increase " + coin.name;
    upBtn.setAttribute("aria-label", "Increase " + coin.name);
    upBtn.innerHTML = makeStatArrowSvg("up");
    upBtn.addEventListener("click", function(e){
      e.stopPropagation();
      var v = Number(c.currency[coin.key]) || 0;
      c.currency[coin.key] = v + 1;
      save(); renderAll();
    });

    stepper.appendChild(downBtn);
    stepper.appendChild(valSpan);
    stepper.appendChild(upBtn);
    box.appendChild(stepper);

    curGrid.appendChild(box);
  });
  curCard.appendChild(curGrid);

  var totalGold = ((Number(c.currency.cp)||0)*0.01) +
                  ((Number(c.currency.sp)||0)*0.1) +
                  ((Number(c.currency.ep)||0)*0.5) +
                  ((Number(c.currency.gp)||0)*1.0) +
                  ((Number(c.currency.pp)||0)*10.0);

  var totalCoins = (Number(c.currency.cp)||0) +
                   (Number(c.currency.sp)||0) +
                   (Number(c.currency.ep)||0) +
                   (Number(c.currency.gp)||0) +
                   (Number(c.currency.pp)||0);
  var coinWeight = (totalCoins / 50).toFixed(1);

  var curSummary = document.createElement("div");
  curSummary.className = "currency-summary";
  curSummary.innerHTML = '<span>Total Wealth: <strong>' + totalGold.toFixed(2) + ' GP</strong></span>' +
                         '<span class="currency-weight-hint">Purse weight: ~' + coinWeight + ' lb (' + totalCoins + ' coins)</span>';
  curCard.appendChild(curSummary);

  panel.appendChild(curCard);

  var invCard = makeCard("Items & equipment");
  var table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = '<thead><tr><th>Item</th><th class="col-tight">Qty</th><th class="col-tight">Wt</th><th class="col-tight">On?</th><th>Notes</th><th></th></tr></thead>';
  var tbody = document.createElement("tbody");
  (c.inventory||[]).forEach(function(item, idx){
    var tr = document.createElement("tr");
    var nameTd = document.createElement("td");
    var nameInput = document.createElement("input"); nameInput.type="text"; nameInput.value = item.name||""; nameInput.placeholder="Item name";
    nameInput.addEventListener("input", function(){ item.name = nameInput.value; save(); });
    nameTd.appendChild(nameInput);
    var qtyTd = document.createElement("td");
    var qtyInput = document.createElement("input"); qtyInput.type="number"; qtyInput.value = item.qty!=null?item.qty:1; qtyInput.min="0";
    qtyInput.addEventListener("input", function(){ item.qty = Number(qtyInput.value)||0; save(); renderAll(); });
    qtyTd.appendChild(qtyInput);
    var wtTd = document.createElement("td");
    var wtInput = document.createElement("input"); wtInput.type="number"; wtInput.value = item.weight||0; wtInput.min="0"; wtInput.step="0.1";
    wtInput.addEventListener("input", function(){ item.weight = Number(wtInput.value)||0; save(); renderAll(); });
    wtTd.appendChild(wtInput);
    var eqTd = document.createElement("td");
    var eqCb = document.createElement("input"); eqCb.type="checkbox"; eqCb.className="chk"; eqCb.checked = !!item.equipped;
    eqCb.addEventListener("change", function(){ item.equipped = eqCb.checked; save(); });
    eqTd.appendChild(eqCb);
    var notesTd = document.createElement("td");
    var notesInput = document.createElement("input"); notesInput.type="text"; notesInput.value = item.notes||""; notesInput.placeholder="attack bonus, damage, etc.";
    notesInput.addEventListener("input", function(){ item.notes = notesInput.value; save(); });
    notesTd.appendChild(notesInput);
    var rmTd = document.createElement("td");
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.addEventListener("click", function(){ c.inventory.splice(idx,1); save(); renderAll(); });
    rmTd.appendChild(rmBtn);
    tr.appendChild(nameTd); tr.appendChild(qtyTd); tr.appendChild(wtTd); tr.appendChild(eqTd); tr.appendChild(notesTd); tr.appendChild(rmTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  invCard.appendChild(table);

  var totalWeight = (c.inventory||[]).reduce(function(a,i){ return a + (Number(i.weight)||0)*(Number(i.qty)||0); },0);
  var capacity = (Number(c.abilities.str)||10) * 15;
  var wtP = document.createElement("p");
  wtP.style.fontSize="12px"; wtP.style.color="var(--text-on-parch-dim)"; wtP.style.marginTop="10px";
  wtP.textContent = "Total weight: "+totalWeight.toFixed(1)+" lb  ·  Carry capacity (STR×15): "+capacity+" lb";
  invCard.appendChild(wtP);

  var addItemBtn = document.createElement("button");
  addItemBtn.className = "btn small"; addItemBtn.style.marginTop="10px";
  addItemBtn.style.color="var(--text-on-parch)"; addItemBtn.style.borderColor="var(--rule)";
  addItemBtn.textContent = "+ Add item";
  addItemBtn.addEventListener("click", function(){
    c.inventory.push({name:"", qty:1, weight:0, equipped:false, notes:""});
    save(); renderAll();
  });
  invCard.appendChild(addItemBtn);
  panel.appendChild(invCard);

  return panel;
}
