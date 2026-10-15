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
     returning   can be thrown and called back to your hand */
export var MAGIC_ITEM_GROUPS = {
  "Uncommon": ["Heavy Holster", "Trident of Returning"]
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
  }
};
