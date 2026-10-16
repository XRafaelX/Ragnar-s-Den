/* ---------------- Magic items ----------------
   What a carried magic item does, worked out when shown. An inventory row
   is a magic item when its `magicItem` names an entry in
   js/data/magic-items.js; one that needs attunement works only while
   `attuned` is set (the Attune switch on its card).
   A Heavy Holster keeps its knife count on the row (`knives`): each knife
   in it adds damage to your attacks, and an empty one adds speed. The
   Duality coin keeps its charges and boons on the row (`coin`). */
import { MAGIC_ITEM_DATA } from "../data/magic-items.js";
import { classFeatureList } from "./class-features.js";

export function magicItemDef(item){
  return item && item.magicItem ? MAGIC_ITEM_DATA[item.magicItem] || null : null;
}

/* Its magic is on: carried, and attuned if it needs to be. */
export function magicItemActive(item){
  var d = magicItemDef(item);
  return !!d && (!d.attunement || !!item.attuned);
}

/* ---- Attunement ----
   Three items at once, more with a feature tagged `attuneLimit` (an
   artificer's Magic Item Adept, Savant and Master), and never two copies
   of the same item. */
export function attunementLimit(c){
  var best = 3;
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){ if(f.attuneLimit) best = Math.max(best, f.attuneLimit); });
  });
  return best;
}
export function attunedItems(c){
  return (c.inventory||[]).filter(function(i){ var d = magicItemDef(i); return d && d.attunement && i.attuned; });
}
/* Why this item can't be attuned to now, or null if it can (or already is). */
export function attuneProblem(c, item){
  if(item.attuned) return null;
  var attuned = attunedItems(c);
  if(attuned.some(function(i){ return i.magicItem===item.magicItem; })) return "You're already attuned to a " + item.magicItem + ". You can't attune to two copies of the same item.";
  var limit = attunementLimit(c);
  if(attuned.length >= limit) return "You're attuned to " + limit + " of " + limit + " items, your limit. End the attunement to one of them first.";
  return null;
}

/* ---- Heavy Holster ---- */
export function holsterKnives(item){
  var d = magicItemDef(item);
  if(!d || !d.holster) return 0;
  var n = Number(item.knives);
  return Math.max(0, Math.min(d.holster.capacity, isNaN(n) ? d.holster.capacity : n));
}

/* The working holster: the first attuned one (a creature can't attune to
   more than one copy of an item), or null. */
function activeHolster(c){
  return (c.inventory||[]).find(function(i){ return magicItemActive(i) && magicItemDef(i).holster; }) || null;
}

/* Extra damage on every attack: the knives in the attuned holster. */
export function holsterDamageBonus(c){
  var h = activeHolster(c);
  return h ? holsterKnives(h) * magicItemDef(h).holster.damagePerKnife : 0;
}

/* Speed parts for computeSpeed: an attuned holster with no knives in it. */
export function holsterSpeedParts(c){
  var h = activeHolster(c);
  return h && holsterKnives(h)===0 ? [{name: h.name || h.magicItem, value: magicItemDef(h).holster.emptySpeed, why: "holster empty"}] : [];
}

/* ---- Duality (a coin flipped for a boon) ----
   The row keeps `coin`: {used (charges spent), flip (the side it landed
   on while a boon is still to be chosen), boons ([{id, type}] in play;
   type is the damage type picked, for extra damage or a resistance)}.
   A boon lasts its minutes (ended by hand or by any rest) or, without
   minutes, until it's used or the next long rest. The same boon can't be
   in play twice. */
function coinOf(item){ return item.coin || {used: 0, flip: "", boons: []}; }
function coinState(item){
  if(!item.coin) item.coin = {used: 0, flip: "", boons: []};
  if(!item.coin.boons) item.coin.boons = [];
  return item.coin;
}
export function coinCharges(item){
  var d = magicItemDef(item);
  if(!d || !d.coin) return 0;
  return Math.max(0, d.coin.charges - (Number(coinOf(item).used)||0));
}
/* A boon's rules by id, from any coin in the data. */
export function coinBoonDef(id){
  var found = null;
  Object.keys(MAGIC_ITEM_DATA).forEach(function(n){
    var coin = MAGIC_ITEM_DATA[n].coin;
    if(!coin) return;
    Object.keys(coin.sides).forEach(function(s){
      coin.sides[s].boons.forEach(function(b){ if(b.id===id) found = b; });
    });
  });
  return found;
}
/* Every boon in play on this character: [{item, def, type, side}]
   ("angel" or "demon"). */
export function activeBoons(c){
  var out = [];
  (c.inventory||[]).forEach(function(i){
    var d = magicItemDef(i);
    if(!d || !d.coin || !magicItemActive(i)) return;
    (coinOf(i).boons||[]).forEach(function(b){
      var def = coinBoonDef(b.id);
      var side = Object.keys(d.coin.sides).find(function(s){ return d.coin.sides[s].boons.indexOf(def)!==-1; }) || "";
      if(def) out.push({item: i, def: def, type: b.type || "", side: side});
    });
  });
  return out;
}
/* Spend a charge and flip: "angel" or "demon" (rand() below 0.5 is
   angel). Null when out of charges or a boon from the last flip is still
   to be chosen. */
