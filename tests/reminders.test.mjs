/* The Remember card on Vitals (2026-11-02): features a new player forgets
   mid-fight, tagged `remind: {when, line}`. Only what the sheet doesn't
   already apply or show elsewhere, written as one plain sentence. */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/core/helpers.js";
import { CLASSES_INFO, FIGHTING_STYLES } from "../js/data/classes.js";
import { CLASS_PROGRESSION, SUBCLASSES } from "../js/data/progression.js";
import { CLASS_RESOURCES, SUBCLASS_RESOURCES } from "../js/data/resources.js";
import { TOGGLE_EFFECTS } from "../js/data/effects.js";
import { newCharacter, ensureShape } from "../js/core/character.js";
import { makeStyleFeature } from "../js/core/fighting-styles.js";
import { INVOCATIONS } from "../js/data/invocations.js";
import { FEATS_CATALOG } from "../js/data/feats.js";
import { FEAT_RESOURCES } from "../js/data/resources.js";
import { characterCompanions } from "../js/core/companions.js";
import { healingNote, circleSpellNote } from "../js/core/spell-scaling.js";

// Every feature in the class and subclass data, with where it comes from.
function allFeatures(){
  const out = [];
  for(const [cls, info] of Object.entries(CLASSES_INFO)) for(const f of info.features || []) out.push({ where: cls + " 1", f });
  for(const [cls, p] of Object.entries(CLASS_PROGRESSION)){
    for(const [lv, list] of Object.entries(p.features || {})) for(const f of list) out.push({ where: cls + " " + lv, f });
    for(const v of p.variants || []) for(const [lv, list] of Object.entries(v.features || {})) for(const f of list) out.push({ where: cls + " " + v.name + " " + lv, f });
    // Another rules edition's features (the 2024 Monk).
    for(const [ed, e] of Object.entries(p.editions || {})){
      for(const f of e.level1 || []) out.push({ where: cls + " " + ed + " 1", f, ed });
      for(const [lv, list] of Object.entries(e.features || {})) for(const f of list) out.push({ where: cls + " " + ed + " " + lv, f, ed });
    }
  }
  for(const [cls, subs] of Object.entries(SUBCLASSES)) for(const s of subs) for(const [lv, list] of Object.entries(s.features || {})) for(const f of list) out.push({ where: s.name + " " + lv, f, sub: s.name });
  for(const [name, def] of Object.entries(FIGHTING_STYLES)) out.push({ where: "Fighting Style", f: Object.assign({ name }, def) });
  for(const inv of INVOCATIONS) out.push({ where: "Invocation", f: inv });
  for(const feat of FEATS_CATALOG) out.push({ where: "Feat", f: feat });
  return out;
}
const resourceNames = new Set([].concat(
  ...Object.values(CLASS_RESOURCES).map((list) => list.map((r) => r.name)),
  ...Object.values(SUBCLASS_RESOURCES).map((bySub) => [].concat(...Object.values(bySub)).map((r) => r.name))));
const effectNames = new Set(TOGGLE_EFFECTS.map((e) => e.name));

test("every reminder is one short, plain sentence with a known group", () => {
  const tagged = allFeatures().filter((x) => x.f.remind);
  assert.ok(tagged.length >= 17, "the rogue's are tagged");
  // (A pick-based one: each option's reminder.)
  const lines = [].concat(...tagged.map(({ where, f }) => f.remind.pick || f.remind.choice
    ? Object.entries(f.remind.by).map(([o, r]) => ({ where: where + " (" + o + ")", f, r }))
    : [{ where, f, r: f.remind }]));
  for(const { where, f, r } of lines){
    const { when, line } = r;
    assert.ok(["bonus", "reaction", "always"].includes(when), where + " " + f.name + ": when " + when);
    assert.ok(line && line.length <= 84, where + " " + f.name + ": short enough for two lines on a phone (" + (line || "").length + ")");
    assert.ok(!/[;·–—]/.test(line), where + " " + f.name + ": no semicolons, dots or long dashes");
    assert.ok(!/\.$/.test(line) && /^[A-Z]/.test(line), where + " " + f.name + ": starts with a capital, no full stop");
  }
});

