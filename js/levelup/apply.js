/* ---------------- Level-up: apply and undo ----------------
   finish() writes the choices in `lu` onto the character and records
   what changed in c.levelHistory, so undoLastLevelUp() can take exactly
   that back. showUnlocked() is the popup that follows. */
import { ABILITIES } from "../data/abilities-skills.js";
import { FEATS_CATALOG } from "../data/feats.js";
import { MAX_LEVEL, XP_THRESHOLDS, SPELL_TIPS, THIRD_CASTER_SPELL_TIPS } from "../data/progression.js";
import { fmtMod, ce, escapeHtml, uid, clamp, totalLevel, profBonus, classFeatureList, classFeaturesGainedAt, classCasterType, classSpellAbility, computeSpellSlots, maxHp, fullMaxHp, syncHitDice, computeSpeed, ordinal } from "../core/helpers.js";
import { save } from "../core/state.js";
import { syncInfusions } from "../core/artificer.js";
import { endWildShape } from "../core/druid.js";
import { applyLevelUpChoices, undoLevelUpChoices } from "../core/invocations.js";
import { applyPlan, undoPlan, knownOptions } from "../core/class-options.js";
import { makeStyleFeature } from "../core/fighting-styles.js";
import { applyClassPicks, revertEntryPicks, syncClassPicks, classPicksSummary, entryGrants } from "../core/class-picks.js";
import { renderAll, noteCompanions } from "../render/sheet.js";
import { characterCompanions, newCompanionsText } from "../core/companions.js";
import { confirmDialog } from "../ui/confirm-modal.js";
import { openInfoModal } from "../ui/info-modal.js";
import { playAdd, playDelete } from "../ui/sound.js";
import { showActionToast } from "../ui/toast.js";
import { featDef, featHasPicks, applyFeatPicks, revertFeatPicks, featSpellEntries, campaignFeatCopy } from "../core/feat-picks.js";
import { applyLearn, undoLearn } from "../core/spells-known.js";
import { preparedAt } from "../data/spells-known.js";
import { lu, learnActive, abilityName, progFor, target, stepApplicable, optionPlans, optChoice, profPicksToApply, variantsToApply, invChoice, chosenSubclass, dueSpellChoices, currentLearnPlan, learnSections, cantripSwapOut, expertiseSwap, close, swapOutStyle, styleCantripOffer, featureAbilityBonus, hpGain } from "./session.js";

/* ---------------- Apply & undo ---------------- */
function slotSnapshot(c){
  var s = {};
  for(var i=1;i<=9;i++) s[i] = c.spellcasting.slots[i].max;
  return s;
}

/* Recompute slot maximums from the class levels, keeping used counts and
   any slots added or removed by hand on the Spells tab (s.extra). */
export function applySpellSlots(c){
  // A character with no spellcasting class keeps whatever slots were typed
  // in by hand (magic items, homebrew); only casters get recalculated.
  if(!c.classes.some(function(cl){ return classCasterType(cl); })) return;
  var res = computeSpellSlots(c.classes);
  for(var i=1;i<=9;i++){
    var s = c.spellcasting.slots[i];
    s.max = Math.max(0, res.slots[i] + (Number(s.extra)||0));
    s.used = clamp(s.used||0, 0, s.max);
  }
  if(res.pact){
    var prev = c.spellcasting.pact;
    c.spellcasting.pact = {max:res.pact.max, slotLevel:res.pact.slotLevel, used: prev ? clamp(prev.used||0, 0, res.pact.max) : 0};
  } else {
    c.spellcasting.pact = null;
  }
}

function hadAnyCasting(slots, pact){
  return !!pact || Object.keys(slots).some(function(k){ return slots[k]>0; });
}

