/* Backup exports are named by local date and time plus the app version,
   so they sort in order and two exports on one day don't clash. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { backupFileName } from "../js/core/basics.js";

test("backup file name uses local date, time and app version", () => {
  assert.equal(backupFileName(new Date(2026, 9, 19, 21, 45), "2.0.0"), "ragnars-den-backup_2026-10-19_2145_v2.0.0.json");
  assert.equal(backupFileName(new Date(2026, 0, 5, 0, 7), "2.1.3"), "ragnars-den-backup_2026-01-05_0007_v2.1.3.json");
});
