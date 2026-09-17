import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg } from "../../ui/svg-icons.js";
import { performRoll } from "../../dice/dice.js";
import { fmtMod, weaponAttackBonus, weaponDamageBonus, parseDiceNotation } from "../../core/helpers.js";
import { openWeaponPicker } from "./weapon-picker.js";
import { openArmorPicker } from "./armor-picker.js";

var DAMAGE_TYPES = ["Slashing","Piercing","Bludgeoning","Acid","Cold","Fire","Force","Lightning","Necrotic","Poison","Psychic","Radiant","Thunder"];
var ARMOR_CATEGORIES = [
  {key:"light", label:"Light armor"},
  {key:"medium", label:"Medium armor"},
  {key:"heavy", label:"Heavy armor"},
  {key:"shield", label:"Shield"}
];

/* Small inline +/- stepper for a numeric item field (e.g. magic bonus). */
function fieldStepper(label, value, onChange){
  var wrap = document.createElement("div");
  wrap.className = "field-inline inv-stepper-field";
  var l = document.createElement("label");
  l.textContent = label;
  wrap.appendChild(l);
  var stepper = document.createElement("div");
  stepper.className = "stat-stepper inv-mini-stepper";

  var downBtn = document.createElement("button");
  downBtn.type = "button";
  downBtn.className = "stat-arrow-btn stat-arrow-down";
  downBtn.innerHTML = makeStatArrowSvg("down");
  downBtn.addEventListener("click", function(e){ e.stopPropagation(); onChange(value-1); });

  var valSpan = document.createElement("span");
  valSpan.className = "stat-score-val";
  valSpan.textContent = fmtMod(value);

  var upBtn = document.createElement("button");
  upBtn.type = "button";
  upBtn.className = "stat-arrow-btn stat-arrow-up";
  upBtn.innerHTML = makeStatArrowSvg("up");
  upBtn.addEventListener("click", function(e){ e.stopPropagation(); onChange(value+1); });

  stepper.appendChild(downBtn);
  stepper.appendChild(valSpan);
  stepper.appendChild(upBtn);
  wrap.appendChild(stepper);
  return wrap;
}

function itemRow1(c, item, idx){
  var row1 = document.createElement("div");
  row1.className = "inv-item-row1";

  var nameInput = document.createElement("input");
  nameInput.type = "text"; nameInput.className = "inv-name";
  nameInput.value = item.name||""; nameInput.placeholder = "Item name";
  nameInput.addEventListener("input", function(){ item.name = nameInput.value; save(); });
  row1.appendChild(nameInput);

  var rmBtn = document.createElement("button");
  rmBtn.className = "rm-btn"; rmBtn.textContent = "✕"; rmBtn.title = "Remove item";
  rmBtn.addEventListener("click", function(){ c.inventory.splice(idx,1); save(); renderAll(); });
  row1.appendChild(rmBtn);

  return row1;
}

function itemRow2(item){
  var row2 = document.createElement("div");
  row2.className = "inv-item-row2";

  var qtyLbl = document.createElement("label"); qtyLbl.className = "inv-mini-field";
  qtyLbl.textContent = "Qty";
  var qtyInput = document.createElement("input"); qtyInput.type="number"; qtyInput.value = item.qty!=null?item.qty:1; qtyInput.min="0";
  qtyInput.addEventListener("input", function(){ item.qty = Number(qtyInput.value)||0; save(); renderAll(); });
  qtyLbl.appendChild(qtyInput);
  row2.appendChild(qtyLbl);

  var eqLbl = document.createElement("label"); eqLbl.className = "inv-eq-label";
  var eqCb = document.createElement("input"); eqCb.type="checkbox"; eqCb.className="chk"; eqCb.checked = !!item.equipped;
  eqCb.addEventListener("change", function(){ item.equipped = eqCb.checked; save(); renderAll(); });
  eqLbl.appendChild(eqCb);
  eqLbl.appendChild(document.createTextNode("Equipped"));
  row2.appendChild(eqLbl);

  return row2;
}

