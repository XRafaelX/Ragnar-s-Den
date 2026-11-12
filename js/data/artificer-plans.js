/* ---------------- The 2024 artificer's magic item plans ----------------
   Replicate Magic Item (Eberron: Forge of the Artificer), checked against
   5etools' class-artificer.json (source EFA) on 2026-11-12. Each table
   opens at an artificer level; a plan names the magic item it makes
   (an entry in js/data/magic-items.js). A plan with `pick` names a kind of
   item instead ("any uncommon wondrous item that isn't cursed"): the item
   is chosen when it's learned, and it can be learned again for another
   item, each counting as its own plan. The tables' Attunement column
   matches the items' own data. */
export var PLAN_TABLES = [
  {level: 2, plans: [
    {name: "Alchemy Jug"}, {name: "Bag of Holding"}, {name: "Cap of Water Breathing"},
    {name: "Common magic item", pick: "common", label: "A common magic item that isn't a potion, a scroll or cursed"},
    {name: "Goggles of Night"}, {name: "Manifold Tool"}, {name: "Repeating Shot"}, {name: "Returning Weapon"},
    {name: "Rope of Climbing"}, {name: "Sending Stones"}, {name: "+1 Shield", item: "Shield, +1"},
    {name: "Wand of Magic Detection"}, {name: "Wand of Secrets"}, {name: "+1 Wand of the War Mage", item: "Wand of the War Mage, +1"},
    {name: "+1 Weapon", item: "Weapon, +1"}, {name: "+1 Wraps of Unarmed Power", item: "Wraps of Unarmed Power, +1"}]},
  {level: 6, plans: [
    {name: "+1 Armor", item: "Armor, +1"}, {name: "Boots of Elvenkind"}, {name: "Boots of the Winding Path"},
    {name: "Cloak of Elvenkind"}, {name: "Cloak of the Manta Ray"}, {name: "Dazzling Weapon"}, {name: "Eyes of Charming"},
    {name: "Eyes of Minute Seeing"}, {name: "Gloves of Thievery"}, {name: "Helm of Awareness"}, {name: "Lantern of Revealing"},
    {name: "Mind Sharpener"}, {name: "Necklace of Adaptation"}, {name: "Pipes of Haunting"}, {name: "Repulsion Shield"},
    {name: "Ring of Swimming"}, {name: "Ring of Water Walking"}, {name: "Sentinel Shield"}, {name: "Spell-Refueling Ring"},
    {name: "Wand of Magic Missiles"}, {name: "Wand of Web"}, {name: "Weapon of Warning"}]},
  {level: 10, plans: [
    {name: "Armor of Resistance"}, {name: "Dagger of Venom"}, {name: "Elven Chain"}, {name: "Ring of Feather Falling"},
    {name: "Ring of Jumping"}, {name: "Ring of Mind Shielding"}, {name: "+2 Shield", item: "Shield, +2"},
    {name: "Uncommon wondrous item", pick: "uncommonWondrous", label: "An uncommon wondrous item that isn't cursed"},
    {name: "+2 Wand of the War Mage", item: "Wand of the War Mage, +2"}, {name: "+2 Weapon", item: "Weapon, +2"},
    {name: "+2 Wraps of Unarmed Power", item: "Wraps of Unarmed Power, +2"}]},
  {level: 14, plans: [
    {name: "+2 Armor", item: "Armor, +2"}, {name: "Arrow-Catching Shield"}, {name: "Flame Tongue"},
    {name: "Rare wondrous item", pick: "rareWondrous", label: "A rare wondrous item that isn't cursed"},
    {name: "Ring of Free Action"}, {name: "Ring of Protection"}, {name: "Ring of the Ram"}]}
];
/* The book's suggestions for the first four. */
export var PLANS_SUGGESTED = ["Bag of Holding", "Cap of Water Breathing", "Sending Stones", "+1 Wand of the War Mage"];

/* Plans Known and Magic Items columns, by artificer level (0 before 2). */
export function plansKnownAt(lv){ return lv>=18 ? 8 : lv>=14 ? 7 : lv>=10 ? 6 : lv>=6 ? 5 : lv>=2 ? 4 : 0; }
export function planItemsAt(lv){ return lv>=18 ? 6 : lv>=14 ? 5 : lv>=10 ? 4 : lv>=6 ? 3 : lv>=2 ? 2 : 0; }

/* A plan by name, with its table's level: {plan, level} or null. */
export function planByName(name){
  for(var t = 0; t < PLAN_TABLES.length; t++){
    var p = PLAN_TABLES[t].plans.find(function(x){ return x.name===name; });
    if(p) return {plan: p, level: PLAN_TABLES[t].level};
  }
  return null;
}
