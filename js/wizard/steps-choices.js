/* ---------------- Creation wizard: class features, languages, equipment ----------------
   The class's level-1 choices (subclass, fighting style, expertise and
   the like), the Languages step and the starting equipment. */
import { SKILLS } from "../data/abilities-skills.js";
import { FIGHTING_STYLES } from "../data/classes.js";
import { escapeHtml, ce, autoEquipLoadout, isProficientWithWeapon } from "../core/helpers.js";
import { WEAPON_DATA, WEAPON_GROUPS } from "../data/weapons.js";
import { themedPicker, resetThemedPickers } from "../ui/themed-picker.js";
import { wizardVariantOffers, currentClassInfo, wizardState, renderWizard, subclassGrants, equipmentOptionAvailable, languagePlan, raceChoiceDef, wizardBackgroundFeatPicks, wizardSpellChoices, wizardExpandedSpells, wizardBackgroundSkills, wizardClassGrants, wizardPickSlots, wizardPickContext, wizardRaceSkills } from "./wizard-core.js";
import { renderClassPicks, renderVariantOptions } from "../ui/class-picks.js";
import { grantHasChoices } from "../core/class-picks.js";
import { renderSpellChoiceOptions } from "../ui/spell-choice.js";
import { renderStyleOptions, renderStylePicks } from "../ui/style-picks.js";
import { styleNeedsPicks } from "../core/fighting-styles.js";
import { languagePickerGroups } from "../data/languages.js";
import { SUBCLASSES } from "../data/progression.js";

/* What a Rogue-style expertise pick can target: every skill the new
   character is proficient in (class picks + background) plus any tools
   the choice allows. */
export function expertiseOptions(choice){
  var bgSkills = wizardBackgroundSkills();
  var skills = wizardState.skillChoices.concat(bgSkills.filter(function(sk){ return wizardState.skillChoices.indexOf(sk)===-1; }));
  // Plus what the race gives and its Race Traits picks (an elf's
  // Perception, a Variant Human's skill).
  wizardRaceSkills().forEach(function(sk){ if(skills.indexOf(sk)===-1) skills.push(sk); });
  var def = raceChoiceDef();
  // And skills its feat granted (Skilled, Skill Expert).
  var fp = def && def.feat && wizardState.raceChoices.featPicks;
  if(fp) (fp.skills||[]).forEach(function(sk){ if(sk && SKILLS.some(function(x){ return x[0]===sk; }) && skills.indexOf(sk)===-1) skills.push(sk); });
  // And the background's or campaign's feat (a Dragonlance character's Skilled).
  var bp = wizardBackgroundFeatPicks();
  if(bp) (bp.skills||[]).forEach(function(sk){ if(sk && SKILLS.some(function(x){ return x[0]===sk; }) && skills.indexOf(sk)===-1) skills.push(sk); });
  return skills.concat(choice.tools||[]);
}

var variantsJustToggled = false; // Tasha's switch was just flipped on this step: animate the fold