export function finish(){
  var c = lu.c;
  endWildShape(c); // (a level-up changes your own hit points)
  var t = target();
  var subName = t.needsSubclass ? chosenSubclass() : null;
  var dueChoices = dueSpellChoices();
  // Asked before the class entry's level changes (target() reads it).
  var doInvocations = stepApplicable("invocations");
  var learnNow = learnActive() ? currentLearnPlan() : null;
  var learnLists = learnNow ? learnSections(learnNow) : [];
  var invNow = doInvocations ? invChoice() : null;
  var versatilityOut = learnNow ? cantripSwapOut(learnNow) : "";
  var exSwap = learnNow && expertiseSwap(learnNow);
  var cOffer = styleCantripOffer();
  var optPlans = stepApplicable("options") ? optionPlans() : [];
  var profPicks = profPicksToApply();
  var variants = variantsToApply();
  var gain = hpGain();
  var featureBonus = featureAbilityBonus();
  var before = {total: totalLevel(c), pb: profBonus(c), slots: slotSnapshot(c), pact: c.spellcasting.pact ? JSON.parse(JSON.stringify(c.spellcasting.pact)) : null,
    hpMax: fullMaxHp(c), speed: computeSpeed(c).value, companions: characterCompanions(c).map(function(x){ return x.def.id; })};
  var record = {
    className: lu.className, isNewClass: !t.existing, prevSubclass: t.existing ? (t.existing.subclass||"") : "",
    hpGain: gain, speedGain: 0, asi: null, featId: null, unlockIds: [],
    prevSpellcasting: {ability: c.spellcasting.ability, slots: before.slots, pact: before.pact}
  };

  var bonusFeatDue = stepApplicable("bonusFeat"); // asked before the feats below change the answer
  var feat = null;
  if(t.asi && lu.asiMode==="feat"){
    var f = FEATS_CATALOG.find(function(x){ return x.name===lu.featName; });
    feat = {id: uid(), name: f.name, prerequisite: f.prerequisite, category: f.category, summary: f.summary, description: f.description, source: f.custom ? "Custom" : "SRD"};
    if(f.custom) feat.homebrewId = f.id; // linked to the Compendium entry
    c.feats.push(feat);
    if(lu.featPicks) applyFeatPicks(c, feat, lu.featPicks);
    record.featId = feat.id;
  } else if(t.asi){
    record.asi = {};
    ABILITIES.forEach(function(a){
      if(!lu.asi[a[0]]) return;
      var was = Number(c.abilities[a[0]])||10;
      c.abilities[a[0]] = Math.min(20, was + lu.asi[a[0]]);
      // Record what was actually added (after the 20 cap) so undo is exact.
      if(c.abilities[a[0]] !== was) record.asi[a[0]] = c.abilities[a[0]] - was;
    });
  }

  // The campaign's bonus feat, after the level's own so it sees that one.
  var bonusFeat = null;
  if(bonusFeatDue && lu.bonusFeatName){
    bonusFeat = campaignFeatCopy(featDef(lu.bonusFeatName), c.campaign, 4);
    c.feats.push(bonusFeat);
    if(lu.bonusFeatPicks) applyFeatPicks(c, bonusFeat, lu.bonusFeatPicks);
    record.bonusFeatId = bonusFeat.id;
  }

  var entry = t.existing;
  if(entry){
    entry.level = t.newLevel;
    record.prevVariants = entry.variants ? Object.assign({}, entry.variants) : null; // undo puts them back
  } else {
    entry = {name: lu.className, subclass: "", level: 1};
    c.classes.push(entry);
  }
  // Favored Foe in place of Favored Enemy, Primal Awareness, Steady Aim.
  if(Object.keys(variants).length) entry.variants = variants;
  if(subName) entry.subclass = subName;
  // Spell choices made on this level-up; undo clears them again.
  dueChoices.forEach(function(x){
    var v = lu.spellChoices[x.choice.id];
    if(!v) return;
    entry.spellChoices = entry.spellChoices || {};
    entry.spellChoices[x.choice.id] = v;
    (record.spellChoiceIds = record.spellChoiceIds || []).push(x.choice.id);
  });

  // New spells (and a swapped-out one); undo takes back exactly these.
  if(learnNow) record.learn = applyLearn(c, lu.className, learnNow, learnLists, lu.learnPicks, lu.learnSwap, versatilityOut);
  // Bardic Versatility: one Expertise skill moves; undo moves it back.
  if(exSwap && exSwap.to){
    var exGrant = entryGrants(entry).find(function(g){ return g.key===exSwap.key; });
    var exOld = ((entry.profPicks||{})[exSwap.key]||{}).slots;
    if(exGrant && exOld){
      applyClassPicks(c, entry, exGrant, exOld.map(function(slot){ return slot.map(function(v){ return v===exSwap.from ? exSwap.to : v; }); }));
      record.expertiseSwap = {key: exSwap.key, slots: exOld, from: exSwap.from, to: exSwap.to};
    }
  }

  // Pact Boon and invocations; undo takes back exactly these.
  var invGained = [];
  if(doInvocations){
    var invApplied = applyLevelUpChoices(c, entry, t.newLevel, invNow);
    record.pactBoonSet = invApplied.pactBoonSet;
    record.invAdded = invApplied.invAdded;
    record.invSwappedOut = invApplied.invSwappedOut;
    if(invApplied.pactBoonPrev) record.pactBoonPrev = invApplied.pactBoonPrev;
    invGained = invApplied.gained;
  }
  // Class options (Metamagic, maneuvers), recorded for undo.
  if(optPlans.length){
    record.optionRecs = optPlans.map(function(plan){
      var optRec = applyPlan(c, entry, plan, optChoice(plan.set.id));
      optRec.added.forEach(function(id){
        var e = knownOptions(entry, plan.set.id).find(function(x){ return x.id===id; });
        var o = e && plan.set.options.find(function(x){ return x.name===e.name; });
        if(o) invGained.push({id:"opt_"+id, name:o.name, text:o.text, subclass:false, tag:plan.set.noun.charAt(0).toUpperCase()+plan.set.noun.slice(1)});
      });
      return optRec;
    });
  }

  // Skills, expertise, languages and other proficiencies this level's
  // features give or let the player choose; undo takes them back when the
  // features go (see syncClassPicks).
  var profGained = [];
  profPicks.forEach(function(x){
    var made = applyClassPicks(c, entry, x.grant, x.slots);
    var bits = (x.grant.def.skills||[]).concat((x.grant.def.expertise||[]).map(function(s){ return "expertise in "+s; }), x.grant.def.languages||[]);
    var chosen = classPicksSummary(x.grant, made);
    if(chosen) bits.push(chosen);
    profGained = profGained.concat(bits);
  });

  // The picked style becomes a tagged feature (like a starting Fighter's),
  // so Defense/Archery/Dueling apply and undo can remove it.
  // A Martial Versatility swap takes the old style off first (undo puts
  // it back).
  var styleFeature = null;
  if(lu.style && (t.fightingStyle || lu.styleSwapOut)){
    var outStyle = lu.styleSwapOut && swapOutStyle();
    if(outStyle){
      c.features = c.features.filter(function(f){ return f!==outStyle; });
      record.styleSwappedOut = outStyle;
    }
    styleFeature = makeStyleFeature(lu.style, lu.stylePicks);
    c.features.push(styleFeature);
    record.featureId = styleFeature.id;
  }

  // Blessed / Druidic Warrior: one of the style's cantrips changed.
  if(cOffer && lu.styleCantripOut && lu.styleCantripIn){
    var cSpells = cOffer.feature.picks.spells, cAt = cSpells.indexOf(lu.styleCantripOut);
    if(cAt!==-1){
      cSpells[cAt] = lu.styleCantripIn;
      record.styleCantrip = {featureId: cOffer.feature.id, out: lu.styleCantripOut, in: lu.styleCantripIn};
    }
  }

  // New features: whatever this class level grants, plus every subclass
  // feature up to now when the subclass was picked on this level-up.
  var gained = classFeaturesGainedAt(entry, t.newLevel);
  if(subName){
    classFeatureList(entry).forEach(function(f){
      if(f.subclass && !gained.some(function(g){ return g.id===f.id; })) gained.push(f);
    });
  }

  // Speed bonuses from class and subclass features (Fast Movement,
  // Aura of Alacrity, ...) gained on this level-up.
  gained.forEach(function(f){
    if(f.speed) record.speedGain += f.speed;
  });
  c.speed = (Number(c.speed)||30) + record.speedGain;

  // Ability increases from features (Primal Champion), recorded with the
  // ASI so the unlock popup shows them and undo takes them back off.
  Object.keys(featureBonus).forEach(function(k){
    var was = Number(c.abilities[k])||10;
    var now = Math.min(featureBonus[k].max, was + featureBonus[k].bonus);
    if(now === was) return;
    c.abilities[k] = now;
    record.asi = record.asi || {};
    record.asi[k] = (record.asi[k]||0) + (now - was);
  });

  // Current HP rises by the whole max HP change, Tough's part included;
  // the record keeps Tough's part so undo can take it back off.
  c.hp.max = (Number(c.hp.max)||0) + gain;
  var maxGain = fullMaxHp(c) - before.hpMax;
  record.toughGain = maxGain - gain;
  c.hp.current = (Number(c.hp.current)||0) + maxGain;

  applySpellSlots(c);
  syncInfusions(c); // Enhanced Weapon / Defense become +2 at artificer 10
  var ability = classSpellAbility(entry);
  if(ability && !hadAnyCasting(before.slots, before.pact) && classCasterType(entry)) c.spellcasting.ability = ability;

  var ids = gained.map(function(f){ return f.id; });
  if(feat) ids.push("feat_"+feat.id);
  if(bonusFeat) ids.push("feat_"+bonusFeat.id);
  if(styleFeature){
    ids.push(styleFeature.id);
    gained.push({id:styleFeature.id, name:styleFeature.name, text:styleFeature.text, subclass:false});
  }
  ids.forEach(function(id){
    if(c.newUnlocks.indexOf(id)===-1){ c.newUnlocks.push(id); record.unlockIds.push(id); }
  });
  gained = gained.concat(invGained); // shown in the popup; they live on their own card
  c.levelHistory.push(record);

  save();
  close();
  noteCompanions(c); // the popup below names a new companion, so no toast
  renderAll();
  playAdd();

  showUnlocked(c, {
    className: entry.name, isNewClass: record.isNewClass, newClassLevel: t.newLevel, subclass: subName, currentSubclass: entry.subclass,
    totalBefore: before.total, pbBefore: before.pb, hpGain: maxGain, speedGain: computeSpeed(c).value - before.speed,
    features: gained, feat: feat, bonusFeat: bonusFeat, asi: withFeatAbility(withFeatAbility(record.asi, feat), bonusFeat),
    slotsBefore: before.slots, pactBefore: before.pact, learned: record.learn ? record.learn.added : [], profGained: profGained,
    thirdCaster: classCasterType(entry)==="third",
    companions: characterCompanions(c).filter(function(x){ return before.companions.indexOf(x.def.id)===-1; })
  });
}

