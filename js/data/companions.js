/* ---------------- Companions ----------------
   Creatures a subclass feature gives you, shown on the sheet's Companions
   tab (only there when the character has one) as a stat card with an HP tracker and roll buttons (see
   js/render/panels/companions.js). Each entry:
     id, name, cls, subclass, level   who gets it, from which class level
     choice       optional {label, options}: picked on the card and saved
                  (a drake's Draconic Essence); stats get it as ctx.choice
     setup        the choice option (or true when there's no choice) under
                  which the player enters the creature's own stat block (a
                  Beast Master's PHB beast, see BEAST_PRESETS); stats get
                  it as ctx.beast, and return null until it's entered
     stats(ctx)   the stat block right now; ctx = {lv (class level), pb,
                  mods {str..cha}, spellAttack, spellDC, choice, beast}
   The block:
     type, ac, hp, speed, count (how many at once, default 1)
     abilities {str..cha} (omit for objects), saves, skills, senses,
     immunities, resistances, vulnerabilities (text)
     attacks  [{name, toHit, dice, bonus, damageType, extraDice, extraType, text}]
     actions  [{name, text, dice, bonus, save}]: dice to roll (damage or
              healing), save "DEX 15" for the target
     reactions, traits  [{name, text}]
   A new companion is one more entry here; the card draws any of them. */
function plus(n){ return (n >= 0 ? "+" : "") + n; }

/* Common beasts for a Beast Master to start from (SRD stat blocks, before
   the ranger's bonuses); the form fills in from one, then it can be edited. */
export var BEAST_PRESETS = {
  "Wolf": {name:"Wolf", size:"Medium", ac:13, hp:11, speed:"40 ft", abilities:{str:12, dex:15, con:12, int:3, wis:12, cha:6},
    skills:"Perception +3, Stealth +4", senses:"passive Perception 13",
    attacks:[{name:"Bite", toHit:4, dice:"2d4", bonus:2, damageType:"piercing", text:"Reach 5 ft. A creature hit must succeed on a DC 11 STR save or be knocked prone."}],
    traits:"Keen Hearing and Smell: advantage on Perception checks that rely on hearing or smell. Pack Tactics: advantage on an attack roll against a creature if an ally is within 5 ft of it and isn't incapacitated."},
  "Panther": {name:"Panther", size:"Medium", ac:12, hp:13, speed:"50 ft, climb 40 ft", abilities:{str:14, dex:15, con:10, int:3, wis:14, cha:7},
    skills:"Perception +4, Stealth +6", senses:"passive Perception 14",
    attacks:[{name:"Bite", toHit:4, dice:"1d6", bonus:2, damageType:"piercing", text:"Reach 5 ft."},
      {name:"Claw", toHit:4, dice:"1d4", bonus:2, damageType:"slashing", text:"Reach 5 ft."}],
    traits:"Keen Smell: advantage on Perception checks that rely on smell. Pounce: if it moves at least 20 ft straight toward a creature and hits it with a claw, the target must succeed on a DC 12 STR save or be knocked prone; if it is, the panther can bite it as a bonus action."}
};
/* Tasha's Primal Companion: a primal beast summoned by the ranger. Its
   attack uses the ranger's spell attack; `bonus` is the flat part of the
   damage before the proficiency bonus. */