test("a reminder never repeats what the sheet already shows", () => {
  for(const { where, f, sub, ed } of allFeatures().filter((x) => x.f.remind)){
    // (War Caster's advantage is on the saves card. Its reminder is the
    // other half of the feat, a spell in place of an opportunity attack.)
    // (The same for the 2024 War Caster, and Skulker (2024)'s blindsight and
    // Stealth: its reminder is Sniper.)
    const besides = f.name === "War Caster" || f.name === "War Caster (2024)" ? ["advantage"] : f.name === "Skulker (2024)" ? ["advantage", "sense"] : f.name === "Remarkable Athlete" ? ["advantage"] : [];
    for(const k of ["saveNote", "advantage", "skillBonus", "sense", "rollButton"]) assert.ok(!f[k] || besides.includes(k), where + " " + f.name + ": already shown through " + k);
    assert.ok(!resourceNames.has(f.name), where + " " + f.name + ": already a row on Class resources");
    // (Within the same subclass: the 2014 Land's Nature's Sanctuary isn't the 2024 one's effect.)
    // (And within the same edition: the 2014 Countercharm's performance isn't the 2024 reaction.)
    const onCard = TOGGLE_EFFECTS.some((e) => e.name === f.name && (!sub || !e.subclass || [].concat(e.subclass).includes(sub)) && !(ed && e.edition && e.edition !== ed));
    assert.ok(!onCard, where + " " + f.name + ": already on Active effects");
  }
});

function rogue(sub, lv){
  const c = newCharacter("R");
  c.classes = [{ name: "Rogue", subclass: sub, level: lv }];
  return ensureShape(c);
}
test("a Thief 18's reminders, grouped by when they're used", () => {
  const r = H.characterReminders(rogue("Thief", 18));
  const by = (when) => r.filter((x) => x.when === when).map((x) => x.name);
  assert.deepEqual(by("bonus"), ["Cunning Action", "Fast Hands"]);
  assert.deepEqual(by("reaction"), ["Uncanny Dodge"]);
  assert.deepEqual(by("always"), ["Second-Story Work", "Use Magic Device", "Thief's Reflexes", "Elusive"]);
  assert.match(r.find((x) => x.name === "Uncanny Dodge").source, /Class · Rogue · Lv 5/);
  assert.match(r.find((x) => x.name === "Fast Hands").source, /^Thief · Lv 3/);
  assert.deepEqual(H.characterReminders(rogue("Thief", 1)), [], "nothing to remember at level 1");
  assert.deepEqual(H.REMIND_GROUPS.map((g) => g.when), ["bonus", "reaction", "always"]);
});

test("a multiclass lists each class's reminders once", () => {
  const c = newCharacter("M");
  c.classes = [{ name: "Rogue", subclass: "Mastermind", level: 13 }, { name: "Fighter", subclass: "Champion", level: 2 }];
  const names = H.characterReminders(ensureShape(c)).map((x) => x.name);
  assert.deepEqual(names, ["Cunning Action", "Master of Tactics", "Uncanny Dodge", "Misdirection"], "by level");
});

