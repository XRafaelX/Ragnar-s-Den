import { INVOCATIONS, invocationsKnownAt, invocationDef, pactBoonDef, invocationLabel } from "../data/invocations.js";
import { SPELL_DATA, catalogSpellName, spellsMatching } from "../data/spells.js";
import { SPELL_DATA_2024 } from "../data/spells-2024.js";
import { uid, mod, totalLevel, featureSpells } from "./helpers.js";
import { featDef, originFeatNames, revertFeatPicks } from "./feat-picks.js";
import { abilityScore, abilityScores } from "./ability-scores.js";

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
/* Invocations learned through a feat (Eldritch Adept), as their catalog
   entries. They give the same spells, uses, speeds and senses as a
   warlock's own, and aren't offered to the warlock again. */
export function featInvocations(c){
  var out = [];
  (c.feats||[]).forEach(function(f){
    var def = featDef(f.name);
    var inv = def && def.invocationPick && f.picks && invocationDef(f.picks.option);
    if(inv && out.indexOf(inv)===-1) out.push(inv);
  });
  return out;
}
/* How many invocations this class entry should know now. */
export function invocationsDue(cl){
  return cl ? invocationsKnownAt(Number(cl.level)||1, cl.edition) : 0;
}

/* ---- The 2024 invocations' cantrip picks ----
   Agonizing Blast, Eldritch Spear and Repelling Blast (2024) each name one
   of the warlock's cantrips (saved as the entry's `spells`), and can be
   learned again for another. */
function cantripData(name){
  var n = catalogSpellName(name);
  return SPELL_DATA_2024[n] || SPELL_DATA[n] || null;
}
/* A cantrip that deals damage ("damage") or needs an attack roll ("attack"). */
export function cantripFits(name, kind){
  var d = cantripData(name);
  if(!d || d.level!==0) return false;
  if(kind==="attack") return /spell attack/i.test(d.summary || "");
  return /\d+d\d+[^.]*damage/i.test(d.summary || "");
}
/* The warlock cantrips this character knows: the Spells tab's warlock
   cantrips and the Book of Shadows'. */
function warlockCantrips(c, cl){
  var out = [];
  function add(n){ if(n && out.indexOf(n)===-1) out.push(n); }
  (c.spells||[]).forEach(function(sp){
    var d = cantripData((sp.name||"").trim());
    if(d && d.level===0 && (sp.learnedBy==="Warlock" || (d.classes||[]).indexOf("Warlock")!==-1)) add((sp.name||"").trim());
  });
  ((cl && cl.pactSpells) || []).forEach(function(n){ var d = cantripData(n); if(d && d.level===0) add(n); });
  knownInvocations(cl).forEach(function(e){
    var d = invocationDef(e.name);
    if(d && d.spellPick && d.spellPick.parts) (e.spells||[]).forEach(function(n){ var x = cantripData(n); if(x && x.level===0) add(n); });
  });
  return out;
}
/* The cantrips each repeatable invocation already names: {name: [cantrips]}. */
function invocationTargets(entries){
  var out = {};
  entries.forEach(function(e){
    var d = invocationDef(e.name);
    if(d && d.spellPick && d.spellPick.known) out[e.name] = (out[e.name] || []).concat(e.spells || []);
  });
  return out;
}
/* A spellPick ready for the pickers: a cantrip pick lists the cantrips
   that fit and aren't named already (`names`). */
export function resolveSpellPick(pick, ctx, invName){
  if(!pick || !pick.known) return pick;
  var used = (ctx && ctx.targets && ctx.targets[invName]) || [];
  var names = ((ctx && ctx.cantrips) || []).filter(function(n){ return cantripFits(n, pick.known) && used.indexOf(n)===-1; });
  return Object.assign({}, pick, {names: names});
}

/* What prerequisites are checked against. Built from the character, with
   `over` for a level-up that hasn't happened yet: {level, pactBoon,
   known (names), pactSpells}. */
