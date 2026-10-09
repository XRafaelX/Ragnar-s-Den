/* Spells a class learns on a level-up, and how many it knows now.

   Spells on the sheet (c.spells) learned through the level-up or the
   creation wizard carry `learnedBy` (the class name). Older spells have
   none; they belong to the character's only spellcasting class when it
   has one, otherwise to no class (counts then fall back to the table's
   gain for the level). Mystic Arcanum spells (`arcanum`) and a Lore
   bard's Additional Magical Secrets (`bonusSecret`) don't count against
   spells known.

   learnPlan() returns what the New spells step asks for:
     sections   [{id, title, help, count, names, tags, kind}]: a pick list
                each; kind "cantrip", "spell", "arcanum" or "bonus"
     swap       {known: [spell names], maxLevel} when the class may
                replace a spell it knows, else null
     auto       cantrips learned for free (an Arcane Trickster's Mage Hand)
     summary    the step's lead text */
import { SPELL_DATA, spellDataForClass, catalogSpellName } from "../data/spells.js";
import { KNOWN_CASTERS, SUBCLASS_CASTERS, MAGICAL_SECRETS_LEVELS, LORE_SECRETS, MYSTIC_ARCANUM, PREPARED_CASTERS } from "../data/spells-known.js";
import { featureSpells, classFeatureList, classExtraSpellLists, classCasterType, mod, ordinal } from "./helpers.js";
import { spellFromCatalog } from "../render/panels/spell-picker.js";

/* The casting rules for a class (or its casting subclass), or null. */
export function casterDef(className, subclass){
  return SUBCLASS_CASTERS[className + ":" + (subclass || "")] || KNOWN_CASTERS[className] || null;
}
/* True when the class knows a fixed set of spells (no preparing). */
export function knowsSpells(className, subclass){
  var def = casterDef(className, subclass);
  return !!(def && def.spells);
}

function spellKey(name){ return catalogSpellName((name || "").trim()).toLowerCase(); }

/* Names of spells features grant outright (domain spells, a Celestial's
   cantrips): they're never picked, and an older copy on the sheet isn't
   counted as learned. */
function grantedNames(c){
  return featureSpells(c).filter(function(fs){ return fs.kind!=="expanded"; }).map(function(fs){ return spellKey(fs.name); });
}

/* The class that owns spells with no learnedBy: the character's only
   spellcasting class, else none. */
function untaggedOwner(c){
  var casters = (c.classes||[]).filter(function(cl){ return classCasterType(cl); });
  return casters.length===1 ? casters[0].name : "";
}

/* Spells on the sheet that count for `className`: {spells, cantrips,
   certain}. `certain` is false when untagged spells could belong to it
   but can't be told apart (two or more spellcasting classes). */
export function classKnownSpells(c, className){
  var granted = grantedNames(c);
  var owner = untaggedOwner(c);
  var anyUntagged = false;
  var mine = (c.spells||[]).filter(function(sp){
    if(sp.arcanum || sp.bonusSecret) return false;
    if(sp.learnedBy) return sp.learnedBy===className;
    if(granted.indexOf(spellKey(sp.name))!==-1) return false;
    anyUntagged = true;
    return owner===className;
  });
  var isCaster = (c.classes||[]).some(function(cl){ return cl.name===className; });
  return {
    spells: mine.filter(function(sp){ return (sp.level||0) > 0; }),
    cantrips: mine.filter(function(sp){ return !(sp.level||0); }),
    certain: !anyUntagged || owner===className || !isCaster
  };
}

/* Spell names (catalog) the class can learn of the given levels: its
   own list, a patron's expanded list, a Divine Soul's cleric list. */
function classListNames(entry, def, levels){
  var data = spellDataForClass(def.list);
  var extra = {};
  if(def.list===entry.name){
    // Expanded lists only add to a class's own list (not a third caster's).
    var lv = Number(entry.level)||1;
    classFeatureList(entry).forEach(function(f){
      if(f.spellKind!=="expanded") return;
      var names = spellsUpTo(f.spells, lv);
      var pick = f.spellChoice && (entry.spellChoices||{})[f.spellChoice.id];
      if(pick && f.spellChoice.options[pick]) names = names.concat(spellsUpTo(f.spellChoice.options[pick], lv));
      names.forEach(function(n){ n = catalogSpellName(n); if(SPELL_DATA[n]) extra[n] = "Patron spell"; });
    });
    classExtraSpellLists(entry).forEach(function(list){
      Object.keys(spellDataForClass(list)).forEach(function(n){ if(!extra[n]) extra[n] = list + " spell"; });
    });
  }
  // A patron's spells lead the list, so a warlock sees them first.
  var patron = function(n){ return extra[n]==="Patron spell" ? 0 : 1; };
  var out = Object.keys(data).concat(Object.keys(extra).filter(function(n){ return !data[n]; }))
    .filter(function(n){ return levels.indexOf(SPELL_DATA[n].level)!==-1; })
    .sort(function(a, b){ return patron(a) - patron(b) || a.localeCompare(b); });
  return {names: out, extra: extra};
}
function spellsUpTo(spells, lv){
  if(!spells) return [];
  if(Array.isArray(spells)) return spells;
  return Object.keys(spells).filter(function(k){ return Number(k) <= lv; })
    .reduce(function(a, k){ return a.concat(spells[k]); }, []);
}
function range(from, to){ var out = []; for(var i = from; i <= to; i++) out.push(i); return out; }
function allSpellsOf(levels){
  return Object.keys(SPELL_DATA).filter(function(n){ return levels.indexOf(SPELL_DATA[n].level)!==-1; }).sort();
}