function monk(sub, lv, edition){
  const c = newCharacter("M");
  c.classes = [Object.assign({ name: "Monk", subclass: sub, level: lv }, edition ? { edition } : {})];
  return ensureShape(c);
}
test("a 2014 monk's reminders (2026-11-03)", () => {
  const r = H.characterReminders(monk("Way of Shadow", 17));
  const by = (when) => r.filter((x) => x.when === when).map((x) => x.name);
  assert.deepEqual(by("bonus"), ["Martial Arts"]);
  assert.deepEqual(by("reaction"), ["Deflect Missiles", "Slow Fall", "Opportunist"]);
  assert.deepEqual(by("always"), ["Unarmored Movement", "Tongue of the Sun and Moon", "Timeless Body"], "by the level each reminder came at");
  assert.match(r.find((x) => x.name === "Unarmored Movement").source, /Lv 9$/, "walls from 9");
  assert.match(r.find((x) => x.name === "Martial Arts").source, /Lv 1$/);
  assert.deepEqual(H.characterReminders(monk("", 8)).map((x) => x.name), ["Martial Arts", "Deflect Missiles", "Slow Fall"], "walls from 9");
  const t = monk("", 3);
  t.tashaOptional = true;
  H.syncTashaAdditions(t);
  assert.ok(H.characterReminders(t).some((x) => x.name === "Ki-Fueled Attack"), "Tasha's Ki-Fueled Attack");
});
test("a 2024 monk's reminders: none of the 2014 ones", () => {
  const r = H.characterReminders(monk("Warrior of the Open Hand", 18, "2024"));
  const by = (when) => r.filter((x) => x.when === when).map((x) => x.name);
  assert.deepEqual(by("bonus"), ["Martial Arts", "Monk's Focus", "Fleet Step"]);
  assert.deepEqual(by("reaction"), ["Deflect Attacks", "Slow Fall"]);
  assert.deepEqual(by("always"), ["Self-Restoration"]);
  assert.match(r.find((x) => x.name === "Martial Arts").line, /no armor and no shield/);
  assert.match(r.find((x) => x.name === "Fleet Step").source, /^Warrior of the Open Hand · Lv 11/);
  assert.deepEqual(H.characterReminders(monk("", 1, "2024")).map((x) => x.name), ["Martial Arts"], "the bonus strike from level 1");
});

function barbarian(sub, lv){
  const c = newCharacter("B");
  c.classes = [{ name: "Barbarian", subclass: sub, level: lv }];
  return ensureShape(c);
}
test("a barbarian's reminders (2026-11-03): only what the Rage card doesn't show", () => {
  const names = (c) => H.characterReminders(c).map((x) => x.name);
  assert.deepEqual(names(barbarian("Path of the Berserker", 14)), ["Retaliation"]);
  assert.equal(H.characterReminders(barbarian("Path of the Berserker", 14))[0].when, "reaction");
  assert.deepEqual(names(barbarian("Path of the Giant", 10)), ["Mighty Impel"]);
  assert.deepEqual(names(barbarian("Path of the Battlerager", 3)), ["Battlerager Armor"]);
  assert.deepEqual(names(barbarian("Path of the Totem Warrior", 20)), [], "totem perks are on the Rage card");
  const pounce = barbarian("", 7);
  pounce.tashaOptional = true;
  H.syncTashaAdditions(pounce);
  assert.deepEqual(names(pounce), ["Instinctive Pounce"], "Tasha's Instinctive Pounce");
});
test("Raging Storm reminds by the Storm Herald's environment", () => {
  const storm = (env) => {
    const c = barbarian("Path of the Storm Herald", 14);
    if(env) c.classes[0].options = { stormEnvironment: [{ name: env }] };
    return H.characterReminders(c);
  };
  assert.deepEqual(storm("Sea").map((x) => [x.name, x.when]), [["Raging Storm", "reaction"]]);
  assert.match(storm("Sea")[0].line, /prone/);
  assert.deepEqual(storm("Tundra").map((x) => [x.name, x.when]), [["Raging Storm", "bonus"]]);
  assert.match(storm("Tundra")[0].source, /^Path of the Storm Herald · Lv 14/);
  assert.deepEqual(storm("Desert"), [], "Desert's reaction is a button on the Rage card");
  assert.deepEqual(storm(""), [], "no environment picked yet");
});

