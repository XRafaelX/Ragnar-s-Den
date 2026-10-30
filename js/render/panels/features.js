import { save } from "../../core/state.js";
import { getAllCharacterFeatures, unseenUnlockCount, maxHp, fmtMod } from "../../core/helpers.js";
import { performRoll } from "../../dice/dice.js";
import { makeCard, renderAll } from "../sheet.js";
import { openFeatEditor } from "./feat-picker.js";
import { openCompendium } from "../compendium.js";
import { getCustomEntry } from "../../core/custom-features.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { playAdd, playDelete } from "../../ui/sound.js";
import { renderInfusionsCard } from "./infusions.js";
import { renderInvocationsCard } from "./invocations.js";
import { renderOptionSetCards } from "./class-options.js";
import { renderClassPicksCard } from "./class-picks.js";
import { featPicksPending, featAppliedSummary, revertFeatPicks, featHasPicks, featNeedsChoice, applyFeatPicks,
  backgroundFeatMissing, backgroundFeatCopy, backgroundFeatPicks, backgroundFeatLabel, campaignFeatMissing, campaignFeatCopy, featDef, emptyPicks } from "../../core/feat-picks.js";
import { openFeatPicksModal } from "../../ui/feat-picks.js";
import { openBottomSheet } from "../../ui/bottom-sheet.js";
import { makeChevronRightSvg } from "../../ui/svg-icons.js";

/* ---- Features & Feats panel ----
   One list for everything the character has: class, subclass, racial and
   background features, feats and custom entries, with one search and
   category filters. Feats used to have their own card as well, which
   showed each feat twice. Custom feats and features are made in the
   Compendium's Feats tab (so they can be reused); the character holds a
   linked copy. Each card is kept short (name, source, two lines of
   description); a tap opens the full text, with Edit and Remove. */
var featureCategoryFilter = "all";
var featureSearchQuery = "";

/* A feature's or feat's full description, in a bottom sheet: its name,
   its source, the whole text, and Edit / Remove where it has them. */
function openFeatureSheet(item, actions){
  openBottomSheet(function(body, refresh, close){
    var header = document.createElement("div");
    header.className = "bs-header";
    var title = document.createElement("div");
    title.className = "bs-title";
    title.textContent = item.name;
    header.appendChild(title);
    var closeBtn = document.createElement("button");
    closeBtn.className = "bs-close"; closeBtn.textContent = "✕"; closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.addEventListener("click", close);
    header.appendChild(closeBtn);
    body.appendChild(header);
    var sub = document.createElement("p");
    sub.className = "bs-subtitle";
    sub.textContent = item.source || "Feature";
    body.appendChild(sub);
    if(item.text){
      var desc = document.createElement("div");
      desc.className = "ff-desc ff-sheet-desc";
      desc.textContent = item.text;
      body.appendChild(desc);
    }
    if(actions.length){
      var row = document.createElement("div");
      row.className = "ff-sheet-actions";
      actions.forEach(function(a){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn small" + (a.danger ? " ff-sheet-danger" : "");
        b.textContent = a.label;
        b.title = a.title;
        b.addEventListener("click", function(){ close(); a.run(); });
        row.appendChild(b);
      });
      body.appendChild(row);
    }
  });
}

