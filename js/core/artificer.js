import { ARMOR_MODELS, ELIXIR_EFFECTS } from "../data/artificer-extras.js";
import { INFUSIONS } from "../data/infusions.js";
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
   in active.bonus, so ending it takes exactly that back off. */
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
export function endInfusion(c, active){
  var item = active.itemId && (c.inventory||[]).find(function(i){ return i.id===active.itemId; });
  if(item && active.bonus) item.magicBonus = (Number(item.magicBonus)||0) - active.bonus;
  c.infusions.active = c.infusions.active.filter(function(a){ return a.id!==active.id; });
}
/* After the artificer level changes (a level-up or its undo): bonuses
   that scale move to +2 at level 10 (or back to +1), and below level 2,
   where there are no infusions, every one ends. True if anything changed. */
export function syncInfusions(c){
  var inf = c.infusions;
  if(!inf || !(inf.active||[]).length) return false;
  if(artificerLevel(c) < 2){
    inf.active.slice().forEach(function(a){ endInfusion(c, a); });
    return true;
  }
  var changed = false;
  inf.active.forEach(function(a){
    if(!a.bonus) return;
    var known = (inf.known||[]).find(function(k){ return k.id===a.knownId; });
    var want = infusionBonus(c, known ? known.name : a.name);
    if(!want || want===a.bonus) return;
    var item = a.itemId && (c.inventory||[]).find(function(i){ return i.id===a.itemId; });
    if(item) item.magicBonus = (Number(item.magicBonus)||0) + want - a.bonus;
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
