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
     cantripSwap {known: [cantrip names], from, arcanum} when one cantrip
                the class learned may be replaced this level ("level": the
                artificer's every level; else a Tasha's Versatility
                feature's name), else null. Eldritch Versatility from
                warlock 12 may replace a Mystic Arcanum spell instead:
                `arcanum` lists them ([] otherwise)
     auto       cantrips learned for free (an Arcane Trickster's Mage Hand)
     summary    the step's lead text
     tashaNote  how many more spells Tasha's optional Additional Spells
                would offer, for a character not using them ("" otherwise)

   A character using Tasha's optional class features (c.tashaOptional)
   picks from the class list with Tasha's additions, tagged in the lists. */
import { SPELL_DATA, spellDataForClass, spellOnClassList, tashaAddsSpell, tashaSpellCount, catalogSpellName } from "../data/spells.js";
import { KNOWN_CASTERS, SUBCLASS_CASTERS, MAGICAL_SECRETS_LEVELS, LORE_SECRETS, MYSTIC_ARCANUM, PREPARED_CASTERS, preparedAt } from "../data/spells-known.js";
import { featureSpells, classFeatureList, classExtraSpellLists, classCasterType, ordinal } from "./helpers.js";
import { spellFromCatalog } from "../render/panels/spell-picker.js";
import { CLASS_PROGRESSION } from "../data/progression.js";
import { originListSpells } from "./spell-grants.js";

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
  // (A Spell Mastery spell is still an ordinary spellbook spell.)
  return featureSpells(c).filter(function(fs){ return fs.kind!=="expanded" && fs.kind!=="mastery"; }).map(function(fs){ return spellKey(fs.name); });
}
/* The character with class entry `entry` as the level-up will leave it
   (new level, a subclass or spell choice picked in the dialog), so the
   spells that level brings on its own can be read ahead of time. */
function afterLevelUp(c, entry){
  var merged = function(cl){
    var out = Object.assign({}, cl);
    Object.keys(entry).forEach(function(k){ if(entry[k]!==undefined && entry[k]!=="") out[k] = entry[k]; });
    return out;
  };
  var found = false;
  var classes = (c.classes||[]).map(function(cl){ if(cl.name!==entry.name) return cl; found = true; return merged(cl); });
  if(!found) classes.push(merged({}));
  return Object.assign({}, c, {classes: classes});
}
/* Spells a feature gives the character in full, so a class's own copy
   needn't count as learned: always prepared or always known ones, and a
   feat's (cast free once a day, or with any spell slot). Not the limited
   grants: an invocation's once-a-day or at-will spell, a ritual-only
   copy, a spell added to a wizard's spellbook (still prepared normally). */
function freeNames(c){
  return featureSpells(c).filter(function(fs){ return fs.kind==="prepared" || fs.kind==="known" || (fs.kind==="free" && !fs.className); })
    .map(function(fs){ return spellKey(fs.name); });
}
/* Spells the level-up itself grants (an Aberrant Mind's Detect Thoughts
   at sorcerer 3, a new Light cleric's Light) that the sheet doesn't have
   yet: [{name, key, source}]. They aren't offered as picks. */
function comingSpells(c, entry){
  var have = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c));
  return featureSpells(afterLevelUp(c, entry)).filter(function(fs){ return fs.kind!=="expanded" && have.indexOf(spellKey(fs.name))===-1; })
    .map(function(fs){ return {name: catalogSpellName(fs.name), key: spellKey(fs.name), source: fs.source}; });
}

/* The class that owns spells with no learnedBy: the character's only
   spellcasting class, else none. */
function untaggedOwner(c){
  var casters = (c.classes||[]).filter(function(cl){ return classCasterType(cl); });
  return casters.length===1 ? casters[0].name : "";
}
/* The class a sheet spell belongs to: its learnedBy, else the only
   spellcasting class, else "". */
export function spellOwner(c, sp){
  return sp.learnedBy || untaggedOwner(c);
}

/* Spells on the sheet that count for `className`: {spells, cantrips,
   certain}. `certain` is false when untagged spells could belong to it
   but can't be told apart (two or more spellcasting classes). */
