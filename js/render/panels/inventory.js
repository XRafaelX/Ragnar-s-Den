import { save } from "../../core/state.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg, makeDiceSvg, makeDicesSvg, makeAlertSvg, makeCheckSvg, makeKebabSvg } from "../../ui/svg-icons.js";
import { performRoll } from "../../dice/dice.js";
import { fmtMod, weaponAttackBonus, weaponDamageBonus, weaponDamageDice, unarmedStrike, parseDiceNotation, tryEquip, handsInUse, itemHands, equipProblems, chosenWeaponFeature, isMagicWeapon, isProficientWithArmor, armorStrengthShortfall, powerAttackFeat, powerAttackOn, effectOn, isRangedWeapon, martialArtsApplies, attackRollMode, rageDamageBonus, duelingBonus, thrownAttack, offHandAttack, draconicBreath, characterResources } from "../../core/helpers.js";
import { ARMOR_DATA } from "../../data/armor.js";
import { renderArmorModelCard, renderElixirCard } from "./artificer.js";
import { showActionToast } from "../../ui/toast.js";
import { openWeaponPicker, openArmorPicker, openGearPicker } from "../armory.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { renderCurrencyCard } from "./coin-purse.js";
import { magicItemDef, magicItemActive, holsterKnives, holsterDamageBonus, attuneProblem } from "../../core/magic-items.js";
import { pipChanged, pipsRefilled } from "../../ui/fx.js";

var DAMAGE_TYPES = ["Slashing","Piercing","Bludgeoning","Acid","Cold","Fire","Force","Lightning","Necrotic","Poison","Psychic","Radiant","Thunder"];
var ARMOR_CATEGORIES = [
  {key:"light", label:"Light armor"},
  {key:"medium", label:"Medium armor"},
  {key:"heavy", label:"Heavy armor"},
  {key:"shield", label:"Shield"}
];

/* Saves and redraws the sheet without the tapped card moving on screen.
   A tap can grow or shrink what's above it (attuning a Heavy Holster adds
   a line to the Weapons card; equipping changes the hands line), and the
   redraw would otherwise leave the card a line higher or lower, as if the
   page scrolled by itself. */
function redrawKeeping(idx){
  var before = cardTop(idx);
  save(); renderAll();
  var after = cardTop(idx);
  if(before==null || after==null || after===before) return;
  var main = document.getElementById("main");
  if(main && main.scrollHeight > main.clientHeight) main.scrollTop += after - before;
  else window.scrollBy(0, after - before);
}
function cardTop(idx){
  var el = document.querySelector('.inv-item-card[data-idx="' + idx + '"]');
  return el ? el.getBoundingClientRect().top : null;
}

/* A magic item's attunement, in its ⋯ menu: "Attune" or "End
   attunement". At the attunement limit, or for a second copy, the entry
   is greyed out and a tap says why. Null for an item without it. */
function attuneEntry(c, item, idx){
  var def = magicItemDef(item);
  if(!def || !def.attunement) return null;
  var problem = attuneProblem(c, item);
  return {
    label: item.attuned ? "End attunement" : "Attune",
    blocked: problem,
    title: problem || (item.attuned ? "Its magic stops working until you attune again" : "Attune to it (a short rest spent with it) so its magic works"),
    onClick: function(){
      if(problem){ showActionToast(problem, true); return; }
      item.attuned = !item.attuned;
      redrawKeeping(idx);
    }
  };
}

/* The line under a magic item's name, the same on weapons and other
   gear: rarity, kind and attunement ("Uncommon · Wondrous item (knife
   holster) · attuned"); attuning is in the ⋯ menu. */
function magicItemLine(item, def){
  var line = document.createElement("div");
  line.className = "inv-card-subtitle inv-magic-line";
  line.appendChild(document.createTextNode(def.rarity + " · " + def.kind));
  if(def.attunement){
    var att = document.createElement("span");
    att.className = "inv-attune-state" + (item.attuned ? " on" : "");
    att.textContent = item.attuned ? "attuned" : "requires attunement";
    line.appendChild(document.createTextNode(" · "));
    line.appendChild(att);
  }
  return line;
}

/* The ⋯ button on an item card and its small menu ([{label, danger,
   blocked, title, onClick}]; a blocked entry is greyed out but still
   tapped, to say why). Closes on a pick, a tap elsewhere or Escape; taps on it
   never reach the header (which opens the item's sheet). */
function itemMenu(item, entries){
  var wrap = document.createElement("div");
  wrap.className = "inv-card-menu";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "catalog-row-menu-btn inv-menu-btn";
  btn.innerHTML = makeKebabSvg();
  btn.title = "More options";
  btn.setAttribute("aria-label", "More options for " + (item.name || "this item"));
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  var pop = document.createElement("div");
  pop.className = "catalog-row-dropdown";
  pop.setAttribute("role", "menu");
  entries.forEach(function(en){
    var it = document.createElement("button");
    it.type = "button";
    it.className = "catalog-dropdown-item" + (en.danger ? " danger" : "") + (en.blocked ? " blocked" : "");
    it.setAttribute("role", "menuitem");
    if(en.blocked) it.setAttribute("aria-disabled", "true");
    if(en.title) it.title = en.title;
    it.textContent = en.label;
    it.addEventListener("click", function(e){ e.stopPropagation(); close(); en.onClick(); });
    pop.appendChild(it);
  });
  wrap.appendChild(btn);
  wrap.appendChild(pop);
  wrap.addEventListener("click", function(e){ e.stopPropagation(); });
  function onDocClick(e){ if(!wrap.contains(e.target)) close(); }
  function onKey(e){ if(e.key==="Escape"){ close(); btn.focus(); } }
  function open(){
    pop.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
  }
  function close(){
    pop.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey);
  }
  btn.addEventListener("click", function(){ pop.classList.contains("open") ? close() : open(); });
  return wrap;
}

/* Compact header shared by weapon/armor cards: a name (click anywhere on
   the row, including the name itself, to open the edit sheet; renaming
   happens there instead of inline, so the name text has no invisible
   input hit-box left over to swallow clicks), a qty badge when stacked,
   an Equip switch (weapons and armor only: equipping other gear
   changes nothing, so it would only be clutter), and a ⋯ menu with
   Attune (magic items that need it), Edit details and Remove, so the name
   keeps the room on a phone. */
