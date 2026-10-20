/* ---------------- Magic items ----------------
   The Armory's "Magic items" list (see js/render/armory.js): the items
   our DM made, in their own "Panais Magic Items" group, then the SRD's
   (./magic-items-srd.js) by rarity. Adding one puts it in Other Equipment
   (a magic weapon under Weapons, magic armor under Armor), where one that
   needs attunement gets Attune in its ⋯ menu: its magic works only while
   attuned (see js/core/magic-items.js).
     kind        the item line ("Wondrous item (knife holster)")
     rarity      "Common" to "Artifact"
     attunement  requires attunement; attuneBy who can ("a paladin")
     text        the item's description, as printed (markdown tables,
                 **bold** and _italics_ are drawn as such)
     weapon      a magic weapon: the weapon it is (js/data/weapons.js),
                 added under Weapons with that weapon's numbers
     weaponAny   a magic weapon of any weapon of a kind, picked when it's
                 added: "any", "sword", "slashingSword", "axe", "axeOrSword"
     armor       magic armor: the armor it is (js/data/armor.js)
     armorAny    magic armor of a kind, picked when it's added: "any",
                 "mediumHeavy", "mediumHeavyNotHide"
     bonus       a weapon's bonus to attack and damage rolls, or armor's
                 to AC (only while attuned, if it needs attunement)
     ammunition  magic ammunition (kept as gear, like arrows)
     acBonus     AC while it works (Ring of Protection); acWhen
                 "unarmored": only with no armor and no shield
     saveBonus   saving throws while it works
     noPenalty   armor without its Strength requirement or Stealth
                 disadvantage (Mithral Armor)
     setScore    {str: 19}: the score while it works, unless yours is
                 higher; raiseScore {dex: 2}: added, to a maximum of 20
                 (see js/core/ability-scores.js)
     heal        a potion's healing dice ("4d4+4"), rolled by Drink
     charges     {max, regain}: charges, and the dice they come back by
                 at dawn (a long rest); none if it doesn't say
     holster     a holster of throwing knives: capacity (knives it holds),
                 damagePerKnife (extra damage on your attacks for each
                 knife in it) and emptySpeed (feet of speed while empty)
     returning   can be thrown and called back to your hand
     coin        a coin flipped for a boon: charges (all back at a long
                 rest) and its sides, each {name, boons}. A boon is {id,
                 text} plus what it does: minutes (lasts that long, else
                 until used or a long rest), ac / attack (bonus to AC / attack rolls),
                 checkAdvantage (on the next ability check), damage
                 {qty, die, types} (extra damage on the next attack, of a
                 type chosen from `types`), resistance (to a damage type
                 chosen when it's picked) */
import { SRD_MAGIC_ITEM_GROUPS, SRD_MAGIC_ITEM_DATA } from "./magic-items-srd.js";

export var PANAIS_GROUP = "Panais Magic Items";
export var MAGIC_ITEM_GROUPS = Object.assign({
  "Panais Magic Items": ["Duality", "Heavy Holster", "Trident of Returning"]
}, SRD_MAGIC_ITEM_GROUPS);

/* Our DM's items. */
var PANAIS_ITEMS = {
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
export var MAGIC_ITEM_DATA = Object.assign({}, PANAIS_ITEMS, SRD_MAGIC_ITEM_DATA);
