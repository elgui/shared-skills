# Engine notes

Read before touching `runtime/` or `tools/`. Each entry says what broke, why, and what now guards
it. Add one whenever a bug costs more than twenty minutes. The engine's
actors, flows and IO timing were inherited from ProposalScroll, an unpublished sibling skill; the
lessons from those parts are folded into the entries below.

## The invariants

- **The picture at beat k is a pure function of k.** `Walk.paint(k)` recomputes every actor class
  and every component attribute from the markup. Nothing depends on the previous beat.
- **Nothing is hidden from a reader who does not scroll smoothly.** Steps are an `<ol>` at full
  legibility; flat mode exists on every walkthrough.
- **Runtime files are identical in every course.** Subject code lives in `course-data.js`,
  `identity.css`, `figures.js`.

## 1. The beat flip-flopped because the figure changed height (2026-09-23)

**Symptom:** `goto(3)` landed on beat 3, then settled on beat 2 half a second later; on a phone the
steps below the pinned figure jumped.
**Cause:** the SP-404 `sp-panel` lists what it highlights as chips under the drawing, so the
figure's height differed per beat. The phone switch line was computed from the figure's live
bottom edge, and the wide-screen line from its live height: a shorter figure at beat 3 moved the
line above step 3, which dropped the beat to 2, which made the figure taller again. A feedback
loop, and on a phone the in-flow figure also pushed the steps up and down.
**Fix:** `Walk.measure()` renders every beat (and the rest state) once, in the stepping layout,
reserves the tallest height as `min-height`, and `threshold()` uses that reserved height at the
pinned position, never the live rectangle. Re-measured on width change only (not when a phone's
toolbar shows or hides).
**Guard:** `check` runs every beat at both sizes, waits, and fails if the beat it lands on is not
the beat it settles on ("landed on 3, settled on 2").

## 2. The active step sat far below the figure on desktop

**Symptom:** at 1280 × 860 the active step was about 450 px under the pinned figure: the eye had to
travel between the text and the change.
**Cause:** a fixed switch line at 55% of the viewport, inherited from the proposal engine where
cards ride over the figure.
**Fix:** on wide screens the line sits at the pinned figure's top plus 60% of its reserved height,
clamped to 30 to 60% of the viewport.

## 3. The rest caption contradicted the figure while stepping

**Symptom:** at step 1 of the effect grab, the caption under the figure said "then hold DELAY"
while DELAY was not lit yet.
**Cause:** the figcaption describes the rest state; during stepping the figure is not at rest.
**Fix:** `.js .walk:not(.flat) .walk-fig figcaption { display: none }`. The active step is the
caption; the rest caption returns in flat mode, print and without JS. Doctrine consequence: a rest
caption must not carry a fact the steps or prose do not also carry.

## 4. The active-step rule ran down the whole spacer

**Cause:** step spacing was `min-height` on the `li`, and the rule is the `li`'s `::after`.
**Fix:** spacing is `padding-bottom: var(--step-gap)`; the rule stops at `bottom: calc(var(--step-gap) + .2rem)`.

## 5. Stepping components that were not written for it

A retrofit's drawings (the SP-404 `gear.js`) render only in `connectedCallback` and declare no
`observedAttributes`, so changing an attribute changed nothing. `Setter.apply` re-invokes
`connectedCallback` (or `render()` if present) after changing attributes, for any element not
built by `CSKit.define` (those carry `__csKit` and re-render themselves). This relies on
`connectedCallback` rebuilding `innerHTML` from scratch, which `gear.js` does; a component that
appends instead would duplicate itself.

## 6. Without JavaScript, drawings and source marks are gone

Components are custom elements rendered by script, and `a.src` links get their `href` and text
from `COURSE.sources` at runtime. With scripts off (a file previewed inside a chat or mail app),
a lesson is its full text, its flags and its step lists, but no drawings and no source links.
Accepted: a course is used in a browser at the machine, and a build step to pre-render would break
the no-build rule. Hand-drawn SVG does render, at its final beat (`data-out` hidden by CSS; final
classes authored in `class`). `check` asserts the text, the steps, the exercises and the success
lines are all visible with JavaScript off.

## 7. A figure that re-renders cannot transition

Setting attributes on a component replaces its SVG, so CSS transitions have nothing to animate.
The figure gets `cs-swap` (a 0.32 s fade from 45%) instead, restarted by removing the class and
forcing a reflow. Not on the first paint (`beat !== -1`), not under reduced motion.

## 8. `attributeChangedCallback` fires once per attribute

A beat that changes `hold` and `lit` re-renders a kit component twice. No visible cost with the
drawings so far (not measured); if a component becomes expensive, batch in `render` with a
microtask.

## 9. The check counted the rail's marks as encores

**Symptom:** every lesson failed "more than one .encore".
**Cause:** the rail's exercise marks carry `.encore` too. **Fix:** the probe counts `.ex.encore`.
Any structure probe must scope to `.ex`, never to a bare class the chrome may reuse.

## 10. The lesson number stretched across the phone

`.lesson-head` becomes one column under 34rem and grid items stretch; with `min-width` instead of
a fixed width, the number box filled the row. `justify-self: start`.

## 11. Board titles broke mid-word at 380 px

`overflow-wrap: anywhere` broke "Soundcheck" as "Soundche ck". Tiles use `overflow-wrap:
break-word; hyphens: auto` (the page's `lang` drives hyphenation).

## 12. One origin, one localStorage

Courses published under the same origin (e.g. `example.org/courses/<slug>/`) share
`localStorage`. Progress is namespaced by `COURSE.key`, which must be unique per course and never
change. The flat preference (`coursescroll.flat`) is shared on purpose.

## 13. Tooling

- Some `grep`s (ugrep, ripgrep) skip git-ignored files silently. Research notes are often
  git-ignored, so prove an absence with a plain walk instead:
  `python3 -c "import pathlib,sys; [print(p) for p in pathlib.Path('.').rglob('*') if p.is_file() and sys.argv[1] in p.read_text(errors='ignore')]" 'needle'`.
- Chromium for `check` is found under `~/.cache/ms-playwright/chromium-*`; override with `CS_CHROME`.
  One browser per command: a second launch in one Bun process was unreliable.

## 14. A tall figure is not on screen at beat 1 on desktop

**Symptom:** `check` FAIL "beat 1: figure not fully on screen (306..913 of 860)" on desktop only,
for a panel drawing taller than it is wide (SP-404 v2's `zoom="work"` with an EXAMPLE band and a
two-row legend, 2026-09-23). Phone passed.
**Cause:** on desktop the drawing may grow to `100vh - rail - 120px`, but at beat 1 the figure is not
yet stuck: step 1 sits at the switch line (at most 60% down) after the steps' 12vh top padding, so
the figure starts about a third of the way down and a figure over roughly 55vh runs off the bottom.
**Fix:** an opt-in cap, `--walk-fig-h-wide`, on the section's `style` (e.g. `58vh`), mirroring the
phone's `--walk-fig-h`. Default unchanged so existing courses keep their layout.

## Driving a page from a test

`window.CS`: `ready`, `reduced`, `walks[]` (each: `id`, `n`, `beat`, `flat`, `figH`, `el`, `fig`,
`steps`, `goto(k)`, `set(k)`, `setFlat(bool)`, `measure()`), `compares[]` (`set(state)`), `flows[]`.
`html[data-cs-ready="1"]` once booted. Each walkthrough dispatches `cs:beat` (`detail: {beat, id,
flat}`). `CSKit` is the drawing kit; `COURSE` the data.
