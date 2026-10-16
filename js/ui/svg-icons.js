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

/* Warning triangle (Lucide "triangle-alert", ISC license): a rule the
   character is breaking or a roll made at disadvantage (the Inventory's
   equip warnings, Stealth in noisy armor). Replaces the ⚠ character. */
export function makeAlertSvg(){
  return '<svg class="alert-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
}

/* Vertical three-dot "more" icon for overflow menus (Lucide
   "ellipsis-vertical", ISC license). */
export function makeKebabSvg(){
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
}
/* Checkmark for on/off items in menus. */
/* Plus (Lucide "plus"): add something new, e.g. the catalog's + button. */
export function makePlusSvg(){
  return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
}

/* Double check (Lucide "check-check"): something was just added from a
   catalogue. */
export function makeCheckCheckSvg(){
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>';
}

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

/* Open book (Lucide "book-open") and chevron (Lucide "chevron-down") for
   the creation wizard's campaign books tile. */
export function makeBookSvg(){
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>';
}
/* Info (Lucide "info", ISC license): a card whose details open on a tap. */
export function makeInfoSvg(){
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
}
/* Chevron right (Lucide "chevron-right", ISC license): a card that opens more. */
export function makeChevronRightSvg(){
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
}
export function makeChevronDownSvg(){
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
}

/* The Duality coin's two faces (Inventory tab): a filled emblem centred
   on each coin, light on a dark outline so it stands out at any size.
     Angel: "angel-wings" from SVG Repo (svgrepo.com/svg/angel-wings),
       wings under a halo, on gold.
     Demon: "Daemon skull" by Lorc, game-icons.net (CC BY 3.0, credit to
       the author required), on crimson.
   Paths as published (the wings' zero-size leftover pieces dropped). The
   gradients' ids are the same in every copy, which is fine: each copy
   defines them identically. */
