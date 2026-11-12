import { uid } from "./basics.js";

/* ---------------- Map pictures ----------------
   Pictures put under dungeon maps (see `image` in js/core/dungeons.js)
   are big, too big for the few megabytes of localStorage the rest of the
   app lives in, so they are kept in the browser's database (IndexedDB),
   by id. The players' tab is the same site in the same browser, so it
   reads them from there too, and nothing needs sending.

   A picture is shrunk to at most MAX_SIDE pixels on its longest side
   when it is chosen, and saved compressed. Full backups carry them as
   data URLs (dungeonImages), and pictures no map uses any more are
   cleared out (forgetUnusedImages). */

var DB_NAME = "ragnarsDen.mapImages";
var STORE = "images";
var MAX_SIDE = 4096;
var opening = null;

function openDb(){
  if(!opening){
    opening = new Promise(function(resolve, reject){
      if(typeof indexedDB === "undefined"){ reject(new Error("This browser can't store pictures.")); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function(){ req.result.createObjectStore(STORE); };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error); };
    });
    opening.catch(function(){ opening = null; });
  }
  return opening;
}

/* Runs `fn(store)` in a transaction and resolves with its request's
   result once the transaction is done. */
function run(mode, fn){
  return openDb().then(function(db){
    return new Promise(function(resolve, reject){
      var t = db.transaction(STORE, mode);
      var req = fn(t.objectStore(STORE));
      t.oncomplete = function(){ resolve(req ? req.result : undefined); };
      t.onerror = function(){ reject(t.error); };
      t.onabort = function(){ reject(t.error); };
    });
  });
}

export function newImageId(){ return "img-" + uid(); }

export function saveMapImage(id, blob){
  return run("readwrite", function(st){ return st.put(blob, id); });
}

/* The picture's Blob, or null if there is none (or no database). */
export function loadMapImage(id){
  return run("readonly", function(st){ return st.get(id); })
    .then(function(b){ return b || null; }, function(){ return null; });
}

export function deleteMapImage(id){
  return run("readwrite", function(st){ return st.delete(id); }).catch(function(){});
}

export function mapImageIds(){
  return run("readonly", function(st){ return st.getAllKeys(); })
    .then(function(ids){ return ids || []; }, function(){ return []; });
}

/* Deletes every stored picture whose id isn't in `inUse`. */
export function forgetUnusedImages(inUse){
  return mapImageIds().then(function(ids){
    return Promise.all(ids.filter(function(id){ return inUse.indexOf(id) === -1; }).map(deleteMapImage));
  });
}

/* A chosen picture file, shrunk to at most MAX_SIDE pixels and saved as
   WebP (JPEG where WebP can't be made). Resolves with { blob, width,
   height } (the size it was, for guessing its squares) or rejects with
   a message for the DM. */
export function preparePicture(file){
  return new Promise(function(resolve, reject){
    if(!file || !/^image\//.test(file.type)){ reject(new Error("That file isn't a picture. Choose a PNG, JPEG or WebP file.")); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function(){
      var w = img.naturalWidth, h = img.naturalHeight;
      var k = Math.min(1, MAX_SIDE / Math.max(w, h));
      var canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * k));
      canvas.height = Math.max(1, Math.round(h * k));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function(webp){
        if(webp && webp.type === "image/webp"){ resolve({ blob: webp, width: w, height: h }); return; }
        canvas.toBlob(function(jpeg){
          if(jpeg) resolve({ blob: jpeg, width: w, height: h });
          else reject(new Error("Couldn't read that picture."));
        }, "image/jpeg", 0.9);
      }, "image/webp", 0.88);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error("Couldn't read that picture. Try a PNG, JPEG or WebP file.")); };
    img.src = url;
  });
}

/* ---- backups ---- */

/* { id: dataURL } for these picture ids (any missing are left out). */
export function imagesAsDataUrls(ids){
  var out = {};
  return Promise.all(ids.map(function(id){
    return loadMapImage(id).then(function(blob){
      if(!blob) return;
      return new Promise(function(resolve){
        var reader = new FileReader();
        reader.onload = function(){ out[id] = reader.result; resolve(); };
        reader.onerror = function(){ resolve(); };
        reader.readAsDataURL(blob);
      });
    });
  })).then(function(){ return out; });
}

/* Saves pictures from a backup's { id: dataURL }. Resolves with how many. */
export function saveImagesFromDataUrls(map){
  var ids = Object.keys(map || {}).filter(function(id){ return typeof map[id] === "string" && /^data:image\//.test(map[id]); });
  return Promise.all(ids.map(function(id){
    return fetch(map[id]).then(function(r){ return r.blob(); }).then(function(blob){ return saveMapImage(id, blob); }).catch(function(){});
  })).then(function(){ return ids.length; });
}
