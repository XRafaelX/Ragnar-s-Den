import { ARMOR_MODELS, ELIXIR_EFFECTS } from "../data/artificer-extras.js";
import { INFUSIONS, REPLICABLE_ITEMS, infusedItemsAt } from "../data/infusions.js";
import { TINKER_ITEMS } from "../data/artificer-2024.js";
import { attuneProblem } from "./magic-items.js";
import { activeInfusionData, infusionWorks } from "./infusion-effects.js";
export { activeInfusionData, infusionWorks };
import { WEAPON_DATA, weaponDataOf } from "../data/weapons.js";
import { GEAR_DATA } from "../data/gear.js";
import { mod, profBonus, parseDiceNotation, uid, resourceLeft, classLevelOf, isMagicWeapon, handsInUse } from "./helpers.js";
import { abilityScore, abilityScores } from "./ability-scores.js";

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
  var ab = abilityScores(c);
  var useInt = mod(ab.int) > mod(ab[w.ability]);
  var abilityMod = useInt ? mod(ab.int) : mod(ab[w.ability]);
  // Armor Modifications: an infusion on the armor's weapon (Enhanced
  // Weapon's +1) counts while the armor is worn.
  var part = armorPartItem(c, "weapon");
  var magic = part ? Number(part.magicBonus)||0 : 0;
  var partInf = part ? infusionOn(c, part) : null;
  return {
    name: w.name, model: cl.armorModel, ability: useInt ? "int" : w.ability,
    toHit: abilityMod + profBonus(c) + magic, damageBonus: abilityMod + magic,
    magic: magic, infusion: partInf ? String(partInf.name||"").replace(/:.*$/, "") : "",
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
/* A 2024 artificer (Eberron: Forge of the Artificer): plans, not infusions. */
export function isArtificer2024(c){
  return (c.classes||[]).some(function(x){ return x.name==="Artificer" && x.edition==="2024"; });
}
/* The Tasha's artificer's level (0 for a 2024 one): infusions, Tool
   Expertise and its Soul of Artifice. */
function tashaLevel(c){ return isArtificer2024(c) ? 0 : artificerLevel(c); }
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
  // A replicated item, or an Arcane Armor part (it's only an item while infused).
  if(item && (active.made || item.armorPart)) c.inventory = c.inventory.filter(function(i){ return i!==item; });
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
   take the infusion now ("" when it can): already infused, or magic.
   Arcane Armor parts are offered by armorPartOptions instead. */
export function infusionTargets(c, data){
  var match = data && TARGET_KINDS[data.target];
  if(!match) return [];
  var active = (c.infusions && c.infusions.active) || [];
  return (c.inventory||[]).filter(function(i){ return !i.armorPart && match(i); }).map(function(item){
    var infused = active.find(function(a){ return a.itemId===item.id; });
    var reason = infused ? "has " + infused.name
      : (item.magic || item.magicItem || (Number(item.magicBonus)||0) > 0) ? "magic item" : "";
    return {item: item, reason: reason};
  });
}

/* ---- Armor Modifications (Armorer 9, Tasha's) ----
   The Arcane Armor counts as four items for infusions: the chest piece
   (the worn armor itself), boots, helmet and the model's special weapon.
   The boots, helmet and weapon become inventory items only while infused
   ({armorPart, partOf: the armor's id}), so attunement, charges and the
   Inventory card work as for any infused item; ending the infusion
   removes them. Two more items can be infused, but only armor parts:
   an entry on a part has `part` ("chest", "boots", "helmet", "weapon"). */
export var ARMOR_PARTS = {boots: "Arcane Armor boots", helmet: "Arcane Armor helmet", weapon: "Arcane Armor weapon"};
var PART_FOR_TARGET = {boots: "boots", helmet: "helmet", weapon: "weapon"};
export function hasArmorModifications(c){ return !!subclassEntry(c, "Artificer", "Armorer", 9); }
/* The Arcane Armor: the body armor an Armorer 9+ is wearing, or null. */
export function arcaneArmor(c){
  if(!hasArmorModifications(c)) return null;
  return (c.inventory||[]).find(function(i){ return isBodyArmor(i) && i.equipped; }) || null;
}
/* The infused boots, helmet or weapon of the armor `armorId` (by default
   the Arcane Armor worn now), or null. */
export function armorPartItem(c, part, armorId){
  if(armorId===undefined){ var worn = arcaneArmor(c); armorId = worn && worn.id; }
  if(!armorId) return null;
  return (c.inventory||[]).find(function(i){ return i.armorPart===part && i.partOf===armorId; }) || null;
}
/* The armor parts an infusion could go on now: [{part, label, reason}]
   ("" when free). Empty without Armor Modifications, a worn armor, or a
   part of the infusion's kind. */
export function armorPartOptions(c, data){
  var part = data && PART_FOR_TARGET[data.target];
  var armor = arcaneArmor(c);
  if(!part || !armor) return [];
  var item = armorPartItem(c, part, armor.id), on = item && infusionOn(c, item);
  return [{part: part, label: ARMOR_PARTS[part], reason: on ? "has " + on.name : ""}];
}
/* How many items can be infused at once: `total`, of which `parts` only
   for armor parts and `general` for anything. `total` defaults to the
   artificer table plus Armor Modifications' 2. */
export function infusionLimits(c, total){
  var parts = hasArmorModifications(c) ? 2 : 0;
  var t = total!=null ? total : infusedItemsAt(artificerLevel(c)) + parts;
  return {total: t, parts: parts, general: Math.max(0, t - parts)};
}
/* The infusions that end, oldest first, to make room for one more on an
   armor part (`isPart`) or on anything else. */
export function infusionsToEnd(c, isPart, total){
  var lim = infusionLimits(c, total);
  var left = ((c.infusions && c.infusions.active) || []).slice(), out = [];
  var general = function(){ return left.filter(function(a){ return !a.part; }); };
  while(left.length){
    var victim = !isPart && general().length >= lim.general ? general()[0]
      : left.length >= lim.total ? left[0] : null;
    if(!victim) break;
    out.push(victim);
    left.splice(left.indexOf(victim), 1);
  }
  return out;
}

/* Put a known infusion on an object. opts: {itemId} for an inventory
   item, {newItem: "Ring"} to add a plain one first, {part: "boots"} for
   an Arcane Armor part, nothing for Replicate Magic Item (the item is
   made); `choice` for Resistant Armor's damage type. Past `maxActive`
   (the total) the oldest infusion ends first, as in the rules.
   Returns the new active entry, or null if the item can't take it. */
export function infuseItem(c, known, opts, maxActive){
  var inf = c.infusions;
  var data = INFUSIONS.find(function(i){ return i.name===known.name; }) || {};
  opts = opts || {};
  var item = null, made = false, part = "";
  if(opts.part){
    var po = armorPartOptions(c, data).find(function(o){ return o.part===opts.part; });
    if(!po || po.reason) return null;
    part = opts.part;
    item = {id: uid(), name: ARMOR_PARTS[part], type:"gear", qty:1, equipped:true, notes:"Part of your Arcane Armor", weight:0,
      armorPart: part, partOf: arcaneArmor(c).id};
  } else if(data.target==="replica"){
    item = {id: uid(), name: known.note || "Replicated item", type:"gear", qty:1, equipped:false, notes:"", weight:0};
    made = true;
  } else if(opts.newItem){
    var g = GEAR_DATA[opts.newItem] || {};
    item = {id: uid(), name: opts.newItem, type:"gear", qty:1, equipped:false, notes: g.notes||"", weight: g.weight||0};
  } else {
    var pick = infusionTargets(c, data).find(function(t){ return t.item.id===opts.itemId; });
    if(!pick || pick.reason) return null;
    item = pick.item;
    var worn = arcaneArmor(c);
    if(worn && worn.id===item.id) part = "chest";
  }
  infusionsToEnd(c, !!part, maxActive).forEach(function(a){ endInfusion(c, a); });
  if(!item.id) item.id = uid();
  if(c.inventory.indexOf(item)===-1) c.inventory.push(item);
  var entry = {id: uid(), knownId: known.id, name: known.name + (known.note ? ": "+known.note : ""),
    itemId: item.id, itemName: item.name, bonus: 0, attunement: infusionNeedsAttunement(known.name, known.note), wornSet: true};
  if(made) entry.made = true;
  if(part) entry.part = part;
  if(opts.choice) entry.choice = opts.choice;
  // A new homunculus forms around the gem, at full hit points.
  if(known.name==="Homunculus Servant" && c.companions) delete c.companions.homunculus_servant;
  inf.active.push(entry);
  putOn(c, item, data);
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

/* An infusion that works only worn or held (`worn`): plain gear that
   bears it is put on, or picked up when a hand is free. Weapons, shields
   and armor keep the Equip button they already have. */
function putOn(c, item, data){
  if(!data || !data.worn || item.armorPart || item.equipped || item.type==="weapon" || item.type==="armor") return false;
  if(data.worn==="hold" && handsInUse(c, item).used >= 2) return false;
  item.equipped = true;
  return true;
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
  var active = (inf && inf.active) || [];
  // An Arcane Armor part goes with its armor, and is only an item while infused.
  var invBefore = (c.inventory||[]).length;
  var ids = (c.inventory||[]).map(function(i){ return i.id; });
  c.inventory = (c.inventory||[]).filter(function(i){
    return !i.armorPart || (ids.indexOf(i.partOf)!==-1 && active.some(function(a){ return a.itemId===i.id; }));
  });
  var changed = c.inventory.length !== invBefore;
  if(!active.length) return changed;
  ids = c.inventory.map(function(i){ return i.id; });
  var before = active.length;
  inf.active = active.filter(function(a){ return !a.itemId || ids.indexOf(a.itemId)!==-1; });
  return changed || inf.active.length !== before;
}
/* After the artificer level changes (a level-up or its undo) or an
   infused item's attunement does: bonuses that scale move to +2 at level
   10 (or back to +1), one that needs attunement counts only while
   attuned, and below level 2, where there are no infusions, every one
   ends. True if anything changed. */
export function syncInfusions(c){
  var inf = c.infusions;
  if(!inf || !(inf.active||[]).length) return false;
  // (Below level 2, or a 2024 artificer, who makes items from plans.)
  if(tashaLevel(c) < 2){
    inf.active.slice().forEach(function(a){ endInfusion(c, a); });
    return true;
  }
  var changed = false;
  // Below Armorer 9 the armor is one item again: its parts' infusions end.
  if(!hasArmorModifications(c)){
    inf.active.slice().forEach(function(a){
      if(!a.part) return;
      if(a.part==="chest") delete a.part; else endInfusion(c, a);
      changed = true;
    });
  }
  inf.active.forEach(function(a){
    var known = (inf.known||[]).find(function(k){ return k.id===a.knownId; });
    var name = known ? known.name : String(a.name||"").replace(/:.*$/, "");
    var item = a.itemId && (c.inventory||[]).find(function(i){ return i.id===a.itemId; });
    // Saved before worn-or-held mattered (2026-11-12): carried gear counted
    // as in use, so it's put on once to keep working.
    if(item && !a.wornSet){
      putOn(c, item, INFUSIONS.find(function(i){ return i.name===name; }));
      a.wornSet = true;
      changed = true;
    }
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
  var intMod = mod(abilityScore(c, "int"));
  var out = [];
  var effect = elixirEffect(name);
  if(effect && effect.heal) out.push({label: "Heal", dice: parseDiceNotation(effect.heal), diceText: effect.heal, bonus: intMod});
  if(cl && (Number(cl.level)||1) >= 9) out.push({label: "Temp HP", dice: parseDiceNotation("2d6"), diceText: "2d6", bonus: Math.max(1, intMod)});
  return out;
}

/* ---- Class automation Phase 13 (checked against Tasha's Cauldron on
   5etools' data 2026-10-30) ---- */
/* Flash of Genius (7): INT on a check or save, a use each. */
export function flashOfGenius(c){
  return resourceLeft(c, "Artificer:flash_of_genius") > 0 ? Math.max(1, mod(abilityScore(c, "int"))) : 0;
}
/* Soul of Artifice (20): +1 to saves per attuned magic item. */
export function soulOfArtificeBonus(c){
  if(tashaLevel(c) < 20) return 0;
  return (c.inventory||[]).filter(function(i){ return i.attuned; }).length;
}
/* Soul of Artifice: an infusion ends and you have 1 hit point instead of 0. */
export function soulOfArtificeReady(c){
  return tashaLevel(c) >= 20 && !!(c.infusions && (c.infusions.active||[]).length);
}
/* Tool Expertise (6): every tool you're proficient with. */
export function hasToolExpertise(c){
  return tashaLevel(c) >= 6;
}

/* ---- Tinker's Magic (2024 artificer, level 1) ----
   An everyday item from TINKER_ITEMS, made with a use, kept in the
   inventory (`tinkered`) until the next long rest. */
export function makeTinkerItem(c, name){
  var t = TINKER_ITEMS.find(function(i){ return i.name===name; });
  if(!t || resourceLeft(c, "Artificer:tinkers_magic") <= 0) return null;
  var g = (t.gear && GEAR_DATA[t.gear]) || {};
  var item = {id: uid(), name: t.gear || t.name, type: "gear", qty: 1, equipped: false, weight: g.weight || 0,
    notes: "Tinker's Magic: vanishes on your next long rest" + (t.notes ? ". " + t.notes : g.notes ? ". " + g.notes : ""), tinkered: true};
  if(!c.inventory) c.inventory = [];
  c.inventory.push(item);
  if(!c.resourcesUsed) c.resourcesUsed = {};
  c.resourcesUsed["Artificer:tinkers_magic"] = (Number(c.resourcesUsed["Artificer:tinkers_magic"])||0) + 1;
  return item;
}
/* A long rest: the made items vanish. Their names, for the log. */
export function tinkerItemsOnLongRest(c){
  var gone = (c.inventory||[]).filter(function(i){ return i.tinkered; }).map(function(i){ return i.name; });
  if(gone.length) c.inventory = c.inventory.filter(function(i){ return !i.tinkered; });
  return gone;
}
/* Arcane Jolt (Battle Smith 9): 2d6, 4d6 from 15, on a magic weapon's hit.
   Shaped like rangerHitDice, paid with a use. */
export function artificerHitDice(c, item){
  var bs = classLevelOf(c, "Artificer", "Battle Smith");
  if(bs < 9 || !item || !isMagicWeapon(c, item) || resourceLeft(c, "Artificer:arcane_jolt") <= 0) return [];
  var qty = bs >= 15 ? 4 : 2;
  return [{id: "arcane_jolt", name: "Arcane Jolt", text: "Arcane Jolt " + qty + "d6", qty: qty, die: 6, label: "Arcane Jolt (Force, or healing within 30 ft of the target)",
    title: "Once per turn on a hit with a magic weapon: force damage, or the same healing for a creature within 30 ft of the target", unarmed: false, pay: "Artificer:arcane_jolt"}];
}
