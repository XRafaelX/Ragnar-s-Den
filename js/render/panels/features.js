import { save } from "../../core/state.js";
import { getAllCharacterFeatures, unseenUnlockCount } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { openFeatPicker, openFeatEditor } from "./feat-picker.js";
import { openFeatureModal } from "./feature-modal.js";
import { confirmDialog } from "../../ui/confirm-modal.js";
import { playDelete } from "../../ui/sound.js";

/* ---- Features & Feats panel ----
   One list for everything the character has: class, subclass, racial and
   background features, feats and custom entries, with one search and
   category filters. Feats used to have their own card as well, which
   showed each feat twice. */
var featureCategoryFilter = "all";
var featureSearchQuery = "";

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
  var addFeatBtn = document.createElement("button");
  addFeatBtn.className = "btn small primary";
  addFeatBtn.textContent = "+ Add feat";
  addFeatBtn.addEventListener("click", function(){ openFeatPicker(c); });
  headerBtns.appendChild(addFeatBtn);
  var addCustomFeatureBtn = document.createElement("button");
  addCustomFeatureBtn.className = "btn small";
  addCustomFeatureBtn.textContent = "+ Custom feature";
  addCustomFeatureBtn.addEventListener("click", function(){ openFeatureModal(c); });
  headerBtns.appendChild(addCustomFeatureBtn);
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
        browseBtn.addEventListener("click", function(){ openFeatPicker(c); });
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

      markIfNew(card, titleGrp, item.id);

      top.appendChild(titleGrp);

      if(item.isCustom && item.featureObj){
        var actions = document.createElement("div");
        actions.className = "ff-actions";

        var editBtn = document.createElement("button");
        editBtn.className = "ff-action-btn";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function(){
          openFeatureModal(c, item.featureObj);
        });
        actions.appendChild(editBtn);

        var delBtn = document.createElement("button");
        delBtn.className = "ff-action-btn danger";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", function(){
          confirmDialog("Delete " + item.name + "?", "Delete this custom feature?", function(){
            c.features = c.features.filter(function(f){ return f.id !== item.featureObj.id; });
            save();
            renderAll();
            playDelete();
          });
        });
        actions.appendChild(delBtn);
        top.appendChild(actions);
      } else if(item.isFeat && item.featObj){
        var actions = document.createElement("div");
        actions.className = "ff-actions";
        var editFeatBtn = document.createElement("button");
        editFeatBtn.className = "ff-action-btn";
        editFeatBtn.textContent = "Edit";
        editFeatBtn.title = "Edit feat details";
        editFeatBtn.addEventListener("click", function(){
          openFeatEditor(c, item.featObj, (c.feats||[]).indexOf(item.featObj));
        });
        actions.appendChild(editFeatBtn);
        var rmFeatBtn = document.createElement("button");
        rmFeatBtn.className = "ff-action-btn danger";
        rmFeatBtn.textContent = "Remove";
        rmFeatBtn.title = "Remove feat";
        rmFeatBtn.addEventListener("click", function(){
          confirmDialog("Remove feat " + item.name + "?", "Are you sure you want to remove this feat from " + (c.name || "this character") + "?", function(){
            c.feats = c.feats.filter(function(f){ return f !== item.featObj; });
            save();
            renderAll();
            playDelete();
          });
        });
        actions.appendChild(rmFeatBtn);
        top.appendChild(actions);
      }

      card.appendChild(top);

      if(item.text){
        var desc = document.createElement("div");
        desc.className = "ff-desc";
        desc.textContent = item.text;
        card.appendChild(desc);
      }

      featListContainer.appendChild(card);
    });
  }

  updateFeatureList();
  panel.appendChild(featDirCard);

  return panel;
}
