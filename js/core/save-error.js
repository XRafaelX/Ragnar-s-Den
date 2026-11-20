/* ---------------- Saves that fail ----------------
   Every store of the player's data (characters, homebrew, encounters,
   dungeons) writes to localStorage, which can refuse: when it's full
   (photos and banners take the most room) or when the browser blocks
   site data (some private windows). The store then calls
   reportSaveError, and the screen that registered with onSaveError
   tells the player (js/ui/save-error.js). Core code shows nothing itself. */

var handler = null;

export function onSaveError(fn){ handler = fn; }

/* True when the browser refused because its storage is full. */
export function isQuotaError(e){
  if(!e) return false;
  return e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    e.code === 22 || e.code === 1014;
}

export function reportSaveError(e){
  if(typeof console !== "undefined") console.warn("Could not save:", e);
  if(handler){
    try{ handler(isQuotaError(e)); }catch(err){ console.error(err); }
  }
}
