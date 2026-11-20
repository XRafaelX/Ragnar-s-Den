/* ---------------- The printed character sheet's contents ----------------
   Everything the printout shows, worked out from the character with the
   same functions the sheet uses, as plain data. js/render/print-sheet.js
   lays it out like the classic three-page character sheet (page 1 the
   stats, page 2 details and story, page 3 spellcasting), then the pages
   with every feature's and spell's full text.
   printSheetData(c, {playerName, printedAt}) -> {
     header, abilities, inspiration, profBonus, saves, skills,
     passivePerception, proficiencies, languages, senses,
     ac, initiative, speed, hpMax, hitDice, attacks, attackNotes,
     equipment, coins, personality, uses, features,
     details, photo, faith, backstory,
     spellcasting (null for a non-caster), featureTexts, spellTexts,
     journal, footer } */
import { mod, fmtMod, profBonus, totalLevel, ordinal } from "./basics.js";
import { abilityScore } from "./ability-scores.js";
import { computeArmorClass, computeInitiative, computeSave, computeSpeed, maxHp, getCharacterSenses } from "./vitals.js";
import { skillCheck, passivePerception } from "./checks.js";
import { weaponAttackBonus, weaponDamageBonus, unarmedStrike } from "./equipment.js";
import { weaponSummary } from "./weapon-summary.js";
import { hitDicePools, characterResources } from "./character-resources.js";
import { getAllCharacterFeatures, characterIsCaster } from "./class-features.js";
import { featureSpells } from "./spell-grants.js";
import { spellcastingStats, characterProficiencies } from "./sheet-numbers.js";
import { storyShape, storyTables } from "./background-story.js";
import { godByText } from "./faith.js";
import { useSpellsOf } from "./spell-edition.js";
import { spellScalingLine } from "./spell-scaling.js";
import { ABILITIES, SKILLS } from "../data/abilities-skills.js";
import { SPELL_DATA, catalogSpellName } from "../data/spells.js";
import { APPEARANCE_FIELDS } from "./character.js";

var ABBR = {str: "Str", dex: "Dex", con: "Con", int: "Int", wis: "Wis", cha: "Cha"};
/* Pencil boxes for a use count up to this; a bigger pool gets a line. */
export var MAX_USE_BOXES = 10;

function classAndLevel(c){
  return (c.classes||[]).map(function(cl){
    return cl.name + (cl.subclass ? " (" + cl.subclass + ")" : "") + " " + (Number(cl.level)||1);
  }).join(" / ");
}

/* "3d10 + 2d8": the hit dice per die size, biggest first. */
function hitDiceText(c){
  return hitDicePools(c).map(function(p){ return p.total + "d" + p.die; }).join(" + ");
}

/* Attack rows: weapons in hand (all weapons carried if none is), then an
   unarmed strike that rolls its own die (a monk's, a tabaxi's claws). */
function attackRows(c){
  var weapons = (c.inventory||[]).filter(function(i){ return i.type==="weapon"; });
  var held = weapons.filter(function(i){ return i.equipped; });
  var rows = (held.length ? held : weapons).map(function(item){
    var s = weaponSummary(c, item);
    var dice = s.parts.length && item.damageDice ? s.parts[0].split(" ")[0] : (item.damageDice || "");
    var bonus = weaponDamageBonus(c, item);
    return {
      name: item.name || "Weapon",
      bonus: fmtMod(weaponAttackBonus(c, item)),
      damage: (dice ? dice + (bonus ? (bonus > 0 ? " + " : " - ") + Math.abs(bonus) : "") : "") + (s.damageType ? " " + s.damageType.toLowerCase() : "")
    };
  });
  var u = unarmedStrike(c);
  if(u && u.die){
    rows.push({name: u.name, bonus: fmtMod(u.attack),
      damage: "1d" + u.die + (u.bonus ? (u.bonus > 0 ? " + " : " - ") + Math.abs(u.bonus) : "") + " " + String(u.type).toLowerCase()});
  }
  return rows;
}

/* Limited uses (Rage, Second Wind, Bardic Inspiration): {name, max, reset,
   boxes}. boxes is false for a pool too big to tick (Lay on Hands 25). */
