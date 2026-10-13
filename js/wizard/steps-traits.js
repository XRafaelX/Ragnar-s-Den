/* ---------------- Creation wizard: skills, race traits and feats ----------------
   The Skills step, the race's own choices, a race's feat and its picks,
   and the feat a background or campaign gives. */
import { ABILITIES, SKILLS } from "../data/abilities-skills.js";
import { BACKGROUND_INFO } from "../data/backgrounds.js";
import { mod, fmtMod, escapeHtml, ce } from "../core/helpers.js";
import { themedPicker } from "../ui/themed-picker.js";
import { currentClassInfo, wizardState, renderWizard, abilityFullName, raceChoiceDef, raceAbilityIncreases, featPrereqReason, wizardFeatContext, wizardBackgroundFeat, wizardBackgroundFeatPicks, wizardBackgroundSkills, refreshWizardProgress } from "./wizard-core.js";
import { emptyPicks, featNeedsChoice, featHasPicks, featDef, TOOL_GROUPS } from "../core/feat-picks.js";
import { renderFeatPicks } from "../ui/feat-picks.js";
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
  // Picks that no longer fit (the background was changed) are dropped.
  if(!bgPick) wizardState.bgSkillChoices = [];
  else wizardState.bgSkillChoices = (wizardState.bgSkillChoices||[]).filter(function(sk){ return bgPick.options.indexOf(sk)!==-1; });

  var info = currentClassInfo();
  card.appendChild(pickLabel("Choose "+info.skillChoices.count+" from your class list:"));
  card.appendChild(checkList(info.skillChoices.options, wizardState.skillChoices, info.skillChoices.count,
    function(sk){ return wizardState.bgSkillChoices.indexOf(sk)!==-1 || ((bgInfo && bgInfo.skills)||[]).indexOf(sk)!==-1 ? "from background" : ""; },
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

/* Race Traits: the picks a race leaves to the player (see RACE_CHOICES):
   ability increases (Variant Human's two +1s, a Half-Elf's, a Fairy's +2
   and +1, an Aasimar's subrace), a skill and a tool. Each pick is a
   numbered section that shows a check once it's done. Equal increases are
   a row of tappable score tiles (pick N), different ones a picker each;
   skills and tools use themed pickers. A race's feat has its own steps
   after this one (wizardStepFeat, wizardStepFeatPicks). */
var CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="5 12.5 10 17.5 19 7"/></svg>';

export function wizardStepRaceChoices(container){
  var def = raceChoiceDef(), rc = wizardState.raceChoices;
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Race Traits</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> As a <b>"+escapeHtml(wizardState.race)+"</b> you choose some of your traits yourself instead of getting fixed ones. These picks let you shape exactly the character you want.";
  card.appendChild(explain);

  var known = wizardState.skillChoices.concat(wizardBackgroundSkills());
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
    var amounts = def.abilityBonus.amounts, n = amounts.length, exclude = def.abilityBonus.exclude || [];
    var notText = exclude.length ? " other than "+exclude.map(abilityFullName).join(" or ") : "";
    var chosen = rc.abilities.slice(0, n).filter(function(k){ return k && exclude.indexOf(k)===-1; });
    var allSame = amounts.every(function(a){ return a===amounts[0]; });
    if(allSame){
      // Same amount for each pick: tap that many score tiles.
      var amt = amounts[0];
      var sec1 = section("Ability score increase",
        (n===1 ? "Tap a score" : "Tap "+n+" different scores")+notText+" to raise by +"+amt+" (up to 20).", chosen.length===n);
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
      var done = slots.filter(Boolean).length===n && new Set(slots).size===n;
      var secA = section("Ability score increase", amounts.map(function(a){ return "+"+a; }).join(" to one score and ")+" to another, up to 20.", done);
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

  if(def.skills){
    var skillList = def.skillOptions || SKILLS.map(function(x){ return x[0]; });
    var skillsPicked = rc.skills.slice(0, def.skills).filter(function(sk, i, all){ return sk && known.indexOf(sk)===-1 && skillList.indexOf(sk)!==-1 && all.indexOf(sk)===i; });
    var sec2 = section(def.skills>1 ? "Skill proficiencies" : "Skill proficiency",
      "Become proficient in "+(def.skills>1 ? def.skills+" skills" : "one skill")+(def.skillOptions ? " from "+def.skillOptions.join(", ") : " of your choice")+".", skillsPicked.length===def.skills);
    for(var s=0;s<def.skills;s++){
      (function(s){
        sec2.appendChild(pickerField(themedPicker({
          key:"race:skill:"+s, placeholder:"Choose a skill", ariaLabel:"Race skill"+(def.skills>1 ? " "+(s+1) : ""),
          groups:{"":skillList},
          value:rc.skills[s]||"",
          reasonFor:function(sk){
            if(known.indexOf(sk)!==-1) return "known";
            return sk!==rc.skills[s] && rc.skills.indexOf(sk)!==-1 ? "picked" : "";
          },
          onPick:function(v){ rc.skills[s] = v; picked(); }
        })));
      })(s);
    }
  }

  if(def.tools){
    rc.tools = rc.tools || [];
    var toolsPicked = rc.tools.slice(0, def.tools).filter(Boolean);
    var secT = section("Tool proficiency", "Become proficient with "+(def.tools>1 ? def.tools+" tools" : "one tool")+" of your choice.", toolsPicked.length===def.tools);
    for(var tIdx=0; tIdx<def.tools; tIdx++){
      (function(i){
        secT.appendChild(pickerField(themedPicker({
          key:"race:tool:"+i, placeholder:"Choose a tool", ariaLabel:"Race tool"+(def.tools>1 ? " "+(i+1) : ""),
          groups:TOOL_GROUPS, value:rc.tools[i]||"",
          reasonFor:function(t){ return t!==rc.tools[i] && rc.tools.indexOf(t)!==-1 ? "picked" : ""; },
          onPick:function(v){ rc.tools[i] = v; picked(); }
        })));
      })(tIdx);
    }
  }

  container.appendChild(card);
}

/* Feat (a Variant Human's): a searchable list like the level-up's, each
   feat with its prerequisite and summary; ones the character can't take
   yet are greyed out with the reason. Its own picks come on the next
   step (Feat Choices), so each screen does one thing. */
export function wizardStepFeat(container){
  var rc = wizardState.raceChoices;
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Choose a Feat</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>Why this matters:</b> As a <b>"+escapeHtml(wizardState.race)+"</b> you start with a feat, a special talent most characters only get later. "+
    "Greyed-out feats need something your character doesn't have yet.";
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
    list.innerHTML = "";
    var q = (wizardState.featQuery||"").toLowerCase().trim();
    FEATS_CATALOG.filter(function(f){
      return !q || f.name.toLowerCase().indexOf(q)!==-1 || (f.summary||"").toLowerCase().indexOf(q)!==-1;
    }).slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(f){
      var why = featPrereqReason(f);
      var r = ce("div","wiz-spell-row wiz-pick-row"+(rc.feat===f.name ? " selected" : "")+(why ? " disabled" : ""));
      r.setAttribute("role", "button");
      r.tabIndex = why ? -1 : 0;
      r.setAttribute("aria-pressed", rc.feat===f.name ? "true" : "false");
      r.innerHTML = "<div class='wiz-spell-text'><b>"+escapeHtml(f.name)+"</b>"+
        (f.prerequisite && f.prerequisite!=="None" ? "<span class='wiz-spell-meta'>Requires: "+escapeHtml(f.prerequisite)+(why ? " ("+escapeHtml(why)+")" : "")+"</span>" : "")+
        "<span class='wiz-spell-desc'>"+escapeHtml(f.summary||"")+"</span></div>";
      function choose(){
        if(why) return;
        if(rc.feat!==f.name){ rc.feat = f.name; rc.featPicks = emptyPicks(f); }
        var e = document.getElementById("wizard-error"); if(e) e.classList.remove("show");
        fill(); drawChosen();
        refreshWizardProgress(); // a feat with choices adds a step
      }
      r.addEventListener("click", choose);
      r.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); choose(); } });
      list.appendChild(r);
    });
    if(!list.children.length){
      var none = ce("p","wiz-spell-empty");
      none.textContent = "No feats match \u201c"+wizardState.featQuery+"\u201d.";
      list.appendChild(none);
    }
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
  if(grant.campaign) return wizardStepCampaignFeat(container, grant);
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

/* Campaign Feat: the same step for a character whose background has no
   feat in a campaign that gives one. Pick it (Skilled or Tough), then
   make its picks. */
function wizardStepCampaignFeat(container, grant){
  var card = ce("div","card");
  card.innerHTML = "<h3><span>Campaign Feat</span></h3>";
  var explain = ce("div","wiz-explain");
  explain.innerHTML = "<b>From your "+escapeHtml(CAMPAIGN_FEATS[grant.campaign].label)+" campaign:</b> your background doesn't come with a feat, so you choose one of these. "+
    "Tough is the simple pick: more hit points at every level.";
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
      wizardState.campaignFeat = name;
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
