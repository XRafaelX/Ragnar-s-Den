import { save } from "../../core/state.js";
import { getAllCharacterFeatures } from "../../core/helpers.js";
import { makeCard, renderAll } from "../sheet.js";
import { openFeatPickerModal } from "./feat-picker-modal.js";
import { openFeatureModal } from "./feature-modal.js";
import { confirmDialog } from "../../ui/confirm-modal.js";

/* ---- Features & Feats panel ---- */
var featureCategoryFilter = "all";
var featureSearchQuery = "";
var featSearchQuery = "";

export function renderFeaturesPanel(c){
  var panel = document.createElement("div");

  // 1. Feats Card
  var feats = c.feats || [];
  var featCard = makeCard("Feats (" + feats.length + ")");
  
  var featHeader = document.createElement("div");
  featHeader.className = "ff-section-header";
  featHeader.innerHTML = '<span style="font-size:12px;color:var(--text-on-parch-dim);">' +
    (feats.length === 1 ? '1 feat active' : feats.length + ' feats active') + '</span>';
  
  var addFeatBtn = document.createElement("button");
  addFeatBtn.className = "btn small primary";
  addFeatBtn.textContent = "+ Add Feat";
  addFeatBtn.addEventListener("click", function(){
    openFeatPickerModal(c);
  });
  featHeader.appendChild(addFeatBtn);
  featCard.appendChild(featHeader);

  if(feats.length === 0){
    var emptyFeats = document.createElement("div");
    emptyFeats.style.cssText = "text-align:center;padding:24px 12px;background:rgba(255,255,255,0.02);border:1px dashed var(--rule);border-radius:6px;";
    emptyFeats.innerHTML = '<p style="margin:0 0 10px;font-size:13.5px;color:var(--text-on-parch-dim);">No feats added yet.</p>';
    var addFirstFeatBtn = document.createElement("button");
    addFirstFeatBtn.className = "btn small";
    addFirstFeatBtn.textContent = "+ Browse & Add Feats";
    addFirstFeatBtn.addEventListener("click", function(){ openFeatPickerModal(c); });
    emptyFeats.appendChild(addFirstFirstBtnFallback(addFirstFeatBtn));
    featCard.appendChild(emptyFeats);
  } else {
    var featList = document.createElement("div");
    featList.className = "ff-items-list";
    feats.forEach(function(feat, idx){
      var itemCard = document.createElement("div");
      itemCard.className = "ff-item-card";

      var top = document.createElement("div");
      top.className = "ff-item-top";

      var titleGrp = document.createElement("div");
      titleGrp.className = "ff-item-title-group";

      var titleSpan = document.createElement("span");
      titleSpan.className = "ff-item-title";
      titleSpan.textContent = feat.name;
      titleGrp.appendChild(titleSpan);

      var tagSpan = document.createElement("span");
      tagSpan.className = "ff-tag source-feat";
      tagSpan.textContent = feat.source || "Feat";
      titleGrp.appendChild(tagSpan);

      if(feat.category){
        var catSpan = document.createElement("span");
        catSpan.className = "ff-tag";
        catSpan.textContent = feat.category;
        titleGrp.appendChild(catSpan);
      }
      top.appendChild(titleGrp);

      var actions = document.createElement("div");
      actions.className = "ff-actions";

      var editBtn = document.createElement("button");
      editBtn.className = "ff-action-btn";
      editBtn.textContent = "Edit";
      editBtn.title = "Edit feat details";
      editBtn.addEventListener("click", function(){
        openFeatPickerModal(c, feat, idx);
      });
      actions.appendChild(editBtn);

      var delBtn = document.createElement("button");
      delBtn.className = "ff-action-btn danger";
      delBtn.textContent = "Remove";
      delBtn.title = "Remove feat";
      delBtn.addEventListener("click", function(){
        confirmDialog("Remove feat " + feat.name + "?", "Are you sure you want to remove this feat from " + (c.name || "this character") + "?", function(){
          c.feats.splice(idx, 1);
          save();
          renderAll();
        });
      });
      actions.appendChild(delBtn);
      top.appendChild(actions);
      itemCard.appendChild(top);

      if(feat.prerequisite && feat.prerequisite !== "None"){
        var prereq = document.createElement("div");
        prereq.className = "ff-prereq";
        prereq.textContent = "Prerequisite: " + feat.prerequisite;
        itemCard.appendChild(prereq);
      }

      if(feat.description){
        var desc = document.createElement("div");
        desc.className = "ff-desc";
        desc.textContent = feat.description;
        itemCard.appendChild(desc);
      } else if(feat.summary){
        var sum = document.createElement("div");
        sum.className = "ff-desc";
        sum.textContent = feat.summary;
        itemCard.appendChild(sum);
      }

      featList.appendChild(itemCard);
    });
    featCard.appendChild(featList);
  }
  panel.appendChild(featCard);

  // 2. All Features, Traits & Passives Directory Card
  var allFeatures = getAllCharacterFeatures(c);
  var featDirCard = makeCard("Features, traits & passives (" + allFeatures.length + ")");

  var dirHeader = document.createElement("div");
  dirHeader.className = "ff-section-header";
  dirHeader.innerHTML = '<span style="font-size:12px;color:var(--text-on-parch-dim);">All active powers & traits</span>';

  var addCustomFeatureBtn = document.createElement("button");
  addCustomFeatureBtn.className = "btn small ghost";
  addCustomFeatureBtn.textContent = "+ Add Custom Feature";
  addCustomFeatureBtn.addEventListener("click", function(){
    openFeatureModal(c);
  });
  dirHeader.appendChild(addCustomFeatureBtn);
  featDirCard.appendChild(dirHeader);

  // Search & Filter controls
  var searchBar = document.createElement("div");
  searchBar.className = "ff-search-bar";
  var searchInput = document.createElement("input");
  searchInput.className = "ff-search-input";
  searchInput.type = "text";
  searchInput.placeholder = "Search all abilities, traits & passives…";
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
      emptyDiv.textContent = q ? "No features or traits match \"" + q + "\"." : "No features found in this category.";
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
          });
        });
        actions.appendChild(delBtn);
        top.appendChild(actions);
      } else if(item.isFeat && item.featObj){
        var actions = document.createElement("div");
        actions.className = "ff-actions";
        var viewFeatBtn = document.createElement("button");
        viewFeatBtn.className = "ff-action-btn";
        viewFeatBtn.textContent = "Edit Feat";
        viewFeatBtn.addEventListener("click", function(){
          var idx = (c.feats||[]).indexOf(item.featObj);
          openFeatPickerModal(c, item.featObj, idx);
        });
        actions.appendChild(viewFeatBtn);
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

export function addFirstFirstBtnFallback(btn){
  return btn;
}
