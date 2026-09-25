import { state, save } from "../core/state.js";
import { openCatalogPicker, showCatalogCustomView, refreshCatalog } from "../ui/catalog-picker.js";
import { WEAPON_GROUPS, WEAPON_DATA } from "../data/weapons.js";
import { ARMOR_GROUPS, ARMOR_DATA } from "../data/armor.js";
import { isProficientWithWeapon, tryEquip, escapeHtml } from "../core/helpers.js";
import { getCustomItem, saveCustomItem, deleteCustomItem, itemNameProblem, charactersWithItem, weaponAbility, armorNote } from "../core/custom-items.js";
import { facts, textField, homebrewShell, numberField, pickerField, previewCard } from "../ui/homebrew-form.js";
import { themedPicker } from "../ui/themed-picker.js";
import { renderAll } from "./sheet.js";
import { openWizard } from "../wizard/wizard-core.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { chooseCharacter } from "../ui/character-picker.js";
import { showActionToast } from "../ui/toast.js";
import { playAdd, playDelete } from "../ui/sound.js";

/* ---------------- Grimtooth's Armory ----------------
   The weapon and armor catalogue. From the sidebar it's a standalone page
   (every add asks which character it goes to, then confirms with a
   toast); from a sheet's Add Weapon / Add Armor it opens on that one list
   for that character, and a tap adds the item straight away.
   The + makes a custom (homebrew) weapon or armor, the same way the
   Compendium makes custom subclasses, feats and so on: a form with a live
   preview, saved in this browser (core/custom-items.js) and listed under
   "Homebrew" for every character. Homebrew rows carry Edit / Delete. */

var ARMOR_CATEGORY_LABEL = {light:"Light", medium:"Medium", heavy:"Heavy", shield:"Shield"};
var DAMAGE_TYPES = ["Slashing","Piercing","Bludgeoning","Acid","Cold","Fire","Force","Lightning","Necrotic","Poison","Psychic","Radiant","Thunder"];
var WEAPON_PROPS = ["Finesse","Light","Heavy","Two-handed","Reach","Thrown","Versatile","Ammunition","Loading"];

var target = null;                        // the character, when opened from a sheet
var editing = {weapon:null, armor:null};  // id for the next form build to edit

function targetName(){ return target && target.name || "this character"; }

/* ---- Adding to a character ---- */
export function addCatalogWeapon(c, name, d){
  var item = {
    name: name, type:"weapon", qty:1, equipped:false, notes: d.properties||"",
    damageDice: d.damageDice||"", damageType: d.damageType||"", ability: d.finesse ? "finesse" : (d.ranged ? "dex" : "str"),
    proficient: isProficientWithWeapon(c, name, d.category), magicBonus: 0
  };
  if(d.custom) item.homebrewId = d.id; // stays linked to the Armory entry
  c.inventory.push(item);
  // Ready it if there's a free hand; otherwise it goes in the pack.
  tryEquip(c, item);
  save();
  playAdd();
}

export function addCatalogArmor(c, name, d){
  var item = {
    name: name, type:"armor", qty:1, equipped:false,
    category: d.category||"light", baseAC: d.baseAC!=null?d.baseAC:10, magicBonus:0,
    notes: armorNote(d)
  };
  if(d.custom) item.homebrewId = d.id;
  c.inventory.push(item);
  save();
  playAdd();
}

var ADD = {weapon:addCatalogWeapon, armor:addCatalogArmor};

/* Tap on a row: straight onto the sheet's character, or ask which one. */
function onAddFor(kind){
  return function(name, d){
    if(target){ ADD[kind](target, name, d); renderAll(); return; }
    if(!state.characters.length){
      confirmDialog("No characters yet", "The Armory adds items to one of your characters. Create one now?", function(){
        document.getElementById("catalog-back").click();
        openWizard();
      });
      return false;
    }
    chooseCharacter(function(c){
      ADD[kind](c, name, d);
      renderAll();
      showActionToast('Added "' + name + '" to ' + (c.name||"Unnamed") + "’s inventory.");
    });
    return false;
  };
}

