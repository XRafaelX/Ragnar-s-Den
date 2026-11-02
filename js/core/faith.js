/* ---------------- Faith ----------------
   The gods behind the Personality card's Faith tile (js/data/deities.js),
   read for display, and which of them suit a cleric's domain. Flavour
   only: nothing on the sheet depends on the god chosen. */
import { DEITY_GROUPS, ALIGNMENT_NAMES } from "../data/deities.js";

/* One god for display: "Pelor, the Dawn Father (healing, sun)" gives
   name "Pelor", title "the Dawn Father", about "healing, sun"; a Player's
   Handbook "Lathander, god of birth and renewal" gives name "Lathander"
   and about "god of birth and renewal". `text` is what the tile keeps. */
export function readGod(entry){
  var text = entry[0], cut = text.indexOf(", ");
  var name = cut === -1 ? text : text.slice(0, cut), rest = cut === -1 ? "" : text.slice(cut + 2);
  var title = "", about = rest, paren = rest.match(/^(.*?)\s*\(([^)]+)\)$/);
  if(paren){ title = paren[1]; about = paren[2]; }
  else if(/^the /i.test(rest)){ title = rest; about = ""; }
  var al = entry[1];
  return {text: text, name: name, title: title, about: about, alignment: al,
    alignmentName: ALIGNMENT_NAMES[al] || al,
    // Good, Neutral or Evil: colours the badge.
    moral: /G$/.test(al) ? "good" : /E$/.test(al) ? "evil" : "neutral",
    domains: entry[2].split(/,\s*/), symbol: entry[3] || ""};
}

/* The pantheons as tabs: {label, sections: [{label, gods}]}. Exandria's
   Prime Deities and Betrayer Gods share one tab. */
export function faithTabs(){
  var tabs = [];
  DEITY_GROUPS.forEach(function(g){
    var m = g.label.match(/^(.+?): (.+)$/), label = m ? m[1] : g.label;
    var tab = tabs.find(function(t){ return t.label === label; });
    if(!tab){ tab = {label: label, sections: []}; tabs.push(tab); }
    tab.sections.push({label: m ? m[2] : "", gods: g.gods.map(readGod)});
  });
  return tabs;
}

/* The domains of a character's cleric levels: "Life Domain" gives
   ["Life"]. Empty for a cleric with no domain yet, or no cleric. */
export function clericDomains(c){
  return (c && c.classes || []).filter(function(cl){ return cl.name === "Cleric" && cl.subclass; })
    .map(function(cl){ return cl.subclass.replace(/ Domain$/, ""); });
}

/* Every god (each name once, first pantheon wins) whose suggested
   domains include one of `domains`. */
export function godsForDomains(domains){
  if(!domains.length) return [];
  var seen = {}, out = [];
  faithTabs().forEach(function(t){
    t.sections.forEach(function(s){
      s.gods.forEach(function(g){
        if(seen[g.text] || !g.domains.some(function(d){ return domains.indexOf(d) !== -1; })) return;
        seen[g.text] = true;
        out.push(g);
      });
    });
  });
  return out;
}