function fighter(sub, lv, styles){
  const c = newCharacter("F");
  c.classes = [{ name: "Fighter", subclass: sub, level: lv }];
  c.features = (styles || []).map((s) => makeStyleFeature(s));
  return ensureShape(c);
}
test("a fighter's reminders (2026-11-03)", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(fighter("Champion", 20)), [], "everything a Champion has is on the sheet already");
  assert.deepEqual(r(fighter("Eldritch Knight", 10)), ["War Magic:bonus", "Eldritch Strike:always"]);
  const ek = H.characterReminders(fighter("Eldritch Knight", 18));
  assert.match(ek.find((x) => x.name === "War Magic").line, /cast a spell/, "Improved War Magic at 18");
  assert.deepEqual(r(fighter("Cavalier", 18)), ["Hold the Line:always", "Vigilant Defender:reaction"], "Unwavering Mark and Warding Maneuver are rows on Class resources");
  assert.deepEqual(r(fighter("Samurai", 15)), ["Rapid Strike:always"]);
});
test("fighting styles that need remembering", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(fighter("", 1, ["Protection"])), ["Protection:reaction"]);
  assert.deepEqual(r(fighter("", 1, ["Archery", "Defense", "Dueling", "Two-Weapon Fighting", "Blind Fighting"])), [], "the sheet applies these");
  const champ = H.characterReminders(fighter("Eldritch Knight", 7, ["Great Weapon Fighting", "Interception"]));
  assert.deepEqual(champ.map((x) => x.name), ["Great Weapon Fighting", "Interception", "War Magic"], "styles from fighter level 1");
  assert.equal(champ[0].source, "Fighting Style");
  assert.match(champ[0].text, /two-handed or versatile/);
  const pal = newCharacter("P");
  pal.classes = [{ name: "Paladin", subclass: "", level: 2 }];
  pal.features = [makeStyleFeature("Protection")];
  assert.equal(H.characterReminders(ensureShape(pal))[0].level, 2, "a paladin's style comes at 2");
});

function paladin(sub, lv){
  const c = newCharacter("P");
  c.classes = [{ name: "Paladin", subclass: sub, level: lv }];
  return ensureShape(c);
}
test("a paladin's reminders (2026-11-03): the auras friends share, and the oath's reactions", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(paladin("", 5)), [], "Divine Smite and Extra Attack are on the weapon cards and Attacks box");
  assert.deepEqual(r(paladin("Oath of Devotion", 10)), ["Aura of Protection:always", "Aura of Devotion:always", "Aura of Courage:always"], "by level");
  assert.deepEqual(r(paladin("Oath of Vengeance", 20)), ["Aura of Protection:always", "Relentless Avenger:reaction", "Aura of Courage:always"], "Soul of Vengeance is on the Vow of Enmity effect");
  assert.deepEqual(r(paladin("Oath of Conquest", 15)), ["Aura of Protection:always", "Aura of Conquest:always", "Aura of Courage:always", "Scornful Rebuke:always"]);
  assert.deepEqual(r(paladin("Oath of Redemption", 20)), ["Aura of Protection:always", "Aura of the Guardian:reaction", "Aura of Courage:always", "Emissary of Redemption:always"], "Protective Spirit is automated");
  assert.deepEqual(r(paladin("Oath of the Crown", 7)), ["Aura of Protection:always", "Divine Allegiance:reaction"]);
  assert.deepEqual(r(paladin("Oath of the Watchers", 7)), ["Aura of Protection:always", "Aura of the Sentinel:always"]);
  assert.deepEqual(r(paladin("Oath of Glory", 7)), ["Aura of Protection:always", "Aura of Alacrity:always"]);
  assert.deepEqual(r(paladin("Oath of the Ancients", 7)), ["Aura of Protection:always", "Aura of Warding:always"]);
  assert.deepEqual(r(paladin("Oathbreaker", 7)), ["Aura of Protection:always"], "Aura of Hate is added to the damage");
});

