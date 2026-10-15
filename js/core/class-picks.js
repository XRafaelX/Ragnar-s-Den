import { SKILLS, ABILITIES } from "../data/abilities-skills.js";
import { CLASS_PROFICIENCIES } from "../data/classes.js";
import { CLASS_PROGRESSION, SUBCLASSES } from "../data/progression.js";
import { RACE_DATA } from "../data/race-data.js";
import { BACKGROUND_PROFS, BACKGROUND_SKILL_FIXES } from "../data/backgrounds.js";
import { OPTION_SETS, optionSetStart } from "../data/class-options.js";
import { LANGUAGES, LANGUAGE_GROUP_LABELS } from "../data/languages.js";
import { WEAPON_DATA, WEAPON_GROUPS } from "../data/weapons.js";
import { SPELL_DATA, spellDataForClass } from "../data/spells.js";
import { TOOL_GROUPS, featProficiencies } from "./feat-picks.js";
import { classCasterType, classFeaturesAt } from "./class-features.js";
import { spellHeldBy } from "./spell-grants.js";

/* ---------------- Class picks ----------------
   Skills, expertise, tools, languages, saving throws, weapons and spells
   a class or subclass feature gives beyond its armor and weapon lists,
   and the choices some of them ask for: a bard's or rogue's Expertise,
   College of Lore's three skills, a Battle Master's artisan's tools, a
   Samurai's saving throw, a Kensei's weapons, the skill a second class
   adds, an Arcana cleric's wizard cantrips, a wizard's Signature Spells.

   A feature says what it gives with `profs` (class features in
   js/data/classes.js and js/data/progression.js, a Tasha's variant of
   one, subclass features in js/data/subclasses, a class's
   `multiclassProfs`, an option in js/data/class-options.js):
     skills      skills given outright (nothing if already proficient)
     expertise   skills whose proficiency bonus is doubled outright
     languages   languages learned outright
     help        one plain line shown above the pickers
     pick        [slot]: the choices, each
       kind      "skill", "expertise", "tool", "language", "save",
                 "weapon", "skillOrLanguage", "skillOrTool", "toolOrLanguage",
                 "spell" or "choice"
       count     how many to pick (default 1)
       label     the line above its pickers (else worked out)
       options   what it can be: skill names (none = any skill), tool
                 names, languages, abilities ("wis")
       fallback  what it can be instead once every option is already had
                 (Royal Envoy: Persuasion, else one of four skills; Iron
                 Mind: WIS, else INT or CHA); "any" for any language
       expertise (skill) the picked skills also get expertise, and one
                 already proficient stays pickable (Blessings of Knowledge)
       tools     (expertise) tools it may go to instead of a skill
       group     (tool) a TOOL_GROUPS key in place of options; with
                 neither, any tool
       noun      (tool) what one of the group is called ("musical
                 instrument"), for the label
       kinds     (tool) in place of a group: one pick of each kind listed,
                 a kind being a TOOL_GROUPS key or a single tool ("one
                 musical instrument or artisan's tools"; with count 2 of
                 three kinds, Urban Bounty Hunter's)
       byChoice  (tool) {slot, groups}: the group the pick comes from
                 depends on what the grant's `choice` slot picked (a House
                 Agent's house: Deneith adds one gaming set); none for a
                 choice not listed (nothing to pick)
       filter    (weapon) "oneHandedMelee", "kenseiMelee", "kenseiRanged",
                 "kensei" or "martial" (a martial weapon not had yet)
       monk      (weapon) the weapon counts as a monk weapon
       level, list, schools  (spell) the spell level, the class list it
                 comes from (none = any class's) and its schools; or
                 `options` names the spells outright (Druidcraft or
                 Thaumaturgy); or from:"spellbook" picks among this
                 class's spells of that level already on the sheet
       grant     (spell) how the spell is had: "known" (the default for a
                 cantrip), "prepared" (always prepared, not counted) or
                 "mastery" (still prepared as usual; Spell Mastery)
       ability   (spell) the ability it is cast with, for a class that
                 has none of its own (Giant's Power: "wis")
       kindLabel, note  (spell) its tag and a line for the Spells tab
       id, options or groups, details, custom, noun  (choice) a pick from
                 a named list that the sheet only shows (a favored enemy,
                 a dragon ancestor): `id` ties the same choice across
                 levels so nothing is chosen twice, `groups` is {heading:
                 [names]}, `details` {name: what it means}, `custom` lets
                 the player type their own (two humanoid races)
       optional  the slot may be left empty (a favored enemy's language,
                 "if they speak one at all"); `none` words that option

   A grant's `toolsByChoice` {slot, tools: {choice: [tools]}} gives tools
   outright by what its `choice` slot picked (a House Agent's house).
   Races give things the same way: a trait's `profs` in RACE_DATA (Keen
   Senses' Perception, Dwarven Combat Training's weapons, a dwarf's tool
   choice), which may also list `weapons` and `tools` given outright.
   Their picks are kept on c.racePicks, which stands in for a class entry
   (see raceGrants). And so do backgrounds: BACKGROUND_PROFS (a Criminal's
   thieves' tools and gaming set), kept on c.backgroundPicks.

   What was picked is kept on the class entry as
   cl.profPicks[key] = {slots: [[values], ...], applied}. `slots` lines up
   with `pick`; `applied` is what that changed on the sheet (a skill
   already proficient changes nothing), so undoing the level-up or picking
   again takes back exactly that. Skills and languages are written onto
   the character; tools, saves, weapons and spells are read from the picks
   (see classProficiencies, computeSave and featureSpells). {manual: true} marks a choice the
   player says is already on the sheet (older characters, who ticked it by
   hand). */

var SKILL_NAMES = SKILLS.map(function(s){ return s[0]; });
function isSkill(v){ return SKILL_NAMES.indexOf(v)!==-1; }
function abilityName(k){ var a = ABILITIES.find(function(x){ return x[0]===k; }); return a ? a[1] : k; }
function lower(s){ return (s||"").toLowerCase(); }
function listText(list, word){
  return list.length > 1 ? list.slice(0, -1).join(", ") + " " + (word || "and") + " " + list[list.length-1] : list[0] || "";
}

/* ---- Which features give something ---- */
function subclassOf(cl){
  return cl && cl.subclass ? (SUBCLASSES[cl.name]||[]).find(function(s){ return s.name===cl.subclass; }) || null : null;
}
/* Everything a class entry's features give at `level` (default: its own),
   as [{key, name, source, level, def}]. `multiclass`: it isn't the
   character's first class, so it adds the class's multiclass picks. */
