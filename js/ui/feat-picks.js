import { ABILITIES, SKILLS } from "../data/abilities-skills.js";
import { mod, fmtMod, ce, isProficientWithWeapon, spellHeldBy, profBonus } from "../core/helpers.js";
import { themedPicker } from "./themed-picker.js";
import { openInfoModal } from "./info-modal.js";
import { WEAPON_GROUPS, WEAPON_DATA } from "../data/weapons.js";
import { SPELL_DATA } from "../data/spells.js";
import {
  TOOL_GROUPS, featDef, featHasPicks, featNeedsChoice, startingPicks, featPicksProblem,
  expertiseOptions, expertiseReason, applyFeatPicks, featSpellGroups, featOptionChoices,
  featToolChoices, featStyleChoices, featInvocationChoices, featPickDetail
} from "../core/feat-picks.js";
import { optionSetDef } from "../data/class-options.js";
import { allKnownOptions } from "../core/class-options.js";
import { LANGUAGES, LANGUAGE_GROUP_LABELS } from "../data/languages.js";
import { INVOCATIONS, invocationDef } from "../data/invocations.js";
import { styleDef, styleReason } from "../core/fighting-styles.js";
import { warlockEntry, invocationContext, invocationReason } from "../core/invocations.js";
import { renderStylePicks } from "./style-picks.js";

/* ---------------- Feat picks UI ----------------
   The choices block for a feat (see js/core/feat-picks.js), shared by the
   level-up dialog, the creation wizard (Variant Human) and the picks
   modal (a feat added from the Compendium, or one taken before the sheet
   applied picks). It changes `picks` in place and calls onChange() after
   each pick so the caller can re-render and re-check.
   ctx: {abilities, skillProfs, languages, pb} of the character taking
   the feat, plus styleReason(name) and invocationChoices() for Fighting
   Initiate and Eldritch Adept,
   knowsWeapon(name) when it's known (greys out weapons already proficient),
   spellTaken(name) for a spell being learned in the same level-up (greyed
   out) and spellHeld(name) for one the character already has (still
   pickable: the feat adds its free cast, and a line says so). */
var SKILL_NAMES = SKILLS.map(function(s){ return s[0]; });
function aOrAn(word){ return (/^[aeiou]/i.test(word) ? "an " : "a ") + word; }