function ranger(sub, lv, options){
  const c = newCharacter("R");
  c.classes = [Object.assign({ name: "Ranger", subclass: sub, level: lv }, options ? { options } : {})];
  return ensureShape(c);
}
test("a ranger's reminders (2026-11-03)", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(ranger("", 13)), [], "Extra Attack, Land's Stride and the rest are on the sheet");
  assert.deepEqual(r(ranger("Gloom Stalker", 15)), ["Umbral Sight:always", "Vanish:bonus", "Shadowy Dodge:reaction"]);
  assert.deepEqual(r(ranger("Horizon Walker", 15)), ["Distant Strike:always", "Vanish:bonus", "Spectral Defense:reaction"], "Planar Warrior is on the weapon card");
  assert.deepEqual(r(ranger("Drakewarden", 15)), ["Vanish:bonus", "Perfected Bond:reaction"]);
  assert.deepEqual(r(ranger("Beast Master", 11)), [], "the companion's card says how to command it");
});
test("a Hunter's reminders follow the picks", () => {
  const r = (opts) => H.characterReminders(ranger("Hunter", 15, opts)).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r({ huntersPrey: [{ name: "Giant Killer" }], defensiveTactics: [{ name: "Escape the Horde" }], superiorHuntersDefense: [{ name: "Uncanny Dodge" }] }),
    ["Giant Killer:reaction", "Escape the Horde:always", "Vanish:bonus", "Uncanny Dodge:reaction"], "named after the pick");
  const gk = H.characterReminders(ranger("Hunter", 3, { huntersPrey: [{ name: "Giant Killer" }] }))[0];
  assert.match(gk.text, /Large or larger/);
  assert.doesNotMatch(gk.text, /Colossus Slayer/, "a tap shows the pick's own rules");
  assert.match(gk.source, /^Hunter · Lv 3/);
  const horde = H.characterReminders(ranger("Hunter", 7, { huntersPrey: [{ name: "Horde Breaker" }] }));
  assert.deepEqual(horde.map((x) => x.when), ["always"]);
  assert.match(horde[0].line, /different creature/);
  assert.deepEqual(r({ huntersPrey: [{ name: "Colossus Slayer" }], defensiveTactics: [{ name: "Multiattack Defense" }], superiorHuntersDefense: [{ name: "Evasion" }] }), ["Vanish:bonus"],
    "Colossus Slayer, Multiattack Defense and Evasion are on the sheet");
  assert.deepEqual(r(null), ["Vanish:bonus"], "nothing picked yet");
});

function bard(sub, lv){
  const c = newCharacter("B");
  c.classes = [{ name: "Bard", subclass: sub, level: lv }];
  return ensureShape(c);
}
test("a bard's reminders (2026-11-03): what inspired allies can do, and Battle Magic", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(bard("College of Lore", 20)), [], "Bardic Inspiration, Cutting Words and Peerless Skill are on the Bardic Inspiration row and dice tray");
  assert.deepEqual(r(bard("College of Valor", 14)), ["Combat Inspiration:always", "Battle Magic:bonus"]);
  assert.deepEqual(r(bard("College of Eloquence", 6)), ["Unfailing Inspiration:always"], "Unsettling Words is on the row");
  const t = bard("", 2);
  t.tashaOptional = true;
  H.syncTashaAdditions(t);
  assert.deepEqual(r(t), ["Magical Inspiration:always"], "Tasha's Magical Inspiration");
});

function cleric(sub, lv){
  const c = newCharacter("C");
  c.classes = [{ name: "Cleric", subclass: sub, level: lv }];
  return ensureShape(c);
}
test("a cleric's reminders (2026-11-03): Channel Divinity, Divine Strike and healing are on the sheet already", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  for(const sub of ["Life Domain", "Light Domain", "War Domain", "Knowledge Domain", "Twilight Domain", "Forge Domain", "Trickery Domain"])
    assert.deepEqual(r(cleric(sub, 20)), [], sub + ": nothing left to remind");
  assert.deepEqual(r(cleric("Tempest Domain", 6)), ["Thunderbolt Strike:always"]);
  assert.deepEqual(r(cleric("Nature Domain", 17)), ["Dampen Elements:reaction", "Master of Nature:bonus"]);
  assert.deepEqual(r(cleric("Order Domain", 1)), ["Voice of Authority:always"]);
  assert.deepEqual(r(cleric("Peace Domain", 6)), ["Protective Bond:reaction"]);
  assert.deepEqual(r(cleric("Death Domain", 17)), ["Inescapable Destruction:always"], "Reaper and Improved Reaper are on the spell cards");
  assert.deepEqual(r(cleric("Arcana Domain", 20)), [], "Spell Breaker is on the healing spells' cards");
  assert.deepEqual(r(cleric("Grave Domain", 17)), ["Keeper of Souls:always"]);
});
test("Warding Flare's row says Improved Flare from Light 6", () => {
  const flare = (lv) => H.characterResources(cleric("Light Domain", lv)).find((x) => x.name === "Warding Flare").hint;
  assert.match(flare(1), /against you from/);
  assert.match(flare(6), /against you or another creature/);
});