var PRIMAL_BEASTS = {
  "Beast of the Land": {size:"Medium", hpBase:5, hpPer:5, speed:"40 ft, climb 40 ft", abilities:{str:14, dex:14, con:15, int:8, wis:14, cha:11},
    attack:{name:"Maul", dice:"1d8", bonus:2, damageType:"slashing", text:"Melee, reach 5 ft, one target."},
    trait:{name:"Charge", text:"If it moves at least 20 ft straight toward a target and then hits it with Maul on the same turn, the target takes an extra 1d6 slashing damage; a creature must succeed on a STR save against your spell save DC or be knocked prone."}},
  "Beast of the Sea": {size:"Medium", hpBase:5, hpPer:5, speed:"5 ft, swim 60 ft", abilities:{str:14, dex:14, con:15, int:8, wis:14, cha:11},
    attack:{name:"Binding Strike", dice:"1d6", bonus:2, damageType:"piercing or bludgeoning", text:"Melee, reach 5 ft, one target. A creature hit is grappled (escape DC your spell save DC); until the grapple ends, it can't use this attack on another target."},
    trait:{name:"Amphibious", text:"It can breathe air and water."}},
  "Beast of the Sky": {size:"Small", hpBase:4, hpPer:4, speed:"10 ft, fly 60 ft", abilities:{str:6, dex:16, con:13, int:8, wis:14, cha:11},
    attack:{name:"Shred", dice:"1d4", bonus:3, damageType:"slashing", text:"Melee, reach 5 ft, one target."},
    trait:{name:"Flyby", text:"It doesn't provoke opportunity attacks when it flies out of an enemy's reach."}}
};
function primalBeast(kind, x){
  var p = PRIMAL_BEASTS[kind];
  return {
    type: p.size + " beast (primal)", ac: 13 + x.pb, hp: p.hpBase + p.hpPer * x.lv, speed: p.speed,
    abilities: p.abilities, senses:"darkvision 60 ft, passive Perception 12",
    attacks:[{name: p.attack.name, toHit: x.spellAttack, dice: p.attack.dice, bonus: p.attack.bonus + x.pb, damageType: p.attack.damageType, text: p.attack.text}],
    traits:[p.trait,
      {name:"Primal Bond", text:"Add your proficiency bonus (" + plus(x.pb) + ") to any ability check or saving throw it makes. It understands the languages you speak."},
      {name:"Commands", text:"It acts on your turn and takes the Dodge action unless you use a bonus action to command another action; when you take the Attack action, you can give up one attack to command it to Attack." +
        (x.lv >= 7 ? " Its attacks are magical." : "") + (x.lv >= 11 ? " It makes two attacks when you command it to Attack." : "")},
      {name:"Revive", text:"If it died within the last hour, use your action and a spell slot of 1st level or higher to bring it back after 1 minute with full HP; after a long rest you can summon a new one."}]
  };
}

/* "Perception +3, Stealth +4" with `add` added to each bonus. */
function addToSkills(text, add){
  return (text || "").replace(/([+-]\d+)/g, function(m){ return plus(Number(m) + add); });
}

