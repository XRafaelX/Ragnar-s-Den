/* ---------------- Magic items ----------------
   The Armory's "Magic items" list (see js/render/armory.js), grouped by
   rarity. Adding one puts it in Other Equipment, where a magic item that
   needs attunement gets an Attune switch: its magic works only while
   attuned (see js/core/magic-items.js).
     kind        the item line ("Wondrous item (knife holster)")
     rarity      "Common" to "Legendary"
     attunement  requires attunement
     text        the item's description, as printed
     holster     a holster of throwing knives: capacity (knives it holds),
                 damagePerKnife (extra damage on your attacks for each
                 knife in it) and emptySpeed (feet of speed while empty)
     weapon      a magic weapon: the weapon it is (js/data/weapons.js),
                 added under Weapons with that weapon's numbers
     returning   can be thrown and called back to your hand
     coin        a coin flipped for a boon: charges (all back at a long
                 rest) and its sides, each {name, boons}. A boon is {id,
                 text} plus what it does: minutes (lasts that long, else
                 until used or a long rest), ac / attack (bonus to AC / attack rolls),
                 checkAdvantage (on the next ability check), damage
                 {qty, die, types} (extra damage on the next attack, of a
                 type chosen from `types`), resistance (to a damage type
                 chosen when it's picked) */
export var MAGIC_ITEM_GROUPS = {
  "Uncommon": ["Heavy Holster", "Trident of Returning"],
  "Rare": ["Duality"]
};

export var MAGIC_ITEM_DATA = {
  "Heavy Holster": {
    kind: "Wondrous item (knife holster)", rarity: "Uncommon", attunement: true,
    text: "This holster can hold up to 3 throwing knives. For each knife holstered in the holster, your attacks deal an additional 1 damage. When no knives are holstered, your movement speed increases by 20 feet. You can use a bonus action to summon back one knife or an action to summon all of them back into the holster.",
    holster: {capacity: 3, damagePerKnife: 1, emptySpeed: 20}
  },
  "Trident of Returning": {
    kind: "Wondrous weapon (trident)", rarity: "Uncommon", attunement: true,
    text: "As long as you can see the trident and you are not holding it, you can use an action to call it back to your hand. When you do so, the trident flies to your hands. If the trident is stabbed inside in a creature, the creature can make contested Strength check to keep the trident. On a successful save, the trident remains on the creature but the creature is moved 5 feet in a straight line toward you. On a failed save, the trident returns to you.",
    weapon: "Trident", returning: true
  },
  "Duality": {
    kind: "Wondrous item (coin)", rarity: "Rare", attunement: false,
    text: "The coin has 2 charges which recharge at the end of a long rest. On your turn, you can expend a charge and flip the coin, depending on which side the coin lands on it will have different effects. It regains all lost charges at dawn.\nAngel Side Up: If the coin lands angel side up, you can choose one of the following: you gain advantage on your next ability check; you gain a +1 bonus to your AC for 10 minutes; your next attack deals an additional 2d8 radiant damage.\nDemon Side Up: If the coin lands demon side up, you can choose one of the following: you gain +1 to your attack rolls for 10 minutes; your next attack deals an additional 2d8 fire or necrotic damage, you choose which type; you gain resistance against a chosen damage type for 10 minutes.",
    coin: {charges: 2, sides: {
      angel: {name: "Angel side up", boons: [
        {id: "angel_check", text: "Advantage on your next ability check", checkAdvantage: true},
        {id: "angel_ac", text: "+1 bonus to your AC for 10 minutes", minutes: 10, ac: 1},
        {id: "angel_radiant", text: "Your next attack deals an additional 2d8 radiant damage", damage: {qty: 2, die: 8, types: ["Radiant"]}}
      ]},
      demon: {name: "Demon side up", boons: [
        {id: "demon_attack", text: "+1 to your attack rolls for 10 minutes", minutes: 10, attack: 1},
        {id: "demon_damage", text: "Your next attack deals an additional 2d8 fire or necrotic damage, your choice", damage: {qty: 2, die: 8, types: ["Fire", "Necrotic"]}},
        {id: "demon_resist", text: "Resistance to a damage type you choose for 10 minutes", minutes: 10, resistance: true}
      ]}
    }}
  }
};