export function renderFeatPicks(def, picks, ctx, onChange){
  var box = ce("div", "fp-box");
  if(!featHasPicks(def)) return box;

  if(def.option){
    var optNoun = def.option.label.toLowerCase(), details = def.option.details;
    box.appendChild(label("Choose " + aOrAn(optNoun)));
    var taken = def.repeatable && ctx.optionsTaken ? ctx.optionsTaken(def.name) : [];
    box.appendChild(field(themedPicker({
      key: "feat:" + def.name + ":option", ariaLabel: def.name + " " + optNoun,
      placeholder: "Choose " + aOrAn(optNoun), groups: {"": def.option.options}, value: picks.option || "", search: false, sheet: !!details,
      detailFor: function(v){ return (details && details[v]) || ""; },
      reasonFor: function(v){ return taken.indexOf(v)!==-1 ? "taken" : ""; },
      onPick: function(v){
        picks.option = v;
        // Spells picked for another option (a different college's) no longer fit.
        var groups = featSpellGroups(def, picks, ctx);
        picks.spells = (picks.spells||[]).map(function(name, i){
          var g = groups.filter(function(x){ return i >= x.offset; }).pop();
          return g && g.options.indexOf(name)!==-1 ? name : "";
        });
        onChange();
      }
    })));
    if(picks.option && details) box.appendChild(textNote(featPickDetail(def, picks)));
  }

  // Fighting Initiate: a fighter's style, then the style's own picks
  // (Superior Technique's maneuver).
  if(def.stylePick){
    var styleWhy = function(v){
      var why = ctx.styleReason ? ctx.styleReason(v) : ((styleDef(v)||{}).optional && !ctx.tasha ? "Tasha's optional" : "");
      return why==="known" ? "known" : why;
    };
    box.appendChild(label("Choose a fighting style"));
    box.appendChild(field(themedPicker({
      key: "feat:" + def.name + ":style", ariaLabel: def.name + " fighting style", placeholder: "Choose a fighting style",
      groups: {"": featStyleChoices().filter(function(n){ return styleWhy(n)!=="Tasha's optional"; })},
      value: picks.option || "", search: false, sheet: true,
      detailFor: function(v){ return (styleDef(v)||{}).text || ""; },
      reasonFor: function(v){ return styleWhy(v); },
      onPick: function(v){ picks.option = v; picks.options = []; onChange(); }
    })));
    if(picks.option){
      box.appendChild(textNote(picks.option + ": " + ((styleDef(picks.option)||{}).text || "")));
      box.appendChild(renderStylePicks(picks.option, picks, !!ctx.tasha, ctx.optionsKnown ? ctx.optionsKnown("maneuvers") : [], onChange, "feat:" + def.name + ":style"));
    }
  }

  // Eldritch Adept: one invocation, with what it does.
  if(def.invocationPick){
    box.appendChild(label("Learn an eldritch invocation"));
    box.appendChild(field(themedPicker({
      key: "feat:" + def.name + ":invocation", ariaLabel: def.name + " invocation", placeholder: "Choose an invocation",
      groups: {"": featInvocationChoices(ctx)}, value: picks.option || "", search: true, sheet: true,
      detailFor: function(v){ var inv = invocationDef(v); return inv ? inv.text : ""; },
      onPick: function(v){ picks.option = v; onChange(); }
    })));
    if(picks.option) box.appendChild(textNote(featPickDetail(def, picks)));
  }

  if(def.ability && def.ability.length){
    var choose = def.ability.length > 1;
    box.appendChild(label(choose
      ? (def.saveProf ? "Raise one ability by 1 and gain proficiency in its saving throws" : "Raise one ability by 1 (max 20)")
      : "Raises " + ABILITIES.find(function(a){ return a[0]===def.ability[0]; })[1] + " by 1 (max 20)"));
    var grid = ce("div", "rt-ab-grid fp-ab-grid");
    // Two or three options stay tile-sized; all six use the wizard's grid
    // (three columns on phones).
    if(def.ability.length < 6) grid.style.gridTemplateColumns = "repeat(" + def.ability.length + ", minmax(0, 110px))";
    ABILITIES.filter(function(a){ return def.ability.indexOf(a[0])!==-1; }).forEach(function(a){
      var key = a[0], base = Number(ctx.abilities && ctx.abilities[key])||10;
      var isOn = picks.ability===key, atMax = base>=20;
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "rt-ab" + (isOn ? " on" : "") + (atMax && !isOn ? " off" : "");
      tile.disabled = !choose;
      tile.setAttribute("aria-pressed", isOn ? "true" : "false");
      tile.setAttribute("aria-label", a[1] + " " + base + (atMax ? ", already 20" : ", raise to " + (base + 1)));
      tile.innerHTML = "<span class='rt-ab-lbl'>" + a[1].slice(0,3).toUpperCase() + "</span>" +
        "<span class='rt-ab-score'>" + (isOn && !atMax ? "<s>" + base + "</s> " + (base + 1) : base) + "</span>" +
        "<span class='rt-ab-mod'>" + (atMax ? "max" : isOn ? "+1" : fmtMod(mod(base))) + "</span>";
      if(choose) tile.addEventListener("click", function(){ picks.ability = key; onChange(); });
      grid.appendChild(tile);
    });
    box.appendChild(grid);
  }

  // The ability its spells use, when that's a choice of its own
  // (Strixhaven Initiate, Gift of the Metallic Dragon).
  if(Array.isArray(def.castAbility)){
    box.appendChild(label("Choose the ability this feat's spells use"));
    box.appendChild(field(themedPicker({
      key: "feat:" + def.name + ":cast", ariaLabel: def.name + " spellcasting ability", placeholder: "Choose an ability", search: false,
      groups: {"": ABILITIES.filter(function(a){ return def.castAbility.indexOf(a[0])!==-1; }).map(function(a){
        return {value: a[0], label: a[1] + " (" + fmtMod(mod(Number(ctx.abilities && ctx.abilities[a[0]])||10)) + ")"};
      })},
      value: picks.castAbility || "",
      onPick: function(v){ picks.castAbility = v; onChange(); }
    })));
  }

  var n = def.skillsOrTools || def.skills || 0;
  if(n){
    box.appendChild(label(def.skillOptions ? "Gain proficiency in " + def.skillOptions.join(" or ")
      : def.skillsOrTools ? "Gain proficiency in " + n + " skills or tools" : "Gain proficiency in " + (n > 1 ? n + " skills" : "a skill")));
    var groups = def.skillOptions ? {"": def.skillOptions} : def.skillsOrTools ? Object.assign({"Skills": SKILL_NAMES}, TOOL_GROUPS) : {"": SKILL_NAMES};
    for(var i = 0; i < n; i++) (function(i){
      box.appendChild(field(themedPicker({
        key: "feat:" + def.name + ":skill:" + i, ariaLabel: def.name + " proficiency " + (i + 1),
        placeholder: def.skillsOrTools ? "Choose a skill or tool" : "Choose a skill",
        groups: groups, value: picks.skills[i] || "", search: def.skillOptions ? false : undefined,
        reasonFor: function(v){
          var e = ctx.skillProfs && ctx.skillProfs[v];
          if(e && e.prof) return "known";
          return v!==picks.skills[i] && picks.skills.indexOf(v)!==-1 ? "picked" : "";
        },
        onPick: function(v){
          picks.skills[i] = v;
          // An expertise pick that leaned on a replaced skill no longer fits.
          picks.expertise = picks.expertise.filter(function(x){ return !expertiseReason(ctx, picks, x); });
          onChange();
        }
      })));
    })(i);
  }

  for(var j = 0; j < (def.expertise || 0); j++) (function(j){
    if(j===0) box.appendChild(label("Expertise: double your proficiency bonus in one skill you're proficient in"));
    box.appendChild(field(themedPicker({
      key: "feat:" + def.name + ":expertise:" + j, ariaLabel: def.name + " expertise",
      placeholder: "Choose a skill", groups: {"": expertiseOptions(ctx, picks)}, value: picks.expertise[j] || "",
      reasonFor: function(v){
        if(v!==picks.expertise[j] && picks.expertise.indexOf(v)!==-1) return "picked";
        return expertiseReason(ctx, picks, v)==="expert" ? "expertise" : "";
      },
      onPick: function(v){ picks.expertise[j] = v; onChange(); }
    })));
  })(j);

  // Tools of its own (Prodigy; Artificer Initiate's artisan's tools).
  if(def.toolPicks){
    if(!picks.tools) picks.tools = [];
    var tp = def.toolPicks, toolGroups = {};
    if(tp.group) toolGroups[""] = featToolChoices(def); else toolGroups = TOOL_GROUPS;
    box.appendChild(label("Gain proficiency with " + (tp.count > 1 ? tp.count + " tools" : tp.group ? "one type of " + tp.group.toLowerCase() : "a tool")));
    for(var t = 0; t < tp.count; t++) (function(t){
      box.appendChild(field(themedPicker({
        key: "feat:" + def.name + ":tool:" + t, ariaLabel: def.name + " tool " + (t + 1), placeholder: "Choose a tool",
        groups: toolGroups, value: picks.tools[t] || "",
        reasonFor: function(v){ return v!==picks.tools[t] && picks.tools.indexOf(v)!==-1 ? "picked" : ""; },
        onPick: function(v){ picks.tools[t] = v; onChange(); }
      })));
    })(t);
  }

  // Languages: the ones it teaches outright, then the ones to pick.
  if(def.languages && def.languages.length) box.appendChild(textNote("Also learned: " + def.languages.join(", ") + "."));
  if(def.languagePicks){
    if(!picks.languages) picks.languages = [];
    var knownLangs = (ctx.languages || []).concat(def.languages || []).map(function(l){ return l.toLowerCase(); });
    var langGroups = {};
    Object.keys(LANGUAGES).forEach(function(g){ langGroups[LANGUAGE_GROUP_LABELS[g] || g] = LANGUAGES[g]; });
    box.appendChild(label("Learn " + (def.languagePicks > 1 ? def.languagePicks + " languages" : "a language")));
    for(var l = 0; l < def.languagePicks; l++) (function(l){
      box.appendChild(field(themedPicker({
        key: "feat:" + def.name + ":lang:" + l, ariaLabel: def.name + " language " + (l + 1), placeholder: "Choose a language",
        groups: langGroups, value: picks.languages[l] || "", search: false,
        reasonFor: function(v){
          if(knownLangs.indexOf(v.toLowerCase())!==-1) return "known";
          return v!==picks.languages[l] && picks.languages.indexOf(v)!==-1 ? "picked" : "";
        },
        onPick: function(v){ picks.languages[l] = v; onChange(); }
      })));
    })(l);
  }

  if(def.weapons && !picks.weapons) picks.weapons = [];
  // Weapons the character already knows stay pickable (a Fighter can take
  // Weapon Master for its +1) but move to the end of the list.
  var weaponGroups = {}, known = [];
  Object.keys(WEAPON_GROUPS).forEach(function(g){
    var fresh = WEAPON_GROUPS[g].filter(function(n){
      if(ctx.knowsWeapon && ctx.knowsWeapon(n)){ known.push(n); return false; }
      return true;
    });
    if(fresh.length) weaponGroups[g] = fresh;
  });
  if(known.length) weaponGroups["Already proficient"] = known;
  for(var w = 0; w < (def.weapons || 0); w++) (function(w){
    if(w===0) box.appendChild(label("Gain proficiency with " + def.weapons + " weapons of your choice"));
    box.appendChild(field(themedPicker({
      key: "feat:" + def.name + ":weapon:" + w, ariaLabel: def.name + " weapon " + (w + 1),
      placeholder: "Choose a weapon", groups: weaponGroups, value: picks.weapons[w] || "",
      reasonFor: function(v){
        return v!==picks.weapons[w] && picks.weapons.indexOf(v)!==-1 ? "picked" : "";
      },
      onPick: function(v){ picks.weapons[w] = v; onChange(); }
    })));
  })(w);

  // Kept short for phones: the free spell is one line, and the pick opens
  // as a sheet listing what each spell does.
  // A feat already on the sheet (added from the Compendium, its picks made
  // after) holds its own spells: not worth a line.
  var ownSpell = "from " + def.name;
  var granted = (def.grantsSpells||[]).concat((def.grantsByOption && def.grantsByOption[picks.option]) || []);
  granted.forEach(function(g){
    var name = typeof g==="string" ? g : g.name;
    if(!SPELL_DATA[name]) return;
    box.appendChild(spellNote(name, "Also learned: "));
    var has = SPELL_DATA[name].level > 0 && (!g.use || g.use==="long" || g.use==="short") && ctx.spellHeld && ctx.spellHeld(name);
    if(has && has!==ownSpell) box.appendChild(heldNote(def, name, has, g.use));
  });
  if(def.spellPick){
    if(!picks.spells) picks.spells = [];
    featSpellGroups(def, picks, ctx).forEach(function(sp){
      box.appendChild(label(sp.count > 1 ? "Choose " + sp.count + " " + sp.plural : "Choose your " + sp.label));
      if(!sp.options.length){
        box.appendChild(textNote("Choose " + aOrAn(def.option.label.toLowerCase()) + " above first."));
        return;
      }
      // Few enough to list flat (a college's three cantrips); otherwise by school.
      var spellGroups = {};
      if(sp.options.length <= 6 || sp.tags) spellGroups[""] = sp.options;
      else sp.options.forEach(function(name){ var sc = SPELL_DATA[name].school; (spellGroups[sc] = spellGroups[sc] || []).push(name); });
      for(var p = sp.offset; p < sp.offset + sp.count; p++) (function(p){
        box.appendChild(field(themedPicker({
          key: "feat:" + def.name + ":spell:" + p, ariaLabel: def.name + " spell " + (p + 1),
          placeholder: sp.tags ? "Choose a " + sp.label : "Choose a spell", groups: spellGroups, value: picks.spells[p] || "", sheet: true,
          detailFor: function(v){
            var summary = SPELL_DATA[v] ? SPELL_DATA[v].summary || "" : "";
            return sp.tags && sp.tags[v] ? sp.tags[v] + ". " + summary : summary;
          },
          reasonFor: function(v){ return v!==picks.spells[p] && picks.spells.indexOf(v)!==-1 ? "picked" : (ctx.spellTaken && ctx.spellTaken(v)) || ""; },
          onPick: function(v){ picks.spells[p] = v; onChange(); }
        })));
        if(picks.spells[p] && SPELL_DATA[picks.spells[p]]) box.appendChild(spellNote(picks.spells[p], sp.tags && sp.tags[picks.spells[p]] ? sp.tags[picks.spells[p]] + ", " : ""));
        var held = sp.level > 0 && picks.spells[p] && ctx.spellHeld && ctx.spellHeld(picks.spells[p]);
        if(held && held!==ownSpell) box.appendChild(heldNote(def, picks.spells[p], held, sp.use));
      })(p);
    });
  }
  // Options from a class list (Martial Adept's maneuvers): a sheet on
  // phones, each with what it does, and a line under each pick.
  if(def.optionPicks){
    if(!picks.options) picks.options = [];
    var op = def.optionPicks, set = optionSetDef(op.set);
    var known = ctx.optionsKnown ? ctx.optionsKnown(op.set) : [];
    box.appendChild(label("Learn " + op.count + " " + set.noun + "s"));
    for(var q = 0; q < op.count; q++) (function(q){
      box.appendChild(field(themedPicker({
        key: "feat:" + def.name + ":opt:" + q, ariaLabel: def.name + " " + set.noun + " " + (q + 1),
        placeholder: "Choose a " + set.noun, groups: {"": featOptionChoices(def).filter(function(n){
          var o = set.options.find(function(x){ return x.name===n; });
          return known.indexOf(n)===-1 && !(o.optional && !ctx.tasha); // Tasha's ones only with the switch on
        })},
        value: picks.options[q] || "", sheet: true, search: true,
        detailFor: function(v){ var o = set.options.find(function(x){ return x.name===v; }); return o ? o.text : ""; },
        reasonFor: function(v){ return v!==picks.options[q] && picks.options.indexOf(v)!==-1 ? "picked" : ""; },
        onPick: function(v){ picks.options[q] = v; onChange(); }
      })));
    })(q);
  }
  return box;
}
/* The line under a feat's spell the character already has. */
function heldNote(def, name, held, use){
  var n = ce("p", "fp-spell-note fp-spell-held");
  n.textContent = "You already have " + name + " (" + held + "). " + def.name + " adds one free cast of it per " + (use==="short" ? "short or long" : "long") + " rest" +
    (held==="known" ? ", and it stops counting against the spells you know, so you can learn another in its place at your next level-up." : ".");
  return n;
}
function textNote(text){
  var n = ce("p", "fp-spell-note");
  n.textContent = text;
  return n;
}
function spellNote(name, lead){
  var n = ce("p", "fp-spell-note");
  var b = document.createElement("b");
  b.textContent = (lead || "") + name + ": ";
  n.appendChild(b);
  n.appendChild(document.createTextNode(SPELL_DATA[name].summary || ""));
  return n;
}
function label(text){ var l = ce("div", "fp-label"); l.textContent = text; return l; }
function field(el){ var f = ce("div", "field rt-field fp-field"); f.appendChild(el); return f; }

