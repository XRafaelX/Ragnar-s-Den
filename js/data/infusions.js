/* ---------------- Artificer infusions (Tasha's) ----------------
   level: artificer level needed to learn it.
   item: what it can go on (shown in the picker).
   target: which inventory items it can infuse ("armor" = body armor or a
     shield, "bodyArmor", "shield", "armorOrRobes", "weapon", "ammoWeapon" =
     a weapon that uses ammunition, "thrownWeapon", "focus" = a rod, staff
     or wand, "gem", "boots", "ring", "helmet"); "replica" makes the item
     itself (Replicate Magic Item). See infusionTargets in
     js/core/artificer.js.
   newItems: plain objects the infuse picker can add to the inventory
     when none is carried (a ring, a pair of boots).
   choice: something picked when infusing (Resistant Armor's damage type).
   Attunement: an infusion whose `item` says "(requires attunement)" needs
     it; a replicated item needs it when its REPLICABLE_ITEMS entry says so.
   charges: {max, regain} kept on the active infusion and spent through
     `uses` (a button each on the item's inventory card); `regain` dice
     come back at dawn (a long rest).
   refuel: once a day, recover a spent spell slot of 3rd level or lower.
   What the rest do on the sheet (spell attack, resistance, initiative,
   speed, the homunculus) is in js/core/infusion-effects.js and
   js/data/companions.js.
   bonus: adds +1 to that item's magic bonus while infused, so AC /
     attack and damage update by themselves.
   scales: the bonus becomes +2 from artificer level 10 (Enhanced
     Defense, Enhanced Weapon); the others stay +1.
   repeatable: can be learned more than once (Replicate Magic Item). */
export var INFUSIONS = [
  {name:"Enhanced Arcane Focus", level:2, item:"A rod, staff or wand (requires attunement)", target:"focus", newItems:["Arcane Focus (rod)", "Arcane Focus (staff)", "Arcane Focus (wand)"],
    text:"While holding it, you gain +1 to spell attack rolls (+2 from artificer level 10), and your spell attacks ignore half cover."},
  {name:"Enhanced Defense", level:2, item:"A suit of armor or a shield", target:"armor", bonus:true, scales:true,
    text:"A creature gains +1 to AC while wearing (armor) or wielding (shield) the infused item. The bonus becomes +2 from artificer level 10."},
  {name:"Enhanced Weapon", level:2, item:"A simple or martial weapon", target:"weapon", bonus:true, scales:true,
    text:"This magic weapon grants +1 to attack and damage rolls made with it. The bonus becomes +2 from artificer level 10."},
  {name:"Homunculus Servant", level:2, item:"A gem or crystal worth at least 100 gp", target:"gem", newItems:["Gemstone (100 gp)"],
    text:"You create a homunculus bound to the gem. It's friendly to you and your allies, acts on your initiative, and can deliver your touch spells. It uses your proficiency bonus for its stats."},
  {name:"Mind Sharpener", level:2, item:"A suit of armor or robes", target:"armorOrRobes", newItems:["Robes"],
    charges:{max:4, regain:"1d4"}, uses:[{label:"Pass a concentration save", title:"Reaction when you fail a Constitution save to keep concentration on a spell: you succeed instead"}],
    text:"The item has 4 charges. When the wearer fails a Constitution save to keep concentration, they can use their reaction and 1 charge to succeed instead. Regains 1d4 charges each dawn."},
  {name:"Repeating Shot", level:2, item:"A simple or martial weapon with the ammunition property (requires attunement)", target:"ammoWeapon", bonus:true,
    text:"+1 to attack and damage rolls when you make a ranged attack with it, it ignores the loading property, and it magically makes its own ammunition when you fire it."},
  {name:"Replicate Magic Item", level:2, item:"Whatever the replicated item is", target:"replica", repeatable:true,
    text:"Make a magic item from the Replicable Items tables (higher levels unlock more), or any common magic item that isn't a potion or scroll. You can learn this infusion more than once, picking a different item each time."},
  {name:"Returning Weapon", level:2, item:"A simple or martial weapon with the thrown property", target:"thrownWeapon", bonus:true,
    text:"+1 to attack and damage rolls with it, and it flies back to the wielder's hand right after it's used for a ranged attack."},
  {name:"Armor of Magical Strength", level:2, item:"A suit of armor (requires attunement)", target:"bodyArmor",
    charges:{max:6, regain:"1d6"}, uses:[{label:"Add INT to a STR roll", title:"Add your Intelligence modifier to a Strength check or Strength saving throw"}, {label:"Don't fall prone", title:"Reaction when you would be knocked prone: you aren't"}],
    text:"The armor has 6 charges. The wearer can spend 1 to add its Intelligence modifier to a Strength check or Strength saving throw, or use its reaction and 1 charge to avoid being knocked prone. Regains 1d6 charges each dawn."},
  {name:"Boots of the Winding Path", level:6, item:"A pair of boots (requires attunement)", target:"boots", newItems:["Boots"],
    text:"As a bonus action, teleport up to 15 feet to an unoccupied space you can see that you were in during this turn."},
  {name:"Radiant Weapon", level:6, item:"A simple or martial weapon (requires attunement)", target:"weapon", bonus:true,
    charges:{max:4, regain:"1d4"}, uses:[{label:"Blind the attacker", title:"Reaction right after you're hit: the attacker is blinded until the end of its next turn unless it passes a Constitution save against your spell save DC"}],
    text:"+1 to attack and damage, sheds bright light on command, and has 4 charges: as a reaction when hit, blind the attacker (CON save). Regains 1d4 charges each dawn."},
  {name:"Repulsion Shield", level:6, item:"A shield (requires attunement)", target:"shield", bonus:true,
    charges:{max:4, regain:"1d4"}, uses:[{label:"Push the attacker", title:"Reaction right after a melee hit: push the attacker up to 15 feet away"}],
    text:"+1 AC while wielded, and 4 charges: as a reaction when hit by a melee attack, push the attacker up to 15 feet away. Regains 1d4 charges each dawn."},
  {name:"Resistant Armor", level:6, item:"A suit of armor (requires attunement)", target:"bodyArmor",
    choice:{label:"Damage type", options:["Acid","Cold","Fire","Force","Lightning","Necrotic","Poison","Psychic","Radiant","Thunder"]},
    text:"While wearing it, you have resistance to one damage type chosen when you infuse it: acid, cold, fire, force, lightning, necrotic, poison, psychic, radiant or thunder."},
  {name:"Spell-Refueling Ring", level:6, item:"A ring (requires attunement)", target:"ring", newItems:["Ring"], refuel:true,
    text:"As an action, the wearer recovers one expended spell slot of 3rd level or lower. Once used, it can't be used again until the next dawn."},
  {name:"Helm of Awareness", level:10, item:"A helmet (requires attunement)", target:"helmet", newItems:["Helmet"],
    text:"The wearer has advantage on initiative rolls and can't be surprised unless incapacitated."},
  {name:"Arcane Propulsion Armor", level:14, item:"A suit of armor (requires attunement)", target:"bodyArmor",
    text:"The wearer's walking speed increases by 5 feet. Its gauntlets are magic melee weapons usable only with an empty hand (proficient, 1d8 force, thrown 20/60 ft, they fly back after the attack). It can't be removed against the wearer's will, and it replaces any missing limbs."}
];

