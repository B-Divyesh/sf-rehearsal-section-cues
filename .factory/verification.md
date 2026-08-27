# Independent verification — rehearsal-section-cues-verify-1

## Scope and decision

- Candidate: `be3c8a76c3d93fbd837ab5d6ebb7a29a94bdf525`
- Candidate subject: `docs: finalize audits and production handoff`
- Live target: <https://rehearsal-section-cues.sociobot.in/>
- Date: 2026-08-27
- Result: **FAIL**

The score-agnostic, local-first cue-sheet job is implemented and independently works in normal, invalid, offline, desktop, mobile, keyboard, and print-oriented flows. The release nevertheless fails the researched brief’s one-time monetization contract because the visible Conductor unlock checkout link currently reaches an unregistered/disabled Sociobot product (HTTP 404). This is deployment/billing configuration, not a source-code defect.

## Environment and commands

The worktree was clean at the candidate before verification. I ran:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm ci` completed with 0 known vulnerabilities. There is no lint script/configuration in this repository. The TypeScript type check is part of the exact build command (`tsc -b && vite build && node scripts/inject-sw.mjs`).

| Check | Result | Evidence |
| --- | --- | --- |
| Unit tests | PASS | Vitest 3/3 tests passed. |
| Type check / production build | PASS | Exact `npm run build` passed and emitted `dist/`. |
| Repository E2E | PASS | Playwright 6/6 across desktop and 390×844 mobile. The initial run could not find the lockfile-resolved browser revision; after the required `npx playwright install chromium`, the unchanged suite passed. |
| Bundle budget | PASS | JS 23,721 B; CSS 15,408 B; no web-font payload; mobile hero WebP 21,940 B. |
| Live identity | PASS | SHA-256 exact matches for `index.html`, manifest, app JS, CSS, and 640px WebP. The only `sw.js` delta was its injected timestamped `CACHE_VERSION`; precache list and logic matched. |
| Live billing purchase start | **FAIL** | Checkout endpoint returned HTTP 404 as documented below. |

## Independent end-to-end exercise

Using a production build served locally in Chromium, I exercised the smallest useful product rather than relying only on repository tests.

| Scenario | Result |
| --- | --- |
| Create a plan and cue with section, measure, pass, players, risk, tempo, status | PASS — saved locally and persisted across reload. |
| Normal values | PASS — plan and rehearsal completion state were reflected immediately; save state became `SAVED LOCALLY`. |
| Boundary / invalid numbers | PASS with minor UI caveat — entering repeat `0` and tempo `999` temporarily leaves native-invalid field text, but the retained model and next render clamp to `1` and `400`; printing uses the valid retained data. |
| Empty and incomplete print | PASS — empty plan says “Add at least one section cue before printing.” and focuses Add; unlabeled cues focus their section-label field. |
| Free-tier six-cue boundary | PASS — seven valid cues produce the clear paid-limit notice while import/export remains available. |
| Invalid import and recovery | PASS — malformed CSV gives “This CSV does not use the Rehearsal Section Cues column order.”; a valid two-row CSV subsequently imports. |
| Replacement/import, reorder, delete | PASS — replacement confirmation works; cue 2 moves up; confirmed delete reduces count; Undo restores it. |
| Keyboard-only | PASS — `Ctrl`/`Cmd`+`Enter` creates a cue and moves focus to section label; focus ring measured at 3px. |
| 390px mobile | PASS — no horizontal overflow; the actual regression suite covers creation, persistence, axe, and offline at 390×844. |
| Motion | PASS — `prefers-reduced-motion: reduce` produces 0.01ms animation/transitions and `scroll-behavior: auto`. |
| Print | PASS — print media switches to black on white, hides editing chrome through `.no-print`, and exposes print values. |
| Accessibility | PASS — independent `@axe-core/playwright` scan: 0 serious/critical violations. Live page: `lang=en`, title, exactly one h1, main landmark, image alt text, visible focus. |
| PWA offline | PASS — app shell controlled by live `/sw.js`; after `context.setOffline(true)`, full reload rendered the heading and `OFFLINE — CHANGES STILL SAVE`; editing remained available. |
| PWA update | PASS — a controlled version change of the exact generated service worker created the new versioned shell cache, retired the old cache on activation, and showed the in-app update notice. |

## Privacy, outbound network, and policy checks

- Source scan and fresh first-load browser capture found no trackers, analytics, third-party fonts/scripts, CDN runtime dependencies, accounts, or cloud score/chart upload. Normal first load made no cross-origin request.
- User cue data is stored in IndexedDB database `rehearsal-section-cues`; export/import are local files. License token/verdict storage is limited to the documented localStorage keys.
- The only configured third-party operation is the permitted Sociobot billing API: checkout and verification. A safe invalid-token verification probe returned `200 {"expires_at":null,"reason":"invalid","valid":false}` with `Cache-Control: no-store`.
- Privacy and terms routes both returned HTTP 200 and accurately describe IndexedDB/localStorage, license verification, no tracking, data ownership, price, and merchant of record.
- Live headers include HTTPS/HSTS (`max-age=10886400; includeSubDomains; preload`), `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`. The web manifest is served as `application/octet-stream`, but Chrome parsed it with zero manifest errors and its icons/start URL/display metadata were present.
- No online console/page errors were observed. Intentional offline mode causes the connectivity probe’s expected `net::ERR_FAILED` console resource error; see P3.

## Performance and cache evidence

Mobile Lighthouse against the live deployment reported Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 0.8 s, LCP 0.9 s, CLS 0, TBT 120 ms, Speed Index 0.8 s. Lighthouse wrote its JSON report but reported a browser-tab crash while collecting optional screenshot/BFCache artifacts afterward; the stated category and metric results were read from that report.

All live HTML, service-worker, manifest, JavaScript, CSS, and hashed image responses use `Cache-Control: public, must-revalidate, max-age=30`. This permits quick deployment visibility and does not prevent the SW precache from working, but it misses the factory’s long-lived immutable caching recommendation for content-hashed JS/CSS. See P3.

## Defects by severity

### P1 — paid checkout is unavailable (release blocker)

Fresh evidence:

```text
GET https://api.sociobot.in/api/v1/products/rehearsal-section-cues/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