export function renderFeaturesPanel(c){
  var panel = document.createElement("div");

  /* Features unlocked by a level-up carry a NEW badge until the card is
     tapped once (ids live in c.newUnlocks). */
  function markIfNew(card, titleGrp, id){
    if((c.newUnlocks||[]).indexOf(id)===-1) return;
    var badge = document.createElement("span");
    badge.className = "lu-new-badge";
    badge.textContent = "New";
    titleGrp.insertBefore(badge, titleGrp.firstChild);
    card.classList.add("is-new");
    card.title = "Tap to mark as seen";
    card.addEventListener("click", function(e){
      if(e.target.closest("button")) return;
      c.newUnlocks = c.newUnlocks.filter(function(x){ return x!==id; });
      save();
      badge.remove();
      card.classList.remove("is-new");
      card.removeAttribute("title");
      refreshTabDot();
    });
  }
  function refreshTabDot(){
    var dot = document.querySelector('#tabs button[data-tab="features"] .tab-new-dot');
    if(dot && !unseenUnlockCount(c)) dot.remove();
  }

  var allFeatures = getAllCharacterFeatures(c);
  var featDirCard = makeCard("Features & feats (" + allFeatures.length + ")");

  var dirHeader = document.createElement("div");
  dirHeader.className = "ff-section-header";
  dirHeader.innerHTML = '<span style="font-size:12px;color:var(--text-on-parch-dim);">Everything your character can do</span>';
  var headerBtns = document.createElement("div");
  headerBtns.className = "ff-header-btns";
  // One way in: the Compendium's Feats tab lists feats (built-in and
  // custom) and custom features to add, and its + makes new ones.
  var addBtn = document.createElement("button");
  addBtn.className = "btn small primary";
  addBtn.textContent = "+ Add feat or feature";
  addBtn.addEventListener("click", function(){ openCompendium({tab:"feat", forCharacter:c}); });
  headerBtns.appendChild(addBtn);
  dirHeader.appendChild(headerBtns);
  featDirCard.appendChild(dirHeader);

  // Search & Filter controls
  var searchBar = document.createElement("div");
  searchBar.className = "ff-search-bar";
  var searchInput = document.createElement("input");
  searchInput.className = "ff-search-input";
  searchInput.type = "text";
  searchInput.placeholder = "Search features & feats…";
  searchInput.value = featureSearchQuery;
  searchInput.addEventListener("input", function(){
    featureSearchQuery = searchInput.value;
    updateFeatureList();
  });
  searchBar.appendChild(searchInput);
  featDirCard.appendChild(searchBar);

  // Filter pills
  var pillRow = document.createElement("div");
  pillRow.className = "ff-pill-row";
  var categories = [
    { key: "all", label: "All (" + allFeatures.length + ")" },
    { key: "class", label: "Class (" + allFeatures.filter(function(f){ return f.category==="class"; }).length + ")" },
    { key: "race", label: "Racial (" + allFeatures.filter(function(f){ return f.category==="race"; }).length + ")" },
    { key: "background", label: "Background (" + allFeatures.filter(function(f){ return f.category==="background"; }).length + ")" },
    { key: "feat", label: "Feats (" + allFeatures.filter(function(f){ return f.category==="feat"; }).length + ")" },
    { key: "custom", label: "Custom / Passives (" + allFeatures.filter(function(f){ return f.category==="custom" || f.category==="passive"; }).length + ")" }
  ];

  categories.forEach(function(cat){
    var pill = document.createElement("button");
    pill.className = "ff-pill" + (featureCategoryFilter === cat.key ? " active" : "");
    pill.textContent = cat.label;
    pill.addEventListener("click", function(){
      featureCategoryFilter = cat.key;
      var pills = pillRow.querySelectorAll(".ff-pill");
      pills.forEach(function(p){ p.classList.remove("active"); });
      pill.classList.add("active");
      updateFeatureList();
    });
    pillRow.appendChild(pill);
  });
  featDirCard.appendChild(pillRow);

  var featListContainer = document.createElement("div");
  featListContainer.className = "ff-items-list";
  featDirCard.appendChild(featListContainer);

  function updateFeatureList(){
    featListContainer.innerHTML = "";
    var q = (featureSearchQuery || "").toLowerCase().trim();
    var filtered = allFeatures.filter(function(item){
      // Category filter
      if(featureCategoryFilter !== "all"){
        if(featureCategoryFilter === "custom"){
          if(item.category !== "custom" && item.category !== "passive") return false;
        } else if(item.category !== featureCategoryFilter) {
          return false;
        }
      }
      // Search filter
      if(q){
        var matchName = (item.name || "").toLowerCase().indexOf(q) !== -1;
        var matchText = (item.text || "").toLowerCase().indexOf(q) !== -1;
        var matchSource = (item.source || "").toLowerCase().indexOf(q) !== -1;
        if(!matchName && !matchText && !matchSource) return false;
      }
      return true;
    });

    if(filtered.length === 0){
      var emptyDiv = document.createElement("div");
      emptyDiv.style.cssText = "text-align:center;padding:20px;color:var(--text-on-parch-dim);font-size:13px;background:rgba(255,255,255,0.02);border-radius:6px;";
      if(q) emptyDiv.textContent = "Nothing matches \"" + q + "\".";
      else if(featureCategoryFilter === "feat"){
        emptyDiv.innerHTML = '<p style="margin:0 0 10px;">No feats yet. You can usually take one instead of an Ability Score Improvement.</p>';
        var browseBtn = document.createElement("button");
        browseBtn.className = "btn small";
        browseBtn.textContent = "+ Browse feats";
        browseBtn.addEventListener("click", function(){ openCompendium({tab:"feat", forCharacter:c}); });
        emptyDiv.appendChild(browseBtn);
      }
      else emptyDiv.textContent = "Nothing in this category yet.";
      featListContainer.appendChild(emptyDiv);
      return;
    }

    filtered.forEach(function(item){
      var card = document.createElement("div");
      card.className = "ff-item-card";

      var top = document.createElement("div");
      top.className = "ff-item-top";

      var titleGrp = document.createElement("div");
      titleGrp.className = "ff-item-title-group";

      var titleSpan = document.createElement("span");
      titleSpan.className = "ff-item-title";
      titleSpan.textContent = item.name;
      titleGrp.appendChild(titleSpan);

      var tagSpan = document.createElement("span");
      var sourceClass = "source-passive";
      if(item.category === "class") sourceClass = "source-class";
      else if(item.category === "race") sourceClass = "source-race";
      else if(item.category === "background") sourceClass = "source-bg";
      else if(item.category === "feat") sourceClass = "source-feat";

      tagSpan.className = "ff-tag " + sourceClass;
      tagSpan.textContent = item.source || "Feature";
      titleGrp.appendChild(tagSpan);
      // A save DC the feature sets, worked out ("WIS DC 13"); the sum is in its tooltip.
      (item.dcs || []).forEach(function(d){
        var dc = document.createElement("span");
        dc.className = "ff-dc";
        dc.textContent = d.chip;
        dc.title = d.line;
        titleGrp.appendChild(dc);
      });

      markIfNew(card, titleGrp, item.id);

      top.appendChild(titleGrp);

      // A roll with no other home (Vigilant Rebuke).
      if(item.roll){
        var fr = item.roll, frBtn = document.createElement("button");
        frBtn.type = "button"; frBtn.className = "btn small inv-roll-btn ff-roll-btn";
        frBtn.textContent = fr.qty + "d" + fr.die + fmtMod(fr.bonus);
        frBtn.title = "Roll " + fr.label;
        frBtn.addEventListener("click", function(){ performRoll(fr.die, fr.qty, fr.bonus, "none", fr.label); });
        titleGrp.appendChild(frBtn);
      }

      // Edit and Remove live in the details sheet the card opens.
      var sheetActions = [];
      if(item.isCustom && item.featureObj){
        var libEntry = item.featureObj.homebrewId ? getCustomEntry("feature", item.featureObj.homebrewId) : null;
        sheetActions.push({label: "Edit", title: libEntry ? "Edit in the Compendium (every character with it updates)" : "Edit and save it to the Compendium",
          run: function(){
            // Not in the Compendium (made before it kept them, or deleted
            // there): the form starts from this copy and links it on save.
            openCompendium(libEntry ? {edit:{kind:"feature", id:libEntry.id}, forCharacter:c}
                                    : {create:"feature", forCharacter:c, from:item.featureObj});
          }});
        sheetActions.push({label: "Remove", danger: true, title: "Remove from " + (c.name || "this character"),
          run: function(){
            confirmDialog("Remove " + item.name + "?",
              libEntry ? "It's removed from " + (c.name || "this character") + " but stays in the Compendium."
                       : "It isn't saved in the Compendium, so it will be gone for good.", function(){
              c.features = c.features.filter(function(f){ return f.id !== item.featureObj.id; });
              save();
              renderAll();
              playDelete();
            });
          }});
      } else if(item.isFeat && item.featObj){
        var featEntry = item.featObj.homebrewId ? getCustomEntry("feat", item.featObj.homebrewId) : null;
        var customFeat = featEntry || item.featObj.source==="Custom";
        sheetActions.push({label: "Edit", title: featEntry ? "Edit in the Compendium (every character with it updates)"
            : customFeat ? "Edit and save it to the Compendium" : "Edit feat details",
          run: function(){
            // Custom feats live in the Compendium (one made before it kept
            // them starts the form from this copy and is linked on save);
            // built-in feats are edited on this sheet only.
            if(featEntry) openCompendium({edit:{kind:"feat", id:featEntry.id}, forCharacter:c});
            else if(customFeat) openCompendium({create:"feat", forCharacter:c, from:item.featObj});
            else openFeatEditor(c, item.featObj, (c.feats||[]).indexOf(item.featObj));
          }});
        sheetActions.push({label: "Remove", danger: true, title: "Remove feat",
          run: function(){
            var takesBack = featAppliedSummary(item.featObj);
            confirmDialog("Remove feat " + item.name + "?", "Are you sure you want to remove this feat from " + (c.name || "this character") + "?" +
              (takesBack ? " This also takes back " + takesBack + "." : ""), function(){
              revertFeatPicks(c, item.featObj);
              c.feats = c.feats.filter(function(f){ return f !== item.featObj; });
              // Without Tough the max may drop below current HP.
              c.hp.current = Math.min(Number(c.hp.current)||0, maxHp(c));
              save();
              renderAll();
              playDelete();
            });
          }});
      }
      // A tap anywhere but a button opens the full description; › says so.
      var more = document.createElement("span");
      more.className = "ff-more";
      more.setAttribute("aria-hidden", "true");
      more.innerHTML = makeChevronRightSvg();
      top.appendChild(more);
      card.classList.add("ff-tappable");
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.setAttribute("aria-label", item.name + ": details");
      (function(item, sheetActions){
        function open(e){
          if(e.target.closest("button, a, input, .ff-picks-pending")) return;
          openFeatureSheet(item, sheetActions);
        }
        card.addEventListener("click", open);
        card.addEventListener("keydown", function(e){ if((e.key==="Enter" || e.key===" ") && e.target===card){ e.preventDefault(); open(e); } });
      })(item, sheetActions);

      card.appendChild(top);

      // The description, cut to two lines (the sheet has it all).
      if(item.text){
        var desc = document.createElement("div");
        desc.className = "ff-desc ff-desc-short";
        // Its paragraphs run on as one, so the two lines are all text.
        desc.textContent = item.text.replace(/\s*\n+\s*/g, " ");
        card.appendChild(desc);
      }

      // The background's own feat, for a sheet made before backgrounds
      // gave theirs (or whose background was changed): add it, or say no.
      var owed = item.category==="background" && item.isDerived && backgroundFeatMissing(c);
      if(owed){
        var offer = document.createElement("div");
        offer.className = "ff-picks-pending";
        offer.appendChild(document.createTextNode(owed.choices
          ? "This background also gives a feat: " + backgroundFeatLabel(c.background) + "."
          : "This background also gives the " + backgroundFeatLabel(c.background) + " feat."));
        // One button for its feat, or one per feat to choose from (a
        // Rewarded's Lucky, Magic Initiate or Skilled).
        (owed.choices || [owed.def.name]).forEach(function(name){
          var def = featDef(name);
          var addBtn2 = document.createElement("button");
          addBtn2.type = "button";
          addBtn2.className = "btn small primary";
          addBtn2.textContent = owed.choices ? "Add " + name : "Add it";
          addBtn2.addEventListener("click", function(){
            var copy = backgroundFeatCopy(c.background, name);
            if(!c.feats) c.feats = [];
            c.feats.push(copy);
            // Nothing to choose: applied at once. Otherwise its picks are
            // asked for now; closing the picker leaves the Choose prompt.
            if(featHasPicks(def) && !featNeedsChoice(def)) applyFeatPicks(c, copy, backgroundFeatPicks(c.background, name));
            save(); renderAll(); playAdd();
            if(featNeedsChoice(def)) openFeatPicksModal(c, copy, function(){ save(); renderAll(); });
          });
          offer.appendChild(addBtn2);
        });
        var skipBtn = document.createElement("button");
        skipBtn.type = "button";
        skipBtn.className = "btn small ghost";
        skipBtn.textContent = "Not for this character";
        skipBtn.addEventListener("click", function(){ c.backgroundFeatSkipped = c.background; save(); renderAll(); });
        offer.appendChild(skipBtn);
        card.appendChild(offer);
      }

      // The campaign's level 1 feat, for a character whose background has
      // none (a campaign set on the Information tab after creation).
      var camp = item.category==="background" && item.isDerived && !owed && campaignFeatMissing(c);
      if(camp){
        var campOffer = document.createElement("div");
        campOffer.className = "ff-picks-pending";
        campOffer.appendChild(document.createTextNode("Your " + camp.campaign + " campaign gives a feat at level 1 when the background has none: " + camp.choices.join(" or ") + "."));
        camp.choices.forEach(function(name){
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn small primary";
          btn.textContent = "Add " + name;
          btn.addEventListener("click", function(){
            var def = featDef(name), copy = campaignFeatCopy(def, camp.campaign, 1);
            if(!c.feats) c.feats = [];
            c.feats.push(copy);
            if(featHasPicks(def) && !featNeedsChoice(def)) applyFeatPicks(c, copy, emptyPicks(def));
            save(); renderAll(); playAdd();
            if(featNeedsChoice(def)) openFeatPicksModal(c, copy, function(){ save(); renderAll(); });
          });
          campOffer.appendChild(btn);
        });
        var campSkip = document.createElement("button");
        campSkip.type = "button";
        campSkip.className = "btn small ghost";
        campSkip.textContent = "Not for this character";
        campSkip.addEventListener("click", function(){ c.campaignFeatSkipped = c.campaign; save(); renderAll(); });
        campOffer.appendChild(campSkip);
        card.appendChild(campOffer);
      }

      // A feat whose +1 or skills were never applied (taken before the
      // sheet did it, or the picks were skipped).
      if(item.isFeat && item.featObj && featPicksPending(item.featObj, c)){
        var pending = document.createElement("div");
        pending.className = "ff-picks-pending";
        // With picks already made, it has grown one (a Rune Shaper's next rune).
        pending.appendChild(document.createTextNode(item.featObj.picks ? "This feat has another choice to make."
          : "This feat's choices (an ability increase, proficiencies or an element) aren't on the sheet yet."));
        var pickBtn = document.createElement("button");
        pickBtn.type = "button";
        pickBtn.className = "btn small primary";
        pickBtn.textContent = "Choose";
        pickBtn.addEventListener("click", function(){
          openFeatPicksModal(c, item.featObj, function(){ save(); renderAll(); });
        });
        pending.appendChild(pickBtn);
        card.appendChild(pending);
      }

      featListContainer.appendChild(card);
    });
  }

  updateFeatureList();
  var infusionsCard = renderInfusionsCard(c);
  if(infusionsCard) panel.appendChild(infusionsCard);
  var invocationsCard = renderInvocationsCard(c);
  if(invocationsCard) panel.appendChild(invocationsCard);
  renderOptionSetCards(c).forEach(function(card){ panel.appendChild(card); });
  var classPicksCard = renderClassPicksCard(c);
  if(classPicksCard) panel.appendChild(classPicksCard);
  panel.appendChild(featDirCard);

  return panel;
}