export function classKnownSpells(c, className){
  var granted = grantedNames(c);
  var owner = untaggedOwner(c);
  var anyUntagged = false;
  // A learned spell a feature now gives for free stops counting (the
  // pick comes back at the next level-up), except the cantrips the
  // class's own table already includes (an Arcane Trickster's Mage Hand).
  var free = freeNames(c);
  var entry = (c.classes||[]).find(function(cl){ return cl.name===className; });
  var def = entry && casterDef(className, entry.subclass);
  var own = ((def && def.autoCantrips) || []).map(spellKey);
  var mine = (c.spells||[]).filter(function(sp){
    if(sp.arcanum || sp.bonusSecret) return false;
    if(sp.learnedBy) return sp.learnedBy===className && (free.indexOf(spellKey(sp.name))===-1 || own.indexOf(spellKey(sp.name))!==-1);
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
   own list (with Tasha's additions when `tasha` is set), a patron's
   expanded list, a Divine Soul's cleric list. */
function classListNames(entry, def, levels, tasha, c){
  var data = spellDataForClass(def.list, tasha);
  var extra = {};
  Object.keys(data).forEach(function(n){ if(tashaAddsSpell(data[n], def.list)) extra[n] = TASHA_TAG; });
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
      Object.keys(spellDataForClass(list, tasha)).forEach(function(n){ if(!extra[n]) extra[n] = list + " spell"; });
    });
    // A dragonmark's or a guild background's spells join every caster's list.
    if(c) originListSpells(c.race, c.background).forEach(function(o){ if(!extra[o.name]) extra[o.name] = o.tag; });
  }
  // A patron's spells lead the list, so a warlock sees them first.
  var patron = function(n){ return extra[n]==="Patron spell" ? 0 : 1; };
  var out = Object.keys(data).concat(Object.keys(extra).filter(function(n){ return !data[n]; }))
    .filter(function(n){ return levels.indexOf(SPELL_DATA[n].level)!==-1; })
    .sort(function(a, b){ return patron(a) - patron(b) || a.localeCompare(b); });
  return {names: out, extra: extra};
}
var TASHA_TAG = "Tasha's optional";
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
  var empty = {sections: [], swap: null, cantripSwap: null, auto: [], granted: [], freed: [], summary: "", note: "", tashaNote: ""};
  if(!def) return empty;
  var lv = Number(entry.level)||1;
  // Counted as the level-up will leave the character: a spell learned
  // earlier that this level now gives for free no longer counts, so
  // another is learned in its place (`freed` names those).
  var before = classKnownSpells(c, entry.name);
  var known = classKnownSpells(afterLevelUp(c, entry), entry.name);
  var freed = isNewClass ? [] : before.spells.concat(before.cantrips)
    .filter(function(sp){ return known.spells.indexOf(sp)===-1 && known.cantrips.indexOf(sp)===-1; })
    .map(function(sp){ return sp.name; });
  if(isNewClass){ known = {spells: [], cantrips: [], certain: true}; }
  var onSheet = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c));
  var fresh = function(n){ return onSheet.indexOf(spellKey(n))===-1; };
  // Spells this level brings on its own, and the free cantrips, aren't
  // offered; `granted` lists the ones a list would otherwise have shown.
  var coming = comingSpells(c, entry), granted = [], autoKeys = [];
  var offered = function(n){
    var key = spellKey(n);
    if(!fresh(n) || autoKeys.indexOf(key)!==-1) return false;
    var g = coming.find(function(x){ return x.key===key; });
    if(g && !granted.some(function(x){ return x.key===key; })) granted.push(g);
    return !g;
  };
  var maxLevel = def.maxLevel ? def.maxLevel(lv) : 0;
  var sections = [];
  var cls = def.list.toLowerCase();
  var tasha = !!c.tashaOptional;

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
    var names = list.names.filter(offered);
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
  autoKeys = auto.map(spellKey);
  var cantripNeed = Math.max(0, need(def.cantrips, known.cantrips.length) - auto.length);
  if(cantripNeed){
    var cl = classListNames(entry, def, [0], tasha, c);
    add("cantrips", "cantrip", "New cantrips", countText(cantripNeed, "cantrip", def.list), cantripNeed,
      {names: cl.names, tags: tagsFor(cl.names, cl.extra)});
  }

  if(def.spells && maxLevel){
    var spellNeed = need(def.spells, known.spells.length);
    var levels = range(1, maxLevel);
    var secrets = entry.name==="Bard" && MAGICAL_SECRETS_LEVELS.indexOf(lv)!==-1 ? Math.min(2, spellNeed) : 0;
    var anySchool = def.schools && def.anySchoolAt.indexOf(lv)!==-1 ? Math.min(1, spellNeed) : 0;
    var normal = spellNeed - secrets - anySchool;
    var own = classListNames(entry, def, levels, tasha, c);
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
        {names: any, tags: tagsFor(any, null, otherClassTag("Bard", tasha))});
    }
  }
  if(entry.name==="Bard" && entry.subclass===LORE_SECRETS.subclass && lv===LORE_SECRETS.level){
    var lore = allSpellsOf(range(1, maxLevel));
    add("loreSecrets", "bonus", "Additional Magical Secrets",
      "Your college teaches you " + LORE_SECRETS.count + " spells from any class's list" + upToText(maxLevel) + " They don't count against your spells known.",
      LORE_SECRETS.count, {names: lore, tags: tagsFor(lore, null, otherClassTag("Bard", tasha))});
  }
  if(def.spellbook && maxLevel){
    var book = lv===1 ? def.spellbook[1] : def.spellbook.else;
    var bookList = classListNames(entry, def, range(1, maxLevel), tasha, c);
    add("spellbook", "spell", "Spells for your spellbook",
      "Copy " + book + " " + cls + " spells into your spellbook" + upToText(maxLevel) + " You prepare from your spellbook each day.", book,
      {names: bookList.names, tags: tagsFor(bookList.names, bookList.extra)});
  }
  if(entry.name==="Warlock" && MYSTIC_ARCANUM[lv]){
    var arc = MYSTIC_ARCANUM[lv];
    var arcList = classListNames(entry, def, [arc], tasha, c);
    add("arcanum", "arcanum", "Mystic Arcanum (" + ordinal(arc) + " level)",
      "Choose one " + ordinal(arc) + "-level warlock spell. You can cast it once per long rest without a spell slot. It doesn't count against your spells known.", 1,
      {names: arcList.names, tags: tagsFor(arcList.names, arcList.extra)});
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
  // A cantrip swap: the artificer's each level, or Tasha's Versatility at
  // the class's Ability Score Improvement levels.
  var cantripSwap = null;
  if(def.cantripSwap && !isNewClass && known.cantrips.length){
    var asiLevel = ((CLASS_PROGRESSION[entry.name]||{}).asiLevels||[]).indexOf(lv)!==-1;
    if(def.cantripSwap==="level" || (tasha && asiLevel)){
      var arcanum = def.cantripSwap==="Eldritch Versatility" && lv >= 12 ? (c.spells||[]).filter(function(sp){
        return sp.arcanum && (sp.learnedBy===entry.name || !sp.learnedBy);
      }).map(function(sp){ return sp.name; }).sort() : [];
      cantripSwap = {known: known.cantrips.map(function(sp){ return sp.name; }).sort(), from: def.cantripSwap, arcanum: arcanum};
    }
  }
  // What Tasha's Additional Spells would add to this level's lists.
  var tashaNote = "";
  if(!tasha && (sections.length || swap)){
    var pickLevels = range(1, maxLevel).concat(MYSTIC_ARCANUM[lv] && entry.name==="Warlock" ? [MYSTIC_ARCANUM[lv]] : []);
    var more = tashaSpellCount(def.list, pickLevels);
    if(more) tashaNote = "Tasha's Cauldron adds " + more + " more " + cls + " spell" + (more===1 ? "" : "s") + " to choose from if your character uses Tasha's optional class features (Information tab).";
  }
  return {sections: sections, swap: swap, cantripSwap: cantripSwap, auto: auto, maxLevel: maxLevel, def: def, known: known, note: note, tashaNote: tashaNote,
    granted: granted.map(function(g){ return {name: g.name, source: g.source}; }), freed: freed, summary: summaryText(entry, def, known, lv)};
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
function otherClassTag(own, tasha){
  return function(n){
    var cls = SPELL_DATA[n].classes || [];
    return spellOnClassList(SPELL_DATA[n], own, tasha) ? "" : cls.slice(0, 2).join(" / ") + " spell";
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
  var list = classListNames(entry, def, range(1, plan.swap.maxLevel), !!c.tashaOptional, c);
  var onSheet = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c))
    .concat(comingSpells(c, entry).map(function(g){ return g.key; }));
  var names = list.names.filter(function(n){ return onSheet.indexOf(spellKey(n))===-1; });
  if(def.schools && !(out && def.schools.indexOf(out.school)===-1)){
    names = names.filter(function(n){ return def.schools.indexOf(SPELL_DATA[n].school)!==-1; });
  }
  var tags = {};
  names.forEach(function(n){ if(list.extra[n]) tags[n] = [list.extra[n]]; });
  return {id: "swapIn", kind: "spell", title: "Replacement for " + swapOut, help: "Pick the spell that takes its place.", count: 1, names: names, tags: tags};
}