Impact: the product advertises a $12 one-time Conductor unlock, but a user cannot enter checkout or obtain a license. The core free product still works, but the configured monetization flow does not.

Resolution owner: factory/billing deployment. Register and enable `rehearsal-section-cues` in Sociobot and configure its return URL, then verify checkout redirect, successful return token capture, and valid-license restore. No direct-payment provider should be added to product code.

### P3 — content-hashed assets lack immutable cache lifetime

Evidence: `/assets/index-DLfHLCHE.js` and `/assets/index-Budmp-Ng.css`, like HTML and SW, are served with `Cache-Control: public, must-revalidate, max-age=30`.

Impact: unnecessary revalidation/bandwidth for stable hashed assets. Offline shell remains functional.

Resolution owner: deployment configuration. Use long-lived immutable cache control for hashed assets while retaining short/revalidatable policies for `index.html` and `sw.js`.

### P3 — expected offline-probe console resource error

Evidence: when offline the intentional network-only `/connectivity-check.txt` request logs `Failed to load resource: net::ERR_FAILED`; the UI correctly changes to offline and editing/reload work.

Impact: development diagnostics are noisier in a supported offline condition.

Resolution owner: product code, non-blocking. Suppress/avoid the expected failed resource request while retaining the connectivity state update.

## Retest criteria

1. The checkout URL must return a hosted checkout redirect/page rather than 404.
2. Complete a non-production-safe test purchase in the appropriate environment and confirm return-token capture, local optimistic unlock, daily verification cache, invalid/revoked handling, and restore on a second browser profile.
3. Recheck the live endpoint response policy after immutable cache configuration.
4. Re-run the listed local commands plus fresh live identity/offline checks.