export function invocationContext(c, cl, over){
  over = over || {};
  var known = (over.known || knownInvocations(cl).map(function(e){ return e.name; }))
    .concat(featInvocations(c).map(function(inv){ return inv.name; }));
  var pactSpells = over.pactSpells || (cl && cl.pactSpells) || [];
  // A spell known from a feat counts too (Eldritch Blast from Magic
  // Initiate or Spell Sniper, Hex from Fey Touched): the prerequisite asks
  // only that you know it, and only a warlock gets to use it (Eldritch
  // Adept offers non-warlocks just the invocations without one). Not ones
  // the invocations and Pact Boon give themselves.
  var granted = featureSpells(c).filter(function(fs){ return fs.kind!=="expanded" && fs.source!=="Invocation" && fs.source!=="Pact Boon"; })
    .map(function(fs){ return catalogSpellName(fs.name); });
  var spells = (c.spells||[]).map(function(sp){ return (sp.name||"").trim(); }).concat(pactSpells, granted);
  return {
    level: over.level!=null ? over.level : (cl ? Number(cl.level)||1 : 0),
    pactBoon: over.pactBoon!=null ? over.pactBoon : (cl && cl.pactBoon) || "",
    // (The 2024 warlock's invocations: js/data/warlock-2024.js.)
    edition: over.edition!=null ? over.edition : (cl && cl.edition) || "",
    cantrips: over.cantrips || warlockCantrips(c, cl),
    targets: over.targets || invocationTargets(knownInvocations(cl)),
    known: known,
    tasha: over.tasha!=null ? over.tasha : !!c.tashaOptional,
    knowsSpell: function(name){ return spells.indexOf(name)!==-1; },
    // Hexblade's Curse and Sign of Ill Omen count as features that curse.
    curses: (cl && cl.subclass==="The Hexblade") || known.indexOf("Sign of Ill Omen")!==-1
  };
}
/* The context for a new level 1 warlock in the creation wizard (no
   spells, invocations or pact yet). */
export function newWarlockContext(edition){
  return {level: 1, pactBoon: "", edition: edition || "", cantrips: [], targets: {}, known: [], tasha: false,
    knowsSpell: function(){ return false; }, curses: false};
}
/* Why an invocation can't be learned ("" if it can): a short reason the
   pickers show next to it. */
export function invocationReason(inv, ctx){
  if((inv.edition || "")!==(ctx.edition==="2024" ? "2024" : "")) return inv.edition ? "2024 rules" : "2014 rules";
  var known = ctx.known.indexOf(inv.name)!==-1;
  if(known && !inv.repeatable) return "known";
  if(inv.optional && !ctx.tasha) return "Tasha's optional";
  if(inv.level && ctx.level < inv.level) return "warlock " + inv.level;
  // (A 2024 pact is an invocation the warlock knows.)
  if(inv.pact && (inv.edition ? ctx.known.indexOf(inv.pact)===-1 : ctx.pactBoon!==inv.pact)) return "needs " + inv.pact.replace("Pact of the ", "") + " pact";
  if(inv.requires && ctx.known.indexOf(inv.requires)===-1) return "needs " + invocationLabel(inv.requires);
  if(inv.needs==="damageCantrip" || inv.needs==="attackCantrip"){
    var open = resolveSpellPick(inv.spellPick, ctx, inv.name).names;
    if(!open.length) return known ? "known" : inv.needs==="attackCantrip" ? "needs an attack cantrip" : "needs a damage cantrip";
  }
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
  // (Its own cantrip doesn't count as taken.)
  if(ctx.targets[entry.name]) ctx.targets[entry.name] = ctx.targets[entry.name].filter(function(n){ return (entry.spells||[]).indexOf(n)===-1; });
  var why = invocationReason(inv, ctx);
  return why ? "Prerequisite not met: " + why.replace(/^needs /, "") : "";
}
/* Plain-words prerequisite line: "Warlock 5, Pact of the Blade". */
export function invocationPrereqText(inv){
  var bits = [];
  if(inv.level) bits.push("Warlock " + inv.level);
  if(inv.pact) bits.push(inv.pact + (inv.edition ? " invocation" : ""));
  if(inv.requires) bits.push(invocationLabel(inv.requires) + " invocation");
  if(inv.needs==="damageCantrip") bits.push("a warlock cantrip that deals damage");
  if(inv.needs==="attackCantrip") bits.push("a warlock cantrip that deals damage with an attack roll");
  if(inv.needs==="eldritchBlast") bits.push("Eldritch Blast cantrip");
  if(inv.needs==="hex") bits.push("Hex spell or a warlock feature that curses");
  return bits.join(", ");
}

