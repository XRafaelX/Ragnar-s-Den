/* ---------------- How spells grow ----------------
   Cantrips grow with character level (more dice at 5, 11 and 17); other
   spells grow with the slot they're cast with ("At Higher Levels"). A
   warlock always casts with a pact slot, so its spells grow with it.
   Covers every cantrip and every spell a warlock can cast: the warlock
   list, the patrons' expanded lists and the invocations' spells. Spells
   with no higher-level effect have no entry.

   Cantrip entries: at(n) with n = 1 to 4 dice (the tier).
   Slot entries: per = what each slot level above the spell's adds (shown
   as "... per slot level above 1st"), or rule = the whole higher-level
   text when it goes in steps; at(k, slot) = the effect with a slot k
   levels above the spell's own (slot is the slot's level). */
var ordinal = function(n){ return n + (["th","st","nd","rd"][n] || "th"); };

function cantrip(die, what){
  return { at: function(n){ return n + "d" + die + " " + what; } };
}
function dmg(n, die, per, what){
  return { per: "+" + per + "d" + die + " " + what,
    at: function(k){ return (n + per*k) + "d" + die + " " + what; } };
}
function targets(n, one, many){
  return { per: "one more " + one,
    at: function(k){ return (n + k) + " " + (n + k === 1 ? one : many); } };
}
/* A higher-level effect in steps: `steps` = [[from slot, text], ...]
   highest first, `base` below them all. */
function steps(rule, base, list){
  return { rule: rule, at: function(k, slot){
    for(var i=0;i<list.length;i++) if(slot >= list[i][0]) return list[i][1];
    return base;
  } };
}