/* What the New spells step asks for when `className` reaches `newLevel`.
   `entry` is the class entry as it will be (name, subclass, level,
   spellChoices); `existing` says whether the class was already there. */
export function learnPlan(c, entry, isNewClass){
  var def = casterDef(entry.name, entry.subclass);
  var empty = {sections: [], swap: null, auto: [], summary: "", note: ""};
  if(!def) return empty;
  var lv = Number(entry.level)||1;
  var known = classKnownSpells(c, entry.name);
  if(isNewClass){ known = {spells: [], cantrips: [], certain: true}; }
  var onSheet = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c));
  var fresh = function(n){ return onSheet.indexOf(spellKey(n))===-1; };
  var maxLevel = def.maxLevel ? def.maxLevel(lv) : 0;
  var sections = [];
  var cls = def.list.toLowerCase();

  function tagsFor(names, extra, mark){
    var tags = {};
    names.forEach(function(n){
      var t = [];
      if(extra && extra[n]) t.push(extra[n]);
      if(mark) { var m = mark(n); if(m) t.push(m); }
      if(t.length) tags[n] = t;
    });
    return tags;
  }
  function add(id, kind, title, help, count, list){
    var names = list.names.filter(fresh);
    count = Math.min(count, names.length);
    if(count > 0) sections.push({id: id, kind: kind, title: title, help: help, count: count, names: names, tags: list.tags || {}});
  }
  function need(table, have){
    var gain = table[lv] - (lv > 1 ? table[lv-1] : 0);
    if(isNewClass && lv===1) return table[1];
    return known.certain ? Math.max(0, table[lv] - have) : Math.max(0, gain);
  }

  // Cantrips (every caster), less any learned for free.
  var auto = (lv===firstCastingLevel(def) ? def.autoCantrips || [] : []).filter(fresh);
  var cantripNeed = Math.max(0, need(def.cantrips, known.cantrips.length) - auto.length);
  if(cantripNeed){
    var cl = classListNames(entry, def, [0]);
    add("cantrips", "cantrip", "New cantrips", countText(cantripNeed, "cantrip", def.list), cantripNeed,
      {names: cl.names, tags: tagsFor(cl.names, cl.extra)});
  }

  if(def.spells && maxLevel){
    var spellNeed = need(def.spells, known.spells.length);
    var levels = range(1, maxLevel);
    var secrets = entry.name==="Bard" && MAGICAL_SECRETS_LEVELS.indexOf(lv)!==-1 ? Math.min(2, spellNeed) : 0;
    var anySchool = def.schools && def.anySchoolAt.indexOf(lv)!==-1 ? Math.min(1, spellNeed) : 0;
    var normal = spellNeed - secrets - anySchool;
    var own = classListNames(entry, def, levels);
    if(def.schools){
      var inSchool = own.names.filter(function(n){ return def.schools.indexOf(SPELL_DATA[n].school)!==-1; });
      add("spells", "spell", def.schools.join(" or ") + " spells",
        countText(normal, "spell", def.list, maxLevel) + " Your " + entry.subclass + " learns " + def.schools.join(" and ").toLowerCase() + " spells.", normal,
        {names: inSchool});
      add("anySchool", "spell", "Spell from any school",
        "This one can be any " + cls + " spell you can cast, whatever its school.", anySchool, {names: own.names});
    } else {
      add("spells", "spell", "New " + cls + " spells", countText(normal, "spell", def.list, maxLevel), normal,
        {names: own.names, tags: tagsFor(own.names, own.extra)});
    }
    if(secrets){
      var any = allSpellsOf(levels);
      add("secrets", "spell", "Magical Secrets",
        "Pick " + secrets + " spells from any class's list" + upToText(maxLevel) + " They count as bard spells for you.", secrets,
        {names: any, tags: tagsFor(any, null, otherClassTag("Bard"))});
    }
  }
  if(entry.name==="Bard" && entry.subclass===LORE_SECRETS.subclass && lv===LORE_SECRETS.level){
    var lore = allSpellsOf(range(1, maxLevel));
    add("loreSecrets", "bonus", "Additional Magical Secrets",
      "Your college teaches you " + LORE_SECRETS.count + " spells from any class's list" + upToText(maxLevel) + " They don't count against your spells known.",
      LORE_SECRETS.count, {names: lore, tags: tagsFor(lore, null, otherClassTag("Bard"))});
  }
  if(def.spellbook && maxLevel){
    var book = lv===1 ? def.spellbook[1] : def.spellbook.else;
    var bookList = classListNames(entry, def, range(1, maxLevel));
    add("spellbook", "spell", "Spells for your spellbook",
      "Copy " + book + " " + cls + " spells into your spellbook" + upToText(maxLevel) + " You prepare from your spellbook each day.", book,
      {names: bookList.names});
  }
  if(entry.name==="Warlock" && MYSTIC_ARCANUM[lv]){
    var arc = MYSTIC_ARCANUM[lv];
    var arcList = classListNames(entry, def, [arc]);
    add("arcanum", "arcanum", "Mystic Arcanum (" + ordinal(arc) + " level)",
      "Choose one " + ordinal(arc) + "-level warlock spell. You can cast it once per long rest without a spell slot. It doesn't count against your spells known.", 1,
      {names: arcList.names});
  }

  var note = "";
  if(def.spells && def.spells[lv] && known.certain && !isNewClass){
    var have = known.spells.length;
    if(have > def.spells[lv]) note = "You already know " + have + " " + cls + " spells, " + (have - def.spells[lv]) + " more than the table gives, so there's no new one to learn. You can remove extras on the Spells tab.";
    else if(have === def.spells[lv] && def.spells[lv] > def.spells[lv-1]) note = "You already know all " + have + " " + cls + " spells for this level, so there's no new one to learn.";
  }
  var swap = null;
  if(def.swap && !isNewClass && maxLevel && known.spells.length){
    swap = {known: known.spells.map(function(sp){ return sp.name; }).sort(), maxLevel: maxLevel};
  }
  return {sections: sections, swap: swap, auto: auto, maxLevel: maxLevel, def: def, known: known, note: note,
    summary: summaryText(entry, def, known, lv)};
}
function firstCastingLevel(def){
  for(var i = 1; i <= 20; i++) if(def.cantrips[i] || (def.spells && def.spells[i]) || (def.spellbook && i===1)) return i;
  return 1;
}
function countText(n, noun, list, maxLevel){
  return "Learn " + n + " " + list.toLowerCase() + " " + noun + (n===1 ? "" : "s") + (maxLevel ? upToText(maxLevel) : ".");
}
function upToText(maxLevel){
  return maxLevel ? ", up to " + ordinal(maxLevel) + " level." : ".";
}
function otherClassTag(own){
  return function(n){
    var cls = SPELL_DATA[n].classes || [];
    return cls.indexOf(own)!==-1 ? "" : cls.slice(0, 2).join(" / ") + " spell";
  };
}
function summaryText(entry, def, known, lv){
  var parts = [];
  if(def.spells && def.spells[lv]) parts.push(def.spells[lv] + " spells");
  if(def.cantrips[lv]) parts.push(def.cantrips[lv] + " cantrips");
  if(!parts.length) return "";
  var article = /^[AEIOU]/.test(entry.name) ? "An " : "A ";
  var who = def.schools ? entry.subclass : entry.name.toLowerCase();
  var text = article + ordinal(lv) + "-level " + who + " knows " + parts.join(" and ") + ".";
  if(known.certain && def.spells){
    text += " You know " + known.spells.length + " spell" + (known.spells.length===1 ? "" : "s") + " and " + known.cantrips.length + " cantrip" + (known.cantrips.length===1 ? "" : "s") + " now.";
  }
  return text;
}

