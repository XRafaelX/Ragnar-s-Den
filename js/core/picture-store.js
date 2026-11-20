/* ---------------- Character pictures ----------------
   A character's photo, banner and companion pictures are data URLs of
   15 to 250 KB each, ten times the rest of the character. Kept inside
   the characters' localStorage entry they filled its few megabytes after
   a dozen characters, and every save (every tap) wrote them all again.
   So they live in the browser's database (IndexedDB) instead, by
   "<character id>/<slot>", and the saved character holds STORED in
   their place.

   In memory nothing changes: c.avatar, c.backdrop and a companion's
   image stay data URLs, so drawing them and backups work as before.
   - storedForm(chars) is what save() writes: a picture becomes STORED
     only once it is safely in the database, so a closed tab never loses
     one (until then it stays in the entry, as it always did).
   - syncPictures(chars, again) runs after each save: it writes new or
     changed pictures, deletes ones no character uses, and calls again()
     (save) once something was stored, so the entry drops it.
   - takeMarkers(chars) runs on load: STORED becomes null until
     loadPictures() reads the pictures back.
   Without a database (tests in Node, some private windows) pictures
   simply stay in the entry. */

var DB_NAME = "ragnarsDen.pictures";
var STORE = "pictures";
export var STORED = "@stored-picture";

var opening = null, broken = false;
var stored = {};     // key -> the data URL known to be in the database
var unloaded = {};   // key -> true: STORED on load and not read back yet
var writing = {};    // key -> the data URL being written now
var againTimer = null;

function openDb(){
  if(!opening){
    opening = new Promise(function(resolve, reject){
      if(broken || typeof indexedDB === "undefined"){ reject(new Error("no database")); return; }
      var req;
      try{ req = indexedDB.open(DB_NAME, 1); }catch(e){ reject(e); return; }
      req.onupgradeneeded = function(){ req.result.createObjectStore(STORE); };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror = function(){ reject(req.error); };
    });
    opening.catch(function(){ broken = true; });
  }
  return opening;
}

/* Runs `fn(store)` in a transaction, resolving with its request's result
   once the transaction is done. */
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

function usable(){ return !broken && typeof indexedDB !== "undefined"; }

/* A character's picture slots: {key, obj, field, comp}. */
function slots(c){
  var out = [
    {key: c.id + "/avatar", obj: c, field: "avatar"},
    {key: c.id + "/backdrop", obj: c, field: "backdrop"}
  ];
  if(c.companions && typeof c.companions === "object"){
    Object.keys(c.companions).forEach(function(id){
      var st = c.companions[id];
      if(st && typeof st === "object") out.push({key: c.id + "/companion/" + id, obj: st, field: "image", comp: id});
    });
  }
  return out;
}

function isPicture(v){ return typeof v === "string" && v !== "" && v !== STORED; }

/* The characters as save() writes them. Copies only the characters (and
   companion entries) that change; the rest are the same objects. */
export function storedForm(chars){
  if(!usable()) return chars;
  return chars.map(function(c){
    var copy = null;
    slots(c).forEach(function(s){
      var v = s.obj[s.field];
      var keep = (isPicture(v) && stored[s.key] === v) || (!v && unloaded[s.key]);
      if(!keep) return;
      if(!copy) copy = Object.assign({}, c);
      if(!s.comp){ copy[s.field] = STORED; return; }
      if(copy.companions === c.companions) copy.companions = Object.assign({}, c.companions);
      copy.companions[s.comp] = Object.assign({}, c.companions[s.comp], {image: STORED});
    });
    return copy || c;
  });
}

function callAgain(again){
  if(againTimer || typeof again !== "function") return;
  againTimer = setTimeout(function(){ againTimer = null; again(); }, 30);
}

