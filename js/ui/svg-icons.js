/* ---------------- SVG icon helpers ---------------- */
/* SVG Helper for Stat Arrow Keys */
export function makeStatArrowSvg(dir){
  var d = dir === "up" ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6";
  return '<svg viewBox="0 0 24 24" class="stat-arrow-svg" aria-hidden="true"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/* Dice icons for buttons; replace the 🎲 emoji, which renders differently
   per OS and ignores the theme. Stroke is currentColor, so they follow the
   text color. makeDiceSvg is a single die (one roll or pick); makeDicesSvg
   is a pair (rolling several dice, the dice tool itself). */
export function makeDiceSvg(){
  return '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M16 12h.01"/><path d="M16 16h.01"/><path d="M8 8h.01"/><path d="M8 12h.01"/><path d="M8 16h.01"/></svg>';
}
export function makeDicesSvg(){
  return '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/></svg>';
}

/* Vertical three-dot "more" icon for overflow menus (Lucide
   "ellipsis-vertical", ISC license). */
export function makeKebabSvg(){
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
}
/* Checkmark for on/off items in menus. */
export function makeCheckSvg(){
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
}

/* Level up (arrow up) and undo (curved back arrow) for the XP strip.
   Same stroke style as the dice icons; shown next to their text labels. */
export function makeLevelUpSvg(){
  return '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
}
export function makeUndoSvg(){
  return '<svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>';
}

/* Back / Next arrows for the wizard and level-up footers (Lucide
   "move-left" / "move-right", ISC license). */
export function makeMoveLeftSvg(){
  return '<svg class="btn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8L2 12L6 16"/><path d="M2 12H22"/></svg>';
}
export function makeMoveRightSvg(){
  return '<svg class="btn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8L22 12L18 16"/><path d="M2 12H22"/></svg>';
}
