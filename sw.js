var CACHE_NAME = "vault-and-vellum-v5";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/bootstrap.min.css",
  "./css/base/tokens.css",
  "./css/base/base.css",
  "./css/layout/sidebar.css",
  "./css/components/buttons.css",
  "./css/components/forms.css",
  "./css/components/stat-stepper.css",
  "./css/components/tables.css",
  "./css/layout/main.css",
  "./css/pages/home.css",
  "./css/sheet/identity.css",
  "./css/components/avatar.css",
  "./css/sheet/tabs.css",
  "./css/sheet/abilities.css",
  "./css/sheet/vitals.css",
  "./css/sheet/spells.css",
  "./css/sheet/inventory.css",
  "./css/sheet/journal.css",
  "./css/dice/dice.css",
  "./css/components/modals.css",
  "./css/components/toast.css",
  "./css/components/bottom-sheet.css",
  "./css/sheet/features.css",
  "./css/sheet/information.css",
  "./css/overlays/catalog.css",
  "./css/overlays/wizard.css",
  "./css/sheet/backdrop.css",
  "./js/bootstrap.bundle.min.js",
  "./js/app.js",
  "./js/core/character.js",
  "./js/core/helpers.js",
  "./js/core/state.js",
  "./js/data/abilities-skills.js",
  "./js/data/alignments.js",
  "./js/data/backgrounds.js",
  "./js/data/classes.js",
  "./js/data/feats.js",
  "./js/data/misc.js",
  "./js/data/races.js",
  "./js/dice/dice.js",
  "./js/render/panels/abilities.js",
  "./js/render/panels/feat-picker-modal.js",
  "./js/render/panels/feature-modal.js",
  "./js/render/panels/features.js",
  "./js/render/panels/inventory.js",
  "./js/render/panels/journal.js",
  "./js/render/panels/spells.js",
  "./js/render/panels/vitals.js",
  "./js/render/sheet.js",
  "./js/render/sidebar.js",
  "./js/ui/confirm-modal.js",
  "./js/ui/mobile-nav.js",
  "./js/ui/svg-icons.js",
  "./js/wizard/wizard-core.js",
  "./js/wizard/wizard-steps.js",
  "./images/icon-192.png",
  "./images/icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Network-first for same-origin requests so edits to the HTML/CSS/JS show
   up on the next load; fall back to the cache only when offline. Other
   origins (CDNs, etc.) stay cache-first. */
self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;

  var url = new URL(req.url);
  if(url.protocol !== "http:" && url.protocol !== "https:") return;

  var sameOrigin = url.origin === self.location.origin;

  if(sameOrigin){
    event.respondWith(
      fetch(req).then(function(response){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        return response;
      }).catch(function(){
        return caches.match(req).then(function(cached){
          if(cached) return cached;
          if(req.mode === "navigate") return caches.match("./index.html");
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;
      return fetch(req).then(function(response){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        return response;
      });
    })
  );
});