/* After a save: store new pictures, drop unused ones. */
export function syncPictures(chars, again){
  if(!usable()) return;
  var want = {};
  chars.forEach(function(c){
    slots(c).forEach(function(s){
      var v = s.obj[s.field];
      if(isPicture(v)) want[s.key] = v;
      else if(unloaded[s.key]) want[s.key] = null;   // still to be read back: keep it
    });
  });
  Object.keys(want).forEach(function(key){
    var v = want[key];
    if(!v || stored[key] === v || writing[key] === v) return;
    writing[key] = v;
    run("readwrite", function(st){ return st.put(v, key); }).then(function(){
      if(writing[key] === v) delete writing[key];
      stored[key] = v;
      callAgain(again);
    }, function(){
      if(writing[key] === v) delete writing[key];   // stays in the entry
    });
  });
  Object.keys(stored).forEach(function(key){
    if(key in want) return;
    delete stored[key];
    run("readwrite", function(st){ return st.delete(key); }).catch(function(){});
  });
}

/* On load: STORED slots become empty until their pictures are read. */
export function takeMarkers(chars){
  chars.forEach(function(c){
    if(!c || typeof c !== "object" || !c.id) return;
    slots(c).forEach(function(s){
      if(s.obj[s.field] !== STORED) return;
      s.obj[s.field] = null;
      unloaded[s.key] = true;
    });
  });
}

/* A STORED that can't be read back (a character imported from a file
   that somehow holds one) shows no picture rather than a broken one. */
export function clearMarkers(c){
  slots(c).forEach(function(s){
    if(s.obj[s.field] === STORED && !unloaded[s.key]) s.obj[s.field] = null;
  });
}

/* Reads the pictures back into the characters `allChars()` returns, then
   moves any picture still in the entry into the database and clears
   out pictures nothing refers to. Resolves true when a picture was
   put on a character (the screen should be drawn again). */
export function loadPictures(allChars, again){
  if(!usable()) return Promise.resolve(false);
  var keys = Object.keys(unloaded);
  return Promise.all(keys.map(function(key){
    return run("readonly", function(st){ return st.get(key); }).then(function(v){
      return {key: key, v: v, ok: true};
    }, function(){ return {key: key, ok: false}; });
  })).then(function(found){
    var changed = false, byKey = {};
    allChars().forEach(function(c){ slots(c).forEach(function(s){ byKey[s.key] = s; }); });
    found.forEach(function(f){
      if(!f.ok) return;                       // try again next time
      delete unloaded[f.key];
      var s = byKey[f.key];
      if(!isPicture(f.v) || !s || s.obj[s.field]) return;
      s.obj[s.field] = f.v;
      stored[f.key] = f.v;
      changed = true;
    });
    syncPictures(allChars(), again);          // pictures still in the entry move now
    return forgetUnused().then(function(){ return changed; }, function(){ return changed; });
  }, function(){ return false; });
}

/* Deletes database pictures nothing refers to: not in memory, not being
   written, and not STORED in the saved entry as it is right now (another
   tab may have just saved one). */
function forgetUnused(){
  return run("readonly", function(st){ return st.getAllKeys(); }).then(function(keys){
    var inEntry = {};
    try{
      var saved = JSON.parse(localStorage.getItem("ragnarsDen.characters.v1") || "[]");
      (Array.isArray(saved) ? saved : []).forEach(function(c){
        if(c && c.id) slots(c).forEach(function(s){ if(s.obj[s.field] === STORED) inEntry[s.key] = true; });
      });
    }catch(e){ return; }
    return Promise.all((keys || []).filter(function(k){
      return !inEntry[k] && !stored[k] && !writing[k] && !unloaded[k];
    }).map(function(k){
      return run("readwrite", function(st){ return st.delete(k); }).catch(function(){});
    }));
  });
}

/* For tests: forget what this session knows. */
export function resetPictureStore(){
  stored = {}; unloaded = {}; writing = {}; opening = null; broken = false;
  if(againTimer){ clearTimeout(againTimer); againTimer = null; }
}