/* ---- Homebrew rows: Edit / Delete ---- */
function customActions(kind){
  return function(name, d){
    if(!d.custom) return [];
    return [
      {label:"Edit", title:"Edit "+name, onClick:function(){ editing[kind] = d.id; showCatalogCustomView(); }},
      {label:"Delete", title:"Delete "+name, danger:true, onClick:function(){ confirmDelete(kind, d.id); }}
    ];
  };
}

function confirmDelete(kind, id){
  var entry = getCustomItem(kind, id);
  if(!entry) return;
  var users = charactersWithItem(entry);
  confirmDialog("Delete "+entry.name+"?",
    users.length ? users.map(function(c){ return c.name||"A character"; }).join(", ")+(users.length>1 ? " have" : " has")+" it and will keep their copy; it just won't be in the Armory anymore."
                 : "This custom "+(kind==="weapon" ? "weapon" : "armor")+" will be removed from the Armory.",
    function(){
      deleteCustomItem(kind, id);
      afterChange();
      playDelete();
      showActionToast("Deleted "+entry.name+".");
    });
}

function afterChange(){
  refreshCatalog();
  renderAll(); // sheets show new or updated copies
}

/* Shared end of both forms. */
function finishSave(kind, saved, existing){
  playAdd();
  if(!existing && target){
    ADD[kind](target, saved.name, (kind==="weapon" ? WEAPON_DATA : ARMOR_DATA)[saved.name]);
    showActionToast("Created "+saved.name+" and added it to "+targetName()+".");
  } else {
    showActionToast((existing ? "Saved " : "Created ")+saved.name+"."+(existing ? "" : " It's under Homebrew for every character."));
  }
  afterChange();
}

function introFor(existing, noun){
  if(existing) return "Changes apply to every character that has it. Their quantity, magic bonus and proficiency stay as they are.";
  if(target) return "It's added to "+targetName()+" and kept under Homebrew, so other characters can take it too.";
  return "Saved in this browser under Homebrew, so any character can take it, here or from their sheet's Add "+noun+".";
}

/* ---- Weapon form ---- */
function splitProperties(e){
  if(e.tags) return {tags:e.tags.slice(), extra:e.extra||""};
  // Built from the properties text (entries saved before tags existed).
  var tags = [], rest = [];
  (e.properties||"").split(",").map(function(x){ return x.trim(); }).filter(Boolean).forEach(function(p){
    var tag = WEAPON_PROPS.find(function(t){ return p.toLowerCase()===t.toLowerCase(); });
    if(tag) tags.push(tag); else rest.push(p);
  });
  return {tags:tags, extra:rest.join(", ")};
}
function joinProperties(tags, extra){
  var parts = WEAPON_PROPS.filter(function(t){ return tags.indexOf(t)!==-1; })
    .map(function(t, i){ return i ? t.toLowerCase() : t; });
  if(extra.trim()) parts.push(parts.length ? extra.trim() : extra.trim().charAt(0).toUpperCase()+extra.trim().slice(1));
  return parts.join(", ");
}
var DICE_RE = /^\d*d\d+(\s*[+-]\s*\d+)?$/i;