/* Make a feat's picks after it was added: from the Compendium, or on a
   feat taken before the sheet applied them. A feat with nothing to
   choose (Actor: CHA +1) is applied right away. "I've already added it"
   marks it done without changing anything, for players who raised the
   score by hand. onDone() runs after either. */
export function openFeatPicksModal(c, feat, onDone){
  var def = featDef(feat.name);
  // A Weapon Master from before weapon picks keeps its +1 and adds weapons.
  var picks = startingPicks(def, feat);
  var ctx = featPicksContext(c);
  openInfoModal(feat.name, function(body){
    var lead = ce("p", "fp-lead");
    lead.textContent = featNeedsChoice(def)
      ? "Choose what " + feat.name + " gives " + (c.name || "your character") + ". The sheet applies it, and removing the feat takes it back."
      : "The sheet applies this for you, and removing the feat takes it back.";
    body.appendChild(lead);
    var holder = ce("div");
    body.appendChild(holder);
    var problem = ce("p", "fp-problem");
    body.appendChild(problem);
    var row = ce("div", "cmp-give-row fp-modal-row");
    var apply = document.createElement("button");
    apply.type = "button"; apply.className = "btn primary"; apply.textContent = "Apply";
    var manual = document.createElement("button");
    manual.type = "button"; manual.className = "btn ghost"; manual.textContent = "I've already added it";
    manual.title = "Mark it done without changing the sheet";
    row.appendChild(manual); row.appendChild(apply);
    body.appendChild(row);
    function draw(){
      holder.innerHTML = "";
      holder.appendChild(renderFeatPicks(def, picks, ctx, draw));
      var why = featPicksProblem(def, picks, ctx);
      apply.disabled = !!why;
      problem.textContent = why;
    }
    function close(){ document.getElementById("info-modal-close").click(); }
    apply.addEventListener("click", function(){ applyFeatPicks(c, feat, picks); close(); onDone(); });
    manual.addEventListener("click", function(){
      if(!feat.picks) feat.picks = {ability: "", skills: [], expertise: [], weapons: [], spells: [], tools: [], languages: []};
      feat.picks.manual = true;
      close(); onDone();
    });
    draw();
  });
}