function useRows(c){
  return characterResources(c).filter(function(r){ return r.max && r.max !== Infinity; }).map(function(r){
    return {name: r.name, max: r.max, reset: r.reset === "short" ? "short rest" : r.reset === "long" ? "long rest" : (r.reset || ""),
      boxes: r.max <= MAX_USE_BOXES};
  });
}

/* The spells the character has: its own list, then what features give
   that isn't on it, each once. */
function spellList(c){
  var seen = {}, out = [];
  (c.spells||[]).forEach(function(sp){
    var name = (sp.name||"").trim();
    if(!name || seen[name.toLowerCase()]) return;
    seen[name.toLowerCase()] = true;
    out.push({name: name, level: Number(sp.level)||0, prepared: (Number(sp.level)||0) === 0 || !!sp.prepared, sp: sp, note: ""});
  });
  featureSpells(c).forEach(function(fs){
    if(fs.kind === "expanded") return;          // a patron's list to choose from, not spells known
    var name = (fs.name||"").trim();
    if(!name || seen[name.toLowerCase()]) return;
    seen[name.toLowerCase()] = true;
    out.push({name: name, level: Number(fs.level)||0, prepared: true, sp: null, note: fs.kindLabel || fs.source || ""});
  });
  return out.sort(function(a, b){ return a.level - b.level || a.name.localeCompare(b.name); });
}

function spellText(c, s){
  // The saved copy's words (the player may have edited them), the
  // catalog's for anything it leaves out.
  var d = Object.assign({}, SPELL_DATA[catalogSpellName(s.name)] || {});
  if(s.sp) Object.keys(s.sp).forEach(function(k){ if(s.sp[k] !== undefined && s.sp[k] !== "" && s.sp[k] !== null) d[k] = s.sp[k]; });
  var levelLine = s.level === 0 ? (d.school ? d.school + " cantrip" : "Cantrip") : ordinal(s.level) + "-level" + (d.school ? " " + d.school.toLowerCase() : "");
  var tags = [d.concentration ? "concentration" : "", d.ritual ? "ritual" : ""].filter(Boolean);
  var meta = [
    d.castingTime ? "Casting time: " + d.castingTime : "",
    d.range ? "Range: " + d.range : "",
    d.components ? "Components: " + d.components + (d.material ? " (" + d.material + ")" : "") : "",
    d.duration ? "Duration: " + d.duration : ""
  ].filter(Boolean);
  var scaling = "";
  try{ scaling = spellScalingLine(c, s.name, s.level, {}) || ""; }catch(e){ scaling = ""; }
  return {name: s.name, level: s.level, line: levelLine + (tags.length ? " (" + tags.join(", ") + ")" : ""),
    meta: meta, text: d.summary || "", scaling: scaling, note: s.note};
}

function spellcastingPage(c, list){
  if(!characterIsCaster(c) && !list.length) return null;
  var stats = characterIsCaster(c) ? spellcastingStats(c) : null;
  var rows = !stats ? [] : stats.multi ? stats.rows.map(function(r){
    return {className: r.classes.join(" / "), ability: r.ability.toUpperCase(), dc: r.dc, attack: fmtMod(r.attack)};
  }) : [{className: (c.classes||[]).filter(function(cl){ return characterIsCaster({classes: [cl]}); }).map(function(cl){ return cl.name; }).join(" / ") || "Spellcasting",
    ability: stats.ability.toUpperCase(), dc: stats.dc, attack: fmtMod(stats.attack)}];
  var slots = (c.spellcasting && c.spellcasting.slots) || {};
  var pact = c.spellcasting && c.spellcasting.pact;
  var levels = [];
  for(var lv = 0; lv <= 9; lv++){
    var s = lv > 0 ? slots[lv] : null;
    levels.push({level: lv, slotsTotal: s && s.max ? s.max : 0,
      spells: list.filter(function(x){ return x.level === lv; }).map(function(x){ return {name: x.name, prepared: x.prepared, note: x.note}; })});
  }
  return {rows: rows, levels: levels, pact: pact && pact.max ? {max: pact.max, slotLevel: pact.slotLevel} : null};
}

function faithOf(c){
  var s = storyShape(c);
  if(!s.faith) return null;
  var g = godByText(s.faith, c);
  return g ? {name: g.name, title: g.title || g.about || "", symbol: g.symbol || "", icon: g.icon || "", custom: !!g.custom}
    : {name: s.faith, title: "", symbol: "", icon: "", custom: true};
}

