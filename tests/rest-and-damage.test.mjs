/* Damage, healing, hit dice and rests on the Vitals tab, driven through
   the real buttons (2026-11-19). This is the safety net for moving that
   logic out of renderVitalsPanel into core/: these tests must keep
   passing, unchanged, while it moves.

   Two kinds of check:
   - the rules, written out by hand (what each step does to the sheet);
   - the whole character after each action, compared with
     tests/fixtures/rest-snapshots.json, taken from the code as it was
     before the move. That catches a field nobody thought to assert.
   The dice are fixed (Math.random and Date.now are stubbed), so a
   snapshot is the same on every run.

   To take the snapshots again (only when a rule is meant to change):
     UPDATE_REST_SNAPSHOTS=1 node --import ./tests/setup.mjs --test tests/rest-and-damage.test.mjs */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import * as H from "../js/core/helpers.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { state } from "../js/core/state.js";
import { renderVitalsPanel } from "../js/render/panels/vitals.js";
import { addCatalogMagicItem } from "../js/render/armory.js";
import { MAGIC_ITEM_DATA } from "../js/data/magic-items.js";
import * as MI from "../js/core/magic-items.js";
import { withFakeDom } from "./fake-dom.mjs";

/* ---- Snapshots ---- */
const SNAP_FILE = new URL("./fixtures/rest-snapshots.json", import.meta.url);
const UPDATE = process.env.UPDATE_REST_SNAPSHOTS === "1";
const snapshots = existsSync(SNAP_FILE) ? JSON.parse(readFileSync(SNAP_FILE, "utf8")) : {};
/* The character as plain data: the roll log without its time stamps. */
function plain(c){
  const out = JSON.parse(JSON.stringify(c));
  out.rollLog = (out.rollLog || []).map((e) => ({ label: e.label, detail: e.detail }));
  return out;
}
function matchSnapshot(name, c){
  const now = plain(c);
  if(UPDATE){
    const all = existsSync(SNAP_FILE) ? JSON.parse(readFileSync(SNAP_FILE, "utf8")) : {};
    all[name] = now;
    const sorted = Object.fromEntries(Object.keys(all).sort().map((k) => [k, all[k]]));
    writeFileSync(SNAP_FILE, JSON.stringify(sorted, null, 1) + "\n");
    return;
  }
  assert.ok(snapshots[name], "no snapshot taken for \"" + name + "\"");
  assert.deepEqual(now, snapshots[name], "the whole character after: " + name);
}

/* ---- Fixed dice ---- */
/* A small seeded generator in place of Math.random, and a fixed clock
   (uid() uses both), so every run rolls the same. */
const diced = new WeakSet();
let seed = 7, forced = null;
function fixedDice(t){
  if(diced.has(t)) return;
  diced.add(t);
  seed = 7; forced = null;
  t.mock.method(Math, "random", () => {
    if(forced !== null) return forced;
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  });
  t.mock.method(Date, "now", () => 1767225600000);
}
/* Every roll from here on gives this (0.55: a d10 rolls 6). */
function rollAs(value){ forced = value; }

/* ---- Characters ---- */
const ABIL = { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14 };
function char(id, classes, extra = {}){
  const c = newCharacter(id);
  c.id = "rest-" + id;
  c.classes = classes;
  c.abilities = Object.assign({}, ABIL, extra.abilities);
  delete extra.abilities;
  const hp = extra.hp; delete extra.hp;
  Object.assign(c, extra);
  ensureShape(c);
  if(hp) c.hp = Object.assign({ temp: 0 }, hp);
  // The slots the level-up would have set.
  const r = H.computeSpellSlots(c.classes);
  Object.keys(r.slots).forEach((l) => { c.spellcasting.slots[l].max = r.slots[l]; });
  if(r.pact) c.spellcasting.pact = { max: r.pact.max, slotLevel: r.pact.slotLevel, used: 0 };
  return c;
}
/* Every use, slot and hit die spent: what a long day leaves behind. */
function spendAll(c){
  H.characterResources(c).forEach((r) => {
    if(r.reset === "manual" || !(r.max > 0) || r.max === Infinity) return;
    c.resourcesUsed[r.key] = r.max;
  });
  const sc = c.spellcasting || {};
  Object.keys(sc.slots || {}).forEach((l) => { sc.slots[l].used = Number(sc.slots[l].max) || 0; });
  if(sc.pact) sc.pact.used = Number(sc.pact.max) || 0;
  H.hitDicePools(c).forEach((p) => { for(let i = p.used; i < p.total; i++) H.spendHitDie(c, p.die); });
  return c;
}
const used = (c, key) => Number((c.resourcesUsed || {})[key]) || 0;
const resUsed = (c, name) => { const r = H.characterResources(c).find((x) => x.name === name); assert.ok(r, "no resource " + name); return r.used; };
const lastLog = (c) => (c.rollLog || [])[0] || {};