export function entryGrants(cl, multiclass, level){
  if(!cl) return [];
  var lv = level!=null ? level : (Number(cl.level)||1);
  var out = [], prog = CLASS_PROGRESSION[cl.name], sub = subclassOf(cl);
  if(multiclass && prog && prog.multiclassProfs && prog.multiclassProfs.profs){
    out.push({key: "multiclass", name: cl.name + " training", source: "Multiclass · " + cl.name, level: 1, def: prog.multiclassProfs.profs});
  }
  for(var i = 1; i <= lv; i++) classFeaturesAt(cl, i).forEach(function(f){
    if(f.profs) out.push({key: "class:" + f.name + "@" + i, name: f.name, source: cl.name + " · Lv " + i, level: i, feature: f.name, def: f.profs});
  });
  if(sub) for(var j = 1; j <= lv; j++) ((sub.features && sub.features[j]) || []).forEach(function(f){
    if(f.profs) out.push({key: "sub:" + cl.subclass + ":" + f.name + "@" + j, name: f.name, source: cl.subclass + " · Lv " + j, level: j, feature: f.name, subclass: true, def: f.profs});
  });
  OPTION_SETS.forEach(function(set){
    if(set.className!==cl.name || (set.subclass && set.subclass!==cl.subclass) || lv < optionSetStart(set)) return;
    ((cl.options && cl.options[set.id]) || []).forEach(function(e){
      var o = set.options.find(function(x){ return x.name===e.name; });
      if(o && o.profs) out.push({key: "opt:" + set.id + ":" + o.name, name: set.label + ": " + o.name, source: (set.subclass || cl.name) + " · Lv " + optionSetStart(set), level: optionSetStart(set), def: o.profs});
    });
  });
  return out;
}
/* Every grant the character has now, each with its class entry. */
export function classGrants(c){
  var out = [];
  (c.classes||[]).forEach(function(cl, idx){
    entryGrants(cl, idx > 0).forEach(function(g){ g.cl = cl; out.push(g); });
  });
  return out;
}
export function grantEntry(cl, key){
  return (cl && cl.profPicks && cl.profPicks[key]) || null;
}
/* True when one of a grant's choices is a spell. */
export function grantHasSpells(def){
  return !!(def && (def.pick||[]).some(function(s){ return s.kind==="spell"; }));
}
/* Something the player has to choose (not just given outright). */
export function grantHasChoices(def){
  return !!(def && def.pick && def.pick.length);
}

/* ---- The character as the pickers see it ----
   What `c` already has, leaving out what the grant `key` on `cl` gave
   itself (so picking again starts clean). `taken(value)`, when the caller
   sets it, names why a value is spoken for elsewhere ("picked"). */
export function classPickContext(c, cl, key){
  var own = (grantEntry(cl, key) || {}).applied || {};
  var profs = allProficiencies(c, cl, key);
  // The character without this grant's own picks, for what it already has.
  var others = Object.assign({}, c, {classes: (c.classes||[]).map(function(x){
    if(x!==cl || !grantEntry(cl, key)) return x;
    var rest = Object.assign({}, x.profPicks); delete rest[key];
    return Object.assign({}, x, {profPicks: rest});
  })});
  var casters = (c.classes||[]).filter(function(x){ return classCasterType(x); });
  return {
    // What the entry's other features already chose for a `choice` id.
    chosen: function(id){
      var out = [];
      if(!cl) return out;
      entryGrants(cl, (c.classes||[]).indexOf(cl) > 0).forEach(function(g){
        var entry = grantEntry(cl, g.key);
        if(!entry || g.key===key) return;
        (g.def.pick||[]).forEach(function(s, i){ if(s.kind==="choice" && s.id===id) out = out.concat((entry.slots && entry.slots[i]) || []); });
      });
      return out;
    },
    tasha: !!c.tashaOptional,
    // "known", "from Fey Touched" or "" (see spellHeldBy).
    spellHeld: function(name){ return spellHeldBy(others, name); },
    // This class's spells of a level on the sheet (a wizard's spellbook).
    spellbook: function(level){
      return (c.spells||[]).filter(function(sp){
        return (sp.level||0)===level && !sp.arcanum && (sp.learnedBy ? !!cl && sp.learnedBy===cl.name : casters.length===1 && casters[0]===cl);
      }).map(function(sp){ return sp.name; }).sort();
    },
    skillProf: function(sk){ var e = c.skillProfs && c.skillProfs[sk]; return !!(e && e.prof) && (own.skills||[]).indexOf(sk)===-1; },
    skillExpert: function(sk){ var e = c.skillProfs && c.skillProfs[sk]; return !!(e && e.expertise) && (own.expertise||[]).indexOf(sk)===-1; },
    knowsLanguage: function(l){ return (c.languages||[]).some(function(x){ return lower(x)===lower(l); }) && (own.languages||[]).indexOf(l)===-1; },
    hasTool: function(t){ return profs.tools.indexOf(lower(t))!==-1; },
    toolExpert: function(t){ return profs.toolExpertise.indexOf(lower(t))!==-1; },
    saveKnown: function(k){ return !!(c.saveProfs && c.saveProfs[k]) || profs.saves.indexOf(k)!==-1; },
    knowsWeapon: function(w){ return profs.weapons.indexOf(lower(w))!==-1 || profs.weapons.indexOf(((WEAPON_DATA[w]||{}).category||"-") + " weapons")!==-1; },
    monkWeapon: function(w){ return profs.monkWeapons.indexOf(lower(w))!==-1; }
  };
}
/* Tools, saves and weapons from every source but the grant left out. */
function allProficiencies(c, exceptCl, exceptKey){
  var out = {tools: [], saves: [], weapons: [], toolExpertise: [], monkWeapons: []};
  function add(list, v){ v = lower(v); if(v && list.indexOf(v)===-1) list.push(v); }
  (c.classes||[]).forEach(function(cl, idx){
    var prog = CLASS_PROGRESSION[cl.name];
    var base = idx===0 || !prog ? CLASS_PROFICIENCIES[cl.name] : prog.multiclassProfs;
    (base && base.tools || []).forEach(function(t){ add(out.tools, t); });
    (base && base.weapons || []).forEach(function(w){ add(out.weapons, w); });
    if(idx===0) (base && base.savingThrows || []).forEach(function(k){ add(out.saves, k); });
    featureGrants(cl).forEach(function(g){
      (g.tools||[]).forEach(function(t){ add(out.tools, t); });
      (g.weapons||[]).forEach(function(w){ add(out.weapons, w); });
      (g.savingThrows||[]).forEach(function(k){ add(out.saves, k); });
    });
    var picked = pickedProfs(cl, idx > 0, cl===exceptCl ? exceptKey : null);
    picked.tools.forEach(function(t){ add(out.tools, t); });
    picked.weapons.forEach(function(w){ add(out.weapons, w); });
    picked.saves.forEach(function(s){ add(out.saves, s.ability); });
    picked.toolExpertise.forEach(function(t){ add(out.toolExpertise, t); });
    picked.monkWeapons.forEach(function(w){ add(out.monkWeapons, w); });
  });
  var race = raceProficiencies(c, exceptCl && exceptCl===c.racePicks ? exceptKey : null);
  race.tools.forEach(function(t){ add(out.tools, t); });
  race.weapons.forEach(function(w){ add(out.weapons, w); });
  backgroundProficiencies(c, exceptCl && exceptCl===c.backgroundPicks ? exceptKey : null).tools.forEach(function(t){ add(out.tools, t); });
  var feats = featProficiencies(c);
  feats.tools.forEach(function(t){ add(out.tools, t.name); });
  feats.weapons.forEach(function(w){ add(out.weapons, w.name); });
  feats.saves.forEach(function(s){ add(out.saves, s.ability); });
  return out;
}
/* The `grants` of a class entry's features, read from the data (a later
   version of a feature doesn't hide an earlier one's here). */
