# Examples

## patterns/ — the skill's own demo course

A complete two-lesson course whose subject is the Lightboard blocks themselves, so every claim
describes the runtime it runs on. It was scaffolded with `Course.ts new` and passes `check` with no
warning. It shows:

- a walkthrough over a kit component (`cs-chain` stepping the six stages of making a course);
- a walkthrough over hand-drawn SVG with the actor grammar (`data-in`, `data-out`, `data-at`);
- a compare with a flow inside one state;
- the EXAMPLE band on a subject component (`demo-dial` from the template's `figures.js`);
- both encore widgets (`.dare` and `.timer`), rooms named Draft and Try, flags, tooltips, sources;
- an identity derived from its own subject (the maker's bench), different from SP-404's with the
  same typeface.

Open `patterns/site/index.html`. Check it with `bun ../tools/Course.ts check patterns/site`.

## The real-lesson proof: SP-404 pad 4, outside the skill

A `scroll-proof/` copy of the SP-404 × Deluge course is the whole course moved onto this runtime,
with lesson 4 ("Colour") retrofitted: the bus plumbing and the effect grab are walkthroughs that
step the course's existing `bus-flow` and `sp-panel` drawings through `data-set`, and the encore
has a round timer. All 16 lessons pass `check`. The live course was not touched.

It lives in the learner's project, not here, because this skill is public and the
course carries the learner's gear, taste and own notes. `Retrofit.md` is the procedure it followed.
