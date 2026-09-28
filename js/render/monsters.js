import { openCatalogPicker, showCatalogCustomView, refreshCatalog } from "../ui/catalog-picker.js";
import { openInfoModal } from "../ui/info-modal.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { showActionToast } from "../ui/toast.js";
import { playAdd, playDelete } from "../ui/sound.js";
import { themedPicker } from "../ui/themed-picker.js";
import { MONSTER_GROUPS, MONSTER_DATA } from "../data/monsters.js";
import { getCustomMonster, saveCustomMonster, deleteCustomMonster, monsterNameProblem, MONSTER_HOMEBREW_GROUP } from "../core/custom-monsters.js";
import { facts, textField, homebrewShell, numberField, pickerField, previewCard } from "../ui/homebrew-form.js";
import { escapeHtml } from "../core/helpers.js";

/* ---------------- Monster Catalog ----------------
   Browse SRD monsters by type and CR. Tap any row to read its full stat
   block. The + FAB creates a custom (homebrew) monster saved in this
   browser; custom rows carry Edit / Delete actions. */

/* ---- Helpers ---- */
var CR_ORDER = ["0","1/8","1/4","1/2","1","2","3","4","5","6","7","8","9","10",
  "11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","30"];

var SIZES      = ["Tiny","Small","Medium","Large","Huge","Gargantuan"];
var TYPES      = ["Aberration","Beast","Celestial","Construct","Dragon","Elemental",
                  "Fey","Fiend","Giant","Humanoid","Monstrosity","Ooze","Plant","Undead"];
var ALIGNMENTS = ["Unaligned","Lawful Good","Neutral Good","Chaotic Good",
                  "Lawful Neutral","Neutral","Chaotic Neutral",
                  "Lawful Evil","Neutral Evil","Chaotic Evil","Any","Any Evil","Any Non-Good","Any Non-Lawful"];
var CR_OPTIONS = ["0","1/8","1/4","1/2","1","2","3","4","5","6","7","8","9","10",
                  "11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","30"];

function modifier(score){
  var m = Math.floor((score - 10) / 2);
  return (m >= 0 ? "+" : "") + m;
}

function crSort(a, b){
  return CR_ORDER.indexOf(a) - CR_ORDER.indexOf(b);
}

/* The id of the monster currently being edited (null = create new). */
var editing = null;

/* ---- Info modal: full stat block ---- */
function openMonsterDetail(name, d){
  openInfoModal(name, function(body){
    var tags = document.createElement("div");
    tags.className = "cmp-preview-tags";
    tags.innerHTML =
      "<span class='cmp-tag-class'>" + escapeHtml(d.size + " " + d.type) + "</span>" +
      "<span class='cmp-tag-muted'>CR " + escapeHtml(d.cr) + "</span>" +
      (d.custom ? "<span class='cmp-custom-tag'>Custom</span>" : "") +
      "<span class='cmp-tag-muted'>" + escapeHtml(d.alignment) + "</span>";
    body.appendChild(tags);

    /* Core stats */
    var core = document.createElement("div");
    core.className = "mon-stat-row";
    core.innerHTML =
      "<div class='mon-stat'><span class='mon-stat-label'>HP</span><span class='mon-stat-value'>" + d.hp + "</span></div>" +
      "<div class='mon-stat'><span class='mon-stat-label'>AC</span><span class='mon-stat-value'>" + d.ac + "</span></div>" +
      "<div class='mon-stat'><span class='mon-stat-label'>Speed</span><span class='mon-stat-value'>" + d.speed + " ft</span></div>";
    body.appendChild(core);

    /* Ability scores */
    var abs = document.createElement("div");
    abs.className = "mon-ability-row";
    ["str","dex","con","int","wis","cha"].forEach(function(ab){
      var score = d[ab];
      var div = document.createElement("div");
      div.className = "mon-ability";
      div.innerHTML =
        "<span class='mon-ab-label'>" + ab.toUpperCase() + "</span>" +
        "<span class='mon-ab-score'>" + score + "</span>" +
        "<span class='mon-ab-mod'>" + modifier(score) + "</span>";
      abs.appendChild(div);
    });
    body.appendChild(abs);

    /* Notes / traits */
    if(d.notes){
      var notesEl = document.createElement("p");
      notesEl.className = "mon-notes";
      notesEl.textContent = d.notes;
      body.appendChild(notesEl);
    }
  });
}

