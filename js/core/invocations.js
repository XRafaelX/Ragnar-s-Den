import { INVOCATIONS, invocationsKnownAt, invocationDef, pactBoonDef } from "../data/invocations.js";
import { SPELL_DATA, catalogSpellName, spellsMatching } from "../data/spells.js";
import { uid, mod, totalLevel } from "./helpers.js";

/* ---------------- Eldritch invocations and the Pact Boon ----------------
   Saved on the warlock's class entry:
     cl.pactBoon     "Pact of the Tome", ... (chosen at warlock level 3)
     cl.pactSpells   the Pact of the Tome's three cantrips
     cl.invocations  [{id, name, spells, applied}]: `spells` are its picks
                     (Book of Ancient Secrets' two rituals); `applied` is
                     what learning it changed on the sheet (Beguiling
                     Influence's skills, minus any already proficient), so
                     forgetting it takes back exactly that.
   The spells, uses, speeds and senses they give are worked out from these
   (featureSpells, characterResources, computeSpeed, getCharacterSenses),
   so they follow level-ups, undo and forgetting without being saved. */

export function warlockEntry(c){
  return (c.classes||[]).find(function(cl){ return cl.name==="Warlock"; }) || null;
}
export function knownInvocations(cl){
  return cl && Array.isArray(cl.invocations) ? cl.invocations : [];
}
/* How many invocations this class entry should know now. */
export function invocationsDue(cl){
  return cl ? invocationsKnownAt(Number(cl.level)||1) : 0;
}

/* What prerequisites are checked against. Built from the character, with
   `over` for a level-up that hasn't happened yet: {level, pactBoon,
   known (names), pactSpells}. */
export function invocationContext(c, cl, over){
  over = over || {};
  var known = over.known || knownInvocations(cl).map(function(e){ return e.name; });
  var pactSpells = over.pactSpells || (cl && cl.pactSpells) || [];
  var spells = (c.spells||[]).map(function(sp){ return (sp.name||"").trim(); }).concat(pactSpells);
  return {
    level: over.level!=null ? over.level : (cl ? Number(cl.level)||1 : 0),
    pactBoon: over.pactBoon!=null ? over.pactBoon : (cl && cl.pactBoon) || "",
    known: known,
    knowsSpell: function(name){ return spells.indexOf(name)!==-1; },
    // Hexblade's Curse and Sign of Ill Omen count as features that curse.
    curses: (cl && cl.subclass==="The Hexblade") || known.indexOf("Sign of Ill Omen")!==-1
  };
}
/* Why an invocation can't be learned ("" if it can): a short reason the
   pickers show next to it. */
export function invocationReason(inv, ctx){
  if(ctx.known.indexOf(inv.name)!==-1) return "known";
  if(inv.level && ctx.level < inv.level) return "warlock " + inv.level;
  if(inv.pact && ctx.pactBoon!==inv.pact) return "needs " + inv.pact.replace("Pact of the ", "") + " pact";
  if(inv.needs==="eldritchBlast" && !ctx.knowsSpell("Eldritch Blast")) return "needs Eldritch Blast";
  if(inv.needs==="hex" && !ctx.knowsSpell("Hex") && !ctx.curses) return "needs Hex";
  return "";
}
/* The same in words, for a known invocation whose prerequisite is gone
   (Eldritch Blast removed from the spells): "" when it's still met. */
export function invocationBroken(c, cl, entry){
  var inv = invocationDef(entry.name);
  if(!inv) return "";
  var ctx = invocationContext(c, cl);
  ctx.known = ctx.known.filter(function(n){ return n!==entry.name; });
  var why = invocationReason(inv, ctx);
  return why ? "Prerequisite not met: " + why.replace(/^needs /, "") : "";
}
/* Plain-words prerequisite line: "Warlock 5, Pact of the Blade". */
export function invocationPrereqText(inv){
  var bits = [];
  if(inv.level) bits.push("Warlock " + inv.level);
  if(inv.pact) bits.push(inv.pact);
  if(inv.needs==="eldritchBlast") bits.push("Eldritch Blast cantrip");
  if(inv.needs==="hex") bits.push("Hex spell or a warlock feature that curses");
  return bits.join(", ");
}

/* Spells a spellPick can choose from (rituals, Tome cantrips). */
export function pickOptions(pick){
  return pick ? spellsMatching(pick) : [];
}
/* Picks still to make: [{kind:"pact"|"invocation", entry, def, have}]. */
export function pendingInvocationPicks(cl){
  var out = [];
  var boon = cl && pactBoonDef(cl.pactBoon);
  if(boon && boon.spellPick && (cl.pactSpells||[]).length < boon.spellPick.count) out.push({kind:"pact", def:boon});
  knownInvocations(cl).forEach(function(e){
    var inv = invocationDef(e.name);
    if(inv && inv.spellPick && (e.spells||[]).length < inv.spellPick.count) out.push({kind:"invocation", entry:e, def:inv});
  });
  return out;
}

