import { ce, escapeHtml } from "../core/helpers.js";
import { OPTION_SOURCES } from "../data/class-options.js";
import { availableOptions } from "../core/class-options.js";
import { themedPicker } from "./themed-picker.js";

/* ---------------- Class option pickers ----------------
   One dropdown for a class option set (Metamagic, maneuvers), shared by
   the level-up dialog and the sheet's cards. Only options that can be
   learned now are listed (like invocations), grouped by book; on a phone
   the list opens as a sheet with a line saying what each one does. */
export function renderOptionPicker(opts){
  var set = opts.set;
  var available = availableOptions(set, opts.ctx);
  var groups = {};
  Object.keys(OPTION_SOURCES).forEach(function(src){
    var names = available.filter(function(o){ return o.source===src; }).map(function(o){ return o.name; });
    if(names.length) groups[OPTION_SOURCES[src]] = names;
  });
  var wrap = ce("div", "eli-pick cos-pick");
  var field = ce("div", "field inf-field eli-field");
  field.appendChild(themedPicker({
    key: opts.key, ariaLabel: opts.ariaLabel || set.label, placeholder: "Pick a " + set.noun + "…",
    groups: groups, value: opts.value || "", search: true, sheet: true,
    detailFor: function(v){ var o = set.options.find(function(x){ return x.name===v; }); return o ? optionLine(o) : ""; },
    reasonFor: function(v){ return v!==opts.value && (opts.taken||[]).indexOf(v)!==-1 ? "picked" : ""; },
    onPick: opts.onPick
  }));
  wrap.appendChild(field);
  var picked = available.find(function(o){ return o.name===opts.value; });
  if(picked) wrap.appendChild(optionPreview(picked));
  return wrap;
}
/* "2 sorcery points" / "Strength save" ahead of the text, when there is one. */
export function optionMeta(o){
  var bits = [];
  if(o.cost) bits.push(o.cost==="1" ? "1 sorcery point" : /^\d+$/.test(o.cost) ? o.cost + " sorcery points" : "sorcery points equal to the " + o.cost);
  if(o.save) bits.push({str:"Strength", dex:"Dexterity", con:"Constitution", int:"Intelligence", wis:"Wisdom", cha:"Charisma"}[o.save] + " save");
  return bits.join(" · ");
}
function optionLine(o){
  var meta = optionMeta(o);
  return (meta ? meta + ". " : "") + o.text;
}
export function optionPreview(o){
  var box = ce("div", "inf-preview eli-preview");
  var meta = optionMeta(o);
  box.innerHTML = (meta ? "<div class='inf-goes'><span>" + (o.cost ? "Costs" : "Target makes a") + "</span> " + escapeHtml(meta) + "</div>" : "") +
    "<div class='inf-text'>" + escapeHtml(o.text) + "</div>";
  return box;
}