/* The background's story tables that have an answer, as {label, text}. */
function backstoryRows(c){
  var s = storyShape(c), tables = storyTables(c.background || "").story || [];
  var labels = tables.map(function(t){ return t.label; });
  // Answers kept from an earlier background stay too.
  Object.keys(s.tables).forEach(function(k){ if(labels.indexOf(k) === -1) labels.push(k); });
  return labels.filter(function(k){ return (s.tables[k]||"").trim(); }).map(function(k){ return {label: k, text: s.tables[k].trim()}; });
}

export function printSheetData(c, opts){
  opts = opts || {};
  useSpellsOf(c);   // the character's own edition of every spell
  var s = storyShape(c);
  var prof = characterProficiencies(c);
  var speed = computeSpeed(c);
  var spells = spellList(c);
  var features = getAllCharacterFeatures(c);
  var printedAt = opts.printedAt || new Date();
  return {
    header: {
      name: c.name || "Unnamed", classLevel: classAndLevel(c), background: c.background || "",
      playerName: opts.playerName || "", race: c.race || "", alignment: c.alignment || "", xp: Number(c.xp)||0
    },
    abilities: ABILITIES.map(function(a){
      var score = abilityScore(c, a[0]);
      return {key: a[0], name: a[1], score: score, mod: fmtMod(mod(score))};
    }),
    inspiration: (Number(c.inspiration)||0) > 0 ? Number(c.inspiration) : 0,
    profBonus: fmtMod(profBonus(c)),
    saves: ABILITIES.map(function(a){
      var sv = computeSave(c, a[0]);
      return {name: a[1], value: fmtMod(sv.value), prof: !!sv.prof};
    }),
    skills: SKILLS.map(function(sk){
      var entry = (c.skillProfs||{})[sk[0]] || {};
      var check = skillCheck(c, sk[0]);
      return {name: sk[0], ability: ABBR[sk[1]], value: fmtMod(check.value), prof: !!entry.prof || !!entry.expertise, expertise: !!entry.expertise};
    }),
    passivePerception: passivePerception(c),
    proficiencies: prof,
    languages: (c.languages && c.languages.length ? c.languages : ["Common"]).slice(),
    // (The sheet's line "Darkvision 60 ft, Blindsense 10 ft", as a list,
    // without its "No darkvision".)
    senses: String(getCharacterSenses(c) || "").split(/,\s*/).filter(function(x){ return x && x !== "No darkvision"; }),
    ac: computeArmorClass(c).value,
    initiative: fmtMod(computeInitiative(c).value),
    speed: {walk: speed.value, others: (speed.others||[]).map(function(o){
      return o.type.charAt(0).toUpperCase() + o.type.slice(1) + " " + o.value + " ft" + (o.when ? " (" + o.when + ")" : "");
    })},
    hpMax: maxHp(c),
    hitDice: hitDiceText(c),
    attacks: attackRows(c),
    equipment: (c.inventory||[]).map(function(i){
      return {name: i.name || "Item", qty: Number(i.qty)||1, equipped: !!i.equipped, attuned: !!i.attuned};
    }),
    coins: Object.assign({cp: 0, sp: 0, ep: 0, gp: 0, pp: 0}, c.currency || {}),
    personality: {traits: s.traits.filter(function(t){ return (t||"").trim(); }), ideal: s.ideal, bond: s.bond, flaw: s.flaw},
    uses: useRows(c),
    features: features.map(function(f){ return {name: f.name, source: f.source || ""}; }),
    details: APPEARANCE_FIELDS.map(function(f){ return {key: f[0], label: f[1], value: ((c.appearance||{})[f[0]] || "").trim()}; }),
    photo: c.avatar || null,
    faith: faithOf(c),
    backstory: backstoryRows(c),
    spellcasting: spellcastingPage(c, spells),
    featureTexts: features.map(function(f){ return {name: f.name, source: f.source || "", text: (f.text || "").trim()}; }),
    spellTexts: spells.map(function(x){ return spellText(c, x); }),
    journal: (c.notes||[]).filter(function(n){ return (n.title||"").trim() || (n.text||"").trim(); })
      .map(function(n){ return {title: (n.title||"").trim(), text: (n.text||"").trim()}; }),
    footer: {date: printedAt, level: totalLevel(c)}
  };
}
