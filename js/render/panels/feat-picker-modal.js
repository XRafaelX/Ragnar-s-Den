import { save } from "../../core/state.js";
import { uid, escapeHtml } from "../../core/helpers.js";
import { FEATS_CATALOG } from "../../data/feats.js";
import { renderAll } from "../sheet.js";

export function openFeatPickerModal(c, featToEdit, featIdx){
  var modal = document.getElementById("feat-modal");
  var body = document.getElementById("feat-modal-body");
  var title = document.getElementById("feat-modal-title");
  title.textContent = featToEdit ? "Edit Feat" : "Add Feat to " + (c.name || "Character");
  body.innerHTML = "";

  var activeModalTab = featToEdit ? "custom" : "browse";
  var selectedCatalogFeat = FEATS_CATALOG[0];
  var catalogSearch = "";

  var tabsBar = document.createElement("div");
  tabsBar.className = "feat-modal-tabs";

  var browseTabBtn = document.createElement("button");
  browseTabBtn.className = "feat-modal-tab-btn" + (activeModalTab === "browse" ? " active" : "");
  browseTabBtn.textContent = "Browse Standard Feats";

  var customTabBtn = document.createElement("button");
  customTabBtn.className = "feat-modal-tab-btn" + (activeModalTab === "custom" ? " active" : "");
  customTabBtn.textContent = featToEdit ? "Edit Feat Details" : "Create Custom Feat";

  tabsBar.appendChild(browseTabBtn);
  tabsBar.appendChild(customTabBtn);
  body.appendChild(tabsBar);

  var contentArea = document.createElement("div");
  body.appendChild(contentArea);

  browseTabBtn.addEventListener("click", function(){
    activeModalTab = "browse";
    browseTabBtn.classList.add("active");
    customTabBtn.classList.remove("active");
    renderBrowseTab();
  });

  customTabBtn.addEventListener("click", function(){
    activeModalTab = "custom";
    customTabBtn.classList.add("active");
    browseTabBtn.classList.remove("active");
    renderCustomTab();
  });

  function renderBrowseTab(){
    contentArea.innerHTML = "";

    var searchRow = document.createElement("div");
    searchRow.className = "ff-search-bar";
    var sInput = document.createElement("input");
    sInput.className = "ff-search-input";
    sInput.type = "text";
    sInput.placeholder = "Filter standard feats by name, benefit, prerequisite…";
    sInput.value = catalogSearch;
    searchRow.appendChild(sInput);
    contentArea.appendChild(searchRow);

    var split = document.createElement("div");
    split.className = "feat-catalog-split";

    var listCol = document.createElement("div");
    listCol.className = "feat-catalog-list";

    var previewCol = document.createElement("div");
    previewCol.className = "feat-catalog-preview";

    split.appendChild(listCol);
    split.appendChild(previewCol);
    contentArea.appendChild(split);

    function updatePreview(feat){
      selectedCatalogFeat = feat;
      previewCol.innerHTML = "";
      if(!feat){
        previewCol.innerHTML = '<div style="color:var(--text-on-parch-dim);font-size:13px;text-align:center;margin:auto;">Select a feat to view details.</div>';
        return;
      }
      var isAdded = (c.feats || []).some(function(f){ return f.name.toLowerCase() === feat.name.toLowerCase(); });

      var topPart = document.createElement("div");
      var h5 = document.createElement("h4");
      h5.style.cssText = "margin:0 0 6px;font-family:var(--serif);color:var(--brass-bright);font-size:18px;";
      h5.textContent = feat.name;
      topPart.appendChild(h5);

      var metaDiv = document.createElement("div");
      metaDiv.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px;";
      if(feat.category){
        var catSpan = document.createElement("span");
        catSpan.className = "ff-tag";
        catSpan.textContent = feat.category;
        metaDiv.appendChild(catSpan);
      }
      if(feat.prerequisite && feat.prerequisite !== "None"){
        var prereqSpan = document.createElement("span");
        prereqSpan.style.cssText = "font-size:11px;color:var(--text-on-parch-dim);font-style:italic;";
        prereqSpan.textContent = "Requires: " + feat.prerequisite;
        metaDiv.appendChild(prereqSpan);
      }
      topPart.appendChild(metaDiv);

      var descP = document.createElement("div");
      descP.style.cssText = "font-size:12.5px;line-height:1.45;color:var(--text-on-parch);white-space:pre-line;margin-bottom:12px;max-height:220px;overflow-y:auto;";
      descP.textContent = feat.description || feat.summary;
      topPart.appendChild(descP);
      previewCol.appendChild(topPart);

      var btnPart = document.createElement("div");
      btnPart.style.cssText = "margin-top:10px;padding-top:10px;border-top:1px solid var(--rule);display:flex;align-items:center;justify-content:space-between;gap:8px;";
      
      var statusSpan = document.createElement("span");
      statusSpan.style.cssText = "font-size:11.5px;color:var(--text-on-parch-dim);";
      statusSpan.textContent = isAdded ? "✓ Currently on character" : "";
      btnPart.appendChild(statusSpan);

      var addBtn = document.createElement("button");
      addBtn.className = "btn primary";
      addBtn.textContent = isAdded ? "+ Add Again" : "+ Add Feat";
      addBtn.addEventListener("click", function(){
        if(!c.feats) c.feats = [];
        c.feats.push({
          id: uid(),
          name: feat.name,
          prerequisite: feat.prerequisite || "None",
          category: feat.category || "General",
          summary: feat.summary || "",
          description: feat.description || "",
          source: "SRD"
        });
        save();
        renderAll();
        modal.classList.remove("open");
      });
      btnPart.appendChild(addBtn);
      previewCol.appendChild(btnPart);
    }

    function updateCatalogList(){
      listCol.innerHTML = "";
      var q = (catalogSearch || "").toLowerCase().trim();
      var filtered = FEATS_CATALOG.filter(function(f){
        if(q){
          var mName = f.name.toLowerCase().indexOf(q) !== -1;
          var mSumm = (f.summary || "").toLowerCase().indexOf(q) !== -1;
          var mDesc = (f.description || "").toLowerCase().indexOf(q) !== -1;
          var mPre = (f.prerequisite || "").toLowerCase().indexOf(q) !== -1;
          var mCat = (f.category || "").toLowerCase().indexOf(q) !== -1;
          if(!mName && !mSumm && !mDesc && !mPre && !mCat) return false;
        }
        return true;
      });

      if(filtered.length === 0){
        listCol.innerHTML = '<div style="padding:16px;text-align:center;font-size:12.5px;color:var(--text-on-parch-dim);">No standard feats match.</div>';
        updatePreview(null);
        return;
      }

      filtered.forEach(function(feat){
        var item = document.createElement("div");
        item.className = "feat-catalog-item" + (selectedCatalogFeat && selectedCatalogFeat.name === feat.name ? " selected" : "");
        
        var isAdded = (c.feats || []).some(function(f){ return f.name.toLowerCase() === feat.name.toLowerCase(); });
        
        item.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span class="feat-catalog-name">' + escapeHtml(feat.name) + '</span>' +
          (isAdded ? '<span class="ff-tag" style="background:rgba(90,164,105,0.2);color:#86efac;border-color:rgba(90,164,105,0.4);">Added</span>' : '') +
          '</div>' +
          '<div class="feat-catalog-summary">' + escapeHtml(feat.summary || feat.prerequisite || "") + '</div>';
        
        item.addEventListener("click", function(){
          var items = listCol.querySelectorAll(".feat-catalog-item");
          items.forEach(function(it){ it.classList.remove("selected"); });
          item.classList.add("selected");
          updatePreview(feat);
        });
        listCol.appendChild(item);
      });

      if(selectedCatalogFeat && filtered.some(function(f){ return f.name === selectedCatalogFeat.name; })){
        updatePreview(selectedCatalogFeat);
      } else if(filtered.length > 0){
        updatePreview(filtered[0]);
      } else {
        updatePreview(null);
      }
    }

    sInput.addEventListener("input", function(){
      catalogSearch = sInput.value;
      updateCatalogList();
    });

    updateCatalogList();
  }

  function renderCustomTab(){
    contentArea.innerHTML = "";
    var form = document.createElement("div");
    form.style.cssText = "display:flex;flex-direction:column;gap:12px;padding:4px 0;";

    var nameField = document.createElement("div");
    nameField.className = "field";
    nameField.innerHTML = '<label>Feat Name *</label>';
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "e.g. Shield Slam, Fey-Touched, Shadow Walker…";
    nameInput.value = featToEdit ? featToEdit.name : "";
    nameField.appendChild(nameInput);
    form.appendChild(nameField);

    var row = document.createElement("div");
    row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";

    var prereqField = document.createElement("div");
    prereqField.className = "field";
    prereqField.innerHTML = '<label>Prerequisite (optional)</label>';
    var prereqInput = document.createElement("input");
    prereqInput.type = "text";
    prereqInput.placeholder = "e.g. Strength 13+, Spellcasting, None";
    prereqInput.value = featToEdit ? (featToEdit.prerequisite || "") : "";
    prereqField.appendChild(prereqInput);
    row.appendChild(prereqField);

    var catField = document.createElement("div");
    catField.className = "field";
    catField.innerHTML = '<label>Category</label>';
    var catSelect = document.createElement("select");
    ["Combat","Defense","Magic","Utility","Support","Movement","Social","General"].forEach(function(cat){
      var opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      if(featToEdit && featToEdit.category === cat) opt.selected = true;
      catSelect.appendChild(opt);
    });
    catField.appendChild(catSelect);
    row.appendChild(catField);
    form.appendChild(row);

    var descField = document.createElement("div");
    descField.className = "field";
    descField.innerHTML = '<label>Description / Benefits *</label>';
    var descTextarea = document.createElement("textarea");
    descTextarea.className = "freeform";
    descTextarea.style.minHeight = "120px";
    descTextarea.placeholder = "Describe the perks, mechanics, stat bonuses, or actions granted by this feat…";
    descTextarea.value = featToEdit ? (featToEdit.description || featToEdit.summary || "") : "";
    descField.appendChild(descTextarea);
    form.appendChild(descField);

    var actionsRow = document.createElement("div");
    actionsRow.className = "actions";
    actionsRow.style.marginTop = "10px";

    var cancelBtn = document.createElement("button");
    cancelBtn.className = "btn ghost";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", function(){ modal.classList.remove("open"); });

    var saveBtn = document.createElement("button");
    saveBtn.className = "btn primary";
    saveBtn.textContent = featToEdit ? "Save Changes" : "Add Feat to Character";
    saveBtn.addEventListener("click", function(){
      var nameVal = (nameInput.value || "").trim();
      if(!nameVal){
        alert("Please enter a feat name.");
        nameInput.focus();
        return;
      }
      if(!c.feats) c.feats = [];
      if(featToEdit && featIdx != null && c.feats[featIdx]){
        c.feats[featIdx].name = nameVal;
        c.feats[featIdx].prerequisite = (prereqInput.value || "").trim() || "None";
        c.feats[featIdx].category = catSelect.value;
        c.feats[featIdx].description = descTextarea.value;
      } else {
        c.feats.push({
          id: uid(),
          name: nameVal,
          prerequisite: (prereqInput.value || "").trim() || "None",
          category: catSelect.value,
          description: descTextarea.value,
          source: "Custom"
        });
      }
      save();
      renderAll();
      modal.classList.remove("open");
    });

    actionsRow.appendChild(cancelBtn);
    actionsRow.appendChild(saveBtn);
    form.appendChild(actionsRow);
    contentArea.appendChild(form);
  }

  if(activeModalTab === "browse") renderBrowseTab();
  else renderCustomTab();

  modal.classList.add("open");

  var closeBtn = document.getElementById("feat-modal-close");
  function onClose(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", onClose);
  }
  closeBtn.addEventListener("click", onClose);
}
