/* ---------------- Weapon data (SRD, plus the double-bladed scimitar, khopesh and firearms) ----------------
   The Player's Handbook's weapons, Eberron's double-bladed scimitar (for
   Revenant Blade), Plane Shift: Amonkhet's khopesh and two-handed khopesh,
   and the firearms (for Gunner and the Gunslinger archetype) with the
   Gunslinger write-up's Reload and Misfire scores, plus its fire lance.
   Firearms are their own category: neither simple nor martial, so only a
   proficiency in firearms covers them. `treatAs`: the book says to treat
   it as that weapon, so proficiency with one covers the other. */
export var WEAPON_GROUPS = {
  "Simple Melee": ["Club","Dagger","Greatclub","Handaxe","Javelin","Light Hammer","Mace","Quarterstaff","Sickle","Spear"],
  "Simple Ranged": ["Light Crossbow","Dart","Shortbow","Sling"],
  "Martial Melee": ["Battleaxe","Double-Bladed Scimitar","Fire Lance","Flail","Glaive","Greataxe","Greatsword","Halberd","Khopesh","Lance","Longsword","Maul","Morningstar","Pike","Rapier","Scimitar","Shortsword","Trident","Two-Handed Khopesh","War Pick","Warhammer","Whip"],
  "Martial Ranged": ["Blowgun","Hand Crossbow","Heavy Crossbow","Longbow","Net"],
  "Firearms": ["Pistol","Revolver","Pepperbox","Musket"]
};

/* category: simple|martial|firearm; used to auto-detect class weapon proficiency.
   finesse/ranged; used to pick a sensible default attack ability. */