/* ---- Learning and forgetting ---- */
export function learnInvocation(c, cl, name, spells){
  var entry = {id: uid(), name: name, spells: (spells||[]).filter(Boolean)};
  applyInvocation(c, entry);
  if(!Array.isArray(cl.invocations)) cl.invocations = [];
  cl.invocations.push(entry);
  return entry;
}
/* Put back a forgotten entry as it was (undoing a level-up's swap). */
export function restoreInvocation(c, cl, entry){
  applyInvocation(c, entry);
  if(!Array.isArray(cl.invocations)) cl.invocations = [];
  cl.invocations.push(entry);
}
export function forgetInvocation(c, cl, id){
  var entry = knownInvocations(cl).find(function(e){ return e.id===id; });
  if(!entry) return null;
  revertInvocation(c, entry);
  cl.invocations = cl.invocations.filter(function(e){ return e.id!==id; });
  return entry;
}
function applyInvocation(c, entry){
  var inv = invocationDef(entry.name);
  entry.applied = {skills: []};
  if(!inv || !inv.skills) return;
  if(!c.skillProfs) c.skillProfs = {};
  inv.skills.forEach(function(sk){
    var e = c.skillProfs[sk] || {prof:false, expertise:false};
    if(!e.prof){ e.prof = true; entry.applied.skills.push(sk); }
    c.skillProfs[sk] = e;
  });
}
function revertInvocation(c, entry){
  ((entry.applied && entry.applied.skills) || []).forEach(function(sk){
    if(c.skillProfs && c.skillProfs[sk]){ c.skillProfs[sk].prof = false; c.skillProfs[sk].expertise = false; }
  });
  delete entry.applied;
}

/* ---- What they give on the sheet ---- */
var NOTE_BY_KIND = {
  atwill: "At will, without a spell slot.",
  free: "Once per long rest without a spell slot.",
  slot: "Once per long rest, using a warlock spell slot."
};
/* Spells from the Pact Boon and invocations, shaped like featureSpells'
   entries ({name, data, level, kind, source, feature, note}). */
export function invocationSpells(c){
  var out = [];
  function add(name, kind, source, feature, note){
    if(!name || out.some(function(x){ return x.name===name; })) return;
    var data = SPELL_DATA[catalogSpellName(name)] || null;
    out.push({name: name, data: data, level: data ? data.level : 0, kind: kind, source: source, feature: feature, note: note, className: "Warlock"});
  }
  (c.classes||[]).forEach(function(cl){
    if(cl.name!=="Warlock") return;
    var boon = (Number(cl.level)||1) >= 3 && pactBoonDef(cl.pactBoon);
    if(boon){
      (boon.spells||[]).forEach(function(s){ add(s.name, s.kind, "Pact Boon", boon.name, s.note); });
      (cl.pactSpells||[]).forEach(function(n){ add(n, "known", "Pact Boon", boon.name, "From your Book of Shadows: cast it at will while the book is on you. It counts as a warlock spell."); });
    }
    knownInvocations(cl).forEach(function(e){
      var inv = invocationDef(e.name);
      if(!inv) return;
      (inv.spells||[]).forEach(function(s){ add(s.name, s.kind, "Invocation", inv.name, inv.name + ": " + inv.text); });
      (e.spells||[]).forEach(function(n){ add(n, "ritual", "Invocation", inv.name, "Book of Ancient Secrets: cast it only as a ritual, with your Book of Shadows in hand."); });
    });
  });
  return out;
}
/* Limited uses, as characterResources entries. `m.pb` is the proficiency bonus. */
export function invocationResources(c, m){
  var out = [];
  function add(key, name, source, hint, max, reset){
    out.push({key: key, name: name, source: source, hint: hint, pool: false, max: max,
      used: Math.max(0, Math.min(max, Number((c.resourcesUsed||{})[key])||0)), reset: reset});
  }
  function fromUses(def, label){
    var max = def.uses.max==="pb" ? m.pb : Number(def.uses.max)||1;
    add("inv:" + def.name, def.uses.name || def.name, label, def.text.split(". ")[0] + ".", max, def.uses.reset);
  }
  (c.classes||[]).forEach(function(cl){
    if(cl.name!=="Warlock") return;
    var boon = (Number(cl.level)||1) >= 3 && pactBoonDef(cl.pactBoon);
    if(boon && boon.uses) fromUses(boon, "Pact Boon");
    knownInvocations(cl).forEach(function(e){
      var inv = invocationDef(e.name);
      if(!inv) return;
      if(inv.uses) fromUses(inv, "Invocation");
      (inv.spells||[]).forEach(function(s){
        if(s.kind!=="free" && s.kind!=="slot") return;
        add("inv:" + inv.name + ":" + s.name, s.name + " (" + inv.name + ")", "Invocation",
          s.kind==="slot" ? "Cast " + s.name + " once with a warlock spell slot; back on a long rest." : "Cast " + s.name + " once without a spell slot; back on a long rest.",
          1, "long");
      });
    });
  });
  return out;
}
/* Speeds from invocations (Gift of the Depths), shaped like features':
   [{name, speeds}]. */
