import { save } from "../../core/state.js";
import { openFlourishSheet } from "./bard.js";
import { makeCard, renderAll } from "../sheet.js";
import { makeStatArrowSvg, makeDiceSvg, makeDicesSvg, makeAlertSvg, makeCheckSvg, makeCoinFaceSvg, makeInfoSvg, makeSwapSvg } from "../../ui/svg-icons.js";
import { cardMenu } from "../../ui/card-menu.js";
import { performRoll, logRoll } from "../../dice/dice.js";
import { rollAttack } from "./sheet-rolls.js";
import { smiteButtons } from "./paladin.js";
import { fmtMod, escapeHtml, mod, profBonus, maxHp, weaponAttackBonus, weaponDamageBonus, weaponDamageDice, unarmedStrike, divineFury, parseDiceNotation, tryEquip, handsInUse, itemHands, equipProblems, chosenWeaponFeature, isMagicWeapon, isProficientWithArmor, armorStrengthShortfall, powerAttackFeat, powerAttackOn, canShillelagh, shillelaghOn, shillelaghAbilities, setShillelagh, effectOn, isRangedWeapon, martialArtsApplies, attackRollMode, rageDamageBonus, duelingBonus, sidearmMasteryBonus, thrownAttack, offHandAttack, dualWieldHands, swapHands, otherBladeAttack, revenantBladeApplies, draconicBreath, breathDcFormula, breathUsesText, characterResources, armorPenalty, hasFeat, combineRolls, conditionRolls, effectRolls, hasDedicatedWeapon, dedicateProblem, hasBlessedStrikes, critRange, firearmStats, firearmRepair, loadedRound, gunslingerHitDice, roundRigged, outlawGritBonus, calibratedSights, marshalRange, canEnchant, enchantmentOf, arcaneInfusionBonus, attacksPerAction, giantsMightDie, psionicStrike, magicArrows, classLevelOf, sneakAttack, sneakAttackWeapon, psychicBlades, soulknifeDie, wailsFromTheGrave, elementalCleaver, barbarianNaturalWeapons, BEAST_FORMS, setDedicatedWeapon, isMonkWeapon, unwaveringMark, ferociousChargerDc, sunBolts, isKenseiWeapon, sharpenBonus, kiLeft, spendKi, martialArtsDie, rangerHitDice, clericHitDice, druidHitDice, warlockHitDice, hasPactOfTheBlade, spendSpellSlot, bardHitDice, bladeFlourish, spendResource } from "../../core/helpers.js";
import { ARMOR_DATA, armorDataOf, armorAcText } from "../../data/armor.js";
import { renderArmorModelCard, renderElixirCard } from "./artificer.js";
import { showActionToast } from "../../ui/toast.js";
import { openWeaponPicker, openArmorPicker, openGearPicker } from "../armory.js";
import { gunRoundRow, bulletsmithCard, pressureButton, openEnchantSheet } from "./gunslinger.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { themedPicker } from "../../ui/themed-picker.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { renderCurrencyCard } from "./coin-purse.js";
import { renderBackgroundKitCard } from "./background-kit.js";
import { propulsionGauntlets } from "../../core/infusion-effects.js";
import { infusionOn, infusionWorks, activeInfusionData, infusionCharges, useInfusionCharge, refuelLevels, refuelSlot, endInfusion, syncInfusions } from "../../core/artificer.js";
import { itemCharges, spendCharges, potionHealing, drinkPotion } from "../../core/magic-items.js";
import { magicItemDef, magicItemActive, needsAttunement, holsterKnives, attuneProblem, coinCharges, flipCoin, boonProblem, chooseBoon, closeEmptyFlip, endBoon, activeBoons, boonLabel, weaponFlames, flamesOn } from "../../core/magic-items.js";
import { pipChanged, pipsRefilled, flash } from "../../ui/fx.js";
import { abilityScore } from "../../core/ability-scores.js";

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
   is greyed out and a tap says why. Null for an item without it. An
   infused item that needs attunement has it too, and its infusion's
   bonus follows it. */
/* Dedicated Weapon (Tasha's, monk 2): make this the weapon that counts
   as a monk weapon, or stop. Only on a monk's weapons. */
function dedicateEntry(c, item, idx){
  if(item.type!=="weapon" || !hasDedicatedWeapon(c) || isMonkWeapon(item)) return null;
  var problem = item.dedicated ? "" : dedicateProblem(item);
  return {
    label: item.dedicated ? "Stop using it as a monk weapon" : "Make it your monk weapon",
    blocked: problem,
    title: problem || (item.dedicated ? "It goes back to being an ordinary weapon for you" : "Dedicated Weapon: after a short or long rest, focus your ki on it so it counts as a monk weapon (only one at a time)"),
    onClick: function(){
      if(problem){ showActionToast(problem, true); return; }
      var on = !item.dedicated;
      setDedicatedWeapon(c, item, on);
      showActionToast(on ? (item.name || "It") + " now counts as a monk weapon." : (item.name || "It") + " is an ordinary weapon again.");
      redrawKeeping(idx);
    }
  };
}
/* Weapon Bond (Eldritch Knight 3): bond up to two weapons (a 1-hour
   ritual, which can be a short rest), or end a bond. */
function bondEntry(c, item, idx){
  if(item.type!=="weapon" || classLevelOf(c, "Fighter", "Eldritch Knight") < 3) return null;
  var full = !item.bonded && (c.inventory||[]).filter(function(i){ return i.bonded; }).length >= 2;
  return {
    label: item.bonded ? "End the weapon bond" : "Bond to this weapon",
    blocked: full ? "You already have two bonded weapons. End one bond first." : "",
    title: full ? "You already have two bonded weapons. End one bond first." : item.bonded ? "It stops being bonded to you" : "Weapon Bond: a 1-hour ritual (it can be a short rest). You can't be disarmed of it, and you can summon it to your hand as a bonus action.",
    onClick: function(){
      if(full){ showActionToast("You already have two bonded weapons. End one bond first.", true); return; }
      if(item.bonded) delete item.bonded; else item.bonded = true;
      showActionToast((item.name || "It") + (item.bonded ? " is bonded to you." : " is no longer bonded."));
      redrawKeeping(idx);
    }
  };
}
/* Firearm Enchantment (Eldritch Gunman 3): a 1-hour ritual on one firearm. */
function enchantEntry(c, item, idx){
  if(!canEnchant(c, item)) return null;
  return {
    label: enchantmentOf(c, item) ? "Change the enchantment" : "Enchant this firearm",
    title: "Firearm Enchantment: a 1-hour ritual, which can be a short rest",
    onClick: function(){ openEnchantSheet(c, item, function(){ redrawKeeping(idx); }); }
  };
}
function attuneEntry(c, item, idx){
  if(!needsAttunement(c, item)) return null;
  var problem = attuneProblem(c, item);
  return {
    label: item.attuned ? "End attunement" : "Attune",
    blocked: problem,
    title: problem || (item.attuned ? "Its magic stops working until you attune again" : "Attune to it (a short rest spent with it) so its magic works"),
    onClick: function(){
      if(problem){ showActionToast(problem, true); return; }
      item.attuned = !item.attuned;
      syncInfusions(c);
      redrawKeeping(idx);
    }
  };
}

/* "End infusion" in an infused item's ⋯ menu. A replicated item leaves
   the inventory with it, so that one asks first. */
function endInfusionEntry(c, item){
  var a = infusionOn(c, item);
  if(!a) return null;
  return {label:"End infusion", title:"End "+a.name+" on it", onClick:function(){
    var finish = function(){ endInfusion(c, a); save(); renderAll(); playDelete(); };
    if(!a.made) return finish();
    confirmDialog("End "+a.name+"?", "The "+a.itemName+" leaves your inventory. Anything inside it lands around it.", finish);
  }};
}

/* A magic item's description, as printed: paragraphs (blank lines
   between), **bold** and _italic_ words, * bullet lists and | tables |.
   A \* is a plain asterisk (the Deck of Many Things' footnote marks).
   Built from escaped text, so nothing in it can add markup of its own. */
function inlineMarks(text){
  return escapeHtml(text)
    .replace(/\\([*_])/g, function(m, ch){ return ch === "*" ? "&#42;" : "&#95;"; })
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|[\s(>])[_*]([^_*\n]+?)[_*](?=[\s.,;:)!?<]|$)/g, "$1<i>$2</i>")
    .replace(/\n/g, "<br>");
}
/* A table from the text, in a frame that scrolls sideways if it must.
   Columns of short entries (a d100 roll, a rarity) stay on one line and
   take only their own width, so the long column gets the room; a table
   of only short columns spreads evenly. A die column ("d100") is marked
   so its rolls read as the key. */
