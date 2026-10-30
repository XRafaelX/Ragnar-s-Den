/* ---------------- Gunslinger class rounds (Michael's homebrew) ----------------
   The Firearm Ammunition table (books/gun_2.webp) and the Bulletsmith
   features (books/Gunslinger.pdf). A stack of rounds in the inventory is
   a gear item with `round` (a key below) and `heavy`; an elemental stack
   bought as fire or acid rounds keeps `element`, and a spell round keeps
   `spell`. The Handcannon and Long Gun ("heavy ammunition") fire heavy
   rounds, the Pistol and Spread Shot plain ones.

   name      the round's name ("Piercing" -> "Piercing Rounds")
   level     the gunslinger level that can craft it (Novice 1, Handy 6,
             Elemental 11, Occult 17)
   cost      price of one round in silver pieces (heavy rounds cost 3 times)
   damageType  what it deals (none: the gun's own piercing)
   noDamage  the attack deals no damage
   note      what a hit does beyond damage, for the gun's card */
export var ROUND_KINDS = {
  slashing:    {name: "Slashing", level: 1, cost: 1, damageType: "Slashing"},
  piercing:    {name: "Piercing", level: 1, cost: 1, damageType: "Piercing"},
  bludgeoning: {name: "Bludgeoning", level: 1, cost: 1, damageType: "Bludgeoning"},
  poisoned:    {name: "Poisoned", level: 6, cost: 6, note: "On a hit, the target must succeed on a DC 10 Constitution saving throw or be poisoned."},
  net:         {name: "Net", level: 6, cost: 10, noDamage: true, note: "No damage. It fires a net: a Large or smaller creature it hits is restrained until it frees itself (an action and a DC 10 Strength check, or 5 slashing damage to the net)."},
  smoke:       {name: "Smoke", level: 6, cost: 5, noDamage: true, note: "No damage. A 10-foot-radius cloud of smoke, heavily obscured, fills the spot for 1 minute."},
  elemental:   {name: "Elemental", level: 11, cost: 5, elemental: true},
  spell:       {name: "Spell", level: 17, spell: true}
};
/* Elemental Bulletsmith: the damage types an elemental round can take. */
export var ROUND_ELEMENTS = ["Acid", "Cold", "Fire", "Lightning", "Poison", "Thunder"];
export var HEAVY_ROUND_DAMAGE = 3;

/* Rounds crafted at a time (Novice Bulletsmith 20, Handy +10, Elemental +10). */
export function roundBatchSize(level){
  return level >= 11 ? 40 : level >= 6 ? 30 : 20;
}
/* A stack's name: "Heavy Piercing Rounds", "Fire Rounds", "Spell Round (Fireball)". */
export function roundStackName(kind, heavy, element, spell){
  if(kind==="spell") return "Spell Round (" + spell + ")";
  var def = ROUND_KINDS[kind];
  return (heavy ? "Heavy " : "") + (kind==="elemental" && element ? element : def.name) + " Rounds";
}

/* Firearm Enchantment (Eldritch Gunman 3): what a ritual can put on one
   firearm. item.enchantment holds the id. */
export var FIREARM_ENCHANTMENTS = [
  {id: "arcane_conduit", name: "Arcane Conduit", text: "While the firearm is in your hand, you use Wisdom in place of Intelligence for your spell save DC and spell attack bonus."},
  {id: "veil_of_smoke", name: "Veil of Smoke", text: "When you miss with the firearm, the bullet can vanish into a puff of smoke until the start of your next turn. Unless the target moves away from it, the target has disadvantage on its attacks."},
  {id: "arcane_infusion", name: "Arcane Infusion", text: "You add your Intelligence modifier to the firearm's damage rolls, and its attacks count as magical for overcoming resistance and immunity."},
  {id: "runic_bind", name: "Runic Bind", text: "When you hit with the firearm, you can use your bonus action to bind the target. It must succeed on a Strength saving throw against your spell save DC or be restrained. It can use its action to repeat the save, freeing itself on a success."},
  {id: "bullet_ward", name: "Bullet Ward", text: "You can shoot yourself or an ally with the firearm to give 1d8 + your Intelligence modifier temporary hit points. You can do this a number of times equal to your Intelligence modifier, and you get them back on a short or long rest."}
];