export function wizardStepChoices(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Class Features</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Some of your level 1 class features come with a choice. These shape what your "+escapeHtml(wizardState.classId)+" is best at.";
  card.appendChild(explain);

  var info = currentClassInfo();
  (info.choices||[]).forEach(function(ch){
    var title = document.createElement("p");
    title.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    title.textContent = ch.label;
    card.appendChild(title);
    if(ch.help){
      var help = document.createElement("p");
      help.style.cssText = "font-size:13px;margin:0 0 10px;";
      help.textContent = ch.help;
      card.appendChild(help);
    }
    if(ch.kind==="subclass") choiceSubclass(card, ch);
    else if(ch.kind==="fightingStyle") choiceFightingStyle(card, ch);
    else if(ch.kind==="listPick") choiceListPick(card, ch);
    else if(ch.kind==="expertise") choiceExpertise(card, ch);
  });
  // What the level-1 features let you choose: a ranger's favored enemy
  // and terrain, Knowledge Domain's skills and languages, an Order or
  // Peace cleric's skill, a Draconic sorcerer's dragon.
  var grants = wizardClassGrants().filter(function(g){ return grantHasChoices(g.def); }), shown = [];
  function heading(text){
    var p = document.createElement("p");
    p.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    p.textContent = text;
    card.appendChild(p);
  }
  function picks(grant, opts){
    shown.push(grant.key);
    card.appendChild(renderClassPicks(grant, wizardPickSlots(grant.key), wizardPickContext(grant), function(meta){
      var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
      if(!(meta && meta.typing)) renderWizard();
    }, "wiz:prof:"+grant.key, opts));
  }
  // A feature Tasha's can replace (a ranger's Favored Enemy by Favored
  // Foe, Natural Explorer by Deft Explorer) is a card followed by its
  // picks, the same with the switch off or on: turning it on slides the
  // Tasha's card open under each one, and the picks follow whichever is
  // taken.
  var offers = wizardVariantOffers();
  if(offers.length){
    var tasha = !!wizardState.tashaOptional;
    var was = variantsJustToggled ? !tasha : tasha;
    variantsJustToggled = false;
    card.appendChild(tashaSwitchRow("Turned on, you can take " + offers.map(function(v){ return v.name + " in place of " + v.replaces; }).join(" and ") + ".",
      function(){ variantsJustToggled = true; }));
    offers.forEach(function(v){
      heading(v.replaces);
      var picked = wizardState.classChoices.variants = wizardState.classChoices.variants || {};
      var on = tasha && picked[v.replaces]===v.name;
      // (The Player's Handbook feature as written, whichever is picked now.)
      var base = (info.features||[]).find(function(f){ return f.name===v.replaces; });
      card.appendChild(renderVariantOptions(v, base, on, function(take){
        if(take) picked[v.replaces] = v.name; else delete picked[v.replaces];
        renderWizard();
      }, tasha, was));
      var own = grants.find(function(g){ return !g.subclass && g.level===1 && g.feature===(on ? v.name : v.replaces); });
      if(own) picks(own, {noHelp: !on});
    });
  }
  grants.forEach(function(grant){
    if(shown.indexOf(grant.key)!==-1) return;
    heading(grant.name);
    picks(grant);
  });
  container.appendChild(card);
}

var PROF_LABELS = {heavy:"heavy armor", martial:"martial weapons"};

function choiceSubclass(card, ch){
  (SUBCLASSES[wizardState.classId]||[]).forEach(function(sub){
    var grants = ch.grants && ch.grants[sub.name] || {};
    var lvl1 = ((sub.features||{})[1]||[]).map(function(f){ return f.name; });
    var extras = [];
    if(grants.profs && grants.profs.length) extras.push("Proficient with "+grants.profs.map(function(p){ return PROF_LABELS[p]||p; }).join(" and "));
    if(grants.spells && grants.spells.length) extras.push("Always prepared: "+grants.spells.join(", "));
    var expanded = wizardExpandedSpells(sub.name);
    if(expanded.length) extras.push("Adds to your spell list: "+expanded.join(", "));
    var row = ce("div","wiz-equip-option");
    if(wizardState.classChoices[ch.id]===sub.name) row.classList.add("selected");
    row.innerHTML = "<div><strong>"+escapeHtml(sub.name)+"</strong><br>"+
      "<span style='font-size:12px'>"+escapeHtml(sub.blurb)+"</span><br>"+
      "<span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(["Level 1: "+lvl1.join(", ")].concat(extras).join(" · "))+"</span></div>";
    row.addEventListener("click", function(){
      wizardState.classChoices[ch.id] = sub.name;
      renderWizard();
    });
    card.appendChild(row);
  });

  // Spell picks the subclass asks for now: a genie kind, a Divine Soul's affinity.
  wizardSpellChoices().forEach(function(x){
    var t = document.createElement("p");
    t.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    t.textContent = x.feature+": "+x.choice.label;
    card.appendChild(t);
    card.appendChild(renderSpellChoiceOptions(x.choice, x.pick, function(v){
      wizardState.classChoices.spellChoices = Object.assign({}, wizardState.classChoices.spellChoices);
      wizardState.classChoices.spellChoices[x.choice.id] = v;
      renderWizard();
    }, wizardState.classId));
  });
}

/* Picks from a long grouped list (a monk's tool, a bard's three
   instruments, a ranger's favored enemy): dropdowns instead of a wall of
   option cards. With a `count` above 1 the value is an array, one entry
   per dropdown. */
