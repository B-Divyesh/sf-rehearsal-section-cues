# Review 1 — Build a printable rehearsal cue sheet

- **Verdict: FAIL**
- Date: 2026-09-06 UTC
- Live URL: <https://rehearsal-section-cues.sociobot.in/>
- Implementation reviewed: `be3c8a76c3d93fbd837ab5d6ebb7a29a94bdf525` (`docs: finalize audits and production handoff`; last product implementation changes)
- Documentation reviewed: `108f75f5850605a9f4df6dc63ff56393cb170221` (`docs: record passing verification`)
- Live identity: current live `index.html`, JS, and CSS SHA-256 values exactly match a fresh build of the reviewed checkout.

The job is to let a small ensemble leader or multi-instrument player build and print a clear rehearsal cue sheet: section, pass, players, technical risk, tempo, and completion. The product’s core editor does that job. It does not meet the required release contracts, so this is not a PASS.

## First screen, before scrolling

Tested in new desktop Chromium (1440×1000) and new iPhone 13 Chromium (390×844) contexts.

- **Job:** the h1 is “Rehearsal Section Cues”, not a plain-language job. The surrounding copy only implies the job.
- **Audience:** the first screen does not name an ensemble leader or multi-instrument player.
- **First action:** “Build the cue sheet” scrolls to a blank, real local plan. It does not load safe sample data.
- There is no visible “Try it with sample data” control, no sample facts, and no demo label on either viewport.

## Findings

### P1 — No one-click demo sandbox

`/demo` returns the normal application (HTTP 200) with title `Rehearsal Section Cues — printable rehearsal plans`, no sample action, no populated cue sheet, and no `Demo — sample data, nothing is saved` banner. The landing page likewise has no sample action.

This fails the demo-sandbox contract. A visitor must edit a real local plan to try the app, and there is no separate `demo:` storage namespace, Reset demo action, Start for real action, or `.factory/demo.md`. The required isolated sample, reset test, and proof that real data is untouched could not be exercised.

### P1 — Required claim catalog and claim commands are absent

`.factory/claims.json` is absent. No test is tagged `@claim:<id>` and there are no declared claim commands to run from a clean checkout. This makes the following **20 public claims untested under the claims contract**: device-only storage; automatic local saving; offline use; high-contrast printing; JSON export; CSV export; import; six-cue free printing; free import/export/offline access; unlimited printing; condensed printing; $12 price; one-time purchase; no subscription; no accounts; no score storage; no trackers; no cloud rooms; keyboard path; and reduced-motion/mobile support.

The repository test suite tests portions of several behaviors, but that does not substitute for a complete catalog with one observable demo-sandbox test per claim. README and UI claim copy therefore has no compliant public evidence trail.

### P2 — First-screen and site copy do not use the required plain language

The headline is the product name rather than the job, the audience is not named, and the primary path is an empty real sheet rather than the required sample path. The first screen also provides only one short fact instead of the required privacy/offline/price facts.

Several visible headings are metaphor or mood language rather than section names, including “The drafting board is clear”, “Take it to the stand”, “Agree before the downbeat”, and “Name the landing”. This violates the plain-words contract. No `.factory/copy-audit.md` exists to show the required sentence audit and terminology table.

### P2 — No designed HTTP 404 route

`/not-a-real-page` returns HTTP 200 and renders the home application with the home title and h1. It is not a deliberate HTTP 404 and provides no distinct error page or recovery link. The site-structure contract requires a real, product-styled 404 route.

### P2 — Required metadata and response security policy are incomplete

The home page has title, description, language, favicon, manifest, and theme color, but no canonical URL, Open Graph metadata/card image, Twitter card, or social preview asset. The live responses have no `Content-Security-Policy`; no `staticwebapp.config.json` exists to supply the required CSP and security configuration. The manifest is also served as `application/octet-stream`, not a manifest media type.

### P2 — Legal pages do not use the required shared site skeleton

`/privacy/` and `/terms/` return 200 with correct route titles and one h1, but they do not have the required consistent application header/navigation, skip link, or standard footer with the product one-liner, Param Factory attribution, and build id. This is a route-structure defect, not an expected 404.

### P3 — Static assets still use a short revalidation policy

This repeats the minor finding in both earlier verification reports. Live HTML, `/assets/index-DLfHLCHE.js`, `/assets/index-Budmp-Ng.css`, manifest, and service worker all send `Cache-Control: public, must-revalidate, max-age=30`. Content-addressed assets should be immutable and long-lived; retain short revalidation only for HTML and the service worker.

### P3 — Supported offline mode still logs a failed resource request

