/* ---------------- Companions ----------------
   Creatures a subclass feature gives you, shown on the sheet's Companions
   tab (only there when the character has one) as a stat card with an HP tracker and roll buttons (see
   js/render/panels/companions.js). Each entry:
     id, name, cls, subclass, level   who gets it, from which class level
                  (no subclass: any of the class's)
     infusion     optional: only while this artificer infusion is active
                  (Homunculus Servant); `source` then names it on the card
     choice       optional {label, options, noun}: picked on the card and saved
                  (a drake's Draconic Essence); stats get it as ctx.choice.
                  noun follows the pick in the card's subtitle ("Fire essence")
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
     reactions, traits  [{name, text}]; an unnamed trait's text may hold
              several "Name: text" traits, which the card splits
     riding   a mount's riding rules [{name, text}], their own tiles
     requires     in place of cls: {spell, pactBoon}, either one (a familiar:
                  Find Familiar known, or Pact of the Chain); stats get
                  ctx.chain then. choice.chainOnly lists the options only
                  Pact of the Chain allows. A druid's Wild Companion
                  counts as Find Familiar (ctx.wild: the hours it lasts,
                  ctx.wildOnly when that's the only way the druid casts it).
   A new companion is one more entry here; the card draws any of them. */
import { SRD_STAT_BLOCKS, BEAST_MASTER_BEASTS, FAMILIAR_FORMS, CHAIN_FAMILIARS, MOUNTS } from "./beast-blocks.js";

function plus(n){ return (n >= 0 ? "+" : "") + n; }

/* The beasts a Beast Master can start from: every SRD beast no larger
   than Medium with a challenge rating of 1/4 or lower (./beast-blocks.js,
   before the ranger's bonuses); the form fills in from one, then it can be
   edited. */
export var BEAST_PRESETS = {};
BEAST_MASTER_BEASTS.forEach(function(n){
  var b = Object.assign({}, SRD_STAT_BLOCKS[n]);
  delete b.type; delete b.cr;
  BEAST_PRESETS[n] = b;
});
/* Tasha's Primal Companion: a primal beast summoned by the ranger. Its
   attack uses the ranger's spell attack; `bonus` is the flat part of the
   damage before the proficiency bonus. */
var PRIMAL_BEASTS = {
  "Beast of the Land": {size:"Medium", hpBase:5, hpPer:5, speed:"40 ft, climb 40 ft", abilities:{str:14, dex:14, con:15, int:8, wis:14, cha:11},
    attack:{name:"Maul", dice:"1d8", bonus:2, damageType:"slashing", text:"Melee, reach 5 ft, one target."},
    trait:{name:"Charge", text:"If it moves at least 20 ft straight toward a target and then hits it with Maul on the same turn, the target takes an extra 1d6 slashing damage. A creature must succeed on a STR save against your spell save DC or be knocked prone."}},
  "Beast of the Sea": {size:"Medium", hpBase:5, hpPer:5, speed:"5 ft, swim 60 ft", abilities:{str:14, dex:14, con:15, int:8, wis:14, cha:11},
    attack:{name:"Binding Strike", dice:"1d6", bonus:2, damageType:"piercing or bludgeoning", text:"Melee, reach 5 ft, one target. A creature hit is grappled (escape DC your spell save DC). Until the grapple ends, it can't use this attack on another target."},
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
      {name:"Commands", text:"It acts on your turn and takes the Dodge action unless you use a bonus action to command another action. When you take the Attack action, you can give up one attack to command it to Attack." +
        (x.lv >= 7 ? " Its attacks are magical." : "") + (x.lv >= 11 ? " It makes two attacks when you command it to Attack." : "")},
      {name:"Revive", text:"If it died within the last hour, use your action and a spell slot of 1st level or higher to bring it back after 1 minute with full HP. After a long rest you can summon a new one."}]
  };
}

/* Mounts the DM added for this table (not in the SRD). The War Camel is
   D&D 3.5's (Sandstorm: 4 HD, Str 18 Dex 16 Con 18, two hooves and a
   bite, Sure Feet, Endurance, scent, fights while ridden) brought to 5e,
   with the spit camels have in older material and the SRD mule's
   advantage against being knocked prone folded into Sure-Footed. About CR 1: a step above
   the warhorse, on purpose. warTrained lets it attack as a controlled
   mount. */