/* Spells a spellPick can choose from (rituals, Tome cantrips), for its
   `i`th picker: a pick with `parts` (the 2024 Tome's three cantrips and two
   rituals) has its own list per part; one with `names` (a cantrip the
   warlock knows) lists those. */
export function pickPart(pick, i){
  if(!pick || !pick.parts) return pick;
  var at = 0;
  for(var p = 0; p < pick.parts.length; p++){ at += pick.parts[p].count; if(i < at) return pick.parts[p]; }
  return pick.parts[pick.parts.length - 1];
}
export function pickOptions(pick, i){
  if(!pick) return [];
  if(pick.names) return pick.names.slice();
  return spellsMatching(pickPart(pick, i || 0));
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
  // (Lessons of the First Ones' feat is picked on its card: originFeatForInvocation.)
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
  // Lessons of the First Ones: its feat goes with it.
  (c.feats||[]).filter(function(f){ return f.fromInvocation===entry.id; }).forEach(function(f){
    revertFeatPicks(c, f);
    c.feats = c.feats.filter(function(x){ return x!==f; });
  });
}

/* ---- Lessons of the First Ones: an Origin feat ----
   The feat is a copy in c.feats tagged `fromInvocation` (the entry's id).
   The Origin feats it can still give: not one it gave already. */
export function lessonsFeatChoices(c, cl){
  var taken = (c.feats||[]).filter(function(f){ return f.fromInvocation; }).map(function(f){ return f.name; });
  return originFeatNames().filter(function(n){ return taken.indexOf(n)===-1; });
}
export function lessonsFeat(c, entry){
  return (c.feats||[]).find(function(f){ return f.fromInvocation===entry.id; }) || null;
}
/* Add the feat for this entry (a copy like the background's Origin feat). */
export function addLessonsFeat(c, entry, name){
  var def = featDef(name);
  if(!def || lessonsFeat(c, entry)) return null;
  var copy = {id: uid(), name: def.name, prerequisite: def.prerequisite, category: def.category, summary: def.summary,
    description: def.description, source: "SRD", fromInvocation: entry.id, from: "Lessons of the First Ones"};
  if(!c.feats) c.feats = [];
  c.feats.push(copy);
  return copy;
}

/* ---- Switching the class's edition (js/core/class-edition.js) ----
   To 2024: each invocation with a 2024 version becomes it (a cantrip pick
   names Eldritch Blast when known), and the Pact Boon becomes its
   invocation. Back to 2014: the reverse. Others stay, and the
   Eldritch invocations card flags any that no longer fit. */
