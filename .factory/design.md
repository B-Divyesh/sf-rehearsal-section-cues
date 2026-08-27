# Blueprint drafting sheet — visual thesis

## Direction and rationale

Rehearsal Section Cues looks like the working drawing pinned beside a music stand: precise cobalt construction lines on warm drafting paper, red pencil checks, registration marks, and compact specifications. A cue sheet is an operating plan rather than a score, so the visual system makes relationships and readiness legible without imitating notation software. Decoration is functional: the grid supports alignment, dimension ticks explain progress, and the hero illustration shows the finished artifact in use.

This is an intentionally light, paper-led treatment. Dark mode would undermine the print-preview mental model and make screen-to-paper state less predictable; strong contrast, explicit backgrounds, and a dedicated ink-only print mode cover low-light and accessibility needs without changing the product metaphor.

## Tokens

| Role | Token | Value | Purpose |
| --- | --- | --- | --- |
| drafting paper | `--paper` | `#f7f3e8` | page background |
| clean sheet | `--sheet` | `#fffdf6` | working surfaces |
| blueprint ink | `--ink` | `#11243d` | primary text, 12.7:1 on paper |
| annotation ink | `--muted` | `#526273` | secondary text, 5.7:1 on paper |
| cobalt line | `--blue` | `#145aa3` | focus, controls, construction lines |
| deep cobalt | `--blue-deep` | `#0a3970` | primary action, 8.9:1 with white |
| cyan wash | `--blue-wash` | `#d8e9f4` | selected/structured regions |
| red pencil | `--red` | `#a5362b` | risks and destructive annotation |
| green stamp | `--green` | `#276544` | completed state |
| amber flag | `--amber` | `#8b5a06` | incomplete/offline notice |
| rule | `--rule` | `#98aec0` | borders and grid lines |

No gradients. Surface depth comes from hard 1 px drafting rules and small offset shadows (`4px 4px 0 rgba(20,90,163,.14)`), like stacked tracing sheets.

## Typography

- Interface and prose: `Arial`, `Helvetica Neue`, system sans-serif. It is neutral, fast, and already present; no runtime font request.
- Labels, numeric fields, measures, tempo, and status: `ui-monospace`, `SFMono-Regular`, `Cascadia Mono`, `Consolas`, monospace. Tabular figures read like drafting specifications.
- Scale: 12/14 px overlines, 16 px body minimum, 20 px section headings, fluid 32–52 px h1. Body leading is 1.55 and prose stays below 68 characters.

## Spacing and layout

The base unit is 4 px, with primary spacing at 8, 12, 16, 24, 32, 48, and 64 px. Controls are at least 44 px high with 8 px between targets. Desktop uses a 12-column drafting board: an 8-column cue register beside a 4-column inspector. On phones (390 px), the inspector becomes an in-flow editor and secondary description is shortened; the cue order, status, and primary action remain visible.

Cards are reserved for independent cue sections. The page shell and form groups use proximity and rules rather than nested rounded containers. Corners are 0–8 px, never pill-shaped except compact status marks.

## Interaction grammar

- The main route is **name sheet → add cue → specify pass/players/risk/tempo → mark rehearsed → print/share**.
- Adding a cue creates one numbered drafting block and moves focus to its section label.
- Reordering uses labeled up/down controls and keyboard-friendly buttons; order numbers visibly update.
- Saving is immediate to IndexedDB. A small `SAVED LOCALLY` stamp confirms persistence; failures retain the form in memory and explain the recovery action.
- Delete requires a cue-specific confirmation and offers an undo toast.
- The print preview is the same semantic cue register with editing chrome removed, not a separate representation.
- Free includes full cue building, JSON/CSV ownership export, import, offline use, and printing up to six cues. A one-time **Conductor unlock ($12)** removes the print limit and adds a condensed ensemble print layout. Accessibility and data ownership are never gated.

## Motion

State changes use 180 ms opacity/transform transitions: a new cue settles downward by 6 px from its insertion point; stamps appear with a subtle 2° rotation; toasts rise 8 px from the bottom. Nothing loops. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling are disabled and all state changes are instant.

## Original asset plan and provenance

### Hero illustration

One generated editorial still-life makes the blueprint metaphor concrete without implying score storage: a top-down drafting desk with a blank cue-planning sheet, movable section tabs, pencil, metronome, and instrument-case details. It contains no readable text, brands, people, notation, or logos. The interface itself remains code-native; icons and registration marks are hand-authored SVG/CSS.

Prompt sheet:

- **Subject:** an ensemble rehearsal-planning card on a drafting table, metronome, pencil, removable colored cue tabs, corners of instrument cases
- **World/materials:** warm ivory drafting paper, cobalt ink construction lines, brushed metal ruler, graphite and red pencil marks, tactile paper grain
- **Light/lens:** overhead editorial still life, soft north-window light, crisp but natural shadows, 50 mm equivalent
- **Palette words:** warm paper, blueprint cobalt, faded cyan, restrained red pencil, dark navy
- **Negative list:** no people, hands, faces, readable text, musical notation, sheet music, logos, brands, watermarks, gradients, neon, glossy 3D UI, fake app screens

Generation prompt:

> Use case: stylized-concept. Asset type: responsive landing-page editorial illustration. A top-down ensemble rehearsal planning still life on warm ivory drafting paper: a blank structured cue-planning card with cobalt construction lines and small empty check boxes, a mechanical metronome, graphite pencil and red marking pencil, brushed metal ruler, removable faded-cyan and red section tabs, and subtle corners of well-worn instrument cases. Arrange the objects as a precise working desk with clear negative space and a strong diagonal rhythm. Editorial mixed-media photography with a lightly screen-printed blueprint texture, soft north-window light, crisp natural shadows, 50 mm equivalent. Warm paper, blueprint cobalt, faded cyan, restrained red pencil, dark navy. No people, no hands, no faces, no readable text, no letters, no numbers, no musical notation, no sheet music, no logos, no brands, no watermark, no gradients, no neon, no glossy 3D UI, no fake app screen.

Generated through the factory Azure image deployment (`factory-image`) on 2026-08-27. The selected original and its prompt sidecar live in `assets/src/`; optimized WebP derivatives and a JPEG fallback live in `public/assets/`. Generated imagery is original to this product and is disclosed in the footer.

### Code-native marks

The app mark is a hand-authored SVG composed of a drafting registration cross, a section bracket, and three pass lines. Rasterized 192 and 512 px maskable PWA icons reuse that geometry with the paper/cobalt palette. License: MIT with the application source.

## Print treatment

Print is black on white with 11 pt type, solid rules, explicit check/status words, no background grid, buttons, notices, illustration, or navigation. Each cue avoids breaking across pages. The sheet title, last-updated date, completion count, and a compact field legend appear on every printable artifact.
