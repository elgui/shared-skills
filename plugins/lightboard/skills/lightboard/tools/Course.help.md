# Course.ts

Scaffold, upgrade and check a Lightboard course. Bun; one dependency (playwright-core, for the
browser checks) installed with `cd <skill>/tools && bun install`. Chromium is
found under `~/.cache/ms-playwright/chromium-*`, or set `CS_CHROME`.

```bash
C=<skill>/tools/Course.ts
bun $C new     <project-dir> --title "…" [--lang en] [--unit Lesson] [--key slug.v1]
bun $C check   <project-dir>/site [--quick] [--pages a.html,b.html] [--accept-flag-drop]
bun $C upgrade <project-dir>/site
bun $C shot    <page.html> [--w 380] [--h 820] [--full] [--y 1200] [--reduced] [--nojs] [--out x.jpg]
```

## new

Creates `<project-dir>` with `intake.md`, `plan.md`, `deploy.sh` (from `~/.config/lightboard/deploy.sh`
or `$LIGHTBOARD_DEPLOY` when present, else the generic template), `.gitignore`, `research/` and
`site/` (landing, one lesson, sources, `assets/` with the runtime, a placeholder identity, a
figures skeleton, course data and the default face). `--key` is the localStorage key for progress
(default `<folder>.v1`); never change it once a learner has started. Refuses to overwrite a site.

## check

Writes `<project>/.check/` (report.txt, flags.json, shots/, index.html gallery). Exit 1 on any FAIL.

Static: course data loads and has title, key, lessons, rooms; every lesson file exists; runtime
files match the skill (WARN if not); identity is not the placeholder (WARN); no remote resource or
network call in any shipped file; every `data-g` and `data-k` resolves; unused sources (WARN);
source URLs are links; no `[[placeholder]]` (FAIL) or `RULE` comment (WARN) left.

Flag ledger: counts `class="check"` per page; FAIL if any page has fewer than on the last run,
until re-run with `--accept-flag-drop` (after recording the confirming source in research).

Browser, every page, at 380 × 820 and 1280 × 860: boot, no console error, no request that is not a
local file, no horizontal scroll at 380 px (with the offending elements), text under 11 px (WARN,
source marks excepted); lesson structure (one idea, room class, `data-min` and `.win` on every
exercise, one encore and it is last, checkpoint after it, no missing tooltip or source); every
walkthrough: 2 to 8 steps, `data-set` keys within range, something in the figure changes, and at
both sizes every beat is reached, holds after a wait, keeps the figure on screen and the active
step visible, with a snapshot per beat; landing board has a tile per lesson; sources page lists
every source. Then: walkthroughs start flat under reduced motion; without JavaScript the text,
steps, exercises and success lines are visible. Full-page snapshots at both sizes and a no-JS one.

`--quick`: phone size only, no reduced-motion or no-JS pass. `--pages`: only those files.

## upgrade

Copies the five runtime files from the skill into `<site>/assets/`, printing same / updated /
added. Run `check` after: a runtime change can change layout.

## shot

One screenshot of one page, for a quick look. `--y` scrolls first; `--full` takes the full page.