export function convertInvocationsEdition(c, cl, on){
  if(!cl) return;
  var list = knownInvocations(cl).slice();
  if(on){
    list.forEach(function(e){
      var d = invocationDef(e.name + " (2024)");
      if(!d) return;
      e.name = d.name;
      if(d.spellPick && d.spellPick.known) e.spells = (c.spells||[]).some(function(sp){ return (sp.name||"").trim()==="Eldritch Blast"; }) ? ["Eldritch Blast"] : [];
    });
    if(cl.pactBoon && invocationDef(cl.pactBoon) && !list.some(function(e){ return e.name===cl.pactBoon; })){
      if(!Array.isArray(cl.invocations)) cl.invocations = [];
      cl.invocations.unshift({id: uid(), name: cl.pactBoon, spells: cl.pactBoon==="Pact of the Tome" ? (cl.pactSpells||[]).slice() : [], applied: {skills: []}});
      delete cl.pactBoon; delete cl.pactSpells;
    }
  } else {
    list.forEach(function(e){
      var d = invocationDef(e.name);
      if(!d || !d.edition) return;
      if(d.pactInvocation){
        cl.pactBoon = d.name;
        cl.pactSpells = d.name==="Pact of the Tome" ? (e.spells||[]).filter(function(n){ var x = cantripData(n); return x && x.level===0; }).slice(0, 3) : [];
        forgetInvocation(c, cl, e.id);
        return;
      }
      var old = invocationDef(invocationLabel(e.name));
      if(old && !old.edition){ e.name = old.name; e.spells = []; }
    });
  }
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
      var label = invocationLabel(inv.name);
      (inv.spells||[]).forEach(function(s){ add(s.name, s.kind, "Invocation", label, label + ": " + inv.text); });
      // (A cantrip pick names one the warlock knows: no new spell.)
      if(inv.spellPick && inv.spellPick.known) return;
      var kind = (inv.spellPick && inv.spellPick.kind) || "ritual";
      var note = (inv.spellPick && inv.spellPick.note) || "Book of Ancient Secrets: cast it only as a ritual, with your Book of Shadows in hand.";
      (e.spells||[]).forEach(function(n){ add(n, kind, "Invocation", label, note); });
    });
  });
  featInvocations(c).forEach(function(inv){
    (inv.spells||[]).forEach(function(s){ add(s.name, s.kind, "Invocation", inv.name, inv.name + ": " + inv.text); });
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
    add("inv:" + def.name, def.uses.name || invocationLabel(def.name), label, def.text.split(". ")[0] + ".", max, def.uses.reset);
  }
  function fromInvocation(inv){
    if(inv.uses) fromUses(inv, "Invocation");
    (inv.spells||[]).forEach(function(s){
      if(s.kind!=="free" && s.kind!=="slot") return;
      add("inv:" + inv.name + ":" + s.name, s.name + " (" + invocationLabel(inv.name) + ")", "Invocation",
        s.kind==="slot" ? "Cast " + s.name + " once with a warlock spell slot. It comes back on a long rest." : "Cast " + s.name + " once without a spell slot. It comes back on a long rest.",
        1, "long");
    });
  }
  (c.classes||[]).forEach(function(cl){
    if(cl.name!=="Warlock") return;
    var boon = (Number(cl.level)||1) >= 3 && pactBoonDef(cl.pactBoon);
    if(boon && boon.uses) fromUses(boon, "Pact Boon");
    knownInvocations(cl).forEach(function(e){
      var inv = invocationDef(e.name);
      if(inv) fromInvocation(inv);
    });
  });
  featInvocations(c).forEach(fromInvocation);
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
  featInvocations(c).forEach(function(inv){ if(inv.speeds) out.push({name: inv.name, speeds: inv.speeds}); });
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
  featInvocations(c).forEach(function(inv){ if(inv.sight && out.indexOf(inv.sight)===-1) out.push(inv.sight); });
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
    // (A 2024 one counts when its cantrip is Eldritch Blast.)
    if(inv.spellPick && inv.spellPick.known && (e.spells||[]).indexOf("Eldritch Blast")===-1) return;
    if(inv.blast.damage) out.bonus = mod(abilityScore(c, "cha"));
    if(inv.blast.range) out.range = inv.blast.range;
    if(inv.blast.rangePerLevel) out.range = 120 + inv.blast.rangePerLevel * (Number(cl.level)||1);
    if(inv.blast.rider) out.riders.push(inv.blast.rider);
    out.by.push(invocationLabel(inv.name));
  });
  // Spell Sniper doubles the range of a spell that needs an attack roll.
  if((c.feats||[]).some(function(f){ return f.name==="Spell Sniper"; })) out.range *= 2;
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
/* `pactChange`: Eldritch Versatility (Tasha's) replaces the Pact Boon at
   this level, so it's picked again. */
/* `edition`: the class's edition for a new multiclass ("2024": an
   invocation from level 1 and no Pact Boon). */
export function levelUpPlan(cl, newLevel, swapOut, pactChange, edition){
  var known = knownInvocations(cl);
  var ed = cl ? cl.edition || "" : edition || "";
  var fresh = Math.max(0, invocationsKnownAt(newLevel, ed) - known.length);
  var swapping = !!swapOut && known.some(function(e){ return e.id===swapOut; });
  return {
    applies: newLevel >= (ed==="2024" ? 1 : 2),
    pactDue: ed!=="2024" && newLevel >= 3 && (!(cl && cl.pactBoon) || !!pactChange),
    pactChange: !!(pactChange && cl && cl.pactBoon),
    fresh: fresh,
    slots: fresh + (swapping ? 1 : 0)
  };
}
/* Prerequisites as they'll stand after the level-up. The invocation being
   swapped out no longer counts as known. */
