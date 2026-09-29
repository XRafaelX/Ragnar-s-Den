/* Coin purse: parsing what the player types, and paying for things with
   change the way a shopkeeper would. Every spend must take exactly the
   cost out of the purse's total value, whatever coins it ends up in. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCoinAmount, addCoins, spendCoins, purseValueCp, formatGp } from "../js/core/coins.js";

const purse = (p) => ({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, ...p });

test("parses the amount field as a positive whole number", () => {
  assert.equal(parseCoinAmount("50"), 50);
  assert.equal(parseCoinAmount(" 1,200 "), 1200);
  for(const bad of ["", "0", "-20", "+5", "abc", "2.5", "3 pp", null]) assert.equal(parseCoinAmount(bad), null, String(bad));
});

test("adding coins only touches that coin", () => {
  assert.deepEqual(addCoins(purse({ gp: 3, sp: 1 }), "gp", 50), purse({ gp: 53, sp: 1 }));
  assert.deepEqual(addCoins(undefined, "cp", 7), purse({ cp: 7 }));
});

test("spending uses the named coin first", () => {
  assert.deepEqual(spendCoins(purse({ gp: 10, sp: 5 }), "gp", 4), { ok: true, purse: purse({ gp: 6, sp: 5 }) });
});

test("spending falls back to smaller coins before breaking larger ones", () => {
  assert.deepEqual(spendCoins(purse({ gp: 2, sp: 40, pp: 1 }), "gp", 5).purse, purse({ sp: 10, pp: 1 }));
});

test("spending breaks a larger coin and gives change", () => {
  // 1 pp for 3 gp: 7 gp back.
  assert.deepEqual(spendCoins(purse({ pp: 1 }), "gp", 3).purse, purse({ gp: 7 }));
  // 1 gp for 5 cp: 9 sp and 5 cp back.
  assert.deepEqual(spendCoins(purse({ gp: 1 }), "cp", 5).purse, purse({ sp: 9, cp: 5 }));
  // 3 ep for 12 sp: the third electrum is broken, 3 sp back.
  assert.deepEqual(spendCoins(purse({ ep: 3 }), "sp", 12).purse, purse({ sp: 3 }));
});

test("every spend removes exactly its cost", () => {
  const start = purse({ cp: 13, sp: 7, ep: 2, gp: 4, pp: 3 });
  const rates = { cp: 1, sp: 10, ep: 50, gp: 100, pp: 1000 };
  for(const key of Object.keys(rates)){
    for(const amount of [1, 3, 9, 17, 40]){
      const cost = amount * rates[key];
      const res = spendCoins(start, key, amount);
      if(cost > purseValueCp(start)){ assert.equal(res.ok, false); continue; }
      assert.equal(res.ok, true, key + " " + amount);
      assert.equal(purseValueCp(res.purse), purseValueCp(start) - cost, key + " " + amount);
      for(const n of Object.values(res.purse)) assert.ok(Number.isInteger(n) && n >= 0);
    }
  }
});

test("spending more than the purse holds fails and leaves it alone", () => {
  const p = purse({ gp: 2, sp: 5 });
  assert.deepEqual(spendCoins(p, "gp", 3), { ok: false, shortCp: 50 });
  assert.deepEqual(p, purse({ gp: 2, sp: 5 }));
});

test("formats copper as gold", () => {
  assert.equal(formatGp(0), "0.00 GP");
  assert.equal(formatGp(1234), "12.34 GP");
});