function featureGrants(cl){
  var lv = Number(cl.level)||1, out = [], sub = subclassOf(cl);
  for(var i = 1; i <= lv; i++) classFeaturesAt(cl, i).forEach(function(f){ if(f.grants) out.push(f.grants); });
  if(sub) for(var j = 1; j <= lv; j++) ((sub.features && sub.features[j]) || []).forEach(function(f){ if(f.grants) out.push(f.grants); });
  return out;
}

/* ---- One slot's options ----
   What slot `i` of a grant can be now, as [{value, group, reason}]:
   `reason` is "" when it can be picked, else why not ("known", "picked",
   "expertise"). Picks in the grant's other slots count: a skill picked
   above can't be picked twice, and can take the expertise below it.
   ctx.taken(value, kind) and ctx.gaining() say the same for what the
   level-up's other features pick. */
export function slotOptions(def, slots, i, ctx){
  var slot = def.pick[i], mine = (slots && slots[i]) || [];
  var isExpertise = slot.kind==="expertise";
  // Other slots of the same sort (expertise, or new proficiencies) and
  // the skills the grant's other slots add.
  var others = [], gained = (def.skills||[]).concat(ctx.gaining ? ctx.gaining() : []);
  (def.pick||[]).forEach(function(s, j){
    if(j===i) return;
    var picks = (slots && slots[j]) || [];
    if((s.kind==="expertise")===isExpertise) others = others.concat(picks);
    if(s.kind!=="expertise") gained = gained.concat(picks.filter(isSkill));
  });
  function taken(v){
    if(others.indexOf(v)!==-1) return "picked";
    return ctx.taken && mine.indexOf(v)===-1 ? ctx.taken(v, slot.kind) || "" : "";
  }
  function entries(values, group, why, kind){
    return values.map(function(v){ var o = {value: v, group: group || "", reason: why(v) || taken(v)}; if(kind) o.kind = kind; return o; });
  }
  function open(list){ return list.some(function(o){ return !o.reason; }); }
  function skillWhy(v){
    if(slot.expertise) return ctx.skillExpert(v) ? "expertise" : "";
    return ctx.skillProf(v) || (def.skills||[]).indexOf(v)!==-1 ? "known" : "";
  }
  function langWhy(v){ return ctx.knowsLanguage(v) || (def.languages||[]).indexOf(v)!==-1 ? "known" : ""; }
  function allLanguages(){
    return entries(LANGUAGES.Standard, LANGUAGE_GROUP_LABELS.Standard, langWhy).concat(entries(LANGUAGES.Exotic, LANGUAGE_GROUP_LABELS.Exotic, langWhy));
  }
  var list;
  if(slot.kind==="skill"){
    // Set by the grant's choice (a shifter's type: Beasthide, Athletics).
    if(slot.byChoice){
      var chosenType = ((slots && slots[slot.byChoice.slot]) || [])[0];
      return entries((chosenType && slot.byChoice.options[chosenType]) || [], "", skillWhy);
    }
    list = entries(slot.options || SKILL_NAMES, "", skillWhy);
    if(!open(list) && slot.fallback) list = entries(slot.fallback, "", skillWhy);
    return list;
  }
  if(slot.kind==="expertise"){
    var skills = SKILL_NAMES.filter(function(sk){ return ctx.skillProf(sk) || gained.indexOf(sk)!==-1; });
    list = entries(skills, slot.tools ? "Skills" : "", function(v){ return ctx.skillExpert(v) || (def.expertise||[]).indexOf(v)!==-1 ? "expertise" : ""; });
    return list.concat(entries((slot.tools||[]).filter(function(t){ return ctx.hasTool(t); }), "Tools", function(v){ return ctx.toolExpert(v) ? "expertise" : ""; }));
  }
  function toolWhy(v){ return ctx.hasTool(v) ? "known" : ""; }
  function allTools(){
    return Object.keys(TOOL_GROUPS).reduce(function(a, g){ return a.concat(entries(TOOL_GROUPS[g], g, toolWhy)); }, []);
  }
  if(slot.kind==="tool"){
    // One of each kind listed ("an instrument or artisan's tools").
    if(slot.kinds) return slot.kinds.reduce(function(a, k){
      return a.concat(TOOL_GROUPS[k] ? entries(TOOL_GROUPS[k], k, toolWhy, k) : entries([k], "", toolWhy, k));
    }, []);
    // From the group the grant's choice names (a house's gaming set).
    if(slot.byChoice){
      var picked = ((slots && slots[slot.byChoice.slot]) || [])[0];
      var g = picked && slot.byChoice.groups[picked];
      return g ? entries(TOOL_GROUPS[g] || [], "", toolWhy) : [];
    }
    if(!slot.options && !slot.group) return allTools();
    return entries(slot.options || TOOL_GROUPS[slot.group] || [], "", toolWhy);
  }
  if(slot.kind==="toolOrLanguage"){
    return entries(slot.options, "Tools", toolWhy).concat(allLanguages());
  }
  if(slot.kind==="skillOrTool"){
    return entries(SKILL_NAMES, "Skills", skillWhy).concat(allTools());
  }
  if(slot.kind==="language"){
    if(!slot.options) return allLanguages();
    list = entries(slot.options, "", langWhy);
    return !open(list) && slot.fallback==="any" ? allLanguages() : list;
  }
  if(slot.kind==="save"){
    var saveWhy = function(v){ return ctx.saveKnown(v) ? "known" : ""; };
    list = entries(slot.options, "", saveWhy);
    if(!open(list) && slot.fallback) list = entries(slot.fallback, "", saveWhy);
    return list;
  }
  if(slot.kind==="weapon"){
    list = [];
    Object.keys(WEAPON_GROUPS).forEach(function(g){
      // A weapon already known stays pickable; a kensei weapon already chosen doesn't.
      list = list.concat(entries(WEAPON_GROUPS[g].filter(function(n){ return weaponFits(slot.filter, n); }), g,
        function(v){
          if(slot.monk) return ctx.monkWeapon && ctx.monkWeapon(v) ? "known" : "";
          // A martial weapon the character can already use is no gain.
          return slot.filter==="martial" && ctx.knowsWeapon && ctx.knowsWeapon(v) ? "known" : "";
        }));
    });
    return list;
  }
  if(slot.kind==="skillOrLanguage"){
    return entries(slot.options, "Skills", skillWhy).concat(allLanguages());
  }
  if(slot.kind==="choice"){
    var had = ctx.chosen ? ctx.chosen(slot.id) : [];
    var why = function(v){ return had.indexOf(v)!==-1 ? "chosen" : ""; };
    list = [];
    if(slot.groups) Object.keys(slot.groups).forEach(function(g){ list = list.concat(entries(slot.groups[g], g, why)); });
    else list = entries(slot.options, "", why);
    // Something the player typed in themselves.
    if(slot.custom) mine.forEach(function(v){ if(v && !list.some(function(o){ return o.value===v; })) list.push({value: v, group: "", reason: why(v), custom: true}); });
    return list;
  }
  if(slot.kind==="spell"){
    if(slot.from==="spellbook") return entries(ctx.spellbook ? ctx.spellbook(slot.level) : [], "", function(){ return ""; });
    var pool = slot.list ? spellDataForClass(slot.list, !!ctx.tasha) : SPELL_DATA;
    var names = slot.options || Object.keys(pool).filter(function(n){
      return pool[n].level===slot.level && (!slot.schools || slot.schools.indexOf(pool[n].school)!==-1);
    }).sort();
    return entries(names, "", function(v){
      var held = ctx.spellHeld ? ctx.spellHeld(v) : "";
      // A cantrip already had is no use twice. A spell made always
      // prepared may be one the character also has on their own list.
      if(spellGrant(slot)==="known") return held;
      return /^from /.test(held) ? held : "";
    });
  }
  return [];
}
function spellGrant(slot){ return slot.grant || "known"; }
function weaponFits(filter, name){
  var d = WEAPON_DATA[name];
  if(!d) return false;
  var props = d.properties || "";
  if(filter==="oneHandedMelee") return !d.ranged && !/two-handed/i.test(props);
  if(filter==="martial") return d.category==="martial";
  // A kensei weapon: no heavy or special property; a longbow is allowed.
  var kensei = name==="Longbow" || !/heavy|special/i.test(props);
  if(filter==="kenseiMelee") return kensei && !d.ranged;
  if(filter==="kenseiRanged") return kensei && d.ranged;
  if(filter==="kensei") return kensei;
  return true;
}
/* How many of a slot's picks can still be made (fewer than its count
   when the character already has most of what it offers). */
