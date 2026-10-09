/* A stand-in DOM for tests that run render, wizard or level-up code in
   Node (setup.mjs only gives enough to load the modules). Shared by the
   test files that need to click through a confirm dialog or finish the
   creation wizard. */
/* An element that accepts anything: every property is another such
   element, every call returns one, and writes are kept. Enough for the
   render code to run in Node without drawing anything. */
export function sink(){
  const kept = {};
  const p = new Proxy(function(){}, {
    get(t, k){
      if(k in kept) return kept[k];
      if(k === Symbol.toPrimitive) return () => "";
      if(k === "length") return 0;
      if(k === "then") return undefined;
      return p;
    },
    set(t, k, v){ kept[k] = v; return true; },
    apply(){ return p; }
  });
  return p;
}
/* Runs fn with a stand-in DOM; returns the elements handed out by id so
   a test can click the confirm dialog's buttons. Timers are mocked so the
   toast doesn't hold the test open. */
export function clickable(){
  const el = sink(); const handlers = {};
  el.addEventListener = (type, f) => { handlers[type] = f; };
  el.click = () => handlers.click && handlers.click();
  return el;
}
const timersOn = new WeakSet();
export function withFakeDom(t, fn){
  if(!timersOn.has(t)){ t.mock.timers.enable({ apis: ["setTimeout"] }); timersOn.add(t); }
  const saved = { document: globalThis.document, raf: globalThis.requestAnimationFrame };
  const byId = {}, made = [];
  const doc = sink();
  doc.getElementById = (id) => byId[id] || (byId[id] = clickable());
  doc.createElement = () => { const el = clickable(); made.push(el); return el; };
  globalThis.document = doc;
  globalThis.requestAnimationFrame = () => 0;
  try { fn(byId, made); }
  finally { globalThis.document = saved.document; globalThis.requestAnimationFrame = saved.raf; }
}
