/* ---------------- Creation wizard: skills, race traits and feats ----------------
   The Skills step, the race's own choices, a race's feat and its picks,
   and the feat a background or campaign gives. */
import { ABILITIES } from "../data/abilities-skills.js";
import { BACKGROUND_INFO } from "../data/backgrounds.js";
import { RACE_DATA } from "../data/race-data.js";
import { mod, fmtMod, escapeHtml, ce } from "../core/helpers.js";
import { themedPicker } from "../ui/themed-picker.js";
import { currentClassInfo, wizardState, renderWizard, abilityFullName, raceChoiceDef, raceAbilityAmounts, raceAbilityIncreases, raceAbilityPicksNeeded, featPrereqReason, wizardFeatContext, wizardBackgroundFeat, wizardBackgroundFeatPicks, wizardBackgroundSkills, refreshWizardProgress,
  wizardRacePickGrants, wizardRaceSlots, wizardRacePickContext, wizardRaceSkills,
  wizardBackgroundGrants, wizardBackgroundPickGrants, wizardBgSlots, wizardBgPickContext,
  wizardOverlapGrants, wizardOverlapSlots, wizardOverlapContext } from "./wizard-core.js";
import { emptyPicks, featNeedsChoice, featHasPicks, featDef } from "../core/feat-picks.js";
import { fillSlots, classPicksProblem, grantHasChoices } from "../core/class-picks.js";
import { renderClassPicks } from "../ui/class-picks.js";
import { renderFeatPicks } from "../ui/feat-picks.js";
import { fillFeatList } from "../ui/feat-list.js";
import { FEATS_CATALOG, CAMPAIGN_FEATS } from "../data/feats.js";