function slotNeed(def, slots, i, ctx){
  if(def.pick[i].optional) return 0;
  var openCount = slotOptions(def, slots, i, ctx).filter(function(o){ return !o.reason || ((slots && slots[i]) || []).indexOf(o.value)!==-1; }).length;
  return Math.min(def.pick[i].count || 1, openCount);
}
/* The slots tidied up: picks that no longer fit dropped, and a slot with
   nothing to choose (as many options as picks) filled in. In place when
   `slots` is given; returns it. */
export function fillSlots(def, slots, ctx){
  slots = slots || [];
  (def.pick||[]).forEach(function(slot, i){
    var opts = slotOptions(def, slots, i, ctx);
    var cur = (slots[i] || []).filter(function(v, n, all){
      var o = opts.find(function(x){ return x.value===v; });
      return o && !o.reason && all.indexOf(v)===n;
    }).slice(0, slot.count || 1);
    var openOpts = opts.filter(function(o){ return !o.reason; });
    slots[i] = !slot.optional && openOpts.length <= (slot.count || 1) ? openOpts.map(function(o){ return o.value; }) : cur;
  });
  slots.length = (def.pick||[]).length;
  return slots;
}
/* A slot with nothing to choose: it has only as many options as picks. */
export function slotIsFixed(def, slots, i, ctx){
  if(def.pick[i].optional) return false;
  return slotOptions(def, slots, i, ctx).filter(function(o){ return !o.reason; }).length <= (def.pick[i].count || 1);
}
/* The line above a slot's pickers. */
export function slotLabel(def, slots, i, ctx){
  var slot = def.pick[i], n = slot.count || 1;
  if(slot.label) return slot.label;
  var opts = slotOptions(def, slots, i, ctx).map(function(o){ return o.value; });
  if(slot.kind==="skill"){
    if(slot.byChoice) return opts.length ? "It gives you " + listText(opts) : "";
    var tail = slot.expertise ? ", with your proficiency bonus doubled" : "";
    if(slot.options || slot.fallback) return "Gain proficiency in " + (n > 1 ? n + " of " : "") + listText(opts, n > 1 ? "and" : "or") + tail;
    return "Gain proficiency in " + (n > 1 ? n + " skills" : "a skill") + " of your choice" + tail;
  }
  if(slot.kind==="expertise") return "Expertise: double your proficiency bonus in " + (n > 1 ? n + " skills" : "a skill") + " you're proficient in" +
    (slot.tools ? " (or " + lower(listText(slot.tools, "or")) + ")" : "");
  if(slot.kind==="tool"){
    if(slot.kinds){
      var kindText = slot.kinds.map(function(k){ return TOOL_GROUPS[k] ? kindNoun(k) : lower(k); });
      return "Gain proficiency with " + (n > 1 ? n + " of: " + listText(kindText, "and") + " (different kinds)" : listText(kindText, "or"));
    }
    if(slot.byChoice){
      var chosenGroup = slot.byChoice.groups[((slots && slots[slot.byChoice.slot]) || [])[0]];
      return chosenGroup ? "Your house also gives " + kindNoun(chosenGroup) + " of your choice" : "";
    }
    if(slot.noun) return "Gain proficiency with " + (n > 1 ? n + " " + slot.noun + "s" : "one " + slot.noun) + " of your choice";
    if(!slot.options && !slot.group) return "Gain proficiency with " + (n > 1 ? n + " tools" : "a tool") + " of your choice";
    return "Gain proficiency with " + (slot.group ? "one type of " + lower(slot.group) : n > 1 ? n + " tools" : listText(opts.map(lower), "or"));
  }
  if(slot.kind==="language") return "Learn " + (n > 1 ? n + " languages" : "a language") + " of your choice";
  if(slot.kind==="save") return "Gain proficiency in " + listText(opts.map(abilityName), "or") + " saving throws";
  if(slot.kind==="weapon"){
    var kind = slot.filter==="martial" ? "martial weapon" : "weapon";
    return "Gain proficiency with " + (n > 1 ? n + " " + kind + "s" : "a " + kind) + " of your choice";
  }
  if(slot.kind==="skillOrTool") return "Gain proficiency in a skill or with a tool of your choice";
  if(slot.kind==="toolOrLanguage") return "Gain proficiency with " + lower(listText(slot.options, "or")) + ", or learn a language";
  if(slot.kind==="skillOrLanguage") return "Gain proficiency in " + listText(slot.options, "or") + ", or learn a language";
  if(slot.kind==="choice") return "Choose " + (/^[aeiou]/.test(slot.noun) ? "an " : "a ") + slot.noun;
  if(slot.kind==="spell"){
    var what = slot.level===0 ? "cantrip" : "spell";
    if(slot.options) return "Learn " + listText(slot.options, "or");
    return "Choose " + (n > 1 ? n + " " : (slot.list && /^[AEIOU]/.test(slot.list) ? "an " : "a ")) + (slot.list ? slot.list.toLowerCase() + " " : "") + what + (n > 1 ? "s" : "");
  }
  return "";
}
/* "one musical instrument", "one type of artisan's tools", "one gaming set". */
function kindNoun(group){
  return {"Gaming sets": "one gaming set", "Musical instruments": "one musical instrument", "Artisan's tools": "one type of artisan's tools",
    "Vehicles": "one type of vehicle"}[group] || "one of " + lower(group);
}
/* The kind (group or single tool) a `kinds` slot's value belongs to. */
function toolKind(slot, v){
  return (slot.kinds || []).find(function(k){ return TOOL_GROUPS[k] ? TOOL_GROUPS[k].indexOf(v)!==-1 : k===v; }) || "";
}
/* What's still missing ("" when the picks are complete). */
export function classPicksProblem(grant, slots, ctx){
  var def = grant.def;
  if(!grantHasChoices(def)) return "";
  for(var i = 0; i < def.pick.length; i++){
    var need = slotNeed(def, slots, i, ctx);
    var opts = slotOptions(def, slots, i, ctx);
    var got = ((slots && slots[i]) || []).filter(function(v, n, all){
      var o = opts.find(function(x){ return x.value===v; });
      return o && !o.reason && all.indexOf(v)===n;
    });
    // One of each kind: two instruments for Urban Bounty Hunter won't do.
    if(def.pick[i].kinds && new Set(got.map(function(v){ return toolKind(def.pick[i], v); })).size < got.length){
      return "Choose tools of different kinds for " + grant.name + ".";
    }
    if(got.length < need){
      var kind = def.pick[i].kind;
      var houseGroup = def.pick[i].byChoice && def.pick[i].byChoice.groups && def.pick[i].byChoice.groups[((slots && slots[def.pick[i].byChoice.slot]) || [])[0]];
      var noun = {skill: "skill", expertise: "skill", tool: def.pick[i].noun || (houseGroup ? kindNoun(houseGroup).replace(/^one (type of )?/, "") : "tool"), language: "language", save: "saving throw",
        weapon: def.pick[i].filter==="martial" ? "martial weapon" : "weapon", skillOrLanguage: "skill or language", skillOrTool: "skill or tool", toolOrLanguage: "tool or language",
        spell: def.pick[i].level===0 ? "cantrip" : "spell", choice: def.pick[i].noun}[kind];
      return "Choose " + (need > 1 ? need + " different " + noun + "s" : (/^[aeiou]/.test(noun) ? "an " : "a ") + noun) +
        (kind==="expertise" ? " for your expertise (" + grant.name + ")." : " for " + grant.name + ".");
    }
  }
  return "";
}

