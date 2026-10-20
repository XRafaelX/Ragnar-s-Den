import { ARMOR_MODELS, ELIXIR_EFFECTS } from "../data/artificer-extras.js";
import { INFUSIONS, REPLICABLE_ITEMS } from "../data/infusions.js";
import { attuneProblem } from "./magic-items.js";
import { activeInfusionData, infusionWorks } from "./infusion-effects.js";
export { activeInfusionData, infusionWorks };
import { WEAPON_DATA, weaponDataOf } from "../data/weapons.js";
import { GEAR_DATA } from "../data/gear.js";
import { mod, profBonus, parseDiceNotation, uid } from "./helpers.js";

/* ---------------- Artificer extras ----------------
   The Armorer's armor model (saved on the class entry as `armorModel`)
   and the Alchemist's experimental elixirs (saved as c.elixirs =
   {list:[{id, name, free}], freeMade}). The walking speed and Guardian
   resources that depend on the model are read in helpers.js. */

function subclassEntry(c, cls, sub, minLevel){
  return (c.classes||[]).find(function(cl){ return cl.name===cls && cl.subclass===sub && (Number(cl.level)||1) >= minLevel; }) || null;
}
export function armorerEntry(c){ return subclassEntry(c, "Artificer", "Armorer", 3); }
export function alchemistEntry(c){ return subclassEntry(c, "Artificer", "Alchemist", 3); }

/* ---- Armor model ---- */
export function wearingBodyArmor(c){
  return (c.inventory||[]).some(function(i){ return i.type==="armor" && i.equipped && i.category!=="shield"; });
}
export function setArmorModel(c, model){
  var cl = armorerEntry(c);
  if(cl && ARMOR_MODELS[model]) cl.armorModel = model;
}
/* The model's special weapon as an attack: INT can replace STR (gauntlets)
   or DEX (launcher) when it's higher, and artificers are proficient with
   simple weapons. Null without an Armorer or a chosen model. */
export function armorModelWeapon(c){
  var cl = armorerEntry(c);
  var model = cl && ARMOR_MODELS[cl.armorModel];
  if(!model) return null;
  var w = model.weapon;
  var ab = c.abilities || {};
  var useInt = mod(ab.int) > mod(ab[w.ability]);
  var abilityMod = useInt ? mod(ab.int) : mod(ab[w.ability]);
  return {
    name: w.name, model: cl.armorModel, ability: useInt ? "int" : w.ability,
    toHit: abilityMod + profBonus(c), damageBonus: abilityMod,
    dice: parseDiceNotation(w.dice), diceText: w.dice, type: w.type, range: w.range,
    extra: w.extraDice ? parseDiceNotation(w.extraDice) : null, extraText: w.extraDice || "", note: w.note
  };
}
/* The model's perks at the Armorer's current level. */
export function armorModelPerks(c){
  var cl = armorerEntry(c);
  var model = cl && ARMOR_MODELS[cl.armorModel];
  if(!model) return [];
  var lv = Number(cl.level)||1;
  return model.perks.filter(function(p){ return lv >= p.level; }).map(function(p){ return p.text; });
}

/* ---- Infusions ----
   An active infusion with a bonus adds it to the infused item's
   magicBonus (see js/render/panels/infusions.js) and remembers how much
   in active.bonus, so ending it takes exactly that back off. One that
   needs attunement (active.attunement) gives its bonus only while the
   item is attuned. Charges spent are kept in active.used. */
export function artificerLevel(c){
  var cl = (c.classes||[]).find(function(x){ return x.name==="Artificer"; });
  return cl ? (Number(cl.level)||1) : 0;
}
/* The bonus an infusion gives now: +1, or +2 from artificer level 10 for
   the ones that scale. 0 for one without a bonus. */
export function infusionBonus(c, name){
  var data = INFUSIONS.find(function(i){ return i.name===name; });
  if(!data || !data.bonus) return 0;
  return data.scales && artificerLevel(c) >= 10 ? 2 : 1;
}
/* An item made by Replicate Magic Item (`made`) leaves the inventory
   when its infusion ends; any other item loses the bonus and, no longer
   magic, its attunement. */