export function wizardStepSkills(container){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Skills & Proficiencies</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> Skills add your proficiency bonus to certain checks. Your class and background each grant some. You don't pick from all 18, just the ones you're allowed.";
  card.appendChild(explain);

  var bgInfo = BACKGROUND_INFO[wizardState.background];
  var bgPick = bgInfo && bgInfo.skillPick;
  if(bgInfo && bgInfo.skills && bgInfo.skills.length){
    var bgP = document.createElement("p");
    bgP.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);margin-bottom:12px;";
    bgP.innerHTML = "From your <b>"+escapeHtml(wizardState.background)+"</b> background: "+bgInfo.skills.join(", ")+" (automatic)"+(bgPick ? ", plus your pick below" : "")+".";
    card.appendChild(bgP);
  }
  // Skills the race gives outright (an elf's Perception).
  var fromRace = wizardRaceSkills(null, true);
  if(fromRace.length){
    var raceP = document.createElement("p");
    raceP.style.cssText = "font-size:13px;color:var(--text-on-parch-dim);margin-bottom:12px;";
    raceP.innerHTML = "From your <b>"+escapeHtml(wizardState.race)+"</b> race: "+escapeHtml(fromRace.join(", "))+" (automatic).";
    card.appendChild(raceP);
  }
  // Picks that no longer fit (the background was changed) are dropped.
  if(!bgPick) wizardState.bgSkillChoices = [];
  else wizardState.bgSkillChoices = (wizardState.bgSkillChoices||[]).filter(function(sk){ return bgPick.options.indexOf(sk)!==-1; });

  var info = currentClassInfo();
  card.appendChild(pickLabel("Choose "+info.skillChoices.count+" from your class list:"));
  card.appendChild(checkList(info.skillChoices.options, wizardState.skillChoices, info.skillChoices.count,
    function(sk){
      if(fromRace.indexOf(sk)!==-1) return "from race";
      return wizardState.bgSkillChoices.indexOf(sk)!==-1 || ((bgInfo && bgInfo.skills)||[]).indexOf(sk)!==-1 ? "from background" : "";
    },
    function(list){ wizardState.skillChoices = list; }));

  if(bgPick){
    var bgLabel = pickLabel("");
    bgLabel.innerHTML = "Choose "+bgPick.count+" from your <b>"+escapeHtml(wizardState.background)+"</b> background:";
    bgLabel.style.marginTop = "16px";
    card.appendChild(bgLabel);
    card.appendChild(checkList(bgPick.options, wizardState.bgSkillChoices, bgPick.count,
      function(sk){ return wizardState.skillChoices.indexOf(sk)!==-1 ? "from class" : ""; },
      function(list){ wizardState.bgSkillChoices = list; }));
  }

  // The background's tools: the ones it gives, then its choices (a gaming
  // set, an instrument, a House Agent's house) with the shared pickers.
  var givenTools = wizardBackgroundGrants().filter(function(g){ return !grantHasChoices(g.def); })
    .reduce(function(a, g){ return a.concat(g.def.tools || []); }, []);
  var toolPicks = wizardBackgroundPickGrants();
  if(givenTools.length || toolPicks.length){
    var toolHead = pickLabel("");
    toolHead.style.marginTop = "16px";
    toolHead.innerHTML = "Tools from your <b>"+escapeHtml(wizardState.background)+"</b> background"+
      (givenTools.length ? ": "+escapeHtml(givenTools.join(", ").toLowerCase())+" (automatic)"+(toolPicks.length ? ", plus your pick below." : ".") : ":");
    card.appendChild(toolHead);
  }
  toolPicks.forEach(function(g){
    var slots = wizardBgSlots(g.key), ctx = wizardBgPickContext(g);
    fillSlots(g.def, slots, ctx);
    card.appendChild(renderClassPicks(g, slots, ctx, function(meta){
      if(meta && meta.typing) return;
      var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
      renderWizard();
    }, "bg:" + g.key));
  });

  // Anything two sources give outright: a pick of another in its place.
  wizardOverlapGrants().forEach(function(g){
    var head = pickLabel("");
    head.style.marginTop = "16px";
    head.innerHTML = "<b>Given twice:</b> " + escapeHtml(g.dups.join(", "));
    card.appendChild(head);
    var slots = wizardOverlapSlots(g.key), ctx = wizardOverlapContext(g);
    fillSlots(g.def, slots, ctx);
    card.appendChild(renderClassPicks(g, slots, ctx, function(meta){
      if(meta && meta.typing) return;
      var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
      renderWizard();
    }, "twice:" + g.key));
  });
  container.appendChild(card);
}
function pickLabel(text){
  var label = document.createElement("p");
  label.style.cssText = "font-size:13px;margin-bottom:8px;";
  label.textContent = text;
  return label;
}
/* Tappable checkbox rows: pick up to `count` of `options`. takenReason(sk)
   greys out a skill the other list already gives ("from class"). */
function checkList(options, chosen, count, takenReason, onChange){
  var rows = ce("div","list-rows");
  options.forEach(function(sk){
    var row = ce("div","list-row wiz-pick-row");
    var cb = document.createElement("input");
    cb.type="checkbox"; cb.className="chk";
    var checked = chosen.indexOf(sk)!==-1;
    cb.checked = checked;
    var taken = !checked && takenReason(sk);
    var full = !checked && chosen.length>=count;
    cb.disabled = full || !!taken;
    if(cb.disabled) row.classList.add("disabled");
    var name = document.createElement("span"); name.className="row-name"; name.textContent = sk;
    row.appendChild(cb); row.appendChild(name);
    if(taken){
      var why = document.createElement("span"); why.className="row-meta"; why.textContent = taken;
      row.appendChild(why);
    }
    rows.appendChild(row);

    // The whole row is the tap target, not just the small checkbox; matters
    // most on touchscreens. Clicking the checkbox itself already toggles it
    // (native behavior fires first), so only toggle manually when the click
    // landed elsewhere on the row.
    row.addEventListener("click", function(e){
      if(cb.disabled) return;
      if(e.target!==cb) cb.checked = !cb.checked;
      if(cb.checked){
        if(chosen.length>=count){ cb.checked=false; return; }
        onChange(chosen.concat([sk]));
      } else {
        onChange(chosen.filter(function(x){ return x!==sk; }));
      }
      renderWizard();
    });
  });
  return rows;
}