/* ---- Apply and take back ---- */
/* Write a grant's picks onto the character; picks made before are taken
   back first. */
export function applyClassPicks(c, cl, grant, slots){
  var def = grant.def;
  revertClassPicks(c, cl, grant.key);
  slots = (def.pick||[]).map(function(s, i){ return ((slots && slots[i]) || []).filter(Boolean).slice(0, s.count || 1); });
  var applied = {skills: [], expertise: [], languages: [], weaponItems: []};
  // (Weapons given outright: a race's weapon training.)
  var skills = (def.skills||[]).slice(), expertise = (def.expertise||[]).slice(), languages = (def.languages||[]).slice(), weapons = (def.weapons||[]).slice();
  (def.pick||[]).forEach(function(slot, i){
    slots[i].forEach(function(v){
      if(slot.kind==="skill"){ skills.push(v); if(slot.expertise) expertise.push(v); }
      else if(slot.kind==="expertise"){ if(isSkill(v)) expertise.push(v); }
      else if(slot.kind==="language") languages.push(v);
      else if(slot.kind==="weapon") weapons.push(v);
      else if(slot.kind==="skillOrLanguage"){ if(isSkill(v)) skills.push(v); else languages.push(v); }
      else if(slot.kind==="skillOrTool"){ if(isSkill(v)) skills.push(v); }
      else if(slot.kind==="toolOrLanguage"){ if((slot.options||[]).indexOf(v)===-1) languages.push(v); }
    });
  });
  if(!c.skillProfs) c.skillProfs = {};
  skills.concat(expertise).forEach(function(sk){
    var e = c.skillProfs[sk] || {prof: false, expertise: false};
    if(!e.prof){ e.prof = true; applied.skills.push(sk); }
    c.skillProfs[sk] = e;
  });
  expertise.forEach(function(sk){
    var e = c.skillProfs[sk];
    if(!e.expertise){ e.expertise = true; applied.expertise.push(sk); }
  });
  if(!Array.isArray(c.languages)) c.languages = ["Common"];
  languages.forEach(function(lang){
    if(c.languages.some(function(x){ return lower(x)===lower(lang); })) return;
    c.languages.push(lang); applied.languages.push(lang);
  });
  // Weapons already carried become proficient.
  (c.inventory||[]).forEach(function(item){
    if(item.type==="weapon" && !item.proficient && item.id && weapons.indexOf(item.name)!==-1){ item.proficient = true; applied.weaponItems.push(item.id); }
  });
  if(!cl.profPicks) cl.profPicks = {};
  cl.profPicks[grant.key] = {slots: slots, applied: applied};
  return cl.profPicks[grant.key];
}
/* Take back what a grant's picks changed, and forget them. */
export function revertClassPicks(c, cl, key){
  var entry = grantEntry(cl, key);
  if(!entry) return;
  var a = entry.applied || {};
  (a.expertise||[]).forEach(function(sk){ if(c.skillProfs && c.skillProfs[sk]) c.skillProfs[sk].expertise = false; });
  (a.skills||[]).forEach(function(sk){ if(c.skillProfs && c.skillProfs[sk]){ c.skillProfs[sk].prof = false; c.skillProfs[sk].expertise = false; } });
  if((a.languages||[]).length) c.languages = (c.languages||[]).filter(function(l){ return a.languages.indexOf(l)===-1; });
  (c.inventory||[]).forEach(function(item){ if((a.weaponItems||[]).indexOf(item.id)!==-1) item.proficient = false; });
  delete cl.profPicks[key];
}
/* A class entry is leaving the sheet (its only level undone). */
export function revertEntryPicks(c, cl){
  Object.keys((cl && cl.profPicks) || {}).forEach(function(key){ revertClassPicks(c, cl, key); });
}
/* The player says this one is already on the sheet. */
export function markClassPicksManual(cl, key){
  if(!cl.profPicks) cl.profPicks = {};
  cl.profPicks[key] = {manual: true};
}
/* Use (or stop using) one of a class's optional replacement features
   (Tasha's Favored Foe for Favored Enemy). The picks of the feature that
   goes are taken back, and the one that comes asks for its own. */