/* ---- Driving the Vitals tab ---- */
/* The character is the open one, so the roll log is written to it. */
function open(c){ state.characters = [c]; state.activeId = c.id; state.hiddenCharacters = []; }
function draw(made, c){ made.length = 0; renderVitalsPanel(c); }
function find(made, test, what){ const el = made.find(test); assert.ok(el, "no " + what + " on the Vitals tab"); return el; }
const byText = (made, text) => find(made, (e) => e.textContent === text, "\"" + text + "\" button");
const byClass = (made, cls) => find(made, (e) => e.className === cls, "." + cls);
/* Drag the HP bar by n hit points (negative: damage). The box is as many
   pixels wide as the bar's maximum, so a pixel is a hit point, and
   letting go takes it in one go, as a player's drag does. */
function dragHp(made, c, n){
  draw(made, c);
  const box = byClass(made, "vital-box hp-vital-box");
  box.clientWidth = H.maxHp(c);
  box.fire("pointerdown", { button: 0, pointerId: 1, clientX: 1000, clientY: 0 });
  box.fire("pointermove", { pointerId: 1, clientX: 1000 + (n < 0 ? -10 : 10), clientY: 0 });
  box.fire("pointermove", { pointerId: 1, clientX: 1000 + (n < 0 ? -10 : 10) + n, clientY: 0 });
  box.fire("pointerup", { pointerId: 1 });
}
const damage = (made, c, n) => dragHp(made, c, -n);
const heal = (made, c, n) => dragHp(made, c, n);
function press(made, c, find){ draw(made, c); find(made).fire("click"); }
function shortRest(made, c){ press(made, c, (m) => byText(m, "Short rest")); }
/* keepConditions: untick "End these too" in the confirm dialog. */
function longRest(byId, made, c, keepConditions){
  press(made, c, (m) => byText(m, "Long rest"));
  if(keepConditions) byClass(made, "chk").checked = false;
  byId["confirm-ok"].fire("click");
}
/* Runs fn(byId, made) on a fake page with fixed dice, the character open. */
function onSheet(t, c, fn){
  fixedDice(t);
  open(c);
  withFakeDom(t, (byId, made) => fn(byId, made));
}

/* ================= Damage and healing ================= */

test("damage: temporary hit points take it first", (t) => {
  const c = char("temp", [{ name: "Fighter", level: 5 }], { hp: { max: 44, current: 44, temp: 3 } });
  onSheet(t, c, (byId, made) => {
    damage(made, c, 10);
    assert.deepEqual([c.hp.current, c.hp.temp], [37, 0], "3 to the temp HP, 7 to you");
    damage(made, c, 2);
    assert.equal(c.hp.current, 35);
  });
  matchSnapshot("damage: temp HP first", c);
});

test("damage: the Arcane Ward soaks it before temporary hit points", (t) => {
  const c = char("ward", [{ name: "Wizard", subclass: "School of Abjuration", level: 6 }],
    { abilities: { int: 18 }, hp: { max: 38, current: 38, temp: 2 }, arcaneWard: true });
  onSheet(t, c, (byId, made) => {
    assert.equal(H.wardLeft(c), 16, "twice the level + INT");
    damage(made, c, 20);
    assert.deepEqual([H.wardLeft(c), c.hp.temp, c.hp.current], [0, 0, 36], "16 to the ward, 2 to temp HP, 2 to you");
  });
  matchSnapshot("damage: Arcane Ward", c);
});

