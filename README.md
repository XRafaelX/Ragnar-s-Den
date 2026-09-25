# Ragnar's Den · Character Creator

An offline-first, browser-based D&D 5e character creator and interactive character sheet. No accounts, no ads, and no internet connection required after initial load.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Setup & Run](#setup--run)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
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
  - Integrated spell selection for spellcasting classes (cantrips and leveled spells).
- **Interactive Character Sheet**:
  - **Identity & Banner**: Dynamic character card with custom avatar upload, built-in image cropper, custom banner backdrops, inspiration toggle, passive perception, and level indicator.
  - **Vitals**: Real-time HP tracking (Current, Max, Temp), hit dice tracker, death saving throws, and rests.
  - **Abilities & Skills**: Ability scores, modifiers, saving throws, and skill proficiencies with proficiency and expertise markers.
  - **Features & Traits**: Class features, racial traits, feats, and custom feature creation with "NEW" indicator badges on level-up.
  - **Spellbook & Slots**: Track cantrips and prepared spells, filter by spell level, and manage spell slot usage (including multiclassing and Warlock Pact Magic).
  - **Inventory & Armory**: Currency tracker, equipment list, carrying capacity and weight calculations, equipped weapon/armor management with hand-to-hand logic.
  - **Artificer Infusions**: Dedicated infusions tab and picker for Artificer characters.
  - **Journal & Information**: Rich notes, backstory, physical characteristics, proficiencies (languages, weapons, armor, tools), and custom notes.
- **Compendium & Reference Overlays**:
  - Built-in searchable compendium for Races, Classes, Subclasses, Backgrounds, Alignments, Feats, Spells, Weapons, Armor, and Infusions.
  - Inspect full trait descriptions, spell requirements, and item properties without leaving the app.
- **Custom Homebrew Builder**:
  - Create and manage custom Subclasses, custom Races, and custom Backgrounds directly in the Compendium.
  - Custom homebrew entries integrate seamlessly into the character creation wizard, leveling system, and sheet displays.
  - Stored independently in local storage and included in exported backups.
- **Levelling, Subclasses & Multiclassing**:
  - XP tracker with a guided Level-Up flow: advance primary class or multiclass (with ability score prerequisites enforced).
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
- For Service Worker / PWA installation: Must be served over `localhost` or an HTTPS connection (or opened in a browser that supports service workers on local origins).

---

## Setup & Run

No build step or dependency installation is required.

### Quick Start (Direct File Access)

You can open `index.html` directly in your browser:
- Double-click `index.html` or open it directly in your browser.
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

---

## Available Scripts

There is currently no build system or package manager (such as `npm` or `yarn`) configured for this project.

- `TODO`: Add optional `package.json` with scripts for linting (e.g., ESLint), formatting (Prettier), and automated testing if desired.

---

## Environment Variables

No environment variables are required. Ragnar's Den runs entirely client-side.

- `TODO`: Add configuration variables if an optional remote synchronization backend or external API is added in the future.

---

## Testing

Currently, no automated testing framework is set up in the repository.

### Manual Verification Checklist

1. **Character Creation**: Click **+ New Character** to open the wizard, choose race/class/background/abilities, and confirm the sheet is created with computed modifiers.
2. **Character Sheet Updates**: Edit character attributes, health, inventory, and notes; refresh the page to verify data persistence in `localStorage`.
3. **Compendium & Homebrew**: Open the Compendium from the home screen, browse races, classes, spells, and items, create a custom race/subclass/background, and verify it appears in the creation wizard.
4. **Levelling & Multiclassing**: Increase XP or use the Level Up button to advance a character, choose a subclass or feat, and confirm stat and spell slot recalculations.
5. **Dice Tray**: Click the floating die button (⚄) at the bottom right, select dice types, add modifiers, test advantage/disadvantage, and verify history logging and sound effects.
6. **Themes & Customization**: Open the theme picker, switch palettes, upload an avatar/backdrop, and test image cropping.
7. **Data Backup**: Use **Export all (backup)** to download character data and homebrew as JSON, and **Import backup** to restore or load saved sheets.
8. **Offline Support**: In browser DevTools (Network tab), toggle "Offline" mode and reload to verify that the Service Worker (`sw.js`) serves cached assets.

- `TODO`: Implement automated testing (e.g., unit tests for stat calculators using Jest/Vitest, and end-to-end tests using Playwright/Cypress).

---

## Project Structure

```text
.
├── css/
│   ├── bootstrap.min.css         # Bootstrap 5 framework stylesheet
│   ├── base/                     # Design tokens, theme palettes, and element defaults
│   ├── components/               # Reusable UI: buttons, forms, tables, steppers, modals, toast, bottom sheet, avatar, themed picker, tutorial
│   ├── dice/                     # Dice tray, animated dice, and roll toasts
│   ├── layout/                   # App shell: sidebar, topbar, and main container
│   ├── overlays/                 # Full-screen catalog picker, compendium, and creation wizard
│   ├── pages/                    # Home hub menu
│   └── sheet/                    # Character sheet styling: identity, tabs, panels (vitals, abilities, spells, inventory, features, journal, info, backdrop, levelup)
├── images/
│   ├── icon-192.png              # Application icon (192x192) for PWA
│   ├── icon-192-maskable.png     # Maskable application icon (192x192)
│   ├── icon-512.png              # Application icon (512x512) for PWA
│   └── icon-512-maskable.png     # Maskable application icon (512x512)
├── js/
│   ├── bootstrap.bundle.min.js   # Bootstrap 5 JavaScript bundle
│   ├── app.js                    # Application entry point: event listeners, import/export, init()
│   ├── version.js                # App release version (APP_VERSION): bump here for each release
│   ├── core/
│   │   ├── character.js          # Character factory and schema migration (ensureShape)
│   │   ├── custom-homebrew.js    # Custom race and background creation, persistence, and merge logic
│   │   ├── custom-subclasses.js  # Custom subclass creation, persistence, and merge logic
│   │   ├── helpers.js            # Math, ability/skill calculations, derived stats, string helpers
│   │   └── state.js              # Application state and localStorage persistence
│   ├── data/
│   │   ├── abilities-skills.js   # Ability and skill definitions, class hit dice
│   │   ├── alignments.js         # Alignment definitions and blurbs
│   │   ├── armor.js              # Armor catalog, AC calculations, and stealth penalties
│   │   ├── backgrounds.js        # Background lists, skill proficiencies, and features
│   │   ├── classes.js            # Class information, spellcaster classification, and proficiencies
│   │   ├── feats.js              # Feats catalog (D&D 5e SRD)
│   │   ├── infusions.js          # Artificer infusions catalog and prerequisites
│   │   ├── languages.js          # Standard and exotic language definitions
│   │   ├── misc.js               # Point-buy costs and random name generator
│   │   ├── progression.js        # XP tables, level progression, subclass schedules, multiclass rules, spell slots
│   │   ├── race-data.js          # Detailed racial traits, speeds, sizes, and darkvision
│   │   ├── races.js              # Race definitions and summary blurbs
│   │   ├── resources.js          # Class resource pools (Ki, Rages, Sorcery Points, etc.)
│   │   ├── spells.js             # Spells catalog (cantrips to 9th level) with components and descriptions
│   │   └── weapons.js            # Weapon catalog, damage dice, weapon properties, and ranges
│   ├── dice/
│   │   └── dice.js               # Dice roller tray, animations, modifier calculation, roll history
│   ├── levelup/
│   │   ├── level-row.js          # XP bar and level display on identity card
│   │   └── levelup.js            # Level-up wizard, subclass assignment, ASI/feat picker, HP rolling, undo
│   ├── render/
│   │   ├── armory.js             # Armory overlay and equipment catalog browser
│   │   ├── compendium.js         # Interactive compendium browser and homebrew creator
│   │   ├── home.js               # Home screen hub renderer
│   │   ├── sheet.js              # Character sheet renderer and panel tab dispatcher
│   │   ├── sidebar.js            # Character list sidebar navigation
│   │   ├── spellbook.js          # Full spellbook browser and spell manager overlay
│   │   └── panels/               # Character sheet tab panels:
│   │       ├── abilities.js      # Ability scores, modifiers, saving throws, skills
│   │       ├── armor-picker.js   # Armor equipping and AC selection modal
│   │       ├── feat-picker.js    # Feat selection modal
│   │       ├── feature-modal.js  # Feature detail view and custom feature modal
│   │       ├── features.js       # Class, race, feat, and custom feature list
│   │       ├── information.js    # Character information, proficiencies, and languages
│   │       ├── infusions.js      # Artificer infusions panel
│   │       ├── inventory.js      # Currency, equipment list, weight, attunement
│   │       ├── journal.js        # Notes, backstory, quests, session logs
│   │       ├── spell-picker.js   # Spell selection and preparation modal
│   │       ├── spells.js         # Spell slots, cantrips, and prepared spells list
│   │       ├── vitals.js         # HP, temp HP, hit dice, death saves, rests
│   │       └── weapon-picker.js  # Weapon equipping and attack modifier modal
│   ├── ui/
│   │   ├── avatar-crop.js        # Interactive avatar image cropper modal
│   │   ├── avatar.js             # Avatar image upload handling
│   │   ├── backdrop.js           # Custom sheet backdrop/banner upload handling
│   │   ├── bottom-sheet.js       # Mobile bottom sheet component
│   │   ├── catalog-picker.js     # Generic catalog picker overlay
│   │   ├── character-picker.js   # Quick character switcher picker
│   │   ├── confirm-modal.js      # Reusable confirmation modal dialog
│   │   ├── info-modal.js         # Information and detail popup modal
│   │   ├── mobile-nav.js         # Mobile responsive navigation and drawer toggle
│   │   ├── sound.js              # Sound effect synthesizer and audio feedback
│   │   ├── svg-icons.js          # Inline SVG icon helpers
│   │   ├── theme.js              # Color palette management and theme modal
│   │   ├── themed-picker.js      # Custom styled themed select/picker dropdowns
│   │   ├── toast.js              # Toast notification system
│   │   └── tutorial.js           # Interactive guided onboarding tour
│   └── wizard/
│       ├── wizard-core.js        # Character creation wizard controller and state
│       └── wizard-steps.js       # Wizard steps (Race, Class, Abilities, Background, Equipment, Review)
├── index.html                    # Application HTML entry point and UI markup
├── manifest.json                 # Web App Manifest for PWA installation
├── README.md                     # Project documentation
└── sw.js                         # Service Worker for offline asset caching
```

---

## Team

- **Hunter** ([@XRafaelX](https://github.com/XRafaelX)), Full-Stack Developer
- **Kayn**, Lead QA

---

## License

`TODO`: Specify open-source license (e.g. MIT License). Note that D&D 5e SRD content may be subject to the Open Game License (OGL) or Creative Commons Attribution 4.0 International (CC-BY-4.0).
