/* Registers the service worker and offers new releases to the user.

   Every commit that touches app files gives sw.js a new BUILD id (see
   .githooks/pre-commit). The browser spots the changed worker, installs it
   in the background and leaves it waiting; we then show a banner. Tapping
   "Update" tells the waiting worker to take over, and the controllerchange
   handler reloads onto the new files. If the user ignores it, the update
   applies by itself the next time the app is fully closed and reopened. */

var CHECK_EVERY_MS = 30 * 60 * 1000;
var MIN_CHECK_GAP_MS = 60 * 1000;
var updateRequested = false;

export function setupUpdates(){
  if(!("serviceWorker" in navigator)) return;

  // Reload when a worker replaces an existing one, or when the user asked
  // for the update. On the very first install the worker also claims the
  // page, and that alone needs no reload.
  var hadController = !!navigator.serviceWorker.controller;
  var reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", function(){
    if(reloading || !(hadController || updateRequested)) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("sw.js").then(function(reg){
    if(reg.waiting && navigator.serviceWorker.controller) showBanner(reg.waiting);

    reg.addEventListener("updatefound", function(){
      var worker = reg.installing;
      if(!worker) return;
      worker.addEventListener("statechange", function(){
        if(worker.state === "installed" && navigator.serviceWorker.controller) showBanner(worker);
      });
    });

    // Browsers only look for a new sw.js on navigation, and an installed
    // app is often resumed rather than reloaded, so also check when the app
    // comes back to the foreground and on a timer while it stays open.
    var lastCheck = Date.now();
    function check(){
      if(Date.now() - lastCheck < MIN_CHECK_GAP_MS) return;
      lastCheck = Date.now();
      reg.update().catch(function(){ /* offline, try again later */ });
    }
    document.addEventListener("visibilitychange", function(){
      if(document.visibilityState !== "visible") return;
      if(reg.waiting) showBanner(reg.waiting);
      check();
    });
    setInterval(check, CHECK_EVERY_MS);
  }).catch(function(){ /* offline-first, fine if this fails */ });
}

function showBanner(worker){
  var banner = document.getElementById("update-banner");
  if(!banner) return;
  var applyBtn = document.getElementById("update-apply-btn");
  var laterBtn = document.getElementById("update-later-btn");

  applyBtn.disabled = false;
  applyBtn.textContent = "Update";
  applyBtn.onclick = function(){
    applyBtn.disabled = true;
    applyBtn.textContent = "Updating...";
    updateRequested = true;
    worker.postMessage({type:"SKIP_WAITING"});
  };
  laterBtn.onclick = function(){ banner.classList.remove("show"); };

  banner.classList.add("show");
}