test("damage: a Wild Shape form takes it, and at 0 you turn back", (t) => {
  const c = char("wolf", [{ name: "Druid", subclass: "Circle of the Moon", level: 4 }], { hp: { max: 30, current: 24 } });
  assert.ok(H.startWildShape(c, "Wolf"));
  onSheet(t, c, (byId, made) => {
    damage(made, c, 5);
    assert.equal(c.hp.current, 6, "the wolf's 11 less 5");
    assert.equal(c.wildShape.normal, 24, "your own hit points wait");
    damage(made, c, 6);
    assert.equal(c.wildShape, undefined, "the form ends at 0");
    assert.equal(c.hp.current, 24, "back to your own hit points");
  });
  matchSnapshot("damage: Wild Shape", c);
});

test("damage: dropping to 0 resets the death saves, ends the effects and knocks you prone", (t) => {
  const c = char("fall", [{ name: "Barbarian", subclass: "Path of the Berserker", level: 5 }], { hp: { max: 55, current: 9 } });
  H.startRage(c);
  c.deathSaves = { success: 2, fail: 1 };
  c.extraTurn = true;
  c.sharpen = { bonus: 1 };
  c.inventory.push({ id: "club", name: "Club", type: "weapon", qty: 1, shillelagh: true });
  onSheet(t, c, (byId, made) => {
    damage(made, c, 9);
    assert.equal(c.hp.current, 0);
    assert.deepEqual(c.deathSaves, { success: 0, fail: 0 });
    assert.equal(c.extraTurn, undefined, "a new fall: Strength Before Death can be used again");
    assert.equal(c.rage.active, false, "the rage ends");
    assert.equal(c.sharpen, undefined);
    assert.equal(c.inventory.find((i) => i.id === "club").shillelagh, undefined);
    assert.ok(c.conditions.includes("prone"));
  });
  matchSnapshot("damage: drop to 0", c);
});

test("damage: Relentless Rage holds the rage at 0 hit points", (t) => {
  const c = char("relentless", [{ name: "Barbarian", subclass: "Path of the Berserker", level: 11 }], { hp: { max: 121, current: 4 } });
  H.startRage(c);
  onSheet(t, c, (byId, made) => {
    damage(made, c, 4);
    assert.equal(c.hp.current, 0);
    assert.equal(c.rage.active, true, "the rage goes on while the save waits");
    assert.equal(c.rage.relentless, true);
    assert.ok(!c.conditions.includes("prone"), "the effects don't end, so no prone either");
  });
  matchSnapshot("damage: Relentless Rage", c);
});

test("damage: an effect that outlasts a fall stays on", (t) => {
  const c = char("wildfire", [{ name: "Druid", subclass: "Circle of Wildfire", level: 2 }], { hp: { max: 17, current: 3 } });
  c.effects = { wildfire_spirit: true };
  onSheet(t, c, (byId, made) => {
    damage(made, c, 3);
    assert.equal(c.effects.wildfire_spirit, true);
    assert.ok(c.conditions.includes("prone"));
  });
  matchSnapshot("damage: staysUp effect", c);
});

test("healing: the bar, the arrows and Full stop at the maximum", (t) => {
  const c = char("heal", [{ name: "Fighter", level: 5 }], { hp: { max: 44, current: 30 } });
  onSheet(t, c, (byId, made) => {
    heal(made, c, 10);
    assert.equal(c.hp.current, 40);
    heal(made, c, 20);
    assert.equal(c.hp.current, 44, "never past the maximum");
    press(made, c, (m) => byClass(m, "stat-arrow-btn stat-arrow-down"));
    assert.equal(c.hp.current, 43, "the down arrow takes 1");
    press(made, c, (m) => byClass(m, "stat-arrow-btn stat-arrow-up"));
    assert.equal(c.hp.current, 44, "the up arrow heals 1");
    damage(made, c, 30);
    press(made, c, (m) => byText(m, "Full"));
    assert.equal(c.hp.current, 44);
  });
  matchSnapshot("healing: bar, arrows, Full", c);
});

test("a hit die heals its roll plus the CON modifier", (t) => {
  const c = char("hitdie", [{ name: "Fighter", level: 5 }], { hp: { max: 44, current: 20 } });
  onSheet(t, c, (byId, made) => {
    rollAs(0.55); // a d10 rolls 6
    press(made, c, (m) => byClass(m, "hd-tile"));
    assert.equal(c.hp.current, 28, "6 + 2");
    assert.equal(H.hitDicePools(c)[0].used, 1);
    assert.deepEqual(lastLog(c), { ...lastLog(c), label: "Hit die (d10+2)", detail: "6 +2 = 8 HP healed" });
  });
  matchSnapshot("hit die", c);
});