function renderWeaponCard(c, item, idx){
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card";
  card.appendChild(itemRow1(c, item, idx));
  card.appendChild(itemRow2(item));

  if(item.ability==null) item.ability = "str";
  if(item.proficient==null) item.proficient = true;
  if(item.magicBonus==null) item.magicBonus = 0;

  var wFields = document.createElement("div");
  wFields.className = "inv-type-fields";

  var diceField = document.createElement("div");
  diceField.className = "field-inline";
  diceField.innerHTML = "<label>Damage dice</label>";
  var diceInput = document.createElement("input");
  diceInput.type = "text"; diceInput.className = "inv-dice-input";
  diceInput.placeholder = "e.g. 1d8"; diceInput.value = item.damageDice||"";
  diceInput.addEventListener("input", function(){ item.damageDice = diceInput.value; save(); renderAll(); });
  diceField.appendChild(diceInput);
  wFields.appendChild(diceField);

  var dmgTypeField = document.createElement("div");
  dmgTypeField.className = "field-inline";
  dmgTypeField.innerHTML = "<label>Damage type</label>";
  var dmgTypeSelect = document.createElement("select");
  var blankDmg = document.createElement("option"); blankDmg.value=""; blankDmg.textContent="—";
  dmgTypeSelect.appendChild(blankDmg);
  DAMAGE_TYPES.forEach(function(dt){
    var o = document.createElement("option"); o.value = dt; o.textContent = dt;
    if(item.damageType===dt) o.selected = true;
    dmgTypeSelect.appendChild(o);
  });
  dmgTypeSelect.addEventListener("change", function(){ item.damageType = dmgTypeSelect.value; save(); });
  dmgTypeField.appendChild(dmgTypeSelect);
  wFields.appendChild(dmgTypeField);

  var abilityField = document.createElement("div");
  abilityField.className = "field-inline";
  abilityField.innerHTML = "<label>Ability</label>";
  var abilitySelect = document.createElement("select");
  [["str","Strength"],["dex","Dexterity"],["finesse","Finesse (best)"]].forEach(function(a){
    var o = document.createElement("option"); o.value=a[0]; o.textContent=a[1];
    if(item.ability===a[0]) o.selected = true;
    abilitySelect.appendChild(o);
  });
  abilitySelect.addEventListener("change", function(){ item.ability = abilitySelect.value; save(); renderAll(); });
  abilityField.appendChild(abilitySelect);
  wFields.appendChild(abilityField);

  var profLbl = document.createElement("label");
  profLbl.className = "inv-prof-label";
  var profCb = document.createElement("input"); profCb.type="checkbox"; profCb.className="chk"; profCb.checked = !!item.proficient;
  profCb.addEventListener("change", function(){ item.proficient = profCb.checked; save(); renderAll(); });
  profLbl.appendChild(profCb);
  profLbl.appendChild(document.createTextNode("Proficient"));
  wFields.appendChild(profLbl);

  wFields.appendChild(fieldStepper("Magic bonus", Number(item.magicBonus)||0, function(v){
    item.magicBonus = v; save(); renderAll();
  }));

  card.appendChild(wFields);

  if(item.notes){
    var notesP = document.createElement("p");
    notesP.className = "inv-armor-note";
    notesP.textContent = item.notes;
    card.appendChild(notesP);
  }

  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";

  var atkBonus = weaponAttackBonus(c, item);
  var atkBtn = document.createElement("button");
  atkBtn.type = "button"; atkBtn.className = "btn small inv-roll-btn";
  atkBtn.textContent = "🎲 Attack " + fmtMod(atkBonus);
  atkBtn.addEventListener("click", function(){
    performRoll(20, 1, atkBonus, "none", (item.name||"Weapon") + " — Attack");
  });
  actions.appendChild(atkBtn);

  var parsed = parseDiceNotation(item.damageDice);
  var dmgBonus = weaponDamageBonus(c, item);
  var dmgBtn = document.createElement("button");
  dmgBtn.type = "button"; dmgBtn.className = "btn small inv-roll-btn";
  if(parsed){
    dmgBtn.textContent = "🎲 Damage " + parsed.qty + "d" + parsed.die + fmtMod(dmgBonus);
    dmgBtn.addEventListener("click", function(){
      performRoll(parsed.die, parsed.qty, dmgBonus, "none", (item.name||"Weapon") + " — Damage" + (item.damageType ? " (" + item.damageType + ")" : ""));
    });
  } else {
    dmgBtn.textContent = "🎲 Damage";
    dmgBtn.disabled = true;
    dmgBtn.title = "Enter damage dice like \"1d8\" to roll";
  }
  actions.appendChild(dmgBtn);

  card.appendChild(actions);
  return card;
}

function renderArmorCard(c, item, idx){
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card";
  card.appendChild(itemRow1(c, item, idx));
  card.appendChild(itemRow2(item));

  if(item.category==null) item.category = "light";
  if(item.baseAC==null) item.baseAC = 10;
  if(item.magicBonus==null) item.magicBonus = 0;

  var aFields = document.createElement("div");
  aFields.className = "inv-type-fields";

  var catField = document.createElement("div");
  catField.className = "field-inline";
  catField.innerHTML = "<label>Category</label>";
  var catSelect = document.createElement("select");
  ARMOR_CATEGORIES.forEach(function(cat){
    var o = document.createElement("option"); o.value = cat.key; o.textContent = cat.label;
    if(item.category===cat.key) o.selected = true;
    catSelect.appendChild(o);
  });
  catSelect.addEventListener("change", function(){ item.category = catSelect.value; save(); renderAll(); });
  catField.appendChild(catSelect);
  aFields.appendChild(catField);

  var baseField = document.createElement("div");
  baseField.className = "field-inline";
  baseField.innerHTML = "<label>Base AC</label>";
  var baseInput = document.createElement("input");
  baseInput.type = "number"; baseInput.className = "inv-baseac-input"; baseInput.value = item.baseAC;
  baseInput.addEventListener("input", function(){ item.baseAC = Number(baseInput.value)||0; save(); renderAll(); });
  baseField.appendChild(baseInput);
  aFields.appendChild(baseField);

  aFields.appendChild(fieldStepper("Magic bonus", Number(item.magicBonus)||0, function(v){
    item.magicBonus = v; save(); renderAll();
  }));

  card.appendChild(aFields);

  if(item.notes){
    var notesP = document.createElement("p");
    notesP.className = "inv-armor-note";
    notesP.textContent = item.notes;
    card.appendChild(notesP);
  }

  if(item.equipped){
    var acNote = document.createElement("p");
    acNote.className = "inv-armor-note";
    acNote.textContent = "Equipped — counted toward Armor Class on the Vitals tab.";
    card.appendChild(acNote);
  }

  return card;
}

