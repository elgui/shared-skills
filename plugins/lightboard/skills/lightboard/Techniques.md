# Techniques

How a Lightboard lesson moves, and when it should not. `Doctrine.md` says why; this says how.
The engine descends from ProposalScroll's, a sibling skill for scroll-driven sales pages (not published):
its actor grammar and clock-driven flows are ported as they were; the walkthrough, the component
bridge (`data-set`), flat mode and the lesson chrome are new.

---

## 1. Which block for which teaching move

**The rule: the least motion that carries the idea.** Most of a lesson is static.

| The teaching move is… | Block | Example |
|---|---|---|
| a fact, a list, a table, a comparison of many things | **static** figure, table or list | the dozen effects worth knowing; the gear list |
| a gesture or button combination **with an order** | **walkthrough** over the gear's component, stepping `hold` / `lit` / `order` | the effect grab: hold VALUE, then hold DELAY, then let go (SP-404 pad 4) |
| a signal, data or material path, taught stage by stage | **walkthrough** over a chain or routing component, lighting one stage per step | the bus plumbing: three roads, the bus you edit, the two master buses, the input (pad 4) |
| a parameter swept through its range, each value heard differently | **walkthrough** over a component whose value attribute changes per step | a loop shortened until it stops being rhythm and becomes pitch |
| a pattern or structure built up piece by piece | **walkthrough** adding one row or part per step | a groove: kick, then the off-beat hat, then the one thrown chord |
| the same thing in two states, which the reader compares | **compare**: two buttons flip one figure | vinyl mode on and off; a bus bypassed and engaged |
| something that travels, and the point is where it goes or where it stops | **flow**: tokens moving along a path, in a static figure or inside a walkthrough | audio against MIDI on a rig drawing; where a feedback loop closes |
| a setup that is one possibility, not the learner's own | static, with an **EXAMPLE** band | one possible bus routing of a kit |
| a checklist or ritual the learner performs | an ordered list **inside an exercise** | the power-on order at soundcheck |
| the closing game | **encore** widgets: `.timer`, `.dare` | effect roulette in rounds; the dare drawer |

**Anti-uses, each a real temptation:**

- A walkthrough for a list. Six steps that each add a bullet is a slideshow; the table reads in two
  seconds and is re-findable.
- A walkthrough whose steps do not change the figure. That is prose next to a picture: write it as
  prose (the pad 4 MFX sentence stayed a paragraph under the plumbing walkthrough for this reason).
- A walkthrough over a routing that differs per learner, as if it were theirs. Use the EXAMPLE band.
- A flow on a structure nothing moves through.
- Anything on a clock: autoplay, a play button, a timed reveal. The reader sets the pace. (The
  encore timer is the exception because the learner starts it and the game is about time.)

---

## 2. The walkthrough

```html
<section class="walk" id="grab" aria-label="The effect grab, step by step">   <!-- id required -->
  <figure class="walk-fig">
    <sp-panel zoom="upper" hold="value" lit="delay"
              data-set="0: hold=, lit=; 1: hold=value, lit=; 2: hold=value, lit=delay; 3: hold=, lit="></sp-panel>
    <figcaption>…the figure at rest, in one or two sentences… <a class="src" data-k="sp-value"></a></figcaption>
  </figure>
  <ol class="walk-steps">
    <li><h3>Hold the knob down</h3><p>…</p></li>
    <li><h3>Then hold an effect button</h3><p>…</p></li>
    <li><h3>Let go to drop it</h3><p>… <span class="check">…</span></p></li>
  </ol>
</section>
```

The figure comes first in the markup, so without JavaScript and in flat mode the block reads as an
ordinary figure followed by an ordinary numbered list.

**How it switches.** Step *k* takes over when its top crosses the switch line: on a wide screen
(≥ 860 px) level with the lower middle of the pinned figure (clamped to 30 to 60% of the viewport),
so the step sits beside the change it causes; on a phone a third of the way into the space left
under the pinned figure, so the change shows above the text that caused it. Before step 1 the
figure is at **beat 0**. The picture at beat *k* is a pure function of *k*: scrolling up, down or
jumping gives the same figure.

### Stepping a component: `data-set`

Any drawing component (a custom element that renders from its attributes, `kit.js` or a course's
`figures.js`) is stepped by changing its attributes:

```
data-set="1: lit=pads bus1 bus2 dry; 2: lit=bus1 bus2; 3: lit=pads; 4: lit=bus3 bus4 out"
```

- Keys are beat numbers; `;` separates keys; `,` separates attributes; a value runs to the next `,`
  or `;` (so values cannot contain either). An **empty value removes** the attribute.