function itemHeader(c, item, idx, onOpenDetails, noEquip){
  var header = document.createElement("div");
  header.className = "inv-card-header";
  header.addEventListener("click", function(){ onOpenDetails(); });

  var titleGroup = document.createElement("div");
  titleGroup.className = "inv-card-title-group";

  var nameSpan = document.createElement("span");
  nameSpan.className = "inv-name-inline";
  nameSpan.textContent = item.name || "Unnamed item";
  titleGroup.appendChild(nameSpan);

  if(item.qty!=null && item.qty!==1){
    var qtyBadge = document.createElement("span");
    qtyBadge.className = "inv-qty-badge";
    qtyBadge.textContent = "×" + item.qty;
    titleGroup.appendChild(qtyBadge);
  }
  header.appendChild(titleGroup);

  var actions = document.createElement("div");
  actions.className = "inv-card-header-actions";

  if(!noEquip){
    // A button whose label follows the state: "Equip", then "Equipped"
    // with a tick. Never reads Equipped on something that is not.
    var eqBtn = document.createElement("button");
    eqBtn.type = "button";
    eqBtn.className = "inv-equip-btn" + (item.equipped ? " on" : "");
    eqBtn.setAttribute("aria-pressed", item.equipped ? "true" : "false");
    if(item.equipped) eqBtn.innerHTML = makeCheckSvg();
    eqBtn.appendChild(document.createTextNode(item.equipped ? "Equipped" : "Equip"));
    eqBtn.title = item.equipped ? "Equipped. Tap to unequip." : "Equip";
    eqBtn.addEventListener("click", function(e){
      e.stopPropagation();
      if(item.equipped){ item.equipped = false; redrawKeeping(idx); return; }
      // One suit of armor, one shield, two hands (see tryEquip).
      var res = tryEquip(c, item);
      if(!res.ok){ showActionToast(res.message, true); return; }
      delete item.thrown; // a returning weapon back in hand
      if(res.message) showActionToast(res.message);
      redrawKeeping(idx);
    });
    actions.appendChild(eqBtn);
  }

  actions.appendChild(itemMenu(item, [
    attuneEntry(c, item, idx),
    {label:"Edit details", onClick:onOpenDetails},
    {label:"Remove", danger:true, onClick:function(){
      confirmDialog("Remove "+(item.name||"this item")+"?", "This cannot be undone.", function(){
        c.inventory.splice(idx,1); save(); renderAll(); playDelete();
      });
    }}
  ].filter(Boolean)));

  header.appendChild(actions);
  return header;
}

/* Shared bottom-sheet title bar: an editable name field (renaming lives
   here now, not on the collapsed card), a short summary line, and a
   close button (tapping the dimmed backdrop or Escape also closes it). */
export function sheetHeader(body, item, defaultName, subtitle, close){
  var header = document.createElement("div");
  header.className = "bs-header";
  var titleWrap = document.createElement("div");
  titleWrap.style.cssText = "flex:1;min-width:0;";
  var nameInput = document.createElement("input");
  nameInput.type = "text"; nameInput.className = "bs-title-input";
  nameInput.value = item.name||""; nameInput.placeholder = defaultName;
  nameInput.addEventListener("input", function(){ item.name = nameInput.value; save(); renderAll(); });
  titleWrap.appendChild(nameInput);
  header.appendChild(titleWrap);
  var closeBtn = document.createElement("button");
  closeBtn.className = "bs-close"; closeBtn.textContent = "✕"; closeBtn.title = "Close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", close);
  header.appendChild(closeBtn);
  body.appendChild(header);
  if(subtitle){
    var sub = document.createElement("p");
    sub.className = "bs-subtitle"; sub.textContent = subtitle;
    body.appendChild(sub);
  }
}

/* Small inline +/- stepper for a numeric item field (e.g. magic bonus).
   Updates its own displayed value directly rather than relying on a
   re-render, since it can live inside the bottom sheet (a separate part
   of the page that renderAll() never touches). */
function fieldStepper(label, value, onChange){
  var wrap = document.createElement("div");
  wrap.className = "field-inline inv-stepper-field";
  var l = document.createElement("label");
  l.textContent = label;
  wrap.appendChild(l);
  var stepper = document.createElement("div");
  stepper.className = "stat-stepper inv-mini-stepper";

  var current = value;

  var valSpan = document.createElement("span");
  valSpan.className = "stat-score-val";
  valSpan.textContent = fmtMod(current);

  var downBtn = document.createElement("button");
  downBtn.type = "button";
  downBtn.className = "stat-arrow-btn stat-arrow-down";
  downBtn.innerHTML = makeStatArrowSvg("down");
  downBtn.addEventListener("click", function(e){
    e.stopPropagation(); current -= 1; valSpan.textContent = fmtMod(current); onChange(current);
  });

  var upBtn = document.createElement("button");
  upBtn.type = "button";
  upBtn.className = "stat-arrow-btn stat-arrow-up";
  upBtn.innerHTML = makeStatArrowSvg("up");
  upBtn.addEventListener("click", function(e){
    e.stopPropagation(); current += 1; valSpan.textContent = fmtMod(current); onChange(current);
  });

  stepper.appendChild(downBtn);
  stepper.appendChild(valSpan);
  stepper.appendChild(upBtn);
  wrap.appendChild(stepper);
  return wrap;
}

/* Opens the gear item's editable fields (Qty, Notes) in a bottom sheet;
   same treatment as weapons/armor. Gear has no Equipped toggle. */