export function flipCoin(item, rand){
  var d = magicItemDef(item);
  var st = coinState(item);
  if(!d || !d.coin || st.flip || coinCharges(item) <= 0) return null;
  st.used = (Number(st.used)||0) + 1;
  st.flip = (rand || Math.random)() < 0.5 ? "angel" : "demon";
  return st.flip;
}
/* Why this boon can't be chosen from the coin's last flip now, or "". */
export function boonProblem(c, item, id){
  var d = magicItemDef(item);
  var st = coinOf(item);
  var side = d && d.coin && st.flip && d.coin.sides[st.flip];
  if(!side || !side.boons.some(function(b){ return b.id===id; })) return "Not on the side the coin landed on.";
  if(activeBoons(c).some(function(a){ return a.def.id===id; })) return "Already in play.";
  return "";
}
/* Take a boon from the last flip (`type`: the damage type it needs). */
export function chooseBoon(c, item, id, type){
  if(boonProblem(c, item, id)) return false;
  var def = coinBoonDef(id);
  if(def.damage && def.damage.types.indexOf(type)===-1) type = def.damage.types[0];
  if(def.resistance && !type) return false;
  var st = coinState(item);
  st.boons.push(type ? {id: id, type: type} : {id: id});
  st.flip = "";
  return true;
}
/* After a flip: when every boon on that side is already in play,
   there's nothing to choose, so the flip ends there. True if it did.
   (With every boon ending at a long rest and two charges a day, it can
   only come from an older save; kept so the coin can never get stuck.) */
export function closeEmptyFlip(c, item){
  var d = magicItemDef(item);
  var st = coinOf(item);
  var side = d && d.coin && st.flip && d.coin.sides[st.flip];
  if(!side || side.boons.some(function(b){ return !boonProblem(c, item, b.id); })) return false;
  coinState(item).flip = "";
  return true;
}
/* End a boon (its time is up, or it was used). */
export function endBoon(item, id){
  var st = coinState(item);
  st.boons = st.boons.filter(function(b){ return b.id!==id; });
}
export function coinAcBonus(c){
  return activeBoons(c).reduce(function(a, b){ return a + (b.def.ac||0); }, 0);
}
export function coinAttackBonus(c){
  return activeBoons(c).reduce(function(a, b){ return a + (b.def.attack||0); }, 0);
}
/* Advantage on the next ability check, as a roll mode, or null. */
export function nextCheckAdvantage(c){
  return activeBoons(c).some(function(b){ return b.def.checkAdvantage; })
    ? {mode: "adv", reason: "Duality: advantage on your next ability check"} : null;
}
/* An ability check was rolled with it: it's used up. True if one was. */
export function useNextCheck(c){
  var used = false;
  activeBoons(c).forEach(function(b){ if(b.def.checkAdvantage){ endBoon(b.item, b.def.id); used = true; } });
  return used;
}
/* Extra damage waiting for the next attack: [{item, def, type, qty, die}]. */
export function nextAttackDamage(c){
  return activeBoons(c).filter(function(b){ return b.def.damage; }).map(function(b){
    return {item: b.item, def: b.def, type: b.type || b.def.damage.types[0], qty: b.def.damage.qty, die: b.def.damage.die};
  });
}
export function coinResistances(c){
  return activeBoons(c).filter(function(b){ return b.def.resistance && b.type; }).map(function(b){ return b.type; });
}
/* A long rest (dawn): every coin's charges come back, and every boon
   still in play ends, the ones waiting for the next roll too, so unused
   boons can't pile up from one day to the next. A flip still waiting
   for its choice is dropped. {recharged: item names, ended: boons}. */
export function magicItemsOnLongRest(c){
  var ended = endBoons(c, function(){ return true; });
  var recharged = [];
  (c.inventory||[]).forEach(function(i){
    var d = magicItemDef(i);
    if(!d || !d.coin || !i.coin) return;
    i.coin.flip = "";
    if(!(Number(i.coin.used)||0)) return;
    i.coin.used = 0;
    recharged.push(i.name || i.magicItem);
  });
  return {recharged: recharged, ended: ended};
}
/* A short rest (an hour) outlasts every boon that runs for minutes; the
   ones waiting for the next roll stay until a long rest. The boons that
   ended, by text. */
export function endTimedBoons(c){
  return endBoons(c, function(def){ return !!def.minutes; });
}
function endBoons(c, which){
  var ended = [];
  activeBoons(c).forEach(function(b){ if(which(b.def)){ endBoon(b.item, b.def.id); ended.push("Duality (" + boonLabel(b) + ")"); } });
  return ended;
}
/* A short name for a boon in play ("+1 AC", "resistance to fire"). */
export function boonLabel(b){
  var d = b.def;
  if(d.ac) return "+" + d.ac + " AC";
  if(d.attack) return "+" + d.attack + " to attack rolls";
  if(d.checkAdvantage) return "advantage on your next ability check";
  if(d.damage) return "next attack +" + d.damage.qty + "d" + d.damage.die + " " + (b.type || d.damage.types[0]).toLowerCase();
  if(d.resistance) return "resistance to " + (b.type || "a damage type").toLowerCase();
  return d.text;
}