/* Race Traits: the picks a race leaves to the player: ability increases
   (RACE_CHOICES: Variant Human's two +1s, a Half-Elf's, a Fairy's +2 and
   +1, an Aasimar's subrace) and the traits that ask for a choice (`profs`
   picks in RACE_DATA: a dwarf's tool, a kenku's two skills, a hobgoblin's
   two martial weapons). Each is a numbered section that shows a check
   once it's done. Equal increases are a row of tappable score tiles
   (pick N), different ones a picker each; a trait's choices use the same
   pickers as class features. A race's feat has its own steps after this
   one (wizardStepFeat, wizardStepFeatPicks). */
var CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="5 12.5 10 17.5 19 7"/></svg>';

export function wizardStepRaceChoices(container){
  var def = raceChoiceDef() || {}, rc = wizardState.raceChoices;
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Race Traits</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> As a <b>"+escapeHtml(wizardState.race)+"</b> you choose some of your traits yourself instead of getting fixed ones. These picks let you shape exactly the character you want.";
  card.appendChild(explain);

  var number = 0;
  function section(titleText, helpText, done){
    var sec = ce("div","rt-section"+(done ? " done" : ""));
    var head = ce("div","rt-head");
    head.innerHTML = "<span class='rt-num'>"+(++number)+"</span>"+
      "<div class='rt-titles'><h4>"+escapeHtml(titleText)+"</h4><p>"+escapeHtml(helpText)+"</p></div>"+
      "<span class='rt-check' title='"+(done ? "Done" : "Still to pick")+"'>"+CHECK_SVG+"</span>";
    sec.appendChild(head);
    card.appendChild(sec);
    return sec;
  }
  function pickerField(picker){
    var f = ce("div","field rt-field");
    f.appendChild(picker);
    return f;
  }
  function picked(){ var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show"); renderWizard(); }

  // Scores with the race's fixed increases, which the picks add to.
  var fixedInc = raceAbilityIncreases({fixedOnly:true});
  function baseScore(key){ return Math.max(1, Math.min(20, (Number(wizardState.abilities[key])||10) + (fixedInc[key]||0))); }

  if(def.abilityBonus){
    var amounts = raceAbilityAmounts(), n = amounts.length, exclude = def.abilityBonus.exclude || [];
    var notText = exclude.length ? " other than "+exclude.map(abilityFullName).join(" or ") : "";
    var chosen = rc.abilities.slice(0, n).filter(function(k){ return k && exclude.indexOf(k)===-1; });
    // A race with an `alt` set (+1 to three) keeps one picker per amount
    // either way, so the switch only adds or takes away a row.
    var allSame = !def.abilityBonus.alt && amounts.every(function(a){ return a===amounts[0]; });
    // Scores already at 20 can't take a pick; all at 20 needs none.
    var need = raceAbilityPicksNeeded();
    if(allSame){
      // Same amount for each pick: tap that many score tiles.
      var amt = amounts[0];
      var sec1 = section("Ability score increase",
        need===0 ? "Every score is already at 20, so there's nothing to raise."
          : (need===1 ? "Tap a score" : "Tap "+need+" different scores")+notText+" to raise by +"+amt+" (up to 20).", chosen.length>=need);
      var grid = ce("div","rt-ab-grid");
      ABILITIES.forEach(function(a){
        var key = a[0], base = baseScore(key);
        var isOn = chosen.indexOf(key)!==-1, atMax = base>=20, excluded = exclude.indexOf(key)!==-1;
        var full = !isOn && chosen.length>=n;
        var tile = document.createElement("button");
        tile.type = "button";
        tile.className = "rt-ab"+(isOn ? " on" : "")+(full || atMax || excluded ? " off" : "");
        tile.disabled = !isOn && (full || atMax || excluded);
        tile.setAttribute("aria-pressed", isOn ? "true" : "false");
        tile.setAttribute("aria-label", a[1]+" "+base+(isOn ? ", raised to "+Math.min(20, base+amt) : ""));
        tile.innerHTML = "<span class='rt-ab-lbl'>"+a[1].slice(0,3).toUpperCase()+"</span>"+
          "<span class='rt-ab-score'>"+(isOn ? "<s>"+base+"</s> "+Math.min(20, base+amt) : base)+"</span>"+
          "<span class='rt-ab-mod'>"+(isOn ? "+"+amt : (excluded ? "racial" : atMax ? "max" : fmtMod(mod(base))))+"</span>";
        tile.addEventListener("click", function(){
          rc.abilities = isOn ? chosen.filter(function(k){ return k!==key; }) : chosen.concat([key]);
          picked();
        });
        grid.appendChild(tile);
      });
      sec1.appendChild(grid);
    } else {
      // Different amounts (+2 to one, +1 to another): one picker each.
      var slots = rc.abilities.slice(0, n);
      var filled = slots.filter(Boolean);
      var done = filled.length>=need && new Set(filled).size===filled.length;
      var secA = section("Ability score increase", need===0 ? "Every score is already at 20, so there's nothing to raise."
        : rc.alt && def.abilityBonus.alt ? "+1 to three different scores, up to 20."
        : amounts.map(function(a){ return "+"+a; }).join(" to one score and ")+" to another, up to 20.", done);
      if(def.abilityBonus.alt) secA.appendChild(altSwitchRow());
      amounts.forEach(function(amt, i){
        secA.appendChild(pickerField(themedPicker({
          key:"race:ability:"+i, placeholder:"+"+amt+" to…", ariaLabel:"Ability for +"+amt,
          groups:{"":ABILITIES.map(function(a){ return {value:a[0], label:"+"+amt+" "+a[1]+" ("+baseScore(a[0])+")"}; })},
          value:slots[i]||"", search:false,
          reasonFor:function(k){
            if(baseScore(k)>=20) return "max";
            return slots.some(function(x, j){ return j!==i && x===k; }) ? "picked" : "";
          },
          onPick:function(v){ var next = rc.abilities.slice(0, n); next[i] = v; rc.abilities = next; picked(); }
        })));
      });
    }
  }

  /* "+1 to three different scores instead": the race's other option. */
  function altSwitchRow(){
    var on = !!rc.alt;
    var row = ce("div","opt-rule rt-alt-switch");
    row.innerHTML = "<div class='opt-rule-text'><b>Increase three scores by 1 instead</b><span>The other way this race can raise its scores.</span></div>";
    var sw = document.createElement("button");
    sw.type = "button";
    sw.className = "switch" + (on ? " on" : "");
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-checked", on ? "true" : "false");
    sw.setAttribute("aria-label", "Increase three scores by 1 instead");
    sw.innerHTML = "<span class='switch-knob'></span>";
    sw.addEventListener("click", function(){ rc.alt = !on; rc.abilities = []; picked(); });
    row.appendChild(sw);
    return row;
  }

  if(def.abilityPreset){
    var ap = def.abilityPreset;
    var secP = section(ap.label, "Your "+ap.label.toLowerCase()+" sets which scores go up.", !!ap.options[rc.preset]);
    secP.appendChild(pickerField(themedPicker({
      key:"race:preset", placeholder:"Choose your "+ap.label.toLowerCase(), ariaLabel:ap.label,
      groups:{"":Object.keys(ap.options).map(function(name){
        var inc = ap.options[name];
        return {value:name, label:name+": "+Object.keys(inc).map(function(k){ return "+"+inc[k]+" "+k.toUpperCase(); }).join(", ")};
      })},
      value:rc.preset||"", search:false,
      onPick:function(v){ rc.preset = v; picked(); }
    })));
  }

  // A trait's choices: its text, then its pickers.
  var traits = (RACE_DATA[wizardState.race] || {}).traits || [];
  wizardRacePickGrants().forEach(function(g){
    var slots = wizardRaceSlots(g.key), ctx = wizardRacePickContext(g);
    fillSlots(g.def, slots, ctx);
    var trait = traits.find(function(t){ return t.name===g.name; });
    var sec = section(g.name, trait ? trait.text : "", !classPicksProblem(g, slots, ctx));
    sec.appendChild(renderClassPicks(g, slots, ctx, function(meta){ if(!(meta && meta.typing)) picked(); }, "race:" + g.key));
  });

  container.appendChild(card);
}

/* Feat (a Variant Human's): a searchable list like the level-up's, each
   feat with its prerequisite and summary; ones the character can't take
   yet sit folded away at the end, greyed out with the reason. Its own
   picks come on the next step (Feat Choices), so each screen does one
   thing. */
export function wizardStepFeat(container){
  var rc = wizardState.raceChoices;
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Feat</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> As a <b>"+escapeHtml(wizardState.race)+"</b> you start with a feat, a special talent most characters only get later.";
  card.appendChild(explain);
  var search = document.createElement("input");
  search.type = "text"; search.className = "wiz-spell-search";
  search.placeholder = "Search feats…"; search.value = wizardState.featQuery || "";
  search.setAttribute("aria-label", "Search feats");
  card.appendChild(search);
  var list = ce("div","wiz-spell-list");
  card.appendChild(list);
  var chosenBox = ce("div");
  card.appendChild(chosenBox);
  // The list and the chosen feat redraw on their own, so the list keeps
  // its scroll and the search box its focus.
  function drawChosen(){
    chosenBox.innerHTML = "";
    var f = FEATS_CATALOG.find(function(x){ return x.name===rc.feat; });
    if(f) chosenBox.appendChild(featSummaryBox(f, featPrereqReason(f)));
  }
  function fill(){
    fillFeatList(list, {
      feats: FEATS_CATALOG, query: wizardState.featQuery, selected: rc.feat, reason: featPrereqReason,
      open: !!wizardState.featBlockedOpen,
      onToggle: function(){ wizardState.featBlockedOpen = !wizardState.featBlockedOpen; fill(); },
      onPick: function(f){
        if(rc.feat!==f.name){ rc.feat = f.name; rc.featPicks = emptyPicks(f); }
        var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
        fill(); drawChosen();
        refreshWizardProgress(); // a feat with choices adds a step
      }
    });
  }
  search.addEventListener("input", function(){ wizardState.featQuery = search.value; fill(); });
  fill();
  drawChosen();
  container.appendChild(card);
}
/* The picked feat: name, category, prerequisite, the full text tucked
   away, and whether its choices come next (its summary is already in
   its list row, so it isn't repeated on a phone's small screen). */
function featSummaryBox(feat, why){
  var box = ce("div","rt-feat"+(why ? " blocked" : ""));
  box.innerHTML =
    "<div class='rt-feat-top'><strong>"+escapeHtml(feat.name)+"</strong><span class='rt-tag'>"+escapeHtml(feat.category)+"</span></div>"+
    (feat.prerequisite && feat.prerequisite!=="None" ? "<div class='rt-feat-req'>Requires: "+escapeHtml(feat.prerequisite)+(why ? " ("+escapeHtml(why)+")" : "")+"</div>" : "");
  if(feat.description){
    var more = document.createElement("details");
    more.className = "rt-feat-more";
    more.innerHTML = "<summary>Full description</summary><p>"+escapeHtml(feat.description)+"</p>";
    box.appendChild(more);
  }
  if(!why && featNeedsChoice(feat)){
    var next = ce("p","rt-feat-next");
    next.textContent = "Next, you'll choose what "+feat.name+" gives you.";
    box.appendChild(next);
  }
  return box;
}

/* Feat Choices: the picked feat's own picks (a half-feat's +1, Fey
   Touched's spell, Skilled's skills), shown only when it has any. */
export function wizardStepFeatPicks(container){
  var rc = wizardState.raceChoices;
  var feat = FEATS_CATALOG.find(function(f){ return f.name===rc.feat; });
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Feat Choices</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>"+escapeHtml(feat.name)+":</b> "+escapeHtml(feat.summary || "")+" Choose what it gives you; the sheet applies it for you.";
  card.appendChild(explain);
  if(!rc.featPicks) rc.featPicks = emptyPicks(feat);
  card.appendChild(renderFeatPicks(feat, rc.featPicks, wizardFeatContext(), function(){
    var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
    renderWizard();
  }));
  container.appendChild(card);
}

/* Background Feat: the picks of the feat the background gives (a
   Lorehold Student's Strixhaven Initiate spells). The feat itself isn't a
   choice, and an option the book fixes (the college) is shown, not asked. */
export function wizardStepBgFeat(container){
  var grant = wizardBackgroundFeat(), feat = grant.def;
  if(grant.choices) return wizardStepFeatChoice(container, grant);
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Background Feat</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>From your "+escapeHtml(wizardState.background)+" background:</b> you start with the <b>"+escapeHtml(feat.name)+"</b> feat. "+
    escapeHtml(feat.summary || "")+" Choose what it gives you; the sheet applies it for you.";
  card.appendChild(explain);
  var ctx = wizardFeatContext({forBackgroundFeat:true});
  if(grant.option) ctx.lockedOption = grant.option;
  card.appendChild(renderFeatPicks(feat, wizardBackgroundFeatPicks(), ctx, function(){
    var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
    renderWizard();
  }));
  if(feat.description){
    var more = document.createElement("details");
    more.className = "rt-feat-more";
    more.innerHTML = "<summary>Full description</summary><p>"+escapeHtml(feat.description)+"</p>";
    card.appendChild(more);
  }
  container.appendChild(card);
}

/* A feat to choose: a background's (a Rewarded's Lucky, Magic Initiate
   or Skilled) or, the Campaign Feat, for a character whose background has
   no feat in a campaign that gives one (Skilled or Tough). Pick it, then
   make its picks. */
function wizardStepFeatChoice(container, grant){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>"+(grant.campaign ? "Campaign Feat" : "Background Feat")+"</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = grant.campaign
    ? "<b>From your "+escapeHtml(CAMPAIGN_FEATS[grant.campaign].label)+" campaign:</b> your background doesn't come with a feat, so you choose one of these. "+
      "Tough is the simple pick: more hit points at every level."
    : "<b>From your "+escapeHtml(wizardState.background)+" background:</b> you choose one of these feats.";
  card.appendChild(explain);
  var raceFeat = wizardState.raceChoices.feat;
  var box = ce("div","fs-options");
  grant.choices.forEach(function(name){
    var def = featDef(name), taken = raceChoiceDef() && raceChoiceDef().feat && raceFeat===name;
    var row = ce("div","wiz-equip-option fs-option"+(grant.def===def ? " selected" : "")+(taken ? " disabled" : ""));
    row.setAttribute("role","button");
    row.tabIndex = taken ? -1 : 0;
    row.setAttribute("aria-pressed", grant.def===def ? "true" : "false");
    row.innerHTML = "<div><strong>"+escapeHtml(name)+"</strong><div class='lu-sub-blurb'>"+escapeHtml(def.summary||"")+"</div>"+
      (taken ? "<div class='lu-sub-feats'>You already took it as your "+escapeHtml(wizardState.race)+" feat.</div>" : "")+"</div>";
    function choose(){
      if(taken) return;
      wizardState[grant.campaign ? "campaignFeat" : "bgFeatChoice"] = name;
      var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
      renderWizard();
    }
    row.addEventListener("click", choose);
    row.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); choose(); } });
    box.appendChild(row);
  });
  card.appendChild(box);
  if(grant.def && featHasPicks(grant.def)){
    card.appendChild(renderFeatPicks(grant.def, wizardBackgroundFeatPicks(), wizardFeatContext({forBackgroundFeat:true}), function(){
      var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
      renderWizard();
    }));
  }
  container.appendChild(card);
}
