/* Character pictures in the browser's database (js/core/picture-store.js),
   with a small IndexedDB stand-in (Node has none). A picture leaves the
   saved entry only once it is stored, comes back on load, a changed or
   removed picture follows, a deleted character's pictures go, a
   database that fails keeps pictures in the entry, and the save path
   (state.js) writes the short form. */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { storedForm, syncPictures, takeMarkers, loadPictures, clearMarkers, resetPictureStore, STORED } from "../js/core/picture-store.js";

/* ---- IndexedDB stand-in: one database, one store, async like the real one ---- */
function fakeIndexedDB({ failOpen = false, failWrites = false } = {}){
  const data = new Map();
  const later = (fn) => setTimeout(fn, 0);
  function transaction(){
    const t = { oncomplete: null, onerror: null, onabort: null };
    const req = (fn) => { const r = { result: undefined }; later(() => { try{ r.result = fn(); later(() => t.oncomplete && t.oncomplete()); }catch(e){ t.error = e; later(() => t.onerror && t.onerror()); } }); return r; };
    t.objectStore = () => ({
      put: (v, k) => req(() => { if(failWrites) throw new Error("full"); data.set(k, v); }),
      get: (k) => req(() => data.get(k)),
      delete: (k) => req(() => { data.delete(k); }),
      getAllKeys: () => req(() => [...data.keys()])
    });
    return t;
  }
  return {
    data,
    open(){
      const r = { result: null, error: null };
      later(() => {
        if(failOpen){ r.error = new Error("blocked"); r.onerror && r.onerror(); return; }
        r.result = { transaction, createObjectStore(){} };
        r.onupgradeneeded && r.onupgradeneeded();
        r.onsuccess && r.onsuccess();
      });
      return r;
    }
  };
}
const settle = () => new Promise((r) => setTimeout(r, 80));
/* Waits until `ok()` holds (the stand-in works through timers, so a busy
   machine can take longer than any fixed wait), then a little more so a
   second, unwanted call would show. Fails after 3 s. */
async function until(ok, what){
  const end = Date.now() + 3000;
  while(!ok()){
    if(Date.now() > end) assert.fail("timed out waiting: " + what);
    await new Promise((r) => setTimeout(r, 5));
  }
  await new Promise((r) => setTimeout(r, 60));
}
const PIC_A = "data:image/jpeg;base64," + "A".repeat(4000);
const PIC_B = "data:image/jpeg;base64," + "B".repeat(4000);
const PIC_C = "data:image/jpeg;base64," + "C".repeat(3000);
const char = (id, extra = {}) => Object.assign({ id, name: id, avatar: null, backdrop: null, companions: {} }, extra);

let db;
beforeEach(() => { resetPictureStore(); db = fakeIndexedDB(); globalThis.indexedDB = db; });
afterEach(() => { delete globalThis.indexedDB; resetPictureStore(); });

test("a picture stays in the entry until it is stored, then leaves it", async () => {
  const c = char("c1", { avatar: PIC_A, backdrop: PIC_B, companions: { mount: { image: PIC_C, name: "Shadowfax" } } });
  assert.equal(storedForm([c])[0], c, "nothing stored yet: the same object, pictures in the entry");
  let again = 0;
  syncPictures([c], () => again++);
  await until(() => again > 0, "the save after storing");
  assert.equal(db.data.get("c1/avatar"), PIC_A);
  assert.equal(db.data.get("c1/backdrop"), PIC_B);
  assert.equal(db.data.get("c1/companion/mount"), PIC_C);
  assert.equal(again, 1, "one more save once stored (not one per picture)");
  const out = storedForm([c])[0];
  assert.equal(out.avatar, STORED);
  assert.equal(out.backdrop, STORED);
  assert.equal(out.companions.mount.image, STORED);
  assert.equal(out.companions.mount.name, "Shadowfax");
  assert.equal(c.avatar, PIC_A, "the character in memory keeps its pictures");
  assert.equal(c.companions.mount.image, PIC_C);
  assert.ok(JSON.stringify(out).length < 600, "the saved entry is small");
});

test("load: STORED is empty until read back, then the picture returns", async () => {
  const c = char("c1", { avatar: PIC_A, companions: { mount: { image: PIC_C } } });
  syncPictures([c]); await until(() => storedForm([c])[0].companions.mount.image === STORED && storedForm([c])[0].avatar === STORED, "both stored");
  const saved = JSON.parse(JSON.stringify(storedForm([c])));
  resetPictureStore();                      // a new session
  takeMarkers(saved);
  assert.equal(saved[0].avatar, null, "never a marker on screen");
  assert.equal(saved[0].companions.mount.image, null);
  assert.equal(storedForm(saved)[0].avatar, STORED, "a save before they load keeps them");
  const changed = await loadPictures(() => saved);
  assert.equal(changed, true);
  assert.equal(saved[0].avatar, PIC_A);
  assert.equal(saved[0].companions.mount.image, PIC_C);
  assert.equal(storedForm(saved)[0].avatar, STORED);
});

