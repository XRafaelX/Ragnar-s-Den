(function(){
"use strict";

/* ---------------- Data & constants ---------------- */
var STORAGE_KEY = "ragnarsDen.characters.v1";
var ABILITIES = [["str","Strength"],["dex","Dexterity"],["con","Constitution"],["int","Intelligence"],["wis","Wisdom"],["cha","Charisma"]];
var SKILLS = [
  ["Acrobatics","dex"],["Animal Handling","wis"],["Arcana","int"],["Athletics","str"],
  ["Deception","cha"],["History","int"],["Insight","wis"],["Intimidation","cha"],
  ["Investigation","int"],["Medicine","wis"],["Nature","int"],["Perception","wis"],
  ["Performance","cha"],["Persuasion","cha"],["Religion","int"],["Sleight of Hand","dex"],
  ["Stealth","dex"],["Survival","wis"]
];
var HIT_DICE_BY_CLASS = {
  "Artificer":10,"Barbarian":12,"Bard":8,"Cleric":8,"Druid":8,"Fighter":10,"Monk":8,
  "Paladin":10,"Ranger":10,"Rogue":8,"Sorcerer":6,"Warlock":8,"Wizard":6
};
var CLASS_LIST = Object.keys(HIT_DICE_BY_CLASS);

var RACES = {
  "Standard (SRD)": [
    "Human","Hill Dwarf","Mountain Dwarf","High Elf","Wood Elf","Dark Elf (Drow)",
    "Lightfoot Halfling","Stout Halfling","Dragonborn","Rock Gnome","Forest Gnome",
    "Half-Elf","Half-Orc","Tiefling"
  ],
  "Expanded": [
    "Aarakocra","Aasimar","Bugbear","Centaur","Changeling","Deep Gnome (Svirfneblin)",
    "Duergar","Eladrin","Fairy","Firbolg","Genasi (Air)","Genasi (Earth)","Genasi (Fire)",
    "Genasi (Water)","Gith (Githyanki)","Gith (Githzerai)","Goblin","Goliath","Harengon",
    "Hobgoblin","Kenku","Kobold","Lizardfolk","Loxodon","Minotaur","Orc","Satyr",
    "Sea Elf","Shadar-kai","Shifter","Simic Hybrid","Tabaxi","Thri-kreen","Tortle",
    "Triton","Vedalken","Verdan","Warforged","Yuan-ti Pureblood"
  ]
};

var BACKGROUNDS = {
  "Standard (SRD)": ["Acolyte"],
  "Expanded": [
    "Charlatan","Criminal","Entertainer","Folk Hero","Guild Artisan","Guild Merchant",
    "Hermit","Noble","Outlander","Sage","Sailor","Soldier","Urchin","Anthropologist",
    "Archaeologist","City Watch","Clan Crafter","Cloistered Scholar","Courtier",
    "Faction Agent","Far Traveler","Inheritor","Knight of the Order","Mercenary Veteran",
    "Urban Bounty Hunter","Uthgardt Tribe Member","Waterdhavian Noble"
  ]
};

var ALIGNMENTS = {
  "Alignment": [
    "Lawful Good","Neutral Good","Chaotic Good",
    "Lawful Neutral","True Neutral","Chaotic Neutral",
    "Lawful Evil","Neutral Evil","Chaotic Evil"
  ]
};

/* ---------------- Character Creation Wizard data ----------------
   Only Barbarian has a fully guided creation experience right now.
   The other classes appear (with a one-line blurb) so the class list
   reads as complete, but are marked unavailable until they're built
   out the same way. */
var CLASS_BLURBS = {
  "Artificer":"Half-caster inventor who infuses magic into gadgets and tools.",
  "Barbarian":"A fierce melee fighter who channels primal rage for huge damage and toughness.",
  "Bard":"A versatile spellcaster and skill-monkey who inspires allies with music and magic.",
  "Cleric":"A divine spellcaster channeling a deity's power to heal and smite.",
  "Druid":"A nature spellcaster who can shapeshift into animals and command the elements.",
  "Fighter":"A master of weapons and armor with the most versatile combat options.",
  "Monk":"A martial artist who fights unarmed with supernatural speed and ki.",
  "Paladin":"A holy warrior blending heavy armor combat with divine spells and oaths.",
  "Ranger":"A wilderness warrior blending archery or melee with nature magic.",
  "Rogue":"A stealthy skill expert who deals massive damage with Sneak Attack.",
  "Sorcerer":"An innate spellcaster whose magic comes from a magical bloodline.",
  "Warlock":"A spellcaster who's struck a bargain with a powerful otherworldly patron.",
  "Wizard":"A studious spellcaster with the largest spell list, learned from a spellbook."
};

var CLASSES_INFO = {};
CLASS_LIST.forEach(function(name){
  CLASSES_INFO[name] = { available:false, blurb: CLASS_BLURBS[name] || "" };
});

CLASSES_INFO["Barbarian"] = {
  available:true,
  blurb: CLASS_BLURBS["Barbarian"],
  primaryAbility:"str",
  savingThrows:["str","con"],
  spellcaster:false,
  skillChoices:{count:2, options:["Animal Handling","Athletics","Intimidation","Nature","Perception","Survival"]},
  features:[
    {name:"Rage", text:"Bonus action to enter a rage for 1 minute: +2 damage on Strength melee attacks, resistance to bludgeoning/piercing/slashing damage, advantage on Strength checks and saves. You have 2 rages at level 1, regained on a long rest."},
    {name:"Unarmored Defense", text:"While wearing no armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can still use a shield and gain this benefit."}
  ],
  equipment:{
    choiceGroups:[
      {options:[
        {key:"greataxe", label:"Greataxe", detail:"1d12 slashing damage, heavy, two-handed", items:[{name:"Greataxe",qty:1,weight:7,notes:"1d12 slashing, heavy, two-handed"}]},
        {key:"martial", label:"Any other martial melee weapon", detail:"Pick the specific weapon once you're on the sheet", items:[{name:"Martial melee weapon",qty:1,weight:6,notes:"choose specific weapon"}]}
      ]},
      {options:[
        {key:"handaxes", label:"Two handaxes", detail:"1d6 slashing, light, thrown (range 20/60 ft)", items:[{name:"Handaxe",qty:2,weight:2,notes:"1d6 slashing, light, thrown 20/60"}]},
        {key:"simple", label:"Any simple weapon", detail:"Pick the specific weapon once you're on the sheet", items:[{name:"Simple weapon",qty:1,weight:4,notes:"choose specific weapon"}]}
      ]}
    ],
    fixed:[
      {name:"Explorer's Pack", qty:1, weight:59, notes:"backpack, bedroll, mess kit, tinderbox, 10 torches, 10 days rations, waterskin, 50ft rope"},
      {name:"Javelin", qty:4, weight:2}
    ]
  }
};

var RACE_TRAITS = {
  "Human": "+1 to every ability score. No other special traits — flexible and simple to play.",
  "Hill Dwarf": "+2 CON, +1 WIS. Darkvision 60ft, resistance to poison damage, advantage on saves vs. poison, +1 HP per level.",
  "Mountain Dwarf": "+2 CON, +2 STR. Darkvision 60ft, poison resistance, proficiency with light and medium armor.",
  "High Elf": "+2 DEX, +1 INT. Darkvision 60ft, advantage vs. being charmed, can't be magically put to sleep, know one wizard cantrip.",
  "Wood Elf": "+2 DEX, +1 WIS. Darkvision, fey ancestry, +5ft speed, can try to hide even when only lightly obscured.",
  "Dark Elf (Drow)": "+2 DEX, +1 CHA. Superior darkvision 120ft, sunlight sensitivity (disadvantage in bright sunlight), a few innate spells at higher levels.",
  "Lightfoot Halfling": "+2 DEX, +1 CHA. Lucky (reroll 1s on d20), brave (advantage vs. frightened), can hide behind bigger creatures.",
  "Stout Halfling": "+2 DEX, +1 CON. Lucky, brave, resistance to poison damage and advantage vs. poison.",
  "Dragonborn": "+2 STR, +1 CHA. Breath weapon (elemental damage in a line or cone) and resistance to your draconic ancestry's damage type.",
  "Rock Gnome": "+2 INT, +1 CON. Darkvision, advantage on INT/WIS/CHA saves vs. magic, can tinker with tiny clockwork devices.",
  "Forest Gnome": "+2 INT, +1 DEX. Darkvision, advantage vs. magic saves, know the minor illusion cantrip, can speak with small animals.",
  "Half-Elf": "+2 CHA, +1 to two other abilities of your choice. Darkvision, advantage vs. charm, two extra skill proficiencies.",
  "Half-Orc": "+2 STR, +1 CON. Darkvision, menacing (Intimidation proficiency), relentless endurance (drop to 1 HP instead of 0, once per long rest).",
  "Tiefling": "+2 CHA, +1 INT. Darkvision, resistance to fire damage, know the thaumaturgy cantrip and more spells at higher levels."
};
var RACE_TRAIT_FALLBACK = "This is an expanded (non-SRD) race — check your table's sourcebook for its exact ability score bonuses and traits. Everything else here still works fine once you've picked it.";

var BACKGROUND_INFO = {
  "Acolyte": {skills:["Insight","Religion"], blurb:"Grants Insight and Religion, plus a holy symbol and prayer book. You served in a temple."},
  "Charlatan": {skills:["Deception","Sleight of Hand"], blurb:"Grants Deception and Sleight of Hand. You're a practiced con artist and forger."},
  "Criminal": {skills:["Deception","Stealth"], blurb:"Grants Deception and Stealth, plus a criminal contact. You have a history of breaking the law."},
  "Entertainer": {skills:["Acrobatics","Performance"], blurb:"Grants Acrobatics and Performance, plus a musical instrument. You lived to entertain audiences."},
  "Folk Hero": {skills:["Animal Handling","Survival"], blurb:"Grants Animal Handling and Survival. You're a champion of the common people back home."},
  "Guild Artisan": {skills:["Insight","Persuasion"], blurb:"Grants Insight and Persuasion, plus membership in a trade guild and its tools."},
  "Hermit": {skills:["Medicine","Religion"], blurb:"Grants Medicine and Religion. You lived in seclusion, seeking spiritual insight."},
  "Noble": {skills:["History","Persuasion"], blurb:"Grants History and Persuasion, plus a signet ring and standing in society."},
  "Outlander": {skills:["Athletics","Survival"], blurb:"Grants Athletics and Survival. You grew up in the wilds, far from civilization — a natural fit for a Barbarian."},
  "Sage": {skills:["Arcana","History"], blurb:"Grants Arcana and History. You spent years learning the lore of the multiverse."},
  "Sailor": {skills:["Athletics","Perception"], blurb:"Grants Athletics and Perception, plus rope and a vehicle proficiency. You sailed the seas."},
  "Soldier": {skills:["Athletics","Intimidation"], blurb:"Grants Athletics and Intimidation, plus rank and military gear. You served in an army."},
  "Urchin": {skills:["Sleight of Hand","Stealth"], blurb:"Grants Sleight of Hand and Stealth. You grew up on the streets, alone and poor."}
};
var BACKGROUND_INFO_FALLBACK = "Grants two skill proficiencies of your choice (and usually a tool or language) — pick whatever fits your character's story; you can add them on the sheet's Skills tab afterward.";

var POINT_BUY_COSTS = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};

var state = {
  characters: [],
  activeId: null,
  activeTab: "vitals"
};

/* ---------------- Persistence ---------------- */
function load(){
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    state.characters = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error("Failed to load vault data", e);
    state.characters = [];
  }
}
function save(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.characters));
  }catch(e){
    alert("Could not save — your browser storage may be full or restricted.");
    console.error(e);
  }
}

