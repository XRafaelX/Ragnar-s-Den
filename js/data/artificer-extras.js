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
      {level:15, text:"Perfected Armor: reaction to pull a creature that ends its turn within 30 ft up to 30 ft toward you (STR save), then attack it if it's within 5 ft."}
    ]
  },
  "Infiltrator": {
    weapon: {name:"Lightning Launcher", ability:"dex", dice:"1d6", type:"lightning", range:"90/300 ft", extraDice:"1d6",
      note:"Once on each of your turns, a hit deals an extra 1d6 lightning damage."},
    speed: 5,
    perks: [
      {level:3, text:"Powered Steps: +5 ft walking speed."},
      {level:3, text:"Dampening Field: advantage on Dexterity (Stealth) checks; the armor's Stealth disadvantage doesn't apply."},
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