/* ================= Short rest ================= */

test("short rest: the short-rest uses come back, the long-rest ones and hit dice don't", (t) => {
  const c = spendAll(char("short-fighter", [{ name: "Fighter", subclass: "Battle Master", level: 5 }], { hp: { max: 44, current: 20 } }));
  onSheet(t, c, (byId, made) => {
    shortRest(made, c);
    assert.equal(resUsed(c, "Second Wind"), 0);
    assert.equal(resUsed(c, "Action Surge"), 0);
    assert.equal(resUsed(c, "Superiority Dice"), 0);
    assert.equal(H.hitDicePools(c)[0].used, 5, "hit dice wait for a long rest");
    assert.equal(c.hp.current, 20, "no healing without spending hit dice");
    assert.equal(lastLog(c).label, "Short rest taken");
    assert.match(lastLog(c).detail, /^Spend hit dice as needed to heal\. Restored: .*Second Wind.*\.$/);
  });
  matchSnapshot("short rest: fighter", c);
});

test("short rest: pact slots come back, Celestial Resilience gives temporary hit points", (t) => {
  const c = spendAll(char("short-celestial", [{ name: "Warlock", subclass: "The Celestial", level: 10 }], { abilities: { cha: 18 }, hp: { max: 63, current: 40 } }));
  onSheet(t, c, (byId, made) => {
    shortRest(made, c);
    assert.equal(c.spellcasting.pact.used, 0);
    assert.equal(c.hp.temp, 14, "warlock level + CHA");
    assert.match(lastLog(c).detail, / Pact slots restored\./);
    assert.match(lastLog(c).detail, / Celestial Resilience: 14 temporary HP, 9 for up to five creatures\./);
  });
  matchSnapshot("short rest: celestial warlock", c);
});

test("short rest: a 2024 barbarian gets one Rage back, Relentless Rage's DC resets", (t) => {
  const c = char("short-barb24", [{ name: "Barbarian", level: 5, edition: "2024" }], { hp: { max: 55, current: 30 }, relentlessUses: 2 });
  c.rage.used = 3;
  onSheet(t, c, (byId, made) => {
    shortRest(made, c);
    assert.equal(c.rage.used, 2);
    assert.equal(c.relentlessUses, undefined);
    assert.match(lastLog(c).detail, /one use of Rage/);
  });
  matchSnapshot("short rest: 2024 barbarian", c);
});

test("short rest: Sorcerous Restoration, 2014 and 2024", (t) => {
  const old = char("short-sorc14", [{ name: "Sorcerer", subclass: "Draconic Bloodline", level: 20 }], { hp: { max: 122, current: 100 } });
  old.resourcesUsed["Sorcerer:sorcery_points"] = 10;
  const now = char("short-sorc24", [{ name: "Sorcerer", subclass: "Draconic Sorcery", level: 6, edition: "2024" }], { hp: { max: 38, current: 30 } });
  now.resourcesUsed["Sorcerer:sorcery_points"] = 5;
  onSheet(t, old, (byId, made) => {
    shortRest(made, old);
    assert.equal(used(old, "Sorcerer:sorcery_points"), 6, "4 come back");
    assert.match(lastLog(old).detail, / Sorcerous Restoration: 4 sorcery points\./);
    open(now);
    shortRest(made, now);
    assert.equal(used(now, "Sorcerer:sorcery_points"), 2, "half the level (3) come back");
    assert.equal(used(now, "Sorcerer:sorcerous_restoration"), 1, "once per long rest");
    assert.match(lastLog(now).detail, / Sorcerous Restoration: 3 sorcery points\./);
  });
  matchSnapshot("short rest: sorcerer 2014", old);
  matchSnapshot("short rest: sorcerer 2024", now);
});

test("short rest: Tireless takes a level of exhaustion off", (t) => {
  const c = char("short-ranger", [{ name: "Ranger", subclass: "Hunter", level: 10, edition: "2024" }], { hp: { max: 84, current: 60 }, exhaustion: 2 });
  onSheet(t, c, (byId, made) => {
    shortRest(made, c);
    assert.equal(c.exhaustion, 1);
    assert.match(lastLog(c).detail, / Tireless: exhaustion down to level 1\./);
  });
  matchSnapshot("short rest: Tireless", c);
});

