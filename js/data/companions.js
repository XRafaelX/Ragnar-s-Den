/* ---------------- Companions ----------------
   Creatures a subclass feature gives you, shown on the Vitals tab as a
   stat card with an HP tracker and roll buttons (see
   js/render/panels/companions.js). Each entry:
     id, name, cls, subclass, level   who gets it, from which class level
     stats(ctx)   the stat block right now; ctx = {lv (class level), pb,
                  mods {str..cha}, spellAttack, spellDC} of the character
   The block:
     type, ac, hp, speed, count (how many at once, default 1)
     abilities {str..cha} (omit for objects), saves, skills, senses,
     immunities (text)
     attacks  [{name, toHit, dice, bonus, damageType, text}]
     actions  [{name, text, dice, bonus, save}]: dice to roll (damage or
              healing), save "DEX 15" for the target
     reactions, traits  [{name, text}]
   A new companion is one more entry here; the card draws any of them. */
function plus(n){ return (n >= 0 ? "+" : "") + n; }

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
    }}
];