function magicItemTable(lines){
  var rows = lines.filter(function(l){ return !/^\s*\|[\s:|-]+\|?\s*$/.test(l); }).map(function(l){
    return l.trim().replace(/^\||\|$/g, "").split("|").map(function(cell){ return cell.trim(); });
  });
  var cols = rows[0].length;
  var short = [];
  for(var i = 0; i < cols; i++){
    short.push(rows.slice(1).every(function(r){ return String(r[i] || "").length <= 14; }));
  }
  var anyLong = short.some(function(s){ return !s; });
  var wrap = document.createElement("div");
  wrap.className = "inv-magic-table-wrap";
  var table = document.createElement("table");
  table.className = "inv-magic-table";
  rows.forEach(function(cells, r){
    var tr = document.createElement("tr");
    cells.forEach(function(cell, i){
      var td = document.createElement(r===0 ? "th" : "td");
      if(anyLong && short[i]) td.classList.add("inv-mt-short");
      if(i === 0 && /^d\d+$/i.test(rows[0][0])) td.classList.add("inv-mt-roll");
      td.innerHTML = inlineMarks(cell);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  wrap.appendChild(table);
  return wrap;
}
function magicItemText(text){
  var box = document.createElement("div");
  box.className = "inv-magic-text";
  String(text || "").split(/\n\s*\n/).forEach(function(block){
    var lines = block.trim().split("\n");
    if(!lines[0]) return;
    if(lines.every(function(l){ return /^\s*\|/.test(l); })){
      box.appendChild(magicItemTable(lines));
      return;
    }
    if(lines.every(function(l){ return /^\s*[*-]\s/.test(l); })){
      var list = document.createElement("ul");
      list.className = "inv-magic-list";
      lines.forEach(function(l){
        var li = document.createElement("li");
        li.innerHTML = inlineMarks(l.replace(/^\s*[*-]\s+/, ""));
        list.appendChild(li);
      });
      box.appendChild(list);
      return;
    }
    var para = document.createElement("p");
    // "\*Found only in a deck with twenty-two cards": a table's footnote.
    if(/^\\\*/.test(lines[0])) para.className = "inv-magic-note";
    para.innerHTML = inlineMarks(lines.join("\n"));
    box.appendChild(para);
  });
  return box;
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

/* The line under an infused item's name, like a magic item's: which
   infusion and its attunement ("Enhanced Defense infusion · attuned"). */
function infusionLine(c, item){
  var a = infusionOn(c, item);
  if(!a) return null;
  var d = activeInfusionData(c, a);
  var line = document.createElement("div");
  line.className = "inv-card-subtitle inv-magic-line inv-infusion-line";
  line.appendChild(document.createTextNode(a.made ? "Replicated by your infusion"
    : (d ? d.name : a.name) + " infusion" + (a.choice ? " (" + a.choice.toLowerCase() + ")" : "")));
  if(a.attunement){
    var att = document.createElement("span");
    att.className = "inv-attune-state" + (item.attuned ? " on" : "");
    att.textContent = item.attuned ? "attuned" : "requires attunement";
    line.appendChild(document.createTextNode(" · "));
    line.appendChild(att);
  }
  return line;
}

/* An infusion's charges (a pip each, a button per way to spend one) or
   the Spell-Refueling Ring's slot, on the infused item's card. Null for
   an infusion with neither. Off until attuned, when it needs it. */
var ORDINAL = ["", "1st", "2nd", "3rd"];
function infusionBlock(c, item, idx){
  var a = infusionOn(c, item);
  var d = a && activeInfusionData(c, a);
  var ch = d && infusionCharges(c, a);
  if(!ch && !(d && d.refuel)) return null;
  var off = infusionWorks(item, a) ? "" : "Attune to it (⋯ menu) to use its magic";
  var box = document.createElement("div");
  box.className = "inv-holster inv-infusion";
  box.dataset.idx = idx;
  if(ch){
    var row = document.createElement("div");
    row.className = "inv-holster-row";
    var pips = document.createElement("span");
    pips.className = "inv-holster-pips inv-infusion-pips";
    for(var i = 0; i < ch.max; i++){
      var pip = document.createElement("span");
      pip.className = "res-pip" + (i < ch.left ? " full" : "");
      pips.appendChild(pip);
    }
    row.appendChild(pips);
    var count = document.createElement("span");
    count.className = "inv-holster-count";
    count.textContent = ch.left + " of " + ch.max + " charges · " + ch.regain + " back at dawn";
    row.appendChild(count);
    box.appendChild(row);
    var actions = document.createElement("div");
    actions.className = "inv-roll-actions";
    d.uses.forEach(function(u){
      var btn = smallButton(u.label, off || (ch.left ? u.title + " (1 charge)" : "No charges left: " + ch.regain + " come back at dawn"), function(){
        if(!useInfusionCharge(c, a)) return;
        logRoll(item.name || d.name, u.label + " (" + d.name + ", 1 charge)");
        redrawKeeping(idx);
        var drawn = document.querySelector('.inv-infusion[data-idx="' + idx + '"]');
        if(drawn) pipChanged(drawn.querySelector(".inv-infusion-pips"), infusionCharges(c, a).left, true);
      });
      btn.disabled = !!off || !ch.left;
      actions.appendChild(btn);
    });
    box.appendChild(actions);
  }
  if(d.refuel){
    var levels = refuelLevels(c, a);
    var ring = document.createElement("div");
    ring.className = "inv-roll-actions inv-refuel";
    var label = document.createElement("span");
    label.className = "inv-holster-count";
    label.textContent = a.used ? "Used today · back at dawn" : levels.length ? "Recover a spell slot (action):" : "Recover a spell slot: none of 3rd level or lower spent";
    ring.appendChild(label);
    levels.forEach(function(l){
      var btn = smallButton(ORDINAL[l], off || "Get back one spent " + ORDINAL[l] + "-level slot", function(){
        if(!refuelSlot(c, a, l)) return;
        logRoll(item.name || d.name, "Recovered a " + ORDINAL[l] + "-level spell slot (" + d.name + ")");
        showActionToast("A " + ORDINAL[l] + "-level spell slot is back.");
        redrawKeeping(idx);
      });
      btn.disabled = !!off;
      ring.appendChild(btn);
    });
    box.appendChild(ring);
  }
  return box;
}

/* The ⋯ button on an item card and its small menu (see cardMenu). */
function itemMenu(item, entries){
  return cardMenu("More options for " + (item.name || "this item"), entries);
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
      if(item.equipped){ item.equipped = false; delete item.shillelagh; redrawKeeping(idx); return; }
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
    endInfusionEntry(c, item),
    dedicateEntry(c, item, idx),
    bondEntry(c, item, idx),
    enchantEntry(c, item, idx),
    {label:"Edit details", onClick:onOpenDetails},
    {label:"Remove", danger:true, onClick:function(){
      confirmDialog("Remove "+(item.name||"this item")+"?", "This cannot be undone.", function(){
        // Its infusion ends with it (a replicated item is removed by that).
        var a = infusionOn(c, item);
        if(a) endInfusion(c, a);
        c.inventory = c.inventory.filter(function(i){ return i!==item; });
        save(); renderAll(); playDelete();
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
    if(def) body.appendChild(magicItemText(def.text));
  });
}

/* Opens the weapon's editable fields (Qty, Damage dice/type, Ability,
   Proficient, Magic bonus) in a bottom sheet instead of growing the card
   in place. */
function openWeaponSheet(c, item, idx){
  openBottomSheet(function(body, refresh, close){
    var abilityLabel = item.ability==="finesse" || revenantBladeApplies(c, item) ? "Finesse" : (item.ability==="dex" ? "DEX" : "STR");
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

    // Pact of the Blade: the weapon you summon. It's magical, and invocations reach it.
    if(hasPactOfTheBlade(c)){
      var pactLbl = document.createElement("label");
      pactLbl.className = "inv-prof-label";
      var pactCb = document.createElement("input"); pactCb.type="checkbox"; pactCb.className="chk"; pactCb.checked = !!item.pactWeapon;
      pactCb.addEventListener("change", function(){
        if(pactCb.checked) item.pactWeapon = true; else delete item.pactWeapon;
        save(); renderAll();
      });
      pactLbl.appendChild(pactCb);
      pactLbl.appendChild(document.createTextNode("Pact weapon"));
      details.appendChild(pactLbl);
    }

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
    if(alreadyMagic) magicLbl.title = (Number(item.magicBonus)||0) > 0 ? "Magic because of its bonus" : shillelaghOn(c, item) ? "Magic because of Shillelagh" : "Magic because it's infused";
    magicCb.addEventListener("change", function(){
      if(magicCb.checked) item.magic = true; else delete item.magic;
      save(); renderAll();
    });
    magicLbl.appendChild(magicCb);
    magicLbl.appendChild(document.createTextNode("Magic weapon"));
    details.appendChild(magicLbl);

    body.appendChild(details);

    var def = magicItemDef(item);
    if(def) body.appendChild(magicItemText(def.text));
  });
}

/* The unarmed strike: always proficient, nothing to equip or edit. */
function renderUnarmedCard(c, u){
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
  atkBtn.innerHTML = makeDiceSvg() + "Attack " + fmtMod(u.attack) + (u.roll && u.roll.mode==="dis" ? " (Dis)" : u.roll && u.roll.mode==="adv" ? " (Adv)" : "");
  if(u.roll && u.roll.reason) atkBtn.title = u.roll.reason;
  // (A plain unarmed strike has no dice to double on a critical hit.)
  var uHit = u.die ? {qty: 1, die: u.die, bonus: u.bonus, melee: !u.ranged, label: u.name, critMin: critRange(c), sneak: !!u.psychicBlade, psychicBlade: !!u.psychicBlade} : null;
  atkBtn.addEventListener("click", function(){ rollAttack(c, u.attack, u.roll ? u.roll.mode : "none", u.name + ": Attack", uHit); });
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
  var furyBtn = divineFuryButton(c, u.name);
  if(furyBtn) actions.appendChild(furyBtn);
  var blessBtn = blessedStrikesButton(c, u.name);
  if(blessBtn) actions.appendChild(blessBtn);
  if(u.beast) beastButtons(c, u).forEach(function(b){ actions.appendChild(b); });
  fighterWeaponButtons(c, u.name).forEach(function(b){ actions.appendChild(b); });
  if(!u.ranged && /unarmed strike/i.test(u.name)) smiteButtons(c, u.name, false).forEach(function(b){ actions.appendChild(b); });
  if(/unarmed strike/i.test(u.name)) rangerButtons(c, u.name, true).forEach(function(b){ actions.appendChild(b); });
  var deflect = u.name==="Unarmed strike" && deflectMissilesButton(c);
  if(deflect) actions.appendChild(deflect);
  if(u.psychicBlade){
    var bladeSneak = sneakButton(c, u.name);
    if(bladeSneak) actions.appendChild(bladeSneak);
    soulknifeButtons(c, u).forEach(function(b){ actions.appendChild(b); });
  }
  card.appendChild(actions);
  return card;
}

/* Deflect Missiles (monk 3): a reaction when hit by a ranged weapon attack.
   If the damage drops to 0 the monk can catch it and, for 1 ki, throw it
   back (range 20/60, proficient, it counts as a monk weapon). */
function deflectMissilesButton(c){
  var lv = classLevelOf(c, "Monk");
  if(lv < 3) return null;
  var dex = mod(abilityScore(c, "dex")), bonus = dex + lv;
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn inv-fury-btn";
  b.innerHTML = makeDicesSvg() + "Deflect Missiles 1d10" + fmtMod(bonus);
  b.title = "Reaction when you're hit by a ranged weapon attack: reduce the damage by this much";
  b.addEventListener("click", function(){
    performRoll(10, 1, bonus, "none", "Deflect Missiles: damage reduced", function(r){
      if(!r) return null;
      var left = kiLeft(c), die = martialArtsDie(c);
      return {lead: "Down to 0? You can catch it:", options: [{label: "Throw it back (1 ki)", disabled: left < 1, title: left < 1 ? "No ki left" : "A ranged attack, 20/60 feet, as part of the same reaction",
        use: function(){
          if(!spendKi(c, 1)) return null;
          save(); renderAll();
          rollAttack(c, dex + profBonus(c), "none", "Caught missile: Attack", {qty: 1, die: die, bonus: dex, label: "Caught missile", offerDamage: true});
          return {silent: true};
        }}]};
    });
  });
  return b;
}
/* A ranger's or cleric's extra dice on a hit. */
function rangerButtons(c, name, unarmed){
  return rangerHitDice(c).concat(clericHitDice(c), druidHitDice(c, unarmed), bardHitDice(c), unarmed ? warlockHitDice(c, null) : []).filter(function(d){ return !unarmed || d.unarmed; }).map(function(d){ return hitDieButton(name, d, c); });
}
function hitDieButton(name, d, c){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn inv-fury-btn";
  b.innerHTML = makeDicesSvg() + d.text;
  b.title = d.title;
  b.addEventListener("click", function(){
    // (Psychic Blades spends a Bardic Inspiration, Eldritch Smite a pact slot.)
    if(d.pay && !spendResource(c, d.pay, 1)) return;
    if(d.paySlot) spendSpellSlot(c, d.paySlot);
    if(d.pay || d.paySlot){ save(); renderAll(); }
    // (A flat number has no die to roll: Lifedrinker, Genie's Wrath.)
    if(d.flat) logRoll(name + ": " + d.label, "+" + d.flat + " damage.");
    else performRoll(d.die, d.qty, 0, "none", name + ": " + d.label);
  });
  return b;
}
/* A Kensei's weapon: Kensei's Shot on a ranged one (monk 3), and Sharpen
   the Blade's bonus with a way to end it (monk 11). */
function kenseiButtons(c, item){
  var out = [];
  if(!isKenseiWeapon(c, item)) return out;
  if(isRangedWeapon(item)){
    var shot = document.createElement("button");
    shot.type = "button"; shot.className = "btn small inv-roll-btn inv-fury-btn";
    shot.innerHTML = makeDicesSvg() + "Kensei's Shot +1d4";
    shot.title = "A bonus action: this turn, your ranged hits with a kensei weapon deal 1d4 more damage of the weapon's type";
    shot.addEventListener("click", function(){ performRoll(4, 1, 0, "none", (item.name || "Weapon") + ": Kensei's Shot"); });
    out.push(shot);
  }
  var sharp = sharpenBonus(c, item);
  if(sharp) out.push(smallButton("End Sharpen +" + sharp, "Sharpen the Blade lasts 1 minute", function(){
    delete c.sharpen;
    logRoll("Sharpen the Blade", "Ended.");
    save(); renderAll();
  }));
  return out;
}

/* Path of the Beast's natural weapon: the bite's healing, the tail's AC
   die, and Infectious Fury's psychic damage (barbarian 10, spends a use). */
function beastButtons(c, u){
  var out = [];
  var pb = profBonus(c);
  function button(text, title, onClick, disabled){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small inv-roll-btn inv-fury-btn";
    b.innerHTML = text;
    b.title = title;
    b.disabled = !!disabled;
    b.addEventListener("click", onClick);
    return b;
  }
  var form = BEAST_FORMS[u.beast];
  if(u.beast==="Bite"){
    var low = (Number(c.hp.current)||0) < maxHp(c) / 2;
    out.push(button("Heal " + pb, low ? form.note : "Only while you have less than half your hit points", function(){
      c.hp.current = Math.min(maxHp(c), (Number(c.hp.current)||0) + pb);
      logRoll("Bite", "Healed " + pb + " HP (Form of the Beast)");
      save(); renderAll();
    }, !low));
  }
  if(u.beast==="Tail") out.push(button(makeDicesSvg() + "Tail swipe 1d8 AC", form.note, function(){
    performRoll(8, 1, 0, "none", "Tail swipe: add to your AC against this attack");
  }));
  var fury = characterResources(c).find(function(r){ return r.key==="Barbarian:infectious_fury"; });
  if(fury){
    var dc = 8 + pb + mod(abilityScore(c, "con"));
    var left = fury.max - fury.used;
    out.push(button(makeDicesSvg() + "Infectious Fury 2d12 · WIS DC " + dc,
      left > 0 ? "On a hit: the target makes a Wisdom save or uses its reaction to attack a creature you choose, or takes 2d12 psychic damage (your choice). Spends one of " + left + " left." : "No uses left until a long rest",
      function(){
        c.resourcesUsed[fury.key] = fury.used + 1;
        save(); renderAll();
        performRoll(12, 2, 0, "none", "Infectious Fury: psychic damage (WIS DC " + dc + ")");
      }, left <= 0));
  }
  return out;
}

/* A Cavalier's weapon in hand: Unwavering Mark's special attack (a bonus
   action with advantage that spends a use; its damage adds half the
   fighter level) and, from fighter 15, Ferocious Charger's save DC. */
function cavalierButtons(c, item, atkBonus, atkRoll, parsed, dmgBonus){
  var mark = unwaveringMark(c, item);
  if(!mark) return [];
  var name = item.name || "Weapon";
  var res = characterResources(c).find(function(r){ return r.key==="Fighter:unwavering_mark"; });
  var left = res ? res.max - res.used : 0;
  var roll = combineRolls([{mode: "adv", reason: "Unwavering Mark"}, atkRoll]);
  var atk = document.createElement("button");
  atk.type = "button"; atk.className = "btn small inv-roll-btn inv-mark-btn";
  atk.innerHTML = makeDiceSvg() + "Mark attack " + fmtMod(atkBonus) + (roll.mode==="adv" ? " (Adv)" : roll.mode==="dis" ? " (Dis)" : "");
  var tag = document.createElement("span");
  tag.className = "inv-action-tag"; tag.textContent = "Bonus action";
  atk.appendChild(tag);
  atk.disabled = left <= 0;
  atk.title = left > 0
    ? "Unwavering Mark: when a creature you marked deals damage to anyone else, attack it as a bonus action on your next turn. Spends one of " + left + " left."
    : "No special attacks left until a long rest";
  atk.addEventListener("click", function(){
    c.resourcesUsed[res.key] = res.used + 1;
    save(); renderAll();
    rollAttack(c, atkBonus, roll.mode, name + ": Unwavering Mark attack", {qty: parsed.qty, die: parsed.die, bonus: dmgBonus + mark.extra, melee: true, label: name, critMin: critRange(c, item), item: item});
  });
  var dmg = document.createElement("button");
  dmg.type = "button"; dmg.className = "btn small inv-roll-btn inv-mark-btn";
  dmg.innerHTML = makeDicesSvg() + "Mark damage " + parsed.qty + "d" + parsed.die + fmtMod(dmgBonus + mark.extra);
  dmg.title = "Unwavering Mark: a hit with the special attack adds half your fighter level (+" + mark.extra + ")";
  dmg.addEventListener("click", function(){
    performRoll(parsed.die, parsed.qty, dmgBonus + mark.extra, "none", name + ": Unwavering Mark damage" + (item.damageType ? " (" + item.damageType + ")" : ""));
  });
  var out = [atk, dmg];
  var dc = ferociousChargerDc(c);
  if(dc){
    var charge = document.createElement("button");
    charge.type = "button"; charge.className = "btn small inv-roll-btn inv-mark-btn";
    charge.textContent = "Charge DC " + dc;
    charge.title = "Ferocious Charger: move at least 10 ft straight toward a creature, then hit it: it makes a STR save or is knocked prone. Once on each of your turns.";
    charge.addEventListener("click", function(){
      var text = "The target makes a STR save (DC " + dc + ") or is knocked prone.";
      logRoll(name + ": Ferocious Charger", text);
      showActionToast("Ferocious Charger: " + text);
    });
    out.push(charge);
  }
  return out;
}

/* Divine Fury, while a Zealot rages: its own button rather than part of
   Damage, since it lands only on the first hit each turn. */
function divineFuryButton(c, name){
  var fury = divineFury(c);
  if(!fury) return null;
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "btn small inv-roll-btn inv-fury-btn";
  btn.innerHTML = makeDicesSvg() + "+1d6" + fmtMod(fury.bonus) + (fury.type ? " " + fury.type.toLowerCase() : "");
  btn.title = "Divine Fury: extra damage to the first creature you hit with a weapon attack on each of your turns while raging"
    + (fury.type ? "" : ". Choose radiant or necrotic on the Features tab");
  btn.addEventListener("click", function(){
    performRoll(6, 1, fury.bonus, "none", name + ": Divine Fury" + (fury.type ? " (" + fury.type + ")" : ""));
  });
  return btn;
}

/* A firearm's state (the Gunslinger's rules): shots left before a reload,
   or a misfire to repair with tinker's tools (DC 8 + its misfire score,
   a broken gun on a failure). Rapid Repair (gunslinger 10) repairs for a
   grit point as a bonus action, Lightning Reload (15) reloads as one. */
function firearmRow(c, item, gun, idx){
  var row = document.createElement("div");
  row.className = "inv-roll-actions inv-firearm";
  var label = document.createElement("span");
  label.className = "inv-holster-count";
  var slinger = c.classes.find(function(cl){ return cl.name==="Fighter" && cl.subclass==="Gunslinger"; });
  var slLv = slinger ? Number(slinger.level)||1 : 0;
  function btn(text, title, onClick, disabled){
    var b = smallButton(text, title, onClick);
    b.disabled = !!disabled;
    row.appendChild(b);
    return b;
  }
  if(gun.set==="gunslinger") return classFirearmRow(c, item, gun, idx, row, label, btn);
  if(item.broken){
    label.textContent = "Broken: mend it out of combat at a quarter of its cost.";
    row.appendChild(label);
    btn("Mended", "It has been mended", function(){ delete item.broken; item.shots = 0; logRoll(item.name || "Firearm", "Mended."); redrawKeeping(idx); });
    return row;
  }
  if(item.misfired){
    var fix = firearmRepair(c, item);
    label.textContent = "Misfired: repair with tinker's tools, DC " + fix.dc + ".";
    row.appendChild(label);
    var roll = function(how){
      performRoll(20, 1, fix.bonus, "none", "Repair " + (item.name || "firearm") + " (tinker's tools, DC " + fix.dc + ")", {onResult: function(r){
        delete item.misfired;
        if(r.total < fix.dc) item.broken = true;
        logRoll(item.name || "Firearm", (r.total >= fix.dc ? "Repaired" : "The repair failed: it's broken") + " (" + r.total + " vs DC " + fix.dc + ", " + how + ").");
        save(); renderAll();
      }});
    };
    btn("Repair " + fmtMod(fix.bonus), "An action: a tinker's tools check (" + fix.ability + (fix.proficient ? " + proficiency" : ", not proficient") + "). On a failure the gun breaks.", function(){ roll("an action"); });
    if(slLv >= 10){
      var grit = characterResources(c).find(function(r){ return r.key==="Fighter:grit_points"; });
      var left = grit ? grit.max - grit.used : 0;
      btn("Rapid Repair · 1 grit", left > 0 ? "A bonus action: spend a grit point to make the repair check." : "No grit points left", function(){
        c.resourcesUsed[grit.key] = grit.used + 1;
        roll("Rapid Repair, 1 grit");
      }, left <= 0);
    }
    return row;
  }
  var left = Math.max(0, gun.reload - (Number(item.shots)||0));
  label.textContent = "Shots " + left + " of " + gun.reload + " · misfires on " + (gun.misfire > 1 ? "1 to " + gun.misfire : "a 1");
  row.appendChild(label);
  btn("Reload", slLv >= 15 ? "A bonus action (Lightning Reload). You need a free hand." : "Spend one attack or an action. You need a free hand.", function(){
    item.shots = 0;
    // Outlaw's Grit: reloading reloads both firearms in hand.
    var hands = classLevelOf(c, "Gunslinger", "Outlaw") ? dualWieldHands(c) : null;
    if(hands && (hands.main===item || hands.off===item)){ hands.main.shots = 0; hands.off.shots = 0; }
    logRoll(item.name || "Firearm", "Reloaded.");
    redrawKeeping(idx);
  }, left===gun.reload);
  return row;
}
/* The Gunslinger class's own guns: a misfire (an optional rule) never
   breaks the gun, and clearing it always works but takes an action. A
   loading gun fires once per reload, free once per turn with Master of
   Arms (gunslinger 2). Nothing to show for a gun that neither reloads
   nor misfires (the Pistol): null. */
function classFirearmRow(c, item, gun, idx, row, label, btn){
  if(item.misfired){
    label.textContent = "Misfired: clearing it takes an action.";
    row.appendChild(label);
    btn("Clear it", "An action. It always works.", function(){
      delete item.misfired;
      logRoll(item.name || "Firearm", "Cleared the misfire.");
      redrawKeeping(idx);
    });
    return row;
  }
  if(!gun.reload && !gun.misfire) return null;
  var left = gun.reload ? Math.max(0, gun.reload - (Number(item.shots)||0)) : 0;
  label.textContent = [gun.reload ? "Shots " + left + " of " + gun.reload : "", gun.misfire ? "misfires on " + (gun.misfire > 1 ? "1 to " + gun.misfire : "a 1") : ""]
    .filter(Boolean).join(" · ");
  row.appendChild(label);
  if(gun.reload){
    btn("Reload", classLevelOf(c, "Gunslinger") >= 2 ? "Once per turn this is a free action (Master of Arms)." : "Load the next round.", function(){
      item.shots = 0;
      logRoll(item.name || "Firearm", "Reloaded.");
      redrawKeeping(idx);
    }, left===gun.reload);
  }
  return row;
}
/* Sneak Attack (rogue 1): its dice once per turn, on a finesse or ranged
   weapon's card (or a psychic blade's). After the roll the dice tray
   offers a Phantom's Wails from the Grave. */
function sneakButton(c, name){
  var sa = sneakAttack(c);
  if(!sa) return null;
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn inv-fury-btn";
  b.innerHTML = makeDicesSvg() + "Sneak Attack " + sa.dice + "d6";
  b.title = "Once per turn, when you hit with advantage, or when another enemy of the target is next to it and you don't have disadvantage" +
    (sa.eye ? ". Includes Eye for Weakness's 3d6 while Insightful Fighting is on." : "");
  b.addEventListener("click", function(){ performRoll(6, sa.dice, 0, "none", name + ": Sneak Attack", function(r){ return r ? wailsFollowUp(c) : null; }); });
  return b;
}
/* Wails from the Grave (Phantom 3) right after Sneak Attack damage: a use
   or a soul trinket (Tokens of the Departed, 9) for half the dice of
   necrotic to a second creature, both with Death's Friend (17). */
function wailsFollowUp(c){
  var w = wailsFromTheGrave(c);
  if(!w || (!w.usesLeft && !w.trinkets)) return null;
  var opts = [];
  function wail(how, pay){
    return {label: "Wails " + w.dice + "d6 necrotic" + how, title: "A second creature within 30 feet of the first takes it" + (w.both ? ", and the first one too (Death's Friend)" : ""),
      use: function(){
        pay();
        save(); renderAll();
        performRoll(6, w.dice, 0, "none", "Wails from the Grave (Necrotic)" + (w.both ? ", to both creatures" : ""));
        return {silent: true};
      }};
  }
  if(w.usesLeft) opts.push(wail("", function(){ c.resourcesUsed[w.key] = w.used + 1; }));
  if(w.trinkets) opts.push(wail(" (a soul trinket)", function(){ c.soulTrinkets = w.trinkets - 1; }));
  return {lead: "Wails from the Grave:", hint: "", options: opts};
}
/* A Soulknife's psychic blade: the bonus action's second blade (1d4) and
   Psychic Teleportation (9, a Psionic Energy die times 10 feet). */
function soulknifeButtons(c, u){
  var out = [];
  var second = document.createElement("button");
  second.type = "button"; second.className = "btn small inv-roll-btn inv-offhand-btn";
  second.innerHTML = makeDicesSvg() + "Second blade 1d4" + fmtMod(u.bonus);
  var tag = document.createElement("span");
  tag.className = "inv-action-tag"; tag.textContent = "Bonus action";
  second.appendChild(tag);
  second.title = "After attacking with a blade, a melee or ranged attack with a second one as a bonus action, if your other hand is free. Roll its attack with the Attack button.";
  second.addEventListener("click", function(){ performRoll(4, 1, u.bonus, "none", "Second psychic blade: Damage (Psychic)"); });
  out.push(second);
  var sk = classLevelOf(c, "Rogue", "Soulknife") >= 9 && soulknifeDie(c);
  if(sk){
    var tp = document.createElement("button");
    tp.type = "button"; tp.className = "btn small inv-roll-btn";
    tp.innerHTML = makeDicesSvg() + "Psychic Teleportation";
    tp.disabled = sk.left <= 0;
    tp.title = sk.left > 0 ? "Bonus action: spend a Psionic Energy die and teleport 10 feet times the roll (" + sk.left + " left)" : "No Psionic Energy dice left";
    tp.addEventListener("click", function(){
      c.resourcesUsed[sk.key] = sk.used + 1;
      save(); renderAll();
      performRoll(sk.die, 1, 0, "none", "Psychic Teleportation: times 10 feet", function(r){ return r ? {lead: "Teleport up to " + (r.total * 10) + " feet to a space you can see.", options: []} : null; });
    });
    out.push(tp);
  }
  return out;
}
/* Fighter archetypes' extra damage on a weapon or unarmed hit: Giant's
   Might's die once per turn while it's on (Rune Knight), and Psionic
   Strike's force for a Psionic Energy die (Psi Warrior). */
function fighterWeaponButtons(c, name){
  var out = [];
  var gm = giantsMightDie(c);
  if(gm){
    var g = document.createElement("button");
    g.type = "button"; g.className = "btn small inv-roll-btn inv-fury-btn";
    g.innerHTML = makeDicesSvg() + "Giant's Might +1d" + gm;
    g.title = "Once on each of your turns, one weapon attack or unarmed strike deals an extra 1d" + gm + " damage on a hit";
    g.addEventListener("click", function(){ performRoll(gm, 1, 0, "none", name + ": Giant's Might"); });
    out.push(g);
  }
  var ps = psionicStrike(c);
  if(ps){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn small inv-roll-btn inv-fury-btn";
    b.innerHTML = makeDicesSvg() + "Psionic Strike 1d" + ps.die + fmtMod(ps.bonus) + " force";
    b.disabled = ps.left <= 0;
    b.title = ps.left > 0 ? "Once on each of your turns, right after a weapon hit against a target within 30 feet: spend a Psionic Energy die (" + ps.left + " left) for force damage." + (ps.thrustDc ? " Telekinetic Thrust: it makes a Strength save (DC " + ps.thrustDc + ") or is knocked prone or moved 10 feet." : "")
      : "No Psionic Energy dice left";
    b.addEventListener("click", function(){
      c.resourcesUsed[ps.key] = ps.used + 1;
      save(); renderAll();
      performRoll(ps.die, 1, ps.bonus, "none", name + ": Psionic Strike (Force)" + (ps.thrustDc ? ", Telekinetic Thrust STR DC " + ps.thrustDc : ""));
    });
    out.push(b);
  }
  return out;
}
/* Blessed Strikes: 1d8 radiant once per turn, its own button for the same
   reason as Divine Fury. */
function blessedStrikesButton(c, name){
  if(!hasBlessedStrikes(c)) return null;
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "btn small inv-roll-btn inv-fury-btn";
  btn.innerHTML = makeDicesSvg() + "+1d8 radiant";
  btn.title = "Blessed Strikes: extra radiant damage to a creature your weapon attack damages, once until the start of your next turn";
  btn.addEventListener("click", function(){ performRoll(8, 1, 0, "none", name + ": Blessed Strikes (Radiant)"); });
  return btn;
}

/* A dragonborn's Breath Weapon, from the ancestry picked, kept to what's
   needed in play: its uses (the "race:breath_weapon" resource: once per
   short or long rest, or a Fizban's dragonborn's proficiency bonus per
   long rest) as pips, one line (damage type, area, save DC, action) and
   the Damage button. Tapping its name (or ⓘ) opens the full details in a
   bottom sheet: the dragon, how the save works, the DC's make-up, the
   uses and the level the damage grows at. Rolling the
   damage spends a use; Get one back undoes one spent by mistake. A
   Metallic dragonborn of level 5+ also has its second breath here. */
var SAVE_NAMES = {DEX: "Dexterity", CON: "Constitution", STR: "Strength"};
function renderBreathCard(c, b){
  var res = characterResources(c);
  var card = document.createElement("div");
  card.className = "ff-item-card inv-item-card is-equipped inv-breath-card";
  breathBlock(card, c, res.find(function(r){ return r.key==="race:breath_weapon"; }), {
    name: "Breath Weapon",
    line: [b.damage, b.area, b.save + " save DC " + b.dc, b.attack ? "In place of one attack" : "Action"],
    about: b.dragon,
    details: [
      "Each creature in the area makes a " + SAVE_NAMES[b.save] + " saving throw: it takes " + b.dice + "d" + b.die + " " + b.damage.toLowerCase() + " damage on a fail, half as much on a success.",
      "Save DC " + b.dc + " = " + breathDcFormula(b) + ".",
      breathUsesText(b) + ".",
      b.next ? "The damage grows to " + b.next.dice + "d" + b.die + " at level " + b.next.level + "." : ""
    ],
    buttons: [{html: makeDicesSvg() + "Damage " + b.dice + "d" + b.die, title: "Roll the damage and use one breath",
      roll: function(){ performRoll(b.die, b.dice, 0, "none", "Breath Weapon: Damage (" + b.damage + ")"); }}]
  });
  if(b.metallic){
    var sep = document.createElement("div");
    sep.className = "inv-breath-sep";
    card.appendChild(sep);
    breathBlock(card, c, res.find(function(r){ return r.key==="race:metallic_breath"; }), {
      name: "Metallic Breath Weapon",
      line: ["15 ft cone", "Save DC " + b.dc, "In place of one attack"],
      about: b.dragon,
      details: [
        "Enervating: each creature in the cone makes a Constitution saving throw or is incapacitated until the start of your next turn.",
        "Repulsion: each creature in the cone makes a Strength saving throw or is pushed 20 feet away from you and knocked prone.",
        "Save DC " + b.dc + " = " + breathDcFormula(b) + ".",
        "Once per long rest."
      ],
      buttons: [
        {html: "Enervating", title: "Use it: Constitution save or incapacitated",
          roll: function(){ logRoll("Metallic Breath: Enervating", "15 ft cone. Constitution save DC " + b.dc + " or incapacitated until the start of your next turn."); }},
        {html: "Repulsion", title: "Use it: Strength save or pushed and prone",
          roll: function(){ logRoll("Metallic Breath: Repulsion", "15 ft cone. Strength save DC " + b.dc + " or pushed 20 feet away and knocked prone."); }}]
    });
  }
  return card;
}
/* One breath on the card: name (with ⓘ; a tap opens its details) and use
   pips, its line, a note only once it's all used, and its buttons. */
function breathBlock(card, c, r, o){
  var left = r ? r.max - r.used : 0;
  var block = document.createElement("div");
  block.className = "inv-breath" + (left ? "" : " is-spent");
  block.dataset.res = r.key;
  var header = document.createElement("div");
  header.className = "inv-card-header";
  header.addEventListener("click", function(){ openBreathSheet(o, r); });
  var titleGroup = document.createElement("div");
  titleGroup.className = "inv-card-title-group";
  var nameSpan = document.createElement("span");
  nameSpan.className = "inv-name-inline inv-breath-name";
  nameSpan.textContent = o.name;
  titleGroup.appendChild(nameSpan);
  var info = document.createElement("button");
  info.type = "button";
  info.className = "inv-info-btn";
  info.innerHTML = makeInfoSvg();
  info.title = "Details";
  info.setAttribute("aria-label", o.name + ": details");
  titleGroup.appendChild(info);
  header.appendChild(titleGroup);
  var pips = document.createElement("span");
  pips.className = "inv-holster-pips inv-breath-pips";
  pips.setAttribute("aria-label", left + " of " + r.max + " left");
  for(var i = 0; i < r.max; i++){
    var pip = document.createElement("span");
    pip.className = "res-pip" + (i < left ? " full" : "");
    pips.appendChild(pip);
  }
  header.appendChild(pips);
  block.appendChild(header);
  var subtitle = document.createElement("div");
  subtitle.className = "inv-card-subtitle";
  subtitle.textContent = o.line.join(" · ");
  block.appendChild(subtitle);
  // Only once it's all used: when it comes back (the greyed-out button
  // can't say so on a phone).
  if(!left){
    var note = document.createElement("p");
    note.className = "inv-armor-note";
    note.textContent = r.reset==="short" ? "Used. You get it back after a short or long rest." : r.max===1 ? "Used. You get it back after a long rest." : "All used. They come back after a long rest.";
    block.appendChild(note);
  }

  function setUsed(n){
    var before = r.used;
    if(n) c.resourcesUsed[r.key] = n; else delete c.resourcesUsed[r.key];
    save(); renderAll();
    var drawn = document.querySelector('.inv-breath[data-res="' + r.key + '"] .inv-breath-pips');
    // Spent: the last full pip empties. Got back: the first empty one fills.
    pipChanged(drawn, n > before ? r.max - n : r.max - before, n > before);
  }
  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";
  o.buttons.forEach(function(bt){
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "btn small inv-roll-btn";
    btn.innerHTML = bt.html;
    btn.disabled = !left;
    btn.title = left ? bt.title : "None left: " + (r.reset==="short" ? "a short or long rest" : "a long rest") + " gives it back";
    btn.addEventListener("click", function(){ bt.roll(); setUsed(r.used + 1); });
    actions.appendChild(btn);
  });
  if(r.used){
    var backBtn = document.createElement("button");
    backBtn.type = "button"; backBtn.className = "btn small inv-roll-btn";
    backBtn.textContent = "Get one back";
    backBtn.title = "Undo a use spent by mistake";
    backBtn.addEventListener("click", function(){ setUsed(r.used - 1); });
    actions.appendChild(backBtn);
  }
  block.appendChild(actions);
  card.appendChild(block);
}

/* A breath's full details, in a bottom sheet: its name, the dragon and
   its line, then a paragraph each (how the save works, the DC's make-up,
   uses, how it grows). */
function openBreathSheet(o, r){
  openBottomSheet(function(body, refresh, close){
    var header = document.createElement("div");
    header.className = "bs-header";
    var title = document.createElement("div");
    title.className = "bs-title";
    title.textContent = o.name;
    header.appendChild(title);
    var closeBtn = document.createElement("button");
    closeBtn.className = "bs-close"; closeBtn.textContent = "✕"; closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", close);
    header.appendChild(closeBtn);
    body.appendChild(header);
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = [o.about].concat(o.line).filter(Boolean).join(" · ");
    body.appendChild(sub);
    var list = document.createElement("div");
    list.className = "inv-breath-details";
    o.details.filter(Boolean).concat(r ? [(r.max - r.used) + " of " + r.max + " left now."] : []).forEach(function(t){
      var para = document.createElement("p");
      para.textContent = t;
      list.appendChild(para);
    });
    body.appendChild(list);
  });
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
  var infLine = infusionLine(c, item);
  if(infLine) card.appendChild(infLine);

  var abilityLabel = item.ability==="finesse" || revenantBladeApplies(c, item) ? "Finesse" : (item.ability==="dex" ? "DEX" : "STR");
  // Martial Arts: a monk weapon uses the better of STR and DEX, and the
  // Martial Arts die when it's bigger than the weapon's.
  if(martialArtsApplies(c, item)) abilityLabel = "Martial Arts (STR or DEX)";
  var maDice = weaponDamageDice(c, item);
  if(maDice && maDice.martialArts) abilityLabel += " · Martial Arts d" + maDice.die;
  // Shillelagh: the spellcasting ability can replace Strength, and the die is a d8.
  var shil = shillelaghOn(c, item);
  if(shil) abilityLabel = "Shillelagh (STR or " + shillelaghAbilities(c).map(function(k){ return k.toUpperCase(); }).join(" or ") + ")";
  var subtitleParts = [];
  // Elemental Cleaver's weapon deals the chosen type while the rage lasts.
  var cleave = elementalCleaver(c, item);
  // A Gunslinger class gun deals its loaded round's damage type.
  var round = loadedRound(c, item);
  var dmgType = (round && round.damageType) || (cleave && cleave.type) || item.damageType;
  if(item.damageDice) subtitleParts.push((shil && maDice ? maDice.qty + "d" + maDice.die : item.damageDice) + (dmgType ? " " + dmgType : ""));
  subtitleParts.push(abilityLabel);
  subtitleParts.push(item.proficient ? "Proficient" : "Not proficient");
  if(item.magicBonus) subtitleParts.push(fmtMod(item.magicBonus) + " magic");
  else if(isMagicWeapon(c, item) || (classLevelOf(c, "Monk", "Way of the Kensei") >= 6 && isKenseiWeapon(c, item))) subtitleParts.push("Magic");
  // Magic Arrow (Arcane Archer 7): arrows from a shortbow or longbow count as magical.
  else if(magicArrows(c, item)) subtitleParts.push("magic arrows");
  if(item.bonded && classLevelOf(c, "Fighter", "Eldritch Knight") >= 3) subtitleParts.push("bonded");
  var chosenFeat = item.chosenWeapon && chosenWeaponFeature(c);
  if(chosenFeat) subtitleParts.push(chosenFeat.name);
  var rage = rageDamageBonus(c, item);
  if(rage) subtitleParts.push("Rage +" + rage + " damage");
  if(duelingBonus(c, item)) subtitleParts.push("Dueling +2 damage");
  if(sidearmMasteryBonus(c, item)) subtitleParts.push("Sidearm Mastery +2 damage");
  if(outlawGritBonus(c, item)) subtitleParts.push("Outlaw's Grit +2 damage");
  if(marshalRange(c, item)) subtitleParts.push(marshalRange(c, item));
  var ench = enchantmentOf(c, item);
  if(ench) subtitleParts.push(ench.name + (arcaneInfusionBonus(c, item) ? " " + fmtMod(arcaneInfusionBonus(c, item)) + " damage" : ""));
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
      ? "Thrown: out of your hand. While you can see it, call it back with an action. If it's stuck in a creature, the creature makes a contested Strength check to keep it. If it wins, it keeps the trident but is pulled 5 ft toward you."
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
  // A firearm that's jammed, broken or out of shots can't fire.
  var gun = firearmStats(item, c);
  var gunStop = gun && (item.broken ? "Broken: mend it out of combat at a quarter of its cost" : item.misfired ? (gun.set==="gunslinger" ? "Misfired: clear it first" : "Misfired: repair it first")
    : gun.reload && (Number(item.shots)||0) >= gun.reload ? "Out of shots: reload first" : "");
  if(gunStop){ atkBtn.disabled = true; atkBtn.title = gunStop; }
  atkBtn.addEventListener("click", function(){
    // (parsed and dmgBonus are worked out below, before any click.)
    rollAttack(c, atkBonus, atkRoll.mode, (item.name||"Weapon") + ": Attack",
      parsed ? {qty: parsed.qty, die: parsed.die, bonus: off ? off.damage : dmgBonus, melee: !isRangedWeapon(item), label: item.name || "Weapon", critMin: critRange(c, item), item: item, sneak: sneakAttackWeapon(item)} : null);
  });
  actions.appendChild(atkBtn);

  // (A monk weapon rolls the Martial Arts die when it's bigger.)
  var parsed = weaponDamageDice(c, item);
  var dmgBonus = weaponDamageBonus(c, item);
  // Two-weapon fighting: the off-hand weapon's card rolls the bonus
  // action's damage in place of the Attack action's.
  var off = parsed && offHandAttack(c, item);
  var dmgBtn = document.createElement("button");
  dmgBtn.type = "button"; dmgBtn.className = "btn small inv-roll-btn";
  var rigged = roundRigged(c, item);
  if(parsed && (rigged || (round && round.noDamage))){
    dmgBtn.innerHTML = makeDicesSvg() + "No damage";
    dmgBtn.disabled = true;
    dmgBtn.title = "The " + (rigged ? "rigged" : round.def.name.toLowerCase()) + " round deals no damage";
  } else if(parsed){
    dmgBtn.innerHTML = makeDicesSvg() + "Damage " + parsed.qty + "d" + parsed.die + fmtMod(dmgBonus);
    dmgBtn.addEventListener("click", function(){
      var sights = calibratedSights(c, item, parsed.die);
      performRoll(parsed.die, parsed.qty, dmgBonus, "none", (item.name||"Weapon") + ": Damage" + (dmgType ? " (" + dmgType + ")" : ""), sights ? {adjust: sights} : null);
    });
  } else {
    dmgBtn.innerHTML = makeDicesSvg() + "Damage";
    dmgBtn.disabled = true;
    dmgBtn.title = "Enter damage dice like \"1d8\" to roll";
  }
  if(!off) actions.appendChild(dmgBtn);

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
      tAtk.addEventListener("click", function(){ rollAttack(c, thrown.attack, atkRoll.mode, (item.name||"Weapon") + ": Thrown attack", {qty: parsed.qty, die: parsed.die, bonus: thrown.damage, melee: false, label: item.name || "Weapon", critMin: critRange(c, item)}); });
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
      var sights = calibratedSights(c, item, parsed.die);
      performRoll(parsed.die, parsed.qty, off.damage, "none", (item.name||"Weapon") + ": Off-hand damage" + (item.damageType ? " (" + item.damageType + ")" : ""), sights ? {adjust: sights} : null);
    });
    actions.appendChild(offBtn);
  }

  // A double-bladed scimitar's other blade: its own bonus action attack.
  var blade = otherBladeAttack(c, item);
  var bladeDice = blade && parseDiceNotation(blade.dice);
  if(bladeDice){
    var bladeBtn = document.createElement("button");
    bladeBtn.type = "button"; bladeBtn.className = "btn small inv-roll-btn inv-offhand-btn";
    bladeBtn.innerHTML = makeDicesSvg() + "Other blade " + blade.dice + fmtMod(blade.damage);
    var bladeTag = document.createElement("span");
    bladeTag.className = "inv-action-tag"; bladeTag.textContent = "Bonus action";
    bladeBtn.appendChild(bladeTag);
    bladeBtn.title = "After attacking with the double-bladed scimitar as part of the Attack action, a bonus action attack with its other blade: 1d4 slashing in place of 2d4.";
    bladeBtn.addEventListener("click", function(){
      performRoll(bladeDice.die, bladeDice.qty, blade.damage, "none", (item.name||"Weapon") + ": Other blade damage (Slashing)");
    });
    actions.appendChild(bladeBtn);
  }

  var furyBtn = divineFuryButton(c, item.name || "Weapon");
  if(furyBtn) actions.appendChild(furyBtn);
  var blessBtn = parsed && blessedStrikesButton(c, item.name || "Weapon");
  if(blessBtn) actions.appendChild(blessBtn);
  fighterWeaponButtons(c, item.name || "Weapon").forEach(function(b){ actions.appendChild(b); });
  kenseiButtons(c, item).forEach(function(b){ actions.appendChild(b); });
  if(!isRangedWeapon(item)) smiteButtons(c, item.name || "Weapon", true).forEach(function(b){ actions.appendChild(b); });
  rangerButtons(c, item.name || "Weapon", false).forEach(function(b){ actions.appendChild(b); });
  gunslingerHitDice(c, item).forEach(function(d){ actions.appendChild(hitDieButton(item.name || "Weapon", d)); });
  var pressure = pressureButton(c, item);
  if(pressure) actions.appendChild(pressure);
  var sneakBtn = sneakAttackWeapon(item) && sneakButton(c, item.name || "Weapon");
  if(sneakBtn) actions.appendChild(sneakBtn);
  // Weapon Bond: a bonded weapon not in hand can be summoned to it.
  if(item.bonded && !item.equipped && classLevelOf(c, "Fighter", "Eldritch Knight") >= 3){
    var sum = smallButton("Summon", "A bonus action: it teleports to your hand from anywhere on the same plane", function(){
      var res = tryEquip(c, item);
      if(!res.ok){ showActionToast(res.message, true); return; }
      logRoll(item.name || "Weapon", "Summoned to your hand (Weapon Bond).");
      redrawKeeping(idx);
    });
    actions.appendChild(sum);
  }
  // Elemental Cleaver: its extra die of the chosen type on a hit.
  if(cleave && cleave.type){
    var cvBtn = document.createElement("button");
    cvBtn.type = "button"; cvBtn.className = "btn small inv-roll-btn inv-fury-btn";
    cvBtn.innerHTML = makeDicesSvg() + "+" + cleave.dice + "d6 " + cleave.type.toLowerCase();
    cvBtn.title = "Elemental Cleaver: extra " + cleave.type.toLowerCase() + " damage when this weapon hits while you rage. It has the thrown property (20/60 feet) and comes back to your hand.";
    cvBtn.addEventListener("click", function(){ performRoll(6, cleave.dice, 0, "none", (item.name || "Weapon") + ": Elemental Cleaver (" + cleave.type + ")"); });
    actions.appendChild(cvBtn);
  }

  if(parsed) cavalierButtons(c, item, atkBonus, atkRoll, parsed, dmgBonus).forEach(function(b){ actions.appendChild(b); });

  // Symbiotic Entity: melee weapon hits deal an extra 1d6 necrotic.
  druidHitDice(c, !isRangedWeapon(item)).forEach(function(d){ actions.appendChild(hitDieButton(item.name || "Weapon", d)); });
  warlockHitDice(c, item).forEach(function(d){ actions.appendChild(hitDieButton(item.name || "Weapon", d, c)); });
  // Blade Flourish (College of Swords): on any weapon's hit.
  if(bladeFlourish(c)){
    var flourishBtn = document.createElement("button");
    flourishBtn.type = "button"; flourishBtn.className = "btn small inv-roll-btn inv-fury-btn";
    flourishBtn.textContent = "Blade Flourish";
    flourishBtn.title = "One flourish a turn, on a hit";
    flourishBtn.addEventListener("click", function(){ openFlourishSheet(c, item.name || "Weapon"); });
    actions.appendChild(flourishBtn);
  }

  // Flame Tongue: a bonus action lights it while it's in hand; while it
  // burns, every hit deals extra fire damage. (Asked even when it isn't
  // in hand, so sheathing it puts the flames out.)
  var lit = flamesOn(item);
  var flames = parsed && item.equipped && weaponFlames(item);
  if(flames){
    var fireDice = flames.qty + "d" + flames.die + " " + flames.type.toLowerCase();
    var igniteBtn = document.createElement("button");
    igniteBtn.type = "button";
    igniteBtn.className = "btn small inv-roll-btn" + (lit ? " primary" : "");
    igniteBtn.setAttribute("aria-pressed", lit ? "true" : "false");
    igniteBtn.textContent = lit ? "Ablaze" : "Ignite";
    var igniteTag = document.createElement("span");
    igniteTag.className = "inv-action-tag"; igniteTag.textContent = "Bonus action";
    igniteBtn.appendChild(igniteTag);
    igniteBtn.title = lit
      ? "Ablaze: hits deal an extra " + fireDice + " damage. Tap to put the flames out (speak the command word again). They also go out if you drop or sheathe it."
      : "Speak the command word: flames burst from the blade (bright light 40 ft, dim 40 ft more) and hits deal an extra " + fireDice + " damage";
    igniteBtn.addEventListener("click", function(){
      if(lit) delete item.ablaze; else item.ablaze = true;
      redrawKeeping(idx);
    });
    actions.appendChild(igniteBtn);
    if(lit){
      var fireBtn = document.createElement("button");
      fireBtn.type = "button"; fireBtn.className = "btn small inv-roll-btn";
      fireBtn.innerHTML = makeDicesSvg() + "+" + escapeHtml(fireDice);
      fireBtn.title = item.magicItem + ": extra " + flames.type.toLowerCase() + " damage on a hit";
      fireBtn.addEventListener("click", function(){
        performRoll(flames.die, flames.qty, 0, "none", (item.name||"Weapon") + ": " + item.magicItem + " (" + flames.type + ")");
      });
      actions.appendChild(fireBtn);
    }
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

  // Shillelagh: a club or quarterstaff in hand becomes magical, uses the
  // spellcasting ability and rolls a d8, until the minute is up or you let go.
  if(canShillelagh(c, item)){
    var shilOn = shillelaghOn(c, item);
    var shilBtn = document.createElement("button");
    shilBtn.type = "button";
    shilBtn.className = "btn small inv-roll-btn" + (shilOn ? " primary" : "");
    shilBtn.setAttribute("aria-pressed", shilOn ? "true" : "false");
    shilBtn.appendChild(document.createTextNode("Shillelagh"));
    var shilTag = document.createElement("span");
    shilTag.className = "inv-action-tag"; shilTag.textContent = "Bonus action";
    shilBtn.appendChild(shilTag);
    var shilAb = shillelaghAbilities(c).map(function(k){ return k.toUpperCase(); }).join(" or ");
    shilBtn.title = shilOn
      ? "Shillelagh is on: this weapon is magical, can use " + shilAb + " in place of Strength and rolls a d8. Tap to end it. It also ends when you let go of the weapon, after a minute or at a rest."
      : "Cast Shillelagh on this weapon (the spell lasts 1 minute): it becomes magical, can use " + shilAb + " in place of Strength and rolls a d8";
    shilBtn.addEventListener("click", function(){
      setShillelagh(c, item, !shilOn);
      redrawKeeping(idx);
    });
    actions.appendChild(shilBtn);
  }

  // Returning weapon: Throw takes it out of your hand; Call it back (an
  // action, attuned) or Pick it up puts it back in a free hand.
  if(def && def.returning){
    if(!item.thrown){
      var throwBtn = document.createElement("button");
      throwBtn.type = "button"; throwBtn.className = "btn small inv-roll-btn";
      throwBtn.textContent = "Throw";
      throwBtn.title = "Mark it thrown: out of your hand until you call it back";
      throwBtn.addEventListener("click", function(){ item.thrown = true; item.equipped = false; delete item.shillelagh; redrawKeeping(idx); });
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
  var gunRow = gun && firearmRow(c, item, gun, idx);
  if(gunRow) card.appendChild(gunRow);
  // A Gunslinger class gun's loaded round.
  var roundRow = gunRoundRow(c, item, function(){ redrawKeeping(idx); });
  if(roundRow) card.appendChild(roundRow);
  // A magic weapon with charges (Hammer of Thunderbolts, Mace of Terror).
  var charges = chargesBlock(c, item, idx);
  if(charges) card.appendChild(charges);

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
    var acText = armorAcText(item, hasFeat(c, "Medium Armor Master") ? 3 : 2);
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
    var def = magicItemDef(item);
    if(def) body.appendChild(magicItemText(def.text));
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
  var def = magicItemDef(item);
  if(def) card.appendChild(magicItemLine(item, def));
  var infLine = infusionLine(c, item);
  if(infLine) card.appendChild(infLine);

  var catLabel = (ARMOR_CATEGORIES.find(function(cat){ return cat.key===item.category; })||{}).label || item.category;
  var acText = armorAcText(item, hasFeat(c, "Medium Armor Master") ? 3 : 2);
  var subtitleParts = [acText, catLabel];
  if(item.magicBonus) subtitleParts.push(fmtMod(item.magicBonus) + " magic");
  // The row's own say first (Mithral Armor has none), then its armor's.
  var armorData = armorDataOf(item);
  if(item.stealthDisadvantage!=null ? item.stealthDisadvantage : (armorData && armorData.stealthDisadvantage)) subtitleParts.push("Stealth disadvantage");
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
  if(def.coin) card.appendChild(coinBlock(c, item, idx, def.coin));
  var charges = chargesBlock(c, item, idx);
  if(charges) card.appendChild(charges);
  var drink = drinkButton(c, item);
  if(drink) card.appendChild(drink);
  return card;
}

/* The Heavy Holster's knives: a pip each, what they're doing for you now,
   and Throw / Summon buttons. Summoning is the holster's magic, so it
   needs attunement; taking a knife out doesn't. */
/* The Duality coin: its charges, Flip the coin (spends one; the coin
   spins and lands angel or demon side up), that side's three boons to
   choose from, and the boons in play with End (and a roll for extra
   damage, which uses it up). */
function coinBlock(c, item, idx, coin){
  var box = document.createElement("div");
  box.className = "inv-coin";
  box.dataset.idx = idx;
  var st = item.coin || {};
  var charges = coinCharges(item);

  var row = document.createElement("div");
  row.className = "inv-holster-row";
  var pips = document.createElement("span");
  pips.className = "inv-holster-pips inv-coin-pips";
  for(var i = 0; i < coin.charges; i++){
    var pip = document.createElement("span");
    pip.className = "res-pip" + (i < charges ? " full" : "");
    pips.appendChild(pip);
  }
  row.appendChild(pips);
  var count = document.createElement("span");
  count.className = "inv-holster-count";
  count.textContent = charges + " of " + coin.charges + " charges · all back at a long rest";
  row.appendChild(count);
  box.appendChild(row);

  if(st.flip){
    var side = coin.sides[st.flip];
    var landed = document.createElement("div");
    landed.className = "inv-coin-landed " + st.flip;
    var face = document.createElement("span");
    face.className = "inv-coin-face " + st.flip;
    face.setAttribute("aria-hidden", "true");
    face.innerHTML = makeCoinFaceSvg(st.flip);
    landed.appendChild(face);
    var lt = document.createElement("span");
    lt.className = "inv-coin-result";
    lt.textContent = side.name + "! Choose one:";
    landed.appendChild(lt);
    box.appendChild(landed);

    var choices = document.createElement("div");
    choices.className = "inv-coin-choices";
    side.boons.forEach(function(b){
      var problem = boonProblem(c, item, b.id);
      var opt = document.createElement("div");
      opt.className = "inv-coin-choice" + (problem ? " blocked" : "");
      var text = document.createElement("span");
      text.className = "inv-coin-choice-text";
      text.textContent = b.text + (problem ? " (" + problem.toLowerCase().replace(/\.$/, "") + ")" : "");
      opt.appendChild(text);
      var take = function(type){ if(chooseBoon(c, item, b.id, type)){ logRoll(item.name || "Duality", "Took: " + b.text + (type ? " (" + type + ")" : "") + "."); redrawKeeping(idx); } };
      if(problem){ choices.appendChild(opt); return; }
      if(b.damage && b.damage.types.length > 1){
        // Fire or necrotic: one button each, kept together.
        var types = document.createElement("span");
        types.className = "inv-coin-types";
        b.damage.types.forEach(function(t){ types.appendChild(smallButton(t, "Take it as " + t.toLowerCase() + " damage", function(){ take(t); })); });
        opt.appendChild(types);
      } else if(b.resistance){
        opt.appendChild(themedPicker({
          key:"coin:resist:" + idx, search:false, placeholder:"Damage type", ariaLabel:"Resistance to which damage type",
          groups:{"":DAMAGE_TYPES}, onPick:function(v){ take(v); }
        }));
      } else {
        opt.appendChild(smallButton("Take it", b.text, function(){ take(b.damage ? b.damage.types[0] : ""); }));
      }
      choices.appendChild(opt);
    });
    box.appendChild(choices);
  } else {
    var actions = document.createElement("div");
    actions.className = "inv-roll-actions";
    var flipBtn = smallButton("Flip the coin", charges ? "Spend a charge and flip it, on your turn" : "No charges left: they come back at a long rest", function(){
      var landedOn = flipCoin(item);
      if(!landedOn) return;
      var sideName = coin.sides[landedOn].name.toLowerCase();
      if(closeEmptyFlip(c, item)){
        // Nothing new to take: the charge is spent all the same.
        logRoll(item.name || "Duality", "The coin lands " + sideName + ", but all its boons are already in play.");
        showActionToast("The coin lands " + sideName + ", but all its boons are already in play.");
      } else logRoll(item.name || "Duality", "The coin lands " + sideName + ".");
      redrawKeeping(idx);
      var drawnBox = document.querySelector('.inv-coin[data-idx="' + idx + '"]');
      if(drawnBox){
        pipChanged(drawnBox.querySelector(".inv-coin-pips"), coinCharges(item), true);
        flash(drawnBox.querySelector(".inv-coin-face"), "fx-coin-flip");
      }
    });
    flipBtn.disabled = !charges;
    actions.appendChild(flipBtn);
    box.appendChild(actions);
  }

  // The boons in play from this coin.
  var mine = activeBoons(c).filter(function(b){ return b.item===item; });
  if(mine.length){
    var list = document.createElement("div");
    list.className = "inv-coin-boons";
    mine.forEach(function(b){
      var line = document.createElement("div");
      line.className = "inv-coin-boon " + b.side;
      // A small face says which side it came from.
      var mini = document.createElement("span");
      mini.className = "inv-coin-mini";
      mini.innerHTML = makeCoinFaceSvg(b.side);
      line.appendChild(mini);
      var t = document.createElement("span");
      t.className = "inv-coin-boon-text";
      t.textContent = boonLabel(b).charAt(0).toUpperCase() + boonLabel(b).slice(1) + (b.def.minutes ? " · " + b.def.minutes + " minutes" : " · until used or a long rest");
      line.appendChild(t);
      if(b.def.damage) line.appendChild(damageBoonButton(item, b));
      line.appendChild(smallButton("End", "End this boon", function(){ endBoon(item, b.def.id); redrawKeeping(idx); }));
      list.appendChild(line);
    });
    box.appendChild(list);
  }
  return box;
}
/* Roll a boon's extra damage on a hit ("+2d8 radiant"); that uses it up. */
function damageBoonButton(item, b){
  var d = b.def.damage, type = b.type || d.types[0];
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "btn small inv-roll-btn";
  btn.innerHTML = makeDicesSvg();
  btn.appendChild(document.createTextNode("+" + d.qty + "d" + d.die + " " + type.toLowerCase()));
  btn.title = "Roll it on a hit with your next attack. That uses it up";
  btn.addEventListener("click", function(){
    performRoll(d.die, d.qty, 0, "none", (item.name || "Duality") + ": +" + d.qty + "d" + d.die + " " + type.toLowerCase());
    endBoon(item, b.def.id);
    save(); renderAll();
  });
  return btn;
}
function smallButton(label, title, onClick){
  var b = document.createElement("button");
  b.type = "button"; b.className = "btn small inv-roll-btn";
  b.textContent = label;
  b.title = title;
  b.addEventListener("click", onClick);
  return b;
}

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
  var infLine = infusionLine(c, item);
  if(infLine) card.appendChild(infLine);

  var subtitleParts = ["Qty " + (item.qty!=null?item.qty:1)];
  if(item.notes) subtitleParts.push(item.notes);
  var subtitle = document.createElement("div");
  subtitle.className = "inv-card-subtitle";
  subtitle.textContent = subtitleParts.join(" · ");
  card.appendChild(subtitle);
  var drink = drinkButton(c, item);
  if(drink) card.appendChild(drink);

  return card;
}

/* A magic item's charges (a wand, a staff): a pip each (a count past
   12), what comes back at dawn, Use a charge and Get one back. Spending
   needs the item to work (attuned if it needs it). */
function chargesBlock(c, item, idx){
  var ch = itemCharges(item);
  if(!ch) return null;
  var active = magicItemActive(item);
  var box = document.createElement("div");
  box.className = "inv-holster inv-charges";
  box.dataset.idx = idx;
  var row = document.createElement("div");
  row.className = "inv-holster-row";
  if(ch.max <= 12){
    var pips = document.createElement("span");
    pips.className = "inv-holster-pips inv-charge-pips";
    for(var i = 0; i < ch.max; i++){
      var pip = document.createElement("span");
      pip.className = "res-pip" + (i < ch.left ? " full" : "");
      pips.appendChild(pip);
    }
    row.appendChild(pips);
  }
  var count = document.createElement("span");
  count.className = "inv-holster-count";
  count.textContent = ch.left + " of " + ch.max + " charges" + (ch.regain ? " · " + ch.regain + " back at dawn" : "");
  row.appendChild(count);
  box.appendChild(row);
  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";
  var use = smallButton("Use a charge", !active ? "Attune to it (⋯ menu) to use its magic" : ch.left ? "Spend one of its charges" : "No charges left", function(){
    spendCharges(item, 1);
    logRoll(item.name || item.magicItem, "Used a charge (" + (ch.left - 1) + " of " + ch.max + " left)");
    redrawKeeping(idx);
  });
  use.disabled = !active || !ch.left;
  actions.appendChild(use);
  var back = smallButton("Get one back", "Undo a charge, or one regained another way", function(){ spendCharges(item, -1); redrawKeeping(idx); });
  back.disabled = !ch.used;
  actions.appendChild(back);
  box.appendChild(actions);
  return box;
}
/* A Potion of Healing (any strength): Drink rolls its healing and adds it
   to current hit points, using one up. */
function drinkButton(c, item){
  var heal = potionHealing(item);
  if(!heal) return null;
  var actions = document.createElement("div");
  actions.className = "inv-roll-actions";
  actions.appendChild(smallButton("Drink (" + heal.replace("+", " + ") + " HP)", "Drink it: an action, or a bonus action under some tables' rules", function(){
    var name = item.name || item.magicItem;
    var r = drinkPotion(c, item, maxHp(c));
    logRoll(name, "Healed " + r.total + " (" + heal + ": " + r.rolls.join(", ") + (r.bonus ? " + " + r.bonus : "") + ")");
    showActionToast("You regain " + r.total + " hit points.");
    save(); renderAll();
  }));
  return actions;
}

/* An infused item's charges or ring at the foot of its card. */
function withInfusion(c, card, item, idx){
  var block = infusionBlock(c, item, idx);
  if(block) card.appendChild(block);
  return card;
}

/* ---- Inventory panel ---- */
/* "Hands 2/2 · Longsword, Shield": what's held, as two hand pips. A
   shield (listed under Armor) counts too. Two-weapon fighting names the
   main hand and the off-hand, with a Swap hands button. */
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
  var dual = dualWieldHands(c);
  // Extra Attack: how many attacks the Attack action makes.
  var attacks = attacksPerAction(c);
  txt.textContent = "Hands "+Math.min(h.used, 9)+"/2" + (dual ? " · Main: "+dual.main.name+" · Off-hand: "+dual.off.name
    : h.items.length ? " · "+h.items.map(function(i){
    return i.name + (itemHands(i)===2 ? " (two-handed)" : "");
  }).join(", ") : " · nothing in hand") + (attacks > 1 ? " · " + attacks + " attacks per Attack action" : "");
  row.appendChild(txt);
  if(dual){
    var swapBtn = document.createElement("button");
    swapBtn.type = "button"; swapBtn.className = "btn small inv-swap-hands-btn";
    swapBtn.innerHTML = makeSwapSvg() + "Swap hands";
    swapBtn.title = "Make " + dual.off.name + " your main hand and " + dual.main.name + " your off-hand";
    swapBtn.addEventListener("click", function(){ swapHands(c); save(); renderAll(); });
    row.appendChild(swapBtn);
  }
  return row;
}

export function renderInventoryPanel(c){
  var panel = document.createElement("div");
  // An older sheet's background starting gear, offered once.
  var kitOffer = renderBackgroundKitCard(c);
  if(kitOffer) panel.appendChild(kitOffer);

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
  warnings(weaponCard, "hands");
  var weaponList = document.createElement("div");
  weaponList.className = "ff-items-list inv-items-list";
  var anyWeapon = false;
  // An unarmed strike, for a monk, a race with natural weapons or a
  // Tavern Brawler.
  var unarmed = unarmedStrike(c);
  if(unarmed){ anyWeapon = true; weaponList.appendChild(renderUnarmedCard(c, unarmed)); }
  // A Sun Soul's Radiant Sun Bolt.
  sunBolts(c).forEach(function(w){ anyWeapon = true; weaponList.appendChild(renderUnarmedCard(c, w)); });
  // A Soulknife's psychic blades.
  psychicBlades(c).forEach(function(w){ anyWeapon = true; weaponList.appendChild(renderUnarmedCard(c, w)); });
  // A barbarian's natural weapons while raging (Form of the Beast, armor spikes).
  barbarianNaturalWeapons(c).forEach(function(w){ anyWeapon = true; weaponList.appendChild(renderUnarmedCard(c, w)); });
  // Arcane Propulsion Armor's gauntlets, while it's worn.
  var gauntlets = propulsionGauntlets(c);
  if(gauntlets){
    anyWeapon = true;
    gauntlets.roll = combineRolls([armorPenalty(c, "str")].concat(conditionRolls(c, "attack"), effectRolls(c, "attack")));
    weaponList.appendChild(renderUnarmedCard(c, gauntlets));
  }
  // A dragonborn's breath weapon.
  var breath = draconicBreath(c);
  if(breath){ anyWeapon = true; weaponList.appendChild(renderBreathCard(c, breath)); }
  (c.inventory||[]).forEach(function(item, idx){
    if(item.type!=="weapon") return;
    anyWeapon = true;
    weaponList.appendChild(withInfusion(c, renderWeaponCard(c, item, idx), item, idx));
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
    armorList.appendChild(withInfusion(c, renderArmorCard(c, item, idx), item, idx));
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
    gearList.appendChild(withInfusion(c, renderGearCard(c, item, idx), item, idx));
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
  // A gunslinger's (the class's) Bulletsmith crafting.
  var smith = bulletsmithCard(c, function(){ save(); renderAll(); });
  if(smith) panel.appendChild(smith);
  // An Alchemist's experimental elixirs are carried gear.
  var elixirs = renderElixirCard(c);
  if(elixirs) panel.appendChild(elixirs);

  panel.appendChild(renderCurrencyCard(c));

  return panel;
}