test("spell-card notes in place of reminders: Reaper, Improved Reaper, Spell Breaker, Moon Fire", () => {
  const death = (lv) => cleric("Death Domain", lv);
  assert.match(circleSpellNote(death(1), "Toll the Dead"), /^Reaper: if it targets only one creature/);
  assert.equal(circleSpellNote(death(1), "Fire Bolt"), "", "not a necromancy cantrip");
  assert.doesNotMatch(circleSpellNote(death(16), "Blindness/Deafness"), /Reaper/, "Improved Reaper at 17");
  assert.match(circleSpellNote(death(17), "Blindness/Deafness"), /^Improved Reaper: .*components for each/);
  assert.doesNotMatch(circleSpellNote(death(17), "Circle of Death"), /Reaper/, "6th level is too high");
  assert.match(healingNote(cleric("Arcana Domain", 6), "Cure Wounds"), /Spell Breaker/);
  assert.equal(healingNote(cleric("Arcana Domain", 5), "Cure Wounds"), "");
  const lunar = newCharacter("L");
  lunar.classes = [{ name: "Sorcerer", subclass: "Lunar Sorcery", level: 1 }];
  assert.match(circleSpellNote(ensureShape(lunar), "Sacred Flame"), /^Moon Fire: you can target two creatures/);
});
function sorcerer(sub, lv){
  const c = newCharacter("S");
  c.classes = [{ name: "Sorcerer", subclass: sub, level: lv }];
  return ensureShape(c);
}
test("a sorcerer's reminders (2026-11-03): what the Sorcery Points row and spell cards don't show", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  for(const sub of ["Draconic Bloodline", "Wild Magic", "Divine Soul", "Shadow Magic", "Aberrant Mind", "Clockwork Soul", "Lunar Sorcery"])
    assert.deepEqual(r(sorcerer(sub, 20)), [], sub);
  assert.deepEqual(r(sorcerer("Storm Sorcery", 14)), ["Tempestuous Magic:bonus", "Storm's Fury:reaction"]);
});

test("an artificer's reminders (2026-11-03): only Magic Item Savant", () => {
  const art = (sub, lv) => { const c = newCharacter("A"); c.classes = [{ name: "Artificer", subclass: sub, level: lv }]; return ensureShape(c); };
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(art("Battle Smith", 13)), [], "the defender, cannons and armor have their own cards and rows");
  for(const sub of ["Alchemist", "Artillerist", "Battle Smith", "Armorer"]) assert.deepEqual(r(art(sub, 20)), ["Magic Item Savant:always"], sub);
});

function warlock(sub, lv, extra){
  const c = newCharacter("W");
  c.classes = [Object.assign({ name: "Warlock", subclass: sub, level: lv }, extra || {})];
  return ensureShape(c);
}
test("a warlock's reminders (2026-11-03): patrons and invocations", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(warlock("The Fiend", 20)), [], "the Fiend's features are resources and effects");
  assert.deepEqual(r(warlock("The Archfey", 10)), ["Beguiling Defenses:reaction"]);
  assert.deepEqual(r(warlock("The Great Old One", 10)), ["Thought Shield:always"]);
  assert.deepEqual(r(warlock("The Undying", 10)), ["Undying Nature:always"]);
  const hex = warlock("The Hexblade", 7, { invocations: [{ name: "Maddening Hex" }, { name: "Relentless Hex" }, { name: "Agonizing Blast" }, { name: "Eyes of the Rune Keeper" }] });
  const hr = H.characterReminders(hex);
  assert.deepEqual(hr.map((x) => x.name + ":" + x.when), ["Eyes of the Rune Keeper:always", "Maddening Hex:bonus", "Relentless Hex:bonus"], "by the level each needs; Agonizing Blast is in the damage");
  assert.equal(hr[1].source, "Eldritch Invocation");
  assert.match(hr[1].text, /psychic disturbance|psychic damage/);
});
test("an invocation from Eldritch Adept reminds too", () => {
  const c = newCharacter("E");
  c.classes = [{ name: "Fighter", subclass: "Champion", level: 4 }];
  c.feats = [{ name: "Eldritch Adept", picks: { option: "Eyes of the Rune Keeper" } }];
  assert.deepEqual(H.characterReminders(ensureShape(c)).map((x) => x.name), ["Eyes of the Rune Keeper"]);
});
test("the familiar's card: Voice and Investment of the Chain Master", () => {
  const chain = (invs) => {
    const c = warlock("The Fiend", 5, { pactBoon: "Pact of the Chain", invocations: invs.map((name) => ({ name })) });
    c.companions = { familiar: { choice: "Imp", hp: [] } };
    const fam = characterCompanions(c).find((x) => x.def.id === "familiar");
    return fam && fam.stats ? fam.stats.traits.map((t) => t.name).filter(Boolean) : null;
  };
  const plain = chain([]);
  assert.ok(plain && !plain.includes("Voice of the Chain Master"), "none without the invocations");
  const both = chain(["Voice of the Chain Master", "Investment of the Chain Master"]);
  assert.ok(both.includes("Voice of the Chain Master") && both.includes("Investment of the Chain Master"), both.join(", "));
});

