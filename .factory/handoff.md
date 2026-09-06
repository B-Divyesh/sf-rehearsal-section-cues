# Verification handoff — current review FAIL

## Current release status

The 2026-09-06 independent review is **FAIL**, not a product PASS. The live core cue editor works, but the mandatory one-click isolated demo and required `.factory/claims.json` claim-test catalog are absent. The review also records first-screen plain-language, 404, metadata/CSP, legal-route skeleton, cache-policy, and offline-console findings.

Read [`.factory/review-1.md`](review-1.md) for the complete evidence, severity classification, 20 untested public claims, prior-finding disposition, and retest requirements. The current implementation SHA is `be3c8a76c3d93fbd837ab5d6ebb7a29a94bdf525`; documentation SHA is `108f75f5850605a9f4df6dc63ff56393cb170221`.

## Commands verified in this review

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run test:e2e
```

All above commands passed locally. That does not replace the missing declared claim commands.

---

# Historical verification handoff — PASS (superseded)

Candidate verified: `be3c8a76c3d93fbd837ab5d6ebb7a29a94bdf525` (`docs: finalize audits and production handoff`)

Live URL verified: <https://rehearsal-section-cues.sociobot.in/> on 2026-08-28 UTC.

## Release decision

**PASS — the candidate and live deployment meet the researched cue-sheet-builder contract.** Fresh evidence clears the prior deployment-only billing failure: the configured Sociobot checkout endpoint now returns a hosted Dodo checkout **303**. The local-first cue workflow, mobile layout, accessibility, high-contrast print, privacy model, offline PWA, and invalid-license recovery all passed.

## Evidence summary

- Clean detached candidate checkout: `npm ci` (0 reported vulnerabilities), `npm test` (3/3), and exact `npm run build` all passed. The available TypeScript check is part of the production build; no lint command/configuration exists.
- After installing the lockfile-resolved Chromium, repository Playwright passed 6/6 on desktop and 390×844 mobile.
- Independent live Chromium testing passed normal creation/persistence/completion, numeric boundaries (`0 → 1`, `999 → 400`), seven-cue free-print gating, malformed-then-valid CSV recovery, deletion/Undo, export, keyboard focus, print styling, 390px no-overflow, reduced motion, axe (0 serious/critical), offline reload/editing, invalid-license recovery, and service-worker update toast/reload behavior.
- Live HTML, manifest, and image hashes match the candidate build. Service-worker logic/precache matches; its cache-version timestamp is intentionally build-specific.
- Normal live loads made no third-party requests, trackers, analytics, CDN font requests, console errors, or page errors. Cue data stays in IndexedDB; a supplied license token is the only data sent to permitted Sociobot verification.
- Fresh mobile Lighthouse: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 834 ms, LCP 906 ms, TBT 34 ms, CLS 0. The report wrote successfully; Chrome then crashed while gathering optional final screenshot/BFCache artifacts.

## Non-blocking follow-up

- **P3:** live static responses use a 30-second revalidating cache policy. Consider immutable caching for content-addressed assets while keeping HTML/service worker short-lived.
- **P3:** deliberate offline mode logs the expected failed `/connectivity-check.txt` request before the correct offline state appears.

## Reproduce

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Run `npm run preview` for exact `dist/`. Full fresh evidence is in [`.factory/verification-2.md`](verification-2.md).
