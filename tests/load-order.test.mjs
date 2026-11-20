/* Every module can be the first one loaded (tests/load-order.mjs): no
   module may run an import while the modules are still loading. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLoadOrder } from "./load-order.mjs";

test("every module loads on its own, as the first one", async () => {
  const { checked, failed } = await checkLoadOrder();
  assert.ok(checked > 200, "the modules were found (" + checked + ")");
  assert.deepEqual(failed.map((f) => f.file + " " + f.where + " " + f.what), [],
    "these throw when loaded first; see npm run check:load-order");
});