export var WEAPON_DATA = {
  "Club":            {damageDice:"1d4",  damageType:"Bludgeoning", weight:2,  category:"simple",  finesse:false, ranged:false, properties:"Light"},
  "Dagger":          {damageDice:"1d4",  damageType:"Piercing",    weight:1,  category:"simple",  finesse:true,  ranged:false, properties:"Finesse, light, thrown (20/60)"},
  "Greatclub":       {damageDice:"1d8",  damageType:"Bludgeoning", weight:10, category:"simple",  finesse:false, ranged:false, properties:"Two-handed"},
  "Handaxe":         {damageDice:"1d6",  damageType:"Slashing",    weight:2,  category:"simple",  finesse:false, ranged:false, properties:"Light, thrown (20/60)"},
  "Javelin":         {damageDice:"1d6",  damageType:"Piercing",    weight:2,  category:"simple",  finesse:false, ranged:false, properties:"Thrown (30/120)"},
  "Light Hammer":    {damageDice:"1d4",  damageType:"Bludgeoning", weight:2,  category:"simple",  finesse:false, ranged:false, properties:"Light, thrown (20/60)"},
  "Mace":            {damageDice:"1d6",  damageType:"Bludgeoning", weight:4,  category:"simple",  finesse:false, ranged:false, properties:""},
  "Quarterstaff":    {damageDice:"1d6",  damageType:"Bludgeoning", weight:4,  category:"simple",  finesse:false, ranged:false, properties:"Versatile (1d8)"},
  "Sickle":          {damageDice:"1d4",  damageType:"Slashing",    weight:2,  category:"simple",  finesse:false, ranged:false, properties:"Light"},
  "Spear":           {damageDice:"1d6",  damageType:"Piercing",    weight:3,  category:"simple",  finesse:false, ranged:false, properties:"Thrown (20/60), versatile (1d8)"},
  "Light Crossbow":  {damageDice:"1d8",  damageType:"Piercing",    weight:5,  category:"simple",  finesse:false, ranged:true,  properties:"Ammunition, two-handed, loading"},
  "Dart":            {damageDice:"1d4",  damageType:"Piercing",    weight:0.25, category:"simple",finesse:true,  ranged:true,  properties:"Finesse, thrown (20/60)"},
  "Shortbow":        {damageDice:"1d6",  damageType:"Piercing",    weight:2,  category:"simple",  finesse:false, ranged:true,  properties:"Ammunition, two-handed"},
  "Sling":           {damageDice:"1d4",  damageType:"Bludgeoning", weight:0,  category:"simple",  finesse:false, ranged:true,  properties:"Ammunition"},
  "Battleaxe":       {damageDice:"1d8",  damageType:"Slashing",    weight:4,  category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)"},
  // Special: after attacking with it as part of the Attack action, a bonus
  // action attack with its other blade deals 1d4 slashing instead of 2d4.
  "Double-Bladed Scimitar": {damageDice:"2d4", damageType:"Slashing", weight:6, category:"martial", finesse:false, ranged:false, properties:"Special, two-handed"},
  // Special: it can also make a ranged attack out to 35 feet for 1d8 piercing
  // damage. Reload it with firearm ammunition as an action before the next one.
  "Fire Lance":      {damageDice:"1d10", damageType:"Piercing",    weight:18, category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, special, two-handed"},
  "Flail":           {damageDice:"1d8",  damageType:"Bludgeoning", weight:2,  category:"martial", finesse:false, ranged:false, properties:""},
  "Glaive":          {damageDice:"1d10", damageType:"Slashing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, two-handed"},
  "Greataxe":        {damageDice:"1d12", damageType:"Slashing",    weight:7,  category:"martial", finesse:false, ranged:false, properties:"Heavy, two-handed"},
  "Greatsword":      {damageDice:"2d6",  damageType:"Slashing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Heavy, two-handed"},
  "Halberd":         {damageDice:"1d10", damageType:"Slashing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, two-handed"},
  // Plane Shift: Amonkhet: "the sickle-bladed khopesh (treat as a longsword)".
  "Khopesh":         {damageDice:"1d8",  damageType:"Slashing",    weight:3,  category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)", treatAs:"Longsword"},
  "Lance":           {damageDice:"1d12", damageType:"Piercing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Reach, special"},
  "Longsword":       {damageDice:"1d8",  damageType:"Slashing",    weight:3,  category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)"},
  "Maul":            {damageDice:"2d6",  damageType:"Bludgeoning", weight:10, category:"martial", finesse:false, ranged:false, properties:"Heavy, two-handed"},
  "Morningstar":     {damageDice:"1d8",  damageType:"Piercing",    weight:4,  category:"martial", finesse:false, ranged:false, properties:""},
  "Pike":            {damageDice:"1d10", damageType:"Piercing",    weight:18, category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, two-handed"},
  "Rapier":          {damageDice:"1d8",  damageType:"Piercing",    weight:2,  category:"martial", finesse:true,  ranged:false, properties:"Finesse"},
  "Scimitar":        {damageDice:"1d6",  damageType:"Slashing",    weight:3,  category:"martial", finesse:true,  ranged:false, properties:"Finesse, light"},
  "Shortsword":      {damageDice:"1d6",  damageType:"Piercing",    weight:2,  category:"martial", finesse:true,  ranged:false, properties:"Finesse, light"},
  "Trident":         {damageDice:"1d6",  damageType:"Piercing",    weight:4,  category:"martial", finesse:false, ranged:false, properties:"Thrown (20/60), versatile (1d8)"},
  // Plane Shift: Amonkhet: "two-handed khopeshes (treat as a greatsword)".
  "Two-Handed Khopesh": {damageDice:"2d6", damageType:"Slashing",  weight:6,  category:"martial", finesse:false, ranged:false, properties:"Heavy, two-handed", treatAs:"Greatsword"},
  "War Pick":        {damageDice:"1d8",  damageType:"Piercing",    weight:2,  category:"martial", finesse:false, ranged:false, properties:""},
  "Warhammer":       {damageDice:"1d8",  damageType:"Bludgeoning", weight:2,  category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)"},
  "Whip":            {damageDice:"1d4",  damageType:"Slashing",    weight:3,  category:"martial", finesse:true,  ranged:false, properties:"Finesse, reach"},
  "Blowgun":         {damageDice:"1",    damageType:"Piercing",    weight:1,  category:"martial", finesse:false, ranged:true,  properties:"Ammunition, loading"},
  "Hand Crossbow":   {damageDice:"1d6",  damageType:"Piercing",    weight:3,  category:"martial", finesse:false, ranged:true,  properties:"Ammunition, light, loading"},
  "Heavy Crossbow":  {damageDice:"1d10", damageType:"Piercing",    weight:18, category:"martial", finesse:false, ranged:true,  properties:"Ammunition, heavy, two-handed, loading"},
  "Longbow":         {damageDice:"1d8",  damageType:"Piercing",    weight:2,  category:"martial", finesse:false, ranged:true,  properties:"Ammunition, heavy, two-handed"},
  "Net":             {damageDice:"",     damageType:"",            weight:3,  category:"martial", finesse:false, ranged:true,  properties:"Thrown (5/15), special"},
  "Pistol":          {damageDice:"1d10", damageType:"Piercing",    weight:1,  category:"firearm", finesse:false, ranged:true,  properties:"Light, reload 1 (range 40/160), misfire 1"},
  "Revolver":        {damageDice:"1d10", damageType:"Piercing",    weight:3,  category:"firearm", finesse:false, ranged:true,  properties:"Light, reload 4 (range 40/160), misfire 1"},
  "Pepperbox":       {damageDice:"1d10", damageType:"Piercing",    weight:5,  category:"firearm", finesse:false, ranged:true,  properties:"Reload 6 (range 40/160), misfire 2"},
  "Musket":          {damageDice:"1d12", damageType:"Piercing",    weight:10, category:"firearm", finesse:false, ranged:true,  properties:"Reload 1 (range 120/480), misfire 2, two-handed"}
};

/* The Gunslinger class's firearms (Michael's homebrew, books/gun_1.webp):
   what a Gunslinger class character sees in place of the Firearms above,
   so nobody gets two Pistols. Kept out of WEAPON_DATA, and an item made
   from one is marked firearmSet "gunslinger" (see weaponDataOf). Damage
   type is the round's (piercing rounds by default). Misfire is an
   optional rule for these guns (c.gunMisfire): they misfire on a 1. */
export var GUNSLINGER_FIREARMS = {
  "Pistol":      {damageDice:"2d4",  damageType:"Piercing", weight:5,  cost:"50 gp",  category:"firearm", finesse:false, ranged:true, firearmSet:"gunslinger", properties:"Ammunition, light (range 100/240)"},
  "Handcannon":  {damageDice:"1d10", damageType:"Piercing", weight:6,  cost:"75 gp",  category:"firearm", finesse:false, ranged:true, firearmSet:"gunslinger", properties:"Loading, heavy ammunition, misfire (range 80/150)"},
  "Long Gun":    {damageDice:"1d12", damageType:"Piercing", weight:7,  cost:"100 gp", category:"firearm", finesse:false, ranged:true, firearmSet:"gunslinger", properties:"Loading, heavy ammunition, two-handed, misfire (range 300/1000)"},
  "Spread Shot": {damageDice:"1d6",  damageType:"Piercing", weight:10, cost:"80 gp",  category:"firearm", finesse:false, ranged:true, firearmSet:"gunslinger", properties:"Loading, ammunition, two-handed, misfire, special (10-foot cone)",
    special:"When you fire this weapon, make one attack roll for all creatures in a 10-foot cone in front of you. If a creature is standing right in front of you, you instead make an attack roll with advantage, but the attack only hits that target and no targets behind it."}
};
export function hasGunslingerClass(c){
  return !!(c && (c.classes||[]).some(function(cl){ return cl.name==="Gunslinger"; }));
}
/* The weapon catalog a character picks from: a Gunslinger class
   character's Firearms group holds the class's own guns. {groups, data} */
export function weaponCatalogFor(c){
  if(!hasGunslingerClass(c)) return {groups: WEAPON_GROUPS, data: WEAPON_DATA};
  var groups = Object.assign({}, WEAPON_GROUPS, {"Firearms": Object.keys(GUNSLINGER_FIREARMS)});
  return {groups: groups, data: Object.assign({}, WEAPON_DATA, GUNSLINGER_FIREARMS)};
}
/* The heavy property. "Heavy ammunition" (the Gunslinger class's
   Handcannon and Long Gun) is about the rounds, not the weapon. */
export function hasHeavyProperty(props){
  return /\bheavy\b(?! ammunition)/i.test(props || "");
}

/* Flat, searchable form of the catalog above; one entry per weapon,
   tagged with the group it belongs to (for the picker's filter pills). */
export var WEAPON_LIST = Object.keys(WEAPON_GROUPS).reduce(function(all, group){
  return all.concat(WEAPON_GROUPS[group].map(function(name){
    var data = WEAPON_DATA[name] || {};
    return Object.assign({name:name, group:group}, data);
  }));
}, []);

/* A weapon row's catalog entry: its own name's, or the base weapon a
   magic weapon is ("Longsword, +1" is a longsword: `baseWeapon`). */
export function weaponDataOf(item){
  if(item && item.firearmSet==="gunslinger") return GUNSLINGER_FIREARMS[item.name] || GUNSLINGER_FIREARMS[item.baseWeapon] || null;
  return (item && (WEAPON_DATA[item.name] || WEAPON_DATA[item.baseWeapon])) || null;
}
/* The weapon it is, by catalog name ("Longsword" for "Flame Tongue (Longsword)"). */
export function baseWeaponName(item){
  return item && (WEAPON_DATA[item.name] ? item.name : (item.baseWeapon || item.name));
}
