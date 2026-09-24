import { save } from "../../core/state.js";
import { uid } from "../../core/helpers.js";
import { FEATS_CATALOG } from "../../data/feats.js";
import { renderAll } from "../sheet.js";
import { openCatalogPicker } from "../../ui/catalog-picker.js";
import { playAdd } from "../../ui/sound.js";
import { showActionToast } from "../../ui/toast.js";

var CATEGORIES = ["Combat","Defense","Magic","Physical","Utility","Support","Movement","Social","General"];

function hasFeat(c, name){
  var n = (name||"").trim().toLowerCase();
  return (c.feats||[]).some(function(f){ return (f.name||"").trim().toLowerCase() === n; });
}

/* Catalog feats by category (the picker's filter pills), alphabetical
   within each, plus a name -> feat lookup for the row renderers. */
var FEAT_DATA = {};
var FEAT_GROUPS = {};
FEATS_CATALOG.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).forEach(function(f){
  FEAT_DATA[f.name] = f;
  var cat = f.category || "General";
  (FEAT_GROUPS[cat] = FEAT_GROUPS[cat] || []).push(f.name);
});
var ORDERED_GROUPS = {};
CATEGORIES.concat(Object.keys(FEAT_GROUPS)).forEach(function(cat){
  if(FEAT_GROUPS[cat] && !ORDERED_GROUPS[cat]) ORDERED_GROUPS[cat] = FEAT_GROUPS[cat];
});

/* Returns false (so the picker skips its "✓ Added" flash) when the feat is
   already on the sheet; a second copy is what the custom form is for. */
function addCatalogFeat(c, name, d){
  if(hasFeat(c, name)){
    showActionToast(name + " is already on " + (c.name||"this character") + "’s feat list.");
    return false;
  }
  if(!c.feats) c.feats = [];
  c.feats.push({
    id: uid(), name: name,
    prerequisite: d.prerequisite || "None", category: d.category || "General",
    summary: d.summary || "", description: d.description || "", source: "SRD"
  });
  save();
  playAdd();
}

/* One form for both creating a custom feat and editing an existing one:
   pass `feat` to edit it in place. onSubmit gets the cleaned fields. */
function buildFeatForm(container, opts){
  var feat = opts.feat;
  var form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:420px;";

  if(opts.title){
    var title = document.createElement("h4");
    title.style.cssText = "font-family:var(--serif);color:var(--brass-bright);margin:0;font-weight:normal;font-size:17px;";
    title.textContent = opts.title;
    form.appendChild(title);
  }

  var nameField = document.createElement("div"); nameField.className = "field";
  nameField.innerHTML = "<label>Feat Name *</label>";
  var nameInput = document.createElement("input");
  nameInput.type = "text"; nameInput.placeholder = "e.g. Shield Slam, Fey-Touched, Shadow Walker…";
  nameInput.value = feat ? feat.name : "";
  nameField.appendChild(nameInput);
  form.appendChild(nameField);

  var row = document.createElement("div");
  row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";
  var prereqField = document.createElement("div"); prereqField.className = "field";
  prereqField.innerHTML = "<label>Prerequisite (optional)</label>";
  var prereqInput = document.createElement("input");
  prereqInput.type = "text"; prereqInput.placeholder = "e.g. Strength 13+";
  prereqInput.value = feat && feat.prerequisite !== "None" ? (feat.prerequisite || "") : "";
  prereqField.appendChild(prereqInput);
  row.appendChild(prereqField);

  var catField = document.createElement("div"); catField.className = "field";
  catField.innerHTML = "<label>Category</label>";
  var catSelect = document.createElement("select");
  var cats = CATEGORIES.slice();
  if(feat && feat.category && cats.indexOf(feat.category) === -1) cats.push(feat.category);
  cats.forEach(function(cat){
    var o = document.createElement("option"); o.value = cat; o.textContent = cat;
    if(feat && feat.category === cat) o.selected = true;
    catSelect.appendChild(o);
  });
  if(!feat) catSelect.value = "General";
  catField.appendChild(catSelect);
  row.appendChild(catField);
  form.appendChild(row);

  var descField = document.createElement("div"); descField.className = "field";
  descField.innerHTML = "<label>Description / Benefits *</label>";
  var desc = document.createElement("textarea");
  desc.className = "freeform"; desc.style.minHeight = "120px";
  desc.placeholder = "Describe the perks, mechanics, stat bonuses, or actions granted by this feat…";
  desc.value = feat ? (feat.description || feat.summary || "") : "";
  descField.appendChild(desc);
  form.appendChild(descField);

  var actions = document.createElement("div");
  actions.className = "actions";
  actions.style.marginTop = "6px";
  if(opts.onCancel){
    var cancelBtn = document.createElement("button");
    cancelBtn.className = "btn ghost"; cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", opts.onCancel);
    actions.appendChild(cancelBtn);
  }
  var submitBtn = document.createElement("button");
  submitBtn.className = "btn primary"; submitBtn.textContent = opts.submitLabel;
  submitBtn.addEventListener("click", function(){
    var nameVal = nameInput.value.trim();
    if(!nameVal){ alert("Please enter a feat name."); nameInput.focus(); return; }
    var fields = {
      name: nameVal, prerequisite: prereqInput.value.trim() || "None",
      category: catSelect.value, description: desc.value
    };
    if(!feat){
      nameInput.value = ""; prereqInput.value = ""; catSelect.value = "General"; desc.value = "";
    }
    opts.onSubmit(fields);
  });
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  container.appendChild(form);
}

