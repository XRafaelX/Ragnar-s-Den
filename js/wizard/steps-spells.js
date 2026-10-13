/* ---------------- Creation wizard: spells and the review ----------------
   The Cantrips and Spells steps and the last screen, which lists
   everything chosen before the character is made. */
import { ABILITIES, HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";
import { RACE_DATA } from "../data/race-data.js";
import { pickNameIdeas, pickTitleIdeas } from "../data/misc.js";
import { TITLE_MAX } from "../ui/char-title.js";
import { SPELL_DATA, spellDataForClass, tashaAddsSpell, tashaSpellCount } from "../data/spells.js";
import { mod, fmtMod, escapeHtml, ce, computeArmorClass } from "../core/helpers.js";
import { makeDiceSvg } from "../ui/svg-icons.js";
import { wizardClassGrants, wizardPickSlots, currentClassInfo, wizardState, applyClassChoices, subclassGrants, spellPickCount, languagePlan, raceChoiceDef, raceAbilityIncreases, finalAbilities, wizardBackgroundFeat, wizardBackgroundFeatPicks, wizardExpandedSpells, wizardGrantedSpells, dropGrantedSpellPicks, wizardExtraListSpells, wizardExtraListName, wizardBackgroundSkills } from "./wizard-core.js";
import { spellPickGrid } from "../ui/spell-pick-grid.js";
import { featPicksSummary } from "../core/feat-picks.js";
import { classPicksSummary } from "../core/class-picks.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { SUBCLASSES } from "../data/progression.js";
import { tashaSwitchRow, buildEquipmentList } from "./steps-choices.js";

/* One pick-N-from-a-list block (cantrips or 1st-level spells): a tray
   with a slot per pick (tap a picked spell's × to drop it), search and
   school filters, then the spells as cards. The tray and search stay
   pinned while the cards scroll. Toggling updates the cards in place
   rather than re-rendering the whole wizard, so the page keeps its scroll
   position and the search box keeps focus. */
/* extra: spells beyond the class list; extraTag(name) labels one ("Patron
   spell", "Cleric spell"), default "Patron spell". */
function spellPickSection(title, help, count, level, chosen, listClass, exclude, extra, extraTag){
  // With Tasha's optional features on, the list has Tasha's additions too.
  var data = spellDataForClass(listClass, !!wizardState.tashaOptional);
  // Extra spells a subclass adds to the class list (a warlock's patron).
  (extra||[]).forEach(function(name){ if(SPELL_DATA[name]) data[name] = SPELL_DATA[name]; });
  // Spells the character gets for free (domain spells, bonus cantrips) are
  // left out so a pick isn't wasted on them.
  exclude = exclude || [];
  var names = Object.keys(data).filter(function(name){ return data[name].level === level && exclude.indexOf(name)===-1; }).sort();
  var tags = {};
  names.forEach(function(name){ if(tashaAddsSpell(data[name], listClass)) tags[name] = ["Tasha's optional"]; });
  (extra||[]).forEach(function(name){ tags[name] = [extraTag ? extraTag(name) : "Patron spell"]; });
  return spellPickGrid({title: title, help: help, count: count, names: names, chosen: chosen, tags: tags});
}

/* Spells of `level` on this step's list that the character already has
   from a feature other than the subclass freebies (a feat's spell, a
   subclass pick's): they're left out of the picks, with a line saying so.
   Returns their names. */
function alreadyGranted(card, level, listClass, extra, freebies){
  var data = spellDataForClass(listClass, !!wizardState.tashaOptional);
  var mine = wizardGrantedSpells().filter(function(g){
    return (SPELL_DATA[g.name]||{}).level===level && (freebies||[]).indexOf(g.name)===-1 && (data[g.name] || (extra||[]).indexOf(g.name)!==-1);
  });
  if(mine.length){
    var note = document.createElement("p");
    note.className = "wiz-granted-note";
    note.style.cssText = "font-size:13px;margin:0 0 12px;";
    note.innerHTML = "You already have " + mine.map(function(g){ return "<b>"+escapeHtml(g.name)+"</b> (from "+escapeHtml(g.source)+")"; }).join(", ").replace(/, ([^,]*)$/, " and $1") +
      ", so " + (mine.length>1 ? "they aren't" : "it isn't") + " offered below. Pick something else here.";
    card.appendChild(note);
  }
  return mine.map(function(g){ return g.name; });
}

/* Shared top of the Cantrips and Spells steps: the card, its explainer,
   the subclass freebies of this kind, and the note when a subclass opens
   another class's list (a Divine Soul can pick cleric spells). */
function spellStepCard(title, explainHtml, freebies){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>"+escapeHtml(title)+"</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = explainHtml;
  card.appendChild(explain);
  if(freebies.length){
    var free = document.createElement("p");
    free.style.cssText = "font-size:13px;margin:0 0 12px;";
    free.innerHTML = "Your <b>"+escapeHtml(wizardState.classChoices.subclass)+"</b> also gives you "+escapeHtml(freebies.join(", "))+" for free. "+(freebies.length>1 ? "They're" : "It's")+" added automatically and "+(freebies.length>1 ? "don't" : "doesn't")+" count toward the picks below.";
    card.appendChild(free);
  }
  if(wizardExtraListSpells().length){
    var also = document.createElement("p");
    also.style.cssText = "font-size:13px;margin:0 0 12px;";
    also.innerHTML = "Your <b>"+escapeHtml(wizardState.classChoices.subclass)+"</b> can also learn "+escapeHtml(wizardExtraListName().toLowerCase())+" spells; they're in the list below.";
    card.appendChild(also);
  }
  return card;
}

export function wizardStepCantrips(container){
  var info = currentClassInfo();
  var sc = info.spellcasting;
  var grants = subclassGrants(info, wizardState.classChoices);
  var card = spellStepCard("Cantrips",
    "<b>Why this matters:</b> Cantrips are spells you can cast at will, as often as you like, without using a spell slot. You can always change or add more from the Spells tab once your character exists.",
    grants.cantrips||[]);
  var extraTag = function(){ return wizardExtraListName() + " spell"; };
  dropGrantedSpellPicks();
  var have = alreadyGranted(card, 0, sc.spellList, wizardExtraListSpells(), grants.cantrips);
  card.appendChild(spellPickSection("Cantrips known", "", sc.cantrips, 0, wizardState.spellChoices.cantrips, sc.spellList, (grants.cantrips||[]).concat(have), wizardExtraListSpells(), extraTag));
  container.appendChild(card);
}

export function wizardStepSpells(container){
  var info = currentClassInfo();
  var sc = info.spellcasting;
  var grants = subclassGrants(info, wizardState.classChoices);
  var card = spellStepCard("Spells",
    "<b>Why this matters:</b> Your starting spells are your first real tools. Each cast uses a spell slot, and your slots come back when you rest. You can always change or add more from the Spells tab once your character exists.",
    grants.spells||[]);
  // A shrinking count (e.g. lower Wisdom after going back) trims extra picks.
  var need = spellPickCount(sc);
  dropGrantedSpellPicks();
  if(wizardState.spellChoices.spells.length > need) wizardState.spellChoices.spells.length = need;
  var extraList = wizardExtraListSpells();
  var expandedSpells = wizardExpandedSpells().filter(function(n){ return (SPELL_DATA[n]||{}).level===1; });
  var extraTag = function(name){ return expandedSpells.indexOf(name)!==-1 ? "Patron spell" : wizardExtraListName() + " spell"; };
  if(expandedSpells.length){
    var exp = document.createElement("p");
    exp.style.cssText = "font-size:13px;margin:0 0 12px;";
    exp.innerHTML = "Your <b>"+escapeHtml(wizardState.classChoices.subclass)+"</b> adds "+escapeHtml(expandedSpells.join(", ").replace(/, ([^,]*)$/, " and $1"))+" to the spells you can learn (marked <i>Patron spell</i>).";
    card.appendChild(exp);
  }
  // Tasha's Additional Spells: offered when the switch here is on.
  var tashaMore = tashaSpellCount(sc.spellList, [1]);
  if(tashaMore) card.appendChild(tashaSwitchRow("Turned on, the " + tashaMore + " 1st-level spell" + (tashaMore===1 ? "" : "s") + " Tasha's Cauldron adds to the " + sc.spellList.toLowerCase() + " list " + (tashaMore===1 ? "is" : "are") + " listed too (more at higher levels)."));
  var have = alreadyGranted(card, 1, sc.spellList, expandedSpells.concat(extraList), grants.spells);
  card.appendChild(spellPickSection(sc.spellsLabel || "1st-level spells", sc.spellsHelp || "", need, 1, wizardState.spellChoices.spells, sc.spellList, (grants.spells||[]).concat(have), expandedSpells.concat(extraList), extraTag));
  container.appendChild(card);
}

/* "Need ideas?" row: four random suggestions from pick(n) as chips, plus a
   button that deals four more. Tapping a chip hands it to onPick. */
function ideaChips(pick, onPick){
  var wrap = ce("div","wiz-name-ideas");
  var label = document.createElement("span");
  label.textContent = "Need ideas? ";
  wrap.appendChild(label);
  function render(){
    wrap.querySelectorAll(".wiz-name-chip").forEach(function(el){ el.remove(); });
    pick(4).forEach(function(idea){
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "btn small ghost wiz-name-chip";
      chip.textContent = idea;
      chip.addEventListener("click", function(){ onPick(idea); });
      wrap.appendChild(chip);
    });
    var shuffleBtn = document.createElement("button");
    shuffleBtn.type = "button";
    shuffleBtn.className = "btn small ghost wiz-name-chip";
    shuffleBtn.innerHTML = makeDiceSvg() + "More ideas";
    shuffleBtn.addEventListener("click", render);
    wrap.appendChild(shuffleBtn);
  }
  render();
  return wrap;
}

export function wizardStepReview(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Review & Finish</span></h3>";

  var nameWrap = document.createElement("div");
  nameWrap.style.cssText = "margin-bottom:16px;";
  nameWrap.innerHTML = "<label style='font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-on-parch-dim);display:block;margin-bottom:3px;'>Character name <span style='color:var(--oxblood);'>*</span> required</label>";
  var nameInput = document.createElement("input");
  nameInput.id = "wiz-name-input";
  nameInput.value = wizardState.name; nameInput.placeholder = "e.g. Ragnar";
  nameInput.style.cssText = "width:100%;max-width:320px;background:transparent;border:none;border-bottom:1px solid var(--rule);color:var(--text-on-parch);font-family:var(--serif);font-size:20px;padding:4px 0;";
  nameInput.addEventListener("input", function(){
    wizardState.name = nameInput.value;
    nameInput.classList.remove("wiz-invalid");
    var errBox = document.getElementById("wizard-error");
    if(errBox) errBox.classList.remove("show");
  });
  nameWrap.appendChild(nameInput);

  nameWrap.appendChild(ideaChips(pickNameIdeas, function(idea){
    wizardState.name = idea;
    nameInput.value = idea;
    nameInput.classList.remove("wiz-invalid");
    var errBox = document.getElementById("wizard-error");
    if(errBox) errBox.classList.remove("show");
  }));

  card.appendChild(nameWrap);

  // Optional epithet, shown under the name on the sheet.
  var titleWrap = document.createElement("div");
  titleWrap.style.cssText = "margin-bottom:16px;";
  titleWrap.innerHTML = "<label for='wiz-title-input' style='font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-on-parch-dim);display:block;margin-bottom:3px;'>Title <span style='text-transform:none;letter-spacing:0;'>(optional)</span></label>";
  var titleInput = document.createElement("input");
  titleInput.id = "wiz-title-input";
  titleInput.className = "wiz-title-input";
  titleInput.value = wizardState.title || "";
  titleInput.maxLength = TITLE_MAX;
  titleInput.placeholder = "e.g. the Unbroken";
  titleInput.addEventListener("input", function(){ wizardState.title = titleInput.value; });
  titleWrap.appendChild(titleInput);
  titleWrap.appendChild(ideaChips(pickTitleIdeas, function(idea){
    wizardState.title = idea;
    titleInput.value = idea;
  }));
  card.appendChild(titleWrap);

  var info = currentClassInfo();
  var finalAb = finalAbilities();
  var conMod = mod(finalAb.con);
  var hpBonus = subclassGrants(info, wizardState.classChoices).hpPerLevel||0;
  var race = RACE_DATA[wizardState.race];
  var raceHp = race && Number(race.hpPerLevel) || 0; // Dwarven Toughness
  // Tough from the background (Wildspacer) or the race's feat: 2 at level 1.
  var bgGrant = wizardBackgroundFeat(), raceDefHp = raceChoiceDef();
  var toughHp = (bgGrant && bgGrant.def && bgGrant.def.name==="Tough") || (raceDefHp && raceDefHp.feat && wizardState.raceChoices.feat==="Tough") ? 2 : 0;
  var hp = HIT_DICE_BY_CLASS[wizardState.classId] + conMod + hpBonus + raceHp + toughHp;
  // Same AC math as the sheet, run on the gear and picks chosen so far.
  var preview = {
    abilities: finalAb,
    classes: [{name:wizardState.classId, level:1}],
    inventory: buildEquipmentList(info, wizardState.equipment),
    features: [], skillProfs: {}, acMisc: 0
  };
  applyClassChoices(preview, info, wizardState.classChoices);
  var ac = computeArmorClass(preview);

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
  row("Alignment", wizardState.alignment || "None");
  var langPlan = languagePlan();
  row("Languages", langPlan.fixed.concat(wizardState.languageChoices.slice(0, langPlan.slots.length).filter(Boolean)).join(", "));
  row("Ability scores", ABILITIES.map(function(a){ return a[1].slice(0,3).toUpperCase()+" "+finalAb[a[0]]; }).join("  "));
  var raceInc = raceAbilityIncreases();
  var raceIncKeys = ABILITIES.map(function(a){ return a[0]; }).filter(function(k){ return raceInc[k]; });
  if(raceIncKeys.length) row("Race increases", raceIncKeys.map(function(k){ return k.toUpperCase()+" "+fmtMod(raceInc[k]); }).join(", "));
  var raceDef = raceChoiceDef();
  if(raceDef){
    var rc = wizardState.raceChoices;
    if(raceDef.abilityPreset && rc.preset) row(raceDef.abilityPreset.label, rc.preset);
    if(raceDef.skills) row(raceDef.skills>1 ? "Race skills" : "Race skill", rc.skills.slice(0, raceDef.skills).filter(Boolean).join(", ") || "None");
    if(raceDef.tools) row("Race tool", (rc.tools||[]).slice(0, raceDef.tools).filter(Boolean).join(", ") || "None");
    if(raceDef.feat){
      var featPicked = rc.feat && featPicksSummary(FEATS_CATALOG.find(function(f){ return f.name===rc.feat; }), rc.featPicks);
      row("Feat", (rc.feat || "None") + (featPicked ? " ("+featPicked+")" : ""));
    }
  }
  if(bgGrant && bgGrant.def){
    var bgPicked = featPicksSummary(bgGrant.def, wizardBackgroundFeatPicks());
    row(bgGrant.campaign ? "Campaign feat" : "Background feat", bgGrant.def.name + (bgPicked ? " ("+bgPicked+")" : ""));
  }
  row("Hit points", hp+" (d"+HIT_DICE_BY_CLASS[wizardState.classId]+" + CON "+fmtMod(conMod)+(hpBonus ? " + "+hpBonus+" "+wizardState.classChoices.subclass : "")+
    (raceHp ? " + "+raceHp+" "+(race.hpTrait || wizardState.race) : "")+(toughHp ? " + "+toughHp+" Tough" : "")+")");
  row("Armor Class", ac.value + " (" + ac.breakdown + ")");
  row("Saving throws", info.savingThrows.map(function(k){ return k.toUpperCase(); }).join(", "));
  var allSkills = wizardState.skillChoices.concat(wizardBackgroundSkills(),
    raceDef && raceDef.skills ? wizardState.raceChoices.skills.slice(0, raceDef.skills).filter(Boolean) : []);
  row("Skills", allSkills.filter(function(sk, i){ return allSkills.indexOf(sk)===i; }).join(", ") || "None");
  (info.choices||[]).forEach(function(ch){
    var v = wizardState.classChoices[ch.id];
    row(ch.label, Array.isArray(v) ? v.join(", ") : (v || "None"));
  });
  var grants = subclassGrants(info, wizardState.classChoices);
  if(grants.pick) row(grants.pick.label, wizardState.classChoices[grants.pick.id] || "None");
  // What the subclass's features add: given outright, or picked.
  wizardClassGrants().forEach(function(g){
    var bits = (g.def.skills||[]).concat((g.def.expertise||[]).map(function(s){ return "expertise in "+s; }), g.def.languages||[]);
    var chosen = classPicksSummary(g, {slots: wizardPickSlots(g.key)});
    if(chosen) bits.push(chosen);
    if(bits.length) row(g.name, bits.join(", "));
  });
  if(grants.spells) row("Domain spells", grants.spells.join(", ")+" (always prepared)");
  if(info.spellcasting && info.spellcasting.pact) row("Pact Magic", info.spellcasting.pact.max+" × "+info.spellcasting.pact.slotLevel+"st-level slot, back on a short rest");
  if(info.spellcasting){
    row("Cantrips", wizardState.spellChoices.cantrips.join(", ") || "None");
    row(info.spellcasting.spellsLabel || "1st-level spells", wizardState.spellChoices.spells.join(", ") || "None");
  }
  card.appendChild(rows);

  var featTitle = document.createElement("p");
  featTitle.style.cssText = "font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-on-parch-dim);margin:14px 0 6px;";
  featTitle.textContent = "Level 1 features";
  card.appendChild(featTitle);
  var sub = (SUBCLASSES[wizardState.classId]||[]).find(function(x){ return x.name===wizardState.classChoices.subclass; });
  info.features.concat(sub && sub.features && sub.features[1] || []).forEach(function(f){
    var p = document.createElement("p");
    p.style.cssText = "font-size:13px;margin:0 0 8px;";
    p.innerHTML = "<strong>"+escapeHtml(f.name)+":</strong> "+escapeHtml(f.text);
    card.appendChild(p);
  });

  container.appendChild(card);
}