export function levelUpContext(c, cl, newLevel, choice){
  var plan = levelUpPlan(cl, newLevel, choice.swapOut, choice.pactChange, choice.edition);
  var staying = knownInvocations(cl).filter(function(e){ return e.id!==choice.swapOut; });
  return invocationContext(c, cl, {
    level: newLevel,
    pactBoon: plan.pactDue ? choice.pactBoon || "" : (cl && cl.pactBoon) || "",
    pactSpells: plan.pactDue ? (choice.pactSpells||[]).filter(Boolean) : null,
    edition: cl ? cl.edition || "" : choice.edition || "",
    targets: invocationTargets(staying),
    known: staying.map(function(e){ return e.name; })
  });
}
/* Every picker of a spellPick holds a different spell from its list. */
export function spellPickComplete(pick, values){
  var got = (values||[]).slice(0, pick.count).filter(function(v, i){ return pickOptions(pick, i).indexOf(v)!==-1; });
  return got.length===pick.count && new Set(got).size===pick.count;
}
var picksComplete = spellPickComplete;
/* A known invocation another one needs (a 2024 pact, Thirsting Blade for
   Devouring Blade): the name of the one that needs it, or "". */
export function neededBy(cl, entry){
  var other = knownInvocations(cl).find(function(e){
    var d = e.id!==entry.id && invocationDef(e.name);
    return d && d.edition && (d.pact===entry.name || d.requires===entry.name);
  });
  return other ? invocationLabel(other.name) : "";
}
/* What's still missing or wrong, in words, or null when the choices are complete. */
export function levelUpProblem(c, cl, newLevel, choice){
  var plan = levelUpPlan(cl, newLevel, choice.swapOut, choice.pactChange, choice.edition);
  if(!plan.applies) return null;
  // (You can't replace an invocation another one needs.)
  var out = choice.swapOut && knownInvocations(cl).find(function(e){ return e.id===choice.swapOut; });
  var needer = out && neededBy(cl, out);
  if(needer) return invocationLabel(out.name) + " is needed by your " + needer + ". Keep it, or swap " + needer + " instead.";
  if(plan.pactDue){
    var boon = pactBoonDef(choice.pactBoon);
    if(plan.pactChange && (!boon || boon.name===cl.pactBoon)) return "Choose the Pact Boon that replaces your "+cl.pactBoon+".";
    if(!boon || (boon.optional && !c.tashaOptional)) return "Choose your Pact Boon.";
    if(boon.spellPick && !picksComplete(boon.spellPick, choice.pactSpells)) return "Choose "+boon.spellPick.count+" "+boon.spellPick.label+" for your "+boon.name+".";
  }
  // A new Pact Boon leaves invocations that need the old one stranded:
  // the one swap this level can replace one of them.
  if(plan.pactChange){
    var stranded = knownInvocations(cl).filter(function(e){
      var d = invocationDef(e.name);
      return e.id!==choice.swapOut && d && d.pact && d.pact!==choice.pactBoon;
    });
    if(stranded.length) return stranded.map(function(e){ return e.name; }).join(" and ")+" need"+(stranded.length===1 ? "s" : "")+" your "+cl.pactBoon+
      (stranded.length===1 ? ". Swap it out below, or keep your Pact Boon." : ". Keep your Pact Boon (you can swap only one invocation a level).");
  }
  var n = plan.slots, ctx = levelUpContext(c, cl, newLevel, choice);
  var picks = (choice.picks||[]).slice(0, n);
  if(picks.filter(Boolean).length < n || new Set(picks).size < n) return n===1 ? "Choose your new invocation." : "Choose "+n+" different invocations.";
  for(var i=0;i<picks.length;i++){
    var inv = invocationDef(picks[i]);
    var why = inv ? invocationReason(inv, ctx) : "unknown";
    if(why) return invocationLabel(picks[i])+" can't be learned now ("+why+"). Pick another.";
    if(inv.spellPick && !picksComplete(resolveSpellPick(inv.spellPick, ctx, inv.name), (choice.pickSpells||{})[inv.name]))
      return inv.spellPick.known ? "Choose the cantrip for "+invocationLabel(inv.name)+"." : "Choose "+inv.spellPick.count+" "+inv.spellPick.label+" for "+invocationLabel(inv.name)+".";
  }
  return null;
}
/* Apply the choices to the class entry. Returns what undoLevelUpChoices
   needs ({pactBoonSet, invAdded, invSwappedOut}) and the unlock cards
   for the popup ({gained}). Call with the entry's level not yet changed
   or already changed: only `newLevel` is used. */