function buildWeaponForm(container){
  var existing = editing.weapon ? getCustomItem("weapon", editing.weapon) : null;
  editing.weapon = null; // used up: leaving the form resets it to "new"
  var d = existing ? JSON.parse(JSON.stringify(existing)) : {name:"", category:"simple", ranged:false, damageDice:"1d6", damageType:"Slashing", properties:""};
  var props = splitProperties(d);
  var shell = homebrewShell(container, existing ? "Edit "+existing.name : "Create a weapon", introFor(existing, "Weapon"));

  var basics = shell.section("Basics");
  var nameF = textField("Weapon name *", d.name, "e.g. Trident of Returning");
  nameF.input.addEventListener("input", function(){ d.name = nameF.input.value; update(); });
  basics.appendChild(nameF.field);
  var row = document.createElement("div"); row.className = "cmp-form-row";
  row.appendChild(pickerField("Category", themedPicker({
    key:"arm:weapon:cat", search:false, value:d.category, placeholder:"Category", ariaLabel:"Category",
    groups:{"":[{value:"simple", label:"Simple"},{value:"martial", label:"Martial"}]},
    onPick:function(v){ d.category = v; update(); }
  })));
  row.appendChild(pickerField("Melee or ranged", themedPicker({
    key:"arm:weapon:range", search:false, value:d.ranged ? "ranged" : "melee", placeholder:"Melee or ranged", ariaLabel:"Melee or ranged",
    groups:{"":[{value:"melee", label:"Melee"},{value:"ranged", label:"Ranged"}]},
    onPick:function(v){ d.ranged = v==="ranged"; update(); }
  })));
  basics.appendChild(row);

  var dmg = shell.section("Damage");
  var dmgRow = document.createElement("div"); dmgRow.className = "cmp-form-row";
  var diceF = textField("Damage dice", d.damageDice, "e.g. 1d8 or 2d6");
  diceF.input.addEventListener("input", function(){ d.damageDice = diceF.input.value; update(); });
  dmgRow.appendChild(diceF.field);
  dmgRow.appendChild(pickerField("Damage type", themedPicker({
    key:"arm:weapon:dtype", search:false, value:d.damageType, placeholder:"Damage type", ariaLabel:"Damage type",
    groups:{"":[{value:"", label:"None", muted:true}].concat(DAMAGE_TYPES)},
    onPick:function(v){ d.damageType = v; update(); }
  })));
  dmg.appendChild(dmgRow);

  var propSec = shell.section("Properties");
  var pills = document.createElement("div"); pills.className = "cmp-kind-row";
  WEAPON_PROPS.forEach(function(t){
    var b = document.createElement("button");
    b.type = "button";
    function paint(){ var on = props.tags.indexOf(t)!==-1; b.className = "ff-pill"+(on ? " active" : ""); b.setAttribute("aria-pressed", on ? "true" : "false"); }
    b.textContent = t;
    b.addEventListener("click", function(){
      var i = props.tags.indexOf(t);
      if(i===-1) props.tags.push(t); else props.tags.splice(i, 1);
      paint(); update();
    });
    paint();
    pills.appendChild(b);
  });
  propSec.appendChild(pills);
  var hint = document.createElement("p"); hint.className = "cmp-form-hint";
  hint.textContent = "Finesse lets the wielder use Dexterity; Two-handed takes both hands.";
  propSec.appendChild(hint);
  var extraF = textField("Range and other details", props.extra, "e.g. thrown (20/60), versatile (1d10), returns when thrown");
  extraF.input.addEventListener("input", function(){ props.extra = extraF.input.value; update(); });
  propSec.appendChild(extraF.field);

  shell.actions(existing ? "Save changes" : target ? "Create and add to "+targetName() : "Create weapon", function(){
    var name = (d.name||"").trim();
    if(!name){ showActionToast("Give your weapon a name.", true); nameF.input.focus(); return; }
    var clash = itemNameProblem("weapon", name, existing && existing.id);
    if(clash){ showActionToast(clash, true); nameF.input.focus(); return; }
    if(d.damageDice.trim() && !DICE_RE.test(d.damageDice.trim())){ showActionToast("Damage dice look like 1d8 or 2d6+1.", true); diceF.input.focus(); return; }
    d.tags = props.tags; d.extra = props.extra.trim();
    d.properties = joinProperties(props.tags, props.extra);
    var saved = saveCustomItem("weapon", d);
    finishSave("weapon", saved, existing);
  });

  function update(){
    var p = joinProperties(props.tags, props.extra);
    var ab = weaponAbility({properties:p, ranged:d.ranged});
    previewCard(shell.preview,
      "<div class='cmp-preview-name'>"+escapeHtml((d.name||"").trim() || "Your weapon")+"</div>"+
      "<div class='cmp-preview-tags'><span class='cmp-tag-class'>"+(d.category==="martial" ? "Martial" : "Simple")+" "+(d.ranged ? "ranged" : "melee")+"</span>"+
        "<span class='cmp-custom-tag'>Custom</span></div>"+
      "<p class='arm-preview-damage'>"+escapeHtml(d.damageDice.trim() || "—")+(d.damageType ? " <span>"+escapeHtml(d.damageType.toLowerCase())+"</span>" : "")+"</p>"+
      facts([
        ["Properties", p || "None"],
        ["Attacks with", ab==="finesse" ? "Strength or Dexterity" : ab==="dex" ? "Dexterity" : "Strength"],
        ["Hands", /two-handed/i.test(p) ? "Both" : "One"],
        ["Proficiency", "Anyone proficient with "+(d.category==="martial" ? "martial" : "simple")+" weapons"]
      ]));
  }
  update();
}