test("short rest: effects end, except those that last until a long rest", (t) => {
  const blade = char("short-blade", [{ name: "Wizard", subclass: "Bladesinging", level: 2 }], { hp: { max: 14, current: 14 } });
  blade.effects = { bladesong: true };
  const clock = char("short-clock", [{ name: "Sorcerer", subclass: "Clockwork Soul", level: 6 }], { hp: { max: 38, current: 38 } });
  clock.effects = { bastion_of_law: true };
  onSheet(t, blade, (byId, made) => {
    shortRest(made, blade);
    assert.equal(blade.effects.bladesong, undefined);
    assert.match(lastLog(blade).detail, / Ended: Bladesong\./);
    open(clock);
    shortRest(made, clock);
    assert.equal(clock.effects.bastion_of_law, true, "Bastion of Law lasts until a long rest");
  });
  matchSnapshot("short rest: Bladesong ends", blade);
  matchSnapshot("short rest: Bastion of Law stays", clock);
});

test("short rest: a tale goes untold, a 10-minute boon ends, Power Surge tops up", (t) => {
  const bard = char("short-spirits", [{ name: "Bard", subclass: "College of Spirits", level: 3 }], { hp: { max: 24, current: 24 } });
  bard.spiritTale = { id: "x" };
  const coin = { id: "coin", name: "Duality", type: "gear", magicItem: "Duality", qty: 1 };
  const duel = char("short-duality", [{ name: "Fighter", level: 1 }], { hp: { max: 12, current: 12 } });
  duel.inventory.push(coin);
  MI.flipCoin(coin, () => 0.2); MI.chooseBoon(duel, coin, "angel_ac");
  MI.flipCoin(coin, () => 0.2); MI.chooseBoon(duel, coin, "angel_radiant");
  const war = char("short-war", [{ name: "Wizard", subclass: "War Magic", level: 6 }], { hp: { max: 38, current: 38 } });
  war.resourcesUsed["Wizard:power_surges"] = 3;
  onSheet(t, bard, (byId, made) => {
    shortRest(made, bard);
    assert.equal(bard.spiritTale, undefined);
    open(duel);
    shortRest(made, duel);
    assert.deepEqual(MI.activeBoons(duel).map((b) => b.def.id), ["angel_radiant"]);
    assert.match(lastLog(duel).detail, / Ended: Duality \(\+1 AC\)\./);
    open(war);
    shortRest(made, war);
  });
  matchSnapshot("short rest: Spirits tale", bard);
  matchSnapshot("short rest: Duality boons", duel);
  matchSnapshot("short rest: Power Surge", war);
});

/* ================= Long rest ================= */

test("long rest: full hit points, half the hit dice, every use and slot", (t) => {
  const c = spendAll(char("long-fighter", [{ name: "Fighter", subclass: "Battle Master", level: 5 }],
    { hp: { max: 44, current: 10, temp: 5 }, relentlessUses: 1, extraTurn: true }));
  c.deathSaves = { success: 1, fail: 2 };
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.deepEqual(c.hp, { max: 44, current: 44, temp: 0 });
    assert.deepEqual(c.deathSaves, { success: 0, fail: 0 });
    assert.equal(H.hitDicePools(c)[0].used, 3, "half of 5 (2) come back");
    H.characterResources(c).forEach((r) => assert.equal(r.used, 0, r.name));
    assert.equal(c.relentlessUses, undefined);
    assert.equal(c.extraTurn, undefined);
    assert.deepEqual(lastLog(c), { ...lastLog(c), label: "Long rest taken", detail: "HP and spell slots restored. 2 hit dice recovered." });
  });
  matchSnapshot("long rest: fighter", c);
});

test("long rest: a multiclass caster gets every slot and pact slot back", (t) => {
  const c = spendAll(char("long-multi", [{ name: "Wizard", subclass: "School of Divination", level: 3 }, { name: "Warlock", subclass: "The Fiend", level: 2 }],
    { hp: { max: 30, current: 5 } }));
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    Object.keys(c.spellcasting.slots).forEach((l) => assert.equal(c.spellcasting.slots[l].used, 0, "level " + l));
    assert.equal(c.spellcasting.pact.used, 0);
    assert.equal(c.portent.length, 2, "Portent: two d20s rolled");
    assert.match(lastLog(c).detail, / Portent: \d+, \d+\./);
    assert.equal(H.hitDicePools(c).reduce((n, p) => n + p.used, 0), 3, "half of 5 (2) come back, largest first");
  });
  matchSnapshot("long rest: multiclass caster", c);
});