/* Replicate Magic Item's Replicable Items tables (Tasha's), by the
   artificer level that unlocks each table. attunement: the item needs it. */
export var REPLICABLE_ITEMS = [
  {level:2, items:[
    {name:"Alchemy Jug"}, {name:"Bag of Holding"}, {name:"Cap of Water Breathing"}, {name:"Goggles of Night"},
    {name:"Rope of Climbing"}, {name:"Sending Stones"}, {name:"Wand of Magic Detection"}, {name:"Wand of Secrets"}]},
  {level:6, items:[
    {name:"Boots of Elvenkind"}, {name:"Cloak of Elvenkind", attunement:true}, {name:"Cloak of the Manta Ray"},
    {name:"Eyes of Charming", attunement:true}, {name:"Gloves of Thievery"}, {name:"Lantern of Revealing"},
    {name:"Pipes of Haunting"}, {name:"Ring of Water Walking"}]},
  {level:10, items:[
    {name:"Boots of Striding and Springing", attunement:true}, {name:"Boots of the Winterlands", attunement:true},
    {name:"Bracers of Archery", attunement:true}, {name:"Brooch of Shielding", attunement:true},
    {name:"Cloak of Protection", attunement:true}, {name:"Eyes of the Eagle", attunement:true},
    {name:"Gauntlets of Ogre Power", attunement:true}, {name:"Gloves of Missile Snaring", attunement:true},
    {name:"Gloves of Swimming and Climbing", attunement:true}, {name:"Hat of Disguise", attunement:true},
    {name:"Headband of Intellect", attunement:true}, {name:"Helm of Telepathy", attunement:true},
    {name:"Medallion of Thoughts", attunement:true}, {name:"Necklace of Adaptation", attunement:true},
    {name:"Periapt of Wound Closure", attunement:true}, {name:"Pipes of the Sewers", attunement:true},
    {name:"Quiver of Ehlonna"}, {name:"Ring of Jumping", attunement:true}, {name:"Ring of Mind Shielding", attunement:true},
    {name:"Slippers of Spider Climbing", attunement:true}, {name:"Ventilating Lungs", attunement:true},
    {name:"Winged Boots", attunement:true}]},
  {level:14, items:[
    {name:"Amulet of Health", attunement:true}, {name:"Arcane Propulsion Arm", attunement:true},
    {name:"Belt of Hill Giant Strength", attunement:true}, {name:"Boots of Levitation", attunement:true},
    {name:"Boots of Speed", attunement:true}, {name:"Bracers of Defense", attunement:true},
    {name:"Cloak of the Bat", attunement:true}, {name:"Dimensional Shackles"}, {name:"Gem of Seeing", attunement:true},
    {name:"Horn of Blasting"}, {name:"Ring of Free Action", attunement:true}, {name:"Ring of Protection", attunement:true},
    {name:"Ring of the Ram", attunement:true}]}
];

/* How many infusions an artificer knows, and how many items can be
   infused at once, at a given artificer level (0 before level 2). */
export function infusionsKnownAt(level){
  return level>=18 ? 12 : level>=14 ? 10 : level>=10 ? 8 : level>=6 ? 6 : level>=2 ? 4 : 0;
}
export function infusedItemsAt(level){
  return level>=18 ? 6 : level>=14 ? 5 : level>=10 ? 4 : level>=6 ? 3 : level>=2 ? 2 : 0;
}