test("a wizard's reminders (2026-11-03)", () => {
  const wiz = (sub, lv) => { const c = newCharacter("W"); c.classes = [{ name: "Wizard", subclass: sub, level: lv }]; return ensureShape(c); };
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  for(const sub of ["School of Evocation", "School of Divination", "School of Necromancy", "War Magic", "Order of Scribes", "School of Conjuration", "School of Transmutation", "Chronurgy Magic"])
    assert.deepEqual(r(wiz(sub, 20)), [], sub);
  assert.deepEqual(r(wiz("School of Abjuration", 6)), ["Projected Ward:reaction"]);
  assert.deepEqual(r(wiz("School of Illusion", 14)), ["Illusory Reality:bonus"]);
  assert.deepEqual(r(wiz("School of Enchantment", 6)), ["Instinctive Charm:reaction"]);
  assert.deepEqual(r(wiz("Graviturgy Magic", 6)), ["Gravity Well:always"]);
  assert.deepEqual(r(wiz("Bladesinging", 6)), ["Extra Attack:always"], "a cantrip in place of an attack; Bladesong and Song of Defense are on Active effects");
});

test("a druid's reminders (2026-11-03)", () => {
  const dru = (sub, lv) => { const c = newCharacter("D"); c.classes = [{ name: "Druid", subclass: sub, level: lv }]; return ensureShape(c); };
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  for(const sub of ["Circle of the Moon", "Circle of Stars", "Circle of Wildfire", "Circle of Dreams", "Circle of the Shepherd", "Circle of the Blighted"])
    assert.deepEqual(r(dru(sub, 20)), [], sub + ": Wild Shape, effects and cards cover it");
  assert.deepEqual(r(dru("Circle of the Land", 14)), ["Nature's Sanctuary:always"]);
  assert.deepEqual(r(dru("Circle of Spores", 14)), ["Fungal Body:always"]);
});

test("the Gunslinger class's reminders (2026-11-03, Spikael's, private)", () => {
  const gun = (sub, lv) => { const c = newCharacter("G"); c.classes = [{ name: "Gunslinger", subclass: sub, level: lv }]; return ensureShape(c); };
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(gun("Marksman", 20)), [], "the firearm cards and rolls cover the Marksman");
  assert.deepEqual(r(gun("Marshal", 20)), [], "and the Marshal");
  assert.deepEqual(r(gun("Outlaw", 3)), ["Drawn and Quartered:reaction"]);
  assert.deepEqual(r(gun("Eldritch Gunman", 14)), ["War Magic:bonus", "Eldritch Shot:always"]);
  assert.deepEqual(r(gun("Eldritch Gunman", 18)), ["Eldritch Shot:always", "Improved War Magic:bonus"], "Improved War Magic takes War Magic's place");
});

