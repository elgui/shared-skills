---
name: lightboard
description: Builds a multi-page, hands-on course as static HTML for one learner on one subject - a piece of gear, an instrument, a device, a software tool, a craft, or anything learned by doing - a landing board whose lessons light up as exercises get done; lessons with one loud idea, figures drawn by reusable components, walkthroughs where a pinned figure changes as the reader scrolls numbered steps, exercises tagged with the learner's own two practice rooms with observable success conditions, and a closing game. Every claim sourced, unconfirmed ones flagged and never silently unflagged; offline, 380 px, reduced-motion safe. USE WHEN the user wants to learn or teach a subject, instrument, device, software or craft through a course, lessons, a curriculum or a tutorial series, OR wants another course like one already built for other gear or another learner, OR wants scroll-driven step-by-step figures in teaching pages, OR wants to retrofit, fact-check or publish an HTML course. Not a sales or persuasion page, not language-lesson slides.
---

# Lightboard

A Lightboard course is a folder of static pages that teach **one learner** a subject on **their
own gear**: a landing board, N lessons, a sources page. It borrows the craft of scroll-driven
explainer pages (figures that hold still while the explaining text scrolls past them, least motion
that carries the idea) and points it at learning instead of persuasion. The reference instance is an SP-404 × Deluge
course (a sampler and a groovebox), built by hand before this skill existed; the skill is what that
course proved, generalized.

Every lesson has the same spine:

| Part | What it is | Why |
|---|---|---|
| **Idea** | one loud paragraph: the mental model that makes the rest obvious | an expert learns a model, not a list |
| **Sections and figures** | prose, tables, drawings by components; a **walkthrough** only where the idea has an order | a figure that builds step by step is segmenting under the reader's control |
| **Exercises** | tagged with the learner's own two rooms, honest minutes, a success condition you can hear or see | hands-on, and you know when it worked |
| **Encore** | the last exercise: short, a game, played rather than prepared | the part to play even on a day the rest is skipped |
| **Checkpoint** | two or three capabilities; the lesson's tile lights when every exercise is ticked | progress you can see from the board |

## Workflow Routing

When running a workflow, announce it:
```
Running the **WorkflowName** workflow from the **Lightboard** skill...
```
Each workflow's Step 0 also calls an observability hook (`~/.claude/Tools/SkillWorkflowNotification`)
if one is installed; without it the line is a no-op.

| Workflow | Trigger | File |
|---|---|---|
| **Intake** | **always first** for a new course: subject, gear, learner, their two rooms, their own material | `workflows/Intake.md` |
| **Research** | intake settled; gather sourced notes before any lesson is planned | `workflows/Research.md` |
| **Plan** | research done; lessons, figures, walkthroughs, exercises, encores, for the learner to review | `workflows/Plan.md` |
| **Build** | plan agreed; identity, data, drawings, pages, check | `workflows/Build.md` |
| **FactCheck** | a built course, before anyone relies on it; "fact-check", "review the course", "is this accurate" | `workflows/FactCheck.md` |
| **Retrofit** | an existing HTML course (the SP-404 one or any other) moves onto this runtime, or gets walkthroughs | `workflows/Retrofit.md` |
| **Publish** | "publish", "put it online", "share it", "deploy the course" - optional, through the project's `deploy.sh` | `workflows/Publish.md` |

**Intake is blocking.** A course built on a guessed learner teaches the wrong person: it lectures
basics to an expert, or skips the one thing they lack. **Build waits for the plan to be agreed.**
**FactCheck runs on every new course** before it is called finished.

## The rules that most often decide a course

Full list with reasons in `Doctrine.md`. The ones that fire most:

- **The learner is an expert in adjacent things.** Never lecture basics; glossary tooltips are
  reminders. Their taste picks the examples.
- **The two rooms come from the learner** (the SP-404 course: *Lab* = prepare, ends with something
  saved; *Stage* = play, ends with something heard). Ask for them; never hard-code Lab/Stage.
- **Every exercise ends on something observable**: "You will hear it when…". No success condition,
  no exercise.
