/* ---------------- Background starting equipment ----------------
   Turns a background's kit (js/data/background-equipment.js) into the
   choices it asks for, then into inventory items and coins.

   Choices ("slots") are keyed by the item's place in the kit: "3" for the
   fourth item. A pick's option that asks something itself (Guild
   Merchant's "artisan's tools" option) adds "3.0"; a trinket rolled more
   than once adds "5#1", "5#2"; a Dimir Operative's secondary guild is
   "guild" and that guild's own slots "guild/3". Values: a pick's option
   index ("0"), a group's tool name ("Smith's Tools"), a trinket's entry
   number on its table ("37"), the guild's background name. */
import { BACKGROUND_EQUIPMENT, BACKGROUND_EQUIPMENT_SAME_AS, RAVNICA_GUILD_BACKGROUNDS } from "../data/background-equipment.js";
import { GEAR_DATA, GEAR_GROUPS } from "../data/gear.js";
import { WEAPON_DATA } from "../data/weapons.js";
import { TRINKET_TABLES } from "../data/trinkets.js";

export function backgroundKit(background){
  return BACKGROUND_EQUIPMENT[BACKGROUND_EQUIPMENT_SAME_AS[background] || background] || null;
}

/* ---- Trinkets ---- */
export function trinketTable(id){ return TRINKET_TABLES[id] || null; }
/* The d100 roll for an entry ("37", or "1-2" on a table of pairs). */
export function trinketRollLabel(id, entry){
  var t = trinketTable(id), per = t ? t.per : 1;
  return per === 1 ? String(entry) : ((entry - 1) * per + 1) + "-" + (entry * per);
}
export function trinketText(id, entry){
  var t = trinketTable(id);
  return t && t.entries[entry - 1] || "";
}
/* Roll on a table: a d100, read as the entry it lands on. `rng` returns
   a number in [0, 1) (Math.random by default). */
export function rollTrinket(id, rng){
  var t = trinketTable(id);
  if(!t) return 0;
  var d100 = Math.floor((rng || Math.random)() * 100) + 1;
  return Math.ceil(d100 / t.per);
}

/* ---- Slots ---- */
function gearGroupNames(groups){
  return groups.reduce(function(a, gName){ return a.concat(GEAR_GROUPS[gName] || []); }, []);
}
export function entryLabel(e){
  if(typeof e === "string") return e;
  if(Array.isArray(e)) return e.length ? e.map(entryLabel).join(" and ") : "Nothing to carry";
  if(e.none) return e.none;
  if(e.pick) return e.pick;
  if(e.group) return e.label;
  if(e.trinket) return e.label + (e.count > 1 ? " (" + e.count + ")" : "");
  if(e.weapon) return e.name || e.weapon;
  return e.name || e.gear || "";
}
/* The choices a kit asks for, given the picks made so far (an option
   that asks something itself shows its slot once chosen). ctx:
   {toolPicks: tools the background's proficiency gave}. Each slot:
   {key, kind ("pick", "group", "trinket", "guild"), label, options
   ([{value, label}]; a trinket's: its table's entries), table}. */
export function kitSlots(background, picks, prefix){
  var kit = backgroundKit(background), out = [];
  picks = picks || {}; prefix = prefix || "";
  if(!kit) return out;
  function visit(e, key){
    if(!e || typeof e === "string" || Array.isArray(e)) return;
    if(e.pick){
      out.push({key: key, kind: "pick", label: e.pick, options: e.options.map(function(o, i){ return {value: String(i), label: entryLabel(o)}; })});
      var chosen = e.options[Number(picks[key] || 0)];
      if(Array.isArray(chosen)) chosen.forEach(function(x, j){ visit(x, key + "." + j); });
      else visit(chosen, key + ".0");
    } else if(e.group){
      out.push({key: key, kind: "group", label: e.label, groups: e.group, options: gearGroupNames(e.group).map(function(nm){ return {value: nm, label: nm}; })});
    } else if(e.trinket){
      var t = trinketTable(e.trinket);
      for(var k = 0; k < (e.count || 1); k++){
        out.push({key: key + (e.count > 1 ? "#" + (k + 1) : ""), kind: "trinket", table: e.trinket, label: e.label + (e.count > 1 ? " " + (k + 1) : ""),
          options: t.entries.map(function(text, i){ return {value: String(i + 1), label: trinketRollLabel(e.trinket, i + 1) + ". " + text}; })});
      }
    }
  }
  kit.items.forEach(function(e, i){ visit(e, prefix + i); });
  if(kit.secondaryGuild && !prefix){
    out.push({key: "guild", kind: "guild", label: "Secondary guild (your cover identity)",
      options: RAVNICA_GUILD_BACKGROUNDS.map(function(b){ return {value: b, label: b.replace(/ (Functionary|Legionnaire|Agent|Anarch|Engineer|Representative|Cultist|Initiate|Scientist)$/, "")}; })});
    var guild = picks.guild || RAVNICA_GUILD_BACKGROUNDS[0];
    out = out.concat(kitSlots(guild, picks, "guild/"));
  }
  return out;
}
/* A starting value for every slot not picked yet: a pick's first option,
   a group's tool the background's proficiency chose (else the first), a
   rolled trinket, the first guild. Fills `picks` and returns it. */
