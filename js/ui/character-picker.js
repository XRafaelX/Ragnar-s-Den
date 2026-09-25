import { state } from "../core/state.js";
import { escapeHtml } from "../core/helpers.js";

/* Lets the Armory / Spellbook ask "which character?" before adding
   something. `list` narrows the choices (e.g. only spellcasters); the
   modal is skipped entirely when there's only one to choose from. */
export function chooseCharacter(onChoose, list){
  var chars = list || state.characters;
  if(!chars.length) return;
  if(chars.length === 1){ onChoose(chars[0]); return; }

  var modal = document.getElementById("char-picker-modal");
  var body = document.getElementById("char-picker-body");
  body.innerHTML = "";

  chars.forEach(function(c){
    var row = document.createElement("div");
    row.className = "char-picker-row";
    var clsText = (c.classes||[]).map(function(cl){ return (cl.name||"?")+" "+(cl.level||1); }).join(" / ");
    row.innerHTML =
      '<span class="cpr-name">'+escapeHtml(c.name||"Unnamed")+'</span>'+
      '<span class="cpr-meta">'+escapeHtml([c.race, clsText].filter(Boolean).join(" · "))+'</span>';
    row.addEventListener("click", function(){ cleanup(); onChoose(c); });
    body.appendChild(row);
  });

  modal.classList.add("open");

  function cleanup(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", onCancel);
  }
  function onCancel(){ cleanup(); }

  var closeBtn = document.getElementById("char-picker-close");
  closeBtn.addEventListener("click", onCancel);
}