export function invocationSpeedSources(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    knownInvocations(cl).forEach(function(e){
      var inv = invocationDef(e.name);
      if(inv && inv.speeds) out.push({name: inv.name, speeds: inv.speeds});
    });
  });
  return out;
}
/* Extra senses: "Devil's Sight 120 ft". */
export function invocationSenses(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    knownInvocations(cl).forEach(function(e){
      var inv = invocationDef(e.name);
      if(inv && inv.sight) out.push(inv.sight);
    });
  });
  return out;
}

/* Eldritch Blast with the invocations that change it, for the card:
   {beams, dice, bonus, range, riders, by} or null if the warlock doesn't
   know the cantrip. Beams go up at character levels 5, 11 and 17. */
export function eldritchBlastSummary(c){
  var cl = warlockEntry(c);
  if(!cl || !invocationContext(c, cl).knowsSpell("Eldritch Blast")) return null;
  var lv = totalLevel(c);
  var out = {beams: lv>=17 ? 4 : lv>=11 ? 3 : lv>=5 ? 2 : 1, dice: "1d10", bonus: 0, range: 120, riders: [], by: []};
  knownInvocations(cl).forEach(function(e){
    var inv = invocationDef(e.name);
    if(!inv || !inv.blast) return;
    if(inv.blast.damage) out.bonus = mod(c.abilities && c.abilities.cha);
    if(inv.blast.range) out.range = inv.blast.range;
    if(inv.blast.rider) out.riders.push(inv.blast.rider);
    out.by.push(inv.name);
  });
  return out;
}

/* Invocations an older sheet has as custom features ("Agonizing Blast",
   "Eldritch Invocation: Devil's Sight"), from before the sheet knew them. */
export function customInvocationFeatures(c){
  return (c.features||[]).filter(function(f){ return !!invocationFromFeatureName(f.name); });
}
function invocationFromFeatureName(name){
  var bare = String(name||"").replace(/^\s*(eldritch\s+)?invocations?\s*[:\-]\s*/i, "").trim().toLowerCase();
  var inv = INVOCATIONS.find(function(i){ return i.name.toLowerCase()===bare; });
  return inv ? inv.name : "";
}
/* Move those custom features into the invocation list (skipping ones
   already known). Returns the names moved. */
export function adoptCustomInvocations(c, cl){
  var moved = [];
  customInvocationFeatures(c).forEach(function(f){
    var name = invocationFromFeatureName(f.name);
    if(!knownInvocations(cl).some(function(e){ return e.name===name; })){ learnInvocation(c, cl, name, []); moved.push(name); }
    c.features = c.features.filter(function(x){ return x!==f; });
  });
  return moved;
}

/* ---- A warlock level-up's choices ----
   The level-up dialog keeps `choice` = {pactBoon, pactSpells, picks,
   pickSpells: {name: [spells]}, swapOut: id of a known invocation to
   replace}. `cl` is the warlock's class entry before the level-up (null
   for a new multiclass) and `newLevel` the warlock level it reaches. */
export function levelUpPlan(cl, newLevel, swapOut){
  var known = knownInvocations(cl);
  var fresh = Math.max(0, invocationsKnownAt(newLevel) - known.length);
  var swapping = !!swapOut && known.some(function(e){ return e.id===swapOut; });
  return {
    applies: newLevel >= 2,
    pactDue: newLevel >= 3 && !(cl && cl.pactBoon),
    fresh: fresh,
    slots: fresh + (swapping ? 1 : 0)
  };
}
/* Prerequisites as they'll stand after the level-up. The invocation being
   swapped out no longer counts as known. */
