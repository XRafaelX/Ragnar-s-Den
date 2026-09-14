/* ---------------- SVG icon helpers ---------------- */
/* SVG Helper for Stat Arrow Keys */
export function makeStatArrowSvg(dir){
  var d = dir === "up" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6";
  return '<svg viewBox="0 0 24 24" class="stat-arrow-svg" aria-hidden="true"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