/* ---------------- Helpers ---------------- */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function mod(score){ return Math.floor((Number(score||10)-10)/2); }
function fmtMod(n){ return (n>=0?"+":"")+n; }
function totalLevel(c){ return (c.classes||[]).reduce(function(a,cl){return a+(Number(cl.level)||0);},0) || 1; }
function profBonus(c){ return Math.floor((totalLevel(c)-1)/4)+2; }
function primaryHitDie(c){
  var cl = (c.classes||[])[0];
  if(!cl) return 8;
  return HIT_DICE_BY_CLASS[cl.name] || 8;
}
function clamp(n,lo,hi){ return Math.max(lo,Math.min(hi,n)); }
function ce(tag, cls){ var e = document.createElement(tag); if(cls) e.className = cls; return e; }
function escapeHtml(s){
  return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function nowStamp(){
  var d = new Date();
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})+" · "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}

/* ---------------- Default character ---------------- */
function newCharacter(name){
  var abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  var skillProfs = {};
  SKILLS.forEach(function(s){ skillProfs[s[0]] = {prof:false, expertise:false}; });
  var saveProfs = {str:false,dex:false,con:false,int:false,wis:false,cha:false};
  var slots = {};
  for(var i=1;i<=9;i++) slots[i] = {max:0, used:0};
  return {
    id: uid(),
    name: name || "New Character",
    race: "",
    background: "",
    alignment: "",
    classes: [{name:"Fighter", subclass:"", level:1}],
    abilities: abilities,
    saveProfs: saveProfs,
    skillProfs: skillProfs,
    hp: {max:10, current:10, temp:0},
    ac: 10,
    initiativeMisc: 0,
    speed: 30,
    hitDiceUsed: 0,
    deathSaves: {success:0, fail:0},
    spellcasting: {ability:"int", slots: slots},
    spells: [],
    feats: [],
    features: [],
    inventory: [],
    currency: {cp:0, sp:0, ep:0, gp:0, pp:0},
    notes: [],
    rollLog: []
  };
}

/* ---------------- Migration safety (older saves) ---------------- */
function ensureShape(c){
  if(!c.classes) c.classes = [{name:"Fighter", subclass:"", level: c.level||1}];
  if(!c.abilities) c.abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  if(!c.skillProfs){
    c.skillProfs = {};
    SKILLS.forEach(function(s){ c.skillProfs[s[0]] = {prof:false, expertise:false}; });
  }
  if(!c.saveProfs) c.saveProfs = {str:false,dex:false,con:false,int:false,wis:false,cha:false};
  if(!c.hp) c.hp = {max:10, current:10, temp:0};
  if(c.ac==null) c.ac = 10;
  if(c.initiativeMisc==null) c.initiativeMisc = 0;
  if(c.speed==null) c.speed = 30;
  if(c.hitDiceUsed==null) c.hitDiceUsed = 0;
  if(!c.deathSaves) c.deathSaves = {success:0, fail:0};
  if(!c.spellcasting) c.spellcasting = {ability:"int", slots:{}};
  if(!c.spellcasting.slots) c.spellcasting.slots = {};
  for(var i=1;i<=9;i++){ if(!c.spellcasting.slots[i]) c.spellcasting.slots[i] = {max:0,used:0}; }
  if(!c.spells) c.spells = [];
  if(!c.feats) c.feats = [];
  if(!c.features) c.features = [];
  if(!c.inventory) c.inventory = [];
  if(!c.currency) c.currency = {cp:0,sp:0,ep:0,gp:0,pp:0};
  if(!c.notes) c.notes = [];
  if(!c.rollLog) c.rollLog = [];
  return c;
}

function getActive(){
  return state.characters.find(function(c){ return c.id===state.activeId; });
}

/* ---------------- Rendering: sidebar ---------------- */
function renderSidebar(){
  var list = document.getElementById("char-list");
  list.innerHTML = "";
  state.characters.forEach(function(c){
    var li = document.createElement("li");
    li.className = c.id===state.activeId ? "active" : "";
    var pct = c.hp.max>0 ? clamp(Math.round((c.hp.current/c.hp.max)*100),0,100) : 0;
    var clsText = (c.classes||[]).map(function(cl){return (cl.name||"?")+" "+(cl.level||1);}).join(" / ");
    li.innerHTML =
      '<span class="cname">'+escapeHtml(c.name||"Unnamed")+'</span>'+
      '<span class="cmeta">'+escapeHtml(c.race||"—")+' · '+escapeHtml(clsText)+'</span>'+
      '<div class="hp-bar"><div class="hp-fill" style="width:'+pct+'%"></div></div>';
    li.addEventListener("click", function(){
      state.activeId = c.id;
      state.activeTab = "vitals";
      renderAll();
      closeSidebarMobile();
    });
    list.appendChild(li);
  });
  var titleEl = document.getElementById("tb-title");
  var active = getActive();
  titleEl.textContent = active ? active.name : "Ragnar's Den";
}

/* ---------------- Rendering: sheet ---------------- */
var TABS = [
  ["vitals","Vitals"],
  ["abilities","Abilities & Skills"],
  ["spells","Spells"],
  ["inventory","Inventory"],
  ["journal","Journal"]
];

function renderAll(){
  renderSidebar();
  var c = getActive();
  var empty = document.getElementById("empty-state");
  var sheet = document.getElementById("sheet");
  if(!c){
    empty.style.display = "flex";
    sheet.style.display = "none";
    renderRollLog();
    return;
  }
  empty.style.display = "none";
  sheet.style.display = "block";
  sheet.innerHTML = "";
  sheet.appendChild(renderIdentity(c));

  var tabsBar = document.createElement("div");
  tabsBar.id = "tabs";
  TABS.forEach(function(t){
    var b = document.createElement("button");
    b.textContent = t[1];
    if(state.activeTab===t[0]) b.className = "active";
    b.addEventListener("click", function(){ state.activeTab = t[0]; renderAll(); });
    tabsBar.appendChild(b);
  });
  sheet.appendChild(tabsBar);

  var panelMap = {
    vitals: renderVitalsPanel,
    abilities: renderAbilitiesPanel,
    spells: renderSpellsPanel,
    inventory: renderInventoryPanel,
    journal: renderJournalPanel
  };
  TABS.forEach(function(t){
    var panel = panelMap[t[0]](c);
    panel.className = "panel" + (state.activeTab===t[0] ? " active" : "");
    sheet.appendChild(panel);
  });

  renderRollLog();
}

