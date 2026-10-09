import { save } from "../../core/state.js";
import { escapeHtml, mod, profBonus, characterResources } from "../../core/helpers.js";
import { OPTION_SETS, OPTION_SOURCES, optionsKnownAt } from "../../data/class-options.js";
import { CLASS_PROGRESSION } from "../../data/progression.js";
import { entrySets, knownOptions, allKnownOptions, learnOption, forgetOption, optionReason, tashaOn } from "../../core/class-options.js";
import { makeCard, renderAll } from "../sheet.js";
import { meter, sectionTitle, hint } from "../../ui/card-parts.js";
import { renderOptionPicker, optionMeta } from "../../ui/option-picks.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { showActionToast } from "../../ui/toast.js";
import { playAdd, playDelete } from "../../ui/sound.js";

/* ---- Class option cards (Features tab): Metamagic, Maneuvers ----
   One card per set the character has, from a class entry (a sorcerer 3,
   a Battle Master) or a feat (Martial Adept's maneuvers). Each lists what
   is known with what it does, the numbers the sheet can work out (save
   DC, dice, points), and a form to learn more while fewer are known than
   the level allows. New ones normally come through the level-up; the
   card catches up older sheets and fixes mistakes. */

var learnPick = {}; // setId -> name being picked (survives re-renders)

export function renderOptionSetCards(c){
  return OPTION_SETS.map(function(set){ return setCard(c, set); }).filter(Boolean);
}

function setCard(c, set){
  var entry = (c.classes||[]).find(function(cl){ return entrySets(cl).indexOf(set)!==-1; }) || null;
  var all = allKnownOptions(c, set.id);
  if(!entry && !all.length) return null;
  var card = makeCard(set.label);
  card.classList.add("inf-card", "eli-card", "cos-card");
  card.appendChild(hint(set.help));

  if(entry){
    var level = Number(entry.level)||1, due = optionsKnownAt(set, level), known = knownOptions(entry, set.id);
    var meters = document.createElement("div");
    meters.className = "inf-meters eli-meters";
    meters.appendChild(meter(set.label + " known", known.length, due,
      known.length>due ? "More than your level allows" : known.length<due ? (due-known.length)+" left to learn" : "All learned"));
    card.appendChild(meters);
  }
  var facts = setFacts(c, set, entry);
  if(facts) card.appendChild(facts);

  card.appendChild(sectionTitle("Your " + set.label.toLowerCase()));
  if(!all.length) card.appendChild(hint("You don't know any yet. Learn one below."));
  all.forEach(function(k){ card.appendChild(optionEntry(c, set, entry, k)); });

  if(entry){
    var known2 = knownOptions(entry, set.id), due2 = optionsKnownAt(set, Number(entry.level)||1);
    if(known2.length < due2){
      card.appendChild(sectionTitle("Learn a " + set.noun));
      card.appendChild(learnForm(c, set, entry, all));
    }
    card.appendChild(hint(swapHint(c, set, entry)));
  }
  return card;
}

/* What the sheet works out for the set: save DC and dice (maneuvers),
   sorcery points (Metamagic). */