function openGearSheet(c, item, idx){
  openBottomSheet(function(body, refresh, close){
    var subtitleParts = ["Qty " + (item.qty!=null?item.qty:1)];
    if(item.notes) subtitleParts.push(item.notes);
    sheetHeader(body, item, "Item name", subtitleParts.join(" · "), close);

    var details = document.createElement("div");
    details.className = "inv-type-fields";

    var qtyField = document.createElement("div");
    qtyField.className = "field-inline";
    qtyField.innerHTML = "<label>Qty</label>";
    var qtyInput = document.createElement("input");
    qtyInput.type = "number"; qtyInput.min = "0"; qtyInput.className = "inv-qty-input";
    qtyInput.value = item.qty!=null?item.qty:1;
    qtyInput.addEventListener("input", function(){ item.qty = Number(qtyInput.value)||0; save(); renderAll(); });
    qtyField.appendChild(qtyInput);
    details.appendChild(qtyField);

    var notesField = document.createElement("div");
    notesField.className = "field-inline";
    notesField.innerHTML = "<label>Notes</label>";
    var notesInput = document.createElement("input");
    notesInput.type = "text"; notesInput.value = item.notes||""; notesInput.placeholder = "e.g. material, quirks…";
    notesInput.addEventListener("input", function(){ item.notes = notesInput.value; save(); renderAll(); });
    notesField.appendChild(notesInput);
    details.appendChild(notesField);

    body.appendChild(details);

    var def = magicItemDef(item);
    if(def){
      var desc = document.createElement("p");
      desc.className = "inv-magic-text";
      desc.textContent = def.text;
      body.appendChild(desc);
    }
  });
}

/* Opens the weapon's editable fields (Qty, Damage dice/type, Ability,
   Proficient, Magic bonus) in a bottom sheet instead of growing the card
   in place. */
function openWeaponSheet(c, item, idx){
  openBottomSheet(function(body, refresh, close){
    var abilityLabel = item.ability==="finesse" ? "Finesse" : (item.ability==="dex" ? "DEX" : "STR");
    var subtitleParts = [];
    if(item.damageDice) subtitleParts.push(item.damageDice + (item.damageType ? " " + item.damageType : ""));
    subtitleParts.push(abilityLabel);
    subtitleParts.push(item.proficient ? "Proficient" : "Not proficient");
    if(item.notes) subtitleParts.push(item.notes);
    sheetHeader(body, item, "Weapon name", subtitleParts.join(" · "), close);

    var details = document.createElement("div");
    details.className = "inv-type-fields";

    var qtyField = document.createElement("div");
    qtyField.className = "field-inline";
    qtyField.innerHTML = "<label>Qty</label>";
    var qtyInput = document.createElement("input");
    qtyInput.type = "number"; qtyInput.min = "0"; qtyInput.className = "inv-qty-input";
    qtyInput.value = item.qty!=null?item.qty:1;
    qtyInput.addEventListener("input", function(){ item.qty = Number(qtyInput.value)||0; save(); renderAll(); });
    qtyField.appendChild(qtyInput);
    details.appendChild(qtyField);

    var diceField = document.createElement("div");
    diceField.className = "field-inline";
    diceField.innerHTML = "<label>Damage dice</label>";
    var diceInput = document.createElement("input");
    diceInput.type = "text"; diceInput.className = "inv-dice-input";
    diceInput.placeholder = "e.g. 1d8"; diceInput.value = item.damageDice||"";
    diceInput.addEventListener("input", function(){ item.damageDice = diceInput.value; save(); renderAll(); });
    diceField.appendChild(diceInput);
    details.appendChild(diceField);

    details.appendChild(inlinePicker("Damage type",
      [{value:"", label:"None", muted:true}].concat(DAMAGE_TYPES), item.damageType || "",
      function(v){ item.damageType = v; save(); renderAll(); }));

    details.appendChild(inlinePicker("Ability",
      [{value:"str", label:"Strength"}, {value:"dex", label:"Dexterity"}, {value:"finesse", label:"Finesse (best)"}], item.ability,
      function(v){ item.ability = v; save(); renderAll(); }));

    var profLbl = document.createElement("label");
    profLbl.className = "inv-prof-label";
    var profCb = document.createElement("input"); profCb.type="checkbox"; profCb.className="chk"; profCb.checked = !!item.proficient;
    profCb.addEventListener("change", function(){ item.proficient = profCb.checked; save(); renderAll(); });
    profLbl.appendChild(profCb);
    profLbl.appendChild(document.createTextNode("Proficient"));
    details.appendChild(profLbl);

    // Hex Warrior and similar: mark one weapon to attack with another
    // ability. Only one weapon can be marked, so ticking one clears the rest.
    var chosenFeat = chosenWeaponFeature(c);
    if(chosenFeat){
      var chosenLbl = document.createElement("label");
      chosenLbl.className = "inv-prof-label";
      var chosenCb = document.createElement("input"); chosenCb.type="checkbox"; chosenCb.className="chk"; chosenCb.checked = !!item.chosenWeapon;
      chosenCb.addEventListener("change", function(){
        (c.inventory||[]).forEach(function(i){ if(i!==item) delete i.chosenWeapon; });
        if(chosenCb.checked) item.chosenWeapon = true; else delete item.chosenWeapon;
        save(); renderAll();
      });
      chosenLbl.appendChild(chosenCb);
      chosenLbl.appendChild(document.createTextNode(chosenFeat.name + " weapon (uses " + chosenFeat.chosenWeaponAbility.toUpperCase() + ")"));
      details.appendChild(chosenLbl);
    }

    details.appendChild(fieldStepper("Magic bonus", Number(item.magicBonus)||0, function(v){
      item.magicBonus = v; save(); renderAll();
    }));

    // Magic without a bonus (a Flame Tongue, a +0 weapon): counts for
    // Battle Ready and anything else that needs a magic weapon. A bonus or
    // an infusion already makes it magic, so the box shows ticked.
    var alreadyMagic = (Number(item.magicBonus)||0) > 0 || (isMagicWeapon(c, item) && !item.magic);
    var magicLbl = document.createElement("label");
    magicLbl.className = "inv-prof-label";
    var magicCb = document.createElement("input"); magicCb.type="checkbox"; magicCb.className="chk";
    magicCb.checked = isMagicWeapon(c, item);
    magicCb.disabled = alreadyMagic;
    if(alreadyMagic) magicLbl.title = (Number(item.magicBonus)||0) > 0 ? "Magic because of its bonus" : "Magic because it's infused";
    magicCb.addEventListener("change", function(){
      if(magicCb.checked) item.magic = true; else delete item.magic;
      save(); renderAll();
    });
    magicLbl.appendChild(magicCb);
    magicLbl.appendChild(document.createTextNode("Magic weapon"));
    details.appendChild(magicLbl);

    body.appendChild(details);

    var def = magicItemDef(item);
    if(def){
      var desc = document.createElement("p");
      desc.className = "inv-magic-text";
      desc.textContent = def.text;
      body.appendChild(desc);
    }
  });
}

