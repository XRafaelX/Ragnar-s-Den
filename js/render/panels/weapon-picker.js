import { WEAPON_GROUPS, WEAPON_DATA } from "../../data/weapons.js";
import { isProficientWithWeapon } from "../../core/helpers.js";
import { save } from "../../core/state.js";
import { renderAll } from "../sheet.js";
import { openCatalogPicker } from "../../ui/catalog-picker.js";

var DAMAGE_TYPES = ["Slashing","Piercing","Bludgeoning","Acid","Cold","Fire","Force","Lightning","Necrotic","Poison","Psychic","Radiant","Thunder"];

export function addCatalogWeapon(c, name, d){
  var ability = d.finesse ? "finesse" : (d.ranged ? "dex" : "str");
  c.inventory.push({
    name: name, type:"weapon", qty:1, equipped:true, notes: d.properties||"",
    damageDice: d.damageDice||"", damageType: d.damageType||"", ability: ability,
    proficient: isProficientWithWeapon(c, name, d.category), magicBonus: 0
  });
  save();
}

export function addCustomWeapon(c, fields){
  c.inventory.push({
    name: fields.name, type:"weapon", qty:1, equipped:true, notes:"",
    damageDice: fields.damageDice||"", damageType: fields.damageType||"", ability: fields.ability,
    proficient: fields.proficient, magicBonus: 0
  });
  save();
}

export function buildCustomWeaponForm(container, closeCustom, onSubmit){
  var form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:420px;";

  var title = document.createElement("h4");
  title.style.cssText = "font-family:var(--serif);color:var(--brass-bright);margin:0;font-weight:normal;font-size:17px;";
  title.textContent = "Custom Weapon";
  form.appendChild(title);

  var nameField = document.createElement("div"); nameField.className = "field";
  nameField.innerHTML = "<label>Weapon Name *</label>";
  var nameInput = document.createElement("input");
  nameInput.type = "text"; nameInput.placeholder = "e.g. Trident of Returning";
  nameField.appendChild(nameInput);
  form.appendChild(nameField);

  var row1 = document.createElement("div");
  row1.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";
  var diceField = document.createElement("div"); diceField.className = "field";
  diceField.innerHTML = "<label>Damage Dice</label>";
  var diceInput = document.createElement("input");
  diceInput.type = "text"; diceInput.placeholder = "e.g. 1d8";
  diceField.appendChild(diceInput);
  row1.appendChild(diceField);

  var typeField = document.createElement("div"); typeField.className = "field";
  typeField.innerHTML = "<label>Damage Type</label>";
  var typeSelect = document.createElement("select");
  var blank = document.createElement("option"); blank.value = ""; blank.textContent = "—";
  typeSelect.appendChild(blank);
  DAMAGE_TYPES.forEach(function(dt){
    var o = document.createElement("option"); o.value = dt; o.textContent = dt;
    typeSelect.appendChild(o);
  });
  typeField.appendChild(typeSelect);
  row1.appendChild(typeField);
  form.appendChild(row1);

  var abilityField = document.createElement("div"); abilityField.className = "field";
  abilityField.innerHTML = "<label>Ability</label>";
  var abilitySelect = document.createElement("select");
  [["str","Strength"],["dex","Dexterity"],["finesse","Finesse (best)"]].forEach(function(a){
    var o = document.createElement("option"); o.value = a[0]; o.textContent = a[1];
    abilitySelect.appendChild(o);
  });
  abilityField.appendChild(abilitySelect);
  form.appendChild(abilityField);

  var profLabel = document.createElement("label");
  profLabel.style.cssText = "display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;";
  var profCb = document.createElement("input");
  profCb.type = "checkbox"; profCb.className = "chk"; profCb.checked = true;
  profLabel.appendChild(profCb);
  profLabel.appendChild(document.createTextNode("Proficient"));
  form.appendChild(profLabel);

  var addBtn = document.createElement("button");
  addBtn.className = "btn primary"; addBtn.textContent = "+ Add Weapon";
  addBtn.addEventListener("click", function(){
    var nameVal = nameInput.value.trim();
    if(!nameVal){ alert("Please enter a weapon name."); nameInput.focus(); return; }
    var fields = {
      name: nameVal, damageDice: diceInput.value.trim(), damageType: typeSelect.value,
      ability: abilitySelect.value, proficient: profCb.checked
    };
    nameInput.value = ""; diceInput.value = ""; typeSelect.value = ""; profCb.checked = true;
    closeCustom();
    onSubmit(fields);
  });
  form.appendChild(addBtn);

  container.appendChild(form);
}

export function buildWeaponSection(c){
  return {
    key: "weapons",
    label: "Weapons",
    searchPlaceholder: "Search all weapons…",
    groups: WEAPON_GROUPS,
    data: WEAPON_DATA,
    renderSub: function(name, d){ return d.properties || ""; },
    renderRight: function(name, d){ return [d.damageDice||"—", d.damageType||""]; },
    onAdd: function(name, d){ addCatalogWeapon(c, name, d); renderAll(); },
    renderCustomForm: function(container, closeCustom){
      buildCustomWeaponForm(container, closeCustom, function(fields){
        addCustomWeapon(c, fields);
        renderAll();
      });
    }
  };
}

export function openWeaponPicker(c){
  openCatalogPicker({
    sections: [buildWeaponSection(c)],
    onClose: function(){ renderAll(); }
  });
}