export function endInfusion(c, active){
  var item = active.itemId && (c.inventory||[]).find(function(i){ return i.id===active.itemId; });
  if(item && active.bonus) item.magicBonus = (Number(item.magicBonus)||0) - active.bonus;
  if(item && active.attunement) delete item.attuned;
  if(item && active.made) c.inventory = c.inventory.filter(function(i){ return i!==item; });
  c.infusions.active = c.infusions.active.filter(function(a){ return a.id!==active.id; });
}

/* ---- Picking what to infuse ----
   Infusions go on nonmagical objects of a certain kind, one infusion per
   object. Each kind matches inventory rows by type or by name. */
function weaponProps(item){
  var d = weaponDataOf(item);
  return ((d && d.properties) || "") + " " + (item.notes || "");
}
function isBodyArmor(item){ return item.type==="armor" && item.category!=="shield"; }
/* The weapon infusions go on "a simple or martial weapon": not a firearm
   (a weapon the catalog doesn't know, typed in by hand, is let through). */
function simpleOrMartial(item){
  return item.type==="weapon" && ((weaponDataOf(item) || {}).category!=="firearm");
}
var TARGET_KINDS = {
  armor: function(i){ return i.type==="armor"; },
  bodyArmor: isBodyArmor,
  shield: function(i){ return i.type==="armor" && i.category==="shield"; },
  armorOrRobes: function(i){ return isBodyArmor(i) || /\brobes?\b/i.test(i.name||""); },
  weapon: simpleOrMartial,
  ammoWeapon: function(i){ return simpleOrMartial(i) && /ammunition/i.test(weaponProps(i)); },
  thrownWeapon: function(i){ return simpleOrMartial(i) && /thrown/i.test(weaponProps(i)); },
  focus: function(i){ return /\b(rod|staff|wand)\b|quarterstaff/i.test(i.name||""); },
  gem: function(i){ return /\b(gem|gems|gemstone|diamond|ruby|emerald|sapphire|pearl|jewel)\b/i.test(i.name||""); },
  boots: function(i){ return /\bboots\b/i.test(i.name||""); },
  ring: function(i){ return /\bring\b/i.test(i.name||""); },
  helmet: function(i){ return /\bhelm(et)?\b/i.test(i.name||""); }
};
/* Inventory items of the infusion's kind, each with a reason it can't
   take the infusion now ("" when it can): already infused, or magic. */
export function infusionTargets(c, data){
  var match = data && TARGET_KINDS[data.target];
  if(!match) return [];
  var active = (c.infusions && c.infusions.active) || [];
  return (c.inventory||[]).filter(match).map(function(item){
    var infused = active.find(function(a){ return a.itemId===item.id; });
    var reason = infused ? "has " + infused.name
      : (item.magic || item.magicItem || (Number(item.magicBonus)||0) > 0) ? "magic item" : "";
    return {item: item, reason: reason};
  });
}

/* Put a known infusion on an object. opts: {itemId} for an inventory
   item, {newItem: "Ring"} to add a plain one first, nothing for Replicate
   Magic Item (the item is made); `choice` for Resistant Armor's damage
   type. Past `maxActive` the oldest infusion ends first, as in the rules.
   Returns the new active entry, or null if the item can't take it. */
export function infuseItem(c, known, opts, maxActive){
  var inf = c.infusions;
  var data = INFUSIONS.find(function(i){ return i.name===known.name; }) || {};
  opts = opts || {};
  var item = null, made = false;
  if(data.target==="replica"){
    item = {id: uid(), name: known.note || "Replicated item", type:"gear", qty:1, equipped:false, notes:"", weight:0};
    made = true;
  } else if(opts.newItem){
    var g = GEAR_DATA[opts.newItem] || {};
    item = {id: uid(), name: opts.newItem, type:"gear", qty:1, equipped:false, notes: g.notes||"", weight: g.weight||0};
  } else {
    var pick = infusionTargets(c, data).find(function(t){ return t.item.id===opts.itemId; });
    if(!pick || pick.reason) return null;
    item = pick.item;
  }
  while(inf.active.length >= maxActive && inf.active.length) endInfusion(c, inf.active[0]);
  if(!item.id) item.id = uid();
  if(c.inventory.indexOf(item)===-1) c.inventory.push(item);
  var entry = {id: uid(), knownId: known.id, name: known.name + (known.note ? ": "+known.note : ""),
    itemId: item.id, itemName: item.name, bonus: 0, attunement: infusionNeedsAttunement(known.name, known.note)};
  if(made) entry.made = true;
  if(opts.choice) entry.choice = opts.choice;
  // A new homunculus forms around the gem, at full hit points.
  if(known.name==="Homunculus Servant" && c.companions) delete c.companions.homunculus_servant;
  inf.active.push(entry);
  // The artificer can attune the instant they infuse it, if they have room.
  if(entry.attunement){
    item.attuned = false;
    item.attuned = !attuneProblem(c, item);
  }
  var bonus = infusionWorks(item, entry) ? infusionBonus(c, known.name) : 0;
  if(bonus) item.magicBonus = (Number(item.magicBonus)||0) + bonus;
  entry.bonus = bonus;
  return entry;
}

