/* ==================== PRIVATE: NOT FOR PUBLICATION ====================
   Spikael's (Michael Hobson's) unpublished homebrew, from the page he
   shared on 2026-11-02: the Shadow Stalker rogue subclass, the Reaper
   feat and the Scythe. Used with his permission, for our own games only.
   It stays hidden with the rest of his content until the secret switch
   shows it (js/core/private-content.js).
   Before the app goes live anywhere (a public site, a store), remove this
   file, its imports in js/data/subclasses/rogue.js, js/data/feats.js and
   js/data/weapons.js, the "Shadow Stalker" credit in js/data/credits.js,
   the Shadow Stalker entries in js/data/resources.js and js/data/effects.js,
   and the code marked "Shadow Stalker" or "Reaper" in js/core/shadow-stalker.js.
   ====================================================================

   Readings of the page (agreed with the user 2026-11-02):
   - The Scythe's weight isn't given: 6 lb, like a glaive or a halberd.
   - Living Shadows' uses: half the Wisdom modifier, rounded down, at
     least 1, as written. Its example's "7d6" is left out: the clone's
     Sneak Attack is the rogue's own dice.
   - Shadow Walk's reroll applies to each Sneak Attack die of 1 or 2.
   - The Reaper's "The scythe can benefit from sneak attack damage"
     stands on its own: the feat makes the scythe a Sneak Attack weapon. */

export var SHADOW_STALKER = {name:"Shadow Stalker", private:true, blurb:"Splits off a shadow of yourself, swaps places with it and slips into the shadows.", features:{
  3:[
    {name:"Shadow Clones", text:"When you make an attack roll, you can magically create a shadow clone of yourself in an unoccupied space you can see within 10 feet of you. You can also do it as a bonus action. The clone is a translucent grey image of you, the same size as you, and it fills its space. It lasts until you create a new one, and any damage destroys it.\n• As a bonus action, or as a reaction when you are targeted by an attack, you can teleport and swap places with the clone, however far apart you are. If you were targeted by an attack, the clone takes it instead.\n• When you take the Attack action, each attack can come from your space or from the clone's. You choose for each attack. A hit from the clone can deal Sneak Attack damage if you haven't dealt it yet this turn."},
    {name:"Shadow Walk", text:"In dim light or darkness, or next to a wall, you can use your action to become a shadow. You stay one until you take an action or a reaction. That action or reaction happens first, then you return to your normal form in the nearest unoccupied space. As a shadow, your body loses its depth and your gear melts into it, and:\n• Your speed increases by 10 feet. You can move along walls without falling, move under creatures and objects as if through difficult terrain, and share a space with another creature. Attacks that need to hit your body to do damage can't target you.\n• You automatically succeed on Stealth checks that rely on sight or sound while you are in dim light or darkness.\n• You have advantage on attack rolls. If the attack deals Sneak Attack damage, any Sneak Attack die that rolls a 1 or 2 is rolled again, and the new roll stands.\nOnce you use this feature, you can't use it again until you finish a long rest. Start it on the Active effects card."}
  ],
  9:[{name:"Encroaching Shadows", text:"When you create a shadow clone, you can make it appear in a shadow you can see within 60 feet of you instead.\nYou can also hide inside the shadow of a wound. While you are a shadow (Shadow Walk), you can enter a creature you damaged if you can reach it with your movement. An attack you make from inside a creature's wound automatically hits and deals Sneak Attack damage."}],
  13:[{name:"Dark Deceiver", text:"When you create a shadow clone, you can make it look exactly like you instead of a shadowy copy."}],
  17:[{name:"Living Shadows", text:"Whenever you take the Attack action, your shadow clone can also make an attack against the same creature, if it can reach it. If either attack would deal Sneak Attack damage, both do. So if you and your clone both hit the same creature while you have advantage, each hit deals your Sneak Attack damage. You can do this a number of times equal to half your Wisdom modifier, rounded down (at least once), and you get them all back when you finish a long rest. After a Sneak Attack roll, the dice tray offers the clone's."}]
}};

export var REAPER_FEAT = {
  name: "Reaper",
  source: "SPK",
  private: true,
  weaponProfs: ["Scythe"],
  requires: {sneakAttack: true},
  prerequisite: "Sneak Attack feature",
  category: "Combat",
  summary: "You gain proficiency with scythes. You can attack with a scythe using Dexterity, for 1d6 damage, and it can deal Sneak Attack damage.",
  description: "You learn to use scythes to embody the fear of death in the hands of an assassin.\n• You gain proficiency with scythes.\n• You can attack with a scythe using your Dexterity modifier in place of Strength. If you do, it deals 1d6 slashing damage instead. The scythe can deal Sneak Attack damage. (The sheet uses Dexterity when it's higher.)"
};

/* A martial melee weapon. `special` is shown in the weapon's details. */
export var SCYTHE = {damageDice:"1d8", damageType:"Slashing", weight:6, category:"martial", finesse:false, ranged:false, private:true,
  properties:"Special (cleave), two-handed",
  special:"Cleave: when you attack with the scythe, you can make a cleave attack instead. Choose 3 connected 5-foot squares next to you and make one attack roll against every creature in them."};
