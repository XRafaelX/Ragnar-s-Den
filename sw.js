var CACHE_NAME = "vault-and-vellum-v16";
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
  "./css/components/themed-picker.css",
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
  "./css/overlays/compendium.css",
  "./css/overlays/wizard.css",
  "./css/sheet/backdrop.css",
  "./css/sheet/levelup.css",
  "./css/components/tutorial.css",
  "./js/bootstrap.bundle.min.js",
  "./js/app.js",
  "./js/core/character.js",
  "./js/core/custom-features.js",
  "./js/core/custom-homebrew.js",
  "./js/core/custom-subclasses.js",
  "./js/core/helpers.js",
  "./js/core/state.js",
  "./js/data/abilities-skills.js",
  "./js/data/alignments.js",
  "./js/data/armor.js",
  "./js/data/backgrounds.js",
  "./js/data/classes.js",
  "./js/data/feats.js",
  "./js/data/infusions.js",
  "./js/data/languages.js",
  "./js/data/misc.js",
  "./js/data/progression.js",
  "./js/data/race-data.js",
  "./js/data/races.js",
  "./js/data/resources.js",
  "./js/data/spells.js",
  "./js/data/weapons.js",
  "./js/dice/dice.js",
  "./js/levelup/levelup.js",
  "./js/levelup/level-row.js",
  "./js/render/armory.js",
  "./js/render/compendium.js",
  "./js/render/home.js",
  "./js/render/panels/abilities.js",
  "./js/render/panels/armor-picker.js",
  "./js/render/panels/feat-picker.js",
  "./js/render/panels/features.js",
  "./js/render/panels/infusions.js",
  "./js/render/panels/information.js",
  "./js/render/panels/inventory.js",
  "./js/render/panels/journal.js",
  "./js/render/panels/spell-picker.js",
  "./js/render/panels/spells.js",
  "./js/render/panels/vitals.js",
  "./js/render/panels/weapon-picker.js",
  "./js/render/sheet.js",
  "./js/render/spellbook.js",
  "./js/render/sidebar.js",
  "./js/ui/avatar-crop.js",
  "./js/ui/avatar.js",
  "./js/ui/backdrop.js",
  "./js/ui/bottom-sheet.js",
  "./js/ui/catalog-picker.js",
  "./js/ui/character-picker.js",
  "./js/ui/confirm-modal.js",
  "./js/ui/info-modal.js",
  "./js/ui/mobile-nav.js",
  "./js/ui/sound.js",
  "./js/ui/svg-icons.js",
  "./js/ui/theme.js",
  "./js/ui/themed-picker.js",
  "./js/ui/toast.js",
  "./js/ui/tutorial.js",
  "./js/wizard/wizard-core.js",
  "./js/wizard/wizard-steps.js",
  "./images/icon-192-maskable.png",
  "./images/icon-192.png",
  "./images/icon-512-maskable.png",
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