test("long rest: the wizard's school leftovers clear", (t) => {
  const abj = spendAll(char("long-abj", [{ name: "Wizard", subclass: "School of Abjuration", level: 6 }], { abilities: { int: 18 }, hp: { max: 38, current: 20 }, arcaneWard: true }));
  const evo = char("long-evo", [{ name: "Wizard", subclass: "School of Evocation", level: 14 }], { hp: { max: 86, current: 86 }, overchannels: 2 });
  const tra = char("long-tra", [{ name: "Wizard", subclass: "School of Transmutation", level: 6 }], { hp: { max: 38, current: 38 }, stoneGone: true });
  const war = char("long-war", [{ name: "Wizard", subclass: "War Magic", level: 6 }], { hp: { max: 38, current: 38 } });
  onSheet(t, abj, (byId, made) => {
    longRest(byId, made, abj);
    assert.equal(abj.arcaneWard, undefined, "the ward has to be made again");
    open(evo); longRest(byId, made, evo);
    assert.equal(evo.overchannels, undefined);
    open(tra); longRest(byId, made, tra);
    assert.equal(tra.stoneGone, undefined);
    open(war); longRest(byId, made, war);
  });
  matchSnapshot("long rest: Abjuration", abj);
  matchSnapshot("long rest: Evocation", evo);
  matchSnapshot("long rest: Transmutation", tra);
  matchSnapshot("long rest: War Magic", war);
});

test("long rest: a Wild Shape form ends first, then hit points refill", (t) => {
  const c = char("long-wolf", [{ name: "Druid", subclass: "Circle of the Moon", level: 4 }], { hp: { max: 30, current: 12 } });
  assert.ok(H.startWildShape(c, "Wolf"));
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.wildShape, undefined);
    assert.equal(c.hp.current, 30);
  });
  matchSnapshot("long rest: Wild Shape", c);
});

test("long rest: a level of exhaustion comes off before hit points, conditions end when ticked", (t) => {
  const c = char("long-tired", [{ name: "Fighter", level: 5 }], { hp: { max: 44, current: 10 }, exhaustion: 4 });
  H.addCondition(c, "poisoned"); H.addCondition(c, "frightened");
  assert.equal(H.maxHp(c), 22, "exhaustion 4 halves the maximum");
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.exhaustion, 3);
    assert.equal(c.hp.current, 44, "the whole maximum: exhaustion went first");
    assert.deepEqual(c.conditions, []);
    assert.match(lastLog(c).detail, / Exhaustion down to level 3 \(with food and drink\)\. Conditions ended: \w+, \w+\.$/);
  });
  matchSnapshot("long rest: exhaustion and conditions", c);
});

test("long rest: unticked, the conditions stay", (t) => {
  const c = char("long-cursed", [{ name: "Fighter", level: 5 }], { hp: { max: 44, current: 10 } });
  H.addCondition(c, "poisoned");
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c, true);
    assert.deepEqual(c.conditions, ["poisoned"]);
    assert.doesNotMatch(lastLog(c).detail, /Conditions ended/);
  });
  matchSnapshot("long rest: conditions kept", c);
});

test("long rest: a frenzied rage's exhaustion is taken, then the rest takes a level off", (t) => {
  const c = char("long-frenzy", [{ name: "Barbarian", subclass: "Path of the Berserker", level: 3 }], { hp: { max: 35, current: 20 } });
  H.startRage(c);
  c.rage.frenzy = true;
  c.rage.used = 1;
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.rage.active, false);
    assert.equal(c.rage.used, 0);
    assert.equal(c.exhaustion, 0, "Frenzy's level, then the rest's");
  });
  matchSnapshot("long rest: Frenzy", c);
});

test("long rest: Persistent Rage can be used again", (t) => {
  const c = char("long-persist", [{ name: "Barbarian", level: 15, edition: "2024" }], { hp: { max: 165, current: 100 } });
  c.rage.used = 5; c.rage.persistentUsed = true;
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.rage.used, 0);
    assert.equal(c.rage.persistentUsed, undefined);
  });
  matchSnapshot("long rest: Persistent Rage", c);
});

