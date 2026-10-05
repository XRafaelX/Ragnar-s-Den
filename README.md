# Ragnar's Den · Character Creator — v2.0.0

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
  - Step-by-step selection for Races (with subraces, detailed trait summaries, and Variant Human custom feats/ASIs), Classes, Backgrounds, Alignments, and starting Equipment.
  - Flexible ability score generation supporting Standard Array, Point Buy (with real-time budget calculator), Manual entry, and Rolling stats with re-roll options.
  - Integrated spell selection for spellcasting classes (cantrips and leveled spells), including always-prepared class spells and domain spell choices.
- **Interactive Character Sheet**:
  - **Identity & Banner**: Dynamic character card with custom avatar upload, built-in image cropper, custom banner backdrops, inspiration toggle, passive perception, character title, and level indicator.
  - **Vitals**: Real-time HP tracking (Current, Max, Temp), hit dice tracker, death saving throws, armor class with full breakdown tooltip, initiative, and rests.
  - **Abilities & Skills**: Ability scores, modifiers, saving throws, and skill proficiencies with proficiency and expertise markers.
  - **Features & Traits**: Class features, racial traits, feats, and custom feature creation with "NEW" indicator badges on level-up.
  - **Spellbook & Slots**: Track cantrips and prepared spells, filter by spell level, manage spell slot usage (including multiclassing and Warlock Pact Magic), and toggle prepared state on long rest.
  - **Inventory & Armory**: Currency tracker (cp/sp/ep/gp/pp) with smart coin breaking, equipment list, carrying capacity and weight calculations, equipped weapon/armor management with hand-to-hand logic.
  - **Coin Purse**: Full copper/silver/electrum/gold/platinum tracking with change-giving when spending.
  - **Active Effects**: Toggle on/off effects like Bladesong, the Astral Self, and Symbiotic Entity — each costs the appropriate class resource.
  - **Death Saves**: Track successes and failures with automatic stabilization.
  - **Companions**: Full companion panel for Steel Defender, Eldritch Cannon, Drake Companion, Wildfire Spirit, Beast Master beast, Tasha's primal beasts and Blighted Sapling — with HP tracking, beast form entry, and long rest restoration.
  - **Artificer Infusions**: Dedicated infusions tab and picker for Artificer characters.
  - **Journal & Information**: Rich notes, backstory, physical characteristics, proficiencies (languages, weapons, armor, tools), and custom notes.
- **Monsters Browser**:
  - Searchable monster compendium with full stat blocks.
  - Customize and create your own monsters for encounters.
- **Compendium & Reference Overlays**:
  - Built-in searchable compendium for Races, Classes, Subclasses, Backgrounds, Alignments, Feats, Spells, Weapons, Armor, and Infusions.
  - All 66 backgrounds have full skill/tool entries and descriptive blurbs.
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
- **UI & Customization**:
  - **Themes & Palettes**: Theme selector with multiple color palettes and themed dropdown pickers.
  - **Interactive Sound Effects**: Audio feedback for dice rolls, leveling, buttons, and character actions.
  - **Onboarding Tutorial**: Interactive step-by-step guided tour highlighting major features.
  - **Responsive Design**: Mobile-friendly layout with slide-out sidebar navigation, bottom sheets, and desktop-optimized panel grids.
- **Offline & Local Storage**:
  - Stores character sheets and custom homebrew in browser `localStorage`.
  - Export and import full vault backups as JSON files.
  - PWA installable on desktop and mobile devices with Service Worker offline caching (`sw.js`).

---

## Tech Stack

- **Language**: JavaScript (ES6+), organized as native ES modules (no bundler; `js/app.js` is loaded with `<script type="module">` and imports the modular `js/` tree directly), HTML5, CSS3 (using CSS variables / design tokens).
- **Frameworks & Libraries**: Bootstrap 5 (bundled locally for grid and base components).
- **Architecture**: Static Single-Page Application (SPA) / Progressive Web App (PWA).
- **Storage**: Browser `localStorage` (`ragnarsDen.characters.v1`, `ragnarsDen.customSubclasses.v1`, `ragnarsDen.customRaces.v1`, `ragnarsDen.customBackgrounds.v1`, `ragnarsDen.theme.v1`).
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