/* The unarmed strike: always proficient, nothing to equip or edit. */
function renderUnarmedCard(u){
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card is-equipped inv-unarmed-card";
  var header = document.createElement("div");
  header.className = "inv-card-header";
  var titleGroup = document.createElement("div");
  titleGroup.className = "inv-card-title-group";
  var nameSpan = document.createElement("span");
  nameSpan.className = "inv-name-inline";
  nameSpan.textContent = u.name;
  titleGroup.appendChild(nameSpan);
  header.appendChild(titleGroup);
  card.appendChild(header);
  var subtitle = document.createElement("div");
  subtitle.className = "inv-card-subtitle";
  subtitle.textContent = [(u.die ? "1d" + u.die : "1") + " " + u.type, u.ability, "Proficient"].concat(u.parts).join(" · ");
  card.appendChild(subtitle);
  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";
  var atkBtn = document.createElement("button");
  atkBtn.type = "button"; atkBtn.className = "btn small inv-roll-btn";
  atkBtn.innerHTML = makeDiceSvg() + "Attack " + fmtMod(u.attack) + (u.roll && u.roll.mode==="dis" ? " (Dis)" : "");
  if(u.roll && u.roll.reason) atkBtn.title = u.roll.reason;
  atkBtn.addEventListener("click", function(){ performRoll(20, 1, u.attack, u.roll ? u.roll.mode : "none", u.name + ": Attack"); });
  actions.appendChild(atkBtn);
  var dmgBtn = document.createElement("button");
  dmgBtn.type = "button"; dmgBtn.className = "btn small inv-roll-btn";
  if(u.die){
    dmgBtn.innerHTML = makeDicesSvg() + "Damage 1d" + u.die + fmtMod(u.bonus);
    dmgBtn.addEventListener("click", function(){ performRoll(u.die, 1, u.bonus, "none", u.name + ": Damage (" + u.type + ")"); });
  } else {
    // A plain unarmed strike deals a flat 1 + STR: nothing to roll.
    dmgBtn.innerHTML = makeDicesSvg() + "Damage " + Math.max(0, 1 + u.bonus);
    dmgBtn.disabled = true;
    dmgBtn.title = "A plain unarmed strike deals 1 + STR " + u.type.toLowerCase() + " damage, no dice";
  }
  actions.appendChild(dmgBtn);
  // Unarmed Fighting: 1d4 to a creature you're grappling, each turn.
  if(u.grappleDie){
    var grapBtn = document.createElement("button");
    grapBtn.type = "button"; grapBtn.className = "btn small inv-roll-btn inv-grapple-btn";
    grapBtn.innerHTML = makeDicesSvg() + "Grappled 1d" + u.grappleDie;
    grapBtn.title = "Unarmed Fighting: at the start of each of your turns, deal 1d4 bludgeoning damage to one creature grappled by you";
    grapBtn.addEventListener("click", function(){ performRoll(u.grappleDie, 1, 0, "none", "Unarmed Fighting: grappled creature (Bludgeoning)"); });
    actions.appendChild(grapBtn);
  }
  card.appendChild(actions);
  return card;
}

/* A dragonborn's Breath Weapon, from the Draconic Ancestry picked: its
   area, save DC and damage, and its one use (the "race:breath_weapon"
   resource, given back by a short or long rest). Rolling the damage
   spends the use; Get it back undoes one spent by mistake. */
var SAVE_NAMES = {DEX: "Dexterity", CON: "Constitution"};
function renderBreathCard(c, b){
  var key = "race:breath_weapon";
  var res = characterResources(c).find(function(r){ return r.key===key; });
  var used = !!(res && res.used);
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card is-equipped inv-breath-card" + (used ? " is-spent" : "");
  var header = document.createElement("div");
  header.className = "inv-card-header";
  var titleGroup = document.createElement("div");
  titleGroup.className = "inv-card-title-group";
  var nameSpan = document.createElement("span");
  nameSpan.className = "inv-name-inline";
  nameSpan.textContent = "Breath Weapon";
  titleGroup.appendChild(nameSpan);
  header.appendChild(titleGroup);
  var pips = document.createElement("span");
  pips.className = "inv-holster-pips inv-breath-pips";
  pips.setAttribute("aria-label", used ? "Used" : "Ready");
  var pip = document.createElement("span");
  pip.className = "res-pip" + (used ? "" : " full");
  pips.appendChild(pip);
  header.appendChild(pips);
  card.appendChild(header);
  var subtitle = document.createElement("div");
  subtitle.className = "inv-card-subtitle";
  subtitle.textContent = [b.dragon, b.area, b.damage, b.save + " save DC " + b.dc, "Action"].join(" · ");
  card.appendChild(subtitle);
  var note = document.createElement("p");
  note.className = "inv-armor-note" + (used ? "" : " inv-equipped-note");
  note.textContent = used ? "Used. You get it back after a short or long rest."
    : "Each creature in the area makes a " + (SAVE_NAMES[b.save] || b.save) + " saving throw: full damage on a fail, half on a success. Once per short or long rest.";
  card.appendChild(note);

  function setUsed(n){
    if(n) c.resourcesUsed[key] = n; else delete c.resourcesUsed[key];
    save(); renderAll();
    pipChanged(document.querySelector(".inv-breath-pips"), 0, !!n);
  }
  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";
  var dmgBtn = document.createElement("button");
  dmgBtn.type = "button"; dmgBtn.className = "btn small inv-roll-btn";
  dmgBtn.innerHTML = makeDicesSvg() + "Damage " + b.dice + "d6";
  dmgBtn.disabled = used;
  dmgBtn.title = used ? "Used: you get it back after a short or long rest" : "Roll the damage and use your breath weapon";
  dmgBtn.addEventListener("click", function(){
    performRoll(6, b.dice, 0, "none", "Breath Weapon: Damage (" + b.damage + ")");
    setUsed(1);
  });
  actions.appendChild(dmgBtn);
  if(used){
    var backBtn = document.createElement("button");
    backBtn.type = "button"; backBtn.className = "btn small inv-roll-btn";
    backBtn.textContent = "Get it back";
    backBtn.title = "Mark the breath weapon as ready again";
    backBtn.addEventListener("click", function(){ setUsed(0); });
    actions.appendChild(backBtn);
  }
  card.appendChild(actions);
  return card;
}

