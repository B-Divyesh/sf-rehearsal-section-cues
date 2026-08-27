# Verification handoff — FAIL

Candidate verified: `be3c8a76c3d93fbd837ab5d6ebb7a29a94bdf525` (`docs: finalize audits and production handoff`)

Live URL verified: <https://rehearsal-section-cues.sociobot.in/> on 2026-08-27.

## Release decision

**FAIL — do not release/advertise the paid unlock yet.** The free local-first cue-sheet builder works, but the advertised Conductor unlock cannot start checkout: a fresh unauthenticated `GET https://api.sociobot.in/api/v1/products/rehearsal-section-cues/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}`. This is a factory billing registration/enabling failure, not a product-code failure.

## What was independently verified

- Clean candidate checkout; `npm ci` completed with 0 vulnerabilities.
- `npm test`: 3/3 passed.
- Exact production command `npm run build`: passed (`tsc -b`, Vite build, service-worker injection) and produced `dist/`.
- `npm run test:e2e`: 6/6 passed on desktop Chromium and 390×844 mobile after installing the browser revision resolved by the lockfile.
- Independent local Chromium checks: create/edit/complete/save/reload; max and invalid numeric handling (repeat clamps to 1, tempo to 400 on rerender); empty/incomplete-print recovery; free seven-cue print limit; malformed CSV error then valid CSV recovery; import replacement; reorder; confirmed delete and undo; JSON/CSV ownership paths; keyboard shortcut/focus; mobile no-horizontal-overflow; print media; reduced motion; IndexedDB persistence; and offline reload/editing.
- Axe had **0 serious/critical** violations. Keyboard focus was visibly `3px`; reduced motion reduced animation/transition durations to `0.01ms` and scrolling to `auto`.
- Simulated a service-worker version change against the exact built shell: it precached the new version, retired the old cache after activation, and presented “An app update is ready. Reload to use it.” Offline reload on the live URL was controlled by `/sw.js` and rendered the app with “OFFLINE — CHANGES STILL SAVE”.
- Live deployment identity: fresh `dist/index.html`, manifest, app JS, CSS, and mobile hero WebP hashes matched live exactly. `sw.js` differed only in its build-time cache-version timestamp, as expected from the build injection step; its precache and logic otherwise matched.
- Live browser page had title, `lang="en"`, exactly one `h1`, one `main`, parsed manifest with no Chrome manifest errors, no third-party requests on a normal first load, and no online console/page errors. Cue data stays in IndexedDB; only a supplied license token is sent to `api.sociobot.in` for verification.
- Lighthouse mobile run against live: Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0.8 s, LCP 0.9 s, CLS 0, TBT 120 ms, Speed Index 0.8 s. The CLI reported a browser-tab crash while collecting optional final screenshot/BFCache artifacts after writing the result; category/audit values above were present in that written report.
- Built initial JS is 23,721 bytes and CSS 15,408 bytes (well under 200 KB / 50 KB); mobile hero WebP is 21,940 bytes; no web fonts.

## Defects and follow-up

### P1 — release blocker: paid checkout endpoint is not enabled

Evidence: `GET https://api.sociobot.in/api/v1/products/rehearsal-section-cues/checkout` → HTTP 404, `{"error":"enabled factory product","status":404}`. The UI links directly to this endpoint and promises a $12 one-time Conductor unlock, so a buyer cannot begin checkout or obtain a license.

Factory action: register/enable the `rehearsal-section-cues` product and return URL in Sociobot billing, then re-run the checkout redirect and valid-license restore test. No product-code change is indicated.

### P3 — deployment cache policy does not meet the stated immutable-asset recommendation

Live `index.html`, `sw.js`, hashed JS, CSS, and assets all receive `Cache-Control: public, must-revalidate, max-age=30`. The service worker keeps the app usable offline, but hashed `/assets/index-*.js` and `/assets/index-*.css` are not given long-lived immutable caching.

Factory action: preserve short/revalidatable caching for HTML and `sw.js`; apply long-lived `immutable` caching to content-hashed assets.

### P3 — minor offline console noise

While intentionally offline, the network-only `/connectivity-check.txt` request reports `Failed to load resource: net::ERR_FAILED` in Chromium before the UI correctly announces offline state. Online load had no console/page errors and offline editing/reload works.

Product follow-up: optionally avoid reporting the expected offline probe as a console error (for example, use an offline-aware request strategy).

## How to reproduce

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Use `npm run preview` for the exact `dist/` output. The complete evidence and acceptance rationale are in [`.factory/verification.md`](verification.md).