/* ---- Armor form ---- */
function acText(e){
  var ac = Number(e.baseAC)||0;
  if(e.category==="shield") return "+"+ac+" AC";
  if(e.category==="heavy") return "AC "+ac;
  return "AC "+ac+" + Dex modifier"+(e.category==="medium" ? " (max 2)" : "");
}

function buildArmorForm(container){
  var existing = editing.armor ? getCustomItem("armor", editing.armor) : null;
  editing.armor = null;
  var d = existing ? JSON.parse(JSON.stringify(existing)) : {name:"", category:"light", baseAC:11, stealthDisadvantage:false};
  var shell = homebrewShell(container, existing ? "Edit "+existing.name : "Create armor", introFor(existing, "Armor"));

  var basics = shell.section("Basics");
  var row = document.createElement("div"); row.className = "cmp-form-row";
  var nameF = textField("Armor name *", d.name, "e.g. Dragon Scale Mail");
  nameF.input.addEventListener("input", function(){ d.name = nameF.input.value; update(); });
  row.appendChild(nameF.field);
  row.appendChild(pickerField("Category", themedPicker({
    key:"arm:armor:cat", search:false, value:d.category, placeholder:"Category", ariaLabel:"Category",
    groups:{"":[{value:"light", label:"Light armor"},{value:"medium", label:"Medium armor"},{value:"heavy", label:"Heavy armor"},{value:"shield", label:"Shield"}]},
    onPick:function(v){
      // A shield's number is a bonus: move an untouched value between the two.
      if(v==="shield" && d.category!=="shield" && d.baseAC>=10) d.baseAC = 2;
      else if(v!=="shield" && d.category==="shield" && d.baseAC<10) d.baseAC = 11;
      d.category = v; acF.input.value = d.baseAC; relabel(); update();
    }
  })));
  basics.appendChild(row);

  var prot = shell.section("Protection");
  var protRow = document.createElement("div"); protRow.className = "cmp-form-row";
  var acF = numberField("Base AC", d.baseAC, "11");
  acF.input.step = "1";
  acF.input.addEventListener("input", function(){ d.baseAC = parseInt(acF.input.value, 10)||0; update(); });
  protRow.appendChild(acF.field);
  protRow.appendChild(pickerField("Stealth", themedPicker({
    key:"arm:armor:stealth", search:false, value:d.stealthDisadvantage ? "dis" : "ok", placeholder:"Stealth", ariaLabel:"Stealth",
    groups:{"":[{value:"ok", label:"No penalty"},{value:"dis", label:"Disadvantage on Stealth"}]},
    onPick:function(v){ d.stealthDisadvantage = v==="dis"; update(); }
  })));
  prot.appendChild(protRow);
  var hint = document.createElement("p"); hint.className = "cmp-form-hint";
  prot.appendChild(hint);
  function relabel(){
    acF.field.querySelector("label").textContent = d.category==="shield" ? "AC bonus" : "Base AC";
    hint.textContent = {light:"Light armor adds the full Dexterity modifier.", medium:"Medium armor adds Dexterity, up to +2.",
      heavy:"Heavy armor ignores Dexterity.", shield:"A shield adds its bonus on top of armor, and takes a hand."}[d.category];
  }
  relabel();

  shell.actions(existing ? "Save changes" : target ? "Create and add to "+targetName() : "Create armor", function(){
    var name = (d.name||"").trim();
    if(!name){ showActionToast("Give your armor a name.", true); nameF.input.focus(); return; }
    var clash = itemNameProblem("armor", name, existing && existing.id);
    if(clash){ showActionToast(clash, true); nameF.input.focus(); return; }
    var saved = saveCustomItem("armor", d);
    finishSave("armor", saved, existing);
  });

  function update(){
    previewCard(shell.preview,
      "<div class='cmp-preview-name'>"+escapeHtml((d.name||"").trim() || "Your armor")+"</div>"+
      "<div class='cmp-preview-tags'><span class='cmp-tag-class'>"+escapeHtml(ARMOR_CATEGORY_LABEL[d.category]+(d.category==="shield" ? "" : " armor"))+"</span>"+
        "<span class='cmp-custom-tag'>Custom</span></div>"+
      "<p class='arm-preview-damage'>"+escapeHtml(acText(d))+"</p>"+
      facts([["Stealth", d.stealthDisadvantage ? "Disadvantage" : "No penalty"], ["Hands", d.category==="shield" ? "One" : "None"]]));
  }
  update();
}

