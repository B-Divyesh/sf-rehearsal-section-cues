# Rehearsal Section Cues

Rehearsal Section Cues is a local-first, installable cue-sheet builder for small ensemble leaders and multi-instrument players. It captures the practical plan beside the score: where a section starts, which pass it is, who plays, the main technical risk, target tempo, and whether the section has been rehearsed.

Live product: <https://rehearsal-section-cues.sociobot.in>

## What v1 includes

- Fast cue creation, editing, ordering, completion tracking, and cue-specific delete/undo
- Automatic IndexedDB persistence with clear online, offline, saving, and error states
- High-contrast print output; the free tier prints up to six cues
- JSON and CSV export/import for user-owned backups at every tier
- Installable PWA shell with a versioned precache and offline editing
- Keyboard path (`Ctrl`/`Cmd` + `Enter` adds a cue), 390 px mobile layout, and reduced-motion support
- Optional $12 one-time Conductor unlock for unlimited and condensed printing
- Hosted Sociobot checkout, returned-license capture, daily verification caching, and license restore
- Privacy and terms pages; no accounts, score uploads, analytics, CDN fonts, or runtime trackers

The product deliberately does not render scores, play music, grade difficulty, store copyrighted charts, or provide cloud rehearsal rooms.

## Develop

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

The development server prints its local URL. Data is stored in that origin’s IndexedDB.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

`npm test` runs the unit suite for CSV/JSON normalization. `npm run test:e2e` runs the production build through Playwright on desktop and a 390×844 mobile viewport, including axe and offline service-worker scenarios. Install the browser once with `npx playwright install chromium` if needed.

The exact production build command is:

```sh
npm run build
```

It produces `dist/index.html` at the deploy root. The post-build step inlines the small critical app bundle into the cached shell so a full offline reload cannot strand the user on a loading state, then injects every built asset into the versioned service-worker precache.

Preview the exact output with:

```sh
npm run preview
```

## Data and licensing

The current plan lives only in browser IndexedDB. License tokens and their dated verification verdict live in localStorage under `sb_license:rehearsal-section-cues`; cue content is never sent with license checks. JSON and CSV exports are ordinary local files.

Checkout uses `https://api.sociobot.in/api/v1/products/rehearsal-section-cues/checkout`. The factory registers the product and return URL; this repository contains no payment-provider integration or secret product ID.

## Project notes

- Product brief: [`.factory/brief.json`](.factory/brief.json)
- Visual system and asset provenance: [`.factory/design.md`](.factory/design.md)
- Build handoff: [`.factory/handoff.md`](.factory/handoff.md)
- License: [MIT](LICENSE)
