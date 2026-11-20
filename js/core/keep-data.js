/* ---------------- Keeping saved data ----------------
   Browsers may clear a site's saved data by themselves: when the device
   runs short of space, and Safari after seven days of use without a
   visit to the site (an app added to the home screen counts its own
   days). A site can ask to be kept ("persistent storage"). Chrome and
   Safari answer by themselves and say yes to an installed app, while
   Firefox asks the player. So the app only asks after something the
   player did (creating or importing a character, opening Import &
   Export) or when it runs installed, and never asks again once kept. */

function storageApi(){
  var nav = typeof navigator !== "undefined" ? navigator : null;
  var st = nav && nav.storage;
  return st && typeof st.persisted === "function" && typeof st.persist === "function" ? st : null;
}

/* True when the app runs from the home screen or as an installed app. */
export function isInstalled(){
  try{
    if(typeof navigator !== "undefined" && navigator.standalone === true) return true;   // Safari on iPhone
    return typeof window !== "undefined" && typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches;
  }catch(e){ return false; }
}

/* Resolves true when the browser keeps the data, false when it may clear
   it, null when the browser can't say. Never asks. */
export function dataIsKept(){
  var st = storageApi();
  if(!st) return Promise.resolve(null);
  return st.persisted().then(function(kept){ return !!kept; }, function(){ return null; });
}

/* Asks the browser to keep the data unless it already does. Resolves
   like dataIsKept with the answer. */
export function askToKeepData(){
  var st = storageApi();
  if(!st) return Promise.resolve(null);
  return dataIsKept().then(function(kept){
    if(kept) return true;
    return st.persist().then(function(ok){ return !!ok; }, function(){ return kept; });
  });
}

/* The Import & Export window's line about it. */
export function keepDataNote(kept, installed){
  if(kept) return "Your characters are kept on this device. The browser won't clear them by itself.";
  if(installed) return "Your browser may clear saved characters if the device runs low on space. Export a backup now and then to keep them safe.";
  return "Your browser may clear saved characters if the app goes unused for a while. Add the app to your home screen or export a backup to keep them safe.";
}
