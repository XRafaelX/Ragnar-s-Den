import { state } from "../core/state.js";
import { escapeHtml } from "../core/helpers.js";

/* Lets the Armory ask "which character?" before adding an item.
   Skips the modal entirely when there's only one character to choose from. */
export function chooseCharacter(onChoose){
  var chars = state.characters;
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