/* The replacement for a swapped-out cantrip: the class's cantrips the
   character doesn't have; for a Mystic Arcanum spell (Eldritch
   Versatility), a warlock spell of the same level. */
export function cantripSwapSection(c, entry, plan, cantripOut){
  if(!plan.cantripSwap || !cantripOut) return null;
  var arcanum = (plan.cantripSwap.arcanum||[]).indexOf(cantripOut)!==-1;
  var outData = SPELL_DATA[catalogSpellName(cantripOut)];
  var level = arcanum && outData ? outData.level : 0;
  var list = classListNames(entry, plan.def, [level], !!c.tashaOptional, c);
  var onSheet = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c))
    .concat(comingSpells(c, entry).map(function(g){ return g.key; }));
  var names = list.names.filter(function(n){ return onSheet.indexOf(spellKey(n))===-1; });
  var tags = {};
  names.forEach(function(n){ if(list.extra[n]) tags[n] = [list.extra[n]]; });
  if(arcanum) return {id: "arcanumIn", kind: "arcanum", title: "Replacement for " + cantripOut,
    help: "Pick the " + ordinal(level) + "-level warlock spell that takes its place in your Mystic Arcanum.", count: 1, names: names, tags: tags};
  return {id: "cantripIn", kind: "cantrip", title: "Replacement for " + cantripOut, help: "Pick the cantrip that takes its place.", count: 1, names: names, tags: tags};
}