export function applyLevelUpChoices(c, cl, newLevel, choice){
  var plan = levelUpPlan(cl, newLevel, choice.swapOut, choice.pactChange, choice.edition);
  var out = {pactBoonSet: false, invAdded: [], invSwappedOut: null, gained: []};
  if(!plan.applies) return out;
  if(plan.pactDue && pactBoonDef(choice.pactBoon)){
    // Eldritch Versatility: undo puts the old boon (and its Book of
    // Shadows cantrips) back.
    if(plan.pactChange) out.pactBoonPrev = {pactBoon: cl.pactBoon, pactSpells: (cl.pactSpells||[]).slice()};
    cl.pactBoon = choice.pactBoon;
    cl.pactSpells = (choice.pactSpells||[]).filter(Boolean);
    out.pactBoonSet = true;
    out.gained.push({id:"pact_"+choice.pactBoon, name:choice.pactBoon, text:pactBoonDef(choice.pactBoon).summary, subclass:false, tag:"Pact Boon"});
  }
  if(plan.slots > plan.fresh) out.invSwappedOut = forgetInvocation(c, cl, choice.swapOut);
  (choice.picks||[]).slice(0, plan.slots).forEach(function(name){
    var learned = learnInvocation(c, cl, name, (choice.pickSpells||{})[name]);
    out.invAdded.push(learned.id);
    var def = invocationDef(name) || {};
    out.gained.push({id:"inv_"+learned.id, name:invocationLabel(name), text:(def.text || "") + (def.featPick ? " Choose the feat on the Eldritch invocations card (Features tab)." : ""), subclass:false, tag:"Invocation"});
  });
  return out;
}
/* Take back what applyLevelUpChoices did (rec: its result, as saved in
   the level history). */
export function undoLevelUpChoices(c, cl, rec){
  (rec.invAdded||[]).forEach(function(id){ forgetInvocation(c, cl, id); });
  if(rec.invSwappedOut) restoreInvocation(c, cl, rec.invSwappedOut);
  if(rec.pactBoonPrev){ cl.pactBoon = rec.pactBoonPrev.pactBoon; cl.pactSpells = rec.pactBoonPrev.pactSpells; }
  else if(rec.pactBoonSet){ delete cl.pactBoon; delete cl.pactSpells; }
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
  if(ctx.edition==="2024"){
    if(why.some(function(w){ return /cantrip$/.test(w); })) notes.push("Agonizing Blast, Eldritch Spear and Repelling Blast need a warlock cantrip that deals damage, such as Eldritch Blast (add it on the Spells tab).");
    if(why.some(function(w){ return /^needs .* pact$/.test(w); })) notes.push("Some need a Pact invocation (Pact of the Blade, Chain or Tome) learned first.");
    if(why.some(function(w){ return /^warlock /.test(w); })) notes.push("More unlock at higher warlock levels.");
    return notes;
  }
  if(why.indexOf("needs Eldritch Blast")!==-1) notes.push("Eldritch Blast upgrades such as Agonizing Blast appear once you know the Eldritch Blast cantrip (add it on the Spells tab).");
  if(why.some(function(w){ return /^needs .* pact$/.test(w); })) notes.push(ctx.pactBoon ? "Some need a different Pact Boon than your "+ctx.pactBoon+"." : "Some need a Pact Boon, which you choose at warlock level 3.");
  if(why.indexOf("needs Hex")!==-1) notes.push("Maddening Hex and Relentless Hex need the Hex spell or a curse (Sign of Ill Omen, Hexblade's Curse).");
  if(why.some(function(w){ return /^warlock /.test(w); })) notes.push("More unlock at higher warlock levels.");
  if(why.indexOf("Tasha's optional")!==-1) notes.push("Tasha's Cauldron adds 8 more if your character uses Tasha's optional class features (Information tab).");
  return notes;
}
