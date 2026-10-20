/* ---------------- Weapon data (SRD, plus the double-bladed scimitar and firearms) ----------------
   The Player's Handbook's weapons, Eberron's double-bladed scimitar (for
   Revenant Blade) and the Dungeon Master's Guide's Renaissance firearms
   (for Gunner). Firearms are their own category: neither simple nor
   martial, so only a proficiency in firearms covers them. */
export var WEAPON_GROUPS = {
  "Simple Melee": ["Club","Dagger","Greatclub","Handaxe","Javelin","Light Hammer","Mace","Quarterstaff","Sickle","Spear"],
  "Simple Ranged": ["Light Crossbow","Dart","Shortbow","Sling"],
  "Martial Melee": ["Battleaxe","Double-Bladed Scimitar","Flail","Glaive","Greataxe","Greatsword","Halberd","Lance","Longsword","Maul","Morningstar","Pike","Rapier","Scimitar","Shortsword","Trident","War Pick","Warhammer","Whip"],
  "Martial Ranged": ["Blowgun","Hand Crossbow","Heavy Crossbow","Longbow","Net"],
  "Firearms": ["Pistol","Musket"]
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
  "Flail":           {damageDice:"1d8",  damageType:"Bludgeoning", weight:2,  category:"martial", finesse:false, ranged:false, properties:""},
  "Glaive":          {damageDice:"1d10", damageType:"Slashing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, two-handed"},
  "Greataxe":        {damageDice:"1d12", damageType:"Slashing",    weight:7,  category:"martial", finesse:false, ranged:false, properties:"Heavy, two-handed"},
  "Greatsword":      {damageDice:"2d6",  damageType:"Slashing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Heavy, two-handed"},
  "Halberd":         {damageDice:"1d10", damageType:"Slashing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, two-handed"},
  "Lance":           {damageDice:"1d12", damageType:"Piercing",    weight:6,  category:"martial", finesse:false, ranged:false, properties:"Reach, special"},
  "Longsword":       {damageDice:"1d8",  damageType:"Slashing",    weight:3,  category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)"},
  "Maul":            {damageDice:"2d6",  damageType:"Bludgeoning", weight:10, category:"martial", finesse:false, ranged:false, properties:"Heavy, two-handed"},
  "Morningstar":     {damageDice:"1d8",  damageType:"Piercing",    weight:4,  category:"martial", finesse:false, ranged:false, properties:""},
  "Pike":            {damageDice:"1d10", damageType:"Piercing",    weight:18, category:"martial", finesse:false, ranged:false, properties:"Heavy, reach, two-handed"},
  "Rapier":          {damageDice:"1d8",  damageType:"Piercing",    weight:2,  category:"martial", finesse:true,  ranged:false, properties:"Finesse"},
  "Scimitar":        {damageDice:"1d6",  damageType:"Slashing",    weight:3,  category:"martial", finesse:true,  ranged:false, properties:"Finesse, light"},
  "Shortsword":      {damageDice:"1d6",  damageType:"Piercing",    weight:2,  category:"martial", finesse:true,  ranged:false, properties:"Finesse, light"},
  "Trident":         {damageDice:"1d6",  damageType:"Piercing",    weight:4,  category:"martial", finesse:false, ranged:false, properties:"Thrown (20/60), versatile (1d8)"},
  "War Pick":        {damageDice:"1d8",  damageType:"Piercing",    weight:2,  category:"martial", finesse:false, ranged:false, properties:""},
  "Warhammer":       {damageDice:"1d8",  damageType:"Bludgeoning", weight:2,  category:"martial", finesse:false, ranged:false, properties:"Versatile (1d10)"},
  "Whip":            {damageDice:"1d4",  damageType:"Slashing",    weight:3,  category:"martial", finesse:true,  ranged:false, properties:"Finesse, reach"},
  "Blowgun":         {damageDice:"1",    damageType:"Piercing",    weight:1,  category:"martial", finesse:false, ranged:true,  properties:"Ammunition, loading"},
  "Hand Crossbow":   {damageDice:"1d6",  damageType:"Piercing",    weight:3,  category:"martial", finesse:false, ranged:true,  properties:"Ammunition, light, loading"},
  "Heavy Crossbow":  {damageDice:"1d10", damageType:"Piercing",    weight:18, category:"martial", finesse:false, ranged:true,  properties:"Ammunition, heavy, two-handed, loading"},
  "Longbow":         {damageDice:"1d8",  damageType:"Piercing",    weight:2,  category:"martial", finesse:false, ranged:true,  properties:"Ammunition, heavy, two-handed"},
  "Net":             {damageDice:"",     damageType:"",            weight:3,  category:"martial", finesse:false, ranged:true,  properties:"Thrown (5/15), special"},
  "Pistol":          {damageDice:"1d10", damageType:"Piercing",    weight:3,  category:"firearm", finesse:false, ranged:true,  properties:"Ammunition, loading"},
  "Musket":          {damageDice:"1d12", damageType:"Piercing",    weight:10, category:"firearm", finesse:false, ranged:true,  properties:"Ammunition, loading, two-handed"}
};

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
  return (item && (WEAPON_DATA[item.name] || WEAPON_DATA[item.baseWeapon])) || null;
}
/* The weapon it is, by catalog name ("Longsword" for "Flame Tongue (Longsword)"). */
export function baseWeaponName(item){
  return item && (WEAPON_DATA[item.name] ? item.name : (item.baseWeapon || item.name));
}
