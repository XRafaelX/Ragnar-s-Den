/* ---------------- Artificer extras ----------------
   Data for the Armorer's armor models and the Alchemist's experimental
   elixirs (the logic is in js/core/artificer.js).

   ARMOR_MODELS: each model's special weapon and perks.
     weapon  {name, ability ("str" melee / "dex" ranged; INT can be used
             instead), dice, type, range, extraDice (once per turn), note}
     speed   walking speed bonus while wearing the armor (Powered Steps)
     perks   [{level, text}]: what else the model gives, from that
             artificer level (the sheet's text is in the Armor Model and
             Perfected Armor features) */
export var ARMOR_MODELS = {
  "Guardian": {
    weapon: {name:"Thunder Gauntlets", ability:"str", dice:"1d8", type:"thunder", range:"melee",
      note:"A creature you hit has disadvantage on attack rolls against targets other than you until the start of your next turn."},
    perks: [
      {level:3, text:"Defensive Field: bonus action, gain temporary hit points equal to your artificer level (proficiency bonus times per long rest)."},
      {level:15, text:"Perfected Armor: reaction to pull a creature that ends its turn within 30 ft up to 25 ft toward you (STR save), then attack it if it's within 5 ft."}
    ]
  },
  "Infiltrator": {
    weapon: {name:"Lightning Launcher", ability:"dex", dice:"1d6", type:"lightning", range:"90/300 ft", extraDice:"1d6",
      note:"Once on each of your turns, a hit deals an extra 1d6 lightning damage."},
    speed: 5,
    perks: [
      {level:3, text:"Powered Steps: +5 ft walking speed."},
      {level:3, text:"Dampening Field: advantage on Dexterity (Stealth) checks. The armor's Stealth disadvantage doesn't apply."},
      {level:15, text:"Perfected Armor: a creature your Lightning Launcher damages glimmers until your next turn: attacks against you have disadvantage, and the next attack against it has advantage and deals an extra 1d6 lightning."}
    ]
  }
};

/* Experimental Elixir effects, by d6 roll. `heal` is rolled for the
   drinker (plus your INT modifier). */
export var ELIXIR_EFFECTS = [
  {roll:1, name:"Healing", text:"The drinker regains 2d4 + your INT modifier hit points.", heal:"2d4"},
  {roll:2, name:"Swiftness", text:"The drinker's walking speed increases by 10 feet for 1 hour."},
  {roll:3, name:"Resilience", text:"The drinker gains a +1 bonus to AC for 10 minutes."},
  {roll:4, name:"Boldness", text:"For 1 minute, the drinker rolls a d4 and adds it to every attack roll and saving throw."},
  {roll:5, name:"Flight", text:"The drinker gains a flying speed of 10 feet for 10 minutes."},
  {roll:6, name:"Transformation", text:"The drinker's body is transformed as if by Alter Self for 10 minutes (the drinker picks the change)."}
];

/* The 2024 Armorer's models (Eberron: Forge of the Artificer), checked
   against 5etools' data (source EFA) on 2026-11-12. As above, plus
   diceAt15 (Perfected Armor's bigger die) and reach. Improved Arsenal
   (Armorer 9) adds +1 to the weapon's attack and damage rolls. */
export var ARMOR_MODELS_2024 = {
  "Dreadnaught": {
    weapon: {name:"Force Demolisher", ability:"str", dice:"1d10", diceAt15:"2d6", type:"force", range:"melee, reach 10 ft",
      note:"Hit a creature at least one size smaller than you: push it up to 10 feet away or pull it up to 10 feet toward you."},
    perks: [
      {level:3, text:"Giant Stature: bonus action, for 1 minute your reach grows by 5 ft and you become Large (INT modifier times per long rest, the row on Vitals)."},
      {level:15, text:"Perfected Armor: Giant Stature grows your reach by 10 ft, makes you Large or Huge, and gives advantage on Strength checks and saves."}
    ]
  },
  "Guardian": {
    weapon: {name:"Thunder Pulse", ability:"str", dice:"1d8", diceAt15:"1d10", type:"thunder", range:"melee",
      note:"A creature you hit has disadvantage on attack rolls against targets other than you until the start of your next turn."},
    bloodiedField: true,
    perks: [
      {level:3, text:"Defensive Field: while bloodied, a bonus action gives temporary hit points equal to your artificer level (lost if you doff the armor)."},
      {level:15, text:"Perfected Armor: reaction to pull a Huge or smaller creature that ends its turn within 30 ft up to 25 ft toward you (STR save), then attack it if it's within 5 ft (INT modifier times per long rest)."}
    ]
  },
  "Infiltrator": {
    weapon: {name:"Lightning Launcher", ability:"dex", dice:"1d6", diceAt15:"2d6", type:"lightning", range:"90/300 ft", extraDice:"1d6",
      note:"Once on each of your turns, a hit deals an extra 1d6 lightning damage."},
    speed: 5,
    perks: [
      {level:3, text:"Powered Steps: +5 ft speed."},
      {level:3, text:"Dampening Field: advantage on Dexterity (Stealth) checks. The armor's Stealth disadvantage doesn't apply."},
      {level:15, text:"Perfected Armor: a creature your launcher damages glimmers until your next turn (dim light, disadvantage on attacks against you). Bonus action: a fly speed of twice your speed until the end of the turn (INT modifier times per long rest)."}
    ]
  }
};

/* The 2024 Alchemist's Experimental Elixir table at artificer level `lv`
   (it grows at 9 and 15). A 6 lets you choose one of the others. */
export function elixirEffects2024(lv){
  var t = lv>=15 ? 2 : lv>=9 ? 1 : 0;
  return [
    {roll:1, name:"Healing", text:"The drinker regains " + ["2d8", "3d8", "4d8"][t] + " + your INT modifier hit points.", heal:["2d8", "3d8", "4d8"][t]},
    {roll:2, name:"Swiftness", text:"The drinker's speed increases by " + [10, 15, 20][t] + " feet for 1 hour."},
    {roll:3, name:"Resilience", text:"The drinker gains a +1 bonus to AC for " + ["10 minutes", "1 hour", "8 hours"][t] + "."},
    {roll:4, name:"Boldness", text:"For " + ["1 minute", "10 minutes", "1 hour"][t] + ", the drinker rolls a d4 and adds it to every attack roll and saving throw."},
    {roll:5, name:"Flight", text:"The drinker gains a fly speed of " + [10, 20, 30][t] + " feet for 10 minutes."}
  ];
}