/* The popup's ability changes: the ASI's plus the feat's +1 (kept on the
   feat, not the record, so undo doesn't take it back twice). */
function withFeatAbility(asi, feat){
  var gained = feat && feat.applied && feat.applied.abilities;
  if(!gained || !Object.keys(gained).length) return asi;
  var out = Object.assign({}, asi||{});
  Object.keys(gained).forEach(function(k){ out[k] = (out[k]||0) + gained[k]; });
  return out;
}

export function undoLastLevelUp(c){
  var rec = c.levelHistory[c.levelHistory.length-1];
  if(!rec) return;
  var entry = c.classes.find(function(cl){ return cl.name===rec.className; });
  var label = rec.className+" "+(entry ? entry.level : "");
  confirmDialog("Undo last level-up?", "This removes "+label+" and reverts the HP, ability scores, feat, fighting style, proficiencies, spells, invocations, maneuvers or Metamagic, and spell slots it gave.", function(){
    c.levelHistory.pop();
    endWildShape(c);
    undoLearn(c, rec.learn);
    if(entry){
      if(rec.isNewClass){ revertEntryPicks(c, entry); c.classes.splice(c.classes.indexOf(entry), 1); }
      else {
        entry.level = Math.max(1, (Number(entry.level)||1)-1); entry.subclass = rec.prevSubclass;
        // (Older records didn't keep them: the variants stay as they are.)
        if(rec.prevVariants!==undefined){
          if(rec.prevVariants) entry.variants = rec.prevVariants; else delete entry.variants;
        }
        (rec.spellChoiceIds||[]).forEach(function(id){ if(entry.spellChoices) delete entry.spellChoices[id]; });
        undoLevelUpChoices(c, entry, rec);
        if(rec.expertiseSwap){
          var exG = entryGrants(entry).find(function(g){ return g.key===rec.expertiseSwap.key; });
          if(exG) applyClassPicks(c, entry, exG, rec.expertiseSwap.slots);
        }
        (rec.optionRecs||[]).forEach(function(r){ undoPlan(entry, r); });
      }
    }
    if(rec.asi) Object.keys(rec.asi).forEach(function(k){ c.abilities[k] = (Number(c.abilities[k])||10) - rec.asi[k]; });
    if(rec.featId){
      var featToRevert = c.feats.find(function(f){ return f.id===rec.featId; });
      if(featToRevert) revertFeatPicks(c, featToRevert);
      c.feats = c.feats.filter(function(f){ return f.id!==rec.featId; });
    }
    if(rec.bonusFeatId){
      var bonusToRevert = c.feats.find(function(f){ return f.id===rec.bonusFeatId; });
      if(bonusToRevert) revertFeatPicks(c, bonusToRevert);
      c.feats = c.feats.filter(function(f){ return f.id!==rec.bonusFeatId; });
    }
    if(rec.featureId) c.features = c.features.filter(function(f){ return f.id!==rec.featureId; });
    if(rec.styleSwappedOut) c.features.push(rec.styleSwappedOut);
    if(rec.styleCantrip){
      var sf = c.features.find(function(f){ return f.id===rec.styleCantrip.featureId; });
      var sAt = sf && sf.picks ? (sf.picks.spells||[]).indexOf(rec.styleCantrip.in) : -1;
      if(sAt!==-1) sf.picks.spells[sAt] = rec.styleCantrip.out;
    }
    c.hp.max = Math.max(1, (Number(c.hp.max)||1) - rec.hpGain);
    // Level-up added the gain to current HP too, so take it back off, but
    // never knock a conscious character down to 0 just by undoing.
    var cur = Number(c.hp.current)||0;
    c.hp.current = clamp(cur - rec.hpGain - (rec.toughGain||0), Math.min(cur, 1), maxHp(c));
    c.speed = (Number(c.speed)||30) - (rec.speedGain||0);
    var prev = rec.prevSpellcasting;
    c.spellcasting.ability = prev.ability;
    if(c.classes.some(function(cl){ return classCasterType(cl); })){
      // Still a caster: work the slots out from the classes again, keeping
      // slots added or removed by hand on the Spells tab (s.extra), even
      // ones changed after this level-up, and the slots spent since.
      applySpellSlots(c);
    } else {
      // No spellcasting class left: back to the numbers from before.
      for(var i=1;i<=9;i++){
        var s = c.spellcasting.slots[i];
        s.max = prev.slots[i]||0;
        s.used = clamp(s.used||0, 0, s.max);
      }
      var pactNow = c.spellcasting.pact;
      c.spellcasting.pact = prev.pact ? {max: prev.pact.max, slotLevel: prev.pact.slotLevel,
        used: clamp(pactNow ? (pactNow.used||0) : (prev.pact.used||0), 0, prev.pact.max)} : null;
    }
    c.newUnlocks = c.newUnlocks.filter(function(id){ return rec.unlockIds.indexOf(id)===-1; });
    syncClassPicks(c); // proficiencies from features the level gave go with them
    syncHitDice(c);
    syncInfusions(c);
    save(); renderAll(); playDelete();
    showActionToast("Level-up undone. Back to level "+totalLevel(c)+".");
  });
}

