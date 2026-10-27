/* ---------------- Feats Catalog ----------------
   The 2014 rules' feats, one file per source book in ./feats/ and joined
   here into the one list the app uses (custom feats are added to it at
   run time, see js/core/custom-features.js). `source` says which book.
   What taking a feat changes on the sheet (see js/core/feat-picks.js):
     ability        abilities its +1 can go to (one entry: no choice)
     saveProf       also proficiency in saves of that ability (Resilient)
     skills         skill proficiencies to pick (Skill Expert)
     skillOptions   the only skills `skills` can pick from (Squat
                    Nimbleness: Acrobatics or Athletics)
     skillsOrTools  skills or tools to pick (Skilled)
     expertise      expertise picks, in skills the character is proficient in
     armor          armor proficiencies it grants
     weapons        weapon proficiencies to pick (Weapon Master)
     weaponProfs    weapon proficiencies it grants outright (Gunner)
     tools          tool proficiencies it grants outright (Chef)
     toolPicks      {count, group}: tools to pick, from one group of
                    TOOL_GROUPS when `group` is set (Artificer Initiate)
     languages      languages it teaches outright (Fey Teleportation)
     languagePicks  languages to pick (Linguist)
     option         {label, options, details}: one choice that is kept and
                    shown (Elemental Adept's damage type); `details` says
                    what each option does (Strike of the Giants)
     repeatable     can be taken more than once, each time with a
                    different option
     grantsSpells   spells the feat teaches outright (Fey Touched: Misty
                    Step); shown on the Spells tab (see featureSpells).
                    A name, or {name, use}: "long" or "short" for one
                    free cast per rest (the default for a leveled spell),
                    "once" (one cast per long rest at its lowest level
                    and no other way: Magic Initiate), "atwill", "ritual",
                    or "known" (the default for a cantrip)
     grantsByOption {option: [spells]}: spells that depend on `option`
                    (Scion of the Outer Planes' cantrip)
     spellPick      {count, level, schools, ritual, list, names, byOption, label,
                    plural, use, tags}, or a list of them: spells to pick at that
                    spell level, from those schools, from a class's list
                    (`list`: a class or several) or from `names` (with `list`, only the names on that list: Spell
                    Sniper's attack-roll cantrips).
                    `byOption` gives the list or names per `option`
                    (Strixhaven Initiate's college). `ritual`: only spells with
                    the ritual tag (Ritual Caster). count "halfPb" is
                    half the proficiency bonus (Rune Shaper's runes);
                    `tags` names each spell in the picker (its rune).
     castAbility    what the feat's spells are cast with when that isn't
                    its +1: an ability ("cha"), a list to pick from, or
                    {feat}: the one picked for that feat
     castAbilityByOption  {option: ability}: it follows `option` (Magic
                    Initiate's class)
     optionPicks    {set, count}: options to learn from a class option set
                    (js/data/class-options.js); Martial Adept's two
                    maneuvers
     stylePick      a fighting style from the fighter's list (Fighting
                    Initiate); it becomes a style feature on the sheet
     invocationPick an eldritch invocation (Eldritch Adept)
     speed          feet added to walking speed (Squat Nimbleness)
     unarmoredAc    AC without armor is this + DEX (Dragon Hide)
     darkvision     {range, add}, like class features' (Keenness of the
                    Stone Giant)
     requires       {races, raceLabel, level, feat, option}: who can take
                    it; the pickers grey it out for everyone else. A
                    homebrew race is never ruled out. */
import { PHB_FEATS } from "./feats/phb.js";
import { TASHA_FEATS } from "./feats/tasha.js";
import { XANATHAR_FEATS } from "./feats/xanathar.js";
import { OTHER_BOOK_FEATS } from "./feats/other-books.js";
import { DRAGONLANCE_FEATS } from "./feats/dragonlance.js";
import { GIANTS_FEATS } from "./feats/giants.js";
import { PLANESCAPE_FEATS } from "./feats/planescape.js";

export var FEATS_CATALOG = [].concat(PHB_FEATS, TASHA_FEATS, XANATHAR_FEATS, OTHER_BOOK_FEATS, DRAGONLANCE_FEATS, GIANTS_FEATS, PLANESCAPE_FEATS);

/* Campaign rules that hand out feats. The DM decides whether a campaign
   uses them, so they are set per character (c.campaign):
     level1  a feat at creation for a character whose background gives
             none (one that does gets its background's)
     level4  another at character level 4, from this list; a feat's own
             prerequisites still apply (a Knight feat needs Squire of
             Solamnia) */
export var CAMPAIGN_FEATS = {
  "Dragonlance": {label:"Dragonlance: Shadow of the Dragon Queen", level1:["Skilled","Tough"],
    level4:["Adept of the Black Robes","Adept of the Red Robes","Adept of the White Robes","Alert","Divinely Favored",
      "Knight of the Crown","Knight of the Rose","Knight of the Sword","Mobile","Sentinel","War Caster"]},
  "Glory of the Giants": {label:"Bigby Presents: Glory of the Giants", level1:["Skilled","Tough"]}
};