var HOMEBREW_MOUNTS = {
  "War Camel": {name:"War Camel", size:"Large", type:"beast", homebrew:true, warTrained:true, ac:13, hp:38, speed:"50 ft",
    abilities:{str:18, dex:16, con:18, int:2, wis:13, cha:5},
    skills:"Perception +3", senses:"passive Perception 13",
    attacks:[
      {name:"Hooves", toHit:6, dice:"1d6", bonus:4, damageType:"bludgeoning", text:"Reach 5 ft."},
      {name:"Bite", toHit:6, dice:"1d4", bonus:4, damageType:"piercing", text:"Reach 5 ft."}],
    actions:[
      {name:"Multiattack", text:"It makes one Hooves attack and one Bite attack."},
      {name:"Spit (recharge 5–6)", save:"CON 14", text:"One creature within 15 ft that it can see is blinded until the end of its next turn on a failed save."}],
    traits:[
      {name:"War-Trained", text:"Bred and trained to fight with a rider on its back."},
      {name:"Keen Smell", text:"It has advantage on Wisdom (Perception) checks that rely on smell."},
      {name:"Sure-Footed", text:"Sand and other loose ground aren't difficult terrain for it, and it has advantage on Strength and Dexterity saves against effects that would knock it prone."},
      {name:"Desert Endurance", text:"It can go a week without water, and it has advantage on Constitution saves against extreme heat and forced marches."}]}
};

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
        immunities:"poison damage · charmed, exhaustion, poisoned",
        attacks:[{name:"Force-Empowered Rend", toHit: x.spellAttack, dice:"1d8", bonus: x.pb, damageType:"force",
          text:"Melee, reach 5 ft, one target it can see." + (x.lv >= 9 ? " A hit can trigger your Arcane Jolt." : "")}],
        actions:[{name:"Repair (3/day)", text:"Restores hit points to itself or a construct or object within 5 ft.", dice:"2d8", bonus: x.pb}],
        reactions:[{name:"Deflect Attack", text:"A creature it can see within 5 ft has disadvantage on an attack roll against someone other than the defender." +
          (x.lv >= 15 ? " The attacker takes 1d4 + " + Math.max(0, x.mods.int) + " force damage." : "")}],
        traits:[{name:"Vigilant", text:"It can't be surprised."},
          {name:"Your turn", text:"It acts right after you and takes the Dodge action unless you use a bonus action to command it."}]
      };
    }},
  // Echo Knight (Explorer's Guide to Wildemount, p. 183, checked on
  // 5etools' data 2026-10-30): Manifest Echo, two from Legion of One (18).
  {id:"echo", name:"Echo", cls:"Fighter", subclass:"Echo Knight", level:3,
    stats:function(x){
      var traits = [
        {name:"Manifest Echo", text:"Bonus action: it appears in an unoccupied space you can see within 15 feet. It lasts until it's destroyed, you dismiss it (bonus action), you manifest another, or you're incapacitated. It's destroyed if it's ever more than 30 feet from you at the end of your turn."},
        {name:"Moving it", text:"On your turn you can mentally move it up to 30 feet in any direction (no action). As a bonus action you can teleport to its space and swap places with it, for 15 feet of your movement."},
        {name:"Attacking from it", text:"When you take the Attack action, any attack you make can come from your space or the echo's. When a creature you can see within 5 feet of it moves at least 5 feet away from it, you can use your reaction to make an opportunity attack as if you were in its space."},
        {name:"Saves and conditions", text:"It uses your saving throw bonuses and is immune to all conditions."}];
      if(x.lv >= 7) traits.push({name:"Echo Avatar", text:"Action: see and hear through it for up to 10 minutes, while you're blinded and deafened. It can then be up to 1,000 feet from you."});
      if(x.lv >= 18) traits.push({name:"Legion of One", text:"You can have two echoes at once (a third destroys both). Anything you can do from one's position you can do from the other's."});
      return {type:"Medium echo of you", ac: 14 + x.pb, hp: 1, speed:"30 ft, in any direction", count: x.lv >= 18 ? 2 : 1, traits: traits};
    }},
  {id:"homunculus_servant", name:"Homunculus Servant", cls:"Artificer", level:2,
    infusion:"Homunculus Servant", source:"Homunculus Servant infusion",
    stats:function(x){
      return {
        type:"Tiny construct", ac:13, hp: 1 + x.mods.int + x.lv, speed:"20 ft, fly 30 ft",
        abilities:{str:4, dex:15, con:12, int:10, wis:10, cha:7},
        saves:"DEX " + plus(2 + x.pb),
        skills:"Perception " + plus(2 * x.pb) + ", Stealth " + plus(2 + x.pb),
        senses:"darkvision 60 ft, passive Perception " + (10 + 2 * x.pb),
        immunities:"poison damage · exhaustion, poisoned",
        attacks:[{name:"Force Strike", toHit: x.spellAttack, dice:"1d4", bonus: x.pb, damageType:"force",
          text:"Ranged, 30 ft, one target it can see. Needs your bonus action."}],
        reactions:[{name:"Channel Magic", text:"It delivers a spell you cast that has a range of touch. It must be within 120 ft of you."}],
        traits:[{name:"Evasion", text:"On a Dexterity save for half damage it takes none on a success and half on a failure (not while incapacitated)."},
          {name:"Your turn", text:"It acts right after you and takes the Dodge action unless you use a bonus action to command it. If you're incapacitated it acts freely."},
          {name:"Mending", text:"It regains 2d6 hit points when the mending spell is cast on it. If you or it die, it vanishes and leaves its gem."}]
      };
    }},
  {id:"eldritch_cannon", name:"Eldritch Cannon", cls:"Artificer", subclass:"Artillerist", level:3,
    stats:function(x){
      var boom = x.lv >= 9 ? "3d8" : "2d8";      // Explosive Cannon: +1d8 to its damage
      return {
        type:"Small or Tiny object", ac:18, hp: 5 * x.lv, speed:"15 ft (if it has legs)", count: x.lv >= 15 ? 2 : 1,
        immunities:"poison and psychic damage · +0 to all checks and saves",
        attacks:[{name:"Force Ballista", toHit: x.spellAttack, dice: boom, bonus:0, damageType:"force",
          text:"Ranged spell attack, 120 ft, one creature or object. It's pushed 5 ft away."}],
        actions:[
          {name:"Flamethrower", text:"15-ft cone: fire damage on a failed save, half on a success. It ignites unattended flammable objects.", dice: boom, bonus:0, save:"DEX " + x.spellDC},
          {name:"Protector", text:"It and each creature of your choice within 10 ft gain temporary hit points.", dice:"1d8", bonus: Math.max(1, x.mods.int)}
        ].concat(x.lv >= 9 ? [{name:"Detonate (Explosive Cannon)", text:"Your action within 60 ft: the cannon is destroyed and each creature within 20 ft takes force damage (half on a success).", dice:"3d8", bonus:0, save:"DEX " + x.spellDC}] : []),
        traits:[{name:"Activate", text:"Bonus action within 60 ft: it uses one of its actions" + (x.lv >= 15 ? " (both cannons with one bonus action)" : "") + ". It lasts 1 hour, until 0 HP or until you dismiss it."}]
          .concat(x.lv >= 15 ? [{name:"Fortified Position", text:"You and your allies have half cover within 10 ft of a cannon."}] : [])
      };
    }},
  {id:"drake", name:"Drake", cls:"Ranger", subclass:"Drakewarden", level:3,
    choice:{label:"Draconic Essence", options:["Acid","Cold","Fire","Lightning","Poison"], noun:"essence"},
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
        actions: x.lv >= 11 ? [{name:"Drake's Breath", text:"You or your drake exhale a 30-ft cone of " + essence + " damage. A creature takes full damage on a failed save and half on a success. Once per long rest, or a 3rd-level or higher slot.",
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
        senses:"darkvision 60 ft, passive Perception 12", immunities:"fire damage · charmed, frightened, grappled, prone, restrained",
        attacks:[{name:"Flame Seed", toHit: x.spellAttack, dice:"1d6", bonus: x.pb, damageType:"fire", text:"Ranged spell attack, 60 ft, one target."}],
        actions:[
          {name:"Fiery Teleportation", text:"It and each willing creature of your choice within 5 ft teleport up to 15 ft. Each creature within 5 ft of the space it left takes fire damage on a failed save.", dice:"1d6", bonus: x.pb, save:"DEX " + x.spellDC},
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
        immunities: x.lv >= 10 ? "necrotic and poison damage · blinded, deafened, poisoned" : "blinded, deafened, poisoned",
        attacks:[{name:"Claws", toHit: x.spellAttack, dice:"2d4", bonus: x.pb, damageType:"piercing",
          text:"Melee, reach 5 ft, one target." + (x.lv >= 14 ? " It makes two Claws attacks (Multiattack)." : "")}],
        actions: x.lv >= 10 ? [{name:"Explode (Foul Conjuration)", text:"When it dies, or you use your action to detonate it, each creature within 5 ft takes necrotic damage on a failed save.",
          dice: x.pb + "d6", bonus:0, save:"CON " + x.spellDC}] : [],
        traits:[{name:"Call of the Shadowseeds", text:"Your reaction raises it next to a creature that takes damage in your Defile Ground. It attacks at once, then obeys your verbal commands on your turn. It lasts until 0 HP, your long rest, or you summon another. It understands your languages."}]
      };
    }},
  // Tasha's Cauldron (p. 28), checked on 5etools' data 2026-10-30.
  {id:"dancing_item", name:"Dancing Item", cls:"Bard", subclass:"College of Creation", level:6,
    stats:function(x){
      return {
        type:"Large or smaller construct", ac:16, hp: 10 + 5 * x.lv, speed:"30 ft, fly 30 ft (hover)",
        abilities:{str:18, dex:14, con:16, int:4, wis:10, cha:6},
        senses:"darkvision 60 ft, passive Perception 10", immunities:"poison and psychic damage · charmed, exhaustion, frightened, poisoned",
        attacks:[{name:"Force-Empowered Slam", toHit: x.spellAttack, dice:"1d10", bonus: x.pb, damageType:"force", text:"Melee, reach 5 ft, one target you can see."}],
        actions:[],
        traits:[
          {name:"Your turn", text:"It acts right after you and takes the Dodge action unless you use a bonus action to command it, which can be the one you use for Bardic Inspiration. It lasts 1 hour and understands your languages."},
          {name:"Irrepressible Dance", text:"When a creature starts its turn within 10 ft of it, it can raise or lower that creature's walking speed by 10 ft until the end of the turn, your choice."},
          {name:"Immutable Form", text:"It is immune to any spell or effect that would alter its form."}
        ]
      };
    }},
  // Tasha's Cauldron (p. 36) with the Monster Manual's zombie, at 1 hit point.
  {id:"fungal_zombie", name:"Fungal Zombie", cls:"Druid", subclass:"Circle of Spores", level:6,
    stats:function(){
      return {
        type:"Medium undead", ac:8, hp:1, speed:"20 ft",
        abilities:{str:13, dex:6, con:16, int:3, wis:6, cha:5},
        senses:"darkvision 60 ft, passive Perception 8", immunities:"poison damage · poisoned",
        attacks:[{name:"Slam", toHit:3, dice:"1d6", bonus:1, damageType:"bludgeoning", text:"Melee, reach 5 ft, one target."}],
        actions:[],
        traits:[
          {name:"Your turn", text:"It acts right after you, obeys your mental commands, and can only take the Attack action, making one melee attack. It collapses and dies after 1 hour."},
          {name:"Undead Fortitude", text:"If damage reduces it to 0 hit points, it makes a CON save with DC 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success it drops to 1 hit point instead."}
        ]
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
        traits:(b.traits ? [{text: b.traits}] : [])
          .concat([{name:"Commands", text:"It acts on your initiative but only when you command it: your action has it Attack, Dash, Disengage or Help, and it Dodges with no command" +
            (x.lv >= 5 ? " (and you make one weapon attack when it attacks)" : "") + "." +
            (x.lv >= 7 ? " A bonus action can command Dash, Disengage or Help when it doesn't attack. Its attacks are magical." : "") +
            (x.lv >= 11 ? " It makes two attacks, or its Multiattack, when you command it to Attack." : "")}])
      };
    }},
  // A Cavalier's mount: one of the PHB's mounts, bought or found in play
  // (the subclass doesn't give one), with the mounted combat rules.
  {id:"mount", name:"Mount", cls:"Fighter", subclass:"Cavalier", level:3,
    choice:{label:"Mount", options:MOUNTS.concat(Object.keys(HOMEBREW_MOUNTS)),
      intro:"Choose your mount. The Cavalier doesn't come with one: buy it or find it in play, then track it here."},
    stats:function(x){
      var b = SRD_STAT_BLOCKS[x.choice] || HOMEBREW_MOUNTS[x.choice];
      if(!b) return null;
      var rules = [
        {name:"Controlled mount", text:"While you ride it, it acts on your initiative and moves as you direct. It can take only the Dash, Disengage and Dodge actions" +
          (b.warTrained ? ", and the Attack action (it's war-trained)." : ".")},
        {name:"Born to the Saddle", text:"Mounting or dismounting costs you 5 ft of movement. If it is moved against its will or you are knocked prone, you make a DEX save (DC 10) with advantage or fall off. A fall of 10 ft or less lands you on your feet (unless you are incapacitated)."}];
      if(b.size==="Medium") rules.unshift({name:"Rider", text:"Only a Small rider can ride it."});
      return {
        type: b.size + " beast: " + x.choice.toLowerCase() + (b.homebrew ? " (homebrew)" : ""),
        ac: b.ac, hp: b.hp, speed: b.speed, abilities: b.abilities, skills: b.skills, senses: b.senses,
        attacks: b.attacks, actions: b.actions || [],
        traits: b.traits ? [].concat(b.traits).map(function(t){ return typeof t==="string" ? {text: t} : t; }) : [],
        riding: rules
      };
    }},
  // Find Familiar (PHB) and Pact of the Chain: the familiar's own stat
  // block, as a celestial, fey or fiend; it attacks only for a chain pact.
  {id:"familiar", name:"Familiar", requires:{spell:"Find Familiar", pactBoon:"Pact of the Chain"},
    choice:{label:"Form", options:FAMILIAR_FORMS.concat(CHAIN_FAMILIARS), chainOnly:CHAIN_FAMILIARS,
      intro:"Choose your familiar's form. It is a celestial, fey or fiend spirit in that shape."},
    stats:function(x){
      var b = SRD_STAT_BLOCKS[x.choice];
      if(!b || (!x.chain && CHAIN_FAMILIARS.indexOf(x.choice)!==-1)) return null;
      var rules = [
        {name:"Familiar", text:"It acts on its own initiative and obeys your commands." + (x.chain ? "" : " It can't attack, but it can take other actions.")},
        {name:"Shared senses", text:"Within 100 feet you can talk with it telepathically, and as an action see through its eyes and hear what it hears until the start of your next turn. It can deliver your touch spells with its reaction."},
        {name:"Dismiss", text:"As an action you can send it to a pocket dimension and later recall it within 30 feet. At 0 hit points it vanishes until you cast Find Familiar again."}];
      if(x.chain) rules.push({name:"Pact of the Chain", text:"When you take the Attack action, you can forgo one of your attacks so that it attacks once with its reaction."});
      if(x.wild) rules.push({name:"Wild Companion", text:"Summoned with a use of Wild Shape, it's a fey and disappears after " + x.wild + (x.wild===1 ? " hour" : " hours") + ". Summon it from Wild Shape on the Vitals tab."});
      return {
        type: b.size + " " + (b.type!=="beast" ? b.type : x.wildOnly ? "fey" : "celestial, fey or fiend") + ": " + x.choice.toLowerCase(),
        ac: b.ac, hp: b.hp, speed: b.speed, abilities: b.abilities, skills: b.skills, senses: b.senses,
        attacks: x.chain ? b.attacks : [],
        traits: (b.traits ? [{text: b.traits}] : []).concat(rules)
      };
    }}
];