function choiceListPick(card, ch){
  var count = ch.count || 1;
  var noun = ch.label.toLowerCase().replace(/s$/, "");
  if(count===1){
    card.appendChild(homebrewSelect({
      key:"pick:"+ch.id, groups:ch.groups, value:wizardState.classChoices[ch.id],
      placeholder:"Select one", noun:noun,
      onPick:function(v){ wizardState.classChoices[ch.id] = v; }
    }));
    return;
  }
  var picks = wizardState.classChoices[ch.id] = (wizardState.classChoices[ch.id] || []).slice(0, count);
  for(var i=0;i<count;i++){
    (function(i){
      card.appendChild(homebrewSelect({
        key:"pick:"+ch.id+":"+i, groups:ch.groups, value:picks[i],
        placeholder:"Select one", noun:noun,
        // Keep multi-picks distinct: what another dropdown holds is greyed out.
        takenReason:function(name){ return name!==picks[i] && picks.indexOf(name)!==-1 ? "picked" : ""; },
        onPick:function(v){ picks[i] = v; }
      }));
    })(i);
  }
}

/* A grouped, themed dropdown with the race picker's "Custom / homebrew…"
   option (see themedPicker). opts: key, groups, value, placeholder, noun,
   onPick(value), and optional takenReason(name) -> "known"/"picked" to
   grey an option out. Re-renders after a pick so sibling dropdowns grey
   out what's taken; typing a homebrew value doesn't (it would steal
   focus); validation checks the typed value like any other pick. */
function homebrewSelect(opts){
  var f = ce("div","field");
  f.style.maxWidth = "320px";
  f.style.marginBottom = "8px";
  f.appendChild(themedPicker({
    key:opts.key, groups:opts.groups, value:opts.value, placeholder:opts.placeholder,
    ariaLabel:opts.noun, homebrew:opts.noHomebrew ? undefined : {noun:opts.noun}, reasonFor:opts.takenReason,
    onPick:function(v, meta){
      opts.onPick(v);
      var errBox = document.getElementById("wizard-error");
      if(errBox) errBox.classList.remove("show");
      if(!meta.typing) renderWizard();
    }
  }));
  return f;
}

/* The "Tasha's optional class features" switch (it carries over to the
   new character's Optional rules). `what` says what turning it on adds
   here; `afterToggle` runs before the wizard redraws. */
export function tashaSwitchRow(what, afterToggle){
  var tasha = !!wizardState.tashaOptional;
  var row = ce("div","opt-rule wiz-tasha-switch");
  row.innerHTML = "<div class='opt-rule-text'><b>Tasha's optional class features</b><span>Your DM decides whether your table uses these. "+escapeHtml(what)+"</span></div>";
  var sw = document.createElement("button");
  sw.type = "button";
  sw.className = "switch" + (tasha ? " on" : "");
  sw.setAttribute("role", "switch");
  sw.setAttribute("aria-checked", tasha ? "true" : "false");
  sw.setAttribute("aria-label", "Use Tasha's optional class features");
  sw.innerHTML = "<span class='switch-knob'></span>";
  sw.addEventListener("click", function(){
    wizardState.tashaOptional = !tasha;
    if(afterToggle) afterToggle();
    renderWizard();
  });
  row.appendChild(sw);
  return row;
}

/* A level 1 Fighting Style. Tasha's optional styles are offered when the
   switch here is on (it carries over to the new character's Optional
   rules); a style with its own picks (Superior Technique's maneuver)
   shows them under the list, kept as classChoices[id + "Picks"]. */