/* What's wrong with the picks, or null. picks: {sectionId: [names]}. */
export function learnProblem(sections, picks){
  var seen = {};
  for(var i = 0; i < sections.length; i++){
    var s = sections[i], got = (picks[s.id]||[]).filter(Boolean);
    if(got.length < s.count){
      var left = s.count - got.length;
      return s.id==="swapIn" ? "Pick the spell that replaces the one you're swapping out."
        : s.id==="cantripIn" ? "Pick the cantrip that replaces the one you're swapping out."
        : s.id==="arcanumIn" ? "Pick the spell that replaces the Mystic Arcanum spell you're swapping out."
        : "Pick " + left + " more for " + s.title + ".";
    }
    for(var j = 0; j < got.length; j++){
      if(seen[got[j]]) return got[j] + " is picked twice. Choose a different spell for " + s.title + ".";
      seen[got[j]] = true;
    }
  }
  return null;
}

/* Adds the picks to the sheet; returns {added: [names], swappedOut,
   cantripOut} for undo (`cantripOut`: a cantrip or Mystic Arcanum spell
   a Versatility feature replaces). Spells a known caster learns are always ready
   (prepared); a wizard's new spellbook spells start unprepared. */
export function applyLearn(c, className, plan, sections, picks, swapOut, cantripOut){
  var rec = {className: className, added: [], swappedOut: null, cantripOut: null};
  function takeOut(name){
    var at = (c.spells||[]).findIndex(function(sp){ return sp.name===name && (sp.learnedBy===className || !sp.learnedBy); });
    if(at===-1) return null;
    var out = {spell: c.spells[at], index: at};
    c.spells.splice(at, 1);
    return out;
  }
  if(swapOut) rec.swappedOut = takeOut(swapOut);
  if(cantripOut && plan.cantripSwap) rec.cantripOut = takeOut(cantripOut);
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
  // Back in reverse order, so each lands where it was.
  if(rec.cantripOut) c.spells.splice(Math.min(rec.cantripOut.index, c.spells.length), 0, rec.cantripOut.spell);
  if(rec.swappedOut) c.spells.splice(Math.min(rec.swappedOut.index, c.spells.length), 0, rec.swappedOut.spell);
}

/* Cantrip Formulas (Tasha's optional features, wizard 3): "Whenever you
   finish a long rest and consult those formulas in your spellbook, you
   can replace one wizard cantrip you know with another cantrip from the
   wizard spell list." Offered in the sheet that opens after a long rest.
   {known: [wizard cantrips], options: [ones to take instead]} or null. */
export function cantripFormulas(c){
  var wiz = (c.classes||[]).find(function(cl){ return cl.name==="Wizard"; });
  if(!wiz || !c.tashaOptional || (Number(wiz.level)||1) < 3) return null;
  var known = classKnownSpells(c, "Wizard").cantrips.map(function(sp){ return sp.name; }).sort();
  if(!known.length) return null;
  var onSheet = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c));
  var options = classListNames(wiz, casterDef("Wizard"), [0], true, c).names.filter(function(n){ return onSheet.indexOf(spellKey(n))===-1; });
  return {known: known, options: options};
}
/* Makes the swap: `out` leaves, `inName` takes its place (ready, as
   cantrips are). True when done. */
