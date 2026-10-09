import { save } from "../../core/state.js";
import { escapeHtml, mod, profBonus, characterResources } from "../../core/helpers.js";
import { OPTION_SETS, OPTION_SOURCES, optionsKnownAt, optionSetStart } from "../../data/class-options.js";
import { CLASS_PROGRESSION } from "../../data/progression.js";
import { entrySets, knownOptions, allKnownOptions, learnOption, forgetOption, optionReason, tashaOn } from "../../core/class-options.js";
import { makeCard, renderAll } from "../sheet.js";
import { meter, sectionTitle, hint } from "../../ui/card-parts.js";
import { renderOptionPicker, optionMeta, renderTashaNote } from "../../ui/option-picks.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd, playDelete } from "../../ui/sound.js";

/* ---- Class option cards (Features tab) ----
   One card per option set the character has (Metamagic, Maneuvers, Runes,
   Arcane Shots, Elemental Disciplines, Storm Aura, Misfortunes), from a
   class entry or a feat (Martial Adept's maneuvers). Sets that share a
   `card` (the Hunter's four tiers, the Totem Warrior's three animals) are
   sections of one card, each shown once its level is reached. A card lists
   what is known with what it does, the numbers the sheet can work out
   (save DC, dice, points), and a form to learn more while fewer are known
   than the level allows. New ones normally come through the level-up; the
   card catches up older sheets and fixes mistakes. */

var learnPick = {}; // setId -> name being picked (survives re-renders)

export function renderOptionSetCards(c){
  var groups = [], byKey = {};
  OPTION_SETS.forEach(function(set){
    var key = set.card || set.id;
    if(!byKey[key]){ byKey[key] = []; groups.push(byKey[key]); }
    byKey[key].push(set);
  });
  return groups.map(function(sets){ return groupCard(c, sets); }).filter(Boolean);
}

/* The class entry that has a set now, or null. */
function entryFor(c, set){
  return (c.classes||[]).find(function(cl){ return entrySets(cl).indexOf(set)!==-1; }) || null;
}

function groupCard(c, sets){
  var shown = sets.filter(function(set){ return entryFor(c, set) || allKnownOptions(c, set.id).length; });
  if(!shown.length) return null;
  var grouped = sets.length > 1;
  var card = makeCard(grouped ? sets[0].cardLabel : sets[0].label);
  card.classList.add("inf-card", "eli-card", "cos-card");
  shown.forEach(function(set){ renderSet(card, c, set, grouped); });
  return card;
}

function renderSet(card, c, set, grouped){
  var entry = entryFor(c, set);
  var all = allKnownOptions(c, set.id);
  if(grouped) card.appendChild(sectionTitle(set.label + " · " + (entry ? entry.name.toLowerCase() : set.className.toLowerCase()) + " level " + optionSetStart(set)));
  card.appendChild(hint(set.help));

  // A meter only where more than one is ever known.
  var most = optionsKnownAt(set, 20);
  if(entry && most > 1){
    var due = optionsKnownAt(set, Number(entry.level)||1), known = knownOptions(entry, set.id);
    var meters = document.createElement("div");
    meters.className = "inf-meters eli-meters";
    meters.appendChild(meter(set.label + " known", known.length, due,
      known.length>due ? "More than your level allows" : known.length<due ? (due-known.length)+" left to learn" : "All learned"));
    card.appendChild(meters);
  }
  var facts = setFacts(c, set, entry, all);
  if(facts) card.appendChild(facts);

  if(!grouped) card.appendChild(sectionTitle("Your " + set.label.toLowerCase()));
  (set.always||[]).forEach(function(o){ card.appendChild(optionEntry(c, set, null, {name: o.name, from: "Always known"}, o)); });
  if(!all.length) card.appendChild(hint(most > 1 ? "You don't know any yet. Learn one below." : "Not chosen yet. Choose below."));
  all.forEach(function(k){ card.appendChild(optionEntry(c, set, entry, k)); });

  if(entry){
    var level = Number(entry.level)||1;
    if(knownOptions(entry, set.id).length < optionsKnownAt(set, level)){
      if(!grouped) card.appendChild(sectionTitle(most > 1 ? "Learn a " + set.noun : "Choose your " + set.noun));
      card.appendChild(learnForm(c, set, entry, all));
    }
    var swap = swapHint(c, set, entry);
    if(swap) card.appendChild(hint(swap));
  }
}

