/* The backup reminder's rules (js/core/backup-status.js): it waits for a
   change, counts 14 days from the first change after a backup, "Later"
   waits a week, a backup clears it, and every data save notes a change.
   Also the Import & Export lines (last backup, space used). */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { noteChange, markBackedUp, snoozeReminder, backupReminderDue, backupReminderText, lastBackupText,
  storageNote, storageUsed, resetBackupStatusCache, STORAGE_LIMIT } from "../js/core/backup-status.js";
import { state, save } from "../js/core/state.js";
import { createEncounter } from "../js/core/encounters.js";

const KEY = "ragnarsDen.backupStatus.v1";
const DAY = 864e5;
const T0 = Date.UTC(2026, 10, 1);
const status = () => JSON.parse(localStorage.getItem(KEY) || "null");

beforeEach(() => { localStorage.removeItem(KEY); resetBackupStatusCache(); });

test("nothing changed: never due, however long", () => {
  assert.equal(backupReminderDue(T0 + 400 * DAY), false);
  markBackedUp(T0);
  assert.equal(backupReminderDue(T0 + 400 * DAY), false);
});

test("due 14 days after the first change, counted from that change", () => {
  noteChange(T0);
  noteChange(T0 + 10 * DAY);              // later changes don't move the start
  assert.equal(status().changedSince, T0);
  assert.equal(backupReminderDue(T0 + 13 * DAY), false);
  assert.equal(backupReminderDue(T0 + 14 * DAY), true);
  assert.equal(backupReminderText(T0 + 14 * DAY), "You haven't saved a backup yet. Save one to keep your characters safe.");
});

test("a backup clears it, the next change starts a new count", () => {
  noteChange(T0);
  markBackedUp(T0 + 20 * DAY);
  assert.equal(backupReminderDue(T0 + 21 * DAY), false);
  noteChange(T0 + 22 * DAY);
  assert.equal(backupReminderDue(T0 + 35 * DAY), false);
  assert.equal(backupReminderDue(T0 + 36 * DAY), true);
  assert.equal(backupReminderText(T0 + 36 * DAY), "Your last backup was 16 days ago. Save one to keep your characters safe.");
});

test("Later waits a week", () => {
  noteChange(T0);
  snoozeReminder(T0 + 15 * DAY);
  assert.equal(backupReminderDue(T0 + 21 * DAY), false);
  assert.equal(backupReminderDue(T0 + 22 * DAY), true);
});

test("the status survives a reload", () => {
  noteChange(T0);
  resetBackupStatusCache();
  assert.equal(backupReminderDue(T0 + 14 * DAY), true);
  localStorage.setItem(KEY, "not json");
  resetBackupStatusCache();
  assert.equal(backupReminderDue(T0 + 99 * DAY), false, "a broken entry reads as nothing changed");
});

test("saving characters or a DM's encounters notes a change", () => {
  const keep = state.characters;
  state.characters = [];
  save();
  assert.ok(status() && status().changedSince, "characters");
  state.characters = keep;
  localStorage.removeItem(KEY); resetBackupStatusCache();
  createEncounter("Goblin ambush");
  assert.ok(status() && status().changedSince, "encounters");
});

test("Last backup line", () => {
  assert.equal(lastBackupText(T0), "Last backup: never");
  markBackedUp(T0);
  assert.equal(lastBackupText(T0 + 3600e3), "Last backup: today");
  assert.equal(lastBackupText(T0 + DAY), "Last backup: yesterday");
  assert.equal(lastBackupText(T0 + 12 * DAY), "Last backup: 12 days ago");
});

test("space used, with a warning from 80%", () => {
  assert.deepEqual(storageNote(1234567), { text: "Space used: 1.2 MB of about 5.0 MB.", warn: false });
  const near = storageNote(STORAGE_LIMIT * 0.85);
  assert.equal(near.warn, true);
  assert.match(near.text, /^Space used: 4\.3 MB of about 5\.0 MB\. Photos and banners take the most room\./);
  for(const t of [near.text, backupReminderText(T0)]) assert.ok(!/[–—;]/.test(t), "plain text: " + t);
  assert.equal(typeof storageUsed(), "number");
});