function field(el, tag, cls, txt){}

/* Generic dropdown field with grouped standard/expanded options plus a
   "Custom / homebrew" fallback that reveals a free-text input. Used for
   race, background, alignment — anywhere we want guided choices without
   ever blocking something not on the list. */
function dropdownField(labelTxt, key, groups, c, onChangeExtra){
  var f = document.createElement("div");
  f.className = "field";
  var l = document.createElement("label"); l.textContent = labelTxt;
  f.appendChild(l);

  var allValues = [];
  Object.keys(groups).forEach(function(g){ allValues = allValues.concat(groups[g]); });

  var select = document.createElement("select");
  var blankOpt = document.createElement("option");
  blankOpt.value = ""; blankOpt.textContent = "— choose —";
  select.appendChild(blankOpt);
  Object.keys(groups).forEach(function(groupLabel){
    var og = document.createElement("optgroup");
    og.label = groupLabel;
    groups[groupLabel].forEach(function(opt){
      var o = document.createElement("option");
      o.value = opt; o.textContent = opt;
      og.appendChild(o);
    });
    select.appendChild(og);
  });
  var customOpt = document.createElement("option");
  customOpt.value = "__custom__"; customOpt.textContent = "Custom / homebrew…";
  select.appendChild(customOpt);

  var customInput = document.createElement("input");
  customInput.type = "text";
  customInput.placeholder = "Enter custom "+labelTxt.toLowerCase();
  customInput.style.display = "none";
  customInput.style.marginTop = "3px";

  var currentVal = c[key]||"";
  if(currentVal && allValues.indexOf(currentVal)===-1){
    select.value = "__custom__";
    customInput.value = currentVal;
    customInput.style.display = "block";
  } else {
    select.value = currentVal;
  }

  select.addEventListener("change", function(){
    if(select.value==="__custom__"){
      customInput.style.display = "block";
      customInput.focus();
      c[key] = customInput.value;
    } else {
      customInput.style.display = "none";
      c[key] = select.value;
    }
    save();
    if(onChangeExtra) onChangeExtra();
  });
  customInput.addEventListener("input", function(){
    c[key] = customInput.value;
    save();
    if(onChangeExtra) onChangeExtra();
  });

  f.appendChild(select);
  f.appendChild(customInput);
  return f;
}

