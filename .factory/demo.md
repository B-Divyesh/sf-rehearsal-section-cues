# Demo sandbox

Open <https://rehearsal-section-cues.sociobot.in/demo> or use `/demo` from a local preview.

The demo opens a populated **Thursday trio rehearsal** with four realistic cues: opening groove, bridge pickup, solo handoff, and final tag. Every cue has a reference, repeat, active players, technical risk, tempo target, and rehearsal state.

The persistent demo banner says that sample changes do not affect the real plan. **Reset demo** restores the shipped sample. **Start for real** clears the demo namespace and opens the empty real cue sheet.

Demo data is stored only in IndexedDB database `demo:rehearsal-section-cues`. Real user data is stored separately in `rehearsal-section-cues`. The application never reads or writes the real database while `/demo` is active.

The claim suite starts every claim from `/demo`. Its isolation test first makes a real plan, edits and resets the demo, then returns to prove that the real plan is unchanged.
