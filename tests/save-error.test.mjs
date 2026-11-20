/* A save the browser refuses (js/core/save-error.js): the store reports
   it, whether the browser is full or blocks saving, instead of a bare
   alert, and every store of the player's data does so. The words the
   player reads are plain (js/ui/save-error.js). */
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { onSaveError, isQuotaError } from "../js/core/save-error.js";
import { state, save } from "../js/core/state.js";
import { createEncounter } from "../js/core/encounters.js";
import { saveErrorText, saveErrorToast } from "../js/ui/save-error.js";

const realSet = localStorage.setItem;
console.warn = () => {};   // each refused save logs a warning: expected here
function refuse(err){
  localStorage.setItem = (k) => { if(!/backupStatus/.test(k)) throw err; };
}
function quota(){ const e = new Error("full"); e.name = "QuotaExceededError"; e.code = 22; return e; }
afterEach(() => { localStorage.setItem = realSet; onSaveError(null); });

test("a full browser is told apart from a blocked one", () => {
  assert.equal(isQuotaError(quota()), true);
  assert.equal(isQuotaError({ name: "NS_ERROR_DOM_QUOTA_REACHED" }), true);
  assert.equal(isQuotaError({ code: 1014 }), true);
  assert.equal(isQuotaError(new Error("SecurityError")), false);
  assert.equal(isQuotaError(null), false);
});

test("saving characters into a full browser reports it, no alert, no throw", () => {
  const seen = [];
  onSaveError((full) => seen.push(full));
  refuse(quota());
  save();
  assert.deepEqual(seen, [true]);
  const blocked = new Error("blocked"); blocked.name = "SecurityError";
  refuse(blocked);
  save();
  assert.deepEqual(seen, [true, false]);
});

test("the DM's stores report too", () => {
  const seen = [];
  onSaveError((full) => seen.push(full));
  refuse(quota());
  createEncounter("Ambush");
  assert.deepEqual(seen, [true]);
});

test("with nothing registered a refused save is quiet", () => {
  refuse(quota());
  assert.doesNotThrow(() => save());
});

test("every store of the player's data reports, none alerts", () => {
  const stores = ["state", "dungeons", "encounters", "custom-subclasses", "custom-monsters", "custom-features",
    "custom-homebrew", "custom-spells", "custom-items"];
  for(const f of stores){
    const src = fs.readFileSync(new URL("../js/core/" + f + ".js", import.meta.url), "utf8");
    assert.ok(/reportSaveError\(e\)/.test(src), f + " reports its failure");
    assert.ok(!/alert\(/.test(src), f + " has no alert");
  }
});

test("the words: plain, and saying what to do", () => {
  assert.match(saveErrorText(true), /space for this app is full/);
  assert.match(saveErrorText(true), /Export a backup now/);
  assert.match(saveErrorText(false), /private window/);
  for(const t of [saveErrorText(true), saveErrorText(false), saveErrorToast(true), saveErrorToast(false)]){
    assert.ok(!/[–—;]/.test(t), "no long dashes or semicolons: " + t);
  }
});