function renderIdentity(c){
  var wrap = document.createElement("div");
  wrap.className = "identity";

  var nameRow = document.createElement("div");
  nameRow.className = "name-row";
  var nameInput = document.createElement("input");
  nameInput.className = "charname";
  nameInput.value = c.name;
  nameInput.placeholder = "Character name";
  nameInput.addEventListener("input", function(){ c.name = nameInput.value; save(); renderSidebar(); });
  nameRow.appendChild(nameInput);
  wrap.appendChild(nameRow);

  var subRow = document.createElement("div");
  subRow.className = "sub-row";

  subRow.appendChild(dropdownField("Race", "race", RACES, c, function(){ renderSidebar(); }));
  subRow.appendChild(dropdownField("Background", "background", BACKGROUNDS, c));
  subRow.appendChild(dropdownField("Alignment", "alignment", ALIGNMENTS, c));

  var pbField = document.createElement("div");
  pbField.className = "field";
  pbField.innerHTML = '<label>Proficiency</label>';
  var pbVal = document.createElement("input");
  pbVal.value = fmtMod(profBonus(c));
  pbVal.disabled = true;
  pbVal.style.color = "var(--text-on-parch-dim)";
  pbField.appendChild(pbVal);
  subRow.appendChild(pbField);

  wrap.appendChild(subRow);

  var classesRow = document.createElement("div");
  classesRow.className = "classes-row";
  (c.classes||[]).forEach(function(cl, idx){
    var chip = document.createElement("div");
    chip.className = "class-chip";
    var sel = document.createElement("select");
    sel.style.background = "transparent";
    sel.style.border = "none";
    sel.style.fontSize = "12.5px";
    sel.style.color = "var(--text-on-parch)";
    var freeOpt = document.createElement("option");
    var opts = CLASS_LIST.slice();
    if(cl.name && opts.indexOf(cl.name)===-1) opts.unshift(cl.name);
    opts.forEach(function(name){
      var o = document.createElement("option");
      o.value = name; o.textContent = name;
      if(cl.name===name) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function(){ cl.name = sel.value; save(); renderAll(); });
    var subInput = document.createElement("input");
    subInput.placeholder = "subclass";
    subInput.value = cl.subclass||"";
    subInput.addEventListener("input", function(){ cl.subclass = subInput.value; save(); });
    var lvlInput = document.createElement("input");
    lvlInput.className = "lvl";
    lvlInput.type = "number"; lvlInput.min="1"; lvlInput.max="20";
    lvlInput.value = cl.level||1;
    lvlInput.addEventListener("input", function(){ cl.level = clamp(Number(lvlInput.value)||1,1,20); save(); renderAll(); });
    chip.appendChild(sel);
    chip.appendChild(subInput);
    chip.appendChild(document.createTextNode("Lv"));
    chip.appendChild(lvlInput);
    if((c.classes||[]).length>1){
      var x = document.createElement("span");
      x.className = "x"; x.textContent = "×";
      x.addEventListener("click", function(){ c.classes.splice(idx,1); save(); renderAll(); });
      chip.appendChild(x);
    }
    classesRow.appendChild(chip);
  });
  var addClassBtn = document.createElement("button");
  addClassBtn.className = "btn small";
  addClassBtn.textContent = "+ Multiclass";
  addClassBtn.style.color = "var(--text-on-parch)";
  addClassBtn.style.borderColor = "var(--rule)";
  addClassBtn.addEventListener("click", function(){
    c.classes.push({name:"Fighter", subclass:"", level:1});
    save(); renderAll();
  });
  classesRow.appendChild(addClassBtn);
  var totalSpan = document.createElement("span");
  totalSpan.className = "total-level";
  totalSpan.textContent = "Total level "+totalLevel(c);
  classesRow.appendChild(totalSpan);

  var deleteBtn = makeDeleteButton(c);
  deleteBtn.style.marginLeft = "auto";
  classesRow.appendChild(deleteBtn);

  wrap.appendChild(classesRow);

  return wrap;
}

function makeCard(titleText, hint){
  var card = document.createElement("div");
  card.className = "card";
  var h = document.createElement("h3");
  var span = document.createElement("span");
  span.textContent = titleText;
  h.appendChild(span);
  if(hint){
    var hh = document.createElement("span");
    hh.className = "hint"; hh.textContent = hint;
    h.appendChild(hh);
  }
  card.appendChild(h);
  return card;
}

/* ---- Vitals panel ---- */
function renderVitalsPanel(c){
  var panel = document.createElement("div");

  var card = makeCard("Hit points & defense");
  var grid = document.createElement("div");
  grid.className = "vitals-grid";

  // HP box
  var hpBox = document.createElement("div");
  hpBox.className = "vital-box";
  hpBox.innerHTML = '<div class="lbl">Hit Points</div>';
  var hpRow = document.createElement("div");
  hpRow.className = "hp-row";
  var curInput = document.createElement("input");
  curInput.type="number"; curInput.value = c.hp.current;
  curInput.addEventListener("input", function(){
    c.hp.current = clamp(Number(curInput.value)||0, -999, c.hp.max+ (Number(c.hp.temp)||0) + 200);
    save(); renderSidebar();
  });
  var slash = document.createElement("span"); slash.textContent="/";
  var maxInput = document.createElement("input");
  maxInput.type="number"; maxInput.value = c.hp.max;
  maxInput.addEventListener("input", function(){ c.hp.max = Number(maxInput.value)||1; save(); renderSidebar(); });
  hpRow.appendChild(curInput); hpRow.appendChild(slash); hpRow.appendChild(maxInput);
  hpBox.appendChild(hpRow);
  var tempRow = document.createElement("div");
  tempRow.style.marginTop="4px"; tempRow.style.fontSize="11px"; tempRow.style.color="var(--text-on-parch-dim)";
  tempRow.appendChild(document.createTextNode("Temp HP "));
  var tempInput = document.createElement("input");
  tempInput.type="number"; tempInput.value = c.hp.temp||0; tempInput.style.width="40px";
  tempInput.addEventListener("input", function(){ c.hp.temp = Number(tempInput.value)||0; save(); });
  tempRow.appendChild(tempInput);
  hpBox.appendChild(tempRow);
  var qb = document.createElement("div");
  qb.className = "quickbtns";
  var dmgInput = document.createElement("input"); dmgInput.type="number"; dmgInput.placeholder="0"; dmgInput.value="";
  var dmgBtn = document.createElement("button"); dmgBtn.className="btn small danger"; dmgBtn.textContent="Damage";
  dmgBtn.addEventListener("click", function(){
    var n = Number(dmgInput.value)||0;
    if(n<=0) return;
    var temp = Number(c.hp.temp)||0;
    if(temp>0){
      var absorbed = Math.min(temp,n);
      c.hp.temp = temp-absorbed;
      n -= absorbed;
    }
    c.hp.current = Math.max(0, c.hp.current-n);
    dmgInput.value=""; save(); renderAll();
  });
  var healBtn = document.createElement("button"); healBtn.className="btn small"; healBtn.style.color="var(--moss)"; healBtn.style.borderColor="var(--moss)"; healBtn.textContent="Heal";
  healBtn.addEventListener("click", function(){
    var n = Number(dmgInput.value)||0;
    if(n<=0) return;
    c.hp.current = clamp(c.hp.current+n, 0, c.hp.max);
    dmgInput.value=""; save(); renderAll();
  });
  qb.appendChild(dmgInput); qb.appendChild(dmgBtn); qb.appendChild(healBtn);
  hpBox.appendChild(qb);

  if(c.hp.current<=0){
    var ds = document.createElement("div");
    ds.className = "death-saves";
    ["success","fail"].forEach(function(kind){
      var grp = document.createElement("div"); grp.className="grp";
      var lbl = document.createElement("div"); lbl.textContent = kind==="success"?"Successes":"Failures";
      var boxes = document.createElement("div"); boxes.className="boxes";
      for(var i=0;i<3;i++){
        var cb = document.createElement("input"); cb.type="checkbox";
        cb.checked = i < (c.deathSaves[kind]||0);
        (function(i){
          cb.addEventListener("change", function(){
            c.deathSaves[kind] = cb.checked ? i+1 : i;
            save(); renderAll();
          });
        })(i);
        boxes.appendChild(cb);
      }
      grp.appendChild(lbl); grp.appendChild(boxes);
      ds.appendChild(grp);
    });
    hpBox.appendChild(ds);
  }
  grid.appendChild(hpBox);

  function smallVital(label, key, isNested){
    var box = document.createElement("div");
    box.className = "vital-box";
    box.innerHTML = '<div class="lbl">'+label+'</div>';
    var input = document.createElement("input");
    input.type="number";
    input.value = isNested ? c[isNested][key] : c[key];
    input.addEventListener("input", function(){
      var v = Number(input.value)||0;
      if(isNested) c[isNested][key]=v; else c[key]=v;
      save();
    });
    box.appendChild(input);
    return box;
  }
  grid.appendChild(smallVital("Armor Class","ac"));

  var initBox = document.createElement("div");
  initBox.className = "vital-box";
  var dexMod = mod(c.abilities.dex);
  var initTotal = dexMod + (Number(c.initiativeMisc)||0);
  initBox.innerHTML = '<div class="lbl">Initiative</div><div style="font-family:var(--serif);font-size:22px;">'+fmtMod(initTotal)+'</div>';
  var initMiscRow = document.createElement("div");
  initMiscRow.style.fontSize="10.5px"; initMiscRow.style.color="var(--text-on-parch-dim)"; initMiscRow.style.marginTop="4px";
  initMiscRow.appendChild(document.createTextNode("misc "));
  var initMiscInput = document.createElement("input");
  initMiscInput.type="number"; initMiscInput.value=c.initiativeMisc||0; initMiscInput.style.width="34px";
  initMiscInput.addEventListener("input", function(){ c.initiativeMisc = Number(initMiscInput.value)||0; save(); renderAll(); });
  initMiscRow.appendChild(initMiscInput);
  initBox.appendChild(initMiscRow);
  initBox.style.cursor="pointer";
  initBox.title = "Click to roll initiative";
  initBox.addEventListener("click", function(e){
    if(e.target.tagName==="INPUT") return;
    performRoll(20,1,initTotal,"none","Initiative");
  });
  grid.appendChild(initBox);

  grid.appendChild(smallVital("Speed (ft)","speed"));

  card.appendChild(grid);
  panel.appendChild(card);

  // Hit dice + rest
  var restCard = makeCard("Hit dice & rest");
  var hd = totalLevel(c);
  var hdUsed = clamp(c.hitDiceUsed||0,0,hd);
  var hdRemaining = hd-hdUsed;
  var hdP = document.createElement("p");
  hdP.style.fontSize="13px"; hdP.style.margin="0 0 8px";
  hdP.textContent = "Hit dice remaining: "+hdRemaining+" / "+hd+"  (d"+primaryHitDie(c)+")";
  restCard.appendChild(hdP);

  var restRow = document.createElement("div");
  restRow.className = "rest-row";

  var spendBtn = document.createElement("button");
  spendBtn.className = "btn small"; spendBtn.textContent = "Spend 1 hit die";
  spendBtn.addEventListener("click", function(){
    if(hdRemaining<=0){ return; }
    var die = primaryHitDie(c);
    var conMod = mod(c.abilities.con);
    var roll = Math.floor(Math.random()*die)+1;
    var healed = Math.max(1, roll+conMod);
    c.hitDiceUsed = hdUsed+1;
    c.hp.current = clamp(c.hp.current+healed, 0, c.hp.max);
    logRoll("Hit die (d"+die+"+"+conMod+")", roll+" "+fmtMod(conMod)+" = "+healed+" HP healed");
    save(); renderAll();
  });
  restRow.appendChild(spendBtn);

  var shortRestBtn = document.createElement("button");
  shortRestBtn.className = "btn small"; shortRestBtn.textContent = "Short rest";
  shortRestBtn.title = "Reminder to spend hit dice; does not auto-heal";
  shortRestBtn.addEventListener("click", function(){
    logRoll("Short rest taken", "Spend hit dice as needed to heal.");
    save(); renderAll();
  });
  restRow.appendChild(shortRestBtn);

  var longRestBtn = document.createElement("button");
  longRestBtn.className = "btn small primary"; longRestBtn.textContent = "Long rest";
  longRestBtn.addEventListener("click", function(){
    c.hp.current = c.hp.max;
    c.hp.temp = 0;
    c.deathSaves = {success:0, fail:0};
    var recovered = Math.max(1, Math.floor(hd/2));
    c.hitDiceUsed = clamp(hdUsed-recovered, 0, hd);
    Object.keys(c.spellcasting.slots).forEach(function(lvl){
      c.spellcasting.slots[lvl].used = 0;
    });
    logRoll("Long rest taken", "HP and spell slots restored; "+recovered+" hit dice recovered.");
    save(); renderAll();
  });
  restRow.appendChild(longRestBtn);

  restCard.appendChild(restRow);
  panel.appendChild(restCard);

  return panel;
}

/* ---- Abilities & Skills panel ---- */
function renderAbilitiesPanel(c){
  var panel = document.createElement("div");

  var abCard = makeCard("Ability scores", "tap a score to roll a check");
  var grid = document.createElement("div");
  grid.className = "abilities-grid";
  ABILITIES.forEach(function(a){
    var key = a[0];
    var box = document.createElement("div");
    box.className = "ability-box";
    var m = mod(c.abilities[key]);
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(m)+'</div>';
    var input = document.createElement("input");
    input.type="number"; input.value = c.abilities[key];
    input.addEventListener("input", function(e){
      e.stopPropagation();
      c.abilities[key] = Number(input.value)||10;
      save(); renderAll();
    });
    input.addEventListener("click", function(e){ e.stopPropagation(); });
    box.appendChild(input);
    box.addEventListener("click", function(){
      performRoll(20,1,mod(c.abilities[key]),"none", a[1]+" check");
    });
    grid.appendChild(box);
  });
  abCard.appendChild(grid);
  panel.appendChild(abCard);

  var saveCard = makeCard("Saving throws", "tap a save to roll it");
  var saveRows = document.createElement("div");
  saveRows.className = "list-rows";
  ABILITIES.forEach(function(a){
    var key = a[0];
    var pb = c.saveProfs[key] ? profBonus(c) : 0;
    var total = mod(c.abilities[key]) + pb;
    var row = document.createElement("div");
    row.className = "list-row";
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk"; cb.checked = !!c.saveProfs[key];
    cb.addEventListener("change", function(){ c.saveProfs[key]=cb.checked; save(); renderAll(); });
    var name = document.createElement("span");
    name.className = "row-name"; name.textContent = a[1];
    name.addEventListener("click", function(){ performRoll(20,1,total,"none", a[1]+" save"); });
    var modSpan = document.createElement("span");
    modSpan.className = "row-mod"; modSpan.textContent = fmtMod(total);
    row.appendChild(cb); row.appendChild(name); row.appendChild(modSpan);
    saveRows.appendChild(row);
  });
  saveCard.appendChild(saveRows);
  panel.appendChild(saveCard);

  var skillCard = makeCard("Skills", "tap a skill to roll it · P = proficient, E = expertise");
  var skillRows = document.createElement("div");
  skillRows.className = "list-rows";
  var header = document.createElement("div");
  header.className = "list-row";
  header.style.borderBottom = "1px solid var(--rule)";
  header.innerHTML = '<span style="width:15px;font-size:10px;color:var(--text-on-parch-dim);">P</span>'+
    '<span style="width:15px;font-size:10px;color:var(--text-on-parch-dim);">E</span>'+
    '<span class="row-name" style="font-size:10px;color:var(--text-on-parch-dim);text-transform:uppercase;">Skill</span>'+
    '<span class="abbr"></span><span class="row-mod"></span>';
  skillRows.appendChild(header);
  SKILLS.forEach(function(s){
    var name = s[0], ab = s[1];
    var entry = c.skillProfs[name] || {prof:false, expertise:false};
    var pb = profBonus(c);
    var bonus = mod(c.abilities[ab]) + (entry.expertise ? pb*2 : (entry.prof ? pb : 0));
    var row = document.createElement("div");
    row.className = "list-row";
    var profCb = document.createElement("input");
    profCb.type="checkbox"; profCb.className="chk";
    profCb.checked = !!entry.prof;
    profCb.addEventListener("change", function(){ entry.prof = profCb.checked; c.skillProfs[name]=entry; save(); renderAll(); });
    var expCb = document.createElement("input");
    expCb.type="checkbox"; expCb.className="exp-chk";
    expCb.checked = !!entry.expertise;
    expCb.addEventListener("change", function(){ entry.expertise = expCb.checked; c.skillProfs[name]=entry; save(); renderAll(); });
    var nameSpan = document.createElement("span");
    nameSpan.className = "row-name"; nameSpan.textContent = name;
    nameSpan.addEventListener("click", function(){ performRoll(20,1,bonus,"none", name); });
    var abbr = document.createElement("span");
    abbr.className = "abbr"; abbr.textContent = ab.toUpperCase();
    var modSpan = document.createElement("span");
    modSpan.className = "row-mod"; modSpan.textContent = fmtMod(bonus);
    row.appendChild(profCb); row.appendChild(expCb); row.appendChild(nameSpan); row.appendChild(abbr); row.appendChild(modSpan);
    skillRows.appendChild(row);
  });
  skillCard.appendChild(skillRows);
  panel.appendChild(skillCard);

  var featCard = makeCard("Feats & features");
  var featTextarea = document.createElement("textarea");
  featTextarea.className = "freeform";
  featTextarea.placeholder = "List feats, class features, racial traits — one per line, however you like to organize them.";
  featTextarea.value = (c.features||[]).join("\n");
  featTextarea.addEventListener("input", function(){
    c.features = featTextarea.value.split("\n");
    save();
  });
  featCard.appendChild(featTextarea);
  panel.appendChild(featCard);

  return panel;
}

/* ---- Spells panel ---- */
function renderSpellsPanel(c){
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

  var slotCard = makeCard("Spell slots", "click a filled dot to mark used, an empty one to restore");
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
    rmBtn.addEventListener("click", function(){ c.spells.splice(idx,1); save(); renderAll(); });
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
    save(); renderAll();
  });
  spellCard.appendChild(addSpellBtn);
  panel.appendChild(spellCard);

  return panel;
}