/* A spell tip without the sentences about picking spells, which the New
   spells step just did. */
function learnedTipRest(tip){
  return tip.split(/(?<=\.)\s+/).filter(function(sentence){
    return !(/^(Learn|Pick|Add|Choose)\b/.test(sentence) && /spell|cantrip/i.test(sentence) && !/infusion/i.test(sentence));
  }).join(" ").replace(/, and choose an? \S+ Mystic Arcanum spell/, "");
}

/* ---------------- "You unlocked…" popup ----------------
   Shown right after levelling so new players see, in plain words, what
   they just gained and what (if anything) they should do next. */
function showUnlocked(c, s){
  var total = totalLevel(c);
  openInfoModal("Level "+total+" reached!", function(body){
    var hero = ce("div","lu-hero");
    hero.innerHTML = "<div class='lu-hero-level'>"+total+"</div><div class='lu-hero-text'><b>"+escapeHtml(c.name||"Your character")+"</b> is now "+
      escapeHtml(s.className)+" "+s.newClassLevel+(s.isNewClass ? " (new class!)" : "")+"</div>";
    body.appendChild(hero);

    var stats = ce("div","lu-stat-row");
    function stat(label, value){
      var d = ce("div","lu-stat"); d.innerHTML = "<span class='lbl'>"+escapeHtml(label)+"</span><span class='val'>"+escapeHtml(value)+"</span>";
      stats.appendChild(d);
    }
    stat("Max HP", "+"+s.hpGain+" (now "+maxHp(c)+")");
    if(profBonus(c)!==s.pbBefore) stat("Proficiency", fmtMod(s.pbBefore)+" → "+fmtMod(profBonus(c)));
    if(s.speedGain) stat("Speed", "+"+s.speedGain+" ft");
    if(s.asi) Object.keys(s.asi).forEach(function(k){ stat(abilityName(k), "+"+s.asi[k]+" (now "+c.abilities[k]+")"); });
    var slotChanges = [];
    for(var i=1;i<=9;i++){
      var now = c.spellcasting.slots[i].max;
      if(now>s.slotsBefore[i]) slotChanges.push(ordinal(i)+"-level ×"+now+(s.slotsBefore[i] ? " (was "+s.slotsBefore[i]+")" : " (new!)"));
    }
    if(slotChanges.length) stat("Spell slots", slotChanges.join(", "));
    var pact = c.spellcasting.pact, pb = s.pactBefore;
    if(pact && (!pb || pb.max!==pact.max || pb.slotLevel!==pact.slotLevel)) stat("Pact slots", pact.max+" × "+ordinal(pact.slotLevel)+"-level");
    // A preparing class's daily count grows on set levels (2024 tables).
    var prepNow = preparedAt(s.className, s.newClassLevel), prepWas = s.isNewClass ? 0 : preparedAt(s.className, s.newClassLevel - 1);
    if(prepNow > prepWas) stat("Prepared spells", prepNow+" a day"+(prepWas ? " (was "+prepWas+")" : ""));
    body.appendChild(stats);

    if(s.subclass){
      var subP = ce("p","lu-note");
      subP.innerHTML = "You chose <b>"+escapeHtml(s.subclass)+"</b> as your "+escapeHtml(progFor(s.className).subclassLabel||"subclass")+".";
      body.appendChild(subP);
    }

    var unlocked = s.features.map(function(f){ return {name:f.name, text:f.text, tag: f.tag || (f.subclass ? (s.currentSubclass || s.subclass) : s.className), upgraded: f.upgraded}; });
    if(s.feat) unlocked.push({name:s.feat.name, text:s.feat.summary || s.feat.description, tag:"Feat"});
    if(s.bonusFeat) unlocked.push({name:s.bonusFeat.name, text:s.bonusFeat.summary || s.bonusFeat.description, tag:"Campaign feat"});
    if(unlocked.length){
      var h = ce("h5","info-modal-subhead"); h.textContent = "New things you unlocked";
      body.appendChild(h);
      unlocked.forEach(function(u, i){
        var card = ce("div","lu-unlock");
        card.style.animationDelay = (0.15 + i*0.12) + "s"; // cards slide in one after another
        card.innerHTML = "<div class='lu-unlock-top'><span class='lu-new-badge'>"+(u.upgraded ? "Upgraded" : "New")+"</span><b>"+escapeHtml(u.name)+"</b><span class='ff-tag source-class'>"+escapeHtml(u.tag)+"</span></div>"+
          "<div class='lu-unlock-text'>"+escapeHtml(u.text)+"</div>";
        body.appendChild(card);
      });
    }

    var tips = [];
    var spellTip = s.thirdCaster ? THIRD_CASTER_SPELL_TIPS[s.newClassLevel] : (SPELL_TIPS[s.className]||{})[s.newClassLevel];
    if(s.learned.length){
      tips.push("You learned "+s.learned.join(", ")+". "+(s.learned.length>1 ? "They're" : "It's")+" on the Spells tab.");
      // What's left of the tip once the picks it asks for are made
      // ("Your pact slots are now 2nd level.").
      spellTip = spellTip && learnedTipRest(spellTip);
      if(spellTip) tips.push(spellTip);
    }
    else if(spellTip) tips.push(spellTip+" Add them on the Spells tab.");
    if(s.isNewClass){
      var m = progFor(s.className).multiclassProfs;
      if(m){
        var profs = m.armor.concat(m.weapons, m.tools);
        if(profs.length) tips.push("New proficiencies: "+profs.join(", ")+".");
        if(m.note) tips.push(m.note);
      }
    }
    if(s.profGained.length) tips.push("Added to your sheet: "+s.profGained.join(", ")+".");
    // Catalog feats apply their +1 themselves (feat picks); only a custom one needs it added by hand.
    var featData = s.feat && featDef(s.feat.name);
    if(s.feat && !featHasPicks(featData) && /increase your \w+/i.test(s.feat.description||"")) tips.push("Your feat raises an ability score. Add it on the Abilities & Skills tab.");
    var featSpells = featData ? featSpellEntries(featData, s.feat.picks) : [];
    if(featSpells.some(function(e){ return e.use==="long" || e.use==="short"; })) tips.push("Your feat's spells are on the Spells tab, with a free cast of each on the Vitals tab.");
    else if(featSpells.length) tips.push("Your feat's spells are on the Spells tab.");
    if(unlocked.length) tips.push("These are marked NEW on the Features & Feats tab. Tap one to clear its badge.");
    if(s.companions.length) tips.push(newCompanionsText(s.companions));
    var optTags = s.features.filter(function(f){ return f.id && f.id.indexOf("opt_")===0; });
    if(optTags.length) tips.push("Your new "+optTags[0].tag.toLowerCase()+(optTags.length>1 ? "s are listed in their" : " is listed in its")+" card on the Features & Feats tab.");
    if(s.features.some(function(f){ return f.tag==="Invocation" || f.tag==="Pact Boon"; })) tips.push("Your Pact Boon and invocations are in the Eldritch invocations card on the Features & Feats tab. Their spells are on the Spells tab.");
    if(total < MAX_LEVEL) tips.push("Next level at "+XP_THRESHOLDS[total+1].toLocaleString()+" XP.");
    else tips.push("You've reached level "+MAX_LEVEL+", the highest level. Congratulations!");
    var th = ce("h5","info-modal-subhead"); th.textContent = "What to do next";
    body.appendChild(th);
    var ul = document.createElement("ul"); ul.className = "lu-tips";
    tips.forEach(function(tip){ var li = document.createElement("li"); li.textContent = tip; ul.appendChild(li); });
    body.appendChild(ul);

    var actions = ce("div","actions");
    var ok = document.createElement("button");
    ok.className = "btn primary"; ok.textContent = "Got it!";
    ok.addEventListener("click", function(){ document.getElementById("info-modal-close").click(); });
    actions.appendChild(ok);
    body.appendChild(actions);
  });
}
