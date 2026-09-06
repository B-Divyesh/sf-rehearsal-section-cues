# Verification handoff — repair 1 PASS

## Release

- Product: <https://rehearsal-section-cues.sociobot.in>
- Implementation SHA deployed: `2a0b3de2a7173ecbabc5a9bc9c6fc8bf7b5aab80` (`fix: align offline fallback route`), following the demo implementation `1dfe9f7`.
- Verification documentation SHA: `101b107f5774a586fe63d6dde26b2b7ca5c6367e` (`docs: record update verification`)
- Deployment: factory static deployment completed on 2026-09-06 UTC. An initial upload used an older local `dist/` shell; the live-label comparison detected it, so SHA `1dfe9f7` was rebuilt and redeployed. The final SHA `2a0b3de` deployment also aligns the offline fallback with the shared site skeleton. Live HTML contains `REHEARSAL CUE SHEET` / `YOUR DEVICE`.

The product now meets the job: a small ensemble leader or multi-instrument player can make, save, print, export, import, and rehearse a clear cue sheet with a section, pass, active players, risk, tempo, and completion state.

## What changed

- Added `/demo` with four realistic Thursday-trio cues, a visible demo label, Reset demo, and Start for real. Demo storage uses IndexedDB `demo:rehearsal-section-cues`; real plans use `rehearsal-section-cues` and are not read or written during demo mode.
- Added [claims catalog](claims.json), 20 tagged browser claims, the demo guide, landing copy audit, and a plain catalog description. Each claim has an observable sandbox test.
- Rewrote the first screen in plain language: job, audience, sample-first action, and device/offline/price facts are visible before scrolling on desktop and 390px phone.
- Added a product-styled HTTP 404, route-specific titles, canonical/social metadata, original 1200×630 social image, sitemap `/demo`, shared legal skeletons, CSP/security headers, manifest media type, and immutable asset caching.
- Removed the offline connectivity request that logged expected failed-resource noise. Offline state now uses browser connectivity events.
- Brought the offline fallback into the same plain-language header, skip-link, footer, metadata, and recovery structure as the other static routes.
- Pinned Playwright to `1.58.2`, added the URL verifier, and retained the existing local-first core, exports, import recovery, print boundary, checkout, and license paths.

## Verification

Fresh detached worktree at `1dfe9f7`:

```sh
npm ci
npx playwright install chromium
npm test
npm run build
```

Results: `npm test` **3/3 passed**; production build passed and created `dist/`; all 20 commands declared in `claims.json` passed individually; `npm run test:e2e` **46/46 passed** across desktop and 390×844 mobile.

Live cold checks after the final deployment:

- `scripts/verify-url.sh` passed for `/demo`, `/privacy/`, and `/terms/`: one title, `lang=en`, one main, one h1, image alt attributes, and no console errors.
- Fresh desktop and phone contexts saw the plain first screen, then the one-click sample with four populated cues and the persistent demo controls. Neither viewport overflowed. Normal demo traffic stayed same-origin.
- Playwright Axe on live desktop and phone found **0 serious/critical** violations. The standalone Axe CLI was attempted, but the runner’s installed ChromeDriver supports Chrome 152 while the factory’s supplied Chromium is 145; the required equivalent Playwright Axe integration completed successfully.
- Live offline test: after service-worker control, `/demo` reloaded offline, displayed `OFFLINE — CHANGES STILL SAVE`, marked a cue rehearsed, and had **0** console errors.
- A disposable server serving the final `dist/` then changed only its service-worker response. The controlled app displayed `An app update is ready. Reload to use it.`; the update notification remains functional.
- `/not-a-real-page` returns HTTP **404** with `Page not found — Rehearsal Section Cues` and recovery links.
- Live headers: `Content-Security-Policy` (including response-header `frame-ancestors 'none'`), `X-Content-Type-Options`, `Referrer-Policy`, Permissions Policy; manifest is `application/manifest+json`; hashed app assets are `max-age=31536000, immutable`; HTML is `no-cache, must-revalidate`.
- Live Lighthouse on `/demo`: Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP **0.9 s**, CLS **0**.
- Live product checkout returned HTTP **303** to the registered hosted checkout. The offer evidence is in `/work/.evidence/billing-offer.json`.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run test:e2e
```

Run every public claim from a clean build:

```sh
node -e "for (const claim of require('./.factory/claims.json')) console.log(claim.test)"
```

Run each printed command. `npm run preview` serves `dist/`; `scripts/verify-url.sh <url>` checks the basic document and console state.

## Earlier findings disposition

| Finding | Disposition |
| --- | --- |
| Missing one-click demo sandbox | Resolved with isolated `/demo`, sample, reset, start-real, and demo guide. |
| Missing claims catalog / 20 untested claims | Resolved with `claims.json`, 20 tagged observable tests, and individual clean-run evidence. |
| First screen and plain words | Resolved; audited in `copy-audit.md`. |
| Missing designed 404 | Resolved; live HTTP 404 verified. |
| Missing metadata, CSP, manifest type | Resolved; live metadata and headers verified. |
| Legal pages missing shared skeleton | Resolved; header, skip link, nav, footer, title, and h1 added. |
| Short asset cache policy | Resolved; live app assets are immutable for one year. |
| Offline probe console error | Resolved; fresh live offline test has no console errors. |
| Earlier unavailable checkout | Already resolved before this repair; rechecked live as HTTP 303. |

## Known limitation

No real purchase or valid production license was used. Checkout routing, the invalid-license recovery path, and the post-verification valid-license UI gate are tested; a full paid return-token/entitlement test requires a billing-issued test or purchased license from the billing operator. The free core is complete and remains usable without it.
