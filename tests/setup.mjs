/* Loaded before every test file (see package.json). The app's modules are
   written for the browser; these stand-ins give them just enough of
   window, document and localStorage to load and run in Node. Tests check
   data and calculations, not rendering, so nothing here draws anything. */

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => { store.clear(); }
};
globalThis.window = globalThis;

function fakeElement(){
  return {
    style: {}, dataset: {}, children: [],
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(){}, removeChild(){}, setAttribute(){}, getAttribute(){ return null; },
    addEventListener(){}, removeEventListener(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }
  };
}
globalThis.document = {
  addEventListener(){}, removeEventListener(){},
  querySelector(){ return null; }, querySelectorAll(){ return []; }, getElementById(){ return null; },
  createElement: fakeElement, createElementNS: fakeElement,
  documentElement: fakeElement(), body: fakeElement()
};