Releases are detected through `sw.js`. A pre-commit hook in `.githooks/` stamps it with a new `BUILD` id and regenerates its offline file list on every commit that touches app files. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

---

## Available Scripts

The app needs no build step. `package.json` exists only to run the tests and has no dependencies.

- `npm test` — runs the full automated test suite with Node's built-in test runner (Node 22 or newer).

---

## Testing

Run `npm test` (Node 22 or newer; no install needed). The suite lives in `tests/` and completes in well under a second. **70 tests, 0 failures.**

- `coins.test.mjs` — coin parsing, spending, change-giving, and formatting.
- `data.test.mjs` — class, subclass and resource data is complete and well-formed. Every subclass reaches its top level, `replaces` points at a real earlier feature, feature flags use known names and valid values, every Resources card entry belongs to a subclass that exists, counters stay sane at every level, and text has no long dashes.
- `rules.test.mjs` — sheet calculations against hand-worked 2014 rules numbers: proficiency bonus, Sneak Attack and Martial Arts scaling, speed bonuses, rage, initiative, Armor Class (unarmored defenses, Dual Wielder, Defense style, Soul of the Forge), saving throws (Aura of Protection, Diamond Soul, Resilient), Battle Ready and Hex Warrior attacks, proficiency grants, rests, spell slots, feat resources, feat picks, spell choices, speeds, artificer weapons and elixirs, and companions.
- `smoke.test.mjs` — every class and subclass at every level from 1 to 20, plus multiclass builds, runs through every sheet calculation without errors.
- `project.test.mjs` — every file in the service worker's offline list exists, every relative `import` resolves, and `index.html`'s local scripts and stylesheets exist.
- `bugfixes.test.mjs` — 12 regression tests covering each bug fixed in v2.0.0: `startEffect` null guard, `undoLastLevelUp` deleted-feat guard, Monk Unarmored Defense 0-AC shield, `wisModPlusOne` missing abilities, Defense style with shield only, shield proficiency contains-check, `ordinal()` teen suffixes, and the stale `c.ac` render write.