test("long rest: subclass and species features that refresh", (t) => {
  const phantom = char("long-phantom", [{ name: "Rogue", subclass: "Phantom", level: 17 }], { hp: { max: 110, current: 110 }, soulTrinkets: 0 });
  const stars = char("long-stars", [{ name: "Druid", subclass: "Circle of Stars", level: 6 }], { hp: { max: 45, current: 45 } });
  const human = char("long-human", [{ name: "Fighter", level: 1 }], { race: "Human (2024)", hp: { max: 12, current: 12 }, inspiration: 0 });
  onSheet(t, phantom, (byId, made) => {
    longRest(byId, made, phantom);
    assert.equal(phantom.soulTrinkets, 1, "Death's Friend: a trinket when you have none");
    open(stars); longRest(byId, made, stars);
    assert.ok(stars.cosmicOmen === "Weal" || stars.cosmicOmen === "Woe");
    assert.match(lastLog(stars).detail, / Cosmic Omen: (Weal|Woe)\./);
    open(human); longRest(byId, made, human);
    assert.equal(human.inspiration, 1);
    assert.match(lastLog(human).detail, / Resourceful: you have Heroic Inspiration\./);
  });
  matchSnapshot("long rest: Phantom", phantom);
  matchSnapshot("long rest: Circle of Stars", stars);
  matchSnapshot("long rest: Resourceful", human);
});

test("long rest: the Forge's blessing ends, a failed Divine Intervention can be tried again", (t) => {
  const c = char("long-forge", [{ name: "Cleric", subclass: "Forge Domain", level: 10 }], { hp: { max: 73, current: 73 } });
  c.inventory.push({ id: "mace", name: "Mace", type: "weapon", qty: 1, magicBonus: 1 });
  c.forgeBlessed = "mace";
  c.interventionFailed = true;
  c.resourcesUsed["Cleric:divine_intervention"] = 1;
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.inventory.find((i) => i.id === "mace").magicBonus, 0);
    assert.equal(c.forgeBlessed, undefined);
    assert.equal(c.interventionFailed, undefined);
    assert.equal(used(c, "Cleric:divine_intervention"), 0);
  });
  matchSnapshot("long rest: Forge cleric", c);
});

test("long rest: a use waiting out its long rests counts one down", (t) => {
  const c = char("long-wait", [{ name: "Cleric", subclass: "Life Domain", level: 10, edition: "2024" }], { hp: { max: 73, current: 73 } });
  c.resourcesUsed["Cleric:divine_intervention"] = 1;
  c.restWait = { "Cleric:divine_intervention": 2 };
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.deepEqual([c.restWait["Cleric:divine_intervention"], used(c, "Cleric:divine_intervention")], [1, 1], "still waiting");
    longRest(byId, made, c);
    assert.deepEqual([c.restWait["Cleric:divine_intervention"], used(c, "Cleric:divine_intervention")], [undefined, 0]);
  });
  matchSnapshot("long rest: rest wait", c);
});

test("long rest: Font of Magic slots go, the Lunar phase is chosen again", (t) => {
  const c = char("long-lunar", [{ name: "Sorcerer", subclass: "Lunar Sorcery", level: 6 }], { hp: { max: 38, current: 38 }, lunarPhase: "Full Moon", lunarFree: { "Full Moon": true } });
  const s1 = c.spellcasting.slots[1];
  s1.max += 1; s1.extra = 1; s1.font = 1;
  const maxBefore = s1.max;
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.spellcasting.slots[1].max, maxBefore - 1);
    assert.equal(c.spellcasting.slots[1].font, undefined);
    assert.equal(c.lunarChoose, true);
    assert.equal(c.lunarFree, undefined);
  });
  matchSnapshot("long rest: Lunar sorcerer", c);
});

test("long rest: Celestial Resilience comes after the temporary hit points clear", (t) => {
  const c = spendAll(char("long-celestial", [{ name: "Warlock", subclass: "The Celestial", level: 10 }], { abilities: { cha: 18 }, hp: { max: 63, current: 40, temp: 3 } }));
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.hp.temp, 14);
    assert.equal(c.spellcasting.pact.used, 0);
  });
  matchSnapshot("long rest: Celestial warlock", c);
});

