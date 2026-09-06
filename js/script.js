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
}

function field(el, tag, cls, txt){}

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
  function simpleField(labelTxt, key, placeholder){
    var f = document.createElement("div");
    f.className = "field";
    var l = document.createElement("label"); l.textContent = labelTxt;
    var i = document.createElement("input"); i.value = c[key]||""; i.placeholder = placeholder||"";
    i.addEventListener("input", function(){ c[key]=i.value; save(); if(key==="race") renderSidebar(); });
    f.appendChild(l); f.appendChild(i);
    return f;
  }
  subRow.appendChild(simpleField("Race","race","e.g. Half-Elf"));
  subRow.appendChild(simpleField("Background","background","e.g. Sage"));
  subRow.appendChild(simpleField("Alignment","alignment","e.g. Neutral Good"));

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
  sel.style.padding="4px"; sel.style.border="1px solid var(--rule)"; sel.style.borderRadius="4px"; sel.style.background="#fff8ea";
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
  document.getElementById("new-char-btn").addEventListener("click", function(){
    var c = newCharacter("New Character");
    state.characters.push(c);
    state.activeId = c.id;
    state.activeTab = "vitals";
    save();
    renderAll();
    closeSidebarMobile();
  });

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

/* ---------------- Delete character (long-press-ish via dblclick on mobile is unreliable; use a button in sheet) ---------------- */
/* Adds a small delete affordance inside the identity card area via a persistent corner button */
function addDeleteAffordance(){
  var wrap = document.createElement("div");
  wrap.style.position = "absolute";
  wrap.style.top = "12px";
  wrap.style.right = "14px";
  var btn = document.createElement("button");
  btn.className = "btn small danger";
  btn.textContent = "Delete character";
  btn.addEventListener("click", function(){
    var c = getActive();
    if(!c) return;
    confirmDialog("Delete "+c.name+"?", "This cannot be undone. Consider exporting a backup first.", function(){
      state.characters = state.characters.filter(function(x){ return x.id!==c.id; });
      state.activeId = state.characters.length ? state.characters[0].id : null;
      save();
      renderAll();
    });
  });
  wrap.appendChild(btn);
  return wrap;
}

var _origRenderAll = renderAll;
renderAll = function(){
  _origRenderAll();
  var c = getActive();
  if(c){
    var identity = document.querySelector(".identity");
    if(identity){
      identity.style.position = "relative";
      identity.appendChild(addDeleteAffordance());
    }
  }
  renderRollLog();
};

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
    navigator.serviceWorker.register("sw.js").catch(function(){ /* offline-first, fine if this fails */ });
  }
}

document.addEventListener("DOMContentLoaded", init);
})();