- **Every operational claim links a source; anything unconfirmed gets a red `check` flag, and a
  flag follows its claim.** It never goes to make a page cleaner, only when a source or a test on
  the real thing confirms it, recorded in `research/`. `Course.ts check` keeps a ledger and fails
  when a flag disappears without that.
- **A drawing of a setup that is not the learner's own is marked EXAMPLE.** Every highlighted
  element is named in its caption.
- **Motion only where the idea has an order**, one or two walkthroughs per lesson. Steps stay a real,
  readable list; "Show all steps" is one click away and the default under reduced motion.
- **One component per recurring visual**, never a hand-drawn panel per page.
- **Offline, no build step, 380 px.** No external resource of any kind.

## Commands

`<skill>` below is this skill's own directory, the base directory Claude Code shows when the skill
loads (under `~/.claude/plugins/…` for a plugin install, `~/.claude/skills/lightboard` for a manual
one).

```bash
C=<skill>/tools/Course.ts
bun $C new     <project-dir> --title "…" [--lang en] [--unit Lesson] [--key slug.v1]
bun $C check   <project-dir>/site [--quick] [--pages 04-x.html] [--accept-flag-drop]
bun $C upgrade <project-dir>/site          # recopy the runtime after the skill changes
bun $C shot    <page.html> [--w 380] [--full] [--y 1200] [--out x.jpg]
```

**First use on a machine:** `cd <skill>/tools && bun install` (one dependency, `playwright-core`),
and a Chromium for the checks: `bunx playwright install chromium`, or point `CS_CHROME` at one.
If `tools/node_modules` is missing, do this before anything else and tell the user once.

`check` proves the contracts (structure of every lesson, glossary and source keys, zero network,
no horizontal scroll at 380 px, every beat of every walkthrough switching and holding at phone and
desktop sizes, flat under reduced motion, text readable without JavaScript, the flag ledger) and
writes snapshots plus a gallery to `<project>/.check/`. **Look at them.** Details:
`tools/Course.help.md`.

## Reference documentation

| Document | Read it when |
|---|---|
| `Doctrine.md` | **before planning.** The learner, the rooms, the lesson contract, encores, accuracy, the advisory pass |
| `Techniques.md` | **before drawing.** Which block for which teaching move, the walkthrough grammar, compare, flow, layout |
| `Anatomy.md` | **before writing a page.** Folder layout, the head block, `window.COURSE`, markup contracts, progress keys |
| `Identity.md` | deriving the course's look from its subject; the tokens `identity.css` must define |
| `EngineNotes.md` | **before touching `runtime/` or `tools/`.** Every bug that cost time, with its cause |
| `LessonsLearned.md` | **after the learner has used a course.** What landed, what did not, what to fold back |
| `examples/patterns/` | a complete two-lesson course whose subject is the blocks themselves |
| `examples/README.md` | where the real-lesson proof (SP-404 pad 4, retrofitted) lives and why it is outside the skill |

## Examples

**Example 1: a new course on new gear**
```
User: "Make me a course on my new Fujifilm X-T5 for my dad. He shot film for thirty years."
→ Intake: deduces what it can, then asks in one round: his expertise, the body, lenses and firmware,
  his own two room names, his notes to fold in, lesson count, publish or not
→ Research: sourced notes in research/, a list of what could not be confirmed
→ Plan: lessons with one idea each, components, one or two walkthroughs each, encores; reviewed
→ Build: new → identity from the camera's own dials → pages → check at 380 px and desktop
→ FactCheck: independent readers against research/; fixes; flags stay
```

**Example 2: scroll figures in an existing course**
```
User: "Lesson 4 of the SP course is confusing, can the button moves build up as I scroll?"
→ Retrofit on a copy: runtime moved in, the two moves become walkthroughs over sp-panel via
  data-set, no claim added, flags carried along; check passes; live course untouched until yes
```

**Example 3: publish**
```
User: "Put the X-T5 course online for him."
→ Publish: check passes first, the project's deploy.sh, an unauthenticated request
  answered 401 (not public), link reported
```
