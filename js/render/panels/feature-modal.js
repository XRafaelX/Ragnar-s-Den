import { save } from "../../core/state.js";
import { uid } from "../../core/helpers.js";
import { renderAll } from "../sheet.js";

export function openFeatureModal(c, featureToEdit){
  var modal = document.getElementById("feature-modal");
  var body = document.getElementById("feature-modal-body");
  var title = document.getElementById("feature-modal-title");
  title.textContent = featureToEdit ? "Edit Feature / Passive" : "Add Custom Feature / Passive";
  body.innerHTML = "";

  var form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px;padding:4px 0;";

  var nameField = document.createElement("div");
  nameField.className = "field";
  nameField.innerHTML = '<label>Feature Name *</label>';
  var nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "e.g. Relentless Rage, Darkvision, Fey Gift, Shield of Faith passive…";
  nameInput.value = featureToEdit ? featureToEdit.name : "";
  nameField.appendChild(nameInput);
  form.appendChild(nameField);

  var row = document.createElement("div");
  row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";

  var srcField = document.createElement("div");
  srcField.className = "field";
  srcField.innerHTML = '<label>Source / Category</label>';
  var srcSelect = document.createElement("select");
  ["Class","Race","Background","Passive","Feat","Magic Item","Other"].forEach(function(src){
    var opt = document.createElement("option");
    opt.value = src;
    opt.textContent = src;
    if(featureToEdit && featureToEdit.source === src) opt.selected = true;
    srcSelect.appendChild(opt);
  });
  srcField.appendChild(srcSelect);
  row.appendChild(srcField);

  var passField = document.createElement("div");
  passField.className = "field";
  passField.style.display = "flex";
  passField.style.flexDirection = "column";
  passField.style.justifyContent = "center";
  passField.innerHTML = '<label>Type</label>';
  var passLabel = document.createElement("label");
  passLabel.style.cssText = "display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-top:4px;";
  var passCb = document.createElement("input");
  passCb.type = "checkbox";
  passCb.className = "chk";
  passCb.checked = featureToEdit ? !!featureToEdit.isPassive : true;
  passLabel.appendChild(passCb);
  passLabel.appendChild(document.createTextNode("Passive ability / constant trait"));
  passField.appendChild(passLabel);
  row.appendChild(passField);

  form.appendChild(row);

  var descField = document.createElement("div");
  descField.className = "field";
  descField.innerHTML = '<label>Description / Mechanics *</label>';
  var descTextarea = document.createElement("textarea");
  descTextarea.className = "freeform";
  descTextarea.style.minHeight = "120px";
  descTextarea.placeholder = "Describe the feature, rules, passive bonuses, or activation details…";
  descTextarea.value = featureToEdit ? (featureToEdit.text || "") : "";
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
  saveBtn.textContent = featureToEdit ? "Save Changes" : "Add Feature";
  saveBtn.addEventListener("click", function(){
    var nameVal = (nameInput.value || "").trim();
    if(!nameVal){
      alert("Please enter a feature name.");
      nameInput.focus();
      return;
    }
    if(!c.features) c.features = [];
    if(featureToEdit){
      featureToEdit.name = nameVal;
      featureToEdit.source = srcSelect.value;
      featureToEdit.isPassive = passCb.checked;
      featureToEdit.text = descTextarea.value;
    } else {
      c.features.push({
        id: uid(),
        name: nameVal,
        source: srcSelect.value,
        isPassive: passCb.checked,
        text: descTextarea.value
      });
    }
    save();
    renderAll();
    modal.classList.remove("open");
  });

  actionsRow.appendChild(cancelBtn);
  actionsRow.appendChild(saveBtn);
  form.appendChild(actionsRow);

  body.appendChild(form);
  modal.classList.add("open");

  var closeBtn = document.getElementById("feature-modal-close");
  function onClose(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", onClose);
  }
  closeBtn.addEventListener("click", onClose);
}