/* ---- Inventory panel ---- */
function renderInventoryPanel(c){
  var panel = document.createElement("div");

  var curCard = makeCard("Currency");
  var curRow = document.createElement("div");
  curRow.className = "grid-row";
  ["cp","sp","ep","gp","pp"].forEach(function(denom){
    var box = document.createElement("div");
    box.className = "vital-box";
    box.style.minWidth = "70px";
    box.innerHTML = '<div class="lbl">'+denom.toUpperCase()+'</div>';
    var input = document.createElement("input");
    input.type="number"; input.value = c.currency[denom]||0;
    input.addEventListener("input", function(){ c.currency[denom]=Number(input.value)||0; save(); });
    box.appendChild(input);
    curRow.appendChild(box);
  });
  curCard.appendChild(curRow);
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

/* ---- Journal panel ---- */
function renderJournalPanel(c){
  var panel = document.createElement("div");
  var card = makeCard("Journal", "notes, session recaps, plans — kept only on this device");

  var addBtn = document.createElement("button");
  addBtn.className = "btn small primary"; addBtn.style.marginBottom="12px";
  addBtn.textContent = "+ New entry";
  addBtn.addEventListener("click", function(){
    c.notes.unshift({ts: nowStamp(), text:""});
    save(); renderAll();
  });
  card.appendChild(addBtn);

  (c.notes||[]).forEach(function(entry, idx){
    var e = document.createElement("div");
    e.className = "journal-entry";
    var tsRow = document.createElement("div");
    tsRow.style.display="flex"; tsRow.style.justifyContent="space-between"; tsRow.style.alignItems="center";
    var ts = document.createElement("span"); ts.className="ts"; ts.textContent = entry.ts;
    var rmBtn = document.createElement("button"); rmBtn.className="rm-btn"; rmBtn.textContent="✕";
    rmBtn.addEventListener("click", function(){ c.notes.splice(idx,1); save(); renderAll(); });
    tsRow.appendChild(ts); tsRow.appendChild(rmBtn);
    e.appendChild(tsRow);
    var ta = document.createElement("textarea");
    ta.value = entry.text||"";
    ta.placeholder = "Write here…";
    ta.addEventListener("input", function(){ entry.text = ta.value; save(); });
    e.appendChild(ta);
    card.appendChild(e);
  });
  if((c.notes||[]).length===0){
    var p = document.createElement("p");
    p.style.fontSize="13px"; p.style.color="var(--text-on-parch-dim)";
    p.textContent = "No entries yet.";
    card.appendChild(p);
  }
  panel.appendChild(card);
  return panel;
}

/* ---------------- Character Creation Wizard ---------------- */
var WIZARD_STEP_IDS = ["class","race","background","abilities","skills","equipment","spells","review"];
var wizardState = null;

function currentClassInfo(){ return wizardState && CLASSES_INFO[wizardState.classId]; }

function isStepApplicable(id){
  if(id==="spells"){
    var info = currentClassInfo();
    return !!(info && info.spellcaster);
  }
  return true;
}

function wizardStepTitle(id){
  return {
    class:"Choose a Class", race:"Choose a Race", background:"Choose a Background",
    abilities:"Ability Scores", skills:"Skills & Proficiencies", equipment:"Starting Equipment",
    spells:"Spells", review:"Review & Finish"
  }[id];
}

function abilityFullName(key){
  var found = ABILITIES.find(function(a){ return a[0]===key; });
  return found ? found[1] : key;
}

function wizardStepIndex(){ return WIZARD_STEP_IDS.indexOf(wizardState.step); }

function goStep(delta){
  var idx = wizardStepIndex();
  var next = idx;
  do{
    next += delta;
  } while(next>=0 && next<WIZARD_STEP_IDS.length && !isStepApplicable(WIZARD_STEP_IDS[next]));
  if(next<0 || next>=WIZARD_STEP_IDS.length) return;
  wizardState.step = WIZARD_STEP_IDS[next];
  renderWizard();
}

function validateStep(id){
  var info = currentClassInfo();
  if(id==="class") return (wizardState.classId && info && info.available) ? null : "Pick an available class to continue.";
  if(id==="race") return wizardState.race ? null : "Pick a race to continue.";
  if(id==="background") return wizardState.background ? null : "Pick a background to continue.";
  if(id==="abilities"){
    if(!wizardState.abilityMethod) return "Pick a method for generating ability scores.";
    if(wizardState.abilityMethod!=="pointbuy"){
      var allAssigned = ABILITIES.every(function(a){ return wizardState.assignIdx[a[0]]!=null; });
      if(!allAssigned) return "Assign a score to every ability.";
    }
    return null;
  }
  if(id==="skills"){
    return wizardState.skillChoices.length===info.skillChoices.count ? null : "Choose "+info.skillChoices.count+" skills.";
  }
  if(id==="equipment"){
    var ok = info.equipment.choiceGroups.every(function(g,gi){ return wizardState.equipment[gi]!=null; });
    return ok ? null : "Make a choice for each equipment option.";
  }
  return null;
}

function openWizard(){
  wizardState = {
    step:"class", name:"", classId:null, race:"", background:"",
    abilityMethod:null,
    abilities:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    assignIdx:{str:null,dex:null,con:null,int:null,wis:null,cha:null},
    pointBuy:{str:8,dex:8,con:8,int:8,wis:8,cha:8},
    rolledPool:null,
    skillChoices:[],
    equipment:{}
  };
  closeSidebarMobile();
  document.getElementById("wizard-overlay").classList.add("open");
  renderWizard();
}

function requestCloseWizard(){
  if(!wizardState || !wizardState.classId){
    document.getElementById("wizard-overlay").classList.remove("open");
    return;
  }
  confirmDialog("Discard this character?", "Your in-progress choices will be lost.", function(){
    document.getElementById("wizard-overlay").classList.remove("open");
  });
}

function setAbilityMethod(method){
  wizardState.abilityMethod = method;
  wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
  wizardState.pointBuy = {str:8,dex:8,con:8,int:8,wis:8,cha:8};
  wizardState.rolledPool = null;
  wizardState.abilities = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
  renderWizard();
}

function rollAbilityScore(){
  var rolls = [];
  for(var i=0;i<4;i++) rolls.push(1+Math.floor(Math.random()*6));
  rolls.sort(function(a,b){ return b-a; });
  return rolls[0]+rolls[1]+rolls[2];
}
function rollSixAbilityScores(){
  var arr = [];
  for(var i=0;i<6;i++) arr.push(rollAbilityScore());
  return arr;
}

function syncAbilitiesFromAssignment(pool){
  ABILITIES.forEach(function(a){
    var idx = wizardState.assignIdx[a[0]];
    wizardState.abilities[a[0]] = idx!=null ? pool[idx] : 10;
  });
}

function wizardAssignAbilities(container, pool){
  var grid = ce("div","abilities-grid");
  ABILITIES.forEach(function(a){
    var key = a[0];
    var usedIdx = wizardState.assignIdx[key];
    var box = ce("div","ability-box");
    box.style.cursor = "default";
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div>';
    var sel = document.createElement("select");
    sel.style.cssText = "border:1px solid var(--rule);border-radius:4px;background:var(--field-bg);color:var(--text-on-parch);padding:2px;font-size:12.5px;";
    var blank = document.createElement("option"); blank.value=""; blank.textContent="—";
    sel.appendChild(blank);
    pool.forEach(function(val, pi){
      var takenBy = Object.keys(wizardState.assignIdx).find(function(k2){ return wizardState.assignIdx[k2]===pi; });
      if(takenBy && takenBy!==key) return;
      var o = document.createElement("option");
      o.value = pi; o.textContent = val;
      if(usedIdx===pi) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function(){
      wizardState.assignIdx[key] = sel.value==="" ? null : Number(sel.value);
      syncAbilitiesFromAssignment(pool);
      renderWizard();
    });
    box.appendChild(sel);
    var modDiv = document.createElement("div"); modDiv.className="mod";
    modDiv.textContent = usedIdx!=null ? fmtMod(mod(pool[usedIdx])) : "—";
    box.appendChild(modDiv);
    grid.appendChild(box);
  });
  container.appendChild(grid);
}

function wizardPointBuyUI(container){
  var totalPoints = 27;
  var spent = ABILITIES.reduce(function(sum,a){ return sum + POINT_BUY_COSTS[wizardState.pointBuy[a[0]]]; },0);
  var remaining = totalPoints - spent;
  var remainP = document.createElement("p");
  remainP.style.cssText = "font-size:13px;margin-bottom:10px;color:var(--text-on-parch-dim);";
  remainP.innerHTML = "Points remaining: <strong style='color:var(--text-on-parch)'>"+remaining+"</strong> / "+totalPoints;
  container.appendChild(remainP);

  var grid = ce("div","abilities-grid");
  ABILITIES.forEach(function(a){
    var key = a[0];
    var score = wizardState.pointBuy[key];
    var box = ce("div","ability-box");
    box.style.cursor = "default";
    box.innerHTML = '<div class="lbl">'+a[1].slice(0,3).toUpperCase()+'</div><div class="mod">'+fmtMod(mod(score))+'</div>';
    var row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;margin-top:4px;";
    var minus = document.createElement("button");
    minus.type="button"; minus.className="btn small"; minus.textContent="−";
    minus.disabled = score<=8;
    minus.addEventListener("click", function(){
      wizardState.pointBuy[key] = score-1;
      wizardState.abilities[key] = score-1;
      renderWizard();
    });
    var val = document.createElement("span");
    val.textContent = score;
    val.style.cssText = "min-width:20px;display:inline-block;font-family:var(--serif);font-size:16px;";
    var plus = document.createElement("button");
    plus.type="button"; plus.className="btn small"; plus.textContent="+";
    var nextCost = POINT_BUY_COSTS[score+1];
    plus.disabled = score>=15 || nextCost===undefined || (nextCost-POINT_BUY_COSTS[score]) > remaining;
    plus.addEventListener("click", function(){
      wizardState.pointBuy[key] = score+1;
      wizardState.abilities[key] = score+1;
      renderWizard();
    });
    row.appendChild(minus); row.appendChild(val); row.appendChild(plus);
    box.appendChild(row);
    grid.appendChild(box);
  });
  container.appendChild(grid);
}

function raceExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Race affects your ability score bonuses and grants special traits like darkvision or resistances. Pick one to see what it does.";
  return "<b>"+escapeHtml(name)+":</b> "+(RACE_TRAITS[name] || RACE_TRAIT_FALLBACK);
}

function backgroundExplainHtml(name){
  if(!name) return "<b>Why this matters:</b> Your background grants two skill proficiencies (and usually a tool or language) that reflect your life before adventuring.";
  var info = BACKGROUND_INFO[name];
  return "<b>"+escapeHtml(name)+":</b> "+(info ? info.blurb : BACKGROUND_INFO_FALLBACK);
}

function wizardStepClass(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Class</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class is the biggest driver of how your character plays — it sets your main ability score, hit points, and what you're good at in and out of combat.";
  card.appendChild(explain);

  var grid = ce("div","class-pick-grid");
  CLASS_LIST.forEach(function(name){
    var info = CLASSES_INFO[name];
    var box = ce("div","class-pick-card"+(info.available?"":" disabled"));
    if(wizardState.classId===name) box.classList.add("selected");
    box.innerHTML = "<h4>"+escapeHtml(name)+"</h4><p>"+escapeHtml(info.blurb)+"</p>"+(info.available?"":"<span class='soon'>Coming soon</span>");
    if(info.available){
      box.addEventListener("click", function(){ wizardState.classId = name; renderWizard(); });
    }
    grid.appendChild(box);
  });
  card.appendChild(grid);
  container.appendChild(card);
}

function wizardStepRace(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Race</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = raceExplainHtml(wizardState.race);
  card.appendChild(explain);

  var dd = dropdownField("Race", "race", RACES, wizardState, function(){
    explain.innerHTML = raceExplainHtml(wizardState.race);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

function wizardStepBackground(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Background</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = backgroundExplainHtml(wizardState.background);
  card.appendChild(explain);

  var dd = dropdownField("Background", "background", BACKGROUNDS, wizardState, function(){
    explain.innerHTML = backgroundExplainHtml(wizardState.background);
  });
  dd.style.maxWidth = "320px";
  card.appendChild(dd);
  container.appendChild(card);
}

function wizardStepAbilities(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Ability Scores</span></h3>";
  var info = currentClassInfo();
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> These six scores drive almost everything you roll. As a "+escapeHtml(wizardState.classId)+", <b>"+abilityFullName(info.primaryAbility)+"</b> matters most — prioritize it if you can.";
  card.appendChild(explain);

  var methodRow = ce("div","wiz-method-row");
  [
    ["array","Standard Array","Fixed set: 15, 14, 13, 12, 10, 8 — simplest, balanced."],
    ["pointbuy","Point Buy","Spend 27 points to customize scores from 8–15 — most flexible."],
    ["roll","Roll","Roll 4d6 (drop lowest) six times — random, can be stronger or weaker."]
  ].forEach(function(m){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn wiz-method-btn"+(wizardState.abilityMethod===m[0]?" primary":"");
    btn.innerHTML = "<strong>"+m[1]+"</strong><br><span style='font-size:11px;opacity:.8;'>"+m[2]+"</span>";
    btn.addEventListener("click", function(){ setAbilityMethod(m[0]); });
    methodRow.appendChild(btn);
  });
  card.appendChild(methodRow);

  if(wizardState.abilityMethod==="array"){
    wizardAssignAbilities(card, [15,14,13,12,10,8]);
  } else if(wizardState.abilityMethod==="roll"){
    if(!wizardState.rolledPool){
      var rollBtn = document.createElement("button");
      rollBtn.type="button"; rollBtn.className="btn primary small"; rollBtn.textContent="🎲 Roll 6 scores";
      rollBtn.addEventListener("click", function(){
        wizardState.rolledPool = rollSixAbilityScores();
        wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
        renderWizard();
      });
      card.appendChild(rollBtn);
    } else {
      var poolP = document.createElement("p");
      poolP.style.cssText = "font-size:13px;margin:10px 0;";
      poolP.textContent = "Rolled: "+wizardState.rolledPool.join(", ");
      card.appendChild(poolP);
      wizardAssignAbilities(card, wizardState.rolledPool);
      var reroll = document.createElement("button");
      reroll.type="button"; reroll.className="btn small ghost"; reroll.style.marginTop="10px"; reroll.textContent="Reroll";
      reroll.addEventListener("click", function(){
        wizardState.rolledPool = rollSixAbilityScores();
        wizardState.assignIdx = {str:null,dex:null,con:null,int:null,wis:null,cha:null};
        renderWizard();
      });
      card.appendChild(reroll);
    }
  } else if(wizardState.abilityMethod==="pointbuy"){
    wizardPointBuyUI(card);
  }

  container.appendChild(card);
}

function wizardStepSkills(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Skills & Proficiencies</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Skills add your proficiency bonus to certain checks. Your class and background each grant some — you don't pick from all 18, just the ones you're allowed.";
  card.appendChild(explain);

  var bgInfo = BACKGROUND_INFO[wizardState.background];
  if(bgInfo && bgInfo.skills && bgInfo.skills.length){
    var bgP = document.createElement("p");
    bgP.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);margin-bottom:12px;";
    bgP.innerHTML = "From your <b>"+escapeHtml(wizardState.background)+"</b> background: "+bgInfo.skills.join(", ")+" (automatic).";
    card.appendChild(bgP);
  }

  var info = currentClassInfo();
  var label = document.createElement("p");
  label.style.cssText = "font-size:13px;margin-bottom:8px;";
  label.textContent = "Choose "+info.skillChoices.count+" from your class list:";
  card.appendChild(label);

  var rows = ce("div","list-rows");
  info.skillChoices.options.forEach(function(sk){
    var row = ce("div","list-row");
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk";
    var checked = wizardState.skillChoices.indexOf(sk)!==-1;
    cb.checked = checked;
    cb.disabled = !checked && wizardState.skillChoices.length>=info.skillChoices.count;
    cb.addEventListener("change", function(){
      if(cb.checked){
        if(wizardState.skillChoices.length>=info.skillChoices.count){ cb.checked=false; return; }
        wizardState.skillChoices.push(sk);
      } else {
        wizardState.skillChoices = wizardState.skillChoices.filter(function(x){ return x!==sk; });
      }
      renderWizard();
    });
    var name = document.createElement("span"); name.className="row-name"; name.textContent = sk;
    row.appendChild(cb); row.appendChild(name);
    rows.appendChild(row);
  });
  card.appendChild(rows);
  container.appendChild(card);
}

function wizardStepEquipment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Starting Equipment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class gives you a choice of starting gear instead of buying everything piece by piece — pick what fits how you want to fight.";
  card.appendChild(explain);

  var info = currentClassInfo();
  info.equipment.choiceGroups.forEach(function(group, gi){
    var groupTitle = document.createElement("p");
    groupTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    groupTitle.textContent = "Choice "+String.fromCharCode(65+gi);
    card.appendChild(groupTitle);
    group.options.forEach(function(opt){
      var row = ce("div","wiz-equip-option");
      if(wizardState.equipment[gi]===opt.key) row.classList.add("selected");
      row.innerHTML = "<div><strong>"+escapeHtml(opt.label)+"</strong><br><span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(opt.detail||"")+"</span></div>";
      row.addEventListener("click", function(){
        wizardState.equipment[gi] = opt.key;
        renderWizard();
      });
      card.appendChild(row);
    });
  });

  if(info.equipment.fixed.length){
    var fixedTitle = document.createElement("p");
    fixedTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    fixedTitle.textContent = "Always included";
    card.appendChild(fixedTitle);
    var fixedP = document.createElement("p");
    fixedP.style.fontSize = "13px";
    fixedP.textContent = info.equipment.fixed.map(function(i){ return i.qty>1 ? i.qty+"× "+i.name : i.name; }).join(", ");
    card.appendChild(fixedP);
  }

  container.appendChild(card);
}

function wizardStepSpells(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Spells</span></h3><p style='font-size:13px;color:var(--text-on-parch-dim);'>Spellcasting setup for this class hasn't been built yet.</p>";
  container.appendChild(card);
}

function wizardStepReview(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Review & Finish</span></h3>";

  var nameWrap = document.createElement("div");
  nameWrap.style.cssText = "margin-bottom:16px;";
  nameWrap.innerHTML = "<label style='font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-on-parch-dim);display:block;margin-bottom:3px;'>Character name</label>";
  var nameInput = document.createElement("input");
  nameInput.value = wizardState.name; nameInput.placeholder = "New Character";
  nameInput.style.cssText = "width:100%;max-width:320px;background:transparent;border:none;border-bottom:1px solid var(--rule);color:var(--text-on-parch);font-family:var(--serif);font-size:20px;padding:4px 0;";
  nameInput.addEventListener("input", function(){ wizardState.name = nameInput.value; });
  nameWrap.appendChild(nameInput);
  card.appendChild(nameWrap);

  var info = currentClassInfo();
  var conMod = mod(wizardState.abilities.con), dexMod = mod(wizardState.abilities.dex);
  var hp = HIT_DICE_BY_CLASS[wizardState.classId] + conMod;
  var ac = 10 + dexMod + conMod;

  var rows = ce("div","list-rows");
  function row(label, val){
    var r = ce("div","list-row");
    var l = document.createElement("span"); l.className="row-name"; l.textContent = label;
    var v = document.createElement("span"); v.style.fontWeight="600"; v.textContent = val;
    r.appendChild(l); r.appendChild(v);
    rows.appendChild(r);
  }
  row("Class", wizardState.classId+" (level 1)");
  row("Race", wizardState.race);
  row("Background", wizardState.background);
  row("Ability scores", ABILITIES.map(function(a){ return a[1].slice(0,3).toUpperCase()+" "+wizardState.abilities[a[0]]; }).join("  "));
  row("Hit points", hp+" (d"+HIT_DICE_BY_CLASS[wizardState.classId]+" + CON "+fmtMod(conMod)+")");
  row("Armor Class", ac+" (Unarmored Defense: 10 + DEX + CON)");
  row("Saving throws", info.savingThrows.map(function(k){ return k.toUpperCase(); }).join(", "));
  row("Skills", wizardState.skillChoices.concat((BACKGROUND_INFO[wizardState.background]||{}).skills||[]).join(", ") || "—");
  card.appendChild(rows);

  var featTitle = document.createElement("p");
  featTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
  featTitle.textContent = "Level 1 features";
  card.appendChild(featTitle);
  info.features.forEach(function(f){
    var p = document.createElement("p");
    p.style.cssText = "font-size:13px;margin:0 0 8px;";
    p.innerHTML = "<strong>"+escapeHtml(f.name)+":</strong> "+escapeHtml(f.text);
    card.appendChild(p);
  });

  container.appendChild(card);
}

function buildEquipmentList(info, chosenKeys){
  var items = [];
  info.equipment.choiceGroups.forEach(function(group, gi){
    var opt = group.options.find(function(o){ return o.key===chosenKeys[gi]; });
    if(opt){
      opt.items.forEach(function(it){
        items.push({name:it.name, qty:it.qty, weight:it.weight, equipped:true, notes:it.notes||""});
      });
    }
  });
  info.equipment.fixed.forEach(function(it){
    items.push({name:it.name, qty:it.qty, weight:it.weight, equipped:false, notes:it.notes||""});
  });
  return items;
}

function finishWizard(){
  var w = wizardState;
  var info = CLASSES_INFO[w.classId];
  var c = newCharacter(w.name || "New Character");
  c.race = w.race;
  c.background = w.background;
  c.classes = [{name:w.classId, subclass:"", level:1}];
  c.abilities = {str:w.abilities.str, dex:w.abilities.dex, con:w.abilities.con, int:w.abilities.int, wis:w.abilities.wis, cha:w.abilities.cha};
  info.savingThrows.forEach(function(k){ c.saveProfs[k] = true; });
  w.skillChoices.forEach(function(sk){ c.skillProfs[sk] = {prof:true, expertise:false}; });
  var bgInfo = BACKGROUND_INFO[w.background];
  if(bgInfo && bgInfo.skills){
    bgInfo.skills.forEach(function(sk){
      var entry = c.skillProfs[sk] || {prof:false, expertise:false};
      entry.prof = true;
      c.skillProfs[sk] = entry;
    });
  }
  c.features = info.features.map(function(f){ return f.name+": "+f.text; });
  var conMod = mod(c.abilities.con), dexMod = mod(c.abilities.dex);
  c.hp.max = HIT_DICE_BY_CLASS[w.classId] + conMod;
  c.hp.current = c.hp.max;
  c.ac = 10 + dexMod + conMod;
  c.inventory = buildEquipmentList(info, w.equipment);

  state.characters.push(c);
  state.activeId = c.id;
  state.activeTab = "vitals";
  save();
  document.getElementById("wizard-overlay").classList.remove("open");
  renderAll();
}

function renderWizard(){
  var overlay = document.getElementById("wizard-overlay");
  overlay.innerHTML = "";

  var header = ce("div"); header.id = "wizard-header";
  var h2 = document.createElement("h2"); h2.textContent = "New Character — "+wizardStepTitle(wizardState.step);
  var closeBtn = document.createElement("button"); closeBtn.className = "btn small ghost"; closeBtn.textContent = "✕ Cancel";
  closeBtn.addEventListener("click", requestCloseWizard);
  header.appendChild(h2); header.appendChild(closeBtn);
  overlay.appendChild(header);

  var progress = ce("div"); progress.id = "wizard-progress";
  var applicableSteps = WIZARD_STEP_IDS.filter(isStepApplicable);
  var curPos = applicableSteps.indexOf(wizardState.step);
  applicableSteps.forEach(function(id, i){
    var dot = ce("div","wiz-dot");
    if(i<curPos) dot.classList.add("done");
    if(i===curPos) dot.classList.add("current");
    progress.appendChild(dot);
  });
  overlay.appendChild(progress);

  var body = ce("div"); body.id = "wizard-body";
  var inner = ce("div"); inner.id = "wizard-body-inner";
  body.appendChild(inner);
  overlay.appendChild(body);

  var renderers = {
    class: wizardStepClass, race: wizardStepRace, background: wizardStepBackground,
    abilities: wizardStepAbilities, skills: wizardStepSkills, equipment: wizardStepEquipment,
    spells: wizardStepSpells, review: wizardStepReview
  };
  renderers[wizardState.step](inner);

  var footer = ce("div"); footer.id = "wizard-footer";
  var backBtn = document.createElement("button");
  backBtn.className = "btn ghost"; backBtn.textContent = "← Back";
  backBtn.disabled = wizardStepIndex()===0;
  backBtn.addEventListener("click", function(){ goStep(-1); });
  var nextBtn = document.createElement("button");
  nextBtn.className = "btn primary";
  nextBtn.textContent = wizardState.step==="review" ? "Create Character" : "Next →";
  nextBtn.addEventListener("click", function(){
    var err = validateStep(wizardState.step);
    if(err){ alert(err); return; }
    if(wizardState.step==="review"){ finishWizard(); return; }
    goStep(1);
  });
  footer.appendChild(backBtn); footer.appendChild(nextBtn);
  overlay.appendChild(footer);
}

/* ---------------- Dice tray ---------------- */
var advMode = "none"; // none | adv | dis

function performRoll(die, qty, modifier, adv, label){
  var results = [];
  var rollCount = qty;
  var detailParts = [];
  var finalTotal = 0;

  if(die===20 && adv!=="none" && qty===1){
    var r1 = Math.floor(Math.random()*20)+1;
    var r2 = Math.floor(Math.random()*20)+1;
    var chosen = adv==="adv" ? Math.max(r1,r2) : Math.min(r1,r2);
    results = [r1,r2];
    finalTotal = chosen + modifier;
    detailParts.push("rolled ["+r1+", "+r2+"] ("+(adv==="adv"?"advantage":"disadvantage")+"), took "+chosen);
  } else {
    var sum = 0;
    for(var i=0;i<rollCount;i++){
      var r = Math.floor(Math.random()*die)+1;
      results.push(r);
      sum += r;
    }
    finalTotal = sum + modifier;
    detailParts.push("rolled ["+results.join(", ")+"]"+(modifier?" "+fmtMod(modifier):""));
  }

  document.getElementById("roll-result").textContent = finalTotal;
  document.getElementById("roll-detail").textContent = (label?label+" — ":"")+detailParts.join(" ");
  logRoll(label || ("d"+die), detailParts.join(" ")+" = "+finalTotal);
  openDiceTray();
}

function logRoll(label, detail){
  var c = getActive();
  var entry = {ts: nowStamp(), label: label, detail: detail};
  if(c){
    c.rollLog = c.rollLog || [];
    c.rollLog.unshift(entry);
    c.rollLog = c.rollLog.slice(0,20);
    save();
  }
  renderRollLog();
}

function renderRollLog(){
  var c = getActive();
  var el = document.getElementById("roll-log");
  el.innerHTML = "";
  var logArr = c && c.rollLog ? c.rollLog : [];
  logArr.forEach(function(entry){
    var d = document.createElement("div");
    d.innerHTML = '<span class="rl-label">'+escapeHtml(entry.label)+'</span> — '+escapeHtml(entry.detail);
    el.appendChild(d);
  });
}

function openDiceTray(){
  document.getElementById("dice-tray").classList.add("open");
}
function toggleDiceTray(){
  document.getElementById("dice-tray").classList.toggle("open");
}

function setupDiceTray(){
  document.getElementById("dice-fab").addEventListener("click", toggleDiceTray);
  document.querySelectorAll(".die-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      var die = Number(btn.getAttribute("data-die"));
      var qty = clamp(Number(document.getElementById("dice-qty").value)||1,1,20);
      var modv = Number(document.getElementById("dice-mod").value)||0;
      performRoll(die, qty, modv, die===20 ? advMode : "none", null);
    });
  });
  var advBtns = {
    none: document.getElementById("adv-normal"),
    adv: document.getElementById("adv-adv"),
    dis: document.getElementById("adv-dis")
  };
  Object.keys(advBtns).forEach(function(k){
    advBtns[k].addEventListener("click", function(){
      advMode = k;
      Object.keys(advBtns).forEach(function(kk){ advBtns[kk].classList.toggle("on", kk===k); });
    });
  });
}