function renderWeaponCard(c, item, idx){
  if(item.ability==null) item.ability = "str";
  if(item.proficient==null) item.proficient = true;
  if(item.magicBonus==null) item.magicBonus = 0;

  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card" + (item.equipped ? " is-equipped" : " is-stowed");
  card.dataset.idx = idx;
  card.appendChild(itemHeader(c, item, idx, function(){ openWeaponSheet(c, item, idx); }));
  // A magic weapon from the Armory's list: its rarity, kind and
  // attunement first, in the same place as on other magic items.
  var def = magicItemDef(item);
  var active = def && magicItemActive(item);
  if(def) card.appendChild(magicItemLine(item, def));

  var abilityLabel = item.ability==="finesse" ? "Finesse" : (item.ability==="dex" ? "DEX" : "STR");
  // Martial Arts: a monk weapon uses the better of STR and DEX, and the
  // Martial Arts die when it's bigger than the weapon's.
  if(martialArtsApplies(c, item)) abilityLabel = "Martial Arts (STR or DEX)";
  var maDice = weaponDamageDice(c, item);
  if(maDice && maDice.martialArts) abilityLabel += " · Martial Arts d" + maDice.die;
  var subtitleParts = [];
  if(item.damageDice) subtitleParts.push(item.damageDice + (item.damageType ? " " + item.damageType : ""));
  subtitleParts.push(abilityLabel);
  subtitleParts.push(item.proficient ? "Proficient" : "Not proficient");
  if(item.magicBonus) subtitleParts.push(fmtMod(item.magicBonus) + " magic");
  else if(isMagicWeapon(c, item)) subtitleParts.push("Magic");
  var chosenFeat = item.chosenWeapon && chosenWeaponFeature(c);
  if(chosenFeat) subtitleParts.push(chosenFeat.name);
  var rage = rageDamageBonus(c, item);
  if(rage) subtitleParts.push("Rage +" + rage + " damage");
  if(duelingBonus(c, item)) subtitleParts.push("Dueling +2 damage");
  var subtitle = document.createElement("div");
  subtitle.className = "inv-card-subtitle";
  subtitle.textContent = subtitleParts.join(" · ");
  card.appendChild(subtitle);

  if(item.notes){
    var notesP = document.createElement("p");
    notesP.className = "inv-armor-note";
    notesP.textContent = item.notes;
    card.appendChild(notesP);
  }

  // A returning weapon out of your hand says so.
  if(def && def.returning && item.thrown){
    var thrownNote = document.createElement("p");
    thrownNote.className = "inv-armor-note inv-thrown-note";
    thrownNote.textContent = active
      ? "Thrown: out of your hand. While you can see it, call it back with an action. If it's stuck in a creature, the creature makes a contested Strength check to keep it; if it wins, it keeps the trident but is pulled 5 ft toward you."
      : "Thrown: out of your hand. Attune to it (⋯ menu) to call it back, or pick it up.";
    card.appendChild(thrownNote);
  }

  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";

  var atkBonus = weaponAttackBonus(c, item);
  var atkRoll = attackRollMode(c, item);
  var atkBtn = document.createElement("button");
  atkBtn.type = "button"; atkBtn.className = "btn small inv-roll-btn";
  atkBtn.innerHTML = makeDiceSvg() + "Attack " + fmtMod(atkBonus) + (atkRoll.mode==="dis" ? " (Dis)" : atkRoll.mode==="adv" ? " (Adv)" : "");
  if(atkRoll.reason) atkBtn.title = atkRoll.reason;
  atkBtn.addEventListener("click", function(){
    performRoll(20, 1, atkBonus, atkRoll.mode, (item.name||"Weapon") + ": Attack");
  });
  actions.appendChild(atkBtn);

  // (A monk weapon rolls the Martial Arts die when it's bigger.)
  var parsed = weaponDamageDice(c, item);
  var dmgBonus = weaponDamageBonus(c, item);
  var dmgBtn = document.createElement("button");
  dmgBtn.type = "button"; dmgBtn.className = "btn small inv-roll-btn";
  if(parsed){
    dmgBtn.innerHTML = makeDicesSvg() + "Damage " + parsed.qty + "d" + parsed.die + fmtMod(dmgBonus);
    dmgBtn.addEventListener("click", function(){
      performRoll(parsed.die, parsed.qty, dmgBonus, "none", (item.name||"Weapon") + ": Damage" + (item.damageType ? " (" + item.damageType + ")" : ""));
    });
  } else {
    dmgBtn.innerHTML = makeDicesSvg() + "Damage";
    dmgBtn.disabled = true;
    dmgBtn.title = "Enter damage dice like \"1d8\" to roll";
  }
  actions.appendChild(dmgBtn);

  // Thrown: a ranged attack, when its numbers differ (Archery, Thrown
  // Weapon Fighting, rage).
  var thrown = parsed && thrownAttack(c, item);
  if(thrown){
    var dmgLabel = (item.name||"Weapon") + ": Thrown damage" + (item.damageType ? " (" + item.damageType + ")" : "");
    if(thrown.attack!==atkBonus){
      var tAtk = document.createElement("button");
      tAtk.type = "button"; tAtk.className = "btn small inv-roll-btn inv-thrown-btn";
      tAtk.innerHTML = makeDiceSvg() + "Thrown attack " + fmtMod(thrown.attack) + (atkRoll.mode==="dis" ? " (Dis)" : atkRoll.mode==="adv" ? " (Adv)" : "");
      tAtk.title = "Thrown, a ranged attack: " + thrown.parts.join(", ");
      tAtk.addEventListener("click", function(){ performRoll(20, 1, thrown.attack, atkRoll.mode, (item.name||"Weapon") + ": Thrown attack"); });
      actions.appendChild(tAtk);
    }
    if(thrown.damage!==dmgBonus){
      var tDmg = document.createElement("button");
      tDmg.type = "button"; tDmg.className = "btn small inv-roll-btn inv-thrown-btn";
      tDmg.innerHTML = makeDicesSvg() + "Thrown " + parsed.qty + "d" + parsed.die + fmtMod(thrown.damage);
      tDmg.title = "Thrown, a ranged attack: " + thrown.parts.join(", ");
      tDmg.addEventListener("click", function(){ performRoll(parsed.die, parsed.qty, thrown.damage, "none", dmgLabel); });
      actions.appendChild(tDmg);
    }
  }

  // Two-weapon fighting: the bonus action attack with the other hand.
  var off = parsed && offHandAttack(c, item);
  if(off){
    var offBtn = document.createElement("button");
    offBtn.type = "button"; offBtn.className = "btn small inv-roll-btn inv-offhand-btn";
    offBtn.innerHTML = makeDicesSvg() + "Off-hand " + parsed.qty + "d" + parsed.die + fmtMod(off.damage);
    var offTag = document.createElement("span");
    offTag.className = "inv-action-tag"; offTag.textContent = "Bonus action";
    offBtn.appendChild(offTag);
    offBtn.title = off.style
      ? "Two-weapon fighting: after attacking with a weapon in your other hand, a bonus action attack with this one. Two-Weapon Fighting adds your ability modifier to its damage."
      : "Two-weapon fighting: after attacking with a weapon in your other hand, a bonus action attack with this one. Its damage leaves out your ability modifier (unless it's negative).";
    offBtn.addEventListener("click", function(){
      performRoll(parsed.die, parsed.qty, off.damage, "none", (item.name||"Weapon") + ": Off-hand damage" + (item.damageType ? " (" + item.damageType + ")" : ""));
    });
    actions.appendChild(offBtn);
  }

  // Symbiotic Entity: melee weapon hits deal an extra 1d6 poison.
  if(effectOn(c, "symbiotic_entity") && !isRangedWeapon(item)){
    var sporeBtn = document.createElement("button");
    sporeBtn.type = "button"; sporeBtn.className = "btn small inv-roll-btn";
    sporeBtn.innerHTML = makeDicesSvg() + "+1d6 poison";
    sporeBtn.title = "Symbiotic Entity: extra poison damage on a hit";
    sporeBtn.addEventListener("click", function(){
      performRoll(6, 1, 0, "none", (item.name||"Weapon") + ": Symbiotic Entity (poison)");
    });
    actions.appendChild(sporeBtn);
  }

  // Great Weapon Master / Sharpshooter: -5 to hit, +10 damage while on.
  var powerFeat = powerAttackFeat(c, item);
  if(powerFeat){
    var on = powerAttackOn(c, item);
    var power = document.createElement("button");
    power.type = "button";
    power.className = "btn small inv-power-btn" + (on ? " primary" : "");
    power.setAttribute("aria-pressed", on ? "true" : "false");
    // The feat's name only shows on a phone, where the switch has its own row.
    var powerName = document.createElement("span");
    powerName.className = "inv-power-feat";
    powerName.textContent = powerFeat;
    power.appendChild(powerName);
    power.appendChild(document.createTextNode("−5 / +10"));
    power.title = powerFeat + ": " + (on ? "on. Attacks take −5 to hit and deal +10 damage. Tap to turn off." : "take −5 to hit for +10 damage");
    power.addEventListener("click", function(){
      if(on) delete item.powerAttack; else item.powerAttack = true;
      redrawKeeping(idx);
    });
    actions.appendChild(power);
  }

  // Returning weapon: Throw takes it out of your hand; Call it back (an
  // action, attuned) or Pick it up puts it back in a free hand.
  if(def && def.returning){
    if(!item.thrown){
      var throwBtn = document.createElement("button");
      throwBtn.type = "button"; throwBtn.className = "btn small inv-roll-btn";
      throwBtn.textContent = "Throw";
      throwBtn.title = "Mark it thrown: out of your hand until you call it back";
      throwBtn.addEventListener("click", function(){ item.thrown = true; item.equipped = false; redrawKeeping(idx); });
      actions.appendChild(throwBtn);
    } else {
      var back = function(how){
        delete item.thrown;
        var res = tryEquip(c, item);
        redrawKeeping(idx);
        showActionToast(res.ok ? (item.name || "It") + (how==="call" ? " flies back to your hand." : " is back in your hand.")
          : (item.name || "It") + " is back, but your hands are full: it's with your gear.", !res.ok);
      };
      var callBtn = document.createElement("button");
      callBtn.type = "button"; callBtn.className = "btn small inv-roll-btn";
      callBtn.textContent = "Call it back";
      var tag = document.createElement("span");
      tag.className = "inv-action-tag"; tag.textContent = "Action";
      callBtn.appendChild(tag);
      callBtn.disabled = !active;
      callBtn.title = active ? "It flies back to your hand" : "Attune to it to call it back";
      callBtn.addEventListener("click", function(){ back("call"); });
      actions.appendChild(callBtn);
      var pickBtn = document.createElement("button");
      pickBtn.type = "button"; pickBtn.className = "btn small inv-roll-btn";
      pickBtn.textContent = "Pick it up";
      pickBtn.title = "You picked it up by hand";
      pickBtn.addEventListener("click", function(){ back("pick"); });
      actions.appendChild(pickBtn);
    }
  }
  card.appendChild(actions);

  return card;
}

