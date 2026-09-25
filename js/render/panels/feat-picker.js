import { save } from "../../core/state.js";
import { renderAll } from "../sheet.js";
import { FEAT_CATEGORIES as CATEGORIES } from "../../core/custom-features.js";

/* ---- Feat editor ----
   Edits a built-in feat's copy on one sheet. Feats are added from the
   Compendium's Feats tab, where custom feats are made and edited too. */

/* The feat modal's form (editing a built-in feat's copy on a sheet).
   onSubmit gets the cleaned fields. */
function buildFeatForm(container, opts){
  var feat = opts.feat;
  var form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:420px;";

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
    opts.onSubmit(fields);
  });
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  container.appendChild(form);
}

/* Edit a feat's copy on this character in the small feat modal. */
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
