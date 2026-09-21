import { state, getActive } from "../core/state.js";
import { clamp, escapeHtml } from "../core/helpers.js";
import { closeSidebarMobile } from "../ui/mobile-nav.js";
import { buildAvatar } from "../ui/avatar.js";
import { renderAll } from "./sheet.js";

/* ---------------- Rendering: sidebar ---------------- */
export function renderSidebar(){
  var list = document.getElementById("char-list");
  list.innerHTML = "";
  state.characters.forEach(function(c){
    var li = document.createElement("li");
    li.className = c.id===state.activeId ? "active" : "";
    var pct = c.hp.max>0 ? clamp(Math.round((c.hp.current/c.hp.max)*100),0,100) : 0;
    var clsText = (c.classes||[]).map(function(cl){return (cl.name||"?")+" "+(cl.level||1);}).join(" / ");
    var row = document.createElement("div");
    row.className = "char-row";
    row.appendChild(buildAvatar(c, 34, false));
    var info = document.createElement("div");
    info.className = "char-row-info";
    info.innerHTML =
      '<span class="cname">'+escapeHtml(c.name||"Unnamed")+'</span>'+
      '<span class="cmeta">'+escapeHtml(c.race||"—")+' · '+escapeHtml(clsText)+'</span>'+
      '<div class="hp-bar"><div class="hp-fill" style="width:'+pct+'%"></div></div>';
    row.appendChild(info);
    li.appendChild(row);
    li.addEventListener("click", function(){
      state.activeId = c.id;
      state.activeTab = "vitals";
      renderAll();
      closeSidebarMobile();
    });
    list.appendChild(li);
  });
  var titleEl = document.getElementById("tb-title");
  var active = getActive();
  titleEl.textContent = active ? active.name : "Ragnar's Den";
}
