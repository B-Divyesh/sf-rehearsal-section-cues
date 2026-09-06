# Rehearsal Section Cues

Make a clear, printable cue sheet for each rehearsal section. It is for ensemble leaders and multi-instrument players who need the start, pass, active players, technical risk, tempo, and rehearsal state in one shared plan.

Live product: <https://rehearsal-section-cues.sociobot.in>

## Start with the sample

Open <https://rehearsal-section-cues.sociobot.in/demo> to load a filled Thursday trio rehearsal. The demo has its own IndexedDB namespace and never changes the real plan. Use **Reset demo** to restore its shipped sample or **Start for real** to discard the sample and open an empty plan.

The full catalog of user-visible claims and the command that tests each one is in [`.factory/claims.json`](.factory/claims.json). The demo storage model is documented in [`.factory/demo.md`](.factory/demo.md).

## Develop

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

The development server prints its local URL. Real plans use the origin’s IndexedDB database `rehearsal-section-cues`; demo plans use `demo:rehearsal-section-cues`.

## Verify and build

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Run every public-claim command from a clean checkout:

```sh
node -e "for (const claim of require('./.factory/claims.json')) console.log(claim.test)"
```

Each printed command opens the demo sandbox and verifies an observable result. `npm run build` emits `dist/`, including the PWA service worker and `staticwebapp.config.json`. Preview that exact output with:

```sh
npm run preview
```

## Deploy

Deploy the generated `dist/` directory to the product’s static hosting target. The durable Static Web Apps configuration in `staticwebapp.config.json` sets the security headers, manifest media type, demo rewrite, 404 rewrite, and cache policy. Keep one static deployment; cue-sheet state is browser-local and does not require a backend.

## Data and optional paid unlock

Cue-sheet content remains in the browser. JSON and CSV exports are local files. The optional Conductor unlock is a $12 one-time purchase through Sociobot checkout. A returned license is stored in `localStorage` and verified against the registered product at most once a day. The paid offer metadata used by the factory billing operator is recorded outside the repository in `/work/.evidence/billing-offer.json`.

## Product records

- Product brief: [`.factory/brief.json`](.factory/brief.json)
- Visual system and asset provenance: [`.factory/design.md`](.factory/design.md)
- Copy audit: [`.factory/copy-audit.md`](.factory/copy-audit.md)
- Demo sandbox: [`.factory/demo.md`](.factory/demo.md)
- Verification handoff: [`.factory/handoff.md`](.factory/handoff.md)
- License: [MIT](LICENSE)