function renderGearCard(c, item, idx){
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card";
  card.appendChild(itemRow1(c, item, idx));
  card.appendChild(itemRow2(item));

  var notesInput = document.createElement("input");
  notesInput.type = "text"; notesInput.className = "inv-notes";
  notesInput.value = item.notes||""; notesInput.placeholder = "Notes";
  notesInput.addEventListener("input", function(){ item.notes = notesInput.value; save(); });
  card.appendChild(notesInput);

  return card;
}

/* ---- Inventory panel ---- */
export function renderInventoryPanel(c){
  var panel = document.createElement("div");

  // Weapons
  var weaponCard = makeCard("Weapons", "attack & damage rolls use STR/DEX + proficiency automatically");
  var weaponList = document.createElement("div");
  weaponList.className = "ff-items-list inv-items-list";
  var anyWeapon = false;
  (c.inventory||[]).forEach(function(item, idx){
    if(item.type!=="weapon") return;
    anyWeapon = true;
    weaponList.appendChild(renderWeaponCard(c, item, idx));
  });
  if(!anyWeapon){
    var noWeapons = document.createElement("p");
    noWeapons.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);";
    noWeapons.textContent = "No weapons yet.";
    weaponList.appendChild(noWeapons);
  }
  weaponCard.appendChild(weaponList);
  var addWeaponBtn = document.createElement("button");
  addWeaponBtn.className = "btn small primary"; addWeaponBtn.style.marginTop = "12px";
  addWeaponBtn.textContent = "+ Add Weapon";
  addWeaponBtn.addEventListener("click", function(){ openWeaponPicker(c); });
  weaponCard.appendChild(addWeaponBtn);
  panel.appendChild(weaponCard);

  // Armor
  var armorCard = makeCard("Armor", "equip a piece to count it toward Armor Class");
  var armorList = document.createElement("div");
  armorList.className = "ff-items-list inv-items-list";
  var anyArmor = false;
  (c.inventory||[]).forEach(function(item, idx){
    if(item.type!=="armor") return;
    anyArmor = true;
    armorList.appendChild(renderArmorCard(c, item, idx));
  });
  if(!anyArmor){
    var noArmor = document.createElement("p");
    noArmor.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);";
    noArmor.textContent = "No armor yet.";
    armorList.appendChild(noArmor);
  }
  armorCard.appendChild(armorList);
  var addArmorBtn = document.createElement("button");
  addArmorBtn.className = "btn small primary"; addArmorBtn.style.marginTop = "12px";
  addArmorBtn.textContent = "+ Add Armor";
  addArmorBtn.addEventListener("click", function(){ openArmorPicker(c); });
  armorCard.appendChild(addArmorBtn);
  panel.appendChild(armorCard);

  // Other equipment
  var gearCard = makeCard("Other Equipment");
  var gearList = document.createElement("div");
  gearList.className = "ff-items-list inv-items-list";
  var anyGear = false;
  (c.inventory||[]).forEach(function(item, idx){
    if(item.type==="weapon" || item.type==="armor") return;
    anyGear = true;
    gearList.appendChild(renderGearCard(c, item, idx));
  });
  if(!anyGear){
    var noGear = document.createElement("p");
    noGear.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);";
    noGear.textContent = "No other items yet.";
    gearList.appendChild(noGear);
  }
  gearCard.appendChild(gearList);

  var addItemBtn = document.createElement("button");
  addItemBtn.className = "btn small"; addItemBtn.style.marginTop="10px";
  addItemBtn.style.color="var(--text-on-parch)"; addItemBtn.style.borderColor="var(--rule)";
  addItemBtn.textContent = "+ Add item";
  addItemBtn.addEventListener("click", function(){
    c.inventory.push({name:"", type:"gear", qty:1, equipped:false, notes:""});
    save(); renderAll();
  });
  gearCard.appendChild(addItemBtn);
  panel.appendChild(gearCard);

  // Currency
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

  var curSummary = document.createElement("div");
  curSummary.className = "currency-summary";
  curSummary.innerHTML = '<span>Total Wealth: <strong>' + totalGold.toFixed(2) + ' GP</strong></span>';
  curCard.appendChild(curSummary);
  panel.appendChild(curCard);

  return panel;
}