function withFeats(names, cls){
  const c = newCharacter("F");
  c.classes = [cls || { name: "Fighter", subclass: "Champion", level: 8 }];
  c.feats = names.map((n) => (typeof n === "string" ? { name: n } : n));
  return ensureShape(c);
}
test("feats' reminders (2026-11-03), after the class features", () => {
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(withFeats(["Sentinel", "Polearm Master", "Great Weapon Master", "Tough", "Lucky"])),
    ["Sentinel:reaction", "Polearm Master:reaction", "Great Weapon Master:bonus"], "Tough is in the HP, Lucky is a resource row");
  const rows = H.characterReminders(withFeats(["War Caster"], { name: "Wizard", subclass: "School of Abjuration", level: 6 }));
  assert.deepEqual(rows.map((x) => x.name), ["Projected Ward", "War Caster"], "feats after the class features");
  assert.equal(rows[1].source, "Feat");
  assert.match(rows[1].text, /somatic components/, "a tap shows the feat's text");
  // (Mage Slayer (2024)'s row is Guarded Mind, its reminder the other half: Concentration Breaker.)
  for(const name of Object.keys(FEAT_RESOURCES)) assert.ok(name === "Mage Slayer (2024)" || !(FEATS_CATALOG.find((f) => f.name === name) || {}).remind, name + " is already a resource row");
});
test("Elemental Adept and Flames of Phlegethos on the spell cards", () => {
  const wiz = { name: "Wizard", subclass: "", level: 5 };
  const adept = withFeats([{ name: "Elemental Adept", picks: { option: "Fire" } }], wiz);
  assert.match(circleSpellNote(adept, "Fireball"), /Elemental Adept: it ignores resistance to fire damage/);
  assert.doesNotMatch(circleSpellNote(adept, "Lightning Bolt"), /Elemental Adept/, "only the picked type");
  assert.match(circleSpellNote(withFeats(["Flames of Phlegethos"], wiz), "Fire Bolt"), /^Flames of Phlegethos: reroll any 1/);
  assert.equal(H.characterReminders(adept).length, 0, "no Remember row for them");
});

test("race traits' reminders (2026-11-03)", async () => {
  const { RACE_DATA, RACE_TRAIT_REMINDS, TRAIT_ADVANTAGES } = await import("../js/data/race-data.js");
  const { RACE_RESOURCES } = await import("../js/data/resources.js");
  const traitNames = new Set([].concat(...Object.values(RACE_DATA).map((d) => (d.traits || []).map((t) => t.name))));
  const raceRes = new Set([].concat(...Object.values(RACE_RESOURCES).map((l) => l.map((r) => r.name))));
  for(const [name, r] of Object.entries(RACE_TRAIT_REMINDS)){
    assert.ok(traitNames.has(name), name + " is a trait");
    assert.ok(["bonus", "reaction", "always"].includes(r.when) && r.line.length <= 84 && !/[;·–—]/.test(r.line) && !/\.$/.test(r.line), name + ": a plain short line");
    assert.ok(!TRAIT_ADVANTAGES[name] && !raceRes.has(name), name + ": not already on the sheet");
  }
  const race = (name, cls) => { const c = newCharacter("R"); c.race = name; c.classes = [cls || { name: "Fighter", subclass: "", level: 1 }]; return ensureShape(c); };
  const r = (c) => H.characterReminders(c).map((x) => x.name + ":" + x.when);
  assert.deepEqual(r(race("Lightfoot Halfling")), ["Lucky:always", "Halfling Nimbleness:always"]);
  assert.deepEqual(r(race("Goblin")), ["Nimble Escape:bonus"], "Fury of the Small is a resource row");
  assert.deepEqual(r(race("Human")), []);
  const rows = H.characterReminders(race("Half-Orc", { name: "Rogue", subclass: "", level: 2 }));
  assert.deepEqual(rows.map((x) => x.name), ["Savage Attacks", "Cunning Action"], "race traits from level 1");
  assert.equal(rows[0].source, "Race · Half-Orc");
});

test("a Dragonmark's d4 on its skill checks", () => {
  const marked = (race) => { const c = newCharacter("D"); c.race = race; c.classes = [{ name: "Fighter", subclass: "", level: 1 }]; return ensureShape(c); };
  assert.equal(H.raceCheckD4(marked("Human (Mark of Finding)"), "Perception"), "Hunter's Intuition");
  assert.equal(H.raceCheckD4(marked("Human (Mark of Finding)"), "Survival"), "Hunter's Intuition");
  assert.equal(H.raceCheckD4(marked("Human (Mark of Finding)"), "Athletics"), "");
  assert.equal(H.raceCheckD4(marked("Dwarf (Mark of Warding)"), "Investigation"), "Warder's Intuition");
  assert.equal(H.raceCheckD4(marked("Human"), "Perception"), "");
});
