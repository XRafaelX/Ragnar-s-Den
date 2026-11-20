/* Every module, loaded first on its own (2026-11-20). The app's modules
   import each other in cycles, which is fine as long as nothing *runs*
   an import while the modules are still loading. When something does
   (a table built at load time from another module's table), it only
   works in the load order the app and the tests happen to use, and
   breaks the day that order changes. This loads each module as the very
   first one, in a fresh Node process, and lists any that throws.

   Part of npm test (tests/load-order.test.mjs), so the pre-commit hook
   runs it. On its own, with the failing lines printed:
     npm run check:load-order */
import { spawn } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { cpus } from "node:os";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname;
// (The players' screen needs a real window; the test stub doesn't give one.)
const SKIP = new Set(["js/dungeon-view.js", "js/bootstrap.bundle.min.js"]);

function modules(dir){
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if(statSync(p).isDirectory()) return modules(p);
    return p.endsWith(".js") ? [relative(ROOT, p)] : [];
  });
}
function loadFirst(file){
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--import", "./tests/setup.mjs", "-e", "await import('./" + file + "')"], { cwd: ROOT });
    let err = "";
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", (code) => resolve({ file, ok: code === 0, err }));
  });
}

/* {checked: how many modules, failed: [{file, where, what}]}. */
export async function checkLoadOrder(){
  const files = modules(join(ROOT, "js")).filter((f) => !SKIP.has(f)).sort();
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(2, cpus().length) }, async () => {
    while(next < files.length) results.push(await loadFirst(files[next++]));
  }));
  const failed = results.filter((r) => !r.ok).sort((a, b) => a.file.localeCompare(b.file)).map((r) => ({
    file: r.file,
    where: (r.err.match(/js\/[\w/.-]+\.js:\d+/) || [""])[0],
    what: (r.err.match(/^\w*Error[^\n]*/m) || ["(no message)"])[0]
  }));
  return { checked: files.length, failed };
}

// Run on its own: print each failure and the count.
if(import.meta.url === pathToFileURL(process.argv[1]).href){
  const { checked, failed } = await checkLoadOrder();
  for(const f of failed) console.log("FAIL " + f.file + (f.where ? "  (" + f.where + ")" : "") + "  " + f.what);
  console.log(checked + " modules loaded first, " + failed.length + " failed");
  process.exitCode = failed.length ? 1 : 0;
}
