/* ---------------- Spirit Tales ----------------
   Tales from Beyond's table (College of Spirits, Van Richten's Guide p. 28,
   checked on 5etools' data 2026-10-30), in the order of the roll.
   text(x): what it does, with x = {die, cha, lv, dc} worked in.
   roll: {qty (Bardic Inspiration dice), bonus: "cha" or "lv", label}.
   gain: "temp" or "heal", the roll can go to you (the tale can target you).
   attack: a melee spell attack first. */
export var SPIRIT_TALES = [
  {name:"Tale of the Clever Animal",
    text:function(x){ return "For 10 minutes, when the target makes an INT, WIS or CHA check, it can roll a d" + x.die + " right after the d20 and add it."; }},
  {name:"Tale of the Renowned Duelist", attack:true, roll:{qty:2, bonus:"cha", label:"Tale of the Renowned Duelist (force)"},
    text:function(x){ return "You make a melee spell attack against the target. On a hit: 2d" + x.die + " + " + x.cha + " force damage."; }},
  {name:"Tale of the Beloved Friends", gain:"temp", roll:{qty:1, bonus:"cha", label:"Tale of the Beloved Friends (temporary HP)"},
    text:function(x){ return "The target and another creature of its choice it can see within 5 ft gain 1d" + x.die + " + " + x.cha + " temporary hit points."; }},
  {name:"Tale of the Runaway",
    text:function(x){ return "The target can use its reaction to teleport up to 30 ft to an unoccupied space it can see. Up to " + Math.max(0, x.cha) + " creatures it chooses within 30 ft can do the same."; }},
  {name:"Tale of the Avenger", roll:{qty:1, label:"Tale of the Avenger (force)"},
    text:function(x){ return "For 1 minute, a creature that hits the target with a melee attack takes 1d" + x.die + " force damage."; }},
  {name:"Tale of the Traveler", gain:"temp", roll:{qty:1, bonus:"lv", label:"Tale of the Traveler (temporary HP)"},
    text:function(x){ return "The target gains 1d" + x.die + " + " + x.lv + " temporary hit points. While it has them, its walking speed is 10 ft higher and it has +1 AC."; }},
  {name:"Tale of the Beguiler", roll:{qty:2, label:"Tale of the Beguiler (psychic)"},
    text:function(x){ return "WIS save DC " + x.dc + ". On a failure: 2d" + x.die + " psychic damage, and it is incapacitated until the end of its next turn."; }},
  {name:"Tale of the Phantom", roll:{qty:1, label:"Tale of the Phantom (necrotic)"},
    text:function(x){ return "The target is invisible until the end of its next turn or until it hits with an attack. The creature it hits takes 1d" + x.die + " necrotic damage and is frightened of it until the end of that creature's next turn."; }},
  {name:"Tale of the Brute", roll:{qty:3, label:"Tale of the Brute (thunder)"},
    text:function(x){ return "Each creature the target chooses within 30 ft makes a STR save DC " + x.dc + ". On a failure: 3d" + x.die + " thunder damage and prone. On a success: half, and not prone."; }},
  {name:"Tale of the Dragon", roll:{qty:4, label:"Tale of the Dragon (fire)"},
    text:function(x){ return "The target breathes fire in a 30-ft cone. DEX save DC " + x.dc + ": 4d" + x.die + " fire damage on a failure, half on a success."; }},
  {name:"Tale of the Angel", gain:"heal", roll:{qty:2, bonus:"cha", label:"Tale of the Angel (hit points)"},
    text:function(x){ return "The target regains 2d" + x.die + " + " + x.cha + " hit points, and you end one of blinded, deafened, paralyzed, petrified or poisoned on it."; }},
  {name:"Tale of the Mind-Bender", roll:{qty:3, label:"Tale of the Mind-Bender (psychic)"},
    text:function(x){ return "INT save DC " + x.dc + ". On a failure: 3d" + x.die + " psychic damage, and it is stunned until the end of its next turn."; }}
];