export function fillKitPicks(background, picks, ctx, rng){
  picks = picks || {};
  var toolPicks = ((ctx && ctx.toolPicks) || []).map(function(t){ return t.toLowerCase(); });
  for(var guard = 0; guard < 4; guard++){
    var changed = false;
    kitSlots(background, picks).forEach(function(s){
      if(picks[s.key] != null && s.options.some(function(o){ return o.value === picks[s.key]; })) return;
      changed = true;
      if(s.kind === "trinket") picks[s.key] = String(rollTrinket(s.table, rng));
      else if(s.kind === "group"){
        var mine = s.options.find(function(o){ return toolPicks.indexOf(o.value.toLowerCase()) !== -1; });
        picks[s.key] = (mine || s.options[0]).value;
      } else picks[s.key] = s.options[0].value;
    });
    if(!changed) break;
  }
  return picks;
}

/* ---- Items ---- */
function gearItem(name, over){
  var d = GEAR_DATA[name] || {}, n = (over && over.qty) || d.qty || 1;
  return {name: (over && over.name) || name, type: "gear", qty: n, equipped: false,
    notes: (over && over.notes) || d.notes || "", weight: d.weight ? d.weight / (d.qty || 1) : 0};
}
function weaponItem(e){
  var d = WEAPON_DATA[e.weapon] || {};
  var props = (d.properties || "").toLowerCase();
  return {name: e.weapon, type: "weapon", qty: 1, equipped: false, notes: e.name ? e.name + (props ? "; " + props : "") : props,
    damageDice: d.damageDice || "", damageType: d.damageType || "", ability: d.finesse ? "finesse" : d.ranged ? "dex" : "str",
    proficient: true, magicBonus: 0, weight: d.weight || 0, picked: true};
}
/* The kit as inventory items, with the picks (missing ones filled as
   fillKitPicks does): {items, coins: {gp, sp, pp}, notes: [text]}. A
   weapon is marked `picked` (its proficiency is worked out where it's
   added). */
export function kitItems(background, picks, ctx, rng){
  var kit = backgroundKit(background);
  var out = {items: [], coins: {}, notes: []};
  if(!kit) return out;
  picks = fillKitPicks(background, Object.assign({}, picks || {}), ctx, rng);
  function add(e, key){
    if(!e) return;
    if(typeof e === "string"){ out.items.push(gearItem(e)); return; }
    if(Array.isArray(e)){ e.forEach(function(x, j){ add(x, key + "." + j); }); return; }
    if(e.pick){
      var chosen = e.options[Number(picks[key] || 0)];
      if(Array.isArray(chosen)) chosen.forEach(function(x, j){ add(x, key + "." + j); });
      else add(chosen, key + ".0");
      return;
    }
    if(e.group){ out.items.push(gearItem(picks[key])); return; }
    if(e.trinket){
      for(var k = 0; k < (e.count || 1); k++){
        var tk = key + (e.count > 1 ? "#" + (k + 1) : "");
        out.items.push({name: trinketText(e.trinket, Number(picks[tk])), type: "gear", qty: 1, equipped: false, weight: 0,
          notes: e.label + " (" + trinketTable(e.trinket).label + ", " + trinketRollLabel(e.trinket, Number(picks[tk])) + ")"});
      }
      return;
    }
    if(e.weapon){ out.items.push(weaponItem(e)); return; }
    if(e.none) return;
    if(e.gear){ out.items.push(gearItem(e.gear, e)); return; }
    out.items.push({name: e.name, type: "gear", qty: e.qty || 1, equipped: false, notes: e.notes || "", weight: 0});
  }
  function addKit(bg, prefix){
    var k = backgroundKit(bg);
    k.items.forEach(function(e, i){ add(e, prefix + i); });
    Object.keys(k.coins || {}).forEach(function(c){ out.coins[c] = (out.coins[c] || 0) + k.coins[c]; });
    if(k.note) out.notes.push(k.note);
  }
  addKit(background, "");
  if(kit.secondaryGuild) addKit(picks.guild, "guild/");
  return out;
}
/* One line for the coins: "15 gp", "1 pp", "5 gp" (or "" for none). */
export function coinsText(coins){
  return ["pp", "gp", "sp", "cp"].filter(function(k){ return coins && coins[k]; }).map(function(k){ return coins[k] + " " + k; }).join(", ");
}

/* Add the kit to a character: items into the pack (gear stacks with
   gear of the same name), coins into the purse. Records it on
   c.backgroundGear so it's offered once only. Returns kitItems' result. */
export function addBackgroundKit(c, background, picks, ctx, rng){
  var res = kitItems(background, picks, ctx, rng);
  if(!Array.isArray(c.inventory)) c.inventory = [];
  res.items.forEach(function(item){
    var same = item.type === "gear" && c.inventory.find(function(i){
      return i.type === "gear" && (i.name || "").toLowerCase() === item.name.toLowerCase() && (i.notes || "") === (item.notes || "");
    });
    if(same) same.qty = (Number(same.qty) || 0) + item.qty;
    else c.inventory.push(item);
  });
  if(!c.currency) c.currency = {cp: 0, sp: 0, ep: 0, gp: 0, pp: 0};
  Object.keys(res.coins).forEach(function(k){ c.currency[k] = (Number(c.currency[k]) || 0) + res.coins[k]; });
  c.backgroundGear = {background: background, added: true};
  return res;
}
/* An older sheet's background kit, not yet offered: true when it can be
   added (a kit exists, nothing recorded yet). */
export function backgroundKitOffered(c){
  return !!(c && c.background && backgroundKit(c.background) && !c.backgroundGear);
}