This repeats the earlier minor finding. In an online-loaded fresh phone context, setting the context offline and reloading successfully showed `OFFLINE — CHANGES STILL SAVE` and the app heading, but Chromium logged `Failed to load resource: net::ERR_FAILED` for the connectivity probe. The functional offline path works; the supported condition should not produce console-error noise.

## Evidence and checks

### Clean checkout commands

After `npm ci` and the documented Playwright browser installation, every declared command completed:

```text
npm test       PASS — Vitest 3/3
npm run build  PASS — type check, Vite build, dist/index.html
npm run test:e2e PASS — Playwright 6/6 (desktop and 390×844)
```

There is no `claims.json`, so there are **no declared claim commands** to run; that absence is the P1 above, not a passing empty test set. The suite was not run from `/demo` and has no claim tags.

### Live functional exercise

- Normal path: created `Review trio` with `B — bridge pickup`, measure `m. 42`, pass 2, active players, one risk, 96 BPM, and rehearsed status. It saved as `SAVED LOCALLY`, persisted after reload, and showed `1/1 REHEARSED`.
- Boundaries: repeat `0` rendered as `1`; BPM `999` rendered as `400` after the status state changed.
- Export/recovery: CSV downloaded as `review-trio.csv`; malformed CSV displayed the documented column-order error; a following valid CSV imported one cue (`A`, 88 BPM). Confirmed delete showed its Undo action and Undo restored the cue.
- Keyboard and focus: the bundled E2E path exercises `Ctrl+Enter` and focus to the section label. Manual screen checks showed no desktop or phone horizontal overflow.
- Reduced motion: fresh `prefers-reduced-motion: reduce` context reported `transition-duration: 0.01ms` and `scroll-behavior: auto`.
- Offline: a fresh phone context obtained a service-worker controller before offline reload; the full app loaded and displayed `OFFLINE — CHANGES STILL SAVE`.
- Privacy: normal first-load and editing traffic stayed same-origin; no console or page errors occurred online. No cue content left the page in this flow. This does not make the unlisted privacy claims compliant.
- Paid checkout: product checkout returned HTTP 303 to hosted Dodo checkout. No purchase was made.
- Legal links: privacy and terms each returned 200 and their route titles were correct.

### Accessibility, browser, and performance evidence

- Fresh desktop and phone Playwright axe scans: 0 serious/critical violations.
- Required CLI scan was run after installing a matching Chrome/ChromeDriver prerequisite:

```text
npx @axe-core/cli@4.11.0 https://rehearsal-section-cues.sociobot.in/ --exit ...
0 violations found
```

- The live home has `lang=en`, a title, one h1, a main landmark, image alt text, visible focus styling, and no online console errors. These checks do not clear the separately listed route, demo, copy, claims, and policy findings.
- Current built initial JS is 23.72 KB (8.12 KB gzip) and CSS is 15.41 KB (4.07 KB gzip), within the stated static budgets. No fresh Lighthouse score is claimed in this review.

## Prior-review disposition

| Earlier finding | Current disposition | Evidence |
| --- | --- | --- |
| P1 checkout endpoint returned 404 (`verification.md`) | Resolved | Current product checkout returned HTTP 303 to hosted Dodo checkout. |
| P3 short static cache policy (`verification.md`, `verification-2.md`) | Still open | All checked live static responses use `max-age=30, must-revalidate`. |
| P3 offline-probe console message (`verification.md`, `verification-2.md`) | Still open | Fresh offline phone run logged `net::ERR_FAILED` while the UI recovered correctly. |
| Prior PASS assertion (`verification-2.md`) | Superseded | This audit found the mandatory demo and claims contracts absent, along with route, metadata, copy, and skeleton defects. |

## Required retest

1. Add `/demo` (or `?demo=1`) with realistic populated sample cues, persistent demo banner, Reset demo and Start for real controls, an isolated `demo:` storage namespace, and `.factory/demo.md`. Prove reset and real-data separation.
2. Create `.factory/claims.json`; remove unsupported copy or provide one tagged, observable demo-sandbox test per public claim. Run every listed command from a clean checkout.
3. Rewrite the first screen and remaining visible headings in plain language: name the cue-sheet job, intended musician, sample-first action, and privacy/offline/price facts. Add the required copy audit.
4. Add a product-styled HTTP 404 response, complete route skeletons, canonical/social metadata, social asset, and live CSP/security configuration. Serve the manifest with an appropriate media type.
5. Retest the two prior P3 items after cache and offline-probe changes, then rerun clean commands, desktop/mobile demo, keyboard/focus, axe, privacy request capture, offline/update, legal links, and 404 checks.
