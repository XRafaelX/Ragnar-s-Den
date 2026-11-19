import { escapeHtml } from "../core/helpers.js";
import { makeStatArrowSvg } from "./svg-icons.js";

/* ---------------- Card parts ----------------
   Small pieces shared by the Features tab's choice cards (infusions,
   invocations, class options): a "known / allowed" meter with pips, a
   section title and a hint line. Styles: css/sheet/features.css (inf-*).
   Also the − value + stepper of the Vitals tab's boxes. */

/* A − value + stepper: arrows named "Decrease <name>" and "Increase
   <name>" around the value. opts: {cls (more classes on it), value,
   valueCls, valueTitle, downDisabled, onDown, onUp}. A tap on an arrow
   doesn't reach the box under it (the initiative box rolls on a tap). */
export function stepper(name, opts){
  var wrap = document.createElement("div");
  wrap.className = "stat-stepper" + (opts.cls ? " " + opts.cls : "");
  function arrow(dir, fn){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "stat-arrow-btn stat-arrow-" + dir;
    b.title = (dir==="down" ? "Decrease " : "Increase ") + name;
    b.setAttribute("aria-label", b.title);
    b.innerHTML = makeStatArrowSvg(dir);
    b.addEventListener("click", function(e){ e.stopPropagation(); fn(); });
    return b;
  }
  var down = arrow("down", opts.onDown);
  if(opts.downDisabled) down.disabled = true;
  var val = document.createElement("span");
  val.className = "stat-score-val" + (opts.valueCls ? " " + opts.valueCls : "");
  val.textContent = opts.value;
  if(opts.valueTitle) val.title = opts.valueTitle;
  wrap.appendChild(down);
  wrap.appendChild(val);
  wrap.appendChild(arrow("up", opts.onUp));
  return wrap;
}
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
