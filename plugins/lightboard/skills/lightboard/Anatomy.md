# Anatomy

The files of a course and the contracts between them. `Course.ts new` produces all of it;
`Course.ts check` verifies most of it.

## 1. The folder

```
<project>/
  intake.md            the learner, the gear, the two rooms (workflows/Intake.md)
  research/            sourced notes, one file per topic, plus 99-review.md from the fact-check
  plan.md              lessons, components, walkthrough beat tables (workflows/Plan.md)
  deploy.sh            optional publish script, yours to fill (workflows/Publish.md)
  .check/              check reports, snapshots, flags.json (git-ignored)
  site/                THE COURSE: publish this folder, nothing above it
    index.html         landing: hero, board, meter, the two rooms, phases, house rules
    01-slug.html …     one file per lesson, named in COURSE.lessons
    sources.html       how facts were checked + every reference (#source-list)
    assets/
      course.js  course.css  scroll.js  scroll.css  kit.js     RUNTIME: copied, never edited
      course-data.js   window.COURSE: lessons, rooms, words, glossary, sources
      identity.css     the look (Identity.md)
      figures.js       the subject's drawing components
      fonts/           the self-hosted face and its licence
```

**Runtime files are never edited in a course.** A fix goes into the skill's `runtime/`, then
`Course.ts upgrade <site>` copies it into every course that wants it; `check` warns when a
course's runtime differs from the skill's.

**No build step.** Every page is hand-written HTML that links the assets. There is nothing to
compile, and a page opened from disk works.

## 2. The head block

Order matters: data first, then the drawing kit, then the subject's drawings, then the chrome,
then the engine. All deferred; all local.

```html
<script>document.documentElement.classList.add("js")</script>   <!-- before first paint: no layout jump -->
<link rel="stylesheet" href="assets/course.css">
<link rel="stylesheet" href="assets/scroll.css">
<link rel="stylesheet" href="assets/identity.css">              <!-- last: the look overrides -->
<script src="assets/course-data.js" defer></script>
<script src="assets/kit.js" defer></script>
<script src="assets/figures.js" defer></script>
<script src="assets/course.js" defer></script>
<script src="assets/scroll.js" defer></script>                  <!-- only on pages with walkthroughs, compares or flows -->
```

## 3. `window.COURSE` (assets/course-data.js)

```js
window.COURSE = {
  title: "SP-404 × Deluge",       // masthead
  landing: "Sixteen pads",         // masthead subtitle on the landing page
  key: "sp404course.v1",          // localStorage key for progress: unique per course, NEVER changed later
  unit: "Pad",                     // what a lesson is called: "Pad 4", "Lesson 4"
  lessons: [{ n: 4, f: "04-colour.html", t: "Colour", d: "Buses and the effects that matter for dub", p: 1 }, …],
  phases: { 1: ["Phase 1", "The SP-404 on its own"], … },
  board: { rows: [[1, [1,2,3,4,5,6,7,8]], [2, [9,10,11,12]]], cols: 4 },   // optional
  rooms: { lab: { name: "Lab" }, stage: { name: "Stage" } },              // the learner's own
  words: { … },                    // every interface string; translate for another language
  glossary: { bus: ["Bus", "One of the SP's effect paths. …"], … },
  sources: { "sp-bus": ["Roland manual — Adding effects to a sample (BUS FX)", "https://…"], … }
};
```

- **`key`**: every course served from the same origin shares one `localStorage`. Two courses with
  the same key share progress. `new` derives it from the folder name; keep it forever once a
  learner has started (the SP-404 retrofit kept `sp404course.v1` so ticked exercises survive).
- **`rooms`**: keys are the classes exercises carry; `name` is the tag. The success lead-in per
  room is CSS (`--win-label` in identity.css), so it works without JavaScript.
- **`words`**: defaults are English, listed in full in the template's `course-data.js`. `lit` and
  `round` take `{unit}`, `{n}`, `{i}` placeholders; `words.kit` feeds the drawing kit.
- **`glossary`**: `[title, reminder]`. **`sources`**: `[what it is, URL]`; a local file (the
  learner's own note, as `usage.txt`) is allowed.

## 4. Markup contracts

### Lesson

```html
<main class="wrap">
<div class="lesson-head"><div class="num">4</div><h1>Colour</h1><p class="sub">…</p></div>
<p class="idea">…</p>                                     <!-- exactly one -->
<h2>…</h2> … figures, tables, walkthroughs …
<section class="ex lab" data-min="10">…<p class="win">…</p></section>
<section class="ex stage" data-min="15" data-kind="the throw">…</section>
<section class="ex stage encore" data-min="10" data-kind="effect roulette">…</section>   <!-- last, only one -->
<section class="checkpoint"><h2>Before pad 5</h2><ul>…</ul></section>
</main>
```

The runtime inserts the masthead, the rail, each exercise's meta row, the pager and the footer.
`.padno` is accepted for `.num` (the SP-404 markup).

### Inline conventions

| Markup | Renders | Rule |
|---|---|---|
| `<span class="tip" data-g="bus">BUS 1</span>` | dotted word, reminder on hover, focus or tap | key must exist in `glossary` |
| `<a class="src" data-k="sp-bus"></a>` | a small "source" link | key must exist in `sources`; one per claim |
| `<span class="check">…: check at the machine</span>` | red dashed flag | never removed silently (Doctrine §6) |
| `<kbd>REC</kbd>`, `<kbd class="sh">CHOP</kbd>` | a control as printed; a shifted function | the style is the identity's; state the convention in the house rules |
| `<ul class="chain"><li>…</li></ul>` | stages with connectors, wraps at 380 px | for short paths in prose |
| `<div class="scroll"><table>…</table></div>` | a table that scrolls sideways inside itself at 380 px | wide tables only |
| `<figure class="narrow">`, `.wide`, `<div class="pair">` | figure widths; two figures side by side | pairs stack below ~560 px |

### Blocks that move

Walkthrough, compare and flow markup: `Techniques.md` §2 to §4. Encore widgets:

```html
<div class="dare" data-list='["No kick for the first 32 bars.", "…"]'><output>Press the button.</output><button type="button">Draw a dare</button></div>
<div class="timer" data-sec="120" data-rounds="3"></div>
```

`#dare` (the SP-404 markup) is accepted. Both widgets are hidden without JavaScript; the exercise
text must say the rule of the game on its own.

## 5. Progress

- Stored as one JSON object under `COURSE.key`: `"<lesson n>-<exercise index>": 1` for each ticked
  exercise, and `_count<n>` (how many exercises lesson *n* has, written when the lesson is opened)
  so the board can show 3/5 without loading every page.
- The exercise id is its **position**: inserting an exercise above others shifts the ids of those
  below it, so learners' ticks move. To insert without that, give the new exercise an explicit
  `data-id="4-new"`, or append it before the encore and accept the shift of the encore only.
- The flat-mode preference is a separate key, `coursescroll.flat`, shared by every course on the
  origin (it is a reader preference, not course progress).
- Every access is wrapped in try/catch: in a private window progress simply does not persist.

## 6. Drawing components

`Techniques.md` §7. One custom element per recurring visual in `figures.js`, using `CSKit.define`;
the kit's `<cs-keys>` and `<cs-chain>` are always available. A retrofit may keep its own drawing
file (the SP-404 `gear.js`) as long as it loads before `course.js` and `scroll.js`.
