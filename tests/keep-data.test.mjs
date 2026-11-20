/* Asking the browser to keep the saved data (js/core/keep-data.js):
   it asks only when the data isn't kept yet, copes with browsers without
   the API or with one that refuses, and says the right line. */
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { askToKeepData, dataIsKept, keepDataNote, isInstalled } from "../js/core/keep-data.js";

const original = Object.getOwnPropertyDescriptor(navigator, "storage");

/* A navigator.storage stand-in that counts persist() calls. */
function fakeStorage({ kept = false, grant = true, fail = false } = {}){
  const calls = { persist: 0 };
  const storage = {
    persisted: () => fail ? Promise.reject(new Error("no")) : Promise.resolve(kept),
    persist: () => { calls.persist++; if(fail) return Promise.reject(new Error("no")); kept = grant; return Promise.resolve(grant); }
  };
  Object.defineProperty(navigator, "storage", { value: storage, configurable: true });
  return calls;
}
afterEach(() => {
  if(original) Object.defineProperty(navigator, "storage", original);
  else delete navigator.storage;
});

test("data already kept: no question asked", async () => {
  const calls = fakeStorage({ kept: true });
  assert.equal(await askToKeepData(), true);
  assert.equal(calls.persist, 0);
});

test("data not kept: asks once, then never again once granted", async () => {
  const calls = fakeStorage({ kept: false, grant: true });
  assert.equal(await askToKeepData(), true);
  assert.equal(await askToKeepData(), true);
  assert.equal(calls.persist, 1);
});

test("a browser that says no answers false and may be asked later", async () => {
  const calls = fakeStorage({ kept: false, grant: false });
  assert.equal(await askToKeepData(), false);
  assert.equal(await dataIsKept(), false);
  assert.equal(calls.persist, 1);
});

test("no storage API, or one that fails: null, no error", async () => {
  Object.defineProperty(navigator, "storage", { value: undefined, configurable: true });
  assert.equal(await askToKeepData(), null);
  assert.equal(await dataIsKept(), null);
  fakeStorage({ fail: true });
  assert.equal(await askToKeepData(), null);
});

test("Node is not an installed app", () => {
  assert.equal(isInstalled(), false);
});

test("the note: kept, installed, or a browser tab", () => {
  assert.match(keepDataNote(true, false), /kept on this device/);
  assert.match(keepDataNote(false, true), /runs low on space/);
  assert.match(keepDataNote(null, false), /home screen/);
  for(const line of [keepDataNote(true, false), keepDataNote(false, true), keepDataNote(false, false)]){
    assert.ok(!/[–—;]/.test(line), "no long dashes or semicolons: " + line);
    assert.ok(line.length < 160, "short enough for the window");
  }
});
