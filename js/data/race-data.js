/* ---------------- Race details ----------------
   Structured data for every race in RACES: the Compendium shows it, and
   races.js derives the one-line summaries and the creation wizard's
   language picks from it.

   asi:        fixed ability score increases, e.g. {dex:2, wis:1}.
   asiText:    for flexible increases ("+2 to one score, +1 to another").
   size:       "Medium", "Small", or "Small or Medium".
   speed:      {walk, fly?, swim?, climb?} in feet.
   darkvision: range in feet (0 = none; 120 = superior darkvision).
   armorProfs: armor proficiencies the race grants (Dwarven Armor Training).
   hpPerLevel: extra max HP per character level, added on the sheet
               (Dwarven Toughness); hpTrait names it in tooltips.
   acBonus:    added to AC on the sheet (Warforged's Integrated
               Protection); acTrait names it in the breakdown.
   unarmed:    {name, die, type}: natural weapons the race makes unarmed
               strikes with (a tabaxi's claws: 1d4 slashing + STR), for
               the Inventory tab's unarmed strike (checked against the
               published pages 2026-10-15).
   languages:  {fixed:[…], choose:n}.
   traits:     [{name, text, profs?}] short paraphrases of each trait.
               `profs` is what the trait gives, in the shape class
               features use (js/core/class-picks.js): skills, weapons and
               tools given outright, and `pick` slots for the choices
               (a dwarf's tool, a kenku's two skills). The sheet applies
               them; the creation wizard's Race Traits step and the
               Features tab's Feature choices card ask for the picks.
   source:     where it's from. Expanded races use their original
               (2014-era) versions, matching the rest of the app.
   A trait's resist / immune / conditionImmune (set with wards()) are the
   damage types and conditions it protects against, shown under the HP
   (checked against the books' wording on 5etools' data 2026-10-22). */

/* advantage (optional): what the trait gives advantage on, in the
   TRAIT_ADVANTAGES shape (one or a list), for a trait whose name another
   race uses for something else; false: none, whatever its name. */
function tr(name, text, profs, advantage){
  var t = {name:name, text:text};
  if(profs) t.profs = profs;
  if(advantage!==undefined) t.advantage = advantage;
  return t;
}
/* A trait that gives damage resistances or immunities:
   {resist:[types], immune:[types], conditionImmune:[condition ids]}. */
function wards(t, w){ return Object.assign(t, w); }
var POISON_IMMUNITY = {immune:["poison"], conditionImmune:["poisoned"]};
/* A trait's innate spells, on the Spells tab with their free casts on
   Vitals (raceSpells in js/core/spell-grants.js; checked against the
   books' wording on 5etools' data 2026-10-22):
     ability     "int"..."cha"; "pick" for the trait's spellAbility
                 choice (ABILITY_PICK); "" for none (a siren's Friends)
     list        names, or {name, from (character level), use, at, note}:
                 use "known" (a cantrip, the default for one), "long" or
                 "short" (once per that rest, the default for a spell)
                 or "atwill"; `at` casts it as a higher-level spell
     slots       the spells can also be cast with spell slots
     components  "no material" or "none" when cast with the trait
   A cantrip the player picks (a High Elf's) is the trait's spell pick,
   cast with the slot's `ability` or the trait's. */
function innate(t, ability, list, more){ t.spells = Object.assign({ability:ability, list:list}, more || {}); return t; }
var ABILITY_PICK = {kind:"choice", id:"spellAbility", noun:"spellcasting ability", label:"Choose the ability you cast these spells with",
  options:["Intelligence","Wisdom","Charisma"]};
var DROW_SPELLS = {ability:"cha", list:["Dancing Lights", {name:"Faerie Fire", from:3}, {name:"Darkness", from:5}]};
var DROW_TEXT = "You know the Dancing Lights cantrip. From 3rd level you can cast Faerie Fire, and from 5th level Darkness, once each without a spell slot; each comes back after a long rest. Charisma is your spellcasting ability for them.";
var INFERNAL_SPELLS = {ability:"cha", list:["Thaumaturgy", {name:"Hellish Rebuke", from:3, at:2}, {name:"Darkness", from:5}]};
var INFERNAL_TEXT = "You know the Thaumaturgy cantrip. From 3rd level you can cast Hellish Rebuke as a 2nd-level spell, and from 5th level Darkness, once each without a spell slot; each comes back after a long rest. Charisma is your spellcasting ability for them.";
var HELLISH_RESISTANCE = wards(tr("Hellish Resistance", "Resistance to fire damage."), {resist:["fire"]});
var ELF_BASE = [
  tr("Keen Senses", "Proficiency in the Perception skill.", {skills:["Perception"]}),
  tr("Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."),
  tr("Trance", "You meditate for 4 hours instead of sleeping 8 to get the benefit of a long rest.")
];
var DWARF_COMBAT = tr("Dwarven Combat Training", "Proficiency with battleaxes, handaxes, light hammers and warhammers.",
  {weapons:["Battleaxe","Handaxe","Light Hammer","Warhammer"]});
var DWARF_TOOL = tr("Tool Proficiency", "Proficiency with smith's tools, brewer's supplies or mason's tools (your choice).",
  {pick:[{kind:"tool", options:["Smith's tools","Brewer's supplies","Mason's tools"]}]});
var DWARF_BASE = [
  wards(tr("Dwarven Resilience", "Advantage on saves against poison, and resistance to poison damage."), {resist:["poison"]}),
  DWARF_COMBAT,
  DWARF_TOOL,
  tr("Stonecunning", "Double proficiency on History checks about the origin of stonework."),
  tr("Unslowed", "Heavy armor doesn't reduce your speed.")
];
var HALFLING_BASE = [
  tr("Lucky", "When you roll a 1 on an attack roll, ability check or saving throw, reroll the die and use the new roll."),
  tr("Brave", "Advantage on saves against being frightened."),
  tr("Halfling Nimbleness", "You can move through the space of any creature larger than you.")
];
var GNOME_CUNNING = tr("Gnome Cunning", "Advantage on Intelligence, Wisdom and Charisma saves against magic.");
var POWERFUL_BUILD = tr("Powerful Build", "You count as one size larger for carrying capacity and what you can push, drag or lift.");
// Van Richten's lineages, taken at character creation: two skills.
var LINEAGE_SKILLS = tr("Ancestral Legacy", "Proficiency in two skills of your choice.", {pick:[{kind:"skill", count:2}]});
var ARTISAN_TOOL_NAMES = ["Alchemist's supplies","Brewer's supplies","Calligrapher's supplies","Carpenter's tools","Cartographer's tools","Cobbler's tools","Cook's utensils","Glassblower's tools","Jeweler's tools","Leatherworker's tools","Mason's tools","Painter's supplies","Potter's tools","Smith's tools","Tinker's tools","Weaver's tools","Woodcarver's tools"];
/* A dragonmark's traits: its intuition (a d4 on two kinds of checks), its
   spells, and its Spells of the Mark (added to a spellcaster's class list). */