/* What the sheet works out for a set: save DCs, dice, points, and the
   Storm Aura's numbers for the chosen environment. */
function setFacts(c, set, entry, all){
  var rows = [];
  var res = characterResources(c);
  var pb = profBonus(c);
  function dc(label, ab){ rows.push([label, String(8 + pb + mod(c.abilities[ab])), "8 + proficiency + " + ab.toUpperCase()]); }
  function uses(key, label, rest){
    var r = res.find(function(x){ return x.key===key; });
    if(r) rows.push([label, (r.max - r.used) + " of " + r.max, "back on a " + rest + " rest"]);
  }
  var lv = entry ? Number(entry.level)||1 : 0;
  if(set.id==="maneuvers"){
    dc("Maneuver save DC", mod(c.abilities.str) >= mod(c.abilities.dex) ? "str" : "dex");
    var dice = res.find(function(r){ return r.key==="Fighter:superiority_dice"; }) || res.find(function(r){ return r.key==="feat:superiority_dice"; }) ||
      res.find(function(r){ return r.key==="style:superiority_dice"; });
    if(dice){
      var size = !entry ? "d6" : lv>=18 ? "d12" : lv>=10 ? "d10" : "d8";
      rows.push(["Superiority dice", dice.max + " × " + size, (dice.max - dice.used) + " left · back on a short rest"]);
    }
  }
  if(set.id==="metamagic") uses("Sorcerer:sorcery_points", "Sorcery points", "long");
  if(set.id==="runes" && entry){
    dc("Rune save DC", "con");
    uses("Fighter:rune_invocations", "Rune invocations", "short");
  }
  if(set.id==="arcaneShots" && entry){
    dc("Arcane Shot save DC", "int");
    uses("Fighter:arcane_shot", "Arcane Shot uses", "short");
  }
  if(set.id==="disciplines" && entry){
    dc("Ki save DC", "wis");
    rows.push(["Most ki per discipline", String(lv>=17 ? 6 : lv>=13 ? 5 : lv>=9 ? 4 : lv>=5 ? 3 : 2), "including extra ki to upcast"]);
    uses("Monk:ki", "Ki points", "short");
  }
  if(set.id==="misfortunes" && entry){
    dc("Misfortune save DC", "cha");
    uses("Rogue:jinx_points", "Jinx Points", "short");
  }
  if(set.id==="stormEnvironment" && entry){
    dc("Storm Aura save DC", "con");
    var env = all[0] && all[0].name;
    var step = lv>=20 ? 6 : lv>=15 ? 5 : lv>=10 ? 4 : lv>=5 ? 3 : 2;
    var dice2 = lv>=20 ? 4 : lv>=15 ? 3 : lv>=10 ? 2 : 1;
    if(env==="Desert") rows.push(["Aura damage", step + " fire", "to every other creature in it"]);
    if(env==="Sea") rows.push(["Aura damage", dice2 + "d6 lightning", "one creature, Dexterity save for half"]);
    if(env==="Tundra") rows.push(["Aura temp HP", String(step), "for each creature you choose in it"]);
  }
  if(!rows.length) return null;
  var box = document.createElement("div");
  box.className = "cos-facts";
  rows.forEach(function(r){
    var d = document.createElement("div");
    d.className = "cos-fact";
    d.innerHTML = "<span class='cos-fact-lbl'>" + escapeHtml(r[0]) + "</span><span class='cos-fact-val'>" + escapeHtml(r[1]) + "</span><span class='cos-fact-sub'>" + escapeHtml(r[2]) + "</span>";
    box.appendChild(d);
  });
  return box;
}

