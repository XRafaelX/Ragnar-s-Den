import { escapeHtml } from "../core/helpers.js";

/* ---------------- Card parts ----------------
   Small pieces shared by the Features tab's choice cards (infusions,
   invocations, class options): a "known / allowed" meter with pips, a
   section title and a hint line. Styles: css/sheet/features.css (inf-*). */
export function meter(label, count, max, sub){
  var box = document.createElement("div");
  box.className = "inf-meter"+(count>max ? " over" : "");
  var top = document.createElement("div");
  top.className = "inf-meter-top";
  top.innerHTML = "<span class='inf-meter-lbl'>"+escapeHtml(label)+"</span><span class='inf-meter-val'><b>"+count+"</b> of "+max+"</span>";
  box.appendChild(top);
  var pips = document.createElement("div");
  pips.className = "inf-pips";
  for(var i=0;i<Math.max(count, max);i++){
    var pip = document.createElement("span");
    pip.className = "inf-pip"+(i<count ? " full" : "");
    pips.appendChild(pip);
  }
  box.appendChild(pips);
  var s = document.createElement("div");
  s.className = "inf-meter-sub";
  s.textContent = sub;
  box.appendChild(s);
  return box;
}
export function sectionTitle(text){
  var p = document.createElement("p");
  p.className = "inf-section";
  p.textContent = text;
  return p;
}
export function hint(text){
  var p = document.createElement("p");
  p.className = "inf-hint";
  p.textContent = text;
  return p;
}