test("a changed picture goes back in the entry until the new one is stored", async () => {
  const c = char("c1", { avatar: PIC_A });
  syncPictures([c]); await until(() => storedForm([c])[0].avatar === STORED, "first picture stored");
  c.avatar = PIC_B;
  assert.equal(storedForm([c])[0].avatar, PIC_B, "the new picture is saved in the entry first");
  syncPictures([c]); await until(() => storedForm([c])[0].avatar === STORED, "new picture stored");
  assert.equal(db.data.get("c1/avatar"), PIC_B);
  assert.equal(storedForm([c])[0].avatar, STORED);
});

test("a removed picture and a deleted character's pictures are deleted", async () => {
  const a = char("a", { avatar: PIC_A, backdrop: PIC_B }), b = char("b", { avatar: PIC_C });
  syncPictures([a, b]); await until(() => db.data.size === 3, "three pictures stored");
  a.backdrop = null;
  assert.equal(storedForm([a])[0].backdrop, null, "removed: null in the entry");
  syncPictures([a]); await until(() => db.data.size === 1, "two deleted");       // b deleted
  assert.deepEqual([...db.data.keys()].sort(), ["a/avatar"]);
});

test("loading moves pictures still in the entry and clears pictures nobody uses", async () => {
  db.data.set("gone/avatar", PIC_C);       // left by a character deleted mid-save
  const c = char("c1", { backdrop: PIC_B });   // an older save: the picture in the entry
  takeMarkers([c]);
  let again = 0;
  await loadPictures(() => [c], () => again++);
  await until(() => again > 0, "the save after moving it");
  assert.equal(db.data.get("c1/backdrop"), PIC_B, "moved into the database");
  assert.ok(!db.data.has("gone/avatar"), "the unused picture is cleared");
  assert.equal(again, 1, "then saved so the entry drops it");
  assert.equal(storedForm([c])[0].backdrop, STORED);
});

test("a picture another tab just stored isn't cleared", async () => {
  db.data.set("other/avatar", PIC_A);
  localStorage.setItem("ragnarsDen.characters.v1", JSON.stringify([char("other", { avatar: STORED })]));
  await loadPictures(() => []);
  await settle();
  assert.ok(db.data.has("other/avatar"));
  localStorage.removeItem("ragnarsDen.characters.v1");
});

test("a database that can't open or write keeps pictures in the entry", async () => {
  globalThis.indexedDB = fakeIndexedDB({ failOpen: true });
  const c = char("c1", { avatar: PIC_A });
  syncPictures([c]); await settle();
  assert.equal(storedForm([c])[0].avatar, PIC_A);
  resetPictureStore();
  globalThis.indexedDB = fakeIndexedDB({ failWrites: true });
  syncPictures([c]); await settle();
  assert.equal(storedForm([c])[0].avatar, PIC_A);
  delete globalThis.indexedDB; resetPictureStore();
  assert.equal(storedForm([c])[0], c, "no database at all: as before");
});

test("an imported STORED that can't be read back shows no picture", () => {
  const c = char("x", { avatar: STORED, companions: { mount: { image: STORED } } });
  clearMarkers(c);
  assert.equal(c.avatar, null);
  assert.equal(c.companions.mount.image, null);
});

test("the app's save and load: the entry holds markers, memory keeps pictures", async () => {
  const { state, save, load } = await import("../js/core/state.js");
  const keep = state.characters;
  const c = char("s1", { avatar: PIC_A, backdrop: PIC_B });
  state.characters = [c];
  save();
  const entry = () => localStorage.getItem("ragnarsDen.characters.v1");
  assert.ok(entry().includes(PIC_A), "first save: the picture is in the entry until stored");
  await until(() => !entry().includes("data:image"), "the save that drops the pictures");
  assert.equal(JSON.parse(entry())[0].avatar, STORED);
  assert.ok(entry().length < 1000, "the entry is small: " + entry().length);
  assert.equal(c.avatar, PIC_A, "memory keeps the picture");
  load();
  assert.equal(state.characters[0].avatar, null, "a load shows no marker");
  const changed = await loadPictures(() => state.characters);
  assert.equal(changed, true);
  assert.equal(state.characters[0].backdrop, PIC_B, "and the picture comes back");
  state.characters = keep;
  localStorage.removeItem("ragnarsDen.characters.v1");
});