/* Opens the armor's editable fields (Category, Base AC, Magic bonus) in a
   bottom sheet instead of growing the card in place. */
/* A labelled dropdown in a sheet's .field-inline grid (themed, boxed
   like the inputs beside it). */
function inlinePicker(label, items, value, onPick){
  var f = document.createElement("div");
  f.className = "field-inline";
  f.innerHTML = "<label>"+label+"</label>";
  f.appendChild(themedPicker({ groups:{"":items}, value:value, ariaLabel:label, search:false, onPick:onPick }));
  return f;
}

function openArmorSheet(c, item, idx){
  openBottomSheet(function(body, refresh, close){
    var catLabel = (ARMOR_CATEGORIES.find(function(cat){ return cat.key===item.category; })||{}).label || item.category;
    var acText = item.category==="shield" ? "+" + item.baseAC + " AC" : "Base AC " + item.baseAC;
    var subtitleParts = [acText, catLabel];
    if(item.notes) subtitleParts.push(item.notes);
    sheetHeader(body, item, "Armor name", subtitleParts.join(" · "), close);

    var details = document.createElement("div");
    details.className = "inv-type-fields";

    details.appendChild(inlinePicker("Category",
      ARMOR_CATEGORIES.map(function(cat){ return {value:cat.key, label:cat.label}; }), item.category,
      function(v){ item.category = v; save(); renderAll(); }));

    var baseField = document.createElement("div");
    baseField.className = "field-inline";
    baseField.innerHTML = "<label>Base AC</label>";
    var baseInput = document.createElement("input");
    baseInput.type = "number"; baseInput.className = "inv-baseac-input"; baseInput.value = item.baseAC;
    baseInput.addEventListener("input", function(){ item.baseAC = Number(baseInput.value)||0; save(); renderAll(); });
    baseField.appendChild(baseInput);
    details.appendChild(baseField);

    details.appendChild(fieldStepper("Magic bonus", Number(item.magicBonus)||0, function(v){
      item.magicBonus = v; save(); renderAll();
    }));

    body.appendChild(details);
  });
}

