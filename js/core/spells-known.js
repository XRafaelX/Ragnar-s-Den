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
     auto       cantrips learned for free (an Arcane Trickster's Mage Hand)
     summary    the step's lead text
     tashaNote  how many more spells Tasha's optional Additional Spells
                would offer, for a character not using them ("" otherwise)

   A character using Tasha's optional class features (c.tashaOptional)
   picks from the class list with Tasha's additions, tagged in the lists. */
import { SPELL_DATA, spellDataForClass, spellOnClassList, tashaAddsSpell, tashaSpellCount, catalogSpellName } from "../data/spells.js";
import { SAVANT_SCHOOLS, SAVANT_LEVELS } from "../data/wizard-2024.js";
import { KNOWN_CASTERS, SUBCLASS_CASTERS, EDITION_CASTERS, MAGICAL_SECRETS_LEVELS, LORE_SECRETS, MYSTIC_ARCANUM, preparedAt, preparingDef } from "../data/spells-known.js";
import { featureSpells, classFeatureList, classExtraSpellLists, classCasterType, ordinal, choiceEffectsOf, classEntryOf } from "./helpers.js";
import { spellFromCatalog } from "./spell-edition.js";
import { CLASS_PROGRESSION } from "../data/progression.js";
import { originListSpells } from "./spell-grants.js";

/* The casting rules for a class (or its casting subclass, or its edition), or null. */
export function casterDef(className, subclass, edition){
  return SUBCLASS_CASTERS[className + ":" + (subclass || "")] || (edition==="2024" && EDITION_CASTERS[className]) || KNOWN_CASTERS[className] || null;
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
  // (Nor a race's once-a-day spell cast without a slot: a class can learn it too.)
  return featureSpells(c).filter(function(fs){ return fs.kind!=="expanded" && fs.kind!=="mastery" && !fs.limited; }).map(function(fs){ return spellKey(fs.name); });
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
  return featureSpells(c).filter(function(fs){ return fs.kind==="prepared" || fs.kind==="known" || (fs.kind==="free" && !fs.className && !fs.limited); })
    .map(function(fs){ return spellKey(fs.name); });
}
/* Spells the level-up itself grants (an Aberrant Mind's Detect Thoughts
   at sorcerer 3, a new Light cleric's Light) that the sheet doesn't have
   yet: [{name, key, source}]. They aren't offered as picks. */
function comingSpells(c, entry){
  var have = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c));
  return featureSpells(afterLevelUp(c, entry)).filter(function(fs){ return fs.kind!=="expanded" && !fs.limited && have.indexOf(spellKey(fs.name))===-1; })
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
  var entry = classEntryOf(c, className);
  var def = entry && casterDef(className, entry.subclass, entry.edition);
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
  var def = casterDef(entry.name, entry.subclass, entry.edition);
  var empty = {sections: [], auto: [], granted: [], freed: [], summary: "", note: "", tashaNote: ""};
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
  // Spells added by hand on the Spells tab can take a character past the
  // table, but they never use up what a level brings: the level's gain
  // always comes, and a character short of the table catches up.
  function need(table, have){
    var gain = Math.max(0, table[lv] - (lv > 1 ? table[lv-1] : 0));
    if(isNewClass && lv===1) return table[1];
    return known.certain ? Math.max(gain, table[lv] - have) : gain;
  }

  // Cantrips (every caster), less any learned for free.
  var auto = (lv===firstCastingLevel(def) ? def.autoCantrips || [] : []).filter(fresh);
  autoKeys = auto.map(spellKey);
  var bonusCantrips = bonusCantripsOf(entry);
  var cantripTable = bonusCantrips ? def.cantrips.map(function(n, i){ return i ? n + bonusCantrips : 0; }) : def.cantrips;
  var cantripNeed = Math.max(0, need(cantripTable, known.cantrips.length) - auto.length);
  if(cantripNeed){
    var cl = classListNames(entry, def, [0], tasha, c);
    add("cantrips", "cantrip", "New cantrips", countText(cantripNeed, "cantrip", def.list), cantripNeed,
      {names: cl.names, tags: tagsFor(cl.names, cl.extra)});
  }

  if(def.spells && maxLevel){
    var spellNeed = need(def.spells, known.spells.length);
    var levels = range(1, maxLevel);
    var secrets = entry.name==="Bard" && entry.edition!=="2024" && MAGICAL_SECRETS_LEVELS.indexOf(lv)!==-1 ? Math.min(2, spellNeed) : 0;
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
  // Magical Discoveries (2024 Lore 6): two from the Cleric, Druid or Wizard
  // lists, cantrips too, always prepared.
  if(entry.name==="Bard" && entry.subclass==="College of Lore (2024)" && lv===6){
    var found = [];
    ["Cleric", "Druid", "Wizard"].forEach(function(list){
      Object.keys(spellDataForClass(list, tasha)).forEach(function(n){ if(found.indexOf(n)===-1 && range(0, maxLevel).indexOf(SPELL_DATA[n].level)!==-1) found.push(n); });
    });
    found.sort();
    add("loreDiscoveries", "bonus", "Magical Discoveries",
      "Your college teaches you 2 spells from the Cleric, Druid or Wizard lists, cantrips or" + upToText(maxLevel) + " You always have them prepared.", 2,
      {names: found, tags: tagsFor(found, null, otherClassTag("Bard", tasha))});
  }
  // A preparing class (cleric, druid, paladin, artificer, the 2024 ranger)
  // prepares more spells a day as it levels: the level-up asks for enough
  // to fill the new count, so a player never has to know to add them on
  // the Spells tab. Unprepared spells of the class already on the sheet
  // are offered first ("On your sheet"). A wizard's new spellbook spells
  // fill its free places instead (prepareRoom, see applyLearn).
  var prepareRoom = 0;
  var prepDef = preparingDef(entry.name, entry.edition);
  if(prepDef && !def.spells && maxLevel){
    var prepNow = preparedAt(entry.name, lv, entry.edition);
    var prepGain = Math.max(0, prepNow - (isNewClass ? 0 : preparedAt(entry.name, lv - 1, entry.edition)));
    var prepHave = known.spells.filter(function(sp){ return sp.prepared; }).length;
    prepareRoom = known.certain ? Math.max(0, prepNow - prepHave) : prepGain;
  }
  if(prepareRoom && !def.spellbook){
    var prepList = classListNames(entry, def, range(1, maxLevel), tasha, c);
    var prepTags = tagsFor(prepList.names, prepList.extra);
    var waiting = isNewClass ? [] : known.spells.filter(function(sp){
      var d = SPELL_DATA[catalogSpellName(sp.name)];
      return !sp.prepared && d && d.level >= 1 && d.level <= maxLevel;
    }).map(function(sp){ return catalogSpellName(sp.name); }).sort();
    waiting.forEach(function(n){ prepTags[n] = ["On your sheet"].concat(prepTags[n] || []); });
    var prepNames = waiting.concat(prepList.names.filter(offered));
    var prepCount = Math.min(prepareRoom, prepNames.length);
    if(prepCount > 0) sections.push({id: "prepare", kind: "spell", title: "Spells to prepare",
      help: "Pick " + prepCount + " " + cls + " spell" + (prepCount===1 ? "" : "s") + " to prepare" + upToText(maxLevel) + " You can change them after any long rest on the Spells tab.",
      count: prepCount, names: prepNames, tags: prepTags});
  }
  if(def.spellbook && maxLevel){
    var book = lv===1 ? def.spellbook[1] : def.spellbook.else;
    var bookList = classListNames(entry, def, range(1, maxLevel), tasha, c);
    add("spellbook", "spell", "Spells for your spellbook",
      "Copy " + book + " " + cls + " spells into your spellbook" + upToText(maxLevel) + " You prepare from your spellbook each day.", book,
      {names: bookList.names, tags: tagsFor(bookList.names, bookList.extra)});
  }
  // A 2024 subclass's Savant (wizard 3, then each new level of slots):
  // spells of its school added to the spellbook for free.
  var savant = entry.name==="Wizard" && entry.edition==="2024" && SAVANT_SCHOOLS[entry.subclass];
  if(savant && (lv===3 || SAVANT_LEVELS.indexOf(lv)!==-1)){
    var top = lv===3 ? 2 : maxLevel;
    var schoolList = classListNames(entry, def, range(1, top), tasha, c).names.filter(function(n){ return SPELL_DATA[n].school===savant; });
    add("savant", "spell", savant + " Savant",
      lv===3 ? "Add two wizard " + savant.toLowerCase() + " spells of level 2 or lower to your spellbook for free." : "Add one wizard " + savant.toLowerCase() + " spell to your spellbook for free" + upToText(top),
      lv===3 ? 2 : 1, {names: schoolList});
  }
  if(entry.name==="Warlock" && MYSTIC_ARCANUM[lv]){
    var arc = MYSTIC_ARCANUM[lv];
    var arcList = classListNames(entry, def, [arc], tasha, c);
    add("arcanum", "arcanum", "Mystic Arcanum (" + ordinal(arc) + " level)",
      "Choose one " + ordinal(arc) + "-level warlock spell. You can cast it once per long rest without a spell slot. It doesn't count against your spells known.", 1,
      {names: arcList.names, tags: tagsFor(arcList.names, arcList.extra)});
  }

  var note = "";
  // (No cantrip swap here: the artificer's every level and Tasha's
  // Versatility are most often skipped, so their features say to make it
  // on the Spells tab, any time.)
  // What Tasha's Additional Spells would add to this level's lists.
  var tashaNote = "";
  if(!tasha && sections.length){
    var pickLevels = range(1, maxLevel).concat(MYSTIC_ARCANUM[lv] && entry.name==="Warlock" ? [MYSTIC_ARCANUM[lv]] : []);
    var more = tashaSpellCount(def.list, pickLevels);
    if(more) tashaNote = "Tasha's Cauldron adds " + more + " more " + cls + " spell" + (more===1 ? "" : "s") + " to choose from if your character uses Tasha's optional class features (Information tab).";
  }
  return {sections: sections, auto: auto, maxLevel: maxLevel, def: def, known: known, note: note, tashaNote: tashaNote, prepareRoom: prepareRoom,
    granted: granted.map(function(g){ return {name: g.name, source: g.source}; }), freed: freed, summary: summaryText(entry, def, known, lv, prepDef && !def.spells && !isNewClass ? preparedAt(entry.name, lv, entry.edition) : 0)};
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
/* Extra cantrips a class entry's choices give on top of its table (the
   2024 cleric's Thaumaturge, the 2024 druid's Magician). */
function bonusCantripsOf(entry){
  return choiceEffectsOf(entry).reduce(function(a, e){ return a + (e.cantrips || 0); }, 0);
}
/* `prepares`: how many spells a preparing class prepares a day at `lv` (0 otherwise). */
function summaryText(entry, def, known, lv, prepares){
  var parts = [];
  if(def.spells && def.spells[lv]) parts.push(def.spells[lv] + " spells");
  if(def.cantrips[lv]) parts.push((def.cantrips[lv] + bonusCantripsOf(entry)) + " cantrips");
  if(!parts.length && !prepares) return "";
  var article = /^[AEIOU]/.test(entry.name) ? "An " : "A ";
  var who = def.schools ? entry.subclass : entry.name.toLowerCase();
  var plural = function(n, noun){ return n + " " + noun + (n===1 ? "" : "s"); };
  var does = [];
  if(prepares) does.push("prepares " + plural(prepares, "spell") + " a day");
  if(parts.length) does.push("knows " + parts.join(" and "));
  var text = article + ordinal(lv) + "-level " + who + " " + does.join(" and ") + ".";
  if(known.certain && def.spells){
    text += " You know " + plural(known.spells.length, "spell") + " and " + plural(known.cantrips.length, "cantrip") + " now.";
  } else if(known.certain && prepares){
    var ready = known.spells.filter(function(sp){ return sp.prepared; }).length;
    text += " You have " + ready + " prepared now.";
  }
  return text;
}

/* What's wrong with the picks, or null. picks: {sectionId: [names]}. */
export function learnProblem(sections, picks){
  var seen = {};
  for(var i = 0; i < sections.length; i++){
    var s = sections[i], got = (picks[s.id]||[]).filter(Boolean);
    if(got.length < s.count){
      var left = s.count - got.length;
      return "Pick " + left + " more for " + s.title + ".";
    }
    for(var j = 0; j < got.length; j++){
      if(seen[got[j]]) return got[j] + " is picked twice. Choose a different spell for " + s.title + ".";
      seen[got[j]] = true;
    }
  }
  return null;
}

/* Adds the picks to the sheet; returns {added: [names], prepared: [names
   already on the sheet it prepared]} for undo. Spells a known caster learns are always ready (prepared), as
   are a preparing class's "Spells to prepare". A wizard's new spellbook
   spells are prepared while the day's count has room (plan.prepareRoom). */
export function applyLearn(c, className, plan, sections, picks){
  var rec = {className: className, added: [], prepared: []};
  var bookRoom = plan.prepareRoom || 0;
  function learn(name, kind, sectionId){
    var d = SPELL_DATA[name];
    if(!d) return;
    // A spell to prepare that's already on the sheet is prepared in place.
    if(sectionId==="prepare"){
      var mine = (c.spells||[]).find(function(sp){ return !sp.prepared && spellKey(sp.name)===spellKey(name) && (sp.learnedBy===className || !sp.learnedBy); });
      if(mine){ mine.prepared = true; rec.prepared.push(mine.name); return; }
    }
    var sp = spellFromCatalog(name, d);
    sp.learnedBy = className;
    if(sectionId==="spellbook" || sectionId==="savant"){ sp.prepared = bookRoom > 0; if(sp.prepared) bookRoom--; }
    else sp.prepared = true;
    if(kind==="arcanum"){ sp.arcanum = true; sp.notes = "Mystic Arcanum: cast it once per long rest without a spell slot."; }
    if(kind==="bonus"){ sp.bonusSecret = true; sp.notes = sectionId==="loreDiscoveries" ? "Magical Discoveries: always prepared, and doesn't count against your spells." : "Additional Magical Secrets: doesn't count against your spells known."; }
    c.spells.push(sp);
    rec.added.push(name);
  }
  (plan.auto||[]).forEach(function(n){ learn(n, "cantrip", "auto"); });
  sections.forEach(function(s){ (picks[s.id]||[]).slice(0, s.count).forEach(function(n){ if(n) learn(n, s.kind, s.id); }); });
  // The "Spells to prepare" picks, new or already on the sheet (for the popup).
  var prep = sections.find(function(s){ return s.id==="prepare"; });
  rec.toPrepare = prep ? (picks.prepare||[]).slice(0, prep.count).filter(Boolean) : [];
  return rec;
}

/* Takes back what applyLearn did. */
export function undoLearn(c, rec){
  if(!rec) return;
  rec.added.forEach(function(name){
    var at = c.spells.findIndex(function(sp){ return sp.name===name && sp.learnedBy===rec.className; });
    if(at!==-1) c.spells.splice(at, 1);
  });
  (rec.prepared||[]).forEach(function(name){
    var sp = c.spells.find(function(x){ return x.name===name && x.prepared && (x.learnedBy===rec.className || !x.learnedBy); });
    if(sp) sp.prepared = false;
  });
  // Back in reverse order, so each lands where it was. (`cantripOut` and
  // `swappedOut`: a cantrip or spell a level-up before 2026-11-16 swapped.)
  if(rec.cantripOut) c.spells.splice(Math.min(rec.cantripOut.index, c.spells.length), 0, rec.cantripOut.spell);
  if(rec.swappedOut) c.spells.splice(Math.min(rec.swappedOut.index, c.spells.length), 0, rec.swappedOut.spell);
}

/* Cantrip Formulas (Tasha's optional features, wizard 3): "Whenever you
   finish a long rest and consult those formulas in your spellbook, you
   can replace one wizard cantrip you know with another cantrip from the
   wizard spell list." Offered in the sheet that opens after a long rest.
   The 2024 wizard and the 2024 artificer swap one after every long rest
   from level 1, as a class feature.
   {className, known: [its cantrips], options: [ones to take instead]} or null. */
function formulaClass(c){
  var wiz = classEntryOf(c, "Wizard");
  if(wiz && (wiz.edition==="2024" || (c.tashaOptional && (Number(wiz.level)||1) >= 3))) return wiz;
  return (c.classes||[]).find(function(cl){ return cl.name==="Artificer" && cl.edition==="2024"; }) || null;
}
export function cantripFormulas(c){
  var cl = formulaClass(c);
  if(!cl) return null;
  var known = classKnownSpells(c, cl.name).cantrips.map(function(sp){ return sp.name; }).sort();
  if(!known.length) return null;
  var onSheet = (c.spells||[]).map(function(sp){ return spellKey(sp.name); }).concat(grantedNames(c));
  var options = classListNames(cl, casterDef(cl.name, "", cl.edition), [0], true, c).names.filter(function(n){ return onSheet.indexOf(spellKey(n))===-1; });
  return {className: cl.name, known: known, options: options};
}
/* Makes the swap: `out` leaves, `inName` takes its place (ready, as
   cantrips are). True when done. */
export function swapCantripFormula(c, out, inName){
  var cf = cantripFormulas(c);
  if(!cf || cf.known.indexOf(out)===-1 || cf.options.indexOf(inName)===-1) return false;
  var at = c.spells.findIndex(function(sp){ return sp.name===out && (sp.learnedBy===cf.className || !sp.learnedBy); });
  if(at===-1) return false;
  var sp = spellFromCatalog(inName, SPELL_DATA[inName]);
  sp.learnedBy = cf.className;
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
    var def = casterDef(cl.name, cl.subclass, cl.edition);
    if(!def) return;
    var lv = Number(cl.level)||1;
    var known = classKnownSpells(c, cl.name);
    var row = {className: cl.subclass && SUBCLASS_CASTERS[cl.name + ":" + cl.subclass] ? cl.subclass : cl.name, spells: null, cantrips: null, prepared: null};
    if(known.certain){
      if(def.cantrips[lv]) row.cantrips = {have: known.cantrips.length, max: def.cantrips[lv] + bonusCantripsOf(cl)};
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
  return preparedAt(cl.name, Number(cl.level)||1, cl.edition);
}
/* True when a sheet spell is always ready: a cantrip, or a spell a
   known caster learned (bards, sorcerers, warlocks and rangers don't
   prepare). Only spells of preparing classes show a Prepared switch. */
export function spellNeedsPreparing(c, sp){
  if(!(sp.level||0) || sp.arcanum || alwaysPrepared(c, sp)) return false;
  if(sp.learnedBy) return classPrepares(c, sp.learnedBy);
  var owner = untaggedOwner(c);
  if(owner) return classPrepares(c, owner);
  return (c.classes||[]).some(function(cl){ return classPrepares(c, cl.name); });
}
/* Whether the character's class of that name prepares its spells (the 2024
   ranger does, the 2014 one knows a set). */
export function classPrepares(c, className){
  var cl = classEntryOf(c, className);
  return !!preparingDef(className, cl && cl.edition);
}

/* The preparing class a sheet spell belongs to, or "" when it has none
   or it can't be told (two preparing classes and an untagged spell). */
export function preparingClassFor(c, sp){
  if(!spellNeedsPreparing(c, sp)) return "";
  if(sp.learnedBy) return sp.learnedBy;
  var owner = untaggedOwner(c);
  if(owner) return classPrepares(c, owner) ? owner : "";
  var preparing = (c.classes||[]).filter(function(cl){ return classPrepares(c, cl.name); });
  return preparing.length===1 ? preparing[0].name : "";
}
/* {have, max} prepared today for a preparing class, or null. */
export function preparedState(c, className){
  var cl = classEntryOf(c, className);
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
  var cl = cls && classEntryOf(c, cls);
  var def = cl && casterDef(cl.name, cl.subclass, cl.edition);
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
