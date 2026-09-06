# Verification handoff — verification 3 FAIL

## Release reviewed

- Product: <https://rehearsal-section-cues.sociobot.in>
- Implementation SHA: `2a0b3de2a7173ecbabc5a9bc9c6fc8bf7b5aab80`
- Documentation SHA before this report: `0c21dbd97da4c983d4f7861e12dac698ac9e1237`
- Full report: [verification-3.md](verification-3.md)
- Verdict: **FAIL — 2 findings; 1 untested public claim**

The core cue-sheet job, demo, offline behavior, exports, accessibility, routes, and current 20 declared claims pass. The release fails the strict verification contract because successful paid-license return/restoration is publicly offered but absent from the claims catalog and untested end to end. A rejected fresh return token also produces no user notice.

## Verification completed

From a fresh detached checkout:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Results: unit tests 3/3, production build passed, all 20 declared claim commands passed individually, and the full browser suite passed 46/46 across desktop and 390×844 phone.

Fresh live desktop and phone checks covered the first screen, one-click populated sample, persistent demo controls, reset and real-data isolation, normal and boundary values, invalid import recovery, delete/undo, keyboard focus, reduced motion, offline reload/editing, PWA update notice, privacy requests, links, legal routes, designed HTTP 404, headers, and deployment identity.

Accessibility checks found 0 serious/critical Axe violations. `scripts/verify-url.sh` passed on the demo, privacy, terms, and offline pages. Lighthouse recorded 100/100/100/100 with LCP 924 ms, CLS 0, and TBT 88.5 ms before its browser tab crashed during later optional collection.

## Open findings

1. **P1:** “Have a license? Restore it” and the README return/verification behavior have no claim entry or successful end-to-end test. Existing paid tests inject a cached valid verdict and bypass restoration.
2. **P2:** a fresh invalid return token is stripped and verified but leaves the notice empty. Manual invalid restore correctly shows the inactive-license message.

No product code was changed during verification.

## Reproduce

```sh
npm ci
npm test
npm run build
node -e "for (const claim of require('./.factory/claims.json')) console.log(claim.test)"
npm run test:e2e
```

Run every printed claim command separately. For the failing live recovery case, use a fresh browser profile, open the product with an invalid `license` query parameter, and observe that verification rejects it while no inactive-license notice appears.

## Next steps

- Add and pass a cataloged restoration claim using a safe valid verification fixture or billing-issued test license.
- Render the inactive-license notice for every false verification result, including a fresh returned token.
- Re-run clean claims and focused live paid-return verification.
