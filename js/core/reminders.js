/* ---------------- The Remember card (Vitals) ----------------
   Features a new player forgets mid-fight: ones the sheet can't apply
   on its own and that nothing else on the sheet shows. A feature carries
   remind: {when, line}:
     when  "bonus" (it takes a bonus action), "reaction" or "always"
           (always on)
     line  one short, plain sentence for the card (the full text opens
           on a tap)
   or, when it depends on an option the player picked (a Storm Herald's
   environment), remind: {pick: setId, by: {optionName: {when, line}}}:
   only the picked option's reminder shows, and an option left out of
   `by` has none (its rule is already on a card). With `optionName` the
   row is named after the option and a tap opens the option's own rules
   (a Hunter's Giant Killer, not Hunter's Prey and all three choices).
   `supersedes` names an earlier feature's reminder this one replaces (the
   Eldritch Gunman's Improved War Magic over War Magic).
   Fighting styles (FIGHTING_STYLES) carry one the same way: Protection,
   Interception, Great Weapon Fighting. So do eldritch invocations
   (INVOCATIONS), a warlock's own and one from Eldritch Adept.
   Features already applied or shown elsewhere don't get one: notes on
   the saves card (saveNote), advantage in the skills list, Active
   effects, rows on Class resources. tests/reminders.test.mjs keeps it so. */
import { classFeatureList } from "./class-features.js";
import { knownOptions } from "./class-options.js";
import { styleFeatures, styleDef } from "./fighting-styles.js";
import { CLASS_PROGRESSION } from "../data/progression.js";
import { optionDef } from "../data/class-options.js";
import { knownInvocations, featInvocations } from "./invocations.js";
import { invocationDef } from "../data/invocations.js";
import { featDef } from "./feat-picks.js";
import { RACE_DATA, RACE_TRAIT_REMINDS } from "../data/race-data.js";
import { totalLevel } from "./basics.js";

export var REMIND_GROUPS = [
  {when: "bonus", label: "Bonus actions"},
  {when: "reaction", label: "Reactions"},
  {when: "always", label: "Always on"}
];

/* A feature's reminder for this class entry ({when, line, name, text}),
   or null: the picked option's for a pick-based one. */
export function featureRemind(cl, f){
  var r = f.remind;
  if(!r) return null;
  if(!r.pick) return {when: r.when, line: r.line, name: f.name, text: f.text, supersedes: r.supersedes};
  var o = knownOptions(cl, r.pick)[0], by = o && r.by[o.name];
  if(!by) return null;
  var def = r.optionName ? optionDef(r.pick, o.name) : null;
  return {when: by.when, line: by.line, name: def ? o.name : f.name, text: def ? def.text : f.text};
}
/* [{name, when, line, text, source}] in the order the character gained
   them, one per feature name. */
export function characterReminders(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      var r = featureRemind(cl, f);
      if(!r || out.some(function(x){ return x.name===r.name; })) return;
      // (By the level the reminder first came at: Martial Arts at 1, not
      // its upgrade at 17, and walking up walls at 9.)
      var lv = f.remindLevel || f.level;
      if(r.supersedes) out = out.filter(function(x){ return x.name!==r.supersedes; });
      out.push({name: r.name, when: r.when, line: r.line, text: r.text, level: lv, supersedes: r.supersedes,
        source: (f.subclass ? cl.subclass : "Class · " + cl.name) + " · Lv " + lv});
    });
  });
  // (A later feature that supersedes one gained after it in the list.)
  var gone = out.map(function(x){ return x.supersedes; }).filter(Boolean);
  out = out.filter(function(x){ return gone.indexOf(x.name)===-1; });
  // Fighting styles, at the level the first one came (fighter 1,
  // paladin and ranger 2).
  var styleLv = (c.classes||[]).reduce(function(lv, cl){
    var fs = (CLASS_PROGRESSION[cl.name]||{}).fightingStyle;
    return fs ? Math.min(lv, fs.level) : lv;
  }, 99);
  if(styleLv===99) styleLv = 1;
  // (A 2024 Fighting Style feat's feature carries its own wording.)
  styleFeatures(c).forEach(function(f){
    var def = styleDef(f.fightingStyle), r = f.remind || (def && def.remind);
    if(!r || out.some(function(x){ return x.name===f.fightingStyle; })) return;
    out.push({name: f.fightingStyle, when: r.when, line: r.line, text: f.remind ? f.text : def.text, level: styleLv, source: "Fighting Style"});
  });
  // Eldritch invocations, at the warlock level each needs (2 at the least).
  var invs = [];
  (c.classes||[]).forEach(function(cl){
    if(cl.name==="Warlock") knownInvocations(cl).forEach(function(e){ var d = invocationDef(e.name); if(d) invs.push(d); });
  });
  invs.concat(featInvocations(c)).forEach(function(d){
    if(!d.remind || out.some(function(x){ return x.name===d.name; })) return;
    out.push({name: d.name, when: d.remind.when, line: d.remind.line, text: d.text, level: d.level || 2, source: "Eldritch Invocation"});
  });
  // Race traits (RACE_TRAIT_REMINDS), from level 1 or the level a trait
  // comes at.
  var lvl = totalLevel(c);
  ((RACE_DATA[c.race] || {}).traits || []).forEach(function(t){
    var r = RACE_TRAIT_REMINDS[t.name];
    if(!r || (t.level && lvl < t.level) || out.some(function(x){ return x.name===t.name; })) return;
    out.push({name: t.name, when: r.when, line: r.line, text: t.text, level: t.level || 1, source: "Race · " + c.race});
  });
  // Feats, after the class features (a feat doesn't keep the level it
  // was taken at).
  (c.feats||[]).forEach(function(f){
    var d = featDef(f.name), r = d && d.remind;
    if(!r || out.some(function(x){ return x.name===d.name; })) return;
    out.push({name: d.name, when: r.when, line: r.line, text: d.description, level: 21, source: "Feat"});
  });
  // By the level they come at, class and subclass features mixed.
  return out.sort(function(a, b){ return a.level - b.level; });
}