export function setClassVariant(c, cl, variant, on){
  if(!cl.variants) cl.variants = {};
  if(on) cl.variants[variant.replaces] = variant.name;
  else delete cl.variants[variant.replaces];
  syncClassPicks(c);
}

/* Characters made before these choices were kept with their feature have
   them as custom features ("Favored Enemy: Beasts", "Dragon Ancestor: Red
   dragon"). Each becomes the feature's own pick and the custom feature
   goes; the language that came with it stays on the sheet, unrecorded. */
var OLD_PICK_FEATURES = [
  {prefix: "Favored Enemy: ", cls: "Ranger", key: "class:Favored Enemy@1", slots: 2},
  {prefix: "Favored Terrain: ", cls: "Ranger", key: "class:Natural Explorer@1", slots: 1},
  {prefix: "Dragon Ancestor: ", cls: "Sorcerer", subclass: "Draconic Bloodline", key: "sub:Draconic Bloodline:Dragon Ancestor@1", slots: 1}
];
export function migrateClassPicks(c){
  var changed = false;
  OLD_PICK_FEATURES.forEach(function(old){
    var cl = (c.classes||[]).find(function(x){ return x.name===old.cls && (!old.subclass || x.subclass===old.subclass); });
    var f = (c.features||[]).find(function(x){ return x && x.source==="Class" && (x.name||"").indexOf(old.prefix)===0; });
    if(!cl || !f || grantEntry(cl, old.key)) return;
    var slots = [[f.name.slice(old.prefix.length)]];
    while(slots.length < old.slots) slots.push([]);
    if(!cl.profPicks) cl.profPicks = {};
    cl.profPicks[old.key] = {slots: slots, applied: {skills: [], expertise: [], languages: [], weaponItems: []}};
    c.features = c.features.filter(function(x){ return x!==f; });
    changed = true;
  });
  return changed;
}
/* ---- Race ----
   A race's traits give skills, weapons and tools too (`profs` on a trait
   in RACE_DATA). They go through the same engine: c.racePicks =
   {profPicks: {key: {slots, applied}}} stands in for a class entry. A
   trait that gives something outright and asks for a choice (a satyr's
   Reveler: two skills and an instrument) is two grants, so the given part
   goes on the sheet without waiting for the pick. */
export function raceEntry(c){
  if(!c.racePicks || typeof c.racePicks!=="object") c.racePicks = {profPicks: {}};
  if(!c.racePicks.profPicks) c.racePicks.profPicks = {};
  return c.racePicks;
}
export function raceGrantsFor(race){
  var out = [], source = "Race · " + race;
  ((RACE_DATA[race] && RACE_DATA[race].traits) || []).forEach(function(t){
    var p = t.profs;
    if(!p) return;
    if((p.skills||[]).length || (p.weapons||[]).length || (p.tools||[]).length){
      out.push({key: "race:" + t.name, name: t.name, source: source, feature: t.name, race: true,
        def: {skills: p.skills || [], weapons: p.weapons || [], tools: p.tools || []}});
    }
    if((p.pick||[]).length) out.push({key: "race:" + t.name + ":pick", name: t.name, source: source, feature: t.name, race: true, def: {pick: p.pick, presetChoice: p.presetChoice}});
  });
  return out;
}
export function raceGrants(c){ return raceGrantsFor(c.race); }
/* Skills, weapons, tools and armor the race gives, outright and picked
   (leaving out the grant `exceptKey`): {skills, weapons, tools, armor}. */
export function raceProficiencies(c, exceptKey){
  var out = {skills: [], weapons: [], tools: [], armor: ((RACE_DATA[c.race] || {}).armorProfs || []).slice()};
  var held = (c.racePicks && c.racePicks.profPicks) || {};
  raceGrants(c).forEach(function(g){
    if(g.key===exceptKey) return;
    out.skills = out.skills.concat(g.def.skills || []);
    out.weapons = out.weapons.concat(g.def.weapons || []);
    out.tools = out.tools.concat(g.def.tools || []);
    var entry = held[g.key];
    if(!entry || entry.manual) return;
    (g.def.pick||[]).forEach(function(slot, i){
      ((entry.slots && entry.slots[i]) || []).forEach(function(v){
        if(slot.kind==="weapon") out.weapons.push(v);
        else if(isSkill(v)) out.skills.push(v);
        else if(slot.kind==="tool" || slot.kind==="skillOrTool") out.tools.push(v);
      });
    });
  });
  return out;
}
/* "Your picks: ..." for the race's traits on the Features tab ("" for none). */
export function racePicksText(c){
  var held = (c.racePicks && c.racePicks.profPicks) || {};
  return raceGrants(c).filter(function(g){ return grantHasChoices(g.def); }).map(function(g){
    var s = classPicksSummary(g, held[g.key]);
    return s ? g.name + ": " + s : "";
  }).filter(Boolean).join("; ");
}
/* Every grant with a choice, class and race, each with the entry its
   picks are kept on (`cl`): for the Feature choices card. */
