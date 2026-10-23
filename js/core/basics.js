/* ---------------- Basics ----------------
   Small tools the whole app shares: ids, ability modifiers, levels, DOM
   and text helpers, and the wizard's scroll memory. */
import { HIT_DICE_BY_CLASS } from "../data/abilities-skills.js";

export function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
export function mod(score){ return Math.floor((Number(score||10)-10)/2); }
export function fmtMod(n){ return (n>=0?"+":"")+n; }
export function totalLevel(c){ return (c.classes||[]).reduce(function(a,cl){return a+(Number(cl.level)||0);},0) || 1; }
export function profBonus(c){ return Math.floor((totalLevel(c)-1)/4)+2; }
export function primaryHitDie(c){
  var cl = (c.classes||[])[0];
  if(!cl) return 8;
  return HIT_DICE_BY_CLASS[cl.name] || 8;
}
export function parseDiceNotation(str){
  var m2 = /^(\d*)d(\d+)$/i.exec((str||"").trim());
  if(!m2) return null;
  return { qty: Number(m2[1])||1, die: Number(m2[2]) };
}

/* Several reasons to roll with advantage or disadvantage: any of each
   cancel out (one die, as the rules say). {mode, reason}. */
export function combineRolls(list){
  list = list.filter(function(r){ return r && r.mode!=="none"; });
  var adv = list.filter(function(r){ return r.mode==="adv"; }), dis = list.filter(function(r){ return r.mode==="dis"; });
  if(adv.length && dis.length) return {mode: "none", reason: "Advantage and disadvantage cancel out (" + list.map(function(r){ return r.reason; }).join(" · ") + ")"};
  var on = adv.length ? adv : dis;
  return on.length ? {mode: on[0].mode, reason: on.map(function(r){ return r.reason; }).join(" · ")} : {mode: "none", reason: ""};
}
/* The creation wizard and level-up rebuild the whole overlay on every
   tap, which snaps #wizard-body back to the top. Call before clearing the
   overlay with a key for the current view (flow + step): if it's the same
   view as last render, its scroll is returned so wizardScrollRestore can
   put it back; a new step starts at the top. */
export function wizardScrollSave(viewKey){
  var overlay = document.getElementById("wizard-overlay");
  var body = document.getElementById("wizard-body");
  var keep = body && overlay.dataset.view===viewKey ? body.scrollTop : null;
  overlay.dataset.view = viewKey;
  return keep;
}
export function wizardScrollRestore(keep){
  var body = document.getElementById("wizard-body");
  if(body && keep!=null) body.scrollTop = keep;
}
/* Forget the last view when a flow opens, so it starts at the top even
   on the same step the previous run ended on. */
export function wizardScrollReset(){
  document.getElementById("wizard-overlay").dataset.view = "";
}
export function clamp(n,lo,hi){ return Math.max(lo,Math.min(hi,n)); }
export function ce(tag, cls){ var e = document.createElement(tag); if(cls) e.className = cls; return e; }
export function escapeHtml(s){
  return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
export function ordinal(n){ var s=n%100; var t=s>=11&&s<=13?"th":[,"st","nd","rd"][n%10]||"th"; return n+t; }
export function nowStamp(){
  var d = new Date();
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})+" · "+d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}
/* Export file name: local date and time, then the app version, e.g.
   ragnars-den-backup_2026-10-19_2145_v2.0.0.json. Sorts by time and never
   repeats within a minute. */
export function backupFileName(d, version){
  function p(n){ return String(n).padStart(2,"0"); }
  return "ragnars-den-backup_"+d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes())+"_v"+version+".json";
}
