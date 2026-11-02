/* ---------------- The Remember card (Vitals) ----------------
   Features a new player forgets mid-fight: ones the sheet can't apply
   on its own and that nothing else on the sheet shows. A feature carries
   remind: {when, line}:
     when  "bonus" (it takes a bonus action), "reaction" or "always"
           (always on)
     line  one short, plain sentence for the card (the full text opens
           on a tap)
   Features already applied or shown elsewhere don't get one: notes on
   the saves card (saveNote), advantage in the skills list, Active
   effects, rows on Class resources. tests/reminders.test.mjs keeps it so. */
import { classFeatureList } from "./class-features.js";

export var REMIND_GROUPS = [
  {when: "bonus", label: "Bonus actions"},
  {when: "reaction", label: "Reactions"},
  {when: "always", label: "Always on"}
];

/* [{name, when, line, text, source}] in the order the character gained
   them, one per feature name. */
export function characterReminders(c){
  var out = [];
  (c.classes||[]).forEach(function(cl){
    classFeatureList(cl).forEach(function(f){
      if(!f.remind || out.some(function(x){ return x.name===f.name; })) return;
      out.push({name: f.name, when: f.remind.when, line: f.remind.line, text: f.text, level: f.level,
        source: (f.subclass ? cl.subclass : "Class · " + cl.name) + " · Lv " + f.level});
    });
  });
  // By the level they come at, class and subclass features mixed.
  return out.sort(function(a, b){ return a.level - b.level; });
}