export function characterGrants(c){
  var holder = raceEntry(c), bgHolder = backgroundEntry(c);
  return classGrants(c).concat(raceGrants(c).map(function(g){ g.cl = holder; return g; }),
    backgroundGrants(c).map(function(g){ g.cl = bgHolder; return g; }));
}

/* ---- Background ----
   A background's tools (BACKGROUND_PROFS: a Criminal's thieves' tools and
   gaming set) go through the engine too, kept on c.backgroundPicks the
   way a race's are on c.racePicks. Skills and languages a background
   gives are still written by the creation wizard. */
export function backgroundEntry(c){
  if(!c.backgroundPicks || typeof c.backgroundPicks!=="object") c.backgroundPicks = {profPicks: {}};
  if(!c.backgroundPicks.profPicks) c.backgroundPicks.profPicks = {};
  return c.backgroundPicks;
}
export function backgroundGrantsFor(background){
  var p = BACKGROUND_PROFS[background], out = [], source = "Background · " + background;
  if(!p) return out;
  if((p.tools||[]).length) out.push({key: "bg:" + background, name: background, source: source, feature: background, background: true, def: {tools: p.tools}});
  if((p.pick||[]).length) out.push({key: "bg:" + background + ":pick", name: background, source: source, feature: background, background: true,
    def: {pick: p.pick, toolsByChoice: p.toolsByChoice}});
  return out;
}
export function backgroundGrants(c){ return backgroundGrantsFor(c.background); }
/* The tools the background gives, outright and picked (leaving out the
   grant `exceptKey`): {tools}. */
export function backgroundProficiencies(c, exceptKey){
  var out = {tools: []}, held = (c.backgroundPicks && c.backgroundPicks.profPicks) || {};
  backgroundGrants(c).forEach(function(g){
    if(g.key===exceptKey) return;
    out.tools = out.tools.concat(g.def.tools || []);
    var entry = held[g.key];
    if(!entry || entry.manual) return;
    var tbc = g.def.toolsByChoice, chosen = tbc && ((entry.slots && entry.slots[tbc.slot]) || [])[0];
    if(chosen) out.tools = out.tools.concat(tbc.tools[chosen] || []);
    (g.def.pick||[]).forEach(function(slot, i){
      ((entry.slots && entry.slots[i]) || []).forEach(function(v){
        if(slot.kind==="tool" || (slot.kind==="toolOrLanguage" && (slot.options||[]).indexOf(v)!==-1)) out.tools.push(v);
      });
    });
  });
  out.tools = out.tools.filter(function(t, i, all){ return all.indexOf(t)===i; });
  return out;
}
/* An older character whose background skills this app had wrong (see
   BACKGROUND_SKILL_FIXES): {background, was, now} where `now` lists the
   book's skills the sheet is missing and `was` the old ones it still has,
   or null (nothing missing, or the player chose to keep the sheet). */
export function backgroundSkillFix(c){
  var fix = BACKGROUND_SKILL_FIXES[c.background];
  if(!fix || c.backgroundSkillsChecked===c.background) return null;
  var has = function(sk){ var e = c.skillProfs && c.skillProfs[sk]; return !!(e && e.prof); };
  var now = fix.now.filter(function(sk){ return !has(sk); });
  if(!now.length) return null;
  return {background: c.background, now: now, was: fix.was.filter(has)};
}
/* Swap the old skills for the book's (`swap` true), or keep the sheet as
   it is; either way the offer goes. An old skill with expertise keeps its
   expertise on the new one. */
export function resolveBackgroundSkillFix(c, swap){
  var fix = backgroundSkillFix(c);
  if(fix && swap){
    if(!c.skillProfs) c.skillProfs = {};
    fix.now.forEach(function(sk, i){
      var old = fix.was[i] && c.skillProfs[fix.was[i]];
      var expertise = !!(old && old.expertise);
      if(old){ old.prof = false; old.expertise = false; }
      c.skillProfs[sk] = {prof: true, expertise: expertise};
    });
  }
  c.backgroundSkillsChecked = c.background;
}

/* "Your picks: ..." for the background on the Features tab ("" for none). */
export function backgroundPicksText(c){
  var held = (c.backgroundPicks && c.backgroundPicks.profPicks) || {};
  return backgroundGrants(c).filter(function(g){ return grantHasChoices(g.def); }).map(function(g){ return classPicksSummary(g, held[g.key]); }).filter(Boolean).join(", ");
}
/* Characters from before races used the engine: the creation wizard
   already asked a Variant Human, Half-Elf, Changeling or Warforged for
   their skills (ticked straight on the sheet) and a Warforged for a tool
   (kept as a "Tool proficiency: ..." feature). Those choices count as
   made: the tool moves onto the trait's picks, and a skill pick is marked
   as already on the sheet. Other races were never asked, so their choices
   wait on the Feature choices card. Once per character (until it has
   c.racePicks). */
var RACE_PICKS_ASKED_BEFORE = ["Variant Human", "Half-Elf", "Changeling", "Warforged"];
export function migrateRacePicks(c){
  if(c.racePicks && c.racePicks.profPicks) return false;
  var holder = raceEntry(c), asked = RACE_PICKS_ASKED_BEFORE.indexOf(c.race)!==-1;
  var toolFeatures = (c.features||[]).filter(function(f){ return f && f.source==="Race" && /^Tool proficiency: /.test(f.name || ""); });
  var tools = toolFeatures.map(function(f){ return f.name.replace(/^Tool proficiency: /, ""); });
  raceGrants(c).forEach(function(g){
    if(!grantHasChoices(g.def) || !asked) return;
    var slots = g.def.pick.map(function(slot){ return slot.kind==="tool" ? tools.splice(0, slot.count || 1) : []; });
    holder.profPicks[g.key] = slots.some(function(s){ return s.length; })
      ? {slots: slots, applied: {skills: [], expertise: [], languages: [], weaponItems: []}}
      : {manual: true};
  });
  if(asked && toolFeatures.length) c.features = c.features.filter(function(f){ return toolFeatures.indexOf(f)===-1; });
  return true;
}