`tests/setup.mjs` gives the browser modules just enough of `window`, `document` and `localStorage` to load in Node. The tests check data and calculations, not rendering — use the checklist below for the screens.

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
│   ├── overlays/                      # Full-screen catalog picker, compendium, and creation wizard
│   ├── pages/                         # Home hub menu
│   └── sheet/                         # Character sheet styling: identity, tabs, panels (vitals, abilities, spells, inventory, features, journal, info, backdrop, levelup)
├── images/
│   ├── icon-192.png                   # Application icon (192×192) for PWA
│   ├── icon-192-maskable.png          # Maskable application icon (192×192)
│   ├── icon-512.png                   # Application icon (512×512) for PWA
│   └── icon-512-maskable.png          # Maskable application icon (512×512)
├── js/
│   ├── app.js                         # Application entry point: event listeners, import/export, init()
│   ├── bootstrap.bundle.min.js        # Bootstrap 5 JavaScript bundle
│   ├── version.js                     # App release version (APP_VERSION = "2.0.0")
│   ├── core/
│   │   ├── artificer.js               # Armor model weapons, elixir brewing and rolling
│   │   ├── character.js               # Character factory and schema migration (ensureShape)
│   │   ├── coins.js                   # Coin purse: spend, add, parse, format
│   │   ├── companions.js              # Companion state, HP tracking, and long rest restoration
│   │   ├── custom-features.js         # Custom feature creation and persistence
│   │   ├── custom-homebrew.js         # Custom race and background creation, persistence, and merge logic
│   │   ├── custom-items.js            # Custom inventory item creation and persistence
│   │   ├── custom-monsters.js         # Custom monster creation and persistence
│   │   ├── custom-spells.js           # Custom spell creation and persistence
│   │   ├── custom-subclasses.js       # Custom subclass creation, persistence, and merge logic
│   │   ├── feat-picks.js              # Feat pick application, revert, validation, and proficiency derivation
│   │   ├── helpers.js                 # Math, ability/skill calculations, derived stats, AC, initiative, speed, effects, string helpers
│   │   └── state.js                   # Application state and localStorage persistence
│   ├── data/
│   │   ├── abilities-skills.js        # Ability and skill definitions, class hit dice
│   │   ├── alignments.js              # Alignment definitions and blurbs
│   │   ├── armor.js                   # Armor catalog, AC calculations, and stealth penalties
│   │   ├── artificer-extras.js        # Artificer armor models, elixir types, and infusion prerequisites
│   │   ├── backgrounds.js             # All 66 backgrounds: skill proficiencies, tools, languages, and blurbs
│   │   ├── classes.js                 # Class information, spellcaster classification, and proficiencies
│   │   ├── companions.js              # Companion definitions and stat-block templates
│   │   ├── effects.js                 # Toggle effect definitions (Bladesong, Astral Self, Symbiotic Entity)
│   │   ├── feats.js                   # Feats catalog (D&D 5e SRD + expansions)
│   │   ├── infusions.js               # Artificer infusions catalog and prerequisites
│   │   ├── languages.js               # Standard and exotic language definitions
│   │   ├── misc.js                    # Point-buy costs and random name generator
│   │   ├── monsters.js                # Monster stat block catalog
│   │   ├── progression.js             # XP tables, level progression, subclass schedules, multiclass rules, spell slots
│   │   ├── race-data.js               # Detailed racial traits, speeds, sizes, and darkvision
│   │   ├── races.js                   # Race definitions and summary blurbs
│   │   ├── resources.js               # Class and subclass resource pools (Ki, Rages, Sorcery Points, etc.)
│   │   ├── spells.js                  # Spells catalog (cantrips to 9th level) with components and descriptions
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
│   │   └── levelup.js                 # Level-up wizard, subclass assignment, ASI/feat picker, HP rolling, undo
│   ├── render/
│   │   ├── armory.js                  # Armory overlay and equipment catalog browser
│   │   ├── compendium.js              # Interactive compendium browser and homebrew creator
│   │   ├── home.js                    # Home screen hub renderer
│   │   ├── monsters.js                # Monster browser overlay and stat block renderer
│   │   ├── sheet.js                   # Character sheet renderer and panel tab dispatcher
│   │   ├── sidebar.js                 # Character list sidebar navigation
│   │   ├── spellbook.js               # Full spellbook browser and spell manager overlay
│   │   └── panels/                    # Character sheet tab panels:
│   │       ├── abilities.js           # Ability scores, modifiers, saving throws, skills
│   │       ├── artificer.js           # Artificer armor model selection and active infusions
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
│   │   ├── catalog-picker.js          # Generic catalog picker overlay
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
│       └── wizard-steps.js            # Wizard steps (Race, Class, Abilities, Background, Equipment, Spells, Review)
├── tests/
│   ├── setup.mjs                      # Browser stub (window, document, localStorage) for Node test runner
│   ├── bugfixes.test.mjs              # Regression tests for all 8 bugs fixed in v2.0.0
│   ├── coins.test.mjs                 # Coin purse logic tests
│   ├── data.test.mjs                  # Data completeness and well-formedness tests
│   ├── project.test.mjs               # File existence and import resolution tests
│   ├── rules.test.mjs                 # Sheet calculation tests against hand-worked rules numbers
│   └── smoke.test.mjs                 # All classes × all subclasses × levels 1–20 smoke tests
├── .githooks/
│   └── pre-commit                     # Runs npm test and stamps sw.js before each commit
├── index.html                         # Application HTML entry point and UI markup
├── manifest.json                      # Web App Manifest for PWA installation
├── package.json                       # Test runner config only (no dependencies)
├── README.md                          # Project documentation
└── sw.js                              # Service Worker for offline asset caching
```

---

## Team

- **Hunter** ([@XRafaelX](https://github.com/XRafaelX)), Full-Stack Developer
- **Kayn**, Lead QA

---

## License

`TODO`: Specify open-source license (e.g. MIT License). Note that D&D 5e SRD content may be subject to the Open Game License (OGL) or Creative Commons Attribution 4.0 International (CC-BY-4.0).