/* ---- Sections ---- */
function weaponSection(){
  return {
    key: "weapons", label: "Weapons", searchPlaceholder: "Search all weapons…",
    groups: WEAPON_GROUPS, data: WEAPON_DATA, // Homebrew is merged in (and kept current) by custom-items.js
    renderSub: function(name, d){ return d.properties || ""; },
    renderRight: function(name, d){ return [d.damageDice||"", d.damageType||""]; },
    searchText: function(name, d){ return name+" "+(d.properties||"")+" "+(d.damageType||"")+(d.custom ? " custom homebrew" : ""); },
    onAdd: onAddFor("weapon"),
    rowActions: customActions("weapon"),
    renderCustomForm: function(container){ buildWeaponForm(container); }
  };
}

function armorSection(){
  return {
    key: "armor", label: "Armor", searchPlaceholder: "Search all armor…",
    groups: ARMOR_GROUPS, data: ARMOR_DATA,
    renderSub: function(name, d){ return d.stealthDisadvantage ? "Disadvantage on Stealth checks" : ""; },
    renderRight: function(name, d){
      return [d.category==="shield" ? "+" + d.baseAC + " AC" : "AC " + d.baseAC, ARMOR_CATEGORY_LABEL[d.category]||""];
    },
    searchText: function(name, d){ return name+" "+(ARMOR_CATEGORY_LABEL[d.category]||"")+(d.custom ? " custom homebrew" : ""); },
    onAdd: onAddFor("armor"),
    rowActions: customActions("armor"),
    renderCustomForm: function(container){ buildArmorForm(container); }
  };
}

/* opts: forCharacter (from a sheet: adds go straight to it) and only
   ("weapons" | "armor": just that list). */
export function openArmory(opts){
  opts = opts || {};
  target = opts.forCharacter || null;
  var sections = opts.only==="weapons" ? [weaponSection()] : opts.only==="armor" ? [armorSection()] : [weaponSection(), armorSection()];
  openCatalogPicker({
    sections: sections,
    onClose: function(){ target = null; editing = {weapon:null, armor:null}; renderAll(); }
  });
}
export function openWeaponPicker(c){ openArmory({only:"weapons", forCharacter:c}); }
export function openArmorPicker(c){ openArmory({only:"armor", forCharacter:c}); }
