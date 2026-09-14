# Ragnar's Den — Character Creator

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
- [License](#license)

---

## Overview

**Ragnar's Den** is a lightweight, responsive Progressive Web Application (PWA) designed for tabletop roleplaying game players (D&D 5th Edition). It allows players to create, customize, and manage multiple character sheets with real-time stat calculations, an interactive dice roller, and local persistence.

---

## Features

- **Character Creation Wizard**: Guided character creation workflow with SRD and expanded race, class, and background selections (detailed guided support currently implemented for Barbarian).
- **Interactive Character Sheet**: Full management of ability scores, modifiers, saving throws, skill proficiencies, hit points, hit dice, death saving throws, spell slots, inventory weight tracking, and equipment.
- **Built-in Dice Roller Tray**: Floating dice tray supporting d4, d6, d8, d10, d12, d20, and d100 with quantity multiplier, flat modifier, advantage/disadvantage toggles, and a roll history log.
- **Offline & Local Storage**: Stores all character data in browser `localStorage`. No external database or login required.
- **Backup & Portability**: Export and import character backups as JSON files.
- **Progressive Web App (PWA)**: Installable as a standalone app on desktop and mobile devices via Service Worker offline caching.

---

## Tech Stack

- **Language**: JavaScript (ES6+), organized as native ES modules (no bundler — `js/app.js` is loaded with `<script type="module">` and imports the rest of the `js/` tree directly), HTML5, CSS3
- **Frameworks & Libraries**: Bootstrap 5 (bundled locally)
- **Architecture**: Static Single-Page Application (SPA) / Progressive Web App (PWA)
- **Storage**: Browser `localStorage` (`ragnarsDen.characters.v1`)
- **Package Manager**: None (all dependencies are vendor-bundled locally without external package managers or bundlers)

---

## Requirements

- Any modern web browser with JavaScript enabled (e.g., Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge).
- For Service Worker / PWA functionality: Must be served over `localhost` or an HTTPS connection (or opened in a browser that supports service workers on local origins).

---

## Setup & Run

No build step or installation of dependencies is required.

### Quick Start (Direct File Access)

You can open `index.html` directly in your browser:
- Double-click `index.html` or drag it into your browser window.
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

- `TODO`: Add `package.json` with scripts for linting (e.g., ESLint), formatting (Prettier), and bundling/minification if desired.

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
3. **Dice Tray**: Click the floating die button (⚄) at the bottom right, select dice types, add modifiers, test advantage/disadvantage, and verify history logging.
4. **Data Backup**: Use **Export all (backup)** to download character data as JSON, and **Import backup** to restore or load saved sheets.
5. **Offline Support**: In browser DevTools (Network tab), toggle "Offline" mode and reload to verify that the Service Worker (`sw.js`) serves cached assets.

- `TODO`: Implement automated testing (e.g., unit tests for stat calculators using Jest/Vitest, and end-to-end tests using Playwright/Cypress).

---

## Project Structure

```text
.
├── css/
│   ├── bootstrap.min.css         # Bootstrap 5 framework stylesheet
│   └── style.css                 # Custom dark theme and layout styling
├── images/
│   ├── icon-192.png              # Application icon (192x192) for PWA
│   └── icon-512.png              # Application icon (512x512) for PWA
├── js/
│   ├── bootstrap.bundle.min.js   # Bootstrap 5 JavaScript bundle
│   ├── app.js                    # Entry module: top-level actions, delete character, init()
│   ├── core/
│   │   ├── state.js              # App state, localStorage persistence
│   │   ├── helpers.js            # Ability/skill math, derived stats, small DOM/string helpers
│   │   └── character.js          # newCharacter(), ensureShape() (older-save migration)
│   ├── data/
│   │   ├── abilities-skills.js   # Ability & skill lists, hit dice by class
│   │   ├── classes.js            # Class blurbs, spellcaster list, per-class features & equipment
│   │   ├── feats.js              # Feats catalog (Standard 5e SRD)
│   │   ├── races.js              # Race lists & trait blurbs
│   │   ├── backgrounds.js        # Background lists & skill/blurb info
│   │   ├── alignments.js         # Alignment list & blurbs
│   │   └── misc.js               # Point-buy costs, name idea generator
│   ├── render/
│   │   ├── sidebar.js            # Character list sidebar
│   │   ├── sheet.js              # Tab bar, identity block, panel dispatch
│   │   └── panels/                # One file per character sheet tab (vitals, abilities,
│   │                              # features, feat/feature modals, spells, inventory, journal)
│   ├── wizard/
│   │   ├── wizard-core.js        # Wizard navigation/state & character creation
│   │   └── wizard-steps.js       # Per-step wizard UI renderers
│   ├── dice/
│   │   └── dice.js               # Dice tray, roll animation, roll log
│   └── ui/
│       ├── svg-icons.js          # Small inline SVG helpers
│       ├── confirm-modal.js      # Reusable confirm dialog
│       └── mobile-nav.js         # Mobile sidebar toggle
├── index.html                    # Application entry point and layout markup
├── manifest.json                 # Web App Manifest for PWA installation
├── README.md                     # Project documentation
└── sw.js                         # Service Worker handling offline asset caching
```

---

## License

`TODO`: Specify open-source license (e.g. MIT License). Note that D&D 5e SRD content may be subject to the Open Game License (OGL) or Creative Commons Attribution 4.0 International (CC-BY-4.0).
