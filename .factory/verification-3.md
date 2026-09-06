# Verification 3 — Make and print a rehearsal cue sheet

## Verdict

**FAIL — 2 findings, including 1 untested public claim.**

- Live URL: <https://rehearsal-section-cues.sociobot.in>
- Implementation reviewed: `2a0b3de2a7173ecbabc5a9bc9c6fc8bf7b5aab80`
- Documentation reviewed: `0c21dbd97da4c983d4f7861e12dac698ac9e1237`
- Verification date: 2026-09-06 UTC

The core rehearsal job works well, and all 20 cataloged claims pass. The release cannot receive a PASS because the public paid-license restore/return promise is absent from the claims catalog and has no successful end-to-end test. The invalid return-token path also fails to tell the user that the license is inactive.

## Findings

### P1 — Paid-license restoration is an unlisted and untested public claim

The product offers **“Have a license? Restore it”**. The README also says a returned license is stored and verified. No entry in `.factory/claims.json` covers successful return-token capture, verification, restoration, and paid activation with a billing-issued or recorded valid fixture.

The closest declared tests do not cover that flow:

- `checkout-redirect` proves only that checkout starts.
- `paid-unlimited-print` and `paid-condensed-print` inject a cached valid verdict directly into localStorage. They bypass the return URL, restore form, and verification response.

The handoff explicitly says that no real paid-license return was completed. This leaves **1 public claim untested**. Under the work order, an incomplete claims catalog is a release finding even though all commands currently listed in it pass.

Required evidence for closure: add the restoration claim to the catalog and test the observable success path with a safe billing-issued test license or a recorded verification fixture. The test must start through the return URL or restore form and end with paid controls enabled.

### P2 — A rejected return token gives no user notice

In a fresh live browser, I opened `/?license=<invalid test token>`. The app:

1. removed the token from the address bar;
2. stored it locally;
3. called the permitted Sociobot verification endpoint;
4. received HTTP 200 with an invalid verdict;
5. kept paid features locked; and
6. left `#form-notice` empty.

The manual restore form behaves better: the same invalid-verdict class displays **“This license is not active. Check the token or use the purchase link.”**

This defect is limited to a fresh returned token whose first verdict is invalid. The required paid-unlock behavior says every false verdict must lock paid features and show a quiet inactive-license notice. An expired, invalid, or wrong-product return currently gives no explanation or recovery action.

## Job, audience, and first action before scrolling

Fresh 1440×1000 desktop and 390×844 phone contexts showed all required information without scrolling:

- Job: **“Make a rehearsal cue sheet.”**
- Audience: ensemble leaders and multi-instrument players who need repeated sections clear.
- First action: **“Try it with sample data.”**
- Action result: **“Opens a filled rehearsal plan you can reset.”**
- Facts: device-local plan, offline after first visit, and optional $12 one-time unlimited printing.

There was no horizontal overflow. The visual review showed a clear drafting-sheet interface on both viewports.

## Clean-checkout evidence

I cloned the current documentation tip into a fresh detached checkout. The product files are unchanged from the implementation candidate.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 61 packages installed, 0 reported vulnerabilities |
| `npm test` | PASS — 3/3 |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 46/46 across desktop and 390×844 phone |

The build emitted 26.87 KB JS (8.85 KB gzip), 16.30 KB CSS (4.25 KB gzip), and a 21.94 KB mobile hero image. These are within the static-product budgets.

## Declared claims