/* The replacement for a swapped-out spell: the class list up to the
   highest level it can learn. A third caster's replacement keeps to its
   schools unless the spell it replaces was from outside them. */
export function swapSection(c, entry, plan, swapOut){
  if(!plan.swap || !swapOut) return null;
  var def = plan.def;
  var out = SPELL_DATA[catalogSpellName(swapOut)];
  var list = classListNames(entry, def, range(1, plan.swap.maxLevel));
  var onSheet = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c));
  var names = list.names.filter(function(n){ return onSheet.indexOf(spellKey(n))===-1; });
  if(def.schools && !(out && def.schools.indexOf(out.school)===-1)){
    names = names.filter(function(n){ return def.schools.indexOf(SPELL_DATA[n].school)!==-1; });
  }
  var tags = {};
  names.forEach(function(n){ if(list.extra[n]) tags[n] = [list.extra[n]]; });
  return {id: "swapIn", kind: "spell", title: "Replacement for " + swapOut, help: "Pick the spell that takes its place.", count: 1, names: names, tags: tags};
}

/* What's wrong with the picks, or null. picks: {sectionId: [names]}. */
export function learnProblem(sections, picks){
  var seen = {};
  for(var i = 0; i < sections.length; i++){
    var s = sections[i], got = (picks[s.id]||[]).filter(Boolean);
    if(got.length < s.count){
      var left = s.count - got.length;
      return s.id==="swapIn" ? "Pick the spell that replaces the one you're swapping out."
        : "Pick " + left + " more for " + s.title + ".";
    }
    for(var j = 0; j < got.length; j++){
      if(seen[got[j]]) return got[j] + " is picked twice. Choose a different spell for " + s.title + ".";
      seen[got[j]] = true;
    }
  }
  return null;
}