function optionEntry(c, set, entry, k, fixed){
  var o = fixed || set.options.find(function(x){ return x.name===k.name; }) || {name: k.name, text: "", source: ""};
  var box = document.createElement("div");
  box.className = "inf-entry is-on eli-entry";
  var head = document.createElement("div");
  head.className = "inf-entry-head";
  var title = document.createElement("span");
  title.className = "inf-entry-title";
  title.textContent = o.name;
  head.appendChild(title);
  // Class picks can be removed here (to fix a mistake, or the swap after
  // a long rest misfortunes allow); a feat's picks change with the feat.
  if(entry && k.id){
    var rm = document.createElement("button");
    rm.className = "btn small ghost inf-forget";
    rm.textContent = "Remove";
    rm.setAttribute("aria-label", "Remove " + o.name);
    rm.addEventListener("click", function(){
      confirmDialog("Remove " + o.name + "?", set.swap==="rest"
        ? "After a long rest you can swap one " + set.noun + " you know: remove it, then learn another below."
        : "Normally you only swap " + set.noun + "s when the level-up offers it. Remove it to fix a mistake, then learn the right one below.", function(){
        forgetOption(entry, set.id, k.id);
        save(); renderAll(); playDelete();
      });
    });
    head.appendChild(rm);
  }
  box.appendChild(head);
  var meta = optionMeta(o, set);
  var src = document.createElement("div");
  src.className = "inf-goes";
  src.innerHTML = (fixed ? "<span>Always known</span>" : "<span>From</span> " + escapeHtml(k.from)) +
    (o.source ? " · " + escapeHtml(OPTION_SOURCES[o.source]) : "") + (meta ? " · " + escapeHtml(meta) : "");
  box.appendChild(src);
  var text = document.createElement("div");
  text.className = "inf-text";
  text.textContent = o.text;
  box.appendChild(text);
  return box;
}

function learnForm(c, set, entry, all){
  var wrap = document.createElement("div");
  wrap.className = "inf-form inf-learn eli-learn";
  var ctx = {level: Number(entry.level)||1, known: all.map(function(k){ return k.name; }), tasha: tashaOn(c)};
  var pick = learnPick[set.id] || "";
  var opt = set.options.find(function(o){ return o.name===pick; });
  if(opt && optionReason(opt, ctx)){ pick = ""; opt = null; learnPick[set.id] = ""; }
  wrap.appendChild(renderOptionPicker({
    set: set, ctx: ctx, value: pick, key: "cos:learn:" + set.id, ariaLabel: set.label + " to learn",
    onPick: function(v){ learnPick[set.id] = v; renderAll(); }
  }));
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = optionsKnownAt(set, 20) > 1 ? "Learn" : "Choose";
  btn.disabled = !opt;
  btn.addEventListener("click", function(){
    if(!opt) return;
    learnOption(entry, set.id, opt.name);
    learnPick[set.id] = "";
    showActionToast((optionsKnownAt(set, 20) > 1 ? "Learned " : "Chose ") + opt.name + ".");
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  var note = renderTashaNote(set, ctx);
  if(note) wrap.appendChild(note);
  return wrap;
}

/* When this set can change, in plain words ("" when it never does). */
function swapHint(c, set, entry){
  var cls = entry.name.toLowerCase();
  var more = Object.keys(set.known).map(Number).filter(function(l){ return l > (Number(entry.level)||1); });
  var bits = [];
  if(more.length) bits.push("You learn more at " + cls + " level" + (more.length>1 ? "s " : " ") + listText(more) + ".");
  if(set.swap==="learn") bits.push("Each time you learn new ones, the level-up lets you swap one you know.");
  else if(set.swap==="level") bits.push("Each time you gain " + article(entry.name) + " " + cls + " level, the level-up lets you " + (optionsKnownAt(set, 20) > 1 ? "swap one." : "change it."));
  else if(set.swap==="rest") bits.push("After a long rest you can swap one: remove it here, then learn another.");
  if(set.versatility){
    var asi = ((CLASS_PROGRESSION[entry.name]||{}).asiLevels||[]);
    bits.push(tashaOn(c) ? "With Tasha's optional features you can also swap one at " + cls + " levels " + listText(asi) + "."
      : "Using Tasha's optional features (Information tab) also lets you swap one at Ability Score Improvement levels.");
  }
  return bits.join(" ");
}
function article(word){ return /^[AEIOU]/i.test(word) ? "an" : "a"; }
function listText(nums){ return nums.length > 1 ? nums.slice(0, -1).join(", ") + " and " + nums[nums.length-1] : String(nums[0]); }
