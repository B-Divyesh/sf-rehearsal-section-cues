# Independent verification 2 — PASS

## Scope

- Candidate: `be3c8a76c3d93fbd837ab5d6ebb7a29a94bdf525` (`docs: finalize audits and production handoff`)
- Live target: <https://rehearsal-section-cues.sociobot.in/>
- Date: 2026-08-28 UTC
- Result: **PASS**

This fresh verification supersedes the earlier deployment-only failure. The researched job is met: a small-ensemble leader can make a clear local cue sheet with section, repeat, players, risk, tempo, and completion state; print it; retain/export it; and use it offline. The formerly unavailable paid checkout now starts successfully.

## Clean candidate gates

Detached clean checkout: `/tmp/rehearsal-section-cues-qa` at the exact candidate SHA.

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

| Check | Result | Evidence |
| --- | --- | --- |
| Install | PASS | `npm ci` completed with 0 reported vulnerabilities. |
| Unit tests | PASS | Vitest: 3/3 tests passed. |
| Type check / exact production build | PASS | `tsc -b && vite build && node scripts/inject-sw.mjs` passed and emitted `dist/`. |
| Repository E2E | PASS | 6/6 Playwright tests passed on Desktop Chrome and 390×844 mobile. The initial run could not launch because the lockfile browser revision was absent; `npx playwright install chromium` resolved it without source changes. |
| Lint | N/A | No lint script or lint configuration exists; the available type check is part of `npm run build`. |
| Bundle budget | PASS | JS 23,721 B; CSS 15,408 B; no web-font payload; 640px hero WebP 21,940 B. |

## Independent live product exercise

Fresh Chromium checks, separate from the repository suite, passed:

| Scenario | Result |
| --- | --- |
| Normal workflow | PASS — title, section `B — bridge pickup`, measure `m. 42`, players, risk, pass, tempo, completion, autosave, and reload persistence. |
| Boundaries | PASS — `repeat=0` rerendered as `1`; `tempo=999` rerendered as `400`. |
| Print/export | PASS — seven cues showed the explicit six-cue free-print limit while CSV exported as `qa-trio-rehearsal.csv`; print media is black on white with editing chrome hidden. |
| Invalid/recovery | PASS — malformed CSV displayed its column-order error; a following valid two-cue CSV imported successfully. |
| Delete/recovery | PASS — confirmed delete reduced two cues to one; Undo restored two. |
| Keyboard | PASS — `Ctrl+Enter` added a cue and focused its label with a visible `3px solid` focus outline. |
| Desktop / mobile a11y | PASS — title, `lang=en`, exactly one h1, one main; labels and alt text present; axe serious/critical: 0 on desktop and 390px mobile. |
| Mobile | PASS — 390×844 has no horizontal overflow, 16px body text, and sampled primary controls at least 44px high. Visual review confirms the drafting-sheet layout stacks cleanly. |
| Reduced motion | PASS — transition/animation duration `0.01ms`; scroll behavior `auto`. |
| Offline PWA | PASS — production `/sw.js` controlled the page. Offline reload rendered the app and `OFFLINE — CHANGES STILL SAVE`; an offline cue edit succeeded. |
| PWA update | PASS — a disposable fixture from the exact generated shell served a changed cache version. It precached the new shell, showed “An app update is ready. Reload to use it.”, and after reload activated the new worker and removed the old shell cache. |
| License recovery | PASS — invalid restore token displayed “This license is not active…” and requested only the permitted Sociobot verification URL. |

Normal live loads had no console errors, page errors, trackers, analytics, CDN font/script requests, or third-party origin requests. The sole intentional offline console message is recorded below.

## Deployment identity and policies

- Live `index.html`, manifest, 640/1024 WebP, and JPEG SHA-256 hashes exactly match the candidate build. `sw.js` differs only in the generated cache-version timestamp; its code and precache list match.
- Manifest parsed in Chromium and contains standalone display, versioned start URL, theme/background colors, and maskable 192/512 icons.
- Cue content is local IndexedDB (`rehearsal-section-cues`). License token/verdict is limited to localStorage. JSON/CSV remain local files. No cue data is sent remotely.
- `/privacy/` and `/terms/` returned HTTP 200 and describe the actual local storage and hosted Sociobot/Dodo checkout behavior.
- Fresh checkout evidence: `GET https://api.sociobot.in/api/v1/products/rehearsal-section-cues/checkout` returned **HTTP 303** to `https://checkout.dodopayments.com/session/...`. This resolves the earlier P1. Safe invalid verification returned `200 {"expires_at":null,"reason":"invalid","valid":false}` with `Cache-Control: no-store`.
- Live app headers include HTTPS/HSTS (`max-age=10886400; includeSubDomains; preload`), `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`. The manifest uses `application/octet-stream` but parsed successfully in Chromium.

## Performance

Fresh mobile Lighthouse: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**; FCP 834 ms, LCP 906 ms, Speed Index 1,078 ms, TBT 34 ms, CLS 0. Lighthouse wrote its JSON report but Chrome crashed while later gathering optional final-screenshot/BFCache artifacts; the recorded category and metric values came from that report.

## Non-blocking defects

### P3 — static cache policy is short-lived

Live HTML, service worker, manifest, and assets use `Cache-Control: public, must-revalidate, max-age=30`. Offline behavior and Lighthouse cache checks pass, but immutable caching would be more efficient for content-addressed deploy assets.

Owner: deployment configuration. Retain short/revalidatable policies for HTML and `sw.js`; use long-lived immutable caching for content-addressed static assets where applicable.

### P3 — expected offline-probe console noise

When intentionally offline, the network-only `/connectivity-check.txt` probe logs Chromium `Failed to load resource: net::ERR_FAILED` before the correct offline status is shown. Online loads had no console/page errors and offline use works.

Owner: product follow-up. An offline-aware connectivity probe could avoid the expected diagnostics noise.

## Retest

Use the clean commands above, then `npm run preview` for exact `dist/`. Recheck checkout redirect after billing changes; use an invalid token to exercise license failure/recovery without a real purchase.
