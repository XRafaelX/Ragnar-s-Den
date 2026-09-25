/* ---------------- Artificer infusions (Tasha's) ----------------
   level: artificer level needed to learn it.
   item: what it can go on (shown in the picker).
   target: which inventory items it can infuse ("armor" = body armor or a
     shield, "shield", "weapon", "ammoWeapon" = a weapon that uses
     ammunition, "thrownWeapon"); null means any object, typed by name.
   bonus: adds +1 to that item's magic bonus while infused (+2 from
     artificer level 10), so AC / attack and damage update by themselves.
   repeatable: can be learned more than once (Replicate Magic Item). */
export var INFUSIONS = [
  {name:"Enhanced Arcane Focus", level:2, item:"A rod, staff or wand (requires attunement)", target:null,
    text:"While holding it, you gain +1 to spell attack rolls (+2 from artificer level 10), and your spell attacks ignore half cover."},
  {name:"Enhanced Defense", level:2, item:"A suit of armor or a shield", target:"armor", bonus:true,
    text:"A creature gains +1 to AC while wearing (armor) or wielding (shield) the infused item. The bonus becomes +2 from artificer level 10."},
  {name:"Enhanced Weapon", level:2, item:"A simple or martial weapon", target:"weapon", bonus:true,
    text:"This magic weapon grants +1 to attack and damage rolls made with it. The bonus becomes +2 from artificer level 10."},
  {name:"Homunculus Servant", level:2, item:"A gem or crystal worth at least 100 gp", target:null,
    text:"You create a homunculus bound to the gem. It's friendly to you and your allies, acts on your initiative, and can deliver your touch spells. It uses your proficiency bonus for its stats."},
  {name:"Mind Sharpener", level:2, item:"A suit of armor or robes", target:null,
    text:"The item has 4 charges. When the wearer fails a Constitution save to keep concentration, they can use their reaction and 1 charge to succeed instead. Regains 1d4 charges each dawn."},
  {name:"Repeating Shot", level:2, item:"A simple or martial weapon with the ammunition property (requires attunement)", target:"ammoWeapon", bonus:true,
    text:"+1 to attack and damage rolls with it, it ignores the loading property, and it magically makes its own ammunition when you fire it."},
  {name:"Replicate Magic Item", level:2, item:"Whatever the replicated item is", target:null, repeatable:true,
    text:"Create a common magic item from the artificer list, such as a Bag of Holding, Goggles of Night, Wand of Magic Detection, Rope of Climbing or Alchemy Jug. You can learn this infusion more than once, picking a different item each time."},
  {name:"Returning Weapon", level:2, item:"A simple or martial weapon with the thrown property", target:"thrownWeapon", bonus:true,
    text:"+1 to attack and damage rolls with it, and it flies back to the wielder's hand right after it's used for a ranged attack."},
  {name:"Boots of the Winding Path", level:6, item:"A pair of boots (requires attunement)", target:null,
    text:"As a bonus action, teleport up to 15 feet to an unoccupied space you were in during this turn."},
  {name:"Radiant Weapon", level:6, item:"A simple or martial weapon (requires attunement)", target:"weapon", bonus:true,
    text:"+1 to attack and damage, sheds bright light on command, and has 4 charges: as a reaction when hit, blind the attacker (CON save). Regains 1d4 charges each dawn."},
  {name:"Repulsion Shield", level:6, item:"A shield (requires attunement)", target:"shield", bonus:true,
    text:"+1 AC while wielded, and 4 charges: as a reaction when hit by a melee attack, push the attacker up to 15 feet away. Regains 1d4 charges each dawn."},
  {name:"Resistant Armor", level:6, item:"A suit of armor (requires attunement)", target:null,
    text:"While wearing it, you have resistance to one damage type chosen when you infuse it: acid, cold, fire, force, lightning, necrotic, poison, psychic, radiant or thunder."},
  {name:"Spell-Refueling Ring", level:6, item:"A ring (requires attunement)", target:null,
    text:"As an action, the wearer recovers one expended spell slot of 3rd level or lower. Once used, it can't be used again until the next dawn."},
  {name:"Helm of Awareness", level:10, item:"A helmet (requires attunement)", target:null,
    text:"The wearer has advantage on initiative rolls and can't be surprised unless incapacitated."}
];

/* How many infusions an artificer knows, and how many items can be
   infused at once, at a given artificer level (0 before level 2). */
export function infusionsKnownAt(level){
  return level>=18 ? 12 : level>=14 ? 10 : level>=10 ? 8 : level>=6 ? 6 : level>=2 ? 4 : 0;
}
export function infusedItemsAt(level){
  return level>=18 ? 6 : level>=14 ? 5 : level>=10 ? 4 : level>=6 ? 3 : level>=2 ? 2 : 0;
}
