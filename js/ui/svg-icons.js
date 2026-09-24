/* ---------------- SVG icon helpers ---------------- */
/* SVG Helper for Stat Arrow Keys */
export function makeStatArrowSvg(dir){
  var d = dir === "up" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6";
  return '<svg viewBox="0 0 24 24" class="stat-arrow-svg" aria-hidden="true"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/* Dice icons for buttons — replace the 🎲 emoji, which renders differently
   per OS and ignores the theme. Stroke is currentColor, so they follow the
   text color. makeDiceSvg is a single die (one roll or pick); makeDicesSvg
   is a pair (rolling several dice, the dice tool itself). */
export function makeDiceSvg(){
  return '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M16 12h.01"/><path d="M16 16h.01"/><path d="M8 8h.01"/><path d="M8 12h.01"/><path d="M8 16h.01"/></svg>';
}
export function makeDicesSvg(){
  return '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/></svg>';
}