var ANGEL_WINGS = {box: 32, d: "M29.734 5.921c-0.805-1.845-2.521-2.832-3.23-2.122l0-0c-0.766 0.767 0.291 1.837 0.364 3.557-7.080 5.271-14.155 6.428-21.245 0.108 0.031-1.784 1.148-2.883 0.367-3.666l0 0c-0.709-0.71-2.425 0.277-3.23 2.122-2.702 6.193-0.598 22.443 5.483 21.96-1.373-3.151-2.733-6.737-3.539-10.529 1.643 4.523 4.513 8.46 7.353 7.5-1.998-2.508-4.121-5.445-5.618-8.757 2.185 3.692 5.326 6.605 7.676 5.335-1.856-1.659-3.841-3.59-5.541-5.82 2.482 2.34 5.454 3.838 7.020 2.34-1.298-0.631-2.703-1.419-4.039-2.338l4.673 2.031 4.275-1.737c-1.203 0.794-2.445 1.48-3.602 2.043 1.566 1.497 4.537 0 7.020-2.34-1.7 2.229-3.685 4.161-5.541 5.82 2.35 1.27 5.491-1.642 7.676-5.335-1.497 3.312-3.62 6.249-5.618 8.757 2.84 0.961 5.71-2.976 7.353-7.5-0.806 3.792-2.166 7.378-3.539 10.529 6.081 0.482 8.184-15.768 5.483-21.96zM16.247 7.439c2.952 0 5.344-1.168 5.344-2.608s-2.393-2.608-5.344-2.608-5.344 1.168-5.344 2.608c0 1.44 2.393 2.608 5.344 2.608zM16.247 2.641c2.183 0 3.953 0.864 3.953 1.929s-1.77 1.929-3.953 1.929-3.953-0.864-3.953-1.929c0-1.065 1.77-1.929 3.953-1.929z"};
var DAEMON_SKULL = {box: 512, d: "M142.026 16.89C94.242 38.888 62.71 74.257 62.71 113.927c0 26.11 13.42 50.288 36.22 70.04-11.664 25.398-18.99 53.91-20.81 84.212 17.194.562 33.53 4.205 48.192 11.7 41.566 21.25 61.083 66.944 57.787 121.093 7.566 1.83 15.284 3.355 23.122 4.58.894-16.76.83-33.468-.496-50.122l18.63-1.485c1.438 18.035 1.466 36.014.458 53.938 8.022.76 16.14 1.21 24.322 1.382v-56.235h18.687v56.13c7.83-.25 15.693-.755 23.565-1.514-.995-17.845-.96-35.745.47-53.7l18.63 1.485c-1.323 16.597-1.39 33.247-.504 49.95 7.307-1.07 14.6-2.355 21.863-3.843-3.467-54.395 16.04-100.333 57.748-121.656 14.66-7.497 30.998-11.142 48.19-11.702-1.843-30.716-9.343-59.594-21.284-85.252 22.08-19.56 35.044-43.346 35.044-69 0-39.67-31.532-75.04-79.316-97.035C386.283 33.46 394.32 53.31 394.32 74.27c0 42.688-31.51 79.614-77.026 97.146l-6.14-14.3c11.148-4.440 21.233-10.197 29.876-16.964 10.1-7.905 18.202-17.087 23.91-27.154-29.85-25.333-66.642-40.283-106.488-40.283-40.34 0-77.554 15.314-107.6 41.223 5.674 9.7 13.588 18.555 23.372 26.214 9.67 7.57 21.145 13.877 33.894 18.49l-6.125 14.264c-47.677-16.863-81.06-54.696-81.06-98.636 0-20.96 8.038-40.81 21.093-57.377zm10.286 183.128c.054-.004.1.004.127.037 18.414 23.35 51.93 39.697 91.086 43.162-5.892 19.698-26.99 34.53-52.67 34.53-30.21 0-55.148-20.584-55.148-45.517.002-12.465 6.205-23.997 16.11-32.173.083.094.33-.027.494-.04zm211.668.002c.053-.003.1.006.138.04 9.907 8.175 16.112 19.707 16.112 32.173 0 24.93-24.937 45.515-55.15 45.515-25.68 0-46.776-14.83-52.67-34.53 39.156-3.466 72.673-19.813 91.087-43.16.112.085.322-.03.483-.038zM258.4 244.174c5.625 27.42 13.928 54.840 32.91 82.26-20.274 5.432-44.818 5.627-65.820 0 17.968-27.420 26.834-54.840 32.910-82.260zm-76.310 175.540c-2.340 15.400-6.413 31.300-12.250 47.372 8.786 5.740 18.037 10.645 27.663 14.637 3.627-19.225 6.537-38.376 8.330-57.455-8.020-1.220-15.944-2.733-23.744-4.553zm152.802.480c-7.480 1.504-14.995 2.807-22.526 3.888 1.777 18.972 4.655 38.015 8.248 57.130 9.192-3.897 18.035-8.630 26.452-14.126-5.776-15.906-9.824-31.644-12.174-46.893zm-41.094 6.115c-8.335.800-16.668 1.323-24.975 1.580v65.694c11.644-.764 23.006-2.806 33.973-6.010-3.898-20.343-7.058-40.766-8.998-61.265zm-69.402.237c-1.953 20.540-5.130 41.002-9.043 61.385 11.227 3.180 22.860 5.146 34.783 5.773v-65.713c-8.642-.172-17.234-.645-25.740-1.445z"};
export function makeCoinFaceSvg(side){
  var demon = side === "demon";
  var rim = demon ? "#f87171" : "#fde68a";
  var groove = demon ? "#1a0508" : "#7a520c";
  var under = demon ? "#2a050d" : "#7a520c";
  var fill = demon ? "#ffd166" : "#fffdf4";
  var icon = demon ? DAEMON_SKULL : ANGEL_WINGS;
  // 24 of the coin's 40 units, centred; the outline is about 1 unit wide.
  var k = 24 / icon.box;
  var outline = (1.1 / k).toFixed(2);
  return '<svg class="coin-face-svg" viewBox="0 0 40 40" aria-hidden="true">' +
    (demon
      ? '<defs><radialGradient id="duality-demon-g" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".45" stop-color="#c0263f"/><stop offset="1" stop-color="#3a0712"/></radialGradient></defs>'
      : '<defs><radialGradient id="duality-angel-g" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".5" stop-color="#f2c650"/><stop offset="1" stop-color="#9a6a12"/></radialGradient></defs>') +
    '<circle cx="20" cy="20" r="19" fill="url(#duality-' + (demon ? "demon" : "angel") + '-g)" stroke="' + rim + '" stroke-width="1.2"/>' +
    '<circle cx="20" cy="20" r="16" fill="none" stroke="' + groove + '" stroke-opacity=".5" stroke-width=".9" stroke-dasharray="1.1 1.5"/>' +
    '<g transform="translate(8 8) scale(' + k + ')" stroke-linejoin="round">' +
    '<path d="' + icon.d + '" fill="' + under + '" stroke="' + under + '" stroke-width="' + outline + '" stroke-opacity=".6"/>' +
    '<path d="' + icon.d + '" fill="' + fill + '"/>' +
    '</g></svg>';
}