function renderArmorCard(c, item, idx){
  if(item.category==null) item.category = "light";
  if(item.baseAC==null) item.baseAC = 10;
  if(item.magicBonus==null) item.magicBonus = 0;

  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card" + (item.equipped ? " is-equipped" : " is-stowed");
  card.dataset.idx = idx;
  card.appendChild(itemHeader(c, item, idx, function(){ openArmorSheet(c, item, idx); }));

  var catLabel = (ARMOR_CATEGORIES.find(function(cat){ return cat.key===item.category; })||{}).label || item.category;
  var acText = item.category==="shield" ? "+" + item.baseAC + " AC" : "Base AC " + item.baseAC;
  var subtitleParts = [acText, catLabel];
  if(item.magicBonus) subtitleParts.push(fmtMod(item.magicBonus) + " magic");
  var armorData = ARMOR_DATA[item.name];
  if(item.stealthDisadvantage || (armorData && armorData.stealthDisadvantage)) subtitleParts.push("Stealth disadvantage");
  if(!isProficientWithArmor(c, item)) subtitleParts.push("Not proficient");
  var strShort = armorStrengthShortfall(c, item);
  if(strShort) subtitleParts.push("Needs STR "+strShort+" (speed -10 ft)");
  var subtitle = document.createElement("div");
  subtitle.className = "inv-card-subtitle";
  subtitle.textContent = subtitleParts.join(" · ");
  card.appendChild(subtitle);

  // A note that only repeats the line above ("+2 AC", "Disadvantage on
  // Stealth checks") is left out; anything else the player wrote shows.
  var note = (item.notes || "").trim();
  var repeats = note.toLowerCase()===acText.toLowerCase() || (/^disadvantage on stealth( checks)?\.?$/i.test(note) && subtitleParts.indexOf("Stealth disadvantage")!==-1);
  if(note && !repeats){
    var notesP = document.createElement("p");
    notesP.className = "inv-armor-note";
    notesP.textContent = item.notes;
    card.appendChild(notesP);
  }

  return card;
}

/* A magic item from the Armory's list: what it is, attunement in the
   header, and for a Heavy Holster the knives in it. Its description is in
   the sheet the row opens. */
function renderMagicItemCard(c, item, idx, def){
  var card = document.createElement("div");
  var active = magicItemActive(item);
  card.className = "ff-item-card inv-item-card" + (def.attunement ? (active ? " is-equipped" : " is-stowed") : "");
  card.dataset.idx = idx;
  card.appendChild(itemHeader(c, item, idx, function(){ openGearSheet(c, item, idx); }, true));
  card.appendChild(magicItemLine(item, def));
  if(item.notes){
    var notesP = document.createElement("p");
    notesP.className = "inv-armor-note";
    notesP.textContent = item.notes;
    card.appendChild(notesP);
  }
  if(def.holster) card.appendChild(holsterBlock(c, item, idx, def.holster, active));
  return card;
}

/* The Heavy Holster's knives: a pip each, what they're doing for you now,
   and Throw / Summon buttons. Summoning is the holster's magic, so it
   needs attunement; taking a knife out doesn't. */
function holsterBlock(c, item, idx, h, active){
  var knives = holsterKnives(item);
  var box = document.createElement("div");
  box.className = "inv-holster";
  box.dataset.idx = idx;

  var row = document.createElement("div");
  row.className = "inv-holster-row";
  var pips = document.createElement("span");
  pips.className = "inv-holster-pips";
  for(var i = 0; i < h.capacity; i++){
    var pip = document.createElement("span");
    pip.className = "res-pip" + (i < knives ? " full" : "");
    pips.appendChild(pip);
  }
  row.appendChild(pips);
  var count = document.createElement("span");
  count.className = "inv-holster-count";
  count.textContent = knives + " of " + h.capacity + " knives holstered";
  row.appendChild(count);
  box.appendChild(row);

  var effect = document.createElement("p");
  effect.className = "inv-armor-note" + (active ? " inv-equipped-note" : "");
  effect.textContent = !active ? "Attune to it (⋯ menu) to use its magic."
    : knives ? "+" + knives * h.damagePerKnife + " damage on your attacks, added to your weapons' damage rolls."
    : "Empty: +" + h.emptySpeed + " ft speed, counted on the Vitals tab.";
  box.appendChild(effect);

  function setKnives(n){
    var before = knives;
    item.knives = n;
    redrawKeeping(idx);
    var drawn = document.querySelector('.inv-holster[data-idx="' + idx + '"] .inv-holster-pips');
    // Thrown: the last full pip empties. Summoned: the empty ones fill.
    if(n < before) pipChanged(drawn, n, true);
    else pipsRefilled(drawn, before, n);
  }

  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";
  function button(label, tag, title, enabled, onClick){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small inv-roll-btn";
    b.textContent = label;
    if(tag){
      var t = document.createElement("span");
      t.className = "inv-action-tag";
      t.textContent = tag;
      b.appendChild(t);
    }
    b.title = title;
    b.disabled = !enabled;
    b.addEventListener("click", onClick);
    actions.appendChild(b);
  }
  button("Throw a knife", "", knives ? "Take a knife out of the holster to throw it" : "The holster is empty", knives > 0, function(){ setKnives(knives - 1); });
  var why = !active ? "Attune to the holster to summon knives" : "The holster is full";
  button("Summon one", "Bonus action", active && knives < h.capacity ? "Summon one knife back into the holster" : why, active && knives < h.capacity, function(){ setKnives(knives + 1); });
  button("Summon all", "Action", active && knives < h.capacity ? "Summon every knife back into the holster" : why, active && knives < h.capacity, function(){ setKnives(h.capacity); });
  box.appendChild(actions);
  return box;
}

