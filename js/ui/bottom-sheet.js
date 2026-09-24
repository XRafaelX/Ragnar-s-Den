var closeCurrent = null;

/* A mobile-style sheet that slides up from the bottom of the screen,
   dimming everything behind it. Tapping the dimmed area (or Escape)
   dismisses it; used for editing an item without leaving the list it
   came from.
   buildFn(body, refresh, close) fills in the content: call refresh() after
   a field changes to redraw the sheet's own content in place (e.g. a
   stepper's value) without re-triggering the open animation, and close()
   to dismiss programmatically (e.g. after deleting the item). */
export function openBottomSheet(buildFn){
  if(closeCurrent) closeCurrent();

  var scrim = document.getElementById("bottom-sheet-scrim");
  var sheet = document.getElementById("bottom-sheet");

  function render(){
    var body = document.getElementById("bottom-sheet-body");
    body.innerHTML = "";
    buildFn(body, render, close);
  }
  render();

  scrim.classList.add("open");
  sheet.classList.add("open");

  function onScrimClick(){ close(); }
  function onKey(e){ if(e.key==="Escape") close(); }
  scrim.addEventListener("click", onScrimClick);
  document.addEventListener("keydown", onKey);

  function close(){
    scrim.classList.remove("open");
    sheet.classList.remove("open");
    scrim.removeEventListener("click", onScrimClick);
    document.removeEventListener("keydown", onKey);
    closeCurrent = null;
  }
  closeCurrent = close;
  return close;
}