/* Keep the sheet in step with its features: picks whose feature is gone
   (a level undone, a subclass changed, a totem removed) are taken back,
   and a new feature that gives things outright, with nothing to choose,
   is applied. Returns true if anything changed. */
export function syncClassPicks(c){
  var changed = false;
  (c.classes||[]).forEach(function(cl, idx){
    var grants = entryGrants(cl, idx > 0);
    Object.keys(cl.profPicks || {}).forEach(function(key){
      if(grants.some(function(g){ return g.key===key; })) return;
      revertClassPicks(c, cl, key); changed = true;
    });
    grants.forEach(function(g){
      if(grantEntry(cl, g.key) || grantHasChoices(g.def)) return;
      applyClassPicks(c, cl, g, []); changed = true;
    });
  });
  // The race's: what it gives outright goes on (an elf's Perception, a
  // dwarf's weapons), and picks for traits it doesn't have come off.
  var holder = raceEntry(c), rg = raceGrants(c);
  Object.keys(holder.profPicks).forEach(function(key){
    if(rg.some(function(g){ return g.key===key; })) return;
    revertClassPicks(c, holder, key); changed = true;
  });
  rg.forEach(function(g){
    if(grantEntry(holder, g.key) || grantHasChoices(g.def)) return;
    applyClassPicks(c, holder, g, []); changed = true;
  });
  // And the background's (its tools are read from the data; picks for a
  // background it no longer has come off).
  var bgHolder = backgroundEntry(c), bg = backgroundGrants(c);
  Object.keys(bgHolder.profPicks).forEach(function(key){
    if(bg.some(function(g){ return g.key===key; })) return;
    revertClassPicks(c, bgHolder, key); changed = true;
  });
  return changed;
}
/* Choices not made yet, each grant with its class entry. */
export function pendingClassPicks(c){
  return characterGrants(c).filter(function(g){ return grantHasChoices(g.def) && !grantEntry(g.cl, g.key); });
}

/* ---- What the picks give ---- */
/* Short text for a grant's picks: "Arcana, expertise in Stealth, Giant". */
export function classPicksSummary(grant, entry){
  if(!entry || entry.manual) return "";
  var bits = [];
  (grant.def.pick||[]).forEach(function(slot, i){
    ((entry.slots && entry.slots[i]) || []).forEach(function(v){
      if(slot.kind==="expertise" || slot.expertise) bits.push("expertise in " + v);
      else if(slot.kind==="save") bits.push(abilityName(v) + " saving throws");
      else bits.push(v);
    });
  });
  return bits.join(", ");
}
/* What a grant gives outright, as plain lines for the pickers. */
export function grantFixedLines(def){
  var lines = [];
  var both = (def.skills||[]).filter(function(s){ return (def.expertise||[]).indexOf(s)!==-1; });
  var plain = (def.skills||[]).filter(function(s){ return both.indexOf(s)===-1; });
  var doubled = (def.expertise||[]).filter(function(s){ return both.indexOf(s)===-1; });
  if(plain.length) lines.push("You gain proficiency in " + listText(plain) + ".");
  if(both.length) lines.push("You gain proficiency in " + listText(both) + ", with your proficiency bonus doubled.");
  if(doubled.length) lines.push("Your proficiency bonus is doubled for " + listText(doubled) + ".");
  if((def.languages||[]).length) lines.push("You learn " + listText(def.languages) + ".");
  return lines;
}
/* Tools, weapons, saves and spells a class entry's picks give: {tools,
   weapons, saves: [{ability, name}], toolExpertise, monkWeapons, spells:
   [{name, grant, feature, subclass, ability, kindLabel, note, book}]}.
   Only picks whose feature the entry still has count. */
export function pickedProfs(cl, multiclass, exceptKey){
  var out = {tools: [], weapons: [], saves: [], toolExpertise: [], monkWeapons: [], spells: []};
  if(!cl || !cl.profPicks) return out;
  entryGrants(cl, multiclass).forEach(function(g){
    var entry = grantEntry(cl, g.key);
    if(!entry || entry.manual || g.key===exceptKey) return;
    (g.def.pick||[]).forEach(function(slot, i){
      ((entry.slots && entry.slots[i]) || []).forEach(function(v){
        if(slot.kind==="tool" || (slot.kind==="skillOrTool" && !isSkill(v)) || (slot.kind==="toolOrLanguage" && (slot.options||[]).indexOf(v)!==-1)) out.tools.push(v);
        else if(slot.kind==="weapon"){ out.weapons.push(v); if(slot.monk) out.monkWeapons.push(v); }
        else if(slot.kind==="save") out.saves.push({ability: v, name: g.name});
        else if(slot.kind==="expertise" && !isSkill(v)) out.toolExpertise.push(v);
        else if(slot.kind==="spell") out.spells.push({name: v, grant: spellGrant(slot), feature: g.name, subclass: !!g.subclass, ability: slot.ability || "",
          kindLabel: slot.kindLabel || "", note: slot.note || "", book: slot.from==="spellbook"});
      });
    });
  });
  return out;
}
/* Across the whole character. */
export function characterPickedProfs(c){
  var out = {tools: [], weapons: [], saves: [], toolExpertise: [], monkWeapons: [], spells: []};
  (c.classes||[]).forEach(function(cl, idx){
    var p = pickedProfs(cl, idx > 0);
    Object.keys(out).forEach(function(k){ out[k] = out[k].concat(p[k]); });
  });
  return out;
}
/* "Your picks: ..." for a feature on the Features tab ("" for none). */
export function featurePicksText(cl, multiclass, featureName, isSubclass){
  var bits = [];
  entryGrants(cl, multiclass).forEach(function(g){
    if(g.feature!==featureName || !!g.subclass!==!!isSubclass) return;
    var s = classPicksSummary(g, grantEntry(cl, g.key));
    if(s) bits.push(s);
  });
  return bits.join(", ");
}

/* ---- Level-up ----
   The grants a level-up brings: what the entry will have after it that it
   doesn't have now. before: the class entry as it is (null for a new
   class); after: the entry as it will be ({name, subclass, level,
   options}). */
export function levelUpGrants(before, after, multiclass){
  var had = before ? entryGrants(before, multiclass).map(function(g){ return g.key; }) : [];
  return entryGrants(after, multiclass).filter(function(g){ return had.indexOf(g.key)===-1; });
}