/* ---------------- Sidebar mobile toggle ---------------- */
function closeSidebarMobile(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
}
function setupMobileNav(){
  document.getElementById("hamburger").addEventListener("click", function(){
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("scrim").classList.add("show");
  });
  document.getElementById("scrim").addEventListener("click", closeSidebarMobile);
}

/* ---------------- Confirm modal ---------------- */
function confirmDialog(title, body, onConfirm){
  var modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  modal.classList.add("open");
  function cleanup(){
    modal.classList.remove("open");
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
  }
  var okBtn = document.getElementById("confirm-ok");
  var cancelBtn = document.getElementById("confirm-cancel");
  function onOk(){ cleanup(); onConfirm(); }
  function onCancel(){ cleanup(); }
  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
}

/* ---------------- Top-level actions ---------------- */
function setupTopLevel(){
  document.getElementById("new-char-btn").addEventListener("click", openWizard);

  document.getElementById("export-btn").addEventListener("click", function(){
    var blob = new Blob([JSON.stringify(state.characters, null, 2)], {type:"application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ragnars-den-backup-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  });

  document.getElementById("import-btn").addEventListener("click", function(){
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", function(e){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var data = JSON.parse(reader.result);
        if(!Array.isArray(data)) throw new Error("Invalid format");
        confirmDialog(
          "Import backup?",
          "This will add "+data.length+" character(s) from the backup file to your current vault. Existing characters are kept.",
          function(){
            data.forEach(function(c){
              c.id = uid(); // avoid collisions
              ensureShape(c);
              state.characters.push(c);
            });
            save();
            renderAll();
          }
        );
      }catch(err){
        alert("That file doesn't look like a valid Ragnar's Den backup.");
      }
      document.getElementById("import-file").value = "";
    };
    reader.readAsText(file);
  });
}

/* ---------------- Delete character ---------------- */
/* Rendered inline at the end of the identity block's classes row. */
function makeDeleteButton(c){
  var btn = document.createElement("button");
  btn.className = "btn small danger";
  btn.textContent = "Delete character";
  btn.addEventListener("click", function(){
    confirmDialog("Delete "+(c.name||"this character")+"?", "This cannot be undone. Consider exporting a backup first.", function(){
      state.characters = state.characters.filter(function(x){ return x.id!==c.id; });
      state.activeId = state.characters.length ? state.characters[0].id : null;
      if(state.activeId) state.activeTab = "vitals";
      save();
      renderAll();
    });
  });
  return btn;
}

/* ---------------- Init ---------------- */
function init(){
  load();
  state.characters.forEach(ensureShape);
  if(state.characters.length && !state.activeId){
    state.activeId = state.characters[0].id;
  }
  setupTopLevel();
  setupDiceTray();
  setupMobileNav();
  renderAll();

  if("serviceWorker" in navigator){
    // When an updated service worker takes control, reload once so the
    // page picks up the fresh HTML/CSS/JS instead of the previous cache.
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if(hadController){ hadController = false; window.location.reload(); }
    });
    navigator.serviceWorker.register("sw.js").catch(function(){ /* offline-first, fine if this fails */ });
  }
}

document.addEventListener("DOMContentLoaded", init);
})();