/* Whether the infusion needs attunement: its item line says so, or for
   Replicate Magic Item, the replicated item's table entry does (a common
   item typed in by name is taken not to). */
export function infusionNeedsAttunement(name, note){
  var data = INFUSIONS.find(function(i){ return i.name===name; });
  if(!data) return false;
  if(data.target==="replica"){
    var n = (note||"").toLowerCase(), found = null;
    REPLICABLE_ITEMS.forEach(function(t){ t.items.forEach(function(i){ if(i.name.toLowerCase()===n) found = i; }); });
    return !!(found && found.attunement);
  }
  return /requires attunement/i.test(data.item||"");
}
/* The active infusion on an inventory item, or null. */
export function infusionOn(c, item){
  var active = (c.infusions && c.infusions.active) || [];
  return (item && item.id && active.find(function(a){ return a.itemId===item.id; })) || null;
}

/* ---- Charges, and the Spell-Refueling Ring ---- */
/* {max, left, regain} for an infusion with charges, else null. */
export function infusionCharges(c, active){
  var d = activeInfusionData(c, active);
  if(!d || !d.charges) return null;
  var used = Math.min(d.charges.max, Math.max(0, Number(active.used)||0));
  return {max: d.charges.max, left: d.charges.max - used, regain: d.charges.regain};
}
/* Spend a charge. False with none left. */
export function useInfusionCharge(c, active){
  var ch = infusionCharges(c, active);
  if(!ch || !ch.left) return false;
  active.used = ch.max - ch.left + 1;
  return true;
}
/* The spell slot levels (1st to 3rd) the ring can give back now: ones
   with a slot spent. Empty once the ring is used until dawn. */
export function refuelLevels(c, active){
  if(active.used) return [];
  var slots = (c.spellcasting && c.spellcasting.slots) || {};
  return [1, 2, 3].filter(function(l){ return slots[l] && (Number(slots[l].used)||0) > 0; });
}
export function refuelSlot(c, active, level){
  if(refuelLevels(c, active).indexOf(level)===-1) return false;
  c.spellcasting.slots[level].used = Number(c.spellcasting.slots[level].used) - 1;
  active.used = 1;
  return true;
}
/* Dawn (a long rest): each infusion with charges regains its dice, the
   ring can be used again. The names that got something back. `roll` is
   for tests (sides -> 1..sides). */
export function infusionsOnLongRest(c, roll){
  roll = roll || function(sides){ return Math.floor(Math.random()*sides) + 1; };
  var back = [];
  ((c.infusions && c.infusions.active) || []).forEach(function(a){
    if(!(Number(a.used)||0)) return;
    var ch = infusionCharges(c, a);
    if(ch){
      var dice = parseDiceNotation(ch.regain), got = 0;
      for(var i = 0; i < dice.qty; i++) got += roll(dice.die);
      a.used = Math.max(0, (Number(a.used)||0) - got);
    } else a.used = 0;
    back.push(a.itemName);
  });
  return back;
}

/* Infusions whose item was removed from the inventory have ended. True
   if any did. Older free-text ones (no itemId) stay. */
export function dropOrphanInfusions(c){
  var inf = c.infusions;
  if(!inf || !(inf.active||[]).length) return false;
  var ids = (c.inventory||[]).map(function(i){ return i.id; });
  var before = inf.active.length;
  inf.active = inf.active.filter(function(a){ return !a.itemId || ids.indexOf(a.itemId)!==-1; });
  return inf.active.length !== before;
}
/* After the artificer level changes (a level-up or its undo) or an
   infused item's attunement does: bonuses that scale move to +2 at level
   10 (or back to +1), one that needs attunement counts only while
   attuned, and below level 2, where there are no infusions, every one
   ends. True if anything changed. */
