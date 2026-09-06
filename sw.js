var CACHE_NAME = "vault-and-vellum-v3";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/bootstrap.min.css",
  "./css/style.css",
  "./js/bootstrap.bundle.min.js",
  "./js/script.js",
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

  var sameOrigin = new URL(req.url).origin === self.location.origin;

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
