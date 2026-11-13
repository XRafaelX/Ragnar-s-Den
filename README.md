# Ragnar's Den · Character Creator v4.0.0

An offline-first, browser-based D&D 5e character creator and interactive character sheet. No accounts, no ads, and no internet connection required after initial load.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Setup & Run](#setup--run)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Team](#team)
- [License](#license)

---

## Overview

**Ragnar's Den** is a lightweight, responsive Progressive Web Application (PWA) designed for tabletop roleplaying game players (D&D 5th Edition). It allows players to create, customize, and manage multiple character sheets with real-time stat calculations, an interactive dice roller, an integrated compendium, custom homebrew creation, and local offline persistence.

---

## Features

- **Character Creation Wizard**: Guided character creation workflow with SRD and expanded options:
  - Step-by-step selection for 115 Races (SRD, expanded, Eberron dragonmarks, Plane Shift and lineages, with subraces, detailed trait summaries, and Variant Human custom feats/ASIs) plus the 2024 Player's Handbook's 10 species, Classes, Backgrounds, Alignments, and starting Equipment.
  - Flexible ability score generation supporting Standard Array, Point Buy (with real-time budget calculator), Manual entry, and Rolling stats with re-roll options.
  - Integrated spell selection for spellcasting classes (cantrips and leveled spells), including always-prepared class spells and domain spell choices.
- **Interactive Character Sheet**:
  - **Identity & Banner**: Dynamic character card with custom avatar upload, built-in image cropper, custom banner backdrops, inspiration toggle, passive perception, character title, and level indicator.
  - **Vitals**: Real-time HP tracking (Current, Max, Temp): drag the HP bar sideways (left for damage, right for healing) or hold an arrow to count faster, hit dice tracker, death saving throws, armor class with full breakdown tooltip, initiative, and rests.
  - **Abilities & Skills**: Ability scores, modifiers, saving throws, and skill proficiencies with proficiency and expertise markers.
  - **Features & Traits**: Class features, racial traits, feats, and custom feature creation with "NEW" indicator badges on level-up.
  - **Spellbook & Slots**: Track cantrips and prepared spells, filter by spell level, manage spell slot usage (including multiclassing and Warlock Pact Magic), and toggle prepared state on long rest.
  - **Spells known and prepared**: The level-up's New spells step teaches each class the spells its table allows (and offers the swap the class gets), with counts per class on the Spells tab. Preparing classes get the prepared limit and a Prepare today sheet after a long rest. Bard's Magical Secrets, Mystic Arcanum, a third caster's school limits, and the spells a dragonmark or Ravnica guild adds to a caster's list are all included.
  - **Spells that grow**: A spell's card shows what it does at the character's level: cantrip dice by character level, Eldritch Blast's beams with the warlock's invocations, a warlock's spells at its pact slot level, and the Higher slots rule for other casters.
  - **Inventory & Armory**: Currency tracker (cp/sp/ep/gp/pp) with smart coin breaking, equipment list with item weights, equipped weapon/armor management with hand-to-hand logic.
  - **Coin Purse**: Full copper/silver/electrum/gold/platinum tracking with change-giving when spending.
  - **Magic items**: All 340 magic items of the SRD 5.1 plus the DM's own (grouped as Panais Magic Items), added from the Inventory tab, and the 16 more the 2024 artificer can make from its plans. Attunement follows the rules (3 items, 4 to 6 for an artificer, never two copies), and what an item does works on the sheet while it should: weapon and armor bonuses, Ring of Protection, items that set or raise an ability score, charges regained at dawn, potions that roll their healing, Flame Tongue lit while held.
  - **Firearms and new weapons**: The DMG's pistol and musket in their own category (proficiency from the Gunner feat), the double-bladed scimitar and Revenant Blade, and Plane Shift: Amonkhet's khopesh and two-handed khopesh (treated as a longsword and a greatsword, so proficiency with one covers the other).
  - **Conditions**: The fourteen conditions and six levels of exhaustion, behind a button on the Hit points card. What they do is applied by itself: disadvantage on attacks or checks, automatic STR and DEX save failures, speed 0, lower passive scores, and a long rest that takes off a level of exhaustion.
  - **Active Effects**: Toggle on/off effects like Bladesong, the Astral Self, and Symbiotic Entity, each paid with the right class resource.
  - **Remember card**: A card on the Vitals tab for the features new players forget mid-fight, grouped as Bonus actions, Reactions and Always on: Cunning Action, Uncanny Dodge, a paladin's auras, Sentinel, Polearm Master, a halfling's Lucky and many more from every class, subclass, fighting style, invocation, feat and race. Only what the sheet doesn't already apply or show is listed, a tap opens the full text, and experienced players can fold the card away per character.
  - **Class features at work**: Every class's and subclass's features were checked against the books and put to work on the sheet wherever there's something to work out: buttons on weapon and spell cards, uses on the Vitals tab, Active effects, rerolls and follow-ups in the dice tray. That includes all 15 of Tasha's optional class features (Primal Awareness, Nature's Veil, Steady Aim, Focused Aim, Quickened Healing, Dedicated Weapon, Harness Divine Power, Blessed Strikes, Wild Companion, Magical Guidance and more).
  - **2014 or 2024 classes**: Each class picks the 2014 rules or the 2024 rules, on the Class step's Optional rules card ("2024 Fighter"), on the Information tab, or when multiclassing ("Which fighter?"). All 13 classes have their 2024 version, from the 2024 Player's Handbook (the artificer from Eberron: Forge of the Artificer), with their features at work on the sheet and the book's four subclasses each, plus the Cartographer and Ravenloft's Reanimator for the 2024 artificer. Older subclasses with no 2024 version stay available. A 2024 monk, for example, gets Focus Points, the d6 to d12 Martial Arts die, Uncanny Metabolism and Deflect Attacks. The Compendium's class pages switch between the two.
  - **2024 character rules**: An Optional rules card turns on the 2024 Player's Handbook's character rules, and picking one of its ten species turns it on by itself. A 2024 background (all 16 from the book) gives the ability increases in place of the race's and an Origin feat, characters speak Common plus two languages, and the sheet uses the book's versions of its 391 spells and of the weapons it changed. The older races and backgrounds the book rewrote stay on the lists, moved to the end and marked "(2014)". Races, backgrounds and classes can be mixed freely.
  - **Weapon Mastery**: The eight mastery properties on the weapons that have one, for a 2024 class's Weapon Mastery picks and the Weapon Master (2024) feat, shown on each weapon card (Nick's off-hand attack, Topple's save DC and more).
  - **Race traits at work**: A race's resistances, innate spells (with their free casts and save DC), speeds, senses and effects go on the sheet by themselves, and every trait's text was rewritten against the books' wording. A dragonmark's Intuition die is added to its skill checks.
  - **Death Saves**: Track successes and failures with automatic stabilization.
  - **Companions**: Full companion panel for Steel Defender, Eldritch Cannon, Drake Companion, Wildfire Spirit, Beast Master beast, Tasha's primal beasts and Blighted Sapling, with HP tracking, beast form entry, and long rest restoration. Find Familiar's forms and Pact of the Chain's familiars use the SRD's stat blocks, a Cavalier gets a Mount card, and a new companion shows a NEW dot on the Companions tab until it's opened.
  - **Artificer Infusions**: Dedicated infusions tab and picker for Artificer characters. An Armorer 9's Arcane Armor takes infusions as four parts (chest, boots, helmet, model weapon). The 2024 artificer makes magic items from plans instead (Replicate Magic Item): a Plans card on the Features tab to learn plans and make items after a long rest.
  - **Warlock Invocations**: An Eldritch invocations card for Warlocks with all 54 invocations (PHB, Xanathar's, Tasha's) and the four Pact Boons. The level-up asks for new invocations when due (and offers a swap every warlock level), greys out ones whose prerequisites aren't met, and the sheet applies what they do: at-will and once-a-day spells on the Spells tab, uses on Vitals, Beguiling Influence's skills, Gift of the Depths' swim speed, Devil's Sight in senses and an Eldritch Blast summary.
  - **Class options**: Picked on the level-up's Options step and listed in their own Features-tab cards with costs, save DCs and dice: a sorcerer's Metamagic, a Battle Master's maneuvers (also Martial Adept's and Superior Technique's), a Rune Knight's runes (Stone rune darkvision, invocation uses by runes known), Arcane Shots, a Four Elements monk's disciplines, the Hunter's four choices, Totem Warrior animals (Elk and Eagle speeds while raging), the Storm Herald's environment, the Misfortune Bringer's misfortunes and the Gunslinger's trick shots (with its grit points), each with the book's rules for when one can be swapped.
  - **Race proficiencies**: What a race's traits give goes on the sheet by itself: an elf's Perception and weapon training, a dwarf's weapons and armor, a gnome's tinker's tools, a githyanki's swords. Traits with a choice (a dwarf's tool, a kenku's or lizardfolk's two skills, a hobgoblin's two martial weapons, a githyanki's skill or tool, a satyr's instrument) are picked on the wizard's Race Traits step, and older characters pick them on the Features tab's Feature choices card. Race weapons count as proficient on the Inventory tab, and the Information tab lists the race's weapons, armor and tools.
  - **Class tool choices**: A first artificer's artisan's tools, a bard's three instruments and a monk's tool or instrument are picked on the creation wizard's Class Features step (or on the Feature choices card for an older sheet), and the Information tab lists them in place of the "of your choice" line. A sheet from before keeps its earlier picks.
  - **Background equipment**: The creation wizard's Equipment step shows what the background starts with (every one of the 102 checked against its published page) and asks for its choices: a prayer book or a prayer wheel, which artisan's tools (starting on the ones the background's proficiency picked), a Dimir Operative's secondary guild. Trinkets are rolled on their own table, with Roll again or a pick from the list: the Player's Handbook's, Curse of Strahd's Gothic Trinkets (Haunted One), Van Richten's Horror Trinkets (Ravenloft Investigator) and the Feywild Trinkets (Feylost, Witchlight Hand). The new character carries it all and has its coins in the purse; a belaying pin arrives as a club to attack with. A character made before this gets a one-time card at the top of the Inventory tab: Add it (with the same choices and rolls) or No thanks, and the card doesn't come back.
  - **Personality and background story**: A Personality card on the Information tab with two personality traits, an ideal, a bond and a flaw, and the background's own story tables (a Haunted One's Harrowing Event, a Criminal's Specialty, a Feylost's Fey Mark, Ravnica contacts...), from each background's published page. Each tile rolls on its table or opens a sheet to pick an entry or write your own; Roll all fills the empty ones. A Faith tile picks a god from the Player's Handbook's pantheons or Wildemount's Pantheon of Exandria (or one of your own), shown as a card with its holy symbol, alignment and domains. Sword Coast backgrounds use the Player's Handbook tables their page names; nothing asks for these at creation.
  - **Background proficiencies**: A background's tools go on the sheet (an Urchin's disguise kit and thieves' tools), and its choices are picked on the wizard's Skills step: a gaming set, an instrument, artisan's tools, "an instrument or artisan's tools", an Urban Bounty Hunter's two different kinds, a Guild Merchant's navigator's tools or extra language, and a House Agent's house, which sets its two tools from the House Tool Proficiencies table. A background's own language (a Rune Carver's Giant) is added for you, and a Ravnica guild's language comes from its short list. Older characters pick their background's tools on the Features tab's Feature choices card, which also offers to correct skills this app once had wrong (a Lorehold Student's Arcana for Religion). All 98 backgrounds were checked against the published pages.
  - **Proficiencies gained twice**: As the Basic Rules allow, a skill or tool two sources give (an elf's Perception and a Far Traveler's, a rogue's thieves' tools and an Urchin's) earns a pick of another of the same kind, asked on the wizard's Skills step or the Feature choices card, and a pick list that runs short (a kenku whose class and background already cover its skills) offers any other skill or tool so no pick is lost.
  - **Unarmed strikes and monk weapons**: An unarmed strike card on the Inventory tab for characters who use one: a monk (the Martial Arts die and DEX while unarmored), a race with natural weapons (a tabaxi's claws, a minotaur's horns, a lizardfolk's bite) and a Tavern Brawler; rage and Song of Victory add to it. A monk weapon rolls the Martial Arts die once it's bigger than its own. Starting equipment that says "any simple weapon" or "any martial melee weapon" is a weapon picker in the creation wizard (weapons the class can't use greyed out), so the new character starts with a real weapon.
  - **Advantage from features**: Rolls that always have advantage roll that way, with an "Adv" tag: initiative for a barbarian's Feral Instinct, STR checks, Athletics and STR saves while raging, a vedalken's INT, WIS and CHA saves and a verdan's WIS and CHA saves. Advantage that depends on the situation (Dwarven Resilience against poison, Fey Ancestry against being charmed, Gnome Cunning against magic, Danger Sense against effects you can see) is listed under the Saving throws card as a reminder. Initiative also takes the disadvantage of armor worn without proficiency.
  - **Fighting styles**: Picked at a class's Fighting Style level, Champion 10 and College of Swords 3. Tasha's styles add their effects (Blind Fighting's blindsight, Superior Technique's maneuver and die, Blessed and Druidic Warrior's cantrips, Thrown Weapon Fighting's +2 on a thrown weapon's ranged damage, Unarmed Fighting's d6 or d8 unarmed strike and its 1d4 to a grappled creature). Archery, Defense and Dueling add their bonuses. With two light melee weapons in hand (any one-handed ones with Dual Wielder) each weapon card gets an Off-hand damage button for the bonus action attack: no ability modifier unless it's negative, or with it for Two-Weapon Fighting. A thrown melee weapon gets Thrown buttons when its ranged attack rolls differently (Archery, Thrown Weapon Fighting, no rage damage).
  - **Cantrip swaps**: The level-up's New spells step lets an artificer replace one artificer cantrip each level. With Tasha's optional features on, at Ability Score Improvement levels: Cantrip Versatility (cleric, druid), Sorcerous Versatility (a cantrip there, or a Metamagic option on the Options step, not both), Bardic Versatility (a cantrip, or one Expertise skill moved to another proficient skill) and Eldritch Versatility (a cantrip, the Pact Boon, picked again on the Invocations step, or from level 12 a Mystic Arcanum spell). Blessed and Druidic Warrior may change one of their cantrips each paladin or ranger level on the Style step. A wizard 3 with Cantrip Formulas swaps one wizard cantrip in the sheet that opens after a long rest. Undo takes every swap back.
  - **Spells cast without a slot**: Features that cast a named spell for free, at will or for ki list it on the Spells tab with a short tag ("At will", "Free 1/long rest", "2 ki", "3 Jinx Points") and the rule in the tag's tooltip: Thousand Forms, Visions of the Future, Misty Wanderer, Shadow Arts, Searing Arc Strike, Empty Body, Consult the Spirits and more, with a save DC for classes that don't cast. Signature Spells get a counter per spell on Vitals.
  - **Feats**: All 180 feats: the 2014 rules' 106 (Player's Handbook, Tasha's Cauldron, Xanathar's racial feats, Mordenkainen's Tome of Foes, Eberron, Fizban's, Strixhaven, Dragonlance, Bigby's Glory of the Giants, Planescape and the Book of Many Things, plus the Gunslinger fan content's Sidearm Mastery) and the 2024 Player's Handbook's 74 (Origin, General, Fighting Style and Epic Boon feats). A feat's choices are made in the level-up or the creation wizard and applied to the sheet: ability increases, skills, tools, languages, spells (cantrips, free casts per rest, at will or ritual, with the right save DC), uses on the Vitals tab that follow the proficiency bonus, a fighting style (Fighting Initiate), an invocation (Eldritch Adept), Metamagic and its sorcery points (Metamagic Adept), runes (Rune Shaper), speed, AC and darkvision. Feats for another race, a higher level or after another feat are greyed out with the reason. The 13 backgrounds that give a feat grant it in character creation (a Wildspacer's Tough, a Lorehold Student's Strixhaven Initiate with the college already set, an Astral Drifter's Magic Initiate as a cleric), with a Background Feat step for its choices; an older sheet is offered the feat on the Features tab. A per-character Campaign setting (the wizard's Background step, or Optional rules on the Information tab) turns on a campaign book's bonus feats: in a Dragonlance or Glory of the Giants campaign a character whose background has no feat picks Skilled or Tough at level 1, and Dragonlance's level-up adds a Campaign feat step at character level 4.
  - **Optional rules**: Set once at the start of character creation, on the Class step's Optional rules card (Tasha's optional class features, the campaign books, the 2024 character rules and the 2024 class, with a line saying what Tasha's adds for the chosen class), and changed later on the Information tab's card. Later wizard steps only note what Tasha's would add while it's off; turning it off drops the picks only it allows. Tasha's optional class features: Tasha's extra fighting styles, Metamagic, maneuvers, invocations and Pact of the Talisman, the 65 spells Tasha's Additional Spells adds to the class lists (marked "Tasha's optional" in the spell pickers, the level-up and the wizard's Spells step, which has the switch too), plus swapping a style, Metamagic option or maneuver at Ability Score Improvement levels.
  - **Journal & Information**: Rich notes, backstory, physical characteristics, proficiencies (languages, weapons, armor, tools), and custom notes.
- **Monsters Browser**:
  - Searchable monster compendium of 331 monsters in 13 categories, with full stat blocks, each checked against the Monster Manual.
  - Customize and create your own monsters for encounters.
- **Encounters** (for the DM):
  - Named encounters saved in this browser, ready to prepare before a session and run again later with Reset (or Duplicate).
  - Add monsters from the Monster Catalog (homebrew too); each gets a box with its AC, speed and hit points, and a trail of every HP value it went through, like on paper. Boxes can be renamed.
  - Type in the players' names, then drag monster boxes into the numbered turn order (mouse or finger) and drag lines to reorder. Next turn moves down the line, skips downed monsters and counts rounds.
  - Conditions on monsters: the fourteen conditions plus Hexed, Cursed, Slowed, Asleep and Blessed, shown as chips on each box (asking what the caster chose where a spell needs it).
  - Encounters are included in backup export and import.
- **Dungeons** (for the DM):
  - Draw dungeon maps on a grid of 5 ft squares: rooms (square or round), corridors (straight or diagonal), doors, secret and locked doors, stairs and lit areas. Walls follow by themselves where floor meets rock. A random dungeon generator makes a map to start from.
  - Several maps per dungeon (an entrance, a first level...), stepped through like slides, with stairs linked between them. Seven map styles (stone, cave, blueprint, wood, ice, volcanic, overgrown), a picture of your own under a map to trace over, numbered room notes only the DM sees, and undo.
  - Play mode puts the map under fog. A tap on a room or corridor shows it to the players, or walk the party marker and the map opens up as far as the party can see (torchlight, darkvision or daylight).
  - A Player view opens in a second tab or window (for a TV or a second screen) and shows only what the DM has revealed, live, with a point-at marker and a pause screen. No server or internet connection needed.
  - Save a map as a picture. Dungeons and their pictures are included in full backups.
- **Compendium & Reference Overlays**:
  - Built-in searchable compendium for Races, Classes, Subclasses, Backgrounds, Alignments, Feats, Spells, Weapons, Armor, and Infusions.
  - All 118 backgrounds (102 older ones and the 2024 Player's Handbook's 16) have full skill/tool entries and descriptive blurbs. Backgrounds that let you choose skills (Haunted One, Urban Bounty Hunter, Cloistered Scholar...) ask for them on the wizard's Skills step.
  - Inspect full trait descriptions, spell requirements, and item properties without leaving the app.
- **Custom Homebrew Builder**:
  - Create and manage custom Subclasses, Races, Backgrounds, Spells, Items, Features, and Monsters directly in the Compendium.
  - Custom homebrew entries integrate seamlessly into the character creation wizard, leveling system, and sheet displays.
  - Stored independently in local storage and included in exported backups.
- **Levelling, Subclasses & Multiclassing**:
  - XP tracker with a guided Level-Up flow: advance primary class or multiclass (with ability score prerequisites enforced).
  - All 13 classes fully progress to level 20 with complete feature sets and subclass options.
  - Choose subclasses when due, select Ability Score Improvements (ASI) or Feats, and roll or average HP.
  - Automatic recalculation of spell slots and proficiency bonus.
  - Undo level-up option to revert the most recent level advancement.
- **Built-in Dice Roller Tray**:
  - Floating dice tray supporting d4, d6, d8, d10, d12, d20, and d100.
  - Multiplier controls, flat modifiers, advantage and disadvantage toggles, dice re-rolling, and an interactive roll history log.
  - The tray keeps one height so the dice never jump. After a roll it offers what a feature allows next (critical damage, Focused Aim after a miss, Magical Guidance's reroll and more), and a hit's buttons stay until each is used.
- **UI & Customization**:
  - **Themes & Palettes**: Theme selector with multiple color palettes and themed dropdown pickers.
  - **Interactive Sound Effects**: Audio feedback for dice rolls, leveling, buttons, and character actions.
  - **Onboarding Tutorial**: Interactive step-by-step guided tour highlighting major features.
  - **Responsive Design**: Mobile-friendly layout with slide-out sidebar navigation, bottom sheets, and desktop-optimized panel grids.
  - **About**: Credits for every source and asset, the privacy policy and the license, in the About dialog.
- **Offline & Local Storage**:
  - Stores character sheets and custom homebrew in browser `localStorage`.
  - Export and import full vault backups as JSON files, named by date, time and app version (`ragnars-den-backup_2026-11-03_2145_v4.0.0.json`).
  - PWA installable on desktop and mobile devices with Service Worker offline caching (`sw.js`).

---

## Tech Stack

- **Language**: JavaScript (ES6+), organized as native ES modules (no bundler; `js/app.js` is loaded with `<script type="module">` and imports the modular `js/` tree directly), HTML5, CSS3 (using CSS variables / design tokens).
- **Frameworks & Libraries**: Bootstrap 5 (bundled locally for grid and base components).
- **Architecture**: Static Single-Page Application (SPA) / Progressive Web App (PWA).
- **Storage**: Browser `localStorage`, one key per kind of data: `ragnarsDen.characters.v1`, the homebrew made in the Compendium (`ragnarsDen.customSubclasses.v1`, `ragnarsDen.customRaces.v1`, `ragnarsDen.customBackgrounds.v1`, `ragnarsDen.customSpells.v1` and the rest of `ragnarsDen.custom*.v1`), `ragnarsDen.encounters.v1`, `ragnarsDen.dungeons.v1` and `ragnarsDen.theme.v1`. Pictures under dungeon maps are too big for `localStorage` and live in IndexedDB (`ragnarsDen.mapImages`).
- **Package Manager / Bundler**: None (all dependencies and assets are self-contained without npm build steps).

---

## Requirements

- Any modern web browser with JavaScript enabled (e.g., Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge).
- For Service Worker / PWA installation: Must be served over `localhost` or an HTTPS connection.

---

## Setup & Run

No build step or dependency installation is required.

### Quick Start (Direct File Access)

Open `index.html` directly in your browser by double-clicking it.
*(Note: Service Worker caching and PWA installation features may be disabled by browser security policies when running via `file://` protocol).*

### Local Development Server (Recommended for PWA features)

Run a local HTTP server using any of the following options:

#### Option 1: Python 3
```bash
python3 -m http.server 8000
```
Then navigate to [http://localhost:8000](http://localhost:8000) in your browser.

#### Option 2: Node.js / npx
```bash
npx serve .
# or
npx http-server . -p 8000
```

#### Option 3: PHP
```bash
php -S localhost:8000
```

### Publishing Updates

The live app is served by GitHub Pages from `main` at <https://xrafaelx.github.io/Ragnar-s-Den/>. Install it from that URL (browser menu → "Install app" or "Add to Home Screen") and it updates itself: when a new release is pushed, the app shows a "new version is ready" banner, and tapping **Update** reloads onto it. If the banner is ignored, the update applies the next time the app is fully closed and reopened.

Releases are detected through `sw.js`. A pre-commit hook in `.githooks/` stamps it with a new `BUILD` id and regenerates its offline file list on every commit that touches app files. It also runs `npm test` first and blocks the commit if a test fails. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

---

## Available Scripts

The app needs no build step. `package.json` exists only to run the tests and has no dependencies.

- `npm test`: runs the full automated test suite with Node's built-in test runner (Node 22 or newer).
- `node --import ./tests/setup.mjs --test tests/rogue.test.mjs`: runs one test file. Add `--test-name-pattern="Sneak Attack"` to run only the tests whose names match.

---

## Testing

Run `npm test` (Node 22 or newer; no install needed). The suite lives in `tests/` and completes in a few seconds. **1184 tests, 0 failures.**

- `coins.test.mjs`: coin parsing, spending, change-giving, and formatting.
- `data.test.mjs`: class, subclass and resource data is complete and well-formed. Every subclass reaches its top level, `replaces` points at a real earlier feature, feature flags use known names and valid values, every Resources card entry belongs to a subclass that exists, counters stay sane at every level, the spell catalog is well formed (the size of the catalog, every class's count, artificer spells at every level, Tasha's Additional Spells kept off the class lists until the switch is on), and text has no long dashes.
- `rules.test.mjs`: sheet calculations against hand-worked 2014 rules numbers: proficiency bonus, Sneak Attack and Martial Arts scaling, speed bonuses, rage, initiative, Armor Class (unarmored defenses, Dual Wielder, Defense style, Soul of the Forge), saving throws (Aura of Protection, Diamond Soul, Resilient), Battle Ready and Hex Warrior attacks, proficiency grants, rests, spell slots, feat resources, feat picks, spell choices, speeds, artificer weapons and elixirs, and companions.
- `smoke.test.mjs`: every class and subclass at every level from 1 to 20, plus multiclass builds, runs through every sheet calculation without errors.
- `project.test.mjs`: every file in the service worker's offline list exists, every relative `import` resolves, and `index.html`'s local scripts and stylesheets exist.
- `bugfixes.test.mjs`: 12 regression tests covering each bug fixed in v2.0.0: `startEffect` null guard, `undoLastLevelUp` deleted-feat guard, Monk Unarmored Defense 0-AC shield, `wisModPlusOne` missing abilities, Defense style with shield only, shield proficiency contains-check, `ordinal()` teen suffixes, and the stale `c.ac` render write.
- `warlock-feats.test.mjs`: the Haunted One and background skill picks (through the real creation wizard), Fey Touched (spell picks, DC, free casts, Variant Human), and eldritch invocations: every invocation's prerequisite, learning and forgetting, the spells, uses, speeds and senses they give, the Eldritch Blast summary, and the level-up's Pact Boon, new picks, swap and undo. `fake-dom.mjs` is the stand-in DOM it shares with `bugfixes.test.mjs`.
- `class-options.test.mjs`: Metamagic and maneuver data, what each level-up asks for under each swap rule (with and without Tasha's optional features), slots, problems, learning, swapping and undoing (also through the real undo), Martial Adept's maneuvers, and the cards in every state.
- `feature-casts.test.mjs`: features that cast a spell without a slot (at will, free, ki and Jinx Point casts: kind, tag, tooltip, save DC), a later feature's tag on a spell an earlier one gives, and Signature Spells' counter per spell.
- `fighting-styles.test.mjs`: the PHB's and Tasha's fighting styles, when each is due (class levels, Champion 10, College of Swords 3), the Tasha's switch, Martial Versatility, a style's own picks and what it does on the sheet, the real undo of a swap, and the wizard's level 1 style.
- `class-picks.test.mjs`: the proficiencies class and subclass features give or let the player choose (Expertise, a subclass's skills, tools, languages, saving throw or weapons, the skill a second class adds): the data against the books, what each picker offers, applying and taking back, the level-up's Proficiencies step and its undo, the creation wizard, and the Features tab card. Also the spells features let you choose (an Arcana cleric's wizard cantrips and Arcane Mastery, Reaper, Acolyte of Nature, Circle of the Land's cantrip, Arcane Archer, Path of the Giant, a wizard's Spell Mastery and Signature Spells): what is offered, how they show on the Spells tab, and what counts against spells known or prepared. And a ranger's favored enemies and terrains at each level, Tasha's Favored Foe and Deft Explorer in their place (creation, multiclassing and on the sheet), a Draconic sorcerer's Dragon Ancestor, and older sheets' custom features moved onto the feature.
  Also a class's starting tool choices: asked in the wizard, applied on the engine, listed in place of the placeholder, not for a second class, and an older sheet's custom feature moved onto the pick.
- `race-profs.test.mjs`: the skills, weapons, tools and armor race traits give or let the player choose: the data, what each race gets, what the sheet applies by itself (new and older sheets), a dwarf's tool, a kenku's skills, a hobgoblin's martial weapons, a githyanki's skill or tool, a satyr's instrument and a warforged's skill and tool, older characters' picks moved over, the Feature choices card, and the creation wizard's Skills and Race Traits steps.
- `background-story.test.mjs`: every background's personality and story tables (complete, borrowed ones exist, no long dashes), who borrows what (variants everything, Sword Coast backgrounds only traits and motivations), rolls (ranges, a second trait that differs), and the Personality card.
- `background-gear.test.mjs`: every background's starting kit (catalog items, weapons, groups and trinket tables all exist, coins), kits as published and their variants, choices (a group starting on the background's tool, options that ask more, a Dimir Operative's secondary guild), trinket rolls (tables of pairs too), adding a kit to a sheet, and the older sheet's one-time offer.
- `background-profs.test.mjs`: background data against the published pages (skills, language counts, tools), each kind of tool pick (a gaming set, one of two kinds, Urban Bounty Hunter's two kinds, a House Agent's house, a Guild Merchant's tool or language), older sheets' skill corrections, a shifter's type skill, and the wizard's Skills and Languages steps.
- `overlap.test.mjs`: proficiencies gained twice: a pick list that runs short widens to any skill or tool, and a skill or tool two sources give earns a replacement (sources, the Feature choices card, taking it back, the wizard's Skills step).
- `unarmed-weapons.test.mjs`: the Martial Arts die on monk weapons (by level, not in armor or with a shield), unarmed strikes (a monk's, natural weapons, Tavern Brawler, rage), and the starting weapon picks (every "any ... weapon" item a real weapon; a barbarian's glaive, a druid's crossbow it can't use, a ranger's two picks).
- `advantage.test.mjs`: advantage that always applies (Vedalken Dispassion, Telepathic Insight, Feral Instinct on initiative, Rage on STR) and situational reminders (Dwarven Resilience, Gnome Cunning, Fey Ancestry, Danger Sense), and initiative's armor disadvantage.
- `cantrip-swaps.test.mjs`: the artificer's cantrip swap each level (and undo), Tasha's Cantrip Versatility by level and switch, Sorcerous Versatility's one-thing rule, Blessed and Druidic Warrior swaps on the right class's levels, Bardic Versatility's Expertise move, Eldritch Versatility's Pact Boon change (stranded invocations, undo) and Mystic Arcanum swap, and Cantrip Formulas.
- `styles-combat.test.mjs`: Thrown Weapon Fighting (thrown ranged damage only, a dart always), throwing as a ranged attack (Archery to hit, no rage), Unarmed Fighting (d6, d8 with nothing in hand, the grapple die, natural weapons and Martial Arts), and two-weapon fighting's off-hand damage with and without the style, Dual Wielder and what doesn't qualify.
- `edge-cases.test.mjs`: the level-up's ability step when fewer than two points fit under 20, the ability a weapon attack uses on a tie (armor's penalty, rage), a subclass's speed and HP extras when picked on the sheet, a warlock's Eldritch Blast from a feat meeting an invocation's prerequisite (a non-warlock's Eldritch Adept still can't), and undo keeping spell slots added by hand.
- `gear.test.mjs`: the gear list behind the Inventory tab's "+ Add item" (143 items in eight groups, prices, weights and bundles against the Player's Handbook tables) and adding from it: a new row, a bundle's quantity, stacking on what is already carried.
- `conditions.test.mjs`: the fourteen conditions and exhaustion: older saves, what each condition does to rolls, saves and speed, exhaustion's levels and passive scores, the long rest, and the panels drawn with conditions on.
- `encounters.test.mjs`: adding monsters, damage and healing trails, the turn order (dragging, rearranging, skipping downed monsters, rounds), reset, saving and duplicating, and backup import.
- `familiars.test.mjs`: beast and familiar stat blocks against the bestiary, Find Familiar and Pact of the Chain, and the Companions tab's NEW dot.
- `magic-items.test.mjs`: the DM's items (Heavy Holster, Trident of Returning, Duality) and attunement limits.
- `srd-magic-items.test.mjs`: the SRD's 340 items: magic weapons and armor, bonuses that need attunement, AC and save items, items that set or raise a score, charges and potions of healing, Flame Tongue.
- `new-races.test.mjs`: every race's data and choices, the published numbers, natural armor, trait advantage, Custom Lineage, racial feats for subraces, race resources, and Half-Elf (Variant).
- `spells-known.test.mjs`: spells-known tables, the New spells step (patron spells, Tasha's, catching up, multiclassing, Magical Secrets, third casters, Mystic Arcanum), apply and undo, the prepared limit and preparing, and spells a feature or origin grants.
- `spell-scaling.test.mjs`: every scaling entry, cantrip dice by level, Eldritch Blast's beams, a warlock's spells at pact slot level, and the Higher slots rule.
- `gunslinger.test.mjs`: the Gunslinger archetype (features, firearm and tinker's tools proficiency, trick shots and grit points, Quickdraw's initiative, the firearms and fire lance, Sidearm Mastery's +2 damage)
- `weapons-languages.test.mjs`: firearms and Gunner, infusion targets, the double-bladed scimitar and Revenant Blade, and every language a race or background teaches.
- `backup-name.test.mjs`: the backup file's name (local date, time and app version).
- `backup.test.mjs`: exporting chosen characters: only those characters and the homebrew they use, and the export file's name.
- `barbarian.test.mjs`, `fighter.test.mjs`, `rogue.test.mjs`, `monk.test.mjs`, `paladin.test.mjs`, `ranger.test.mjs`, `cleric.test.mjs`, `druid.test.mjs`, `bard.test.mjs`, `sorcerer.test.mjs`, `warlock.test.mjs`, `wizard.test.mjs`, `artificer.test.mjs`: one file per class, every class and subclass feature checked against the books and what the sheet does with it. Each class also has a `<class>-2024.test.mjs` file for its 2024 version and subclasses (`monk-2024.test.mjs` is below).
- `monk-2024.test.mjs`: the 2014 or 2024 monk choice, the 2024 class features and Focus Points, the four 2024 Warriors, older subclasses' wording, and multiclassing into a 2024 monk.
- `artificer-2024.test.mjs`, `artificer-2024-subclasses.test.mjs`, `artificer-new-subclasses.test.mjs`, `artificer-plans.test.mjs`: the 2024 artificer from Eberron: Forge of the Artificer, its four subclasses, the Cartographer and the Reanimator, and Replicate Magic Item's plans and the items they make.
- `species-2024.test.mjs`, `backgrounds-2024.test.mjs`: the 2024 Player's Handbook's ten species and 16 backgrounds against the book, their choices on the sheet, the ability increases that replace the race's, the Origin feats, and how a 2024 species turns the 2024 character rules on.
- `feats-2024-general.test.mjs`: the 2024 General, Fighting Style and Epic Boon feats against the book's feat list, who qualifies, and what they do on the sheet.
- `spells-2024.test.mjs`: all 391 spells of the 2024 Player's Handbook, the switch that shows them to a character on the 2024 rules or with a 2024 class, and their scaling.
- `weapon-mastery.test.mjs`, `weapons-2024.test.mjs`: each weapon's mastery property and who can use it (Nick, Topple's DC, the 2024 Heavy rule), and the weapons the 2024 book changed.
- `older-versions.test.mjs`: on the 2024 rules, the older races and spells the book replaced move to the end of their lists, marked "(2014)".
- `class-gaps.test.mjs`: small rules gaps closed after the class reviews (pact slots for the 2024 patrons, Lifedrinker's healing, Vex, the 2024 druid's Known Forms).
- `dungeons.test.mjs`: the DM's dungeon maps: painting, walls, resizing, undo, fog and the Player view, the party's sight, doors, stairs, notes, styles and the random generator.
- `tasha-additions.test.mjs`: Tasha's optional class features: when each is offered, swaps and additions, and what each does on the sheet.
- `reminders.test.mjs`: the Remember card: which features carry a reminder, groups and order, picks that change a line, lines that fit the card, and nothing the sheet already applies.
- `hp-drag.test.mjs`: changing hit points by dragging the HP bar or holding an arrow (the whole bar is the maximum, it stops at 0 and at full, temporary HP and the Arcane Ward soak damage first, a Wild Shape form's own bar).
- `race-automation.test.mjs`, `race-spells.test.mjs`, `race-texts.test.mjs`: race traits the sheet applies (effects, resistances, speeds, senses), the innate spells traits give, and the trait texts against the books.
- `shillelagh.test.mjs`: Shillelagh's club or quarterstaff (spellcasting ability and a d8 while it's on, only in hand, ended by a rest or 0 hit points).
- `encounter-quips.test.mjs`: the combat tracker's jokes (plain sentences, only known fill-ins).
- `feats.test.mjs`: the feat catalog (every feat well formed, and every spell, option set, race and feat an entry names exists) and what the newer feats do: Linguist's languages, tool and weapon proficiencies, spell feats with their kinds, casting ability and free casts, Strixhaven Initiate's college, the Dragonlance, giant and Planescape chains and who can take them, racial feats, Squat Nimbleness, Dragon Hide, darkvision, proficiency-bonus uses, Rune Shaper's runes, Fighting Initiate, Eldritch Adept, Metamagic Adept, Magic Initiate's class, cantrips and spell, the backgrounds that give a feat, campaign bonus feats, and the wording rules for feat and spell text (plain sentences, no semicolons, dashes or shorthand).

`tests/setup.mjs` gives the browser modules just enough of `window`, `document` and `localStorage` to load in Node. The tests check data and calculations, not rendering. Use the checklist below for the screens.

### Manual Verification Checklist

1. **Character Creation**: Click **+ New Character** to open the wizard, choose race/class/background/abilities, and confirm the sheet is created with computed modifiers.
2. **Character Sheet Updates**: Edit character attributes, health, inventory, and notes; refresh the page to verify data persistence in `localStorage`.
3. **Compendium & Homebrew**: Open the Compendium from the home screen, browse races, classes, spells, and items, create a custom race/subclass/background, and verify it appears in the creation wizard.
4. **Levelling & Multiclassing**: Increase XP or use the Level Up button to advance a character, choose a subclass or feat, and confirm stat and spell slot recalculations.
5. **Dice Tray**: Click the floating die button (⚄) at the bottom right, select dice types, add modifiers, test advantage/disadvantage, and verify history logging and sound effects.
6. **Themes & Customization**: Open the theme picker, switch palettes, upload an avatar/backdrop, and test image cropping.
7. **Data Backup**: Use **Export all (backup)** to download character data and homebrew as JSON, and **Import backup** to restore or load saved sheets.
8. **Offline Support**: In browser DevTools (Network tab), toggle "Offline" mode and reload to verify that the Service Worker (`sw.js`) serves cached assets.

---

## Project Structure

```text
.
├── css/
│   ├── bootstrap.min.css              # Bootstrap 5 framework stylesheet
│   ├── base/                          # Design tokens, theme palettes, and element defaults
│   ├── components/                    # Reusable UI: buttons, forms, tables, steppers, modals, toast, bottom sheet, avatar, themed picker, tutorial
│   ├── dice/                          # Dice tray, animated dice, and roll toasts
│   ├── layout/                        # App shell: sidebar, topbar, and main container
│   ├── overlays/                      # Full-screen catalog picker, compendium, creation wizard, monsters, encounters and dungeons
│   ├── pages/                         # Home hub menu and the dungeon Player view
│   └── sheet/                         # Character sheet styling: identity, tabs, panels (vitals, abilities, spells, inventory, features, journal, info, backdrop, levelup)
├── images/
│   ├── icon-192.png                   # Application icon (192×192) for PWA
│   ├── icon-192-maskable.png          # Maskable application icon (192×192)
│   ├── icon-512.png                   # Application icon (512×512) for PWA
│   └── icon-512-maskable.png          # Maskable application icon (512×512)
├── js/
│   ├── app.js                         # Application entry point: event listeners, import/export, init()
│   ├── bootstrap.bundle.min.js        # Bootstrap 5 JavaScript bundle
│   ├── dungeon-view.js                # The dungeon Player view page (dungeon-view.html)
│   ├── version.js                     # App release version (APP_VERSION = "4.0.0")
│   ├── core/
│   │   ├── artificer.js               # Armor model weapons, elixir brewing and rolling
│   │   ├── backup.js                  # Full backups and character exports (with the homebrew they use)
│   │   ├── class-edition.js           # Switching a class between its 2014 and 2024 rules
│   │   ├── character.js               # Character factory and schema migration (ensureShape)
│   │   ├── coins.js                   # Coin purse: spend, add, parse, format
│   │   ├── companions.js              # Companion state, HP tracking, and long rest restoration
│   │   ├── dungeons.js                # Dungeon maps: terrain, fog, party sight, doors, stairs, notes, random maps
│   │   ├── dungeon-sync.js            # Keeps the Player view tab in step with the DM's map
│   │   ├── custom-features.js         # Custom feature creation and persistence
│   │   ├── custom-homebrew.js         # Custom race and background creation, persistence, and merge logic
│   │   ├── custom-items.js            # Custom inventory item creation and persistence
│   │   ├── custom-monsters.js         # Custom monster creation and persistence
│   │   ├── custom-spells.js           # Custom spell creation and persistence
│   │   ├── custom-subclasses.js       # Custom subclass creation, persistence, and merge logic
│   │   ├── feat-picks.js              # Feat pick application, revert, validation, and proficiency derivation
│   │   ├── feats-2024.js              # Who sees the 2024 Origin feats, Savage Attacker and Healer rolls
│   │   ├── faith.js                   # Gods for the Personality card's Faith tile
│   │   ├── helpers.js                 # Gathers the sheet's calculation modules below, so the app imports from one place
│   │   ├── basics.js                  # Shared tools: ids, ability modifiers, levels, DOM and text helpers
│   │   ├── class-features.js          # Class and subclass features, spell slots, proficiencies, the Features tab's list
│   │   ├── character-resources.js     # Limited uses, what a rest restores, rage numbers, hit dice
│   │   ├── vitals.js                  # Hit points, speed, Armor Class, initiative, saving throws, senses
│   │   ├── spell-grants.js            # Spells that features, feats, invocations and fighting styles give
│   │   ├── equipment.js               # Hands and equipping, weapon numbers, weapon and armor proficiency
│   │   ├── checks.js                  # Ability checks, skills, passive scores, advantage and disadvantage
│   │   ├── effects.js                 # Active effects (Bladesong, the Astral Self, Symbiotic Entity)
│   │   ├── bard.js, cleric.js, ...    # One file per class for what its features do on the sheet
│   │   ├── barbarian-2024.js          # What the 2024 barbarian adds to the 2014 rules (rogue-2024.js: the rogue)
│   │   ├── ability-scores.js          # Ability scores in effect (magic items that set or raise a score)
│   │   ├── background-gear.js         # A background's starting kit, its choices and trinket rolls
│   │   ├── background-story.js        # Personality and background story tables, rolls
│   │   ├── class-options.js           # Metamagic, maneuvers, runes and other class options: learning and swapping
│   │   ├── class-picks.js             # Proficiencies and spells class features give or let you choose
│   │   ├── conditions.js              # Conditions and exhaustion
│   │   ├── encounters.js              # Encounters: monsters, HP trails, turn order, saving
│   │   ├── fighting-styles.js         # Fighting styles: when due, picks and effects
│   │   ├── infusion-effects.js        # What active infusions do on the sheet
│   │   ├── invocations.js             # Eldritch invocations and Pact Boons
│   │   ├── magic-items.js             # What a carried magic item does, attunement
│   │   ├── map-images.js              # Pictures under dungeon maps, kept in IndexedDB
│   │   ├── reminders.js               # The Remember card: what a new player forgets mid-fight
│   │   ├── replicate.js               # The 2024 artificer's Replicate Magic Item plans
│   │   ├── species-2024.js            # What the 2024 species do on the sheet
│   │   ├── spell-edition.js           # Which edition's spells a character reads (2014 or 2024)
│   │   ├── spell-scaling.js           # What a spell does at the character's level
│   │   ├── spells-known.js            # Spells a class learns on a level-up, prepared limits
│   │   ├── weapon-edition.js          # The 2024 versions of the weapons the 2024 book changed
│   │   ├── weapon-mastery.js          # Which weapon mastery properties a character can use
│   │   └── state.js                   # Application state and localStorage persistence
│   ├── data/
│   │   ├── abilities-skills.js        # Ability and skill definitions, class hit dice
│   │   ├── alignments.js              # Alignment definitions and blurbs
│   │   ├── armor.js                   # Armor catalog, AC calculations, and stealth penalties
│   │   ├── artificer-extras.js        # Artificer armor models, elixir types, and infusion prerequisites
│   │   ├── artificer-plans.js         # The 2024 artificer's magic item plans
│   │   ├── <class>-2024.js            # Each class's 2024 version: features, kit and subclasses
│   │   ├── background-equipment.js    # Each background's starting kit
│   │   ├── background-stories.js      # Personality and story tables per background
│   │   ├── beast-blocks.js            # SRD stat blocks: Beast Master beasts, familiars, mounts
│   │   ├── class-options.js           # Metamagic, maneuvers, runes and other class option data
│   │   ├── conditions.js              # The fourteen conditions and exhaustion levels
│   │   ├── credits.js                 # Credits and licenses in the About dialog
│   │   ├── deities.js                 # Pantheons for the Faith tile, with deity-icons.js
│   │   ├── feature-picks.js           # Favored enemies, terrains, Dragon Ancestor lists
│   │   ├── gear.js                    # Adventuring gear list behind "+ Add item"
│   │   ├── invocations.js             # Eldritch invocations and Pact Boons
│   │   ├── magic-items.js             # The DM's magic items, joined with the SRD's
│   │   ├── magic-items-srd.js         # The SRD 5.1's 340 magic items
│   │   ├── magic-items-artificer.js   # Items the 2024 artificer's plans make
│   │   ├── origin-spells.js           # Spells a dragonmark or guild adds to class lists
│   │   ├── spell-scaling.js           # How spells grow with level or slot
│   │   ├── spells-2024.js             # The 2024 Player's Handbook's 391 spells
│   │   ├── weapon-mastery.js          # Weapon mastery properties and which weapon has which
│   │   ├── weapons-2024.js            # The weapons the 2024 book changed
│   │   ├── wild-shapes.js             # Wild Shape forms (the SRD's beasts and the elementals)
│   │   ├── wild-surge.js              # The Wild Magic Surge table
│   │   ├── spells-known.js            # Spells-known tables per class
│   │   ├── trinkets.js                # Trinket tables
│   │   ├── backgrounds.js             # All 118 backgrounds: skill proficiencies, tools, languages, and blurbs
│   │   ├── classes.js                 # Class information, spellcaster classification, and proficiencies
│   │   ├── companions.js              # Companion definitions and stat-block templates
│   │   ├── effects.js                 # Toggle effect definitions (Bladesong, Astral Self, Symbiotic Entity)
│   │   ├── feats.js                   # Feats catalog: joins the per-book files below (180 feats), campaign bonus feats
│   │   ├── feats/                     # Feats by source book
│   │   │   ├── phb.js                 # Player's Handbook (42)
│   │   │   ├── tasha.js               # Tasha's Cauldron of Everything (15)
│   │   │   ├── xanathar.js            # Xanathar's Guide: racial feats (15)
│   │   │   ├── other-books.js         # Mordenkainen's, Eberron, Fizban's, Strixhaven, Book of Many Things (9)
│   │   │   ├── dragonlance.js         # Dragonlance: Shadow of the Dragon Queen (9)
│   │   │   ├── giants.js              # Bigby Presents: Glory of the Giants (8)
│   │   │   ├── planescape.js          # Planescape: Adventures in the Multiverse (7)
│   │   │   ├── phb2024.js             # Player's Handbook (2024): Origin feats (10)
│   │   │   ├── phb2024-general.js     # Player's Handbook (2024): General, Fighting Style, Epic Boon (64)
│   │   │   └── races.js               # Race groups the racial feats refer to
│   │   ├── infusions.js               # Artificer infusions catalog and prerequisites
│   │   ├── languages.js               # Standard and exotic language definitions
│   │   ├── misc.js                    # Point-buy costs and random name generator
│   │   ├── monsters.js                # Monster stat block catalog
│   │   ├── progression.js             # XP tables, level progression, subclass schedules, multiclass rules, spell slots
│   │   ├── race-data.js               # Detailed racial traits, speeds, sizes, and darkvision
│   │   ├── races.js                   # Race definitions and summary blurbs (115 races, 10 2024 species)
│   │   ├── resources.js               # Class and subclass resource pools (Ki, Rages, Sorcery Points, etc.)
│   │   ├── spells.js                  # Spells catalog: 545 spells (Player's Handbook, Xanathar's, Tasha's and other books), with components and summaries
│   │   ├── subclasses/                # Per-class subclass feature data (one file per class)
│   │   │   ├── artificer.js
│   │   │   ├── barbarian.js
│   │   │   ├── bard.js
│   │   │   ├── cleric.js
│   │   │   ├── druid.js
│   │   │   ├── fighter.js
│   │   │   ├── monk.js
│   │   │   ├── paladin.js
│   │   │   ├── ranger.js
│   │   │   ├── rogue.js
│   │   │   ├── sorcerer.js
│   │   │   ├── warlock.js
│   │   │   └── wizard.js
│   │   └── weapons.js                 # Weapon catalog, damage dice, weapon properties, and ranges
│   ├── dice/
│   │   └── dice.js                    # Dice roller tray, animations, modifier calculation, roll history
│   ├── levelup/
│   │   ├── level-row.js               # XP bar and level display on identity card
│   │   ├── levelup.js                 # Gathers the level-up dialog's three parts below
│   │   ├── session.js                 # The dialog's state, which steps apply, what each still needs, navigation
│   │   ├── steps.js                   # One screen per step: class, subclass, style, spells, options, feat, hit points, review
│   │   └── apply.js                   # Applies the level-up, undoes the last one, shows the unlock popup
│   ├── render/
│   │   ├── armory.js                  # Armory overlay and equipment catalog browser
│   │   ├── compendium.js              # Opens the Compendium; its tabs are in compendium/
│   │   ├── dungeons.js                # Dungeons overlay for the DM: the saved list and the map board
│   │   ├── dungeon-canvas.js          # Draws maps, fog and the party (shared with the Player view)
│   │   ├── encounter-conditions.js    # Conditions and tracked spells on encounter monsters
│   │   ├── encounters.js              # Encounters overlay for the DM
│   │   ├── compendium/                # One file per Compendium tab
│   │   │   ├── shared.js              # What all tabs share: the session, detail view blocks, edit and delete bar
│   │   │   ├── classes.js             # Classes and Subclasses tabs, the custom subclass form
│   │   │   ├── races-backgrounds.js   # Races and Backgrounds tabs, their homebrew forms
│   │   │   ├── feats.js               # Feats and custom features, adding them to a character
│   │   │   └── companions-alignments.js# Companions and Alignments tabs
│   │   ├── home.js                    # Home screen hub renderer
│   │   ├── monsters.js                # Monster browser overlay and stat block renderer
│   │   ├── sheet.js                   # Character sheet renderer and panel tab dispatcher
│   │   ├── sidebar.js                 # Character list sidebar navigation
│   │   ├── spellbook.js               # Full spellbook browser and spell manager overlay
│   │   └── panels/                    # Character sheet tab panels:
│   │       ├── abilities.js           # Ability scores, modifiers, saving throws, skills
│   │       ├── artificer.js           # Artificer armor model selection and active infusions
│   │       ├── background-kit.js      # One-time background equipment offer for older sheets
│   │       ├── class-options.js       # Class options cards (Metamagic, maneuvers, runes...)
│   │       ├── class-picks.js         # Feature choices card
│   │       ├── conditions.js          # Conditions and exhaustion card
│   │       ├── invocations.js         # Eldritch invocations card
│   │       ├── personality.js         # Personality and background story card
│   │       ├── faith-sheet.js         # The Faith tile's sheet of gods
│   │       ├── plans.js               # The 2024 artificer's magic item plans card
│   │       ├── reminders.js           # The Remember card on the Vitals tab
│   │       ├── sheet-rolls.js         # Attack rolls, checks and saves, and what happens around them
│   │       ├── coin-purse.js          # Coin purse panel (cp/sp/ep/gp/pp)
│   │       ├── companions.js          # Companion HP tracking and beast form panel
│   │       ├── death-saves.js         # Death saving throw tracker
│   │       ├── effects.js             # Active effects toggle panel (Bladesong, Astral Self, etc.)
│   │       ├── feat-picker.js         # Feat selection modal
│   │       ├── features.js            # Class, race, feat, and custom feature list
│   │       ├── information.js         # Character information, proficiencies, and languages
│   │       ├── infusions.js           # Artificer infusions panel
│   │       ├── inventory.js           # Equipment list, weight, attunement
│   │       ├── journal.js             # Notes, backstory, quests, session logs
│   │       ├── spell-picker.js        # Spell selection and preparation modal
│   │       ├── spells.js              # Spell slots, cantrips, and prepared spells list
│   │       └── vitals.js              # HP, temp HP, hit dice, AC, initiative, rests
│   ├── ui/
│   │   ├── avatar-crop.js             # Interactive avatar image cropper modal
│   │   ├── avatar.js                  # Avatar image upload handling
│   │   ├── backdrop.js                # Custom sheet backdrop/banner upload handling
│   │   ├── bottom-sheet.js            # Mobile bottom sheet component
│   │   ├── background-gear.js         # Background equipment choices and trinket rolls
│   │   ├── card-parts.js              # Shared pieces of the Features tab's choice cards
│   │   ├── card-menu.js               # The ⋯ menu on a card
│   │   ├── catalog-picker.js          # Generic catalog picker overlay
│   │   ├── class-picks.js             # Pickers for class feature choices
│   │   ├── dlc-shelf.js               # Optional books shelf (wizard and Information tab)
│   │   ├── export-file.js             # Backup and export files: building and downloading them
│   │   ├── feat-list.js               # Feat list with prerequisites
│   │   ├── fx.js                      # Short sheet animations (slots, resources, rests)
│   │   ├── invocation-picks.js        # Invocation pickers
│   │   ├── option-picks.js            # Class option pickers
│   │   ├── spell-pick-grid.js         # Spell picking grid
│   │   ├── style-picks.js             # Fighting style pickers
│   │   ├── char-title.js              # Character title generation and display
│   │   ├── character-picker.js        # Quick character switcher picker
│   │   ├── confirm-modal.js           # Reusable confirmation modal dialog
│   │   ├── feat-picks.js              # Feat pick UI: ability selectors, skill pickers, expertise
│   │   ├── homebrew-form.js           # Homebrew entry form UI
│   │   ├── info-modal.js              # Information and detail popup modal
│   │   ├── mobile-nav.js              # Mobile responsive navigation and drawer toggle
│   │   ├── sound.js                   # Sound effect synthesizer and audio feedback
│   │   ├── spell-choice.js            # Spell choice picker UI (Circle of the Land, Genie, etc.)
│   │   ├── svg-icons.js               # Inline SVG icon helpers
│   │   ├── theme.js                   # Color palette management and theme modal
│   │   ├── themed-picker.js           # Custom styled themed select/picker dropdowns
│   │   ├── toast.js                   # Toast notification system
│   │   ├── tutorial.js                # Interactive guided onboarding tour
│   │   └── update-prompt.js           # "New version available" PWA update banner
│   └── wizard/
│       ├── wizard-core.js             # Character creation wizard controller and state
│       ├── wizard-steps.js            # Gathers the wizard's step screens below
│       ├── steps-basics.js            # Class, race, background and campaign, alignment, ability scores
│       ├── steps-traits.js            # Skills, race traits, the race's feat, the background's or campaign's feat
│       ├── steps-choices.js           # Class features, languages, starting equipment
│       └── steps-spells.js            # Cantrips, spells and the review
├── tests/
│   ├── setup.mjs                      # Browser stub (window, document, localStorage) for Node test runner
│   ├── fake-dom.mjs                   # Stand-in DOM for tests that drive render, wizard or level-up code
│   └── *.test.mjs                     # One file per area, see Testing above
├── .githooks/
│   └── pre-commit                     # Runs npm test and stamps sw.js before each commit
├── 404.html                           # Page not found, for GitHub Pages
├── dungeon-view.html                  # The dungeon Player view, opened from a map in a second tab
├── index.html                         # Application HTML entry point and UI markup
├── LICENSE                            # License terms
├── manifest.json                      # Web App Manifest for PWA installation
├── package.json                       # Test runner config only (no dependencies)
├── privacy.html                       # Privacy policy
├── README.md                          # Project documentation
└── sw.js                              # Service Worker for offline asset caching
```

---

## Team

- **Hunter** ([@XRafaelX](https://github.com/XRafaelX)), Full-Stack Developer
- **Kayn**, Lead QA

---

## License

Copyright (c) 2026 Hunter & Kayn. All rights reserved. The original code, design and text in this repository may not be copied, modified, distributed or hosted without written permission. See [LICENSE](LICENSE).

Third-party material keeps its own license:

- D&D rules content belongs to Wizards of the Coast. The SRD 5.1 material is used under CC BY 4.0. Ragnar's Den is an unofficial fan tool, not affiliated with or endorsed by Wizards of the Coast.
- Bootstrap (MIT), Lucide icons (ISC) and the Lorc "Daemon skull" icon (CC BY 3.0).

The full credits are in the app's About dialog.
