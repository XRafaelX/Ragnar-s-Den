/* ---------------- Background story ----------------
   The character's personality traits, ideal, bond and flaw, and its
   background's own story tables (js/data/background-stories.js), kept as
   text on c.story = {traits: [two], ideal, bond, flaw, tables: {label:
   text}}. A value is a table entry or the player's own words; changing
   background keeps what was written. */
import { BACKGROUND_STORIES, BACKGROUND_STORIES_FROM } from "../data/background-stories.js";

export function storyShape(c){
  var s = c.story && typeof c.story === "object" ? c.story : {};
  if(!Array.isArray(s.traits)) s.traits = [];
  while(s.traits.length < 2) s.traits.push("");
  ["ideal", "bond", "flaw"].forEach(function(k){ if(typeof s[k] !== "string") s[k] = ""; });
  if(!s.tables || typeof s.tables !== "object") s.tables = {};
  c.story = s;
  return s;
}

/* The tables a background rolls on: {traits, ideal, bond, flaw (each a
   table or null), story: [tables], from: whose traits... it borrows
   ("Soldier") or ""}. */
/* The Player's Handbook's variants are their base background through and
   through (a Spy has the Criminal's Specialty table too); a Sword Coast
   background borrows only the "traits and motivations" its page names,
   keeping its own story tables (an Inheritor's Inheritance). */
var VARIANTS = ["Knight", "Spy", "Pirate", "Gladiator", "Guild Merchant"];
export function storyTables(background){
  var from = BACKGROUND_STORIES_FROM[background] || "";
  var own = BACKGROUND_STORIES[background] || {};
  var base = from ? BACKGROUND_STORIES[from] || {} : own;
  var out = {from: from, story: (VARIANTS.indexOf(background) !== -1 ? base.story : own.story) || []};
  ["traits", "ideal", "bond", "flaw"].forEach(function(k){ out[k] = base[k] || null; });
  return out;
}

/* The roll label for an entry ("1", or "2-3" on a table with ranges). */
export function entryRoll(table, i){
  return table.rolls ? table.rolls[i] : String(i + 1);
}
/* Roll the table's die and read the entry it lands on (ranges too);
   `avoid` skips one text (a second personality trait differs from the
   first). `rng` returns [0, 1). */
export function rollStory(table, rng, avoid){
  if(!table || !table.entries.length) return "";
  rng = rng || Math.random;
  for(var tries = 0; tries < 20; tries++){
    var n = Math.floor(rng() * table.die) + 1, i = table.entries.length - 1;
    if(table.rolls){
      i = table.rolls.findIndex(function(r){ var p = String(r).split("-").map(Number); return n >= p[0] && n <= (p[1] || p[0]); });
      if(i === -1) i = table.entries.length - 1;
    } else i = Math.min(n, table.entries.length) - 1;
    if(table.entries[i] !== avoid || table.entries.length < 2) return table.entries[i];
  }
  return table.entries.find(function(e){ return e !== avoid; }) || table.entries[0];
}