export var SPELL_SCALING = {
  /* ---- Cantrips ---- */
  "Acid Splash": cantrip(6, "acid damage"),
  "Chill Touch": cantrip(8, "necrotic damage"),
  // The sheet's version adds the invocations (see spellScalingLine).
  "Eldritch Blast": { at: function(n){ return n + " beam" + (n>1 ? "s" : "") + ", 1d10 force damage" + (n>1 ? " each" : ""); } },
  "Fire Bolt": cantrip(10, "fire damage"),
  "Mind Sliver": cantrip(6, "psychic damage"),
  "Poison Spray": cantrip(12, "poison damage"),
  "Produce Flame": cantrip(8, "fire damage"),
  "Ray of Frost": cantrip(8, "cold damage"),
  "Sacred Flame": cantrip(8, "radiant damage"),
  "Shocking Grasp": cantrip(8, "lightning damage"),
  "Thorn Whip": cantrip(6, "piercing damage"),
  "Toll the Dead": { at: function(n){ return n + "d8 necrotic damage, or " + n + "d12 if the target is missing any hit points"; } },
  "Vicious Mockery": cantrip(4, "psychic damage"),

  /* ---- 1st level ---- */
  "Armor of Agathys": { per: "+5 temporary hit points and +5 cold damage",
    at: function(k){ var x = 5 + 5*k; return x + " temporary hit points, and " + x + " cold damage to a creature that hits you in melee"; } },
  "Arms of Hadar": dmg(2, 6, 1, "necrotic damage"),
  "Bane": targets(3, "creature", "creatures"),
  "Burning Hands": dmg(3, 6, 1, "fire damage"),
  "Charm Person": targets(1, "humanoid", "humanoids"),
  "Command": targets(1, "creature", "creatures"),
  "Create or Destroy Water": { per: "+10 gallons (or +5 ft to the cube)",
    at: function(k){ return (10 + 10*k) + " gallons, or a " + (30 + 5*k) + "-ft cube"; } },
  "Cure Wounds": { per: "+1d8 healing",
    at: function(k){ return (1 + k) + "d8 + your spellcasting modifier hit points"; } },
  "Dissonant Whispers": dmg(3, 6, 1, "psychic damage"),
  "False Life": { per: "+5 temporary hit points",
    at: function(k){ return "1d4 + " + (4 + 5*k) + " temporary hit points"; } },
  "Fog Cloud": { per: "+20 ft to the radius",
    at: function(k){ return "a " + (20 + 20*k) + "-ft-radius sphere"; } },
  "Guiding Bolt": dmg(4, 6, 1, "radiant damage"),
  "Hellish Rebuke": dmg(2, 10, 1, "fire damage"),
  "Hex": steps("lasts up to 8 hours with a 3rd- or 4th-level slot, 24 hours with 5th or higher",
    "lasts up to 1 hour", [[5, "lasts up to 24 hours"], [3, "lasts up to 8 hours"]]),
  "Ray of Sickness": dmg(2, 8, 1, "poison damage"),
  "Sleep": { per: "+2d8 to the hit points roll",
    at: function(k){ return "puts " + (5 + 2*k) + "d8 hit points of creatures to sleep"; } },
  "Thunderwave": dmg(2, 8, 1, "thunder damage"),
  "Witch Bolt": { per: "+1d12 lightning damage on the first hit",
    at: function(k){ return (1 + k) + "d12 lightning damage on the first hit, then 1d12 each turn"; } },

  /* ---- 2nd level ---- */
  "Blindness/Deafness": targets(1, "creature", "creatures"),
  "Branding Smite": dmg(2, 6, 1, "radiant damage"),
  "Cloud of Daggers": dmg(4, 4, 2, "slashing damage"),
  "Flaming Sphere": dmg(2, 6, 1, "fire damage"),
  "Hold Person": targets(1, "humanoid", "humanoids"),
  "Invisibility": targets(1, "creature", "creatures"),
  "Scorching Ray": { per: "one more ray",
    at: function(k){ return (3 + k) + " rays, 2d6 fire damage each"; } },
  "Shatter": dmg(3, 8, 1, "thunder damage"),

  /* ---- 3rd level ---- */
  "Animate Dead": { per: "two more undead",
    at: function(k){ return "animate " + (1 + 2*k) + " undead, or keep control of up to " + (4 + 2*k); } },
  "Bestow Curse": steps("no concentration from a 4th-level slot: 10 minutes (4th), 8 hours (5th), 24 hours (7th), until dispelled (9th)",
    "concentration, up to 1 minute", [[9, "lasts until dispelled, no concentration"], [7, "lasts 24 hours, no concentration"],
      [5, "lasts 8 hours, no concentration"], [4, "lasts 10 minutes, no concentration"]]),
  "Counterspell": { rule: "automatically stops a spell of the slot's level or lower",
    at: function(k, slot){ return "automatically stops spells of " + ordinal(slot) + " level or lower"; } },
  "Dispel Magic": { rule: "automatically ends a spell of the slot's level or lower",
    at: function(k, slot){ return "automatically ends spells of " + ordinal(slot) + " level or lower"; } },
  "Elemental Weapon": steps("+2 and 2d4 with a 5th- or 6th-level slot, +3 and 3d4 with 7th or higher",
    "+1 to attack rolls and 1d4 extra damage", [[7, "+3 to attack rolls and 3d4 extra damage"], [5, "+2 to attack rolls and 2d4 extra damage"]]),
  "Fireball": dmg(8, 6, 1, "fire damage"),
  "Fly": targets(1, "creature", "creatures"),
  "Lightning Bolt": dmg(8, 6, 1, "lightning damage"),
  "Magic Circle": { per: "+1 hour",
    at: function(k){ return "lasts " + (1 + k) + " hour" + (k ? "s" : ""); } },
  "Major Image": steps("with a 6th-level slot or higher it lasts until dispelled, without concentration",
    "concentration, up to 10 minutes", [[6, "lasts until dispelled, no concentration"]]),
  "Summon Fey": { per: "a stronger spirit",
    at: function(k, slot){ return "spirit with AC " + (12 + slot) + ", " + (30 + 10*k) + " hit points, " + Math.floor(slot/2) +
      " attack" + (slot >= 4 ? "s" : "") + " a turn (shortsword 1d6 + " + (3 + slot) + " piercing + 1d6 force)"; } },
  "Vampiric Touch": dmg(3, 6, 1, "necrotic damage"),

  /* ---- 4th level ---- */
  "Banishment": targets(1, "creature", "creatures"),
  "Blight": dmg(8, 8, 1, "necrotic damage"),
  "Confusion": { per: "+5 ft to the radius",
    at: function(k){ return "a " + (10 + 5*k) + "-ft-radius sphere"; } },
  "Dominate Beast": steps("lasts up to 10 minutes with a 5th-level slot, 1 hour with 6th, 8 hours with 7th or higher",
    "concentration, up to 1 minute", [[7, "concentration, up to 8 hours"], [6, "concentration, up to 1 hour"], [5, "concentration, up to 10 minutes"]]),
  "Phantasmal Killer": dmg(4, 10, 1, "psychic damage"),
  "Summon Aberration": { per: "a stronger spirit",
    at: function(k, slot){ return "spirit with AC " + (11 + slot) + ", " + (40 + 10*k) + " hit points, " + Math.floor(slot/2) +
      " attacks a turn (each its die + " + (3 + slot) + ")"; } },
  "Summon Elemental": { per: "a stronger spirit",
    at: function(k, slot){ return "spirit with AC " + (11 + slot) + ", " + (50 + 10*k) + " hit points, " + Math.floor(slot/2) +
      " attacks a turn (slam 1d10 + " + (4 + slot) + ")"; } },
  "Wall of Fire": dmg(5, 8, 1, "fire damage"),

  /* ---- 5th level ---- */
  "Bigby's Hand": { per: "+2d8 to the fist and +2d6 to the crush",
    at: function(k){ return "Clenched Fist " + (4 + 2*k) + "d8 force damage, Grasping Hand crush " + (2 + 2*k) + "d6"; } },
  "Cloudkill": dmg(5, 8, 1, "poison damage"),
  "Cone of Cold": dmg(8, 8, 1, "cold damage"),
  "Conjure Elemental": { per: "+1 to the elemental's challenge rating",
    at: function(k){ return "an elemental of challenge rating " + (5 + k) + " or lower"; } },
  "Creation": { per: "+5 ft to the cube",
    at: function(k){ return "an object up to a " + (5 + 5*k) + "-ft cube"; } },
  "Dominate Person": steps("lasts up to 10 minutes with a 6th-level slot, 1 hour with 7th, 8 hours with 8th or higher",
    "concentration, up to 1 minute", [[8, "concentration, up to 8 hours"], [7, "concentration, up to 1 hour"], [6, "concentration, up to 10 minutes"]]),
  "Flame Strike": { per: "+1d6 fire or radiant damage",
    at: function(k){ return (4 + k) + "d6 fire and 4d6 radiant damage"; } },
  "Hold Monster": targets(1, "creature", "creatures"),

  /* ---- 6th level and up (a warlock's Mystic Arcanum casts these at
     their own level; other casters can use higher slots) ---- */
  "Circle of Death": dmg(8, 6, 2, "necrotic damage"),
  "Conjure Fey": { per: "+1 to the fey's challenge rating",
    at: function(k){ return "a fey of challenge rating " + (6 + k) + " or lower"; } },
  "Create Undead": steps("4 ghouls with a 7th-level slot; 5 ghouls or 2 ghasts or wights with 8th; 6 ghouls, 3 ghasts or wights, or 2 mummies with 9th",
    "up to 3 ghouls", [[9, "up to 6 ghouls, 3 ghasts or wights, or 2 mummies"], [8, "up to 5 ghouls, or 2 ghasts or wights"], [7, "up to 4 ghouls"]]),
  "Dominate Monster": steps("lasts up to 8 hours with a 9th-level slot", "concentration, up to 1 hour", [[9, "concentration, up to 8 hours"]]),
  "Mass Suggestion": steps("lasts 10 days with a 7th-level slot, 30 days with 8th, a year and a day with 9th",
    "lasts 24 hours", [[9, "lasts a year and a day"], [8, "lasts 30 days"], [7, "lasts 10 days"]])
};