function setFacts(c, set, entry){
  var rows = [];
  var res = characterResources(c);
  if(set.id==="maneuvers"){
    var ab = mod(c.abilities.str) >= mod(c.abilities.dex) ? "str" : "dex";
    rows.push(["Maneuver save DC", String(8 + profBonus(c) + mod(c.abilities[ab])), "8 + proficiency + " + ab.toUpperCase()]);
    var dice = res.find(function(r){ return r.key==="Fighter:superiority_dice"; }) || res.find(function(r){ return r.key==="feat:superiority_dice"; });
    if(dice){
      var lv = entry ? Number(entry.level)||3 : 0;
      var size = !entry ? "d6" : lv>=18 ? "d12" : lv>=10 ? "d10" : "d8";
      rows.push(["Superiority dice", dice.max + " × " + size, (dice.max - dice.used) + " left · back on a short rest"]);
    }
  }
  if(set.id==="metamagic"){
    var sp = res.find(function(r){ return r.key==="Sorcerer:sorcery_points"; });
    if(sp) rows.push(["Sorcery points", (sp.max - sp.used) + " of " + sp.max, "back on a long rest"]);
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

function optionEntry(c, set, entry, k){
  var o = set.options.find(function(x){ return x.name===k.name; }) || {name: k.name, text: "", source: ""};
  var box = document.createElement("div");
  box.className = "inf-entry is-on eli-entry";
  var head = document.createElement("div");
  head.className = "inf-entry-head";
  var title = document.createElement("span");
  title.className = "inf-entry-title";
  title.textContent = o.name;
  head.appendChild(title);
  // Class picks can be removed here to fix a mistake; a feat's picks
  // change with the feat (its Choose button).
  if(entry && k.id){
    var rm = document.createElement("button");
    rm.className = "btn small ghost inf-forget";
    rm.textContent = "Remove";
    rm.setAttribute("aria-label", "Remove " + o.name);
    rm.addEventListener("click", function(){
      confirmDialog("Remove " + o.name + "?", "Normally you only swap " + set.noun + "s when the level-up offers it. Remove it to fix a mistake, then learn the right one below.", function(){
        forgetOption(entry, set.id, k.id);
        save(); renderAll(); playDelete();
      });
    });
    head.appendChild(rm);
  }
  box.appendChild(head);
  var meta = optionMeta(o);
  var src = document.createElement("div");
  src.className = "inf-goes";
  src.innerHTML = "<span>From</span> " + escapeHtml(k.from) + (o.source ? " · " + escapeHtml(OPTION_SOURCES[o.source]) : "") + (meta ? " · " + escapeHtml(meta) : "");
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
  var ctx = {level: Number(entry.level)||1, known: all.map(function(k){ return k.name; })};
  var pick = learnPick[set.id] || "";
  var opt = set.options.find(function(o){ return o.name===pick; });
  if(opt && optionReason(opt, ctx)){ pick = ""; opt = null; learnPick[set.id] = ""; }
  wrap.appendChild(renderOptionPicker({
    set: set, ctx: ctx, value: pick, key: "cos:learn:" + set.id, ariaLabel: set.label + " to learn",
    onPick: function(v){ learnPick[set.id] = v; renderAll(); }
  }));
  var btn = document.createElement("button");
  btn.className = "btn small primary";
  btn.textContent = "Learn";
  btn.disabled = !opt;
  btn.addEventListener("click", function(){
    if(!opt) return;
    learnOption(entry, set.id, opt.name);
    learnPick[set.id] = "";
    showActionToast("Learned " + opt.name + ".");
    save(); renderAll(); playAdd();
  });
  wrap.appendChild(btn);
  return wrap;
}

/* When the level-up will let this set change, in plain words. */
function swapHint(c, set, entry){
  var more = Object.keys(set.known).map(Number).filter(function(l){ return l > (Number(entry.level)||1); });
  var bits = [];
  if(more.length) bits.push("You learn more at " + entry.name.toLowerCase() + " level" + (more.length>1 ? "s " : " ") + listText(more) + ".");
  if(set.swap==="learn") bits.push("Each time you learn new ones, the level-up lets you swap one you know.");
  else if(set.swap==="level") bits.push("Each time you gain " + article(entry.name) + " " + entry.name.toLowerCase() + " level, the level-up lets you swap one.");
  if(set.versatility){
    var asi = ((CLASS_PROGRESSION[entry.name]||{}).asiLevels||[]);
    bits.push(tashaOn(c) ? "With Tasha's optional features you can also swap one at " + entry.name.toLowerCase() + " levels " + listText(asi) + "."
      : "Using Tasha's optional features (Information tab) also lets you swap one at Ability Score Improvement levels.");
  }
  return bits.join(" ");
}
function article(word){ return /^[AEIOU]/i.test(word) ? "an" : "a"; }
function listText(nums){ return nums.length > 1 ? nums.slice(0, -1).join(", ") + " and " + nums[nums.length-1] : String(nums[0]); }
