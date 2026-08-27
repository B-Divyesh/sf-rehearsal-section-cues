# Build handoff — Rehearsal Section Cues

## What shipped

Finished v1 of the score-agnostic rehearsal operating sheet:

- Create and name a rehearsal plan; add, reorder, edit, complete, delete, and undo section cues.
- Each cue includes section label, measure/reference, pass/repeat, active players, one technical risk, target BPM, and completion status.
- Autosave to IndexedDB with visible save failure, empty, offline, import-error, and update states.
- JSON and CSV export/import remain free and preserve user ownership. Importing over a non-empty plan requires confirmation.
- High-contrast print layout with validation and break-safe cue blocks. Free printing supports six cues; $12 one-time Conductor unlock adds unlimited and condensed printing.
- Sociobot buy link, return-token capture, daily license verification cache, background reconciliation, inactive-license state, and paste-to-restore flow. No product ID or payment provider is embedded.
- Installable PWA manifest, authored 192/512 maskable icons, versioned asset precache, cache cleanup, navigation fallback, offline page, update notice, and explicit offline connectivity state.
- Blueprint drafting-sheet visual system, responsive 390 px treatment, keyboard path, strong focus states, reduced motion, print styling, privacy, and terms.
- Original generated hero illustration with its exact prompt/model/date sidecar in `assets/src/`; shipped WebP is 22 KB mobile / 47 KB desktop with a 91 KB JPEG fallback.

## Run and verify

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Deployment output is exactly `dist/`, with `dist/index.html` at its root. Build command: `npm run build`.

Verified locally on 2026-08-27:

- `npm test`: 3/3 unit tests passed.
- `npm run test:e2e`: 6/6 Playwright scenarios passed across desktop Chromium and 390×844 mobile.
- Browser coverage includes create/edit/complete, IndexedDB persistence after reload, JSON download, keyboard-only cue creation, no horizontal mobile overflow, axe serious/critical audit, a full service-worker offline reload, and continued offline editing.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, title present, `lang="en"`, exactly one h1, main landmark present, all images have alt attributes, and no console/page errors.
- Lighthouse mobile-class run: **Performance 99, Accessibility 100, Best Practices 100, SEO 100**.
- Final lab metrics: FCP 0.8 s, LCP 0.9 s, CLS 0, total blocking time 110 ms, speed index 0.8 s.
- Bundle budgets: 23.7 KB JS and 15.3 KB CSS uncompressed (both inlined into the 40 KB offline shell); no fonts; mobile hero 21.9 KB. All are comfortably below factory budgets.

Local audit evidence was produced in `.factory/evidence/` and is intentionally gitignored because screenshots and raw Lighthouse JSON are reproducible from the commands above.

## Known gaps and factory next steps

- The factory must register the product slug and checkout return URL in the Sociobot billing service before live purchase/restore can complete. The client contract and production endpoint are implemented; no registration or billing infrastructure was touched here.
- Lighthouse lab runs do not measure field INP. The closest lab signal was 100 ms total blocking time; interaction handlers perform only local state updates and deferred IndexedDB writes.
- Browser storage can be cleared by the user or operating system. The UI and legal copy direct users to export important plans; v1 intentionally has no cloud sync.
- Deployment should apply long-lived immutable caching to hashed assets while leaving `index.html` and `sw.js` revalidatable. The service worker already versions its own cache per build.