export function levelUpContext(c, cl, newLevel, choice){
  var plan = levelUpPlan(cl, newLevel, choice.swapOut);
  return invocationContext(c, cl, {
    level: newLevel,
    pactBoon: plan.pactDue ? choice.pactBoon || "" : (cl && cl.pactBoon) || "",
    pactSpells: plan.pactDue ? (choice.pactSpells||[]).filter(Boolean) : null,
    known: knownInvocations(cl).filter(function(e){ return e.id!==choice.swapOut; }).map(function(e){ return e.name; })
  });
}
function picksComplete(pick, values){
  var options = pickOptions(pick);
  var got = (values||[]).slice(0, pick.count).filter(function(v){ return options.indexOf(v)!==-1; });
  return got.length===pick.count && new Set(got).size===pick.count;
}
/* What's still missing or wrong, in words, or null when the choices are complete. */
export function levelUpProblem(c, cl, newLevel, choice){
  var plan = levelUpPlan(cl, newLevel, choice.swapOut);
  if(!plan.applies) return null;
  if(plan.pactDue){
    var boon = pactBoonDef(choice.pactBoon);
    if(!boon) return "Choose your Pact Boon.";
    if(boon.spellPick && !picksComplete(boon.spellPick, choice.pactSpells)) return "Choose "+boon.spellPick.count+" "+boon.spellPick.label+" for your "+boon.name+".";
  }
  var n = plan.slots, ctx = levelUpContext(c, cl, newLevel, choice);
  var picks = (choice.picks||[]).slice(0, n);
  if(picks.filter(Boolean).length < n || new Set(picks).size < n) return n===1 ? "Choose your new invocation." : "Choose "+n+" different invocations.";
  for(var i=0;i<picks.length;i++){
    var inv = invocationDef(picks[i]);
    var why = inv ? invocationReason(inv, ctx) : "unknown";
    if(why) return picks[i]+" can't be learned now ("+why+"). Pick another.";
    if(inv.spellPick && !picksComplete(inv.spellPick, (choice.pickSpells||{})[inv.name])) return "Choose "+inv.spellPick.count+" "+inv.spellPick.label+" for "+inv.name+".";
  }
  return null;
}
/* Apply the choices to the class entry. Returns what undoLevelUpChoices
   needs ({pactBoonSet, invAdded, invSwappedOut}) and the unlock cards
   for the popup ({gained}). Call with the entry's level not yet changed
   or already changed: only `newLevel` is used. */
export function applyLevelUpChoices(c, cl, newLevel, choice){
  var plan = levelUpPlan(cl, newLevel, choice.swapOut);
  var out = {pactBoonSet: false, invAdded: [], invSwappedOut: null, gained: []};
  if(!plan.applies) return out;
  if(plan.pactDue && pactBoonDef(choice.pactBoon)){
    cl.pactBoon = choice.pactBoon;
    cl.pactSpells = (choice.pactSpells||[]).filter(Boolean);
    out.pactBoonSet = true;
    out.gained.push({id:"pact_"+choice.pactBoon, name:choice.pactBoon, text:pactBoonDef(choice.pactBoon).summary, subclass:false, tag:"Pact Boon"});
  }
  if(plan.slots > plan.fresh) out.invSwappedOut = forgetInvocation(c, cl, choice.swapOut);
  (choice.picks||[]).slice(0, plan.slots).forEach(function(name){
    var learned = learnInvocation(c, cl, name, (choice.pickSpells||{})[name]);
    out.invAdded.push(learned.id);
    out.gained.push({id:"inv_"+learned.id, name:name, text:(invocationDef(name)||{}).text || "", subclass:false, tag:"Invocation"});
  });
  return out;
}
/* Take back what applyLevelUpChoices did (rec: its result, as saved in
   the level history). */
export function undoLevelUpChoices(c, cl, rec){
  (rec.invAdded||[]).forEach(function(id){ forgetInvocation(c, cl, id); });
  if(rec.invSwappedOut) restoreInvocation(c, cl, rec.invSwappedOut);
  if(rec.pactBoonSet){ delete cl.pactBoon; delete cl.pactSpells; }
}

/* ---- What a picker lists ----
   Only the invocations the warlock can learn right now (the user asked
   for unavailable ones to be left out, not greyed). */
export function availableInvocations(ctx){
  return INVOCATIONS.filter(function(inv){ return !invocationReason(inv, ctx); });
}
/* Why some invocations aren't listed, in plain words, so a new player
   knows how to unlock them: [] when nothing is hidden except ones known. */
export function hiddenInvocationNotes(ctx){
  var why = INVOCATIONS.map(function(inv){ return invocationReason(inv, ctx); });
  var notes = [];
  if(why.indexOf("needs Eldritch Blast")!==-1) notes.push("Eldritch Blast upgrades such as Agonizing Blast appear once you know the Eldritch Blast cantrip (add it on the Spells tab).");
  if(why.some(function(w){ return /^needs .* pact$/.test(w); })) notes.push(ctx.pactBoon ? "Some need a different Pact Boon than your "+ctx.pactBoon+"." : "Some need a Pact Boon, which you choose at warlock level 3.");
  if(why.indexOf("needs Hex")!==-1) notes.push("Maddening Hex and Relentless Hex need the Hex spell or a curse (Sign of Ill Omen, Hexblade's Curse).");
  if(why.some(function(w){ return /^warlock /.test(w); })) notes.push("More unlock at higher warlock levels.");
  return notes;
}
