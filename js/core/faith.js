/* ---------------- Faith ----------------
   The gods behind the Personality card's Faith tile (js/data/deities.js),
   read for display, the player's own gods, the search, and which gods
   suit a cleric's domain. Flavour only: nothing on the sheet depends on
   the god chosen.
   The character keeps c.story.faith (the chosen god's text) and
   c.story.customGods: [{name, title, alignment ("NG", or ""), domains:
   [...], symbol, icon (a DEITY_ICONS key, or "")}]. */
import { DEITY_GROUPS, ALIGNMENT_NAMES } from "../data/deities.js";
import { DEITY_ICONS } from "../data/deity-icons.js";
import { storyShape } from "./background-story.js";

/* The domains a god of your own can suggest: every cleric domain. */
export var FAITH_DOMAINS = ["Arcana", "Death", "Forge", "Grave", "Knowledge", "Life", "Light", "Nature",
  "Order", "Peace", "Tempest", "Trickery", "Twilight", "War"];

function moralOf(al){ return /G$/.test(al) ? "good" : /E$/.test(al) ? "evil" : "neutral"; }

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
    moral: moralOf(al),
    domains: entry[2] ? entry[2].split(/,\s*/) : [], symbol: entry[3] || "", icon: entry[4] || ""};
}

/* What the tile keeps for a god of your own: "Sol, goddess of the
   harvest", or just "Sol". */
export function customGodText(g){
  return (g.name || "").trim() + (g.title && g.title.trim() ? ", " + g.title.trim() : "");
}
/* A god of your own read like a listed one; `index` is its place in
   c.story.customGods. */
export function readCustomGod(g, index){
  var al = g.alignment || "";
  return {text: customGodText(g), name: (g.name || "").trim(), title: "", about: (g.title || "").trim(),
    alignment: al, alignmentName: ALIGNMENT_NAMES[al] || "", moral: moralOf(al),
    domains: (g.domains || []).slice(), symbol: (g.symbol || "").trim(), icon: g.icon || "",
    custom: true, index: index};
}

function listedGod(text){
  for(var i = 0; i < DEITY_GROUPS.length; i++){
    var d = DEITY_GROUPS[i].gods.find(function(e){ return e[0] === text; });
    if(d) return readGod(d);
  }
  return null;
}

/* c.story with its customGods list. A faith written in your own words
   before gods of your own existed becomes one, so it shows (and can be
   edited) with the others. */
export function faithShape(c){
  var s = storyShape(c);
  if(!Array.isArray(s.customGods)) s.customGods = [];
  if(s.faith && !listedGod(s.faith) && !s.customGods.some(function(g){ return customGodText(g) === s.faith; })){
    s.customGods.push({name: s.faith, title: "", alignment: "", domains: [], symbol: "", icon: ""});
  }
  return s;
}

/* The character's own gods, read for display. */
export function customGods(c){
  var list = c && c.story && Array.isArray(c.story.customGods) ? c.story.customGods : [];
  return list.map(readCustomGod);
}

/* A god's icon as an SVG string (filled with the text colour). A god of
   your own without one gets a four-pointed star; no god, "". */
var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/></svg>';
export function iconSvg(key){
  var d = DEITY_ICONS[key];
  return d ? '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>' : "";
}
export function godIconSvg(g){
  if(!g) return "";
  return iconSvg(g.icon) || (g.custom ? STAR : "");
}

/* The god a saved faith names (a listed one, or one of the character's
   own when `c` is given), or null. */
export function godByText(text, c){
  if(!text) return null;
  return listedGod(text) || customGods(c).find(function(g){ return g.text === text; }) || null;
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

/* Every god (each name once: the character's own first, then the first
   pantheon that lists it) whose suggested domains include one of
   `domains`. */
export function godsForDomains(domains, c){
  if(!domains.length) return [];
  var seen = {}, out = [];
  function add(g){
    if(seen[g.text] || !g.domains.some(function(d){ return domains.indexOf(d) !== -1; })) return;
    seen[g.text] = true;
    out.push(g);
  }
  customGods(c).forEach(add);
  faithTabs().forEach(function(t){ t.sections.forEach(function(s){ s.gods.forEach(add); }); });
  return out;
}

/* The search: every word typed must appear in the god's name, title,
   what it rules, alignment, domains or holy symbol. Sections like the
   tabs' ("Your gods", "Forgotten Realms", "Exandria: Prime Deities"...),
   empty ones left out. */
export function searchGods(query, c){
  var words = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length) return [];
  // Accents don't count (selune finds Selûne), and Vaatniδ's δ is a d.
  function plain(t){ return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/δ/g, "d"); }
  function hit(g){
    var hay = plain([g.name, g.title, g.about, g.alignmentName, g.domains.join(" "), g.symbol].join(" "));
    return words.every(function(w){ return hay.indexOf(plain(w)) !== -1; });
  }
  var out = [{label: "Your gods", gods: customGods(c).filter(hit)}];
  faithTabs().forEach(function(t){
    t.sections.forEach(function(s){ out.push({label: s.label ? t.label + ": " + s.label : t.label, gods: s.gods.filter(hit)}); });
  });
  return out.filter(function(s){ return s.gods.length; });
}