test("long rest: a Spirits session's spell and an untold tale go", (t) => {
  const c = char("long-spirits", [{ name: "Bard", subclass: "College of Spirits", level: 6 }], { hp: { max: 39, current: 39 }, spiritTale: { id: "x" }, sessionSpell: "Augury" });
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.equal(c.spiritTale, undefined);
    assert.equal(c.sessionSpell, undefined);
  });
  matchSnapshot("long rest: Spirits bard", c);
});

test("long rest: artificer elixirs, infusion charges, companions, Tinker's Magic and plans", (t) => {
  const alch = char("long-alch", [{ name: "Artificer", subclass: "Alchemist", level: 3 }], { hp: { max: 24, current: 24 } });
  alch.elixirs = { list: [{ id: "old", name: "Healing", free: true }], freeMade: 1 };
  alch.infusions = { known: [], active: [{ id: "inf", name: "Mind Sharpener", itemName: "Robes", used: 3 }] };
  const smith = char("long-smith", [{ name: "Artificer", subclass: "Battle Smith", level: 3 }], { hp: { max: 24, current: 24 } });
  smith.companions = { steel_defender: { hp: [4] } };
  const tink = char("long-tinker", [{ name: "Artificer", level: 5, edition: "2024" }], { hp: { max: 38, current: 38 } });
  tink.inventory.push({ id: "rope", name: "Rope", type: "gear", qty: 1, tinkered: true });
  const s2 = tink.spellcasting.slots[1];
  s2.max += 1; s2.extra = 1; s2.drained = 1; s2.used = s2.max;
  tink.plans = Object.assign({}, tink.plans, { drained: true, transmuted: true });
  onSheet(t, alch, (byId, made) => {
    longRest(byId, made, alch);
    assert.ok(!alch.elixirs.list.some((e) => e.id === "old"), "unused elixirs expire");
    assert.ok(alch.elixirs.list.length >= 1, "a free elixir is rolled");
    assert.ok(alch.infusions.active[0].used < 3, "the charges come back by 1d4");
    assert.match(lastLog(alch).detail, / New elixirs: /);
    open(smith); longRest(byId, made, smith);
    assert.deepEqual(smith.companions.steel_defender.hp, [19], "back at full: 2 + INT + 5 x artificer level");
    open(tink); longRest(byId, made, tink);
    assert.ok(!tink.inventory.some((i) => i.tinkered));
    assert.match(lastLog(tink).detail, / Tinker's Magic items vanished: Rope\./);
    assert.equal(tink.spellcasting.slots[1].drained, undefined);
    assert.deepEqual([tink.plans.drained, tink.plans.transmuted], [undefined, undefined]);
  });
  matchSnapshot("long rest: Alchemist", alch);
  matchSnapshot("long rest: Battle Smith", smith);
  matchSnapshot("long rest: 2024 artificer", tink);
});

test("long rest: magic items recharge at dawn and their boons end", (t) => {
  fixedDice(t); // (before the wand is made: its id comes from uid())
  const c = char("long-items", [{ name: "Wizard", level: 5 }], { hp: { max: 32, current: 32 } });
  let wand;
  withFakeDom(t, () => { wand = addCatalogMagicItem(c, "Wand of Fireballs", MAGIC_ITEM_DATA["Wand of Fireballs"]); });
  MI.spendCharges(wand, 5);
  const coin = { id: "coin", name: "Duality", type: "gear", magicItem: "Duality", qty: 1 };
  c.inventory.push(coin);
  MI.flipCoin(coin, () => 0.2); MI.chooseBoon(c, coin, "angel_radiant");
  c.inventory.push({ id: "ring", name: "Spell-Refueling Ring", type: "gear", qty: 1, refuelUsed: true });
  onSheet(t, c, (byId, made) => {
    longRest(byId, made, c);
    assert.ok(MI.itemCharges(wand).left > 2, "the wand regains 1d6 + 1");
    assert.deepEqual(MI.activeBoons(c), []);
    assert.equal(MI.coinCharges(coin), 2);
    assert.equal(c.inventory.find((i) => i.id === "ring").refuelUsed, undefined);
    assert.match(lastLog(c).detail, / Recharged: Wand of Fireballs \(\+\d charges?\), Duality, Spell-Refueling Ring\./);
    assert.match(lastLog(c).detail, / Ended: Duality \(next attack \+2d8 radiant\)\./);
  });
  matchSnapshot("long rest: magic items", c);
});