export var COMPANIONS = [
  {id:"steel_defender", name:"Steel Defender", cls:"Artificer", subclass:"Battle Smith", level:3,
    stats:function(x){
      return {
        type:"Medium construct", ac: 15 + (x.lv >= 15 ? 2 : 0), hp: 2 + x.mods.int + 5 * x.lv, speed:"40 ft",
        abilities:{str:14, dex:12, con:14, int:4, wis:10, cha:6},
        saves:"DEX " + plus(1 + x.pb) + ", CON " + plus(2 + x.pb),
        skills:"Athletics " + plus(2 + x.pb) + ", Perception " + plus(2 * x.pb),
        senses:"darkvision 60 ft, passive Perception " + (10 + 2 * x.pb),
        immunities:"poison damage; charmed, exhaustion, poisoned",
        attacks:[{name:"Force-Empowered Rend", toHit: x.spellAttack, dice:"1d8", bonus: x.pb, damageType:"force",
          text:"Melee, reach 5 ft, one target it can see." + (x.lv >= 9 ? " A hit can trigger your Arcane Jolt." : "")}],
        actions:[{name:"Repair (3/day)", text:"Restores hit points to itself or a construct or object within 5 ft.", dice:"2d8", bonus: x.pb}],
        reactions:[{name:"Deflect Attack", text:"A creature it can see within 5 ft has disadvantage on an attack roll against someone other than the defender." +
          (x.lv >= 15 ? " The attacker takes 1d4 + " + Math.max(0, x.mods.int) + " force damage." : "")}],
        traits:[{name:"Vigilant", text:"It can't be surprised."},
          {name:"Your turn", text:"It acts right after you and takes the Dodge action unless you use a bonus action to command it."}]
      };
    }},
  {id:"eldritch_cannon", name:"Eldritch Cannon", cls:"Artificer", subclass:"Artillerist", level:3,
    stats:function(x){
      var boom = x.lv >= 9 ? "3d8" : "2d8";      // Explosive Cannon: +1d8 to its damage
      return {
        type:"Small or Tiny object", ac:18, hp: 5 * x.lv, speed:"15 ft (if it has legs)", count: x.lv >= 15 ? 2 : 1,
        immunities:"poison and psychic damage; +0 to all checks and saves",
        attacks:[{name:"Force Ballista", toHit: x.spellAttack, dice: boom, bonus:0, damageType:"force",
          text:"Ranged spell attack, 120 ft, one creature or object; it's pushed 5 ft away."}],
        actions:[
          {name:"Flamethrower", text:"15-ft cone: fire damage on a failed save, half on a success; ignites unattended flammable objects.", dice: boom, bonus:0, save:"DEX " + x.spellDC},
          {name:"Protector", text:"It and each creature of your choice within 10 ft gain temporary hit points.", dice:"1d8", bonus: Math.max(1, x.mods.int)}
        ].concat(x.lv >= 9 ? [{name:"Detonate (Explosive Cannon)", text:"Your action within 60 ft: the cannon is destroyed and each creature within 20 ft takes force damage (half on a success).", dice:"3d8", bonus:0, save:"DEX " + x.spellDC}] : []),
        traits:[{name:"Activate", text:"Bonus action within 60 ft: it uses one of its actions" + (x.lv >= 15 ? " (both cannons with one bonus action)" : "") + ". It lasts 1 hour, until 0 HP or until you dismiss it."}]
          .concat(x.lv >= 15 ? [{name:"Fortified Position", text:"You and your allies have half cover within 10 ft of a cannon."}] : [])
      };
    }},
  {id:"drake", name:"Drake", cls:"Ranger", subclass:"Drakewarden", level:3,
    choice:{label:"Draconic Essence", options:["Acid","Cold","Fire","Lightning","Poison"]},
    stats:function(x){
      var essence = x.choice ? x.choice.toLowerCase() : "essence";
      var size = x.lv >= 15 ? "Large" : x.lv >= 7 ? "Medium" : "Small";
      var extra = x.lv >= 15 ? "2d6" : x.lv >= 7 ? "1d6" : "";
      return {
        type: size + " dragon", ac: 14 + x.pb, hp: 5 + 5 * x.lv,
        speed: "40 ft" + (x.lv >= 7 ? ", fly 40 ft" + (x.lv >= 15 ? "" : " (not while ridden)") : ""),
        abilities:{str:16, dex:12, con:15, int:8, wis:14, cha:8},
        saves:"DEX " + plus(1 + x.pb) + ", WIS " + plus(2 + x.pb),
        senses:"darkvision 60 ft, passive Perception 12", immunities: essence + " damage",
        attacks:[{name:"Bite", toHit: 3 + x.pb, dice:"1d6", bonus: x.pb, damageType:"piercing", extraDice: extra, extraType: essence, text:"Melee, reach 5 ft, one target."}],
        actions: x.lv >= 11 ? [{name:"Drake's Breath", text:"You or your drake exhale a 30-ft cone; " + essence + " damage on a failed save, half on a success. Once per long rest, or a 3rd-level or higher slot.",
          dice: x.lv >= 15 ? "10d6" : "8d6", bonus:0, save:"DEX " + x.spellDC}] : [],
        reactions:[{name:"Infused Strikes", text:"When another creature within 30 ft that it can see hits a target with a weapon attack, the target takes an extra 1d6 " + essence + " damage."}],
        traits:[{name:"Your turn", text:"It acts right after you and takes the Dodge action unless you use a bonus action to command it. It understands Draconic."}]
          .concat(x.lv >= 7 ? [{name:"Mount", text:"You can ride it if you're " + (x.lv >= 15 ? "Large" : "Medium") + " or smaller" + (x.lv >= 15 ? ", and it can fly while you ride it." : ".")}] : [])
      };
    }},
  {id:"wildfire_spirit", name:"Wildfire Spirit", cls:"Druid", subclass:"Circle of Wildfire", level:2,
    stats:function(x){
      return {
        type:"Small elemental", ac:13, hp: 5 + 5 * x.lv, speed:"30 ft, fly 30 ft (hover)",
        abilities:{str:10, dex:14, con:14, int:13, wis:15, cha:11},
        senses:"darkvision 60 ft, passive Perception 12", immunities:"fire damage; charmed, frightened, grappled, prone, restrained",
        attacks:[{name:"Flame Seed", toHit: x.spellAttack, dice:"1d6", bonus: x.pb, damageType:"fire", text:"Ranged spell attack, 60 ft, one target."}],
        actions:[
          {name:"Fiery Teleportation", text:"It and each willing creature of your choice within 5 ft teleport up to 15 ft; each creature within 5 ft of the space it left takes fire damage on a failed save.", dice:"1d6", bonus: x.pb, save:"DEX " + x.spellDC},
          {name:"Summoning flare", text:"When it appears, each creature other than you within 10 ft takes fire damage on a failed save.", dice:"2d6", bonus:0, save:"DEX " + x.spellDC}
        ],
        traits:[{name:"Your turn", text:"It acts right after you and takes the Dodge action unless you use a bonus action to command it. It lasts 1 hour (summoned with a use of Wild Shape) and understands your languages."}]
          .concat(x.lv >= 14 ? [{name:"Blazing Revival", text:"Once per long rest, when you drop to 0 HP within 120 ft of it, it can drop to 0 HP instead so you regain half your hit points and stand up."}] : [])
      };
    }},
  {id:"blighted_sapling", name:"Blighted Sapling", cls:"Druid", subclass:"Circle of the Blighted", level:6,
    stats:function(x){
      return {
        type:"Medium plant", ac: 10 + x.pb, hp: 2 * x.lv, speed:"30 ft",
        abilities:{str:8, dex:13, con:12, int:4, wis:8, cha:3},
        senses:"blindsight 60 ft (blind beyond this radius), passive Perception 9",
        vulnerabilities:"fire",
        resistances: x.lv >= 10 ? "" : "necrotic, poison",
        immunities: x.lv >= 10 ? "necrotic and poison damage; blinded, deafened, poisoned" : "blinded, deafened, poisoned",
        attacks:[{name:"Claws", toHit: x.spellAttack, dice:"2d4", bonus: x.pb, damageType:"piercing",
          text:"Melee, reach 5 ft, one target." + (x.lv >= 14 ? " It makes two Claws attacks (Multiattack)." : "")}],
        actions: x.lv >= 10 ? [{name:"Explode (Foul Conjuration)", text:"When it dies, or you use your action to detonate it, each creature within 5 ft takes necrotic damage on a failed save.",
          dice: x.pb + "d6", bonus:0, save:"CON " + x.spellDC}] : [],
        traits:[{name:"Call of the Shadowseeds", text:"Your reaction raises it next to a creature that takes damage in your Defile Ground; it attacks at once, then obeys your verbal commands on your turn. It lasts until 0 HP, your long rest, or you summon another. It understands your languages."}]
      };
    }},
  {id:"beast_companion", name:"Ranger's Companion", cls:"Ranger", subclass:"Beast Master", level:3,
    // Tasha's Primal Companion (three fixed beasts) or the PHB companion (your own beast).
    choice:{label:"Companion", options:["Beast of the Land","Beast of the Sea","Beast of the Sky","Your own beast"]},
    setup:"Your own beast",
    stats:function(x){
      // A beast entered before this choice existed is "Your own beast".
      var kind = x.choice || (x.beast ? "Your own beast" : "");
      if(PRIMAL_BEASTS[kind]) return primalBeast(kind, x);
      var b = kind==="Your own beast" && x.beast;
      if(!b) return null;
      var hp = Math.max(Number(b.hp)||1, 4 * x.lv);
      return {
        type: (b.size || "Medium") + " beast: " + (b.name || "companion"), ac: (Number(b.ac)||10) + x.pb, hp: hp, speed: b.speed || "30 ft",
        abilities: b.abilities, skills: b.skills ? addToSkills(b.skills, x.pb) : "", senses: b.senses || "",
        attacks:(b.attacks||[]).map(function(a){
          return {name: a.name, toHit: (Number(a.toHit)||0) + x.pb, dice: a.dice || "1d4", bonus: (Number(a.bonus)||0) + x.pb, damageType: a.damageType || "", text: a.text || ""};
        }),
        traits:(b.traits ? [{name:"Traits", text: b.traits}] : [])
          .concat([{name:"Commands", text:"It acts on your initiative but only when you command it: your action has it Attack, Dash, Disengage, Dodge or Help" +
            (x.lv >= 5 ? " (and you make one weapon attack when it attacks)" : "") + "." +
            (x.lv >= 7 ? " A bonus action can command Dash, Disengage, Dodge or Help when it doesn't attack; its attacks are magical." : "") +
            (x.lv >= 11 ? " It makes two attacks when you command it to Attack." : "")}])
      };
    }}
];