/* ---- Homebrew rows: Edit / Delete ---- */
function customActions(name, d){
  if(!d.custom) return [];
  return [
    {
      label: "Edit", title: "Edit " + name,
      onClick: function(){ editing = d.id; showCatalogCustomView(); }
    },
    {
      label: "Delete", title: "Delete " + name, danger: true,
      onClick: function(){
        confirmDialog(
          "Delete " + name + "?",
          "This custom monster will be removed from the catalog.",
          function(){
            deleteCustomMonster(d.id);
            refreshCatalog();
            playDelete();
            showActionToast("Deleted " + name + ".");
          }
        );
      }
    }
  ];
}

/* ---- Monster section descriptor ---- */
function monsterSection(){
  return {
    key: "monsters",
    label: "Monsters",
    searchPlaceholder: "Search monsters…",
    groups: MONSTER_GROUPS,
    data: MONSTER_DATA,

    renderSub: function(name, d){
      return (d.size || "") + " " + (d.type || "");
    },
    renderRight: function(name, d){
      return ["CR " + (d.cr || "0"), d.hp ? d.hp + " hp" : ""];
    },
    searchText: function(name, d){
      return name + " " + (d.type || "") + " " + (d.cr || "") + " " + (d.size || "") + " " + (d.alignment || "") + " " + (d.notes || "");
    },
    onAdd: function(name, d){
      openMonsterDetail(name, d);
      return false; // suppress "Added" badge — this is a reference, not a pickup
    },
    rowActions: customActions,
    renderCustomForm: buildMonsterForm
  };
}