Every command in `.factory/claims.json` was run separately from the clean checkout. Each command ran one tagged browser test.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sample` | PASS | Four named Thursday trio cues loaded with complete references, players, risks, repeats, tempos, and states. |
| `demo-isolation` | PASS | Reset restored the sample; Start for real returned to the unchanged real title and cue. |
| `automatic-saving` | PASS | Edited cue survived reload. |
| `device-only` | PASS | Editing traffic stayed on the product origin. |
| `offline-reload` | PASS | Controlled demo reloaded and edited offline with no console errors. |
| `keyboard-add` | PASS | Ctrl+Enter added a cue and focused its section label. |
| `mobile-layout` | PASS | 390×844 demo had no horizontal overflow and a 44 px add target. |
| `reduced-motion` | PASS | Transition duration reduced to `0.01ms`; scrolling became automatic. |
| `high-contrast-print` | PASS | Print mode was black on white and editing controls were hidden. |
| `json-export` | PASS | Download contained the sample title and all four cues. |
| `csv-export` | PASS | Download contained the expected header and four data rows. |
| `import-recovery` | PASS | Bad CSV showed an error; a following valid CSV imported. |
| `free-print-limit` | PASS | Seven cues produced the six-cue free-print explanation. |
| `free-data-tools` | PASS | A seven-cue sheet still exported all seven cues. |
| `paid-unlimited-print` | PASS | An injected cached valid verdict allowed seven-cue printing. |
| `paid-condensed-print` | PASS | An injected cached valid verdict enabled condensed layout. |
| `one-time-price` | PASS | Terms displayed $12 one-time and no subscription. |
| `checkout-redirect` | PASS | Registered checkout returned HTTP 303 to hosted checkout. |
| `no-accounts-or-trackers` | PASS | Sample editing made no third-party request. |
| `no-score-or-cloud-storage` | PASS | Entered rehearsal references and notes stayed off the network. |

Declared claims: **20 passed, 0 failed.** Cross-checking the UI and README found the additional unlisted restore/return claim described above, so the final untested-claim count is **1**.

## Live functional evidence

- One-click sample: loaded **Thursday trio rehearsal** with opening groove, bridge pickup, solo handoff, and final tag. Every cue contained realistic measure, player, risk, repeat, tempo, and completion data.
- Demo label and controls: the demo warning, Reset demo, and Start for real remained available. Demo edits and reset did not change a real plan created in the same fresh browser profile.
- Normal and boundaries: repeat `0` normalized to `1`; BPM `999` normalized to `400`.
- Recovery: malformed CSV showed its column-order error; a valid CSV then imported. Confirmed delete exposed Undo, and Undo restored the cue.
- Keyboard and focus: Ctrl+Enter added a cue, moved focus to its label, and showed a solid 3 px focus outline.
- Reduced motion: transition and animation durations were `0.01ms`; scroll behavior was `auto`.
- Privacy: the full sample/edit/export flow contacted only the product origin. Explicit license verification contacted only the permitted `api.sociobot.in` endpoint.
- Offline: after service-worker control, `/demo` reloaded offline, showed `OFFLINE`, accepted an edit, and logged no console errors.
- Update: a disposable preview of the exact build was rebuilt with a new service-worker version. The controlled app displayed **“An app update is ready. Reload to use it.”** and activated the new shell cache after reload.
- Checkout: the production product endpoint returned HTTP 303 to the hosted checkout. No purchase was made.
- Backend-only tenant, restart, health, and 429 checks: not applicable; this is a static local-first PWA with no product backend.

## Routes, accessibility, links, and deployment

- `/`, `/demo`, `/privacy/`, and `/terms/` returned HTTP 200 with route-specific titles, one h1, one main landmark, the shared header/footer, and skip links.
- `/not-a-real-page` deliberately returned HTTP 404 with **“Page not found — Rehearsal Section Cues”** and working recovery links. This expected 404 is not a defect.
- The internal link crawl passed. The checkout link returned its expected 303 redirect. Privacy-request and purchase-support email links were present.
- `scripts/verify-url.sh` passed for `/demo`, `/privacy/`, `/terms/`, and `/offline.html`: correct title/lang/main/h1, no missing image alt, and no console errors.
- Playwright Axe found 0 serious/critical violations on fresh desktop and phone demos and on every tested route.
- The live CSP is a response header and includes `frame-ancestors 'none'`. Referrer, MIME-sniffing, permissions, and HSTS headers are present. The manifest uses `application/manifest+json`; hashed assets use one-year immutable caching; HTML is revalidated.
- Manifest, robots, sitemap, canonical/social metadata, icons, and the original 1200×630 social image were present.
- Lighthouse produced Performance 100, Accessibility 100, Best Practices 100, and SEO 100; LCP 924 ms, CLS 0, and TBT 88.5 ms. Lighthouse wrote the results before its browser tab crashed during later optional collection, so the command exited nonzero even though the report contains the stated measurements.

Live `index.html`, JS, CSS, manifest, privacy, terms, 404, and offline documents exactly matched the clean candidate build by SHA-256. The service worker also matched after normalizing its generated cache-version value. Later commits through `0c21dbd` change only `.factory/handoff.md`.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Checkout returned 404 | Resolved — live checkout returns HTTP 303. |
| Short cache lifetime for hashed assets | Resolved — live hashed assets are one-year immutable. |
| Offline probe logged an expected resource error | Resolved — fresh offline reload/edit logged no console errors. |
| No one-click demo sandbox | Resolved — isolated populated `/demo`, reset, and Start for real passed. |
| Missing claims catalog and 20 untested claims | Partly resolved — all 20 added claims pass, but paid restoration remains unlisted and untested. |
| First screen did not state job, audience, action, and facts | Resolved on desktop and phone before scrolling. |
| Missing real 404 | Resolved — designed page returns HTTP 404. |
| Missing metadata, CSP, manifest type, and social image | Resolved live. |
| Legal pages lacked the shared skeleton | Resolved live. |
| Offline fallback lacked the shared skeleton | Resolved live. |

## Required next steps

1. Add a cataloged, fixture-backed success test for paid license return/restoration and activation.
2. Show the inactive-license notice whenever verification returns false, including the first verdict after a return URL.
3. Re-run every claim command and the focused live return-token checks before changing the verdict.
