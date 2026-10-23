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
   traits:     [{name, text, profs?}] each trait's full rules in plain
               words, one card each on the Features tab (rewritten
               against the books' wording on 5etools' data 2026-10-22;
               Darkvision's card is made from `darkvision`).
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
var DROW_TEXT = "You know the Dancing Lights cantrip. From 3rd level you can cast Faerie Fire, and from 5th level Darkness, once each without a spell slot. Each comes back after a long rest. Charisma is your spellcasting ability for them.";
var INFERNAL_SPELLS = {ability:"cha", list:["Thaumaturgy", {name:"Hellish Rebuke", from:3, at:2}, {name:"Darkness", from:5}]};
var INFERNAL_TEXT = "You know the Thaumaturgy cantrip. From 3rd level you can cast Hellish Rebuke as a 2nd-level spell, and from 5th level Darkness, once each without a spell slot. Each comes back after a long rest. Charisma is your spellcasting ability for them.";
var HELLISH_RESISTANCE = wards(tr("Hellish Resistance", "You have resistance to fire damage."), {resist:["fire"]});
var ELF_BASE = [
  tr("Keen Senses", "You have proficiency in the Perception skill.", {skills:["Perception"]}),
  tr("Fey Ancestry", "You have advantage on saving throws against being charmed, and magic can't put you to sleep."),
  tr("Trance", "You don't need to sleep. Instead, you meditate deeply for 4 hours a day, staying semiconscious, and get the same benefit a human gets from 8 hours of sleep. If you meditate during a long rest, the rest takes only 4 hours. Its other rules don't change.")
];
var DWARF_COMBAT = tr("Dwarven Combat Training", "You have proficiency with the battleaxe, handaxe, light hammer and warhammer.",
  {weapons:["Battleaxe","Handaxe","Light Hammer","Warhammer"]});
var DWARF_TOOL = tr("Tool Proficiency", "You have proficiency with one set of artisan's tools of your choice: smith's tools, brewer's supplies or mason's tools.",
  {pick:[{kind:"tool", options:["Smith's tools","Brewer's supplies","Mason's tools"]}]});
var DWARF_BASE = [
  wards(tr("Dwarven Resilience", "You have advantage on saving throws against poison, and you have resistance to poison damage."), {resist:["poison"]}),
  DWARF_COMBAT,
  DWARF_TOOL,
  tr("Stonecunning", "When you make an Intelligence (History) check about the origin of stonework, you count as proficient in History and add double your proficiency bonus instead of your normal bonus."),
  tr("Unslowed", "Wearing heavy armor doesn't reduce your speed.")
];
var HALFLING_BASE = [
  tr("Lucky", "When you roll a 1 on the d20 for an attack roll, ability check or saving throw, you can reroll the die, and you must use the new roll."),
  tr("Brave", "You have advantage on saving throws against being frightened."),
  tr("Halfling Nimbleness", "You can move through the space of any creature that is larger than you.")
];
var GNOME_CUNNING = tr("Gnome Cunning", "You have advantage on all Intelligence, Wisdom and Charisma saving throws against magic.");
var POWERFUL_BUILD = tr("Powerful Build", "You count as one size larger when working out your carrying capacity and the weight you can push, drag or lift.");
// Van Richten's lineages, taken at character creation: two skills.
var LINEAGE_SKILLS = tr("Ancestral Legacy", "You gain proficiency in two skills of your choice. (If you changed an existing character's race to this lineage, you can instead keep the skill proficiencies and climbing, flying or swimming speeds the old race gave you.)", {pick:[{kind:"skill", count:2}]});
var ARTISAN_TOOL_NAMES = ["Alchemist's supplies","Brewer's supplies","Calligrapher's supplies","Carpenter's tools","Cartographer's tools","Cobbler's tools","Cook's utensils","Glassblower's tools","Jeweler's tools","Leatherworker's tools","Mason's tools","Painter's supplies","Potter's tools","Smith's tools","Tinker's tools","Weaver's tools","Woodcarver's tools"];
/* A dragonmark's traits: its intuition (a d4 on two kinds of checks), its
   spells, and its Spells of the Mark (added to a spellcaster's class list). */
function markTraits(intuition, checks, magic, spells){
  return [tr(intuition, "When you make " + checks + ", you can roll a d4 and add the number rolled to the check."), magic,
    tr("Spells of the Mark", "If you have the Spellcasting or Pact Magic class feature, these spells are added to your spellcasting class's spell list: " + spells + ".")];
}
/* Mark of Finding replaces the human's or half-orc's traits (but size and speed). */
function markOfFinding(){
  return {asi:{wis:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Eberron: Rising from the Last War",
    traits:markTraits("Hunter's Intuition", "a Wisdom (Perception) or Wisdom (Survival) check",
      innate(tr("Finder's Magic", "You can cast Hunter's Mark, and from 3rd level Locate Object, once each without a spell slot. Each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Hunter's Mark", {name:"Locate Object", from:3}]),
      "Faerie Fire, Longstrider (1st) · Locate Animals or Plants, Locate Object (2nd) · Clairvoyance, Speak with Plants (3rd) · Divination, Locate Creature (4th) · Commune with Nature (5th)")};
}
/* Mordenkainen's tiefling bloodlines: the tiefling's +2 Charisma, the
   bloodline's +1, and its legacy in place of Infernal Legacy. */
function tieflingBloodline(plusOne, legacy, cantrip, third, fifth, rests){
  var cast = function(x){ return x.name + (x.at ? " as a " + {2:"2nd", 3:"3rd"}[x.at] + "-level spell" : ""); };
  return {asi:Object.assign({cha:2}, plusOne), size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Mordenkainen's Tome of Foes",
    traits:[HELLISH_RESISTANCE,
      innate(tr(legacy, "You know the " + cantrip + " cantrip. From 3rd level you can cast " + cast(third) + ", and from 5th level " + cast(fifth) +
        ", once each without a spell slot. " + (rests || "Each comes back after a long rest") + ". Charisma is your spellcasting ability for them."),
        "cha", [cantrip, Object.assign({from:3}, third), Object.assign({from:5}, fifth)])]};
}
var AVEN_FLIGHT = tr("Flight", "You have a flying speed of 30 feet. You can't use it while wearing medium or heavy armor.");
var VAMPIRE_BLOODTHIRST = tr("Bloodthirst", "You can drain blood and life energy from a willing creature, or one that is grappled by you, incapacitated or restrained. Make a melee attack against it: on a hit you deal 1 piercing damage and 1d6 necrotic damage. Its hit point maximum drops by the necrotic damage until it finishes a long rest, and you regain that many hit points. It dies if this drops its hit point maximum to 0.");
/* Plane Shift's merfolk: +1 Charisma, swimming, amphibious, plus the
   subrace's (Ixalan) or creed's (Zendikar) scores and traits. */
function merfolk(source, plus, traits){
  return {asi:Object.assign({cha:1}, plus, plus.cha ? {cha:1 + plus.cha} : {}), size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Merfolk"], choose:1}, source:source,
    traits:[tr("Amphibious", "You can breathe air and water.")].concat(traits)};
}
/* A Simic Hybrid's animal enhancements (Guildmasters' Guide to Ravnica). */
var SIMIC = {
  manta: "When you fall and aren't incapacitated, you can subtract up to 100 feet from the fall when working out its damage, and you can move up to 2 feet sideways for every 1 foot you drop.",
  climber: "You have a climbing speed equal to your walking speed.",
  water: "You can breathe air and water, and you have a swimming speed equal to your walking speed.",
  grapple: "Two extra appendages, claws or tentacles (your choice). As an action, you can use one to try to grapple a creature. Each is a natural weapon for unarmed strikes, dealing bludgeoning damage equal to 1d6 + your Strength modifier, and right after a hit you can try to grapple the target as a bonus action. They can't wield weapons or do anything that needs precision.",
  carapace: "A thick shell covers parts of your skin: +1 AC while you aren't wearing heavy armor.",
  acid: "As an action, spray acid at a creature or object you can see within 30 feet. It must succeed on a Dexterity saving throw (DC 8 + your Constitution modifier + your proficiency bonus) or take 2d10 acid damage (3d10 from 11th level, 4d10 from 17th). You can do this a number of times equal to your Constitution modifier (minimum 1), and you regain all uses when you finish a long rest."
};
var SIMIC_DETAILS = {"Manta Glide": SIMIC.manta, "Nimble Climber": SIMIC.climber, "Underwater Adaptation": SIMIC.water,
  "Grappling Appendage": SIMIC.grapple, "Carapace": SIMIC.carapace, "Acid Spit": SIMIC.acid};
var SUNLIGHT = tr("Sunlight Sensitivity", "You have disadvantage on attack rolls, and on Wisdom (Perception) checks that rely on sight, when you, the target of your attack or whatever you're trying to perceive is in direct sunlight.");
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
var PHB_BREATH_TRAIT = tr("Breath Weapon", "As an action, you exhale destructive energy in the shape your ancestry gives. Each creature in the area makes the saving throw your ancestry names (DC 8 + your Constitution modifier + your proficiency bonus), taking 2d6 damage of your ancestry's type on a failed save, or half as much on a successful one. The damage rises to 3d6 at 6th level, 4d6 at 11th and 5d6 at 16th. Once you use this, you can't again until you finish a short or long rest.");
function fizbanBreathTrait(area){
  return tr("Breath Weapon", "When you take the Attack action on your turn, you can replace one of your attacks with a magical exhalation in a " + area + ". Each creature in it makes a Dexterity saving throw (DC 8 + your Constitution modifier + your proficiency bonus), taking 1d10 damage of your ancestry's type on a failed save, or half as much on a successful one. The damage rises to 2d10 at 5th level, 3d10 at 11th and 4d10 at 17th. You can use it a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest.");
}
var FIZBAN_RESISTANCE = tr("Draconic Resistance", "You have resistance to the damage type of your draconic ancestry.");

export var RACE_DATA = {
  /* ---- Standard (SRD / Player's Handbook) ---- */
  "Human": {asi:{str:1,dex:1,con:1,int:1,wis:1,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Player's Handbook",
    traits:[tr("Versatile", "Humans have no other special traits. Instead, each of your six ability scores goes up by 1.")]},
  "Variant Human": {asiText:"+1 to two different ability scores of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Player's Handbook",
    traits:[tr("Skills", "You gain proficiency in one skill of your choice.", {pick:[{kind:"skill"}]}), tr("Feat", "You gain one feat of your choice at 1st level.")]},
  "Hill Dwarf": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:25}, darkvision:60, hpPerLevel:1, hpTrait:"Dwarven Toughness",
    languages:{fixed:["Common","Dwarvish"]}, source:"Player's Handbook",
    traits:DWARF_BASE.concat([tr("Dwarven Toughness", "Your hit point maximum increases by 1, and it increases by 1 more every time you gain a level.")])},
  "Mountain Dwarf": {asi:{str:2,con:2}, size:"Medium", speed:{walk:25}, darkvision:60, armorProfs:["Light armor","Medium armor"],
    languages:{fixed:["Common","Dwarvish"]}, source:"Player's Handbook",
    traits:DWARF_BASE.concat([tr("Dwarven Armor Training", "You have proficiency with light and medium armor.")])},
  "High Elf": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Elf Weapon Training", "You have proficiency with the longsword, shortsword, shortbow and longbow.", {weapons:["Longsword","Shortsword","Shortbow","Longbow"]}),
      innate(tr("Cantrip", "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.",
        {pick:[{kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip"}]}), "int", [])])},
  "Wood Elf": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:35}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Elf Weapon Training", "You have proficiency with the longsword, shortsword, shortbow and longbow.", {weapons:["Longsword","Shortsword","Shortbow","Longbow"]}),
      tr("Fleet of Foot", "Your base walking speed increases to 35 feet."),
      tr("Mask of the Wild", "You can try to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist or other natural phenomena.")])},
  "Dark Elf (Drow)": {asi:{dex:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:120,
    languages:{fixed:["Common","Elvish"]}, source:"Player's Handbook",
    traits:ELF_BASE.concat([
      tr("Superior Darkvision", "You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light. In darkness you see only shades of gray, not color."), SUNLIGHT,
      innate(tr("Drow Magic", DROW_TEXT), DROW_SPELLS.ability, DROW_SPELLS.list),
      tr("Drow Weapon Training", "You have proficiency with the rapier, shortsword and hand crossbow.", {weapons:["Rapier","Shortsword","Hand Crossbow"]})])},
  "Lightfoot Halfling": {asi:{dex:2,cha:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Player's Handbook",
    traits:HALFLING_BASE.concat([tr("Naturally Stealthy", "You can try to hide even when the only thing hiding you is a creature at least one size larger than you.")])},
  "Stout Halfling": {asi:{dex:2,con:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Player's Handbook",
    traits:HALFLING_BASE.concat([wards(tr("Stout Resilience", "You have advantage on saving throws against poison, and you have resistance to poison damage."), {resist:["poison"]})])},
  "Dragonborn": {asi:{str:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Draconic"]}, source:"Player's Handbook",
    traits:[
      tr("Draconic Ancestry", "Choose the kind of dragon you descend from. It sets your breath weapon's damage type, its shape (a 5 by 30 ft line or a 15 ft cone) and its saving throw, and the damage type you resist.", ancestryPick("Dragonborn")),
      PHB_BREATH_TRAIT,
      tr("Damage Resistance", "You have resistance to the damage type of your draconic ancestry.")]},
  "Rock Gnome": {asi:{int:2,con:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Player's Handbook",
    traits:[GNOME_CUNNING,
      tr("Artificer's Lore", "When you make an Intelligence (History) check about magic items, alchemical objects or technological devices, add twice your proficiency bonus instead of any proficiency bonus you would normally add."),
      tr("Tinker", "You have proficiency with tinker's tools. With them you can spend 1 hour and 10 gp of materials to build a Tiny clockwork device (AC 5, 1 hit point): a toy that moves 5 feet in a random direction on each of your turns, making fitting noises, a fire starter that makes a small flame (using it takes your action), or a music box that plays one song. A device stops working after 24 hours unless you spend 1 hour repairing it, or when you use an action to take it apart and get the materials back. You can have up to three working at a time.", {tools:["Tinker's tools"]})]},
  "Forest Gnome": {asi:{int:2,dex:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Player's Handbook",
    traits:[GNOME_CUNNING,
      innate(tr("Natural Illusionist", "You know the Minor Illusion cantrip. Intelligence is your spellcasting ability for it."), "int", ["Minor Illusion"]),
      tr("Speak with Small Beasts", "Through sounds and gestures, you can communicate simple ideas with beasts that are Small or smaller.")]},
  "Half-Elf": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to two other scores of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Player's Handbook",
    traits:[tr("Fey Ancestry", "You have advantage on saving throws against being charmed, and magic can't put you to sleep."),
      tr("Skill Versatility", "You gain proficiency in two skills of your choice.", {pick:[{kind:"skill", count:2}]})]},
  // Sword Coast's variant: one heritage trait in place of Skill Versatility.
  "Half-Elf (Variant)": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to two other scores of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Sword Coast Adventurer's Guide",
    choiceEffects:{halfElfVersatility:{
      "Elf Weapon Training":{weapons:["Longsword","Shortsword","Shortbow","Longbow"]},
      "Fleet of Foot":{walk:35},
      "Swim Speed":{swim:30},
      "Cantrip":{spells:{ability:"int", list:[]}},
      "Drow Magic":{spells:DROW_SPELLS}}},
    traits:[tr("Fey Ancestry", "You have advantage on saving throws against being charmed, and magic can't put you to sleep."),
      tr("Half-Elf Versatility", "In place of Skill Versatility, choose one of these: proficiency in two skills, elf weapon training, a wizard cantrip, Fleet of Foot, Mask of the Wild, Drow Magic or a swimming speed of 30 feet. Each option says what it gives when you choose.",
        {pick:[{kind:"choice", id:"halfElfVersatility", noun:"trait", label:"Choose your half-elf trait",
          options:["Skill Versatility","Elf Weapon Training","Cantrip","Fleet of Foot","Mask of the Wild","Drow Magic","Swim Speed"], details:{
            "Skill Versatility":"You gain proficiency in two skills of your choice.",
            "Elf Weapon Training":"You have proficiency with the longsword, shortsword, shortbow and longbow (high or wood elf heritage).",
            "Cantrip":"You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it (high elf heritage).",
            "Fleet of Foot":"Your base walking speed increases to 35 feet (wood elf heritage).",
            "Mask of the Wild":"You can try to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist or other natural phenomena (wood elf heritage).",
            "Drow Magic":DROW_TEXT.replace(/\.$/, " (dark elf heritage)."),
            "Swim Speed":"You have a swimming speed of 30 feet (aquatic elf heritage)."}},
          {kind:"skill", count:2, byChoice:{slot:0, options:{"Skill Versatility":["Acrobatics","Animal Handling","Arcana","Athletics","Deception","History","Insight","Intimidation","Investigation","Medicine","Nature","Perception","Performance","Persuasion","Religion","Sleight of Hand","Stealth","Survival"]}}},
          {kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip", byChoice:{slot:0, when:"Cantrip"}}]})]},
  "Half-Orc": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Orc"]}, source:"Player's Handbook",
    traits:[tr("Menacing", "You have proficiency in the Intimidation skill.", {skills:["Intimidation"]}),
      tr("Relentless Endurance", "When you drop to 0 hit points but aren't killed outright, you can drop to 1 hit point instead. Once you use this, you can't again until you finish a long rest."),
      tr("Savage Attacks", "When you score a critical hit with a melee weapon attack, roll one of the weapon's damage dice one more time and add it to the critical hit's extra damage.")]},
  "Tiefling": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Player's Handbook",
    traits:[HELLISH_RESISTANCE,
      innate(tr("Infernal Legacy", INFERNAL_TEXT), INFERNAL_SPELLS.ability, INFERNAL_SPELLS.list)]},

  /* ---- Expanded ---- */
  "Aarakocra": {asi:{dex:2,wis:1}, unarmed:{name:"Talons", die:4, type:"Slashing"}, size:"Medium", speed:{walk:25, fly:50}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Aarakocra","Auran"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Flight", "You have a flying speed of 50 feet. You can't use it while wearing medium or heavy armor."),
      tr("Talons", "Your talons are natural weapons for your unarmed strikes. On a hit they deal slashing damage equal to 1d4 + your Strength modifier, instead of the usual unarmed strike damage.")]},
  "Aasimar": {asi:{cha:2}, asiText:"+2 Charisma, plus +1 from your subrace (Protector: WIS, Scourge: CON, Fallen: STR)", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Celestial"]}, source:"Volo's Guide to Monsters",
    traits:[wards(tr("Celestial Resistance", "You have resistance to necrotic and radiant damage."), {resist:["necrotic","radiant"]}),
      tr("Healing Hands", "As an action, you can touch a creature and it regains hit points equal to your level. Once you use this, you can't again until you finish a long rest."),
      innate(tr("Light Bearer", "You know the Light cantrip. Charisma is your spellcasting ability for it."), "cha", ["Light"]),
      tr("Celestial Revelation", "From 3rd level, you can use your action to transform for 1 minute, or until you end it as a bonus action. Your subrace sets the form.\n• Protector (Radiant Soul): luminous wings give you a flying speed of 30 feet.\n• Scourge (Radiant Consumption): you shed bright light in a 10-foot radius and dim light 10 feet beyond, and at the end of each of your turns you and each creature within 10 feet of you take radiant damage equal to half your level (rounded up).\n• Fallen (Necrotic Shroud): each other creature within 10 feet of you that can see you must succeed on a Charisma saving throw (DC 8 + your proficiency bonus + your Charisma modifier) or be frightened of you until the end of your next turn.\n\nIn every form, once on each of your turns you can deal extra damage equal to your level to one target you damage with an attack or a spell (radiant, or necrotic for Fallen). Once you use this, you can't again until you finish a long rest.",
        {presetChoice:true, pick:[{kind:"choice", id:"aasimarSubrace", noun:"aasimar subrace", options:["Protector","Scourge","Fallen"],
          details:{"Protector":"Radiant Soul: luminous wings, a flying speed of 30 feet.", "Scourge":"Radiant Consumption: searing light that burns you and those near you.",
            "Fallen":"Necrotic Shroud: frightens creatures near you."}}]})]},
  "Bugbear": {asi:{str:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Long-Limbed", "When you make a melee attack on your turn, your reach for it is 5 feet greater than normal."), POWERFUL_BUILD,
      tr("Sneaky", "You have proficiency in the Stealth skill.", {skills:["Stealth"]}),
      tr("Surprise Attack", "If you surprise a creature and hit it with an attack on your first turn in combat, the attack deals an extra 2d6 damage to it. You can use this only once per combat.")]},
  "Centaur": {asi:{str:2,wis:1}, unarmed:{name:"Hooves", die:4, type:"Bludgeoning"}, size:"Medium", speed:{walk:40}, darkvision:0,
    languages:{fixed:["Common","Sylvan"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Fey", "Your creature type is fey, not humanoid, so spells that only affect humanoids (such as Charm Person or Hold Person) don't work on you."),
      tr("Charge", "If you move at least 30 feet straight toward a target and then hit it with a melee weapon attack on the same turn, you can immediately make one attack against it with your hooves as a bonus action."),
      tr("Hooves", "Your hooves are natural weapons for your unarmed strikes. On a hit they deal bludgeoning damage equal to 1d4 + your Strength modifier, instead of the usual unarmed strike damage."),
      tr("Equine Build", "You count as one size larger when working out your carrying capacity and the weight you can push or drag. Climbing that needs hands and feet is hard for you: each foot of such a climb costs you 4 extra feet of movement instead of the usual 1."),
      tr("Survivor", "You have proficiency in one of these skills of your choice: Animal Handling, Medicine, Nature or Survival.",
        {pick:[{kind:"skill", options:["Animal Handling","Medicine","Nature","Survival"]}]})]},
  "Changeling": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:2}, source:"Eberron: Rising from the Last War",
    traits:[tr("Shapechanger", "As an action, you can change your appearance and voice: coloring, hair, sex, height and weight (but not your size category), even to look like another race. Your game statistics don't change, you can't copy a creature you've never seen, and you must keep the same arrangement of limbs. Your clothing and equipment don't change. You stay in the new form until you use an action to return to your true form, or until you die."),
      tr("Changeling Instincts", "You have proficiency in two of these skills of your choice: Deception, Insight, Intimidation and Persuasion.",
        {pick:[{kind:"skill", count:2, options:["Deception","Insight","Intimidation","Persuasion"]}]})]},
  "Deep Gnome (Svirfneblin)": {asi:{int:2,dex:1}, size:"Small", speed:{walk:25}, darkvision:120,
    languages:{fixed:["Common","Gnomish","Undercommon"]}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Superior Darkvision", "You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light. In darkness you see only shades of gray, not color."), GNOME_CUNNING,
      tr("Stone Camouflage", "You have advantage on Dexterity (Stealth) checks to hide in rocky terrain.")]},
  "Dragonborn (Chromatic)": {asiText:"+2 to one score and +1 to another (your choice)", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Fizban's Treasury of Dragons",
    traits:[tr("Chromatic Ancestry", "Choose a chromatic dragon ancestor. It sets the damage type of your Breath Weapon, Draconic Resistance and Chromatic Warding.", ancestryPick("Dragonborn (Chromatic)")),
      fizbanBreathTrait("5 by 30 ft line"), FIZBAN_RESISTANCE,
      tr("Chromatic Warding", "From 5th level, as an action, you can become immune to your ancestry's damage type for 1 minute. Once you use this, you can't again until you finish a long rest.")]},
  "Dragonborn (Draconblood)": {asi:{int:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Draconic"]}, source:"Explorer's Guide to Wildemount",
    traits:[tr("Draconic Ancestry", "Choose the kind of dragon you descend from. It sets your breath weapon's damage type, its shape (a 5 by 30 ft line or a 15 ft cone) and its saving throw.", ancestryPick("Dragonborn (Draconblood)")),
      PHB_BREATH_TRAIT,
      tr("Forceful Presence", "When you make a Charisma (Intimidation or Persuasion) check, you can make it with advantage. Once you use this, you can't again until you finish a short or long rest.")]},
  "Dragonborn (Gem)": {asiText:"+2 to one score and +1 to another (your choice)", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Fizban's Treasury of Dragons",
    traits:[tr("Gem Ancestry", "Choose a gem dragon ancestor. It sets the damage type of your Breath Weapon and Draconic Resistance.", ancestryPick("Dragonborn (Gem)")),
      fizbanBreathTrait("15 ft cone"), FIZBAN_RESISTANCE,
      tr("Psionic Mind", "You can send telepathic messages to any creature you can see within 30 feet of you. It doesn't need to share a language with you, but it must understand at least one language."),
      tr("Gem Flight", "From 5th level, as a bonus action, you can grow spectral wings for 1 minute. While they last you have a flying speed equal to your walking speed and can hover. Once you use this, you can't again until you finish a long rest.")]},
  "Dragonborn (Metallic)": {asiText:"+2 to one score and +1 to another (your choice)", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Fizban's Treasury of Dragons",
    traits:[tr("Metallic Ancestry", "Choose a metallic dragon ancestor. It sets the damage type of your Breath Weapon and Draconic Resistance.", ancestryPick("Dragonborn (Metallic)")),
      fizbanBreathTrait("15 ft cone"), FIZBAN_RESISTANCE,
      tr("Metallic Breath Weapon", "From 5th level you have a second breath. When you take the Attack action on your turn, you can replace one attack with an exhalation in a 15 ft cone (save DC 8 + your Constitution modifier + your proficiency bonus), choosing one:\n• Enervating Breath (each creature in it must succeed on a Constitution saving throw or be incapacitated until the start of your next turn)\n• Repulsion Breath (each creature in it must succeed on a Strength saving throw or be pushed 20 feet away from you and knocked prone).\n\nOnce you use this, you can't again until you finish a long rest.")]},
  "Dragonborn (Ravenite)": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Draconic"]}, source:"Explorer's Guide to Wildemount",
    traits:[tr("Draconic Ancestry", "Choose the kind of dragon you descend from. It sets your breath weapon's damage type, its shape (a 5 by 30 ft line or a 15 ft cone) and its saving throw.", ancestryPick("Dragonborn (Ravenite)")),
      PHB_BREATH_TRAIT,
      tr("Vengeful Assault", "When a creature in range of a weapon you're wielding damages you, you can use your reaction to make one attack against it with that weapon. Once you use this, you can't again until you finish a short or long rest.")]},
  "Duergar": {asi:{con:2,str:1}, size:"Medium", speed:{walk:25}, darkvision:120,
    languages:{fixed:["Common","Dwarvish","Undercommon"]}, source:"Mordenkainen's Tome of Foes",
    // A dwarf subrace: the dwarf's own traits, then the duergar's.
    traits:[tr("Superior Darkvision", "You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light. In darkness you see only shades of gray, not color.")].concat(DWARF_BASE, [
      tr("Duergar Resilience", "You have advantage on saving throws against illusions and against being charmed or paralyzed."),
      innate(tr("Duergar Magic", "From 3rd level you can cast Enlarge/Reduce on yourself (enlarge only), and from 5th level Invisibility on yourself, once each without a spell slot or material components. Each comes back after a long rest. You can't cast them while you're in direct sunlight, though sunlight doesn't affect them once cast. Intelligence is your spellcasting ability for them."),
        "int", [{name:"Enlarge/Reduce", from:3, note:"Enlarge only, on yourself. Not in direct sunlight."}, {name:"Invisibility", from:5, note:"On yourself only. Not in direct sunlight."}], {components:"no material"}),
      SUNLIGHT])},
  "Eladrin": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([tr("Fey Step", "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. Once you use this, you can't again until you finish a short or long rest. From 3rd level your season adds an effect (save DC 8 + your proficiency bonus + your Charisma modifier).\n• Autumn: right after you teleport, up to two creatures you can see within 10 feet of you must succeed on a Wisdom saving throw or be charmed by you for 1 minute, or until you or your companions damage them.\n• Winter: before you teleport, one creature you can see within 5 feet of you must succeed on a Wisdom saving throw or be frightened of you until the end of your next turn.\n• Spring: you can touch one willing creature within 5 feet of you, and it teleports instead of you, to a space of your choice you can see within 30 feet.\n• Summer: right after you teleport, each creature of your choice you can see within 5 feet of you takes fire damage equal to your Charisma modifier (minimum 1).\n\nYou can change your season when you finish a long rest.")])},
  "Fairy": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small", speed:{walk:30, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"The Wild Beyond the Witchlight",
    traits:[tr("Fey", "Your creature type is fey, not humanoid, so spells that only affect humanoids (such as Charm Person or Hold Person) don't work on you."),
      innate(tr("Fairy Magic", "You know the Druidcraft cantrip. From 3rd level you can cast Faerie Fire, and from 5th level Enlarge/Reduce, once each without a spell slot. Each comes back after a long rest, and you can also cast them with any spell slots you have. Intelligence, Wisdom or Charisma (your choice) is your spellcasting ability for them.",
        {pick:[ABILITY_PICK]}), "pick", ["Druidcraft", {name:"Faerie Fire", from:3}, {name:"Enlarge/Reduce", from:5}], {slots:true}),
      tr("Flight", "Your wings give you a flying speed equal to your walking speed. You can't use it while wearing medium or heavy armor.")]},
  "Firbolg": {asi:{wis:2,str:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Elvish","Giant"]}, source:"Volo's Guide to Monsters",
    traits:[innate(tr("Firbolg Magic", "You can cast Detect Magic and Disguise Self once each without a spell slot. Each comes back after a short or long rest. Your Disguise Self can make you seem up to 3 feet shorter, to blend in with humans and elves. Wisdom is your spellcasting ability for them."),
        "wis", [{name:"Detect Magic", use:"short"}, {name:"Disguise Self", use:"short", note:"You can seem up to 3 feet shorter."}]),
      tr("Hidden Step", "As a bonus action, you can magically turn invisible until the start of your next turn, or until you attack, make a damage roll or force someone to make a saving throw. Once you use this, you can't again until you finish a short or long rest."),
      POWERFUL_BUILD,
      tr("Speech of Beast and Leaf", "Beasts and plants can understand the meaning of your words, though you can't understand them in return. You have advantage on all Charisma checks you make to influence them.")]},
  "Genasi (Air)": {asi:{con:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Unending Breath", "You can hold your breath indefinitely while you're not incapacitated."),
      innate(tr("Mingle with the Wind", "You can cast Levitate once without a spell slot or material components. It comes back after a long rest. Constitution is your spellcasting ability for it."), "con", ["Levitate"], {components:"no material"})]},
  "Genasi (Earth)": {asi:{con:2,str:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[tr("Earth Walk", "You can move across difficult terrain made of earth or stone without spending extra movement."),
      innate(tr("Merge with Stone", "You can cast Pass without Trace once without a spell slot or material components. It comes back after a long rest. Constitution is your spellcasting ability for it."), "con", ["Pass without Trace"], {components:"no material"})]},
  "Genasi (Fire)": {asi:{con:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[wards(tr("Fire Resistance", "You have resistance to fire damage."), {resist:["fire"]}),
      innate(tr("Reach to the Blaze", "You know the Produce Flame cantrip. From 3rd level you can cast Burning Hands once as a 1st-level spell without a spell slot. It comes back after a long rest. Constitution is your spellcasting ability for them."), "con", ["Produce Flame", {name:"Burning Hands", from:3}])]},
  "Genasi (Water)": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Elemental Evil Player's Companion",
    traits:[wards(tr("Acid Resistance", "You have resistance to acid damage."), {resist:["acid"]}),
      tr("Amphibious", "You can breathe air and water."),
      innate(tr("Call to the Wave", "You know the Shape Water cantrip. From 3rd level you can cast Create or Destroy Water once as a 2nd-level spell without a spell slot. It comes back after a long rest. Constitution is your spellcasting ability for them."), "con", ["Shape Water", {name:"Create or Destroy Water", from:3, at:2}])]},
  "Gith (Githyanki)": {asi:{str:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:0, armorProfs:["Light armor","Medium armor"],
    languages:{fixed:["Common","Gith"], choose:1}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Decadent Mastery", "You learn one extra language of your choice, and you gain proficiency in one skill or with one tool of your choice.", {pick:[{kind:"skillOrTool"}]}),
      tr("Martial Prodigy", "You have proficiency with light and medium armor, and with the shortsword, longsword and greatsword.", {weapons:["Shortsword","Longsword","Greatsword"]}),
      innate(tr("Githyanki Psionics", "You know the Mage Hand cantrip, and the hand is invisible when you cast it this way. From 3rd level you can cast Jump, and from 5th level Misty Step, once each without a spell slot. Each comes back after a long rest. Intelligence is your spellcasting ability for them, and they need no components when cast with this trait."),
        "int", [{name:"Mage Hand", note:"The hand is invisible."}, {name:"Jump", from:3}, {name:"Misty Step", from:5}], {components:"none"})]},
  "Gith (Githzerai)": {asi:{wis:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Gith"]}, source:"Mordenkainen's Tome of Foes",
    traits:[tr("Mental Discipline", "You have advantage on saving throws against being charmed or frightened."),
      innate(tr("Githzerai Psionics", "You know the Mage Hand cantrip, and the hand is invisible when you cast it this way. From 3rd level you can cast Shield, and from 5th level Detect Thoughts, once each without a spell slot. Each comes back after a long rest. Wisdom is your spellcasting ability for them, and they need no components when cast with this trait."),
        "wis", [{name:"Mage Hand", note:"The hand is invisible."}, {name:"Shield", from:3}, {name:"Detect Thoughts", from:5}], {components:"none"})]},
  "Goblin": {asi:{dex:2,con:1}, size:"Small", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Fury of the Small", "When you damage a creature larger than you with an attack or a spell, you can deal extra damage to it equal to your level. Once you use this, you can't again until you finish a short or long rest."),
      tr("Nimble Escape", "You can take the Disengage or Hide action as a bonus action on each of your turns.")]},
  "Goliath": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Giant"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Natural Athlete", "You have proficiency in the Athletics skill.", {skills:["Athletics"]}),
      tr("Stone's Endurance", "When you take damage, you can use your reaction to roll a d12, add your Constitution modifier, and reduce the damage by the total. Once you use this, you can't again until you finish a short or long rest."),
      POWERFUL_BUILD,
      wards(tr("Mountain Born", "You have resistance to cold damage, and you're acclimated to high altitude, including elevations above 20,000 feet."), {resist:["cold"]})]},
  "Harengon": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"The Wild Beyond the Witchlight",
    traits:[tr("Hare-Trigger", "You add your proficiency bonus to your initiative rolls."),
      tr("Leporine Senses", "You have proficiency in the Perception skill.", {skills:["Perception"]}),
      tr("Lucky Footwork", "When you fail a Dexterity saving throw, you can use your reaction to roll a d4 and add it to the save, possibly turning the failure into a success. You can't use this if you're prone or your speed is 0."),
      tr("Rabbit Hop", "As a bonus action, you can jump a number of feet equal to five times your proficiency bonus without provoking opportunity attacks. You can do this only if your speed is above 0. You can do this a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest.")]},
  "Hobgoblin": {asi:{con:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60, armorProfs:["Light armor"],
    languages:{fixed:["Common","Goblin"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Martial Training", "You have proficiency with two martial weapons of your choice and with light armor.", {pick:[{kind:"weapon", count:2, filter:"martial"}]}),
      tr("Saving Face", "When you miss with an attack roll or fail an ability check or saving throw, you can add a bonus to the roll equal to the number of allies you can see within 30 feet of you (up to +5). Once you use this, you can't again until you finish a short or long rest.")]},
  "Kenku": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Auran"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Expert Forgery", "You can copy other creatures' handwriting and craftwork, and you have advantage on all checks to produce forgeries or duplicates of existing objects."),
      tr("Kenku Training", "You have proficiency in two of these skills of your choice: Acrobatics, Deception, Stealth and Sleight of Hand.",
        {pick:[{kind:"skill", count:2, options:["Acrobatics","Deception","Stealth","Sleight of Hand"]}]}),
      tr("Mimicry", "You can mimic sounds you have heard, including voices. A creature that hears them can tell they're imitations with a Wisdom (Insight) check contested by your Charisma (Deception) check. You can read and write your languages, but you can speak only through mimicry.")]},
  "Kobold": {asi:{dex:2,str:-2}, size:"Small", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Grovel, Cower and Beg", "As an action on your turn, you can cower pathetically to distract nearby foes. Until the end of your next turn, your allies have advantage on attack rolls against enemies within 10 feet of you that you can see. Once you use this, you can't again until you finish a short or long rest."),
      tr("Pack Tactics", "You have advantage on an attack roll against a creature if at least one of your allies is within 5 feet of it and that ally isn't incapacitated."),
      SUNLIGHT]},
  "Lizardfolk": {asi:{con:2,wis:1}, unarmed:{name:"Bite", die:6, type:"Piercing"}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0, unarmoredAc:{base:13, ability:"dex", trait:"Natural Armor"},
    languages:{fixed:["Common","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Bite", "Your fanged maw is natural weapons for your unarmed strikes. On a hit it deal piercing damage equal to 1d6 + your Strength modifier, instead of the usual unarmed strike damage."),
      tr("Cunning Artisan", "As part of a short rest, you can harvest bone and hide from a slain beast, construct, dragon, monstrosity or plant of Small size or larger to make a shield, a club, a javelin, or 1d4 darts or blowgun needles. You need a blade, such as a dagger, or suitable artisan's tools, such as leatherworker's tools."),
      tr("Hold Breath", "You can hold your breath for up to 15 minutes at a time."),
      tr("Hunter's Lore", "You have proficiency in two of these skills of your choice: Animal Handling, Nature, Perception, Stealth and Survival.",
        {pick:[{kind:"skill", count:2, options:["Animal Handling","Nature","Perception","Stealth","Survival"]}]}),
      tr("Natural Armor", "When you aren't wearing armor, your AC is 13 + your Dexterity modifier. You can use this instead if the armor you wear would give you a lower AC, and a shield's bonus still applies."),
      tr("Hungry Jaws", "As a bonus action, you can make a special attack with your bite. If it hits, it deals its normal damage, you gain temporary hit points equal to your Constitution modifier (minimum 1), and you can't use this again until you finish a short or long rest.")]},
  "Loxodon": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0, unarmoredAc:{base:12, ability:"con", trait:"Natural Armor"},
    languages:{fixed:["Common","Loxodon"]}, source:"Guildmasters' Guide to Ravnica",
    traits:[POWERFUL_BUILD,
      tr("Loxodon Serenity", "You have advantage on saving throws against being charmed or frightened."),
      tr("Natural Armor", "When you aren't wearing armor, your AC is 12 + your Constitution modifier. You can use this instead if the armor you wear would give you a lower AC, and a shield's bonus still applies."),
      tr("Trunk", "Your trunk has a reach of 5 feet and can lift up to five times your Strength score in pounds. You can use it as a snorkel, and to lift, drop, hold, push or pull an object or creature, open or close a door or container, grapple someone, or make an unarmed strike. It can't wield weapons or shields or do anything that needs fine control, such as using tools or magic items or performing a spell's somatic components."),
      tr("Keen Smell", "You have advantage on Wisdom (Perception), Wisdom (Survival) and Intelligence (Investigation) checks that involve smell.")]},
  "Minotaur": {asi:{str:2,con:1}, unarmed:{name:"Horns", die:6, type:"Piercing"}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Minotaur"]}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Horns", "Your horns are natural weapons for your unarmed strikes. On a hit they deal piercing damage equal to 1d6 + your Strength modifier, instead of the usual unarmed strike damage."),
      tr("Goring Rush", "Right after you take the Dash action on your turn and move at least 20 feet, you can make one melee attack with your horns as a bonus action."),
      tr("Hammering Horns", "Right after you hit a creature with a melee attack as part of the Attack action on your turn, you can use a bonus action to try to shove it with your horns. It must be no more than one size larger than you and within 5 feet of you. Unless it succeeds on a Strength saving throw (DC 8 + your proficiency bonus + your Strength modifier), you push it up to 10 feet away from you."),
      tr("Imposing Presence", "You have proficiency in one of these skills of your choice: Intimidation or Persuasion.", {pick:[{kind:"skill", options:["Intimidation","Persuasion"]}]})]},
  "Orc": {asi:{str:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Orc"]}, source:"Eberron: Rising from the Last War",
    traits:[tr("Aggressive", "As a bonus action, you can move up to your speed toward a hostile creature you can see or hear. You must end this move closer to it than you started."),
      tr("Primal Intuition", "You have proficiency in two of these skills of your choice: Animal Handling, Insight, Intimidation, Medicine, Nature, Perception and Survival.",
        {pick:[{kind:"skill", count:2, options:["Animal Handling","Insight","Intimidation","Medicine","Nature","Perception","Survival"]}]}),
      POWERFUL_BUILD]},
  "Satyr": {asi:{cha:2,dex:1}, unarmed:{name:"Ram", die:4, type:"Bludgeoning"}, size:"Medium", speed:{walk:35}, darkvision:0,
    languages:{fixed:["Common","Sylvan"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Fey", "Your creature type is fey, not humanoid, so spells that only affect humanoids (such as Charm Person or Hold Person) don't work on you."),
      tr("Ram", "You can use your head and horns for unarmed strikes. On a hit they deal bludgeoning damage equal to 1d4 + your Strength modifier."),
      tr("Magic Resistance", "You have advantage on saving throws against spells and other magical effects."),
      tr("Mirthful Leaps", "Whenever you make a long or high jump, you can roll a d8 and add the number rolled to the feet you cover, even on a standing jump. The extra distance costs movement as normal."),
      tr("Reveler", "You have proficiency in the Performance and Persuasion skills, and with one musical instrument of your choice.",
        {skills:["Performance","Persuasion"], pick:[{kind:"tool", group:"Musical instruments"}]})]},
  "Sea Elf": {asi:{dex:2,con:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:60,
    languages:{fixed:["Common","Elvish","Aquan"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([
      tr("Child of the Sea", "You have a swimming speed of 30 feet, and you can breathe air and water."),
      tr("Friend of the Sea", "Using gestures and sounds, you can communicate simple ideas with any beast that has an innate swimming speed."),
      tr("Sea Elf Training", "You have proficiency with the spear, trident, light crossbow and net.", {weapons:["Spear","Trident","Light Crossbow","Net"]})])},
  "Shadar-kai": {asi:{dex:2,con:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Mordenkainen's Tome of Foes",
    traits:ELF_BASE.concat([
      wards(tr("Necrotic Resistance", "You have resistance to necrotic damage."), {resist:["necrotic"]}),
      tr("Blessing of the Raven Queen", "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. Once you use this, you can't again until you finish a long rest. From 3rd level you also have resistance to all damage from the moment you teleport until the start of your next turn, looking ghostly and translucent meanwhile.")])},
  "Shifter": {asiText:"Depends on your shifter type: Beasthide +2 CON +1 STR, Longtooth +2 STR +1 DEX, Swiftstride +2 DEX +1 CHA, Wildhunt +2 WIS +1 DEX", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"]}, source:"Eberron: Rising from the Last War",
    traits:[tr("Keen Senses", "You have proficiency in the Perception skill.", {skills:["Perception"]}),
      // The type is picked on Race Traits for its ability increases (RACE_CHOICES
      // abilityPreset); `presetChoice` has the wizard copy it into this choice.
      tr("Shifter Type", "Your shifter type gives you one more skill and a benefit while you're shifted.\n• Beasthide: Athletics, and when you shift you gain 1d6 extra temporary hit points, and you have +1 AC while shifted.\n• Longtooth: Intimidation, and while shifted you can make an unarmed strike with your fangs as a bonus action, dealing piercing damage equal to 1d6 + your Strength modifier.\n• Swiftstride: Acrobatics, and while shifted your walking speed increases by 10 feet, and when a creature ends its turn within 5 feet of you, you can use your reaction to move up to 10 feet without provoking opportunity attacks.\n• Wildhunt: Survival, and while shifted you have advantage on Wisdom checks, and no creature within 30 feet of you can make an attack roll with advantage against you unless you're incapacitated.",
        {presetChoice:true, pick:[{kind:"choice", id:"shifterType", noun:"shifter type", options:["Beasthide","Longtooth","Swiftstride","Wildhunt"],
          details:{"Beasthide":"Athletics. Shifted: 1d6 extra temporary hit points, and +1 AC.", "Longtooth":"Intimidation. Shifted: a bonus action fang attack (1d6 + STR piercing).",
            "Swiftstride":"Acrobatics. Shifted: +10 ft walking speed, and a reaction to move 10 ft when a creature ends its turn next to you.",
            "Wildhunt":"Survival. Shifted: advantage on Wisdom checks, and no attacks against you with advantage from within 30 ft."}},
          {kind:"skill", byChoice:{slot:0, options:{"Beasthide":["Athletics"], "Longtooth":["Intimidation"], "Swiftstride":["Acrobatics"], "Wildhunt":["Survival"]}}}]}),
      tr("Shifting", "As a bonus action, you can take on a more bestial appearance for 1 minute, until you die, or until you change back as a bonus action. When you shift, you gain temporary hit points equal to your level + your Constitution modifier (minimum 1), plus your shifter type's benefit. Once you use this, you can't again until you finish a short or long rest.")]},
  "Simic Hybrid": {asi:{con:2}, asiText:"+2 Constitution, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Guildmasters' Guide to Ravnica",
    choiceEffects:{simicEnhancement:{
      "Nimble Climber":{climb:"walk"},
      "Underwater Adaptation":{swim:"walk"},
      "Carapace":{ac:1, acWhen:"noHeavyArmor"}}},
    traits:[tr("Animal Enhancement", "Your body has animal traits: choose one enhancement at 1st level and a second at 5th level. At 1st level:\n• Manta Glide: " + SIMIC.manta + "\n• Nimble Climber: " + SIMIC.climber + "\n• Underwater Adaptation: " + SIMIC.water,
        {pick:[{kind:"choice", id:"simicEnhancement", noun:"enhancement", label:"Choose your 1st-level enhancement",
          options:["Manta Glide","Nimble Climber","Underwater Adaptation"], details:SIMIC_DETAILS}]}),
      Object.assign(tr("Animal Enhancement (5th Level)", "At 5th level, choose a second enhancement: one you didn't take at 1st level, or one of these:\n• Grappling Appendage: " + SIMIC.grapple + "\n• Carapace: " + SIMIC.carapace + "\n• Acid Spit: " + SIMIC.acid,
        {pick:[{kind:"choice", id:"simicEnhancement", noun:"enhancement", label:"Choose your 5th-level enhancement",
          options:["Manta Glide","Nimble Climber","Underwater Adaptation","Grappling Appendage","Carapace","Acid Spit"], details:SIMIC_DETAILS}]}), {level:5})]},
  "Tabaxi": {asi:{dex:2,cha:1}, unarmed:{name:"Claws", die:4, type:"Slashing"}, size:"Medium", speed:{walk:30, climb:20}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Volo's Guide to Monsters",
    traits:[tr("Feline Agility", "When you move on your turn in combat, you can double your speed until the end of the turn. Once you use this, you can't again until you move 0 feet on one of your turns."),
      tr("Cat's Claws", "You have a climbing speed of 20 feet. Your claws are natural weapons for your unarmed strikes: on a hit they deal slashing damage equal to 1d4 + your Strength modifier, instead of the usual unarmed strike damage."),
      tr("Cat's Talents", "You have proficiency in the Perception and Stealth skills.", {skills:["Perception","Stealth"]})]},
  "Thri-kreen": {asiText:"+2 to one score and +1 to another (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Adventures in Space",
    traits:[tr("Chameleon Carapace", "While you aren't wearing armor, your carapace gives you a base AC of 13 + your Dexterity modifier. As an action, you can change its color to match your surroundings, giving you advantage on Dexterity (Stealth) checks to hide there."),
      tr("Secondary Arms", "You have two slightly smaller arms below your main pair. They can manipulate an object, open or close a door or container, pick up or set down a Tiny object, or wield a weapon with the light property."),
      tr("Sleepless", "You don't need to sleep and can stay conscious during a long rest, though you must still avoid strenuous activity to get its benefit."),
      tr("Thri-kreen Telepathy", "Without magic you can't speak your languages other than thri-kreen. Instead you send your thoughts telepathically to willing creatures within 120 feet. A creature doesn't need to share a language with you, but it must understand at least one. The link breaks if you move more than 120 feet apart, if either of you is incapacitated, or if either of you ends it (no action needed).")]},
  "Tortle": {asi:{str:2,wis:1}, unarmed:{name:"Claws", die:4, type:"Slashing"}, size:"Medium", speed:{walk:30}, darkvision:0, unarmoredAc:{base:17, trait:"Natural Armor"},
    languages:{fixed:["Common","Aquan"]}, source:"The Tortle Package",
    traits:[tr("Claws", "Your claws are natural weapons for your unarmed strikes. On a hit they deal slashing damage equal to 1d4 + your Strength modifier, instead of the usual unarmed strike damage."),
      tr("Hold Breath", "You can hold your breath for up to 1 hour at a time."),
      tr("Natural Armor", "Your shell gives you a base AC of 17. Your Dexterity modifier doesn't change it. You gain no benefit from wearing armor, but a shield's bonus applies as normal."),
      tr("Shell Defense", "As an action, you can withdraw into your shell. Until you come out, you have +4 AC and advantage on Strength and Constitution saving throws, but you are prone, your speed is 0 and can't increase, you have disadvantage on Dexterity saving throws, you can't take reactions, and the only action you can take is a bonus action to come out."),
      tr("Survival Instinct", "You have proficiency in the Survival skill.", {skills:["Survival"]})]},
  "Triton": {asi:{str:1,con:1,cha:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common","Primordial"]}, source:"Volo's Guide to Monsters",
    traits:[tr("Amphibious", "You can breathe air and water."),
      innate(tr("Control Air and Water", "You can cast Fog Cloud, from 3rd level Gust of Wind, and from 5th level Wall of Water, once each without a spell slot. Each comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Fog Cloud", {name:"Gust of Wind", from:3}, {name:"Wall of Water", from:5}]),
      tr("Emissary of the Sea", "You can communicate simple ideas with beasts that can breathe water. They understand the meaning of your words, though you can't understand them in return."),
      wards(tr("Guardians of the Depths", "You have resistance to cold damage."), {resist:["cold"]})]},
  "Vedalken": {asi:{int:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Vedalken"], choose:1}, source:"Guildmasters' Guide to Ravnica",
    traits:[tr("Vedalken Dispassion", "You have advantage on all Intelligence, Wisdom and Charisma saving throws."),
      tr("Tireless Precision", "You have proficiency in one of these skills of your choice: Arcana, History, Investigation, Medicine, Performance or Sleight of Hand, and with one tool of your choice. Whenever you make an ability check with that skill or tool, roll a d4 and add it to the total.",
        {pick:[{kind:"skill", options:["Arcana","History","Investigation","Medicine","Performance","Sleight of Hand"]}, {kind:"tool"}]}),
      tr("Partially Amphibious", "By absorbing oxygen through your skin, you can breathe underwater for up to 1 hour. Once you reach that limit, you can't use this again until you finish a long rest.")]},
  "Verdan": {asi:{cha:2,con:1}, size:"Small", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Goblin"], choose:1}, source:"Acquisitions Incorporated",
    traits:[tr("Black Blood Healing", "When you roll a 1 or 2 on a Hit Die you spend at the end of a short rest, you can reroll it, and you must use the new roll."),
      tr("Limited Telepathy", "You can speak telepathically to any creature you can see within 30 feet of you. It doesn't need to share a language with you but must understand at least one, and only simple ideas and plain concepts pass this way."),
      tr("Persuasive", "You have proficiency in the Persuasion skill.", {skills:["Persuasion"]}),
      tr("Telepathic Insight", "You have advantage on all Wisdom and Charisma saving throws."),
      tr("Growth", "You start out Small. When you reach 5th level, you grow to Medium.")]},
  "Warforged": {asi:{con:2}, asiText:"+2 Constitution, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0, acBonus:1, acTrait:"Integrated Protection",
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[wards(tr("Constructed Resilience", "You have advantage on saving throws against being poisoned, and resistance to poison damage. You don't need to eat, drink or breathe, you're immune to disease, and you don't need to sleep. Magic can't put you to sleep."), {resist:["poison"]}),
      tr("Sentry's Rest", "When you take a long rest, you spend at least 6 hours inactive and motionless instead of sleeping. You look inert, but you aren't unconscious, and you can see and hear as normal."),
      tr("Integrated Protection", "You gain a +1 bonus to AC. You can wear only armor you're proficient with, and putting on armor other than a shield takes 1 hour of building it into your body. Taking it off also takes 1 hour, and you can rest meanwhile. While you live, armor built into you can't be removed against your will."),
      tr("Specialized Design", "You gain proficiency in one skill and with one tool of your choice.", {pick:[{kind:"skill"}, {kind:"tool"}]})]},
  "Yuan-ti Pureblood": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Abyssal","Draconic"]}, source:"Volo's Guide to Monsters",
    traits:[innate(tr("Innate Spellcasting", "You know the Poison Spray cantrip, and you can cast Animal Friendship at will, but only on snakes. From 3rd level you can cast Suggestion once without a spell slot. It comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Poison Spray", {name:"Animal Friendship", use:"atwill", note:"Only on snakes."}, {name:"Suggestion", from:3}]),
      tr("Magic Resistance", "You have advantage on saving throws against spells and other magical effects."),
      wards(tr("Poison Immunity", "You are immune to poison damage and the poisoned condition."), POISON_IMMUNITY)]},

  /* ---- Subraces and bloodlines (checked against the published pages
     on dnd5e.wikidot.com 2026-10-20) ---- */
  "Pallid Elf": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Explorer's Guide to Wildemount",
    traits:ELF_BASE.concat([
      tr("Incisive Sense", "You have advantage on Intelligence (Investigation) and Wisdom (Insight) checks.", null, {on:"skill", skills:["Investigation","Insight"]}),
      innate(tr("Blessing of the Moon Weaver", "You know the Light cantrip. From 3rd level you can cast Sleep, and from 5th level Invisibility (on yourself only), once each without a spell slot or material components. Each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Light", {name:"Sleep", from:3}, {name:"Invisibility", from:5, note:"Only on yourself."}], {components:"no material"})])},
  "Ghostwise Halfling": {asi:{dex:2,wis:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Sword Coast Adventurer's Guide",
    traits:HALFLING_BASE.concat([tr("Silent Speech", "You can speak telepathically to one creature at a time within 30 feet of you. It understands you only if you share a language.")])},
  "Lotusden Halfling": {asi:{dex:2,wis:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Explorer's Guide to Wildemount",
    traits:HALFLING_BASE.concat([
      innate(tr("Child of the Wood", "You know the Druidcraft cantrip. From 3rd level you can cast Entangle, and from 5th level Spike Growth, once each without a spell slot or material components. Each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Druidcraft", {name:"Entangle", from:3}, {name:"Spike Growth", from:5}], {components:"no material"}),
      tr("Timberwalk", "Ability checks made to track you have disadvantage, and you can move across difficult terrain made of nonmagical plants and undergrowth without spending extra movement.")])},
  "Tiefling (Baalzebul)": tieflingBloodline({int:1}, "Legacy of Maladomini", "Thaumaturgy", {name:"Ray of Sickness", at:2}, {name:"Crown of Madness"}),
  "Tiefling (Dispater)": tieflingBloodline({dex:1}, "Legacy of Dis", "Thaumaturgy", {name:"Disguise Self"}, {name:"Detect Thoughts"}),
  "Tiefling (Fierna)": tieflingBloodline({wis:1}, "Legacy of Phlegethos", "Friends", {name:"Charm Person", at:2}, {name:"Suggestion"}),
  "Tiefling (Glasya)": tieflingBloodline({dex:1}, "Legacy of Malbolge", "Minor Illusion", {name:"Disguise Self"}, {name:"Invisibility"}),
  "Tiefling (Levistus)": tieflingBloodline({con:1}, "Legacy of Stygia", "Ray of Frost", {name:"Armor of Agathys", at:2}, {name:"Darkness"}),
  "Tiefling (Mammon)": tieflingBloodline({int:1}, "Legacy of Minauros", "Mage Hand", {name:"Tenser's Floating Disk", use:"short"}, {name:"Arcane Lock", note:"No material component."},
    "Tenser's Floating Disk comes back after a short or long rest, and Arcane Lock (no material component) after a long rest"),
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
      tr("Infernal Gift", "Choose your tiefling's magic: Infernal Legacy, Devil's Tongue or Hellfire. Each option says what it gives when you choose.", {pick:[{kind:"choice", id:"tieflingVariant", noun:"gift", label:"Choose your tiefling's magic",
        options:["Infernal Legacy","Devil's Tongue","Hellfire"], details:{
          "Infernal Legacy":INFERNAL_TEXT,
          "Devil's Tongue":"You know the Vicious Mockery cantrip. From 3rd level you can cast Charm Person as a 2nd-level spell, and from 5th level Enthrall, once each without a spell slot. Each comes back after a long rest. Charisma is your spellcasting ability for them.",
          "Hellfire":"You know the Thaumaturgy cantrip. From 3rd level you can cast Burning Hands as a 2nd-level spell, and from 5th level Darkness, once each without a spell slot. Each comes back after a long rest. Charisma is your spellcasting ability for them."}}]})]},
  "Tiefling (Winged)": {asiText:"+2 Charisma and +1 Intelligence, or Feral: +2 Dexterity and +1 Intelligence", size:"Medium", speed:{walk:30, fly:30}, speedWhen:{fly:"not in heavy armor"}, darkvision:60,
    languages:{fixed:["Common","Infernal"]}, source:"Sword Coast Adventurer's Guide",
    traits:[HELLISH_RESISTANCE,
      tr("Winged", "Bat-like wings give you a flying speed of 30 feet while you aren't wearing heavy armor. This replaces Infernal Legacy.")]},

  /* ---- Eberron's dragonmarks ---- */
  "Dwarf (Mark of Warding)": {asi:{con:2,int:1}, size:"Medium", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Dwarvish"]}, source:"Eberron: Rising from the Last War",
    traits:DWARF_BASE.concat(markTraits("Warder's Intuition", "an Intelligence (Investigation) check or an ability check using thieves' tools",
      innate(tr("Wards and Seals", "You can cast Alarm and Mage Armor, and from 3rd level Arcane Lock, once each without a spell slot or material components. Each comes back after a long rest. Intelligence is your spellcasting ability for them."),
        "int", ["Alarm", "Mage Armor", {name:"Arcane Lock", from:3}], {components:"no material"}),
      "Alarm, Armor of Agathys (1st) · Arcane Lock, Knock (2nd) · Glyph of Warding, Magic Circle (3rd) · Leomund's Secret Chest, Mordenkainen's Faithful Hound (4th) · Antilife Shell (5th)"))},
  "Elf (Mark of Shadow)": {asi:{dex:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"]}, source:"Eberron: Rising from the Last War",
    traits:ELF_BASE.concat(markTraits("Cunning Intuition", "a Charisma (Performance) or Dexterity (Stealth) check",
      innate(tr("Shape Shadows", "You know the Minor Illusion cantrip. From 3rd level you can cast Invisibility once without a spell slot. It comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Minor Illusion", {name:"Invisibility", from:3}]),
      "Disguise Self, Silent Image (1st) · Darkness, Pass without Trace (2nd) · Clairvoyance, Major Image (3rd) · Greater Invisibility, Hallucinatory Terrain (4th) · Mislead (5th)"))},
  "Gnome (Mark of Scribing)": {asi:{int:2,cha:1}, size:"Small", speed:{walk:25}, darkvision:60,
    languages:{fixed:["Common","Gnomish"]}, source:"Eberron: Rising from the Last War",
    traits:[GNOME_CUNNING].concat(markTraits("Gifted Scribe", "an Intelligence (History) check or an ability check using calligrapher's supplies",
      innate(tr("Scribe's Insight", "You know the Message cantrip. You can cast Comprehend Languages once without a spell slot, and it comes back after a short or long rest. From 3rd level you can also cast Magic Mouth once, and it comes back after a long rest. Intelligence is your spellcasting ability for them."),
        "int", ["Message", {name:"Comprehend Languages", use:"short"}, {name:"Magic Mouth", from:3}]),
      "Comprehend Languages, Illusory Script (1st) · Animal Messenger, Silence (2nd) · Sending, Tongues (3rd) · Arcane Eye, Divination (4th) · Dream (5th)"))},
  "Halfling (Mark of Healing)": {asi:{dex:2,wis:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Eberron: Rising from the Last War",
    traits:HALFLING_BASE.concat(markTraits("Medical Intuition", "a Wisdom (Medicine) check or an ability check using an herbalism kit",
      innate(tr("Healing Touch", "You can cast Cure Wounds, and from 3rd level Lesser Restoration, once each without a spell slot. Each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Cure Wounds", {name:"Lesser Restoration", from:3}]),
      "Cure Wounds, Healing Word (1st) · Lesser Restoration, Prayer of Healing (2nd) · Aura of Vitality, Mass Healing Word (3rd) · Aura of Purity, Aura of Life (4th) · Greater Restoration (5th)"))},
  "Halfling (Mark of Hospitality)": {asi:{dex:2,cha:1}, size:"Small", speed:{walk:25}, darkvision:0,
    languages:{fixed:["Common","Halfling"]}, source:"Eberron: Rising from the Last War",
    traits:HALFLING_BASE.concat(markTraits("Ever Hospitable", "a Charisma (Persuasion) check or an ability check involving brewer's supplies or cook's utensils",
      innate(tr("Innkeeper's Magic", "You know the Prestidigitation cantrip, and you can cast Purify Food and Drink and Unseen Servant once each without a spell slot. Each comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Prestidigitation", "Purify Food and Drink", "Unseen Servant"]),
      "Goodberry, Sleep (1st) · Aid, Calm Emotions (2nd) · Create Food and Water, Leomund's Tiny Hut (3rd) · Aura of Purity, Mordenkainen's Private Sanctum (4th) · Hallow (5th)"))},
  "Half-Elf (Mark of Detection)": {asi:{wis:2}, asiText:"+2 Wisdom, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Fey Ancestry", "You have advantage on saving throws against being charmed, and magic can't put you to sleep.")].concat(markTraits("Deductive Intuition", "an Intelligence (Investigation) or Wisdom (Insight) check",
      innate(tr("Magical Detection", "You can cast Detect Magic and Detect Poison and Disease, and from 3rd level See Invisibility, once each without a spell slot or material components. Each comes back after a long rest. Wisdom is your spellcasting ability for them."),
        "wis", ["Detect Magic", "Detect Poison and Disease", {name:"See Invisibility", from:3}], {components:"no material"}),
      "Detect Magic, Detect Poison and Disease (1st) · Detect Thoughts, Find Traps (2nd) · Clairvoyance, Nondetection (3rd) · Arcane Eye, Divination (4th) · Legend Lore (5th)"))},
  "Half-Elf (Mark of Storm)": {asi:{cha:2,dex:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Elvish"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Fey Ancestry", "You have advantage on saving throws against being charmed, and magic can't put you to sleep."),
      wards(tr("Storm's Boon", "You have resistance to lightning damage."), {resist:["lightning"]})].concat(markTraits("Windwright's Intuition", "a Dexterity (Acrobatics) check or any ability check involving navigator's tools",
      innate(tr("Headwinds", "You know the Gust cantrip. From 3rd level you can cast Gust of Wind once without a spell slot. It comes back after a long rest. Charisma is your spellcasting ability for them."),
        "cha", ["Gust", {name:"Gust of Wind", from:3}]),
      "Feather Fall, Fog Cloud (1st) · Gust of Wind, Levitate (2nd) · Sleet Storm, Wind Wall (3rd) · Conjure Minor Elementals, Control Water (4th) · Conjure Elemental (5th)"))},
  "Half-Orc (Mark of Finding)": markOfFinding(),
  "Human (Mark of Finding)": markOfFinding(),
  "Human (Mark of Handling)": {asi:{wis:2}, asiText:"+2 Wisdom, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:markTraits("Wild Intuition", "a Wisdom (Animal Handling) or Intelligence (Nature) check",
      innate(tr("Primal Connection", "You can cast Animal Friendship and Speak with Animals once each without a spell slot or material components. Each comes back after a short or long rest. Wisdom is your spellcasting ability for them. From 3rd level, these two spells can target a beast or a monstrosity with an Intelligence of 3 or lower (The Bigger They Are)."),
        "wis", [{name:"Animal Friendship", use:"short"}, {name:"Speak with Animals", use:"short"}], {components:"no material"}),
      "Animal Friendship, Speak with Animals (1st) · Beast Sense, Calm Emotions (2nd) · Beacon of Hope, Conjure Animals (3rd) · Aura of Life, Dominate Beast (4th) · Awaken (5th)")},
  "Human (Mark of Making)": {asi:{int:2}, asiText:"+2 Intelligence, and +1 to one other score of your choice", size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Maker's Gift", "You gain proficiency with one type of artisan's tools of your choice.", {pick:[{kind:"tool", options:ARTISAN_TOOL_NAMES}]})].concat(markTraits("Artisan's Intuition", "an Intelligence (Arcana) check or an ability check involving artisan's tools",
      innate(tr("Spellsmith", "You know the Mending cantrip. You can also cast Magic Weapon once without a spell slot. Cast this way it lasts 1 hour and doesn't need concentration, and it comes back after a long rest. Intelligence is your spellcasting ability for them."),
        "int", ["Mending", {name:"Magic Weapon", note:"Lasts 1 hour, no concentration."}]),
      "Identify, Tenser's Floating Disk (1st) · Continual Flame, Magic Weapon (2nd) · Conjure Barrage, Elemental Weapon (3rd) · Fabricate, Stone Shape (4th) · Creation (5th)"))},
  "Human (Mark of Passage)": {asi:{dex:2}, asiText:"+2 Dexterity, and +1 to one other score of your choice", size:"Medium", speed:{walk:35}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Courier's Speed", "Your base walking speed increases to 35 feet.")].concat(markTraits("Intuitive Motion", "a Dexterity (Acrobatics) check or any ability check to operate or maintain a land vehicle",
      innate(tr("Magical Passage", "You can cast Misty Step once without a spell slot. It comes back after a long rest. Dexterity is your spellcasting ability for it."), "dex", ["Misty Step"]),
      "Expeditious Retreat, Jump (1st) · Misty Step, Pass without Trace (2nd) · Blink, Phantom Steed (3rd) · Dimension Door, Freedom of Movement (4th) · Teleportation Circle (5th)"))},
  "Human (Mark of Sentinel)": {asi:{con:2,wis:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:markTraits("Sentinel's Intuition", "a Wisdom (Insight) or Wisdom (Perception) check",
      innate(tr("Guardian's Shield", "You can cast Shield once without a spell slot. It comes back after a long rest. Wisdom is your spellcasting ability for it."), "wis", ["Shield"]),
      "Compelled Duel, Shield of Faith (1st) · Warding Bond, Zone of Truth (2nd) · Counterspell, Protection from Energy (3rd) · Death Ward, Guardian of Faith (4th) · Bigby's Hand (5th)").concat([
      tr("Vigilant Guardian", "When a creature you can see within 5 feet of you is hit by an attack roll, you can use your reaction to swap places with it, and the attack hits you instead. Once you use this, you can't again until you finish a long rest.")])},

  /* ---- More races ---- */
  "Astral Elf": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[innate(tr("Astral Fire", "You know one of these cantrips of your choice: Dancing Lights, Light or Sacred Flame. Intelligence, Wisdom or Charisma (your choice) is your spellcasting ability for it.",
        {pick:[{kind:"spell", level:0, options:["Dancing Lights","Light","Sacred Flame"]}, ABILITY_PICK]}), "pick", []),
      tr("Fey Ancestry", "You have advantage on saving throws you make to avoid or end the charmed condition on yourself."),
      tr("Keen Senses", "You have proficiency in the Perception skill.", {skills:["Perception"]}),
      tr("Starlight Step", "As a bonus action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can do this a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest."),
      tr("Astral Trance", "You don't need to sleep, and magic can't put you to sleep. You can finish a long rest in 4 hours of trancelike meditation, staying conscious. When you finish this trance, you gain proficiency in one skill of your choice and with one weapon or tool of your choice, and you keep them until you finish your next long rest.")]},
  "Autognome": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small", speed:{walk:30}, darkvision:0,
    unarmoredAc:{base:13, ability:"dex", trait:"Armored Casing"},
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Armored Casing", "While you aren't wearing armor, your base AC is 13 + your Dexterity modifier."),
      tr("Built for Success", "You can add a d4 to one attack roll, ability check or saving throw you make, deciding after you see the d20 roll but before its effects happen. You can do this a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest."),
      tr("Healing Machine", "If Mending is cast on you, you can spend a Hit Die, roll it, and regain hit points equal to the roll + your Constitution modifier (minimum 1). Cure Wounds, Healing Word, Mass Cure Wounds, Mass Healing Word and Spare the Dying also work on you, though they normally don't affect constructs."),
      wards(tr("Mechanical Nature", "You have resistance to poison damage and immunity to disease, and you have advantage on saving throws against being paralyzed or poisoned. You don't need to eat, drink or breathe.", null,
        {on:"save", abilities:"all", when:"against being paralyzed or poisoned"}), {resist:["poison"]}),
      tr("Sentry's Rest", "When you take a long rest, you spend at least 6 hours inactive and motionless instead of sleeping. You look inert, but you stay conscious."),
      tr("Specialized Design", "You gain proficiency with two tools of your choice.", {pick:[{kind:"tool", count:2}]})]},
  "Giff": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Astral Spark", "When you hit a target with a simple or martial weapon, you can make it take extra force damage equal to your proficiency bonus. You can do this a number of times equal to your proficiency bonus, no more than once per turn, and you regain all uses when you finish a long rest."),
      tr("Firearms Mastery", "You have proficiency with all firearms and ignore their loading property. Attacking at long range with a firearm doesn't give you disadvantage.", {weapons:["Firearms"]}),
      tr("Hippo Build", "You have advantage on Strength-based ability checks and Strength saving throws, and you count as one size larger when working out your carrying capacity and the weight you can push, drag or lift.", null,
        [{on:"check", abilities:["str"]}, {on:"save", abilities:["str"]}])]},
  "Grung": {asi:{dex:2,con:1}, size:"Small", speed:{walk:25, climb:25}, darkvision:0,
    languages:{fixed:["Grung"]}, source:"One Grung Above",
    traits:[tr("Arboreal Alertness", "You have proficiency in the Perception skill.", {skills:["Perception"]}),
      tr("Amphibious", "You can breathe air and water."),
      wards(tr("Poison Immunity", "You are immune to poison damage and the poisoned condition."), POISON_IMMUNITY),
      tr("Poisonous Skin", "Any creature that grapples you or otherwise touches your skin must succeed on a DC 12 Constitution saving throw or be poisoned for 1 minute. Once it's no longer touching you, it can repeat the save at the end of each of its turns, ending the effect on a success. You can also coat a piercing weapon with this poison as part of an attack: on a hit, the target must succeed on a DC 12 Constitution saving throw or take 2d4 poison damage."),
      tr("Standing Leap", "Your long jump is up to 25 feet and your high jump up to 15 feet, with or without a running start."),
      tr("Water Dependency", "If you don't immerse yourself in water for at least 1 hour during a day, you gain one level of exhaustion at the end of that day. Only magic, or at least 1 hour immersed in water, removes it.")]},
  "Hadozee": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30, climb:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Dexterous Feet", "As a bonus action, you can use your feet to manipulate an object, open or close a door or container, or pick up or set down a Tiny object."),
      tr("Glide", "When you fall at least 10 feet, you can use your reaction to spread your skin membranes and glide horizontally up to your walking speed in a direction you choose, taking no damage from the fall."),
      tr("Hadozee Dodge", "When you take damage, you can use your reaction to roll a d6, add your proficiency bonus, and reduce the damage by the total (minimum 0). You can do this a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest.")]},
  "Kalashtar": {asi:{wis:2,cha:1}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Quori"], choose:1}, source:"Eberron: Rising from the Last War",
    traits:[tr("Dual Mind", "You have advantage on all Wisdom saving throws.", null, {on:"save", abilities:["wis"]}),
      // Not the githzerai's Mental Discipline (charm and fear): no advantage.
      wards(tr("Mental Discipline", "You have resistance to psychic damage.", null, false), {resist:["psychic"]}),
      tr("Mind Link", "You can speak telepathically to any creature you can see within 10 times your level in feet. It doesn't need to share a language with you but must understand at least one. While you're speaking to a creature this way, you can use your action to let it speak telepathically to you for 1 hour, or until you end this as an action. It must be able to see you and stay within range. Only one creature at a time can have this."),
      tr("Severed from Dreams", "You sleep, but you don't connect to the plane of dreams. You're immune to spells and magical effects that need you to dream, like Dream, but not to ones that put you to sleep, like Sleep.")]},
  "Kender": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Dragonlance: Shadow of the Dragon Queen",
    traits:[tr("Fearless", "You have advantage on saving throws you make to avoid or end the frightened condition on yourself. When you fail one, you can choose to succeed instead. Once you do, you can't again until you finish a long rest.", null,
        {on:"save", abilities:"all", when:"to avoid or end being frightened"}),
      tr("Kender Curiosity", "You have proficiency in one of these skills of your choice: Insight, Investigation, Sleight of Hand, Stealth or Survival.",
        {pick:[{kind:"skill", options:["Insight","Investigation","Sleight of Hand","Stealth","Survival"]}]}),
      tr("Taunt", "As a bonus action, you can hurl provoking words at a creature within 60 feet of you that can hear and understand you. It must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Intelligence, Wisdom or Charisma modifier, chosen with this race) or have disadvantage on attack rolls against anyone but you until the start of your next turn. You can do this a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest.",
        {pick:[{kind:"choice", id:"tauntAbility", noun:"ability for Taunt", label:"Choose the ability your Taunt's save DC uses", options:["Intelligence","Wisdom","Charisma"]}]})]},
  "Leonin": {asi:{con:2,str:1}, unarmed:{name:"Claws", die:4, type:"Slashing"}, size:"Medium", speed:{walk:35}, darkvision:60,
    languages:{fixed:["Common","Leonin"]}, source:"Mythic Odysseys of Theros",
    traits:[tr("Claws", "Your claws are natural weapons for your unarmed strikes. On a hit they deal slashing damage equal to 1d4 + your Strength modifier, instead of the usual unarmed strike damage."),
      tr("Hunter's Instincts", "You have proficiency in one of these skills of your choice: Athletics, Intimidation, Perception or Survival.",
        {pick:[{kind:"skill", options:["Athletics","Intimidation","Perception","Survival"]}]}),
      tr("Daunting Roar", "As a bonus action, you can let out a menacing roar. Creatures of your choice within 10 feet of you that can hear you must succeed on a Wisdom saving throw (DC 8 + your proficiency bonus + your Constitution modifier) or be frightened of you until the end of your next turn. Once you use this, you can't again until you finish a short or long rest.")]},
  "Locathah": {asi:{str:2,dex:1}, size:"Medium", speed:{walk:30, swim:30}, darkvision:0,
    unarmoredAc:{base:12, ability:"dex", trait:"Natural Armor"},
    languages:{fixed:["Aquan","Common"]}, source:"Locathah Rising",
    traits:[tr("Natural Armor", "When you aren't wearing armor, your AC is 12 + your Dexterity modifier. You can use this instead if the armor you wear would give you a lower AC, and a shield's bonus still applies."),
      tr("Observant and Athletic", "You have proficiency in the Athletics and Perception skills.", {skills:["Athletics","Perception"]}),
      tr("Leviathan Will", "You have advantage on saving throws against being charmed, frightened, paralyzed, poisoned, stunned or put to sleep.", null,
        {on:"save", abilities:"all", when:"against being charmed, frightened, paralyzed, poisoned, stunned or put to sleep"}),
      tr("Limited Amphibiousness", "You can breathe air and water, but you must be submerged at least once every 4 hours to avoid suffocating.")]},
  "Owlin": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:120,
    languages:{fixed:["Common"], choose:1}, source:"Strixhaven: A Curriculum of Chaos",
    traits:[tr("Flight", "Your wings give you a flying speed equal to your walking speed. You can't use it while wearing medium or heavy armor."),
      tr("Silent Feathers", "You have proficiency in the Stealth skill.", {skills:["Stealth"]})]},
  "Plasmoid": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Spelljammer: Astral Adventurer's Guide",
    traits:[tr("Amorphous", "You can squeeze through a space as narrow as 1 inch wide, as long as you're wearing and carrying nothing. You have advantage on ability checks to start or escape a grapple."),
      tr("Hold Breath", "You can hold your breath for up to 1 hour at a time."),
      wards(tr("Natural Resilience", "You have resistance to acid and poison damage, and you have advantage on saving throws against being poisoned.", null,
        {on:"save", abilities:"all", when:"against being poisoned"}), {resist:["acid","poison"]}),
      tr("Shape Self", "As an action, you can reshape your body to have a head, one or two arms, one or two legs and makeshift hands and feet, or turn back into a limbless blob. In a humanlike shape you can wear clothing and armor made for a humanoid of your size. As a bonus action, you can push out a pseudopod up to 6 inches wide and 10 feet long, or pull it back in, and as part of that bonus action use it to manipulate an object, open or close a door or container, or pick up or set down a Tiny object. It can't attack, activate magic items or lift more than 10 pounds.")]},

  /* ---- Plane Shift (Magic: The Gathering) ----
     Wizards' free Plane Shift guides (Kaladesh, Amonkhet, Zendikar,
     Ixalan), checked against dnd5e.wikidot.com 2026-10-20. */
  "Aetherborn": {asi:{cha:2}, asiText:"+2 Charisma, and +1 to two other scores of your choice", size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:2}, source:"Plane Shift: Kaladesh",
    traits:[wards(tr("Born of Aether", "You have resistance to necrotic damage."), {resist:["necrotic"]}),
      tr("Menacing", "You have proficiency in the Intimidation skill.", {skills:["Intimidation"]})]},
  "Aven (Hawk-Headed)": {asi:{dex:2,wis:2}, size:"Medium", speed:{walk:25, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Aven"]}, source:"Plane Shift: Amonkhet",
    traits:[AVEN_FLIGHT,
      tr("Hawkeyed", "You have proficiency in the Perception skill, and attacking at long range doesn't give your ranged weapon attack rolls disadvantage.", {skills:["Perception"]})]},
  "Aven (Ibis-Headed)": {asi:{dex:2,int:1}, size:"Medium", speed:{walk:25, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Aven"]}, source:"Plane Shift: Amonkhet",
    traits:[AVEN_FLIGHT,
      tr("Kefnet's Blessing", "You can add half your proficiency bonus (rounded down) to any Intelligence check that doesn't already include your proficiency bonus.")]},
  "Khenra": {asi:{dex:2,str:1}, size:"Medium", speed:{walk:35}, darkvision:0,
    languages:{fixed:["Common","Khenra"]}, source:"Plane Shift: Amonkhet",
    traits:[tr("Khenra Weapon Training", "You have proficiency with the khopesh, spear and javelin.", {weapons:["Spear","Javelin"]}),
      tr("Khenra Twins", "If your twin is alive and you can see them, whenever you roll a 1 on an attack roll, ability check or saving throw, you can reroll the die and must use the new roll. If your twin is dead, or you were born without one, you can't be frightened.")]},
  "Kor": {asi:{dex:2,wis:1}, size:"Medium", speed:{walk:30, climb:30}, speedWhen:{climb:"not encumbered or in heavy armor"}, darkvision:0,
    languages:{fixed:["Common"]}, source:"Plane Shift: Zendikar",
    traits:[tr("Kor Climbing", "You have proficiency in the Athletics and Acrobatics skills, and a climbing speed of 30 feet while you aren't encumbered or wearing heavy armor.", {skills:["Athletics","Acrobatics"]}),
      HALFLING_BASE[0], HALFLING_BASE[1],
      tr("Silent Speech", "You can communicate in the silent speech of the kor, a language of hand signs.")]},
  "Merfolk (Blue)": merfolk("Plane Shift: Ixalan", {int:2}, [tr("Lore of the Waters", "You have proficiency in the History and Nature skills.", {skills:["History","Nature"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip"}]}), "int", [])]),
  "Merfolk (Green)": merfolk("Plane Shift: Ixalan", {wis:2}, [tr("Mask of the Wild", "You can try to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist or other natural phenomena."),
    innate(tr("Cantrip", "You know one cantrip of your choice from the druid spell list. Wisdom is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Druid", ability:"wis", label:"Choose a druid cantrip"}]}), "wis", [])]),
  "Merfolk (Cosi)": merfolk("Plane Shift: Zendikar", {cha:1,int:1}, [tr("Creed of the Trickster", "You have proficiency in the Sleight of Hand and Stealth skills.", {skills:["Sleight of Hand","Stealth"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the bard spell list. Charisma is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Bard", ability:"cha", label:"Choose a bard cantrip"}]}), "cha", [])]),
  "Merfolk (Emeria)": merfolk("Plane Shift: Zendikar", {wis:2}, [tr("Wind Creed Manipulation", "You have proficiency in the Deception and Persuasion skills.", {skills:["Deception","Persuasion"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the druid spell list. Wisdom is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Druid", ability:"wis", label:"Choose a druid cantrip"}]}), "wis", [])]),
  "Merfolk (Ula)": merfolk("Plane Shift: Zendikar", {int:2}, [tr("Water Creed Navigation", "You have proficiency with navigator's tools and in the Survival skill.", {skills:["Survival"], tools:["Navigator's tools"]}),
    innate(tr("Cantrip", "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.", {pick:[{kind:"spell", level:0, list:"Wizard", ability:"int", label:"Choose a wizard cantrip"}]}), "int", [])]),
  "Naga": {asi:{con:2,int:1}, unarmed:{name:"Bite", die:4, type:"Piercing"}, size:"Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common","Naga"]}, source:"Plane Shift: Amonkhet",
    traits:[tr("Speed Burst", "As a bonus action on your turn, if both your hands are free, you can drop low and pull yourself along with your arms, increasing your walking speed by 5 feet until the end of your turn."),
      tr("Natural Weapons", "Your bite and your constricting body are natural weapons for unarmed strikes.\n• Bite: piercing damage equal to 1d4 + your Strength modifier, and the target must succeed on a Constitution saving throw (DC 8 + your proficiency bonus + your Constitution modifier) or take 1d4 poison damage.\n• Constrict: bludgeoning damage equal to 1d6 + your Strength modifier, and the target is grappled (escape DC 8 + your proficiency bonus + your Strength modifier). Until the grapple ends it is restrained, and you can't constrict another target."),
      wards(tr("Poison Immunity", "You are immune to poison damage and the poisoned condition."), POISON_IMMUNITY),
      tr("Poison Affinity", "You have proficiency with the poisoner's kit.", {tools:["Poisoner's kit"]})]},
  "Siren": {asi:{cha:2}, size:"Medium", speed:{walk:25, fly:30}, speedWhen:{fly:"not in medium or heavy armor"}, darkvision:0,
    languages:{fixed:["Common","Siren"]}, source:"Plane Shift: Ixalan",
    traits:[tr("Flight", "You have a flying speed of 30 feet. You can't use it while wearing medium or heavy armor."),
      innate(tr("Siren's Song", "You know the Friends cantrip, and you can cast it without material components."), "", ["Friends"], {components:"no material"})]},
  "Vampire (Ixalan)": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Vampire"]}, source:"Plane Shift: Ixalan",
    traits:[wards(tr("Vampiric Resistance", "You have resistance to necrotic damage."), {resist:["necrotic"]}), VAMPIRE_BLOODTHIRST,
      tr("Feast of Blood", "When you drain blood with Bloodthirst, your speed increases by 10 feet, and you have advantage on Strength and Dexterity checks and saving throws, for 1 minute.")]},
  "Vampire (Zendikar)": {asi:{cha:2,int:1}, size:"Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common","Vampire"]}, source:"Plane Shift: Zendikar",
    traits:[wards(tr("Vampiric Resistance", "You have resistance to necrotic damage."), {resist:["necrotic"]}), VAMPIRE_BLOODTHIRST]},

  /* ---- Lineages ---- */
  "Custom Lineage": {asiText:"+2 to one score of your choice", size:"Small or Medium", speed:{walk:30}, darkvision:60, darkvisionUnlessPicked:"Variable Trait",
    languages:{fixed:["Common"], choose:1}, source:"Tasha's Cauldron of Everything",
    traits:[tr("Feat", "You gain one feat of your choice that you qualify for."),
      tr("Variable Trait", "Choose one: darkvision with a range of 60 feet, or proficiency in one skill of your choice.",
        {pick:[{kind:"skill", optional:true, label:"Or take a skill instead of darkvision (leave empty to keep darkvision)"}]})]},
  "Dhampir": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", unarmed:{name:"Vampiric Bite", die:4, type:"Piercing", ability:"con"}, size:"Small or Medium", speed:{walk:35, climb:35}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Van Richten's Guide to Ravenloft",
    traits:[LINEAGE_SKILLS,
      tr("Deathless Nature", "You don't need to breathe."),
      tr("Spider Climb", "You have a climbing speed equal to your walking speed. From 3rd level you can also move up, down and across vertical surfaces and upside down along ceilings, leaving your hands free."),
      tr("Vampiric Bite", "Your fanged bite is a natural weapon that counts as a simple melee weapon you're proficient with. You add your Constitution modifier, not Strength, to its attack and damage rolls, and it deals 1d4 piercing damage. While you're missing half or more of your hit points, you have advantage on attacks with it. When you hit a creature that isn't a construct or undead, you can empower yourself: regain hit points equal to the bite's piercing damage, or gain a bonus equal to that damage on your next ability check or attack roll. You can empower yourself a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest.")]},
  "Hexblood": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:60,
    languages:{fixed:["Common"], choose:1}, source:"Van Richten's Guide to Ravenloft",
    traits:[LINEAGE_SKILLS,
      tr("Eerie Token", "As a bonus action, you can harmlessly remove a lock of hair, a nail or a tooth. It stays magical until you finish a long rest, and meanwhile, while you're within 10 miles of it, you can use an action to send a telepathic message of up to 25 words to whoever holds or carries it, or to enter a trance for up to 1 minute in which you see and hear from the token's location (you're blinded and deafened to your own surroundings, and the token is destroyed when the trance ends). Once you make a token, you can't again until you finish a long rest, when the missing part regrows."),
      innate(tr("Hex Magic", "You can cast Disguise Self and Hex once each without a spell slot. Each comes back after a long rest, and you can also cast them with any spell slots you have. Intelligence, Wisdom or Charisma (your choice) is your spellcasting ability for them.",
        {pick:[ABILITY_PICK]}), "pick", ["Disguise Self", "Hex"], {slots:true})]},
  "Reborn": {asiText:"+2 to one score and +1 to another, or +1 to three (your choice)", size:"Small or Medium", speed:{walk:30}, darkvision:0,
    languages:{fixed:["Common"], choose:1}, source:"Van Richten's Guide to Ravenloft",
    traits:[LINEAGE_SKILLS,
      wards(tr("Deathless Nature", "You have advantage on saving throws against disease and being poisoned, resistance to poison damage, and advantage on death saving throws. You don't need to eat, drink or breathe, and you don't need to sleep. Magic can't put you to sleep. You can finish a long rest in 4 hours spent inactive and motionless, staying conscious.", null,
        {on:"save", abilities:"all", when:"against disease and being poisoned, and death saving throws"}), {resist:["poison"]}),
      tr("Knowledge from a Past Life", "When you make an ability check that uses a skill, you can roll a d6 right after seeing the d20 and add it to the check. You can do this a number of times equal to your proficiency bonus, and you regain all uses when you finish a long rest.")]}
};

/* Traits renamed to the book's names (2026-10-22): a character's picks
   saved under the old name move to the new one (syncClassPicks). */
export var RACE_TRAIT_RENAMES = {"Cat's Talent": "Cat's Talents", "Artisan's Gift": "Maker's Gift", "Kender Aptitude": "Kender Curiosity"};

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

/* Save DCs a trait sets, worked out on its Features card: {ability
   ("pick" for the ability chosen on the trait), label, when (only once
   this option is picked)}, or a list of them. */
export var TRAIT_DCS = {
  "Taunt": {ability:"pick", label:"Taunt save DC"},
  "Daunting Roar": {ability:"con", label:"Daunting Roar save DC"},
  "Hammering Horns": {ability:"str", label:"Shove save DC"},
  "Fey Step": {ability:"cha", label:"Season save DC"},
  "Celestial Revelation": {ability:"cha", label:"Necrotic Shroud save DC", when:"Fallen"},
  "Natural Weapons": [{ability:"con", label:"Bite poison save DC"}, {ability:"str", label:"Constrict escape DC"}],
  "Animal Enhancement (5th Level)": {ability:"con", label:"Acid Spit save DC", when:"Acid Spit"}
};
/* Half the proficiency bonus on checks that don't already include it,
   like Jack of All Trades (rounded down): {trait name: [abilities]}. */
export var TRAIT_HALF_PROFICIENCY = {"Kefnet's Blessing": ["int"]};

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
