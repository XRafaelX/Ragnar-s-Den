/* Project wiring: the offline cache list and the module imports point at
   files that exist. A broken import or a stale cache entry would stop the
   app loading (or loading offline) without failing any data test. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function walk(dir){
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

test("every file in the service worker's offline list exists", () => {
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const block = sw.match(/\/\* ASSETS:START \*\/([\s\S]*?)\/\* ASSETS:END \*\//);
  assert.ok(block, "sw.js ASSETS markers missing");
  const listed = [...block[1].matchAll(/"\.\/([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  assert.equal(new Set(listed).size, listed.length, "duplicate entries in sw.js ASSETS");
  const missing = listed.filter((f) => !fs.existsSync(path.join(ROOT, f)));
  assert.deepEqual(missing, [], "listed in sw.js but missing on disk");
});

test("every relative import in the app resolves to a file", () => {
  const broken = [];
  for(const file of walk(path.join(ROOT, "js")).filter((f) => f.endsWith(".js") && !f.endsWith(".min.js"))){
    const src = fs.readFileSync(file, "utf8");
    for(const m of src.matchAll(/(?:import|export)\s[^"']*?from\s+["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g)){
      const spec = m[1] || m[2];
      if(!fs.existsSync(path.resolve(path.dirname(file), spec))) broken.push(path.relative(ROOT, file) + " -> " + spec);
    }
  }
  assert.deepEqual(broken, []);
});

test("index.html's scripts and stylesheets exist", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const refs = [...html.matchAll(/(?:src|href)="(?!https?:|#|data:|mailto:)([^"]+\.(?:js|css|png|svg|json|ico|webp))"/g)].map((m) => m[1].replace(/^\.\//, ""));
  assert.ok(refs.length > 0, "found no local references in index.html");
  const missing = refs.filter((r) => !fs.existsSync(path.join(ROOT, r)));
  assert.deepEqual(missing, []);
});