function renderGearCard(c, item, idx){
  var def = magicItemDef(item);
  if(def) return renderMagicItemCard(c, item, idx, def);
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card";
  card.dataset.idx = idx;
  card.appendChild(itemHeader(c, item, idx, function(){ openGearSheet(c, item, idx); }, true));

  var subtitleParts = ["Qty " + (item.qty!=null?item.qty:1)];
  if(item.notes) subtitleParts.push(item.notes);
  var subtitle = document.createElement("div");
  subtitle.className = "inv-card-subtitle";
  subtitle.textContent = subtitleParts.join(" · ");
  card.appendChild(subtitle);

  return card;
}

/* ---- Inventory panel ---- */
/* "Hands 2/2 · Longsword, Shield": what's held, as two hand pips. A
   shield (listed under Armor) counts too. */
function handsSummary(c){
  var h = handsInUse(c);
  var row = document.createElement("div");
  row.className = "inv-hands"+(h.used>2 ? " over" : "");
  var pips = document.createElement("span");
  pips.className = "inv-hand-pips";
  for(var i=0;i<2;i++){
    var pip = document.createElement("span");
    pip.className = "inv-hand-pip"+(i < h.used ? " full" : "");
    pips.appendChild(pip);
  }
  row.appendChild(pips);
  var txt = document.createElement("span");
  txt.className = "inv-hands-text";
  txt.textContent = "Hands "+Math.min(h.used, 9)+"/2" + (h.items.length ? " · "+h.items.map(function(i){
    return i.name + (itemHands(i)===2 ? " (two-handed)" : "");
  }).join(", ") : " · nothing in hand");
  row.appendChild(txt);
  return row;
}

export function renderInventoryPanel(c){
  var panel = document.createElement("div");

  var problems = equipProblems(c);
  function warnings(card, kind){
    problems.filter(function(p){ return p.kind===kind; }).forEach(function(p){
      var w = document.createElement("p");
      w.className = "inv-equip-warn";
      w.innerHTML = makeAlertSvg() + "<span></span>";
      w.lastChild.textContent = p.text;
      card.appendChild(w);
    });
  }

  // Weapons
  var weaponCard = makeCard("Weapons");
  weaponCard.appendChild(handsSummary(c));
  // A bonus on every weapon is said once here, not on each card (the
  // damage buttons include it).
  var holsterBonus = holsterDamageBonus(c);
  if(holsterBonus){
    var allBonus = document.createElement("p");
    allBonus.className = "inv-all-weapons";
    allBonus.textContent = "Heavy Holster: +" + holsterBonus + " damage on every weapon";
    weaponCard.appendChild(allBonus);
  }
  warnings(weaponCard, "hands");
  var weaponList = document.createElement("div");
  weaponList.className = "ff-items-list inv-items-list";
  var anyWeapon = false;
  // An unarmed strike, for a monk, a race with natural weapons or a
  // Tavern Brawler.
  var unarmed = unarmedStrike(c);
  if(unarmed){ anyWeapon = true; weaponList.appendChild(renderUnarmedCard(unarmed)); }
  // A dragonborn's breath weapon.
  var breath = draconicBreath(c);
  if(breath){ anyWeapon = true; weaponList.appendChild(renderBreathCard(c, breath)); }
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
  var armorCard = makeCard("Armor");
  warnings(armorCard, "armor");
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
  // An Armorer's Arcane Armor model sits with the armor.
  var arcane = renderArmorModelCard(c);
  if(arcane) panel.appendChild(arcane);

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

  // "+ Add item" opens the gear list (adventuring gear, packs, tools);
  // "+ Custom item" adds an empty one for anything that isn't on it.
  var addItemBtn = document.createElement("button");
  addItemBtn.className = "btn small primary"; addItemBtn.style.marginTop = "12px";
  addItemBtn.textContent = "+ Add item";
  addItemBtn.addEventListener("click", function(){ openGearPicker(c); });
  gearCard.appendChild(addItemBtn);
  var customItemBtn = document.createElement("button");
  customItemBtn.className = "btn small"; customItemBtn.style.marginTop="8px";
  customItemBtn.style.color="var(--text-on-parch)"; customItemBtn.style.borderColor="var(--rule)";
  customItemBtn.textContent = "+ Custom item";
  customItemBtn.title = "Add an item that isn't on the list, and fill it in yourself";
  customItemBtn.addEventListener("click", function(){
    c.inventory.push({name:"", type:"gear", qty:1, equipped:false, notes:""});
    save(); renderAll(); playAdd();
  });
  gearCard.appendChild(customItemBtn);
  panel.appendChild(gearCard);
  // An Alchemist's experimental elixirs are carried gear.
  var elixirs = renderElixirCard(c);
  if(elixirs) panel.appendChild(elixirs);

  panel.appendChild(renderCurrencyCard(c));

  return panel;
}
