/* ---------------- The 2024 Player's Handbook's weapon changes ----------------
   The Weapons table (p. 215), checked against the printed book on
   2026-11-06: only the weapons whose stats differ from the 2014 ones.
   A character on the 2024 rules (or with a 2024 class) uses these, swapped
   into WEAPON_DATA by js/core/weapon-edition.js. The Net is no longer a
   weapon in 2024 but adventuring gear (p. 227): NET_2024. */
export var WEAPON_DATA_2024 = {
  // (2014: 1d12, reach, special.)
  "Lance":     {damageDice:"1d10", damageType:"Piercing",    weight:6, category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, special",
    special:"You need two hands to attack with it unless you're mounted."},
  // (2014: 1d6, versatile 1d8.)
  "Trident":   {damageDice:"1d8",  damageType:"Piercing",    weight:4, category:"martial", finesse:false, ranged:false, properties:"Thrown (20/60), versatile (1d10)"},
  // (2014: not versatile.)
  "War Pick":  {damageDice:"1d8",  damageType:"Piercing",    weight:2, category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)"},
  // (2014: 2 lb.)
  "Warhammer": {damageDice:"1d8",  damageType:"Bludgeoning", weight:5, category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)"}
};
/* The 2024 Net, on the Inventory's adventuring gear list. */
export var NET_2024 = {cost:"1 gp", weight:3,
  notes:"In place of one attack of the Attack action, throw it at a creature you can see within 15 ft. It makes a DEX save (DC 8 + your DEX modifier + proficiency bonus) or is restrained (Huge or larger succeed). A DC 10 Athletics check as an action, or destroying the net (AC 10, 5 HP), frees it."};
