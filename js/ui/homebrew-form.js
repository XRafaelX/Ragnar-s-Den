import { escapeHtml } from "../core/helpers.js";
import { refreshCatalog } from "./catalog-picker.js";

/* ---------------- Homebrew form pieces ----------------
   The building blocks of the "make your own" forms in the Compendium
   (subclasses, races, backgrounds, feats, features) and the Armory
   (weapons, armor): a form card with titled sections and a live preview
   beside it on wide screens, shown in the catalog page's custom view. */

export function facts(rows){
  return "<dl class='cmp-facts'>"+rows.filter(function(r){ return r[1]; }).map(function(r){
    return "<dt>"+escapeHtml(r[0])+"</dt><dd>"+escapeHtml(r[1])+"</dd>";
  }).join("")+"</dl>";
}

export function textField(labelTxt, value, placeholder, multiline){
  var f = document.createElement("div");
  f.className = "field cmp-form-field";
  var l = document.createElement("label");
  l.textContent = labelTxt;
  f.appendChild(l);
  var input = document.createElement(multiline ? "textarea" : "input");
  if(!multiline) input.type = "text";
  if(multiline) input.rows = 3;
  input.value = value || "";
  input.placeholder = placeholder || "";
  f.appendChild(input);
  return {field:f, input:input};
}

/* The shared form frame: title/intro, sections, actions, preview. */
export function homebrewShell(container, titleText, introText){
  var wrap = document.createElement("div");
  wrap.className = "cmp-form-wrap";
  var form = document.createElement("div");
  form.className = "cmp-form";
  wrap.appendChild(form);
  var head = document.createElement("div");
  head.className = "cmp-form-head";
  head.innerHTML = "<h4 class='cmp-form-title'>"+escapeHtml(titleText)+"</h4><p class='cmp-form-intro'>"+escapeHtml(introText)+"</p>";
  form.appendChild(head);
  var preview = document.createElement("aside");
  preview.className = "cmp-preview";
  preview.setAttribute("aria-label", "Preview");
  wrap.appendChild(preview);
  container.appendChild(wrap);
  return {
    form: form,
    preview: preview,
    section: function(title, extra){
      var sec = document.createElement("div");
      sec.className = "cmp-form-section";
      var h = document.createElement("div");
      h.className = "cmp-form-section-head";
      h.innerHTML = "<h5>"+escapeHtml(title)+"</h5>"+(extra||"");
      sec.appendChild(h);
      form.appendChild(sec);
      return sec;
    },
    actions: function(saveLabel, onSave){
      var actions = document.createElement("div");
      actions.className = "cmp-form-actions";
      var cancel = document.createElement("button");
      cancel.type = "button"; cancel.className = "btn ghost"; cancel.textContent = "Cancel";
      cancel.addEventListener("click", function(){ refreshCatalog(); });
      var saveBtn = document.createElement("button");
      saveBtn.type = "button"; saveBtn.className = "btn primary"; saveBtn.textContent = saveLabel;
      saveBtn.addEventListener("click", onSave);
      actions.appendChild(cancel); actions.appendChild(saveBtn);
      form.appendChild(actions);
    }
  };
}

export function numberField(labelTxt, value, placeholder){
  var f = textField(labelTxt, value==null ? "" : String(value), placeholder);
  f.input.type = "number"; f.input.min = "0"; f.input.step = "5"; f.input.inputMode = "numeric";
  return f;
}

export function pickerField(labelTxt, picker){
  var f = document.createElement("div");
  f.className = "field cmp-form-field";
  f.innerHTML = "<label>"+escapeHtml(labelTxt)+"</label>";
  f.appendChild(picker);
  return f;
}

export function previewCard(preview, html){
  preview.innerHTML = "<div class='cmp-preview-label'>Preview</div><div class='cmp-preview-card'>"+html+"</div>";
}
