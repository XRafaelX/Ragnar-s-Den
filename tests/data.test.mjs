/* Data integrity: the class, subclass and resource tables are well formed.
   These catch typos and half-finished entries, not rules mistakes. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLASS_PROGRESSION, SUBCLASSES, MAX_LEVEL, XP_THRESHOLDS, SPELL_SLOT_TABLE, PACT_SLOT_TABLE, SPELL_TIPS, THIRD_CASTER_SPELL_TIPS } from "../js/data/progression.js";
import { CLASS_RESOURCES, SUBCLASS_RESOURCES } from "../js/data/resources.js";
import { CLASSES_INFO } from "../js/data/classes.js";
import { SPELL_DATA, catalogSpellName } from "../js/data/spells.js";
import { BACKGROUNDS, BACKGROUND_INFO, BACKGROUND_LANGUAGES, BACKGROUND_TOOLS } from "../js/data/backgrounds.js";
import { SKILLS } from "../js/data/abilities-skills.js";
import { INVOCATIONS, PACT_BOONS, INVOCATION_SOURCES, invocationsKnownAt } from "../js/data/invocations.js";
import { FEATS_CATALOG } from "../js/data/feats.js";

const CLASSES = Object.keys(CLASS_PROGRESSION);
const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
const FEATURE_KEYS = new Set(["name", "text", "replaces", "speed", "speedWhen", "initiative", "acHeavyArmor", "grants",
  "magicWeaponAbility", "chosenWeaponAbility", "abilityBonus", "abilityMax", "saveBonus", "spells", "spellKind", "spellChoice", "speeds", "darkvision", "extraSpellList", "halfProficiency", "styleChoice"]);
const LONG_DASH = /[–—]/;

// Lowest acceptable last-feature level per class: guards against a
// subclass being left unfinished (as 46 of them once stopped at level 5).
const MIN_TOP_LEVEL = { Artificer: 15, Barbarian: 14, Bard: 14, Cleric: 17, Druid: 14, Fighter: 15,
  Monk: 17, Paladin: 20, Ranger: 15, Rogue: 17, Sorcerer: 18, Warlock: 14, Wizard: 14 };

function levels(features){ return Object.keys(features).map(Number); }

function checkFeature(f, where){
  assert.equal(typeof f.name, "string", where + ": name");
  assert.ok(f.name.trim(), where + ": empty name");
  assert.equal(typeof f.text, "string", where + " " + f.name + ": text");
  assert.ok(f.text.trim().length > 10, where + " " + f.name + ": text too short");
  assert.ok(!LONG_DASH.test(f.name + f.text), where + " " + f.name + ": long dash in text");
  for(const k of Object.keys(f)) assert.ok(FEATURE_KEYS.has(k), where + " " + f.name + ": unknown field " + k);
  if(f.speed != null) assert.ok(Number.isInteger(f.speed) && f.speed > 0, where + " " + f.name + ": speed");
  if(f.initiative != null) assert.ok([...ABILITIES, "pb"].includes(f.initiative), where + " " + f.name + ": initiative");
  if(f.saveBonus != null) assert.ok(ABILITIES.includes(f.saveBonus), where + " " + f.name + ": saveBonus");
  for(const k of ["magicWeaponAbility", "chosenWeaponAbility"]) if(f[k] != null) assert.ok(ABILITIES.includes(f[k]), where + " " + f.name + ": " + k);
  if(f.grants){
    for(const k of Object.keys(f.grants)) assert.ok(["armor", "weapons", "tools", "savingThrows"].includes(k), where + " " + f.name + ": grants." + k);
    (f.grants.savingThrows || []).forEach((s) => assert.ok(ABILITIES.includes(s), where + " " + f.name + ": grants save " + s));
  }
  const checkSpells = (spells, label) => {
    const names = Array.isArray(spells) ? spells : Object.values(spells).flat();
    assert.ok(names.length, where + " " + label + ": empty spell list");
    names.forEach((n) => assert.ok(SPELL_DATA[catalogSpellName(n)], where + " " + label + ": spell not in the catalog: " + n));
    if(!Array.isArray(spells)) Object.keys(spells).forEach((k) => assert.ok(+k >= 1 && +k <= MAX_LEVEL, where + " " + label + ": spell level key " + k));
  };
  if(f.spells || f.spellChoice){
    assert.ok(["prepared", "known", "spellbook", "ritual", "expanded"].includes(f.spellKind), where + " " + f.name + ": spellKind " + f.spellKind);
    if(f.spells) checkSpells(f.spells, f.name);
    if(f.spellChoice){
      assert.ok(f.spellChoice.id && f.spellChoice.label, where + " " + f.name + ": spellChoice needs id and label");
      const opts = Object.keys(f.spellChoice.options || {});
      assert.ok(opts.length >= 2, where + " " + f.name + ": spellChoice needs options");
      opts.forEach((o) => checkSpells(f.spellChoice.options[o], f.name + " (" + o + ")"));
    }
  } else assert.ok(f.spellKind == null, where + " " + f.name + ": spellKind without spells");
  (f.speeds || []).forEach((sp) => {
    assert.ok(["fly", "swim", "climb"].includes(sp.type), where + " " + f.name + ": speed type " + sp.type);
    assert.ok(sp.bonus > 0 || sp.value === "walk" || sp.value === "2walk" || sp.value > 0, where + " " + f.name + ": speed value");
    assert.ok(!(sp.bonus && sp.when), where + " " + f.name + ": a speed bonus has no condition");
  });
  if(f.abilityBonus){
    for(const [k, v] of Object.entries(f.abilityBonus)) assert.ok(ABILITIES.includes(k) && v > 0, where + " " + f.name + ": abilityBonus");
  }
}

test("every class has progression, level 1 info and a subclass list", () => {
  assert.equal(CLASSES.length, 13);
  for(const cls of CLASSES){
    assert.ok(CLASSES_INFO[cls], cls + " missing from CLASSES_INFO");
    assert.ok(Array.isArray(SUBCLASSES[cls]) && SUBCLASSES[cls].length, cls + " has no subclasses");
    const p = CLASS_PROGRESSION[cls];
    assert.ok(p.subclassLevel >= 1 && p.subclassLevel <= 3, cls + " subclassLevel");
    p.asiLevels.forEach((l) => assert.ok(l >= 4 && l <= 19, cls + " ASI level " + l));
  }
});

test("class features: levels 2 to 20, well formed, replaces point backwards", () => {
  for(const cls of CLASSES){
    const seen = new Set((CLASSES_INFO[cls].features || []).map((f) => f.name));
    for(const lv of levels(CLASS_PROGRESSION[cls].features).sort((a, b) => a - b)){
      assert.ok(lv >= 2 && lv <= MAX_LEVEL, cls + " feature level " + lv);
      for(const f of CLASS_PROGRESSION[cls].features[lv]){
        checkFeature(f, cls + " " + lv);
        if(f.replaces) assert.ok(seen.has(f.replaces), cls + " " + lv + ": replaces unknown " + f.replaces);
        seen.add(f.name);
      }
    }
    // Every class gains something from level 10 on (not capped at 5 any more).
    assert.ok(levels(CLASS_PROGRESSION[cls].features).some((l) => l >= 10), cls + " has no features from level 10 on");
  }
});

test("subclasses: complete, unique, well formed", () => {
  let total = 0;
  for(const cls of CLASSES){
    const names = new Set();
    for(const sub of SUBCLASSES[cls]){
      total++;
      const where = cls + " / " + sub.name;
      assert.ok(sub.name && !names.has(sub.name), where + ": missing or duplicate name");
      names.add(sub.name);
      assert.ok(typeof sub.blurb === "string" && sub.blurb.length > 10, where + ": blurb");
      assert.ok(!LONG_DASH.test(sub.blurb), where + ": long dash in blurb");
      const lv = levels(sub.features);
      assert.ok(lv.length, where + ": no features");
      assert.ok(Math.min(...lv) >= CLASS_PROGRESSION[cls].subclassLevel, where + ": feature before the subclass level");
      assert.ok(Math.max(...lv) <= MAX_LEVEL, where + ": feature past the level cap");
      assert.ok(Math.max(...lv) >= MIN_TOP_LEVEL[cls], where + ": stops at level " + Math.max(...lv));
      const seen = new Set();
      const lastSpells = {};
      for(const l of lv.sort((a, b) => a - b)){
        for(const f of sub.features[l]){
          checkFeature(f, where + " " + l);
          if(f.replaces) assert.ok(seen.has(f.replaces), where + " " + l + ": replaces unknown " + f.replaces);
          seen.add(f.name);
          // A replacing spell list must keep every spell the previous one had.
          if(Array.isArray(f.spells)){
            (lastSpells[f.name] || []).forEach((n) => assert.ok(f.spells.includes(n), where + " " + l + " " + f.name + ": drops " + n));
            lastSpells[f.name] = f.spells;
          }
        }
      }
    }
  }
  assert.ok(total >= 121, "expected at least 121 subclasses, found " + total);
});

function checkResource(r, where, ids){
  assert.ok(/^[a-z0-9_]+$/.test(r.id), where + ": bad id " + r.id);
  assert.ok(!ids.has(r.id), where + ": duplicate id " + r.id);
  ids.add(r.id);
  assert.ok(r.name && !LONG_DASH.test(r.name + r.hint), where + " " + r.id + ": name or long dash");
  assert.ok(typeof r.hint === "string" && r.hint.length > 10, where + " " + r.id + ": hint");
  assert.ok(Number.isInteger(r.level) && r.level >= 1 && r.level <= MAX_LEVEL, where + " " + r.id + ": level");
  for(let lv = r.level; lv <= MAX_LEVEL; lv++){
    for(const m of [-1, 0, 3, 5]){
      const mods = { str: m, dex: m, con: m, int: m, wis: m, cha: m, pb: Math.floor((lv - 1) / 4) + 2 };
      const max = r.max(lv, mods);
      // Infinity is allowed: an unlimited feature (Archdruid's Wild Shape).
      assert.ok((Number.isFinite(max) || max === Infinity) && max >= 0, where + " " + r.id + ": max " + max + " at level " + lv);
      assert.ok(["short", "long", "manual"].includes(r.reset(lv)), where + " " + r.id + ": reset " + r.reset(lv));
    }
  }
}

test("resources: known classes and subclasses, unique ids, sane counts", () => {
  for(const [cls, list] of Object.entries(CLASS_RESOURCES)){
    assert.ok(CLASSES.includes(cls), "CLASS_RESOURCES has unknown class " + cls);
    const ids = new Set();
    list.forEach((r) => checkResource(r, cls, ids));
    const classIds = new Set(ids);
    for(const [sub, subList] of Object.entries(SUBCLASS_RESOURCES[cls] || {})){
      // Subclass ids may repeat between subclasses (only one is active), but
      // must not collide with the class's own.
      const subIds = new Set(classIds);
      subList.forEach((r) => checkResource(r, cls + " / " + sub, subIds));
    }
  }
  for(const [cls, subs] of Object.entries(SUBCLASS_RESOURCES)){
    assert.ok(CLASSES.includes(cls), "SUBCLASS_RESOURCES has unknown class " + cls);
    for(const sub of Object.keys(subs)){
      assert.ok(SUBCLASSES[cls].some((s) => s.name === sub), "resources for unknown subclass " + cls + " / " + sub);
    }
  }
});

test("level tables cover levels 1 to 20", () => {
  assert.equal(MAX_LEVEL, 20);
  assert.equal(XP_THRESHOLDS.length, 21);
  for(let l = 2; l <= 20; l++) assert.ok(XP_THRESHOLDS[l] > XP_THRESHOLDS[l - 1], "XP for level " + l);
  assert.equal(SPELL_SLOT_TABLE.length, 21);
  assert.equal(PACT_SLOT_TABLE.length, 21);
  assert.deepEqual(SPELL_SLOT_TABLE[20], [4, 3, 3, 3, 3, 2, 2, 1, 1]);
  assert.deepEqual(PACT_SLOT_TABLE[20], [4, 5]);
});

test("spell tips: only casters, levels 1 to 20, no long dashes", () => {
  for(const [cls, tips] of Object.entries(SPELL_TIPS)){
    assert.ok(CLASS_PROGRESSION[cls] && CLASS_PROGRESSION[cls].casterType, cls + " has tips but isn't a caster");
    for(const [lv, t] of Object.entries(tips)){
      assert.ok(+lv >= 1 && +lv <= 20, cls + " tip level " + lv);
      assert.ok(t.length > 10 && !LONG_DASH.test(t), cls + " tip " + lv);
    }
    assert.ok(Object.keys(tips).some((l) => +l >= 17), cls + " tips stop early");
  }
  for(const lv of Object.keys(THIRD_CASTER_SPELL_TIPS)) assert.ok(+lv >= 3 && +lv <= 20);
});

test("backgrounds: every listed one has info, tools and languages; skill picks are real skills", () => {
  const skills = SKILLS.map((x) => x[0]);
  for(const name of Object.values(BACKGROUNDS).flat()){
    const info = BACKGROUND_INFO[name];
    assert.ok(info && info.blurb, name + ": info");
    assert.ok(name in BACKGROUND_TOOLS, name + ": tools");
    assert.ok(name in BACKGROUND_LANGUAGES, name + ": languages");
    (info.skills || []).forEach((sk) => assert.ok(skills.includes(sk), name + ": skill " + sk));
    if(info.skillPick){
      assert.ok(info.skillChoice, name + ": skillPick without skillChoice text");
      assert.ok(info.skillPick.count >= 1 && info.skillPick.count < info.skillPick.options.length, name + ": pick count");
      info.skillPick.options.forEach((sk) => assert.ok(skills.includes(sk) && !(info.skills || []).includes(sk), name + ": pick option " + sk));
    }
    if(info.exoticLanguages) assert.ok(info.exoticLanguages <= BACKGROUND_LANGUAGES[name], name + ": exotic languages");
  }
  const haunted = BACKGROUND_INFO["Haunted One"];
  assert.deepEqual(haunted.skillPick, { count: 2, options: ["Arcana", "Investigation", "Religion", "Survival"] });
  assert.equal(BACKGROUND_LANGUAGES["Haunted One"], 2);
  assert.equal(haunted.exoticLanguages, 1);
  assert.equal(haunted.feature.name, "Heart of Darkness");
  assert.ok(!LONG_DASH.test(haunted.blurb + haunted.feature.text));
});

test("Fey Touched: in the catalog with its spells", () => {
  const f = FEATS_CATALOG.find((x) => x.name === "Fey Touched");
  assert.deepEqual(f.ability, ["int", "wis", "cha"]);
  assert.deepEqual(f.grantsSpells, ["Misty Step"]);
  assert.ok(SPELL_DATA["Misty Step"]);
  assert.equal(f.spellPick.level, 1);
  assert.deepEqual(f.spellPick.schools, ["Divination", "Enchantment"]);
  assert.ok(!LONG_DASH.test(f.summary + f.description));
});

test("invocations: well formed, spells exist, prerequisites are real", () => {
  const names = new Set();
  const pacts = PACT_BOONS.map((p) => p.name);
  const skills = SKILLS.map((x) => x[0]);
  for(const inv of INVOCATIONS.concat(PACT_BOONS)){
    assert.ok(!names.has(inv.name), "duplicate " + inv.name);
    names.add(inv.name);
    assert.ok(INVOCATION_SOURCES[inv.source], inv.name + ": source");
    assert.ok(inv.text.length > 20 && !LONG_DASH.test(inv.name + inv.text + (inv.summary || "")), inv.name + ": text");
    if(inv.level != null) assert.ok([5, 7, 9, 12, 15].includes(inv.level), inv.name + ": level " + inv.level);
    if(inv.pact) assert.ok(pacts.includes(inv.pact), inv.name + ": pact " + inv.pact);
    if(inv.needs) assert.ok(["eldritchBlast", "hex"].includes(inv.needs), inv.name + ": needs");
    (inv.spells || []).forEach((sp) => {
      assert.ok(SPELL_DATA[sp.name], inv.name + ": spell " + sp.name);
      assert.ok(["atwill", "free", "slot", "known"].includes(sp.kind), inv.name + ": kind " + sp.kind);
    });
    (inv.skills || []).forEach((sk) => assert.ok(skills.includes(sk), inv.name + ": skill " + sk));
    if(inv.uses) assert.ok(["1", "pb"].includes(inv.uses.max) && ["short", "long"].includes(inv.uses.reset), inv.name + ": uses");
  }
  assert.equal(INVOCATIONS.length, 54, "PHB 32 + XGE 14 + TCE 8");
  assert.deepEqual([1, 2, 4, 5, 7, 9, 12, 15, 18, 20].map(invocationsKnownAt), [0, 2, 2, 3, 4, 5, 6, 7, 8, 8]);
});
