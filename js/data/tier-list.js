/* ---------------- Tier list (secret) ----------------
   Overall power of each class, S (strongest) to D, in each band of the
   tiers of play, for the 2014 and the 2024 rules separately. Shown only
   in the Compendium's Tier list tab, which appears after the secret
   switch (hold the home screen's centre die, js/ui/private-egg.js).
   Each entry: tiers = one letter per band in TIER_BANDS order, and a
   short reason. Spikael's Gunslinger (private) is rated in both lists,
   since a 2024 table can still use it, and only shows while the private
   content is on (the tab lists the classes in CLASS_LIST). */

export var TIER_LETTERS = ["S", "A", "B", "C", "D"];
export var TIER_BANDS = [
  {key: "1-4", label: "Levels 1-4"},
  {key: "5-10", label: "Levels 5-10"},
  {key: "11-16", label: "Levels 11-16"},
  {key: "17-20", label: "Levels 17-20"}
];

export var CLASS_TIERS = {
  "2014": {
    "Wizard":    {tiers: ["B","S","S","S"], why: "Fragile at first, then the largest spell list in the game takes over. Spells like Fireball, Wall of Force and Wish decide fights."},
    "Cleric":    {tiers: ["A","S","S","S"], why: "Heavy armor, healing and Spirit Guardians from level 5. Strong at every level and the best support in the game."},
    "Druid":     {tiers: ["S","S","S","S"], why: "A Moon druid's Wild Shape rules levels 2 to 4, and the spell list is superb. At level 20 it can Wild Shape without limit."},
    "Bard":      {tiers: ["B","A","S","S"], why: "Fragile early, with light armor and a weak damage cantrip. Then Magical Secrets takes the best spells from other classes."},
    "Sorcerer":  {tiers: ["B","A","A","A"], why: "Metamagic like Twinned and Quickened Spell makes its spells hit harder, but it knows too few spells to match a wizard at the top."},
    "Paladin":   {tiers: ["A","A","A","A"], why: "Divine Smite, Aura of Protection and good spells keep it strong at every level."},
    "Warlock":   {tiers: ["A","A","B","B"], why: "Eldritch Blast and slots back on a short rest make it strong early. With so few slots it falls behind other casters later."},
    "Fighter":   {tiers: ["A","A","B","B"], why: "Action Surge and Extra Attack make it a top damage dealer early. Later it has few answers to magical problems."},
    "Barbarian": {tiers: ["A","B","C","C"], why: "Rage makes it very hard to bring down early. Past level 10 it has little to add beyond hitting hard."},
    "Artificer": {tiers: ["B","B","B","B"], why: "Infusions and a handy spell list make it useful at every level, but its spells stop at 5th level."},
    "Rogue":     {tiers: ["B","B","B","C"], why: "Sneak Attack, Expertise and Cunning Action make it reliable, but its damage falls behind at high levels."},
    "Ranger":    {tiers: ["C","B","C","C"], why: "Many of its features rarely come up (Tasha's optional features help a lot). Spells and Extra Attack make levels 5 to 10 its best."},
    "Monk":      {tiers: ["B","B","C","C"], why: "Stunning Strike makes levels 5 to 10 its best, but ki runs out quickly and its damage falls behind from level 11."},
    "Gunslinger":{tiers: ["B","B","C","C"], why: "Take Aim gives advantage every turn from level 3 and the Long Gun hits hard. It never gets a third attack, so it falls behind from level 11."}
  },
  "2024": {
    "Wizard":    {tiers: ["B","S","S","S"], why: "Fragile at first, then the largest spell list in the game takes over and decides fights."},
    "Cleric":    {tiers: ["A","S","S","S"], why: "Heavy armor, healing and Spirit Guardians from level 5. Strong at every level and the best support in the game."},
    "Druid":     {tiers: ["A","A","S","S"], why: "A superb spell list and a flexible Wild Shape. Its big spells take over from level 11."},
    "Bard":      {tiers: ["B","A","S","S"], why: "Fragile early, with light armor and few hit points. Magical Secrets at level 10 opens up every caster's spell list."},
    "Sorcerer":  {tiers: ["B","A","A","S"], why: "Innate Sorcery and Metamagic make its spells hit harder. Its short spell list holds it back until 9th-level spells and Arcane Apotheosis."},
    "Paladin":   {tiers: ["A","A","A","A"], why: "Divine Smite now costs a bonus action, but auras, good spells and Weapon Mastery keep it strong at every level."},
    "Warlock":   {tiers: ["A","A","B","B"], why: "Invocations from level 1 and Magical Cunning to get slots back. Its few slots fall behind other casters from level 11."},
    "Fighter":   {tiers: ["A","A","A","A"], why: "Weapon Mastery, Action Surge and many uses of Second Wind make it the steadiest martial class, with four attacks at level 20."},
    "Barbarian": {tiers: ["A","A","B","B"], why: "Rage still makes it very hard to bring down, and Weapon Mastery and Brutal Strike keep it useful for longer than before."},
    "Artificer": {tiers: ["B","B","B","B"], why: "Infusions and a handy spell list make it useful at every level, but its spells stop at 5th level."},
    "Rogue":     {tiers: ["B","B","B","B"], why: "Cunning Strike trades Sneak Attack dice for effects like poison or knocking a foe prone. Steady at every level."},
    "Ranger":    {tiers: ["B","B","B","C"], why: "Hunter's Mark is built in, and from level 13 damage can't break your concentration on it. A weak capstone leaves it behind at the top."},
    "Monk":      {tiers: ["B","B","B","B"], why: "Bigger Martial Arts dice, more Focus and Heightened Focus fix the 2014 monk's worst problems."},
    "Gunslinger":{tiers: ["B","B","C","C"], why: "Take Aim gives advantage every turn from level 3 and the Long Gun hits hard. It never gets a third attack, so it falls behind from level 11."}
  }
};

/* The class's letter in one band ("1-4" etc.), or "" when not rated. */
export function classTier(edition, className, bandKey){
  var e = (CLASS_TIERS[edition] || {})[className];
  var i = TIER_BANDS.findIndex(function(b){ return b.key === bandKey; });
  return e && i !== -1 ? e.tiers[i] : "";
}