export function syncInfusions(c){
  var inf = c.infusions;
  if(!inf || !(inf.active||[]).length) return false;
  if(artificerLevel(c) < 2){
    inf.active.slice().forEach(function(a){ endInfusion(c, a); });
    return true;
  }
  var changed = false;
  inf.active.forEach(function(a){
    var known = (inf.known||[]).find(function(k){ return k.id===a.knownId; });
    var name = known ? known.name : String(a.name||"").replace(/:.*$/, "");
    var item = a.itemId && (c.inventory||[]).find(function(i){ return i.id===a.itemId; });
    // Saved before infusions knew about attunement: needs it if the rules
    // say so, and an item already infused counts as attuned.
    if(a.attunement===undefined){
      a.attunement = infusionNeedsAttunement(name, known && known.note);
      if(a.attunement && item && item.attuned===undefined) item.attuned = true;
      changed = true;
    }
    if(!item) return;
    var want = infusionWorks(item, a) ? infusionBonus(c, name) : 0;
    var had = Number(a.bonus)||0;
    if(want===had) return;
    item.magicBonus = (Number(item.magicBonus)||0) + want - had;
    a.bonus = want;
    changed = true;
  });
  return changed;
}

/* ---- Experimental elixirs ---- */
export function freeElixirCount(level){ return level>=15 ? 3 : level>=6 ? 2 : 1; }
export function elixirState(c){
  if(!c.elixirs) c.elixirs = {list: [], freeMade: 0};
  return c.elixirs;
}
export function elixirEffect(name){
  return ELIXIR_EFFECTS.find(function(e){ return e.name===name; }) || null;
}
/* Free elixirs still to make since the last long rest. */
export function freeElixirsLeft(c){
  var cl = alchemistEntry(c);
  return cl ? Math.max(0, freeElixirCount(Number(cl.level)||3) - elixirState(c).freeMade) : 0;
}
/* Roll a d6 for each free elixir left; returns the effects rolled.
   `roll` is for tests (a function returning 1-6). */
export function rollFreeElixirs(c, roll){
  var st = elixirState(c), made = [];
  roll = roll || function(){ return Math.floor(Math.random()*6) + 1; };
  for(var n = freeElixirsLeft(c); n > 0; n--){
    var effect = ELIXIR_EFFECTS[roll() - 1];
    st.list.push({id: uid(), name: effect.name, free: true});
    st.freeMade++;
    made.push(effect.name);
  }
  return made;
}
/* One more elixir of a chosen effect, paid with the lowest spell slot
   left. Returns the slot level used, or 0 if there's none (nothing made). */
export function brewElixirWithSlot(c, effectName){
  var slots = c.spellcasting && c.spellcasting.slots || {};
  for(var lvl = 1; lvl <= 9; lvl++){
    var s = slots[lvl];
    if(s && s.max > (s.used||0)){
      s.used = (s.used||0) + 1;
      elixirState(c).list.push({id: uid(), name: effectName, free: false});
      return lvl;
    }
  }
  return 0;
}
export function useElixir(c, id){
  var st = elixirState(c);
  st.list = st.list.filter(function(e){ return e.id!==id; });
}
/* A long rest: unused elixirs expire and the free ones are rolled again.
   Returns the new effects (empty for non-Alchemists). */
export function elixirsOnLongRest(c, roll){
  if(!alchemistEntry(c)){ return []; }
  c.elixirs = {list: [], freeMade: 0};
  return rollFreeElixirs(c, roll);
}
/* What drinking one gives beyond its text: Healing's dice and INT bonus,
   and from level 9 Restorative Reagents' temporary hit points. */
export function elixirRolls(c, name){
  var cl = alchemistEntry(c);
  var intMod = mod(c.abilities && c.abilities.int);
  var out = [];
  var effect = elixirEffect(name);
  if(effect && effect.heal) out.push({label: "Heal", dice: parseDiceNotation(effect.heal), diceText: effect.heal, bonus: intMod});
  if(cl && (Number(cl.level)||1) >= 9) out.push({label: "Temp HP", dice: parseDiceNotation("2d6"), diceText: "2d6", bonus: Math.max(1, intMod)});
  return out;
}
