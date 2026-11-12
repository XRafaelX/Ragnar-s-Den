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
    "Druid":     {tiers: ["A","S","S","S"], why: "Wild Shape carries the early levels and the spell list is superb. At level 20 it can Wild Shape without limit."},
    "Bard":      {tiers: ["A","A","S","S"], why: "A full caster with skills and Bardic Inspiration. Magical Secrets takes the best spells from other classes."},
    "Sorcerer":  {tiers: ["B","A","A","S"], why: "Knows few spells early, but Metamagic like Twinned and Quickened Spell makes its big spells hit harder later."},
    "Paladin":   {tiers: ["A","A","A","A"], why: "Divine Smite, Aura of Protection and good spells keep it strong at every level."},
    "Warlock":   {tiers: ["A","A","B","B"], why: "Eldritch Blast and slots back on a short rest make it strong early. With so few slots it falls behind other casters later."},
    "Fighter":   {tiers: ["A","A","B","B"], why: "Action Surge and Extra Attack make it a top damage dealer early. Later it has few answers to magical problems."},
    "Barbarian": {tiers: ["A","B","C","C"], why: "Rage makes it very hard to bring down early. Past level 10 it has little to add beyond hitting hard."},
    "Artificer": {tiers: ["B","B","B","B"], why: "Infusions and a handy spell list make it useful at every level, but its spells stop at 5th level."},
    "Rogue":     {tiers: ["B","B","B","C"], why: "Sneak Attack, Expertise and Cunning Action make it reliable, but its damage falls behind at high levels."},
    "Ranger":    {tiers: ["C","B","C","C"], why: "Many of its features rarely come up (Tasha's optional features help a lot). Spells and Extra Attack make levels 5 to 10 its best."},
    "Monk":      {tiers: ["B","C","C","C"], why: "Fast and mobile early, but ki runs out quickly and its damage and defense fall behind from level 5 on."},
    "Gunslinger":{tiers: ["B","B","C","C"], why: "Take Aim gives advantage every turn from level 3 and the Long Gun hits hard. It never gets a third attack, so it falls behind from level 11."}
  },
  "2024": {
    "Wizard":    {tiers: ["B","S","S","S"], why: "Fragile at first, then the largest spell list in the game takes over and decides fights."},
    "Cleric":    {tiers: ["A","S","S","S"], why: "Heavy armor, healing and Spirit Guardians from level 5. Strong at every level and the best support in the game."},
    "Druid":     {tiers: ["A","A","S","S"], why: "A superb spell list and a flexible Wild Shape. Its big spells take over from level 11."},
    "Bard":      {tiers: ["A","A","S","S"], why: "A full caster with skills and Bardic Inspiration. Magical Secrets at level 10 opens up every caster's spell list."},
    "Sorcerer":  {tiers: ["B","A","S","S"], why: "Innate Sorcery and Metamagic make its spells hit harder, and it has more spells than the 2014 sorcerer."},
    "Paladin":   {tiers: ["A","A","A","A"], why: "Divine Smite now costs a bonus action, but auras, good spells and Weapon Mastery keep it strong at every level."},
    "Warlock":   {tiers: ["A","A","A","B"], why: "Invocations from level 1 and Magical Cunning to get slots back. Its few slots still hold it back at the top levels."},
    "Fighter":   {tiers: ["A","A","A","B"], why: "Weapon Mastery, Action Surge and many uses of Second Wind make it the steadiest martial class. Few answers to magic late on."},
    "Barbarian": {tiers: ["A","A","B","B"], why: "Rage still makes it very hard to bring down, and Weapon Mastery and Brutal Strike keep it useful for longer than before."},
    "Artificer": {tiers: ["B","B","B","B"], why: "Infusions and a handy spell list make it useful at every level, but its spells stop at 5th level."},
    "Rogue":     {tiers: ["B","B","B","B"], why: "Cunning Strike trades Sneak Attack dice for effects like poison or knocking a foe prone. Steady at every level."},
    "Ranger":    {tiers: ["B","B","C","C"], why: "Hunter's Mark is built in but needs concentration, which clashes with its other spells. Good early, behind later."},
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