function choiceFightingStyle(card, ch){
  var tasha = !!wizardState.tashaOptional;
  card.appendChild(tashaSwitchRow("Turned on, Tasha's extra fighting styles are listed too.", function(){
    // A Tasha's style picked before the switch went off no longer applies.
    var picked = FIGHTING_STYLES[wizardState.classChoices[ch.id]];
    if(!wizardState.tashaOptional && picked && picked.optional){ delete wizardState.classChoices[ch.id]; delete wizardState.classChoices[ch.id+"Picks"]; }
  }));
  var noChar = {features: []};
  card.appendChild(renderStyleOptions(noChar, ch.options, wizardState.classChoices[ch.id] || "", tasha, function(name){
    if(name!==wizardState.classChoices[ch.id]) wizardState.classChoices[ch.id+"Picks"] = {options: [], spells: []};
    wizardState.classChoices[ch.id] = name;
    renderWizard();
  }));
  var chosen = wizardState.classChoices[ch.id];
  if(chosen && styleNeedsPicks(chosen)){
    var picks = wizardState.classChoices[ch.id+"Picks"] = wizardState.classChoices[ch.id+"Picks"] || {options: [], spells: []};
    card.appendChild(renderStylePicks(chosen, picks, tasha, [], function(){
      var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
      renderWizard();
    }, "wiz:style"));
  }
}

function choiceExpertise(card, ch){
  var allowed = expertiseOptions(ch);
  // Drop picks that are no longer valid (the player went back and
  // changed their skills or background).
  var picked = (wizardState.classChoices[ch.id]||[]).filter(function(x){ return allowed.indexOf(x)!==-1; });
  wizardState.classChoices[ch.id] = picked;

  var rows = ce("div","list-rows");
  allowed.forEach(function(name){
    var row = ce("div","list-row wiz-pick-row");
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk";
    var checked = picked.indexOf(name)!==-1;
    cb.checked = checked;
    var full = !checked && picked.length>=ch.count;
    cb.disabled = full;
    if(full) row.classList.add("disabled");
    var label = document.createElement("span"); label.className="row-name"; label.textContent = name;
    row.appendChild(cb); row.appendChild(label);
    rows.appendChild(row);
    row.addEventListener("click", function(e){
      if(cb.disabled) return;
      if(e.target!==cb) cb.checked = !cb.checked;
      var cur = wizardState.classChoices[ch.id];
      if(cb.checked){
        if(cur.length>=ch.count){ cb.checked=false; return; }
        cur.push(name);
      } else {
        wizardState.classChoices[ch.id] = cur.filter(function(x){ return x!==name; });
      }
      renderWizard();
    });
  });
  card.appendChild(rows);
}

/* " (Life, Tempest or War Domain)": which subclass picks unlock it. */
function requiresHint(prof){
  var info = currentClassInfo();
  var ch = (info.choices||[]).find(function(x){ return x.kind==="subclass"; });
  if(!ch) return "";
  var names = Object.keys(ch.grants||{}).filter(function(n){ return (ch.grants[n].profs||[]).indexOf(prof)!==-1; });
  if(!names.length) return "";
  var short = names.map(function(n){ return n.replace(/ Domain$/, ""); });
  var list = short.length>1 ? short.slice(0,-1).join(", ")+" or "+short[short.length-1] : short[0];
  return " ("+list+(names[0].indexOf(" Domain")!==-1 ? " Domain" : "")+")";
}

/* Languages: what the character already knows, then one dropdown per
   free pick, grouped by where the pick comes from. Known languages and
   ones picked in another dropdown are greyed out. Secret languages
   (Druidic, Thieves' Cant) only come from classes, so they aren't offered. */
export function wizardStepLanguages(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Languages</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Languages let you talk to (and eavesdrop on) the people and creatures you meet. Your race gives you some automatically; your background and class can add more of your choice.";
  card.appendChild(explain);

  var plan = languagePlan();
  var picks = wizardState.languageChoices = wizardState.languageChoices.slice(0, plan.slots.length);
  // Drop picks you now know anyway (e.g. after changing race).
  for(var k=0;k<picks.length;k++){ if(plan.fixed.indexOf(picks[k])!==-1) picks[k] = ""; }

  var known = document.createElement("p");
  known.style.cssText = "font-size:13px;margin:0 0 12px;";
  known.innerHTML = "You already know: <b>"+escapeHtml(plan.fixed.join(", "))+"</b>.";
  card.appendChild(known);

  var lastSource = null;
  plan.slots.forEach(function(slot, i){
    if(slot.source!==lastSource){
      lastSource = slot.source;
      var count = plan.slots.filter(function(s){ return s.source===slot.source; }).length;
      var title = document.createElement("p");
      title.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
      title.textContent = "From "+slot.source+": "+count+" language"+(count>1?"s":"");
      card.appendChild(title);
      if(slot.help){
        var help = document.createElement("p");
        help.style.cssText = "font-size:13px;margin:0 0 8px;";
        help.textContent = slot.help;
        card.appendChild(help);
      }
    }
    card.appendChild(homebrewSelect({
      key:"lang:"+i, groups:(function(){
        if(slot.options) return {"": slot.options}; // a guild's short list
        return languagePickerGroups(!!slot.exotic);
      })(), value:picks[i],
      placeholder:slot.exotic ? "Select an exotic language" : "Select a language", noun:"language", noHomebrew:!!slot.options,
      // Greyed out and labelled so it's clear why it can't be picked.
      takenReason:function(name){
        if(plan.fixed.indexOf(name)!==-1) return "known";
        return name!==picks[i] && picks.indexOf(name)!==-1 ? "picked" : "";
      },
      onPick:function(v){ picks[i] = v; }
    }));
  });
  container.appendChild(card);
}