/* Adds the picks to the sheet; returns {added: [names], swappedOut}
   for undo. Spells a known caster learns are always ready (prepared);
   a wizard's new spellbook spells start unprepared. */
export function applyLearn(c, className, plan, sections, picks, swapOut){
  var rec = {className: className, added: [], swappedOut: null};
  if(swapOut){
    var at = (c.spells||[]).findIndex(function(sp){ return sp.name===swapOut && (sp.learnedBy===className || !sp.learnedBy); });
    if(at!==-1){ rec.swappedOut = {spell: c.spells[at], index: at}; c.spells.splice(at, 1); }
  }
  function learn(name, kind, sectionId){
    var d = SPELL_DATA[name];
    if(!d) return;
    var sp = spellFromCatalog(name, d);
    sp.learnedBy = className;
    sp.prepared = sectionId==="spellbook" ? false : true;
    if(kind==="arcanum"){ sp.arcanum = true; sp.notes = "Mystic Arcanum: cast it once per long rest without a spell slot."; }
    if(kind==="bonus"){ sp.bonusSecret = true; sp.notes = "Additional Magical Secrets: doesn't count against your spells known."; }
    c.spells.push(sp);
    rec.added.push(name);
  }
  (plan.auto||[]).forEach(function(n){ learn(n, "cantrip", "auto"); });
  sections.forEach(function(s){ (picks[s.id]||[]).slice(0, s.count).forEach(function(n){ if(n) learn(n, s.kind, s.id); }); });
  return rec;
}

/* Takes back what applyLearn did. */
export function undoLearn(c, rec){
  if(!rec) return;
  rec.added.forEach(function(name){
    var at = c.spells.findIndex(function(sp){ return sp.name===name && sp.learnedBy===rec.className; });
    if(at!==-1) c.spells.splice(at, 1);
  });
  if(rec.swappedOut) c.spells.splice(Math.min(rec.swappedOut.index, c.spells.length), 0, rec.swappedOut.spell);
}

/* The Spells tab's count for each spellcasting class: [{className,
   spells: {have, max}|null, cantrips: {have, max}|null, prepared:
   {have, max}|null}]. Counts that can't be told apart are left out. */
export function spellCounts(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    var def = casterDef(cl.name, cl.subclass);
    if(!def) return;
    var lv = Number(cl.level)||1;
    var known = classKnownSpells(c, cl.name);
    var row = {className: cl.subclass && SUBCLASS_CASTERS[cl.name + ":" + cl.subclass] ? cl.subclass : cl.name, spells: null, cantrips: null, prepared: null};
    if(known.certain){
      if(def.cantrips[lv]) row.cantrips = {have: known.cantrips.length, max: def.cantrips[lv]};
      if(def.spells && def.spells[lv]) row.spells = {have: known.spells.length, max: def.spells[lv]};
    }
    var max = preparedMax(c, cl);
    if(max && known.certain) row.prepared = {have: known.spells.filter(function(sp){ return sp.prepared; }).length, max: max};
    if(row.spells || row.cantrips || row.prepared) out.push(row);
  });
  return out;
}
/* How many spells a preparing class prepares each day, or 0. */
export function preparedMax(c, cl){
  var p = PREPARED_CASTERS[cl.name];
  var lv = Number(cl.level)||1;
  if(!p || lv < (p.from||1)) return 0;
  var m = mod(c.abilities && c.abilities[p.ability]);
  return Math.max(1, m + (p.half ? Math.floor(lv / 2) : lv));
}
/* True when a sheet spell is always ready: a cantrip, or a spell a
   known caster learned (bards, sorcerers, warlocks and rangers don't
   prepare). Only spells of preparing classes show a Prepared switch. */
export function spellNeedsPreparing(c, sp){
  if(!(sp.level||0) || sp.arcanum) return false;
  if(sp.learnedBy) return !!PREPARED_CASTERS[sp.learnedBy];
  var owner = untaggedOwner(c);
  if(owner) return !!PREPARED_CASTERS[owner];
  return (c.classes||[]).some(function(cl){ return PREPARED_CASTERS[cl.name]; });
}