function markTraits(intuition, checks, magic, spells){
  return [tr(intuition, "Roll a d4 and add it to " + checks + "."), magic,
    tr("Spells of the Mark", "If you have Spellcasting or Pact Magic, these are added to your class's spell list: " + spells + ".")];
}
/* Mark of Finding replaces the human's or half-orc's traits (but size and speed). */
function markOfFinding(){
  return {asi:{wis:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Eberron: Rising from the Last War",
    traits:markTraits("Hunter's Intuition", "Perception and Survival checks",
      innate(tr("Finder's Magic", "You can cast Hunter's Mark, and from 3rd level Locate Object, once each without a spell slot; each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Hunter's Mark", {name:"Locate Object", from:3}]),
      "Faerie Fire, Longstrider (1st); Locate Animals or Plants, Locate Object (2nd); Clairvoyance, Speak with Plants (3rd); Divination, Locate Creature (4th); Commune with Nature (5th)")};
}
/* Mordenkainen's tiefling bloodlines: the tiefling's +2 Charisma, the
   bloodline's +1, and its legacy in place of Infernal Legacy. */
function tieflingBloodline(plusOne, legacy, cantrip, third, fifth, rests){
  var cast = function(x){ return x.name + (x.at ? " as a " + {2:"2nd", 3:"3rd"}[x.at] + "-level spell" : ""); };
  return {asi:Object.assign({cha:2}, plusOne), size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Mordenkainen's Tome of Foes",
    traits:[HELLISH_RESISTANCE,
      innate(tr(legacy, "You know the " + cantrip + " cantrip. From 3rd level you can cast " + cast(third) + ", and from 5th level " + cast(fifth) +
        ", once each without a spell slot; " + (rests || "each comes back after a long rest") + ". Charisma is your spellcasting ability for them."),
        "cha", [cantrip, Object.assign({from:3}, third), Object.assign({from:5}, fifth)])]};
}
var AVEN_FLIGHT = tr("Flight", "A flying speed of 30 feet, but not while wearing medium or heavy armor.");
var VAMPIRE_BLOODTHIRST = tr("Bloodthirst", "Bite a willing, grappled, incapacitated or restrained creature with a melee attack: 1 piercing and 1d6 necrotic damage. Its hit point maximum drops by the necrotic damage until a long rest, and you regain that many hit points.");
/* Plane Shift's merfolk: +1 Charisma, swimming, amphibious, plus the
   subrace's (Ixalan) or creed's (Zendikar) scores and traits. */
function merfolk(source, plus, traits){
  return {asi:Object.assign({cha:1}, plus, plus.cha ? {cha:1 + plus.cha} : {}), size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Merfolk"], choose:1}, source:source,
    traits:[tr("Amphibious", "You can breathe air and water.")].concat(traits)};
}
var SUNLIGHT = tr("Sunlight Sensitivity", "Disadvantage on attack rolls and sight-based Perception checks when you or your target are in direct sunlight.");
/* A dragonborn's Draconic Ancestry table: the dragon sets the breath
   weapon's damage type, area and save, and the resistance (checked
   against the SRD 5.1 / Player's Handbook table 2026-10-16). */
export var DRACONIC_ANCESTRIES = {
  "Black dragon":  {damage:"Acid",      area:"5 by 30 ft line", save:"DEX"},
  "Blue dragon":   {damage:"Lightning", area:"5 by 30 ft line", save:"DEX"},
  "Brass dragon":  {damage:"Fire",      area:"5 by 30 ft line", save:"DEX"},
  "Bronze dragon": {damage:"Lightning", area:"5 by 30 ft line", save:"DEX"},
  "Copper dragon": {damage:"Acid",      area:"5 by 30 ft line", save:"DEX"},
  "Gold dragon":   {damage:"Fire",      area:"15 ft cone",      save:"DEX"},
  "Green dragon":  {damage:"Poison",    area:"15 ft cone",      save:"CON"},
  "Red dragon":    {damage:"Fire",      area:"15 ft cone",      save:"DEX"},
  "Silver dragon": {damage:"Cold",      area:"15 ft cone",      save:"CON"},
  "White dragon":  {damage:"Cold",      area:"15 ft cone",      save:"CON"}
};
/* Fizban's ancestries only set the damage type; the race sets the area. */
function fizbanAncestries(types){
  var out = {};
  Object.keys(types).forEach(function(d){ out[d + " dragon"] = {damage:types[d]}; });
  return out;
}
/* Every kind of dragonborn's breath weapon, by race (checked against the
   Player's Handbook, Fizban's Treasury of Dragons and Explorer's Guide to
   Wildemount texts 2026-10-16). The save DC is always 8 + CON modifier +
   proficiency bonus.
   trait:      the ancestry trait the dragon is picked on.
   ancestries: {dragon: {damage, area?, save?}}; area and save fall back
               to the race's own.
   die, steps: the damage die and [character level, dice] steps.
   uses:       "once" (once per short or long rest) or "pb" (your
               proficiency bonus times per long rest).
   attack:     true when it replaces one attack of the Attack action
               rather than taking your action.
   resistance: true when the ancestry also gives resistance (Wildemount's
               Draconblood and Ravenite trade it away).
   metallic:   Metallic Breath Weapon, a second breath from level 5. */
var PHB_BREATH = {trait:"Draconic Ancestry", ancestries:DRACONIC_ANCESTRIES, die:6,
  steps:[[1, 2], [6, 3], [11, 4], [16, 5]], uses:"once", attack:false, resistance:true};
var FIZBAN_BREATH = {die:10, steps:[[1, 1], [5, 2], [11, 3], [17, 4]], uses:"pb", attack:true, resistance:true, save:"DEX"};
export var DRAGONBORN_BREATH = {
  "Dragonborn": PHB_BREATH,
  "Dragonborn (Draconblood)": Object.assign({}, PHB_BREATH, {resistance:false}),
  "Dragonborn (Ravenite)": Object.assign({}, PHB_BREATH, {resistance:false}),
  "Dragonborn (Chromatic)": Object.assign({}, FIZBAN_BREATH, {trait:"Chromatic Ancestry", area:"5 by 30 ft line",
    ancestries:fizbanAncestries({Black:"Acid", Blue:"Lightning", Green:"Poison", Red:"Fire", White:"Cold"})}),
  "Dragonborn (Metallic)": Object.assign({}, FIZBAN_BREATH, {trait:"Metallic Ancestry", area:"15 ft cone", metallic:true,
    ancestries:fizbanAncestries({Brass:"Fire", Bronze:"Lightning", Copper:"Acid", Gold:"Fire", Silver:"Cold"})}),
  "Dragonborn (Gem)": Object.assign({}, FIZBAN_BREATH, {trait:"Gem Ancestry", area:"15 ft cone",
    ancestries:fizbanAncestries({Amethyst:"Force", Crystal:"Radiant", Emerald:"Psychic", Sapphire:"Thunder", Topaz:"Necrotic"})})
};
/* The ancestry trait's pick, each dragon with what it gives. */
function ancestryPick(race){
  var kind = DRAGONBORN_BREATH[race], details = {};
  Object.keys(kind.ancestries).forEach(function(n){
    var a = kind.ancestries[n], type = a.damage.toLowerCase();
    details[n] = a.damage + ": " + (a.area || kind.area) + " breath, " + (a.save || kind.save) + " save" +
      (kind.resistance ? ", and resistance to " + type + " damage" : "");
  });
  return {pick:[{kind:"choice", id:"draconicAncestry", noun:"dragon ancestor", label:"Choose your dragon ancestor",
    options:Object.keys(kind.ancestries), details:details}]};
}
/* The Player's Handbook breath weapon, shared with Wildemount's variants. */
var PHB_BREATH_TRAIT = tr("Breath Weapon", "Action: exhale your ancestry's damage type in its line or cone. Creatures in it make a save (DC 8 + CON + proficiency bonus), taking 2d6 on a fail (3d6 at level 6, 4d6 at 11, 5d6 at 16) or half on a success. Once per short or long rest.");
function fizbanBreathTrait(area){
  return tr("Breath Weapon", "When you take the Attack action, replace one attack with a " + area + " of your ancestry's damage type. Creatures in it make a DEX save (DC 8 + CON + proficiency bonus), taking 1d10 on a fail (2d10 at level 5, 3d10 at 11, 4d10 at 17) or half on a success. Uses equal to your proficiency bonus, all back after a long rest.");
}
var FIZBAN_RESISTANCE = tr("Draconic Resistance", "Resistance to your ancestry's damage type.");

export var RACE_DATA = {
  /* ---- Standard (SRD / Player's Handbook) ---- */
  "Human": {asi:{str:1,dex:1,con:1,int:1,wis:1,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Player's Handbook",
    traits:[tr("Versatile", "No special traits, but +1 to every ability score makes humans good at anything.")]},
  "Variant Human": {asiText:"+1 to two different ability scores of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Player's Handbook",
    traits:[tr("Skills", "Proficiency in one skill of your choice.", {pick:[{kind:"skill"}]}), tr("Feat", "You gain one feat of your choice at level 1.")]},
  "Hill Dwarf": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:25}, darkvision:60, hpPerLevel:1, hpTrait:"Dwarven Toughness",
    languages:{fixed:["Common","Dwarvish"]}, source:"Player's Handbook",
    traits:DWARF_BASE.concat([tr("Dwarven Toughness", "Your hit point maximum increases by 1, and by 1 more every time you gain a level.")])},
  "Mountain Dwarf": {asi:{str:2,con:2}, size:"Medium", speed:{walk:25}, darkvision:60, armorProfs:["Light armor","Medium armor"],
    languages:{fixed:["Common","Dwarvish"]}, source:"Player's Handbook",
    traits:DWARF_BASE.concat([tr("Dwarven Armor Training", "Proficiency with light and medium armor.")])},
  "High Elf": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Elf Weapon Training", "Proficiency with longswords, shortswords, shortbows and longbows.", {weapons:["Longsword","Shortsword","Shortbow","Longbow"]}),
      innate(tr("Cantrip", "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.",
        {pick:[{kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip"}]}), "int", [])])},
  "Wood Elf": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:35}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Elf Weapon Training", "Proficiency with longswords, shortswords, shortbows and longbows.", {weapons:["Longsword","Shortsword","Shortbow","Longbow"]}),
      tr("Fleet of Foot", "Your base walking speed is 35 feet."),
      tr("Mask of the Wild", "You can try to hide when only lightly obscured by foliage, rain, snow, mist or similar.")])},
  "Dark Elf (Drow)": {asi:{dex:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:120,
    languages:{fixed:["Common","Elvish"]}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Superior Darkvision", "Darkvision out to 120 feet."), SUNLIGHT,
      innate(tr("Drow Magic", DROW_TEXT), DROW_SPELLS.ability, DROW_SPELLS.list),
      tr("Drow Weapon Training", "Proficiency with rapiers, shortswords and hand crossbows.", {weapons:["Rapier","Shortsword","Hand Crossbow"]})])},
  "Lightfoot Halfling": {asi:{dex:2,cha:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Player's Handbook",
    traits:HALFLING_BASE.concat([tr("Naturally Stealthy", "You can try to hide even when only obscured by a creature at least one size larger than you.")])},
  "Stout Halfling": {asi:{dex:2,con:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Player's Handbook",
    traits:HALFLING_BASE.concat([wards(tr("Stout Resilience", "Advantage on saves against poison, and resistance to poison damage."), {resist:["poison"]})])},
  "Dragonborn": {asi:{str:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Draconic"]}, source:"Player's Handbook",
    traits:[
      tr("Draconic Ancestry", "Choose a dragon type; it sets your breath weapon and resistance damage type.", ancestryPick("Dragonborn")),
      PHB_BREATH_TRAIT,
      tr("Damage Resistance", "Resistance to the damage type of your draconic ancestry.")]},
  "Rock Gnome": {asi:{int:2,con:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Player's Handbook",
    traits:[GNOME_CUNNING,
      tr("Artificer's Lore", "Double proficiency on History checks about magic items, alchemical objects or technology."),
      tr("Tinker", "Proficiency with tinker's tools; build tiny clockwork devices like a toy, fire starter or music box.", {tools:["Tinker's tools"]})]},
  "Forest Gnome": {asi:{int:2,dex:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Player's Handbook",
    traits:[GNOME_CUNNING,
      innate(tr("Natural Illusionist", "You know the Minor Illusion cantrip. Intelligence is your spellcasting ability for it."), "int", ["Minor Illusion"]),
      tr("Speak with Small Beasts", "You can communicate simple ideas with Small or smaller beasts.")]},
  "Half-Elf": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to two other scores of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Player's Handbook",
    traits:[tr("Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."),
      tr("Skill Versatility", "Proficiency in two skills of your choice.", {pick:[{kind:"skill", count:2}]})]},
  // Sword Coast's variant: one heritage trait in place of Skill Versatility.
  "Half-Elf (Variant)": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to two other scores of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Sword Coast Adventurer's Guide",
    choiceEffects:{halfElfVersatility:{
      "Elf Weapon Training":{weapons:["Longsword","Shortsword","Shortbow","Longbow"]},
      "Fleet of Foot":{walk:35},
      "Swim Speed":{swim:30},
      "Cantrip":{spells:{ability:"int", list:[]}},
      "Drow Magic":{spells:DROW_SPELLS}}},
    traits:[tr("Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."),
      tr("Half-Elf Versatility", "Choose one trait: two skills, elf weapon training, a wizard cantrip, Fleet of Foot, Mask of the Wild, Drow Magic or a swimming speed.",
        {pick:[{kind:"choice", id:"halfElfVersatility", noun:"trait", label:"Choose your half-elf trait",
          options:["Skill Versatility","Elf Weapon Training","Cantrip","Fleet of Foot","Mask of the Wild","Drow Magic","Swim Speed"], details:{
            "Skill Versatility":"Proficiency in two skills of your choice.",
            "Elf Weapon Training":"Proficiency with longswords, shortswords, shortbows and longbows (high or wood elf heritage).",
            "Cantrip":"You know one cantrip of your choice from the wizard spell list; Intelligence is your spellcasting ability for it (high elf heritage).",
            "Fleet of Foot":"Your base walking speed is 35 feet (wood elf heritage).",
            "Mask of the Wild":"You can try to hide when only lightly obscured by foliage, rain, snow, mist or similar (wood elf heritage).",
            "Drow Magic":DROW_TEXT.replace(/\.$/, " (dark elf heritage)."),
            "Swim Speed":"A swimming speed of 30 feet (aquatic elf heritage)."}},
          {kind:"skill", count:2, byChoice:{slot:0, options:{"Skill Versatility":["Acrobatics","Animal Handling","Arcana","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"]}}},
          {kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip", byChoice:{slot:0, when:"Cantrip"}}]})]},
  "Half-Orc": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Orc"]}, source:"Player's Handbook",
    traits:[tr("Menacing", "Proficiency in the Intimidation skill.", {skills:["Intimidation"]}),
      tr("Relentless Endurance", "When reduced to 0 HP but not killed outright, drop to 1 HP instead. Once per long rest."),
      tr("Savage Attacks", "On a melee weapon critical hit, roll one of the weapon's damage dice one more time and add it.")]},
  "Tiefling": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Player's Handbook",
    traits:[HELLISH_RESISTANCE,
      innate(tr("Infernal Legacy", INFERNAL_TEXT), INFERNAL_SPELLS.ability, INFERNAL_SPELLS.list)]},

  /* ---- Expanded ---- */
  "Aarakocra": {asi:{dex:2,wis:1}, unarmed:{name:"Talons", die:4, type:"Slashing"}, size:"Medium", speed:{walk:25, fly:50}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Aarakocra","Auran"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Flight", "Flying speed of 50 feet, but not while wearing medium or heavy armor."),
      tr("Talons", "Your unarmed strikes deal 1d4 slashing damage.")]},
  "Aasimar": {asi:{cha:2}, asiText:"+2 Charisma, plus +1 from your subrace (Protector: WIS, Scourge: CON, Fallen: STR)", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Celestial"]}, source:"Volo's Guide to Monsters",
    traits:[wards(tr("Celestial Resistance", "Resistance to necrotic and radiant damage."), {resist:["necrotic","radiant"]}),
      tr("Healing Hands", "Action: touch a creature to restore hit points equal to your level. Once per long rest."),
      innate(tr("Light Bearer", "You know the Light cantrip. Charisma is your spellcasting ability for it."), "cha", ["Light"]),
      tr("Celestial Revelation", "From level 3, transform once per long rest for 1 minute (radiant wings, radiant aura or necrotic shroud, by subrace).")]},
  "Bugbear": {asi:{str:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Long-Limbed", "Your melee attacks on your turn have 5 feet more reach."), POWERFUL_BUILD,
      tr("Sneaky", "Proficiency in the Stealth skill.", {skills:["Stealth"]}),
      tr("Surprise Attack", "In the first round of combat, deal an extra 2d6 damage to a surprised creature you hit.")]},
  "Centaur": {asi:{str:2,wis:1}, unarmed:{name:"Hooves", die:4, type:"Bludgeoning"}, size:"Medium", speed:{walk:40}, darkvision:0,
    languages:{fixed:["Common","Sylvan"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Fey", "Your creature type is fey rather than humanoid."),
      tr("Charge", "After moving 30 feet straight toward a target and hitting it with a melee weapon, make a hooves attack as a bonus action."),
      tr("Hooves", "Unarmed strikes with your hooves deal 1d4 + STR bludgeoning damage."),
      tr("Equine Build", "You count as Large for carrying capacity; climbing costs 4 extra feet per foot."),
      tr("Survivor", "Proficiency in one of Animal Handling, Medicine, Nature or Survival.",
        {pick:[{kind:"skill", options:["Animal Handling","Medicine","Nature","Survival"]}]})]},
  "Changeling": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:2}, source:"Eberron: Rising from the Last War",
    traits:[tr("Shapechanger", "Action: change your appearance and voice (not your equipment or size category) until you change back."),
      tr("Changeling Instincts", "Proficiency in two of Deception, Insight, Intimidation and Persuasion.",
        {pick:[{kind:"skill", count:2, options:["Deception","Insight","Intimidation","Persuasion"]}]})]},
  "Deep Gnome (Svirfneblin)": {asi:{int:2,dex:1}, size:"Small", speed:{walk:25}, darkvision:120,
    languages:{fixed:["Common","Gnomish","Undercommon"]}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Superior Darkvision", "Darkvision out to 120 feet."), GNOME_CUNNING,
      tr("Stone Camouflage", "Advantage on Stealth checks to hide in rocky terrain.")]},
  "Dragonborn (Chromatic)": {asiText:"+2 to one score and +1 to another (your choice)", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Fizban's Treasury of Dragons",
    traits:[tr("Chromatic Ancestry", "Choose a chromatic dragon; it sets the damage type of your other traits.", ancestryPick("Dragonborn (Chromatic)")),
      fizbanBreathTrait("5 by 30 ft line"), FIZBAN_RESISTANCE,
      tr("Chromatic Warding", "From level 5, action: become immune to your ancestry's damage type for 1 minute. Once per long rest.")]},
  "Dragonborn (Draconblood)": {asi:{int:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Draconic"]}, source:"Explorer's Guide to Wildemount",
    traits:[tr("Draconic Ancestry", "Choose a dragon type; it sets your breath weapon's damage type, area and save.", ancestryPick("Dragonborn (Draconblood)")),
      PHB_BREATH_TRAIT,
      tr("Forceful Presence", "Make a Charisma (Intimidation or Persuasion) check with advantage. Once per short or long rest.")]},
  "Dragonborn (Gem)": {asiText:"+2 to one score and +1 to another (your choice)", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Fizban's Treasury of Dragons",
    traits:[tr("Gem Ancestry", "Choose a gem dragon; it sets the damage type of your other traits.", ancestryPick("Dragonborn (Gem)")),
      fizbanBreathTrait("15 ft cone"), FIZBAN_RESISTANCE,
      tr("Psionic Mind", "Send telepathic messages to a creature you can see within 30 feet. It needs no shared language, but must understand at least one."),
      tr("Gem Flight", "From level 5, bonus action: spectral wings for 1 minute give a flying speed equal to your walking speed, and you can hover. Once per long rest.")]},
  "Dragonborn (Metallic)": {asiText:"+2 to one score and +1 to another (your choice)", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Fizban's Treasury of Dragons",
    traits:[tr("Metallic Ancestry", "Choose a metallic dragon; it sets the damage type of your other traits.", ancestryPick("Dragonborn (Metallic)")),
      fizbanBreathTrait("15 ft cone"), FIZBAN_RESISTANCE,
      tr("Metallic Breath Weapon", "From level 5, replace one attack with a second breath in a 15 ft cone (DC 8 + CON + proficiency bonus): Enervating Breath (CON save or incapacitated until the start of your next turn) or Repulsion Breath (STR save or pushed 20 feet away and knocked prone). Once per long rest.")]},
  "Dragonborn (Ravenite)": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Draconic"]}, source:"Explorer's Guide to Wildemount",
    traits:[tr("Draconic Ancestry", "Choose a dragon type; it sets your breath weapon's damage type, area and save.", ancestryPick("Dragonborn (Ravenite)")),
      PHB_BREATH_TRAIT,
      tr("Vengeful Assault", "Reaction when a creature within range of a weapon you're wielding damages you: make one attack with that weapon against it. Once per short or long rest.")]},
  "Duergar": {asi:{con:2,str:1}, size:"Medium", speed:{walk:25}, darkvision:120,
    languages:{fixed:["Common","Dwarvish","Undercommon"]}, source:"Mordenkainen's Tome of Foes",
    // A dwarf subrace: the dwarf's own traits, then the duergar's.
    traits:[tr("Superior Darkvision", "Darkvision out to 120 feet.")].concat(DWARF_BASE, [
      tr("Duergar Resilience", "Advantage on saves against illusions and against being charmed or paralyzed."),
      tr("Duergar Magic", "From level 3, cast Enlarge/Reduce (enlarge only) on yourself, and from level 5 Invisibility on yourself, each once per long rest."),
      SUNLIGHT])},
  "Eladrin": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([tr("Fey Step", "Bonus action: teleport up to 30 feet to a space you can see. Once per short or long rest; your season adds an extra effect.")])},
  "Fairy": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small", speed:{walk:30, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"The Wild Beyond the Witchlight",
    traits:[tr("Fey", "Your creature type is fey rather than humanoid."),
      innate(tr("Fairy Magic", "You know the Druidcraft cantrip. From 3rd level you can cast Faerie Fire, and from 5th level Enlarge/Reduce, once each without a spell slot; each comes back after a long rest, and you can also cast them with any spell slots you have. Intelligence, Wisdom or Charisma (your choice) is your spellcasting ability for them.",
        {pick:[ABILITY_PICK]}), "pick", ["Druidcraft", {name:"Faerie Fire", from:3}, {name:"Enlarge/Reduce", from:5}], {slots:true}),
      tr("Flight", "Flying speed equal to your walking speed, but not while wearing medium or heavy armor.")]},
  "Firbolg": {asi:{wis:2,str:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Elvish","Giant"]}, source:"Volo's Guide to Monsters",
    traits:[innate(tr("Firbolg Magic", "You can cast Detect Magic and Disguise Self once each without a spell slot; each comes back after a short or long rest. Your Disguise Self can make you seem up to 3 feet shorter, to blend in with humans and elves. Wisdom is your spellcasting ability for them."),
        "wis", [{name:"Detect Magic", use:"short"}, {name:"Disguise Self", use:"short", note:"You can seem up to 3 feet shorter."}]),
      tr("Hidden Step", "Bonus action: turn invisible until the start of your next turn or until you attack. Once per short or long rest."),
      POWERFUL_BUILD,
      tr("Speech of Beast and Leaf", "Beasts and plants understand the meaning of your words, and you have advantage on Charisma checks to influence them.")]},
  "Genasi (Air)": {asi:{con:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Unending Breath", "You can hold your breath indefinitely while not incapacitated."),
      innate(tr("Mingle with the Wind", "You can cast Levitate once without a spell slot or material components; it comes back after a long rest. Constitution is your spellcasting ability for it."), "con", ["Levitate"], {components:"no material"})]},
  "Genasi (Earth)": {asi:{con:2,str:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Earth Walk", "Difficult terrain made of earth or stone doesn't slow you."),
      innate(tr("Merge with Stone", "You can cast Pass without Trace once without a spell slot or material components; it comes back after a long rest. Constitution is your spellcasting ability for it."), "con", ["Pass without Trace"], {components:"no material"})]},
  "Genasi (Fire)": {asi:{con:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[wards(tr("Fire Resistance", "Resistance to fire damage."), {resist:["fire"]}),
      innate(tr("Reach to the Blaze", "You know the Produce Flame cantrip. From 3rd level you can cast Burning Hands once as a 1st-level spell without a spell slot; it comes back after a long rest. Constitution is your spellcasting ability for them."), "con", ["Produce Flame", {name:"Burning Hands", from:3}])]},
  "Genasi (Water)": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[wards(tr("Acid Resistance", "Resistance to acid damage."), {resist:["acid"]}),
      tr("Amphibious", "You can breathe air and water."),
      innate(tr("Call to the Wave", "You know the Shape Water cantrip. From 3rd level you can cast Create or Destroy Water once as a 2nd-level spell without a spell slot; it comes back after a long rest. Constitution is your spellcasting ability for them."), "con", ["Shape Water", {name:"Create or Destroy Water", from:3, at:2}])]},
  "Gith (Githyanki)": {asi:{str:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:0, armorProfs:["Light armor","Medium armor"],
    languages:{fixed:["Common","Gith"], choose:1}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Decadent Mastery", "Proficiency in one skill or tool of your choice (plus one extra language).", {pick:[{kind:"skillOrTool"}]}),
      tr("Martial Prodigy", "Proficiency with light and medium armor, shortswords, longswords and greatswords.", {weapons:["Shortsword","Longsword","Greatsword"]}),
      innate(tr("Githyanki Psionics", "You know the Mage Hand cantrip, and the hand is invisible when you cast it this way. From 3rd level you can cast Jump, and from 5th level Misty Step, once each without a spell slot; each comes back after a long rest. Intelligence is your spellcasting ability for them, and they need no components when cast with this trait."),
        "int", [{name:"Mage Hand", note:"The hand is invisible."}, {name:"Jump", from:3}, {name:"Misty Step", from:5}], {components:"none"})]},
  "Gith (Githzerai)": {asi:{wis:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Gith"]}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Mental Discipline", "Advantage on saves against being charmed or frightened."),
      innate(tr("Githzerai Psionics", "You know the Mage Hand cantrip, and the hand is invisible when you cast it this way. From 3rd level you can cast Shield, and from 5th level Detect Thoughts, once each without a spell slot; each comes back after a long rest. Wisdom is your spellcasting ability for them, and they need no components when cast with this trait."),
        "wis", [{name:"Mage Hand", note:"The hand is invisible."}, {name:"Shield", from:3}, {name:"Detect Thoughts", from:5}], {components:"none"})]},
  "Goblin": {asi:{dex:2,con:1}, size:"Small", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Fury of the Small", "Once per short or long rest, deal extra damage equal to your level to a creature larger than you."),
      tr("Nimble Escape", "Disengage or Hide as a bonus action on each of your turns.")]},
  "Goliath": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Giant"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Natural Athlete", "Proficiency in the Athletics skill.", {skills:["Athletics"]}),
      tr("Stone's Endurance", "Reaction when you take damage: reduce it by 1d12 + CON. Once per short or long rest."),
      POWERFUL_BUILD,
      wards(tr("Mountain Born", "Resistance to cold damage, and you're used to high altitude."), {resist:["cold"]})]},
  "Harengon": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"The Wild Beyond the Witchlight",
    traits:[tr("Hare-Trigger", "Add your proficiency bonus to initiative rolls."),
      tr("Leporine Senses", "Proficiency in the Perception skill.", {skills:["Perception"]}),
      tr("Lucky Footwork", "Reaction when you fail a DEX save: add 1d4 to the roll."),
      tr("Rabbit Hop", "Bonus action: jump 5 × your proficiency bonus in feet without provoking opportunity attacks. Uses equal to your proficiency bonus per long rest.")]},
  "Hobgoblin": {asi:{con:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60, armorProfs:["Light armor"],
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Martial Training", "Proficiency with two martial weapons of your choice and with light armor.", {pick:[{kind:"weapon", count:2, filter:"martial"}]}),
      tr("Saving Face", "When you miss an attack or fail a check or save, gain a bonus equal to the number of allies you can see (max +5). Once per short or long rest.")]},
  "Kenku": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Auran"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Expert Forgery", "Advantage on checks to copy writing and craftwork you've seen."),
      tr("Kenku Training", "Proficiency in two of Acrobatics, Deception, Stealth and Sleight of Hand.",
        {pick:[{kind:"skill", count:2, options:["Acrobatics","Deception","Stealth","Sleight of Hand"]}]}),
      tr("Mimicry", "You can mimic sounds and voices you've heard; you can only speak using mimicry.")]},
  "Kobold": {asi:{dex:2,str:-2}, size:"Small", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Grovel, Cower and Beg", "Action: cower pathetically so allies have advantage on attacks against enemies within 10 feet of you. Once per short or long rest."),
      tr("Pack Tactics", "Advantage on attacks against a creature if an ally is within 5 feet of it."),
      SUNLIGHT]},
  "Lizardfolk": {asi:{con:2,wis:1}, unarmed:{name:"Bite", die:6, type:"Piercing"}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0, unarmoredAc:{base:13, ability:"dex", trait:"Natural Armor"},
    languages:{fixed:["Common","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Bite", "Your bite is a natural weapon dealing 1d6 + STR piercing damage."),
      tr("Cunning Artisan", "During a short rest, craft a shield, club, javelin or darts from a slain creature's bones and hide."),
      tr("Hold Breath", "You can hold your breath for 15 minutes."),
      tr("Hunter's Lore", "Proficiency in two of Animal Handling, Nature, Perception, Stealth and Survival.",
        {pick:[{kind:"skill", count:2, options:["Animal Handling","Nature","Perception","Stealth","Survival"]}]}),
      tr("Natural Armor", "Without armor, your AC is 13 + DEX. A shield still adds."),
      tr("Hungry Jaws", "Bonus action: bite a creature and gain temporary HP equal to your CON modifier on a hit. Once per short or long rest.")]},
  "Loxodon": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0, unarmoredAc:{base:12, ability:"con", trait:"Natural Armor"},
    languages:{fixed:["Common","Loxodon"]}, source:"Guildmasters' Guide to Ravnica",
    traits:[POWERFUL_BUILD,
      tr("Loxodon Serenity", "Advantage on saves against being charmed or frightened."),
      tr("Natural Armor", "Without armor, your AC is 12 + CON. A shield still adds."),
      tr("Trunk", "A prehensile trunk that can grab, lift and manipulate simple objects, and use as a snorkel."),
      tr("Keen Smell", "Advantage on Perception, Survival and Investigation checks that rely on smell.")]},
  "Minotaur": {asi:{str:2,con:1}, unarmed:{name:"Horns", die:6, type:"Piercing"}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Minotaur"]}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Horns", "Your horns are a natural weapon dealing 1d6 + STR piercing damage."),
      tr("Goring Rush", "After Dashing and moving 20 feet, make a horns attack as a bonus action."),
      tr("Hammering Horns", "After hitting with a melee attack, shove the target with your horns as a bonus action."),
      tr("Imposing Presence", "Proficiency in Intimidation or Persuasion (your choice).", {pick:[{kind:"skill", options:["Intimidation","Persuasion"]}]})]},
  "Orc": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Orc"]}, source:"Eberron: Rising from the Last War",
    traits:[tr("Aggressive", "Bonus action: move up to your speed toward an enemy you can see."),
      tr("Primal Intuition", "Proficiency in two of Animal Handling, Insight, Intimidation, Medicine, Nature, Perception and Survival.",
        {pick:[{kind:"skill", count:2, options:["Animal Handling","Insight","Intimidation","Medicine","Nature","Perception","Survival"]}]}),
      POWERFUL_BUILD]},
  "Satyr": {asi:{cha:2,dex:1}, unarmed:{name:"Ram", die:4, type:"Bludgeoning"}, size:"Medium", speed:{walk:35}, darkvision:0,
    languages:{fixed:["Common","Sylvan"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Fey", "Your creature type is fey rather than humanoid."),
      tr("Ram", "Headbutts deal 1d4 + STR bludgeoning damage."),
      tr("Magic Resistance", "Advantage on saving throws against spells."),
      tr("Mirthful Leaps", "When you make a long or high jump, roll a d8 and add that many feet."),
      tr("Reveler", "Proficiency in Performance and Persuasion, and with one musical instrument.",
        {skills:["Performance","Persuasion"], pick:[{kind:"tool", group:"Musical instruments"}]})]},
  "Sea Elf": {asi:{dex:2,con:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:60,
    languages:{fixed:["Common","Elvish","Aquan"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([
      tr("Child of the Sea", "A swimming speed of 30 feet, and you can breathe air and water."),
      tr("Friend of the Sea", "You can communicate simple ideas with beasts that have a swimming speed."),
      tr("Sea Elf Training", "Proficiency with spears, tridents, light crossbows and nets.", {weapons:["Spear","Trident","Light Crossbow","Net"]})])},
  "Shadar-kai": {asi:{dex:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([
      wards(tr("Necrotic Resistance", "Resistance to necrotic damage."), {resist:["necrotic"]}),
      tr("Blessing of the Raven Queen", "Bonus action: teleport up to 30 feet (from level 3 you also gain resistance to all damage until your next turn). Once per long rest.")])},
  "Shifter": {asiText:"Depends on your shifter type: Beasthide +2 CON +1 STR, Longtooth +2 STR +1 DEX, Swiftstride +2 DEX +1 CHA, Wildhunt +2 WIS +1 DEX", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"]}, source:"Eberron: Rising from the Last War",
    traits:[tr("Keen Senses", "Proficiency in the Perception skill.", {skills:["Perception"]}),
      // The type is picked on Race Traits for its ability increases (RACE_CHOICES
      // abilityPreset); `presetChoice` has the wizard copy it into this choice.
      tr("Shifter Type", "Your type gives one more skill: Beasthide Natural Athlete (Athletics), Longtooth Fierce (Intimidation), Swiftstride Graceful (Acrobatics), Wildhunt Natural Tracker (Survival).",
        {presetChoice:true, pick:[{kind:"choice", id:"shifterType", noun:"shifter type", options:["Beasthide","Longtooth","Swiftstride","Wildhunt"],
          details:{"Beasthide":"Natural Athlete: Athletics", "Longtooth":"Fierce: Intimidation", "Swiftstride":"Graceful: Acrobatics", "Wildhunt":"Natural Tracker: Survival"}},
          {kind:"skill", byChoice:{slot:0, options:{"Beasthide":["Athletics"], "Longtooth":["Intimidation"], "Swiftstride":["Acrobatics"], "Wildhunt":["Survival"]}}}]}),
      tr("Shifting", "Bonus action: shift for 1 minute, gaining temporary HP equal to your level + CON and a bonus from your shifter type. Once per short or long rest.")]},
  "Simic Hybrid": {asi:{con:2}, asiText:"+2 Constitution, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Animal Enhancement", "Pick a graft at level 1 (Manta Glide, Nimble Climber or Underwater Adaptation) and another at level 5 (such as Grappling Appendages, Carapace or Acid Spit).")]},
  "Tabaxi": {asi:{dex:2,cha:1}, unarmed:{name:"Claws", die:4, type:"Slashing"}, size:"Medium", speed:{walk:30, climb:20}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Volo's Guide to Monsters",
    traits:[tr("Feline Agility", "Double your speed until the end of the turn; recharges after a turn where you don't move."),
      tr("Cat's Claws", "Climbing speed of 20 feet, and your claws deal 1d4 + STR slashing damage."),
      tr("Cat's Talent", "Proficiency in the Perception and Stealth skills.", {skills:["Perception","Stealth"]})]},
  "Thri-kreen": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Adventures in Space",
    traits:[tr("Chameleon Carapace", "Without armor, your AC is 13 + DEX; action: change color for advantage on Stealth to hide."),
      tr("Secondary Arms", "Two smaller arms that can hold light weapons and objects."),
      tr("Sleepless", "You don't need to sleep and can stay conscious during a long rest."),
      tr("Thri-kreen Telepathy", "You can speak telepathically to a creature within 120 feet that shares a language with you.")]},
  "Tortle": {asi:{str:2,wis:1}, unarmed:{name:"Claws", die:4, type:"Slashing"}, size:"Medium", speed:{walk:30}, darkvision:0, unarmoredAc:{base:17, trait:"Natural Armor"},
    languages:{fixed:["Common","Aquan"]}, source:"The Tortle Package",
    traits:[tr("Claws", "Your claws deal 1d4 + STR slashing damage."),
      tr("Hold Breath", "You can hold your breath for up to 1 hour."),
      tr("Natural Armor", "Your shell gives AC 17 (DEX doesn't apply). You can't wear armor, but a shield still adds."),
      tr("Shell Defense", "Action: withdraw into your shell for +4 AC and advantage on STR and CON saves, but you're prone and can't move."),
      tr("Survival Instinct", "Proficiency in the Survival skill.", {skills:["Survival"]})]},
  "Triton": {asi:{str:1,con:1,cha:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Amphibious", "You can breathe air and water."),
      innate(tr("Control Air and Water", "You can cast Fog Cloud, from 3rd level Gust of Wind, and from 5th level Wall of Water, once each without a spell slot; each comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Fog Cloud", {name:"Gust of Wind", from:3}, {name:"Wall of Water", from:5}]),
      tr("Emissary of the Sea", "Aquatic beasts understand your speech, and you can communicate simple ideas with them."),
      wards(tr("Guardians of the Depths", "Resistance to cold damage, and you ignore the drawbacks of deep water."), {resist:["cold"]})]},
  "Vedalken": {asi:{int:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Vedalken"], choose:1}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Vedalken Dispassion", "Advantage on Intelligence, Wisdom and Charisma saves."),
      tr("Tireless Precision", "Proficiency in one of Arcana, History, Investigation, Medicine, Performance or Sleight of Hand, and one tool; add a d4 to checks with them.",
        {pick:[{kind:"skill", options:["Arcana","History","Investigation","Medicine","Performance","Sleight of Hand"]}, {kind:"tool"}]}),
      tr("Partially Amphibious", "You can breathe underwater for up to 1 hour, once per long rest.")]},
  "Verdan": {asi:{cha:2,con:1}, size:"Small", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Goblin"], choose:1}, source:"Acquisitions Incorporated",
    traits:[tr("Black Blood Healing", "When you roll a 1 or 2 on a Hit Die to regain HP, reroll it and use the new roll."),
      tr("Limited Telepathy", "Speak telepathically to a creature within 30 feet that understands a language."),
      tr("Persuasive", "Proficiency in the Persuasion skill.", {skills:["Persuasion"]}),
      tr("Telepathic Insight", "Advantage on Wisdom and Charisma saves."),
      tr("Growth", "You grow from Small to Medium at level 5.")]},
  "Warforged": {asi:{con:2}, asiText:"+2 Constitution, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0, acBonus:1, acTrait:"Integrated Protection",
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[wards(tr("Constructed Resilience", "Advantage on saves against poison, resistance to poison damage, immune to disease, and no need to eat, drink or breathe."), {resist:["poison"]}),
      tr("Sentry's Rest", "A long rest is 6 hours of inactivity, during which you stay aware of your surroundings."),
      tr("Integrated Protection", "+1 to AC; armor you're proficient with is part of your body and takes 1 hour to don or doff."),
      tr("Specialized Design", "Proficiency in one skill and one tool of your choice.", {pick:[{kind:"skill"}, {kind:"tool"}]})]},
  "Yuan-ti Pureblood": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Abyssal","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[innate(tr("Innate Spellcasting", "You know the Poison Spray cantrip, and you can cast Animal Friendship at will, but only on snakes. From 3rd level you can cast Suggestion once without a spell slot; it comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Poison Spray", {name:"Animal Friendship", use:"atwill", note:"Only on snakes."}, {name:"Suggestion", from:3}]),
      tr("Magic Resistance", "Advantage on saving throws against spells and other magical effects."),
      wards(tr("Poison Immunity", "Immunity to poison damage and the poisoned condition."), POISON_IMMUNITY)]},

  /* ---- Subraces and bloodlines (checked against the published pages
     on dnd5e.wikidot.com 2026-10-20) ---- */
  "Pallid Elf": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Explorer's Guide to Wildemount",
    traits:ELF_BASE.concat([
      tr("Incisive Sense", "Advantage on Intelligence (Investigation) and Wisdom (Insight) checks.", null, {on:"skill", skills:["Investigation","Insight"]}),
      innate(tr("Blessing of the Moon Weaver", "You know the Light cantrip. From 3rd level you can cast Sleep, and from 5th level Invisibility (on yourself only), once each without a spell slot or material components; each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Light", {name:"Sleep", from:3}, {name:"Invisibility", from:5, note:"Only on yourself."}], {components:"no material"})])},
  "Ghostwise Halfling": {asi:{dex:2,wis:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Sword Coast Adventurer's Guide",
    traits:HALFLING_BASE.concat([tr("Silent Speech", "Speak telepathically to one creature within 30 feet. It understands you only if you share a language.")])},
  "Lotusden Halfling": {asi:{dex:2,wis:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Explorer's Guide to Wildemount",
    traits:HALFLING_BASE.concat([
      innate(tr("Child of the Wood", "You know the Druidcraft cantrip. From 3rd level you can cast Entangle, and from 5th level Spike Growth, once each without a spell slot or material components; each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Druidcraft", {name:"Entangle", from:3}, {name:"Spike Growth", from:5}], {components:"no material"}),
      tr("Timberwalk", "Checks to track you have disadvantage, and difficult terrain of nonmagical plants and overgrowth costs no extra movement.")])},
  "Tiefling (Baalzebul)": tieflingBloodline({int:1}, "Legacy of Maladomini", "Thaumaturgy", {name:"Ray of Sickness", at:2}, {name:"Crown of Madness"}),
  "Tiefling (Dispater)": tieflingBloodline({dex:1}, "Legacy of Dis", "Thaumaturgy", {name:"Disguise Self"}, {name:"Detect Thoughts"}),
  "Tiefling (Fierna)": tieflingBloodline({wis:1}, "Legacy of Phlegethos", "Friends", {name:"Charm Person", at:2}, {name:"Suggestion"}),
  "Tiefling (Glasya)": tieflingBloodline({dex:1}, "Legacy of Malbolge", "Minor Illusion", {name:"Disguise Self"}, {name:"Invisibility"}),
  "Tiefling (Levistus)": tieflingBloodline({con:1}, "Legacy of Stygia", "Ray of Frost", {name:"Armor of Agathys", at:2}, {name:"Darkness"}),
  "Tiefling (Mammon)": tieflingBloodline({int:1}, "Legacy of Minauros", "Mage Hand", {name:"Tenser's Floating Disk", use:"short"}, {name:"Arcane Lock", note:"No material component."},
    "Tenser's Floating Disk comes back after a short or long rest, Arcane Lock (no material component) after a long rest"),
  "Tiefling (Mephistopheles)": tieflingBloodline({int:1}, "Legacy of Cania", "Mage Hand", {name:"Burning Hands", at:2}, {name:"Flame Blade"}),
  "Tiefling (Zariel)": tieflingBloodline({str:1}, "Legacy of Avernus", "Thaumaturgy", {name:"Searing Smite", at:2}, {name:"Branding Smite"}),
  // Sword Coast's variant tiefling: Feral (+2 DEX, +1 INT) or the usual
  // scores, and one of Infernal Legacy, Devil's Tongue or Hellfire; Winged
  // replaces Infernal Legacy, so it has its own entry for its fly speed.
  "Tiefling (Variant)": {asiText:"+2 Charisma and +1 Intelligence, or Feral: +2 Dexterity and +1 Intelligence", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Sword Coast Adventurer's Guide",
    choiceEffects:{tieflingVariant:{
      "Infernal Legacy":{spells:INFERNAL_SPELLS},
      "Devil's Tongue":{spells:{ability:"cha", list:["Vicious Mockery", {name:"Charm Person", from:3, at:2}, {name:"Enthrall", from:5}]}},
      "Hellfire":{spells:{ability:"cha", list:["Thaumaturgy", {name:"Burning Hands", from:3, at:2}, {name:"Darkness", from:5}]}}}},
    traits:[HELLISH_RESISTANCE,
      tr("Infernal Gift", "Choose your tiefling's magic.", {pick:[{kind:"choice", id:"tieflingVariant", noun:"gift", label:"Choose your tiefling's magic",
        options:["Infernal Legacy","Devil's Tongue","Hellfire"], details:{
          "Infernal Legacy":INFERNAL_TEXT,
          "Devil's Tongue":"You know the Vicious Mockery cantrip. From 3rd level you can cast Charm Person as a 2nd-level spell, and from 5th level Enthrall, once each without a spell slot; each comes back after a long rest. Charisma is your spellcasting ability for them.",
          "Hellfire":"You know the Thaumaturgy cantrip. From 3rd level you can cast Burning Hands as a 2nd-level spell, and from 5th level Darkness, once each without a spell slot; each comes back after a long rest. Charisma is your spellcasting ability for them."}}]})]},
  "Tiefling (Winged)": {asiText:"+2 Charisma and +1 Intelligence, or Feral: +2 Dexterity and +1 Intelligence", size:"Medium", speed:{walk:30, fly:30}, speedWhen:{fly:"not in heavy armor"}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Sword Coast Adventurer's Guide",
    traits:[HELLISH_RESISTANCE,
      tr("Winged", "Bat-like wings give you a flying speed of 30 feet while you aren't wearing heavy armor. This replaces Infernal Legacy.")]},

  /* ---- Eberron's dragonmarks ---- */
  "Dwarf (Mark of Warding)": {asi:{con:2,int:1}, size:"Medium", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Dwarvish"]}, source:"Eberron: Rising from the Last War",
    traits:DWARF_BASE.concat(markTraits("Warder's Intuition", "Investigation checks and checks with thieves' tools",
      innate(tr("Wards and Seals", "You can cast Alarm and Mage Armor, and from 3rd level Arcane Lock, once each without a spell slot or material components; each comes back after a long rest. Intelligence is your spellcasting ability for them."),
        "int", ["Alarm", "Mage Armor", {name:"Arcane Lock", from:3}], {components:"no material"}),
      "Alarm, Armor of Agathys (1st); Arcane Lock, Knock (2nd); Glyph of Warding, Magic Circle (3rd); Leomund's Secret Chest, Mordenkainen's Faithful Hound (4th); Antilife Shell (5th)"))},
  "Elf (Mark of Shadow)": {asi:{dex:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Eberron: Rising from the Last War",
    traits:ELF_BASE.concat(markTraits("Cunning Intuition", "Stealth and Performance checks",
      innate(tr("Shape Shadows", "You know the Minor Illusion cantrip. From 3rd level you can cast Invisibility once without a spell slot; it comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Minor Illusion", {name:"Invisibility", from:3}]),
      "Disguise Self, Silent Image (1st); Darkness, Pass without Trace (2nd); Clairvoyance, Major Image (3rd); Greater Invisibility, Hallucinatory Terrain (4th); Mislead (5th)"))},
  "Gnome (Mark of Scribing)": {asi:{int:2,cha:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Eberron: Rising from the Last War",
    traits:[GNOME_CUNNING].concat(markTraits("Gifted Scribe", "History checks and checks with calligrapher's supplies",
      innate(tr("Scribe's Insight", "You know the Message cantrip. You can cast Comprehend Languages once without a spell slot, and it comes back after a short or long rest. From 3rd level you can also cast Magic Mouth once, and it comes back after a long rest. Intelligence is your spellcasting ability for them."),
        "int", ["Message", {name:"Comprehend Languages", use:"short"}, {name:"Magic Mouth", from:3}]),
      "Comprehend Languages, Illusory Script (1st); Animal Messenger, Silence (2nd); Sending, Tongues (3rd); Arcane Eye, Divination (4th); Dream (5th)"))},
  "Halfling (Mark of Healing)": {asi:{dex:2,wis:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Eberron: Rising from the Last War",
    traits:HALFLING_BASE.concat(markTraits("Medical Intuition", "Medicine checks and checks with an herbalism kit",
      innate(tr("Healing Touch", "You can cast Cure Wounds, and from 3rd level Lesser Restoration, once each without a spell slot; each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Cure Wounds", {name:"Lesser Restoration", from:3}]),
      "Cure Wounds, Healing Word (1st); Lesser Restoration, Prayer of Healing (2nd); Aura of Vitality, Mass Healing Word (3rd); Aura of Purity, Aura of Life (4th); Greater Restoration (5th)"))},
  "Halfling (Mark of Hospitality)": {asi:{dex:2,cha:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Eberron: Rising from the Last War",
    traits:HALFLING_BASE.concat(markTraits("Ever Hospitable", "Persuasion checks and checks with brewer's supplies or cook's utensils",
      innate(tr("Innkeeper's Magic", "You know the Prestidigitation cantrip, and you can cast Purify Food and Drink and Unseen Servant once each without a spell slot; each comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Prestidigitation", "Purify Food and Drink", "Unseen Servant"]),
      "Goodberry, Sleep (1st); Aid, Calm Emotions (2nd); Create Food and Water, Leomund's Tiny Hut (3rd); Aura of Purity, Mordenkainen's Private Sanctum (4th); Hallow (5th)"))},
  "Half-Elf (Mark of Detection)": {asi:{wis:2}, asiText:"+2 Wisdom, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep.")].concat(markTraits("Deductive Intuition", "Investigation and Insight checks",
      innate(tr("Magical Detection", "You can cast Detect Magic and Detect Poison and Disease, and from 3rd level See Invisibility, once each without a spell slot or material components; each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Detect Magic", "Detect Poison and Disease", {name:"See Invisibility", from:3}], {components:"no material"}),
      "Detect Magic, Detect Poison and Disease (1st); Detect Thoughts, Find Traps (2nd); Clairvoyance, Nondetection (3rd); Arcane Eye, Divination (4th); Legend Lore (5th)"))},
  "Half-Elf (Mark of Storm)": {asi:{cha:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Fey Ancestry", "Advantage on saves against being charmed, and magic can't put you to sleep."),
      wards(tr("Storm's Boon", "Resistance to lightning damage."), {resist:["lightning"]})].concat(markTraits("Windwright's Intuition", "Acrobatics checks and checks with navigator's tools",
      innate(tr("Headwinds", "You know the Gust cantrip. From 3rd level you can cast Gust of Wind once without a spell slot; it comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Gust", {name:"Gust of Wind", from:3}]),
      "Feather Fall, Fog Cloud (1st); Gust of Wind, Levitate (2nd); Sleet Storm, Wind Wall (3rd); Conjure Minor Elementals, Control Water (4th); Conjure Elemental (5th)"))},
  "Half-Orc (Mark of Finding)": markOfFinding(),
  "Human (Mark of Finding)": markOfFinding(),
  "Human (Mark of Handling)": {asi:{wis:2}, asiText:"+2 Wisdom, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:markTraits("Wild Intuition", "Animal Handling and Nature checks",
      innate(tr("Primal Connection", "You can cast Animal Friendship and Speak with Animals once each without a spell slot or material components; each comes back after a short or long rest. Wisdom is your spellcasting ability for them. From 3rd level, a spell you cast that affects only beasts can also affect a monstrosity with an Intelligence of 3 or lower (The Bigger They Are)."),
        "wis", [{name:"Animal Friendship", use:"short"}, {name:"Speak with Animals", use:"short"}], {components:"no material"}),
      "Animal Friendship, Speak with Animals (1st); Beast Sense, Calm Emotions (2nd); Beacon of Hope, Conjure Animals (3rd); Aura of Life, Dominate Beast (4th); Awaken (5th)")},
  "Human (Mark of Making)": {asi:{int:2}, asiText:"+2 Intelligence, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Artisan's Gift", "Proficiency with one type of artisan's tools of your choice.", {pick:[{kind:"tool", options:ARTISAN_TOOL_NAMES}]})].concat(markTraits("Artisan's Intuition", "Arcana checks and checks with artisan's tools",
      innate(tr("Spellsmith", "You know the Mending cantrip. You can also cast Magic Weapon once without a spell slot; cast this way it lasts 1 hour and doesn't need concentration, and it comes back after a long rest. Intelligence is your spellcasting ability for them."),
        "int", ["Mending", {name:"Magic Weapon", note:"Lasts 1 hour, no concentration."}]),
      "Identify, Tenser's Floating Disk (1st); Continual Flame, Magic Weapon (2nd); Conjure Barrage, Elemental Weapon (3rd); Fabricate, Stone Shape (4th); Creation (5th)"))},
  "Human (Mark of Passage)": {asi:{dex:2}, asiText:"+2 Dexterity, and +1 to one other score of your choice", size:"Medium", speed:{walk:35}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Courier's Speed", "Your base walking speed is 35 feet.")].concat(markTraits("Intuitive Motion", "Acrobatics checks and checks to operate or maintain a land vehicle",
      innate(tr("Magical Passage", "You can cast Misty Step once without a spell slot; it comes back after a long rest. Dexterity is your spellcasting ability for it."), "dex", ["Misty Step"]),
      "Expeditious Retreat, Jump (1st); Misty Step, Pass without Trace (2nd); Blink, Phantom Steed (3rd); Dimension Door, Freedom of Movement (4th); Teleportation Circle (5th)"))},
  "Human (Mark of Sentinel)": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:markTraits("Sentinel's Intuition", "Insight and Perception checks",
      innate(tr("Guardian's Shield", "You can cast Shield once without a spell slot; it comes back after a long rest. Wisdom is your spellcasting ability for it."), "wis", ["Shield"]),
      "Compelled Duel, Shield of Faith (1st); Warding Bond, Zone of Truth (2nd); Counterspell, Protection from Energy (3rd); Death Ward, Guardian of Faith (4th); Bigby's Hand (5th)").concat([
      tr("Vigilant Guardian", "Reaction when a creature you can see within 5 feet is hit by an attack: swap places with it and take the hit instead. Once per long rest.")])},

  /* ---- More races ---- */
  "Astral Elf": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[innate(tr("Astral Fire", "You know one of these cantrips of your choice: Dancing Lights, Light or Sacred Flame. Intelligence, Wisdom or Charisma (your choice) is your spellcasting ability for it.",
        {pick:[{kind:"spell", level:0, options:["Dancing Lights","Light","Sacred Flame"]}, ABILITY_PICK]}), "pick", []),
      tr("Fey Ancestry", "Advantage on saves to avoid or end being charmed."),
      tr("Keen Senses", "Proficiency in the Perception skill.", {skills:["Perception"]}),
      tr("Starlight Step", "Bonus action: teleport up to 30 feet to a space you can see. Uses equal to your proficiency bonus per long rest."),
      tr("Astral Trance", "You don't sleep, and magic can't put you to sleep; a long rest is 4 hours of trance, after which you gain one skill and one weapon or tool proficiency until your next long rest.")]},
  "Autognome": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small", speed:{walk:30}, darkvision:0,
    unarmoredAc:{base:13, ability:"dex", trait:"Armored Casing"},
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Armored Casing", "While you aren't wearing armor, your base AC is 13 + your Dexterity modifier."),
      tr("Built for Success", "Add a d4 to an attack roll, ability check or saving throw after seeing the d20. Uses equal to your proficiency bonus per long rest."),
      tr("Healing Machine", "Mending lets you spend and roll a Hit Die to heal, and Cure Wounds, Healing Word, Mass Cure Wounds, Mass Healing Word and Spare the Dying work on you."),
      wards(tr("Mechanical Nature", "Resistance to poison damage, immunity to disease, advantage on saves against being paralyzed or poisoned, and no need to eat, drink or breathe.", null,
        {on:"save", abilities:"all", when:"against being paralyzed or poisoned"}), {resist:["poison"]}),
      tr("Sentry's Rest", "A long rest is 6 hours of inactivity, during which you stay conscious."),
      tr("Specialized Design", "Proficiency with two tools of your choice.", {pick:[{kind:"tool", count:2}]})]},
  "Giff": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Astral Spark", "When you hit with a simple or martial weapon, deal extra force damage equal to your proficiency bonus, no more than once a turn. Uses equal to your proficiency bonus per long rest."),
      tr("Firearms Mastery", "Proficiency with all firearms; you ignore their loading property and long range doesn't give disadvantage.", {weapons:["Firearms"]}),
      tr("Hippo Build", "Advantage on Strength checks and Strength saves, and you count as one size larger for carrying, pushing, dragging and lifting.", null,
        [{on:"check", abilities:["str"]}, {on:"save", abilities:["str"]}])]},
  "Grung": {asi:{dex:2,con:1}, size:"Small", speed:{walk:25, climb:25}, darkvision:0,
    languages:{fixed:["Grung"]}, source:"One Grung Above",
    traits:[tr("Arboreal Alertness", "Proficiency in the Perception skill.", {skills:["Perception"]}),
      tr("Amphibious", "You can breathe air and water."),
      wards(tr("Poison Immunity", "Immunity to poison damage and the poisoned condition."), POISON_IMMUNITY),
      tr("Poisonous Skin", "A creature that grapples you or touches your skin makes a DC 12 CON save or is poisoned for 1 minute. You can coat a piercing weapon as part of an attack: on a hit, DC 12 CON save or 2d4 poison damage."),
      tr("Standing Leap", "Your long jump is up to 25 feet and your high jump up to 15 feet, with or without a running start."),
      tr("Water Dependency", "Without at least 1 hour immersed in water in a day, you gain a level of exhaustion at the end of it, removed only by magic or an hour in water.")]},
  "Hadozee": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30, climb:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Dexterous Feet", "Bonus action: use your feet to manipulate an object, open or close a door or container, or pick up or set down a Tiny object."),
      tr("Glide", "Reaction when you fall at least 10 feet: glide horizontally up to your walking speed and take no falling damage."),
      tr("Hadozee Dodge", "Reaction when you take damage: reduce it by 1d6 + your proficiency bonus. Uses equal to your proficiency bonus per long rest.")]},
  "Kalashtar": {asi:{wis:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Quori"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Dual Mind", "Advantage on all Wisdom saving throws.", null, {on:"save", abilities:["wis"]}),
      // Not the githzerai's Mental Discipline (charm and fear): no advantage.
      wards(tr("Mental Discipline", "Resistance to psychic damage.", null, false), {resist:["psychic"]}),
      tr("Mind Link", "Speak telepathically to a creature you can see within 10 × your level feet; as an action, let one such creature reply telepathically for 1 hour."),
      tr("Severed from Dreams", "Immune to spells and effects that need you to dream (like Dream), though not to ones that put you to sleep.")]},
  "Kender": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Dragonlance: Shadow of the Dragon Queen",
    traits:[tr("Fearless", "Advantage on saves to avoid or end being frightened. Once per long rest, turn a failed one into a success.", null,
        {on:"save", abilities:"all", when:"to avoid or end being frightened"}),
      tr("Kender Aptitude", "Proficiency in one of Insight, Investigation, Sleight of Hand, Stealth or Survival.",
        {pick:[{kind:"skill", options:["Insight","Investigation","Sleight of Hand","Stealth","Survival"]}]}),
      tr("Taunt", "Bonus action: a creature within 60 feet that hears and understands you makes a WIS save (DC 8 + proficiency bonus + your INT, WIS or CHA modifier, chosen with this race) or has disadvantage on attacks against anyone but you until your next turn. Uses equal to your proficiency bonus per long rest.")]},
  "Leonin": {asi:{con:2,str:1}, unarmed:{name:"Claws", die:4, type:"Slashing"}, size:"Medium", speed:{walk:35}, darkvision:60,
    languages:{fixed:["Common","Leonin"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Claws", "Your claws are natural weapons dealing 1d4 + STR slashing damage."),
      tr("Hunter's Instincts", "Proficiency in one of Athletics, Intimidation, Perception or Survival.",
        {pick:[{kind:"skill", options:["Athletics","Intimidation","Perception","Survival"]}]}),
      tr("Daunting Roar", "Bonus action: creatures of your choice within 10 feet that hear you make a WIS save (DC 8 + proficiency bonus + CON modifier) or are frightened of you until the end of your next turn. Once per short or long rest.")]},
  "Locathah": {asi:{str:2,dex:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    unarmoredAc:{base:12, ability:"dex", trait:"Natural Armor"},
    languages:{fixed:["Aquan","Common"]}, source:"Locathah Rising",
    traits:[tr("Natural Armor", "Without armor, your AC is 12 + DEX (and you can use it if your armor would give less). A shield still adds."),
      tr("Observant and Athletic", "Proficiency in the Athletics and Perception skills.", {skills:["Athletics","Perception"]}),
      tr("Leviathan Will", "Advantage on saves against being charmed, frightened, paralyzed, poisoned, stunned or put to sleep.", null,
        {on:"save", abilities:"all", when:"against being charmed, frightened, paralyzed, poisoned, stunned or put to sleep"}),
      tr("Limited Amphibiousness", "You can breathe air and water, but must be submerged at least once every 4 hours or you begin to suffocate.")]},
  "Owlin": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:120,
    languages:{fixed:["Common"], choose:1}, source:"Strixhaven: A Curriculum of Chaos",
    traits:[tr("Flight", "A flying speed equal to your walking speed, but not while wearing medium or heavy armor."),
      tr("Silent Feathers", "Proficiency in the Stealth skill.", {skills:["Stealth"]})]},
  "Plasmoid": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Amorphous", "Squeeze through a space 1 inch wide while wearing and carrying nothing; advantage on checks to start or escape a grapple."),
      tr("Hold Breath", "You can hold your breath for 1 hour."),
      wards(tr("Natural Resilience", "Resistance to acid and poison damage, and advantage on saves against being poisoned.", null,
        {on:"save", abilities:"all", when:"against being poisoned"}), {resist:["acid","poison"]}),
      tr("Shape Self", "Action: grow a head, arms and legs (to wear clothes and armor) or become a blob. Bonus action: extrude a 10-foot pseudopod that can handle objects up to 10 pounds but can't attack.")]},

  /* ---- Plane Shift (Magic: The Gathering) ----
     Wizards' free Plane Shift guides (Kaladesh, Amonkhet, Zendikar,
     Ixalan), checked against dnd5e.wikidot.com 2026-10-20. */
  "Aetherborn": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to two other scores of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:2}, source:"Plane Shift: Kaladesh",
    traits:[wards(tr("Born of Aether", "Resistance to necrotic damage."), {resist:["necrotic"]}),
      tr("Menacing", "Proficiency in the Intimidation skill.", {skills:["Intimidation"]})]},
  "Aven (Hawk-Headed)": {asi:{dex:2,wis:2}, size:"Medium", speed:{walk:25, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Aven"]}, source:"Plane Shift: Amonkhet",
    traits:[AVEN_FLIGHT,
      tr("Hawkeyed", "Proficiency in the Perception skill, and attacking at long range doesn't give your ranged weapon attacks disadvantage.", {skills:["Perception"]})]},
  "Aven (Ibis-Headed)": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:25, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Aven"]}, source:"Plane Shift: Amonkhet",
    traits:[AVEN_FLIGHT,
      tr("Kefnet's Blessing", "Add half your proficiency bonus (rounded down) to Intelligence checks that don't already include it.")]},
  "Khenra": {asi:{dex:2,str:1}, size:"Medium", speed:{walk:35}, darkvision:0,
    languages:{fixed:["Common","Khenra"]}, source:"Plane Shift: Amonkhet",
    traits:[tr("Khenra Weapon Training", "Proficiency with the khopesh, spear and javelin.", {weapons:["Spear","Javelin"]}),
      tr("Khenra Twins", "While your living twin is in sight, you can reroll a 1 on an attack roll, ability check or saving throw (and must use the new roll). If your twin is dead, or you had none, you can't be frightened.")]},
  "Kor": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:30, climb:30}, speedWhen:{climb:"not encumbered or in heavy armor"}, darkvision:0,
    languages:{fixed:["Common"]}, source:"Plane Shift: Zendikar",
    traits:[tr("Kor Climbing", "Proficiency in the Athletics and Acrobatics skills, and a climbing speed of 30 feet while not encumbered or in heavy armor.", {skills:["Athletics","Acrobatics"]}),
      HALFLING_BASE[0], HALFLING_BASE[1],
      tr("Silent Speech", "You can communicate in the kor's silent speech of hand signs.")]},
  "Merfolk (Blue)": merfolk("Plane Shift: Ixalan", {int:2}, [tr("Lore of the Waters", "Proficiency in the History and Nature skills.", {skills:["History","Nature"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip"}]}), "int", [])]),
  "Merfolk (Green)": merfolk("Plane Shift: Ixalan", {wis:2}, [tr("Mask of the Wild", "You can try to hide when only lightly obscured by foliage, rain, snow, mist or similar."),
    innate(tr("Cantrip", "You know one cantrip of your choice from the druid spell list. Wisdom is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Druid", ability:"wis", label:"Choose a druid cantrip"}]}), "wis", [])]),
  "Merfolk (Cosi)": merfolk("Plane Shift: Zendikar", {cha:1,int:1}, [tr("Creed of the Trickster", "Proficiency in the Sleight of Hand and Stealth skills.", {skills:["Sleight of Hand","Stealth"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the bard spell list. Charisma is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Bard", ability:"cha", label:"Choose a bard cantrip"}]}), "cha", [])]),
  "Merfolk (Emeria)": merfolk("Plane Shift: Zendikar", {wis:2}, [tr("Wind Creed Manipulation", "Proficiency in the Deception and Persuasion skills.", {skills:["Deception","Persuasion"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the druid spell list. Wisdom is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Druid", ability:"wis", label:"Choose a druid cantrip"}]}), "wis", [])]),
  "Merfolk (Ula)": merfolk("Plane Shift: Zendikar", {int:2}, [tr("Water Creed Navigation", "Proficiency with navigator's tools and in the Survival skill.", {skills:["Survival"], tools:["Navigator's tools"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip"}]}), "int", [])]),
  "Naga": {asi:{con:2,int:1}, unarmed:{name:"Bite", die:4, type:"Piercing"}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Naga"]}, source:"Plane Shift: Amonkhet",
    traits:[tr("Speed Burst", "Bonus action, with both hands free: +5 feet of walking speed until the end of your turn."),
      tr("Natural Weapons", "Your bite deals 1d4 + STR piercing damage, and the target makes a CON save (DC 8 + proficiency bonus + CON modifier) or takes 1d4 poison damage. Your constrict deals 1d6 + STR bludgeoning damage and grapples and restrains the target."),
      wards(tr("Poison Immunity", "Immunity to poison damage and the poisoned condition."), POISON_IMMUNITY),
      tr("Poison Affinity", "Proficiency with the poisoner's kit.", {tools:["Poisoner's kit"]})]},
  "Siren": {asi:{cha:2}, size:"Medium", speed:{walk:25, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Siren"]}, source:"Plane Shift: Ixalan",
    traits:[tr("Flight", "A flying speed of 30 feet, but not while wearing medium or heavy armor."),
      innate(tr("Siren's Song", "You know the Friends cantrip, and you can cast it without material components."), "", ["Friends"], {components:"no material"})]},
  "Vampire (Ixalan)": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Vampire"]}, source:"Plane Shift: Ixalan",
    traits:[wards(tr("Vampiric Resistance", "Resistance to necrotic damage."), {resist:["necrotic"]}), VAMPIRE_BLOODTHIRST,
      tr("Feast of Blood", "After you drain blood, your speed increases by 10 feet and you have advantage on Strength and Dexterity checks and saves for 1 minute.")]},
  "Vampire (Zendikar)": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Vampire"]}, source:"Plane Shift: Zendikar",
    traits:[wards(tr("Vampiric Resistance", "Resistance to necrotic damage."), {resist:["necrotic"]}), VAMPIRE_BLOODTHIRST]},

  /* ---- Lineages ---- */
  "Custom Lineage": {asiText:"+2 to one score of your choice", size:"Small or Medium", speed:{walk:30}, darkvision:60, darkvisionUnlessPicked:"Variable Trait",
    languages:{fixed:["Common"], choose:1}, source:"Tasha's Cauldron of Everything",
    traits:[tr("Feat", "You gain one feat of your choice that you qualify for."),
      tr("Variable Trait", "Darkvision out to 60 feet, or proficiency in one skill of your choice instead.",
        {pick:[{kind:"skill", optional:true, label:"Or take a skill instead of darkvision (leave empty to keep darkvision)"}]})]},
  "Dhampir": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", unarmed:{name:"Vampiric Bite", die:4, type:"Piercing", ability:"con"}, size:"Small or Medium", speed:{walk:35, climb:35}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Van Richten's Guide to Ravenloft",
    traits:[LINEAGE_SKILLS,
      tr("Deathless Nature", "You don't need to breathe."),
      tr("Spider Climb", "A climbing speed equal to your walking speed; from level 3 you can move on walls and ceilings with your hands free."),
      tr("Vampiric Bite", "Your bite deals 1d4 piercing damage with CON for attack and damage, with advantage while you have half your hit points or fewer. On a hit against a living creature, regain hit points equal to the damage, or add it to your next check or attack. Uses equal to your proficiency bonus per long rest.")]},
  "Hexblood": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Van Richten's Guide to Ravenloft",
    traits:[LINEAGE_SKILLS,
      tr("Eerie Token", "Bonus action: make a token of hair, nail or tooth. While it lasts (until your long rest), send a 25-word message to its holder or see and hear through it, within 10 miles. Once per long rest."),
      innate(tr("Hex Magic", "You can cast Disguise Self and Hex once each without a spell slot; each comes back after a long rest, and you can also cast them with any spell slots you have. Intelligence, Wisdom or Charisma (your choice) is your spellcasting ability for them.",
        {pick:[ABILITY_PICK]}), "pick", ["Disguise Self", "Hex"], {slots:true})]},
  "Reborn": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Van Richten's Guide to Ravenloft",
    traits:[LINEAGE_SKILLS,
      wards(tr("Deathless Nature", "Advantage on saves against disease and being poisoned, and on death saves; resistance to poison damage; no need to eat, drink, breathe or sleep (a long rest is 4 hours, awake).", null,
        {on:"save", abilities:"all", when:"against disease and being poisoned, and death saving throws"}), {resist:["poison"]}),
      tr("Knowledge from a Past Life", "Add a d6 to a skill check after seeing the d20. Uses equal to your proficiency bonus per long rest.")]}
};

/* Advantage a race trait gives, by trait name (checked against the
   published pages 2026-10-15): {on: "save", abilities: "all" or [keys],
   when}. With no `when` it always applies and the sheet rolls the save
   with advantage (Vedalken Dispassion); with one it is a reminder under
   the Saving throws card (Dwarven Resilience: against poison). */
export var TRAIT_ADVANTAGES = {
  "Dwarven Resilience": {on:"save", abilities:"all", when:"against poison"},
  "Stout Resilience": {on:"save", abilities:"all", when:"against poison"},
  "Constructed Resilience": {on:"save", abilities:"all", when:"against being poisoned"},
  "Duergar Resilience": {on:"save", abilities:"all", when:"against illusions and against being charmed or paralyzed"},
  "Fey Ancestry": {on:"save", abilities:"all", when:"against being charmed"},
  "Brave": {on:"save", abilities:"all", when:"against being frightened"},
  "Gnome Cunning": {on:"save", abilities:["int","wis","cha"], when:"against magic"},
  "Mental Discipline": {on:"save", abilities:"all", when:"against being charmed or frightened"},
  "Loxodon Serenity": {on:"save", abilities:"all", when:"against being charmed or frightened"},
  "Magic Resistance": {on:"save", abilities:"all", when:"against spells and other magical effects"},
  "Vedalken Dispassion": {on:"save", abilities:["int","wis","cha"]},
  "Telepathic Insight": {on:"save", abilities:["wis","cha"]}
};

var ABILITY_SHORT = {str:"STR", dex:"DEX", con:"CON", int:"INT", wis:"WIS", cha:"CHA"};

/* "+2 DEX, +1 WIS" (or the flexible text). */
export function raceAsiText(d){
  if(d.asiText) return d.asiText;
  var keys = Object.keys(d.asi||{}).filter(function(k){ return d.asi[k]; });
  if(!keys.length) return "No ability score increase";
  if(keys.length===6 && keys.every(function(k){ return d.asi[k]===1; })) return "+1 to every ability score";
  return keys.map(function(k){ return (d.asi[k]>0 ? "+" : "−")+Math.abs(d.asi[k])+" "+ABILITY_SHORT[k]; }).join(", ");
}
/* Compact form for list rows: the fixed part, "+more" when there's a
   choice on top, or "Flexible" when it's all the player's choice. */
export function raceAsiShort(d){
  var keys = Object.keys(d.asi||{}).filter(function(k){ return d.asi[k]; });
  if(!keys.length) return d.custom ? "No increase" : "Flexible";
  if(keys.length===6 && keys.every(function(k){ return d.asi[k]===1; })) return "+1 all";
  var fixed = keys.map(function(k){ return (d.asi[k]>0 ? "+" : "−")+Math.abs(d.asi[k])+" "+ABILITY_SHORT[k]; }).join(", ");
  return d.asiText ? fixed+", +more" : fixed;
}
/* "30 ft, fly 50 ft". */
export function raceSpeedText(d){
  var s = d.speed || {walk:30};
  var out = [s.walk+" ft"];
  ["fly","swim","climb"].forEach(function(k){ if(s[k]) out.push(k+" "+s[k]+" ft"); });
  return out.join(", ");
}