export function wizardStepEquipment(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Starting Equipment</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Your class gives you a choice of starting gear instead of buying everything piece by piece. Pick what fits how you want to fight.";
  card.appendChild(explain);

  var info = currentClassInfo();
  info.equipment.choiceGroups.forEach(function(group, gi){
    var groupTitle = document.createElement("p");
    groupTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    groupTitle.textContent = "Choice "+String.fromCharCode(65+gi);
    card.appendChild(groupTitle);
    group.options.forEach(function(opt){
      var row = ce("div","wiz-equip-option");
      var available = equipmentOptionAvailable(opt);
      // A pick that a changed subclass no longer allows is cleared.
      if(!available && wizardState.equipment[gi]===opt.key) delete wizardState.equipment[gi];
      if(wizardState.equipment[gi]===opt.key) row.classList.add("selected");
      var lockNote = available ? "" : "<br><span style='font-size:11.5px;color:var(--oxblood)'>Needs "+escapeHtml(PROF_LABELS[opt.requires]||opt.requires)+" proficiency"+escapeHtml(requiresHint(opt.requires))+"</span>";
      row.innerHTML = "<div><strong>"+escapeHtml(opt.label)+"</strong><br><span style='font-size:11.5px;color:var(--text-on-parch-dim)'>"+escapeHtml(opt.detail||"")+"</span>"+lockNote+"</div>";
      if(!available){ row.classList.add("disabled"); row.style.opacity = ".5"; row.style.cursor = "not-allowed"; card.appendChild(row); return; }
      row.addEventListener("click", function(){
        wizardState.equipment[gi] = opt.key;
        renderWizard();
      });
      card.appendChild(row);
      // "Any martial melee weapon": choose which, under the picked option.
      if(wizardState.equipment[gi]===opt.key) opt.items.forEach(function(it, ii){
        if(it.pick) card.appendChild(weaponPickField(it, gi + ":" + ii));
      });
    });
  });

  if(info.equipment.fixed.length){
    var fixedTitle = document.createElement("p");
    fixedTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
    fixedTitle.textContent = "Always included";
    card.appendChild(fixedTitle);
    var fixedP = document.createElement("p");
    fixedP.style.fontSize = "13px";
    fixedP.textContent = info.equipment.fixed.map(function(i, ii){
      var name = i.pick ? pickedWeaponName(i, "fixed:" + ii) : i.name;
      return i.qty>1 ? i.qty+"× "+name : name;
    }).join(", ");
    card.appendChild(fixedP);
    info.equipment.fixed.forEach(function(it, ii){ if(it.pick) card.appendChild(weaponPickField(it, "fixed:" + ii)); });
  }

  container.appendChild(card);
}

/* ---- Starting weapons of the player's choice ----
   An item with `pick` ({category, melee}) is "any weapon of that kind" (a
   barbarian's "any martial melee weapon", a warlock's "any simple
   weapon"). wizardState.equipmentPicks[key] holds the weapon chosen
   ("groupIndex:itemIndex", or "fixed:itemIndex"); the item itself is the
   default. */