export function swapCantripFormula(c, out, inName){
  var cf = cantripFormulas(c);
  if(!cf || cf.known.indexOf(out)===-1 || cf.options.indexOf(inName)===-1) return false;
  var at = c.spells.findIndex(function(sp){ return sp.name===out && (sp.learnedBy==="Wizard" || !sp.learnedBy); });
  if(at===-1) return false;
  var sp = spellFromCatalog(inName, SPELL_DATA[inName]);
  sp.learnedBy = "Wizard";
  sp.prepared = true;
  c.spells.splice(at, 1, sp);
  return true;
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
/* How many spells a preparing class prepares each day (the 2024
   tables, see PREPARED_CASTERS), or 0. */
export function preparedMax(c, cl){
  return preparedAt(cl.name, Number(cl.level)||1);
}
/* True when a sheet spell is always ready: a cantrip, or a spell a
   known caster learned (bards, sorcerers, warlocks and rangers don't
   prepare). Only spells of preparing classes show a Prepared switch. */
export function spellNeedsPreparing(c, sp){
  if(!(sp.level||0) || sp.arcanum || alwaysPrepared(c, sp)) return false;
  if(sp.learnedBy) return !!PREPARED_CASTERS[sp.learnedBy];
  var owner = untaggedOwner(c);
  if(owner) return !!PREPARED_CASTERS[owner];
  return (c.classes||[]).some(function(cl){ return PREPARED_CASTERS[cl.name]; });
}

/* The preparing class a sheet spell belongs to, or "" when it has none
   or it can't be told (two preparing classes and an untagged spell). */
export function preparingClassFor(c, sp){
  if(!spellNeedsPreparing(c, sp)) return "";
  if(sp.learnedBy) return sp.learnedBy;
  var owner = untaggedOwner(c);
  if(owner) return PREPARED_CASTERS[owner] ? owner : "";
  var preparing = (c.classes||[]).filter(function(cl){ return PREPARED_CASTERS[cl.name]; });
  return preparing.length===1 ? preparing[0].name : "";
}
/* {have, max} prepared today for a preparing class, or null. */
export function preparedState(c, className){
  var cl = (c.classes||[]).find(function(x){ return x.name===className; });
  var max = cl ? preparedMax(c, cl) : 0;
  if(!max) return null;
  var known = classKnownSpells(c, className);
  if(!known.certain) return null;
  return {have: known.spells.filter(function(sp){ return sp.prepared; }).length, max: max};
}
/* The feature that keeps a sheet spell always prepared (a domain spell
   also on the spell list), or null. */
export function alwaysPrepared(c, sp){
  var key = spellKey(sp.name);
  return featureSpells(c).find(function(fs){ return fs.kind==="prepared" && spellKey(fs.name)===key; }) || null;
}
/* Why a preparing class can't prepare `sp` yet because of its level
   ("Lesser Restoration is a 2nd-level spell: clerics prepare those from
   cleric level 3."), or null. */
export function prepareLevelProblem(c, sp){
  var cls = preparingClassFor(c, sp);
  var cl = cls && (c.classes||[]).find(function(x){ return x.name===cls; });
  var def = cl && casterDef(cl.name, cl.subclass);
  if(!def || !def.maxLevel) return null;
  var lv = Number(cl.level)||1, sl = sp.level||0;
  if(sl <= def.maxLevel(lv)) return null;
  var from = 0;
  for(var i = lv + 1; i <= 20 && !from; i++) if(def.maxLevel(i) >= sl) from = i;
  return sp.name + " is " + (/^[8]/.test(String(sl)) ? "an " : "a ") + ordinal(sl) + "-level spell: " + cls.toLowerCase() + "s prepare those" +
    (from ? " from " + cls.toLowerCase() + " level " + from + "." : " at higher levels.");
}
/* Why `sp` can't be prepared now (too high a level, or its class is at
   its daily limit), or null. Unpreparing is always fine. */
export function prepareProblem(c, sp){
  if(sp.prepared) return null;
  var tooHigh = prepareLevelProblem(c, sp);
  if(tooHigh) return tooHigh;
  var cls = preparingClassFor(c, sp);
  var st = cls && preparedState(c, cls);
  if(!st || st.have < st.max) return null;
  return "You can prepare " + st.max + " " + cls.toLowerCase() + " spell" + (st.max===1 ? "" : "s") + " today. Untick one first.";
}