- For beat *k*, each attribute takes its value from the latest key ≤ *k* that names it, else its
  authored value.
- **The authored attributes are the rest state**: what flat mode, print and a reader who never
  scrolls see. Beat 0 is the rest state unless a key `0:` says otherwise (the effect grab starts
  from a clean panel with `0: hold=, lit=`).
- Components built with `CSKit.define` re-render on attribute change. Older components that only
  render in `connectedCallback` (a retrofit's own drawings, like the SP-404 `gear.js`) are
  re-rendered by the engine calling it again.
- A re-rendered drawing cannot transition, so the figure gets a short settle (0.32 s fade-in)
  instead; none under reduced motion.
- Keys can also be **names**, for a compare (§3).

### Stepping hand-drawn SVG: the actor grammar

For a figure drawn inline, attributes on any element inside `.walk-fig`:

| Attribute | Means |
|---|---|
| `data-in="k"` | appears at beat *k* |
| `data-out="k"` | leaves at beat *k* (hidden without JS: the no-JS figure shows the final beat) |
| `data-ghost` | when not "in", stays faint instead of vanishing |
| `data-at="k:cls k2:cls2+cls3"` | from beat *k* the element carries `cls`; the latest step wins |
| `data-on="2-4"` | class `is-on` only during those beats |
| `data-draw` | the stroke draws in when visible (not on dashed lines: the draw uses the dash array) |

Write each element **in its final state** in `class`, so the page reads at its final beat without
JavaScript; `data-at` describes the journey (the runtime removes every class `data-at` mentions,
then adds the current one). Themed classes that follow the room's `--f-*` tokens: `f-bg`, `f-box`,
`f-line`, `f-dash`, `f-label`, `f-small`, `f-lit`, `f-alt`, `f-hazard`, `on-lit` (label on a lit
fill), `is-dim`, `flowline`. `examples/patterns/site/01-figures.html#switch` is a complete example.

### Rules

- **2 to 8 steps.** One step is a static figure; past eight the thread is lost, split it.
- **Every step changes one thing in the figure, and names it by its label**, not only by its
  state: "BUS 3 and BUS 4", "the three boxes in the middle column", never just "the lit one".
  Flat mode shows the figure at rest, where nothing is lit.
- **The figcaption describes the rest state** and carries no fact the steps or prose do not also
  carry: it is hidden while stepping (the active step is the caption) and shown in flat mode.
- **Steps are 25 to 60 words**, an `h3` of a few words. `check` warns past 80.
- **Flags and sources travel with their claims** into the steps.
- **Same drawing, same places.** Object constancy is what lets the eye compare beats. A change of
  zoom is a cut: do it only between two moves, and say so in the step.
- **One or two walkthroughs per lesson.**
- **Accessible name**: `aria-label` on the section; the component's own `aria-label` describes
  what is highlighted.

### Layout

- **Wide (≥ 860 px):** steps in the left column, the figure pinned in the right column under the
  rail. The steps start 12vh down so the first step arrives beside the figure.
- **Phone:** the figure pinned under the rail on the page colour, capped at 40svh (`--walk-fig-h`);
  the steps pass beneath it. A figure much wider than tall stays readable; a tall one (a full panel)
  shrinks: pick the zoom that holds only the controls the move needs.
- **The figure's height is reserved.** The engine renders every beat once, reserves the tallest
  height and computes the switch line from the pinned position (EngineNotes 1): a drawing that grows
  a chip list at one beat cannot make the page jump or the beat flip back.
- Per walkthrough, via `style` on the section: `--step-gap` (space after each step, 34vh wide /
  26svh phone), `--walk-tail` (after the last, 26vh / 20svh), `--walk-fig-h` (phone cap),
  `--walk-fig-h-wide` (desktop cap on the drawing; set it, e.g. `58vh`, for a figure taller than it is wide,
  EngineNotes 14).

---

## 3. Compare: two states the reader flips

```html
<div class="compare" data-for="modes" role="group" aria-label="Compare the two modes">
  <button data-state="step" aria-pressed="true">Step through</button>
  <button data-state="flat">Show all steps</button>
</div>
<figure id="modes">
  <svg …>
    <g data-when="step">…</g>
    <g data-when="flat" class="cs-when-alt">…</g>   <!-- cs-when-alt: hidden without JS -->
  </svg>
</figure>
```

- Elements without `data-when` are shared by both states; that shared part is what makes the
  difference land. `data-when` takes several state names separated by spaces; `data-ghost` works.
- A component in the figure switches with **named keys** in `data-set`: `data-set="dry: bus=; wet: bus=2"`.
- The first pressed button is the starting state; mark every other state's elements `cs-when-alt`
  so the no-JS figure shows only the first.
- **It never flips by itself.** Both states at the same scale.

## 4. Flow: something travels

```html
<path class="flowline" d="M150 150 V14" stroke="var(--f-ink)" stroke-opacity=".3" stroke-width="2" data-flow="n:4; speed:40"/>
```

Tokens are positioned from the clock alone, move only while the figure is on screen, and stand
still, evenly spaced, under reduced motion. Options: `n` (5), `speed` in user units per second
(60), `shape` `chevron` or `dot`, `size` (5), `stop` (fraction of the path where tokens fade: "it
stops here"), `offset` (0 to 1). A flow inside a `data-when` group or with `data-in` / `data-out`
follows it. Rules from ProposalScroll that hold here: two or three flows per figure at most, speed
40 to 80, the path faint and the tokens carrying the colour, the same speed on both sides of a
comparison, and the place tokens stop drawn and named. Flows live in hand-drawn SVG: a component
that re-renders would drop its tokens.

## 5. What each reader gets

| Reader | Walkthrough | Everything else |
|---|---|---|
| scrolling, motion allowed | pinned figure, one active step, the change settling in | tooltips, sources, rail, timer, progress |
| "Show all steps" (remembered per device) | figure at rest, plain list, rest caption shown | same |
| `prefers-reduced-motion` | flat by default (the button turns stepping on, switches are instant) | no settle, no flow motion, no lit pulse |
| no JavaScript | figure then plain list; hand-drawn SVG at its final beat | full text and flags; components and source marks do not render (EngineNotes 6) |
| print | flat | chrome hidden |

## 6. Chrome that comes free

All from `course.js`, driven by `window.COURSE` (`Anatomy.md`):

- **Masthead** (course title, phase), **pager** (previous and next lesson), **footer**.
- **The rail**: sticky, one line: the lesson number (links to the top), the current section by
  scroll-spy, one mark per exercise (room style, encore ringed, filled when done), each a link.
- **Exercise meta**: encore badge, room name, minutes, kind, a done box. Progress in
  `localStorage` under `COURSE.key`, every access in try/catch.
- **Lit lesson**: all exercises ticked lights the rail number, the lesson head and the board tile,
  and adds "Pad 4 is lit." (`words.lit`) to the checkpoint. The pulse plays only when the learner
  ticks the last box, never on load.
- **Tooltips** (`data-g`, hover, focus and tap), **source marks** (`a.src[data-k]`), the
  **sources page** list, the **board** and **meter** on the landing page.
- **Encore widgets**: `.dare[data-list='[…]']` (a draw button and an output; no immediate repeat)
  and `.timer[data-sec][data-rounds]` (start, stop, rounds; the display is the only thing that
  moves).

## 7. Drawing components

The SP-404 course's lesson: **one component per recurring visual**, rendering inline SVG from
attributes, so the panel is drawn once, looks the same everywhere, adapts to each room through
`--f-*` tokens, and can be stepped. `kit.js` gives the helper and two generic components.

```js
CSKit.define("x-panel", {
  attrs: ["lit", "hold", "order"],             // every attribute a walkthrough may step
  render: function (el, K) {                    // pure function of the attributes
    return { vb: "0 0 320 180", svg: "…", label: "aria label naming what is highlighted",
             legend: [[K.swatch("var(--f-lit)"), "press"]],   // only what this drawing uses
             after: "<ul>…</ul>" };                            // optional HTML under the svg
  }
});
```

The kit adds, from the element's own attributes: the **EXAMPLE band** (`example="…"`) and the
**legend band** from the returned items. Helpers: `K.T(x, y, text, {size, anchor, weight, fill})`,
`K.set(el, attr)`, `K.list(el, attr, sep)`, `K.pairs(el, attr)` (`"1:kick|2:snare"`), `K.swatch`,
`K.esc`, `K.words`.

| Component | Attributes | For |
|---|---|---|
| `<cs-keys>` | `keys="A|B|C"`, `cols`, `lit`, `hold`, `order`, `alt` (1-based indices) | any row or grid of controls; the SP-404 gesture vocabulary: amber press, ring = hold, numbered order, violet extras |
| `<cs-chain>` | `items="A|B|C"`, `cols` (wrap; 3 per row for phones), `lit`, `alt`, `note="2:…"` | a signal path, a recipe, a pipeline |

Writing a subject component: trace the layout from the maker's own diagram and say so in a
comment; list every attribute in `attrs`; keep `render` pure; return legend items only when used;
name highlighted controls in the aria label; use `--f-*` tokens for every colour; keep labels ≥ 7
user units and check them at 380 px, where a 320-unit-wide drawing is drawn at about 1.1×.
