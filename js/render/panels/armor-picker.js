import { ARMOR_GROUPS, ARMOR_DATA } from "../../data/armor.js";
import { save } from "../../core/state.js";
import { renderAll } from "../sheet.js";
import { openCatalogPicker } from "../../ui/catalog-picker.js";

var ARMOR_CATEGORY_LABEL = {light:"Light", medium:"Medium", heavy:"Heavy", shield:"Shield"};

function addCatalogArmor(c, name, d){
  c.inventory.push({
    name: name, type:"armor", qty:1, equipped:false,
    category: d.category||"light", baseAC: d.baseAC!=null?d.baseAC:10, magicBonus:0,
    notes: d.stealthDisadvantage ? "Disadvantage on Stealth checks" : ""
  });
  save();
}

function buildCustomArmorForm(c, container, closeCustom){
  var form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:420px;";

  var title = document.createElement("h4");
  title.style.cssText = "font-family:var(--serif);color:var(--brass-bright);margin:0;font-weight:normal;font-size:17px;";
  title.textContent = "Custom Armor";
  form.appendChild(title);

  var nameField = document.createElement("div"); nameField.className = "field";
  nameField.innerHTML = "<label>Armor Name *</label>";
  var nameInput = document.createElement("input");
  nameInput.type = "text"; nameInput.placeholder = "e.g. Dragon Scale Mail";
  nameField.appendChild(nameInput);
  form.appendChild(nameField);

  var row1 = document.createElement("div");
  row1.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";
  var catField = document.createElement("div"); catField.className = "field";
  catField.innerHTML = "<label>Category</label>";
  var catSelect = document.createElement("select");
  [["light","Light armor"],["medium","Medium armor"],["heavy","Heavy armor"],["shield","Shield"]].forEach(function(a){
    var o = document.createElement("option"); o.value = a[0]; o.textContent = a[1];
    catSelect.appendChild(o);
  });
  catField.appendChild(catSelect);
  row1.appendChild(catField);

  var acField = document.createElement("div"); acField.className = "field";
  acField.innerHTML = "<label>Base AC</label>";
  var acInput = document.createElement("input");
  acInput.type = "number"; acInput.value = "10";
  acField.appendChild(acInput);
  row1.appendChild(acField);
  form.appendChild(row1);

  var addBtn = document.createElement("button");
  addBtn.className = "btn primary"; addBtn.textContent = "+ Add Armor";
  addBtn.addEventListener("click", function(){
    var nameVal = nameInput.value.trim();
    if(!nameVal){ alert("Please enter an armor name."); nameInput.focus(); return; }
    c.inventory.push({
      name: nameVal, type:"armor", qty:1, equipped:false,
      category: catSelect.value, baseAC: Number(acInput.value)||0, magicBonus:0, notes:""
    });
    save();
    nameInput.value = ""; acInput.value = "10"; catSelect.value = "light";
    closeCustom();
    renderAll();
  });
  form.appendChild(addBtn);

  container.appendChild(form);
}

export function buildArmorSection(c){
  return {
    key: "armor",
    label: "Armor",
    searchPlaceholder: "Search all armor…",
    groups: ARMOR_GROUPS,
    data: ARMOR_DATA,
    renderSub: function(name, d){ return d.stealthDisadvantage ? "Disadvantage on Stealth checks" : ""; },
    renderRight: function(name, d){
      var acText = d.category==="shield" ? "+" + d.baseAC + " AC" : "AC " + d.baseAC;
      return [acText, ARMOR_CATEGORY_LABEL[d.category]||""];
    },
    onAdd: function(name, d){ addCatalogArmor(c, name, d); renderAll(); },
    renderCustomForm: function(container, closeCustom){ buildCustomArmorForm(c, container, closeCustom); }
  };
}

export function openArmorPicker(c){
  openCatalogPicker({
    sections: [buildArmorSection(c)],
    onClose: function(){ renderAll(); }
  });
}
