/* Coin purse math for the Inventory tab's quick add / spend bar. Kept
   free of DOM so the tests can check it directly. Values are in copper
   pieces, per the 2014 PHB exchange rates. */

export var COINS = [
  { key: "cp", name: "Copper",   abbr: "CP", cp: 1 },
  { key: "sp", name: "Silver",   abbr: "SP", cp: 10 },
  { key: "ep", name: "Electrum", abbr: "EP", cp: 50 },
  { key: "gp", name: "Gold",     abbr: "GP", cp: 100 },
  { key: "pp", name: "Platinum", abbr: "PP", cp: 1000 }
];

var BY_KEY = {};
COINS.forEach(function(coin){ BY_KEY[coin.key] = coin; });

function count(purse, key){
  return Math.max(0, Math.floor(Number(purse && purse[key]) || 0));
}

function copy(purse){
  var out = {};
  COINS.forEach(function(coin){ out[coin.key] = count(purse, coin.key); });
  return out;
}

/* Whole purse in copper pieces. */
export function purseValueCp(purse){
  return COINS.reduce(function(sum, coin){ return sum + count(purse, coin.key) * coin.cp; }, 0);
}

/* The purse bar's amount field -> a positive whole number, or null.
   Commas and stray spaces are ignored ("1,200"); anything else (a sign, a
   decimal, letters) is not an amount. */
export function parseCoinAmount(text){
  var digits = String(text == null ? "" : text).replace(/[,\s]/g, "");
  if(!/^\d+$/.test(digits)) return null;
  var amount = parseInt(digits, 10);
  return amount > 0 ? amount : null;
}

/* A new purse with `amount` coins of `key` added. */
export function addCoins(purse, key, amount){
  var out = copy(purse);
  out[key] += Math.max(0, Math.floor(amount) || 0);
  return out;
}

/* Pay `amount` coins of `key` out of the purse, the way a player would at
   the table: that coin first, then smaller coins (largest first), then
   break larger coins (smallest first) and take the change back in gold,
   silver and copper. Returns {ok, purse} with a new purse, or
   {ok:false, shortCp} saying how much copper worth is missing. */
export function spendCoins(purse, key, amount){
  var coin = BY_KEY[key];
  var cost = Math.max(0, Math.floor(amount) || 0) * coin.cp;
  var have = purseValueCp(purse);
  if(cost > have) return { ok: false, shortCp: cost - have };

  var out = copy(purse);
  var smaller = COINS.filter(function(c){ return c.cp < coin.cp; }).reverse();
  var larger = COINS.filter(function(c){ return c.cp > coin.cp; });
  var order = [coin].concat(smaller, larger);

  var owed = cost, last = coin;
  for(var i = 0; i < order.length && owed > 0; i++){
    var c = order[i];
    var take = Math.min(out[c.key], Math.ceil(owed / c.cp));
    if(take <= 0) continue;
    out[c.key] -= take;
    owed -= take * c.cp;
    last = c;
  }

  // Overpaid with the last coin handed over: change comes back in coins
  // worth less than it (electrum is skipped, as shopkeepers rarely carry it).
  var change = -owed;
  ["gp", "sp", "cp"].forEach(function(k){
    if(BY_KEY[k].cp >= last.cp && k !== "cp") return;
    var n = Math.floor(change / BY_KEY[k].cp);
    out[k] += n;
    change -= n * BY_KEY[k].cp;
  });
  return { ok: true, purse: out };
}

/* 1234 cp -> "12.34 GP", the Total Wealth line's format. */
export function formatGp(cp){
  return (cp / 100).toFixed(2) + " GP";
}
