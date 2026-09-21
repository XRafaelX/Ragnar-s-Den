import { save } from "../../core/state.js";
import { profBonus, mod, fmtMod, clamp } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { performRoll } from "../../dice/dice.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";

/* ---- Spells panel ---- */
export function renderSpellsPanel(c){
  var panel = document.createElement("div");

  var scCard = makeCard("Spellcasting");
  var row = document.createElement("div");
  row.className = "grid-row";
  var abField = document.createElement("div");
  var pb = profBonus(c);
  var scMod = mod(c.abilities[c.spellcasting.ability]);
  abField.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Spellcasting ability</label><br>';
  var sel = document.createElement("select");
  ["int","wis","cha"].forEach(function(a){
    var o = document.createElement("option"); o.value=a; o.textContent = a.toUpperCase();
    if(c.spellcasting.ability===a) o.selected = true;
    sel.appendChild(o);
  });
  sel.style.padding="4px"; sel.style.border="1px solid var(--rule)"; sel.style.borderRadius="4px"; sel.style.background="var(--field-bg)"; sel.style.color="var(--text-on-parch)";
  sel.addEventListener("change", function(){ c.spellcasting.ability = sel.value; save(); renderAll(); });
  abField.appendChild(sel);
  row.appendChild(abField);

  var dcBox = document.createElement("div");
  dcBox.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Save DC</label><br>'+
    '<span style="font-family:var(--serif);font-size:20px;">'+(8+pb+scMod)+'</span>';
  row.appendChild(dcBox);

  var atkBox = document.createElement("div");
  atkBox.style.cursor="pointer";
  atkBox.title = "Click to roll a spell attack";
  atkBox.innerHTML = '<label style="font-size:10.5px;text-transform:uppercase;color:var(--text-on-parch-dim);">Attack bonus</label><br>'+
    '<span style="font-family:var(--serif);font-size:20px;">'+fmtMod(pb+scMod)+'</span>';
  atkBox.addEventListener("click", function(){ performRoll(20,1,pb+scMod,"none","Spell attack"); });
  row.appendChild(atkBox);
  scCard.appendChild(row);
  panel.appendChild(scCard);

  var slotCard = makeCard("Spell slots");
  var slotGrid = document.createElement("div");
  slotGrid.className = "slot-grid";
  for(var lvl=1;lvl<=9;lvl++){
    (function(lvl){
      var s = c.spellcasting.slots[lvl];
      var box = document.createElement("div");
      box.className = "slot-box";
      box.innerHTML = '<div class="lbl">Level '+lvl+'</div>';
      var frac = document.createElement("div");
      frac.className = "fraction";
      var usedInput = document.createElement("input");
      usedInput.type="number"; usedInput.value = s.used; usedInput.min="0";
      usedInput.addEventListener("input", function(){ s.used = clamp(Number(usedInput.value)||0,0,s.max); save(); });
      var slash = document.createElement("span"); slash.textContent="/";
      var maxInput = document.createElement("input");
      maxInput.type="number"; maxInput.value = s.max; maxInput.min="0";
      maxInput.addEventListener("input", function(){ s.max = Math.max(0,Number(maxInput.value)||0); s.used = clamp(s.used,0,s.max); save(); renderAll(); });
      frac.appendChild(usedInput); frac.appendChild(slash); frac.appendChild(maxInput);
      box.appendChild(frac);
      var useBtn = document.createElement("button");
      useBtn.className = "btn small"; useBtn.style.marginTop="4px"; useBtn.style.width="100%";
      useBtn.textContent = "Use slot";
      useBtn.disabled = s.used>=s.max;
      useBtn.addEventListener("click", function(){ if(s.used<s.max){ s.used++; save(); renderAll(); } });
      box.appendChild(useBtn);
      slotGrid.appendChild(box);
    })(lvl);
  }
  slotCard.appendChild(slotGrid);
  panel.appendChild(slotCard);

  var spellCard = makeCard("Known / prepared spells");
  var table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = '<thead><tr><th class="col-tight">Lv</th><th>Name</th><th class="col-tight">Prep?</th><th>Notes</th><th></th></tr></thead>';
  var tbody = document.createElement("tbody");
  (c.spells||[]).forEach(function(sp, idx){
    var tr = document.createElement("tr");
    var lvlTd = document.createElement("td");
    var lvlInput = document.createElement("input"); lvlInput.type="number"; lvlInput.min="0"; lvlInput.max="9"; lvlInput.value = sp.level||0;
    lvlInput.addEventListener("input", function(){ sp.level = Number(lvlInput.value)||0; save(); });
    lvlTd.appendChild(lvlInput);
    var nameTd = document.createElement("td");
    var nameInput = document.createElement("input"); nameInput.type="text"; nameInput.value = sp.name||""; nameInput.placeholder="Spell name";
    nameInput.addEventListener("input", function(){ sp.name = nameInput.value; save(); });
    nameTd.appendChild(nameInput);
    var prepTd = document.createElement("td");
    var prepCb = document.createElement("input"); prepCb.type="checkbox"; prepCb.className="chk"; prepCb.checked = !!sp.prepared;
    prepCb.addEventListener("change", function(){ sp.prepared = prepCb.checked; save(); });
    prepTd.appendChild(prepCb);
    var notesTd = document.createElement("td");
    var notesInput = document.createElement("input"); notesInput.type="text"; notesInput.value = sp.notes||""; notesInput.placeholder="range, duration, effect…";
    notesInput.addEventListener("input", function(){ sp.notes = notesInput.value; save(); });
    notesTd.appendChild(notesInput);
    var rmTd = document.createElement("td");
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.addEventListener("click", function(){
      confirmDialog("Remove "+(sp.name||"this spell")+"?", "This cannot be undone.", function(){
        c.spells.splice(idx,1); save(); renderAll(); playDelete();
      });
    });
    rmTd.appendChild(rmBtn);
    tr.appendChild(lvlTd); tr.appendChild(nameTd); tr.appendChild(prepTd); tr.appendChild(notesTd); tr.appendChild(rmTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  spellCard.appendChild(table);
  var addSpellBtn = document.createElement("button");
  addSpellBtn.className = "btn small"; addSpellBtn.style.marginTop="10px";
  addSpellBtn.style.color="var(--text-on-parch)"; addSpellBtn.style.borderColor="var(--rule)";
  addSpellBtn.textContent = "+ Add spell";
  addSpellBtn.addEventListener("click", function(){
    c.spells.push({level:0, name:"", prepared:false, notes:""});
    save(); renderAll(); playAdd();
  });
  spellCard.appendChild(addSpellBtn);
  panel.appendChild(spellCard);

  return panel;
}