/* ---- Custom monster form ---- */
function buildMonsterForm(container){
  var existing = editing ? getCustomMonster(editing) : null;
  editing = null;

  var d = existing
    ? JSON.parse(JSON.stringify(existing))
    : { name:"", type:"Humanoid", cr:"1", size:"Medium", alignment:"Unaligned",
        hp:10, ac:12, speed:30,
        str:10, dex:10, con:10, int:10, wis:10, cha:10,
        notes:"" };

  var introText = existing
    ? "Changes apply everywhere this monster appears."
    : "Saved in this browser under Homebrew, so you can reference it any time.";

  var shell = homebrewShell(container, existing ? "Edit " + existing.name : "Create monster", introText);

  /* ── Basics ── */
  var basics = shell.section("Basics");
  var row1 = document.createElement("div"); row1.className = "cmp-form-row";

  var nameF = textField("Name *", d.name, "e.g. Shadow Stalker");
  nameF.input.addEventListener("input", function(){ d.name = nameF.input.value; update(); });
  row1.appendChild(nameF.field);

  row1.appendChild(pickerField("Type", themedPicker({
    key: "mon:type", search: false, value: d.type, placeholder: "Type", ariaLabel: "Type",
    groups: { "": TYPES.map(function(t){ return {value:t, label:t}; }) },
    onPick: function(v){ d.type = v; update(); }
  })));
  basics.appendChild(row1);

  var row2 = document.createElement("div"); row2.className = "cmp-form-row";
  row2.appendChild(pickerField("Size", themedPicker({
    key: "mon:size", search: false, value: d.size, placeholder: "Size", ariaLabel: "Size",
    groups: { "": SIZES.map(function(s){ return {value:s, label:s}; }) },
    onPick: function(v){ d.size = v; update(); }
  })));
  row2.appendChild(pickerField("Alignment", themedPicker({
    key: "mon:alignment", search: false, value: d.alignment, placeholder: "Alignment", ariaLabel: "Alignment",
    groups: { "": ALIGNMENTS.map(function(a){ return {value:a, label:a}; }) },
    onPick: function(v){ d.alignment = v; update(); }
  })));
  row2.appendChild(pickerField("CR", themedPicker({
    key: "mon:cr", search: false, value: d.cr, placeholder: "CR", ariaLabel: "Challenge Rating",
    groups: { "": CR_OPTIONS.map(function(c){ return {value:c, label:"CR " + c}; }) },
    onPick: function(v){ d.cr = v; update(); }
  })));
  basics.appendChild(row2);

  /* ── Combat ── */
  var combat = shell.section("Combat");
  var combatRow = document.createElement("div"); combatRow.className = "cmp-form-row";

  var hpF = numberField("Hit Points", d.hp, "10");
  hpF.input.step = "1";
  hpF.input.addEventListener("input", function(){ d.hp = parseInt(hpF.input.value,10)||0; update(); });
  combatRow.appendChild(hpF.field);

  var acF = numberField("Armor Class", d.ac, "12");
  acF.input.step = "1";
  acF.input.addEventListener("input", function(){ d.ac = parseInt(acF.input.value,10)||0; update(); });
  combatRow.appendChild(acF.field);

  var spdF = numberField("Speed (ft)", d.speed, "30");
  spdF.input.step = "5";
  spdF.input.addEventListener("input", function(){ d.speed = parseInt(spdF.input.value,10)||0; update(); });
  combatRow.appendChild(spdF.field);
  combat.appendChild(combatRow);

  /* ── Ability Scores ── */
  var abilitySec = shell.section("Ability Scores");
  var abRow = document.createElement("div"); abRow.className = "cmp-form-row mon-ab-form-row";
  ["str","dex","con","int","wis","cha"].forEach(function(ab){
    var f = numberField(ab.toUpperCase(), d[ab], "10");
    f.input.min = "1"; f.input.max = "30"; f.input.step = "1";
    f.input.addEventListener("input", function(){
      d[ab] = Math.max(1, Math.min(30, parseInt(f.input.value,10)||10));
      update();
    });
    abRow.appendChild(f.field);
  });
  abilitySec.appendChild(abRow);

  /* ── Traits & Notes ── */
  var traitsSec = shell.section("Traits & Notes");
  var notesF = textField("Special traits, attacks, abilities", d.notes, "e.g. Pack Tactics, Fire Breath (8d6), fly 60 ft.", true);
  notesF.input.addEventListener("input", function(){ d.notes = notesF.input.value; update(); });
  traitsSec.appendChild(notesF.field);

  /* ── Actions ── */
  shell.actions(existing ? "Save changes" : "Create monster", function(){
    var name = (d.name || "").trim();
    if(!name){
      showActionToast("Give your monster a name.", true);
      nameF.input.focus();
      return;
    }
    var clash = monsterNameProblem(name, existing && existing.id);
    if(clash){
      showActionToast(clash, true);
      nameF.input.focus();
      return;
    }
    var saved = saveCustomMonster(d);
    playAdd();
    showActionToast((existing ? "Saved " : "Created ") + saved.name + "." + (existing ? "" : " It's under Homebrew in the Monster Catalog."));
    refreshCatalog();
  });

  /* ── Live preview ── */
  function update(){
    var name = (d.name || "").trim() || "Your monster";
    previewCard(shell.preview,
      "<div class='cmp-preview-name'>" + escapeHtml(name) + "</div>" +
      "<div class='cmp-preview-tags'>" +
        "<span class='cmp-tag-class'>" + escapeHtml(d.size + " " + d.type) + "</span>" +
        "<span class='cmp-tag-muted'>CR " + escapeHtml(d.cr) + "</span>" +
        "<span class='cmp-custom-tag'>Custom</span>" +
      "</div>" +
      "<div class='mon-stat-row mon-stat-row--preview'>" +
        "<div class='mon-stat'><span class='mon-stat-label'>HP</span><span class='mon-stat-value'>" + (d.hp||0) + "</span></div>" +
        "<div class='mon-stat'><span class='mon-stat-label'>AC</span><span class='mon-stat-value'>" + (d.ac||0) + "</span></div>" +
        "<div class='mon-stat'><span class='mon-stat-label'>Spd</span><span class='mon-stat-value'>" + (d.speed||0) + "</span></div>" +
      "</div>" +
      "<div class='mon-ability-row mon-ability-row--preview'>" +
        ["str","dex","con","int","wis","cha"].map(function(ab){
          return "<div class='mon-ability'>" +
            "<span class='mon-ab-label'>" + ab.toUpperCase() + "</span>" +
            "<span class='mon-ab-score'>" + (d[ab]||10) + "</span>" +
            "<span class='mon-ab-mod'>" + modifier(d[ab]||10) + "</span>" +
          "</div>";
        }).join("") +
      "</div>" +
      (d.notes ? "<p class='mon-notes'>" + escapeHtml(d.notes) + "</p>" : "")
    );
  }
  update();
}

/* ---- Entry point ---- */
export function openMonsters(){
  openCatalogPicker({
    sections: [monsterSection()],
    onClose: function(){ editing = null; }
  });
}