/* The picker's view of a character on the sheet. optionsTaken(name):
   the options its copies of a repeatable feat already have. */
export function featPicksContext(c){
  return {abilities: c.abilities, skillProfs: c.skillProfs, tasha: !!c.tashaOptional,
    languages: c.languages || [], pb: profBonus(c),
    spellHeld: function(name){ return spellHeldBy(c, name); },
    styleReason: function(name){ return styleReason(c, name, !!c.tashaOptional); },
    // A warlock may take an invocation whose prerequisite they meet;
    // anyone else only the ones without one.
    invocationChoices: function(){
      var cl = warlockEntry(c), ictx = invocationContext(c, cl);
      return INVOCATIONS.filter(function(inv){
        if(inv.spellPick || invocationReason(inv, ictx)) return false;
        return !!cl || !(inv.level || inv.pact || inv.needs);
      }).map(function(inv){ return inv.name; });
    },
    // Options already known (a Battle Master's maneuvers, Superior Technique's) aren't offered again.
    optionsKnown: function(setId){
      return allKnownOptions({classes: c.classes || [], feats: [], features: c.features || []}, setId).map(function(o){ return o.name; });
    },
    optionsTaken: function(name){
      return (c.feats||[]).filter(function(f){ return f.name===name && f.picks && f.picks.option; }).map(function(f){ return f.picks.option; });
    },
    knowsWeapon: function(name){
      var d = WEAPON_DATA[name];
      return isProficientWithWeapon(c, name, d && d.category);
    }};
}