export function openFeatPicker(c){
  openCatalogPicker({
    sections: [{
      key: "feats",
      label: "Feats",
      searchPlaceholder: "Search feats by name, benefit, prerequisite…",
      groups: ORDERED_GROUPS,
      data: FEAT_DATA,
      searchText: function(name, d){
        return [name, d.summary, d.description, d.prerequisite, d.category].join(" ");
      },
      renderSub: function(name, d){
        return d.prerequisite && d.prerequisite !== "None" ? "Requires: " + d.prerequisite : "";
      },
      renderDetail: function(name, d){ return d.summary; },
      renderRight: function(){ return []; },
      onAdd: function(name, d){ return addCatalogFeat(c, name, d); },
      renderCustomForm: function(container, closeCustom){
        buildFeatForm(container, {
          title: "Custom Feat",
          submitLabel: "+ Add Feat",
          onSubmit: function(fields){
            if(!c.feats) c.feats = [];
            c.feats.push({ id: uid(), name: fields.name, prerequisite: fields.prerequisite,
              category: fields.category, description: fields.description, source: "Custom" });
            save();
            playAdd();
            closeCustom();
            showActionToast('Added "' + fields.name + '" to ' + (c.name||"this character") + "’s feats.");
          }
        });
      }
    }],
    onClose: function(){ renderAll(); }
  });
}

/* Edit an existing feat (SRD or custom) in the small feat modal. */
export function openFeatEditor(c, feat, idx){
  var modal = document.getElementById("feat-modal");
  var body = document.getElementById("feat-modal-body");
  document.getElementById("feat-modal-title").textContent = "Edit Feat";
  body.innerHTML = "";

  var closeBtn = document.getElementById("feat-modal-close");
  function close(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", close);
  }

  buildFeatForm(body, {
    feat: feat,
    submitLabel: "Save Changes",
    onCancel: close,
    onSubmit: function(fields){
      var target = c.feats && c.feats[idx];
      if(target){
        target.name = fields.name;
        target.prerequisite = fields.prerequisite;
        target.category = fields.category;
        target.description = fields.description;
        save();
        renderAll();
      }
      close();
    }
  });

  modal.classList.add("open");
  closeBtn.addEventListener("click", close);
}