function weaponFitsPick(pick, name){
  var d = WEAPON_DATA[name];
  return !!(d && !d.custom && d.category===pick.category && (!pick.melee || !d.ranged));
}
function pickedWeaponName(it, key){
  var v = ((wizardState && wizardState.equipmentPicks) || {})[key];
  return v && weaponFitsPick(it.pick, v) ? v : it.name;
}
/* The weapon picker under an option: grouped like the Armory, weapons the
   class can't use greyed out. */
function weaponPickField(it, key){
  var groups = {};
  Object.keys(WEAPON_GROUPS).forEach(function(g){
    var names = WEAPON_GROUPS[g].filter(function(n){ return weaponFitsPick(it.pick, n); });
    if(names.length) groups[g] = names;
  });
  var who = {classes: [{name: wizardState.classId, subclass: "", level: 1}], race: wizardState.race, feats: [], features: []};
  var f = ce("div", "field wiz-weapon-pick");
  f.style.maxWidth = "320px";
  f.style.margin = "6px 0 10px";
  f.appendChild(themedPicker({
    key: "equipWeapon:" + key, groups: groups, value: pickedWeaponName(it, key), search: true, sheet: true,
    ariaLabel: "Weapon: " + (it.pick.category==="martial" ? "martial" : "simple") + (it.pick.melee ? " melee" : "") + " weapon",
    detailFor: function(n){ var d = WEAPON_DATA[n]; return d ? d.damageDice + " " + d.damageType.toLowerCase() + (d.properties ? " · " + d.properties : "") : ""; },
    reasonFor: function(n){ return isProficientWithWeapon(who, n, WEAPON_DATA[n].category) ? "" : "not proficient"; },
    onPick: function(v){
      wizardState.equipmentPicks = wizardState.equipmentPicks || {};
      wizardState.equipmentPicks[key] = v;
      renderWizard();
    }
  }));
  return f;
}
/* The starting item as the weapon picked for it. */
function pickedItem(it, key){
  var name = pickedWeaponName(it, key);
  if(name===it.name) return it;
  var d = WEAPON_DATA[name];
  return {name: name, qty: it.qty, weight: d.weight, notes: (d.properties || "").toLowerCase(), type: "weapon", damageDice: d.damageDice,
    damageType: d.damageType, ability: d.finesse ? "finesse" : d.ranged ? "dex" : "str", proficient: true, picked: true};
}

/* Carries a starting-equipment entry into an inventory item, keeping the
   structured weapon/armor fields (type, damage dice, category, etc.) when
   the class data defines them so it's ready to roll/count toward AC right
   away, instead of landing as generic untyped Gear. */
function equipmentItemToInventoryItem(it, equipped){
  var item = {name:it.name, qty:it.qty, equipped:equipped, notes:it.notes||"", type: it.type||"gear"};
  if(it.type==="weapon"){
    item.damageDice = it.damageDice||"";
    item.damageType = it.damageType||"";
    item.ability = it.ability||"str";
    item.proficient = it.proficient!=null ? it.proficient : true;
    item.magicBonus = it.magicBonus||0;
    if(it.picked) item.picked = true; // finishWizard works out its proficiency
  } else if(it.type==="armor"){
    item.category = it.category||"light";
    item.baseAC = it.baseAC!=null ? it.baseAC : 10;
    item.magicBonus = it.magicBonus||0;
  }
  return item;
}

export function buildEquipmentList(info, chosenKeys){
  var items = [];
  info.equipment.choiceGroups.forEach(function(group, gi){
    var opt = group.options.find(function(o){ return o.key===chosenKeys[gi]; });
    if(opt){
      opt.items.forEach(function(it, ii){
        var chosen = it.pick ? pickedItem(it, gi + ":" + ii) : it;
        items.push(equipmentItemToInventoryItem(chosen, chosen.type==="weapon" || chosen.type==="armor"));
      });
    }
  });
  info.equipment.fixed.forEach(function(it, ii){
    var chosen = it.pick ? pickedItem(it, "fixed:" + ii) : it;
    items.push(equipmentItemToInventoryItem(chosen, chosen.type==="weapon" || chosen.type==="armor"));
  });
  // Wear one suit of armor and fill the two hands (a shield takes one);
  // everything else starts in the pack.
  autoEquipLoadout(items);
  return items;
}


/* Forget open homebrew boxes when a new character is started. */
export function resetHomebrewPickers(){ resetThemedPickers(); }
